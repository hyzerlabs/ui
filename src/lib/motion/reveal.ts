/**
 * @hyzer-labs/ui — scroll-reveal attachments (specs/39-motion.md, Motion-R4).
 *
 * `reveal(options?)` is a Svelte attachment (the `lightboxGroup` precedent:
 * `(options) => (node) => cleanup`) that hides an element via inline style
 * (opacity + translate), then plays a WAAPI entrance the first time it
 * intersects the viewport. `revealGroup(options)` is the multi-child
 * variant: one shared `IntersectionObserver` on the container, staggering
 * each direct child's entrance by DOM order via `stagger` (ms).
 *
 * The hidden state is applied only on the client, inside the attachment
 * function — an SSR render (or a reader with JS disabled, since attachments
 * never run without hydration) always shows the content, never the hidden
 * inline style. Under `prefersReducedMotion.current` (unless `essential`)
 * the element(s) simply appear — no hidden state is ever applied, no
 * observer is created.
 */
import { prefersReducedMotion } from 'svelte/motion';
import { durations, easingCss } from './tokens.js';

export interface RevealOptions {
	/** Horizontal offset (px) the element travels in from. Default `0`. */
	x?: number;
	/** Vertical offset (px) the element travels in from. Default `16`. */
	y?: number;
	/** Entrance duration (ms). Default `durations.base`. */
	duration?: number;
	/** WAAPI easing — a CSS easing string. Default `easingCss.out`. */
	easing?: string;
	/** Entrance delay (ms), applied before `duration` starts. Default `0`. */
	delay?: number;
	/** `IntersectionObserver` threshold passthrough. */
	threshold?: number | number[];
	/** `IntersectionObserver` rootMargin passthrough. */
	rootMargin?: string;
	/** Play once and disconnect (default), or replay every re-entry. */
	once?: boolean;
	/** Plays the full animation even under reduced motion. Default `false`. */
	essential?: boolean;
}

export interface RevealGroupOptions extends RevealOptions {
	/** Per-child entrance delay (ms), multiplied by DOM order (0, 1, 2, …).
	 * Default `0` — no stagger. */
	stagger?: number;
}

interface Resolved {
	x: number;
	y: number;
	duration: number;
	easing: string;
	delay: number;
	threshold?: number | number[];
	rootMargin?: string;
	once: boolean;
	essential: boolean;
}

function resolve(options: RevealOptions): Resolved {
	return {
		x: options.x ?? 0,
		y: options.y ?? 16,
		duration: options.duration ?? durations.base,
		easing: options.easing ?? easingCss.out,
		delay: options.delay ?? 0,
		threshold: options.threshold,
		rootMargin: options.rootMargin,
		once: options.once ?? true,
		essential: options.essential ?? false
	};
}

function hide(el: HTMLElement, opts: Resolved): void {
	el.style.opacity = '0';
	el.style.transform = `translate(${opts.x}px, ${opts.y}px)`;
}

/** Clears the inline hidden-state style this module wrote — leaves the
 * element under normal CSS/layout control again. */
function clear(el: HTMLElement): void {
	el.style.opacity = '';
	el.style.transform = '';
}

/** Plays the WAAPI entrance and, once it finishes, clears the inline hidden
 * style and cancels the animation (so the finished state comes from the
 * element's normal styling, not a lingering fill). `extraDelay` is the
 * per-child stagger offset added on top of `opts.delay`. */
function play(el: HTMLElement, opts: Resolved, extraDelay = 0): void {
	const animation = el.animate(
		[
			{ opacity: 0, transform: `translate(${opts.x}px, ${opts.y}px)` },
			{ opacity: 1, transform: 'translate(0, 0)' }
		],
		{
			duration: opts.duration,
			delay: opts.delay + extraDelay,
			easing: opts.easing,
			fill: 'forwards'
		}
	);
	animation.finished
		.then(() => {
			clear(el);
			animation.cancel();
		})
		.catch(() => {
			// Cancelled mid-flight (e.g. the element detached before finishing)
			// — nothing left to clean up.
		});
}

/**
 * A scroll-reveal attachment for a single element: `{@attach reveal()}`.
 */
export function reveal(options: RevealOptions = {}): (node: Element) => () => void {
	return (element: Element) => {
		// Motion-R4: attachments only ever run client-side, but guard
		// defensively against any SSR-time invocation.
		if (typeof document === 'undefined') return () => {};

		const el = element as HTMLElement;
		const resolved = resolve(options);

		// Reduced motion (and not essential): appear immediately — no hidden
		// state is ever applied, no observer is created.
		if (prefersReducedMotion.current && !resolved.essential) {
			return () => {};
		}

		hide(el, resolved);

		let played = false;
		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						played = true;
						play(el, resolved);
						if (resolved.once) {
							io.disconnect();
						}
					} else if (!resolved.once && played) {
						// Left the viewport — reset to hidden so the next entry
						// replays the entrance.
						played = false;
						hide(el, resolved);
					}
				}
			},
			{ threshold: resolved.threshold, rootMargin: resolved.rootMargin }
		);
		io.observe(el);

		return () => {
			io.disconnect();
		};
	};
}

/**
 * A scroll-reveal attachment for a container's direct children, staggered
 * by DOM order: `{@attach revealGroup({ stagger: 60 })}`. One shared
 * `IntersectionObserver`, on the container itself — not one per child.
 *
 * v1 limitation (documented, not a bug): children are snapshotted once, at
 * attach time. Children appended to the container afterward are not picked
 * up by this instance.
 */
export function revealGroup(options: RevealGroupOptions = {}): (node: Element) => () => void {
	return (element: Element) => {
		if (typeof document === 'undefined') return () => {};

		const container = element as HTMLElement;
		const resolved = resolve(options);
		const stagger = options.stagger ?? 0;
		const children = Array.from(container.children) as HTMLElement[];

		if (prefersReducedMotion.current && !resolved.essential) {
			return () => {};
		}

		if (children.length === 0) return () => {};

		for (const child of children) hide(child, resolved);

		let played = false;
		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						played = true;
						children.forEach((child, i) => play(child, resolved, i * stagger));
						if (resolved.once) {
							io.disconnect();
						}
					} else if (!resolved.once && played) {
						played = false;
						for (const child of children) hide(child, resolved);
					}
				}
			},
			{ threshold: resolved.threshold, rootMargin: resolved.rootMargin }
		);
		io.observe(container);

		return () => {
			io.disconnect();
		};
	};
}
