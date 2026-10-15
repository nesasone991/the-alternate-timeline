# Historical review

Status: **draft, not independently reviewed.** Everything below must be checked by someone with subject knowledge before public release.

## What was verified in Phase 1 (15 Oct 2026)

Each event in `src/data/scenarios/rome/history.ts` was checked against the sources listed for it. Findings:

| Event | Date as shown | Check | Notes |
| --- | --- | --- | --- |
| Visigoths sack Rome | 24 Aug 410 | ✅ Britannica | Three days of looting; Jerome's and Augustine's responses per Britannica. |
| Vandals seize Carthage | 19 Oct 439 | ✅ Britannica | "North Africa a major source of revenue and grain" is standard scholarship but not stated in the source used — **corroborate** (e.g. Heather 2005). |
| Catalaunian Plains | c. 451 (June) | ✅ Wikipedia summary of debate | Flagged **contested**: 20 June is Bury's reconstruction; significance disputed (Bury, Hughes, Kim). Replace tertiary source. |
| Valentinian III assassinated | 16 Mar 455 | ✅ Wikipedia | "Rapid imperial turnover after 455" is standard but not in source — **corroborate**. |
| Vandal sack of Rome | June 455 | ✅ Britannica + Wikipedia | Destructiveness debated; caveat included. |
| Cape Bon expedition fails | 468 | ✅ Britannica + Wikipedia | Figures for fleet, army and cost deliberately omitted — sources disagree and some are emended. |
| Orestes ousts Nepos; Romulus proclaimed | 475 (31 Oct) | ✅ Wikipedia | Replace tertiary source. |
| Odoacer deposes Romulus | 476 | ⚠️ **Sources disagree on day**: Britannica implies late August; Wikipedia gives 4 September. Shown at year precision with the disagreement stated in the caveat. |
| Nepos killed | 480 | ✅ Wikipedia | Replace tertiary source. |
| Eastern Empire continues to 1453 | — | ✅ World History Encyclopedia | |

## Claims in overview copy needing corroboration

In `src/data/scenarios/rome/overview.ts`:

1. Visigoths, Vandals, Burgundians, Franks and others settled inside the frontiers, as allies or conquerors.
2. Short-lived emperors after 455 were often at the mercy of their generals.
3. Roman institutions, law and identity continued in Italy after 476.

All are mainstream positions; each still needs a cited scholarly source.

## Recommended scholarly references to consult (not yet cited)

These are standard works. They have **not** been read for this project yet and are therefore not cited in the app.

- Peter Heather, *The Fall of the Roman Empire: A New History* (2005).
- Bryan Ward-Perkins, *The Fall of Rome and the End of Civilization* (2005).
- Guy Halsall, *Barbarian Migrations and the Roman West, 376–568* (2007).
- J. B. Bury, *History of the Later Roman Empire*, vol. 1 (1923) — older, public domain in many jurisdictions.
- Primary sources in translation: Priscus, Procopius (*Vandalic War*), Jordanes (*Getica*, read critically), Hydatius.

## Release checklist (historical content)

- [ ] Every tertiary source replaced or corroborated by a scholarly or reference source.
- [ ] Overview claims 1–3 above cited.
- [ ] 476 date wording confirmed by a reviewer.
- [ ] Reviewer named and date recorded here.
- [ ] Campaign decision text (Phase 2) reviewed to keep historical framing separate from fiction.
