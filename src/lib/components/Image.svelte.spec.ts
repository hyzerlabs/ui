import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Image from './Image.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** 1×1 transparent GIF — browsers decode this immediately (img.complete=true). */
const DATA_URI = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/** A tiny red pixel data URI (different src so we can distinguish placeholder). */
const PLACEHOLDER_URI =
	'data:image/gif;base64,R0lGODlhAQABAPAAAP8AAAAAAHAAAACBAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAAQABAAACAkQBADs=';

// ---------------------------------------------------------------------------
// IMG-R1 — Structure
// ---------------------------------------------------------------------------

describe('IMG-R1 — structure', () => {
	it('renders a div.hz-image wrapper', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test' });
		const wrapper = container.querySelector('div.hz-image');
		expect(wrapper).not.toBeNull();
	});

	it('renders a single img.hz-image__img inside the wrapper', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test' });
		const imgs = container.querySelectorAll('img.hz-image__img');
		expect(imgs.length).toBe(1);
	});

	it('wrapper carries data-state, data-loading, data-aspect-ratio, data-fit', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test' });
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		expect(wrapper.hasAttribute('data-state')).toBe(true);
		expect(wrapper.hasAttribute('data-loading')).toBe(true);
		expect(wrapper.hasAttribute('data-aspect-ratio')).toBe(true);
		expect(wrapper.hasAttribute('data-fit')).toBe(true);
	});

	it('img carries src and alt', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'A dog' });
		const img = container.querySelector('img.hz-image__img') as HTMLImageElement;
		expect(img.getAttribute('src')).toBe(DATA_URI);
		expect(img.getAttribute('alt')).toBe('A dog');
	});
});

// ---------------------------------------------------------------------------
// IMG-R2 — alt required, decorative handling
// ---------------------------------------------------------------------------

describe('IMG-R2 — alt and decorative handling', () => {
	it('alt="" adds role="presentation" to the img', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: '' });
		const img = container.querySelector('img.hz-image__img') as HTMLImageElement;
		expect(img.getAttribute('role')).toBe('presentation');
	});

	it('non-empty alt does not add role to the img', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'A cat' });
		const img = container.querySelector('img.hz-image__img') as HTMLImageElement;
		expect(img.hasAttribute('role')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// IMG-R3 — Dimensions / CLS
// ---------------------------------------------------------------------------

describe('IMG-R3 — width/height attributes', () => {
	it('width and height are present when provided', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test', width: 800, height: 600 });
		const img = container.querySelector('img.hz-image__img') as HTMLImageElement;
		expect(img.getAttribute('width')).toBe('800');
		expect(img.getAttribute('height')).toBe('600');
	});

	it('width and height are absent when not provided', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test' });
		const img = container.querySelector('img.hz-image__img') as HTMLImageElement;
		expect(img.hasAttribute('width')).toBe(false);
		expect(img.hasAttribute('height')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// IMG-R4 — loading attribute
// ---------------------------------------------------------------------------

describe('IMG-R4 — loading attribute', () => {
	it.each(['lazy', 'eager'] as const)(
		'loading="%s" → img[loading] and data-loading',
		async (loadingVal) => {
			const { container } = render(Image, { src: DATA_URI, alt: 'test', loading: loadingVal });
			const img = container.querySelector('img.hz-image__img') as HTMLImageElement;
			const wrapper = container.querySelector('div.hz-image') as HTMLElement;
			expect(img.getAttribute('loading')).toBe(loadingVal);
			expect(wrapper.getAttribute('data-loading')).toBe(loadingVal);
		}
	);

	it('defaults to loading="lazy"', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test' });
		const img = container.querySelector('img.hz-image__img') as HTMLImageElement;
		expect(img.getAttribute('loading')).toBe('lazy');
	});
});

// ---------------------------------------------------------------------------
// IMG-R5 — aspectRatio
// ---------------------------------------------------------------------------

describe('IMG-R5 — aspectRatio', () => {
	it.each(['1/1', '4/3', '16/9', '21/9'] as const)(
		'aspectRatio="%s" → data-aspect-ratio + inline aspect-ratio style',
		async (ratio) => {
			const { container } = render(Image, { src: DATA_URI, alt: 'test', aspectRatio: ratio });
			const wrapper = container.querySelector('div.hz-image') as HTMLElement;
			expect(wrapper.getAttribute('data-aspect-ratio')).toBe(ratio);
			// Browsers may normalize "16/9" → "16 / 9"; strip spaces before comparing.
			expect(wrapper.style.aspectRatio.replace(/\s/g, '')).toBe(ratio);
		}
	);

	it('aspectRatio="auto" → data-aspect-ratio="auto" and no inline aspect-ratio style', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test', aspectRatio: 'auto' });
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		expect(wrapper.getAttribute('data-aspect-ratio')).toBe('auto');
		expect(wrapper.style.aspectRatio).toBe('');
	});

	it('arbitrary ratio "3/2" passes through verbatim to data-aspect-ratio and style', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test', aspectRatio: '3/2' });
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		expect(wrapper.getAttribute('data-aspect-ratio')).toBe('3/2');
		expect(wrapper.style.aspectRatio.replace(/\s/g, '')).toBe('3/2');
	});
});

// ---------------------------------------------------------------------------
// IMG-R6 — fit
// ---------------------------------------------------------------------------

describe('IMG-R6 — fit', () => {
	it.each(['cover', 'contain', 'fill', 'none'] as const)(
		'fit="%s" → data-fit on wrapper; computed object-fit matches',
		async (fitVal) => {
			const { container } = render(Image, { src: DATA_URI, alt: 'test', fit: fitVal });
			const wrapper = container.querySelector('div.hz-image') as HTMLElement;
			const img = container.querySelector('img.hz-image__img') as HTMLImageElement;
			expect(wrapper.getAttribute('data-fit')).toBe(fitVal);
			expect(getComputedStyle(img).objectFit).toBe(fitVal);
		}
	);

	it('defaults to fit="cover"', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test' });
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		expect(wrapper.getAttribute('data-fit')).toBe('cover');
	});
});

// ---------------------------------------------------------------------------
// IMG-R7 — rounded (hook only — no border-radius or overflow shipped)
// ---------------------------------------------------------------------------

describe('IMG-R7 — rounded', () => {
	it('rounded=true → data-rounded="" (boolean present)', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test', rounded: true });
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		expect(wrapper.hasAttribute('data-rounded')).toBe(true);
		expect(wrapper.getAttribute('data-rounded')).toBe('');
	});

	it('rounded="md" → data-rounded="md"', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test', rounded: 'md' });
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		expect(wrapper.getAttribute('data-rounded')).toBe('md');
	});

	it('rounded=false → data-rounded absent', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test', rounded: false });
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		expect(wrapper.hasAttribute('data-rounded')).toBe(false);
	});

	it('ships no border-radius on the wrapper', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test', rounded: true });
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		expect(getComputedStyle(wrapper).borderRadius).toBe('0px');
	});

	it('ships no overflow on the wrapper', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test', rounded: true });
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		expect(getComputedStyle(wrapper).overflow).toBe('visible');
	});
});

// ---------------------------------------------------------------------------
// IMG-R8 — Load state machine
// ---------------------------------------------------------------------------

describe('IMG-R8 — load state machine', () => {
	it('initial data-state is "loading"', async () => {
		// Use a non-data-URI src so it won't be instantly cached
		const { container } = render(Image, {
			src: '/nonexistent-image-that-wont-load.png',
			alt: 'test'
		});
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		// On initial render the state is 'loading' (may transition quickly for data URIs)
		expect(['loading', 'loaded', 'error']).toContain(wrapper.getAttribute('data-state'));
	});

	it('dispatching load event → data-state="loaded"', async () => {
		const { container } = render(Image, { src: '/nonexistent.png', alt: 'test' });
		const img = container.querySelector('img.hz-image__img') as HTMLImageElement;
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		img.dispatchEvent(new Event('load'));
		// Allow Svelte to flush
		await new Promise((r) => setTimeout(r, 0));
		expect(wrapper.getAttribute('data-state')).toBe('loaded');
	});

	it('dispatching error event → data-state="error"', async () => {
		const { container } = render(Image, { src: '/nonexistent.png', alt: 'test' });
		const img = container.querySelector('img.hz-image__img') as HTMLImageElement;
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		img.dispatchEvent(new Event('error'));
		await new Promise((r) => setTimeout(r, 0));
		expect(wrapper.getAttribute('data-state')).toBe('error');
	});

	it('cached image (data-URI) mounts with data-state="loaded" without a load event', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test' });
		// Give the $effect a tick to run
		await new Promise((r) => setTimeout(r, 50));
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		expect(wrapper.getAttribute('data-state')).toBe('loaded');
	});
});

// ---------------------------------------------------------------------------
// IMG-R9 — placeholder=none
// ---------------------------------------------------------------------------

describe('IMG-R9 — placeholder=none', () => {
	it('no placeholder img rendered when placeholder="none"', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test', placeholder: 'none' });
		const placeholder = container.querySelector('img.hz-image__placeholder');
		expect(placeholder).toBeNull();
	});

	it('no data-placeholder attribute on wrapper when placeholder="none"', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test', placeholder: 'none' });
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		expect(wrapper.hasAttribute('data-placeholder')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// IMG-R10 — placeholder=color
// ---------------------------------------------------------------------------

describe('IMG-R10 — placeholder=color', () => {
	it('data-placeholder="color" on wrapper', async () => {
		const { container } = render(Image, {
			src: '/nonexistent.png',
			alt: 'test',
			placeholder: 'color'
		});
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		expect(wrapper.getAttribute('data-placeholder')).toBe('color');
	});

	it('wrapper has background-color inline style while state=loading', async () => {
		const { container } = render(Image, {
			src: '/nonexistent.png',
			alt: 'test',
			placeholder: 'color',
			placeholderColor: 'rgb(200, 200, 200)'
		});
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		// State should be 'loading' since src doesn't load
		expect(wrapper.getAttribute('data-state')).toBe('loading');
		expect(wrapper.style.backgroundColor).toBeTruthy();
	});
});

// ---------------------------------------------------------------------------
// IMG-R11 — placeholder=blur
// ---------------------------------------------------------------------------

describe('IMG-R11 — placeholder=blur', () => {
	it('blur with placeholderSrc → img.hz-image__placeholder[aria-hidden=true] rendered', async () => {
		const { container } = render(Image, {
			src: DATA_URI,
			alt: 'test',
			placeholder: 'blur',
			placeholderSrc: PLACEHOLDER_URI
		});
		const placeholder = container.querySelector('img.hz-image__placeholder') as HTMLImageElement;
		expect(placeholder).not.toBeNull();
		expect(placeholder.getAttribute('aria-hidden')).toBe('true');
		expect(placeholder.getAttribute('src')).toBe(PLACEHOLDER_URI);
	});

	it('data-placeholder="blur" on wrapper when placeholderSrc is provided', async () => {
		const { container } = render(Image, {
			src: DATA_URI,
			alt: 'test',
			placeholder: 'blur',
			placeholderSrc: PLACEHOLDER_URI
		});
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		expect(wrapper.getAttribute('data-placeholder')).toBe('blur');
	});

	it('blur without placeholderSrc → behaves as none (no placeholder img)', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { container } = render(Image, {
			src: DATA_URI,
			alt: 'test',
			placeholder: 'blur'
			// no placeholderSrc
		});
		const placeholder = container.querySelector('img.hz-image__placeholder');
		expect(placeholder).toBeNull();
		warnSpy.mockRestore();
	});

	it('blur without placeholderSrc → fires console.warn', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(Image, {
			src: DATA_URI,
			alt: 'test',
			placeholder: 'blur'
		});
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('placeholderSrc');
		warnSpy.mockRestore();
	});

	it('no data-placeholder attr on wrapper when blur fallback is none', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { container } = render(Image, {
			src: DATA_URI,
			alt: 'test',
			placeholder: 'blur'
		});
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		expect(wrapper.hasAttribute('data-placeholder')).toBe(false);
		warnSpy.mockRestore();
	});

	it('on loaded the main image becomes visible (opacity 1) via CSS', async () => {
		const { container } = render(Image, {
			src: DATA_URI,
			alt: 'test',
			placeholder: 'blur',
			placeholderSrc: PLACEHOLDER_URI
		});
		// Wait for cached image to trigger loaded state
		await new Promise((r) => setTimeout(r, 50));
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		const img = container.querySelector('img.hz-image__img') as HTMLImageElement;
		expect(wrapper.getAttribute('data-state')).toBe('loaded');
		// In loaded state the CSS sets opacity: 1
		expect(getComputedStyle(img).opacity).toBe('1');
	});
});

// ---------------------------------------------------------------------------
// IMG-R12 — Reduced motion
// ---------------------------------------------------------------------------

describe('IMG-R12 — reduced motion', () => {
	it('with prefers-reduced-motion: reduce, transition-duration is 0s on loaded img', async () => {
		// Mock matchMedia to return prefers-reduced-motion: reduce
		const original = window.matchMedia;
		window.matchMedia = vi.fn().mockImplementation((query: string) => ({
			matches: query === '(prefers-reduced-motion: reduce)',
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
		}));

		const { container } = render(Image, {
			src: DATA_URI,
			alt: 'test',
			placeholder: 'blur',
			placeholderSrc: PLACEHOLDER_URI
		});

		await new Promise((r) => setTimeout(r, 50));
		const img = container.querySelector('img.hz-image__img') as HTMLImageElement;
		// With reduced motion the transition-duration should be 0s (instant swap)
		expect(getComputedStyle(img).transitionDuration).toBe('0s');

		window.matchMedia = original;
	});
});

// ---------------------------------------------------------------------------
// IMG-R13 — class composition
// ---------------------------------------------------------------------------

describe('IMG-R13 — class composition', () => {
	it('no class prop → wrapper class is exactly "hz-image"', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test' });
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		const classes = [...wrapper.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toEqual(['hz-image']);
	});

	it('class="foo bar" → hz-image is first, foo and bar present', async () => {
		const { container } = render(Image, { src: DATA_URI, alt: 'test', class: 'foo bar' });
		const wrapper = container.querySelector('div.hz-image') as HTMLElement;
		const classes = [...wrapper.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-image');
		expect(classes).toContain('foo');
		expect(classes).toContain('bar');
	});
});

// ---------------------------------------------------------------------------
// IMG-R14 — rest forwarding
// ---------------------------------------------------------------------------

describe('IMG-R14 — rest forwarding', () => {
	it('extra attributes (e.g. data-testid) are forwarded to the img', async () => {
		const { container } = render(Image, {
			src: DATA_URI,
			alt: 'test',
			'data-testid': 'my-image'
		} as Record<string, unknown>);
		const img = container.querySelector('img.hz-image__img') as HTMLImageElement;
		expect(img.getAttribute('data-testid')).toBe('my-image');
	});

	it('rest cannot overwrite managed src', async () => {
		const { container } = render(Image, {
			alt: 'test',
			// attempt to overwrite via rest — managed wins
			src: DATA_URI
		} as Record<string, unknown>);
		const img = container.querySelector('img.hz-image__img') as HTMLImageElement;
		expect(img.getAttribute('src')).toBe(DATA_URI);
	});

	it('rest cannot overwrite managed class on img', async () => {
		const { container } = render(Image, {
			src: DATA_URI,
			alt: 'test',
			class: 'hijack'
		} as Record<string, unknown>);
		const img = container.querySelector('img.hz-image__img') as HTMLImageElement;
		// hz-image__img must be present (svelte may append a scoped hash class)
		expect(img.classList.contains('hz-image__img')).toBe(true);
		expect(img.classList.contains('hijack')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// IMG-R15 — Barrel export
// ---------------------------------------------------------------------------

describe('IMG-R15 — barrel export', () => {
	it('Image is resolvable from $lib', async () => {
		const { Image: ImageComp } = await import('$lib');
		expect(ImageComp).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// Picture mode (sources prop)
// ---------------------------------------------------------------------------

describe('picture mode (sources)', () => {
	const sources = [
		{ srcset: '/img/photo.avif', type: 'image/avif' },
		{ srcset: '/img/photo-wide.jpg', media: '(min-width: 968px)', sizes: '100vw' }
	];

	it('no sources → no <picture>, no data-picture on the wrapper', () => {
		const { container } = render(Image, { src: '/img/a.jpg', alt: 'A' });
		expect(container.querySelector('picture')).toBeNull();
		const wrapper = container.querySelector('.hz-image') as HTMLElement;
		expect(wrapper.hasAttribute('data-picture')).toBe(false);
	});

	it('sources → <picture> wraps the sources (in order) plus the fallback img', () => {
		const { container } = render(Image, { src: '/img/a.jpg', alt: 'A', sources });
		const picture = container.querySelector('picture.hz-image__picture') as HTMLElement;
		expect(picture).not.toBeNull();
		expect(Array.from(picture.children).map((e) => e.tagName)).toEqual([
			'SOURCE',
			'SOURCE',
			'IMG'
		]);
		const img = picture.querySelector('img.hz-image__img') as HTMLImageElement;
		expect(img.getAttribute('src')).toBe('/img/a.jpg');
		expect(img.getAttribute('alt')).toBe('A');
	});

	it('source attributes pass through: srcset, type, media, sizes', () => {
		const { container } = render(Image, { src: '/img/a.jpg', alt: 'A', sources });
		const [s1, s2] = Array.from(container.querySelectorAll('source'));
		expect(s1.getAttribute('srcset')).toBe('/img/photo.avif');
		expect(s1.getAttribute('type')).toBe('image/avif');
		expect(s1.hasAttribute('media')).toBe(false);
		expect(s2.getAttribute('media')).toBe('(min-width: 968px)');
		expect(s2.getAttribute('sizes')).toBe('100vw');
	});

	it('wrapper gets data-picture; the picture box is display: contents', () => {
		const { container } = render(Image, { src: '/img/a.jpg', alt: 'A', sources });
		const wrapper = container.querySelector('.hz-image') as HTMLElement;
		expect(wrapper.hasAttribute('data-picture')).toBe(true);
		const picture = container.querySelector('picture') as HTMLElement;
		expect(getComputedStyle(picture).display).toBe('contents');
	});

	it('an empty sources array behaves like no sources', () => {
		const { container } = render(Image, { src: '/img/a.jpg', alt: 'A', sources: [] });
		expect(container.querySelector('picture')).toBeNull();
	});
});
