<script lang="ts">
	import { Stack, Container, CodeBlock } from '$lib';
	import ProductListing from '../../../docs/samples/ProductListing.svelte';
	// ?raw keeps the listing in lockstep with the component that renders above it.
	import listingSource from '../../../docs/samples/ProductListing.svelte?raw';
	import { consumerSource } from '../../../docs/consumerSource';

	const composed = [
		{ label: 'Breadcrumbs', href: '/components/breadcrumbs' },
		{ label: 'Split', href: '/components/split' },
		{ label: 'Grid', href: '/components/grid' },
		{ label: 'Card', href: '/components/card' },
		{ label: 'Image', href: '/components/image' },
		{ label: 'Badge', href: '/components/badge' },
		{ label: 'Select', href: '/components/select' },
		{ label: 'Checkbox', href: '/components/checkbox' },
		{ label: 'RangeSlider', href: '/components/range-slider' },
		{ label: 'Pagination', href: '/components/pagination' }
	];
</script>

<svelte:head>
	<title>Product listing — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<div class="doc-intro">
		<h1>Product listing</h1>
		<p class="doc-description">
			A filterable shop page where the form controls are state sources, not decoration.
		</p>
		<p class="composed">
			Composes
			{#each composed as c, i (c.href)}{#if i > 0}{i === composed.length - 1
						? ', and '
						: ', '}{/if}<a href={c.href}>{c.label}</a>{/each}
			(plus the layout primitives).
		</p>
	</div>

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
				<ProductListing />
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
			The whole page, verbatim. Every import is a public export — copy it into an app with the theme
			installed and it renders the same.
		</p>
		<CodeBlock code={consumerSource(listingSource)} collapsible />
	</Stack>
</Stack>

<style>
	.composed {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	/* Direct child of the Source section Stack (gap="away", data-density-shift) —
	 * margin zeroed so the Stack's own gap owns the rhythm. */
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
