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

/** The error page — landing-page layout, not the docs shell. */
test.describe('404 page', () => {
	test('says the page was not found and offers the seven onward links', async ({ page }) => {
		await page.goto('/no-such-page');
		await expect(page.getByRole('heading', { level: 1 })).toContainText('Page not found');
		await expect(page.locator('.docs-sidebar')).toHaveCount(0);
		const next = page.getByRole('region', { name: 'Where to go next' });
		await expect(next.getByRole('link')).toHaveCount(7);
		await expect(next.getByRole('link', { name: /Getting Started/ })).toHaveCount(1);
	});
});

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

	test('links to the full component reference', async ({ request }) => {
		const res = await request.get('/llms.txt');
		const body = await res.text();
		expect(body).toContain('https://design.hyzer.sh/llms-full.txt');
	});
});

/** The full component reference: every prop and styling hook in one file. */
test.describe('llms-full.txt', () => {
	test('serves the full component reference as plain text', async ({ request }) => {
		const res = await request.get('/llms-full.txt');
		expect(res.status()).toBe(200);
		expect(res.headers()['content-type']).toContain('text/plain');
		const body = await res.text();
		expect(body).toContain('# @hyzer-labs/ui');
		expect(body).toContain('### Button');
		expect(body).toContain('hz-button');
		expect(body).toContain('--hz-button-accent');
	});
});

/** The full component reference's JSON companion: the same walk, keyed for lookup. */
test.describe('llms-full.json', () => {
	test('serves the full component reference as JSON, carrying real prop and hook data', async ({
		request
	}) => {
		const res = await request.get('/llms-full.json');
		expect(res.status()).toBe(200);
		expect(res.headers()['content-type']).toContain('application/json');
		const body = await res.json();
		expect(Array.isArray(body.components)).toBe(true);
		const button = body.components.find((c: { name: string }) => c.name === 'Button');
		expect(button).toBeDefined();
		expect(button.props.some((p: { name: string }) => p.name === 'variant')).toBe(true);
		expect(button.hooks.root).toBe('hz-button');
	});
});

/** The fielded search index behind the docs command palette. */
test.describe('search-index.json', () => {
	test('serves the index as JSON, carrying real field data for a real component page', async ({
		request
	}) => {
		const res = await request.get('/search-index.json');
		expect(res.status()).toBe(200);
		expect(res.headers()['content-type']).toContain('application/json');
		const index = await res.json();
		expect(Array.isArray(index)).toBe(true);
		const button = index.find(
			(record: { href: string }) => record.href === '/docs/components/button'
		);
		expect(button).toBeDefined();
		expect(button.props).toContain('variant');
		expect(button.hooks).toContain('hz-button');
	});
});

/** The five commitment cards deep-link into the Philosophy page; a renamed
 *  heading id there would silently strand them, so pin both halves. */
test.describe('commitment cards', () => {
	test('every card href resolves to a live Philosophy anchor', async ({ page, request }) => {
		await page.goto('/');
		const hrefs = await page
			.locator('a[href^="/docs/philosophy#"]')
			.evaluateAll((links) => links.map((a) => a.getAttribute('href')));
		expect(hrefs).toHaveLength(5);

		const philosophy = await (await request.get('/docs/philosophy')).text();
		for (const href of hrefs) {
			const id = href!.split('#')[1];
			expect(philosophy, `missing anchor #${id}`).toContain(`id="${id}"`);
		}
	});
});
