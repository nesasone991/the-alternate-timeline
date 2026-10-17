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
| D24 | 2026-10-15 | Delayed effects as two authored mechanisms: conditional effects (at commit) and scheduled consequences (on arrival at a due year), each with an explanation | Brief: transparent, no arbitrary penalties; players understand why without seeing future numbers | — |
| D25 | 2026-10-15 | Scheduled consequences show hint + year in advance, never numbers; resolved ones show exact effects, or why they lapsed | Explains causes without spoiling outcomes | Playtesting |
| D26 | 2026-10-15 | Added a `below` requirement form | Needed for "only if legitimacy is low" style conditions; keeps one meaning per requirement | — |
| D27 | 2026-10-15 | Saves store only the choice list and rebuild by replay | Makes tampered saves harmless and guarantees restored states are rule-valid | Saves need data the engine cannot recompute |
| D28 | 2026-10-15 | A save that fails to load is kept until discarded or overwritten by a new decision | Blueprint §6.9: clear recovery option; nothing silently deleted | — |
| D29 | 2026-10-15 | Scenario version 2 and state schema 2 | D1 now leads to D2 and schedules consequences; v1 saves would replay differently | Next content change |
| D30 | 2026-10-15 | Playwright runs against `vite preview` (production build) in desktop and Pixel 7 projects, no retries | Real bundle and real router; flaky tests must fail visibly | — |
| D31 | 2026-10-15 | CI updates the lockfile itself when `package.json` gains a dependency | The development sandbox cannot run npm; CI commits the resolved lockfile and the next run proves `npm ci` | A contributor with npm access joins |
| D32 | 2026-10-15 | One D1–D2 combination is blocked by design (pay the armies → field army) | Makes the D1 trade-off bite in D2; nine combinations validated, eight reachable | Balance review |
| D33 | 2026-10-15 | Consequences due by a decision's year resolve on arrival, **before** that decision is shown; the UI states the order | The brief asks for an unambiguous sequence; deciding with the post-consequence numbers is how a council would actually experience it | — |
| D34 | 2026-10-15 | D3 placed at c. 468 (not c. 465 as planned in session 3) | The brief names c. 468 and the sourced Cape Bon expedition; with D33, all 468 consequences now resolve inside the Rome campaign before D3 | — |
| D35 | 2026-10-15 | Narrative text chosen from the state **before** the choice; first matching variant wins | Same state as conditional effects, so text and numbers always agree; deterministic | — |
| D36 | 2026-10-15 | Map cues name schematic regions only, never coordinates or borders | Blueprint §9.2: no implied precision before Phase 3 has sourced or schematic geometry | Phase 3 map data |
| D37 | 2026-10-15 | Scenario version 3; v2 saves refused with a reason built from `changes` notes | Same choice ids now replay to different numbers (D2 balance, 468 consequences); silent reinterpretation would mislead | Next content change |
| D38 | 2026-10-15 | D1/D2 rebalanced in v3: *field army* gains +3 Military if taxes were reformed; landowners resist reform only if Legitimacy < 28 | Without them, the tax-reform → field-army path had no reward and the landowners' penalty always fired, so the condition never mattered | Playtesting |
| D39 | 2026-10-15 | Expected results for all 27 D1–D3 combinations come from an independent reference model (a separate calculation, pasted as a table) | Tests should not just re-run the engine against itself | — |
| D40 | 2026-10-16 | D4 placed at c. 472, checkpoint at c. 474, D4 consequences due 475–476 | 472 consequences resolve before D4 (D33); D4's own consequences belong to the final crisis and resolve when D5 exists | D5 written |
| D41 | 2026-10-16 | Recovery through an always-open option with state-dependent help (landowner loans below Economy 15, recognition below Legitimacy 15), not through rescue mechanics | Brief: playable options for weak states, realistic cost, no automatic restoration. The help is bought with revenue, troops, tax collection and a 476 strain | Playtesting |
| D42 | 2026-10-16 | "Restore the emperor's authority" needs Legitimacy 15 and Economy 10 (draft was 20 and 15) | The draft left three states with a single option; with the lower thresholds every state reaching D4 has at least two | Balance review |
| D43 | 2026-10-16 | Report situation = first-match variant + every matching note | One report must reflect several earlier decisions and conditions at once; variants alone can only express one | — |
| D44 | 2026-10-16 | Scenario version 4; v3 saves refused with an explanation | In v3 a three-choice save ended at a checkpoint before any 472 consequence; replaying it now lands at D4 with different numbers | Next content change |
| D45 | 2026-10-16 | Real 472 events shown with the disputes stated (Olybrius' proclamation date, who killed Anthemius, Ricimer's death day) | Sources disagree; the UI must not imply a certainty they do not share | Historical review |
| D46 | 2026-10-16 | A decision's (and a consequence's) effects are settled together: net change per resource, clamped once | Order-independent and fair: a loan in the same decision as tax relief offsets it before the 0 floor is applied, instead of the cost vanishing at 0 and the gain landing in full | — |
| D47 | 2026-10-16 | Unpaid costs: half the shortfall (rounded up) falls on another resource and a flag is set; no chain | Brief: costs absorbed at 0 need a deterministic, visible, linked structural consequence. Halving keeps recovery possible; one step keeps it explainable | Playtesting |
| D48 | 2026-10-16 | 476 consequences resolve at the `settlement-476` node, then the ending is classified; 480 consequences stay pending | One documented point; endings see everything that happened by 476 and the threats still ahead | — |
| D49 | 2026-10-16 | Endings by ordered rules (first match wins, unconditional fallback) with a "looming threats" limit | Transparent and traceable: each condition is shown as met or not; uses resources, flags from all decisions, unpaid costs and pending harm | Balance review |
| D50 | 2026-10-16 | Ending categories as the brief names them (Imperial Survival, Fragmented Survival, Imperial Collapse) rather than the Blueprint's earlier names | The milestone brief specified them; one ending per category for now | Ending screen milestone |
| D51 | 2026-10-16 | Defending the office needs Military 40 and is ruled out when the commander rules; sharing power has no prerequisite | The draft also required Legitimacy 10 for sharing power, which left nine states with a single option; with it removed every state reaching D5 has at least two | — |
| D52 | 2026-10-16 | The workspace shows only the ending, its summary and why; the full report is data only | Brief: do not implement the ending screen yet | Ending screen milestone |
| D53 | 2026-10-16 | Scenario version 5, state schema 4; v4 saves refused | Settlement and unpaid-cost rules change earlier numbers (e.g. the empty-treasury bargain now gives Economy 4, not 10), and D4 now leads to D5 | Next content change |
| D54 | 2026-10-17 | The ending is its own route, reading the save; the workspace links to it | A full-page, shareable-later view without overloading the workspace; the save is the source of truth, and router state is only a fallback when storage is blocked | — |
| D55 | 2026-10-17 | Resource history copied from recorded `after` values (`resourceTimeline`), guarded against the replayed state | Brief: replay data is the source of truth; the UI must not recalculate | — |
| D56 | 2026-10-17 | Four small multiples, one series each, with one shared slider, rather than one chart with four lines | Lines converge around 30–60 and would need a legend and colour coding; small multiples need neither, and the slider gives keyboard access to every moment | User feedback |
| D57 | 2026-10-17 | Category identity through one SVG seal and a background wash; teal is not used for any ending | Teal means sourced history in this design system; endings are fiction | — |
| D58 | 2026-10-17 | "What really happened" lists actual-timeline events dated 474–480 by filter, not by a hand-picked list | Only sourced events appear, and adding a sourced event later includes it automatically | Comparison mode |
| D59 | 2026-10-17 | No simulation rule or classification changed in this milestone | No defect was found while building on the replay data | — |

