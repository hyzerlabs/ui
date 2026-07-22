<script lang="ts">
	import { Virtualizer, Tabs, Alert } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'items', type: 'T[]', default: '—', note: 'Required.' },
		{
			name: 'itemHeight',
			type: 'number | ((item: T, index: number) => number)',
			default: '—',
			note: 'Required. A fixed px height (uniform), or a per-item height function (known-variable). The estimate/seed when measure is true.'
		},
		{
			name: 'height',
			type: 'number',
			default: '—',
			note: 'Optional — omit for fluid. Viewport extent in px for fixed, SSR-exact windowing. Omitted, the viewport is fluid: CSS-size it and the component measures its own box at runtime.'
		},
		{
			name: 'measure',
			type: 'boolean',
			default: 'false',
			note: 'Runtime-measures each rendered row via ResizeObserver; itemHeight becomes the seed estimate for unmeasured rows.'
		},
		{
			name: 'overscan',
			type: 'number',
			default: '3',
			note: 'Extra rows rendered above/below the visible span.'
		},
		{
			name: 'row',
			type: 'Snippet<[T, number]>',
			default: '—',
			note: 'Required. Renders one row — see the row snippet signature below.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-virtualizer class.' }
	];

	const itemHeightType: PropRow[] = [
		{
			name: 'number',
			type: 'number',
			default: '—',
			note: 'Uniform row height in px — the O(1) fast path (no measure).'
		},
		{
			name: '(item, index) => number',
			type: '(item: T, index: number) => number',
			default: '—',
			note: 'Known-variable — a per-row height resolved from the item/index.'
		}
	];

	const rowSnippetType: PropRow[] = [
		{ name: 'item', type: 'T', default: '—', note: 'The array element rendered by this row.' },
		{
			name: 'index',
			type: 'number',
			default: '—',
			note: "The item's absolute index in items — not the window-local render position — so keys, striping, and aria-posinset stay correct despite windowing."
		}
	];

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
		'\t\t<div class="demo-row" style="height: 100%">Row {index} — {item.lines} line(s)</div>',
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
		'\t{#snippet row(item, index)}',
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

<DocPage
	name="Virtualizer"
	description="A headless windowing primitive that renders only the visible slice of a huge items array — uniform, known-variable, or runtime-measured row heights."
	importLine={'import {Virtualizer} from "@hyzer-labs/ui"'}
	{props}
	types={[
		{ name: 'itemHeight (union)', props: itemHeightType },
		{ name: 'row snippet — Snippet<[item, index]>', props: rowSnippetType }
	]}
	a11yNote="Virtualizer is role-neutral by design: it applies no `role`, `aria-*`, or `tabindex` of its own — it's a rendering optimization, not a widget, so all semantics come from the `row` snippet and `...rest` on the viewport. Because windowing removes off-screen rows from the DOM, any count-dependent semantics must be supplied explicitly: set `aria-setsize` to the total item count and `aria-posinset` to the row's absolute index plus one, using the absolute index the snippet receives, so assistive tech announces 'item N of total' correctly despite the elided DOM — see the List semantics demo below. A keyboard-scrollable viewport is opt-in via a `tabindex` of 0 (plus a `role`/label) through `...rest`; the component adds no key handling of its own. Virtualization can scroll a focused row out of the DOM — a known windowing hazard — so patterns that need a persistently focused off-screen row (e.g. `aria-activedescendant` listboxes) should keep the active row rendered rather than reaching for the raw Virtualizer."
>
	<Alert intent="info" title="Tabular data">
		Windowing a real <code>&lt;table&gt;</code> doesn't work — a
		<code>&lt;tr&gt;</code> outside a <code>&lt;table&gt;</code> loses its row semantics. For
		tabular data, prefer the real <a href="/components/table">Table</a> component up to some
		thousands of rows; past that, see the
		<a href="/patterns/virtualized-table">Virtualized table</a>
		pattern, which builds ARIA table semantics — <code>role="table"</code>, <code>"row"</code>,
		<code>"columnheader"</code>, <code>"cell"</code> — around this component instead.
	</Alert>
	<Tabs items={demoTabs} ariaLabel="Virtualizer demos" defaultTab="uniform">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'uniform'}
					<p class="tab-note">
						10,000 rows, but the DOM only ever holds the visible slice plus overscan — inspect the
						element to see only a handful of <code>.hz-virtualizer-row</code> nodes at any time.
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
						<code>itemHeight</code> as a function resolves a different height per row — offsets are a
						prefix-sum, windowed with a binary search.
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
									Row {index} — {item.lines} line(s)
								</div>
							{/snippet}
						</Virtualizer>
					</Example>
				{:else if item.id === 'measured'}
					<p class="tab-note">
						<code>measure</code> runtime-measures each rendered row via <code>ResizeObserver</code>
						—
						<code>itemHeight</code> is only the seed estimate. This narrow column wraps some rows onto
						multiple lines, so their real height isn't known ahead of time; it's corrected right after
						mount.
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
						Windowing elides off-screen rows, so a screen reader can't count them natively. Setting
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
						fluid viewport <strong>must</strong> be height-constrained by CSS — a sized parent plus
						<code>height: 100%</code>, a flex track, or <code>max-height</code> — because an
						unconstrained <code>overflow: auto</code> box grows to fit its content and windowing degenerates
						to rendering nearly everything. Drag the container's resize handle (bottom-right corner) to
						see it re-window with no scroll event.
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
	 * Virtualizer-R14 fluid demo: this container is the CSS size source — the
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
