import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet, mount, unmount } from 'svelte';
import type { Snippet } from 'svelte';
import { cdp } from 'vitest/browser';
import Parallax from './Parallax.svelte';
import ParallaxLayer from './ParallaxLayer.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Consumer-visible classes (strip Svelte's internal scope hash) — the Split.svelte.spec.ts precedent. */
function consumerClasses(el: HTMLElement): string[] {
	return [...el.classList].filter((c) => !c.startsWith('svelte-'));
}

function silenceWarn(): ReturnType<typeof vi.spyOn> {
	return vi.spyOn(console, 'warn').mockImplementation(() => {});
}

function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

/**
 * A `children` snippet that imperatively mounts a real `ParallaxLayer` (the
 * Lightbox.svelte.spec.ts `imageFaceTrigger` precedent — `createRawSnippet`'s
 * `setup` hook is the sanctioned way to compose a second real component
 * inside a raw-snippet prop from a `.ts` test file).
 */
function oneLayer(props: Record<string, unknown> = {}, content?: Snippet): Snippet {
	return createRawSnippet(() => ({
		render: () => `<div class="layer-slot"></div>`,
		setup: (element) => {
			const instance = mount(ParallaxLayer, {
				target: element as HTMLElement,
				props: content ? { ...props, children: content } : props
			});
			return () => unmount(instance);
		}
	}));
}

const tallContent: Snippet = createRawSnippet(() => ({
	render: () => `<div style="height: 500px;"></div>`
}));

const buttonContent: Snippet = createRawSnippet(() => ({
	render: () => `<button type="button">Click</button>`
}));

// R8/R9 pattern (Loading.svelte.spec.ts) — resets the forced media state so
// it never leaks into another test or file (the browser session persists
// across .svelte.spec.ts files).
afterEach(async () => {
	await cdp().send('Emulation.setEmulatedMedia', { media: 'screen', features: [] });
});

async function forceReducedMotion(): Promise<void> {
	await cdp().send('Emulation.setEmulatedMedia', {
		media: 'screen',
		features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
	});
}

// ---------------------------------------------------------------------------
// R2 — Parallax band structure
// ---------------------------------------------------------------------------

describe('Parallax-R2 — band structure', () => {
	it('computed position: relative, overflow: clip (both axes), isolation: isolate', () => {
		const { container } = render(Parallax);
		const el = container.querySelector('.hz-parallax') as HTMLElement;
		const cs = getComputedStyle(el);
		expect(cs.position).toBe('relative');
		expect(cs.overflowX).toBe('clip');
		expect(cs.overflowY).toBe('clip');
		expect(cs.isolation).toBe('isolate');
	});

	it('as="section" renders a <section>', () => {
		const { container } = render(Parallax, { as: 'section' });
		expect((container.querySelector('.hz-parallax') as HTMLElement).tagName).toBe('SECTION');
	});

	it('default as renders a <div>', () => {
		const { container } = render(Parallax);
		expect((container.querySelector('.hz-parallax') as HTMLElement).tagName).toBe('DIV');
	});

	it('class merges after hz-parallax', () => {
		const { container } = render(Parallax, { class: 'foo bar' });
		const el = container.querySelector('.hz-parallax') as HTMLElement;
		const cls = consumerClasses(el);
		expect(cls[0]).toBe('hz-parallax');
		expect(cls).toContain('foo');
		expect(cls).toContain('bar');
	});

	it('a rest attribute forwards to the root, and rest cannot inject a second, raw `class` attribute (rest spreads first)', () => {
		const { container } = render(Parallax, {
			'data-testid': 'band',
			class: 'foo'
		} as Record<string, unknown>);
		const el = container.querySelector('.hz-parallax') as HTMLElement;
		expect(el.getAttribute('data-testid')).toBe('band');
		// Parallax stamps no data-* of its own (R2) — `class` is the only
		// component-managed output, composed via cx after the rest spread.
		// Exactly one `class` attribute exists, and it is the composed one.
		expect(el.getAttributeNames().filter((n) => n === 'class')).toHaveLength(1);
		expect(consumerClasses(el)).toEqual(['hz-parallax', 'foo']);
	});

	it('renders children in normal flow', () => {
		const children = createRawSnippet(() => ({
			render: () => `<div data-testid="child">content</div>`
		}));
		const { container } = render(Parallax, { children });
		expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R3 — ParallaxLayer structure, sizing
// ---------------------------------------------------------------------------

describe('ParallaxLayer-R3 — structure', () => {
	it('computed position: absolute, pointer-events: none', () => {
		const warnSpy = silenceWarn();
		const { container } = render(ParallaxLayer, { x: 40 });
		const el = container.querySelector('.hz-parallax-layer') as HTMLElement;
		const cs = getComputedStyle(el);
		expect(cs.position).toBe('absolute');
		expect(cs.pointerEvents).toBe('none');
		warnSpy.mockRestore();
	});

	it('aria-hidden="true" by default', () => {
		const warnSpy = silenceWarn();
		const { container } = render(ParallaxLayer, { x: 40 });
		const el = container.querySelector('.hz-parallax-layer') as HTMLElement;
		expect(el.getAttribute('aria-hidden')).toBe('true');
		warnSpy.mockRestore();
	});

	it('a consumer can override aria-hidden via rest (the Skeleton.svelte exception)', () => {
		const warnSpy = silenceWarn();
		const { container } = render(ParallaxLayer, {
			x: 40,
			'aria-hidden': 'false'
		} as Record<string, unknown>);
		const el = container.querySelector('.hz-parallax-layer') as HTMLElement;
		expect(el.getAttribute('aria-hidden')).toBe('false');
		warnSpy.mockRestore();
	});

	it('z-index is -1 by default and reflects the z prop when set', () => {
		const warnSpy = silenceWarn();
		const { container: defaultContainer } = render(ParallaxLayer, { x: 40 });
		const defaultEl = defaultContainer.querySelector('.hz-parallax-layer') as HTMLElement;
		expect(getComputedStyle(defaultEl).zIndex).toBe('-1');

		const { container: zContainer } = render(ParallaxLayer, { x: 40, z: 1 });
		const zEl = zContainer.querySelector('.hz-parallax-layer') as HTMLElement;
		expect(getComputedStyle(zEl).zIndex).toBe('1');
		warnSpy.mockRestore();
	});

	it('a layer contributes no height to the band — an empty band and a band holding only a (tall) layer are both zero-height', () => {
		const { container: empty } = render(Parallax);
		expect(
			(empty.querySelector('.hz-parallax') as HTMLElement).getBoundingClientRect().height
		).toBe(0);

		const warnSpy = silenceWarn();
		const { container: withLayer } = render(Parallax, {
			children: oneLayer({ x: 40 }, tallContent)
		});
		expect(
			(withLayer.querySelector('.hz-parallax') as HTMLElement).getBoundingClientRect().height
		).toBe(0);
		warnSpy.mockRestore();
	});

	it('band height is identical with and without a layer overlapping the foreground content', () => {
		const withoutLayer = createRawSnippet(() => ({
			render: () => `<div class="fg" style="height: 50px;"></div>`
		}));
		const { container: c1 } = render(Parallax, { children: withoutLayer });
		const heightWithout = (c1.querySelector('.hz-parallax') as HTMLElement).getBoundingClientRect()
			.height;

		const withLayer = createRawSnippet(() => ({
			render: () =>
				`<div class="wrap"><div class="fg" style="height: 50px;"></div><div class="layer-slot"></div></div>`,
			setup: (element) => {
				const slot = (element as HTMLElement).querySelector('.layer-slot') as HTMLElement;
				const instance = mount(ParallaxLayer, {
					target: slot,
					props: { x: 40, children: tallContent }
				});
				return () => unmount(instance);
			}
		}));
		const warnSpy = silenceWarn();
		const { container: c2 } = render(Parallax, { children: withLayer });
		const heightWith = (c2.querySelector('.hz-parallax') as HTMLElement).getBoundingClientRect()
			.height;
		warnSpy.mockRestore();

		expect(heightWithout).toBe(50);
		expect(heightWith).toBe(heightWithout);
	});
});

// ---------------------------------------------------------------------------
// R4 — Travel plumbing
// ---------------------------------------------------------------------------

describe('ParallaxLayer-R4 — travel plumbing', () => {
	it('x={40} (number) stamps inline --hz-parallax-x: 40px', () => {
		const warnSpy = silenceWarn();
		const { container } = render(ParallaxLayer, { x: 40 });
		const el = container.querySelector('.hz-parallax-layer') as HTMLElement;
		expect(el.style.getPropertyValue('--hz-parallax-x')).toBe('40px');
		warnSpy.mockRestore();
	});

	it('y="10vh" (string) stamps the length verbatim', () => {
		const warnSpy = silenceWarn();
		const { container } = render(ParallaxLayer, { y: '10vh' });
		const el = container.querySelector('.hz-parallax-layer') as HTMLElement;
		expect(el.style.getPropertyValue('--hz-parallax-y')).toBe('10vh');
		warnSpy.mockRestore();
	});

	it('omitted x/y/z stamp no inline property at all', () => {
		const warnSpy = silenceWarn();
		const { container } = render(ParallaxLayer);
		const el = container.querySelector('.hz-parallax-layer') as HTMLElement;
		expect(el.style.getPropertyValue('--hz-parallax-x')).toBe('');
		expect(el.style.getPropertyValue('--hz-parallax-y')).toBe('');
		expect(el.style.getPropertyValue('--hz-parallax-z')).toBe('');
		warnSpy.mockRestore();
	});

	it('z stamps inline --hz-parallax-z only when provided', () => {
		const warnSpy = silenceWarn();
		const { container } = render(ParallaxLayer, { x: 40, z: 1 });
		const el = container.querySelector('.hz-parallax-layer') as HTMLElement;
		expect(el.style.getPropertyValue('--hz-parallax-z')).toBe('1');
		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// R3 — Bleed
// ---------------------------------------------------------------------------

describe('ParallaxLayer-R3 — coverage bleed', () => {
	it('x="100px" widens the layer by 100px, centred on the band (50px each side)', () => {
		const warnSpy = silenceWarn();
		const { container } = render(Parallax, {
			style: 'width: 300px; height: 100px;',
			children: oneLayer({ x: '100px' })
		});
		const band = container.querySelector('.hz-parallax') as HTMLElement;
		const layer = container.querySelector('.hz-parallax-layer') as HTMLElement;
		const bandRect = band.getBoundingClientRect();
		const layerRect = layer.getBoundingClientRect();

		expect(layerRect.width).toBeCloseTo(bandRect.width + 100, 0);
		expect(bandRect.left - layerRect.left).toBeCloseTo(50, 0);
		expect(layerRect.right - bandRect.right).toBeCloseTo(50, 0);
		warnSpy.mockRestore();
	});

	it('zero travel — the layer bounding rect matches the band exactly', () => {
		const warnSpy = silenceWarn();
		const { container } = render(Parallax, {
			style: 'width: 300px; height: 100px;',
			children: oneLayer({})
		});
		const band = container.querySelector('.hz-parallax') as HTMLElement;
		const layer = container.querySelector('.hz-parallax-layer') as HTMLElement;
		expect(layer.getBoundingClientRect().width).toBeCloseTo(band.getBoundingClientRect().width, 0);
		expect(layer.getBoundingClientRect().height).toBeCloseTo(
			band.getBoundingClientRect().height,
			0
		);
		warnSpy.mockRestore();
	});

	it('x-only travel bleeds the inline axis only — the block axis stays exactly band-sized', () => {
		const warnSpy = silenceWarn();
		const { container } = render(Parallax, {
			style: 'width: 300px; height: 100px;',
			children: oneLayer({ x: '100px' })
		});
		const band = container.querySelector('.hz-parallax') as HTMLElement;
		const layer = container.querySelector('.hz-parallax-layer') as HTMLElement;
		expect(layer.getBoundingClientRect().height).toBeCloseTo(
			band.getBoundingClientRect().height,
			0
		);
		warnSpy.mockRestore();
	});

	it('negative travel bleeds identically to its positive counterpart (absolute value)', () => {
		const warnSpy = silenceWarn();
		const { container: posContainer } = render(Parallax, {
			style: 'width: 300px; height: 100px;',
			children: oneLayer({ x: '100px' })
		});
		const { container: negContainer } = render(Parallax, {
			style: 'width: 300px; height: 100px;',
			children: oneLayer({ x: '-100px' })
		});
		const posLayer = posContainer.querySelector('.hz-parallax-layer') as HTMLElement;
		const negLayer = negContainer.querySelector('.hz-parallax-layer') as HTMLElement;
		expect(negLayer.getBoundingClientRect().width).toBeCloseTo(
			posLayer.getBoundingClientRect().width,
			0
		);
		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// R5/R6 — Animation binding and reduced motion
// ---------------------------------------------------------------------------

describe('ParallaxLayer-R5/R6 — animation binding', () => {
	it('with travel set, exactly one animation is bound whose timeline is a ViewTimeline', () => {
		// Unsupported engine — pinned by parallax.spec.ts's source-text gate instead.
		if (typeof ViewTimeline === 'undefined') return;
		const warnSpy = silenceWarn();
		const { container } = render(ParallaxLayer, { x: 50, y: 20 });
		const layer = container.querySelector('.hz-parallax-layer') as HTMLElement;
		const animations = layer.getAnimations();
		expect(animations).toHaveLength(1);
		expect(animations[0].timeline).toBeInstanceOf(ViewTimeline);
		warnSpy.mockRestore();
	});

	it('under prefers-reduced-motion: reduce, no animation is bound and translate is neutral', async () => {
		await forceReducedMotion();
		const warnSpy = silenceWarn();
		const { container } = render(ParallaxLayer, { x: 50, y: 20 });
		const layer = container.querySelector('.hz-parallax-layer') as HTMLElement;
		expect(layer.getAnimations()).toHaveLength(0);
		expect(getComputedStyle(layer).translate).toBe('none');
		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// R10 — Dev warnings
// ---------------------------------------------------------------------------

describe('ParallaxLayer-R10 — dev warnings', () => {
	it('a layer rendered without a Parallax parent warns', () => {
		const warnSpy = silenceWarn();
		render(ParallaxLayer, { x: 40 });
		expect(
			warnSpy.mock.calls.some((c: unknown[]) => String(c[0]).includes('outside a <Parallax> band'))
		).toBe(true);
		warnSpy.mockRestore();
	});

	it('a zero-travel layer warns', () => {
		const warnSpy = silenceWarn();
		render(Parallax, { children: oneLayer({}) });
		expect(warnSpy.mock.calls.some((c: unknown[]) => String(c[0]).includes('never moves'))).toBe(
			true
		);
		warnSpy.mockRestore();
	});

	it('x="10%" warns (percentage travel)', () => {
		const warnSpy = silenceWarn();
		render(Parallax, { children: oneLayer({ x: '10%' }) });
		expect(warnSpy.mock.calls.some((c: unknown[]) => String(c[0]).includes('percentage'))).toBe(
			true
		);
		warnSpy.mockRestore();
	});

	it('a layer containing a <button> warns after mount (focusable content in a decorative layer)', async () => {
		const warnSpy = silenceWarn();
		render(Parallax, { children: oneLayer({ x: 40 }, buttonContent) });
		await tick();
		expect(
			warnSpy.mock.calls.some((c: unknown[]) => String(c[0]).includes('focusable content'))
		).toBe(true);
		warnSpy.mockRestore();
	});

	it('a well-formed layer (parented, non-zero length travel, no focusable content) warns not at all', async () => {
		const warnSpy = silenceWarn();
		render(Parallax, { children: oneLayer({ x: 40 }) });
		await tick();
		expect(warnSpy).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// R1 — Barrel export
// ---------------------------------------------------------------------------

describe('R1 — barrel export', () => {
	it('Parallax and ParallaxLayer are resolvable from $lib', async () => {
		const mod = await import('$lib');
		expect(mod.Parallax).toBeDefined();
		expect(mod.ParallaxLayer).toBeDefined();
	});
});
