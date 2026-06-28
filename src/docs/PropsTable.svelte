<script lang="ts">
	export interface PropRow {
		name: string;
		type: string;
		default: string;
		description?: string;
	}

	interface Props {
		props: PropRow[];
	}

	let { props }: Props = $props();
</script>

<div class="props-table-wrapper">
	<table class="props-table">
		<thead>
			<tr>
				<th scope="col">Name</th>
				<th scope="col">Type</th>
				<th scope="col">Default</th>
				{#if props.some((p) => p.description)}
					<th scope="col">Description</th>
				{/if}
			</tr>
		</thead>
		<tbody>
			{#each props as row (row.name)}
				<tr>
					<td><code>{row.name}</code></td>
					<td><code class="type">{row.type}</code></td>
					<td><code>{row.default}</code></td>
					{#if props.some((p) => p.description)}
						<td class="desc">{row.description ?? ''}</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.props-table-wrapper {
		overflow-x: auto;
		max-width: 100%;
	}

	.props-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.props-table th,
	.props-table td {
		text-align: left;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
		vertical-align: top;
	}

	.props-table th {
		font-weight: var(--hz-font-weight-semibold, 600);
		white-space: nowrap;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	code.type {
		color: var(--hz-color-primary, #2563eb);
	}

	.desc {
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text, inherit);
	}
</style>
