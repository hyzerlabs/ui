import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Card from './Card.svelte';

// ---------------------------------------------------------------------------
// Snippet helpers
// ---------------------------------------------------------------------------

const mediaSnippet = createRawSnippet(() => ({
	render: () => `<div data-testid="media-content">media</div>`
}));

const bodySnippet = createRawSnippet(() => ({
	render: () => `<p data-testid="body-content">body content</p>`
}));

const actionsSnippet = createRawSnippet(() => ({
	render: () => `<button data-testid="action-btn">Action</button>`
}));

// ---------------------------------------------------------------------------
// Card-R1 — Root
// ---------------------------------------------------------------------------

describe('Card-R1 — root', () => {
	it('renders <div class="hz-card">', () => {
		const { container } = render(Card, {});
		expect(container.querySelector('div.hz-card')).not.toBeNull();
	});

	it('no role attribute on the root div', () => {
		const { container } = render(Card, {});
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(card.getAttribute('role')).toBeNull();
	});

	it('no data-variant emitted — treatments are theme classes, not a prop', () => {
		const { container } = render(Card, {});
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(card.hasAttribute('data-variant')).toBe(false);
	});

	it('default: data-padding="md"', () => {
		const { container } = render(Card, {});
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(card.getAttribute('data-padding')).toBe('md');
	});

	it('default: data-rounded="md"', () => {
		const { container } = render(Card, {});
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(card.getAttribute('data-rounded')).toBe('md');
	});

	it('default: data-media-position="start"', () => {
		const { container } = render(Card, {});
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(card.getAttribute('data-media-position')).toBe('start');
	});

	it('default: data-horizontal absent', () => {
		const { container } = render(Card, {});
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(card.hasAttribute('data-horizontal')).toBe(false);
	});

	it('horizontal=true → data-horizontal present (empty-valued)', () => {
		const { container } = render(Card, { horizontal: true });
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(card.hasAttribute('data-horizontal')).toBe(true);
		expect(card.getAttribute('data-horizontal')).toBe('');
	});

	it.each(['none', 'sm', 'md', 'lg'] as const)('padding="%s" → data-padding="%s"', (padding) => {
		const { container } = render(Card, { padding });
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(card.getAttribute('data-padding')).toBe(padding);
	});

	it.each(['none', 'sm', 'md', 'lg'] as const)('rounded="%s" → data-rounded="%s"', (rounded) => {
		const { container } = render(Card, { rounded });
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(card.getAttribute('data-rounded')).toBe(rounded);
	});

	it.each(['start', 'end'] as const)(
		'mediaPosition="%s" → data-media-position="%s"',
		(mediaPosition) => {
			const { container } = render(Card, { mediaPosition });
			const card = container.querySelector('.hz-card') as HTMLElement;
			expect(card.getAttribute('data-media-position')).toBe(mediaPosition);
		}
	);
});

// ---------------------------------------------------------------------------
// Card-R2 — Media region
// ---------------------------------------------------------------------------

describe('Card-R2 — media region', () => {
	it('media snippet provided → renders .hz-card-media wrapper', () => {
		const { container } = render(Card, { media: mediaSnippet });
		expect(container.querySelector('.hz-card-media')).not.toBeNull();
	});

	it('media snippet absent → no .hz-card-media element', () => {
		const { container } = render(Card, {});
		expect(container.querySelector('.hz-card-media')).toBeNull();
	});

	it('media snippet absent → no error (card renders fine)', () => {
		const { container } = render(Card, { children: bodySnippet });
		expect(container.querySelector('.hz-card')).not.toBeNull();
	});

	it('media content renders inside .hz-card-media', () => {
		const { container } = render(Card, { media: mediaSnippet });
		const mediaEl = container.querySelector('.hz-card-media') as HTMLElement;
		expect(mediaEl.querySelector('[data-testid="media-content"]')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Card-R3 — Content region
// ---------------------------------------------------------------------------

describe('Card-R3 — content region', () => {
	it('children provided → .hz-card-content and .hz-card-body rendered', () => {
		const { container } = render(Card, { children: bodySnippet });
		expect(container.querySelector('.hz-card-content')).not.toBeNull();
		expect(container.querySelector('.hz-card-body')).not.toBeNull();
	});

	it('actions provided → .hz-card-content and .hz-card-actions rendered', () => {
		const { container } = render(Card, { actions: actionsSnippet });
		expect(container.querySelector('.hz-card-content')).not.toBeNull();
		expect(container.querySelector('.hz-card-actions')).not.toBeNull();
	});

	it('actions only (no children) → .hz-card-content with .hz-card-actions but no .hz-card-body', () => {
		const { container } = render(Card, { actions: actionsSnippet });
		expect(container.querySelector('.hz-card-content')).not.toBeNull();
		expect(container.querySelector('.hz-card-actions')).not.toBeNull();
		expect(container.querySelector('.hz-card-body')).toBeNull();
	});

	it('children and actions → both .hz-card-body and .hz-card-actions inside .hz-card-content', () => {
		const { container } = render(Card, { children: bodySnippet, actions: actionsSnippet });
		const content = container.querySelector('.hz-card-content') as HTMLElement;
		expect(content.querySelector('.hz-card-body')).not.toBeNull();
		expect(content.querySelector('.hz-card-actions')).not.toBeNull();
	});

	it('no children and no actions → no .hz-card-content wrapper (media-only)', () => {
		const { container } = render(Card, { media: mediaSnippet });
		expect(container.querySelector('.hz-card-content')).toBeNull();
	});

	it('no children and no actions → no .hz-card-content wrapper (empty card)', () => {
		const { container } = render(Card, {});
		expect(container.querySelector('.hz-card-content')).toBeNull();
	});

	it('media-only card: .hz-card-media present, no .hz-card-content', () => {
		const { container } = render(Card, { media: mediaSnippet });
		expect(container.querySelector('.hz-card-media')).not.toBeNull();
		expect(container.querySelector('.hz-card-content')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Card-R4 — DOM order reflects mediaPosition (reading order == visual order)
// ---------------------------------------------------------------------------

describe('Card-R4 — DOM order matches mediaPosition', () => {
	it('mediaPosition="start" → .hz-card-media before .hz-card-content in DOM', () => {
		const { container } = render(Card, {
			media: mediaSnippet,
			children: bodySnippet,
			mediaPosition: 'start'
		});
		const card = container.querySelector('.hz-card') as HTMLElement;
		const kids = Array.from(card.children);
		const mediaIdx = kids.findIndex((el) => el.classList.contains('hz-card-media'));
		const contentIdx = kids.findIndex((el) => el.classList.contains('hz-card-content'));
		expect(mediaIdx).toBeGreaterThanOrEqual(0);
		expect(contentIdx).toBeGreaterThanOrEqual(0);
		expect(mediaIdx).toBeLessThan(contentIdx);
	});

	it('mediaPosition="end" → .hz-card-content before .hz-card-media in DOM', () => {
		const { container } = render(Card, {
			media: mediaSnippet,
			children: bodySnippet,
			mediaPosition: 'end'
		});
		const card = container.querySelector('.hz-card') as HTMLElement;
		const kids = Array.from(card.children);
		const mediaIdx = kids.findIndex((el) => el.classList.contains('hz-card-media'));
		const contentIdx = kids.findIndex((el) => el.classList.contains('hz-card-content'));
		expect(contentIdx).toBeGreaterThanOrEqual(0);
		expect(mediaIdx).toBeGreaterThanOrEqual(0);
		expect(contentIdx).toBeLessThan(mediaIdx);
	});

	it('actions always follows body inside .hz-card-content', () => {
		const { container } = render(Card, { children: bodySnippet, actions: actionsSnippet });
		const content = container.querySelector('.hz-card-content') as HTMLElement;
		const contentKids = Array.from(content.children);
		const bodyIdx = contentKids.findIndex((el) => el.classList.contains('hz-card-body'));
		const actionsIdx = contentKids.findIndex((el) => el.classList.contains('hz-card-actions'));
		expect(bodyIdx).toBeGreaterThanOrEqual(0);
		expect(actionsIdx).toBeGreaterThanOrEqual(0);
		expect(bodyIdx).toBeLessThan(actionsIdx);
	});
});

// ---------------------------------------------------------------------------
// Card-R5 / R6 / R7 — Layout CSS
// ---------------------------------------------------------------------------

describe('Card-R5/R6/R7 — layout CSS', () => {
	afterEach(async () => {
		await page.viewport(1024, 768);
	});

	it('Card-R5: vertical card (default) has computed flex-direction: column', () => {
		const { container } = render(Card, { children: bodySnippet });
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(getComputedStyle(card).flexDirection).toBe('column');
	});

	it('Card-R6: horizontal card at ≥640px has computed flex-direction: row', async () => {
		const { container } = render(Card, {
			horizontal: true,
			media: mediaSnippet,
			children: bodySnippet
		});
		await page.viewport(800, 600);
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(getComputedStyle(card).flexDirection).toBe('row');
	});

	it('Card-R7: horizontal card at <640px stacks to computed flex-direction: column', async () => {
		const { container } = render(Card, {
			horizontal: true,
			media: mediaSnippet,
			children: bodySnippet
		});
		await page.viewport(320, 600);
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(getComputedStyle(card).flexDirection).toBe('column');
	});

	it('Card-R6: horizontal card media track has flex-grow: 0 and flex-shrink: 0 (fixed size)', async () => {
		const { container } = render(Card, {
			horizontal: true,
			media: mediaSnippet,
			children: bodySnippet
		});
		await page.viewport(800, 600);
		const mediaEl = container.querySelector('.hz-card-media') as HTMLElement;
		expect(getComputedStyle(mediaEl).flexGrow).toBe('0');
		expect(getComputedStyle(mediaEl).flexShrink).toBe('0');
	});

	it('Card-R6: horizontal card content region has flex-grow: 1 (fills remaining space)', async () => {
		const { container } = render(Card, {
			horizontal: true,
			media: mediaSnippet,
			children: bodySnippet
		});
		await page.viewport(800, 600);
		const content = container.querySelector('.hz-card-content') as HTMLElement;
		expect(getComputedStyle(content).flexGrow).toBe('1');
	});
});

// ---------------------------------------------------------------------------
// Card-R8 — Padding
// ---------------------------------------------------------------------------

describe('Card-R8 — padding', () => {
	it('padding="none" → .hz-card-content has padding: 0px', () => {
		const { container } = render(Card, { padding: 'none', children: bodySnippet });
		const content = container.querySelector('.hz-card-content') as HTMLElement;
		expect(getComputedStyle(content).padding).toBe('0px');
	});

	it('padding="sm" → .hz-card-content has non-zero padding (1rem / 16px)', () => {
		const { container } = render(Card, { padding: 'sm', children: bodySnippet });
		const content = container.querySelector('.hz-card-content') as HTMLElement;
		expect(getComputedStyle(content).padding).toBe('16px');
	});

	it('padding="md" → .hz-card-content has 2rem (32px) padding', () => {
		const { container } = render(Card, { padding: 'md', children: bodySnippet });
		const content = container.querySelector('.hz-card-content') as HTMLElement;
		expect(getComputedStyle(content).padding).toBe('32px');
	});

	it('padding="lg" → .hz-card-content has 4rem (64px) padding', () => {
		const { container } = render(Card, { padding: 'lg', children: bodySnippet });
		const content = container.querySelector('.hz-card-content') as HTMLElement;
		expect(getComputedStyle(content).padding).toBe('64px');
	});

	it('data-padding attribute reflects the padding prop', () => {
		const { container } = render(Card, { padding: 'lg', children: bodySnippet });
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(card.getAttribute('data-padding')).toBe('lg');
	});

	it('media region is not padded (bleeds edge-to-edge)', () => {
		const { container } = render(Card, {
			padding: 'lg',
			media: mediaSnippet,
			children: bodySnippet
		});
		const mediaEl = container.querySelector('.hz-card-media') as HTMLElement;
		expect(getComputedStyle(mediaEl).padding).toBe('0px');
	});
});

// ---------------------------------------------------------------------------
// Card-R9 — Overlay link
// ---------------------------------------------------------------------------

describe('Card-R9 — overlay link', () => {
	it('href set → data-clickable present on root', () => {
		const { container } = render(Card, { href: '/destination', ariaLabel: 'View details' });
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(card.hasAttribute('data-clickable')).toBe(true);
	});

	it('href set → a.hz-card-link rendered as first child of .hz-card', () => {
		const { container } = render(Card, { href: '/destination', ariaLabel: 'View details' });
		const card = container.querySelector('.hz-card') as HTMLElement;
		const firstChild = card.firstElementChild as HTMLElement;
		expect(firstChild.tagName).toBe('A');
		expect(firstChild.classList.contains('hz-card-link')).toBe(true);
		expect(firstChild.getAttribute('href')).toBe('/destination');
	});

	it('href set → span.hz-card-link-overlay is inside a.hz-card-link', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { container } = render(Card, { href: '/destination' });
		const link = container.querySelector('a.hz-card-link') as HTMLElement;
		const span = link.firstElementChild as HTMLElement;
		expect(span.tagName).toBe('SPAN');
		expect(span.classList.contains('hz-card-link-overlay')).toBe(true);
		warnSpy.mockRestore();
	});

	it('overlay span has computed position: absolute', () => {
		const { container } = render(Card, { href: '/destination', ariaLabel: 'View details' });
		const span = container.querySelector('.hz-card-link-overlay') as HTMLElement;
		expect(getComputedStyle(span).position).toBe('absolute');
	});

	// Regression: the R10 inner-interactive rule (position: relative) used to tie
	// with the R9 overlay rule under Svelte's :where() scoping and win on source
	// order, collapsing the overlay link to zero height — clicks never navigated.
	it('overlay link itself is position: absolute and covers the full card', () => {
		const { container } = render(Card, {
			href: '/destination',
			ariaLabel: 'View details',
			children: bodySnippet
		});
		const card = container.querySelector('.hz-card') as HTMLElement;
		const link = container.querySelector('a.hz-card-link') as HTMLElement;
		expect(getComputedStyle(link).position).toBe('absolute');
		const cardBox = card.getBoundingClientRect();
		const linkBox = link.getBoundingClientRect();
		expect(cardBox.height).toBeGreaterThan(0);
		expect(linkBox.height).toBe(cardBox.height);
		expect(linkBox.width).toBe(cardBox.width);
	});

	it('href="" (empty) → no data-clickable, no overlay link', () => {
		const { container } = render(Card, { href: '' });
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(card.hasAttribute('data-clickable')).toBe(false);
		expect(container.querySelector('a.hz-card-link')).toBeNull();
	});

	it('href absent → no data-clickable, no overlay link', () => {
		const { container } = render(Card, {});
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(card.hasAttribute('data-clickable')).toBe(false);
		expect(container.querySelector('a.hz-card-link')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Card-R10 — Inner interactive elements stay usable above the overlay
// ---------------------------------------------------------------------------

describe('Card-R10 — inner interactive elements stay usable', () => {
	it('inner button in a clickable card has computed position: relative', () => {
		const { container } = render(Card, {
			href: '/destination',
			ariaLabel: 'View card',
			children: actionsSnippet
		});
		const btn = container.querySelector('[data-testid="action-btn"]') as HTMLElement;
		expect(getComputedStyle(btn).position).toBe('relative');
	});

	it('inner button in a clickable card has computed z-index >= 1', () => {
		const { container } = render(Card, {
			href: '/destination',
			ariaLabel: 'View card',
			children: actionsSnippet
		});
		const btn = container.querySelector('[data-testid="action-btn"]') as HTMLElement;
		const zIndex = parseInt(getComputedStyle(btn).zIndex, 10);
		expect(zIndex).toBeGreaterThanOrEqual(1);
	});

	it('userEvent.click on inner button fires its click handler', async () => {
		const { container } = render(Card, {
			href: '/destination',
			ariaLabel: 'View card',
			children: actionsSnippet
		});
		const btn = container.querySelector('[data-testid="action-btn"]') as HTMLElement;
		const clickSpy = vi.fn();
		btn.addEventListener('click', clickSpy);
		await userEvent.click(btn);
		expect(clickSpy).toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Card-R11 — Accessible name warning (DEV only)
// ---------------------------------------------------------------------------

describe('Card-R11 — accessible name warning', () => {
	it('href without ariaLabel → console.warn fires once with ariaLabel mentioned', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(Card, { href: '/destination' });
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('ariaLabel');
		warnSpy.mockRestore();
	});

	it('href with ariaLabel → no console.warn', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(Card, { href: '/destination', ariaLabel: 'View details' });
		expect(warnSpy).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});

	it('ariaLabel renders as aria-label on the overlay link', () => {
		const { container } = render(Card, {
			href: '/destination',
			ariaLabel: 'Read more about this article'
		});
		const link = container.querySelector('a.hz-card-link') as HTMLElement;
		expect(link.getAttribute('aria-label')).toBe('Read more about this article');
	});
});

// ---------------------------------------------------------------------------
// Card-R12 — rounded is a hook only (no visual CSS shipped)
// ---------------------------------------------------------------------------

describe('Card-R12 — rounded is a hook only', () => {
	it('no box-shadow shipped by component', () => {
		const { container } = render(Card, {});
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(getComputedStyle(card).boxShadow).toBe('none');
	});

	it('no border shipped by component', () => {
		const { container } = render(Card, {});
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(getComputedStyle(card).borderWidth).toBe('0px');
	});

	it('no background-color shipped by component', () => {
		const { container } = render(Card, {});
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(getComputedStyle(card).backgroundColor).toBe('rgba(0, 0, 0, 0)');
	});

	it('rounded="lg" → no border-radius shipped by component', () => {
		const { container } = render(Card, { rounded: 'lg' });
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(getComputedStyle(card).borderRadius).toBe('0px');
	});

	it('rounded="lg" → no overflow shipped by component (remains visible)', () => {
		const { container } = render(Card, { rounded: 'lg' });
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(getComputedStyle(card).overflow).toBe('visible');
	});

	it('data-rounded reflects verbatim for all enum values', () => {
		(['none', 'sm', 'md', 'lg'] as const).forEach((r) => {
			const { container } = render(Card, { rounded: r });
			expect(container.querySelector(`.hz-card[data-rounded="${r}"]`)).not.toBeNull();
		});
	});
});

// ---------------------------------------------------------------------------
// Card-R13 — class composition
// ---------------------------------------------------------------------------

describe('Card-R13 — class composition', () => {
	it('no class prop → root class is exactly "hz-card"', () => {
		const { container } = render(Card, {});
		const card = container.querySelector('.hz-card') as HTMLElement;
		const classes = [...card.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toEqual(['hz-card']);
	});

	it('class="foo bar" → hz-card is first, foo and bar are present', () => {
		const { container } = render(Card, { class: 'foo bar' });
		const card = container.querySelector('.hz-card') as HTMLElement;
		const classes = [...card.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-card');
		expect(classes).toContain('foo');
		expect(classes).toContain('bar');
	});
});

// ---------------------------------------------------------------------------
// Card-R14 — rest forwarding
// ---------------------------------------------------------------------------

describe('Card-R14 — rest forwarding', () => {
	it('arbitrary rest attr (data-testid) is forwarded to the root div', () => {
		const { container } = render(Card, {
			'data-testid': 'my-card'
		} as Record<string, unknown>);
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(card.getAttribute('data-testid')).toBe('my-card');
	});

	it('rest override attempt on data-padding → managed value wins', () => {
		const { container } = render(Card, {
			'data-padding': 'lg'
		} as Record<string, unknown>);
		const card = container.querySelector('.hz-card') as HTMLElement;
		// default padding is 'md'; the rest override is discarded
		expect(card.getAttribute('data-padding')).toBe('md');
	});

	it('hz-card class always present even when class is overridden via prop', () => {
		const { container } = render(Card, { class: 'extra-class' });
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(card.classList.contains('hz-card')).toBe(true);
		expect(card.classList.contains('extra-class')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Card-R15 — Barrel export (see also exports.spec.ts)
// ---------------------------------------------------------------------------

describe('Card-R15 — barrel export', () => {
	it('Card is resolvable from $lib', async () => {
		const { Card: CardComp } = await import('$lib');
		expect(CardComp).toBeDefined();
	});

	it('Card smoke-renders from $lib import', async () => {
		const { Card: CardComp } = await import('$lib');
		const { container } = render(CardComp, {});
		expect(container.querySelector('.hz-card')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
	it('mediaPosition set but no media → data-media-position still reflects, no error', () => {
		const { container } = render(Card, { mediaPosition: 'end', children: bodySnippet });
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(card.getAttribute('data-media-position')).toBe('end');
		expect(container.querySelector('.hz-card-media')).toBeNull();
	});

	it('horizontal but no media → content fills full width, no empty media track rendered', async () => {
		await page.viewport(800, 600);
		const { container } = render(Card, { horizontal: true, children: bodySnippet });
		expect(container.querySelector('.hz-card-media')).toBeNull();
		expect(container.querySelector('.hz-card-content')).not.toBeNull();
		await page.viewport(1024, 768);
	});

	it('href="" (empty) is treated as not clickable (plain div, no overlay)', () => {
		const { container } = render(Card, { href: '' });
		const card = container.querySelector('.hz-card') as HTMLElement;
		expect(card.hasAttribute('data-clickable')).toBe(false);
		expect(container.querySelector('a.hz-card-link')).toBeNull();
		expect(card.tagName).toBe('DIV');
	});

	it('href set without ariaLabel: overlay is still rendered and clickable', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { container } = render(Card, { href: '/destination' });
		expect(container.querySelector('a.hz-card-link')).not.toBeNull();
		warnSpy.mockRestore();
	});

	it('mediaPosition="end" DOM order preserved at narrow viewport (no CSS reorder)', async () => {
		const { container } = render(Card, {
			horizontal: true,
			media: mediaSnippet,
			children: bodySnippet,
			mediaPosition: 'end'
		});
		await page.viewport(320, 600);
		const card = container.querySelector('.hz-card') as HTMLElement;
		const kids = Array.from(card.children);
		const mediaIdx = kids.findIndex((el) => el.classList.contains('hz-card-media'));
		const contentIdx = kids.findIndex((el) => el.classList.contains('hz-card-content'));
		// content before media in DOM even at narrow viewport (DOM order, not CSS reorder)
		expect(contentIdx).toBeLessThan(mediaIdx);
		await page.viewport(1024, 768);
	});

	it('padding="none" with media + content: media region stays unpadded', () => {
		const { container } = render(Card, {
			padding: 'none',
			media: mediaSnippet,
			children: bodySnippet
		});
		const mediaEl = container.querySelector('.hz-card-media') as HTMLElement;
		expect(getComputedStyle(mediaEl).padding).toBe('0px');
	});
});

// ---------------------------------------------------------------------------
// Integration — Card-R6/R7 responsive layout (viewport resize)
// ---------------------------------------------------------------------------

describe('Integration — Card-R6/R7 responsive layout', () => {
	afterEach(async () => {
		await page.viewport(1024, 768);
	});

	it('horizontal card switches from row at 800px to column at 320px', async () => {
		const { container } = render(Card, {
			horizontal: true,
			media: mediaSnippet,
			children: bodySnippet
		});
		const card = container.querySelector('.hz-card') as HTMLElement;

		await page.viewport(800, 600);
		expect(getComputedStyle(card).flexDirection).toBe('row');

		await page.viewport(320, 600);
		expect(getComputedStyle(card).flexDirection).toBe('column');
	});

	it('mediaPosition="end" order preserved across the horizontal→column switch', async () => {
		const { container } = render(Card, {
			horizontal: true,
			media: mediaSnippet,
			children: bodySnippet,
			mediaPosition: 'end'
		});
		const card = container.querySelector('.hz-card') as HTMLElement;
		const kids = Array.from(card.children);

		// Wide: content before media (mediaPosition="end")
		await page.viewport(800, 600);
		expect(getComputedStyle(card).flexDirection).toBe('row');
		const contentIdx = kids.findIndex((el) => el.classList.contains('hz-card-content'));
		const mediaIdx = kids.findIndex((el) => el.classList.contains('hz-card-media'));
		expect(contentIdx).toBeLessThan(mediaIdx);

		// Narrow: still content before media (DOM order unchanged, no CSS reorder)
		await page.viewport(320, 600);
		expect(getComputedStyle(card).flexDirection).toBe('column');
		const contentIdxNarrow = kids.findIndex((el) => el.classList.contains('hz-card-content'));
		const mediaIdxNarrow = kids.findIndex((el) => el.classList.contains('hz-card-media'));
		expect(contentIdxNarrow).toBeLessThan(mediaIdxNarrow);
	});
});
