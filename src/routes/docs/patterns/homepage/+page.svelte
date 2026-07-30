<script lang="ts">
	import { Stack, Container, CodeBlock } from '$lib';
	import Homepage from '../../../../docs/samples/Homepage.svelte';
	// ?raw keeps the listing in lockstep with the component that renders above
	// it. The sample is never hand-copied into a string.
	import homepageSource from '../../../../docs/samples/Homepage.svelte?raw';
	import { consumerSource } from '../../../../docs/consumerSource';
	import DocIntro from '../../../../docs/DocIntro.svelte';

	const composed = [
		{ label: 'Header', href: '/docs/components/header' },
		{ label: 'Hero', href: '/docs/components/hero' },
		{ label: 'Container', href: '/docs/components/container' },
		{ label: 'Grid', href: '/docs/components/grid' },
		{ label: 'Stack', href: '/docs/components/stack' },
		{ label: 'Cluster', href: '/docs/components/cluster' },
		{ label: 'Card', href: '/docs/components/card' },
		{ label: 'Badge', href: '/docs/components/badge' },
		{ label: 'Button', href: '/docs/components/button' },
		{ label: 'Footer', href: '/docs/components/footer' }
	];
</script>

<svelte:head>
	<title>Homepage — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro />

	<p class="composed">
		Composes
		{#each composed as c, i (c.href)}{#if i > 0}{i === composed.length - 1 ? ', and ' : ', '}{/if}<a
				href={c.href}>{c.label}</a
			>{/each}.
	</p>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="demo-heading"
	>
		<h2 id="demo-heading">Demo</h2>
		<!-- The sample bleeds across the full main column while the sidebar stays
		     put. .docs-main sets --hz-breakout-shift: 0, so it grows rightward from
		     the prose column rather than centering. -->
		<Container breakout padding="none">
			<div class="sample-frame">
				<Homepage />
			</div>
		</Container>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="source-heading"
	>
		<h2 id="source-heading">Source</h2>
		<p class="source-note">
			The whole page, verbatim. Every import is a public export. Copy it into an app with the theme
			installed and it renders the same.
		</p>
		<CodeBlock code={consumerSource(homepageSource)} collapsible lineNumbers />
	</Stack>
</Stack>

<style>
	.composed {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	/* Direct child of the Source section Stack (gap="away", data-density-shift).
	 * Margin is zeroed so the Stack's own gap owns the rhythm, matching
	 * DocPage.svelte's .type-heading/.hooks-intro convention. */
	.source-note {
		margin: 0;
	}

	/* A hairline frame so the bleed reads as a distinct artifact rather than
	 * as the docs page suddenly changing shape. */
	.sample-frame {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		overflow: hidden;
	}
</style>
