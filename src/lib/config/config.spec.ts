import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	defineConfig,
	resolveConfig,
	generateCss,
	contrastReport,
	HyzerConfigError
} from './index.js';
import { toKebab } from './schema.js';
import { color, intent, space, typography } from '../tokens/index.js';

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
// resolveConfig — merge semantics (R2)
// ---------------------------------------------------------------------------

describe('resolveConfig — extend-only merge', () => {
	it('defineConfig is a typed identity', () => {
		const config = { tokens: { color: { primary: '#0f766e' } } };
		expect(defineConfig(config)).toBe(config);
	});

	it('zero config resolves every base token', () => {
		const resolved = resolveConfig();
		const names = resolved.sections.flatMap((s) => s.entries.map((e) => e.cssName));
		expect(names).toContain('--hz-color-primary');
		expect(names).toContain('--hz-font-size-3xl');
		expect(names).toContain('--hz-z-toast');
		expect(names).toContain('--hz-ease-standard');
		expect(resolved.sections.flatMap((s) => s.entries).every((e) => !e.fromConfig)).toBe(true);
	});

	it('overrides an existing key in place and marks it fromConfig', () => {
		const resolved = resolveConfig({ tokens: { color: { primary: '#0f766e' } } });
		const palette = resolved.sections.find((s) => s.id === 'palette')!.entries;
		const primary = palette.find((e) => e.key === 'primary')!;
		expect(primary.value).toBe('#0f766e');
		expect(primary.fromConfig).toBe(true);
		// Order unchanged: primary stays first.
		expect(palette[0].key).toBe('primary');
	});

	it('appends added keys after the base keys, in config order', () => {
		const resolved = resolveConfig({
			tokens: { color: { fairway: '#3f6212', chains: '#a16207' } }
		});
		const palette = resolved.sections.find((s) => s.id === 'palette')!.entries;
		const keys = palette.map((e) => e.key);
		expect(keys.slice(0, Object.keys(color).indexOf('gray') + 1)).not.toContain('fairway');
		expect(keys.slice(-2)).toEqual(['fairway', 'chains']);
		expect(palette.at(-2)!.cssName).toBe('--hz-color-fairway');
	});

	it('classifies added color keys: hex → palette, var()/derived → roles', () => {
		const resolved = resolveConfig({
			tokens: { color: { fairway: '#3f6212', accent: 'var(--hz-color-fairway)' } }
		});
		const palette = resolved.sections.find((s) => s.id === 'palette')!.entries;
		const roles = resolved.sections.find((s) => s.id === 'roles')!.entries;
		expect(palette.some((e) => e.key === 'fairway')).toBe(true);
		expect(roles.some((e) => e.key === 'accent')).toBe(true);
	});

	it('an overridden role keeps its section even with a literal value', () => {
		const resolved = resolveConfig({ tokens: { color: { surface: '#f8fafc' } } });
		const roles = resolved.sections.find((s) => s.id === 'roles')!.entries;
		expect(roles.find((e) => e.key === 'surface')!.value).toBe('#f8fafc');
	});

	it('kebab-cases added keys (brandTeal → --hz-color-brand-teal)', () => {
		expect(toKebab('brandTeal')).toBe('brand-teal');
		expect(toKebab('2xl')).toBe('2xl');
		const resolved = resolveConfig({ tokens: { color: { brandTeal: '#0d9488' } } });
		const names = resolved.sections.flatMap((s) => s.entries.map((e) => e.cssName));
		expect(names).toContain('--hz-color-brand-teal');
	});

	it('merges dark additions over the base dark authoring', () => {
		const resolved = resolveConfig({ dark: { color: { fairway: '#a3e635' } } });
		expect(resolved.dark.color.at(-1)).toMatchObject({
			cssName: '--hz-color-fairway',
			value: '#a3e635',
			fromConfig: true
		});
		// Base dark entries intact; intents contribute NO base dark entries —
		// dark is authored entirely at the palette/role layer.
		expect(resolved.dark.color.find((e) => e.key === 'danger')!.value).toBe(
			color.theme.dark.danger
		);
		expect(resolved.dark.color.find((e) => e.key === 'primary')!.value).toBe(
			color.theme.dark.primary
		);
		expect(resolved.dark.intent).toEqual([]);
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
			/color, intent, space/
		);
	});

	it('rejects unknown nested sections', () => {
		expect(() => resolveConfig({ tokens: { typography: { fontStretch: {} } } } as never)).toThrow(
			/config.tokens.typography/
		);
		expect(() => resolveConfig({ dark: { shadow: {} } } as never)).toThrow(/config.dark/);
	});

	it('rejects non-string token values', () => {
		expect(() => resolveConfig({ tokens: { space: { xs: 8 } } } as never)).toThrow(
			/must be a non-empty string/
		);
	});

	it('rejects kebab collisions between config and base keys', () => {
		// Base color has textMuted → --hz-color-text-muted.
		expect(() => resolveConfig({ tokens: { color: { 'text-muted': '#333333' } } })).toThrow(
			/kebab-cases to "--hz-color-text-muted"/
		);
	});

	it('rejects var() references to undefined tokens', () => {
		expect(() => resolveConfig({ tokens: { intent: { brand: 'var(--hz-color-nope)' } } })).toThrow(
			/--hz-color-nope, which is not a defined token/
		);
	});

	it('accepts references to config-added tokens and derived density distances', () => {
		expect(() =>
			resolveConfig({
				tokens: {
					color: { fairway: '#3f6212' },
					intent: { fairway: 'var(--hz-color-fairway)' },
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
		const css = generateCss(resolveConfig({ tokens: { color: { fairway: '#3f6212' } } }));
		expect(css).toContain('\t--hz-color-fairway: #3f6212;');
		expect(css.indexOf('--hz-color-gray:')).toBeLessThan(css.indexOf('--hz-color-fairway:'));
	});

	it('a density unit override rewrites --hz-density and keeps the derived cascade', () => {
		const css = generateCss(resolveConfig({ tokens: { density: { unit: '0.5rem' } } }));
		expect(css).toContain('--hz-density: 0.5rem;');
		expect(css).toContain('--hz-space-near: calc(var(--hz-density) * 10);');
	});

	it('config dark additions land in the dark block', () => {
		const css = generateCss(
			resolveConfig({
				tokens: { color: { fairway: '#3f6212' } },
				dark: { color: { fairway: '#a3e635' } }
			})
		);
		const darkBlock = css.slice(css.indexOf("[data-theme='dark']"));
		expect(darkBlock).toContain('--hz-color-fairway: #a3e635;');
	});

	it('is deterministic', () => {
		const config = { tokens: { color: { primary: '#0f766e', fairway: '#3f6212' } } };
		expect(generateCss(resolveConfig(config))).toBe(generateCss(resolveConfig(config)));
	});
});

describe('generateCss — overrides mode', () => {
	it('emits only config-touched declarations', () => {
		const css = generateCss(
			resolveConfig({ tokens: { color: { primary: '#0f766e', fairway: '#3f6212' } } }),
			{ mode: 'overrides' }
		);
		expect(css).toContain(':root {');
		expect(css).toContain('--hz-color-primary: #0f766e;');
		expect(css).toContain('--hz-color-fairway: #3f6212;');
		expect(css).not.toContain('--hz-color-gray');
		expect(css).not.toContain('--hz-space-md');
		expect(css).not.toContain("[data-theme='dark']");
	});

	it('scopes under a custom selector, dark block composing with it', () => {
		const css = generateCss(
			resolveConfig({
				tokens: { color: { primary: '#0f766e' } },
				dark: { intent: { primary: '#5eead4' } }
			}),
			{ mode: 'overrides', selector: '.theme-ocean' }
		);
		expect(css).toContain('.theme-ocean {');
		expect(css).toContain(".theme-ocean[data-theme='dark'], [data-theme='dark'] .theme-ocean {");
		expect(css).toContain('--hz-intent-primary: #5eead4;');
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
		const report = contrastReport(resolveConfig({ tokens: { color: { warning: '#d97706' } } }));
		const failing = report.rows.filter((r) => !r.pass).map((r) => `${r.mode}:${r.id}`);
		expect(report.pass).toBe(false);
		expect(failing).toContain('light:text:intent-warning/surface');
		// Dark mode is untouched — the dark palette hue still applies.
		expect(failing.every((id) => id.startsWith('light:'))).toBe(true);
	});

	it('lists unresolvable values instead of guessing', () => {
		const report = contrastReport(
			resolveConfig({ tokens: { color: { primary: 'oklch(0.5 0.2 250)' } } })
		);
		expect(report.unresolved.some((u) => u.startsWith('--hz-intent-primary'))).toBe(true);
	});

	it('report values match the metadata-derived expectations', () => {
		const report = contrastReport(resolveConfig());
		const darkDanger = report.rows.find(
			(r) => r.mode === 'dark' && r.id === 'text:intent-danger/surface'
		)!;
		// Every intent chains through the dark palette hue.
		expect(darkDanger.fg.hex).toBe(color.theme.dark.danger);
		const darkPrimary = report.rows.find(
			(r) => r.mode === 'dark' && r.id === 'text:intent-primary/surface'
		)!;
		expect(darkPrimary.fg.hex).toBe(color.theme.dark.primary);
		// Sanity: metadata still exposes the groups the engine consumes.
		expect(intent.primary).toBe('var(--hz-color-primary)');
		expect(space.md).toBe('2rem');
		expect(typography.fontSize['3xl']).toBe('3.5rem');
	});
});

// ---------------------------------------------------------------------------
// The two-tier rule — dark is palette-level; intents are a pure remap surface
// ---------------------------------------------------------------------------

describe('two-tier dark authoring', () => {
	it('the base dark block emits no --hz-intent-* declarations', () => {
		const css = generateCss(resolveConfig());
		const darkBlock = css.slice(css.indexOf("[data-theme='dark']"));
		expect(darkBlock).not.toContain('--hz-intent-');
	});

	it('a consumer dark palette override flows through to the intent', () => {
		const resolved = resolveConfig({ dark: { color: { primary: '#1e3a8a' } } });
		const report = contrastReport(resolved);
		const darkPrimary = report.rows.find(
			(r) => r.mode === 'dark' && r.id === 'text:intent-primary/surface'
		)!;
		expect(darkPrimary.fg.hex).toBe('#1e3a8a');
	});

	it('config.dark.intent remains the consumer surface for mode-specific remaps', () => {
		const resolved = resolveConfig({ dark: { intent: { primary: '#93c5fd' } } });
		const primary = resolved.dark.intent.find((e) => e.key === 'primary')!;
		expect(primary).toMatchObject({ value: '#93c5fd', fromConfig: true });
		const css = generateCss(resolved);
		const darkBlock = css.slice(css.indexOf("[data-theme='dark']"));
		expect(darkBlock).toContain('--hz-intent-primary: #93c5fd;');
	});

	it('a light intent remap/extension is a plain tokens.intent entry', () => {
		const resolved = resolveConfig({
			tokens: { intent: { warning: 'var(--hz-color-secondary)', fairway: '#3f6212' } }
		});
		const entries = resolved.sections.find((s) => s.id === 'intent')!.entries;
		expect(entries.find((e) => e.key === 'warning')!.value).toBe('var(--hz-color-secondary)');
		expect(entries.at(-1)!.cssName).toBe('--hz-intent-fairway');
	});
});

// ---------------------------------------------------------------------------
// Consumer color ramps — the base ships none, the engine generates any
// ---------------------------------------------------------------------------

describe('consumer color ramps', () => {
	it('generates flat and nested ramp keys as palette tokens', () => {
		const resolved = resolveConfig({
			tokens: {
				color: {
					'red-50': '#fef2f2',
					brandRed: { 100: '#fee2e2', 900: '#7f1d1d' }
				}
			}
		});
		const palette = resolved.sections.find((s) => s.id === 'palette')!.entries;
		const names = palette.map((e) => e.cssName);
		expect(names).toContain('--hz-color-red-50');
		expect(names).toContain('--hz-color-brand-red-100');
		expect(names).toContain('--hz-color-brand-red-900');
		const css = generateCss(resolved);
		expect(css).toContain('\t--hz-color-brand-red-900: #7f1d1d;');
	});

	it('ramps work in the dark block and intents can reference ramp steps', () => {
		const resolved = resolveConfig({
			tokens: {
				color: { brandRed: { 500: '#ef4444' } },
				intent: { danger: 'var(--hz-color-brand-red-500)' }
			},
			dark: { color: { brandRed: { 500: '#fca5a5' } } }
		});
		const css = generateCss(resolved);
		const darkBlock = css.slice(css.indexOf("[data-theme='dark']"));
		expect(darkBlock).toContain('--hz-color-brand-red-500: #fca5a5;');
		const report = contrastReport(resolved);
		const darkDanger = report.rows.find(
			(r) => r.mode === 'dark' && r.id === 'text:intent-danger/surface'
		)!;
		expect(darkDanger.fg.hex).toBe('#fca5a5');
	});

	it('rejects non-string ramp leaves and colliding flat/nested spellings', () => {
		expect(() => resolveConfig({ tokens: { color: { red: { 50: 5 } } } } as never)).toThrow(
			/config.tokens.color.red.50/
		);
		expect(() =>
			resolveConfig({
				tokens: { color: { 'brand-red-100': '#fee2e2', brandRed: { 100: '#fecaca' } } }
			})
		).toThrow(/kebab-cases to "--hz-color-brand-red-100"/);
	});
});
