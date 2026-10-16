import { expect, test } from '@playwright/test';
import { SAVE_KEY, decide, expectNoHorizontalOverflow, expectResource, openAlternateWorkspace } from './helpers';

test('play all five decisions to an ending, refresh to restore, then start over', async ({ page }) => {
  await openAlternateWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Fiscal survival' })).toBeVisible();
  await expect(page.getByTestId('order-of-events')).toContainText('Nothing from earlier decisions is due yet.');
  await expectResource(page, 'economy', 40);

  // Decision 1: pay the armies first (economy 40 → 28, then −3 on arrival in 459 → 25).
  await decide(page, 'Pay the armies first');
  await expect(page.getByRole('heading', { name: 'Border defence' })).toBeVisible();
  const carried = page.getByTestId('carried-over');
  await expect(carried).toContainText('You chose: Pay the armies first');
  await expect(carried).toContainText('Why:');
  await expect(page.getByTestId('arrived-consequences')).toContainText(
    'The armies’ pay had to be found again, at further cost to the treasury.',
  );
  await expect(page.getByTestId('order-of-events')).toContainText('1 has arrived');
  await expectResource(page, 'economy', 25);
  await expectResource(page, 'military', 59);

  // The D1 choice visibly shapes D2.
  await expect(page.getByRole('radio', { name: /Fund a mobile field army/ })).toBeDisabled();
  await expect(page.getByText('Not available: Economy 30 or more (you have 25)')).toBeVisible();
  await expect(page.getByText(/^Because you paid the armies first/)).toBeVisible();
  await expectNoHorizontalOverflow(page);

  // Decision 2: concentrate the armies in Italy. The 468 consequence (provinces drift, unity −6)
  // resolves on arrival, BEFORE Decision 3 is shown, and is already in the numbers.
  await decide(page, 'Concentrate the armies in Italy');
  await expect(page.getByRole('heading', { name: 'North African policy' })).toBeVisible();
  await expect(page.getByTestId('order-of-events')).toContainText('Order of events in c. 468');
  await expect(page.getByTestId('order-of-events')).toContainText('The statistics already include them.');
  await expect(page.getByTestId('arrived-consequences')).toContainText(
    'Years without imperial armies beyond the Alps loosened the provinces’ loyalty to the court.',
  );
  await expectResource(page, 'economy', 25);
  await expectResource(page, 'military', 67);
  await expectResource(page, 'unity', 21);
  await expectResource(page, 'legitimacy', 39);
  await expect(page.getByRole('button', { name: '442: ' })).toBeVisible();
  // D2 shapes D3: garrisoned coasts improve the treaty; a strong army secures the islands.
  await expect(page.getByText(/^Because Italy’s coasts are garrisoned/)).toBeVisible();
  await expect(page.getByText(/^Because your army is strong enough to spare a second force/)).toBeVisible();
  await expectNoHorizontalOverflow(page);

  // Decision 3: join the expedition (economy −12 +5, military −6, legitimacy +6 → 18/61/21/45),
  // then the expedition's debts fall due in 472 (economy −5) BEFORE Decision 4 is shown.
  await decide(page, 'Join the eastern expedition against Carthage');
  await expect(page.getByRole('heading', { name: 'Imperial legitimacy' })).toBeVisible();
  await expect(page.getByTestId('order-of-events')).toContainText('Order of events in c. 472');
  await expect(page.getByTestId('order-of-events')).toContainText('1 has arrived');
  await expect(page.getByTestId('arrived-consequences')).toContainText('Debts from the expedition fell due');
  const d3Report = page.getByTestId('narrative-report');
  await expect(d3Report).toContainText('not sourced history');
  await expect(d3Report).toContainText('You ordered the western fleet');
  await expect(d3Report).toContainText('secured the islands near Italy');
  await expect(d3Report).toContainText('Risks that remain');
  await expectResource(page, 'economy', 13);
  await expectResource(page, 'military', 61);
  await expectResource(page, 'unity', 21);
  await expectResource(page, 'legitimacy', 45);
  await expect(page.getByRole('button', { name: '472: Ricimer overthrows Anthemius' })).toBeVisible();
  // D3 shapes D4, and the near-empty treasury changes what the bargain offers.
  await expect(page.getByText(/^Because the West sailed with the eastern expedition, Constantinople publicly backs/)).toBeVisible();
  await expect(page.getByText(/^Because the treasury is all but empty, the great landowners lend/)).toBeVisible();
  await expectNoHorizontalOverflow(page);

  // Decision 4: restore the emperor's authority (economy +5, legitimacy +8 +3, unity −7, military −4).
  // Then 475: loyal officials collect more (legitimacy 56 ≥ 35, economy +4), BEFORE Decision 5 is shown.
  await decide(page, 'Restore the emperor’s authority');
  await expect(page.getByRole('heading', { name: 'The final crisis' })).toBeVisible();
  await expect(page.getByTestId('carried-over')).toContainText('You chose: Restore the emperor’s authority');
  const d4Report = page.getByTestId('narrative-report');
  await expect(d4Report).toContainText('The political situation');
  await expect(page.getByTestId('situation-notes')).toContainText('sailed with the eastern expedition');
  await expect(d4Report).toContainText('Who gains and who loses influence');
  await expect(d4Report).toContainText('Constantinople’s public support');
  await expect(d4Report).toContainText('already divided');
  await expect(page.getByTestId('arrived-consequences')).toContainText('its new officials collected taxes more faithfully');
  await expect(page.getByTestId('order-of-events')).toContainText('Order of events in c. 475');
  await expect(page.getByTestId('order-of-events')).toContainText('Then the settlement of c. 476');
  await expectResource(page, 'economy', 22);
  await expectResource(page, 'military', 57);
  await expectResource(page, 'unity', 14);
  await expectResource(page, 'legitimacy', 56);
  await expect(page.getByRole('button', { name: '474: Julius Nepos, sent from Constantinople, replaces Glycerius' })).toBeVisible();
  // D4 shapes D5.
  await expect(page.getByText(/^Because you restored the emperor’s authority, loyal officials raise and pay troops/)).toBeVisible();
  await expectNoHorizontalOverflow(page);

  // Decision 5: defend the office. The loyal army wins (military 53 ≥ 45), but the empire is too divided:
  // in 476 the provinces that lost power refuse orders, and unity ends at 9 → Imperial Collapse.
  await decide(page, 'Defend the imperial office by force');
  await expect(page.getByRole('heading', { name: 'You chose: Defend the imperial office by force' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The settlement of 476' })).toBeVisible();
  const arrived = page.getByTestId('arrived-consequences');
  await expect(arrived).toContainText('The loyal army won decisively');
  await expect(arrived).toContainText('refused the court’s orders');
  const result = page.getByTestId('ending-result');
  await expect(result).toContainText('fictional alternate history');
  await expect(result).toContainText('Imperial Collapse');
  await expect(result).toContainText('Neither the imperial office nor a successor order');
  await expect(page.getByTestId('pending-consequences')).toContainText('Still unresolved after the settlement');
  await expectResource(page, 'economy', 13);
  await expectResource(page, 'military', 47);
  await expectResource(page, 'unity', 9);
  await expectResource(page, 'legitimacy', 70);
  await expectNoHorizontalOverflow(page);

  const saved = await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY);
  expect(JSON.parse(saved ?? '{}')).toMatchObject({
    scenarioVersion: 5,
    choices: ['pay-the-armies', 'hold-italy', 'join-expedition', 'restore-imperial-authority', 'defend-imperial-office'],
  });

  // Refresh: progress comes back, exactly, including the ending.
  await page.reload();
  await expect(page.getByText('Your progress was restored from this browser')).toBeVisible();
  await expect(page.getByTestId('ending-result')).toContainText('Imperial Collapse');
  await expectResource(page, 'unity', 9);
  await expectResource(page, 'legitimacy', 70);

  // Start over clears the save; another refresh stays fresh.
  await page.getByRole('button', { name: 'Start over' }).click();
  await expect(page.getByRole('heading', { name: 'Fiscal survival' })).toBeVisible();
  await expectResource(page, 'economy', 40);
  expect(await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY)).toBeNull();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Fiscal survival' })).toBeVisible();
  await expect(page.getByText('Your progress was restored')).toHaveCount(0);
});

test('a decision 3 option blocked by earlier choices explains why', async ({ page }) => {
  await openAlternateWorkspace(page);
  await decide(page, 'Reform taxation');
  await decide(page, 'Concentrate the armies in Italy');
  await expect(page.getByRole('heading', { name: 'North African policy' })).toBeVisible();
  // Here the landowners' resentment lapsed (legitimacy 29 is not below 28): shown, with no effect.
  await expect(page.getByTestId('arrived-consequences')).toContainText('never turned into open opposition');
  await expect(page.getByTestId('arrived-consequences')).toContainText('No effect.');
  await expect(page.getByRole('radio', { name: /Join the eastern expedition/ })).toBeDisabled();
  await expect(page.getByText('Not available: Military 50 or more (you have 49)')).toBeVisible();
  await decide(page, 'Negotiate a treaty with Gaiseric');
  await expect(page.getByTestId('narrative-report')).toContainText('Garrisoned coasts gave your envoys leverage');
  // In 472 the treaty does not hold: Military 49 is below 50. Shown, with no effect.
  await expect(page.getByTestId('arrived-consequences')).toContainText('soon ignored the treaty');
  await expectResource(page, 'economy', 68);
  await expectResource(page, 'legitimacy', 17);
  await expect(page.getByRole('radio', { name: /Rule through the army’s commander/ })).toBeDisabled();
  await expect(page.getByText('Not available: Military 50 or more (you have 49)')).toBeVisible();
});

test('an empty treasury: unpaid costs are shown and charged, and a way forward remains', async ({ page }) => {
  await openAlternateWorkspace(page);
  await decide(page, 'Let the provinces keep a share');
  await decide(page, 'Fund a mobile field army');
  await decide(page, 'Join the eastern expedition against Carthage');
  await expect(page.getByRole('heading', { name: 'Imperial legitimacy' })).toBeVisible();
  // The expedition's debts (−5) find only 1 in the treasury; the other 4 fall on the provinces (unity −2).
  await expectResource(page, 'economy', 0);
  await expectResource(page, 'unity', 47);
  const arrived = page.getByTestId('arrived-consequences');
  await expect(arrived).toContainText('only 1 of 5 could be paid');
  await expect(arrived).toContainText('Could not be paid in full: 4 Economy');
  await expect(arrived).toContainText('seizing goods and labour from the provinces');
  await expect(page.getByTestId('carried-over')).toContainText('The treasury failed to pay its obligations');
  await expect(page.getByRole('radio', { name: /Restore the emperor’s authority/ })).toBeDisabled();
  await expect(page.getByText('Not available: Economy 10 or more (you have 0)')).toBeVisible();
  // Ruling through the commander would cost money the treasury does not have: shown before choosing.
  await expect(page.getByTestId('projected-unpaid')).toContainText('Cannot be paid in full: 5 Economy');

  await decide(page, 'Strike a bargain with the regional powers');
  await expect(page.getByRole('heading', { name: 'The final crisis' })).toBeVisible();
  await expectResource(page, 'economy', 4);
  await expectResource(page, 'military', 52);
  await expectResource(page, 'legitimacy', 37);
  const report = page.getByTestId('narrative-report');
  await expect(report).toContainText('The treasury is all but empty');
  await expect(report).toContainText('right to collect local taxes in exchange for loans');
  await expect(page.getByTestId('situation-notes').last()).toBeVisible();

  // Even after a default, the empire can come through: defend the office → Fragmented Survival.
  await decide(page, 'Defend the imperial office by force');
  await expect(page.getByTestId('ending-result')).toContainText('Fragmented Survival');
  await expectNoHorizontalOverflow(page);
});

test('Imperial Survival is reachable: a strong army, a kept bargain and a defended throne', async ({ page }) => {
  await openAlternateWorkspace(page);
  for (const choice of [
    'Pay the armies first',
    'Concentrate the armies in Italy',
    'Negotiate a treaty with Gaiseric',
    'Strike a bargain with the regional powers',
    'Defend the imperial office by force',
  ]) {
    await decide(page, choice);
  }
  const result = page.getByTestId('ending-result');
  await expect(result).toContainText('Imperial Survival');
  await expect(result).toContainText('Legitimacy 35 or more (you have 45)');
  await expectResource(page, 'economy', 26);
  await expectResource(page, 'military', 63);
  await expectResource(page, 'unity', 29);
  await expectResource(page, 'legitimacy', 45);
});

test('Fragmented Survival through successors: the office lapses, the federation holds', async ({ page }) => {
  await openAlternateWorkspace(page);
  for (const choice of [
    'Reform taxation',
    'Settle allies as federates',
    'Give up Africa and fortify what remains',
    'Strike a bargain with the regional powers',
    'Hand government to successor rulers under Constantinople',
  ]) {
    await decide(page, choice);
  }
  const result = page.getByTestId('ending-result');
  await expect(result).toContainText('Fragmented Survival');
  await expect(result).toContainText('the successor rulers held together');
  await expectResource(page, 'unity', 54);
  await expectResource(page, 'legitimacy', 6);
});

test('changing your mind before confirming changes nothing', async ({ page }) => {
  await openAlternateWorkspace(page);
  await page.getByRole('radio', { name: 'Pay the armies first' }).check();
  await expect(page.getByText('If you confirm now')).toBeVisible();
  await page.getByRole('radio', { name: 'Reform taxation' }).check();
  await expectResource(page, 'economy', 40);
  await page.getByRole('button', { name: 'Confirm decision' }).click();
  await expect(page.getByTestId('carried-over')).toContainText('You chose: Reform taxation');
  await expectResource(page, 'economy', 56);
});

test('a damaged save is reported, kept until discarded, and never breaks the page', async ({ page }) => {
  await page.addInitScript((key) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem(key, '{"format":"the-alternate-timeline/save", broken');
      sessionStorage.setItem('seeded', '1');
    }
  }, SAVE_KEY);
  await openAlternateWorkspace(page);
  await expect(page.getByRole('alert')).toContainText('Your saved game could not be loaded.');
  await expect(page.getByRole('heading', { name: 'Fiscal survival' })).toBeVisible();
  expect(await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY)).not.toBeNull();

  await page.getByRole('button', { name: 'Discard saved game' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY)).toBeNull();
  await page.reload();
  await expect(page.getByText('Your saved game could not be loaded.')).toHaveCount(0);
});

test('a version 4 save is refused with a plain explanation of what changed', async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        format: 'the-alternate-timeline/save',
        formatVersion: 1,
        scenarioId: 'rome-alternate',
        scenarioVersion: 4,
        savedAt: '2026-10-15T20:00:00.000Z',
        choices: ['pay-the-armies', 'hold-italy', 'join-expedition', 'restore-imperial-authority'],
      }),
    );
  }, SAVE_KEY);
  await openAlternateWorkspace(page);
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('earlier version of this campaign (version 4; this is version 5)');
  await expect(alert).toContainText('Version 5: Decision 5, the final crisis');
  await expect(page.getByRole('heading', { name: 'Fiscal survival' })).toBeVisible();
  await expectResource(page, 'economy', 40);
});

test('decisions can be made with the keyboard alone', async ({ page }) => {
  await openAlternateWorkspace(page);
  await page.getByRole('radio', { name: 'Reform taxation' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio', { name: 'Let the provinces keep a share' })).toBeChecked();
  await page.getByRole('button', { name: 'Confirm decision' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Border defence' })).toBeVisible();
  await expect(page.getByText(/^Because the provinces already keep a share/)).toBeVisible();
  await expectResource(page, 'unity', 45);
});
