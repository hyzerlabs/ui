<script lang="ts">
	import { Button, Container, Header, Tabs } from '$lib';
	import type { NavItem } from '$lib/types';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { headerDoc } from '../../../../docs/data/header.js';
	import Example from '../../../../docs/Example.svelte';
	import ResizableDemo from '../../../../docs/ResizableDemo.svelte';

	// No 'Home' item — the logo is the link home.
	const demoItems: NavItem[] = [
		{
			// No href — the whole label is the dropdown trigger.
			label: 'Components',
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
		{ id: 'basic', label: 'Basic' },
		{ id: 'surface', label: 'Surface' },
		{ id: 'mobile', label: 'Mobile' }
	];

	// Shows the navItems data shape (the same demoItems used by the live demo
	// below), not just `items={navItems}` — a label/href per entry, a
	// children sub-menu on one.
	const basicCode = [
		'// No need for a Home item — the logo is the link home.',
		'const navItems: NavItem[] = [',
		'\t{',
		'\t\t// No href — the whole label is the dropdown trigger.',
		"\t\tlabel: 'Components',",
		'\t\tchildren: [',
		"\t\t\t{ label: 'Button', href: '#' },",
		"\t\t\t{ label: 'Card', href: '#' }",
		'\t\t]',
		'\t},',
		"\t{ label: 'Foundation', href: '#' },",
		"\t{ label: 'Media', href: '#' }",
		'];',
		'',
		'<Header items={navItems} bordered>',
		'\t{#snippet logo()}<Logo />{/snippet}',
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
		'\t{#snippet logo()}<Logo />{/snippet}',
		'\t{#snippet actions()}<Button size="sm">Sign in</Button>{/snippet}',
		'</Header>'
	].join('\n');
</script>

<DocPage name="Header" {...headerDoc}>
	<Tabs items={demoTabs} ariaLabel="Header demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<p class="tab-note">
						Pass <code>items</code> plus the <code>logo</code> and <code>actions</code> snippets.
						Header composes a <a href="/docs/components/nav">Nav</a> from those same items: horizontal
						in the bar, vertical in the mobile drawer. There is nothing for you to wrap.
					</p>
					<Container breakout padding="none">
						<Example code={basicCode}>
							<Header items={demoItems} bordered mobileBreakpoint="sm" ariaLabel="Demo header">
								{#snippet logo()}
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
						that composes with either. Each demo sits on a tinted backdrop that is not part of
						Header, so <code>transparent</code> has something to show through.
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
						Drag under 968px and the bar collapses to the hamburger. <code>actions</code> stays in
						the collapsed bar, pinned to the end next to the hamburger; override
						<code>margin-inline-start</code> on <code>.hz-header-actions</code> to move it somewhere else.
						Open the drawer to see the vertical Nav with the actions repeated below it. The drawer traps
						focus, and Escape closes it.
					</p>
					<p class="tab-note">
						<code>mobileBreakpoint</code> takes the named tiers (<code>'sm' | 'md' | 'lg'</code>),
						which are container queries against the header's own width and need no JavaScript. A px
						number measures that same width at runtime instead. Reach for a number once you have
						retuned <code>--hz-width-*</code>: a named tier cannot follow that override, because CSS
						cannot read a custom property inside a container query. Before hydration a number
						renders as its nearest named tier, so a page without JavaScript still collapses at a
						sensible width.
					</p>
					<Container breakout padding="none">
						<Example code={mobileCode}>
							<ResizableDemo
								initial={600}
								describe={(w) => (w >= 968 ? 'full bar' : 'collapsed, try the hamburger')}
							>
								<Header items={demoItems} bordered ariaLabel="Demo header (mobile)">
									{#snippet logo()}
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
