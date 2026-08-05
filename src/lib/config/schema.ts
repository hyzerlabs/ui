/**
 * @hyzer-labs/ui token engine — config schema & resolution.
 *
 * The token metadata in `src/lib/tokens/index.ts` is the single source of
 * truth. This module merges an optional consumer `HyzerConfig` over that
 * base schema (extend-only: keys override or append, groups are never
 * replaced) into an ordered, validated model the generator emits as CSS.
 * Pure — no filesystem or process access; safe anywhere.
 */

import {
	palette,
	color,
	intent,
	space,
	density,
	width,
	typography,
	radius,
	border,
	shadow,
	zIndex,
	motion
} from '../tokens/index.js';
import { componentHooks } from '../tokens/hooks.js';

// ---------------------------------------------------------------------------
// Public config types
// ---------------------------------------------------------------------------

/**
 * One extendable token group: override an existing key or add a new one.
 * Values are emitted verbatim (hex, var() chains, color-mix(), lengths, …).
 */
export type TokenGroupOverride = Record<string, string>;

/**
 * The palette group additionally accepts one level of nesting for ramps —
 * the base palette ships none, but `{ red: { 50: '#fef2f2', 900: '#7f1d1d' } }`
 * generates `--hz-palette-red-50` / `--hz-palette-red-900`.
 */
export type RampGroupOverride = Record<string, string | Record<string, string>>;

export interface HyzerTokensOverride {
	/** Raw hue tokens (`--hz-palette-*`); ramps supported. */
	palette?: RampGroupOverride;
	/** Structural role tokens (`--hz-color-*`). */
	color?: TokenGroupOverride;
	/**
	 * Intent roles (`--hz-intent-*`) — the remap/extension surface: point an
	 * intent at any color or variable, or add new category intents.
	 */
	intent?: TokenGroupOverride;
	space?: TokenGroupOverride;
	width?: TokenGroupOverride;
	typography?: {
		fontSize?: TokenGroupOverride;
		fontFamily?: TokenGroupOverride;
		fontWeight?: TokenGroupOverride;
		lineHeight?: TokenGroupOverride;
	};
	radius?: TokenGroupOverride;
	border?: { width?: TokenGroupOverride };
	shadow?: TokenGroupOverride;
	zIndex?: TokenGroupOverride;
	motion?: { duration?: TokenGroupOverride; ease?: TokenGroupOverride };
	/** The density grid unit (`--hz-density`); the near/away cascade derives from it. */
	density?: { unit?: string };
	/**
	 * Per-component theme hooks (`--hz-button-accent`, `--hz-badge-tint`, …),
	 * flat and keyed by the hook name minus its `--hz-` prefix
	 * (`buttonAccent`, `badgeTint`). Root-only: a theme entry that sets this
	 * is a `HyzerConfigError`, because a hook is emitted as its own rule on
	 * the component's element, not as a declaration inside a theme block —
	 * point a hook at a token instead, and the token flips per theme on its
	 * own. See the component-hooks docs page for the full vocabulary.
	 */
	components?: TokenGroupOverride;
}

/**
 * One named theme — a `[data-theme="<name>"]` block. A theme is a token
 * override, exactly like `tokens`: it accepts every group `tokens` accepts,
 * not only color.
 */
export type HyzerThemeOverride = HyzerTokensOverride;

export interface HyzerConfig {
	/** Where `hyzer generate` writes the sheet, relative to the config file. */
	output?: string;
	/**
	 * The default theme. Everything under `tokens` is authored into the
	 * `:root` block, which is what a page gets with no `data-theme` attribute
	 * set. It is not "the light theme": it is the default, and light is simply
	 * what the shipped default looks like.
	 */
	tokens?: HyzerTokensOverride;
	/**
	 * Named themes, keyed by the `data-theme` attribute value that activates
	 * them. A theme is a token override — the same shape as `tokens`, and it
	 * takes any group `tokens` takes, not only color. `dark` is a theme like
	 * any other, except that it merges over the base dark authoring (the base
	 * authors dark entirely at the palette layer — the two-tier rule); every
	 * other name starts from nothing and is entirely the consumer's. `light`
	 * is reserved, because the default theme is the `:root` block authored via
	 * `tokens`, and `[data-theme='light']` re-asserts that default for a
	 * reader whose system prefers dark.
	 *
	 * One attribute holds one value, so themes are mutually exclusive: a dark
	 * variant of a named theme is its own entry (`'ocean-dark'`), not a
	 * product of two axes. Consumers who want a theme × mode matrix scope a
	 * sheet under a class instead (`GenerateOptions.selector`), which composes
	 * with `[data-theme='dark']`.
	 */
	themes?: Record<string, HyzerThemeOverride>;
	/**
	 * Kebab-case Lucide icon names — the upstream canonical
	 * form; the run report echoes the generated `Icon<PascalName>` export
	 * name. `hyzer generate` emits a trimmed `icons.ts` barrel: the union of
	 * this list and the always-shipped `CORE_ICONS` set. Unknown names are
	 * collected as warnings, not fatal here — validity against the Lucide
	 * manifest is a runtime question (see `src/lib/config/icons.ts`).
	 */
	icons?: string[];
	/**
	 * Opt in to generating the utilities sheet — absent by
	 * default, so `hyzer generate` writes no utilities file and non-users pay
	 * nothing. `true` opts in with the default filename (`hyzer-utilities.css`,
	 * next to the tokens sheet); an object opts in with a custom `output`
	 * path. The CLI `--utilities` flag also opts in and overrides this key
	 * when present.
	 */
	utilities?: boolean | { output?: string };
}

/** Identity helper — gives `hyzer.config.ts` full typing and autocomplete. */
export function defineConfig(config: HyzerConfig): HyzerConfig {
	return config;
}

/** Configuration problems are reported as this error type (CLI pretty-prints it). */
export class HyzerConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'HyzerConfigError';
	}
}

// ---------------------------------------------------------------------------
// Resolved model
// ---------------------------------------------------------------------------

export interface TokenEntry {
	/** Full custom-property name, e.g. `--hz-palette-primary` or `--hz-color-surface`. */
	cssName: string;
	/** The metadata/config key, e.g. `primary` or `textMuted`. */
	key: string;
	value: string;
	/** True when the consumer config set or added this entry. */
	fromConfig: boolean;
}

export type SectionId =
	| 'palette'
	| 'roles'
	| 'intent'
	| 'fontSize'
	| 'typeSupport'
	| 'space'
	| 'width'
	| 'radius'
	| 'borderWidth'
	| 'shadow'
	| 'zIndex'
	| 'motion';

export interface ResolvedSection {
	id: SectionId;
	entries: TokenEntry[];
}

/** One resolved named theme — emitted as a `[data-theme="<name>"]` block. */
export interface ResolvedTheme {
	/** The `data-theme` attribute value that activates it. */
	name: string;
	palette: TokenEntry[];
	color: TokenEntry[];
	intent: TokenEntry[];
	/** Every non-color group the theme touches, in :root section order. */
	rest: TokenEntry[];
}

export interface ResolvedConfig {
	/** `:root` sections in emission order. */
	sections: ResolvedSection[];
	density: {
		unit: string;
		unitFromConfig: boolean;
		levels: readonly { near: number; away: number }[];
	};
	/**
	 * The `dark` theme, kept as its own field rather than folded into
	 * `themes`: it is the only theme the base itself authors, and two
	 * behaviors are keyed to it specifically because they model a display
	 * condition rather than a naming convention — the
	 * `prefers-color-scheme` default block and the mode-aware soft tints.
	 */
	dark: ResolvedTheme;
	/** Every other named theme, in config declaration order. */
	themes: ResolvedTheme[];
	/**
	 * Resolved `tokens.components` — per-component theme hooks
	 * (`--hz-button-accent`, `--hz-badge-tint`, …), config order. A top-level
	 * field rather than a `ResolvedSection`: sections are `:root`
	 * declarations, and these are emitted as their own rule on the owning
	 * component element instead (see `componentHooks` in
	 * `src/lib/tokens/hooks.ts` and `generate.ts`'s emission).
	 */
	components: TokenEntry[];
	output?: string;
	/**
	 * Deduplicated, order-preserved raw `icons` config —
	 * `undefined` when the key is absent, `[]` is a valid "core-only" value.
	 * Not yet cross-checked against the Lucide manifest; see
	 * `src/lib/config/icons.ts`.
	 */
	icons?: string[];
	/**
	 * The resolved `utilities` opt-in — `enabled` is `false`
	 * when `config.utilities` is absent or `false`; `output` carries
	 * `config.utilities.output` when the object form set one. The CLI
	 * consults this alongside its own `--utilities` flag (which overrides
	 * `enabled` but not `output`); `generateUtilitiesCss` itself doesn't read
	 * this field — it isn't part of what gets rendered into a sheet.
	 */
	utilities: { enabled: boolean; output?: string };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/** camelCase → kebab-case (`textMuted` → `text-muted`; `2xl` stays `2xl`). */
export function toKebab(key: string): string {
	return key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** String-valued entries of a metadata object (skips nested maps like `theme`). */
function stringEntries(obj: Record<string, unknown>): [string, string][] {
	return Object.entries(obj).filter((e): e is [string, string] => typeof e[1] === 'string');
}

function assertKnownKeys(
	obj: Record<string, unknown> | undefined,
	valid: readonly string[],
	where: string
): void {
	if (obj === undefined) return;
	if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
		throw new HyzerConfigError(`${where} must be an object.`);
	}
	for (const key of Object.keys(obj)) {
		if (!valid.includes(key)) {
			throw new HyzerConfigError(
				`Unknown key "${key}" in ${where}. Valid keys: ${valid.join(', ')}.`
			);
		}
	}
}

function assertStringValues(group: TokenGroupOverride | undefined, where: string): void {
	if (!group) return;
	for (const [key, value] of Object.entries(group)) {
		if (typeof value !== 'string' || value.trim() === '') {
			throw new HyzerConfigError(`${where}.${key} must be a non-empty string.`);
		}
	}
}

/**
 * Every check a `HyzerTokensOverride` shape must pass, shared by
 * `config.tokens` and every `config.themes.<name>` entry — one shared group
 * validator (R3) rather than two lists that can drift apart. `where` is the
 * object's own path (`config.tokens` or `config.themes.x`); nested errors
 * name their own sub-path off of it. `isTheme` gates the members that are
 * root-only (R1): `components` today, because a hook is emitted as its own
 * rule on the component's element, not as a declaration inside a theme
 * block, so a theme-block copy of it would be inherited-and-ignored there.
 */
function assertTokenGroups(
	obj: Record<string, unknown> | undefined,
	where: string,
	isTheme = false
): void {
	assertKnownKeys(obj, TOKEN_GROUP_KEYS, where);
	const tokens = obj as HyzerTokensOverride | undefined;
	if (isTheme && tokens?.components !== undefined) {
		throw new HyzerConfigError(
			`${where}.components is not allowed in a theme. Set hooks under config.tokens.components, ` +
				'which applies under every theme. To vary one per theme, point the hook at a token and ' +
				'override that token here.'
		);
	}
	assertKnownKeys(
		tokens?.typography as Record<string, unknown> | undefined,
		['fontSize', 'fontFamily', 'fontWeight', 'lineHeight'],
		`${where}.typography`
	);
	assertKnownKeys(
		tokens?.border as Record<string, unknown> | undefined,
		['width'],
		`${where}.border`
	);
	assertKnownKeys(
		tokens?.motion as Record<string, unknown> | undefined,
		['duration', 'ease'],
		`${where}.motion`
	);
	assertKnownKeys(
		tokens?.density as Record<string, unknown> | undefined,
		['unit'],
		`${where}.density`
	);
	if (tokens?.density?.unit !== undefined && typeof tokens.density.unit !== 'string') {
		throw new HyzerConfigError(`${where}.density.unit must be a string.`);
	}
}

/**
 * Extend-only merge of one group: base keys first (overridden in place),
 * config-added keys appended in config order. Kebab-cased names must stay
 * unique — `textMuted` alongside an existing `text-muted` is an error.
 */
function mergeGroup(
	base: [string, string][],
	override: TokenGroupOverride | undefined,
	prefix: string,
	where: string
): TokenEntry[] {
	const entries: TokenEntry[] = base.map(([key, value]) => ({
		cssName: `${prefix}${toKebab(key)}`,
		key,
		value,
		fromConfig: false
	}));
	if (!override) return entries;

	assertStringValues(override, where);
	for (const [key, value] of Object.entries(override)) {
		const existing = entries.find((e) => e.key === key);
		if (existing) {
			existing.value = value;
			existing.fromConfig = true;
			continue;
		}
		const cssName = `${prefix}${toKebab(key)}`;
		const collision = entries.find((e) => e.cssName === cssName);
		if (collision) {
			throw new HyzerConfigError(
				`${where}.${key} kebab-cases to "${cssName}", which "${collision.key}" already defines.`
			);
		}
		entries.push({ cssName, key, value, fromConfig: true });
	}
	return entries;
}

/**
 * Flatten ramp objects in a palette group: `{ red: { 50: '#fef2f2' } }` →
 * `{ 'red-50': '#fef2f2' }`. The base palette ships no ramps; consumers may
 * add any (.4 — ramp nesting lives under `tokens.palette` only).
 */
function flattenRampGroup(
	group: RampGroupOverride | undefined,
	where: string
): TokenGroupOverride | undefined {
	if (!group) return undefined;
	const flat: TokenGroupOverride = {};
	for (const [key, value] of Object.entries(group)) {
		if (typeof value === 'string') {
			flat[key] = value;
			continue;
		}
		if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
			for (const [step, stepValue] of Object.entries(value)) {
				if (typeof stepValue !== 'string' || stepValue.trim() === '') {
					throw new HyzerConfigError(`${where}.${key}.${step} must be a non-empty string.`);
				}
				flat[`${key}-${step}`] = stepValue;
			}
			continue;
		}
		throw new HyzerConfigError(
			`${where}.${key} must be a string value or a ramp object of string steps.`
		);
	}
	return flat;
}

/**
 * Normalizes `config.utilities` — `undefined`/`false` means
 * "not opted in" (the CLI writes no utilities file); `true` opts in with the
 * default filename; an object opts in with a custom `output` path.
 */
function resolveUtilities(utilities: HyzerConfig['utilities']): {
	enabled: boolean;
	output?: string;
} {
	if (utilities === undefined || utilities === false) return { enabled: false };
	if (utilities === true) return { enabled: true };
	if (utilities === null || typeof utilities !== 'object' || Array.isArray(utilities)) {
		throw new HyzerConfigError(
			'config.utilities must be a boolean or an object with an "output" key.'
		);
	}
	assertKnownKeys(utilities as Record<string, unknown>, ['output'], 'config.utilities');
	if (utilities.output !== undefined && typeof utilities.output !== 'string') {
		throw new HyzerConfigError('config.utilities.output must be a string path.');
	}
	return { enabled: true, output: utilities.output };
}

/**
 * A theme name becomes both a `data-theme` attribute value and part of an
 * attribute-selector string, so it is held to an identifier-safe shape.
 */
const THEME_NAME = /^[a-z][a-z0-9-]*$/;

/**
 * Validate `config.themes` and hand back the map. `light` is rejected rather
 * than accepted-and-ignored: the light theme is the default `:root` block
 * authored via `config.tokens`, and a `themes.light` entry would silently do
 * nothing to it.
 */
function validateThemes(
	themes: HyzerConfig['themes']
): Record<string, HyzerThemeOverride> | undefined {
	if (themes === undefined) return undefined;
	if (themes === null || typeof themes !== 'object' || Array.isArray(themes)) {
		throw new HyzerConfigError('config.themes must be an object keyed by theme name.');
	}
	for (const [name, theme] of Object.entries(themes)) {
		if (name === 'light') {
			throw new HyzerConfigError(
				'config.themes.light is reserved — the light theme is the default :root block, authored via config.tokens.'
			);
		}
		if (!THEME_NAME.test(name)) {
			throw new HyzerConfigError(
				`config.themes["${name}"] is not a valid theme name: use lower-case letters, digits and hyphens, starting with a letter (the name becomes a data-theme attribute value).`
			);
		}
		assertTokenGroups(theme as Record<string, unknown> | undefined, `config.themes.${name}`, true);
	}
	return themes;
}

/**
 * Resolve one named theme. `seed` carries the base metadata a theme starts
 * from — non-empty only for `dark`, which the library itself authors.
 */
function resolveTheme(
	name: string,
	override: HyzerThemeOverride | undefined,
	seed: { palette: [string, string][]; color: [string, string][] }
): ResolvedTheme {
	const where = `config.themes.${name}`;
	const rest: TokenEntry[] = [
		...mergeGroup(
			[],
			override?.typography?.fontSize,
			'--hz-font-size-',
			`${where}.typography.fontSize`
		),
		...mergeGroup(
			[],
			override?.typography?.fontFamily,
			'--hz-font-family-',
			`${where}.typography.fontFamily`
		),
		...mergeGroup(
			[],
			override?.typography?.fontWeight,
			'--hz-font-weight-',
			`${where}.typography.fontWeight`
		),
		...mergeGroup(
			[],
			override?.typography?.lineHeight,
			'--hz-line-height-',
			`${where}.typography.lineHeight`
		),
		...mergeGroup([], override?.space, '--hz-space-', `${where}.space`),
		...mergeGroup([], override?.width, '--hz-width-', `${where}.width`),
		...mergeGroup([], override?.radius, '--hz-radius-', `${where}.radius`),
		...mergeGroup([], override?.border?.width, '--hz-border-width-', `${where}.border.width`),
		...mergeGroup([], override?.shadow, '--hz-shadow-', `${where}.shadow`),
		...mergeGroup([], override?.zIndex, '--hz-z-', `${where}.zIndex`),
		...mergeGroup([], override?.motion?.duration, '--hz-duration-', `${where}.motion.duration`),
		...mergeGroup([], override?.motion?.ease, '--hz-ease-', `${where}.motion.ease`)
	];
	// `--hz-density` is a single entry, not a merged group. It is also the one
	// group that needs the whole page: the ladder's `body` rule resolves the
	// unit on body, so a theme below body leaves the section's own near/away
	// as the fixed lengths they already computed to. The `body
	// [data-density-shift]` rules apply to the shift element itself, though,
	// so a shifted region inside a themed section does resolve against the
	// theme's unit — a section theme half applies rather than no-ops. A
	// theme-scoped ladder rule would have to guess how many
	// data-density-shift ancestors sit between the themed element and body,
	// which is unknowable at generate time, so this stays a page-level
	// override rather than an attempted fix.
	if (override?.density?.unit !== undefined) {
		rest.push({
			cssName: '--hz-density',
			key: 'density',
			value: override.density.unit,
			fromConfig: true
		});
	}
	return {
		name,
		palette: mergeGroup(
			seed.palette,
			flattenRampGroup(override?.palette, `${where}.palette`),
			'--hz-palette-',
			`${where}.palette`
		),
		color: mergeGroup(seed.color, override?.color, '--hz-color-', `${where}.color`),
		intent: mergeGroup([], override?.intent, '--hz-intent-', `${where}.intent`),
		rest
	};
}

const TOKEN_GROUP_KEYS = [
	'palette',
	'color',
	'intent',
	'space',
	'width',
	'typography',
	'radius',
	'border',
	'shadow',
	'zIndex',
	'motion',
	'density',
	'components'
] as const;

// ---------------------------------------------------------------------------
// resolveConfig
// ---------------------------------------------------------------------------

/**
 * Merge a consumer config over the base schema and validate the result.
 * With no config this resolves to exactly the shipped token set.
 */
export function resolveConfig(config: HyzerConfig = {}): ResolvedConfig {
	if (config === null || typeof config !== 'object' || Array.isArray(config)) {
		throw new HyzerConfigError(
			'The hyzer config must be an object (the defineConfig default export).'
		);
	}
	assertKnownKeys(
		config as Record<string, unknown>,
		['output', 'tokens', 'themes', 'icons', 'utilities'],
		'config'
	);
	const tokens = config.tokens;
	assertTokenGroups(tokens as Record<string, unknown> | undefined, 'config.tokens');
	const themesConfig = validateThemes(config.themes);
	if (config.output !== undefined && typeof config.output !== 'string') {
		throw new HyzerConfigError('config.output must be a string path.');
	}
	if (config.icons !== undefined) {
		if (
			!Array.isArray(config.icons) ||
			config.icons.some((n) => typeof n !== 'string' || n.trim() === '')
		) {
			throw new HyzerConfigError(
				'config.icons must be an array of non-empty strings (kebab-case Lucide names).'
			);
		}
	}
	const resolvedUtilities = resolveUtilities(config.utilities);

	// --- palette + roles: two independent groups, split by config shape,
	// not value inference (.2 — "clarity is kindness"). ------------
	const paletteEntries = mergeGroup(
		stringEntries(palette),
		flattenRampGroup(tokens?.palette, 'config.tokens.palette'),
		'--hz-palette-',
		'config.tokens.palette'
	);
	const roleEntries = mergeGroup(
		stringEntries(color),
		tokens?.color,
		'--hz-color-',
		'config.tokens.color'
	);

	const sections: ResolvedSection[] = [
		{ id: 'palette', entries: paletteEntries },
		{ id: 'roles', entries: roleEntries },
		{
			id: 'intent',
			entries: mergeGroup(
				stringEntries(intent),
				tokens?.intent,
				'--hz-intent-',
				'config.tokens.intent'
			)
		},
		{
			id: 'fontSize',
			entries: mergeGroup(
				stringEntries(typography.fontSize),
				tokens?.typography?.fontSize,
				'--hz-font-size-',
				'config.tokens.typography.fontSize'
			)
		},
		{
			id: 'typeSupport',
			entries: [
				...mergeGroup(
					stringEntries(typography.fontFamily),
					tokens?.typography?.fontFamily,
					'--hz-font-family-',
					'config.tokens.typography.fontFamily'
				),
				...mergeGroup(
					stringEntries(typography.fontWeight),
					tokens?.typography?.fontWeight,
					'--hz-font-weight-',
					'config.tokens.typography.fontWeight'
				),
				...mergeGroup(
					stringEntries(typography.lineHeight),
					tokens?.typography?.lineHeight,
					'--hz-line-height-',
					'config.tokens.typography.lineHeight'
				)
			]
		},
		{
			id: 'space',
			entries: mergeGroup(stringEntries(space), tokens?.space, '--hz-space-', 'config.tokens.space')
		},
		{
			id: 'width',
			entries: mergeGroup(stringEntries(width), tokens?.width, '--hz-width-', 'config.tokens.width')
		},
		{
			id: 'radius',
			entries: mergeGroup(
				stringEntries(radius),
				tokens?.radius,
				'--hz-radius-',
				'config.tokens.radius'
			)
		},
		{
			id: 'borderWidth',
			entries: mergeGroup(
				stringEntries(border.width),
				tokens?.border?.width,
				'--hz-border-width-',
				'config.tokens.border.width'
			)
		},
		{
			id: 'shadow',
			entries: mergeGroup(
				stringEntries(shadow),
				tokens?.shadow,
				'--hz-shadow-',
				'config.tokens.shadow'
			)
		},
		{
			id: 'zIndex',
			entries: mergeGroup(stringEntries(zIndex), tokens?.zIndex, '--hz-z-', 'config.tokens.zIndex')
		},
		{
			id: 'motion',
			entries: [
				...mergeGroup(
					stringEntries(motion.duration),
					tokens?.motion?.duration,
					'--hz-duration-',
					'config.tokens.motion.duration'
				),
				...mergeGroup(
					stringEntries(motion.ease),
					tokens?.motion?.ease,
					'--hz-ease-',
					'config.tokens.motion.ease'
				)
			]
		}
	];

	// --- component hooks -------------------------------------------------------
	// Flat, camelCase, keyed by the hook name minus its --hz- prefix; seeded
	// from [] like intent, so only what the config sets is emitted. Every
	// resulting cssName must be a known hook — a typo must never emit a dead
	// declaration on some component's own rule.
	const components = mergeGroup([], tokens?.components, '--hz-', 'config.tokens.components');
	const knownHooks = new Set(componentHooks.map((h) => h.name));
	for (const entry of components) {
		if (!knownHooks.has(entry.cssName)) {
			throw new HyzerConfigError(
				`config.tokens.components.${entry.key} kebab-cases to "${entry.cssName}", which is not a ` +
					'known component hook. The full list is at /docs/theming/components.'
			);
		}
	}

	// --- themes ---------------------------------------------------------------
	// `dark` is seeded from the base metadata: dark is authored entirely at the
	// palette/role layer (the two-tier rule), so the base contributes NO dark
	// intent entries — `themes.dark.intent` stays available as the consumer
	// surface for mode-specific intent remaps. Every other theme seeds from
	// nothing; it is entirely the consumer's authoring.
	const dark = resolveTheme('dark', themesConfig?.dark, {
		palette: stringEntries(palette.theme.dark),
		color: stringEntries(color.theme.dark)
	});
	const themes = Object.entries(themesConfig ?? {})
		.filter(([name]) => name !== 'dark')
		.map(([name, override]) => resolveTheme(name, override, { palette: [], color: [] }));

	const resolved: ResolvedConfig = {
		sections,
		density: {
			unit: tokens?.density?.unit ?? density.unit,
			unitFromConfig: tokens?.density?.unit !== undefined,
			levels: density.levels
		},
		dark,
		themes,
		components,
		output: config.output,
		icons: config.icons !== undefined ? [...new Set(config.icons)] : undefined,
		utilities: resolvedUtilities
	};

	validateReferences(resolved);
	return resolved;
}

/**
 * Every `--hz-*` reference inside a token value must resolve to a defined
 * token. `--hz-space-near`/`--hz-space-away` are derived by
 * the density block and count as defined, and so are the depth-keyed rungs
 * (`--hz-density-ladder-depth-1|2|3|4`) that back them (specs/64 R11) — a
 * config value may reference a rung.
 */
function validateReferences(resolved: ResolvedConfig): void {
	const defined = new Set<string>(['--hz-density', '--hz-space-near', '--hz-space-away']);
	resolved.density.levels.forEach((_, i) => defined.add(`--hz-density-ladder-depth-${i + 1}`));
	const all: TokenEntry[] = [
		...resolved.sections.flatMap((s) => s.entries),
		...[resolved.dark, ...resolved.themes].flatMap((t) => [
			...t.palette,
			...t.color,
			...t.intent,
			...t.rest
		]),
		...resolved.components
	];
	for (const entry of all) defined.add(entry.cssName);
	for (const entry of all) {
		for (const match of entry.value.matchAll(/--hz-[a-z0-9-]+/g)) {
			if (!defined.has(match[0])) {
				throw new HyzerConfigError(
					`${entry.cssName} references ${match[0]}, which is not a defined token.`
				);
			}
		}
	}
}
