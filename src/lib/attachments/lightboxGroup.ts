/**
 * @hyzer-labs/ui — lightboxGroup attachment (specs/25-lightbox-group.md).
 *
 * Enhances a container's own media (img / picture>img / video) so any one of
 * them opens a shared, focus-trapped lightbox at its index — no thumbnail
 * strip, no markup restructuring. The overlay is the exact same accessible
 * viewer the `Lightbox` component ships (`LightboxOverlay.svelte`, shared
 * internal, LightboxGroup-R14).
 *
 * Deliberate a11y deviation (LightboxGroup-R15): the library's rule is that
 * click targets are real `<button>`/`<a>` elements. This attachment instead
 * makes plain media operable via `tabindex="0"` + `role="button"` + an
 * accessible name, because the whole point is to enhance *existing* page
 * media in place without restructuring markup. The mitigation is complete
 * keyboard support (Enter/Space activation, LightboxGroup-R9) and a correct
 * accessible name (LightboxGroup-R5) — the docs steer consumers who control
 * their own markup to the real `Lightbox` component instead.
 */
import { mount, unmount } from 'svelte';
import type { LightboxGroupOptions, LightboxItem } from '$lib/types';
import LightboxOverlay from '../components/LightboxOverlay.svelte';

type Trigger = HTMLImageElement | HTMLVideoElement;

interface PriorState {
	tabindex: string | null;
	role: string | null;
	ariaLabel: string | null;
}

/**
 * Returns a Svelte attachment: `(node) => cleanup`. Applied to a container
 * (`{@attach lightboxGroup(options)}`) or invoked directly on a DOM element
 * (`lightboxGroup(options)(el)`), it enhances the container's qualifying
 * media descendants and opens them all, at the activated index, in a single
 * shared lightbox overlay. Always returns a cleanup function (a structurally
 * compatible subtype of Svelte's `Attachment<Element>`, whose `{@attach}`
 * contract allows `void | (() => void)`).
 */
export function lightboxGroup(options: LightboxGroupOptions = {}): (node: Element) => () => void {
	return (element: Element) => {
		// LightboxGroup-R3: attachments only ever run client-side, but guard
		// defensively against any SSR-time invocation — no window/document
		// access executes server-side.
		if (typeof document === 'undefined') return () => {};

		// `Element` lacks the DOM lib's GlobalEventHandlersEventMap (mixed into
		// HTMLElement, not Element) — cast once so click/keydown listeners
		// type-check; every qualifying descendant is itself an HTMLElement.
		const node = element as HTMLElement;

		const {
			selector,
			dialogLabel = 'Media viewer',
			closeLabel = 'Close media viewer',
			prevLabel = 'Previous item',
			nextLabel = 'Next item'
		} = options;

		// LightboxGroup-R5/R11: prior attribute state, recorded once per element
		// so cleanup can restore it (rather than clobber a pre-existing
		// tabindex/role/aria-label permanently).
		const prior = new Map<Trigger, PriorState>();

		// LightboxGroup-R10: single mounted overlay instance, guarded so a
		// second activation while one is open is ignored.
		let overlay: Record<string, unknown> | null = null;

		// The enhancement pass (below) overwrites `aria-label`, which is also
		// one of the video-name precedence sources (LightboxGroup-R6). Cache
		// the name computed at enhance time so item derivation reads the
		// original source, not our own `View larger: …` overwrite.
		// Un-enhanced elements (e.g. added after attach, R7) have no cache
		// entry and are read live — their aria-label was never touched.
		const videoLabelCache = new Map<HTMLVideoElement, string>();

		// -----------------------------------------------------------------
		// LightboxGroup-R4: qualifying elements & exclusions
		// -----------------------------------------------------------------

		function isRendered(el: Element): boolean {
			if ((el as HTMLElement).hasAttribute('hidden')) return false;
			return el.getClientRects().length > 0;
		}

		function hasIgnoreAncestor(el: Element): boolean {
			let cur: Element | null = el;
			while (cur) {
				if (cur.hasAttribute('data-lightbox-ignore')) return true;
				if (cur === node) return false;
				cur = cur.parentElement;
			}
			return false;
		}

		function hasInteractiveAncestor(el: Element): boolean {
			let cur: Element | null = el.parentElement;
			while (cur) {
				if (cur.tagName === 'A' || cur.tagName === 'BUTTON') return true;
				if (cur === node) return false;
				cur = cur.parentElement;
			}
			return false;
		}

		/** Decorative media never belongs in a lightbox — and enhancing it would
		 * put tabindex/role on an element removed from the accessibility tree
		 * (e.g. Image's aria-hidden blur-placeholder img). Structural exclusion,
		 * unlike the rendered check in scan(). */
		function hasAriaHiddenAncestor(el: Element): boolean {
			let cur: Element | null = el;
			while (cur) {
				if (cur.getAttribute('aria-hidden') === 'true') return true;
				if (cur === node) return false;
				cur = cur.parentElement;
			}
			return false;
		}

		function matchesSelector(el: Element): boolean {
			return !selector || el.matches(selector);
		}

		/** Structural qualification only — visibility is checked in scan(), where
		 * it matters. Interaction paths need no isRendered guard of their own:
		 * activate() re-validates against scan() (a non-rendered element resolves
		 * to index -1 and no-ops). */
		function qualifies(el: Element): el is Trigger {
			if (!(el instanceof HTMLImageElement) && !(el instanceof HTMLVideoElement)) return false;
			if (!matchesSelector(el)) return false;
			if (hasIgnoreAncestor(el)) return false;
			if (hasInteractiveAncestor(el)) return false;
			if (hasAriaHiddenAncestor(el)) return false;
			return true;
		}

		/** Structurally-qualifying media in document order — the enhancement set. */
		function structuralScan(): Trigger[] {
			return Array.from(node.querySelectorAll<Trigger>('img, video')).filter(qualifies);
		}

		/** LightboxGroup-R7: the visible qualifying set, re-queried at activation —
		 * only rendered media joins the viewer. Enhancement (R5) deliberately uses
		 * the structural set instead: media hidden at attach time (an inactive tab
		 * panel, a closed accordion) must still be enhanced so it is interactive
		 * the moment it is revealed. */
		function scan(): Trigger[] {
			return structuralScan().filter(isRendered);
		}

		// -----------------------------------------------------------------
		// LightboxGroup-R6: item derivation
		// -----------------------------------------------------------------

		function figcaptionOf(el: Element): string | undefined {
			const figure = el.closest('figure');
			if (!figure) return undefined;
			return figure.querySelector('figcaption')?.textContent?.trim() || undefined;
		}

		function videoLabel(el: HTMLVideoElement): string {
			const cached = videoLabelCache.get(el);
			if (cached !== undefined) return cached;
			return (
				el.getAttribute('aria-label') || el.getAttribute('title') || figcaptionOf(el) || 'Video'
			);
		}

		function nameOf(el: Trigger): string {
			return el instanceof HTMLVideoElement ? videoLabel(el) : el.alt;
		}

		function deriveItem(el: Trigger): LightboxItem {
			const override = el.getAttribute('data-lightbox-src') || undefined;
			const caption = figcaptionOf(el);
			if (el instanceof HTMLVideoElement) {
				const src = override || el.currentSrc || el.src || el.querySelector('source')?.src || '';
				return {
					type: 'video',
					src,
					label: videoLabel(el),
					poster: el.poster || undefined,
					caption
				};
			}
			return {
				type: 'image',
				src: override || el.currentSrc || el.src,
				alt: el.alt,
				caption
			};
		}

		// -----------------------------------------------------------------
		// LightboxGroup-R5: enhancement pass
		// -----------------------------------------------------------------

		function enhance() {
			for (const el of structuralScan()) {
				if (!prior.has(el)) {
					prior.set(el, {
						tabindex: el.getAttribute('tabindex'),
						role: el.getAttribute('role'),
						ariaLabel: el.getAttribute('aria-label')
					});
				}
				el.setAttribute('tabindex', '0');
				el.setAttribute('role', 'button');
				// Computed from the still-original attributes (before the
				// aria-label write below), then cached for later item
				// derivation reads (see videoLabelCache above).
				const name = nameOf(el);
				if (el instanceof HTMLVideoElement) videoLabelCache.set(el, name);
				el.setAttribute('aria-label', name ? `View larger: ${name}` : 'View larger');
				el.setAttribute('data-lightbox-trigger', '');
			}
		}

		function restore() {
			for (const [el, state] of prior) {
				if (state.tabindex === null) el.removeAttribute('tabindex');
				else el.setAttribute('tabindex', state.tabindex);
				if (state.role === null) el.removeAttribute('role');
				else el.setAttribute('role', state.role);
				if (state.ariaLabel === null) el.removeAttribute('aria-label');
				else el.setAttribute('aria-label', state.ariaLabel);
				el.removeAttribute('data-lightbox-trigger');
			}
			prior.clear();
			videoLabelCache.clear();
		}

		// -----------------------------------------------------------------
		// LightboxGroup-R7/R10: activation → scan, derive, mount the overlay
		// -----------------------------------------------------------------

		function activate(el: Trigger, focusEl: HTMLElement) {
			// LightboxGroup-R10: single-instance guard — ignore while open.
			if (overlay) return;
			const els = scan();
			const startIndex = els.indexOf(el);
			if (startIndex === -1) return;
			const items = els.map(deriveItem);
			overlay = mount(LightboxOverlay, {
				target: document.body,
				props: {
					items,
					open: true,
					startIndex,
					dialogLabel,
					closeLabel,
					prevLabel,
					nextLabel,
					returnFocusTo: focusEl,
					onclose: () => {
						if (overlay) {
							unmount(overlay);
							overlay = null;
						}
					}
				}
			});
		}

		// -----------------------------------------------------------------
		// LightboxGroup-R8/R9: delegated pointer + keyboard activation
		// -----------------------------------------------------------------

		function resolveFromTarget(target: EventTarget | null): Trigger | null {
			if (!(target instanceof Element)) return null;
			const el = target.closest('img, video');
			if (!el || !node.contains(el)) return null;
			return qualifies(el) ? el : null;
		}

		function onClick(e: MouseEvent) {
			const el = resolveFromTarget(e.target);
			if (!el) return;
			// Innermost group wins on nested containers (LightboxGroup-R8).
			e.preventDefault();
			e.stopPropagation();
			activate(el, el);
		}

		function onKeydown(e: KeyboardEvent) {
			if (e.key !== 'Enter' && e.key !== ' ') return;
			// The event target IS the focused trigger (enhancement sets tabindex
			// directly on the media element) — no closest() resolution needed.
			const target = e.target;
			if (!(target instanceof HTMLImageElement) && !(target instanceof HTMLVideoElement)) return;
			if (!node.contains(target) || !qualifies(target)) return;
			e.preventDefault();
			e.stopPropagation();
			activate(target, target);
		}

		enhance();
		node.addEventListener('click', onClick);
		node.addEventListener('keydown', onKeydown);

		// LightboxGroup-R11: cleanup — listeners off, attributes restored, any
		// open overlay force-unmounted (no onclose, no focus move — matching
		// Modal's existing forced-teardown semantics).
		return () => {
			node.removeEventListener('click', onClick);
			node.removeEventListener('keydown', onKeydown);
			restore();
			if (overlay) {
				unmount(overlay);
				overlay = null;
			}
		};
	};
}
