/**
 * Holds the hook curation against the real source — spec 31 R9's enforcement.
 *
 * hooks.ts is authored, not generated (its header says why). That buys honesty
 * at the cost of drift, so these tests buy the drift back. Two of them matter
 * most, and they run in opposite directions:
 *
 *   - "no fiction" stops the docs promising a hook that isn't there.
 *   - "no drift"   stops a new theme hook shipping undocumented.
 *
 * Neither is satisfiable by a lint rule: they compare prose to source. The
 * matching is deliberately substring-level — it catches deletion and rename,
 * which is how hooks actually rot, and stops short of a CSS parser whose cost
 * this doesn't justify. A hook whose *meaning* changes while its name stays
 * put is not caught here; nothing short of reading the sheet would.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { hooks, INTERNAL_HOOKS, type ComponentHooks } from './hooks';
import { isSection, isGrouped, manifest, sectionPages } from './manifest';

const LIB = join(process.cwd(), 'src/lib');
const COMPONENTS = join(LIB, 'components');
const THEME = join(LIB, 'theme');

/** Component pages, from the manifest's Components section. */
const componentPages = (() => {
	const section = manifest.find((e) => isSection(e) && e.label === 'Components');
	if (!section || !isSection(section)) throw new Error('No Components section in the manifest');
	return sectionPages(section);
})();

/**
 * <Name> → its source. Named for the manifest label, e.g. TextInput — with
 * one exception: Tooltip (specs/50) has no Tooltip.svelte, since `tooltip`
 * is an attachment, not a component; its root class and data-* hooks live
 * in src/lib/attachments/tooltip.ts instead.
 */
function componentSource(name: string): string {
	if (name === 'Tooltip') {
		return readFileSync(join(LIB, 'attachments/tooltip.ts'), 'utf8');
	}
	return readFileSync(join(COMPONENTS, `${name}.svelte`), 'utf8');
}

/** Every reference-theme stylesheet, concatenated. Excludes examples/. */
const themeCss = (() => {
	const out: string[] = [];
	const walk = (dir: string) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (entry.isDirectory()) {
				if (entry.name !== 'examples') walk(join(dir, entry.name));
			} else if (entry.name.endsWith('.css')) {
				out.push(readFileSync(join(dir, entry.name), 'utf8'));
			}
		}
	};
	walk(THEME);
	return out.join('\n');
})();

/**
 * Every shipped library source file, concatenated — the haystack for hooks the
 * theme doesn't declare. Components aren't enough: `data-lightbox-trigger` is
 * set by the lightboxGroup attachment, not by Lightbox.svelte.
 *
 * Test files are excluded on purpose. A .spec asserting on a hook must not be
 * what proves the hook exists — that would let a rename pass here while the
 * shipped attribute was gone.
 */
const libSource = (() => {
	const out: string[] = [];
	const walk = (dir: string) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const path = join(dir, entry.name);
			if (entry.isDirectory()) {
				if (entry.name !== 'examples') walk(path);
			} else if (/\.(svelte|ts)$/.test(entry.name) && !/\.spec\.|\.test\./.test(entry.name)) {
				out.push(readFileSync(path, 'utf8'));
			}
		}
	};
	walk(LIB);
	return out.join('\n');
})();

/** Rows across all three blocks of one entry. */
function allRows(h: ComponentHooks) {
	return [...(h.attrs ?? []), ...(h.props ?? []), ...(h.parts ?? [])];
}

describe('hooks.ts — coverage (spec 31 R9)', () => {
	it('every component page has an entry with a root class', () => {
		const missing = componentPages.filter((p) => !hooks[p.label]?.root);
		expect(missing.map((p) => p.label)).toEqual([]);
	});

	it('has no entry for a component that has no page', () => {
		const labels = new Set(componentPages.map((p) => p.label));
		const orphans = Object.keys(hooks).filter((k) => !labels.has(k));
		expect(orphans).toEqual([]);
	});

	it('the Components section covers all 40 pages across five groups', () => {
		const section = manifest.find((e) => isSection(e) && e.label === 'Components');
		if (!section || !isSection(section) || !isGrouped(section)) throw new Error('not grouped');
		expect(section.groups.map((g) => g.label)).toEqual([
			'Common',
			'Layout',
			'Navigation',
			'Media',
			'Forms'
		]);
		expect(section.groups.every((g) => g.pages.length > 0)).toBe(true);
		// 38 + Header (spec 35) + Table (spec 37) + Toc (spec 38) + Banner (spec 41)
		// + CodeBlock (spec 47) + Loading + Skeleton (spec 49) + Tooltip + Popover
		// (spec 50).
		expect(componentPages).toHaveLength(47);
	});
});

// These run as one assertion over all 38 rather than a test per component:
// a component with no custom properties is a valid, complete contract, and a
// per-component test would assert nothing there and trip this project's
// require-assertions rule. Aggregating also reports every violation at once
// instead of dying on the first.

describe('hooks.ts — the root class is real', () => {
	it('every root class appears in its own component source', () => {
		const violations: string[] = [];
		for (const page of componentPages) {
			const src = componentSource(page.label);
			// A root may be compound ('hz-field hz-field--toggle') — each part
			// has to show up on its own.
			for (const cls of hooks[page.label].root.split(/\s+/)) {
				if (!src.includes(cls))
					violations.push(`${page.label}: ${cls} not in ${page.label}.svelte`);
			}
		}
		expect(violations).toEqual([]);
	});
});

describe('hooks.ts — no fiction: documented hooks exist in source', () => {
	it('every documented data-* is stamped by some component', () => {
		const violations: string[] = [];
		for (const page of componentPages) {
			for (const row of hooks[page.label].attrs ?? []) {
				// Rows may name a scope for disambiguation ("data-state (root)")
				// or an ARIA/pseudo hook — take the attribute itself.
				const match = row.name.match(/^data-[a-z-]+/);
				if (!match) continue;
				// Field members render through Field.svelte and some hooks are
				// stamped by a composed child (Pagination's ride on Button), so the
				// haystack is the whole corpus, not one file.
				if (!libSource.includes(match[0])) {
					violations.push(`${page.label}: ${match[0]} is stamped nowhere`);
				}
			}
		}
		expect(violations).toEqual([]);
	});

	it('every documented --hz-* appears in the theme or a component', () => {
		const violations: string[] = [];
		for (const page of componentPages) {
			for (const row of hooks[page.label].props ?? []) {
				if (!row.name.startsWith('--hz-')) continue;
				// Declaration OR var() read: --hz-breakout-shift and
				// --hz-footer-col-min are only ever read, and are hooks precisely
				// because of it. A substring covers both positions.
				if (!themeCss.includes(row.name) && !libSource.includes(row.name)) {
					violations.push(`${page.label}: ${row.name} exists nowhere`);
				}
			}
		}
		expect(violations).toEqual([]);
	});

	it('every documented part class exists in the theme or a component', () => {
		const violations: string[] = [];
		for (const page of componentPages) {
			for (const row of hooks[page.label].parts ?? []) {
				if (!row.name.startsWith('.hz-')) continue;
				const cls = row.name.slice(1);
				if (!themeCss.includes(cls) && !libSource.includes(cls)) {
					violations.push(`${page.label}: ${cls} exists nowhere`);
				}
			}
		}
		expect(violations).toEqual([]);
	});
});

describe('hooks.ts — no drift: theme hooks are all accounted for', () => {
	/** Every --hz-*-* the reference theme DECLARES (name followed by a colon). */
	const declared = new Set(
		[...themeCss.matchAll(/(--hz-[a-z0-9-]+)\s*:/g)].map((m) => m[1])
		// Token sheets live outside theme/, so everything matched here is a
		// component-level declaration by construction.
	);

	const documented = new Set(
		Object.values(hooks).flatMap((h) => (h.props ?? []).map((r) => r.name))
	);

	it('every declared theme hook is documented or explicitly internal', () => {
		const unaccounted = [...declared].filter(
			(name) => !documented.has(name) && !(name in INTERNAL_HOOKS)
		);
		expect(
			unaccounted,
			'Declared in the reference theme but neither documented in hooks.ts nor listed in ' +
				'INTERNAL_HOOKS. Add a row if consumers should use it, or an INTERNAL_HOOKS entry ' +
				'saying why they should not.'
		).toEqual([]);
	});

	it('INTERNAL_HOOKS has no stale entries', () => {
		const stale = Object.keys(INTERNAL_HOOKS).filter((name) => !declared.has(name));
		expect(stale, 'Listed as internal but no longer declared anywhere in the theme').toEqual([]);
	});

	it('a hook is not both documented and marked internal', () => {
		const both = [...documented].filter((name) => name in INTERNAL_HOOKS);
		expect(both).toEqual([]);
	});
});

describe('hooks.ts — rows are well-formed', () => {
	it('every row has a name, values, and a note', () => {
		const violations: string[] = [];
		for (const [name, h] of Object.entries(hooks)) {
			for (const row of allRows(h)) {
				if (!row.name.length) violations.push(`${name}: a row has no name`);
				if (!row.values.length) violations.push(`${name}/${row.name}: no values`);
				if (!row.note.length) violations.push(`${name}/${row.name}: no note`);
			}
		}
		expect(violations).toEqual([]);
	});

	it('no block repeats a hook name', () => {
		// Two rows with one name render as two indistinguishable table rows.
		// Where a component really does hook the same attribute at two levels
		// (Toggle's data-state on the root AND on the input), the rows have to
		// say which is which — that ambiguity is the reader's problem too.
		const violations: string[] = [];
		for (const [name, h] of Object.entries(hooks)) {
			for (const block of [h.attrs, h.props, h.parts]) {
				if (!block) continue;
				const names = block.map((r) => r.name);
				const dupes = names.filter((n, i) => names.indexOf(n) !== i);
				for (const d of new Set(dupes)) violations.push(`${name}: repeats "${d}"`);
			}
		}
		expect(violations).toEqual([]);
	});

	it('a warning, when present, is non-empty and its backtick segments pair up', () => {
		// ThemeHooks.svelte splits `warning` on backticks the same way DocPage
		// splits a11yNote — an odd number of backticks would silently swallow
		// the rest of the string into a dangling <code> run.
		const violations: string[] = [];
		for (const [name, h] of Object.entries(hooks)) {
			if (h.warning === undefined) continue;
			if (!h.warning.length) violations.push(`${name}: warning is present but empty`);
			const backtickCount = (h.warning.match(/`/g) ?? []).length;
			if (backtickCount % 2 !== 0) violations.push(`${name}: warning has an unpaired backtick`);
		}
		expect(violations).toEqual([]);
	});
});
