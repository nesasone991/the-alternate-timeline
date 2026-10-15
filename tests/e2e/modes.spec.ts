import { expect, test } from '@playwright/test';
import { WORKSPACE } from './helpers';

test('switching between Real History and Alternate History keeps each mode working', async ({ page }) => {
  await page.goto(WORKSPACE);
  const slider = page.getByRole('slider', { name: 'Year' });
  await expect(slider).toHaveValue('455');
  await expect(page.getByRole('heading', { level: 4 })).toHaveText('Emperor Valentinian III is assassinated');
  await page.getByRole('button', { name: 'Next event' }).click();
  await expect(page.getByRole('heading', { level: 4 })).toHaveText('Vandals sack Rome');

  await page.getByRole('tab', { name: /Alternate History/ }).click();
  await expect(page).toHaveURL(/mode=alternate/);
  await expect(page.getByRole('heading', { name: 'Fiscal survival' })).toBeVisible();
  await expect(page.getByText('Fictional alternate history').first()).toBeVisible();

  await page.getByRole('tab', { name: /Real History/ }).click();
  await expect(page).not.toHaveURL(/mode=/);
  await expect(slider).toHaveValue('455');
  await page.getByRole('button', { name: 'Next event' }).click();
  await expect(slider).toHaveValue('461');

  await page.getByRole('tab', { name: /Comparison/ }).click();
  await expect(page.getByText('Comparison is not available yet.')).toBeVisible();
  await expect(slider).toBeDisabled();
});

test('a sourced-context link in a decision opens that event in Real History', async ({ page }) => {
  await page.goto(`${WORKSPACE}?mode=alternate`);
  await page.getByRole('button', { name: '439: Vandals seize Carthage' }).click();
  await expect(page.getByRole('tab', { name: /Real History/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('slider', { name: 'Year' })).toHaveValue('439');
  await expect(page.getByRole('heading', { level: 4 })).toHaveText('Vandals seize Carthage');
});
