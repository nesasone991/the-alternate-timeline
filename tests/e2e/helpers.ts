import { expect, type Page } from '@playwright/test';

export const WORKSPACE = '/campaigns/fall-of-rome/workspace';
export const SAVE_KEY = 'tat.save.rome-alternate';

/** Clicks a main-navigation link, opening the phone menu first when it is collapsed. */
export async function navigate(page: Page, name: string): Promise<void> {
  // The phone-layout menu toggle; hidden on desktop.
  const toggle = page.locator('button[aria-controls="mobile-menu"]');
  if (await toggle.isVisible()) {
    // Wait for the menu to be closed after the previous navigation before opening it,
    // rather than sampling its state once (which raced with the close on slow runners).
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  }
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
