<script lang="ts">
	/**
	 * A component's styling contract, rendered in the props table's format
	 * (spec 31 R9) — same table look, different subject: what you can style
	 * rather than what you can pass.
	 *
	 * Dogfood (2026-07-22): rendered through the library's own Table; the
	 * docs' flat look survives as the .docs-table override in docs.css.
	 */
	import { Table, Alert } from '$lib';
	import IconTriangleAlert from '$lib/icons/generated/triangle-alert.svelte';
	import type { TableColumn } from '$lib/types';
	import type { ComponentHooks, HookRow } from './hooks';

	interface Props {
		hooks: ComponentHooks;
	}

	let { hooks }: Props = $props();

	const columns: TableColumn<HookRow>[] = [
		{ key: 'name', header: 'Hook' },
		{ key: 'values', header: 'Values' },
		{ key: 'note', header: 'Styles' }
	];

	// Each block renders only if it has rows — a layout primitive may have
	// attrs and no custom properties, and that's a complete contract.
	const blocks = $derived(
		[
			{ key: 'attrs', title: 'Data attributes', rows: hooks.attrs ?? [] },
			{ key: 'props', title: 'Custom properties', rows: hooks.props ?? [] },
			{ key: 'parts', title: 'Part classes', rows: hooks.parts ?? [] }
		].filter((b) => b.rows.length > 0)
	);
</script>

<p class="hooks-root">
	Root class: <code>.{hooks.root}</code>
</p>

{#if hooks.warning}
	<Alert
		intent="warning"
		title="Overriding this needs extra care"
		headingLevel={3}
		class="hooks-warning"
	>
		{#snippet icon()}<IconTriangleAlert />{/snippet}
		<!-- Backtick-split, same convention as DocPage's a11yNote. -->
		{#each hooks.warning.split('`') as segment, i (i)}{#if i % 2 === 1}<code>{segment}</code
				>{:else}{segment}{/if}{/each}
	</Alert>
{/if}

{#each blocks as block (block.key)}
	<h3 class="hooks-heading">{block.title}</h3>
	<Table items={block.rows} {columns} ariaLabel={block.title} class="docs-table">
		{#snippet cell(row, column)}
			{#if column.key === 'name'}
				<code>{row.name}</code>
			{:else if column.key === 'values'}
				<code class="values">{row.values}</code>
			{:else}
				{row.note}
			{/if}
		{/snippet}
	</Table>
{/each}

<style>
	.hooks-root {
		margin: 0 0 1rem;
	}

	:global(.hooks-warning) {
		margin-bottom: 1rem;
	}

	/* A selector/file-path `code` span (e.g. a long unbroken path with no
	   spaces) has no natural wrap point — without this it forces the alert
	   body wider than its column and overflows at narrow widths. */
	:global(.hooks-warning code) {
		overflow-wrap: anywhere;
	}

	.hooks-heading {
		margin: 1.5rem 0 0.75rem;
		font-size: var(--hz-font-size-base, 1rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	code.values {
		color: var(--hz-intent-primary, #2563eb);
	}
</style>
