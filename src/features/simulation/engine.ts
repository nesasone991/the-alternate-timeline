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
  type DecisionEvent,
  type Requirement,
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
    return {
      requirement,
      met: have >= requirement.min,
      description: `${RESOURCE_LABELS[requirement.resource]} ${requirement.min} or more (you have ${have})`,
    };
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
  /** What would happen if this choice were committed now, after clamping. */
  readonly projected: readonly AppliedEffect[];
};

export function evaluateChoices(scenario: AlternateScenario, state: SimulationState): ChoiceEvaluation[] {
  const decision = getCurrentDecision(scenario, state);
  if (!decision) return [];
  return decision.choices.map((choice) => {
    const requirements = (choice.prerequisites ?? []).map((req) => checkRequirement(scenario, state, req));
    return {
      choice,
      available: requirements.every((check) => check.met),
      requirements,
      projected: applyEffects(state.resources, choice).effects,
    };
  });
}

function applyEffects(resources: Resources, choice: Choice): { resources: Resources; effects: AppliedEffect[] } {
  const next: Record<ResourceKey, number> = { ...resources };
  const effects: AppliedEffect[] = [];
  for (const effect of choice.effects) {
    const before = next[effect.resource];
    const after = clampResource(before + effect.delta);
    next[effect.resource] = after;
    effects.push({ resource: effect.resource, requested: effect.delta, applied: after - before, before, after });
  }
  return { resources: next, effects };
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

  const { resources, effects } = applyEffects(state.resources, choice);
  const newFlags = (choice.flagsSet ?? []).filter((flag) => !state.flags.includes(flag));
  const record: ChoiceRecord = {
    decisionId: decision.id,
    choiceId: choice.id,
    year: decision.year,
    effects,
    flagsSet: newFlags,
  };

  return {
    ok: true,
    record,
    state: {
      ...state,
      currentEventId: next.id,
      year: next.year,
      resources,
      flags: [...state.flags, ...newFlags],
      choicesMade: [...state.choicesMade, choice.id],
      records: [...state.records, record],
      eventLog: [...state.eventLog, `${decision.title}: ${choice.label}`],
      endingId: next.kind === 'terminal' && next.status === 'ending' ? next.id : state.endingId,
    },
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
