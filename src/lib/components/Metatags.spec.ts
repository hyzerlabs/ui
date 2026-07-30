/**
 * specs/54 R11 — deliberately `Metatags.spec.ts`, not `Metatags.svelte.spec.ts`.
 * The filename is what selects the Vitest project (vite.config.ts): the
 * `client`/browser project matches `src/**\/*.svelte.{test,spec}.ts`, the
 * `server`/node project matches the rest. The truthful assertion surface for
 * a component whose entire output is `<svelte:head>` is the SSR head string a
 * crawler receives, so this spec renders with `render()` from `svelte/server`
 * (the same pattern `src/lib/exports.spec.ts` uses) and asserts on `head`.
 *
 * `render()`'s `head`/`body`/`html` are lazy getters — the component's script
 * (and therefore any `console.warn` inside it) only runs on first access, so
 * every render below reads `head` before asserting on `console.warn` calls.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from 'svelte/server';
import { createRawSnippet } from 'svelte';
import Metatags from './Metatags.svelte';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('Metatags — R1: single <svelte:head>, no body output', () => {
	it('renders nothing into body; every tag lands in head', () => {
		const { head, body } = render(Metatags, {
			props: { siteUrl: 'https://example.com', title: 'Pricing', siteName: 'Example' }
		});
		// The body is Svelte's own empty-fragment hydration boundary (HTML
		// comments only) — there is no wrapper element, no data-*, no visible
		// text. Anything that isn't an HTML comment or whitespace would be this
		// component rendering into the body, which R1 forbids.
		expect(body.replace(/<!--.*?-->/g, '').trim()).toBe('');
		expect(head).toContain('<title>');
	});
});

describe('Metatags — R3: title composition', () => {
	it('title + siteName (different) → "Pricing | Example"', () => {
		const { head } = render(Metatags, { props: { title: 'Pricing', siteName: 'Example' } });
		expect(head).toContain('<title>Pricing | Example</title>');
		expect(head).toContain('property="og:title" content="Pricing | Example"');
		expect(head).toContain('name="twitter:title" content="Pricing | Example"');
	});

	it('title === siteName → one copy, no suffix', () => {
		const { head } = render(Metatags, { props: { title: 'Example', siteName: 'Example' } });
		expect(head).toContain('<title>Example</title>');
		expect(head).not.toContain('Example | Example');
	});

	it('title only → the title, verbatim', () => {
		const { head } = render(Metatags, { props: { title: 'Pricing' } });
		expect(head).toContain('<title>Pricing</title>');
	});

	it('siteName only → the site name (home-page case)', () => {
		const { head } = render(Metatags, { props: { siteName: 'Example' } });
		expect(head).toContain('<title>Example</title>');
	});

	it('neither set → no <title>, and no og:title/twitter:title substring at all', () => {
		const { head } = render(Metatags, { props: {} });
		expect(head).not.toContain('<title>');
		expect(head).not.toContain('og:title');
		expect(head).not.toContain('twitter:title');
	});

	it('a custom titleSeparator is honoured', () => {
		const { head } = render(Metatags, {
			props: { title: 'Pricing', siteName: 'Example', titleSeparator: ' · ' }
		});
		expect(head).toContain('<title>Pricing · Example</title>');
	});
});

describe('Metatags — R4: URL resolution', () => {
	it('a relative url + siteUrl resolves to one absolute URL with a single slash', () => {
		const { head } = render(Metatags, {
			props: { siteUrl: 'https://example.com', url: 'pricing', title: 'Pricing' }
		});
		expect(head).toContain('property="og:url" content="https://example.com/pricing"');
	});

	it('a leading slash on url, or a trailing slash on siteUrl, still lands on one slash', () => {
		const withLeadingSlash = render(Metatags, {
			props: { siteUrl: 'https://example.com', url: '/pricing', title: 'Pricing' }
		});
		expect(withLeadingSlash.head).toContain('og:url" content="https://example.com/pricing"');

		const withTrailingSiteSlash = render(Metatags, {
			props: { siteUrl: 'https://example.com/', url: 'pricing', title: 'Pricing' }
		});
		expect(withTrailingSiteSlash.head).toContain('og:url" content="https://example.com/pricing"');
	});

	it('an absolute url passes through verbatim', () => {
		const { head } = render(Metatags, {
			props: { url: 'https://elsewhere.com/pricing', title: 'Pricing' }
		});
		expect(head).toContain('property="og:url" content="https://elsewhere.com/pricing"');
	});

	it('a protocol-relative image passes through verbatim', () => {
		const { head } = render(Metatags, {
			props: { image: '//cdn.example.com/a.png', imageAlt: 'alt' }
		});
		expect(head).toContain('property="og:image" content="//cdn.example.com/a.png"');
	});

	it('no siteUrl → og:url, twitter:url, and canonical are all omitted', () => {
		const { head } = render(Metatags, { props: { url: '/pricing', title: 'Pricing' } });
		expect(head).not.toContain('og:url');
		expect(head).not.toContain('twitter:url');
		expect(head).not.toContain('rel="canonical"');
	});

	it('a malformed siteUrl is caught, not thrown, and omits the dependent tags', () => {
		// `render()`'s `head` is a lazy getter — reading it inside the assertion
		// is what actually runs the component's script, so this is the call
		// that would throw if `new URL()` weren't caught.
		expect(
			() =>
				render(Metatags, { props: { siteUrl: 'example.com', url: '/pricing', title: 'Pricing' } })
					.head
		).not.toThrow();
		const { head } = render(Metatags, {
			props: { siteUrl: 'example.com', url: '/pricing', title: 'Pricing' }
		});
		expect(head).not.toContain('og:url');
		expect(head).not.toContain('rel="canonical"');
	});

	it('canonical defaults to url, and an explicit canonical overrides it', () => {
		const defaulted = render(Metatags, {
			props: { siteUrl: 'https://example.com', url: '/pricing', title: 'Pricing' }
		});
		expect(defaulted.head).toContain('rel="canonical" href="https://example.com/pricing"');

		const overridden = render(Metatags, {
			props: {
				siteUrl: 'https://example.com',
				url: '/pricing',
				canonical: '/pricing/',
				title: 'Pricing'
			}
		});
		expect(overridden.head).toContain('rel="canonical" href="https://example.com/pricing/"');
	});
});

describe('Metatags — R5: the emitted tag set', () => {
	const full = {
		siteUrl: 'https://example.com',
		siteName: 'Example',
		url: '/pricing',
		title: 'Pricing',
		description: 'Three plans, no seat minimums.',
		image: '/og/pricing.png',
		imageAlt: 'The Example pricing table'
	};

	it('every prop supplied → each tag from R5 exactly once, OG with property=, Twitter with name=', () => {
		const { head } = render(Metatags, { props: full });

		const expectedOnce = [
			'<title>Pricing | Example</title>',
			'<meta name="description" content="Three plans, no seat minimums."/>',
			'<link rel="canonical" href="https://example.com/pricing"/>',
			'<meta property="og:type" content="website"/>',
			'<meta property="og:site_name" content="Example"/>',
			'<meta property="og:title" content="Pricing | Example"/>',
			'<meta property="og:description" content="Three plans, no seat minimums."/>',
			'<meta property="og:url" content="https://example.com/pricing"/>',
			'<meta property="og:image" content="https://example.com/og/pricing.png"/>',
			'<meta property="og:image:alt" content="The Example pricing table"/>',
			'<meta name="twitter:card" content="summary_large_image"/>',
			'<meta name="twitter:title" content="Pricing | Example"/>',
			'<meta name="twitter:description" content="Three plans, no seat minimums."/>',
			'<meta name="twitter:url" content="https://example.com/pricing"/>',
			'<meta name="twitter:image" content="https://example.com/og/pricing.png"/>',
			'<meta name="twitter:image:alt" content="The Example pricing table"/>'
		];
		for (const tag of expectedOnce) {
			expect(head.split(tag).length - 1, tag).toBe(1);
		}
	});

	it('og:type and twitter:card are present with no props at all', () => {
		const { head } = render(Metatags, { props: {} });
		expect(head).toContain('<meta property="og:type" content="website"/>');
		expect(head).toContain('<meta name="twitter:card" content="summary"/>');
	});

	it('twitterCard derives to summary_large_image with a resolved image, summary without', () => {
		// An absolute image URL resolves with no siteUrl needed — isolates the
		// twitterCard derivation from R4's URL-resolution behaviour.
		const withImage = render(Metatags, {
			props: { image: 'https://example.com/a.png', imageAlt: 'a' }
		});
		expect(withImage.head).toContain('name="twitter:card" content="summary_large_image"');

		const withoutImage = render(Metatags, { props: {} });
		expect(withoutImage.head).toContain('name="twitter:card" content="summary"');
	});

	it('an explicit twitterCard wins over the derived value', () => {
		const { head } = render(Metatags, {
			props: { image: 'https://example.com/a.png', imageAlt: 'a', twitterCard: 'summary' }
		});
		expect(head).toContain('name="twitter:card" content="summary"');
		expect(head).not.toContain('summary_large_image');
	});

	it('description="" is treated as absent: no description tags, no empty content', () => {
		const { head } = render(Metatags, { props: { title: 'Pricing', description: '' } });
		expect(head).not.toContain('name="description"');
		expect(head).not.toContain('og:description');
		expect(head).not.toContain('twitter:description');
		expect(head).not.toContain('content=""');
	});

	it("a children snippet's extra tag appears in head, after the managed meta/link tags", () => {
		const robots = createRawSnippet(() => ({
			render: () => '<meta name="robots" content="noindex">'
		}));
		const { head } = render(Metatags, {
			props: { title: 'Pricing', children: robots }
		});
		expect(head).toContain('meta name="robots" content="noindex"');
		// <title> itself is hoisted to the very end of the head string by
		// Svelte's own SSR renderer (a platform detail, not this component's
		// choice) — the meaningful, component-controlled ordering is that the
		// snippet follows every og/twitter meta tag this component manages.
		const lastManagedIndex = head.lastIndexOf('twitter:title');
		const robotsIndex = head.indexOf('name="robots"');
		expect(robotsIndex).toBeGreaterThan(lastManagedIndex);
	});
});

describe('Metatags — R6: dev warnings', () => {
	it('image without imageAlt warns', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { head } = render(Metatags, { props: { title: 'Pricing', image: '/a.png' } });
		expect(head.length).toBeGreaterThan(0); // force the lazy render
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('imageAlt'));
	});

	it('a relative url with no siteUrl warns, naming siteUrl', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { head } = render(Metatags, { props: { title: 'Pricing', url: '/pricing' } });
		expect(head.length).toBeGreaterThan(0);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('siteUrl'));
	});

	it('no title and no siteName warns', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { head } = render(Metatags, { props: {} });
		expect(head.length).toBeGreaterThan(0);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('title'));
	});

	it('a fully-specified render warns zero times', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { head } = render(Metatags, {
			props: {
				siteUrl: 'https://example.com',
				siteName: 'Example',
				url: '/pricing',
				title: 'Pricing',
				description: 'Three plans, no seat minimums.',
				image: '/og/pricing.png',
				imageAlt: 'The Example pricing table'
			}
		});
		expect(head.length).toBeGreaterThan(0);
		expect(warn).not.toHaveBeenCalled();
	});
});
