/**
 * @hyzer-labs/ui — view-transition helper.
 *
 * Wraps `document.startViewTransition`. Unsupported browsers and reduced
 * motion (unless `essential: true`) run `update()` directly instead — a
 * no-op wrapper with the exact same return shape, so call sites never
 * branch on browser support or motion preference themselves.
 *
 * Does not import `$app/*` — this module has no SvelteKit dependency. The
 * three-line `onNavigate` integration for SvelteKit page transitions is
 * documented as consumer code on the docs page, not shipped here.
 */
import { prefersReducedMotion } from 'svelte/motion';

export interface ViewTransitionOptions {
	/** Plays the real view transition even under reduced motion. Default
	 * `false`. */
	essential?: boolean;
}

/** The subset of the native `ViewTransition` interface guaranteed on every
 * path — supported, unsupported, SSR, and reduced-motion — so consumer code
 * never needs its own support branch. */
export interface ViewTransitionResult {
	ready: Promise<void>;
	updateCallbackDone: Promise<void>;
	finished: Promise<void>;
	skipTransition: () => void;
}

/** The fallback path: runs `update` directly (no visual transition) and
 * resolves every promise once it settles. Used for SSR, unsupported
 * browsers, and reduced motion. */
function runDirectly(update: () => void | Promise<void>): ViewTransitionResult {
	const finished = Promise.resolve()
		.then(() => update())
		.then(() => undefined);
	return {
		ready: finished,
		updateCallbackDone: finished,
		finished,
		skipTransition: () => {}
	};
}

/**
 * Runs `update` inside a view transition (DOM update → cross-fade), falling
 * back to running it directly and resolving immediately when the platform
 * doesn't support view transitions, or the user prefers reduced motion.
 * Never throws — including on overlapping calls, where the platform's own
 * skip/queue behavior decides the outcome and any resulting rejection is
 * caught rather than left uncaught.
 */
export function viewTransition(
	update: () => void | Promise<void>,
	options: ViewTransitionOptions = {}
): ViewTransitionResult {
	const { essential = false } = options;

	// SSR / no `document` — inert.
	if (typeof document === 'undefined') return runDirectly(update);

	const supported = typeof document.startViewTransition === 'function';
	if (!supported || (prefersReducedMotion.current && !essential)) {
		return runDirectly(update);
	}

	const transition = document.startViewTransition(() => update());
	return {
		ready: transition.ready.catch(() => undefined),
		updateCallbackDone: transition.updateCallbackDone.catch(() => undefined),
		finished: transition.finished.catch(() => undefined),
		skipTransition: () => transition.skipTransition()
	};
}
