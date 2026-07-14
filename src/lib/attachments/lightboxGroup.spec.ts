import { describe, expect, it } from 'vitest';
import { lightboxGroup } from './lightboxGroup.js';

/**
 * Lightbox-R17 — client-only / SSR no-op. This file runs in the 'server'
 * Vitest project (environment: 'node', no DOM globals), so `document` is
 * genuinely undefined here — exercising the real guard rather than a mock.
 */
describe('SSR / pre-hydration (R17)', () => {
	it('invoking the returned attachment without `document` performs no work and returns a no-op cleanup', () => {
		expect(typeof document).toBe('undefined');

		const attach = lightboxGroup({ dialogLabel: 'Media viewer' });
		expect(typeof attach).toBe('function');

		// No Element exists in this environment — the guard must return before
		// touching the node at all, so passing an inert stand-in is safe.
		const cleanup = attach({} as Element);
		expect(typeof cleanup).toBe('function');

		// The cleanup itself must also be inert.
		expect(() => cleanup()).not.toThrow();
	});
});
