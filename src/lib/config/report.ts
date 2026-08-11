/**
 * @hyzer-labs/ui token engine — contrast report.
 *
 * Grades the resolved token set against WCAG AA exactly like the library's
 * own token-compliance suite: text roles and every intent as text on both
 * surfaces per mode, surface-colored solid text on every intent background,
 * and the Badge (14%/65%) / Alert (10%/70%) soft color-mix recipes. Any
 * static CSS color resolves through `parseColor`, plus the var() chains and
 * the two-color `color-mix()` in `srgb`, `oklab` and `oklch` this module
 * evaluates itself. A value that resolves to nothing is listed in
 * `unresolved` and its pairings are skipped; a theme that loses a surface or
 * the text role is listed in `skipped` and fails the report outright. A row
 * whose color had to be clipped into sRGB is marked `clipped`.
 */

import {
	contrastRatio,
	bestLevel,
	mixSrgb,
	rgbToHex,
	type ContrastLevel
} from '../utils/contrast.js';
import { parseColor, mixColors, type HueMethod } from '../utils/color.js';
import type { ResolvedConfig } from './schema.js';

/**
 * The reference theme's soft-tint recipe, as fractions of the intent color.
 * Backgrounds strengthen in dark mode — a weak tint of even a bright hue
 * over a dark surface is barely recognizable as color (the same physics
 * behind surface-muted's 6% → 25% jump). This model MUST match the
 * `--hz-badge-tint`/`--hz-alert-tint` values in
 * theme/components/{badge,alert}.css; a computed-style test pins the two
 * together, and the properties are documented consumer hooks for retuning
 * the strength. The `badgeBg`/`alertBg` fractions below are the DEFAULTS
 * only — `tokens.components` is config-reachable, so `contrastReport`
 * substitutes a configured `--hz-badge-tint`/`--hz-alert-tint` in their
 * place (in every mode; the hooks are root-only) whenever it can parse the
 * value as a plain percentage. `badgeText`/`alertTitle` are text mixes with
 * no hook of their own and always stay at the values below. The object's own
 * `light`/`dark` keys are internal names for these two recipes, independent
 * of `defaultThemeName` — the hand-written CSS they model keys on the
 * literal `[data-theme='dark']` attribute, never a configured name.
 */
export const softTints = {
	badgeText: 0.65,
	alertTitle: 0.7,
	light: { badgeBg: 0.14, alertBg: 0.1 },
	dark: { badgeBg: 0.28, alertBg: 0.22 }
} as const;

export interface ContrastReportRow {
	/** Stable pairing id, e.g. `text:intent-danger/surface-muted`. */
	id: string;
	/**
	 * The `data-theme` attribute value that selects this map —
	 * `resolved.defaultThemeName` for the `:root` defaults, which is also
	 * what the restore block re-asserts, then one per theme.
	 */
	mode: string;
	description: string;
	fg: { name: string; hex: string };
	bg: { name: string; hex: string };
	/**
	 * True when either side came from a color outside sRGB, clipped to fit
	 * before it could be graded. The grade holds for an sRGB screen;
	 * a wide-gamut display paints something this ratio does not describe.
	 */
	clipped: boolean;
	ratio: number;
	level: ContrastLevel;
	/** Passes the configured bar (`resolved.contrast.level`): ≥ 4.5:1 for AA, ≥ 7:1 for AAA. */
	pass: boolean;
}

export interface ContrastReport {
	rows: ContrastReportRow[];
	/** Tokens whose values could not be resolved to a hex; their pairings are skipped. */
	unresolved: string[];
	/**
	 * Themes that were not graded at all, because a value every pairing needs
	 * (one of the two surfaces or the text role) did not resolve. A mode
	 * listed here has no rows, so it is a hole in the gate rather than a miss
	 * inside it, and it fails the report on its own.
	 */
	skipped: string[];
	/**
	 * True when every graded pairing passes the configured bar *and* every
	 * theme was graded. A report that graded nothing is never a pass: an
	 * unparseable palette must not read as a clean run.
	 */
	pass: boolean;
	/** The bar every row's `pass` was graded against — `resolved.contrast.level`. */
	level: 'AA' | 'AAA';
}

// ---------------------------------------------------------------------------
// Static value resolution
// ---------------------------------------------------------------------------

type DeclMap = Map<string, string>;

/**
 * One declaration map per theme — the `:root` defaults, labelled with
 * `resolved.defaultThemeName`, then each named theme layered over them.
 * Every theme is graded, so a theme a consumer adds gets exactly the AA gate
 * the built-in dark theme gets — except a named theme carrying no color of
 * its own (only type, spacing, …), which is skipped: its color declarations
 * would be byte-identical to the default's, so grading it would double every
 * row under a mode with nothing new to say. `dark` is always graded — it is
 * seeded from the base authoring, so it is never color-empty. `rest` (the
 * non-color groups) plays no part in this check: grading is about color.
 */
function declarationMaps(resolved: ResolvedConfig): { mode: string; map: DeclMap }[] {
	const light: DeclMap = new Map();
	for (const section of resolved.sections) {
		for (const e of section.entries) light.set(e.cssName, e.value);
	}
	return [
		{ mode: resolved.defaultThemeName, map: light },
		...[resolved.dark, ...resolved.themes]
			.filter(
				(theme) =>
					theme.name === 'dark' ||
					theme.palette.length > 0 ||
					theme.color.length > 0 ||
					theme.intent.length > 0
			)
			.map((theme) => {
				const map: DeclMap = new Map(light);
				for (const e of [...theme.palette, ...theme.color, ...theme.intent]) {
					map.set(e.cssName, e.value);
				}
				return { mode: theme.name, map };
			})
	];
}

/** Split a string on top-level commas (parenthesis-aware). */
function splitTopLevel(input: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let current = '';
	for (const ch of input) {
		if (ch === '(') depth++;
		if (ch === ')') depth--;
		if (ch === ',' && depth === 0) {
			parts.push(current.trim());
			current = '';
		} else {
			current += ch;
		}
	}
	if (current.trim()) parts.push(current.trim());
	return parts;
}

/** A resolved color, and whether reaching sRGB cost it accuracy. */
export interface ResolvedColor {
	hex: string;
	/** True when a leaf fell outside sRGB and was clipped to fit. */
	clipped: boolean;
}

/**
 * Resolve a token value to a hex plus its gamut flag: follows var() chains
 * (using the fallback when the reference is missing) and evaluates two-color
 * `color-mix()` in `srgb`, `oklab` and `oklch`.
 */
export function resolveColor(
	value: string,
	map: Map<string, string>,
	seen: Set<string> = new Set()
): ResolvedColor | null {
	const trimmed = value.trim();

	const parsed = parseColor(trimmed);
	if (parsed) return { hex: rgbToHex(parsed), clipped: parsed.clipped === true };

	const varMatch = /^var\(\s*(--[a-z0-9-]+)\s*(?:,([\s\S]+))?\)$/i.exec(trimmed);
	if (varMatch) {
		const name = varMatch[1];
		if (seen.has(name)) return null; // cycle guard
		const target = map.get(name);
		if (target !== undefined) {
			return resolveColor(target, map, new Set(seen).add(name));
		}
		return varMatch[2] ? resolveColor(varMatch[2], map, seen) : null;
	}

	// `in <space>` plus an optional hue-interpolation method, which only the
	// polar spaces take: `color-mix(in oklch longer hue, a 30%, b)`.
	const mixMatch = /^color-mix\(\s*in\s+([a-z-]+)((?:\s+[a-z]+)*)\s*,([\s\S]+)\)$/i.exec(trimmed);
	if (mixMatch) {
		const space = mixMatch[1].toLowerCase();
		const method = parseHueMethod(mixMatch[2], space);
		if (method === null) return null;
		const components = splitTopLevel(mixMatch[3]);
		if (components.length !== 2) return null;
		const parts = components.map(splitWeight);
		if (parts[0] === null || parts[1] === null) return null;
		const weights = mixWeights([parts[0].weight, parts[1].weight]);
		if (!weights) return null;
		const a = resolveColor(parts[0].color, map, seen);
		const b = resolveColor(parts[1].color, map, seen);
		if (!a || !b) return null;
		const clipped = a.clipped || b.clipped;

		// srgb is a channelwise lerp of the encoded values — the same math the
		// theme's own tint recipes use, and no round trip through a wider space.
		if (space === 'srgb') {
			return { hex: mixSrgb(a.hex, b.hex, weights[0]), clipped };
		}
		if (space === 'oklab' || space === 'oklch') {
			const A = parseColor(a.hex);
			const B = parseColor(b.hex);
			if (!A || !B) return null;
			const mixed = mixColors(A, B, weights[0], space, method);
			return { hex: rgbToHex(mixed), clipped: clipped || mixed.clipped === true };
		}
		// Any other interpolation space: unresolved rather than mixed in the
		// wrong one, which would grade a color the browser never paints.
		return null;
	}

	return null;
}

/** The hex alone, for callers with no use for the gamut flag. */
export function resolveHex(
	value: string,
	map: Map<string, string>,
	seen: Set<string> = new Set()
): string | null {
	return resolveColor(value, map, seen)?.hex ?? null;
}

/**
 * The `<hue-interpolation-method>` after the space. Absent means `shorter`,
 * CSS's default. `null` means the value is not something this understands —
 * a method on a rectangular space,
 * or a keyword that is not one of the four.
 */
function parseHueMethod(tail: string, space: string): HueMethod | null {
	const words = tail.trim().toLowerCase().split(/\s+/).filter(Boolean);
	if (words.length === 0) return 'shorter';
	if (words.length !== 2 || words[1] !== 'hue') return null;
	// oklch is the only polar space resolved here, so it is the only one a hue
	// method can attach to; the rest are refused by the space switch anyway.
	if (space !== 'oklch') return null;
	const method = words[0];
	return method === 'shorter' ||
		method === 'longer' ||
		method === 'increasing' ||
		method === 'decreasing'
		? method
		: null;
}

/**
 * The `30%` on a `color-mix()` component, as a fraction. CSS pairs the color
 * and the percentage with `&&`, so either order is valid — `30% red` and
 * `red 30%` are the same component. Both at once is not, and is refused.
 */
const TRAILING_WEIGHT = /\s([\d.]+)%$/;
const LEADING_WEIGHT = /^([\d.]+)%\s/;

/**
 * A component split into its color and its weight, or `null` when it is not a
 * component at all. A weight on both ends is the case that needs the two
 * outcomes kept apart: reporting it as "no weight given" would quietly mix it
 * half and half, so it has to say invalid instead.
 */
function splitWeight(component: string): { color: string; weight: number | null } | null {
	const c = component.trim();
	const trailing = TRAILING_WEIGHT.exec(c);
	const leading = LEADING_WEIGHT.exec(c);
	if (trailing && leading) return null;
	const match = trailing ?? leading;
	if (!match) return { color: c, weight: null };
	return {
		color: c.replace(trailing ? TRAILING_WEIGHT : LEADING_WEIGHT, '').trim(),
		weight: parseFloat(match[1]) / 100
	};
}

/**
 * CSS Color 5's normalization: one weight given implies the other, neither
 * means half each, and two that do not sum to 1 are scaled until they do.
 * A pair summing to less than 1 also multiplies the result's alpha, which
 * makes it translucent — `null`, since a translucent color has no ratio.
 */
function mixWeights(weights: (number | null)[]): [number, number] | null {
	const [p1, p2] = weights;
	// A percentage outside 0–100% makes the whole `color-mix()` invalid, and an
	// invalid declaration is dropped: the browser paints whatever came before
	// it. Normalizing one instead would grade a color that never reaches a
	// screen.
	const outOfRange = (p: number | null) => p !== null && (p < 0 || p > 1);
	if (outOfRange(p1) || outOfRange(p2)) return null;
	if (p1 === null && p2 === null) return [0.5, 0.5];
	if (p1 === null) return [1 - p2!, p2!];
	if (p2 === null) return [p1, 1 - p1];
	const sum = p1 + p2;
	if (sum <= 0 || sum < 1) return null;
	return [p1 / sum, p2 / sum];
}

/** A plain `<percentage>` literal (`20%`), parsed to a fraction. Anything else is `null`. */
function parsePercentage(value: string): number | null {
	const m = /^(-?[\d.]+)%$/.exec(value.trim());
	return m ? parseFloat(m[1]) / 100 : null;
}

// ---------------------------------------------------------------------------
// contrastReport
// ---------------------------------------------------------------------------

export function contrastReport(resolved: ResolvedConfig): ContrastReport {
	const maps = declarationMaps(resolved);
	const rows: ContrastReportRow[] = [];
	const unresolved = new Set<string>();
	const skipped: string[] = [];
	const level = resolved.contrast.level;
	const threshold = level === 'AAA' ? 7 : 4.5;

	// A configured --hz-badge-tint/--hz-alert-tint (specs/65 R15) — root-only,
	// so one value applies in every mode. Only a plain percentage can replace
	// the built-in fraction; anything else (a var() chain, a calc()) keeps the
	// default recipe and is reported as unresolved, so an override the engine
	// cannot grade is never silently graded as the default anyway.
	const badgeTintEntry = resolved.components.find((e) => e.cssName === '--hz-badge-tint');
	const alertTintEntry = resolved.components.find((e) => e.cssName === '--hz-alert-tint');
	const badgeTintOverride = badgeTintEntry ? parsePercentage(badgeTintEntry.value) : null;
	const alertTintOverride = alertTintEntry ? parsePercentage(alertTintEntry.value) : null;
	if (badgeTintEntry && badgeTintOverride === null) unresolved.add('--hz-badge-tint');
	if (alertTintEntry && alertTintOverride === null) unresolved.add('--hz-alert-tint');

	for (const { mode, map } of maps) {
		const get = (name: string): ResolvedColor | null => {
			const value = map.get(name);
			const color = value === undefined ? null : resolveColor(value, map);
			if (color === null) unresolved.add(`${name} (${mode})`);
			return color;
		};

		const surface = get('--hz-color-surface');
		const surfaceMuted = get('--hz-color-surface-muted');
		const text = get('--hz-color-text');
		// Every pairing in this mode hangs off these three, so losing one means
		// the mode goes ungraded — recorded, never passed over in silence.
		if (!surface || !surfaceMuted || !text) {
			skipped.push(mode);
			continue;
		}
		const surfaces = [
			{ name: 'surface', ...surface },
			{ name: 'surface-muted', ...surfaceMuted }
		];

		/** A color as a pairing sees it: what to call it, and how it resolved. */
		type Swatch = { name: string } & ResolvedColor;

		const push = (id: string, description: string, fg: Swatch, bg: Swatch) => {
			const ratio = contrastRatio(fg.hex, bg.hex);
			rows.push({
				id,
				mode,
				description,
				fg: { name: fg.name, hex: fg.hex },
				bg: { name: bg.name, hex: bg.hex },
				// Either side being an approximation makes the ratio one too.
				clipped: fg.clipped || bg.clipped,
				ratio,
				level: bestLevel(ratio),
				pass: ratio >= threshold
			});
		};

		/** A mix of two resolved colors carries their gamut history forward. */
		const tint = (name: string, a: ResolvedColor, b: ResolvedColor, weightOfA: number): Swatch => ({
			name,
			hex: mixSrgb(a.hex, b.hex, weightOfA),
			clipped: a.clipped || b.clipped
		});

		// Text tokens on both surfaces.
		const textTokens = [
			'--hz-color-text',
			'--hz-color-text-muted',
			...[...map.keys()].filter((n) => n.startsWith('--hz-intent-'))
		];
		for (const name of textTokens) {
			const color = get(name);
			if (!color) continue;
			const short = name.replace('--hz-color-', '').replace('--hz-', '');
			for (const bg of surfaces) {
				push(
					`text:${short}/${bg.name}`,
					`${short} text on ${bg.name}`,
					{ name: short, ...color },
					bg
				);
			}
		}

		// Solid intent backgrounds: surface-colored text on the intent color.
		const intents = [...map.keys()].filter((n) => n.startsWith('--hz-intent-'));
		for (const name of intents) {
			const color = get(name);
			if (!color) continue;
			const short = name.replace('--hz-', '');
			push(
				`solid:${short}`,
				`surface-colored text on solid ${short}`,
				{ name: 'surface', ...surface },
				{ name: short, ...color }
			);

			// Soft recipes — keyed to the theme NAME, because that is what the
			// theme CSS keys them to (`[data-theme='dark'] .hz-badge` bumps
			// --hz-badge-tint). A named theme with a dark surface still gets
			// the light recipe in the browser, so it gets it here too: the
			// report's job is to model the CSS, not to second-guess it. That
			// CSS is hand-written and ships as it is, so this stays the
			// literal 'dark' no matter what the default block is called.
			const tints = mode === 'dark' ? softTints.dark : softTints.light;
			const badgeBgFraction = badgeTintOverride ?? tints.badgeBg;
			const alertBgFraction = alertTintOverride ?? tints.alertBg;
			const badgeBg = tint(`${short} badge-soft bg`, color, surface, badgeBgFraction);
			const alertBg = tint(`${short} alert bg`, color, surface, alertBgFraction);
			push(
				`soft-badge:${short}`,
				`soft Badge text on soft ${short}`,
				tint(`${short} badge-soft text`, color, text, softTints.badgeText),
				badgeBg
			);
			push(
				`soft-alert-title:${short}`,
				`Alert title on tinted ${short}`,
				tint(`${short} alert title`, color, text, softTints.alertTitle),
				alertBg
			);
			push(
				`soft-alert-body:${short}`,
				`Alert body text on tinted ${short}`,
				{ name: 'text', ...text },
				alertBg
			);
		}
	}

	return {
		rows,
		unresolved: [...unresolved].sort(),
		skipped,
		pass: rows.every((row) => row.pass) && skipped.length === 0,
		level
	};
}
