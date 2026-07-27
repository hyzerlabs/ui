import { afterEach, describe, expect, it } from 'vitest';
import { announce } from '$lib/observers';

/**
 * Observers-R6 — real DOM (live-region append, `requestAnimationFrame`
 * timing) so this runs in the browser ('client') Vitest project.
 */

function regions(): HTMLElement[] {
	return Array.from(document.querySelectorAll<HTMLElement>('[data-hz-live-region]'));
}

function politeRegion(): HTMLElement | undefined {
	return regions().find((el) => el.getAttribute('aria-live') === 'polite');
}

function assertiveRegion(): HTMLElement | undefined {
	return regions().find((el) => el.getAttribute('aria-live') === 'assertive');
}

/** Waits one real animation frame — announce() schedules its write there. */
function nextFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

afterEach(() => {
	// Self-healing getter recreates on the next test's first announce() call —
	// this is the reset/isolation mechanism (no public teardown API exists).
	regions().forEach((el) => el.remove());
});

describe('announce — region creation (R6)', () => {
	it('first call lazily appends exactly two [data-hz-live-region] .sr-only nodes with correct aria-live + aria-atomic', async () => {
		expect(regions()).toHaveLength(0);

		announce('hello');
		await nextFrame();

		expect(regions()).toHaveLength(2);
		const polite = politeRegion();
		const assertive = assertiveRegion();
		expect(polite).toBeDefined();
		expect(assertive).toBeDefined();
		expect(polite?.classList.contains('sr-only')).toBe(true);
		expect(assertive?.classList.contains('sr-only')).toBe(true);
		expect(polite?.getAttribute('aria-atomic')).toBe('true');
		expect(assertive?.getAttribute('aria-atomic')).toBe('true');
		expect(polite?.isConnected).toBe(true);
		expect(assertive?.isConnected).toBe(true);
	});

	it('both regions are reused across subsequent calls (module-scoped singletons)', async () => {
		announce('one');
		await nextFrame();
		const polite1 = politeRegion();

		announce('two');
		await nextFrame();
		const polite2 = politeRegion();

		expect(polite2).toBe(polite1);
		expect(regions()).toHaveLength(2);
	});
});

describe('announce — politeness (R6)', () => {
	it('lands in the polite region by default', async () => {
		announce('Loaded 20 more results');
		await nextFrame();
		expect(politeRegion()?.textContent).toBe('Loaded 20 more results');
		expect(assertiveRegion()?.textContent ?? '').toBe('');
	});

	it('lands in the assertive region under { assertive: true }', async () => {
		announce('Form could not be submitted', { assertive: true });
		await nextFrame();
		expect(assertiveRegion()?.textContent).toBe('Form could not be submitted');
		expect(politeRegion()?.textContent ?? '').toBe('');
	});
});

describe('announce — re-announce + spam guard (R6)', () => {
	it('repeated identical message across frames is re-announced via the clear-then-set toggle', async () => {
		announce('Saved');
		await nextFrame();
		expect(politeRegion()?.textContent).toBe('Saved');

		announce('Saved');
		// Cleared synchronously, before the next frame's write lands.
		expect(politeRegion()?.textContent).toBe('');

		await nextFrame();
		expect(politeRegion()?.textContent).toBe('Saved');
	});

	it('same-frame spam collapses to the last message (only the final write is scheduled)', async () => {
		announce('a');
		announce('b');
		announce('c');
		await nextFrame();
		expect(politeRegion()?.textContent).toBe('c');
	});
});

describe('announce — self-heal (R6)', () => {
	it('recreates the regions after they are removed from the DOM', async () => {
		announce('first');
		await nextFrame();
		expect(regions()).toHaveLength(2);

		regions().forEach((el) => el.remove());
		expect(regions()).toHaveLength(0);

		announce('second');
		await nextFrame();
		expect(regions()).toHaveLength(2);
		expect(politeRegion()?.textContent).toBe('second');
	});
});
