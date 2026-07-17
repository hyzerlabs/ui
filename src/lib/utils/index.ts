/**
 * @hyzer-labs/ui utility functions.
 */
import type { NavChild, NavHeading } from '../types/index.js';

// WCAG contrast math — check palette overrides against your contrast bar.
export * from './contrast.js';

/**
 * Narrow a Nav `children` entry to the group-label subtype.
 *
 * @example
 * children.filter((c) => !isNavHeading(c)) // → only the real links
 */
export function isNavHeading(child: NavChild): child is NavHeading {
	return typeof (child as NavHeading).heading === 'string';
}

/**
 * Compose CSS class names, filtering out all falsy values.
 *
 * @example
 * cx('hz-button', isActive && 'is-active', undefined) // → 'hz-button is-active'
 */
export function cx(...classes: (string | undefined | null | false)[]): string {
	return classes.filter(Boolean).join(' ');
}

let _counter = 0;

/**
 * Generate a unique, stable ID string with an optional prefix.
 * Counter-based so it is deterministic in tests and safe in SSR.
 *
 * @example
 * uid('hz') // → 'hz-1', 'hz-2', …
 */
export function uid(prefix = 'hz'): string {
	return `${prefix}-${++_counter}`;
}
