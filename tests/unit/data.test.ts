import { describe, expect, it } from 'vitest';
import { campaigns } from '../../src/data/campaigns';
import { getCampaignContent } from '../../src/data/scenarios';
import { romeActualTimeline } from '../../src/data/scenarios/rome/history';
import { romeSources } from '../../src/data/scenarios/rome/sources';
import { getCampaign, getFeaturedCampaign, isCampaignSelectable, workspacePath } from '../../src/lib/catalog';
import { collectDataIntegrityErrors } from '../../src/lib/dataIntegrity';
import { validateCatalog, validateTimeline } from '../../src/lib/validation';
import type { Timeline } from '../../src/types/history';

describe('authored data integrity', () => {
  it('has no integrity errors anywhere', () => {
    expect(collectDataIntegrityErrors()).toEqual([]);
  });

  it('every Rome event has at least one resolvable source', () => {
    const ids = new Set(romeSources.map((s) => s.id));
    for (const event of romeActualTimeline.events) {
      expect(event.sourceIds.length).toBeGreaterThan(0);
      for (const id of event.sourceIds) expect(ids.has(id)).toBe(true);
    }
  });

  it('keeps the 476 anchor and explains that it is a convention', () => {
    const anchor = romeActualTimeline.events.find((e) => e.role === 'anchor');
    expect(anchor?.date.year).toBe(476);
    expect(anchor?.caveat).toMatch(/conventional/);
  });

  it('flags every contested event with a caveat', () => {
    for (const event of romeActualTimeline.events.filter((e) => e.certainty === 'contested')) {
      expect(event.caveat).toBeTruthy();
    }
  });

  it('has a playable window that starts around 455', () => {
    expect(getCampaign('fall-of-rome')?.period.startYear).toBe(455);
  });
});

describe('validators catch broken data', () => {
  const base: Timeline = {
    id: 't',
    startYear: 400,
    endYear: 500,
    events: [
      { id: 'e1', date: { year: 450, precision: 'year' }, title: 'T', summary: 'S', sourceIds: ['s1'], certainty: 'well-attested', role: 'context' },
    ],
  };
  const sources = [{ id: 's1', title: 'S', citation: 'C', kind: 'reference' as const, url: 'https://example.org' }];

  it('accepts valid data', () => {
    expect(validateTimeline(base, sources)).toEqual([]);
  });

  it('reports unknown sources, missing sources and bad order', () => {
    const broken: Timeline = {
      ...base,
      events: [
        { ...base.events[0]!, id: 'e1', date: { year: 460, precision: 'year' }, sourceIds: ['missing'] },
        { ...base.events[0]!, id: 'e2', date: { year: 450, precision: 'year' }, sourceIds: [] },
      ],
    };
    const errors = validateTimeline(broken, sources).join('\n');
    expect(errors).toMatch(/unknown source "missing"/);
    expect(errors).toMatch(/has no source/);
    expect(errors).toMatch(/chronological/);
  });

  it('reports contested events without a caveat and precision without parts', () => {
    const broken: Timeline = {
      ...base,
      events: [{ ...base.events[0]!, certainty: 'contested', date: { year: 450, precision: 'day' } }],
    };
    const errors = validateTimeline(broken, sources).join('\n');
    expect(errors).toMatch(/caveat/);
    expect(errors).toMatch(/needs month and day/);
  });

  it('reports insecure source URLs and duplicate ids', () => {
    const errors = validateTimeline(
      { ...base, events: [base.events[0]!, base.events[0]!] },
      [...sources, { ...sources[0]!, url: 'http://insecure.example' }],
    ).join('\n');
    expect(errors).toMatch(/duplicate id/);
    expect(errors).toMatch(/https/);
  });

  it('validates the catalog', () => {
    expect(validateCatalog(campaigns)).toEqual([]);
    expect(validateCatalog([{ ...campaigns[0]!, id: 'Bad Id' }, campaigns[0]!, campaigns[0]!]).join('\n')).toMatch(
      /lowercase slug[\s\S]*duplicate/,
    );
  });
});

describe('catalog', () => {
  it('lets only built campaigns be opened', () => {
    expect(isCampaignSelectable(getCampaign('fall-of-rome')!)).toBe(true);
    expect(isCampaignSelectable(getCampaign('napoleon-1815')!)).toBe(false);
    expect(isCampaignSelectable(getCampaign('viking-age-865')!)).toBe(false);
  });

  it('features the Rome campaign and builds its paths', () => {
    expect(getFeaturedCampaign().id).toBe('fall-of-rome');
    expect(workspacePath('fall-of-rome')).toBe('/campaigns/fall-of-rome/workspace');
  });

  it('returns nothing for unknown ids, including prototype keys', () => {
    expect(getCampaign('unknown')).toBeUndefined();
    expect(getCampaignContent('constructor')).toBeUndefined();
    expect(getCampaignContent('__proto__')).toBeUndefined();
  });
});
