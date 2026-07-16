/**
 * @hyzer-labs/ui token engine — contrast report (specs/29 R5).
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

export interface ContrastReportRow {
	/** Stable pairing id, e.g. `text:intent-danger/surface-muted`. */
	id: string;
	mode: 'light' | 'dark';
	description: string;
	fg: { name: string; hex: string };
	bg: { name: string; hex: string };
	ratio: number;
	level: ContrastLevel;
	/** WCAG AA for normal text (≥ 4.5:1) — also the Section 508 bar. */
	pass: boolean;
}

export interface ContrastReport {
	rows: ContrastReportRow[];
	/** Tokens whose values could not be resolved to a hex; their pairings are skipped. */
	unresolved: string[];
	/** True when every graded pairing passes AA. */
	pass: boolean;
}

// ---------------------------------------------------------------------------
// Static value resolution
// ---------------------------------------------------------------------------

type DeclMap = Map<string, string>;

function declarationMaps(resolved: ResolvedConfig): { light: DeclMap; dark: DeclMap } {
	const light: DeclMap = new Map();
	for (const section of resolved.sections) {
		for (const e of section.entries) light.set(e.cssName, e.value);
	}
	const dark: DeclMap = new Map(light);
	for (const e of [...resolved.dark.color, ...resolved.dark.intent]) dark.set(e.cssName, e.value);
	return { light, dark };
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

// ---------------------------------------------------------------------------
// contrastReport
// ---------------------------------------------------------------------------

export function contrastReport(resolved: ResolvedConfig): ContrastReport {
	const maps = declarationMaps(resolved);
	const rows: ContrastReportRow[] = [];
	const unresolved = new Set<string>();

	for (const mode of ['light', 'dark'] as const) {
		const map = maps[mode];
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
				pass: ratio >= 4.5
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

			// Soft recipes — Badge (14% bg / 65% text) and Alert (10% bg / 70% title).
			const badgeBg = { name: `${short} badge-soft bg`, hex: mixSrgb(hex, surface, 0.14) };
			const alertBg = { name: `${short} alert bg`, hex: mixSrgb(hex, surface, 0.1) };
			push(
				`soft-badge:${short}`,
				`soft Badge text on soft ${short}`,
				{ name: `${short} badge-soft text`, hex: mixSrgb(hex, text, 0.65) },
				badgeBg
			);
			push(
				`soft-alert-title:${short}`,
				`Alert title on tinted ${short}`,
				{ name: `${short} alert title`, hex: mixSrgb(hex, text, 0.7) },
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
		pass: rows.every((row) => row.pass)
	};
}
