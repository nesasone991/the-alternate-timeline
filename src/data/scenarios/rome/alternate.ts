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
 * Milestone status: decisions 1–3 of 5 are written. Every path ends at an
 * in-development checkpoint where decision 4 will go.
 *
 * How consequences carry forward (each with an authored reason, never a bare penalty):
 * - Flags record what was decided; later choices read them as prerequisites or
 *   as conditional effects ("Because you …").
 * - Scheduled consequences fall due in a later year (459, 468, 472, 476).
 *
 * ORDER OF EVENTS within a year: consequences due by a decision's year take
 * effect on arrival, BEFORE that decision is shown. So everything due in 468
 * resolves first, and Decision 3 (c. 468) is made with those results in hand.
 * The player sees hints and years in advance, never numbers. Some consequences
 * only take effect if a condition holds when they come due; otherwise they
 * lapse, with a reason.
 *
 * Path matrix (verified in tests/unit/rome-campaign.test.ts): 27 theoretical
 * D1×D2×D3 combinations; 21 valid; 3 blocked at D2 (paying the armies leaves too
 * little money for a field army); 3 blocked at D3 (holding Italy without paid
 * troops leaves Military 49, below the 50 needed for the expedition, twice; tax
 * reform plus federates leaves Legitimacy 12, below the 15 needed to negotiate).
 *
 * Balance adjustments in version 3, each with an in-world reason:
 * - Tax reform pays for a better-equipped field army (+3 Military), so a strong
 *   field army can earn its 468 reputation on that path but not on others.
 * - Landowners turn on the court only below Legitimacy 28: holding Italy
 *   reassures the Italian elite enough (Legitimacy 29) to keep them quiet.
 */
export const romeAlternateScenario: AlternateScenario = deepFreeze<AlternateScenario>({
  id: 'rome-alternate',
  version: 3,
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
  changes: [
    { version: 1, summary: 'Decision 1, fiscal survival.' },
    { version: 2, summary: 'Decision 2, border defence, and consequences that arrive in later years.' },
    {
      version: 3,
      summary:
        'Decision 3, North African policy, and the consequences due in 468. A field army now benefits from tax reform, and landowners only turn against the court if its legitimacy falls below 28.',
    },
  ],
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
    {
      id: 'joined-expedition',
      label: 'You joined the expedition against Carthage',
      laterEffect: 'Credit for acting, debts to pay, and a Vandal kingdom with reason to retaliate.',
    },
    {
      id: 'vandal-treaty',
      label: 'You made a treaty with Gaiseric',
      laterEffect: 'Peace and trade for as long as the treaty holds; resentment in Constantinople.',
    },
    {
      id: 'africa-abandoned',
      label: 'You gave up Africa and fortified what remained',
      laterEffect: 'Stronger defences at home; the sea left to the Vandal fleet.',
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
              condition: { resource: 'legitimacy', below: 28 },
              explanation: 'With the court’s authority weak, landowners who lost their exemptions backed its rivals.',
              lapsedExplanation:
                'The court stayed strong enough that the landowners’ resentment never turned into open opposition.',
              effects: [{ resource: 'legitimacy', delta: -5 }],
            },
          ],
          flagsSet: ['tax-reform'],
          mapCues: [{ kind: 'emphasis', regions: ['italy'], tone: 'gain', label: 'Tax reform in the heartland' }],
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
          mapCues: [
            { kind: 'emphasis', regions: ['gaul', 'hispania', 'illyricum'], tone: 'gain', label: 'Provinces keep a share of revenue' },
          ],
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
          mapCues: [{ kind: 'emphasis', regions: ['italy'], tone: 'neutral', label: 'The armies are paid first' }],
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
              mapCues: [{ kind: 'pressure', regions: ['gaul', 'hispania'], tone: 'loss', label: 'Provincial loyalty weakens' }],
              lapsedExplanation:
                'Because the provinces kept a share of their revenue, local elites could pay for their own defence and stayed loyal.',
              effects: [{ resource: 'unity', delta: -6 }],
            },
          ],
          flagsSet: ['italy-garrisoned'],
          mapCues: [
            { kind: 'movement', regions: ['gaul', 'italy'], tone: 'neutral', label: 'Armies withdraw to Italy' },
            { kind: 'pressure', regions: ['gaul', 'hispania'], tone: 'uncertain', label: 'Provinces left to defend themselves' },
          ],
          nextEventId: 'd3-north-africa',
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
          conditionalEffects: [
            {
              id: 'field-army-funded',
              when: { flag: 'tax-reform' },
              explanation:
                'Because you reformed taxation, steady revenue pays for proper equipment and the field army starts stronger.',
              effects: [{ resource: 'military', delta: 3 }],
            },
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
              mapCues: [{ kind: 'emphasis', regions: ['gaul', 'italy'], tone: 'gain', label: 'The field army’s successes' }],
              lapsedExplanation: 'The field army was never strong enough to win the reputation the court hoped for.',
              effects: [{ resource: 'legitimacy', delta: 4 }],
            },
          ],
          flagsSet: ['field-army'],
          mapCues: [{ kind: 'movement', regions: ['italy', 'gaul'], tone: 'gain', label: 'A field army that can march where needed' }],
          nextEventId: 'd3-north-africa',
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
          mapCues: [{ kind: 'emphasis', regions: ['gaul', 'hispania'], tone: 'uncertain', label: 'Allies settled as federates' }],
          nextEventId: 'd3-north-africa',
        },
      ],
    },
    {
      kind: 'decision',
      id: 'd3-north-africa',
      year: 468,
      yearApproximate: true,
      title: 'North African policy',
      context:
        'Africa has been divided by treaty since 442, with the richest provinces around Carthage in Vandal hands. Since 461 Vandal fleets have held the western islands and raided the coasts of Italy and Sicily. Now Constantinople is preparing a great expedition against Carthage and wants the West to take part. Your council must decide what Africa is still worth.',
      historicalContextIds: ['treaty-442', 'vandal-raids-461', 'cape-bon-468'],
      prompt: 'What should the empire do about Vandal Africa?',
      choices: [
        {
          id: 'join-expedition',
          label: 'Join the eastern expedition against Carthage',
          rationale:
            'Commit the West’s ships and soldiers to the campaign Constantinople is preparing. If Carthage falls, Africa’s revenue could return to the empire; if the campaign fails, the losses will be hard to replace.',
          outcome:
            'Western ships and soldiers sailed with the eastern fleet. The court won credit for acting boldly, and the treasury and the army paid for it.',
          warning: 'A great expedition is costly whether or not it succeeds.',
          prerequisites: [{ resource: 'military', min: 50 }],
          effects: [
            { resource: 'economy', delta: -12 },
            { resource: 'military', delta: -6 },
            { resource: 'legitimacy', delta: 6 },
          ],
          conditionalEffects: [
            {
              id: 'expedition-veterans',
              when: { flag: 'field-army' },
              explanation: 'Because you built a mobile field army, experienced troops embark and fewer are lost.',
              effects: [{ resource: 'military', delta: 4 }],
            },
            {
              id: 'expedition-islands',
              when: { resource: 'military', min: 60 },
              explanation:
                'Because your army is strong enough to spare a second force, it also secures the islands near Italy, and some of their revenue returns.',
              effects: [{ resource: 'economy', delta: 5 }],
            },
          ],
          consequences: [
            {
              id: 'expedition-debts',
              dueYear: 472,
              hint: 'A campaign on this scale leaves debts that will have to be paid.',
              explanation: 'Debts from the expedition fell due and strained the treasury.',
              effects: [{ resource: 'economy', delta: -5 }],
            },
            {
              id: 'expedition-reprisal',
              dueYear: 476,
              hint: 'If the empire’s forces are worn down, the Vandals may take revenge on the coasts of Italy and Sicily.',
              condition: { resource: 'military', below: 55 },
              explanation: 'With the empire’s forces depleted, Vandal fleets struck back at Italy and Sicily.',
              lapsedExplanation: 'The empire’s forces stayed strong enough to deter Vandal reprisals.',
              effects: [{ resource: 'unity', delta: -5 }],
              mapCues: [{ kind: 'movement', regions: ['africa', 'sicily', 'italy'], tone: 'loss', label: 'Vandal reprisals' }],
            },
          ],
          flagsSet: ['joined-expedition'],
          mapCues: [
            { kind: 'movement', regions: ['italy', 'sicily', 'africa'], tone: 'uncertain', label: 'The western contingent sails for Carthage' },
            { kind: 'movement', regions: ['constantinople', 'africa'], tone: 'uncertain', label: 'The eastern fleet' },
          ],
          narrative: {
            ordered:
              'You ordered the western fleet, and every soldier who could be spared, to join Constantinople’s expedition against Carthage.',
            effect:
              'The empire has staked much of its remaining strength on one campaign. The court’s standing rose with the decision, but the treasury and the army are both thinner for it, and Carthage itself is still beyond the West’s reach.',
            effectVariants: [
              {
                when: { resource: 'military', min: 60 },
                text: 'The empire has staked much of its remaining strength on one campaign. With forces to spare, a second western force secured the islands near Italy and some of their revenue returned — but Carthage itself is still beyond the West’s reach.',
              },
            ],
            stakeholders: [
              { id: 'army', group: 'The army', impact: 'mixed', text: 'Soldiers gain pay and purpose, but many will not come back.' },
              { id: 'eastern-court', group: 'The eastern court', impact: 'gains', text: 'Constantinople gains a committed partner in its campaign.' },
              { id: 'taxpayers', group: 'Taxpayers in Italy', impact: 'loses', text: 'The cost of ships, pay and supplies falls on them.' },
              {
                id: 'veterans',
                group: 'Veterans of the field army',
                impact: 'gains',
                text: 'Their experience makes them the backbone of the western force.',
                when: { flag: 'field-army' },
              },
            ],
            uncertainty:
              'Whether Carthage can be taken is not settled here. What the campaign finally achieves — and whether the Vandals retaliate — depends on what comes next.',
          },
          nextEventId: 'checkpoint-d4',
        },
        {
          id: 'treaty-with-gaiseric',
          label: 'Negotiate a treaty with Gaiseric',
          rationale:
            'Accept that the Vandals hold Africa and bargain for an end to the raids and the right to trade across the sea. Peace and grain may follow, but the court will be seen to give up Roman provinces, and Constantinople may resent a separate peace.',
          outcome:
            'The court accepted Vandal rule in Africa in exchange for peace at sea and trade. Coastal towns breathed easier; many in Rome saw it as surrender.',
          warning: 'Needs enough standing to be taken seriously, and a treaty is only as strong as the force behind it.',
          prerequisites: [{ resource: 'legitimacy', min: 15 }],
          effects: [
            { resource: 'economy', delta: 8 },
            { resource: 'unity', delta: 2 },
            { resource: 'legitimacy', delta: -8 },
          ],
          conditionalEffects: [
            {
              id: 'treaty-garrisoned-coasts',
              when: { flag: 'italy-garrisoned' },
              explanation:
                'Because Italy’s coasts are garrisoned, Gaiseric gains less from raiding and accepts better terms.',
              effects: [{ resource: 'economy', delta: 4 }],
            },
          ],
          consequences: [
            {
              id: 'treaty-eastern-resentment',
              dueYear: 472,
              hint: 'Constantinople may resent a western peace made without it.',
              explanation: 'The eastern court resented the separate peace, and the West’s standing suffered.',
              effects: [{ resource: 'legitimacy', delta: -4 }],
            },
            {
              id: 'treaty-holds',
              dueYear: 472,
              hint: 'A treaty lasts only as long as breaking it looks more costly than keeping it.',
              condition: { resource: 'military', min: 50 },
              explanation: 'Backed by a credible army, the treaty held and trade across the sea continued.',
              lapsedExplanation: 'Without a credible army behind it, Vandal raiders soon ignored the treaty.',
              effects: [{ resource: 'economy', delta: 4 }],
              mapCues: [{ kind: 'movement', regions: ['africa', 'sicily', 'italy'], tone: 'gain', label: 'Trade across the sea' }],
            },
          ],
          flagsSet: ['vandal-treaty'],
          mapCues: [
            { kind: 'emphasis', regions: ['africa'], tone: 'neutral', label: 'Vandal rule in Africa accepted' },
            { kind: 'movement', regions: ['italy', 'africa'], tone: 'uncertain', label: 'Envoys to Carthage' },
          ],
          narrative: {
            ordered:
              'You sent envoys to Carthage to accept Vandal rule over Roman Africa, in exchange for peace at sea and the right to trade.',
            effect:
              'The raids may ease and grain may cross the sea again, but the court has formally given up provinces it once ruled, and its standing in Rome fell.',
            effectVariants: [
              {
                when: { flag: 'italy-garrisoned' },
                text: 'Garrisoned coasts gave your envoys leverage: raiding Italy had become costly, so Gaiseric accepted better terms. Even so, the court has formally given up provinces it once ruled, and its standing in Rome fell.',
              },
            ],
            stakeholders: [
              { id: 'coastal-towns', group: 'Coastal towns of Italy and Sicily', impact: 'gains', text: 'They may be spared the raids of the past years.' },
              { id: 'merchants', group: 'Merchants and shippers', impact: 'gains', text: 'Trade across the sea can resume.' },
              {
                id: 'african-claims',
                group: 'Those hoping to recover Africa',
                impact: 'loses',
                text: 'Families and officials who still counted on regaining Africa see that hope given away.',
              },
              { id: 'eastern-court', group: 'The eastern court', impact: 'loses', text: 'Constantinople loses a partner for its campaign.' },
            ],
            uncertainty:
              'Whether Gaiseric keeps his word cannot be known yet. It depends on whether the empire still looks strong enough to punish a breach.',
          },
          nextEventId: 'checkpoint-d4',
        },
        {
          id: 'fortify-what-remains',
          label: 'Give up Africa and fortify what remains',
          rationale:
            'Set aside any hope of reconquest for now. Spend on coastal defences in Italy and Sicily and on the provinces still loyal to the court. Safer and cheaper than war, but it admits that Africa is lost and leaves the sea to the Vandal fleet.',
          outcome:
            'The court turned away from Africa and spent on walls, garrisons and loyal provinces. The empire felt safer at home, but its claim to the Mediterranean shrank.',
          warning: 'Leaves the Vandal fleet in command of the sea.',
          effects: [
            { resource: 'economy', delta: -6 },
            { resource: 'military', delta: 3 },
            { resource: 'unity', delta: 6 },
            { resource: 'legitimacy', delta: -4 },
          ],
          conditionalEffects: [
            {
              id: 'fortify-field-army',
              when: { flag: 'field-army' },
              explanation: 'Because you have a mobile field army, it can be stationed where the provinces need it most.',
              effects: [{ resource: 'unity', delta: 3 }],
            },
            {
              id: 'fortify-federates',
              when: { flag: 'federates-settled' },
              explanation: 'Because federate allies already guard frontier lands, fewer imperial troops are needed there.',
              effects: [{ resource: 'military', delta: 3 }],
            },
          ],
          consequences: [
            {
              id: 'sea-left-to-vandals',
              dueYear: 476,
              hint: 'With the sea left to the Vandals, coastal trade may suffer if the empire’s defences weaken.',
              condition: { resource: 'military', below: 55 },
              explanation: 'With the sea in Vandal hands and weak defences at home, coastal trade dwindled.',
              lapsedExplanation: 'Strong coastal defences kept Vandal raids in check, and trade continued.',
              effects: [{ resource: 'economy', delta: -5 }],
              mapCues: [{ kind: 'pressure', regions: ['sicily', 'italy'], tone: 'loss', label: 'Coastal trade dwindles' }],
            },
          ],
          flagsSet: ['africa-abandoned'],
          mapCues: [
            { kind: 'emphasis', regions: ['italy', 'sicily'], tone: 'gain', label: 'Coastal defences' },
            { kind: 'emphasis', regions: ['africa'], tone: 'loss', label: 'Africa left to the Vandals' },
          ],
          narrative: {
            ordered:
              'You ordered coastal defences built in Italy and Sicily and turned money towards the provinces still loyal to the court, leaving Africa to the Vandals.',
            effect:
              'The empire is better protected at home and the provinces feel looked after, but the court has admitted it cannot recover Africa, and the sea belongs to the Vandal fleet.',
            effectVariants: [
              {
                when: { flag: 'field-army' },
                text: 'The empire is better protected at home, and the field army, stationed where the provinces need it, has made them feel looked after. But the court has admitted it cannot recover Africa, and the sea belongs to the Vandal fleet.',
              },
            ],
            stakeholders: [
              { id: 'loyal-provinces', group: 'Provinces still loyal to the court', impact: 'gains', text: 'Money and protection flow to them instead of to a distant war.' },
              { id: 'coastal-towns', group: 'Coastal towns of Italy and Sicily', impact: 'mixed', text: 'They gain walls and garrisons, but the raiding fleet is still at sea.' },
              { id: 'african-claims', group: 'Those hoping to recover Africa', impact: 'loses', text: 'The court has given up on them, at least for now.' },
              {
                id: 'federates',
                group: 'Federate allies',
                impact: 'gains',
                text: 'Their role in guarding the frontier becomes more important.',
                when: { flag: 'federates-settled' },
              },
            ],
            uncertainty:
              'Fortifications protect places, not ships. How long the Vandal fleet tolerates a cautious empire, and whether the defences hold if the army weakens, is still open.',
          },
          nextEventId: 'checkpoint-d4',
        },
      ],
    },
    {
      kind: 'terminal',
      id: 'checkpoint-d4',
      year: 471,
      yearApproximate: true,
      status: 'in-development',
      title: 'Next: imperial legitimacy, c. 470–474',
      summary:
        'Decision 4 has not been written yet. Your choices, their effects and the consequences still to come are recorded; this branch continues in the next development milestone.',
    },
  ],
});
