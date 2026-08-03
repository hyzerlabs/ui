import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	defineConfig,
	resolveConfig,
	generateCss,
	generateUtilitiesCss,
	contrastReport,
	HyzerConfigError
} from './index.js';
import { toKebab } from './schema.js';
import { palette, color, intent, space, typography } from '../tokens/index.js';

const here = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// R6 — drift test: the committed tokens.css IS the zero-config engine output
// ---------------------------------------------------------------------------

describe('R6 — committed tokens.css is generated output', () => {
	it('generateCss(resolveConfig()) equals src/lib/tokens/tokens.css exactly', () => {
		const committed = readFileSync(join(here, '../tokens/tokens.css'), 'utf8');
		expect(generateCss(resolveConfig())).toBe(committed);
	});
});

// ---------------------------------------------------------------------------
// resolveConfig — merge semantics (R2, specs/42 palette/role split)
// ---------------------------------------------------------------------------

describe('resolveConfig — extend-only merge', () => {
	it('defineConfig is a typed identity', () => {
		const config = { tokens: { palette: { primary: '#0f766e' } } };
		expect(defineConfig(config)).toBe(config);
	});

	it('zero config resolves every base token', () => {
		const resolved = resolveConfig();
		const names = resolved.sections.flatMap((s) => s.entries.map((e) => e.cssName));
		expect(names).toContain('--hz-palette-primary');
		expect(names).toContain('--hz-color-surface');
		expect(names).toContain('--hz-color-black');
		expect(names).toContain('--hz-color-white');
		expect(names).toContain('--hz-font-size-3xl');
		expect(names).toContain('--hz-z-sticky');
		expect(names).toContain('--hz-ease-standard');
		expect(resolved.sections.flatMap((s) => s.entries).every((e) => !e.fromConfig)).toBe(true);
	});

	it('overrides an existing key in place and marks it fromConfig', () => {
		const resolved = resolveConfig({ tokens: { palette: { primary: '#0f766e' } } });
		const paletteEntries = resolved.sections.find((s) => s.id === 'palette')!.entries;
		const primary = paletteEntries.find((e) => e.key === 'primary')!;
		expect(primary.value).toBe('#0f766e');
		expect(primary.fromConfig).toBe(true);
		// Order unchanged: primary stays first.
		expect(paletteEntries[0].key).toBe('primary');
	});

	it('appends added keys after the base keys, in config order', () => {
		const resolved = resolveConfig({
			tokens: { palette: { fairway: '#3f6212', chains: '#a16207' } }
		});
		const paletteEntries = resolved.sections.find((s) => s.id === 'palette')!.entries;
		const keys = paletteEntries.map((e) => e.key);
		expect(keys.slice(0, Object.keys(palette).indexOf('gray') + 1)).not.toContain('fairway');
		expect(keys.slice(-2)).toEqual(['fairway', 'chains']);
		expect(paletteEntries.at(-2)!.cssName).toBe('--hz-palette-fairway');
	});

	it('classifies added keys by group, not value shape: tokens.palette → palette, tokens.color → roles', () => {
		const resolved = resolveConfig({
			tokens: {
				palette: { fairway: '#3f6212' },
				color: { accent: 'var(--hz-palette-fairway)' }
			}
		});
		const paletteEntries = resolved.sections.find((s) => s.id === 'palette')!.entries;
		const roles = resolved.sections.find((s) => s.id === 'roles')!.entries;
		expect(paletteEntries.some((e) => e.key === 'fairway')).toBe(true);
		expect(roles.some((e) => e.key === 'accent')).toBe(true);
	});

	it('an overridden role keeps its section even with a literal hex value', () => {
		// specs/42 edge case: classification is by group membership now, not
		// value shape, so a role overridden with a literal hex stays a role.
		const resolved = resolveConfig({ tokens: { color: { surface: '#f8fafc' } } });
		const roles = resolved.sections.find((s) => s.id === 'roles')!.entries;
		expect(roles.find((e) => e.key === 'surface')!.value).toBe('#f8fafc');
	});

	it('a palette key added under tokens.color (not tokens.palette) is still a role', () => {
		// A consumer adding a new hue to tokens.color (instead of tokens.palette)
		// gets a --hz-color-* role, unambiguously — no value-shape inference.
		const resolved = resolveConfig({ tokens: { color: { fairway: '#3f6212' } } });
		const roles = resolved.sections.find((s) => s.id === 'roles')!.entries;
		const paletteEntries = resolved.sections.find((s) => s.id === 'palette')!.entries;
		expect(roles.some((e) => e.key === 'fairway' && e.cssName === '--hz-color-fairway')).toBe(true);
		expect(paletteEntries.some((e) => e.key === 'fairway')).toBe(false);
	});

	it('kebab-cases added keys (brandTeal → --hz-palette-brand-teal)', () => {
		expect(toKebab('brandTeal')).toBe('brand-teal');
		expect(toKebab('2xl')).toBe('2xl');
		const resolved = resolveConfig({ tokens: { palette: { brandTeal: '#0d9488' } } });
		const names = resolved.sections.flatMap((s) => s.entries.map((e) => e.cssName));
		expect(names).toContain('--hz-palette-brand-teal');
	});

	it('merges dark palette additions over the base dark authoring', () => {
		const resolved = resolveConfig({ themes: { dark: { palette: { fairway: '#a3e635' } } } });
		expect(resolved.dark.palette.at(-1)).toMatchObject({
			cssName: '--hz-palette-fairway',
			value: '#a3e635',
			fromConfig: true
		});
		// Base dark entries intact; intents contribute NO base dark entries —
		// dark is authored entirely at the palette/role layer.
		expect(resolved.dark.palette.find((e) => e.key === 'danger')!.value).toBe(
			palette.theme.dark.danger
		);
		expect(resolved.dark.palette.find((e) => e.key === 'primary')!.value).toBe(
			palette.theme.dark.primary
		);
		expect(resolved.dark.intent).toEqual([]);
	});

	it('merges dark role additions over the base dark authoring', () => {
		const resolved = resolveConfig({ themes: { dark: { color: { surface: '#111827' } } } });
		const surface = resolved.dark.color.find((e) => e.key === 'surface')!;
		expect(surface).toMatchObject({ value: '#111827', fromConfig: true });
		expect(resolved.dark.color.find((e) => e.key === 'text')!.value).toBe(color.theme.dark.text);
	});

	it('density unit override flows into the resolved model', () => {
		const resolved = resolveConfig({ tokens: { density: { unit: '0.5rem' } } });
		expect(resolved.density.unit).toBe('0.5rem');
		expect(resolved.density.unitFromConfig).toBe(true);
	});
});

describe('resolveConfig — validation errors', () => {
	it('rejects a non-object config', () => {
		expect(() => resolveConfig([] as never)).toThrow(HyzerConfigError);
	});

	it('rejects unknown groups, listing valid names', () => {
		expect(() => resolveConfig({ tokens: { colours: {} } } as never)).toThrow(
			/Unknown key "colours"/
		);
		expect(() => resolveConfig({ tokens: { colours: {} } } as never)).toThrow(
			/palette, color, intent, space/
		);
	});

	it('rejects unknown nested sections', () => {
		expect(() => resolveConfig({ tokens: { typography: { fontStretch: {} } } } as never)).toThrow(
			/config.tokens.typography/
		);
		expect(() => resolveConfig({ themes: { dark: { shadow: {} } } } as never)).toThrow(
			/config.themes.dark/
		);
	});

	it('rejects unknown keys in a theme, listing palette/color/intent', () => {
		expect(() => resolveConfig({ themes: { dark: { shadow: {} } } } as never)).toThrow(
			/Valid keys: palette, color, intent/
		);
	});

	it('rejects non-string token values', () => {
		expect(() => resolveConfig({ tokens: { space: { xs: 8 } } } as never)).toThrow(
			/must be a non-empty string/
		);
	});

	it('rejects kebab collisions between config and base keys', () => {
		// Base roles has textMuted → --hz-color-text-muted.
		expect(() => resolveConfig({ tokens: { color: { 'text-muted': '#333333' } } })).toThrow(
			/kebab-cases to "--hz-color-text-muted"/
		);
	});

	it('rejects var() references to undefined tokens', () => {
		expect(() =>
			resolveConfig({ tokens: { intent: { brand: 'var(--hz-palette-nope)' } } })
		).toThrow(/--hz-palette-nope, which is not a defined token/);
	});

	it('accepts references to config-added tokens and derived density distances', () => {
		expect(() =>
			resolveConfig({
				tokens: {
					palette: { fairway: '#3f6212' },
					intent: { fairway: 'var(--hz-palette-fairway)' },
					space: { gap: 'var(--hz-space-near)' }
				}
			})
		).not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// generateCss — full and overrides modes (R3, R4)
// ---------------------------------------------------------------------------

describe('generateCss — full mode', () => {
	it('emits added tokens at the end of their section', () => {
		const css = generateCss(resolveConfig({ tokens: { palette: { fairway: '#3f6212' } } }));
		expect(css).toContain('\t--hz-palette-fairway: #3f6212;');
		expect(css.indexOf('--hz-palette-gray:')).toBeLessThan(css.indexOf('--hz-palette-fairway:'));
	});

	it('a density unit override rewrites --hz-density and keeps the derived cascade', () => {
		const css = generateCss(resolveConfig({ tokens: { density: { unit: '0.5rem' } } }));
		expect(css).toContain('--hz-density: 0.5rem;');
		expect(css).toContain('--hz-space-near: calc(var(--hz-density) * 10);');
	});

	it('config dark palette additions land in the dark block', () => {
		const css = generateCss(
			resolveConfig({
				tokens: { palette: { fairway: '#3f6212' } },
				themes: { dark: { palette: { fairway: '#a3e635' } } }
			})
		);
		const darkBlock = css.slice(css.indexOf("[data-theme='dark']"));
		expect(darkBlock).toContain('--hz-palette-fairway: #a3e635;');
	});

	it('config dark role additions land in the dark block', () => {
		const css = generateCss(resolveConfig({ themes: { dark: { color: { border: '#334155' } } } }));
		const darkBlock = css.slice(css.indexOf("[data-theme='dark']"));
		expect(darkBlock).toContain('--hz-color-border: #334155;');
	});

	it('is deterministic', () => {
		const config = { tokens: { palette: { primary: '#0f766e', fairway: '#3f6212' } } };
		expect(generateCss(resolveConfig(config))).toBe(generateCss(resolveConfig(config)));
	});

	it('emits role dark, then palette dark, then intent dark, in that order', () => {
		const css = generateCss(
			resolveConfig({
				themes: {
					dark: {
						color: { border: '#334155' },
						intent: { primary: '#93c5fd' }
					}
				}
			})
		);
		const darkBlock = css.slice(css.indexOf("[data-theme='dark']"));
		const roleIdx = darkBlock.indexOf('--hz-color-border');
		const paletteIdx = darkBlock.indexOf('--hz-palette-primary');
		const intentIdx = darkBlock.indexOf('--hz-intent-primary');
		expect(roleIdx).toBeGreaterThan(-1);
		expect(paletteIdx).toBeGreaterThan(-1);
		expect(intentIdx).toBeGreaterThan(-1);
		expect(roleIdx).toBeLessThan(paletteIdx);
		expect(paletteIdx).toBeLessThan(intentIdx);
	});
});

describe('generateCss — overrides mode', () => {
	it('emits only config-touched declarations', () => {
		const css = generateCss(
			resolveConfig({ tokens: { palette: { primary: '#0f766e', fairway: '#3f6212' } } }),
			{ mode: 'overrides' }
		);
		// The rule opens at :root; it may share that rule with
		// [data-theme='light'] when every restored token is one of these.
		expect(css).toMatch(/^:root\s*[,{]/m);
		expect(css).toContain('--hz-palette-primary: #0f766e;');
		expect(css).toContain('--hz-palette-fairway: #3f6212;');
		expect(css).not.toContain('--hz-palette-gray');
		expect(css).not.toContain('--hz-space-md');
		expect(css).not.toContain("[data-theme='dark']");
	});

	it('scopes under a custom selector, dark block composing with it', () => {
		const css = generateCss(
			resolveConfig({
				tokens: { palette: { primary: '#0f766e' } },
				themes: { dark: { intent: { primary: '#5eead4' } } }
			}),
			{ mode: 'overrides', selector: '.theme-ocean' }
		);
		expect(css).toContain('.theme-ocean {');
		// One selector per line — Prettier's own formatting, so the committed
		// generated sheets survive `prettier --check .` (see darkSelector).
		expect(css).toContain(".theme-ocean[data-theme='dark'],\n[data-theme='dark'] .theme-ocean {");
		expect(css).toContain('--hz-intent-primary: #5eead4;');
	});

	/**
	 * Regression — a scoped sheet that emits ONLY the touched palette entry is
	 * inert for every component that reads the intent vocabulary. The var()
	 * indirection in `--hz-intent-primary: var(--hz-palette-primary)` is
	 * substituted where it is DECLARED; left at :root it resolves to the base
	 * palette and inherits down as that fixed value, so `.theme-x` overriding
	 * the palette underneath changes nothing. Scoped mode must re-declare the
	 * derived chain locally.
	 */
	it('scoped mode re-emits the chain derived from touched tokens', () => {
		const css = generateCss(resolveConfig({ tokens: { palette: { primary: '#0f766e' } } }), {
			mode: 'overrides',
			selector: '.theme-ocean'
		});
		// The intent that reads primary must be re-declared under the scope...
		expect(css).toContain('--hz-intent-primary: var(--hz-palette-primary);');
		// ...but untouched, unrelated chains must not be dragged along.
		expect(css).not.toContain('--hz-space-md');
		expect(css).not.toContain('--hz-intent-success');
	});

	it('scoped mode re-emits chains a dark-only palette override disturbs', () => {
		// `danger` is touched in dark only. --hz-intent-danger must still be
		// declared in the light scope block, or the dark block feeds nothing.
		const css = generateCss(
			resolveConfig({ themes: { dark: { palette: { danger: '#fca5a5' } } } }),
			{
				mode: 'overrides',
				selector: '.theme-ocean'
			}
		);
		expect(css).toContain('.theme-ocean {');
		expect(css).toContain('--hz-intent-danger: var(--hz-palette-danger);');
	});

	it('scoped mode re-emits a role chain a dark-only role override disturbs', () => {
		// surfaceMuted's dark mix derives from --hz-color-surface; touching
		// surface only in dark must still re-declare surface-muted's light
		// value under the scope.
		const css = generateCss(
			resolveConfig({ themes: { dark: { color: { surface: '#0b1120' } } } }),
			{
				mode: 'overrides',
				selector: '.theme-ocean'
			}
		);
		expect(css).toContain('.theme-ocean {');
		expect(css).toContain('--hz-color-surface-muted:');
	});

	it('root-scoped mode still emits only what the config touched', () => {
		// At :root the override and the intent declaration land on the same
		// element, so the cascade re-resolves the chain for free — emitting it
		// would be noise.
		const css = generateCss(resolveConfig({ tokens: { palette: { primary: '#0f766e' } } }), {
			mode: 'overrides'
		});
		expect(css).toContain('--hz-palette-primary: #0f766e;');
		expect(css).not.toContain('--hz-intent-primary');
	});

	it('an untouched config emits a no-overrides note and no rules', () => {
		const css = generateCss(resolveConfig(), { mode: 'overrides' });
		expect(css).toContain('No overrides configured');
		expect(css).not.toContain(':root {');
	});

	it('a density-only override still emits a :root block', () => {
		const css = generateCss(resolveConfig({ tokens: { density: { unit: '0.5rem' } } }), {
			mode: 'overrides'
		});
		expect(css).toContain(':root {');
		expect(css).toContain('--hz-density: 0.5rem;');
	});
});

// ---------------------------------------------------------------------------
// Custom intent wiring — a config-registered intent switches the reference
// theme's --_c hook, so it works everywhere the built-ins do with no CSS of
// the consumer's own.
// ---------------------------------------------------------------------------

describe('generateCss — custom intent wiring', () => {
	const CUSTOM_INTENT_RULE =
		"\n:where([data-intent='fairway']) {\n\t--_c: var(--hz-intent-fairway);\n}\n";

	it('a custom intent in full mode emits exactly one :where([data-intent=]) rule', () => {
		const resolved = resolveConfig({
			tokens: { intent: { fairway: 'var(--hz-palette-primary)' } }
		});
		const css = generateCss(resolved);
		expect(css.endsWith(CUSTOM_INTENT_RULE)).toBe(true);
	});

	it('the same config in overrides mode emits the same rule', () => {
		const resolved = resolveConfig({
			tokens: { intent: { fairway: 'var(--hz-palette-primary)' } }
		});
		const css = generateCss(resolved, { mode: 'overrides' });
		expect(css.endsWith(CUSTOM_INTENT_RULE)).toBe(true);
	});

	it('no config emits no [data-intent=] rule at all', () => {
		expect(generateCss(resolveConfig())).not.toContain('[data-intent=');
		expect(generateCss(resolveConfig(), { mode: 'overrides' })).not.toContain('[data-intent=');
	});

	it('a built-in re-value (intent.neutral) emits no rule — the theme already wires it', () => {
		const resolved = resolveConfig({
			tokens: { intent: { neutral: 'var(--hz-color-text-muted)' } }
		});
		expect(generateCss(resolved)).not.toContain('[data-intent=');
		expect(generateCss(resolved, { mode: 'overrides' })).not.toContain('[data-intent=');
	});

	it('a camelCase key emits both attribute forms and the kebab custom property', () => {
		const resolved = resolveConfig({ tokens: { intent: { brandRed: '#b91c1c' } } });
		const css = generateCss(resolved);
		expect(css).toContain(
			":where([data-intent='brandRed']),\n:where([data-intent='brand-red']) {\n\t--_c: var(--hz-intent-brand-red);\n}"
		);
	});

	it('an intent declared only under themes.x.intent emits one rule', () => {
		const resolved = resolveConfig({ themes: { ocean: { intent: { fairway: '#a3e635' } } } });
		const css = generateCss(resolved);
		expect(css.match(/\[data-intent='fairway'\]/g)).toHaveLength(1);
	});

	it('the same intent in root and a theme still emits exactly one rule', () => {
		const resolved = resolveConfig({
			tokens: { intent: { fairway: 'var(--hz-palette-primary)' } },
			themes: { ocean: { intent: { fairway: '#a3e635' } } }
		});
		const css = generateCss(resolved);
		expect(css.match(/\[data-intent='fairway'\]/g)).toHaveLength(1);
	});

	it('a scoped overrides sheet emits the two-line scoped compound + descendant pair', () => {
		const resolved = resolveConfig({
			tokens: { intent: { fairway: 'var(--hz-palette-primary)' } }
		});
		const css = generateCss(resolved, { mode: 'overrides', selector: '.hz-theme-terminal' });
		expect(css).toContain(
			"\n:where(.hz-theme-terminal [data-intent='fairway']),\n:where(.hz-theme-terminal[data-intent='fairway']) {\n\t--_c: var(--hz-intent-fairway);\n}\n"
		);
	});

	it('the rule is the last thing in the sheet, and the output is stable across two calls', () => {
		const config = { tokens: { intent: { fairway: 'var(--hz-palette-primary)' } } };
		const first = generateCss(resolveConfig(config));
		const second = generateCss(resolveConfig(config));
		expect(first).toBe(second);
		expect(first.endsWith(CUSTOM_INTENT_RULE)).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// contrastReport (R5)
// ---------------------------------------------------------------------------

describe('contrastReport', () => {
	it('the base schema passes AA everywhere', () => {
		const report = contrastReport(resolveConfig());
		expect(report.rows.length).toBeGreaterThan(50);
		expect(report.unresolved).toEqual([]);
		expect(report.pass).toBe(true);
	});

	it('covers both modes, solids, and the soft recipes', () => {
		const report = contrastReport(resolveConfig());
		const ids = report.rows.map((r) => `${r.mode}:${r.id}`);
		expect(ids).toContain('light:text:text-muted/surface');
		expect(ids).toContain('dark:text:intent-danger/surface-muted');
		expect(ids).toContain('light:solid:intent-primary');
		expect(ids).toContain('dark:soft-badge:intent-warning');
		expect(ids).toContain('light:soft-alert-title:intent-neutral');
	});

	it('resolves var() chains and color-mix through the dark overlay', () => {
		const report = contrastReport(resolveConfig());
		const darkMuted = report.rows.find(
			(r) => r.mode === 'dark' && r.id === 'text:text-muted/surface-muted'
		)!;
		// #9ca3af (text-muted via the dark gray) on the 25% dark-gray-over-black
		// mix ≈ 5.74:1 — the resolver must use the dark overlay on BOTH sides.
		expect(darkMuted.ratio).toBeGreaterThan(5.6);
		expect(darkMuted.ratio).toBeLessThan(5.9);
		expect(darkMuted.pass).toBe(true);
	});

	it('flags a palette override that breaks AA', () => {
		// The old warning orange — 3.19:1 on white.
		const report = contrastReport(resolveConfig({ tokens: { palette: { warning: '#d97706' } } }));
		const failing = report.rows.filter((r) => !r.pass).map((r) => `${r.mode}:${r.id}`);
		expect(report.pass).toBe(false);
		expect(failing).toContain('light:text:intent-warning/surface');
		// Dark mode is untouched — the dark palette hue still applies.
		expect(failing.every((id) => id.startsWith('light:'))).toBe(true);
	});

	it('lists unresolvable values instead of guessing', () => {
		const report = contrastReport(
			resolveConfig({ tokens: { palette: { primary: 'oklch(0.5 0.2 250)' } } })
		);
		expect(report.unresolved.some((u) => u.startsWith('--hz-intent-primary'))).toBe(true);
	});

	it('report values match the metadata-derived expectations', () => {
		const report = contrastReport(resolveConfig());
		const darkDanger = report.rows.find(
			(r) => r.mode === 'dark' && r.id === 'text:intent-danger/surface'
		)!;
		// Every intent chains through the dark palette hue.
		expect(darkDanger.fg.hex).toBe(palette.theme.dark.danger);
		const darkPrimary = report.rows.find(
			(r) => r.mode === 'dark' && r.id === 'text:intent-primary/surface'
		)!;
		expect(darkPrimary.fg.hex).toBe(palette.theme.dark.primary);
		// Sanity: metadata still exposes the groups the engine consumes.
		expect(intent.primary).toBe('var(--hz-palette-primary)');
		expect(space.md).toBe('2rem');
		expect(typography.fontSize['3xl']).toBe('3.5rem');
	});
});

// ---------------------------------------------------------------------------
// The two-tier rule — dark is palette-level; intents are a pure remap surface
// ---------------------------------------------------------------------------

describe('two-tier dark authoring', () => {
	it('the base dark block authors no intent VALUES — only the passthrough chain', () => {
		// The block does declare every --hz-intent-*, but only as the same bare
		// var() indirection :root declares, re-stated so the chain re-resolves
		// when the block lands on a <section> instead of <html>. Authoring an
		// intent COLOR in dark is what the two-tier rule forbids, and that is
		// what this asserts: every intent line here is a pure passthrough.
		const css = generateCss(resolveConfig());
		const darkBlock = css.slice(css.indexOf("[data-theme='dark']"));
		const intentLines = darkBlock
			.slice(0, darkBlock.indexOf('\n}'))
			.split('\n')
			.map((l) => l.trim())
			.filter((l) => l.startsWith('--hz-intent-'));
		expect(intentLines.length).toBeGreaterThan(0);
		for (const line of intentLines) {
			expect(line).toMatch(/^--hz-intent-[a-z]+: var\(--hz-palette-[a-z]+\);$/);
		}
	});

	it('a consumer dark palette override flows through to the intent', () => {
		const resolved = resolveConfig({ themes: { dark: { palette: { primary: '#1e3a8a' } } } });
		const report = contrastReport(resolved);
		const darkPrimary = report.rows.find(
			(r) => r.mode === 'dark' && r.id === 'text:intent-primary/surface'
		)!;
		expect(darkPrimary.fg.hex).toBe('#1e3a8a');
	});

	it('config.dark.intent remains the consumer surface for mode-specific remaps', () => {
		const resolved = resolveConfig({ themes: { dark: { intent: { primary: '#93c5fd' } } } });
		const primary = resolved.dark.intent.find((e) => e.key === 'primary')!;
		expect(primary).toMatchObject({ value: '#93c5fd', fromConfig: true });
		const css = generateCss(resolved);
		const darkBlock = css.slice(css.indexOf("[data-theme='dark']"));
		expect(darkBlock).toContain('--hz-intent-primary: #93c5fd;');
	});

	it('a light intent remap/extension is a plain tokens.intent entry', () => {
		const resolved = resolveConfig({
			tokens: { intent: { warning: 'var(--hz-color-text-muted)', fairway: '#3f6212' } }
		});
		const entries = resolved.sections.find((s) => s.id === 'intent')!.entries;
		expect(entries.find((e) => e.key === 'warning')!.value).toBe('var(--hz-color-text-muted)');
		expect(entries.at(-1)!.cssName).toBe('--hz-intent-fairway');
	});
});

// ---------------------------------------------------------------------------
// Consumer palette ramps — the base ships none, the engine generates any
// (specs/42 R2.4 — ramp nesting lives under tokens.palette only)
// ---------------------------------------------------------------------------

describe('consumer palette ramps', () => {
	it('generates flat and nested ramp keys as palette tokens', () => {
		const resolved = resolveConfig({
			tokens: {
				palette: {
					'red-50': '#fef2f2',
					brandRed: { 100: '#fee2e2', 900: '#7f1d1d' }
				}
			}
		});
		const paletteEntries = resolved.sections.find((s) => s.id === 'palette')!.entries;
		const names = paletteEntries.map((e) => e.cssName);
		expect(names).toContain('--hz-palette-red-50');
		expect(names).toContain('--hz-palette-brand-red-100');
		expect(names).toContain('--hz-palette-brand-red-900');
		const css = generateCss(resolved);
		expect(css).toContain('\t--hz-palette-brand-red-900: #7f1d1d;');
	});

	it('ramps work in the dark block and intents can reference ramp steps', () => {
		const resolved = resolveConfig({
			tokens: {
				palette: { brandRed: { 500: '#ef4444' } },
				intent: { danger: 'var(--hz-palette-brand-red-500)' }
			},
			themes: { dark: { palette: { brandRed: { 500: '#fca5a5' } } } }
		});
		const css = generateCss(resolved);
		const darkBlock = css.slice(css.indexOf("[data-theme='dark']"));
		expect(darkBlock).toContain('--hz-palette-brand-red-500: #fca5a5;');
		const report = contrastReport(resolved);
		const darkDanger = report.rows.find(
			(r) => r.mode === 'dark' && r.id === 'text:intent-danger/surface'
		)!;
		expect(darkDanger.fg.hex).toBe('#fca5a5');
	});

	it('rejects non-string ramp leaves and colliding flat/nested spellings', () => {
		expect(() => resolveConfig({ tokens: { palette: { red: { 50: 5 } } } } as never)).toThrow(
			/config.tokens.palette.red.50/
		);
		expect(() =>
			resolveConfig({
				tokens: { palette: { 'brand-red-100': '#fee2e2', brandRed: { 100: '#fecaca' } } }
			})
		).toThrow(/kebab-cases to "--hz-palette-brand-red-100"/);
	});

	it('tokens.color (roles) does not accept ramp nesting', () => {
		expect(() =>
			resolveConfig({ tokens: { color: { brandRed: { 100: '#fee2e2' } } } } as never)
		).toThrow(/must be a non-empty string/);
	});
});

// ---------------------------------------------------------------------------
// generateUtilitiesCss — the opt-in utility sheet (specs/44)
// ---------------------------------------------------------------------------

describe('generateUtilitiesCss', () => {
	it('emits .hz-text, .hz-text-muted, one .hz-text-<intent> per base intent, and the seven margin families per space rung', () => {
		const css = generateUtilitiesCss(resolveConfig());
		expect(css).toContain('.hz-text {\n\tcolor: var(--hz-color-text);\n}');
		expect(css).toContain('.hz-text-muted {\n\tcolor: var(--hz-color-text-muted);\n}');
		for (const key of Object.keys(intent)) {
			expect(css).toContain(`.hz-text-${key} {\n\tcolor: var(--hz-intent-${key});\n}`);
		}
		for (const rung of Object.keys(space)) {
			expect(css).toContain(`.hz-m-${rung} {\n\tmargin: var(--hz-space-${rung});\n}`);
			expect(css).toContain(`.hz-m-block-${rung} {\n\tmargin-block: var(--hz-space-${rung});\n}`);
			expect(css).toContain(
				`.hz-m-block-start-${rung} {\n\tmargin-block-start: var(--hz-space-${rung});\n}`
			);
			expect(css).toContain(
				`.hz-m-block-end-${rung} {\n\tmargin-block-end: var(--hz-space-${rung});\n}`
			);
			expect(css).toContain(`.hz-m-inline-${rung} {\n\tmargin-inline: var(--hz-space-${rung});\n}`);
			expect(css).toContain(
				`.hz-m-inline-start-${rung} {\n\tmargin-inline-start: var(--hz-space-${rung});\n}`
			);
			expect(css).toContain(
				`.hz-m-inline-end-${rung} {\n\tmargin-inline-end: var(--hz-space-${rung});\n}`
			);
		}
	});

	it('references role/intent/space vars only — no --hz-palette-, no !important declarations, unlayered (no @layer, no :root)', () => {
		const css = generateUtilitiesCss(resolveConfig());
		expect(css).not.toMatch(/--hz-palette-/);
		// The header's own doctrine prose says "no !important" — assert no
		// actual CSS declaration uses the flag, not that the substring is absent.
		expect(css).not.toMatch(/!important\s*;/);
		expect(css).not.toMatch(/@layer/);
		expect(css).not.toMatch(/:root/);
	});

	it('class-count math: 7 color role helpers + 4 × 7 intent helpers + 7 margin families × 6 space rungs = 77 rules', () => {
		const css = generateUtilitiesCss(resolveConfig());
		const ruleCount = (css.match(/^\.hz-[a-z0-9-]+ \{$/gm) ?? []).length;
		expect(Object.keys(intent).length).toBe(7);
		expect(Object.keys(space).length).toBe(6);
		// Role helpers per family: text 2, bg 2, border 1, fill 2.
		expect(ruleCount).toBe(2 + 2 + 1 + 2 + 4 * 7 + 7 * 6);
		expect(ruleCount).toBe(77);
	});

	it('every color family emits its own property, for roles and intents alike', () => {
		const css = generateUtilitiesCss(resolveConfig());
		expect(css).toContain('.hz-bg-muted {\n\tbackground-color: var(--hz-color-surface-muted);\n}');
		expect(css).toContain('.hz-border {\n\tborder-color: var(--hz-color-border);\n}');
		expect(css).toContain('.hz-fill-primary {\n\tfill: var(--hz-intent-primary);\n}');
		expect(css).toContain('.hz-bg-danger {\n\tbackground-color: var(--hz-intent-danger);\n}');
	});

	it('is deterministic — same resolved config, same bytes', () => {
		const resolved = resolveConfig();
		expect(generateUtilitiesCss(resolved)).toBe(generateUtilitiesCss(resolved));
	});

	it('a consumer-added intent gets a new .hz-text-* class generated automatically', () => {
		const css = generateUtilitiesCss(
			resolveConfig({ tokens: { intent: { brand: 'var(--hz-palette-primary)' } } })
		);
		expect(css).toContain('.hz-text-brand {\n\tcolor: var(--hz-intent-brand);\n}');
	});

	it('a consumer-added space rung gets all seven margin families generated automatically', () => {
		const css = generateUtilitiesCss(resolveConfig({ tokens: { space: { xxl: '12rem' } } }));
		for (const className of [
			'hz-m-xxl',
			'hz-m-block-xxl',
			'hz-m-block-start-xxl',
			'hz-m-block-end-xxl',
			'hz-m-inline-xxl',
			'hz-m-inline-start-xxl',
			'hz-m-inline-end-xxl'
		]) {
			expect(css).toContain(`.${className} {`);
		}
	});

	it('a consumer intent literally named "muted" hard-errors, naming both parties', () => {
		expect(() =>
			generateUtilitiesCss(resolveConfig({ tokens: { intent: { muted: '#334155' } } }))
		).toThrow(/config\.tokens\.intent\.muted/);
		expect(() =>
			generateUtilitiesCss(resolveConfig({ tokens: { intent: { muted: '#334155' } } }))
		).toThrow(/hz-text-muted/);
	});

	it('the committed src/lib/theme/utilities.css equals generateUtilitiesCss(resolveConfig()) byte-for-byte', () => {
		const committed = readFileSync(join(here, '../theme/utilities.css'), 'utf8');
		expect(generateUtilitiesCss(resolveConfig())).toBe(committed);
	});

	it('the header carries the generated-file banner, the utility definition, and the anti-goal paragraph', () => {
		const css = generateUtilitiesCss(resolveConfig());
		expect(css).toContain('GENERATED FILE — do not edit by hand.');
		expect(css).toContain('token-derived, single-property');
		expect(css).toContain('not an alternative layout system');
		expect(css).toContain('padding is owned by components');
	});
});

// ---------------------------------------------------------------------------
// AA cross-check (specs/44 R7) — every .hz-text-<intent> maps to a pairing
// the existing contrastReport already grades; the utility sheet introduces
// no new pairings, so no contrastReport change is required.
// ---------------------------------------------------------------------------

describe('generateUtilitiesCss — AA cross-check (specs/44 R7)', () => {
	it('every intent text utility has a passing text:intent-<x>/surface(-muted) pairing in both modes', () => {
		const resolved = resolveConfig();
		const report = contrastReport(resolved);
		const ids = new Set(report.rows.map((r) => `${r.mode}:${r.id}`));
		for (const key of Object.keys(intent)) {
			for (const mode of ['light', 'dark'] as const) {
				for (const surface of ['surface', 'surface-muted']) {
					const id = `${mode}:text:intent-${key}/${surface}`;
					expect(ids.has(id), id).toBe(true);
					const row = report.rows.find(
						(r) => r.mode === mode && r.id === `text:intent-${key}/${surface}`
					);
					expect(row?.pass, id).toBe(true);
				}
			}
		}
	});
});
