import { describe, expect, it } from 'vitest';
import { resolveColor } from './report.js';

/**
 * `color-mix()` evaluation, graded against the browser that has to agree with
 * it. Painting the same expression into a 1×1 sRGB canvas is the only oracle
 * that settles interpolation questions (hue direction, percentage
 * normalization) without transcribing them out of a spec document.
 */
function paint(value: string): { hex: string; alpha: number } {
	const canvas = document.createElement('canvas');
	canvas.width = 1;
	canvas.height = 1;
	const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
	ctx.fillStyle = '#010203';
	ctx.fillStyle = value;
	ctx.fillRect(0, 0, 1, 1);
	const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
	return { hex: `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`, alpha: a };
}

const EMPTY = new Map<string, string>();

/** Every case here is in gamut on both ends, so ±1/255 is the whole tolerance. */
const AGREES = [
	// The theme's own recipe shape, in a perceptual space.
	'color-mix(in oklab, #b91c1c 14%, #ffffff)',
	'color-mix(in oklab, #ffffff, #b91c1c 14%)',
	'color-mix(in oklab, #2563eb, #f59e0b)',
	'color-mix(in oklab, #2563eb 30%, #f59e0b 70%)',
	// Weights that do not sum to 100 scale until they do.
	'color-mix(in oklab, #2563eb 80%, #f59e0b 40%)',
	'color-mix(in oklch, #2563eb, #f59e0b)',
	'color-mix(in oklch, #2563eb 25%, #f59e0b)',
	// All four ways around the circle, and the two that go the long way round
	// land somewhere the short arc never passes through.
	'color-mix(in oklch shorter hue, #2563eb, #f59e0b)',
	'color-mix(in oklch longer hue, #2563eb, #f59e0b)',
	'color-mix(in oklch increasing hue, #2563eb, #f59e0b)',
	'color-mix(in oklch decreasing hue, #2563eb, #f59e0b)',
	// A gray end has no hue to interpolate: CSS takes the other color's.
	'color-mix(in oklch, #808080, #f59e0b)',
	'color-mix(in oklch, #000000, #f59e0b 50%)',
	// The space the theme actually ships, unchanged by any of this.
	'color-mix(in srgb, #b91c1c 14%, #ffffff)',
	'color-mix(in srgb, #64748b 6%, #ffffff)',
	// Two equal hues. `longer` sweeps the whole circle here rather than
	// standing still, which is the case a well-separated pair cannot catch.
	'color-mix(in oklch longer hue, #2563eb, #2563eb)',
	'color-mix(in oklch longer hue, #2563eb 25%, #2563eb)',
	'color-mix(in oklch shorter hue, #2563eb, #2563eb)',
	'color-mix(in oklch increasing hue, #2563eb, #2563eb)',
	'color-mix(in oklch decreasing hue, #2563eb, #2563eb)',
	// A powerless end takes the other's hue, and only then is the arc chosen:
	// the substitution leaves them equal, so `longer` sweeps from there.
	'color-mix(in oklch longer hue, #808080, #b91c1c)',
	'color-mix(in oklch longer hue, #ffffff, #f59e0b)',
	'color-mix(in oklch increasing hue, #808080, #b91c1c)',
	// The ends of the weight range, where one color survives whole.
	'color-mix(in oklab, #2563eb 0%, #f59e0b)',
	'color-mix(in oklab, #2563eb 100%, #f59e0b)',
	'color-mix(in oklch, #2563eb 0%, #f59e0b)',
	// CSS pairs color and percentage with `&&`, so the weight may lead.
	'color-mix(in srgb, 30% #2563eb, #f59e0b)',
	'color-mix(in oklab, 30% #2563eb, #f59e0b)',
	// A mix as an endpoint of a mix.
	'color-mix(in oklab, color-mix(in oklab, #2563eb, #f59e0b), #ffffff)',
	// One mix per interpolation space CSS names, all fifteen, weighted and not.
	// A space reached through the wrong primaries or the wrong white point lands
	// somewhere obvious, so one pair each is enough to pin the conversions.
	...[
		'srgb',
		'srgb-linear',
		'display-p3',
		'a98-rgb',
		'prophoto-rgb',
		'rec2020',
		'lab',
		'oklab',
		'xyz',
		'xyz-d50',
		'xyz-d65',
		'hsl',
		'hwb',
		'lch',
		'oklch'
	].flatMap((space) => [
		`color-mix(in ${space}, #2563eb, #f59e0b)`,
		`color-mix(in ${space}, #2563eb 30%, #f59e0b)`
	]),
	// The hue keywords on every polar space, not just oklch.
	...['hsl', 'hwb', 'lch', 'oklch'].flatMap((space) =>
		['shorter', 'longer', 'increasing', 'decreasing'].map(
			(method) => `color-mix(in ${space} ${method} hue, #2563eb, #f59e0b)`
		)
	),
	// A pair whose aligned hue goes negative. The pair above never does, in any
	// of the four arcs, so it hides a hue conversion that collapses below zero
	// and returns a flat color.
	'color-mix(in hsl longer hue, hsl(20 80% 50%), hsl(120 80% 50%))',
	'color-mix(in hsl decreasing hue, hsl(10 80% 50%), hsl(190 80% 50%))',
	'color-mix(in hsl shorter hue, hsl(10 80% 50%), hsl(200 80% 50%))',
	'color-mix(in hwb longer hue, hwb(20 10% 10%), hwb(120 10% 10%))',
	// An achromatic endpoint in each polar space. A gray has no hue, and the
	// test for that has to survive the float noise of reaching the space.
	'color-mix(in hsl, #808080, #b91c1c)',
	'color-mix(in hwb, #ffffff, #b91c1c)',
	'color-mix(in hwb, #fefefe, #b91c1c)',
	'color-mix(in hwb, #808080, #b91c1c)',
	'color-mix(in hwb, #ffffff 14%, #b91c1c)',
	'color-mix(in lch, #808080, #b91c1c)',
	'color-mix(in lch longer hue, #808080, #b91c1c)',
	'color-mix(in lch, #ffffff 14%, #b91c1c)',
	'color-mix(in oklch, #808080, #b91c1c)',
	// Exactly complementary, where the two arcs are the same length and the
	// direction turns on the sign alone.
	'color-mix(in hsl shorter hue, #ff0000, #00ffff)',
	'color-mix(in hwb shorter hue, #ff0000, #00ffff)',
	'color-mix(in oklch shorter hue, #ff0000, #00ffff)'
];

describe('color-mix — against the browser', () => {
	it.each(AGREES)('%s', (value) => {
		const ours = resolveColor(value, EMPTY);
		expect(ours).not.toBeNull();
		const browser = paint(value);
		expect(browser.alpha).toBe(255);
		const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
		const [a, b] = [channels(ours!.hex), channels(browser.hex)];
		const drift = Math.max(...a.map((c, i) => Math.abs(c - b[i])));
		expect(drift, `${ours!.hex} vs browser ${browser.hex}`).toBeLessThanOrEqual(1);
	});

	it('the long way round is a different color, not a rounding difference', () => {
		const short = resolveColor('color-mix(in oklch shorter hue, #2563eb, #f59e0b)', EMPTY);
		const long = resolveColor('color-mix(in oklch longer hue, #2563eb, #f59e0b)', EMPTY);
		expect(short!.hex).not.toBe(long!.hex);
	});
});

describe('color-mix — what it will not resolve', () => {
	it('refuses weights summing under 100%, which CSS makes translucent', () => {
		// The browser paints these at alpha 153, and a translucent color has no
		// ratio of its own. Resolving them as an opaque 30/70 mix, which the
		// srgb path used to do, grades a color that is never painted.
		for (const value of [
			'color-mix(in srgb, #2563eb 30%, #f59e0b 30%)',
			'color-mix(in oklab, #2563eb 30%, #f59e0b 30%)'
		]) {
			expect(paint(value).alpha).toBe(153);
			expect(resolveColor(value, EMPTY)).toBeNull();
		}
	});

	it.each([
		// A weight outside 0–100% makes the whole function invalid CSS, which
		// the browser drops entirely. Normalizing one of these would grade a
		// declaration that never paints.
		'color-mix(in oklab, #2563eb 101%, #f59e0b 10%)',
		'color-mix(in oklab, #2563eb 120%, #f59e0b 30%)',
		'color-mix(in srgb, #2563eb 120%, #f59e0b 30%)',
		'color-mix(in oklab, #2563eb 150%, #f59e0b)',
		'color-mix(in oklab, #2563eb 0%, #f59e0b 0%)',
		// Both orders of the percentage at once is not a form CSS has.
		'color-mix(in srgb, 30% #2563eb 40%, #f59e0b)',
		// Not an interpolation space at all.
		'color-mix(in nonsense, #2563eb, #f59e0b)',
		'color-mix(in rgb, #2563eb, #f59e0b)',
		// Lowercase keys on Object.prototype again, one layer up from the
		// named-color table: answering yes here hands the mixer a function.
		'color-mix(in constructor, #ffffff, #000000)',
		'color-mix(in __proto__, #ffffff, #000000)',
		// A hue method on a space that has no hue.
		'color-mix(in oklab longer hue, #2563eb, #f59e0b)',
		'color-mix(in display-p3 shorter hue, #2563eb, #f59e0b)',
		// Not one of the four methods.
		'color-mix(in oklch sideways hue, #2563eb, #f59e0b)',
		// Three colors, and an end that does not resolve.
		'color-mix(in oklab, #2563eb, #f59e0b, #000000)',
		'color-mix(in oklab, currentColor, #f59e0b)'
	])('refuses %s', (value) => {
		expect(resolveColor(value, EMPTY)).toBeNull();
	});
});

describe('relative color syntax — origins only the engine can resolve', () => {
	const MAP = new Map([
		['--brand', '#3366cc'],
		['--chain', 'var(--brand)'],
		['--wide', 'oklch(0.7 0.35 150)']
	]);

	it('follows a var() chain, a fallback and a mix to the origin', () => {
		expect(resolveColor('oklch(from var(--brand) l c h)', MAP)!.hex).toBe('#3366cc');
		expect(resolveColor('oklch(from var(--chain) l c h)', MAP)!.hex).toBe('#3366cc');
		expect(resolveColor('oklch(from var(--missing, #3366cc) l c h)', MAP)!.hex).toBe('#3366cc');
		expect(resolveColor('oklch(from color-mix(in oklab, #3366cc, #ffffff) l c h)', MAP)!.hex).toBe(
			'#96b4e9'
		);
	});

	it('applies the arithmetic to a resolved origin', () => {
		expect(resolveColor('oklch(from var(--brand) calc(l * 0.8) c h)', MAP)!.hex).toBe('#1545a8');
	});

	it('carries a wide-gamut origin forward as an approximation', () => {
		expect(resolveColor('oklch(from var(--wide) l c h)', MAP)!.clipped).toBe(true);
		expect(resolveColor('oklch(from var(--brand) l c h)', MAP)!.clipped).toBe(false);
	});

	it('is unresolvable when the origin is', () => {
		expect(resolveColor('oklch(from var(--missing) l c h)', MAP)).toBeNull();
		expect(resolveColor('oklch(from currentColor l c h)', MAP)).toBeNull();
		// Translucent, so there is no ratio to derive from.
		expect(resolveColor('oklch(from rgba(0, 0, 0, 0.5) l c h)', MAP)).toBeNull();
		expect(
			resolveColor('oklch(from var(--faded) l c h)', new Map([['--faded', '#00000080']]))
		).toBeNull();
	});

	it('does not chase a cycle through the origin', () => {
		const cyclic = new Map([
			['--self', 'oklch(from var(--self) l c h)'],
			['--a', 'oklch(from var(--b) l c h)'],
			['--b', 'oklch(from var(--a) l c h)']
		]);
		expect(resolveColor('var(--self)', cyclic)).toBeNull();
		expect(resolveColor('var(--a)', cyclic)).toBeNull();
	});

	it('reads a relative color whose origin is itself one', () => {
		expect(resolveColor('oklch(from rgb(from var(--brand) r g b) l c h)', MAP)!.hex).toBe(
			'#3366cc'
		);
	});
});

describe('color-mix — gamut history', () => {
	it('carries a clipped end through the mix', () => {
		// Mixing happens on the clipped stand-in, not the wide-gamut original,
		// so the result is an approximation twice over. It has to say so.
		const wide = resolveColor('color-mix(in oklch, oklch(0.7 0.35 150), #ffffff)', EMPTY);
		expect(wide).not.toBeNull();
		expect(wide!.clipped).toBe(true);

		const inGamut = resolveColor('color-mix(in oklch, #2563eb, #ffffff)', EMPTY);
		expect(inGamut!.clipped).toBe(false);
	});

	it('does not call float noise a gamut excursion', () => {
		// White, written three ways that each round-trip through a matrix and
		// land a few 1e-8 outside the cube. Marking these would tell someone
		// with an all-sRGB palette that it had been approximated.
		for (const white of ['lab(100 0 0)', 'lch(100 0 0)', 'color(display-p3 1 1 1)']) {
			expect(resolveColor(white, EMPTY)).toEqual({ hex: '#ffffff', clipped: false });
		}
		expect(resolveColor('color-mix(in oklab, #ffffff, #ffffff)', EMPTY)!.clipped).toBe(false);
		expect(resolveColor('color-mix(in oklab, #ff0000, #ff0000)', EMPTY)!.clipped).toBe(false);
	});

	it('follows a var() chain to the color that was clipped', () => {
		const map = new Map([['--brand', 'oklch(0.65 0.31 145)']]);
		expect(resolveColor('var(--brand)', map)!.clipped).toBe(true);
		expect(resolveColor('var(--missing, #2563eb)', map)!.clipped).toBe(false);
	});
});
