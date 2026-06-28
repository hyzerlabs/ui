<script lang="ts">
	import { Cluster, Tabs } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'gap', type: "'none' | 'xs' | 'sm' | 'md' | 'lg'", default: "'sm'" },
		{ name: 'justify', type: "'start' | 'center' | 'end' | 'between'", default: "'start'" },
		{ name: 'align', type: "'start' | 'center' | 'end' | 'baseline'", default: "'center'" },
		{ name: 'wrap', type: 'boolean', default: 'true' },
		{ name: 'as', type: 'string', default: "'div'" },
		{ name: 'class', type: 'string', default: '—' }
	];

	const demoTabs = [
		{ id: 'default', label: 'Default' },
		{ id: 'between', label: 'justify=between' },
		{ id: 'center', label: 'justify=center' }
	];
</script>

<DocPage
	name="Cluster"
	description="Lays children out in a horizontal row that wraps to new lines as needed."
	importLine={'import {Cluster} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Cluster is a layout primitive with no ARIA semantics. Reading and focus order follow DOM order."
>
	<Tabs items={demoTabs} ariaLabel="Cluster demos" defaultTab="default">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'default'}
					<Cluster gap="sm">
						{#each ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'] as label (label)}
							<span class="chip">{label}</span>
						{/each}
					</Cluster>
				{:else if item.id === 'between'}
					<Cluster justify="between">
						<span class="chip">Left</span>
						<span class="chip">Right</span>
					</Cluster>
				{:else}
					<Cluster justify="center" gap="md">
						<span class="chip">A</span>
						<span class="chip">B</span>
						<span class="chip">C</span>
					</Cluster>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-content {
		padding-top: 1rem;
	}
	.chip {
		padding: 0.25rem 0.75rem;
		background: color-mix(in srgb, var(--hz-color-primary, #2563eb) 15%, transparent);
		border: 1px solid var(--hz-color-primary, #2563eb);
		border-radius: var(--hz-radius-full, 9999px);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
</style>
