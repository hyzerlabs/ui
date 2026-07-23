/**
 * Shared props interface for every @hyzer-labs/ui icon component — hand or
 * generated (specs/36 R2). All icons are generated Lucide (ISC) glyphs;
 * every one is stroke-based.
 */
import type { SVGAttributes } from 'svelte/elements';
import type { Intent } from '$lib/types';

export interface IconProps extends SVGAttributes<SVGSVGElement> {
	/** Icon size in px (applied to both width and height). Default: 24. */
	size?: number;
	/** Stroke weight. Default: 2. */
	strokeWidth?: number;
	/**
	 * Colors the glyph from the intent vocabulary: sets `color:
	 * var(--hz-intent-<intent>)` (the stroke is `currentColor`) and stamps
	 * `data-intent` for theme targeting. Without it the icon inherits the
	 * surrounding text color. Amendment 2026-07-22 (specs/36, audit R9).
	 */
	intent?: Intent;
	/** CSS class(es) appended after the base `hz-icon` class. */
	class?: string;
	/** Accessible label. When absent or empty the icon is decorative (`aria-hidden="true"`). */
	ariaLabel?: string;
}
