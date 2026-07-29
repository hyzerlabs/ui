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
		<h2 id="config-heading">Or describe it once, in a config</h2>
		<p>
			Everything above is hand-written CSS, which is the whole point of this tier: no build step, no
			tooling. If you would rather keep your system in one typed file and have the sheet generated
			for you — with every pairing contrast-graded on each run —
			<a href="/docs/foundation/config">Config &amp; CLI</a> covers
			<code>hyzer.config.ts</code> end to end: the option surface, the
			<code>hyzer generate</code> modes, the trimmed icon barrel and the utilities sheet.
		</p>
		<p>
			The two routes reach the same place. A config resolves to the same two-layer model this page
			describes, so nothing you learn here is wasted if you adopt one later.
		</p>
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
