import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Carousel from './Carousel.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const items = ['alpha', 'beta', 'gamma'];

// render() can't carry Carousel's generic through, so T = unknown here.
const slideSnippet = createRawSnippet<[unknown, number]>((getItem) => ({
	render: () => `<p data-testid="slide-content">${getItem()}</p>`
}));

const base = { items, ariaLabel: 'Demo carousel', slide: slideSnippet };

function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

function parts(container: HTMLElement) {
	return {
		root: container.querySelector('.hz-carousel') as HTMLElement,
		track: container.querySelector('.hz-carousel-track') as HTMLElement,
		slides: Array.from(container.querySelectorAll<HTMLElement>('.hz-carousel-slide')),
		prev: container.querySelector('.hz-carousel-prev') as HTMLButtonElement,
		next: container.querySelector('.hz-carousel-next') as HTMLButtonElement,
		status: container.querySelector('.hz-carousel-status') as HTMLElement
	};
}

// The active slide is the one that isn't inert (spec 33 R2 — off-screen slides
// are inert, not hidden).
function visibleText(container: HTMLElement): string {
	const active = Array.from(container.querySelectorAll<HTMLElement>('.hz-carousel-slide')).find(
		(s) => !s.hasAttribute('inert')
	);
	return active?.textContent?.trim() ?? '';
}

/** Dispatch a pointer event on the track with a client position. */
function pointer(
	el: HTMLElement,
	type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
	x: number,
	y = 0,
	pointerType: 'touch' | 'mouse' = 'touch'
) {
	el.dispatchEvent(
		new PointerEvent(type, {
			pointerId: 1,
			pointerType,
			button: 0,
			clientX: x,
			clientY: y,
			bubbles: true,
			cancelable: true
		})
	);
}

/** Fire a native scroll event on an element (setting scrollLeft alone doesn't). */
function fireScroll(el: HTMLElement) {
	el.dispatchEvent(new Event('scroll'));
}

/** Every non-clone slide, in real-index order. */
function railSlides(container: HTMLElement): HTMLElement[] {
	return Array.from(
		container.querySelectorAll<HTMLElement>('.hz-carousel-slide:not([data-clone])')
	);
}

/**
 * The R7 degenerate-guard overflow check runs once, synchronously, at mount —
 * before a test gets a chance to set inline styles afterward. A stylesheet
 * inserted ahead of render() sizes the rail from its very first layout
 * instead, so the guard sees the intended dimensions. Returns a cleanup fn.
 */
function sizeRailBeforeMount(
	className: string,
	itemWidthPx: number,
	viewportWidthPx: number
): () => void {
	const style = document.createElement('style');
	style.textContent = `.${className} { --hz-carousel-item-width: ${itemWidthPx}px; } .${className} .hz-carousel-viewport { width: ${viewportWidthPx}px; }`;
	document.head.appendChild(style);
	return () => style.remove();
}

function wait(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// APG structure
// ---------------------------------------------------------------------------

describe('structure', () => {
	it('root is a labeled group with aria-roledescription="carousel"', () => {
		const { container } = render(Carousel, base);
		const { root } = parts(container);
		expect(root.getAttribute('role')).toBe('group');
		expect(root.getAttribute('aria-roledescription')).toBe('carousel');
		expect(root.getAttribute('aria-label')).toBe('Demo carousel');
	});

	it('the slide viewport is an aria-live=polite region (no auto-rotation)', () => {
		const { container } = render(Carousel, base);
		const viewport = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		expect(viewport.getAttribute('aria-live')).toBe('polite');
	});

	it('each slide is a group with aria-roledescription="slide" and "{n} of {total}"', () => {
		const { container } = render(Carousel, base);
		const { slides } = parts(container);
		expect(slides).toHaveLength(3);
		slides.forEach((slide, i) => {
			expect(slide.getAttribute('role')).toBe('group');
			expect(slide.getAttribute('aria-roledescription')).toBe('slide');
			expect(slide.getAttribute('aria-label')).toBe(`${i + 1} of 3`);
		});
	});

	it('slideLabel customizes the slide accessible names', () => {
		const { container } = render(Carousel, {
			...base,
			slideLabel: (item: unknown, i: number) => `${item} (${i + 1})`
		});
		expect(parts(container).slides[0].getAttribute('aria-label')).toBe('alpha (1)');
	});

	it('slides sit in a track; only the active one is non-inert (spec 33 R1/R2)', () => {
		const { container } = render(Carousel, base);
		const { track, slides } = parts(container);
		expect(track).not.toBeNull();
		expect(slides.every((s) => track.contains(s))).toBe(true);
		// No slide uses hidden anymore.
		expect(slides.some((s) => s.hidden)).toBe(false);
		expect(slides[0].hasAttribute('inert')).toBe(false);
		expect(slides[0].hasAttribute('data-active')).toBe(true);
		expect(slides[1].hasAttribute('inert')).toBe(true);
		expect(slides[2].hasAttribute('inert')).toBe(true);
		expect(visibleText(container)).toBe('alpha');
	});

	it('the track carries a translateX transform that changes with the index', async () => {
		const { container } = render(Carousel, base);
		const { track, next } = parts(container);
		const at0 = track.style.transform;
		expect(at0).toContain('translateX');
		next.click();
		await tick();
		// Browsers reserialize calc() differently, so assert it moved, not its text.
		expect(parts(container).track.style.transform).not.toBe(at0);
	});

	it('prev/next compose Button (.hz-button, derived icon-only form)', () => {
		const { container } = render(Carousel, base);
		const { prev, next } = parts(container);
		expect(prev.classList.contains('hz-button')).toBe(true);
		expect(prev.hasAttribute('data-icon-only')).toBe(true);
		expect(next.classList.contains('hz-button')).toBe(true);
	});

	it('a single item renders no controls', () => {
		const { container } = render(Carousel, { ...base, items: ['only'] });
		expect(container.querySelector('.hz-carousel-controls')).toBeNull();
	});

	it('class is merged after hz-carousel; rest forwards to the root', () => {
		const { container } = render(Carousel, {
			...base,
			class: 'gallery',
			'data-testid': 'car'
		} as Record<string, unknown>);
		const { root } = parts(container);
		expect(root.classList.contains('hz-carousel')).toBe(true);
		expect(root.classList.contains('gallery')).toBe(true);
		expect(root.getAttribute('data-testid')).toBe('car');
	});
});

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

describe('navigation', () => {
	it('next advances the slide and the status readout', async () => {
		const { container } = render(Carousel, base);
		const { next, status } = parts(container);
		expect(status.textContent?.trim()).toBe('1 / 3');
		next.click();
		await tick();
		expect(visibleText(container)).toBe('beta');
		expect(parts(container).status.textContent?.trim()).toBe('2 / 3');
	});

	it('without loop, prev is disabled at the start and next at the end', async () => {
		const { container } = render(Carousel, base);
		const { prev, next } = parts(container);
		expect(prev.getAttribute('aria-disabled')).toBe('true');
		next.click();
		await tick();
		next.click();
		await tick();
		expect(parts(container).next.getAttribute('aria-disabled')).toBe('true');
		expect(parts(container).prev.hasAttribute('aria-disabled')).toBe(false);
	});

	it('with loop, navigation wraps in both directions and nothing disables', async () => {
		const { container } = render(Carousel, { ...base, loop: true });
		const { prev } = parts(container);
		expect(prev.hasAttribute('aria-disabled')).toBe(false);
		prev.click(); // 0 → wraps to last
		await tick();
		expect(visibleText(container)).toBe('gamma');
		parts(container).next.click(); // last → wraps to first
		await tick();
		expect(visibleText(container)).toBe('alpha');
	});

	it('onchange fires with the new index; not on clamped no-ops', async () => {
		const onchange = vi.fn();
		const { container } = render(Carousel, { ...base, onchange });
		const { prev, next } = parts(container);
		prev.click(); // clamped at 0 — no change
		await tick();
		expect(onchange).not.toHaveBeenCalled();
		next.click();
		await tick();
		expect(onchange).toHaveBeenCalledWith(1);
	});

	it('ArrowRight/ArrowLeft/Home/End steer from anywhere inside the carousel', async () => {
		const { container } = render(Carousel, base);
		const { root } = parts(container);
		function key(k: string) {
			root.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
		}
		key('ArrowRight');
		await tick();
		expect(visibleText(container)).toBe('beta');
		key('End');
		await tick();
		expect(visibleText(container)).toBe('gamma');
		key('ArrowLeft');
		await tick();
		expect(visibleText(container)).toBe('beta');
		key('Home');
		await tick();
		expect(visibleText(container)).toBe('alpha');
	});

	it('prevLabel/nextLabel name the controls', () => {
		const { container } = render(Carousel, {
			...base,
			prevLabel: 'Back',
			nextLabel: 'Forward'
		});
		expect(parts(container).prev.getAttribute('aria-label')).toBe('Back');
		expect(parts(container).next.getAttribute('aria-label')).toBe('Forward');
	});
});

// ---------------------------------------------------------------------------
// Pointer drag (spec 33 R3–R6, R10)
// ---------------------------------------------------------------------------

describe('pointer drag', () => {
	it('a horizontal drag past threshold sets and then clears data-dragging', async () => {
		const { container } = render(Carousel, base);
		const { track } = parts(container);
		pointer(track, 'pointerdown', 200);
		pointer(track, 'pointermove', 180); // dx -20, horizontal → drag starts
		await tick();
		expect(track.hasAttribute('data-dragging')).toBe(true);
		pointer(track, 'pointerup', 180);
		await tick();
		expect(parts(container).track.hasAttribute('data-dragging')).toBe(false);
	});

	it('a drag past half the viewport advances one slide (distance)', async () => {
		const onchange = vi.fn();
		const { container } = render(Carousel, { ...base, onchange });
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '200px'; // half = 100px, deterministic
		const { track } = parts(container);
		pointer(track, 'pointerdown', 300);
		pointer(track, 'pointermove', 140); // dx -160 > 100
		pointer(track, 'pointerup', 140);
		await tick();
		expect(visibleText(container)).toBe('beta');
		expect(onchange).toHaveBeenCalledWith(1);
	});

	it('a fast flick advances one slide even when the distance is small (velocity)', async () => {
		const onchange = vi.fn();
		const { container } = render(Carousel, { ...base, onchange });
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '4000px'; // half = 2000px, so distance alone never triggers
		const { track } = parts(container);
		// A short move over a short real interval → high velocity (>0.5 px/ms).
		pointer(track, 'pointerdown', 200);
		await wait(6);
		pointer(track, 'pointermove', 180);
		await wait(6);
		pointer(track, 'pointermove', 160); // dx -40 over ~12ms ≈ 3 px/ms
		pointer(track, 'pointerup', 160);
		await tick();
		expect(visibleText(container)).toBe('beta');
		expect(onchange).toHaveBeenCalledWith(1);
	});

	it('a short, slow drag snaps back with no change', async () => {
		const onchange = vi.fn();
		const { container } = render(Carousel, { ...base, onchange });
		const { track } = parts(container);
		pointer(track, 'pointerdown', 200);
		await wait(120);
		pointer(track, 'pointermove', 188); // dx -12: past the 8px threshold, drags
		await wait(220);
		pointer(track, 'pointermove', 184); // slow: ~0.02 px/ms over the window
		await wait(220);
		pointer(track, 'pointerup', 184);
		await tick();
		expect(visibleText(container)).toBe('alpha');
		expect(onchange).not.toHaveBeenCalled();
	});

	it('a mostly-vertical gesture does not drag (page scroll wins)', async () => {
		const { container } = render(Carousel, base);
		const { track } = parts(container);
		pointer(track, 'pointerdown', 200, 200);
		pointer(track, 'pointermove', 196, 240); // dy dominates → vertical, bail
		await tick();
		expect(track.hasAttribute('data-dragging')).toBe(false);
		pointer(track, 'pointerup', 196, 260);
		await tick();
		expect(visibleText(container)).toBe('alpha');
	});

	it('without loop, a boundary drag snaps back (bounded)', async () => {
		const onchange = vi.fn();
		const { container } = render(Carousel, { ...base, onchange });
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '200px';
		const { track } = parts(container);
		// At index 0, drag right (toward previous). No loop → snaps back.
		pointer(track, 'pointerdown', 100);
		pointer(track, 'pointermove', 260);
		pointer(track, 'pointermove', 400);
		pointer(track, 'pointerup', 400);
		await tick();
		expect(visibleText(container)).toBe('alpha');
		expect(onchange).not.toHaveBeenCalled();
	});

	it('with loop, a boundary flick wraps (drag loops when opted in)', async () => {
		const onchange = vi.fn();
		const { container } = render(Carousel, { ...base, loop: true, onchange });
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '200px';
		const { track } = parts(container);
		// At index 0, drag right past half → wraps to the last slide.
		pointer(track, 'pointerdown', 100);
		pointer(track, 'pointermove', 260);
		pointer(track, 'pointermove', 400); // dx +300 > 100 half
		pointer(track, 'pointerup', 400);
		await tick();
		expect(visibleText(container)).toBe('gamma');
		expect(onchange).toHaveBeenCalledWith(2);
	});

	it('a real drag suppresses the trailing click; a plain click passes through', async () => {
		const { container } = render(Carousel, base);
		const { track } = parts(container);

		// After a drag, the click that lands is cancelled.
		pointer(track, 'pointerdown', 200);
		pointer(track, 'pointermove', 150);
		pointer(track, 'pointerup', 150);
		const dragClick = new MouseEvent('click', { bubbles: true, cancelable: true });
		track.dispatchEvent(dragClick);
		expect(dragClick.defaultPrevented).toBe(true);

		// A subsequent plain click (no drag) is not.
		const plainClick = new MouseEvent('click', { bubbles: true, cancelable: true });
		track.dispatchEvent(plainClick);
		expect(plainClick.defaultPrevented).toBe(false);
	});

	it('suppresses native drag-start on the track so a drag begun on an image works', () => {
		// An <img> is draggable by default; its ghost-drag would cancel the
		// pointer sequence. The track cancels dragstart while draggable.
		const { container } = render(Carousel, base);
		const { track } = parts(container);
		const ev = new Event('dragstart', { bubbles: true, cancelable: true });
		track.dispatchEvent(ev);
		expect(ev.defaultPrevented).toBe(true);
	});

	it('draggable={false} leaves native drag-start alone', () => {
		const { container } = render(Carousel, { ...base, draggable: false });
		const { track } = parts(container);
		const ev = new Event('dragstart', { bubbles: true, cancelable: true });
		track.dispatchEvent(ev);
		expect(ev.defaultPrevented).toBe(false);
	});

	it('draggable={false} ignores pointer drag but keeps button nav', async () => {
		const { container } = render(Carousel, { ...base, draggable: false });
		const { track } = parts(container);
		pointer(track, 'pointerdown', 200);
		pointer(track, 'pointermove', 120);
		pointer(track, 'pointerup', 120);
		await tick();
		expect(track.hasAttribute('data-dragging')).toBe(false);
		expect(visibleText(container)).toBe('alpha');
		parts(container).next.click();
		await tick();
		expect(visibleText(container)).toBe('beta');
	});
});

// ---------------------------------------------------------------------------
// Barrel export
// ---------------------------------------------------------------------------

describe('indicator', () => {
	it('default (counter): status span present, no dots', () => {
		const { container } = render(Carousel, base);
		expect(container.querySelector('.hz-carousel-status')).not.toBeNull();
		expect(container.querySelector('.hz-carousel-dots')).toBeNull();
	});

	it('dots: one labeled button per slide, aria-current on the active one, no counter', () => {
		const { container } = render(Carousel, { ...base, indicator: 'dots' });
		expect(container.querySelector('.hz-carousel-status')).toBeNull();
		const dots = Array.from(container.querySelectorAll<HTMLButtonElement>('.hz-carousel-dot'));
		expect(dots.length).toBe(3);
		expect(dots[0].getAttribute('aria-label')).toBe('Go to slide 1 of 3');
		expect(dots[2].getAttribute('aria-label')).toBe('Go to slide 3 of 3');
		expect(dots[0].getAttribute('aria-current')).toBe('true');
		expect(dots[1].hasAttribute('aria-current')).toBe(false);
		expect(dots[0].hasAttribute('data-active')).toBe(true);
	});

	it('clicking a dot jumps to that slide and moves aria-current', async () => {
		const onchange = vi.fn();
		const { container } = render(Carousel, { ...base, indicator: 'dots', onchange });
		const dots = Array.from(container.querySelectorAll<HTMLButtonElement>('.hz-carousel-dot'));
		dots[2].click();
		await tick();
		expect(visibleText(container)).toBe('gamma');
		expect(onchange).toHaveBeenCalledWith(2);
		expect(dots[2].getAttribute('aria-current')).toBe('true');
		expect(dots[0].hasAttribute('aria-current')).toBe(false);
	});

	it('dotLabel overrides the dot accessible names', () => {
		const { container } = render(Carousel, {
			...base,
			indicator: 'dots',
			dotLabel: (i: number, c: number) => `Bild ${i + 1} von ${c}`
		});
		expect(
			(container.querySelector('.hz-carousel-dot') as HTMLButtonElement).getAttribute('aria-label')
		).toBe('Bild 1 von 3');
	});

	it('dots viewport still announces via the live region', () => {
		const { container } = render(Carousel, { ...base, indicator: 'dots' });
		expect(
			(container.querySelector('.hz-carousel-viewport') as HTMLElement).getAttribute('aria-live')
		).toBe('polite');
	});
});

// ---------------------------------------------------------------------------
// specs/43 — controls presentation mode (R1–R5)
// ---------------------------------------------------------------------------

describe('controls prop (R1) — root hook, presentation only', () => {
	it('data-controls defaults to "visible" and reflects the prop for both values', () => {
		const { container } = render(Carousel, base);
		expect(parts(container).root.getAttribute('data-controls')).toBe('visible');

		const { container: focusContainer } = render(Carousel, { ...base, controls: 'focus' });
		expect(parts(focusContainer).root.getAttribute('data-controls')).toBe('focus');
	});

	it('controls markup renders identically in both modes when count > 1', () => {
		const { container } = render(Carousel, { ...base, controls: 'focus', indicator: 'dots' });
		expect(container.querySelector('.hz-carousel-controls')).not.toBeNull();
		expect(container.querySelector('.hz-carousel-prev')).not.toBeNull();
		expect(container.querySelector('.hz-carousel-next')).not.toBeNull();
		expect(container.querySelectorAll('.hz-carousel-dot')).toHaveLength(3);
	});

	it('a single item renders no controls in either mode (33 existing edge case)', () => {
		const { container } = render(Carousel, { ...base, items: ['only'], controls: 'focus' });
		expect(container.querySelector('.hz-carousel-controls')).toBeNull();
	});
});

describe('controls="focus" — every control stays operable (R2, WCAG 2.5.7)', () => {
	it('prev/next/dots are present, in the a11y tree, and not hidden via display/visibility/aria-hidden/inert', () => {
		const { container } = render(Carousel, { ...base, controls: 'focus', indicator: 'dots' });
		const controls = [
			...Array.from(
				container.querySelectorAll<HTMLElement>('.hz-carousel-prev, .hz-carousel-next')
			),
			...Array.from(container.querySelectorAll<HTMLElement>('.hz-carousel-dot'))
		];
		expect(controls.length).toBeGreaterThan(0);
		for (const el of controls) {
			expect(el.hasAttribute('aria-hidden')).toBe(false);
			expect(el.hasAttribute('inert')).toBe(false);
			expect(getComputedStyle(el).display).not.toBe('none');
			expect(getComputedStyle(el).visibility).not.toBe('hidden');
		}
	});

	it('is .click()-operable (the pointer/2.5.7 path) despite the visual hide', async () => {
		const onchange = vi.fn();
		const { container } = render(Carousel, { ...base, controls: 'focus', onchange });
		const { next } = parts(container);
		next.click();
		await tick();
		expect(visibleText(container)).toBe('beta');
		expect(onchange).toHaveBeenCalledWith(1);
	});

	it('Arrow/Home/End still steer from anywhere inside the carousel', async () => {
		const { container } = render(Carousel, { ...base, controls: 'focus' });
		const { root } = parts(container);
		function key(k: string) {
			root.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
		}
		key('ArrowRight');
		await tick();
		expect(visibleText(container)).toBe('beta');
		key('End');
		await tick();
		expect(visibleText(container)).toBe('gamma');
		key('Home');
		await tick();
		expect(visibleText(container)).toBe('alpha');
	});
});

describe('controls="focus" — drag is unchanged (R5)', () => {
	it('drag advances/announces exactly as 33 and never moves document.activeElement', async () => {
		const onchange = vi.fn();
		const { container } = render(Carousel, { ...base, controls: 'focus', onchange });
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '200px'; // half = 100px, deterministic — mirrors the 33 distance test
		const { track } = parts(container);
		const before = document.activeElement;
		pointer(track, 'pointerdown', 300);
		pointer(track, 'pointermove', 140); // dx -160 > 100
		pointer(track, 'pointerup', 140);
		await tick();
		expect(visibleText(container)).toBe('beta');
		expect(onchange).toHaveBeenCalledWith(1);
		expect(document.activeElement).toBe(before);
	});
});

// ---------------------------------------------------------------------------
// specs/43 — seamless boundary wrap (R6/R7)
// ---------------------------------------------------------------------------

describe('seamless prop (R6) — root hook', () => {
	it('data-seamless is present only when seamless && loop', () => {
		const both = render(Carousel, { ...base, seamless: true, loop: true });
		expect(parts(both.container).root.hasAttribute('data-seamless')).toBe(true);

		const noLoop = render(Carousel, { ...base, seamless: true, loop: false });
		expect(parts(noLoop.container).root.hasAttribute('data-seamless')).toBe(false);

		const noSeamless = render(Carousel, { ...base, seamless: false, loop: true });
		expect(parts(noSeamless.container).root.hasAttribute('data-seamless')).toBe(false);
	});

	it('seamless without loop is an inert no-op: navigation stays bounded, no clone ever renders', async () => {
		const { container } = render(Carousel, { ...base, seamless: true });
		const { prev, next } = parts(container);
		expect(prev.getAttribute('aria-disabled')).toBe('true');
		next.click();
		await tick();
		next.click();
		await tick();
		expect(parts(container).next.getAttribute('aria-disabled')).toBe('true');
		expect(container.querySelector('[data-clone]')).toBeNull();
	});
});

describe('seamless off — spec 33 DOM stays byte-identical (no clone machinery)', () => {
	it('with loop but seamless unset, boundary crossings never render a clone (go() rewind, as 33)', async () => {
		const { container } = render(Carousel, { ...base, loop: true });
		const { prev, next } = parts(container);
		prev.click(); // wraps 0 -> last via go()'s rewind
		await wait(500);
		expect(container.querySelector('[data-clone]')).toBeNull();
		expect(visibleText(container)).toBe('gamma');
		next.click(); // wraps back to first
		await wait(500);
		expect(container.querySelector('[data-clone]')).toBeNull();
		expect(visibleText(container)).toBe('alpha');
	});
});

describe('seamless loop — every ±1 boundary path settles through a clone (R6/R7)', () => {
	it('next button wrap (forward, last → first): index wraps, onchange fires once, a clone renders mid-wrap and is gone after', async () => {
		const onchange = vi.fn();
		const { container } = render(Carousel, { ...base, loop: true, seamless: true, onchange });
		const { next } = parts(container);
		next.click(); // 0 -> 1
		await tick();
		next.click(); // 1 -> 2 (last)
		await wait(500);
		next.click(); // wraps 2 -> 0, seamless
		await wait(100);
		const clone = container.querySelector('[data-clone]') as HTMLElement | null;
		expect(clone).not.toBeNull();
		expect(clone?.hasAttribute('inert')).toBe(true);
		expect(clone?.getAttribute('aria-hidden')).toBe('true');
		// The clone is never counted in the live status or the dot rail.
		expect(container.querySelectorAll('.hz-carousel-slide:not([data-clone])')).toHaveLength(3);
		await wait(700);
		expect(container.querySelector('[data-clone]')).toBeNull();
		expect(visibleText(container)).toBe('alpha');
		expect(onchange.mock.calls.filter((c) => c[0] === 0)).toHaveLength(1);
	});

	it('prev button wrap (backward, first → last): same seamless settle, single onchange', async () => {
		const onchange = vi.fn();
		const { container } = render(Carousel, { ...base, loop: true, seamless: true, onchange });
		const { prev } = parts(container);
		prev.click(); // wraps 0 -> last, seamless
		await wait(100);
		expect(container.querySelector('[data-clone]')).not.toBeNull();
		await wait(700);
		expect(container.querySelector('[data-clone]')).toBeNull();
		expect(visibleText(container)).toBe('gamma');
		expect(onchange.mock.calls.filter((c) => c[0] === 2)).toHaveLength(1);
	});

	it('ArrowRight at the last slide / ArrowLeft at the first both wrap seamlessly', async () => {
		const onchange = vi.fn();
		const { container } = render(Carousel, { ...base, loop: true, seamless: true, onchange });
		const { root } = parts(container);
		root.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })
		);
		await wait(100);
		expect(container.querySelector('[data-clone]')).not.toBeNull();
		await wait(700);
		expect(container.querySelector('[data-clone]')).toBeNull();
		expect(visibleText(container)).toBe('gamma');
		expect(onchange).toHaveBeenCalledWith(2);
	});

	it('a dot click that is an adjacent (±1) wrap step settles seamlessly', async () => {
		const onchange = vi.fn();
		const { container } = render(Carousel, {
			...base,
			loop: true,
			seamless: true,
			indicator: 'dots',
			onchange
		});
		const dots = Array.from(container.querySelectorAll<HTMLButtonElement>('.hz-carousel-dot'));
		dots[2].click(); // index 0 -> dot 2 (last) is the backward wrap neighbor
		await wait(100);
		expect(container.querySelector('[data-clone]')).not.toBeNull();
		await wait(700);
		expect(container.querySelector('[data-clone]')).toBeNull();
		expect(visibleText(container)).toBe('gamma');
		expect(onchange).toHaveBeenCalledWith(2);
	});

	it('a drag flick past the last slide wraps seamlessly and leaves no clone behind', async () => {
		const onchange = vi.fn();
		const { container } = render(Carousel, { ...base, loop: true, seamless: true, onchange });
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '200px';
		const { next, track } = parts(container);
		next.click();
		await tick();
		next.click(); // now at the last slide
		await wait(500);
		pointer(track, 'pointerdown', 300);
		pointer(track, 'pointermove', 140); // dx -160 > 100 half, forward wrap
		pointer(track, 'pointerup', 140);
		await wait(100);
		expect(container.querySelector('[data-clone]')).not.toBeNull();
		await wait(700);
		expect(container.querySelector('[data-clone]')).toBeNull();
		expect(visibleText(container)).toBe('alpha');
		expect(onchange).toHaveBeenCalledWith(0);
	});
});

describe('seamless loop — adjacent-only rule (R6): no clone for multi-slide jumps or Home/End', () => {
	it('a multi-slide dot jump across the boundary renders no clone', async () => {
		const fourItems = ['alpha', 'beta', 'gamma', 'delta'];
		const { container } = render(Carousel, {
			items: fourItems,
			ariaLabel: 'Demo carousel',
			slide: slideSnippet,
			loop: true,
			seamless: true,
			indicator: 'dots'
		});
		const dots = Array.from(container.querySelectorAll<HTMLButtonElement>('.hz-carousel-dot'));
		dots[2].click(); // 0 -> 2, distance 2 — not an adjacent wrap step
		await wait(500);
		expect(container.querySelector('[data-clone]')).toBeNull();
		expect(visibleText(container)).toBe('gamma');
	});

	it('Home/End render no clone even when they land on a boundary neighbor', async () => {
		const { container } = render(Carousel, { ...base, loop: true, seamless: true });
		const { root, next } = parts(container);
		next.click();
		await tick();
		next.click(); // now at the last slide
		await wait(500);
		root.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true })
		);
		await wait(300);
		expect(container.querySelector('[data-clone]')).toBeNull();
		expect(visibleText(container)).toBe('alpha');
	});
});

// ---------------------------------------------------------------------------
// specs/58 — carousel rail (multi-visible native scroller)
// ---------------------------------------------------------------------------

const railItems = ['a1', 'b2', 'c3', 'd4', 'e5', 'f6'];
const railBase = { items: railItems, ariaLabel: 'Demo rail', slide: slideSnippet };

describe('layout prop (R1) — root hook + rail mode gating', () => {
	it('data-layout reflects the prop for both values', () => {
		const single = render(Carousel, base);
		expect(parts(single.container).root.getAttribute('data-layout')).toBe('single');
		const rail = render(Carousel, { ...base, layout: 'rail' });
		expect(parts(rail.container).root.getAttribute('data-layout')).toBe('rail');
	});

	it('rail: the viewport computes overflow-x auto, is a tab stop, and has no aria-live', () => {
		const { container } = render(Carousel, { ...base, layout: 'rail' });
		const viewport = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		expect(getComputedStyle(viewport).overflowX).toBe('auto');
		expect(viewport.getAttribute('tabindex')).toBe('0');
		expect(viewport.hasAttribute('aria-live')).toBe(false);
	});

	it('rail: the track carries no inline transform', () => {
		const { container } = render(Carousel, { ...base, layout: 'rail' });
		const { track } = parts(container);
		expect(track.style.transform).toBe('');
	});

	it('rail: no slide is inert and none carries data-active', () => {
		const { container } = render(Carousel, { ...base, layout: 'rail' });
		const { slides } = parts(container);
		expect(slides.every((s) => !s.hasAttribute('inert'))).toBe(true);
		expect(slides.every((s) => !s.hasAttribute('data-active'))).toBe(true);
	});

	it('rail: slides keep role, aria-roledescription, and "{n} of {total}"', () => {
		const { container } = render(Carousel, { ...base, layout: 'rail' });
		const { slides } = parts(container);
		expect(slides).toHaveLength(3);
		slides.forEach((slide, i) => {
			expect(slide.getAttribute('role')).toBe('group');
			expect(slide.getAttribute('aria-roledescription')).toBe('slide');
			expect(slide.getAttribute('aria-label')).toBe(`${i + 1} of 3`);
		});
	});

	it('single mode: no rail attribute appears, and the 33/43 suites above stay green unmodified', () => {
		const { container } = render(Carousel, base);
		const viewport = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		expect(viewport.hasAttribute('tabindex')).toBe(false);
		expect(viewport.hasAttribute('onscroll')).toBe(false);
		expect(parts(container).root.hasAttribute('data-snap')).toBe(false);
		expect(container.querySelector('[data-clone]')).toBeNull();
	});
});

describe('rail sizing (R2)', () => {
	it("a slide's resolved flex-basis follows --hz-carousel-item-width set on the root", () => {
		const { container } = render(Carousel, { ...base, layout: 'rail' });
		const { root, slides } = parts(container);
		root.style.setProperty('--hz-carousel-item-width', '123px');
		expect(getComputedStyle(slides[0]).flexBasis).toBe('123px');
	});
});

describe('snap prop (R3)', () => {
	it('data-snap is present by default in rail, absent with snap={false}, and absent in single mode', () => {
		const rail = render(Carousel, { ...base, layout: 'rail' });
		expect(parts(rail.container).root.hasAttribute('data-snap')).toBe(true);

		const noSnap = render(Carousel, { ...base, layout: 'rail', snap: false });
		expect(parts(noSnap.container).root.hasAttribute('data-snap')).toBe(false);

		const single = render(Carousel, { ...base, snap: false });
		expect(parts(single.container).root.hasAttribute('data-snap')).toBe(false);
	});

	it('computed scroll-snap-type matches data-snap, and becomes none while dragging', async () => {
		const { container } = render(Carousel, { ...railBase, layout: 'rail' });
		const viewport = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		expect(getComputedStyle(viewport).scrollSnapType).toBe('x mandatory');

		const { track } = parts(container);
		pointer(track, 'pointerdown', 200, 0, 'mouse');
		pointer(track, 'pointermove', 180, 0, 'mouse');
		await tick();
		expect(track.hasAttribute('data-dragging')).toBe(true);
		expect(getComputedStyle(viewport).scrollSnapType).toBe('none');
		pointer(track, 'pointerup', 180, 0, 'mouse');
		await tick();
		expect(getComputedStyle(viewport).scrollSnapType).toBe('x mandatory');
	});
});

describe('rail buttons (R5)', () => {
	it('next increases the scroll position by about one viewport width; prev decreases it', async () => {
		const { container } = render(Carousel, { ...railBase, layout: 'rail' });
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '300px';
		const { next, prev } = parts(container);

		next.click();
		await vi.waitFor(() => expect(vp.scrollLeft).toBeGreaterThanOrEqual(290));

		const afterNext = vp.scrollLeft;
		prev.click();
		await vi.waitFor(() => expect(vp.scrollLeft).toBeLessThan(afterNext));
	});

	it('without loop, prev disables at the start and next at the end', async () => {
		const { container } = render(Carousel, { ...railBase, layout: 'rail' });
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '300px';
		const { prev, next } = parts(container);

		fireScroll(vp); // force a measurement against the sized viewport
		await vi.waitFor(() => expect(prev.getAttribute('aria-disabled')).toBe('true'));

		vp.scrollLeft = vp.scrollWidth - vp.clientWidth;
		fireScroll(vp);
		await vi.waitFor(() => expect(next.getAttribute('aria-disabled')).toBe('true'));
		expect(prev.hasAttribute('aria-disabled')).toBe(false);
	});

	it('with loop, neither button disables', async () => {
		const { container } = render(Carousel, { ...railBase, layout: 'rail', loop: true });
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '300px';
		const { prev, next } = parts(container);
		await vi.waitFor(() => {
			expect(prev.hasAttribute('aria-disabled')).toBe(false);
			expect(next.hasAttribute('aria-disabled')).toBe(false);
		});
	});

	it('both buttons disable when content does not overflow', async () => {
		const { container } = render(Carousel, { ...base, layout: 'rail' });
		const { root, prev, next } = parts(container);
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		root.style.setProperty('--hz-carousel-item-width', '20px');
		vp.style.width = '1000px';
		fireScroll(vp); // force a measurement against the resized, non-overflowing viewport
		await vi.waitFor(() => {
			expect(prev.getAttribute('aria-disabled')).toBe('true');
			expect(next.getAttribute('aria-disabled')).toBe('true');
		});
	});
});

describe('rail index semantics (R4)', () => {
	it('setting the scroll position to an item start updates index and fires onchange once; a further scroll within the same item fires nothing', async () => {
		const onchange = vi.fn();
		const { container } = render(Carousel, { ...railBase, layout: 'rail', onchange });
		const { root } = parts(container);
		root.style.setProperty('--hz-carousel-item-width', '100px');
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '300px';

		const slides = railSlides(container);
		vp.scrollLeft = slides[2].offsetLeft;
		fireScroll(vp);
		await vi.waitFor(() => expect(onchange).toHaveBeenCalledWith(2));

		onchange.mockClear();
		vp.scrollLeft = slides[2].offsetLeft + 5; // still nearest to slide 2
		fireScroll(vp);
		await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
		expect(onchange).not.toHaveBeenCalled();
	});

	it('a bind:index write scrolls the rail toward that item', async () => {
		const { container, rerender } = render(Carousel, { ...railBase, layout: 'rail', index: 0 });
		const { root } = parts(container);
		root.style.setProperty('--hz-carousel-item-width', '100px');
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '300px';

		const slides = railSlides(container);
		await rerender({ ...railBase, layout: 'rail', index: 2 });
		await vi.waitFor(() => expect(vp.scrollLeft).toBeGreaterThanOrEqual(slides[2].offsetLeft - 1));
	});

	it('the deferred initial settle never touches scrollIntoView when already at the target index (never jacks an ancestor scroll)', async () => {
		// index 0 (the default) is already at scrollLeft 0 pre-mount — the
		// mount-time settle must skip scrollIntoView entirely rather than call
		// it as a harmless-looking no-op: scrollIntoView's default vertical
		// "nearest" can still pull a partly-off-screen ancestor fully into
		// view even when the rail's own horizontal position needs no change.
		const { container } = render(Carousel, { ...railBase, layout: 'rail' });
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '300px';
		const spy = vi.spyOn(railSlides(container)[0], 'scrollIntoView');
		await wait(150); // let the deferred (IntersectionObserver-gated) settle run
		expect(spy).not.toHaveBeenCalled();
		expect(vp.scrollLeft).toBe(0);
	});

	it('a non-zero initial index still scrolls on mount — the already-at-target skip does not swallow genuine navigation', async () => {
		const { container } = render(Carousel, { ...railBase, layout: 'rail', index: 2 });
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '300px';
		const slides = railSlides(container);
		await vi.waitFor(() => expect(vp.scrollLeft).toBeGreaterThanOrEqual(slides[2].offsetLeft - 1));
	});
});

describe('rail ignored props emit dev warnings (R10)', () => {
	it('indicator="dots" renders no dots/status in rail, and warns', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { container } = render(Carousel, { ...base, layout: 'rail', indicator: 'dots' });
		expect(container.querySelector('.hz-carousel-dots')).toBeNull();
		expect(container.querySelector('.hz-carousel-status')).toBeNull();
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('indicator="dots"'));
		warn.mockRestore();
	});

	it('seamless in rail warns and stamps no data-seamless', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { container } = render(Carousel, { ...base, layout: 'rail', loop: true, seamless: true });
		expect(parts(container).root.hasAttribute('data-seamless')).toBe(false);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('seamless'));
		warn.mockRestore();
	});

	it('snap={false} outside rail warns', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(Carousel, { ...base, snap: false });
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('snap={false}'));
		warn.mockRestore();
	});
});

describe('rail mouse drag (R6)', () => {
	it('a mouse drag past the threshold changes the scroll position and toggles data-dragging; suppresses the trailing click', async () => {
		const { container } = render(Carousel, { ...railBase, layout: 'rail' });
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '300px';
		const { track } = parts(container);

		pointer(track, 'pointerdown', 300, 0, 'mouse');
		pointer(track, 'pointermove', 200, 0, 'mouse'); // dx -100 → scroll right
		await tick();
		expect(track.hasAttribute('data-dragging')).toBe(true);
		expect(vp.scrollLeft).toBeGreaterThan(0);

		pointer(track, 'pointerup', 200, 0, 'mouse');
		await tick();
		expect(track.hasAttribute('data-dragging')).toBe(false);

		const dragClick = new MouseEvent('click', { bubbles: true, cancelable: true });
		track.dispatchEvent(dragClick);
		expect(dragClick.defaultPrevented).toBe(true);
	});

	it('a short mouse press does not drag', async () => {
		const { container } = render(Carousel, { ...railBase, layout: 'rail' });
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '300px';
		const { track } = parts(container);
		const before = vp.scrollLeft;
		pointer(track, 'pointerdown', 200, 0, 'mouse');
		pointer(track, 'pointermove', 197, 0, 'mouse'); // dx -3, below the 8px threshold
		pointer(track, 'pointerup', 197, 0, 'mouse');
		await tick();
		expect(track.hasAttribute('data-dragging')).toBe(false);
		expect(vp.scrollLeft).toBe(before);
	});

	it('a touch-type pointer sequence engages no JS drag — native pan only', async () => {
		const { container } = render(Carousel, { ...railBase, layout: 'rail' });
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '300px';
		const { track } = parts(container);
		const before = vp.scrollLeft;
		pointer(track, 'pointerdown', 300); // touch (default pointerType)
		pointer(track, 'pointermove', 200);
		pointer(track, 'pointerup', 200);
		await tick();
		expect(track.hasAttribute('data-dragging')).toBe(false);
		expect(vp.scrollLeft).toBe(before);
	});

	it('draggable={false} suppresses the mouse drag while buttons keep working', async () => {
		const { container } = render(Carousel, { ...railBase, layout: 'rail', draggable: false });
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '300px';
		const { track, next } = parts(container);
		const before = vp.scrollLeft;
		pointer(track, 'pointerdown', 300, 0, 'mouse');
		pointer(track, 'pointermove', 200, 0, 'mouse');
		pointer(track, 'pointerup', 200, 0, 'mouse');
		await tick();
		expect(track.hasAttribute('data-dragging')).toBe(false);
		expect(vp.scrollLeft).toBe(before);

		next.click();
		await vi.waitFor(() => expect(vp.scrollLeft).toBeGreaterThan(before));
	});

	it('a mouse drag starting on the viewport still engages (amended 2026-07-31 — hit-testing over an inert clone card resolves there, not the track)', async () => {
		const { container } = render(Carousel, { ...railBase, layout: 'rail' });
		const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
		vp.style.width = '300px';
		const { track } = parts(container);

		// Dispatched directly on the viewport, not the track — events bubble
		// up, never down, so this only engages if the drag listeners actually
		// live on the viewport (the fix), not merely via bubbling through it.
		pointer(vp, 'pointerdown', 300, 0, 'mouse');
		pointer(vp, 'pointermove', 200, 0, 'mouse');
		await tick();
		expect(track.hasAttribute('data-dragging')).toBe(true);
		expect(vp.scrollLeft).toBeGreaterThan(0);
		pointer(vp, 'pointerup', 200, 0, 'mouse');
	});
});

/**
 * Renders a rail with `railItems` (6), loop, an overflowing size, and waits
 * for the clone buffer to mount — the common starting point for every R7
 * loop/teleport test (and the data-loop hook tests below it).
 */
async function renderOverflowingLoop(
	onchange?: (i: number) => void,
	extraProps: Record<string, unknown> = {}
) {
	// render()'s result is itself thenable — spreading it into a return
	// value and awaiting the call would resolve through *its* `.then`
	// instead of returning this object, so pick fields explicitly.
	const rendered = render(Carousel, {
		...railBase,
		layout: 'rail',
		loop: true,
		// Snap off — these tests validate the JS teleport math against a
		// scroll position set directly; native scroll-snap resolving the
		// position on its own would confound that.
		snap: false,
		...(onchange ? { onchange } : {}),
		...extraProps
	});
	const { container } = rendered;
	const { root } = parts(container);
	root.style.setProperty('--hz-carousel-item-width', '100px');
	const vp = container.querySelector('.hz-carousel-viewport') as HTMLElement;
	vp.style.width = '300px';
	await vi.waitFor(() => expect(container.querySelectorAll('[data-clone]').length).toBe(12));
	return { container, vp };
}

describe('rail loop — clone buffer and teleport (R7)', () => {
	it('mounts exactly 2×count clones, each inert + aria-hidden, real count unaffected, and starts at the first real item', async () => {
		const { container, vp } = await renderOverflowingLoop();
		const clones = Array.from(container.querySelectorAll<HTMLElement>('[data-clone]'));
		expect(clones).toHaveLength(12);
		clones.forEach((c) => {
			expect(c.hasAttribute('inert')).toBe(true);
			expect(c.getAttribute('aria-hidden')).toBe('true');
		});
		expect(railSlides(container)).toHaveLength(6);
		const realFirst = railSlides(container)[0];
		await vi.waitFor(() => expect(vp.scrollLeft).toBe(realFirst.offsetLeft));
	});

	it("the loop rail's initial settle never calls scrollIntoView (amended 2026-07-31 — no ancestor scroll-jack) and still lands exactly at the first real item", async () => {
		const spy = vi.spyOn(Element.prototype, 'scrollIntoView');
		try {
			const { container, vp } = await renderOverflowingLoop();
			const realFirst = railSlides(container)[0];
			await vi.waitFor(() => expect(vp.scrollLeft).toBe(realFirst.offsetLeft));
			expect(spy).not.toHaveBeenCalled();
		} finally {
			spy.mockRestore();
		}
	});

	it('scrolling below the real start teleports forward by one period on the next frame, preserving the sub-period offset, and focus unchanged', async () => {
		const onchange = vi.fn();
		const { container, vp } = await renderOverflowingLoop(onchange);
		const leadClones = Array.from(container.querySelectorAll<HTMLElement>('[data-clone]')).slice(
			0,
			6
		);
		const realFirst = railSlides(container)[0];
		const period = realFirst.offsetLeft - leadClones[0].offsetLeft;
		expect(period).toBeGreaterThan(0);

		const before = document.activeElement;
		const subOffset = 20;
		vp.scrollLeft = realFirst.offsetLeft - subOffset; // just below the real block's start
		fireScroll(vp);

		await vi.waitFor(() =>
			expect(vp.scrollLeft).toBeCloseTo(realFirst.offsetLeft + period - subOffset, 0)
		);
		expect(document.activeElement).toBe(before);
	});

	it('a teleport with no coincident index crossing fires zero onchange calls (R7 invariant)', async () => {
		const onchange = vi.fn();
		// Start already on the last real item, so a small nudge below the real
		// block's start (still nearest that same item once teleported forward
		// by one period) is a pure teleport — no index change to report.
		const lastIndex = railItems.length - 1;
		const { container, vp } = await renderOverflowingLoop(onchange, { index: lastIndex });
		const realSlides = railSlides(container);
		await vi.waitFor(() => expect(vp.scrollLeft).toBe(realSlides[lastIndex].offsetLeft));
		onchange.mockClear();

		const realFirst = realSlides[0];
		const leadClones = Array.from(container.querySelectorAll<HTMLElement>('[data-clone]')).slice(
			0,
			railItems.length
		);
		const period = realFirst.offsetLeft - leadClones[0].offsetLeft;
		const subOffset = 5; // less than one item wide — still nearest the last item after the shift
		const target = realFirst.offsetLeft - subOffset;
		vp.scrollLeft = target;
		fireScroll(vp);

		await vi.waitFor(() => expect(vp.scrollLeft).toBeCloseTo(target + period, 0));
		expect(onchange).not.toHaveBeenCalled();
	});

	it('a long mouse drag crossing the real-block boundary tracks the pointer delta mod one period, never pinning at the scroll max (amended 2026-07-31 — railStartScrollLeft follows each teleport)', async () => {
		const { container, vp } = await renderOverflowingLoop();
		const { track } = parts(container);
		const realFirst = railSlides(container)[0];
		const leadClones = Array.from(container.querySelectorAll<HTMLElement>('[data-clone]')).slice(
			0,
			railItems.length
		);
		const period = realFirst.offsetLeft - leadClones[0].offsetLeft;
		const maxScroll = vp.scrollWidth - vp.clientWidth;
		const startScrollLeft = vp.scrollLeft; // settled at realFirst.offsetLeft

		// A long drag (more than two periods of travel) that crosses the
		// real block's end boundary more than once. Without shifting
		// railStartScrollLeft alongside each teleport, the un-adjusted
		// `railStartScrollLeft - dx` assignment drifts by a full period per
		// crossing and eventually exceeds the real scroll range, pinning at
		// the browser's clamp.
		const startX = 2000;
		const steps = [1900, 1700, 1500, 1300, 1100, 900, 700, 500, 300];
		pointer(track, 'pointerdown', startX, 0, 'mouse');
		for (const x of steps) {
			pointer(track, 'pointermove', x, 0, 'mouse');
			// Let the rAF-throttled scroll handler (teleport correction) run
			// between moves, same as a real multi-frame drag would.
			await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
		}
		const endX = steps[steps.length - 1];
		pointer(track, 'pointerup', endX, 0, 'mouse');
		await tick();

		// Fold the raw (uncorrected) continuous target into the real block's
		// [realFirst, realFirst + period) range — the position a correctly
		// period-tracking drag should land on.
		let expected = startScrollLeft - (endX - startX);
		while (expected < realFirst.offsetLeft) expected += period;
		while (expected >= realFirst.offsetLeft + period) expected -= period;

		expect(vp.scrollLeft).toBeLessThan(maxScroll - 1);
		expect(Math.abs(vp.scrollLeft - expected)).toBeLessThan(50);
	});

	it('with loop and a non-overflowing rail, no clones render, and data-loop stays absent', async () => {
		const cleanup = sizeRailBeforeMount('rail-no-overflow-loop', 20, 1000);
		try {
			const { container } = render(Carousel, {
				...base,
				layout: 'rail',
				loop: true,
				class: 'rail-no-overflow-loop'
			});
			await wait(100);
			expect(container.querySelector('[data-clone]')).toBeNull();
			expect(parts(container).root.hasAttribute('data-loop')).toBe(false);
		} finally {
			cleanup();
		}
	});
});

describe('interactiveClones (R7, amended 2026-08-01)', () => {
	it('drops inert from the loop clones, keeps aria-hidden, and emits no warning for non-focusable content', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			const { container } = await renderOverflowingLoop(undefined, { interactiveClones: true });
			const clones = Array.from(container.querySelectorAll<HTMLElement>('[data-clone]'));
			expect(clones).toHaveLength(12);
			clones.forEach((c) => {
				expect(c.hasAttribute('inert')).toBe(false);
				expect(c.getAttribute('aria-hidden')).toBe('true');
			});
			await tick();
			expect(warn).not.toHaveBeenCalled();
		} finally {
			warn.mockRestore();
		}
	});

	it('warns in dev when a clone contains a focusable element', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			const linkSlide = createRawSnippet<[unknown, number]>((getItem) => ({
				render: () => `<p><a href="/x">${getItem()}</a></p>`
			}));
			await renderOverflowingLoop(undefined, { interactiveClones: true, slide: linkSlide });
			await vi.waitFor(() =>
				expect(warn).toHaveBeenCalledWith(
					expect.stringContaining('interactiveClones'),
					expect.anything()
				)
			);
		} finally {
			warn.mockRestore();
		}
	});

	it('warns outside rail + loop, where no clones exist', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			render(Carousel, { ...base, interactiveClones: true });
			expect(warn).toHaveBeenCalledWith(expect.stringContaining('interactiveClones'));
		} finally {
			warn.mockRestore();
		}
	});
});

describe('data-loop (R1/R12, amended 2026-07-31) — effective-loop root hook', () => {
	it('is present once the loop is effectively active (overflowing rail, clones mounted)', async () => {
		const { container } = await renderOverflowingLoop();
		expect(parts(container).root.hasAttribute('data-loop')).toBe(true);
	});

	it('is absent for a non-loop rail', () => {
		const { container } = render(Carousel, { ...railBase, layout: 'rail' });
		expect(parts(container).root.hasAttribute('data-loop')).toBe(false);
	});

	it('is absent in single mode, loop or not', () => {
		expect(parts(render(Carousel, base).container).root.hasAttribute('data-loop')).toBe(false);
		expect(
			parts(render(Carousel, { ...base, loop: true }).container).root.hasAttribute('data-loop')
		).toBe(false);
	});

	// A computed scrollbar-width assertion is skipped here: the hide/show rule
	// lives in the reference theme (carousel.css), which this component spec
	// file never loads (no global theme import in this project's browser
	// suite) — asserting on it here would fail regardless of correctness, not
	// flake. The data-loop attribute is the contract this suite can hold.
});

describe('barrel export', () => {
	it('Carousel is resolvable from $lib', async () => {
		const { Carousel: C } = await import('$lib');
		expect(C).toBeDefined();
	});
});
