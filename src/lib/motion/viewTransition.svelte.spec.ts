import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Motion-R5 — the supported/unsupported and reduced-motion branches need a
 * real `document`, so this runs in the browser ('client') Vitest project.
 * Chromium (this repo's Playwright provider) supports
 * `document.startViewTransition` natively, so the "supported" path below
 * exercises the real API — the "unsupported" path stubs it away for the
 * duration of one test to simulate an older/non-Chromium browser.
 */
const motionState = { current: false };
vi.mock('svelte/motion', () => ({
	prefersReducedMotion: motionState
}));

const { viewTransition } = await import('$lib/motion');

afterEach(() => {
	motionState.current = false;
});

describe('supported path (R5)', () => {
	it('calls document.startViewTransition and resolves finished once it completes', async () => {
		expect(typeof document.startViewTransition).toBe('function');
		const spy = vi.spyOn(document, 'startViewTransition');

		let called = false;
		const result = viewTransition(() => {
			called = true;
		});

		expect(spy).toHaveBeenCalledTimes(1);
		await result.finished;
		expect(called).toBe(true);

		spy.mockRestore();
	});

	it('the return shape includes a real skipTransition', async () => {
		const result = viewTransition(() => {});
		expect(typeof result.skipTransition).toBe('function');
		expect(() => result.skipTransition()).not.toThrow();
		await result.finished;
	});
});

describe('unsupported path (R5)', () => {
	it('runs update() directly and resolves when document.startViewTransition is absent', async () => {
		const original = document.startViewTransition;
		// @ts-expect-error — simulating an older/non-Chromium browser.
		document.startViewTransition = undefined;

		let called = false;
		const result = viewTransition(() => {
			called = true;
		});
		await result.finished;
		expect(called).toBe(true);

		document.startViewTransition = original;
	});
});

describe('reduced motion (R5)', () => {
	it('runs update() directly instead of starting a real view transition', async () => {
		motionState.current = true;
		const spy = vi.spyOn(document, 'startViewTransition');

		let called = false;
		const result = viewTransition(() => {
			called = true;
		});
		await result.finished;

		expect(called).toBe(true);
		expect(spy).not.toHaveBeenCalled();

		spy.mockRestore();
	});

	it('essential: true starts a real view transition even under reduced motion', async () => {
		motionState.current = true;
		const spy = vi.spyOn(document, 'startViewTransition');

		const result = viewTransition(() => {}, { essential: true });
		expect(spy).toHaveBeenCalledTimes(1);
		await result.finished;

		spy.mockRestore();
	});
});

describe('overlapping calls never throw (R5)', () => {
	it('a second call while the first is in flight does not throw, and both resolve', async () => {
		let error: unknown;
		let first: ReturnType<typeof viewTransition> | undefined;
		let second: ReturnType<typeof viewTransition> | undefined;
		try {
			first = viewTransition(() => {});
			second = viewTransition(() => {});
		} catch (e) {
			error = e;
		}
		expect(error).toBeUndefined();
		await expect(first?.finished).resolves.toBeUndefined();
		await expect(second?.finished).resolves.toBeUndefined();
	});
});
