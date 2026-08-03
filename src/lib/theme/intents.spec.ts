/**
 * Coverage guard for the reference theme's `--_c` unification: every
 * component sheet under `src/lib/theme/components/` (examples/ excluded — a
 * replacement theme authors its own intent rules, and is not held to this)
 * that switches color on `data-intent` must switch the single private hook
 * `--_c`, and its component root must declare `--_c` too — the no-leak
 * invariant an inherited custom property depends on.
 *
 * This is the regression the reference theme actually shipped: three sheets
 * (button/banner/loading) each grew their own private switch hook
 * (`--hz-button-accent`, `--hz-banner-bg`, `--hz-loading-fill`) instead of
 * `--_c`, so a consumer-registered intent — wired everywhere else — silently
 * fell through to the component's base color on exactly those three. A new
 * intent-taking component that repeats that mistake fails this test the
 * moment it ships.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = join(here, 'components');

interface Rule {
	selectors: string[];
	customProps: string[];
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

/** Custom-property names (`--foo`) declared directly in a block. */
function declaredCustomProps(body: string): string[] {
	const props: string[] = [];
	let depth = 0;
	let current = '';
	const take = (chunk: string) => {
		const m = /^\s*(--[a-z0-9_-]+)\s*:/i.exec(chunk);
		if (m) props.push(m[1]);
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
 * Descends into @layer/@media/@supports; skips @keyframes, whose inner
 * blocks are keyframe stops rather than style rules (same shape as
 * examples.spec.ts's parseRules).
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
					rules.push({ selectors: splitTopLevel(head), customProps: declaredCustomProps(body) });
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

/** True for a selector that switches on data-intent (not merely data-intent-scope). */
function isIntentSwitch(selector: string): boolean {
	return selector.includes('[data-intent=') && !selector.includes('[data-intent-scope=');
}

/** The bare component-class token a selector opens with — `.hz-button:where([data-intent='warning'])` -> `.hz-button`. */
function rootClassOf(selector: string): string {
	const m = /^\.[a-z0-9-]+/i.exec(selector.trim());
	if (!m) throw new Error(`could not find a root class in selector "${selector}"`);
	return m[0];
}

const files = readdirSync(COMPONENTS_DIR)
	.filter((f) => f.endsWith('.css'))
	.sort();

const sheets = files.map((file) => ({
	file,
	rules: parseRules(readFileSync(join(COMPONENTS_DIR, file), 'utf8'))
}));

describe('coverage guard: every component sheet switches color on data-intent via --_c only', () => {
	it('at least one sheet is checked, and it finds data-intent switch rules (guards against a silent parser regression)', () => {
		const total = sheets.reduce(
			(sum, { rules }) =>
				sum + rules.filter((r) => r.selectors.some((sel) => isIntentSwitch(sel))).length,
			0
		);
		expect(total).toBeGreaterThan(0);
	});

	for (const { file, rules } of sheets) {
		const intentSelectors = rules.flatMap((rule) =>
			rule.selectors.filter(isIntentSwitch).map((sel) => ({ sel, customProps: rule.customProps }))
		);
		if (intentSelectors.length === 0) continue;

		it(`${file}: every [data-intent='…'] rule sets --_c, and no other intent color hook`, () => {
			const failures = intentSelectors
				.map(({ sel, customProps }) => {
					if (!customProps.includes('--_c')) {
						return `${file}: "${sel}" does not set --_c`;
					}
					const extra = customProps.filter((p) => p !== '--_c');
					if (extra.length > 0) {
						return `${file}: "${sel}" sets --_c plus another custom hook (${extra.join(', ')}) — a data-intent switch rule must set only --_c`;
					}
					return null;
				})
				.filter((f): f is string => f !== null);
			expect(failures).toEqual([]);
		});

		it(`${file}: the component root rule also declares --_c (no inheritance leak)`, () => {
			const failures: string[] = [];
			const checked = new Set<string>();
			for (const { sel } of intentSelectors) {
				const rootClass = rootClassOf(sel);
				if (checked.has(rootClass)) continue;
				checked.add(rootClass);
				const rootRule = rules.find((r) => r.selectors.includes(rootClass));
				if (!rootRule || !rootRule.customProps.includes('--_c')) {
					failures.push(
						`${file}: "${rootClass}" has a data-intent switch rule ("${sel}") but its own root rule does not declare --_c`
					);
				}
			}
			expect(failures).toEqual([]);
		});
	}
});
