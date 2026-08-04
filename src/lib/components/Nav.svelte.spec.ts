import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Nav from './Nav.svelte';
import type { NavItem } from '$lib/types';

// ---------------------------------------------------------------------------
// Snippet helpers
// ---------------------------------------------------------------------------

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

	it('reflects data-orientation', async () => {
		const { container } = render(Nav, { items: [], orientation: 'vertical' });
		expect((container.querySelector('nav') as HTMLElement).getAttribute('data-orientation')).toBe(
			'vertical'
		);
	});
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
// R4 — icon override snippets
// ---------------------------------------------------------------------------

describe('R4 — menuIcon and chevronIcon overrides', () => {
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

	it('item.class lands on the rendered link, in both orientations', () => {
		const items = [{ label: 'Home', href: '/', class: 'site-link' }];
		const { container } = render(Nav, { items });
		expect(container.querySelector('a.hz-link.site-link')).not.toBeNull();
		const { container: c2 } = render(Nav, { items, orientation: 'vertical' as const });
		expect(c2.querySelector('a.hz-link.site-link')).not.toBeNull();
	});

	it('item.class lands on the label trigger for an href-less dropdown item', () => {
		const { container } = render(Nav, {
			items: [{ label: 'More', class: 'site-link', children: [{ label: 'A', href: '/a' }] }]
		});
		const btn = container.querySelector('.hz-nav-trigger') as HTMLButtonElement;
		expect(btn.classList.contains('site-link')).toBe(true);
	});

	it('itemClass lands on every link and combines with item.class', () => {
		const { container } = render(Nav, {
			itemClass: 'site-link',
			items: [
				{ label: 'Home', href: '/' },
				{ label: 'Docs', href: '/docs', class: 'docs-link' }
			]
		});
		const links = container.querySelectorAll('a.hz-link');
		expect(links.length).toBe(2);
		expect(links[0].classList.contains('site-link')).toBe(true);
		expect(links[1].classList.contains('site-link')).toBe(true);
		expect(links[1].classList.contains('docs-link')).toBe(true);
	});

	it('child.class lands on dropdown menu links', () => {
		const { container } = render(Nav, {
			items: [{ label: 'More', children: [{ label: 'A', href: '/a', class: 'menu-link' }] }]
		});
		expect(container.querySelector('.hz-nav-panel a.menu-link')).not.toBeNull();
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
});

// ---------------------------------------------------------------------------
// Collapse opt-out, defaultOpen, bar distribution
// ---------------------------------------------------------------------------

describe('mobileBreakpoint="none" and defaultOpen', () => {
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
