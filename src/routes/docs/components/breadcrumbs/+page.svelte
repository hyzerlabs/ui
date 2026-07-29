<script lang="ts">
	import { Breadcrumbs, Tabs } from '$lib';
	import type { BreadcrumbItem } from '$lib/types';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { breadcrumbsDoc } from '../../../../docs/data/breadcrumbs.js';
	import Example from '../../../../docs/Example.svelte';

	// Demo links are '#' so readers can't accidentally navigate away.
	const trail: BreadcrumbItem[] = [
		{ label: 'Home', href: '#' },
		{ label: 'Components', href: '#' },
		{ label: 'Button' }
	];

	const longTrail: BreadcrumbItem[] = [
		{ label: 'Home', href: '#' },
		{ label: 'Foundation', href: '#' },
		{ label: 'Spacing & Sizing', href: '#' },
		{ label: 'Density spacing', href: '#' },
		{ label: 'Shift levels', href: '#' },
		{ label: 'Three shifts' }
	];

	const basicCode = [
		'const items: BreadcrumbItem[] = [',
		"\t{ label: 'Home', href: '/docs' },",
		"\t{ label: 'Components', href: '/docs/components/button' },",
		"\t{ label: 'Button' } // current page — no href, renders as text",
		'];',
		'',
		'<Breadcrumbs {items} />'
	].join('\n');

	const wrapCode = [
		'<!-- The trail is a wrapping flex row — long paths',
		'     break onto new lines; separators stay attached to their crumb -->',
		'<Breadcrumbs {items} />'
	].join('\n');

	const separatorCode = [
		'<Breadcrumbs {items}>',
		'\t{#snippet separator()}<span>/</span>{/snippet}',
		'</Breadcrumbs>'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'wrapping', label: 'Wrapping' },
		{ id: 'separator', label: 'Custom separator' }
	];
</script>

<DocPage name="Breadcrumbs" {...breadcrumbsDoc}>
	<Tabs items={demoTabs} ariaLabel="Breadcrumbs demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<Example code={basicCode}>
						<Breadcrumbs items={trail} />
					</Example>
				{:else if item.id === 'wrapping'}
					<p class="tab-note">
						The trail is a cluster-style wrapping row. Each separator rides with its crumb, so a
						wrapped line never starts with one — shown here in a narrow container.
					</p>
					<Example code={wrapCode}>
						<div class="narrow">
							<Breadcrumbs items={longTrail} />
						</div>
					</Example>
				{:else}
					<Example code={separatorCode}>
						<Breadcrumbs items={trail}>
							{#snippet separator()}<span class="slash">/</span>{/snippet}
						</Breadcrumbs>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.narrow {
		max-width: 18rem;
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-sm, 0.25rem);
		padding: 0.75rem;
	}
	.slash {
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
