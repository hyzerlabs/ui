import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Grid from './Grid.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const childrenSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="child">content</span>`
}));

/**
 * Return the consumer-visible classes (strip Svelte's internal scope hash).
 */
function consumerClasses(el: HTMLElement): string[] {
	return [...el.classList].filter((c) => !c.startsWith('svelte-'));
}

/**
 * Force a fixed width on the .hz-grid root (the size container), then count
 * the column tracks on the inner .hz-grid-layout by splitting its computed
 * gridTemplateColumns string. Because the breakpoints are container queries
 * against the root's width, object-mode column counts are fully controllable
 * here — no viewport dependence.
 */
function countTracks(root: HTMLElement, width = 700): number {
	root.style.width = `${width}px`;
	const layout = root.querySelector('.hz-grid-layout') as HTMLElement;
	const value = getComputedStyle(layout).gridTemplateColumns.trim();
	return value.split(/\s+/).length;
}

// ---------------------------------------------------------------------------
// R10 — Default render
// ---------------------------------------------------------------------------

describe('R10 — default render', () => {
	it('renders a <div> by default', () => {
		const { container } = render(Grid);
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el).not.toBeNull();
		expect(el.tagName).toBe('DIV');
	});

	it('has hz-grid as its only consumer class by default', () => {
		const { container } = render(Grid);
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(consumerClasses(el)).toEqual(['hz-grid']);
	});

	it('has data-gap="md" by default', () => {
		const { container } = render(Grid);
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.getAttribute('data-gap')).toBe('md');
	});

	it('has data-align="stretch" by default', () => {
		const { container } = render(Grid);
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.getAttribute('data-align')).toBe('stretch');
	});

	it('root is the size container; inner .hz-grid-layout has computed display: grid', () => {
		const { container } = render(Grid);
		const el = container.querySelector('.hz-grid') as HTMLElement;
		const layout = el.querySelector('.hz-grid-layout') as HTMLElement;
		expect(getComputedStyle(el).containerType).toBe('inline-size');
		expect(getComputedStyle(layout).display).toBe('grid');
	});

	it('default columns object → --hz-grid-cols-sm/md/lg inline custom props', () => {
		const { container } = render(Grid);
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.style.getPropertyValue('--hz-grid-cols-sm')).toBe('1');
		expect(el.style.getPropertyValue('--hz-grid-cols-md')).toBe('2');
		expect(el.style.getPropertyValue('--hz-grid-cols-lg')).toBe('3');
		expect(el.style.getPropertyValue('--hz-grid-cols-xl')).toBe('');
	});

	it('default columns object → no flat --hz-grid-cols custom prop', () => {
		const { container } = render(Grid);
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.style.getPropertyValue('--hz-grid-cols')).toBe('');
	});

	it('renders children', () => {
		const { container } = render(Grid, { children: childrenSnippet });
		expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
	});

	it('renders an empty grid with no children and no error', () => {
		const { container } = render(Grid);
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R11 — columns (number)
// ---------------------------------------------------------------------------

describe('R11 — columns (number)', () => {
	it('columns={4} → --hz-grid-cols: 4 inline', () => {
		const { container } = render(Grid, { columns: 4 });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.style.getPropertyValue('--hz-grid-cols')).toBe('4');
	});

	it('columns={4} → no per-breakpoint custom props', () => {
		const { container } = render(Grid, { columns: 4 });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.style.getPropertyValue('--hz-grid-cols-sm')).toBe('');
		expect(el.style.getPropertyValue('--hz-grid-cols-md')).toBe('');
		expect(el.style.getPropertyValue('--hz-grid-cols-lg')).toBe('');
	});

	it('columns={4} → 4-track template (viewport-independent via --hz-grid-cols cascade)', () => {
		const { container } = render(Grid, { columns: 4 });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		// --hz-grid-cols: 4 feeds every breakpoint's fallback cascade, so 4 tracks
		// appear at every viewport width. countTracks is reliable for number-mode.
		expect(countTracks(el)).toBe(4);
	});

	it('columns={1} → 1-track template', () => {
		const { container } = render(Grid, { columns: 1 });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(countTracks(el)).toBe(1);
	});

	it('columns={7} (arbitrary) → --hz-grid-cols: 7 and 7-track template', () => {
		const { container } = render(Grid, { columns: 7 });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.style.getPropertyValue('--hz-grid-cols')).toBe('7');
		expect(countTracks(el)).toBe(7);
	});
});

// ---------------------------------------------------------------------------
// R12 — columns (object)
// ---------------------------------------------------------------------------

describe('R12 — columns (object)', () => {
	it('{ sm: 1, md: 2, lg: 3, xl: 4 } → per-key inline custom props', () => {
		const { container } = render(Grid, { columns: { sm: 1, md: 2, lg: 3, xl: 4 } });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.style.getPropertyValue('--hz-grid-cols-sm')).toBe('1');
		expect(el.style.getPropertyValue('--hz-grid-cols-md')).toBe('2');
		expect(el.style.getPropertyValue('--hz-grid-cols-lg')).toBe('3');
		expect(el.style.getPropertyValue('--hz-grid-cols-xl')).toBe('4');
	});

	it('object mode → no flat --hz-grid-cols prop', () => {
		const { container } = render(Grid, { columns: { sm: 1, md: 2, lg: 3 } });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.style.getPropertyValue('--hz-grid-cols')).toBe('');
	});

	it('object mode → no data-columns attribute', () => {
		const { container } = render(Grid, { columns: { sm: 1, md: 2, lg: 3 } });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.hasAttribute('data-columns')).toBe(false);
	});

	it('{ md: 2 } (partial) → only --hz-grid-cols-md set; sm, lg, and xl absent', () => {
		const { container } = render(Grid, { columns: { md: 2 } });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.style.getPropertyValue('--hz-grid-cols-md')).toBe('2');
		expect(el.style.getPropertyValue('--hz-grid-cols-sm')).toBe('');
		expect(el.style.getPropertyValue('--hz-grid-cols-lg')).toBe('');
		expect(el.style.getPropertyValue('--hz-grid-cols-xl')).toBe('');
	});

	it('{} (empty object) → no column custom properties emitted', () => {
		const { container } = render(Grid, { columns: {} });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.style.getPropertyValue('--hz-grid-cols')).toBe('');
		expect(el.style.getPropertyValue('--hz-grid-cols-sm')).toBe('');
		expect(el.style.getPropertyValue('--hz-grid-cols-md')).toBe('');
		expect(el.style.getPropertyValue('--hz-grid-cols-lg')).toBe('');
		expect(el.style.getPropertyValue('--hz-grid-cols-xl')).toBe('');
	});

	it('{} (empty object) → cascade falls back to 1 column, still renders', () => {
		const { container } = render(Grid, { columns: {} });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el).not.toBeNull();
		// Base CSS: repeat(var(--hz-grid-cols-sm, var(--hz-grid-cols, 1)), ...) → 1
		expect(countTracks(el)).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// R12 — container-query breakpoints (columns respond to the grid's own width)
// ---------------------------------------------------------------------------

describe('R12 — container-query breakpoints', () => {
	it('default {sm:1, md:2, lg:3}: 1 track below 640px, 2 from 640px, 3 from 968px', () => {
		const { container } = render(Grid);
		const root = container.querySelector('.hz-grid') as HTMLElement;
		expect(countTracks(root, 500)).toBe(1);
		expect(countTracks(root, 700)).toBe(2);
		expect(countTracks(root, 1000)).toBe(3);
	});

	it('xl key applies from 1200px of container width', () => {
		const { container } = render(Grid, { columns: { sm: 1, lg: 2, xl: 4 } });
		const root = container.querySelector('.hz-grid') as HTMLElement;
		expect(countTracks(root, 1000)).toBe(2);
		expect(countTracks(root, 1300)).toBe(4);
	});

	it('partial keys fall back to the next-narrower defined key', () => {
		const { container } = render(Grid, { columns: { md: 2 } });
		const root = container.querySelector('.hz-grid') as HTMLElement;
		// No sm → 1 below 640; md: 2 applies from 640 up (lg/xl fall back to md)
		expect(countTracks(root, 500)).toBe(1);
		expect(countTracks(root, 700)).toBe(2);
		expect(countTracks(root, 1300)).toBe(2);
	});
});

// ---------------------------------------------------------------------------
// Fluid columns — columns={{ min }} → auto-fit, no breakpoints, var-driven
// ---------------------------------------------------------------------------

describe('fluid columns ({ min })', () => {
	/** Fill the layout with cells so auto-fit tracks don't collapse. */
	function appendCells(root: HTMLElement, n: number): void {
		const layout = root.querySelector('.hz-grid-layout') as HTMLElement;
		for (let i = 0; i < n; i++) {
			const cell = document.createElement('div');
			cell.style.height = '5px';
			layout.appendChild(cell);
		}
	}

	it('{ min } → data-fluid attribute and --hz-grid-min inline custom prop', () => {
		const { container } = render(Grid, { columns: { min: '16rem' } });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.hasAttribute('data-fluid')).toBe(true);
		expect(el.style.getPropertyValue('--hz-grid-min')).toBe('16rem');
		expect(el.style.getPropertyValue('--hz-grid-cols')).toBe('');
	});

	it('band mode → no data-fluid attribute', () => {
		const { container } = render(Grid);
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.hasAttribute('data-fluid')).toBe(false);
	});

	it('track count follows available width continuously — no breakpoints', () => {
		const { container } = render(Grid, { columns: { min: '200px' }, gap: 'none' });
		const root = container.querySelector('.hz-grid') as HTMLElement;
		appendCells(root, 6);
		expect(countTracks(root, 700)).toBe(3); // floor(700 / 200)
		expect(countTracks(root, 1000)).toBe(5); // floor(1000 / 200)
	});

	it('min resolves through var() — overriding retunes the columns', () => {
		const { container } = render(Grid, {
			columns: { min: 'var(--card-min, 200px)' },
			gap: 'none'
		});
		const root = container.querySelector('.hz-grid') as HTMLElement;
		appendCells(root, 6);
		expect(countTracks(root, 700)).toBe(3);
		root.style.setProperty('--card-min', '300px');
		expect(countTracks(root, 700)).toBe(2); // floor(700 / 300)
	});
});

// ---------------------------------------------------------------------------
// R13 — gap prop
// ---------------------------------------------------------------------------

describe('R13 — gap prop', () => {
	const gapEntries: Array<{
		gap: 'none' | 'sm' | 'md' | 'lg' | 'near' | 'away';
		expectedPx: string;
	}> = [
		{ gap: 'none', expectedPx: '0px' },
		{ gap: 'sm', expectedPx: '16px' }, // 1rem
		{ gap: 'md', expectedPx: '32px' }, // 2rem
		{ gap: 'lg', expectedPx: '64px' }, // 4rem
		{ gap: 'near', expectedPx: '64px' }, // density fallback 4rem
		{ gap: 'away', expectedPx: '128px' } // density fallback 8rem
	];

	for (const { gap, expectedPx } of gapEntries) {
		it(`gap="${gap}" is reflected in data-gap`, () => {
			const { container } = render(Grid, { gap });
			const el = container.querySelector('.hz-grid') as HTMLElement;
			expect(el.getAttribute('data-gap')).toBe(gap);
		});

		it(`gap="${gap}" drives computed row-gap: ${expectedPx}`, () => {
			const { container } = render(Grid, { gap });
			const layout = container.querySelector('.hz-grid-layout') as HTMLElement;
			expect(getComputedStyle(layout).rowGap).toBe(expectedPx);
		});
	}
});

// ---------------------------------------------------------------------------
// padding prop (shared LayoutPadding scale, both axes, on the container root)
// ---------------------------------------------------------------------------

describe('padding prop', () => {
	it('defaults to data-padding="none" with zero computed padding', () => {
		const { container } = render(Grid);
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.getAttribute('data-padding')).toBe('none');
		expect(getComputedStyle(el).padding).toBe('0px');
	});

	const paddingEntries: Array<{
		padding: 'sm' | 'md' | 'lg' | 'near' | 'away';
		expectedPx: string;
	}> = [
		{ padding: 'sm', expectedPx: '16px' }, // 1rem
		{ padding: 'md', expectedPx: '32px' }, // 2rem
		{ padding: 'lg', expectedPx: '64px' }, // 4rem
		{ padding: 'near', expectedPx: '64px' }, // density fallback 4rem
		{ padding: 'away', expectedPx: '128px' } // density fallback 8rem
	];

	for (const { padding, expectedPx } of paddingEntries) {
		it(`padding="${padding}" drives padding on both axes: ${expectedPx}`, () => {
			const { container } = render(Grid, { padding });
			const el = container.querySelector('.hz-grid') as HTMLElement;
			expect(el.getAttribute('data-padding')).toBe(padding);
			expect(getComputedStyle(el).paddingLeft).toBe(expectedPx);
			expect(getComputedStyle(el).paddingTop).toBe(expectedPx);
		});
	}

	it('padding shrinks the width the container queries measure (border-box)', () => {
		// Under border-box sizing (the reset's default — not loaded in this
		// test page, so set explicitly): 700px root − 2×32px md padding =
		// 636px content < the 640px threshold → sm band (1 track) even
		// though the root is 700px wide.
		const { container } = render(Grid, { padding: 'md' });
		const root = container.querySelector('.hz-grid') as HTMLElement;
		root.style.boxSizing = 'border-box';
		expect(countTracks(root, 700)).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// R13 — align prop
// ---------------------------------------------------------------------------

describe('R13 — align prop', () => {
	const alignEntries: Array<{
		align: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
		expectedAlignItems: string;
	}> = [
		{ align: 'start', expectedAlignItems: 'flex-start' },
		{ align: 'center', expectedAlignItems: 'center' },
		{ align: 'end', expectedAlignItems: 'flex-end' },
		{ align: 'stretch', expectedAlignItems: 'stretch' },
		{ align: 'baseline', expectedAlignItems: 'baseline' }
	];

	for (const { align, expectedAlignItems } of alignEntries) {
		it(`align="${align}" is reflected in data-align`, () => {
			const { container } = render(Grid, { align });
			const el = container.querySelector('.hz-grid') as HTMLElement;
			expect(el.getAttribute('data-align')).toBe(align);
		});

		it(`align="${align}" drives computed align-items: ${expectedAlignItems}`, () => {
			const { container } = render(Grid, { align });
			const layout = container.querySelector('.hz-grid-layout') as HTMLElement;
			expect(getComputedStyle(layout).alignItems).toBe(expectedAlignItems);
		});
	}
});

// ---------------------------------------------------------------------------
// R18 — as prop renders the correct element
// ---------------------------------------------------------------------------

describe('R18 — as prop', () => {
	it('as="section" → root tag is SECTION', () => {
		const { container } = render(Grid, { as: 'section' });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.tagName).toBe('SECTION');
	});

	it('as="section" preserves data-gap and data-align', () => {
		const { container } = render(Grid, { as: 'section', gap: 'lg', align: 'center' });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.tagName).toBe('SECTION');
		expect(el.getAttribute('data-gap')).toBe('lg');
		expect(el.getAttribute('data-align')).toBe('center');
	});

	it('default as → renders a <div>', () => {
		const { container } = render(Grid);
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.tagName).toBe('DIV');
	});
});

// ---------------------------------------------------------------------------
// R19 — class composition
// ---------------------------------------------------------------------------

describe('R19 — class composition', () => {
	it('no class prop → consumer class is exactly "hz-grid"', () => {
		const { container } = render(Grid);
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(consumerClasses(el)).toEqual(['hz-grid']);
	});

	it('class="foo bar" → hz-grid is first, foo and bar are also present', () => {
		const { container } = render(Grid, { class: 'foo bar' });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		const cls = consumerClasses(el);
		expect(cls[0]).toBe('hz-grid');
		expect(cls).toContain('foo');
		expect(cls).toContain('bar');
	});
});

// ---------------------------------------------------------------------------
// R20 — rest forwarding
// ---------------------------------------------------------------------------

describe('R20 — rest forwarding', () => {
	it('forwards extra attributes (e.g. data-testid) to the root element', () => {
		const { container } = render(Grid, { 'data-testid': 'my-grid' } as Record<string, unknown>);
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.getAttribute('data-testid')).toBe('my-grid');
	});

	it('rest attribute cannot overwrite managed data-gap', () => {
		const { container } = render(Grid, { 'data-gap': 'override' } as Record<string, unknown>);
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.getAttribute('data-gap')).toBe('md');
	});

	it('rest style cannot overwrite the managed --hz-grid-cols* inline style', () => {
		const { container } = render(Grid, {
			columns: { sm: 2, md: 3, lg: 4 },
			style: 'color: red'
		} as Record<string, unknown>);
		const el = container.querySelector('.hz-grid') as HTMLElement;
		// The component sets style={gridStyle} after spreading rest, so managed
		// custom properties survive even when rest tries to set a style attribute.
		expect(el.style.getPropertyValue('--hz-grid-cols-sm')).toBe('2');
		expect(el.style.getPropertyValue('--hz-grid-cols-md')).toBe('3');
		expect(el.style.getPropertyValue('--hz-grid-cols-lg')).toBe('4');
	});
});

// ---------------------------------------------------------------------------
// R21 — Barrel export
// ---------------------------------------------------------------------------

describe('R21 — barrel export', () => {
	it('Grid is resolvable from $lib', async () => {
		const { Grid: G } = await import('$lib');
		expect(G).toBeDefined();
	});
});
