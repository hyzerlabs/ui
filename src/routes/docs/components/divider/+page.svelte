<script lang="ts">
	import { Divider, RadioGroup, Stack, Tabs } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { dividerDoc } from '../../../../docs/data/divider.js';
	import Example from '../../../../docs/Example.svelte';

	const variants = ['solid', 'dashed', 'dotted'] as const;
	const spacings = ['none', 'sm', 'md', 'lg', 'near', 'away'] as const;
	const lineWidths = ['thin', 'thick'] as const;
	type Variant = (typeof variants)[number];
	type Spacing = (typeof spacings)[number];
	type LineWidth = (typeof lineWidths)[number];
	let variant = $state<Variant>('solid');
	let spacing = $state<Spacing>('md');
	let lineWidth = $state<LineWidth>('thin');

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
						<code>role="separator"</code> row: the classic "OR" pattern between two sign-in options.
					</p>
					<Example code={labeledCode}>
						<div class="demo-col">
							<p class="fill">Sign in with league account</p>
							<Divider>OR</Divider>
							<p class="fill">Sign in as a guest</p>
						</div>
					</Example>
				{:else if item.id === 'variants'}
					<Stack gap="sm">
						<RadioGroup
							name="divider-variant"
							label="variant"
							orientation="horizontal"
							options={variants.map((v) => ({ value: v, label: v }))}
							bind:value={variant}
						/>
						<Example code={variantCode(variant)}>
							<div class="demo-col">
								<Divider {variant}>Continue with</Divider>
							</div>
						</Example>
					</Stack>
				{:else if item.id === 'spacing'}
					<p class="tab-note">
						<code>spacing</code> drives the block margin around the divider. It takes the shared
						layout scale, including the <code>near</code> and <code>away</code> density distances,
						which tighten inside <code>data-density-shift</code> regions.
					</p>
					<Stack gap="sm">
						<RadioGroup
							name="divider-spacing"
							label="spacing"
							orientation="horizontal"
							options={spacings.map((s) => ({ value: s, label: s }))}
							bind:value={spacing}
						/>
						<Example code={spacingCode(spacing)}>
							<div class="demo-col spacing-demo">
								<p class="fill">Above</p>
								<Divider {spacing} />
								<p class="fill">Below</p>
							</div>
						</Example>
					</Stack>
				{:else}
					<p class="tab-note">
						<code>lineWidth</code> maps straight onto the library's border-width tokens:
						<code>thin</code> (1px) and <code>thick</code> (2px).
					</p>
					<Stack gap="sm">
						<RadioGroup
							name="divider-line-width"
							label="lineWidth"
							orientation="horizontal"
							options={lineWidths.map((w) => ({ value: w, label: w }))}
							bind:value={lineWidth}
						/>
						<Example code={lineWidthCode(lineWidth)}>
							<div class="demo-col">
								<p class="fill">Front nine</p>
								<Divider {lineWidth} />
								<p class="fill">Back nine</p>
							</div>
						</Example>
					</Stack>
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
