import type { MapCue } from './map';

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
  /** Map hints used only when the consequence takes effect. */
  readonly mapCues?: readonly MapCue[];
};

/** Text chosen by the state of the game at commit time: the first variant whose condition holds wins. */
export type NarrativeVariant = {
  readonly when: Requirement;
  readonly text: string;
};

export type Stakeholder = {
  readonly id: string;
  /** A group or institution, described generally (e.g. "Coastal towns of Italy and Sicily"). */
  readonly group: string;
  readonly impact: 'gains' | 'loses' | 'mixed';
  readonly text: string;
  /** When set, this stakeholder line appears only if the condition held before the choice. */
  readonly when?: Requirement;
};

/**
 * Authored, fictional narrative feedback for a choice. Deterministic: every
 * variant and stakeholder line is selected by the state, never at random.
 */
export type ChoiceNarrative = {
  /**
   * The political situation the decision was taken in. Optional so earlier
   * decisions' reports stay valid; required by the Rome tests from Decision 4.
   */
  readonly situation?: string;
  readonly situationVariants?: readonly NarrativeVariant[];
  /**
   * Notes on what earlier decisions and current conditions add to the
   * situation. Unlike variants, EVERY note whose condition holds is shown, in order.
   */
  readonly situationNotes?: readonly NarrativeVariant[];
  /** What the player ordered. */
  readonly ordered: string;
  /** How it affects the empire. */
  readonly effect: string;
  readonly effectVariants?: readonly NarrativeVariant[];
  /** Who benefits and who suffers. */
  readonly stakeholders: readonly Stakeholder[];
  /** What remains unknown. */
  readonly uncertainty: string;
  readonly uncertaintyVariants?: readonly NarrativeVariant[];
};

/** The narrative as it actually applied, frozen into the record. */
export type ResolvedNarrative = {
  readonly situation?: string;
  readonly situationNotes?: readonly string[];
  readonly ordered: string;
  readonly effect: string;
  readonly stakeholders: readonly { readonly id: string; readonly group: string; readonly impact: Stakeholder['impact']; readonly text: string }[];
  readonly uncertainty: string;
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
  readonly narrative?: ChoiceNarrative;
  /** Hints for a future map animation of this decision (fiction; schematic regions only). */
  readonly mapCues?: readonly MapCue[];
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
  /**
   * What changed in each version, in plain language. Shown when an older save
   * cannot be loaded. The last entry's version must equal `version`.
   */
  readonly changes: readonly { readonly version: number; readonly summary: string }[];
  /**
   * What happens when a cost cannot be paid in full because a resource would go
   * below 0 (see `StructuralConsequence`). At most one rule per resource.
   */
  readonly shortfallRules?: readonly ShortfallRule[];
  /** The campaign's endings. Required when any terminal node has status `ending`. */
  readonly endings?: readonly EndingDefinition[];
  /**
   * Ending classification, checked in order on arrival at an `ending` node; the
   * first rule whose conditions all hold wins. The last rule must be unconditional.
   */
  readonly endingRules?: readonly EndingRule[];
  /** Authored text for the structured ending report (first matching line per section). */
  readonly endingNarrative?: EndingNarrativeSpec;
};

/**
 * Structural consequence of an unpayable cost. When the net change to a
 * resource would take it below 0, the unpaid part does not simply vanish: half
 * of it (rounded up) falls on `transferTo`, and `flag` is set. Deterministic,
 * recorded on the decision or consequence that caused it, and shown to the player.
 */
export type ShortfallRule = {
  readonly resource: ResourceKey;
  readonly transferTo: ResourceKey;
  readonly flag: string;
  /** How the unpaid part was made up, in the world. */
  readonly explanation: string;
};

export type StructuralConsequence = {
  readonly resource: ResourceKey;
  /** How much of the cost could not be paid. */
  readonly unpaid: number;
  readonly explanation: string;
  /** The change that made up for it (half the unpaid part, rounded up, may itself be capped at 0). */
  readonly transfer: AppliedEffect;
  readonly flag: string;
};

export type EndingCategory = 'imperial-survival' | 'fragmented-survival' | 'imperial-collapse';

export type EndingDefinition = {
  readonly id: string;
  readonly category: EndingCategory;
  readonly title: string;
  readonly summary: string;
};

export type EndingRule = {
  readonly id: string;
  readonly endingId: string;
  /** All must hold. */
  readonly conditions: readonly Requirement[];
  /**
   * Most "looming threats" allowed: consequences still pending after the ending
   * year that would do harm if nothing changed (their condition already holds).
   */
  readonly maxLooming?: number;
  /** Why this ending follows when the rule matches. */
  readonly explanation: string;
};

/** One candidate line for an ending-report section: the first match wins. */
export type EndingLine = {
  /** Only for these endings (any ending when absent). */
  readonly endings?: readonly string[];
  /** All must hold (always when absent). */
  readonly when?: readonly Requirement[];
  readonly text: string;
};

export type EndingNarrativeSpec = {
  readonly settlement: readonly EndingLine[];
  readonly imperialAuthority: readonly EndingLine[];
  readonly army: readonly EndingLine[];
  readonly economy: readonly EndingLine[];
  readonly regionalPowers: readonly EndingLine[];
  readonly constantinople: readonly EndingLine[];
};

/** Requested and actually applied change for one resource (clamping can make them differ). */
export type AppliedEffect = {
  readonly resource: ResourceKey;
  readonly requested: number;
  readonly applied: number;
  readonly before: number;
  readonly after: number;
};

/**
 * A conditional effect that applied. Its authored effects are listed as they
 * were requested: a decision's base and conditional effects are settled
 * together, so only the total in `ChoiceRecord.effects` is clamped.
 */
export type AppliedConditional = {
  readonly id: string;
  readonly explanation: string;
  readonly effects: readonly Effect[];
};

/** A committed decision: the traceable record behind every later consequence. */
export type ChoiceRecord = {
  readonly decisionId: string;
  readonly choiceId: string;
  readonly year: number;
  /**
   * Total immediate change per resource. Base and conditional effects are
   * settled together: one net change per resource, clamped once.
   */
  readonly effects: readonly AppliedEffect[];
  /** Costs that could not be paid in full, and what made up for them. */
  readonly structural: readonly StructuralConsequence[];
  /** The conditional effects that applied, each with its reason. */
  readonly conditional: readonly AppliedConditional[];
  /** Ids of consequences this choice scheduled for later. */
  readonly scheduled: readonly string[];
  readonly flagsSet: readonly string[];
  /** Present when the choice has authored narrative feedback. */
  readonly narrative?: ResolvedNarrative;
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
  readonly structural: readonly StructuralConsequence[];
};

export const SIMULATION_SCHEMA_VERSION = 4;

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
  /** Set on arrival at an `ending` node, by the scenario's ending rules. */
  readonly endingId?: string;
  /** The ending rule that matched. */
  readonly endingRuleId?: string;
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
