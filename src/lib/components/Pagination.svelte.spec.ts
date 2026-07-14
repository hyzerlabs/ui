import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Pagination from './Pagination.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

function getNav(container: HTMLElement): HTMLElement {
	return container.querySelector('nav.hz-pagination') as HTMLElement;
}

/** Rendered page-item sequence: numbers plus '…' for ellipses. */
function sequence(container: HTMLElement): string[] {
	return Array.from(
		container.querySelectorAll<HTMLElement>('.hz-pagination-page, .hz-pagination-ellipsis')
	).map((el) => el.textContent?.trim() ?? '');
}

function pageEl(container: HTMLElement, n: number): HTMLElement {
	return Array.from(container.querySelectorAll<HTMLElement>('.hz-pagination-page')).find(
		(el) => el.textContent?.trim() === String(n)
	) as HTMLElement;
}

// ---------------------------------------------------------------------------
// Pagination-R1 — Structure
// ---------------------------------------------------------------------------

describe('Pagination-R1 — structure', () => {
	it('renders a named nav landmark over a single list', () => {
		const { container } = render(Pagination, { count: 5 });
		const nav = getNav(container);
		expect(nav.getAttribute('aria-label')).toBe('Pagination');
		expect(nav.querySelectorAll('ul.hz-pagination-list').length).toBe(1);
	});

	it('prev is first, next is last, every control is an <li> child', () => {
		const { container } = render(Pagination, { count: 3 });
		const lis = Array.from(container.querySelectorAll('.hz-pagination-list > li'));
		expect(lis[0].querySelector('.hz-pagination-prev')).not.toBeNull();
		expect(lis[lis.length - 1].querySelector('.hz-pagination-next')).not.toBeNull();
		expect(lis.length).toBe(5); // prev + 3 pages + next
	});

	it('every control is a Button (.hz-button)', () => {
		const { container } = render(Pagination, { count: 3 });
		for (const el of container.querySelectorAll(
			'.hz-pagination-prev, .hz-pagination-next, .hz-pagination-page'
		)) {
			expect(el.classList.contains('hz-button')).toBe(true);
		}
	});

	it('current page carries aria-current="page" and data-current', () => {
		const { container } = render(Pagination, { count: 5, page: 3 });
		const current = pageEl(container, 3);
		expect(current.getAttribute('aria-current')).toBe('page');
		expect(current.hasAttribute('data-current')).toBe(true);
		expect(pageEl(container, 2).hasAttribute('aria-current')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Pagination-R2 — Truncation
// ---------------------------------------------------------------------------

describe('Pagination-R2 — truncation', () => {
	it('at or below the threshold: every page, no ellipsis', () => {
		const { container } = render(Pagination, { count: 7 });
		expect(sequence(container)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
	});

	it('right ellipsis near the start; the gap-of-one page renders instead of "…"', () => {
		const { container } = render(Pagination, { count: 10, page: 1 });
		// window clamps to 3–5; left gap is exactly page 2 → rendered, not elided
		expect(sequence(container)).toEqual(['1', '2', '3', '4', '5', '…', '10']);
	});

	it('both ellipses in the middle', () => {
		const { container } = render(Pagination, { count: 10, page: 5 });
		expect(sequence(container)).toEqual(['1', '…', '4', '5', '6', '…', '10']);
	});

	it('left ellipsis near the end; right gap-of-one renders the page', () => {
		const { container } = render(Pagination, { count: 10, page: 10 });
		expect(sequence(container)).toEqual(['1', '…', '6', '7', '8', '9', '10']);
	});

	it('item count stays constant while paging', async () => {
		for (const page of [1, 2, 5, 9, 10]) {
			const { container } = render(Pagination, { count: 10, page });
			expect(sequence(container).length).toBe(7);
		}
	});

	it('siblings and boundaries widen the windows', () => {
		const { container } = render(Pagination, {
			count: 20,
			page: 10,
			siblings: 2,
			boundaries: 2
		});
		expect(sequence(container)).toEqual([
			'1',
			'2',
			'…',
			'8',
			'9',
			'10',
			'11',
			'12',
			'…',
			'19',
			'20'
		]);
	});

	it('count 0: empty list, disabled ends; count 1: single current page', () => {
		const { container: empty } = render(Pagination, { count: 0 });
		expect(sequence(empty)).toEqual([]);
		expect(
			(empty.querySelector('.hz-pagination-prev') as HTMLElement).getAttribute('aria-disabled')
		).toBe('true');
		const { container: one } = render(Pagination, { count: 1 });
		expect(sequence(one)).toEqual(['1']);
		expect(pageEl(one, 1).getAttribute('aria-current')).toBe('page');
		expect(
			(one.querySelector('.hz-pagination-next') as HTMLElement).getAttribute('aria-disabled')
		).toBe('true');
	});
});

// ---------------------------------------------------------------------------
// Pagination-R3 — Button mode
// ---------------------------------------------------------------------------

describe('Pagination-R3 — button mode', () => {
	it('clicking a page updates the current marker and fires onchange', async () => {
		const onchange = vi.fn();
		const { container } = render(Pagination, { count: 10, onchange });
		pageEl(container, 4).click();
		await tick();
		expect(onchange).toHaveBeenCalledWith(4);
		expect(pageEl(container, 4).getAttribute('aria-current')).toBe('page');
	});

	it('prev/next step by one; ends follow the Button disabled contract', async () => {
		const onchange = vi.fn();
		const { container } = render(Pagination, { count: 3, onchange });
		const prev = container.querySelector('.hz-pagination-prev') as HTMLButtonElement;
		const next = container.querySelector('.hz-pagination-next') as HTMLButtonElement;
		expect(prev.getAttribute('aria-disabled')).toBe('true');
		next.click();
		await tick();
		expect(onchange).toHaveBeenCalledWith(2);
		expect(pageEl(container, 2).getAttribute('aria-current')).toBe('page');
	});

	it('activating the current page is a no-op', async () => {
		const onchange = vi.fn();
		const { container } = render(Pagination, { count: 5, page: 2, onchange });
		pageEl(container, 2).click();
		await tick();
		expect(onchange).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Pagination-R4 — Link mode
// ---------------------------------------------------------------------------

describe('Pagination-R4 — link mode', () => {
	const href = (n: number) => `#page-${n}`;

	it('pages render as anchors with hrefs from the callback', () => {
		const { container } = render(Pagination, { count: 5, page: 2, href });
		const item = pageEl(container, 4);
		expect(item.tagName.toLowerCase()).toBe('a');
		expect(item.getAttribute('href')).toBe('#page-4');
		expect(pageEl(container, 2).getAttribute('aria-current')).toBe('page');
	});

	it('prev/next are anchors mid-range', () => {
		const { container } = render(Pagination, { count: 5, page: 3, href });
		const prev = container.querySelector('.hz-pagination-prev') as HTMLElement;
		const next = container.querySelector('.hz-pagination-next') as HTMLElement;
		expect(prev.tagName.toLowerCase()).toBe('a');
		expect(prev.getAttribute('href')).toBe('#page-2');
		expect(next.getAttribute('href')).toBe('#page-4');
	});

	it('at the ends, prev/next are disabled Buttons without an href', () => {
		const { container } = render(Pagination, { count: 5, page: 1, href });
		const prev = container.querySelector('.hz-pagination-prev') as HTMLElement;
		// No href is computed for an invalid target, so Button renders its
		// button form: aria-disabled, out of the link flow, slot preserved.
		expect(prev.tagName.toLowerCase()).toBe('button');
		expect(prev.getAttribute('aria-disabled')).toBe('true');
		expect(prev.hasAttribute('href')).toBe(false);
	});

	it('clicking a disabled end fires no onchange', async () => {
		const onchange = vi.fn();
		const { container } = render(Pagination, { count: 5, page: 1, href, onchange });
		(container.querySelector('.hz-pagination-prev') as HTMLElement).click();
		await tick();
		expect(onchange).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Pagination-R5 — Labels & ARIA
// ---------------------------------------------------------------------------

describe('Pagination-R5 — labels', () => {
	it('ariaLabel, prevLabel, nextLabel, and pageLabel apply', () => {
		const { container } = render(Pagination, {
			count: 3,
			ariaLabel: 'Search results',
			prevLabel: 'Back',
			nextLabel: 'Forward',
			pageLabel: (n: number) => `Results page ${n}`
		});
		expect(getNav(container).getAttribute('aria-label')).toBe('Search results');
		expect(
			(container.querySelector('.hz-pagination-prev') as HTMLElement).getAttribute('aria-label')
		).toBe('Back');
		expect(
			(container.querySelector('.hz-pagination-next') as HTMLElement).getAttribute('aria-label')
		).toBe('Forward');
		expect(pageEl(container, 2).getAttribute('aria-label')).toBe('Results page 2');
	});

	it('ellipses are aria-hidden; icons are decorative', () => {
		const { container } = render(Pagination, { count: 10, page: 5 });
		for (const el of container.querySelectorAll('.hz-pagination-ellipsis')) {
			expect(el.getAttribute('aria-hidden')).toBe('true');
		}
		expect(container.querySelector('.hz-pagination-prev svg')?.getAttribute('aria-hidden')).toBe(
			'true'
		);
	});
});

// ---------------------------------------------------------------------------
// Pagination-R7/R8 — class, rest, export
// ---------------------------------------------------------------------------

describe('Pagination-R7/R8 — class, rest, export', () => {
	it('class merges after hz-pagination; rest forwards; managed aria-label wins', () => {
		const { container } = render(Pagination, {
			count: 3,
			class: 'results-nav',
			'data-testid': 'pager',
			'aria-label': 'clobbered'
		} as Record<string, unknown>);
		const nav = getNav(container);
		expect(nav.classList.contains('hz-pagination')).toBe(true);
		expect(nav.classList.contains('results-nav')).toBe(true);
		expect(nav.getAttribute('data-testid')).toBe('pager');
		expect(nav.getAttribute('aria-label')).toBe('Pagination');
	});

	it('Pagination resolves from $lib and smoke-renders', async () => {
		const { Pagination: P } = await import('$lib');
		expect(P).toBeDefined();
		const { container } = render(P, { count: 3 });
		expect(container.querySelector('.hz-pagination')).not.toBeNull();
	});
});
