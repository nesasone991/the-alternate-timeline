import type { CampaignSummary } from '../types/campaign';
import type { Source, Timeline } from '../types/history';

/**
 * Integrity checks for authored data. They run in the unit tests and, in
 * development builds, on startup — so a broken source reference or an
 * out-of-order event is caught before anyone sees it.
 */

export function validateTimeline(timeline: Timeline, sources: readonly Source[]): string[] {
  const errors: string[] = [];
  const sourceIds = new Set(sources.map((s) => s.id));
  const seen = new Set<string>();
  let previousYear = -Infinity;

  if (timeline.startYear > timeline.endYear) {
    errors.push(`Timeline ${timeline.id}: startYear is after endYear.`);
  }

  for (const event of timeline.events) {
    const label = `Event ${event.id}`;
    if (seen.has(event.id)) errors.push(`${label}: duplicate id.`);
    seen.add(event.id);

    if (event.sourceIds.length === 0) errors.push(`${label}: has no source.`);
    for (const sourceId of event.sourceIds) {
      if (!sourceIds.has(sourceId)) errors.push(`${label}: unknown source "${sourceId}".`);
    }

    const { year, month, day, precision } = event.date;
    if (year < timeline.startYear || year > timeline.endYear) {
      errors.push(`${label}: year ${year} is outside ${timeline.startYear}–${timeline.endYear}.`);
    }
    if (year < previousYear) errors.push(`${label}: events are not in chronological order.`);
    previousYear = year;

    if (precision === 'day' && (month === undefined || day === undefined)) {
      errors.push(`${label}: precision "day" needs month and day.`);
    }
    if (precision === 'month' && month === undefined) {
      errors.push(`${label}: precision "month" needs a month.`);
    }
    if (month !== undefined && (month < 1 || month > 12)) errors.push(`${label}: invalid month.`);
    if (day !== undefined && (day < 1 || day > 31)) errors.push(`${label}: invalid day.`);

    if (event.certainty === 'contested' && !event.caveat) {
      errors.push(`${label}: contested events must explain the dispute in a caveat.`);
    }
    if (!event.title.trim() || !event.summary.trim()) errors.push(`${label}: title and summary are required.`);
  }

  const sourceSeen = new Set<string>();
  for (const source of sources) {
    if (sourceSeen.has(source.id)) errors.push(`Source ${source.id}: duplicate id.`);
    sourceSeen.add(source.id);
    if (source.url && !source.url.startsWith('https://')) {
      errors.push(`Source ${source.id}: URLs must use https.`);
    }
  }

  return errors;
}

export function validateCatalog(catalog: readonly CampaignSummary[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const campaign of catalog) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(campaign.id)) {
      errors.push(`Campaign ${campaign.id}: id must be a lowercase slug.`);
    }
    if (seen.has(campaign.id)) errors.push(`Campaign ${campaign.id}: duplicate id.`);
    seen.add(campaign.id);
    if (campaign.period.startYear > campaign.period.endYear) {
      errors.push(`Campaign ${campaign.id}: period starts after it ends.`);
    }
    if (!campaign.disclaimer.trim()) errors.push(`Campaign ${campaign.id}: disclaimer is required.`);
  }
  return errors;
}
