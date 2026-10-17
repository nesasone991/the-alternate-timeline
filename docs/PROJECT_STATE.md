# Project state

**Last updated:** 17 Oct 2026, end of session 7 (Phase 2, milestone 6 — the ending experience).
**Read this first in every new session**, then `docs/ARCHITECTURE.md` and the Master Blueprint.

Repository: `github.com/nesasone991/the-alternate-timeline` (private). CI runs on every push to `main`: install, typecheck, lint, Vitest, build, Playwright (desktop + mobile against the production build).

## Where things stand

- **Phase 1** — done.
- **Phase 2, milestones 1–5** (engine, all five decisions, delayed consequences, unpaid-cost rules, saves, reports, event stream, ending rules) — done.
- **Phase 2, milestone 6** (the ending experience) — done and verified in CI run 39033328144 (commit `f6722e7`): 172/172 Vitest, 46/46 Playwright, typecheck, lint (0 warnings), build. Details: `docs/QA_CHECKLIST.md`.
- **The interactive map and the Animation Studio have not been started**, as instructed; no other campaign has been begun. No simulation rule or ending classification was changed.

### Implemented this session

- **Route `/campaigns/fall-of-rome/ending`** (lazy chunk), linked from the workspace (*See the fate of your empire*) once a campaign ends. It reads the saved choices (or the workspace's, if storage is blocked) and derives everything from one deterministic replay.
- **The fate of your empire:** a seal per category (unbroken laurel ring / five separated arcs / arcs pushed apart) around the year in Roman numerals, an atmosphere line, a large headline, an introduction and a "why" built from the actual state (the measures that held, or what a better ending needed), plus last decision, looming threats and unpaid costs. Labelled fictional alternate history.
- **Your empire in 476:** final values with change since 455; four small-multiple charts of each resource across every decision and consequence, driven by one shared slider and readout; a table view. Data from `resourceTimeline` (copied from recorded engine results, checked against replay).
- **The decisions that changed history:** all five in order: year, strategy, immediate effects, conditional reasons, unpaid costs, consequences that took effect, lapsed or are still ahead, turning-point marker, situation, sourced context links and the report to the council (in a disclosure).
- **The world you created:** the report's settlement, imperial authority, army, economy, regional powers and Constantinople; the decisions that weighed most; threats and unpaid costs; how the ending was decided (met and unmet conditions) in a disclosure.
- **What really happened:** the fictional outcome beside the sourced events dated 474–480 (sources, certainty, caveats), with links that open each event in Real History (`?event=` deep links added to the workspace).
- **Replay your decisions** (read-only step-through) and **Start a new timeline** (confirmation dialog, then the save is cleared and Decision 1 opens).
- Tests: unit (resource history vs replay for all 145 paths), component (ending page, replay, restart, empty states), Playwright (each ending, links, replay, restart, 360/768/1440 px, 44 px targets, headings, keyboard, reduced motion).

### Not implemented

- Share card (Phase 4); comparison mode (Phase 4); map (Phase 3); Creator Mode / Historical Animation Studio (Phase 5).
- Export/import of saves; deployment; screen-reader, Safari/Firefox and real-device testing.

## Commands

```bash
npm ci
npm run dev        # http://localhost:5173
npm run check      # typecheck + lint + test + build
npm run test:e2e   # Playwright (needs a build and `npx playwright install chromium`)
```

## Known limitations

1. Not tested with a real screen reader (NVDA, VoiceOver) or in Safari/Firefox; Playwright runs Chromium only. Accessibility checks are automated (structure, targets, keyboard, reduced motion, computed contrast).
2. The charts' pointer hover selects a moment but there is no floating tooltip; the shared readout and the table carry the values. Charts are re-rendered at the container width, so they redraw on resize.
3. "What really happened" compares at the level of narrative and sourced events; a side-by-side map or synced comparison is Phase 4.
4. The ending page needs a finished save (or the workspace hand-over); there is no shareable link to a particular ending yet.
5. Balance is provisional (Imperial Survival 13 of 145 paths); historical review points for 467–480 remain open (`docs/HISTORICAL_REVIEW.md`).
6. The sandbox cannot download Actions logs; results come from job annotations and the jobs API.
7. Channel URLs and the privacy page's hosting details are still pending.
8. GitHub moves `ubuntu-latest` to Ubuntu 26 from 19 Oct 2026; watch CI.

## Next smallest testable milestone

**Phase 3, milestone 1: the map data decision and a schematic regional map**, as the Blueprint orders (map before comparison and Creator Mode):
1. Search for freely licensed historical geometry for c. 455–480; record findings, licences and accuracy in `DATA_PROVENANCE.md`. If none is suitable, adopt the Blueprint's fallback: a clearly labelled illustrative map of the eight schematic regions the event stream already uses.
2. Render it in the workspace's map area (SVG), with legend, zoom/pan with keyboard fallback, and the "illustrative, not exact borders" label.
3. Drive it from existing data: Real History by year (sourced snapshots or schematic control states with uncertainty), Alternate History by the event stream's map cues. No new simulation rules.
4. Tests: rendering, legend and labels, keyboard pan/zoom, reduced motion, mobile.

Alternative if the owner prefers to finish the player loop first: the shareable outcome card (Phase 4 item 7), built from `EndingReport` with a visible FICTIONAL ALTERNATE HISTORY label.

## Session log

| Session | Date | Work | Verification |
| --- | --- | --- | --- |
| 1 | 2026-10-15 | Phase 1 foundation and core UI | Sandbox only |
| 2 | 2026-10-15 | GitHub + CI; engine, validator, D1 | CI: 74/74 tests, build |
| 3 | 2026-10-15 | D2, delayed consequences, saves, decision UI, Playwright in CI | CI: 94/94 Vitest, 20/20 Playwright |
| 4 | 2026-10-15 | D3, 468 consequences, narrative reports, event stream, scenario v3; mobile-menu race fix | CI: 115/115 Vitest, 22/22 Playwright |
| 5 | 2026-10-16 | Research 467–472; D4 with recovery; scenario v4; 81-combination matrix | CI: 139/139 Vitest, 24/24 Playwright |
| 6 | 2026-10-16 | Research 473–480; D5; ending rules and report data; unpaid-cost rules; scenario v5; 243-combination matrix | CI: 167/167 Vitest, 28/28 Playwright |
| 7 | 2026-10-17 | Ending experience: fate, resource history, decision review, world report, what really happened, replay, restart; Real History deep links | CI: 172/172 Vitest, 46/46 Playwright, typecheck, lint, build (run 39033328144) |
