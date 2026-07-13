import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Breadcrumbs from './Breadcrumbs.svelte';
import type { BreadcrumbItem } from '$lib/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const trail: BreadcrumbItem[] = [
	{ label: 'Home', href: '/' },
	{ label: 'Components', href: '/components/button' },
	{ label: 'Button' } // current page — no href
];

const linkedTrail: BreadcrumbItem[] = [
	{ label: 'Home', href: '/' },
	{ label: 'Docs', href: '/docs' },
	{ label: 'Current', href: '/docs/current' }
];

const separatorSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="custom-sep">/</span>`
}));

function consumerClasses(el: HTMLElement): string[] {
	return [...el.classList].filter((c) => !c.startsWith('svelte-'));
}

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

describe('structure', () => {
	it('renders <nav class="hz-breadcrumbs" aria-label="Breadcrumb"> wrapping an <ol>', () => {
		const { container } = render(Breadcrumbs, { items: trail });
		const nav = container.querySelector('nav.hz-breadcrumbs') as HTMLElement;
		expect(nav).not.toBeNull();
		expect(nav.getAttribute('aria-label')).toBe('Breadcrumb');
		expect(nav.querySelector('ol')).not.toBeNull();
	});

	it('custom ariaLabel is reflected', () => {
		const { container } = render(Breadcrumbs, { items: trail, ariaLabel: 'You are here' });
		const nav = container.querySelector('nav') as HTMLElement;
		expect(nav.getAttribute('aria-label')).toBe('You are here');
	});

	it('renders one <li> per item', () => {
		const { container } = render(Breadcrumbs, { items: trail });
		expect(container.querySelectorAll('ol > li')).toHaveLength(3);
	});

	it('the trail is a wrapping flex row (cluster-style)', () => {
		const { container } = render(Breadcrumbs, { items: trail });
		const ol = container.querySelector('ol') as HTMLElement;
		expect(getComputedStyle(ol).display).toBe('flex');
		expect(getComputedStyle(ol).flexWrap).toBe('wrap');
	});
});

// ---------------------------------------------------------------------------
// Separators
// ---------------------------------------------------------------------------

describe('separators', () => {
	it('renders items.length − 1 separators, all aria-hidden', () => {
		const { container } = render(Breadcrumbs, { items: trail });
		const seps = container.querySelectorAll('.hz-breadcrumbs-separator');
		expect(seps).toHaveLength(2);
		seps.forEach((sep) => expect(sep.getAttribute('aria-hidden')).toBe('true'));
	});

	it('default separator is the chevron icon', () => {
		const { container } = render(Breadcrumbs, { items: trail });
		expect(container.querySelector('.hz-breadcrumbs-separator svg.hz-icon')).not.toBeNull();
	});

	it('separator snippet replaces the chevron', () => {
		const { container } = render(Breadcrumbs, { items: trail, separator: separatorSnippet });
		expect(container.querySelectorAll('[data-testid="custom-sep"]')).toHaveLength(2);
		expect(container.querySelector('.hz-breadcrumbs-separator svg')).toBeNull();
	});

	it('a single item renders no separator', () => {
		const { container } = render(Breadcrumbs, { items: [{ label: 'Home', href: '/' }] });
		expect(container.querySelectorAll('.hz-breadcrumbs-separator')).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// Current page semantics
// ---------------------------------------------------------------------------

describe('current page', () => {
	it('an href-less last item renders as plain text with aria-current="page"', () => {
		const { container } = render(Breadcrumbs, { items: trail });
		const current = container.querySelector('.hz-breadcrumbs-current') as HTMLElement;
		expect(current).not.toBeNull();
		expect(current.textContent?.trim()).toBe('Button');
		expect(current.getAttribute('aria-current')).toBe('page');
		expect(current.closest('a')).toBeNull();
	});

	it('a linked last item gets aria-current="page" automatically', () => {
		const { container } = render(Breadcrumbs, { items: linkedTrail });
		const links = container.querySelectorAll('a');
		expect(links[links.length - 1].getAttribute('aria-current')).toBe('page');
	});

	it('non-last items never get aria-current', () => {
		const { container } = render(Breadcrumbs, { items: linkedTrail });
		const links = Array.from(container.querySelectorAll('a'));
		links.slice(0, -1).forEach((a) => expect(a.hasAttribute('aria-current')).toBe(false));
	});

	it('an explicit ariaCurrent on the last item wins over the automatic "page"', () => {
		const items: BreadcrumbItem[] = [
			{ label: 'Start', href: '/start' },
			{ label: 'Step 2', href: '/step-2', ariaCurrent: 'step' }
		];
		const { container } = render(Breadcrumbs, { items });
		const links = container.querySelectorAll('a');
		expect(links[links.length - 1].getAttribute('aria-current')).toBe('step');
	});

	it('external crumbs get the external link treatment', () => {
		const items: BreadcrumbItem[] = [
			{ label: 'GitHub', href: 'https://github.com', external: true },
			{ label: 'Here' }
		];
		const { container } = render(Breadcrumbs, { items });
		const link = container.querySelector('a') as HTMLAnchorElement;
		expect(link.getAttribute('target')).toBe('_blank');
	});
});

// ---------------------------------------------------------------------------
// Class composition and rest forwarding
// ---------------------------------------------------------------------------

describe('class and rest', () => {
	it('no class prop → consumer class is exactly "hz-breadcrumbs"', () => {
		const { container } = render(Breadcrumbs, { items: trail });
		const nav = container.querySelector('nav') as HTMLElement;
		expect(consumerClasses(nav)).toEqual(['hz-breadcrumbs']);
	});

	it('class prop is merged after hz-breadcrumbs', () => {
		const { container } = render(Breadcrumbs, { items: trail, class: 'crumbs' });
		const nav = container.querySelector('nav') as HTMLElement;
		expect(consumerClasses(nav)).toEqual(['hz-breadcrumbs', 'crumbs']);
	});

	it('forwards extra attributes to the nav element', () => {
		const { container } = render(Breadcrumbs, {
			items: trail,
			'data-testid': 'my-crumbs'
		} as Record<string, unknown>);
		const nav = container.querySelector('nav') as HTMLElement;
		expect(nav.getAttribute('data-testid')).toBe('my-crumbs');
	});
});

// ---------------------------------------------------------------------------
// Barrel export
// ---------------------------------------------------------------------------

describe('barrel export', () => {
	it('Breadcrumbs is resolvable from $lib', async () => {
		const { Breadcrumbs: B } = await import('$lib');
		expect(B).toBeDefined();
	});
});
