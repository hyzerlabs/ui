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
 * Force a fixed width on el, then count the number of grid column tracks by
 * splitting the computed gridTemplateColumns string. The fixed width ensures
 * minmax(0,1fr) tracks have a defined size and are countable.
 *
 * NOTE: This function is only reliable for `columns={N}` (number prop) mode
 * because those custom properties are viewport-independent — they resolve
 * identically at every breakpoint. Object-mode breakpoint values depend on
 * the test-environment viewport.
 */
function countTracks(el: HTMLElement, width = 700): number {
	el.style.width = `${width}px`;
	const value = getComputedStyle(el).gridTemplateColumns.trim();
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

	it('has computed display: grid', () => {
		const { container } = render(Grid);
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(getComputedStyle(el).display).toBe('grid');
	});

	it('default columns object → --hz-grid-cols-sm/md/lg inline custom props', () => {
		const { container } = render(Grid);
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.style.getPropertyValue('--hz-grid-cols-sm')).toBe('1');
		expect(el.style.getPropertyValue('--hz-grid-cols-md')).toBe('2');
		expect(el.style.getPropertyValue('--hz-grid-cols-lg')).toBe('3');
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
	it('{ sm: 1, md: 2, lg: 3 } → per-key inline custom props', () => {
		const { container } = render(Grid, { columns: { sm: 1, md: 2, lg: 3 } });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.style.getPropertyValue('--hz-grid-cols-sm')).toBe('1');
		expect(el.style.getPropertyValue('--hz-grid-cols-md')).toBe('2');
		expect(el.style.getPropertyValue('--hz-grid-cols-lg')).toBe('3');
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

	it('{ md: 2 } (partial) → only --hz-grid-cols-md set; sm and lg absent', () => {
		const { container } = render(Grid, { columns: { md: 2 } });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.style.getPropertyValue('--hz-grid-cols-md')).toBe('2');
		expect(el.style.getPropertyValue('--hz-grid-cols-sm')).toBe('');
		expect(el.style.getPropertyValue('--hz-grid-cols-lg')).toBe('');
	});

	it('{} (empty object) → no column custom properties emitted', () => {
		const { container } = render(Grid, { columns: {} });
		const el = container.querySelector('.hz-grid') as HTMLElement;
		expect(el.style.getPropertyValue('--hz-grid-cols')).toBe('');
		expect(el.style.getPropertyValue('--hz-grid-cols-sm')).toBe('');
		expect(el.style.getPropertyValue('--hz-grid-cols-md')).toBe('');
		expect(el.style.getPropertyValue('--hz-grid-cols-lg')).toBe('');
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
// R13 — gap prop
// ---------------------------------------------------------------------------

describe('R13 — gap prop', () => {
	const gapEntries: Array<{ gap: 'none' | 'sm' | 'md' | 'lg'; expectedPx: string }> = [
		{ gap: 'none', expectedPx: '0px' },
		{ gap: 'sm', expectedPx: '16px' }, // 1rem
		{ gap: 'md', expectedPx: '32px' }, // 2rem
		{ gap: 'lg', expectedPx: '64px' } // 4rem
	];

	for (const { gap, expectedPx } of gapEntries) {
		it(`gap="${gap}" is reflected in data-gap`, () => {
			const { container } = render(Grid, { gap });
			const el = container.querySelector('.hz-grid') as HTMLElement;
			expect(el.getAttribute('data-gap')).toBe(gap);
		});

		it(`gap="${gap}" drives computed row-gap: ${expectedPx}`, () => {
			const { container } = render(Grid, { gap });
			const el = container.querySelector('.hz-grid') as HTMLElement;
			expect(getComputedStyle(el).rowGap).toBe(expectedPx);
		});
	}
});

// ---------------------------------------------------------------------------
// R13 — align prop
// ---------------------------------------------------------------------------

describe('R13 — align prop', () => {
	const alignEntries: Array<{
		align: 'start' | 'center' | 'end' | 'stretch';
		expectedAlignItems: string;
	}> = [
		{ align: 'start', expectedAlignItems: 'flex-start' },
		{ align: 'center', expectedAlignItems: 'center' },
		{ align: 'end', expectedAlignItems: 'flex-end' },
		{ align: 'stretch', expectedAlignItems: 'stretch' }
	];

	for (const { align, expectedAlignItems } of alignEntries) {
		it(`align="${align}" is reflected in data-align`, () => {
			const { container } = render(Grid, { align });
			const el = container.querySelector('.hz-grid') as HTMLElement;
			expect(el.getAttribute('data-align')).toBe(align);
		});

		it(`align="${align}" drives computed align-items: ${expectedAlignItems}`, () => {
			const { container } = render(Grid, { align });
			const el = container.querySelector('.hz-grid') as HTMLElement;
			expect(getComputedStyle(el).alignItems).toBe(expectedAlignItems);
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
