import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { intersect, resize, mutate } from '$lib/observers';

/**
 * Observers-R2/R3/R4/R5 — this file runs in the 'client' Vitest project, a
 * real Chromium via `@vitest/browser-playwright` — so `IntersectionObserver`/
 * `ResizeObserver`/`MutationObserver` genuinely exist here (this is not
 * jsdom). Each is still substituted with a small, fully-controllable Fake at
 * the global for deterministic assertions — real IO would need an actual
 * scroll, real RO an actual resize — exactly the "substitute the platform
 * dependency at the global, trigger it by hand" approach
 * `src/lib/motion/reveal.svelte.spec.ts` uses for `FakeIntersectionObserver`.
 */

type IOEntry = Pick<IntersectionObserverEntry, 'isIntersecting' | 'target'>;
type IOCallback = (entries: IOEntry[]) => void;

class FakeIntersectionObserver {
	static instances: FakeIntersectionObserver[] = [];
	callback: IOCallback;
	options: IntersectionObserverInit | undefined;
	observed = new Set<Element>();
	disconnected = false;

	constructor(callback: IOCallback, options?: IntersectionObserverInit) {
		this.callback = callback;
		this.options = options;
		FakeIntersectionObserver.instances.push(this);
	}

	observe(el: Element) {
		this.observed.add(el);
	}

	unobserve(el: Element) {
		this.observed.delete(el);
	}

	disconnect() {
		this.disconnected = true;
		this.observed.clear();
	}

	takeRecords() {
		return [];
	}

	/** Test helper — fires the observer's callback for one target. */
	trigger(el: Element, isIntersecting: boolean) {
		this.callback([{ isIntersecting, target: el }]);
	}
}

type ROEntry = Pick<ResizeObserverEntry, 'target'>;
type ROCallback = (entries: ROEntry[]) => void;

class FakeResizeObserver {
	static instances: FakeResizeObserver[] = [];
	callback: ROCallback;
	observed = new Map<Element, ResizeObserverOptions | undefined>();
	disconnected = false;

	constructor(callback: ROCallback) {
		this.callback = callback;
		FakeResizeObserver.instances.push(this);
	}

	observe(el: Element, options?: ResizeObserverOptions) {
		this.observed.set(el, options);
	}

	unobserve(el: Element) {
		this.observed.delete(el);
	}

	disconnect() {
		this.disconnected = true;
		this.observed.clear();
	}

	/** Test helper — fires the observer's callback for one target. */
	trigger(el: Element) {
		this.callback([{ target: el }]);
	}
}

type MOCallback = (records: MutationRecord[]) => void;

class FakeMutationObserver {
	static instances: FakeMutationObserver[] = [];
	callback: MOCallback;
	init: MutationObserverInit | undefined;
	observedTarget: Element | null = null;
	disconnected = false;

	constructor(callback: MOCallback) {
		this.callback = callback;
		FakeMutationObserver.instances.push(this);
	}

	observe(target: Element, init?: MutationObserverInit) {
		this.observedTarget = target;
		this.init = init;
	}

	disconnect() {
		this.disconnected = true;
	}

	takeRecords() {
		return [];
	}

	/** Test helper — delivers a raw batch of (fake) records. */
	trigger(records: Partial<MutationRecord>[] = [{}]) {
		this.callback(records as MutationRecord[]);
	}
}

const OriginalIO = globalThis.IntersectionObserver;
const OriginalRO = globalThis.ResizeObserver;
const OriginalMO = globalThis.MutationObserver;

beforeEach(() => {
	FakeIntersectionObserver.instances = [];
	FakeResizeObserver.instances = [];
	FakeMutationObserver.instances = [];
	// @ts-expect-error — test substitute, not a full IntersectionObserver.
	globalThis.IntersectionObserver = FakeIntersectionObserver;
	// @ts-expect-error — test substitute, not a full ResizeObserver.
	globalThis.ResizeObserver = FakeResizeObserver;
	// @ts-expect-error — test substitute, not a full MutationObserver.
	globalThis.MutationObserver = FakeMutationObserver;
});

afterEach(() => {
	globalThis.IntersectionObserver = OriginalIO;
	globalThis.ResizeObserver = OriginalRO;
	globalThis.MutationObserver = OriginalMO;
	document.querySelectorAll('[data-observers-spec]').forEach((el) => el.remove());
	vi.useRealTimers();
});

function makeEl(): HTMLDivElement {
	const el = document.createElement('div');
	el.setAttribute('data-observers-spec', '');
	document.body.appendChild(el);
	return el;
}

function lastIO(): FakeIntersectionObserver {
	const io = FakeIntersectionObserver.instances.at(-1);
	if (!io) throw new Error('no IntersectionObserver was created');
	return io;
}

function lastRO(): FakeResizeObserver {
	const ro = FakeResizeObserver.instances.at(-1);
	if (!ro) throw new Error('no ResizeObserver was created');
	return ro;
}

function lastMO(): FakeMutationObserver {
	const mo = FakeMutationObserver.instances.at(-1);
	if (!mo) throw new Error('no MutationObserver was created');
	return mo;
}

describe('intersect (R2)', () => {
	it('creates one IntersectionObserver with the native options passed through', () => {
		const el = makeEl();
		intersect(() => {}, { rootMargin: '200px', threshold: [0, 0.5] })(el);
		const io = lastIO();
		expect(io.options?.rootMargin).toBe('200px');
		expect(io.options?.threshold).toEqual([0, 0.5]);
		expect(io.observed.has(el)).toBe(true);
	});

	it('invokes callback(entry, observer) on trigger', () => {
		const el = makeEl();
		const callback = vi.fn();
		intersect(callback)(el);
		const io = lastIO();

		io.trigger(el, false);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback.mock.calls[0][0]).toEqual({ isIntersecting: false, target: el });
		expect(callback.mock.calls[0][1]).toBe(io);
	});

	it('once: true does not disconnect on an initial non-intersecting delivery', () => {
		const el = makeEl();
		intersect(() => {}, { once: true })(el);
		const io = lastIO();

		io.trigger(el, false);
		expect(io.disconnected).toBe(false);
	});

	it('once: true disconnects after the first intersecting entry', () => {
		const el = makeEl();
		intersect(() => {}, { once: true })(el);
		const io = lastIO();

		io.trigger(el, false);
		io.trigger(el, true);
		expect(io.disconnected).toBe(true);
	});

	it('teardown calls disconnect()', () => {
		const el = makeEl();
		const cleanup = intersect(() => {})(el);
		const io = lastIO();

		expect(io.disconnected).toBe(false);
		cleanup();
		expect(io.disconnected).toBe(true);
	});

	it('absent IntersectionObserver global: no-op cleanup, no throw', () => {
		// @ts-expect-error — simulating a very old browser.
		globalThis.IntersectionObserver = undefined;
		const el = makeEl();
		const cleanup = intersect(() => {})(el);
		expect(FakeIntersectionObserver.instances).toHaveLength(0);
		expect(() => cleanup()).not.toThrow();
	});
});

describe('resize (R3)', () => {
	it('creates one ResizeObserver; observe() called without a second argument when box is not supplied', () => {
		const el = makeEl();
		resize(() => {})(el);
		const ro = lastRO();
		expect(ro.observed.get(el)).toBeUndefined();
		expect(ro.observed.has(el)).toBe(true);
	});

	it('observe() called with { box } when supplied', () => {
		const el = makeEl();
		resize(() => {}, { box: 'border-box' })(el);
		const ro = lastRO();
		expect(ro.observed.get(el)).toEqual({ box: 'border-box' });
	});

	it('invokes callback(entry, observer) on trigger', () => {
		const el = makeEl();
		const callback = vi.fn();
		resize(callback)(el);
		const ro = lastRO();

		ro.trigger(el);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback.mock.calls[0][0]).toEqual({ target: el });
		expect(callback.mock.calls[0][1]).toBe(ro);
	});

	it('once: true disconnects after the first delivery', () => {
		const el = makeEl();
		resize(() => {}, { once: true })(el);
		const ro = lastRO();

		ro.trigger(el);
		expect(ro.disconnected).toBe(true);
	});

	it('teardown disconnects', () => {
		const el = makeEl();
		const cleanup = resize(() => {})(el);
		const ro = lastRO();

		cleanup();
		expect(ro.disconnected).toBe(true);
	});

	it('absent ResizeObserver global: no-op cleanup, no throw', () => {
		// @ts-expect-error — simulating a very old browser.
		globalThis.ResizeObserver = undefined;
		const el = makeEl();
		const cleanup = resize(() => {})(el);
		expect(FakeResizeObserver.instances).toHaveLength(0);
		expect(() => cleanup()).not.toThrow();
	});
});

describe('mutate (R4)', () => {
	it('creates one MutationObserver; observe() called with the MutationObserverInit passthrough', () => {
		const el = makeEl();
		mutate(() => {}, { childList: true, subtree: true })(el);
		const mo = lastMO();
		expect(mo.observedTarget).toBe(el);
		expect(mo.init).toEqual({ childList: true, subtree: true });
	});

	it('callback(records, observer) receives the records array', () => {
		const el = makeEl();
		const callback = vi.fn();
		mutate(callback, { childList: true })(el);
		const mo = lastMO();

		const records: Partial<MutationRecord>[] = [{ type: 'childList' }, { type: 'childList' }];
		mo.trigger(records);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback.mock.calls[0][0]).toEqual(records);
		expect(callback.mock.calls[0][1]).toBe(mo);
	});

	it('fires synchronously per delivery when debounce is 0 (default)', () => {
		const el = makeEl();
		const callback = vi.fn();
		mutate(callback, { childList: true })(el);
		const mo = lastMO();

		mo.trigger([{ type: 'childList' }]);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('debounce: N coalesces a burst into a single callback carrying all accumulated records', () => {
		vi.useFakeTimers();
		const el = makeEl();
		const callback = vi.fn();
		mutate(callback, { childList: true, debounce: 120 })(el);
		const mo = lastMO();

		mo.trigger([{ type: 'childList', addedNodes: [1] as unknown as NodeList }]);
		vi.advanceTimersByTime(50);
		mo.trigger([{ type: 'childList', addedNodes: [2] as unknown as NodeList }]);
		vi.advanceTimersByTime(50);
		expect(callback).not.toHaveBeenCalled();

		vi.advanceTimersByTime(120);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback.mock.calls[0][0]).toHaveLength(2);
	});

	it('teardown clears a pending debounce timer and disconnects; the coalesced callback never fires after teardown', () => {
		vi.useFakeTimers();
		const el = makeEl();
		const callback = vi.fn();
		const cleanup = mutate(callback, { childList: true, debounce: 120 })(el);
		const mo = lastMO();

		mo.trigger([{ type: 'childList' }]);
		cleanup();
		expect(mo.disconnected).toBe(true);

		vi.advanceTimersByTime(200);
		expect(callback).not.toHaveBeenCalled();
	});

	it('once disconnects after the (coalesced) delivery', () => {
		vi.useFakeTimers();
		const el = makeEl();
		const callback = vi.fn();
		mutate(callback, { childList: true, debounce: 120, once: true })(el);
		const mo = lastMO();

		mo.trigger([{ type: 'childList' }]);
		vi.advanceTimersByTime(120);
		expect(callback).toHaveBeenCalledTimes(1);
		expect(mo.disconnected).toBe(true);
	});

	it('teardown disconnects (no debounce)', () => {
		const el = makeEl();
		const cleanup = mutate(() => {}, { childList: true })(el);
		const mo = lastMO();

		cleanup();
		expect(mo.disconnected).toBe(true);
	});

	it('absent MutationObserver global: no-op cleanup, no throw', () => {
		// @ts-expect-error — simulating a very old browser.
		globalThis.MutationObserver = undefined;
		const el = makeEl();
		const cleanup = mutate(() => {}, { childList: true })(el);
		expect(FakeMutationObserver.instances).toHaveLength(0);
		expect(() => cleanup()).not.toThrow();
	});
});

describe('multiple attachments on one node (R5, edge cases)', () => {
	it('intersect + resize on the same node are independent observers with independent teardown', () => {
		const el = makeEl();
		const cleanupIntersect = intersect(() => {})(el);
		const cleanupResize = resize(() => {})(el);
		const io = lastIO();
		const ro = lastRO();

		cleanupIntersect();
		expect(io.disconnected).toBe(true);
		expect(ro.disconnected).toBe(false);

		cleanupResize();
		expect(ro.disconnected).toBe(true);
	});
});

describe('options-change re-run (edge cases)', () => {
	it('a fresh options object yields a new observer and disconnects the previous', () => {
		const el = makeEl();
		const cleanup1 = intersect(() => {}, { rootMargin: '0px' })(el);
		const io1 = lastIO();

		const cleanup2 = intersect(() => {}, { rootMargin: '100px' })(el);
		const io2 = lastIO();
		expect(io2).not.toBe(io1);

		cleanup1();
		expect(io1.disconnected).toBe(true);
		expect(io2.disconnected).toBe(false);
		cleanup2();
	});
});
