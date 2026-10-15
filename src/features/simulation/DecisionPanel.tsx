import { useId } from 'react';
import { FictionBadge } from '../../components/ui/Badges';
import { formatYear, type EraNotation } from '../../lib/dates';
import type { HistoricalEvent } from '../../types/history';
import type {
  AlternateScenario,
  ChoiceRecord,
  PendingConsequence,
  ResolvedConsequence,
  ResolvedNarrative,
  SimulationState,
} from '../../types/simulation';
import { consequencesResolvedAt, decisionNumber, evaluateChoices, flagLabel, getCurrentNode, getNode } from './engine';
import { AppliedEffectList, EffectChips } from './EffectList';
import type { SaveNotice, SimulationUiState } from './useSimulation';

type DecisionPanelProps = {
  scenario: AlternateScenario;
  ui: SimulationUiState;
  era: EraNotation;
  /** Actual-history events, used only to label context links. */
  historicalEvents: readonly HistoricalEvent[];
  limitation?: string;
  notice: SaveNotice | null;
  saveAvailable: boolean;
  onSelect: (choiceId: string) => void;
  onConfirm: () => void;
  onRestart: () => void;
  onDiscardSave: () => void;
  onDismissNotice: () => void;
  onShowHistoricalEvent: (eventId: string) => void;
};

function yearLabel(year: number, approximate: boolean, era: EraNotation): string {
  return `${approximate ? 'c. ' : ''}${formatYear(year, era)}`;
}

function choiceLabel(scenario: AlternateScenario, decisionId: string, choiceId: string): string {
  const node = getNode(scenario, decisionId);
  return node?.kind === 'decision' ? (node.choices.find((c) => c.id === choiceId)?.label ?? choiceId) : choiceId;
}

/** The decision turn: what carried over, the situation, the options, confirmation and the outcome. */
export function DecisionPanel(props: DecisionPanelProps) {
  const { scenario, ui, era, limitation, notice, saveAvailable, onRestart, onDiscardSave, onDismissNotice } = props;
  const headingId = useId();
  const node = getCurrentNode(scenario, ui.state);
  const lastRecord = ui.state.records[ui.state.records.length - 1];
  const arrivals = consequencesResolvedAt(ui.state, node.id);

  return (
    <section
      aria-labelledby={headingId}
      data-testid="decision-panel"
      className="border border-dashed border-burgundy-bright/50 bg-night p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FictionBadge />
        {limitation ? <p className="font-sans text-xs text-parchment-muted">{limitation}</p> : null}
      </div>

      {notice ? <SaveNoticeBanner notice={notice} onDiscard={onDiscardSave} onDismiss={onDismissNotice} /> : null}

      {node.kind === 'decision' ? (
        <>
          <p className="mt-4 font-sans text-sm text-gold">
            Decision {decisionNumber(scenario, node.id)} of {scenario.plannedDecisionCount},{' '}
            {yearLabel(node.year, node.yearApproximate, era)}
          </p>
          <h2 id={headingId} className="mt-1 text-[clamp(1.5rem,3.5vw,2rem)] text-parchment">
            {node.title}
          </h2>
          <OrderOfEvents
            year={yearLabel(node.year, node.yearApproximate, era)}
            arrivals={arrivals.length}
            first={ui.state.records.length === 0}
          />
          <CarriedOver scenario={scenario} state={ui.state} lastRecord={lastRecord} arrivals={arrivals} era={era} />
          <DecisionTurn {...props} />
        </>
      ) : (
        <>
          {lastRecord ? (
            <LastOutcome scenario={scenario} record={lastRecord} era={era} headingId={headingId} prominent />
          ) : (
            <h2 id={headingId} className="mt-4 text-2xl text-parchment">
              {node.title}
            </h2>
          )}
          {arrivals.length > 0 ? <Arrivals scenario={scenario} items={arrivals} era={era} /> : null}
          <Pending scenario={scenario} items={ui.state.pending} era={era} />
          <div className="mt-6 border-t border-rule-soft pt-5">
            <p className="font-sans text-sm text-gold">{yearLabel(node.year, node.yearApproximate, era)}</p>
            <h3 className="mt-1 text-xl text-parchment">{node.title}</h3>
            <p className="mt-2 text-parchment-muted">{node.summary}</p>
          </div>
        </>
      )}

      {ui.state.records.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-rule-soft pt-5">
          <button type="button" className="btn btn-secondary" onClick={onRestart}>
            Start over
          </button>
          <p className="font-sans text-sm text-parchment-muted" data-testid="save-status">
            {saveAvailable
              ? 'Progress is saved in this browser after each decision.'
              : 'This browser is blocking storage, so progress will be lost on refresh.'}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function SaveNoticeBanner({
  notice,
  onDiscard,
  onDismiss,
}: {
  notice: SaveNotice;
  onDiscard: () => void;
  onDismiss: () => void;
}) {
  if (notice.kind === 'restored') {
    const when = notice.savedAt ? new Date(notice.savedAt) : null;
    return (
      <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-3 border-l-2 border-teal-bright pl-3">
        <p className="font-sans text-sm">
          Your progress was restored from this browser
          {when ? ` (saved ${when.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })})` : ''}.
        </p>
        <button type="button" className="btn btn-quiet" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    );
  }
  return (
    <div role="alert" className="mt-4 border border-burgundy-bright/60 bg-burgundy/20 p-4">
      <p className="font-serif text-lg text-parchment">Your saved game could not be loaded.</p>
      <p className="mt-1 font-sans text-sm">{notice.reason} You are starting a new game.</p>
      <p className="mt-1 font-sans text-sm text-parchment-muted">
        The old save is kept until you discard it or confirm a new decision.
      </p>
      <button type="button" className="btn btn-secondary mt-3" onClick={onDiscard}>
        Discard saved game
      </button>
    </div>
  );
}

/**
 * The fixed order of a turn, spelled out so the numbers on screen are never
 * ambiguous: consequences due by this year have ALREADY been applied (and are
 * included in the statistics) before the player decides.
 */
function OrderOfEvents({ year, arrivals, first }: { year: string; arrivals: number; first: boolean }) {
  return (
    <div className="mt-4 border-l-2 border-teal-bright/70 pl-3" data-testid="order-of-events">
      <p className="font-sans text-xs font-semibold text-parchment-muted">Order of events in {year}</p>
      <ol className="mt-1 list-decimal space-y-0.5 pl-5 font-sans text-sm">
        <li>
          {first
            ? 'Nothing from earlier decisions is due yet.'
            : arrivals > 0
              ? `Consequences due by ${year} take effect first: ${arrivals === 1 ? '1 has' : `${arrivals} have`} arrived (listed below). The statistics already include them.`
              : `No earlier consequences were due by ${year}.`}
        </li>
        <li>You make this decision. Its immediate effects apply as soon as you confirm.</li>
        <li>Its later consequences arrive in the years shown, before the decision of that year.</li>
      </ol>
    </div>
  );
}

/** What the previous decisions established: last outcome, consequences that just arrived, standing flags, what is still to come. */
function CarriedOver({
  scenario,
  state,
  lastRecord,
  arrivals,
  era,
}: {
  scenario: AlternateScenario;
  state: SimulationState;
  lastRecord: ChoiceRecord | undefined;
  arrivals: readonly ResolvedConsequence[];
  era: EraNotation;
}) {
  if (!lastRecord) return null;
  return (
    <div className="mt-5 border border-rule/40 bg-ink/40 p-4" data-testid="carried-over">
      <h3 className="font-sans text-sm font-semibold text-parchment-muted">What carries into this decision</h3>
      <LastOutcome scenario={scenario} record={lastRecord} era={era} />
      {arrivals.length > 0 ? <Arrivals scenario={scenario} items={arrivals} era={era} /> : null}
      {state.flags.length > 0 ? (
        <div className="mt-4">
          <p className="font-sans text-xs font-semibold text-parchment-muted">Established by your decisions</p>
          <ul className="mt-1 space-y-1 text-[0.9375rem]">
            {state.flags.map((flag) => (
              <li key={flag} className="border-l-2 border-gold/60 pl-3">
                {flagLabel(scenario, flag)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Pending scenario={scenario} items={state.pending} era={era} />
    </div>
  );
}

function LastOutcome({
  scenario,
  record,
  era,
  headingId,
  prominent = false,
}: {
  scenario: AlternateScenario;
  record: ChoiceRecord;
  era: EraNotation;
  headingId?: string;
  prominent?: boolean;
}) {
  const decision = getNode(scenario, record.decisionId);
  const choice = decision?.kind === 'decision' ? decision.choices.find((item) => item.id === record.choiceId) : undefined;
  const label = choice?.label ?? record.choiceId;
  return (
    <div className={prominent ? '' : 'mt-3'} data-testid="last-outcome">
      <p className={`font-sans text-sm text-gold ${prominent ? 'mt-4' : ''}`}>
        Decision {decisionNumber(scenario, record.decisionId)}
        {decision ? `, ${decision.title}` : ''}, {yearLabel(record.year, decision?.yearApproximate ?? false, era)}
      </p>
      {prominent ? (
        <h2 id={headingId} className="mt-1 text-[clamp(1.5rem,3.5vw,2rem)] text-parchment">
          You chose: {label}
        </h2>
      ) : (
        <p className="mt-1 text-lg text-parchment">You chose: {label}</p>
      )}
      {choice ? (
        <p className="mt-2 max-w-[40rem] text-[0.9375rem]">
          <span className="font-sans text-xs font-semibold text-parchment-muted">Why: </span>
          {choice.outcome}
        </p>
      ) : null}
      <div className="mt-3 max-w-md">
        <AppliedEffectList effects={record.effects} />
      </div>
      {record.conditional.length > 0 ? (
        <ul className="mt-2 space-y-1 font-sans text-sm text-parchment-muted">
          {record.conditional.map((item) => (
            <li key={item.id}>{item.explanation}</li>
          ))}
        </ul>
      ) : null}
      {record.narrative ? <NarrativeReport narrative={record.narrative} /> : null}
    </div>
  );
}

const IMPACT_LABEL = { gains: 'Gains', loses: 'Loses', mixed: 'Mixed' } as const;
const IMPACT_STYLE = {
  gains: 'border-teal-bright text-teal-bright',
  loses: 'border-burgundy-bright text-burgundy-bright',
  mixed: 'border-gold text-gold',
} as const;

/** The authored, state-dependent report on a decision. Fiction, never presented as sourced history. */
function NarrativeReport({ narrative }: { narrative: ResolvedNarrative }) {
  return (
    <div className="mt-4 max-w-[40rem] border border-dashed border-burgundy-bright/40 p-4" data-testid="narrative-report">
      <p className="font-sans text-xs font-semibold text-parchment-muted">
        Report to the council — invented for this alternate timeline, not sourced history
      </p>
      <dl className="mt-2 space-y-3 text-[0.9375rem]">
        <div>
          <dt className="font-sans text-xs font-semibold text-gold">Your orders</dt>
          <dd className="mt-0.5">{narrative.ordered}</dd>
        </div>
        <div>
          <dt className="font-sans text-xs font-semibold text-gold">Effect on the empire</dt>
          <dd className="mt-0.5">{narrative.effect}</dd>
        </div>
        <div>
          <dt className="font-sans text-xs font-semibold text-gold">Who gains and who loses</dt>
          <dd className="mt-1">
            <ul className="space-y-1.5">
              {narrative.stakeholders.map((item) => (
                <li key={item.id} className="flex flex-wrap items-baseline gap-x-2">
                  <span
                    className={`inline-block min-w-[4.25rem] border px-1.5 text-center font-sans text-xs font-semibold ${IMPACT_STYLE[item.impact]}`}
                  >
                    {IMPACT_LABEL[item.impact]}
                  </span>
                  <span>
                    <span className="text-parchment">{item.group}:</span> {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt className="font-sans text-xs font-semibold text-gold">Still uncertain</dt>
          <dd className="mt-0.5">{narrative.uncertainty}</dd>
        </div>
      </dl>
    </div>
  );
}

function Arrivals({
  scenario,
  items,
  era,
}: {
  scenario: AlternateScenario;
  items: readonly ResolvedConsequence[];
  era: EraNotation;
}) {
  return (
    <div className="mt-4" data-testid="arrived-consequences">
      <p className="font-sans text-xs font-semibold text-parchment-muted">Consequences that have now arrived</p>
      <ul className="mt-1 space-y-3">
        {items.map((item) => (
          <li key={item.consequenceId} className={`border-l-2 pl-3 ${item.triggered ? 'border-gold/70' : 'border-rule'}`}>
            <span className="block text-[0.9375rem] text-parchment">{item.explanation}</span>
            <span className="block font-sans text-xs text-parchment-muted">
              From decision {decisionNumber(scenario, item.sourceDecisionId)}:{' '}
              {choiceLabel(scenario, item.sourceDecisionId, item.sourceChoiceId)}, {yearLabel(item.resolvedYear, true, era)}
              {item.triggered ? '' : '. No effect.'}
            </span>
            {item.effects.length > 0 ? (
              <div className="mt-1 max-w-md">
                <AppliedEffectList effects={item.effects} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Pending({
  scenario,
  items,
  era,
}: {
  scenario: AlternateScenario;
  items: readonly PendingConsequence[];
  era: EraNotation;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4" data-testid="pending-consequences">
      <p className="font-sans text-xs font-semibold text-parchment-muted">Still to come</p>
      <ul className="mt-1 space-y-2">
        {items.map((item) => (
          <li key={item.consequenceId} className="border-l-2 border-dashed border-rule pl-3 text-[0.9375rem]">
            <span className="block">{item.hint}</span>
            <span className="block font-sans text-xs text-parchment-muted">
              Expected {yearLabel(item.dueYear, true, era)}, from decision {decisionNumber(scenario, item.sourceDecisionId)}:{' '}
              {choiceLabel(scenario, item.sourceDecisionId, item.sourceChoiceId)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DecisionTurn({ scenario, ui, era, historicalEvents, onSelect, onConfirm, onShowHistoricalEvent }: DecisionPanelProps) {
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
      <h3 className="mt-6 font-sans text-sm font-semibold text-parchment-muted">The situation</h3>
      <p className="mt-2 max-w-[40rem]">{node.context}</p>

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
          {evaluations.map(({ choice, available, requirements, applicableConditionals, projected }) => {
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

                    <span className="mt-3 block font-sans text-xs font-semibold text-parchment-muted">Immediately</span>
                    <span className="mt-1 block">
                      <EffectChips effects={choice.effects} />
                    </span>

                    {applicableConditionals.map((item) => (
                      <span key={item.id} className="mt-2 block border-l-2 border-gold/60 pl-3">
                        <span className="block font-sans text-sm text-parchment">{item.explanation}</span>
                        <span className="mt-1 block">
                          <EffectChips effects={item.effects} />
                        </span>
                      </span>
                    ))}

                    {requirements.length > 0 ? (
                      <span className="mt-3 block font-sans text-sm">
                        {requirements.map((check) => (
                          <span
                            key={check.description}
                            className={`block ${check.met ? 'text-parchment-muted' : 'text-burgundy-bright'}`}
                          >
                            <span aria-hidden="true">{check.met ? '✓ ' : '✕ '}</span>
                            {check.met ? 'Requirement met: ' : 'Not available: '}
                            {check.description}
                          </span>
                        ))}
                      </span>
                    ) : null}

                    {(choice.consequences ?? []).length > 0 ? (
                      <span className="mt-3 block">
                        <span className="block font-sans text-xs font-semibold text-parchment-muted">Later</span>
                        {(choice.consequences ?? []).map((item) => (
                          <span key={item.id} className="mt-1 block font-sans text-sm text-parchment-muted">
                            <span className="text-parchment">{yearLabel(item.dueYear, true, era)}:</span> {item.hint}
                          </span>
                        ))}
                      </span>
                    ) : null}

                    {choice.warning ? (
                      <span className="mt-2 block font-sans text-sm text-parchment-muted">
                        <span className="font-semibold text-burgundy-bright">Risk: </span>
                        {choice.warning}
                      </span>
                    ) : null}

                    {checked && available ? (
                      <span className="mt-3 block border-t border-rule-soft pt-3">
                        <span className="block font-sans text-xs font-semibold text-parchment-muted">If you confirm now</span>
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
