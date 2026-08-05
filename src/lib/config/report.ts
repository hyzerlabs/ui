/**
 * @hyzer-labs/ui token engine — contrast report.
 *
 * Grades the resolved token set against WCAG AA exactly like the library's
 * own token-compliance suite: text roles and every intent as text on both
 * surfaces per mode, surface-colored solid text on every intent background,
 * and the Badge (14%/65%) / Alert (10%/70%) soft color-mix recipes. Values
 * that cannot be statically resolved to a hex (arbitrary CSS beyond hex /
 * var() chains / two-color srgb color-mix) are skipped and listed.
 */

import { contrastRatio, bestLevel, mixSrgb, type ContrastLevel } from '../utils/contrast.js';
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
 * no hook of their own and always stay at the values below.
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
	/** Theme name — `light` for the `:root` defaults, then one per theme. */
	mode: string;
	description: string;
	fg: { name: string; hex: string };
	bg: { name: string; hex: string };
	ratio: number;
	level: ContrastLevel;
	/** Passes the configured bar (`resolved.contrast.level`): ≥ 4.5:1 for AA, ≥ 7:1 for AAA. */
	pass: boolean;
}

export interface ContrastReport {
	rows: ContrastReportRow[];
	/** Tokens whose values could not be resolved to a hex; their pairings are skipped. */
	unresolved: string[];
	/** True when every graded pairing passes the configured bar. */
	pass: boolean;
	/** The bar every row's `pass` was graded against — `resolved.contrast.level`. */
	level: 'AA' | 'AAA';
}

// ---------------------------------------------------------------------------
// Static value resolution
// ---------------------------------------------------------------------------

type DeclMap = Map<string, string>;

/**
 * One declaration map per theme — the `:root` defaults ("light"), then each
 * named theme layered over them. Every theme is graded, so a theme a consumer
 * adds gets exactly the AA gate the built-in dark theme gets — except a named
 * theme carrying no color of its own (only type, spacing, …), which is
 * skipped: its color declarations would be byte-identical to `light`, so
 * grading it would double every row under a mode with nothing new to say.
 * `dark` is always graded — it is seeded from the base authoring, so it is
 * never color-empty. `rest` (the non-color groups) plays no part in this
 * check: grading is about color.
 */
function declarationMaps(resolved: ResolvedConfig): { mode: string; map: DeclMap }[] {
	const light: DeclMap = new Map();
	for (const section of resolved.sections) {
		for (const e of section.entries) light.set(e.cssName, e.value);
	}
	return [
		{ mode: 'light', map: light },
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

/** Expand #rgb, lowercase. Returns null when not a plain hex color. */
function normalizeHex(value: string): string | null {
	const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
	if (!m) return null;
	const h = m[1].toLowerCase();
	return h.length === 3 ? `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}` : `#${h}`;
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

/**
 * Resolve a token value to a normalized hex: follows var() chains (using the
 * fallback when the reference is missing) and evaluates two-color
 * `color-mix(in srgb, …)` via the same math the theme's tints use.
 * Exported for the fallback-parity test; not part of the `./config` barrel.
 */
export function resolveHex(
	value: string,
	map: Map<string, string>,
	seen: Set<string> = new Set()
): string | null {
	const trimmed = value.trim();

	const hex = normalizeHex(trimmed);
	if (hex) return hex;

	const varMatch = /^var\(\s*(--[a-z0-9-]+)\s*(?:,([\s\S]+))?\)$/i.exec(trimmed);
	if (varMatch) {
		const name = varMatch[1];
		if (seen.has(name)) return null; // cycle guard
		const target = map.get(name);
		if (target !== undefined) {
			return resolveHex(target, map, new Set(seen).add(name));
		}
		return varMatch[2] ? resolveHex(varMatch[2], map, seen) : null;
	}

	const mixMatch = /^color-mix\(\s*in srgb\s*,([\s\S]+)\)$/i.exec(trimmed);
	if (mixMatch) {
		const components = splitTopLevel(mixMatch[1]);
		if (components.length !== 2) return null;
		const parsed = components.map((comp) => {
			const pct = /^([\s\S]+?)\s+([\d.]+)%$/.exec(comp);
			return pct
				? { color: pct[1].trim(), weight: parseFloat(pct[2]) / 100 }
				: { color: comp, weight: null as number | null };
		});
		const [a, b] = parsed;
		const weightA = a.weight ?? (b.weight !== null ? 1 - b.weight : 0.5);
		const hexA = resolveHex(a.color, map, seen);
		const hexB = resolveHex(b.color, map, seen);
		if (!hexA || !hexB) return null;
		return mixSrgb(hexA, hexB, weightA);
	}

	return null;
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
		const get = (name: string): string | null => {
			const value = map.get(name);
			const hex = value === undefined ? null : resolveHex(value, map);
			if (hex === null) unresolved.add(`${name} (${mode})`);
			return hex;
		};

		const surface = get('--hz-color-surface');
		const surfaceMuted = get('--hz-color-surface-muted');
		const text = get('--hz-color-text');
		if (!surface || !surfaceMuted || !text) continue;
		const surfaces = [
			{ name: 'surface', hex: surface },
			{ name: 'surface-muted', hex: surfaceMuted }
		];

		const push = (
			id: string,
			description: string,
			fg: { name: string; hex: string },
			bg: { name: string; hex: string }
		) => {
			const ratio = contrastRatio(fg.hex, bg.hex);
			rows.push({
				id,
				mode,
				description,
				fg,
				bg,
				ratio,
				level: bestLevel(ratio),
				pass: ratio >= threshold
			});
		};

		// Text tokens on both surfaces.
		const textTokens = [
			'--hz-color-text',
			'--hz-color-text-muted',
			...[...map.keys()].filter((n) => n.startsWith('--hz-intent-'))
		];
		for (const name of textTokens) {
			const hex = get(name);
			if (!hex) continue;
			const short = name.replace('--hz-color-', '').replace('--hz-', '');
			for (const bg of surfaces) {
				push(`text:${short}/${bg.name}`, `${short} text on ${bg.name}`, { name: short, hex }, bg);
			}
		}

		// Solid intent backgrounds: surface-colored text on the intent color.
		const intents = [...map.keys()].filter((n) => n.startsWith('--hz-intent-'));
		for (const name of intents) {
			const hex = get(name);
			if (!hex) continue;
			const short = name.replace('--hz-', '');
			push(
				`solid:${short}`,
				`surface-colored text on solid ${short}`,
				{ name: 'surface', hex: surface },
				{ name: short, hex }
			);

			// Soft recipes — keyed to the theme NAME, because that is what the
			// theme CSS keys them to (`[data-theme='dark'] .hz-badge` bumps
			// --hz-badge-tint). A named theme with a dark surface still gets
			// the light recipe in the browser, so it gets it here too: the
			// report's job is to model the CSS, not to second-guess it.
			const tints = mode === 'dark' ? softTints.dark : softTints.light;
			const badgeBgFraction = badgeTintOverride ?? tints.badgeBg;
			const alertBgFraction = alertTintOverride ?? tints.alertBg;
			const badgeBg = {
				name: `${short} badge-soft bg`,
				hex: mixSrgb(hex, surface, badgeBgFraction)
			};
			const alertBg = { name: `${short} alert bg`, hex: mixSrgb(hex, surface, alertBgFraction) };
			push(
				`soft-badge:${short}`,
				`soft Badge text on soft ${short}`,
				{ name: `${short} badge-soft text`, hex: mixSrgb(hex, text, softTints.badgeText) },
				badgeBg
			);
			push(
				`soft-alert-title:${short}`,
				`Alert title on tinted ${short}`,
				{ name: `${short} alert title`, hex: mixSrgb(hex, text, softTints.alertTitle) },
				alertBg
			);
			push(
				`soft-alert-body:${short}`,
				`Alert body text on tinted ${short}`,
				{ name: 'text', hex: text },
				alertBg
			);
		}
	}

	return {
		rows,
		unresolved: [...unresolved].sort(),
		pass: rows.every((row) => row.pass),
		level
	};
}
