import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Table from './Table.svelte';
import type { TableColumn } from '$lib/types';
// R7 reversibility recipe pin — the reference theme must be loaded so the
// @container stack/un-stack CSS actually resolves. Kept in its own spec
// file (not Table.svelte.spec.ts) because loading table.css makes the
// stacked-mode thead visually clip-hidden by default, which breaks that
// file's unrelated userEvent-driven sort/select interaction tests — this
// file only reads computed styles, never dispatches pointer events.
import '../tokens/tokens.css';
import '../theme/components/table.css';

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

function setWidth(wrap: HTMLElement, px: number) {
	wrap.style.width = `${px}px`;
}

// ---------------------------------------------------------------------------
// R7 — stacked mode is fully reversible (theme CSS specificity bug fix,
// 2026-07-23). table.css's un-stacking @container overrides used to lose a
// specificity tie against the always-on stacked base rule (two :not()
// exclusions sitting outside :where() inflated it to 0,4,1 against the
// override's 0,2,1), so cells — and, separately, the selection checkbox
// cell, which had no @container counterpart at all — never actually
// returned to table-cell layout once the container widened back past the
// threshold.
// ---------------------------------------------------------------------------

describe('R7 — stacked mode is reversible in both directions', () => {
	it('cells return to table-cell display with per-column text-align once widened past the sm threshold (640px)', () => {
		const { container } = render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			stack: 'sm',
			selectable: true
		});
		const wrap = container.querySelector('.hz-table-wrap') as HTMLElement;
		setWidth(wrap, 900);

		const firstRow = container.querySelector('tbody tr') as HTMLElement;
		const nameCell = firstRow.querySelector('[data-label="Name"]') as HTMLElement;
		const priceCell = firstRow.querySelector('[data-label="Price"]') as HTMLElement;
		const selectCell = firstRow.querySelector('.hz-table-cell-select') as HTMLElement;

		expect(getComputedStyle(nameCell).display).toBe('table-cell');
		expect(getComputedStyle(priceCell).display).toBe('table-cell');
		// `price` is align: 'end' — the un-stacked override must restore it,
		// not leave it pinned to the stacked mode's forced start alignment.
		expect(getComputedStyle(priceCell).textAlign).toBe('end');
		expect(getComputedStyle(selectCell).display).toBe('table-cell');
	});

	it('cells stay in stacked (flex) layout below the sm threshold', () => {
		const { container } = render(T, {
			items: discs,
			columns,
			ariaLabel: 'Discs',
			stack: 'sm',
			selectable: true
		});
		const wrap = container.querySelector('.hz-table-wrap') as HTMLElement;
		setWidth(wrap, 500);

		const firstRow = container.querySelector('tbody tr') as HTMLElement;
		const nameCell = firstRow.querySelector('[data-label="Name"]') as HTMLElement;
		const selectCell = firstRow.querySelector('.hz-table-cell-select') as HTMLElement;

		expect(getComputedStyle(nameCell).display).toBe('flex');
		expect(getComputedStyle(selectCell).display).toBe('flex');
	});

	it('toggles cleanly back and forth across the threshold, more than once', () => {
		const { container } = render(T, { items: discs, columns, ariaLabel: 'Discs', stack: 'sm' });
		const wrap = container.querySelector('.hz-table-wrap') as HTMLElement;
		const nameCell = () =>
			(container.querySelector('tbody tr') as HTMLElement).querySelector(
				'[data-label="Name"]'
			) as HTMLElement;

		setWidth(wrap, 500);
		expect(getComputedStyle(nameCell()).display).toBe('flex');
		setWidth(wrap, 900);
		expect(getComputedStyle(nameCell()).display).toBe('table-cell');
		setWidth(wrap, 400);
		expect(getComputedStyle(nameCell()).display).toBe('flex');
		setWidth(wrap, 700);
		expect(getComputedStyle(nameCell()).display).toBe('table-cell');
	});
});
