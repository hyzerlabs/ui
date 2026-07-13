import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Cluster from './Cluster.svelte';

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

// ---------------------------------------------------------------------------
// R7 — Default render
// ---------------------------------------------------------------------------

describe('R7 — default render', () => {
	it('renders a <div> by default', () => {
		const { container } = render(Cluster);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(el).not.toBeNull();
		expect(el.tagName).toBe('DIV');
	});

	it('has hz-cluster as its only consumer class by default', () => {
		const { container } = render(Cluster);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(consumerClasses(el)).toEqual(['hz-cluster']);
	});

	it('has data-gap="sm" by default', () => {
		const { container } = render(Cluster);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(el.getAttribute('data-gap')).toBe('sm');
	});

	it('has data-justify="start" by default', () => {
		const { container } = render(Cluster);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(el.getAttribute('data-justify')).toBe('start');
	});

	it('has data-align="center" by default', () => {
		const { container } = render(Cluster);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(el.getAttribute('data-align')).toBe('center');
	});

	it('has data-wrap present by default', () => {
		const { container } = render(Cluster);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(el.hasAttribute('data-wrap')).toBe(true);
	});

	it('has computed display: flex', () => {
		const { container } = render(Cluster);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(getComputedStyle(el).display).toBe('flex');
	});

	it('has computed flex-wrap: wrap', () => {
		const { container } = render(Cluster);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(getComputedStyle(el).flexWrap).toBe('wrap');
	});

	it('has computed row-gap matching the sm fallback (1rem = 16px)', () => {
		const { container } = render(Cluster);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(getComputedStyle(el).rowGap).toBe('16px');
	});

	it('has computed justify-content: flex-start', () => {
		const { container } = render(Cluster);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(getComputedStyle(el).justifyContent).toBe('flex-start');
	});

	it('has computed align-items: center', () => {
		const { container } = render(Cluster);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(getComputedStyle(el).alignItems).toBe('center');
	});

	it('renders children', () => {
		const { container } = render(Cluster, { children: childrenSnippet });
		expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
	});

	it('renders an empty cluster with no children and no error', () => {
		const { container } = render(Cluster);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(el).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R8 — gap prop
// ---------------------------------------------------------------------------

describe('R8 — gap prop', () => {
	const gapEntries: Array<{
		gap: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'near' | 'away';
		expectedPx: string;
	}> = [
		{ gap: 'none', expectedPx: '0px' },
		{ gap: 'xs', expectedPx: '8px' }, // 0.5rem
		{ gap: 'sm', expectedPx: '16px' }, // 1rem
		{ gap: 'md', expectedPx: '32px' }, // 2rem
		{ gap: 'lg', expectedPx: '64px' }, // 4rem
		{ gap: 'near', expectedPx: '32px' }, // density fallback 2rem
		{ gap: 'away', expectedPx: '64px' } // density fallback 4rem
	];

	for (const { gap, expectedPx } of gapEntries) {
		it(`gap="${gap}" is reflected in data-gap`, () => {
			const { container } = render(Cluster, { gap });
			const el = container.querySelector('.hz-cluster') as HTMLElement;
			expect(el.getAttribute('data-gap')).toBe(gap);
		});

		it(`gap="${gap}" drives computed row-gap: ${expectedPx}`, () => {
			const { container } = render(Cluster, { gap });
			const el = container.querySelector('.hz-cluster') as HTMLElement;
			expect(getComputedStyle(el).rowGap).toBe(expectedPx);
		});
	}
});

// ---------------------------------------------------------------------------
// padding prop (shared LayoutPadding scale, both axes)
// ---------------------------------------------------------------------------

describe('padding prop', () => {
	it('defaults to data-padding="none" with zero computed padding', () => {
		const { container } = render(Cluster);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
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
			const { container } = render(Cluster, { padding });
			const el = container.querySelector('.hz-cluster') as HTMLElement;
			expect(el.getAttribute('data-padding')).toBe(padding);
			expect(getComputedStyle(el).paddingLeft).toBe(expectedPx);
			expect(getComputedStyle(el).paddingTop).toBe(expectedPx);
		});
	}
});

// ---------------------------------------------------------------------------
// R8 — justify prop
// ---------------------------------------------------------------------------

describe('R8 — justify prop', () => {
	const justifyEntries: Array<{
		justify: 'start' | 'center' | 'end' | 'between' | 'around';
		expectedJustifyContent: string;
	}> = [
		{ justify: 'start', expectedJustifyContent: 'flex-start' },
		{ justify: 'center', expectedJustifyContent: 'center' },
		{ justify: 'end', expectedJustifyContent: 'flex-end' },
		{ justify: 'between', expectedJustifyContent: 'space-between' },
		{ justify: 'around', expectedJustifyContent: 'space-around' }
	];

	for (const { justify, expectedJustifyContent } of justifyEntries) {
		it(`justify="${justify}" is reflected in data-justify`, () => {
			const { container } = render(Cluster, { justify });
			const el = container.querySelector('.hz-cluster') as HTMLElement;
			expect(el.getAttribute('data-justify')).toBe(justify);
		});

		it(`justify="${justify}" drives computed justify-content: ${expectedJustifyContent}`, () => {
			const { container } = render(Cluster, { justify });
			const el = container.querySelector('.hz-cluster') as HTMLElement;
			expect(getComputedStyle(el).justifyContent).toBe(expectedJustifyContent);
		});
	}
});

// ---------------------------------------------------------------------------
// R8 — align prop
// ---------------------------------------------------------------------------

describe('R8 — align prop', () => {
	const alignEntries: Array<{
		align: 'start' | 'center' | 'end' | 'baseline' | 'stretch';
		expectedAlignItems: string;
	}> = [
		{ align: 'start', expectedAlignItems: 'flex-start' },
		{ align: 'center', expectedAlignItems: 'center' },
		{ align: 'end', expectedAlignItems: 'flex-end' },
		{ align: 'baseline', expectedAlignItems: 'baseline' },
		{ align: 'stretch', expectedAlignItems: 'stretch' }
	];

	for (const { align, expectedAlignItems } of alignEntries) {
		it(`align="${align}" is reflected in data-align`, () => {
			const { container } = render(Cluster, { align });
			const el = container.querySelector('.hz-cluster') as HTMLElement;
			expect(el.getAttribute('data-align')).toBe(align);
		});

		it(`align="${align}" drives computed align-items: ${expectedAlignItems}`, () => {
			const { container } = render(Cluster, { align });
			const el = container.querySelector('.hz-cluster') as HTMLElement;
			expect(getComputedStyle(el).alignItems).toBe(expectedAlignItems);
		});
	}
});

// ---------------------------------------------------------------------------
// R9 — wrap prop
// ---------------------------------------------------------------------------

describe('R9 — wrap prop', () => {
	it('wrap=true (default) → data-wrap present', () => {
		const { container } = render(Cluster);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(el.hasAttribute('data-wrap')).toBe(true);
	});

	it('wrap=true → computed flex-wrap: wrap', () => {
		const { container } = render(Cluster, { wrap: true });
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(getComputedStyle(el).flexWrap).toBe('wrap');
	});

	it('wrap=false → data-wrap absent', () => {
		const { container } = render(Cluster, { wrap: false });
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(el.hasAttribute('data-wrap')).toBe(false);
	});

	it('wrap=false → computed flex-wrap: nowrap', () => {
		const { container } = render(Cluster, { wrap: false });
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(getComputedStyle(el).flexWrap).toBe('nowrap');
	});
});

// ---------------------------------------------------------------------------
// R18 — as prop renders the correct element
// ---------------------------------------------------------------------------

describe('R18 — as prop', () => {
	it('as="nav" → root tag is NAV', () => {
		const { container } = render(Cluster, { as: 'nav' });
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(el.tagName).toBe('NAV');
	});

	it('as="nav" preserves all data-* attributes', () => {
		const { container } = render(Cluster, {
			as: 'nav',
			gap: 'md',
			justify: 'between',
			align: 'end'
		});
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(el.tagName).toBe('NAV');
		expect(el.getAttribute('data-gap')).toBe('md');
		expect(el.getAttribute('data-justify')).toBe('between');
		expect(el.getAttribute('data-align')).toBe('end');
	});

	it('default as → renders a <div>', () => {
		const { container } = render(Cluster);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(el.tagName).toBe('DIV');
	});
});

// ---------------------------------------------------------------------------
// R19 — class composition
// ---------------------------------------------------------------------------

describe('R19 — class composition', () => {
	it('no class prop → consumer class is exactly "hz-cluster"', () => {
		const { container } = render(Cluster);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(consumerClasses(el)).toEqual(['hz-cluster']);
	});

	it('class="foo bar" → hz-cluster is first, foo and bar are also present', () => {
		const { container } = render(Cluster, { class: 'foo bar' });
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		const cls = consumerClasses(el);
		expect(cls[0]).toBe('hz-cluster');
		expect(cls).toContain('foo');
		expect(cls).toContain('bar');
	});
});

// ---------------------------------------------------------------------------
// R20 — rest forwarding
// ---------------------------------------------------------------------------

describe('R20 — rest forwarding', () => {
	it('forwards extra attributes (e.g. data-testid) to the root element', () => {
		const { container } = render(Cluster, {
			'data-testid': 'my-cluster'
		} as Record<string, unknown>);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(el.getAttribute('data-testid')).toBe('my-cluster');
	});

	it('rest attribute cannot overwrite managed data-gap', () => {
		const { container } = render(Cluster, { 'data-gap': 'override' } as Record<string, unknown>);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(el.getAttribute('data-gap')).toBe('sm');
	});

	it('rest attribute cannot overwrite managed data-justify', () => {
		const { container } = render(Cluster, {
			'data-justify': 'override'
		} as Record<string, unknown>);
		const el = container.querySelector('.hz-cluster') as HTMLElement;
		expect(el.getAttribute('data-justify')).toBe('start');
	});
});

// ---------------------------------------------------------------------------
// R21 — Barrel export
// ---------------------------------------------------------------------------

describe('R21 — barrel export', () => {
	it('Cluster is resolvable from $lib', async () => {
		const { Cluster: C } = await import('$lib');
		expect(C).toBeDefined();
	});
});
