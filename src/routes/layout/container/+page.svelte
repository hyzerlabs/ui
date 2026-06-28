<script lang="ts">
	import { Container, Tabs } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'max', type: "'sm' | 'md' | 'lg' | 'xl' | 'full'", default: "'lg'" },
		{ name: 'padding', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'" },
		{ name: 'center', type: 'boolean', default: 'true' },
		{ name: 'as', type: 'string', default: "'div'" },
		{ name: 'class', type: 'string', default: '—' }
	];

	const maxValues = ['sm', 'md', 'lg', 'xl'] as const;
	const paddingValues = ['none', 'sm', 'md', 'lg'] as const;

	const demoTabs = [
		{ id: 'max', label: 'Max width' },
		{ id: 'padding', label: 'Padding' }
	];
</script>

<DocPage
	name="Container"
	description="Centers content horizontally with a configurable max-width and inline padding."
	importLine={'import {Container} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Container is a layout primitive with no ARIA semantics. Supply a meaningful landmark element via the `as` prop (e.g. as='main') when appropriate."
>
	<Tabs items={demoTabs} ariaLabel="Container demos" defaultTab="max">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'max'}
					<Tabs
						items={maxValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Max width value"
						defaultTab="lg"
					>
						{#snippet panel(maxItem)}
							<div class="inner-tab">
								<Container max={maxItem.id} padding="sm" class="demo-container">
									<code>max="{maxItem.id}"</code>
								</Container>
							</div>
						{/snippet}
					</Tabs>
				{:else}
					<Tabs
						items={paddingValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Padding value"
						defaultTab="md"
					>
						{#snippet panel(padItem)}
							<div class="inner-tab">
								<Container max="md" padding={padItem.id} class="demo-container">
									<code>padding="{padItem.id}"</code>
								</Container>
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
	:global(.demo-container) {
		background-color: color-mix(in srgb, var(--hz-color-primary, #2563eb) 15%, transparent);
		border: 1px dashed var(--hz-color-primary, #2563eb);
		border-radius: var(--hz-radius-sm, 0.25rem);
		padding-block: 0.5rem;
	}
	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}
</style>
