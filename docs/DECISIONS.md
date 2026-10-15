# Decisions log

| # | Date | Decision | Why | Revisit when |
| --- | --- | --- | --- | --- |
| D1 | 2026-10-15 | React + Vite + TypeScript + React Router + Tailwind 4, static SPA | Brief's preferred stack; free static hosting; no backend needed | — |
| D2 | 2026-10-15 | No Zustand | Only settings are shared; `useSyncExternalStore` store is enough | Simulation state must survive route changes |
| D3 | 2026-10-15 | In-repo icons instead of `lucide-react` | 14 icons; one fewer dependency | Icon set grows past ~30 |
| D4 | 2026-10-15 | Device fonts, no web fonts | No third-party requests (privacy), no licence tracking, no download cost | Brand polish phase: self-host an OFL serif |
| D5 | 2026-10-15 | Campaign content as typed TS modules, not JSON yet | Compile-time checking; validators cover the rest | Phase 2 scenario files → JSON + Zod at load |
| D6 | 2026-10-15 | Real-history dataset deep-frozen | Blueprint §7: choices must never mutate actual history | — |
| D7 | 2026-10-15 | Workspace route lazy-loaded | Map and engine code will be heavy; keep landing fast | — |
| D8 | 2026-10-15 | Timeline cursor moves by year; focused event = latest at or before cursor; prev/next step by event | Supports both scrubbing and event stepping; ready for map snapshots by year | Phase 3 |
| D9 | 2026-10-15 | Event jump buttons are a row of year chips; tick marks are visual only | Adjacent years (475/476) are ~10 px apart, too close for separate touch targets | — |
| D10 | 2026-10-15 | Unbuilt modes are selectable tabs that explain their status; their controls are disabled with a reason | Brief: represent modes in the architecture and make limitations explicit | Each mode ships |
| D11 | 2026-10-15 | Odoacer's deposition shown at year precision | Sources consulted disagree on the day (late August vs 4 September) | Historical review |
| D12 | 2026-10-15 | Channel links left empty in `src/config/brand.ts`; footer hides empty links | Real URLs not supplied; never guess | Owner provides URLs |
| D13 | 2026-10-15 | Year notation preference (AD/CE) | Brief uses "476 AD", Blueprint uses CE; let the reader choose, default AD | — |
| D14 | 2026-10-15 | Desktop nav from 1024 px; menu button below | At 768 px the four links plus brand wrapped onto two lines | — |
| D15 | 2026-10-15 | Engine as pure functions over authored data; no state library | Deterministic, trivially testable, replayable; the UI only needs `useReducer` | Game state must cross routes |
| D16 | 2026-10-15 | No randomness in the campaign; `seed` kept in state but unused | Brief: no artificial randomness. Blueprint allows seeded random events only if logged | A random event is proposed and approved |
| D17 | 2026-10-15 | `applyChoice` returns a result object instead of throwing | The UI must explain rejected choices; tests assert specific error kinds | — |
| D18 | 2026-10-15 | Requirements are a discriminated union (resource minimum, flag, not-flag) | Each requirement means exactly one thing; impossible combinations are type errors | — |
| D19 | 2026-10-15 | Validator rejects any choice without a negative effect, and any decision whose choices are all gated | Blueprint §6.3–6.4: no free lunch, no softlocks | — |
| D20 | 2026-10-15 | Each path ends at an `in-development` checkpoint until D2 exists | The graph must always resolve; the UI says plainly where the authored campaign stops | D2 written |
| D21 | 2026-10-15 | Pre-commit selection with explicit Confirm; Start over is the only undo after that | Blueprint §3.5 | Checkpoints (stretch) |
| D22 | 2026-10-15 | In Alternate mode, the sourced panel shows "what really happened by" the alternate year | Keeps evidence visible beside fiction without building Comparison early | Phase 4 comparison |
| D23 | 2026-10-15 | Verification moved to GitHub Actions CI | The dev sandbox cannot reach npm; CI gives a genuine `npm install`/typecheck/lint/test/build | — |
