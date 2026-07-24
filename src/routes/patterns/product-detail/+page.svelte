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

<Stack gap="away">
	<div class="doc-intro">
		<h1>Product detail</h1>
		<p class="doc-description">A single product's page with a live buy panel.</p>
		<p class="detail">
			The plastic RadioGroup drives the derived price, and "Add to cart" raises a dismissible
			success Alert that reads back the selected options. A vertical thumbnail strip sits beside the
			main Carousel and stays in sync with it in both directions through one bound
			<code>index</code>
			— clicking a thumb pages the carousel to that colorway, and dragging or paging the carousel moves
			the active thumb right back. The active slide is still the one
			<code>lightboxGroup</code>
			trigger — click it (or Tab to it and press Enter/Space) to open a full-size viewer that pages across
			every colorway; the thumbs are plain buttons that move the carousel and never open the viewer themselves.
			Below the fold, an Accordion holds the long-form content.
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
				<ProductDetail />
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
		<CodeBlock code={consumerSource(detailSource)} />
	</Stack>
</Stack>

<style>
	.detail {
		margin: 0 0 0.75rem;
		font-size: var(--hz-font-size-base, 1rem);
		line-height: var(--hz-line-height-base, 1.5);
	}

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
