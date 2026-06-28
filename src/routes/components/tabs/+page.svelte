<script lang="ts">
	import { Tabs } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{
			name: 'items',
			type: 'TabItem[]',
			default: '—',
			description: 'Required. Each item: { id, label, disabled? }.'
		},
		{
			name: 'ariaLabel',
			type: 'string',
			default: '—',
			description: 'Required. Labels the tablist.'
		},
		{
			name: 'defaultTab',
			type: 'string',
			default: '—',
			description: 'ID of initially active tab.'
		},
		{ name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'" },
		{ name: 'activation', type: "'auto' | 'manual'", default: "'auto'" },
		{
			name: 'panel',
			type: 'Snippet<[TabItem]>',
			default: '—',
			description: 'Required. Renders each panel.'
		},
		{ name: 'onChange', type: '(activeId: string) => void', default: '—' }
	];

	const basicTabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'api', label: 'API' },
		{ id: 'examples', label: 'Examples' },
		{ id: 'disabled', label: 'Disabled', disabled: true }
	];

	const verticalTabs = [
		{ id: 'v1', label: 'Tab 1' },
		{ id: 'v2', label: 'Tab 2' },
		{ id: 'v3', label: 'Tab 3' }
	];

	const demoTabs = [
		{ id: 'horizontal', label: 'Horizontal (default)' },
		{ id: 'vertical', label: 'Vertical' },
		{ id: 'manual', label: 'Manual activation' }
	];
</script>

<DocPage
	name="Tabs"
	description="A fully accessible tabbed interface with roving focus, automatic or manual activation, and horizontal or vertical orientation."
	importLine={'import {Tabs} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Implements the ARIA tabs pattern: role='tablist', role='tab', role='tabpanel'. Roving tabindex: only the active tab is in the tab order. Arrow keys navigate between tabs; Enter/Space activates in manual mode."
>
	<Tabs items={demoTabs} ariaLabel="Tabs component demos" defaultTab="horizontal">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'horizontal'}
					<Tabs items={basicTabs} ariaLabel="Horizontal example" defaultTab="overview">
						{#snippet panel(t)}
							<div class="panel-body">
								<p>Panel content for <strong>{t.label}</strong> tab.</p>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'vertical'}
					<Tabs items={verticalTabs} orientation="vertical" ariaLabel="Vertical example">
						{#snippet panel(t)}
							<div class="panel-body">
								<p>Content for {t.label}.</p>
							</div>
						{/snippet}
					</Tabs>
				{:else}
					<Tabs items={basicTabs} activation="manual" ariaLabel="Manual activation example">
						{#snippet panel(t)}
							<div class="panel-body">
								<p>
									Manual: focus with arrows, activate with Enter/Space. Active: <strong
										>{t.label}</strong
									>.
								</p>
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
	.panel-body {
		padding: 1rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-top: none;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
	.panel-body p {
		margin: 0;
	}
</style>
