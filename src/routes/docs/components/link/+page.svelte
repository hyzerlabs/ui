<script lang="ts">
	import { Link, Tabs } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { linkDoc } from '../../../../docs/data/link.js';
	import Example from '../../../../docs/Example.svelte';

	const variants = ['default', 'subtle', 'nav'] as const;

	const demoTabs = [
		{ id: 'variants', label: 'Variants' },
		{ id: 'external', label: 'External' },
		{ id: 'aria-current', label: 'aria-current' },
		{ id: 'byo-class', label: 'Bring your own class' }
	];

	// Example-code builders — derived from the selected sub-tab so the code
	// pane updates live with the demo.
	function variantCode(variant: string): string {
		const label = variant[0].toUpperCase() + variant.slice(1);
		return variant === 'default'
			? `<Link href="/docs">${label} link</Link>`
			: `<Link href="/docs" variant="${variant}">${label} link</Link>`;
	}

	const externalCode = [
		'<!-- external renders a glyph automatically (pass iconEnd to replace it) -->',
		'<Link href="https://github.com/hyzerlabs/ui" external>View on GitHub</Link>',
		'<Link href="https://github.com/hyzerlabs/ui" external externalIcon={false}>',
		'\tView on GitHub',
		'</Link>'
	].join('\n');

	const ariaCurrentCode = [
		'<!-- This link points at the page you are on, so it carries aria-current="page" -->',
		'<Link href="/docs/components/link" ariaCurrent="page">Link docs (this page)</Link>',
		'<Link href="/docs/components/button">Button docs</Link>'
	].join('\n');

	// Bring-your-own-class demo: a fun, exaggerated hover underline (thick
	// gradient underline that grows to full width), the exact recipe from
	// the author's personal site. Built via '</' + 'style>' concatenation —
	// a literal closing-style-tag substring inside this script block's
	// string breaks Svelte's parser.
	const fancyLinkCode = [
		'<Link href="#" class="fancy-link">Hover me</Link>',
		'',
		'<' + 'style>',
		'\t.fancy-link {',
		'\t\ttext-decoration: none;',
		'\t\tbackground-image: linear-gradient(',
		'\t\t\t90deg,',
		'\t\t\tvar(--hz-intent-primary),',
		'\t\t\tvar(--hz-intent-secondary)',
		'\t\t);',
		'\t\tbackground-repeat: no-repeat;',
		'\t\tbackground-position: 0 100%;',
		'\t\tbackground-size: 0% 4px;',
		'\t\ttransition: background-size 300ms ease;',
		'\t}',
		'',
		'\t.fancy-link:hover {',
		'\t\tbackground-size: 100% 4px;',
		'\t}',
		'',
		'\t@media (prefers-reduced-motion: reduce) {',
		'\t\t.fancy-link {',
		'\t\t\ttransition: none;',
		'\t\t}',
		'\t}',
		'</' + 'style>'
	].join('\n');
</script>

<DocPage name="Link" {...linkDoc}>
	<Tabs items={demoTabs} ariaLabel="Link demos" defaultTab="variants">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'variants'}
					<Tabs
						items={variants.map((v) => ({ id: v, label: v }))}
						ariaLabel="Link variant"
						defaultTab="default"
					>
						{#snippet panel(vItem)}
							<div class="inner-tab">
								<Example code={variantCode(vItem.id)}>
									<Link href="#top" variant={vItem.id as (typeof variants)[number]}>
										{vItem.id[0].toUpperCase() + vItem.id.slice(1)} link
									</Link>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'external'}
					<Example code={externalCode}>
						<Link href="https://github.com/hyzerlabs/ui" external>View on GitHub</Link>
						&nbsp;·&nbsp;
						<Link href="https://github.com/hyzerlabs/ui" external externalIcon={false}>
							View on GitHub
						</Link>
					</Example>
				{:else if item.id === 'aria-current'}
					<Example code={ariaCurrentCode}>
						<nav aria-label="aria-current demo">
							<Link href="/docs/components/link" ariaCurrent="page">Link docs (this page)</Link>
							&nbsp;·&nbsp;
							<Link href="/docs/components/button">Button docs</Link>
						</nav>
					</Example>
				{:else}
					<p class="tab-note">
						<code>class</code> merges after <code>hz-link</code> — bring your own class and it wins:
						this unlayered consumer CSS beats the theme without needing <code>!important</code>.
					</p>
					<Example code={fancyLinkCode}>
						<Link href="#" class="fancy-link">Hover me</Link>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	:global(.fancy-link) {
		text-decoration: none;
		background-image: linear-gradient(90deg, var(--hz-intent-primary), var(--hz-intent-secondary));
		background-repeat: no-repeat;
		background-position: 0 100%;
		background-size: 0% 4px;
		transition: background-size 300ms ease;
	}

	:global(.fancy-link:hover) {
		background-size: 100% 4px;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.fancy-link) {
			transition: none;
		}
	}
</style>
