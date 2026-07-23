<script lang="ts">
	import { Stack, Tabs } from '$lib';
	import CodeBlock from '../../../docs/CodeBlock.svelte';

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
		'}'
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
		'\tdark: {',
		"\t\tpalette: { primary: '#2dd4bf', fairway: '#a3e635' }",
		'\t}',
		'});'
	].join('\n');

	const reportCode = [
		'$ hyzer generate',
		'config: hyzer.config.ts',
		'wrote src/styles/tokens.css (full, 84 tokens)',
		'  ✗ light text:intent-fairway/surface-muted — 4.21:1 (AA Large)',
		'contrast: 1 of 96 pairings fail WCAG AA (warnings; use --strict to fail the build)'
	].join('\n');

	const modesCode = [
		'# A complete sheet — import it INSTEAD of tokens.css:',
		'hyzer generate',
		'',
		'# A patch sheet with only your overrides — import it AFTER tokens.css:',
		'hyzer generate --mode overrides',
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
		'wrote src/styles/tokens.css (full, 84 tokens)',
		'wrote src/styles/icons.ts (16 icons)',
		'contrast: 96 pairings checked — all pass WCAG AA',
		'  ? icons: "serch" is not a valid Lucide icon name — omitted from the barrel',
		'icons: 1 unknown name(s) (warnings; use --strict to fail the build)',
		'icons: 16 included (14 core, 2 configured)'
	].join('\n');
</script>

<svelte:head>
	<title>Tokens & Overrides — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<div class="doc-intro">
		<h1>Tokens &amp; Overrides</h1>
		<p class="doc-description">
			Two layers, one rule. Layer 1 is the palette (<code>--hz-palette-*</code>) — single-value
			hues, authored per mode. Layer 2 (semantic roles, <code>--hz-color-*</code>, and intents,
			<code>--hz-intent-*</code>) is pure <code>var()</code> indirection that chains through it.
			Override a hue and everything referencing it follows; remap or extend Layer 2 when you want a
			different wiring. Token names and defaults live on
			<a href="/foundation/colors">Colors &amp; Intent</a>. Duration and easing tokens (<code
				>--hz-duration-*</code
			>
			/ <code>--hz-ease-*</code>) follow the same override rules and are documented on
			<a href="/foundation/motion">Motion</a>
			— the same page introduces
			<code>@hyzer-labs/ui/motion</code>, script-side helpers (transitions, a scroll-reveal
			attachment, a view-transition wrapper) built on those tokens.
		</p>
		<p class="doctrine-note">
			Dark mode may override any tier in <code>[data-theme='dark']</code>, including the palette —
			your components and the reference theme never read <code>--hz-palette-*</code> directly, so they
			keep resolving through roles and intents either way.
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
			pairings as this library's own CI gate, covering your custom intents too:
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
			The same config extends to <a href="/foundation/icons">icons</a>: an optional
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
		aria-labelledby="verify-heading"
	>
		<h2 id="verify-heading">Verify your palette</h2>
		<p>
			The contrast math is public API — assert your pairings in a unit test exactly as this library
			does, or read the full methodology and the live pairing checker on
			<a href="/foundation/contrast#api-heading">Contrast &amp; Accessibility</a>.
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

	.doctrine-note {
		margin: 0;
		padding: 0.75rem 1rem;
		border-inline-start: 3px solid var(--hz-color-border, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
