import { expect, test } from '@playwright/test';
import { SAVE_KEY, decide, expectNoHorizontalOverflow, expectResource, openAlternateWorkspace } from './helpers';

test('complete decisions 1 and 2, refresh to restore, then start over', async ({ page }) => {
  await openAlternateWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Fiscal survival' })).toBeVisible();
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
  await expectResource(page, 'economy', 25);
  await expectResource(page, 'military', 59);

  // The D1 choice visibly shapes D2.
  await expect(page.getByRole('radio', { name: /Fund a mobile field army/ })).toBeDisabled();
  await expect(page.getByText('Not available: Economy 30 or more (you have 25)')).toBeVisible();
  await expect(page.getByText(/^Because you paid the armies first/)).toBeVisible();
  await expectNoHorizontalOverflow(page);

  // Decision 2: concentrate the armies in Italy (military +4, +4 because the troops were already paid).
  await decide(page, 'Concentrate the armies in Italy');
  await expect(page.getByRole('heading', { name: 'You chose: Concentrate the armies in Italy' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Next: North African policy, c. 461–468' })).toBeVisible();
  await expect(page.getByTestId('pending-consequences')).toContainText('Provinces without imperial troops may drift');
  await expectResource(page, 'economy', 25);
  await expectResource(page, 'military', 67);
  await expectResource(page, 'unity', 27);
  await expectResource(page, 'legitimacy', 39);

  const saved = await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY);
  expect(JSON.parse(saved ?? '{}').choices).toEqual(['pay-the-armies', 'hold-italy']);

  // Refresh: progress comes back, exactly.
  await page.reload();
  await expect(page.getByText('Your progress was restored from this browser')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'You chose: Concentrate the armies in Italy' })).toBeVisible();
  await expectResource(page, 'military', 67);
  await expectResource(page, 'legitimacy', 39);

  // Start over clears the save; another refresh stays fresh.
  await page.getByRole('button', { name: 'Start over' }).click();
  await expect(page.getByRole('heading', { name: 'Fiscal survival' })).toBeVisible();
  await expectResource(page, 'economy', 40);
  expect(await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY)).toBeNull();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Fiscal survival' })).toBeVisible();
  await expect(page.getByText('Your progress was restored')).toHaveCount(0);
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

test('a save from an older campaign version is refused with a reason', async ({ page }) => {
  await page.addInitScript((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        format: 'the-alternate-timeline/save',
        formatVersion: 1,
        scenarioId: 'rome-alternate',
        scenarioVersion: 1,
        savedAt: '2026-10-15T20:00:00.000Z',
        choices: ['reform-taxation'],
      }),
    );
  }, SAVE_KEY);
  await openAlternateWorkspace(page);
  await expect(page.getByRole('alert')).toContainText('earlier version of this campaign');
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
