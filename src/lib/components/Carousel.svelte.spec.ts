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
	y = 0
) {
	el.dispatchEvent(
		new PointerEvent(type, {
			pointerId: 1,
			pointerType: 'touch',
			button: 0,
			clientX: x,
			clientY: y,
			bubbles: true,
			cancelable: true
		})
	);
}

function wait(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// APG structure
// ---------------------------------------------------------------------------

describe('structure', () => {
	it('root is a labelled group with aria-roledescription="carousel"', () => {
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

	it('dots: one labelled button per slide, aria-current on the active one, no counter', () => {
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

describe('barrel export', () => {
	it('Carousel is resolvable from $lib', async () => {
		const { Carousel: C } = await import('$lib');
		expect(C).toBeDefined();
	});
});
