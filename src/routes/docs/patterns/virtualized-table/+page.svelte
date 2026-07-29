<script lang="ts">
	import { Stack, Container, Alert, CodeBlock } from '$lib';
	import VirtualizedTable from '../../../../docs/samples/VirtualizedTable.svelte';
	// ?raw keeps the listing in lockstep with the component that renders above it.
	import virtualizedTableSource from '../../../../docs/samples/VirtualizedTable.svelte?raw';
	import { consumerSource } from '../../../../docs/consumerSource';
	import DocIntro from '../../../../docs/DocIntro.svelte';

	const composed = [{ label: 'Virtualizer', href: '/docs/components/virtualizer' }];
</script>

<svelte:head>
	<title>Virtualized table — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro>
		{#snippet lead()}
			A 6,000-row dataset windowed by <a href="/docs/components/virtualizer">Virtualizer</a>,
			dressed as an ARIA table.
		{/snippet}
	</DocIntro>

	<div class="doc-intro">
		<p class="composed">
			Composes
			{#each composed as c, i (c.href)}{#if i > 0},
				{/if}<a href={c.href}>{c.label}</a>{/each}
			(plus the design tokens).
		</p>
	</div>

	<!-- Both alerts as one tight callout cluster — gap="near" on a
	     density-shifted Stack reads them as a single grouped recommendation
	     instead of two sections at normal page rhythm (same mechanism as
	     /patterns/virtualized-combobox). -->
	<Stack gap="near" data-density-shift>
		<Alert intent="warning" title="Reach for this only when the whole list needs to scroll at once">
			Most apps don't need to virtualize the full dataset. <a href="/docs/components/pagination"
				>Pagination</a
			> — the library ships it — server-side paging, or filtering down the set usually eases rendering
			and is the simpler, often more accessible design. Reach for virtualization when the product genuinely
			requires the whole list scrollable in one view, not paged.
		</Alert>

		<Alert intent="info" title="Pick per dataset size, not by default">
			Real <code>&lt;table&gt;</code> semantics (the <a href="/docs/components/table">Table</a>
			component) give you native screen-reader table navigation for free and no ARIA to keep in sync —
			reach for it up to some thousands of rows. Only past that point, where rendering every
			<code>&lt;tr&gt;</code> becomes the bottleneck, does the windowed ARIA table below earn its keep.
		</Alert>
	</Stack>

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
				<VirtualizedTable />
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
			The whole pattern, verbatim. Every import is a public export — copy it into an app with the
			theme installed and it renders the same.
		</p>
		<CodeBlock code={consumerSource(virtualizedTableSource)} collapsible />
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
