import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet, mount, unmount } from 'svelte';
import Lightbox from './Lightbox.svelte';
import Image from './Image.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const base = { src: '/img/full.jpg', alt: 'A disc in flight' };

const customTrigger = createRawSnippet(() => ({
	render: () => `<span data-testid="custom-trigger">open me</span>`
}));

// A per-item trigger face: renders the item's name and its index so tests can
// assert both the value and document order (Lightbox-R5).
const namedIndexTrigger = createRawSnippet<[unknown, number]>((getItem, getIndex) => ({
	render: () => {
		const item = getItem() as { alt?: string; label?: string };
		const name = item.alt ?? item.label ?? '';
		return `<span data-testid="trigger-face">${name}::${getIndex()}</span>`;
	}
}));

// A marker face used to prove `trigger` is never invoked when `children`
// also wins (Lightbox-R6).
const markedTrigger = createRawSnippet<[unknown, number]>(() => ({
	render: () => `<span data-testid="trigger-marker">trigger face</span>`
}));

// An `<Image>`-composed face, imperatively mounted into the raw snippet's
// root node — mirrors the docs' `<Image aspectRatio rounded alt="">` face
// (Lightbox-R30-shape).
const imageFaceTrigger = createRawSnippet<[unknown, number]>(() => ({
	render: () => `<span class="image-face-slot"></span>`,
	setup: (element) => {
		const instance = mount(Image, {
			target: element as HTMLElement,
			props: { src: '/img/face.jpg', alt: '', aspectRatio: '1/1' as const, rounded: 'md' as const }
		});
		return () => unmount(instance);
	}
}));

function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

function getParts(container: HTMLElement) {
	return {
		trigger: container.querySelector('.hz-lightbox-trigger') as HTMLButtonElement,
		dialog: container.querySelector('dialog.hz-lightbox') as HTMLDialogElement
	};
}

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

describe('trigger', () => {
	it('renders a type="button" trigger with aria-haspopup="dialog"', () => {
		const { container } = render(Lightbox, base);
		const { trigger } = getParts(container);
		expect(trigger).not.toBeNull();
		expect(trigger.getAttribute('type')).toBe('button');
		expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
	});

	it('default accessible name is "View larger: {alt}"; triggerLabel overrides', () => {
		const { container } = render(Lightbox, base);
		expect(getParts(container).trigger.getAttribute('aria-label')).toBe(
			'View larger: A disc in flight'
		);
		const { container: c2 } = render(Lightbox, { ...base, triggerLabel: 'Zoom in' });
		expect(getParts(c2).trigger.getAttribute('aria-label')).toBe('Zoom in');
	});

	it('default trigger content is a thumbnail img using src', () => {
		const { container } = render(Lightbox, base);
		const thumb = container.querySelector('.hz-lightbox-thumb') as HTMLImageElement;
		expect(thumb.getAttribute('src')).toBe('/img/full.jpg');
		expect(thumb.getAttribute('alt')).toBe('A disc in flight');
	});

	it('thumbSrc replaces the thumbnail source; the dialog keeps the full src', () => {
		const { container } = render(Lightbox, { ...base, thumbSrc: '/img/thumb.jpg' });
		const thumb = container.querySelector('.hz-lightbox-thumb') as HTMLImageElement;
		expect(thumb.getAttribute('src')).toBe('/img/thumb.jpg');
		// R15 (sanctioned): `.hz-lightbox-img` is now Image's wrapper box — the
		// bitmap is `.hz-lightbox-img .hz-image__img`.
		const full = container.querySelector('.hz-lightbox-img .hz-image__img') as HTMLImageElement;
		expect(full.getAttribute('src')).toBe('/img/full.jpg');
	});

	it('children snippet replaces the default thumbnail', () => {
		const { container } = render(Lightbox, { ...base, children: customTrigger });
		expect(container.querySelector('[data-testid="custom-trigger"]')).not.toBeNull();
		expect(container.querySelector('.hz-lightbox-thumb')).toBeNull();
	});

	it('class is merged after hz-lightbox-triggers; rest forwards to the strip wrapper', () => {
		const { container } = render(Lightbox, {
			...base,
			class: 'gallery-item',
			'data-testid': 'lb'
		} as Record<string, unknown>);
		const strip = container.querySelector('.hz-lightbox-triggers') as HTMLElement;
		expect(strip.classList.contains('gallery-item')).toBe(true);
		expect(strip.getAttribute('data-testid')).toBe('lb');
	});
});

// ---------------------------------------------------------------------------
// Dialog semantics
// ---------------------------------------------------------------------------

describe('dialog', () => {
	it('is always rendered, closed by default, labelled by alt', () => {
		const { container } = render(Lightbox, base);
		const { dialog } = getParts(container);
		expect(dialog).not.toBeNull();
		expect(dialog.open).toBe(false);
		expect(dialog.getAttribute('data-state')).toBe('closed');
		expect(dialog.getAttribute('aria-modal')).toBe('true');
		expect(dialog.getAttribute('aria-label')).toBe('A disc in flight');
	});

	it('shows the full image with alt inside a figure', () => {
		const { container } = render(Lightbox, base);
		// R15 (sanctioned): `.hz-lightbox-img` is now Image's wrapper box — the
		// bitmap is `.hz-lightbox-img .hz-image__img`.
		const img = container.querySelector(
			'figure .hz-lightbox-img .hz-image__img'
		) as HTMLImageElement;
		expect(img.getAttribute('src')).toBe('/img/full.jpg');
		expect(img.getAttribute('alt')).toBe('A disc in flight');
	});

	it('caption renders as a figcaption; absent without the prop', () => {
		const { container } = render(Lightbox, { ...base, caption: 'Hole 7, sunset round' });
		expect(container.querySelector('figcaption')?.textContent?.trim()).toBe('Hole 7, sunset round');
		const { container: c2 } = render(Lightbox, base);
		expect(c2.querySelector('figcaption')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Image rendering via Image (Lightbox-R15) — [NEW]: the viewer renders image
// items through the library's own `Image` component instead of a raw <img>.
// ---------------------------------------------------------------------------

describe('image rendering via Image (R15)', () => {
	// A large intrinsic size so the max-width/max-height envelope actually
	// engages (a tiny image would render well under the cap either way).
	const LARGE_IMAGE_URI =
		"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4000' height='3000'%3E%3Crect width='4000' height='3000' fill='%232563eb'/%3E%3C/svg%3E";

	it('renders the image item through <Image> with fit="contain" and eager loading', () => {
		const { container } = render(Lightbox, base);
		const wrapper = container.querySelector('.hz-lightbox-img') as HTMLElement;
		expect(wrapper.classList.contains('hz-image')).toBe(true);
		expect(wrapper.getAttribute('data-fit')).toBe('contain');
		const img = wrapper.querySelector('.hz-image__img') as HTMLImageElement;
		expect(img).not.toBeNull();
		expect(img.getAttribute('loading')).toBe('eager');
		expect(img.getAttribute('src')).toBe('/img/full.jpg');
		expect(img.getAttribute('alt')).toBe('A disc in flight');
	});

	it('gets a blur-up placeholder from thumbSrc when set; none when absent', () => {
		const { container: withThumb } = render(Lightbox, { ...base, thumbSrc: '/img/thumb.jpg' });
		const wrapperWithThumb = withThumb.querySelector('.hz-lightbox-img') as HTMLElement;
		expect(wrapperWithThumb.getAttribute('data-placeholder')).toBe('blur');
		const placeholder = wrapperWithThumb.querySelector(
			'.hz-image__placeholder'
		) as HTMLImageElement;
		expect(placeholder).not.toBeNull();
		expect(placeholder.getAttribute('src')).toBe('/img/thumb.jpg');
		expect(placeholder.getAttribute('aria-hidden')).toBe('true');

		const { container: withoutThumb } = render(Lightbox, base);
		const wrapperWithoutThumb = withoutThumb.querySelector('.hz-lightbox-img') as HTMLElement;
		expect(wrapperWithoutThumb.hasAttribute('data-placeholder')).toBe(false);
		expect(wrapperWithoutThumb.querySelector('.hz-image__placeholder')).toBeNull();
	});

	it('shows a load-state affordance — loaded on the load event', async () => {
		const { container } = render(Lightbox, base);
		const wrapper = container.querySelector('.hz-lightbox-img') as HTMLElement;
		const img = wrapper.querySelector('.hz-image__img') as HTMLImageElement;
		expect(['loading', 'loaded', 'error']).toContain(wrapper.getAttribute('data-state'));
		img.dispatchEvent(new Event('load'));
		await tick();
		expect(wrapper.getAttribute('data-state')).toBe('loaded');
	});

	it('shows an error state (data-state="error") rather than a broken raw <img> on failure', async () => {
		const { container } = render(Lightbox, base);
		const wrapper = container.querySelector('.hz-lightbox-img') as HTMLElement;
		const img = wrapper.querySelector('.hz-image__img') as HTMLImageElement;
		img.dispatchEvent(new Event('error'));
		await tick();
		expect(wrapper.getAttribute('data-state')).toBe('error');
	});

	it('the Image wrapper resolves a definite, capped size inside the shrink-wrapped dialog — no crop', async () => {
		const { container } = render(Lightbox, { src: LARGE_IMAGE_URI, alt: 'Large demo image' });
		const { trigger, dialog } = getParts(container);
		trigger.click();
		await tick();
		const wrapper = container.querySelector('.hz-lightbox-img') as HTMLElement;
		const img = wrapper.querySelector('.hz-image__img') as HTMLImageElement;
		// The dialog's shrink-wrap depends on the bitmap's decoded intrinsic
		// size — wait for it rather than racing the decode.
		if (!img.complete || img.naturalWidth === 0) {
			await new Promise<void>((resolve) =>
				img.addEventListener('load', () => resolve(), { once: true })
			);
			await tick();
		}
		const rect = wrapper.getBoundingClientRect();
		// Resolves a real, non-zero box — not collapsed by Image's own
		// `width: 100%` inside the shrink-wrapped (width/height: fit-content)
		// dialog.
		expect(rect.width).toBeGreaterThan(0);
		expect(rect.height).toBeGreaterThan(0);
		// Capped within the viewport envelope — min(92vw, 100%) x 80dvh.
		expect(rect.width).toBeLessThanOrEqual(window.innerWidth * 0.92 + 2);
		expect(rect.height).toBeLessThanOrEqual(window.innerHeight * 0.8 + 2);
		// Aspect ratio preserved (no crop) — the 4000x3000 source scales down
		// uniformly rather than being stretched or cropped to fill the box.
		expect(rect.width / rect.height).toBeCloseTo(4000 / 3000, 1);
		dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
		await tick();
	});
});

// ---------------------------------------------------------------------------
// Open / close flows
// ---------------------------------------------------------------------------

describe('open and close', () => {
	it('clicking the trigger opens the dialog and locks body scroll', async () => {
		const { container } = render(Lightbox, base);
		const { trigger, dialog } = getParts(container);
		trigger.click();
		await tick();
		expect(dialog.open).toBe(true);
		expect(dialog.getAttribute('data-state')).toBe('open');
		expect(document.body.style.overflow).toBe('hidden');
		// clean up for following tests
		dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
		await tick();
	});

	it('Escape (native cancel) closes; scroll is restored', async () => {
		const { container } = render(Lightbox, base);
		const { trigger, dialog } = getParts(container);
		trigger.click();
		await tick();
		dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
		await tick();
		expect(dialog.open).toBe(false);
		expect(document.body.style.overflow).toBe('');
	});

	it('clicking the backdrop (the dialog itself) closes', async () => {
		const { container } = render(Lightbox, base);
		const { trigger, dialog } = getParts(container);
		trigger.click();
		await tick();
		dialog.click(); // target === dialog ⇒ backdrop
		await tick();
		expect(dialog.open).toBe(false);
	});

	it('clicking the image does NOT close', async () => {
		const { container } = render(Lightbox, base);
		const { trigger, dialog } = getParts(container);
		trigger.click();
		await tick();
		(container.querySelector('.hz-lightbox-img') as HTMLElement).click();
		await tick();
		expect(dialog.open).toBe(true);
		dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
		await tick();
	});

	it('the close button closes, fires onclose once, and focus returns to the trigger', async () => {
		const onclose = vi.fn();
		const { container } = render(Lightbox, { ...base, onclose });
		const { trigger, dialog } = getParts(container);
		trigger.click();
		await tick();
		(container.querySelector('.hz-lightbox-close') as HTMLButtonElement).click();
		await tick();
		expect(dialog.open).toBe(false);
		expect(onclose).toHaveBeenCalledTimes(1);
		expect(document.activeElement).toBe(trigger);
	});

	it('the close button carries the (customizable) closeLabel', () => {
		const { container } = render(Lightbox, { ...base, closeLabel: 'Dismiss' });
		expect(
			(container.querySelector('.hz-lightbox-close') as HTMLElement).getAttribute('aria-label')
		).toBe('Dismiss');
	});
});

// ---------------------------------------------------------------------------
// Barrel export
// ---------------------------------------------------------------------------

describe('barrel export', () => {
	it('Lightbox is resolvable from $lib', async () => {
		const { Lightbox: L } = await import('$lib');
		expect(L).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// Multi-item mode (items + carousel)
// ---------------------------------------------------------------------------

describe('multi-item mode', () => {
	const items = [
		{ src: '/img/one.jpg', alt: 'First photo' },
		{ src: '/img/two.jpg', alt: 'Second photo', caption: 'Second caption' },
		{
			type: 'video' as const,
			src: '/video/clip.mp4',
			label: 'Flight video',
			poster: '/img/poster.jpg'
		}
	];

	function openViewer(container: HTMLElement, at = 0): HTMLDialogElement {
		const triggers = container.querySelectorAll<HTMLButtonElement>('.hz-lightbox-trigger');
		triggers[at].click();
		return container.querySelector('dialog.hz-lightbox') as HTMLDialogElement;
	}

	async function closeViewer(dialog: HTMLDialogElement) {
		dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
		await tick();
	}

	it('renders one labelled trigger per item in the strip', () => {
		const { container } = render(Lightbox, { items });
		const triggers = Array.from(container.querySelectorAll('.hz-lightbox-trigger'));
		expect(triggers).toHaveLength(3);
		expect(triggers[0].getAttribute('aria-label')).toBe('View larger: First photo');
		expect(triggers[2].getAttribute('aria-label')).toBe('View larger: Flight video');
	});

	it('video triggers use the poster thumb and show the play badge', () => {
		const { container } = render(Lightbox, { items });
		const videoTrigger = container.querySelectorAll('.hz-lightbox-trigger')[2];
		expect(videoTrigger.querySelector('img')?.getAttribute('src')).toBe('/img/poster.jpg');
		expect(videoTrigger.querySelector('.hz-lightbox-badge')).not.toBeNull();
	});

	it('a poster-less video trigger falls back to a labeled chip', () => {
		const { container } = render(Lightbox, {
			items: [{ type: 'video' as const, src: '/video/clip.mp4', label: 'No poster' }]
		});
		const trigger = container.querySelector('.hz-lightbox-trigger') as HTMLElement;
		expect(trigger.querySelector('img')).toBeNull();
		expect(trigger.querySelector('.hz-lightbox-thumb-label')?.textContent?.trim()).toBe(
			'No poster'
		);
	});

	it('multi-item dialog is labelled by dialogLabel and contains a carousel', async () => {
		const { container } = render(Lightbox, { items });
		const dialog = openViewer(container);
		await tick();
		expect(dialog.getAttribute('aria-label')).toBe('Media viewer');
		expect(dialog.querySelector('.hz-carousel')).not.toBeNull();
		await closeViewer(dialog);
	});

	it('clicking the second thumbnail opens with the second slide active', async () => {
		const { container } = render(Lightbox, { items });
		const dialog = openViewer(container, 1);
		await tick();
		const slides = Array.from(dialog.querySelectorAll<HTMLElement>('.hz-carousel-slide'));
		expect(slides[1].hidden).toBe(false);
		expect(slides[0].hidden).toBe(true);
		await closeViewer(dialog);
	});

	it('the next control advances; loop wraps from the last back to the first', async () => {
		const { container } = render(Lightbox, { items });
		const dialog = openViewer(container, 2);
		await tick();
		(dialog.querySelector('.hz-carousel-next') as HTMLButtonElement).click();
		await tick();
		const slides = Array.from(dialog.querySelectorAll<HTMLElement>('.hz-carousel-slide'));
		expect(slides[0].hidden).toBe(false); // wrapped 3rd → 1st
		await closeViewer(dialog);
	});

	it('ArrowRight anywhere in the dialog advances the viewer', async () => {
		const { container } = render(Lightbox, { items });
		const dialog = openViewer(container);
		await tick();
		dialog.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
		);
		await tick();
		const slides = Array.from(dialog.querySelectorAll<HTMLElement>('.hz-carousel-slide'));
		expect(slides[1].hidden).toBe(false);
		await closeViewer(dialog);
	});

	it('a video slide renders the Video player, not an img', async () => {
		const { container } = render(Lightbox, { items });
		const dialog = openViewer(container, 2);
		await tick();
		const activeSlide = Array.from(dialog.querySelectorAll<HTMLElement>('.hz-carousel-slide')).find(
			(s) => !s.hidden
		) as HTMLElement;
		expect(
			activeSlide.querySelector('.hz-lightbox-video video, .hz-lightbox-video iframe')
		).not.toBeNull();
		expect(activeSlide.querySelector('.hz-lightbox-img')).toBeNull();
		await closeViewer(dialog);
	});

	it('focus returns to the trigger that opened the viewer', async () => {
		const { container } = render(Lightbox, { items });
		const triggers = container.querySelectorAll<HTMLButtonElement>('.hz-lightbox-trigger');
		const dialog = openViewer(container, 1);
		await tick();
		await closeViewer(dialog);
		expect(document.activeElement).toBe(triggers[1]);
	});
});

// ---------------------------------------------------------------------------
// trigger snippet (Lightbox-R2/R5–R7) — additive, does not touch the
// describe blocks above.
// ---------------------------------------------------------------------------

describe('trigger snippet', () => {
	const triggerItems = [
		{ src: '/img/one.jpg', alt: 'First photo' },
		{ src: '/img/two.jpg', alt: 'Second photo' },
		{ src: '/img/three.jpg', alt: 'Third photo' }
	];

	function openViewer(container: HTMLElement, at = 0): HTMLDialogElement {
		const triggers = container.querySelectorAll<HTMLButtonElement>('.hz-lightbox-trigger');
		triggers[at].click();
		return container.querySelector('dialog.hz-lightbox') as HTMLDialogElement;
	}

	async function closeViewer(dialog: HTMLDialogElement) {
		dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
		await tick();
	}

	it('receives each item and its zero-based index (R5)', () => {
		const { container } = render(Lightbox, { items: triggerItems, trigger: namedIndexTrigger });
		const faces = Array.from(container.querySelectorAll('[data-testid="trigger-face"]'));
		expect(faces.map((f) => f.textContent?.trim())).toEqual([
			'First photo::0',
			'Second photo::1',
			'Third photo::2'
		]);
	});

	it('preserves button type/aria-haspopup/aria-label; the default thumb is absent (R5/R7)', () => {
		const { container } = render(Lightbox, { items: triggerItems, trigger: namedIndexTrigger });
		const triggers = Array.from(
			container.querySelectorAll<HTMLButtonElement>('.hz-lightbox-trigger')
		);
		expect(triggers).toHaveLength(3);
		for (const [i, t] of triggers.entries()) {
			expect(t.getAttribute('type')).toBe('button');
			expect(t.getAttribute('aria-haspopup')).toBe('dialog');
			expect(t.getAttribute('aria-label')).toBe(`View larger: ${triggerItems[i].alt}`);
		}
		expect(container.querySelector('.hz-lightbox-thumb')).toBeNull();
	});

	it('clicking a trigger-faced button opens the viewer at that index and returns focus on close (R5)', async () => {
		const { container } = render(Lightbox, { items: triggerItems, trigger: namedIndexTrigger });
		const triggers = container.querySelectorAll<HTMLButtonElement>('.hz-lightbox-trigger');
		const dialog = openViewer(container, 1);
		await tick();
		const slides = Array.from(dialog.querySelectorAll<HTMLElement>('.hz-carousel-slide'));
		expect(slides[1].hidden).toBe(false);
		expect(slides[0].hidden).toBe(true);
		await closeViewer(dialog);
		expect(document.activeElement).toBe(triggers[1]);
	});

	it('an Image-composed face renders its aspect wrapper inside the button; aria-label still names the item (R30-shape/R7)', () => {
		const { container } = render(Lightbox, { items: triggerItems, trigger: imageFaceTrigger });
		const trigger = container.querySelector('.hz-lightbox-trigger') as HTMLButtonElement;
		const face = trigger.querySelector('.hz-image');
		expect(face).not.toBeNull();
		expect(face?.getAttribute('data-aspect-ratio')).toBe('1/1');
		expect(face?.getAttribute('data-rounded')).toBe('md');
		expect(trigger.getAttribute('aria-label')).toBe('View larger: First photo');
	});

	it('applies to the single-image sugar item and opens the single-media viewer (R2/R5)', async () => {
		const { container } = render(Lightbox, { ...base, trigger: namedIndexTrigger });
		const triggers = container.querySelectorAll<HTMLButtonElement>('.hz-lightbox-trigger');
		expect(triggers).toHaveLength(1);
		expect(container.querySelector('[data-testid="trigger-face"]')?.textContent?.trim()).toBe(
			'A disc in flight::0'
		);
		const dialog = openViewer(container);
		await tick();
		expect(dialog.querySelector('.hz-lightbox-img')).not.toBeNull();
		expect(dialog.querySelector('.hz-carousel')).toBeNull();
		await closeViewer(dialog);
	});

	it('children wins over trigger: the trigger face is never invoked, and DEV warns (R6)', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { container } = render(Lightbox, {
			...base,
			children: customTrigger,
			trigger: markedTrigger
		});
		expect(container.querySelector('[data-testid="custom-trigger"]')).not.toBeNull();
		expect(container.querySelector('[data-testid="trigger-marker"]')).toBeNull();
		expect(container.querySelector('.hz-lightbox-triggers')).toBeNull();
		expect(container.querySelectorAll('.hz-lightbox-trigger')).toHaveLength(1);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('`trigger` is ignored'));
		warnSpy.mockRestore();
	});

	it('replaces the whole face for a video item — no play badge; the viewer still plays the video (R5)', async () => {
		const videoItems = [
			...triggerItems,
			{
				type: 'video' as const,
				src: '/video/clip.mp4',
				label: 'Flight video',
				poster: '/img/poster.jpg'
			}
		];
		const { container } = render(Lightbox, { items: videoItems, trigger: namedIndexTrigger });
		const videoTrigger = container.querySelectorAll('.hz-lightbox-trigger')[3];
		expect(videoTrigger.querySelector('.hz-lightbox-badge')).toBeNull();
		expect(videoTrigger.querySelector('[data-testid="trigger-face"]')?.textContent?.trim()).toBe(
			'Flight video::3'
		);
		const dialog = openViewer(container, 3);
		await tick();
		const activeSlide = Array.from(dialog.querySelectorAll<HTMLElement>('.hz-carousel-slide')).find(
			(s) => !s.hidden
		) as HTMLElement;
		expect(
			activeSlide.querySelector('.hz-lightbox-video video, .hz-lightbox-video iframe')
		).not.toBeNull();
		expect(activeSlide.querySelector('.hz-lightbox-img')).toBeNull();
		await closeViewer(dialog);
	});
});
