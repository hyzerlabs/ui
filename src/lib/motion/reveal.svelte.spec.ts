import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Motion-R4 — behavior needs a real DOM (WAAPI `Element.animate`, inline
 * style writes) so this runs in the browser ('client') Vitest project.
 *
 * `IntersectionObserver` is replaced with a small, fully-controllable fake
 * (real IO would require actually scrolling a real layout into view, which
 * is slow and flaky to depend on for deterministic assertions) — the same
 * "substitute the platform dependency at the global, trigger it by hand"
 * approach the reduced-motion mock below uses for `svelte/motion`.
 */
const motionState = { current: false };
vi.mock('svelte/motion', () => ({
	prefersReducedMotion: motionState
}));

const { reveal, revealGroup } = await import('$lib/motion');

type IOCallback = (entries: Pick<IntersectionObserverEntry, 'isIntersecting' | 'target'>[]) => void;

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

const OriginalIO = globalThis.IntersectionObserver;

beforeEach(() => {
	FakeIntersectionObserver.instances = [];
	// @ts-expect-error — test substitute, not a full IntersectionObserver.
	globalThis.IntersectionObserver = FakeIntersectionObserver;
});

afterEach(() => {
	globalThis.IntersectionObserver = OriginalIO;
	motionState.current = false;
	document.querySelectorAll('[data-reveal-spec]').forEach((el) => el.remove());
});

function makeEl(): HTMLDivElement {
	const el = document.createElement('div');
	el.setAttribute('data-reveal-spec', '');
	document.body.appendChild(el);
	return el;
}

function makeGroup(count: number): { container: HTMLDivElement; children: HTMLDivElement[] } {
	const container = makeEl();
	const children: HTMLDivElement[] = [];
	for (let i = 0; i < count; i++) {
		const child = document.createElement('div');
		container.appendChild(child);
		children.push(child);
	}
	return { container, children };
}

function lastIO(): FakeIntersectionObserver {
	const io = FakeIntersectionObserver.instances.at(-1);
	if (!io) throw new Error('no IntersectionObserver was created');
	return io;
}

describe('reveal — hidden-state application (R4)', () => {
	it('applies opacity: 0 and a translate offset via inline style at attach time', () => {
		const el = makeEl();
		reveal({ y: 24 })(el);
		expect(el.style.opacity).toBe('0');
		expect(el.style.transform).toBe('translate(0px, 24px)');
	});

	it('defaults y to 16px and x to 0px', () => {
		const el = makeEl();
		reveal()(el);
		expect(el.style.transform).toBe('translate(0px, 16px)');
	});

	it('honors an explicit x offset alongside y', () => {
		const el = makeEl();
		reveal({ x: -32, y: 0 })(el);
		expect(el.style.transform).toBe('translate(-32px, 0px)');
	});
});

describe('reveal — IO trigger plays the entrance (R4)', () => {
	it('plays a WAAPI entrance and clears the inline hidden style once it finishes', async () => {
		const el = makeEl();
		reveal({ duration: 20 })(el);
		const io = lastIO();

		io.trigger(el, true);
		const animation = el.getAnimations()[0];
		expect(animation).toBeDefined();

		await animation.finished;
		// A microtask turn for the .then() cleanup (clear + cancel) to run.
		await Promise.resolve();
		await Promise.resolve();

		expect(el.style.opacity).toBe('');
		expect(el.style.transform).toBe('');
	});

	it('does not play before the element intersects', () => {
		const el = makeEl();
		reveal({ duration: 20 })(el);
		expect(el.getAnimations()).toHaveLength(0);
	});
});

describe('reveal — once semantics (R4)', () => {
	it('once (default true) disconnects the observer after the first entrance', () => {
		const el = makeEl();
		reveal({ duration: 20 })(el);
		const io = lastIO();

		io.trigger(el, true);
		expect(io.disconnected).toBe(true);
	});

	it('once: false does not disconnect, and replays on re-entry', async () => {
		const el = makeEl();
		reveal({ duration: 20, once: false })(el);
		const io = lastIO();

		io.trigger(el, true);
		expect(io.disconnected).toBe(false);
		const first = el.getAnimations()[0];
		await first.finished;
		await Promise.resolve();
		await Promise.resolve();
		expect(el.style.opacity).toBe('');

		// Leaving the viewport re-hides so the next entry can replay.
		io.trigger(el, false);
		expect(el.style.opacity).toBe('0');

		io.trigger(el, true);
		const second = el.getAnimations().at(-1);
		expect(second).toBeDefined();
		expect(second).not.toBe(first);
	});
});

describe('reveal — reduced motion (R4)', () => {
	it('shows immediately: no hidden state is ever applied, no observer is created', () => {
		motionState.current = true;
		const before = FakeIntersectionObserver.instances.length;
		const el = makeEl();
		reveal()(el);
		expect(el.style.opacity).toBe('');
		expect(el.style.transform).toBe('');
		expect(FakeIntersectionObserver.instances.length).toBe(before);
	});

	it('essential: true plays the full animation even under reduced motion', () => {
		motionState.current = true;
		const el = makeEl();
		reveal({ essential: true, y: 10 })(el);
		expect(el.style.opacity).toBe('0');
		expect(el.style.transform).toBe('translate(0px, 10px)');
		expect(FakeIntersectionObserver.instances.length).toBeGreaterThan(0);
	});
});

describe('reveal — observer cleanup (R4)', () => {
	it('an element removed before intersecting disconnects its observer with no leak', () => {
		const el = makeEl();
		const cleanup = reveal({ duration: 20 })(el);
		const io = lastIO();

		expect(io.disconnected).toBe(false);
		cleanup();
		expect(io.disconnected).toBe(true);
	});
});

describe('revealGroup — stagger order (R4)', () => {
	it('delays each child by its DOM-order index times the stagger option', () => {
		const { container, children } = makeGroup(3);
		revealGroup({ duration: 20, stagger: 50 })(container);
		const io = lastIO();

		io.trigger(container, true);

		const delays = children.map((child) => {
			const animation = child.getAnimations()[0];
			expect(animation).toBeDefined();
			return animation.effect?.getComputedTiming().delay;
		});
		expect(delays).toEqual([0, 50, 100]);
	});

	it('one shared IntersectionObserver observes the container, not one per child', () => {
		const before = FakeIntersectionObserver.instances.length;
		const { container } = makeGroup(4);
		revealGroup({ duration: 20 })(container);
		expect(FakeIntersectionObserver.instances.length).toBe(before + 1);
	});

	it('once (default true) disconnects after the group entrance plays', () => {
		const { container } = makeGroup(2);
		revealGroup({ duration: 20 })(container);
		const io = lastIO();
		io.trigger(container, true);
		expect(io.disconnected).toBe(true);
	});
});
