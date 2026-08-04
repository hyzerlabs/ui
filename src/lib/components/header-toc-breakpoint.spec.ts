/**
 * specs/64 — Header/Toc's `mobileBreakpoint` / `breakpoint` numeric mode.
 *
 * Two concerns that both need the `server` (node) project rather than the
 * `client` (browser) one: R6's source-scan (reading the raw `.svelte` text,
 * the `parallax.spec.ts` / `horizontal-scroll.spec.ts` precedent), and R2/R5's
 * SSR-markup assertions (`render` from `svelte/server`, the `Metatags.spec.ts`
 * precedent) — a `.svelte.spec.ts` file always runs in the `client` project
 * (vite.config.ts), where `svelte/server`'s `render()` cannot run against a
 * client-compiled component.
 *
 * Toc's own visibility gate (`entries.length >= minEntries`) blocks every SSR
 * render unless `minEntries: 0` — collection is DOM-driven (an `$effect`,
 * which never runs during `render()`), so an SSR pass always starts from zero
 * entries. `minEntries: 0` is the only prop needed to observe the root
 * `<nav>`'s own attributes; it says nothing about a real page's entries.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from 'svelte/server';
import Header from './Header.svelte';
import Toc from './Toc.svelte';
import type { NavItem } from '$lib/types';

const COMPONENTS = join(process.cwd(), 'src/lib/components');

// ---------------------------------------------------------------------------
// R6 — each component's own three-entry tier table cannot drift from the
// literal `min-width:` values in its own query rules.
// ---------------------------------------------------------------------------

function readComponentSource(file: string): string {
	return readFileSync(join(COMPONENTS, file), 'utf8');
}

/** The `const TIERS = { sm: …, md: …, lg: … }` table, read from the raw text. */
function extractTiers(source: string): { sm: number; md: number; lg: number } {
	const table = source.match(/const TIERS = \{([^}]+)\}/);
	expect(table, 'TIERS table not found').not.toBeNull();
	const body = table![1];
	const get = (key: string): number => {
		const m = body.match(new RegExp(`${key}:\\s*(\\d+)`));
		expect(m, `TIERS.${key} not found`).not.toBeNull();
		return Number(m![1]);
	};
	return { sm: get('sm'), md: get('md'), lg: get('lg') };
}

/** Every `min-width: NNNpx` literal inside the component's `<style>` block, in source order. */
function extractStyleMinWidths(source: string): number[] {
	const style = source.match(/<style>([\s\S]*)<\/style>/);
	expect(style, 'no <style> block found').not.toBeNull();
	return [...style![1].matchAll(/min-width:\s*(\d+)px/g)].map((m) => Number(m[1]));
}

describe.each([
	{ file: 'Header.svelte', query: '@container' },
	{ file: 'Toc.svelte', query: '@media' }
])('R6 — $file: TIERS matches every $query min-width literal', ({ file }) => {
	it('the table equals the literals, in the same sm/md/lg order, and vice versa', () => {
		const source = readComponentSource(file);
		const tiers = extractTiers(source);
		const literals = extractStyleMinWidths(source);
		expect(literals, `${file}: style-block min-width literals`).toEqual([
			tiers.sm,
			tiers.md,
			tiers.lg
		]);
	});
});

// ---------------------------------------------------------------------------
// R2 — Header SSR: the fallback-tier attribute, never 'custom', pre-hydration.
// ---------------------------------------------------------------------------

const items: NavItem[] = [{ label: 'Home', href: '/' }];

describe('R2 — Header SSR: pre-hydration fallback tier', () => {
	it('668 → data-mobile-breakpoint="sm", no data-collapsed', () => {
		const { body } = render(Header, { props: { items, mobileBreakpoint: 668 } });
		expect(body).toContain('data-mobile-breakpoint="sm"');
		expect(body).not.toContain('data-collapsed');
	});

	it('1300 → lg', () => {
		const { body } = render(Header, { props: { items, mobileBreakpoint: 1300 } });
		expect(body).toContain('data-mobile-breakpoint="lg"');
	});

	it('804 (equidistant from 640 and 968) → sm, the tie going to the smaller', () => {
		const { body } = render(Header, { props: { items, mobileBreakpoint: 804 } });
		expect(body).toContain('data-mobile-breakpoint="sm"');
	});

	it('never emits data-mobile-breakpoint="custom" before hydration', () => {
		const { body } = render(Header, { props: { items, mobileBreakpoint: 668 } });
		expect(body).not.toContain('custom');
	});

	it("an invalid number folds to 'none' server-side too, with no data-collapsed", () => {
		const { body } = render(Header, { props: { items, mobileBreakpoint: 0 } });
		expect(body).toContain('data-mobile-breakpoint="none"');
		expect(body).not.toContain('data-collapsed');
	});
});

// ---------------------------------------------------------------------------
// R5 — Toc SSR: the fallback-tier attribute, never 'custom', pre-hydration.
// ---------------------------------------------------------------------------

describe('R5 — Toc SSR: pre-hydration fallback tier', () => {
	it('668 → data-breakpoint="sm", no data-narrow', () => {
		const { body } = render(Toc, { props: { breakpoint: 668, minEntries: 0 } });
		expect(body).toContain('data-breakpoint="sm"');
		expect(body).not.toContain('data-narrow');
	});

	it('1300 → lg', () => {
		const { body } = render(Toc, { props: { breakpoint: 1300, minEntries: 0 } });
		expect(body).toContain('data-breakpoint="lg"');
	});

	it('804 (equidistant from 640 and 968) → sm, the tie going to the smaller', () => {
		const { body } = render(Toc, { props: { breakpoint: 804, minEntries: 0 } });
		expect(body).toContain('data-breakpoint="sm"');
	});

	it('never emits data-breakpoint="custom" before hydration', () => {
		const { body } = render(Toc, { props: { breakpoint: 668, minEntries: 0 } });
		expect(body).not.toContain('custom');
	});

	it('breakpoint="none" (the default): no data-narrow, no data-collapsed', () => {
		const { body } = render(Toc, { props: { minEntries: 0 } });
		expect(body).toContain('data-breakpoint="none"');
		expect(body).not.toContain('data-narrow');
		expect(body).not.toContain('data-collapsed');
	});
});
