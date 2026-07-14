import { describe, expect, it, afterEach } from 'vitest';
import { lightboxGroup } from './lightboxGroup.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wait one event-loop turn so Svelte effects settle (mirrors Lightbox.svelte.spec.ts). */
function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

/** The attachment is a plain `(node) => cleanup` function — tests drive it directly. */
function makeContainer(html: string): HTMLElement {
	const el = document.createElement('div');
	el.innerHTML = html;
	document.body.appendChild(el);
	return el;
}

async function closeOverlay(dialog: HTMLDialogElement) {
	dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
	await tick();
}

function getDialog(): HTMLDialogElement | null {
	return document.body.querySelector('dialog.hz-lightbox');
}

// Defensive net: force-clear any leftover overlay/scroll-lock/container state
// between tests, in case an assertion fails mid-test before its own cleanup.
afterEach(() => {
	document.body.querySelectorAll('dialog.hz-lightbox').forEach((el) => el.remove());
	document.body
		.querySelectorAll('[data-lightbox-group-test-container]')
		.forEach((el) => el.remove());
	document.body.style.overflow = '';
});

function markContainer(el: HTMLElement): HTMLElement {
	el.setAttribute('data-lightbox-group-test-container', '');
	return el;
}

// ---------------------------------------------------------------------------
// Enhancement (Lightbox-R19)
// ---------------------------------------------------------------------------

describe('enhancement (R19)', () => {
	it('sets tabindex, role, aria-label, and data-lightbox-trigger on each qualifying element', () => {
		const container = markContainer(
			makeContainer(`
				<img id="img1" src="/a.jpg" alt="First photo" />
				<video id="vid1" src="/a.mp4"></video>
			`)
		);
		const cleanup = lightboxGroup()(container);
		const img = container.querySelector('#img1') as HTMLImageElement;
		const video = container.querySelector('#vid1') as HTMLVideoElement;

		expect(img.getAttribute('tabindex')).toBe('0');
		expect(img.getAttribute('role')).toBe('button');
		expect(img.getAttribute('aria-label')).toBe('View larger: First photo');
		expect(img.hasAttribute('data-lightbox-trigger')).toBe(true);
		expect(video.getAttribute('tabindex')).toBe('0');
		expect(video.getAttribute('role')).toBe('button');
		expect(video.hasAttribute('data-lightbox-trigger')).toBe(true);

		cleanup();
		container.remove();
	});

	it('an empty alt produces aria-label "View larger" with no dangling colon', () => {
		const container = markContainer(makeContainer(`<img id="img1" src="/a.jpg" alt="" />`));
		const cleanup = lightboxGroup()(container);
		const img = container.querySelector('#img1') as HTMLImageElement;

		expect(img.getAttribute('aria-label')).toBe('View larger');

		cleanup();
		container.remove();
	});
});

// ---------------------------------------------------------------------------
// Exclusions (Lightbox-R18)
// ---------------------------------------------------------------------------

describe('exclusions (R18)', () => {
	it('data-lightbox-ignore is not enhanced and never opens the overlay', async () => {
		const container = markContainer(
			makeContainer(`<img id="img1" src="/a.jpg" alt="Ignored" data-lightbox-ignore />`)
		);
		const cleanup = lightboxGroup()(container);
		const img = container.querySelector('#img1') as HTMLImageElement;

		expect(img.hasAttribute('tabindex')).toBe(false);
		img.click();
		await tick();
		expect(getDialog()).toBeNull();

		cleanup();
		container.remove();
	});

	it('an img inside an <a> is not enhanced; the link keeps its own behavior', () => {
		const container = markContainer(
			makeContainer(`<a href="#nowhere"><img id="img1" src="/a.jpg" alt="Linked" /></a>`)
		);
		const cleanup = lightboxGroup()(container);
		const img = container.querySelector('#img1') as HTMLImageElement;

		expect(img.hasAttribute('tabindex')).toBe(false);
		expect(img.hasAttribute('data-lightbox-trigger')).toBe(false);

		cleanup();
		container.remove();
	});

	it('an img inside a <button> is not enhanced', () => {
		const container = markContainer(
			makeContainer(`<button type="button"><img id="img1" src="/a.jpg" alt="Buttoned" /></button>`)
		);
		const cleanup = lightboxGroup()(container);
		const img = container.querySelector('#img1') as HTMLImageElement;

		expect(img.hasAttribute('tabindex')).toBe(false);

		cleanup();
		container.remove();
	});

	it('aria-hidden media is neither enhanced nor in the item set (R18 amended)', async () => {
		// Image-like structure: a decorative aria-hidden placeholder img next to
		// the real img (how Image's blur placeholder renders). Only the real
		// image is enhanced; the viewer contains exactly one item.
		const container = markContainer(
			makeContainer(`
				<div class="fake-image-wrapper">
					<img id="placeholder" src="/tiny.jpg" alt="" aria-hidden="true" />
					<img id="real" src="/a.jpg" alt="Real photo" />
				</div>
				<div aria-hidden="true"><img id="wrapped" src="/b.jpg" alt="Wrapped" /></div>
			`)
		);
		const cleanup = lightboxGroup()(container);
		const placeholder = container.querySelector('#placeholder') as HTMLImageElement;
		const wrapped = container.querySelector('#wrapped') as HTMLImageElement;
		const real = container.querySelector('#real') as HTMLImageElement;

		expect(placeholder.hasAttribute('tabindex')).toBe(false);
		expect(placeholder.hasAttribute('data-lightbox-trigger')).toBe(false);
		expect(wrapped.hasAttribute('tabindex')).toBe(false);
		expect(real.hasAttribute('data-lightbox-trigger')).toBe(true);

		real.click();
		await tick();
		const dialog = getDialog() as HTMLDialogElement;
		// Single item → single-media rendering, no carousel of duplicates.
		expect(dialog.querySelectorAll('.hz-carousel-slide').length).toBe(0);
		// R15/R20 (sanctioned): `.hz-lightbox-img` is now Image's wrapper box —
		// the bitmap is `.hz-lightbox-img .hz-image__img`.
		expect(
			(dialog.querySelector('.hz-lightbox-img .hz-image__img') as HTMLImageElement).src
		).toContain('/a.jpg');
		await closeOverlay(dialog);

		cleanup();
		container.remove();
	});

	it('a hidden element is enhanced but excluded from the activation-time item set (R18 amended)', async () => {
		// Media commonly mounts inside a hidden region (an inactive Tabs panel):
		// it must be enhanced up front, but never join the viewer while hidden.
		const container = markContainer(
			makeContainer(`
				<img id="img1" src="/a.jpg" alt="Visible" />
				<div id="panel" hidden><img id="img2" src="/b.jpg" alt="Hidden panel photo" /></div>
			`)
		);
		const cleanup = lightboxGroup()(container);
		const hiddenImg = container.querySelector('#img2') as HTMLImageElement;

		// Enhanced despite being hidden at attach time…
		expect(hiddenImg.getAttribute('tabindex')).toBe('0');
		expect(hiddenImg.hasAttribute('data-lightbox-trigger')).toBe(true);

		// …but the shared viewer only contains the rendered image.
		(container.querySelector('#img1') as HTMLImageElement).click();
		await tick();
		let dialog = getDialog() as HTMLDialogElement;
		expect(dialog.querySelectorAll('.hz-carousel-slide').length).toBe(0); // single item → no carousel
		// R15/R20 (sanctioned): `.hz-lightbox-img` is now Image's wrapper box —
		// the bitmap is `.hz-lightbox-img .hz-image__img`.
		expect(
			(dialog.querySelector('.hz-lightbox-img .hz-image__img') as HTMLImageElement).src
		).toContain('/a.jpg');
		await closeOverlay(dialog);

		// Once revealed, the same element joins the group without a re-run.
		(container.querySelector('#panel') as HTMLElement).hidden = false;
		hiddenImg.click();
		await tick();
		dialog = getDialog() as HTMLDialogElement;
		expect(dialog.querySelectorAll('.hz-carousel-slide').length).toBe(2);
		await closeOverlay(dialog);

		cleanup();
		container.remove();
	});

	it('a display:none element (zero client rects) is enhanced but never joins the viewer', async () => {
		const container = markContainer(
			makeContainer(`
				<img id="img1" src="/a.jpg" alt="Visible" />
				<img id="img2" src="/b.jpg" alt="None" style="display:none" />
			`)
		);
		const cleanup = lightboxGroup()(container);
		const noneImg = container.querySelector('#img2') as HTMLImageElement;

		expect(noneImg.getAttribute('tabindex')).toBe('0');
		expect(noneImg.hasAttribute('data-lightbox-trigger')).toBe(true);

		(container.querySelector('#img1') as HTMLImageElement).click();
		await tick();
		const dialog = getDialog() as HTMLDialogElement;
		// R15/R20 (sanctioned): `.hz-lightbox-img` is now Image's wrapper box —
		// the bitmap is `.hz-lightbox-img .hz-image__img`.
		expect(
			(dialog.querySelector('.hz-lightbox-img .hz-image__img') as HTMLImageElement).src
		).toContain('/a.jpg');
		expect(dialog.querySelectorAll('.hz-carousel-slide').length).toBe(0);
		await closeOverlay(dialog);

		cleanup();
		container.remove();
	});

	it('the <picture> wrapper is never a trigger — only its inner <img>', () => {
		const container = markContainer(
			makeContainer(`
				<picture id="pic1">
					<source srcset="/a.webp" type="image/webp" />
					<img id="img1" src="/a.jpg" alt="In picture" />
				</picture>
			`)
		);
		const cleanup = lightboxGroup()(container);
		const picture = container.querySelector('#pic1') as HTMLElement;
		const img = container.querySelector('#img1') as HTMLImageElement;

		expect(picture.hasAttribute('data-lightbox-trigger')).toBe(false);
		expect(img.hasAttribute('data-lightbox-trigger')).toBe(true);

		cleanup();
		container.remove();
	});
});

// ---------------------------------------------------------------------------
// Pointer open (Lightbox-R22/R24)
// ---------------------------------------------------------------------------

describe('pointer open (R22/R24)', () => {
	it('clicking a trigger mounts an open dialog.hz-lightbox into document.body and locks scroll', async () => {
		const container = markContainer(makeContainer(`<img id="img1" src="/a.jpg" alt="One" />`));
		const cleanup = lightboxGroup()(container);
		const img = container.querySelector('#img1') as HTMLImageElement;

		img.click();
		await tick();
		const dialog = getDialog();

		expect(dialog).not.toBeNull();
		expect(dialog!.open).toBe(true);
		expect(dialog!.getAttribute('data-state')).toBe('open');
		expect(document.body.style.overflow).toBe('hidden');

		await closeOverlay(dialog!);
		cleanup();
		container.remove();
	});

	it('the item set is every qualifying media in document order; clicking the 2nd of 3 starts at index 1', async () => {
		const container = markContainer(
			makeContainer(`
				<img id="img1" src="/a.jpg" alt="First" />
				<img id="img2" src="/b.jpg" alt="Second" />
				<img id="img3" src="/c.jpg" alt="Third" />
			`)
		);
		const cleanup = lightboxGroup()(container);
		const img2 = container.querySelector('#img2') as HTMLImageElement;

		img2.click();
		await tick();
		const dialog = getDialog()!;
		const slides = Array.from(dialog.querySelectorAll<HTMLElement>('.hz-carousel-slide'));

		expect(slides).toHaveLength(3);
		expect(slides[1].hidden).toBe(false);
		expect(slides[0].hidden).toBe(true);
		expect(slides[2].hidden).toBe(true);

		await closeOverlay(dialog);
		cleanup();
		container.remove();
	});

	it('a non-media click (e.g. a figcaption) is a no-op', async () => {
		const container = markContainer(
			makeContainer(`
				<figure>
					<img id="img1" src="/a.jpg" alt="One" />
					<figcaption id="cap">Caption text</figcaption>
				</figure>
			`)
		);
		const cleanup = lightboxGroup()(container);

		(container.querySelector('#cap') as HTMLElement).click();
		await tick();
		expect(getDialog()).toBeNull();

		cleanup();
		container.remove();
	});

	it('a container with no qualifying media attaches listeners but opens nothing', async () => {
		const container = markContainer(makeContainer(`<p id="txt">Just text, no media.</p>`));
		const cleanup = lightboxGroup()(container);

		(container.querySelector('#txt') as HTMLElement).click();
		await tick();
		expect(getDialog()).toBeNull();

		cleanup();
		container.remove();
	});
});

// ---------------------------------------------------------------------------
// Keyboard open (Lightbox-R23)
// ---------------------------------------------------------------------------

describe('keyboard open (R23)', () => {
	it('Enter on a focused trigger opens the overlay', async () => {
		const container = markContainer(makeContainer(`<img id="img1" src="/a.jpg" alt="One" />`));
		const cleanup = lightboxGroup()(container);
		const img = container.querySelector('#img1') as HTMLImageElement;

		img.focus();
		img.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
		);
		await tick();
		const dialog = getDialog();

		expect(dialog?.open).toBe(true);

		await closeOverlay(dialog!);
		cleanup();
		container.remove();
	});

	it('Space opens the overlay and is defaultPrevented (no page scroll)', async () => {
		const container = markContainer(makeContainer(`<img id="img1" src="/a.jpg" alt="One" />`));
		const cleanup = lightboxGroup()(container);
		const img = container.querySelector('#img1') as HTMLImageElement;

		img.focus();
		const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
		img.dispatchEvent(event);
		await tick();

		expect(event.defaultPrevented).toBe(true);
		expect(getDialog()?.open).toBe(true);

		await closeOverlay(getDialog()!);
		cleanup();
		container.remove();
	});
});

// ---------------------------------------------------------------------------
// Item derivation (Lightbox-R20)
// ---------------------------------------------------------------------------

describe('item derivation (R20)', () => {
	it('image src = currentSrc || src when there is no data-lightbox-src override', async () => {
		const container = markContainer(makeContainer(`<img id="img1" src="/full.jpg" alt="Plain" />`));
		const cleanup = lightboxGroup()(container);
		const img = container.querySelector('#img1') as HTMLImageElement;

		img.click();
		await tick();
		const dialog = getDialog()!;
		// R15/R20 (sanctioned): `.hz-lightbox-img` is now Image's wrapper box —
		// the bitmap is `.hz-lightbox-img .hz-image__img`.
		const rendered = dialog.querySelector('.hz-lightbox-img .hz-image__img') as HTMLImageElement;

		expect(rendered.src).toContain('/full.jpg');

		await closeOverlay(dialog);
		cleanup();
		container.remove();
	});

	it('data-lightbox-src overrides currentSrc/src', async () => {
		const container = markContainer(
			makeContainer(
				`<img id="img1" src="/thumb.jpg" data-lightbox-src="/full-res.jpg" alt="Override" />`
			)
		);
		const cleanup = lightboxGroup()(container);
		const img = container.querySelector('#img1') as HTMLImageElement;

		img.click();
		await tick();
		const dialog = getDialog()!;
		// R15/R20 (sanctioned): `.hz-lightbox-img` is now Image's wrapper box —
		// the bitmap is `.hz-lightbox-img .hz-image__img`.
		const rendered = dialog.querySelector('.hz-lightbox-img .hz-image__img') as HTMLImageElement;

		expect(rendered.src).toContain('/full-res.jpg');

		await closeOverlay(dialog);
		cleanup();
		container.remove();
	});

	it('a figcaption inside the enclosing figure becomes the item caption', async () => {
		const container = markContainer(
			makeContainer(
				`<figure><img id="img1" src="/a.jpg" alt="Captioned" /><figcaption>Hole 7, sunset round</figcaption></figure>`
			)
		);
		const cleanup = lightboxGroup()(container);
		const img = container.querySelector('#img1') as HTMLImageElement;

		img.click();
		await tick();
		const dialog = getDialog()!;

		expect(dialog.querySelector('figcaption')?.textContent?.trim()).toBe('Hole 7, sunset round');

		await closeOverlay(dialog);
		cleanup();
		container.remove();
	});

	it('a video renders the Video player, not an img', async () => {
		const container = markContainer(
			makeContainer(`<video id="vid1" src="/clip.mp4" aria-label="A clip"></video>`)
		);
		const cleanup = lightboxGroup()(container);
		const video = container.querySelector('#vid1') as HTMLVideoElement;

		video.click();
		await tick();
		const dialog = getDialog()!;

		expect(dialog.querySelector('.hz-lightbox-video video')).not.toBeNull();
		expect(dialog.querySelector('.hz-lightbox-img')).toBeNull();

		await closeOverlay(dialog);
		cleanup();
		container.remove();
	});

	it('video label precedence: aria-label wins over title/figcaption', async () => {
		const container = markContainer(
			makeContainer(
				`<figure><video id="vid1" src="/clip.mp4" aria-label="Aria wins" title="Title loses"></video><figcaption>Caption loses</figcaption></figure>`
			)
		);
		const cleanup = lightboxGroup()(container);
		const video = container.querySelector('#vid1') as HTMLVideoElement;

		video.click();
		await tick();
		const dialog = getDialog()!;

		expect(dialog.getAttribute('aria-label')).toBe('Aria wins');

		await closeOverlay(dialog);
		cleanup();
		container.remove();
	});

	it('video label precedence: title wins when there is no aria-label', async () => {
		const container = markContainer(
			makeContainer(`<video id="vid1" src="/clip.mp4" title="Title wins"></video>`)
		);
		const cleanup = lightboxGroup()(container);
		const video = container.querySelector('#vid1') as HTMLVideoElement;

		video.click();
		await tick();
		const dialog = getDialog()!;

		expect(dialog.getAttribute('aria-label')).toBe('Title wins');

		await closeOverlay(dialog);
		cleanup();
		container.remove();
	});

	it('video label precedence: figcaption wins when there is no aria-label/title', async () => {
		const container = markContainer(
			makeContainer(
				`<figure><video id="vid1" src="/clip.mp4"></video><figcaption>Caption wins</figcaption></figure>`
			)
		);
		const cleanup = lightboxGroup()(container);
		const video = container.querySelector('#vid1') as HTMLVideoElement;

		video.click();
		await tick();
		const dialog = getDialog()!;

		expect(dialog.getAttribute('aria-label')).toBe('Caption wins');

		await closeOverlay(dialog);
		cleanup();
		container.remove();
	});

	it('video label falls back to "Video" when no aria-label/title/figcaption is present', async () => {
		const container = markContainer(makeContainer(`<video id="vid1" src="/clip.mp4"></video>`));
		const cleanup = lightboxGroup()(container);
		const video = container.querySelector('#vid1') as HTMLVideoElement;

		video.click();
		await tick();
		const dialog = getDialog()!;

		expect(dialog.getAttribute('aria-label')).toBe('Video');

		await closeOverlay(dialog);
		cleanup();
		container.remove();
	});

	it('the enhancement-set aria-label does not leak into a later video-label read (R19+R20 interaction)', async () => {
		// The enhancement pass overwrites aria-label with "View larger: …" —
		// item derivation must still resolve the ORIGINAL name, not read back
		// its own overwrite.
		const container = markContainer(
			makeContainer(`<video id="vid1" src="/clip.mp4" aria-label="Original label"></video>`)
		);
		const cleanup = lightboxGroup()(container);
		const video = container.querySelector('#vid1') as HTMLVideoElement;

		expect(video.getAttribute('aria-label')).toBe('View larger: Original label');

		video.click();
		await tick();
		const dialog = getDialog()!;

		expect(dialog.getAttribute('aria-label')).toBe('Original label');

		await closeOverlay(dialog);
		cleanup();
		container.remove();
	});
});

// ---------------------------------------------------------------------------
// Lazy scan & dynamic children (Lightbox-R21/R26)
// ---------------------------------------------------------------------------

describe('lazy scan & dynamic children (R21/R26)', () => {
	it('media added after attach is included in the overlay set opened from a pre-existing trigger', async () => {
		const container = markContainer(
			makeContainer(`
				<img id="img1" src="/a.jpg" alt="First" />
				<img id="img2" src="/b.jpg" alt="Second" />
			`)
		);
		const cleanup = lightboxGroup()(container);

		const img3 = document.createElement('img');
		img3.src = '/c.jpg';
		img3.alt = 'Third';
		container.appendChild(img3);

		const img1 = container.querySelector('#img1') as HTMLImageElement;
		img1.click();
		await tick();
		const dialog = getDialog()!;

		expect(dialog.querySelectorAll('.hz-carousel-slide')).toHaveLength(3);

		await closeOverlay(dialog);
		cleanup();
		container.remove();
	});

	it('a newly-added image is directly pointer-clickable via delegation', async () => {
		const container = markContainer(makeContainer(`<img id="img1" src="/a.jpg" alt="First" />`));
		const cleanup = lightboxGroup()(container);

		const img2 = document.createElement('img');
		img2.src = '/b.jpg';
		img2.alt = 'Second';
		container.appendChild(img2);

		img2.click();
		await tick();
		const dialog = getDialog();

		expect(dialog?.open).toBe(true);

		await closeOverlay(dialog!);
		cleanup();
		container.remove();
	});

	it('a re-run enhances media added since the last run', () => {
		const container = markContainer(makeContainer(`<img id="img1" src="/a.jpg" alt="First" />`));
		let cleanup = lightboxGroup()(container);

		const img2 = document.createElement('img');
		img2.src = '/b.jpg';
		img2.alt = 'Second';
		container.appendChild(img2);

		expect(img2.hasAttribute('tabindex')).toBe(false);

		cleanup(); // Svelte tears down the prior attachment before re-invoking
		cleanup = lightboxGroup()(container);

		expect(img2.getAttribute('tabindex')).toBe('0');
		expect(img2.getAttribute('role')).toBe('button');

		cleanup();
		container.remove();
	});
});

// ---------------------------------------------------------------------------
// Close & focus return (Lightbox-R24)
// ---------------------------------------------------------------------------

describe('close & focus return (R24)', () => {
	it('Escape (native cancel) closes and unmounts, restores scroll, and returns focus to the trigger', async () => {
		const container = markContainer(makeContainer(`<img id="img1" src="/a.jpg" alt="One" />`));
		const cleanup = lightboxGroup()(container);
		const img = container.querySelector('#img1') as HTMLImageElement;

		img.click();
		await tick();
		const dialog = getDialog()!;
		dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
		await tick();

		expect(getDialog()).toBeNull();
		expect(document.body.style.overflow).toBe('');
		expect(document.activeElement).toBe(img);

		cleanup();
		container.remove();
	});

	it('a backdrop click closes and unmounts the overlay, returning focus to the trigger', async () => {
		const container = markContainer(makeContainer(`<img id="img1" src="/a.jpg" alt="One" />`));
		const cleanup = lightboxGroup()(container);
		const img = container.querySelector('#img1') as HTMLImageElement;

		img.click();
		await tick();
		const dialog = getDialog()!;
		dialog.click(); // target === dialog ⇒ backdrop
		await tick();

		expect(getDialog()).toBeNull();
		expect(document.activeElement).toBe(img);

		cleanup();
		container.remove();
	});

	it('the close button closes and unmounts the overlay, returning focus to the trigger', async () => {
		const container = markContainer(makeContainer(`<img id="img1" src="/a.jpg" alt="One" />`));
		const cleanup = lightboxGroup()(container);
		const img = container.querySelector('#img1') as HTMLImageElement;

		img.click();
		await tick();
		const dialog = getDialog()!;
		(dialog.querySelector('.hz-lightbox-close') as HTMLButtonElement).click();
		await tick();

		expect(getDialog()).toBeNull();
		expect(document.activeElement).toBe(img);

		cleanup();
		container.remove();
	});
});

// ---------------------------------------------------------------------------
// Nested groups (Lightbox-R22)
// ---------------------------------------------------------------------------

describe('nested groups (R22)', () => {
	it('activating inner media opens exactly one overlay (innermost wins via stopPropagation)', async () => {
		const outer = markContainer(document.createElement('div'));
		const inner = document.createElement('div');
		const img = document.createElement('img');
		img.src = '/a.jpg';
		img.alt = 'Nested';
		inner.appendChild(img);
		outer.appendChild(inner);
		document.body.appendChild(outer);

		const cleanupOuter = lightboxGroup()(outer);
		const cleanupInner = lightboxGroup()(inner);

		img.click();
		await tick();
		const dialogs = document.body.querySelectorAll('dialog.hz-lightbox');

		expect(dialogs).toHaveLength(1);

		await closeOverlay(dialogs[0] as HTMLDialogElement);
		cleanupInner();
		cleanupOuter();
		outer.remove();
	});
});

// ---------------------------------------------------------------------------
// Single-instance guard (Lightbox-R24)
// ---------------------------------------------------------------------------

describe('single-instance guard (R24)', () => {
	it('activating a second trigger while the overlay is open does not mount a second dialog', async () => {
		const container = markContainer(
			makeContainer(`
				<img id="img1" src="/a.jpg" alt="First" />
				<img id="img2" src="/b.jpg" alt="Second" />
			`)
		);
		const cleanup = lightboxGroup()(container);
		const img1 = container.querySelector('#img1') as HTMLImageElement;
		const img2 = container.querySelector('#img2') as HTMLImageElement;

		img1.click();
		await tick();
		img2.click();
		await tick();

		expect(document.body.querySelectorAll('dialog.hz-lightbox')).toHaveLength(1);

		await closeOverlay(getDialog()!);
		cleanup();
		container.remove();
	});
});

// ---------------------------------------------------------------------------
// Cleanup (Lightbox-R25)
// ---------------------------------------------------------------------------

describe('cleanup (R25)', () => {
	it('removes listeners so a subsequent click opens nothing', async () => {
		const container = markContainer(makeContainer(`<img id="img1" src="/a.jpg" alt="One" />`));
		const cleanup = lightboxGroup()(container);
		cleanup();

		const img = container.querySelector('#img1') as HTMLImageElement;
		img.click();
		await tick();

		expect(getDialog()).toBeNull();

		container.remove();
	});

	it('restores prior attribute state — an element that had one keeps it, one that did not has none', () => {
		const container = markContainer(
			makeContainer(`
				<img id="img1" src="/a.jpg" alt="Had attrs" tabindex="3" role="figure" aria-label="Original label" />
				<img id="img2" src="/b.jpg" alt="No prior attrs" />
			`)
		);
		const cleanup = lightboxGroup()(container);
		const img1 = container.querySelector('#img1') as HTMLImageElement;
		const img2 = container.querySelector('#img2') as HTMLImageElement;

		cleanup();

		expect(img1.getAttribute('tabindex')).toBe('3');
		expect(img1.getAttribute('role')).toBe('figure');
		expect(img1.getAttribute('aria-label')).toBe('Original label');
		expect(img1.hasAttribute('data-lightbox-trigger')).toBe(false);
		expect(img2.hasAttribute('tabindex')).toBe(false);
		expect(img2.hasAttribute('role')).toBe(false);
		expect(img2.hasAttribute('aria-label')).toBe(false);
		expect(img2.hasAttribute('data-lightbox-trigger')).toBe(false);

		container.remove();
	});

	it('unmounts an open overlay and restores scroll on teardown', async () => {
		const container = markContainer(makeContainer(`<img id="img1" src="/a.jpg" alt="One" />`));
		const cleanup = lightboxGroup()(container);
		const img = container.querySelector('#img1') as HTMLImageElement;

		img.click();
		await tick();
		expect(getDialog()).not.toBeNull();

		cleanup();
		await tick();

		expect(getDialog()).toBeNull();
		expect(document.body.style.overflow).toBe('');

		container.remove();
	});
});

// ---------------------------------------------------------------------------
// options.selector (Lightbox-R18)
// ---------------------------------------------------------------------------

describe('options.selector (R18)', () => {
	it('narrows enhancement to elements matching the selector', () => {
		const container = markContainer(
			makeContainer(`
				<img id="img1" class="gallery" src="/a.jpg" alt="In gallery" />
				<img id="img2" src="/b.jpg" alt="Not in gallery" />
			`)
		);
		const cleanup = lightboxGroup({ selector: '.gallery' })(container);
		const img1 = container.querySelector('#img1') as HTMLImageElement;
		const img2 = container.querySelector('#img2') as HTMLImageElement;

		expect(img1.hasAttribute('data-lightbox-trigger')).toBe(true);
		expect(img2.hasAttribute('data-lightbox-trigger')).toBe(false);

		cleanup();
		container.remove();
	});
});

// ---------------------------------------------------------------------------
// Label options
// ---------------------------------------------------------------------------

describe('label options', () => {
	it('forwards custom dialogLabel/closeLabel to the overlay in multi-item mode', async () => {
		const container = markContainer(
			makeContainer(`
				<img id="img1" src="/a.jpg" alt="First" />
				<img id="img2" src="/b.jpg" alt="Second" />
			`)
		);
		const cleanup = lightboxGroup({ dialogLabel: 'Custom viewer', closeLabel: 'Dismiss' })(
			container
		);
		const img1 = container.querySelector('#img1') as HTMLImageElement;

		img1.click();
		await tick();
		const dialog = getDialog()!;

		expect(dialog.getAttribute('aria-label')).toBe('Custom viewer');
		expect(
			(dialog.querySelector('.hz-lightbox-close') as HTMLElement).getAttribute('aria-label')
		).toBe('Dismiss');

		await closeOverlay(dialog);
		cleanup();
		container.remove();
	});
});
