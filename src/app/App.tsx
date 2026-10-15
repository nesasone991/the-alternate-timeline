import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { AboutPage } from '../pages/AboutPage';
import { CampaignOverviewPage } from '../pages/CampaignOverviewPage';
import { ExplorePage } from '../pages/ExplorePage';
import { HomePage } from '../pages/HomePage';
import { HowItWorksPage } from '../pages/HowItWorksPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PrivacyPage } from '../pages/PrivacyPage';
import { AppLayout } from './AppLayout';
import { ErrorBoundary } from './ErrorBoundary';
import { RouteLoading } from './RouteLoading';

// The workspace will grow to hold the map renderer and simulation engine, so it
// is split into its own chunk and only downloaded when a campaign is opened.
const WorkspacePage = lazy(() => import('../pages/WorkspacePage'));

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="how-it-works" element={<HowItWorksPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="campaigns/:campaignId" element={<CampaignOverviewPage />} />
        <Route
          path="campaigns/:campaignId/workspace"
          element={
            <Suspense fallback={<RouteLoading label="Loading the workspace" />}>
              <WorkspacePage />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
