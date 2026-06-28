<script lang="ts">
	import { Split, Tabs } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'fraction', type: "'1/4' | '1/3' | '1/2' | '2/3' | '3/4' | 'auto'", default: "'1/2'" },
		{ name: 'gap', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'" },
		{ name: 'reverse', type: 'boolean', default: 'false' },
		{ name: 'stackBelow', type: "'sm' | 'md' | 'lg'", default: "'md'" },
		{ name: 'as', type: 'string', default: "'div'" },
		{ name: 'class', type: 'string', default: '—' }
	];

	const fractionValues = ['1/4', '1/3', '1/2', '2/3', '3/4'] as const;

	const demoTabs = [
		...fractionValues.map((f) => ({ id: f.replace('/', '-'), label: f })),
		{ id: 'reverse', label: 'reverse' }
	];
</script>

<DocPage
	name="Split"
	description="Two-column layout with configurable proportions that stacks to a single column below a breakpoint."
	importLine={'import {Split} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Split is a layout primitive with no ARIA semantics. DOM order determines reading and focus order regardless of visual arrangement."
>
	<Tabs items={demoTabs} ariaLabel="Split demos" defaultTab="1-2">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'reverse'}
					<Split fraction="1/3" gap="md" reverse>
						<div class="demo-pane demo-pane--a">DOM first (visual right)</div>
						<div class="demo-pane demo-pane--b">DOM second (visual left)</div>
					</Split>
				{:else}
					{@const fraction = item.id.replace('-', '/') as (typeof fractionValues)[number]}
					<Split {fraction} gap="md">
						<div class="demo-pane demo-pane--a">Primary</div>
						<div class="demo-pane demo-pane--b">Secondary</div>
					</Split>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-content {
		padding-top: 1rem;
	}
	.demo-pane {
		padding: 1rem;
		border-radius: var(--hz-radius-sm, 0.25rem);
		font-size: var(--hz-font-size-sm, 0.875rem);
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 4rem;
	}
	.demo-pane--a {
		background: color-mix(in srgb, var(--hz-color-primary, #2563eb) 20%, transparent);
		border: 1px solid var(--hz-color-primary, #2563eb);
	}
	.demo-pane--b {
		background: color-mix(in srgb, var(--hz-color-secondary, #7c3aed) 20%, transparent);
		border: 1px solid var(--hz-color-secondary, #7c3aed);
	}
</style>
