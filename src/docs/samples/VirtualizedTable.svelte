<script lang="ts">
	/**
	 * A windowed ARIA table over a large (6,000-row) generated dataset.
	 *
	 * This is consumer code: it imports only public exports.
	 *
	 * Why an ARIA table, not real <table> markup: `Virtualizer` windows rows
	 * inside a div viewport/sizer/window stack, and a `<tr>` cannot live in
	 * that structure — a table row outside a `<table>` loses its row
	 * semantics entirely. So this pattern builds the table's semantics with
	 * `role="table"` / `"row"` / `"columnheader"` / `"cell"` on plain divs
	 * instead: a sticky header row rendered OUTSIDE the Virtualizer (so it
	 * never scrolls out of view), and the body windowed inside it. Header and
	 * body rows share one CSS grid template (`.hz-vtable-grid`), so their
	 * columns always line up.
	 *
	 * The tradeoff, plainly: a real `<table>` (the Table component) gives you
	 * native screen-reader table navigation for free and no ARIA to keep in
	 * sync — reach for it up to some thousands of rows. Past the point where
	 * rendering every row becomes the bottleneck, this windowed ARIA table
	 * trades a little semantic richness for a DOM that stays small regardless
	 * of dataset size. Pick per dataset size, not by default.
	 *
	 * Sorting is composed in this sample (not a Table/Virtualizer feature) to
	 * show it coexists with windowing: it re-sorts the full 6,000-row array,
	 * and the Virtualizer windows whatever order results.
	 */
	import { Virtualizer } from '$lib';

	interface Round {
		id: number;
		player: string;
		course: string;
		score: number;
		date: string;
	}

	interface ColumnDef {
		key: keyof Round;
		header: string;
		align?: 'end';
	}

	const columns: ColumnDef[] = [
		{ key: 'id', header: 'Round #' },
		{ key: 'player', header: 'Player' },
		{ key: 'course', header: 'Course' },
		{ key: 'score', header: 'Score', align: 'end' },
		{ key: 'date', header: 'Date', align: 'end' }
	];

	const PLAYERS = [
		'Ava Chen',
		'Marcus Reed',
		'Priya Natarajan',
		'Jonas Weber',
		'Lena Kowalski',
		'Omar Haddad',
		'Sofia Rossi',
		'Kwame Boateng',
		'Nadia Volkov',
		'Liam O’Connor',
		'Maya Singh',
		'Tomas Novak'
	];

	const COURSES = [
		'Maple Hollow',
		'Blue Ridge Links',
		'Cedar Creek',
		'Falcon Ridge',
		'Silver Pines',
		'Harbor Bluffs',
		'Copper Basin',
		'Willow Bend'
	];

	// Deterministic PRNG (mulberry32) — a fixed seed keeps SSR and client
	// output identical, unlike Math.random(), which would mismatch on hydrate.
	function mulberry32(seed: number): () => number {
		let a = seed;
		return () => {
			a |= 0;
			a = (a + 0x6d2b79f5) | 0;
			let t = Math.imul(a ^ (a >>> 15), 1 | a);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	const ROW_COUNT = 6000;
	const rand = mulberry32(20260722);
	const START = Date.UTC(2023, 0, 1);
	const DAY = 86_400_000;

	const rounds: Round[] = Array.from({ length: ROW_COUNT }, (_, i) => ({
		id: i + 1,
		player: PLAYERS[Math.floor(rand() * PLAYERS.length)],
		course: COURSES[Math.floor(rand() * COURSES.length)],
		score: 48 + Math.floor(rand() * 24),
		date: new Date(START + Math.floor(rand() * 900) * DAY).toISOString().slice(0, 10)
	}));

	let sort = $state<{ key: keyof Round; direction: 'asc' | 'desc' } | null>(null);

	const sortedRounds = $derived.by((): Round[] => {
		if (!sort) return rounds;
		const { key, direction } = sort;
		const dir = direction === 'asc' ? 1 : -1;
		return [...rounds].sort((a, b) => {
			const av = a[key];
			const bv = b[key];
			if (typeof av === 'number' && typeof bv === 'number') return dir * (av - bv);
			return dir * String(av).localeCompare(String(bv));
		});
	});

	function toggleSort(key: keyof Round) {
		if (sort && sort.key === key) {
			sort = { key, direction: sort.direction === 'asc' ? 'desc' : 'asc' };
		} else {
			sort = { key, direction: 'asc' };
		}
	}

	function ariaSortFor(key: keyof Round): 'ascending' | 'descending' | undefined {
		if (!sort || sort.key !== key) return undefined;
		return sort.direction === 'asc' ? 'ascending' : 'descending';
	}
</script>

<!--
	Classes follow the library's `.hz-` convention throughout — `.hz-table-wrap`
	and `.hz-table` are the REAL Table component's own classes, reused here
	as-is so this pattern picks up the same wrap chrome (border/radius) and
	base type from table.css; `.hz-table-sort`/`.hz-table-sort-icon` likewise
	give the sort trigger identical chrome to Table's. Everything with no
	real-Table equivalent (the grid template, header surface, row/cell
	layout — all div-based, so table.css's th/td-scoped rules can't reach
	them) is namespaced `.hz-vtable-*` below, styled fresh but from the same
	design tokens.
-->
<div
	class="hz-vtable hz-table-wrap hz-table"
	role="table"
	aria-label="Disc golf rounds ({ROW_COUNT.toLocaleString()} total)"
	aria-rowcount={sortedRounds.length + 1}
>
	<!-- The header row lives OUTSIDE the Virtualizer, so it never scrolls with
	     the windowed body — a sticky header with no CSS `position: sticky` needed. -->
	<div class="hz-vtable-thead" role="rowgroup">
		<div class="hz-vtable-row hz-vtable-grid hz-vtable-header" role="row" aria-rowindex={1}>
			{#each columns as column, i (column.key)}
				<div
					class="hz-vtable-headercell"
					role="columnheader"
					aria-colindex={i + 1}
					aria-sort={ariaSortFor(column.key)}
					data-align={column.align}
				>
					<button type="button" class="hz-table-sort" onclick={() => toggleSort(column.key)}>
						{column.header}
						{#if sort?.key === column.key}
							<span class="hz-table-sort-icon" aria-hidden="true">
								{sort.direction === 'asc' ? '▲' : '▼'}
							</span>
						{/if}
					</button>
				</div>
			{/each}
		</div>
	</div>

	<Virtualizer
		role="rowgroup"
		class="hz-vtable-tbody"
		items={sortedRounds}
		itemHeight={40}
		height={480}
	>
		{#snippet row(round, index)}
			<div class="hz-vtable-row hz-vtable-grid" role="row" aria-rowindex={index + 2}>
				{#each columns as column, i (column.key)}
					<div class="hz-vtable-cell" role="cell" aria-colindex={i + 1} data-align={column.align}>
						{round[column.key]}
					</div>
				{/each}
			</div>
		{/snippet}
	</Virtualizer>
</div>

<p class="hz-vtable-proof">
	{sortedRounds.length.toLocaleString()} rows in the dataset — only the rows in view are ever in the DOM.
</p>

<style>
	/* .hz-table-wrap (border/radius) and .hz-table (font-size/color) come
	   from the reference theme's table.css — reused, not redeclared. This
	   pattern only adds what the real Table's th/td-scoped rules can't
	   reach for a div-based row/cell structure. */
	.hz-vtable {
		display: block;
		overflow: hidden;
	}

	/* One shared column template — header and body rows both use it, so
	   their cells always line up. */
	.hz-vtable-grid {
		display: grid;
		grid-template-columns: 5rem 1fr 1fr 5rem 6.5rem;
		column-gap: 0.75rem;
	}

	.hz-vtable-row {
		align-items: center;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
		padding-inline: 0.75rem;
	}

	.hz-vtable-header {
		background-color: var(
			--hz-color-surface-muted,
			color-mix(in srgb, var(--hz-color-gray, #6b7280) 6%, var(--hz-color-surface, #fff))
		);
		font-weight: var(--hz-font-weight-semibold, 600);
		/* Reserve the same gutter as the scrolling body below, so the header's
		   grid columns stay aligned with the cells when a scrollbar shows. */
		overflow-y: hidden;
		scrollbar-gutter: stable;
	}

	.hz-vtable-headercell,
	.hz-vtable-cell {
		padding-block: 0.5rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.hz-vtable-headercell[data-align='end'],
	.hz-vtable-cell[data-align='end'] {
		text-align: end;
	}

	/* The sort trigger reuses .hz-table-sort/-icon from table.css directly —
	   no bespoke button styling needed here. */

	:global(.hz-vtable-tbody) {
		scrollbar-gutter: stable;
	}

	.hz-vtable-proof {
		margin: 0.75rem 0 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
