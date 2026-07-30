/**
 * @hyzer-labs/ui — token-bridged transitions.
 *
 * Thin wrappers around `svelte/transition`'s `fade`/`fly`/`slide`/`scale`:
 * same params, same semantics, same return shape (`TransitionConfig`) — the
 * only difference is the house defaults (`--hz-duration-*` / `--hz-ease-*`)
 * and the reduced-motion collapse below. Drop-in for the originals: change
 * the import, keep everything else.
 *
 * Default easing — decided once, here: `fly` and `scale` displace the
 * element in space (translate / grow from a point), so they default to
 * `easeOut` — a deceleration curve that reads as a natural arrival, the
 * same reasoning Material's motion guidance applies to entering elements.
 * `fade` (opacity only, no spatial reading) and `slide` (a mechanical
 * clip/height reveal, closer to a resize than an arrival) default to
 * `easeStandard` instead — the same general-purpose curve every hover/focus
 * transition in the reference theme already uses.
 *
 * Reduced-motion: `prefersReducedMotion.current` (from `svelte/motion`) is
 * read inside each function body — i.e. at the moment Svelte actually calls
 * it for a mount/unmount, never cached at module load — so an OS toggle
 * mid-session is honored on the very next transition. Under reduced motion
 * the resolved `duration` collapses to `0` unless `essential: true` is
 * passed (motion that carries meaning, e.g. a focus-guiding movement).
 */
import { prefersReducedMotion } from 'svelte/motion';
import {
	fade as svelteFade,
	fly as svelteFly,
	scale as svelteScale,
	slide as svelteSlide
} from 'svelte/transition';
import type {
	FadeParams as SvelteFadeParams,
	FlyParams as SvelteFlyParams,
	ScaleParams as SvelteScaleParams,
	SlideParams as SvelteSlideParams,
	TransitionConfig
} from 'svelte/transition';
import { durations, easeOut, easeStandard } from './tokens.js';

/** the one option every token-bridged transition adds on top of
 * its `svelte/transition` params — opts a specific instance out of the
 * reduced-motion collapse. */
export interface MotionEssential {
	essential?: boolean;
}

export type FadeParams = SvelteFadeParams & MotionEssential;
export type FlyParams = SvelteFlyParams & MotionEssential;
export type SlideParams = SvelteSlideParams & MotionEssential;
export type ScaleParams = SvelteScaleParams & MotionEssential;

/** Read at call time (see module doc) — never memoized. */
function resolveDuration(duration: number, essential: boolean | undefined): number {
	if (essential) return duration;
	return prefersReducedMotion.current ? 0 : duration;
}

/** Fades opacity — same as `svelte/transition`'s `fade`, but defaulting to
 * `durations.fast` / `easeStandard` and collapsing under reduced motion. */
export function fade(node: Element, params: FadeParams = {}): TransitionConfig {
	const { essential, duration = durations.fast, easing = easeStandard, ...rest } = params;
	return svelteFade(node, { ...rest, duration: resolveDuration(duration, essential), easing });
}

/** Flies the element in/out on x/y — same as `svelte/transition`'s `fly`,
 * but defaulting to `durations.base` / `easeOut` and collapsing under
 * reduced motion. */
export function fly(node: Element, params: FlyParams = {}): TransitionConfig {
	const { essential, duration = durations.base, easing = easeOut, ...rest } = params;
	return svelteFly(node, { ...rest, duration: resolveDuration(duration, essential), easing });
}

/** Slides height/width — same as `svelte/transition`'s `slide`, but
 * defaulting to `durations.base` / `easeStandard` and collapsing under
 * reduced motion. */
export function slide(node: Element, params: SlideParams = {}): TransitionConfig {
	const { essential, duration = durations.base, easing = easeStandard, ...rest } = params;
	return svelteSlide(node, { ...rest, duration: resolveDuration(duration, essential), easing });
}

/** Scales + fades — same as `svelte/transition`'s `scale`, but defaulting
 * to `durations.base` / `easeOut` and collapsing under reduced motion. */
export function scale(node: Element, params: ScaleParams = {}): TransitionConfig {
	const { essential, duration = durations.base, easing = easeOut, ...rest } = params;
	return svelteScale(node, { ...rest, duration: resolveDuration(duration, essential), easing });
}
