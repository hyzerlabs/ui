/**
 * @hyzer-labs/ui — shared positioning core (specs/50-tooltip-popover.md,
 * R-POS; specs/51-dropdown-positioning.md, R-DD). Internal only: owns
 * placement math and top-layer wiring for `tooltip`, `Popover`, and
 * `Dropdown`. Not a public export, not a `./positioning` subpath — nothing
 * outside `src/lib/attachments/tooltip.ts`, `src/lib/components/
 * Popover.svelte`, and `src/lib/components/Dropdown.svelte` imports this
 * module.
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

	const anchorPath = supportsAnchorPositioning();
	const stopPath = anchorPath
		? applyAnchorPosition(trigger, floating, opts)
		: trackPosition(trigger, floating, opts);

	/** Does the REQUESTED side currently have room for the floating box? */
	const requestedSideFits = (tRect: DOMRect, fRect: DOMRect): boolean => {
		switch (requested.side) {
			case 'top':
				return tRect.top - fRect.height - opts.offset >= 0;
			case 'bottom':
				return tRect.bottom + fRect.height + opts.offset <= window.innerHeight;
			case 'left':
				return tRect.left - fRect.width - opts.offset >= 0;
			case 'right':
				return tRect.right + fRect.width + opts.offset <= window.innerWidth;
		}
	};

	// Live re-resolution while shown (user-directed 2026-07-28). Two jobs:
	// (1) EAGER PREFERENCE RESTORE, anchor path only — native
	//     `position-try-fallbacks` remembers the last successful option and
	//     only re-runs selection once that option overflows AGAIN, so a
	//     flipped element stays flipped even after the requested side has
	//     room; the memory even survives removing and re-adding the property
	//     (verified in Chromium). So the property's PRESENCE is managed
	//     instead: while flipped and the requested side fits again, drop the
	//     fallbacks (the base position applies — correct by definition); the
	//     moment the base side lacks room, re-add them (native flip
	//     engages). Writes happen only at those transitions. (The JS path
	//     already recomputes preference-first on every scroll.)
	// (2) LIVE data-side — both paths can flip mid-open (scroll/resize), and
	//     a consumer caret keyed off data-side must track the flip, so the
	//     attribute is re-stamped from real geometry, not left at its
	//     open-time value.
	//
	// TIMING: mid-scroll, an anchor-positioned top-layer box's rect lags the
	// trigger's rect by a frame (the anchor scroll snapshot updates at frame
	// boundaries), so measuring inside the scroll event compares divergent
	// rects and mis-reads the side (verified in Chromium: a tooltip
	// physically above its trigger measured as "below" mid-gesture). So:
	// scroll/resize only SCHEDULE work; the measurement runs in an animation
	// frame and only ACTS when the rects are gap-consistent — the floating
	// box sitting exactly `offset` from the trigger on some side. Divergent
	// frames retry next frame (bounded), so the state always settles once
	// the gesture does. Property mutations stamp deterministically instead
	// of re-measuring (their outcome is known by construction).
	const OPPOSITE: Record<PopoverSide, PopoverSide> = {
		top: 'bottom',
		bottom: 'top',
		left: 'right',
		right: 'left'
	};
	const GAP_EPSILON = 2;
	const fallbackValue = anchorPath ? floating.style.getPropertyValue('position-try-fallbacks') : '';
	const stamp = (side: PopoverSide): void => {
		floating.setAttribute('data-side', side);
	};
	/** The side the box is ACTUALLY sitting on — null when the rects are
	 *  mid-scroll divergent (no side shows the expected `offset` gap). */
	const renderedSide = (tRect: DOMRect, fRect: DOMRect): PopoverSide | null => {
		if (Math.abs(tRect.top - fRect.bottom - opts.offset) <= GAP_EPSILON) return 'top';
		if (Math.abs(fRect.top - tRect.bottom - opts.offset) <= GAP_EPSILON) return 'bottom';
		if (Math.abs(tRect.left - fRect.right - opts.offset) <= GAP_EPSILON) return 'left';
		if (Math.abs(fRect.left - tRect.right - opts.offset) <= GAP_EPSILON) return 'right';
		return null;
	};

	let rafId: number | null = null;
	let retries = 0;
	const settle = (): void => {
		rafId = null;
		const tRect = trigger.getBoundingClientRect();
		const fRect = floating.getBoundingClientRect();
		const rendered = renderedSide(tRect, fRect);
		if (rendered === null) {
			// Divergent frame — keep the last stamp, try again shortly.
			if (retries++ < 8) rafId = requestAnimationFrame(settle);
			return;
		}
		if (anchorPath && fallbackValue) {
			const fits = requestedSideFits(tRect, fRect);
			const armed = floating.style.getPropertyValue('position-try-fallbacks') !== '';
			if (rendered !== requested.side && fits) {
				// Flipped but the requested side has room again — dropping the
				// fallbacks makes the base position apply.
				floating.style.removeProperty('position-try-fallbacks');
				stamp(requested.side);
				return;
			}
			if (rendered === requested.side && !fits && !armed) {
				// Disarmed earlier, and the base side just ran out of room —
				// re-arm so the native flip engages (it flips: base doesn't fit).
				floating.style.setProperty('position-try-fallbacks', fallbackValue);
				stamp(OPPOSITE[requested.side]);
				return;
			}
		}
		stamp(rendered);
	};
	const schedule = (): void => {
		retries = 0;
		if (rafId === null) rafId = requestAnimationFrame(settle);
	};

	document.addEventListener('scroll', schedule, { passive: true, capture: true });
	window.addEventListener('resize', schedule, { passive: true });

	const stop = () => {
		if (rafId !== null) cancelAnimationFrame(rafId);
		rafId = null;
		document.removeEventListener('scroll', schedule, { capture: true });
		window.removeEventListener('resize', schedule);
		stopPath();
	};

	const side = resolveSideFromGeometry(
		trigger.getBoundingClientRect(),
		floating.getBoundingClientRect(),
		requested.side
	);
	return { stop, side, align: requested.align };
}
