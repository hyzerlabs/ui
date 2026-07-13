import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import type { Snippet } from 'svelte';
import Tabs from './Tabs.svelte';

// ---------------------------------------------------------------------------
// Types (mirrors component-local TabItem)
// ---------------------------------------------------------------------------

interface TabItem {
	id: string;
	label: string | Snippet;
	disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Sample items
// ---------------------------------------------------------------------------

const itemA: TabItem = { id: 'a', label: 'Tab A' };
const itemB: TabItem = { id: 'b', label: 'Tab B' };
const itemC: TabItem = { id: 'c', label: 'Tab C' };
const disabledItem: TabItem = { id: 'd', label: 'Tab D', disabled: true };

const threeItems = [itemA, itemB, itemC];

// ---------------------------------------------------------------------------
// Snippet helpers
// ---------------------------------------------------------------------------

/** Panel snippet that renders item.id into a data-testid div. */
const panelSnippet = createRawSnippet<[TabItem]>((getItem) => ({
	render: () => `<div data-testid="panel-${getItem().id}">Content for ${getItem().label}</div>`
}));

/** Panel snippet that includes an <input> for persistence testing (Tabs-R6). */
const inputPanelSnippet = createRawSnippet<[TabItem]>((getItem) => ({
	render: () =>
		`<div data-testid="panel-${getItem().id}"><input data-testid="input-${getItem().id}" /></div>`
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wait one event-loop turn for Svelte to flush DOM updates. */
function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

/** Fire a KeyboardEvent on an element and return the event (for defaultPrevented checks). */
function fireKey(
	el: EventTarget,
	key: string,
	extra: EventInit & { shiftKey?: boolean } = {}
): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra });
	el.dispatchEvent(event);
	return event;
}

// ---------------------------------------------------------------------------
// Tabs-R1/R2 — Root + Tablist structure
// ---------------------------------------------------------------------------

describe('Tabs-R1/R2 — root and tablist structure', () => {
	it('renders <div class="hz-tabs"> by default', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const root = container.querySelector('div.hz-tabs') as HTMLElement;
		expect(root).not.toBeNull();
	});

	it('root carries data-orientation="horizontal" by default', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const root = container.querySelector('.hz-tabs') as HTMLElement;
		expect(root.getAttribute('data-orientation')).toBe('horizontal');
	});

	it('data-orientation="vertical" is reflected when orientation="vertical"', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			orientation: 'vertical',
			panel: panelSnippet
		});
		const root = container.querySelector('.hz-tabs') as HTMLElement;
		expect(root.getAttribute('data-orientation')).toBe('vertical');
	});

	it('renders exactly one [role="tablist"] inside the root', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const tablists = container.querySelectorAll('[role="tablist"]');
		expect(tablists.length).toBe(1);
	});

	it('tablist carries class="hz-tabs-list"', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const tablist = container.querySelector('div.hz-tabs-list[role="tablist"]') as HTMLElement;
		expect(tablist).not.toBeNull();
	});

	it('tablist carries aria-orientation matching the orientation prop', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Navigation',
			orientation: 'vertical',
			panel: panelSnippet
		});
		const tablist = container.querySelector('[role="tablist"]') as HTMLElement;
		expect(tablist.getAttribute('aria-orientation')).toBe('vertical');
	});

	it('tablist carries the ariaLabel prop as aria-label', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'My tab group',
			panel: panelSnippet
		});
		const tablist = container.querySelector('[role="tablist"]') as HTMLElement;
		expect(tablist.getAttribute('aria-label')).toBe('My tab group');
	});

	it('renders one [role="tab"] per item in array order', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = container.querySelectorAll('[role="tab"]');
		expect(triggers.length).toBe(3);
	});

	it('items=[] renders root + empty tablist with no triggers or panels', () => {
		const { container } = render(Tabs, {
			items: [],
			ariaLabel: 'Empty tabs',
			panel: panelSnippet
		});
		const root = container.querySelector('.hz-tabs') as HTMLElement;
		expect(root).not.toBeNull();
		expect(root.querySelectorAll('[role="tab"]').length).toBe(0);
		expect(root.querySelectorAll('[role="tabpanel"]').length).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// Tabs-R3 — Trigger attributes
// ---------------------------------------------------------------------------

describe('Tabs-R3 — trigger attributes', () => {
	it('each trigger has type="button"', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll('[role="tab"]'));
		triggers.forEach((t) => expect(t.getAttribute('type')).toBe('button'));
	});

	it('each trigger has class="hz-tabs-trigger"', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = container.querySelectorAll('button.hz-tabs-trigger[role="tab"]');
		expect(triggers.length).toBe(3);
	});

	it('trigger text content is item.label (string form)', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll('[role="tab"]'));
		expect(triggers[0].textContent?.trim()).toBe('Tab A');
		expect(triggers[1].textContent?.trim()).toBe('Tab B');
		expect(triggers[2].textContent?.trim()).toBe('Tab C');
	});

	it('label as a Snippet renders its markup inside the trigger', () => {
		const richLabel = createRawSnippet(() => ({
			render: () => `<span data-testid="rich-label">Rich <em>label</em></span>`
		}));
		const { container } = render(Tabs, {
			items: [{ id: 'r', label: richLabel }],
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const trigger = container.querySelector('[role="tab"]') as HTMLElement;
		expect(trigger.querySelector('[data-testid="rich-label"]')).not.toBeNull();
		expect(trigger.querySelector('em')).not.toBeNull();
	});

	it('exactly one trigger has aria-selected="true" (the active tab)', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const selected = container.querySelectorAll('[role="tab"][aria-selected="true"]');
		expect(selected.length).toBe(1);
	});

	it('exactly one trigger has data-state="active"', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const active = container.querySelectorAll('[role="tab"][data-state="active"]');
		expect(active.length).toBe(1);
	});

	it('trigger id and aria-controls link correctly to the matching panel', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		triggers.forEach((trigger) => {
			const controls = trigger.getAttribute('aria-controls')!;
			const panel = container.querySelector(`[role="tabpanel"]#${CSS.escape(controls)}`);
			expect(panel).not.toBeNull();
		});
	});

	it('each panel aria-labelledby points to its trigger id', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
		panels.forEach((panel) => {
			const labelledBy = panel.getAttribute('aria-labelledby')!;
			const trigger = container.querySelector(`[role="tab"]#${CSS.escape(labelledBy)}`);
			expect(trigger).not.toBeNull();
		});
	});
});

// ---------------------------------------------------------------------------
// Tabs-R4 — Roving tabindex
// ---------------------------------------------------------------------------

describe('Tabs-R4 — roving tabindex', () => {
	it('active trigger has tabindex="0"', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		// First item is active by default
		expect(triggers[0].getAttribute('tabindex')).toBe('0');
	});

	it('non-active triggers have tabindex="-1"', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		expect(triggers[1].getAttribute('tabindex')).toBe('-1');
		expect(triggers[2].getAttribute('tabindex')).toBe('-1');
	});

	it('disabled trigger always has tabindex="-1"', () => {
		const { container } = render(Tabs, {
			items: [disabledItem, itemA],
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		// Disabled item is first; active is itemA
		expect(triggers[0].getAttribute('tabindex')).toBe('-1');
	});

	it('when all items disabled every trigger has tabindex="-1"', () => {
		const allDisabled = [
			{ id: 'x', label: 'X', disabled: true },
			{ id: 'y', label: 'Y', disabled: true }
		];
		const { container } = render(Tabs, {
			items: allDisabled,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		triggers.forEach((t) => expect(t.getAttribute('tabindex')).toBe('-1'));
	});

	it('tabindex updates after clicking a different tab', async () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		triggers[1].click();
		await tick();
		expect(triggers[1].getAttribute('tabindex')).toBe('0');
		expect(triggers[0].getAttribute('tabindex')).toBe('-1');
	});
});

// ---------------------------------------------------------------------------
// Tabs-R5 — Panels (all rendered, visibility via hidden)
// ---------------------------------------------------------------------------

describe('Tabs-R5 — panels', () => {
	it('renders one [role="tabpanel"] per item', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const panels = container.querySelectorAll('[role="tabpanel"]');
		expect(panels.length).toBe(3);
	});

	it('each panel has class="hz-tabs-panel"', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const panels = container.querySelectorAll('div.hz-tabs-panel[role="tabpanel"]');
		expect(panels.length).toBe(3);
	});

	it('panels without focusable content have tabindex="0"', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
		panels.forEach((p) => expect(p.getAttribute('tabindex')).toBe('0'));
	});

	// APG recommendation: a tabpanel is only its own tab stop when it contains
	// no focusable elements — panels with interactive content get tabindex=-1.
	it('panels containing focusable content have tabindex="-1"', async () => {
		const focusablePanel = createRawSnippet<[TabItem]>((getItem) => ({
			render: () => `<div><button type="button">Action for ${getItem().id}</button></div>`
		}));
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: focusablePanel
		});
		// The focusable check runs in an effect after mount.
		await new Promise((r) => setTimeout(r, 0));
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
		panels.forEach((p) => expect(p.getAttribute('tabindex')).toBe('-1'));
	});

	it('active panel has data-state="active" and no hidden attribute', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
		expect(panels[0].getAttribute('data-state')).toBe('active');
		expect(panels[0].hasAttribute('hidden')).toBe(false);
	});

	it('inactive panels have data-state="inactive" and the hidden attribute', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
		expect(panels[1].getAttribute('data-state')).toBe('inactive');
		expect(panels[1].hasAttribute('hidden')).toBe(true);
		expect(panels[2].getAttribute('data-state')).toBe('inactive');
		expect(panels[2].hasAttribute('hidden')).toBe(true);
	});

	it('panel snippet receives each item — branched content appears in the correct panel', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const panels = Array.from(container.querySelectorAll('[role="tabpanel"]'));
		expect(panels[0].querySelector('[data-testid="panel-a"]')).not.toBeNull();
		expect(panels[1].querySelector('[data-testid="panel-b"]')).not.toBeNull();
		expect(panels[2].querySelector('[data-testid="panel-c"]')).not.toBeNull();
	});

	it('when all items disabled all panels have data-state="inactive" and hidden', () => {
		const allDisabled = [
			{ id: 'x', label: 'X', disabled: true },
			{ id: 'y', label: 'Y', disabled: true }
		];
		const { container } = render(Tabs, {
			items: allDisabled,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
		panels.forEach((p) => {
			expect(p.getAttribute('data-state')).toBe('inactive');
			expect(p.hasAttribute('hidden')).toBe(true);
		});
	});
});

// ---------------------------------------------------------------------------
// Tabs-R6 — Panel persistence (never unmounted)
// ---------------------------------------------------------------------------

describe('Tabs-R6 — panel persistence', () => {
	it('input value in panel A persists after switching to B and back', async () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: inputPanelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));

		// Type into the input in panel A
		const inputA = container.querySelector<HTMLInputElement>('[data-testid="input-a"]')!;
		inputA.focus();
		await userEvent.type(inputA, 'hello');
		expect(inputA.value).toBe('hello');

		// Switch to tab B
		triggers[1].click();
		await tick();

		// Switch back to tab A
		triggers[0].click();
		await tick();

		// Value should persist (panel was never unmounted)
		const inputAAgain = container.querySelector<HTMLInputElement>('[data-testid="input-a"]')!;
		expect(inputAAgain.value).toBe('hello');
	});
});

// ---------------------------------------------------------------------------
// Tabs-R7 — Active state (uncontrolled)
// ---------------------------------------------------------------------------

describe('Tabs-R7 — active state', () => {
	it('first non-disabled item is active by default (no defaultTab)', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		expect(triggers[0].getAttribute('aria-selected')).toBe('true');
		expect(triggers[0].getAttribute('data-state')).toBe('active');
	});

	it('defaultTab is honored when it matches a non-disabled item', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			defaultTab: 'b',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		expect(triggers[1].getAttribute('aria-selected')).toBe('true');
		expect(triggers[1].getAttribute('data-state')).toBe('active');
	});

	it('defaultTab referencing an unknown id falls back to first non-disabled item', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			defaultTab: 'unknown',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		expect(triggers[0].getAttribute('aria-selected')).toBe('true');
	});

	it('defaultTab referencing a disabled item falls back to first non-disabled', () => {
		const { container } = render(Tabs, {
			items: [disabledItem, itemA, itemB],
			ariaLabel: 'Test tabs',
			defaultTab: 'd',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		// itemA is at index 1 (first non-disabled)
		expect(triggers[1].getAttribute('aria-selected')).toBe('true');
	});

	it('clicking a trigger activates it and deactivates the previous', async () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

		// Click tab B
		triggers[1].click();
		await tick();

		expect(triggers[1].getAttribute('aria-selected')).toBe('true');
		expect(triggers[1].getAttribute('data-state')).toBe('active');
		expect(triggers[0].getAttribute('aria-selected')).toBe('false');
		expect(triggers[0].getAttribute('data-state')).toBe('inactive');
		expect(panels[1].getAttribute('data-state')).toBe('active');
		expect(panels[1].hasAttribute('hidden')).toBe(false);
		expect(panels[0].getAttribute('data-state')).toBe('inactive');
		expect(panels[0].hasAttribute('hidden')).toBe(true);
	});

	it('re-clicking the already-active tab is a no-op (state unchanged)', async () => {
		const spy = vi.fn();
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			onChange: spy,
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));

		// Tab A is already active; click it again
		triggers[0].click();
		await tick();

		expect(spy).not.toHaveBeenCalled();
		expect(triggers[0].getAttribute('aria-selected')).toBe('true');
	});
});

// ---------------------------------------------------------------------------
// Tabs-R8 — Disabled tabs
// ---------------------------------------------------------------------------

describe('Tabs-R8 — disabled tabs', () => {
	it('disabled trigger has aria-disabled="true"', () => {
		const { container } = render(Tabs, {
			items: [itemA, disabledItem],
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		expect(triggers[1].getAttribute('aria-disabled')).toBe('true');
	});

	it('disabled trigger has data-disabled attribute (present as empty string)', () => {
		const { container } = render(Tabs, {
			items: [itemA, disabledItem],
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		expect(triggers[1].hasAttribute('data-disabled')).toBe(true);
	});

	it('disabled trigger has tabindex="-1"', () => {
		const { container } = render(Tabs, {
			items: [itemA, disabledItem],
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		expect(triggers[1].getAttribute('tabindex')).toBe('-1');
	});

	it('non-disabled trigger has no aria-disabled and no data-disabled', () => {
		const { container } = render(Tabs, {
			items: [itemA, disabledItem],
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		expect(triggers[0].hasAttribute('aria-disabled')).toBe(false);
		expect(triggers[0].hasAttribute('data-disabled')).toBe(false);
	});

	it('clicking a disabled trigger does not change the active tab', async () => {
		const { container } = render(Tabs, {
			items: [itemA, disabledItem],
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		triggers[1].click();
		await tick();
		// itemA remains active
		expect(triggers[0].getAttribute('aria-selected')).toBe('true');
		expect(triggers[1].getAttribute('aria-selected')).toBe('false');
	});

	it('disabled trigger uses aria-disabled (not the disabled attr) so it stays in DOM', () => {
		const { container } = render(Tabs, {
			items: [itemA, disabledItem],
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		// Should NOT have the native `disabled` attribute
		expect(triggers[1].hasAttribute('disabled')).toBe(false);
	});

	it('arrow navigation skips disabled triggers', () => {
		const { container } = render(Tabs, {
			items: [itemA, disabledItem, itemB],
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		// Arrow Right from itemA should skip disabledItem and land on itemB
		triggers[0].focus();
		fireKey(triggers[0], 'ArrowRight');
		expect(document.activeElement).toBe(triggers[2]);
	});
});

// ---------------------------------------------------------------------------
// Tabs-R9 — onChange callback
// ---------------------------------------------------------------------------

describe('Tabs-R9 — onChange callback', () => {
	it('onChange is NOT called on initial mount', () => {
		const spy = vi.fn();
		render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			onChange: spy,
			panel: panelSnippet
		});
		expect(spy).not.toHaveBeenCalled();
	});

	it('onChange fires with the new tab id on click', async () => {
		const spy = vi.fn();
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			onChange: spy,
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		triggers[1].click();
		await tick();
		expect(spy).toHaveBeenCalledOnce();
		expect(spy.mock.calls[0][0]).toBe('b');
	});

	it('onChange does not fire when re-activating the already-active tab', async () => {
		const spy = vi.fn();
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			onChange: spy,
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		// Tab A is already active; click again
		triggers[0].click();
		await tick();
		expect(spy).not.toHaveBeenCalled();
	});

	it('onChange does not fire when clicking a disabled trigger', async () => {
		const spy = vi.fn();
		const { container } = render(Tabs, {
			items: [itemA, disabledItem],
			ariaLabel: 'Test tabs',
			onChange: spy,
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		triggers[1].click();
		await tick();
		expect(spy).not.toHaveBeenCalled();
	});

	it('onChange omitted: no error thrown on activation', async () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		triggers[1].click();
		await tick();
		// No error = pass; Vitest requireAssertions is satisfied by the implicit check
		expect(triggers[1].getAttribute('aria-selected')).toBe('true');
	});

	it('onChange fires after keyboard activation (auto mode)', async () => {
		const spy = vi.fn();
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			activation: 'auto',
			onChange: spy,
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		triggers[0].focus();
		fireKey(triggers[0], 'ArrowRight');
		await tick();
		expect(spy).toHaveBeenCalledOnce();
		expect(spy.mock.calls[0][0]).toBe('b');
	});

	it('onChange fires after manual keyboard activation (Enter)', async () => {
		const spy = vi.fn();
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			activation: 'manual',
			onChange: spy,
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		triggers[0].focus();
		// Arrow to trigger B (moves focus only, no activation)
		fireKey(triggers[0], 'ArrowRight');
		await tick();
		expect(spy).not.toHaveBeenCalled();
		// Enter on trigger B (now focused)
		fireKey(triggers[1], 'Enter');
		await tick();
		expect(spy).toHaveBeenCalledOnce();
		expect(spy.mock.calls[0][0]).toBe('b');
	});
});

// ---------------------------------------------------------------------------
// Tabs-R10 — Arrow navigation
// ---------------------------------------------------------------------------

describe('Tabs-R10 — arrow navigation', () => {
	// Horizontal orientation
	describe('horizontal orientation', () => {
		it('ArrowRight moves focus to the next non-disabled trigger', () => {
			const { container } = render(Tabs, {
				items: threeItems,
				ariaLabel: 'Test tabs',
				orientation: 'horizontal',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			triggers[0].focus();
			fireKey(triggers[0], 'ArrowRight');
			expect(document.activeElement).toBe(triggers[1]);
		});

		it('ArrowLeft moves focus to the previous non-disabled trigger', () => {
			const { container } = render(Tabs, {
				items: threeItems,
				ariaLabel: 'Test tabs',
				orientation: 'horizontal',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			triggers[1].focus();
			fireKey(triggers[1], 'ArrowLeft');
			expect(document.activeElement).toBe(triggers[0]);
		});

		it('ArrowRight wraps from last to first', () => {
			const { container } = render(Tabs, {
				items: threeItems,
				ariaLabel: 'Test tabs',
				orientation: 'horizontal',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			triggers[2].focus();
			fireKey(triggers[2], 'ArrowRight');
			expect(document.activeElement).toBe(triggers[0]);
		});

		it('ArrowLeft wraps from first to last', () => {
			const { container } = render(Tabs, {
				items: threeItems,
				ariaLabel: 'Test tabs',
				orientation: 'horizontal',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			triggers[0].focus();
			fireKey(triggers[0], 'ArrowLeft');
			expect(document.activeElement).toBe(triggers[2]);
		});

		it('ArrowDown is ignored (horizontal) — no focus change', () => {
			const { container } = render(Tabs, {
				items: threeItems,
				ariaLabel: 'Test tabs',
				orientation: 'horizontal',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			triggers[0].focus();
			const event = fireKey(triggers[0], 'ArrowDown');
			// No preventDefault for ignored keys
			expect(event.defaultPrevented).toBe(false);
			expect(document.activeElement).toBe(triggers[0]);
		});

		it('ArrowUp is ignored (horizontal) — no focus change', () => {
			const { container } = render(Tabs, {
				items: threeItems,
				ariaLabel: 'Test tabs',
				orientation: 'horizontal',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			triggers[0].focus();
			const event = fireKey(triggers[0], 'ArrowUp');
			expect(event.defaultPrevented).toBe(false);
			expect(document.activeElement).toBe(triggers[0]);
		});
	});

	// Vertical orientation
	describe('vertical orientation', () => {
		it('ArrowDown moves focus to the next non-disabled trigger', () => {
			const { container } = render(Tabs, {
				items: threeItems,
				ariaLabel: 'Test tabs',
				orientation: 'vertical',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			triggers[0].focus();
			fireKey(triggers[0], 'ArrowDown');
			expect(document.activeElement).toBe(triggers[1]);
		});

		it('ArrowUp moves focus to the previous non-disabled trigger', () => {
			const { container } = render(Tabs, {
				items: threeItems,
				ariaLabel: 'Test tabs',
				orientation: 'vertical',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			triggers[1].focus();
			fireKey(triggers[1], 'ArrowUp');
			expect(document.activeElement).toBe(triggers[0]);
		});

		it('ArrowDown wraps from last to first', () => {
			const { container } = render(Tabs, {
				items: threeItems,
				ariaLabel: 'Test tabs',
				orientation: 'vertical',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			triggers[2].focus();
			fireKey(triggers[2], 'ArrowDown');
			expect(document.activeElement).toBe(triggers[0]);
		});

		it('ArrowRight is ignored (vertical) — no focus change', () => {
			const { container } = render(Tabs, {
				items: threeItems,
				ariaLabel: 'Test tabs',
				orientation: 'vertical',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			triggers[0].focus();
			const event = fireKey(triggers[0], 'ArrowRight');
			expect(event.defaultPrevented).toBe(false);
			expect(document.activeElement).toBe(triggers[0]);
		});
	});

	// Home / End
	describe('Home / End keys', () => {
		it('Home moves focus to the first non-disabled trigger', () => {
			const { container } = render(Tabs, {
				items: threeItems,
				ariaLabel: 'Test tabs',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			triggers[2].focus();
			fireKey(triggers[2], 'Home');
			expect(document.activeElement).toBe(triggers[0]);
		});

		it('End moves focus to the last non-disabled trigger', () => {
			const { container } = render(Tabs, {
				items: threeItems,
				ariaLabel: 'Test tabs',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			triggers[0].focus();
			fireKey(triggers[0], 'End');
			expect(document.activeElement).toBe(triggers[2]);
		});

		it('Home skips leading disabled triggers to first non-disabled', () => {
			const { container } = render(Tabs, {
				items: [disabledItem, itemA, itemB],
				ariaLabel: 'Test tabs',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			triggers[2].focus();
			fireKey(triggers[2], 'Home');
			// First non-disabled is itemA at index 1
			expect(document.activeElement).toBe(triggers[1]);
		});

		it('End skips trailing disabled triggers to last non-disabled', () => {
			const { container } = render(Tabs, {
				items: [itemA, itemB, disabledItem],
				ariaLabel: 'Test tabs',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			triggers[0].focus();
			fireKey(triggers[0], 'End');
			// Last non-disabled is itemB at index 1
			expect(document.activeElement).toBe(triggers[1]);
		});
	});

	// preventDefault
	describe('preventDefault', () => {
		it('ArrowRight calls preventDefault (suppress native scroll)', () => {
			const { container } = render(Tabs, {
				items: threeItems,
				ariaLabel: 'Test tabs',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			const event = fireKey(triggers[0], 'ArrowRight');
			expect(event.defaultPrevented).toBe(true);
		});

		it('ArrowLeft calls preventDefault', () => {
			const { container } = render(Tabs, {
				items: threeItems,
				ariaLabel: 'Test tabs',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			const event = fireKey(triggers[1], 'ArrowLeft');
			expect(event.defaultPrevented).toBe(true);
		});

		it('Home calls preventDefault', () => {
			const { container } = render(Tabs, {
				items: threeItems,
				ariaLabel: 'Test tabs',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			const event = fireKey(triggers[2], 'Home');
			expect(event.defaultPrevented).toBe(true);
		});

		it('End calls preventDefault', () => {
			const { container } = render(Tabs, {
				items: threeItems,
				ariaLabel: 'Test tabs',
				panel: panelSnippet
			});
			const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
			const event = fireKey(triggers[0], 'End');
			expect(event.defaultPrevented).toBe(true);
		});
	});

	// Wrap with only one non-disabled trigger
	it('only one non-disabled trigger: arrow/Home/End keep focus on it', () => {
		const { container } = render(Tabs, {
			items: [disabledItem, itemA, { ...disabledItem, id: 'e', label: 'E' }],
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		// Only itemA (index 1) is enabled
		triggers[1].focus();
		fireKey(triggers[1], 'ArrowRight');
		expect(document.activeElement).toBe(triggers[1]);
		fireKey(triggers[1], 'Home');
		expect(document.activeElement).toBe(triggers[1]);
		fireKey(triggers[1], 'End');
		expect(document.activeElement).toBe(triggers[1]);
	});
});

// ---------------------------------------------------------------------------
// Tabs-R11 — Activation mode
// ---------------------------------------------------------------------------

describe('Tabs-R11 — activation mode', () => {
	it('auto mode: arrow moves focus AND activates the tab', async () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			activation: 'auto',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

		triggers[0].focus();
		fireKey(triggers[0], 'ArrowRight');
		await tick();

		// Focus moved to trigger B
		expect(document.activeElement).toBe(triggers[1]);
		// Tab B is also activated (aria-selected and panel visible)
		expect(triggers[1].getAttribute('aria-selected')).toBe('true');
		expect(panels[1].getAttribute('data-state')).toBe('active');
		expect(panels[1].hasAttribute('hidden')).toBe(false);
		expect(panels[0].hasAttribute('hidden')).toBe(true);
	});

	it('manual mode: arrow moves focus only; active tab/panel unchanged', async () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			activation: 'manual',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

		triggers[0].focus();
		fireKey(triggers[0], 'ArrowRight');
		await tick();

		// Focus moved to trigger B
		expect(document.activeElement).toBe(triggers[1]);
		// But tab A is still active
		expect(triggers[0].getAttribute('aria-selected')).toBe('true');
		expect(triggers[1].getAttribute('aria-selected')).toBe('false');
		expect(panels[0].getAttribute('data-state')).toBe('active');
		expect(panels[0].hasAttribute('hidden')).toBe(false);
		expect(panels[1].hasAttribute('hidden')).toBe(true);
	});

	it('manual mode: Enter on focused trigger activates it', async () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			activation: 'manual',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

		triggers[0].focus();
		fireKey(triggers[0], 'ArrowRight');
		// Trigger B is now focused but inactive
		await tick();

		// Press Enter on trigger B
		const enterEvent = fireKey(triggers[1], 'Enter');
		await tick();

		expect(enterEvent.defaultPrevented).toBe(true);
		expect(triggers[1].getAttribute('aria-selected')).toBe('true');
		expect(panels[1].getAttribute('data-state')).toBe('active');
		expect(panels[1].hasAttribute('hidden')).toBe(false);
	});

	it('manual mode: Space on focused trigger activates it', async () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			activation: 'manual',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));

		triggers[0].focus();
		fireKey(triggers[0], 'ArrowRight');
		await tick();

		const spaceEvent = fireKey(triggers[1], ' ');
		await tick();

		expect(spaceEvent.defaultPrevented).toBe(true);
		expect(triggers[1].getAttribute('aria-selected')).toBe('true');
	});
});

// ---------------------------------------------------------------------------
// Tabs-R12 — Tab key into panel
// ---------------------------------------------------------------------------

describe('Tabs-R12 — Tab key into panel', () => {
	it('Tab from the active trigger moves focus into the active panel', async () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

		// Click, not .focus(): userEvent.keyboard sends real CDP keys to the
		// iframe holding browser-level focus, which .focus() alone doesn't
		// claim under parallel test-file iframes. Clicking the already-active
		// trigger is selection-neutral and focuses it for real.
		await userEvent.click(triggers[0]);
		await userEvent.keyboard('{Tab}');

		// The active panel (panel A, tabindex=0) should receive focus
		expect(document.activeElement).toBe(panels[0]);
	});

	it('inactive panels (hidden) are not in the tab order', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
		// Inactive panels have hidden → not in tab order
		expect(panels[1].hasAttribute('hidden')).toBe(true);
		expect(panels[2].hasAttribute('hidden')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Tabs-R13 — Class composition
// ---------------------------------------------------------------------------

describe('Tabs-R13 — class composition', () => {
	it('no class prop → rendered class is exactly "hz-tabs"', () => {
		const { container } = render(Tabs, {
			items: [],
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const root = container.querySelector('.hz-tabs') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toEqual(['hz-tabs']);
	});

	it('class="foo bar" → hz-tabs is first, foo and bar are present', () => {
		const { container } = render(Tabs, {
			items: [],
			ariaLabel: 'Test tabs',
			class: 'foo bar',
			panel: panelSnippet
		});
		const root = container.querySelector('.hz-tabs') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-tabs');
		expect(classes).toContain('foo');
		expect(classes).toContain('bar');
	});
});

// ---------------------------------------------------------------------------
// Tabs-R14 — rest forwarding
// ---------------------------------------------------------------------------

describe('Tabs-R14 — rest forwarding', () => {
	it('arbitrary rest attr (data-testid) is forwarded to the root div', async () => {
		render(Tabs, {
			items: [],
			ariaLabel: 'Test tabs',
			panel: panelSnippet,
			'data-testid': 'my-tabs'
		} as Record<string, unknown>);
		await expect.element(page.getByTestId('my-tabs')).toBeInTheDocument();
	});

	it('rest cannot overwrite the managed class', () => {
		const { container } = render(Tabs, {
			items: [],
			ariaLabel: 'Test tabs',
			panel: panelSnippet,
			class: 'consumer-class'
		} as Record<string, unknown>);
		const root = container.querySelector('.hz-tabs') as HTMLElement;
		expect(root.classList.contains('hz-tabs')).toBe(true);
	});

	it('rest cannot overwrite the managed data-orientation', () => {
		const { container } = render(Tabs, {
			items: [],
			ariaLabel: 'Test tabs',
			panel: panelSnippet,
			orientation: 'horizontal',
			'data-orientation': 'override'
		} as Record<string, unknown>);
		const root = container.querySelector('.hz-tabs') as HTMLElement;
		expect(root.getAttribute('data-orientation')).toBe('horizontal');
	});
});

// ---------------------------------------------------------------------------
// Tabs-R15 — Dev warning for duplicate ids
// ---------------------------------------------------------------------------

describe('Tabs-R15 — dev warning for duplicate ids', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('duplicate item ids: emits exactly one console.warn', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const dupItems = [
			{ id: 'a', label: 'A' },
			{ id: 'a', label: 'A again' }
		];
		render(Tabs, { items: dupItems, ariaLabel: 'Test', panel: panelSnippet });
		expect(warnSpy).toHaveBeenCalledOnce();
	});

	it('unique item ids: no console.warn emitted', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(Tabs, { items: threeItems, ariaLabel: 'Test', panel: panelSnippet });
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it('unknown defaultTab id: no console.warn (silently ignored)', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test',
			defaultTab: 'unknown-id',
			panel: panelSnippet
		});
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it('disabled defaultTab id: no console.warn (silently falls back)', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(Tabs, {
			items: [disabledItem, itemA],
			ariaLabel: 'Test',
			defaultTab: 'd',
			panel: panelSnippet
		});
		expect(warnSpy).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Tabs-R16 — Barrel export
// ---------------------------------------------------------------------------

describe('Tabs-R16 — barrel export', () => {
	it('Tabs is resolvable from $lib', async () => {
		const { Tabs } = await import('$lib');
		expect(Tabs).toBeDefined();
	});

	it('Tabs smoke-renders from $lib import', async () => {
		const { Tabs } = await import('$lib');
		const { container } = render(Tabs, {
			items: [],
			ariaLabel: 'Test',
			panel: panelSnippet
		});
		expect(container.querySelector('div.hz-tabs')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Structural CSS
// ---------------------------------------------------------------------------

describe('Tabs structural CSS', () => {
	it('tablist has computed flex-direction: row in horizontal mode', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			orientation: 'horizontal',
			panel: panelSnippet
		});
		const tablist = container.querySelector('[role="tablist"]') as HTMLElement;
		expect(getComputedStyle(tablist).flexDirection).toBe('row');
	});

	it('tablist has computed flex-direction: column in vertical mode', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			orientation: 'vertical',
			panel: panelSnippet
		});
		const tablist = container.querySelector('[role="tablist"]') as HTMLElement;
		expect(getComputedStyle(tablist).flexDirection).toBe('column');
	});

	it('inactive panels have computed display: none', () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
		// Panels B and C are inactive
		expect(getComputedStyle(panels[1]).display).toBe('none');
		expect(getComputedStyle(panels[2]).display).toBe('none');
	});
});

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

describe('Integration', () => {
	it('auto mode: arrowing through tablist swaps visible panel and fires onChange each step', async () => {
		const spy = vi.fn();
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			activation: 'auto',
			onChange: spy,
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

		triggers[0].focus();

		// Arrow to B
		fireKey(triggers[0], 'ArrowRight');
		await tick();
		expect(panels[1].getAttribute('data-state')).toBe('active');
		expect(panels[0].hasAttribute('hidden')).toBe(true);
		expect(spy.mock.calls.length).toBe(1);
		expect(spy.mock.calls[0][0]).toBe('b');

		// Arrow to C
		fireKey(triggers[1], 'ArrowRight');
		await tick();
		expect(panels[2].getAttribute('data-state')).toBe('active');
		expect(spy.mock.calls.length).toBe(2);
		expect(spy.mock.calls[1][0]).toBe('c');
	});

	it('manual mode: arrow then Enter swaps once', async () => {
		const spy = vi.fn();
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			activation: 'manual',
			onChange: spy,
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

		triggers[0].focus();

		// Arrow moves focus but does NOT activate
		fireKey(triggers[0], 'ArrowRight');
		await tick();
		expect(spy).not.toHaveBeenCalled();
		expect(panels[0].getAttribute('data-state')).toBe('active');

		// Enter activates
		fireKey(triggers[1], 'Enter');
		await tick();
		expect(spy).toHaveBeenCalledOnce();
		expect(panels[1].getAttribute('data-state')).toBe('active');
	});

	it('all-disabled renders with no active panel and no errors', () => {
		const allDisabled = [
			{ id: 'x', label: 'X', disabled: true },
			{ id: 'y', label: 'Y', disabled: true }
		];
		const { container } = render(Tabs, {
			items: allDisabled,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		// All panels hidden
		panels.forEach((p) => expect(p.hasAttribute('hidden')).toBe(true));
		// All triggers tabindex=-1
		triggers.forEach((t) => expect(t.getAttribute('tabindex')).toBe('-1'));
		// No errors = no throw
		expect(panels.length).toBe(2);
	});

	it('Tab key reaches the single active trigger from outside, then enters the panel', async () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

		// Focus the active trigger via a real click (claims iframe focus for
		// the CDP Tab keypress; clicking the active trigger is selection-neutral)
		await userEvent.click(triggers[0]);
		expect(document.activeElement).toBe(triggers[0]);

		// Tab into the panel
		await userEvent.keyboard('{Tab}');
		expect(document.activeElement).toBe(panels[0]);
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
	it('arrow key on a run of disabled triggers skips to the next non-disabled (wraps if needed)', () => {
		// [A, disabled, disabled, B] — from A, ArrowRight should skip 2 disabled and land on B
		const items = [
			itemA,
			{ id: 'x', label: 'X', disabled: true },
			{ id: 'y', label: 'Y', disabled: true },
			itemB
		];
		const { container } = render(Tabs, {
			items,
			ariaLabel: 'Test tabs',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		triggers[0].focus();
		fireKey(triggers[0], 'ArrowRight');
		expect(document.activeElement).toBe(triggers[3]);
	});

	it('rest-spread attempt on data-orientation is overridden by managed value', () => {
		const { container } = render(Tabs, {
			items: [],
			ariaLabel: 'Test tabs',
			panel: panelSnippet,
			'data-orientation': 'hacked'
		} as Record<string, unknown>);
		const root = container.querySelector('.hz-tabs') as HTMLElement;
		// Should be 'horizontal' (the default), not 'hacked'
		expect(root.getAttribute('data-orientation')).toBe('horizontal');
	});

	it('activation="manual" arrow then no Enter: active tab/panel unchanged', async () => {
		const { container } = render(Tabs, {
			items: threeItems,
			ariaLabel: 'Test tabs',
			activation: 'manual',
			panel: panelSnippet
		});
		const triggers = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
		const panels = Array.from(container.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

		triggers[0].focus();
		fireKey(triggers[0], 'ArrowRight'); // focus moves to B, no activation
		await tick();

		// Panel A is still active
		expect(panels[0].getAttribute('data-state')).toBe('active');
		expect(panels[0].hasAttribute('hidden')).toBe(false);
		expect(panels[1].hasAttribute('hidden')).toBe(true);
		expect(triggers[0].getAttribute('aria-selected')).toBe('true');
	});
});
