/**
 * @hyzer-labs/ui/observers — `announce` live-region helper
 * (specs/48-observers.md, Observers-R6). SSR-safe: a no-op when
 * `typeof document === 'undefined'`, matching the attachments' own guard.
 *
 * Lazily creates and reuses two visually-hidden (`class="sr-only"`, the
 * `src/lib/theme/base.css` utility — this module only ever emits the class,
 * never re-authors the rule) `[data-hz-live-region]` regions appended to
 * `document.body`: one `aria-live="polite" aria-atomic="true"`, one
 * `aria-live="assertive" aria-atomic="true"`. Both are module-scoped
 * singletons, reused across every call. The getter is self-healing — if a
 * cached region has been detached from the DOM (a test removing it, a full
 * body swap), it is transparently recreated, so there is no public teardown
 * API to remember to call.
 */

/** One politeness level's live region plus the pending write scheduled for
 *  it (so same-frame spam collapses to the last message). */
interface LiveRegionState {
	el: HTMLElement | null;
	raf: number | null;
}

const politeState: LiveRegionState = { el: null, raf: null };
const assertiveState: LiveRegionState = { el: null, raf: null };

function createRegion(assertive: boolean): HTMLElement {
	const el = document.createElement('div');
	el.setAttribute('data-hz-live-region', '');
	el.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
	el.setAttribute('aria-atomic', 'true');
	el.className = 'sr-only';
	document.body.appendChild(el);
	return el;
}

/** Self-healing: (re)creates either region that's missing or was detached
 *  from the document since the last call. Both are (re)created together —
 *  on the very first call, and after e.g. a full body swap — even though a
 *  given `announce()` call only writes to one of them, so the pair is always
 *  present as soon as either has ever been used. */
function ensureRegions(): void {
	if (!politeState.el || !politeState.el.isConnected) {
		politeState.el = createRegion(false);
	}
	if (!assertiveState.el || !assertiveState.el.isConnected) {
		assertiveState.el = createRegion(true);
	}
}

/**
 * Announces `message` to screen readers via a reused `.sr-only` live region.
 * `{ assertive: true }` writes to the assertive region (interruptions);
 * otherwise the polite one (status/progress). Because screen readers may not
 * re-read an unchanged `textContent`, every call clears the region
 * immediately, then sets the message on the next animation frame — the
 * clear-then-set toggle forces re-announcement even of an identical repeat.
 * Multiple calls to the same politeness level within one frame collapse to
 * the last message: each new call cancels the previously-scheduled write.
 * Never moves focus, adds no `role`, and traps nothing. No-op with no
 * `document` (SSR) — or before `<body>` has parsed, so it never throws.
 */
export function announce(message: string, options: { assertive?: boolean } = {}): void {
	if (typeof document === 'undefined' || !document.body) return;

	ensureRegions();
	const assertive = options.assertive ?? false;
	const state = assertive ? assertiveState : politeState;
	const el = state.el as HTMLElement;

	// Clear-then-set toggle: an unchanged textContent may not be re-read by a
	// screen reader, so every call clears first, forcing a real DOM mutation
	// once the scheduled write lands.
	el.textContent = '';

	// Same-frame spam guard: cancel any write already scheduled for this
	// politeness level — only the final call's message gets scheduled.
	if (state.raf !== null) {
		cancelAnimationFrame(state.raf);
	}
	state.raf = requestAnimationFrame(() => {
		state.raf = null;
		el.textContent = message;
	});
}
