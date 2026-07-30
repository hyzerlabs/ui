<script lang="ts">
	import { Stack, Container, CodeBlock } from '$lib';
	import Recipe from '../../../../docs/samples/Recipe.svelte';
	// ?raw keeps the listing in lockstep with the component that renders above it.
	import recipeSource from '../../../../docs/samples/Recipe.svelte?raw';
	import { consumerSource } from '../../../../docs/consumerSource';
	import DocIntro from '../../../../docs/DocIntro.svelte';

	const composed = [
		{ label: 'Hero', href: '/docs/components/hero' },
		{ label: 'Table', href: '/docs/components/table' },
		{ label: 'Split', href: '/docs/components/split' },
		{ label: 'Image', href: '/docs/components/image' },
		{ label: 'Video', href: '/docs/components/video' },
		{ label: 'Badge', href: '/docs/components/badge' },
		{ label: 'Divider', href: '/docs/components/divider' },
		{ label: 'Stack', href: '/docs/components/stack' },
		{ label: 'Cluster', href: '/docs/components/cluster' }
	];
</script>

<svelte:head>
	<title>Recipe — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro>
		{#snippet lead()}
			A recipe page: the main dish photo opens it as a <a href="/docs/components/hero">Hero</a>'s
			<code>split</code> media, ahead of the ingredients and instructions.
		{/snippet}
	</DocIntro>

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
				<Recipe />
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
		<CodeBlock code={consumerSource(recipeSource)} collapsible lineNumbers />
	</Stack>
</Stack>

<style>
	.composed {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	/* Direct child of the Source section Stack (gap="away", data-density-shift).
	 * Margin is zeroed so the Stack's own gap owns the rhythm. */
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
