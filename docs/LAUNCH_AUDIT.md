# Production readiness audit: private beta

**Date:** 17 October 2026 (session 8). **Build audited:** 0.9.0-beta.1. **Scope:** the Fall of Rome campaign and its ending experience; the map, comparison, share card and Creator Mode are out of scope and labelled as not built.

Evidence comes from the automated suites (CI), the sandbox Playwright run against a local stand-in for Cloudflare Pages, and screenshots at 360 and 1440 px. Nothing has been checked on the real host yet; that list is in [DEPLOYMENT.md](DEPLOYMENT.md#checks-on-the-live-site).

## Critical blockers for the private beta

No code blockers remain open. These are owner actions, in order:

| # | Blocker | Who | Status |
| --- | --- | --- | --- |
| B1 | Authorise deployment, create the Cloudflare Pages project with `VITE_RELEASE_CHANNEL=beta` | Owner | Open |
| B2 | Run the live-site checks (routes and reload, saves, headers, `noindex`, console, one real phone) | Owner, or Claude once deployed | Open |
| B3 | Create the questionnaire from `BETA_FEEDBACK.md` and set `VITE_FEEDBACK_URL`; without it testers have no way to answer | Owner | Open |

Analytics are optional: the beta works with them off. If wanted, follow the GoatCounter steps in `DEPLOYMENT.md` and verify that events arrive.

### Blockers found and fixed in this session

| Area | Problem | Fix |
| --- | --- | --- |
| Hosting | `public/_redirects` held `/* /index.html 200`, which Cloudflare Pages does not need (SPA mode) and which can loop or conflict | Removed; build check fails if it returns or if a `404.html` appears |
| Indexing | Nothing stopped search engines indexing a private beta | Beta builds send `X-Robots-Tag: noindex, nofollow`, a robots meta tag and a `Disallow: /` robots.txt; production must be chosen explicitly |
| Placeholder content | About page said "early development build … only the opening decisions are playable … endings not built"; How it works said "Preview" and "In development"; the campaign showed "Development preview", "Difficulty: Set after balancing", feature cards called the decisions a preview and the endings "planned" under old names; the info panel said "decisions written so far" | All rewritten to the current state; endings named as built |
| Inactive controls | The map placeholder had three disabled zoom/recenter buttons (Blueprint: no inactive buttons) | Removed; the placeholder says the map comes in a later version |
| Privacy | Privacy page said hosting was undecided and could not cover analytics | Rewritten: local storage, the exact list of counted events, what GoatCounter receives and keeps, opt-outs, Cloudflare as host, links to both policies; status line shows whether counting is active in this browser |
| Error handling | After a redeploy, an open tab asking for a deleted code chunk showed the generic error page | Recognised and shown as "A new version is available" with a reload button; settings and save are kept |
| Exposure | Production source maps were published (`sourcemap: true`) | Off; build check fails on any `.map`, `.env` file or secret-like string |
| Beta labelling | No sign that this is a beta, or which build a tester used | "Private beta" bar on every page (with the questionnaire link when set) and a footer build label with version and commit |

## Audit by area

| Area | Result | Evidence | Can wait |
| --- | --- | --- | --- |
| Navigation and links | Pass. Every route opens directly and after reload with the right heading and title; unknown paths show the app's not-found page; header and footer links work | `deployment.spec.ts` (11 routes × visit + reload), `navigation.spec.ts` | External source links are not checked automatically (the sandbox has no general web access); spot-check them before public launch |
| Mobile usability | Pass in emulation: no horizontal scroll at 360/768/1440, 44 px targets on the ending page and header, Pixel 7 project runs every spec | `ending.spec.ts`, `navigation.spec.ts`, `campaign.spec.ts` | Real iOS Safari and Android Chrome testing (the beta's job) |
| Accessibility | Pass on automated checks: one `h1` per page, heading outline, keyboard operation of decisions, slider and dialogs, focus return, reduced motion, chart text alternatives and table view | Playwright specs, component tests | Screen-reader testing (NVDA, VoiceOver); Firefox and Safari |
| Loading performance | Pass. Entry chunk 123 kB gzipped (403 kB raw) in the CI Vite build, under the enforced 160 kB budget; workspace and ending load as separate chunks; hashed assets cached for a year; no web fonts or third-party requests | `check-dist.mjs`, deployment spec ("talks to no other host") | Lighthouse run on the real host; `<link rel="modulepreload">` tuning |
| Error handling | Pass. Error boundary for crashes and outdated builds; damaged or incompatible saves offer recovery; blocked storage falls back; unknown campaign and missing ending have their own pages | Component tests, `ending.spec.ts` | Report-a-problem link to the questionnaire from the error page |
| Metadata and titles | Pass. Unique title per route, meta description, Open Graph and Twitter summary tags, theme colour, favicon | `deployment.spec.ts` titles and meta | Open Graph image (comes with the share card, Phase 4); canonical URL once the address is final |
| Robots and indexing | Pass for beta: three signals as above; Pages preview URLs are `noindex` by Cloudflare's default | `release.test.ts`, `deployment.spec.ts`, `check-dist.mjs` | Production switch at public launch |
| Privacy policy | Pass for beta, subject to owner review | `PrivacyPage.tsx`, component test | Owner to confirm the wording suits their jurisdiction before public launch |
| Security headers | Pass: strict CSP (`script-src 'self'`, no `unsafe-eval`, `frame-ancestors 'none'`), `nosniff`, `DENY` framing, referrer and permissions policies | `release.test.ts`; header test against the Pages emulator in CI | `style-src 'unsafe-inline'` remains (inline style attributes in React); removing it needs a refactor |
| Placeholder content | Pass after fixes | Search for "preview", "not built", "phase", "TODO" in `src/` | Footer channel links are hidden until URLs exist in `src/config/brand.ts` |

## Must be done before a public launch (not for the beta)

1. Historical review of every event and of the 467–480 open points (`HISTORICAL_REVIEW.md`); replace or corroborate tertiary sources.
2. Licence decision (`LICENSE` is currently all rights reserved).
3. `VITE_RELEASE_CHANNEL=production` and a final address; a custom domain only with owner approval.
4. Real-device, cross-browser and screen-reader testing, informed by beta feedback.
5. Balance review using beta ending distribution (Imperial Survival is reachable on 13 of 145 valid paths).
6. The remaining MVP items: map (Phase 3), comparison and share card (Phase 4), Creator Mode (Phase 5).

## Known limitations of this audit

- The sandbox cannot install packages, so its local build uses esbuild with a small router stand-in; CI runs the real Vite build and Playwright on every push.
- Cloudflare Pages behaviour is tested against `wrangler pages dev` (Cloudflare's emulator) in CI, not the real service.
- GoatCounter receipt of events cannot be tested without an account; the request format follows its documented `/count` endpoint and is unit-tested.
