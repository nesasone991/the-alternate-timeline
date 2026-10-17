# MVP scope

Labels: **Must** (MVP blocker), **Should** (MVP if time allows), **Later** (after launch). Status: ✅ done, 🟡 partial, ⬜ not started.

| # | Item (Blueprint §2.1) | Label | Phase | Status |
| --- | --- | --- | --- | --- |
| 1 | Responsive landing, accessible navigation, campaign catalog with one playable and labelled coming-soon campaigns | Must | 1 | ✅ |
| 2 | Real History timeline with sourced, dated events | Must | 1 | 🟡 Nineteen sourced events (410–480); text awaits independent review; tertiary sources to be corroborated |
| 3 | Historical map: zoom/pan, legend, tooltips, time control, ≥3 validated snapshots | Must | 3 | ⬜ Placeholder only; time control exists |
| 4 | Branching Rome campaign: 5 decisions, ≥3 endings | Must | 2 | 🟡 All five decisions playable, with delayed consequences, structural consequences for unpaid costs, reports to the council, three endings classified by rules, and a full ending experience for each |
| 5 | Deterministic rules engine, seeded, visible consequences | Must | 2 | 🟡 Engine, validator and path matrix done and tested; no randomness used |
| 6 | Historical vs alternate comparison at the same date | Must | 4 | ⬜ Mode tab present and labelled "not built" |
| 7 | Local save/load, reset, shareable outcome card | Must | 2 (save) / 4 (card) | 🟡 Versioned autosave, restore, reset (with confirmation from the ending) and damaged-save recovery done; read-only replay of a finished campaign; share card not started |
| 8 | Creator Mode: clean playback, 9:16/16:9 guides, speed, seek, bookmarks | Must | 5 | ⬜ Frame and speed types exist; playback reducer reusable |
| 9 | Mobile-responsive, keyboard-accessible core flow; low-power fallback | Must | 1 → ongoing | 🟡 Done for Phase 1 screens |
| 10 | Tests, build checks, attribution, error states, privacy note, deployment guide | Must | 1 → ongoing | 🟡 Present for everything built; deployment check and Pages emulator tests in CI; privacy page and Cloudflare Pages guide written for the beta; real-host checks pending deployment |
| — | Settings: motion, ambient animation, sound preference, text size, year notation | Must (Phase 1 brief) | 1 | ✅ |
| — | Optional D6 recovery decision | Should | 2 | ⬜ |
| — | Export/import save file | Should | 2 | ⬜ (save format is ready for it) |
| — | Swipe overlay in comparison | Should | 4 | ⬜ |
| — | Self-hosted OFL display font | Should | polish | ⬜ |
| — | Playwright E2E suite in repo | Should | 2 | ✅ 38 specs × desktop + mobile (including each ending, replay, restart, widths, keyboard, reduced motion, direct visits and reloads of every route), in CI against the production build, plus the deployment spec against Cloudflare's Pages emulator |
| — | CI on every push (GitHub Actions) | Should | 2 | ✅ |
| — | Napoleon 1815, Viking Age 865 campaigns | Later | — | Concept cards only |
| — | Private beta release: labelled beta build, `noindex`, Cloudflare Pages guide, questionnaire | Should (owner request, session 8) | beta | ✅ Prepared, not deployed |
| — | Privacy-conscious usage counts (ten anonymous events, opt-out, off unless configured) | Should (owner request, session 8; Blueprint §1.4) | beta | ✅ Built and tested; not yet connected to a GoatCounter site |
| — | Accounts, cloud saves, payments, ads, AI-generated content, MP4 export, 3D globe | Later / not MVP | — | Excluded by Blueprint §2.2 |

Nothing in the Blueprint has been removed; items not built are listed above.
