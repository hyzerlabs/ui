import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Split from './Split.svelte';

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
 * Read the stylesheet-internal `--_cols` custom property set by the
 * data-fraction CSS rules. This verifies the fraction→template mapping
 * without depending on the test-environment viewport size.
 */
function getCols(el: HTMLElement): string {
	return getComputedStyle(el).getPropertyValue('--_cols').trim();
}

/**
 * Add two `<div>` children to the split's inner layout element (where slotted
 * children land) and return them. Used to test the CSS `order` reversal and
 * DOM-order preservation. (createRawSnippet cannot return multi-element HTML,
 * so we do this directly.)
 */
function appendTwoChildren(root: HTMLElement): [HTMLElement, HTMLElement] {
	const layout = root.querySelector('.hz-split-layout') as HTMLElement;
	const c1 = document.createElement('div');
	c1.setAttribute('data-child', '1');
	const c2 = document.createElement('div');
	c2.setAttribute('data-child', '2');
	layout.appendChild(c1);
	layout.appendChild(c2);
	return [c1, c2];
}

// ---------------------------------------------------------------------------
// R14 — Default render
// ---------------------------------------------------------------------------

describe('R14 — default render', () => {
	it('renders a <div> by default', () => {
		const { container } = render(Split);
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el).not.toBeNull();
		expect(el.tagName).toBe('DIV');
	});

	it('has hz-split as its only consumer class by default', () => {
		const { container } = render(Split);
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(consumerClasses(el)).toEqual(['hz-split']);
	});

	it('has data-fraction="1/2" by default', () => {
		const { container } = render(Split);
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.getAttribute('data-fraction')).toBe('1/2');
	});

	it('has data-gap="md" by default', () => {
		const { container } = render(Split);
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.getAttribute('data-gap')).toBe('md');
	});

	it('has data-stack-below="sm" by default', () => {
		const { container } = render(Split);
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.getAttribute('data-stack-below')).toBe('sm');
	});

	it('has data-reverse absent by default', () => {
		const { container } = render(Split);
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.hasAttribute('data-reverse')).toBe(false);
	});

	it('root is the size container; inner .hz-split-layout has computed display: grid', () => {
		const { container } = render(Split);
		const el = container.querySelector('.hz-split') as HTMLElement;
		const layout = el.querySelector('.hz-split-layout') as HTMLElement;
		expect(getComputedStyle(el).containerType).toBe('inline-size');
		expect(getComputedStyle(layout).display).toBe('grid');
	});

	it('renders children', () => {
		const { container } = render(Split, { children: childrenSnippet });
		expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
	});

	it('renders an empty split with no children and no error', () => {
		const { container } = render(Split);
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R15 — fraction prop
// ---------------------------------------------------------------------------

describe('R15 — fraction prop', () => {
	/**
	 * Fractions and the grid-template-columns template they should produce.
	 * The mapping is verified via the `--_cols` CSS custom property set by
	 * the data-fraction attribute selectors in the shipped stylesheet.
	 */
	const fractionEntries: Array<{
		fraction: '1/4' | '1/3' | '1/2' | '2/3' | '3/4' | 'auto';
		expectedCols: string;
	}> = [
		{ fraction: '1/4', expectedCols: '1fr 3fr' },
		{ fraction: '1/3', expectedCols: '1fr 2fr' },
		{ fraction: '1/2', expectedCols: '1fr 1fr' },
		{ fraction: '2/3', expectedCols: '2fr 1fr' },
		{ fraction: '3/4', expectedCols: '3fr 1fr' },
		{ fraction: 'auto', expectedCols: 'auto 1fr' }
	];

	for (const { fraction, expectedCols } of fractionEntries) {
		it(`fraction="${fraction}" is reflected in data-fraction`, () => {
			const { container } = render(Split, { fraction });
			const el = container.querySelector('.hz-split') as HTMLElement;
			expect(el.getAttribute('data-fraction')).toBe(fraction);
		});

		it(`fraction="${fraction}" → CSS --_cols template is "${expectedCols}"`, () => {
			const { container } = render(Split, { fraction });
			const el = container.querySelector('.hz-split') as HTMLElement;
			// --_cols is the internal CSS variable set by the [data-fraction] rule
			// and consumed by the breakpoint media-query rules as grid-template-columns.
			expect(getCols(el)).toBe(expectedCols);
		});
	}

	it('fraction="auto" → data-fraction="auto" with --_cols "auto 1fr"', () => {
		const { container } = render(Split, { fraction: 'auto' });
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.getAttribute('data-fraction')).toBe('auto');
		expect(getCols(el)).toBe('auto 1fr');
	});
});

// ---------------------------------------------------------------------------
// R16 — reverse prop
// ---------------------------------------------------------------------------

describe('R16 — reverse prop', () => {
	it('reverse=false (default) → data-reverse absent', () => {
		const { container } = render(Split);
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.hasAttribute('data-reverse')).toBe(false);
	});

	it('reverse=true → data-reverse present', () => {
		const { container } = render(Split, { reverse: true });
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.hasAttribute('data-reverse')).toBe(true);
	});

	it('reverse=true → DOM source order of children is unchanged (first child stays first)', () => {
		const { container } = render(Split, { reverse: true });
		const el = container.querySelector('.hz-split') as HTMLElement;
		const layout = el.querySelector('.hz-split-layout') as HTMLElement;
		const [c1, c2] = appendTwoChildren(el);
		// DOM order must match insertion order regardless of visual reversal
		expect(layout.children[0]).toBe(c1);
		expect(layout.children[1]).toBe(c2);
	});

	it('reverse=true → CSS visually swaps via order: first child gets order: 2', () => {
		const { container } = render(Split, { reverse: true });
		const el = container.querySelector('.hz-split') as HTMLElement;
		const [c1] = appendTwoChildren(el);
		expect(getComputedStyle(c1).order).toBe('2');
	});

	it('reverse=true → CSS visually swaps via order: last child gets order: 1', () => {
		const { container } = render(Split, { reverse: true });
		const el = container.querySelector('.hz-split') as HTMLElement;
		const [, c2] = appendTwoChildren(el);
		expect(getComputedStyle(c2).order).toBe('1');
	});

	it('reverse=false → no CSS order applied to children (order: 0)', () => {
		const { container } = render(Split, { reverse: false });
		const el = container.querySelector('.hz-split') as HTMLElement;
		const [c1, c2] = appendTwoChildren(el);
		expect(getComputedStyle(c1).order).toBe('0');
		expect(getComputedStyle(c2).order).toBe('0');
	});
});

// ---------------------------------------------------------------------------
// R17 — stackBelow prop
// ---------------------------------------------------------------------------

describe('R17 — stackBelow prop', () => {
	/**
	 * Read the layout's grid-template-columns with the root (the size
	 * container) forced to a given width. 'none' means stacked (single
	 * auto-flow column); two track values mean side by side.
	 */
	function templateAt(root: HTMLElement, width: number): string {
		root.style.width = `${width}px`;
		const layout = root.querySelector('.hz-split-layout') as HTMLElement;
		return getComputedStyle(layout).gridTemplateColumns.trim();
	}

	for (const stackBelow of ['sm', 'md', 'lg'] as const) {
		it(`stackBelow="${stackBelow}" is reflected in data-stack-below`, () => {
			const { container } = render(Split, { stackBelow });
			const el = container.querySelector('.hz-split') as HTMLElement;
			expect(el.getAttribute('data-stack-below')).toBe(stackBelow);
		});
	}

	const thresholds = [
		{ stackBelow: 'sm', px: 640 },
		{ stackBelow: 'md', px: 968 },
		{ stackBelow: 'lg', px: 1200 }
	] as const;

	for (const { stackBelow, px } of thresholds) {
		it(`stackBelow="${stackBelow}" stacks below ${px}px of container width and splits at ${px}px`, () => {
			const { container } = render(Split, { stackBelow });
			const root = container.querySelector('.hz-split') as HTMLElement;
			expect(templateAt(root, px - 40)).toBe('none');
			expect(templateAt(root, px).split(/\s+/).length).toBe(2);
		});
	}

	it('gap is retained while stacked (computed row-gap is non-zero for gap="md")', () => {
		const { container } = render(Split, { gap: 'md', stackBelow: 'md' });
		const root = container.querySelector('.hz-split') as HTMLElement;
		root.style.width = '500px';
		const layout = root.querySelector('.hz-split-layout') as HTMLElement;
		expect(getComputedStyle(layout).rowGap).toBe('32px');
	});
});

// ---------------------------------------------------------------------------
// Split gap prop
// ---------------------------------------------------------------------------

describe('Split gap prop', () => {
	const gapEntries: Array<{
		gap: 'none' | 'sm' | 'md' | 'lg' | 'near' | 'away';
		expectedPx: string;
	}> = [
		{ gap: 'none', expectedPx: '0px' },
		{ gap: 'sm', expectedPx: '16px' }, // 1rem
		{ gap: 'md', expectedPx: '32px' }, // 2rem
		{ gap: 'lg', expectedPx: '64px' }, // 4rem
		{ gap: 'near', expectedPx: '32px' }, // density fallback 2rem
		{ gap: 'away', expectedPx: '64px' } // density fallback 4rem
	];

	for (const { gap, expectedPx } of gapEntries) {
		it(`gap="${gap}" is reflected in data-gap`, () => {
			const { container } = render(Split, { gap });
			const el = container.querySelector('.hz-split') as HTMLElement;
			expect(el.getAttribute('data-gap')).toBe(gap);
		});

		it(`gap="${gap}" drives computed row-gap: ${expectedPx}`, () => {
			const { container } = render(Split, { gap });
			const layout = container.querySelector('.hz-split-layout') as HTMLElement;
			expect(getComputedStyle(layout).rowGap).toBe(expectedPx);
		});
	}
});

// ---------------------------------------------------------------------------
// padding prop (shared LayoutPadding scale, both axes, on the container root)
// ---------------------------------------------------------------------------

describe('padding prop', () => {
	it('defaults to data-padding="none" with zero computed padding', () => {
		const { container } = render(Split);
		const el = container.querySelector('.hz-split') as HTMLElement;
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
		{ padding: 'near', expectedPx: '32px' }, // density fallback 2rem
		{ padding: 'away', expectedPx: '64px' } // density fallback 4rem
	];

	for (const { padding, expectedPx } of paddingEntries) {
		it(`padding="${padding}" drives padding on both axes: ${expectedPx}`, () => {
			const { container } = render(Split, { padding });
			const el = container.querySelector('.hz-split') as HTMLElement;
			expect(el.getAttribute('data-padding')).toBe(padding);
			expect(getComputedStyle(el).paddingLeft).toBe(expectedPx);
			expect(getComputedStyle(el).paddingTop).toBe(expectedPx);
		});
	}
});

// ---------------------------------------------------------------------------
// R18 — as prop renders the correct element
// ---------------------------------------------------------------------------

describe('R18 — as prop', () => {
	it('as="section" → root tag is SECTION', () => {
		const { container } = render(Split, { as: 'section' });
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.tagName).toBe('SECTION');
	});

	it('as="section" preserves all data-* attributes', () => {
		const { container } = render(Split, {
			as: 'section',
			fraction: '1/3',
			gap: 'lg',
			stackBelow: 'lg'
		});
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.tagName).toBe('SECTION');
		expect(el.getAttribute('data-fraction')).toBe('1/3');
		expect(el.getAttribute('data-gap')).toBe('lg');
		expect(el.getAttribute('data-stack-below')).toBe('lg');
	});

	it('default as → renders a <div>', () => {
		const { container } = render(Split);
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.tagName).toBe('DIV');
	});
});

// ---------------------------------------------------------------------------
// R19 — class composition
// ---------------------------------------------------------------------------

describe('R19 — class composition', () => {
	it('no class prop → consumer class is exactly "hz-split"', () => {
		const { container } = render(Split);
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(consumerClasses(el)).toEqual(['hz-split']);
	});

	it('class="foo bar" → hz-split is first, foo and bar are also present', () => {
		const { container } = render(Split, { class: 'foo bar' });
		const el = container.querySelector('.hz-split') as HTMLElement;
		const cls = consumerClasses(el);
		expect(cls[0]).toBe('hz-split');
		expect(cls).toContain('foo');
		expect(cls).toContain('bar');
	});
});

// ---------------------------------------------------------------------------
// R20 — rest forwarding
// ---------------------------------------------------------------------------

describe('R20 — rest forwarding', () => {
	it('forwards extra attributes (e.g. data-testid) to the root element', () => {
		const { container } = render(Split, {
			'data-testid': 'my-split'
		} as Record<string, unknown>);
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.getAttribute('data-testid')).toBe('my-split');
	});

	it('rest attribute cannot overwrite managed data-fraction', () => {
		const { container } = render(Split, {
			'data-fraction': 'override'
		} as Record<string, unknown>);
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.getAttribute('data-fraction')).toBe('1/2');
	});

	it('rest attribute cannot overwrite managed data-stack-below', () => {
		const { container } = render(Split, {
			'data-stack-below': 'override'
		} as Record<string, unknown>);
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.getAttribute('data-stack-below')).toBe('sm');
	});
});

// ---------------------------------------------------------------------------
// R21 — Barrel export
// ---------------------------------------------------------------------------

describe('R21 — barrel export', () => {
	it('Split is resolvable from $lib', async () => {
		const { Split: S } = await import('$lib');
		expect(S).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
	it('renders with ≠ 2 element children (3 children) without error', () => {
		const { container } = render(Split);
		const el = container.querySelector('.hz-split') as HTMLElement;
		const layout = el.querySelector('.hz-split-layout') as HTMLElement;
		// Add three children directly — the two-track grid applies to whatever children exist
		for (let i = 1; i <= 3; i++) {
			const child = document.createElement('div');
			child.setAttribute('data-child', String(i));
			layout.appendChild(child);
		}
		expect(el).not.toBeNull();
		expect(el.querySelectorAll('[data-child]')).toHaveLength(3);
	});
});
