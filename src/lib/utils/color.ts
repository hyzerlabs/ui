/**
 * Static CSS color parsing, to sRGB, plus the interpolation `color-mix()`
 * needs (`mixColors`), in every space CSS can interpolate in.
 *
 * The contrast math in `contrast.ts` is defined on sRGB. The token engine
 * that runs it lives in Node, where there is no CSS parser to borrow, so a
 * config authored in `oklch()` needs this module to be graded at all. Pure
 * functions over strings, no DOM, so the same code grades a sheet at build
 * time and a computed value in the browser.
 *
 * Supported: hex (3/4/6/8 digits), `rgb()`/`rgba()`, `hsl()`/`hsla()`,
 * `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()` in all nine
 * spaces it predefines, and the 148 CSS named colors. Both the legacy comma
 * syntax and the modern space syntax, with `none` treated as zero per CSS
 * Color 4. Where CSS clamps a component (alpha, lightness) so does this, and
 * a bare number in a percentage slot means percent, not a fraction.
 * Following those rules exactly is the difference between grading the
 * consumer's color and grading a different one.
 *
 * The refusals, all returning `null` rather than a guess. Anything with
 * alpha below 1, including `transparent`: a translucent color has no
 * contrast ratio until it is composited over a known backdrop. Anything that
 * needs a resolver: `currentColor`, `inherit`, relative color syntax
 * (`oklch(from … )`), `var()` and `color-mix()`. The last two are resolved a
 * layer up, by `config/report.ts`. And anything CSS itself rejects that a
 * permissive parser would wave through: a `0x10` channel, a bare number in a
 * legacy `hsl()`, mixed comma and space syntax.
 *
 * Colors outside the sRGB gamut are clipped per channel, not gamut-mapped,
 * so a P3 hue grades against its nearest sRGB neighbor. That is close
 * enough for a threshold check, but it is not the color a wide-gamut
 * display paints. CSS Color 4's chroma-reduction mapping is the upgrade if
 * that gap ever matters.
 */

import type { Rgb } from './contrast.js';

/**
 * sRGB channels, plus a marker when the source color did not fit in sRGB and
 * was clipped to reach it. The field is absent rather than `false` on a color
 * that fits, so an in-gamut result stays a plain `{ r, g, b }`.
 */
export interface ParsedColor extends Rgb {
	clipped?: true;
}

/** The 148 CSS named colors, read out of a browser rather than transcribed. */
const NAMED: Record<string, string> = {
	aliceblue: '#f0f8ff',
	antiquewhite: '#faebd7',
	aqua: '#00ffff',
	aquamarine: '#7fffd4',
	azure: '#f0ffff',
	beige: '#f5f5dc',
	bisque: '#ffe4c4',
	black: '#000000',
	blanchedalmond: '#ffebcd',
	blue: '#0000ff',
	blueviolet: '#8a2be2',
	brown: '#a52a2a',
	burlywood: '#deb887',
	cadetblue: '#5f9ea0',
	chartreuse: '#7fff00',
	chocolate: '#d2691e',
	coral: '#ff7f50',
	cornflowerblue: '#6495ed',
	cornsilk: '#fff8dc',
	crimson: '#dc143c',
	cyan: '#00ffff',
	darkblue: '#00008b',
	darkcyan: '#008b8b',
	darkgoldenrod: '#b8860b',
	darkgray: '#a9a9a9',
	darkgreen: '#006400',
	darkgrey: '#a9a9a9',
	darkkhaki: '#bdb76b',
	darkmagenta: '#8b008b',
	darkolivegreen: '#556b2f',
	darkorange: '#ff8c00',
	darkorchid: '#9932cc',
	darkred: '#8b0000',
	darksalmon: '#e9967a',
	darkseagreen: '#8fbc8f',
	darkslateblue: '#483d8b',
	darkslategray: '#2f4f4f',
	darkslategrey: '#2f4f4f',
	darkturquoise: '#00ced1',
	darkviolet: '#9400d3',
	deeppink: '#ff1493',
	deepskyblue: '#00bfff',
	dimgray: '#696969',
	dimgrey: '#696969',
	dodgerblue: '#1e90ff',
	firebrick: '#b22222',
	floralwhite: '#fffaf0',
	forestgreen: '#228b22',
	fuchsia: '#ff00ff',
	gainsboro: '#dcdcdc',
	ghostwhite: '#f8f8ff',
	gold: '#ffd700',
	goldenrod: '#daa520',
	gray: '#808080',
	green: '#008000',
	greenyellow: '#adff2f',
	grey: '#808080',
	honeydew: '#f0fff0',
	hotpink: '#ff69b4',
	indianred: '#cd5c5c',
	indigo: '#4b0082',
	ivory: '#fffff0',
	khaki: '#f0e68c',
	lavender: '#e6e6fa',
	lavenderblush: '#fff0f5',
	lawngreen: '#7cfc00',
	lemonchiffon: '#fffacd',
	lightblue: '#add8e6',
	lightcoral: '#f08080',
	lightcyan: '#e0ffff',
	lightgoldenrodyellow: '#fafad2',
	lightgray: '#d3d3d3',
	lightgreen: '#90ee90',
	lightgrey: '#d3d3d3',
	lightpink: '#ffb6c1',
	lightsalmon: '#ffa07a',
	lightseagreen: '#20b2aa',
	lightskyblue: '#87cefa',
	lightslategray: '#778899',
	lightslategrey: '#778899',
	lightsteelblue: '#b0c4de',
	lightyellow: '#ffffe0',
	lime: '#00ff00',
	limegreen: '#32cd32',
	linen: '#faf0e6',
	magenta: '#ff00ff',
	maroon: '#800000',
	mediumaquamarine: '#66cdaa',
	mediumblue: '#0000cd',
	mediumorchid: '#ba55d3',
	mediumpurple: '#9370db',
	mediumseagreen: '#3cb371',
	mediumslateblue: '#7b68ee',
	mediumspringgreen: '#00fa9a',
	mediumturquoise: '#48d1cc',
	mediumvioletred: '#c71585',
	midnightblue: '#191970',
	mintcream: '#f5fffa',
	mistyrose: '#ffe4e1',
	moccasin: '#ffe4b5',
	navajowhite: '#ffdead',
	navy: '#000080',
	oldlace: '#fdf5e6',
	olive: '#808000',
	olivedrab: '#6b8e23',
	orange: '#ffa500',
	orangered: '#ff4500',
	orchid: '#da70d6',
	palegoldenrod: '#eee8aa',
	palegreen: '#98fb98',
	paleturquoise: '#afeeee',
	palevioletred: '#db7093',
	papayawhip: '#ffefd5',
	peachpuff: '#ffdab9',
	peru: '#cd853f',
	pink: '#ffc0cb',
	plum: '#dda0dd',
	powderblue: '#b0e0e6',
	purple: '#800080',
	rebeccapurple: '#663399',
	red: '#ff0000',
	rosybrown: '#bc8f8f',
	royalblue: '#4169e1',
	saddlebrown: '#8b4513',
	salmon: '#fa8072',
	sandybrown: '#f4a460',
	seagreen: '#2e8b57',
	seashell: '#fff5ee',
	sienna: '#a0522d',
	silver: '#c0c0c0',
	skyblue: '#87ceeb',
	slateblue: '#6a5acd',
	slategray: '#708090',
	slategrey: '#708090',
	snow: '#fffafa',
	springgreen: '#00ff7f',
	steelblue: '#4682b4',
	tan: '#d2b48c',
	teal: '#008080',
	thistle: '#d8bfd8',
	tomato: '#ff6347',
	turquoise: '#40e0d0',
	violet: '#ee82ee',
	wheat: '#f5deb3',
	white: '#ffffff',
	whitesmoke: '#f5f5f5',
	yellow: '#ffff00',
	yellowgreen: '#9acd32'
};

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Lightness, clamped to its range: 0–1 for the ok* pair, 0–100 for lab/lch.
 * CSS clamps it, and the conversions do not degrade gracefully past the ends
 * — a negative oklab L returns a color rather than black.
 */
const clampL = (n: number, max: number) => (n < 0 ? 0 : n > max ? max : n);

/** Linear-light channel to gamma-encoded sRGB. */
function encodeSrgb(c: number): number {
	const sign = c < 0 ? -1 : 1;
	const abs = Math.abs(c);
	return abs <= 0.0031308 ? c * 12.92 : sign * (1.055 * abs ** (1 / 2.4) - 0.055);
}

/** Gamma-encoded sRGB channel to linear light. */
function decodeSrgb(c: number): number {
	const sign = c < 0 ? -1 : 1;
	const abs = Math.abs(c);
	return abs <= 0.04045 ? c / 12.92 : sign * ((abs + 0.055) / 1.055) ** 2.4;
}

/**
 * Linear-light sRGB in 0–1 to the 0–255 integer channels the rest of the code
 * uses. A channel that had to be clipped means the color was outside sRGB, so
 * the result is a stand-in: right for a threshold check on an sRGB screen, not
 * the color a wide-gamut display paints. That is worth reporting rather than
 * burying, so it rides back on the value — see `ParsedColor.clipped`.
 */
function fromLinear(r: number, g: number, b: number): ParsedColor {
	const encoded = [r, g, b].map(encodeSrgb);
	const channels = encoded.map((c) => Math.round(clamp01(c) * 255));
	// Clipped means the clamp moved the byte we output. A tolerance on the
	// channel would need tuning at both ends instead: a round trip leaves white
	// a few 1e-8 outside the cube, and the transfer function multiplies a small
	// negative by 12.92 on the way out, so the same noise reads differently
	// either side of zero. Comparing bytes needs no constant.
	const clipped = channels.some((v, i) => v !== Math.round(encoded[i] * 255));
	return clipped
		? { r: channels[0], g: channels[1], b: channels[2], clipped: true }
		: { r: channels[0], g: channels[1], b: channels[2] };
}

// --- component parsing -----------------------------------------------------

/**
 * A CSS `<number>`, or zero for `none` (CSS Color 4's missing-component
 * rule). The shape is checked before `Number()` sees it: `Number('0x10')` is
 * 16, and a hex literal in a color channel is CSS the browser rejects
 * outright, so parsing one would be inventing a color.
 */
const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

function num(token: string): number | null {
	if (token === 'none') return 0;
	if (!NUMBER.test(token)) return null;
	const n = Number(token);
	return Number.isFinite(n) ? n : null;
}

/** A number or a percentage of `full` (`50%` of 255 → 127.5). */
function numOrPct(token: string, full: number): number | null {
	if (token.endsWith('%')) {
		const n = num(token.slice(0, -1));
		return n === null ? null : (n / 100) * full;
	}
	return num(token);
}

/**
 * The saturation/lightness of `hsl()` and the whiteness/blackness of `hwb()`:
 * `<percentage> | <number>`, where a bare number means that many percent, not
 * that fraction. `hsl(210 90 45)` is `hsl(210 90% 45%)`, so reading 90 as a
 * fraction would clamp it to white — the loudest kind of silent misparse.
 * The bare-number form is modern syntax only; the legacy comma form takes
 * percentages, and browsers reject it otherwise.
 */
function pctComponent(token: string, legacy: boolean): number | null {
	if (token.endsWith('%')) {
		const n = num(token.slice(0, -1));
		return n === null ? null : n / 100;
	}
	if (legacy && token !== 'none') return null;
	const n = num(token);
	return n === null ? null : n / 100;
}

/** An angle in degrees, from any CSS angle unit. */
function angle(token: string): number | null {
	if (token === 'none') return 0;
	const m = /^(-?[\d.e+-]+)(deg|grad|rad|turn)?$/i.exec(token);
	if (!m) return null;
	const n = Number(m[1]);
	if (!Number.isFinite(n)) return null;
	switch ((m[2] ?? 'deg').toLowerCase()) {
		case 'grad':
			return n * 0.9;
		case 'rad':
			return (n * 180) / Math.PI;
		case 'turn':
			return n * 360;
		default:
			return n;
	}
}

/**
 * Split a function's arguments into components and an optional alpha, in
 * either syntax: `a, b, c, alpha` or `a b c / alpha`. Returns null when the
 * two are mixed, which no valid CSS does.
 */
function args(inner: string): { parts: string[]; alpha: string | null; legacy: boolean } | null {
	const slash = inner.split('/');
	if (slash.length > 2) return null;
	const head = slash[0].trim();
	const alphaFromSlash = slash.length === 2 ? slash[1].trim() : null;

	if (head.includes(',')) {
		if (alphaFromSlash !== null) return null;
		const parts = head.split(',').map((p) => p.trim());
		return parts.length === 4
			? { parts: parts.slice(0, 3), alpha: parts[3], legacy: true }
			: { parts, alpha: null, legacy: true };
	}
	const parts = head.split(/\s+/).filter(Boolean);
	return { parts, alpha: alphaFromSlash, legacy: false };
}

/**
 * True when the color is fully opaque. CSS clamps alpha to 0–1, so `/ 1.5`
 * and `/ 150%` are as opaque as `/ 1` and have to grade, not be refused.
 */
function opaque(alpha: string | null): boolean {
	if (alpha === null) return true;
	const value = alpha.endsWith('%') ? numOrPct(alpha, 1) : num(alpha);
	return value !== null && value >= 1;
}

// --- color space conversions -----------------------------------------------

/**
 * Every space converts through one hub, XYZ with a D65 white point, so each
 * one needs a single pair of functions rather than a route to every other.
 * That is also what makes `color-mix()` work in all of them: a mix is
 * "convert both ends into the space, interpolate, convert back".
 *
 * Only the forward matrices are written out. Their inverses are computed at
 * load, because a hand-transcribed inverse is a typo nobody sees until a
 * color comes out subtly wrong in one direction only.
 */

type Vec3 = [number, number, number];
type Mat3 = [Vec3, Vec3, Vec3];

function apply(m: Mat3, [x, y, z]: Vec3): Vec3 {
	return [
		m[0][0] * x + m[0][1] * y + m[0][2] * z,
		m[1][0] * x + m[1][1] * y + m[1][2] * z,
		m[2][0] * x + m[2][1] * y + m[2][2] * z
	];
}

function invert(m: Mat3): Mat3 {
	const [[a, b, c], [d, e, f], [g, h, i]] = m;
	const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
	return [
		[(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det],
		[(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
		[(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det]
	];
}

// Linear-light primaries to XYZ, from the CSS Color 4 sample conversions.
const SRGB_TO_XYZ: Mat3 = [
	[0.41239079926595934, 0.357584339383878, 0.1804807884018343],
	[0.21263900587151027, 0.715168678767756, 0.07219231536073371],
	[0.01933081871559182, 0.11919477979462598, 0.9505321522496607]
];
const P3_TO_XYZ: Mat3 = [
	[0.4865709486482162, 0.26566769316909306, 0.1982172852343625],
	[0.2289745640697488, 0.6917385218365064, 0.079286914093745],
	[0.0, 0.04511338185890264, 1.043944368900976]
];
const A98_TO_XYZ: Mat3 = [
	[0.5766690429101305, 0.1855582379065463, 0.1882286462349947],
	[0.29734497525053605, 0.6273635662554661, 0.07529145849399788],
	[0.02703136138641234, 0.07068885253582723, 0.9913375368376388]
];
const REC2020_TO_XYZ: Mat3 = [
	[0.6369580483012914, 0.14461690358620832, 0.1688809751641721],
	[0.2627002120112671, 0.6779980715188708, 0.05930171646986196],
	[0.0, 0.028072693049087428, 1.060985057710791]
];
/** ProPhoto is the one RGB space defined against D50, not D65. */
const PROPHOTO_TO_XYZ_D50: Mat3 = [
	[0.7977604896723027, 0.13518583717574031, 0.0313493495815248],
	[0.2880711282292934, 0.7118432178101014, 0.00008565396060525902],
	[0.0, 0.0, 0.8251046025104601]
];
/**
 * Bradford chromatic adaptation, for the three things CSS defines against a
 * D50 white rather than D65: ProPhoto RGB, Lab (and so LCH), and `xyz-d50`.
 */
const D50_TO_D65: Mat3 = [
	[0.9554734527042182, -0.023098536874261423, 0.0632593086610217],
	[-0.028369706963208136, 1.0099954580058226, 0.021041398966943008],
	[0.012314001688319899, -0.020507696433477912, 1.3303659366080753]
];

const XYZ_TO_SRGB = invert(SRGB_TO_XYZ);
const D65_TO_D50 = invert(D50_TO_D65);

/** Signed power, since every transfer function below mirrors around zero. */
const spow = (c: number, p: number) => Math.sign(c) * Math.abs(c) ** p;

/** A gamma-encoded RGB space: its primaries, its white, its transfer pair. */
interface RgbSpace {
	toXyz: Mat3;
	fromXyz: Mat3;
	d50: boolean;
	encode: (c: number) => number;
	decode: (c: number) => number;
}

function rgbSpace(
	toXyz: Mat3,
	d50: boolean,
	encode: RgbSpace['encode'],
	decode: RgbSpace['decode']
): RgbSpace {
	return { toXyz, fromXyz: invert(toXyz), d50, encode, decode };
}

// The Rec. 2020 transfer function's constants, and ProPhoto's knees below,
// come from the same CSS Color 4 sample conversions as the matrices above.
const REC2020_A = 1.09929682680944;
const REC2020_B = 0.018053968510807;

const RGB_SPACES: Record<string, RgbSpace> = {
	srgb: rgbSpace(SRGB_TO_XYZ, false, encodeSrgb, decodeSrgb),
	'srgb-linear': rgbSpace(
		SRGB_TO_XYZ,
		false,
		(c) => c,
		(c) => c
	),
	// Display P3 shares sRGB's transfer function, and differs only in primaries.
	'display-p3': rgbSpace(P3_TO_XYZ, false, encodeSrgb, decodeSrgb),
	'a98-rgb': rgbSpace(
		A98_TO_XYZ,
		false,
		(c) => spow(c, 256 / 563),
		(c) => spow(c, 563 / 256)
	),
	'prophoto-rgb': rgbSpace(
		PROPHOTO_TO_XYZ_D50,
		true,
		(c) => (Math.abs(c) >= 1 / 512 ? spow(c, 1 / 1.8) : 16 * c),
		(c) => (Math.abs(c) <= 16 / 512 ? c / 16 : spow(c, 1.8))
	),
	rec2020: rgbSpace(
		REC2020_TO_XYZ,
		false,
		(c) =>
			Math.abs(c) >= REC2020_B
				? Math.sign(c) * (REC2020_A * Math.abs(c) ** 0.45 - (REC2020_A - 1))
				: 4.5 * c,
		(c) =>
			Math.abs(c) < REC2020_B * 4.5
				? c / 4.5
				: Math.sign(c) * ((Math.abs(c) + REC2020_A - 1) / REC2020_A) ** (1 / 0.45)
	)
};

/**
 * Into the hub. The white-point adaptation happens on the linear-light side,
 * after the transfer function and the primaries — doing it on encoded values
 * would adapt a nonlinear quantity and land somewhere else.
 */
function xyzFromRgbSpace(space: RgbSpace, comps: Vec3): Vec3 {
	const linear = apply(space.toXyz, comps.map(space.decode) as Vec3);
	return space.d50 ? apply(D50_TO_D65, linear) : linear;
}

function rgbSpaceFromXyz(space: RgbSpace, xyz: Vec3): Vec3 {
	const adapted = space.d50 ? apply(D65_TO_D50, xyz) : xyz;
	return apply(space.fromXyz, adapted).map(space.encode) as Vec3;
}

// --- CIE Lab, which CSS defines against D50 ---------------------------------

const LAB_E = 216 / 24389;
const LAB_K = 24389 / 27;
/** The D50 white point Lab is relative to. */
const WHITE_D50: Vec3 = [0.3457 / 0.3585, 1, (1 - 0.3457 - 0.3585) / 0.3585];

function xyzFromLab([L, a, b]: Vec3): Vec3 {
	const fy = (L + 16) / 116;
	const f: Vec3 = [fy + a / 500, fy, fy - b / 200];
	const xyzD50 = f.map((t, i) =>
		i === 1
			? (L > LAB_K * LAB_E ? fy ** 3 : L / LAB_K) * WHITE_D50[i]
			: (t ** 3 > LAB_E ? t ** 3 : (116 * t - 16) / LAB_K) * WHITE_D50[i]
	) as Vec3;
	return apply(D50_TO_D65, xyzD50);
}

function labFromXyz(xyz: Vec3): Vec3 {
	const scaled = apply(D65_TO_D50, xyz).map((c, i) => c / WHITE_D50[i]);
	const [fx, fy, fz] = scaled.map((c) => (c > LAB_E ? Math.cbrt(c) : (LAB_K * c + 16) / 116));
	return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

// --- Oklab, defined through linear-light sRGB -------------------------------

function xyzFromOklab([L, a, b]: Vec3): Vec3 {
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return apply(SRGB_TO_XYZ, [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
	]);
}

function oklabFromXyz(xyz: Vec3): Vec3 {
	const [lr, lg, lb] = apply(XYZ_TO_SRGB, xyz);
	const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
	const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
	const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
	];
}

// --- the two sRGB-relative polar spaces -------------------------------------

/**
 * Above the float noise a conversion round trip leaves behind, and well below
 * anything a color carries on purpose. Lab needs a looser one (`SPACES`).
 */
const NEAR_ZERO = 1e-6;

function srgbFromHsl([h, s, l]: Vec3): Vec3 {
	const sat = clamp01(s);
	const light = clamp01(l);
	const a = sat * Math.min(light, 1 - light);
	// Onto the circle first. JS `%` keeps the sign of its left operand, so a
	// negative hue makes every `k` below negative, the piecewise ramp collapses
	// to its floor, and the color comes back flat. A hue arrives here negative
	// whenever `alignHue` shifts one down by 360, which the hue keywords do
	// routinely.
	const hue = ((h % 360) + 360) % 360;
	const f = (n: number) => {
		const k = (n + hue / 30) % 12;
		return light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
	};
	return [f(0), f(8), f(4)];
}

function hslFromSrgb([r, g, b]: Vec3): Vec3 {
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (min + max) / 2;
	const d = max - min;
	// Against a tolerance, not zero. Every caller now hands this exact 8-bit
	// values, where `d` is either 0 or at least 1/255, so this is defensive —
	// but it is what makes the function safe for a caller that does not, and
	// reading a 1e-16 spread as a hue is the failure it prevents.
	if (d <= NEAR_ZERO) return [0, 0, l];
	const s = l === 0 || l === 1 ? 0 : (max - l) / Math.min(l, 1 - l);
	let h: number;
	if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
	else if (max === g) h = (b - r) / d + 2;
	else h = (r - g) / d + 4;
	return [h * 60, s, l];
}

function srgbFromHwb([h, w, b]: Vec3): Vec3 {
	// White and black covering the whole channel leaves gray, per CSS Color 4.
	// Tolerant for the same reason as the test above: a round trip lands the
	// sum on 0.9999999999999998, and an exact test misses every gray but black.
	if (w + b >= 1 - NEAR_ZERO) {
		const gray = w / (w + b);
		return [gray, gray, gray];
	}
	return srgbFromHsl([h, 1, 0.5]).map((c) => c * (1 - w - b) + w) as Vec3;
}

function hwbFromSrgb(rgb: Vec3): Vec3 {
	const [h] = hslFromSrgb(rgb);
	return [h, Math.min(...rgb), 1 - Math.max(...rgb)];
}

// --- polar <-> rectangular --------------------------------------------------

/** Polar to rectangular, for the `lch`/`oklch` pairs. */
function polar(c: number, hueDeg: number): [number, number] {
	const rad = (hueDeg * Math.PI) / 180;
	return [c * Math.cos(rad), c * Math.sin(rad)];
}

function polarFromRect(a: number, b: number): [number, number] {
	return [Math.hypot(a, b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360];
}

// --- the space table --------------------------------------------------------

/**
 * Every interpolation space CSS Color 5 names, as a component vector and the
 * pair of conversions that reaches it. `hue` is the index of the polar
 * component; `powerless` says when that component carries no direction, which
 * is the rule `mixColors` applies below.
 */
interface Space {
	toXyz: (comps: Vec3) => Vec3;
	fromXyz: (xyz: Vec3) => Vec3;
	/**
	 * A space defined directly on sRGB reads its components off the endpoint
	 * instead of going out to the hub and back. The round trip is lossless in
	 * principle and not in practice: it returns cyan's hue as 180.0000000004,
	 * and an arc choice compares against exactly 180, so a complementary pair
	 * goes the wrong way round the circle. Reading the endpoint also leaves a
	 * gray's channels exactly equal, which the tolerant tests below would
	 * otherwise be the only thing catching.
	 *
	 * Their `fromXyz` then has no caller — `mixColors` is the only one, and it
	 * prefers these. It stays because the parse path still needs `toXyz`, and a
	 * row with one direction filled in raises the question this sentence
	 * answers.
	 */
	fromSrgb?: (srgb: Vec3) => Vec3;
	toSrgb?: (comps: Vec3) => Vec3;
	hue?: number;
	powerless?: (comps: Vec3) => boolean;
}

const SPACES: Record<string, Space> = {
	xyz: { toXyz: (c) => c, fromXyz: (c) => c },
	'xyz-d65': { toXyz: (c) => c, fromXyz: (c) => c },
	'xyz-d50': {
		toXyz: (c) => apply(D50_TO_D65, c),
		fromXyz: (c) => apply(D65_TO_D50, c)
	},
	lab: { toXyz: xyzFromLab, fromXyz: labFromXyz },
	oklab: { toXyz: xyzFromOklab, fromXyz: oklabFromXyz },
	lch: {
		toXyz: ([L, C, H]) => xyzFromLab([L, ...polar(Math.max(0, C), H)] as Vec3),
		fromXyz: (xyz) => {
			const [L, a, b] = labFromXyz(xyz);
			return [L, ...polarFromRect(a, b)] as Vec3;
		},
		hue: 2,
		// A gray reaches Lab with a chroma around 1e-5: the Bradford matrix and
		// the D50 white point are rounded independently. So Lab needs its own
		// threshold, an order above that noise and three below any chroma a
		// color carries on purpose. Oklab lands three orders closer to zero, so
		// the shared NEAR_ZERO fits it and not this.
		powerless: ([, C]) => C < 1e-4
	},
	oklch: {
		toXyz: ([L, C, H]) => xyzFromOklab([L, ...polar(Math.max(0, C), H)] as Vec3),
		fromXyz: (xyz) => {
			const [L, a, b] = oklabFromXyz(xyz);
			return [L, ...polarFromRect(a, b)] as Vec3;
		},
		hue: 2,
		powerless: ([, C]) => C < NEAR_ZERO
	},
	hsl: {
		toXyz: (c) => xyzFromRgbSpace(RGB_SPACES.srgb, srgbFromHsl(c)),
		fromXyz: (xyz) => hslFromSrgb(rgbSpaceFromXyz(RGB_SPACES.srgb, xyz)),
		toSrgb: srgbFromHsl,
		fromSrgb: hslFromSrgb,
		hue: 0,
		powerless: ([, s]) => s < NEAR_ZERO
	},
	hwb: {
		toXyz: (c) => xyzFromRgbSpace(RGB_SPACES.srgb, srgbFromHwb(c)),
		fromXyz: (xyz) => hwbFromSrgb(rgbSpaceFromXyz(RGB_SPACES.srgb, xyz)),
		toSrgb: srgbFromHwb,
		fromSrgb: hwbFromSrgb,
		hue: 0,
		powerless: ([, w, b]) => w + b >= 1 - NEAR_ZERO
	},
	...Object.fromEntries(
		Object.entries(RGB_SPACES).map(([name, space]) => [
			name,
			{
				toXyz: (c: Vec3) => xyzFromRgbSpace(space, c),
				fromXyz: (xyz: Vec3) => rgbSpaceFromXyz(space, xyz)
			}
		])
	)
};

/** The nine spaces `color()` predefines: the RGB set, plus the three XYZ forms. */
const COLOR_FN_SPACES = new Set([...Object.keys(RGB_SPACES), 'xyz', 'xyz-d50', 'xyz-d65']);

function rgbFromXyz(xyz: Vec3): ParsedColor {
	const [r, g, b] = apply(XYZ_TO_SRGB, xyz);
	return fromLinear(r, g, b);
}

function xyzFromRgb({ r, g, b }: Rgb): Vec3 {
	return xyzFromRgbSpace(RGB_SPACES.srgb, [r / 255, g / 255, b / 255]);
}

// --- mixing ----------------------------------------------------------------

/** Every interpolation space CSS Color 5 names. */
export type MixSpace = keyof typeof SPACES;

/** CSS Color 4's four ways around the hue circle; `shorter` is the default. */
export type HueMethod = 'shorter' | 'longer' | 'increasing' | 'decreasing';

/**
 * Whether a name is a space `mixColors` can interpolate in. `hasOwn`, not
 * `in`: `constructor` and `__proto__` are on every object literal's
 * prototype, and answering yes to those hands `mixColors` a function where a
 * space belongs — the same hole the named-color lookup is guarded against.
 */
export function isMixSpace(name: string): name is MixSpace {
	return Object.hasOwn(SPACES, name);
}

/** Whether a space has a hue, and so takes a `<hue-interpolation-method>`. */
export function isPolarSpace(name: string): boolean {
	return isMixSpace(name) && SPACES[name].hue !== undefined;
}

/**
 * Move `h2` into the arc the method asks for, relative to `h1`, so a plain
 * lerp between the two lands on the intended side of the circle.
 */
function alignHue(h1: number, h2: number, method: HueMethod): number {
	const d = h2 - h1;
	switch (method) {
		case 'longer':
			// The spec's branch is `-180 < d <= 0`, zero included: two equal hues
			// under `longer` sweep the whole circle rather than standing still.
			return Math.abs(d) < 180 ? h2 + (d > 0 ? -360 : 360) : h2;
		case 'increasing':
			return d < 0 ? h2 + 360 : h2;
		case 'decreasing':
			return d > 0 ? h2 - 360 : h2;
		default:
			return d > 180 ? h2 - 360 : d < -180 ? h2 + 360 : h2;
	}
}

/**
 * `color-mix(in <space>, a p%, b)` as the browser computes it: convert both
 * ends into the space, interpolate componentwise, convert back.
 *
 * A polar space interpolates its hue around the circle instead. A component
 * that carries no direction there — the hue of a gray, which has no angle —
 * is powerless: CSS takes the other color's hue rather than interpolating
 * toward an arbitrary one. Skipping that rule sends a mix with gray at one
 * end around the wheel through hues neither color contains.
 *
 * Known ceiling: the endpoints arrive as 8-bit sRGB, so a hue is accurate to
 * roughly half a degree. Every arc choice turns on a comparison against 180°,
 * and at a separation within about a degree of exactly that, rounding decides
 * the direction — the two arcs are equally long, and CSS picks by the sign of
 * the difference. Carrying more precision would mean a wider interchange type
 * than `ParsedColor`, for a case a real palette is unlikely to hit; the mixes
 * either side of the boundary are unaffected.
 */
export function mixColors(
	a: Rgb,
	b: Rgb,
	weightOfA: number,
	space: MixSpace,
	hue: HueMethod = 'shorter'
): ParsedColor {
	const model = SPACES[space];
	const srgbOf = ({ r, g, b }: Rgb): Vec3 => [r / 255, g / 255, b / 255];
	const from = model.fromSrgb ? model.fromSrgb(srgbOf(a)) : model.fromXyz(xyzFromRgb(a));
	const to = model.fromSrgb ? model.fromSrgb(srgbOf(b)) : model.fromXyz(xyzFromRgb(b));
	const t = 1 - weightOfA;
	const lerp = (x: number, y: number) => x + (y - x) * t;

	if (model.hue !== undefined) {
		// The powerless end takes the other's hue first; the arc is chosen after
		// that, so `longer` still sweeps once the substitution leaves them equal.
		const i = model.hue;
		const deadFrom = model.powerless?.(from) ?? false;
		const deadTo = model.powerless?.(to) ?? false;
		const h1 = deadFrom ? (deadTo ? 0 : to[i]) : from[i];
		const h2 = deadTo ? (deadFrom ? 0 : from[i]) : to[i];
		from[i] = h1;
		to[i] = alignHue(h1, h2, hue);
	}

	const mixed = from.map((c, i) => lerp(c, to[i])) as Vec3;
	if (model.toSrgb) {
		const [r, g, b] = model.toSrgb(mixed);
		return fromLinear(decodeSrgb(r), decodeSrgb(g), decodeSrgb(b));
	}
	return rgbFromXyz(model.toXyz(mixed));
}

// --- the parser ------------------------------------------------------------

/**
 * Parse any static CSS color to sRGB channels, or `null` when it cannot be
 * resolved on its own (see the module comment for what that covers). Out of
 * gamut values are clipped per channel.
 */
export function parseColor(value: string): ParsedColor | null {
	const input = value.trim();
	if (input === '') return null;

	// hasOwn, not a plain lookup: `constructor` and `__proto__` are lowercase
	// keys on Object.prototype, and returning one of those instead of a color
	// makes this throw rather than return null.
	const lower = input.toLowerCase();
	if (Object.hasOwn(NAMED, lower)) return parseColor(NAMED[lower]);
	// A real color, but a fully transparent one, so there is no ratio to grade.
	if (lower === 'transparent') return null;

	const hex = /^#([0-9a-f]{3,8})$/i.exec(input);
	if (hex) {
		const h = hex[1];
		if (h.length === 5 || h.length === 7) return null;
		const wide = h.length > 4;
		const pair = (i: number) =>
			wide ? parseInt(h.slice(i * 2, i * 2 + 2), 16) : parseInt(h[i] + h[i], 16);
		if ((wide && h.length === 8) || (!wide && h.length === 4)) {
			const alpha = wide ? parseInt(h.slice(6, 8), 16) : parseInt(h[3] + h[3], 16);
			if (alpha !== 255) return null;
		}
		return { r: pair(0), g: pair(1), b: pair(2) };
	}

	const fn = /^([a-z-]+)\(([\s\S]*)\)$/i.exec(input);
	if (!fn) return null;
	const name = fn[1].toLowerCase();
	const inner = fn[2].trim();
	// Relative color syntax needs the origin color resolved first — that is a
	// resolver's job, not a parser's.
	if (/^from\s/i.test(inner)) return null;

	const parsed = args(inner);
	if (!parsed) return null;
	const { parts, alpha, legacy } = parsed;
	if (!opaque(alpha)) return null;

	switch (name) {
		case 'rgb':
		case 'rgba': {
			if (parts.length !== 3) return null;
			const channels = parts.map((p) => numOrPct(p, 255));
			if (channels.some((c) => c === null)) return null;
			const [r, g, b] = channels as number[];
			const to255 = (c: number) => Math.round(Math.max(0, Math.min(255, c)));
			return { r: to255(r), g: to255(g), b: to255(b) };
		}
		case 'hsl':
		case 'hsla': {
			if (parts.length !== 3) return null;
			const h = angle(parts[0]);
			const sat = pctComponent(parts[1], legacy);
			const l = pctComponent(parts[2], legacy);
			if (h === null || sat === null || l === null) return null;
			return rgbFromXyz(SPACES.hsl.toXyz([((h % 360) + 360) % 360, sat, l]));
		}
		case 'hwb': {
			if (parts.length !== 3) return null;
			const h = angle(parts[0]);
			const w = pctComponent(parts[1], legacy);
			const b = pctComponent(parts[2], legacy);
			if (h === null || w === null || b === null) return null;
			return rgbFromXyz(SPACES.hwb.toXyz([((h % 360) + 360) % 360, clamp01(w), clamp01(b)]));
		}
		case 'lab':
		case 'oklab': {
			if (parts.length !== 3) return null;
			const isOk = name === 'oklab';
			const L = numOrPct(parts[0], isOk ? 1 : 100);
			// The a/b axes are ±0.4 in oklab and ±125 in lab when given as a
			// percentage; as numbers they are already in the right unit.
			const a = numOrPct(parts[1], isOk ? 0.4 : 125);
			const b = numOrPct(parts[2], isOk ? 0.4 : 125);
			if (L === null || a === null || b === null) return null;
			const model = isOk ? SPACES.oklab : SPACES.lab;
			return rgbFromXyz(model.toXyz([clampL(L, isOk ? 1 : 100), a, b]));
		}
		case 'lch':
		case 'oklch': {
			if (parts.length !== 3) return null;
			const isOk = name === 'oklch';
			const L = numOrPct(parts[0], isOk ? 1 : 100);
			const c = numOrPct(parts[1], isOk ? 0.4 : 150);
			const h = angle(parts[2]);
			if (L === null || c === null || h === null) return null;
			const model = isOk ? SPACES.oklch : SPACES.lch;
			return rgbFromXyz(model.toXyz([clampL(L, isOk ? 1 : 100), Math.max(0, c), h]));
		}
		case 'color': {
			if (parts.length !== 4) return null;
			const space = parts[0].toLowerCase();
			// Only `color()`'s predefined spaces: `color(oklch …)` is not CSS,
			// even though oklch is a space this file otherwise knows.
			if (!COLOR_FN_SPACES.has(space)) return null;
			const channels = parts.slice(1).map((p) => numOrPct(p, 1));
			if (channels.some((c) => c === null)) return null;
			return rgbFromXyz(SPACES[space].toXyz(channels as Vec3));
		}
		default:
			return null;
	}
}
