import { page } from 'vitest/browser';
import { describe, expect, it, afterEach, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Footer from './Footer.svelte';
import type { FooterColumn } from '$lib/types';

// ---------------------------------------------------------------------------
// Snippet helpers
// ---------------------------------------------------------------------------

const logoSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="logo">Logo</span>`
}));

const socialSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="social">Social</span>`
}));

const bottomSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="bottom">Bottom</span>`
}));

// ---------------------------------------------------------------------------
// Sample columns
// ---------------------------------------------------------------------------

const singleColumn: FooterColumn[] = [
	{
		title: 'Company',
		links: [
			{ label: 'About', href: '/about' },
			{ label: 'Careers', href: '/careers' }
		]
	}
];

const threeColumns: FooterColumn[] = [
	{ title: 'Company', links: [{ label: 'About', href: '/about' }] },
	{ title: 'Product', links: [{ label: 'Features', href: '/features' }] },
	{ title: 'Support', links: [{ label: 'Docs', href: '/docs' }] }
];

// ---------------------------------------------------------------------------
// R1 — Root landmark
// ---------------------------------------------------------------------------

describe('R1 — root landmark', () => {
	it('renders <footer class="hz-footer"> with data-variant="default" by default', () => {
		const { container } = render(Footer, { columns: [] });
		const footer = container.querySelector('footer.hz-footer') as HTMLElement;
		expect(footer).not.toBeNull();
		expect(footer.getAttribute('data-variant')).toBe('default');
	});

	it.each(['default', 'minimal'] as const)(
		'variant="%s" is reflected in data-variant',
		(variant) => {
			const { container } = render(Footer, { columns: [], variant });
			const footer = container.querySelector('footer') as HTMLElement;
			expect(footer.getAttribute('data-variant')).toBe(variant);
		}
	);

	it('data-bordered is absent by default and present with bordered — composes with variant', () => {
		const { container } = render(Footer, { columns: [] });
		expect((container.querySelector('footer') as HTMLElement).hasAttribute('data-bordered')).toBe(
			false
		);
		const { container: c2 } = render(Footer, { columns: [], bordered: true, variant: 'minimal' });
		const footer = c2.querySelector('footer') as HTMLElement;
		expect(footer.hasAttribute('data-bordered')).toBe(true);
		expect(footer.getAttribute('data-variant')).toBe('minimal');
	});

	it('does not render a role attribute on the root footer', () => {
		const { container } = render(Footer, { columns: [] });
		const footer = container.querySelector('footer') as HTMLElement;
		expect(footer.getAttribute('role')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R2 — columns=[] smoke render
// ---------------------------------------------------------------------------

describe('R2 — columns=[] smoke render', () => {
	it('renders <footer> with no hz-footer-column elements when columns is empty', () => {
		const { container } = render(Footer, { columns: [] });
		expect(container.querySelector('footer')).not.toBeNull();
		expect(container.querySelector('.hz-footer-column')).toBeNull();
	});

	it('renders logo/social/bottom snippets even when columns is empty', () => {
		const { container } = render(Footer, {
			columns: [],
			logo: logoSnippet,
			social: socialSnippet,
			bottom: bottomSnippet
		});
		expect(container.querySelector('[data-testid="logo"]')).not.toBeNull();
		expect(container.querySelector('[data-testid="social"]')).not.toBeNull();
		expect(container.querySelector('[data-testid="bottom"]')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R3 — logo / social / bottom snippets
// ---------------------------------------------------------------------------

describe('R3 — logo / social / bottom snippets', () => {
	it('logo snippet renders inside hz-footer-logo wrapper when provided', () => {
		const { container } = render(Footer, { columns: [], logo: logoSnippet });
		const wrapper = container.querySelector('.hz-footer-logo') as HTMLElement;
		expect(wrapper).not.toBeNull();
		expect(wrapper.querySelector('[data-testid="logo"]')).not.toBeNull();
	});

	it('hz-footer-logo wrapper absent when logo not provided', () => {
		const { container } = render(Footer, { columns: [] });
		expect(container.querySelector('.hz-footer-logo')).toBeNull();
	});

	it('social snippet renders inside hz-footer-social wrapper when provided', () => {
		const { container } = render(Footer, { columns: [], social: socialSnippet });
		const wrapper = container.querySelector('.hz-footer-social') as HTMLElement;
		expect(wrapper).not.toBeNull();
		expect(wrapper.querySelector('[data-testid="social"]')).not.toBeNull();
	});

	it('hz-footer-social wrapper absent when social not provided', () => {
		const { container } = render(Footer, { columns: [] });
		expect(container.querySelector('.hz-footer-social')).toBeNull();
	});

	it('bottom snippet renders inside hz-footer-bottom wrapper when provided', () => {
		const { container } = render(Footer, { columns: [], bottom: bottomSnippet });
		const wrapper = container.querySelector('.hz-footer-bottom') as HTMLElement;
		expect(wrapper).not.toBeNull();
		expect(wrapper.querySelector('[data-testid="bottom"]')).not.toBeNull();
	});

	it('hz-footer-bottom wrapper absent when bottom not provided', () => {
		const { container } = render(Footer, { columns: [] });
		expect(container.querySelector('.hz-footer-bottom')).toBeNull();
	});

	it('logo renders before columns, social renders after columns, bottom renders last', () => {
		const { container } = render(Footer, {
			columns: singleColumn,
			logo: logoSnippet,
			social: socialSnippet,
			bottom: bottomSnippet
		});
		const footer = container.querySelector('footer') as HTMLElement;
		const children = Array.from(footer.children);
		const logoIdx = children.findIndex((el) => el.classList.contains('hz-footer-logo'));
		const gridIdx = children.findIndex((el) => el.classList.contains('hz-footer-columns'));
		const socialIdx = children.findIndex((el) => el.classList.contains('hz-footer-social'));
		const bottomIdx = children.findIndex((el) => el.classList.contains('hz-footer-bottom'));
		expect(logoIdx).toBeGreaterThanOrEqual(0);
		expect(gridIdx).toBeGreaterThanOrEqual(0);
		expect(socialIdx).toBeGreaterThanOrEqual(0);
		expect(bottomIdx).toBeGreaterThanOrEqual(0);
		expect(logoIdx).toBeLessThan(gridIdx);
		expect(gridIdx).toBeLessThan(socialIdx);
		expect(socialIdx).toBeLessThan(bottomIdx);
	});

	it('no empty wrapper elements when no snippets are provided', () => {
		const { container } = render(Footer, { columns: [] });
		expect(container.querySelector('.hz-footer-logo')).toBeNull();
		expect(container.querySelector('.hz-footer-social')).toBeNull();
		expect(container.querySelector('.hz-footer-bottom')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R4 — column structure
// ---------------------------------------------------------------------------

describe('R4 — column structure', () => {
	it('each column renders as <nav class="hz-footer-column" aria-label="{title}">', () => {
		const { container } = render(Footer, { columns: singleColumn });
		const nav = container.querySelector('nav.hz-footer-column') as HTMLElement;
		expect(nav).not.toBeNull();
		expect(nav.getAttribute('aria-label')).toBe('Company');
	});

	it('column contains <h2 class="hz-footer-heading"> by default (headingLevel=2)', () => {
		const { container } = render(Footer, { columns: singleColumn });
		const heading = container.querySelector('h2.hz-footer-heading') as HTMLElement;
		expect(heading).not.toBeNull();
		expect(heading.textContent?.trim()).toBe('Company');
	});

	it('headingLevel={3} renders <h3 class="hz-footer-heading">', () => {
		const { container } = render(Footer, { columns: singleColumn, headingLevel: 3 });
		expect(container.querySelector('h3.hz-footer-heading')).not.toBeNull();
		expect(container.querySelector('h2.hz-footer-heading')).toBeNull();
	});

	it.each([2, 3, 4, 5, 6] as const)(
		'headingLevel={%d} reflects verbatim in the rendered heading tag',
		(level) => {
			const { container } = render(Footer, { columns: singleColumn, headingLevel: level });
			expect(container.querySelector(`h${level}.hz-footer-heading`)).not.toBeNull();
		}
	);

	it('column contains a <ul role="list"> containing the links', () => {
		const { container } = render(Footer, { columns: singleColumn });
		const ul = container.querySelector('nav.hz-footer-column ul[role="list"]') as HTMLElement;
		expect(ul).not.toBeNull();
		expect(ul.querySelectorAll('li').length).toBe(2);
	});

	it('multiple columns render multiple distinctly-labeled <nav> elements', () => {
		const { container } = render(Footer, { columns: threeColumns });
		const navs = container.querySelectorAll('nav.hz-footer-column');
		expect(navs.length).toBe(3);
		expect(navs[0].getAttribute('aria-label')).toBe('Company');
		expect(navs[1].getAttribute('aria-label')).toBe('Product');
		expect(navs[2].getAttribute('aria-label')).toBe('Support');
	});

	it('column with empty links renders nav + heading + empty <ul role="list"> without error', () => {
		const emptyColumn: FooterColumn[] = [{ title: 'Empty', links: [] }];
		const { container } = render(Footer, { columns: emptyColumn });
		expect(container.querySelector('nav.hz-footer-column')).not.toBeNull();
		const ul = container.querySelector('ul[role="list"]') as HTMLElement;
		expect(ul).not.toBeNull();
		expect(ul.children.length).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// R5 — links reuse Link component
// ---------------------------------------------------------------------------

describe('R5 — links reuse Link component', () => {
	it('link item renders an hz-link anchor with data-variant="subtle" by default', () => {
		const { container } = render(Footer, { columns: singleColumn });
		const a = container.querySelector('.hz-link') as HTMLAnchorElement;
		expect(a).not.toBeNull();
		expect(a.getAttribute('data-variant')).toBe('subtle');
		expect(a.getAttribute('href')).toBe('/about');
	});

	it('linkVariant="nav" renders every footer Link with data-variant="nav"', () => {
		const { container } = render(Footer, { columns: singleColumn, linkVariant: 'nav' });
		const links = container.querySelectorAll('.hz-link');
		expect(links.length).toBeGreaterThan(0);
		links.forEach((a) => {
			expect(a.getAttribute('data-variant')).toBe('nav');
		});
	});

	it('linkVariant="default" renders every footer Link with data-variant="default"', () => {
		const { container } = render(Footer, { columns: singleColumn, linkVariant: 'default' });
		const links = container.querySelectorAll('.hz-link');
		expect(links.length).toBeGreaterThan(0);
		links.forEach((a) => {
			expect(a.getAttribute('data-variant')).toBe('default');
		});
	});

	it('external link item gets target="_blank" and rel="noopener noreferrer" via Link', () => {
		const externalColumn: FooterColumn[] = [
			{
				title: 'External',
				links: [{ label: 'Docs', href: 'https://docs.example.com', external: true }]
			}
		];
		const { container } = render(Footer, { columns: externalColumn });
		const a = container.querySelector('a') as HTMLAnchorElement;
		expect(a.getAttribute('target')).toBe('_blank');
		expect(a.getAttribute('rel')).toBe('noopener noreferrer');
	});

	it('external link item renders sr-only "(opens in new tab)" announcement via Link', () => {
		const externalColumn: FooterColumn[] = [
			{
				title: 'External',
				links: [{ label: 'Docs', href: 'https://docs.example.com', external: true }]
			}
		];
		const { container } = render(Footer, { columns: externalColumn });
		const srOnly = container.querySelector('.sr-only') as HTMLElement;
		expect(srOnly).not.toBeNull();
		expect(srOnly.textContent).toContain('opens in new tab');
	});

	it('ariaCurrent item surfaces aria-current on the anchor via Link', () => {
		const currentColumn: FooterColumn[] = [
			{
				title: 'Nav',
				links: [{ label: 'Home', href: '/', ariaCurrent: 'page' }]
			}
		];
		const { container } = render(Footer, { columns: currentColumn });
		const a = container.querySelector('a') as HTMLAnchorElement;
		expect(a.getAttribute('aria-current')).toBe('page');
	});
});

// ---------------------------------------------------------------------------
// R6 — children ignored
// ---------------------------------------------------------------------------

describe('R6 — children ignored', () => {
	it('NavItem.children renders only the flat link, no nested list', () => {
		const withChildren: FooterColumn[] = [
			{
				title: 'Nav',
				links: [
					{
						label: 'Products',
						href: '/products',
						children: [
							{ label: 'Sub Item', href: '/sub' },
							{ label: 'Another', href: '/another' }
						]
					}
				]
			}
		];
		const { container } = render(Footer, { columns: withChildren });
		const ul = container.querySelector('ul[role="list"]') as HTMLElement;
		// Only 1 li for the parent item — no nested lists
		expect(ul.querySelectorAll('li').length).toBe(1);
		expect(ul.querySelector('ul')).toBeNull();
	});

	it('NavItem.children does not produce dropdown triggers', () => {
		const withChildren: FooterColumn[] = [
			{
				title: 'Nav',
				links: [
					{ label: 'Products', href: '/products', children: [{ label: 'Sub', href: '/sub' }] }
				]
			}
		];
		const { container } = render(Footer, { columns: withChildren });
		expect(container.querySelector('button')).toBeNull();
		expect(container.querySelector('[aria-expanded]')).toBeNull();
	});

	it('children carries one dev warning per render naming the first offender (specs/63 R2)', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { container } = render(Footer, {
			columns: [
				{
					title: 'A',
					links: [{ label: 'Products', href: '/p', children: [{ label: 'S', href: '/s' }] }]
				},
				{
					title: 'B',
					links: [{ label: 'More', href: '/m', children: [{ label: 'T', href: '/t' }] }]
				}
			]
		});
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('[hz-footer]');
		expect(warnSpy.mock.calls[0][0]).toContain('Products');
		// specs/63 R1 — Footer never composes Nav, even for children-carrying items.
		expect(container.querySelector('.hz-nav')).toBeNull();
		warnSpy.mockRestore();
	});

	it('children: [] (present but empty) still warns (specs/63 R2)', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(Footer, {
			columns: [{ title: 'A', links: [{ label: 'Products', href: '/p', children: [] }] }]
		});
		expect(warnSpy).toHaveBeenCalledOnce();
		warnSpy.mockRestore();
	});

	it('defaultOpen without children does not warn (specs/63 R2)', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(Footer, {
			columns: [{ title: 'A', links: [{ label: 'Products', href: '/p', defaultOpen: true }] }]
		});
		expect(warnSpy).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});

	it('a clean footer does not warn (specs/63 R2)', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(Footer, { columns: threeColumns });
		expect(warnSpy).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// specs/63 R3 — blank column title degrades the landmark
// ---------------------------------------------------------------------------

describe('specs/63 R3 — blank column title', () => {
	const links = [{ label: 'About', href: '/about' }];

	function expectDegraded(container: HTMLElement) {
		const column = container.querySelector('.hz-footer-column') as HTMLElement;
		expect(column.tagName).toBe('DIV');
		expect(column.hasAttribute('aria-label')).toBe(false);
		expect(column.querySelector('.hz-footer-heading')).toBeNull();
		expect(column.querySelectorAll('ul[role="list"] li').length).toBe(1);
	}

	it("title: '' renders a div column — no nav, no heading, links intact — and warns", () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { container } = render(Footer, { columns: [{ title: '', links }] });
		expectDegraded(container as HTMLElement);
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('[hz-footer]');
		expect(warnSpy.mock.calls[0][0]).toContain('Column 0');
		warnSpy.mockRestore();
	});

	it("title: '   ' behaves identically to ''", () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { container } = render(Footer, { columns: [{ title: '   ', links }] });
		expectDegraded(container as HTMLElement);
		expect(warnSpy).toHaveBeenCalledOnce();
		warnSpy.mockRestore();
	});

	it('mixed blank + non-blank: only the blank column degrades', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { container } = render(Footer, {
			columns: [
				{ title: 'Company', links },
				{ title: '', links }
			]
		});
		const columns = container.querySelectorAll('.hz-footer-column');
		expect(columns.length).toBe(2);
		expect(columns[0].tagName).toBe('NAV');
		expect(columns[0].getAttribute('aria-label')).toBe('Company');
		expect(columns[1].tagName).toBe('DIV');
		expect(warnSpy.mock.calls[0][0]).toContain('Column 1');
		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// R7 — non-navigable item (no href)
// ---------------------------------------------------------------------------

describe('R7 — non-navigable item (no href)', () => {
	it('NavItem without href renders plain-text label inside <li>, no <a>', () => {
		const noHrefColumn: FooterColumn[] = [
			{
				title: 'Section',
				links: [{ label: 'Divider' }]
			}
		];
		const { container } = render(Footer, { columns: noHrefColumn });
		const li = container.querySelector('ul[role="list"] li') as HTMLElement;
		expect(li).not.toBeNull();
		expect(li.textContent?.trim()).toBe('Divider');
		expect(li.querySelector('a')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R8 — responsive columns via Grid + auto-fit override (integration)
// ---------------------------------------------------------------------------

describe('R8 — responsive columns grid', () => {
	afterEach(async () => {
		await page.viewport(1024, 768);
	});

	it('columns container carries both hz-grid and hz-footer-columns classes', () => {
		const { container } = render(Footer, { columns: threeColumns });
		const grid = container.querySelector('.hz-footer-columns') as HTMLElement;
		expect(grid).not.toBeNull();
		expect(grid.classList.contains('hz-grid')).toBe(true);
	});

	it('at narrow viewport (320px) columns grid computes a single track (stacked)', async () => {
		const { container } = render(Footer, { columns: threeColumns });
		await page.viewport(320, 600);
		const grid = container.querySelector('.hz-footer-columns > .hz-grid-layout') as HTMLElement;
		const computedCols = getComputedStyle(grid).gridTemplateColumns;
		// Single track = one space-delimited value (e.g. "304px")
		const trackCount = computedCols.trim().split(/\s+/).length;
		expect(trackCount).toBe(1);
	});

	it('at wide viewport (700px) with 3 columns grid computes multiple tracks', async () => {
		const { container } = render(Footer, { columns: threeColumns });
		await page.viewport(700, 600);
		const grid = container.querySelector('.hz-footer-columns > .hz-grid-layout') as HTMLElement;
		const computedCols = getComputedStyle(grid).gridTemplateColumns;
		// Multiple tracks = multiple space-delimited values (e.g. "228px 228px 228px")
		const trackCount = computedCols.trim().split(/\s+/).length;
		expect(trackCount).toBeGreaterThan(1);
	});
});

// ---------------------------------------------------------------------------
// R10 — class composition
// ---------------------------------------------------------------------------

describe('R10 — class composition', () => {
	it('no class prop → rendered class is exactly "hz-footer"', () => {
		const { container } = render(Footer, { columns: [] });
		const footer = container.querySelector('footer') as HTMLElement;
		const classes = [...footer.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toEqual(['hz-footer']);
	});

	it('class="foo bar" → hz-footer is first, foo and bar are present', () => {
		const { container } = render(Footer, { columns: [], class: 'foo bar' });
		const footer = container.querySelector('footer') as HTMLElement;
		const classes = [...footer.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-footer');
		expect(classes).toContain('foo');
		expect(classes).toContain('bar');
	});
});

// ---------------------------------------------------------------------------
// R11 — rest forwarding
// ---------------------------------------------------------------------------

describe('R11 — rest forwarding', () => {
	it('arbitrary rest attr (data-testid) is forwarded to the root <footer>', () => {
		const { container } = render(Footer, {
			columns: [],
			'data-testid': 'my-footer'
		} as Record<string, unknown>);
		const footer = container.querySelector('footer') as HTMLElement;
		expect(footer.getAttribute('data-testid')).toBe('my-footer');
	});

	it('rest override attempt on data-variant → managed value wins', () => {
		const { container } = render(Footer, {
			columns: [],
			'data-variant': 'override'
		} as Record<string, unknown>);
		const footer = container.querySelector('footer') as HTMLElement;
		expect(footer.getAttribute('data-variant')).toBe('default');
	});

	it('hz-footer class is always present even when class prop carries extra classes', () => {
		const { container } = render(Footer, { columns: [], class: 'custom-class' });
		const footer = container.querySelector('footer') as HTMLElement;
		expect(footer.classList.contains('hz-footer')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// R12 — barrel export (see also exports.spec.ts)
// ---------------------------------------------------------------------------

describe('R12 — barrel export', () => {
	it('Footer is resolvable from $lib', async () => {
		const { Footer } = await import('$lib');
		expect(Footer).toBeDefined();
	});

	it('Footer smoke-renders from $lib import', async () => {
		const { Footer } = await import('$lib');
		const { container } = render(Footer, { columns: [] });
		expect(container.querySelector('footer.hz-footer')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
	it('item with children ignored: only label text and href rendered, no nested markup', () => {
		const col: FooterColumn[] = [
			{
				title: 'Nav',
				links: [{ label: 'Top', href: '/top', children: [{ label: 'Nested', href: '/nested' }] }]
			}
		];
		const { container } = render(Footer, { columns: col });
		const links = container.querySelectorAll('a');
		// Only the parent link renders, not the nested child
		expect(links.length).toBe(1);
		expect(links[0].textContent?.trim()).toBe('Top');
	});

	it('ariaCurrent="step" surfaces on the anchor via Link', () => {
		const col: FooterColumn[] = [
			{ title: 'Nav', links: [{ label: 'Step', href: '/step', ariaCurrent: 'step' }] }
		];
		const { container } = render(Footer, { columns: col });
		const a = container.querySelector('a') as HTMLAnchorElement;
		expect(a.getAttribute('aria-current')).toBe('step');
	});

	it('very long column title renders without truncation (no overflow attribute)', () => {
		const longTitle = 'A Very Long Column Title That Should Not Be Truncated By The Component';
		const col: FooterColumn[] = [{ title: longTitle, links: [] }];
		const { container } = render(Footer, { columns: col });
		const heading = container.querySelector('.hz-footer-heading') as HTMLElement;
		expect(heading.textContent?.trim()).toBe(longTitle);
	});

	it('six columns render six labeled nav landmarks', () => {
		const sixColumns: FooterColumn[] = Array.from({ length: 6 }, (_, i) => ({
			title: `Column ${i + 1}`,
			links: [{ label: `Link ${i + 1}`, href: `/link-${i + 1}` }]
		}));
		const { container } = render(Footer, { columns: sixColumns });
		const navs = container.querySelectorAll('nav.hz-footer-column');
		expect(navs.length).toBe(6);
	});
});
