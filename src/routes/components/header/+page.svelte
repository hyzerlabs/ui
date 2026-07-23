<script lang="ts">
	import { Button, Container, Header, Tabs } from '$lib';
	import type { NavItem } from '$lib/types';
	import DocPage from '../../../docs/DocPage.svelte';
	import { headerDoc } from '../../../docs/data/header.js';
	import Example from '../../../docs/Example.svelte';
	import ResizableDemo from '../../../docs/ResizableDemo.svelte';

	const demoItems: NavItem[] = [
		{ label: 'Home', href: '#' },
		{
			label: 'Components',
			href: '#',
			children: [
				{ label: 'Button', href: '#' },
				{ label: 'Card', href: '#' }
			]
		},
		{ label: 'Foundation', href: '#' },
		{ label: 'Media', href: '#' }
	];

	const surfaceCombos = [
		{ id: 'default', label: 'Default', variant: 'default' as const, bordered: false },
		{ id: 'bordered', label: 'Bordered', variant: 'default' as const, bordered: true },
		{
			id: 'transparent',
			label: 'Transparent',
			variant: 'transparent' as const,
			bordered: true
		}
	];

	const demoTabs = [
		{ id: 'bar', label: 'Bar' },
		{ id: 'surface', label: 'Surface' },
		{ id: 'mobile', label: 'Mobile' }
	];

	const barCode = [
		'<Header items={navItems} bordered>',
		'\t{#snippet brand()}<Logo />{/snippet}',
		'\t{#snippet actions()}<Button size="sm">Sign in</Button>{/snippet}',
		'</Header>'
	].join('\n');

	const surfaceCode = (c: (typeof surfaceCombos)[number]) =>
		`<Header items={navItems}${c.variant !== 'default' ? ` variant="${c.variant}"` : ''}${c.bordered ? ' bordered' : ''} />`;

	const mobileCode = [
		'<!-- Below the breakpoint the bar hands over to a hamburger + drawer',
		'     (a container query on the header width). The drawer holds a',
		'     vertical Nav + the actions, and traps focus while open. -->',
		'<Header items={navItems} mobileBreakpoint="md">',
		'\t{#snippet brand()}<Logo />{/snippet}',
		'\t{#snippet actions()}<Button size="sm">Sign in</Button>{/snippet}',
		'</Header>'
	].join('\n');
</script>

<DocPage name="Header" {...headerDoc}>
	<Tabs items={demoTabs} ariaLabel="Header demos" defaultTab="bar">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'bar'}
					<p class="tab-note">
						Pass <code>items</code> plus <code>brand</code> and <code>actions</code> snippets —
						Header composes a <a href="/components/nav">Nav</a> internally from the same items, horizontal
						in the bar and vertical in the mobile drawer, so there is nothing to wrap.
					</p>
					<Container breakout padding="none">
						<Example code={barCode}>
							<Header items={demoItems} bordered mobileBreakpoint="sm" ariaLabel="Demo header">
								{#snippet brand()}
									<!-- svelte-ignore a11y_invalid_attribute -->
									<a href="#" class="demo-logo">Hyzer Labs</a>
								{/snippet}
								{#snippet actions()}
									<Button size="sm">Sign in</Button>
								{/snippet}
							</Header>
						</Example>
					</Container>
				{:else if item.id === 'surface'}
					<p class="tab-note">
						<code>variant</code> sets the bar surface; <code>bordered</code> adds a bottom hairline that
						composes with either.
					</p>
					<Tabs
						items={surfaceCombos.map((c) => ({ id: c.id, label: c.label }))}
						ariaLabel="Header surface"
						defaultTab="default"
					>
						{#snippet panel(vItem)}
							{@const combo = surfaceCombos.find((c) => c.id === vItem.id)!}
							<div class="inner-tab">
								<Container breakout padding="none">
									<Example code={surfaceCode(combo)}>
										<Header
											items={demoItems}
											variant={combo.variant}
											bordered={combo.bordered}
											mobileBreakpoint="sm"
											ariaLabel="Demo header ({combo.label})"
										/>
									</Example>
								</Container>
							</div>
						{/snippet}
					</Tabs>
				{:else}
					<p class="tab-note">
						Drag under 968px and the bar collapses to the hamburger; open it to see the vertical Nav
						+ actions in the drawer, focus-trapped and Esc-to-close.
					</p>
					<Container breakout padding="none">
						<Example code={mobileCode}>
							<ResizableDemo
								initial={600}
								describe={(w) => (w >= 968 ? 'full bar' : 'collapsed — try the hamburger')}
							>
								<Header items={demoItems} bordered ariaLabel="Demo header (mobile)">
									{#snippet brand()}
										<!-- svelte-ignore a11y_invalid_attribute -->
										<a href="#" class="demo-logo">Hyzer Labs</a>
									{/snippet}
									{#snippet actions()}
										<Button size="sm">Sign in</Button>
									{/snippet}
								</Header>
							</ResizableDemo>
						</Example>
					</Container>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.demo-logo {
		font-weight: var(--hz-font-weight-bold, 700);
		text-decoration: none;
		color: inherit;
	}

	.inner-tab :global(.hz-header) {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
	}
</style>
