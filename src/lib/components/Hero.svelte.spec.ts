import { page } from 'vitest/browser';
import { describe, expect, it, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Hero from './Hero.svelte';

// ---------------------------------------------------------------------------
// Snippet helpers
// ---------------------------------------------------------------------------

const eyebrowSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="eyebrow-content">Eyebrow</span>`
}));

const titleSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="title-content">Hero Title</span>`
}));

const subtitleSnippet = createRawSnippet(() => ({
	render: () => `<p data-testid="subtitle-content">Subtitle text</p>`
}));

const actionsSnippet = createRawSnippet(() => ({
	render: () => `<button data-testid="action-btn">CTA</button>`
}));

const mediaSnippet = createRawSnippet(() => ({
	render: () => `<img data-testid="media-content" src="" alt="hero media" />`
}));

// The background is no longer its own prop: in overlay layout the media
// snippet renders into .hz-hero-background instead of .hz-hero-media.

// ---------------------------------------------------------------------------
// Hero-R1 — Root
// ---------------------------------------------------------------------------

describe('Hero-R1 — root', () => {
	it('renders <section class="hz-hero">', () => {
		const { container } = render(Hero, {});
		expect(container.querySelector('section.hz-hero')).not.toBeNull();
	});

	it('no role attribute on the root section', () => {
		const { container } = render(Hero, {});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(hero.getAttribute('role')).toBeNull();
	});

	it('default: data-layout="center"', () => {
		const { container } = render(Hero, {});
		expect(container.querySelector('.hz-hero')!.getAttribute('data-layout')).toBe('center');
	});

	it('default: data-height="auto"', () => {
		const { container } = render(Hero, {});
		expect(container.querySelector('.hz-hero')!.getAttribute('data-height')).toBe('auto');
	});

	it('default: data-align="center"', () => {
		const { container } = render(Hero, {});
		expect(container.querySelector('.hz-hero')!.getAttribute('data-align')).toBe('center');
	});

	it('default: data-reverse-on-mobile absent', () => {
		const { container } = render(Hero, {});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(hero.hasAttribute('data-reverse-on-mobile')).toBe(false);
	});

	it('reverseOnMobile=true → data-reverse-on-mobile present (empty-valued)', () => {
		const { container } = render(Hero, { reverseOnMobile: true });
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(hero.hasAttribute('data-reverse-on-mobile')).toBe(true);
		expect(hero.getAttribute('data-reverse-on-mobile')).toBe('');
	});

	it.each(['center', 'split', 'overlay'] as const)('layout="%s" → data-layout="%s"', (layout) => {
		const { container } = render(Hero, { layout });
		expect(container.querySelector('.hz-hero')!.getAttribute('data-layout')).toBe(layout);
	});

	it.each(['auto', 'screen', 'half'] as const)('height="%s" → data-height="%s"', (height) => {
		const { container } = render(Hero, { height });
		expect(container.querySelector('.hz-hero')!.getAttribute('data-height')).toBe(height);
	});

	it.each(['start', 'center', 'end'] as const)('align="%s" → data-align="%s"', (align) => {
		const { container } = render(Hero, { align });
		expect(container.querySelector('.hz-hero')!.getAttribute('data-align')).toBe(align);
	});
});

// ---------------------------------------------------------------------------
// Hero-R2 — Content region
// ---------------------------------------------------------------------------

describe('Hero-R2 — content region', () => {
	it('eyebrow provided → .hz-hero-content and .hz-hero-eyebrow rendered', () => {
		const { container } = render(Hero, { eyebrow: eyebrowSnippet });
		expect(container.querySelector('.hz-hero-content')).not.toBeNull();
		expect(container.querySelector('.hz-hero-eyebrow')).not.toBeNull();
	});

	it('title provided → .hz-hero-content rendered', () => {
		const { container } = render(Hero, { title: titleSnippet });
		expect(container.querySelector('.hz-hero-content')).not.toBeNull();
	});

	it('subtitle provided → .hz-hero-content and .hz-hero-subtitle rendered', () => {
		const { container } = render(Hero, { subtitle: subtitleSnippet });
		expect(container.querySelector('.hz-hero-content')).not.toBeNull();
		expect(container.querySelector('.hz-hero-subtitle')).not.toBeNull();
	});

	it('actions provided → .hz-hero-content and .hz-hero-actions rendered', () => {
		const { container } = render(Hero, { actions: actionsSnippet });
		expect(container.querySelector('.hz-hero-content')).not.toBeNull();
		expect(container.querySelector('.hz-hero-actions')).not.toBeNull();
	});

	it('no content snippets → no .hz-hero-content rendered', () => {
		const { container } = render(Hero, {});
		expect(container.querySelector('.hz-hero-content')).toBeNull();
	});

	it('media only (no content snippets) → no .hz-hero-content', () => {
		const { container } = render(Hero, {
			media: mediaSnippet
		});
		expect(container.querySelector('.hz-hero-content')).toBeNull();
	});

	it('eyebrow absent → no .hz-hero-eyebrow (even when title present)', () => {
		const { container } = render(Hero, { title: titleSnippet });
		expect(container.querySelector('.hz-hero-eyebrow')).toBeNull();
	});

	it('subtitle absent → no .hz-hero-subtitle (even when title present)', () => {
		const { container } = render(Hero, { title: titleSnippet });
		expect(container.querySelector('.hz-hero-subtitle')).toBeNull();
	});

	it('actions absent → no .hz-hero-actions (even when title present)', () => {
		const { container } = render(Hero, { title: titleSnippet });
		expect(container.querySelector('.hz-hero-actions')).toBeNull();
	});

	it('all four content snippets present → all four wrappers inside .hz-hero-content', () => {
		const { container } = render(Hero, {
			eyebrow: eyebrowSnippet,
			title: titleSnippet,
			subtitle: subtitleSnippet,
			actions: actionsSnippet
		});
		const content = container.querySelector('.hz-hero-content') as HTMLElement;
		expect(content.querySelector('.hz-hero-eyebrow')).not.toBeNull();
		expect(content.querySelector('.hz-hero-title')).not.toBeNull();
		expect(content.querySelector('.hz-hero-subtitle')).not.toBeNull();
		expect(content.querySelector('.hz-hero-actions')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Hero-R3 — Media region
// ---------------------------------------------------------------------------

describe('Hero-R3 — media region', () => {
	it('media snippet provided → .hz-hero-media rendered', () => {
		const { container } = render(Hero, { media: mediaSnippet });
		expect(container.querySelector('.hz-hero-media')).not.toBeNull();
	});

	it('media snippet absent → no .hz-hero-media element', () => {
		const { container } = render(Hero, {});
		expect(container.querySelector('.hz-hero-media')).toBeNull();
	});

	it('media absent → no error (hero renders fine)', () => {
		const { container } = render(Hero, { title: titleSnippet });
		expect(container.querySelector('.hz-hero')).not.toBeNull();
	});

	it('media content renders inside .hz-hero-media', () => {
		const { container } = render(Hero, { media: mediaSnippet });
		const mediaEl = container.querySelector('.hz-hero-media') as HTMLElement;
		expect(mediaEl.querySelector('[data-testid="media-content"]')).not.toBeNull();
	});

	it('overlay: media renders as the background, not as .hz-hero-media', () => {
		const { container } = render(Hero, {
			layout: 'overlay',
			media: mediaSnippet
		});
		expect(container.querySelector('.hz-hero-media')).toBeNull();
		expect(container.querySelector('.hz-hero-background')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Hero-R4 — Background region
// ---------------------------------------------------------------------------

describe('Hero-R4 — background region (overlay media)', () => {
	it('overlay + media → .hz-hero-background rendered', () => {
		const { container } = render(Hero, { layout: 'overlay', media: mediaSnippet });
		expect(container.querySelector('.hz-hero-background')).not.toBeNull();
	});

	it('media absent → no .hz-hero-background element (overlay)', () => {
		const { container } = render(Hero, { layout: 'overlay' });
		expect(container.querySelector('.hz-hero-background')).toBeNull();
	});

	it('non-overlay layouts never render .hz-hero-background', () => {
		for (const layout of ['center', 'split'] as const) {
			const { container } = render(Hero, { layout, media: mediaSnippet });
			expect(container.querySelector('.hz-hero-background')).toBeNull();
			expect(container.querySelector('.hz-hero-media')).not.toBeNull();
		}
	});

	it('media content renders inside .hz-hero-background (overlay)', () => {
		const { container } = render(Hero, { layout: 'overlay', media: mediaSnippet });
		const bgEl = container.querySelector('.hz-hero-background') as HTMLElement;
		expect(bgEl.querySelector('[data-testid="media-content"]')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Hero-R5 — DOM order (background first; content before media)
// ---------------------------------------------------------------------------

describe('Hero-R5 — DOM order', () => {
	it('background is the first child of the root (overlay + media)', () => {
		const { container } = render(Hero, {
			layout: 'overlay',
			title: titleSnippet,
			media: mediaSnippet
		});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		const firstChild = hero.firstElementChild as HTMLElement;
		expect(firstChild.classList.contains('hz-hero-background')).toBe(true);
	});

	it('center layout: content precedes media in DOM', () => {
		const { container } = render(Hero, {
			layout: 'center',
			title: titleSnippet,
			media: mediaSnippet
		});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		const kids = Array.from(hero.children);
		const contentIdx = kids.findIndex((el) => el.classList.contains('hz-hero-content'));
		const mediaIdx = kids.findIndex((el) => el.classList.contains('hz-hero-media'));
		expect(contentIdx).toBeGreaterThanOrEqual(0);
		expect(mediaIdx).toBeGreaterThanOrEqual(0);
		expect(contentIdx).toBeLessThan(mediaIdx);
	});

	it('overlay layout: background precedes content in DOM; no .hz-hero-media', () => {
		const { container } = render(Hero, {
			layout: 'overlay',
			title: titleSnippet,
			media: mediaSnippet
		});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		const kids = Array.from(hero.children);
		const bgIdx = kids.findIndex((el) => el.classList.contains('hz-hero-background'));
		const contentIdx = kids.findIndex((el) => el.classList.contains('hz-hero-content'));
		expect(bgIdx).toBe(0);
		expect(container.querySelector('.hz-hero-media')).toBeNull();
		expect(contentIdx).toBeGreaterThan(bgIdx);
	});

	it('split layout: content precedes media inside .hz-split-layout in DOM', () => {
		const { container } = render(Hero, {
			layout: 'split',
			title: titleSnippet,
			media: mediaSnippet
		});
		const split = container.querySelector('.hz-split-layout') as HTMLElement;
		const kids = Array.from(split.children);
		const contentIdx = kids.findIndex((el) => el.classList.contains('hz-hero-content'));
		const mediaIdx = kids.findIndex((el) => el.classList.contains('hz-hero-media'));
		expect(contentIdx).toBeGreaterThanOrEqual(0);
		expect(mediaIdx).toBeGreaterThanOrEqual(0);
		expect(contentIdx).toBeLessThan(mediaIdx);
	});
});

// ---------------------------------------------------------------------------
// Hero-R6 — Title heading element
// ---------------------------------------------------------------------------

describe('Hero-R6 — title heading', () => {
	it('title provided → <h1 class="hz-hero-title" id="hz-hero-title-{n}">', () => {
		const { container } = render(Hero, { title: titleSnippet });
		const h1 = container.querySelector('h1.hz-hero-title') as HTMLElement;
		expect(h1).not.toBeNull();
		expect(h1.id).toMatch(/^hz-hero-title-\d+$/);
	});

	it('headingLevel=3 → <h3 class="hz-hero-title" id="hz-hero-title-{n}">', () => {
		const { container } = render(Hero, { title: titleSnippet, headingLevel: 3 });
		const h3 = container.querySelector('h3.hz-hero-title') as HTMLElement;
		expect(h3).not.toBeNull();
		expect(h3.id).toMatch(/^hz-hero-title-\d+$/);
	});

	it.each([2, 4, 5, 6] as const)('headingLevel=%i → correct heading tag', (headingLevel) => {
		const { container } = render(Hero, { title: titleSnippet, headingLevel });
		expect(container.querySelector(`h${headingLevel}.hz-hero-title`)).not.toBeNull();
	});

	it('no title → no heading element rendered', () => {
		const { container } = render(Hero, { eyebrow: eyebrowSnippet });
		expect(container.querySelector('[class="hz-hero-title"]')).toBeNull();
		expect(container.querySelector('h1')).toBeNull();
	});

	it('title content renders inside the heading element', () => {
		const { container } = render(Hero, { title: titleSnippet });
		const h1 = container.querySelector('h1.hz-hero-title') as HTMLElement;
		expect(h1.querySelector('[data-testid="title-content"]')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Hero-R7 — Accessible name (aria-labelledby / aria-label)
// ---------------------------------------------------------------------------

describe('Hero-R7 — accessible name', () => {
	it('title provided → aria-labelledby on root matches heading id', () => {
		const { container } = render(Hero, { title: titleSnippet });
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		const h1 = container.querySelector('h1.hz-hero-title') as HTMLElement;
		expect(hero.getAttribute('aria-labelledby')).toBe(h1.id);
	});

	it('no title + ariaLabel set → aria-label on root, no aria-labelledby', () => {
		const { container } = render(Hero, { ariaLabel: 'Featured section' });
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(hero.getAttribute('aria-label')).toBe('Featured section');
		expect(hero.hasAttribute('aria-labelledby')).toBe(false);
	});

	it('title + ariaLabel both set → aria-labelledby present, aria-label NOT rendered', () => {
		const { container } = render(Hero, {
			title: titleSnippet,
			ariaLabel: 'Should be ignored'
		});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(hero.hasAttribute('aria-labelledby')).toBe(true);
		expect(hero.hasAttribute('aria-label')).toBe(false);
	});

	it('neither title nor ariaLabel → no aria-labelledby and no aria-label', () => {
		const { container } = render(Hero, {});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(hero.hasAttribute('aria-labelledby')).toBe(false);
		expect(hero.hasAttribute('aria-label')).toBe(false);
	});

	it('eyebrow/subtitle/actions without title → no heading; labeling falls to ariaLabel', () => {
		const { container } = render(Hero, {
			eyebrow: eyebrowSnippet,
			subtitle: subtitleSnippet,
			actions: actionsSnippet,
			ariaLabel: 'Promo section'
		});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(container.querySelector('h1')).toBeNull();
		expect(hero.getAttribute('aria-label')).toBe('Promo section');
	});
});

// ---------------------------------------------------------------------------
// Hero-R8 — center layout CSS
// ---------------------------------------------------------------------------

describe('Hero-R8 — center layout CSS', () => {
	it('center layout: root has computed flex-direction: column', () => {
		const { container } = render(Hero, { layout: 'center' });
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(getComputedStyle(hero).flexDirection).toBe('column');
	});

	it('center + align=start: root has computed align-items: flex-start', () => {
		const { container } = render(Hero, { layout: 'center', align: 'start', title: titleSnippet });
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(getComputedStyle(hero).alignItems).toBe('flex-start');
	});

	it('center + align=center: root has computed align-items: center', () => {
		const { container } = render(Hero, {
			layout: 'center',
			align: 'center',
			title: titleSnippet
		});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(getComputedStyle(hero).alignItems).toBe('center');
	});

	it('center + align=end: root has computed align-items: flex-end', () => {
		const { container } = render(Hero, { layout: 'center', align: 'end', title: titleSnippet });
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(getComputedStyle(hero).alignItems).toBe('flex-end');
	});

	it('center + align=start: .hz-hero-content has computed align-items: flex-start', () => {
		const { container } = render(Hero, { layout: 'center', align: 'start', title: titleSnippet });
		const content = container.querySelector('.hz-hero-content') as HTMLElement;
		expect(getComputedStyle(content).alignItems).toBe('flex-start');
	});

	it('center + align=center: .hz-hero-content has computed align-items: center', () => {
		const { container } = render(Hero, {
			layout: 'center',
			align: 'center',
			title: titleSnippet
		});
		const content = container.querySelector('.hz-hero-content') as HTMLElement;
		expect(getComputedStyle(content).alignItems).toBe('center');
	});

	it('center + align=end: .hz-hero-content has computed align-items: flex-end', () => {
		const { container } = render(Hero, { layout: 'center', align: 'end', title: titleSnippet });
		const content = container.querySelector('.hz-hero-content') as HTMLElement;
		expect(getComputedStyle(content).alignItems).toBe('flex-end');
	});

	it('center + align=start: .hz-hero-content has computed text-align: start', () => {
		const { container } = render(Hero, { layout: 'center', align: 'start', title: titleSnippet });
		const content = container.querySelector('.hz-hero-content') as HTMLElement;
		expect(getComputedStyle(content).textAlign).toBe('start');
	});

	it('center + align=center: .hz-hero-content has computed text-align: center', () => {
		const { container } = render(Hero, {
			layout: 'center',
			align: 'center',
			title: titleSnippet
		});
		const content = container.querySelector('.hz-hero-content') as HTMLElement;
		expect(getComputedStyle(content).textAlign).toBe('center');
	});

	it('center + align=end: .hz-hero-content has computed text-align: end (or right)', () => {
		const { container } = render(Hero, { layout: 'center', align: 'end', title: titleSnippet });
		const content = container.querySelector('.hz-hero-content') as HTMLElement;
		const textAlign = getComputedStyle(content).textAlign;
		expect(['end', 'right']).toContain(textAlign);
	});

	it('center layout: media renders as sibling after .hz-hero-content', () => {
		const { container } = render(Hero, {
			layout: 'center',
			title: titleSnippet,
			media: mediaSnippet
		});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		const kids = Array.from(hero.children);
		const contentIdx = kids.findIndex((el) => el.classList.contains('hz-hero-content'));
		const mediaIdx = kids.findIndex((el) => el.classList.contains('hz-hero-media'));
		expect(contentIdx).toBeGreaterThanOrEqual(0);
		expect(mediaIdx).toBeGreaterThanOrEqual(0);
		expect(contentIdx).toBeLessThan(mediaIdx);
	});
});

// ---------------------------------------------------------------------------
// Hero-R9 — split layout (composes Split)
// ---------------------------------------------------------------------------

describe('Hero-R9 — split layout', () => {
	it('split layout → renders .hz-split with correct data attributes', () => {
		const { container } = render(Hero, { layout: 'split', title: titleSnippet });
		const split = container.querySelector('.hz-split') as HTMLElement;
		expect(split).not.toBeNull();
		expect(split.getAttribute('data-fraction')).toBe('1/2');
		expect(split.getAttribute('data-gap')).toBe('lg');
		expect(split.getAttribute('data-stack-below')).toBe('md');
	});

	it('split layout → .hz-hero-content is inside .hz-split', () => {
		const { container } = render(Hero, { layout: 'split', title: titleSnippet });
		const split = container.querySelector('.hz-split-layout') as HTMLElement;
		expect(split.querySelector('.hz-hero-content')).not.toBeNull();
	});

	it('split layout + media → .hz-hero-media is inside .hz-split', () => {
		const { container } = render(Hero, {
			layout: 'split',
			title: titleSnippet,
			media: mediaSnippet
		});
		const split = container.querySelector('.hz-split-layout') as HTMLElement;
		expect(split.querySelector('.hz-hero-media')).not.toBeNull();
	});

	it('split + align=start: .hz-split-layout has computed align-items: flex-start', () => {
		const { container } = render(Hero, {
			layout: 'split',
			align: 'start',
			title: titleSnippet,
			media: mediaSnippet
		});
		const split = container.querySelector('.hz-split-layout') as HTMLElement;
		expect(getComputedStyle(split).alignItems).toBe('flex-start');
	});

	it('split + align=center: .hz-split-layout has computed align-items: center', () => {
		const { container } = render(Hero, {
			layout: 'split',
			align: 'center',
			title: titleSnippet,
			media: mediaSnippet
		});
		const split = container.querySelector('.hz-split-layout') as HTMLElement;
		expect(getComputedStyle(split).alignItems).toBe('center');
	});

	it('split + align=end: .hz-split-layout has computed align-items: flex-end', () => {
		const { container } = render(Hero, {
			layout: 'split',
			align: 'end',
			title: titleSnippet,
			media: mediaSnippet
		});
		const split = container.querySelector('.hz-split-layout') as HTMLElement;
		expect(getComputedStyle(split).alignItems).toBe('flex-end');
	});

	it('split layout at ≥968px: content and media sit side by side on one row', async () => {
		const { container } = render(Hero, {
			layout: 'split',
			title: titleSnippet,
			media: mediaSnippet
		});
		await page.viewport(1200, 800);
		const content = container.querySelector('.hz-hero-content') as HTMLElement;
		const mediaEl = container.querySelector('.hz-hero-media') as HTMLElement;
		const c = content.getBoundingClientRect();
		const m = mediaEl.getBoundingClientRect();
		// Same flex line: vertical spans overlap and media is to the right
		expect(c.top).toBeLessThan(m.bottom);
		expect(m.top).toBeLessThan(c.bottom);
		expect(m.left).toBeGreaterThan(c.left);
	});

	it('split gaps: 4rem between columns, tightened 2rem between stacked lines', () => {
		const { container } = render(Hero, {
			layout: 'split',
			title: titleSnippet,
			media: mediaSnippet
		});
		const layout = container.querySelector('.hz-split-layout') as HTMLElement;
		expect(getComputedStyle(layout).columnGap).toBe('64px'); // lg fallback 4rem
		expect(getComputedStyle(layout).rowGap).toBe('32px'); // hero override 2rem
	});

	it('split layout at <968px: content and media stack (content above media)', async () => {
		const { container } = render(Hero, {
			layout: 'split',
			title: titleSnippet,
			media: mediaSnippet
		});
		await page.viewport(640, 800);
		const content = container.querySelector('.hz-hero-content') as HTMLElement;
		const mediaEl = container.querySelector('.hz-hero-media') as HTMLElement;
		expect(mediaEl.getBoundingClientRect().top).toBeGreaterThanOrEqual(
			content.getBoundingClientRect().bottom - 0.5
		);
	});

	it('split layout with no media: .hz-split-layout has single child (hz-hero-content)', () => {
		const { container } = render(Hero, { layout: 'split', title: titleSnippet });
		const split = container.querySelector('.hz-split-layout') as HTMLElement;
		expect(split.querySelector('.hz-hero-content')).not.toBeNull();
		expect(split.querySelector('.hz-hero-media')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Hero-R10 — reverseOnMobile
// ---------------------------------------------------------------------------

describe('Hero-R10 — reverseOnMobile', () => {
	afterEach(async () => {
		await page.viewport(1024, 768);
	});

	it('data-reverse-on-mobile reflects regardless of layout', () => {
		const { container } = render(Hero, { layout: 'center', reverseOnMobile: true });
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(hero.hasAttribute('data-reverse-on-mobile')).toBe(true);
	});

	it('split + reverseOnMobile at <968px: media renders above content (wrap-reverse)', async () => {
		const { container } = render(Hero, {
			layout: 'split',
			reverseOnMobile: true,
			title: titleSnippet,
			media: mediaSnippet
		});
		await page.viewport(640, 800);
		const content = container.querySelector('.hz-hero-content') as HTMLElement;
		const mediaEl = container.querySelector('.hz-hero-media') as HTMLElement;
		const layout = container.querySelector('.hz-split-layout') as HTMLElement;
		expect(getComputedStyle(layout).flexWrap).toBe('wrap-reverse');
		// Media should visually appear first (above content)
		expect(mediaEl.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			content.getBoundingClientRect().top + 0.5
		);
	});

	it('split + reverseOnMobile at ≥968px: columns keep content left, media right', async () => {
		const { container } = render(Hero, {
			layout: 'split',
			reverseOnMobile: true,
			title: titleSnippet,
			media: mediaSnippet
		});
		await page.viewport(1200, 800);
		const content = container.querySelector('.hz-hero-content') as HTMLElement;
		const mediaEl = container.querySelector('.hz-hero-media') as HTMLElement;
		const c = content.getBoundingClientRect();
		const m = mediaEl.getBoundingClientRect();
		// Same row (wrap-reverse has no visual effect on a single line),
		// inline order unchanged.
		expect(c.top).toBeLessThan(m.bottom);
		expect(m.top).toBeLessThan(c.bottom);
		expect(m.left).toBeGreaterThan(c.left);
	});

	it('split + reverseOnMobile: DOM order unchanged (content before media) at any width', async () => {
		const { container } = render(Hero, {
			layout: 'split',
			reverseOnMobile: true,
			title: titleSnippet,
			media: mediaSnippet
		});
		// Check at narrow viewport
		await page.viewport(320, 800);
		const split = container.querySelector('.hz-split-layout') as HTMLElement;
		const kids = Array.from(split.children);
		const contentIdx = kids.findIndex((el) => el.classList.contains('hz-hero-content'));
		const mediaIdx = kids.findIndex((el) => el.classList.contains('hz-hero-media'));
		// DOM order: content before media (unchanged by CSS order)
		expect(contentIdx).toBeLessThan(mediaIdx);
	});
});

// ---------------------------------------------------------------------------
// Hero-R11 — height + vertical centering
// ---------------------------------------------------------------------------

describe('Hero-R11 — height and vertical centering', () => {
	it('height="auto" → no min-height set (0px or empty)', () => {
		const { container } = render(Hero, { height: 'auto' });
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		const minH = getComputedStyle(hero).minHeight;
		// auto height means no min-height constraint
		expect(['0px', 'none', '']).toContain(minH);
	});

	it('height="half" → min-height is set (≥1px)', () => {
		const { container } = render(Hero, { height: 'half' });
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		const minH = getComputedStyle(hero).minHeight;
		const px = parseFloat(minH);
		expect(px).toBeGreaterThan(0);
	});

	it('height="screen" → min-height is set (≥1px)', () => {
		const { container } = render(Hero, { height: 'screen' });
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		const minH = getComputedStyle(hero).minHeight;
		const px = parseFloat(minH);
		expect(px).toBeGreaterThan(0);
	});

	it('dvh progressive override is present in shipped CSS for half', () => {
		render(Hero, { height: 'half' });
		const sheets = Array.from(document.styleSheets);
		const allRulesText = sheets
			.flatMap((sheet) => {
				try {
					return Array.from(sheet.cssRules).map((r) => r.cssText);
				} catch {
					return [];
				}
			})
			.join('\n');
		expect(allRulesText).toContain('50dvh');
	});

	it('dvh progressive override is present in shipped CSS for screen', () => {
		render(Hero, { height: 'screen' });
		const sheets = Array.from(document.styleSheets);
		const allRulesText = sheets
			.flatMap((sheet) => {
				try {
					return Array.from(sheet.cssRules).map((r) => r.cssText);
				} catch {
					return [];
				}
			})
			.join('\n');
		expect(allRulesText).toContain('100dvh');
	});

	it('root has computed justify-content: center', () => {
		const { container } = render(Hero, {});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(getComputedStyle(hero).justifyContent).toBe('center');
	});
});

// ---------------------------------------------------------------------------
// Hero-R12 — overlay layout positioning
// ---------------------------------------------------------------------------

describe('Hero-R12 — overlay layout', () => {
	it('overlay: root has computed position: relative', () => {
		const { container } = render(Hero, {
			layout: 'overlay',
			media: mediaSnippet,
			title: titleSnippet
		});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(getComputedStyle(hero).position).toBe('relative');
	});

	it('overlay: .hz-hero-background has computed position: absolute', () => {
		const { container } = render(Hero, {
			layout: 'overlay',
			media: mediaSnippet,
			title: titleSnippet
		});
		const bg = container.querySelector('.hz-hero-background') as HTMLElement;
		expect(getComputedStyle(bg).position).toBe('absolute');
	});

	it('overlay: .hz-hero-background has computed inset: 0 (top/right/bottom/left = 0)', () => {
		const { container } = render(Hero, {
			layout: 'overlay',
			media: mediaSnippet,
			title: titleSnippet
		});
		const bg = container.querySelector('.hz-hero-background') as HTMLElement;
		const style = getComputedStyle(bg);
		expect(style.top).toBe('0px');
		expect(style.right).toBe('0px');
		expect(style.bottom).toBe('0px');
		expect(style.left).toBe('0px');
	});

	it('overlay: .hz-hero-background has computed z-index: 0', () => {
		const { container } = render(Hero, {
			layout: 'overlay',
			media: mediaSnippet,
			title: titleSnippet
		});
		const bg = container.querySelector('.hz-hero-background') as HTMLElement;
		expect(getComputedStyle(bg).zIndex).toBe('0');
	});

	it('overlay: .hz-hero-content has computed z-index: 1', () => {
		const { container } = render(Hero, {
			layout: 'overlay',
			media: mediaSnippet,
			title: titleSnippet
		});
		const content = container.querySelector('.hz-hero-content') as HTMLElement;
		expect(getComputedStyle(content).zIndex).toBe('1');
	});

	it('overlay without media: content renders normally, no .hz-hero-background', () => {
		const { container } = render(Hero, { layout: 'overlay', title: titleSnippet });
		expect(container.querySelector('.hz-hero-content')).not.toBeNull();
		expect(container.querySelector('.hz-hero-background')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Text slots accept string | Snippet
// ---------------------------------------------------------------------------

describe('string | Snippet text slots', () => {
	it('title as a plain string renders inside the heading', () => {
		const { container } = render(Hero, { title: 'Plain string title' });
		const heading = container.querySelector('.hz-hero-title') as HTMLElement;
		expect(heading.textContent?.trim()).toBe('Plain string title');
	});

	it('string title still wires aria-labelledby', () => {
		const { container } = render(Hero, { title: 'Named by string' });
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		const heading = container.querySelector('.hz-hero-title') as HTMLElement;
		expect(hero.getAttribute('aria-labelledby')).toBe(heading.id);
	});

	it('eyebrow and subtitle as plain strings render their text', () => {
		const { container } = render(Hero, {
			eyebrow: 'Eyebrow string',
			subtitle: 'Subtitle string'
		});
		expect(container.querySelector('.hz-hero-eyebrow')?.textContent?.trim()).toBe('Eyebrow string');
		expect(container.querySelector('.hz-hero-subtitle')?.textContent?.trim()).toBe(
			'Subtitle string'
		);
	});

	it('snippet form still renders markup (title span preserved)', () => {
		const { container } = render(Hero, { title: titleSnippet });
		expect(container.querySelector('.hz-hero-title [data-testid="title-content"]')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Hero-R13 — no visual opinions
// ---------------------------------------------------------------------------

describe('Hero-R13 — no visual opinions shipped', () => {
	it('root has no computed background-color (transparent)', () => {
		const { container } = render(Hero, { layout: 'center' });
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(getComputedStyle(hero).backgroundColor).toBe('rgba(0, 0, 0, 0)');
	});

	it('root has no computed box-shadow', () => {
		const { container } = render(Hero, { layout: 'overlay' });
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(getComputedStyle(hero).boxShadow).toBe('none');
	});

	it('root has no computed border shipped by the component (0px)', () => {
		const { container } = render(Hero, { layout: 'split' });
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(getComputedStyle(hero).borderWidth).toBe('0px');
	});

	it('root has no computed border-radius shipped by the component', () => {
		const { container } = render(Hero, {});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(getComputedStyle(hero).borderRadius).toBe('0px');
	});
});

// ---------------------------------------------------------------------------
// Hero-R14 — class composition
// ---------------------------------------------------------------------------

describe('Hero-R14 — class composition', () => {
	it('no class prop → root class is exactly "hz-hero" (plus Svelte scope)', () => {
		const { container } = render(Hero, {});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		const classes = [...hero.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toEqual(['hz-hero']);
	});

	it('class="foo bar" → hz-hero is first, foo and bar are present', () => {
		const { container } = render(Hero, { class: 'foo bar' });
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		const classes = [...hero.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-hero');
		expect(classes).toContain('foo');
		expect(classes).toContain('bar');
	});
});

// ---------------------------------------------------------------------------
// Hero-R15 — rest forwarding
// ---------------------------------------------------------------------------

describe('Hero-R15 — rest forwarding', () => {
	it('arbitrary rest attr (data-testid) is forwarded to the root section', () => {
		const { container } = render(Hero, {
			'data-testid': 'my-hero'
		} as Record<string, unknown>);
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(hero.getAttribute('data-testid')).toBe('my-hero');
	});

	it('rest override attempt on data-layout → managed value wins', () => {
		const { container } = render(Hero, {
			'data-layout': 'overlay'
		} as Record<string, unknown>);
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		// default layout is 'center'; rest override is discarded
		expect(hero.getAttribute('data-layout')).toBe('center');
	});

	it('rest override attempt on class → hz-hero class always present', () => {
		const { container } = render(Hero, { class: 'custom' });
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(hero.classList.contains('hz-hero')).toBe(true);
		expect(hero.classList.contains('custom')).toBe(true);
	});

	it('rest override attempt on aria-label when title present → aria-labelledby wins', () => {
		const { container } = render(Hero, {
			title: titleSnippet,
			'aria-label': 'Ignored'
		} as Record<string, unknown>);
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		// aria-labelledby is managed and wins; aria-label should not be set
		expect(hero.hasAttribute('aria-labelledby')).toBe(true);
		expect(hero.hasAttribute('aria-label')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Hero-R16 — barrel export
// ---------------------------------------------------------------------------

describe('Hero-R16 — barrel export', () => {
	it('Hero is resolvable from $lib', async () => {
		const { Hero: HeroComp } = await import('$lib');
		expect(HeroComp).toBeDefined();
	});

	it('Hero smoke-renders from $lib import', async () => {
		const { Hero: HeroComp } = await import('$lib');
		const { container } = render(HeroComp, {});
		expect(container.querySelector('.hz-hero')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
	it('no snippets at all → empty <section class="hz-hero">, no inner wrappers', () => {
		const { container } = render(Hero, {});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(hero).not.toBeNull();
		expect(container.querySelector('.hz-hero-content')).toBeNull();
		expect(container.querySelector('.hz-hero-media')).toBeNull();
		expect(container.querySelector('.hz-hero-background')).toBeNull();
	});

	it('title absent + ariaLabel absent → no aria-labelledby / aria-label', () => {
		const { container } = render(Hero, {});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(hero.hasAttribute('aria-labelledby')).toBe(false);
		expect(hero.hasAttribute('aria-label')).toBe(false);
	});

	it('reverseOnMobile in center layout → data-reverse-on-mobile reflects, no visual error', () => {
		const { container } = render(Hero, {
			layout: 'center',
			reverseOnMobile: true,
			title: titleSnippet,
			media: mediaSnippet
		});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(hero.hasAttribute('data-reverse-on-mobile')).toBe(true);
	});

	it('reverseOnMobile in overlay layout → data-reverse-on-mobile reflects', () => {
		const { container } = render(Hero, {
			layout: 'overlay',
			reverseOnMobile: true,
			title: titleSnippet
		});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		expect(hero.hasAttribute('data-reverse-on-mobile')).toBe(true);
	});

	it('media absent in split → .hz-split-layout has single child (no empty track)', () => {
		const { container } = render(Hero, { layout: 'split', title: titleSnippet });
		const split = container.querySelector('.hz-split-layout') as HTMLElement;
		const directChildren = Array.from(split.children);
		expect(directChildren).toHaveLength(1);
		expect(directChildren[0].classList.contains('hz-hero-content')).toBe(true);
	});

	it('background absent in overlay → content renders normally, no .hz-hero-background', () => {
		const { container } = render(Hero, { layout: 'overlay', title: titleSnippet });
		expect(container.querySelector('.hz-hero-content')).not.toBeNull();
		expect(container.querySelector('.hz-hero-background')).toBeNull();
	});

	it('headingLevel=2 with ariaLabel → aria-labelledby still resolves to the h2', () => {
		const { container } = render(Hero, {
			title: titleSnippet,
			headingLevel: 2,
			ariaLabel: 'Ignored'
		});
		const hero = container.querySelector('.hz-hero') as HTMLElement;
		const h2 = container.querySelector('h2.hz-hero-title') as HTMLElement;
		expect(hero.getAttribute('aria-labelledby')).toBe(h2.id);
		expect(hero.hasAttribute('aria-label')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Integration — responsive layout (viewport resize)
// ---------------------------------------------------------------------------

describe('Integration — Hero-R9/R10 responsive layout', () => {
	afterEach(async () => {
		await page.viewport(1024, 768);
	});

	it('split hero: two roughly equal columns at wide viewport, stacked at ≤320px', async () => {
		const { container } = render(Hero, {
			layout: 'split',
			title: titleSnippet,
			media: mediaSnippet
		});
		const content = container.querySelector('.hz-hero-content') as HTMLElement;
		const mediaEl = container.querySelector('.hz-hero-media') as HTMLElement;

		await page.viewport(1200, 800);
		const cWide = content.getBoundingClientRect();
		const mWide = mediaEl.getBoundingClientRect();
		// Same row, equal grow (1/2 fraction) → widths within a few px
		expect(mWide.left).toBeGreaterThan(cWide.left);
		expect(Math.abs(cWide.width - mWide.width)).toBeLessThan(4);

		await page.viewport(320, 800);
		expect(mediaEl.getBoundingClientRect().top).toBeGreaterThanOrEqual(
			content.getBoundingClientRect().bottom - 0.5
		);
	});

	it('reverseOnMobile: media on top only while stacked, DOM order preserved across switch', async () => {
		const { container } = render(Hero, {
			layout: 'split',
			reverseOnMobile: true,
			title: titleSnippet,
			media: mediaSnippet
		});
		const split = container.querySelector('.hz-split-layout') as HTMLElement;
		const content = container.querySelector('.hz-hero-content') as HTMLElement;
		const mediaEl = container.querySelector('.hz-hero-media') as HTMLElement;

		// DOM order check at narrow viewport
		await page.viewport(320, 800);
		const kidsNarrow = Array.from(split.children);
		const contentDomIdx = kidsNarrow.findIndex((el) => el.classList.contains('hz-hero-content'));
		const mediaDomIdx = kidsNarrow.findIndex((el) => el.classList.contains('hz-hero-media'));
		expect(contentDomIdx).toBeLessThan(mediaDomIdx); // DOM order unchanged

		// Visual order at narrow: media above content (wrap-reverse lines)
		expect(mediaEl.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			content.getBoundingClientRect().top + 0.5
		);

		// DOM order check at wide viewport
		await page.viewport(1200, 800);
		const kidsWide = Array.from(split.children);
		const contentDomIdxWide = kidsWide.findIndex((el) => el.classList.contains('hz-hero-content'));
		const mediaDomIdxWide = kidsWide.findIndex((el) => el.classList.contains('hz-hero-media'));
		expect(contentDomIdxWide).toBeLessThan(mediaDomIdxWide); // DOM order still unchanged

		// Side by side at wide viewport: content left, media right
		expect(mediaEl.getBoundingClientRect().left).toBeGreaterThan(
			content.getBoundingClientRect().left
		);
	});
});
