<script lang="ts">
	import { Virtualizer, Tabs, Alert } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { virtualizerDoc } from '../../../../docs/data/virtualizer.js';
	import Example from '../../../../docs/Example.svelte';
	import IconInfo from '$lib/icons/generated/info.svelte';

	// Demo 1 — 10,000 uniform rows: only a handful of DOM nodes exist at once.
	const bigList = Array.from({ length: 10000 }, (_, i) => `Row ${i + 1}`);

	const uniformCode = [
		'const items = Array.from({ length: 10000 }, (_, i) => `Row ${i + 1}`);',
		'',
		'<Virtualizer {items} itemHeight={32} height={320}>',
		'\t{#snippet row(item, index)}',
		'\t\t<div class="demo-row">{item} <small>(#{index})</small></div>',
		'\t{/snippet}',
		'</Virtualizer>'
	].join('\n');

	// Demo 2 — known-variable heights: a per-item height function.
	interface Para {
		lines: number;
	}
	const paragraphs: Para[] = Array.from({ length: 300 }, (_, i) => ({ lines: (i % 3) + 1 }));
	function paraHeight(item: Para): number {
		return 20 + item.lines * 20;
	}

	const variableCode = [
		'function itemHeight(item: Para) {',
		'\treturn 20 + item.lines * 20;',
		'}',
		'',
		'<Virtualizer items={paragraphs} {itemHeight} height={320}>',
		'\t{#snippet row(item, index)}',
		'\t\t<div class="demo-row" style="height: 100%">Row {index}: {item.lines} line(s)</div>',
		'\t{/snippet}',
		'</Virtualizer>'
	].join('\n');

	// Demo 3 — measured mode: wrapping text of unknown height, corrected on mount.
	const notes: string[] = Array.from({ length: 200 }, (_, i) =>
		i % 4 === 0
			? 'A longer note that wraps across multiple lines in this narrow column, so its real rendered height is unknown ahead of time.'
			: `Short note ${i + 1}.`
	);

	const measuredCode = [
		'<Virtualizer {items} itemHeight={32} height={320} measure>',
		'\t{#snippet row(item)}',
		'\t\t<div class="demo-row-measured">{item}</div>',
		'\t{/snippet}',
		'</Virtualizer>'
	].join('\n');

	// Demo 4 — role="list" + aria-setsize/aria-posinset semantics.
	const semanticsCode = [
		'<Virtualizer {items} itemHeight={32} height={320} role="list" aria-label="Numbered list">',
		'\t{#snippet row(item, index)}',
		'\t\t<div role="listitem" aria-setsize={items.length} aria-posinset={index + 1} class="demo-row">',
		'\t\t\t{item}',
		'\t\t</div>',
		'\t{/snippet}',
		'</Virtualizer>'
	].join('\n');

	// Demo 5 — fluid mode: no `height` prop, CSS-sized by the consumer.
	const fluidCode = [
		'<div class="fluid-container">',
		'\t<Virtualizer {items} itemHeight={32} style="height: 100%">',
		'\t\t{#snippet row(item, index)}',
		'\t\t\t<div class="demo-row">{item} <small>(#{index})</small></div>',
		'\t\t{/snippet}',
		'\t</Virtualizer>',
		'</div>'
	].join('\n');

	const demoTabs = [
		{ id: 'uniform', label: 'Uniform (10,000 rows)' },
		{ id: 'variable', label: 'Known-variable' },
		{ id: 'measured', label: 'Measured' },
		{ id: 'semantics', label: 'List semantics' },
		{ id: 'fluid', label: 'Fluid height' }
	];
</script>

<DocPage name="Virtualizer" {...virtualizerDoc}>
	<Alert intent="info" title="Tabular data">
		{#snippet icon()}<IconInfo />{/snippet}
		Windowing a real <code>&lt;table&gt;</code> does not work: a
		<code>&lt;tr&gt;</code> outside a <code>&lt;table&gt;</code> loses its row semantics. For
		tabular data, prefer the real <a href="/docs/components/table">Table</a> component up to some
		thousands of rows. Past that, see the
		<a href="/docs/patterns/virtualized-table">Virtualized table</a>
		pattern, which builds ARIA table semantics (<code>role="table"</code>, <code>"row"</code>,
		<code>"columnheader"</code>, <code>"cell"</code>) around this component instead.
	</Alert>
	<Tabs items={demoTabs} ariaLabel="Virtualizer demos" defaultTab="uniform">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'uniform'}
					<p class="tab-note">
						10,000 rows, but the DOM only ever holds the visible slice plus overscan. Inspect the
						element and you will find only a handful of <code>.hz-virtualizer-row</code> nodes at any
						time.
					</p>
					<Example code={uniformCode}>
						<Virtualizer items={bigList} itemHeight={32} height={320} class="demo-viewport">
							{#snippet row(item, index)}
								<div class="demo-row">{item} <small>(#{index})</small></div>
							{/snippet}
						</Virtualizer>
					</Example>
				{:else if item.id === 'variable'}
					<p class="tab-note">
						<code>itemHeight</code> as a function resolves a different height per row. Offsets are a prefix
						sum, windowed with a binary search.
					</p>
					<Example code={variableCode}>
						<Virtualizer
							items={paragraphs}
							itemHeight={paraHeight}
							height={320}
							class="demo-viewport"
						>
							{#snippet row(item, index)}
								<div class="demo-row" style="height: 100%">
									Row {index}: {item.lines} line(s)
								</div>
							{/snippet}
						</Virtualizer>
					</Example>
				{:else if item.id === 'measured'}
					<p class="tab-note">
						<code>measure</code> measures each rendered row at runtime with a
						<code>ResizeObserver</code>, so <code>itemHeight</code> is only the seed estimate. This narrow
						column wraps some rows onto multiple lines, so their real height is not known ahead of time.
						Each one is corrected right after mount.
					</p>
					<Example code={measuredCode}>
						<div class="demo-narrow">
							<Virtualizer items={notes} itemHeight={32} height={320} measure class="demo-viewport">
								{#snippet row(item)}
									<div class="demo-row-measured">{item}</div>
								{/snippet}
							</Virtualizer>
						</div>
					</Example>
				{:else if item.id === 'semantics'}
					<p class="tab-note">
						Windowing elides off-screen rows, so a screen reader cannot count them natively. Setting
						<code>role="list"</code> on the viewport (via <code>...rest</code>) plus
						<code>role="listitem"</code>, <code>aria-setsize</code>, and <code>aria-posinset</code>
						on each row (using the snippet's absolute <code>index</code>) restores an accurate "item
						N of total" announcement.
					</p>
					<Example code={semanticsCode}>
						<Virtualizer
							items={bigList}
							itemHeight={32}
							height={320}
							role="list"
							aria-label="Numbered list"
							class="demo-viewport"
						>
							{#snippet row(item, index)}
								<div
									role="listitem"
									aria-setsize={bigList.length}
									aria-posinset={index + 1}
									class="demo-row"
								>
									{item}
								</div>
							{/snippet}
						</Virtualizer>
					</Example>
				{:else}
					<p class="tab-note">
						Omitting <code>height</code> puts the Virtualizer in fluid mode: it measures its own box
						with a <code>ResizeObserver</code> and windows against that instead of a fixed prop. A
						fluid viewport <strong>must</strong> be height-constrained by CSS, whether that is a
						sized parent plus <code>height: 100%</code>, a flex track, or <code>max-height</code>.
						An unconstrained <code>overflow: auto</code> box grows to fit its content, and then windowing
						renders nearly everything. Drag the container's resize handle (bottom-right corner) to see
						it re-window with no scroll event.
					</p>
					<Example code={fluidCode}>
						<div class="fluid-container">
							<Virtualizer
								items={bigList}
								itemHeight={32}
								class="demo-viewport"
								style="height: 100%"
							>
								{#snippet row(item, index)}
									<div class="demo-row">{item} <small>(#{index})</small></div>
								{/snippet}
							</Virtualizer>
						</div>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	:global(.demo-viewport) {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
	}

	.demo-narrow {
		max-width: 20rem;
	}

	/*
	 * Fluid demo: this container is the CSS size source — the
	 * Virtualizer inside carries no `height` prop and no inline height, only
	 * `style="height: 100%"`, so it fills this box and re-measures whenever it
	 * resizes. `resize: vertical` lets a visitor drag the corner to see the
	 * re-window happen without any scroll event.
	 */
	.fluid-container {
		height: 320px;
		min-height: 8rem;
		max-height: 32rem;
		overflow: hidden;
		resize: vertical;
	}

	.demo-row {
		box-sizing: border-box;
		height: 100%;
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0 0.75rem;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.demo-row small {
		color: var(--hz-color-text-muted, #6b7280);
	}

	.demo-row-measured {
		box-sizing: border-box;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
</style>
