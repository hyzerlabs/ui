import { describe, expect, it } from 'vitest';

/**
 * Motion-R1 — every helper is SSR-safe: importable server-side, with no
 * `window`/`document` access at module scope. This file runs in the
 * 'server' Vitest project (environment: 'node', no DOM globals) — the
 * import below either throws for real here, or it doesn't.
 */
describe('SSR import (R1)', () => {
	it('importing the whole module does not throw with no DOM globals present', async () => {
		expect(typeof document).toBe('undefined');
		expect(typeof window).toBe('undefined');

		await expect(import('./index.js')).resolves.toBeDefined();
	});

	it('every documented export is present', async () => {
		const mod = await import('./index.js');

		expect(mod.durations).toEqual({ fast: 250, base: 400, slow: 550 });
		expect(mod.easingCss).toBeDefined();
		expect(typeof mod.easeStandard).toBe('function');
		expect(typeof mod.easeIn).toBe('function');
		expect(typeof mod.easeOut).toBe('function');
		expect(typeof mod.cubicBezier).toBe('function');
		expect(typeof mod.parseCubicBezier).toBe('function');

		expect(typeof mod.fade).toBe('function');
		expect(typeof mod.fly).toBe('function');
		expect(typeof mod.slide).toBe('function');
		expect(typeof mod.scale).toBe('function');

		expect(typeof mod.reveal).toBe('function');
		expect(typeof mod.revealGroup).toBe('function');

		expect(typeof mod.viewTransition).toBe('function');
	});
});
