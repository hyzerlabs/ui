/**
 * @hyzer-labs/ui — shared positioning core, JS measure-and-place fallback
 * (specs/50-tooltip-popover.md, R-POS-4). Runs only when CSS anchor
 * positioning (R-POS-3) is unsupported. Internal — see placement.ts.
 */
import type { PopoverAlign, PopoverSide } from '$lib/types';
import { resize } from '../observers/resize.js';
import { resolveLogicalDirection } from './placement.js';

export interface PlaceOptions {
	side: PopoverSide;
	align: PopoverAlign;
	/** Gap from the trigger in px. */
	offset: number;
	/** Viewport clamp padding for the shift step (px). Default `8`. */
	padding?: number;
}

export interface PlaceResult {
	/** The side actually used — flipped from `opts.side` when it lacked room. */
	side: PopoverSide;
	align: PopoverAlign;
}

const OPPOSITE: Record<PopoverSide, PopoverSide> = {
	top: 'bottom',
	bottom: 'top',
	left: 'right',
	right: 'left'
};

/**
 * Measures `trigger`/`floating` with `getBoundingClientRect`, flips to the
 * opposite side when the preferred side lacks room, shifts along the cross
 * axis to stay within a small viewport padding, and applies `position:
 * fixed` + `top`/`left` directly onto `floating`. Returns the resolved
 * `{ side, align }` (data-attribute / consumer-caret styling reads this back).
 * R-POS-6: `opts.side`/`opts.align` are logical (`left`/`right` are inline-
 * start/inline-end) — resolved through the trigger's `direction` before any
 * of the fit/flip/shift math below, so everything past that point (and the
 * returned result) is physical. SSR-safe: no-ops (returns the unresolved
 * input) without `window`.
 */
export function place(trigger: Element, floating: HTMLElement, opts: PlaceOptions): PlaceResult {
	if (typeof window === 'undefined') return { side: opts.side, align: opts.align };

	const padding = opts.padding ?? 8;
	const requested = resolveLogicalDirection(trigger, opts.side, opts.align);
	const triggerRect = trigger.getBoundingClientRect();
	const floatingRect = floating.getBoundingClientRect();
	const vw = window.innerWidth;
	const vh = window.innerHeight;

	const fits = (side: PopoverSide): boolean => {
		switch (side) {
			case 'top':
				return triggerRect.top - floatingRect.height - opts.offset >= 0;
			case 'bottom':
				return triggerRect.bottom + floatingRect.height + opts.offset <= vh;
			case 'left':
				return triggerRect.left - floatingRect.width - opts.offset >= 0;
			case 'right':
				return triggerRect.right + floatingRect.width + opts.offset <= vw;
		}
	};

	// Flip — choose the opposite side only when the preferred side lacks room
	// AND the opposite side has more of it.
	let side = requested.side;
	if (!fits(side) && fits(OPPOSITE[side])) {
		side = OPPOSITE[side];
	}

	let top = 0;
	let left = 0;

	switch (side) {
		case 'top':
			top = triggerRect.top - floatingRect.height - opts.offset;
			break;
		case 'bottom':
			top = triggerRect.bottom + opts.offset;
			break;
		case 'left':
			left = triggerRect.left - floatingRect.width - opts.offset;
			break;
		case 'right':
			left = triggerRect.right + opts.offset;
			break;
	}

	if (side === 'top' || side === 'bottom') {
		if (requested.align === 'start') left = triggerRect.left;
		else if (requested.align === 'end') left = triggerRect.right - floatingRect.width;
		else left = triggerRect.left + triggerRect.width / 2 - floatingRect.width / 2;

		// Shift — clamp the cross axis within a small viewport padding.
		const max = Math.max(padding, vw - floatingRect.width - padding);
		left = Math.min(Math.max(left, padding), max);
	} else {
		if (requested.align === 'start') top = triggerRect.top;
		else if (requested.align === 'end') top = triggerRect.bottom - floatingRect.height;
		else top = triggerRect.top + triggerRect.height / 2 - floatingRect.height / 2;

		const max = Math.max(padding, vh - floatingRect.height - padding);
		top = Math.min(Math.max(top, padding), max);
	}

	floating.style.position = 'fixed';
	floating.style.margin = '0';
	// A `[popover]` element's UA default is `inset: 0` — reset every side to
	// `auto` first (an inline author declaration beats that same-priority UA
	// rule) so only the two sides this function sets below are constrained;
	// otherwise the untouched sides silently win and the box collapses to
	// the viewport's top-left corner (the anchor.ts precedent/fix).
	floating.style.inset = 'auto';
	floating.style.top = `${top}px`;
	floating.style.left = `${left}px`;

	return { side, align: requested.align };
}

/**
 * Wires the JS fallback's reposition-on-scroll/resize (R-POS-4): places once
 * immediately, then re-places on the floating element's own resize (`resize`
 * from `@hyzer-labs/ui/observers`) and on any ancestor scroll (a
 * capture-phase passive listener, so scroll containers are caught, not just
 * the window). Event-driven only — no `requestAnimationFrame` loop. Returns
 * a teardown that drops every listener. SSR-safe no-op without `document`.
 */
export function trackPosition(
	trigger: Element,
	floating: HTMLElement,
	opts: PlaceOptions
): () => void {
	if (typeof document === 'undefined') return () => {};

	const reposition = () => {
		place(trigger, floating, opts);
	};

	reposition();

	const stopResize = resize(reposition)(floating);
	document.addEventListener('scroll', reposition, { passive: true, capture: true });

	return () => {
		stopResize();
		document.removeEventListener('scroll', reposition, { capture: true });
	};
}
