# Private beta questionnaire

About two minutes: six required questions, one optional comment. Put it in any free form tool the owner already uses, set its link as `VITE_FEEDBACK_URL` in the Cloudflare Pages project, and redeploy. The link then appears in the "Private beta" bar on every page and at the end of the ending page.

Form settings: do not collect email addresses or sign-ins, allow one response per person only if the tool can do it without a login, and say in the form's description that no personal details are needed. The site's privacy page already says the questionnaire opens an external site under that site's own policy; name the tool there if testers ask.

---

**The Alternate Timeline: private beta feedback**

Thank you for playing. Six quick questions, about two minutes. Please don't include personal details in your answers.

**1. Clarity of decisions.** How easy was it to understand what each choice would do before you confirmed it?
1 Very hard · 2 · 3 · 4 · 5 Very easy

**2. Enjoyment.** How much did you enjoy playing the Fall of Rome campaign?
1 Not at all · 2 · 3 · 4 · 5 Very much

**3. Historical credibility.** How believable did it feel as history? (The real events are sourced; the alternate outcomes are fiction.)
1 Not believable · 2 · 3 · 4 · 5 Very believable · I can't judge
*Follow-up, optional:* Was it always clear which parts were real history and which were fiction? Yes, always · Mostly · Not really

**4. Replay interest.** Would you play again to try for a different ending?
I already did · Yes · Maybe · No

**5. Mobile usability.** What did you mainly play on?
Phone · Tablet · Computer
*If phone or tablet:* How easy was it to use on that screen? 1 Very hard · 2 · 3 · 4 · 5 Very easy

**6. More campaigns.** How interested would you be in another campaign?
1 Not interested · 2 · 3 · 4 · 5 Very interested
*Optional:* Which would you most like? Napoleon's Hundred Days (1815) · The Viking Age (865) · Something else: ____

**7. Anything else? (optional)** What confused you, what did you enjoy, or what went wrong? If something broke, which page were you on and which build number is in the footer?

---

## How the answers map to the beta's questions

| Question | What it tells us | Read alongside |
| --- | --- | --- |
| 1 | Whether choices, effects and prerequisites are explained well enough | `decision-1-complete` and `decision-3-complete` drop-off |
| 2 | Overall appeal | Completion rate (`campaign-complete` ÷ `campaign-start`) |
| 3 | Whether sourcing and fiction labels earn trust, and whether the two are kept distinct | Comments; `docs/HISTORICAL_REVIEW.md` open items |
| 4 | Replay value | `replay-start` and `new-timeline-*` counts; ending distribution |
| 5 | Mobile usability on real devices, which automated tests cannot judge | Comments naming a device or page |
| 6 | Demand for the next campaign | — |

Analytics and questionnaire answers are not linked: the site sends no identifier, so a response cannot be matched to a campaign.
