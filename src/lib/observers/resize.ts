/**
 * @hyzer-labs/ui/observers — `resize` attachment (specs/48-observers.md,
 * Observers-R3).
 */
import { createAttachment } from './factory.js';

export type ResizeCallback = (entry: ResizeObserverEntry, observer: ResizeObserver) => void;

export interface ResizeOptions {
	/** Native ResizeObserver box model. Passed to `observe()`. */
	box?: ResizeObserverBoxOptions;
	/** Disconnect after the first callback delivery. Default false. */
	once?: boolean;
}

/**
 * `{@attach resize((entry) => …)}` — creates one `ResizeObserver`, calls
 * `observe(node, { box })` (omitting the second argument entirely when `box`
 * is undefined), and invokes `callback(entry, observer)` once per entry (a
 * single observed target reports exactly one entry per delivery). `once:
 * true` disconnects after the first delivery. Teardown disconnects.
 */
export function resize(
	callback: ResizeCallback,
	options: ResizeOptions = {}
): (node: Element) => () => void {
	const { box, once = false } = options;

	return createAttachment<ResizeObserver>('ResizeObserver', (node) => {
		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			callback(entry, observer);
			if (once) observer.disconnect();
		});
		if (box) {
			observer.observe(node, { box });
		} else {
			observer.observe(node);
		}
		return { observer };
	});
}
