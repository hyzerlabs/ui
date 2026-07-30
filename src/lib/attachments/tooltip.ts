/**
 * @hyzer-labs/ui — tooltip attachment (, R-TT).
 *
 * An accessible, non-interactive hover/focus description attached to any
 * existing element — `{@attach tooltip('Save changes')}` — satisfying the
 * WAI-ARIA APG Tooltip pattern and WCAG 2.2 SC 1.4.13 (Content on Hover or
 * Focus). Follows the `lightboxGroup` precedent (an attachment applied to a
 * consumer's own element: prior-attribute-state capture/restore, dev-a11y
 * warnings, mount-time DOM creation) and the `reveal.ts` attachment shape /
 * SSR guard / `prefersReducedMotion` gating.
 *
 * The tooltip node is created lazily, client-only, and appended to
 * `document.body` — because it attaches to a consumer element
 * whose markup it does not own, unlike Popover's inline-authored panel.
 */
import { DEV } from 'esm-env';
import { prefersReducedMotion } from 'svelte/motion';
import type { Placement, TooltipOptions } from '$lib/types';
import { cx, uid } from '$lib/utils';
import { parsePlacement, position } from '../positioning/index.js';

const FOCUSABLE_TAGS = new Set(['BUTTON', 'SELECT', 'TEXTAREA', 'INPUT']);

/** Dev-only warning heuristic — is this element reachable by Tab? */
function isFocusable(el: HTMLElement): boolean {
	if (el.hasAttribute('tabindex')) return true;
	if (el.isContentEditable) return true;
	const tag = el.tagName;
	if (tag === 'A' || tag === 'AREA') return el.hasAttribute('href');
	if (FOCUSABLE_TAGS.has(tag)) return !el.hasAttribute('disabled');
	return false;
}

/** `{@attach tooltip('Save changes')}` — the string overload is sugar for `{ text }`. */
export function tooltip(text: string): (node: Element) => () => void;
/** `{@attach tooltip({ text: 'Save changes', placement: 'right' })}` */
export function tooltip(options: TooltipOptions): (node: Element) => () => void;
export function tooltip(arg: string | TooltipOptions): (node: Element) => () => void {
	const options: TooltipOptions = typeof arg === 'string' ? { text: arg } : arg;

	return (node: Element) => {
		// Attachments only ever run client-side, but guard defensively
		// against any SSR-time invocation — no tooltip node is created server-
		// side; the trigger renders normally and is fully usable without JS.
		if (typeof document === 'undefined') return () => {};

		const trigger = node as HTMLElement;

		// Text only, non-interactive. TypeScript already prevents a
		// snippet at the type level for TS consumers — this defends the
		// runtime boundary for anyone bypassing it (a plain-JS consumer).
		if (DEV && typeof options.text !== 'string') {
			console.warn(
				'[hyzer-ui] tooltip(): `text` must be a plain string — interactive content belongs ' +
					'in a <Popover>, not a tooltip.'
			);
		}

		// Dev-only warning — the attachment never adds tabindex itself
		// (contrast lightboxGroup, which enhances non-interactive media); it
		// targets already-focusable controls.
		if (DEV && !isFocusable(trigger)) {
			console.warn(
				'[hyzer-ui] tooltip(): the trigger is not natively focusable and has no `tabindex` — ' +
					'it will show on hover but is unreachable by keyboard.'
			);
		}

		const text = options.text;
		const placement: Placement = options.placement ?? 'top';
		const offset = options.offset ?? 8;
		const openDelay = options.openDelay ?? 400;
		const closeDelay = options.closeDelay ?? 150;

		// Append (not overwrite) any existing aria-describedby, and
		// restore it verbatim on teardown (the lightboxGroup prior-attribute-
		// state discipline).
		const id = uid('hz-tooltip');
		const priorDescribedBy = trigger.getAttribute('aria-describedby');
		trigger.setAttribute('aria-describedby', priorDescribedBy ? `${priorDescribedBy} ${id}` : id);

		// Created and appended to document.body, lazily, client-only
		// — the `announce` live-region precedent. Hidden by default via an
		// inline style (not a theme rule) so the tooltip is correctly inert
		// even when the optional reference theme isn't loaded (headless-safe).
		const el = document.createElement('div');
		el.id = id;
		el.className = cx('hz-tooltip', options.class);
		el.setAttribute('role', 'tooltip');
		el.setAttribute('popover', 'manual');
		el.style.display = 'none';
		el.style.pointerEvents = 'auto';
		el.append(document.createTextNode(text));

		document.body.appendChild(el);

		let openTimer: ReturnType<typeof setTimeout> | null = null;
		let closeTimer: ReturnType<typeof setTimeout> | null = null;
		let shown = false;
		// Dismissible: cleared on pointerleave/blur — a genuine leave —
		// so only a continued hover/focus session stays suppressed post-Escape.
		let suppressedUntilLeave = false;
		let stopPositioning: (() => void) | null = null;

		function clearOpenTimer(): void {
			if (openTimer !== null) {
				clearTimeout(openTimer);
				openTimer = null;
			}
		}

		function clearCloseTimer(): void {
			if (closeTimer !== null) {
				clearTimeout(closeTimer);
				closeTimer = null;
			}
		}

		function onDocumentKeydown(e: KeyboardEvent): void {
			if (e.key !== 'Escape') return;
			// Dismissible: hides without moving focus/pointer; suppressed
			// until the trigger is re-entered/re-focused.
			suppressedUntilLeave = true;
			hide();
		}

		function show(): void {
			if (shown || suppressedUntilLeave) return;
			clearCloseTimer();
			shown = true;

			const { side, align } = parsePlacement(placement);
			el.setAttribute('data-placement', placement);
			el.setAttribute('data-state', 'open');
			// JS is the primary reduced-motion gate (single source of
			// truth); the theme's own @media strip is the belt-and-braces backup.
			el.style.animation = prefersReducedMotion.current ? 'none' : '';
			el.style.display = '';

			// Promote to the top layer when the platform supports it —
			// this was previously missing, leaving the tooltip invisible even
			// though `display` was cleared (a `manual` popover without an actual
			// showPopover() call never leaves the UA's forced-hidden state).
			if (typeof el.showPopover === 'function') {
				try {
					el.showPopover();
				} catch {
					// Already shown (defensive) — no-op.
				}
			}

			// Data-side/data-align reflect the RESOLVED (post-flip)
			// side — measured from real layout by position(), not the
			// requested/pre-flip side — so a consumer-drawn caret keyed off
			// them always points at the trigger even after a flip on either
			// positioning path.
			const resolved = position(trigger, el, { side, align, offset });
			stopPositioning = resolved.stop;
			el.setAttribute('data-side', resolved.side);
			el.setAttribute('data-align', resolved.align);

			document.addEventListener('keydown', onDocumentKeydown, true);
		}

		function hide(): void {
			if (!shown) return;
			shown = false;
			el.setAttribute('data-state', 'closed');
			if (typeof el.hidePopover === 'function') {
				try {
					el.hidePopover();
				} catch {
					// Already hidden (defensive) — no-op.
				}
			}
			el.style.display = 'none';
			stopPositioning?.();
			stopPositioning = null;
			document.removeEventListener('keydown', onDocumentKeydown, true);
		}

		function armClose(): void {
			clearCloseTimer();
			closeTimer = setTimeout(() => {
				closeTimer = null;
				// Focus parity (APG): the tooltip stays while EITHER hover or
				// focus holds it — a pointer leave must not hide a tooltip the
				// trigger's focus still holds open (e.g. the page scrolled the
				// trigger out from under the cursor). Blur is that session's
				// own hide path.
				if (trigger === document.activeElement) return;
				hide();
			}, closeDelay);
		}

		// Hover, after openDelay (pointer-noise filter only).
		function onTriggerPointerEnter(e: PointerEvent): void {
			// No hover-open on touch/coarse pointer — a tap should
			// activate the underlying control, not reveal a description.
			if (e.pointerType === 'touch') return;
			clearCloseTimer();
			clearOpenTimer();
			openTimer = setTimeout(() => {
				openTimer = null;
				show();
			}, openDelay);
		}

		// Hoverable and persistent: leaving the trigger arms the closeDelay
		// bridge; entering the tooltip itself (below) cancels it.
		function onTriggerPointerLeave(e: PointerEvent): void {
			if (e.pointerType === 'touch') return;
			suppressedUntilLeave = false;
			clearOpenTimer();
			armClose();
		}

		// Focus shows immediately — no delay for focus, per APG.
		function onTriggerFocus(): void {
			clearOpenTimer();
			clearCloseTimer();
			show();
		}

		function onTriggerBlur(): void {
			suppressedUntilLeave = false;
			hide();
		}

		function onTooltipPointerEnter(): void {
			clearCloseTimer();
		}

		function onTooltipPointerLeave(): void {
			armClose();
		}

		trigger.addEventListener('pointerenter', onTriggerPointerEnter);
		trigger.addEventListener('pointerleave', onTriggerPointerLeave);
		trigger.addEventListener('focus', onTriggerFocus);
		trigger.addEventListener('blur', onTriggerBlur);
		el.addEventListener('pointerenter', onTooltipPointerEnter);
		el.addEventListener('pointerleave', onTooltipPointerLeave);

		// Teardown — hide + remove the node, clear both timers, drop
		// every listener, restore the trigger's prior aria-describedby.
		return () => {
			clearOpenTimer();
			clearCloseTimer();
			stopPositioning?.();
			document.removeEventListener('keydown', onDocumentKeydown, true);
			trigger.removeEventListener('pointerenter', onTriggerPointerEnter);
			trigger.removeEventListener('pointerleave', onTriggerPointerLeave);
			trigger.removeEventListener('focus', onTriggerFocus);
			trigger.removeEventListener('blur', onTriggerBlur);
			el.removeEventListener('pointerenter', onTooltipPointerEnter);
			el.removeEventListener('pointerleave', onTooltipPointerLeave);
			el.remove();
			if (priorDescribedBy) trigger.setAttribute('aria-describedby', priorDescribedBy);
			else trigger.removeAttribute('aria-describedby');
		};
	};
}
