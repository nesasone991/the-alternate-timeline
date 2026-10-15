import { Link } from 'react-router';
import { PageHeader } from '../components/layout/PageHeader';
import { FictionBadge, SourcedHistoryBadge } from '../components/ui/Badges';
import { HowItWorksSteps } from '../features/home/HowItWorksSteps';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function HowItWorksPage() {
  useDocumentTitle('How It Works');
  return (
    <>
      <PageHeader
        title="How It Works"
        lead={
          <p>
            Every campaign runs the same loop: learn what happened, change one thing, follow the consequences and
            compare the two worlds.
          </p>
        }
      />
      <section aria-label="The four steps" className="container-page">
        <HowItWorksSteps detailed />
      </section>

      <section aria-labelledby="labels-title" className="container-page mt-20 grid gap-10 md:grid-cols-2">
        <div>
          <h2 id="labels-title" className="text-2xl text-parchment">
            History and fiction are never mixed
          </h2>
          <p className="prose-atlas mt-4">
            Real events carry sources, a date shown only as precisely as the evidence allows, and a note wherever
            historians disagree. Alternate events are invented. They are labelled as fiction everywhere they appear,
            including in anything you share.
          </p>
        </div>
        <dl className="space-y-6 self-center">
          <div className="border-t-2 border-teal-bright/70 pt-4">
            <dt>
              <SourcedHistoryBadge />
            </dt>
            <dd className="mt-2 text-parchment-muted">Documented events with sources and caveats. Never changed by your choices.</dd>
          </div>
          <div className="border-t-2 border-dashed border-burgundy-bright/70 pt-4">
            <dt>
              <FictionBadge />
            </dt>
            <dd className="mt-2 text-parchment-muted">Authored, internally consistent outcomes. Not predictions.</dd>
          </div>
        </dl>
      </section>

      <section className="container-page mt-20">
        <Link to="/explore" className="btn btn-primary">
          Explore History
        </Link>
      </section>
    </>
  );
}
