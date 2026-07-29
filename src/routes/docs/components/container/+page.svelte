<script lang="ts">
	import { Container, Stack, Tabs, CodeBlock } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { containerDoc } from '../../../../docs/data/container.js';
	import Example from '../../../../docs/Example.svelte';

	const maxValues = ['sm', 'md', 'lg', 'xl', 'full'] as const;
	const paddingValues = ['none', 'sm', 'md', 'lg', 'near', 'away'] as const;

	const widthPx: Record<(typeof maxValues)[number], string> = {
		sm: '640px',
		md: '968px',
		lg: '1200px',
		xl: '1440px',
		full: 'no cap'
	};

	const maxCode = maxValues
		.map((v) => `<Container max="${v}" center={false}>…</Container>`)
		.join('\n');

	function paddingCode(padding: string): string {
		return [
			`<Container padding="${padding}">…</Container>`,
			`<Container padding="none" paddingInline="${padding}">…</Container>`,
			`<Container padding="none" paddingBlock="${padding}">…</Container>`
		].join('\n');
	}

	const centerCode = [
		'<Container max="sm">Centered (default)</Container>',
		'<Container max="sm" center={false}>Flush left</Container>'
	].join('\n');

	const breakoutCode = [
		'<!-- Escapes the prose column to span the nearest inline-size container -->',
		'<!-- (set container-type: inline-size on your layout root; falls back to the viewport). -->',
		'<!-- Centered column assumed; start-aligned layouts set --hz-breakout-shift: 0. -->',
		'<Container breakout padding="none">Full-bleed demo, hero, or media</Container>'
	].join('\n');

	const demoTabs = [
		{ id: 'max', label: 'Max width' },
		{ id: 'padding', label: 'Padding' },
		{ id: 'center', label: 'Centering' },
		{ id: 'breakout', label: 'Breakout' }
	];
</script>

<DocPage name="Container" {...containerDoc}>
	<Tabs items={demoTabs} ariaLabel="Container demos" defaultTab="max">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'max'}
					<Container breakout padding="none">
						<Example code={maxCode}>
							<div class="maxw-scroll">
								<div class="maxw-canvas">
									{#each maxValues as v (v)}
										<Container max={v} padding="none" center={false} class="maxw-bar">
											<span class="maxw-label">max="{v}" · {widthPx[v]}</span>
										</Container>
									{/each}
								</div>
							</div>
						</Example>
					</Container>
				{:else if item.id === 'padding'}
					<p class="tab-note">
						The tinted zone is the Container; the solid box is its content. <code>padding</code>
						applies on both axes; <code>paddingInline</code> / <code>paddingBlock</code> override
						one axis and win where set — e.g. <code>paddingBlock="none"</code> keeps the inline
						gutters when a Stack owns the vertical rhythm. The axis names are the CSS logical
						properties, so they stay correct in RTL and vertical writing modes — see
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
								<Container breakout padding="none">
									<Example code={paddingCode(padItem.id)}>
										<Stack gap="sm">
											<Container max="full" padding={v} class="pad-container">
												<div class="pad-content">padding="{v}"</div>
											</Container>
											<Container max="full" padding="none" paddingInline={v} class="pad-container">
												<div class="pad-content">paddingInline="{v}"</div>
											</Container>
											<Container max="full" padding="none" paddingBlock={v} class="pad-container">
												<div class="pad-content">paddingBlock="{v}"</div>
											</Container>
										</Stack>
									</Example>
								</Container>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'center'}
					<p class="tab-note">
						<code>center</code> only matters when the container is narrower than its parent — the
						default centers it with <code>margin-inline: auto</code>;
						<code>center={'{false}'}</code>
						leaves it flush with the start edge.
					</p>
					<Container breakout padding="none">
						<Example code={centerCode}>
							<div class="maxw-scroll">
								<div class="maxw-canvas">
									<Container max="sm" padding="none" class="maxw-bar">
										<span class="maxw-label">center (default)</span>
									</Container>
									<Container max="sm" padding="none" center={false} class="maxw-bar">
										<span class="maxw-label">center=&#123;false&#125;</span>
									</Container>
								</div>
							</div>
						</Example>
					</Container>
				{:else}
					<p class="tab-note">
						<code>breakout</code> escapes the prose column and spans the nearest ancestor with
						<code>container-type: inline-size</code> (this docs page sets one on its main content
						area; with no ancestor container it falls back to the viewport). <code>max</code> is
						ignored. By default the margin math assumes a centered column; start-aligned layouts
						like this one set <code>--hz-breakout-shift: 0</code> so the breakout grows toward the end
						edge only.
					</p>
					<Container breakout padding="none" class="breakout-demo">
						<span class="breakout-label"
							>breakout — the full content area, escaping this column</span
						>
					</Container>
					<div class="breakout-reference">the normal prose column</div>
					<CodeBlock code={breakoutCode} />
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	/* Real-width canvas: wide enough for the xl cap plus breathing room so
	 * every bar reaches its true max-width; the wrapper scrolls when the
	 * canvas exceeds the available (breakout) width. The 100px background
	 * grid gives a visual ruler. */
	.maxw-scroll {
		overflow-x: auto;
	}

	.maxw-canvas {
		min-width: 1500px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-block: 0.5rem;
		background-image: linear-gradient(
			to right,
			color-mix(in srgb, var(--hz-intent-neutral, #6b7280) 25%, transparent) 1px,
			transparent 1px
		);
		background-size: 100px 100%;
	}

	/* width: 100% is load-bearing: the containers are flex items whose auto
	 * inline margins (from `center`) cancel align-items: stretch — without an
	 * explicit width they'd shrink-wrap their labels instead of hitting max. */
	:global(.maxw-bar) {
		width: 100%;
		background-color: color-mix(in srgb, var(--hz-intent-primary, #2563eb) 15%, transparent);
		border: 1px solid var(--hz-intent-primary, #2563eb);
	}
	.maxw-label {
		display: block;
		padding: 0.375rem 0.5rem;
		font-family: var(--hz-font-family-mono, monospace);
		font-size: var(--hz-font-size-sm, 0.875rem);
		white-space: nowrap;
	}

	:global(.breakout-demo) {
		background-color: color-mix(in srgb, var(--hz-intent-secondary, #7c3aed) 15%, transparent);
		border: 1px dashed var(--hz-intent-secondary, #7c3aed);
		border-radius: var(--hz-radius-sm, 0.25rem);
		margin-bottom: 0.75rem;
	}
	.breakout-label,
	.breakout-reference {
		display: block;
		padding: 0.75rem 1rem;
		font-family: var(--hz-font-family-mono, monospace);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
	.breakout-reference {
		background-color: color-mix(in srgb, var(--hz-intent-primary, #2563eb) 15%, transparent);
		border: 1px dashed var(--hz-intent-primary, #2563eb);
		border-radius: var(--hz-radius-sm, 0.25rem);
		margin-bottom: 1rem;
	}

	/* width: 100% for the same reason as .maxw-bar — the demo containers are
	 * flex items whose auto inline margins (from `center`) cancel
	 * align-items: stretch, so without it they shrink-wrap their labels. */
	:global(.pad-container) {
		width: 100%;
		background-color: color-mix(in srgb, var(--hz-intent-primary, #2563eb) 15%, transparent);
		border: 1px dashed var(--hz-intent-primary, #2563eb);
		border-radius: var(--hz-radius-sm, 0.25rem);
	}
	.pad-content {
		padding: 0.75rem 1rem;
		background-color: var(--hz-color-surface, #fff);
		border: 1px solid var(--hz-intent-primary, #2563eb);
		border-radius: var(--hz-radius-sm, 0.25rem);
		font-family: var(--hz-font-family-mono, monospace);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
</style>
