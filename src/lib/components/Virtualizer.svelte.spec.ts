import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Virtualizer from './Virtualizer.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** One macrotask + one animation frame — settles the rAF-coalesced scrollTop
 * commit (Virtualizer-R5) and any pending ResizeObserver callback (R6). */
function settle(): Promise<void> {
	return new Promise((resolve) => {
		requestAnimationFrame(() => {
			setTimeout(resolve, 0);
		});
	});
}

function scrollTo(viewport: HTMLElement, top: number): void {
	viewport.scrollTop = top;
	viewport.dispatchEvent(new Event('scroll'));
}

function parts(container: HTMLElement) {
	return {
		viewport: container.querySelector('.hz-virtualizer') as HTMLElement,
		sizer: container.querySelector('.hz-virtualizer-sizer') as HTMLElement,
		win: container.querySelector('.hz-virtualizer-window') as HTMLElement,
		rows: () => Array.from(container.querySelectorAll<HTMLElement>('.hz-virtualizer-row'))
	};
}

// render() can't carry Virtualizer's generic through, so T = unknown here.
const rowSnippet = createRawSnippet<[unknown, number]>((getItem, getIndex) => ({
	render: () => `<div data-row-content>${getItem()} #${getIndex()}</div>`
}));

const items100 = Array.from({ length: 100 }, (_, i) => `item-${i}`);

// ---------------------------------------------------------------------------
// Virtualizer-R1/R2/R3 — Structure & uniform window math
// ---------------------------------------------------------------------------

describe('Virtualizer-R1/R2/R3 — structure & uniform window math', () => {
	it('viewport has the inline height and scrollbar-gutter: stable', () => {
		const { container } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 500,
			overscan: 3,
			row: rowSnippet
		});
		const { viewport } = parts(container);
		expect(viewport.style.height).toBe('500px');
		expect(getComputedStyle(viewport).scrollbarGutter).toBe('stable');
	});

	it('sizer height equals items.length * itemHeight', () => {
		const { container } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 500,
			overscan: 3,
			row: rowSnippet
		});
		expect(parts(container).sizer.style.height).toBe('5000px');
	});

	it('rendered row count equals min(n, visibleCount + overscan) at the top; first data-index is 0; translateY is 0', () => {
		const { container } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 500,
			overscan: 3,
			row: rowSnippet
		});
		const { rows, win } = parts(container);
		const r = rows();
		// visible rows = ceil(500/50)+1 crossing = 11 (indices 0..10), + overscan(3) = 14.
		expect(r.length).toBe(14);
		expect(r[0].dataset.index).toBe('0');
		expect(win.style.transform).toBe('translateY(0px)');
	});

	it('known mode: each row carries an inline height matching itemHeight', () => {
		const { container } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 500,
			overscan: 3,
			row: rowSnippet
		});
		const r = parts(container).rows();
		expect(r[0].style.height).toBe('50px');
	});
});

// ---------------------------------------------------------------------------
// Virtualizer-R3 — Overscan
// ---------------------------------------------------------------------------

describe('Virtualizer-R3 — overscan', () => {
	it('after scrolling into the middle, the rendered slice spans [first-overscan, last+1+overscan)', async () => {
		const { container } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 500,
			overscan: 3,
			row: rowSnippet
		});
		const { viewport, rows, win } = parts(container);
		scrollTo(viewport, 1000); // first = floor(1000/50) = 20
		await settle();
		const r = rows();
		// startIndex = 20-3=17; last = floor(1500/50)=30; endIndex=min(100,34)=34.
		expect(r[0].dataset.index).toBe('17');
		expect(r[r.length - 1].dataset.index).toBe('33');
		expect(r.length).toBe(17);
		expect(win.style.transform).toBe('translateY(850px)'); // offset(17) = 17*50
	});

	it('overscan=0 renders exactly the visible rows', () => {
		const { container } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 480,
			overscan: 0,
			row: rowSnippet
		});
		const r = parts(container).rows();
		// last = floor(480/50) = 9 -> endIndex = 10 (indices 0..9).
		expect(r.length).toBe(10);
		expect(r[r.length - 1].dataset.index).toBe('9');
	});
});

// ---------------------------------------------------------------------------
// Virtualizer-R2 — Known-variable heights (itemHeight function)
// ---------------------------------------------------------------------------

describe('Virtualizer-R2 — known-variable heights', () => {
	const items10 = Array.from({ length: 10 }, (_, i) => `row-${i}`);
	// Even indices are 40px, odd indices are 60px. Sum = 5*40 + 5*60 = 500.
	function heightFn(_item: unknown, index: number): number {
		return index % 2 === 0 ? 40 : 60;
	}

	it('sizer height equals the sum of all per-item heights; row heights match the function', () => {
		const { container } = render(Virtualizer, {
			items: items10,
			itemHeight: heightFn,
			height: 100,
			overscan: 0,
			row: rowSnippet
		});
		const { sizer, rows } = parts(container);
		expect(sizer.style.height).toBe('500px');
		const r = rows();
		expect(r[0].style.height).toBe('40px'); // index 0
		expect(r[1].style.height).toBe('60px'); // index 1
	});

	it('offsetY at a scrolled position equals the prefix-sum offset of startIndex (binary search windowing)', async () => {
		const { container } = render(Virtualizer, {
			items: items10,
			itemHeight: heightFn,
			height: 100,
			overscan: 0,
			row: rowSnippet
		});
		const { viewport, win, rows } = parts(container);
		scrollTo(viewport, 100); // offsets: [0,40,100,140,200,...] -> first=2
		await settle();
		expect(win.style.transform).toBe('translateY(100px)');
		expect(rows()[0].dataset.index).toBe('2');
	});
});

// ---------------------------------------------------------------------------
// Virtualizer-R6 — Measured heights & scroll anchoring
// ---------------------------------------------------------------------------

describe('Virtualizer-R6 — measured heights', () => {
	it('after mount, the sizer height reflects measured totals (a row taller than the estimate)', async () => {
		const items5 = Array.from({ length: 5 }, (_, i) => `m-${i}`);
		const measuredRow = createRawSnippet<[unknown, number]>((getItem, getIndex) => ({
			render: () => {
				const idx = getIndex();
				const h = idx === 0 ? 80 : 30;
				return `<div style="height:${h}px">${getItem()}</div>`;
			}
		}));
		const { container } = render(Virtualizer, {
			items: items5,
			itemHeight: 30,
			height: 200,
			overscan: 5,
			measure: true,
			row: measuredRow
		});
		await settle();
		await settle();
		// 80 (measured row 0) + 30*4 (estimate matches real height for the rest) = 200.
		expect(parts(container).sizer.style.height).toBe('200px');
	});

	it('a row above the viewport growing triggers a scrollTop compensation (no jump) and settles without looping', async () => {
		const items30 = Array.from({ length: 30 }, (_, i) => `r-${i}`);
		const uniformMeasuredRow = createRawSnippet<[unknown, number]>((getItem, getIndex) => ({
			render: () => `<div data-cell style="height:30px">${getItem()} #${getIndex()}</div>`
		}));
		const { container } = render(Virtualizer, {
			items: items30,
			itemHeight: 30,
			height: 90,
			overscan: 2,
			measure: true,
			row: uniformMeasuredRow
		});
		const { viewport, rows, sizer } = parts(container);
		await settle(); // let the initial ResizeObserver measurement pass settle

		scrollTo(viewport, 300); // first = floor(300/30) = 10; startIndex = 8
		await settle();
		expect(rows()[0].dataset.index).toBe('8');

		// Grow row 8's real content directly (bypassing Svelte) — a row above
		// the viewport top (absIndex 8 < first 10) that's still rendered
		// thanks to overscan.
		const row8 = rows().find((r) => r.dataset.index === '8')!;
		const cell = row8.querySelector<HTMLElement>('[data-cell]')!;
		const scrollTopBefore = viewport.scrollTop;
		cell.style.height = '70px'; // +40px

		await settle();
		await settle();

		expect(viewport.scrollTop).toBe(scrollTopBefore + 40);
		// The topmost rendered row is still index 8 — no visual jump.
		expect(rows()[0].dataset.index).toBe('8');
		expect(sizer.style.height).toBe(`${30 * 30 + 40}px`);

		// Change-gating: settling again with no further changes is a no-op.
		const scrollTopSettled = viewport.scrollTop;
		await settle();
		expect(viewport.scrollTop).toBe(scrollTopSettled);
	});
});

// ---------------------------------------------------------------------------
// Virtualizer-R5 — Scroll re-windowing
// ---------------------------------------------------------------------------

describe('Virtualizer-R5 — scroll re-windowing', () => {
	it('setting scrollTop and dispatching scroll re-renders the window', async () => {
		const { container } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 500,
			overscan: 0,
			row: rowSnippet
		});
		const { viewport, rows, win } = parts(container);
		scrollTo(viewport, 250);
		await settle();
		expect(rows()[0].dataset.index).toBe('5'); // floor(250/50)
		expect(win.style.transform).toBe('translateY(250px)');
	});

	it('rapid successive scrolls settle to one correct final window (rAF coalescing)', async () => {
		const { container } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 500,
			overscan: 0,
			row: rowSnippet
		});
		const { viewport, rows } = parts(container);
		scrollTo(viewport, 100);
		scrollTo(viewport, 200);
		scrollTo(viewport, 300);
		await settle();
		expect(rows()[0].dataset.index).toBe('6'); // floor(300/50) — the final scrollTop wins
	});

	it('the initial (pre-scroll) render contains exactly the first-window rows starting at data-index="0"', () => {
		const { container } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 500,
			overscan: 3,
			row: rowSnippet
		});
		expect(parts(container).rows()[0].dataset.index).toBe('0');
	});
});

// ---------------------------------------------------------------------------
// Virtualizer-R7 — Reactivity to items/itemHeight/height
// ---------------------------------------------------------------------------

describe('Virtualizer-R7 — reactivity', () => {
	it('items shrinking while scrolled past the new end re-windows with all data-index < items.length', async () => {
		const items50 = Array.from({ length: 50 }, (_, i) => `s-${i}`);
		const { container, rerender } = render(Virtualizer, {
			items: items50,
			itemHeight: 50,
			height: 200,
			overscan: 0,
			row: rowSnippet
		});
		const { viewport, rows } = parts(container);
		scrollTo(viewport, 2300); // near the end of the original 50-item list
		await settle();

		const items10 = Array.from({ length: 10 }, (_, i) => `s-${i}`);
		await rerender({ items: items10, itemHeight: 50, height: 200, overscan: 0, row: rowSnippet });
		await settle();

		for (const r of rows()) {
			expect(Number(r.dataset.index)).toBeLessThan(10);
		}
		expect(viewport.scrollTop).toBeLessThanOrEqual(10 * 50 - 200);
	});

	it('changing itemHeight updates sizer height, row heights, and visible count', async () => {
		const items20 = Array.from({ length: 20 }, (_, i) => `h-${i}`);
		const { container, rerender } = render(Virtualizer, {
			items: items20,
			itemHeight: 50,
			height: 200,
			overscan: 0,
			row: rowSnippet
		});
		expect(parts(container).sizer.style.height).toBe('1000px');
		await rerender({ items: items20, itemHeight: 100, height: 200, overscan: 0, row: rowSnippet });
		expect(parts(container).sizer.style.height).toBe('2000px');
		expect(parts(container).rows()[0].style.height).toBe('100px');
	});

	it('changing height changes the number of rendered rows', async () => {
		const { container, rerender } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 200,
			overscan: 0,
			row: rowSnippet
		});
		const before = parts(container).rows().length;
		await rerender({ items: items100, itemHeight: 50, height: 500, overscan: 0, row: rowSnippet });
		const after = parts(container).rows().length;
		expect(after).toBeGreaterThan(before);
	});

	it('measure=true replacing items wholesale clears the cache and re-measures', async () => {
		// Discriminating data: a-items render 60px (twice the 30px estimate),
		// b-items render exactly the estimate. Rows measured at 60 and then
		// scrolled OUT of the window keep their cache entries — only a
		// wholesale-replace clear removes them, so a missing clear surfaces as
		// an inflated sizer after the swap.
		const itemsA = Array.from({ length: 50 }, (_, i) => `a-${i}`);
		const itemsB = Array.from({ length: 50 }, (_, i) => `b-${i}`);
		// setup() keeps the row's height reactive to the item — a bare render()
		// string would leave reused (same-key) rows holding the old a-content.
		const contentRow = createRawSnippet<[unknown, number]>((getItem) => ({
			render: () =>
				`<div style="height:${String(getItem()).startsWith('a') ? 60 : 30}px">${getItem()}</div>`,
			setup(el) {
				$effect(() => {
					const item = String(getItem());
					(el as HTMLElement).style.height = item.startsWith('a') ? '60px' : '30px';
					el.textContent = item;
				});
			}
		}));
		const { container, rerender } = render(Virtualizer, {
			items: itemsA,
			itemHeight: 30,
			height: 150,
			overscan: 0,
			measure: true,
			row: contentRow
		});
		await settle();
		await settle();
		// Rendered a-rows measured at 60; the rest estimate at 30.
		expect(parseInt(parts(container).sizer.style.height)).toBeGreaterThan(1500);

		// Scroll to the middle so a second band of a-rows is measured at 60,
		// then leaves the cache stale when the top band scrolls back in range.
		scrollTo(parts(container).viewport, 900);
		await settle();
		await settle();

		await rerender({
			items: itemsB,
			itemHeight: 30,
			height: 150,
			overscan: 0,
			measure: true,
			row: contentRow
		});
		await settle();
		await settle();
		// Every stale a-measurement (60) must be gone: 50 rows × 30px exactly.
		expect(parts(container).sizer.style.height).toBe('1500px');
	});
});

// ---------------------------------------------------------------------------
// Virtualizer-R4/R8 — Row snippet receives item + absolute index
// ---------------------------------------------------------------------------

describe('Virtualizer-R4/R8 — row snippet item + absolute index', () => {
	it('a mid-list row shows its absolute index (not the window-local index)', async () => {
		const { container } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 500,
			overscan: 0,
			row: rowSnippet
		});
		const { viewport, rows } = parts(container);
		scrollTo(viewport, 1000); // startIndex = 20
		await settle();
		const r = rows();
		expect(r[0].dataset.index).toBe('20');
		expect(r[0].textContent).toContain('item-20');
		expect(r[0].textContent).toContain('#20');
	});
});

// ---------------------------------------------------------------------------
// Virtualizer-R3 — Empty & tiny lists
// ---------------------------------------------------------------------------

describe('Virtualizer-R3 — empty & tiny lists', () => {
	it('items=[] renders zero rows and a zero-height sizer', () => {
		const { container } = render(Virtualizer, {
			items: [],
			itemHeight: 50,
			height: 500,
			row: rowSnippet
		});
		const { rows, sizer } = parts(container);
		expect(rows().length).toBe(0);
		expect(sizer.style.height).toBe('0px');
	});

	it('items.length < visibleCount renders all items, startIndex=0', () => {
		const items3 = ['a', 'b', 'c'];
		const { container } = render(Virtualizer, {
			items: items3,
			itemHeight: 50,
			height: 500,
			row: rowSnippet
		});
		const r = parts(container).rows();
		expect(r.length).toBe(3);
		expect(r[0].dataset.index).toBe('0');
	});
});

// ---------------------------------------------------------------------------
// Virtualizer-R14 — Fluid viewport height
// ---------------------------------------------------------------------------

describe('Virtualizer-R14 — fluid viewport height', () => {
	/** A plain, unstyled block element appended to the document to host a
	 * fixed-height parent that CSS-sizes a fluid (no `height` prop) Virtualizer. */
	function sizedWrapper(pxHeight: number): HTMLDivElement {
		const wrapper = document.createElement('div');
		wrapper.style.height = `${pxHeight}px`;
		document.body.appendChild(wrapper);
		return wrapper;
	}

	it('omitting height renders no inline height style on the viewport', () => {
		const wrapper = sizedWrapper(300);
		render(Virtualizer, {
			target: wrapper,
			props: { items: items100, itemHeight: 30, overscan: 3, row: rowSnippet }
		});
		const { viewport } = parts(wrapper);
		expect(viewport.style.height).toBe('');
	});

	it('the pre-measure first render contains exactly the minimal 1 + overscan window', () => {
		const wrapper = sizedWrapper(300);
		render(Virtualizer, {
			target: wrapper,
			props: {
				items: items100,
				itemHeight: 30,
				overscan: 3,
				row: rowSnippet,
				style: 'height: 100%'
			}
		});
		// Synchronous assertion — no settle() — asserts the state before the
		// ResizeObserver's initial callback has had a chance to run.
		const r = parts(wrapper).rows();
		expect(r.length).toBe(Math.min(items100.length, 1 + 3));
		expect(r[0].dataset.index).toBe('0');
	});

	it('after mount, the rendered row count matches the CSS/wrapper-driven viewport height', async () => {
		const wrapper = sizedWrapper(300);
		render(Virtualizer, {
			target: wrapper,
			props: {
				items: items100,
				itemHeight: 30,
				overscan: 3,
				row: rowSnippet,
				style: 'height: 100%'
			}
		});
		await settle();
		await settle();
		// last = floor(300/30) = 10 -> rows = 10 + 1 + overscan(3) = 14.
		const r = parts(wrapper).rows();
		expect(r.length).toBe(14);
		expect(r[r.length - 1].dataset.index).toBe('13');
	});

	it('growing the wrapper re-windows (more rows) with no scroll event', async () => {
		const wrapper = sizedWrapper(300);
		render(Virtualizer, {
			target: wrapper,
			props: {
				items: items100,
				itemHeight: 30,
				overscan: 3,
				row: rowSnippet,
				style: 'height: 100%'
			}
		});
		await settle();
		await settle();
		expect(parts(wrapper).rows().length).toBe(14);

		wrapper.style.height = '600px';
		await settle();
		await settle();
		// last = floor(600/30) = 20 -> rows = 20 + 1 + overscan(3) = 24.
		expect(parts(wrapper).rows().length).toBe(24);
	});

	it('shrinking the wrapper re-windows (fewer rows) with no scroll event', async () => {
		const wrapper = sizedWrapper(600);
		render(Virtualizer, {
			target: wrapper,
			props: {
				items: items100,
				itemHeight: 30,
				overscan: 3,
				row: rowSnippet,
				style: 'height: 100%'
			}
		});
		await settle();
		await settle();
		expect(parts(wrapper).rows().length).toBe(24);

		wrapper.style.height = '150px';
		await settle();
		await settle();
		// last = floor(150/30) = 5 -> rows = 5 + 1 + overscan(3) = 9.
		expect(parts(wrapper).rows().length).toBe(9);
	});

	it('a numeric height alongside a resizable wrapper stays fixed mode and ignores wrapper resize', async () => {
		const wrapper = sizedWrapper(300);
		render(Virtualizer, {
			target: wrapper,
			props: { items: items100, itemHeight: 30, height: 150, overscan: 3, row: rowSnippet }
		});
		const before = parts(wrapper).rows().length;
		expect(parts(wrapper).viewport.style.height).toBe('150px');

		wrapper.style.height = '900px';
		await settle();
		await settle();
		expect(parts(wrapper).rows().length).toBe(before);
	});
});

// ---------------------------------------------------------------------------
// Virtualizer-R10 — class & rest
// ---------------------------------------------------------------------------

describe('Virtualizer-R10 — class & rest', () => {
	it('no class: exactly hz-virtualizer', () => {
		const { container } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 500,
			row: rowSnippet
		});
		const classes = [...parts(container).viewport.classList].filter(
			(c) => !c.startsWith('svelte-')
		);
		expect(classes).toEqual(['hz-virtualizer']);
	});

	it('class="foo" appended after hz-virtualizer', () => {
		const { container } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 500,
			row: rowSnippet,
			class: 'foo'
		});
		const classes = [...parts(container).viewport.classList].filter(
			(c) => !c.startsWith('svelte-')
		);
		expect(classes[0]).toBe('hz-virtualizer');
		expect(classes).toContain('foo');
	});

	it('a forwarded data-testid reaches the viewport', () => {
		const { container } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 500,
			row: rowSnippet,
			'data-testid': 'my-list'
		});
		expect(parts(container).viewport.getAttribute('data-testid')).toBe('my-list');
	});

	it('a consumer onscroll via ...rest fires and the window still updates', async () => {
		const onscroll = vi.fn();
		const { container } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 500,
			overscan: 0,
			row: rowSnippet,
			onscroll
		});
		const { viewport, rows } = parts(container);
		scrollTo(viewport, 250);
		await settle();
		expect(onscroll).toHaveBeenCalled();
		expect(rows()[0].dataset.index).toBe('5');
	});

	it('a consumer role/tabindex/aria-label on the viewport is applied and not overridden', () => {
		const { container } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 500,
			row: rowSnippet,
			role: 'list',
			tabindex: 0,
			'aria-label': 'Big list'
		});
		const { viewport } = parts(container);
		expect(viewport.getAttribute('role')).toBe('list');
		expect(viewport.getAttribute('tabindex')).toBe('0');
		expect(viewport.getAttribute('aria-label')).toBe('Big list');
	});

	it('...rest attempts to override the inline height style — the managed value wins', () => {
		const { container } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 500,
			row: rowSnippet,
			style: 'height: 10px'
		});
		expect(parts(container).viewport.style.height).toBe('500px');
	});
});

// ---------------------------------------------------------------------------
// Virtualizer-R9 — Role-neutral
// ---------------------------------------------------------------------------

describe('Virtualizer-R9 — role-neutral by default', () => {
	it('no role/aria-*/tabindex on the viewport, sizer, window, or rows by default', () => {
		const { container } = render(Virtualizer, {
			items: items100,
			itemHeight: 50,
			height: 500,
			row: rowSnippet
		});
		const { viewport, sizer, win, rows } = parts(container);
		for (const el of [viewport, sizer, win, ...rows()]) {
			expect(el.getAttribute('role')).toBeNull();
			expect(el.getAttribute('tabindex')).toBeNull();
			expect(Array.from(el.attributes).some((a) => a.name.startsWith('aria-'))).toBe(false);
		}
	});
});

// ---------------------------------------------------------------------------
// Virtualizer-R11 — Barrel export
// ---------------------------------------------------------------------------

describe('Virtualizer-R11 — barrel export', () => {
	it('Virtualizer is resolvable from $lib', async () => {
		const { Virtualizer: V } = await import('$lib');
		expect(V).toBeDefined();
	});
});
