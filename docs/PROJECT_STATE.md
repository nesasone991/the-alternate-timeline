# Project state

**Last updated:** 17 Oct 2026, end of session 8 (private beta release preparation).
**Read this first in every new session**, then `docs/ARCHITECTURE.md` and the Master Blueprint.

Repository: `github.com/nesasone991/the-alternate-timeline` (private). CI runs on every push to `main`: install, typecheck, lint, Vitest, build, deployment check, Playwright (desktop + mobile against the production build), then the deployment tests against Cloudflare's local Pages emulator.

## Where things stand

- **Phase 1** and **Phase 2, milestones 1–6** (engine, five decisions, endings, ending experience) — done.
- **Private beta preparation (session 8)** — done and verified in CI run 39035842952 (commit `d797e2e`): 192/192 Vitest, Playwright 74 passed + 2 skipped (header check, which needs `_headers`), Cloudflare Pages emulator 30/30, deployment check passed, typecheck, lint (0 warnings), build. Details: `docs/QA_CHECKLIST.md`.
- **Not deployed.** Nothing has been published; deployment waits for the owner's authorisation (`docs/DEPLOYMENT.md`).
- The interactive map, the Animation Studio and other campaigns have **not** been started, as instructed. No simulation rule or ending classification was changed.

### Implemented this session

- **Cloudflare Pages readiness:** release channel (`VITE_RELEASE_CHANNEL`, `beta` by default) in `scripts/release.mjs`; the build generates `_headers` (CSP and security headers, `noindex` on beta, immutable asset caching) and `robots.txt`, and adds a robots meta tag on beta. No `_redirects` and no `404.html`, so Pages serves the app for every route (SPA mode). Source maps no longer published. `scripts/check-dist.mjs` (`npm run check:dist`) enforces all of this plus secret scanning and size limits.
- **Beta labelling:** "Private beta" bar on every page, footer build label (`0.9.0-beta.1, build <commit>`), questionnaire links (bar and ending page) when `VITE_FEEDBACK_URL` is set.
- **Usage counts:** `src/lib/analytics.ts`, ten allow-listed anonymous events (campaign start, Decision 1 and 3 completion, completion, ending category ×3, replay, new timeline ×2) sent to a GoatCounter `/count` endpoint only if `VITE_ANALYTICS_ENDPOINT` is set; no script, cookie, identifier or decision history; Settings opt-out, Do Not Track / Global Privacy Control respected, never from automated browsers.
- **Privacy page** rewritten for local storage, the counted events, GoatCounter and Cloudflare (with policy links).
- **Audit fixes:** stale "preview / not built / planned" copy on About, How it works, the campaign card and overview; disabled map buttons removed; outdated-build error message with reload; Open Graph tags.
- **Tests:** `analytics.test.ts`, `release.test.ts`, beta/privacy/usage-count component tests, `tests/e2e/deployment.spec.ts` (every route direct + reload, saves across reloads, `noindex`, no third-party requests or console errors, headers on the emulator). Playwright can target any server with `E2E_BASE_URL`.
- **Docs:** `DEPLOYMENT.md` (exact Pages steps and live-site checklist), `LAUNCH_AUDIT.md` (blockers vs later), `BETA_FEEDBACK.md` (two-minute questionnaire), plus ARCHITECTURE, DECISIONS (D60–D69), MVP_SCOPE, QA_CHECKLIST, README.

### Launch blockers for the private beta (owner actions)

1. Authorise and create the Cloudflare Pages project (`docs/DEPLOYMENT.md`, steps 1–7).
2. Run the live-site checks in `DEPLOYMENT.md` (routes and reload, saves, headers, `noindex`, console, one real phone).
3. Build the questionnaire from `BETA_FEEDBACK.md` in a free form tool and set `VITE_FEEDBACK_URL`.

Optional: a GoatCounter site and `VITE_ANALYTICS_ENDPOINT`. No code blockers are known.

### Not implemented

- Map (Phase 3); comparison mode and share card (Phase 4); Creator Mode / Historical Animation Studio (Phase 5).
- Export/import of saves; screen-reader, Safari/Firefox and real-device testing.

## Commands

```bash
npm ci
npm run dev          # http://localhost:5173
npm run check        # typecheck + lint + test + build + deployment check
npm run test:e2e     # Playwright (needs a build and `npx playwright install chromium`)
npx --yes wrangler@4.151.1 pages dev dist --port 8788   # Cloudflare Pages emulator
E2E_BASE_URL=http://localhost:8788 E2E_CLOUDFLARE=1 npx playwright test deployment
```

Build variables (all public, all optional): `VITE_RELEASE_CHANNEL` (`beta` | `production`), `VITE_ANALYTICS_ENDPOINT` (`https://<code>.goatcounter.com/count`), `VITE_FEEDBACK_URL` (`https://…`).

## Known limitations

1. Not deployed: real-host behaviour (Pages routing, headers, caching) is verified only on Cloudflare's emulator.
2. GoatCounter delivery is untested (no account); counts will undercount visitors who use Do Not Track, GPC, blockers or the opt-out.
3. Not tested with a real screen reader or in Safari/Firefox; Playwright runs Chromium only, phones are emulated.
4. Balance is provisional (Imperial Survival 13 of 145 paths); historical review points for 467–480 remain open (`docs/HISTORICAL_REVIEW.md`); some events rely on tertiary sources.
5. The ending page needs a finished save; there is no shareable link to a particular ending yet.
6. `style-src 'unsafe-inline'` remains in the CSP (inline style attributes).
7. External source links are not checked automatically.
8. The sandbox cannot download Actions logs or install packages; its typecheck now runs without Node types to match CI (the first CI run of this session caught a `process` reference the sandbox missed).
9. GitHub moves `ubuntu-latest` to Ubuntu 26 from 19 Oct 2026; watch CI.

## Recommended next milestone

**Deploy the private beta** (after authorisation): create the Pages project, run the live-site checklist, set the questionnaire link, invite a small group of testers, and collect a week or two of answers and counts. No new feature work is needed for that.

In parallel, or after the first feedback: **Phase 3, milestone 1 — the map data decision and a schematic regional map** (find freely licensed geometry for c. 455–480 or adopt labelled schematic regions; render in the workspace with legend, keyboard zoom/pan and the "illustrative, not exact borders" label; drive it from existing data). Use beta feedback on clarity and mobile usability to adjust the decision UI first if it shows problems.

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
| 8 | 2026-10-17 | Private beta preparation: Cloudflare Pages build (headers, robots, SPA mode), deployment check, beta labelling, usage counts, privacy page, audit fixes, questionnaire, deployment docs | CI: 192/192 Vitest, 74 passed + 2 skipped Playwright, 30/30 on the Pages emulator, deployment check, typecheck, lint, build (run 39035842952) |
