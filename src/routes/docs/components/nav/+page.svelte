<script lang="ts">
	import { Nav, Tabs } from '$lib';
	import { IconArrowDown } from '$lib/icons';
	import type { NavItem } from '$lib/types';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { navDoc } from '../../../../docs/data/nav.js';
	import Example from '../../../../docs/Example.svelte';

	// Demo links are '#' so readers can't navigate away from the docs.
	// No 'Home' item — in a top bar, the logo is the link home.
	const demoItems: NavItem[] = [
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
		{ id: 'vertical', label: 'Vertical' },
		{ id: 'icon', label: 'Custom icon' }
	];

	const dropdownCode = [
		'<Nav',
		'\titems={[',
		"\t\t{ label: 'Docs', href: '/docs' },",
		"\t\t{ label: 'Components', href: '/components', children: [",
		"\t\t\t{ label: 'Button', href: '/docs/components/button' }",
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

	const iconCode = [
		'<Nav items={sidebarItems} orientation="vertical" ariaLabel="Docs navigation">',
		'\t{#snippet chevronIcon()}',
		'\t\t<IconArrowDown size={14} strokeWidth={1.5} />',
		'\t{/snippet}',
		'</Nav>'
	].join('\n');
</script>

<DocPage name="Nav" {...navDoc}>
	<Tabs items={demoTabs} ariaLabel="Nav demos" defaultTab="dropdowns">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'dropdowns'}
					<p class="tab-note">
						An item with <code>children</code> becomes a dropdown. With an <code>href</code> the
						label stays a navigable link and a separate chevron opens the menu; without one, the
						whole label is the trigger. Keyboard: Enter/Space toggle, ArrowDown opens and focuses
						the menu, Escape closes. <a href="/docs/components/header">Header</a> composes this Nav
						for you: hand it the same <code>items</code> for a full top bar with branding, actions, and
						a mobile drawer built in.
					</p>
					<Example code={dropdownCode}>
						<div class="nav-demo-wrap">
							<Nav items={demoItems} ariaLabel="Demo navigation (dropdowns)" />
						</div>
					</Example>
				{:else if item.id === 'vertical'}
					<p class="tab-note">
						<code>orientation="vertical"</code> renders a sidebar column. Submenus become inline disclosure
						sections that nest and collapse independently, so you can have several open at once. The docs
						sidebar you are reading is this Nav.
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
				{:else}
					<p class="tab-note">
						The <code>chevronIcon</code> snippet replaces the default chevron on every submenu
						trigger, in both orientations. Any of the shared
						<a href="/docs/components/icons">icons</a>
						works — size and stroke are the icon's own props — as does any inline SVG. The theme rotates
						the icon 180° while a section is open, so pick one that reads both ways, like an arrow.
					</p>
					<Example code={iconCode}>
						<div class="nav-demo-wrap sidebar-demo">
							<Nav
								items={sidebarItems}
								orientation="vertical"
								ariaLabel="Demo sidebar navigation (custom icon)"
							>
								{#snippet chevronIcon()}
									<IconArrowDown size={14} strokeWidth={1.5} />
								{/snippet}
							</Nav>
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
