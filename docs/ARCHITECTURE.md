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
| Hosting | Any static host (Cloudflare Pages recommended) | `dist/` is plain files. `_redirects` and `_headers` are included for Cloudflare. |

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
                simulation/ decision engine, scenario validator, saves, UI hook, decision panel
                settings/   settings model, store, hooks, dialog
                workspace/  mode tabs, map placeholder, info panel
                home/       hero diagram, how-it-works steps
src/data        campaigns.ts — the catalog (single source of truth for titles, periods, status)
                scenarios/rome/ — sources, actual-history timeline, overview copy,
                                  alternate.ts (authored fiction: decisions, flags)
                scenarios/index.ts — campaign id → content registry
src/types       Contracts: history, campaign, simulation (Phase 2), map (Phase 3), creator (Phase 5)
src/lib         Dates and era notation, catalog lookups, data validation, small hooks
src/config      Brand constants and (empty until supplied) channel links
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
| `/campaigns/:campaignId/workspace?mode=real\|alternate\|comparison` | Workspace, lazy-loaded chunk |
| `*` | Not found |

Settings is a modal dialog available from every page, not a route.

## Key design rules in the code

1. **Campaign data is never hard-coded in components.** Titles, periods, status and copy come from `src/data`. Adding a campaign = one catalog entry + one `scenarios/<id>/` folder + one line in `scenarios/index.ts`.
2. **Actual history is immutable.** `romeActualTimeline` is deep-frozen at load; a unit test proves writes throw. Alternate-history data will live in a separate dataset (Phase 2).
3. **Data is validated.** `lib/validation.ts` checks source references, chronology, date precision, caveats on contested events and https-only URLs. It runs in the unit tests and logs in development builds. When scenarios move to JSON files in Phase 2, add runtime schema validation (Zod) at load.
4. **Precision is never overstated.** Dates render at their recorded precision (`formatHistoricalDate`). The map area is an explicit placeholder rather than a decorative image.
5. **No fake controls.** Unbuilt features are either absent or disabled with a visible reason (camera controls, unbuilt modes). Coming-soon campaigns have no button.
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

Rules enforced in code and tests: no randomness (the `seed` field is reserved and documented, never used); no mutation (inputs are frozen in tests); resources clamped to 0–100 with requested vs applied change recorded; every committed choice produces a `ChoiceRecord` (traceability for the end screen).

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

So every consequence due in 468 resolves **before** Decision 3 (c. 468) is shown, and its effects are already in the numbers the player decides with. The decision panel states this in an "Order of events in c. 468" box and lists the consequences that have just arrived (including lapsed ones, marked "No effect."). `ResolvedConsequence.resolvedAtNodeId` records which turn a consequence was resolved on.

### Narrative reports

A choice may carry a `ChoiceNarrative`: what was ordered, the effect on the empire (with optional `effectVariants`), stakeholders (`gains` / `loses` / `mixed`, each optionally conditional) and what remains uncertain (with optional variants). `resolveNarrative` picks the **first** matching variant and filters stakeholders using the state **before** the choice — the same state that decides conditional effects — so the text always agrees with the numbers and is deterministic. The resolved text is stored on the `ChoiceRecord`, shown in a "Report to the council" box labelled as invented fiction, and kept in saves implicitly (saves replay choices). The validator requires non-empty text, at least one unconditional `gains` and `loses` group, and valid conditions.

### Event stream for animation (`storyEvents.ts`)

`replayWithEvents(scenario, choiceIds)` returns the same final state as `replay` plus an ordered list of `StoryEvent`s: one `decision` event per choice (year, labels, outcome, resolved narrative, applied effects, flags, map cues) followed by every `consequence` event that resolved on arrival at the next node (triggered or lapsed, explanation, effects, map cues — empty when lapsed). Events have a 1-based `sequence`, non-decreasing years and `fiction: true`. **Map cues** (`emphasis` / `movement` / `pressure`, tone, label) refer only to `SCHEMATIC_REGIONS` (Italy, Sicily, Sardinia–Corsica, Africa, Gaul, Hispania, Illyricum, Constantinople) — named areas, never geometry — so the future map can animate them however Phase 3's data allows, without the content implying borders. No randomness and no clocks: the same choices always produce byte-identical events (tested for all 21 valid D1–D3 paths).

### Saves

`savegame.ts` writes `{ format, formatVersion, scenarioId, scenarioVersion, savedAt, choices }` to `localStorage` (`tat.save.<scenarioId>`) after each confirmed decision. Loading **replays the choices through the engine**, so a save cannot contain a state the rules can't produce; tampered resources or flags are ignored. Oversized, unparsable, foreign, malformed or rule-breaking saves are `corrupt`; a different format, campaign or scenario version is `incompatible`. Either way the player starts fresh, is told why, and the old save is kept until they discard it or confirm a new decision. Start over deletes the save. Bump `AlternateScenario.version` whenever authored choices change in a way that would change replays, and add a `changes` note for it (the validator requires a note for the current version). An older save is refused with an explanation built from those notes — e.g. "The saved game was made with an earlier version of this campaign (version 2; this is version 3). The decisions have changed since then, so your earlier choices cannot be replayed exactly. Version 3: …" — a newer or unlabelled save gets its own message. Current: scenario version 3, state schema version 3.

`validateScenario.ts` checks the graph: unique ids, links resolve, no cycles, no unreachable nodes, 2–4 choices per decision, known resources and flags, valid ranges, **every choice has a downside**, at least one ungated choice per decision (no softlocks), and historical-context links point at real event ids. It runs in the unit tests and at dev startup.

Data separation: `alternate.ts` refers to actual history only by event id (for "set against these sourced events" links). It never imports the actual-history dataset. Both datasets are deep-frozen.

UI: `useSimulation` wraps the engine with a pre-commit selection (change your mind until you confirm; after that, Start over). State lives in the workspace component, so it survives switching tabs, and is autosaved after each decision (above).

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
