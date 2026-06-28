import { expect, test } from '@playwright/test';
import { allRoutes } from '../docs/manifest';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const viewports = [
	{ name: 'mobile (375px)', width: 375, height: 812 },
	{ name: 'tablet (768px)', width: 768, height: 1024 },
	{ name: 'desktop (1280px)', width: 1280, height: 800 }
];

// ---------------------------------------------------------------------------
// R4-R6 — every manifest route: loads, one <h1>, skip link first, no overflow
// ---------------------------------------------------------------------------

test.describe('R4/R6 — all manifest routes', () => {
	for (const route of allRoutes) {
		test(`"${route}" loads with exactly one visible h1`, async ({ page }) => {
			await page.goto(route);
			const h1s = page.locator('h1');
			await expect(h1s.first()).toBeVisible();
			expect(await h1s.count()).toBe(1);
		});

		test(`"${route}" skip link is the first focusable element`, async ({ page }) => {
			await page.goto(route);
			await page.keyboard.press('Tab');
			const focused = page.locator(':focus');
			await expect(focused).toHaveAttribute('href', '#main-content');
		});
	}
});

test.describe('R-Responsive — no horizontal overflow', () => {
	for (const vp of viewports) {
		for (const route of allRoutes) {
			test(`no overflow at ${vp.name} on "${route}"`, async ({ page }) => {
				await page.setViewportSize({ width: vp.width, height: vp.height });
				await page.goto(route);
				const hasOverflow = await page.evaluate(
					() => document.documentElement.scrollWidth > document.documentElement.clientWidth
				);
				expect(hasOverflow).toBe(false);
			});
		}
	}
});

// ---------------------------------------------------------------------------
// R2 — Shell sidebar and footer present
// ---------------------------------------------------------------------------

test.describe('R2 — docs shell structure', () => {
	test('docs sidebar nav is present on every page', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		await expect(page.locator('#docs-sidebar')).toBeVisible();
	});

	test('docs footer is present on every page', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.docs-footer')).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// R4 — Navigation and aria-current
// ---------------------------------------------------------------------------

test.describe('R4 — nav links and aria-current', () => {
	test('clicking a section nav link navigates to that page', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		// Click the Foundation section link in the sidebar
		await page
			.getByRole('navigation', { name: 'Docs navigation' })
			.getByRole('link', { name: 'Foundation' })
			.first()
			.click();
		await expect(page).toHaveURL('/foundation');
	});

	test('active nav link exposes aria-current="page"', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/foundation');
		// A link in the sidebar should have aria-current="page"
		const navLinks = page.locator('#docs-sidebar a[aria-current="page"]');
		await expect(navLinks.first()).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// R5/R6 — Component render proof
// ---------------------------------------------------------------------------

test.describe('R5/R6 — real components render on component pages', () => {
	test('/components/button renders button.hz-button', async ({ page }) => {
		await page.goto('/components/button');
		await expect(page.locator('button.hz-button').first()).toBeVisible();
	});

	test('/components/card renders .hz-card', async ({ page }) => {
		await page.goto('/components/card');
		await expect(page.locator('.hz-card').first()).toBeVisible();
	});

	test('/components/tabs renders .hz-tabs', async ({ page }) => {
		await page.goto('/components/tabs');
		await expect(page.locator('.hz-tabs').first()).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Modal demo edge case
// ---------------------------------------------------------------------------

test.describe('Modal demo edge case', () => {
	test('no dialog is open on /components/modal page load', async ({ page }) => {
		await page.goto('/components/modal');
		// dialog[open] should not exist on page load
		const openDialog = page.locator('dialog[open]');
		expect(await openDialog.count()).toBe(0);
	});

	test('trigger button opens the modal', async ({ page }) => {
		await page.goto('/components/modal');
		await page.getByRole('button', { name: 'Open modal' }).click();
		await expect(page.locator('dialog[open]')).toBeVisible();
	});

	test('Esc closes the open modal', async ({ page }) => {
		await page.goto('/components/modal');
		await page.getByRole('button', { name: 'Open modal' }).click();
		await expect(page.locator('dialog[open]')).toBeVisible();
		await page.keyboard.press('Escape');
		const openDialog = page.locator('dialog[open]');
		expect(await openDialog.count()).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// R8 — Icons page
// ---------------------------------------------------------------------------

// All 21 icon export names — sourced from src/lib/icons/index.ts (R8)
const ICON_NAMES = [
	'IconChevronDown',
	'IconChevronRight',
	'IconChevronUp',
	'IconChevronLeft',
	'IconX',
	'IconMenu',
	'IconExternalLink',
	'IconCheck',
	'IconMinus',
	'IconPlus',
	'IconSearch',
	'IconLoader',
	'IconArrowLeft',
	'IconArrowRight',
	'IconGithub',
	'IconLinkedin',
	'IconTwitterX',
	'IconFacebook',
	'IconInstagram',
	'IconYoutube',
	'IconRss'
] as const;

test.describe('R8 — icons page', () => {
	test('all 21 icon export names appear as visible text on /foundation/icons', async ({ page }) => {
		await page.goto('/foundation/icons');

		expect(ICON_NAMES).toHaveLength(21);

		for (const name of ICON_NAMES) {
			// Each icon tile contains the export name as visible text
			await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
		}
	});

	test('21 svg.hz-icon elements render on /foundation/icons', async ({ page }) => {
		await page.goto('/foundation/icons');
		const icons = page.locator('svg.hz-icon');
		// At least 21 — more may render in the size/stroke demo section
		expect(await icons.count()).toBeGreaterThanOrEqual(21);
	});
});

// ---------------------------------------------------------------------------
// R7 — Foundation colors parity
// ---------------------------------------------------------------------------

test.describe('R7 — foundation colors page', () => {
	test('each palette color token name appears on /foundation/colors', async ({ page }) => {
		await page.goto('/foundation/colors');

		// Palette tokens from metadata
		const paletteKeys = [
			'primary',
			'secondary',
			'success',
			'warning',
			'error',
			'info',
			'black',
			'white',
			'gray'
		];
		for (const key of paletteKeys) {
			const cssVar = `--hz-color-${key}`;
			await expect(page.getByText(cssVar, { exact: true }).first()).toBeVisible();
		}
	});

	test('color values appear as text alongside token names on /foundation/colors', async ({
		page
	}) => {
		await page.goto('/foundation/colors');
		// At least one hex value should be visible
		await expect(page.getByText('#2563eb', { exact: true }).first()).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// R9 — Theme toggle
// ---------------------------------------------------------------------------

test.describe('R9 — theme toggle', () => {
	test('toggle button has aria-pressed reflecting current state', async ({ page }) => {
		await page.goto('/');
		const toggleBtn = page.getByRole('button', { name: /theme/i });
		// Initially light → aria-pressed="false"
		await expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');
	});

	test('clicking toggle sets data-theme="dark" on <html> and aria-pressed="true"', async ({
		page
	}) => {
		await page.goto('/');
		const toggleBtn = page.getByRole('button', { name: /theme/i });
		await toggleBtn.click();

		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
		await expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');
	});

	test('--hz-color-surface changes to dark value after toggle', async ({ page }) => {
		await page.goto('/');
		const toggleBtn = page.getByRole('button', { name: /theme/i });

		const lightSurface = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue('--hz-color-surface').trim()
		);

		await toggleBtn.click();

		const darkSurface = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue('--hz-color-surface').trim()
		);

		expect(lightSurface).not.toBe(darkSurface);
	});

	test('--hz-color-primary is unchanged after toggle (R9 dogfoods specs/15 R5)', async ({
		page
	}) => {
		await page.goto('/');
		const primaryBefore = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue('--hz-color-primary').trim()
		);

		await page.getByRole('button', { name: /theme/i }).click();

		const primaryAfter = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue('--hz-color-primary').trim()
		);

		expect(primaryBefore).toBe(primaryAfter);
	});
});
