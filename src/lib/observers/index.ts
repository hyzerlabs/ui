/**
 * @hyzer-labs/ui/observers (specs/48-observers.md).
 *
 * Three reduced-motion-neutral, SSR-safe Svelte attachments over the
 * platform observer APIs — `intersect` (IntersectionObserver), `resize`
 * (ResizeObserver), `mutate` (MutationObserver) — plus `announce`, a
 * lazily-created `.sr-only` live-region helper that pairs naturally with an
 * observer callback.
 *
 * Zero runtime dependencies. Every export is SSR-safe: importable
 * server-side, and no `window`/`document`/observer global is touched at
 * module scope — only inside function bodies, each of which guards
 * `typeof document` (the `reveal`/`revealGroup` precedent, `./motion`).
 *
 * Motion-agnostic by design (R7): none of these read `prefersReducedMotion`.
 * The house reduced-motion story stays in `./motion`'s `reveal`/`revealGroup`
 * — for your own observer-driven motion, guard the side-effect yourself with
 * `prefersReducedMotion` from `svelte/motion` (see the docs page).
 */

// R2 — intersection attachment.
export { intersect } from './intersect.js';
export type { IntersectCallback, IntersectOptions } from './intersect.js';

// R3 — resize attachment.
export { resize } from './resize.js';
export type { ResizeCallback, ResizeOptions } from './resize.js';

// R4 — mutation attachment.
export { mutate } from './mutate.js';
export type { MutateCallback, MutateOptions } from './mutate.js';

// R6 — live-region announcement helper.
export { announce } from './announce.js';
