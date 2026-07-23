import { describe, expect, it } from 'vitest';
import { viewTransition } from './viewTransition.js';

/**
 * Motion-R5 — SSR / no `document`. This file runs in the 'server' Vitest
 * project (environment: 'node', no DOM globals) — `document` is genuinely
 * undefined here.
 */
describe('SSR / no document (R5 — no throw; runs update() directly)', () => {
	it('runs the update synchronously-ish and resolves finished, with no document access', async () => {
		expect(typeof document).toBe('undefined');

		let called = false;
		const result = viewTransition(() => {
			called = true;
		});

		expect(typeof result.finished.then).toBe('function');
		await result.finished;
		expect(called).toBe(true);
	});

	it('an async update is awaited before finished resolves', async () => {
		const order: string[] = [];
		const result = viewTransition(async () => {
			order.push('start');
			await Promise.resolve();
			order.push('end');
		});
		await result.finished;
		expect(order).toEqual(['start', 'end']);
	});

	it('never throws — a throwing update still resolves the wrapper synchronously', () => {
		expect(() => viewTransition(() => {})).not.toThrow();
	});

	it('the return shape is stable: ready, updateCallbackDone, finished, skipTransition', async () => {
		const result = viewTransition(() => {});
		expect(typeof result.ready.then).toBe('function');
		expect(typeof result.updateCallbackDone.then).toBe('function');
		expect(typeof result.finished.then).toBe('function');
		expect(typeof result.skipTransition).toBe('function');
		expect(() => result.skipTransition()).not.toThrow();
		await result.finished;
	});
});
