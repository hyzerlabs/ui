<script lang="ts">
	import { Table, Tabs, Pagination, Stack, Cluster, Button, Alert, Container } from '$lib';
	import { SvelteSet } from 'svelte/reactivity';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { tableDoc } from '../../../../docs/data/table.js';
	import Example from '../../../../docs/Example.svelte';
	import ResizableDemo from '../../../../docs/ResizableDemo.svelte';
	import type { TableColumn, TableSort } from '$lib/types';
	import IconInfo from '$lib/icons/generated/info.svelte';

	interface Disc {
		id: string;
		name: string;
		type: string;
		speed: number;
		price: number;
	}

	const discs: Disc[] = [
		{ id: 'd1', name: 'Voyager', type: 'Distance', speed: 9, price: 19.99 },
		{ id: 'd2', name: 'Aviar', type: 'Putter', speed: 2, price: 9.99 },
		{ id: 'd3', name: 'Roc', type: 'Midrange', speed: 5, price: 14.99 },
		{ id: 'd4', name: 'Wraith', type: 'Distance', speed: 11, price: 21.99 },
		{ id: 'd5', name: 'Buzzz', type: 'Midrange', speed: 5, price: 15.99 },
		{ id: 'd6', name: 'Judge', type: 'Putter', speed: 2, price: 11.99 },
		{ id: 'd7', name: 'Firebird', type: 'Distance', speed: 9, price: 18.99 },
		{ id: 'd8', name: 'Zone', type: 'Midrange', speed: 4, price: 13.99 }
	];

	const columns: TableColumn<Disc>[] = [
		{ key: 'name', header: 'Name', sortable: true },
		{ key: 'type', header: 'Type', sortable: true },
		{ key: 'speed', header: 'Speed', sortable: true, align: 'end' },
		{ key: 'price', header: 'Price', sortable: true, align: 'end', width: '7rem' }
	];

	// ------------------------------------------------------------------
	// Demo 1 — basic
	// ------------------------------------------------------------------

	// `columns[].key` is a property name on every row in `items` — the
	// column reads `row[key]` by default, so the two shapes have to agree.
	// `header` doubles as the stacked-mode label; it doesn't have to match
	// `key`'s casing or wording.
	const basicCode = [
		'interface Disc {',
		'\tid: string;',
		'\tname: string;',
		'\ttype: string;',
		'\tspeed: number;',
		'\tprice: number;',
		'}',
		'',
		'const items: Disc[] = [',
		"\t{ id: 'd1', name: 'Voyager', type: 'Distance', speed: 9, price: 19.99 },",
		"\t{ id: 'd2', name: 'Aviar', type: 'Putter', speed: 2, price: 9.99 },",
		'\t// …',
		'];',
		'',
		"// Each column's `key` names a Disc property — Table renders `row[key]`",
		'// by default (String(row.name), String(row.price), …).',
		'const columns: TableColumn<Disc>[] = [',
		"\t{ key: 'name', header: 'Name', sortable: true },",
		"\t{ key: 'type', header: 'Type', sortable: true },",
		"\t{ key: 'speed', header: 'Speed', sortable: true, align: 'end' },",
		"\t{ key: 'price', header: 'Price', sortable: true, align: 'end', width: '7rem' }",
		'];',
		'',
		'<Table {items} {columns} caption="Discs" />'
	].join('\n');

	// ------------------------------------------------------------------
	// Demo 2 — sorting (client + clientSort={false})
	// ------------------------------------------------------------------

	let clientSortState: TableSort | null = $state(null);

	const clientSortCode = [
		'<!-- clientSort defaults to true — Table reorders `items` itself. -->',
		'<Table {items} {columns} caption="Discs sorted client-side" bind:sort />'
	].join('\n');

	// External ordering — Table only reports/marks sort state; the demo
	// reorders a local copy itself, proving the two coexist.
	let externalSort: TableSort | null = $state(null);
	const externallyOrdered = $derived.by(() => {
		if (!externalSort) return discs;
		const dir = externalSort.direction === 'asc' ? 1 : -1;
		const key = externalSort.key as keyof Disc;
		return [...discs].sort((a, b) => {
			const av = a[key];
			const bv = b[key];
			if (typeof av === 'number' && typeof bv === 'number') return dir * (av - bv);
			return dir * String(av).localeCompare(String(bv));
		});
	});

	const externalSortCode = [
		'let items = $state(discs);',
		'let sort = $state(null);',
		'',
		'// clientSort={false}: Table leaves `items` alone — YOU reorder it.',
		'$effect(() => {',
		'\tif (sort) items = reorder(discs, sort);',
		'});',
		'',
		'<Table {items} {columns} clientSort={false} bind:sort caption="Discs, externally ordered" />'
	].join('\n');

	// ------------------------------------------------------------------
	// Demo 2b — no sorting (plain, PropsTable-style columns config)
	// ------------------------------------------------------------------

	const plainColumns: TableColumn<Disc>[] = [
		{ key: 'name', header: 'Name' },
		{ key: 'type', header: 'Type' },
		{ key: 'price', header: 'Price', align: 'end' }
	];

	const plainCode = [
		'const columns: TableColumn<Disc>[] = [',
		"\t{ key: 'name', header: 'Name' },",
		"\t{ key: 'type', header: 'Type' },",
		"\t{ key: 'price', header: 'Price', align: 'end' }",
		'];',
		'',
		'<Table {items} {columns} caption="Discs" />'
	].join('\n');

	// ------------------------------------------------------------------
	// Demo 3 — selection
	// ------------------------------------------------------------------

	const selected = new SvelteSet<string>();
	const selectedNames = $derived(discs.filter((d) => selected.has(d.id)).map((d) => d.name));

	const selectionCode = [
		'const selected = new SvelteSet<string>();',
		'',
		'<Table',
		'\t{items}',
		'\t{columns}',
		'\tcaption="Select discs"',
		'\tselectable',
		'\tbind:selected',
		'\tgetRowId={(row) => row.id}',
		'/>'
	].join('\n');

	// ------------------------------------------------------------------
	// Demo 4 — sticky header inside a capped wrap
	// ------------------------------------------------------------------

	const manyDiscs: Disc[] = Array.from({ length: 16 }, (_, i) => ({
		...discs[i % discs.length],
		id: `sticky-${i}`,
		name: `${discs[i % discs.length].name} #${i + 1}`
	}));

	const stickyCode = [
		'<div class="scroll-wrap">',
		'\t<Table {items} {columns} caption="Discs (scroll for more)" stickyHeader />',
		'</div>',
		'',
		'/* your CSS */',
		'.scroll-wrap .hz-table-wrap { max-height: 16rem; overflow-y: auto; }'
	].join('\n');

	// ------------------------------------------------------------------
	// Demo 5 — stacked mode
	// ------------------------------------------------------------------

	// sm (640px) is the recommended default threshold — tables only stack on
	// genuinely narrow viewports (user decision 2026-07-23); md/lg stay
	// available for tables with many/wide columns that need to shed the
	// table layout earlier.
	const stackedCode = [
		'<Table {items} {columns} caption="Discs" stack="sm" />',
		'',
		'/* stacks below --hz-width-sm (640px); a real table at/above it */'
	].join('\n');

	function stackedDescribe(w: number): string {
		return w >= 640 ? 'table (640px+)' : 'stacked (< 640px)';
	}

	// ------------------------------------------------------------------
	// Demo 6 — empty / loading
	// ------------------------------------------------------------------

	let showLoading = $state(false);
	let showEmpty = $state(false);

	const emptyLoadingCode = $derived(
		[
			`<Table`,
			`\titems={${showEmpty ? '[]' : 'discs'}}`,
			'\t{columns}',
			'\tcaption="Discs"',
			showLoading ? '\tloading' : undefined,
			'/>'
		]
			.filter(Boolean)
			.join('\n')
	);

	// ------------------------------------------------------------------
	// Demo 7 — composition with Pagination
	// ------------------------------------------------------------------

	const bigCatalog: Disc[] = Array.from({ length: 22 }, (_, i) => ({
		...discs[i % discs.length],
		id: `page-${i}`,
		name: `${discs[i % discs.length].name} #${i + 1}`
	}));

	const PER_PAGE = 6;
	let catalogPage = $state(1);
	const pageCount = Math.ceil(bigCatalog.length / PER_PAGE);
	const visibleCatalog = $derived(
		bigCatalog.slice((catalogPage - 1) * PER_PAGE, catalogPage * PER_PAGE)
	);

	const paginationCode = [
		'const PER_PAGE = 6;',
		'let page = $state(1);',
		'const visible = $derived(catalog.slice((page - 1) * PER_PAGE, page * PER_PAGE));',
		'',
		'<Table items={visible} {columns} caption="Discs" />',
		'<Pagination count={pageCount} bind:page ariaLabel="Discs pages" />'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'sort', label: 'Sort' },
		{ id: 'selection', label: 'Selection' },
		{ id: 'sticky', label: 'Sticky header' },
		{ id: 'stacked', label: 'Stacked mode' },
		{ id: 'empty-loading', label: 'Empty / loading' },
		{ id: 'pagination', label: 'With Pagination' }
	];

	// Sort tab — nested sub-tabs (inner-Tabs pattern, per the layout pages'
	// padding-value sub-tabs) so client-sort/external-sort/no-sorting sit as
	// natural siblings instead of stacked Examples under one crowded tab, and
	// the top tab row doesn't grow another entry per sort variant.
	const sortTabs = [
		{ id: 'client', label: 'Client-side' },
		{ id: 'external', label: 'External' },
		{ id: 'no-sorting', label: 'No sorting' }
	];
</script>

<DocPage name="Table" {...tableDoc}>
	<Alert intent="info" title="Large datasets">
		{#snippet icon()}<IconInfo />{/snippet}
		Real <code>&lt;table&gt;</code> semantics here give you native screen-reader table navigation
		for free — reach for it up to some thousands of rows. Past the point where rendering every
		<code>&lt;tr&gt;</code> becomes the bottleneck, see the
		<a href="/docs/patterns/virtualized-table">Virtualized table</a> pattern, which windows an ARIA
		table with <a href="/docs/components/virtualizer">Virtualizer</a> instead.
	</Alert>
	<Tabs items={demoTabs} ariaLabel="Table demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<Example code={basicCode}>
						<Table items={discs} {columns} caption="Discs" />
					</Example>
				{:else if item.id === 'sort'}
					<Tabs items={sortTabs} ariaLabel="Sort demos" defaultTab="client">
						{#snippet panel(sortItem)}
							<div class="inner-tab">
								{#if sortItem.id === 'client'}
									<p class="tab-note">
										<code>clientSort</code> (default) reorders <code>items</code> itself.
									</p>
									<Example code={clientSortCode}>
										<Table
											items={discs}
											{columns}
											caption="Discs sorted client-side"
											bind:sort={clientSortState}
										/>
									</Example>
								{:else if sortItem.id === 'external'}
									<p class="tab-note">
										With <code>clientSort={'{false}'}</code>, Table only reports/marks the sort
										state — this demo reorders its own local array in response.
									</p>
									<Example code={externalSortCode}>
										<Table
											items={externallyOrdered}
											{columns}
											clientSort={false}
											bind:sort={externalSort}
											caption="Discs, externally ordered"
										/>
									</Example>
								{:else}
									<p class="tab-note">
										Columns are sortable only when their own <code>sortable</code> flag says so —
										the plain columns config below (like the docs' own <code>PropsTable</code>)
										omits it, so no column renders a sort button and none carries
										<code>aria-sort</code>.
									</p>
									<Example code={plainCode}>
										<Table items={discs} columns={plainColumns} caption="Discs" />
									</Example>
								{/if}
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'selection'}
					<p class="selection-readout" aria-live="polite">
						Selected: {selectedNames.length === 0 ? 'none' : selectedNames.join(', ')}
					</p>
					<Example code={selectionCode}>
						<Table
							items={discs}
							{columns}
							caption="Select discs"
							selectable
							{selected}
							getRowId={(row) => (row as Disc).id}
						/>
					</Example>
				{:else if item.id === 'sticky'}
					<p class="tab-note">
						<code>stickyHeader</code> pins <code>thead</code> against the wrap's own scroll — cap
						<code>.hz-table-wrap</code>'s height (here, from a wrapping <code>div</code>) to see it
						scroll.
					</p>
					<Example code={stickyCode}>
						<div class="scroll-wrap">
							<Table items={manyDiscs} {columns} caption="Discs (scroll for more)" stickyHeader />
						</div>
					</Example>
				{:else if item.id === 'stacked'}
					<p class="tab-note">
						Below <code>--hz-width-sm</code> (640px) each row becomes a label/value block instead of
						scrolling horizontally — <code>sm</code> is the recommended default so tables only stack
						on genuinely narrow viewports; <code>md</code>/<code>lg</code> are still available for tables
						with many or wide columns. Drag the slider across the threshold to see it engage.
					</p>
					<Container breakout padding="none">
						<Example code={stackedCode}>
							<ResizableDemo initial={720} min={320} max={1000} describe={stackedDescribe}>
								<Table items={discs} {columns} caption="Discs" stack="sm" />
							</ResizableDemo>
						</Example>
					</Container>
				{:else if item.id === 'empty-loading'}
					<Stack gap="sm">
						<Cluster gap="sm">
							<Button size="sm" variant="outline" onclick={() => (showLoading = !showLoading)}>
								{showLoading ? 'Stop loading' : 'Simulate loading'}
							</Button>
							<Button size="sm" variant="outline" onclick={() => (showEmpty = !showEmpty)}>
								{showEmpty ? 'Restore rows' : 'Clear items'}
							</Button>
						</Cluster>
						<Example code={emptyLoadingCode}>
							<Table
								items={showEmpty ? [] : discs}
								{columns}
								caption="Discs"
								loading={showLoading}
							/>
						</Example>
					</Stack>
				{:else}
					<p class="tab-note">
						Built-in pagination isn't in scope — compose <code>Pagination</code>
						alongside Table instead, as this demo does over a 22-item catalog.
					</p>
					<Example code={paginationCode}>
						<Stack gap="sm">
							<Table items={visibleCatalog} {columns} caption="Discs" />
							<Pagination count={pageCount} bind:page={catalogPage} ariaLabel="Discs pages" />
						</Stack>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	/* .tab-content and .tab-note are shared docs conventions from docs.css —
	 * only page-specific pieces are styled here. */

	.selection-readout {
		margin: 0 0 0.75rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.scroll-wrap :global(.hz-table-wrap) {
		max-height: 16rem;
		overflow-y: auto;
	}
</style>
