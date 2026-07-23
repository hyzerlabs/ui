<script lang="ts">
	import { Table } from '$lib';
	import type { TableColumn } from '$lib/types';

	export interface PropRow {
		name: string;
		type: string;
		default: string;
		/** Optional extra context — most props are self-explanatory; use sparingly. */
		note?: string;
	}

	interface Props {
		props: PropRow[];
		/** Accessible name for the table — docs tables have no visible caption. */
		label?: string;
	}

	let { props, label = 'Props' }: Props = $props();

	// Dogfood (2026-07-22): docs tables render through the library's own
	// Table component; the docs' flat look survives as the .docs-table
	// override in docs.css — a live example of the theme-override pattern.
	const hasNotes = $derived(props.some((p) => p.note));
	const columns = $derived.by((): TableColumn<PropRow>[] => {
		const cols: TableColumn<PropRow>[] = [
			{ key: 'name', header: 'Name' },
			{ key: 'type', header: 'Type' },
			{ key: 'default', header: 'Default' }
		];
		if (hasNotes) cols.push({ key: 'note', header: 'Note' });
		return cols;
	});
</script>

<Table items={props} {columns} ariaLabel={label} class="docs-table">
	{#snippet cell(row, column)}
		{#if column.key === 'name'}
			<code>{row.name}</code>
		{:else if column.key === 'type'}
			<code class="type">{row.type}</code>
		{:else if column.key === 'default'}
			<code>{row.default}</code>
		{:else}
			{row.note ?? ''}
		{/if}
	{/snippet}
</Table>

<style>
	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	code.type {
		color: var(--hz-color-primary, #2563eb);
	}
</style>
