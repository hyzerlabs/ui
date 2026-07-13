<script lang="ts">
	import { Container, Grid, Tabs } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import ResizableDemo from '../../../docs/ResizableDemo.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{
			name: 'columns',
			type: 'number | { base?: number; sm?: number; md?: number; lg?: number }',
			default: '{ base: 1, sm: 2, md: 3 }',
			note: 'Container-query breakpoints — keys apply from the --hz-width-sm/md/lg tokens (640/968/1200px) of the grid’s own width; base below 640px.'
		},
		{
			name: 'gap',
			type: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
			default: "'md'",
			note: 'near/away are the density distances — they tighten inside data-density-shift regions.'
		},
		{
			name: 'align',
			type: "'start' | 'center' | 'end' | 'stretch' | 'baseline'",
			default: "'stretch'",
			note: 'Shared LayoutAlign scale (Stack/Cluster/Grid).'
		},
		{
			name: 'padding',
			type: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
			default: "'none'",
			note: 'Both axes, on the grid root — the column breakpoints measure the padded-down width. Shared LayoutPadding scale.'
		},
		{ name: 'as', type: 'string', default: "'div'" },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-grid class.' }
	];

	const gapValues = ['none', 'sm', 'md', 'lg', 'near', 'away'] as const;
	const alignValues = ['start', 'center', 'end', 'stretch', 'baseline'] as const;
	const fixedValues = [2, 3, 4, 6] as const;

	// Active column band for the resizable demo's readout — thresholds match
	// the component's container queries.
	function gridBand(w: number): string {
		if (w >= 968) return 'md band → 3 columns';
		if (w >= 640) return 'sm band → 2 columns';
		return 'base band → 1 column';
	}

	const responsiveCode = [
		'<Grid columns={{ base: 1, sm: 2, md: 3 }}>',
		'\t<Card>…</Card>',
		'\t<!-- … -->',
		'</Grid>'
	].join('\n');

	function fixedCode(n: number): string {
		return [`<Grid columns={${n}}>`, '\t<div>Cell</div>', '\t<!-- … -->', '</Grid>'].join('\n');
	}

	function gapCode(gap: string): string {
		return [`<Grid columns={3} gap="${gap}">`, '\t<div>Cell</div>', '\t<!-- … -->', '</Grid>'].join(
			'\n'
		);
	}

	function alignCode(align: string): string {
		return [
			`<Grid columns={3} align="${align}">`,
			'\t<div>Short</div>',
			'\t<div>Taller cell…</div>',
			'\t<div>Tallest cell…</div>',
			'</Grid>'
		].join('\n');
	}

	const paddingValues = ['none', 'sm', 'md', 'lg', 'near', 'away'] as const;

	function paddingCode(padding: string): string {
		return [
			`<Grid columns={3} padding="${padding}">`,
			'\t<div>Cell</div>',
			'\t<!-- … -->',
			'</Grid>'
		].join('\n');
	}

	const demoTabs = [
		{ id: 'responsive', label: 'Responsive' },
		{ id: 'fixed', label: 'Fixed columns' },
		{ id: 'gap', label: 'Gap' },
		{ id: 'align', label: 'Align' },
		{ id: 'padding', label: 'Padding' }
	];
</script>

<DocPage
	name="Grid"
	description="Responsive CSS grid that adapts its column count to its own width via container queries."
	importLine={'import {Grid} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Grid is a layout primitive with no ARIA semantics. Reading and focus order follow DOM order."
>
	<Tabs items={demoTabs} ariaLabel="Grid demos" defaultTab="responsive">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'responsive'}
					<p class="tab-note">
						Column counts are <em>container queries</em> against the Grid's own width — a Grid in a
						sidebar and one in a hero pick their own layouts independently of the window. Keys
						apply from the width tokens: <code>sm</code> from 640px, <code>md</code> from 968px,
						<code>lg</code> from 1200px; <code>base</code> below. Use the slider to change the
						grid's width.
					</p>
					<Container breakout padding="none">
						<Example code={responsiveCode}>
							<ResizableDemo initial={720} describe={gridBand}>
								<Grid columns={{ base: 1, sm: 2, md: 3 }} gap="sm">
									{#each Array.from({ length: 6 }, (_, k) => k) as i (i)}
										<div class="demo-cell">Cell {i + 1}</div>
									{/each}
								</Grid>
							</ResizableDemo>
						</Example>
					</Container>
				{:else if item.id === 'fixed'}
					<p class="tab-note">
						A number gives the same column count at every width — no responsive behavior.
					</p>
					<Tabs
						items={fixedValues.map((v) => ({ id: String(v), label: String(v) }))}
						ariaLabel="Column count"
						defaultTab="4"
					>
						{#snippet panel(colItem)}
							{@const n = Number(colItem.id)}
							<div class="inner-tab">
								<Example code={fixedCode(n)}>
									<Grid columns={n} gap="sm">
										{#each Array.from({ length: n * 2 }, (_, k) => k) as i (i)}
											<div class="demo-cell">Cell {i + 1}</div>
										{/each}
									</Grid>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'gap'}
					<p class="tab-note">
						<code>near</code> and <code>away</code> are the
						<a href="/foundation/spacing">density distances</a> — context-aware values that tighten
						inside <code>data-density-shift</code> regions.
					</p>
					<Tabs
						items={gapValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Gap value"
						defaultTab="md"
					>
						{#snippet panel(gapItem)}
							<div class="inner-tab">
								<Example code={gapCode(gapItem.id)}>
									<Grid columns={3} gap={gapItem.id as (typeof gapValues)[number]}>
										{#each Array.from({ length: 6 }, (_, k) => k) as i (i)}
											<div class="demo-cell">Cell {i + 1}</div>
										{/each}
									</Grid>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'align'}
					<p class="tab-note">
						<code>align</code> maps to <code>align-items</code> — visible when cells in the same row
						have different heights. The default <code>stretch</code> equalizes them.
					</p>
					<Tabs
						items={alignValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Align value"
						defaultTab="stretch"
					>
						{#snippet panel(aItem)}
							<div class="inner-tab">
								<Example code={alignCode(aItem.id)}>
									<Grid columns={3} gap="sm" align={aItem.id as (typeof alignValues)[number]}>
										<div class="demo-cell">Short</div>
										<div class="demo-cell">
											Taller cell with a second line of content to change its height.
										</div>
										<div class="demo-cell">
											Tallest cell — three lines of content so the cross-axis difference between
											the align values is easy to see in the row.
										</div>
									</Grid>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else}
					<p class="tab-note">
						The tinted zone is the Grid; the space between its edge and the cells is the padding,
						applied on both axes. It sits on the grid root, so the column breakpoints measure the
						padded-down width.
					</p>
					<Tabs
						items={paddingValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Padding value"
						defaultTab="md"
					>
						{#snippet panel(padItem)}
							<div class="inner-tab">
								<Example code={paddingCode(padItem.id)}>
									<Grid
										columns={3}
										gap="sm"
										padding={padItem.id as (typeof paddingValues)[number]}
										class="pad-frame"
									>
										{#each Array.from({ length: 3 }, (_, k) => k) as i (i)}
											<div class="demo-cell">Cell {i + 1}</div>
										{/each}
									</Grid>
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
	.tab-content {
		padding-top: 1rem;
	}
	.inner-tab {
		padding-top: 0.5rem;
	}
	.tab-note {
		margin: 0 0 1rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
	.tab-note code {
		font-family: var(--hz-font-family-mono, monospace);
	}
	:global(.pad-frame) {
		background: color-mix(in srgb, var(--hz-color-secondary, #7c3aed) 12%, transparent);
		border: 1px dashed var(--hz-color-secondary, #7c3aed);
		border-radius: var(--hz-radius-sm, 0.25rem);
	}
	.demo-cell {
		padding: 1rem;
		background: color-mix(in srgb, var(--hz-color-primary, #2563eb) 15%, transparent);
		border: 1px solid var(--hz-color-primary, #2563eb);
		border-radius: var(--hz-radius-sm, 0.25rem);
		font-size: var(--hz-font-size-sm, 0.875rem);
		text-align: center;
	}
</style>
