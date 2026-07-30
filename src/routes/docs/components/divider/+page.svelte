<script lang="ts">
	import { Divider, Tabs } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { dividerDoc } from '../../../../docs/data/divider.js';
	import Example from '../../../../docs/Example.svelte';

	const variants = ['solid', 'dashed', 'dotted'] as const;
	const spacings = ['none', 'sm', 'md', 'lg', 'near', 'away'] as const;
	const lineWidths = ['thin', 'thick'] as const;

	const bareCode = '<Divider />';
	const labeledCode = ['<Divider>OR</Divider>'].join('\n');

	function variantCode(variant: (typeof variants)[number]): string {
		return `<Divider variant="${variant}">Continue with</Divider>`;
	}

	function spacingCode(spacing: (typeof spacings)[number]): string {
		return spacing === 'md' ? '<Divider />' : `<Divider spacing="${spacing}" />`;
	}

	function lineWidthCode(lineWidth: (typeof lineWidths)[number]): string {
		return lineWidth === 'thin' ? '<Divider />' : `<Divider lineWidth="${lineWidth}" />`;
	}

	const demoTabs = [
		{ id: 'bare', label: 'Bare' },
		{ id: 'labeled', label: 'Labeled' },
		{ id: 'variants', label: 'Variant' },
		{ id: 'spacing', label: 'Spacing' },
		{ id: 'line-width', label: 'Line width' }
	];
</script>

<DocPage name="Divider" {...dividerDoc}>
	<Tabs items={demoTabs} ariaLabel="Divider demos" defaultTab="bare">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'bare'}
					<p class="tab-note">
						With no <code>children</code>, Divider renders a native <code>&lt;hr&gt;</code>.
					</p>
					<Example code={bareCode}>
						<div class="demo-col">
							<p class="fill">Round one</p>
							<Divider />
							<p class="fill">Round two</p>
						</div>
					</Example>
				{:else if item.id === 'labeled'}
					<p class="tab-note">
						With <code>children</code>, Divider renders a labeled
						<code>role="separator"</code> row — the classic "OR" pattern between two sign-in options.
					</p>
					<Example code={labeledCode}>
						<div class="demo-col">
							<p class="fill">Sign in with league account</p>
							<Divider>OR</Divider>
							<p class="fill">Sign in as a guest</p>
						</div>
					</Example>
				{:else if item.id === 'variants'}
					<Tabs
						items={variants.map((v) => ({ id: v, label: v }))}
						ariaLabel="Divider variant"
						defaultTab="solid"
					>
						{#snippet panel(vItem)}
							<div class="inner-tab">
								<Example code={variantCode(vItem.id as (typeof variants)[number])}>
									<div class="demo-col">
										<Divider variant={vItem.id as (typeof variants)[number]}>Continue with</Divider>
									</div>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'spacing'}
					<p class="tab-note">
						<code>spacing</code> drives the block margin around the divider — the shared layout
						scale, including the <code>near</code>/<code>away</code> density distances, which
						tighten inside <code>data-density-shift</code> regions.
					</p>
					<Tabs
						items={spacings.map((s) => ({ id: s, label: s }))}
						ariaLabel="Divider spacing"
						defaultTab="md"
					>
						{#snippet panel(sItem)}
							<div class="inner-tab">
								<Example code={spacingCode(sItem.id as (typeof spacings)[number])}>
									<div class="demo-col spacing-demo">
										<p class="fill">Above</p>
										<Divider spacing={sItem.id as (typeof spacings)[number]} />
										<p class="fill">Below</p>
									</div>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else}
					<p class="tab-note">
						<code>lineWidth</code> maps straight onto the library's border-width tokens —
						<code>thin</code> (1px) and <code>thick</code> (2px).
					</p>
					<Tabs
						items={lineWidths.map((w) => ({ id: w, label: w }))}
						ariaLabel="Divider line width"
						defaultTab="thin"
					>
						{#snippet panel(wItem)}
							<div class="inner-tab">
								<Example code={lineWidthCode(wItem.id as (typeof lineWidths)[number])}>
									<div class="demo-col">
										<p class="fill">Front nine</p>
										<Divider lineWidth={wItem.id as (typeof lineWidths)[number]} />
										<p class="fill">Back nine</p>
									</div>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.fill {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
	.spacing-demo {
		border: 1px dashed var(--hz-color-border, #6b7280);
		padding: 0.5rem 1rem;
	}
</style>
