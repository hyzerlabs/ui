import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
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
		await page.goto('/docs');
		await expect(page.locator('#docs-sidebar')).toBeVisible();
	});

	test('docs footer is present on every page', async ({ page }) => {
		await page.goto('/docs');
		await expect(page.locator('.docs-footer')).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// R4 — Navigation and aria-current
// ---------------------------------------------------------------------------

test.describe('R4 — nav links and aria-current', () => {
	test('expanding a section toggle reveals its pages; clicking one navigates', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/docs');
		const sidebar = page.getByRole('navigation', { name: 'Docs navigation' });
		// Sections are label-only toggles (no cover pages) — expand Foundation…
		await sidebar.getByRole('button', { name: 'Foundation' }).click();
		// …then click a page link inside it.
		await sidebar.getByRole('link', { name: 'Colors' }).click();
		await expect(page).toHaveURL('/docs/foundation/colors');
	});

	test('active nav link exposes aria-current="page"', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/docs/foundation/colors');
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
		await page.goto('/docs/components/button');
		// The docs shell's theme toggle is an .hz-button too (dogfooded), and
		// its mobile-topbar instance is display:none at desktop width — assert
		// on the demo area's visible buttons, not the shell's.
		await expect(page.locator('button.hz-button').filter({ visible: true }).first()).toBeVisible();
	});

	test('/components/card renders .hz-card', async ({ page }) => {
		await page.goto('/docs/components/card');
		// Tabs keeps inactive panels in the DOM (hidden) — assert the visible card.
		await expect(page.locator('.hz-card').filter({ visible: true }).first()).toBeVisible();
	});

	test('/components/tabs renders .hz-tabs', async ({ page }) => {
		await page.goto('/docs/components/tabs');
		await expect(page.locator('.hz-tabs').first()).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Example code blocks — usage code visible below demos, reactive to variant
// ---------------------------------------------------------------------------

test.describe('Example code blocks', () => {
	test('/components/button shows example code below the demo', async ({ page }) => {
		await page.goto('/docs/components/button');
		const code = page.locator('.doc-example pre code').first();
		await expect(code).toBeVisible();
		await expect(code).toContainText('<Button');
	});

	test('selecting a demo tab updates the visible example code', async ({ page }) => {
		await page.goto('/docs/components/button');
		// Tabs keeps inactive panels in the DOM (hidden), so assert on the
		// visible code block only. The page lands on Variants (row-matrix
		// demo; defaults omitted from samples — a bare <Button> is solid +
		// primary, so the sample marks solid as the default row).
		const visibleCode = page.locator('.doc-example pre code').filter({ visible: true }).first();
		await expect(visibleCode).toContainText('variant="outline"');
		await expect(visibleCode).not.toContainText('size="sm"');

		await page.getByRole('tab', { name: 'Sizes' }).click();
		await expect(visibleCode).toContainText('size="sm"');
	});

	test('example code block has a copy button', async ({ page }) => {
		await page.goto('/docs/components/button');
		await expect(page.getByRole('button', { name: 'Copy' }).first()).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Modal demo edge case
// ---------------------------------------------------------------------------

test.describe('Modal demo edge case', () => {
	test('no dialog is open on /components/modal page load', async ({ page }) => {
		await page.goto('/docs/components/modal');
		// dialog[open] should not exist on page load
		const openDialog = page.locator('dialog[open]');
		expect(await openDialog.count()).toBe(0);
	});

	test('trigger button opens the modal', async ({ page }) => {
		await page.goto('/docs/components/modal');
		await page.getByRole('button', { name: 'Open modal' }).click();
		await expect(page.locator('dialog[open]')).toBeVisible();
	});

	test('Esc closes the open modal', async ({ page }) => {
		await page.goto('/docs/components/modal');
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
		await page.goto('/docs/components/icons');
		// The full Lucide set is well over a thousand icons — assert the
		// count is shown as a number, not that this many DOM nodes exist.
		await expect(page.getByText(/\d{3,5} icons/).first()).toBeVisible();
		await expect(page.getByText(/\d+ of \d{3,5} icons shown/)).toBeVisible();
	});

	test('core icons render in a dedicated "Core icons" section, each badged "core"', async ({
		page
	}) => {
		await page.goto('/docs/components/icons');
		const heading = page.getByRole('heading', { name: 'Core icons' });
		await expect(heading).toBeVisible();
		for (const name of CORE_ICON_NAMES) {
			await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
		}
		await expect(page.getByText('core', { exact: true }).first()).toBeVisible();
	});

	test('the demo tabs cover size & stroke, intent, and decorative vs. labelled', async ({
		page
	}) => {
		await page.goto('/docs/components/icons');
		const demoTabs = page.getByRole('tablist', { name: 'Icon demos' });
		await expect(demoTabs.getByRole('tab', { name: 'Size & stroke' })).toBeVisible();
		await expect(page.getByRole('slider', { name: 'size' })).toBeVisible();
		await demoTabs.getByRole('tab', { name: 'Intent' }).click();
		await expect(page.getByText('success', { exact: true })).toBeVisible();
		await demoTabs.getByRole('tab', { name: 'Decorative vs. labelled' }).click();
		await expect(page.getByText('Decorative (no ariaLabel → aria-hidden)')).toBeVisible();
	});

	test('searching narrows the catalog to a known icon and updates the shown count', async ({
		page
	}) => {
		await page.goto('/docs/components/icons');
		const search = page.getByRole('textbox', { name: 'Search icons' });
		await search.fill('a-arrow-down');
		await expect(page.getByText('IconAArrowDown', { exact: true }).first()).toBeVisible();
		await expect(page.getByText(/^1 of \d{3,5} icons shown$/)).toBeVisible();
	});

	test('a bring-your-own brand marks note is present (no brand-icon section)', async ({ page }) => {
		await page.goto('/docs/components/icons');
		await expect(page.getByText(/brand marks aren't included/i)).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// R7 — Foundation colors parity
// ---------------------------------------------------------------------------

test.describe('R7 — foundation colors page', () => {
	test('each palette color token name appears on /foundation/colors', async ({ page }) => {
		await page.goto('/docs/foundation/colors');

		// Palette tokens from metadata (specs/42 R1 — --hz-palette-* namespace)
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
			const cssVar = `--hz-palette-${key}`;
			await expect(page.getByText(cssVar, { exact: true }).first()).toBeVisible();
		}
	});

	test('color values appear as text alongside token names on /foundation/colors', async ({
		page
	}) => {
		await page.goto('/docs/foundation/colors');
		// At least one hex value should be visible
		await expect(page.getByText('#2563eb', { exact: true }).first()).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// R9 — Theme toggle
// ---------------------------------------------------------------------------

test.describe('R9 — theme toggle', () => {
	test('toggle button has aria-pressed reflecting current state', async ({ page }) => {
		await page.goto('/docs');
		const toggleBtn = page.getByRole('button', { name: /theme/i });
		// Initially light → aria-pressed="false"
		await expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');
	});

	test('clicking toggle sets data-theme="dark" on <html> and aria-pressed="true"', async ({
		page
	}) => {
		await page.goto('/docs');
		const toggleBtn = page.getByRole('button', { name: /theme/i });
		await toggleBtn.click();

		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
		await expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');
	});

	test('--hz-color-surface changes to dark value after toggle', async ({ page }) => {
		await page.goto('/docs');
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

	test('--hz-intent-primary lightens to its dark companion after toggle (R9 dogfoods specs/15 R5, specs/42 R1)', async ({
		page
	}) => {
		await page.goto('/docs');
		const primaryBefore = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue('--hz-intent-primary').trim()
		);
		expect(primaryBefore).toBe('#2563eb');

		await page.getByRole('button', { name: /theme/i }).click();

		const primaryAfter = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue('--hz-intent-primary').trim()
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
		await page.goto('/docs/components/button');
		const sidebar = page.getByRole('navigation', { name: 'Docs navigation' });

		// The active section auto-expands, so its group toggles are visible.
		const groupToggles = sidebar.locator('.hz-nav-panel .hz-nav-trigger');
		await expect(groupToggles).toHaveText([/Common/, /Layout/, /Navigation/, /Media/, /Forms/]);
	});

	test('the active group auto-expands; a collapsed group toggles open (spec 34)', async ({
		page
	}) => {
		await page.goto('/docs/components/button');
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
		await page.goto('/docs/components/button');
		const sidebar = page.getByRole('navigation', { name: 'Docs navigation' });
		// Select is in Forms, collapsed on a Common page — expand it first (spec 34).
		await sidebar.getByRole('button', { name: /Forms/ }).click();
		// Select moved from /forms/select — the sidebar link must be the flat one.
		await sidebar.getByRole('link', { name: 'Select', exact: true }).click();
		await expect(page).toHaveURL('/docs/components/select');
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
		await page.goto('/docs/components/button');
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
		await page.goto('/docs/theming/components');
		const table = page.locator('.token-table');
		// Sourced from hooks.ts, so it spans components the old hand-written
		// table never covered.
		await expect(table).toContainText('--hz-button-accent');
		await expect(table).toContainText('--hz-modal-width');
		await expect(table).toContainText('--hz-image-fade-duration');
		// Button contributes multiple rows (the accent pair + the soft tint), so it links more than once.
		await expect(table.getByRole('link', { name: 'Button' }).first()).toHaveAttribute(
			'href',
			'/docs/components/button'
		);
	});
});

test.describe('specs/31 R5 — Patterns sample', () => {
	test('the Homepage sample bleeds wider than the prose column', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/docs/patterns/homepage');

		const proseWidth = await page.locator('h1').evaluate((el) => el.getBoundingClientRect().width);
		const sampleWidth = await page
			.locator('.sample-frame')
			.evaluate((el) => el.getBoundingClientRect().width);
		expect(sampleWidth).toBeGreaterThan(proseWidth);
	});

	test('the sample nav landmark is named apart from the docs sidebar', async ({ page }) => {
		await page.goto('/docs/patterns/homepage');
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
		await page.goto('/docs/components/carousel');
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
		// probesTaller reads getBoundingClientRect()/elementFromPoint, both
		// viewport-relative — the density-scaffold docs pages (specs/40) run
		// roomier now, so the control isn't guaranteed to already be within the
		// fixed 800px test viewport; scroll it there first.
		await prev.scrollIntoViewIfNeeded();
		await expect(prev).toBeVisible();
		expect(await prev.evaluate(probesTaller)).toBe(true);
		expect(await next.evaluate(probesTaller)).toBe(true);
	});

	test('dot hit areas are taller than the painted dot (R8)', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/docs/components/carousel');
		await page.getByRole('tab', { name: 'Dots' }).click();
		const dot = page.locator('.hz-carousel-dot').first();
		// See the prev/next test above — scroll the viewport-relative probe
		// target into view before measuring it.
		await dot.scrollIntoViewIfNeeded();
		await expect(dot).toBeVisible();
		// The painted dot is ~8px; a taller ::before carries the tap target.
		const painted = await dot.evaluate((el) => el.getBoundingClientRect().height);
		expect(painted).toBeLessThan(20);
		expect(await dot.evaluate(probesTaller)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// specs/43 — carousel drag mode (controls="focus" + seamless)
// ---------------------------------------------------------------------------

test.describe('specs/43 — carousel drag mode', () => {
	// The Drag tab's demo composes draggable + loop + seamless + controls="focus".
	async function gotoDrag(page: import('@playwright/test').Page) {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/docs/components/carousel');
		await page.getByRole('tab', { name: 'Drag' }).click();
		const root = page.locator('.hz-carousel[data-seamless]').first();
		await expect(root).toBeVisible();
		return root;
	}

	test('resting view shows no controls (visually hidden until reveal)', async ({ page }) => {
		const root = await gotoDrag(page);
		await expect(root.locator('.hz-carousel-controls')).toHaveCSS('opacity', '0');
	});

	test('Tab reveals the whole control row and focus is visible', async ({ page }) => {
		const root = await gotoDrag(page);
		const controls = root.locator('.hz-carousel-controls');
		const prev = root.locator('.hz-carousel-prev');
		await prev.focus();
		await expect(controls).toHaveCSS('opacity', '1');
		await expect(prev).toBeFocused();
	});

	test('hover reveals the control row (pointer / 2.5.7 alternative)', async ({ page }) => {
		const root = await gotoDrag(page);
		await root.hover();
		await expect(root.locator('.hz-carousel-controls')).toHaveCSS('opacity', '1');
	});

	test('a pointer drag advances the demo', async ({ page }) => {
		const root = await gotoDrag(page);
		const status = root.locator('.hz-carousel-status');
		await expect(status).toHaveText('1 / 3');
		const viewport = root.locator('.hz-carousel-viewport');
		// The Drag tab's longer tab-note pushes the demo below the fixed 800px
		// test viewport — page.mouse coordinates need the element on-screen.
		await viewport.scrollIntoViewIfNeeded();
		const box = await viewport.boundingBox();
		if (!box) throw new Error('no viewport box');
		// Near the top of the (short, text-height) viewport — the revealed
		// control row is bottom-anchored, and once :hover reveals it (the
		// cursor is over the carousel for the whole gesture), its own prev/
		// next/dot hit areas would otherwise sit on top of a bottom-centered
		// drag path, same as controls="visible"'s row already does to a drag
		// that starts exactly on a button.
		const cy = box.y + box.height * 0.15;
		await page.mouse.move(box.x + box.width * 0.8, cy);
		await page.mouse.down();
		await page.mouse.move(box.x + box.width * 0.1, cy, { steps: 4 });
		await page.mouse.up();
		await expect(status).toHaveText('2 / 3');
	});

	test('a prev/next click at the boundary wraps seamlessly, with no sustained backward sweep', async ({
		page
	}) => {
		const root = await gotoDrag(page);
		await root.hover();
		const next = root.locator('.hz-carousel-next');
		const status = root.locator('.hz-carousel-status');
		await next.click();
		await next.click();
		await expect(status).toHaveText('3 / 3');

		// Sample the track's translateX during the wrap that "next" is about to
		// trigger. A plain go() rewind (spec 33, no seamless) would show many
		// consecutive frames climbing back toward 0 as it sweeps through the
		// intervening slides; the seamless clone settle should show at most one
		// single-frame jump, at the silent reset.
		const samples = await root.locator('.hz-carousel-track').evaluate((el) => {
			return new Promise<number[]>((resolve) => {
				const out: number[] = [];
				const start = performance.now();
				function frame() {
					const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
					out.push(m.m41);
					if (performance.now() - start < 700) requestAnimationFrame(frame);
					else resolve(out);
				}
				const nextButton = el.parentElement?.parentElement?.querySelector(
					'.hz-carousel-next'
				) as HTMLElement | null;
				nextButton?.click();
				requestAnimationFrame(frame);
			});
		});

		await expect(status).toHaveText('1 / 3');

		let run = 0;
		let maxRun = 0;
		for (let i = 1; i < samples.length; i++) {
			if (samples[i] > samples[i - 1] + 0.5) {
				run++;
				maxRun = Math.max(maxRun, run);
			} else {
				run = 0;
			}
		}
		expect(maxRun).toBeLessThanOrEqual(1);
	});

	test('no horizontal overflow at 375px', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto('/docs/components/carousel');
		await page.getByRole('tab', { name: 'Drag' }).click();
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth > document.documentElement.clientWidth
		);
		expect(overflow).toBe(false);
	});

	test('prefers-reduced-motion disables the reveal fade', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		const root = await gotoDrag(page);
		// The R3/R4 opacity transition is gated behind
		// `@media (prefers-reduced-motion: no-preference)`, so it doesn't apply
		// at all under `reduce` — base.css's global reduced-motion guard then
		// forces every transition-duration to 0.01ms (not the R3 fade's own
		// --hz-duration-fast token), so the reveal is instant either way.
		const durationMs = await root.locator('.hz-carousel-controls').evaluate((el) => {
			const d = getComputedStyle(el).transitionDuration; // e.g. "0.01ms" or "0s"
			return parseFloat(d) * (d.trim().endsWith('ms') ? 1 : 1000);
		});
		expect(durationMs).toBeLessThanOrEqual(1);
	});
});

// ---------------------------------------------------------------------------
// specs/34 Part B — command palette search
// ---------------------------------------------------------------------------

test.describe('specs/34 — command palette (modal)', () => {
	test('the search trigger opens a modal; typing + Enter navigates', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/docs');
		await page.getByRole('button', { name: /Search docs/ }).click();
		const dialog = page.getByRole('dialog', { name: 'Search documentation' });
		await expect(dialog).toBeVisible();
		const input = dialog.getByRole('combobox', { name: 'Search documentation' });
		await expect(input).toBeFocused();
		await input.fill('toggle');
		await expect(page.getByRole('option', { name: /Toggle/ })).toBeVisible();
		await input.press('Enter');
		await expect(page).toHaveURL('/docs/components/toggle');
		await expect(dialog).toBeHidden();
	});

	test('a result shows its section/group breadcrumb and click navigates', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/docs');
		await page.getByRole('button', { name: /Search docs/ }).click();
		const input = page.getByRole('combobox', { name: 'Search documentation' });
		await input.fill('select');
		const option = page.getByRole('option', { name: /Select/ }).first();
		await expect(option).toContainText('Components · Forms');
		await option.click();
		await expect(page).toHaveURL('/docs/components/select');
	});

	test('the backdrop dismisses the modal', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/docs');
		await page.getByRole('button', { name: /Search docs/ }).click();
		const dialog = page.getByRole('dialog', { name: 'Search documentation' });
		await expect(dialog).toBeVisible();
		await page.locator('.cmd-backdrop').click({ position: { x: 5, y: 5 } });
		await expect(dialog).toBeHidden();
	});

	test('no horizontal overflow at 375px with the palette open', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 700 });
		await page.goto('/docs');
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
		await page.goto('/docs/components/button');
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
		await page.goto('/docs/components/button');
		await page.locator(toc).getByRole('link', { name: 'Accessibility' }).click();
		await expect(page).toHaveURL('/docs/components/button#a11y-heading');
		await expect(page.locator('h2#a11y-heading')).toBeInViewport();
		await expect(page.locator(`${toc} a[aria-current="location"]`)).toHaveText('Accessibility');
	});

	test('scroll-spy tracks the reading position', async ({ page }) => {
		await page.setViewportSize({ width: 1536, height: 900 });
		await page.goto('/docs/components/button');
		await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
		// Pinned to the bottom, the last section wins even if its heading
		// never crosses the threshold.
		await expect(page.locator(`${toc} a[aria-current="location"]`)).toHaveText('Accessibility');
	});

	test('hidden below the 1440px breakpoint (breakouts need the width)', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/docs/components/button');
		await expect(page.locator(toc)).toBeHidden();
	});

	test('demo headings inside sample frames are not collected', async ({ page }) => {
		await page.setViewportSize({ width: 1536, height: 900 });
		// The homepage pattern's two Heroes each render an id'd h2 inside
		// .sample-frame (the sample's own composition, not the docs page's
		// structure) — excluded, so the rail lists only the page's own
		// "Demo"/"Source" sections and never any sample-internal heading.
		await page.goto('/docs/patterns/homepage');
		const rail = page.locator(toc);
		await expect(rail).toBeVisible();
		const labels = await rail.getByRole('link').allTextContents();
		expect(labels).toEqual(['Demo', 'Source']);
	});

	test('no horizontal overflow at 1536px with the rail and a breakout demo', async ({ page }) => {
		await page.setViewportSize({ width: 1536, height: 900 });
		await page.goto('/docs/patterns/product-listing');
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
		await page.goto('/docs/components/table');
		await expect(page.locator('table.hz-table').filter({ visible: true }).first()).toBeVisible();
	});

	test('sorting a demo column reorders visible rows', async ({ page }) => {
		await page.goto('/docs/components/table');
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
		await page.goto('/docs/components/table');
		await page.getByRole('tab', { name: 'Selection' }).click();
		await expect(page.getByText('Selected: none')).toBeVisible();
		await page.getByRole('checkbox', { name: 'Voyager' }).check();
		await expect(page.getByText('Selected: Voyager')).toBeVisible();
	});

	// No-overflow at 375/768/1280 is covered by the "R-Responsive" sweep above
	// (it runs over every manifest route, and /components/table is now one).

	test('the stacked demo renders column headers as inline labels below the sm threshold, and reverts to a real table row above it (both directions)', async ({
		page
	}) => {
		await page.goto('/docs/components/table');
		await page.getByRole('tab', { name: 'Stacked mode' }).click();
		// The demo is a ResizableDemo (stack="sm", 640px threshold) — drag the
		// bounded box under/over 640px via its exact-entry input rather than
		// the page viewport, which no longer drives the demo's own width.
		const widthInput = page.getByLabel('Demo width (exact value)');
		// "Type" is the second column — a plain <td> (the first, "Name", is the
		// row's <th scope="row">, which also carries data-label but is a
		// separate code path — this asserts the more common cell case).
		const typeCell = page.locator('td[data-label="Type"]').filter({ visible: true }).first();

		await widthInput.fill('500');
		await widthInput.press('Enter');
		await expect(typeCell).toBeVisible();
		await expect(typeCell).toHaveCSS('display', 'flex');
		// The label itself is CSS content (data-label + ::before) — read the
		// computed pseudo-element content to prove the theme rendered it.
		const beforeContentStacked = await typeCell.evaluate(
			(el) => getComputedStyle(el, '::before').content
		);
		expect(beforeContentStacked).toContain('Type');

		// Regression guard (specs/37 amendment, 2026-07-23): widening back
		// past the threshold used to leave cells stuck in the stacked flex
		// layout (a specificity tie the un-stacking @container rule lost) —
		// this must actually revert to a real table row, not just stay
		// "visible".
		await widthInput.fill('900');
		await widthInput.press('Enter');
		await expect(typeCell).toHaveCSS('display', 'table-cell');
		const beforeContentTable = await typeCell.evaluate(
			(el) => getComputedStyle(el, '::before').content
		);
		expect(beforeContentTable).not.toContain('Type');

		// And back down again — fully reversible, not a one-shot fix.
		await widthInput.fill('500');
		await widthInput.press('Enter');
		await expect(typeCell).toHaveCSS('display', 'flex');
	});
});

// ---------------------------------------------------------------------------
// specs/37 R11 — virtualized table pattern
// ---------------------------------------------------------------------------

test.describe('specs/37 R11 — virtualized table pattern', () => {
	test('rendered row elements stay far below the dataset size (windowing proof)', async ({
		page
	}) => {
		await page.goto('/docs/patterns/virtualized-table');
		const rowCount = await page.locator('.sample-frame [role="row"]').count();
		// 6,000 rows total (plus 1 header row) — only a small windowed slice is
		// ever mounted, regardless of dataset size.
		expect(rowCount).toBeGreaterThan(1);
		expect(rowCount).toBeLessThan(100);
	});

	test('scrolling the window changes the visible rows', async ({ page }) => {
		await page.goto('/docs/patterns/virtualized-table');
		const viewport = page.locator('.sample-frame .hz-vtable-tbody');
		const firstCellText = () => page.locator('.sample-frame .hz-vtable-cell').first().textContent();
		const before = await firstCellText();
		await viewport.evaluate((el) => {
			el.scrollTop = el.scrollHeight / 2;
		});
		await expect.poll(firstCellText).not.toBe(before);
	});

	test('sorting reorders rows within the window', async ({ page }) => {
		await page.goto('/docs/patterns/virtualized-table');
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
		await page.goto('/docs/components/toc');
		const rail = page.locator(demoToc);
		await expect(rail).toBeVisible();
		for (const label of ['Choosing a disc', 'Grip and stance', 'Reading the wind']) {
			await expect(rail.getByRole('link', { name: label })).toBeVisible();
		}
	});

	test('clicking an entry scrolls its own bounded article, not the page', async ({ page }) => {
		await page.goto('/docs/components/toc');
		const article = page.locator('.toc-demo-article--basic');
		const entry = page.locator(demoToc).getByRole('link', { name: 'Reading the wind' });
		// The density-scaffold docs pages (specs/40) run roomier now, so this
		// demo isn't guaranteed to already fit the initial viewport — bring the
		// entry into view (a page-level scroll unrelated to the assertion
		// below) before capturing the baseline, so the click itself is the only
		// thing that could move window.scrollY from here on.
		await entry.scrollIntoViewIfNeeded();
		const windowScrollYBefore = await page.evaluate(() => window.scrollY);

		await entry.click();
		await expect.poll(() => article.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
		await expect(page.locator(`${demoToc} a[aria-current="location"]`)).toHaveText(
			'Reading the wind'
		);
		expect(await page.evaluate(() => window.scrollY)).toBe(windowScrollYBefore);
	});

	test('scrolling the bounded article updates the active entry', async ({ page }) => {
		await page.goto('/docs/components/toc');
		const article = page.locator('.toc-demo-article--basic');
		await article.evaluate((el) => {
			el.scrollTop = el.scrollHeight - el.clientHeight;
		});
		await expect(page.locator(`${demoToc} a[aria-current="location"]`)).toHaveText(
			'Reading the wind'
		);
	});

	test('the nested-levels demo nests h3s under their h2', async ({ page }) => {
		await page.goto('/docs/components/toc');
		await page.getByRole('tab', { name: 'Nested levels' }).click();
		const rail = page.locator(demoToc);
		await expect(rail.getByRole('link', { name: 'Getting started' })).toBeVisible();
		const nestedSublist = rail.locator('.hz-toc-list .hz-toc-list').first();
		await expect(nestedSublist.getByRole('link', { name: 'Installation' })).toBeVisible();
		await expect(nestedSublist.getByRole('link', { name: 'Configuration' })).toBeVisible();
	});

	test('the collapse demo shows a disclosure trigger below the breakpoint', async ({ page }) => {
		await page.setViewportSize({ width: 800, height: 900 });
		await page.goto('/docs/components/toc');
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
		await page.goto('/docs/components/toc');
		await page.getByRole('tab', { name: 'Collapse mode' }).click();
		const rail = page.locator(demoToc);
		await expect(rail.locator('.hz-toc-title')).toBeVisible();
		await expect(rail.locator('.hz-toc-trigger')).toBeHidden();
	});

	test('the callback demo readout tracks bind:active and onActive together', async ({ page }) => {
		await page.goto('/docs/components/toc');
		await page.getByRole('tab', { name: 'Callback / bindable active' }).click();
		const rail = page.locator(demoToc);
		await rail.getByRole('link', { name: 'Details' }).click();
		await expect(page.getByText('Active: Details')).toBeVisible();
		await expect(page.getByText('last onActive: Details')).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// specs/39 — Motion
// ---------------------------------------------------------------------------

test.describe('specs/39 — Motion', () => {
	// R6/Test Plan: the half-width bar bug is a visual regression — this
	// MEASURES the dot's resolved position against the track's own right
	// edge (not the presence of a "moved" class) at two viewports, so a
	// re-introduction of the fixed-offset bug would fail this even though
	// the class name would still be applied correctly.
	for (const vp of [
		{ name: '375px', width: 375, height: 900 },
		{ name: '1280px', width: 1280, height: 900 }
	]) {
		test(`duration demo dot reaches the track's far edge at ${vp.name}`, async ({ page }) => {
			await page.setViewportSize({ width: vp.width, height: vp.height });
			await page.goto('/docs/foundation/motion');

			const section = page.locator('section', { has: page.locator('#duration-demo-heading') });
			await section.getByRole('button', { name: 'Animate' }).click();
			// transition-duration is at most --hz-duration-slow (400ms).
			await page.waitForTimeout(600);

			const tracks = section.locator('.demo-track');
			const count = await tracks.count();
			expect(count).toBeGreaterThan(0);
			for (let i = 0; i < count; i++) {
				const track = tracks.nth(i);
				const dot = track.locator('.demo-dot');
				const trackBox = await track.boundingBox();
				const dotBox = await dot.boundingBox();
				if (!trackBox || !dotBox) throw new Error('missing bounding box');
				const gap = trackBox.x + trackBox.width - (dotBox.x + dotBox.width);
				// The resting inset is 0.25rem (4px at the default root size) —
				// generous tolerance for subpixel/zoom rounding, but nowhere near
				// the ~14rem/40vw gap the half-travel bug used to leave behind.
				expect(gap).toBeGreaterThanOrEqual(0);
				expect(gap).toBeLessThan(16);
			}
		});
	}

	test('a transition demo toggles its box via the R3 helpers', async ({ page }) => {
		await page.goto('/docs/foundation/motion');
		const section = page.locator('section', { has: page.locator('#transitions-heading') });
		await expect(section.locator('.transition-box').filter({ visible: true })).toBeVisible();

		await section.getByRole('button', { name: 'Hide' }).click();
		await expect(section.locator('.transition-box').filter({ visible: true })).toHaveCount(0);

		await section.getByRole('button', { name: 'Show' }).click();
		await expect(section.locator('.transition-box').filter({ visible: true })).toBeVisible();
	});

	test('switching the transition sub-tab swaps the demo (fly)', async ({ page }) => {
		await page.goto('/docs/foundation/motion');
		// The reveal-entrance tabs mirror the transition tabs 1:1, so "Fly"
		// exists twice on the page — scope to the transition tablist.
		await page.getByLabel('Transition demos').getByRole('tab', { name: 'Fly' }).click();
		const section = page.locator('section', { has: page.locator('#transitions-heading') });
		await expect(section.locator('.transition-box').filter({ visible: true })).toHaveText('Fly');
	});

	// The reveal demos live in tabs now (single / group / hero); the card strip
	// is the GROUP tab, which is not the default, so each test selects it.
	async function openRevealGroupTab(page: Page) {
		await page.goto('/docs/foundation/motion');
		await page
			.getByLabel('Scroll reveal demos')
			.getByRole('tab', { name: 'revealGroup — a list' })
			.click();
	}

	test('the reveal demo shows its cards once scrolled into view', async ({ page }) => {
		await openRevealGroupTab(page);
		const firstCard = page.locator('.reveal-card').first();
		// Scroll the card strip itself into view — the density-scaffold docs
		// pages (specs/40) run roomier now, so the heading alone (further from
		// the strip than before) no longer guarantees the revealGroup's
		// IntersectionObserver target is actually in the viewport too.
		await firstCard.scrollIntoViewIfNeeded();
		await expect
			.poll(async () => firstCard.evaluate((el) => getComputedStyle(el).opacity))
			.toBe('1');
	});

	test('the reveal demo Replay button re-runs the entrance', async ({ page }) => {
		await openRevealGroupTab(page);
		const section = page.locator('section', { has: page.locator('#reveal-heading') });
		await section.scrollIntoViewIfNeeded();
		const firstCard = section.locator('.reveal-card').first();
		await expect
			.poll(async () => firstCard.evaluate((el) => getComputedStyle(el).opacity))
			.toBe('1');

		await section.getByRole('button', { name: 'Replay' }).click();
		await expect
			.poll(async () => firstCard.evaluate((el) => getComputedStyle(el).opacity))
			.toBe('1');
	});

	test('the single-element reveal demo plays on the default tab', async ({ page }) => {
		await page.goto('/docs/foundation/motion');
		const solo = page.locator('.reveal-solo');
		await solo.scrollIntoViewIfNeeded();
		await expect.poll(async () => solo.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
	});

	test('the view-transition demo swaps layout with no error, supported or not', async ({
		page
	}) => {
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(e.message));

		await page.goto('/docs/foundation/motion');
		const section = page.locator('section', { has: page.locator('#view-transition-heading') });
		const button = section.getByRole('button', { name: /Switch to/ });
		const layout = section.locator('.layout-demo');

		await expect(layout).not.toHaveClass(/layout-demo--list/);
		await button.click();
		await expect(layout).toHaveClass(/layout-demo--list/);
		await button.click();
		await expect(layout).not.toHaveClass(/layout-demo--list/);

		expect(errors).toEqual([]);
	});

	// No-overflow at 375/768/1280 is covered by the "R-Responsive" sweep above
	// (it runs over every manifest route, and /foundation/motion is one).
});

// ---------------------------------------------------------------------------
// specs/48 — Observers
// ---------------------------------------------------------------------------

test.describe('specs/48 — Observers', () => {
	test('all four worked examples are present and operable', async ({ page }) => {
		await page.goto('/docs/foundation/observers');

		await expect(page.locator('#intersect-heading')).toBeVisible();
		await expect(page.locator('.intersect-pane')).toBeVisible();

		await expect(page.locator('#resize-heading')).toBeVisible();
		await expect(page.locator('.resize-demo')).toBeVisible();

		await expect(page.locator('#mutate-heading')).toBeVisible();
		await expect(page.getByRole('textbox', { name: 'Editable notes' })).toBeVisible();

		await expect(page.locator('#announce-heading')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Announce status (polite)' })).toBeVisible();
	});

	test('the intersect demo updates once its sentinel is scrolled into view', async ({ page }) => {
		await page.goto('/docs/foundation/observers');
		const section = page.locator('section', { has: page.locator('#intersect-heading') });
		const sentinel = section.locator('.intersect-sentinel');

		await expect(sentinel).toHaveText('Scroll down to reveal me');
		await expect(section.locator('.intersect-status')).toHaveText(/Is intersecting: no/);
		await sentinel.scrollIntoViewIfNeeded();
		await expect(sentinel).toHaveText(/Revealed \d+ times?/);
		// Bi-directional: the live badge flips as the sentinel enters view.
		await expect(section.locator('.intersect-status')).toHaveText(/Is intersecting: yes/);
	});

	test('the resize demo reports a changed dimension after a viewport resize', async ({ page }) => {
		await page.setViewportSize({ width: 1000, height: 800 });
		await page.goto('/docs/foundation/observers');
		const section = page.locator('section', { has: page.locator('#resize-heading') });
		const readout = section.locator('.resize-readout');

		await expect.poll(async () => readout.textContent()).toMatch(/\d+ × \d+px/);
		const before = await readout.textContent();

		await page.setViewportSize({ width: 500, height: 800 });
		await expect.poll(async () => readout.textContent()).not.toBe(before);
	});

	test('the mutate demo derives a live word count from typed contenteditable input', async ({
		page
	}) => {
		await page.goto('/docs/foundation/observers');
		const section = page.locator('section', { has: page.locator('#mutate-heading') });
		const editor = section.getByRole('textbox', { name: 'Editable notes' });

		await expect(section.getByText('Word count:')).toContainText('0');
		await expect(section.getByText('(unedited)')).toBeVisible();

		await editor.click();
		await editor.pressSequentially('Hyzer UI ships headless components');
		// debounce: 150 — the coalesced callback lands after the quiet period.
		await expect(section.getByText('Word count:')).toContainText('5', { timeout: 2000 });
		await expect(section.getByText('(edited)')).toBeVisible();
	});

	test('announce creates its live regions in the DOM with the expected aria-live values (not asserted visually)', async ({
		page
	}) => {
		await page.goto('/docs/foundation/observers');
		const section = page.locator('section', { has: page.locator('#announce-heading') });

		await section.getByRole('button', { name: 'Announce status (polite)' }).click();
		await section.getByRole('button', { name: 'Announce alert (assertive)' }).click();

		const polite = page.locator('[data-hz-live-region][aria-live="polite"]');
		const assertive = page.locator('[data-hz-live-region][aria-live="assertive"]');
		await expect(polite).toHaveCount(1);
		await expect(assertive).toHaveCount(1);
		await expect(polite).toHaveAttribute('aria-atomic', 'true');
		await expect(assertive).toHaveAttribute('aria-atomic', 'true');
		await expect(polite).toBeAttached();
		await expect(assertive).toBeAttached();
	});

	// No-overflow at 375/768/1280 is covered by the "R-Responsive" sweep above
	// (it runs over every manifest route, and /foundation/observers is one).
});

// ---------------------------------------------------------------------------
// specs/40 findings (course-correction round) — virtualized combobox pattern
// ---------------------------------------------------------------------------

test.describe('Virtualized combobox pattern', () => {
	test('rendered options stay far below the dataset size (windowing proof)', async ({ page }) => {
		await page.goto('/docs/patterns/virtualized-combobox');
		await page.getByRole('combobox').click();
		const optionCount = await page.locator('[role="option"]').count();
		// 27,000 rows total (30 real courses × 900 rounds) — only a small
		// windowed slice is ever mounted, regardless of dataset size.
		expect(optionCount).toBeGreaterThan(0);
		expect(optionCount).toBeLessThan(100);
	});

	test('aria-activedescendant always references a currently-rendered option, including across a Home/End jump', async ({
		page
	}) => {
		await page.goto('/docs/patterns/virtualized-combobox');
		const input = page.getByRole('combobox');
		await input.click();

		async function activeIdExists() {
			return page.evaluate(() => {
				const el = document.querySelector('[role="combobox"]');
				const id = el?.getAttribute('aria-activedescendant');
				return id !== null && id !== undefined && !!document.getElementById(id);
			});
		}

		await page.keyboard.press('ArrowDown');
		await expect.poll(activeIdExists).toBe(true);

		// End jumps to the very last of 27,000 rows — a big scroll jump, not
		// just an adjacent overscan step.
		await page.keyboard.press('End');
		await expect.poll(activeIdExists).toBe(true);
		const lastId = await input.getAttribute('aria-activedescendant');
		await expect(page.locator(`#${lastId}`)).toHaveText(/Round 900/);

		await page.keyboard.press('Home');
		await expect.poll(activeIdExists).toBe(true);
		const firstId = await input.getAttribute('aria-activedescendant');
		await expect(page.locator(`#${firstId}`)).toHaveText(/Round 1$/);
	});

	test('typing filters by substring across the whole label, windowed the same way', async ({
		page
	}) => {
		await page.goto('/docs/patterns/virtualized-combobox');
		const input = page.getByRole('combobox');
		await input.click();
		await input.fill('nokia');
		const options = page.locator('[role="option"]');
		await expect.poll(() => options.count()).toBeGreaterThan(0);
		const texts = await options.allTextContents();
		for (const text of texts) expect(text).toContain('Nokia');
	});

	test('Enter toggles the active option without closing the popup', async ({ page }) => {
		await page.goto('/docs/patterns/virtualized-combobox');
		const input = page.getByRole('combobox');
		await input.click();
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		// Toggle-to-select: the popup stays open, mirroring Combobox's own
		// commit behavior (it never closes on a selection).
		await expect(input).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('.vcombo-proof')).toContainText('Selected:');
		await expect(page.locator('.hz-badge')).toHaveCount(1);
	});

	test('Escape closes the popup without touching the selection', async ({ page }) => {
		await page.goto('/docs/patterns/virtualized-combobox');
		const input = page.getByRole('combobox');
		await input.click();
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await expect(page.locator('.hz-badge')).toHaveCount(1);

		await page.keyboard.press('Escape');
		await expect(input).toHaveAttribute('aria-expanded', 'false');
		// Selections survive Escape — only chip dismiss removes a value.
		await expect(page.locator('.hz-badge')).toHaveCount(1);
	});

	test('a selected round renders a dismissible chip, and dismissing it removes the selection', async ({
		page
	}) => {
		await page.goto('/docs/patterns/virtualized-combobox');
		const input = page.getByRole('combobox');
		// A click alone opens the popup with the first option already active
		// — no ArrowDown needed to reach it.
		await input.click();
		await page.keyboard.press('Enter');

		const chip = page.locator('.hz-badge').first();
		await expect(chip).toContainText('Round 1');

		const dismiss = chip.getByRole('button', { name: /Remove/ });
		await dismiss.click();
		await expect(page.locator('.hz-badge')).toHaveCount(0);
		// Focus returns to the input, mirroring Combobox's removeChip.
		await expect(input).toBeFocused();
	});

	test('aria-selected reflects the data, not DOM history, as a selected row windows back into view', async ({
		page
	}) => {
		await page.goto('/docs/patterns/virtualized-combobox');
		const input = page.getByRole('combobox');
		await input.click();

		// Select the very first row.
		await page.keyboard.press('Home');
		await page.keyboard.press('Enter');
		await expect(page.locator('.hz-badge')).toHaveCount(1);

		// Jump to the far end of 27,000 rows — the first row's own DOM node
		// unmounts as Virtualizer's window moves away from it.
		await page.keyboard.press('End');
		await expect
			.poll(async () => page.locator('[role="option"]').first().textContent())
			.not.toContain('Round 1');

		// Jump back — the row remounts as a brand new DOM node, and its
		// aria-selected must still be true, derived from selectedIds rather
		// than any state the old node carried.
		await page.keyboard.press('Home');
		const firstOption = page.locator('[role="option"]').first();
		await expect(firstOption).toHaveText(/Round 1$/);
		await expect(firstOption).toHaveAttribute('aria-selected', 'true');
	});

	test('the listbox is marked aria-multiselectable', async ({ page }) => {
		await page.goto('/docs/patterns/virtualized-combobox');
		await page.getByRole('combobox').click();
		await expect(page.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
	});

	test('a wheel scroll that windows the active row out demotes aria-activedescendant; scrolling back re-commits it', async ({
		page
	}) => {
		await page.goto('/docs/patterns/virtualized-combobox');
		const input = page.getByRole('combobox');
		// A click opens the popup with option 0 committed active.
		await input.click();
		const activeId = await input.getAttribute('aria-activedescendant');
		expect(activeId).toBeTruthy();

		// Wheel far down the 27,000-row list — the active row's node unmounts,
		// and aria-activedescendant must NOT be left dangling at a removed id:
		// it is withdrawn entirely (undefined = "no active option").
		await page.getByRole('listbox').hover();
		await page.mouse.wheel(0, 50_000);
		await expect(input).not.toHaveAttribute('aria-activedescendant');

		// Wheel back to the top — the same row remounts and the demoted active
		// option re-commits on its own, same id.
		await page.mouse.wheel(0, -200_000);
		await expect(input).toHaveAttribute('aria-activedescendant', activeId!);

		// Arrow navigation resumes from the demoted position, not the top:
		// scroll away again (demote), then ArrowDown → the option AFTER the
		// remembered one (index 1), never a reset to index 0.
		await page.mouse.wheel(0, 50_000);
		await expect(input).not.toHaveAttribute('aria-activedescendant');
		await page.keyboard.press('ArrowDown');
		await expect(input).toHaveAttribute('aria-activedescendant', /-1$/);
		// The advertised id always resolves to a real, mounted DOM node.
		const resolved = await page.evaluate(() => {
			const el = document.querySelector('[role="combobox"]')!;
			const id = el.getAttribute('aria-activedescendant');
			return id !== null && document.getElementById(id) !== null;
		});
		expect(resolved, 'aria-activedescendant points at an unmounted id').toBe(true);
	});

	test('a scrollbar press in the listbox does not close the popup', async ({ page }) => {
		await page.goto('/docs/patterns/virtualized-combobox');
		const input = page.getByRole('combobox');
		await input.click();
		await expect(input).toHaveAttribute('aria-expanded', 'true');

		// A press on the listbox that is NOT on an option — the scrollbar/
		// gutter case (a literal scrollbar hit isn't reachable with headless
		// overlay scrollbars, so simulate its two observable effects: an
		// un-prevented mousedown inside the widget, then the input blur it
		// causes).
		await page.evaluate(() => {
			document
				.querySelector('[role="listbox"]')!
				.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
			(document.querySelector('[role="combobox"]') as HTMLElement).blur();
		});

		await expect(input).toHaveAttribute('aria-expanded', 'true');
		await expect(input).toBeFocused();
	});
});

// ---------------------------------------------------------------------------
// specs/46 — Docs example theme: the import inversion left keyboard focus
// visibility unchanged. Load-bearing proof (R1/R4/Accessibility): the
// content focus-visible ring now ships from $lib/theme/examples/docs/docs.css
// rather than the layout's own <style>, and its exclusion list must still
// hold — field controls and buttons keep the reference theme's own ring.
// ---------------------------------------------------------------------------

test.describe('specs/46 — content focus-visible ring travels with the docs example', () => {
	async function ringStyle(locator: import('@playwright/test').Locator) {
		return locator.evaluate((el) => {
			const cs = getComputedStyle(el);
			return {
				outlineWidth: cs.outlineWidth,
				outlineStyle: cs.outlineStyle,
				outlineOffset: cs.outlineOffset,
				outlineColor: cs.outlineColor,
				color: cs.color,
				boxShadow: cs.boxShadow
			};
		});
	}

	test('a content link gets the offset 2px currentColor ring', async ({ page }) => {
		await page.goto('/docs/theming/examples');
		const link = page.getByRole('link', { name: 'WCAG AA on every graded pairing' });
		await link.focus();
		await expect(link).toBeFocused();

		const ring = await ringStyle(link);
		expect(ring.outlineWidth).toBe('2px');
		expect(ring.outlineStyle).toBe('solid');
		expect(ring.outlineOffset).toBe('2px');
		// currentColor — the painted outline color equals the element's own
		// computed text color, not a hardcoded value.
		expect(ring.outlineColor).toBe(ring.color);
	});

	test('a .hz-button does NOT get the offset ring — it keeps its own themed ring', async ({
		page
	}) => {
		await page.goto('/docs/components/button');
		const button = page.locator('button.hz-button').filter({ visible: true }).first();
		await button.focus();
		await expect(button).toBeFocused();

		const ring = await ringStyle(button);
		// The docs example's exclusion list holds: the broad currentColor ring
		// never painted this element, so its outline stays transparent — the
		// reference theme's own box-shadow ring is what's actually visible.
		expect(ring.outlineColor).not.toBe(ring.color);
		expect(ring.boxShadow).not.toBe('none');
	});

	test('a .hz-field input does NOT get the offset ring — it keeps its own themed ring', async ({
		page
	}) => {
		await page.goto('/docs/components/text-input');
		const input = page.locator('.hz-field input').filter({ visible: true }).first();
		await input.focus();
		await expect(input).toBeFocused();

		const ring = await ringStyle(input);
		// The reference theme suppresses this raw <input>'s own outline entirely
		// (field.css: `.hz-input-wrapper input { outline: none; }`) — the visible
		// ring lives on the wrapper's box-shadow instead. If the docs example's
		// broad ring had NOT excluded this element, its unlayered
		// `outline: 2px solid currentColor` would have overridden that
		// suppression outright (unlayered always beats layered), so
		// outline-style staying 'none' is exactly what proves the exclusion
		// held. (outline-color alone isn't a reliable signal here: browsers
		// still resolve it to currentColor even when outline-style is 'none'.)
		expect(ring.outlineStyle).not.toBe('solid');
	});
});

// ---------------------------------------------------------------------------
// specs/45 — Slider vertical orientation
// ---------------------------------------------------------------------------

test.describe('specs/45 — Slider vertical orientation', () => {
	test('Slider Vertical demo tab renders a track taller than wide', async ({ page }) => {
		await page.goto('/docs/components/slider');
		await page.getByRole('tab', { name: 'Vertical' }).click();
		// Tabs keeps inactive panels in the DOM (hidden) — assert on the visible
		// panel only (docs-page-pattern gotcha).
		const track = page.locator('.hz-slider-track').filter({ visible: true }).first();
		const box = await track.boundingBox();
		if (!box) throw new Error('missing bounding box');
		expect(box.height).toBeGreaterThan(box.width);
	});

	test('Vert-R6: ArrowUp increases a focused vertical thumb, ArrowDown decreases it', async ({
		page
	}) => {
		await page.goto('/docs/components/slider');
		await page.getByRole('tab', { name: 'Vertical' }).click();
		const slider = page.getByRole('slider', { name: 'Elevation', exact: true });
		await slider.focus();
		// Native ranges expose value via the implicit ARIA `valuenow`, computed
		// from the live DOM `value` property — not a reflected attribute — so
		// read `.inputValue()` rather than `getAttribute('aria-valuenow')`.
		const before = Number(await slider.inputValue());
		await page.keyboard.press('ArrowUp');
		const afterUp = Number(await slider.inputValue());
		expect(afterUp).toBeGreaterThan(before);
		await page.keyboard.press('ArrowDown');
		const afterDown = Number(await slider.inputValue());
		expect(afterDown).toBeLessThan(afterUp);
	});

	test('Vert-R3: inputPosition places the number field above the track when "start", below when "end"', async ({
		page
	}) => {
		await page.goto('/docs/components/slider');
		await page.getByRole('tab', { name: 'Vertical' }).click();

		const endRow = page
			.locator('.hz-slider-row[data-input-position="end"]')
			.filter({ visible: true })
			.first();
		const endTrackBox = await endRow.locator('.hz-slider-track').boundingBox();
		const endNumberBox = await endRow.locator('input.hz-slider-number').boundingBox();
		if (!endTrackBox || !endNumberBox) throw new Error('missing bounding box');
		expect(endNumberBox.y).toBeGreaterThan(endTrackBox.y);

		const startRow = page
			.locator('.hz-slider-row[data-input-position="start"]')
			.filter({ visible: true })
			.first();
		const startTrackBox = await startRow.locator('.hz-slider-track').boundingBox();
		const startNumberBox = await startRow.locator('input.hz-slider-number').boundingBox();
		if (!startTrackBox || !startNumberBox) throw new Error('missing bounding box');
		expect(startNumberBox.y).toBeLessThan(startTrackBox.y);
	});

	test('RangeSlider Vertical demo tab renders a track taller than wide', async ({ page }) => {
		await page.goto('/docs/components/range-slider');
		await page.getByRole('tab', { name: 'Vertical' }).click();
		const track = page.locator('.hz-slider-track').filter({ visible: true }).first();
		const box = await track.boundingBox();
		if (!box) throw new Error('missing bounding box');
		expect(box.height).toBeGreaterThan(box.width);
	});

	test('Vert-R6/R7: ArrowUp increases a focused vertical RangeSlider thumb', async ({ page }) => {
		await page.goto('/docs/components/range-slider');
		await page.getByRole('tab', { name: 'Vertical' }).click();
		const minThumb = page.getByRole('slider', {
			name: 'Hole length (vertical) (minimum)',
			exact: true
		});
		await minThumb.focus();
		const before = Number(await minThumb.inputValue());
		await page.keyboard.press('ArrowUp');
		const after = Number(await minThumb.inputValue());
		expect(after).toBeGreaterThan(before);
	});

	test('Vert-R3: RangeSlider min–max cluster stays above the track when inputPosition="start"', async ({
		page
	}) => {
		await page.goto('/docs/components/range-slider');
		await page.getByRole('tab', { name: 'Vertical' }).click();
		const startRow = page
			.locator('.hz-slider-row[data-input-position="start"]')
			.filter({ visible: true })
			.first();
		const startTrackBox = await startRow.locator('.hz-slider-track').boundingBox();
		const startClusterBox = await startRow.locator('.hz-slider-inputs').boundingBox();
		if (!startTrackBox || !startClusterBox) throw new Error('missing bounding box');
		expect(startClusterBox.y).toBeLessThan(startTrackBox.y);
	});
});

// ---------------------------------------------------------------------------
// Product detail pattern — vertical thumbnail strip synced to the Carousel
// ---------------------------------------------------------------------------

test.describe('Product detail pattern — thumbnail strip', () => {
	test('clicking a thumb pages the carousel and marks that thumb aria-current', async ({
		page
	}) => {
		await page.goto('/docs/patterns/product-detail');
		const thumbs = page.locator('.pdp-thumb');
		await expect(thumbs).toHaveCount(3);
		await expect(thumbs.first()).toHaveAttribute('aria-current', 'true');

		await thumbs.nth(1).click();
		await expect(thumbs.nth(1)).toHaveAttribute('aria-current', 'true');
		await expect(thumbs.first()).not.toHaveAttribute('aria-current', 'true');
		await expect(page.locator('.hz-carousel-slide[data-active]')).toHaveAttribute(
			'aria-label',
			(await thumbs.nth(1).getAttribute('aria-label')) ?? ''
		);
	});

	test('paging the carousel moves the active thumb back', async ({ page }) => {
		await page.goto('/docs/patterns/product-detail');
		await page.getByRole('button', { name: 'Next slide' }).click();
		await expect(page.locator('.pdp-thumb').nth(1)).toHaveAttribute('aria-current', 'true');
	});

	test('thumbs are a labeled group of buttons and never open the lightbox viewer', async ({
		page
	}) => {
		await page.goto('/docs/patterns/product-detail');
		await expect(page.getByRole('group', { name: 'Choose a colorway' })).toBeVisible();
		await page.locator('.pdp-thumb').nth(1).click();
		await expect(page.getByRole('dialog')).toHaveCount(0);
	});

	test('the active slide still opens the lightbox viewer via keyboard', async ({ page }) => {
		await page.goto('/docs/patterns/product-detail');
		const activeSlideImg = page.locator('.hz-carousel-slide[data-active] img').first();
		await activeSlideImg.focus();
		await page.keyboard.press('Enter');
		await expect(page.getByRole('dialog')).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// specs/49 amendment (2026-07-27) — Loading ring variant
// ---------------------------------------------------------------------------

test.describe('specs/49 amendment — Loading ring variant', () => {
	test('the Variants tab shows an indeterminate ring and a determinate ring, both real SVGs', async ({
		page
	}) => {
		await page.goto('/docs/components/loading');
		const rings = page.locator('.hz-loading svg.hz-loading-ring').filter({ visible: true });
		// Indeterminate (no readout) + determinate (with a centered readout).
		await expect(rings).toHaveCount(2);
		await expect(
			page.locator('.hz-loading-ring-wrapper .hz-loading-value').filter({ visible: true })
		).toBeVisible();
	});

	test('the Intents and Sizes tabs include a ring alongside spinner/bar/dots in every row', async ({
		page
	}) => {
		await page.goto('/docs/components/loading');
		await page.getByRole('tab', { name: 'Intents' }).click();
		const intentsPanel = page.locator('.tab-content').filter({ visible: true }).first();
		await expect(intentsPanel.locator('svg.hz-loading-ring').first()).toBeVisible();

		await page.getByRole('tab', { name: 'Sizes' }).click();
		const sizesPanel = page.locator('.tab-content').filter({ visible: true }).first();
		await expect(sizesPanel.locator('svg.hz-loading-ring').first()).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// specs/50 — Tooltip
// ---------------------------------------------------------------------------

test.describe('specs/50 — Tooltip', () => {
	test('hovering the trigger reveals the tooltip, positioned near it (not at 0,0)', async ({
		page
	}) => {
		await page.goto('/docs/components/tooltip');
		const trigger = page.getByRole('button', { name: 'Add to bag' });
		await trigger.hover();
		const tooltipEl = page.locator('.hz-tooltip[data-state="open"]');
		await expect(tooltipEl).toBeVisible();

		const triggerBox = await trigger.boundingBox();
		const tooltipBox = await tooltipEl.boundingBox();
		if (!triggerBox || !tooltipBox) throw new Error('missing bounding box');

		// Real geometry, not a stub — the tooltip must not be pinned at the
		// viewport's top-left corner, and must sit near the trigger.
		expect(tooltipBox.x === 0 && tooltipBox.y === 0).toBe(false);
		const horizontalGap = Math.max(
			triggerBox.x - (tooltipBox.x + tooltipBox.width),
			tooltipBox.x - (triggerBox.x + triggerBox.width),
			0
		);
		const verticalGap = Math.max(
			triggerBox.y - (tooltipBox.y + tooltipBox.height),
			tooltipBox.y - (triggerBox.y + triggerBox.height),
			0
		);
		// Default placement is 'top': the tooltip sits directly above, so the
		// horizontal gap should be ~0 (overlapping columns) and the vertical
		// gap small (offset + tolerance).
		expect(horizontalGap).toBeLessThan(triggerBox.width);
		expect(verticalGap).toBeLessThan(40);
	});

	test('focusing the trigger reveals the tooltip immediately; the trigger carries aria-describedby to a role="tooltip" node', async ({
		page
	}) => {
		await page.goto('/docs/components/tooltip');
		const trigger = page.getByRole('button', { name: 'Add to bag' });
		await trigger.focus();
		const tooltipEl = page.locator('.hz-tooltip[data-state="open"]');
		await expect(tooltipEl).toBeVisible();
		await expect(tooltipEl).toHaveAttribute('role', 'tooltip');

		const describedBy = await trigger.getAttribute('aria-describedby');
		const tooltipId = await tooltipEl.getAttribute('id');
		expect(describedBy).toBe(tooltipId);
	});

	test('Escape dismisses the tooltip', async ({ page }) => {
		await page.goto('/docs/components/tooltip');
		const trigger = page.getByRole('button', { name: 'Add to bag' });
		await trigger.hover();
		await expect(page.locator('.hz-tooltip[data-state="open"]')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.locator('.hz-tooltip[data-state="open"]')).toHaveCount(0);
	});

	test('moving the pointer onto the tooltip itself keeps it open (hoverable bridge)', async ({
		page
	}) => {
		await page.goto('/docs/components/tooltip');
		await page.getByRole('tab', { name: 'Hover & keyboard' }).click();
		const trigger = page.getByRole('button', { name: 'Info' });
		await trigger.hover();
		const tooltipEl = page.locator('.hz-tooltip[data-state="open"]');
		await expect(tooltipEl).toBeVisible();

		await tooltipEl.hover();
		// Held for well past the 150ms closeDelay — still visible since the
		// pointer is on the tooltip, not the trigger.
		await page.waitForTimeout(300);
		await expect(tooltipEl).toBeVisible();
	});

	test('a forced no-anchor-positioning fallback still positions the tooltip near the trigger', async ({
		page
	}) => {
		// Force the JS measure-and-place fallback (R-POS-4) by making the
		// anchor-positioning probe fail, exactly as the unit tests do, but
		// against a real page/browser instead of a stub.
		await page.addInitScript(() => {
			const original = CSS.supports.bind(CSS);
			CSS.supports = ((...args: Parameters<typeof CSS.supports>) => {
				if (typeof args[0] === 'string' && args[0].includes('anchor-name')) return false;
				return original(...args);
			}) as typeof CSS.supports;
		});
		await page.goto('/docs/components/tooltip');
		const trigger = page.getByRole('button', { name: 'Add to bag' });
		await trigger.hover();
		const tooltipEl = page.locator('.hz-tooltip[data-state="open"]');
		await expect(tooltipEl).toBeVisible();

		const triggerBox = await trigger.boundingBox();
		const tooltipBox = await tooltipEl.boundingBox();
		if (!triggerBox || !tooltipBox) throw new Error('missing bounding box');
		expect(tooltipBox.x === 0 && tooltipBox.y === 0).toBe(false);
		expect(Math.abs(tooltipBox.x - triggerBox.x)).toBeLessThan(triggerBox.width + 40);
	});

	test('both examples on the page are keyboard-operable and every h2 has a stable id (TOC)', async ({
		page
	}) => {
		await page.goto('/docs/components/tooltip');
		await expect(page.locator('h2#demo-heading')).toHaveCount(1);
		await expect(page.locator('h2#props-heading')).toHaveCount(1);
		await expect(page.locator('h2#a11y-heading')).toHaveCount(1);
	});

	// -------------------------------------------------------------------------
	// R-THEME-2 — a tooltip shown with its trigger flush to each viewport
	// edge must never grow the document's scrollable area — real geometry
	// against a real browser, both positioning paths. (The library ships no
	// arrow — a consumer caret keyed off data-side relies on this same
	// scrollbar-free posture.)
	// -------------------------------------------------------------------------

	/** Relocates an already-tooltip-enhanced trigger (its `{@attach
	 *  tooltip(...)}` listeners are closures over the element, so moving it
	 *  in the viewport doesn't disturb them) flush against a viewport edge,
	 *  hovers it, and asserts no horizontal scrollbar appeared. The docs
	 *  shell's own fixed sidebar/nav chrome would otherwise obstruct a
	 *  trigger relocated to a screen edge — hidden once per page so hover
	 *  hit-tests the trigger itself, not the shell. */
	async function assertEdgeFlushTooltipIsScrollbarSafe(
		page: Page,
		buttonName: string,
		style: Record<string, string>
	): Promise<void> {
		await page.evaluate(() => {
			for (const sel of ['#docs-sidebar', '.docs-header', 'header']) {
				document.querySelectorAll(sel).forEach((el) => {
					(el as HTMLElement).style.display = 'none';
				});
			}
		});
		const trigger = page.getByRole('button', { name: buttonName, exact: true });
		await trigger.evaluate((el: HTMLElement, style) => Object.assign(el.style, style), style);
		await trigger.hover();
		const tooltipEl = page.locator('.hz-tooltip[data-state="open"]');
		await expect(tooltipEl).toBeVisible();

		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth <= document.documentElement.clientWidth
		);
		expect(overflow, `horizontal scrollbar appeared for "${buttonName}"`).toBe(true);
	}

	test('the tooltip never causes a horizontal scrollbar with the trigger flush to each viewport edge (anchor path)', async ({
		page
	}) => {
		await page.goto('/docs/components/tooltip');
		await page.getByRole('tab', { name: 'Placement' }).click();

		await assertEdgeFlushTooltipIsScrollbarSafe(page, 'top', {
			position: 'fixed',
			top: '2px',
			left: '200px'
		});
		await assertEdgeFlushTooltipIsScrollbarSafe(page, 'bottom', {
			position: 'fixed',
			bottom: '2px',
			left: '200px'
		});
		await assertEdgeFlushTooltipIsScrollbarSafe(page, 'left', {
			position: 'fixed',
			top: '300px',
			left: '2px'
		});
		await assertEdgeFlushTooltipIsScrollbarSafe(page, 'right', {
			position: 'fixed',
			top: '300px',
			right: '2px'
		});
	});

	test('the tooltip never causes a horizontal scrollbar with the trigger flush to each viewport edge (forced JS-fallback path)', async ({
		page
	}) => {
		await page.addInitScript(() => {
			const original = CSS.supports.bind(CSS);
			CSS.supports = ((...args: Parameters<typeof CSS.supports>) => {
				if (typeof args[0] === 'string' && args[0].includes('anchor-name')) return false;
				return original(...args);
			}) as typeof CSS.supports;
		});
		await page.goto('/docs/components/tooltip');
		await page.getByRole('tab', { name: 'Placement' }).click();

		await assertEdgeFlushTooltipIsScrollbarSafe(page, 'top', {
			position: 'fixed',
			top: '2px',
			left: '200px'
		});
		await assertEdgeFlushTooltipIsScrollbarSafe(page, 'bottom', {
			position: 'fixed',
			bottom: '2px',
			left: '200px'
		});
		await assertEdgeFlushTooltipIsScrollbarSafe(page, 'left', {
			position: 'fixed',
			top: '300px',
			left: '2px'
		});
		await assertEdgeFlushTooltipIsScrollbarSafe(page, 'right', {
			position: 'fixed',
			top: '300px',
			right: '2px'
		});
	});

	// -------------------------------------------------------------------------
	// R-POS-6 — RTL: left/right resolve through the trigger's direction.
	// -------------------------------------------------------------------------

	test('a trigger inside dir="rtl" flips a left/right tooltip to the opposite physical side; block-axis flip/shift stay correct', async ({
		page
	}) => {
		await page.goto('/docs/components/tooltip');
		await page.getByRole('tab', { name: 'Placement' }).click();

		const leftTrigger = page.getByRole('button', { name: 'left', exact: true });
		await leftTrigger.evaluate((el: HTMLElement) => el.setAttribute('dir', 'rtl'));
		const leftTriggerBox = await leftTrigger.boundingBox();
		await leftTrigger.hover();
		const tooltipEl = page.locator('.hz-tooltip[data-state="open"]');
		await expect(tooltipEl).toBeVisible();
		await expect(tooltipEl).toHaveAttribute('data-side', 'right');
		const tooltipBox = await tooltipEl.boundingBox();
		if (!leftTriggerBox || !tooltipBox) throw new Error('missing bounding box');
		// 'left' under RTL renders on the physical right — the tooltip's left
		// edge should sit at/after the trigger's right edge, not before it.
		expect(tooltipBox.x).toBeGreaterThanOrEqual(leftTriggerBox.x + leftTriggerBox.width - 1);
		await page.mouse.move(0, 0);

		// Block axis (top/bottom) is unaffected by direction: flip/shift stay
		// correct for an RTL trigger too. The docs shell's own fixed sidebar
		// would otherwise obstruct a trigger relocated to the top edge.
		await page.evaluate(() => {
			document
				.querySelectorAll('#docs-sidebar')
				.forEach((el) => ((el as HTMLElement).style.display = 'none'));
		});
		await page.getByRole('button', { name: 'top', exact: true }).evaluate((el: HTMLElement) => {
			el.setAttribute('dir', 'rtl');
			Object.assign(el.style, { position: 'fixed', top: '2px', left: '200px' });
		});
		const topTrigger = page.getByRole('button', { name: 'top', exact: true });
		await topTrigger.hover();
		const flippedTooltip = page.locator('.hz-tooltip[data-state="open"]');
		await expect(flippedTooltip).toBeVisible();
		await expect(flippedTooltip).toHaveAttribute('data-side', 'bottom');
	});
});

// ---------------------------------------------------------------------------
// specs/50 — Popover
// ---------------------------------------------------------------------------

test.describe('specs/50 — Popover', () => {
	test('clicking the trigger opens the panel and flips aria-expanded; positioned adjacent to the trigger, not pinned at 0,0', async ({
		page
	}) => {
		// A tall viewport guarantees room below the trigger, so the native
		// flip-block fallback never kicks in here — a separate assertion
		// below (adjacentGap) tolerates a flip either way regardless.
		await page.setViewportSize({ width: 1280, height: 1400 });
		await page.goto('/docs/components/popover');
		const trigger = page.getByRole('button', { name: 'Filters' });
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await trigger.click();
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');

		const panel = page.locator('.hz-popover-panel[data-state="open"]');
		await expect(panel).toBeVisible();

		const triggerBox = await trigger.boundingBox();
		const panelBox = await panel.boundingBox();
		if (!triggerBox || !panelBox) throw new Error('missing bounding box');
		expect(panelBox.x === 0 && panelBox.y === 0).toBe(false);
		// bottom-start (the page's default placement): the panel's top edge
		// should sit close to the trigger's bottom edge (or, if a genuine
		// overflow forced the native flip-block fallback, close to the
		// trigger's top edge instead) — either way, adjacent, never centered
		// or pinned elsewhere in the viewport.
		const gapBelow = Math.abs(panelBox.y - (triggerBox.y + triggerBox.height));
		const gapAbove = Math.abs(triggerBox.y - (panelBox.y + panelBox.height));
		expect(Math.min(gapBelow, gapAbove)).toBeLessThan(40);
		// start-aligned: the panel's left edge lines up with the trigger's.
		expect(Math.abs(panelBox.x - triggerBox.x)).toBeLessThan(4);
	});

	test('Escape closes the panel and returns focus to the trigger', async ({ page }) => {
		await page.goto('/docs/components/popover');
		const trigger = page.getByRole('button', { name: 'Filters' });
		await trigger.click();
		await expect(page.locator('.hz-popover-panel[data-state="open"]')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.locator('.hz-popover-panel[data-state="open"]')).toHaveCount(0);
		await expect(trigger).toBeFocused();
	});

	test('an outside click light-dismisses the panel', async ({ page }) => {
		await page.goto('/docs/components/popover');
		const trigger = page.getByRole('button', { name: 'Filters' });
		await trigger.click();
		await expect(page.locator('.hz-popover-panel[data-state="open"]')).toBeVisible();
		await page.locator('h1').click();
		await expect(page.locator('.hz-popover-panel[data-state="open"]')).toHaveCount(0);
	});

	test('an interactive control inside the panel is operable', async ({ page }) => {
		await page.goto('/docs/components/popover');
		const trigger = page.getByRole('button', { name: 'Filters' });
		await trigger.click();
		const checkbox = page.getByRole('checkbox', { name: 'Finished rounds' });
		const wasChecked = await checkbox.isChecked();
		await checkbox.click();
		expect(await checkbox.isChecked()).toBe(!wasChecked);
	});

	test('no backdrop element is present', async ({ page }) => {
		await page.goto('/docs/components/popover');
		const trigger = page.getByRole('button', { name: 'Filters' });
		await trigger.click();
		await expect(page.locator('.hz-popover-panel[data-state="open"]')).toBeVisible();
		expect(await page.locator('[class*="backdrop"]').count()).toBe(0);
	});

	test('the open panel is not a scroll container and grows no document scrollbar (consumer-caret posture)', async ({
		page
	}) => {
		await page.goto('/docs/components/popover');
		await page.getByRole('button', { name: 'Filters' }).click();
		const panel = page.locator('.hz-popover-panel[data-state="open"]');
		await expect(panel).toBeVisible();
		// A consumer caret keys off the resolved data-side — pin its presence.
		await expect(panel).toHaveAttribute('data-side', /^(top|bottom|left|right)$/);

		// The library ships no arrow, but a consumer-drawn caret must be able
		// to protrude past the panel edge: the panel must NOT be a scroll
		// container (the UA [popover] stylesheet defaults it to overflow:
		// auto, which would clip/scrollbar a protruding caret — scrolling
		// lives on .hz-popover-content instead), and the top-layer fixed
		// panel must never grow a document scrollbar.
		const overflow = await page.evaluate(() => {
			const p = document.querySelector('.hz-popover-panel[data-state="open"]')!;
			const s = getComputedStyle(p);
			return {
				doc: document.documentElement.scrollWidth > document.documentElement.clientWidth,
				panelScrolls: s.overflowX !== 'visible' || s.overflowY !== 'visible',
				contentScrolls:
					getComputedStyle(p.querySelector('.hz-popover-content')!).overflowY === 'auto'
			};
		});
		expect(overflow.doc, 'open panel grew a document scrollbar').toBe(false);
		expect(overflow.panelScrolls, 'panel is a scroll container — a consumer caret would clip').toBe(
			false
		);
		expect(overflow.contentScrolls, '.hz-popover-content lost its scroll role').toBe(true);
	});

	test('a forced no-anchor-positioning fallback still positions the panel near the trigger', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 1400 });
		await page.addInitScript(() => {
			const original = CSS.supports.bind(CSS);
			CSS.supports = ((...args: Parameters<typeof CSS.supports>) => {
				if (typeof args[0] === 'string' && args[0].includes('anchor-name')) return false;
				return original(...args);
			}) as typeof CSS.supports;
		});
		await page.goto('/docs/components/popover');
		const trigger = page.getByRole('button', { name: 'Filters' });
		await trigger.click();
		const panel = page.locator('.hz-popover-panel[data-state="open"]');
		await expect(panel).toBeVisible();

		const triggerBox = await trigger.boundingBox();
		const panelBox = await panel.boundingBox();
		if (!triggerBox || !panelBox) throw new Error('missing bounding box');
		expect(panelBox.x === 0 && panelBox.y === 0).toBe(false);
		const gapBelow = Math.abs(panelBox.y - (triggerBox.y + triggerBox.height));
		const gapAbove = Math.abs(triggerBox.y - (panelBox.y + panelBox.height));
		expect(Math.min(gapBelow, gapAbove)).toBeLessThan(40);
	});

	test('the page renders with every example operable and every h2 has a stable id (TOC)', async ({
		page
	}) => {
		await page.goto('/docs/components/popover');
		await expect(page.locator('h2#demo-heading')).toHaveCount(1);
		await expect(page.locator('h2#props-heading')).toHaveCount(1);
		await expect(page.locator('h2#a11y-heading')).toHaveCount(1);
	});
});

// ---------------------------------------------------------------------------
// specs/51 — Dropdown on the positioning core
// ---------------------------------------------------------------------------

test.describe('specs/51 — Dropdown positioning', () => {
	/** The open menu, scoped through the root's data-open (data-side/
	 *  data-align persist on the menu after close, so they cannot double as an
	 *  "is it open" signal — the Popover/Tooltip data-state precedent, applied
	 *  through the root here since the menu itself carries no such attribute). */
	const OPEN_MENU = '.hz-dropdown[data-open] .hz-dropdown-menu';

	async function forceJsFallback(page: Page): Promise<void> {
		await page.addInitScript(() => {
			const original = CSS.supports.bind(CSS);
			CSS.supports = ((...args: Parameters<typeof CSS.supports>) => {
				if (typeof args[0] === 'string' && args[0].includes('anchor-name')) return false;
				return original(...args);
			}) as typeof CSS.supports;
		});
	}

	async function assertAdjacentNotAtOrigin(page: Page): Promise<void> {
		await page.goto('/docs/components/dropdown');
		const trigger = page.getByRole('button', { name: 'Round actions' });
		await trigger.click();
		const menu = page.locator(OPEN_MENU);
		await expect(menu).toBeVisible();

		const triggerBox = await trigger.boundingBox();
		const menuBox = await menu.boundingBox();
		if (!triggerBox || !menuBox) throw new Error('missing bounding box');
		expect(menuBox.x === 0 && menuBox.y === 0).toBe(false);
		const gapBelow = Math.abs(menuBox.y - (triggerBox.y + triggerBox.height));
		const gapAbove = Math.abs(triggerBox.y - (menuBox.y + menuBox.height));
		expect(Math.min(gapBelow, gapAbove)).toBeLessThan(20);
		// align="start" (default): the menu's left edge lines up with the
		// trigger's.
		expect(Math.abs(menuBox.x - triggerBox.x)).toBeLessThan(4);
	}

	test('the menu opens adjacent to the trigger, not pinned at 0,0 (anchor path)', async ({
		page
	}) => {
		await assertAdjacentNotAtOrigin(page);
	});

	test('the menu opens adjacent to the trigger, not pinned at 0,0 (forced JS-fallback path)', async ({
		page
	}) => {
		await forceJsFallback(page);
		await assertAdjacentNotAtOrigin(page);
	});

	/** Hides the docs shell's own fixed chrome (it would otherwise obstruct a
	 *  trigger relocated to a screen edge — the Tooltip e2e precedent), pins
	 *  the trigger flush to the viewport's bottom edge, opens the menu, and
	 *  asserts it flipped above and stayed fully on-screen. */
	async function assertBottomFlushFlipsAbove(page: Page): Promise<void> {
		await page.goto('/docs/components/dropdown');
		await page.evaluate(() => {
			for (const sel of ['#docs-sidebar', '.docs-header', 'header']) {
				document.querySelectorAll(sel).forEach((el) => {
					(el as HTMLElement).style.display = 'none';
				});
			}
		});
		const trigger = page.getByRole('button', { name: 'Round actions' });
		await trigger.evaluate((el: HTMLElement) => {
			Object.assign(el.style, { position: 'fixed', bottom: '4px', left: '200px' });
		});
		await trigger.click();
		const menu = page.locator(OPEN_MENU);
		await expect(menu).toBeVisible();
		await expect(menu).toHaveAttribute('data-side', 'top');

		const menuBox = await menu.boundingBox();
		const viewport = page.viewportSize();
		if (!menuBox || !viewport) throw new Error('missing geometry');
		expect(menuBox.y).toBeGreaterThanOrEqual(0);
		expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(viewport.height + 1);
	}

	test('a trigger near the viewport bottom flips the menu above and keeps it fully on-screen (anchor path)', async ({
		page
	}) => {
		await assertBottomFlushFlipsAbove(page);
	});

	test('a trigger near the viewport bottom flips the menu above and keeps it fully on-screen (forced JS-fallback path)', async ({
		page
	}) => {
		await forceJsFallback(page);
		await assertBottomFlushFlipsAbove(page);
	});

	test('a trigger inside an overflow: hidden ancestor still shows a fully clickable menu (top-layer escape)', async ({
		page
	}) => {
		await page.goto('/docs/components/dropdown');
		// The demo frame around the trigger — clipped down to 60px tall. The
		// pre-move, absolutely-positioned menu would have been cut off along
		// with its ancestor; the top-layer popover must not be.
		await page.evaluate(() => {
			const example = document.querySelector('.doc-example') as HTMLElement;
			example.style.overflow = 'hidden';
			example.style.height = '60px';
		});
		const trigger = page.getByRole('button', { name: 'Round actions' });
		await trigger.click();
		const menu = page.locator(OPEN_MENU);
		await expect(menu).toBeVisible();

		// The item furthest from the trigger stays real-clickable, and its
		// action actually reaches the page — proof the full menu escaped the
		// clip, not just that some node reports "visible."
		await page.getByRole('menuitem', { name: 'Share round' }).click();
		await expect(page.getByText('Last action: Share round')).toBeVisible();
	});

	// -------------------------------------------------------------------------
	// R-DD-6 — RTL: align="start"/"end" are logical, resolved through the
	// trigger's direction, on both positioning paths.
	// -------------------------------------------------------------------------

	async function assertRtlAlignEquivalence(page: Page): Promise<void> {
		await page.goto('/docs/components/dropdown');

		// align="start" (default, Basic tab) under RTL attaches to the
		// trigger's right edge.
		const startTrigger = page.getByRole('button', { name: 'Round actions' });
		await startTrigger.evaluate((el: HTMLElement) => el.setAttribute('dir', 'rtl'));
		const startTriggerBox = await startTrigger.boundingBox();
		await startTrigger.click();
		const startMenu = page.locator(OPEN_MENU);
		await expect(startMenu).toBeVisible();
		await expect(startMenu).toHaveAttribute('data-align', 'end');
		const startMenuBox = await startMenu.boundingBox();
		if (!startTriggerBox || !startMenuBox) throw new Error('missing bounding box');
		expect(
			Math.abs(startMenuBox.x + startMenuBox.width - (startTriggerBox.x + startTriggerBox.width))
		).toBeLessThan(4);
		await startTrigger.click(); // close

		// align="end" (Alignment tab, the "End" trigger) under RTL attaches to
		// the trigger's left edge instead.
		await page.getByRole('tab', { name: 'Alignment' }).click();
		const endTrigger = page.getByRole('button', { name: 'End', exact: true });
		await endTrigger.evaluate((el: HTMLElement) => el.setAttribute('dir', 'rtl'));
		const endTriggerBox = await endTrigger.boundingBox();
		await endTrigger.click();
		const endMenu = page.locator(OPEN_MENU);
		await expect(endMenu).toBeVisible();
		await expect(endMenu).toHaveAttribute('data-align', 'start');
		const endMenuBox = await endMenu.boundingBox();
		if (!endTriggerBox || !endMenuBox) throw new Error('missing bounding box');
		expect(Math.abs(endMenuBox.x - endTriggerBox.x)).toBeLessThan(4);
	}

	test('dir="rtl" flips align="start"/"end" to the opposite physical edge (anchor path)', async ({
		page
	}) => {
		await assertRtlAlignEquivalence(page);
	});

	test('dir="rtl" flips align="start"/"end" to the opposite physical edge (forced JS-fallback path)', async ({
		page
	}) => {
		await forceJsFallback(page);
		await assertRtlAlignEquivalence(page);
	});
});

// ---------------------------------------------------------------------------
// specs/51 — /foundation/positioning
// ---------------------------------------------------------------------------

test.describe('specs/51 — Positioning (foundation page)', () => {
	test('every section renders with a stable h2 id (TOC)', async ({ page }) => {
		await page.goto('/docs/foundation/positioning');
		for (const id of [
			'vocabulary-heading',
			'logical-heading',
			'toplayer-heading',
			'flip-heading',
			'caret-heading',
			'a11y-heading'
		]) {
			await expect(page.locator(`h2#${id}`)).toHaveCount(1);
		}
	});

	test('the flip demo renders above mid-page, then flips below as the trigger nears the viewport top', async ({
		page
	}) => {
		await page.goto('/docs/foundation/positioning');
		const trigger = page.getByRole('button', { name: 'Focus me, then scroll' });
		await trigger.hover();
		const tip = page.locator('.hz-tooltip[data-state="open"]');
		await expect(tip).toBeVisible();

		// Mid-page there is room above: the requested placement: 'top' holds.
		const triggerBox1 = await trigger.boundingBox();
		const tipBox1 = await tip.boundingBox();
		if (!triggerBox1 || !tipBox1) throw new Error('missing bounding box');
		expect(
			tipBox1.y + tipBox1.height,
			'tooltip should start above the trigger'
		).toBeLessThanOrEqual(triggerBox1.y + 1);

		// Focus holds the tooltip open (hover would let go); scroll the PAGE
		// so the trigger nears the window's top edge — no room above forces
		// the live flip below, on whichever positioning path is active.
		await trigger.focus();
		await trigger.evaluate((el) => {
			window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 8);
		});
		await expect(async () => {
			const triggerBox2 = await trigger.boundingBox();
			const tipBox2 = await tip.boundingBox();
			if (!triggerBox2 || !tipBox2) throw new Error('missing bounding box');
			expect(tipBox2.y, 'tooltip should flip below the trigger').toBeGreaterThanOrEqual(
				triggerBox2.y + triggerBox2.height - 1
			);
		}).toPass({ timeout: 3000 });
		// Mid-flip, data-side must track the rendered side (a consumer caret
		// keys off it).
		await expect(tip).toHaveAttribute('data-side', 'bottom');

		// EAGER RESTORE: scroll back so there's room above again — the
		// requested side must win back immediately, not only after the
		// flipped side runs out of room in turn (native position-try
		// remembers its last option; the core flushes it).
		await trigger.evaluate((el) => {
			window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2);
		});
		await expect(async () => {
			const triggerBox3 = await trigger.boundingBox();
			const tipBox3 = await tip.boundingBox();
			if (!triggerBox3 || !tipBox3) throw new Error('missing bounding box');
			expect(
				tipBox3.y + tipBox3.height,
				'tooltip should return above once there is room again'
			).toBeLessThanOrEqual(triggerBox3.y + 1);
		}).toPass({ timeout: 3000 });
		await expect(tip).toHaveAttribute('data-side', 'top');
	});

	test('the caret recipe code sample is present and its live demo draws a protruding caret without scrollbars', async ({
		page
	}) => {
		await page.goto('/docs/foundation/positioning');
		const section = page.locator('section', { has: page.locator('#caret-heading') });
		// .last(): the recipe CodeBlock — the live demo (and its own example
		// code block) leads the section, the recipe CSS closes it.
		await expect(section.locator('.hz-code-block').last()).toContainText("[data-side='bottom']");

		// The live demo: the page-scoped recipe CSS must actually render a
		// protruding ::after on the demo tooltip, without growing the page.
		await section.getByRole('button', { name: 'Hover for a caret' }).hover();
		const tip = page.locator('.hz-tooltip.demo-caret[data-state="open"]');
		await expect(tip).toBeVisible();
		const caret = await tip.evaluate((el) => {
			const s = getComputedStyle(el, '::after');
			const tipStyle = getComputedStyle(el);
			return {
				content: s.content,
				protrudes: [s.top, s.right, s.bottom, s.left].some((v) => parseFloat(v) < 0),
				// The UA [popover] stylesheet defaults the tooltip to
				// overflow: auto — a scroll container CLIPS the protruding
				// caret inside the tooltip (and grows a tooltip scrollbar)
				// instead of drawing it past the edge.
				tooltipScrolls: tipStyle.overflowX !== 'visible' || tipStyle.overflowY !== 'visible'
			};
		});
		expect(caret.content, 'demo caret ::after did not render').not.toBe('none');
		expect(caret.protrudes, 'demo caret does not protrude past the tooltip edge').toBe(true);
		expect(caret.tooltipScrolls, 'tooltip is a scroll container — the caret gets clipped').toBe(
			false
		);
		const noOverflow = await page.evaluate(
			() => document.documentElement.scrollWidth <= document.documentElement.clientWidth
		);
		expect(noOverflow, 'caret demo grew a horizontal scrollbar').toBe(true);
	});

	// No-overflow at 375/768/1280 and the manifest-route smoke (h1, skip
	// link) are covered by the sweeps at the top of this file — it runs over
	// every manifest route, and /foundation/positioning is one.
});
