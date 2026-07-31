/**
 * Holds `buildSearchIndex()`/`searchDocs()` against the same manifest,
 * `componentDocs` and `hooks` registries the index is derived from — the
 * `llms.spec.ts` / `data.spec.ts` / `hooks.spec.ts` idiom: a
 * `violations: string[]` array asserted `toEqual([])` so every failure
 * reports at once.
 *
 * Built once at module scope, from the same raw-source glob the route uses
 * (vitest runs through Vite, so the glob resolves here too).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSearchIndex, searchDocs } from './searchIndex';
import { componentDocs } from './data/index.js';
import { hooks } from './hooks';
import { allRoutes, isSection, isGrouped, manifest, sectionPages } from './manifest';

const sources = import.meta.glob('/src/routes/docs/**/+page.svelte', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const index = buildSearchIndex(sources);

const componentPages = (() => {
	const section = manifest.find((e) => isSection(e) && e.label === 'Components');
	if (!section || !isSection(section) || !isGrouped(section)) {
		throw new Error('No grouped Components section in the manifest');
	}
	return sectionPages(section);
})();

// ---------------------------------------------------------------------------
// buildSearchIndex — Search-R2
// ---------------------------------------------------------------------------

describe('buildSearchIndex — page coverage, both directions (Search-R2)', () => {
	it('has one page record per manifest route, in manifest order, no duplicates, nothing extra', () => {
		const pageHrefs = index.filter((r) => r.kind === 'page').map((r) => r.href);
		expect(pageHrefs).toEqual(allRoutes);
	});
});

describe('buildSearchIndex — route integrity (Search-R2)', () => {
	it('every record href, with any #… stripped, is a real manifest route', () => {
		const known = new Set(allRoutes);
		const violations: string[] = [];
		for (const record of index) {
			const route = record.href.split('#')[0];
			if (!known.has(route)) violations.push(`${record.kind} "${record.label}": ${record.href}`);
		}
		expect(violations).toEqual([]);
	});
});

describe('buildSearchIndex — field coverage, both directions (Search-R2)', () => {
	it('every component page’s props/hooks arrays match componentDocs/hooks exactly', () => {
		const violations: string[] = [];
		for (const page of componentPages) {
			const record = index.find((r) => r.kind === 'page' && r.href === page.href);
			if (!record) {
				violations.push(`${page.label}: no page record`);
				continue;
			}

			const doc = componentDocs[page.label];
			const expectedProps = new Set<string>();
			for (const row of doc?.props ?? []) expectedProps.add(row.name);
			for (const type of doc?.types ?? []) {
				for (const row of type.props) expectedProps.add(row.name);
			}
			const recordProps = new Set(record.props ?? []);
			for (const name of expectedProps) {
				if (!recordProps.has(name)) violations.push(`${page.label}: missing prop "${name}"`);
			}
			for (const name of recordProps) {
				if (!expectedProps.has(name)) violations.push(`${page.label}: extra prop "${name}"`);
			}

			const hookEntry = hooks[page.label];
			const expectedHooks = new Set<string>();
			if (hookEntry) {
				expectedHooks.add(hookEntry.root);
				for (const row of hookEntry.attrs ?? []) expectedHooks.add(row.name);
				for (const row of hookEntry.props ?? []) expectedHooks.add(row.name);
				for (const row of hookEntry.parts ?? []) expectedHooks.add(row.name);
			}
			const recordHooks = new Set(record.hooks ?? []);
			for (const name of expectedHooks) {
				if (!recordHooks.has(name)) violations.push(`${page.label}: missing hook "${name}"`);
			}
			for (const name of recordHooks) {
				if (!expectedHooks.has(name)) violations.push(`${page.label}: extra hook "${name}"`);
			}
		}
		expect(violations).toEqual([]);
	});
});

describe('buildSearchIndex — no component headings (Search-R2)', () => {
	it('no heading record’s href starts with /docs/components/', () => {
		const violations = index
			.filter((r) => r.kind === 'heading' && r.href.startsWith('/docs/components/'))
			.map((r) => r.href);
		expect(violations).toEqual([]);
	});
});

describe('buildSearchIndex — heading spot checks (Search-R2/R3)', () => {
	it('foundation/colors#roles-heading carries "Semantic roles & intent"', () => {
		const record = index.find((r) => r.href === '/docs/foundation/colors#roles-heading');
		expect(record?.label).toBe('Semantic roles & intent');
	});

	it('theming/components#class-heading strips the inline <code> tag to "The class prop"', () => {
		const record = index.find((r) => r.href === '/docs/theming/components#class-heading');
		expect(record?.label).toBe('The class prop');
	});

	it('foundation/utilities#text-utilities-heading carries "Color utilities"', () => {
		const record = index.find(
			(r) => r.href === '/docs/foundation/utilities#text-utilities-heading'
		);
		expect(record?.label).toBe('Color utilities');
	});
});

describe('buildSearchIndex — generic headings skipped (Search-R4)', () => {
	it('no record is labeled Demo or Source', () => {
		const labels = index.filter((r) => r.label === 'Demo' || r.label === 'Source');
		expect(labels).toEqual([]);
	});
});

describe('buildSearchIndex — no fabricated markup (Search-R3)', () => {
	it('no record label or href contains {, <, >, &amp;, or a newline', () => {
		const bad = /[{<>]|&amp;|\n/;
		const violations: string[] = [];
		for (const record of index) {
			if (bad.test(record.label)) violations.push(`label: ${record.label}`);
			if (bad.test(record.href)) violations.push(`href: ${record.href}`);
		}
		expect(violations).toEqual([]);
	});
});

describe('buildSearchIndex — size (Search-R12)', () => {
	it('the serialized index is under 120 kB', () => {
		expect(JSON.stringify(index).length).toBeLessThan(120_000);
	});
});

describe('searchIndex.ts — purity (Search-R1)', () => {
	it('the module source has no import.meta.glob, no $app, no @sveltejs/kit, no node: import', () => {
		const src = readFileSync(join(process.cwd(), 'src/docs/searchIndex.ts'), 'utf8');
		expect(src).not.toContain('import.meta.glob');
		expect(src).not.toContain('$app/');
		expect(src).not.toContain('@sveltejs/kit');
		expect(src).not.toContain('node:');
	});
});

// ---------------------------------------------------------------------------
// searchDocs — the scorer (Search-R5/R6)
// ---------------------------------------------------------------------------

describe('searchDocs — the pinned "color" ranking (Search-R5/R6/R9)', () => {
	const hits = searchDocs(index, 'color');

	it('ranks the two page-label hits first, tie-broken by manifest order', () => {
		expect(hits[0].label).toBe('Colors & Intent');
		expect(hits[1].label).toBe('ColorInput');
	});

	it('ranks "Utilities › Color utilities" third, above every field-name or description hit', () => {
		const utilitiesHit = hits.find((h) => h.label.includes('Color utilities'))!;
		expect(utilitiesHit).toBeDefined();
		expect(hits.indexOf(utilitiesHit)).toBe(2);
		for (const hit of hits) {
			if (hit === hits[0] || hit === hits[1] || hit === utilitiesHit) continue;
			expect(hit.score).toBeLessThan(utilitiesHit.score);
		}
	});

	it('Contrast & Accessibility and Tokens & Overrides are both present, via their description (Search-R9)', () => {
		expect(hits.some((h) => h.label === 'Contrast & Accessibility')).toBe(true);
		expect(hits.some((h) => h.label === 'Tokens & Overrides')).toBe(true);
	});

	it('"Logo › --hz-logo-color" is present, and every field-name hit ranks below every heading hit', () => {
		expect(hits.some((h) => h.label === 'Logo › --hz-logo-color')).toBe(true);

		const fieldNameHits = hits.filter(
			(h) => h.href.endsWith('#props-heading') || h.href.endsWith('#hooks-heading')
		);
		const headingHits = hits.filter((h) => h.record.kind === 'heading');
		expect(fieldNameHits.length).toBeGreaterThan(0);
		expect(headingHits.length).toBeGreaterThan(0);
		const maxFieldScore = Math.max(...fieldNameHits.map((h) => h.score));
		const minHeadingScore = Math.min(...headingHits.map((h) => h.score));
		expect(maxFieldScore).toBeLessThan(minHeadingScore);
	});

	it('no two hits share a record', () => {
		expect(new Set(hits.map((h) => h.record)).size).toBe(hits.length);
	});
});

describe('searchDocs — anchors (Search-R6)', () => {
	it('a prop hit ends #props-heading', () => {
		const hits = searchDocs(index, 'variant');
		const propHit = hits.find((h) => h.href.endsWith('#props-heading'));
		expect(propHit).toBeDefined();
	});

	it('a hook hit ends #hooks-heading', () => {
		// "ellipsis" names only Pagination's .hz-pagination-ellipsis part —
		// no component documents a prop by that name.
		const hits = searchDocs(index, 'ellipsis');
		expect(hits[0].href).toMatch(/#hooks-heading$/);
	});

	it('a heading hit ends with that heading’s own id', () => {
		const hits = searchDocs(index, 'color');
		const utilitiesHit = hits.find((h) => h.label.includes('Color utilities'))!;
		expect(utilitiesHit.href.endsWith('#text-utilities-heading')).toBe(true);
	});

	it('a page hit has no #', () => {
		const hits = searchDocs(index, 'color');
		expect(hits[0].href).toBe('/docs/foundation/colors');
		expect(hits[0].href).not.toContain('#');
	});
});

describe('searchDocs — word boundary beats mid-word (Search-R5)', () => {
	// No docs description contains "gap" as a substring at all (it only shows
	// up as the exact prop `gap` or the word-boundary hook `data-gap`) — "size"
	// is the token with a genuine real-data mid-word case: Textarea's
	// description says "configurable resize behavior", where "size" sits
	// mid-word with no boundary, while many components document an exact
	// `size` prop or a word-boundary hook like `--hz-logo-size`.
	it('a word-boundary/exact hit outranks a hit whose only match is mid-word inside a description', () => {
		const hits = searchDocs(index, 'size');
		// Textarea's only "size" match is mid-word, inside "resize" — both in
		// its description and in its `resize` prop (also mid-word) — so its
		// hit reads "Textarea › resize", the higher of its two mid-word scores.
		const textareaHit = hits.find((h) => h.record.label === 'Textarea')!;
		const topHit = hits[0];
		expect(textareaHit).toBeDefined();
		expect(topHit.record.label).not.toBe('Textarea');
		expect(topHit.score).toBeGreaterThan(textareaHit.score);
	});
});

describe('searchDocs — multi-word AND (Search-R5)', () => {
	it('"dark mode" returns the Colors page’s Dark mode heading', () => {
		const hits = searchDocs(index, 'dark mode');
		expect(hits.some((h) => h.label === 'Colors & Intent › Dark mode')).toBe(true);
	});

	it('"color input" returns ColorInput first', () => {
		const hits = searchDocs(index, 'color input');
		expect(hits[0].label).toBe('ColorInput');
	});

	it('"color zzzznope" returns nothing — one unmatched token excludes the record', () => {
		expect(searchDocs(index, 'color zzzznope')).toEqual([]);
	});
});

describe('searchDocs — empty query (Search-R5)', () => {
	it('an empty or whitespace-only query returns []', () => {
		expect(searchDocs(index, '')).toEqual([]);
		expect(searchDocs(index, '   ')).toEqual([]);
	});
});

describe('searchDocs — a breadcrumb-word query dedupes heading hits against their own page (Search-R6)', () => {
	// A prose page's heading records carry the identical `context` string as
	// their own page record (both come from the same walk). A query that only
	// matches that shared context therefore used to win on every heading too,
	// each resolving to the page's own href — one real result multiplied by
	// however many headings the page has. The regression: type a breadcrumb
	// word and every href in the result set should still be unique, and every
	// page under that breadcrumb should appear exactly once.
	function foundationHrefs(): string[] {
		const section = manifest.find((e) => isSection(e) && e.label === 'Foundation');
		if (!section || !isSection(section) || isGrouped(section)) {
			throw new Error('No flat Foundation section in the manifest');
		}
		return section.children.map((p) => p.href);
	}

	function themingHrefs(): string[] {
		const section = manifest.find((e) => isSection(e) && e.label === 'Theming');
		if (!section || !isSection(section) || isGrouped(section)) {
			throw new Error('No flat Theming section in the manifest');
		}
		return section.children.map((p) => p.href);
	}

	it('"foundation" returns no duplicate hrefs', () => {
		const hits = searchDocs(index, 'foundation', 100);
		const hrefs = hits.map((h) => h.href);
		expect(new Set(hrefs).size).toBe(hrefs.length);
	});

	it('"foundation" returns exactly one hit — the page record — for every Foundation page', () => {
		const hits = searchDocs(index, 'foundation', 100);
		for (const href of foundationHrefs()) {
			const matching = hits.filter((h) => h.href === href);
			expect(matching.length).toBe(1);
			expect(matching[0].record.kind).toBe('page');
		}
	});

	it('"theming" returns no duplicate hrefs, and exactly one page-record hit per Theming page', () => {
		const hits = searchDocs(index, 'theming', 100);
		const hrefs = hits.map((h) => h.href);
		expect(new Set(hrefs).size).toBe(hrefs.length);
		for (const href of themingHrefs()) {
			const matching = hits.filter((h) => h.href === href);
			expect(matching.length).toBe(1);
			expect(matching[0].record.kind).toBe('page');
		}
	});

	it('does not throw and returns a non-empty, sensible result for a prefix of a breadcrumb word', () => {
		expect(() => searchDocs(index, 'them')).not.toThrow();
		const hits = searchDocs(index, 'them');
		expect(hits.length).toBeGreaterThan(0);
		const hrefs = hits.map((h) => h.href);
		expect(new Set(hrefs).size).toBe(hrefs.length);
	});
});

describe('searchDocs — cap (Search-R5)', () => {
	it('respects a custom limit', () => {
		expect(searchDocs(index, 'a', 5).length).toBeLessThanOrEqual(5);
	});

	it('defaults to 20', () => {
		expect(searchDocs(index, 'a').length).toBeLessThanOrEqual(20);
	});
});
