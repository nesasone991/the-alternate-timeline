# QA checklist

Last updated: 15 Oct 2026, session 3 (Phase 2, milestone 2).

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
| _see PROJECT_STATE_ | docs commit | `npm ci` from updated lockfile | | | | | | Confirms the updated lockfile installs cleanly |

Vitest breakdown (run 38805450840): `components/app.test.tsx` 9/9 · `unit/data.test.ts` 13/13 · `unit/dates.test.ts` 8/8 · `unit/engine.test.ts` 21/21 · `unit/playback.test.ts` 11/11 · `unit/rome-campaign.test.ts` 13/13 · `unit/savegame.test.ts` 11/11 · `unit/settings.test.ts` 8/8.

Playwright (run 38805450840), each in **desktop** (1440×900) and **mobile** (Pixel 7):

| Spec | Desktop | Mobile |
| --- | --- | --- |
| Home → Explore → campaign overview → workspace (with coming-soon cards unclickable, no sideways scroll) | ✅ | ✅ |
| Every header page loads; deep link survives refresh; unknown campaign → 404 | ✅ | ✅ |
| Buttons, icon buttons and tabs are at least 44 px tall | ✅ | ✅ |
| Real ↔ Alternate History switching keeps each mode working; Comparison explained and disabled | ✅ | ✅ |
| Sourced-context link in a decision opens that event in Real History | ✅ | ✅ |
| Complete D1 and D2 with exact resources; refresh restores; Start over resets and clears the save | ✅ | ✅ |
| Changing your mind before confirming changes nothing | ✅ | ✅ |
| Damaged save: reported, kept until discarded, page keeps working | ✅ | ✅ |
| Save from an older campaign version refused with a reason | ✅ | ✅ |
| Keyboard only: arrow keys select, Enter confirms | ✅ | ✅ |

Build (CI, disk size): main JS 328 kB, workspace chunk 32 kB (lazy), CSS 32 kB.

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

By hand: choose **Pay the armies first** → Decision 2 opens showing why, the 459 consequence (Economy 28 → 25) and the field army locked. Choose **Concentrate the armies in Italy** → Military 67, Economy 25, Political Unity 27, Legitimacy 39. Refresh: the same state comes back. **Start over**: everything resets.
