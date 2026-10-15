import { deepFreeze } from '../../../lib/freeze';
import type { AlternateScenario } from '../../../types/simulation';

/**
 * FICTIONAL alternate-history campaign for the Fall of Rome.
 *
 * Everything in this file is authored game content. It is kept apart from the
 * actual-history dataset (./history.ts) and refers to it only by event id, so the
 * interface can link to the sourced events a decision is set against.
 *
 * Resource values are gameplay abstractions on a 0–100 scale. They are not
 * historical measurements and no number here is claimed to be one.
 *
 * Milestone status: decisions 1 and 2 of 5 are written. Every path ends at an
 * in-development checkpoint where decision 3 will go.
 *
 * How consequences carry forward (each with an authored reason, never a bare penalty):
 * - Flags record what was decided; later choices read them as prerequisites or
 *   as conditional effects ("Because you …").
 * - Scheduled consequences fall due in a later year (459, 468, 476). The player
 *   sees the hint and the year in advance, not the numbers. Some only take effect
 *   if a condition holds when they come due; otherwise they lapse, with a reason.
 *
 * D1 → D2 links:
 * - Paying the armies first empties the treasury below the 30 needed to fund a
 *   field army (and the armies expect pay again in 459), but makes concentrating
 *   troops in Italy more effective.
 * - Letting the provinces keep revenue makes federate settlements easier to
 *   integrate, and protects provincial loyalty if Italy is garrisoned.
 * - Tax reform yields extra revenue by 459, enough to afford any D2 option.
 */
export const romeAlternateScenario: AlternateScenario = deepFreeze<AlternateScenario>({
  id: 'rome-alternate',
  version: 2,
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
      laterEffect: 'Steadier revenue in the following years, but the great landowners remember who taxed them.',
    },
    {
      id: 'provincial-revenue',
      label: 'You let the provinces keep a share of revenue',
      laterEffect: 'Provincial elites have a stake in the empire, but less money reaches the court each year.',
    },
    {
      id: 'armies-paid-first',
      label: 'You paid the armies first',
      laterEffect: 'A paid, ready army — but a thin treasury for anything that needs money up front.',
    },
    {
      id: 'italy-garrisoned',
      label: 'You concentrated the armies in Italy',
      laterEffect: 'Italy is defended; the provinces beyond the Alps are largely on their own.',
    },
    {
      id: 'field-army',
      label: 'You funded a mobile field army',
      laterEffect: 'A strong army that can move where it is needed, at a cost every year.',
    },
    {
      id: 'federates-settled',
      label: 'You settled allies as federates',
      laterEffect: 'Cheap soldiers now; federate leaders with land and power of their own later.',
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
          outcome:
            'Closing exemptions raised revenue quickly. The cost was political: the families who lost their privileges blamed the court, and its standing fell.',
          warning: 'Needs enough authority to enforce. Powerful families may turn against the court later.',
          prerequisites: [{ resource: 'legitimacy', min: 20 }],
          effects: [
            { resource: 'economy', delta: 12 },
            { resource: 'legitimacy', delta: -6 },
            { resource: 'unity', delta: -4 },
          ],
          consequences: [
            {
              id: 'tax-reform-revenue',
              dueYear: 459,
              hint: 'Reformed collection should bring in steadier revenue over the next few years.',
              explanation: 'Reformed collection brought in steadier revenue than before.',
              effects: [{ resource: 'economy', delta: 4 }],
            },
            {
              id: 'tax-reform-landowners',
              dueYear: 468,
              hint: 'If the court’s authority weakens, landowners who lost their exemptions may back its rivals.',
              condition: { resource: 'legitimacy', below: 30 },
              explanation: 'With the court’s authority weak, landowners who lost their exemptions backed its rivals.',
              lapsedExplanation:
                'The court stayed strong enough that the landowners’ resentment never turned into open opposition.',
              effects: [{ resource: 'legitimacy', delta: -5 }],
            },
          ],
          flagsSet: ['tax-reform'],
          nextEventId: 'd2-border-defence',
        },
        {
          id: 'provincial-revenue',
          label: 'Let the provinces keep a share',
          rationale:
            'Allow regional governors and local elites to keep part of the taxes they raise, in exchange for loyalty. The provinces draw closer, but less money reaches the court.',
          outcome:
            'Provincial elites welcomed keeping part of their taxes and drew closer to the court. But every share kept locally was money the court could no longer spend.',
          warning: 'Hard to reverse. Once provinces keep their own revenue, taking it back will be costly.',
          effects: [
            { resource: 'unity', delta: 10 },
            { resource: 'economy', delta: -8 },
            { resource: 'legitimacy', delta: -3 },
          ],
          consequences: [
            {
              id: 'provincial-revenue-shortfall',
              dueYear: 468,
              hint: 'Provinces that keep their own revenue will send less to the court each year.',
              explanation: 'Years of reduced payments from the provinces left the treasury thinner.',
              effects: [{ resource: 'economy', delta: -4 }],
            },
          ],
          flagsSet: ['provincial-revenue'],
          nextEventId: 'd2-border-defence',
        },
        {
          id: 'pay-the-armies',
          label: 'Pay the armies first',
          rationale:
            'Put every available coin into soldiers’ pay and supplies. The army is steadier and the court is seen to act after the sack — but the treasury empties fast.',
          outcome:
            'Paying the soldiers first steadied the army and showed the court acting after the sack. The treasury, already strained, emptied fast.',
          warning: 'Leaves little money for anything that needs funding up front.',
          prerequisites: [{ resource: 'economy', min: 30 }],
          effects: [
            { resource: 'military', delta: 14 },
            { resource: 'legitimacy', delta: 4 },
            { resource: 'economy', delta: -12 },
          ],
          consequences: [
            {
              id: 'armies-expect-pay',
              dueYear: 459,
              hint: 'Soldiers who have been paid once will expect to be paid again.',
              explanation: 'The armies’ pay had to be found again, at further cost to the treasury.',
              effects: [{ resource: 'economy', delta: -3 }],
            },
          ],
          flagsSet: ['armies-paid-first'],
          nextEventId: 'd2-border-defence',
        },
      ],
    },
    {
      kind: 'decision',
      id: 'd2-border-defence',
      year: 459,
      yearApproximate: true,
      title: 'Border defence',
      context:
        'The Vandal fleet that sacked Rome can strike any coast of Italy, and the provinces beyond the Alps are under pressure of their own. Many of the empire’s soldiers already come from allied peoples, as when Visigoths fought alongside Aetius in 451. The court cannot defend everything at once.',
      historicalContextIds: ['catalaunian-plains-451', 'vandal-sack-455'],
      prompt: 'Where should the empire’s armies stand?',
      choices: [
        {
          id: 'hold-italy',
          label: 'Concentrate the armies in Italy',
          rationale:
            'Keep the main forces close to Rome and Ravenna. The heartland and the court are safer, but the provinces must largely defend themselves.',
          outcome:
            'Concentrating the armies made Italy and the court safer, and the Italian elite was reassured. Provinces beyond the Alps, left largely on their own, felt abandoned.',
          warning: 'Provinces left to defend themselves may look to local leaders instead of the court.',
          effects: [
            { resource: 'military', delta: 4 },
            { resource: 'legitimacy', delta: 5 },
            { resource: 'unity', delta: -8 },
          ],
          conditionalEffects: [
            {
              id: 'italy-paid-troops',
              when: { flag: 'armies-paid-first' },
              explanation: 'Because you paid the armies first, the troops brought to Italy arrive paid, supplied and ready.',
              effects: [{ resource: 'military', delta: 4 }],
            },
          ],
          consequences: [
            {
              id: 'italy-provinces-drift',
              dueYear: 468,
              hint: 'Provinces without imperial troops may drift towards local strongmen.',
              condition: { notFlag: 'provincial-revenue' },
              explanation: 'Years without imperial armies beyond the Alps loosened the provinces’ loyalty to the court.',
              lapsedExplanation:
                'Because the provinces kept a share of their revenue, local elites could pay for their own defence and stayed loyal.',
              effects: [{ resource: 'unity', delta: -6 }],
            },
          ],
          flagsSet: ['italy-garrisoned'],
          nextEventId: 'checkpoint-d3',
        },
        {
          id: 'field-army',
          label: 'Fund a mobile field army',
          rationale:
            'Build a strong army that can march to whichever frontier is threatened. It is flexible and visible across the provinces, but campaigning year after year is expensive.',
          outcome:
            'A mobile army could reach threatened frontiers and showed the provinces that the court still defended them. It cost a great deal to raise and keeps costing money.',
          warning: 'Needs money up front, and the costs continue.',
          prerequisites: [{ resource: 'economy', min: 30 }],
          effects: [
            { resource: 'military', delta: 8 },
            { resource: 'unity', delta: 4 },
            { resource: 'economy', delta: -10 },
          ],
          consequences: [
            {
              id: 'field-army-upkeep',
              dueYear: 468,
              hint: 'A field army must be paid every year it campaigns.',
              explanation: 'Years of campaigning kept draining the treasury.',
              effects: [{ resource: 'economy', delta: -5 }],
            },
            {
              id: 'field-army-victories',
              dueYear: 468,
              hint: 'If the army stays strong, its successes may strengthen the court’s authority.',
              condition: { resource: 'military', min: 55 },
              explanation: 'A strong field army won enough engagements to lend the court real authority.',
              lapsedExplanation: 'The field army was never strong enough to win the reputation the court hoped for.',
              effects: [{ resource: 'legitimacy', delta: 4 }],
            },
          ],
          flagsSet: ['field-army'],
          nextEventId: 'checkpoint-d3',
        },
        {
          id: 'settle-federates',
          label: 'Settle allies as federates',
          rationale:
            'Grant land inside the frontiers to allied peoples in return for military service. Soldiers come cheaply, but Roman elites distrust the arrangement and the allies’ leaders gain power of their own.',
          outcome:
            'Allied soldiers strengthened the army at little cost to the treasury. Many senators saw land handed to outsiders, and the court’s standing suffered.',
          warning: 'Federate leaders may demand more if the empire’s own armies grow weak.',
          effects: [
            { resource: 'military', delta: 7 },
            { resource: 'economy', delta: 3 },
            { resource: 'legitimacy', delta: -7 },
          ],
          conditionalEffects: [
            {
              id: 'federates-provincial-partners',
              when: { flag: 'provincial-revenue' },
              explanation:
                'Because the provinces already keep a share of their revenue, provincial elites have a stake in making the settlements work.',
              effects: [{ resource: 'unity', delta: 4 }],
            },
          ],
          consequences: [
            {
              id: 'federates-demands',
              dueYear: 476,
              hint: 'If the empire’s own armies weaken, federate leaders may press for more land and power.',
              condition: { resource: 'military', below: 50 },
              explanation: 'With the imperial army weak, federate leaders pressed the court for more land and power.',
              lapsedExplanation: 'The imperial army stayed strong enough that federate leaders kept to their agreements.',
              effects: [{ resource: 'unity', delta: -8 }],
            },
          ],
          flagsSet: ['federates-settled'],
          nextEventId: 'checkpoint-d3',
        },
      ],
    },
    {
      kind: 'terminal',
      id: 'checkpoint-d3',
      year: 461,
      yearApproximate: true,
      status: 'in-development',
      title: 'Next: North African policy, c. 461–468',
      summary:
        'Decision 3 has not been written yet. Your choices, their effects and the consequences still to come are recorded; this branch continues in the next development milestone.',
    },
  ],
});
