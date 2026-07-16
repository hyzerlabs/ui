/**
 * @hyzer-labs/ui token engine — CSS emission (specs/29).
 *
 * Deterministic: same resolved config → same bytes. Full mode renders the
 * complete tokens sheet (the committed `tokens.css` is this output with no
 * config); overrides mode emits only config-touched declarations as a patch
 * sheet, optionally scoped under a custom selector.
 */

import type { ResolvedConfig, SectionId, TokenEntry } from './schema.js';

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
	palette: ['Layer 1 — Palette', 'Single value per color; no per-color ramps.'],
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
	'--hz-color-success': [
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

/** Dark-block selector: plain hook at :root, compound + descendant when scoped. */
function darkSelector(selector: string): string {
	if (selector === ':root') return "[data-theme='dark']";
	return `${selector}[data-theme='dark'], [data-theme='dark'] ${selector}`;
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
	const paletteDark = resolved.dark.color.filter(
		(e) => !e.value.includes('var(') && !isRoleKey(e.key)
	);
	const roleDark = resolved.dark.color.filter((e) => !paletteDark.includes(e));
	parts.push(...declarations(roleDark, '\t', false));
	if (paletteDark.length > 0) {
		parts.push('');
		parts.push(...declarations(paletteDark, '\t', false));
	}
	if (resolved.dark.intent.length > 0) {
		parts.push('');
		parts.push(...declarations(resolved.dark.intent, '\t', false));
	}
	parts.push('}');

	return parts.join('\n') + '\n';
}

/** Dark color entries for semantic roles vs. lightened palette hues. */
function isRoleKey(key: string): boolean {
	return ['surface', 'surfaceMuted', 'text', 'textMuted', 'border'].includes(key);
}

function generateOverrides(resolved: ResolvedConfig, selector: string, intro?: string[]): string {
	const header = withIntro(
		[
			'/**',
			' * @hyzer-labs/ui token overrides',
			' *',
			' * GENERATED FILE — do not edit by hand (hyzer generate --mode overrides).',
			' * Only config-touched tokens are emitted; import this sheet AFTER',
			' * @hyzer-labs/ui/tokens.css so the overrides win by source order.',
			' */'
		].join('\n'),
		intro
	);

	const rootEntries = resolved.sections.flatMap((s) => s.entries.filter((e) => e.fromConfig));
	const darkEntries = [
		...resolved.dark.color.filter((e) => e.fromConfig),
		...resolved.dark.intent.filter((e) => e.fromConfig)
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
