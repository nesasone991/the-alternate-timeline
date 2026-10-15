# QA checklist

Last updated: 15 Oct 2026, session 2 (Phase 2, milestone 1).

## What ran where

There are three kinds of evidence below. They are not interchangeable.

| Label | Meaning |
| --- | --- |
| **CI** | Executed for real in GitHub Actions (`.github/workflows/ci.yml`) on the actual dependency tree: Node 22.23.3, npm 10.9.9, React 19.3.1, React Router 7.18.4, Vite 7.3.7, Vitest 3.2.7, TypeScript 5.8.3, ESLint 9.39.5, jsdom 26.1.0. |
| **Sandbox browser** | Executed in Playwright + Chromium against a build made in the development sandbox, which has no npm access. That build compiles the same source with esbuild and Tailwind 4.3's compiler, but uses a small stand-in for React Router. It proves the app's behaviour, not the real Vite bundle's. |
| **Inspection** | Checked by reading code or computing values; nothing executed in a browser or test runner. |

## CI runs (GitHub Actions, repo `nesasone991/the-alternate-timeline`)

| Run | Commit | Install | Typecheck | Lint (0 warnings allowed) | Tests | Build | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 38802316836 | `a5b5a01` | ✅ `npm install` (no lockfile) | ✅ | ✅ | ✅ | ✅ | First real run; no fixes were needed |
| 38802601285 | `e5afb16` | ✅ `npm install` | ✅ | ✅ | ✅ 74/74 | ✅ | Generated `package-lock.json` and committed it (`3a47f2e`) |
| 38802782301 | `ea3c62b` (actions v5) | ✅ `npm ci` from lockfile | ✅ | ✅ | ✅ 74/74 | ✅ | Reproducible install confirmed |

Test breakdown (CI, run 38802782301): `components/app.test.tsx` 8/8 · `unit/data.test.ts` 13/13 · `unit/dates.test.ts` 8/8 · `unit/engine.test.ts` 26/26 · `unit/playback.test.ts` 11/11 · `unit/settings.test.ts` 8/8 — **74 passed, 0 failed, 0 skipped**.

Build output (CI, `vite build`, disk size): main JS 316 kB, workspace chunk 28 kB (lazy-loaded), CSS 32 kB, `index.html` 4 kB.

How results are read: the sandbox cannot download Actions logs (served from a blocked storage host), so the workflow writes results as job annotations, which are read through the GitHub API. Step outcomes come from the jobs API.

## Phase 2 milestone 1 — decision engine and decision 1

| Check | Result | Evidence |
| --- | --- | --- |
| Engine unit tests (26): clamping both bounds, requested vs applied effects, resource/flag/not-flag prerequisites with reasons, boundary value (economy 30 allowed, 29 not), rejection of unknown / unavailable / out-of-turn choices, endings, no input mutation (frozen state), deterministic replay, path matrix, actual history unchanged after every path, validator catching broken links / cycles / unreachable nodes / free choices / gated-only decisions / bad ranges / unknown flags / unknown history ids | ✅ | CI |
| Mutation check: removing clamping, or raising a prerequisite, makes tests fail | ✅ | Sandbox (2 and 5 failures respectively; reverted) |
| D1 exact outcomes: tax reform 40/45/35/30 → 52/45/31/24; provincial revenue → 32/45/45/27; pay the armies → 28/59/35/34 (economy/military/unity/legitimacy) | ✅ | CI (unit) + sandbox browser |
| No choice is free; no choice dominates another on every resource | ✅ | CI |
| Component test: choose, confirm, resources change, Start over restores | ✅ | CI (jsdom) |
| Browser at 1440 and 360 px: choose, change mind before confirming, confirm, exact resource values, choice survives tab switch, Start over, same choice twice gives same numbers, keyboard-only (arrow keys + Enter), sourced-event link opens Real History at that event, no horizontal overflow | ✅ 12/12 | Sandbox browser |
| Fiction labelled wherever alternate content appears (decision panel, Decisions section) | ✅ | Sandbox browser + inspection |
| Alternate data never imports actual history; both datasets frozen | ✅ | CI (unit) + inspection |

## Phase 1 regression

| Check | Result | Evidence |
| --- | --- | --- |
| Phase 1 browser suite (navigation, coming-soon cards, timeline, playback, mode tabs, settings persistence, focus, skip link, 404s, source links, mobile menu, reduced motion) | ✅ 15/15 | Sandbox browser. The mode-tab check was updated: Alternate History is now playable; Comparison is still explained as unbuilt with its controls disabled. |
| All 9 routes × 360 / 768 / 1440 px: no horizontal overflow, no console errors, CSP enforced | ✅ | Sandbox browser |
| Phase 1 unit tests (40) and component tests (6) | ✅ | CI |
| Text contrast ≥ WCAG AA (body 13.5:1, muted 7.3:1, gold 7.0:1, fiction 6.2:1, evidence 8.2:1, button 7.9:1) | ✅ | Inspection (computed) |

## Not yet verified

| Check | Status |
| --- | --- |
| Browser tests against the **real Vite build** (with real React Router) | ⬜ Planned: add Playwright to CI |
| Screen readers (NVDA, VoiceOver) | ⬜ |
| Real devices: iOS Safari, Android Chrome, Firefox | ⬜ Only Chromium tested |
| Live deployment | ⬜ Not deployed |

## Verify locally

```bash
git clone https://github.com/nesasone991/the-alternate-timeline
cd the-alternate-timeline
npm ci
npm run check     # typecheck + lint + tests + build
npm run dev       # open http://localhost:5173/campaigns/fall-of-rome/workspace?mode=alternate
```

Then: pick **Reform taxation**, confirm, and check Economy reads 52, Legitimacy 24, Political Unity 31, Military 45. Start over and pick **Pay the armies first**: Military 59, Economy 28.
