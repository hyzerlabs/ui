/**
 * @hyzer-labs/ui — shared positioning core, placement vocabulary
 * (specs/50-tooltip-popover.md, R-POS-1). Internal — not exported from the
 * package (no `./positioning` subpath); only `tooltip.ts` and
 * `Popover.svelte` import it.
 */
import type { Placement, PopoverAlign, PopoverSide } from '$lib/types';

/**
 * Normalizes a `Placement` string into its side + alignment parts.
 * `'top'` == `'top-center'`; `-start`/`-end` add alignment (R-POS-1). The
 * single normalizer both primitives use — pure string parsing, safe to call
 * anywhere (including SSR/no-`document`).
 */
export function parsePlacement(placement: Placement): { side: PopoverSide; align: PopoverAlign } {
	const dash = placement.indexOf('-');
	if (dash === -1) {
		return { side: placement as PopoverSide, align: 'center' };
	}
	return {
		side: placement.slice(0, dash) as PopoverSide,
		align: placement.slice(dash + 1) as PopoverAlign
	};
}

/**
 * R-POS-6 — logical direction. `left`/`right` are treated as inline-start/
 * inline-end and resolve through the TRIGGER's resolved `direction` (not
 * the floating element's — the tooltip's node is body-appended, R-POS-2a,
 * so its own inherited direction can differ from the trigger's actual
 * position in the document): under `direction: rtl`, `left` renders on the
 * physical right and vice-versa. `-start`/`-end` alignment respects
 * `direction` too, but only when it's the CROSS axis (a `top`/`bottom`
 * placement's alignment is horizontal/inline; a `left`/`right` placement's
 * alignment is vertical/block, which `direction` never affects). SSR-safe:
 * no-op (returns the input unchanged) without `getComputedStyle`.
 */
export function resolveLogicalDirection(
	trigger: Element,
	side: PopoverSide,
	align: PopoverAlign
): { side: PopoverSide; align: PopoverAlign } {
	if (typeof getComputedStyle !== 'function') return { side, align };
	if (getComputedStyle(trigger).direction !== 'rtl') return { side, align };

	let resolvedSide = side;
	if (side === 'left') resolvedSide = 'right';
	else if (side === 'right') resolvedSide = 'left';

	let resolvedAlign = align;
	if (resolvedSide === 'top' || resolvedSide === 'bottom') {
		if (align === 'start') resolvedAlign = 'end';
		else if (align === 'end') resolvedAlign = 'start';
	}

	return { side: resolvedSide, align: resolvedAlign };
}
