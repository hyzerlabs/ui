/**
 * @hyzer-labs/ui — shared positioning core, CSS anchor positioning
 *. The preferred path — no JS runs
 * beyond stamping the two custom idents and the static inset/fallback
 * declarations below. Internal — see placement.ts.
 */
import type { PopoverAlign, PopoverSide } from '$lib/types';
import { resolveLogicalDirection } from './placement.js';

let _uidCounter = 0;

/**
 * Lazily probes CSS anchor positioning support — never at module scope
 *. SSR-safe: `typeof CSS` is always a safe check, even when `CSS`
 * was never declared.
 */
export function supportsAnchorPositioning(): boolean {
	return (
		typeof CSS !== 'undefined' &&
		typeof CSS.supports === 'function' &&
		CSS.supports('anchor-name: --hz-anchor-probe')
	);
}

export interface AnchorPositionOptions {
	side: PopoverSide;
	align: PopoverAlign;
	/** Gap from the trigger in px. */
	offset: number;
}

/**
 * Stamps a unique `anchor-name` on `trigger` and `position-anchor` on
 * `floating`, then sets the inset properties for `side`/`align` via the
 * `anchor()` function — center alignment uses the anchor-positioning
 * `anchor-center` self-alignment keyword instead of a manual translate
 * (works on an out-of-flow, `position: fixed` box tied to an anchor,
 * independent of the parent's display). `position-try-fallbacks` requests
 * the platform's built-in flip tactic for the placement's axis — no
 * per-instance `@position-try` rule needed. Returns a teardown that clears
 * every property this function set. SSR-safe no-op without `document`.
 *
 * `opts.side`/`opts.align` are logical — resolved through the
 * TRIGGER's `direction` (via `resolveLogicalDirection`, the `place.ts`
 * precedent) into physical `top`/`bottom`/`left`/`right` values before any
 * `anchor(...)` calls are stamped. This is a physical (not a CSS logical-
 * property) resolution deliberately: the tooltip's floating node is
 * body-appended, so ITS OWN inherited `direction` can differ
 * from the trigger's actual position in the document — logical properties
 * on the floating element would resolve against the wrong context. Reading
 * the trigger's `direction` directly is correct regardless of where the
 * floating element lives.
 */
export function applyAnchorPosition(
	trigger: Element,
	floating: HTMLElement,
	opts: AnchorPositionOptions
): () => void {
	if (typeof document === 'undefined') return () => {};

	const { side, align } = resolveLogicalDirection(trigger, opts.side, opts.align);
	const name = `--hz-anchor-${++_uidCounter}`;
	const triggerEl = trigger as HTMLElement;

	triggerEl.style.setProperty('anchor-name', name);
	floating.style.setProperty('position-anchor', name);
	floating.style.position = 'fixed';
	floating.style.margin = '0';

	// The native `[popover]` UA stylesheet defaults an unstyled popover to
	// `inset: 0; margin: auto` (its built-in auto-centering). `margin: 0`
	// above cancels the centering, but `inset: 0` is still a same-priority
	// UA rule on every side — left unset, it silently wins on whichever
	// side(s) this function doesn't explicitly assign below, collapsing the
	// box to the viewport's top-left corner. Reset every side to `auto`
	// first (an inline author declaration, so it DOES beat the UA default)
	// so only the sides this function sets below are ever constrained.
	floating.style.inset = 'auto';
	floating.style.removeProperty('justify-self');
	floating.style.removeProperty('align-self');

	const gap = `${opts.offset}px`;

	switch (side) {
		case 'top':
			floating.style.setProperty('bottom', `calc(anchor(top) + ${gap})`);
			floating.style.setProperty('position-try-fallbacks', 'flip-block');
			break;
		case 'bottom':
			floating.style.setProperty('top', `calc(anchor(bottom) + ${gap})`);
			floating.style.setProperty('position-try-fallbacks', 'flip-block');
			break;
		case 'left':
			floating.style.setProperty('right', `calc(anchor(left) + ${gap})`);
			floating.style.setProperty('position-try-fallbacks', 'flip-inline');
			break;
		case 'right':
			floating.style.setProperty('left', `calc(anchor(right) + ${gap})`);
			floating.style.setProperty('position-try-fallbacks', 'flip-inline');
			break;
	}

	if (side === 'top' || side === 'bottom') {
		if (align === 'start') floating.style.setProperty('left', 'anchor(left)');
		else if (align === 'end') floating.style.setProperty('right', 'anchor(right)');
		else floating.style.setProperty('justify-self', 'anchor-center');
	} else {
		if (align === 'start') floating.style.setProperty('top', 'anchor(top)');
		else if (align === 'end') floating.style.setProperty('bottom', 'anchor(bottom)');
		else floating.style.setProperty('align-self', 'anchor-center');
	}

	return () => {
		// Freeze the rendered coordinates BEFORE tearing the anchor down.
		// Consumers run theme exit fades after stop() (display/overlay
		// allow-discrete transitions keep the box visible briefly), and
		// removing every side would let the UA `[popover] { inset: 0 }`
		// default (with the inline `margin: 0` above) pin the still-visible
		// box to the viewport's top-left corner mid-fade. A hidden box
		// measures 0×0 and pins offscreen-invisible, which is fine; the next
		// show re-runs this function, which resets `inset` before anchoring.
		const rect = floating.getBoundingClientRect();
		triggerEl.style.removeProperty('anchor-name');
		floating.style.removeProperty('position-anchor');
		floating.style.removeProperty('position-try-fallbacks');
		floating.style.removeProperty('justify-self');
		floating.style.removeProperty('align-self');
		// `auto`, not removeProperty: the UA inset: 0 must not win the far
		// sides (under RTL an over-constrained box keeps `right`, not `left`).
		floating.style.bottom = 'auto';
		floating.style.right = 'auto';
		floating.style.top = `${rect.top}px`;
		floating.style.left = `${rect.left}px`;
	};
}
