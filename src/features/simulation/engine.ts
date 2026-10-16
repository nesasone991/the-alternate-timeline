import {
  RESOURCE_KEYS,
  RESOURCE_LABELS,
  RESOURCE_MAX,
  RESOURCE_MIN,
  SIMULATION_SCHEMA_VERSION,
  type AlternateScenario,
  type AppliedEffect,
  type Choice,
  type ChoiceRecord,
  type ChoiceNarrative,
  type ConditionalEffect,
  type DecisionEvent,
  type Effect,
  type EndingRule,
  type PendingConsequence,
  type Requirement,
  type ResolvedConsequence,
  type ResolvedNarrative,
  type ResourceKey,
  type Resources,
  type ScenarioNode,
  type SimulationState,
  type StructuralConsequence,
} from '../../types/simulation';

/**
 * The decision engine: pure, deterministic functions over authored scenario data.
 *
 * - No randomness. The same scenario and the same choices always give the same state.
 * - No mutation. Every function returns new objects; inputs are never changed.
 * - A decision's effects (base and conditional) are SETTLED TOGETHER: one net
 *   change per resource, clamped to 0–100 once. Each consequence is settled the
 *   same way when it comes due.
 * - A cost that cannot be paid in full (the net change would take a resource
 *   below 0) is not silently absorbed: the scenario's shortfall rule turns the
 *   unpaid part into a visible structural consequence (see `settleEffects`).
 * - Nothing here touches actual-history data.
 */

export function clampResource(value: number): number {
  if (!Number.isFinite(value)) return RESOURCE_MIN;
  return Math.min(RESOURCE_MAX, Math.max(RESOURCE_MIN, Math.round(value)));
}

export function createInitialState(scenario: AlternateScenario): SimulationState {
  const start = getNode(scenario, scenario.startNodeId);
  if (!start) throw new Error(`Scenario ${scenario.id}: start node "${scenario.startNodeId}" not found.`);
  const resources = Object.fromEntries(
    RESOURCE_KEYS.map((key) => [key, clampResource(scenario.initialResources[key])]),
  ) as Record<ResourceKey, number>;
  return {
    schemaVersion: SIMULATION_SCHEMA_VERSION,
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    currentEventId: start.id,
    year: start.year,
    resources,
    flags: [],
    choicesMade: [],
    records: [],
    pending: [],
    resolved: [],
    eventLog: [],
    seed: 0,
  };
}

export function getNode(scenario: AlternateScenario, id: string): ScenarioNode | undefined {
  return scenario.nodes.find((node) => node.id === id);
}

export function getCurrentNode(scenario: AlternateScenario, state: SimulationState): ScenarioNode {
  const node = getNode(scenario, state.currentEventId);
  if (!node) throw new Error(`State points at unknown node "${state.currentEventId}".`);
  return node;
}

export function getCurrentDecision(scenario: AlternateScenario, state: SimulationState): DecisionEvent | undefined {
  const node = getCurrentNode(scenario, state);
  return node.kind === 'decision' ? node : undefined;
}

export type RequirementCheck = {
  readonly requirement: Requirement;
  readonly met: boolean;
  /** Plain-language description, e.g. "Legitimacy 20 or more (you have 30)". */
  readonly description: string;
};

export function checkRequirement(
  scenario: AlternateScenario,
  state: SimulationState,
  requirement: Requirement,
): RequirementCheck {
  if (requirement.resource !== undefined) {
    const have = state.resources[requirement.resource];
    const label = RESOURCE_LABELS[requirement.resource];
    if (requirement.below !== undefined) {
      return { requirement, met: have < requirement.below, description: `${label} below ${requirement.below} (you have ${have})` };
    }
    return { requirement, met: have >= requirement.min, description: `${label} ${requirement.min} or more (you have ${have})` };
  }
  if (requirement.flag !== undefined) {
    return {
      requirement,
      met: state.flags.includes(requirement.flag),
      description: `Requires an earlier decision: ${flagLabel(scenario, requirement.flag)}`,
    };
  }
  return {
    requirement,
    met: !state.flags.includes(requirement.notFlag),
    description: `Ruled out by an earlier decision: ${flagLabel(scenario, requirement.notFlag)}`,
  };
}

export type ChoiceEvaluation = {
  readonly choice: Choice;
  readonly available: boolean;
  readonly requirements: readonly RequirementCheck[];
  /** Conditional effects that WOULD apply if committed now, with their reasons. */
  readonly applicableConditionals: readonly ConditionalEffect[];
  /** Total change per resource if committed now (base + conditional), after clamping. */
  readonly projected: readonly AppliedEffect[];
  /** Costs that could not be paid in full if committed now, and what would make up for them. */
  readonly projectedStructural: readonly StructuralConsequence[];
};

export function evaluateChoices(scenario: AlternateScenario, state: SimulationState): ChoiceEvaluation[] {
  const decision = getCurrentDecision(scenario, state);
  if (!decision) return [];
  return decision.choices.map((choice) => {
    const requirements = (choice.prerequisites ?? []).map((req) => checkRequirement(scenario, state, req));
    const applicableConditionals = applicableConditionalEffects(scenario, state, choice);
    const settlement = settleEffects(scenario, state.resources, state.flags, immediateEffects(choice, applicableConditionals));
    return {
      choice,
      available: requirements.every((check) => check.met),
      requirements,
      applicableConditionals,
      projected: settlement.applied,
      projectedStructural: settlement.structural,
    };
  });
}

/** Conditional effects are judged against the state BEFORE the choice is applied. */
function applicableConditionalEffects(
  scenario: AlternateScenario,
  state: SimulationState,
  choice: Choice,
): ConditionalEffect[] {
  return (choice.conditionalEffects ?? []).filter((item) => checkRequirement(scenario, state, item.when).met);
}

/** Sums sequential changes per resource, keeping the first "before" and last "after". */
export function totalPerResource(effects: readonly AppliedEffect[]): AppliedEffect[] {
  const order: ResourceKey[] = [];
  const totals = new Map<ResourceKey, AppliedEffect>();
  for (const effect of effects) {
    const existing = totals.get(effect.resource);
    if (!existing) {
      order.push(effect.resource);
      totals.set(effect.resource, { ...effect });
    } else {
      totals.set(effect.resource, {
        resource: effect.resource,
        requested: existing.requested + effect.requested,
        applied: existing.applied + effect.applied,
        before: existing.before,
        after: effect.after,
      });
    }
  }
  return order.map((key) => totals.get(key)!);
}

function immediateEffects(choice: Choice, conditionals: readonly ConditionalEffect[]): Effect[] {
  return [...choice.effects, ...conditionals.flatMap((item) => item.effects)];
}

export type Settlement = {
  readonly resources: Resources;
  /** One entry per resource touched: the net change requested and what was applied. */
  readonly applied: AppliedEffect[];
  readonly structural: StructuralConsequence[];
  /** Flags set by structural consequences that were not set before. */
  readonly newFlags: string[];
};

/**
 * Settles a list of effects together: the net change per resource is applied
 * once and clamped to 0–100. If a net cost would take a resource below 0, the
 * unpaid part is a shortfall. Where the scenario has a shortfall rule for that
 * resource, half the shortfall (rounded up) falls on the rule's target resource
 * and the rule's flag is set — a structural consequence, recorded with its
 * reason. There is no further chain: if the target is also exhausted, the
 * transfer is itself capped at 0 and the record shows it.
 */
export function settleEffects(
  scenario: AlternateScenario,
  resources: Resources,
  flags: readonly string[],
  effects: readonly Effect[],
): Settlement {
  const order: ResourceKey[] = [];
  const net = new Map<ResourceKey, number>();
  for (const effect of effects) {
    if (!net.has(effect.resource)) order.push(effect.resource);
    net.set(effect.resource, (net.get(effect.resource) ?? 0) + effect.delta);
  }
  const next: Record<ResourceKey, number> = { ...resources };
  const applied: AppliedEffect[] = [];
  const unpaid = new Map<ResourceKey, number>();
  for (const key of order) {
    const requested = net.get(key) ?? 0;
    const before = next[key];
    const wanted = before + requested;
    const after = clampResource(wanted);
    next[key] = after;
    applied.push({ resource: key, requested, applied: after - before, before, after });
    if (wanted < RESOURCE_MIN) unpaid.set(key, RESOURCE_MIN - wanted);
  }
  const structural: StructuralConsequence[] = [];
  const newFlags: string[] = [];
  for (const key of RESOURCE_KEYS) {
    const amount = unpaid.get(key);
    if (!amount) continue;
    const rule = scenario.shortfallRules?.find((item) => item.resource === key);
    if (!rule) continue;
    const delta = -Math.ceil(amount / 2);
    const before = next[rule.transferTo];
    const after = clampResource(before + delta);
    next[rule.transferTo] = after;
    structural.push({
      resource: key,
      unpaid: amount,
      explanation: rule.explanation,
      transfer: { resource: rule.transferTo, requested: delta, applied: after - before, before, after },
      flag: rule.flag,
    });
    if (!flags.includes(rule.flag) && !newFlags.includes(rule.flag)) newFlags.push(rule.flag);
  }
  return { resources: next, applied, structural, newFlags };
}

/**
 * Resolves every pending consequence due at or before `year`, oldest first.
 * Each one's condition is checked against the state at that moment.
 */
function resolveDue(
  scenario: AlternateScenario,
  state: SimulationState,
  nodeId: string,
  year: number,
): SimulationState {
  const due = state.pending
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.dueYear <= year)
    .sort((a, b) => a.item.dueYear - b.item.dueYear || a.index - b.index)
    .map(({ item }) => item);
  if (due.length === 0) return state;

  let current = state;
  const resolved: ResolvedConsequence[] = [];
  for (const pending of due) {
    const definition = findConsequence(scenario, pending.consequenceId);
    if (!definition) throw new Error(`Unknown scheduled consequence "${pending.consequenceId}".`);
    const triggered = definition.condition ? checkRequirement(scenario, current, definition.condition).met : true;
    let applied: AppliedEffect[] = [];
    let structural: StructuralConsequence[] = [];
    if (triggered) {
      const result = settleEffects(scenario, current.resources, current.flags, definition.effects);
      applied = result.applied;
      structural = result.structural;
      current = { ...current, resources: result.resources, flags: [...current.flags, ...result.newFlags] };
    }
    resolved.push({
      ...pending,
      resolvedAtNodeId: nodeId,
      resolvedYear: year,
      triggered,
      explanation: triggered ? definition.explanation : (definition.lapsedExplanation ?? 'This did not come to pass.'),
      effects: applied,
      structural,
    });
  }
  const dueIds = new Set(due.map((item) => item.consequenceId));
  return {
    ...current,
    pending: current.pending.filter((item) => !dueIds.has(item.consequenceId)),
    resolved: [...current.resolved, ...resolved],
    eventLog: [
      ...current.eventLog,
      ...resolved.map((item) => `${item.resolvedYear}: ${item.explanation}`),
    ],
  };
}

export function findConsequence(scenario: AlternateScenario, consequenceId: string) {
  for (const node of scenario.nodes) {
    if (node.kind !== 'decision') continue;
    for (const choice of node.choices) {
      const found = choice.consequences?.find((item) => item.id === consequenceId);
      if (found) return found;
    }
  }
  return undefined;
}

/** Consequences that came due when the timeline arrived at the given node. */
export function consequencesResolvedAt(state: SimulationState, nodeId: string): ResolvedConsequence[] {
  return state.resolved.filter((item) => item.resolvedAtNodeId === nodeId);
}

export type ApplyResult =
  | { readonly ok: true; readonly state: SimulationState; readonly record: ChoiceRecord }
  | { readonly ok: false; readonly error: 'not-at-decision' | 'unknown-choice' | 'unavailable'; readonly message: string };

/** Commits a choice. Returns an error instead of throwing so the UI can explain it. */
export function applyChoice(scenario: AlternateScenario, state: SimulationState, choiceId: string): ApplyResult {
  const decision = getCurrentDecision(scenario, state);
  if (!decision) {
    return { ok: false, error: 'not-at-decision', message: 'There is no decision to make at this point.' };
  }
  const evaluation = evaluateChoices(scenario, state).find((item) => item.choice.id === choiceId);
  if (!evaluation) {
    return { ok: false, error: 'unknown-choice', message: `"${choiceId}" is not an option in ${decision.title}.` };
  }
  if (!evaluation.available) {
    const unmet = evaluation.requirements.filter((check) => !check.met).map((check) => check.description);
    return { ok: false, error: 'unavailable', message: `Not available: ${unmet.join('; ')}.` };
  }

  const { choice } = evaluation;
  const next = getNode(scenario, choice.nextEventId);
  if (!next) throw new Error(`Choice ${choice.id} leads to unknown node "${choice.nextEventId}".`);

  const immediate = settleEffects(
    scenario,
    state.resources,
    state.flags,
    immediateEffects(choice, evaluation.applicableConditionals),
  );
  const newFlags = (choice.flagsSet ?? []).filter((flag) => !state.flags.includes(flag));
  const scheduled: PendingConsequence[] = (choice.consequences ?? []).map((item) => ({
    consequenceId: item.id,
    sourceDecisionId: decision.id,
    sourceChoiceId: choice.id,
    dueYear: item.dueYear,
    hint: item.hint,
  }));
  const narrative = choice.narrative ? resolveNarrative(scenario, state, choice.narrative) : undefined;
  const record: ChoiceRecord = {
    decisionId: decision.id,
    choiceId: choice.id,
    year: decision.year,
    effects: immediate.applied,
    structural: immediate.structural,
    conditional: evaluation.applicableConditionals.map((item) => ({
      id: item.id,
      explanation: item.explanation,
      effects: item.effects,
    })),
    scheduled: scheduled.map((item) => item.consequenceId),
    flagsSet: newFlags,
    ...(narrative ? { narrative } : {}),
  };

  const committed: SimulationState = {
    ...state,
    currentEventId: next.id,
    year: next.year,
    resources: immediate.resources,
    flags: [...state.flags, ...newFlags, ...immediate.newFlags.filter((flag) => !newFlags.includes(flag))],
    choicesMade: [...state.choicesMade, choice.id],
    records: [...state.records, record],
    pending: [...state.pending, ...scheduled],
    eventLog: [...state.eventLog, `${decision.title}: ${choice.label}`],
  };

  // Arriving at the next point in time: anything now due takes effect (or lapses).
  const arrived = resolveDue(scenario, committed, next.id, next.year);
  if (next.kind !== 'terminal' || next.status !== 'ending') return { ok: true, record, state: arrived };

  // Arriving at an ending: classify it from the complete state, after everything due has resolved.
  const classification = classifyEnding(scenario, arrived);
  return {
    ok: true,
    record,
    state: classification
      ? { ...arrived, endingId: classification.endingId, endingRuleId: classification.ruleId }
      : { ...arrived, endingId: next.id },
  };
}

/**
 * Looming threats: consequences still pending (due after the current year) that
 * would do harm — at least one negative effect — and whose condition already
 * holds, so they would trigger if nothing changed.
 */
export function loomingThreats(scenario: AlternateScenario, state: SimulationState): PendingConsequence[] {
  return state.pending.filter((item) => {
    const definition = findConsequence(scenario, item.consequenceId);
    if (!definition || !definition.effects.some((effect) => effect.delta < 0)) return false;
    return definition.condition ? checkRequirement(scenario, state, definition.condition).met : true;
  });
}

export type EndingCheck = { readonly description: string; readonly met: boolean };
export type EndingRuleEvaluation = {
  readonly rule: EndingRule;
  readonly checks: readonly EndingCheck[];
  readonly matched: boolean;
};
export type EndingClassification = {
  readonly endingId: string;
  readonly ruleId: string;
  readonly looming: readonly PendingConsequence[];
  /** Every rule checked, in order, up to and including the one that matched. */
  readonly evaluated: readonly EndingRuleEvaluation[];
};

function describeEndingCondition(scenario: AlternateScenario, state: SimulationState, requirement: Requirement): EndingCheck {
  const check = checkRequirement(scenario, state, requirement);
  if (requirement.flag !== undefined) return { met: check.met, description: flagLabel(scenario, requirement.flag) };
  if (requirement.notFlag !== undefined) return { met: check.met, description: `Not the case: ${flagLabel(scenario, requirement.notFlag)}` };
  return { met: check.met, description: check.description };
}

/**
 * Classifies the ending from the complete campaign state: resources, flags set
 * by every decision (and by unpaid costs), and the harmful consequences still
 * looming. Rules are checked in order; the first whose conditions all hold wins.
 * Returns undefined when the scenario has no ending rules.
 */
export function classifyEnding(scenario: AlternateScenario, state: SimulationState): EndingClassification | undefined {
  const rules = scenario.endingRules;
  if (!rules || rules.length === 0) return undefined;
  const looming = loomingThreats(scenario, state);
  const evaluated: EndingRuleEvaluation[] = [];
  for (const rule of rules) {
    const checks = rule.conditions.map((condition) => describeEndingCondition(scenario, state, condition));
    if (rule.maxLooming !== undefined) {
      checks.push({
        met: looming.length <= rule.maxLooming,
        description: `At most ${rule.maxLooming} serious threat${rule.maxLooming === 1 ? '' : 's'} still looming (there ${looming.length === 1 ? 'is' : 'are'} ${looming.length})`,
      });
    }
    const matched = checks.every((check) => check.met);
    evaluated.push({ rule, checks, matched });
    if (matched) return { endingId: rule.endingId, ruleId: rule.id, looming, evaluated };
  }
  throw new Error(`Scenario ${scenario.id}: no ending rule matched; the last rule must be unconditional.`);
}

/**
 * Selects narrative text from the state BEFORE the choice, the same rule as for
 * conditional effects: the first variant whose condition holds, otherwise the
 * default; stakeholder lines whose condition holds (or that have none).
 */
export function resolveNarrative(
  scenario: AlternateScenario,
  state: SimulationState,
  narrative: ChoiceNarrative,
): ResolvedNarrative {
  const pick = (fallback: string, variants: ChoiceNarrative['effectVariants']) =>
    variants?.find((variant) => checkRequirement(scenario, state, variant.when).met)?.text ?? fallback;
  const holds = (when: Requirement) => checkRequirement(scenario, state, when).met;
  const situation =
    narrative.situation === undefined
      ? {}
      : {
          situation: pick(narrative.situation, narrative.situationVariants),
          situationNotes: (narrative.situationNotes ?? []).filter((note) => holds(note.when)).map((note) => note.text),
        };
  return {
    ...situation,
    ordered: narrative.ordered,
    effect: pick(narrative.effect, narrative.effectVariants),
    stakeholders: narrative.stakeholders
      .filter((item) => !item.when || checkRequirement(scenario, state, item.when).met)
      .map(({ id, group, impact, text }) => ({ id, group, impact, text })),
    uncertainty: pick(narrative.uncertainty, narrative.uncertaintyVariants),
  };
}

/** Replays a sequence of choices from the start. Throws if any step is invalid. */
export function replay(scenario: AlternateScenario, choiceIds: readonly string[]): SimulationState {
  let state = createInitialState(scenario);
  for (const id of choiceIds) {
    const result = applyChoice(scenario, state, id);
    if (!result.ok) throw new Error(`Replay failed at "${id}": ${result.message}`);
    state = result.state;
  }
  return state;
}

/**
 * Every complete path through the scenario, honouring prerequisites, as lists
 * of choice ids. Used by the balance and softlock tests (the Blueprint's
 * 3^5 = 243 path matrix once all five decisions exist).
 */
export function enumeratePaths(scenario: AlternateScenario, limit = 10_000): string[][] {
  const paths: string[][] = [];
  const walk = (state: SimulationState, path: string[]) => {
    if (paths.length >= limit) throw new Error(`More than ${limit} paths; check for cycles.`);
    const options = evaluateChoices(scenario, state).filter((item) => item.available);
    if (options.length === 0) {
      paths.push(path);
      return;
    }
    for (const option of options) {
      const result = applyChoice(scenario, state, option.choice.id);
      if (result.ok) walk(result.state, [...path, option.choice.id]);
    }
  };
  walk(createInitialState(scenario), []);
  return paths;
}

export function decisionNumber(scenario: AlternateScenario, decisionId: string): number {
  const decisions = scenario.nodes.filter((node) => node.kind === 'decision');
  return decisions.findIndex((node) => node.id === decisionId) + 1;
}

export function flagLabel(scenario: AlternateScenario, flagId: string): string {
  return scenario.flags.find((flag) => flag.id === flagId)?.label ?? flagId;
}
