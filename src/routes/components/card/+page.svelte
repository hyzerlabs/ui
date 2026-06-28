<script lang="ts">
	import { Card, Tabs, Button } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{
			name: 'variant',
			type: "'elevated' | 'outlined' | 'filled' | 'ghost'",
			default: "'outlined'"
		},
		{ name: 'padding', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'" },
		{ name: 'rounded', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'" },
		{ name: 'href', type: 'string', default: '—', description: 'Makes the whole card clickable.' },
		{ name: 'ariaLabel', type: 'string', default: '—', description: 'Required when href is set.' },
		{ name: 'horizontal', type: 'boolean', default: 'false' },
		{ name: 'mediaPosition', type: "'start' | 'end'", default: "'start'" },
		{ name: 'media', type: 'Snippet', default: '—' },
		{ name: 'children', type: 'Snippet', default: '—' },
		{ name: 'actions', type: 'Snippet', default: '—' }
	];

	const cardVariants = ['elevated', 'outlined', 'filled', 'ghost'] as const;

	const demoTabs = [
		{ id: 'variants', label: 'Variants' },
		{ id: 'actions', label: 'With actions' },
		{ id: 'clickable', label: 'Clickable' },
		{ id: 'horizontal', label: 'Horizontal' }
	];
</script>

<DocPage
	name="Card"
	description="A content container with variant styles, optional media, actions, horizontal layout, and clickable-overlay support."
	importLine={'import {Card} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="When href is set the entire card is wrapped in a link — supply ariaLabel with a descriptive name. Inner interactive elements remain clickable above the overlay via z-index."
>
	<Tabs items={demoTabs} ariaLabel="Card demos" defaultTab="variants">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'variants'}
					<Tabs
						items={cardVariants.map((v) => ({ id: v, label: v }))}
						ariaLabel="Card variant"
						defaultTab="elevated"
					>
						{#snippet panel(vItem)}
							<div class="inner-tab">
								<Card variant={vItem.id}>
									<p class="card-body">{vItem.id} card</p>
								</Card>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'actions'}
					<Card variant="outlined" padding="md">
						<p class="card-body">A card with action buttons in the footer area.</p>
						{#snippet actions()}
							<Button size="sm">Primary</Button>
							<Button size="sm" variant="ghost">Cancel</Button>
						{/snippet}
					</Card>
				{:else if item.id === 'clickable'}
					<Card variant="outlined" href="/components/button" ariaLabel="Navigate to Button docs">
						<p class="card-body">Entire card is a link. Click anywhere.</p>
					</Card>
				{:else}
					<Card variant="outlined" horizontal>
						{#snippet media()}
							<div class="media-placeholder" role="img" aria-label="Media placeholder"></div>
						{/snippet}
						<p class="card-body">Content beside media at ≥640px; stacked below.</p>
					</Card>
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
	.card-body {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
	.media-placeholder {
		width: 100%;
		height: 8rem;
		background: var(--hz-color-gray, #6b7280);
		min-width: 8rem;
	}
</style>
