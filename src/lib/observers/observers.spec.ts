import { describe, expect, it } from 'vitest';
import { intersect, resize, mutate, announce } from './index.js';

/**
 * Observers-R1/R12 — SSR / pre-hydration. This file runs in the 'server'
 * Vitest project (environment: 'node', no DOM globals) — `document` is
 * genuinely undefined here, exercising the real guard rather than a mock
 * (mirrors `src/lib/motion/reveal.spec.ts`).
 */
describe('SSR / pre-hydration (R1/R12 — no throw; inert)', () => {
	it('the module itself is importable with no DOM globals present', () => {
		expect(typeof document).toBe('undefined');
		expect(typeof window).toBe('undefined');
		expect(typeof intersect).toBe('function');
		expect(typeof resize).toBe('function');
		expect(typeof mutate).toBe('function');
		expect(typeof announce).toBe('function');
	});

	it('intersect(): invoking the returned attachment without `document` performs no work and returns a no-op cleanup', () => {
		const attach = intersect(() => {}, { rootMargin: '200px' });
		expect(typeof attach).toBe('function');

		const cleanup = attach({} as Element);
		expect(typeof cleanup).toBe('function');
		expect(() => cleanup()).not.toThrow();
	});

	it('resize(): invoking the returned attachment without `document` performs no work and returns a no-op cleanup', () => {
		const attach = resize(() => {}, { box: 'border-box' });
		const cleanup = attach({} as Element);
		expect(() => cleanup()).not.toThrow();
	});

	it('mutate(): invoking the returned attachment without `document` performs no work and returns a no-op cleanup', () => {
		const attach = mutate(() => {}, { childList: true, subtree: true, debounce: 120 });
		const cleanup = attach({} as Element);
		expect(() => cleanup()).not.toThrow();
	});

	it('announce(): no-ops without `document` and does not throw', () => {
		expect(() => announce('x')).not.toThrow();
		expect(() => announce('x', { assertive: true })).not.toThrow();
	});
});
