<script lang="ts">
	import { Container, Grid, Stack, Tabs } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { gridDoc } from '../../../../docs/data/grid.js';
	import Example from '../../../../docs/Example.svelte';
	import ResizableDemo from '../../../../docs/ResizableDemo.svelte';

	const gapValues = ['none', 'sm', 'md', 'lg', 'near', 'away'] as const;
	const alignValues = ['start', 'center', 'end', 'stretch', 'baseline'] as const;
	const fixedValues = [2, 3, 4, 6] as const;

	// Active column band for the resizable demo's readout — thresholds match
	// the component's container queries.
	function gridBand(w: number): string {
		if (w >= 968) return 'lg band → 3 columns';
		if (w >= 640) return 'md band → 2 columns';
		return 'sm band → 1 column';
	}

	const responsiveCode = [
		'<Grid columns={{ sm: 1, md: 2, lg: 3 }}>',
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
			`<Grid columns={3} padding="${padding}">…</Grid>`,
			`<Grid columns={3} paddingInline="${padding}">…</Grid>`,
			`<Grid columns={3} paddingBlock="${padding}">…</Grid>`
		].join('\n');
	}

	const fluidCode = [
		"<Grid columns={{ min: '12rem' }}>",
		'\t<Card>…</Card>',
		'\t<!-- … -->',
		'</Grid>'
	].join('\n');

	// Expected auto-fit column count for the fluid demo readout
	// (min 12rem = 192px, gap sm = 16px).
	function fluidBand(w: number): string {
		const n = Math.max(1, Math.floor((w + 16) / (192 + 16)));
		return `${n} column${n === 1 ? '' : 's'}`;
	}

	const demoTabs = [
		{ id: 'responsive', label: 'Responsive' },
		{ id: 'fluid', label: 'Fluid' },
		{ id: 'fixed', label: 'Fixed columns' },
		{ id: 'gap', label: 'Gap' },
		{ id: 'align', label: 'Align' },
		{ id: 'padding', label: 'Padding' }
	];
</script>

<DocPage name="Grid" {...gridDoc}>
	<Tabs items={demoTabs} ariaLabel="Grid demos" defaultTab="responsive">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'responsive'}
					<p class="tab-note">
						Column counts are <em>container queries</em> against the Grid's own width. A Grid in a
						sidebar and one in a hero each pick their own layout, whatever the window is doing. Each
						key names the band ending at its width token: <code>sm</code> below 640px,
						<code>md</code>
						to 968px, <code>lg</code> to 1200px, <code>xl</code> beyond. Use the slider to change the
						grid's width.
					</p>
					<Container breakout padding="none">
						<Example code={responsiveCode}>
							<ResizableDemo initial={720} describe={gridBand}>
								<Grid columns={{ sm: 1, md: 2, lg: 3 }} gap="sm">
									{#each Array.from({ length: 6 }, (_, k) => k) as i (i)}
										<div class="demo-cell">Cell {i + 1}</div>
									{/each}
								</Grid>
							</ResizableDemo>
						</Example>
					</Container>
				{:else if item.id === 'fluid'}
					<p class="tab-note">
						<code>columns={'{{ min: … }}'}</code> fits as many equal tracks as have at least
						<code>min</code> room, with no breakpoints at all. The band thresholds are fixed
						constants, but <code>min</code> takes any length, <code>var()</code>
						<em>included</em>, so you can drive this mode from tokens and overrides. Reach for it
						when the real requirement is "cards at least this wide".
					</p>
					<Container breakout padding="none">
						<Example code={fluidCode}>
							<ResizableDemo initial={720} describe={fluidBand}>
								<Grid columns={{ min: '12rem' }} gap="sm">
									{#each Array.from({ length: 8 }, (_, k) => k) as i (i)}
										<div class="demo-cell">Cell {i + 1}</div>
									{/each}
								</Grid>
							</ResizableDemo>
						</Example>
					</Container>
				{:else if item.id === 'fixed'}
					<p class="tab-note">
						A number gives the same column count at every width, with no responsive behavior.
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
						<a href="/docs/foundation/spacing">density distances</a>: context-aware values that
						tighten inside <code>data-density-shift</code> regions.
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
						<code>align</code> maps to <code>align-items</code>. You see it when cells in the same
						row have different heights; the default <code>stretch</code> makes them equal.
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
											Tallest cell — three lines of content, so the cross-axis difference between
											align values shows clearly in the row.
										</div>
									</Grid>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else}
					<p class="tab-note">
						The tinted zone is the Grid; the space between its edge and the cells is the padding. It
						sits on the grid root, so the column breakpoints measure the padded-down width.
						<code>padding</code> applies on both axes; <code>paddingInline</code> /
						<code>paddingBlock</code> override one axis and win where set. The axis names are the
						CSS logical properties, so they stay correct in RTL and vertical writing modes. See
						<a href="/docs/foundation/spacing#axes-heading">Spacing &amp; Sizing</a>.
					</p>
					<Tabs
						items={paddingValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Padding value"
						defaultTab="md"
					>
						{#snippet panel(padItem)}
							{@const v = padItem.id as (typeof paddingValues)[number]}
							<div class="inner-tab">
								<Example code={paddingCode(padItem.id)}>
									<Stack gap="sm">
										<Grid columns={3} gap="sm" padding={v} class="pad-frame">
											<div class="demo-cell">padding="{v}"</div>
											<div class="demo-cell">Cell 2</div>
											<div class="demo-cell">Cell 3</div>
										</Grid>
										<Grid columns={3} gap="sm" paddingInline={v} class="pad-frame">
											<div class="demo-cell">paddingInline="{v}"</div>
											<div class="demo-cell">Cell 2</div>
											<div class="demo-cell">Cell 3</div>
										</Grid>
										<Grid columns={3} gap="sm" paddingBlock={v} class="pad-frame">
											<div class="demo-cell">paddingBlock="{v}"</div>
											<div class="demo-cell">Cell 2</div>
											<div class="demo-cell">Cell 3</div>
										</Grid>
									</Stack>
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
		background: color-mix(in srgb, var(--hz-intent-secondary, #7c3aed) 12%, transparent);
		border: 1px dashed var(--hz-intent-secondary, #7c3aed);
		border-radius: var(--hz-radius-sm, 0.25rem);
	}
	.demo-cell {
		padding: 1rem;
		background: color-mix(in srgb, var(--hz-intent-primary, #2563eb) 15%, transparent);
		border: 1px solid var(--hz-intent-primary, #2563eb);
		border-radius: var(--hz-radius-sm, 0.25rem);
		font-size: var(--hz-font-size-sm, 0.875rem);
		text-align: center;
	}
</style>
