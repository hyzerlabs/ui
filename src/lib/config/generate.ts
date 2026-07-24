/**
 * @hyzer-labs/ui token engine — CSS emission (specs/29).
 *
 * Deterministic: same resolved config → same bytes. Full mode renders the
 * complete tokens sheet (the committed `tokens.css` is this output with no
 * config); overrides mode emits only config-touched declarations as a patch
 * sheet, optionally scoped under a custom selector.
 */

import {
	HyzerConfigError,
	toKebab,
	type ResolvedConfig,
	type SectionId,
	type TokenEntry
} from './schema.js';

export interface GenerateOptions {
	/**
	 * `full` (default) — a complete tokens sheet, imported instead of ours.
	 * `overrides` — only config-touched tokens, imported after ours.
	 */
	mode?: 'full' | 'overrides';
	/**
	 * Root selector (default `:root`). Use a class (e.g. `.theme-ocean`) to
	 * scope a theme to a subtree; the dark block composes with it.
	 */
	selector?: string;
	/**
	 * Extra description lines prepended inside the generated header comment —
	 * how the example sheets carry their name/usage prose.
	 */
	intro?: string[];
}

// ---------------------------------------------------------------------------
// Templates — section banners and per-token notes carried over from the
// hand-authored sheet so the generated file keeps its documentation value.
// ---------------------------------------------------------------------------

const SECTION_BANNERS: Record<SectionId, string[]> = {
	palette: ['Layer 1 — Palette (--hz-palette-*)', 'Single value per color; no per-color ramps.'],
	roles: [
		'Layer 2 — Semantic roles (light defaults)',
		'Reference the palette via var(); the dark block overrides these roles',
		'(and the status hues below) — the indirection point for theming.'
	],
	intent: [
		'Layer 2 — Intent roles',
		'The component-facing intent vocabulary (Button/Badge/Alert intents,',
		'field error states). Same indirection pattern as the roles above:',
		'override --hz-intent-* to retarget status colors specifically without',
		'touching the palette; override the palette and these follow.'
	],
	fontSize: ['Type scale'],
	typeSupport: ['Supporting type tokens'],
	space: ['Spacing — backs existing component fallbacks (values are fixed)'],
	width: [
		'Sizing / width — backs existing component fallbacks (values are fixed)',
		"Overriding these retunes Container max, Split's stackBelow threshold,",
		"and Grid's fluid { min } mode — all resolve via var(). Grid's BAND",
		'breakpoints (base/sm/md/lg) mirror these values but stay literal',
		'system constants: CSS cannot read custom properties in media or',
		'container queries.'
	],
	radius: ['Radius'],
	borderWidth: ['Border width'],
	shadow: ['Elevation'],
	zIndex: ['Z-index'],
	motion: ['Motion']
};

/** Inline notes emitted immediately before specific declarations. */
const TOKEN_NOTES: Record<string, string[]> = {
	'--hz-palette-success': [
		'Status hues tuned 2026-07-14 so every intent color passes WCAG AA',
		'(≥ 4.5:1) as text on both light surfaces — and so white text passes',
		'on every solid intent background.'
	],
	'--hz-color-surface-muted': [
		'Subdued opaque surface (code blocks, footer, quiet panels): gray mixed',
		"over surface, so it tracks surface overrides and covers what's behind",
		'it. The dark block strengthens the mix — 6% is invisible over black.'
	],
	'--hz-density': [
		'Density grid unit — drives --hz-space-near/--hz-space-away (see the',
		'density spacing block below). Override to retune every distance.'
	]
};

const FULL_HEADER = [
	'/**',
	' * @hyzer-labs/ui design tokens',
	' *',
	' * GENERATED FILE — do not edit by hand.',
	' * Source of truth: src/lib/tokens/index.ts, rendered by the token engine',
	' * (src/lib/config). Regenerate with `pnpm gen:tokens` in this repo, or',
	' * `hyzer generate` against a hyzer.config in a consumer project.',
	' *',
	' * CSS custom properties — the primary token format.',
	' * Two-layer color model: palette (Layer 1) + semantic roles (Layer 2).',
	' */'
].join('\n');

const DENSITY_COMMENT = [
	'/* ==========================================================================',
	' * Density spacing — adapted from "Complementary Space"',
	' * (https://blog.damato.design/posts/complementary-space/).',
	' * Two distances: --hz-space-near separates related things, --hz-space-away',
	' * separates unrelated things; both derive from the --hz-density grid unit.',
	' * Each data-density-shift ancestor tightens the pair one step, so nested',
	' * regions read denser without new spacing values. The near multipliers walk',
	" * the 1-2-5-10 ladder, and a shifted region's away always equals its",
	" * parent's near. Coexists with the fixed --hz-space-* scale above.",
	' * ========================================================================== */'
].join('\n');

const DARK_COMMENT = [
	'/* ==========================================================================',
	' * Dark theme — authored entirely at the palette/role layer (the two-tier',
	" * rule). Surface and text flip, surface-muted's gray tint strengthens (6%",
	' * is invisible over black), and every hue lightens to a companion that',
	' * keeps WCAG AA (≥ 4.5:1) as text on both dark surfaces. Roles and',
	' * intents are pure var() chains, so all of Layer 2 follows automatically.',
	' * The companions are authored literals: the single-value palette ships no',
	' * light ramp to reference. Setting data-theme="dark" on any ancestor',
	' * activates this block for that subtree via normal CSS cascade.',
	' * ========================================================================== */'
].join('\n');

// ---------------------------------------------------------------------------
// Emission helpers
// ---------------------------------------------------------------------------

function banner(lines: string[], indent: string): string {
	const bar = '='.repeat(69);
	return [
		`${indent}/* ${bar}`,
		...lines.map((l) => `${indent} * ${l}`),
		`${indent} * ${bar} */`
	].join('\n');
}

function note(lines: string[], indent: string): string {
	if (lines.length === 1) return `${indent}/* ${lines[0]} */`;
	return (
		[`${indent}/* ${lines[0]}`, ...lines.slice(1).map((l) => `${indent} * ${l}`)].join('\n') + ' */'
	);
}

function declarations(entries: TokenEntry[], indent: string, withNotes: boolean): string[] {
	const out: string[] = [];
	for (const entry of entries) {
		const noteLines = withNotes ? TOKEN_NOTES[entry.cssName] : undefined;
		if (noteLines) out.push(note(noteLines, indent));
		out.push(`${indent}${entry.cssName}: ${entry.value};`);
	}
	return out;
}

function densityBlock(resolved: ResolvedConfig): string {
	const rules = resolved.density.levels.map((level, depth) => {
		const selector = depth === 0 ? 'body' : `body ${'[data-density-shift] '.repeat(depth).trim()}`;
		return [
			`${selector} {`,
			`\t--hz-space-near: calc(var(--hz-density) * ${level.near});`,
			`\t--hz-space-away: calc(var(--hz-density) * ${level.away});`,
			'}'
		].join('\n');
	});
	return rules.join('\n\n');
}

/**
 * Dark-block selector: plain hook at :root, compound + descendant when scoped
 * (the scope element may carry data-theme itself, or inherit it from an
 * ancestor like <html>).
 *
 * The scoped pair is emitted one selector per line: generated sheets are
 * committed, so `prettier --check .` sees them, and a comma-joined pair of
 * this length is exactly what Prettier would break. Matching its output keeps
 * the drift test and the lint suite from contradicting each other.
 */
function darkSelector(selector: string): string {
	if (selector === ':root') return "[data-theme='dark']";
	return `${selector}[data-theme='dark'],\n[data-theme='dark'] ${selector}`;
}

/** Custom-property names referenced by var() inside a token value. */
function varRefs(value: string): string[] {
	return [...value.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)].map((m) => m[1]);
}

/**
 * The tokens a SCOPED override sheet must re-declare: everything the config
 * touched, plus the transitive closure of tokens whose values depend on them.
 *
 * Why this exists. The two-layer color model is built on indirection —
 * `--hz-intent-primary: var(--hz-palette-primary)` — and var() inside a custom
 * property is substituted at computed-value time ON THE ELEMENT THE
 * DECLARATION APPLIES TO. At `:root` that is exactly what we want: an
 * override of `--hz-palette-primary` lands on the same element as the intent
 * declaration, so the cascade picks the new value and the whole chain
 * re-resolves.
 *
 * Scoped to a class it breaks. `.theme-ocean { --hz-palette-primary: #0f766e }`
 * leaves `--hz-intent-primary` declared back at `:root`, where it already
 * computed to the BASE blue and inherits down as that resolved value — so
 * every component reading the intent vocabulary (Button, Badge, Alert) keeps
 * the base palette while the panel swears it is teal.
 *
 * Re-emitting the dependents under the scope re-resolves them against the
 * scope's own values. The seed includes dark-block entries: a hue overridden
 * only in dark still needs its intent chain declared locally, or the dark
 * block has nothing to feed.
 */
function scopedClosure(resolved: ResolvedConfig): Set<string> {
	const included = new Set<string>();
	for (const section of resolved.sections) {
		for (const e of section.entries) if (e.fromConfig) included.add(e.cssName);
	}
	for (const e of [...resolved.dark.palette, ...resolved.dark.color, ...resolved.dark.intent]) {
		if (e.fromConfig) included.add(e.cssName);
	}

	const all = resolved.sections.flatMap((s) => s.entries);
	for (let changed = true; changed; ) {
		changed = false;
		for (const e of all) {
			if (included.has(e.cssName)) continue;
			if (varRefs(e.value).some((ref) => included.has(ref))) {
				included.add(e.cssName);
				changed = true;
			}
		}
	}
	return included;
}

// ---------------------------------------------------------------------------
// generateCss
// ---------------------------------------------------------------------------

export function generateCss(resolved: ResolvedConfig, options: GenerateOptions = {}): string {
	const mode = options.mode ?? 'full';
	const selector = options.selector ?? ':root';
	return mode === 'full'
		? generateFull(resolved, selector, options.intro)
		: generateOverrides(resolved, selector, options.intro);
}

/** Weave optional intro lines into a generated header comment. */
function withIntro(header: string, intro: string[] | undefined): string {
	if (!intro || intro.length === 0) return header;
	const lines = header.split('\n');
	// After the opening '/**': the intro block, a spacer, then the stock text.
	return [lines[0], ...intro.map((l) => ` * ${l}`.trimEnd()), ' *', ...lines.slice(1)].join('\n');
}

function generateFull(resolved: ResolvedConfig, selector: string, intro?: string[]): string {
	const parts: string[] = [withIntro(FULL_HEADER, intro), `${selector} {`];

	resolved.sections.forEach((section, i) => {
		if (i > 0) parts.push('');
		parts.push(banner(SECTION_BANNERS[section.id], '\t'));
		parts.push(...declarations(section.entries, '\t', true));
		if (section.id === 'space') {
			parts.push('');
			parts.push(note(TOKEN_NOTES['--hz-density'], '\t'));
			parts.push(`\t--hz-density: ${resolved.density.unit};`);
		}
	});
	parts.push('}');

	parts.push('', DENSITY_COMMENT, densityBlock(resolved));

	parts.push('', DARK_COMMENT, `${darkSelector(selector)} {`);
	// Role dark, then palette dark, then intent dark — sourced directly from
	// the three resolved dark lists (specs/42 R2.3); no value-shape inference.
	parts.push(...declarations(resolved.dark.color, '\t', false));
	if (resolved.dark.palette.length > 0) {
		parts.push('');
		parts.push(...declarations(resolved.dark.palette, '\t', false));
	}
	if (resolved.dark.intent.length > 0) {
		parts.push('');
		parts.push(...declarations(resolved.dark.intent, '\t', false));
	}
	parts.push('}');

	return parts.join('\n') + '\n';
}

function generateOverrides(resolved: ResolvedConfig, selector: string, intro?: string[]): string {
	const scoped = selector !== ':root';
	const header = withIntro(
		[
			'/**',
			' * @hyzer-labs/ui token overrides',
			' *',
			' * GENERATED FILE — do not edit by hand (hyzer generate --mode overrides).',
			...(scoped
				? [
						' * Config-touched tokens plus every token that derives from them: a',
						' * scoped sheet must re-declare the derived Layer-2 chain, because a',
						' * var() indirection declared at :root already resolved there and',
						' * inherits down as a fixed value.',
						' * Import this sheet AFTER @hyzer-labs/ui/tokens.css so the overrides',
						' * win by source order.'
					]
				: [
						' * Only config-touched tokens are emitted; import this sheet AFTER',
						' * @hyzer-labs/ui/tokens.css so the overrides win by source order.'
					]),
			' */'
		].join('\n'),
		intro
	);

	// Scoped sheets carry the derived chain too — see scopedClosure().
	const emit = scoped ? scopedClosure(resolved) : null;
	const rootEntries = resolved.sections.flatMap((s) =>
		s.entries.filter((e) => (emit ? emit.has(e.cssName) : e.fromConfig))
	);

	/**
	 * The dark block needs the same treatment for a different reason. A base
	 * dark entry like surface-muted's stronger tint
	 * (`color-mix(… var(--hz-palette-gray) 25%, var(--hz-color-surface))`) is
	 * declared at :root's dark block. Scoped, it never reaches the subtree, and
	 * the scope's own light-block declaration would silently keep applying its
	 * 6% light-mode tint in dark. Re-emit any dark entry that derives from a
	 * token the scope redeclares.
	 */
	const darkDerives = (e: TokenEntry) =>
		emit !== null && varRefs(e.value).some((ref) => emit.has(ref));
	const darkEntries = [
		...resolved.dark.color.filter((e) => e.fromConfig || darkDerives(e)),
		...resolved.dark.palette.filter((e) => e.fromConfig || darkDerives(e)),
		...resolved.dark.intent.filter((e) => e.fromConfig || darkDerives(e))
	];

	const parts: string[] = [header];
	const hasRoot = rootEntries.length > 0 || resolved.density.unitFromConfig;
	if (hasRoot) {
		parts.push(`${selector} {`);
		parts.push(...declarations(rootEntries, '\t', false));
		if (resolved.density.unitFromConfig) parts.push(`\t--hz-density: ${resolved.density.unit};`);
		parts.push('}');
	}
	if (darkEntries.length > 0) {
		if (hasRoot) parts.push('');
		parts.push(`${darkSelector(selector)} {`);
		parts.push(...declarations(darkEntries, '\t', false));
		parts.push('}');
	}
	if (!hasRoot && darkEntries.length === 0) {
		parts.push('/* No overrides configured. */');
	}
	return parts.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// generateUtilitiesCss (specs/44) — the opt-in utility sheet
// ---------------------------------------------------------------------------

export interface GenerateUtilitiesOptions {
	/**
	 * Extra description lines prepended inside the generated header comment —
	 * same weaving as `GenerateOptions.intro`.
	 */
	intro?: string[];
}

const UTILITIES_HEADER = [
	'/**',
	' * @hyzer-labs/ui utilities',
	' *',
	' * GENERATED FILE — do not edit by hand.',
	' * Source of truth: src/lib/tokens/index.ts, rendered by the token engine',
	' * (src/lib/config). Regenerate with `pnpm gen:tokens` in this repo, or',
	' * `hyzer generate --utilities` (or `config.utilities`) against a',
	' * hyzer.config in a consumer project.',
	' *',
	' * Opt-in — import this sheet explicitly, like a theme sheet',
	' * (`@hyzer-labs/ui/utilities.css`). A consumer who never imports it ships',
	' * zero of these bytes.',
	' *',
	' * Definition: a utility class is a token-derived, single-property',
	' * helper — one class, one declaration, resolved from a design token.',
	' * That is the whole definition; it does not depend on where the class',
	' * is or is not used.',
	' *',
	' * Anti-goal: utilities are for ad-hoc spots — nudging one element,',
	' * tinting one line of text — not an alternative layout system.',
	' * Components already own their spacing (gap/padding props, the',
	' * data-padding/data-gap scales) and the density system',
	' * (--hz-space-near/--hz-space-away). The utility sheet deliberately',
	' * does not reproduce that surface: it exposes the fixed --hz-space-*',
	' * scale for margins only, never the density near/away distances, and',
	' * no padding helpers at all (padding is owned by components).',
	' *',
	' * Unlayered, single-class specificity (0,1,0), no !important — mirrors',
	' * .sr-only: a deliberately-applied utility beats the layered reference',
	" * theme, while a consumer's own unlayered class of equal specificity",
	' * still wins by source order.',
	' */'
].join('\n');

const TEXT_UTILITIES_BANNER = [
	'Text-color utilities',
	'Role + intent helpers — color only, resolved from --hz-color-* / --hz-intent-*.'
];

const MARGIN_UTILITIES_BANNER = [
	'Margin utilities (logical properties)',
	'Seven families per --hz-space-* rung: margin, margin-block(-start/-end),',
	'margin-inline(-start/-end). No padding — padding is owned by components.'
];

/** The seven logical margin families, fixed emission order (R3). */
const MARGIN_FAMILIES: readonly { suffix: string; property: string }[] = [
	{ suffix: '', property: 'margin' },
	{ suffix: 'block', property: 'margin-block' },
	{ suffix: 'block-start', property: 'margin-block-start' },
	{ suffix: 'block-end', property: 'margin-block-end' },
	{ suffix: 'inline', property: 'margin-inline' },
	{ suffix: 'inline-start', property: 'margin-inline-start' },
	{ suffix: 'inline-end', property: 'margin-inline-end' }
];

function utilityRule(className: string, property: string, value: string): string {
	return `.${className} {\n\t${property}: ${value};\n}`;
}

/**
 * Renders the opt-in utility sheet from the resolved token
 * model: `.hz-text`/`.hz-text-muted`, one `.hz-text-<intent>` per resolved
 * intent, and the seven logical margin families per resolved space rung.
 * Deterministic and unlayered — mirrors `.sr-only`'s specificity posture.
 * Does NOT re-resolve tokens; reads only `resolved.sections`.
 */
export function generateUtilitiesCss(
	resolved: ResolvedConfig,
	options: GenerateUtilitiesOptions = {}
): string {
	const roles = resolved.sections.find((s) => s.id === 'roles')!.entries;
	const intentEntries = resolved.sections.find((s) => s.id === 'intent')!.entries;
	const spaceEntries = resolved.sections.find((s) => s.id === 'space')!.entries;

	const text = roles.find((e) => e.key === 'text');
	const textMuted = roles.find((e) => e.key === 'textMuted');
	if (!text || !textMuted) {
		throw new HyzerConfigError(
			'generateUtilitiesCss requires the base "text" and "textMuted" color roles.'
		);
	}

	const parts: string[] = [withIntro(UTILITIES_HEADER, options.intro)];

	// --- text-color utilities (R2) --------------------------------------------
	parts.push('', banner(TEXT_UTILITIES_BANNER, ''));
	parts.push('', utilityRule('hz-text', 'color', `var(${text.cssName})`));
	parts.push('', utilityRule('hz-text-muted', 'color', `var(${textMuted.cssName})`));

	// Utility-class-namespace collision tracking (edge case: a consumer
	// intent named "muted" kebab-cases to the fixed .hz-text-muted role
	// helper's class name) — a hard generation error naming both parties,
	// mirroring the engine's existing kebab-collision rule (schema.ts).
	const usedClasses = new Map<string, string>([
		['hz-text', 'the base text-color role helper (.hz-text)'],
		['hz-text-muted', 'the muted text-color role helper (.hz-text-muted)']
	]);

	for (const entry of intentEntries) {
		const suffix = toKebab(entry.key);
		const className = `hz-text-${suffix}`;
		const owner = usedClasses.get(className);
		if (owner) {
			throw new HyzerConfigError(
				`config.tokens.intent.${entry.key} kebab-cases to the utility class ".${className}", ` +
					`which ${owner} already defines. Rename the intent to avoid the collision.`
			);
		}
		usedClasses.set(className, `intent "${entry.key}" (config.tokens.intent.${entry.key})`);
		parts.push('', utilityRule(className, 'color', `var(${entry.cssName})`));
	}

	// --- margin utilities (R3) -------------------------------------------------
	parts.push('', banner(MARGIN_UTILITIES_BANNER, ''));
	for (const family of MARGIN_FAMILIES) {
		for (const rung of spaceEntries) {
			const rungSuffix = toKebab(rung.key);
			const className = family.suffix
				? `hz-m-${family.suffix}-${rungSuffix}`
				: `hz-m-${rungSuffix}`;
			parts.push('', utilityRule(className, family.property, `var(${rung.cssName})`));
		}
	}

	return parts.join('\n') + '\n';
}
