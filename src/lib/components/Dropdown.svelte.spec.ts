import { userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet, tick } from 'svelte';
import type { DropdownEntry, DropdownItem } from '$lib/types';
import Dropdown from './Dropdown.svelte';

const starIcon = createRawSnippet(() => ({
	render: () => `<svg data-testid="star-icon"></svg>`
}));

// ---------------------------------------------------------------------------
// Sample items — Edit/Duplicate/Archive(disabled)/separator/Delete(danger)
// ---------------------------------------------------------------------------

const items: DropdownEntry[] = [
	{ id: 'edit', label: 'Edit' },
	{ id: 'duplicate', label: 'Duplicate' },
	{ id: 'archive', label: 'Archive', disabled: true },
	{ separator: true },
	{ id: 'delete', label: 'Delete', danger: true }
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRoot(container: Element): HTMLElement {
	return container.querySelector('.hz-dropdown') as HTMLElement;
}

function getTrigger(container: Element): HTMLButtonElement {
	return container.querySelector('.hz-dropdown-trigger') as HTMLButtonElement;
}

function getMenu(container: Element): HTMLUListElement {
	return container.querySelector('.hz-dropdown-menu') as HTMLUListElement;
}

function getMenuItems(container: Element): HTMLButtonElement[] {
	return Array.from(container.querySelectorAll('button[role="menuitem"]'));
}

function getSeparators(container: Element): HTMLLIElement[] {
	return Array.from(container.querySelectorAll('li[role="separator"]'));
}

/** Fire a KeyboardEvent directly on an element (synthetic — bypasses CDP focus
 *  routing). Suitable for the component's own keydown-handler logic (Arrow /
 *  Home / End / Escape / Tab), which never relies on native key→click
 *  translation. Returns the event (for defaultPrevented checks). */
function fireKey(el: EventTarget, key: string, extra: EventInit = {}): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra });
	el.dispatchEvent(event);
	return event;
}

/** Dispatch a synthetic keydown and wait for Svelte to flush the resulting
 *  state change to the DOM. */
async function pressKey(
	el: EventTarget,
	key: string,
	extra: EventInit = {}
): Promise<KeyboardEvent> {
	const event = fireKey(el, key, extra);
	await tick();
	return event;
}

/** Fire a native click event directly (bypasses Playwright's actionability
 *  checks, which refuse aria-disabled elements — the Combobox idiom). */
function nativeClick(el: Element): void {
	el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

/** Real, trusted click on the trigger — opens the menu (focused on the first
 *  menuitem) and, crucially, claims genuine browser-level focus for this
 *  iframe so a following userEvent.keyboard() reliably targets it (the
 *  Accordion/Tabs idiom: userEvent.keyboard sends real CDP keys to whichever
 *  frame holds browser focus, which a bare .focus() call doesn't claim under
 *  parallel test-file iframes). */
async function openMenu(container: Element): Promise<HTMLButtonElement> {
	const trigger = getTrigger(container);
	await userEvent.click(trigger);
	await tick();
	return trigger;
}

// ---------------------------------------------------------------------------
// Dropdown-R1/R2/R3 — Structure & ARIA
// ---------------------------------------------------------------------------

describe('Dropdown-R1/R2/R3 — structure & ARIA', () => {
	it('root is div.hz-dropdown with data-align="start" by default', () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const root = getRoot(container);
		expect(root).not.toBeNull();
		expect(root.getAttribute('data-align')).toBe('start');
	});

	it('trigger is a .hz-button.hz-dropdown-trigger with menu-button ARIA', () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const trigger = getTrigger(container);
		expect(trigger.classList.contains('hz-button')).toBe(true);
		expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		const menu = getMenu(container);
		expect(trigger.getAttribute('aria-controls')).toBe(menu.id);
	});

	it('aria-expanded flips to "true" once opened', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container);
		expect(getTrigger(container).getAttribute('aria-expanded')).toBe('true');
	});

	it('menu aria-labelledby points at the trigger id', () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const menu = getMenu(container);
		const trigger = getTrigger(container);
		expect(menu.getAttribute('aria-labelledby')).toBe(trigger.id);
		expect(menu.getAttribute('role')).toBe('menu');
	});

	it('each actionable entry renders a button[role="menuitem"] with a stable id', () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const menuItems = getMenuItems(container);
		expect(menuItems.length).toBe(4); // Edit, Duplicate, Archive, Delete
		menuItems.forEach((btn) => expect(btn.id).toMatch(/^hz-dd-item-/));
	});

	it('separators render role="separator" and are never focusable', () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const seps = getSeparators(container);
		expect(seps.length).toBe(1);
		expect(seps[0].hasAttribute('tabindex')).toBe(false);
		expect(seps[0].querySelector('button')).toBeNull();
	});

	it('the menu is display:none (out of the a11y tree) while closed', () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const menu = getMenu(container);
		expect(getComputedStyle(menu).display).toBe('none');
	});

	it('the menu is visible once open', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container);
		expect(getComputedStyle(getMenu(container)).display).not.toBe('none');
	});

	it('no aria-activedescendant or data-active is ever emitted (real-focus model)', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const trigger = await openMenu(container);
		expect(trigger.hasAttribute('aria-activedescendant')).toBe(false);
		await pressKey(getMenu(container), 'ArrowDown');
		getMenuItems(container).forEach((btn) => {
			expect(btn.hasAttribute('data-active')).toBe(false);
			expect(btn.hasAttribute('aria-activedescendant')).toBe(false);
		});
	});

	it('items empty: trigger renders; opening shows an empty role="menu" with no crash', async () => {
		const { container } = render(Dropdown, { items: [], label: 'Actions' });
		await openMenu(container);
		expect(getRoot(container).hasAttribute('data-open')).toBe(true);
		expect(getMenuItems(container).length).toBe(0);
		expect(getMenu(container)).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Dropdown-R5/R6 — Open triggers & opening focus
// ---------------------------------------------------------------------------

describe('Dropdown-R5/R6 — open triggers & opening focus', () => {
	it('click on a closed trigger opens the menu focused on the first menuitem', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container);
		const menuItems = getMenuItems(container);
		expect(document.activeElement).toBe(menuItems[0]);
		expect(menuItems[0].tabIndex).toBe(0);
		menuItems.slice(1).forEach((btn) => expect(btn.tabIndex).toBe(-1));
	});

	it('ArrowDown on the trigger opens the menu focused on the first menuitem', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const trigger = getTrigger(container);
		const event = await pressKey(trigger, 'ArrowDown');
		expect(event.defaultPrevented).toBe(true);
		await tick();
		const menuItems = getMenuItems(container);
		expect(document.activeElement).toBe(menuItems[0]);
	});

	it('ArrowUp on the trigger opens the menu focused on the last menuitem', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const trigger = getTrigger(container);
		const event = await pressKey(trigger, 'ArrowUp');
		expect(event.defaultPrevented).toBe(true);
		await tick();
		const menuItems = getMenuItems(container);
		expect(document.activeElement).toBe(menuItems[menuItems.length - 1]);
	});

	it('Enter on the (Tab-focused) trigger opens the menu focused on the first menuitem', async () => {
		const before = document.createElement('button');
		before.textContent = 'before';
		document.body.appendChild(before);
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await userEvent.click(before);
		await userEvent.keyboard('{Tab}');
		expect(document.activeElement).toBe(getTrigger(container));
		await userEvent.keyboard('{Enter}');
		const menuItems = getMenuItems(container);
		expect(document.activeElement).toBe(menuItems[0]);
		before.remove();
	});

	it('Space on the (Tab-focused) trigger opens the menu focused on the first menuitem', async () => {
		const before = document.createElement('button');
		before.textContent = 'before';
		document.body.appendChild(before);
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await userEvent.click(before);
		await userEvent.keyboard('{Tab}');
		await userEvent.keyboard(' ');
		const menuItems = getMenuItems(container);
		expect(document.activeElement).toBe(menuItems[0]);
		before.remove();
	});

	it('clicking the trigger while open closes it and focus stays on the trigger', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const trigger = await openMenu(container);
		await userEvent.click(trigger);
		expect(getRoot(container).hasAttribute('data-open')).toBe(false);
		expect(document.activeElement).toBe(trigger);
	});

	it('single item: opening focuses it, and it is the sole tab stop', async () => {
		const one: DropdownEntry[] = [{ id: 'only', label: 'Only' }];
		const { container } = render(Dropdown, { items: one, label: 'Actions' });
		await openMenu(container);
		const menuItems = getMenuItems(container);
		expect(menuItems.length).toBe(1);
		expect(document.activeElement).toBe(menuItems[0]);
		expect(menuItems[0].tabIndex).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// Dropdown-R7 — In-menu keyboard
// ---------------------------------------------------------------------------

describe('Dropdown-R7 — in-menu keyboard', () => {
	it('ArrowDown moves real focus to the next menuitem (roving tabindex updates)', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container);
		const menu = getMenu(container);
		const menuItems = getMenuItems(container);
		const event = await pressKey(menu, 'ArrowDown');
		expect(event.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(menuItems[1]);
		expect(menuItems[1].tabIndex).toBe(0);
		expect(menuItems[0].tabIndex).toBe(-1);
	});

	it('ArrowDown reaches and focuses a disabled menuitem (Archive)', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container);
		const menu = getMenu(container);
		await pressKey(menu, 'ArrowDown'); // Duplicate
		await pressKey(menu, 'ArrowDown'); // Archive (disabled)
		const menuItems = getMenuItems(container);
		expect(document.activeElement).toBe(menuItems[2]);
		expect(menuItems[2].getAttribute('aria-disabled')).toBe('true');
	});

	it('ArrowDown wraps from the last menuitem to the first, including disabled', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container);
		const menu = getMenu(container);
		await pressKey(menu, 'ArrowDown'); // Duplicate
		await pressKey(menu, 'ArrowDown'); // Archive
		await pressKey(menu, 'ArrowDown'); // Delete
		await pressKey(menu, 'ArrowDown'); // wraps to Edit
		const menuItems = getMenuItems(container);
		expect(document.activeElement).toBe(menuItems[0]);
	});

	it('ArrowUp wraps from the first menuitem to the last, including disabled', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container);
		const menu = getMenu(container);
		const event = await pressKey(menu, 'ArrowUp'); // wraps to Delete
		expect(event.defaultPrevented).toBe(true);
		const menuItems = getMenuItems(container);
		expect(document.activeElement).toBe(menuItems[3]);
	});

	it('Home focuses the first menuitem, End focuses the last', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container);
		const menu = getMenu(container);
		const endEvent = await pressKey(menu, 'End');
		expect(endEvent.defaultPrevented).toBe(true);
		let menuItems = getMenuItems(container);
		expect(document.activeElement).toBe(menuItems[3]);

		const homeEvent = await pressKey(menu, 'Home');
		expect(homeEvent.defaultPrevented).toBe(true);
		menuItems = getMenuItems(container);
		expect(document.activeElement).toBe(menuItems[0]);
	});

	it('Escape closes the menu and returns focus to the trigger', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const trigger = await openMenu(container);
		const menu = getMenu(container);
		const event = await pressKey(menu, 'Escape');
		expect(event.defaultPrevented).toBe(true);
		expect(getRoot(container).hasAttribute('data-open')).toBe(false);
		expect(document.activeElement).toBe(trigger);
	});

	it('Tab closes the menu without preventDefault (native focus move proceeds)', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container);
		const menu = getMenu(container);
		const event = await pressKey(menu, 'Tab');
		expect(event.defaultPrevented).toBe(false);
		expect(getRoot(container).hasAttribute('data-open')).toBe(false);
	});

	it('single item: Arrow/Home/End all keep focus on it (wrap of one)', async () => {
		const one: DropdownEntry[] = [{ id: 'only', label: 'Only' }];
		const { container } = render(Dropdown, { items: one, label: 'Actions' });
		await openMenu(container);
		const menu = getMenu(container);
		const item = getMenuItems(container)[0];
		await pressKey(menu, 'ArrowDown');
		expect(document.activeElement).toBe(item);
		await pressKey(menu, 'ArrowUp');
		expect(document.activeElement).toBe(item);
		await pressKey(menu, 'Home');
		expect(document.activeElement).toBe(item);
		await pressKey(menu, 'End');
		expect(document.activeElement).toBe(item);
	});
});

// ---------------------------------------------------------------------------
// Dropdown-R8 — Typeahead
// ---------------------------------------------------------------------------

describe('Dropdown-R8 — typeahead', () => {
	it('a character focuses the next label-initial match', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container); // active = Edit
		const menu = getMenu(container);
		await pressKey(menu, 'd'); // -> Duplicate (next 'd'-initial after Edit)
		const menuItems = getMenuItems(container);
		expect(document.activeElement).toBe(menuItems[1]);
	});

	it('repeating the same character cycles through every matching item, including disabled', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container); // active = Edit
		const menu = getMenu(container);
		await pressKey(menu, 'd'); // -> Duplicate
		await pressKey(menu, 'd'); // -> Delete
		let menuItems = getMenuItems(container);
		expect(document.activeElement).toBe(menuItems[3]);
		await pressKey(menu, 'd'); // -> cycles back to Duplicate
		menuItems = getMenuItems(container);
		expect(document.activeElement).toBe(menuItems[1]);
	});

	it('typeahead reaches a disabled item (Archive)', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container);
		const menu = getMenu(container);
		await pressKey(menu, 'a'); // -> Archive (only 'a'-initial item)
		const menuItems = getMenuItems(container);
		expect(document.activeElement).toBe(menuItems[2]);
	});

	it('no match leaves focus unchanged', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container);
		const menu = getMenu(container);
		const before = document.activeElement;
		await pressKey(menu, 'z');
		expect(document.activeElement).toBe(before);
	});

	it('Space is not treated as typeahead', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container);
		const menu = getMenu(container);
		const before = document.activeElement;
		await pressKey(menu, ' ');
		expect(document.activeElement).toBe(before);
	});
});

// ---------------------------------------------------------------------------
// Dropdown-R4/R9 — Activation
// ---------------------------------------------------------------------------

describe('Dropdown-R4/R9 — activation', () => {
	it('clicking an enabled item fires item.onselect then onselect(id,item), closes, and returns focus to the trigger', async () => {
		const order: string[] = [];
		const itemOnselect = vi.fn(() => order.push('item'));
		const onselect = vi.fn((id: string) => order.push(`component:${id}`));
		const editItem: DropdownItem = { id: 'edit', label: 'Edit', onselect: itemOnselect };
		const list: DropdownEntry[] = [editItem, { id: 'other', label: 'Other' }];
		const { container } = render(Dropdown, { items: list, label: 'Actions', onselect });
		const trigger = await openMenu(container);
		const menuItems = getMenuItems(container);
		await userEvent.click(menuItems[0]);
		expect(itemOnselect).toHaveBeenCalledOnce();
		expect(onselect).toHaveBeenCalledWith('edit', editItem);
		expect(order).toEqual(['item', 'component:edit']);
		expect(getRoot(container).hasAttribute('data-open')).toBe(false);
		expect(document.activeElement).toBe(trigger);
	});

	it('Enter on the focused enabled item activates it (native button activation)', async () => {
		const onselect = vi.fn();
		const { container } = render(Dropdown, { items, label: 'Actions', onselect });
		const trigger = await openMenu(container); // focus = Edit
		await userEvent.keyboard('{Enter}');
		expect(onselect).toHaveBeenCalledWith('edit', expect.objectContaining({ id: 'edit' }));
		expect(getRoot(container).hasAttribute('data-open')).toBe(false);
		expect(document.activeElement).toBe(trigger);
	});

	it('Space on the focused enabled item activates it (native button activation)', async () => {
		const onselect = vi.fn();
		const { container } = render(Dropdown, { items, label: 'Actions', onselect });
		const trigger = await openMenu(container); // focus = Edit
		await userEvent.keyboard(' ');
		expect(onselect).toHaveBeenCalledWith('edit', expect.objectContaining({ id: 'edit' }));
		expect(document.activeElement).toBe(trigger);
	});

	it('clicking a disabled item is a no-op: no callback fires, menu stays open', async () => {
		const onselect = vi.fn();
		const { container } = render(Dropdown, { items, label: 'Actions', onselect });
		await openMenu(container);
		const menu = getMenu(container);
		await pressKey(menu, 'ArrowDown'); // Duplicate
		await pressKey(menu, 'ArrowDown'); // Archive (disabled)
		const menuItems = getMenuItems(container);
		nativeClick(menuItems[2]);
		await tick();
		expect(onselect).not.toHaveBeenCalled();
		expect(getRoot(container).hasAttribute('data-open')).toBe(true);
	});

	it('Enter on a focused disabled item is a no-op: no callback, menu stays open', async () => {
		const onselect = vi.fn();
		const { container } = render(Dropdown, { items, label: 'Actions', onselect });
		await openMenu(container);
		const menu = getMenu(container);
		await pressKey(menu, 'ArrowDown'); // Duplicate
		await pressKey(menu, 'ArrowDown'); // Archive (disabled) — real .focus() within the
		// already-claimed iframe (openMenu's click established browser focus).
		await userEvent.keyboard('{Enter}');
		expect(onselect).not.toHaveBeenCalled();
		expect(getRoot(container).hasAttribute('data-open')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Dropdown-R10 — Disabled items
// ---------------------------------------------------------------------------

describe('Dropdown-R10 — disabled items (focusable-but-inert)', () => {
	it('a disabled menuitem carries aria-disabled="true" + data-disabled, never native disabled', () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const archive = getMenuItems(container)[2];
		expect(archive.getAttribute('aria-disabled')).toBe('true');
		expect(archive.hasAttribute('data-disabled')).toBe(true);
		expect(archive.disabled).toBe(false);
	});

	it('a disabled menuitem is reachable by Arrow and typeahead and takes tabindex=0 when active', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container);
		const menu = getMenu(container);
		await pressKey(menu, 'ArrowDown');
		await pressKey(menu, 'ArrowDown'); // Archive
		const archive = getMenuItems(container)[2];
		expect(document.activeElement).toBe(archive);
		expect(archive.tabIndex).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// Dropdown-R11 — Disabled menu
// ---------------------------------------------------------------------------

describe('Dropdown-R11 — disabled menu', () => {
	it('disabled: trigger Button is disabled (aria-disabled), root carries data-state="disabled"', () => {
		const { container } = render(Dropdown, { items, label: 'Actions', disabled: true });
		expect(getTrigger(container).getAttribute('aria-disabled')).toBe('true');
		expect(getRoot(container).getAttribute('data-state')).toBe('disabled');
	});

	it('a click on a disabled trigger does not open the menu', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions', disabled: true });
		nativeClick(getTrigger(container));
		await tick();
		expect(getRoot(container).hasAttribute('data-open')).toBe(false);
	});

	it('ArrowDown on a disabled trigger does not open the menu', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions', disabled: true });
		await pressKey(getTrigger(container), 'ArrowDown');
		expect(getRoot(container).hasAttribute('data-open')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Dropdown-R12 — Outside click / focus-out (no focus trap)
// ---------------------------------------------------------------------------

describe('Dropdown-R12 — outside click / focus-out', () => {
	it("an outside pointer click closes the menu; the component itself never moves focus (it lands on the clicked element, per the browser's own click-to-focus default action)", async () => {
		const outside = document.createElement('button');
		outside.textContent = 'outside';
		document.body.appendChild(outside);
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container);
		// A real, trusted click — its native default action focuses `outside`
		// before our document click listener even runs, exactly as it would
		// for a genuine user click (Dropdown-R12: "focus is on the clicked
		// element").
		await userEvent.click(outside);
		expect(getRoot(container).hasAttribute('data-open')).toBe(false);
		expect(document.activeElement).toBe(outside);
		outside.remove();
	});

	it('focus leaving the root (relatedTarget outside) closes the menu', async () => {
		const outside = document.createElement('button');
		outside.textContent = 'outside';
		document.body.appendChild(outside);
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container);
		const root = getRoot(container);
		const activeItem = document.activeElement as HTMLElement;
		activeItem.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));
		await tick();
		expect(root.hasAttribute('data-open')).toBe(false);
		outside.remove();
	});

	it('focus moving trigger→item keeps the menu open (within the root)', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container);
		expect(getRoot(container).hasAttribute('data-open')).toBe(true);
	});

	it('focus moving item→item keeps the menu open (within the root)', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		await openMenu(container);
		const menu = getMenu(container);
		await pressKey(menu, 'ArrowDown');
		expect(getRoot(container).hasAttribute('data-open')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Dropdown-R13 — Alignment
// ---------------------------------------------------------------------------

describe('Dropdown-R13 — alignment', () => {
	it('align="end" reflects as data-align="end" on the root', () => {
		const { container } = render(Dropdown, { items, label: 'Actions', align: 'end' });
		expect(getRoot(container).getAttribute('data-align')).toBe('end');
	});
});

// ---------------------------------------------------------------------------
// Dropdown-R2 — Trigger faces
// ---------------------------------------------------------------------------

describe('Dropdown-R2 — trigger faces', () => {
	it('label set: trigger shows the visible text and it is the accessible name', () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const trigger = getTrigger(container);
		expect(trigger.textContent).toContain('Actions');
		expect(trigger.hasAttribute('aria-label')).toBe(false);
	});

	it('label + triggerLabel: triggerLabel overrides the accessible name via aria-label', () => {
		const { container } = render(Dropdown, {
			items,
			label: 'Actions',
			triggerLabel: 'Row actions for Aviar'
		});
		expect(getTrigger(container).getAttribute('aria-label')).toBe('Row actions for Aviar');
	});

	it('no label, triggerIcon + triggerLabel: icon-only Button form with the aria-label', () => {
		const { container } = render(Dropdown, { items, triggerLabel: 'More actions' });
		const trigger = getTrigger(container);
		expect(trigger.hasAttribute('data-icon-only')).toBe(true);
		expect(trigger.getAttribute('aria-label')).toBe('More actions');
	});

	it('no label, no triggerLabel: Button R14 dev warning fires', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(Dropdown, { items });
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('ariaLabel');
		warnSpy.mockRestore();
	});

	it('triggerProps reaches the trigger data-variant/data-intent/class', () => {
		const { container } = render(Dropdown, {
			items,
			label: 'Actions',
			triggerProps: { variant: 'ghost', intent: 'primary', class: 'foo' }
		});
		const trigger = getTrigger(container);
		expect(trigger.getAttribute('data-variant')).toBe('ghost');
		expect(trigger.getAttribute('data-intent')).toBe('primary');
		expect(trigger.classList.contains('foo')).toBe(true);
	});

	it('default triggerProps resolve to variant="outline", intent="neutral"', () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const trigger = getTrigger(container);
		expect(trigger.getAttribute('data-variant')).toBe('outline');
		expect(trigger.getAttribute('data-intent')).toBe('neutral');
	});
});

// ---------------------------------------------------------------------------
// Item icon & danger — Dropdown-R3
// ---------------------------------------------------------------------------

describe('Dropdown-R3 — item icon & danger', () => {
	it('an icon snippet renders before the label, decoratively (aria-hidden)', () => {
		const withIcon: DropdownEntry[] = [{ id: 'star', label: 'Star', icon: starIcon }];
		const { container } = render(Dropdown, { items: withIcon, label: 'X' });
		const first = getMenuItems(container)[0];
		const wrapper = first.querySelector('.hz-dropdown-item-icon');
		expect(wrapper).not.toBeNull();
		expect(wrapper!.getAttribute('aria-hidden')).toBe('true');
		expect(wrapper!.querySelector('svg[data-testid="star-icon"]')).not.toBeNull();
		// The icon never contributes to the accessible name — the label text
		// still precedes/accompanies it in the button's text content.
		expect(first.textContent).toContain('Star');
	});

	it('an item with no icon renders no icon wrapper', () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const first = getMenuItems(container)[0];
		expect(first.querySelector('.hz-dropdown-item-icon')).toBeNull();
	});

	it('danger item carries data-danger', () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const del = getMenuItems(container)[3];
		expect(del.getAttribute('data-danger')).toBe('');
		expect(del.textContent).toContain('Delete');
	});

	it('non-danger items carry no data-danger', () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const edit = getMenuItems(container)[0];
		expect(edit.hasAttribute('data-danger')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Dropdown-R14 — class & rest
// ---------------------------------------------------------------------------

describe('Dropdown-R14 — class & rest', () => {
	it('no class: root is exactly "hz-dropdown"', () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const root = getRoot(container);
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toEqual(['hz-dropdown']);
	});

	it('class="foo" is appended after hz-dropdown', () => {
		const { container } = render(Dropdown, { items, label: 'Actions', class: 'foo' });
		const root = getRoot(container);
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-dropdown');
		expect(classes).toContain('foo');
	});

	it('a forwarded data-testid reaches the root', () => {
		const { container } = render(Dropdown, {
			items,
			label: 'Actions',
			'data-testid': 'my-dropdown'
		});
		expect(getRoot(container).getAttribute('data-testid')).toBe('my-dropdown');
	});

	it('an attempted data-open / class override loses to the managed value', () => {
		const { container } = render(Dropdown, {
			items,
			label: 'Actions',
			'data-open': 'hijacked',
			class: 'foo'
		});
		const root = getRoot(container);
		// data-open is a boolean "present" hook — closed means absent, not the
		// forwarded string value.
		expect(root.hasAttribute('data-open')).toBe(false);
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toEqual(['hz-dropdown', 'foo']);
	});

	it('rest does not land on the trigger, the menu, or the items', () => {
		const { container } = render(Dropdown, {
			items,
			label: 'Actions',
			'data-testid': 'my-dropdown'
		});
		expect(getTrigger(container).hasAttribute('data-testid')).toBe(false);
		expect(getMenu(container).hasAttribute('data-testid')).toBe(false);
		getMenuItems(container).forEach((btn) => expect(btn.hasAttribute('data-testid')).toBe(false));
	});
});

// ---------------------------------------------------------------------------
// Dropdown-R16 — Barrel export
// ---------------------------------------------------------------------------

describe('Dropdown-R16 — barrel export', () => {
	it('Dropdown is resolvable from $lib and smoke-renders', async () => {
		const { Dropdown: D } = await import('$lib');
		expect(D).toBeDefined();
		const { container } = render(D, { items, label: 'Actions' });
		expect(container.querySelector('.hz-dropdown')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Integration — focus return & no focus trap
// ---------------------------------------------------------------------------

describe('Integration — focus return & no focus trap', () => {
	it('opening then Escape returns focus to the trigger', async () => {
		const before = document.createElement('button');
		before.textContent = 'before';
		document.body.appendChild(before);
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const trigger = await openMenu(container);
		await pressKey(getMenu(container), 'Escape');
		expect(document.activeElement).toBe(trigger);
		before.remove();
	});

	it('opening then activating an item returns focus to the trigger', async () => {
		const before = document.createElement('button');
		before.textContent = 'before';
		document.body.appendChild(before);
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const trigger = await openMenu(container);
		await userEvent.click(getMenuItems(container)[0]);
		expect(document.activeElement).toBe(trigger);
		before.remove();
	});

	it('Tab from the open menu lands on the next document tabbable and closes the menu (no focus trap)', async () => {
		const { container } = render(Dropdown, { items, label: 'Actions' });
		const after = document.createElement('button');
		after.textContent = 'after';
		container.appendChild(after);
		await openMenu(container);
		await userEvent.keyboard('{Tab}');
		expect(document.activeElement).toBe(after);
		expect(getRoot(container).hasAttribute('data-open')).toBe(false);
		after.remove();
	});
});
