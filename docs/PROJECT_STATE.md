# Project state

**Last updated:** 15 Oct 2026, end of session 3 (Phase 2, milestone 2).
**Read this first in every new session**, then `docs/ARCHITECTURE.md` and the Master Blueprint.

Repository: `github.com/nesasone991/the-alternate-timeline` (private). CI runs on every push to `main`: install, typecheck, lint, Vitest, build, Playwright (desktop + mobile against the production build).

## Where things stand

- **Phase 1** — done.
- **Phase 2, milestone 1** (engine + D1) — done.
- **Phase 2, milestone 2** (D2, delayed consequences, saves, Playwright, decision UI) — done and verified in CI: 94/94 Vitest, 20/20 Playwright, typecheck, lint, build. Details: `docs/QA_CHECKLIST.md`.
- **Decision 3 has not been started**, as instructed.

### Implemented this session

- **Delayed effects** (engine): conditional effects at commit ("Because you…"); scheduled consequences with hint, due year, optional condition and lapse explanation, resolved on arrival and recorded in `state.resolved`; still-pending ones in `state.pending`. New `below` requirement form.
- **Decision 2, Border defence (c. 459)**: concentrate the armies in Italy / fund a mobile field army (needs Economy 30) / settle allies as federates. D1 shapes it: paying the armies first blocks the field army and strengthens the Italian garrison; letting provinces keep revenue helps federate settlement and later protects provincial loyalty. D1 choices now schedule consequences for 459 and 468; D2 choices for 468 and 476.
- **Saves**: `tat.save.rome-alternate` written after each decision; restored on load by replaying the choice list; corrupt and incompatible saves reported with a reason and kept until discarded; Start over clears it. Privacy page updated.
- **Decision UI**: "What carries into this decision" (last choice, why, exact changes, consequences that arrived, established decisions, still to come); per-option immediate effects, conditional effects with reasons, requirements, later consequences (hint and year), risk, exact projection.
- **Playwright** in the repo (`tests/e2e`, `playwright.config.ts`) and CI.
- Scenario version 2, state schema version 2.

### Not implemented

- Decisions 3–5, the three endings and the end screen.
- Export/import of saves; share card (Phase 4); map (Phase 3); comparison (Phase 4); Creator Mode / Historical Animation Studio (Phase 5).
- Screen-reader, Safari/Firefox and real-device testing; deployment.

## Commands

```bash
npm ci
npm run dev        # http://localhost:5173
npm run check      # typecheck + lint + test + build
npm run test:e2e   # Playwright (needs a build and `npx playwright install chromium`)
```

## Known limitations

1. Consequences due in 468 and 476 are shown as "still to come" but cannot resolve until decisions 3–5 exist. Their effects are unit-tested only through the generic fixture, not through Rome content.
2. Balance is provisional: eight paths, no playtesting. "Pay the armies first" → "Concentrate in Italy" gives the highest military (67) at the cost of the lowest economy (25).
3. Several sources are still tertiary (Wikipedia), and D2's framing adds two general claims that need scholarly citations (`docs/HISTORICAL_REVIEW.md`).
4. Saves are per browser; there is no export yet.
5. The sandbox cannot download Actions logs; CI results are read from job annotations and the jobs API. Full logs are on GitHub.
6. Channel URLs and the privacy page's hosting details are still pending.

## Next smallest testable milestone (Phase 2, milestone 3)

**Decision 3, North African policy (c. 461–468)**, with the 468 consequences resolving:
1. Author D3 (attempt reconquest / negotiate trade and access / redirect resources to internal stabilisation), set against the sourced 468 Cape Bon event, without presenting campaign costs as precise.
2. Place D3 at c. 465 so that consequences due in 468 resolve on arrival at the D4 checkpoint (c. 470), and test each one against Rome content — triggered and lapsed.
3. At least one D3 option depends on a D2 flag, one on economy built in D1–D2.
4. Tests: full D1×D2×D3 matrix (up to 27 combinations), dominance, determinism; bump scenario version to 3 (saves from v2 must be refused with a reason); extend the Playwright campaign spec through D3.

## Session log

| Session | Date | Work | Verification |
| --- | --- | --- | --- |
| 1 | 2026-10-15 | Phase 1 foundation and core UI | Sandbox only |
| 2 | 2026-10-15 | GitHub + CI; engine, validator, D1 | CI: 74/74 tests, build |
| 3 | 2026-10-15 | D2, delayed consequences, saves, decision UI, Playwright in CI | CI: 94/94 Vitest, 20/20 Playwright, typecheck, lint, build |
