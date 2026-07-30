<script lang="ts">
	import { untrack } from 'svelte';
	import type { PopoverProps, TriggerAttrs } from '$lib/types';
	import { cx, uid } from '$lib/utils';
	import { prefersReducedMotion } from 'svelte/motion';
	import { parsePlacement, position, supportsPopoverApi } from '../positioning/index.js';
	import Button from './Button.svelte';

	let {
		open = $bindable(false),
		placement = 'bottom-start',
		offset = 8,
		autoFocus = false,
		dismissible = true,
		label,
		onopen,
		onclose,
		triggerLabel,
		triggerProps = {},
		triggerIcon,
		trigger,
		children,
		class: className,
		...rest
	}: PopoverProps = $props();

	// Appearance defaults for the composed Button trigger — the
	// Dropdown precedent.
	const mergedVariant = $derived(triggerProps.variant ?? 'outline');
	const mergedIntent = $derived(triggerProps.intent ?? 'neutral');

	// Dev-only warning — the default trigger (no `trigger` snippet)
	// must have an accessible name from somewhere (`triggerLabel` or
	// `triggerProps.ariaLabel`); the component never fabricates one.
	if (import.meta.env.DEV) {
		if (untrack(() => !trigger && !triggerLabel && !triggerProps.ariaLabel)) {
			console.warn(
				'[hyzer-ui] <Popover>: the default trigger has no accessible name — pass `triggerLabel` ' +
					'or `triggerProps.ariaLabel` (or provide your own `trigger` snippet). Add one to ' +
					'satisfy WCAG 4.1.2 Name, Role, Value.'
			);
		}
	}

	const _uid = uid('hz-po');
	const triggerId = `hz-po-trigger-${_uid}`;
	const panelId = `hz-po-panel-${_uid}`;

	let rootEl: HTMLDivElement | null = $state(null);
	let panelEl: HTMLDivElement | null = $state(null);

	// Bookkeeping for the reconcile effect / native toggle sync below — none
	// of these are reactive state; they're plain closures over one instance's
	// lifecycle (the Modal precedent).
	let stopPositioning: (() => void) | null = null;
	let wasOpen = false;
	let escapePending = false;
	let dismissOriginInsidePanel = false;

	function focusTrigger(): void {
		const el = document.getElementById(triggerId);
		if (el && document.contains(el)) el.focus();
	}

	// The library applies these to the default Button internally, or
	// a consumer's own `trigger` snippet spreads them onto any element.
	function onTriggerClick(): void {
		// Native popovertarget invokers already toggle the panel themselves
		// when the Popover API is supported (the native `toggle` event syncs
		// `open` back below) — toggling `open` here too would double-fire.
		// Only the fallback path (no native invoker) needs this to drive state.
		if (!supportsPopoverApi()) open = !open;
	}

	const triggerAttrs: TriggerAttrs = $derived({
		id: triggerId,
		'aria-expanded': open ? 'true' : 'false',
		'aria-controls': panelId,
		popovertarget: panelId,
		onclick: onTriggerClick
	});

	function isDomShown(): boolean {
		if (!panelEl) return false;
		if (supportsPopoverApi()) return panelEl.matches(':popover-open');
		return panelEl.hasAttribute('data-open');
	}

	// -------------------------------------------------------------------------
	// Single sources of truth for the "did the DOM's shown
	// state actually change" bookkeeping — onopen/onclose fire exactly once
	// per real transition, whether it was driven by us, a native invoker
	// click, native light-dismiss, native Escape auto-dismiss, or another
	// auto popover opening (platform one-open-at-a-time).
	// -------------------------------------------------------------------------

	function handleShown(): void {
		if (wasOpen) return;
		wasOpen = true;
		open = true;
		escapePending = false;
		dismissOriginInsidePanel = false;

		// Positioning + show-time wiring live HERE, not in
		// showPanel() below — a native `popovertarget` invoker's own default
		// action can open the panel before our JS ever calls showPopover()
		// itself (it races/wins the click), which would otherwise skip
		// showPanel() entirely (the reconcile effect sees the panel already
		// shown and no-ops). handleShown() is the one place guaranteed to run
		// exactly once per real "became visible" transition regardless of
		// what caused it, so positioning belongs here.
		if (panelEl) {
			const { side, align } = parsePlacement(placement);
			// JS is the primary reduced-motion gate; the theme's own
			// @media strip (popover.css) is the belt-and-braces backup.
			panelEl.style.animation = prefersReducedMotion.current ? 'none' : '';
			const triggerEl = document.getElementById(triggerId) ?? rootEl;
			if (triggerEl) {
				// Data-side/data-align reflect the RESOLVED (post-flip)
				// side — measured from real layout, not the requested side — so a
				// consumer-drawn caret always points at the trigger after a flip.
				const resolved = position(triggerEl, panelEl, { side, align, offset });
				stopPositioning = resolved.stop;
				panelEl.setAttribute('data-side', resolved.side);
				panelEl.setAttribute('data-align', resolved.align);
			} else {
				panelEl.setAttribute('data-side', side);
				panelEl.setAttribute('data-align', align);
			}
		}
		document.addEventListener('keydown', onDocumentKeydown, true);

		onopen?.();
		// AutoFocus:true moves focus to the first focusable element in
		// the panel (or the panel container itself). Deferred a microtask so
		// the panel's own visibility change has settled.
		if (autoFocus) {
			queueMicrotask(() => {
				if (!panelEl) return;
				const first = panelEl.querySelector<HTMLElement>(
					'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
						'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
				);
				(first ?? panelEl).focus();
			});
		}
	}

	function handleHidden(): void {
		if (!wasOpen) return;
		wasOpen = false;
		open = false;

		document.removeEventListener('keydown', onDocumentKeydown, true);
		stopPositioning?.();
		stopPositioning = null;

		// Escape or a dismiss originating inside the panel
		// returns focus to the trigger; light-dismiss elsewhere leaves focus
		// where the click landed (never yanked back).
		if (escapePending || dismissOriginInsidePanel) {
			focusTrigger();
		}
		escapePending = false;
		dismissOriginInsidePanel = false;
		onclose?.();
	}

	// Native `toggle` event — the authoritative sync point for the
	// Popover-API path: fires for our own showPopover()/
	// hidePopover() calls too, so handleShown/handleHidden stay single-fire
	// regardless of who triggered the DOM change.
	function onPanelToggle(e: Event): void {
		const evt = e as ToggleEvent;
		if (evt.newState === 'open') handleShown();
		else handleHidden();
	}

	// -------------------------------------------------------------------------
	// Escape — always closes (even dismissible:false; no opt-out, the Modal
	// rule), regardless of whether the platform also auto-dismisses an "auto"
	// popover on Escape (idempotent guards above make a redundant native
	// dismiss harmless).
	// -------------------------------------------------------------------------

	function onDocumentKeydown(e: KeyboardEvent): void {
		if (e.key !== 'Escape' || !open) return;
		escapePending = true;
		open = false;
	}

	// -------------------------------------------------------------------------
	// Fallback backstop — only wired when the Popover API is
	// unavailable (native "auto" popovers already provide real light-dismiss).
	// Mirrors Dropdown's onDocumentClick/onRootFocusOut pattern exactly.
	// -------------------------------------------------------------------------

	function onDocumentPointerDown(e: PointerEvent): void {
		if (!open) return;
		if (rootEl && e.composedPath().includes(rootEl)) return;
		open = false;
	}

	function onRootFocusOut(e: FocusEvent): void {
		if (!open) return;
		const related = e.relatedTarget as HTMLElement | null;
		if (related && rootEl?.contains(related)) return;
		open = false;
	}

	// showPanel()/hidePanel() ONLY push our desired state into the DOM (the
	// raw showPopover()/hidePopover() call, or the fallback data-open
	// attribute) — every side effect (positioning, listeners, callbacks,
	// focus) lives in handleShown()/handleHidden() above, the single place
	// guaranteed to run once per real transition regardless of cause.
	function showPanel(): void {
		if (!panelEl) return;
		if (supportsPopoverApi() && typeof panelEl.showPopover === 'function') {
			try {
				panelEl.showPopover();
			} catch {
				// Already shown (e.g. a native invoker beat us to it) — no-op.
			}
			// handleShown() runs from the native `toggle` listener above.
		} else {
			panelEl.setAttribute('data-open', '');
			if (dismissible) {
				document.addEventListener('pointerdown', onDocumentPointerDown, true);
				rootEl?.addEventListener('focusout', onRootFocusOut);
			}
			handleShown();
		}
	}

	function hidePanel(): void {
		if (!panelEl) return;
		if (supportsPopoverApi() && typeof panelEl.hidePopover === 'function') {
			try {
				panelEl.hidePopover();
			} catch {
				// Already hidden — no-op.
			}
			// handleHidden() runs from the native `toggle` listener above.
		} else {
			panelEl.removeAttribute('data-open');
			document.removeEventListener('pointerdown', onDocumentPointerDown, true);
			rootEl?.removeEventListener('focusout', onRootFocusOut);
			handleHidden();
		}
	}

	// Reconciles `open` with the panel's showPopover()/hidePopover()
	// (guarded so it is a no-op on SSR / before mount — the Modal precedent).
	// Idempotent against the current DOM state, so it never double-toggles a
	// panel a native invoker (or the fallback backstop) already moved.
	$effect(() => {
		if (!panelEl) return;
		const shown = isDomShown();
		if (open && !shown) {
			showPanel();
		} else if (!open && shown) {
			// Captured before the DOM actually hides — the browser force-blurs a
			// focused descendant once the panel is hidden/removed from the top
			// layer, so this must be read now, not inside handleHidden() later.
			const active = document.activeElement as HTMLElement | null;
			dismissOriginInsidePanel = !!active && (active === panelEl || panelEl.contains(active));
			hidePanel();
		}
	});

	// Teardown safety net — an instance unmounted while open must not leak
	// document-level listeners.
	$effect(() => {
		return () => {
			document.removeEventListener('keydown', onDocumentKeydown, true);
			document.removeEventListener('pointerdown', onDocumentPointerDown, true);
			stopPositioning?.();
		};
	});
</script>

{#snippet triggerIconRender()}
	{#if triggerIcon}{@render triggerIcon()}{/if}
{/snippet}

<!--
	Root wraps trigger + panel (the Dropdown precedent) and carries
	{...rest}/class/data-open. `display: contents` — the root is pure
	bookkeeping, not a layout box (the panel is position: fixed / top-layer;
	the trigger owns its own box).
-->
<div
	{...rest}
	bind:this={rootEl}
	class={cx('hz-popover', className)}
	data-open={open ? '' : undefined}
>
	{#if trigger}
		{@render trigger(triggerAttrs)}
	{:else if triggerLabel}
		<!-- Labeled default trigger — the visible text is the
		     accessible name; no redundant aria-label. -->
		<Button
			id={triggerAttrs.id}
			class={cx('hz-popover-trigger', triggerProps.class)}
			variant={mergedVariant}
			intent={mergedIntent}
			size={triggerProps.size}
			aria-expanded={triggerAttrs['aria-expanded']}
			aria-controls={triggerAttrs['aria-controls']}
			popovertarget={triggerAttrs.popovertarget}
			onclick={triggerAttrs.onclick}
		>
			{#snippet iconEnd()}{@render triggerIconRender()}{/snippet}
			{triggerLabel}
		</Button>
	{:else}
		<!-- Icon-only default trigger — two branches (rather than a
		     conditional icon prop) keep Button's iconOnly derivation (no
		     children ⇒ icon-only circle) intact, the Dropdown precedent.
		     `triggerProps.ariaLabel` is the accessible-name channel
		     here (triggerLabel is always empty in this branch by definition;
		     the warning above fires when neither is set). -->
		<Button
			id={triggerAttrs.id}
			class={cx('hz-popover-trigger', triggerProps.class)}
			variant={mergedVariant}
			intent={mergedIntent}
			size={triggerProps.size}
			ariaLabel={triggerProps.ariaLabel}
			aria-expanded={triggerAttrs['aria-expanded']}
			aria-controls={triggerAttrs['aria-controls']}
			popovertarget={triggerAttrs.popovertarget}
			onclick={triggerAttrs.onclick}
		>
			{#snippet iconStart()}{@render triggerIconRender()}{/snippet}
		</Button>
	{/if}

	<!--
		Non-modal disclosure region — no aria-modal, no focus trap, no
		backdrop. `popover="auto"` gives real platform light-dismiss + Escape +
		one-open-at-a-time; `dismissible:false` switches to "manual" (Escape
		still always closes, via our own handler above). Always rendered (SSR/
		pre-mount safe edge case), visibility driven by [data-state].
	-->
	<div
		bind:this={panelEl}
		id={panelId}
		class="hz-popover-panel"
		popover={dismissible ? 'auto' : 'manual'}
		tabindex="-1"
		role={label ? 'group' : undefined}
		aria-label={label}
		data-placement={placement}
		data-state={open ? 'open' : 'closed'}
		ontoggle={onPanelToggle}
	>
		<!-- Scroll container — the panel itself keeps overflow visible so a
		     consumer-drawn caret (keyed off data-side) can protrude without
		     being clipped or scrollbarred (popover.css). -->
		<div class="hz-popover-content">
			{#if children}{@render children()}{/if}
		</div>
	</div>
</div>

<style>
	/* Structural CSS only — chrome lives in theme/components/popover.css. */

	.hz-popover {
		display: contents;
	}

	.hz-popover-panel {
		position: fixed;
		margin: 0;
	}

	/* Closed panel is out of the accessibility tree and out of tab order —
	   correct even without the optional reference theme loaded. */
	.hz-popover-panel:not([data-state='open']) {
		display: none;
	}
</style>
