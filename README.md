# The Alternate Timeline

*History happened once. What if it didn't?*
An interactive historical experience by **Tales of the Past**.

Explore documented history, change a pivotal decision and compare the two timelines. The first campaign is **The Fall of Rome (c. 455–476 AD)**.

> **Status: Phase 2, milestone 1.** The sourced historical timeline works, and the first of five alternate-history decisions is playable on a tested deterministic engine. The remaining decisions, endings, map, comparison and Creator Mode are not built yet and are labelled as such in the app. See [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md).

![CI](https://github.com/nesasone991/the-alternate-timeline/actions/workflows/ci.yml/badge.svg)

## Requirements

- Node.js **20.19 or newer** (22 LTS recommended) and npm.
- No accounts, API keys or paid services.

## Getting started

```bash
npm ci               # install the exact versions in package-lock.json
npm run dev          # start the dev server at http://localhost:5173
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Type-check, then build the static site into `dist/` |
| `npm run preview` | Serve the production build locally at http://localhost:4173 |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint |
| `npm test` | Unit and component tests (Vitest + Testing Library, jsdom) |
| `npm run check` | All of the above in sequence — run before every commit |

CI (GitHub Actions) runs install, typecheck, lint, tests and build on every push to `main`.

## Project layout

```
src/
  app/            routes, layout shell, error boundary
  pages/          one component per route
  components/     shared UI: layout (header, footer) and primitives (icons, badges)
  features/       campaigns, history (timeline), settings, workspace, home
  data/           campaign catalog and per-campaign content (scenarios/rome)
  types/          contracts: history, campaign, simulation, map, creator
  lib/            dates, catalog lookups, validation, small hooks
  config/         brand constants and channel links
  styles/         Tailwind entry and design tokens
public/           favicon, Cloudflare Pages _redirects and _headers
tests/            unit/ (pure logic and data) and components/ (rendered UI)
docs/             architecture, scope, history review, QA, deployment, state
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — stack, structure and the reasons behind them
- [MVP scope](docs/MVP_SCOPE.md) — must / should / later
- [Historical review](docs/HISTORICAL_REVIEW.md) and [data provenance](docs/DATA_PROVENANCE.md)
- [Decisions log](docs/DECISIONS.md)
- [QA checklist](docs/QA_CHECKLIST.md) — with evidence
- [Deployment](docs/DEPLOYMENT.md) — free static hosting
- [Capture guide](docs/CAPTURE_GUIDE.md) — demo checklist for Tales of the Past
- [Project state](docs/PROJECT_STATE.md) — read this first in every new session

## Licence

Original code: all rights reserved by the project owner (see [LICENSE](LICENSE)). Third-party software: see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
