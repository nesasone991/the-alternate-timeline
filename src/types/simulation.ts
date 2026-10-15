/**
 * Simulation contracts. Follows the Master Blueprint §5.3 data model, extended
 * where the engine needs more (node kinds, structured records, versions).
 *
 * Everything here describes AUTHORED FICTION. Alternate-history data never
 * references actual-history objects directly — only their ids, for context links.
 */

export type ResourceKey = 'economy' | 'military' | 'unity' | 'legitimacy';

export const RESOURCE_KEYS: readonly ResourceKey[] = ['economy', 'military', 'unity', 'legitimacy'];

export const RESOURCE_LABELS: Readonly<Record<ResourceKey, string>> = {
  economy: 'Economy',
  military: 'Military',
  unity: 'Political Unity',
  legitimacy: 'Legitimacy',
};

/** Resources are gameplay abstractions on a 0–100 scale, not historical measurements. */
export const RESOURCE_MIN = 0;
export const RESOURCE_MAX = 100;

export type Resources = Readonly<Record<ResourceKey, number>>;

export type Effect = {
  readonly resource: ResourceKey;
  readonly delta: number;
};

/**
 * One condition. Exactly one form per requirement: a resource at or above a
 * minimum, a resource below a ceiling, a flag that must be set, or a flag that
 * must not be set.
 */
export type Requirement =
  | { readonly resource: ResourceKey; readonly min: number; readonly below?: never; readonly flag?: never; readonly notFlag?: never }
  | { readonly resource: ResourceKey; readonly below: number; readonly min?: never; readonly flag?: never; readonly notFlag?: never }
  | { readonly flag: string; readonly resource?: never; readonly min?: never; readonly below?: never; readonly notFlag?: never }
  | { readonly notFlag: string; readonly resource?: never; readonly min?: never; readonly below?: never; readonly flag?: never };

/**
 * An extra effect that applies only when an earlier decision (or the current
 * state) makes it apply. Shown to the player before they commit, with the reason.
 */
export type ConditionalEffect = {
  readonly id: string;
  readonly when: Requirement;
  readonly effects: readonly Effect[];
  /** Why the earlier situation changes this outcome. Shown as "Because …". */
  readonly explanation: string;
};

/**
 * A consequence that lands later. Before it is due the player sees only the
 * hint and the approximate year — never the numbers. When due, the optional
 * condition is checked against the state at that time; if it fails, the
 * consequence lapses and the player is told why.
 */
export type ScheduledConsequence = {
  readonly id: string;
  readonly dueYear: number;
  readonly hint: string;
  readonly explanation: string;
  readonly condition?: Requirement;
  readonly lapsedExplanation?: string;
  readonly effects: readonly Effect[];
};

export type Choice = {
  readonly id: string;
  readonly label: string;
  /** Why an advisor might argue for this — and what it costs. */
  readonly rationale: string;
  /** Shown after committing: why this strategy produced these results. */
  readonly outcome: string;
  /** Plain-language note about a later cost or risk, shown before committing. */
  readonly warning?: string;
  readonly prerequisites?: readonly Requirement[];
  readonly effects: readonly Effect[];
  readonly conditionalEffects?: readonly ConditionalEffect[];
  readonly consequences?: readonly ScheduledConsequence[];
  readonly flagsSet?: readonly string[];
  readonly nextEventId: string;
};

export type DecisionEvent = {
  readonly kind: 'decision';
  readonly id: string;
  readonly year: number;
  readonly yearApproximate: boolean;
  readonly title: string;
  /** Framing of the situation. Fiction, but it may point at sourced events below. */
  readonly context: string;
  /** Ids of actual-history events this decision is set against (links only). */
  readonly historicalContextIds: readonly string[];
  readonly prompt: string;
  readonly choices: readonly Choice[];
};

/**
 * A node with no choices. `in-development` marks where the authored campaign
 * currently stops; `ending` will mark real endings in later milestones.
 */
export type TerminalNode = {
  readonly kind: 'terminal';
  readonly id: string;
  readonly year: number;
  readonly yearApproximate: boolean;
  readonly status: 'in-development' | 'ending';
  readonly title: string;
  readonly summary: string;
};

export type ScenarioNode = DecisionEvent | TerminalNode;

/** Human-readable meaning of a flag, for consequence lists and the end screen. */
export type FlagDefinition = {
  readonly id: string;
  readonly label: string;
  /** Which later decisions are planned to read it. Design note, shown to players. */
  readonly laterEffect: string;
};

export type AlternateScenario = {
  readonly id: string;
  /** Bump when authored content changes in a way that breaks saved games. */
  readonly version: number;
  readonly campaignId: string;
  readonly title: string;
  readonly disclaimer: string;
  readonly initialResources: Resources;
  readonly startNodeId: string;
  readonly nodes: readonly ScenarioNode[];
  readonly flags: readonly FlagDefinition[];
  /** Total decisions planned for the campaign, for progress display. */
  readonly plannedDecisionCount: number;
};

export type Ending = {
  readonly id: string;
  readonly title: string;
  readonly year: number;
  readonly summary: string;
};

/** Requested and actually applied change for one resource (clamping can make them differ). */
export type AppliedEffect = {
  readonly resource: ResourceKey;
  readonly requested: number;
  readonly applied: number;
  readonly before: number;
  readonly after: number;
};

export type AppliedConditional = {
  readonly id: string;
  readonly explanation: string;
  readonly effects: readonly AppliedEffect[];
};

/** A committed decision: the traceable record behind every later consequence. */
export type ChoiceRecord = {
  readonly decisionId: string;
  readonly choiceId: string;
  readonly year: number;
  /** Total immediate change per resource (base effects plus conditional effects). */
  readonly effects: readonly AppliedEffect[];
  /** The conditional effects that applied, each with its reason. */
  readonly conditional: readonly AppliedConditional[];
  /** Ids of consequences this choice scheduled for later. */
  readonly scheduled: readonly string[];
  readonly flagsSet: readonly string[];
};

export type PendingConsequence = {
  readonly consequenceId: string;
  readonly sourceDecisionId: string;
  readonly sourceChoiceId: string;
  readonly dueYear: number;
  readonly hint: string;
};

export type ResolvedConsequence = PendingConsequence & {
  /** The node the timeline had reached when this came due. */
  readonly resolvedAtNodeId: string;
  readonly resolvedYear: number;
  /** False when its condition was not met and it lapsed. */
  readonly triggered: boolean;
  readonly explanation: string;
  readonly effects: readonly AppliedEffect[];
};

export const SIMULATION_SCHEMA_VERSION = 2;

export type SimulationState = {
  readonly schemaVersion: number;
  readonly scenarioId: string;
  readonly scenarioVersion: number;
  readonly currentEventId: string;
  readonly year: number;
  readonly resources: Resources;
  readonly flags: readonly string[];
  readonly choicesMade: readonly string[];
  readonly records: readonly ChoiceRecord[];
  /** Consequences scheduled by earlier choices and not yet due. */
  readonly pending: readonly PendingConsequence[];
  /** Consequences that came due, whether they took effect or lapsed. */
  readonly resolved: readonly ResolvedConsequence[];
  readonly eventLog: readonly string[];
  /**
   * Reserved for optional random events, which the Blueprint allows only with an
   * explicit, logged seed. The current campaign uses no randomness at all.
   */
  readonly seed: number;
  readonly endingId?: string;
};

/** The three ways a player looks at a campaign. */
export type WorkspaceMode = 'real' | 'alternate' | 'comparison';

export type ModeAvailability = {
  readonly mode: WorkspaceMode;
  readonly label: string;
  readonly description: string;
  readonly available: boolean;
  /** Shown in the interface when the mode is not yet implemented or is partial. */
  readonly limitation?: string;
};
