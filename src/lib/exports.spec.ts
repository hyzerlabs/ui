import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';

/**
 * Verifies every subpath export resolves and exposes its public API.
 */
describe('subpath exports', () => {
	it('$lib (.) — exports Button, Link, layout primitives, Nav, Footer, Image, Video, Card, Hero, Modal, Accordion, Tabs, and form components', async () => {
		const mod = await import('$lib');
		expect(mod.Button).toBeDefined();
		// CodeBlock-R11: CodeBlock exported from $lib.
		expect(mod.CodeBlock).toBeDefined();
		expect(mod.Link).toBeDefined();
		expect(mod.Container).toBeDefined();
		expect(mod.Stack).toBeDefined();
		expect(mod.Cluster).toBeDefined();
		expect(mod.Grid).toBeDefined();
		expect(mod.Split).toBeDefined();
		// Virtualizer-R11: Virtualizer exported from $lib.
		expect(mod.Virtualizer).toBeDefined();
		expect(mod.Nav).toBeDefined();
		expect(mod.Footer).toBeDefined();
		expect(mod.Image).toBeDefined();
		expect(mod.Video).toBeDefined();
		expect(mod.Card).toBeDefined();
		expect(mod.Hero).toBeDefined();
		expect(mod.Modal).toBeDefined();
		expect(mod.Accordion).toBeDefined();
		expect(mod.Tabs).toBeDefined();
		// Forms-R3: six form components exported from $lib.
		expect(mod.TextInput).toBeDefined();
		expect(mod.Textarea).toBeDefined();
		expect(mod.Select).toBeDefined();
		// Combobox-R16: Combobox exported from $lib.
		expect(mod.Combobox).toBeDefined();
		// Dropdown-R16: Dropdown exported from $lib.
		expect(mod.Dropdown).toBeDefined();
		// FileUpload-R14: FileUpload exported from $lib.
		expect(mod.FileUpload).toBeDefined();
		expect(mod.Checkbox).toBeDefined();
		expect(mod.RadioGroup).toBeDefined();
		expect(mod.Toggle).toBeDefined();
		// Slider-R7: Slider exported from $lib.
		expect(mod.Slider).toBeDefined();
		// Range-R7: RangeSlider exported from $lib.
		expect(mod.RangeSlider).toBeDefined();
		// Color-R6: ColorInput exported from $lib.
		expect(mod.ColorInput).toBeDefined();
		// Badge-R6: Badge exported from $lib.
		expect(mod.Badge).toBeDefined();
		// Banner-R10: Banner exported from $lib.
		expect(mod.Banner).toBeDefined();
		// Alert-R6: Alert exported from $lib.
		expect(mod.Alert).toBeDefined();
		// Blockquote-R6: Blockquote exported from $lib.
		expect(mod.Blockquote).toBeDefined();
		// Divider-R6: Divider exported from $lib.
		expect(mod.Divider).toBeDefined();
		// Pagination-R8: Pagination exported from $lib.
		expect(mod.Pagination).toBeDefined();
		// Form-R9: Form component exported from $lib.
		expect(mod.Form).toBeDefined();
		// Form-R11: toFormErrors helper exported from $lib.
		expect(mod.toFormErrors).toBeDefined();
		// Lightbox-R16: lightboxGroup attachment factory exported from $lib.
		expect(mod.lightboxGroup).toBeDefined();
		expect(typeof mod.lightboxGroup).toBe('function');
		// Contrast utilities (2026-07-15): WCAG math exported from the root
		// so consumers can verify palette overrides.
		expect(typeof mod.contrastRatio).toBe('function');
		expect(typeof mod.gradeContrast).toBe('function');
		expect(typeof mod.relativeLuminance).toBe('function');
		expect(typeof mod.mixSrgb).toBe('function');
		expect(typeof mod.bestLevel).toBe('function');
		expect(typeof mod.bestLevelLarge).toBe('function');
		expect(typeof mod.hexToRgb).toBe('function');
		expect(typeof mod.rgbToHex).toBe('function');
	});

	// CodeBlock-R11: smoke render — resolves from $lib and renders its root
	// class. SSR only (this file runs in the node project, not the browser
	// one), which doubles as a check that the component is SSR-safe.
	it('$lib — CodeBlock resolves and smoke-renders `.hz-code-block`', async () => {
		const mod = await import('$lib');
		const { body } = render(mod.CodeBlock, { props: { code: 'const x = 1;' } });
		expect(body).toContain('hz-code-block');
	});

	it('$lib/icons — exports the full generated Lucide barrel + IconProps (specs/36 R3)', async () => {
		const mod = await import('$lib/icons');
		// Core set (specs/36 R4) — always present.
		expect(mod.IconChevronDown).toBeDefined();
		expect(mod.IconChevronRight).toBeDefined();
		expect(mod.IconChevronUp).toBeDefined();
		expect(mod.IconChevronLeft).toBeDefined();
		expect(mod.IconX).toBeDefined();
		expect(mod.IconMenu).toBeDefined();
		expect(mod.IconExternalLink).toBeDefined();
		expect(mod.IconCheck).toBeDefined();
		expect(mod.IconMinus).toBeDefined();
		expect(mod.IconPlus).toBeDefined();
		expect(mod.IconSearch).toBeDefined();
		expect(mod.IconLoader).toBeDefined();
		expect(mod.IconArrowLeft).toBeDefined();
		expect(mod.IconArrowRight).toBeDefined();
		// A sample well beyond the old 21 hand-written names — proves the full
		// Lucide set ships, not just the core.
		expect(mod.IconGlobe).toBeDefined();
		expect(mod.IconMail).toBeDefined();
		expect(mod.IconAxis3d).toBeDefined();
		expect(mod.IconAArrowDown).toBeDefined();
		// The 7 hand-drawn brand marks are deleted outright (specs/36 R2) — no
		// replacement export of the same name.
		expect((mod as Record<string, unknown>).IconGithub).toBeUndefined();
	});

	it('$lib/motion — exports token mirrors, transitions, reveal attachments, and viewTransition (specs/39 R1/R2/R3/R4/R5)', async () => {
		const mod = await import('$lib/motion');
		// R2 — token mirrors.
		expect(mod.durations).toEqual({ fast: 250, base: 400, slow: 550 });
		expect(typeof mod.easingCss.standard).toBe('string');
		expect(typeof mod.easingCss.in).toBe('string');
		expect(typeof mod.easingCss.out).toBe('string');
		expect(typeof mod.easeStandard).toBe('function');
		expect(typeof mod.easeIn).toBe('function');
		expect(typeof mod.easeOut).toBe('function');
		expect(typeof mod.cubicBezier).toBe('function');
		expect(typeof mod.parseCubicBezier).toBe('function');
		// R3 — token-bridged transitions.
		expect(typeof mod.fade).toBe('function');
		expect(typeof mod.fly).toBe('function');
		expect(typeof mod.slide).toBe('function');
		expect(typeof mod.scale).toBe('function');
		// R4 — scroll-reveal attachments.
		expect(typeof mod.reveal).toBe('function');
		expect(typeof mod.revealGroup).toBe('function');
		// R5 — view-transition helper.
		expect(typeof mod.viewTransition).toBe('function');
	});

	it('$lib/utils — exports cx, uid, and the contrast utilities', async () => {
		const mod = await import('$lib/utils');
		expect(typeof mod.cx).toBe('function');
		expect(typeof mod.uid).toBe('function');
		expect(typeof mod.contrastRatio).toBe('function');
		expect(typeof mod.gradeContrast).toBe('function');
	});

	it('$lib/config — exports the token engine (specs/29 R1)', async () => {
		const mod = await import('$lib/config');
		expect(typeof mod.defineConfig).toBe('function');
		expect(typeof mod.resolveConfig).toBe('function');
		expect(typeof mod.generateCss).toBe('function');
		// specs/44 R1 — the utilities-sheet emit function ships from the barrel.
		expect(typeof mod.generateUtilitiesCss).toBe('function');
		expect(typeof mod.contrastReport).toBe('function');
		expect(typeof mod.HyzerConfigError).toBe('function');
	});

	it('$lib/tokens — exports the token metadata groups (specs/15 R7/R9, specs/42 R1)', async () => {
		const mod = await import('$lib/tokens');
		expect(mod.prefix).toBe('--hz');
		expect(mod.palette).toBeDefined();
		expect(mod.color).toBeDefined();
		expect(mod.intent).toBeDefined();
		expect(mod.palette.theme.dark.primary).toBeDefined();
		expect(mod.color.theme.dark.surface).toBeDefined();
		expect(mod.typography).toBeDefined();
		expect(mod.space).toBeDefined();
	});

	it('$lib/types — module is importable (type-only exports have no runtime value)', async () => {
		const mod = await import('$lib/types');
		expect(mod).toBeDefined();
	});
});

/**
 * Sanity-checks on package.json metadata.
 */
describe('package.json metadata', () => {
	it('package name is @hyzer-labs/ui', async () => {
		const pkg = await import('../../package.json', { with: { type: 'json' } });
		expect(pkg.default.name).toBe('@hyzer-labs/ui');
	});

	it('bin exposes the hyzer CLI (specs/29 R9)', async () => {
		const pkg = await import('../../package.json', { with: { type: 'json' } });
		expect((pkg.default.bin as Record<string, string>).hyzer).toBe('./dist/cli/hyzer.js');
	});

	it('theme wildcard export reaches the restructured paths (specs/30 R6)', async () => {
		// Node exports-map `*` matches across `/`, so "./theme/*.css" already
		// covers theme/components/ and theme/examples/ — this pins the files
		// the documented cherry-pick/example paths point at.
		const { existsSync } = await import('node:fs');
		const { fileURLToPath } = await import('node:url');
		const here = fileURLToPath(new URL('.', import.meta.url));
		for (const path of [
			'theme/theme.css',
			'theme/reset.css',
			'theme/components/button.css',
			'theme/components/card.css',
			'theme/examples/ocean.css',
			// The class-override theme is a directory, not a single sheet
			// (specs/32): an index, its generated palette, and per-component
			// sheets. `*` spans `/`, so one wildcard still reaches all of them.
			'theme/examples/terminal/terminal.css',
			'theme/examples/terminal/terminal.tokens.css',
			'theme/examples/terminal/components/button.css',
			// specs/46 — the hand-authored "Docs" example, the docs site's own
			// shipped sheet (no config, no generated palette — just this file).
			'theme/examples/docs/docs.css'
		]) {
			expect(existsSync(`${here}${path}`), path).toBe(true);
		}
		const pkg = await import('../../package.json', { with: { type: 'json' } });
		const exports = pkg.default.exports as Record<string, unknown>;
		expect(exports['./theme/*.css']).toBe('./dist/theme/*.css');
	});

	// specs/44 R5 — the opt-in generated utility sheet's export map entry.
	it('utilities.css export resolves to the generated, committed sheet', async () => {
		const { existsSync } = await import('node:fs');
		const { fileURLToPath } = await import('node:url');
		const here = fileURLToPath(new URL('.', import.meta.url));
		expect(existsSync(`${here}theme/utilities.css`)).toBe(true);
		const pkg = await import('../../package.json', { with: { type: 'json' } });
		const exports = pkg.default.exports as Record<string, unknown>;
		expect(exports['./utilities.css']).toBe('./dist/theme/utilities.css');
	});

	it('exports map contains all required subpath keys', async () => {
		const pkg = await import('../../package.json', { with: { type: 'json' } });
		const exports = pkg.default.exports as Record<string, unknown>;
		expect(exports['.']).toBeDefined();
		expect(exports['./config']).toBeDefined();
		expect(exports['./tokens']).toBeDefined();
		expect(exports['./tokens.css']).toBeDefined();
		expect(exports['./reset.css']).toBeDefined();
		// specs/44 R5 — the opt-in utility sheet's subpath.
		expect(exports['./utilities.css']).toBeDefined();
		expect(exports['./icons']).toBeDefined();
		// specs/36 R3 — deep per-icon subpath for Tier-2 imports.
		expect(exports['./icons/*']).toBeDefined();
		// specs/39 R1 — the motion module's export-map key.
		expect(exports['./motion']).toBeDefined();
		expect(exports['./utils']).toBeDefined();
		expect(exports['./types']).toBeDefined();
		expect(exports['./theme']).toBeDefined();
		expect(exports['./theme/*.css']).toBeDefined();
	});
});
