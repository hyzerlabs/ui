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
		slides: Array.from(container.querySelectorAll<HTMLElement>('.hz-carousel-slide')),
		prev: container.querySelector('.hz-carousel-prev') as HTMLButtonElement,
		next: container.querySelector('.hz-carousel-next') as HTMLButtonElement,
		status: container.querySelector('.hz-carousel-status') as HTMLElement
	};
}

function visibleText(container: HTMLElement): string {
	const active = Array.from(
		container.querySelectorAll<HTMLElement>('.hz-carousel-slide')
	).find((s) => !s.hidden);
	return active?.textContent?.trim() ?? '';
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

	it('only the active slide is visible; the rest are hidden', () => {
		const { container } = render(Carousel, base);
		const { slides } = parts(container);
		expect(slides[0].hidden).toBe(false);
		expect(slides[0].hasAttribute('data-active')).toBe(true);
		expect(slides[1].hidden).toBe(true);
		expect(slides[2].hidden).toBe(true);
		expect(visibleText(container)).toBe('alpha');
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
		expect(prev.disabled).toBe(true);
		next.click();
		await tick();
		next.click();
		await tick();
		expect(parts(container).next.disabled).toBe(true);
		expect(parts(container).prev.disabled).toBe(false);
	});

	it('with loop, navigation wraps in both directions and nothing disables', async () => {
		const { container } = render(Carousel, { ...base, loop: true });
		const { prev } = parts(container);
		expect(prev.disabled).toBe(false);
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
// Barrel export
// ---------------------------------------------------------------------------

describe('barrel export', () => {
	it('Carousel is resolvable from $lib', async () => {
		const { Carousel: C } = await import('$lib');
		expect(C).toBeDefined();
	});
});
