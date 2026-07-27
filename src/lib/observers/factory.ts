/**
 * @hyzer-labs/ui/observers — shared internal factory (specs/48-observers.md,
 * Observers-R5).
 *
 * DRYs the create → `observe` → `disconnect` skeleton and the `typeof
 * document` SSR guard shared by `intersect`/`resize`/`mutate` (the
 * `reveal`/`revealGroup` precedent, `src/lib/motion/reveal.ts`). Per-observer
 * nuances — `intersect`'s `isIntersecting`-gated `once`, `resize`'s `box`
 * observe-arg, `mutate`'s records-shaped callback and debounce timer — live
 * in each wrapper, not here. Not exported from the module's public surface.
 */

/** What a wrapper's `setup` hands back to the factory: the live observer
 *  (disconnected on teardown) plus any extra teardown the wrapper needs run
 *  first (e.g. clearing a pending debounce timer). */
interface ObserverHandle<TObserver extends { disconnect(): void }> {
	observer: TObserver;
	/** Run before `observer.disconnect()` on teardown. */
	dispose?: () => void;
}

/** The name of a global observer constructor this module depends on —
 *  checked for presence (very old browsers, or a test's server project) so
 *  the attachment can no-op gracefully instead of throwing. */
type ObserverGlobalName = 'IntersectionObserver' | 'ResizeObserver' | 'MutationObserver';

/**
 * Builds an attachment factory: `(node) => () => void`. `setup` creates the
 * observer, calls its own `observe(node, …)` with the wrapper's specific
 * arguments, and returns the observer (plus an optional extra `dispose`).
 * Guards SSR (`typeof document === 'undefined'`) and an absent observer
 * global (very old browsers) — both return a no-op cleanup, never throw.
 */
export function createAttachment<TObserver extends { disconnect(): void }>(
	globalName: ObserverGlobalName,
	setup: (node: Element) => ObserverHandle<TObserver>
): (node: Element) => () => void {
	return (node: Element) => {
		// Observers-R1/edge cases: attachments only ever run client-side, but
		// guard defensively against any SSR-time invocation, and against a
		// platform that never shipped this observer at all.
		if (typeof document === 'undefined') return () => {};
		if (typeof (globalThis as Record<string, unknown>)[globalName] === 'undefined') {
			return () => {};
		}

		const { observer, dispose } = setup(node);

		return () => {
			dispose?.();
			observer.disconnect();
		};
	};
}
