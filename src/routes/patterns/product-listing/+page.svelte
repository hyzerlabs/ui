<script lang="ts">
	import { Stack, Container } from '$lib';
	import ProductListing from '../../../docs/samples/ProductListing.svelte';
	// ?raw keeps the listing in lockstep with the component that renders above it.
	import listingSource from '../../../docs/samples/ProductListing.svelte?raw';
	import CodeBlock from '../../../docs/CodeBlock.svelte';
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

<Stack gap="xl">
	<div>
		<h1>Product listing</h1>
		<p class="lead">
			A filterable shop page where the form controls are state sources, not decoration: Select,
			Checkbox, and RangeSlider feed one derived list that the card Grid and Pagination render. The
			filters are live — narrow the price range or check a disc type and watch the results and page
			count follow.
		</p>
		<p class="composed">
			Composes
			{#each composed as c, i (c.href)}{#if i > 0}{i === composed.length - 1
						? ', and '
						: ', '}{/if}<a href={c.href}>{c.label}</a>{/each}
			(plus the layout primitives).
		</p>
	</div>

	<!-- The sample bleeds across the full main column while the sidebar stays
	     put. .docs-main sets --hz-breakout-shift: 0, so it grows rightward from
	     the prose column rather than centering. -->
	<Container breakout padding="none">
		<div class="sample-frame">
			<ProductListing />
		</div>
	</Container>

	<section aria-labelledby="source-heading">
		<h2 id="source-heading">Source</h2>
		<p>
			The whole page, verbatim. Every import is a public export — copy it into an app with the theme
			installed and it renders the same.
		</p>
		<CodeBlock code={consumerSource(listingSource)} />
	</section>
</Stack>

<style>
	h1 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-2xl, 2.75rem);
		font-weight: var(--hz-font-weight-bold, 700);
	}

	h2 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-xl, 1.65rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.lead {
		margin: 0 0 0.75rem;
		font-size: var(--hz-font-size-lg, 1.4rem);
		line-height: var(--hz-line-height-base, 1.5);
	}

	.composed {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	section p {
		margin: 0 0 1rem;
	}

	/* A hairline frame so the bleed reads as a distinct artifact rather than
	 * as the docs page suddenly changing shape. */
	.sample-frame {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		overflow: hidden;
	}
</style>
