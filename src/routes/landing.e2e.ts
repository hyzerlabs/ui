import { expect, test } from '@playwright/test';

/**
 * The marketing landing page at `/` (specs/53 R2) — rendered WITHOUT the docs
 * shell, so it carries its own skip link, header and single <h1>.
 */
test.describe('landing page — specs/53 R2', () => {
	test('has a visible <h1>', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('h1')).toContainText('Components that ship behavior');
	});

	test('renders without the docs shell', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.docs-sidebar')).toHaveCount(0);
		await expect(page.locator('.docs-toc-rail')).toHaveCount(0);
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

	test('the primary action opens the docs, which DO have the shell', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: 'Get started' }).click();
		await expect(page).toHaveURL(/\/docs$/);
		await expect(page.locator('.docs-sidebar')).toBeVisible();
	});

	test('the theme toggle works here too, outside the docs shell', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: /theme/i }).click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/);
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
	test(`landing has no horizontal overflow at ${vp.name}`, async ({ page }) => {
		await page.setViewportSize({ width: vp.width, height: vp.height });
		await page.goto('/');

		const hasHorizontalOverflow = await page.evaluate(() => {
			return document.documentElement.scrollWidth > document.documentElement.clientWidth;
		});
		expect(hasHorizontalOverflow).toBe(false);
	});
}

/** The llms.txt index, generated from the manifest (specs/53 R9). */
test.describe('llms.txt', () => {
	test('serves a plain-text index with absolute URLs', async ({ request }) => {
		const res = await request.get('/llms.txt');
		expect(res.status()).toBe(200);
		const body = await res.text();
		expect(body).toContain('# @hyzer-labs/ui');
		expect(body).toContain('](https://design.hyzer.sh/docs)');
		expect(body).toContain('## Components');
	});
});
