import { expect, test, type Page } from '@playwright/test';
import { romeAlternateScenario as rome } from '../../src/data/scenarios/rome/alternate';
import { getNode, replay } from '../../src/features/simulation/engine';
import { buildEndingReport } from '../../src/features/simulation/endings';
import { replayWithEvents, resourceTimeline } from '../../src/features/simulation/storyEvents';
import { RESOURCE_KEYS } from '../../src/types/simulation';
import { SAVE_KEY, expectNoHorizontalOverflow } from './helpers';

const ENDING = '/campaigns/fall-of-rome/ending';

/** One campaign per ending category. Expected values come from the same deterministic replay the app uses. */
const CASES = [
  {
    title: 'Imperial Survival',
    category: 'imperial-survival',
    choices: ['pay-the-armies', 'hold-italy', 'treaty-with-gaiseric', 'bargain-with-regions', 'defend-imperial-office'],
  },
  {
    title: 'Fragmented Survival',
    category: 'fragmented-survival',
    choices: ['reform-taxation', 'settle-federates', 'fortify-what-remains', 'bargain-with-regions', 'transfer-to-successors'],
  },
  {
    title: 'Imperial Collapse',
    category: 'imperial-collapse',
    choices: ['reform-taxation', 'hold-italy', 'treaty-with-gaiseric', 'restore-imperial-authority', 'defend-imperial-office'],
  },
] as const;

function saveFor(choices: readonly string[]): string {
  return JSON.stringify({
    format: 'the-alternate-timeline/save',
    formatVersion: 1,
    scenarioId: 'rome-alternate',
    scenarioVersion: rome.version,
    savedAt: '2026-10-17T10:00:00.000Z',
    choices,
  });
}

/** Seeds the save once per test (not again after the app clears it). */
async function seed(page: Page, choices: readonly string[]) {
  await page.addInitScript(
    ([key, value]) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem(key, value);
        sessionStorage.setItem('seeded', '1');
      }
    },
    [SAVE_KEY, saveFor(choices)] as const,
  );
}

const readSave = (page: Page) => page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY);

for (const ending of CASES) {
  test(`${ending.title}: the ending reflects the actual campaign`, async ({ page }) => {
    const state = replay(rome, ending.choices);
    expect(state.endingId).toBe(ending.category);
    const report = buildEndingReport(rome, state);
    const points = resourceTimeline(rome, ending.choices);

    await seed(page, ending.choices);
    await page.goto(ENDING);

    // The fate of your empire
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(ending.title);
    await expect(page.getByTestId('fate-hero')).toHaveAttribute('data-ending-category', ending.category);
    await expect(page.getByTestId('fate-hero')).toContainText('Fictional alternate history');
    await expect(page.getByTestId('ending-introduction')).toContainText(report.settlement);
    await expect(page.getByTestId('ending-why')).toContainText(report.why);

    // Your empire in 476: final values and every point of each history equal the replay.
    for (const key of RESOURCE_KEYS) {
      await expect(page.getByTestId(`final-${key}`)).toContainText(`${state.resources[key]} / 100`);
      const values = await page
        .getByTestId(`history-${key}`)
        .locator('circle[data-step]')
        .evaluateAll((circles) => circles.map((c) => Number(c.getAttribute('data-value'))));
      expect(values).toEqual(points.map((point) => point.resources[key]));
    }
    await page.getByText('Show every moment as a table').click();
    await expect(page.getByTestId('history-table').locator('tbody tr')).toHaveCount(points.length);

    // The decisions that changed history: all five, in order, with the chosen strategy.
    const articles = page.getByTestId('decision-review').locator('article');
    await expect(articles).toHaveCount(5);
    for (const [index, record] of state.records.entries()) {
      const node = getNode(rome, record.decisionId);
      const label = node?.kind === 'decision' ? node.choices.find((c) => c.id === record.choiceId)?.label : undefined;
      await expect(articles.nth(index).getByRole('heading', { level: 3 })).toHaveText(label!);
    }

    // The world you created.
    await expect(page.getByTestId('world-settlement')).toHaveText(report.settlement);
    await expect(page.getByTestId('world-army')).toContainText(report.army);
    await expect(page.getByTestId('world-constantinople')).toContainText(report.constantinople);
    for (const threat of report.looming) await expect(page.getByTestId('world-threats')).toContainText(threat.hint);

    // What really happened: fiction and sourced history side by side.
    await expect(page.getByTestId('fiction-side')).toContainText(ending.title);
    await expect(page.getByTestId('fiction-side')).toContainText('Fictional alternate history');
    await expect(page.getByTestId('history-side')).toContainText('Sourced history');
    await expect(page.getByTestId('real-odoacer-deposes-romulus-476')).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });
}

test('historical links open the sourced event in Real History', async ({ page }) => {
  await seed(page, CASES[0].choices);
  await page.goto(ENDING);
  await page.getByRole('link', { name: 'Open “Odoacer deposes Romulus Augustulus” in Real History' }).click();
  await expect(page).toHaveURL(/\/workspace\?event=odoacer-deposes-romulus-476$/);
  await expect(page.getByRole('tab', { name: /Real History/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('slider', { name: 'Year' })).toHaveValue('476');
  await expect(page.getByRole('heading', { level: 4 })).toHaveText('Odoacer deposes Romulus Augustulus');
});

test('replay steps through the whole history without changing the saved campaign', async ({ page }) => {
  const choices = CASES[1].choices;
  const { events } = replayWithEvents(rome, choices);
  await seed(page, choices);
  await page.goto(ENDING);
  const before = await readSave(page);

  await page.getByRole('button', { name: 'Replay your decisions' }).click();
  const replayBox = page.getByTestId('replay');
  await expect(replayBox).toContainText(`Step 1 of ${events.length}`);
  await expect(replayBox).toContainText('You chose: Reform taxation');
  for (let step = 2; step <= events.length; step += 1) {
    await page.getByRole('button', { name: 'Next step' }).click();
    await expect(replayBox).toContainText(`Step ${step} of ${events.length}`);
  }
  await expect(page.getByRole('button', { name: 'Next step' })).toBeDisabled();
  await expect(replayBox).toContainText('The campaign ends in Fragmented Survival');
  await page.getByRole('button', { name: 'Previous step' }).click();
  await page.getByRole('button', { name: 'Close the replay' }).click();
  await expect(page.getByRole('button', { name: 'Replay your decisions' })).toBeFocused();

  expect(await readSave(page)).toBe(before);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fragmented Survival');
  expect(await readSave(page)).toBe(before);
});

test('starting a new timeline needs confirmation and resets progress', async ({ page }) => {
  await seed(page, CASES[2].choices);
  await page.goto(ENDING);
  const before = await readSave(page);
  const dialog = page.getByRole('dialog', { name: 'Start a new timeline?' });

  await page.getByRole('button', { name: 'Start a new timeline' }).click();
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Keep this timeline' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(await readSave(page)).toBe(before);

  await page.getByRole('button', { name: 'Start a new timeline' }).click();
  await page.getByRole('button', { name: 'Keep this timeline' }).click();
  await expect(dialog).toBeHidden();
  expect(await readSave(page)).toBe(before);

  await page.getByRole('button', { name: 'Start a new timeline' }).click();
  await page.getByRole('button', { name: 'Erase it and start again' }).click();
  await expect(page).toHaveURL(/\/workspace\?mode=alternate$/);
  await expect(page.getByRole('heading', { name: 'Fiscal survival' })).toBeVisible();
  expect(await readSave(page)).toBeNull();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Fiscal survival' })).toBeVisible();
  await expect(page.getByText('Your progress was restored')).toHaveCount(0);
  await page.goto(ENDING);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('There is no finished campaign here yet');
});

test('responsive at phone, tablet and desktop widths, with 44 px targets and one clear heading outline', async ({ page }) => {
  await seed(page, CASES[0].choices);
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(ENDING);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Imperial Survival');
    await expectNoHorizontalOverflow(page);
    const small = await page
      .getByTestId('ending-experience')
      .locator('button:visible, summary:visible, a.btn:visible, nav a:visible, a[href*="?event="]:visible, input:visible')
      .evaluateAll((elements) =>
        elements
          .map((element) => ({ text: element.textContent?.trim() || element.getAttribute('aria-label'), h: element.getBoundingClientRect().height }))
          .filter((item) => item.h < 44),
      );
    expect(small, `targets under 44 px at ${width}px`).toEqual([]);
  }
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByTestId('ending-experience').getByRole('heading', { level: 2 })).toHaveText([
    'Your empire in 476',
    'The decisions that changed history',
    'The world you created',
    'What really happened',
    'Replay and restart',
  ]);
  // Screen-reader summaries for each chart.
  await expect(page.getByRole('img', { name: /^Economy: started at 40, ended at 26 out of 100/ })).toBeAttached();
});

test('keyboard: the history slider and the restart dialog work without a pointer', async ({ page }) => {
  const points = resourceTimeline(rome, CASES[0].choices);
  await seed(page, CASES[0].choices);
  await page.goto(ENDING);
  const slider = page.getByRole('slider', { name: /^Moment/ });
  await slider.focus();
  await page.keyboard.press('Home');
  await expect(page.getByTestId('history-readout')).toContainText(`Moment 1 of ${points.length}`);
  await expect(page.getByTestId('history-readout')).toContainText(`Economy ${points[0]!.resources.economy}`);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('history-readout')).toContainText(`Moment 2 of ${points.length}`);
  await expect(page.getByTestId('history-readout')).toContainText(points[1]!.label);

  await page.getByRole('button', { name: 'Start a new timeline' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Start a new timeline?' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Start a new timeline?' })).toBeHidden();
});

test('reduced motion: nothing animates', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page, CASES[2].choices);
  await page.goto(ENDING);
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Imperial Collapse');
  await page.waitForTimeout(200);
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
  expect(running).toBe(0);
});
