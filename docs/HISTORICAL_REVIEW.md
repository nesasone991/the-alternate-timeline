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

## Decision 4 framing and the 467–472 events (added 16 Oct 2026, session 5)

New events, each checked against its listed sources on 16 Oct 2026:

| Event | Date as shown | Check | Notes and disputes |
| --- | --- | --- | --- |
| Constantinople sends Anthemius to rule the West | 467 (year) | ✅ Britannica + Wikipedia | Proclamation given as 12 April (Wikipedia, "Anthemius") or 14 April (Wikipedia, "Ricimer"); shown at year precision with the disagreement in the caveat. Ricimer's marriage to Alypia in both. |
| The Visigoths destroy an imperial army in southern Gaul | c. 471 (approximate) | ⚠️ Wikipedia ×2, Britannica | The "Anthemius" article names Anthemiolus and three commanders; the "Euric" article does not mention Anthemiolus and gives no date in its text (471 and Arles appear only in a link title). Britannica covers Euric's expansion only in general. Marked **approximate** with caveat. **Needs a scholarly source** (e.g. Wolfram 1988, Mathisen). |
| Ricimer overthrows Anthemius | 11 July 472 | ⚠️ **Contested details** | Britannica and both Wikipedia articles give 11 July for Anthemius' death. Disputed: when Olybrius was proclaimed (April/May vs July 472), why (Malalas' intercepted-letter story vs Vandal pressure; O'Flynn doubts Malalas), who killed Anthemius (Ricimer or Gundobad) and where (St Peter's or Santa Maria in Trastevere). Marked **contested**, disputes in the caveat. |
| Ricimer and Olybrius die; Gundobad takes command | 472 (year) | ✅ Britannica + Wikipedia | Ricimer: 18 August (Britannica; Fasti vindobonenses) or 19 August (Wikipedia; Cassiodorus, Paschale campanum). Olybrius: 23 October or 2 November. Shown at year precision; both disputes in the caveat. |

Not used, because the sources consulted present them as suspicion or interpretation: that Ricimer deliberately kept the western fleet from the 468 expedition; that Ricimer poisoned Libius Severus; that Ricimer was "heir of Stilicho" (Heather's framing). Interpretations of Ricimer (puppet-master vs necessary barbarian-born commander: Williams & Friell, O'Flynn, Heather, Bury) are **not** taken as fact anywhere in the app.

**D4 context** (`alternate.ts`) restates only the facts above and links to the four events. The phrase "Euric's Visigoths, still formally Rome's allies, were taking land in Gaul and Hispania" relies on Britannica ("ruled as a federate … until 475", "extending his boundaries in Gaul and on the Iberian Peninsula") and Wikipedia ("Euric").

**D4 options are fiction.** They echo real tendencies of the period — an emperor trying to rule independently (Anthemius), a commander ruling through figurehead emperors (Ricimer), and accommodation with regional and federate powers (Euric's federate status) — but the game does not claim any of them would have worked. Points for a reviewer:

1. "Rule through the army's commander" deliberately resembles Ricimer's position; check it does not present that arrangement as the only historical model or caricature it.
2. "Strike a bargain with the regional powers" bundles landowners, provincial leaders and federate kings; check that grouping is not misleading.
3. The report text names broad groups (officials loyal to the court, army commanders, provincial leaders, the Senate and civil officials, federate kings, landowners who lent the court money). All are labelled fiction and cite nothing.
4. Constantinople's attitude in the reports (backing the emperor after a joint expedition, cool after a separate peace) is invented game logic, not a claim about Leo I.

## Decision 5, the final crisis, and 474–480 (added 16 Oct 2026, session 6)

New and revised events, each checked against its listed sources on 16 Oct 2026:

| Event | Date as shown | Check | Notes and disputes |
| --- | --- | --- | --- |
| Julius Nepos, sent from Constantinople, replaces Glycerius | June 474 (month) | ✅ Britannica + Wikipedia | Gundobad raised Glycerius in 473 without eastern approval; Nepos landed in 474 and Glycerius became a bishop. Proclamation 19 or 24 June; landing at Portus or (Jordanes) Ravenna — both in the caveat. Britannica says "sent by Leo I"; Wikipedia says Leo appointed him and he sailed with Zeno's backing after Leo's death. |
| Nepos gives up the Auvergne to make peace with Euric | 475 (year) | ⚠️ **Contested** | Wikipedia ("Julius Nepos") stresses the Auvergne; Wikipedia ("Euric") frames the deal around Provence and the Barcelona region and calls it recognition of full independence; Britannica ("Euric") says he was a federate "until 475, when he was recognized as an independent king". Marked contested; terms in the caveat. |
| Orestes ousts Nepos and crowns his son (revised) | 475 (year) | ✅ Britannica ×2 + Wikipedia ×2 | Orestes was Nepos' appointee over the army; Nepos fled in August; Romulus proclaimed 31 October; not recognised by Constantinople (Britannica: "a usurper and puppet not recognized as a legitimate ruler by the Eastern emperor"). |
| Odoacer deposes Romulus Augustulus (revised) | 476 (year) | ✅ | Added the soldiers' demand for land (Wikipedia "Odoacer" mentions land and settlement; **the often-quoted "one third" is not in the source used**, so the app does not say it) and Romulus' pension in Campania (Anonymus Valesianus via Wikipedia; Britannica agrees he was pensioned). Britannica gives 28 August 476 for Orestes' execution; Wikipedia gives 23 August for Odoacer's proclamation and 4 September for the deposition. Existing caveat on dates retained. |
| The Senate sends the Western regalia to Constantinople | c. 476 (approximate) | ⚠️ **Contested** | Known mainly from Malchus. Date (476 or 477) and Zeno's terms differ between the two Wikipedia articles (patrician rank granted directly vs "should come from Nepos"); both in the caveat. |
| Roman institutions continue in Italy under Odoacer | c. 477 (approximate, spans 476–493) | ✅ Wikipedia + WHE | Senate cooperation, consuls named, senators in high office (Bury, via Wikipedia). Caveat: Bury saw 476 as one stage of dismemberment, not an end. |
| Julius Nepos is killed in Dalmatia (revised) | 480 (year) | ✅ Britannica + Wikipedia | Britannica: 9 May 480, "murdered by friends of Glycerius". Wikipedia: 25 April, 9 May or 22 June (9 May usually favoured); Glycerius' involvement disputed. Caveat added. Britannica calls Nepos "the last legitimate Western Roman emperor"; the app keeps the existing wording that some historians count him, not Romulus, as the last. |

**D5 context** restates only the facts above and links to four events (474, 475 ×2, 476).

**D5 options and all three endings are fiction.** They echo real possibilities of 475–476 — an emperor trying to hold the office by force (Orestes and Romulus did not; the game lets the council try), meeting the soldiers' demand for land (which Orestes refused and Odoacer granted), and letting the Western office lapse in favour of a ruler acknowledging Constantinople (close to what happened under Odoacer) — but the game claims none of the outcomes. Points for a reviewer:

1. "Hand government to successor rulers under Constantinople" is closest to the historical outcome. Its effects (treasury relief, Roman administration continuing) are game logic, informed by but not citing the Odoacer and institutions events; check it does not read as a claim about what Odoacer's rule was like.
2. The ending names "Imperial Survival / Fragmented Survival / Imperial Collapse" describe fictional outcomes. The real history (no Western emperor in Italy after 476, Roman institutions continuing under Odoacer, the Eastern Empire continuing) is closest in spirit to *Fragmented Survival* via successors; the game does not say so as a verdict, to avoid presenting a historiographical position as fact. The future comparison mode should show the sourced baseline side by side.
3. The ending report's sections on the army, economy, regions and Constantinople are authored fiction chosen by rules; none cites a source.
4. The unpaid-cost rules ("the court seized goods and labour from the provinces", "towns and landowners had to raise their own defence") are plausible in kind for the period but are not presented as documented events.

## Ending experience: "What really happened" (added 17 Oct 2026, session 7)

The comparison section shows only events from the actual-history dataset dated 474–480 (currently seven), each with its sources, certainty badge and caveat exactly as in Real History, plus the existing Eastern-continuity note. It adds no historical claim of its own. The fictional side shows the ending title, the report's settlement line and its Constantinople line, labelled as invented. Reviewer point: confirm the visual distinction (dashed burgundy "Fictional alternate history" panel vs solid teal "Sourced history" panel) is unmistakable on all screens.

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
- [ ] The 471 defeat in Gaul confirmed (date, place, Anthemiolus) from a scholarly source.
- [ ] D4 framing reviewed (points 1–4 above).
- [ ] D5 framing and ending text reviewed (points 1–4 in the Decision 5 section).
- [ ] The terms of the 475 peace with Euric confirmed from a scholarly source (e.g. Wolfram 1988, Mathisen 1998).
- [ ] The Senate's embassy to Zeno (date and terms) confirmed from a scholarly source or a translation of Malchus.
