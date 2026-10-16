import { deepFreeze } from '../../../lib/freeze';
import type { AlternateScenario, ChoiceNarrative } from '../../../types/simulation';

/**
 * The political situation at Decision 4, shared by all three reports. The
 * default line is replaced if the court is broke or has lost its standing, and
 * every note whose condition holds is added, so the report reflects earlier
 * decisions, relations with Constantinople and the regions, and resources.
 */
const D4_SITUATION = {
  situation:
    'Your council meets with the empire’s authority contested. The court, the commanders of the army, the great landowners and the rulers of the provinces each claim a say in who governs, and none of them can govern alone.',
  situationVariants: [
    {
      when: { resource: 'legitimacy', below: 15 },
      text: 'The court’s standing has collapsed. Few outside the palace still obey its orders unless they are paid or forced to, and the commanders, the landowners and the provinces are bargaining over its future without it.',
    },
    {
      when: { resource: 'economy', below: 15 },
      text: 'The treasury is all but empty. The court cannot pay its officials or its soldiers on time, and whoever lends it money will expect a say in how the empire is governed.',
    },
  ],
  situationNotes: [
    {
      when: { flag: 'joined-expedition' },
      text: 'Because the West sailed with the eastern expedition, Constantinople regards the court as a partner.',
    },
    {
      when: { flag: 'vandal-treaty' },
      text: 'Because the court made its own peace with Gaiseric, Constantinople is cool towards it, though the Vandal raids have eased.',
    },
    {
      when: { flag: 'africa-abandoned' },
      text: 'Because the court gave up Africa to defend what remained, the provinces it still holds look to it for protection.',
    },
    {
      when: { flag: 'italy-garrisoned' },
      text: 'With the armies concentrated in Italy, the Italian elite feel secure and the provinces beyond the Alps feel neglected.',
    },
    { when: { flag: 'field-army' }, text: 'The mobile field army answers to its commander first and to the court second.' },
    {
      when: { flag: 'federates-settled' },
      text: 'Federate leaders now hold land inside the empire and expect a voice in its affairs.',
    },
    { when: { resource: 'military', min: 60 }, text: 'The army is strong, and its commanders know it.' },
  ],
} as const satisfies Pick<ChoiceNarrative, 'situation' | 'situationVariants' | 'situationNotes'>;

/** The political situation at Decision 5, shared by all three reports (see D4_SITUATION). */
const D5_SITUATION = {
  situation:
    'The final crisis has arrived. The soldiers want land, the commanders want power, the regional rulers want to govern for themselves, and Constantinople is watching to see who will hold Italy, and in whose name.',
  situationVariants: [
    {
      when: { resource: 'legitimacy', below: 15 },
      text: 'The court’s standing is all but gone. Few still obey the emperor unless they are paid or forced to, and the soldiers, the commanders and the regional rulers are deciding Italy’s future among themselves.',
    },
    {
      when: { resource: 'economy', below: 10 },
      text: 'The treasury is empty. The court cannot pay the soldiers who are demanding land, and whatever it decides must cost almost nothing.',
    },
  ],
  situationNotes: [
    { when: { flag: 'central-authority' }, text: 'The court restored the emperor’s authority, and loyal officials still answer to it.' },
    { when: { flag: 'regional-bargain' }, text: 'The bargain with the regional powers still binds them to the court.' },
    { when: { flag: 'commander-rules' }, text: 'The army’s commander rules in the emperor’s name; the troops are his, not the emperor’s.' },
    { when: { flag: 'joined-expedition' }, text: 'Constantinople still remembers that the West sailed with its expedition.' },
    { when: { flag: 'vandal-treaty' }, text: 'Constantinople has not forgotten the separate peace with Gaiseric.' },
    { when: { flag: 'federates-settled' }, text: 'Federate leaders hold land inside the empire and command their own soldiers.' },
    { when: { flag: 'treasury-defaulted' }, text: 'The treasury has already failed to pay its obligations once.' },
    { when: { flag: 'authority-collapsed' }, text: 'The court’s authority has already collapsed once; many no longer expect it to command.' },
    { when: { resource: 'military', min: 60 }, text: 'The army is strong, and its commanders know it.' },
  ],
} as const satisfies Pick<ChoiceNarrative, 'situation' | 'situationVariants' | 'situationNotes'>;

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
 * Milestone status: decisions 1–4 of 5 are written. Every path ends at an
 * in-development checkpoint (c. 474) where decision 5 will go.
 *
 * How consequences carry forward (each with an authored reason, never a bare penalty):
 * - Flags record what was decided; later choices read them as prerequisites or
 *   as conditional effects ("Because you …").
 * - Scheduled consequences fall due in a later year (459, 468, 472, 475, 476).
 *
 * ORDER OF EVENTS within a year: consequences due by a decision's year take
 * effect on arrival, BEFORE that decision is shown. So everything due in 468
 * resolves before Decision 3 (c. 468), and everything due in 472 before
 * Decision 4 (c. 472). The player sees hints and years in advance, never
 * numbers. Some consequences only take effect if a condition holds when they
 * come due; otherwise they lapse, with a reason.
 *
 * Path matrix (verified in tests/unit/rome-campaign.test.ts against an
 * independent reference model): 81 theoretical D1×D2×D3×D4 combinations;
 * 54 valid; 9 blocked at D2 (paying the armies leaves too little money for a
 * field army); 9 blocked at D3 (Military 49 or 46 is below the 50 the
 * expedition needs, or Legitimacy 12 below the 15 a treaty needs); 9 blocked
 * at D4 (restoring authority needs Legitimacy 15 and Economy 10; ruling
 * through the commander needs Military 50). Every state that reaches D4 has
 * at least two options, and bargaining with the regions is always open.
 *
 * Recovery at D4 (no automatic rescue): bargaining with the regions brings
 * landowner loans when Economy is below 15 and counts for more when
 * Legitimacy is below 15, but costs revenue and troops, hands tax collection
 * to creditors, and strains in 476 if the treasury is still below 20.
 *
 * Balance adjustments in version 3, each with an in-world reason:
 * - Tax reform pays for a better-equipped field army (+3 Military), so a strong
 *   field army can earn its 468 reputation on that path but not on others.
 * - Landowners turn on the court only below Legitimacy 28: holding Italy
 *   reassures the Italian elite enough (Legitimacy 29) to keep them quiet.
 */
export const romeAlternateScenario: AlternateScenario = deepFreeze<AlternateScenario>({
  id: 'rome-alternate',
  version: 5,
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
    {
      version: 4,
      summary:
        'Decision 4, imperial legitimacy, and the consequences due in 472. Decision 3 now leads on to Decision 4, so every path continues further than before.',
    },
    {
      version: 5,
      summary:
        'Decision 5, the final crisis, and the three endings. A decision’s costs and gains are now settled together, and a cost the empire cannot pay in full has a structural consequence instead of disappearing at zero.',
    },
  ],
  shortfallRules: [
    {
      resource: 'economy',
      transferTo: 'unity',
      flag: 'treasury-defaulted',
      explanation: 'The treasury could not pay all of it, so the court made up the difference by seizing goods and labour from the provinces.',
    },
    {
      resource: 'military',
      transferTo: 'unity',
      flag: 'army-exhausted',
      explanation: 'The army could not supply everything asked of it, so towns and landowners had to raise and pay for their own defence.',
    },
    {
      resource: 'legitimacy',
      transferTo: 'unity',
      flag: 'authority-collapsed',
      explanation: 'The court had no standing left to spend, so provinces and officials stopped obeying it.',
    },
    {
      resource: 'unity',
      transferTo: 'legitimacy',
      flag: 'provinces-defiant',
      explanation: 'Provincial loyalty was already exhausted, so the provinces openly defied the court and its standing fell.',
    },
  ],
  endings: [
    {
      id: 'imperial-survival',
      category: 'imperial-survival',
      title: 'Imperial Survival',
      summary: 'The Western imperial office comes through the crisis of 476 with real authority over a smaller empire.',
    },
    {
      id: 'fragmented-survival',
      category: 'fragmented-survival',
      title: 'Fragmented Survival',
      summary:
        'A Roman political order survives in the West, but divided: power is shared with, or handed to, regional rulers, commanders and settled allies.',
    },
    {
      id: 'imperial-collapse',
      category: 'imperial-collapse',
      title: 'Imperial Collapse',
      summary: 'Neither a Western emperor nor any successor order holds the West together. Power lies with whoever commands soldiers in each region.',
    },
  ],
  endingRules: [
    {
      id: 'is-office-holds',
      endingId: 'imperial-survival',
      conditions: [
        { notFlag: 'office-transferred' },
        { resource: 'legitimacy', min: 35 },
        { resource: 'military', min: 40 },
        { resource: 'unity', min: 25 },
        { resource: 'economy', min: 5 },
        { notFlag: 'authority-collapsed' },
        { notFlag: 'treasury-defaulted' },
      ],
      maxLooming: 0,
      explanation:
        'The imperial office was kept, and the emperor had the standing, the army, the unity and the money to hold it, with no unpaid debts or collapse of authority behind him and no serious threat still looming.',
    },
    {
      id: 'fs-order-persists',
      endingId: 'fragmented-survival',
      conditions: [
        { resource: 'unity', min: 25 },
        { resource: 'legitimacy', min: 15 },
      ],
      maxLooming: 1,
      explanation:
        'Imperial authority did not hold everywhere, but enough unity and standing remained for a Roman political order to survive in parts of the West.',
    },
    {
      id: 'fs-successors-hold',
      endingId: 'fragmented-survival',
      conditions: [{ flag: 'office-transferred' }, { resource: 'unity', min: 25 }],
      maxLooming: 1,
      explanation: 'The Western imperial office lapsed, but the successor rulers held together.',
    },
    {
      id: 'ic-fallback',
      endingId: 'imperial-collapse',
      conditions: [],
      explanation: 'Neither the imperial office nor a successor order had enough unity, standing or strength to hold the West together.',
    },
  ],
  endingNarrative: {
    settlement: [
      {
        endings: ['imperial-survival'],
        when: [{ flag: 'office-defended' }],
        text: 'The emperor defended his throne and won. A Western emperor still rules from Italy, with fewer provinces than his predecessors but real authority over those that remain.',
      },
      {
        endings: ['imperial-survival'],
        when: [{ flag: 'power-shared' }],
        text: 'The emperor kept his throne by sharing power with the army. A Western emperor still rules from Italy, with soldiers settled on Italian land as partners in the empire.',
      },
      { endings: ['imperial-survival'], text: 'A Western emperor still rules from Italy, with real authority over a smaller empire.' },
      {
        endings: ['fragmented-survival'],
        when: [{ flag: 'office-transferred' }, { flag: 'regional-bargain' }],
        text: 'The Western imperial office has lapsed, but a federation of successor rulers, bound by the bargain struck in the 470s, keeps a Roman order alive in the West.',
      },
      {
        endings: ['fragmented-survival'],
        when: [{ flag: 'office-transferred' }],
        text: 'The Western imperial office has lapsed. Successor rulers govern Italy and the provinces in the name of the emperor in Constantinople, and Roman law and administration carry on under them.',
      },
      {
        endings: ['fragmented-survival'],
        text: 'The empire survives in pieces. An emperor still reigns, but much of the West is governed by regional powers, commanders and settled soldiers who obey him only when it suits them.',
      },
      {
        endings: ['imperial-collapse'],
        when: [{ flag: 'office-defended' }],
        text: 'The war for the throne was lost, or never decided. Italy is fought over by rival commanders, and no one rules the West.',
      },
      {
        endings: ['imperial-collapse'],
        when: [{ flag: 'office-transferred' }],
        text: 'The Western imperial office lapsed, and the successors did not hold together. The West has broken into separate kingdoms with no common authority.',
      },
      {
        text: 'Imperial authority in the West has collapsed. Power lies with whoever commands soldiers in each region, and no one speaks for the empire as a whole.',
      },
    ],
    imperialAuthority: [
      {
        when: [{ flag: 'authority-collapsed' }],
        text: 'The court’s authority collapsed during the crisis; even where an emperor’s name is still used, few obey it.',
      },
      {
        endings: ['imperial-survival'],
        when: [{ resource: 'legitimacy', min: 50 }],
        text: 'The emperor’s authority is secure: his orders are obeyed in Italy and respected beyond it.',
      },
      { endings: ['imperial-survival'], text: 'The emperor’s authority holds, though it must still be defended.' },
      {
        when: [{ flag: 'office-transferred' }],
        text: 'There is no Western emperor. Authority belongs to the successor rulers — and, in name, to the emperor in Constantinople.',
      },
      { when: [{ flag: 'commander-rules' }], text: 'The emperor reigns, but the commander of the army rules.' },
      { when: [{ resource: 'legitimacy', below: 20 }], text: 'Imperial authority is little more than a name.' },
      { text: 'The emperor is obeyed where his officials and soldiers can reach, and ignored elsewhere.' },
    ],
    army: [
      { when: [{ flag: 'army-exhausted' }], text: 'The army could not supply what was asked of it and is close to breaking.' },
      {
        when: [{ resource: 'military', min: 65 }],
        text: 'The army is strong — strong enough that whoever commands it holds the real power.',
      },
      { when: [{ resource: 'military', min: 45 }], text: 'The army is intact and able to defend Italy.' },
      { when: [{ resource: 'military', min: 25 }], text: 'The army is weakened: it can hold some places, but not all.' },
      { text: 'The army is broken; towns and landowners must defend themselves.' },
    ],
    economy: [
      {
        when: [{ flag: 'treasury-defaulted' }, { resource: 'economy', min: 20 }],
        text: 'The treasury failed to pay its obligations during the crisis, but it has recovered enough to pay its way.',
      },
      {
        when: [{ flag: 'treasury-defaulted' }],
        text: 'The treasury failed to pay its obligations; the court made up the difference by seizing goods and labour from the provinces, and they will not soon forget it.',
      },
      { when: [{ resource: 'economy', min: 40 }], text: 'The treasury is solvent and trade is recovering.' },
      { when: [{ resource: 'economy', min: 20 }], text: 'The treasury is strained, but it pays its way.' },
      { when: [{ resource: 'economy', min: 8 }], text: 'The treasury is nearly empty; every new expense must be begged or borrowed.' },
      { text: 'The treasury is empty.' },
    ],
    regionalPowers: [
      {
        when: [{ flag: 'office-transferred' }, { flag: 'regional-bargain' }],
        text: 'The regional powers govern their own lands as partners in a federation of successors.',
      },
      { when: [{ flag: 'office-transferred' }], text: 'The regional powers govern their own lands and owe the West nothing.' },
      { when: [{ flag: 'provinces-defiant' }], text: 'The provinces openly defy the court.' },
      {
        when: [{ flag: 'regional-bargain' }, { resource: 'unity', min: 30 }],
        text: 'The regional powers keep to their bargain with the court.',
      },
      { when: [{ flag: 'regional-bargain' }], text: 'The bargain with the regional powers is fraying.' },
      { when: [{ flag: 'power-shared' }], text: 'The soldiers settled on Italian land are now a regional power of their own.' },
      { when: [{ resource: 'unity', min: 40 }], text: 'The provinces still loyal to the court stand behind it.' },
      { when: [{ resource: 'unity', min: 20 }], text: 'The regional powers obey the court when it suits them.' },
      { text: 'The regional powers go their own way.' },
    ],
    constantinople: [
      {
        when: [{ flag: 'office-transferred' }, { flag: 'joined-expedition' }],
        text: 'Constantinople, remembering the West’s part in the expedition against Carthage, treats the successor rulers as its partners.',
      },
      {
        when: [{ flag: 'office-transferred' }],
        text: 'The emperor in Constantinople is now the only Roman emperor; the successor rulers acknowledge him, and he decides whether to recognise them.',
      },
      { when: [{ flag: 'vandal-treaty' }], text: 'Constantinople remains cool towards the West after its separate peace with Gaiseric.' },
      { when: [{ flag: 'joined-expedition' }], text: 'Constantinople regards the West as a partner, remembering the expedition against Carthage.' },
      { when: [{ flag: 'central-authority' }], text: 'Constantinople deals with the Western emperor as a fellow ruler.' },
      { text: 'Constantinople watches the West from a distance and recognises whoever holds power in Italy.' },
    ],
  },
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
    {
      id: 'central-authority',
      label: 'You restored the emperor’s authority',
      laterEffect: 'A stronger court, and powerful men who lost their independence to it.',
    },
    {
      id: 'regional-bargain',
      label: 'You struck a bargain with the regional powers',
      laterEffect: 'The empire holds together by agreement, for as long as each side keeps its word.',
    },
    {
      id: 'commander-rules',
      label: 'You let the army’s commander rule in the emperor’s name',
      laterEffect: 'Order backed by the army, and a commander with the power to choose emperors.',
    },
    {
      id: 'office-defended',
      label: 'You defended the imperial office by force',
      laterEffect: 'An emperor who rules through his own army, for as long as it stays loyal and paid.',
    },
    {
      id: 'power-shared',
      label: 'You gave the soldiers land and their leaders a share of power',
      laterEffect: 'An army with a stake in Italy, and landowners who paid for it.',
    },
    {
      id: 'office-transferred',
      label: 'You let the Western imperial office lapse in favour of successor rulers',
      laterEffect: 'No Western emperor; successor rulers who acknowledge Constantinople.',
    },
    {
      id: 'treasury-defaulted',
      label: 'The treasury failed to pay its obligations',
      laterEffect: 'The court seized goods and labour from the provinces to make up what it could not pay.',
    },
    {
      id: 'army-exhausted',
      label: 'The army could not supply the troops asked of it',
      laterEffect: 'Towns and landowners had to raise their own defence.',
    },
    {
      id: 'authority-collapsed',
      label: 'The court’s authority collapsed',
      laterEffect: 'Provinces and officials stopped obeying a court with no standing left.',
    },
    {
      id: 'provinces-defiant',
      label: 'The provinces openly defied the court',
      laterEffect: 'Provincial loyalty ran out, and the court’s standing fell with it.',
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
          nextEventId: 'd4-imperial-legitimacy',
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
          nextEventId: 'd4-imperial-legitimacy',
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
          nextEventId: 'd4-imperial-legitimacy',
        },
      ],
    },
    {
      kind: 'decision',
      id: 'd4-imperial-legitimacy',
      year: 472,
      yearApproximate: true,
      title: 'Imperial legitimacy',
      context:
        'In 467 Constantinople sent Anthemius to rule the West, and Ricimer, the general who had made and unmade emperors since 456, married his daughter. Their quarrel over who truly ruled ended in war in 472: Ricimer besieged Rome and raised a rival emperor, and Anthemius was killed. Meanwhile Euric’s Visigoths, still formally Rome’s allies, were taking land in Gaul and Hispania. In your timeline the same question now reaches the council: whose authority holds the empire together?',
      historicalContextIds: ['anthemius-467', 'gaul-defeat-471', 'ricimer-overthrows-anthemius-472', 'ricimer-olybrius-die-472'],
      prompt: 'Where should the emperor’s authority come from?',
      choices: [
        {
          id: 'restore-imperial-authority',
          label: 'Restore the emperor’s authority',
          rationale:
            'Bring appointments, revenue and the command of the army back under the emperor. Offices go to men loyal to the court, and commanders who act on their own are recalled. If it works, the court governs again; it will also make enemies of every commander and provincial leader used to deciding for himself.',
          outcome:
            'The court took back control of appointments and revenue and recalled the commanders who had acted on their own. The emperor’s standing rose; the commanders and provincial leaders who lost their independence resented it.',
          warning: 'Needs some standing and some money to enforce, and it turns powerful men into opponents.',
          prerequisites: [
            { resource: 'legitimacy', min: 15 },
            { resource: 'economy', min: 10 },
          ],
          effects: [
            { resource: 'economy', delta: 5 },
            { resource: 'legitimacy', delta: 8 },
            { resource: 'unity', delta: -7 },
            { resource: 'military', delta: -4 },
          ],
          conditionalEffects: [
            {
              id: 'authority-eastern-backing',
              when: { flag: 'joined-expedition' },
              explanation:
                'Because the West sailed with the eastern expedition, Constantinople publicly backs the emperor, and his claim carries more weight.',
              effects: [{ resource: 'legitimacy', delta: 3 }],
            },
            {
              id: 'authority-eastern-doubts',
              when: { flag: 'vandal-treaty' },
              explanation:
                'Because the court made a separate peace with Gaiseric, Constantinople withholds its support, and the emperor’s claim carries less weight.',
              effects: [{ resource: 'legitimacy', delta: -3 }],
            },
          ],
          consequences: [
            {
              id: 'loyal-administration',
              dueYear: 475,
              hint: 'Loyal officials may collect taxes more faithfully, if the court’s standing holds.',
              condition: { resource: 'legitimacy', min: 35 },
              explanation: 'With the court’s standing secure, its new officials collected taxes more faithfully.',
              lapsedExplanation: 'The court’s standing was too weak for its new officials to collect much more than before.',
              effects: [{ resource: 'economy', delta: 4 }],
            },
            {
              id: 'centralisation-resisted',
              dueYear: 476,
              hint: 'If the empire stays divided, the commanders and provincial leaders who lost power may refuse the court’s orders.',
              condition: { resource: 'unity', below: 30 },
              explanation:
                'Commanders and provinces that had lost their independence refused the court’s orders, and some troops went with them.',
              lapsedExplanation: 'The empire was united enough that those who lost power to the court accepted it.',
              effects: [{ resource: 'military', delta: -6 }],
              mapCues: [{ kind: 'pressure', regions: ['gaul', 'hispania', 'illyricum'], tone: 'loss', label: 'Provinces refuse the court’s orders' }],
            },
          ],
          flagsSet: ['central-authority'],
          mapCues: [{ kind: 'emphasis', regions: ['italy'], tone: 'gain', label: 'The court reasserts its authority' }],
          narrative: {
            ...D4_SITUATION,
            ordered:
              'You ordered appointments, revenue and the command of the army brought back under the emperor, and recalled the commanders who had been acting on their own.',
            effect:
              'The emperor governs again rather than merely reigning. Revenue that had stayed in other hands reaches the treasury, and the court’s orders carry weight. The price is division: men used to ruling their own commands now have reason to wish the court weaker.',
            effectVariants: [
              {
                when: { flag: 'joined-expedition' },
                text: 'The emperor governs again rather than merely reigning, and Constantinople’s public support makes his claim hard to dispute. Revenue reaches the treasury and the court’s orders carry weight. The price is division: men used to ruling their own commands now have reason to wish the court weaker.',
              },
              {
                when: { flag: 'vandal-treaty' },
                text: 'The court has reclaimed appointments and revenue, but without Constantinople’s backing its claim rests on its own strength alone — and the men who lost their independence know it.',
              },
            ],
            stakeholders: [
              { id: 'court-officials', group: 'Officials loyal to the court', impact: 'gains', text: 'Offices and influence return to men who owe them to the emperor.' },
              { id: 'commanders', group: 'Army commanders', impact: 'loses', text: 'Commanders who acted on their own lose their independence and some of their troops.' },
              { id: 'provincial-leaders', group: 'Provincial leaders', impact: 'loses', text: 'They lose the freedom to govern their regions as they saw fit.' },
              {
                id: 'eastern-court',
                group: 'The eastern court',
                impact: 'gains',
                text: 'Constantinople gains a Western emperor who governs, and who remembers who stood with him.',
                when: { flag: 'joined-expedition' },
              },
            ],
            uncertainty:
              'Authority taken back by order must be held by force or by consent. If the empire stays divided, the men who lost power may refuse to obey, and the court now has fewer soldiers of its own.',
            uncertaintyVariants: [
              {
                when: { resource: 'unity', below: 30 },
                text: 'The empire was already divided before this decision, and it is more divided now. The commanders and provinces that lost power to the court may soon refuse to obey it, and the court has fewer soldiers of its own.',
              },
            ],
          },
          nextEventId: 'd5-final-crisis',
        },
        {
          id: 'bargain-with-regions',
          label: 'Strike a bargain with the regional powers',
          rationale:
            'Negotiate with the great landowners, the provincial leaders and the federate kings: offices, tax relief and a voice in the council, in exchange for recognising the emperor and keeping the peace. Negotiated survival rather than command — the court stays, but shares its power.',
          outcome:
            'The court traded offices, tax relief and a voice in its council for the recognition of the regional powers. The empire held together by agreement; the court gave up revenue and some of its troops to the regions.',
          warning: 'The bargain holds only while the court can keep its side of it.',
          effects: [
            { resource: 'unity', delta: 6 },
            { resource: 'legitimacy', delta: 4 },
            { resource: 'economy', delta: -6 },
            { resource: 'military', delta: -2 },
          ],
          conditionalEffects: [
            {
              id: 'bargain-landowner-loans',
              when: { resource: 'economy', below: 15 },
              explanation:
                'Because the treasury is all but empty, the great landowners lend the court money as part of the bargain — in return for collecting local taxes themselves.',
              effects: [{ resource: 'economy', delta: 10 }],
            },
            {
              id: 'bargain-recognition',
              when: { resource: 'legitimacy', below: 15 },
              explanation:
                'Because the court’s standing had collapsed, the regional powers’ public recognition of the emperor counts for more than usual.',
              effects: [{ resource: 'legitimacy', delta: 4 }],
            },
            {
              id: 'bargain-loyal-provinces',
              when: { flag: 'africa-abandoned' },
              explanation:
                'Because the court gave up Africa to defend the provinces it still holds, their leaders are ready to deal.',
              effects: [{ resource: 'unity', delta: 3 }],
            },
          ],
          consequences: [
            {
              id: 'regional-levies',
              dueYear: 475,
              hint: 'Under the bargain, the regional powers may raise troops of their own.',
              explanation: 'Under the bargain, the regional powers raised troops of their own for the common defence.',
              effects: [{ resource: 'military', delta: 3 }],
              mapCues: [{ kind: 'emphasis', regions: ['gaul', 'hispania'], tone: 'gain', label: 'Regional levies' }],
            },
            {
              id: 'bargain-strains',
              dueYear: 476,
              hint: 'If the court cannot pay what it promised, its partners may stop treating it as their ruler.',
              condition: { resource: 'economy', below: 20 },
              explanation: 'Unable to pay what it had promised, the court lost the respect of its partners in the bargain.',
              lapsedExplanation: 'The court kept its side of the bargain, and its partners kept theirs.',
              effects: [{ resource: 'legitimacy', delta: -6 }],
            },
          ],
          flagsSet: ['regional-bargain'],
          mapCues: [{ kind: 'emphasis', regions: ['italy', 'gaul', 'hispania'], tone: 'neutral', label: 'Power shared by agreement' }],
          narrative: {
            ...D4_SITUATION,
            ordered:
              'You sent envoys to the great landowners, the provincial leaders and the federate kings, offering offices, tax relief and a voice in the council in exchange for their recognition of the emperor.',
            effect:
              'The empire survives by negotiation rather than command. The regional powers now have a stake in its survival, and the court’s standing rises with their recognition — but it has given away revenue and some of its soldiers, and governs only as far as its partners agree.',
            effectVariants: [
              {
                when: { resource: 'economy', below: 15 },
                text: 'Negotiated survival: with the treasury empty, the court had little to offer but titles, so it gave the landowners the right to collect local taxes in exchange for loans. The money keeps the court afloat for now, but part of the empire’s revenue now belongs to its creditors.',
              },
              {
                when: { resource: 'legitimacy', below: 15 },
                text: 'Negotiated survival: with its standing collapsed, the court could not command, so it asked for recognition instead and got it, at the price of a share in its power. The emperor reigns because the regional powers agree that he should.',
              },
            ],
            stakeholders: [
              { id: 'regional-elites', group: 'Great landowners and provincial leaders', impact: 'gains', text: 'They gain offices, tax relief and a voice in the council.' },
              { id: 'court', group: 'The imperial court', impact: 'loses', text: 'It gives up revenue and the power to rule alone.' },
              { id: 'army', group: 'The army', impact: 'mixed', text: 'Some soldiers pass to regional commanders; the rest serve a court that can no longer pay for them alone.' },
              {
                id: 'federates',
                group: 'Federate kings',
                impact: 'gains',
                text: 'They are treated as partners in the empire rather than as subjects.',
                when: { flag: 'federates-settled' },
              },
              {
                id: 'creditors',
                group: 'Landowners who lent the court money',
                impact: 'gains',
                text: 'They now collect local taxes themselves.',
                when: { resource: 'economy', below: 15 },
              },
            ],
            uncertainty:
              'A bargain is only as strong as the court’s ability to keep its side. If the treasury cannot pay what was promised, the partners may decide they no longer need an emperor.',
            uncertaintyVariants: [
              {
                when: { resource: 'economy', below: 15 },
                text: 'The loans must be repaid, and the landowners now control part of the revenue that would repay them. If the treasury stays this poor, the court’s partners may soon treat it as a debtor rather than a ruler.',
              },
            ],
          },
          nextEventId: 'd5-final-crisis',
        },
        {
          id: 'rule-through-commander',
          label: 'Rule through the army’s commander',
          rationale:
            'Make the commander of the army the emperor’s guardian, with full power to keep order and defend Italy. Order returns quickly and the army is satisfied; the emperor becomes a figurehead, and the commander holds the real power — including the power to choose emperors.',
          outcome:
            'The commander of the army took charge of the government in the emperor’s name. Order returned and the army was content; the emperor reigned, but no longer ruled.',
          warning: 'Temporary stabilisation: whoever commands the army can unmake the emperor.',
          prerequisites: [{ resource: 'military', min: 50 }],
          effects: [
            { resource: 'military', delta: 6 },
            { resource: 'unity', delta: 4 },
            { resource: 'legitimacy', delta: -8 },
            { resource: 'economy', delta: -5 },
          ],
          conditionalEffects: [
            {
              id: 'commander-field-army',
              when: { flag: 'field-army' },
              explanation: 'Because you built a mobile field army, the commander has a strong, loyal force ready to hand.',
              effects: [{ resource: 'military', delta: 3 }],
            },
            {
              id: 'commander-quiet-sea',
              when: { flag: 'vandal-treaty' },
              explanation:
                'Because the treaty keeps the Vandal fleet quiet, the commander can keep the whole army in Italy instead of watching the coasts.',
              effects: [{ resource: 'military', delta: 3 }],
            },
          ],
          consequences: [
            {
              id: 'commander-ambition',
              dueYear: 475,
              hint: 'If the emperor’s standing falls too low, the commander may decide to choose a different emperor.',
              condition: { resource: 'legitimacy', below: 25 },
              explanation:
                'With the emperor’s standing so low, the commander replaced the emperor’s ministers with his own men and let it be known that emperors could be changed.',
              lapsedExplanation: 'The emperor kept enough standing that the commander did not dare challenge him openly.',
              effects: [
                { resource: 'legitimacy', delta: -6 },
                { resource: 'unity', delta: -4 },
              ],
              mapCues: [{ kind: 'emphasis', regions: ['italy'], tone: 'loss', label: 'The commander overshadows the emperor' }],
            },
            {
              id: 'army-arrears',
              dueYear: 476,
              hint: 'An army that runs the government expects to be paid; if the money runs out, soldiers may desert.',
              condition: { resource: 'economy', below: 15 },
              explanation: 'With the treasury empty, the army’s pay fell into arrears and soldiers deserted.',
              lapsedExplanation: 'The treasury found enough to keep the army paid.',
              effects: [{ resource: 'military', delta: -6 }],
            },
          ],
          flagsSet: ['commander-rules'],
          mapCues: [{ kind: 'emphasis', regions: ['italy'], tone: 'uncertain', label: 'The commander takes charge in Italy' }],
          narrative: {
            ...D4_SITUATION,
            ordered: 'You made the commander of the army the emperor’s guardian, with full power to keep order and defend Italy.',
            effect:
              'Order returns quickly. The army is content and the provinces see soldiers on the roads again. But everyone now knows where power lies: the emperor’s name is on the decrees, and the commander decides what they say.',
            effectVariants: [
              {
                when: { resource: 'legitimacy', below: 15 },
                text: 'Temporary stabilisation: the court’s standing had already collapsed, so the commander’s soldiers now do what the emperor’s orders could not. The empire is calmer, but the emperor is a figurehead in all but name, and his standing has fallen further still.',
              },
              {
                when: { flag: 'field-army' },
                text: 'Order returns quickly: the commander takes over a mobile field army that is strong and loyal to him. The army is content and the provinces see soldiers on the roads again — but the emperor’s name is on the decrees, and the commander decides what they say.',
              },
            ],
            stakeholders: [
              { id: 'commander', group: 'The commander of the army', impact: 'gains', text: 'He gains the real power of government.' },
              { id: 'soldiers', group: 'The soldiers', impact: 'gains', text: 'They are paid first and honoured.' },
              { id: 'emperor', group: 'The emperor', impact: 'loses', text: 'He keeps his title but loses his power.' },
              { id: 'senate', group: 'The Senate and civil officials', impact: 'loses', text: 'They lose influence to the army.' },
            ],
            uncertainty:
              'Stability that rests on one man lasts as long as he is loyal, alive and paid. If the emperor’s standing falls further, the commander may choose another emperor; if the money runs out, the army may not stay loyal to him either.',
            uncertaintyVariants: [
              {
                when: { resource: 'economy', below: 15 },
                text: 'The army expects to be paid, and the treasury is all but empty. Unless money is found, the soldiers who restored order may desert the commander — and the commander may desert the emperor.',
              },
            ],
          },
          nextEventId: 'd5-final-crisis',
        },
      ],
    },
    {
      kind: 'decision',
      id: 'd5-final-crisis',
      year: 475,
      yearApproximate: true,
      title: 'The final crisis',
      context:
        'In 474 Constantinople sent Julius Nepos to Italy; he removed Glycerius, an emperor raised without eastern approval, and was recognised by the eastern emperor Zeno. In 475 Nepos made peace with Euric by giving up the Auvergne. That August, Orestes, the general Nepos had put over the army, turned on him: Nepos fled to Dalmatia and Orestes made his young son Romulus emperor. Within a year the soldiers in Italy, refused the land they demanded, followed Odoacer instead. In your timeline the crisis has reached the same point: who will hold Italy, and in whose name?',
      historicalContextIds: ['nepos-474', 'auvergne-475', 'orestes-romulus-475', 'odoacer-deposes-romulus-476'],
      prompt: 'How will the council meet the final crisis?',
      choices: [
        {
          id: 'defend-imperial-office',
          label: 'Defend the imperial office by force',
          rationale:
            'Raise every soldier the court can still command and fight anyone who challenges the emperor. If the loyal troops win, the emperor rules with an authority no rival can match; if they lose, or the war drags on, the treasury and the army pay twice.',
          outcome:
            'The court called its loyal troops to arms and made clear that the throne would be defended, not bargained away. Its standing rose; the treasury and the army paid for the war.',
          warning: 'Needs an army that answers to the emperor — not one that answers to its commander.',
          prerequisites: [{ resource: 'military', min: 40 }, { notFlag: 'commander-rules' }],
          effects: [
            { resource: 'military', delta: -8 },
            { resource: 'economy', delta: -6 },
            { resource: 'legitimacy', delta: 8 },
            { resource: 'unity', delta: -3 },
          ],
          conditionalEffects: [
            {
              id: 'loyal-officials-raise-troops',
              when: { flag: 'central-authority' },
              explanation: 'Because you restored the emperor’s authority, loyal officials raise and pay troops in his name.',
              effects: [{ resource: 'military', delta: 4 }],
            },
            {
              id: 'regional-levies-march',
              when: { flag: 'regional-bargain' },
              explanation: 'Because of the bargain with the regional powers, their levies march for the emperor.',
              effects: [{ resource: 'military', delta: 3 }],
            },
          ],
          consequences: [
            {
              id: 'loyalist-victory',
              dueYear: 476,
              hint: 'If the loyal army is strong enough, a decisive victory could settle who rules.',
              condition: { resource: 'military', min: 45 },
              explanation: 'The loyal army won decisively, and few still questioned who ruled Italy.',
              lapsedExplanation: 'The loyal army was too weak to win outright; the fighting ended without a clear victory.',
              effects: [
                { resource: 'legitimacy', delta: 6 },
                { resource: 'unity', delta: 3 },
              ],
              mapCues: [{ kind: 'emphasis', regions: ['italy'], tone: 'gain', label: 'Loyalist victory' }],
            },
            {
              id: 'civil-war-damage',
              dueYear: 476,
              hint: 'War in Italy will damage farms, towns and trade, whoever wins.',
              explanation: 'The fighting damaged farms, towns and trade in Italy.',
              effects: [{ resource: 'economy', delta: -3 }],
            },
            {
              id: 'usurper-threat',
              dueYear: 480,
              hint: 'An emperor who held his throne by force may face the next ambitious general, unless his standing is secure.',
              condition: { resource: 'legitimacy', below: 35 },
              explanation: 'Another ambitious general challenged the emperor.',
              lapsedExplanation: 'The emperor’s standing was secure enough to discourage new challengers.',
              effects: [{ resource: 'legitimacy', delta: -8 }],
            },
          ],
          flagsSet: ['office-defended'],
          mapCues: [{ kind: 'emphasis', regions: ['italy'], tone: 'uncertain', label: 'Loyal troops called to arms' }],
          narrative: {
            ...D5_SITUATION,
            ordered: 'You ordered every loyal soldier to arms and declared that the throne would be defended, not bargained away.',
            effect:
              'The emperor has staked everything on his own army. His standing rose with the decision, but war in Italy costs money and men the empire can barely spare, and the outcome depends on whether the loyal troops are strong enough to win.',
            effectVariants: [
              {
                when: { flag: 'central-authority' },
                text: 'Because the court had already restored the emperor’s authority, loyal officials raised and paid troops in his name. The emperor has staked everything on an army that is his own; war in Italy will cost money and men, and the outcome depends on whether that army is strong enough to win.',
              },
              {
                when: { flag: 'regional-bargain' },
                text: 'The regional powers kept their side of the bargain and sent their levies to fight for the emperor. He has staked everything on that army; war in Italy will cost money and men, and the outcome depends on whether it is strong enough to win.',
              },
            ],
            stakeholders: [
              { id: 'loyal-soldiers', group: 'Soldiers loyal to the emperor', impact: 'gains', text: 'They gain pay, honour and the emperor’s gratitude.' },
              { id: 'emperor', group: 'The emperor', impact: 'gains', text: 'He remains ruler of Italy in fact as well as in name — if his army wins.' },
              { id: 'italians', group: 'Farms and towns of Italy', impact: 'loses', text: 'Those in the path of the fighting suffer.' },
              { id: 'rivals', group: 'Commanders hoping to rule through a puppet', impact: 'loses', text: 'They lose their chance, unless the emperor loses the war.' },
            ],
            uncertainty:
              'Victory is not certain, and an emperor who holds his throne by force must keep holding it. If his standing falls, the next ambitious general may try his luck.',
            uncertaintyVariants: [
              {
                when: { resource: 'military', below: 50 },
                text: 'The loyal army is thin. Unless it is stronger than it looks, the war may end without a clear victory — the worst outcome for an emperor who staked everything on force.',
              },
            ],
          },
          nextEventId: 'settlement-476',
        },
        {
          id: 'share-power-with-army',
          label: 'Give the soldiers land and their leaders a share of power',
          rationale:
            'Meet the soldiers’ demand: settle them on land in Italy, taken from the great estates, and give their leaders a place in government. The army is satisfied and becomes a partner in the empire; the landowners lose land, and the court shares power with men it cannot easily dismiss.',
          outcome:
            'The court granted the soldiers land in Italy and gave their leaders a share of power. The army was content; the landowners who gave up land were not, and the court’s authority now rested on a partnership.',
          warning: 'Settling soldiers on Italian land angers the landowners who must give it up.',
          effects: [
            { resource: 'military', delta: 8 },
            { resource: 'unity', delta: -6 },
            { resource: 'economy', delta: -4 },
            { resource: 'legitimacy', delta: -4 },
          ],
          conditionalEffects: [
            {
              id: 'federate-precedent',
              when: { flag: 'federates-settled' },
              explanation: 'Because allies were already settled as federates, the grants follow a familiar pattern and cause less outrage.',
              effects: [{ resource: 'unity', delta: 3 }],
            },
            {
              id: 'commander-guarantees',
              when: { flag: 'commander-rules' },
              explanation:
                'Because the commander already rules in the emperor’s name, he guarantees the settlement himself, and the court is seen to keep the peace.',
              effects: [{ resource: 'legitimacy', delta: 3 }],
            },
          ],
          consequences: [
            {
              id: 'soldiers-settled',
              dueYear: 476,
              hint: 'If Italy stays united enough to accept the grants, the settled soldiers may defend their new lands loyally.',
              condition: { resource: 'unity', min: 25 },
              explanation: 'Settled on their new lands, the soldiers defended Italy as their own.',
              lapsedExplanation: 'Italy was too divided for the settlements to take root, and many soldiers stayed restless.',
              effects: [
                { resource: 'military', delta: 4 },
                { resource: 'legitimacy', delta: 2 },
              ],
            },
            {
              id: 'landowners-resentment',
              dueYear: 480,
              hint: 'Landowners who lost land may work against the settlement if the empire stays divided.',
              condition: { resource: 'unity', below: 30 },
              explanation: 'Landowners who had lost land turned against the settlement.',
              lapsedExplanation: 'Enough unity held that the landowners accepted the settlement.',
              effects: [{ resource: 'unity', delta: -6 }],
            },
          ],
          flagsSet: ['power-shared'],
          mapCues: [{ kind: 'emphasis', regions: ['italy'], tone: 'neutral', label: 'Soldiers settled on Italian land' }],
          narrative: {
            ...D5_SITUATION,
            ordered: 'You granted the soldiers land in Italy, taken from the great estates, and gave their leaders seats in the council.',
            effect:
              'The army now has a stake in Italy and good reason to defend it. The court has bought peace with its own soldiers at the landowners’ expense, and it governs as one partner among several.',
            effectVariants: [
              {
                when: { resource: 'legitimacy', below: 15 },
                text: 'With its standing already exhausted, the court could only agree to what the soldiers demanded. The army is content and Italy is quiet; the court’s authority is now little more than a name.',
              },
              {
                when: { flag: 'commander-rules' },
                text: 'The commander, already ruling in the emperor’s name, guaranteed the settlement himself. The army is satisfied and Italy is quiet, but the emperor is now one partner among several, and not the strongest.',
              },
            ],
            stakeholders: [
              { id: 'soldiers', group: 'The soldiers', impact: 'gains', text: 'They gain land of their own and a voice in government.' },
              { id: 'army-leaders', group: 'The soldiers’ leaders', impact: 'gains', text: 'They gain seats in the council and a share of power.' },
              { id: 'landowners', group: 'Great landowners', impact: 'loses', text: 'They give up part of their estates.' },
              { id: 'court', group: 'The imperial court', impact: 'mixed', text: 'It keeps its throne but shares its power.' },
            ],
            uncertainty:
              'A settlement imposed on unwilling landowners may not last. If Italy stays divided, those who lost land may work against it.',
          },
          nextEventId: 'settlement-476',
        },
        {
          id: 'transfer-to-successors',
          label: 'Hand government to successor rulers under Constantinople',
          rationale:
            'Let the Western imperial office lapse. Italy is governed by a ruler who acknowledges the emperor in Constantinople, and the regional powers govern their own lands as partners. The cost of an imperial court disappears and the fighting over the throne ends — and so does the Western emperor.',
          outcome:
            'The council let the Western imperial office lapse. Italy and the regions were governed by successor rulers who acknowledged the emperor in Constantinople. The fighting over the throne ended, and so did the Western emperor.',
          warning: 'Ends the Western imperial office; what holds the successors together is up to them.',
          effects: [
            { resource: 'legitimacy', delta: -10 },
            { resource: 'economy', delta: 6 },
            { resource: 'unity', delta: 4 },
            { resource: 'military', delta: -4 },
          ],
          conditionalEffects: [
            {
              id: 'successors-federation',
              when: { flag: 'regional-bargain' },
              explanation: 'Because of the bargain with the regional powers, the successors already have a framework for working together.',
              effects: [{ resource: 'unity', delta: 4 }],
            },
            {
              id: 'eastern-goodwill',
              when: { flag: 'joined-expedition' },
              explanation: 'Because the West sailed with the eastern expedition, Constantinople welcomes the successors as partners.',
              effects: [{ resource: 'legitimacy', delta: 4 }],
            },
            {
              id: 'commander-becomes-ruler',
              when: { flag: 'commander-rules' },
              explanation: 'Because the commander already ruled in the emperor’s name, he takes power without a fight, and the army stays together.',
              effects: [{ resource: 'military', delta: 4 }],
            },
          ],
          consequences: [
            {
              id: 'eastern-recognition',
              dueYear: 476,
              hint: 'Constantinople may recognise the new rulers — if they have enough standing to be worth recognising.',
              condition: { resource: 'legitimacy', min: 20 },
              explanation: 'Constantinople recognised the new ruler of Italy, who governed in the eastern emperor’s name.',
              lapsedExplanation: 'Constantinople withheld its recognition, and the new rulers governed without it.',
              effects: [{ resource: 'legitimacy', delta: 5 }],
              mapCues: [{ kind: 'movement', regions: ['constantinople', 'italy'], tone: 'gain', label: 'Recognition from Constantinople' }],
            },
            {
              id: 'successors-drift',
              dueYear: 480,
              hint: 'Without an agreed framework, the successor states may drift apart.',
              condition: { notFlag: 'regional-bargain' },
              explanation: 'Without an agreed framework, the successor states went their own ways.',
              lapsedExplanation: 'The bargain with the regional powers gave the successors a framework for staying together.',
              effects: [{ resource: 'unity', delta: -8 }],
              mapCues: [{ kind: 'pressure', regions: ['gaul', 'hispania', 'italy'], tone: 'loss', label: 'Successor states drift apart' }],
            },
          ],
          flagsSet: ['office-transferred'],
          mapCues: [
            { kind: 'emphasis', regions: ['italy', 'gaul', 'hispania'], tone: 'neutral', label: 'Successor rulers' },
            { kind: 'movement', regions: ['italy', 'constantinople'], tone: 'neutral', label: 'Allegiance to Constantinople' },
          ],
          narrative: {
            ...D5_SITUATION,
            ordered:
              'You let the Western imperial office lapse and handed the government of Italy and the provinces to successor rulers who acknowledge the emperor in Constantinople.',
            effect:
              'The struggle over the Western throne is over, because there is no longer a Western throne. Without a court to maintain, the treasury breathes again and the provinces govern themselves; Roman law and administration continue under new rulers, but the West no longer has an emperor of its own.',
            effectVariants: [
              {
                when: { flag: 'commander-rules' },
                text: 'The commander who already ruled in the emperor’s name now rules in his own, as Constantinople’s representative in Italy. The army stays together, and the struggle over the throne is over — because there is no longer a Western throne.',
              },
              {
                when: { flag: 'regional-bargain' },
                text: 'The bargain struck with the regional powers becomes the framework for a federation of successors. Without a court to maintain, the treasury breathes again; Roman law and administration continue under new rulers, but the West no longer has an emperor of its own.',
              },
            ],
            stakeholders: [
              { id: 'regional-rulers', group: 'Regional rulers', impact: 'gains', text: 'They gain the right to govern their own lands.' },
              { id: 'constantinople', group: 'The emperor in Constantinople', impact: 'gains', text: 'He becomes the only Roman emperor.' },
              { id: 'western-court', group: 'The Western court and its officials', impact: 'loses', text: 'They lose their place and their purpose.' },
              { id: 'emperor', group: 'The Western emperor', impact: 'loses', text: 'He gives up his throne.' },
            ],
            uncertainty:
              'Successor rulers who share a history may not share a future. Without an agreed framework they may drift apart; with one they may hold together — but no one can yet say whether as a Roman order or as separate kingdoms.',
            uncertaintyVariants: [
              {
                when: { flag: 'regional-bargain' },
                text: 'The bargain gives the successors a framework for working together, but it has never been tested without an emperor at its head.',
              },
            ],
          },
          nextEventId: 'settlement-476',
        },
      ],
    },
    {
      kind: 'terminal',
      id: 'settlement-476',
      year: 476,
      yearApproximate: true,
      status: 'ending',
      title: 'The settlement of 476',
      summary:
        'The campaign ends here. Every consequence due by 476 has taken effect, and the outcome has been classified from the state of the whole empire: its resources, every earlier decision, any costs it could not pay, and the threats still looming.',
    },
  ],
});
