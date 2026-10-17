import { FictionBadge } from '../../components/ui/Badges';
import { formatYear, toRomanNumeral, type EraNotation } from '../../lib/dates';
import type { EndingCheck, EndingClassification } from '../simulation/engine';
import type { EndingReport } from '../simulation/endings';
import { EndingSeal } from './EndingSeal';
import { ENDING_THEMES } from './endingThemes';

/** The cinematic opening: the ending, why it happened, in this campaign's own terms. */
export function FateHero({
  report,
  classification,
  campaignTitle,
  lastChoiceLabel,
  era,
}: {
  report: EndingReport;
  classification: EndingClassification;
  campaignTitle: string;
  lastChoiceLabel: string;
  era: EraNotation;
}) {
  const theme = ENDING_THEMES[report.category];
  // For an ending reached by an unconditional rule, the reason is what the
  // better outcomes lacked: the unmet conditions of the first rule checked.
  const shortfalls: EndingCheck[] =
    report.conditions.length > 0
      ? []
      : (classification.evaluated.find((item) => !item.matched)?.checks.filter((check) => !check.met) ?? []);

  return (
    <header
      className="relative overflow-hidden border-b border-rule-soft"
      style={{ backgroundImage: theme.wash }}
      data-testid="fate-hero"
      data-ending-category={report.category}
    >
      <div className="container-page grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="order-2 lg:order-1">
          <div className="flex flex-wrap items-center gap-3">
            <FictionBadge />
            <span className="font-sans text-sm text-parchment-muted">{campaignTitle}: the fate of your empire</span>
          </div>
          <p className="mt-6 text-[clamp(1.25rem,3vw,1.75rem)] text-parchment-muted">{theme.atmosphere}</p>
          <h1 className="inscription mt-2 text-[clamp(2.5rem,8vw,5.25rem)] text-parchment" data-testid="ending-title">
            {report.title}
          </h1>
          <div className="mt-4 h-px w-24" style={{ backgroundColor: theme.accent }} aria-hidden="true" />
          <p className="mt-5 max-w-[40rem] text-[1.125rem] leading-relaxed" data-testid="ending-introduction">
            {theme.introduction} {report.settlement}
          </p>
          <div className="mt-5 max-w-[40rem] font-sans text-[0.9375rem]" data-testid="ending-why">
            <p>
              <span className="font-semibold text-parchment">Why: </span>
              {report.why}
            </p>
            {report.conditions.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2" aria-label="Measures that held">
                {report.conditions.filter((check) => /\(you have \d+\)$/.test(check.description)).map((check) => (
                  <li key={check.description} className="border border-rule/60 px-2 py-0.5 text-sm text-parchment-muted">
                    <span aria-hidden="true">✓ </span>
                    {check.description}
                  </li>
                ))}
              </ul>
            ) : shortfalls.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2" aria-label="What a better outcome needed">
                {shortfalls.map((check) => (
                  <li key={check.description} className="border border-burgundy-bright/60 px-2 py-0.5 text-sm">
                    <span className="sr-only">Not met: </span>
                    <span aria-hidden="true">✕ </span>
                    {check.description}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <dl className="mt-6 grid max-w-[40rem] grid-cols-1 gap-3 font-sans text-sm sm:grid-cols-3">
            <div>
              <dt className="text-parchment-muted">Your last decision</dt>
              <dd className="text-parchment">{lastChoiceLabel}</dd>
            </div>
            <div>
              <dt className="text-parchment-muted">Threats still looming</dt>
              <dd className="text-parchment">{report.looming.length === 0 ? 'None' : report.looming.length}</dd>
            </div>
            <div>
              <dt className="text-parchment-muted">Costs left unpaid</dt>
              <dd className="text-parchment">{report.unpaidCosts.length === 0 ? 'None' : report.unpaidCosts.length}</dd>
            </div>
          </dl>
        </div>
        <div className="order-1 mx-auto w-40 sm:w-56 lg:order-2 lg:w-full lg:max-w-[22rem]">
          <EndingSeal category={report.category} numeral={toRomanNumeral(report.year)} />
          <p className="mt-2 text-center font-sans text-xs text-parchment-muted">{formatYear(report.year, era)}</p>
        </div>
      </div>
    </header>
  );
}
