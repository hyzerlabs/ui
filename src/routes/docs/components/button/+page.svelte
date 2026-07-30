<script lang="ts">
	import { Alert, Button, Cluster, Tabs } from '$lib';
	import IconArrowRight from '$lib/icons/generated/arrow-right.svelte';
	import IconSearch from '$lib/icons/generated/search.svelte';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { buttonDoc } from '../../../../docs/data/button.js';
	import Example from '../../../../docs/Example.svelte';
	import IconInfo from '$lib/icons/generated/info.svelte';

	// primary leads: it's Button's default intent — a button is a call to
	// action. The rest follow the registry order.
	const intents = [
		'primary',
		'neutral',
		'secondary',
		'danger',
		'warning',
		'success',
		'info'
	] as const;
	const variants = ['solid', 'outline', 'ghost', 'soft'] as const;
	const sizes = ['sm', 'md', 'lg'] as const;

	const demoTabs = [
		{ id: 'variants', label: 'Variants' },
		{ id: 'intents', label: 'Intents' },
		{ id: 'sizes', label: 'Sizes' },
		{ id: 'states', label: 'States' },
		{ id: 'icons', label: 'With icons' },
		{ id: 'as-anchor', label: 'As anchor' }
	];

	// Row-matrix code builders (the Sizes-tab treatment): defaults are
	// omitted from the samples — a bare <Button> IS solid + primary.
	const demoIntents = ['primary', 'secondary', 'danger'] as const;

	function buttonTag(variant: string, intent: string, label: string): string {
		const variantAttr = variant === 'solid' ? '' : ` variant="${variant}"`;
		const intentAttr = intent === 'primary' ? '' : ` intent="${intent}"`;
		return `<Button${variantAttr}${intentAttr}>${label}</Button>`;
	}

	const variantsCode = variants
		.map(
			(variant) =>
				`<!-- ${variant}${variant === 'solid' ? ' (default)' : ''} -->\n` +
				demoIntents.map((intent) => buttonTag(variant, intent, intent)).join('\n')
		)
		.join('\n\n');

	const intentsCode = intents
		.map(
			(intent) =>
				`<!-- ${intent}${intent === 'primary' ? ' (default)' : ''} -->\n` +
				variants.map((variant) => buttonTag(variant, intent, variant)).join('\n')
		)
		.join('\n\n');

	function sizeRowCode(size: (typeof sizes)[number]): string {
		return variants
			.map((variant) => {
				const sizeAttr = size === 'md' ? '' : ` size="${size}"`;
				const variantAttr = variant === 'solid' ? '' : ` variant="${variant}"`;
				return `<Button${sizeAttr}${variantAttr}>${variant}</Button>`;
			})
			.join('\n');
	}

	const sizesCode = [
		...sizes.map(
			(size) => `<!-- size="${size}"${size === 'md' ? ' (default)' : ''} -->\n${sizeRowCode(size)}`
		),
		'<!-- size="full" — fills its container at the md height/padding -->\n<Button size="full">full</Button>'
	].join('\n\n');

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

	const anchorCode = '<Button href="/pricing">Link button (renders as <a>)</Button>';
</script>

<DocPage name="Button" {...buttonDoc}>
	<Tabs items={demoTabs} ariaLabel="Button demos" defaultTab="variants">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'variants'}
					<p class="tab-note">
						Four looks for one control. <code>solid</code> (the default) fills with the intent color,
						<code>outline</code> and <code>ghost</code> lighten the footprint, and <code>soft</code>
						tints the intent into the surface. Each row shows one variant across a few intents.
					</p>
					<Example code={variantsCode}>
						<div class="row-demo">
							{#each variants as variant (variant)}
								<div class="demo-row">
									<span class="demo-row-label">{variant}</span>
									<Cluster gap="sm" align="center">
										{#each demoIntents as intent (intent)}
											<Button {variant} {intent}>{intent}</Button>
										{/each}
									</Cluster>
								</div>
							{/each}
						</div>
					</Example>
				{:else if item.id === 'intents'}
					<p class="tab-note">
						Button spans the full <a href="/docs/foundation/colors#intent">intent vocabulary</a>, not
						a hand-picked subset. <code>primary</code> is the default, because a button is a call to
						action.
					</p>
					<Example code={intentsCode}>
						<div class="row-demo">
							{#each intents as intent (intent)}
								<div class="demo-row">
									<span class="demo-row-label">{intent}</span>
									<Cluster gap="sm" align="center">
										{#each variants as variant (variant)}
											<Button {variant} {intent}>{variant}</Button>
										{/each}
									</Cluster>
								</div>
							{/each}
						</div>
					</Example>
				{:else if item.id === 'sizes'}
					<p class="tab-note">
						Every size, shown across all four variants. <code>size="full"</code> fills its container
						at the <code>md</code> height/padding, and it cannot be combined with
						<code>sm</code>/<code>lg</code>.
					</p>
					<Example code={sizesCode}>
						<div class="row-demo">
							{#each sizes as size (size)}
								<div class="demo-row">
									<span class="demo-row-label">{size}</span>
									<Cluster gap="sm" align="center">
										{#each variants as variant (variant)}
											<Button {size} {variant}>{variant}</Button>
										{/each}
									</Cluster>
								</div>
							{/each}
							<div class="demo-row">
								<span class="demo-row-label">full</span>
								<!-- size="full" is width: 100%, so give it a shrinking flex
								     cell — bare in the flex row it would wrap below the label. -->
								<div class="demo-row-fill">
									<Button size="full">full</Button>
								</div>
							</div>
						</div>
					</Example>
				{:else if item.id === 'states'}
					<p class="tab-note">
						While <code>loading</code>, the button sets <code>aria-busy="true"</code> and renders a
						visually hidden <code>loadingLabel</code> (default <code>"Loading"</code>) for screen
						readers. The two loading buttons below look identical but announce differently. Customize
						the label to describe the in-flight action, e.g.
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
				{:else}
					<Alert intent="info" title="Button vs Link">
						{#snippet icon()}<IconInfo />{/snippet}
						Want it to look like a text link? Use
						<a href="/docs/components/link"><code>Link</code></a>. Want it to look like a button,
						including one that navigates? Use
						<code>Button</code>, adding <code>href</code> when it should navigate.
					</Alert>
					<p class="tab-note">
						<code>href</code> changes the element, not the look. It renders a real
						<code>&lt;a&gt;</code> that navigates, styled as whatever variant you choose. It stays a
						plain semantic anchor with no <code>role="button"</code>, because it genuinely does
						navigate.
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
	.row-demo {
		display: flex;
		flex-direction: column;
		gap: var(--hz-space-sm, 1rem);
	}

	.demo-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--hz-space-sm, 1rem);
	}

	.demo-row-label {
		min-width: 4rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.demo-row-fill {
		flex: 1;
		min-width: 0;
	}
</style>
