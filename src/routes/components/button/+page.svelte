<script lang="ts">
	import { Button, Cluster, Tabs } from '$lib';
	import { IconArrowRight, IconSearch } from '$lib/icons';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'variant', type: "'solid' | 'outline' | 'ghost' | 'link'", default: "'solid'" },
		{ name: 'intent', type: "'primary' | 'secondary' | 'danger'", default: "'primary'" },
		{ name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
		{ name: 'disabled', type: 'boolean', default: 'false' },
		{ name: 'loading', type: 'boolean', default: 'false' },
		{ name: 'loadingLabel', type: 'string', default: "'Loading'" },
		{ name: 'fullWidth', type: 'boolean', default: 'false' },
		{ name: 'href', type: 'string', default: '—', description: 'Renders as <a> when set.' },
		{ name: 'type', type: "'button' | 'submit' | 'reset'", default: "'button'" },
		{
			name: 'ariaLabel',
			type: 'string',
			default: '—',
			description: 'Required for icon-only buttons.'
		},
		{ name: 'children', type: 'Snippet', default: '—' },
		{ name: 'iconStart', type: 'Snippet', default: '—' },
		{ name: 'iconEnd', type: 'Snippet', default: '—' }
	];

	const variants = ['solid', 'outline', 'ghost', 'link'] as const;
	const intents = ['primary', 'secondary', 'danger'] as const;
	const sizes = ['sm', 'md', 'lg'] as const;

	const demoTabs = [
		{ id: 'variants', label: 'Variants' },
		{ id: 'sizes', label: 'Sizes' },
		{ id: 'states', label: 'States' },
		{ id: 'icons', label: 'With icons' },
		{ id: 'full-width', label: 'Full width' },
		{ id: 'as-anchor', label: 'As anchor' }
	];
</script>

<DocPage
	name="Button"
	description="A versatile button component supporting solid, outline, ghost, and link variants with intent colors, sizes, loading, and icon slots."
	importLine={'import {Button} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Use ariaLabel for icon-only buttons (no visible text). The loading state sets aria-busy='true' and renders a screen-reader-only 'Loading' label. Disabled state sets aria-disabled='true'."
>
	<Tabs items={demoTabs} ariaLabel="Button demos" defaultTab="variants">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'variants'}
					<Tabs
						items={variants.map((v) => ({ id: v, label: v }))}
						ariaLabel="Button variant"
						defaultTab="solid"
					>
						{#snippet panel(vItem)}
							<div class="inner-tab">
								<Cluster gap="sm">
									{#each intents as intent (intent)}
										<Button variant={vItem.id as (typeof variants)[number]} {intent}>
											{intent}
											{vItem.id}
										</Button>
									{/each}
								</Cluster>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'sizes'}
					<Tabs
						items={sizes.map((s) => ({ id: s, label: s }))}
						ariaLabel="Button size"
						defaultTab="md"
					>
						{#snippet panel(sItem)}
							<div class="inner-tab">
								<Cluster gap="sm" align="center">
									{#each intents as intent (intent)}
										<Button size={sItem.id as (typeof sizes)[number]} {intent}>{intent}</Button>
									{/each}
								</Cluster>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'states'}
					<Cluster gap="sm" align="center">
						<Button loading>Loading</Button>
						<Button disabled>Disabled</Button>
						<Button loading intent="secondary">Secondary loading</Button>
					</Cluster>
				{:else if item.id === 'icons'}
					<Cluster gap="sm" align="center">
						<Button>
							{#snippet iconEnd()}<IconArrowRight />{/snippet}
							Continue
						</Button>
						<Button variant="outline">
							{#snippet iconStart()}<IconSearch />{/snippet}
							Search
						</Button>
						<Button ariaLabel="Search" variant="ghost">
							{#snippet iconStart()}<IconSearch />{/snippet}
						</Button>
					</Cluster>
				{:else if item.id === 'full-width'}
					<Button fullWidth>Full width button</Button>
				{:else}
					<Button href="/components">Link button (renders as &lt;a&gt;)</Button>
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
</style>
