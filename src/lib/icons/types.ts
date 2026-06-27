/**
 * Shared props interface for all @hyzer-labs/ui icon components.
 *
 * UI icons bind `strokeWidth` to `stroke-width`; brand (fill-based) icons accept it
 * for interface compatibility but ignore it — no `stroke-width` attribute is rendered.
 */
import type { SVGAttributes } from 'svelte/elements';

export interface IconProps extends SVGAttributes<SVGSVGElement> {
	/** Icon size in px (applied to both width and height). Default: 24. */
	size?: number;
	/**
	 * Stroke weight applied to UI icons. Accepted on brand icons for a consistent
	 * interface but has no visual effect on fill-based rendering. Default: 2.
	 */
	strokeWidth?: number;
	/** CSS class(es) appended after the base `hz-icon` class. */
	class?: string;
	/** Accessible label. When absent or empty the icon is decorative (`aria-hidden="true"`). */
	ariaLabel?: string;
}
