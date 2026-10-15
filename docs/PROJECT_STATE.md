# Project state

**Last updated:** 15 Oct 2026, end of session 2 (Phase 2, milestone 1).
**Read this first in every new session**, then `docs/ARCHITECTURE.md` and the Master Blueprint.

Repository: `github.com/nesasone991/the-alternate-timeline` (private). CI runs on every push to `main`.

## Where things stand

- **Phase 1** (foundation and core UI) — done.
- **Phase 2, milestone 1** (decision engine + decision 1) — done and verified in CI.
- **Verification** — `npm ci`, typecheck, lint (zero warnings), 74 tests and `vite build` all pass in GitHub Actions. `package-lock.json` is committed. Details and the difference between CI, sandbox-browser and inspection evidence: `docs/QA_CHECKLIST.md`.

### Implemented

Phase 1 (unchanged): design system, app shell, home, explorer, campaign overview, How It Works, About, Privacy, 404, settings dialog, sourced Real History timeline (9 events, 410–480) with playback.

Phase 2 milestone 1:
- **Engine** `src/features/simulation/engine.ts`: `createInitialState`, `evaluateChoices` (availability + plain-language prerequisite reasons + projected effects), `applyChoice` (result object, never throws for player errors), `replay`, `enumeratePaths`, `clampResource`. No randomness, no mutation, resources clamped 0–100, every commit recorded as a `ChoiceRecord`.
- **Validator** `src/features/simulation/validateScenario.ts`: links, cycles, reachability, 2–4 choices, ranges, flags, every choice has a downside, no all-gated decision, historical-context ids exist. Runs in tests and at dev startup.
- **Content** `src/data/scenarios/rome/alternate.ts` (fiction, frozen): D1 "Fiscal survival", c. 455 — Reform taxation (needs Legitimacy ≥ 20), Let the provinces keep a share (no prerequisite), Pay the armies first (needs Economy ≥ 30). Three flags for later decisions. All paths end at an `in-development` checkpoint for D2.
- **UI**: Alternate History tab is playable. Decision panel with sourced-context links, choice cards (effects, prerequisites, later risks, projected result), Confirm, outcome with before → after, Start over. Info panel shows live decisions, consequences and resource meters, plus "what really happened by" the alternate year.
- **CI** `.github/workflows/ci.yml`: install, typecheck, lint, tests, build, results as annotations, auto-commits a lockfile if missing.

### Not implemented

- Decisions 2–5, the three endings, end screen (Phase 2).
- Saving game state across reloads; export/import (Phase 2).
- Interactive map (Phase 3), comparison view and share card (Phase 4), Creator Mode / Historical Animation Studio (Phase 5 — constraints documented in ARCHITECTURE.md).
- Playwright E2E in CI against the real build; screen-reader and real-device testing; deployment.

## Commands

```bash
npm ci           # install exactly what the lockfile records
npm run dev      # http://localhost:5173
npm run check    # typecheck + lint + test + build
npm run preview  # serve dist/ at http://localhost:4173
```

## Known limitations

1. Browser-level checks ran in the sandbox against an esbuild build with a React Router stand-in, not the real Vite bundle. Unit and component tests did run for real in CI.
2. Simulation state lives in memory: a page reload starts the campaign again.
3. Several historical events still rely on tertiary sources (see HISTORICAL_REVIEW.md); the D1 framing sentence reuses those facts.
4. Balance is provisional. D1 option "pay the armies" has the highest sum of deltas (+6) by design, offset by a planned D3 cost that does not exist yet.
5. The Actions log host is unreachable from the sandbox, so CI results are read from annotations; full logs are visible on GitHub.
6. Channel URLs (footer) and the privacy page's hosting details are still pending.

## Next smallest testable milestone (Phase 2, milestone 2)

**Decision 2, "Border defence", c. 458–460**, using the existing engine:
1. Author D2 with three choices (concentrate troops in Italy / mobile field forces / federate settlements) in `alternate.ts`. At least one choice reads a D1 flag (the first delayed consequence) and at least one sets a long-term flag for D5.
2. Point D1's choices at D2; move the `in-development` checkpoint after D2.
3. Tests: all 3 × 3 = 9 paths valid; the D1 flag measurably changes a D2 option; no dominance; validator clean.
4. UI needs no new components; verify in CI and the browser.

Then D3–D5 one at a time, then endings and the full 243-path matrix, then saves.

## Session log

| Session | Date | Work | Verification |
| --- | --- | --- | --- |
| 1 | 2026-10-15 | Phase 1 foundation and core UI | Sandbox only (npm unavailable) |
| 2 | 2026-10-15 | GitHub repo + CI; engine, validator, D1, workspace integration | CI: npm ci, typecheck, lint, 74/74 tests, build. Sandbox browser: 27 checks |
