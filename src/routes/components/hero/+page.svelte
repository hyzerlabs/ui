<script lang="ts">
	import { Hero, Button, Tabs } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'layout', type: "'center' | 'split' | 'overlay'", default: "'center'" },
		{ name: 'height', type: "'auto' | 'screen' | 'half'", default: "'auto'" },
		{ name: 'align', type: "'start' | 'center' | 'end'", default: "'center'" },
		{ name: 'reverseOnMobile', type: 'boolean', default: 'false' },
		{ name: 'headingLevel', type: '1 | 2 | 3 | 4 | 5 | 6', default: '1' },
		{ name: 'ariaLabel', type: 'string', default: '—' },
		{ name: 'eyebrow', type: 'Snippet', default: '—' },
		{ name: 'title', type: 'Snippet', default: '—' },
		{ name: 'subtitle', type: 'Snippet', default: '—' },
		{ name: 'actions', type: 'Snippet', default: '—' },
		{ name: 'media', type: 'Snippet', default: '—' },
		{ name: 'background', type: 'Snippet', default: '—' }
	];

	const demoTabs = [
		{ id: 'center', label: 'Center' },
		{ id: 'split', label: 'Split' }
	];
</script>

<DocPage
	name="Hero"
	description="A section component for page heroes supporting center, split, and overlay layouts with configurable heading levels, alignment, and background."
	importLine={'import {Hero} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Hero renders a <section> with aria-labelledby pointing to the title element, or aria-label when no title snippet is provided. Use headingLevel to keep the page heading hierarchy correct — the docs shell sets the <h1>, so hero titles inside a page should typically be h2."
>
	<Tabs items={demoTabs} ariaLabel="Hero layout" defaultTab="center">
		{#snippet panel(item)}
			<div class="tab-content demo-hero-wrap">
				{#if item.id === 'center'}
					<Hero layout="center" headingLevel={2}>
						{#snippet eyebrow()}<span class="eyebrow">What's new</span>{/snippet}
						{#snippet title()}Headless components for Svelte 5{/snippet}
						{#snippet subtitle()}Ships behavior, structure, and accessibility — not visual opinions.{/snippet}
						{#snippet actions()}
							<Button>Get started</Button>
							<Button variant="outline">Learn more</Button>
						{/snippet}
					</Hero>
				{:else}
					<Hero layout="split" headingLevel={2}>
						{#snippet title()}Split hero with media{/snippet}
						{#snippet subtitle()}Content on the left, media on the right at desktop widths.{/snippet}
						{#snippet actions()}<Button>Action</Button>{/snippet}
						{#snippet media()}
							<div class="media-block" role="img" aria-label="Media placeholder"></div>
						{/snippet}
					</Hero>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-content {
		padding-top: 1rem;
	}
	.demo-hero-wrap {
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 1rem;
	}
	.eyebrow {
		font-size: var(--hz-font-size-sm, 0.875rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--hz-color-primary, #2563eb);
	}
	.media-block {
		width: 100%;
		height: 12rem;
		background: var(--hz-color-gray, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
	}
</style>
