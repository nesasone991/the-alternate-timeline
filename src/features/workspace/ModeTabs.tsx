import { useRef, type KeyboardEvent } from 'react';
import type { ModeAvailability, WorkspaceMode } from '../../types/simulation';

type ModeTabsProps = {
  modes: readonly ModeAvailability[];
  active: WorkspaceMode;
  onChange: (mode: WorkspaceMode) => void;
  panelId: string;
};

/** WAI-ARIA tabs with arrow-key navigation. Unbuilt modes stay selectable and say so. */
export function ModeTabs({ modes, active, onChange, panelId }: ModeTabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % modes.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + modes.length) % modes.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = modes.length - 1;
    if (next < 0) return;
    event.preventDefault();
    const mode = modes[next];
    if (!mode) return;
    onChange(mode.mode);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label="Workspace mode" className="grid w-full grid-cols-3 sm:flex sm:w-auto">
      {modes.map((mode, index) => {
        const selected = mode.mode === active;
        return (
          <button
            key={mode.mode}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`mode-tab-${mode.mode}`}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(mode.mode)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`flex min-h-11 cursor-pointer flex-col items-center justify-center border-b-2 px-2 py-1 text-center font-sans text-sm leading-tight transition-colors sm:px-4 sm:whitespace-nowrap ${
              selected ? 'border-gold text-parchment' : 'border-rule-soft text-parchment-muted hover:text-parchment'
            }`}
          >
            <span className="font-semibold">{mode.label}</span>
            {!mode.available ? <span className="text-xs text-parchment-muted">Not built yet</span> : null}
          </button>
        );
      })}
    </div>
  );
}
