<script lang="ts">
	import { Button, Cluster, Tabs } from '$lib';
	import IconArrowRight from '$lib/icons/generated/arrow-right.svelte';
	import IconSearch from '$lib/icons/generated/search.svelte';
	import DocPage from '../../../docs/DocPage.svelte';
	import { buttonDoc } from '../../../docs/data/button.js';
	import Example from '../../../docs/Example.svelte';

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

	function sizeRowCode(size: (typeof sizes)[number]): string {
		return variants
			.map((variant) => {
				const sizeAttr = size === 'md' ? '' : ` size="${size}"`;
				const variantAttr = variant === 'solid' ? '' : ` variant="${variant}"`;
				return `<Button${sizeAttr}${variantAttr}>${variant}</Button>`;
			})
			.join('\n');
	}

	const sizesCode = sizes
		.map(
			(size) => `<!-- size="${size}"${size === 'md' ? ' (default)' : ''} -->\n${sizeRowCode(size)}`
		)
		.join('\n\n');

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

<DocPage name="Button" {...buttonDoc}>
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
					<p class="tab-note">Every size, shown across all four variants.</p>
					<Example code={sizesCode}>
						<div class="size-demo">
							{#each sizes as size (size)}
								<div class="size-row">
									<span class="size-row-label">{size}</span>
									<Cluster gap="sm" align="center">
										{#each variants as variant (variant)}
											<Button {size} {variant}>{variant}</Button>
										{/each}
									</Cluster>
								</div>
							{/each}
						</div>
					</Example>
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

<style>
	.size-demo {
		display: flex;
		flex-direction: column;
		gap: var(--hz-space-sm, 1rem);
	}

	.size-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--hz-space-sm, 1rem);
	}

	.size-row-label {
		min-width: 2rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
