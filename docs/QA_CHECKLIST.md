# QA checklist

Last updated: 16 Oct 2026, session 6 (Phase 2, milestone 5 — Decision 5 and ending rules).

## What ran where

| Label | Meaning |
| --- | --- |
| **CI** | Executed in GitHub Actions on the real dependency tree (Node 22.23.3, npm 10.9.9, React 19.3.1, React Router 7.18.4, Vite 7.3.7, Vitest 3.2.7, TypeScript 5.8.3, ESLint 9.39.5, jsdom 26.1.0, Playwright 1.64.1). Playwright runs against the **production build** served by `vite preview`. |
| **Sandbox** | Executed in the development sandbox, which has no npm access: an esbuild build with a React Router stand-in, unit tests through a Vitest stand-in, Playwright 1.56 against that build. Used to iterate before pushing; not a substitute for CI. |
| **Inspection** | Read or computed; not executed. |

## CI runs

| Run | Commit | Install | Typecheck | Lint (0 warnings) | Vitest | Build | Playwright | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 38802316836 | `a5b5a01` | `npm install` | ✅ | ✅ | ✅ | ✅ | — | Session 2, first real run |
| 38802782301 | `ea3c62b` | `npm ci` | ✅ | ✅ | ✅ 74/74 | ✅ | — | Session 2, reproducible install |
| 38805450840 | `c57690c` | `npm ci` failed (new dependency) → `npm install`, lockfile committed as `d375f43` | ✅ | ✅ | ✅ 94/94 | ✅ | ✅ 20/20 | Session 3 milestone; no fixes needed |
| 38805811336 | `60fb0ac` | ✅ `npm ci` from updated lockfile | ✅ | ✅ | ✅ 94/94 | ✅ | ✅ 20/20 | Confirms the updated lockfile installs cleanly |
| **38809509527** | `3928ed0` | ✅ `npm ci` | ✅ | ✅ | ✅ **115/115** | ✅ | ✅ **22/22** | **Session 4 milestone (Decision 3); passed on the first CI run** |
| 38809861059 | `441f225` (docs only) | ✅ `npm ci` | ✅ | ✅ | ✅ 115/115 | ✅ | ❌ 21/22 | **Intermittent failure** in a session-3 test: *mobile: every header page loads* timed out. Cause: the phone menu closed in an effect one frame after navigation; the test helper sampled the toggle in that frame, skipped opening the menu and waited on a hidden link. Not reproduced in 40 local repeats (faster machine); cause confirmed from the code. |
| **38810346645** | `6b94b0a` | ✅ `npm ci` | ✅ | ✅ | ✅ 115/115 | ✅ | ✅ 22/22 | **Fix:** menu links close the menu in the same update as the navigation; the helper waits for `aria-expanded="false"` before opening. Also 66/66 locally (suite ×3). |
| 38810557901 | `8fa1c6b` (docs only) | ✅ `npm ci` | ✅ | ✅ | ✅ 115/115 | ✅ | ✅ 22/22 | End of session 4 |
| **38946100373** | `00029a0` | ✅ `npm ci` | ✅ | ✅ | ✅ **139/139** | ✅ | ✅ **24/24** | **Session 5 milestone (Decision 4); passed on the first CI run** |
| 38946476398 | `f4831b1` (docs only) | ✅ `npm ci` | ✅ | ✅ | ✅ 139/139 | ✅ | ✅ 24/24 | End of session 5 |
| **38949456541** | `783239d` | ✅ `npm ci` | ✅ | ✅ | ✅ **167/167** | ✅ | ✅ **28/28** | **Session 6 milestone (Decision 5, endings, unpaid costs); passed on the first CI run** |

Vitest breakdown (run 38949456541): `components/app.test.tsx` 9/9 · `unit/data.test.ts` 13/13 · `unit/dates.test.ts` 8/8 · `unit/engine.test.ts` 35/35 · `unit/playback.test.ts` 11/11 · `unit/rome-campaign.test.ts` 57/57 · `unit/savegame.test.ts` 18/18 · `unit/settings.test.ts` 8/8 · `unit/story-events.test.ts` 8/8.

Playwright (run 38949456541), each in **desktop** (1440×900) and **mobile** (Pixel 7):

| Spec | Desktop | Mobile |
| --- | --- | --- |
| Home → Explore → campaign overview → workspace (with coming-soon cards unclickable, no sideways scroll) | ✅ | ✅ |
| Every header page loads; deep link survives refresh; unknown campaign → 404 | ✅ | ✅ |
| Buttons, icon buttons and tabs are at least 44 px tall | ✅ | ✅ |
| Real ↔ Alternate History switching keeps each mode working; Comparison explained and disabled | ✅ | ✅ |
| Sourced-context link in a decision opens that event in Real History | ✅ | ✅ |
| Play all five decisions with exact resources (25/67/21/39 at D3; 13/61/21/45 at D4; 22/57/14/56 at D5 after the 475 loyal-administration bonus); order-of-events boxes for 468, 472, 475 and the settlement of 476; D4 → D5 conditional shown; 476 consequences listed; ending **Imperial Collapse** at 13/47/9/70 with its reason; refresh restores the ending; Start over resets and clears the save | ✅ | ✅ |
| A D3 option blocked by earlier choices explains why (Military 49 < 50); a lapsed 468 consequence and a lapsed 472 consequence (treaty does not hold) are shown; the commander option at D4 is blocked with its reason | ✅ | ✅ |
| Empty treasury: the 472 debts find only 1 of 5 ("Could not be paid in full: 4 Economy", Unity 49 → 47, flag recorded); restoring authority blocked; the commander option warns "Cannot be paid in full: 5 Economy" before choosing; the bargain → Economy 4 at D5; defending the office then ends in **Fragmented Survival** | ✅ | ✅ |
| **Imperial Survival** reachable: armies paid → Italy → treaty → bargain → defend; 26/63/29/45; conditions listed | ✅ | ✅ |
| **Fragmented Survival** through successors: tax reform → federates → fortify → bargain → hand over; Unity 54, Legitimacy 6 | ✅ | ✅ |
| Changing your mind before confirming changes nothing | ✅ | ✅ |
| Damaged save: reported, kept until discarded, page keeps working | ✅ | ✅ |
| A real version 4 save is refused: "earlier version of this campaign (version 4; this is version 5)" plus the v5 change note | ✅ | ✅ |
| Keyboard only: arrow keys select, Enter confirms | ✅ | ✅ |

Build (CI, disk size): main JS 396 kB, workspace chunk 36 kB (lazy), CSS 36 kB.

## Milestone 5 checks (Decision 5, endings, unpaid costs)

| Check | Result | Evidence |
| --- | --- | --- |
| All 243 theoretical D1–D5 combinations match an independent reference model exactly (state at D3, D4, D5 and at the settlement; ending and rule; pending and looming consequences; unpaid-cost flags; refusal messages): **145 valid**; **27 blocked at D2, 27 at D3, 27 at D4, 17 at D5** (defending the office: Military below 40, or the commander rules) | ✅ | CI (unit) |
| `enumeratePaths` returns exactly the 145 valid paths; each ends at the settlement of 476 with five records, resources integers within 0–100 | ✅ | CI (unit) |
| All 21 states reaching D4 and all 54 reaching D5 have at least two options; sharing power and handing over are always open at D5 | ✅ | CI (unit) |
| No option at D3, D4 or D5 is better than another on every resource, from any reachable state | ✅ | CI (unit) |
| 475 consequences resolve before D5; 476 consequences resolve at the settlement, before the ending; every conditional 475/476 consequence occurs both triggered and lapsed across the paths, unconditional ones always land; only 480 consequences remain pending | ✅ | CI (unit + Playwright) |
| **Endings** over the 145 valid paths: Imperial Survival 13, Fragmented Survival 91, Imperial Collapse 41. Defending the office and sharing power each lead to all three; handing over leads to two — the final choice alone never decides | ✅ | CI (unit) |
| Specific ending cases: Imperial Survival (armies → Italy → treaty → bargain → defend, 26/63/29/45; also via sharing power after restoring authority); Fragmented Survival (default in 472 then a won war; successors after federates and a bargain); Imperial Collapse (restoring authority over a divided empire then fighting, 64/35/9/30; sharing power with Legitimacy 14) | ✅ | CI (unit + Playwright) |
| Ending report for every valid path: fictional, all six sections, three key decisions, matched conditions all met, deterministic | ✅ | CI (unit) |
| **Unpaid costs:** every cost cut short at 0 has a structural consequence on the same decision or consequence (half the unpaid part, rounded up, on the target; flag set); examples at 472 (debts) and 475 (commander's ambition at Legitimacy 0); recovery remains possible after a default | ✅ | CI (unit + Playwright) |
| Settlement: costs and gains in one decision offset before clamping (bargain at Economy 0 → 4, no shortfall) | ✅ | CI (unit) |
| Engine fixture: settlement, shortfall without chaining, no rule → no conversion, projection shows structural, classification trace with looming threats, ending report, validator checks for shortfall rules, ending rules and report lines | ✅ | CI (unit) |
| Event stream: structural consequences on events; final `ending` event after the 476 consequences | ✅ | CI (unit) |
| Saves: v4 refused with the v5 note; v2 lists v3–v5; D4 save restores at D5; finished campaign restores with its ending, unpaid costs and pending threats; a save that continues past the ending is rejected | ✅ | CI (unit + component + Playwright) |
| Four new sourced events in chronological order with caveats; actual history unchanged by every path | ✅ | CI (unit) |
| Visual check of the unpaid-cost warning and the ending result at 1440 px and 360 px | ✅ | Sandbox screenshots + Playwright overflow checks |

## Milestone 4 checks (Decision 4)

| Check | Result | Evidence |
| --- | --- | --- |
| All 81 theoretical D1 × D2 × D3 × D4 combinations match an independent reference model exactly (state at D3, at D4, final, pending consequences, refusal message): **54 valid**, **9 blocked at D2**, **9 blocked at D3**, **9 blocked at D4** (restoring authority: Legitimacy 11, 8, 8 < 15 or Economy 0, 7 < 10; commander: Military 49, 49, 46, 46 < 50) | ✅ | CI (unit) |
| `enumeratePaths` returns exactly the 54 valid paths; each ends at the D5 checkpoint (c. 474), resources integers within 0–100, four records, only post-474 consequences pending | ✅ | CI (unit) |
| All 21 states reaching D4 have at least two options; the bargain is always available | ✅ | CI (unit) |
| Every 472 consequence resolves on arrival at D4 (year 472), before the choice: treaty holds triggered (Military 67) and lapsed (Military 49, no effect); resentment and expedition debts always land; debts capped at 0 from Economy 1 (requested −5, applied −1); nothing due after giving up Africa | ✅ | CI (unit + Playwright) |
| Every D4 option reacts to D3 (eastern backing / eastern doubts / quiet sea / loyal provinces) | ✅ | CI (unit + Playwright) |
| No D3 or D4 option is better than another on every resource, from any reachable state | ✅ | CI (unit) |
| Recovery: Economy 0 → bargain to 10 with loans, still costs Military 2 and leaves the 476 strain pending; Legitimacy 8 → bargain to 16 (Negotiated survival) or commander to 0 (Temporary stabilisation, commander's ambition pending); arrival states are exactly what earlier choices produced (no hidden rescue) | ✅ | CI (unit + Playwright) |
| Reports: every D4 report has situation, decision, gains and losses, consequences and risks; deterministic; situation variants for collapsed standing and empty treasury; notes for the expedition, the treaty, Africa, Italy, field army, federates and a strong army; effect and risk variants; conditional groups | ✅ | CI (unit + component + Playwright) |
| `resolveNarrative`: first matching situation variant, every matching note in order, no situation fields for older reports; validator rejects notes without a default situation | ✅ | CI (unit) |
| Event stream: 472 consequences (including a lapsed one) between the D3 and D4 decision events; D4 event carries the situation and map cues; deterministic | ✅ | CI (unit) |
| Saves: v3 save refused with the v4 change note; v2 save lists v3 and v4 changes; blocked D4 combination rejected; D4 save restores byte-identically with its report | ✅ | CI (unit + Playwright) |
| Actual-history dataset unchanged; four new events in chronological order with caveats | ✅ | CI (unit) |
| Visual check of D4 turn and report at 1440 px and 360 px | ✅ | Sandbox screenshots + Playwright overflow check |

## Milestone 3 checks (Decision 3)

| Check | Result | Evidence |
| --- | --- | --- |
| All 27 theoretical D1 × D2 × D3 combinations match an independent reference model exactly (resources at D3, final resources, pending consequences): **21 valid**, **3 blocked at D2** (*pay the armies → field army*: Economy 25 < 30), **3 blocked at D3** (*tax reform → Italy → expedition* and *provinces → Italy → expedition*: Military 49 < 50; *tax reform → federates → treaty*: Legitimacy 12 < 15) | ✅ | CI (unit) |
| `enumeratePaths` returns exactly the 21 valid paths; each ends at the D4 checkpoint (c. 471) with resources integer and within 0–100, and only post-471 consequences pending | ✅ | CI (unit) |
| Every consequence due in 468 resolves on arrival at D3 (`resolvedAtNodeId = d3-north-africa`, year 468), before the choice; none due ≤ 468 left pending | ✅ | CI (unit) |
| Triggered **and** lapsed cases inside Rome: landowners (triggered at Legitimacy 24 and 17, lapsed at 29), provinces drift (triggered after tax/armies + Italy, lapsed with provincial revenue), field-army victories (triggered at Military 56, lapsed at 53); unconditional 468 costs always land | ✅ | CI (unit + Playwright) |
| Multiple 468 consequences resolve in scheduling order, each against the state at that moment (Legitimacy 24 → 19 → 23) | ✅ | CI (unit) |
| D2 shapes D3: veterans (field army), garrisoned coasts (Italy), federates and field-army bonuses when fortifying, expedition blocked after Italy + tax/provinces | ✅ | CI (unit + Playwright) |
| No D3 option dominates another on every resource, from any valid D1–D2 state | ✅ | CI (unit) |
| Narrative: deterministic for all 21 paths; correct variants (islands at Military ≥ 60, garrisoned coasts, field army); conditional groups only when their condition holds; every report has orders, effect, gains, loses, uncertainty | ✅ | CI (unit + Playwright) |
| Event stream: decision/consequence order (468 consequences before D3), sequence 1…n, non-decreasing years, all fiction, same state as `replay`, byte-identical on repeat, cues only on known regions, no cues for lapsed consequences, invalid path throws | ✅ | CI (unit) |
| Saves: all 21 D3 paths round-trip byte-identically; v2 save refused with an explanation including the v3 change note; newer and unlabelled versions get their own messages; blocked D3 path in a save rejected | ✅ | CI (unit + Playwright) |
| Validator: change note required for the current version; narrative and map-cue checks; Rome passes | ✅ | CI (unit) |
| Actual-history dataset unchanged after every path | ✅ | CI (unit) |
| Visual check of D3 turn and report at 1440 px and 360 px (no overflow, readable gains/loses labels) | ✅ | Sandbox screenshots + Playwright overflow check |

## Milestone 2 checks

| Check | Result | Evidence |
| --- | --- | --- |
| All nine D1 × D2 combinations: eight reach the D3 checkpoint with hand-calculated resources; *pay the armies → field army* is rejected with "Not available: Economy 30 or more (you have 25)." | ✅ | CI (unit) |
| Each D1 choice visibly shapes D2: blocked option (armies), "Because you paid the armies first" bonus, "Because the provinces already keep a share" bonus | ✅ | CI (unit + Playwright) |
| No D2 option dominates another on every resource, from each D1 starting point | ✅ | CI (unit) |
| Every choice has a benefit, a cost and an outcome explanation; hints contain no numbers | ✅ | CI (unit) |
| Scheduled consequences: pending until due, resolved on arrival, condition checked at due time, lapse explained, logged; later ones stay pending past the last written decision | ✅ | CI (unit, fixture + Rome) |
| Conditional effects apply only when their condition held before the choice | ✅ | CI (unit) |
| Saves: round-trip of reachable paths is byte-identical; empty / corrupt / oversized / foreign / wrong version / wrong campaign / malformed / rule-breaking saves rejected; injected resources and flags ignored; prototype-pollution keys ignored | ✅ | CI (unit) |
| Save written after each decision, restored on remount, cleared by Start over | ✅ | CI (component + Playwright) |
| Actual-history dataset unchanged after every path and every save load | ✅ | CI (unit) |
| Phase 1 browser regression suite (15 checks) | ✅ 15/15 | Sandbox |

## Not yet verified

| Check | Status |
| --- | --- |
| Screen readers (NVDA, VoiceOver) | ⬜ |
| Safari and Firefox (Playwright runs Chromium only) | ⬜ |
| Real phones | ⬜ Pixel 7 emulation only |
| Live deployment | ⬜ Not deployed |

## Verify locally

```bash
git pull
npm ci
npm run check                     # typecheck + lint + unit/component tests + build
npx playwright install chromium   # once
npm run test:e2e                  # end-to-end, desktop and mobile
npm run dev                       # http://localhost:5173/campaigns/fall-of-rome/workspace?mode=alternate
```

By hand: choose **Pay the armies first** → Decision 2 opens showing why, the 459 consequence (Economy 28 → 25) and the field army locked. Choose **Concentrate the armies in Italy** → Decision 3 (c. 468) opens with "Order of events in c. 468" and the provinces-drift consequence already applied (Political Unity 27 → 21); Economy 25, Military 67, Legitimacy 39. Choose **Join the eastern expedition against Carthage** → Decision 4 (c. 472) opens with the expedition's debts already applied: Economy 13, Military 61, Political Unity 21, Legitimacy 45, and the Decision 3 report. Choose **Restore the emperor's authority** → Decision 5 (c. 475) opens with the 475 bonus already applied: Economy 22, Military 57, Political Unity 14, Legitimacy 56. Choose **Defend the imperial office by force** → the settlement of 476 lists what happened in 476, and the result is **Imperial Collapse** (13/47/9/70) with the reason. Refresh: the same state comes back. **Start over**: everything resets.

Other endings: **Pay the armies first → Concentrate in Italy → Treaty with Gaiseric → Bargain → Defend** gives Imperial Survival; **Reform taxation → Settle federates → Give up Africa → Bargain → Hand government to successors** gives Fragmented Survival.

Recovery: **Let the provinces keep a share** → **Fund a mobile field army** → **Join the eastern expedition** reaches Decision 4 with Economy 0; restoring authority is locked, the commander option warns that 5 Economy cannot be paid, and **Strike a bargain with the regional powers** brings Economy to 4 through landowner loans.

To see the old-save message: in the browser console run `localStorage.setItem('tat.save.rome-alternate', JSON.stringify({format:'the-alternate-timeline/save',formatVersion:1,scenarioId:'rome-alternate',scenarioVersion:4,savedAt:'2026-10-15T20:00:00.000Z',choices:['reform-taxation']}))` and reload.
