import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { prefersReducedMotion } from 'svelte/motion';
import { createRawSnippet } from 'svelte';
import type { TocEntry } from '$lib/types';
import Toc from './Toc.svelte';

// ---------------------------------------------------------------------------
// Fixtures — real DOM, real browser (vitest-browser-svelte). `render()`'s
// beforeEach(cleanup) unmounts every component and removes ITS OWN container,
// but not elements a test appends to <body> directly (the Dropdown-R12
// precedent) — `attach()` tracks those for the afterEach below.
// ---------------------------------------------------------------------------

let attached: HTMLElement[] = [];

afterEach(() => {
	for (const el of attached) el.remove();
	attached = [];
	// A click near a far-below heading can trigger the browser's own
	// focus-follows-click scroll (independent of the component's own,
	// mockable, scrollIntoView call) — reset so it never bleeds into the
	// next test's initial scroll-spy computation.
	window.scrollTo(0, 0);
});

function attach(el: HTMLElement): HTMLElement {
	document.body.appendChild(el);
	attached.push(el);
	return el;
}

function heading(tag: string, text: string, id?: string): HTMLElement {
	const el = document.createElement(tag);
	el.textContent = text;
	if (id) el.id = id;
	return el;
}

/**
 * Pushes a heading well below the fold with an inline margin. The scroll-spy
 * tests need headings that are genuinely far apart in real layout — two
 * headings that just happen to sit within the same top-quarter-of-viewport
 * band both "qualify" at once, and a later incidental scroll (e.g. a
 * clicked link's native focus-follows-click scroll nudge) can legitimately
 * re-resolve the spy to a different, still-correct entry. Real vertical
 * separation removes that ambiguity.
 */
function farBelow(el: HTMLElement): HTMLElement {
	el.style.marginTop = '2000px';
	return el;
}

/** An <article> holding the given children, appended to <body> so offsetParent
 *  resolves and Toc can collect from it as an HTMLElement `container`. */
function article(...children: HTMLElement[]): HTMLElement {
	const el = document.createElement('article');
	for (const c of children) el.appendChild(c);
	return attach(el);
}

function tick(ms = 0): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

function parts(container: HTMLElement) {
	return {
		nav: container.querySelector('.hz-toc') as HTMLElement | null,
		title: container.querySelector('.hz-toc-title') as HTMLElement | null,
		trigger: container.querySelector('.hz-toc-trigger') as HTMLButtonElement | null,
		panel: container.querySelector('.hz-toc-panel') as HTMLElement | null,
		links: Array.from(container.querySelectorAll('.hz-toc-link')) as HTMLAnchorElement[]
	};
}

/** Substitutes `window.matchMedia` at the global (the Video.svelte.spec.ts
 *  mock shape) — returns a restore function. */
function mockMatchMedia(matches: boolean): () => void {
	const original = window.matchMedia;
	window.matchMedia = vi.fn().mockImplementation((query: string) => ({
		matches,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}));
	return () => {
		window.matchMedia = original;
	};
}

// render() can't carry every prop's exact literal type through — mirrors the
// Table/Carousel specs' note.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const T = Toc as any;

// ---------------------------------------------------------------------------
// R1 — collection
// ---------------------------------------------------------------------------

describe('R1 — collection', () => {
	it('collects only the configured levels, in document order', async () => {
		const art = article(heading('h2', 'One'), heading('h3', 'Sub'), heading('h2', 'Two'));
		const { container } = render(T, { container: art });
		await tick();
		expect(parts(container).links.map((a) => a.textContent?.trim())).toEqual(['One', 'Two']);
	});

	it('skips headings inside an `exclude` match', async () => {
		const skip = document.createElement('div');
		skip.className = 'skip-me';
		skip.appendChild(heading('h2', 'Hidden section'));
		const art = article(heading('h2', 'One'), skip, heading('h2', 'Two'));
		const { container } = render(T, { container: art, exclude: '.skip-me' });
		await tick();
		expect(parts(container).links.map((a) => a.textContent?.trim())).toEqual(['One', 'Two']);
	});

	it('skips headings inside any selector of an `exclude` array', async () => {
		const callout = document.createElement('div');
		callout.className = 'callout';
		callout.appendChild(heading('h2', 'Callout section'));
		const fig = document.createElement('figure');
		fig.className = 'figure';
		fig.appendChild(heading('h2', 'Figure section'));
		const art = article(
			heading('h2', 'One'),
			callout,
			heading('h2', 'Two'),
			fig,
			heading('h2', 'Three')
		);
		const { container } = render(T, { container: art, exclude: ['.callout', '.figure'] });
		await tick();
		expect(parts(container).links.map((a) => a.textContent?.trim())).toEqual([
			'One',
			'Two',
			'Three'
		]);
	});

	it('an empty or all-empty `exclude` array excludes nothing (never queries closest(""))', async () => {
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		// An empty array (and all-empty entries) collapses to '' — the guard must
		// skip closest() entirely rather than throw on an empty selector.
		const { container } = render(T, { container: art, exclude: ['', ''] });
		await tick();
		expect(parts(container).links.map((a) => a.textContent?.trim())).toEqual(['One', 'Two']);
	});

	it('skips hidden headings (offsetParent === null)', async () => {
		const hidden = document.createElement('div');
		hidden.style.display = 'none';
		hidden.appendChild(heading('h2', 'Collapsed panel'));
		const art = article(heading('h2', 'One'), hidden, heading('h2', 'Two'));
		const { container } = render(T, { container: art });
		await tick();
		expect(parts(container).links.map((a) => a.textContent?.trim())).toEqual(['One', 'Two']);
	});

	it('never collects headings injected inside its own root (self-exclusion)', async () => {
		const wrap = attach(document.createElement('div'));
		wrap.appendChild(heading('h2', 'Real one'));
		wrap.appendChild(heading('h2', 'Real two'));
		const { container } = render(T, { container: wrap, watch: true });
		await tick();
		const nav = parts(container).nav!;
		// Injected directly into the rendered Toc's own subtree, which lives
		// inside `wrap` — the observed container.
		nav.appendChild(heading('h2', 'Should never appear'));
		await tick(200); // watch debounce is >= 100ms
		expect(parts(container).links.map((a) => a.textContent?.trim())).toEqual([
			'Real one',
			'Real two'
		]);
	});

	it('dev-warns once and renders nothing when `container` matches no element', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { container } = render(T, { container: '.does-not-exist-anywhere' });
		await tick();
		expect(parts(container).nav).toBeNull();
		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('.does-not-exist-anywhere'));
		warnSpy.mockRestore();
	});

	it('dev-warns and uses the first element when `container` matches multiple', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const first = article(heading('h2', 'A'), heading('h2', 'B'));
		const second = article(heading('h2', 'C'), heading('h2', 'D'));
		first.className = 'dupe-target';
		second.className = 'dupe-target';
		const { container } = render(T, { container: '.dupe-target' });
		await tick();
		expect(parts(container).links.map((a) => a.textContent?.trim())).toEqual(['A', 'B']);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('2 elements'));
		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// R1 — autoId
// ---------------------------------------------------------------------------

describe('R1 — autoId', () => {
	it('slugifies id-less headings (kebab case)', async () => {
		const h = heading('h2', 'Getting Started!!');
		const art = article(h, heading('h2', 'Second'));
		render(T, { container: art });
		await tick();
		expect(h.id).toBe('getting-started');
	});

	it('dedupes identical-text headings within a single collection pass', async () => {
		const a = heading('h2', 'Usage');
		const b = heading('h2', 'Usage');
		const c = heading('h2', 'Usage');
		const art = article(a, b, c);
		render(T, { container: art });
		await tick();
		expect([a.id, b.id, c.id]).toEqual(['usage', 'usage-2', 'usage-3']);
	});

	it('never re-slugs an existing id; the label still updates on re-collect', async () => {
		const h = heading('h2', 'Original label', 'my-stable-id');
		const art = article(h, heading('h2', 'Other'));
		const result = render(T, { container: art });
		await tick();
		expect(h.id).toBe('my-stable-id');

		h.textContent = 'Updated label';
		result.component.refresh();
		await tick();
		expect(h.id).toBe('my-stable-id');
		expect(parts(result.container).links[0].textContent?.trim()).toBe('Updated label');
	});

	it('autoId={false} skips id-less headings instead of generating one', async () => {
		const withId = heading('h2', 'Has id', 'has-id');
		const withoutId = heading('h2', 'No id');
		const another = heading('h2', 'Also has id', 'also-has-id');
		const art = article(withId, withoutId, another);
		const { container } = render(T, { container: art, autoId: false });
		await tick();
		expect(withoutId.id).toBe('');
		expect(parts(container).links.map((a) => a.textContent?.trim())).toEqual([
			'Has id',
			'Also has id'
		]);
	});
});

// ---------------------------------------------------------------------------
// R1 — nesting
// ---------------------------------------------------------------------------

describe('R1 — nesting', () => {
	it('nests deeper levels under the nearest preceding shallower entry', async () => {
		const art = article(
			heading('h2', 'Getting started'),
			heading('h3', 'Install'),
			heading('h3', 'Configure'),
			heading('h2', 'Advanced')
		);
		const { container } = render(T, { container: art, levels: [2, 3] });
		await tick();
		const topLists = container.querySelectorAll('.hz-toc-panel > .hz-toc-list > li');
		expect(topLists).toHaveLength(2);
		const firstItemSublist = topLists[0].querySelector(':scope > .hz-toc-list > li');
		expect(firstItemSublist).not.toBeNull();
		expect(topLists[0].querySelectorAll(':scope > .hz-toc-list > li')).toHaveLength(2);
	});

	it('an orphan deep heading (h3 before any h2) attaches at the top level', async () => {
		const art = article(
			heading('h3', 'Orphan'),
			heading('h2', 'First real section'),
			heading('h2', 'Second real section')
		);
		const { container } = render(T, { container: art, levels: [2, 3] });
		await tick();
		const topItems = container.querySelectorAll('.hz-toc-panel > .hz-toc-list > li');
		expect(topItems).toHaveLength(3);
		expect(topItems[0].querySelector(':scope > .hz-toc-link')?.textContent?.trim()).toBe('Orphan');
	});

	it('levels={[3]} renders a flat list — no phantom h2 nesting', async () => {
		const art = article(heading('h3', 'One'), heading('h3', 'Two'), heading('h3', 'Three'));
		const { container } = render(T, { container: art, levels: [3] });
		await tick();
		const topItems = container.querySelectorAll('.hz-toc-panel > .hz-toc-list > li');
		expect(topItems).toHaveLength(3);
		for (const li of topItems) {
			expect(li.querySelector(':scope > .hz-toc-list')).toBeNull();
		}
	});
});

// ---------------------------------------------------------------------------
// minEntries
// ---------------------------------------------------------------------------

describe('minEntries', () => {
	it('renders nothing (no landmark) below minEntries', async () => {
		const art = article(heading('h2', 'Only one'));
		const { container } = render(T, { container: art });
		await tick();
		expect(parts(container).nav).toBeNull();
	});

	it('renders once entries reach minEntries', async () => {
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const { container } = render(T, { container: art });
		await tick();
		expect(parts(container).nav).not.toBeNull();
	});

	it('a custom minEntries raises the floor', async () => {
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const { container } = render(T, { container: art, minEntries: 3 });
		await tick();
		expect(parts(container).nav).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R2 — watch / refresh
// ---------------------------------------------------------------------------

describe('R2 — watch / refresh', () => {
	it('a DOM mutation is picked up (debounced) when watch is true', async () => {
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const { container } = render(T, { container: art, watch: true });
		await tick();
		expect(parts(container).links).toHaveLength(2);

		art.appendChild(heading('h2', 'Three'));
		// Immediately after the mutation, the debounce hasn't fired yet.
		await tick(30);
		expect(parts(container).links).toHaveLength(2);

		await tick(200);
		expect(parts(container).links.map((a) => a.textContent?.trim())).toEqual([
			'One',
			'Two',
			'Three'
		]);
	});

	it('watch=false never re-collects on its own; refresh() does it manually', async () => {
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const result = render(T, { container: art, watch: false });
		await tick();
		expect(parts(result.container).links).toHaveLength(2);

		art.appendChild(heading('h2', 'Three'));
		await tick(200);
		expect(parts(result.container).links).toHaveLength(2);

		result.component.refresh();
		await tick();
		expect(parts(result.container).links).toHaveLength(3);
	});
});

// ---------------------------------------------------------------------------
// R3 — active / onActive
// ---------------------------------------------------------------------------

describe('R3 — active state', () => {
	it('clicking a link sets `active` immediately and marks aria-current', async () => {
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const scrollSpy = vi
			.spyOn(HTMLElement.prototype, 'scrollIntoView')
			.mockImplementation(() => {});
		const { container } = render(T, { container: art });
		await tick();
		const { links } = parts(container);
		links[1].click();
		await tick();
		expect(links[1].getAttribute('aria-current')).toBe('location');
		expect(links[0].hasAttribute('aria-current')).toBe(false);
		scrollSpy.mockRestore();
	});

	it('onActive fires only on change, not repeatedly for the same value', async () => {
		// Driven by real window scrolling rather than a click — a click's own
		// native focus-follows-click scroll runs across several animation
		// frames with intermediate positions of its own, which is exactly the
		// multi-fire behavior this test is trying to rule out.
		const art = article(heading('h2', 'One'), farBelow(heading('h2', 'Two')));
		const onActive = vi.fn();
		render(T, { container: art, onActive });
		await tick();
		onActive.mockClear();

		window.scrollTo(0, 1900); // brings 'Two' to/above the top-quarter threshold
		await tick(50);
		window.scrollTo(0, 1950); // still resolves to 'Two' — must not re-fire
		await tick(50);

		expect(onActive).toHaveBeenCalledTimes(1);
		expect(onActive).toHaveBeenCalledWith('two');
	});

	it('active falls back to a surviving entry when the active heading is removed', async () => {
		const h1 = heading('h2', 'One');
		const h2 = heading('h2', 'Two');
		const art = article(h1, h2);
		const scrollSpy = vi
			.spyOn(HTMLElement.prototype, 'scrollIntoView')
			.mockImplementation(() => {});
		const result = render(T, { container: art, watch: false });
		await tick();
		parts(result.container).links[1].click();
		await tick();
		expect(parts(result.container).links[1].getAttribute('aria-current')).toBe('location');

		// Remove the active heading and the sibling needed to stay >= minEntries,
		// then add a replacement so the rail keeps rendering — refresh()
		// recomputes fresh from the surviving headings and the current scroll
		// position, never from a memoized stale id.
		h2.remove();
		art.appendChild(heading('h2', 'Three'));
		result.component.refresh();
		await tick();
		const survivors = parts(result.container).links.map((a) => a.textContent?.trim());
		expect(survivors).toEqual(['One', 'Three']);
		// No crash, and exactly one (or zero) entries carry aria-current — never
		// pointing at a removed id.
		const currentCount = parts(result.container).links.filter(
			(a) => a.getAttribute('aria-current') === 'location'
		).length;
		expect(currentCount).toBeLessThanOrEqual(1);
		scrollSpy.mockRestore();
	});

	it('tracks scroll position against a nested overflow:auto container, not the window', async () => {
		// `container` living inside its own scrollable region (a demo pane, a
		// modal body, …) — the window's threshold/bottom-of-page pin would be
		// meaningless here, since the region's own box never moves; only its
		// content scrolls. Geometry is pinned with inline styles so the test
		// doesn't depend on font-metric heights.
		const box = attach(document.createElement('div'));
		Object.assign(box.style, { overflowY: 'auto', height: '100px' });
		const h1 = heading('h2', 'One');
		const h2 = heading('h2', 'Two');
		Object.assign(h1.style, { height: '20px', margin: '0 0 300px 0' });
		Object.assign(h2.style, { height: '20px', margin: '0' });
		box.append(h1, h2);

		const { container } = render(T, { container: box });
		await tick();
		expect(parts(container).links[0].getAttribute('aria-current')).toBe('location');

		// Scroll the CONTAINER's own bottom — the window never moves.
		box.scrollTop = box.scrollHeight - box.clientHeight;
		box.dispatchEvent(new Event('scroll'));
		await tick(50);

		expect(parts(container).links[1].getAttribute('aria-current')).toBe('location');
	});
});

// ---------------------------------------------------------------------------
// R4 — smooth scroll / reduced motion
// ---------------------------------------------------------------------------

describe('R4 — smooth scroll', () => {
	it('scrolls smoothly by default', async () => {
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const scrollSpy = vi
			.spyOn(HTMLElement.prototype, 'scrollIntoView')
			.mockImplementation(() => {});
		const { container } = render(T, { container: art });
		await tick();
		parts(container).links[1].click();
		await tick();
		expect(scrollSpy).toHaveBeenCalledWith(
			expect.objectContaining({ behavior: 'smooth', block: 'start' })
		);
		scrollSpy.mockRestore();
	});

	it('smoothScroll={false} scrolls instantly', async () => {
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const scrollSpy = vi
			.spyOn(HTMLElement.prototype, 'scrollIntoView')
			.mockImplementation(() => {});
		const { container } = render(T, { container: art, smoothScroll: false });
		await tick();
		parts(container).links[1].click();
		await tick();
		expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
		scrollSpy.mockRestore();
	});

	it('prefers-reduced-motion scrolls instantly even with smoothScroll true', async () => {
		const reducedMotionSpy = vi.spyOn(prefersReducedMotion, 'current', 'get').mockReturnValue(true);
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const scrollSpy = vi
			.spyOn(HTMLElement.prototype, 'scrollIntoView')
			.mockImplementation(() => {});
		const { container } = render(T, { container: art, smoothScroll: true });
		await tick();
		parts(container).links[1].click();
		await tick();
		expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
		scrollSpy.mockRestore();
		reducedMotionSpy.mockRestore();
	});

	it('updates the URL hash via replaceState, preserving history.state, without pushing history', async () => {
		// A marker on history.state proves the component passes it through
		// rather than clearing it (history.replaceState(null, …) would nuke a
		// host router's own state, e.g. SvelteKit's).
		history.replaceState({ marker: 'preserved' }, '');
		const art = article(heading('h2', 'One'), heading('h2', 'Two', 'target-two'));
		const scrollSpy = vi
			.spyOn(HTMLElement.prototype, 'scrollIntoView')
			.mockImplementation(() => {});
		const pushSpy = vi.spyOn(history, 'pushState');
		const { container } = render(T, { container: art });
		await tick();
		parts(container).links[1].click();
		await tick();
		expect(location.hash).toBe('#target-two');
		expect(history.state).toEqual({ marker: 'preserved' });
		expect(pushSpy).not.toHaveBeenCalled();
		scrollSpy.mockRestore();
		pushSpy.mockRestore();
		history.replaceState(null, '', location.pathname + location.search);
	});

	it('clicking scrolls only the nested container, never the page', async () => {
		// Native scrollIntoView would cascade up to the page too if the
		// container's own box isn't already fully in view — undesirable when
		// a reader is deliberately scrolling a bounded region (a demo pane, a
		// modal body) in isolation.
		const box = attach(document.createElement('div'));
		Object.assign(box.style, { overflowY: 'auto', height: '100px' });
		const h1 = heading('h2', 'One');
		const h2 = heading('h2', 'Two');
		Object.assign(h1.style, { height: '20px', margin: '0 0 300px 0' });
		Object.assign(h2.style, { height: '20px', margin: '0' });
		box.append(h1, h2);
		const scrollIntoViewSpy = vi
			.spyOn(HTMLElement.prototype, 'scrollIntoView')
			.mockImplementation(() => {});
		const scrollToSpy = vi.spyOn(HTMLElement.prototype, 'scrollTo').mockImplementation(() => {});
		const windowScrollYBefore = window.scrollY;

		const { container } = render(T, { container: box, smoothScroll: false });
		await tick();
		parts(container).links[1].click();
		await tick();

		expect(scrollToSpy).toHaveBeenCalledWith(
			expect.objectContaining({ top: expect.any(Number), behavior: 'auto' })
		);
		expect(scrollIntoViewSpy).not.toHaveBeenCalled();
		expect(window.scrollY).toBe(windowScrollYBefore);
		scrollIntoViewSpy.mockRestore();
		scrollToSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// R6 — collapse disclosure a11y
// ---------------------------------------------------------------------------

describe('R6 — collapse disclosure', () => {
	it('breakpoint="none" (default): no data-collapsed is stamped', async () => {
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const { container } = render(T, { container: art });
		await tick();
		expect(parts(container).nav!.hasAttribute('data-collapsed')).toBe(false);
	});

	it('clicking the trigger toggles aria-expanded and data-collapsed', async () => {
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const { container } = render(T, { container: art, breakpoint: 'md' });
		await tick();
		const { nav, trigger } = parts(container);
		expect(trigger!.getAttribute('aria-expanded')).toBe('false');
		expect(nav!.hasAttribute('data-collapsed')).toBe(true);

		trigger!.click();
		await tick();
		expect(parts(container).trigger!.getAttribute('aria-expanded')).toBe('true');
		expect(parts(container).nav!.hasAttribute('data-collapsed')).toBe(false);
	});

	it('Escape closes the panel and returns focus to the trigger', async () => {
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const { container } = render(T, { container: art, breakpoint: 'md' });
		await tick();
		const { trigger, panel } = parts(container);
		trigger!.click();
		await tick();
		panel!.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
		);
		await tick();
		expect(parts(container).trigger!.getAttribute('aria-expanded')).toBe('false');
		expect(document.activeElement).toBe(parts(container).trigger);
	});

	it('an outside click closes the panel without stealing focus', async () => {
		const outside = attach(document.createElement('button'));
		outside.textContent = 'outside';
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const { container } = render(T, { container: art, breakpoint: 'md' });
		await tick();
		const { trigger } = parts(container);
		trigger!.click();
		await tick();
		expect(parts(container).trigger!.getAttribute('aria-expanded')).toBe('true');

		// A real, trusted click (Dropdown-R12 precedent) — its native default
		// action focuses `outside`; a script-invoked .click() does not
		// reliably do that, and the assertion below needs it to.
		await userEvent.click(outside);
		await tick();
		expect(parts(container).trigger!.getAttribute('aria-expanded')).toBe('false');
		expect(document.activeElement).toBe(outside);
	});

	it('selecting an entry closes the panel', async () => {
		const scrollSpy = vi
			.spyOn(HTMLElement.prototype, 'scrollIntoView')
			.mockImplementation(() => {});
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const { container } = render(T, { container: art, breakpoint: 'md' });
		await tick();
		const { trigger } = parts(container);
		trigger!.click();
		await tick();
		expect(parts(container).trigger!.getAttribute('aria-expanded')).toBe('true');

		parts(container).links[1].click();
		await tick();
		expect(parts(container).trigger!.getAttribute('aria-expanded')).toBe('false');
		scrollSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// R5 — markup + a11y
// ---------------------------------------------------------------------------

describe('R5 — markup', () => {
	it('renders <nav class="hz-toc" aria-label> with a title and a link list', async () => {
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const { container } = render(T, { container: art, title: 'Contents' });
		await tick();
		const { nav, title } = parts(container);
		expect(nav!.tagName).toBe('NAV');
		expect(nav!.getAttribute('aria-label')).toBe('Contents');
		expect(title!.tagName).toBe('P');
		expect(title!.textContent).toBe('Contents');
	});

	it('ariaLabel defaults to `title`; an explicit ariaLabel overrides it', async () => {
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const { container } = render(T, { container: art, title: 'On this page' });
		await tick();
		expect(parts(container).nav!.getAttribute('aria-label')).toBe('On this page');

		const art2 = article(heading('h2', 'A'), heading('h2', 'B'));
		const { container: c2 } = render(T, {
			container: art2,
			title: 'On this page',
			ariaLabel: 'Jump to section'
		});
		await tick();
		expect(parts(c2).nav!.getAttribute('aria-label')).toBe('Jump to section');
	});

	it('title="" hides the title but the nav still renders', async () => {
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const { container } = render(T, { container: art, title: '' });
		await tick();
		const { nav, title } = parts(container);
		expect(nav).not.toBeNull();
		expect(title).toBeNull();
	});

	it('links carry data-level matching the collected heading level', async () => {
		const art = article(heading('h2', 'One'), heading('h3', 'Sub'));
		const { container } = render(T, { container: art, levels: [2, 3] });
		await tick();
		const { links } = parts(container);
		expect(links[0].getAttribute('data-level')).toBe('2');
		expect(links[1].getAttribute('data-level')).toBe('3');
	});
});

// ---------------------------------------------------------------------------
// specs/64 R5 — measured mode: a number `breakpoint` collapses off a
// reactive `MediaQuery` against the viewport instead of the literal-px
// @media queries.
// ---------------------------------------------------------------------------

describe('R5 — measured mode (breakpoint as a number)', () => {
	it('a non-matching query gives data-breakpoint="custom" + data-narrow; trigger visible, title hidden', async () => {
		const restore = mockMatchMedia(false);
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const { container } = render(T, { container: art, breakpoint: 668 });
		await tick();
		const { nav, trigger, title } = parts(container);
		expect(nav!.getAttribute('data-breakpoint')).toBe('custom');
		expect(nav!.hasAttribute('data-narrow')).toBe(true);
		expect(getComputedStyle(trigger!).display).toBe('flex');
		expect(getComputedStyle(title!).display).toBe('none');
		restore();
	});

	it('a matching query drops data-narrow', async () => {
		const restore = mockMatchMedia(true);
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const { container } = render(T, { container: art, breakpoint: 668 });
		await tick();
		expect(parts(container).nav!.hasAttribute('data-narrow')).toBe(false);
		restore();
	});

	it("an invalid number (0) behaves as 'none': no data-narrow, no data-collapsed, one DEV warn", async () => {
		const restore = mockMatchMedia(false);
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const { container } = render(T, { container: art, breakpoint: 0 });
		await tick();
		const { nav } = parts(container);
		expect(nav!.getAttribute('data-breakpoint')).toBe('none');
		expect(nav!.hasAttribute('data-narrow')).toBe(false);
		expect(nav!.hasAttribute('data-collapsed')).toBe(false);
		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy.mock.calls[0][0]).toContain('breakpoint');
		warnSpy.mockRestore();
		restore();
	});
});

// ---------------------------------------------------------------------------
// specs/64 R8/R9 — the `entry` snippet: replaces link content only, at every
// nesting depth; every wire the component owns (href, data-level,
// aria-current, click-to-scroll) stays untouched.
// ---------------------------------------------------------------------------

describe('R8/R9 — entry snippet', () => {
	it('replaces link content at the top level and one level down; href/data-level are unaffected', async () => {
		const entrySnippet = createRawSnippet<[TocEntry, boolean]>((getEntry) => ({
			render: () =>
				`<span data-testid="entry-${getEntry().id}">${getEntry().label.toUpperCase()}</span>`
		}));
		const art = article(heading('h2', 'One'), heading('h3', 'Sub'));
		const { container } = render(T, { container: art, levels: [2, 3], entry: entrySnippet });
		await tick();
		const { links } = parts(container);
		expect(links[0].querySelector('[data-testid="entry-one"]')?.textContent).toBe('ONE');
		expect(links[1].querySelector('[data-testid="entry-sub"]')?.textContent).toBe('SUB');
		expect(links[0].getAttribute('href')).toBe('#one');
		expect(links[1].getAttribute('data-level')).toBe('3');
	});

	it('aria-current is still set by the component; click still scrolls and updates active', async () => {
		const scrollSpy = vi
			.spyOn(HTMLElement.prototype, 'scrollIntoView')
			.mockImplementation(() => {});
		const entrySnippet = createRawSnippet<[TocEntry, boolean]>((getEntry) => ({
			render: () => `<span>${getEntry().label}</span>`
		}));
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const { container } = render(T, { container: art, entry: entrySnippet });
		await tick();
		const { links } = parts(container);
		links[1].click();
		await tick();
		expect(links[1].getAttribute('aria-current')).toBe('location');
		expect(links[0].hasAttribute('aria-current')).toBe(false);
		expect(scrollSpy).toHaveBeenCalled();
		scrollSpy.mockRestore();
	});

	it('the second argument is true only for the active entry', async () => {
		const scrollSpy = vi
			.spyOn(HTMLElement.prototype, 'scrollIntoView')
			.mockImplementation(() => {});
		const entrySnippet = createRawSnippet<[TocEntry, boolean]>((getEntry, getActive) => ({
			render: () => `<span data-active="${getActive()}">${getEntry().label}</span>`
		}));
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const { container } = render(T, { container: art, entry: entrySnippet });
		await tick();
		const { links } = parts(container);
		links[1].click();
		await tick();
		expect(links[0].querySelector('span')?.getAttribute('data-active')).toBe('false');
		expect(links[1].querySelector('span')?.getAttribute('data-active')).toBe('true');
		scrollSpy.mockRestore();
	});

	it('the first argument is a flat entry — no `children` key', async () => {
		let keys: string[] = [];
		const entrySnippet = createRawSnippet<[TocEntry, boolean]>((getEntry) => ({
			render: () => {
				keys = Object.keys(getEntry());
				return `<span>x</span>`;
			}
		}));
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		render(T, { container: art, entry: entrySnippet });
		await tick();
		expect(keys).toEqual(['id', 'label', 'level']);
	});

	it('absent: link content is exactly the label, DOM identical to today', async () => {
		const art = article(heading('h2', 'One'), heading('h2', 'Two'));
		const { container } = render(T, { container: art });
		await tick();
		expect(parts(container).links.map((a) => a.textContent?.trim())).toEqual(['One', 'Two']);
	});
});

// ---------------------------------------------------------------------------
// Barrel export
// ---------------------------------------------------------------------------

describe('Toc — barrel export', () => {
	it('is resolvable from $lib', async () => {
		const mod = await import('$lib');
		expect(mod.Toc).toBeDefined();
	});
});
