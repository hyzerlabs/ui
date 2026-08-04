<script lang="ts">
	import { Container, RadioGroup, Split, Stack, Tabs } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { splitDoc } from '../../../../docs/data/split.js';
	import Example from '../../../../docs/Example.svelte';
	import ResizableDemo from '../../../../docs/ResizableDemo.svelte';

	const fractionValues = ['1/4', '1/3', '1/2', '2/3', '3/4', 'auto', 'auto-end'] as const;
	const stackValues = ['sm', 'md', 'lg', 'none'] as const;

	type FractionValue = (typeof fractionValues)[number];
	type StackValue = (typeof stackValues)[number];

	// One interactive demo per tab: a RadioGroup picks the value, and the
	// Example's code and preview follow it.
	let fraction = $state<FractionValue>('1/2');
	let stackValue = $state<StackValue>('sm');

	const stackPx: Record<StackValue, number> = {
		sm: 640,
		md: 968,
		lg: 1200,
		none: 0
	};

	// Readout annotation factory for the resizable stacking demo.
	function stackBand(threshold: number): (w: number) => string {
		return (w) => (w >= threshold ? 'side by side' : 'stacked');
	}

	function fractionCode(fraction: string): string {
		return [
			`<Split fraction="${fraction}">`,
			'\t<div>First</div>',
			'\t<div>Second</div>',
			'</Split>'
		].join('\n');
	}

	const reverseCode = [
		'<!-- reverse swaps the columns visually only; DOM, reading, and focus order are unchanged -->',
		'<Split fraction="1/3" reverse>',
		'\t<div>DOM first (visual right)</div>',
		'\t<div>DOM second (visual left)</div>',
		'</Split>'
	].join('\n');

	function stackCode(stackBelow: string): string {
		return [
			`<Split stackBelow="${stackBelow}">`,
			'\t<div>First</div>',
			'\t<div>Second</div>',
			'</Split>'
		].join('\n');
	}

	const paddingValues = ['none', 'sm', 'md', 'lg', 'near', 'away'] as const;
	type PaddingValue = (typeof paddingValues)[number];
	let padding = $state<PaddingValue>('md');

	const gapValues = ['none', 'sm', 'md', 'lg', 'near', 'away'] as const;
	type GapValue = (typeof gapValues)[number];
	let gap = $state<GapValue>('md');

	function spacingCode(gap: string, padding: string): string {
		return [
			`<Split gap="${gap}" padding="${padding}">…</Split>`,
			`<Split gap="${gap}" paddingInline="${padding}">…</Split>`,
			`<Split gap="${gap}" paddingBlock="${padding}">…</Split>`
		].join('\n');
	}

	const demoTabs = [
		{ id: 'fraction', label: 'Fractions' },
		{ id: 'reverse', label: 'Reverse' },
		{ id: 'stack', label: 'Stacking' },
		{ id: 'spacing', label: 'Spacing' }
	];
</script>

<DocPage name="Split" {...splitDoc}>
	<Tabs items={demoTabs} ariaLabel="Split demos" defaultTab="fraction">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'fraction'}
					<p class="tab-note">
						<code>fraction</code> is the first column's share. <code>auto</code> sizes the first
						column to its content and gives the rest to the second. <code>auto-end</code> mirrors
						that: the last column sizes to its content while the first takes the rest. Below the
						<code>stackBelow</code> width the columns stack. The default <code>sm</code> is 640px of the
						Split's own width.
					</p>
					<Stack gap="sm">
						<RadioGroup
							name="split-fraction"
							label="fraction"
							orientation="horizontal"
							options={fractionValues.map((f) => ({ value: f, label: f }))}
							bind:value={fraction}
						/>
						<Example code={fractionCode(fraction)}>
							<Split {fraction} gap="md">
								<div class="demo-pane demo-pane--a">
									{fraction === 'auto' ? 'Sized to content' : 'First'}
								</div>
								<div class="demo-pane demo-pane--b">
									{fraction === 'auto-end' ? 'Sized to content' : 'Second'}
								</div>
							</Split>
						</Example>
					</Stack>
				{:else if item.id === 'reverse'}
					<p class="tab-note">
						<code>reverse</code> swaps the columns with CSS <code>order</code>. The DOM is
						untouched, so screen readers and Tab order still follow source order. This is useful for
						alternating media and text rows.
					</p>
					<Example code={reverseCode}>
						<Split fraction="1/3" gap="md" reverse>
							<div class="demo-pane demo-pane--a">DOM first (visual right)</div>
							<div class="demo-pane demo-pane--b">DOM second (visual left)</div>
						</Split>
					</Example>
				{:else if item.id === 'stack'}
					<p class="tab-note">
						The Split stacks when its own width drops under the chosen width token (<code>sm</code>
						640px, <code>md</code> 968px, <code>lg</code> 1200px). The threshold resolves through
						<code>var(--hz-width-*)</code>, so overriding those tokens (globally or on any ancestor)
						changes when it stacks. <code>none</code> never stacks, no matter how narrow the Split gets.
						Use the slider to cross the threshold.
					</p>
					<Stack gap="sm">
						<RadioGroup
							name="split-stack-below"
							label="stackBelow"
							orientation="horizontal"
							options={stackValues.map((v) => ({ value: v, label: v }))}
							bind:value={stackValue}
						/>
						<Container breakout padding="none">
							<Example code={stackCode(stackValue)}>
								<ResizableDemo initial={720} describe={stackBand(stackPx[stackValue])}>
									<Split stackBelow={stackValue} gap="md">
										<div class="demo-pane demo-pane--a">First</div>
										<div class="demo-pane demo-pane--b">Second</div>
									</Split>
								</ResizableDemo>
							</Example>
						</Container>
					</Stack>
				{:else}
					<p class="tab-note">
						<code>gap</code> is the space between the two columns, and between the stacked rows
						below the <code>stackBelow</code> width. The tinted zone is the Split; the space between
						its edge and the panes is the <code>padding</code>. <code>padding</code>
						applies on both axes; <code>paddingInline</code> and <code>paddingBlock</code>
						override one axis and win where set. Both stay correct in RTL and vertical writing modes.
						The padding sits on the split root, so <code>stackBelow</code> measures the padded-down
						width. <code>near</code> and <code>away</code> are the
						<a href="/docs/foundation/spacing">density distances</a>: context-aware values that
						tighten inside <code>data-density-shift</code> regions.
					</p>
					<Stack gap="sm">
						<RadioGroup
							name="split-gap"
							label="gap"
							orientation="horizontal"
							options={gapValues.map((v) => ({ value: v, label: v }))}
							bind:value={gap}
						/>
						<RadioGroup
							name="split-padding"
							label="padding"
							orientation="horizontal"
							options={paddingValues.map((v) => ({ value: v, label: v }))}
							bind:value={padding}
						/>
						<Example code={spacingCode(gap, padding)}>
							<Stack gap="sm">
								<Split {gap} {padding} class="pad-frame">
									<div class="demo-pane demo-pane--a">padding="{padding}"</div>
									<div class="demo-pane demo-pane--b">Second</div>
								</Split>
								<Split {gap} paddingInline={padding} class="pad-frame">
									<div class="demo-pane demo-pane--a">paddingInline="{padding}"</div>
									<div class="demo-pane demo-pane--b">Second</div>
								</Split>
								<Split {gap} paddingBlock={padding} class="pad-frame">
									<div class="demo-pane demo-pane--a">paddingBlock="{padding}"</div>
									<div class="demo-pane demo-pane--b">Second</div>
								</Split>
							</Stack>
						</Example>
					</Stack>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	:global(.pad-frame) {
		background: color-mix(in srgb, var(--hz-intent-secondary, #7c3aed) 12%, transparent);
		border: 1px dashed var(--hz-intent-secondary, #7c3aed);
		border-radius: var(--hz-radius-sm, 0.25rem);
	}
	.demo-pane {
		padding: 1rem;
		border-radius: var(--hz-radius-sm, 0.25rem);
		font-size: var(--hz-font-size-sm, 0.875rem);
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 4rem;
	}
	.demo-pane--a {
		background: color-mix(in srgb, var(--hz-intent-primary, #2563eb) 20%, transparent);
		border: 1px solid var(--hz-intent-primary, #2563eb);
	}
	.demo-pane--b {
		background: color-mix(in srgb, var(--hz-intent-secondary, #7c3aed) 20%, transparent);
		border: 1px solid var(--hz-intent-secondary, #7c3aed);
	}
</style>
