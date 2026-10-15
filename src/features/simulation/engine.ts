import {
  RESOURCE_KEYS,
  RESOURCE_LABELS,
  RESOURCE_MAX,
  RESOURCE_MIN,
  SIMULATION_SCHEMA_VERSION,
  type AlternateScenario,
  type AppliedConditional,
  type AppliedEffect,
  type Choice,
  type ChoiceRecord,
  type ChoiceNarrative,
  type ConditionalEffect,
  type DecisionEvent,
  type Effect,
  type PendingConsequence,
  type Requirement,
  type ResolvedConsequence,
  type ResolvedNarrative,
  type ResourceKey,
  type Resources,
  type ScenarioNode,
  type SimulationState,
} from '../../types/simulation';

/**
 * The decision engine: pure, deterministic functions over authored scenario data.
 *
 * - No randomness. The same scenario and the same choices always give the same state.
 * - No mutation. Every function returns new objects; inputs are never changed.
 * - Resources are clamped to 0–100 after every effect.
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
};

export function evaluateChoices(scenario: AlternateScenario, state: SimulationState): ChoiceEvaluation[] {
  const decision = getCurrentDecision(scenario, state);
  if (!decision) return [];
  return decision.choices.map((choice) => {
    const requirements = (choice.prerequisites ?? []).map((req) => checkRequirement(scenario, state, req));
    const applicableConditionals = applicableConditionalEffects(scenario, state, choice);
    return {
      choice,
      available: requirements.every((check) => check.met),
      requirements,
      applicableConditionals,
      projected: computeImmediate(state.resources, choice, applicableConditionals).total,
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

function applyEffectList(
  resources: Resources,
  effects: readonly Effect[],
): { resources: Resources; applied: AppliedEffect[] } {
  const next: Record<ResourceKey, number> = { ...resources };
  const applied: AppliedEffect[] = [];
  for (const effect of effects) {
    const before = next[effect.resource];
    const after = clampResource(before + effect.delta);
    next[effect.resource] = after;
    applied.push({ resource: effect.resource, requested: effect.delta, applied: after - before, before, after });
  }
  return { resources: next, applied };
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

function computeImmediate(resources: Resources, choice: Choice, conditionals: readonly ConditionalEffect[]) {
  const base = applyEffectList(resources, choice.effects);
  let current = base.resources;
  const conditional: AppliedConditional[] = [];
  for (const item of conditionals) {
    const result = applyEffectList(current, item.effects);
    current = result.resources;
    conditional.push({ id: item.id, explanation: item.explanation, effects: result.applied });
  }
  const all = [...base.applied, ...conditional.flatMap((item) => item.effects)];
  return { resources: current, conditional, total: totalPerResource(all) };
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
    if (triggered) {
      const result = applyEffectList(current.resources, definition.effects);
      applied = result.applied;
      current = { ...current, resources: result.resources };
    }
    resolved.push({
      ...pending,
      resolvedAtNodeId: nodeId,
      resolvedYear: year,
      triggered,
      explanation: triggered ? definition.explanation : (definition.lapsedExplanation ?? 'This did not come to pass.'),
      effects: applied,
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

  const immediate = computeImmediate(state.resources, choice, evaluation.applicableConditionals);
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
    effects: immediate.total,
    conditional: immediate.conditional,
    scheduled: scheduled.map((item) => item.consequenceId),
    flagsSet: newFlags,
    ...(narrative ? { narrative } : {}),
  };

  const committed: SimulationState = {
    ...state,
    currentEventId: next.id,
    year: next.year,
    resources: immediate.resources,
    flags: [...state.flags, ...newFlags],
    choicesMade: [...state.choicesMade, choice.id],
    records: [...state.records, record],
    pending: [...state.pending, ...scheduled],
    eventLog: [...state.eventLog, `${decision.title}: ${choice.label}`],
    endingId: next.kind === 'terminal' && next.status === 'ending' ? next.id : state.endingId,
  };

  // Arriving at the next point in time: anything now due takes effect (or lapses).
  return { ok: true, record, state: resolveDue(scenario, committed, next.id, next.year) };
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
  return {
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
