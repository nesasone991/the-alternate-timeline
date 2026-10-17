import { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { getCampaignContent } from '../data/scenarios';
import { EndingExperience } from '../features/ending/EndingExperience';
import { useSettings } from '../features/settings/useSettings';
import { replay } from '../features/simulation/engine';
import { loadSave } from '../features/simulation/savegame';
import { getCampaign, isCampaignSelectable, workspacePath } from '../lib/catalog';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import type { AlternateScenario } from '../types/simulation';
import { NotFoundPage } from './NotFoundPage';

type Found = { readonly kind: 'ended'; readonly choices: readonly string[] } | { readonly kind: 'unfinished' } | { readonly kind: 'none'; readonly reason?: string };

/** Choices handed over by the workspace, used only if they replay to an ending (e.g. when storage is blocked). */
function choicesFromNavigation(scenario: AlternateScenario, value: unknown): readonly string[] | undefined {
  if (!value || typeof value !== 'object' || !Object.prototype.hasOwnProperty.call(value, 'choices')) return undefined;
  const choices = (value as { choices: unknown }).choices;
  if (!Array.isArray(choices) || choices.length > 32 || !choices.every((item) => typeof item === 'string')) return undefined;
  try {
    return replay(scenario, choices).endingId ? choices : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The ending of a finished campaign. The saved game is the source of truth; it
 * is read, never written, except by the confirmed "start a new timeline".
 */
export default function EndingPage() {
  const { campaignId = '' } = useParams();
  const location = useLocation();
  const { eraNotation } = useSettings();
  const campaign = getCampaign(campaignId);
  const content = campaign && isCampaignSelectable(campaign) ? getCampaignContent(campaign.id) : undefined;
  const scenario = content?.alternateScenario;

  const found: Found = useMemo(() => {
    if (!scenario) return { kind: 'none' };
    const saved = loadSave(scenario);
    if (saved.status === 'restored') {
      if (saved.state.endingId) return { kind: 'ended', choices: saved.state.choicesMade };
    }
    const passed = choicesFromNavigation(scenario, location.state);
    if (passed) return { kind: 'ended', choices: passed };
    if (saved.status === 'restored') return { kind: 'unfinished' };
    if (saved.status === 'incompatible' || saved.status === 'corrupt') return { kind: 'none', reason: saved.reason };
    return { kind: 'none' };
  }, [scenario, location.state]);

  useDocumentTitle(campaign && content ? (found.kind === 'ended' ? 'The fate of your empire' : `${campaign.title}: no ending yet`) : 'Campaign not found');

  if (!campaign || !content || !scenario) return <NotFoundPage />;

  if (found.kind !== 'ended') {
    return (
      <div className="container-page py-16">
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] text-parchment">
          {found.kind === 'unfinished' ? 'Your campaign has not reached an ending yet' : 'There is no finished campaign here yet'}
        </h1>
        <p className="mt-3 max-w-[40rem]">
          {found.kind === 'unfinished'
            ? 'Your saved campaign is still in progress. Make the remaining decisions to see how your timeline ends.'
            : 'The ending of a campaign appears here once all five decisions are made. Progress is saved in this browser.'}
        </p>
        {found.kind === 'none' && found.reason ? <p className="mt-2 font-sans text-sm text-parchment-muted">{found.reason}</p> : null}
        <Link to={`${workspacePath(campaign.id)}?mode=alternate`} className="btn btn-primary mt-6">
          {found.kind === 'unfinished' ? 'Continue your campaign' : 'Play the campaign'}
        </Link>
      </div>
    );
  }

  return <EndingExperience campaign={campaign} content={content} scenario={scenario} choices={found.choices} era={eraNotation} />;
}
