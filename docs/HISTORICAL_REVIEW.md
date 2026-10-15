# Historical review

Status: **draft, not independently reviewed.** Everything below must be checked by someone with subject knowledge before public release.

## What was verified in Phase 1 (15 Oct 2026)

Each event in `src/data/scenarios/rome/history.ts` was checked against the sources listed for it. Findings:

| Event | Date as shown | Check | Notes |
| --- | --- | --- | --- |
| Visigoths sack Rome | 24 Aug 410 | ✅ Britannica | Three days of looting; Jerome's and Augustine's responses per Britannica. |
| Vandals seize Carthage | 19 Oct 439 | ✅ Britannica | "North Africa a major source of revenue and grain" is standard scholarship but not stated in the source used — **corroborate** (e.g. Heather 2005). |
| Rome and the Vandals divide North Africa *(added session 4)* | 442 | ✅ Wikipedia (tertiary) | Replaces the 435 agreement; Vandals keep the provinces around Carthage, the West keeps Tripolitania, the Mauretanias and part of Numidia. Caveat states the treaty's Numidia terms are ambiguous. Replace tertiary source. |
| Catalaunian Plains | c. 451 (June) | ✅ Wikipedia summary of debate | Flagged **contested**: 20 June is Bury's reconstruction; significance disputed (Bury, Hughes, Kim). Replace tertiary source. |
| Valentinian III assassinated | 16 Mar 455 | ✅ Wikipedia | "Rapid imperial turnover after 455" is standard but not in source — **corroborate**. |
| Vandal sack of Rome | June 455 | ✅ Britannica + Wikipedia | Destructiveness debated; caveat included. |
| Vandals take the western islands and raid Italy *(added session 4)* | 461 (year) | ✅ Wikipedia (tertiary) | Seizure of Corsica, Sardinia and other islands after Majorian's fall; raids on Italy and Sicily in the following years. The exact year each island fell is not claimed. Replace tertiary source. |
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

## Decision 1 framing (added 15 Oct 2026)

The D1 context sentence in `alternate.ts` makes three factual statements, all already covered by the actual timeline: Valentinian III was murdered (16 Mar 455), the Vandals sacked Rome (June 455), North Africa had been in Vandal hands since 439 (with the same "major source of revenue and grain" claim that still needs corroboration). The "senatorial landowners resisting taxation" framing in the tax-reform choice is presented as fiction, but a reviewer should confirm it is not misleading as a general picture of the period.

## Decision 2 framing (added 15 Oct 2026)

The D2 context in `alternate.ts` states: the Vandal fleet that sacked Rome could raid Italian coasts (follows from the sourced 455 sack and 439 capture of Carthage); provinces beyond the Alps were under pressure (general, **needs a source**); many of the empire's soldiers came from allied peoples, illustrated by the Visigoths fighting alongside Aetius in 451 (the alliance is sourced via the 451 event; the general claim about soldier origins **needs a scholarly source**). The three options — concentrating forces in Italy, a mobile field army, settling allies as federates — are framed as fiction, but a reviewer should confirm each describes a strategy that was conceivable in the period and that the federate option is not presented in a loaded way.

## Decision 3 framing (added 15 Oct 2026, session 4)

The D3 context in `alternate.ts` states four facts, each linked to a sourced event: Africa had been divided by treaty since 442 (treaty-442); since 461 Vandal fleets held the western islands and raided Italy and Sicily (vandal-raids-461); Constantinople prepared a great expedition against Carthage in 468 (cape-bon-468); the West took part (cape-bon-468: Marcellinus' western contingent). Points for a reviewer:

1. "Constantinople … wants the West to take part" is a simplification of a joint eastern–western enterprise led from Constantinople. **Check** that it is not misleading.
2. The three options — joining the expedition, a separate treaty with Gaiseric, giving up Africa and fortifying Italy and Sicily — are fiction. **Confirm** each was conceivable: a separate western peace with the Vandals is plausible in kind (the East made its own peace with Gaiseric in 474, but that event is not yet in the timeline or cited, so the game does not mention it).
3. No fleet sizes, troop numbers or campaign costs appear anywhere; resource changes are gameplay abstractions.
4. The narrative reports name broad groups (taxpayers in Italy, coastal towns, merchants, the eastern court, those hoping to recover Africa, federate allies, veterans). They are labelled as invented and cite nothing. A reviewer should check none of them reads as a historical claim about a specific real group's attitude.
5. The "islands near Italy" variant (when Military ≥ 60) echoes but does not claim the real recovery of Sardinia in 468; it is fiction.

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
- [ ] Campaign decision text (Phase 2) reviewed to keep historical framing separate from fiction — D1, D2 and D3 framing notes above.
- [ ] 474 East–Vandal peace sourced before any decision text refers to it.
