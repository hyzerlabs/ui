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
						<code>variant</code> sets the bar surface; <code>bordered</code> adds a bottom hairline
						that composes with either. Each demo sits on a tinted backdrop (not part of Header) so
						<code>transparent</code> visibly shows the surface underneath.
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
										<div class="surface-backdrop">
											<Header
												items={demoItems}
												variant={combo.variant}
												bordered={combo.bordered}
												mobileBreakpoint="sm"
												ariaLabel="Demo header ({combo.label})"
											/>
										</div>
									</Example>
								</Container>
							</div>
						{/snippet}
					</Tabs>
				{:else}
					<p class="tab-note">
						Drag under 968px and the bar collapses to the hamburger; <code>actions</code> stays in
						the collapsed bar too, pinned to the end next to the hamburger (override
						<code>margin-inline-start</code> on <code>.hz-header-actions</code> to center it or place
						it elsewhere). Open the drawer to see the vertical Nav + actions repeated below it, focus-trapped
						and Esc-to-close.
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

	/* Tinted, borderless backdrop so variant="transparent" has something to
	 * visibly show through — the same regression class previously fixed on
	 * the Footer and Nav demo pages. */
	.surface-backdrop {
		padding: 1.5rem;
		border-radius: var(--hz-radius-md, 0.5rem);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--hz-intent-primary, #2563eb) 16%, var(--hz-color-surface, #fff)),
			color-mix(in srgb, var(--hz-intent-secondary, #7c3aed) 16%, var(--hz-color-surface, #fff))
		);
	}
</style>
