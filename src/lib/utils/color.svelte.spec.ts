import { describe, expect, it } from 'vitest';
import { parseColor } from './color.js';
import { rgbToHex } from './contrast.js';

/**
 * The browser is the oracle. Painting a color into an sRGB canvas and reading
 * the pixel back is exactly what the parser has to reproduce. So every
 * in-gamut case below is checked against the engine that ships the CSS, not
 * against numbers copied out of a spec.
 */
function paint(value: string): { r: number; g: number; b: number } {
	const canvas = document.createElement('canvas');
	canvas.width = 1;
	canvas.height = 1;
	const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
	// A value the browser cannot parse leaves fillStyle where it was, so the
	// pixel comes back black. No case below is black, so a browser that failed
	// to parse shows up as a mismatch rather than a false agreement.
	ctx.fillStyle = '#000';
	ctx.fillStyle = value;
	ctx.fillRect(0, 0, 1, 1);
	const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
	return { r, g, b };
}

/** Same color, allowing the ±1 that rounding at 8 bits can move a channel. */
function expectClose(
	actual: { r: number; g: number; b: number },
	browser: ReturnType<typeof paint>
) {
	const drift = Math.max(
		Math.abs(actual.r - browser.r),
		Math.abs(actual.g - browser.g),
		Math.abs(actual.b - browser.b)
	);
	const show = (c: typeof actual) => `${c.r},${c.g},${c.b}`;
	expect(drift, `parsed ${show(actual)}, browser painted ${show(browser)}`).toBeLessThanOrEqual(1);
}

const IN_GAMUT = [
	'#abc',
	'#AABBCC',
	'#ff0000',
	'rgb(12, 34, 56)',
	'rgb(12 34 56)',
	'rgb(50%, 25%, 10%)',
	'rgba(12, 34, 56, 1)',
	'hsl(210, 90%, 45%)',
	'hsl(210 90% 45%)',
	'hsl(0.5turn 100% 50%)',
	'hsl(3.14159rad 80% 40%)',
	'hsl(-30 50% 50%)',
	'hsla(120, 60%, 70%, 1)',
	'hwb(210 20% 30%)',
	'hwb(0 0% 0%)',
	'hwb(90 60% 60%)',
	'lab(52% 40 60)',
	'lab(80 -20 30)',
	'lch(52% 70 40)',
	'lch(80 30 200)',
	'oklab(0.55 0.1 -0.1)',
	'oklab(0.9 -0.05 0.05)',
	'oklch(0.55 0.15 250)',
	'oklch(0.7 0.1 30)',
	'oklch(0.95 0.02 90)',
	'oklch(50% 0.1 180)',
	// All nine spaces `color()` predefines, which differ in primaries, white
	// point and transfer function. Dark values too: a transfer function's
	// linear segment is where a transcription error hides.
	'color(srgb 0.2 0.4 0.6)',
	'color(srgb-linear 0.2 0.4 0.6)',
	'color(srgb-linear 50% 20% 10%)',
	'color(display-p3 0.3 0.5 0.7)',
	'color(a98-rgb 0.3 0.5 0.7)',
	'color(a98-rgb 0.02 0.02 0.02)',
	'color(prophoto-rgb 0.3 0.5 0.7)',
	'color(prophoto-rgb 0.9 0.9 0.9)',
	'color(prophoto-rgb 0.01 0.01 0.01)',
	'color(rec2020 0.3 0.5 0.7)',
	'color(rec2020 0.01 0.01 0.01)',
	'color(xyz 0.2 0.3 0.4)',
	'color(xyz-d50 0.2 0.3 0.4)',
	'color(xyz-d65 0.2 0.3 0.4)',
	'rebeccapurple',
	'tomato',
	'WHITE',
	// Bare numbers where CSS reads them as percentages. Read as fractions
	// instead, `hsl(210 90 45)` clamps to white — a wrong color, quietly.
	'hsl(210 90 45)',
	'hsl(210 0.9 0.45)',
	'hwb(210 20 30)',
	// Lightness past its range. CSS clamps; the conversions do not degrade
	// gracefully on their own, and a negative oklab L returns a color.
	'oklch(1.02 0.05 90)',
	'oklab(1.4 0.1 0.1)',
	'oklab(-0.4 0.1 0.1)',
	'lch(120 20 30)',
	'lab(101 5 5)',
	'lab(-1 5 5)',
	// The ends of the ramps, and the sRGB transfer function's knee.
	'lab(0 0 0)',
	'lab(100 0 0)',
	'lab(0.5 0 0)',
	'oklch(0.001 0.05 90)',
	'oklch(0.999 0.02 90)',
	'color(srgb 0.0031 0.0031 0.0031)',
	'color(srgb 0.0032 0.0032 0.0032)',
	// Achromatic, including hwb's white + black >= 1 branch.
	'oklch(0.5 0 0)',
	'lch(50 0 0)',
	'hwb(0 100% 100%)',
	'hwb(120 0% 99%)',
	// Components past their range, in both directions.
	'rgb(-10 300 50)',
	'hsl(210 150% 45%)',
	'hsl(210 50% -50%)',
	// Hues far outside one turn, and negative.
	'hsl(720 50% 50%)',
	'hsl(-450 50% 50%)',
	'oklch(0.6 0.1 -720)',
	'lch(50 40 725)',
	'hwb(-90 20% 30%)',
	'hwb(450 20% 30%)',
	// Percentage forms of the axes that are not percentages by default.
	'lab(50% 50% -50%)',
	'oklab(0.5 -30% 30%)',
	'lch(50% 50% 90)',
	// Chroma at the extremes, well outside the gamut.
	'lab(50 -128 127)',
	'lch(90 132 100)',
	'lch(50 200 0)',
	'oklab(0.6 -0.4 0.4)'
];

describe('parseColor — against the browser', () => {
	it.each(IN_GAMUT)('%s', (value) => {
		const parsed = parseColor(value);
		expect(parsed).not.toBeNull();
		expectClose(parsed!, paint(value));
	});

	it('agrees with the browser on every named color', () => {
		const misses: string[] = [];
		for (const name of NAMED_SWEEP) {
			const parsed = parseColor(name);
			if (!parsed) {
				misses.push(`${name}: unparsed`);
				continue;
			}
			const painted = paint(name)!;
			if (rgbToHex(parsed) !== rgbToHex(painted)) {
				misses.push(`${name}: ${rgbToHex(parsed)} vs ${rgbToHex(painted)}`);
			}
		}
		expect(misses).toEqual([]);
	});
});

describe('parseColor — refusals', () => {
	it.each([
		'transparent',
		'currentColor',
		'inherit',
		'var(--hz-color-surface)',
		'oklch(from var(--x) l c h)',
		'rgb(from red r g b)',
		'color-mix(in srgb, red 50%, blue)',
		'rgba(0, 0, 0, 0.5)',
		'hsl(210 90% 45% / 50%)',
		'#00000080',
		'#0008',
		'#12345',
		'oklch(0.5 0.2)',
		// A space `color()` does not predefine, even though the file knows it.
		'color(oklch 0.5 0.1 200)',
		'color(hsl 210 50% 50%)',
		'color(not-a-space 0.2 0.4 0.6)',
		'not-a-color',
		'',
		// JS number literals CSS has never accepted. Number('0x10') is 16, so
		// without a shape check these grade as a color the browser rejects.
		'rgb(0x10 0 0)',
		'rgb(0b11 0 0)',
		'rgb(0o17 0 0)',
		// The legacy comma form takes percentages; browsers reject bare numbers.
		'hsl(210, 90, 45)',
		'hsl(210, 90%, 45)',
		// Lowercase keys that live on Object.prototype. A plain lookup in the
		// named-color table returns one of these instead of a color string.
		'constructor',
		'__proto__',
		'valueOf'
	])('refuses %s', (value) => {
		expect(parseColor(value)).toBeNull();
	});

	it('accepts an alpha that is opaque, including past 1', () => {
		expect(parseColor('rgba(1, 2, 3, 1)')).toEqual({ r: 1, g: 2, b: 3 });
		expect(parseColor('oklch(0.55 0.15 250 / 100%)')).not.toBeNull();
		expect(parseColor('#ff0000ff')).toEqual({ r: 255, g: 0, b: 0 });
		// CSS clamps alpha to 0–1, so these are as opaque as `/ 1`. Refusing
		// them drops a real color out of the report, or fails a strict build.
		expect(parseColor('rgb(1 2 3 / 1.5)')).toEqual({ r: 1, g: 2, b: 3 });
		expect(parseColor('rgb(1 2 3 / 150%)')).toEqual({ r: 1, g: 2, b: 3 });
		expect(parseColor('rgba(1, 2, 3, 2)')).toEqual({ r: 1, g: 2, b: 3 });
	});

	it('treats none as zero, per CSS Color 4', () => {
		expect(parseColor('rgb(none 128 none)')).toEqual({ r: 0, g: 128, b: 0 });
		expect(parseColor('oklch(0.5 none 250)')).toEqual(parseColor('oklch(0.5 0 250)'));
	});
});

describe('parseColor — out of sRGB gamut', () => {
	it('clips into range rather than returning channels the math produced', () => {
		const wide = parseColor('oklch(0.7 0.35 150)')!;
		expect(wide).not.toBeNull();
		for (const c of [wide.r, wide.g, wide.b]) {
			expect(c).toBeGreaterThanOrEqual(0);
			expect(c).toBeLessThanOrEqual(255);
			expect(Number.isInteger(c)).toBe(true);
		}
	});
});

const NAMED_SWEEP = `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond
blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson
cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen
darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey
darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite
forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink
indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral
lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen
lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta
maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue
mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen
paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red
rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue
slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white
whitesmoke yellow yellowgreen`
	.split(/\s+/)
	.filter(Boolean);
