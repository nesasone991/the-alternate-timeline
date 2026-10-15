import { expect, type Page } from '@playwright/test';

export const WORKSPACE = '/campaigns/fall-of-rome/workspace';
export const SAVE_KEY = 'tat.save.rome-alternate';

/** Clicks a main-navigation link, opening the phone menu first when it is collapsed. */
export async function navigate(page: Page, name: string): Promise<void> {
  const menu = page.getByRole('button', { name: 'Open menu' });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('navigation', { name: 'Main' }).filter({ visible: true }).getByRole('link', { name, exact: true }).click();
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'page scrolls sideways').toBe(0);
}

/** Resource readout in the Statistics panel, e.g. "52 / 100 (+12 since start)". */
export async function expectResource(page: Page, resource: string, value: number): Promise<void> {
  await expect(page.getByTestId(`resource-${resource}`)).toHaveText(new RegExp(`^${value} / 100`));
}

export async function openAlternateWorkspace(page: Page): Promise<void> {
  await page.goto(`${WORKSPACE}?mode=alternate`);
  await expect(page.getByTestId('decision-panel')).toBeVisible();
}

export async function decide(page: Page, choiceLabel: string): Promise<void> {
  await page.getByRole('radio', { name: choiceLabel }).check();
  await page.getByRole('button', { name: 'Confirm decision' }).click();
}
