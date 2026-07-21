import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Nav from './Nav.svelte';
import type { NavItem } from '$lib/types';

// ---------------------------------------------------------------------------
// Snippet helpers
// ---------------------------------------------------------------------------

const logoSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="logo">Logo</span>`
}));

const actionsSnippet = createRawSnippet(() => ({
	render: () => `<button data-testid="actions-btn">Sign in</button>`
}));

const menuIconSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="custom-menu-icon">MENU</span>`
}));

const chevronIconSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="custom-chevron-icon">V</span>`
}));

// ---------------------------------------------------------------------------
// Sample items
// ---------------------------------------------------------------------------

const linkItem: NavItem = { label: 'Home', href: '/' };

const triggerItem: NavItem = {
	label: 'Products',
	children: [
		{ label: 'Widgets', href: '/widgets' },
		{ label: 'Gadgets', href: '/gadgets' }
	]
};

const linkAndDropdownItem: NavItem = {
	label: 'About',
	href: '/about',
	children: [
		{ label: 'Team', href: '/about/team' },
		{ label: 'Careers', href: '/about/careers' }
	]
};

const externalItem: NavItem = { label: 'Docs', href: 'https://docs.example.com', external: true };
const currentItem: NavItem = { label: 'Blog', href: '/blog', ariaCurrent: 'page' };
const noHrefNoChildrenItem: NavItem = { label: 'Divider' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Dispatch a real KeyboardEvent on an element (bubbles to document). */
function fireKey(
	el: EventTarget,
	key: string,
	extra: EventInit & { shiftKey?: boolean } = {}
): void {
	el.dispatchEvent(
		new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra })
	);
}

/** Wait one microtask turn so Svelte can flush pending state updates. */
function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

// ---------------------------------------------------------------------------
// R1 — Root landmark
// ---------------------------------------------------------------------------

describe('R1 — root landmark', () => {
	it('renders <nav class="hz-nav" aria-label="Main navigation"> by default', async () => {
		const { container } = render(Nav, { items: [] });
		const nav = container.querySelector('nav.hz-nav') as HTMLElement;
		expect(nav).not.toBeNull();
		await expect
			.element(page.getByRole('navigation'))
			.toHaveAttribute('aria-label', 'Main navigation');
	});

	it('custom ariaLabel is reflected on the nav element', async () => {
		render(Nav, { items: [], ariaLabel: 'Site nav' });
		await expect.element(page.getByRole('navigation')).toHaveAttribute('aria-label', 'Site nav');
	});

	it('data-variant defaults to "default"', async () => {
		render(Nav, { items: [] });
		await expect.element(page.getByRole('navigation')).toHaveAttribute('data-variant', 'default');
	});

	it('data-sticky is absent when sticky=false (default)', async () => {
		render(Nav, { items: [] });
		await expect.element(page.getByRole('navigation')).not.toHaveAttribute('data-sticky');
	});

	it('data-sticky is present when sticky=true', async () => {
		const { container } = render(Nav, { items: [], sticky: true });
		const nav = container.querySelector('nav') as HTMLElement;
		expect(nav.hasAttribute('data-sticky')).toBe(true);
	});

	it('data-mobile-breakpoint defaults to "md"', async () => {
		render(Nav, { items: [] });
		await expect
			.element(page.getByRole('navigation'))
			.toHaveAttribute('data-mobile-breakpoint', 'md');
	});

	it.each(['default', 'transparent'] as const)(
		'variant="%s" is reflected in data-variant',
		async (variant) => {
			render(Nav, { items: [], variant });
			await expect.element(page.getByRole('navigation')).toHaveAttribute('data-variant', variant);
		}
	);

	it('data-bordered is absent by default and present with bordered — composes with variant', () => {
		const { container } = render(Nav, { items: [] });
		expect((container.querySelector('nav') as HTMLElement).hasAttribute('data-bordered')).toBe(
			false
		);
		const { container: c2 } = render(Nav, { items: [], bordered: true, variant: 'transparent' });
		const nav = c2.querySelector('nav') as HTMLElement;
		expect(nav.hasAttribute('data-bordered')).toBe(true);
		expect(nav.getAttribute('data-variant')).toBe('transparent');
	});

	it.each(['sm', 'md', 'lg'] as const)(
		'mobileBreakpoint="%s" is reflected in data-mobile-breakpoint',
		async (bp) => {
			render(Nav, { items: [], mobileBreakpoint: bp });
			await expect
				.element(page.getByRole('navigation'))
				.toHaveAttribute('data-mobile-breakpoint', bp);
		}
	);
});

// ---------------------------------------------------------------------------
// R2 — items required / empty
// ---------------------------------------------------------------------------

describe('R2 — items=[] renders without errors', () => {
	it('renders the nav element with no link <li>s', async () => {
		const { container } = render(Nav, { items: [] });
		const nav = container.querySelector('nav') as HTMLElement;
		expect(nav).not.toBeNull();
		const links = container.querySelectorAll('.hz-nav-links a');
		expect(links.length).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// R3 — logo / actions snippets
// ---------------------------------------------------------------------------

describe('R3 — logo and actions snippets', () => {
	it('logo snippet renders when provided', () => {
		const { container } = render(Nav, { items: [], logo: logoSnippet });
		expect(container.querySelector('[data-testid="logo"]')).not.toBeNull();
	});

	it('logo snippet is absent when not provided', () => {
		const { container } = render(Nav, { items: [] });
		expect(container.querySelector('[data-testid="logo"]')).toBeNull();
	});

	it('actions snippet renders in the desktop bar when provided', () => {
		const { container } = render(Nav, { items: [], actions: actionsSnippet });
		const actionsEls = container.querySelectorAll('[data-testid="actions-btn"]');
		// actions appears at least once (desktop bar) — may appear twice (+ mobile menu)
		expect(actionsEls.length).toBeGreaterThanOrEqual(1);
	});

	it('actions snippet renders inside mobile menu when provided', () => {
		const { container } = render(Nav, { items: [], actions: actionsSnippet });
		const mobileMenu = container.querySelector('.hz-nav-mobile') as HTMLElement;
		expect(mobileMenu.querySelector('[data-testid="actions-btn"]')).not.toBeNull();
	});

	it('no empty logo wrapper when logo is absent', () => {
		const { container } = render(Nav, { items: [] });
		expect(container.querySelector('.hz-nav-logo')).toBeNull();
	});

	it('no empty actions wrapper when actions is absent', () => {
		const { container } = render(Nav, { items: [] });
		expect(container.querySelector('.hz-nav-actions')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R4 — icon override snippets
// ---------------------------------------------------------------------------

describe('R4 — menuIcon and chevronIcon overrides', () => {
	it('default render uses a shipped SVG for the menu toggle icon', () => {
		const { container } = render(Nav, { items: [] });
		const toggle = container.querySelector('.hz-nav-toggle') as HTMLElement;
		expect(toggle.querySelector('svg')).not.toBeNull();
	});

	it('menuIcon snippet replaces the default hamburger icon', () => {
		const { container } = render(Nav, { items: [], menuIcon: menuIconSnippet });
		const toggle = container.querySelector('.hz-nav-toggle') as HTMLElement;
		expect(toggle.querySelector('[data-testid="custom-menu-icon"]')).not.toBeNull();
		expect(toggle.querySelector('svg')).toBeNull();
	});

	it('default render uses shipped SVG chevron inside trigger button', () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const trigger = container.querySelector('.hz-nav-trigger') as HTMLElement;
		expect(trigger.querySelector('svg')).not.toBeNull();
	});

	it('chevronIcon snippet replaces the default chevron everywhere', () => {
		const { container } = render(Nav, { items: [triggerItem], chevronIcon: chevronIconSnippet });
		const chevrons = container.querySelectorAll('[data-testid="custom-chevron-icon"]');
		expect(chevrons.length).toBeGreaterThan(0);
		const trigger = container.querySelector('.hz-nav-trigger') as HTMLElement;
		expect(trigger.querySelector('svg')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R5 — link-only item
// ---------------------------------------------------------------------------

describe('R5 — link-only item (href, no children)', () => {
	it('renders a navigable link inside <li> with no dropdown trigger', () => {
		const { container } = render(Nav, { items: [linkItem] });
		const li = container.querySelector('.hz-nav-links li') as HTMLElement;
		expect(li).not.toBeNull();
		expect(li.querySelector('a')).not.toBeNull();
		expect(li.querySelector('button')).toBeNull();
	});

	it('does not set data-has-children on the link-only <li>', () => {
		const { container } = render(Nav, { items: [linkItem] });
		const li = container.querySelector('.hz-nav-links li') as HTMLElement;
		expect(li.hasAttribute('data-has-children')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// R6 — trigger-only item (children, no href)
// ---------------------------------------------------------------------------

describe('R6 — trigger-only item (children, no href)', () => {
	it('renders <li class="hz-nav-dropdown" data-has-children>', () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const li = container.querySelector('li.hz-nav-dropdown') as HTMLElement;
		expect(li).not.toBeNull();
		expect(li.hasAttribute('data-has-children')).toBe(true);
	});

	it('trigger button has aria-haspopup="true", aria-expanded, aria-controls', () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const btn = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		expect(btn).not.toBeNull();
		expect(btn.getAttribute('aria-haspopup')).toBe('true');
		expect(btn.hasAttribute('aria-expanded')).toBe(true);
		expect(btn.hasAttribute('aria-controls')).toBe(true);
	});

	it('trigger button contains the item label', () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const btn = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		expect(btn.textContent).toContain('Products');
	});

	it('no navigable <a> for the parent label — only links are inside the panel', () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const li = container.querySelector('li.hz-nav-dropdown') as HTMLElement;
		const panelLinks = li.querySelectorAll('[role="menu"] a');
		const allLinks = li.querySelectorAll('a');
		expect(allLinks.length).toBe(panelLinks.length);
	});
});

// ---------------------------------------------------------------------------
// R7 — link + dropdown (href AND children)
// ---------------------------------------------------------------------------

describe('R7 — link + dropdown (href and children)', () => {
	it('renders <li class="hz-nav-dropdown" data-has-children>', () => {
		const { container } = render(Nav, { items: [linkAndDropdownItem] });
		const li = container.querySelector('li.hz-nav-dropdown') as HTMLElement;
		expect(li).not.toBeNull();
		expect(li.hasAttribute('data-has-children')).toBe(true);
	});

	it('renders a navigable link for the label', () => {
		const { container } = render(Nav, { items: [linkAndDropdownItem] });
		const li = container.querySelector('li.hz-nav-dropdown') as HTMLElement;
		const topLink = li.querySelector(':scope > a') as HTMLAnchorElement;
		expect(topLink).not.toBeNull();
		expect(topLink.getAttribute('href')).toBe('/about');
	});

	it('renders a separate chevron button with correct ARIA', () => {
		const { container } = render(Nav, { items: [linkAndDropdownItem] });
		const li = container.querySelector('li.hz-nav-dropdown') as HTMLElement;
		const chevronBtn = li.querySelector('.hz-nav-chevron') as HTMLButtonElement;
		expect(chevronBtn).not.toBeNull();
		expect(chevronBtn.getAttribute('aria-haspopup')).toBe('true');
		expect(chevronBtn.getAttribute('aria-label')).toBe('About submenu');
	});
});

// ---------------------------------------------------------------------------
// R8 — links reuse Link component with variant="nav"
// ---------------------------------------------------------------------------

describe('R8 — links reuse Link with variant="nav"', () => {
	it('top-level link has data-variant="nav"', () => {
		const { container } = render(Nav, { items: [linkItem] });
		const a = container.querySelector('.hz-nav-links a') as HTMLAnchorElement;
		expect(a.getAttribute('data-variant')).toBe('nav');
	});

	it('dropdown menu links have role="menuitem" and data-variant="nav"', () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const menuItems = container.querySelectorAll('[role="menuitem"]');
		expect(menuItems.length).toBeGreaterThan(0);
		menuItems.forEach((mi) => {
			expect(mi.getAttribute('data-variant')).toBe('nav');
		});
	});

	it('external item gets target="_blank" and rel via Link', () => {
		const { container } = render(Nav, { items: [externalItem] });
		const a = container.querySelector('.hz-nav-links a') as HTMLAnchorElement;
		expect(a.getAttribute('target')).toBe('_blank');
		expect(a.getAttribute('rel')).toBe('noopener noreferrer');
	});

	it('ariaCurrent item gets aria-current on the link via Link', () => {
		const { container } = render(Nav, { items: [currentItem] });
		const a = container.querySelector('.hz-nav-links a') as HTMLAnchorElement;
		expect(a.getAttribute('aria-current')).toBe('page');
	});
});

// ---------------------------------------------------------------------------
// R9 — dropdown panel structure
// ---------------------------------------------------------------------------

describe('R9 — dropdown panel', () => {
	it('panel has role="menu" and data-state="closed" initially', () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const panel = container.querySelector('[role="menu"]') as HTMLElement;
		expect(panel).not.toBeNull();
		expect(panel.getAttribute('data-state')).toBe('closed');
	});

	it('panel id matches aria-controls on the trigger button', () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const btn = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		const panelId = btn.getAttribute('aria-controls') as string;
		const panel = document.getElementById(panelId);
		expect(panel).not.toBeNull();
	});

	it('dropdown children render as <li role="none"><a role="menuitem">', () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const panel = container.querySelector('[role="menu"]') as HTMLElement;
		const noneItems = panel.querySelectorAll('li[role="none"]');
		expect(noneItems.length).toBe(2);
		noneItems.forEach((li) => {
			expect(li.querySelector('[role="menuitem"]')).not.toBeNull();
		});
	});
});

// ---------------------------------------------------------------------------
// R10 — single open / toggle on click
// Use direct DOM .click() so the hidden (mobile-viewport-hidden) trigger is exercised.
// ---------------------------------------------------------------------------

describe('R10 — single open / toggle on click', () => {
	it('clicking a trigger opens the dropdown (data-state="open", aria-expanded="true")', async () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const btn = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		btn.click();
		await tick();
		expect(btn.getAttribute('aria-expanded')).toBe('true');
		const panel = container.querySelector('[role="menu"]') as HTMLElement;
		expect(panel.getAttribute('data-state')).toBe('open');
	});

	it('clicking an open trigger closes the dropdown', async () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const btn = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		btn.click();
		await tick();
		btn.click();
		await tick();
		expect(btn.getAttribute('aria-expanded')).toBe('false');
		const panel = container.querySelector('[role="menu"]') as HTMLElement;
		expect(panel.getAttribute('data-state')).toBe('closed');
	});

	it('opening a second dropdown closes the first', async () => {
		const items: NavItem[] = [triggerItem, linkAndDropdownItem];
		const { container } = render(Nav, { items });
		// Open first (Products trigger)
		const firstBtn = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		firstBtn.click();
		await tick();
		// Open second (About chevron)
		const secondBtn = container.querySelector('.hz-nav-chevron') as HTMLButtonElement;
		secondBtn.click();
		await tick();
		const panels = container.querySelectorAll('[role="menu"]');
		expect(panels[0].getAttribute('data-state')).toBe('closed');
		expect(panels[1].getAttribute('data-state')).toBe('open');
	});
});

// ---------------------------------------------------------------------------
// R11 — dismiss: outside-click and Escape
// ---------------------------------------------------------------------------

describe('R11 — dismiss', () => {
	it('Escape closes the open dropdown (document keydown)', async () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const btn = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		btn.click();
		await tick();
		expect(btn.getAttribute('aria-expanded')).toBe('true');
		fireKey(document, 'Escape');
		await tick();
		expect(btn.getAttribute('aria-expanded')).toBe('false');
		const panel = container.querySelector('[role="menu"]') as HTMLElement;
		expect(panel.getAttribute('data-state')).toBe('closed');
	});

	it('outside-click closes the dropdown', async () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const btn = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		btn.click();
		await tick();
		// Click something outside the nav
		document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await tick();
		const panel = container.querySelector('[role="menu"]') as HTMLElement;
		expect(panel.getAttribute('data-state')).toBe('closed');
	});

	it('Escape with nothing open is a no-op', async () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const panel = container.querySelector('[role="menu"]') as HTMLElement;
		fireKey(document, 'Escape');
		await tick();
		expect(panel.getAttribute('data-state')).toBe('closed');
	});
});

// ---------------------------------------------------------------------------
// R12 — Mobile toggle button
// ---------------------------------------------------------------------------

describe('R12 — mobile toggle button', () => {
	it('toggle button has correct aria attributes', () => {
		const { container } = render(Nav, { items: [] });
		const toggle = container.querySelector('.hz-nav-toggle') as HTMLButtonElement;
		expect(toggle).not.toBeNull();
		expect(toggle.getAttribute('aria-label')).toBe('Toggle navigation menu');
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(toggle.hasAttribute('aria-controls')).toBe(true);
	});

	it('aria-expanded becomes "true" after clicking the toggle', async () => {
		const { container } = render(Nav, { items: [] });
		const toggle = container.querySelector('.hz-nav-toggle') as HTMLButtonElement;
		toggle.click();
		await tick();
		expect(toggle.getAttribute('aria-expanded')).toBe('true');
	});
});

// ---------------------------------------------------------------------------
// R13 — Mobile menu container
// ---------------------------------------------------------------------------

describe('R13 — mobile menu container', () => {
	it('mobile menu id matches toggle aria-controls; data-state starts "closed"', () => {
		const { container } = render(Nav, { items: [] });
		const toggle = container.querySelector('.hz-nav-toggle') as HTMLButtonElement;
		const menuId = toggle.getAttribute('aria-controls') as string;
		const menu = document.getElementById(menuId) as HTMLElement;
		expect(menu).not.toBeNull();
		expect(menu.classList.contains('hz-nav-mobile')).toBe(true);
		expect(menu.getAttribute('data-state')).toBe('closed');
	});

	it('data-state becomes "open" after clicking the toggle', async () => {
		const { container } = render(Nav, { items: [] });
		const toggle = container.querySelector('.hz-nav-toggle') as HTMLButtonElement;
		const menuId = toggle.getAttribute('aria-controls') as string;
		toggle.click();
		await tick();
		const menu = document.getElementById(menuId) as HTMLElement;
		expect(menu.getAttribute('data-state')).toBe('open');
	});
});

// ---------------------------------------------------------------------------
// R14 — Mobile dropdown items use <details>/<summary>
// ---------------------------------------------------------------------------

describe('R14 — mobile dropdown items use details/summary', () => {
	it('items with children render as <details class="hz-nav-mobile-section">', () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const details = container.querySelector('.hz-nav-mobile .hz-nav-mobile-section') as HTMLElement;
		expect(details).not.toBeNull();
		expect(details.tagName).toBe('DETAILS');
	});

	it('<summary> contains the item label', () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const summary = container.querySelector('.hz-nav-mobile-section summary') as HTMLElement;
		expect(summary.textContent).toContain('Products');
	});

	it('details has no role="menu" (native disclosure, not ARIA menu)', () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const details = container.querySelector('.hz-nav-mobile .hz-nav-mobile-section') as HTMLElement;
		expect(details.getAttribute('role')).toBeNull();
	});

	it('flat link items render as plain list links in the mobile menu', () => {
		const { container } = render(Nav, { items: [linkItem] });
		const mobileMenu = container.querySelector('.hz-nav-mobile') as HTMLElement;
		const a = mobileMenu.querySelector('a') as HTMLAnchorElement;
		expect(a).not.toBeNull();
		expect(mobileMenu.querySelector('details')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R15 — Mobile focus trap (Escape → closes and returns focus to toggle)
// ---------------------------------------------------------------------------

describe('R15 — mobile focus trap', () => {
	it('Escape closes the mobile menu and returns focus to the toggle button', async () => {
		const { container } = render(Nav, { items: [linkItem] });
		const toggle = container.querySelector('.hz-nav-toggle') as HTMLButtonElement;
		// Open the menu
		toggle.click();
		await tick();
		expect(toggle.getAttribute('aria-expanded')).toBe('true');
		// Dispatch Escape on the mobile menu element
		const mobileMenu = container.querySelector('.hz-nav-mobile') as HTMLElement;
		fireKey(mobileMenu, 'Escape');
		await tick();
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(document.activeElement).toBe(toggle);
	});
});

// ---------------------------------------------------------------------------
// R16 — Keyboard map: desktop dropdown triggers and menus
// Run at desktop viewport so .hz-nav-links is visible and elements are focusable.
// Use Playwright locator.press() so the browser driver properly tracks focus.
// ---------------------------------------------------------------------------

describe('R16 — keyboard map for desktop dropdowns', () => {
	beforeEach(async () => {
		await page.viewport(1200, 800);
	});

	afterEach(async () => {
		await page.viewport(1024, 768);
	});

	/*
	 * Focus is established by CLICKING the trigger, not element.focus():
	 * userEvent.keyboard sends real CDP keys to whichever test-file iframe
	 * holds browser-level focus, and .focus() alone doesn't claim it (same
	 * flake family as Accordion/Toggle/Tabs). Clicking toggles the dropdown,
	 * so the assertions cover the keyboard half of each toggle.
	 */
	it('Enter on the focused trigger toggles the dropdown', async () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const btn = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		await userEvent.click(btn); // opens + focuses for real
		await tick();
		expect(btn.getAttribute('aria-expanded')).toBe('true');
		expect(document.activeElement).toBe(btn);
		await userEvent.keyboard('{Enter}');
		await tick();
		expect(btn.getAttribute('aria-expanded')).toBe('false');
	});

	it('Space on the focused trigger toggles the dropdown', async () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const btn = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		await userEvent.click(btn);
		await tick();
		expect(btn.getAttribute('aria-expanded')).toBe('true');
		await userEvent.keyboard(' ');
		await tick();
		expect(btn.getAttribute('aria-expanded')).toBe('false');
	});

	it('ArrowDown on trigger opens the dropdown and focuses first menuitem', async () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const btn = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		// Claim focus via click, then Escape back to the closed+focused state.
		await userEvent.click(btn);
		await tick();
		await userEvent.keyboard('{Escape}');
		await tick();
		expect(btn.getAttribute('aria-expanded')).toBe('false');
		await userEvent.keyboard('{ArrowDown}');
		// Wait for the component's internal setTimeout to fire.
		await new Promise((r) => setTimeout(r, 50));
		const firstItem = container.querySelector('[role="menuitem"]') as HTMLElement;
		expect(document.activeElement).toBe(firstItem);
	});

	it('Escape within the open menu closes it and returns focus to trigger', async () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const btn = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		// Open with a real click
		await userEvent.click(btn);
		await tick();
		expect(btn.getAttribute('aria-expanded')).toBe('true');
		// Escape on the open panel → menu keydown handler
		const panel = container.querySelector('[role="menu"]') as HTMLElement;
		fireKey(panel, 'Escape');
		await tick();
		expect(btn.getAttribute('aria-expanded')).toBe('false');
		expect(document.activeElement).toBe(btn);
	});

	it('ArrowDown/ArrowUp move roving focus among menuitems', async () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const btn = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		await userEvent.click(btn); // opens + claims focus
		await tick();
		await userEvent.keyboard('{ArrowDown}'); // focuses the first menuitem
		await new Promise((r) => setTimeout(r, 50));
		const menuItems = Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]'));
		expect(document.activeElement).toBe(menuItems[0]);
		// ArrowDown → second item (fire on the panel; event bubbles to onMenuKeydown)
		const panel = container.querySelector('[role="menu"]') as HTMLElement;
		fireKey(panel, 'ArrowDown');
		expect(document.activeElement).toBe(menuItems[1]);
		// ArrowUp → back to first
		fireKey(panel, 'ArrowUp');
		expect(document.activeElement).toBe(menuItems[0]);
	});

	it('Home jumps to first menuitem, End to last', async () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const btn = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		await userEvent.click(btn); // opens + claims focus
		await tick();
		await userEvent.keyboard('{ArrowDown}'); // focuses the first menuitem
		await new Promise((r) => setTimeout(r, 50));
		const menuItems = Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]'));
		const panel = container.querySelector('[role="menu"]') as HTMLElement;
		// End → last item
		fireKey(panel, 'End');
		expect(document.activeElement).toBe(menuItems[menuItems.length - 1]);
		// Home → first item
		fireKey(panel, 'Home');
		expect(document.activeElement).toBe(menuItems[0]);
	});
});

// ---------------------------------------------------------------------------
// R17 — Responsive collapse (viewport CSS assertions)
// ---------------------------------------------------------------------------

describe('R17 — responsive collapse', () => {
	afterEach(async () => {
		// Reset to a neutral viewport after each viewport test.
		await page.viewport(1024, 768);
	});

	it('md: hz-nav-links hidden and hz-nav-toggle visible below 968px', async () => {
		const { container } = render(Nav, { items: [linkItem], mobileBreakpoint: 'md' });
		await page.viewport(967, 600);
		const links = container.querySelector('.hz-nav-links') as HTMLElement;
		const toggle = container.querySelector('.hz-nav-toggle') as HTMLElement;
		expect(getComputedStyle(links).display).toBe('none');
		expect(getComputedStyle(toggle).display).not.toBe('none');
	});

	it('md: hz-nav-links visible and hz-nav-toggle hidden at 968px', async () => {
		const { container } = render(Nav, { items: [linkItem], mobileBreakpoint: 'md' });
		await page.viewport(968, 600);
		const links = container.querySelector('.hz-nav-links') as HTMLElement;
		const toggle = container.querySelector('.hz-nav-toggle') as HTMLElement;
		expect(getComputedStyle(links).display).not.toBe('none');
		expect(getComputedStyle(toggle).display).toBe('none');
	});

	it('sm: hz-nav-links hidden below 640px', async () => {
		const { container } = render(Nav, { items: [linkItem], mobileBreakpoint: 'sm' });
		await page.viewport(639, 600);
		const links = container.querySelector('.hz-nav-links') as HTMLElement;
		expect(getComputedStyle(links).display).toBe('none');
	});

	it('sm: hz-nav-links visible at 640px', async () => {
		const { container } = render(Nav, { items: [linkItem], mobileBreakpoint: 'sm' });
		await page.viewport(640, 600);
		const links = container.querySelector('.hz-nav-links') as HTMLElement;
		expect(getComputedStyle(links).display).not.toBe('none');
	});

	it('lg: hz-nav-links hidden below 1200px', async () => {
		const { container } = render(Nav, { items: [linkItem], mobileBreakpoint: 'lg' });
		await page.viewport(1199, 600);
		const links = container.querySelector('.hz-nav-links') as HTMLElement;
		expect(getComputedStyle(links).display).toBe('none');
	});

	it('lg: hz-nav-links visible at 1200px', async () => {
		const { container } = render(Nav, { items: [linkItem], mobileBreakpoint: 'lg' });
		await page.viewport(1200, 600);
		const links = container.querySelector('.hz-nav-links') as HTMLElement;
		expect(getComputedStyle(links).display).not.toBe('none');
	});

	it('md: hz-nav-mobile is hidden at desktop viewport', async () => {
		const { container } = render(Nav, { items: [], mobileBreakpoint: 'md' });
		await page.viewport(1024, 768);
		const mobile = container.querySelector('.hz-nav-mobile') as HTMLElement;
		expect(getComputedStyle(mobile).display).toBe('none');
	});
});

// ---------------------------------------------------------------------------
// R18 — open/closed visibility (structural CSS)
// ---------------------------------------------------------------------------

describe('R18 — open/closed visibility', () => {
	it('closed dropdown panel computes display: none', () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const panel = container.querySelector('[role="menu"]') as HTMLElement;
		expect(getComputedStyle(panel).display).toBe('none');
	});

	it('open dropdown panel is visible', async () => {
		const { container } = render(Nav, { items: [triggerItem] });
		const btn = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		btn.click();
		await tick();
		const panel = container.querySelector('[role="menu"]') as HTMLElement;
		expect(getComputedStyle(panel).display).not.toBe('none');
	});

	it('closed mobile menu computes display: none', () => {
		const { container } = render(Nav, { items: [] });
		const menu = container.querySelector('.hz-nav-mobile') as HTMLElement;
		expect(getComputedStyle(menu).display).toBe('none');
	});

	it('open mobile menu is visible (at mobile viewport, below breakpoint)', async () => {
		// At desktop viewports the responsive CSS hides .hz-nav-mobile with !important.
		// Set a mobile-sized viewport so the mobile menu can appear.
		await page.viewport(600, 800);
		const { container } = render(Nav, { items: [], mobileBreakpoint: 'md' });
		const toggle = container.querySelector('.hz-nav-toggle') as HTMLButtonElement;
		toggle.click();
		await tick();
		const menu = container.querySelector('.hz-nav-mobile') as HTMLElement;
		expect(getComputedStyle(menu).display).not.toBe('none');
		// Reset viewport.
		await page.viewport(1024, 768);
	});
});

// ---------------------------------------------------------------------------
// R19 — class composition
// ---------------------------------------------------------------------------

describe('R19 — class composition', () => {
	it('no class prop → rendered class is exactly "hz-nav"', () => {
		const { container } = render(Nav, { items: [] });
		const nav = container.querySelector('nav') as HTMLElement;
		const classes = [...nav.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toEqual(['hz-nav']);
	});

	it('class="foo bar" → hz-nav is first, foo and bar are present', () => {
		const { container } = render(Nav, { items: [], class: 'foo bar' });
		const nav = container.querySelector('nav') as HTMLElement;
		const classes = [...nav.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-nav');
		expect(classes).toContain('foo');
		expect(classes).toContain('bar');
	});
});

// ---------------------------------------------------------------------------
// R20 — rest forwarding
// ---------------------------------------------------------------------------

describe('R20 — rest forwarding', () => {
	it('arbitrary rest attr (data-testid) is forwarded to the root nav', async () => {
		render(Nav, { items: [], 'data-testid': 'my-nav' } as Record<string, unknown>);
		await expect.element(page.getByRole('navigation')).toHaveAttribute('data-testid', 'my-nav');
	});

	it('rest cannot overwrite managed aria-label', async () => {
		render(Nav, { items: [], 'aria-label': 'rest-label' } as Record<string, unknown>);
		await expect
			.element(page.getByRole('navigation'))
			.toHaveAttribute('aria-label', 'Main navigation');
	});

	it('rest cannot overwrite managed data-variant', async () => {
		render(Nav, { items: [], 'data-variant': 'override' } as Record<string, unknown>);
		await expect.element(page.getByRole('navigation')).toHaveAttribute('data-variant', 'default');
	});

	it('hz-nav class is always present even when class prop is set', () => {
		const { container } = render(Nav, { items: [], class: 'custom' });
		const nav = container.querySelector('nav') as HTMLElement;
		expect(nav.classList.contains('hz-nav')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// R21 — Barrel export
// ---------------------------------------------------------------------------

describe('R21 — barrel export', () => {
	it('Nav is resolvable from $lib', async () => {
		const { Nav } = await import('$lib');
		expect(Nav).toBeDefined();
	});

	it('Nav smoke-renders from $lib import', async () => {
		const { Nav } = await import('$lib');
		const { container } = render(Nav, { items: [] });
		expect(container.querySelector('nav.hz-nav')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
	it('item with neither href nor children renders plain text in a <li>', () => {
		const { container } = render(Nav, { items: [noHrefNoChildrenItem] });
		const li = container.querySelector('.hz-nav-links li') as HTMLElement;
		expect(li).not.toBeNull();
		expect(li.textContent?.trim()).toBe('Divider');
		expect(li.querySelector('a')).toBeNull();
		expect(li.querySelector('button')).toBeNull();
	});

	it('third-level children are flattened — only first-level dropdown items render', () => {
		const deepItem: NavItem = {
			label: 'Parent',
			children: [
				{
					label: 'Child',
					href: '/child',
					children: [{ label: 'Grandchild', href: '/grandchild' }]
				}
			]
		};
		const { container } = render(Nav, { items: [deepItem] });
		const panel = container.querySelector('[role="menu"]') as HTMLElement;
		const menuItems = panel.querySelectorAll('[role="menuitem"]');
		expect(menuItems.length).toBe(1);
		expect(menuItems[0].textContent?.trim()).toBe('Child');
	});

	it('Escape with no open dropdown is a no-op (no error, nav still present)', async () => {
		const { container } = render(Nav, { items: [] });
		fireKey(document, 'Escape');
		await tick();
		const nav = container.querySelector('nav') as HTMLElement;
		expect(nav).not.toBeNull();
	});

	it('two triggers: opening second closes first', async () => {
		const items = [triggerItem, linkAndDropdownItem];
		const { container } = render(Nav, { items });
		const trigger = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		const chevron = container.querySelector('.hz-nav-chevron') as HTMLButtonElement;
		trigger.click();
		await tick();
		chevron.click();
		await tick();
		const panels = container.querySelectorAll('[role="menu"]');
		expect(panels[0].getAttribute('data-state')).toBe('closed');
		expect(panels[1].getAttribute('data-state')).toBe('open');
	});
});

// ---------------------------------------------------------------------------
// Orientation — vertical (sidebar) mode
// ---------------------------------------------------------------------------

describe('orientation', () => {
	const sections: NavItem[] = [
		{ label: 'Foundation', children: [{ label: 'Colors', href: '/colors' }] },
		{ label: 'Components', children: [{ label: 'Button', href: '/button' }] }
	];

	it('defaults to data-orientation="horizontal"', () => {
		const { container } = render(Nav, { items: [linkItem] });
		const nav = container.querySelector('.hz-nav') as HTMLElement;
		expect(nav.getAttribute('data-orientation')).toBe('horizontal');
	});

	it('vertical panels are plain disclosure lists — no menu semantics', () => {
		const { container } = render(Nav, { items: sections, orientation: 'vertical' });
		expect(container.querySelector('[role="menu"]')).toBeNull();
		expect(container.querySelector('[role="menuitem"]')).toBeNull();
		const trigger = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		expect(trigger.hasAttribute('aria-haspopup')).toBe(false);
	});

	it('vertical sections are multi-open (opening one keeps the other open)', async () => {
		const { container } = render(Nav, { items: sections, orientation: 'vertical' });
		const triggers = Array.from(container.querySelectorAll<HTMLButtonElement>('.hz-nav-trigger'));
		triggers[0].click();
		await tick();
		triggers[1].click();
		await tick();
		expect(triggers[0].getAttribute('aria-expanded')).toBe('true');
		expect(triggers[1].getAttribute('aria-expanded')).toBe('true');
	});

	it('horizontal dropdowns stay single-open (opening one closes the other)', async () => {
		const { container } = render(Nav, {
			items: [
				{ label: 'A', children: [{ label: 'A1', href: '/a1' }] },
				{ label: 'B', children: [{ label: 'B1', href: '/b1' }] }
			]
		});
		const triggers = Array.from(container.querySelectorAll<HTMLButtonElement>('.hz-nav-trigger'));
		triggers[0].click();
		await tick();
		triggers[1].click();
		await tick();
		expect(triggers[0].getAttribute('aria-expanded')).toBe('false');
		expect(triggers[1].getAttribute('aria-expanded')).toBe('true');
	});

	it('vertical open panel renders inline (position: static)', async () => {
		const { container } = render(Nav, { items: sections, orientation: 'vertical' });
		const trigger = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		trigger.click();
		await tick();
		const panel = container.querySelector('.hz-nav-panel') as HTMLElement;
		expect(panel.getAttribute('data-state')).toBe('open');
		expect(getComputedStyle(panel).position).toBe('static');
	});

	it('horizontal collapse responds to the nav’s own width (container query)', () => {
		const { container } = render(Nav, { items: [linkItem] });
		const nav = container.querySelector('.hz-nav') as HTMLElement;
		const links = container.querySelector('.hz-nav-links') as HTMLElement;
		const toggle = container.querySelector('.hz-nav-toggle') as HTMLElement;
		nav.style.width = '500px'; // below the md default (968px)
		expect(getComputedStyle(links).display).toBe('none');
		expect(getComputedStyle(toggle).display).toBe('flex');
		nav.style.width = '1000px';
		expect(getComputedStyle(links).display).toBe('flex');
		expect(getComputedStyle(toggle).display).toBe('none');
	});

	it('vertical collapse tracks the viewport, not the nav width', async () => {
		const { container } = render(Nav, { items: sections, orientation: 'vertical' });
		const nav = container.querySelector('.hz-nav') as HTMLElement;
		const links = container.querySelector('.hz-nav-links') as HTMLElement;
		nav.style.width = '260px'; // narrow sidebar — must NOT trigger collapse
		await page.viewport(1024, 768); // ≥ md
		expect(getComputedStyle(links).display).toBe('flex');
		await page.viewport(500, 768); // < md → hamburger
		expect(getComputedStyle(links).display).toBe('none');
		await page.viewport(1024, 768);
	});
});

// ---------------------------------------------------------------------------
// Collapse opt-out, defaultOpen, bar distribution
// ---------------------------------------------------------------------------

describe('mobileBreakpoint="none" and defaultOpen', () => {
	it('the bar distributes its regions with space-between', () => {
		const { container } = render(Nav, { items: [linkItem] });
		const inner = container.querySelector('.hz-nav-inner') as HTMLElement;
		expect(getComputedStyle(inner).justifyContent).toBe('space-between');
	});

	it('mobileBreakpoint="none" never collapses: links visible, toggle and mobile menu off', () => {
		const { container } = render(Nav, { items: [linkItem], mobileBreakpoint: 'none' });
		const nav = container.querySelector('.hz-nav') as HTMLElement;
		nav.style.width = '400px'; // far below every threshold
		expect(getComputedStyle(container.querySelector('.hz-nav-links') as HTMLElement).display).toBe(
			'flex'
		);
		expect(getComputedStyle(container.querySelector('.hz-nav-toggle') as HTMLElement).display).toBe(
			'none'
		);
		expect(getComputedStyle(container.querySelector('.hz-nav-mobile') as HTMLElement).display).toBe(
			'none'
		);
	});

	it('vertical sections flagged defaultOpen start open', async () => {
		const { container } = render(Nav, {
			items: [{ ...triggerItem, defaultOpen: true }],
			orientation: 'vertical'
		});
		await tick();
		const trigger = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
	});

	it('defaultOpen is ignored on horizontal bars', async () => {
		const { container } = render(Nav, { items: [{ ...triggerItem, defaultOpen: true }] });
		await tick();
		const trigger = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
	});
});

// ---------------------------------------------------------------------------
// spec 34 — nested vertical disclosure
// ---------------------------------------------------------------------------

describe('spec 34 — nested vertical disclosure', () => {
	// Components → groups → pages: a child that itself has children.
	const nested: NavItem[] = [
		{
			label: 'Components',
			children: [
				{
					label: 'Common',
					children: [
						{ label: 'Alert', href: '/components/alert' },
						{ label: 'Button', href: '/components/button' }
					]
				},
				{
					label: 'Layout',
					children: [{ label: 'Stack', href: '/components/stack' }]
				}
			]
		}
	];

	function triggerByLabel(container: HTMLElement, label: string): HTMLButtonElement {
		return Array.from(container.querySelectorAll<HTMLButtonElement>('.hz-nav-trigger')).find((b) =>
			b.textContent?.includes(label)
		)!;
	}

	it('vertical renders a child-with-children as a nested trigger + panel', () => {
		const { container } = render(Nav, { items: nested, orientation: 'vertical' });
		// Three triggers: Components, Common, Layout.
		const triggers = Array.from(container.querySelectorAll('.hz-nav-trigger'));
		expect(triggers.map((t) => t.textContent?.trim().split('\n')[0])).toEqual([
			'Components',
			'Common',
			'Layout'
		]);
		// The nested trigger's panel controls its own pages.
		const common = triggerByLabel(container, 'Common');
		const panel = document.getElementById(common.getAttribute('aria-controls')!);
		expect(panel?.querySelectorAll('a')).toHaveLength(2);
	});

	it('a nested trigger toggles independently of its parent', async () => {
		const { container } = render(Nav, { items: nested, orientation: 'vertical' });
		const components = triggerByLabel(container, 'Components');
		const common = triggerByLabel(container, 'Common');
		components.click();
		await tick();
		common.click();
		await tick();
		expect(components.getAttribute('aria-expanded')).toBe('true');
		expect(common.getAttribute('aria-expanded')).toBe('true');
		// Collapsing the group leaves the parent open.
		common.click();
		await tick();
		expect(common.getAttribute('aria-expanded')).toBe('false');
		expect(components.getAttribute('aria-expanded')).toBe('true');
	});

	it('a nested node flagged defaultOpen starts open at its level', async () => {
		const withOpen: NavItem[] = [
			{
				label: 'Components',
				defaultOpen: true,
				children: [
					{ label: 'Common', defaultOpen: true, children: [{ label: 'Alert', href: '/a' }] }
				]
			}
		];
		const { container } = render(Nav, { items: withOpen, orientation: 'vertical' });
		await tick();
		expect(triggerByLabel(container, 'Components').getAttribute('aria-expanded')).toBe('true');
		expect(triggerByLabel(container, 'Common').getAttribute('aria-expanded')).toBe('true');
	});

	it('open state is keyed by path, so a rebuilt items array keeps it open', async () => {
		const { container, rerender } = render(Nav, { items: nested, orientation: 'vertical' });
		triggerByLabel(container, 'Layout').click();
		await tick();
		expect(triggerByLabel(container, 'Layout').getAttribute('aria-expanded')).toBe('true');
		// Rebuild items with fresh object identities but the same structure.
		await rerender({ items: structuredClone(nested), orientation: 'vertical' });
		await tick();
		expect(triggerByLabel(container, 'Layout').getAttribute('aria-expanded')).toBe('true');
	});

	it('horizontal degrades a nested child to a static label (no deeper render)', () => {
		const { container } = render(Nav, { items: nested }); // horizontal (default)
		const components = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		const panel = document.getElementById(components.getAttribute('aria-controls')!);
		// The nested group is a static label, not a nested trigger; its pages
		// aren't rendered as a nested menu.
		expect(panel?.querySelector('.hz-nav-heading')?.textContent).toContain('Common');
		expect(panel?.querySelectorAll('.hz-nav-trigger')).toHaveLength(0);
	});
});
