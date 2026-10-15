import { expect, test } from '@playwright/test';
import { SAVE_KEY, decide, expectNoHorizontalOverflow, expectResource, openAlternateWorkspace } from './helpers';

test('complete decisions 1 to 3, refresh to restore, then start over', async ({ page }) => {
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

  // Decision 3: join the expedition (economy −12 +5, military −6, legitimacy +6).
  await decide(page, 'Join the eastern expedition against Carthage');
  await expect(page.getByRole('heading', { name: 'You chose: Join the eastern expedition against Carthage' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Next: imperial legitimacy, c. 470–474' })).toBeVisible();
  const report = page.getByTestId('narrative-report');
  await expect(report).toContainText('not sourced history');
  await expect(report).toContainText('You ordered the western fleet');
  await expect(report).toContainText('secured the islands near Italy');
  await expect(report).toContainText('Gains');
  await expect(report).toContainText('Loses');
  await expect(report).toContainText('Still uncertain');
  await expect(page.getByTestId('pending-consequences')).toContainText('A campaign on this scale leaves debts');
  await expectResource(page, 'economy', 18);
  await expectResource(page, 'military', 61);
  await expectResource(page, 'unity', 21);
  await expectResource(page, 'legitimacy', 45);
  await expectNoHorizontalOverflow(page);

  const saved = await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY);
  expect(JSON.parse(saved ?? '{}')).toMatchObject({
    scenarioVersion: 3,
    choices: ['pay-the-armies', 'hold-italy', 'join-expedition'],
  });

  // Refresh: progress comes back, exactly, including the report.
  await page.reload();
  await expect(page.getByText('Your progress was restored from this browser')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'You chose: Join the eastern expedition against Carthage' })).toBeVisible();
  await expect(page.getByTestId('narrative-report')).toContainText('secured the islands near Italy');
  await expectResource(page, 'economy', 18);
  await expectResource(page, 'legitimacy', 45);

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
  await expectResource(page, 'economy', 68);
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

test('a version 2 save is refused with a plain explanation of what changed', async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        format: 'the-alternate-timeline/save',
        formatVersion: 1,
        scenarioId: 'rome-alternate',
        scenarioVersion: 2,
        savedAt: '2026-10-15T20:00:00.000Z',
        choices: ['reform-taxation', 'field-army'],
      }),
    );
  }, SAVE_KEY);
  await openAlternateWorkspace(page);
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('earlier version of this campaign (version 2; this is version 3)');
  await expect(alert).toContainText('Version 3: Decision 3, North African policy');
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
