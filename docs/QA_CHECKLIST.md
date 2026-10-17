# QA checklist

Last updated: 17 Oct 2026, session 8 (private beta release preparation).

## What ran where

| Label | Meaning |
| --- | --- |
| **CI** | Executed in GitHub Actions on the real dependency tree (Node 22.23.3, npm 10.9.9, React 19.3.1, React Router 7.18.4, Vite 7.3.7, Vitest 3.2.7, TypeScript 5.8.3, ESLint 9.39.5, jsdom 26.1.0, Playwright 1.64.1). Playwright runs against the **production build** served by `vite preview`. |
| **Sandbox** | Executed in the development sandbox, which has no npm access: an esbuild build with a React Router stand-in, unit tests through a Vitest stand-in, Playwright 1.56 against that build. Used to iterate before pushing; not a substitute for CI. |
| **Emulator** | Executed in GitHub Actions against `wrangler pages dev dist` (Cloudflare's local Pages emulator, Wrangler 4.151.1): SPA routing, `_headers` and `robots.txt` as Pages applies them. Not the real Cloudflare service. |
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
| 38949912492 | `dc81001` (docs only) | ✅ `npm ci` | ✅ | ✅ | ✅ 167/167 | ✅ | ✅ 28/28 | End of session 6 |
| **39033328144** | `f6722e7` | ✅ `npm ci` | ✅ | ✅ | ✅ **172/172** | ✅ | ✅ **46/46** | **Session 7 milestone (ending experience); passed on the first CI run** |
| 39033531083 | `f9bf7e1` (docs only) | ✅ `npm ci` | ✅ | ✅ | ✅ 172/172 | ✅ | ✅ 46/46 | End of session 7 |
| 39035664211 | `5418aba` | ✅ `npm ci` | ❌ | ✅ | ✅ 192/192 | ✅ + deployment check ✅ | ✅ 74/74 (2 skipped) + emulator ✅ 30/30 | Session 8, first run. Typecheck: `process` used in `deployment.spec.ts`, which the app tsconfig checks without Node types (the sandbox typecheck had Node types, so missed it). Every other step passed |
| **39035842952** | `d797e2e` | ✅ `npm ci` | ✅ | ✅ | ✅ **192/192** | ✅ + deployment check ✅ | ✅ **74/74** (2 skipped) + emulator ✅ **30/30** | **Session 8 milestone (private beta preparation). Fix: the Cloudflare flag comes from Playwright config metadata** |
| 39036075719 | `12394ff` (docs; Wrangler pinned to 4.151.1) | ✅ `npm ci` | ✅ | ✅ | ✅ 192/192 | ✅ + deployment check ✅ | ✅ 74/74 (2 skipped) + emulator ✅ 30/30 | End of session 8 |

Vitest breakdown (run 39035842952): `components/app.test.tsx` 17/17 · `unit/analytics.test.ts` 6/6 · `unit/data.test.ts` 13/13 · `unit/dates.test.ts` 8/8 · `unit/engine.test.ts` 35/35 · `unit/playback.test.ts` 11/11 · `unit/release.test.ts` 7/7 · `unit/rome-campaign.test.ts` 57/57 · `unit/savegame.test.ts` 18/18 · `unit/settings.test.ts` 9/9 · `unit/story-events.test.ts` 11/11.

Playwright (run 39035842952), each in **desktop** (1440×900) and **mobile** (Pixel 7), against `vite preview`. The header check is skipped there (Vite's preview server does not apply `_headers`) and runs on the emulator:

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
| From the workspace's ending, *See the fate of your empire* opens the ending page with the same result; Back returns to the workspace | ✅ | ✅ |
| **Imperial Survival** ending page: headline, category, fiction label, introduction and why from the report; four final values and **every chart point equal to the engine replay**; table rows = history points; five decisions with the chosen strategies; report sections; threats; sourced 476 event; no sideways scroll | ✅ | ✅ |
| **Fragmented Survival** ending page: the same checks | ✅ | ✅ |
| **Imperial Collapse** ending page: the same checks | ✅ | ✅ |
| A Real History link from the ending opens the workspace at the sourced event (476, Odoacer) | ✅ | ✅ |
| Replay steps through every event (count from the replay), ends on the ending, returns focus to its button; the saved game is byte-identical before and after, and after a reload | ✅ | ✅ |
| Start a new timeline: Escape and *Keep this timeline* change nothing; *Erase it and start again* clears the save and opens Decision 1; after a reload nothing is restored and the ending page says there is no finished campaign | ✅ | ✅ |
| 360 / 768 / 1440 px: no sideways scroll; every button, summary, nav link, Real History link and slider at least 44 px; one `h1` and the five section `h2`s in order; chart summaries for screen readers | ✅ | ✅ |
| Keyboard: the history slider moves with Home/arrow keys and the readout follows; the restart dialog opens with Enter and closes with Escape | ✅ | ✅ |
| Reduced motion: `data-motion="reduced"` and no running animations on the ending page | ✅ | ✅ |
| Keyboard only: arrow keys select, Enter confirms | ✅ | ✅ |
| **Deployment:** each of 11 routes (all pages, workspace in both modes, ending, two unknown paths) opened directly and reloaded: HTTP 200 HTML, the right `h1` and page title, no console errors, no request to another host | ✅ | ✅ |
| **Deployment:** a save made on a nested route survives reload and a direct visit to the ending route; *Continue your campaign* returns to it unchanged | ✅ | ✅ |
| **Deployment:** beta bar and footer label; `robots` meta `noindex, nofollow`; description and Open Graph tags; `/robots.txt` disallows all | ✅ | ✅ |
| **Deployment:** a full campaign from the home page to the ending page and a reload makes no request to any other host and logs no error (on the emulator run the CSP is applied, so this also means no CSP violations) | ✅ | ✅ |
| **Deployment:** response headers on `/`, the ending route and `/privacy` (CSP, `nosniff`, `DENY`, `X-Robots-Tag: noindex`) and immutable caching on the hashed entry script | skipped | skipped |

Cloudflare Pages emulator (same run, Wrangler 4.151.1): the deployment spec above, all 15 tests in both projects, **30/30 passed**, including the header check.

Build (CI, disk size): main JS 404 kB (123 kB gzipped, budget 160 kB), workspace chunk 20 kB and decision panel 20 kB (lazy, shared), ending chunk 40 kB (lazy), CSS 40 kB; 9 files in `dist/`.

Deployment check (CI, `scripts/check-dist.mjs`): passed: no `404.html` or SPA rewrite, hashed entry present, robots meta, `_headers` and `robots.txt` match the beta channel, no source maps, `.env` files or secret-like strings, sizes within Pages limits, build label commit `d797e2e` present in the JavaScript.

## Private beta checks (session 8)

| Check | Result | Evidence |
| --- | --- | --- |
| Release config: beta default; invalid channel, non-GoatCounter endpoint and non-https feedback link rejected; production indexable, beta not (header, meta, robots.txt); CSP admits the analytics origin only when configured; no `unsafe-eval`; header lines within Pages limits | ✅ | CI (unit, `release.test.ts`) |
| `APP_VERSION` equals `package.json` version; test build is beta with analytics off | ✅ | CI (unit) |
| Analytics status: active only with endpoint + Settings consent + no DNT/GPC + not automated; exact request format (`p`, `t`, `e`, `rnd` only); blocked states send nothing; never throws; one event per ending category | ✅ | CI (unit, `analytics.test.ts`) |
| In the app: start, D1, D3, completion and ending category counted in order on a full campaign; Start over counts a new timeline and a new start; a restored save is not a start; ending page counts replay and new timeline; no choice or resource name in any request; nothing sent without an endpoint | ✅ | CI (component) |
| Beta bar and build label on every page; privacy page lists the ten counted moments and says nothing is sent in this build; no opt-out checkbox when nothing can be sent | ✅ | CI (component) |
| Build with `VITE_ANALYTICS_ENDPOINT` and `VITE_FEEDBACK_URL` set: deployment check passes, CSP gains only `https://tat-beta.goatcounter.com`, privacy page shows the opt-out and (automated browser) "nothing is sent", feedback links appear in the beta bar and on the ending page | ✅ | Sandbox build, screenshots at 360 px |
| `usageCounts` setting defaults on, can be turned off, invalid values fall back | ✅ | CI (unit) |
| Visual review of the beta bar, footer label and privacy page at 360 and 1440 px | ✅ | Sandbox screenshots; shortened the beta bar text and styled the policy links after review |
| Outdated-build recovery message | ⬜ Not executed | Inspection only: the message matching follows Chromium, Firefox and Safari wording; check on the live site after a second deploy |
| GoatCounter receives and shows events | ⬜ Not executed | Needs an owner account; request format follows GoatCounter's documented `/count` API |


## Milestone 6 checks (ending experience)

| Check | Result | Evidence |
| --- | --- | --- |
| Resource history (`resourceTimeline`) starts at the authored values, ends at the replayed final state, and just before each decision equals `replay(prefix)`, for all 145 paths; deterministic | ✅ | CI (unit) |
| Lapsed consequences appear with no change; unpaid-cost transfers are included | ✅ | CI (unit) |
| Ending page renders from a save; replay and restart behave (component, jsdom); explains missing and unfinished campaigns | ✅ | CI (component) |
| All three endings in the browser, with chart values compared to the engine replay | ✅ | CI (Playwright, desktop + mobile) |
| No simulation rule or classification changed (all 243-combination checks unchanged and passing) | ✅ | CI (unit) |
| Visual review of hero, seal, charts, decisions and world sections at 1440, 768 and 360 px for all three endings | ✅ | Sandbox screenshots; fixed: seal numeral overflow, a badge that caused 22 px sideways scroll at 360 px, a cluttered hero (now resource measures only), a too-regular collapse seal |

### Contrast (WCAG 2.1, computed)

| Pair | Ratio | Needs |
| --- | --- | --- |
| Parchment text on ink | 13.48 | 4.5 |
| Muted text on ink / night | 8.25 / 7.31 | 4.5 |
| Gold text on ink | 7.90 | 4.5 |
| Burgundy-bright text on ink / on the fiction panel | 6.96 / 6.63 | 4.5 |
| Teal-bright text on ink / on the history panel | 9.24 / 8.55 | 4.5 |
| Parchment / muted text on the strongest hero wash (collapse) | 10.16 / 6.22 | 4.5 |
| Bronze seal and rules (graphics) on ink | 4.08 | 3.0 |
| Gold chart line (graphics) on ink | 7.90 | 3.0 |

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
| Live deployment on Cloudflare Pages | ⬜ Not deployed (prepared; needs owner authorisation). Checklist: `docs/DEPLOYMENT.md` |
| GoatCounter event delivery | ⬜ No account configured |
| Outdated-build recovery after a redeploy | ⬜ |
| External source links still resolve | ⬜ Not checked automatically |

## Verify locally

```bash
git pull
npm ci
npm run check                     # typecheck + lint + unit/component tests + build + deployment check
npx playwright install chromium   # once
npm run test:e2e                  # end-to-end, desktop and mobile (header check skipped on vite preview)
npx --yes wrangler@4.151.1 pages dev dist --port 8788 &                       # Cloudflare's local Pages emulator
E2E_BASE_URL=http://localhost:8788 E2E_CLOUDFLARE=1 npx playwright test deployment
npm run dev                       # http://localhost:5173/campaigns/fall-of-rome/workspace?mode=alternate
```

By hand: choose **Pay the armies first** → Decision 2 opens showing why, the 459 consequence (Economy 28 → 25) and the field army locked. Choose **Concentrate the armies in Italy** → Decision 3 (c. 468) opens with "Order of events in c. 468" and the provinces-drift consequence already applied (Political Unity 27 → 21); Economy 25, Military 67, Legitimacy 39. Choose **Join the eastern expedition against Carthage** → Decision 4 (c. 472) opens with the expedition's debts already applied: Economy 13, Military 61, Political Unity 21, Legitimacy 45, and the Decision 3 report. Choose **Restore the emperor's authority** → Decision 5 (c. 475) opens with the 475 bonus already applied: Economy 22, Military 57, Political Unity 14, Legitimacy 56. Choose **Defend the imperial office by force** → the settlement of 476 lists what happened in 476, and the result is **Imperial Collapse** (13/47/9/70) with the reason. Refresh: the same state comes back. **Start over**: everything resets.

Then **See the fate of your empire** opens the ending page: check the seal, the charts (move the slider with the keyboard), the five decisions, the report, *What really happened* (follow a Real History link), *Replay your decisions*, and *Start a new timeline* (cancel first, then confirm).

Other endings: **Pay the armies first → Concentrate in Italy → Treaty with Gaiseric → Bargain → Defend** gives Imperial Survival; **Reform taxation → Settle federates → Give up Africa → Bargain → Hand government to successors** gives Fragmented Survival.

Recovery: **Let the provinces keep a share** → **Fund a mobile field army** → **Join the eastern expedition** reaches Decision 4 with Economy 0; restoring authority is locked, the commander option warns that 5 Economy cannot be paid, and **Strike a bargain with the regional powers** brings Economy to 4 through landowner loans.

To see the old-save message: in the browser console run `localStorage.setItem('tat.save.rome-alternate', JSON.stringify({format:'the-alternate-timeline/save',formatVersion:1,scenarioId:'rome-alternate',scenarioVersion:4,savedAt:'2026-10-15T20:00:00.000Z',choices:['reform-taxation']}))` and reload.
