<script lang="ts">
	import { Container, Footer, Link, Tabs } from '$lib';
	import { IconGithub, IconRss, IconTwitterX } from '$lib/icons';
	import type { FooterColumn } from '$lib/types';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import ResizableDemo from '../../../docs/ResizableDemo.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{
			name: 'columns',
			type: 'FooterColumn[]',
			default: '—',
			note: 'Required. See FooterColumn below.'
		},
		{ name: 'variant', type: "'default' | 'minimal'", default: "'default'" },
		{
			name: 'bordered',
			type: 'boolean',
			default: 'false',
			note: 'Top hairline — composes with any variant.'
		},
		{
			name: 'linkVariant',
			type: "'default' | 'subtle' | 'nav'",
			default: "'subtle'",
			note: 'Passed through to every column Link.'
		},
		{
			name: 'headingLevel',
			type: '2 | 3 | 4 | 5 | 6',
			default: '2',
			note: 'Heading element for column titles — match your page hierarchy.'
		},
		{ name: 'logo', type: 'Snippet', default: '—', note: 'Rendered above the columns.' },
		{
			name: 'social',
			type: 'Snippet',
			default: '—',
			note: 'Icon-link row rendered under the columns.'
		},
		{
			name: 'bottom',
			type: 'Snippet',
			default: '—',
			note: 'Bottom bar with a top hairline — copyright, legal links.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-footer class.' }
	];

	const footerColumnType: PropRow[] = [
		{
			name: 'title',
			type: 'string',
			default: '—',
			note: 'Required. Labels the column’s nav landmark.'
		},
		{
			name: 'links',
			type: 'NavItem[]',
			default: '—',
			note: 'Required. label/href/external/ariaCurrent apply — see NavItem on the Nav page.'
		}
	];

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
		'\t\t<Link href="https://github.com/hyzerlabs/ui" ariaLabel="GitHub"><IconGithub /></Link>',
		'\t\t<Link href="/rss.xml" ariaLabel="RSS feed"><IconRss /></Link>',
		'\t{/snippet}',
		'\t{#snippet bottom()}',
		'\t\t<p>© 2026 Hyzer Labs — MIT License</p>',
		'\t{/snippet}',
		'</Footer>'
	].join('\n');

	const responsiveCode = [
		'<!-- Columns auto-fit the footer’s own width: as many as have at least',
		'     --hz-footer-col-min (12rem, consumer-tunable) of room -->',
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
		{ id: 'columns', label: 'Responsive columns' }
	];
</script>

<DocPage
	name="Footer"
	description="Site footer with auto-fitting multi-column link groups, optional logo, social links, and a bottom bar."
	importLine={'import {Footer} from "@hyzer-labs/ui"'}
	{props}
	types={[{ name: 'FooterColumn', props: footerColumnType }]}
	a11yNote="Each column is a `<nav>` landmark labelled by its title heading — set `headingLevel` to match your page hierarchy. Links use the Link component; icon-only social links need an `ariaLabel`."
>
	<Tabs items={demoTabs} ariaLabel="Footer demos" defaultTab="variants">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'variants'}
					<p class="tab-note">
						<code>default</code> fills with the muted surface (<code>--hz-color-surface-muted</code
						>),
						<code>minimal</code> is transparent with tighter padding — the surface underneath shows
						through. <code>bordered</code> is a separate boolean prop (a top hairline), so it composes
						with either variant.
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
									<Footer
										columns={demoColumns}
										headingLevel={3}
										variant={combo.variant}
										bordered={combo.bordered}
									/>
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
					<Example code={slotsCode}>
						<Footer columns={demoColumns} headingLevel={3}>
							{#snippet logo()}<strong>@hyzer-labs/ui</strong>{/snippet}
							{#snippet social()}
								<Link href="https://github.com/hyzerlabs/ui" ariaLabel="GitHub">
									<IconGithub />
								</Link>
								<Link href="#" ariaLabel="RSS feed"><IconRss /></Link>
							{/snippet}
							{#snippet bottom()}
								<p class="copy">© 2026 Hyzer Labs — MIT License</p>
							{/snippet}
						</Footer>
					</Example>
				{:else}
					<p class="tab-note">
						Columns auto-fit the footer's own width — as many as have at least
						<code>--hz-footer-col-min</code> (12rem, consumer-tunable via that custom property) of room,
						no breakpoints involved. Use the slider to watch them stack.
					</p>
					<Container breakout padding="none">
						<Example code={responsiveCode}>
							<ResizableDemo initial={720} describe={columnBand}>
								<Footer columns={demoColumns} headingLevel={3} />
							</ResizableDemo>
						</Example>
					</Container>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.copy {
		margin: 0;
	}
</style>
