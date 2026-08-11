/**
 * Static CSS color parsing, to sRGB, plus the interpolation `color-mix()`
 * needs (`mixColors`).
 *
 * The contrast math in `contrast.ts` is defined on sRGB. The token engine
 * that runs it lives in Node, where there is no CSS parser to borrow, so a
 * config authored in `oklch()` needs this module to be graded at all. Pure
 * functions over strings, no DOM, so the same code grades a sheet at build
 * time and a computed value in the browser.
 *
 * Supported: hex (3/4/6/8 digits), `rgb()`/`rgba()`, `hsl()`/`hsla()`,
 * `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()` in `srgb`,
 * `srgb-linear` and `display-p3`, and the 148 CSS named colors. Both the
 * legacy comma syntax and the modern space syntax, with `none` treated as
 * zero per CSS Color 4. Where CSS clamps a component — alpha, lightness —
 * so does this, and a bare number in a percentage slot means percent, not a
 * fraction. Following those rules exactly is the difference between grading
 * the consumer's color and grading a different one.
 *
 * The refusals, all returning `null` rather than a guess. Anything with
 * alpha below 1, including `transparent`: a translucent color has no
 * contrast ratio until it is composited over a known backdrop. Anything that
 * needs a resolver: `currentColor`, `inherit`, relative color syntax
 * (`oklch(from … )`), `var()` and `color-mix()` — the last two resolved by
 * the engine itself in `config/report.ts`. And anything CSS itself rejects, which a permissive
 * parser would wave through — a `0x10` channel, a bare number in a legacy
 * `hsl()`, mixed comma and space syntax.
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
	// Against a tolerance, not the bare bounds: a round trip through the
	// matrices leaves white a few 1e-8 outside them, and calling that a gamut
	// excursion would mark an all-sRGB palette as approximated. Measured noise
	// tops out around 3e-8; the smallest real excursion is far larger.
	const clipped = encoded.some((c) => c < -1e-6 || c > 1 + 1e-6);
	const [R, G, B] = encoded.map((c) => Math.round(clamp01(c) * 255));
	return clipped ? { r: R, g: G, b: B, clipped: true } : { r: R, g: G, b: B };
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

function hslToRgb(h: number, s: number, l: number): Rgb {
	const sat = clamp01(s);
	const light = clamp01(l);
	const a = sat * Math.min(light, 1 - light);
	const f = (n: number) => {
		const k = (n + h / 30) % 12;
		return light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
	};
	return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

function hwbToRgb(h: number, w: number, b: number): Rgb {
	// White and black covering the whole channel leaves gray, per CSS Color 4.
	if (w + b >= 1) {
		const gray = Math.round((w / (w + b)) * 255);
		return { r: gray, g: gray, b: gray };
	}
	const base = hslToRgb(h, 1, 0.5);
	const apply = (c: number) => Math.round((c / 255) * (1 - w - b) * 255 + w * 255);
	return { r: apply(base.r), g: apply(base.g), b: apply(base.b) };
}

function oklabToRgb(L: number, a: number, b: number): ParsedColor {
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return fromLinear(
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
	);
}

/** The inverse, for mixing: 0–255 sRGB back to oklab's L/a/b. */
function rgbToOklab({ r, g, b }: Rgb): [number, number, number] {
	const [lr, lg, lb] = [r, g, b].map((c) => decodeSrgb(c / 255));
	const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
	const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
	const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
	];
}

/** CIE Lab (D50, as CSS defines it) through Bradford adaptation to linear sRGB. */
function labToRgb(L: number, a: number, b: number): ParsedColor {
	const fy = (L + 16) / 116;
	const fx = fy + a / 500;
	const fz = fy - b / 200;
	const e = 216 / 24389;
	const k = 24389 / 27;
	const f = (t: number) => (t ** 3 > e ? t ** 3 : (116 * t - 16) / k);
	// D50 white point.
	const x = (f(fx) * 0.3457) / 0.3585;
	const y = (L > k * e ? ((L + 16) / 116) ** 3 : L / k) * 1;
	const z = (f(fz) * (1 - 0.3457 - 0.3585)) / 0.3585;
	// D50 → D65 (Bradford), then XYZ → linear sRGB.
	const x65 = 0.9554734527042182 * x - 0.023098536874261423 * y + 0.0632593086610217 * z;
	const y65 = -0.028369706963208136 * x + 1.0099954580058226 * y + 0.021041398966943008 * z;
	const z65 = 0.012314001688319899 * x - 0.020507696433477912 * y + 1.3303659366080753 * z;
	return fromLinear(
		3.2409699419045226 * x65 - 1.537383177570094 * y65 - 0.4986107602930034 * z65,
		-0.9692436362808796 * x65 + 1.8759675015077202 * y65 + 0.04155505740717559 * z65,
		0.05563007969699366 * x65 - 0.20397695888897652 * y65 + 1.0569715142428786 * z65
	);
}

function p3ToRgb(r: number, g: number, b: number): ParsedColor {
	const [lr, lg, lb] = [r, g, b].map(decodeSrgb);
	const x = 0.4865709486482162 * lr + 0.26566769316909306 * lg + 0.1982172852343625 * lb;
	const y = 0.2289745640697488 * lr + 0.6917385218365064 * lg + 0.079286914093745 * lb;
	const z = 0.045113381858902644 * lg + 1.043944368900976 * lb;
	return fromLinear(
		3.2409699419045226 * x - 1.537383177570094 * y - 0.4986107602930034 * z,
		-0.9692436362808796 * x + 1.8759675015077202 * y + 0.04155505740717559 * z,
		0.05563007969699366 * x - 0.20397695888897652 * y + 1.0569715142428786 * z
	);
}

/** Polar to rectangular, for the `lch`/`oklch` pairs. */
function polar(c: number, hueDeg: number): [number, number] {
	const rad = (hueDeg * Math.PI) / 180;
	return [c * Math.cos(rad), c * Math.sin(rad)];
}

// --- mixing ----------------------------------------------------------------

/** The interpolation spaces `mixColors` understands, beyond plain sRGB. */
export type MixSpace = 'oklab' | 'oklch';

/** CSS Color 4's four ways around the hue circle; `shorter` is the default. */
export type HueMethod = 'shorter' | 'longer' | 'increasing' | 'decreasing';

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
 * `color-mix(in <space>, a p%, b)` for the perceptual spaces, as the browser
 * computes it: convert both ends, interpolate, convert back. sRGB mixing is
 * `mixSrgb` in `contrast.ts` — a channelwise lerp needs no round trip.
 *
 * In `oklch`, a chroma of zero leaves the hue powerless: the endpoint has no
 * direction on the circle, so CSS takes the other color's hue rather than
 * interpolating toward an arbitrary one. Skipping that rule sends a mix with
 * gray at one end around the wheel through hues neither color contains.
 *
 * Known ceiling: the endpoints arrive as 8-bit sRGB, so a hue is accurate to
 * roughly half a degree. Every arc choice below turns on a comparison against
 * 180°, and at a separation within about a degree of exactly that, rounding
 * decides the direction — the two arcs are equally long, and CSS picks by the
 * sign of the difference. Carrying more precision would mean a wider
 * interchange type than `ParsedColor`, for a case a real palette is unlikely
 * to hit; the mixes either side of the boundary are unaffected.
 */
export function mixColors(
	a: Rgb,
	b: Rgb,
	weightOfA: number,
	space: MixSpace,
	hue: HueMethod = 'shorter'
): ParsedColor {
	const [L1, a1, b1] = rgbToOklab(a);
	const [L2, a2, b2] = rgbToOklab(b);
	const t = 1 - weightOfA;
	const lerp = (x: number, y: number) => x + (y - x) * t;

	if (space === 'oklab') return oklabToRgb(lerp(L1, L2), lerp(a1, a2), lerp(b1, b2));

	const c1 = Math.hypot(a1, b1);
	const c2 = Math.hypot(a2, b2);
	const POWERLESS = 1e-6;
	const h1 = c1 < POWERLESS ? null : ((Math.atan2(b1, a1) * 180) / Math.PI + 360) % 360;
	const h2 = c2 < POWERLESS ? null : ((Math.atan2(b2, a2) * 180) / Math.PI + 360) % 360;
	// The powerless end takes the other's hue first; the arc is chosen after
	// that, so `longer` still sweeps once the substitution leaves them equal.
	const from = h1 ?? h2 ?? 0;
	const to = h2 ?? h1 ?? 0;
	const mixedHue = from + (alignHue(from, to, hue) - from) * t;
	const [ma, mb] = polar(lerp(c1, c2), mixedHue);
	return oklabToRgb(lerp(L1, L2), ma, mb);
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
	if (input.toLowerCase() === 'transparent') return null;

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
			const s = pctComponent(parts[1], legacy);
			const l = pctComponent(parts[2], legacy);
			if (h === null || s === null || l === null) return null;
			return hslToRgb(((h % 360) + 360) % 360, s, l);
		}
		case 'hwb': {
			if (parts.length !== 3) return null;
			const h = angle(parts[0]);
			const w = pctComponent(parts[1], legacy);
			const b = pctComponent(parts[2], legacy);
			if (h === null || w === null || b === null) return null;
			return hwbToRgb(((h % 360) + 360) % 360, clamp01(w), clamp01(b));
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
			return isOk ? oklabToRgb(clampL(L, 1), a, b) : labToRgb(clampL(L, 100), a, b);
		}
		case 'lch':
		case 'oklch': {
			if (parts.length !== 3) return null;
			const isOk = name === 'oklch';
			const L = numOrPct(parts[0], isOk ? 1 : 100);
			const c = numOrPct(parts[1], isOk ? 0.4 : 150);
			const h = angle(parts[2]);
			if (L === null || c === null || h === null) return null;
			const [a, b] = polar(Math.max(0, c), h);
			return isOk ? oklabToRgb(clampL(L, 1), a, b) : labToRgb(clampL(L, 100), a, b);
		}
		case 'color': {
			if (parts.length !== 4) return null;
			const space = parts[0].toLowerCase();
			const channels = parts.slice(1).map((p) => numOrPct(p, 1));
			if (channels.some((c) => c === null)) return null;
			const [r, g, b] = channels as number[];
			if (space === 'srgb') return fromLinear(decodeSrgb(r), decodeSrgb(g), decodeSrgb(b));
			if (space === 'srgb-linear') return fromLinear(r, g, b);
			if (space === 'display-p3') return p3ToRgb(r, g, b);
			return null;
		}
		default:
			return null;
	}
}
