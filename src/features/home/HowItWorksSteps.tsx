import { toRomanNumeral } from '../../lib/dates';

export type Step = {
  readonly title: string;
  readonly summary: string;
  readonly detail: string;
  readonly status: string;
};

/** The four-step loop. It is a genuine sequence, so it is numbered. */
export const HOW_IT_WORKS_STEPS: readonly Step[] = [
  {
    title: 'Discover Real History',
    summary: 'Follow the documented events, year by year, with sources and caveats.',
    detail:
      'Each event shows how precisely it is dated, how firmly it is attested and where historians disagree. Nothing you do later can change this record.',
    status: 'Available now as a sourced timeline. The interactive map comes later.',
  },
  {
    title: 'Change a Decision',
    summary: 'Step in at a turning point and choose a different course.',
    detail:
      'Every option has a cost. Some require resources you may not have; some close doors that stay closed.',
    status: 'In development.',
  },
  {
    title: 'Simulate the Consequences',
    summary: 'See how your choices ripple forward through the following decades.',
    detail:
      'Outcomes come from authored, deterministic rules — the same choices always produce the same result — so you can trace exactly why things turned out as they did.',
    status: 'In development.',
  },
  {
    title: 'Compare Both Timelines',
    summary: 'Set your timeline beside the real one at the same date.',
    detail:
      'Fiction is always labelled as fiction, and every comparison links back to the sourced events it departs from.',
    status: 'In development.',
  },
];

export function HowItWorksSteps({ detailed = false }: { detailed?: boolean }) {
  return (
    <ol className="grid gap-px overflow-hidden border border-rule/50 bg-rule/30 sm:grid-cols-2 lg:grid-cols-4">
      {HOW_IT_WORKS_STEPS.map((step, index) => (
        <li key={step.title} className="flex flex-col bg-night p-6">
          <span aria-hidden="true" className="inscription text-3xl text-gold">
            {toRomanNumeral(index + 1)}
          </span>
          <h3 className="mt-4 text-xl text-parchment">
            <span className="sr-only">Step {index + 1}: </span>
            {step.title}
          </h3>
          <p className="mt-2 text-parchment-muted">{step.summary}</p>
          {detailed ? (
            <>
              <p className="mt-3">{step.detail}</p>
              <p className="mt-auto pt-4 font-sans text-sm text-gold">{step.status}</p>
            </>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
