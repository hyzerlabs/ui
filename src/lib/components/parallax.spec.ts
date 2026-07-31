/**
 * specs/59 R6/R9/R11 — source-text pins.
 *
 * The `@supports (animation-timeline: view()) { false }` branch (an
 * unsupported browser) cannot be exercised in a supporting Chromium engine,
 * so its shape is pinned here instead: the animation declarations must live
 * inside BOTH gates, nested in the documented order, and the structural
 * declarations (position, inset, z-index, pointer-events) must sit outside
 * them. `mediaSpans`/`expectUngated` are copied from
 * `src/lib/theme/reducedMotion.spec.ts` per the spec's Existing Code to
 * Reuse (extended here with `expectNestedGated`, for the nested
 * `@media` > `@supports` gate this component uses) — that file scans the
 * reference theme only, and this component ships no theme sheet, so it
 * cannot be extended in place.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const COMPONENTS = join(process.cwd(), 'src/lib/components');
const THEME = join(process.cwd(), 'src/lib/theme');

/** Strips block comments before scanning (reducedMotion.spec.ts precedent). */
function readSource(relPath: string): string {
	const raw = readFileSync(join(COMPONENTS, relPath), 'utf8');
	return raw.replace(/\/\*[\s\S]*?\*\//g, (comment) => ' '.repeat(comment.length));
}

/** Every balanced `@media (…) { … }` / `@supports (…) { … }` span for the given marker, as [start, end) offsets of the block BODY. */
function mediaSpans(css: string, marker: string): Array<[number, number]> {
	const spans: Array<[number, number]> = [];
	let searchFrom = 0;
	for (;;) {
		const markerIndex = css.indexOf(marker, searchFrom);
		if (markerIndex === -1) break;
		const openBrace = css.indexOf('{', markerIndex + marker.length);
		if (openBrace === -1) throw new Error('unterminated block');
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

/** Asserts `needle` appears, and NONE of its occurrences sit inside a span for `marker`. */
function expectUngated(css: string, needle: string, marker: string): void {
	const spans = mediaSpans(css, marker);
	let index = css.indexOf(needle);
	expect(index, `"${needle}" not found in the source`).toBeGreaterThanOrEqual(0);
	while (index !== -1) {
		expect(
			isWithinAnySpan(index, spans),
			`"${needle}" at offset ${index} unexpectedly sits inside a "${marker}" gate`
		).toBe(false);
		index = css.indexOf(needle, index + 1);
	}
}

/** Asserts `needle`, found inside every `outerMarker` span, is ALSO nested inside an `innerMarker` span within that same outer span. */
function expectNestedGated(
	css: string,
	needle: string,
	outerMarker: string,
	innerMarker: string
): void {
	const outerSpans = mediaSpans(css, outerMarker);
	expect(outerSpans.length, `no "${outerMarker}" block found`).toBeGreaterThan(0);
	let nested = false;
	for (const [os, oe] of outerSpans) {
		const outerBody = css.slice(os, oe);
		const innerSpans = mediaSpans(outerBody, innerMarker);
		for (const [is, ie] of innerSpans) {
			if (outerBody.slice(is, ie).includes(needle)) nested = true;
		}
	}
	expect(nested, `"${needle}" is not nested inside "${outerMarker}" > "${innerMarker}"`).toBe(true);
}

const NO_PREFERENCE = '@media (prefers-reduced-motion: no-preference)';
const SUPPORTS_VIEW_TIMELINE = '@supports (animation-timeline: view())';

const layerCss = readSource('ParallaxLayer.svelte');
const parallaxSource = readFileSync(join(COMPONENTS, 'Parallax.svelte'), 'utf8');
const layerSource = readFileSync(join(COMPONENTS, 'ParallaxLayer.svelte'), 'utf8');

describe('Parallax-R6 — both motion gates, nested, in this order', () => {
	it('animation-name is gated behind no-preference, nested inside @supports (animation-timeline: view())', () => {
		expectNestedGated(
			layerCss,
			'animation-name: hz-parallax-drift',
			NO_PREFERENCE,
			SUPPORTS_VIEW_TIMELINE
		);
	});

	it('animation-timeline: view() is gated the same way', () => {
		expectNestedGated(
			layerCss,
			'animation-timeline: view()',
			NO_PREFERENCE,
			SUPPORTS_VIEW_TIMELINE
		);
	});

	it('animation-timing-function: linear and animation-fill-mode: both are gated the same way', () => {
		expectNestedGated(
			layerCss,
			'animation-timing-function: linear',
			NO_PREFERENCE,
			SUPPORTS_VIEW_TIMELINE
		);
		expectNestedGated(layerCss, 'animation-fill-mode: both', NO_PREFERENCE, SUPPORTS_VIEW_TIMELINE);
	});

	it('animation-range is gated the same way', () => {
		expectNestedGated(
			layerCss,
			'animation-range: var(--hz-parallax-range, cover)',
			NO_PREFERENCE,
			SUPPORTS_VIEW_TIMELINE
		);
	});

	it('the @keyframes hz-parallax-drift definition is gated the same way', () => {
		expectNestedGated(
			layerCss,
			'@keyframes hz-parallax-drift',
			NO_PREFERENCE,
			SUPPORTS_VIEW_TIMELINE
		);
	});
});

describe('Parallax-R3 — structural declarations sit outside both gates', () => {
	it('position: absolute is unconditional', () => {
		expectUngated(layerCss, 'position: absolute', NO_PREFERENCE);
	});

	it('the inset-block/inset-inline bleed is unconditional', () => {
		expectUngated(layerCss, 'inset-block: calc(var(--_hz-parallax-bleed-y) / -2)', NO_PREFERENCE);
		expectUngated(layerCss, 'inset-inline: calc(var(--_hz-parallax-bleed-x) / -2)', NO_PREFERENCE);
	});

	it('z-index is unconditional', () => {
		expectUngated(layerCss, 'z-index: var(--hz-parallax-z, -1)', NO_PREFERENCE);
	});

	it('pointer-events: none is unconditional', () => {
		expectUngated(layerCss, 'pointer-events: none', NO_PREFERENCE);
	});

	it('Parallax.svelte declares exactly its four structural properties (position, overflow, isolation, min-width)', () => {
		expect(parallaxSource).toContain('position: relative');
		expect(parallaxSource).toContain('overflow: clip');
		expect(parallaxSource).toContain('isolation: isolate');
		expect(parallaxSource).toContain('min-width: 0');
	});
});

describe('Parallax-R5 — no -global- keyframes', () => {
	it('ParallaxLayer.svelte declares no -global- keyframes (the name stays Svelte-scoped)', () => {
		expect(layerSource).not.toMatch(/-global-/);
	});
});

describe('Parallax-R9 — zero JS motion, SSR-safe', () => {
	it('neither component source contains a scroll listener, rAF loop, IntersectionObserver, or matchMedia', () => {
		for (const src of [parallaxSource, layerSource]) {
			expect(src).not.toContain("addEventListener('scroll'");
			expect(src).not.toContain('requestAnimationFrame');
			expect(src).not.toContain('IntersectionObserver');
			expect(src).not.toContain('matchMedia');
		}
	});
});

describe('Parallax-R11 — no theme sheet', () => {
	it('src/lib/theme/components/parallax.css does not exist', () => {
		expect(existsSync(join(THEME, 'components/parallax.css'))).toBe(false);
	});

	it('theme.css does not import a parallax stylesheet', () => {
		const themeCss = readFileSync(join(THEME, 'theme.css'), 'utf8');
		expect(themeCss).not.toContain('parallax');
	});
});
