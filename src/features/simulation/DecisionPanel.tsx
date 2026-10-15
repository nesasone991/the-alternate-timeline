import { useId } from 'react';
import { FictionBadge } from '../../components/ui/Badges';
import { formatYear, type EraNotation } from '../../lib/dates';
import type { HistoricalEvent } from '../../types/history';
import type { AlternateScenario, ChoiceRecord } from '../../types/simulation';
import { decisionNumber, evaluateChoices, flagLabel, getCurrentNode, getNode } from './engine';
import { AppliedEffectList, EffectChips } from './EffectList';
import type { SimulationUiState } from './useSimulation';

type DecisionPanelProps = {
  scenario: AlternateScenario;
  ui: SimulationUiState;
  era: EraNotation;
  /** Actual-history events, used only to label context links. */
  historicalEvents: readonly HistoricalEvent[];
  limitation?: string;
  onSelect: (choiceId: string) => void;
  onConfirm: () => void;
  onRestart: () => void;
  onShowHistoricalEvent: (eventId: string) => void;
};

function yearLabel(year: number, approximate: boolean, era: EraNotation): string {
  return `${approximate ? 'c. ' : ''}${formatYear(year, era)}`;
}

/** The decision turn: context, choices with effects and prerequisites, confirmation, then the consequences. */
export function DecisionPanel({
  scenario,
  ui,
  era,
  historicalEvents,
  limitation,
  onSelect,
  onConfirm,
  onRestart,
  onShowHistoricalEvent,
}: DecisionPanelProps) {
  const headingId = useId();
  const node = getCurrentNode(scenario, ui.state);
  const lastRecord = ui.state.records[ui.state.records.length - 1];

  return (
    <section aria-labelledby={headingId} className="border border-dashed border-burgundy-bright/50 bg-night p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FictionBadge />
        {limitation ? <p className="font-sans text-xs text-parchment-muted">{limitation}</p> : null}
      </div>

      {node.kind === 'decision' ? (
        <DecisionTurn
          headingId={headingId}
          scenario={scenario}
          ui={ui}
          era={era}
          historicalEvents={historicalEvents}
          onSelect={onSelect}
          onConfirm={onConfirm}
          onShowHistoricalEvent={onShowHistoricalEvent}
        />
      ) : (
        <div>
          {lastRecord ? (
            <Outcome scenario={scenario} record={lastRecord} era={era} headingId={headingId} />
          ) : (
            <h2 id={headingId} className="mt-4 text-2xl text-parchment">
              {node.title}
            </h2>
          )}
          <div className="mt-6 border-t border-rule-soft pt-5">
            <p className="font-sans text-sm text-gold">{yearLabel(node.year, node.yearApproximate, era)}</p>
            <h3 className="mt-1 text-xl text-parchment">{node.title}</h3>
            <p className="mt-2 text-parchment-muted">{node.summary}</p>
          </div>
          <button type="button" className="btn btn-secondary mt-6" onClick={onRestart}>
            Start over
          </button>
        </div>
      )}
    </section>
  );
}

type DecisionTurnProps = Omit<DecisionPanelProps, 'onRestart' | 'limitation'> & { headingId: string };

function DecisionTurn({
  headingId,
  scenario,
  ui,
  era,
  historicalEvents,
  onSelect,
  onConfirm,
  onShowHistoricalEvent,
}: DecisionTurnProps) {
  const node = getCurrentNode(scenario, ui.state);
  const radioName = useId();
  const hintId = useId();
  if (node.kind !== 'decision') return null;
  const evaluations = evaluateChoices(scenario, ui.state);
  const selected = evaluations.find((item) => item.choice.id === ui.selectedChoiceId);
  const contextEvents = node.historicalContextIds
    .map((id) => historicalEvents.find((event) => event.id === id))
    .filter((event): event is HistoricalEvent => event !== undefined);

  return (
    <div>
      <p className="mt-4 font-sans text-sm text-gold">
        Decision {decisionNumber(scenario, node.id)} of {scenario.plannedDecisionCount}, {yearLabel(node.year, node.yearApproximate, era)}
      </p>
      <h2 id={headingId} className="mt-1 text-[clamp(1.5rem,3.5vw,2rem)] text-parchment">
        {node.title}
      </h2>
      <p className="mt-3 max-w-[40rem]">{node.context}</p>

      {contextEvents.length > 0 ? (
        <div className="mt-4">
          <p className="font-sans text-xs font-semibold text-teal-bright">Set against these sourced events</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {contextEvents.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onShowHistoricalEvent(event.id)}
                  className="inline-flex min-h-11 cursor-pointer items-center border border-teal-bright/50 px-3 text-left font-sans text-sm text-teal-bright hover:border-teal-bright"
                >
                  {event.date.year}: {event.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <fieldset className="mt-6" aria-describedby={hintId}>
        <legend className="text-xl text-parchment">{node.prompt}</legend>
        <p id={hintId} className="control-label mt-1">
          Pick an option to see its effects. You can change your mind until you confirm.
        </p>
        <div className="mt-4 grid gap-3">
          {evaluations.map(({ choice, available, requirements, projected }) => {
            const checked = ui.selectedChoiceId === choice.id;
            return (
              <label
                key={choice.id}
                className={`block border p-4 transition-colors ${
                  !available
                    ? 'cursor-not-allowed border-rule-soft opacity-60'
                    : checked
                      ? 'cursor-pointer border-gold bg-gold/10'
                      : 'cursor-pointer border-rule-soft hover:border-rule'
                }`}
              >
                <span className="flex items-start gap-3">
                  <input
                    type="radio"
                    name={radioName}
                    value={choice.id}
                    checked={checked}
                    disabled={!available}
                    onChange={() => onSelect(choice.id)}
                    className="mt-1.5 size-4 shrink-0 accent-gold"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg leading-snug text-parchment">{choice.label}</span>
                    <span className="mt-1 block text-[0.9375rem] text-parchment-muted">{choice.rationale}</span>
                    <span className="mt-3 block">
                      <EffectChips effects={choice.effects} />
                    </span>
                    {requirements.length > 0 ? (
                      <span className="mt-3 block font-sans text-sm">
                        {requirements.map((check) => (
                          <span key={check.description} className={`block ${check.met ? 'text-parchment-muted' : 'text-burgundy-bright'}`}>
                            <span aria-hidden="true">{check.met ? '✓ ' : '✕ '}</span>
                            {check.met ? 'Requirement met: ' : 'Not available: '}
                            {check.description}
                          </span>
                        ))}
                      </span>
                    ) : null}
                    {choice.warning ? (
                      <span className="mt-2 block font-sans text-sm text-parchment-muted">
                        <span className="font-semibold text-burgundy-bright">Later risk: </span>
                        {choice.warning}
                      </span>
                    ) : null}
                    {checked && available ? (
                      <span className="mt-3 block border-t border-rule-soft pt-3">
                        <span className="block font-sans text-xs font-semibold text-parchment-muted">If you confirm</span>
                        <span className="mt-1 block">
                          <AppliedEffectList effects={projected} />
                        </span>
                      </span>
                    ) : null}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {ui.error ? (
        <p role="alert" className="mt-4 font-sans text-sm text-burgundy-bright">
          {ui.error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={!selected?.available}>
          Confirm decision
        </button>
        <p className="font-sans text-sm text-parchment-muted">
          {selected ? `Selected: ${selected.choice.label}` : 'No option selected yet.'}
        </p>
      </div>
    </div>
  );
}

function Outcome({
  scenario,
  record,
  era,
  headingId,
}: {
  scenario: AlternateScenario;
  record: ChoiceRecord;
  era: EraNotation;
  headingId: string;
}) {
  const decision = getNode(scenario, record.decisionId);
  const choice = decision?.kind === 'decision' ? decision.choices.find((item) => item.id === record.choiceId) : undefined;
  return (
    <div role="status">
      <p className="mt-4 font-sans text-sm text-gold">
        Decision {decisionNumber(scenario, record.decisionId)} confirmed, {yearLabel(record.year, decision?.yearApproximate ?? false, era)}
      </p>
      <h2 id={headingId} className="mt-1 text-[clamp(1.5rem,3.5vw,2rem)] text-parchment">
        You chose: {choice?.label ?? record.choiceId}
      </h2>
      <div className="mt-4 max-w-md">
        <AppliedEffectList effects={record.effects} />
      </div>
      {record.flagsSet.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {record.flagsSet.map((flagId) => (
            <li key={flagId} className="border-l-2 border-gold/60 pl-3">
              <span className="block text-parchment">{flagLabel(scenario, flagId)}</span>
              <span className="block font-sans text-sm text-parchment-muted">
                {scenario.flags.find((flag) => flag.id === flagId)?.laterEffect}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
