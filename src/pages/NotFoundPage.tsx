import { Link } from 'react-router';
import { PageHeader } from '../components/layout/PageHeader';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <PageHeader
      title="Page not found"
      lead={<p>There is no page at this address. It may have moved, or the link may be mistyped.</p>}
    >
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/" className="btn btn-primary">
          Go to home page
        </Link>
        <Link to="/explore" className="btn btn-secondary">
          Explore History
        </Link>
      </div>
    </PageHeader>
  );
}
