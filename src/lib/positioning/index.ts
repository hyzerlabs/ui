/**
 * @hyzer-labs/ui — shared positioning core (specs/50-tooltip-popover.md,
 * R-POS). Internal only: owns placement math and top-layer wiring for
 * `tooltip` and `Popover`. Not a public export, not a `./positioning`
 * subpath — nothing outside `src/lib/attachments/tooltip.ts` and
 * `src/lib/components/Popover.svelte` imports this module.
 *
 * Zero runtime dependencies. Every entry is SSR-safe: no `window`/
 * `document`/`CSS` access at module scope, only lazily inside function
 * bodies (R-POS-6, the `reveal.ts`/`observers/factory.ts` precedent).
 */
import type { PopoverAlign, PopoverSide } from '$lib/types';
import { applyAnchorPosition, supportsAnchorPositioning } from './anchor.js';
import { trackPosition } from './place.js';
import { resolveLogicalDirection } from './placement.js';

export { parsePlacement, resolveLogicalDirection } from './placement.js';
export { place } from './place.js';
export { supportsAnchorPositioning } from './anchor.js';

/**
 * Whether the native Popover API (`showPopover`/`hidePopover`) is available
 * on this platform. Lazily probed — never at module scope (R-POS-6).
 */
export function supportsPopoverApi(): boolean {
	return (
		typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.showPopover === 'function'
	);
}

export interface PositionOptions {
	side: PopoverSide;
	align: PopoverAlign;
	/** Gap from the trigger in px. */
	offset: number;
}

export interface PositionResult {
	/** Teardown — drops every listener/style this call set up. */
	stop: () => void;
	/** The side actually rendered on, measured from real layout — may differ
	 *  from `opts.side` after a flip (R-POS-3's native `position-try-
	 *  fallbacks` on the anchor path, or R-POS-4's `place()` flip on the JS
	 *  path). This is the value the data-side attribute (and any
	 *  consumer-drawn caret keyed off it) reflects. */
	side: PopoverSide;
	align: PopoverAlign;
}

const SIDE_EPSILON = 1;

/**
 * Infers which side the floating element actually ended up on by comparing
 * real, post-layout rects — the single resolver both positioning paths
 * share, so a caller never has to know whether R-POS-3 (native flip) or
 * R-POS-4 (JS flip) is active. `getBoundingClientRect()` forces a
 * synchronous layout, so this reads the FINAL resolved position even on the
 * anchor path, where the flip itself is entirely native/CSS-driven with no
 * JS callback to observe it. Falls back to the requested side on a tie/
 * unresolvable geometry (e.g. immediately post-mount, zero-sized boxes).
 */
function resolveSideFromGeometry(
	triggerRect: DOMRect,
	floatingRect: DOMRect,
	requested: PopoverSide
): PopoverSide {
	if (floatingRect.bottom <= triggerRect.top + SIDE_EPSILON) return 'top';
	if (floatingRect.top >= triggerRect.bottom - SIDE_EPSILON) return 'bottom';
	if (floatingRect.right <= triggerRect.left + SIDE_EPSILON) return 'left';
	if (floatingRect.left >= triggerRect.right - SIDE_EPSILON) return 'right';
	return requested;
}

/**
 * Positions `floating` relative to `trigger`: CSS anchor positioning when
 * supported (R-POS-3), else the JS measure-and-place fallback with
 * scroll/resize tracking (R-POS-4). Returns a teardown plus the RESOLVED
 * (post-flip) `{ side, align }`, measured from real layout after
 * positioning settles — the data-side/data-align attributes (R-THEME-2/
 * R-THEME-3) reflect this, not the caller's originally-requested side, so a
 * consumer-drawn caret can key off them. SSR-safe no-op
 * without `document`.
 */
export function position(
	trigger: Element,
	floating: HTMLElement,
	opts: PositionOptions
): PositionResult {
	if (typeof document === 'undefined') {
		return { stop: () => {}, side: opts.side, align: opts.align };
	}

	// R-POS-6: resolved once, physical — both the geometry fallback below and
	// the returned `align` must reflect the trigger's `direction`, not the
	// caller's original (possibly logical `left`/`right`) request. `place()`/
	// `applyAnchorPosition()` each independently re-resolve the same way from
	// `opts` (so they stay correct in isolation too); resolving it a second
	// time here is cheap and keeps this function's own fallback/return
	// values consistent with whichever path actually ran.
	const requested = resolveLogicalDirection(trigger, opts.side, opts.align);

	const stop = supportsAnchorPositioning()
		? applyAnchorPosition(trigger, floating, opts)
		: trackPosition(trigger, floating, opts);

	const side = resolveSideFromGeometry(
		trigger.getBoundingClientRect(),
		floating.getBoundingClientRect(),
		requested.side
	);
	return { stop, side, align: requested.align };
}
