import { userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet, tick } from 'svelte';
import type { TriggerAttrs } from '$lib/types';

/**
 * specs/50 R-PO — behavior needs a real DOM (native Popover API, real focus/
 * click) so this runs in the browser ('client') Vitest project. `svelte/
 * motion` is substituted with a small, fully-controllable object — the
 * `reveal.svelte.spec.ts` precedent.
 */
const motionState = { current: false };
vi.mock('svelte/motion', () => ({
	prefersReducedMotion: motionState
}));

const { default: Popover } = await import('./Popover.svelte');

// ---------------------------------------------------------------------------
// Snippet helpers
// ---------------------------------------------------------------------------

const simpleChildren = createRawSnippet(() => ({
	render: () => `<p data-testid="panel-content">Panel content</p>`
}));

const interactiveChildren = createRawSnippet(() => ({
	render: () =>
		`<div><button type="button" data-testid="first-control">First</button><button type="button" data-testid="last-control">Last</button></div>`
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRoot(container: Element): HTMLElement {
	return container.querySelector('.hz-popover') as HTMLElement;
}

function getTrigger(container: Element): HTMLElement {
	return container.querySelector('.hz-popover-trigger') as HTMLElement;
}

function getPanel(container: Element): HTMLElement {
	return container.querySelector('.hz-popover-panel') as HTMLElement;
}

function isShown(panel: HTMLElement): boolean {
	if (typeof panel.showPopover === 'function') return panel.matches(':popover-open');
	return panel.hasAttribute('data-open');
}

/** Wait a couple of turns for the reconcile effect + native toggle event to settle. */
async function settle(): Promise<void> {
	await tick();
	await new Promise((r) => setTimeout(r, 0));
	await tick();
}

afterEach(() => {
	motionState.current = false;
	document.querySelectorAll('[data-popover-spec-outside]').forEach((el) => el.remove());
});

// ---------------------------------------------------------------------------
// R-PO-1 — public API / structure
// ---------------------------------------------------------------------------

describe('Popover-R-PO-1 — structure & default trigger', () => {
	it('renders .hz-popover root wrapping a .hz-popover-trigger Button and a .hz-popover-panel', () => {
		const { container } = render(Popover, {
			triggerLabel: 'Open',
			children: simpleChildren
		});
		expect(getRoot(container)).not.toBeNull();
		const trigger = getTrigger(container);
		expect(trigger.classList.contains('hz-button')).toBe(true);
		expect(trigger.textContent?.trim()).toBe('Open');
		expect(getPanel(container)).not.toBeNull();
	});

	it('trigger carries aria-expanded="false", aria-controls, and popovertarget wired to the panel id', () => {
		const { container } = render(Popover, { triggerLabel: 'Open', children: simpleChildren });
		const trigger = getTrigger(container);
		const panel = getPanel(container);
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
		expect(trigger.getAttribute('popovertarget')).toBe(panel.id);
	});

	it('a `trigger` snippet escape hatch wins over triggerLabel and receives the attrs bag', () => {
		const customTrigger = createRawSnippet<[TriggerAttrs]>((getAttrs) => ({
			render: () => {
				const a = getAttrs();
				return `<a href="#" data-testid="custom-trigger" id="${a.id}" popovertarget="${a.popovertarget}">Account</a>`;
			}
		}));
		const { container } = render(Popover, {
			triggerLabel: 'Ignored',
			trigger: customTrigger,
			children: simpleChildren
		});
		expect(container.querySelector('[data-testid="custom-trigger"]')).not.toBeNull();
		expect(getTrigger(container)).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R-PO-1b — dev warning for an unlabeled default trigger
// ---------------------------------------------------------------------------

describe('Popover-R-PO-1b — dev warning for an unlabeled default trigger', () => {
	it('warns when the default trigger has no triggerLabel, no triggerProps.ariaLabel, and no trigger snippet', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(Popover, { children: simpleChildren });
		const calls = warnSpy.mock.calls.filter(
			(c) => typeof c[0] === 'string' && c[0].includes('no accessible name')
		);
		expect(calls.length).toBeGreaterThan(0);
		warnSpy.mockRestore();
	});

	it('does not warn when triggerLabel is present', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(Popover, { triggerLabel: 'Open', children: simpleChildren });
		const calls = warnSpy.mock.calls.filter(
			(c) => typeof c[0] === 'string' && c[0].includes('no accessible name')
		);
		expect(calls.length).toBe(0);
		warnSpy.mockRestore();
	});

	it('does not warn when triggerProps.ariaLabel is present (icon-only, named via ariaLabel)', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { container } = render(Popover, {
			triggerProps: { ariaLabel: 'Open filters' },
			children: simpleChildren
		});
		const calls = warnSpy.mock.calls.filter(
			(c) => typeof c[0] === 'string' && c[0].includes('no accessible name')
		);
		expect(calls.length).toBe(0);
		expect(getTrigger(container).getAttribute('aria-label')).toBe('Open filters');
		warnSpy.mockRestore();
	});

	it('does not warn when a `trigger` snippet is provided (consumer owns naming their own element)', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const customTrigger = createRawSnippet<[TriggerAttrs]>((getAttrs) => ({
			render: () => {
				const a = getAttrs();
				return `<a href="#" id="${a.id}" popovertarget="${a.popovertarget}">Account</a>`;
			}
		}));
		render(Popover, { trigger: customTrigger, children: simpleChildren });
		const calls = warnSpy.mock.calls.filter(
			(c) => typeof c[0] === 'string' && c[0].includes('no accessible name')
		);
		expect(calls.length).toBe(0);
		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// R-PO-3 — open/close mechanics
// ---------------------------------------------------------------------------

describe('Popover-R-PO-3 — open/close mechanics', () => {
	it('bind:open reconciles to showPopover()/hidePopover(); clicking the trigger toggles open', async () => {
		const { container } = render(Popover, { triggerLabel: 'Open', children: simpleChildren });
		const trigger = getTrigger(container);
		const panel = getPanel(container);
		expect(isShown(panel)).toBe(false);

		await userEvent.click(trigger);
		await settle();
		expect(isShown(panel)).toBe(true);
		expect(trigger.getAttribute('aria-expanded')).toBe('true');

		await userEvent.click(trigger);
		await settle();
		expect(isShown(panel)).toBe(false);
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
	});

	it('open: true at mount shows the panel once panelEl binds (no throw pre-mount)', async () => {
		const { container } = render(Popover, {
			open: true,
			triggerLabel: 'Open',
			children: simpleChildren
		});
		await settle();
		expect(isShown(getPanel(container))).toBe(true);
	});

	it('onopen/onclose fire exactly once per transition', async () => {
		const onopen = vi.fn();
		const onclose = vi.fn();
		const { container } = render(Popover, {
			triggerLabel: 'Open',
			onopen,
			onclose,
			children: simpleChildren
		});
		const trigger = getTrigger(container);

		await userEvent.click(trigger);
		await settle();
		expect(onopen).toHaveBeenCalledOnce();
		expect(onclose).not.toHaveBeenCalled();

		await userEvent.click(trigger);
		await settle();
		expect(onclose).toHaveBeenCalledOnce();
	});
});

// ---------------------------------------------------------------------------
// R-PO-4/R-PO-5 — Escape + light-dismiss + focus return
// ---------------------------------------------------------------------------

describe('Popover-R-PO-4/R-PO-5 — Escape, light-dismiss, focus return', () => {
	it('Escape closes the panel and returns focus to the trigger', async () => {
		const { container } = render(Popover, { triggerLabel: 'Open', children: simpleChildren });
		const trigger = getTrigger(container);
		await userEvent.click(trigger);
		await settle();
		expect(isShown(getPanel(container))).toBe(true);

		await userEvent.keyboard('{Escape}');
		await settle();
		expect(isShown(getPanel(container))).toBe(false);
		expect(document.activeElement).toBe(trigger);
	});

	it('Escape closes even with dismissible: false (no opt-out)', async () => {
		const { container } = render(Popover, {
			triggerLabel: 'Open',
			dismissible: false,
			children: simpleChildren
		});
		const trigger = getTrigger(container);
		await userEvent.click(trigger);
		await settle();
		expect(isShown(getPanel(container))).toBe(true);

		await userEvent.keyboard('{Escape}');
		await settle();
		expect(isShown(getPanel(container))).toBe(false);
	});

	it('an outside pointerdown light-dismisses the panel (bind:open syncs to the platform-driven dismiss)', async () => {
		const { container } = render(Popover, { triggerLabel: 'Open', children: simpleChildren });
		const trigger = getTrigger(container);
		await userEvent.click(trigger);
		await settle();
		expect(isShown(getPanel(container))).toBe(true);

		// Positioned well clear of the panel — the native light-dismiss
		// algorithm hit-tests real coordinates, so the target must be
		// genuinely outside the panel's box, not just DOM-outside it.
		const outside = document.createElement('button');
		outside.setAttribute('data-popover-spec-outside', '');
		outside.textContent = 'outside';
		Object.assign(outside.style, {
			position: 'fixed',
			bottom: '4px',
			right: '4px'
		});
		document.body.appendChild(outside);
		await userEvent.click(outside);
		await settle();

		expect(isShown(getPanel(container))).toBe(false);
		// The trigger's own aria-expanded is template-bound to the `open`
		// prop — its flip to "false" is the observable proof that `open`
		// itself was synced back by the platform-driven dismiss, not just
		// the DOM's popover-open state.
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
	});
});

// ---------------------------------------------------------------------------
// R-PO-2 — non-modal: no aria-modal, no backdrop, no focus trap
// ---------------------------------------------------------------------------

describe('Popover-R-PO-2 — non-modal disclosure', () => {
	it('the panel carries no aria-modal attribute', () => {
		const { container } = render(Popover, { triggerLabel: 'Open', children: simpleChildren });
		expect(getPanel(container).hasAttribute('aria-modal')).toBe(false);
	});

	it('no backdrop element is rendered', () => {
		const { container } = render(Popover, { triggerLabel: 'Open', children: simpleChildren });
		expect(container.querySelector('[class*="backdrop"]')).toBeNull();
	});

	it('Tab from the last focusable panel control leaves the panel (no focus trap)', async () => {
		const { container } = render(Popover, {
			triggerLabel: 'Open',
			children: interactiveChildren
		});
		const trigger = getTrigger(container);
		await userEvent.click(trigger);
		await settle();

		const last = container.querySelector('[data-testid="last-control"]') as HTMLElement;
		last.focus();
		expect(document.activeElement).toBe(last);

		await userEvent.tab();
		expect(document.activeElement).not.toBe(last);
		expect(getPanel(container).contains(document.activeElement)).toBe(false);
	});

	it('panel content stays interactive (no trap, an interior control is clickable)', async () => {
		const clicked = vi.fn();
		const { container } = render(Popover, {
			triggerLabel: 'Open',
			children: interactiveChildren
		});
		const trigger = getTrigger(container);
		await userEvent.click(trigger);
		await settle();
		const first = container.querySelector('[data-testid="first-control"]') as HTMLElement;
		first.addEventListener('click', clicked);
		await userEvent.click(first);
		expect(clicked).toHaveBeenCalledOnce();
	});
});

// ---------------------------------------------------------------------------
// R-PO-6 — reduced motion
// ---------------------------------------------------------------------------

describe('Popover-R-PO-6 — reduced motion', () => {
	it('applies no entrance animation under reduced motion; open/close correctness is unaffected', async () => {
		motionState.current = true;
		const { container } = render(Popover, { triggerLabel: 'Open', children: simpleChildren });
		const trigger = getTrigger(container);
		await userEvent.click(trigger);
		await settle();

		const panel = getPanel(container);
		expect(isShown(panel)).toBe(true);
		expect(panel.style.animationName).toBe('none');
	});
});

// ---------------------------------------------------------------------------
// R-PO-4 — forced no-Popover-API fallback
// ---------------------------------------------------------------------------

describe('Popover-R-PO-4 — no-Popover-API fallback', () => {
	let originalShow: unknown;
	let originalHide: unknown;

	beforeEach(() => {
		originalShow = HTMLElement.prototype.showPopover;
		originalHide = HTMLElement.prototype.hidePopover;
		// @ts-expect-error — simulate an older browser without the Popover API.
		delete HTMLElement.prototype.showPopover;
		// @ts-expect-error — simulate an older browser without the Popover API.
		delete HTMLElement.prototype.hidePopover;
	});

	afterEach(() => {
		HTMLElement.prototype.showPopover = originalShow as typeof HTMLElement.prototype.showPopover;
		HTMLElement.prototype.hidePopover = originalHide as typeof HTMLElement.prototype.hidePopover;
	});

	it('the trigger click still opens the panel via the fallback data-open attribute', async () => {
		const { container } = render(Popover, { triggerLabel: 'Open', children: simpleChildren });
		const trigger = getTrigger(container);
		await userEvent.click(trigger);
		await settle();
		expect(isShown(getPanel(container))).toBe(true);
	});

	it('the document pointerdown backstop light-dismisses the panel', async () => {
		const { container } = render(Popover, { triggerLabel: 'Open', children: simpleChildren });
		const trigger = getTrigger(container);
		await userEvent.click(trigger);
		await settle();
		expect(isShown(getPanel(container))).toBe(true);

		// This exercises our own onDocumentPointerDown listener directly (any
		// pointerdown outside the root, real or synthetic) rather than the
		// platform's native light-dismiss hit-testing — the fallback path has
		// no native mechanism to hit-test against.
		const outside = document.createElement('button');
		outside.setAttribute('data-popover-spec-outside', '');
		document.body.appendChild(outside);
		outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		await settle();
		expect(isShown(getPanel(container))).toBe(false);
	});

	it('Escape still closes the panel', async () => {
		const { container } = render(Popover, { triggerLabel: 'Open', children: simpleChildren });
		const trigger = getTrigger(container);
		await userEvent.click(trigger);
		await settle();
		expect(isShown(getPanel(container))).toBe(true);

		await userEvent.keyboard('{Escape}');
		await settle();
		expect(isShown(getPanel(container))).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Barrel export
// ---------------------------------------------------------------------------

describe('Popover-R-PO — barrel export', () => {
	it('Popover is resolvable from $lib', async () => {
		const { Popover: PopoverComp } = await import('$lib');
		expect(PopoverComp).toBeDefined();
	});
});
