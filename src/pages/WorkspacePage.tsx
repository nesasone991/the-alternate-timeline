import { useEffect, useMemo, useReducer } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { CampaignStatusBadge } from '../components/ui/Badges';
import { Icon } from '../components/ui/Icon';
import { getCampaignContent, type CampaignContent } from '../data/scenarios';
import { TimelinePanel } from '../features/history/TimelinePanel';
import {
  eventIndexAtYear,
  eventsInYear,
  initialPlaybackState,
  playbackReducer,
  tickInterval,
} from '../features/history/timelinePlayback';
import { useSettings } from '../features/settings/useSettings';
import { DecisionPanel } from '../features/simulation/DecisionPanel';
import { useSimulation } from '../features/simulation/useSimulation';
import { InfoPanel } from '../features/workspace/InfoPanel';
import { MapPlaceholder } from '../features/workspace/MapPlaceholder';
import { ModeTabs } from '../features/workspace/ModeTabs';
import { campaignPath, getCampaign, isCampaignSelectable } from '../lib/catalog';
import { formatYear } from '../lib/dates';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import type { CampaignSummary } from '../types/campaign';
import type { WorkspaceMode } from '../types/simulation';
import { NotFoundPage } from './NotFoundPage';

const MODES: readonly WorkspaceMode[] = ['real', 'alternate', 'comparison'];

function parseMode(value: string | null): WorkspaceMode {
  return MODES.find((mode) => mode === value) ?? 'real';
}

export default function WorkspacePage() {
  const { campaignId = '' } = useParams();
  const campaign = getCampaign(campaignId);
  const content = campaign && isCampaignSelectable(campaign) ? getCampaignContent(campaign.id) : undefined;
  useDocumentTitle(campaign && content ? `${campaign.title} workspace` : 'Campaign not found');

  if (!campaign || !content) return <NotFoundPage />;
  return <Workspace key={campaign.id} campaign={campaign} content={content} />;
}

function Workspace({ campaign, content }: { campaign: CampaignSummary; content: CampaignContent }) {
  const timeline = content.actualTimeline;
  const { eraNotation } = useSettings();

  const [searchParams, setSearchParams] = useSearchParams();
  const mode = parseMode(searchParams.get('mode'));
  const modeInfo = content.modes.find((item) => item.mode === mode);

  const reducer = useMemo(() => playbackReducer(timeline), [timeline]);
  const [playback, dispatch] = useReducer(reducer, timeline, (t) => initialPlaybackState(t, campaign.period.startYear));

  // Advance one year per tick while playing. Ticks never wait on animation.
  useEffect(() => {
    if (!playback.playing) return;
    const id = window.setInterval(() => dispatch({ type: 'tick' }), tickInterval(playback.speed));
    return () => window.clearInterval(id);
  }, [playback.playing, playback.speed]);

  // Leaving Real History stops playback.
  useEffect(() => {
    if (mode !== 'real') dispatch({ type: 'pause' });
  }, [mode]);

  const setMode = (next: WorkspaceMode) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'real') params.delete('mode');
    else params.set('mode', next);
    setSearchParams(params, { replace: true });
  };

  const scenario = content.alternateScenario;
  const simulation = useSimulation(scenario);
  const simState = simulation.ui?.state;
  const inAlternate = mode === 'alternate' && scenario !== undefined && simState !== undefined;

  // Real History follows the playback cursor. Alternate History shows what really
  // happened by the alternate timeline's current year, for contrast.
  const realIndex = inAlternate ? eventIndexAtYear(timeline, simState.year) : playback.eventIndex;
  const focusedEvent = realIndex >= 0 ? timeline.events[realIndex] : undefined;
  const sameYear = focusedEvent ? eventsInYear(timeline, focusedEvent.date.year) : [];

  const showHistoricalEvent = (eventId: string) => {
    const index = timeline.events.findIndex((event) => event.id === eventId);
    if (index >= 0) dispatch({ type: 'goToEvent', index });
    setMode('real');
  };

  const panelId = 'workspace-panel';

  return (
    <div className="mx-auto w-full max-w-[96rem] px-4 pt-6 sm:px-6">
      <div className="flex flex-col gap-4 border-b border-rule-soft pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to={campaignPath(campaign.id)} className="inline-flex min-h-11 items-center gap-2 font-sans text-sm text-parchment-muted no-underline hover:text-parchment">
            <Icon name="arrow-left" size={16} />
            Campaign overview
          </Link>
          <h1 className="inscription text-[clamp(1.5rem,4vw,2.25rem)] text-parchment">{campaign.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CampaignStatusBadge status={campaign.status} />
          </div>
        </div>
        <ModeTabs modes={content.modes} active={mode} onChange={setMode} panelId={panelId} />
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={`mode-tab-${mode}`}
        tabIndex={-1}
        className="mt-5 outline-none"
      >
        {modeInfo && !modeInfo.available ? (
          <div role="status" className="mb-5 border border-dashed border-burgundy-bright/60 bg-burgundy/20 p-4">
            <p className="font-serif text-lg text-parchment">{modeInfo.label} is not available yet.</p>
            <p className="mt-1 text-[0.9375rem]">{modeInfo.description}</p>
            <p className="mt-2 font-sans text-sm text-parchment-muted">{modeInfo.limitation}</p>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
          <div className="flex min-w-0 flex-col gap-5">
            {inAlternate && simulation.ui ? (
              <>
                <DecisionPanel
                  scenario={scenario}
                  ui={simulation.ui}
                  era={eraNotation}
                  historicalEvents={timeline.events}
                  limitation={modeInfo?.limitation}
                  notice={simulation.notice}
                  saveAvailable={simulation.saveAvailable}
                  onSelect={simulation.select}
                  onConfirm={simulation.confirm}
                  onRestart={simulation.restart}
                  onDiscardSave={simulation.discardSave}
                  onDismissNotice={simulation.dismissNotice}
                  onShowHistoricalEvent={showHistoricalEvent}
                />
                <div className="min-h-64">
                  <MapPlaceholder
                    year={simState.year}
                    era={eraNotation}
                    mode={mode}
                    positionLabel="Alternate timeline year (fiction)"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="min-h-72 sm:min-h-96 lg:h-[30rem]">
                  <MapPlaceholder year={playback.year} era={eraNotation} mode={mode} />
                </div>
                <TimelinePanel
                  timeline={timeline}
                  state={playback}
                  dispatch={dispatch}
                  era={eraNotation}
                  disabledReason={
                    mode === 'real' ? undefined : 'Timeline controls work in Real History mode. Switch back to use them.'
                  }
                />
              </>
            )}
          </div>
          <InfoPanel
            mode={mode}
            focusedEvent={focusedEvent}
            sameYearEvents={sameYear}
            onSelectEvent={(event) => {
              const index = timeline.events.indexOf(event);
              if (index >= 0) dispatch({ type: 'goToEvent', index });
            }}
            sources={content.sources}
            era={eraNotation}
            continuityNote={content.continuityNote?.text}
            historyTitle={
              inAlternate ? `What really happened by ${formatYear(simState.year, eraNotation)}` : undefined
            }
            simulation={inAlternate ? { scenario, state: simState } : undefined}
          />
        </div>
      </div>
    </div>
  );
}
