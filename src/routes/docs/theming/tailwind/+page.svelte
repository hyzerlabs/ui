<script lang="ts">
	import { Stack, Alert, CodeBlock } from '$lib';
	import DocIntro from '../../../../docs/DocIntro.svelte';
	import IconInfo from '$lib/icons/generated/info.svelte';

	// One master layer declaration up front so precedence never depends on
	// import order. `@layer name, name;` statements are allowed before @import,
	// like @charset — so this can sit at the very top of your stylesheet.
	const layerOrderCode = [
		'/* app.css — declare the whole cascade order once, at the top. */',
		'@layer hz-reset, hz-theme, theme, base, components, utilities;',
		'',
		"@import '@hyzer-labs/ui/tokens.css'; /* the --hz-* custom properties */",
		"@import '@hyzer-labs/ui/theme';      /* reference theme, in @layer hz-theme */",
		"@import 'tailwindcss';               /* theme, base, components, utilities */",
		'',
		'/* utilities is last, so a Tailwind utility class overrides the reference',
		'   theme. hz-theme sits before it, and both lose to any UNLAYERED CSS you',
		'   write: your own overrides still win outright. */'
	].join('\n');

	const resetCode = [
		'/* Pick ONE reset. Running both is redundant and they fight. */',
		'',
		'/* Option A: keep the library reset; turn Tailwind Preflight OFF.',
		"   v4: import Tailwind's parts and leave out preflight.",
		'   v3: corePlugins: { preflight: false } in tailwind.config. */',
		"@import '@hyzer-labs/ui/reset.css';",
		'',
		'/* Option B: keep Tailwind Preflight; just do not import the library reset. */',
		'/* (the reference theme never needs it) */'
	].join('\n');

	const classPropCode = [
		'<!-- Every component forwards `class` to its root element, so Tailwind',
		'     utilities compose straight onto the styled component. -->',
		'<Button class="w-full sm:w-auto">Reserve a tee time</Button>',
		'',
		'<Card class="mt-6 shadow-lg">',
		'\tFairways dry, greens rolling fast.',
		'</Card>'
	].join('\n');

	const tokenBridgeCode = [
		'/* The tokens are plain custom properties, so Tailwind can read them',
		'   directly. Map them into @theme (v4) to get generated utilities: */',
		'@theme {',
		'\t--color-brand: var(--hz-intent-primary);',
		'}',
		'',
		'<!-- …or reach a token inline with an arbitrary value, no config: -->',
		'<p class="text-[color:var(--hz-intent-primary)]">On brand</p>'
	].join('\n');
</script>

<svelte:head>
	<title>Using with Tailwind — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro>
		{#snippet lead()}
			The library and Tailwind coexist cleanly: settle on one reset, order the cascade layers so
			Tailwind utilities win when you want them to, and pass utility classes to components through
			their <code>class</code> prop. None of it is Tailwind-specific plumbing: it is the same layer model
			the rest of the theme uses.
		{/snippet}
	</DocIntro>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="reset-heading"
	>
		<h2 id="reset-heading">Pick one reset</h2>
		<p>
			The library ships an optional structural reset and Tailwind ships Preflight. They do the same
			job, so run <strong>one</strong> of them. Importing both is redundant, and their rules overlap.
		</p>
		<CodeBlock code={resetCode} />
		<p>
			Either choice is fine. The reference theme does not depend on the library reset. The reset
			only sets structure (box-sizing, media defaults), with no colors or fonts, so dropping it for
			Preflight changes nothing about how the components look.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="layers-heading"
	>
		<h2 id="layers-heading">Order the layers once</h2>
		<p>
			The reference theme lives in the <code>hz-theme</code> cascade layer. Tailwind puts its
			utilities in a <code>utilities</code> layer. Declare the full order in one statement at the top
			of your stylesheet and precedence stops depending on import order:
		</p>
		<CodeBlock code={layerOrderCode} />
		<Alert intent="info">
			{#snippet icon()}<IconInfo />{/snippet}
			A layered rule always loses to an unlayered one, so a Tailwind utility (layered) overrides the reference
			theme but <strong>not</strong> a bare class or ID you write yourself. Your own unlayered CSS
			stays the final word. See
			<a href="/docs/theming/overview">Theming Overview</a> for the tier model.
		</Alert>
		<p>
			On Tailwind v3 the utilities are emitted unlayered, so they already beat the theme without
			this declaration. Pinning the order is harmless, and it keeps a later Tailwind upgrade from
			shifting the cascade under you.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="class-heading"
	>
		<h2 id="class-heading">Pass utilities through <code>class</code></h2>
		<p>
			Every component forwards its <code>class</code> prop onto the root element, so Tailwind utility
			classes compose with the component's own styling:
		</p>
		<CodeBlock code={classPropCode} />
		<p>
			For structure, reach for the layout components (<a href="/docs/components/stack">Stack</a>,
			<a href="/docs/components/grid">Grid</a>, <a href="/docs/components/cluster">Cluster</a>) or
			the
			<a href="/docs/foundation/utilities">utility sheet</a> where they fit, then use Tailwind utilities
			for the one-off nudges on top.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="tokens-heading"
	>
		<h2 id="tokens-heading">Share the tokens</h2>
		<p>
			The design tokens are ordinary <code>--hz-*</code> custom properties, so Tailwind can read them
			with no bridge. Map them into your Tailwind theme to generate matching utilities, or reference one
			inline with an arbitrary value:
		</p>
		<CodeBlock code={tokenBridgeCode} />
		<p>
			See <a href="/docs/theming/tokens">Tokens &amp; Overrides</a> for the full token surface and how
			to override it.
		</p>
	</Stack>
</Stack>

<style>
	/* Direct children of a .doc-section Stack (gap="away", data-density-shift)
	 * own the rhythm; zero the intrinsic paragraph margins. */
	p {
		margin: 0;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}
</style>
