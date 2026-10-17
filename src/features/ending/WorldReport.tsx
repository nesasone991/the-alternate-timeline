import { formatYear, type EraNotation } from '../../lib/dates';
import { RESOURCE_LABELS, type AlternateScenario, type SimulationState } from '../../types/simulation';
import { signed } from '../simulation/EffectList';
import { getNode, type EndingClassification } from '../simulation/engine';
import type { EndingReport } from '../simulation/endings';

const ASPECTS: readonly { key: 'imperialAuthority' | 'army' | 'economy' | 'regionalPowers' | 'constantinople'; label: string }[] = [
  { key: 'imperialAuthority', label: 'Imperial authority' },
  { key: 'army', label: 'The army' },
  { key: 'economy', label: 'The economy' },
  { key: 'regionalPowers', label: 'The regional powers' },
  { key: 'constantinople', label: 'Constantinople' },
];

/** "The world you created": the structured ending report, in readable pieces. */
export function WorldReport({
  scenario,
  state,
  report,
  classification,
  era,
}: {
  scenario: AlternateScenario;
  state: SimulationState;
  report: EndingReport;
  classification: EndingClassification;
  era: EraNotation;
}) {
  const earlier = classification.evaluated.filter((item) => !item.matched);
  const approximate = (decisionId: string) => {
    const node = getNode(scenario, decisionId);
    return node?.kind === 'decision' ? node.yearApproximate : false;
  };
  const endingTitle = (id: string) => scenario.endings?.find((ending) => ending.id === id)?.title ?? id;
  // Several rules can describe the same ending; explain each ending that was missed once, by its first rule.
  const missed = earlier.filter(
    (item, index) => item.rule.endingId !== report.endingId && earlier.findIndex((other) => other.rule.endingId === item.rule.endingId) === index,
  );

  return (
    <div data-testid="world-report">
      <p className="max-w-[44rem] text-[clamp(1.25rem,2.6vw,1.6rem)] leading-snug text-parchment" data-testid="world-settlement">
        {report.settlement}
      </p>

      <dl className="mt-8 grid gap-x-10 gap-y-6 md:grid-cols-2">
        {ASPECTS.map((aspect) => (
          <div key={aspect.key} className="border-t border-rule-soft pt-3" data-testid={`world-${aspect.key}`}>
            <dt className="font-sans text-sm font-semibold text-gold">{aspect.label}</dt>
            <dd className="mt-1 text-[1.0625rem]">{report[aspect.key]}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="key-decisions-title">
          <h3 id="key-decisions-title" className="text-xl text-parchment">
            The decisions that weighed most
          </h3>
          <p className="mt-1 font-sans text-sm text-parchment-muted">
            Ranked by how far each moved the resources this ending depended on, including its later consequences and any
            unpaid costs.
          </p>
          <ol className="mt-3 space-y-3">
            {report.keyDecisions.map((decision) => (
              <li key={decision.decisionId} className="border-l-2 border-gold/70 pl-3">
                <span className="block font-sans text-xs text-parchment-muted">
                  {approximate(decision.decisionId) ? 'c. ' : ''}
                  {formatYear(decision.year, era)}, {decision.decisionTitle}
                </span>
                <span className="block text-parchment">{decision.choiceLabel}</span>
                <span className="mt-1 block font-sans text-sm text-parchment-muted">
                  {decision.changes.length > 0
                    ? decision.changes.map((change) => `${RESOURCE_LABELS[change.resource]} ${signed(change.change)}`).join(', ')
                    : 'No net change'}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="threats-title" data-testid="world-threats">
          <h3 id="threats-title" className="text-xl text-parchment">
            Threats and unpaid costs
          </h3>
          {report.looming.length === 0 ? (
            <p className="mt-2">No serious threat hangs over the settlement as things stand.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {report.looming.map((item) => (
                <li key={item.consequenceId} className="border-l-2 border-burgundy-bright pl-3">
                  <span className="block font-sans text-xs text-parchment-muted">Due c. {formatYear(item.dueYear, era)}</span>
                  {item.hint}
                </li>
              ))}
            </ul>
          )}
          {report.unpaidCosts.length > 0 ? (
            <>
              <p className="mt-4 font-sans text-sm font-semibold text-parchment-muted">Costs the empire could not pay in full</p>
              <ul className="mt-1 space-y-1">
                {report.unpaidCosts.map((item) => (
                  <li key={item.flag}>{item.label}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-4 font-sans text-sm text-parchment-muted">The empire paid every cost in full.</p>
          )}
          {state.pending.length > report.looming.length ? (
            <p className="mt-4 font-sans text-sm text-parchment-muted">
              {state.pending.length - report.looming.length} later consequence
              {state.pending.length - report.looming.length === 1 ? ' is' : 's are'} still pending but would not strike as
              things stand.
            </p>
          ) : null}
        </section>
      </div>

      <details className="mt-10 border-t border-rule-soft pt-2" data-testid="why-this-ending">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-sans text-sm text-gold">
          How the ending was decided
        </summary>
        <div className="mt-3 grid gap-6 md:grid-cols-2">
          <div>
            <p className="font-sans text-sm font-semibold text-parchment">{report.title}: what held</p>
            <p className="mt-1 text-[0.9375rem]">{report.why}</p>
            {report.conditions.length > 0 ? (
              <ul className="mt-2 space-y-0.5 font-sans text-sm">
                {report.conditions.map((check) => (
                  <li key={check.description}>
                    <span aria-hidden="true">✓ </span>
                    {check.description}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {missed.length > 0 ? (
            <div>
              {missed.map((item) => (
                <div key={item.rule.id} className="mb-4">
                  <p className="font-sans text-sm font-semibold text-parchment">Why not {endingTitle(item.rule.endingId)}</p>
                  <ul className="mt-1 space-y-0.5 font-sans text-sm">
                    {item.checks
                      .filter((check) => !check.met)
                      .map((check) => (
                        <li key={check.description} className="text-burgundy-bright">
                          <span aria-hidden="true">✕ </span>
                          <span className="sr-only">Not met: </span>
                          {check.description}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <p className="mt-2 font-sans text-xs text-parchment-muted">
          Rules are checked in order and the first that holds decides the ending. All of this is game logic for a fictional
          alternate history.
        </p>
      </details>
    </div>
  );
}
