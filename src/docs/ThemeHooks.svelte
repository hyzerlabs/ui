<script lang="ts">
	/**
	 * A component's styling contract, rendered in the props table's format
	 * (spec 31 R9) — same table look, different subject: what you can style
	 * rather than what you can pass.
	 */
	import type { ComponentHooks } from './hooks';

	interface Props {
		hooks: ComponentHooks;
	}

	let { hooks }: Props = $props();

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

{#each blocks as block (block.key)}
	<h3 class="hooks-heading">{block.title}</h3>
	<div class="hooks-table-wrapper">
		<table class="hooks-table">
			<thead>
				<tr>
					<th scope="col">Hook</th>
					<th scope="col">Values</th>
					<th scope="col">Styles</th>
				</tr>
			</thead>
			<tbody>
				{#each block.rows as row (row.name)}
					<tr>
						<td><code>{row.name}</code></td>
						<td><code class="values">{row.values}</code></td>
						<td class="note">{row.note}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/each}

<style>
	.hooks-root {
		margin: 0 0 1rem;
	}

	.hooks-heading {
		margin: 1.5rem 0 0.75rem;
		font-size: var(--hz-font-size-base, 1rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.hooks-table-wrapper {
		overflow-x: auto;
		max-width: 100%;
	}

	.hooks-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.hooks-table th,
	.hooks-table td {
		text-align: left;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
		vertical-align: top;
	}

	.hooks-table th {
		font-weight: var(--hz-font-weight-semibold, 600);
		white-space: nowrap;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	code.values {
		color: var(--hz-color-primary, #2563eb);
	}

	.note {
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text, inherit);
	}
</style>
