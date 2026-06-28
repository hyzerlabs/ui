<script lang="ts">
	import { Link, Cluster, Tabs } from '$lib';
	import { IconExternalLink } from '$lib/icons';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'href', type: 'string', default: '—', description: 'Required.' },
		{ name: 'external', type: 'boolean', default: 'false' },
		{ name: 'variant', type: "'default' | 'subtle' | 'nav'", default: "'default'" },
		{ name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
		{ name: 'ariaCurrent', type: "'page' | 'step' | 'true'", default: '—' },
		{ name: 'ariaLabel', type: 'string', default: '—' },
		{ name: 'children', type: 'Snippet', default: '—' },
		{ name: 'iconStart', type: 'Snippet', default: '—' },
		{ name: 'iconEnd', type: 'Snippet', default: '—' }
	];

	const demoTabs = [
		{ id: 'variants', label: 'Variants' },
		{ id: 'sizes', label: 'Sizes' },
		{ id: 'external', label: 'External' },
		{ id: 'aria-current', label: 'aria-current' }
	];
</script>

<DocPage
	name="Link"
	description="An accessible anchor component with variant styles, external link support, and icon slots."
	importLine={'import {Link} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="External links automatically add target='_blank', rel='noopener noreferrer', and a visually-hidden '(opens in new tab)' string. ariaCurrent sets aria-current on the anchor for nav links."
>
	<Tabs items={demoTabs} ariaLabel="Link demos" defaultTab="variants">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'variants'}
					<Cluster gap="md" align="center">
						<Link href="#">Default</Link>
						<Link href="#" variant="subtle">Subtle</Link>
						<Link href="#" variant="nav">Nav</Link>
					</Cluster>
				{:else if item.id === 'sizes'}
					<Cluster gap="md" align="center">
						<Link href="#" size="sm">Small</Link>
						<Link href="#" size="md">Medium</Link>
						<Link href="#" size="lg">Large</Link>
					</Cluster>
				{:else if item.id === 'external'}
					<Link href="https://github.com/hyzer-labs/ui" external>
						{#snippet iconEnd()}<IconExternalLink size={16} />{/snippet}
						View on GitHub
					</Link>
				{:else}
					<Link href="#" ariaCurrent="page">Current page link</Link>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-content {
		padding-top: 1rem;
	}
</style>
