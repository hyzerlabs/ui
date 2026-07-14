<script lang="ts">
	import { Button, Cluster, Tabs } from '$lib';
	import { IconArrowRight, IconSearch } from '$lib/icons';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'variant', type: "'solid' | 'outline' | 'ghost' | 'link'", default: "'solid'" },
		{
			name: 'intent',
			type: "'primary' | 'secondary' | 'danger' | 'neutral'",
			default: "'primary'",
			note: 'See Foundation → Colors & Intent.'
		},
		{ name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
		{ name: 'disabled', type: 'boolean', default: 'false' },
		{ name: 'loading', type: 'boolean', default: 'false' },
		{
			name: 'loadingLabel',
			type: 'string',
			default: "'Loading'",
			note: 'Screen-reader-only text announced while loading; not rendered visually.'
		},
		{ name: 'fullWidth', type: 'boolean', default: 'false' },
		{ name: 'href', type: 'string', default: '—', note: 'Renders as <a> when set.' },
		{ name: 'type', type: "'button' | 'submit' | 'reset'", default: "'button'" },
		{
			name: 'ariaLabel',
			type: 'string',
			default: '—',
			note: 'Required for icon-only buttons.'
		},
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-button class.'
		},
		{ name: 'children', type: 'Snippet', default: '—' },
		{
			name: 'iconStart',
			type: 'Snippet',
			default: '—',
			note: 'An icon snippet with no children renders the compact circular icon-only form.'
		},
		{ name: 'iconEnd', type: 'Snippet', default: '—' }
	];

	const variants = ['solid', 'outline', 'ghost', 'link'] as const;
	const intents = ['primary', 'secondary', 'danger'] as const;
	const sizes = ['sm', 'md', 'lg'] as const;

	const demoTabs = [
		{ id: 'variants', label: 'Variants' },
		{ id: 'sizes', label: 'Sizes' },
		{ id: 'states', label: 'States' },
		{ id: 'icons', label: 'With icons' },
		{ id: 'full-width', label: 'Full width' },
		{ id: 'as-anchor', label: 'As anchor' }
	];

	// Example-code builders — derived from the selected sub-tab so the code
	// pane updates live with the demo.
	function variantCode(variant: string): string {
		return intents
			.map((intent) => `<Button variant="${variant}" intent="${intent}">${intent}</Button>`)
			.join('\n');
	}

	function sizeCode(size: string): string {
		return intents
			.map((intent) => `<Button size="${size}" intent="${intent}">${intent}</Button>`)
			.join('\n');
	}

	const statesCode = [
		'<Button loading>Save</Button>',
		'<!-- loadingLabel is announced to screen readers, not shown visually -->',
		'<Button loading loadingLabel="Saving changes…">Save</Button>',
		'<Button disabled>Disabled</Button>'
	].join('\n');

	const iconsCode = [
		'<Button>',
		'\t{#snippet iconEnd()}<IconArrowRight />{/snippet}',
		'\tContinue',
		'</Button>',
		'<Button variant="outline">',
		'\t{#snippet iconStart()}<IconSearch />{/snippet}',
		'\tSearch',
		'</Button>',
		'<!-- Icon-only: ariaLabel is required -->',
		'<Button ariaLabel="Search" variant="ghost">',
		'\t{#snippet iconStart()}<IconSearch />{/snippet}',
		'</Button>'
	].join('\n');

	const fullWidthCode = '<Button fullWidth>Full width button</Button>';

	const anchorCode = '<Button href="/pricing">Link button (renders as <a>)</Button>';
</script>

<DocPage
	name="Button"
	description="A versatile button component supporting solid, outline, ghost, and link variants with intent colors, sizes, loading, and icon slots."
	importLine={'import {Button} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Use `ariaLabel` for icon-only buttons (no visible text). The loading state sets `aria-busy=&quot;true&quot;` and renders a screen-reader-only &quot;Loading&quot; label. Disabled state sets `aria-disabled=&quot;true&quot;`."
>
	<Tabs items={demoTabs} ariaLabel="Button demos" defaultTab="variants">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'variants'}
					<Tabs
						items={variants.map((v) => ({ id: v, label: v }))}
						ariaLabel="Button variant"
						defaultTab="solid"
					>
						{#snippet panel(vItem)}
							<div class="inner-tab">
								<Example code={variantCode(vItem.id)}>
									<Cluster gap="sm">
										{#each intents as intent (intent)}
											<Button variant={vItem.id as (typeof variants)[number]} {intent}>
												{intent}
											</Button>
										{/each}
									</Cluster>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'sizes'}
					<Tabs
						items={sizes.map((s) => ({ id: s, label: s }))}
						ariaLabel="Button size"
						defaultTab="md"
					>
						{#snippet panel(sItem)}
							<div class="inner-tab">
								<Example code={sizeCode(sItem.id)}>
									<Cluster gap="sm" align="center">
										{#each intents as intent (intent)}
											<Button size={sItem.id as (typeof sizes)[number]} {intent}>{intent}</Button>
										{/each}
									</Cluster>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'states'}
					<p class="tab-note">
						While <code>loading</code>, the button sets <code>aria-busy="true"</code> and renders a
						visually hidden <code>loadingLabel</code> (default <code>"Loading"</code>) for screen
						readers — the two loading buttons below look identical but announce differently.
						Customize it to describe the in-flight action, e.g.
						<code>loadingLabel="Saving changes…"</code>.
					</p>
					<Example code={statesCode}>
						<Cluster gap="sm" align="center">
							<Button loading>Save</Button>
							<Button loading loadingLabel="Saving changes…">Save</Button>
							<Button disabled>Disabled</Button>
						</Cluster>
					</Example>
				{:else if item.id === 'icons'}
					<Example code={iconsCode}>
						<Cluster gap="sm" align="center">
							<Button>
								{#snippet iconEnd()}<IconArrowRight />{/snippet}
								Continue
							</Button>
							<Button variant="outline">
								{#snippet iconStart()}<IconSearch />{/snippet}
								Search
							</Button>
							<Button ariaLabel="Search" variant="ghost">
								{#snippet iconStart()}<IconSearch />{/snippet}
							</Button>
						</Cluster>
					</Example>
				{:else if item.id === 'full-width'}
					<Example code={fullWidthCode}>
						<Button fullWidth>Full width button</Button>
					</Example>
				{:else}
					<p class="tab-note">
						<code>href</code> changes the element, not the look: it renders a real
						<code>&lt;a role="button"&gt;</code> that navigates, styled as whatever variant you
						choose. Contrast with <code>variant="link"</code>, which is still a
						<code>&lt;button&gt;</code> performing an action that merely looks like a text link. If
						it navigates <em>and</em> should look like a text link, use the Link component instead.
					</p>
					<Example code={anchorCode}>
						<Button href="#">Link button (renders as &lt;a&gt;)</Button>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>
