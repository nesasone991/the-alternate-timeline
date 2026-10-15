# QA checklist — Phase 1

Session: 15 Oct 2026.

## How Phase 1 was verified, and what that does not cover

The development sandbox had **no access to the npm registry**, so `npm install` could not run there. Verification used the tools already installed in the sandbox, applied to this exact source:

- **Build:** esbuild bundled `src/main.tsx` (same entry as Vite) with React 19.2; Tailwind CSS 4.3's compiler built `src/styles/index.css`. React Router was replaced *in the sandbox only* by a small stand-in implementing the same API subset; vitest was likewise replaced by a stand-in for the unit tests.
- **Types:** TypeScript strict check of all `src/` and `tests/` files against loose stand-in React types. This checks the project's own types, props and data, but not React's or React Router's API signatures.
- **Browser:** Playwright + Chromium against the built site, served with SPA fallback and the production Content-Security-Policy from `public/_headers`.

**Not yet run anywhere:** `npm install`, `npm run build` (real Vite), `npm run typecheck` with real `@types/react`, `npm run lint`, and `npm test` (the component tests in `tests/components/` need jsdom). Run `npm run check` on your machine to close this gap; record the result below.

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| Production bundle builds | ✅ sandbox | esbuild: entry 216 kB, workspace chunk 13 kB (lazy), CSS 37 kB (unminified Tailwind output) |
| Strict type check (own types/props/data) | ✅ sandbox | `tsc` exit 0 with stand-in React types |
| Unit tests | ✅ 40/40 | dates (8), settings (8), playback + immutability (11), data integrity + catalog (13) |
| Component tests (`tests/components/app.test.tsx`, 7 tests) | ⬜ unrun | Needs jsdom — run `npm test` |
| ESLint | ⬜ unrun | Run `npm run lint` |
| Real `vite build` and `tsc` with `@types/react` | ⬜ unrun | Run `npm run build` |
| Every route renders, correct `<h1>` and `<title>` | ✅ | 9 routes × 3 widths |
| No horizontal overflow at 360 / 768 / 1440 px | ✅ | `scrollWidth − clientWidth = 0` on all 27 page/width combinations |
| No console errors or CSP violations | ✅ | Zero errors across all runs with CSP enforced |
| Navigation: header, hero, footer, campaign card, overview → workspace | ✅ | E2E |
| Coming-soon campaigns have no button or link | ✅ | E2E + component test |
| Unknown campaign → not found; coming-soon overview → "not available yet"; coming-soon workspace → not found | ✅ | E2E |
| Timeline: next/previous, slider, event chips, keyboard arrows | ✅ | E2E |
| Playback: play at 2×, pause holds position, stops at the end, replay restarts | ✅ | E2E + unit |
| Mode tabs: URL sync (`?mode=`), arrow/Home keys, unbuilt modes explained, controls disabled with reason | ✅ | E2E |
| Camera controls disabled with visible reason | ✅ | E2E |
| Settings apply immediately, persist across reload, Restore defaults, Escape closes | ✅ | E2E |
| OS `prefers-reduced-motion` respected by default; user override works | ✅ | E2E |
| Skip link is first Tab stop; focus moves to `<main>` after navigation | ✅ | E2E |
| Mobile menu opens, navigates, closes | ✅ | E2E at 360 px with touch |
| External source links use `rel="noopener noreferrer"` and new tab | ✅ | E2E |
| Actual-history data cannot be modified at runtime | ✅ | Unit test (frozen; writes throw) |
| Corrupt or hostile settings JSON falls back to defaults; no prototype pollution | ✅ | Unit tests |
| Text contrast ≥ WCAG AA | ✅ | Computed: body 13.5:1, muted 7.3:1, gold 7.0:1, fiction label 6.2:1, evidence label 8.2:1, button text 7.9:1 |
| Touch targets ≥ 44 px | ✅ by design | All buttons, chips and tabs use `min-h-11` / 44 px |
| Screen-reader pass (NVDA / VoiceOver) | ⬜ | Not done; do before launch |
| Real devices (iOS Safari, Android Chrome, Firefox) | ⬜ | Only Chromium tested |

## Local verification (owner)

```bash
npm install
npm run check        # typecheck + lint + tests + production build
npm run dev          # then walk through the demo checklist in docs/CAPTURE_GUIDE.md
```

Record results here:

| Date | Who | `npm run check` | Notes |
| --- | --- | --- | --- |
| | | | |
