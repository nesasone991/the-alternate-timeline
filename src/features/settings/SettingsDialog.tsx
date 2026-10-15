import { useEffect, useId, useRef } from 'react';
import { Icon } from '../../components/ui/Icon';
import type { MotionPreference, Settings, TextSize } from './settings';
import { isPersistenceAvailable, resetSettings, updateSettings } from './settingsStore';
import { useSettings, useSystemReducedMotion } from './useSettings';

type SettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Settings panel on a native <dialog>: the browser provides focus trapping,
 * Escape to close and the inert backdrop. Every change applies and saves immediately.
 */
export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const settings = useSettings();
  const systemReduced = useSystemReducedMotion();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="settings-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-2xl">
              Settings
            </h2>
            <p className="control-label mt-1">Changes apply immediately and are saved in this browser only.</p>
          </div>
          <button type="button" className="icon-btn shrink-0" onClick={onClose} aria-label="Close settings">
            <Icon name="close" />
          </button>
        </div>

        <div className="mt-6 space-y-6 font-sans text-[0.9375rem]">
          <fieldset>
            <legend className="font-serif text-lg">Motion</legend>
            <p className="control-label mt-1">
              Your device currently {systemReduced ? 'asks for reduced motion' : 'allows full motion'}.
            </p>
            <div className="mt-3 grid gap-2">
              {(
                [
                  ['system', 'Match my device', 'Follow the operating system setting.'],
                  ['reduced', 'Always reduce motion', 'Turn off transitions and animation.'],
                  ['full', 'Always allow motion', 'Use transitions even if the device asks to reduce them.'],
                ] as ReadonlyArray<readonly [MotionPreference, string, string]>
              ).map(([value, label, hint]) => (
                <RadioRow
                  key={value}
                  name="motion"
                  value={value}
                  label={label}
                  hint={hint}
                  checked={settings.motion === value}
                  onSelect={() => updateSettings({ motion: value })}
                />
              ))}
            </div>
          </fieldset>

          <ToggleRow
            label="Ambient animations"
            hint="Decorative animation, such as the timeline drawing itself on the home page. Off when motion is reduced."
            checked={settings.ambientAnimations}
            onChange={(checked) => updateSettings({ ambientAnimations: checked })}
          />

          <ToggleRow
            label="Sound effects"
            hint="No sounds are included yet. Your choice is saved and will apply when licensed audio is added. Sound will always start off."
            checked={settings.soundEffects}
            onChange={(checked) => updateSettings({ soundEffects: checked })}
          />

          <fieldset>
            <legend className="font-serif text-lg">Text size</legend>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(
                [
                  ['standard', 'Standard'],
                  ['large', 'Large'],
                  ['larger', 'Larger'],
                ] as ReadonlyArray<readonly [TextSize, string]>
              ).map(([value, label]) => (
                <RadioRow
                  key={value}
                  name="text-size"
                  value={value}
                  label={label}
                  checked={settings.textSize === value}
                  onSelect={() => updateSettings({ textSize: value })}
                  compact
                />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-serif text-lg">Year notation</legend>
            <p className="control-label mt-1">How years are labelled across the timeline.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(
                [
                  ['AD', '476 AD'],
                  ['CE', '476 CE'],
                ] as ReadonlyArray<readonly [Settings['eraNotation'], string]>
              ).map(([value, label]) => (
                <RadioRow
                  key={value}
                  name="era"
                  value={value}
                  label={label}
                  checked={settings.eraNotation === value}
                  onSelect={() => updateSettings({ eraNotation: value })}
                  compact
                />
              ))}
            </div>
          </fieldset>
        </div>

        {!isPersistenceAvailable() ? (
          <p role="status" className="mt-6 border-l-2 border-burgundy-bright pl-3 font-sans text-sm">
            This browser is blocking local storage, so settings will reset when you leave the page.
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-rule-soft pt-5">
          <button type="button" className="btn btn-quiet" onClick={() => resetSettings()}>
            Restore defaults
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
}

type RadioRowProps = {
  name: string;
  value: string;
  label: string;
  hint?: string;
  checked: boolean;
  onSelect: () => void;
  compact?: boolean;
};

function RadioRow({ name, value, label, hint, checked, onSelect, compact }: RadioRowProps) {
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-start gap-3 border px-3 py-2.5 transition-colors ${
        checked ? 'border-gold bg-gold/10' : 'border-rule-soft hover:border-rule'
      } ${compact ? 'items-center' : ''}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="mt-1 size-4 shrink-0 accent-gold"
      />
      <span>
        <span className="block font-medium">{label}</span>
        {hint ? <span className="control-label block">{hint}</span> : null}
      </span>
    </label>
  );
}

type ToggleRowProps = {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function ToggleRow({ label, hint, checked, onChange }: ToggleRowProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="font-serif text-lg">
          {label}
        </label>
        <p id={hintId} className="control-label mt-1">
          {hint}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={hintId}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors ${
          checked ? 'border-gold bg-gold/80' : 'border-rule bg-ink'
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block size-5 rounded-full bg-parchment transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
