/**
 * @hyzer-labs/ui — motion token mirrors (specs/39-motion.md, Motion-R2).
 *
 * Everything here is *derived from* `$lib/tokens`'s `motion` metadata, never
 * hand-copied — `tokens.spec.ts` is a parity spec that fails the moment
 * this module and the token metadata disagree. No DOM/window access — safe
 * to import server-side.
 */
import { motion } from '../tokens/index.js';
import { cubicBezier, parseCubicBezier } from './bezier.js';

const MS_RE = /^(-?[\d.]+)ms$/;

/** Parses a `"<number>ms"` duration token string into a plain ms number. */
function parseMs(value: string): number {
	const match = MS_RE.exec(value.trim());
	if (!match) {
		throw new Error(`parseMs: expected a "<number>ms" duration token, got: ${value}`);
	}
	return Number(match[1]);
}

/** `--hz-duration-*`, as plain ms numbers — for `svelte/transition` params,
 * `Tween`/`Spring` config, and `Element.animate()` options. */
export const durations = {
	fast: parseMs(motion.duration.fast),
	base: parseMs(motion.duration.base),
	slow: parseMs(motion.duration.slow)
} as const;

/** `--hz-ease-*`, as the exact `cubic-bezier(…)` CSS strings — for WAAPI
 * (`Element.animate()`, `IntersectionObserver`-driven reveals) and inline
 * `style` timing functions. */
export const easingCss = {
	standard: motion.ease.standard,
	in: motion.ease.in,
	out: motion.ease.out
} as const;

/** `--hz-ease-*`, as JS `(t: number) => number` cubic-bezier evaluators —
 * for `svelte/transition` params (which take a function, not a CSS string)
 * and `svelte/motion`'s `Tween`/`Spring`. Each evaluator's control points
 * are parsed from the same `easingCss` string above, so the two forms can
 * never drift from one another or from the token. */
export const easeStandard = cubicBezier(...parseCubicBezier(easingCss.standard));
export const easeIn = cubicBezier(...parseCubicBezier(easingCss.in));
export const easeOut = cubicBezier(...parseCubicBezier(easingCss.out));
