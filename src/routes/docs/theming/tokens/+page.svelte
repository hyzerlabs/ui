<script lang="ts">
	import { Stack, Tabs, CodeBlock } from '$lib';
	import DocIntro from '../../../../docs/DocIntro.svelte';

	const recipeTabs = [
		{ id: 'palette', label: 'Palette' },
		{ id: 'intents', label: 'Intents' },
		{ id: 'dark', label: 'Dark mode' },
		{ id: 'shape', label: 'Shape & density' }
	];

	const paletteCode = [
		'/* Override any hue once, in the --hz-palette-* namespace; every role',
		'   and intent that references it follows automatically. */',
		':root {',
		'\t--hz-palette-primary: #0f766e;',
		'\t--hz-palette-gray: #64748b; /* border, text-muted, and surface tints follow */',
		'}'
	].join('\n');

	const intentCode = [
		'/* The intent layer is a remap surface: point an intent at a different',
		'   palette hue than its default, or add brand-new category tokens. */',
		':root {',
		'\t--hz-intent-danger: var(--hz-palette-secondary); /* remap */',
		'\t--hz-intent-fairway: #3f6212;                     /* extend */',
		'}'
	].join('\n');

	const darkCode = [
		'/* Dark mode may override any tier, including the palette — the same',
		'   hook the base sheet uses. Override a hue here and its intents,',
		'   borders, and muted tints follow in dark only; your components keep',
		'   resolving through roles/intents either way. */',
		"[data-theme='dark'] {",
		'\t--hz-palette-primary: #2dd4bf;',
		'}',
		'',
		'/* Intents can be re-authored per mode too, if you want a mapping that',
		'   only applies in the dark: */',
		"[data-theme='dark'] {",
		'\t--hz-intent-fairway: #a3e635;',
		'}',
		'',
		'/* Two things you get without writing them:',
		'   - the sheet already follows the system preference, so you only need',
		'     a script to OVERRIDE it, never to obey it;',
		'   - data-theme works on ANY element, not just <html> \u2014 so one section',
		'     can be dark inside a light page, and data-theme="light" switches',
		'     a section back. See Section themes. */'
	].join('\n');

	const verifyCode = [
		"import { gradeContrast, contrastRatio, mixSrgb } from '@hyzer-labs/ui';",
		"import { palette } from '@hyzer-labs/ui/tokens';",
		'',
		'// Your override for --hz-palette-primary',
		"const brand = '#0f766e';",
		'',
		'gradeContrast(brand, palette.white).aaNormal; // text on surface',
		'gradeContrast(palette.white, brand).aaNormal; // solid button text',
		'',
		'// On surface-muted — the same 6% color-mix the theme derives',
		'contrastRatio(brand, mixSrgb(palette.gray, palette.white, 0.06));'
	].join('\n');

	const shapeCode = [
		':root {',
		'\t--hz-radius-md: 0.625rem;   /* buttons, cards, fields */',
		'\t--hz-density: 0.5rem;       /* rescales every near/away distance */',
		"\t--hz-font-family-sans: 'Inter', system-ui, sans-serif;",
		'}'
	].join('\n');

	const configCode = [
		'// hyzer.config.ts',
		"import { defineConfig } from '@hyzer-labs/ui/config';",
		'',
		'export default defineConfig({',
		"\toutput: 'src/styles/tokens.css',",
		'\ttokens: {',
		'\t\tpalette: {',
		"\t\t\tprimary: '#0f766e',                              // override",
		"\t\t\tfairway: '#3f6212',                              // add a hue",
		"\t\t\tbrandRed: { 50: '#fef2f2', 900: '#7f1d1d' }      // add a ramp",
		'\t\t},',
		"\t\tintent: { fairway: 'var(--hz-palette-fairway)' }, // add an intent",
		'\t\ttypography: { fontFamily: { sans: "\'Inter\', system-ui, sans-serif" } },',
		"\t\tdensity: { unit: '0.5rem' }",
		'\t},',
		'\tthemes: {',
		'\t\tdark: {',
		"\t\t\tpalette: { primary: '#2dd4bf', fairway: '#a3e635' }",
		'\t\t}',
		'\t}',
		'});'
	].join('\n');

	const reportCode = [
		'$ hyzer generate',
		'config: hyzer.config.ts',
		'wrote src/styles/tokens.css (full, 89 tokens)',
		'contrast: 104 pairings checked — all pass WCAG AA'
	].join('\n');

	const modesCode = [
		'# A complete sheet — import it INSTEAD of tokens.css:',
		'hyzer generate',
		'',
		'# A patch sheet with only your overrides — import it AFTER tokens.css:',
		'hyzer generate --mode overrides',
		'',
		'# Also write the opt-in utilities sheet, next to the tokens sheet:',
		'hyzer generate --utilities',
		'',
		'# Flags compose — a patch sheet AND the utilities sheet, one run:',
		'hyzer generate --mode overrides --utilities',
		'',
		'# Validate without writing; fail CI on any AA miss (and any unknown icon):',
		'hyzer generate --check --strict'
	].join('\n');

	const iconsConfigCode = [
		'// hyzer.config.ts',
		"import { defineConfig } from '@hyzer-labs/ui/config';",
		'',
		'export default defineConfig({',
		"\t// kebab-case Lucide names — 'plus' is already core (deduped, no warning)",
		"\ticons: ['plus', 'trash-2', 'settings', 'serch']",
		'});'
	].join('\n');

	const iconsReportCode = [
		'$ hyzer generate',
		'wrote hyzer-tokens.css (full, 84 tokens)',
		'wrote icons.ts (16 icons)',
		'contrast: 92 pairings checked — all pass WCAG AA',
		'  ? icons: "serch" is not a valid Lucide icon name — omitted from the barrel',
		'icons: 1 unknown name(s) (warnings; use --strict to fail the build)',
		'icons: 16 included (14 core, 2 configured)'
	].join('\n');

	const utilitiesConfigCode = [
		'// hyzer.config.ts',
		"import { defineConfig } from '@hyzer-labs/ui/config';",
		'',
		'export default defineConfig({',
		'\t// true opts in with the default filename; { output } picks a custom path',
		'\tutilities: true',
		'});'
	].join('\n');

	const utilitiesReportCode = [
		'$ hyzer generate',
		'config: hyzer.config.ts',
		'wrote hyzer-tokens.css (full, 84 tokens)',
		'wrote hyzer-utilities.css',
		'contrast: 92 pairings checked — all pass WCAG AA'
	].join('\n');

	// The complete option surface (src/lib/config/schema.ts) — every group is
	// commented out, so this exact object is a valid, empty config as written
	// (`defineConfig({})`); uncommenting any one line, or all of them, stays
	// valid too (verified against resolveConfig — see specs/40-findings.md).
	const fullReferenceConfigCode = [
		'// hyzer.config.ts — every option group the schema accepts, commented out.',
		'// Uncomment only what you need; each line is independently valid.',
		"import { defineConfig } from '@hyzer-labs/ui/config';",
		'',
		'export default defineConfig({',
		"\t// output: 'src/styles/tokens.css', // where `hyzer generate` writes the sheet",
		'',
		'\t// tokens: {',
		'\t// \tpalette: {                          // raw hues (--hz-palette-*); ramps welcome',
		"\t// \t\tprimary: '#0f766e',",
		"\t// \t\tbrandRed: { 500: '#ef4444', 900: '#7f1d1d' }",
		'\t// \t},',
		"\t// \tcolor: { border: '#94a3b8' },       // structural role tokens (--hz-color-*)",
		"\t// \tintent: { fairway: 'var(--hz-palette-primary)' }, // remap or add intents (--hz-intent-*)",
		"\t// \tspace: { xs: '0.375rem' },          // the fixed margin/gap scale (--hz-space-*)",
		"\t// \twidth: { md: '960px' },             // layout max-widths (--hz-width-*)",
		'\t// \ttypography: {',
		"\t// \t\tfontSize: { base: '1.05rem' },    // --hz-font-size-*",
		'\t// \t\tfontFamily: { sans: "\'Inter\', system-ui, sans-serif" }, // --hz-font-family-*',
		"\t// \t\tfontWeight: { semibold: '650' },  // --hz-font-weight-*",
		"\t// \t\tlineHeight: { base: '1.6' }       // --hz-line-height-*",
		'\t// \t},',
		"\t// \tradius: { md: '0.625rem' },         // corner radii (--hz-radius-*)",
		"\t// \tborder: { width: { thin: '1.5px' } }, // border widths (--hz-border-width-*)",
		"\t// \tshadow: { md: '0 10px 15px -3px rgb(0 0 0 / 0.15)' }, // elevation (--hz-shadow-*)",
		"\t// \tzIndex: { modal: '1200' },          // stacking order (--hz-z-*)",
		'\t// \tmotion: {',
		"\t// \t\tduration: { base: '350ms' },      // --hz-duration-*",
		"\t// \t\tease: { standard: 'ease-out' }    // --hz-ease-*",
		'\t// \t},',
		"\t// \tdensity: { unit: '0.5rem' }         // the --hz-density grid unit (near/away cascade)",
		'\t// },',
		'',
		'\t// themes: {                            // one block per data-theme="<name>"',
		'\t// \tdark: {                            // [data-theme="dark"]',
		"\t// \t\tpalette: { primary: '#2dd4bf' },  // hue overrides for dark",
		"\t// \t\tcolor: { surface: '#020617' },    // role overrides for dark",
		"\t// \t\tintent: { fairway: '#a3e635' }    // intent remaps for dark only",
		'\t// \t},',
		"\t// \tocean: { palette: { primary: '#0ea5e9' } } // any name you like",
		'\t// },',
		'',
		"\t// icons: ['plus', 'trash-2', 'settings'], // trims the generated icons.ts barrel",
		'',
		"\t// utilities: true // opt in to hyzer-utilities.css (or { output: 'styles/hyzer-utilities.css' })",
		'});'
	].join('\n');
</script>

<svelte:head>
	<title>Tokens & Overrides — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro>
		{#snippet lead()}
			Two layers, one rule: Layer 1 is the palette (<code>--hz-palette-*</code>) — single-value
			hues, authored per mode. Layer 2 (semantic roles, <code>--hz-color-*</code>, and intents,
			<code>--hz-intent-*</code>) is pure <code>var()</code> indirection that chains through it, so overriding
			a hue cascades everywhere it's used.
		{/snippet}
	</DocIntro>

	<div class="doc-intro">
		<p class="detail-note">
			Remap or extend Layer 2 directly when you want different wiring instead of a palette override.
			Token names and defaults live on
			<a href="/docs/foundation/colors">Colors &amp; Intent</a>. Duration and easing tokens (<code
				>--hz-duration-*</code
			>
			/ <code>--hz-ease-*</code>) follow the same override rules and are documented on
			<a href="/docs/foundation/motion">Motion</a>
			— the same page introduces
			<code>@hyzer-labs/ui/motion</code>, script-side helpers (transitions, a scroll-reveal
			attachment, a view-transition wrapper) built on those tokens.
		</p>
		<p class="doctrine-note">
			Dark mode may override any tier in <code>[data-theme='dark']</code>, including the palette —
			your components and the reference theme never read <code>--hz-palette-*</code> directly, so they
			keep resolving through roles and intents either way.
		</p>
		<p class="doctrine-note">
			Dark is not a special case in the config, either: it is one entry in a
			<code>themes</code> map, and you can add as many more as you like.
			<a href="/docs/theming/sections">Section themes</a> covers naming them and scoping one to part of
			a page.
		</p>
	</div>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="css-heading"
	>
		<h2 id="css-heading">In plain CSS — no build step</h2>
		<p>
			Import your stylesheet after <code>tokens.css</code> and redefine what you need. These are the four
			recipes that cover nearly everything:
		</p>
		<Tabs items={recipeTabs} ariaLabel="Override recipes" defaultTab="palette">
			{#snippet panel(item)}
				<div class="tab-content">
					{#if item.id === 'palette'}
						<CodeBlock code={paletteCode} />
					{:else if item.id === 'intents'}
						<CodeBlock code={intentCode} />
					{:else if item.id === 'dark'}
						<CodeBlock code={darkCode} />
					{:else}
						<CodeBlock code={shapeCode} />
					{/if}
				</div>
			{/snippet}
		</Tabs>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="config-heading"
	>
		<h2 id="config-heading">With the <code>hyzer</code> CLI — a config as source of truth</h2>
		<p>
			The same engine that generates this library's own <code>tokens.css</code> ships in the
			package. Describe your system once in <code>hyzer.config.ts</code> — overrides merge over the
			base schema, new keys extend it, and nested <code>tokens.palette</code> objects generate ramps
			(<code>--hz-palette-brand-red-900</code>) even though the base palette ships none.
		</p>
		<CodeBlock code={configCode} />
		<p>
			Every run prints a WCAG contrast report over the resolved tokens — the same math and the same
			pairings used to validate this library's own token set, covering your custom intents too:
		</p>
		<CodeBlock code={reportCode} />
		<CodeBlock code={modesCode} />
		<p class="note">
			TypeScript configs load via Node's native type stripping (Node ≥ 22.18); on older runtimes
			name the file <code>hyzer.config.mjs</code>. The engine is also importable directly from
			<code>@hyzer-labs/ui/config</code> (<code>resolveConfig</code>, <code>generateCss</code>,
			<code>contrastReport</code>) for build scripts of your own.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="icons-config-heading"
	>
		<h2 id="icons-config-heading">Trimming the icon set</h2>
		<p>
			The same config extends to <a href="/docs/components/icons">icons</a>: an optional
			<code>icons: string[]</code> list of kebab-case Lucide names. <code>hyzer generate</code>
			emits an <code>icons.ts</code> module next to the tokens sheet — named re-exports from
			<code>@hyzer-labs/ui/icons/&lt;name&gt;</code> deep paths for the union of your list and the library's
			always-shipped core set (the chevrons, close, menu, and friends its own components depend on) —
			so your app's autocomplete surface is its own icon vocabulary, not the full 1,700-plus name Lucide
			set.
		</p>
		<CodeBlock code={iconsConfigCode} />
		<p>
			Core icons are deduplicated into the core group with no warning if you list one explicitly. An
			unknown name is a report warning by default; <code>--strict</code> turns it into a failing run
			(the icon is still omitted from the emitted barrel either way). Omitting the
			<code>icons</code> key entirely skips the file and the report section — <code>icons: []</code>
			is a valid, minimal config: the core-only barrel.
		</p>
		<CodeBlock code={iconsReportCode} />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="utilities-config-heading"
	>
		<h2 id="utilities-config-heading">Generating the utilities sheet</h2>
		<p>
			The <a href="/docs/foundation/utilities">opt-in utilities sheet</a> is engine output too: set
			<code>utilities: true</code> in the config (or pass <code>--utilities</code> on the command
			line, which overrides the config key when both are present) and <code>hyzer generate</code>
			writes
			<code>hyzer-utilities.css</code> next to the tokens sheet. An object form,
			<code>utilities: {"{ output: '...' }"}</code>, picks a custom path. Omitting the key entirely
			— the default — writes no utilities file at all.
		</p>
		<CodeBlock code={utilitiesConfigCode} />
		<CodeBlock code={utilitiesReportCode} />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="full-reference-heading"
	>
		<h2 id="full-reference-heading">Full reference</h2>
		<p>
			Every group <code>hyzer.config.ts</code> accepts, in one file, commented out — uncomment what you
			need and delete the rest. The comments on each line name the tokens it drives.
		</p>
		<CodeBlock code={fullReferenceConfigCode} />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="verify-heading"
	>
		<h2 id="verify-heading">Verify your palette</h2>
		<p>
			The contrast math behind the generate report is public API: <code>contrastRatio</code> gives
			the raw WCAG ratio for two hex colors, <code>gradeContrast</code> turns a
			foreground/background pair into pass/fail grades per level and text size,
			<code>bestLevel</code>
			/
			<code>bestLevelLarge</code> name the best level a ratio reaches, and
			<code>mixSrgb</code>, <code>relativeLuminance</code>, <code>hexToRgb</code>, and
			<code>rgbToHex</code> are the conversion pieces. All are pure functions over hex strings — no
			DOM, SSR-safe — exported from the package root and <code>@hyzer-labs/ui/utils</code>, with the
			resolved palette importable from <code>@hyzer-labs/ui/tokens</code>.
		</p>
		<p>Assert the pairings your override touches in a unit test:</p>
		<CodeBlock code={verifyCode} />
		<p>
			For the full methodology and a live pairing checker over every shipped token, see
			<a href="/docs/foundation/contrast#api-heading">Contrast &amp; Accessibility</a>.
		</p>
	</Stack>
</Stack>

<style>
	/* Margins zeroed below — every <p> and CodeBlock outside .doc-intro is a
	 * direct child of a .doc-section Stack (gap="away", data-density-shift),
	 * which owns the space between them. .doc-intro's own p's (doc-description,
	 * .doctrine-note) are nested inside that plain div and keep their own
	 * margins (docs.css / this file). */
	p {
		margin: 0;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	.note {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.detail-note {
		margin: 0.75rem 0;
	}

	.doctrine-note {
		margin: 0;
		padding: 0.75rem 1rem;
		border-inline-start: 3px solid var(--hz-color-border, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
