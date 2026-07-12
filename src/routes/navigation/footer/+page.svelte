<script lang="ts">
	import { Footer, Tabs } from '$lib';
	import type { FooterColumn } from '$lib/types';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{
			name: 'columns',
			type: 'FooterColumn[]',
			default: '—',
			note: 'Required. Column groups.'
		},
		{ name: 'variant', type: "'default' | 'minimal' | 'bordered'", default: "'default'" },
		{ name: 'linkVariant', type: "'default' | 'subtle' | 'nav'", default: "'subtle'" },
		{ name: 'headingLevel', type: '2 | 3 | 4 | 5 | 6', default: '2' },
		{ name: 'logo', type: 'Snippet', default: '—' },
		{ name: 'social', type: 'Snippet', default: '—' },
		{ name: 'bottom', type: 'Snippet', default: '—' }
	];

	const demoColumns: FooterColumn[] = [
		{
			title: 'Product',
			links: [
				{ label: 'Components', href: '/components' },
				{ label: 'Foundation', href: '/foundation' },
				{ label: 'Layout', href: '/layout' }
			]
		},
		{
			title: 'Resources',
			links: [
				{ label: 'GitHub', href: 'https://github.com/hyzerlabs/ui', external: true },
				{ label: 'Changelog', href: '#' }
			]
		}
	];

	const demoTabs = [
		{ id: 'default', label: 'Default' },
		{ id: 'with-logo', label: 'With logo' }
	];
</script>

<DocPage
	name="Footer"
	description="Site footer with multi-column link groups, optional logo, social links, and a bottom bar."
	importLine={'import {Footer} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Each column is a <nav> landmark labelled by its title heading. Links use the Link component with full keyboard and screen-reader support."
>
	<Tabs items={demoTabs} ariaLabel="Footer demos" defaultTab="default">
		{#snippet panel(item)}
			<div class="tab-content footer-demo-wrap">
				{#if item.id === 'default'}
					<Footer columns={demoColumns} headingLevel={4}>
						{#snippet bottom()}
							<p class="copy">&copy; 2025 Hyzer Labs</p>
						{/snippet}
					</Footer>
				{:else}
					<Footer columns={demoColumns} headingLevel={4}>
						{#snippet logo()}
							<strong>@hyzer-labs/ui</strong>
						{/snippet}
					</Footer>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-content {
		padding-top: 1rem;
	}
	.footer-demo-wrap {
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 1rem;
	}
	.copy {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
</style>
