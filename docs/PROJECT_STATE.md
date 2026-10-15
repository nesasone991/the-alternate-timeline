# Project state

**Last updated:** 15 Oct 2026, end of session 4 (Phase 2, milestone 3 — Decision 3).
**Read this first in every new session**, then `docs/ARCHITECTURE.md` and the Master Blueprint.

Repository: `github.com/nesasone991/the-alternate-timeline` (private). CI runs on every push to `main`: install, typecheck, lint, Vitest, build, Playwright (desktop + mobile against the production build).

## Where things stand

- **Phase 1** — done.
- **Phase 2, milestones 1–2** (engine, D1, D2, delayed consequences, saves, Playwright) — done.
- **Phase 2, milestone 3** (Decision 3) — done and verified in CI run 38809509527 (commit `3928ed0`): 115/115 Vitest, 22/22 Playwright, typecheck, lint (0 warnings), build. A later docs-only run hit an intermittent mobile-menu timeout in an older navigation test; the race was fixed in the app and the test helper, and CI run 38810346645 (commit `6b94b0a`) is green again (115/115, 22/22). Details: `docs/QA_CHECKLIST.md`.
- **Decision 4 has not been started**, as instructed. It should start only after the owner has reviewed this milestone.

### Implemented this session

- **Decision 3, North African policy (c. 468)**, set against three sourced events (442 treaty, 461 raids, 468 Cape Bon):
  - *Join the eastern expedition against Carthage* — needs Military 50; Economy −12, Military −6, Legitimacy +6; +4 Military with a field army; +5 Economy if Military ≥ 60 (islands secured); later: debts (472), Vandal reprisal if Military < 55 (476).
  - *Negotiate a treaty with Gaiseric* — needs Legitimacy 15; Economy +8, Unity +2, Legitimacy −8; +4 Economy if Italy was garrisoned; later: eastern resentment (472), treaty holds if Military ≥ 50 (472).
  - *Give up Africa and fortify what remains* — always available; Economy −6, Military +3, Unity +6, Legitimacy −4; +3 Unity with a field army, +3 Military with federates; later: coastal trade dwindles if Military < 55 (476).
- **All 468 consequences now resolve inside the campaign, before Decision 3**, with an "Order of events in c. 468" box in the UI and a list of what arrived (lapsed ones marked "No effect.").
- **Narrative reports** for every D3 option: orders, effect on the empire, who gains / loses / mixed (text labels, not colour alone), what is uncertain; chosen deterministically from the pre-choice state; labelled as invented fiction.
- **Event stream for the future Animation Studio**: `replayWithEvents` → ordered decision and consequence events with map cues on named schematic regions (no geometry).
- **Two new sourced events** (442, 461) and two sources; Cape Bon summary mentions Marcellinus retaking Sardinia. Timeline: 11 events.
- **Scenario version 3** (state schema 3). Version 2 saves are refused with an explanation of what changed. Balance changes to D1/D2 are listed in `docs/DECISIONS.md` (D38).
- Tests: all 27 D1–D3 combinations checked against an independent reference model (21 valid, 3 blocked at D2, 3 blocked at D3); narrative, event stream, save versions; Playwright through D3.

### Not implemented

- Decisions 4–5, the three endings and the end screen.
- Export/import of saves; share card (Phase 4); map (Phase 3); comparison (Phase 4); Creator Mode / Historical Animation Studio (Phase 5) — only the data contracts and event stream exist.
- Screen-reader, Safari/Firefox and real-device testing; deployment.

## Commands

```bash
npm ci
npm run dev        # http://localhost:5173
npm run check      # typecheck + lint + test + build
npm run test:e2e   # Playwright (needs a build and `npx playwright install chromium`)
```

## Known limitations

1. Consequences due in 472 and 476 are shown as "still to come" and cannot resolve until Decisions 4–5 exist (D4 at c. 472 will resolve the 472 ones).
2. Balance is provisional and unplaytested. Notable: *provinces → field army → join expedition* ends at Economy 1; *tax reform → federates → fortify* ends at Legitimacy 8. These are legal but harsh; D4 must give such states a viable option (the validator already forbids all-gated decisions).
3. Sources for the new 442 and 461 events are tertiary (Wikipedia) and marked as such; the D3 framing has review points in `docs/HISTORICAL_REVIEW.md`.
4. Saves are per browser; there is no export yet.
5. The sandbox cannot download Actions logs; CI results are read from job annotations and the jobs API. Full logs are on GitHub.
6. Channel URLs and the privacy page's hosting details are still pending.
7. GitHub notes that `ubuntu-latest` moves to Ubuntu 26 from 19 Oct 2026; watch the next CI runs.

## Next smallest testable milestone (Phase 2, milestone 4)

**Decision 4, imperial legitimacy (c. 472)** — only after this milestone is reviewed:
1. Author D4 (centralise authority / coalition with regional elites / recognise local autonomy), set against sourced 472–474 events (to be researched and added first).
2. Place D4 at c. 472 so the 472 consequences (expedition debts, treaty resentment, treaty holds) resolve on arrival, before the decision; test triggered and lapsed cases in Rome content.
3. At least one D4 option depends on D3's flag (joined expedition / treaty / Africa abandoned); give the harshest D1–D3 end states a viable option.
4. Tests: full matrix (up to 81 combinations) against the reference model, dominance, determinism, narrative, event stream; scenario version 4 with a change note; Playwright through D4.

## Session log

| Session | Date | Work | Verification |
| --- | --- | --- | --- |
| 1 | 2026-10-15 | Phase 1 foundation and core UI | Sandbox only |
| 2 | 2026-10-15 | GitHub + CI; engine, validator, D1 | CI: 74/74 tests, build |
| 3 | 2026-10-15 | D2, delayed consequences, saves, decision UI, Playwright in CI | CI: 94/94 Vitest, 20/20 Playwright, typecheck, lint, build |
| 4 | 2026-10-15 | D3, 468 consequences before D3, narrative reports, event stream, scenario v3, 27-combination matrix; mobile-menu race fix | CI: 115/115 Vitest, 22/22 Playwright, typecheck, lint, build (run 38810346645) |
