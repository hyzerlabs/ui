import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveConfig } from '../config/index.js';
import { resolveHex } from '../config/report.js';

/**
 * specs/29 R7 — fallback parity. Every `var(--hz-<token>, <fallback>)` in
 * src/lib must carry a fallback equal to the token's resolved base (light)
 * value, so the headless/no-tokens experience matches the tokenized one.
 * Documented abbreviations live in ALLOWED_ABBREVIATIONS — each entry is an
 * intentional, reviewed deviation (short font stacks and the like), not a
 * stale value.
 */

// ---------------------------------------------------------------------------
// Allowlist — reviewed abbreviations only.
// ---------------------------------------------------------------------------

const ALLOWED_ABBREVIATIONS: Record<string, string[]> = {
	// Short generic stacks where the full stack would be noise in a fallback.
	'--hz-font-family-sans': ['system-ui, sans-serif'],
	'--hz-font-family-mono': ['monospace', 'ui-monospace, monospace'],
	// The generic easing keyword stands in for the standard curve.
	'--hz-ease-standard': ['ease'],
	// Single-layer approximations of the two-layer shadow values
	// (rescaled 2026-07-22: old md → sm, old lg → md, new bolder lg).
	'--hz-shadow-sm': ['0 4px 6px -1px rgb(0 0 0 / 0.1)'],
	'--hz-shadow-md': ['0 10px 15px -3px rgb(0 0 0 / 0.1)'],
	'--hz-shadow-lg': ['0 20px 25px -5px rgb(0 0 0 / 0.18)'],
	// specs/42 R3.1 bars theme sheets from referencing --hz-palette-* directly,
	// but surface-muted's OWN definition is authored against --hz-palette-gray
	// (tokens/index.ts) — a fallback that reproduces the recipe byte-for-byte
	// can't satisfy both rules at once. footer.css / table.css's fallback
	// mirror re-derives the identical resolved color through the ROLE-tier
	// --hz-intent-neutral chain instead (neutral IS gray, in both modes).
	'--hz-color-surface-muted': [
		'color-mix(in srgb, var(--hz-intent-neutral) 6%, var(--hz-color-surface))'
	]
};

// ---------------------------------------------------------------------------
// Expected values from the engine's resolved base schema
// ---------------------------------------------------------------------------

const resolved = resolveConfig();
const rootEntries = resolved.sections.flatMap((s) => s.entries);
const lightMap = new Map(rootEntries.map((e) => [e.cssName, e.value]));

/** Acceptable normalized fallbacks per token. */
function acceptableValues(cssName: string): Set<string> {
	const out = new Set<string>();
	const add = (v: string | null | undefined) => {
		if (v) out.add(normalize(v));
	};
	const authored = lightMap.get(cssName);
	if (authored !== undefined) {
		add(authored);
		add(resolveHex(authored, lightMap));
	} else if (cssName === '--hz-density') {
		add(resolved.density.unit);
	} else if (cssName === '--hz-space-near' || cssName === '--hz-space-away') {
		// Derived by the density block; base-level values (level 0 multipliers).
		const unit = parseFloat(resolved.density.unit);
		const suffix = resolved.density.unit.replace(/^[\d.]+/, '');
		const level = resolved.density.levels[0];
		add(`${unit * level.near}${suffix}`);
		add(`${unit * level.away}${suffix}`);
	}
	for (const allowed of ALLOWED_ABBREVIATIONS[cssName] ?? []) out.add(normalize(allowed));
	return out;
}

// ---------------------------------------------------------------------------
// Normalization & scanning
// ---------------------------------------------------------------------------

/** Lowercase, collapse whitespace, expand #rgb, drop inner var() fallbacks. */
function normalize(value: string): string {
	let v = stripInnerFallbacks(value.trim());
	v = v.toLowerCase().replace(/\s+/g, ' ');
	v = v.replace(/#([0-9a-f])([0-9a-f])([0-9a-f])(?![0-9a-f])/g, '#$1$1$2$2$3$3');
	v = v
		.replace(/\(\s+/g, '(')
		.replace(/\s+\)/g, ')')
		.replace(/\s*,\s*/g, ', ');
	return v;
}

/** `color-mix(…, var(--x, #fff) …)` → `color-mix(…, var(--x) …)` (inner fallbacks are checked separately). */
function stripInnerFallbacks(value: string): string {
	let out = value;
	for (let guard = 0; guard < 10; guard++) {
		const next = out.replace(/var\(\s*(--[a-z0-9-]+)\s*,[^()]*\)/gi, 'var($1)');
		if (next === out) break;
		out = next;
	}
	return out;
}

interface FoundFallback {
	file: string;
	cssName: string;
	fallback: string;
}

/** Balanced-paren extraction of every var(--hz-*, fallback) occurrence. */
function extractFallbacks(content: string, file: string): FoundFallback[] {
	const found: FoundFallback[] = [];
	const opener = /var\(\s*(--hz-[a-z0-9-]+)\s*,/g;
	for (const match of content.matchAll(opener)) {
		const start = match.index + match[0].length;
		let depth = 1;
		let end = start;
		while (end < content.length && depth > 0) {
			const ch = content[end];
			if (ch === '(') depth++;
			if (ch === ')') depth--;
			end++;
		}
		found.push({ file, cssName: match[1], fallback: content.slice(start, end - 1).trim() });
	}
	return found;
}

function walk(dir: string, out: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) walk(path, out);
		else if (/\.(css|svelte)$/.test(name)) out.push(path);
	}
	return out;
}

const libRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
/**
 * theme/examples/** is deliberately out of scope. This invariant exists so
 * that a consumer who skips tokens.css still gets the BASE look — which makes
 * the base palette the only correct fallback for library code. An example
 * theme inverts that: `var(--hz-color-surface, #ffffff)` inside Terminal
 * would promise white paper for a theme whose paper is #f4f4ec. The example
 * sheets are held to the same standard against THEIR OWN resolved config, in
 * theme/examples/examples.spec.ts.
 */
const files = walk(libRoot).filter((p) => !p.includes(join('theme', 'examples')));
const tokenNames = new Set([
	...lightMap.keys(),
	'--hz-density',
	'--hz-space-near',
	'--hz-space-away'
]);

const allFallbacks = files.flatMap((file) =>
	extractFallbacks(readFileSync(file, 'utf8'), file.slice(libRoot.length + 1)).filter((f) =>
		// Only token names — component-internal --hz-* hooks (slider chars,
		// breakout shift, button accent, …) have their own contracts.
		tokenNames.has(f.cssName)
	)
);

// ---------------------------------------------------------------------------
// The test
// ---------------------------------------------------------------------------

describe('R7 — fallback parity across src/lib', () => {
	it('found a meaningful number of token fallbacks to check', () => {
		expect(allFallbacks.length).toBeGreaterThan(100);
	});

	it('every var(--hz-*, fallback) matches the resolved base value or a reviewed abbreviation', () => {
		const failures = allFallbacks
			.filter((f) => !acceptableValues(f.cssName).has(normalize(f.fallback)))
			.map(
				(f) =>
					`${f.file}: ${f.cssName} fallback "${f.fallback}" ` +
					`(expected one of: ${[...acceptableValues(f.cssName)].join(' | ') || '<none resolvable>'})`
			);
		expect(failures).toEqual([]);
	});

	it('the normalizer catches a genuinely wrong fallback', () => {
		// Guard against the test silently accepting anything.
		expect(acceptableValues('--hz-palette-primary').has(normalize('#123456'))).toBe(false);
		expect(acceptableValues('--hz-palette-primary').has(normalize('#2563EB'))).toBe(true);
	});
});
