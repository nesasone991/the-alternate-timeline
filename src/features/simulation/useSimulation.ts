import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { AlternateScenario, SimulationState } from '../../types/simulation';
import { applyChoice, createInitialState } from './engine';
import { clearSave, loadSave, writeSave, type LoadResult } from './savegame';

/**
 * UI state around the engine: the committed simulation state plus a
 * pre-commit selection. Undo exists only before confirming (Blueprint §3.5);
 * after that, "Start over" is the way back.
 */
export type SimulationUiState = {
  readonly state: SimulationState;
  readonly selectedChoiceId: string | null;
  /** Set when a commit is rejected, so the interface can say why. */
  readonly error: string | null;
  /** Increments on every confirmed decision or restart; drives saving. */
  readonly revision: number;
  readonly lastAction: 'init' | 'confirm' | 'restart';
};

export type SimulationAction =
  | { readonly type: 'select'; readonly choiceId: string }
  | { readonly type: 'confirm' }
  | { readonly type: 'restart' };

export function initialUiState(scenario: AlternateScenario, restored?: SimulationState): SimulationUiState {
  return {
    state: restored ?? createInitialState(scenario),
    selectedChoiceId: null,
    error: null,
    revision: 0,
    lastAction: 'init',
  };
}

export function simulationUiReducer(scenario: AlternateScenario) {
  return (ui: SimulationUiState, action: SimulationAction): SimulationUiState => {
    switch (action.type) {
      case 'select':
        return { ...ui, selectedChoiceId: action.choiceId, error: null };
      case 'confirm': {
        if (!ui.selectedChoiceId) return { ...ui, error: 'Choose an option first.' };
        const result = applyChoice(scenario, ui.state, ui.selectedChoiceId);
        if (!result.ok) return { ...ui, error: result.message };
        return { state: result.state, selectedChoiceId: null, error: null, revision: ui.revision + 1, lastAction: 'confirm' };
      }
      case 'restart':
        return { ...initialUiState(scenario), revision: ui.revision + 1, lastAction: 'restart' };
    }
  };
}

export type SaveNotice =
  | { readonly kind: 'restored'; readonly savedAt: string }
  | { readonly kind: 'problem'; readonly reason: string };

function noticeFrom(result: LoadResult): SaveNotice | null {
  if (result.status === 'restored') return { kind: 'restored', savedAt: result.savedAt };
  if (result.status === 'incompatible' || result.status === 'corrupt') return { kind: 'problem', reason: result.reason };
  return null;
}

/**
 * Hook form. Accepts `undefined` for campaigns without an alternate scenario so
 * it can be called unconditionally; it then returns `ui: null`.
 *
 * Saving: a confirmed decision writes the save; Start over deletes it. A save
 * that cannot be loaded is left untouched until the player discards it or makes
 * a new decision, so nothing is lost without the player knowing.
 */
export function useSimulation(scenario: AlternateScenario | undefined) {
  const [initial] = useState(() => {
    if (!scenario) return { ui: null, notice: null };
    const loaded = loadSave(scenario);
    return {
      ui: initialUiState(scenario, loaded.status === 'restored' ? loaded.state : undefined),
      notice: noticeFrom(loaded),
    };
  });
  const [notice, setNotice] = useState<SaveNotice | null>(initial.notice);
  const [saveAvailable, setSaveAvailable] = useState(true);

  const reducer = useMemo(() => {
    const inner = scenario ? simulationUiReducer(scenario) : undefined;
    return (ui: SimulationUiState | null, action: SimulationAction): SimulationUiState | null =>
      inner && ui ? inner(ui, action) : ui;
  }, [scenario]);
  const [ui, dispatch] = useReducer(reducer, initial.ui);

  const lastRevision = useRef(0);
  useEffect(() => {
    if (!scenario || !ui || ui.revision === lastRevision.current) return;
    lastRevision.current = ui.revision;
    if (ui.lastAction === 'confirm') setSaveAvailable(writeSave(scenario, ui.state));
    if (ui.lastAction === 'restart') clearSave(scenario);
    setNotice(null);
  }, [scenario, ui]);

  const select = useCallback((choiceId: string) => dispatch({ type: 'select', choiceId }), []);
  const confirm = useCallback(() => dispatch({ type: 'confirm' }), []);
  const restart = useCallback(() => dispatch({ type: 'restart' }), []);
  const discardSave = useCallback(() => {
    if (scenario) clearSave(scenario);
    setNotice(null);
  }, [scenario]);
  const dismissNotice = useCallback(() => setNotice(null), []);

  return { ui, select, confirm, restart, notice, discardSave, dismissNotice, saveAvailable };
}
