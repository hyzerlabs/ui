<script lang="ts">
	import { Container, Footer, Link, Tabs } from '$lib';
	import IconGlobe from '$lib/icons/generated/globe.svelte';
	import IconMail from '$lib/icons/generated/mail.svelte';
	import IconRss from '$lib/icons/generated/rss.svelte';
	import type { FooterColumn } from '$lib/types';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { footerDoc } from '../../../../docs/data/footer.js';
	import Example from '../../../../docs/Example.svelte';
	import ResizableDemo from '../../../../docs/ResizableDemo.svelte';

	// Demo links are '#' so readers can't accidentally navigate away.
	const demoColumns: FooterColumn[] = [
		{
			title: 'Product',
			links: [
				{ label: 'Components', href: '#' },
				{ label: 'Foundation', href: '#' },
				{ label: 'Pricing', href: '#' }
			]
		},
		{
			title: 'Resources',
			links: [
				{ label: 'GitHub', href: 'https://github.com/hyzerlabs/ui', external: true },
				{ label: 'Changelog', href: '#' }
			]
		},
		{
			title: 'Company',
			links: [
				{ label: 'About', href: '#' },
				{ label: 'Contact', href: '#' }
			]
		}
	];

	const surfaceCombos = [
		{ id: 'default', label: 'default', variant: 'default', bordered: false },
		{ id: 'minimal', label: 'minimal', variant: 'minimal', bordered: false },
		{ id: 'bordered', label: 'bordered', variant: 'default', bordered: true },
		{
			id: 'minimal-bordered',
			label: 'minimal + bordered',
			variant: 'minimal',
			bordered: true
		}
	] as const;
	const linkVariants = ['subtle', 'default', 'nav'] as const;

	const columnsCode = [
		'const columns: FooterColumn[] = [',
		'\t{',
		"\t\ttitle: 'Product',",
		"\t\tlinks: [{ label: 'Components', href: '/components' } /* … */]",
		'\t},',
		'\t{',
		"\t\ttitle: 'Resources',",
		"\t\tlinks: [{ label: 'GitHub', href: 'https://github.com/hyzerlabs/ui', external: true } /* … */]",
		'\t},',
		"\t{ title: 'Company', links: [{ label: 'About', href: '/about' } /* … */] }",
		'];'
	].join('\n');

	function comboCode(combo: (typeof surfaceCombos)[number]): string {
		const attrs = [
			combo.variant !== 'default' ? `variant="${combo.variant}"` : null,
			combo.bordered ? 'bordered' : null
		]
			.filter(Boolean)
			.join(' ');
		return [
			columnsCode,
			'',
			`<Footer {columns} headingLevel={3}${attrs ? ` ${attrs}` : ''} />`
		].join('\n');
	}

	function linkVariantCode(lv: string): string {
		return lv === 'subtle'
			? '<Footer {columns} headingLevel={3} />'
			: `<Footer {columns} headingLevel={3} linkVariant="${lv}" />`;
	}

	const slotsCode = [
		'<Footer {columns} headingLevel={3}>',
		'\t{#snippet logo()}<strong>@hyzer-labs/ui</strong>{/snippet}',
		'\t{#snippet social()}',
		'\t\t<Link href="https://hyzer.sh" ariaLabel="Website"><IconGlobe /></Link>',
		'\t\t<Link href="mailto:hello@hyzer.sh" ariaLabel="Email"><IconMail /></Link>',
		'\t\t<Link href="/rss.xml" ariaLabel="RSS feed"><IconRss /></Link>',
		'\t{/snippet}',
		'\t{#snippet bottom()}',
		'\t\t<p>© 2026 Hyzer Labs, MIT License</p>',
		'\t{/snippet}',
		'</Footer>'
	].join('\n');

	const responsiveCode = [
		'<!-- Columns auto-fit the footer’s own width: as many as have at least',
		'     --hz-footer-col-min (12rem, yours to retune) of room -->',
		'<Footer {columns} headingLevel={3} />'
	].join('\n');

	// Expected auto-fit column count for the readout (min 12rem = 192px,
	// Grid's default md gap = 32px, footer inline padding 1.5rem × 2).
	function columnBand(w: number): string {
		const inner = w - 48;
		const n = Math.max(1, Math.min(3, Math.floor((inner + 32) / (192 + 32))));
		return `${n} column${n === 1 ? '' : 's'}`;
	}

	const demoTabs = [
		{ id: 'variants', label: 'Variants' },
		{ id: 'links', label: 'Link variants' },
		{ id: 'slots', label: 'Logo, social & bottom' },
		{ id: 'columns', label: 'Responsive columns' },
		{ id: 'themed-bg', label: 'Themed background' }
	];

	// Themed background demo: Footer has no --hz-footer-bg hook —
	// its only background surface is `.hz-footer`'s own background-color
	// declaration. Theming it is a bring-your-own-class override (the Link
	// fancy-underline precedent), not a new prop. A soft tint keeps the
	// existing text color's contrast intact (same low-percentage color-mix
	// recipe Badge's soft variant and Table's zebra striping already use).
	const themedBgCode = [
		'<Footer {columns} headingLevel={3} class="brand-footer" />',
		'',
		'<' + 'style>',
		'\t:global(.brand-footer) {',
		'\t\tbackground: color-mix(in srgb, var(--hz-intent-primary) 10%, var(--hz-color-surface));',
		'\t}',
		'</' + 'style>'
	].join('\n');
</script>

<DocPage name="Footer" {...footerDoc}>
	<Tabs items={demoTabs} ariaLabel="Footer demos" defaultTab="variants">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'variants'}
					<p class="tab-note">
						<code>default</code> fills with the muted surface (<code>--hz-color-surface-muted</code
						>).
						<code>minimal</code> is transparent with tighter padding, so whatever sits behind it
						shows through. <code>bordered</code> is a separate boolean prop (a top hairline), so it
						composes with either variant. Each demo sits on a tinted backdrop that is not part of
						Footer, so
						<code>minimal</code> has something to show through. Each column's
						<code>links</code> reuses
						<a href="/docs/components/nav">Nav</a>'s <code>NavItem</code> shape (<code>label</code
						>/<code>href</code>/<code>external</code>/<code>ariaCurrent</code>).
					</p>
					<Tabs
						items={surfaceCombos.map((c) => ({ id: c.id, label: c.label }))}
						ariaLabel="Footer surface"
						defaultTab="default"
					>
						{#snippet panel(vItem)}
							{@const combo = surfaceCombos.find((c) => c.id === vItem.id)!}
							<div class="inner-tab">
								<Example code={comboCode(combo)}>
									<div class="surface-backdrop">
										<Footer
											columns={demoColumns}
											headingLevel={3}
											variant={combo.variant}
											bordered={combo.bordered}
										/>
									</div>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'links'}
					<p class="tab-note">
						<code>linkVariant</code> restyles every column link: <code>subtle</code> (muted,
						default), <code>default</code> (standard link treatment), <code>nav</code>
						(nav-weight, primary on hover).
					</p>
					<Tabs
						items={linkVariants.map((v) => ({ id: v, label: v }))}
						ariaLabel="Footer link variant"
						defaultTab="subtle"
					>
						{#snippet panel(lvItem)}
							<div class="inner-tab">
								<Example code={linkVariantCode(lvItem.id)}>
									<Footer
										columns={demoColumns}
										headingLevel={3}
										linkVariant={lvItem.id as (typeof linkVariants)[number]}
									/>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'slots'}
					<p class="tab-note">
						<code>social</code> is a plain snippet, so any icon works, including brand marks. The
						library ships the full Lucide set (generic glyphs like <code>globe</code>,
						<code>mail</code>, and <code>rss</code> below). Brand marks such as GitHub or X are
						bring-your-own: drop an SVG, an icon-font glyph, or a package like
						<code>simple-icons</code> straight into the snippet.
					</p>
					<Example code={slotsCode}>
						<Footer columns={demoColumns} headingLevel={3}>
							{#snippet logo()}<strong>@hyzer-labs/ui</strong>{/snippet}
							{#snippet social()}
								<Link href="https://hyzer.sh" ariaLabel="Website">
									<IconGlobe />
								</Link>
								<Link href="mailto:hello@hyzer.sh" ariaLabel="Email"><IconMail /></Link>
								<Link href="#" ariaLabel="RSS feed"><IconRss /></Link>
							{/snippet}
							{#snippet bottom()}
								<p class="copy">© 2026 Hyzer Labs, MIT License</p>
							{/snippet}
						</Footer>
					</Example>
				{:else if item.id === 'columns'}
					<p class="tab-note">
						Columns auto-fit the footer's own width: you get as many as have at least
						<code>--hz-footer-col-min</code> of room (12rem, and yours to retune through that custom property).
						No breakpoints involved. Use the slider to watch them stack.
					</p>
					<Container breakout padding="none">
						<Example code={responsiveCode}>
							<ResizableDemo initial={720} describe={columnBand}>
								<Footer columns={demoColumns} headingLevel={3} />
							</ResizableDemo>
						</Example>
					</Container>
				{:else}
					<p class="tab-note">
						Footer has no dedicated background hook. <code>class</code> merges after
						<code>hz-footer</code>, and your unlayered CSS beats the theme without needing
						<code>!important</code>. A low-percentage <code>color-mix</code> tint keeps the existing text
						color's contrast intact.
					</p>
					<Example code={themedBgCode}>
						<Footer columns={demoColumns} headingLevel={3} class="brand-footer" />
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.copy {
		margin: 0;
	}

	/* Tinted, borderless backdrop so variant="minimal" has something to
	 * visibly show through — the same regression class previously fixed on
	 * the Nav demo pages. */
	.surface-backdrop {
		padding: 1.5rem;
		border-radius: var(--hz-radius-md, 0.5rem);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--hz-intent-primary, #2563eb) 16%, var(--hz-color-surface, #fff)),
			color-mix(in srgb, var(--hz-intent-secondary, #7c3aed) 16%, var(--hz-color-surface, #fff))
		);
	}

	:global(.brand-footer) {
		background: color-mix(
			in srgb,
			var(--hz-intent-primary, #2563eb) 10%,
			var(--hz-color-surface, #fff)
		);
	}
</style>
