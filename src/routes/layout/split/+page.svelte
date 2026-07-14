<script lang="ts">
	import { Container, Split, Tabs } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import ResizableDemo from '../../../docs/ResizableDemo.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'fraction', type: "'1/4' | '1/3' | '1/2' | '2/3' | '3/4' | 'auto'", default: "'1/2'" },
		{
			name: 'gap',
			type: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
			default: "'md'",
			note: 'near/away are the density distances — they tighten inside data-density-shift regions.'
		},
		{ name: 'reverse', type: 'boolean', default: 'false' },
		{
			name: 'stackBelow',
			type: "'sm' | 'md' | 'lg'",
			default: "'sm'",
			note: 'Stacks under the --hz-width-sm/md/lg token (640/968/1200px) of the Split’s own width. Resolves via var() — overriding the token retunes the threshold.'
		},
		{
			name: 'padding',
			type: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
			default: "'none'",
			note: 'Both axes, on the split root — stackBelow measures the padded-down width. Shared LayoutPadding scale.'
		},
		{ name: 'as', type: 'string', default: "'div'" },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-split class.' }
	];

	const fractionValues = ['1/4', '1/3', '1/2', '2/3', '3/4', 'auto'] as const;
	const stackValues = ['sm', 'md', 'lg'] as const;

	const stackPx: Record<(typeof stackValues)[number], number> = { sm: 640, md: 968, lg: 1200 };

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

	function paddingCode(padding: string): string {
		return [
			`<Split padding="${padding}">`,
			'\t<div>First</div>',
			'\t<div>Second</div>',
			'</Split>'
		].join('\n');
	}

	const demoTabs = [
		{ id: 'fraction', label: 'Fractions' },
		{ id: 'reverse', label: 'Reverse' },
		{ id: 'stack', label: 'Stacking' },
		{ id: 'padding', label: 'Padding' }
	];
</script>

<DocPage
	name="Split"
	description="Two-column layout with configurable proportions that stacks to a single column when its own width gets narrow."
	importLine={'import {Split} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Split is a layout primitive with no ARIA semantics. DOM order determines reading and focus order regardless of visual arrangement."
>
	<Tabs items={demoTabs} ariaLabel="Split demos" defaultTab="fraction">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'fraction'}
					<p class="tab-note">
						<code>fraction</code> is the first column's share. <code>auto</code> sizes the first
						column to its content and gives the rest to the second. Below the
						<code>stackBelow</code> width (default <code>sm</code>, 640px of the Split's own width)
						the columns stack.
					</p>
					<Tabs
						items={fractionValues.map((f) => ({ id: f.replace('/', '-'), label: f }))}
						ariaLabel="Fraction value"
						defaultTab="1-2"
					>
						{#snippet panel(fItem)}
							{@const fraction = fItem.id.replace('-', '/') as (typeof fractionValues)[number]}
							<div class="inner-tab">
								<Example code={fractionCode(fraction)}>
									<Split {fraction} gap="md">
										<div class="demo-pane demo-pane--a">
											{fraction === 'auto' ? 'Sized to content' : 'First'}
										</div>
										<div class="demo-pane demo-pane--b">Second</div>
									</Split>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'reverse'}
					<p class="tab-note">
						<code>reverse</code> swaps the columns with CSS <code>order</code> — the DOM is untouched,
						so screen readers and Tab order still follow source order. Useful for alternating media/text
						rows.
					</p>
					<Example code={reverseCode}>
						<Split fraction="1/3" gap="md" reverse>
							<div class="demo-pane demo-pane--a">DOM first (visual right)</div>
							<div class="demo-pane demo-pane--b">DOM second (visual left)</div>
						</Split>
					</Example>
				{:else if item.id === 'stack'}
					<p class="tab-note">
						The Split stacks when its own width drops under the chosen width token (sm 640px, md
						968px, lg 1200px). The threshold resolves through
						<code>var(--hz-width-*)</code>, so overriding those tokens — globally or on any ancestor
						— retunes when it stacks. Use the slider to cross the threshold.
					</p>
					<Tabs
						items={stackValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="stackBelow value"
						defaultTab="sm"
					>
						{#snippet panel(sItem)}
							{@const value = sItem.id as (typeof stackValues)[number]}
							<div class="inner-tab">
								<Container breakout padding="none">
									<Example code={stackCode(value)}>
										<ResizableDemo
											initial={value === 'sm' ? 720 : stackPx[value] + 100}
											describe={stackBand(stackPx[value])}
										>
											<Split stackBelow={value} gap="md">
												<div class="demo-pane demo-pane--a">First</div>
												<div class="demo-pane demo-pane--b">Second</div>
											</Split>
										</ResizableDemo>
									</Example>
								</Container>
							</div>
						{/snippet}
					</Tabs>
				{:else}
					<p class="tab-note">
						The tinted zone is the Split; the space between its edge and the panes is the padding,
						applied on both axes. It sits on the split root, so <code>stackBelow</code> measures the padded-down
						width.
					</p>
					<Tabs
						items={paddingValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Padding value"
						defaultTab="md"
					>
						{#snippet panel(padItem)}
							<div class="inner-tab">
								<Example code={paddingCode(padItem.id)}>
									<Split
										gap="md"
										padding={padItem.id as (typeof paddingValues)[number]}
										class="pad-frame"
									>
										<div class="demo-pane demo-pane--a">First</div>
										<div class="demo-pane demo-pane--b">Second</div>
									</Split>
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
	:global(.pad-frame) {
		background: color-mix(in srgb, var(--hz-color-secondary, #7c3aed) 12%, transparent);
		border: 1px dashed var(--hz-color-secondary, #7c3aed);
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
		background: color-mix(in srgb, var(--hz-color-primary, #2563eb) 20%, transparent);
		border: 1px solid var(--hz-color-primary, #2563eb);
	}
	.demo-pane--b {
		background: color-mix(in srgb, var(--hz-color-secondary, #7c3aed) 20%, transparent);
		border: 1px solid var(--hz-color-secondary, #7c3aed);
	}
</style>
