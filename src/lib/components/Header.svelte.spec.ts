import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Header from './Header.svelte';
import type { NavItem } from '$lib/types';

const logoSnippet = createRawSnippet(() => ({
	render: () => `<strong data-testid="logo">Logo</strong>`
}));
const actions = createRawSnippet(() => ({
	render: () => `<button data-testid="actions-btn">Sign up</button>`
}));
const menuIcon = createRawSnippet(() => ({
	render: () => `<span data-testid="custom-menu-icon">≡</span>`
}));

const items: NavItem[] = [
	{ label: 'Home', href: '/' },
	{ label: 'Products', children: [{ label: 'A', href: '/a' }] }
];

function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

function parts(container: HTMLElement) {
	return {
		header: container.querySelector('header.hz-header') as HTMLElement,
		inner: container.querySelector('.hz-header-inner') as HTMLElement,
		toggle: container.querySelector('.hz-header-toggle') as HTMLButtonElement,
		drawer: container.querySelector('.hz-header-drawer') as HTMLElement,
		navs: Array.from(container.querySelectorAll('nav.hz-nav'))
	};
}

describe('Header — bar chrome', () => {
	it('renders <header class="hz-header"> with a horizontal Nav', () => {
		const { container } = render(Header, { items });
		const { header, navs } = parts(container);
		expect(header).not.toBeNull();
		// Two navs: the bar (horizontal) and the drawer (vertical).
		expect(navs.length).toBe(2);
		expect(navs[0].getAttribute('data-orientation')).toBe('horizontal');
		expect(navs[1].getAttribute('data-orientation')).toBe('vertical');
	});

	it('logo renders in the bar; actions render in both the bar and the drawer', () => {
		const { container } = render(Header, { items, logo: logoSnippet, actions });
		expect(container.querySelector('[data-testid="logo"]')).not.toBeNull();
		expect(container.querySelectorAll('[data-testid="actions-btn"]').length).toBe(2);
		const { inner, drawer } = parts(container);
		expect(inner.querySelector('.hz-header-actions [data-testid="actions-btn"]')).not.toBeNull();
		expect(
			drawer.querySelector('.hz-header-drawer-actions [data-testid="actions-btn"]')
		).not.toBeNull();
	});

	it('reflects variant / sticky / bordered / mobileBreakpoint on the root', () => {
		const { container } = render(Header, {
			items,
			variant: 'transparent',
			sticky: true,
			bordered: true,
			mobileBreakpoint: 'sm'
		});
		const { header } = parts(container);
		expect(header.getAttribute('data-variant')).toBe('transparent');
		expect(header.hasAttribute('data-sticky')).toBe(true);
		expect(header.hasAttribute('data-bordered')).toBe(true);
		expect(header.getAttribute('data-mobile-breakpoint')).toBe('sm');
	});

	it('the two nav landmarks have distinct accessible names', () => {
		const { container } = render(Header, { items, ariaLabel: 'Site' });
		const { navs } = parts(container);
		expect(navs[0].getAttribute('aria-label')).toBe('Site');
		expect(navs[1].getAttribute('aria-label')).toBe('Site (menu)');
	});
});

describe('Header — mobile drawer', () => {
	it('the toggle carries aria-expanded / aria-controls matching the drawer id', () => {
		const { container } = render(Header, { items });
		const { toggle, drawer } = parts(container);
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(toggle.getAttribute('aria-controls')).toBe(drawer.id);
		expect(drawer.getAttribute('data-state')).toBe('closed');
	});

	it('clicking the toggle opens the drawer', async () => {
		const { container } = render(Header, { items });
		const { toggle } = parts(container);
		toggle.click();
		await tick();
		expect(parts(container).toggle.getAttribute('aria-expanded')).toBe('true');
		expect(parts(container).drawer.getAttribute('data-state')).toBe('open');
	});

	it('Escape closes the drawer and returns focus to the toggle', async () => {
		const { container } = render(Header, { items });
		const { toggle, drawer } = parts(container);
		toggle.click();
		await tick();
		drawer.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
		);
		await tick();
		expect(parts(container).drawer.getAttribute('data-state')).toBe('closed');
		expect(document.activeElement).toBe(parts(container).toggle);
	});

	it('menuIcon replaces the default hamburger icon', () => {
		const { container } = render(Header, { items, menuIcon });
		const { toggle } = parts(container);
		expect(toggle.querySelector('[data-testid="custom-menu-icon"]')).not.toBeNull();
		expect(toggle.querySelector('svg')).toBeNull();
	});

	it('mobileBreakpoint="none": the toggle and drawer are display:none', () => {
		const { container } = render(Header, { items, mobileBreakpoint: 'none' });
		const { toggle, drawer } = parts(container);
		expect(getComputedStyle(toggle).display).toBe('none');
		expect(getComputedStyle(drawer).display).toBe('none');
	});
});

describe('Header — barrel export', () => {
	it('Header is resolvable from $lib', async () => {
		const mod = await import('$lib');
		expect(mod.Header).toBeDefined();
	});

	it('is a banner-region <header>', async () => {
		render(Header, { items });
		await expect.element(page.getByRole('banner')).toBeInTheDocument();
	});
});
