import { describe, expect, it } from 'vitest';
import { reveal, revealGroup } from './reveal.js';

/**
 * Motion-R4 — SSR / pre-hydration. This file runs in the 'server' Vitest
 * project (environment: 'node', no DOM globals) — `document` is genuinely
 * undefined here, exercising the real guard rather than a mock (mirrors
 * lightboxGroup.spec.ts).
 */
describe('SSR / pre-hydration (R4 — no throw; inert)', () => {
	it('reveal(): invoking the returned attachment without `document` performs no work and returns a no-op cleanup', () => {
		expect(typeof document).toBe('undefined');

		const attach = reveal({ y: 24 });
		expect(typeof attach).toBe('function');

		const cleanup = attach({} as Element);
		expect(typeof cleanup).toBe('function');
		expect(() => cleanup()).not.toThrow();
	});

	it('revealGroup(): invoking the returned attachment without `document` performs no work and returns a no-op cleanup', () => {
		const attach = revealGroup({ stagger: 60 });
		const cleanup = attach({} as Element);
		expect(() => cleanup()).not.toThrow();
	});
});
