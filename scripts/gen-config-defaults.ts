/**
 * Renders `src/lib/cli/config-defaults.js`: the two commented, defaults-only
 * blocks (`CONFIG_TOKEN_DEFAULTS`, `CONFIG_DARK_DEFAULTS`) that
 * `config-template.js` splices into the full-reference `hyzer.config.ts`.
 * Built from the same token metadata that produces `tokens.css`
 * (`src/lib/tokens/index.ts`), so the template can never drift the way a
 * hand-maintained copy of 86 defaults would (specs/69 R6).
 *
 * `TOKEN_GROUP_KEYS` (`src/lib/config/schema.ts`) is asserted against the
 * groups this renderer actually emits — the guard that keeps "every group
 * but `components`" true the next time a token group is added.
 *
 * Exported for `scripts/gen-tokens.ts`, which writes the file this module
 * describes; not a script itself.
 */
import {
	palette,
	color,
	intent,
	space,
	width,
	typography,
	radius,
	border,
	shadow,
	zIndex,
	motion,
	density
} from '../src/lib/tokens/index.js';
import { TOKEN_GROUP_KEYS } from '../src/lib/config/schema.js';

// ---------------------------------------------------------------------------
// Line building — the template's own convention: one leading tab, `// `,
// then the content at its REAL indentation (main.spec.ts's uncommenter,
// `line.replace(/^\t\/\/ /, '\t')`, strips exactly that marker and replaces
// it with one tab, so everything past it is real nesting).
// ---------------------------------------------------------------------------

const MARKER = '\t// ';

/** One commented line, `depth` real tabs past the marker. */
function line(depth: number, content: string): string {
	return `${MARKER}${'\t'.repeat(depth)}${content}`;
}

/**
 * String-valued entries of a metadata object, in declaration order — mirrors
 * `schema.ts`'s own `stringEntries`, since `palette` and `color` each carry a
 * nested `theme` key (the dark seed) that is not itself a token default.
 */
function stringEntries(obj: Record<string, unknown>): Record<string, string> {
	return Object.fromEntries(
		Object.entries(obj).filter((e): e is [string, string] => typeof e[1] === 'string')
	);
}

/**
 * Quote a token value for the template literal: single-quoted by default,
 * double-quoted when the value itself contains a `'` (only the type-family
 * strings do today). Throws rather than silently emitting something the
 * template literal can't carry — a backtick or `${` would break out of it,
 * and a value with both quote characters has no safe quoting left.
 */
function quoteValue(value: string, where: string): string {
	if (value.includes('`') || value.includes('${')) {
		throw new Error(
			`gen-config-defaults: ${where} ("${value}") contains a backtick or "\${" — cannot round-trip ` +
				'through a template literal. Name it in the commit message rather than excluding it silently.'
		);
	}
	const single = value.includes("'");
	const double = value.includes('"');
	if (single && double) {
		throw new Error(
			`gen-config-defaults: ${where} ("${value}") contains both quote characters — cannot render.`
		);
	}
	return single ? `"${value}"` : `'${value}'`;
}

const BARE_KEY = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** Bare identifier where legal (`base`), quoted otherwise (`'2xl'`). */
function quoteKey(key: string): string {
	return BARE_KEY.test(key) ? key : `'${key}'`;
}

/** One `key: 'value'` entry, comma-terminated unless it is the group's last. */
function entryLines(depth: number, entries: Record<string, string>, where: string): string[] {
	const keys = Object.keys(entries);
	return keys.map((key, i) =>
		line(
			depth,
			`${quoteKey(key)}: ${quoteValue(entries[key], `${where}.${key}`)}${i === keys.length - 1 ? '' : ','}`
		)
	);
}

/**
 * A flat group as `name: { … }`, one comment naming the CSS custom-property
 * prefix it drives, on the opening brace. `comma` controls the group's own
 * trailing punctuation — every group but the last in its parent needs one.
 */
function group(
	depth: number,
	name: string,
	entries: Record<string, string>,
	comment: string | null,
	where: string,
	comma: boolean
): string[] {
	return [
		line(depth, comment ? `${name}: {  // ${comment}` : `${name}: {`),
		...entryLines(depth + 1, entries, where),
		line(depth, `}${comma ? ',' : ''}`)
	];
}

// ---------------------------------------------------------------------------
// CONFIG_TOKEN_DEFAULTS — every group tokens.css declares at :root, in the
// sheet's own emission order (specs/69 R7), `components` excluded (it seeds
// from `[]`, so it has no defaults to show — specs/69 R8's explicit
// exclusion).
// ---------------------------------------------------------------------------

const EMITTED_GROUPS = new Set([
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
	'density'
]);

for (const key of TOKEN_GROUP_KEYS) {
	if (key === 'components') continue;
	if (!EMITTED_GROUPS.has(key)) {
		throw new Error(
			`gen-config-defaults: TOKEN_GROUP_KEYS has "${key}" with no emission here — update the renderer.`
		);
	}
}

function renderTokenDefaults(): string {
	const lines: string[] = [
		line(0, 'tokens: {                            // the DEFAULT theme (the :root block)'),
		...group(
			1,
			'palette',
			stringEntries(palette),
			'raw hues (--hz-palette-*); single values or ramps',
			'tokens.palette',
			true
		),
		...group(1, 'color', stringEntries(color), 'role colors (--hz-color-*)', 'tokens.color', true),
		...group(1, 'intent', intent, 'remap or add intents (--hz-intent-*)', 'tokens.intent', true),
		line(1, 'typography: {  // the type scale; each group below names the tokens it drives'),
		...group(
			2,
			'fontSize',
			typography.fontSize,
			'--hz-font-size-*',
			'tokens.typography.fontSize',
			true
		),
		...group(
			2,
			'fontFamily',
			typography.fontFamily,
			'--hz-font-family-*',
			'tokens.typography.fontFamily',
			true
		),
		...group(
			2,
			'fontWeight',
			typography.fontWeight,
			'--hz-font-weight-*',
			'tokens.typography.fontWeight',
			true
		),
		...group(
			2,
			'lineHeight',
			typography.lineHeight,
			'--hz-line-height-*',
			'tokens.typography.lineHeight',
			false
		),
		line(1, '},'),
		...group(1, 'space', space, 'the fixed margin/gap scale (--hz-space-*)', 'tokens.space', true),
		line(1, "density: {  // the --hz-density grid unit, and each ladder rung's own var() fallback"),
		line(2, `unit: ${quoteValue(density.unit, 'tokens.density.unit')},`),
		...group(
			2,
			'ladder',
			Object.fromEntries(
				density.levels.map((level, i) => [
					`depth${i + 1}`,
					`calc(var(--hz-density) * ${level.near})`
				])
			),
			'--hz-density-ladder-depth-1..4, the fallback each rung uses; a rung you declare in CSS still wins',
			'tokens.density.ladder',
			false
		),
		line(1, '},'),
		...group(1, 'width', width, 'layout max-widths (--hz-width-*)', 'tokens.width', true),
		...group(1, 'radius', radius, 'corner radii (--hz-radius-*)', 'tokens.radius', true),
		line(1, 'border: {  // border widths (--hz-border-width-*)'),
		// The single nested group needs no comment of its own — border's
		// opening line above already names the prefix it drives.
		...group(2, 'width', border.width, null, 'tokens.border.width', false),
		line(1, '},'),
		...group(1, 'shadow', shadow, 'elevation (--hz-shadow-*)', 'tokens.shadow', true),
		...group(1, 'zIndex', zIndex, 'stacking order (--hz-z-*)', 'tokens.zIndex', true),
		line(1, 'motion: {  // duration and easing (--hz-duration-*, --hz-ease-*)'),
		...group(2, 'duration', motion.duration, '--hz-duration-*', 'tokens.motion.duration', true),
		...group(2, 'ease', motion.ease, '--hz-ease-*', 'tokens.motion.ease', false),
		line(1, '}'),
		line(0, '},')
	];
	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CONFIG_DARK_DEFAULTS — the seeded dark theme: the 7 palette companions and
// the 3 role overrides `resolveConfig` seeds `themes.dark` from
// (`palette.theme.dark` / `color.theme.dark`), no other theme.
// ---------------------------------------------------------------------------

function renderDarkDefaults(): string {
	const lines: string[] = [
		line(0, 'themes: {                            // named overrides of the default above,'),
		line(0, '                                     // one block per data-theme="<name>".'),
		// Escaped backtick: this text lands inside another template literal
		// (config-defaults.js's own CONFIG_DARK_DEFAULTS), where an
		// unescaped backtick would close it early — config-template.js's own
		// prose escapes the same backtick the same way.
		line(0, '                                     // Each takes any group \\`tokens\\` takes,'),
		line(0, '                                     // not only color.'),
		line(
			1,
			'dark: {                            // [data-theme="dark"]: always emitted, so an entry here changes dark rather than creating it. Its name is fixed, since the platform defines it'
		),
		...group(2, 'palette', palette.theme.dark, '--hz-palette-*', 'themes.dark.palette', true),
		...group(2, 'color', color.theme.dark, '--hz-color-*', 'themes.dark.color', false),
		line(1, '},'),
		line(0, '},')
	];
	return lines.join('\n');
}

// ---------------------------------------------------------------------------
// The file: two self-contained `export const` template literals, plain JS,
// no imports — sv-addon/src/index.js bundles config-template.js (and, once
// spliced in, this file) straight from source.
// ---------------------------------------------------------------------------

export function renderConfigDefaults(): string {
	const tokenDefaults = renderTokenDefaults();
	const darkDefaults = renderDarkDefaults();
	return `/**
 * GENERATED FILE — do not edit by hand. Run \`pnpm gen:tokens\`
 * (scripts/gen-config-defaults.ts renders this from src/lib/tokens/index.ts).
 *
 * The two commented, defaults-only blocks config-template.js splices into
 * the full-reference hyzer.config.ts: every default value tokens.css and
 * its dark block declare, one group per line comment, no per-token prose.
 */

export const CONFIG_TOKEN_DEFAULTS = \`${tokenDefaults}\`;

export const CONFIG_DARK_DEFAULTS = \`${darkDefaults}\`;
`;
}
