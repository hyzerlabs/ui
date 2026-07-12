<script lang="ts">
	import { Grid, Tabs } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{
			name: 'columns',
			type: 'number | { sm?: number; md?: number; lg?: number }',
			default: '{ sm: 1, md: 2, lg: 3 }'
		},
		{ name: 'gap', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'" },
		{ name: 'align', type: "'start' | 'center' | 'end' | 'stretch'", default: "'stretch'" },
		{ name: 'as', type: 'string', default: "'div'" },
		{ name: 'class', type: 'string', default: '—' }
	];

	const gapValues = ['none', 'sm', 'md', 'lg'] as const;

	const demoTabs = [
		{ id: 'responsive', label: 'Responsive' },
		{ id: 'fixed', label: 'Fixed 4-col' },
		{ id: 'gap', label: 'Gap variants' }
	];
</script>

<DocPage
	name="Grid"
	description="Responsive CSS grid that accepts fixed column counts or per-breakpoint column objects."
	importLine={'import {Grid} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Grid is a layout primitive with no ARIA semantics. Reading and focus order follow DOM order."
>
	<Tabs items={demoTabs} ariaLabel="Grid demos" defaultTab="responsive">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'responsive'}
					<p class="hint"><code>{'{ sm: 1, md: 2, lg: 3 }'}</code></p>
					<Grid columns={{ sm: 1, md: 2, lg: 3 }} gap="sm">
						{#each Array.from({ length: 6 }, (_, k) => k) as i (i)}
							<div class="demo-cell">Cell {i + 1}</div>
						{/each}
					</Grid>
				{:else if item.id === 'fixed'}
					<Grid columns={4} gap="sm">
						{#each Array.from({ length: 8 }, (_, k) => k) as i (i)}
							<div class="demo-cell">Cell {i + 1}</div>
						{/each}
					</Grid>
				{:else}
					<Tabs
						items={gapValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Gap value"
						defaultTab="md"
					>
						{#snippet panel(gapItem)}
							<div class="inner-tab">
								<Grid columns={3} gap={gapItem.id as (typeof gapValues)[number]}>
									{#each Array.from({ length: 3 }, (_, k) => k) as i (i)}
										<div class="demo-cell">Cell {i + 1}</div>
									{/each}
								</Grid>
							</div>
						{/snippet}
					</Tabs>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-content {
		padding-top: 1rem;
	}
	.inner-tab {
		padding-top: 0.5rem;
	}
	.hint {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}
	.demo-cell {
		padding: 1rem;
		background: color-mix(in srgb, var(--hz-color-primary, #2563eb) 15%, transparent);
		border: 1px solid var(--hz-color-primary, #2563eb);
		border-radius: var(--hz-radius-sm, 0.25rem);
		font-size: var(--hz-font-size-sm, 0.875rem);
		text-align: center;
	}
</style>
