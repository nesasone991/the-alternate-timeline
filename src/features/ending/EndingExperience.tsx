import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import type { CampaignContent } from '../../data/scenarios';
import { workspacePath } from '../../lib/catalog';
import type { EraNotation } from '../../lib/dates';
import type { CampaignSummary } from '../../types/campaign';
import type { AlternateScenario } from '../../types/simulation';
import { classifyEnding, getNode } from '../simulation/engine';
import { buildEndingReport } from '../simulation/endings';
import { clearSave } from '../simulation/savegame';
import { replayWithEvents, resourceTimeline } from '../simulation/storyEvents';
import { DecisionReview } from './DecisionReview';
import { FateHero } from './FateHero';
import { ReplayPanel } from './ReplayPanel';
import { ResourceHistory } from './ResourceHistory';
import { RestartDialog } from './RestartDialog';
import { WhatReallyHappened } from './WhatReallyHappened';
import { WorldReport } from './WorldReport';

const SECTIONS = [
  { id: 'empire-in-476', title: 'Your empire in 476' },
  { id: 'decisions', title: 'The decisions that changed history' },
  { id: 'world', title: 'The world you created' },
  { id: 'what-really-happened', title: 'What really happened' },
  { id: 'replay', title: 'Replay and restart' },
] as const;

/** Years of recorded history set against the ending. */
const HISTORY_FROM = 474;
const HISTORY_TO = 480;

/**
 * The ending experience. Everything shown is derived from one deterministic
 * replay of the saved choices: the final state, the event stream, the resource
 * history and the structured ending report. Nothing here writes to the save
 * except the explicit, confirmed "start a new timeline".
 */
export function EndingExperience({
  campaign,
  content,
  scenario,
  choices,
  era,
}: {
  campaign: CampaignSummary;
  content: CampaignContent;
  scenario: AlternateScenario;
  choices: readonly string[];
  era: EraNotation;
}) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  const data = useMemo(() => {
    const { state, events } = replayWithEvents(scenario, choices);
    return {
      state,
      events,
      report: buildEndingReport(scenario, state),
      classification: classifyEnding(scenario, state)!,
      points: resourceTimeline(scenario, choices),
    };
  }, [scenario, choices]);

  const { state, events, report, classification, points } = data;
  const lastRecord = state.records[state.records.length - 1];
  const lastNode = lastRecord ? getNode(scenario, lastRecord.decisionId) : undefined;
  const lastChoiceLabel =
    lastNode?.kind === 'decision' ? (lastNode.choices.find((c) => c.id === lastRecord?.choiceId)?.label ?? '') : '';
  const historyEvents = content.actualTimeline.events.filter(
    (event) => event.date.year >= HISTORY_FROM && event.date.year <= HISTORY_TO,
  );
  const realHistoryHref = (eventId: string) => `${workspacePath(campaign.id)}?event=${encodeURIComponent(eventId)}`;

  const restart = () => {
    clearSave(scenario);
    setConfirming(false);
    navigate(`${workspacePath(campaign.id)}?mode=alternate`);
  };

  return (
    <div className="pb-16" data-testid="ending-experience">
      <FateHero
        report={report}
        classification={classification}
        campaignTitle={campaign.title}
        lastChoiceLabel={lastChoiceLabel}
        era={era}
      />

      <nav aria-label="On this page" className="border-b border-rule-soft bg-ink/80">
        <ul className="container-page flex flex-wrap gap-x-5 gap-y-0 py-1 font-sans text-sm">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="inline-flex min-h-11 items-center text-parchment-muted no-underline hover:text-parchment">
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="container-page">
        <section id="empire-in-476" aria-labelledby="empire-title" className="scroll-mt-20 pt-12">
          <h2 id="empire-title" className="text-[clamp(1.75rem,4vw,2.5rem)] text-parchment">
            Your empire in 476
          </h2>
          <p className="mt-2 max-w-[42rem] text-parchment-muted">
            Where the four measures of your empire stood at the settlement, and how they got there. They are game
            measures on a 0–100 scale, not historical figures.
          </p>
          <div className="mt-6">
            <ResourceHistory points={points} finalResources={state.resources} era={era} />
          </div>
        </section>

        <section id="decisions" aria-labelledby="decisions-title" className="scroll-mt-20 pt-16">
          <h2 id="decisions-title" className="text-[clamp(1.75rem,4vw,2.5rem)] text-parchment">
            The decisions that changed history
          </h2>
          <p className="mt-2 mb-8 max-w-[42rem] text-parchment-muted">
            Your five decisions in order, with what each did at once and what it set in motion later.
          </p>
          <DecisionReview
            scenario={scenario}
            state={state}
            report={report}
            era={era}
            historicalEvents={content.actualTimeline.events}
            realHistoryHref={realHistoryHref}
          />
        </section>

        <section id="world" aria-labelledby="world-title" className="scroll-mt-20 pt-16">
          <h2 id="world-title" className="text-[clamp(1.75rem,4vw,2.5rem)] text-parchment">
            The world you created
          </h2>
          <p className="mt-2 mb-6 max-w-[42rem] text-parchment-muted">The West after the settlement of 476, in your timeline.</p>
          <WorldReport scenario={scenario} state={state} report={report} classification={classification} era={era} />
        </section>

        <section id="what-really-happened" aria-labelledby="real-title" className="scroll-mt-20 pt-16">
          <h2 id="real-title" className="text-[clamp(1.75rem,4vw,2.5rem)] text-parchment">
            What really happened
          </h2>
          <p className="mt-2 mb-6 max-w-[42rem] text-parchment-muted">
            Your outcome is fiction. Here it stands beside the sourced record of the same years, {HISTORY_FROM} to{' '}
            {HISTORY_TO}.
          </p>
          <WhatReallyHappened
            report={report}
            events={historyEvents}
            sources={content.sources}
            continuityNote={content.continuityNote}
            era={era}
            realHistoryHref={realHistoryHref}
            lastChoiceLabel={lastChoiceLabel}
          />
        </section>

        <section id="replay" aria-labelledby="replay-title" className="scroll-mt-20 pt-16">
          <h2 id="replay-title" className="text-[clamp(1.75rem,4vw,2.5rem)] text-parchment">
            Replay and restart
          </h2>
          <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <ReplayPanel scenario={scenario} events={events} points={points} endingTitle={report.title} era={era} />
            <div>
              <h3 className="text-xl text-parchment">Start a new timeline</h3>
              <p className="mt-2">
                Play the campaign again from the first decision. Your current timeline and its saved progress will be
                erased; you will be asked to confirm.
              </p>
              <button type="button" className="btn btn-secondary mt-4" onClick={() => setConfirming(true)}>
                Start a new timeline
              </button>
            </div>
          </div>
        </section>
      </div>

      <RestartDialog open={confirming} onCancel={() => setConfirming(false)} onConfirm={restart} />
    </div>
  );
}
