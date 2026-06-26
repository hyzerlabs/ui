import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Stack from './Stack.svelte';

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
// R5 — Default render
// ---------------------------------------------------------------------------

describe('R5 — default render', () => {
	it('renders a <div> by default', () => {
		const { container } = render(Stack);
		const el = container.querySelector('.hz-stack') as HTMLElement;
		expect(el).not.toBeNull();
		expect(el.tagName).toBe('DIV');
	});

	it('has hz-stack as its only consumer class by default', () => {
		const { container } = render(Stack);
		const el = container.querySelector('.hz-stack') as HTMLElement;
		expect(consumerClasses(el)).toEqual(['hz-stack']);
	});

	it('has data-gap="md" by default', () => {
		const { container } = render(Stack);
		const el = container.querySelector('.hz-stack') as HTMLElement;
		expect(el.getAttribute('data-gap')).toBe('md');
	});

	it('has data-align="stretch" by default', () => {
		const { container } = render(Stack);
		const el = container.querySelector('.hz-stack') as HTMLElement;
		expect(el.getAttribute('data-align')).toBe('stretch');
	});

	it('has computed display: flex', () => {
		const { container } = render(Stack);
		const el = container.querySelector('.hz-stack') as HTMLElement;
		expect(getComputedStyle(el).display).toBe('flex');
	});

	it('has computed flex-direction: column', () => {
		const { container } = render(Stack);
		const el = container.querySelector('.hz-stack') as HTMLElement;
		expect(getComputedStyle(el).flexDirection).toBe('column');
	});

	it('has computed row-gap matching the md fallback (1rem = 16px)', () => {
		const { container } = render(Stack);
		const el = container.querySelector('.hz-stack') as HTMLElement;
		expect(getComputedStyle(el).rowGap).toBe('16px');
	});

	it('has computed align-items: stretch', () => {
		const { container } = render(Stack);
		const el = container.querySelector('.hz-stack') as HTMLElement;
		expect(getComputedStyle(el).alignItems).toBe('stretch');
	});

	it('renders children', () => {
		const { container } = render(Stack, { children: childrenSnippet });
		expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
	});

	it('renders an empty stack with no children and no error', () => {
		const { container } = render(Stack);
		const el = container.querySelector('.hz-stack') as HTMLElement;
		expect(el).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R6 — gap prop
// ---------------------------------------------------------------------------

describe('R6 — gap prop', () => {
	const gapEntries: Array<{ gap: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'; expectedPx: string }> =
		[
			{ gap: 'none', expectedPx: '0px' },
			{ gap: 'xs', expectedPx: '4px' }, // 0.25rem
			{ gap: 'sm', expectedPx: '8px' }, // 0.5rem
			{ gap: 'md', expectedPx: '16px' }, // 1rem
			{ gap: 'lg', expectedPx: '24px' }, // 1.5rem
			{ gap: 'xl', expectedPx: '32px' } // 2rem
		];

	for (const { gap, expectedPx } of gapEntries) {
		it(`gap="${gap}" is reflected in data-gap`, () => {
			const { container } = render(Stack, { gap });
			const el = container.querySelector('.hz-stack') as HTMLElement;
			expect(el.getAttribute('data-gap')).toBe(gap);
		});

		it(`gap="${gap}" drives computed row-gap: ${expectedPx}`, () => {
			const { container } = render(Stack, { gap });
			const el = container.querySelector('.hz-stack') as HTMLElement;
			expect(getComputedStyle(el).rowGap).toBe(expectedPx);
		});
	}
});

// ---------------------------------------------------------------------------
// R6 — align prop
// ---------------------------------------------------------------------------

describe('R6 — align prop', () => {
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
			const { container } = render(Stack, { align });
			const el = container.querySelector('.hz-stack') as HTMLElement;
			expect(el.getAttribute('data-align')).toBe(align);
		});

		it(`align="${align}" drives computed align-items: ${expectedAlignItems}`, () => {
			const { container } = render(Stack, { align });
			const el = container.querySelector('.hz-stack') as HTMLElement;
			expect(getComputedStyle(el).alignItems).toBe(expectedAlignItems);
		});
	}
});

// ---------------------------------------------------------------------------
// R18 — as prop renders the correct element
// ---------------------------------------------------------------------------

describe('R18 — as prop', () => {
	it('as="section" → root tag is SECTION', () => {
		const { container } = render(Stack, { as: 'section' });
		const el = container.querySelector('.hz-stack') as HTMLElement;
		expect(el.tagName).toBe('SECTION');
	});

	it('as="section" preserves data-gap and data-align', () => {
		const { container } = render(Stack, { as: 'section', gap: 'lg', align: 'center' });
		const el = container.querySelector('.hz-stack') as HTMLElement;
		expect(el.tagName).toBe('SECTION');
		expect(el.getAttribute('data-gap')).toBe('lg');
		expect(el.getAttribute('data-align')).toBe('center');
	});

	it('default as → renders a <div>', () => {
		const { container } = render(Stack);
		const el = container.querySelector('.hz-stack') as HTMLElement;
		expect(el.tagName).toBe('DIV');
	});
});

// ---------------------------------------------------------------------------
// R19 — class composition
// ---------------------------------------------------------------------------

describe('R19 — class composition', () => {
	it('no class prop → consumer class is exactly "hz-stack"', () => {
		const { container } = render(Stack);
		const el = container.querySelector('.hz-stack') as HTMLElement;
		expect(consumerClasses(el)).toEqual(['hz-stack']);
	});

	it('class="foo bar" → hz-stack is first, foo and bar are also present', () => {
		const { container } = render(Stack, { class: 'foo bar' });
		const el = container.querySelector('.hz-stack') as HTMLElement;
		const cls = consumerClasses(el);
		expect(cls[0]).toBe('hz-stack');
		expect(cls).toContain('foo');
		expect(cls).toContain('bar');
	});
});

// ---------------------------------------------------------------------------
// R20 — rest forwarding
// ---------------------------------------------------------------------------

describe('R20 — rest forwarding', () => {
	it('forwards extra attributes (e.g. data-testid) to the root element', () => {
		const { container } = render(Stack, { 'data-testid': 'my-stack' } as Record<string, unknown>);
		const el = container.querySelector('.hz-stack') as HTMLElement;
		expect(el.getAttribute('data-testid')).toBe('my-stack');
	});

	it('rest attribute cannot overwrite managed data-gap', () => {
		const { container } = render(Stack, { 'data-gap': 'override' } as Record<string, unknown>);
		const el = container.querySelector('.hz-stack') as HTMLElement;
		expect(el.getAttribute('data-gap')).toBe('md');
	});

	it('rest attribute cannot overwrite managed data-align', () => {
		const { container } = render(Stack, { 'data-align': 'override' } as Record<string, unknown>);
		const el = container.querySelector('.hz-stack') as HTMLElement;
		expect(el.getAttribute('data-align')).toBe('stretch');
	});
});

// ---------------------------------------------------------------------------
// R21 — Barrel export
// ---------------------------------------------------------------------------

describe('R21 — barrel export', () => {
	it('Stack is resolvable from $lib', async () => {
		const { Stack: S } = await import('$lib');
		expect(S).toBeDefined();
	});
});
