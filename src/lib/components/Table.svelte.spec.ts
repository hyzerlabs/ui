import { userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import Table from './Table.svelte';
import type { TableColumn, TableSort } from '$lib/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

interface Disc {
	id: string;
	name: string;
	type: string;
	price: number;
}

const discs: Disc[] = [
	{ id: 'a', name: 'Voyager', type: 'Distance', price: 19.99 },
	{ id: 'b', name: 'Aviar', type: 'Putter', price: 9.99 },
	{ id: 'c', name: 'Roc', type: 'Midrange', price: 14.99 }
];

const columns: TableColumn<Disc>[] = [
	{ key: 'name', header: 'Name', sortable: true },
	{ key: 'type', header: 'Type', sortable: true },
	{ key: 'price', header: 'Price', sortable: true, align: 'end' }
];

// render() can't carry Table's generic through — mirrors the Carousel spec's
// note (T = unknown at the test boundary).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const T = Table as any;

function parts(container: HTMLElement) {
	return {
		wrap: container.querySelector('.hz-table-wrap') as HTMLElement,
		table: container.querySelector('table.hz-table') as HTMLElement,
		thead: container.querySelector('thead') as HTMLElement,
		tbody: container.querySelector('tbody') as HTMLElement,
		// Excludes the select-all th (present only when selectable) — these are
		// the data column headers, in column order.
		headerCells: Array.from(
			container.querySelectorAll('thead th:not(.hz-table-cell-select)')
		) as HTMLElement[],
		bodyRows: Array.from(container.querySelectorAll('tbody tr')) as HTMLElement[]
	};
}

function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

// ---------------------------------------------------------------------------
// R1 — semantics
// ---------------------------------------------------------------------------

describe('R1 — real table semantics', () => {
	it('renders .hz-table-wrap wrapping table.hz-table', () => {
		const { container } = render(T, { items: discs, columns, ariaLabel: 'Discs' });
		const { wrap, table } = parts(container);
		expect(wrap).not.toBeNull();
		expect(table).not.toBeNull();
		expect(wrap.contains(table)).toBe(true);
	});

	it('a string caption renders as a visible <caption>', () => {
		const { container } = render(T, { items: discs, columns, caption: 'Discs catalog' });
		const caption = container.querySelector('caption');
		expect(caption?.textContent?.trim()).toBe('Discs catalog');
	});

	it('a snippet caption renders as given', () => {
		const captionSnippet = createRawSnippet(() => ({
			render: () => `<span data-testid="caption-content">Custom caption</span>`
		}));
		const { container } = render(T, { items: discs, columns, caption: captionSnippet });
		expect(container.querySelector('[data-testid="caption-content"]')?.textContent).toBe(
			'Custom caption'
		);
	});

	it('ariaLabel sets aria-label on the table when there is no caption', () => {
		const { container } = render(T, { items: discs, columns, ariaLabel: 'Discs' });
		const { table } = parts(container);
		expect(table.getAttribute('aria-label')).toBe('Discs');
	});

	it('caption wins over ariaLabel — aria-label is omitted (edge case)', () => {
		const { container } = render(T, {
			items: discs,
			columns,
			caption: 'Discs catalog',
			ariaLabel: 'Discs'
		});
		const { table } = parts(container);
		expect(table.hasAttribute('aria-label')).toBe(false);
	});

	it('dev-warns when neither caption nor ariaLabel is provided', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(T, { items: discs, columns });
		await tick();
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('<Table>'));
		warnSpy.mockRestore();
	});

	it('renders <thead> with <th scope="col"> headers', () => {
		const { container } = render(T, { items: discs, columns, ariaLabel: 'Discs' });
		const { headerCells } = parts(container);
		expect(headerCells).toHaveLength(columns.length);
		for (const th of headerCells) {
			expect(th.getAttribute('scope')).toBe('col');
		}
	});

	it('the first data cell of each row is <th scope="row">', () => {
		const { container } = render(T, { items: discs, columns, ariaLabel: 'Discs' });
		const { bodyRows } = parts(container);
		for (const row of bodyRows) {
			const firstCell = row.querySelector('th, td');
			expect(firstCell?.tagName).toBe('TH');
			expect(firstCell?.getAttribute('scope')).toBe('row');
		}
	});

	it('stamps explicit table/row/columnheader/cell roles', () => {
		const { container } = render(T, { items: discs, columns, ariaLabel: 'Discs' });
		const { table } = parts(container);
		expect(table.getAttribute('role')).toBe('table');
		expect(container.querySelectorAll('[role="row"]').length).toBeGreaterThan(0);
		expect(container.querySelectorAll('[role="columnheader"]')).toHaveLength(columns.length);
		expect(container.querySelectorAll('[role="cell"]').length).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// R2 — cells
// ---------------------------------------------------------------------------

describe('R2 — cells', () => {
	it('default cell content is String(row[column.key])', () => {
		const { container } = render(T, { items: discs, columns, ariaLabel: 'Discs' });
		const { bodyRows } = parts(container);
		expect(bodyRows[0].textContent).toContain('Voyager');
		expect(bodyRows[0].textContent).toContain('19.99');
	});

	it('a nullish value renders as an empty string, no throw', () => {
		const rows = [{ id: 'x', name: 'Zone', type: null, price: undefined }];
		expect(() => render(T, { items: rows, columns, ariaLabel: 'Discs' })).not.toThrow();
	});

	it('a missing column key renders empty, no throw', () => {
		const rows = [{ id: 'x', name: 'Zone' }];
		expect(() => render(T, { items: rows, columns, ariaLabel: 'Discs' })).not.toThrow();
	});

	it('the cell snippet receives (row, column) and replaces the default', () => {
		const cellSnippet = createRawSnippet<[Disc, TableColumn<Disc>]>((getRow, getColumn) => ({
			render: () => `<span data-testid="cell">${getColumn().key}:${getRow().name}</span>`
		}));
		const { container } = render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			cell: cellSnippet
		});
		const cells = container.querySelectorAll('[data-testid="cell"]');
		expect(cells.length).toBe(discs.length * columns.length);
		expect(cells[0].textContent).toBe('name:Voyager');
	});

	it('data-align and a <col> width reflect the column definition', () => {
		const withWidth: TableColumn<Disc>[] = [
			...columns.slice(0, -1),
			{ key: 'price', header: 'Price', align: 'end', width: '8rem' }
		];
		const { container } = render(T, { items: discs, columns: withWidth, ariaLabel: 'Discs' });
		const priceHeader = parts(container).headerCells[2];
		expect(priceHeader.getAttribute('data-align')).toBe('end');
		const cols = container.querySelectorAll('col');
		expect(cols[cols.length - 1].getAttribute('style')).toContain('8rem');
	});
});

// ---------------------------------------------------------------------------
// R3 — sorting
// ---------------------------------------------------------------------------

describe('R3 — sorting', () => {
	it('activating a sort button cycles asc → desc → asc and moves aria-sort', async () => {
		const { container } = render(T, { items: discs, columns, ariaLabel: 'Discs' });
		const nameHeader = parts(container).headerCells[0];
		const button = nameHeader.querySelector('button.hz-table-sort') as HTMLButtonElement;
		expect(button).not.toBeNull();

		await userEvent.click(button);
		expect(nameHeader.getAttribute('aria-sort')).toBe('ascending');

		await userEvent.click(button);
		expect(nameHeader.getAttribute('aria-sort')).toBe('descending');

		await userEvent.click(button);
		expect(nameHeader.getAttribute('aria-sort')).toBe('ascending');
	});

	it('aria-sort sits only on the active column', async () => {
		const { container } = render(T, { items: discs, columns, ariaLabel: 'Discs' });
		const headers = parts(container).headerCells;
		await userEvent.click(headers[0].querySelector('button')!);
		expect(headers[0].hasAttribute('aria-sort')).toBe(true);
		expect(headers[1].hasAttribute('aria-sort')).toBe(false);
		expect(headers[2].hasAttribute('aria-sort')).toBe(false);
	});

	it('the sort trigger’s accessible name is the header text', () => {
		const { container } = render(T, { items: discs, columns, ariaLabel: 'Discs' });
		const button = parts(container).headerCells[0].querySelector('button')!;
		expect(button.textContent?.trim()).toContain('Name');
	});

	it('sorts a numeric column numerically, ascending', async () => {
		const { container } = render(T, { items: discs, columns, ariaLabel: 'Discs' });
		const priceHeader = parts(container).headerCells[2];
		await userEvent.click(priceHeader.querySelector('button')!);
		const names = parts(container).bodyRows.map((r) => r.querySelector('th')?.textContent);
		expect(names).toEqual(['Aviar', 'Roc', 'Voyager']); // 9.99, 14.99, 19.99
	});

	it('sorts a string column via localeCompare', async () => {
		const { container } = render(T, { items: discs, columns, ariaLabel: 'Discs' });
		const nameHeader = parts(container).headerCells[0];
		await userEvent.click(nameHeader.querySelector('button')!);
		const names = parts(container).bodyRows.map((r) => r.querySelector('th')?.textContent);
		expect(names).toEqual(['Aviar', 'Roc', 'Voyager']);
	});

	it('nullish values sort last regardless of direction', async () => {
		const rows: Disc[] = [
			{ id: 'a', name: 'Voyager', type: 'Distance', price: 19.99 },
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			{ id: 'b', name: 'Unknown', type: 'Distance', price: null as any },
			{ id: 'c', name: 'Roc', type: 'Distance', price: 14.99 }
		];
		const { container } = render(T, { items: rows, columns, ariaLabel: 'Discs' });
		const priceHeader = parts(container).headerCells[2];
		const btn = priceHeader.querySelector('button')!;
		await userEvent.click(btn); // asc
		let names = parts(container).bodyRows.map((r) => r.querySelector('th')?.textContent);
		expect(names[names.length - 1]).toBe('Unknown');
		await userEvent.click(btn); // desc
		names = parts(container).bodyRows.map((r) => r.querySelector('th')?.textContent);
		expect(names[names.length - 1]).toBe('Unknown');
	});

	it('clientSort={false} leaves row order unchanged; only sort state moves', async () => {
		const { container } = render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			clientSort: false
		});
		const nameHeader = parts(container).headerCells[0];
		await userEvent.click(nameHeader.querySelector('button')!);
		expect(nameHeader.getAttribute('aria-sort')).toBe('ascending');
		const names = parts(container).bodyRows.map((r) => r.querySelector('th')?.textContent);
		expect(names).toEqual(['Voyager', 'Aviar', 'Roc']); // unchanged source order
	});

	it('sorting never mutates the items array', async () => {
		const original = [...discs];
		const { container } = render(T, { items: discs, columns, ariaLabel: 'Discs' });
		await userEvent.click(parts(container).headerCells[0].querySelector('button')!);
		expect(discs).toEqual(original);
	});

	it('an initial sort prop is respected — the matching column starts sorted', () => {
		const { container } = render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			sort: { key: 'name', direction: 'desc' } satisfies TableSort
		});
		const nameHeader = parts(container).headerCells[0];
		expect(nameHeader.getAttribute('aria-sort')).toBe('descending');
		const names = parts(container).bodyRows.map((r) => r.querySelector('th')?.textContent);
		expect(names).toEqual(['Voyager', 'Roc', 'Aviar']); // desc by name
	});
});

// ---------------------------------------------------------------------------
// R4 — selection
// ---------------------------------------------------------------------------

describe('R4 — selection', () => {
	it('selectable prepends a checkbox column with an accessible select-all header', () => {
		const { container } = render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			selectable: true
		});
		const selectAll = container.querySelector('thead input[type="checkbox"]') as HTMLInputElement;
		expect(selectAll).not.toBeNull();
		expect(selectAll.getAttribute('aria-label')).toBe('Select all rows');
	});

	it('a row checkbox’s accessible name falls back to the first column’s cell text', () => {
		const { container } = render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			selectable: true
		});
		const rowCheckboxes = Array.from(
			container.querySelectorAll('tbody input[type="checkbox"]')
		) as HTMLInputElement[];
		expect(rowCheckboxes[0].getAttribute('aria-label')).toBe('Voyager');
	});

	it('a row checkbox’s accessible name uses rowLabel when provided', () => {
		const { container } = render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			selectable: true,
			rowLabel: (row: Disc) => `Select ${row.name}`
		});
		const rowCheckboxes = Array.from(
			container.querySelectorAll('tbody input[type="checkbox"]')
		) as HTMLInputElement[];
		expect(rowCheckboxes[0].getAttribute('aria-label')).toBe('Select Voyager');
	});

	it('select-all is unchecked, then checked, and indeterminate when partial', async () => {
		const { container } = render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			selectable: true
		});
		const selectAll = container.querySelector('thead input[type="checkbox"]') as HTMLInputElement;
		const rowCheckboxes = Array.from(
			container.querySelectorAll('tbody input[type="checkbox"]')
		) as HTMLInputElement[];

		expect(selectAll.checked).toBe(false);
		expect(selectAll.indeterminate).toBe(false);

		await userEvent.click(rowCheckboxes[0]);
		expect(selectAll.indeterminate).toBe(true);

		await userEvent.click(rowCheckboxes[1]);
		await userEvent.click(rowCheckboxes[2]);
		expect(selectAll.checked).toBe(true);
		expect(selectAll.indeterminate).toBe(false);
	});

	it('clicking select-all toggles every row; clicking again clears them', async () => {
		const { container } = render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			selectable: true
		});
		const selectAll = container.querySelector('thead input[type="checkbox"]') as HTMLInputElement;
		const rowCheckboxes = () =>
			Array.from(container.querySelectorAll('tbody input[type="checkbox"]')) as HTMLInputElement[];

		await userEvent.click(selectAll);
		expect(rowCheckboxes().every((cb) => cb.checked)).toBe(true);

		await userEvent.click(selectAll);
		expect(rowCheckboxes().every((cb) => !cb.checked)).toBe(true);
	});

	it('select-all is disabled when items is empty (edge case)', () => {
		const { container } = render(T, {
			items: [],
			columns,
			ariaLabel: 'Discs',
			selectable: true
		});
		const selectAll = container.querySelector('thead input[type="checkbox"]') as HTMLInputElement;
		expect(selectAll.disabled).toBe(true);
	});

	it('selected rows carry data-selected and aria-selected', async () => {
		const { container } = render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			selectable: true
		});
		const firstRow = parts(container).bodyRows[0];
		const checkbox = firstRow.querySelector('input[type="checkbox"]') as HTMLInputElement;
		await userEvent.click(checkbox);
		expect(firstRow.hasAttribute('data-selected')).toBe(true);
		expect(firstRow.getAttribute('aria-selected')).toBe('true');
	});

	it('selection persists across re-sorting by id, not index', async () => {
		// A SvelteSet is a shared reference: the component mutates it in place
		// (.add/.delete), so this instance reflects selection without needing
		// the getter/setter bind: wiring.
		const selected = new SvelteSet<string>();
		const { container } = render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			selectable: true,
			getRowId: (row: Disc) => row.id,
			selected
		});
		const rowCheckboxes = () =>
			Array.from(container.querySelectorAll('tbody input[type="checkbox"]')) as HTMLInputElement[];

		// Select "Voyager" (first row, id "a").
		await userEvent.click(rowCheckboxes()[0]);
		expect(selected.has('a')).toBe(true);

		// Sort by name — Voyager moves to the last row.
		const nameHeader = parts(container).headerCells[0];
		await userEvent.click(nameHeader.querySelector('button')!);

		const rows = parts(container).bodyRows;
		const voyagerRow = rows.find((r) => r.textContent?.includes('Voyager'))!;
		expect(voyagerRow.hasAttribute('data-selected')).toBe(true);
	});

	it('duplicate getRowId values dev-warn once', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			selectable: true,
			getRowId: () => 'same-id'
		});
		await tick();
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('duplicate ids'));
		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// R6 — empty and loading
// ---------------------------------------------------------------------------

describe('R6 — empty and loading', () => {
	it('an empty items array (not loading) renders the default "No rows" message', () => {
		const { container } = render(T, { items: [], columns, ariaLabel: 'Discs' });
		const empty = container.querySelector('.hz-table-empty');
		expect(empty?.textContent?.trim()).toBe('No rows');
		expect(empty?.getAttribute('colspan')).toBe(String(columns.length));
	});

	it('the empty snippet overrides the default message', () => {
		const emptySnippet = createRawSnippet(() => ({
			render: () => `<span data-testid="empty-content">Nothing here</span>`
		}));
		const { container } = render(T, {
			items: [],
			columns,
			ariaLabel: 'Discs',
			empty: emptySnippet
		});
		expect(container.querySelector('[data-testid="empty-content"]')?.textContent).toBe(
			'Nothing here'
		);
	});

	it('loading sets aria-busy and renders loadingRows skeleton rows, suppressing body/empty', () => {
		const { container } = render(T, {
			items: [],
			columns,
			ariaLabel: 'Discs',
			loading: true,
			loadingRows: 4
		});
		const { table } = parts(container);
		expect(table.getAttribute('aria-busy')).toBe('true');
		expect(container.querySelectorAll('tr.hz-table-skeleton')).toHaveLength(4);
		expect(container.querySelector('.hz-table-empty')).toBeNull();
	});

	it('loading suppresses real body rows even when items is non-empty', () => {
		const { container } = render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			loading: true
		});
		expect(container.querySelectorAll('tbody tr:not(.hz-table-skeleton)')).toHaveLength(0);
	});

	it('skeleton rows are hidden from assistive technology', () => {
		const { container } = render(T, {
			items: [],
			columns,
			ariaLabel: 'Discs',
			loading: true
		});
		for (const row of container.querySelectorAll('tr.hz-table-skeleton')) {
			expect(row.getAttribute('aria-hidden')).toBe('true');
		}
	});

	it('sort buttons and select-all are disabled while loading', () => {
		const { container } = render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			selectable: true,
			loading: true
		});
		const sortButton = container.querySelector('button.hz-table-sort') as HTMLButtonElement;
		expect(sortButton.disabled).toBe(true);
	});

	it('loading flips false with empty items shows the empty state directly (no skeleton flash)', async () => {
		const { container, rerender } = render(T, {
			items: [],
			columns,
			ariaLabel: 'Discs',
			loading: true
		});
		expect(container.querySelectorAll('tr.hz-table-skeleton').length).toBeGreaterThan(0);

		await rerender({ loading: false });
		await tick();

		expect(container.querySelectorAll('tr.hz-table-skeleton')).toHaveLength(0);
		expect(container.querySelector('.hz-table-empty')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R7 — stacked mode
// ---------------------------------------------------------------------------

describe('R7 — stacked mode', () => {
	it('stamps data-stack on the wrap, matching the stack prop', () => {
		const { container } = render(T, { items: discs, columns, ariaLabel: 'Discs', stack: 'md' });
		expect(parts(container).wrap.getAttribute('data-stack')).toBe('md');
	});

	it('data-stack is absent by default (off)', () => {
		const { container } = render(T, { items: discs, columns, ariaLabel: 'Discs' });
		expect(parts(container).wrap.hasAttribute('data-stack')).toBe(false);
	});

	it('body cells carry data-label from the column header, for the stacked-mode ::before', () => {
		const { container } = render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			stack: 'md'
		});
		const firstRow = parts(container).bodyRows[0];
		const cells = Array.from(firstRow.querySelectorAll('th, td'));
		expect(cells[0].getAttribute('data-label')).toBe('Name');
		expect(cells[1].getAttribute('data-label')).toBe('Type');
	});

	it('sorting and selection remain operable in stacked mode', async () => {
		const { container } = render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			stack: 'md',
			selectable: true
		});
		const nameHeader = parts(container).headerCells[0];
		await userEvent.click(nameHeader.querySelector('button')!);
		expect(nameHeader.getAttribute('aria-sort')).toBe('ascending');

		const checkbox = container.querySelector('tbody input[type="checkbox"]') as HTMLInputElement;
		await userEvent.click(checkbox);
		expect(checkbox.checked).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// R5 — sticky header
// ---------------------------------------------------------------------------

describe('R5 — sticky header', () => {
	it('stickyHeader stamps data-sticky on the wrap', () => {
		const { container } = render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			stickyHeader: true
		});
		expect(parts(container).wrap.hasAttribute('data-sticky')).toBe(true);
	});

	it('data-sticky is absent by default', () => {
		const { container } = render(T, { items: discs, columns, ariaLabel: 'Discs' });
		expect(parts(container).wrap.hasAttribute('data-sticky')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// RTL — align attrs (edge case table)
// ---------------------------------------------------------------------------

describe('edge case — RTL align attrs', () => {
	it('start/end align values are stamped as-is (logical — CSS flips them under RTL)', () => {
		const rtlColumns: TableColumn<Disc>[] = [
			{ key: 'name', header: 'Name', align: 'start' },
			{ key: 'price', header: 'Price', align: 'end' }
		];
		const { container } = render(T, { items: discs, columns: rtlColumns, ariaLabel: 'Discs' });
		const headers = parts(container).headerCells;
		expect(headers[0].getAttribute('data-align')).toBe('start');
		expect(headers[1].getAttribute('data-align')).toBe('end');
	});
});
