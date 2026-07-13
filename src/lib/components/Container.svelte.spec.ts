import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Container from './Container.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const childrenSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="child">content</span>`
}));

/**
 * Return the consumer-visible classes (strip Svelte's internal scope hash).
 * Svelte appends a `svelte-XXXX` class to elements in scoped style components;
 * this is an implementation detail, not part of the public class contract.
 */
function consumerClasses(el: HTMLElement): string[] {
	return [...el.classList].filter((c) => !c.startsWith('svelte-'));
}

// ---------------------------------------------------------------------------
// R1 — Default render
// ---------------------------------------------------------------------------

describe('R1 — default render', () => {
	it('renders a <div> by default', () => {
		const { container } = render(Container);
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(el).not.toBeNull();
		expect(el.tagName).toBe('DIV');
	});

	it('has hz-container as its only consumer class by default', () => {
		const { container } = render(Container);
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(consumerClasses(el)).toEqual(['hz-container']);
	});

	it('has data-max="lg" by default', () => {
		const { container } = render(Container);
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(el.getAttribute('data-max')).toBe('lg');
	});

	it('has data-padding="md" by default', () => {
		const { container } = render(Container);
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(el.getAttribute('data-padding')).toBe('md');
	});

	it('has data-center present by default', () => {
		const { container } = render(Container);
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(el.hasAttribute('data-center')).toBe(true);
	});

	it('has computed display: block', () => {
		const { container } = render(Container);
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(getComputedStyle(el).display).toBe('block');
	});

	it('has computed max-width matching the lg fallback (1200px)', () => {
		const { container } = render(Container);
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(getComputedStyle(el).maxWidth).toBe('1200px');
	});

	it('renders children inside the container', () => {
		const { container } = render(Container, { children: childrenSnippet });
		expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
	});

	it('renders an empty container with no children and no error', () => {
		const { container } = render(Container);
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(el).not.toBeNull();
		expect(el.children).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// R2 — max prop
// ---------------------------------------------------------------------------

describe('R2 — max prop', () => {
	const maxValues: Array<'sm' | 'md' | 'lg' | 'xl' | 'full'> = ['sm', 'md', 'lg', 'xl', 'full'];

	for (const max of maxValues) {
		it(`max="${max}" is reflected in data-max`, () => {
			const { container } = render(Container, { max });
			const el = container.querySelector('.hz-container') as HTMLElement;
			expect(el.getAttribute('data-max')).toBe(max);
		});
	}

	it('max="sm" drives max-width: 640px', () => {
		const { container } = render(Container, { max: 'sm' });
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(getComputedStyle(el).maxWidth).toBe('640px');
	});

	it('max="md" drives max-width: 968px', () => {
		const { container } = render(Container, { max: 'md' });
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(getComputedStyle(el).maxWidth).toBe('968px');
	});

	it('max="lg" drives max-width: 1200px', () => {
		const { container } = render(Container, { max: 'lg' });
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(getComputedStyle(el).maxWidth).toBe('1200px');
	});

	it('max="xl" drives max-width: 1440px', () => {
		const { container } = render(Container, { max: 'xl' });
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(getComputedStyle(el).maxWidth).toBe('1440px');
	});

	it('max="full" → data-max="full" and max-width is not "none" (resolves to 100% of container)', () => {
		const { container } = render(Container, { max: 'full' });
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(el.getAttribute('data-max')).toBe('full');
		// max-width:100% resolves to a pixel value of the containing block; it is never "none".
		expect(getComputedStyle(el).maxWidth).not.toBe('none');
	});
});

// ---------------------------------------------------------------------------
// R3 — padding prop
// ---------------------------------------------------------------------------

describe('R3 — padding prop', () => {
	const paddingEntries: Array<{
		padding: 'none' | 'sm' | 'md' | 'lg' | 'near' | 'away';
		expectedLeft: string;
	}> = [
		{ padding: 'none', expectedLeft: '0px' },
		{ padding: 'sm', expectedLeft: '16px' }, // 1rem = 16px at default 16px root font-size
		{ padding: 'md', expectedLeft: '32px' }, // 2rem
		{ padding: 'lg', expectedLeft: '64px' }, // 4rem
		{ padding: 'near', expectedLeft: '64px' }, // density fallback 4rem
		{ padding: 'away', expectedLeft: '128px' } // density fallback 8rem
	];

	for (const { padding, expectedLeft } of paddingEntries) {
		it(`padding="${padding}" is reflected in data-padding`, () => {
			const { container } = render(Container, { padding });
			const el = container.querySelector('.hz-container') as HTMLElement;
			expect(el.getAttribute('data-padding')).toBe(padding);
		});

		it(`padding="${padding}" drives padding on both axes: ${expectedLeft}`, () => {
			const { container } = render(Container, { padding });
			const el = container.querySelector('.hz-container') as HTMLElement;
			expect(getComputedStyle(el).paddingLeft).toBe(expectedLeft);
			expect(getComputedStyle(el).paddingTop).toBe(expectedLeft);
		});
	}

	it('padding="none" → 0 on all sides', () => {
		const { container } = render(Container, { padding: 'none' });
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(getComputedStyle(el).padding).toBe('0px');
	});
});

// ---------------------------------------------------------------------------
// breakout prop
// ---------------------------------------------------------------------------

describe('breakout prop', () => {
	it('is off by default — no data-breakout attribute', () => {
		const { container } = render(Container);
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(el.hasAttribute('data-breakout')).toBe(false);
	});

	it('breakout sets data-breakout and overrides the max cap', () => {
		const { container } = render(Container, { breakout: true, max: 'sm' });
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(el.hasAttribute('data-breakout')).toBe(true);
		expect(getComputedStyle(el).maxWidth).toBe('none');
	});
});

// ---------------------------------------------------------------------------
// R4 — center prop
// ---------------------------------------------------------------------------

describe('R4 — center prop', () => {
	it('center=true (default) → data-center attribute present', () => {
		const { container } = render(Container);
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(el.hasAttribute('data-center')).toBe(true);
	});

	it('center=false → data-center attribute absent', () => {
		const { container } = render(Container, { center: false });
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(el.hasAttribute('data-center')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// R18 — as prop renders the correct element
// ---------------------------------------------------------------------------

describe('R18 — as prop', () => {
	it('as="section" → root tag is SECTION', () => {
		const { container } = render(Container, { as: 'section' });
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(el.tagName).toBe('SECTION');
	});

	it('as="section" preserves class and data-* attributes', () => {
		const { container } = render(Container, { as: 'section', max: 'sm', padding: 'lg' });
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(el.tagName).toBe('SECTION');
		expect(el.getAttribute('data-max')).toBe('sm');
		expect(el.getAttribute('data-padding')).toBe('lg');
	});

	it('default as → renders a <div>', () => {
		const { container } = render(Container);
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(el.tagName).toBe('DIV');
	});
});

// ---------------------------------------------------------------------------
// R19 — class composition
// ---------------------------------------------------------------------------

describe('R19 — class composition', () => {
	it('no class prop → consumer class is exactly "hz-container"', () => {
		const { container } = render(Container);
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(consumerClasses(el)).toEqual(['hz-container']);
	});

	it('class="foo bar" → hz-container is first, foo and bar are also present', () => {
		const { container } = render(Container, { class: 'foo bar' });
		const el = container.querySelector('.hz-container') as HTMLElement;
		const cls = consumerClasses(el);
		expect(cls[0]).toBe('hz-container');
		expect(cls).toContain('foo');
		expect(cls).toContain('bar');
	});
});

// ---------------------------------------------------------------------------
// R20 — rest forwarding
// ---------------------------------------------------------------------------

describe('R20 — rest forwarding', () => {
	it('forwards extra attributes (e.g. data-testid) to the root element', () => {
		const { container } = render(Container, {
			'data-testid': 'my-container'
		} as Record<string, unknown>);
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(el.getAttribute('data-testid')).toBe('my-container');
	});

	it('rest attribute cannot overwrite managed data-max', () => {
		const { container } = render(Container, {
			'data-max': 'override'
		} as Record<string, unknown>);
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(el.getAttribute('data-max')).toBe('lg');
	});

	it('rest attribute cannot overwrite managed data-padding', () => {
		const { container } = render(Container, {
			'data-padding': 'override'
		} as Record<string, unknown>);
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(el.getAttribute('data-padding')).toBe('md');
	});

	it('hz-container class is always in the class list even when class prop is set', () => {
		const { container } = render(Container, { class: 'custom' });
		const el = container.querySelector('.hz-container') as HTMLElement;
		expect(el.classList.contains('hz-container')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// R21 — Barrel export
// ---------------------------------------------------------------------------

describe('R21 — barrel export', () => {
	it('Container is resolvable from $lib', async () => {
		const { Container: C } = await import('$lib');
		expect(C).toBeDefined();
	});
});
