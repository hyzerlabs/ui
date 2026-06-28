<script lang="ts">
	import { Accordion, Tabs } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{
			name: 'items',
			type: 'AccordionItem[]',
			default: '—',
			description: 'Required. Each item: { id, title, disabled? }.'
		},
		{ name: 'type', type: "'single' | 'multiple'", default: "'single'" },
		{ name: 'defaultOpen', type: 'string | string[]', default: '[]' },
		{ name: 'collapsible', type: 'boolean', default: 'true' },
		{ name: 'headingLevel', type: '2 | 3 | 4 | 5 | 6', default: '3' },
		{
			name: 'panel',
			type: 'Snippet<[AccordionItem]>',
			default: '—',
			description: 'Required. Renders each panel.'
		},
		{ name: 'icon', type: 'Snippet', default: '—' },
		{ name: 'onToggle', type: '(openIds: string[]) => void', default: '—' }
	];

	const items = [
		{ id: 'a1', title: 'What is @hyzer-labs/ui?' },
		{ id: 'a2', title: 'Is it accessible?' },
		{ id: 'a3', title: 'Disabled item', disabled: true }
	];

	const multiItems = [
		{ id: 'm1', title: 'First section' },
		{ id: 'm2', title: 'Second section' },
		{ id: 'm3', title: 'Third section' }
	];

	const demoTabs = [
		{ id: 'single', label: 'Single mode' },
		{ id: 'multiple', label: 'Multiple mode' }
	];
</script>

<DocPage
	name="Accordion"
	description="A disclosure component using native <details>/<summary> elements, supporting single and multiple open modes with keyboard navigation."
	importLine={'import {Accordion} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Built on native <details> — no ARIA needed for disclosure semantics. Arrow keys navigate between summaries; Home/End jump to first/last. Disabled items have aria-disabled='true' and block interaction."
>
	<Tabs items={demoTabs} ariaLabel="Accordion mode" defaultTab="single">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'single'}
					<Accordion {items} type="single" headingLevel={4}>
						{#snippet panel(aItem)}
							<div class="panel-content">
								<p>Content for <strong>{aItem.title}</strong>. Only one panel open at a time.</p>
							</div>
						{/snippet}
					</Accordion>
				{:else}
					<Accordion items={multiItems} type="multiple" defaultOpen={['m1']} headingLevel={4}>
						{#snippet panel(aItem)}
							<div class="panel-content">
								<p>Panel content for {aItem.title}. Multiple panels can be open simultaneously.</p>
							</div>
						{/snippet}
					</Accordion>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-content {
		padding-top: 1rem;
	}
	.panel-content {
		padding: 0.75rem 1rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
	.panel-content p {
		margin: 0;
	}
</style>
