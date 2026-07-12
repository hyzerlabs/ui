<script lang="ts">
	import { Stack, Tabs } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'gap', type: "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'" },
		{ name: 'align', type: "'start' | 'center' | 'end' | 'stretch'", default: "'stretch'" },
		{ name: 'as', type: 'string', default: "'div'" },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-stack class.' }
	];

	const gapValues = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const;
	const alignValues = ['start', 'center', 'end', 'stretch'] as const;

	const demoTabs = [
		{ id: 'gap', label: 'Gap variants' },
		{ id: 'align', label: 'Align variants' }
	];
</script>

<DocPage
	name="Stack"
	description="Lays children out in a vertical column with consistent spacing between items."
	importLine={'import {Stack} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Stack is a layout primitive with no ARIA semantics. The reading and focus order follow the DOM order of children."
>
	<Tabs items={demoTabs} ariaLabel="Stack demos" defaultTab="gap">
		{#snippet panel(item)}
			{#if item.id === 'gap'}
				<div class="tab-content">
					<Tabs
						items={gapValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Gap value"
						defaultTab="md"
					>
						{#snippet panel(gapItem)}
							<Stack gap={gapItem.id as (typeof gapValues)[number]} class="demo-stack">
								<div class="demo-box">Item 1</div>
								<div class="demo-box">Item 2</div>
								<div class="demo-box">Item 3</div>
							</Stack>
						{/snippet}
					</Tabs>
				</div>
			{:else}
				<div class="tab-content">
					<Tabs
						items={alignValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Align value"
						defaultTab="stretch"
					>
						{#snippet panel(alignItem)}
							<Stack align={alignItem.id as (typeof alignValues)[number]} class="demo-stack">
								<div class="demo-box demo-box--narrow">Short</div>
								<div class="demo-box">Medium width item</div>
							</Stack>
						{/snippet}
					</Tabs>
				</div>
			{/if}
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-content {
		padding-top: 1rem;
	}
	:global(.demo-stack) {
		border: 1px dashed var(--hz-color-border, #6b7280);
		padding: 0.5rem;
		border-radius: var(--hz-radius-sm, 0.25rem);
	}
	.demo-box {
		padding: 0.5rem 1rem;
		background: color-mix(in srgb, var(--hz-color-primary, #2563eb) 15%, transparent);
		border: 1px solid var(--hz-color-primary, #2563eb);
		border-radius: var(--hz-radius-sm, 0.25rem);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
	.demo-box--narrow {
		width: max-content;
	}
</style>
