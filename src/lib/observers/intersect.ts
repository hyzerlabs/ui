/**
 * @hyzer-labs/ui/observers — `intersect` attachment (,
 * one place).
 */
import { createAttachment } from './factory.js';

export type IntersectCallback = (
	entry: IntersectionObserverEntry,
	observer: IntersectionObserver
) => void;

export interface IntersectOptions extends IntersectionObserverInit {
	/** Disconnect after the first *intersecting* entry. Default false. */
	once?: boolean;
}

/**
 * `{@attach intersect((entry) => …, { rootMargin: '200px' })}` — creates one
 * `IntersectionObserver` (native `root`/`rootMargin`/`threshold` passed
 * straight through), observes the attached node, and invokes
 * `callback(entry, observer)` once per delivery (a single observed target
 * reports exactly one entry per delivery). Because IO fires an initial
 * delivery on observe, the callback may receive a non-intersecting entry
 * first — this is documented behavior, not filtered out. `once: true`
 * disconnects immediately after the first entry whose `isIntersecting` is
 * true, never on an initial non-intersecting report. Teardown disconnects
 * the observer.
 */
export function intersect(
	callback: IntersectCallback,
	options: IntersectOptions = {}
): (node: Element) => () => void {
	const { once = false, root, rootMargin, threshold } = options;

	return createAttachment<IntersectionObserver>('IntersectionObserver', (node) => {
		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				callback(entry, observer);
				if (once && entry.isIntersecting) observer.disconnect();
			},
			{ root, rootMargin, threshold }
		);
		observer.observe(node);
		return { observer };
	});
}
