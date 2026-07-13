import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import type { Snippet } from 'svelte';
import Accordion from './Accordion.svelte';

// ---------------------------------------------------------------------------
// Types (mirrors component-local AccordionItem)
// ---------------------------------------------------------------------------

interface AccordionItem {
	id: string;
	title: string | Snippet;
	disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Sample items
// ---------------------------------------------------------------------------

const itemA: AccordionItem = { id: 'a', title: 'Item A' };
const itemB: AccordionItem = { id: 'b', title: 'Item B' };
const itemC: AccordionItem = { id: 'c', title: 'Item C' };
const disabledItem: AccordionItem = { id: 'd', title: 'Disabled Item', disabled: true };

const threeItems = [itemA, itemB, itemC];

// ---------------------------------------------------------------------------
// Snippet helpers
// ---------------------------------------------------------------------------

/** Panel snippet that renders item.id into a data-testid span. */
const panelSnippet = createRawSnippet<[AccordionItem]>((getItem) => ({
	render: () => `<div data-testid="panel-${getItem().id}">Content for ${getItem().title}</div>`
}));

/** Custom icon snippet. */
const iconSnippet = createRawSnippet(() => ({
	render: () => `<span data-testid="custom-icon">▶</span>`
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wait one event-loop turn for Svelte to flush DOM updates. */
function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

/** Fire a KeyboardEvent on an element. */
function fireKey(
	el: EventTarget,
	key: string,
	extra: EventInit & { shiftKey?: boolean } = {}
): void {
	el.dispatchEvent(
		new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra })
	);
}

// ---------------------------------------------------------------------------
// Accordion-R1/R2 — Root + Item structure
// ---------------------------------------------------------------------------

describe('Accordion-R1/R2 — root and item structure', () => {
	it('renders <div class="hz-accordion"> by default', () => {
		const { container } = render(Accordion, { items: threeItems, panel: panelSnippet });
		const root = container.querySelector('div.hz-accordion') as HTMLElement;
		expect(root).not.toBeNull();
	});

	it('root carries data-type="single" by default', () => {
		const { container } = render(Accordion, { items: threeItems, panel: panelSnippet });
		const root = container.querySelector('.hz-accordion') as HTMLElement;
		expect(root.getAttribute('data-type')).toBe('single');
	});

	it('data-type="multiple" is reflected when type="multiple"', () => {
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'multiple',
			panel: panelSnippet
		});
		const root = container.querySelector('.hz-accordion') as HTMLElement;
		expect(root.getAttribute('data-type')).toBe('multiple');
	});

	it('renders one <details.hz-accordion-item> per item in array order', () => {
		const { container } = render(Accordion, { items: threeItems, panel: panelSnippet });
		const detailsEls = container.querySelectorAll('details.hz-accordion-item');
		expect(detailsEls.length).toBe(3);
	});

	it('each <details> contains a <summary.hz-accordion-trigger>', () => {
		const { container } = render(Accordion, { items: threeItems, panel: panelSnippet });
		const summaries = container.querySelectorAll(
			'details.hz-accordion-item summary.hz-accordion-trigger'
		);
		expect(summaries.length).toBe(3);
	});

	it('each <details> contains a <div.hz-accordion-panel>', () => {
		const { container } = render(Accordion, { items: threeItems, panel: panelSnippet });
		const panels = container.querySelectorAll('details.hz-accordion-item div.hz-accordion-panel');
		expect(panels.length).toBe(3);
	});

	it('items=[] renders root div with no <details> children', () => {
		const { container } = render(Accordion, { items: [], panel: panelSnippet });
		const root = container.querySelector('.hz-accordion') as HTMLElement;
		expect(root).not.toBeNull();
		const details = root.querySelectorAll('details');
		expect(details.length).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// Accordion-R3 — Heading
// ---------------------------------------------------------------------------

describe('Accordion-R3 — heading element', () => {
	it.each([2, 3, 4, 5, 6] as const)('headingLevel=%i renders h%i inside the summary', (level) => {
		const { container } = render(Accordion, {
			items: [itemA],
			headingLevel: level,
			panel: panelSnippet
		});
		const heading = container.querySelector(
			`summary.hz-accordion-trigger h${level}.hz-accordion-heading`
		) as HTMLElement;
		expect(heading).not.toBeNull();
	});

	it('default headingLevel=3 renders h3', () => {
		const { container } = render(Accordion, { items: [itemA], panel: panelSnippet });
		const h3 = container.querySelector('h3.hz-accordion-heading') as HTMLElement;
		expect(h3).not.toBeNull();
	});

	it('heading text is item.title (string form)', () => {
		const { container } = render(Accordion, { items: [itemA], panel: panelSnippet });
		const h3 = container.querySelector('h3.hz-accordion-heading') as HTMLElement;
		expect(h3.textContent?.trim()).toBe('Item A');
	});

	it('title as a Snippet renders its markup inside the heading', () => {
		const richTitle = createRawSnippet(() => ({
			render: () => `<span data-testid="rich-title">Rich <em>title</em></span>`
		}));
		const { container } = render(Accordion, {
			items: [{ id: 'r', title: richTitle }],
			panel: panelSnippet
		});
		const heading = container.querySelector('.hz-accordion-heading') as HTMLElement;
		expect(heading.querySelector('[data-testid="rich-title"]')).not.toBeNull();
		expect(heading.querySelector('em')).not.toBeNull();
	});

	it('icon span is a sibling of the heading, not a child', () => {
		const { container } = render(Accordion, { items: [itemA], panel: panelSnippet });
		const summary = container.querySelector('summary.hz-accordion-trigger') as HTMLElement;
		const heading = summary.querySelector('h3.hz-accordion-heading') as HTMLElement;
		const icon = summary.querySelector('span.hz-accordion-icon') as HTMLElement;
		// Both must be direct children of summary, not nested
		expect(heading.parentElement).toBe(summary);
		expect(icon.parentElement).toBe(summary);
	});
});

// ---------------------------------------------------------------------------
// Accordion-R4 — Panel snippet
// ---------------------------------------------------------------------------

describe('Accordion-R4 — panel snippet', () => {
	it('panel snippet is invoked with the item and renders inside hz-accordion-panel', () => {
		const { container } = render(Accordion, { items: threeItems, panel: panelSnippet });
		const panelA = container.querySelector(
			'div.hz-accordion-panel [data-testid="panel-a"]'
		) as HTMLElement;
		const panelB = container.querySelector(
			'div.hz-accordion-panel [data-testid="panel-b"]'
		) as HTMLElement;
		const panelC = container.querySelector(
			'div.hz-accordion-panel [data-testid="panel-c"]'
		) as HTMLElement;
		expect(panelA).not.toBeNull();
		expect(panelB).not.toBeNull();
		expect(panelC).not.toBeNull();
	});

	it('panel content is placed inside the correct item (branching by id)', () => {
		const { container } = render(Accordion, { items: [itemA, itemB], panel: panelSnippet });
		const allDetails = container.querySelectorAll('details.hz-accordion-item');
		// First details → panel-a, second → panel-b
		expect(allDetails[0].querySelector('[data-testid="panel-a"]')).not.toBeNull();
		expect(allDetails[1].querySelector('[data-testid="panel-b"]')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Accordion-R5 — Icon
// ---------------------------------------------------------------------------

describe('Accordion-R5 — icon', () => {
	it('default: renders IconChevronDown (svg) inside .hz-accordion-icon', () => {
		const { container } = render(Accordion, { items: [itemA], panel: panelSnippet });
		const iconSpan = container.querySelector('span.hz-accordion-icon') as HTMLElement;
		expect(iconSpan.querySelector('svg')).not.toBeNull();
	});

	it('default icon is aria-hidden (decorative)', () => {
		const { container } = render(Accordion, { items: [itemA], panel: panelSnippet });
		const iconSpan = container.querySelector('span.hz-accordion-icon') as HTMLElement;
		expect(iconSpan.getAttribute('aria-hidden')).toBe('true');
	});

	it('icon span itself carries aria-hidden="true"', () => {
		const { container } = render(Accordion, { items: [itemA], panel: panelSnippet });
		const iconSpan = container.querySelector('span.hz-accordion-icon') as HTMLElement;
		expect(iconSpan.getAttribute('aria-hidden')).toBe('true');
	});

	it('custom icon snippet replaces the default chevron', () => {
		const { container } = render(Accordion, {
			items: [itemA],
			panel: panelSnippet,
			icon: iconSnippet
		});
		const iconSpan = container.querySelector('span.hz-accordion-icon') as HTMLElement;
		expect(iconSpan.querySelector('[data-testid="custom-icon"]')).not.toBeNull();
		expect(iconSpan.querySelector('svg')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Accordion-R6 — Single-expand grouping via name attribute
// ---------------------------------------------------------------------------

describe('Accordion-R6 — name attribute grouping', () => {
	it('type="single": all <details> share the same name attribute', () => {
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'single',
			panel: panelSnippet
		});
		const details = Array.from(container.querySelectorAll('details'));
		const names = details.map((el) => el.getAttribute('name'));
		// All names are identical and non-null
		expect(names[0]).not.toBeNull();
		expect(names[0]).toBe(names[1]);
		expect(names[1]).toBe(names[2]);
	});

	it('type="multiple": no <details> has a name attribute', () => {
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'multiple',
			panel: panelSnippet
		});
		const details = Array.from(container.querySelectorAll('details'));
		details.forEach((el) => {
			expect(el.hasAttribute('name')).toBe(false);
		});
	});
});

// ---------------------------------------------------------------------------
// Accordion-R7 — data-state synchronization
// ---------------------------------------------------------------------------

describe('Accordion-R7 — data-state synchronization', () => {
	it('all items start with data-state="closed" when no defaultOpen is set', () => {
		const { container } = render(Accordion, { items: threeItems, panel: panelSnippet });
		const details = Array.from(container.querySelectorAll('details'));
		details.forEach((el) => {
			expect(el.getAttribute('data-state')).toBe('closed');
		});
	});

	it('clicking a summary flips data-state to "open"', async () => {
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'multiple',
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll<HTMLElement>('summary.hz-accordion-trigger');
		summaries[0].click();
		await tick();
		const details = container.querySelectorAll('details');
		expect(details[0].getAttribute('data-state')).toBe('open');
	});

	it('clicking an open summary in multiple mode flips data-state to "closed"', async () => {
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'multiple',
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll<HTMLElement>('summary.hz-accordion-trigger');
		summaries[0].click();
		await tick();
		summaries[0].click();
		await tick();
		const details = container.querySelectorAll('details');
		expect(details[0].getAttribute('data-state')).toBe('closed');
	});
});

// ---------------------------------------------------------------------------
// Accordion-R8 — defaultOpen
// ---------------------------------------------------------------------------

describe('Accordion-R8 — defaultOpen', () => {
	it('defaultOpen as string: matching item renders with open + data-state="open"', () => {
		const { container } = render(Accordion, {
			items: threeItems,
			defaultOpen: 'b',
			panel: panelSnippet
		});
		const details = container.querySelectorAll('details');
		expect(details[0].hasAttribute('open')).toBe(false);
		expect(details[0].getAttribute('data-state')).toBe('closed');
		expect(details[1].hasAttribute('open')).toBe(true);
		expect(details[1].getAttribute('data-state')).toBe('open');
	});

	it('defaultOpen as string[]: multiple mode opens all matching ids', () => {
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'multiple',
			defaultOpen: ['a', 'c'],
			panel: panelSnippet
		});
		const details = container.querySelectorAll('details');
		expect(details[0].hasAttribute('open')).toBe(true);
		expect(details[1].hasAttribute('open')).toBe(false);
		expect(details[2].hasAttribute('open')).toBe(true);
	});

	it('defaultOpen as string[] with type="single": only the first matching id opens', () => {
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'single',
			defaultOpen: ['b', 'c'],
			panel: panelSnippet
		});
		const details = container.querySelectorAll('details');
		// 'b' matches first → only item B opens
		expect(details[0].hasAttribute('open')).toBe(false);
		expect(details[1].hasAttribute('open')).toBe(true);
		expect(details[2].hasAttribute('open')).toBe(false);
	});

	it('defaultOpen id not in items: silently ignored, no item opens', () => {
		const { container } = render(Accordion, {
			items: threeItems,
			defaultOpen: 'z',
			panel: panelSnippet
		});
		const details = container.querySelectorAll('details');
		details.forEach((el) => expect(el.hasAttribute('open')).toBe(false));
	});

	it('disabled item in defaultOpen renders open but cannot be toggled', async () => {
		const { container } = render(Accordion, {
			items: [itemA, disabledItem],
			type: 'multiple',
			defaultOpen: ['d'],
			panel: panelSnippet
		});
		const details = container.querySelectorAll('details');
		// Disabled item is open initially
		expect(details[1].hasAttribute('open')).toBe(true);
		expect(details[1].getAttribute('data-state')).toBe('open');
		// Clicking the disabled summary does not close it
		const disabledSummary = details[1].querySelector('summary') as HTMLElement;
		disabledSummary.click();
		await tick();
		expect(details[1].getAttribute('data-state')).toBe('open');
	});
});

// ---------------------------------------------------------------------------
// Accordion-R9 — Single-expand JS fallback
// ---------------------------------------------------------------------------

describe('Accordion-R9 — single-expand JS fallback', () => {
	it('type="single": opening item B closes already-open item A', async () => {
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'single',
			defaultOpen: 'a',
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll<HTMLElement>('summary.hz-accordion-trigger');
		const details = container.querySelectorAll('details');
		// Item A starts open
		expect(details[0].getAttribute('data-state')).toBe('open');
		// Open item B
		summaries[1].click();
		await tick();
		// Item A should now be closed
		expect(details[0].getAttribute('data-state')).toBe('closed');
		expect(details[1].getAttribute('data-state')).toBe('open');
	});

	it('type="single": opening item C closes item B', async () => {
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'single',
			defaultOpen: 'b',
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll<HTMLElement>('summary.hz-accordion-trigger');
		const details = container.querySelectorAll('details');
		summaries[2].click();
		await tick();
		expect(details[1].getAttribute('data-state')).toBe('closed');
		expect(details[2].getAttribute('data-state')).toBe('open');
	});
});

// ---------------------------------------------------------------------------
// Accordion-R10 — Non-collapsible
// ---------------------------------------------------------------------------

describe('Accordion-R10 — non-collapsible', () => {
	it('collapsible=false + type="single": clicking the open item keeps it open', async () => {
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'single',
			collapsible: false,
			defaultOpen: 'a',
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll<HTMLElement>('summary.hz-accordion-trigger');
		const details = container.querySelectorAll('details');
		// Click the open item
		summaries[0].click();
		await tick();
		// Should remain open
		expect(details[0].getAttribute('data-state')).toBe('open');
	});

	it('collapsible=false + type="single": opening another item switches the open one', async () => {
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'single',
			collapsible: false,
			defaultOpen: 'a',
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll<HTMLElement>('summary.hz-accordion-trigger');
		const details = container.querySelectorAll('details');
		summaries[1].click();
		await tick();
		expect(details[0].getAttribute('data-state')).toBe('closed');
		expect(details[1].getAttribute('data-state')).toBe('open');
	});

	it('collapsible=false + type="multiple": every item can still be closed independently', async () => {
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'multiple',
			collapsible: false,
			defaultOpen: ['a', 'b'],
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll<HTMLElement>('summary.hz-accordion-trigger');
		const details = container.querySelectorAll('details');
		// Click open item A to close it
		summaries[0].click();
		await tick();
		expect(details[0].getAttribute('data-state')).toBe('closed');
	});
});

// ---------------------------------------------------------------------------
// Accordion-R11 — Disabled items
// ---------------------------------------------------------------------------

describe('Accordion-R11 — disabled items', () => {
	it('disabled item: <details> carries data-disabled attribute', () => {
		const { container } = render(Accordion, {
			items: [itemA, disabledItem],
			panel: panelSnippet
		});
		const details = container.querySelectorAll('details');
		expect(details[1].hasAttribute('data-disabled')).toBe(true);
	});

	it('disabled item: <summary> carries aria-disabled="true"', () => {
		const { container } = render(Accordion, {
			items: [itemA, disabledItem],
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll('summary');
		expect(summaries[1].getAttribute('aria-disabled')).toBe('true');
	});

	it('non-disabled item: no data-disabled, no aria-disabled', () => {
		const { container } = render(Accordion, {
			items: [itemA, disabledItem],
			panel: panelSnippet
		});
		const details = container.querySelectorAll('details');
		const summaries = container.querySelectorAll('summary');
		expect(details[0].hasAttribute('data-disabled')).toBe(false);
		expect(summaries[0].hasAttribute('aria-disabled')).toBe(false);
	});

	it('click on disabled summary does not toggle the item', async () => {
		const { container } = render(Accordion, {
			items: [itemA, disabledItem],
			type: 'multiple',
			panel: panelSnippet
		});
		const details = container.querySelectorAll('details');
		const summaries = container.querySelectorAll<HTMLElement>('summary');
		summaries[1].click();
		await tick();
		expect(details[1].getAttribute('data-state')).toBe('closed');
	});

	it('Enter on disabled summary does not toggle', async () => {
		const { container } = render(Accordion, {
			items: [itemA, disabledItem],
			type: 'multiple',
			panel: panelSnippet
		});
		const details = container.querySelectorAll('details');
		const summaries = container.querySelectorAll<HTMLElement>('summary');
		fireKey(summaries[1], 'Enter');
		await tick();
		expect(details[1].getAttribute('data-state')).toBe('closed');
	});

	it('Space on disabled summary does not toggle', async () => {
		const { container } = render(Accordion, {
			items: [itemA, disabledItem],
			type: 'multiple',
			panel: panelSnippet
		});
		const details = container.querySelectorAll('details');
		const summaries = container.querySelectorAll<HTMLElement>('summary');
		fireKey(summaries[1], ' ');
		await tick();
		expect(details[1].getAttribute('data-state')).toBe('closed');
	});

	it('disabled summary remains focusable (no tabindex=-1)', () => {
		const { container } = render(Accordion, {
			items: [itemA, disabledItem],
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll('summary');
		// tabIndex should not be -1 (still focusable)
		expect(summaries[1].getAttribute('tabindex')).not.toBe('-1');
	});

	it('onToggle is NOT called when a disabled item is clicked', async () => {
		const spy = vi.fn();
		const { container } = render(Accordion, {
			items: [itemA, disabledItem],
			type: 'multiple',
			onToggle: spy,
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll<HTMLElement>('summary');
		summaries[1].click();
		await tick();
		expect(spy).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// Accordion-R12 — onToggle callback
// ---------------------------------------------------------------------------

describe('Accordion-R12 — onToggle callback', () => {
	it('onToggle is NOT called on initial mount (no-fire for defaultOpen)', () => {
		const spy = vi.fn();
		render(Accordion, {
			items: threeItems,
			defaultOpen: 'a',
			onToggle: spy,
			panel: panelSnippet
		});
		expect(spy).not.toHaveBeenCalled();
	});

	it('onToggle fires with the open id array after a user toggle', async () => {
		const spy = vi.fn();
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'multiple',
			onToggle: spy,
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll<HTMLElement>('summary');
		summaries[0].click();
		await tick();
		expect(spy).toHaveBeenCalledOnce();
		expect(spy.mock.calls[0][0]).toEqual(['a']);
	});

	it('onToggle reports multiple open ids in DOM order (multiple mode)', async () => {
		const spy = vi.fn();
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'multiple',
			onToggle: spy,
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll<HTMLElement>('summary');
		summaries[0].click();
		await tick();
		summaries[2].click();
		await tick();
		// Last call should include both a and c
		const lastCall = spy.mock.calls[spy.mock.calls.length - 1][0] as string[];
		expect(lastCall).toContain('a');
		expect(lastCall).toContain('c');
		expect(lastCall).not.toContain('b');
	});

	it('onToggle reflects auto-close in single mode (only one id in array)', async () => {
		const spy = vi.fn();
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'single',
			defaultOpen: 'a',
			onToggle: spy,
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll<HTMLElement>('summary');
		// Open item B — should auto-close A
		summaries[1].click();
		await tick();
		// The callback for opening B should show only ['b']
		const callsForB = spy.mock.calls.find((call) => (call[0] as string[]).includes('b'));
		expect(callsForB).toBeDefined();
		expect(callsForB![0]).toEqual(['b']);
	});

	it('onToggle omitted: no callback invoked on any toggle', async () => {
		// No error should be thrown when onToggle is undefined
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'multiple',
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll<HTMLElement>('summary');
		summaries[0].click();
		await tick();
		// If we reach here without error, the test passes
		expect(true).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Accordion-R13 — Native Enter/Space activation
// ---------------------------------------------------------------------------

describe('Accordion-R13 — native Enter/Space activation', () => {
	/*
	 * Focus is established by CLICKING the summary, not element.focus():
	 * userEvent.keyboard sends real CDP keys to whichever iframe holds
	 * browser-level focus, and .focus() alone doesn't claim it — under
	 * parallel test-file iframes the keystroke could land in another file's
	 * frame (the old flake). The click both focuses the summary in this
	 * frame and natively opens it, so the keypress asserts the CLOSE half of
	 * the toggle — still exactly R13: the roving-focus keydown handler must
	 * not preventDefault native Enter/Space activation.
	 */
	it('Enter on a non-disabled summary toggles it', async () => {
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'multiple',
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll<HTMLElement>('summary');
		const details = container.querySelectorAll('details');
		await userEvent.click(summaries[0]);
		await tick();
		expect(details[0].hasAttribute('open')).toBe(true);
		expect(document.activeElement).toBe(summaries[0]);
		await userEvent.keyboard('{Enter}');
		await tick();
		expect(details[0].hasAttribute('open')).toBe(false);
	});

	it('Space on a non-disabled summary toggles it', async () => {
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'multiple',
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll<HTMLElement>('summary');
		const details = container.querySelectorAll('details');
		await userEvent.click(summaries[0]);
		await tick();
		expect(details[0].hasAttribute('open')).toBe(true);
		expect(document.activeElement).toBe(summaries[0]);
		await userEvent.keyboard(' ');
		await tick();
		expect(details[0].hasAttribute('open')).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Accordion-R14 — Roving arrow navigation
// ---------------------------------------------------------------------------

describe('Accordion-R14 — roving arrow navigation', () => {
	it('Arrow Down moves focus to the next summary', async () => {
		const { container } = render(Accordion, { items: threeItems, panel: panelSnippet });
		const summaries = Array.from(
			container.querySelectorAll<HTMLElement>('summary.hz-accordion-trigger')
		);
		summaries[0].focus();
		fireKey(summaries[0], 'ArrowDown');
		expect(document.activeElement).toBe(summaries[1]);
	});

	it('Arrow Up moves focus to the previous summary', () => {
		const { container } = render(Accordion, { items: threeItems, panel: panelSnippet });
		const summaries = Array.from(
			container.querySelectorAll<HTMLElement>('summary.hz-accordion-trigger')
		);
		summaries[1].focus();
		fireKey(summaries[1], 'ArrowUp');
		expect(document.activeElement).toBe(summaries[0]);
	});

	it('Arrow Down on the last summary clamps (stays put)', () => {
		const { container } = render(Accordion, { items: threeItems, panel: panelSnippet });
		const summaries = Array.from(
			container.querySelectorAll<HTMLElement>('summary.hz-accordion-trigger')
		);
		summaries[2].focus();
		fireKey(summaries[2], 'ArrowDown');
		expect(document.activeElement).toBe(summaries[2]);
	});

	it('Arrow Up on the first summary clamps (stays put)', () => {
		const { container } = render(Accordion, { items: threeItems, panel: panelSnippet });
		const summaries = Array.from(
			container.querySelectorAll<HTMLElement>('summary.hz-accordion-trigger')
		);
		summaries[0].focus();
		fireKey(summaries[0], 'ArrowUp');
		expect(document.activeElement).toBe(summaries[0]);
	});

	it('Home jumps to first summary', () => {
		const { container } = render(Accordion, { items: threeItems, panel: panelSnippet });
		const summaries = Array.from(
			container.querySelectorAll<HTMLElement>('summary.hz-accordion-trigger')
		);
		summaries[2].focus();
		fireKey(summaries[2], 'Home');
		expect(document.activeElement).toBe(summaries[0]);
	});

	it('End jumps to last summary', () => {
		const { container } = render(Accordion, { items: threeItems, panel: panelSnippet });
		const summaries = Array.from(
			container.querySelectorAll<HTMLElement>('summary.hz-accordion-trigger')
		);
		summaries[0].focus();
		fireKey(summaries[0], 'End');
		expect(document.activeElement).toBe(summaries[2]);
	});

	it('Arrow/Home/End call preventDefault (suppress native scroll)', () => {
		const { container } = render(Accordion, { items: threeItems, panel: panelSnippet });
		const summaries = Array.from(
			container.querySelectorAll<HTMLElement>('summary.hz-accordion-trigger')
		);
		summaries[0].focus();

		for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End']) {
			const event = new KeyboardEvent('keydown', {
				key,
				bubbles: true,
				cancelable: true
			});
			summaries[0].dispatchEvent(event);
			expect(event.defaultPrevented).toBe(true);
		}
	});

	it('disabled summaries remain focus stops (not skipped) for arrow navigation', () => {
		const { container } = render(Accordion, {
			items: [itemA, disabledItem, itemB],
			panel: panelSnippet
		});
		const summaries = Array.from(
			container.querySelectorAll<HTMLElement>('summary.hz-accordion-trigger')
		);
		// Arrow Down from item A should focus the disabled item, not skip to item B
		summaries[0].focus();
		fireKey(summaries[0], 'ArrowDown');
		expect(document.activeElement).toBe(summaries[1]);
	});
});

// ---------------------------------------------------------------------------
// Accordion-R15 — Class composition
// ---------------------------------------------------------------------------

describe('Accordion-R15 — class composition', () => {
	it('no class prop → rendered class is exactly "hz-accordion"', () => {
		const { container } = render(Accordion, { items: [], panel: panelSnippet });
		const root = container.querySelector('.hz-accordion') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toEqual(['hz-accordion']);
	});

	it('class="foo bar" → hz-accordion is first, foo and bar are present', () => {
		const { container } = render(Accordion, {
			items: [],
			panel: panelSnippet,
			class: 'foo bar'
		});
		const root = container.querySelector('.hz-accordion') as HTMLElement;
		const classes = [...root.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-accordion');
		expect(classes).toContain('foo');
		expect(classes).toContain('bar');
	});
});

// ---------------------------------------------------------------------------
// Accordion-R16 — rest forwarding
// ---------------------------------------------------------------------------

describe('Accordion-R16 — rest forwarding', () => {
	it('arbitrary rest attr (data-testid) is forwarded to the root div', async () => {
		render(Accordion, {
			items: [],
			panel: panelSnippet,
			'data-testid': 'my-accordion'
		} as Record<string, unknown>);
		await expect.element(page.getByTestId('my-accordion')).toBeInTheDocument();
	});

	it('rest cannot overwrite managed class', () => {
		const { container } = render(Accordion, {
			items: [],
			panel: panelSnippet,
			class: 'consumer-class'
		} as Record<string, unknown>);
		const root = container.querySelector('.hz-accordion') as HTMLElement;
		expect(root.classList.contains('hz-accordion')).toBe(true);
	});

	it('rest cannot overwrite managed data-type', () => {
		const { container } = render(Accordion, {
			items: [],
			panel: panelSnippet,
			type: 'single',
			'data-type': 'override'
		} as Record<string, unknown>);
		const root = container.querySelector('.hz-accordion') as HTMLElement;
		expect(root.getAttribute('data-type')).toBe('single');
	});
});

// ---------------------------------------------------------------------------
// Accordion-R17 — Dev warning for duplicate ids
// ---------------------------------------------------------------------------

describe('Accordion-R17 — dev warning for duplicate ids', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('duplicate item ids: emits exactly one console.warn', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const dupItems = [
			{ id: 'a', title: 'A' },
			{ id: 'a', title: 'A again' }
		];
		render(Accordion, { items: dupItems, panel: panelSnippet });
		expect(warnSpy).toHaveBeenCalledOnce();
		warnSpy.mockRestore();
	});

	it('unique item ids: no console.warn', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(Accordion, { items: threeItems, panel: panelSnippet });
		expect(warnSpy).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});

	it('unknown defaultOpen id: no console.warn (silently ignored)', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(Accordion, { items: threeItems, defaultOpen: 'unknown-id', panel: panelSnippet });
		expect(warnSpy).not.toHaveBeenCalled();
		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// Accordion-R18 — Barrel export
// ---------------------------------------------------------------------------

describe('Accordion-R18 — barrel export', () => {
	it('Accordion is resolvable from $lib', async () => {
		const { Accordion } = await import('$lib');
		expect(Accordion).toBeDefined();
	});

	it('Accordion smoke-renders from $lib import', async () => {
		const { Accordion } = await import('$lib');
		const { container } = render(Accordion, { items: [], panel: panelSnippet });
		expect(container.querySelector('div.hz-accordion')).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Accordion-R3 — Structural CSS: summary flex row
// ---------------------------------------------------------------------------

describe('Accordion structural CSS — summary flex row', () => {
	it('summary.hz-accordion-trigger has computed display: flex', () => {
		const { container } = render(Accordion, { items: [itemA], panel: panelSnippet });
		const summary = container.querySelector('summary.hz-accordion-trigger') as HTMLElement;
		expect(getComputedStyle(summary).display).toBe('flex');
	});

	it('summary has align-items: flex-start (icon anchors to top of row)', () => {
		const { container } = render(Accordion, { items: [itemA], panel: panelSnippet });
		const summary = container.querySelector('summary.hz-accordion-trigger') as HTMLElement;
		expect(getComputedStyle(summary).alignItems).toBe('flex-start');
	});
});

// ---------------------------------------------------------------------------
// Integration — Tab reaches each summary in DOM order
// ---------------------------------------------------------------------------

describe('Integration — keyboard flow', () => {
	it('in single mode, opening successive items leaves exactly one open', async () => {
		const spy = vi.fn();
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'single',
			onToggle: spy,
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll<HTMLElement>('summary');
		const details = container.querySelectorAll('details');

		summaries[0].click();
		await tick();
		summaries[1].click();
		await tick();
		summaries[2].click();
		await tick();

		// Only item C should be open
		expect(details[0].getAttribute('data-state')).toBe('closed');
		expect(details[1].getAttribute('data-state')).toBe('closed');
		expect(details[2].getAttribute('data-state')).toBe('open');
		// Last onToggle call reports a single id
		const lastIds = spy.mock.calls[spy.mock.calls.length - 1][0] as string[];
		expect(lastIds).toEqual(['c']);
	});

	it('in multiple mode, several items can be open and onToggle reports all open ids', async () => {
		const spy = vi.fn();
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'multiple',
			onToggle: spy,
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll<HTMLElement>('summary');
		const details = container.querySelectorAll('details');

		summaries[0].click();
		await tick();
		summaries[2].click();
		await tick();

		expect(details[0].getAttribute('data-state')).toBe('open');
		expect(details[1].getAttribute('data-state')).toBe('closed');
		expect(details[2].getAttribute('data-state')).toBe('open');

		const lastIds = spy.mock.calls[spy.mock.calls.length - 1][0] as string[];
		expect(lastIds).toContain('a');
		expect(lastIds).toContain('c');
		expect(lastIds).not.toContain('b');
	});

	it('arrow keys roam between summaries while Tab reaches them in DOM order', async () => {
		const { container } = render(Accordion, { items: threeItems, panel: panelSnippet });
		const summaries = Array.from(
			container.querySelectorAll<HTMLElement>('summary.hz-accordion-trigger')
		);

		// Start at first, arrow to second, then to third
		summaries[0].focus();
		fireKey(summaries[0], 'ArrowDown');
		expect(document.activeElement).toBe(summaries[1]);
		fireKey(summaries[1], 'ArrowDown');
		expect(document.activeElement).toBe(summaries[2]);
		// End key from third = clamp
		fireKey(summaries[2], 'ArrowDown');
		expect(document.activeElement).toBe(summaries[2]);
		// Home jumps back to first
		fireKey(summaries[2], 'Home');
		expect(document.activeElement).toBe(summaries[0]);
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
	it('defaultOpen is a bare string (not array)', () => {
		const { container } = render(Accordion, {
			items: threeItems,
			defaultOpen: 'c',
			panel: panelSnippet
		});
		const details = container.querySelectorAll('details');
		expect(details[2].hasAttribute('open')).toBe(true);
		expect(details[0].hasAttribute('open')).toBe(false);
		expect(details[1].hasAttribute('open')).toBe(false);
	});

	it('collapsible=false with type="multiple" has no effect on independent collapse', async () => {
		const { container } = render(Accordion, {
			items: threeItems,
			type: 'multiple',
			collapsible: false,
			panel: panelSnippet
		});
		const summaries = container.querySelectorAll<HTMLElement>('summary');
		const details = container.querySelectorAll('details');
		// Open A
		summaries[0].click();
		await tick();
		// Close A (should work in multiple mode regardless of collapsible)
		summaries[0].click();
		await tick();
		expect(details[0].getAttribute('data-state')).toBe('closed');
	});

	it('rest-spread attempt on data-type is overridden by managed value', () => {
		const { container } = render(Accordion, {
			items: [],
			panel: panelSnippet,
			'data-type': 'hacked'
		} as Record<string, unknown>);
		const root = container.querySelector('.hz-accordion') as HTMLElement;
		// data-type should be "single" (the default), not "hacked"
		expect(root.getAttribute('data-type')).toBe('single');
	});
});
