<script lang="ts">
	import { Stack, Container } from '$lib';
	import Homepage from '../../../docs/samples/Homepage.svelte';
	// ?raw keeps the listing in lockstep with the component that renders above
	// it — the sample is never hand-copied into a string.
	import homepageSource from '../../../docs/samples/Homepage.svelte?raw';
	import CodeBlock from '../../../docs/CodeBlock.svelte';
	import { consumerSource } from '../../../docs/consumerSource';

	const composed = [
		{ label: 'Header', href: '/components/header' },
		{ label: 'Hero', href: '/components/hero' },
		{ label: 'Container', href: '/components/container' },
		{ label: 'Grid', href: '/components/grid' },
		{ label: 'Stack', href: '/components/stack' },
		{ label: 'Cluster', href: '/components/cluster' },
		{ label: 'Card', href: '/components/card' },
		{ label: 'Badge', href: '/components/badge' },
		{ label: 'Button', href: '/components/button' },
		{ label: 'Footer', href: '/components/footer' }
	];
</script>

<svelte:head>
	<title>Homepage — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>Homepage</h1>
		<p class="lead">
			A marketing-style landing page built only from library components — no bespoke layout code, no
			custom CSS beyond a few type sizes. It's here to show what the parts look like once they're
			assembled into something whole.
		</p>
		<p class="composed">
			Composes
			{#each composed as c, i (c.href)}{#if i > 0}{i === composed.length - 1
						? ', and '
						: ', '}{/if}<a href={c.href}>{c.label}</a>{/each}.
		</p>
	</div>

	<!-- The sample bleeds across the full main column while the sidebar stays
	     put. .docs-main sets --hz-breakout-shift: 0, so it grows rightward from
	     the prose column rather than centering. -->
	<Container breakout padding="none">
		<div class="sample-frame">
			<Homepage />
		</div>
	</Container>

	<section aria-labelledby="source-heading">
		<h2 id="source-heading">Source</h2>
		<p>
			The whole page, verbatim. Every import is a public export — copy it into an app with the theme
			installed and it renders the same.
		</p>
		<CodeBlock code={consumerSource(homepageSource)} />
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
