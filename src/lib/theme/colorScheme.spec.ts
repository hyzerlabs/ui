/**
 * specs/68 R9 — a system-dark visitor on a page that sets no `data-theme`
 * gets the generated sheet's dark tokens (`@media (prefers-color-scheme:
 * dark) { :root:not([data-theme]) … }`), so `base.css` must flip
 * `color-scheme` to match, or native chrome (scrollbars, form control
 * internals, autofill, date pickers) paints light against a dark page — the
 * "white gutter" effect the surrounding rules already guard against for an
 * explicit `data-theme="dark"`.
 *
 * The `:not([data-theme])` guard is what R10's root opt-out depends on: a
 * root that names a theme stops matching, so a one-theme site never gets a
 * `color-scheme` it did not ask for. A rule without the guard would override
 * an explicit `data-theme="default"` on a system-dark machine, which is the
 * regression this test pins.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Stripped of block comments — the rule above this one explains the guard in
// prose that itself mentions "@media (prefers-color-scheme: dark) { … }",
// which would otherwise be mistaken for the real rule.
const raw = readFileSync(join(process.cwd(), 'src/lib/theme/base.css'), 'utf8');
const css = raw.replace(/\/\*[\s\S]*?\*\//g, (comment) => ' '.repeat(comment.length));

/** The body of the first `@layer hz-theme { … }` block, up to its matching close brace. */
function layerBody(source: string): string {
	const start = source.indexOf('@layer hz-theme {');
	const openBrace = source.indexOf('{', start);
	let depth = 1;
	let i = openBrace + 1;
	for (; i < source.length && depth > 0; i++) {
		if (source[i] === '{') depth++;
		else if (source[i] === '}') depth--;
	}
	return source.slice(openBrace + 1, i - 1);
}

/** The body of the first occurrence of `marker { … }` inside `source` — `marker` ends with its own opening brace. */
function ruleBody(source: string, marker: string): string {
	const markerIndex = source.indexOf(marker);
	expect(markerIndex, `"${marker}" not found`).toBeGreaterThan(-1);
	const openBrace = markerIndex + marker.length - 1;
	let depth = 1;
	let i = openBrace + 1;
	for (; i < source.length && depth > 0; i++) {
		if (source[i] === '{') depth++;
		else if (source[i] === '}') depth--;
	}
	return source.slice(openBrace + 1, i - 1);
}

describe('base.css — color-scheme follows the system preference', () => {
	const body = layerBody(css);

	it('declares color-scheme: light on :root and color-scheme: dark under an explicit data-theme="dark"', () => {
		expect(ruleBody(body, ':root {')).toContain('color-scheme: light;');
		expect(ruleBody(body, ":root[data-theme='dark'] {")).toContain('color-scheme: dark;');
	});

	it('adds a prefers-color-scheme: dark block guarded by :root:not([data-theme])', () => {
		const media = ruleBody(body, '@media (prefers-color-scheme: dark) {');
		expect(media).toContain(':root:not([data-theme]) {');
		expect(ruleBody(media, ':root:not([data-theme]) {')).toContain('color-scheme: dark;');
	});

	it('the new block sits inside @layer hz-theme, beside its two neighbours', () => {
		expect(body).toContain('@media (prefers-color-scheme: dark)');
	});
});
