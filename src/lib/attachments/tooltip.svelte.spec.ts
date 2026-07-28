import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * specs/50 R-TT — behavior needs a real DOM (pointer/focus events, real
 * layout for positioning) so this runs in the browser ('client') Vitest
 * project. `svelte/motion` is substituted with a small, fully-controllable
 * object — the `reveal.svelte.spec.ts` precedent — so reduced-motion tests
 * don't depend on the real OS media query.
 */
const motionState = { current: false };
vi.mock('svelte/motion', () => ({
	prefersReducedMotion: motionState
}));

const { tooltip } = await import('./tooltip.js');

function makeTrigger(tag: 'button' | 'span' = 'button'): HTMLElement {
	const el = document.createElement(tag);
	el.setAttribute('data-tooltip-spec', '');
	el.textContent = 'trigger';
	document.body.appendChild(el);
	return el;
}

function activeTooltip(): HTMLElement | null {
	return document.querySelector('.hz-tooltip[data-state="open"]');
}

afterEach(() => {
	document.querySelectorAll('[data-tooltip-spec]').forEach((el) => el.remove());
	document.querySelectorAll('.hz-tooltip').forEach((el) => el.remove());
	motionState.current = false;
	vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// R-TT-1 — string overload
// ---------------------------------------------------------------------------

describe('tooltip() — string overload (R-TT-1)', () => {
	it('tooltip(text) is sugar for tooltip({ text })', () => {
		const trigger = makeTrigger();
		const cleanup = tooltip('Save changes')(trigger);
		const id = trigger.getAttribute('aria-describedby');
		expect(id).toBeTruthy();
		const node = document.getElementById(id as string);
		expect(node?.textContent).toBe('Save changes');
		cleanup();
	});
});

// ---------------------------------------------------------------------------
// R-TT-2 — attach/detach: role, aria-describedby, restore
// ---------------------------------------------------------------------------

describe('tooltip() — attach/detach (R-TT-2/R-TT-9)', () => {
	it('attach creates a role="tooltip" node and sets aria-describedby on the trigger', () => {
		const trigger = makeTrigger();
		const cleanup = tooltip('Hello')(trigger);
		const id = trigger.getAttribute('aria-describedby');
		expect(id).toBeTruthy();
		const node = document.getElementById(id as string);
		expect(node).not.toBeNull();
		expect(node?.getAttribute('role')).toBe('tooltip');
		cleanup();
	});

	it('appends to (does not overwrite) an existing aria-describedby, and restores it verbatim on teardown', () => {
		const trigger = makeTrigger();
		trigger.setAttribute('aria-describedby', 'existing-desc');
		const cleanup = tooltip('Hello')(trigger);
		const described = trigger.getAttribute('aria-describedby') as string;
		expect(described.startsWith('existing-desc ')).toBe(true);
		cleanup();
		expect(trigger.getAttribute('aria-describedby')).toBe('existing-desc');
	});

	it('detach with no prior aria-describedby removes the attribute entirely', () => {
		const trigger = makeTrigger();
		const cleanup = tooltip('Hello')(trigger);
		cleanup();
		expect(trigger.hasAttribute('aria-describedby')).toBe(false);
	});

	it('detach removes the created tooltip node from the document', () => {
		const trigger = makeTrigger();
		const cleanup = tooltip('Hello')(trigger);
		const id = trigger.getAttribute('aria-describedby') as string;
		expect(document.getElementById(id)).not.toBeNull();
		cleanup();
		expect(document.getElementById(id)).toBeNull();
	});

	it('detach clears pending timers — a scheduled show never fires after teardown', async () => {
		vi.useFakeTimers();
		const trigger = makeTrigger();
		const cleanup = tooltip('Hello')(trigger);
		trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
		cleanup();
		vi.advanceTimersByTime(1000);
		expect(activeTooltip()).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// R-TT-3 — hover-intent + focus parity
// ---------------------------------------------------------------------------

describe('tooltip() — hover-intent + focus parity (R-TT-3)', () => {
	it('shows on pointerenter only after openDelay elapses', () => {
		vi.useFakeTimers();
		const trigger = makeTrigger();
		const cleanup = tooltip({ text: 'Hi', openDelay: 400 })(trigger);

		trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
		expect(activeTooltip()).toBeNull();

		vi.advanceTimersByTime(399);
		expect(activeTooltip()).toBeNull();

		vi.advanceTimersByTime(1);
		expect(activeTooltip()).not.toBeNull();

		cleanup();
	});

	it('rapid hover in/out under openDelay never shows the tooltip', () => {
		vi.useFakeTimers();
		const trigger = makeTrigger();
		const cleanup = tooltip({ text: 'Hi', openDelay: 400 })(trigger);

		trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
		vi.advanceTimersByTime(200);
		trigger.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
		vi.advanceTimersByTime(1000);

		expect(activeTooltip()).toBeNull();
		cleanup();
	});

	it('shows immediately on focus — no delay', () => {
		vi.useFakeTimers();
		const trigger = makeTrigger();
		const cleanup = tooltip({ text: 'Hi', openDelay: 400 })(trigger);

		trigger.focus();
		expect(activeTooltip()).not.toBeNull();

		cleanup();
	});

	it('hides on blur', () => {
		vi.useFakeTimers();
		const trigger = makeTrigger();
		const cleanup = tooltip('Hi')(trigger);
		trigger.focus();
		expect(activeTooltip()).not.toBeNull();

		trigger.blur();
		expect(activeTooltip()).toBeNull();

		cleanup();
	});

	it('does not open on a touch/coarse pointer (R-TT-8)', () => {
		vi.useFakeTimers();
		const trigger = makeTrigger();
		const cleanup = tooltip({ text: 'Hi', openDelay: 400 })(trigger);

		trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }));
		vi.advanceTimersByTime(1000);
		expect(activeTooltip()).toBeNull();

		cleanup();
	});
});

// ---------------------------------------------------------------------------
// R-TT-4 — WCAG 2.2 SC 1.4.13 (Dismissible / Hoverable / Persistent)
// ---------------------------------------------------------------------------

describe('tooltip() — SC 1.4.13 (R-TT-4)', () => {
	it('Dismissible: Escape hides without moving focus, and suppresses re-show until the trigger is re-entered', () => {
		vi.useFakeTimers();
		const trigger = makeTrigger();
		const cleanup = tooltip('Hi')(trigger);
		trigger.focus();
		expect(activeTooltip()).not.toBeNull();
		expect(document.activeElement).toBe(trigger);

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		expect(activeTooltip()).toBeNull();
		expect(document.activeElement).toBe(trigger);

		// Still focused, no genuine leave/re-enter — stays suppressed. A real
		// re-focus while already focused fires no new 'focus' event, so
		// simulate the "still hovering/focused, dwelling" case via a direct
		// pointerenter dwell instead — it must not re-show either.
		trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
		vi.advanceTimersByTime(1000);
		expect(activeTooltip()).toBeNull();

		// A genuine leave (blur) clears the suppression; a fresh focus re-shows.
		trigger.blur();
		trigger.focus();
		expect(activeTooltip()).not.toBeNull();

		cleanup();
	});

	it('Hoverable: entering the tooltip node cancels the pending closeDelay hide', () => {
		vi.useFakeTimers();
		const trigger = makeTrigger();
		const cleanup = tooltip({ text: 'Hi', closeDelay: 150 })(trigger);
		trigger.focus();
		trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
		const node = activeTooltip();
		expect(node).not.toBeNull();

		// Pointer travels from the trigger onto the tooltip itself.
		trigger.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
		node?.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));

		vi.advanceTimersByTime(150);
		expect(activeTooltip()).not.toBeNull();

		// Leaving the tooltip too re-arms the hide.
		node?.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
		vi.advanceTimersByTime(150);
		expect(activeTooltip()).toBeNull();

		cleanup();
	});

	it('Persistent: no auto-hide timer fires while hovered', () => {
		vi.useFakeTimers();
		const trigger = makeTrigger();
		const cleanup = tooltip('Hi')(trigger);
		trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
		vi.advanceTimersByTime(400);
		expect(activeTooltip()).not.toBeNull();

		vi.advanceTimersByTime(60_000);
		expect(activeTooltip()).not.toBeNull();

		cleanup();
	});
});

// ---------------------------------------------------------------------------
// R-TT-6 — reduced motion
// ---------------------------------------------------------------------------

describe('tooltip() — reduced motion (R-TT-6)', () => {
	it('applies no entrance animation under reduced motion; delays are unaffected', () => {
		motionState.current = true;
		vi.useFakeTimers();
		const trigger = makeTrigger();
		const cleanup = tooltip({ text: 'Hi', openDelay: 400 })(trigger);

		trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
		vi.advanceTimersByTime(399);
		expect(activeTooltip()).toBeNull();
		vi.advanceTimersByTime(1);

		const node = activeTooltip();
		expect(node).not.toBeNull();
		expect(node?.style.animationName).toBe('none');

		cleanup();
	});

	it('without reduced motion, the entrance animation is not forced off', () => {
		motionState.current = false;
		const trigger = makeTrigger();
		const cleanup = tooltip('Hi')(trigger);
		trigger.focus();
		const node = activeTooltip();
		expect(node?.style.animationName).not.toBe('none');
		cleanup();
	});
});

// ---------------------------------------------------------------------------
// R-TT-7 — forced no-Popover-API fallback
// ---------------------------------------------------------------------------

describe('tooltip() — no-Popover-API fallback (R-TT-7)', () => {
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

	it('still shows/hides a positioned node and keeps ARIA when the Popover API is unavailable', () => {
		const trigger = makeTrigger();
		const cleanup = tooltip('Hi')(trigger);

		trigger.focus();
		const node = activeTooltip();
		expect(node).not.toBeNull();
		expect(node?.getAttribute('role')).toBe('tooltip');
		expect(node?.style.position).toBe('fixed');
		expect(trigger.getAttribute('aria-describedby')).toBe(node?.id);

		trigger.blur();
		expect(activeTooltip()).toBeNull();

		cleanup();
	});
});

// ---------------------------------------------------------------------------
// R-TT-3 — non-focusable trigger dev warning (edge case)
// ---------------------------------------------------------------------------

describe('tooltip() — dev warnings', () => {
	it('warns when the trigger is not natively focusable and has no tabindex', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const trigger = makeTrigger('span');
		const cleanup = tooltip('Hi')(trigger);
		const calls = warnSpy.mock.calls.filter(
			(c) => typeof c[0] === 'string' && c[0].includes('not natively focusable')
		);
		expect(calls.length).toBeGreaterThan(0);
		cleanup();
		warnSpy.mockRestore();
	});

	it('does not warn for a natively focusable trigger', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const trigger = makeTrigger('button');
		const cleanup = tooltip('Hi')(trigger);
		const calls = warnSpy.mock.calls.filter(
			(c) => typeof c[0] === 'string' && c[0].includes('not natively focusable')
		);
		expect(calls.length).toBe(0);
		cleanup();
		warnSpy.mockRestore();
	});
});

// ---------------------------------------------------------------------------
// SSR guard (defensive — the real coverage lives in the server project)
// ---------------------------------------------------------------------------

describe('tooltip() — teardown safety', () => {
	it('teardown drops all trigger/tooltip listeners (no leaked handlers)', () => {
		const trigger = makeTrigger();
		const cleanup = tooltip('Hi')(trigger);
		cleanup();

		// Post-teardown events are no-ops — no tooltip is (re)created.
		trigger.focus();
		expect(document.querySelector('.hz-tooltip')).toBeNull();
	});
});
