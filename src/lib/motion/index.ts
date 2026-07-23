/**
 * @hyzer-labs/ui/motion (specs/39-motion.md).
 *
 * House defaults on top of Svelte's own motion primitives
 * (`svelte/transition`, `svelte/motion`, WAAPI): the `--hz-duration-*` /
 * `--hz-ease-*` tokens as one timing vocabulary across CSS, transitions,
 * and script animation — every helper reduced-motion-aware by default.
 *
 * Zero runtime dependencies. Every export is SSR-safe: importable
 * server-side, and no `window`/`document` access happens at module scope
 * (only inside function bodies, which either guard `typeof document`
 * themselves — `reveal`/`revealGroup`/`viewTransition` — or, for the
 * transitions, are only ever called by Svelte client-side in the first
 * place).
 */

// Motion-R2 — token mirrors (durations, CSS + JS easing forms).
export { durations, easingCss, easeStandard, easeIn, easeOut } from './tokens.js';

// The JS easing evaluator + CSS-string parser backing the mirrors above —
// exported too, since it's a small, dependency-free, reusable primitive in
// its own right (e.g. driving a `Tween` off a custom cubic-bezier).
export { cubicBezier, parseCubicBezier } from './bezier.js';

// Motion-R3 — token-bridged svelte/transition wrappers.
export { fade, fly, slide, scale } from './transitions.js';
export type {
	FadeParams,
	FlyParams,
	SlideParams,
	ScaleParams,
	MotionEssential
} from './transitions.js';

// Motion-R4 — scroll-reveal attachments.
export { reveal, revealGroup } from './reveal.js';
export type { RevealOptions, RevealGroupOptions } from './reveal.js';

// Motion-R5 — view-transition helper.
export { viewTransition } from './viewTransition.js';
export type { ViewTransitionOptions, ViewTransitionResult } from './viewTransition.js';
