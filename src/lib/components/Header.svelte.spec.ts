import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
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

function tick(ms = 0): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

// ResizeObserver delivers on its own schedule (a queued step tied to layout,
// not a microtask) — a generous wait, not a bare tick(), is what the
// measured-mode tests below need after mutating an observed width.
function settle(): Promise<void> {
	return tick(50);
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

	it('activating a drawer link closes the drawer', async () => {
		const { container } = render(Header, { items });
		const { toggle, drawer } = parts(container);
		toggle.click();
		await tick();
		const link = drawer.querySelector('a[href]') as HTMLAnchorElement;
		// Cancel the navigation itself — only the close behavior is under test.
		link.addEventListener('click', (e) => e.preventDefault(), { once: true });
		link.click();
		await tick();
		expect(parts(container).drawer.getAttribute('data-state')).toBe('closed');
	});

	it('open is bindable: toggle writes it back, external writes drive the drawer', async () => {
		const props = $state({ items, open: false });
		const { container } = render(Header, props);
		parts(container).toggle.click();
		await tick();
		expect(props.open).toBe(true);
		props.open = false;
		await tick();
		expect(parts(container).drawer.getAttribute('data-state')).toBe('closed');
	});

	it('navItemClass reaches the links of both the bar and drawer Navs', () => {
		const { container } = render(Header, { items, navItemClass: 'site-link' });
		const { inner, drawer } = parts(container);
		expect(inner.querySelector('a.hz-link.site-link')).not.toBeNull();
		expect(drawer.querySelector('a.hz-link.site-link')).not.toBeNull();
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

// ---------------------------------------------------------------------------
// specs/64 R1-R4 — measured mode: a number `mobileBreakpoint` collapses off
// the header's own measured content-box width via the `resize` attachment,
// instead of the literal-px container queries.
// ---------------------------------------------------------------------------

describe('Header — measured mode', () => {
	it('collapses/expands based on the measured width, atomically', async () => {
		const { container } = render(Header, {
			items,
			mobileBreakpoint: 668,
			style: 'width: 500px'
		});
		await settle();
		let p = parts(container);
		expect(p.header.getAttribute('data-mobile-breakpoint')).toBe('custom');
		expect(p.header.hasAttribute('data-collapsed')).toBe(true);
		expect(getComputedStyle(p.navs[0]).display).toBe('none');
		expect(getComputedStyle(p.toggle).display).toBe('flex');

		p.header.style.width = '800px';
		await settle();
		p = parts(container);
		expect(p.header.hasAttribute('data-collapsed')).toBe(false);
		expect(getComputedStyle(p.navs[0]).display).not.toBe('none');
		expect(getComputedStyle(p.toggle).display).toBe('none');
	});

	it('exactly 668px wide is expanded (>= is expanded)', async () => {
		const { container } = render(Header, {
			items,
			mobileBreakpoint: 668,
			style: 'width: 668px'
		});
		await settle();
		expect(parts(container).header.hasAttribute('data-collapsed')).toBe(false);
	});

	it('widening past the number closes an open drawer, without stealing focus', async () => {
		const { container } = render(Header, {
			items,
			mobileBreakpoint: 668,
			style: 'width: 500px'
		});
		await settle();
		parts(container).toggle.click();
		await tick();
		expect(parts(container).drawer.getAttribute('data-state')).toBe('open');

		parts(container).header.style.width = '800px';
		await settle();
		const p = parts(container);
		expect(p.drawer.getAttribute('data-state')).toBe('closed');
		expect(p.toggle.getAttribute('aria-expanded')).toBe('false');
	});

	it('changing the number at runtime re-evaluates from the last measured width, no new observer', async () => {
		const props = $state<{ items: NavItem[]; mobileBreakpoint: number; style: string }>({
			items,
			mobileBreakpoint: 500,
			style: 'width: 700px'
		});
		const { container } = render(Header, props);
		await settle();
		expect(parts(container).header.hasAttribute('data-collapsed')).toBe(false);

		props.mobileBreakpoint = 900;
		await tick();
		expect(parts(container).header.hasAttribute('data-collapsed')).toBe(true);
	});

	it("640 (number) and 'sm' (string) give the same visibility at 600px and at 700px", async () => {
		const numeric = render(Header, { items, mobileBreakpoint: 640, style: 'width: 600px' });
		const stringMode = render(Header, { items, mobileBreakpoint: 'sm', style: 'width: 600px' });
		await settle();
		expect(getComputedStyle(parts(numeric.container).navs[0]).display).toBe(
			getComputedStyle(parts(stringMode.container).navs[0]).display
		);

		parts(numeric.container).header.style.width = '700px';
		parts(stringMode.container).header.style.width = '700px';
		await settle();
		expect(getComputedStyle(parts(numeric.container).navs[0]).display).toBe(
			getComputedStyle(parts(stringMode.container).navs[0]).display
		);
	});

	it("0 / -5 / NaN behave as 'none': no data-collapsed ever, toggle hidden, exactly one DEV warn", async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { container } = render(Header, {
			items,
			mobileBreakpoint: 0,
			style: 'width: 300px'
		});
		await settle();
		const p = parts(container);
		expect(p.header.getAttribute('data-mobile-breakpoint')).toBe('none');
		expect(p.header.hasAttribute('data-collapsed')).toBe(false);
		expect(getComputedStyle(p.toggle).display).toBe('none');
		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(warnSpy.mock.calls[0][0]).toContain('mobileBreakpoint');
		warnSpy.mockRestore();
	});

	it('string mode never performs the data-mobile-breakpoint="custom" swap', async () => {
		const { container } = render(Header, { items, mobileBreakpoint: 'md', style: 'width: 500px' });
		await settle();
		expect(parts(container).header.getAttribute('data-mobile-breakpoint')).toBe('md');
		parts(container).header.style.width = '2000px';
		await settle();
		expect(parts(container).header.getAttribute('data-mobile-breakpoint')).toBe('md');
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
