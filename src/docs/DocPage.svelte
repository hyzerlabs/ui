<script lang="ts">
	import type { Snippet } from 'svelte';
	import Stack from '$lib/components/Stack.svelte';
	import PropsTable from './PropsTable.svelte';
	import type { PropRow } from './PropsTable.svelte';

	/** A named supporting type (e.g. AccordionItem) shown as its own table under Props. */
	interface TypeTable {
		name: string;
		props: PropRow[];
	}

	interface Props {
		name: string;
		description: string;
		importLine: string;
		props?: PropRow[];
		/** Supporting item/option types rendered as sub-tables in the Props section. */
		types?: TypeTable[];
		/** Backtick-wrapped segments render as inline <code>, e.g. "sets `aria-busy`". */
		a11yNote?: string;
		children?: Snippet;
	}

	let {
		name,
		description,
		importLine,
		props = [],
		types = [],
		a11yNote,
		children
	}: Props = $props();
</script>

<svelte:head>
	<title>{name} — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="sm">
	<div class="doc-intro">
		<h1>{name}</h1>
		<p class="doc-description">{description}</p>
	</div>

	<section aria-labelledby="import-heading" class="doc-section">
		<h2 id="import-heading">Import</h2>
		<pre><code>{importLine}</code></pre>
	</section>

	<section aria-labelledby="demo-heading" class="doc-section">
		<h2 id="demo-heading">Demo</h2>
		{#if children}
			{@render children()}
		{/if}
	</section>

	{#if props.length > 0}
		<section aria-labelledby="props-heading" class="doc-section">
			<h2 id="props-heading">Props</h2>
			<PropsTable {props} />
			{#each types as t (t.name)}
				<h3 class="type-heading"><code>{t.name}</code></h3>
				<PropsTable props={t.props} />
			{/each}
		</section>
	{/if}

	{#if a11yNote}
		<section aria-labelledby="a11y-heading" class="doc-section">
			<h2 id="a11y-heading">Accessibility</h2>
			<p>
				<!-- Backtick-split: odd segments are inline code. -->
				{#each a11yNote.split('`') as segment, i (i)}{#if i % 2 === 1}<code>{segment}</code
						>{:else}{segment}{/if}{/each}
			</p>
		</section>
	{/if}
</Stack>

<style>
	.doc-intro h1 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-2xl, 2.75rem);
		font-weight: var(--hz-font-weight-bold, 700);
		line-height: var(--hz-line-height-tight, 1.2);
	}

	.doc-description {
		margin: 0;
		font-size: var(--hz-font-size-lg, 1.4rem);
		color: var(--hz-color-text, inherit);
		line-height: var(--hz-line-height-base, 1.5);
	}

	.doc-section h2 {
		margin: 0 0 1rem;
		font-size: var(--hz-font-size-xl, 1.65rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.type-heading {
		margin: 1.5rem 0 0.75rem;
		font-size: var(--hz-font-size-base, 1rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	pre {
		padding: 1rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		overflow-x: auto;
		background: transparent;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
</style>
