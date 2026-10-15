import { deepFreeze } from '../../../lib/freeze';
import type { AlternateScenario } from '../../../types/simulation';

/**
 * FICTIONAL alternate-history campaign for the Fall of Rome.
 *
 * Everything in this file is authored game content. It is kept apart from the
 * actual-history dataset (./history.ts) and only refers to it by event id, so the
 * interface can link to the sourced events a decision is set against.
 *
 * Resource values are gameplay abstractions on a 0–100 scale. They are not
 * historical measurements and no number here is claimed to be one.
 *
 * Milestone status: decision 1 of 5 is written. Every choice leads to an
 * in-development checkpoint where decision 2 will go.
 *
 * Balance notes (D1):
 * - Starting values describe a weakened court after 455: little legitimacy after
 *   the dynasty ended, thin unity, a damaged treasury, an army that still exists.
 * - Each choice raises one or two measures and lowers others; none is free.
 * - Sums of deltas: tax reform +2, provincial revenue −1, pay the armies +6. The
 *   army option looks strongest now but drains the treasury that a North African
 *   campaign (D3) will need — the first planned delayed consequence.
 */
export const romeAlternateScenario: AlternateScenario = deepFreeze<AlternateScenario>({
  id: 'rome-alternate',
  version: 1,
  campaignId: 'fall-of-rome',
  title: 'The Fall of Rome: Can the West Survive?',
  disclaimer:
    'This is fictional alternate history. The situations are framed by real events, but the choices, their effects and every outcome are invented for play.',
  initialResources: {
    economy: 40,
    military: 45,
    unity: 35,
    legitimacy: 30,
  },
  startNodeId: 'd1-fiscal-survival',
  plannedDecisionCount: 5,
  flags: [
    {
      id: 'tax-reform',
      label: 'You reformed taxation',
      laterEffect: 'Planned: steadier revenue in later turns, but the great landowners remember who taxed them.',
    },
    {
      id: 'provincial-revenue',
      label: 'You let the provinces keep a share of revenue',
      laterEffect: 'Planned: regional elites become easier allies in decision 4, but the centre controls less money.',
    },
    {
      id: 'armies-paid-first',
      label: 'You paid the armies first',
      laterEffect: 'Planned: a stronger hand in decision 2, but less money for a North African campaign in decision 3.',
    },
  ],
  nodes: [
    {
      kind: 'decision',
      id: 'd1-fiscal-survival',
      year: 455,
      yearApproximate: true,
      title: 'Fiscal survival',
      context:
        'Valentinian III has been murdered and the Vandals have sacked Rome. North Africa, once a major source of revenue and grain, has been in Vandal hands since 439. The treasury cannot pay for everything at once. Your council must decide where the money comes from — and who it goes to first.',
      historicalContextIds: ['vandals-take-carthage-439', 'valentinian-assassinated-455', 'vandal-sack-455'],
      prompt: 'How should the court pay for its survival?',
      choices: [
        {
          id: 'reform-taxation',
          label: 'Reform taxation',
          rationale:
            'Close the exemptions enjoyed by the richest landowners and collect what is owed. Revenue rises, but the senatorial families who lose their privileges will resent the court.',
          warning: 'Needs enough authority to enforce. Powerful families may turn against the court later.',
          prerequisites: [{ resource: 'legitimacy', min: 20 }],
          effects: [
            { resource: 'economy', delta: 12 },
            { resource: 'legitimacy', delta: -6 },
            { resource: 'unity', delta: -4 },
          ],
          flagsSet: ['tax-reform'],
          nextEventId: 'checkpoint-d2',
        },
        {
          id: 'provincial-revenue',
          label: 'Let the provinces keep a share',
          rationale:
            'Allow regional governors and local elites to keep part of the taxes they raise, in exchange for loyalty. The provinces draw closer, but less money reaches the court.',
          warning: 'Hard to reverse. Once provinces keep their own revenue, taking it back will be costly.',
          effects: [
            { resource: 'unity', delta: 10 },
            { resource: 'economy', delta: -8 },
            { resource: 'legitimacy', delta: -3 },
          ],
          flagsSet: ['provincial-revenue'],
          nextEventId: 'checkpoint-d2',
        },
        {
          id: 'pay-the-armies',
          label: 'Pay the armies first',
          rationale:
            'Put every available coin into soldiers’ pay and supplies. The army is steadier and the court is seen to act after the sack — but the treasury empties fast.',
          warning: 'Leaves little money for any later campaign against the Vandals.',
          prerequisites: [{ resource: 'economy', min: 30 }],
          effects: [
            { resource: 'military', delta: 14 },
            { resource: 'legitimacy', delta: 4 },
            { resource: 'economy', delta: -12 },
          ],
          flagsSet: ['armies-paid-first'],
          nextEventId: 'checkpoint-d2',
        },
      ],
    },
    {
      kind: 'terminal',
      id: 'checkpoint-d2',
      year: 458,
      yearApproximate: true,
      status: 'in-development',
      title: 'Next: border defence, c. 458–460',
      summary:
        'Decision 2 has not been written yet. Your choice and its effects are recorded above; this branch continues in the next development milestone.',
    },
  ],
});
