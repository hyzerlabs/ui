<script lang="ts">
	import { Nav, Tabs } from '$lib';
	import type { NavItem } from '$lib/types';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'items', type: 'NavItem[]', default: '—', note: 'Required. See NavItem below.' },
		{
			name: 'orientation',
			type: "'horizontal' | 'vertical'",
			default: "'horizontal'",
			note: 'horizontal: a row of links with dropdown menus. vertical: a sidebar column with inline, nested, multi-open disclosure sections.'
		},
		{ name: 'ariaLabel', type: 'string', default: "'Main navigation'" },
		{ name: 'chevronIcon', type: 'Snippet', default: '—', note: 'Replaces the dropdown chevron.' },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-nav class.' }
	];

	const navItemType: PropRow[] = [
		{ name: 'label', type: 'string', default: '—', note: 'Required.' },
		{
			name: 'href',
			type: 'string',
			default: '—',
			note: 'Omit (with children present) for a trigger-only dropdown / section parent.'
		},
		{
			name: 'children',
			type: 'NavChild[]',
			default: '—',
			note: 'Makes the item a dropdown (horizontal) or a nested disclosure section (vertical). May contain items or { heading } group labels.'
		},
		{ name: 'external', type: 'boolean', default: '—', note: 'Adds the external-link treatment.' },
		{
			name: 'ariaCurrent',
			type: "'page' | 'step' | 'true'",
			default: '—',
			note: 'Set on the active item.'
		},
		{
			name: 'defaultOpen',
			type: 'boolean',
			default: '—',
			note: 'Vertical only: the section starts open, and re-opens when items is rebuilt (e.g. on navigation).'
		}
	];

	// Demo links are '#' so readers can't navigate away from the docs.
	const demoItems: NavItem[] = [
		{ label: 'Home', href: '#' },
		{
			label: 'Components',
			href: '#',
			children: [
				{ label: 'Button', href: '#' },
				{ label: 'Card', href: '#' },
				{ label: 'Modal', href: '#' }
			]
		},
		{
			label: 'Resources',
			children: [
				{ label: 'Icons', href: '#' },
				{ label: 'GitHub', href: 'https://github.com/hyzerlabs/ui', external: true }
			]
		},
		{ label: 'Media', href: '#' }
	];

	const sidebarItems: NavItem[] = [
		{ label: 'Getting started', href: '#' },
		{
			label: 'Foundation',
			defaultOpen: true,
			children: [
				{ label: 'Colors', href: '#' },
				{ label: 'Typography', href: '#' },
				{ label: 'Spacing', href: '#', ariaCurrent: 'page' }
			]
		},
		{
			label: 'Components',
			children: [
				{ heading: 'Common' },
				{ label: 'Alert', href: '#' },
				{ label: 'Badge', href: '#' },
				{ heading: 'Forms' },
				{ label: 'Select', href: '#' }
			]
		}
	];

	const demoTabs = [
		{ id: 'dropdowns', label: 'Dropdowns' },
		{ id: 'vertical', label: 'Vertical' }
	];

	const dropdownCode = [
		'<Nav',
		'\titems={[',
		"\t\t{ label: 'Home', href: '/' },",
		"\t\t{ label: 'Components', href: '/components', children: [",
		"\t\t\t{ label: 'Button', href: '/components/button' }",
		'\t\t] }',
		'\t]}',
		'\tariaLabel="Main navigation"',
		'/>'
	].join('\n');

	const verticalCode = [
		'<Nav items={sidebarItems} orientation="vertical" ariaLabel="Docs navigation" />',
		'',
		'<!-- children can nest, and carry { heading } group labels between links;',
		'     defaultOpen starts a section open. -->'
	].join('\n');
</script>

<DocPage
	name="Nav"
	description="Navigation, pure and simple: a horizontal row of links with dropdown menus, or a vertical sidebar column with nested, multi-open disclosure sections. Wrap it in a Header for a full top bar with branding, actions, and a mobile drawer."
	importLine={'import {Nav} from "@hyzer-labs/ui"'}
	{props}
	types={[{ name: 'NavItem', props: navItemType }]}
	a11yNote="Horizontal dropdowns follow the APG menu-button pattern: the trigger carries `aria-haspopup`/`aria-expanded`, the panel is a `role=menu` with roving arrow-key focus, and `Escape` closes and returns focus to the trigger. Vertical sections are plain disclosure (`aria-expanded` on each `<button>`) — not menus — with native keyboard traversal. A `heading` entry is static, non-focusable text read in sequence before the links it labels."
	a11yLinks={[
		{
			label: 'APG Menu Button pattern',
			href: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/'
		}
	]}
>
	<Tabs items={demoTabs} ariaLabel="Nav demos" defaultTab="dropdowns">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'dropdowns'}
					<p class="tab-note">
						An item with <code>children</code> becomes a dropdown. With an <code>href</code> the label
						stays a navigable link and a separate chevron opens the menu; without one, the whole label
						is the trigger. Keyboard: Enter/Space toggle, ArrowDown opens and focuses the menu, Escape
						closes.
					</p>
					<Example code={dropdownCode}>
						<div class="nav-demo-wrap">
							<Nav items={demoItems} ariaLabel="Demo navigation (dropdowns)" />
						</div>
					</Example>
				{:else}
					<p class="tab-note">
						<code>orientation="vertical"</code> renders a sidebar column: submenus become inline disclosure
						sections that collapse independently and nest — open several at once. This is what the docs
						sidebar you're reading uses.
					</p>
					<Example code={verticalCode}>
						<div class="nav-demo-wrap sidebar-demo">
							<Nav
								items={sidebarItems}
								orientation="vertical"
								ariaLabel="Demo sidebar navigation"
							/>
						</div>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.nav-demo-wrap {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 0.5rem 1rem;
	}

	.sidebar-demo {
		max-width: 16rem;
	}
</style>
