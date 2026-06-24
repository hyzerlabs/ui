import { expect, test } from '@playwright/test';

/**
 * R7: docs landing page loads, <h1> is visible, skip link is focusable
 * as the first tab stop.
 */
test.describe('landing page — R7', () => {
	test('has a visible <h1>', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('h1')).toContainText('@hyzer-labs/ui');
	});

	test('skip-to-content link is the first focusable element', async ({ page }) => {
		await page.goto('/');
		await page.keyboard.press('Tab');
		const focused = page.locator(':focus');
		await expect(focused).toHaveAttribute('href', '#main-content');
	});

	test('skip-to-content link becomes visible on focus', async ({ page }) => {
		await page.goto('/');
		await page.keyboard.press('Tab');
		const skipLink = page.locator('a[href="#main-content"]');
		await expect(skipLink).toBeVisible();
	});
});

/**
 * R-Responsive: page has no horizontal overflow at 375px, 768px, and 1280px viewports.
 */
const viewports = [
	{ name: 'mobile (375px)', width: 375, height: 812 },
	{ name: 'tablet (768px)', width: 768, height: 1024 },
	{ name: 'desktop (1280px)', width: 1280, height: 800 }
];

for (const vp of viewports) {
	test(`no horizontal overflow at ${vp.name}`, async ({ page }) => {
		await page.setViewportSize({ width: vp.width, height: vp.height });
		await page.goto('/');

		const hasHorizontalOverflow = await page.evaluate(() => {
			return document.documentElement.scrollWidth > document.documentElement.clientWidth;
		});
		expect(hasHorizontalOverflow).toBe(false);
	});
}
