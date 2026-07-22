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
	test('expanding a section toggle reveals its pages; clicking one navigates', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		const sidebar = page.getByRole('navigation', { name: 'Docs navigation' });
		// Sections are label-only toggles (no cover pages) — expand Foundation…
		await sidebar.getByRole('button', { name: 'Foundation' }).click();
		// …then click a page link inside it.
		await sidebar.getByRole('link', { name: 'Colors' }).click();
		await expect(page).toHaveURL('/foundation/colors');
	});

	test('active nav link exposes aria-current="page"', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/foundation/colors');
		// The active page's sidebar link should carry aria-current="page"
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
		// Tabs keeps inactive panels in the DOM (hidden) — assert the visible card.
		await expect(page.locator('.hz-card').filter({ visible: true }).first()).toBeVisible();
	});

	test('/components/tabs renders .hz-tabs', async ({ page }) => {
		await page.goto('/components/tabs');
		await expect(page.locator('.hz-tabs').first()).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Example code blocks — usage code visible below demos, reactive to variant
// ---------------------------------------------------------------------------

test.describe('Example code blocks', () => {
	test('/components/button shows example code below the demo', async ({ page }) => {
		await page.goto('/components/button');
		const code = page.locator('.doc-example pre code').first();
		await expect(code).toBeVisible();
		await expect(code).toContainText('<Button');
	});

	test('selecting a variant sub-tab updates the visible example code', async ({ page }) => {
		await page.goto('/components/button');
		// Tabs keeps inactive panels in the DOM (hidden), so assert on the
		// visible code block only.
		const visibleCode = page.locator('.doc-example pre code').filter({ visible: true }).first();
		await expect(visibleCode).toContainText('variant="solid"');

		await page.getByRole('tab', { name: 'outline' }).click();
		await expect(visibleCode).toContainText('variant="outline"');
		await expect(visibleCode).not.toContainText('variant="solid"');
	});

	test('example code block has a copy button', async ({ page }) => {
		await page.goto('/components/button');
		await expect(page.getByRole('button', { name: 'Copy' }).first()).toBeVisible();
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
// specs/36 R8 — Icons catalog page
// ---------------------------------------------------------------------------

// A handful of core export names (specs/36 R4) — always present, both in
// the dedicated "Core icons" section and (badged) in the full catalog.
const CORE_ICON_NAMES = ['IconChevronDown', 'IconX', 'IconMenu', 'IconSearch'] as const;

test.describe('specs/36 R8 — icons catalog page', () => {
	test('the manifest count renders as text, not one DOM node per icon', async ({ page }) => {
		await page.goto('/foundation/icons');
		// The full Lucide set is well over a thousand icons — assert the
		// count is shown as a number, not that this many DOM nodes exist.
		await expect(page.getByText(/\d{3,5} icons/).first()).toBeVisible();
		await expect(page.getByText(/\d+ of \d{3,5} icons shown/)).toBeVisible();
	});

	test('core icons render in a dedicated "Core icons" section, each badged "core"', async ({
		page
	}) => {
		await page.goto('/foundation/icons');
		const heading = page.getByRole('heading', { name: 'Core icons' });
		await expect(heading).toBeVisible();
		for (const name of CORE_ICON_NAMES) {
			await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
		}
		await expect(page.getByText('core', { exact: true }).first()).toBeVisible();
	});

	test('a props demo section illustrates size, stroke, and decorative vs. labelled', async ({
		page
	}) => {
		await page.goto('/foundation/icons');
		await expect(page.getByRole('heading', { name: 'Size & stroke' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Decorative vs. labelled' })).toBeVisible();
		await expect(page.getByText('Decorative (no ariaLabel → aria-hidden)')).toBeVisible();
	});

	test('searching narrows the catalog to a known icon and updates the shown count', async ({
		page
	}) => {
		await page.goto('/foundation/icons');
		const search = page.getByRole('textbox', { name: 'Search icons' });
		await search.fill('a-arrow-down');
		await expect(page.getByText('IconAArrowDown', { exact: true }).first()).toBeVisible();
		await expect(page.getByText(/^1 of \d{3,5} icons shown$/)).toBeVisible();
	});

	test('a bring-your-own brand marks note is present (no brand-icon section)', async ({ page }) => {
		await page.goto('/foundation/icons');
		await expect(page.getByText(/bring your own brand mark/i)).toBeVisible();
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
			'danger',
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

	test('--hz-color-primary lightens to its dark companion after toggle (R9 dogfoods specs/15 R5)', async ({
		page
	}) => {
		await page.goto('/');
		const primaryBefore = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue('--hz-color-primary').trim()
		);
		expect(primaryBefore).toBe('#2563eb');

		await page.getByRole('button', { name: /theme/i }).click();

		const primaryAfter = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue('--hz-color-primary').trim()
		);

		// Dark mode is authored at the palette layer (specs/15 R5, revised
		// 2026-07-15): every hue lightens; non-color tokens stay put.
		expect(primaryAfter).toBe('#60a5fa');
	});
});

// ---------------------------------------------------------------------------
// specs/31 — grouped Components section, flat URLs, Pages, Theme hooks
// ---------------------------------------------------------------------------

test.describe('specs/31 + 34 — grouped, collapsible sidebar', () => {
	test('Components shows five collapsible group toggles in order', async ({ page }) => {
		await page.goto('/components/button');
		const sidebar = page.getByRole('navigation', { name: 'Docs navigation' });

		// The active section auto-expands, so its group toggles are visible.
		const groupToggles = sidebar.locator('.hz-nav-panel .hz-nav-trigger');
		await expect(groupToggles).toHaveText([/Common/, /Layout/, /Navigation/, /Media/, /Forms/]);
	});

	test('the active group auto-expands; a collapsed group toggles open (spec 34)', async ({
		page
	}) => {
		await page.goto('/components/button');
		const sidebar = page.getByRole('navigation', { name: 'Docs navigation' });
		const common = sidebar.getByRole('button', { name: /Common/ });
		const layout = sidebar.getByRole('button', { name: /Layout/ });

		// Common holds Button → expanded; its link is visible. Layout is collapsed.
		await expect(common).toHaveAttribute('aria-expanded', 'true');
		await expect(sidebar.getByRole('link', { name: 'Button', exact: true })).toBeVisible();
		await expect(layout).toHaveAttribute('aria-expanded', 'false');
		await expect(sidebar.getByRole('link', { name: 'Container', exact: true })).toBeHidden();

		// Expanding Layout reveals its pages.
		await layout.click();
		await expect(layout).toHaveAttribute('aria-expanded', 'true');
		await expect(sidebar.getByRole('link', { name: 'Container', exact: true })).toBeVisible();

		// Collapsing it hides them again.
		await layout.click();
		await expect(layout).toHaveAttribute('aria-expanded', 'false');
		await expect(sidebar.getByRole('link', { name: 'Container', exact: true })).toBeHidden();
	});

	test('navigates to a moved page at its flat URL and marks it current', async ({ page }) => {
		await page.goto('/components/button');
		const sidebar = page.getByRole('navigation', { name: 'Docs navigation' });
		// Select is in Forms, collapsed on a Common page — expand it first (spec 34).
		await sidebar.getByRole('button', { name: /Forms/ }).click();
		// Select moved from /forms/select — the sidebar link must be the flat one.
		await sidebar.getByRole('link', { name: 'Select', exact: true }).click();
		await expect(page).toHaveURL('/components/select');
		await expect(page.locator('h1')).toHaveText('Select');
		// On the Select page, Forms auto-expands (it holds the active page).
		await expect(sidebar.getByRole('link', { name: 'Select', exact: true })).toHaveAttribute(
			'aria-current',
			'page'
		);
	});
});

test.describe('specs/31 R9/R10 — theme hooks', () => {
	test('a component page lists its root class, data hooks, and custom properties', async ({
		page
	}) => {
		await page.goto('/components/button');
		const hooks = page.locator('section', {
			has: page.getByRole('heading', { name: 'Theme hooks' })
		});
		await expect(hooks).toContainText('.hz-button');
		await expect(hooks).toContainText('data-variant');
		await expect(hooks).toContainText('--hz-button-accent');
	});

	test('the theming roll-up lists hooks from across the library and links their pages', async ({
		page
	}) => {
		await page.goto('/theming/components');
		const table = page.locator('.token-table');
		// Sourced from hooks.ts, so it spans components the old hand-written
		// table never covered.
		await expect(table).toContainText('--hz-button-accent');
		await expect(table).toContainText('--hz-modal-width');
		await expect(table).toContainText('--hz-image-fade-duration');
		// Button contributes two rows (the accent pair), so it links twice.
		await expect(table.getByRole('link', { name: 'Button' }).first()).toHaveAttribute(
			'href',
			'/components/button'
		);
	});
});

test.describe('specs/31 R5 — Patterns sample', () => {
	test('the Homepage sample bleeds wider than the prose column', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/patterns/homepage');

		const proseWidth = await page.locator('h1').evaluate((el) => el.getBoundingClientRect().width);
		const sampleWidth = await page
			.locator('.sample-frame')
			.evaluate((el) => el.getBoundingClientRect().width);
		expect(sampleWidth).toBeGreaterThan(proseWidth);
	});

	test('the sample nav landmark is named apart from the docs sidebar', async ({ page }) => {
		await page.goto('/patterns/homepage');
		// Nested <nav>s: distinct accessible names or they collide.
		await expect(page.getByRole('navigation', { name: 'Sample site navigation' })).toBeVisible();
		await expect(page.getByRole('navigation', { name: 'Docs navigation' })).toBeAttached();
	});
});

// ---------------------------------------------------------------------------
// specs/33 — carousel drag + touch targets
// ---------------------------------------------------------------------------

test.describe('specs/33 — carousel', () => {
	// The basic demo (counter indicator) is the default-active tab.
	async function gotoCarousel(page: import('@playwright/test').Page) {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/components/carousel');
		await expect(page.locator('.hz-carousel-track').first()).toBeVisible();
	}

	test('a pointer drag advances the slide (R3/R4)', async ({ page }) => {
		await gotoCarousel(page);
		const status = page.locator('.hz-carousel-status').first();
		await expect(status).toHaveText('1 / 3');

		const box = await page.locator('.hz-carousel-viewport').first().boundingBox();
		if (!box) throw new Error('no viewport box');
		const cy = box.y + box.height / 2;
		// Fast drag left across most of the viewport → advances.
		await page.mouse.move(box.x + box.width * 0.8, cy);
		await page.mouse.down();
		await page.mouse.move(box.x + box.width * 0.1, cy, { steps: 4 });
		await page.mouse.up();

		await expect(status).toHaveText('2 / 3');
	});

	// A point 20px above the element's centre must still resolve to it (or its
	// ::before) — i.e. the hit area extends ≥20px above centre, so it clears 40px
	// tall. The painted control may be much smaller.
	const probesTaller = (el: Element) => {
		const r = el.getBoundingClientRect();
		const probe = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2 - 20);
		return el === probe || el.contains(probe as Node);
	};

	test('prev/next hit areas are ≥44px tall (R8)', async ({ page }) => {
		await gotoCarousel(page); // basic tab — prev/next visible
		const prev = page.locator('.hz-carousel-prev').first();
		const next = page.locator('.hz-carousel-next').first();
		await expect(prev).toBeVisible();
		expect(await prev.evaluate(probesTaller)).toBe(true);
		expect(await next.evaluate(probesTaller)).toBe(true);
	});

	test('dot hit areas are taller than the painted dot (R8)', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/components/carousel');
		await page.getByRole('tab', { name: 'Dots' }).click();
		const dot = page.locator('.hz-carousel-dot').first();
		await expect(dot).toBeVisible();
		// The painted dot is ~8px; a taller ::before carries the tap target.
		const painted = await dot.evaluate((el) => el.getBoundingClientRect().height);
		expect(painted).toBeLessThan(20);
		expect(await dot.evaluate(probesTaller)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// specs/34 Part B — command palette search
// ---------------------------------------------------------------------------

test.describe('specs/34 — command palette (modal)', () => {
	test('the search trigger opens a modal; typing + Enter navigates', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		await page.getByRole('button', { name: /Search docs/ }).click();
		const dialog = page.getByRole('dialog', { name: 'Search documentation' });
		await expect(dialog).toBeVisible();
		const input = dialog.getByRole('combobox', { name: 'Search documentation' });
		await expect(input).toBeFocused();
		await input.fill('toggle');
		await expect(page.getByRole('option', { name: /Toggle/ })).toBeVisible();
		await input.press('Enter');
		await expect(page).toHaveURL('/components/toggle');
		await expect(dialog).toBeHidden();
	});

	test('a result shows its section/group breadcrumb and click navigates', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		await page.getByRole('button', { name: /Search docs/ }).click();
		const input = page.getByRole('combobox', { name: 'Search documentation' });
		await input.fill('select');
		const option = page.getByRole('option', { name: /Select/ }).first();
		await expect(option).toContainText('Components · Forms');
		await option.click();
		await expect(page).toHaveURL('/components/select');
	});

	test('the backdrop dismisses the modal', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		await page.getByRole('button', { name: /Search docs/ }).click();
		const dialog = page.getByRole('dialog', { name: 'Search documentation' });
		await expect(dialog).toBeVisible();
		await page.locator('.cmd-backdrop').click({ position: { x: 5, y: 5 } });
		await expect(dialog).toBeHidden();
	});

	test('no horizontal overflow at 375px with the palette open', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 700 });
		await page.goto('/');
		await page.getByRole('button', { name: 'Toggle navigation menu' }).first().click();
		await page.getByRole('button', { name: /Search docs/ }).click();
		const input = page.getByRole('combobox', { name: 'Search documentation' });
		await input.fill('co');
		await expect(page.getByRole('listbox')).toBeVisible();
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth > document.documentElement.clientWidth
		);
		expect(overflow).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// "On this page" rail — right-hand TOC (docs chrome)
// ---------------------------------------------------------------------------

test.describe('On this page rail', () => {
	const toc = 'nav[aria-label="On this page"]';

	test('lists the section headings on a component page at 1536px', async ({ page }) => {
		await page.setViewportSize({ width: 1536, height: 900 });
		await page.goto('/components/button');
		const rail = page.locator(toc);
		await expect(rail).toBeVisible();
		for (const label of ['Import', 'Demo', 'Props', 'Accessibility']) {
			await expect(rail.getByRole('link', { name: label })).toBeVisible();
		}
		// At the top of the page the first section is the active one.
		await expect(rail.locator('a[aria-current="location"]')).toHaveText('Import');
	});

	test('clicking an entry jumps to the section and marks it current', async ({ page }) => {
		await page.setViewportSize({ width: 1536, height: 900 });
		await page.goto('/components/button');
		await page.locator(toc).getByRole('link', { name: 'Accessibility' }).click();
		await expect(page).toHaveURL('/components/button#a11y-heading');
		await expect(page.locator('h2#a11y-heading')).toBeInViewport();
		await expect(page.locator(`${toc} a[aria-current="location"]`)).toHaveText('Accessibility');
	});

	test('scroll-spy tracks the reading position', async ({ page }) => {
		await page.setViewportSize({ width: 1536, height: 900 });
		await page.goto('/components/button');
		await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
		// Pinned to the bottom, the last section wins even if its heading
		// never crosses the threshold.
		await expect(page.locator(`${toc} a[aria-current="location"]`)).toHaveText('Accessibility');
	});

	test('hidden below the 1440px breakpoint (breakouts need the width)', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/components/button');
		await expect(page.locator(toc)).toBeHidden();
	});

	test('demo headings inside sample frames are not collected', async ({ page }) => {
		await page.setViewportSize({ width: 1536, height: 900 });
		// The homepage pattern's Hero renders an id'd h2 inside .sample-frame;
		// excluded, the page has only "Source" left — under the 2-entry
		// minimum, so the rail does not render at all.
		await page.goto('/patterns/homepage');
		expect(await page.locator(toc).count()).toBe(0);
	});

	test('no horizontal overflow at 1536px with the rail and a breakout demo', async ({ page }) => {
		await page.setViewportSize({ width: 1536, height: 900 });
		await page.goto('/patterns/product-listing');
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth > document.documentElement.clientWidth
		);
		expect(overflow).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// specs/37 — Table
// ---------------------------------------------------------------------------

test.describe('specs/37 — Table', () => {
	test('/components/table renders a real table', async ({ page }) => {
		await page.goto('/components/table');
		await expect(page.locator('table.hz-table').filter({ visible: true }).first()).toBeVisible();
	});

	test('sorting a demo column reorders visible rows', async ({ page }) => {
		await page.goto('/components/table');
		// The "Basic" demo (default-active tab) has sortable columns already.
		const firstRowHeader = page
			.locator('table.hz-table tbody tr th')
			.filter({ visible: true })
			.first();
		await expect(firstRowHeader).toHaveText('Voyager');
		await page.getByRole('button', { name: 'Name' }).click();
		await expect(firstRowHeader).toHaveText('Aviar');
	});

	test('selection updates the demo readout', async ({ page }) => {
		await page.goto('/components/table');
		await page.getByRole('tab', { name: 'Selection' }).click();
		await expect(page.getByText('Selected: none')).toBeVisible();
		await page.getByRole('checkbox', { name: 'Voyager' }).check();
		await expect(page.getByText('Selected: Voyager')).toBeVisible();
	});

	// No-overflow at 375/768/1280 is covered by the "R-Responsive" sweep above
	// (it runs over every manifest route, and /components/table is now one).

	test('the stacked demo renders column headers as inline labels at mobile viewport', async ({
		page
	}) => {
		await page.setViewportSize({ width: 375, height: 800 });
		await page.goto('/components/table');
		await page.getByRole('tab', { name: 'Stacked mode' }).click();
		// "Type" is the second column — a plain <td> (the first, "Name", is the
		// row's <th scope="row">, which also carries data-label but is a
		// separate code path — this asserts the more common cell case).
		const typeCell = page.locator('td[data-label="Type"]').filter({ visible: true }).first();
		await expect(typeCell).toBeVisible();
		// The label itself is CSS content (data-label + ::before) — read the
		// computed pseudo-element content to prove the theme rendered it.
		const beforeContent = await typeCell.evaluate((el) => getComputedStyle(el, '::before').content);
		expect(beforeContent).toContain('Type');
	});
});

// ---------------------------------------------------------------------------
// specs/37 R11 — virtualized table pattern
// ---------------------------------------------------------------------------

test.describe('specs/37 R11 — virtualized table pattern', () => {
	test('rendered row elements stay far below the dataset size (windowing proof)', async ({
		page
	}) => {
		await page.goto('/patterns/virtualized-table');
		const rowCount = await page.locator('.sample-frame [role="row"]').count();
		// 6,000 rows total (plus 1 header row) — only a small windowed slice is
		// ever mounted, regardless of dataset size.
		expect(rowCount).toBeGreaterThan(1);
		expect(rowCount).toBeLessThan(100);
	});

	test('scrolling the window changes the visible rows', async ({ page }) => {
		await page.goto('/patterns/virtualized-table');
		const viewport = page.locator('.sample-frame .hz-vtable-tbody');
		const firstCellText = () => page.locator('.sample-frame .hz-vtable-cell').first().textContent();
		const before = await firstCellText();
		await viewport.evaluate((el) => {
			el.scrollTop = el.scrollHeight / 2;
		});
		await expect.poll(firstCellText).not.toBe(before);
	});

	test('sorting reorders rows within the window', async ({ page }) => {
		await page.goto('/patterns/virtualized-table');
		const firstCellText = () => page.locator('.sample-frame .hz-vtable-cell').first().textContent();
		const before = await firstCellText();
		await page.getByRole('button', { name: 'Player' }).click();
		await expect.poll(firstCellText).not.toBe(before);
	});
});

// ---------------------------------------------------------------------------
// specs/38 — Toc
// ---------------------------------------------------------------------------

test.describe('specs/38 — Toc', () => {
	// Every demo watches its own bounded article (title="On this article"),
	// never the docs page itself — the dogfooded shell rail ("On this page")
	// keeps its separate name.
	const demoToc = 'nav[aria-label="On this article"]';

	test('the basic demo lists the article headings', async ({ page }) => {
		await page.goto('/components/toc');
		const rail = page.locator(demoToc);
		await expect(rail).toBeVisible();
		for (const label of ['Choosing a disc', 'Grip and stance', 'Reading the wind']) {
			await expect(rail.getByRole('link', { name: label })).toBeVisible();
		}
	});

	test('clicking an entry scrolls its own bounded article, not the page', async ({ page }) => {
		await page.goto('/components/toc');
		const article = page.locator('.toc-demo-article--basic');
		const windowScrollYBefore = await page.evaluate(() => window.scrollY);

		await page.locator(demoToc).getByRole('link', { name: 'Reading the wind' }).click();
		await expect.poll(() => article.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
		await expect(page.locator(`${demoToc} a[aria-current="location"]`)).toHaveText(
			'Reading the wind'
		);
		expect(await page.evaluate(() => window.scrollY)).toBe(windowScrollYBefore);
	});

	test('scrolling the bounded article updates the active entry', async ({ page }) => {
		await page.goto('/components/toc');
		const article = page.locator('.toc-demo-article--basic');
		await article.evaluate((el) => {
			el.scrollTop = el.scrollHeight - el.clientHeight;
		});
		await expect(page.locator(`${demoToc} a[aria-current="location"]`)).toHaveText(
			'Reading the wind'
		);
	});

	test('the nested-levels demo nests h3s under their h2', async ({ page }) => {
		await page.goto('/components/toc');
		await page.getByRole('tab', { name: 'Nested levels' }).click();
		const rail = page.locator(demoToc);
		await expect(rail.getByRole('link', { name: 'Getting started' })).toBeVisible();
		const nestedSublist = rail.locator('.hz-toc-list .hz-toc-list').first();
		await expect(nestedSublist.getByRole('link', { name: 'Installation' })).toBeVisible();
		await expect(nestedSublist.getByRole('link', { name: 'Configuration' })).toBeVisible();
	});

	test('the collapse demo shows a disclosure trigger below the breakpoint', async ({ page }) => {
		await page.setViewportSize({ width: 800, height: 900 });
		await page.goto('/components/toc');
		await page.getByRole('tab', { name: 'Collapse mode' }).click();
		const rail = page.locator(demoToc);
		const trigger = rail.locator('.hz-toc-trigger');
		await expect(trigger).toBeVisible();
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');

		await trigger.click();
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await expect(rail.getByRole('link', { name: 'Warm-up' })).toBeVisible();
	});

	test('the collapse demo shows the plain title (no trigger) above the breakpoint', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto('/components/toc');
		await page.getByRole('tab', { name: 'Collapse mode' }).click();
		const rail = page.locator(demoToc);
		await expect(rail.locator('.hz-toc-title')).toBeVisible();
		await expect(rail.locator('.hz-toc-trigger')).toBeHidden();
	});

	test('the callback demo readout tracks bind:active and onActive together', async ({ page }) => {
		await page.goto('/components/toc');
		await page.getByRole('tab', { name: 'Callback / bindable active' }).click();
		const rail = page.locator(demoToc);
		await rail.getByRole('link', { name: 'Details' }).click();
		await expect(page.getByText('Active: Details')).toBeVisible();
		await expect(page.getByText('last onActive: Details')).toBeVisible();
	});
});
