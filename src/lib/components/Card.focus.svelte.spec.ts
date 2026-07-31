import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Card from './Card.svelte';
// Recipe pin — the reference theme must be loaded so the clickable-overlay
// focus ring actually resolves. Kept in its own spec file (not
// Card.svelte.spec.ts) because loading card.css applies theme background,
// radius and overflow to every card, which breaks that file's Card-R12
// "rounded is a hook only" assertions that a bare Card ships no visual CSS —
// this file only reads computed styles, never asserts unstyled defaults.
import '../tokens/tokens.css';
import '../theme/components/card.css';

// ---------------------------------------------------------------------------
// Card-R16 — Focus ring on rounded clickable card (theme)
// ---------------------------------------------------------------------------

describe('Card-R16 — focus ring on rounded clickable card', () => {
	it('keyboard focus on the overlay link paints a visible outline on the card root, not the clipped overlay', async () => {
		const { container } = render(Card, {
			href: '/destination',
			ariaLabel: 'View details',
			rounded: 'lg'
		});
		const card = container.querySelector('.hz-card') as HTMLElement;
		const link = container.querySelector('a.hz-card-link') as HTMLElement;

		// Sanity: this card is in the clipped configuration the bug depends on.
		expect(getComputedStyle(card).overflow).toBe('hidden');

		// A prior click gives the page browser-level focus; without it the
		// first real Tab keypress in an isolated run has nothing to move focus
		// away from (see TextInput.svelte.spec.ts's Integration describe for
		// the same idiom).
		await userEvent.click(document.body);
		await userEvent.tab();
		expect(document.activeElement).toBe(link);

		const cardStyle = getComputedStyle(card);
		expect(cardStyle.outlineStyle).not.toBe('none');
		expect(cardStyle.outlineWidth).not.toBe('0px');

		// The overlay link itself must not carry the paintable ring — it would
		// be clipped by the root's overflow: hidden and never be visible.
		const linkStyle = getComputedStyle(link);
		expect(linkStyle.outlineStyle === 'none' || linkStyle.outlineWidth === '0px').toBe(true);
	});

	it('unrounded clickable card also paints the ring on the root (not overflow-dependent)', async () => {
		const { container } = render(Card, {
			href: '/destination',
			ariaLabel: 'View details',
			rounded: 'none'
		});
		const card = container.querySelector('.hz-card') as HTMLElement;

		await userEvent.tab();

		const cardStyle = getComputedStyle(card);
		expect(cardStyle.outlineStyle).not.toBe('none');
		expect(cardStyle.outlineWidth).not.toBe('0px');
	});

	it('blurring the overlay link removes the ring from the card root', async () => {
		const { container } = render(Card, {
			href: '/destination',
			ariaLabel: 'View details',
			rounded: 'lg'
		});
		const card = container.querySelector('.hz-card') as HTMLElement;
		const link = container.querySelector('a.hz-card-link') as HTMLElement;

		await userEvent.tab();
		expect(document.activeElement).toBe(link);
		expect(getComputedStyle(card).outlineStyle).not.toBe('none');

		link.blur();
		const cardStyle = getComputedStyle(card);
		expect(cardStyle.outlineStyle === 'none' || cardStyle.outlineWidth === '0px').toBe(true);
	});
});
