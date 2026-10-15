/**
 * Simulation contracts (Phase 2). Interfaces only — no engine exists yet.
 * They follow the Master Blueprint §5.3 data model so scenario authoring can
 * begin against a stable shape.
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

export type Effect = {
  readonly resource: ResourceKey;
  readonly delta: number;
};

export type Requirement = {
  readonly resource?: ResourceKey;
  readonly min?: number;
  readonly flag?: string;
  readonly notFlag?: string;
};

export type Choice = {
  readonly id: string;
  readonly label: string;
  readonly rationale: string;
  readonly prerequisites?: readonly Requirement[];
  readonly effects: readonly Effect[];
  readonly flagsSet?: readonly string[];
  readonly nextEventId: string;
};

export type DecisionEvent = {
  readonly id: string;
  readonly year: number;
  readonly prompt: string;
  readonly choices: readonly Choice[];
};

export type Ending = {
  readonly id: string;
  readonly title: string;
  readonly year: number;
  readonly summary: string;
};

export type SimulationState = {
  readonly scenarioId: string;
  readonly currentEventId: string;
  readonly year: number;
  readonly resources: Readonly<Record<ResourceKey, number>>;
  readonly flags: readonly string[];
  readonly choicesMade: readonly string[];
  readonly eventLog: readonly string[];
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
  /** Shown in the interface when the mode is not yet implemented. */
  readonly limitation?: string;
};
