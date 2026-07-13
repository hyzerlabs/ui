<script lang="ts">
	import { Breadcrumbs, Tabs } from '$lib';
	import type { BreadcrumbItem } from '$lib/types';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'items', type: 'BreadcrumbItem[]', default: '—', note: 'Required. See BreadcrumbItem below.' },
		{ name: 'ariaLabel', type: 'string', default: "'Breadcrumb'" },
		{
			name: 'separator',
			type: 'Snippet',
			default: '—',
			note: 'Replaces the chevron between items; rendered aria-hidden.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-breadcrumbs class.' }
	];

	const breadcrumbItemType: PropRow[] = [
		{ name: 'label', type: 'string', default: '—', note: 'Required.' },
		{
			name: 'href',
			type: 'string',
			default: '—',
			note: 'Omit on the last item to render the current page as plain text.'
		},
		{ name: 'external', type: 'boolean', default: '—', note: 'Adds the external-link treatment.' },
		{
			name: 'ariaCurrent',
			type: "'page' | 'step' | 'true'",
			default: '—',
			note: 'The last item gets aria-current="page" automatically; set this to override.'
		}
	];

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
		"\t{ label: 'Home', href: '/' },",
		"\t{ label: 'Components', href: '/components/button' },",
		"\t{ label: 'Button' } // current page — no href, renders as text",
		'];',
		'',
		'<Breadcrumbs {items} />'
	].join('\n');

	const wrapCode = ['<!-- The trail is a wrapping flex row — long paths', '     break onto new lines; separators stay attached to their crumb -->', '<Breadcrumbs {items} />'].join(
		'\n'
	);

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

<DocPage
	name="Breadcrumbs"
	description="A wrapping breadcrumb trail of navigation links with chevron separators and automatic current-page semantics."
	importLine={'import {Breadcrumbs} from "@hyzer-labs/ui"'}
	{props}
	types={[{ name: 'BreadcrumbItem', props: breadcrumbItemType }]}
	a11yNote="Breadcrumbs renders a `<nav aria-label=&quot;Breadcrumb&quot;>` landmark wrapping an ordered list. The last item is the current page — `aria-current=&quot;page&quot;` is applied automatically (as plain text when it has no `href`). Separators are decorative and `aria-hidden`."
>
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
	.tab-content {
		padding-top: 1rem;
	}
	.tab-note {
		margin: 0 0 1rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
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
