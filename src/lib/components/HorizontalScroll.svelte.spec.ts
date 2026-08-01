import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import HorizontalScroll from './HorizontalScroll.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Consumer-visible classes (strip Svelte's internal scope hash) — the Split.svelte.spec.ts precedent. */
function consumerClasses(el: HTMLElement): string[] {
	return [...el.classList].filter((c) => !c.startsWith('svelte-'));
}

const oneChild = createRawSnippet(() => ({
	render: () => `<div data-testid="panel">one</div>`
}));

/**
 * Append `n` plain panel divs directly to the root — the root IS the flex
 * row (R2), no inner track. No inline sizing on the panels themselves, so
 * `--hz-horizontal-scroll-panel-width` (set on the root by the caller) is
 * what drives their flex-basis, deterministically, in the browser project —
 * the Carousel.svelte.spec.ts rail-sizing precedent.
 */
function appendPanels(root: HTMLElement, n: number): HTMLElement[] {
	const panels: HTMLElement[] = [];
	for (let i = 0; i < n; i++) {
		const p = document.createElement('div');
		p.textContent = `panel ${i}`;
		root.appendChild(p);
		panels.push(p);
	}
	return panels;
}

/** A root wide enough to be measured deterministically, with `n` panels of `panelWidthPx` each — sized to reliably overflow (or not) `rootWidthPx`. */
function sizedRoot(
	container: HTMLElement,
	rootWidthPx: number,
	panelWidthPx: number,
	panelCount: number
): HTMLElement {
	const root = container.querySelector('.hz-horizontal-scroll') as HTMLElement;
	root.style.width = `${rootWidthPx}px`;
	root.style.setProperty('--hz-horizontal-scroll-panel-width', `${panelWidthPx}px`);
	appendPanels(root, panelCount);
	return root;
}

function wheelEvent(init: Partial<WheelEventInit> & Pick<WheelEventInit, 'deltaY'>): WheelEvent {
	return new WheelEvent('wheel', { cancelable: true, bubbles: true, deltaX: 0, ...init });
}

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

describe('HorizontalScroll — structure (R2)', () => {
	it('computed display: flex, overflow-x: auto, overflow-y: hidden, overscroll-behavior-x: contain, and overscroll-behavior-y is NOT contain', () => {
		const { container } = render(HorizontalScroll);
		const el = container.querySelector('.hz-horizontal-scroll') as HTMLElement;
		const cs = getComputedStyle(el);
		expect(cs.display).toBe('flex');
		expect(cs.overflowX).toBe('auto');
		expect(cs.overflowY).toBe('hidden');
		expect(cs.overscrollBehaviorX).toBe('contain');
		expect(cs.overscrollBehaviorY).not.toBe('contain');
	});

	it('as="section" renders a <section>', () => {
		const { container } = render(HorizontalScroll, { as: 'section' });
		expect((container.querySelector('.hz-horizontal-scroll') as HTMLElement).tagName).toBe(
			'SECTION'
		);
	});

	it('class merges after hz-horizontal-scroll', () => {
		const { container } = render(HorizontalScroll, { class: 'foo bar' });
		const el = container.querySelector('.hz-horizontal-scroll') as HTMLElement;
		expect(consumerClasses(el)).toEqual(['hz-horizontal-scroll', 'foo', 'bar']);
	});

	it('a rest attribute forwards, and a colliding managed attribute (class) loses — rest spreads first', () => {
		const { container } = render(HorizontalScroll, {
			'data-testid': 'shell',
			class: 'foo'
		} as Record<string, unknown>);
		const el = container.querySelector('.hz-horizontal-scroll') as HTMLElement;
		expect(el.getAttribute('data-testid')).toBe('shell');
		expect(el.getAttributeNames().filter((n) => n === 'class')).toHaveLength(1);
		expect(consumerClasses(el)).toEqual(['hz-horizontal-scroll', 'foo']);
	});

	it('tabindex="0" is present', () => {
		const { container } = render(HorizontalScroll);
		const el = container.querySelector('.hz-horizontal-scroll') as HTMLElement;
		expect(el.getAttribute('tabindex')).toBe('0');
	});
});

// ---------------------------------------------------------------------------
// Panel model
// ---------------------------------------------------------------------------

describe('HorizontalScroll — panel model (R2)', () => {
	it("a direct child's computed flex-basis follows --hz-horizontal-scroll-panel-width", () => {
		const { container } = render(HorizontalScroll);
		const root = sizedRoot(container, 300, 123, 1);
		const panel = root.querySelector('div') as HTMLElement;
		expect(getComputedStyle(panel).flexBasis).toBe('123px');
	});

	it('scroll-snap-align is start on every direct child regardless of snap', () => {
		const { container } = render(HorizontalScroll);
		const root = container.querySelector('.hz-horizontal-scroll') as HTMLElement;
		const [panel] = appendPanels(root, 1);
		expect(getComputedStyle(panel).scrollSnapAlign).toBe('start');

		const snapRender = render(HorizontalScroll, { snap: true });
		const snapRoot = snapRender.container.querySelector('.hz-horizontal-scroll') as HTMLElement;
		const [snapPanel] = appendPanels(snapRoot, 1);
		expect(getComputedStyle(snapPanel).scrollSnapAlign).toBe('start');
	});
});

// ---------------------------------------------------------------------------
// Snap default (R3)
// ---------------------------------------------------------------------------

describe('HorizontalScroll — snap default (R3)', () => {
	it('data-snap is absent by default and computed scroll-snap-type is none', () => {
		const { container } = render(HorizontalScroll, { children: oneChild });
		const el = container.querySelector('.hz-horizontal-scroll') as HTMLElement;
		expect(el.hasAttribute('data-snap')).toBe(false);
		expect(getComputedStyle(el).scrollSnapType).toBe('none');
	});

	it('with snap, data-snap is present and scroll-snap-type is x mandatory', () => {
		const { container } = render(HorizontalScroll, { snap: true, children: oneChild });
		const el = container.querySelector('.hz-horizontal-scroll') as HTMLElement;
		expect(el.hasAttribute('data-snap')).toBe(true);
		expect(getComputedStyle(el).scrollSnapType).toBe('x mandatory');
	});
});

// ---------------------------------------------------------------------------
// Wheel — on by default (R5, amended 2026-07-31)
// ---------------------------------------------------------------------------

describe('HorizontalScroll — wheel on by default (R5)', () => {
	it('with no props at all, data-wheel is present and a plain wheel event moves scrollLeft by the delta and is prevented', async () => {
		const { container } = render(HorizontalScroll);
		const root = sizedRoot(container, 300, 150, 5);
		await vi.waitFor(() => expect(root.hasAttribute('data-wheel')).toBe(true));
		const e = wheelEvent({ deltaY: 120 });
		root.dispatchEvent(e);
		expect(root.scrollLeft).toBe(120);
		expect(e.defaultPrevented).toBe(true);
	});

	it('deltaMode 1 (line) multiplies by WHEEL_LINE_PX (16)', async () => {
		const { container } = render(HorizontalScroll);
		const root = sizedRoot(container, 300, 150, 5);
		await vi.waitFor(() => expect(root.hasAttribute('data-wheel')).toBe(true));
		root.dispatchEvent(wheelEvent({ deltaY: 3, deltaMode: 1 }));
		expect(root.scrollLeft).toBe(48);
	});

	it('deltaMode 2 (page) multiplies by clientWidth', async () => {
		const { container } = render(HorizontalScroll);
		const root = sizedRoot(container, 300, 150, 5);
		await vi.waitFor(() => expect(root.hasAttribute('data-wheel')).toBe(true));
		root.dispatchEvent(wheelEvent({ deltaY: 1, deltaMode: 2 }));
		expect(root.scrollLeft).toBe(root.clientWidth);
	});
});

// ---------------------------------------------------------------------------
// Wheel — opt-out with wheel={false} (R5, amended 2026-07-31)
// ---------------------------------------------------------------------------

describe('HorizontalScroll — wheel={false} opts out (R5)', () => {
	it('a wheel event is not consumed, and no data-wheel is stamped', () => {
		const { container } = render(HorizontalScroll, { wheel: false });
		const root = sizedRoot(container, 300, 150, 5);
		const before = root.scrollLeft;
		const e = wheelEvent({ deltaY: 120 });
		root.dispatchEvent(e);
		expect(root.scrollLeft).toBe(before);
		expect(e.defaultPrevented).toBe(false);
		expect(root.hasAttribute('data-wheel')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Guards (R5)
// ---------------------------------------------------------------------------

describe('HorizontalScroll — wheel guards (R5)', () => {
	async function readyRoot(container: HTMLElement) {
		const root = sizedRoot(container, 300, 150, 5);
		await vi.waitFor(() => expect(root.hasAttribute('data-wheel')).toBe(true));
		return root;
	}

	it('shiftKey — never consumed', async () => {
		const { container } = render(HorizontalScroll, { wheel: true });
		const root = await readyRoot(container);
		const e = wheelEvent({ deltaY: 120, shiftKey: true });
		root.dispatchEvent(e);
		expect(root.scrollLeft).toBe(0);
		expect(e.defaultPrevented).toBe(false);
	});

	it('ctrlKey — never consumed', async () => {
		const { container } = render(HorizontalScroll, { wheel: true });
		const root = await readyRoot(container);
		const e = wheelEvent({ deltaY: 120, ctrlKey: true });
		root.dispatchEvent(e);
		expect(root.scrollLeft).toBe(0);
		expect(e.defaultPrevented).toBe(false);
	});

	it('deltaX dominant over deltaY — never consumed', async () => {
		const { container } = render(HorizontalScroll, { wheel: true });
		const root = await readyRoot(container);
		const e = wheelEvent({ deltaX: 200, deltaY: 10 });
		root.dispatchEvent(e);
		expect(root.scrollLeft).toBe(0);
		expect(e.defaultPrevented).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// End fall-through (R6)
// ---------------------------------------------------------------------------

describe('HorizontalScroll — end fall-through (R6)', () => {
	it('at scrollLeft 0, an upward wheel is not consumed', async () => {
		const { container } = render(HorizontalScroll, { wheel: true });
		const root = sizedRoot(container, 300, 150, 5);
		await vi.waitFor(() => expect(root.hasAttribute('data-wheel')).toBe(true));
		const e = wheelEvent({ deltaY: -120 });
		root.dispatchEvent(e);
		expect(root.scrollLeft).toBe(0);
		expect(e.defaultPrevented).toBe(false);
	});

	it('at the max, a downward wheel is not consumed, but an upward one is', async () => {
		const { container } = render(HorizontalScroll, { wheel: true });
		const root = sizedRoot(container, 300, 150, 5);
		await vi.waitFor(() => expect(root.hasAttribute('data-wheel')).toBe(true));
		const max = root.scrollWidth - root.clientWidth;
		root.scrollLeft = max;

		const down = wheelEvent({ deltaY: 120 });
		root.dispatchEvent(down);
		expect(root.scrollLeft).toBe(max);
		expect(down.defaultPrevented).toBe(false);

		const up = wheelEvent({ deltaY: -120 });
		root.dispatchEvent(up);
		expect(up.defaultPrevented).toBe(true);
		expect(root.scrollLeft).toBeLessThan(max);
	});

	it('a shell whose content does not overflow consumes nothing, in either direction', async () => {
		const { container } = render(HorizontalScroll, { wheel: true, children: oneChild });
		const root = container.querySelector('.hz-horizontal-scroll') as HTMLElement;
		await vi.waitFor(() => expect(root.hasAttribute('data-wheel')).toBe(true));
		const down = wheelEvent({ deltaY: 120 });
		root.dispatchEvent(down);
		expect(down.defaultPrevented).toBe(false);
		const up = wheelEvent({ deltaY: -120 });
		root.dispatchEvent(up);
		expect(up.defaultPrevented).toBe(false);
		expect(root.scrollLeft).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// Nested vertical scroller precedence (R6)
// ---------------------------------------------------------------------------

describe('HorizontalScroll — nested vertical scroller precedence (R6)', () => {
	it('a nested scroller with room takes the event; once exhausted, the remap takes over', async () => {
		const { container } = render(HorizontalScroll, { wheel: true });
		const root = sizedRoot(container, 300, 150, 5);
		await vi.waitFor(() => expect(root.hasAttribute('data-wheel')).toBe(true));

		const inner = document.createElement('div');
		inner.style.overflowY = 'auto';
		inner.style.height = '50px';
		const tall = document.createElement('div');
		tall.style.height = '200px';
		inner.appendChild(tall);
		root.appendChild(inner);

		const beforeLeft = root.scrollLeft;
		const e1 = wheelEvent({ deltaY: 40 });
		inner.dispatchEvent(e1);
		expect(e1.defaultPrevented).toBe(false);
		expect(root.scrollLeft).toBe(beforeLeft);

		// Exhaust the inner scroller downward, then the same gesture falls
		// through to the shell's own remap.
		inner.scrollTop = inner.scrollHeight - inner.clientHeight;
		const e2 = wheelEvent({ deltaY: 40 });
		inner.dispatchEvent(e2);
		expect(e2.defaultPrevented).toBe(true);
		expect(root.scrollLeft).toBeGreaterThan(beforeLeft);
	});
});

// ---------------------------------------------------------------------------
// Snap suppression during a wheel burst (R7)
// ---------------------------------------------------------------------------

describe('HorizontalScroll — wheel × snap (R7)', () => {
	it('a consumed event stamps data-wheeling and suppresses snap-type; it clears ~150ms after the last event', async () => {
		const { container } = render(HorizontalScroll, { wheel: true, snap: true });
		const root = sizedRoot(container, 300, 150, 5);
		await vi.waitFor(() => expect(root.hasAttribute('data-wheel')).toBe(true));
		expect(getComputedStyle(root).scrollSnapType).toBe('x mandatory');

		root.dispatchEvent(wheelEvent({ deltaY: 40 }));
		await vi.waitFor(() => expect(root.hasAttribute('data-wheeling')).toBe(true));
		expect(getComputedStyle(root).scrollSnapType).toBe('none');

		await vi.waitFor(() => expect(root.hasAttribute('data-wheeling')).toBe(false), {
			timeout: 1000
		});
		expect(getComputedStyle(root).scrollSnapType).toBe('x mandatory');
	});
});

// ---------------------------------------------------------------------------
// Teardown (R5)
// ---------------------------------------------------------------------------

describe('HorizontalScroll — teardown (R5)', () => {
	it('flipping wheel to false detaches the listener: data-wheel disappears and further events are not consumed', async () => {
		const { container, rerender } = render(HorizontalScroll, { wheel: true });
		const root = sizedRoot(container, 300, 150, 5);
		await vi.waitFor(() => expect(root.hasAttribute('data-wheel')).toBe(true));

		await rerender({ wheel: false });
		await vi.waitFor(() => expect(root.hasAttribute('data-wheel')).toBe(false));

		const before = root.scrollLeft;
		const e = wheelEvent({ deltaY: 120 });
		root.dispatchEvent(e);
		expect(e.defaultPrevented).toBe(false);
		expect(root.scrollLeft).toBe(before);
	});
});

// ---------------------------------------------------------------------------
// Home/End (R4)
// ---------------------------------------------------------------------------

describe('HorizontalScroll — Home/End (R4)', () => {
	function keydown(target: HTMLElement, key: 'Home' | 'End') {
		target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
	}

	it('Home/End on the root jump to the start/end of the scroll range', async () => {
		const { container } = render(HorizontalScroll);
		const root = sizedRoot(container, 300, 150, 5);
		const max = root.scrollWidth - root.clientWidth;
		root.scrollLeft = max;

		keydown(root, 'Home');
		await vi.waitFor(() => expect(root.scrollLeft).toBe(0));

		keydown(root, 'End');
		await vi.waitFor(() => expect(root.scrollLeft).toBeGreaterThanOrEqual(max - 1));
	});

	it('Home/End dispatched from a focused input inside a panel is ignored (caret movement, untouched)', () => {
		const { container } = render(HorizontalScroll);
		const root = sizedRoot(container, 300, 150, 5);
		const input = document.createElement('input');
		root.appendChild(input);
		root.scrollLeft = 10;

		const e = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true });
		input.dispatchEvent(e);
		expect(root.scrollLeft).toBe(10);
		expect(e.defaultPrevented).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// R1 — Barrel export
// ---------------------------------------------------------------------------

describe('R1 — barrel export', () => {
	it('HorizontalScroll is resolvable from $lib', async () => {
		const mod = await import('$lib');
		expect(mod.HorizontalScroll).toBeDefined();
	});
});
