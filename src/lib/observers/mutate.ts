/**
 * @hyzer-labs/ui/observers — `mutate` attachment (,
 * one place). `Toc` is the in-library consumer of the `debounce` option, at
 * 120ms.
 */
import { createAttachment } from './factory.js';

export type MutateCallback = (records: MutationRecord[], observer: MutationObserver) => void;

export interface MutateOptions extends MutationObserverInit {
	/** Disconnect after the first callback delivery. Default false. */
	once?: boolean;
	/** Coalesce bursts: fire once, `ms` after the last mutation, with the
	 *  accumulated records. Default 0 (fire synchronously per delivery). */
	debounce?: number;
}

/**
 * `{@attach mutate((records) => …, { childList: true, subtree: true })}` —
 * creates one `MutationObserver`, calls `observe(node, init)` with the
 * `MutationObserverInit` passthrough (`childList`, `subtree`, `attributes`,
 * `characterData`, `attributeFilter`, …), and invokes `callback(records,
 * observer)` — the native records-array shape, since a mutation delivery is
 * inherently multi-record. Calling `mutate` with no `MutationObserverInit`
 * fields at all is a genuine misuse: the native `observe()` throws per
 * platform, and this wrapper does not swallow that.
 *
 * `debounce > 0` coalesces deliveries: a timer is armed/re-armed on each raw
 * delivery, and the callback fires once after the quiet period with all
 * records accumulated across the burst. `once` with `debounce` fires the
 * coalesced callback once, then disconnects. Teardown disconnects the
 * observer *and* clears any pending debounce timer — no callback fires after
 * teardown.
 */
export function mutate(
	callback: MutateCallback,
	options: MutateOptions = {}
): (node: Element) => () => void {
	const { once = false, debounce = 0, ...init } = options;

	return createAttachment<MutationObserver>('MutationObserver', (node) => {
		let timer: ReturnType<typeof setTimeout> | undefined;
		let pending: MutationRecord[] = [];

		const observer = new MutationObserver((records) => {
			if (debounce > 0) {
				pending.push(...records);
				if (timer) clearTimeout(timer);
				timer = setTimeout(() => {
					timer = undefined;
					const accumulated = pending;
					pending = [];
					callback(accumulated, observer);
					if (once) observer.disconnect();
				}, debounce);
				return;
			}

			callback(records, observer);
			if (once) observer.disconnect();
		});
		observer.observe(node, init);

		return {
			observer,
			dispose: () => {
				if (timer) {
					clearTimeout(timer);
					timer = undefined;
				}
			}
		};
	});
}
