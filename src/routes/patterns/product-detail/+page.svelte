<script lang="ts">
	import { Stack, Container } from '$lib';
	import ProductDetail from '../../../docs/samples/ProductDetail.svelte';
	// ?raw keeps the listing in lockstep with the component that renders above it.
	import detailSource from '../../../docs/samples/ProductDetail.svelte?raw';
	import CodeBlock from '../../../docs/CodeBlock.svelte';
	import { consumerSource } from '../../../docs/consumerSource';

	const composed = [
		{ label: 'Breadcrumbs', href: '/components/breadcrumbs' },
		{ label: 'Split', href: '/components/split' },
		{ label: 'Carousel', href: '/components/carousel' },
		{ label: 'Image', href: '/components/image' },
		{ label: 'lightboxGroup', href: '/components/lightbox' },
		{ label: 'Badge', href: '/components/badge' },
		{ label: 'RadioGroup', href: '/components/radio-group' },
		{ label: 'Select', href: '/components/select' },
		{ label: 'Alert', href: '/components/alert' },
		{ label: 'Accordion', href: '/components/accordion' },
		{ label: 'Divider', href: '/components/divider' }
	];
</script>

<svelte:head>
	<title>Product detail — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>Product detail</h1>
		<p class="lead">
			A single product's page with a live buy panel: the plastic RadioGroup drives the derived
			price, the Carousel pages through colorways, and "Add to cart" raises a dismissible success
			Alert that reads back the selected options. The active slide is a <code>lightboxGroup</code>
			trigger — click it (or Tab to it and press Enter/Space) to open a full-size viewer that pages across
			every colorway. Below the fold, an Accordion holds the long-form content.
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
			<ProductDetail />
		</div>
	</Container>

	<section aria-labelledby="source-heading">
		<h2 id="source-heading">Source</h2>
		<p>
			The whole page, verbatim. Every import is a public export — copy it into an app with the theme
			installed and it renders the same.
		</p>
		<CodeBlock code={consumerSource(detailSource)} />
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
