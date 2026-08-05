import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveConfig, generateCss, contrastReport } from '../../config/index.js';
import { resolveHex } from '../../config/report.js';
import oceanConfig, { intro as oceanIntro } from './ocean.config.js';
import terminalConfig, { intro as terminalIntro } from './terminal/terminal.config.js';

const here = dirname(fileURLToPath(import.meta.url));

const examples = [
	{ name: 'ocean', config: oceanConfig, intro: oceanIntro, sheet: 'ocean.css', selector: ':root' },
	{
		name: 'terminal',
		config: terminalConfig,
		intro: terminalIntro,
		sheet: 'terminal/terminal.tokens.css',
		selector: '.hz-theme-terminal'
	}
] as const;

/**
 * specs/30 R2 + specs/32 R4/R5 — the committed example token sheets ARE
 * engine output of their checked-in configs, and every example keeps the
 * library's AA posture.
 */
describe.each(examples)('example theme: $name', ({ name, config, intro, sheet, selector }) => {
	it('committed css equals the engine output of its config (drift test)', () => {
		const committed = readFileSync(join(here, sheet), 'utf8');
		expect(generateCss(resolveConfig(config), { mode: 'overrides', intro })).toBe(committed);
	});

	it('passes WCAG AA on every graded pairing, both modes', () => {
		const report = contrastReport(resolveConfig(config));
		const failures = report.rows
			.filter((row) => !row.pass)
			.map((row) => `${row.mode} ${row.id} — ${row.ratio.toFixed(2)}:1`);
		expect(failures).toEqual([]);
		expect(report.unresolved).toEqual([]);
	});

	it(`roots its declarations at ${selector}`, () => {
		// specs/30 R2's invariant: an example sheet the docs app imports must
		// not touch global tokens — which is why the class-override themes are
		// class-scoped. Ocean is the exception that defines the rule: it IS the
		// `:root` drop-in example, so the docs page re-generates it scoped
		// rather than importing the shipped sheet.
		const committed = readFileSync(join(here, sheet), 'utf8');
		// The selector opens a rule, which it may share with its own
		// [data-theme='default'] variant when the two blocks would be identical.
		const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		expect(committed).toMatch(new RegExp(`^${escaped}\\s*[,{]`, 'm'));
		if (name !== 'ocean') expect(committed).not.toMatch(/^:root\s*[,{]/m);
	});
});

// ---------------------------------------------------------------------------
// specs/29 R7, applied to the example sheets (specs/32).
// ---------------------------------------------------------------------------

/**
 * The library's fallback-parity suite (tokens/fallback-parity.spec.ts) holds
 * every `var(--hz-*, fallback)` in src/lib to the BASE palette, and skips
 * theme/examples for good reason: an example theme's fallback should promise
 * ITS palette, not the library's. `var(--hz-color-surface, #ffffff)` inside
 * Terminal would be a lie — Terminal's surface is near-black.
 *
 * Same invariant, different expected values: each example sheet's fallbacks
 * must match its own config's resolved light values, so a cherry-picked
 * component sheet degrades to that theme's look rather than the library's.
 */
function fallbacksIn(css: string): { cssName: string; fallback: string }[] {
	const out: { cssName: string; fallback: string }[] = [];
	const re = /var\(\s*(--hz-[a-z0-9-]+)\s*,/gi;
	let m: RegExpExecArray | null;
	while ((m = re.exec(css))) {
		let depth = 1;
		let end = m.index + m[0].length;
		const start = end;
		while (end < css.length && depth > 0) {
			if (css[end] === '(') depth++;
			if (css[end] === ')') depth--;
			end++;
		}
		out.push({ cssName: m[1], fallback: css.slice(start, end - 1).trim() });
	}
	return out;
}

function normalizeValue(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.replace(/#([0-9a-f])([0-9a-f])([0-9a-f])(?![0-9a-f])/g, '#$1$1$2$2$3$3')
		.replace(/\s*,\s*/g, ', ');
}

/** Short generic stacks, mirroring the base suite's reviewed allowlist. */
const ALLOWED_ABBREVIATIONS: Record<string, string[]> = {
	'--hz-font-family-mono': ['monospace', 'ui-monospace, monospace'],
	'--hz-font-family-sans': ['system-ui, sans-serif'],
	'--hz-ease-standard': ['ease']
};

describe.each(examples.filter((e) => existsSync(join(here, e.name, 'components'))))(
	'example theme fallbacks: $name',
	({ name, config }) => {
		it('every var(--hz-*, fallback) matches this theme’s own resolved value', () => {
			const resolved = resolveConfig(config);
			const map = new Map(
				resolved.sections.flatMap((s) => s.entries).map((e) => [e.cssName, e.value])
			);
			const css = readSheets(join(here, name, 'components'));

			const failures = fallbacksIn(css)
				.filter(({ cssName }) => map.has(cssName))
				.filter(({ cssName, fallback }) => {
					const authored = map.get(cssName)!;
					const accepted = new Set(
						[authored, resolveHex(authored, map), ...(ALLOWED_ABBREVIATIONS[cssName] ?? [])]
							.filter((v): v is string => Boolean(v))
							.map(normalizeValue)
					);
					return !accepted.has(normalizeValue(fallback));
				})
				.map(({ cssName, fallback }) => `${cssName} fallback "${fallback}"`);

			expect(failures).toEqual([]);
		});
	}
);

// ---------------------------------------------------------------------------
// specs/32 R2 — the standalone invariant.
// ---------------------------------------------------------------------------

/** A declaration block: the selectors that own it and the properties it sets. */
interface Rule {
	selectors: string[];
	props: string[];
}

/** Split on top-level commas (paren/bracket aware). */
function splitTopLevel(input: string): string[] {
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

/**
 * Property names declared directly in a block. Custom properties are
 * excluded: they only render if something references them, so a theme's
 * private hooks (--_c, --hz-badge-tint) are not a coverage obligation for a
 * sheet that has no use for them.
 */
function declaredProps(body: string): string[] {
	const props: string[] = [];
	let depth = 0;
	let current = '';
	const take = (chunk: string) => {
		const m = /^\s*(--)?([a-z-]+)\s*:/i.exec(chunk);
		if (m && !m[1]) props.push(m[2].toLowerCase());
	};
	for (const ch of body) {
		if (ch === '(' || ch === '[') depth++;
		else if (ch === ')' || ch === ']') depth--;
		if (ch === ';' && depth === 0) {
			take(current);
			current = '';
		} else current += ch;
	}
	take(current);
	return props;
}

/**
 * Strip comments, then walk brace-matched blocks collecting style rules.
 * Descends into @layer/@media/@supports; skips @keyframes, whose inner blocks
 * are keyframe stops rather than style rules.
 */
function parseRules(css: string): Rule[] {
	const rules: Rule[] = [];

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
					rules.push({ selectors: splitTopLevel(head), props: declaredProps(body) });
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

/**
 * Unwrap single-argument :where()/:is() groups that contain a combinator.
 * The reference theme writes `:where(.hz-alert-content > :first-child)` to
 * hold specificity down, which buries the `>` inside parens where subjectOf
 * can't see it — the rule's real subject is `:first-child`, not the group.
 * Groups with a top-level comma are left alone: they're alternations, not
 * structure, and flattening them would change what they mean.
 */
function flattenGroups(selector: string): string {
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
		const flattenable = splitTopLevel(inner).length === 1 && hasTopLevelCombinator(inner);
		if (!flattenable) {
			// Leave it in place, but keep scanning past it.
			const rest = flattenGroups(out.slice(close));
			return out.slice(0, close) + rest;
		}
		out = out.slice(0, m.index) + inner + out.slice(close);
	}
}

function hasTopLevelCombinator(selector: string): boolean {
	let depth = 0;
	for (const ch of selector) {
		if (ch === '(' || ch === '[') depth++;
		else if (ch === ')' || ch === ']') depth--;
		else if (depth === 0 && /[\s>+~]/.test(ch)) return true;
	}
	return false;
}

/**
 * The last compound in a selector — the element the rule actually styles.
 * `.hz-card[data-horizontal] .hz-card-media img` has subject `img`, so it is
 * not an obligation on the `.hz-card` target.
 */
function subjectOf(selector: string): string {
	const flat = flattenGroups(selector);
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

/** Whole-token match, so `.hz-card` does not match `.hz-card-title`. */
function hasToken(haystack: string, token: string): boolean {
	const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`${escaped}(?![\\w-])`).test(haystack);
}

/**
 * The rendering surface each covered component exposes. `context` pins a
 * target its subject alone can't identify — the bare `input` inside
 * TextInput's wrapper.
 */
const TARGETS: { subject: string; context?: string }[] = [
	{ subject: '.hz-button' },
	{ subject: '.hz-badge' },
	{ subject: '.hz-badge-dismiss' },
	{ subject: '.hz-alert' },
	{ subject: '.hz-alert-title' },
	{ subject: '.hz-alert-content' },
	{ subject: '.hz-alert-icon' },
	{ subject: '.hz-alert-dismiss' },
	{ subject: '.hz-card' },
	{ subject: '.hz-card-title' },
	{ subject: '.hz-card-actions' },
	{ subject: '.hz-field-label' },
	{ subject: '.hz-field-description' },
	{ subject: '.hz-field-error' },
	{ subject: '.hz-input-wrapper' },
	{ subject: 'input', context: '.hz-input-wrapper' },
	{ subject: '.hz-input-prefix' },
	{ subject: '.hz-input-suffix' },
	{ subject: '.hz-toggle' },
	{ subject: '.hz-tabs-list' },
	{ subject: '.hz-tabs-trigger' },
	{ subject: '.hz-tabs-panel' },
	{ subject: '.hz-accordion' },
	{ subject: '.hz-accordion-item' },
	{ subject: '.hz-accordion-trigger' },
	{ subject: '.hz-accordion-heading' },
	{ subject: '.hz-accordion-icon' },
	{ subject: '.hz-accordion-panel' }
];

function readSheets(dir: string): string {
	return readdirSync(dir)
		.filter((f) => f.endsWith('.css'))
		.map((f) => readFileSync(join(dir, f), 'utf8'))
		.join('\n');
}

function propsForTarget(rules: Rule[], target: { subject: string; context?: string }): Set<string> {
	const props = new Set<string>();
	for (const rule of rules) {
		const hit = rule.selectors.some(
			(sel) =>
				hasToken(subjectOf(sel), target.subject) &&
				(!target.context || hasToken(sel, target.context))
		);
		if (hit) for (const p of rule.props) props.add(p);
	}
	return props;
}

/**
 * specs/32 R2 — Terminal ships without importing the reference theme, and the
 * docs page demos it inline on a page where the theme IS loaded. Both only
 * hold if Terminal sets every property the theme sets for the components it
 * covers: any property the theme declares and Terminal doesn't is a property
 * the theme would still be deciding.
 *
 * A floor, not a proof of pixel independence — it compares the property
 * surface per rendering target, not per state permutation.
 */
describe('terminal: standalone coverage (specs/32 R2)', () => {
	const themeRules = parseRules(readSheets(join(here, '../components')));
	const terminalRules = parseRules(readSheets(join(here, 'terminal/components')));

	it('parses both corpora', () => {
		expect(themeRules.length).toBeGreaterThan(50);
		expect(terminalRules.length).toBeGreaterThan(50);
	});

	it.each(TARGETS)('covers every property the reference theme sets on $subject', (target) => {
		const themeProps = propsForTarget(themeRules, target);
		const terminalProps = propsForTarget(terminalRules, target);
		// Guard against a typo'd target silently passing as "nothing to cover".
		expect(themeProps.size).toBeGreaterThan(0);
		const missing = [...themeProps].filter((p) => !terminalProps.has(p)).sort();
		expect(missing).toEqual([]);
	});
});
