# Project state

**Last updated:** 15 Oct 2026, end of session 1 (Phase 1).
**Read this first in every new session**, then `docs/ARCHITECTURE.md` and the Master Blueprint.

## Where things stand

Phase 1 (foundation and core UI) is implemented and verified in a sandbox without npm access (see `docs/QA_CHECKLIST.md` for exactly what was and was not run).

### Implemented

- Vite + React 19 + TypeScript (strict) + React Router 7 + Tailwind 4 project; ESLint and Vitest configured.
- Design system: tokens (night-blue, parchment, antique gold; teal = sourced history, burgundy = fiction), inscription type treatment, buttons, plates, badges, focus ring, reduced-motion handling.
- App shell: sticky header (desktop nav ≥1024 px, menu button below), footer, skip link, focus management, error boundary, lazy-route loading state, 404.
- Pages: Home (hero with forking-timeline diagram, featured campaign, how it works, coming later), Explore, Campaign overview, Workspace, How It Works, About (principles, limitations, all sources), Privacy.
- Campaign catalog in `src/data/campaigns.ts`; Rome content in `src/data/scenarios/rome/` (8 sources, 9 dated events 410–480, overview copy, modes, feature roadmap).
- Workspace: mode tabs (Real History works; Alternate and Comparison selectable and labelled not built), map placeholder with disabled camera controls, timeline (year slider, event chips, previous/next, play/pause, restart, speed 0.5/1/2×), info panel (events with sources and caveats; decisions, consequences, statistics marked not built).
- Settings dialog: motion (system/reduce/allow), ambient animation, sound preference (no audio yet), text size, AD/CE notation. Saved in localStorage key `tat.settings`.
- Contracts for Phase 2–5: `src/types/simulation.ts`, `map.ts`, `creator.ts`.
- Docs: ARCHITECTURE, MVP_SCOPE, HISTORICAL_REVIEW, DATA_PROVENANCE, DECISIONS, QA_CHECKLIST, DEPLOYMENT, CAPTURE_GUIDE, README, LICENSE (placeholder), THIRD_PARTY_NOTICES.

### Not implemented (by phase)

- **Phase 2:** decision engine (5 decisions, flags, delayed effects, ≥3 endings, 243-path test matrix), game save/load/reset with versioned schema, JSON scenario files + Zod validation, Playwright E2E in repo.
- **Phase 3:** interactive map (data search, sourced or schematic snapshots for ≥3 years, legend, uncertainty patterns, pan/zoom).
- **Phase 4:** comparison view, "What changed?", end screen, share card.
- **Phase 5:** Creator Mode.
- Not scheduled: deployment (owner action), screen-reader and real-device testing, historical review sign-off.

## Commands

```bash
npm install      # first time; commit package-lock.json
npm run dev      # http://localhost:5173
npm run check    # typecheck + lint + test + build
npm run preview  # serve dist/ at http://localhost:4173
```

## Open issues / known limitations

1. `npm install`, real `vite build`, `npm run lint`, `npm run typecheck` (with `@types/react`) and the 7 component tests have **not been run**. First action for the owner or next session: `npm install && npm run check`, then fix anything it reports.
2. Several historical events rely on tertiary (Wikipedia) sources, marked in the UI. Corroborate before release (`docs/HISTORICAL_REVIEW.md`).
3. Odoacer's deposition: sources disagree on the day; shown at year precision with the disagreement explained.
4. Two events in 455 share one tick mark on the slider; both have their own chip and the info panel lists the other under "Also in this year".
5. Tales of the Past channel URLs are not set (`src/config/brand.ts`); the footer hides them until they are.
6. Privacy page must name the host once deployed.
7. Fonts are device fonts; appearance varies slightly by OS (Palatino on macOS/Windows, Georgia fallback elsewhere).

## Next smallest testable milestone (Phase 2, step 1)

Simulation engine core without UI:
1. Author `src/data/scenarios/rome/alternate.ts`: decision D1 only (three choices), with effects, flags and prerequisites, kept separate from actual history.
2. Pure engine in `src/features/simulation/engine.ts`: `createInitialState`, `availableChoices` (with unmet-prerequisite reasons), `applyChoice` (clamped 0–100), deterministic seeded RNG.
3. Unit tests: clamping, prerequisites, determinism, actual-history untouched.
Then extend to D2–D5, endings and the full path matrix before wiring any UI.

## Session log

| Session | Date | Work | Verification |
| --- | --- | --- | --- |
| 1 | 2026-10-15 | Phase 1 foundation and core UI | Sandbox build, 40 unit tests, 15 browser E2E checks, 27 page/width overflow checks, CSP-enforced run; npm-based checks unrun |
