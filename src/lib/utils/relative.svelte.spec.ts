/**
 * Relative color syntax, against the browser. The arithmetic is the part a
 * spec document is easy to misread (whether `s` is 50 or 0.5, whether
 * `calc(r * 50%)` is half of `r` or `r * 127.5`), so every case here is
 * checked against the engine that has to agree with us.
 */

import { describe, expect, it } from 'vitest';
import { parseColor } from './color.js';
import { rgbToHex } from './contrast.js';

function paint(value: string): { r: number; g: number; b: number; a: number } {
	const canvas = document.createElement('canvas');
	canvas.width = 1;
	canvas.height = 1;
	const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
	ctx.fillStyle = '#000';
	ctx.fillStyle = value;
	ctx.fillRect(0, 0, 1, 1);
	const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
	return { r, g, b, a };
}

const AGREES = [
	// The identity in every space that takes relative syntax: the channels come
	// back out in the units they went in.
	'rgb(from #3366cc r g b)',
	'hsl(from hsl(210 50% 40%) h s l)',
	'hwb(from hwb(210 20% 30%) h w b)',
	'lab(from lab(50 20 -30) l a b)',
	'lch(from lch(50 40 100) l c h)',
	'oklab(from oklab(0.5 0.1 -0.1) l a b)',
	'oklch(from oklch(0.6 0.08 200) l c h)',
	'color(from color(display-p3 0.3 0.5 0.7) display-p3 r g b)',
	'color(from #3366cc srgb r g b)',
	'color(from #3366cc xyz x y z)',
	'oklch(from #3366cc l c h)',
	'oklch(from rebeccapurple l c h)',
	// The units each keyword carries. Read `s` as 0.5 instead of 50 and the
	// first of these lands on 1% saturation instead of 100%.
	'hsl(from hsl(210 50% 40%) h calc(s * 2) l)',
	'lab(from lab(50 20 -30) calc(l / 2) a b)',
	'oklab(from oklab(0.5 0.1 -0.1) calc(l / 2) a b)',
	'rgb(from #3366cc calc(r / 2) g b)',
	'oklch(from #3366cc calc(l * 0.8) c h)',
	'oklch(from oklch(0.6 0.08 200) l calc(c * 1.5) h)',
	'lch(from #3366cc calc(l + 10) c h)',
	'hsl(from #3366cc h s calc(l * 1.2))',
	// A percentage resolves against the channel's own reference, so this is
	// `r * 127.5`, not `r / 2`.
	'rgb(from #3366cc calc(r * 50%) 0 0)',
	'oklch(from #3366cc l 50% h)',
	'rgb(from #3366cc 50% g b)',
	// Arithmetic shapes: nesting, precedence, arithmetic over two channels.
	'rgb(from #3366cc calc(r + g) 0 0)',
	'rgb(from #3366cc calc(r * g) 0 0)',
	'rgb(from #3366cc calc((r + g) / 2) 0 0)',
	'oklch(from #3366cc l c calc(h * 2 - 30))',
	'oklch(from oklch(0.6 0.08 200) l c calc(h + 180))',
	// `none` is zero here as everywhere, and an opaque alpha stays opaque.
	'oklch(from #3366cc none c h)',
	'oklch(from #3366cc l c h / alpha)',
	'oklch(from #3366cc l c h / 100%)',
	// Every angle unit in a hue slot. Outside relative syntax these have always
	// worked; a hue written `180deg` is the ordinary way to write one by hand.
	'oklch(from oklch(0.6 0.08 200) l c 180deg)',
	'hsl(from hsl(210 50% 40%) 0.5turn s l)',
	'lch(from lch(50 40 100) l c 3.14rad)',
	'hwb(from hwb(210 20% 30%) 100grad w b)',
	// The legacy spellings name the same model as the modern ones.
	'hsla(from hsl(210 50% 40%) h s l)',
	'rgba(from rgb(60 90 120) r g b)',
	// CSS needs no space around the alpha slash.
	'rgb(from rgb(60 90 120) r g b/1)',
	'oklch(from #3366cc l c h/100%)',
	// A percentage against each reference that is neither 1 nor 100, on values
	// that do not saturate — a saturating case passes under any reading.
	'lab(from lab(50 20 -30) l 10% b)',
	'oklab(from oklab(0.5 0.1 -0.1) l 10% b)',
	'lch(from lch(50 40 100) l 20% h)',
	'oklch(from oklch(0.6 0.08 200) l 20% h)',
	'rgb(from rgb(1 2 3) calc(r * 50%) 0 0)',
	// Two percentages add; a percentage times a number scales.
	'rgb(from #3366cc calc(50% + 10%) 0 0)',
	'lab(from lab(50 20 -30) l calc(a + 5) b)'
];

describe('relative color syntax — against the browser', () => {
	it.each(AGREES)('%s', (value) => {
		const ours = parseColor(value);
		expect(ours).not.toBeNull();
		const browser = paint(value);
		expect(browser.a).toBe(255);
		const drift = Math.max(
			Math.abs(ours!.r - browser.r),
			Math.abs(ours!.g - browser.g),
			Math.abs(ours!.b - browser.b)
		);
		expect(
			drift,
			`parsed ${rgbToHex(ours!)}, browser painted ${rgbToHex(browser)}`
		).toBeLessThanOrEqual(1);
	});
});

describe('relative color syntax — refusals', () => {
	it.each([
		// Translucent, however it is written: no ratio until it is composited.
		'oklch(from #3366cc l c h / 50%)',
		'rgb(from #3366cc r g b / calc(alpha / 2))',
		// An origin this cannot resolve on its own. `var()` is the engine's job
		// (config/report.ts); the rest are nobody's.
		'oklch(from var(--x) l c h)',
		'oklch(from currentColor l c h)',
		'oklch(from nonsense l c h)',
		// Wrong component count, either way.
		'oklch(from #3366cc l c)',
		'oklch(from #3366cc l c h extra)',
		// A space `color()` does not predefine.
		'color(from #3366cc nonsense r g b)',
		// Broken arithmetic, or arithmetic this does not evaluate.
		'oklch(from #3366cc l c calc(h + ))',
		'oklch(from #3366cc l c calc(h h))',
		'oklch(from #3366cc l c min(h, 10))',
		'oklch(from #3366cc l c calc(h / 0))',
		// A percentage where CSS allows none: hue has no reference to take.
		'oklch(from #3366cc l 50% 50%)',
		// A channel the destination space does not have.
		'oklch(from #3366cc l c b)',
		'rgb(from #3366cc r g h)',
		// A number plus a percentage is invalid CSS, and the browser drops the
		// whole declaration. It is also how someone writes "10% more saturated",
		// so computing it would grade a color that is never painted.
		'hsl(from hsl(210 50% 40%) h calc(s + 10%) l)',
		'oklch(from oklch(0.6 0.08 200) calc(l + 10%) c h)',
		'rgb(from #3366cc calc(r + 50%) 0 0)',
		'rgb(from #3366cc calc(r / 50%) 0 0)',
		// A stray character the tokenizer must not simply drop.
		'rgb(from #3366cc calc(r%) 0 0)',
		// `none` is a component rule, not an operand.
		'rgb(from #3366cc calc(none + 10) 0 0)',
		// The keyword is a plain number inside the arithmetic, so an angle unit
		// there is invalid — the same reason a bare `180deg` in the slot is not.
		'oklch(from #3366cc l c calc(h + 30deg))'
	])('refuses %s', (value) => {
		expect(parseColor(value)).toBeNull();
	});

	it('returns null on pathological nesting rather than throwing', () => {
		const deep = `rgb(from #3366cc calc(${'('.repeat(20000)}1${')'.repeat(20000)}) g b)`;
		expect(parseColor(deep)).toBeNull();
	});
});

describe('relative color syntax — an origin outside sRGB', () => {
	it('derives from the clipped origin, and says the result is one too', () => {
		// The browser keeps the wide-gamut original and lands somewhere else.
		// This is the interchange ceiling, not a rounding step, so the result
		// carries the flag rather than presenting itself as exact.
		const origin = parseColor('oklch(0.7 0.35 150)')!;
		expect(origin.clipped).toBe(true);
		expect(parseColor('oklch(from oklch(0.7 0.35 150) l c h)')!.clipped).toBe(true);
		expect(parseColor('oklch(from #3366cc l c h)')!.clipped).toBeUndefined();
	});
});
