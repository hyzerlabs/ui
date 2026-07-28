/**
 * Reduced-motion posture pin — specs/49 R8/R12/R14/R19, Decision 9.
 *
 * specs/49 draws a deliberate split, not the blanket house rule: Loading (and
 * Button's loading spinner, R19) are the documented EXCEPTION — motion IS
 * their message, so they keep animating under
 * `prefers-reduced-motion: reduce`, just much slower (a private
 * `--_loading-rm-scale` multiplier). Skeleton is the exception-to-the-
 * exception: its shimmer/pulse still halts, the standard house posture every
 * other animated component (table.css, carousel.css, accordion.css) follows —
 * gated behind `@media (prefers-reduced-motion: no-preference)` so reduced
 * motion falls through to a static state.
 *
 * This file pins the CSS TEXT for that split (a component-level runtime pin
 * against real forced media state lives in Loading.svelte.spec.ts /
 * Button.svelte.spec.ts, using the CDP `Emulation.setEmulatedMedia` media
 * emulation available in this project's browser test harness). The substring
 * scan here catches the shape of the rule: gated vs. unconditional, and (for
 * Loading/Button) that a `prefers-reduced-motion: reduce` block exists at
 * all — in the same style hooks.spec.ts already uses against the reference
 * theme.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const THEME = join(process.cwd(), 'src/lib/theme');

/**
 * Strips block comments before scanning — several sheets mention
 * `@media (prefers-reduced-motion: …)` in prose comments (explaining the
 * gate), which would otherwise be mistaken for a real rule and throw off the
 * brace-balanced span scan below.
 */
function readCss(relPath: string): string {
	const raw = readFileSync(join(THEME, relPath), 'utf8');
	return raw.replace(/\/\*[\s\S]*?\*\//g, (comment) => ' '.repeat(comment.length));
}

/** Every balanced `@media (…) { … }` span for the given full media query, as [start, end) character offsets (of the block BODY, between the braces). */
function mediaSpans(css: string, marker: string): Array<[number, number]> {
	const spans: Array<[number, number]> = [];
	let searchFrom = 0;
	for (;;) {
		const markerIndex = css.indexOf(marker, searchFrom);
		if (markerIndex === -1) break;
		const openBrace = css.indexOf('{', markerIndex + marker.length);
		if (openBrace === -1) throw new Error('unterminated @media block');
		let depth = 1;
		let i = openBrace + 1;
		for (; i < css.length && depth > 0; i++) {
			if (css[i] === '{') depth++;
			else if (css[i] === '}') depth--;
		}
		spans.push([openBrace + 1, i - 1]);
		searchFrom = i;
	}
	return spans;
}

function isWithinAnySpan(index: number, spans: Array<[number, number]>): boolean {
	return spans.some(([start, end]) => index >= start && index < end);
}

/** Asserts every occurrence of `needle` in `css` falls inside a span for `marker`. */
function expectGated(css: string, needle: string, marker: string): void {
	const spans = mediaSpans(css, marker);
	expect(spans.length, `no "${marker}" block found`).toBeGreaterThan(0);
	let index = css.indexOf(needle);
	expect(index, `"${needle}" not found in the stylesheet`).toBeGreaterThanOrEqual(0);
	let found = false;
	while (index !== -1) {
		if (isWithinAnySpan(index, spans)) found = true;
		index = css.indexOf(needle, index + 1);
	}
	expect(found, `"${needle}" is never gated behind "${marker}"`).toBe(true);
}

/** Asserts `needle` appears, and NONE of its occurrences sit inside a span for `marker`. */
function expectUngated(css: string, needle: string, marker: string): void {
	const spans = mediaSpans(css, marker);
	let index = css.indexOf(needle);
	expect(index, `"${needle}" not found in the stylesheet`).toBeGreaterThanOrEqual(0);
	while (index !== -1) {
		expect(
			isWithinAnySpan(index, spans),
			`"${needle}" at offset ${index} unexpectedly sits inside a "${marker}" gate`
		).toBe(false);
		index = css.indexOf(needle, index + 1);
	}
}

const NO_PREFERENCE = '@media (prefers-reduced-motion: no-preference)';
const REDUCE = '@media (prefers-reduced-motion: reduce)';

describe('Button-R19 — loading spinner is unconditional, and slows (not halts) under reduce', () => {
	const css = readCss('components/button.css');

	it('the loading .hz-icon spin animation is declared UNCONDITIONALLY (not gated behind no-preference)', () => {
		expectUngated(css, 'animation: hz-spin 1.4s linear infinite;', NO_PREFERENCE);
	});

	it('a prefers-reduced-motion: reduce block slows it — the animation is not removed, only its duration lengthened', () => {
		expectGated(css, 'animation-duration: 4.2s;', REDUCE);
	});

	it('the loading state hooks (aria-busy/data-state/cursor) are unaffected — this file still declares them', () => {
		expect(css).toContain("data-state='loading'");
		expect(css).toContain('cursor: progress');
	});
});

describe('Loading-R8/R9 — indeterminate animations are unconditional, and slow (not halt) under reduce', () => {
	const css = readCss('components/loading.css');

	it('the bar sweep is declared UNCONDITIONALLY (not gated behind no-preference)', () => {
		expectUngated(css, 'animation: hz-loading-bar-sweep', NO_PREFERENCE);
	});

	it('the spinner rotation is declared UNCONDITIONALLY (not gated behind no-preference)', () => {
		expectUngated(css, 'animation: hz-spin calc(var(--hz-loading-speed)', NO_PREFERENCE);
	});

	it('the dots animation is declared UNCONDITIONALLY (not gated behind no-preference)', () => {
		expectUngated(css, 'animation: hz-loading-dots calc(var(--hz-loading-speed)', NO_PREFERENCE);
	});

	it('a prefers-reduced-motion: reduce block sets the private --_loading-rm-scale multiplier, slowing every variant', () => {
		expectGated(css, '--_loading-rm-scale: 2;', REDUCE);
	});

	it('the bar swaps to the pulse keyframes (a still-animating swap, not a removal) inside the reduce block', () => {
		expectGated(css, 'animation: hz-loading-bar-pulse', REDUCE);
	});

	it('--hz-loading-fill/--hz-loading-track/--hz-loading-size/--hz-loading-speed/--hz-loading-ease are declared unconditionally (not gated)', () => {
		expectUngated(css, '--hz-loading-fill: var(--hz-intent-primary, #2563eb);', NO_PREFERENCE);
		expectUngated(css, '--hz-loading-speed: calc(var(--hz-duration-base', NO_PREFERENCE);
	});
});

describe('Skeleton-R12/R14 — animations HALT under reduced motion (the standard house posture, unlike Loading)', () => {
	const css = readCss('components/skeleton.css');

	it('the shimmer animation is gated behind no-preference', () => {
		expectGated(
			css,
			'animation: hz-skeleton-shimmer var(--hz-skeleton-speed, 1.4s) ease-in-out infinite;',
			NO_PREFERENCE
		);
	});

	it('the pulse animation is gated behind no-preference', () => {
		expectGated(
			css,
			'animation: hz-skeleton-pulse var(--hz-skeleton-speed, 1.4s) ease-in-out infinite;',
			NO_PREFERENCE
		);
	});

	it('the flat background-color fallback is declared OUTSIDE the gate — reduced motion collapses to it', () => {
		expectUngated(css, 'background-color: var(--hz-skeleton-color);', NO_PREFERENCE);
	});

	it('unlike Loading, Skeleton declares no prefers-reduced-motion: reduce block of its own', () => {
		expect(mediaSpans(css, REDUCE)).toHaveLength(0);
	});
});
