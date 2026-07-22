/**
 * Shared props interface for every @hyzer-labs/ui icon component — hand or
 * generated (specs/36 R2). All icons are generated Lucide (ISC) glyphs;
 * every one is stroke-based.
 */
import type { SVGAttributes } from 'svelte/elements';

export interface IconProps extends SVGAttributes<SVGSVGElement> {
	/** Icon size in px (applied to both width and height). Default: 24. */
	size?: number;
	/** Stroke weight. Default: 2. */
	strokeWidth?: number;
	/** CSS class(es) appended after the base `hz-icon` class. */
	class?: string;
	/** Accessible label. When absent or empty the icon is decorative (`aria-hidden="true"`). */
	ariaLabel?: string;
}
