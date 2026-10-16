# Data provenance

## Historical sources (Fall of Rome)

Registry in code: `src/data/scenarios/rome/sources.ts`. All accessed 15 Oct 2026.

| Id | Source | Kind | Used for |
| --- | --- | --- | --- |
| britannica-sack-410 | Encyclopaedia Britannica, "Sack of Rome" (410) — https://www.britannica.com/event/Sack-of-Rome-410 | Reference | 410 |
| britannica-gaiseric | Encyclopaedia Britannica, "Gaiseric" — https://www.britannica.com/biography/Gaiseric | Reference | 439, 455, 468 |
| britannica-odoacer | Encyclopaedia Britannica, "Odoacer" — https://www.britannica.com/biography/Odoacer | Reference | 476 |
| wiki-catalaunian-plains | Wikipedia, "Battle of the Catalaunian Plains" — https://en.wikipedia.org/wiki/Battle_of_the_Catalaunian_Plains | Tertiary | 451 dating and debate |
| wiki-sack-455 | Wikipedia, "Sack of Rome (455)" — https://en.wikipedia.org/wiki/Sack_of_Rome_(455) | Tertiary | 455 dates |
| wiki-vandal-war-439-442 | Wikipedia, "Vandal War (439–442)" — https://en.wikipedia.org/wiki/Vandal_War_(439%E2%80%93442) (CC BY-SA; summary in original words) | Tertiary | 442 treaty and the ambiguity of its Numidia terms |
| wiki-vandal-war-461-468 | Wikipedia, "Vandal War (461–468)" — https://en.wikipedia.org/wiki/Vandal_War_(461%E2%80%93468) (CC BY-SA; summary in original words) | Tertiary | 461 seizure of the islands and raids; Marcellinus retaking Sardinia in 468 |
| wiki-cape-bon-468 | Wikipedia, "Battle of Cape Bon (468)" — https://en.wikipedia.org/wiki/Battle_of_Cape_Bon_(468) | Tertiary | 468 and the uncertainty of figures |
| wiki-romulus-augustulus | Wikipedia, "Romulus Augustulus" — https://en.wikipedia.org/wiki/Romulus_Augustulus | Tertiary | 475, 476, 480 |
| britannica-ricimer | Encyclopaedia Britannica, "Ricimer" — https://www.britannica.com/biography/Ricimer (accessed 16 Oct 2026) | Reference | 467 and 472: Ricimer's role, siege of Rome, Anthemius' death, Ricimer's death |
| britannica-euric | Encyclopaedia Britannica, "Euric" — https://www.britannica.com/biography/Euric (accessed 16 Oct 2026) | Reference | Euric as a federate until 475 who extended his lands in Gaul and Hispania |
| wiki-anthemius | Wikipedia, "Anthemius" — https://en.wikipedia.org/wiki/Anthemius (CC BY-SA; accessed 16 Oct 2026) | Tertiary | 467 appointment, Gallic defeat and Anthemiolus, 472 war, place and executioner disputes |
| wiki-ricimer | Wikipedia, "Ricimer" — https://en.wikipedia.org/wiki/Ricimer (CC BY-SA; accessed 16 Oct 2026) | Tertiary | 472 siege, Ricimer's death date (18 vs 19 August), Gundobad's succession, interpretations |
| wiki-olybrius | Wikipedia, "Olybrius" — https://en.wikipedia.org/wiki/Olybrius (CC BY-SA; accessed 16 Oct 2026) | Tertiary | Rival accounts of Olybrius' proclamation, non-recognition by Leo I, death date |
| wiki-euric | Wikipedia, "Euric" — https://en.wikipedia.org/wiki/Euric (CC BY-SA; accessed 16 Oct 2026) | Tertiary | Euric's campaigns c. 469–475, the defeat of an imperial army in southern Gaul, conquests in Hispania |
| whe-byzantine-empire | M. Cartwright, "Byzantine Empire", World History Encyclopedia — https://www.worldhistory.org/Byzantine_Empire/ | Reference | Eastern continuity to 1453 |

Rules: summaries are original wording; no source text is copied. Tertiary sources are marked in the UI ("Tertiary, needs corroboration") and must be replaced before release (see HISTORICAL_REVIEW.md).

## Alternate-history content (fiction)

`src/data/scenarios/rome/alternate.ts` is authored game content, not historical data. Its decision context sentences restate facts already sourced in the actual timeline (Valentinian III's murder, the 455 sack, the loss of Carthage in 439) and link to those events by id. Choices, resource values, effects and flags are invented and labelled as fiction in every place they appear. Decision 3's context restates the sourced 442 treaty, the 461 raids and the 468 expedition and links to them. Decision 4's context restates the sourced 467–472 events (Anthemius sent by Constantinople, Ricimer's marriage alliance and war, the defeat in Gaul, Euric's expansion) and links to them. Narrative reports (political situation, who gains, who loses, consequences, risks) and map cues are fiction: they are labelled "invented for this alternate timeline, not sourced history", cite nothing, and map cues name broad schematic regions only.

## Map data

None yet. Every map dataset added in Phase 3 must record here: source, author, licence, attribution text, date accessed, geographic coverage, known inaccuracies, and whether it is sourced geometry or an illustrative schematic. Modern borders must never stand in for ancient ones.

## Coming-soon campaigns

Napoleon 1815 and the Viking Age 865 carry one-line concept descriptions only. No research has been done; the UI says so.

## Assets

See THIRD_PARTY_NOTICES.md. No images, fonts, audio or map tiles are bundled.
