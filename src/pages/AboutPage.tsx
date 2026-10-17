import { PageHeader } from '../components/layout/PageHeader';
import { getCampaignContent, listCampaignContentIds } from '../data/scenarios';
import { SourceLinks } from '../features/history/SourceLinks';
import { getCampaign } from '../lib/catalog';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function AboutPage() {
  useDocumentTitle('About');
  return (
    <>
      <PageHeader
        title="About"
        lead={
          <p>
            The Alternate Timeline is an interactive historical experience by Tales of the Past. It is made for
            curious history readers, strategy players and creators who want accurate history alongside honest,
            clearly labelled speculation.
          </p>
        }
      />

      <div className="container-page grid gap-16 lg:grid-cols-2">
        <section aria-labelledby="principles-title">
          <h2 id="principles-title" className="text-2xl text-parchment">
            Principles
          </h2>
          <ul className="prose-atlas mt-4 list-disc space-y-3 pl-5">
            <li>Real history is sourced, dated only as precisely as the evidence allows, and flagged where disputed.</li>
            <li>Alternate history is authored fiction. It is consistent with its own rules, not a forecast.</li>
            <li>The two are stored separately. Nothing a player does can alter the historical record.</li>
            <li>Maps will never show borders more precisely than the evidence supports.</li>
          </ul>
        </section>

        <section aria-labelledby="limits-title">
          <h2 id="limits-title" className="text-2xl text-parchment">
            Current limitations
          </h2>
          <ul className="prose-atlas mt-4 list-disc space-y-3 pl-5">
            <li>This is a private beta. Only the Fall of Rome campaign can be played, and saved games may be reset between beta versions.</li>
            <li>The interactive map, the side-by-side comparison, shareable outcome cards and Creator Mode are not built yet.</li>
            <li>The balance between the three endings is provisional and may change after the beta.</li>
            <li>
              Historical text is a draft awaiting independent review. Some events currently rely on tertiary
              sources, which are marked and will be corroborated with scholarship before release.
            </li>
          </ul>
        </section>
      </div>

      <section aria-labelledby="sources-title" className="container-page mt-16">
        <h2 id="sources-title" className="text-2xl text-parchment">
          Sources
        </h2>
        {listCampaignContentIds().map((id) => {
          const content = getCampaignContent(id);
          const campaign = getCampaign(id);
          if (!content || !campaign) return null;
          return (
            <div key={id} className="mt-6">
              <h3 className="text-lg text-parchment">{campaign.title}</h3>
              <div className="mt-3 max-w-3xl">
                <SourceLinks sourceIds={content.sources.map((source) => source.id)} sources={content.sources} />
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
