# Architecture

## Stack and why

| Layer | Choice | Reason |
| --- | --- | --- |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`) | Data contracts for history, sources and future simulation state are the backbone of the product; the compiler enforces them. |
| UI | React 19 | Brief's preferred stack; large ecosystem for the map and testing work ahead. |
| Build | Vite 7 | Fast dev server, static output, no server required. |
| Routing | React Router 7 (declarative `BrowserRouter`) | Brief's preferred router. Declarative mode is enough for a static SPA; data routers are unnecessary without a backend. |
| Styling | Tailwind CSS 4 + CSS design tokens | Tokens live once in `src/styles/index.css` (`@theme`) and are used as utilities. A few component classes (`.btn`, `.plate`, `.badge`) keep repeated patterns consistent. |
| State | React state + one tiny external store for settings | Zustand was optional in the brief and is not needed: settings use `useSyncExternalStore`; simulation state is a `useReducer` around the pure engine inside the workspace. Revisit if game state must cross routes (end screen, Creator Mode). |
| Icons | In-repo SVG set (`Icon.tsx`) | Fourteen icons do not justify a dependency. Swap for `lucide-react` later if the set grows; the component API stays the same. |
| Fonts | Device fonts only | No download, no third-party request, no licence to track. Palatino-family serif fits the subject. Self-hosting an OFL font is a later polish option. |
| Tests | Vitest + Testing Library + jsdom; Playwright | Unit and component tests share Vite's pipeline. Playwright runs end-to-end against the real production build (`vite preview`) in a desktop and a phone-sized browser, in CI. |
| Hosting | Cloudflare Pages (free plan), prepared but not deployed | `dist/` is plain files. The build generates `_headers` and `robots.txt` for the release channel; no `_redirects` or `404.html`, so Pages serves the app for every route (SPA mode). See [Release and hosting](#release-and-hosting). |

Runtime dependencies are only `react`, `react-dom` and `react-router`.

## Structure

```
src/app         App shell: routes (App.tsx), layout with header/footer and settings dialog,
                error boundary, route loading fallback.
src/pages       One component per route. Pages compose features; they hold no data.
src/components  Shared, campaign-agnostic UI: layout/ (header, footer, page header, brand mark),
                ui/ (Icon, Badges).
src/features    campaigns/  catalog card and numeral emblem
                history/    timeline panel, event entry, source links, playback reducer
                simulation/ decision engine, endings and ending report, event stream, scenario validator,
                            saves, UI hook, decision panel
                settings/   settings model, store, hooks, dialog
                workspace/  mode tabs, map placeholder, info panel
                home/       hero diagram, how-it-works steps
src/data        campaigns.ts — the catalog (single source of truth for titles, periods, status)
                scenarios/rome/ — sources, actual-history timeline, overview copy,
                                  alternate.ts (authored fiction: decisions, flags)
                scenarios/index.ts — campaign id → content registry
src/types       Contracts: history, campaign, simulation (Phase 2), map (Phase 3), creator (Phase 5)
src/lib         Dates and era notation, catalog lookups, data validation, small hooks
src/config      Brand constants, (empty until supplied) channel links, release.ts (channel, analytics
                endpoint, feedback link, build commit, APP_VERSION)
scripts/        release.mjs (shared build/deploy config: channel, CSP, _headers, robots), check-dist.mjs
                (deployment check of dist/), both plain Node ESM
```

### Routes

| Path | Page |
| --- | --- |
| `/` | Home |
| `/explore` | Campaign explorer |
| `/how-it-works` | Full explanation of the loop |
| `/about` | Principles, limitations, all sources |
| `/privacy` | What is stored and what is not |
| `/campaigns/:campaignId` | Overview (or "not available yet" for coming-soon campaigns) |
| `/campaigns/:campaignId/workspace?mode=real\|alternate\|comparison` | Workspace, lazy-loaded chunk. `?event=<id>` opens Real History at that event (used by links from the ending) |
| `/campaigns/:campaignId/ending` | The ending experience of a finished campaign, lazy-loaded chunk |
| `*` | Not found |

Settings is a modal dialog available from every page, not a route.

## Key design rules in the code

1. **Campaign data is never hard-coded in components.** Titles, periods, status and copy come from `src/data`. Adding a campaign = one catalog entry + one `scenarios/<id>/` folder + one line in `scenarios/index.ts`.
2. **Actual history is immutable.** `romeActualTimeline` is deep-frozen at load; a unit test proves writes throw. Alternate-history data will live in a separate dataset (Phase 2).
3. **Data is validated.** `lib/validation.ts` checks source references, chronology, date precision, caveats on contested events and https-only URLs. It runs in the unit tests and logs in development builds. When scenarios move to JSON files in Phase 2, add runtime schema validation (Zod) at load.
4. **Precision is never overstated.** Dates render at their recorded precision (`formatHistoricalDate`). The map area is an explicit placeholder rather than a decorative image.
5. **No fake controls.** Unbuilt features are absent or explained in text (the map placeholder has no controls; the Comparison tab explains it is not built and disables the year slider). Coming-soon campaigns have no button.
6. **Playback is a pure reducer** (`timelinePlayback.ts`): deterministic, unit-tested, independent of animation timing. The same reducer will drive Creator Mode playback.
7. **Settings are validated on read and write**, size-limited and read via own-property checks to rule out prototype pollution.

## Decision engine (Phase 2)

`src/features/simulation/engine.ts` — pure functions over an authored `AlternateScenario`:

| Function | Purpose |
| --- | --- |
| `createInitialState` | Start state: authored resources (clamped), no flags, empty records |
| `evaluateChoices` | Each choice at the current decision: available or not, each prerequisite with a plain-language reason, projected effects after clamping |
| `applyChoice` | Commits a choice; returns `{ ok: false, error, message }` instead of throwing for unknown, unavailable or out-of-turn choices |
| `replay` | Rebuilds any branch from a list of choice ids — the basis for saves, bookmarks and Creator Mode replays |
| `enumeratePaths` | Every reachable path honouring prerequisites — the Blueprint's path matrix |

Rules enforced in code and tests: no randomness (the `seed` field is reserved and documented, never used); no mutation (inputs are frozen in tests); resources clamped to 0–100 with requested vs applied change recorded; a decision's effects (and each consequence's) are **settled together** — one net change per resource, clamped once — and an unpaid cost becomes a structural consequence (below); every committed choice produces a `ChoiceRecord` (traceability for the end screen).

### How consequences carry forward

Three mechanisms, all authored and all explained to the player — none is a bare balancing penalty:

| Mechanism | When it acts | What the player sees beforehand | Recorded as |
| --- | --- | --- | --- |
| **Prerequisite** (`Requirement`: resource `min` / `below`, `flag`, `notFlag`) | Before a choice can be taken | "Not available: Economy 30 or more (you have 25)" | — |
| **Conditional effect** (`Choice.conditionalEffects`) | At commit, judged on the state before the choice | "Because you paid the armies first, …" plus its chips | `ChoiceRecord.conditional` |
| **Scheduled consequence** (`Choice.consequences`) | When the timeline reaches its `dueYear`; an optional condition is checked against the state at that time | The hint and the year only — never the numbers | `SimulationState.pending` → `resolved` (with `triggered` and an explanation, including why it lapsed) |

Resolution order is deterministic: due consequences resolve on arrival at the next node, oldest due year first, then in the order they were scheduled. Consequences due after the last written node stay pending (and visible) until a later decision exists.

### Order of events within a year (fixed rule)

A turn at year *Y* always runs in this order:

1. **On arrival**, every consequence with `dueYear ≤ Y` resolves (each condition checked against the state at that moment, in the order above). The resulting state is what the player sees.
2. **The player decides.** Prerequisites, conditional effects and the projection are all evaluated against the state from step 1.
3. **On confirm**, the choice's immediate and conditional effects apply and its consequences are scheduled for later years.

So every consequence due in 468 resolves **before** Decision 3 (c. 468) is shown, every consequence due in 472 before Decision 4 (c. 472), and every consequence due in 475 before Decision 5 (c. 475); their effects are already in the numbers the player decides with.

**The settlement of 476** is the documented point where 476 consequences resolve: after Decision 5 the campaign arrives at the `settlement-476` ending node (year 476); everything due by 476 resolves there, in the usual order, and **only then** is the ending classified from the resulting state. Consequences due later (480) stay pending as long-term implications. Decision 5's order-of-events box says this in words before the player commits. The decision panel states this in an "Order of events in c. …" box and lists the consequences that have just arrived (including lapsed ones, marked "No effect."). `ResolvedConsequence.resolvedAtNodeId` records which turn a consequence was resolved on.

### Settlement and unpaid costs (`settleEffects`)

Decisions and consequences go through one function. The base and conditional effects of a choice (or the effects of a consequence) are summed **per resource** and applied once, clamped to 0–100, so a gain and a cost in the same decision offset each other before any limit is applied (a near-empty treasury can be helped by a loan in the same decision that grants tax relief).

If the net change would take a resource **below 0**, the unpaid part is a shortfall. The scenario's `shortfallRules` say what happens instead of it silently vanishing: **half the shortfall, rounded up, falls on another resource, and a flag is set**. Rome uses: unpaid Economy → Political Unity, flag *The treasury failed to pay its obligations* (the court seizes goods and labour from the provinces); unpaid Military → Unity, *The army could not supply the troops asked of it*; unpaid Legitimacy → Unity, *The court's authority collapsed*; unpaid Unity → Legitimacy, *The provinces openly defied the court*. There is no chain: if the target is also exhausted, the transfer is itself capped and recorded. Gains above 100 are simply capped.

Each `StructuralConsequence` (resource, unpaid amount, explanation, the applied transfer, flag) is stored on the `ChoiceRecord` or `ResolvedConsequence` that caused it, appears in the event stream, and is shown to the player: before committing ("Cannot be paid in full: 5 Economy … Political Unity would fall 51 → 48"), after committing, and in arrived consequences. The flags feed later report text and the ending rules (Imperial Survival needs no default and no collapse of authority), but none of them removes options, so recovery stays possible (an empire that defaulted can still reach Fragmented Survival).

### Endings (`classifyEnding`, `endings.ts`)

`AlternateScenario.endings` define the endings (id, category, title, summary); `endingRules` are checked **in order** on arrival at an `ending` node and the first whose conditions all hold wins; the validator requires the last rule to be unconditional, every ending to have a rule, and an ending node to have rules and report text. Conditions are ordinary requirements over resources and flags (from every decision and from unpaid costs), plus an optional `maxLooming`: the number of **looming threats** — consequences still pending after the ending year that would do harm (a negative effect) and whose condition already holds. `classifyEnding` returns every rule it checked with each condition's plain-language result, so the reason for an ending is always traceable; `state.endingId` and `state.endingRuleId` record the result.

Rome's rules (scenario v5): **Imperial Survival** — office not handed over, Legitimacy ≥ 35, Military ≥ 40, Unity ≥ 25, Economy ≥ 5, no collapse of authority, no default, no looming threat. **Fragmented Survival** — Unity ≥ 25 and Legitimacy ≥ 15, or the office handed to successors with Unity ≥ 25; at most one looming threat. **Imperial Collapse** — otherwise.

`buildEndingReport(scenario, state)` returns a structured, data-only `EndingReport` with `fiction: true`: ending and category, the rule's explanation and conditions, one authored line each for the final settlement, imperial authority, the army, the economy, the regional powers and Constantinople (first matching `EndingLine`, by ending and conditions), the three most important decisions (ranked by how much each — directly, through unpaid costs and through its later consequences — moved the resources the deciding rule looked at; ties go to the earlier decision), the looming threats and the unpaid costs. The workspace shows the ending, its summary and why, with a link to the ending experience (below).

### Narrative reports

A choice may carry a `ChoiceNarrative`: what was ordered, the effect on the empire (with optional `effectVariants`), stakeholders (`gains` / `loses` / `mixed`, each optionally conditional) and what remains uncertain (with optional variants). `resolveNarrative` picks the **first** matching variant and filters stakeholders using the state **before** the choice — the same state that decides conditional effects — so the text always agrees with the numbers and is deterministic. From Decision 4 a narrative also carries the **political situation**: a default `situation`, `situationVariants` (first match wins, e.g. "the treasury is all but empty") and `situationNotes`, where **every** note whose condition holds is shown in authored order — so one report can reflect several earlier decisions, the relationship with Constantinople and the regions, and resource levels at once. These fields are optional in the type (D1–D3 reports predate them) and required for D4 by the Rome tests; the validator rejects notes or variants without a default situation. The UI shows the sections as: the political situation (with notes), your decision, who gains and who loses influence, immediate consequences, risks that remain.

The resolved text is stored on the `ChoiceRecord`, shown in a "Report to the council" box labelled as fictional alternate history (not sourced history), and kept in saves implicitly (saves replay choices). The validator requires non-empty text, at least one unconditional `gains` and `loses` group, and valid conditions.

### Event stream for animation (`storyEvents.ts`)

`replayWithEvents(scenario, choiceIds)` returns the same final state as `replay` plus an ordered list of `StoryEvent`s: one `decision` event per choice (year, labels, outcome, resolved narrative, applied effects, flags, map cues) followed by every `consequence` event that resolved on arrival at the next node (triggered or lapsed, explanation, effects, map cues — empty when lapsed). Events have a 1-based `sequence`, non-decreasing years and `fiction: true`. **Map cues** (`emphasis` / `movement` / `pressure`, tone, label) refer only to `SCHEMATIC_REGIONS` (Italy, Sicily, Sardinia–Corsica, Africa, Gaul, Hispania, Illyricum, Constantinople) — named areas, never geometry — so the future map can animate them however Phase 3's data allows, without the content implying borders. No randomness and no clocks: the same choices always produce byte-identical events (tested for every valid path). Decision and consequence events carry their structural consequences; a finished campaign ends with one `ending` event (ending, category, rule) after the 476 consequences.

### Saves

`savegame.ts` writes `{ format, formatVersion, scenarioId, scenarioVersion, savedAt, choices }` to `localStorage` (`tat.save.<scenarioId>`) after each confirmed decision. Loading **replays the choices through the engine**, so a save cannot contain a state the rules can't produce; tampered resources or flags are ignored. Oversized, unparsable, foreign, malformed or rule-breaking saves are `corrupt`; a different format, campaign or scenario version is `incompatible`. Either way the player starts fresh, is told why, and the old save is kept until they discard it or confirm a new decision. Start over deletes the save. Bump `AlternateScenario.version` whenever authored choices change in a way that would change replays, and add a `changes` note for it (the validator requires a note for the current version). An older save is refused with an explanation built from those notes — e.g. "The saved game was made with an earlier version of this campaign (version 2; this is version 3). The decisions have changed since then, so your earlier choices cannot be replayed exactly. Version 3: …" — a newer or unlabelled save gets its own message. Current: scenario version 5, state schema version 4 (v5 added `structural` to records and resolved consequences, and `endingRuleId` to the state).

`validateScenario.ts` checks the graph: unique ids, links resolve, no cycles, no unreachable nodes, 2–4 choices per decision, known resources and flags, valid ranges, **every choice has a downside**, at least one ungated choice per decision (no softlocks), and historical-context links point at real event ids; and the shortfall rules, ending rules and ending-report lines described above. It runs in the unit tests and at dev startup.

Data separation: `alternate.ts` refers to actual history only by event id (for "set against these sourced events" links). It never imports the actual-history dataset. Both datasets are deep-frozen.

UI: `useSimulation` wraps the engine with a pre-commit selection (change your mind until you confirm; after that, Start over). State lives in the workspace component, so it survives switching tabs, and is autosaved after each decision (above).

## Ending experience (`src/features/ending`, `pages/EndingPage.tsx`)

**Data flow — one source of truth.** `EndingPage` reads the saved game (`loadSave`); the save is only a list of choices. If storage is blocked, it accepts the choices the workspace passes in router state, but only if they replay to an ending. `EndingExperience` then derives everything from those choices with the engine, once, in a `useMemo`:

| Data | From | Used by |
| --- | --- | --- |
| Final state, records, resolved and pending consequences | `replayWithEvents` | Decision review, world report, hero |
| Ordered story events | `replayWithEvents` | Replay |
| Resource history | `resourceTimeline` (storyEvents.ts) | Charts, slider, table, replay |
| Ending report | `buildEndingReport` | Hero, world report, comparison |
| Rule trace (met and unmet conditions) | `classifyEnding` | Hero "why", "How the ending was decided" |

`resourceTimeline` does **not** recalculate anything: each point copies the `after` values the engine recorded on an event's applied effects and structural transfers, and it throws if its last point differs from the replayed final state. Unit tests check every path: the point just before each decision equals `replay(prefix).resources`. The Playwright tests compare every chart marker with the same replay.

**Sections:** the fate of your empire (category seal, atmosphere line, headline, introduction = category framing + report settlement, why = rule explanation + the measures that held, or for collapse the measures a better ending needed) · your empire in 476 (final tiles; four small-multiple line charts, one per resource, single gold series, filled markers for decisions and hollow for consequences, a shared range slider that drives a live readout, and a table view) · the decisions that changed history (all five, from the records) · the world you created (report sections, key decisions, threats and unpaid costs, rule trace in a disclosure) · what really happened (fiction panel beside the sourced events dated 474–480 from the actual timeline, with sources, certainty, caveats and Real History links) · replay and restart.

**Category identity** (`endingThemes.ts`, `EndingSeal.tsx`) is presentation only: atmosphere line, framing sentence, accent and wash colours, and an SVG seal — an unbroken laurel ring (survival), five separated arcs (fragmented) or arcs pushed apart (collapse) — around the year in Roman numerals. Campaign-specific narrative always comes from the report.

**Replay** steps through `StoryEvent`s with Previous/Next and focus management; it holds only a local index and never writes the save. **Start a new timeline** opens a native `<dialog>` (focus on "Keep this timeline", Escape cancels); only "Erase it and start again" calls `clearSave` and opens the workspace at Decision 1.

**Motion:** the seal and chart lines draw once via `.seal-draw`/`.chart-draw`, enabled only under `html[data-motion='full']`; under reduced motion everything is static. **Accessibility:** one `h1`, five `h2` sections with an on-page nav, charts as `role="img"` with plain-language summaries plus a table, the slider with `aria-valuetext`, a live readout, text labels on every badge (fiction/sourced, took effect/did not happen, ✓/✕ with screen-reader text), 44 px targets.

## Release and hosting

**Channels.** `VITE_RELEASE_CHANNEL` is `beta` (default) or `production`, read once in `scripts/release.mjs` (`resolveReleaseConfig`, which also validates `VITE_ANALYTICS_ENDPOINT` and `VITE_FEEDBACK_URL`; an invalid value stops the build). A Vite plugin in `vite.config.ts` writes `_headers` and `robots.txt` into `dist/` and, on beta, adds `<meta name="robots" content="noindex, nofollow">`. In the app, `src/config/release.ts` exposes the same values; the beta shows `BetaNotice` above the header on every page and a footer build label (`APP_VERSION`, kept equal to `package.json` by a test, plus the commit from `CF_PAGES_COMMIT_SHA` or `GITHUB_SHA`).

**Headers** (generated, one `/*` rule and one `/assets/*` rule): CSP `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' [analytics origin]; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`, and on beta `X-Robots-Tag: noindex, nofollow`. Hashed assets: `Cache-Control: public, max-age=31536000, immutable`; HTML keeps Pages' default revalidation, so a new deploy is picked up on the next navigation.

**Routing.** Pages serves `index.html` for any path without a file when the project has no top-level `404.html`. The app's own `NotFoundPage` handles unknown routes. Saves are origin-scoped `localStorage`, so they survive redeploys at the same address.

**Outdated tabs.** A tab opened before a deploy may request a lazy chunk that no longer exists. `ErrorBoundary` recognises the browsers' dynamic-import failure messages (`isOutdatedBuildError`) and offers a reload instead of the generic error.

**Deployment check.** `scripts/check-dist.mjs` (CI and `npm run check:dist`) fails on: a `404.html` or a `/* /index.html` rewrite; a missing or non-hashed entry script; robots meta, `_headers` or `robots.txt` not matching the channel; source maps or `.env` files; secret-like strings; files over 25 MiB or more than 20,000 files; an entry chunk over 160 kB gzipped; a missing build commit when the build machine provided one.

**Emulation in CI.** After the normal Playwright run against `vite preview`, CI starts `wrangler pages dev dist` (Cloudflare's local Pages emulator; no account or token) and runs `tests/e2e/deployment.spec.ts` against it with `E2E_CLOUDFLARE=1`, which adds header assertions.

### Usage counts (analytics)

`src/lib/analytics.ts`, off unless the build sets `VITE_ANALYTICS_ENDPOINT` to a GoatCounter `/count` URL. No third-party script is loaded: the app sends one `fetch` GET per event (`no-cors`, `credentials: 'omit'`, `referrerPolicy: 'no-referrer'`, `keepalive`) with only `p` (event name), `t` (event title), `e=true` and a cache-busting `rnd`. Only the ten names in `ANALYTICS_EVENTS` can be sent:

| Event | Sent when | Where |
| --- | --- | --- |
| `campaign-start` | Alternate History shows Decision 1 with nothing decided, once per new game in a page visit (a restored save in progress is not a start) | `WorkspacePage` |
| `decision-1-complete`, `decision-3-complete` | The first / third decision is confirmed | `WorkspacePage` |
| `campaign-complete` and `ending-<category>` | The fifth decision is confirmed and the ending is classified | `WorkspacePage` |
| `replay-start` | "Replay your decisions" is opened on the ending page | `ReplayPanel` via `EndingExperience` |
| `new-timeline-from-ending`, `new-timeline-from-workspace` | A confirmed new timeline from the ending page, or Start over in the workspace | `EndingExperience`, `WorkspacePage` |

Nothing is sent when: no endpoint is configured; Settings → "Anonymous usage counts" is off (stored in `tat.settings`); `navigator.doNotTrack === '1'` or Global Privacy Control is on; or `navigator.webdriver` is true (automated browsers, including the test suites). No identifier, choice, resource value, save content or referrer is ever sent, and nothing is stored on the device for analytics. `trackEvent` never throws. The CSP's `connect-src` gains the endpoint origin only when configured.

## Historical Animation Studio (future Creator Mode) — constraints kept now

Creator Mode should grow into a reusable studio for animated historical maps, camera moves, timeline playback and vertical/horizontal recording layouts, without paid rendering APIs. Current code keeps that path open:

1. **One clock, as data.** `timelinePlayback.ts` is a pure reducer over years. Any animated scene must be a function of this clock (year plus progress within it), never of CSS or `setTimeout` timing, so a recording is reproducible and seekable.
2. **Branches are replayable.** `replay(scenario, choiceIds)` reconstructs any alternate timeline exactly — the save format already uses this; a studio shot list can be stored as `{ choiceIds, fromYear, toYear, camera, frame }`.
3. **Time-indexed outputs.** Actual events, future map snapshots (`MapSnapshot.year`), `ChoiceRecord.year` and `ResolvedConsequence.resolvedYear` all carry years. `replayWithEvents` already turns any choice list into an ordered, deterministic event stream with map cues on schematic regions — the studio's keyframe source ("468: provinces drift — pressure on Gaul and Hispania").
4. **Contracts exist:** `FramePreset` (1080×1920, 1920×1080), `PlaybackSpeed`, `CaptureOverlay` (`src/types/creator.ts`), `CameraPreset` (`src/types/map.ts`).
5. **Renderers must take explicit props** (year, camera, layout, overlay) and not read global UI state, so a chrome-free studio route can mount them on their own.
6. **Rendering stays in the browser** (SVG first; Canvas if performance needs it). Capture is screen recording first; browser-native `canvas.captureStream()` + `MediaRecorder` is a free later option. No server rendering, no paid APIs.

## Accessibility and motion

- Skip link; focus moves to `<main>` after each navigation; one `h1` per page.
- Native controls throughout (range input, radio groups, `<dialog>`); WAI-ARIA tabs with arrow/Home/End keys.
- Touch targets ≥ 44×44 px. Visible gold focus ring.
- `data-motion` on `<html>` combines the user's setting with `prefers-reduced-motion`; reduced motion disables all transitions and animations. Ambient decoration has its own switch.
- Status is always carried by text, never colour alone (badges say "Sourced history", "Fictional alternate history", "Contested", "Not built yet").

## Technical risks

| Risk | Mitigation |
| --- | --- |
| Historical geometry for maps may not exist under a free licence at the needed accuracy | Blueprint fallback: labelled schematic regions. Decide in Phase 3 after a data search. |
| Map library choice (SVG/D3 vs MapLibre) affects mobile performance | Prototype both against real data before committing; the workspace chunk is already split so the map code will not slow the landing page. |
| Tailwind arbitrary values (`text-[clamp(...)]`) are verbose | Acceptable for now; promote repeated ones to tokens if they spread. |
| Dependency versions resolve at install time | Commit `package-lock.json` after the first `npm install`. |
| Cloudflare changes Pages behaviour or limits | Only standard files (`_headers`, `robots.txt`) are used; the build is portable to any static host; the deployment check and emulator tests flag routing regressions. |
| `wrangler@4` in CI resolves to a newer minor version | It is a test tool only; the emulator step reports its version. Pin an exact version if it starts to vary. |
