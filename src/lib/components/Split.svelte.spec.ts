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
 * Add two `<div>` children to the split's inner layout element (where slotted
 * children land) and return them. Used to test the CSS `order` reversal,
 * DOM-order preservation, and stacking geometry. Fixed height so stacked vs
 * side-by-side is measurable via bounding rects. (createRawSnippet cannot
 * return multi-element HTML, so we do this directly.)
 */
function appendTwoChildren(root: HTMLElement): [HTMLElement, HTMLElement] {
	const layout = root.querySelector('.hz-split-layout') as HTMLElement;
	const c1 = document.createElement('div');
	c1.setAttribute('data-child', '1');
	c1.style.height = '10px';
	const c2 = document.createElement('div');
	c2.setAttribute('data-child', '2');
	c2.style.height = '10px';
	layout.appendChild(c1);
	layout.appendChild(c2);
	return [c1, c2];
}

/**
 * With the root forced to `width`, report whether the two children sit on
 * separate lines (stacked) or share one (side by side).
 */
function isStacked(root: HTMLElement, c1: HTMLElement, c2: HTMLElement, width: number): boolean {
	root.style.width = `${width}px`;
	const r1 = c1.getBoundingClientRect();
	const r2 = c2.getBoundingClientRect();
	return r2.top >= r1.bottom - 0.5;
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

	it('inner .hz-split-layout is a wrapping flex row (the switcher)', () => {
		const { container } = render(Split);
		const el = container.querySelector('.hz-split') as HTMLElement;
		const layout = el.querySelector('.hz-split-layout') as HTMLElement;
		expect(getComputedStyle(layout).display).toBe('flex');
		expect(getComputedStyle(layout).flexWrap).toBe('wrap');
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
	 * Fractions and the flex-grow ratio they should give the two columns.
	 * With switcher basis floored to 0 side by side, grow ratios become
	 * width ratios.
	 */
	const fractionEntries: Array<{
		fraction: '1/4' | '1/3' | '1/2' | '2/3' | '3/4';
		expectedGrow: [string, string];
	}> = [
		{ fraction: '1/4', expectedGrow: ['1', '3'] },
		{ fraction: '1/3', expectedGrow: ['1', '2'] },
		{ fraction: '1/2', expectedGrow: ['1', '1'] },
		{ fraction: '2/3', expectedGrow: ['2', '1'] },
		{ fraction: '3/4', expectedGrow: ['3', '1'] }
	];

	for (const { fraction, expectedGrow } of fractionEntries) {
		it(`fraction="${fraction}" is reflected in data-fraction`, () => {
			const { container } = render(Split, { fraction });
			const el = container.querySelector('.hz-split') as HTMLElement;
			expect(el.getAttribute('data-fraction')).toBe(fraction);
		});

		it(`fraction="${fraction}" → children flex-grow ${expectedGrow.join(' / ')}`, () => {
			const { container } = render(Split, { fraction });
			const el = container.querySelector('.hz-split') as HTMLElement;
			const [c1, c2] = appendTwoChildren(el);
			expect(getComputedStyle(c1).flexGrow).toBe(expectedGrow[0]);
			expect(getComputedStyle(c2).flexGrow).toBe(expectedGrow[1]);
		});
	}

	it('fraction="1/4" side by side → first column ≈ a quarter of the width', () => {
		const { container } = render(Split, { fraction: '1/4', gap: 'none', stackBelow: 'sm' });
		const el = container.querySelector('.hz-split') as HTMLElement;
		const [c1] = appendTwoChildren(el);
		el.style.width = '800px';
		expect(c1.getBoundingClientRect().width).toBeCloseTo(200, 0);
	});

	it('fraction="auto" → first column is content-sized, second fills', () => {
		const { container } = render(Split, { fraction: 'auto' });
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.getAttribute('data-fraction')).toBe('auto');
		const [c1, c2] = appendTwoChildren(el);
		expect(getComputedStyle(c1).flexGrow).toBe('0');
		expect(getComputedStyle(c1).flexBasis).toBe('auto');
		expect(getComputedStyle(c2).flexGrow).toBe('1');
	});

	it('fraction="auto-end" → last column is content-sized, first fills', () => {
		const { container } = render(Split, { fraction: 'auto-end' });
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.getAttribute('data-fraction')).toBe('auto-end');
		const [c1, c2] = appendTwoChildren(el);
		expect(getComputedStyle(c1).flexGrow).toBe('1');
		expect(getComputedStyle(c2).flexGrow).toBe('0');
		expect(getComputedStyle(c2).flexBasis).toBe('auto');
	});
});

// ---------------------------------------------------------------------------
// R15a — stackBelow="none"
// ---------------------------------------------------------------------------

describe('R15a — stackBelow="none"', () => {
	it('never stacks: columns share the line even at a tiny width', () => {
		const { container } = render(Split, { stackBelow: 'none', gap: 'none' });
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.getAttribute('data-stack-below')).toBe('none');
		const [c1, c2] = appendTwoChildren(el);
		el.style.width = '200px';
		// Side by side — the two columns sit on one row.
		expect(c1.getBoundingClientRect().top).toBeCloseTo(c2.getBoundingClientRect().top, 0);
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
		it(`stackBelow="${stackBelow}" stacks below ${px}px of its own width and splits at ${px}px`, () => {
			const { container } = render(Split, { stackBelow, gap: 'none' });
			const root = container.querySelector('.hz-split') as HTMLElement;
			const [c1, c2] = appendTwoChildren(root);
			expect(isStacked(root, c1, c2, px - 40)).toBe(true);
			expect(isStacked(root, c1, c2, px)).toBe(false);
		});
	}

	it('the threshold resolves through var() — overriding --hz-width-sm retunes it', () => {
		const { container } = render(Split, { stackBelow: 'sm', gap: 'none' });
		const root = container.querySelector('.hz-split') as HTMLElement;
		const [c1, c2] = appendTwoChildren(root);
		// 700px is side by side at the 640px fallback…
		expect(isStacked(root, c1, c2, 700)).toBe(false);
		// …but stacked once the sm width token is raised above it.
		root.style.setProperty('--hz-width-sm', '800px');
		expect(isStacked(root, c1, c2, 700)).toBe(true);
		root.style.removeProperty('--hz-width-sm');
		expect(isStacked(root, c1, c2, 700)).toBe(false);
	});

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
		{ gap: 'near', expectedPx: '64px' }, // density fallback 4rem
		{ gap: 'away', expectedPx: '128px' } // density fallback 8rem
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
		{ padding: 'near', expectedPx: '64px' }, // density fallback 4rem
		{ padding: 'away', expectedPx: '128px' } // density fallback 8rem
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
// paddingInline / paddingBlock — per-axis overrides of the padding shorthand
// ---------------------------------------------------------------------------

describe('paddingInline / paddingBlock props', () => {
	it('are absent by default — no data-padding-inline/-block attributes', () => {
		const { container } = render(Split);
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.hasAttribute('data-padding-inline')).toBe(false);
		expect(el.hasAttribute('data-padding-block')).toBe(false);
	});

	it('paddingInline sets the inline axis only', () => {
		const { container } = render(Split, { paddingInline: 'lg' });
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.getAttribute('data-padding-inline')).toBe('lg');
		expect(getComputedStyle(el).paddingLeft).toBe('64px');
		expect(getComputedStyle(el).paddingTop).toBe('0px'); // padding default 'none'
	});

	it('paddingBlock sets the block axis only', () => {
		const { container } = render(Split, { paddingBlock: 'sm' });
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(el.getAttribute('data-padding-block')).toBe('sm');
		expect(getComputedStyle(el).paddingTop).toBe('16px');
		expect(getComputedStyle(el).paddingLeft).toBe('0px');
	});

	it('longhand wins over the padding shorthand on its axis', () => {
		const { container } = render(Split, { padding: 'md', paddingInline: 'none' });
		const el = container.querySelector('.hz-split') as HTMLElement;
		expect(getComputedStyle(el).paddingLeft).toBe('0px');
		expect(getComputedStyle(el).paddingTop).toBe('32px');
	});
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
