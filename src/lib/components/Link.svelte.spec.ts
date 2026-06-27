import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Link from './Link.svelte';

// ---------------------------------------------------------------------------
// Snippet helpers
// ---------------------------------------------------------------------------

const childrenSnippet = createRawSnippet(() => ({
	render: () => `<span>Go somewhere</span>`
}));

const iconStartSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="icon-start">S</span>`
}));

const iconEndSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="icon-end">E</span>`
}));

// ---------------------------------------------------------------------------
// R1 — Default render
// ---------------------------------------------------------------------------

describe('R1 — default render', () => {
	it('renders a native <a> element', async () => {
		render(Link, { href: '/x' });
		const el = page.getByRole('link');
		await expect.element(el).toBeInTheDocument();
		expect(el.element().tagName).toBe('A');
	});

	it('has class="hz-link" and correct default data attributes', async () => {
		render(Link, { href: '/x' });
		const el = page.getByRole('link');
		await expect.element(el).toHaveAttribute('class', 'hz-link');
		await expect.element(el).toHaveAttribute('data-variant', 'default');
		await expect.element(el).toHaveAttribute('data-size', 'md');
	});

	it('has the correct href', async () => {
		render(Link, { href: '/x' });
		await expect.element(page.getByRole('link')).toHaveAttribute('href', '/x');
	});

	it('does not have data-external, target, rel, or aria-current by default', async () => {
		render(Link, { href: '/x' });
		const el = page.getByRole('link');
		await expect.element(el).not.toHaveAttribute('data-external');
		await expect.element(el).not.toHaveAttribute('target');
		await expect.element(el).not.toHaveAttribute('rel');
		await expect.element(el).not.toHaveAttribute('aria-current');
	});
});

// ---------------------------------------------------------------------------
// R2 — Children snippet
// ---------------------------------------------------------------------------

describe('R2 — children snippet', () => {
	it('renders the children snippet as the link content', async () => {
		render(Link, { href: '/x', children: childrenSnippet });
		await expect.element(page.getByRole('link')).toHaveTextContent('Go somewhere');
	});
});

// ---------------------------------------------------------------------------
// R3 — Variant
// ---------------------------------------------------------------------------

describe('R3 — variant prop', () => {
	const variants = ['default', 'subtle', 'nav'] as const;

	for (const variant of variants) {
		it(`variant="${variant}" is reflected in data-variant`, async () => {
			render(Link, { href: '/x', variant });
			await expect.element(page.getByRole('link')).toHaveAttribute('data-variant', variant);
		});
	}
});

// ---------------------------------------------------------------------------
// R4 — Size
// ---------------------------------------------------------------------------

describe('R4 — size prop', () => {
	const sizes = ['sm', 'md', 'lg'] as const;

	for (const size of sizes) {
		it(`size="${size}" is reflected in data-size`, async () => {
			render(Link, { href: '/x', size });
			await expect.element(page.getByRole('link')).toHaveAttribute('data-size', size);
		});
	}
});

// ---------------------------------------------------------------------------
// R5 — href verbatim
// ---------------------------------------------------------------------------

describe('R5 — href verbatim', () => {
	it('href="" renders an <a> with href=""', () => {
		const { container } = render(Link, { href: '' });
		const el = container.querySelector('a');
		expect(el).not.toBeNull();
		expect(el?.getAttribute('href')).toBe('');
	});

	it('tag is always A even for href=""', () => {
		const { container } = render(Link, { href: '' });
		const el = container.querySelector('a');
		expect(el?.tagName).toBe('A');
	});

	it('no console.warn fires for href=""', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(Link, { href: '' });
		expect(warnSpy).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// R6 — External prop (explicit only, no auto-detection)
// ---------------------------------------------------------------------------

describe('R6 — external prop', () => {
	it('external=true sets target="_blank", rel="noopener noreferrer"', async () => {
		render(Link, { href: '/x', external: true });
		const el = page.getByRole('link');
		await expect.element(el).toHaveAttribute('target', '_blank');
		await expect.element(el).toHaveAttribute('rel', 'noopener noreferrer');
	});

	it('external=true sets data-external (boolean present)', () => {
		const { container } = render(Link, { href: '/x', external: true });
		const el = container.querySelector('a');
		expect(el?.hasAttribute('data-external')).toBe(true);
	});

	it('external=true renders the sr-only "(opens in new tab)" announcement', () => {
		const { container } = render(Link, { href: '/x', external: true });
		const srSpan = container.querySelector('.sr-only');
		expect(srSpan).not.toBeNull();
		expect(srSpan?.textContent).toBe('(opens in new tab)');
	});

	it('external=false (default) — no target, rel, data-external, or sr-only', async () => {
		render(Link, { href: '/x' });
		const el = page.getByRole('link');
		await expect.element(el).not.toHaveAttribute('target');
		await expect.element(el).not.toHaveAttribute('rel');
		await expect.element(el).not.toHaveAttribute('data-external');
		await expect.element(el).not.toHaveTextContent('opens in new tab');
	});

	it('no auto-detection: https:// href without external prop has no external attrs', async () => {
		render(Link, { href: 'https://example.com' });
		const el = page.getByRole('link');
		await expect.element(el).not.toHaveAttribute('target');
		await expect.element(el).not.toHaveAttribute('rel');
		await expect.element(el).not.toHaveAttribute('data-external');
	});

	it('external=true with an internal-looking href still gets all external attrs', async () => {
		render(Link, { href: '/docs', external: true });
		const el = page.getByRole('link');
		await expect.element(el).toHaveAttribute('target', '_blank');
		await expect.element(el).toHaveAttribute('rel', 'noopener noreferrer');
		expect(el.element().hasAttribute('data-external')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// R7 — No visible external icon
// ---------------------------------------------------------------------------

describe('R7 — no automatic visible external icon', () => {
	it('external=true renders no svg by the component', () => {
		const { container } = render(Link, { href: '/x', external: true });
		const svg = container.querySelector('svg');
		expect(svg).toBeNull();
	});

	it('iconEnd snippet renders when supplied', () => {
		const { container } = render(Link, { href: '/x', iconEnd: iconEndSnippet });
		expect(container.querySelector('[data-testid="icon-end"]')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R8 — aria-current (no data-current)
// ---------------------------------------------------------------------------

describe('R8 — aria-current', () => {
	it('ariaCurrent="page" sets aria-current="page"', async () => {
		render(Link, { href: '/x', ariaCurrent: 'page' });
		await expect.element(page.getByRole('link')).toHaveAttribute('aria-current', 'page');
	});

	it('ariaCurrent="page" emits no data-current attribute', () => {
		const { container } = render(Link, { href: '/x', ariaCurrent: 'page' });
		const el = container.querySelector('a');
		expect(el?.hasAttribute('data-current')).toBe(false);
	});

	it('no ariaCurrent prop — aria-current is absent', async () => {
		render(Link, { href: '/x' });
		await expect.element(page.getByRole('link')).not.toHaveAttribute('aria-current');
	});
});

// ---------------------------------------------------------------------------
// R9 — ariaLabel
// ---------------------------------------------------------------------------

describe('R9 — ariaLabel prop', () => {
	it('ariaLabel sets aria-label on the root <a>', async () => {
		render(Link, { href: '/x', ariaLabel: 'Docs' });
		await expect.element(page.getByRole('link')).toHaveAttribute('aria-label', 'Docs');
	});
});

// ---------------------------------------------------------------------------
// R10 — Icon snippets
// ---------------------------------------------------------------------------

describe('R10 — icon snippets', () => {
	it('iconStart renders before children content', async () => {
		render(Link, { href: '/x', children: childrenSnippet, iconStart: iconStartSnippet });
		const el = page.getByRole('link');
		await expect.element(el).toBeInTheDocument();
		const html = el.element().innerHTML;
		expect(html.indexOf('icon-start')).toBeLessThan(html.indexOf('Go somewhere'));
	});

	it('iconEnd renders after children content', async () => {
		render(Link, { href: '/x', children: childrenSnippet, iconEnd: iconEndSnippet });
		const el = page.getByRole('link');
		await expect.element(el).toBeInTheDocument();
		const html = el.element().innerHTML;
		expect(html.indexOf('Go somewhere')).toBeLessThan(html.indexOf('icon-end'));
	});

	it('iconStart and iconEnd both render in correct DOM order', async () => {
		render(Link, {
			href: '/x',
			children: childrenSnippet,
			iconStart: iconStartSnippet,
			iconEnd: iconEndSnippet
		});
		const el = page.getByRole('link');
		await expect.element(el).toBeInTheDocument();
		const html = el.element().innerHTML;
		expect(html.indexOf('icon-start')).toBeLessThan(html.indexOf('Go somewhere'));
		expect(html.indexOf('Go somewhere')).toBeLessThan(html.indexOf('icon-end'));
	});

	it('sr-only announcement follows iconEnd when external=true', async () => {
		render(Link, {
			href: '/x',
			external: true,
			children: childrenSnippet,
			iconEnd: iconEndSnippet
		});
		const el = page.getByRole('link');
		await expect.element(el).toBeInTheDocument();
		const html = el.element().innerHTML;
		expect(html.indexOf('icon-end')).toBeLessThan(html.indexOf('sr-only'));
	});
});

// ---------------------------------------------------------------------------
// R11 — class prop composition
// ---------------------------------------------------------------------------

describe('R11 — class prop composition', () => {
	it('no class prop — rendered class is exactly "hz-link"', async () => {
		render(Link, { href: '/x' });
		await expect.element(page.getByRole('link')).toHaveAttribute('class', 'hz-link');
	});

	it('class="foo bar" — rendered class is "hz-link foo bar"', async () => {
		render(Link, { href: '/x', class: 'foo bar' });
		await expect.element(page.getByRole('link')).toHaveAttribute('class', 'hz-link foo bar');
	});
});

// ---------------------------------------------------------------------------
// R12 — Icon-only dev warning
// ---------------------------------------------------------------------------

describe('R12 — icon-only dev warning', () => {
	it('warns when icon-only and ariaLabel is absent', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		render(Link, { href: '/x', iconStart: iconStartSnippet });

		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('ariaLabel');

		warnSpy.mockRestore();
	});

	it('does not warn when ariaLabel is provided', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		render(Link, { href: '/x', iconStart: iconStartSnippet, ariaLabel: 'Home' });

		expect(warnSpy).not.toHaveBeenCalled();

		warnSpy.mockRestore();
	});

	it('does not warn when there are no icons and no children (empty link)', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		render(Link, { href: '/x' });

		expect(warnSpy).not.toHaveBeenCalled();

		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// R13 — onclick + attribute forwarding
// ---------------------------------------------------------------------------

describe('R13 — onclick and rest attribute forwarding', () => {
	it('invokes onclick on a normal click', async () => {
		const handler = vi.fn((e: MouseEvent) => e.preventDefault());
		render(Link, { href: '/x', onclick: handler, children: childrenSnippet });
		await page.getByRole('link').click();
		expect(handler).toHaveBeenCalledOnce();
	});

	it('forwards extra attributes (e.g. data-testid) to the root element', async () => {
		render(Link, { href: '/x', 'data-testid': 'my-link' } as Record<string, unknown>);
		await expect.element(page.getByRole('link')).toHaveAttribute('data-testid', 'my-link');
	});

	it('rest attribute cannot overwrite managed data-variant', async () => {
		render(Link, { href: '/x', 'data-variant': 'override' } as Record<string, unknown>);
		await expect.element(page.getByRole('link')).toHaveAttribute('data-variant', 'default');
	});

	it('rest attribute cannot overwrite managed target (external=true wins over rest _self)', async () => {
		// `target` conflicts with a Svelte testing-library option name, so props
		// must be wrapped under the `props` key to disambiguate.
		render(Link, { props: { href: '/x', external: true, target: '_self' } });
		await expect.element(page.getByRole('link')).toHaveAttribute('target', '_blank');
	});

	it('hz-link class is always preserved when class prop is set', async () => {
		render(Link, { href: '/x', class: 'custom' });
		const el = page.getByRole('link');
		const cls = el.element().getAttribute('class') ?? '';
		expect(cls.startsWith('hz-link')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// R14 — Barrel export
// ---------------------------------------------------------------------------

describe('R14 — barrel export', () => {
	it('Link is resolvable from $lib', async () => {
		const { Link } = await import('$lib');
		expect(Link).toBeDefined();
	});
});
