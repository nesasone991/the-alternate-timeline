import { useCallback, useMemo, useReducer } from 'react';
import type { AlternateScenario, SimulationState } from '../../types/simulation';
import { applyChoice, createInitialState } from './engine';

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
};

export type SimulationAction =
  | { readonly type: 'select'; readonly choiceId: string }
  | { readonly type: 'confirm' }
  | { readonly type: 'restart' };

export function initialUiState(scenario: AlternateScenario): SimulationUiState {
  return { state: createInitialState(scenario), selectedChoiceId: null, error: null };
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
        return { state: result.state, selectedChoiceId: null, error: null };
      }
      case 'restart':
        return initialUiState(scenario);
    }
  };
}

/**
 * Hook form. Accepts `undefined` for campaigns without an alternate scenario so
 * it can be called unconditionally; it then returns `ui: null`.
 */
export function useSimulation(scenario: AlternateScenario | undefined) {
  const reducer = useMemo(() => {
    const inner = scenario ? simulationUiReducer(scenario) : undefined;
    return (ui: SimulationUiState | null, action: SimulationAction): SimulationUiState | null =>
      inner && ui ? inner(ui, action) : ui;
  }, [scenario]);
  const [ui, dispatch] = useReducer(reducer, scenario, (s): SimulationUiState | null => (s ? initialUiState(s) : null));
  const select = useCallback((choiceId: string) => dispatch({ type: 'select', choiceId }), []);
  const confirm = useCallback(() => dispatch({ type: 'confirm' }), []);
  const restart = useCallback(() => dispatch({ type: 'restart' }), []);
  return { ui, select, confirm, restart };
}
