import {
  RESOURCE_KEYS,
  RESOURCE_MAX,
  RESOURCE_MIN,
  type AlternateScenario,
  type Requirement,
  type ScenarioNode,
} from '../../types/simulation';

/**
 * Structural checks for an authored scenario. Run by the unit tests and in
 * development builds. Catches broken links, cycles, unreachable nodes, invalid
 * resources, unknown flags and choices with no downside.
 *
 * `actualEventIds` lets the check confirm that historical-context links point at
 * real events without the scenario importing the actual-history dataset.
 */
export function validateScenario(scenario: AlternateScenario, actualEventIds: readonly string[] = []): string[] {
  const errors: string[] = [];
  const nodesById = new Map<string, ScenarioNode>();
  const flagIds = new Set(scenario.flags.map((flag) => flag.id));
  const knownActual = new Set(actualEventIds);

  for (const node of scenario.nodes) {
    if (nodesById.has(node.id)) errors.push(`Node ${node.id}: duplicate id.`);
    nodesById.set(node.id, node);
  }

  if (!nodesById.has(scenario.startNodeId)) errors.push(`Start node "${scenario.startNodeId}" does not exist.`);

  for (const key of RESOURCE_KEYS) {
    const value = scenario.initialResources[key];
    if (typeof value !== 'number' || value < RESOURCE_MIN || value > RESOURCE_MAX) {
      errors.push(`Initial ${key} must be between ${RESOURCE_MIN} and ${RESOURCE_MAX}.`);
    }
  }

  const flagIdsSeen = new Set<string>();
  for (const flag of scenario.flags) {
    if (flagIdsSeen.has(flag.id)) errors.push(`Flag ${flag.id}: duplicate id.`);
    flagIdsSeen.add(flag.id);
  }

  const checkRequirement = (where: string, req: Requirement) => {
    if (req.resource !== undefined) {
      if (!RESOURCE_KEYS.includes(req.resource)) errors.push(`${where}: unknown resource "${req.resource}".`);
      const bound = req.below ?? req.min;
      if (bound === undefined || bound < RESOURCE_MIN || bound > RESOURCE_MAX) errors.push(`${where}: threshold out of range.`);
    }
    const flag = req.flag ?? req.notFlag;
    if (flag !== undefined && !flagIds.has(flag)) errors.push(`${where}: unknown flag "${flag}".`);
  };

  const effectIds = new Set<string>();
  const checkEffects = (where: string, effects: readonly { resource: string; delta: number }[]) => {
    for (const effect of effects) {
      if (!(RESOURCE_KEYS as readonly string[]).includes(effect.resource)) {
        errors.push(`${where}: unknown resource "${effect.resource}".`);
      }
      if (!Number.isInteger(effect.delta)) errors.push(`${where}: effect deltas must be whole numbers.`);
    }
  };

  for (const node of scenario.nodes) {
    if (node.year < 1) errors.push(`Node ${node.id}: invalid year.`);
    if (node.kind !== 'decision') continue;
    const where = `Decision ${node.id}`;
    if (node.choices.length < 2 || node.choices.length > 4) errors.push(`${where}: needs 2–4 choices.`);
    for (const id of node.historicalContextIds) {
      if (knownActual.size > 0 && !knownActual.has(id)) errors.push(`${where}: unknown historical event "${id}".`);
    }
    const choiceIds = new Set<string>();
    for (const choice of node.choices) {
      const cw = `${where} / choice ${choice.id}`;
      if (choiceIds.has(choice.id)) errors.push(`${cw}: duplicate choice id.`);
      choiceIds.add(choice.id);
      if (!nodesById.has(choice.nextEventId)) errors.push(`${cw}: next node "${choice.nextEventId}" does not exist.`);
      if (choice.effects.length === 0) errors.push(`${cw}: has no effects.`);
      checkEffects(cw, choice.effects);
      if (!choice.outcome.trim()) errors.push(`${cw}: needs an outcome explanation.`);
      for (const item of choice.conditionalEffects ?? []) {
        const iw = `${cw} / conditional ${item.id}`;
        if (effectIds.has(item.id)) errors.push(`${iw}: duplicate id.`);
        effectIds.add(item.id);
        if (item.effects.length === 0) errors.push(`${iw}: has no effects.`);
        if (!item.explanation.trim()) errors.push(`${iw}: needs an explanation.`);
        checkEffects(iw, item.effects);
        checkRequirement(iw, item.when);
      }
      for (const item of choice.consequences ?? []) {
        const iw = `${cw} / consequence ${item.id}`;
        if (effectIds.has(item.id)) errors.push(`${iw}: duplicate id.`);
        effectIds.add(item.id);
        if (item.dueYear <= node.year) errors.push(`${iw}: must fall due after ${node.year}.`);
        if (item.effects.length === 0) errors.push(`${iw}: has no effects.`);
        if (!item.hint.trim() || !item.explanation.trim()) errors.push(`${iw}: needs a hint and an explanation.`);
        if (item.condition && !item.lapsedExplanation?.trim()) {
          errors.push(`${iw}: a conditional consequence must explain what happens when it lapses.`);
        }
        checkEffects(iw, item.effects);
        if (item.condition) checkRequirement(iw, item.condition);
      }
      // Blueprint §6.4: no free lunch. Every choice must cost something.
      if (!choice.effects.some((effect) => effect.delta < 0)) errors.push(`${cw}: has no downside.`);
      for (const flag of choice.flagsSet ?? []) {
        if (!flagIds.has(flag)) errors.push(`${cw}: sets unknown flag "${flag}".`);
      }
      for (const req of choice.prerequisites ?? []) checkRequirement(cw, req);
    }
    if (node.choices.every((choice) => (choice.prerequisites ?? []).length > 0)) {
      errors.push(`${where}: every choice has prerequisites; at least one must always be open to avoid softlocks.`);
    }
  }

  // Reachability and cycles, following choice links from the start node.
  const visiting = new Set<string>();
  const reached = new Set<string>();
  const visit = (id: string, trail: string[]) => {
    if (visiting.has(id)) {
      errors.push(`Cycle: ${[...trail, id].join(' → ')}.`);
      return;
    }
    if (reached.has(id)) return;
    const node = nodesById.get(id);
    if (!node) return;
    visiting.add(id);
    reached.add(id);
    if (node.kind === 'decision') {
      for (const next of new Set(node.choices.map((choice) => choice.nextEventId))) visit(next, [...trail, id]);
    }
    visiting.delete(id);
  };
  visit(scenario.startNodeId, []);
  for (const node of scenario.nodes) {
    if (!reached.has(node.id)) errors.push(`Node ${node.id}: unreachable from the start.`);
  }

  return errors;
}
