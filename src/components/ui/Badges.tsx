import type { CampaignStatus, FeatureStatus } from '../../types/campaign';
import type { Certainty } from '../../types/history';

const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; className: string }> = {
  preview: { label: 'Development preview', className: 'badge-preview' },
  playable: { label: 'Playable', className: 'badge-evidence' },
  'coming-soon': { label: 'Coming soon', className: 'badge-unavailable' },
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const { label, className } = CAMPAIGN_STATUS[status];
  return <span className={`badge ${className}`}>{label}</span>;
}

const FEATURE_STATUS: Record<FeatureStatus, { label: string; className: string }> = {
  available: { label: 'Available now', className: 'badge-evidence' },
  preview: { label: 'Preview', className: 'badge-preview' },
  planned: { label: 'Planned', className: 'badge-unavailable' },
};

export function FeatureStatusBadge({ status, phase }: { status: FeatureStatus; phase?: number }) {
  const { label, className } = FEATURE_STATUS[status];
  return (
    <span className={`badge ${className}`}>
      {label}
      {status === 'planned' && phase !== undefined ? ` for phase ${phase}` : null}
    </span>
  );
}

const CERTAINTY: Record<Certainty, { label: string; className: string; marker: string }> = {
  'well-attested': { label: 'Well attested', className: 'badge-evidence', marker: '●' },
  contested: { label: 'Contested', className: 'badge-fiction', marker: '◐' },
  approximate: { label: 'Approximate', className: 'badge-preview', marker: '○' },
};

export function CertaintyBadge({ certainty }: { certainty: Certainty }) {
  const { label, className, marker } = CERTAINTY[certainty];
  return (
    <span className={`badge ${className}`}>
      <span aria-hidden="true">{marker}</span>
      {label}
    </span>
  );
}

export function SourcedHistoryBadge() {
  return <span className="badge badge-evidence">Sourced history</span>;
}

export function FictionBadge() {
  return <span className="badge badge-fiction">Fictional alternate history</span>;
}
