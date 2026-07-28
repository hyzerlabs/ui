import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Skeleton from './Skeleton.svelte';
// Skeleton-R14 recipe pin — loaded so the computed rounded/background reflect
// the actual reference theme.
import '../tokens/tokens.css';
import '../theme/components/skeleton.css';

function getSkeleton(container: HTMLElement): HTMLElement {
	return container.querySelector('.hz-skeleton') as HTMLElement;
}

function silenceWarn(): ReturnType<typeof vi.spyOn> {
	return vi.spyOn(console, 'warn').mockImplementation(() => {});
}

// ---------------------------------------------------------------------------
// Skeleton-R9/R10 — Structure, variants, dimensions
// ---------------------------------------------------------------------------

describe('Skeleton-R9/R10 — structure, variants, dimensions', () => {
	it('defaults: text / shimmer / sm, aria-hidden, no children', () => {
		const { container } = render(Skeleton, {});
		const root = getSkeleton(container);
		expect(root.getAttribute('data-variant')).toBe('text');
		expect(root.getAttribute('data-animation')).toBe('shimmer');
		expect(root.getAttribute('data-rounded')).toBe('sm');
		expect(root.getAttribute('aria-hidden')).toBe('true');
		expect(root.querySelector('.hz-skeleton-line')).toBeNull();
		expect(root.style.width).toBe('100%');
		expect(root.style.height).toBe('1em');
	});

	it('circle: square 2.5rem default, rounded forced full', () => {
		const { container } = render(Skeleton, { variant: 'circle' });
		const root = getSkeleton(container);
		expect(root.getAttribute('data-rounded')).toBe('full');
		expect(root.style.width).toBe('2.5rem');
		expect(root.style.height).toBe('2.5rem');
	});

	it('circle with only width squares (height follows); rounded stays full even if overridden', () => {
		const { container } = render(Skeleton, { variant: 'circle', width: '3rem', rounded: 'none' });
		const root = getSkeleton(container);
		expect(root.style.width).toBe('3rem');
		expect(root.style.height).toBe('3rem');
		expect(root.getAttribute('data-rounded')).toBe('full');
	});

	it('circle with only height squares (width follows)', () => {
		const { container } = render(Skeleton, { variant: 'circle', height: 40 });
		const root = getSkeleton(container);
		expect(root.style.height).toBe('40px');
		expect(root.style.width).toBe('40px');
	});

	it('rect defaults: 100% x 1rem, rounded md', () => {
		const { container } = render(Skeleton, { variant: 'rect' });
		const root = getSkeleton(container);
		expect(root.style.width).toBe('100%');
		expect(root.style.height).toBe('1rem');
		expect(root.getAttribute('data-rounded')).toBe('md');
	});

	it('block defaults: 100% x 100%, rounded md', () => {
		const { container } = render(Skeleton, { variant: 'block' });
		const root = getSkeleton(container);
		expect(root.style.width).toBe('100%');
		expect(root.style.height).toBe('100%');
		expect(root.getAttribute('data-rounded')).toBe('md');
	});

	it('a number width/height is emitted as px; a string is used verbatim', () => {
		const { container } = render(Skeleton, { variant: 'rect', width: 200, height: '3rem' });
		const root = getSkeleton(container);
		expect(root.style.width).toBe('200px');
		expect(root.style.height).toBe('3rem');
	});

	it('rounded prop overrides the variant default (non-circle)', () => {
		const { container } = render(Skeleton, { variant: 'rect', rounded: 'lg' });
		expect(getSkeleton(container).getAttribute('data-rounded')).toBe('lg');
	});
});

// ---------------------------------------------------------------------------
// Skeleton-R11 — Multi-line text
// ---------------------------------------------------------------------------

describe('Skeleton-R11 — multi-line text', () => {
	it('lines=3 renders three .hz-skeleton-line bars; the last uses lastLineWidth', () => {
		const { container } = render(Skeleton, { variant: 'text', lines: 3 });
		const root = getSkeleton(container);
		const lines = root.querySelectorAll('.hz-skeleton-line');
		expect(lines).toHaveLength(3);
		expect((lines[0] as HTMLElement).style.width).toBe('100%');
		expect((lines[1] as HTMLElement).style.width).toBe('100%');
		expect((lines[2] as HTMLElement).style.width).toBe('60%');
	});

	it('a custom lastLineWidth applies to only the final line', () => {
		const { container } = render(Skeleton, { variant: 'text', lines: 2, lastLineWidth: '40%' });
		const lines = getSkeleton(container).querySelectorAll('.hz-skeleton-line');
		expect((lines[0] as HTMLElement).style.width).toBe('100%');
		expect((lines[1] as HTMLElement).style.width).toBe('40%');
	});

	it('lines is ignored for non-text variants (no .hz-skeleton-line rendered)', () => {
		const { container } = render(Skeleton, { variant: 'rect', lines: 3 });
		expect(getSkeleton(container).querySelector('.hz-skeleton-line')).toBeNull();
	});

	it('lines=0 clamps to 1 and dev-warns', () => {
		const warnSpy = silenceWarn();
		const { container } = render(Skeleton, { variant: 'text', lines: 0 });
		const root = getSkeleton(container);
		// A single "line" renders as the root painted block, not a .hz-skeleton-line child.
		expect(root.querySelector('.hz-skeleton-line')).toBeNull();
		expect(root.style.width).toBe('100%');
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockRestore();
	});

	it('negative lines clamps to 1 and dev-warns', () => {
		const warnSpy = silenceWarn();
		render(Skeleton, { variant: 'text', lines: -2 });
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// Skeleton-R12 — Animation
// ---------------------------------------------------------------------------

describe('Skeleton-R12 — animation', () => {
	it('data-animation reflects the prop', () => {
		const { container } = render(Skeleton, { animation: 'pulse' });
		expect(getSkeleton(container).getAttribute('data-animation')).toBe('pulse');
	});

	it('animation="none" sets data-animation to none', () => {
		const { container } = render(Skeleton, { animation: 'none' });
		expect(getSkeleton(container).getAttribute('data-animation')).toBe('none');
	});
});

// ---------------------------------------------------------------------------
// Skeleton-R13 — Decorative by default
// ---------------------------------------------------------------------------

describe('Skeleton-R13 — decorative by default', () => {
	it('aria-hidden="true" by default', () => {
		const { container } = render(Skeleton, {});
		expect(getSkeleton(container).getAttribute('aria-hidden')).toBe('true');
	});

	it('a rest aria-hidden={false} overrides the default', () => {
		const { container } = render(Skeleton, { 'aria-hidden': false } as Record<string, unknown>);
		expect(getSkeleton(container).getAttribute('aria-hidden')).not.toBe('true');
	});
});

// ---------------------------------------------------------------------------
// Skeleton-R15 — Barrel export
// ---------------------------------------------------------------------------

describe('Skeleton-R15 — barrel export', () => {
	it('Skeleton resolves from $lib and smoke-renders', async () => {
		const { Skeleton: S } = await import('$lib');
		expect(S).toBeDefined();
		const { container } = render(S, {});
		expect(container.querySelector('.hz-skeleton')).not.toBeNull();
	});
});
