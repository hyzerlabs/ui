<script lang="ts">
	import { Nav, Tabs } from '$lib';
	import type { NavItem } from '$lib/types';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{
			name: 'items',
			type: 'NavItem[]',
			default: '—',
			description: 'Required. Array of nav items.'
		},
		{ name: 'sticky', type: 'boolean', default: 'false' },
		{ name: 'variant', type: "'default' | 'transparent' | 'bordered'", default: "'default'" },
		{ name: 'mobileBreakpoint', type: "'sm' | 'md' | 'lg'", default: "'md'" },
		{ name: 'ariaLabel', type: 'string', default: "'Main navigation'" },
		{ name: 'logo', type: 'Snippet', default: '—' },
		{ name: 'actions', type: 'Snippet', default: '—' }
	];

	const demoItems: NavItem[] = [
		{ label: 'Home', href: '/' },
		{
			label: 'Components',
			href: '/components',
			children: [
				{ label: 'Button', href: '/components/button' },
				{ label: 'Card', href: '/components/card' },
				{ label: 'Modal', href: '/components/modal' }
			]
		},
		{ label: 'Foundation', href: '/foundation' }
	];

	const demoTabs = [
		{ id: 'default', label: 'Default' },
		{ id: 'mobile-sm', label: 'Mobile (sm breakpoint)' }
	];
</script>

<DocPage
	name="Nav"
	description="Primary navigation bar with responsive collapse, dropdown menus, and accessible keyboard navigation."
	importLine={'import {Nav} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Nav renders a <nav> landmark with an accessible name via ariaLabel. Dropdown triggers expose aria-expanded/aria-controls. The mobile menu is a focus-trapped region that closes on Esc and returns focus to the toggle."
>
	<Tabs items={demoTabs} ariaLabel="Nav demos" defaultTab="default">
		{#snippet panel(item)}
			<div class="tab-content nav-demo-wrap">
				{#if item.id === 'default'}
					<Nav items={demoItems} ariaLabel="Demo navigation">
						{#snippet logo()}
							<a href="/" class="demo-logo">Logo</a>
						{/snippet}
						{#snippet actions()}
							<button type="button" class="demo-btn">Action</button>
						{/snippet}
					</Nav>
				{:else}
					<Nav items={demoItems} mobileBreakpoint="sm" ariaLabel="Demo navigation sm">
						{#snippet logo()}
							<span>Logo</span>
						{/snippet}
					</Nav>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-content {
		padding-top: 1rem;
	}
	.nav-demo-wrap {
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 0.75rem;
	}
	.demo-logo {
		font-weight: var(--hz-font-weight-bold, 700);
		text-decoration: none;
		color: inherit;
	}
	.demo-btn {
		padding: 0.375rem 0.75rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		background: transparent;
		cursor: pointer;
		color: inherit;
	}
</style>
