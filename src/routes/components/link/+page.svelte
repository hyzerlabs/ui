<script lang="ts">
	import { Link, Tabs } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import { linkDoc } from '../../../docs/data/link.js';
	import Example from '../../../docs/Example.svelte';

	const variants = ['default', 'subtle', 'nav'] as const;

	const demoTabs = [
		{ id: 'variants', label: 'Variants' },
		{ id: 'external', label: 'External' },
		{ id: 'aria-current', label: 'aria-current' }
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
		'<Link href="/components/link" ariaCurrent="page">Link docs (this page)</Link>',
		'<Link href="/components/button">Button docs</Link>'
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
				{:else}
					<Example code={ariaCurrentCode}>
						<nav aria-label="aria-current demo">
							<Link href="/components/link" ariaCurrent="page">Link docs (this page)</Link>
							&nbsp;·&nbsp;
							<Link href="/components/button">Button docs</Link>
						</nav>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>
