import type { Source } from '../../types/history';
import { Icon } from '../../components/ui/Icon';

type SourceLinksProps = {
  sourceIds: readonly string[];
  sources: readonly Source[];
  compact?: boolean;
};

const KIND_LABEL: Record<Source['kind'], string> = {
  primary: 'Primary source',
  scholarly: 'Scholarship',
  reference: 'Reference work',
  tertiary: 'Tertiary, needs corroboration',
};

export function SourceLinks({ sourceIds, sources, compact = false }: SourceLinksProps) {
  const resolved = sourceIds
    .map((id) => sources.find((source) => source.id === id))
    .filter((source): source is Source => source !== undefined);

  if (resolved.length === 0) {
    return <p className="font-sans text-sm text-burgundy-bright">No source recorded. This entry must not be published.</p>;
  }

  return (
    <ul className={`font-sans text-sm ${compact ? 'space-y-1' : 'space-y-2'}`}>
      {resolved.map((source) => (
        <li key={source.id}>
          {source.url ? (
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-link inline-flex items-start gap-1">
              <span>{source.citation}</span>
              <Icon name="external" size={14} className="mt-1 shrink-0" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : (
            <span>{source.citation}</span>
          )}
          {!compact ? <span className="block text-xs text-parchment-muted">{KIND_LABEL[source.kind]}</span> : null}
        </li>
      ))}
    </ul>
  );
}
