# Project state

**Last updated:** 16 Oct 2026, end of session 6 (Phase 2, milestone 5 — Decision 5 and ending rules).
**Read this first in every new session**, then `docs/ARCHITECTURE.md` and the Master Blueprint.

Repository: `github.com/nesasone991/the-alternate-timeline` (private). CI runs on every push to `main`: install, typecheck, lint, Vitest, build, Playwright (desktop + mobile against the production build).

## Where things stand

- **Phase 1** — done.
- **Phase 2, milestones 1–4** (engine, D1–D4, delayed consequences, saves, reports, event stream, recovery) — done.
- **Phase 2, milestone 5** (Decision 5, ending rules, unpaid costs) — done and verified in CI run 38949456541 (commit `783239d`): 167/167 Vitest, 28/28 Playwright, typecheck, lint (0 warnings), build. Details: `docs/QA_CHECKLIST.md`.
- **The ending screen has not been started**, as instructed, and no other campaign has been begun.

### Implemented this session

- **Research and four new sourced events** (timeline now 19): Nepos replaces Glycerius (June 474); the Auvergne peace with Euric (475, contested terms); the Senate sends the regalia to Zeno (c. 476, contested); Roman institutions continue under Odoacer (c. 477, spans 476–493). The 475, 476 and 480 events were revised with new sources and caveats. Four new sources.
- **Decision 5, The final crisis (c. 475)**:
  - *Defend the imperial office by force* — needs Military 40 and is ruled out if the commander rules (D4); Military −8, Economy −6, Legitimacy +8, Unity −3; +4 Military after restoring authority, +3 with the regional bargain; 476: decisive victory if Military ≥ 45 (Legitimacy +6, Unity +3), war damage (Economy −3); 480: a usurper if Legitimacy < 35.
  - *Give the soldiers land and their leaders a share of power* — always open; Military +8, Unity −6, Economy −4, Legitimacy −4; +3 Unity with federates, +3 Legitimacy if the commander rules; 476: settled soldiers defend Italy if Unity ≥ 25 (Military +4, Legitimacy +2); 480: landowners' resentment if Unity < 30.
  - *Hand government to successor rulers under Constantinople* — always open; Legitimacy −10, Economy +6, Unity +4, Military −4; +4 Unity with the bargain, +4 Legitimacy after the expedition, +4 Military if the commander rules; 476: eastern recognition if Legitimacy ≥ 20 (+5); 480: successors drift apart without the bargain.
- **Order of events**: 475 consequences before D5; **476 consequences at the settlement of 476, then the ending is classified**; 480 consequences remain as looming threats. Stated in the interface.
- **Endings**: Imperial Survival, Fragmented Survival, Imperial Collapse, by ordered rules over resources, flags from every decision, unpaid costs and looming threats. 145 playable paths: 13 / 91 / 41.
- **Unpaid costs**: decisions and consequences are settled together; a cost the empire cannot pay in full puts half the shortfall on another resource and records a flag, shown before and after the choice.
- **Structured ending report** (data only, `endings.ts`): settlement, imperial authority, army, economy, regional powers, Constantinople, three key decisions, looming threats, unpaid costs; all marked fiction. The workspace shows only the ending, its summary and why.
- **Scenario version 5**, state schema 4; v4 saves refused with an explanation.
- Tests: all 243 combinations against an independent reference model (145 valid; 27/27/27/17 blocked at D2–D5).

### Not implemented

- The ending screen (and share card) — next milestone.
- Export/import of saves; map (Phase 3); comparison (Phase 4); Creator Mode / Historical Animation Studio (Phase 5) — only data contracts and the event stream exist.
- Screen-reader, Safari/Firefox and real-device testing; deployment.

## Commands

```bash
npm ci
npm run dev        # http://localhost:5173
npm run check      # typecheck + lint + test + build
npm run test:e2e   # Playwright (needs a build and `npx playwright install chromium`)
```

## Known limitations

1. Balance is provisional and unplaytested. Fragmented Survival dominates the distribution (91 of 145); Imperial Survival is rare (13) and needs a strong army, a kept bargain or restored authority, and an undivided empire. Ruling through the commander can never lead to Imperial Survival (defending the office is ruled out, and sharing power has not reached it in any path).
2. Some 476 sequences are harsh: restoring authority over a divided empire and then defending the office ends in collapse despite Legitimacy 70. Intended (unity collapses), but worth a playtest.
3. Unpaid-cost rules are a single, simple formula (half, rounded up, one step). They may need tuning per resource after playtesting.
4. Sources for the new events are Britannica plus tertiary Wikipedia; the 475 peace and the Senate's embassy need scholarly sources; D5 and ending framing have review points (`docs/HISTORICAL_REVIEW.md`).
5. The ending report text exists only as data; nothing displays it yet.
6. Saves are per browser; no export yet.
7. The sandbox cannot download Actions logs; results come from job annotations and the jobs API.
8. Channel URLs and the privacy page's hosting details are still pending.
9. GitHub moves `ubuntu-latest` to Ubuntu 26 from 19 Oct 2026; watch the next CI runs.

## Next smallest testable milestone (Phase 2, milestone 6)

**The ending screen**, from the existing `EndingReport` data:
1. A dedicated end-of-campaign view: ending title and category, the "why" conditions, the six report sections, the three key decisions with their effects, unpaid costs and looming threats, all labelled as fictional alternate history.
2. A plain "What really happened" contrast block, linking to the sourced 475–480 events (no comparison mode yet).
3. Replay and Start over; the save already restores finished campaigns.
4. Accessibility (headings, landmarks, focus on arrival), 360/768/1440 px layouts, Playwright for each of the three endings.
Share card and Creator Mode follow later.

## Session log

| Session | Date | Work | Verification |
| --- | --- | --- | --- |
| 1 | 2026-10-15 | Phase 1 foundation and core UI | Sandbox only |
| 2 | 2026-10-15 | GitHub + CI; engine, validator, D1 | CI: 74/74 tests, build |
| 3 | 2026-10-15 | D2, delayed consequences, saves, decision UI, Playwright in CI | CI: 94/94 Vitest, 20/20 Playwright, typecheck, lint, build |
| 4 | 2026-10-15 | D3, 468 consequences before D3, narrative reports, event stream, scenario v3, 27-combination matrix; mobile-menu race fix | CI: 115/115 Vitest, 22/22 Playwright, typecheck, lint, build (run 38810346645) |
| 5 | 2026-10-16 | Research 467–472; D4 with recovery; 472 consequences; situation in reports; scenario v4; 81-combination matrix | CI: 139/139 Vitest, 24/24 Playwright, typecheck, lint, build (run 38946100373) |
| 6 | 2026-10-16 | Research 473–480; D5; 475/476 consequences; ending rules and report data; unpaid-cost rules; scenario v5; 243-combination matrix | CI: 167/167 Vitest, 28/28 Playwright, typecheck, lint, build (run 38949456541) |
