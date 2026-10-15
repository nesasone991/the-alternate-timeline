# Architecture

## Stack and why

| Layer | Choice | Reason |
| --- | --- | --- |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`) | Data contracts for history, sources and future simulation state are the backbone of the product; the compiler enforces them. |
| UI | React 19 | Brief's preferred stack; large ecosystem for the map and testing work ahead. |
| Build | Vite 7 | Fast dev server, static output, no server required. |
| Routing | React Router 7 (declarative `BrowserRouter`) | Brief's preferred router. Declarative mode is enough for a static SPA; data routers are unnecessary without a backend. |
| Styling | Tailwind CSS 4 + CSS design tokens | Tokens live once in `src/styles/index.css` (`@theme`) and are used as utilities. A few component classes (`.btn`, `.plate`, `.badge`) keep repeated patterns consistent. |
| State | React state + one tiny external store for settings | Zustand was optional in the brief and is not needed: the only shared state is settings, handled by `useSyncExternalStore` in ~80 lines. Revisit when the simulation needs cross-route state. |
| Icons | In-repo SVG set (`Icon.tsx`) | Fourteen icons do not justify a dependency. Swap for `lucide-react` later if the set grows; the component API stays the same. |
| Fonts | Device fonts only | No download, no third-party request, no licence to track. Palatino-family serif fits the subject. Self-hosting an OFL font is a later polish option. |
| Tests | Vitest + Testing Library + jsdom | Same config pipeline as Vite. Playwright E2E is planned once gameplay exists. |
| Hosting | Any static host (Cloudflare Pages recommended) | `dist/` is plain files. `_redirects` and `_headers` are included for Cloudflare. |

Runtime dependencies are only `react`, `react-dom` and `react-router`.

## Structure

```
src/app         App shell: routes (App.tsx), layout with header/footer and settings dialog,
                error boundary, route loading fallback.
src/pages       One component per route. Pages compose features; they hold no data.
src/components  Shared, campaign-agnostic UI: layout/ (header, footer, page header, brand mark),
                ui/ (Icon, Badges).
src/features    campaigns/  catalog card and numeral emblem
                history/    timeline panel, event entry, source links, playback reducer
                settings/   settings model, store, hooks, dialog
                workspace/  mode tabs, map placeholder, info panel
                home/       hero diagram, how-it-works steps
src/data        campaigns.ts — the catalog (single source of truth for titles, periods, status)
                scenarios/rome/ — sources, actual-history timeline, overview copy
                scenarios/index.ts — campaign id → content registry
src/types       Contracts: history, campaign, simulation (Phase 2), map (Phase 3), creator (Phase 5)
src/lib         Dates and era notation, catalog lookups, data validation, small hooks
src/config      Brand constants and (empty until supplied) channel links
```

### Routes

| Path | Page |
| --- | --- |
| `/` | Home |
| `/explore` | Campaign explorer |
| `/how-it-works` | Full explanation of the loop |
| `/about` | Principles, limitations, all sources |
| `/privacy` | What is stored and what is not |
| `/campaigns/:campaignId` | Overview (or "not available yet" for coming-soon campaigns) |
| `/campaigns/:campaignId/workspace?mode=real\|alternate\|comparison` | Workspace, lazy-loaded chunk |
| `*` | Not found |

Settings is a modal dialog available from every page, not a route.

## Key design rules in the code

1. **Campaign data is never hard-coded in components.** Titles, periods, status and copy come from `src/data`. Adding a campaign = one catalog entry + one `scenarios/<id>/` folder + one line in `scenarios/index.ts`.
2. **Actual history is immutable.** `romeActualTimeline` is deep-frozen at load; a unit test proves writes throw. Alternate-history data will live in a separate dataset (Phase 2).
3. **Data is validated.** `lib/validation.ts` checks source references, chronology, date precision, caveats on contested events and https-only URLs. It runs in the unit tests and logs in development builds. When scenarios move to JSON files in Phase 2, add runtime schema validation (Zod) at load.
4. **Precision is never overstated.** Dates render at their recorded precision (`formatHistoricalDate`). The map area is an explicit placeholder rather than a decorative image.
5. **No fake controls.** Unbuilt features are either absent or disabled with a visible reason (camera controls, unbuilt modes). Coming-soon campaigns have no button.
6. **Playback is a pure reducer** (`timelinePlayback.ts`): deterministic, unit-tested, independent of animation timing. The same reducer will drive Creator Mode playback.
7. **Settings are validated on read and write**, size-limited and read via own-property checks to rule out prototype pollution.

## Accessibility and motion

- Skip link; focus moves to `<main>` after each navigation; one `h1` per page.
- Native controls throughout (range input, radio groups, `<dialog>`); WAI-ARIA tabs with arrow/Home/End keys.
- Touch targets ≥ 44×44 px. Visible gold focus ring.
- `data-motion` on `<html>` combines the user's setting with `prefers-reduced-motion`; reduced motion disables all transitions and animations. Ambient decoration has its own switch.
- Status is always carried by text, never colour alone (badges say "Sourced history", "Fictional alternate history", "Contested", "Not built yet").

## Technical risks

| Risk | Mitigation |
| --- | --- |
| Historical geometry for maps may not exist under a free licence at the needed accuracy | Blueprint fallback: labelled schematic regions. Decide in Phase 3 after a data search. |
| Map library choice (SVG/D3 vs MapLibre) affects mobile performance | Prototype both against real data before committing; the workspace chunk is already split so the map code will not slow the landing page. |
| Tailwind arbitrary values (`text-[clamp(...)]`) are verbose | Acceptable for now; promote repeated ones to tokens if they spread. |
| Dependency versions resolve at install time | Commit `package-lock.json` after the first `npm install`. |
