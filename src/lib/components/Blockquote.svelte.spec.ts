import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Blockquote from './Blockquote.svelte';
// Blockquote-R9 recipe pin — the reference theme must be loaded so the
// accent-line color actually resolves per intent.
import '../tokens/tokens.css';
import '../theme/components/blockquote.css';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const children = createRawSnippet(() => ({
	render: () => `<p data-testid="quote-content">Grip it and rip it.</p>`
}));

const citeSnippet = createRawSnippet(() => ({
	render: () => `<em>Innova</em>`
}));

const base = { children };

function getFigure(container: HTMLElement): HTMLElement {
	return container.querySelector('.hz-blockquote') as HTMLElement;
}

/** Resolve a CSS color expression via a throwaway probe, like Banner.svelte.spec.ts. */
function resolveColor(varExpression: string): string {
	const probe = document.createElement('div');
	probe.style.cssText = `color: ${varExpression}`;
	document.body.appendChild(probe);
	const resolved = getComputedStyle(probe).color;
	document.body.removeChild(probe);
	return resolved;
}

/** Resolve a CSS font-size expression via a throwaway probe. */
function resolveFontSize(varExpression: string): string {
	const probe = document.createElement('div');
	probe.style.cssText = `font-size: ${varExpression}`;
	document.body.appendChild(probe);
	const resolved = getComputedStyle(probe).fontSize;
	document.body.removeChild(probe);
	return resolved;
}

// ---------------------------------------------------------------------------
// Blockquote-R1 — Structure
// ---------------------------------------------------------------------------

describe('Blockquote-R1 — structure', () => {
	it('root is figure.hz-blockquote containing blockquote.hz-blockquote-quote with the children', () => {
		const { container } = render(Blockquote, base);
		const figure = getFigure(container);
		expect(figure.tagName.toLowerCase()).toBe('figure');
		const quote = figure.querySelector('.hz-blockquote-quote') as HTMLElement;
		expect(quote.tagName.toLowerCase()).toBe('blockquote');
		expect(quote.querySelector('[data-testid="quote-content"]')?.textContent).toBe(
			'Grip it and rip it.'
		);
	});

	it('with cite, a figcaption.hz-blockquote-attribution containing cite.hz-blockquote-cite renders after the blockquote', () => {
		const { container } = render(Blockquote, { ...base, cite: 'Paul McBeth' });
		const figure = getFigure(container);
		const children = Array.from(figure.children);
		const quoteIndex = children.findIndex((el) => el.classList.contains('hz-blockquote-quote'));
		const captionIndex = children.findIndex((el) =>
			el.classList.contains('hz-blockquote-attribution')
		);
		expect(quoteIndex).toBeGreaterThanOrEqual(0);
		expect(captionIndex).toBeGreaterThan(quoteIndex);

		const figcaption = children[captionIndex] as HTMLElement;
		expect(figcaption.tagName.toLowerCase()).toBe('figcaption');
		const cite = figcaption.querySelector('.hz-blockquote-cite') as HTMLElement;
		expect(cite.tagName.toLowerCase()).toBe('cite');
		expect(cite.textContent?.trim()).toBe('Paul McBeth');
	});

	it('figure is always the single root even with no attribution', () => {
		const { container } = render(Blockquote, base);
		expect(container.querySelectorAll('.hz-blockquote').length).toBe(1);
		expect(getFigure(container).tagName.toLowerCase()).toBe('figure');
	});
});

// ---------------------------------------------------------------------------
// Blockquote-R2 — Source URL
// ---------------------------------------------------------------------------

describe('Blockquote-R2 — source URL', () => {
	it('citeUrl sets the cite attribute on the blockquote', () => {
		const { container } = render(Blockquote, { ...base, citeUrl: 'https://example.com/quote' });
		const quote = getFigure(container).querySelector('.hz-blockquote-quote') as HTMLElement;
		expect(quote.getAttribute('cite')).toBe('https://example.com/quote');
	});

	it('no cite attribute by default', () => {
		const { container } = render(Blockquote, base);
		const quote = getFigure(container).querySelector('.hz-blockquote-quote') as HTMLElement;
		expect(quote.hasAttribute('cite')).toBe(false);
	});

	it('citeUrl never appears as visible text', () => {
		const { container } = render(Blockquote, { ...base, citeUrl: 'https://example.com/quote' });
		expect(getFigure(container).textContent).not.toContain('https://example.com/quote');
	});
});

// ---------------------------------------------------------------------------
// Blockquote-R3 — Attribution is optional
// ---------------------------------------------------------------------------

describe('Blockquote-R3 — attribution is optional', () => {
	it('no cite prop: no figcaption/cite; figure still renders as sole root', () => {
		const { container } = render(Blockquote, base);
		const figure = getFigure(container);
		expect(figure.querySelector('figcaption')).toBeNull();
		expect(figure.querySelector('cite')).toBeNull();
		expect(container.querySelectorAll('.hz-blockquote').length).toBe(1);
	});

	it('with cite: exactly one figcaption containing one cite renders after the quote', () => {
		const { container } = render(Blockquote, { ...base, cite: 'Paul McBeth' });
		const figure = getFigure(container);
		expect(figure.querySelectorAll('figcaption').length).toBe(1);
		expect(figure.querySelectorAll('cite').length).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// Blockquote-R4 — Text-slot convention
// ---------------------------------------------------------------------------

describe('Blockquote-R4 — text-slot convention', () => {
	it('cite as a string renders inside the cite element', () => {
		const { container } = render(Blockquote, { ...base, cite: 'Paul McBeth' });
		expect(getFigure(container).querySelector('.hz-blockquote-cite')?.textContent?.trim()).toBe(
			'Paul McBeth'
		);
	});

	it('cite as a Snippet renders inside the cite element', () => {
		const { container } = render(Blockquote, { ...base, cite: citeSnippet });
		expect(getFigure(container).querySelector('.hz-blockquote-cite em')?.textContent).toBe(
			'Innova'
		);
	});
});

// ---------------------------------------------------------------------------
// Blockquote-R4b — Attribution alignment
// ---------------------------------------------------------------------------

describe('Blockquote-R4b — attribution alignment', () => {
	it('data-align="start" is present by default', () => {
		const { container } = render(Blockquote, base);
		expect(getFigure(container).getAttribute('data-align')).toBe('start');
	});

	it('align="center" and "end" reflect verbatim onto the root', () => {
		const center = render(Blockquote, { ...base, cite: 'Paul McBeth', align: 'center' });
		expect(getFigure(center.container).getAttribute('data-align')).toBe('center');

		const end = render(Blockquote, { ...base, cite: 'Paul McBeth', align: 'end' });
		expect(getFigure(end.container).getAttribute('data-align')).toBe('end');
	});
});

// ---------------------------------------------------------------------------
// Blockquote-R5 — class & rest
// ---------------------------------------------------------------------------

describe('Blockquote-R5 — class and rest forwarding', () => {
	it('class merges after hz-blockquote; rest forwards; managed class wins over a clobber attempt', () => {
		const { container } = render(Blockquote, {
			...base,
			class: 'pull-quote',
			'data-testid': 'my-quote'
		} as Record<string, unknown>);
		const figure = getFigure(container);
		expect(figure.classList.contains('hz-blockquote')).toBe(true);
		expect(figure.classList.contains('pull-quote')).toBe(true);
		expect(figure.getAttribute('data-testid')).toBe('my-quote');
	});

	it('rest does not reach the inner blockquote', () => {
		const { container } = render(Blockquote, {
			...base,
			'data-testid': 'my-quote'
		} as Record<string, unknown>);
		const quote = getFigure(container).querySelector('.hz-blockquote-quote') as HTMLElement;
		expect(quote.hasAttribute('data-testid')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Blockquote-R9 — Intent (accent line only)
// ---------------------------------------------------------------------------

describe('Blockquote-R9 — intent', () => {
	it('no intent by default: no data-intent attribute, accent line stays the default border color', () => {
		const { container } = render(Blockquote, base);
		const figure = getFigure(container);
		expect(figure.hasAttribute('data-intent')).toBe(false);
		const quote = figure.querySelector('.hz-blockquote-quote') as HTMLElement;
		expect(getComputedStyle(quote).borderInlineStartColor).toBe(
			resolveColor('var(--hz-color-border)')
		);
	});

	it('intent reflects onto the root as data-intent', () => {
		const { container } = render(Blockquote, { ...base, intent: 'danger' });
		expect(getFigure(container).getAttribute('data-intent')).toBe('danger');
	});

	it.each(['primary', 'secondary', 'danger', 'warning', 'success', 'info', 'neutral'] as const)(
		'intent="%s" colors only the accent line to --hz-intent-%s',
		(intent) => {
			const { container } = render(Blockquote, { ...base, intent });
			const quote = getFigure(container).querySelector('.hz-blockquote-quote') as HTMLElement;
			expect(getComputedStyle(quote).borderInlineStartColor).toBe(
				resolveColor(`var(--hz-intent-${intent})`)
			);
		}
	);

	it('intent does not change the quote typography or attribution color', () => {
		const { container } = render(Blockquote, {
			...base,
			cite: 'Paul McBeth',
			intent: 'primary'
		});
		const figure = getFigure(container);
		const quote = figure.querySelector('.hz-blockquote-quote') as HTMLElement;
		const attribution = figure.querySelector('.hz-blockquote-attribution') as HTMLElement;
		expect(getComputedStyle(quote).fontSize).toBe(resolveFontSize('var(--hz-font-size-xl)'));
		expect(getComputedStyle(attribution).color).toBe(resolveColor('var(--hz-color-text-muted)'));
	});
});

// ---------------------------------------------------------------------------
// Blockquote-R10 — intentScope (line vs. full)
// ---------------------------------------------------------------------------

describe('Blockquote-R10 — intentScope', () => {
	it('no intent: no data-intent-scope attribute, even if intentScope is explicitly set', () => {
		const { container } = render(Blockquote, { ...base, intentScope: 'full' });
		expect(getFigure(container).hasAttribute('data-intent-scope')).toBe(false);
	});

	it('intent set, intentScope defaults to line: data-intent-scope="line", quote text color untouched', () => {
		const { container } = render(Blockquote, { ...base, intent: 'primary' });
		const figure = getFigure(container);
		expect(figure.getAttribute('data-intent-scope')).toBe('line');
		const quote = figure.querySelector('.hz-blockquote-quote') as HTMLElement;
		expect(getComputedStyle(quote).color).not.toBe(resolveColor('var(--hz-intent-primary)'));
	});

	it('intent set with intentScope="full": data-intent-scope="full", quote text colors to the intent', () => {
		const { container } = render(Blockquote, {
			...base,
			intent: 'primary',
			intentScope: 'full'
		});
		const figure = getFigure(container);
		expect(figure.getAttribute('data-intent-scope')).toBe('full');
		const quote = figure.querySelector('.hz-blockquote-quote') as HTMLElement;
		expect(getComputedStyle(quote).color).toBe(resolveColor('var(--hz-intent-primary)'));
	});

	it('intentScope="full" still leaves the attribution muted', () => {
		const { container } = render(Blockquote, {
			...base,
			cite: 'Paul McBeth',
			intent: 'primary',
			intentScope: 'full'
		});
		const attribution = getFigure(container).querySelector(
			'.hz-blockquote-attribution'
		) as HTMLElement;
		expect(getComputedStyle(attribution).color).toBe(resolveColor('var(--hz-color-text-muted)'));
	});
});

// ---------------------------------------------------------------------------
// Blockquote-R6 — Barrel export
// ---------------------------------------------------------------------------

describe('Blockquote-R6 — barrel export', () => {
	it('Blockquote resolves from $lib and smoke-renders', async () => {
		const { Blockquote: B } = await import('$lib');
		expect(B).toBeDefined();
		const { container } = render(B, base);
		expect(container.querySelector('.hz-blockquote')).not.toBeNull();
	});
});
