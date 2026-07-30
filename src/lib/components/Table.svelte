<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import type { TableColumn, TableSort } from '$lib/types';
	import { cx } from '$lib/utils';
	import IconChevronUp from '$lib/icons/generated/chevron-up.svelte';
	import IconChevronDown from '$lib/icons/generated/chevron-down.svelte';

	// ---------------------------------------------------------------------------
	// Table (specs/37) — data table with client sorting, row selection, sticky
	// header, empty/loading states, and an opt-in stacked mode below a named
	// width. Headless: real <table> semantics + behavior live here; the
	// reference theme (table.css) styles the hooks this component stamps.
	//
	// Selection checkboxes are plain native <input type="checkbox"> styled
	// directly by table.css. Checkbox.svelte is NOT reused here — it is a
	// labeled FORM FIELD (Field scaffold: label, description, error), and a
	// per-row/select-all control has none of that chrome. table.css restates
	// the same visual (size, accent-color, focus ring) field.css gives
	// `.hz-field input[type="checkbox"]`, scoped to `.hz-table` instead.
	// ---------------------------------------------------------------------------

	interface Props {
		items: T[];
		columns: TableColumn<T>[];
		/** Visible caption (string or Snippet) — or `ariaLabel`. One is required. */
		caption?: string | Snippet;
		ariaLabel?: string;
		sort?: TableSort | null;
		/** Default true — Table sorts `items` itself. false: consumer orders `items`; Table only reports/marks sort state. */
		clientSort?: boolean;
		selectable?: boolean;
		selected?: SvelteSet<string>;
		getRowId?: (row: T, index: number) => string;
		/** Accessible name for a row's checkbox; falls back to the first column's cell text. */
		rowLabel?: (row: T) => string;
		/** Frame and row rules. `false` drops both, for a table that sits inside
		 *  a card or panel that already provides the edges. */
		bordered?: boolean;
		stickyHeader?: boolean;
		loading?: boolean;
		loadingRows?: number;
		/** Stack below this named width (container query on the wrap). Off by default. */
		stack?: 'sm' | 'md' | 'lg';
		/** Renders one cell; default is `String(row[column.key])`. */
		cell?: Snippet<[T, TableColumn<T>]>;
		/** Renders the empty state; default "No rows". */
		empty?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		items,
		columns,
		caption,
		ariaLabel,
		sort = $bindable(null),
		clientSort = true,
		selectable = false,
		selected = $bindable(new SvelteSet<string>()),
		getRowId = (_row: T, index: number) => String(index),
		rowLabel,
		bordered = true,
		stickyHeader = false,
		loading = false,
		loadingRows = 3,
		stack,
		cell,
		empty,
		class: className,
		...rest
	}: Props = $props();

	// ---------------------------------------------------------------------------
	// R1 — caption or ariaLabel is required (the Tabs precedent: dev-only warn,
	// re-evaluated whenever either prop changes).
	// ---------------------------------------------------------------------------

	$effect(() => {
		if (!import.meta.env.DEV) return;
		if (caption === undefined && !ariaLabel) {
			console.warn(
				'[hyzer-ui] <Table>: neither `caption` nor `ariaLabel` was provided. ' +
					'One of the two is required to name the table for assistive technology.'
			);
		}
	});

	const hasCaption = $derived(caption !== undefined);

	// ---------------------------------------------------------------------------
	// R2 — cell value access. Bracket access through Record<string, unknown>
	// because T carries no index signature; a missing key resolves to
	// undefined → empty string, never a throw.
	// ---------------------------------------------------------------------------

	function cellValue(row: T, column: TableColumn<T>): unknown {
		return (row as Record<string, unknown>)[column.key];
	}

	function defaultCellText(row: T, column: TableColumn<T>): string {
		const value = cellValue(row, column);
		return value === null || value === undefined ? '' : String(value);
	}

	// ---------------------------------------------------------------------------
	// Row identity — ids are computed from `items`' own order (not from
	// wherever a row lands after sorting), so selection survives re-sorting by
	// id rather than by render position. A Map keyed by row reference lets a
	// sorted `rows` array look its id up without recomputing indices.
	//
	// Edge case: duplicate `getRowId` values dev-warn once (not on every
	// recomputation) and collapse to one id for selection.
	// ---------------------------------------------------------------------------

	let dupWarned = false;

	const rowIds = $derived.by((): SvelteMap<T, string> => {
		const map = new SvelteMap<T, string>();
		items.forEach((row, i) => map.set(row, getRowId(row, i)));
		if (import.meta.env.DEV && !dupWarned) {
			const ids = Array.from(map.values());
			if (new Set(ids).size !== ids.length) {
				dupWarned = true;
				console.warn(
					'[hyzer-ui] <Table>: `getRowId` returned duplicate ids for different rows. ' +
						'Rows sharing an id are treated as one row for selection.'
				);
			}
		}
		return map;
	});

	function idFor(row: T): string {
		return rowIds.get(row) ?? '';
	}

	function accessibleRowLabel(row: T): string {
		if (rowLabel) return rowLabel(row);
		const first = columns[0];
		return first ? defaultCellText(row, first) : '';
	}

	// ---------------------------------------------------------------------------
	// R3 — sorting. Cycles asc → desc → asc on the active column; clicking a
	// different sortable column always starts it at asc. `clientSort` (default)
	// reorders a COPY of `items` (never mutates); false leaves `rows` as given
	// and only the `sort` state (and aria-sort) move.
	// ---------------------------------------------------------------------------

	function sortValue(row: T, column: TableColumn<T> | undefined): unknown {
		if (!column) return undefined;
		return column.sortBy ? column.sortBy(row) : cellValue(row, column);
	}

	// Numbers compare numerically, everything else coerces to string via
	// localeCompare (the `sortBy` accessor is the escape hatch for mixed
	// types); nullish always sorts last REGARDLESS of direction — so the
	// nullish branches return before `dir` ever multiplies in.
	function compareForSort(a: unknown, b: unknown, dir: number): number {
		const aNil = a === null || a === undefined;
		const bNil = b === null || b === undefined;
		if (aNil && bNil) return 0;
		if (aNil) return 1;
		if (bNil) return -1;
		if (typeof a === 'number' && typeof b === 'number') return dir * (a - b);
		return dir * String(a).localeCompare(String(b));
	}

	const rows = $derived.by((): T[] => {
		if (!clientSort || !sort) return items;
		const activeSort = sort;
		const column = columns.find((c) => c.key === activeSort.key);
		const dir = activeSort.direction === 'asc' ? 1 : -1;
		return [...items].sort((a, b) =>
			compareForSort(sortValue(a, column), sortValue(b, column), dir)
		);
	});

	function handleSort(column: TableColumn<T>) {
		if (loading || !column.sortable) return;
		if (sort && sort.key === column.key) {
			sort = { key: column.key, direction: sort.direction === 'asc' ? 'desc' : 'asc' };
		} else {
			sort = { key: column.key, direction: 'asc' };
		}
	}

	function ariaSortFor(column: TableColumn<T>): 'ascending' | 'descending' | undefined {
		if (!sort || sort.key !== column.key) return undefined;
		return sort.direction === 'asc' ? 'ascending' : 'descending';
	}

	// ---------------------------------------------------------------------------
	// R4 — selection. `selected` is a bindable SvelteSet<string> of ids
	// (fine-grained reactivity). Select-all targets every id in `items`
	// (not just the rendered rows), so it stays correct under `clientSort`.
	// ---------------------------------------------------------------------------

	const allIds = $derived(Array.from(rowIds.values()));
	const selectedCount = $derived(allIds.filter((id) => selected.has(id)).length);
	const allSelected = $derived(allIds.length > 0 && selectedCount === allIds.length);
	const someSelected = $derived(selectedCount > 0 && !allSelected);
	// Edge case: zero items → select-all disabled; also disabled while loading.
	const selectAllDisabled = $derived(loading || allIds.length === 0);

	let selectAllEl: HTMLInputElement | null = $state(null);

	$effect(() => {
		if (selectAllEl) selectAllEl.indeterminate = someSelected;
	});

	function toggleSelectAll() {
		if (selectAllDisabled) return;
		if (allSelected) {
			for (const id of allIds) selected.delete(id);
		} else {
			for (const id of allIds) selected.add(id);
		}
	}

	function toggleRow(id: string) {
		if (loading) return;
		if (selected.has(id)) selected.delete(id);
		else selected.add(id);
	}

	// ---------------------------------------------------------------------------
	// R6 — empty/loading. Loading suppresses both real rows and the empty
	// state, so a `loading` flip to false with empty `items` shows the empty
	// state directly (no flash of skeleton + empty together).
	// ---------------------------------------------------------------------------

	const totalColumnCount = $derived(columns.length + (selectable ? 1 : 0));
</script>

<!--
	R1: .hz-table-wrap (overflow-x: auto) wraps <table class="hz-table">.
	{...rest} spread first on the wrap so managed attrs win — the wrap is the
	outermost element, so it (not the inner <table>) is the one a consumer's
	`class` reaches, e.g. to cap max-height for a scrolling sticky header (R5).
-->
<div
	{...rest}
	class={cx('hz-table-wrap', className)}
	data-bordered={bordered ? '' : undefined}
	data-sticky={stickyHeader ? '' : undefined}
	data-stack={stack}
>
	<!-- R1: role="table" is stamped explicitly (redundant on a <table> today) so it
	     survives the stacked mode's display overrides (R7), which is when it stops
	     being redundant. -->
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<table
		class="hz-table"
		role="table"
		aria-busy={loading ? 'true' : undefined}
		aria-label={hasCaption ? undefined : ariaLabel}
	>
		{#if hasCaption}
			<caption>
				{#if typeof caption === 'string'}{caption}{:else}{@render caption?.()}{/if}
			</caption>
		{/if}

		<!-- R2: a real colgroup — width per column, an inline style on <col>. -->
		<colgroup>
			{#if selectable}
				<col class="hz-table-col-select" />
			{/if}
			{#each columns as column (column.key)}
				<col style={column.width ? `width: ${column.width}` : undefined} />
			{/each}
		</colgroup>

		<thead>
			<!-- svelte-ignore a11y_no_redundant_roles -->
			<tr role="row">
				{#if selectable}
					<th scope="col" role="columnheader" class="hz-table-cell-select">
						<input
							bind:this={selectAllEl}
							type="checkbox"
							class="hz-table-checkbox"
							aria-label="Select all rows"
							checked={allSelected}
							disabled={selectAllDisabled}
							onchange={toggleSelectAll}
						/>
					</th>
				{/if}
				{#each columns as column (column.key)}
					<th
						scope="col"
						role="columnheader"
						data-align={column.align}
						aria-sort={ariaSortFor(column)}
					>
						{#if column.sortable}
							<!-- R3: real button; its text IS the accessible name. -->
							<button
								type="button"
								class="hz-table-sort"
								disabled={loading}
								onclick={() => handleSort(column)}
							>
								<span class="hz-table-sort-label">{column.header}</span>
								{#if sort && sort.key === column.key}
									<span class="hz-table-sort-icon" aria-hidden="true">
										{#if sort.direction === 'asc'}
											<IconChevronUp />
										{:else}
											<IconChevronDown />
										{/if}
									</span>
								{/if}
							</button>
						{:else}
							{column.header}
						{/if}
					</th>
				{/each}
			</tr>
		</thead>

		<tbody>
			{#if loading}
				<!-- R6: skeleton rows, one cell per real column, hidden from AT. -->
				{#each { length: loadingRows }, i (i)}
					<!-- svelte-ignore a11y_no_redundant_roles -->
					<tr class="hz-table-skeleton" role="row" aria-hidden="true">
						{#if selectable}
							<td role="cell" class="hz-table-cell-select">
								<span class="hz-table-skeleton-bar"></span>
							</td>
						{/if}
						{#each columns as column (column.key)}
							<td role="cell" data-align={column.align}>
								<span class="hz-table-skeleton-bar"></span>
							</td>
						{/each}
					</tr>
				{/each}
			{:else if rows.length === 0}
				<!-- R6: one full-width empty row. -->
				<!-- svelte-ignore a11y_no_redundant_roles -->
				<tr role="row">
					<td role="cell" class="hz-table-empty" colspan={totalColumnCount}>
						{#if empty}{@render empty()}{:else}No rows{/if}
					</td>
				</tr>
			{:else}
				<!-- Keyed by the row reference, not its id: a dev-warned duplicate id
				     (edge case table) would otherwise be an invalid Svelte each key. -->
				{#each rows as row (row)}
					{@const id = idFor(row)}
					{@const isSelected = selected.has(id)}
					<!-- R4: selected rows carry data-selected + aria-selected. -->
					<!-- svelte-ignore a11y_no_redundant_roles -->
					<tr
						role="row"
						data-selected={isSelected ? '' : undefined}
						aria-selected={isSelected ? 'true' : undefined}
					>
						{#if selectable}
							<td role="cell" class="hz-table-cell-select">
								<input
									type="checkbox"
									class="hz-table-checkbox"
									aria-label={accessibleRowLabel(row)}
									checked={isSelected}
									disabled={loading}
									onchange={() => toggleRow(id)}
								/>
							</td>
						{/if}
						{#each columns as column, ci (column.key)}
							{#if ci === 0}
								<!-- R1: the first data cell of each row is a row header. -->
								<th
									scope="row"
									role="rowheader"
									data-align={column.align}
									data-label={column.header}
								>
									{#if cell}{@render cell(row, column)}{:else}{defaultCellText(row, column)}{/if}
								</th>
							{:else}
								<td role="cell" data-align={column.align} data-label={column.header}>
									{#if cell}{@render cell(row, column)}{:else}{defaultCellText(row, column)}{/if}
								</td>
							{/if}
						{/each}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<style>
	/* R1: the wrap is the default responsive answer — a horizontal scroll
	 * affordance, structural regardless of theme. */
	.hz-table-wrap {
		overflow-x: auto;
	}

	.hz-table {
		width: 100%;
		border-collapse: collapse;
	}
</style>
