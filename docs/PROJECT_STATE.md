# Project state

**Last updated:** 16 Oct 2026, end of session 5 (Phase 2, milestone 4 — Decision 4).
**Read this first in every new session**, then `docs/ARCHITECTURE.md` and the Master Blueprint.

Repository: `github.com/nesasone991/the-alternate-timeline` (private). CI runs on every push to `main`: install, typecheck, lint, Vitest, build, Playwright (desktop + mobile against the production build).

## Where things stand

- **Phase 1** — done.
- **Phase 2, milestones 1–3** (engine, D1–D3, delayed consequences, saves, reports, event stream, Playwright) — done.
- **Phase 2, milestone 4** (Decision 4) — done and verified in CI run 38946100373 (commit `00029a0`): 139/139 Vitest, 24/24 Playwright, typecheck, lint (0 warnings), build. Details: `docs/QA_CHECKLIST.md`.
- **Decision 5 has not been started**, as instructed. It should start only after the owner has reviewed this milestone.

### Implemented this session

- **Research and four new sourced events** (timeline now 15 events): Constantinople sends Anthemius (467); the Visigoths destroy an imperial army in southern Gaul (c. 471, approximate); Ricimer overthrows Anthemius (11 July 472, contested details); Ricimer and Olybrius die and Gundobad takes command (472). Five new sources; every disagreement between sources is in a caveat (`docs/HISTORICAL_REVIEW.md`).
- **Decision 4, Imperial legitimacy (c. 472)**:
  - *Restore the emperor's authority* — needs Legitimacy 15 and Economy 10; Economy +5, Legitimacy +8, Unity −7, Military −4; Legitimacy +3 after joining the expedition, −3 after a separate treaty; later: loyal administration (475, if Legitimacy ≥ 35), resistance from those who lost power (476, if Unity < 30).
  - *Strike a bargain with the regional powers* — always available; Unity +6, Legitimacy +4, Economy −6, Military −2; landowner loans (+10 Economy) below Economy 15, recognition (+4 Legitimacy) below Legitimacy 15, +3 Unity after giving up Africa; later: regional levies (475), strain if the treasury is below 20 (476).
  - *Rule through the army's commander* — needs Military 50; Military +6, Unity +4, Legitimacy −8, Economy −5; +3 Military with a field army, +3 after the treaty; later: the commander's ambition (475, if Legitimacy < 25), arrears (476, if Economy < 15).
- **472 consequences resolve before Decision 4** (expedition debts, eastern resentment, treaty holds/lapses), shown in the order-of-events box.
- **Recovery for weak states** without automatic rescue (examples in `docs/QA_CHECKLIST.md`).
- **Reports to the council** now open with the political situation (variant + every matching note) and use the sections: situation, decision, who gains and loses influence, immediate consequences, risks that remain.
- **Scenario version 4**; v3 saves refused with an explanation. Every path ends at a c. 474 checkpoint.
- Tests: all 81 D1–D4 combinations against an independent reference model (54 valid; 9 blocked at each of D2, D3, D4).

### Not implemented

- Decision 5, the three endings and the end screen.
- Export/import of saves; share card (Phase 4); map (Phase 3); comparison (Phase 4); Creator Mode / Historical Animation Studio (Phase 5) — only data contracts and the event stream exist.
- Screen-reader, Safari/Firefox and real-device testing; deployment.

## Commands

```bash
npm ci
npm run dev        # http://localhost:5173
npm run check      # typecheck + lint + test + build
npm run test:e2e   # Playwright (needs a build and `npx playwright install chromium`)
```

## Known limitations

1. Every path reaches the checkpoint with its two Decision 4 consequences (475 and 476) and up to two earlier ones (476) still pending; they resolve only when Decision 5 exists.
2. Balance is provisional and unplaytested. Ruling through the commander can leave Legitimacy at 0 or 3 (e.g. *provinces → federates → treaty → commander*); recovery via the bargain is fragile (Economy 10–17 with the 476 strain likely). Decision 5 must give such states a playable option and lead to all three endings.
3. Clamping can hide part of a cost at 0 (e.g. the bargain's Economy −6 at Economy 0). The record shows requested vs applied; this is intended but should be reviewed in playtesting.
4. New sources are Britannica plus tertiary Wikipedia; the 471 defeat in Gaul needs a scholarly source; D4 framing has review points.
5. Saves are per browser; no export yet.
6. The sandbox cannot download Actions logs; results come from job annotations and the jobs API.
7. Channel URLs and the privacy page's hosting details are still pending.
8. GitHub moves `ubuntu-latest` to Ubuntu 26 from 19 Oct 2026; watch the next CI runs.

## Next smallest testable milestone (Phase 2, milestone 5)

**Decision 5, the final crisis (c. 475–476), and the three endings** — only after this milestone is reviewed:
1. Research and source 473–476 (Glycerius, Julius Nepos, Orestes, Odoacer; Euric's treaty of 475), recording disputes.
2. Author D5 (defend the imperial office / negotiate power-sharing / transfer to a decentralised successor structure); resolve the 475 consequences before it and the 476 ones on arrival at the ending, or document a different order.
3. Write the three endings (Imperial Continuity, Negotiated Transformation, Fragmentation) with ending rules that depend on flags and resources; every ending reachable; every weak state has a path.
4. Tests: full matrix (up to 243 combinations) against the reference model, ending reachability, determinism; scenario version 5; Playwright to an ending. The end screen itself can be the milestone after.

## Session log

| Session | Date | Work | Verification |
| --- | --- | --- | --- |
| 1 | 2026-10-15 | Phase 1 foundation and core UI | Sandbox only |
| 2 | 2026-10-15 | GitHub + CI; engine, validator, D1 | CI: 74/74 tests, build |
| 3 | 2026-10-15 | D2, delayed consequences, saves, decision UI, Playwright in CI | CI: 94/94 Vitest, 20/20 Playwright, typecheck, lint, build |
| 4 | 2026-10-15 | D3, 468 consequences before D3, narrative reports, event stream, scenario v3, 27-combination matrix; mobile-menu race fix | CI: 115/115 Vitest, 22/22 Playwright, typecheck, lint, build (run 38810346645) |
| 5 | 2026-10-16 | Research 467–472; D4 with recovery; 472 consequences; situation in reports; scenario v4; 81-combination matrix | CI: 139/139 Vitest, 24/24 Playwright, typecheck, lint, build (run 38946100373) |
