<script lang="ts">
	import { Stack, Container, Alert } from '$lib';
	import VirtualizedTable from '../../../docs/samples/VirtualizedTable.svelte';
	// ?raw keeps the listing in lockstep with the component that renders above it.
	import virtualizedTableSource from '../../../docs/samples/VirtualizedTable.svelte?raw';
	import CodeBlock from '../../../docs/CodeBlock.svelte';
	import { consumerSource } from '../../../docs/consumerSource';

	const composed = [{ label: 'Virtualizer', href: '/components/virtualizer' }];
</script>

<svelte:head>
	<title>Virtualized table — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>Virtualized table</h1>
		<p class="lead">
			A 6,000-row dataset windowed by <a href="/components/virtualizer">Virtualizer</a>, dressed as
			an ARIA table. Past the point where rendering every row becomes the bottleneck, this pattern
			trades a little semantic richness for a DOM that stays small regardless of dataset size.
		</p>
		<p class="composed">
			Composes
			{#each composed as c, i (c.href)}{#if i > 0},
				{/if}<a href={c.href}>{c.label}</a>{/each}
			(plus the design tokens). Sorting is composed in the sample itself — it coexists with windowing,
			re-sorting the full dataset before the Virtualizer windows whatever order results.
		</p>
	</div>

	<Alert intent="info" title="Pick per dataset size, not by default">
		Real <code>&lt;table&gt;</code> semantics (the <a href="/components/table">Table</a> component)
		give you native screen-reader table navigation for free and no ARIA to keep in sync — reach for
		it up to some thousands of rows. Only past that point, where rendering every
		<code>&lt;tr&gt;</code> becomes the bottleneck, does the windowed ARIA table below earn its keep.
	</Alert>

	<!-- The sample bleeds across the full main column while the sidebar stays
	     put. .docs-main sets --hz-breakout-shift: 0, so it grows rightward from
	     the prose column rather than centering. -->
	<Container breakout padding="none">
		<div class="sample-frame">
			<VirtualizedTable />
		</div>
	</Container>

	<section aria-labelledby="source-heading">
		<h2 id="source-heading">Source</h2>
		<p>
			The whole pattern, verbatim. Every import is a public export — copy it into an app with the
			theme installed and it renders the same.
		</p>
		<CodeBlock code={consumerSource(virtualizedTableSource)} />
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
