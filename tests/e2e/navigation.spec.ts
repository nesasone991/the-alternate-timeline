import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, navigate } from './helpers';

test('home → explore → campaign overview → workspace', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Alternate Timeline');
  await expectNoHorizontalOverflow(page);

  await navigate(page, 'Explore History');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Explore History');
  await expectNoHorizontalOverflow(page);

  // Coming-soon campaigns are visible but cannot be opened.
  const napoleon = page.getByRole('article', { name: 'Napoleon' });
  await expect(napoleon).toContainText('Not yet available');
  await expect(napoleon.getByRole('link')).toHaveCount(0);
  await expect(napoleon.getByRole('button')).toHaveCount(0);

  await page.getByRole('article', { name: 'The Fall of Rome' }).getByRole('link', { name: 'Explore campaign' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('The Fall of Rome');
  await expect(page.getByText('Odoacer deposes Romulus Augustulus').first()).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole('link', { name: 'Open the workspace' }).click();
  await expect(page).toHaveURL(/\/campaigns\/fall-of-rome\/workspace$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Fall of Rome');
  await expectNoHorizontalOverflow(page);
});

test('every header page loads, and deep links work on refresh', async ({ page }) => {
  await page.goto('/');
  for (const [link, heading] of [
    ['How It Works', 'How It Works'],
    ['About', 'About'],
    ['Home', 'The Alternate Timeline'],
  ] as const) {
    await navigate(page, link);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
  }
  await page.goto('/campaigns/fall-of-rome');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('The Fall of Rome');
  await page.goto('/campaigns/atlantis');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
});

test('controls are comfortable touch targets', async ({ page }) => {
  await page.goto('/campaigns/fall-of-rome/workspace?mode=alternate');
  await expect(page.getByTestId('decision-panel')).toBeVisible();
  const small = await page.locator('.btn:visible, .icon-btn:visible, [role="tab"]:visible').evaluateAll((elements) =>
    elements
      .map((element) => ({ text: element.textContent?.trim() || element.getAttribute('aria-label'), h: element.getBoundingClientRect().height }))
      .filter((item) => item.h < 44),
  );
  expect(small).toEqual([]);
});
