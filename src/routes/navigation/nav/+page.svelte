<script lang="ts">
	import { Button, Container, Nav, Tabs } from '$lib';
	import type { NavItem } from '$lib/types';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import ResizableDemo from '../../../docs/ResizableDemo.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{
			name: 'items',
			type: 'NavItem[]',
			default: '—',
			note: 'Required. See NavItem below.'
		},
		{
			name: 'sticky',
			type: 'boolean',
			default: 'false',
			note: 'position: sticky at the top of the nearest scroll container.'
		},
		{ name: 'variant', type: "'default' | 'transparent' | 'bordered'", default: "'default'" },
		{
			name: 'orientation',
			type: "'horizontal' | 'vertical'",
			default: "'horizontal'",
			note: 'vertical renders a sidebar column — submenus become inline, multi-open disclosure sections. Collapse below the breakpoint still applies.'
		},
		{
			name: 'mobileBreakpoint',
			type: "'sm' | 'md' | 'lg' | 'none'",
			default: "'md'",
			note: 'Collapse threshold (640/968/1200px). Horizontal bars measure their own width (container query); vertical sidebars measure the viewport — their own width is always narrow. none never collapses (for shells that own their responsive behavior).'
		},
		{ name: 'ariaLabel', type: 'string', default: "'Main navigation'" },
		{ name: 'logo', type: 'Snippet', default: '—' },
		{
			name: 'actions',
			type: 'Snippet',
			default: '—',
			note: 'Rendered in the bar and inside the mobile menu.'
		},
		{ name: 'menuIcon', type: 'Snippet', default: '—', note: 'Replaces the hamburger icon.' },
		{ name: 'chevronIcon', type: 'Snippet', default: '—', note: 'Replaces the dropdown chevron.' },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-nav class.' }
	];

	const navItemType: PropRow[] = [
		{ name: 'label', type: 'string', default: '—', note: 'Required.' },
		{
			name: 'href',
			type: 'string',
			default: '—',
			note: 'Omit (with children present) for a trigger-only dropdown parent.'
		},
		{
			name: 'children',
			type: 'NavItem[]',
			default: '—',
			note: 'Makes the item a dropdown (horizontal) / disclosure section (vertical & mobile).'
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

	// Demo links are '#' so readers can't accidentally navigate away from the
	// docs (the code panes show realistic routes — href values don't render).
	const barItems: NavItem[] = [
		{ label: 'Home', href: '#' },
		{ label: 'Components', href: '#' },
		{ label: 'Foundation', href: '#' }
	];

	// Full spread for the dropdown/mobile demos.
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

	// Docs-style sections for the vertical (sidebar) demo.
	const sidebarItems: NavItem[] = [
		{ label: 'Getting started', href: '#' },
		{
			label: 'Foundation',
			children: [
				{ label: 'Colors', href: '#' },
				{ label: 'Typography', href: '#' },
				{ label: 'Spacing', href: '#' }
			]
		},
		{
			label: 'Components',
			children: [
				{ label: 'Button', href: '#' },
				{ label: 'Card', href: '#' },
				{ label: 'Modal', href: '#' }
			]
		}
	];

	const variants = ['default', 'transparent', 'bordered'] as const;

	const smallItemsCode = [
		'const items: NavItem[] = [',
		"\t{ label: 'Home', href: '/' },",
		"\t{ label: 'Components', href: '/components' },",
		"\t{ label: 'Foundation', href: '/foundation' }",
		'];'
	].join('\n');

	// mobileBreakpoint="sm" keeps the bar expanded in this docs column — the
	// bar collapses on its own width, and the column is narrower than md.
	function variantCode(variant: string): string {
		return [
			smallItemsCode,
			'',
			variant === 'default'
				? '<Nav {items} mobileBreakpoint="sm" />'
				: `<Nav {items} variant="${variant}" mobileBreakpoint="sm" />`
		].join('\n');
	}

	const dropdownCode = [
		'const items: NavItem[] = [',
		"\t{ label: 'Home', href: '/' },",
		'\t{',
		"\t\tlabel: 'Components',",
		"\t\thref: '/components', // navigable link + separate chevron trigger",
		"\t\tchildren: [{ label: 'Button', href: '/components/button' } /* … */]",
		'\t},',
		'\t{',
		"\t\tlabel: 'Resources', // no href — the whole label is the trigger",
		"\t\tchildren: [{ label: 'GitHub', href: 'https://…', external: true } /* … */]",
		'\t},',
		"\t{ label: 'Media', href: '/media' }",
		'];',
		'',
		'<Nav {items} mobileBreakpoint="sm" />'
	].join('\n');

	const verticalCode = [
		'const items: NavItem[] = [',
		"\t{ label: 'Getting started', href: '/' },",
		"\t{ label: 'Foundation', children: [/* … */] },",
		"\t{ label: 'Components', children: [/* … */] }",
		'];',
		'',
		'<Nav {items} orientation="vertical" ariaLabel="Docs navigation" />'
	].join('\n');

	const slotsCode = [
		'<Nav {items} mobileBreakpoint="sm">',
		'\t{#snippet logo()}',
		'\t\t<a href="/">Hyzer Labs</a>',
		'\t{/snippet}',
		'\t{#snippet actions()}',
		'\t\t<Button size="sm">Sign in</Button>',
		'\t{/snippet}',
		'</Nav>'
	].join('\n');

	const mobileCode = [
		'<!-- Horizontal bars collapse below 968px (md) of their own width -->',
		'<Nav {items} />'
	].join('\n');

	const demoTabs = [
		{ id: 'variants', label: 'Variants' },
		{ id: 'dropdowns', label: 'Dropdowns' },
		{ id: 'vertical', label: 'Vertical' },
		{ id: 'slots', label: 'Logo & actions' },
		{ id: 'mobile', label: 'Mobile' }
	];
</script>

<DocPage
	name="Nav"
	description="Primary navigation with responsive collapse, dropdown menus, a vertical sidebar mode, and accessible keyboard navigation."
	importLine={'import {Nav} from "@hyzer-labs/ui"'}
	{props}
	types={[{ name: 'NavItem', props: navItemType }]}
	a11yNote="Nav renders a `<nav>` landmark with an accessible name via `ariaLabel`. Horizontal dropdown triggers expose `aria-expanded`/`aria-controls` and support Enter, Space, ArrowDown (opens and focuses the menu), and Escape; open menus rove with ArrowUp/ArrowDown/Home/End. Vertical submenus are plain disclosure sections, not menus. The mobile menu is a focus-trapped region that closes on Esc and returns focus to the toggle."
>
	<Tabs items={demoTabs} ariaLabel="Nav demos" defaultTab="variants">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'variants'}
					<p class="tab-note">
						Demos sit on a tinted backdrop so the surface treatments read: <code>default</code>
						paints the surface color, <code>transparent</code> lets the backdrop through,
						<code>bordered</code> adds the bottom hairline.
					</p>
					<Tabs
						items={variants.map((v) => ({ id: v, label: v }))}
						ariaLabel="Nav variant"
						defaultTab="default"
					>
						{#snippet panel(vItem)}
							<div class="inner-tab">
								<Example code={variantCode(vItem.id)}>
									<div class="nav-demo-wrap">
										<Nav
											items={barItems}
											variant={vItem.id as (typeof variants)[number]}
											mobileBreakpoint="sm"
											ariaLabel="Demo navigation ({vItem.id})"
										/>
									</div>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'dropdowns'}
					<p class="tab-note">
						An item with <code>children</code> becomes a dropdown, in one of two forms: with an
						<code>href</code> the label stays a navigable link and a separate chevron button opens
						the menu (so click-to-navigate and open-the-menu never fight); without one, the whole
						label is the trigger. Try it with a keyboard — Enter/Space toggle, ArrowDown opens and
						focuses the menu.
					</p>
					<Example code={dropdownCode}>
						<div class="nav-demo-wrap">
							<Nav
								items={demoItems}
								mobileBreakpoint="sm"
								ariaLabel="Demo navigation (dropdowns)"
							/>
						</div>
					</Example>
				{:else if item.id === 'vertical'}
					<p class="tab-note">
						<code>orientation="vertical"</code> renders a sidebar column: submenus become inline
						disclosure sections that collapse independently — open several at once. Below the
						breakpoint (viewport-based for sidebars) it still collapses to the hamburger.
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
				{:else if item.id === 'slots'}
					<Example code={slotsCode}>
						<div class="nav-demo-wrap">
							<Nav items={barItems} mobileBreakpoint="sm" ariaLabel="Demo navigation (slots)">
								{#snippet logo()}
									<!-- svelte-ignore a11y_invalid_attribute — deliberate # so demos don't navigate -->
									<a href="#" class="demo-logo">Hyzer Labs</a>
								{/snippet}
								{#snippet actions()}
									<Button size="sm">Sign in</Button>
								{/snippet}
							</Nav>
						</div>
					</Example>
				{:else}
					<p class="tab-note">
						Horizontal collapse is a container query against the nav's own width — drag the slider
						under 968px and the bar hands over to the hamburger; the open menu traps focus and
						closes on Esc.
					</p>
					<Container breakout padding="none">
						<Example code={mobileCode}>
							<ResizableDemo
								initial={600}
								describe={(w) => (w >= 968 ? 'full bar' : 'collapsed — try the hamburger')}
							>
								<div class="nav-demo-wrap">
									<Nav items={demoItems} ariaLabel="Demo navigation (mobile)">
										{#snippet logo()}
											<!-- svelte-ignore a11y_invalid_attribute — deliberate # so demos don't navigate -->
											<a href="#" class="demo-logo">Hyzer Labs</a>
										{/snippet}
										{#snippet actions()}
											<Button size="sm">Sign in</Button>
										{/snippet}
									</Nav>
								</div>
							</ResizableDemo>
						</Example>
					</Container>
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
	.tab-note {
		margin: 0 0 1rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
	.tab-note code {
		font-family: var(--hz-font-family-mono, monospace);
	}

	/* Open dropdowns must escape the example frame instead of clipping. */
	.tab-content :global(.doc-example) {
		overflow: visible;
	}
	.tab-content :global(.doc-example > .code-block) {
		border-radius: 0 0 var(--hz-radius-md, 0.5rem) var(--hz-radius-md, 0.5rem);
	}

	/* Tinted backdrop (no border — it muddied the nav's own edges): shows
	 * the difference between surface, transparent, and bordered variants. */
	.nav-demo-wrap {
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--hz-color-primary, #2563eb) 14%, transparent),
			color-mix(in srgb, var(--hz-color-secondary, #7c3aed) 14%, transparent)
		);
		border-radius: var(--hz-radius-md, 0.5rem);
	}

	.sidebar-demo {
		max-width: 18rem;
	}

	.demo-logo {
		font-weight: var(--hz-font-weight-bold, 700);
		text-decoration: none;
		color: inherit;
	}
</style>
