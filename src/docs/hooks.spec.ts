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
import { hooks, INTERNAL_HOOKS, INSTANCE_HOOKS, type ComponentHooks } from './hooks';
import { isSection, isGrouped, manifest, sectionPages } from './manifest';
import { componentHooks, ROOT } from '../lib/tokens/hooks.js';

const LIB = join(process.cwd(), 'src/lib');
const COMPONENTS = join(LIB, 'components');
const THEME = join(LIB, 'theme');

/**
 * Components with no styling contract at all (specs/54 R10) — the precedent
 * is the Tooltip/Icons exceptions in componentSource() above, a named set
 * with a comment, not a loosened assertion. Metatags renders only
 * `<svelte:head>`: no element in `<body>`, so no root class, no `data-*`
 * hook, and no custom property to promise. It has no hooks.ts entry at all
 * (DocPage's Theme hooks section is already `{#if componentHooks}`-guarded),
 * so it is excluded from the two tests below that assume every page has one.
 */
const NO_STYLING_CONTRACT = new Set(['Metatags']);

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
	// Icons are generated per glyph from one template, so the template is the
	// source of truth for the class and attributes every icon stamps. The
	// generated files themselves are gitignored build output.
	if (name === 'Icons') {
		return readFileSync(join(LIB, '../../scripts/gen-icons.ts'), 'utf8');
	}
	return readFileSync(join(COMPONENTS, `${name}.svelte`), 'utf8');
}

/** Every reference-theme stylesheet, per file. Excludes examples/. */
const themeFiles = (() => {
	const out: { file: string; css: string }[] = [];
	const walk = (dir: string) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (entry.isDirectory()) {
				if (entry.name !== 'examples') walk(join(dir, entry.name));
			} else if (entry.name.endsWith('.css')) {
				const path = join(dir, entry.name);
				out.push({ file: path.slice(LIB.length + 1), css: readFileSync(path, 'utf8') });
			}
		}
	};
	walk(THEME);
	return out;
})();

/** Every reference-theme stylesheet, concatenated. Excludes examples/. */
const themeCss = themeFiles.map((f) => f.css).join('\n');

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
		const missing = componentPages
			.filter((p) => !NO_STYLING_CONTRACT.has(p.label))
			.filter((p) => !hooks[p.label]?.root);
		expect(missing.map((p) => p.label)).toEqual([]);
	});

	it('has no entry for a component that has no page', () => {
		const labels = new Set(componentPages.map((p) => p.label));
		const orphans = Object.keys(hooks).filter((k) => !labels.has(k));
		expect(orphans).toEqual([]);
	});

	it('the Components section covers every page across seven groups', () => {
		const section = manifest.find((e) => isSection(e) && e.label === 'Components');
		if (!section || !isSection(section) || !isGrouped(section)) throw new Error('not grouped');
		expect(section.groups.map((g) => g.label)).toEqual([
			'Content',
			'Feedback & Status',
			'Overlays',
			'Layout',
			'Navigation',
			'Media',
			'Forms'
		]);
		expect(section.groups.every((g) => g.pages.length > 0)).toBe(true);
		// 38 + Header (spec 35) + Table (spec 37) + Toc (spec 38) + Banner (spec 41)
		// + CodeBlock (spec 47) + Loading + Skeleton (spec 49) + Tooltip + Popover
		// (spec 50) + Icons (moved in from Foundation, spec 53) + Metatags (spec 54)
		// + Logo (spec 55) + Parallax (spec 59) + HorizontalScroll (spec 60).
		expect(componentPages).toHaveLength(52);
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
			if (NO_STYLING_CONTRACT.has(page.label)) continue;
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
			for (const row of hooks[page.label]?.attrs ?? []) {
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
			for (const row of hooks[page.label]?.props ?? []) {
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
			for (const row of hooks[page.label]?.parts ?? []) {
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

// ---------------------------------------------------------------------------
// specs/65 R12 — src/lib/tokens/hooks.ts's componentHooks, held against this
// curation. Two gates: every documented --hz-* prop is accounted for exactly
// once (componentHooks XOR INSTANCE_HOOKS), and every componentHooks entry
// really is declared where it claims — a class row on that class, a ROOT row
// at :root or nowhere at all.
// ---------------------------------------------------------------------------

describe('componentHooks (src/lib/tokens/hooks.ts) — vocabulary held against the docs curation', () => {
	const documentedProps = new Set(
		Object.values(hooks).flatMap((h) => (h.props ?? []).map((r) => r.name))
	);
	const vocab = new Set(componentHooks.map((h) => h.name));

	it('every documented --hz-* prop is in componentHooks or INSTANCE_HOOKS, never both, never neither', () => {
		const violations: string[] = [];
		for (const name of documentedProps) {
			const inVocab = vocab.has(name);
			const inInstance = name in INSTANCE_HOOKS;
			if (inVocab && inInstance) {
				violations.push(`${name}: listed in both componentHooks and INSTANCE_HOOKS`);
			}
			if (!inVocab && !inInstance) {
				violations.push(`${name}: in neither componentHooks nor INSTANCE_HOOKS`);
			}
		}
		expect(violations).toEqual([]);
	});

	it('every componentHooks name is a documented props row', () => {
		const violations = [...vocab].filter((name) => !documentedProps.has(name));
		expect(violations).toEqual([]);
	});

	it('componentHooks has no duplicate names', () => {
		const names = componentHooks.map((h) => h.name);
		const dupes = names.filter((n, i) => names.indexOf(n) !== i);
		expect([...new Set(dupes)]).toEqual([]);
	});

	it('INSTANCE_HOOKS has no stale entries', () => {
		const stale = Object.keys(INSTANCE_HOOKS).filter((name) => !documentedProps.has(name));
		expect(stale, 'Listed as an instance hook but no longer a documented props row').toEqual([]);
	});
});

// Rule splitter, duplicated from src/lib/theme/examples/examples.spec.ts
// (R12: no test helper exported from src/lib for this) and adapted to find
// DECLARED custom properties rather than declared standard properties.

interface HookRule {
	selectors: string[];
	customProps: string[];
}

function splitTopLevelHook(input: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let current = '';
	for (const ch of input) {
		if (ch === '(' || ch === '[') depth++;
		else if (ch === ')' || ch === ']') depth--;
		if (ch === ',' && depth === 0) {
			parts.push(current.trim());
			current = '';
		} else current += ch;
	}
	if (current.trim()) parts.push(current.trim());
	return parts;
}

/** Custom properties DECLARED (not just read) directly in a block. */
function declaredCustomProps(body: string): string[] {
	return [...body.matchAll(/(--hz-[a-z0-9-]+)\s*:/g)].map((m) => m[1]);
}

/** Strip comments, then walk brace-matched blocks collecting style rules. */
function parseHookRules(css: string): HookRule[] {
	const rules: HookRule[] = [];
	const walk = (input: string) => {
		let i = 0;
		let prelude = '';
		while (i < input.length) {
			const ch = input[i];
			if (ch === '{') {
				let depth = 1;
				let j = i + 1;
				while (j < input.length && depth > 0) {
					if (input[j] === '{') depth++;
					else if (input[j] === '}') depth--;
					j++;
				}
				const body = input.slice(i + 1, j - 1);
				const head = prelude.trim();
				if (head.startsWith('@')) {
					if (!head.startsWith('@keyframes')) walk(body);
				} else if (head) {
					rules.push({
						selectors: splitTopLevelHook(head),
						customProps: declaredCustomProps(body)
					});
				}
				prelude = '';
				i = j;
				continue;
			}
			if (ch === '}') {
				prelude = '';
				i++;
				continue;
			}
			prelude += ch;
			i++;
		}
	};
	walk(css.replace(/\/\*[\s\S]*?\*\//g, ''));
	return rules;
}

function hasTopLevelCombinatorHook(selector: string): boolean {
	let depth = 0;
	for (const ch of selector) {
		if (ch === '(' || ch === '[') depth++;
		else if (ch === ')' || ch === ']') depth--;
		else if (depth === 0 && /[\s>+~]/.test(ch)) return true;
	}
	return false;
}

/** Unwrap single-argument :where()/:is() groups that contain a combinator. */
function flattenHookGroups(selector: string): string {
	const re = /:(?:where|is)\(/;
	let out = selector;
	for (;;) {
		const m = re.exec(out);
		if (!m) return out;
		const open = m.index + m[0].length - 1;
		let depth = 1;
		let close = open + 1;
		while (close < out.length && depth > 0) {
			if (out[close] === '(') depth++;
			else if (out[close] === ')') depth--;
			close++;
		}
		const inner = out.slice(open + 1, close - 1);
		const flattenable = splitTopLevelHook(inner).length === 1 && hasTopLevelCombinatorHook(inner);
		if (!flattenable) {
			const rest = flattenHookGroups(out.slice(close));
			return out.slice(0, close) + rest;
		}
		out = out.slice(0, m.index) + inner + out.slice(close);
	}
}

/** The last compound in a selector — the element the rule actually declares onto. */
function subjectOfHook(selector: string): string {
	const flat = flattenHookGroups(selector);
	let depth = 0;
	let start = 0;
	for (let i = 0; i < flat.length; i++) {
		const ch = flat[i];
		if (ch === '(' || ch === '[') depth++;
		else if (ch === ')' || ch === ']') depth--;
		else if (depth === 0 && /[\s>+~]/.test(ch)) start = i + 1;
	}
	return flat.slice(start);
}

/** Whole-token match, so `.hz-carousel` does not match `.hz-carousel-dot`. */
function hasHookToken(haystack: string, token: string): boolean {
	const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`${escaped}(?![\\w-])`).test(haystack);
}

describe('componentHooks (src/lib/tokens/hooks.ts) — `on` really is the declaring element', () => {
	it('a class-claiming row is declared on that class, never at :root; a ROOT-claiming row is declared at :root or nowhere', () => {
		const byFile = themeFiles.map((f) => ({ file: f.file, rules: parseHookRules(f.css) }));
		const violations: string[] = [];
		for (const hook of componentHooks) {
			for (const { file, rules } of byFile) {
				for (const rule of rules) {
					if (!rule.customProps.includes(hook.name)) continue;
					for (const selector of rule.selectors) {
						const atRoot = selector.trim() === ':root';
						if (hook.on === ROOT) {
							// ROOT rows may be declared at :root (--hz-logo-size) or
							// nowhere (every other ROOT row, never matched by this loop
							// at all). Declared on an actual class instead is the bug
							// this gate exists to catch: R14 would then emit the config
							// value ON that class, defeating an ancestor's own override
							// the way a same-element declaration always does.
							if (!atRoot) {
								violations.push(
									`${hook.name}: claims ROOT but ${file} "${selector}" declares it on a class`
								);
							}
							continue;
						}
						// A class-claiming row declared at :root instead means R14
						// would emit the config value ON the class — out-ranking the
						// very :root declaration a config value is supposed to reach
						// through inheritance, same failure as --hz-logo-size's.
						if (atRoot) {
							violations.push(`${hook.name}: claims .${hook.on} but ${file} declares it at :root`);
							continue;
						}
						const subject = subjectOfHook(selector);
						if (!hasHookToken(subject, `.${hook.on}`)) {
							violations.push(
								`${hook.name}: ${file} "${selector}" has subject "${subject}", missing .${hook.on}`
							);
						}
					}
				}
			}
		}
		expect(violations).toEqual([]);
	});
});
