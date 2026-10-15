import { PageHeader } from '../components/layout/PageHeader';
import { CampaignCard } from '../features/campaigns/CampaignCard';
import { isCampaignSelectable, listCampaigns } from '../lib/catalog';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function ExplorePage() {
  useDocumentTitle('Explore History');
  const all = listCampaigns();
  const open = all.filter(isCampaignSelectable);
  const later = all.filter((campaign) => !isCampaignSelectable(campaign));

  return (
    <>
      <PageHeader
        title="Explore History"
        lead={
          <p>
            Choose a turning point. Each campaign pairs a sourced account of what happened with a branching,
            clearly fictional account of what might have happened instead.
          </p>
        }
      />

      <section aria-labelledby="open-campaigns" className="container-page">
        <h2 id="open-campaigns" className="text-2xl text-parchment">
          Open now
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {open.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </section>

      {later.length > 0 ? (
        <section aria-labelledby="later-campaigns" className="container-page mt-16">
          <h2 id="later-campaigns" className="text-2xl text-parchment">
            Coming later
          </h2>
          <p className="mt-2 text-parchment-muted">Concepts only. They cannot be opened until they are researched and built.</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {later.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
