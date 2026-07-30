<script lang="ts">
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import { cx, uid } from '$lib/utils';
	import Button from './Button.svelte';
	import IconX from '$lib/icons/generated/x.svelte';

	type ModalSize = 'sm' | 'md' | 'lg' | 'full';

	interface Props {
		open?: boolean;
		title: string;
		description?: string;
		size?: ModalSize;
		closeOnOverlay?: boolean;
		showClose?: boolean;
		preventScroll?: boolean;
		closeLabel?: string;
		onclose?: (() => void) | undefined;
		children?: Snippet;
		actions?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		open = $bindable(false),
		title,
		description,
		size = 'md',
		closeOnOverlay = true,
		showClose = true,
		preventScroll = true,
		closeLabel = 'Close dialog',
		onclose,
		children,
		actions,
		class: className,
		...rest
	}: Props = $props();

	// Stable IDs for ARIA labeling (Modal-R1, R2, R3).
	const titleId = uid('hz-modal-title');
	const descId = uid('hz-modal-desc');

	// Modal-R7: data-state derived from open prop.
	const dataState = $derived(open ? 'open' : 'closed');

	// Modal-R1: dialog element reference (null until mounted).
	let dialogEl: HTMLDialogElement | null = $state(null);

	// Per-instance scroll-lock state (Modal-R16).
	let previousFocus: HTMLElement | null = null;
	let prevBodyOverflow = '';
	let scrollLockActive = false;

	// Modal-R14: dev warning for missing title.
	if (import.meta.env.DEV) {
		if (untrack(() => !title)) {
			console.warn(
				'[hyzer-ui] <Modal>: `title` is required for accessibility (aria-labelledby). ' +
					'Provide a non-empty string.'
			);
		}
	}

	// -------------------------------------------------------------------------
	// Modal-R8: reconcile `open` with the DOM via showModal() / close().
	// Modal-R9: all close paths set open = false (two-way bindable).
	// Modal-R10: onclose fires once per dismissal after open is set false.
	// Modal-R11: focus management on open.
	// Modal-R12: focus return on close.
	// Modal-R16: scroll lock — captured/restored per instance.
	// Guarded by `if (!dialogEl)` so it is a no-op on SSR / before mount.
	// -------------------------------------------------------------------------
	$effect(() => {
		if (!dialogEl) return;

		if (open) {
			if (!dialogEl.open) {
				// Modal-R12: capture the element that currently owns focus.
				previousFocus = document.activeElement as HTMLElement;

				// Modal-R16: lock body scroll, capturing the previous inline value.
				if (preventScroll) {
					prevBodyOverflow = document.body.style.overflow;
					document.body.style.overflow = 'hidden';
					scrollLockActive = true;
				}

				// Show the dialog in the top layer (native backdrop + focus trap).
				dialogEl.showModal();

				// Modal-R11: after showModal() settles, move focus per the fallback chain:
				//   1. First focusable element that is NOT the close control.
				//   2. The close control (when showClose=true).
				//   3. The dialog element itself (tabindex="-1", always focusable).
				queueMicrotask(() => {
					if (!dialogEl) return;

					// Identify the close control so it can be used as a fallback, not
					// as the first candidate when there is other focusable content.
					const closeBtn = dialogEl.querySelector<HTMLElement>('[data-modal-close]');

					const candidates = Array.from(
						dialogEl.querySelectorAll<HTMLElement>(
							'a[href]:not([disabled]), button:not([disabled]), ' +
								'input:not([disabled]), select:not([disabled]), ' +
								'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
						)
					).filter((el) => el !== dialogEl && el !== closeBtn);

					const first = candidates[0];
					if (first) {
						first.focus();
					} else if (closeBtn) {
						closeBtn.focus();
					} else {
						// No focusable child — focus dialog itself (tabindex="-1", R1).
						dialogEl.focus();
					}
				});
			}
		} else {
			if (dialogEl.open) {
				dialogEl.close();

				// Modal-R16: restore the original inline overflow value.
				if (scrollLockActive) {
					document.body.style.overflow = prevBodyOverflow;
					scrollLockActive = false;
				}

				// Modal-R12: return focus to the pre-open element (if still in DOM).
				const el = previousFocus;
				previousFocus = null;
				if (el && document.contains(el)) {
					el.focus();
				}

				// Modal-R10: fire the onclose callback exactly once.
				onclose?.();
			}
		}

		// Modal-R16: teardown cleanup — restore scroll if unmounted while open.
		return () => {
			if (scrollLockActive) {
				document.body.style.overflow = prevBodyOverflow;
				scrollLockActive = false;
			}
		};
	});

	// -------------------------------------------------------------------------
	// Event handlers
	// -------------------------------------------------------------------------

	// Modal-R13: intercept the native cancel event (fired by Escape).
	// preventDefault suppresses the native close so dismissal is re-routed
	// through R9/R10. Escape ALWAYS closes — the WAI-ARIA dialog pattern
	// requires it, so there is deliberately no opt-out prop.
	function handleCancel(e: Event) {
		e.preventDefault();
		open = false;
	}

	// Modal-R14: close when the backdrop (dialog element itself) is clicked.
	// Clicks on inner content bubble up but carry the inner element as target.
	function handleDialogClick(e: MouseEvent) {
		if (closeOnOverlay && e.target === dialogEl) {
			open = false;
		}
	}

	// Modal-R15: close button handler.
	function handleClose() {
		open = false;
	}
</script>

<!--
	Modal-R1: Root <dialog> always rendered — never conditionally mounted.
	Visibility is driven by showModal() / close() (R8).
	Modal-R18: {...rest} spread first so managed attrs win.
-->
<dialog
	bind:this={dialogEl}
	{...rest}
	class={cx('hz-modal', className)}
	aria-modal="true"
	tabindex="-1"
	data-size={size}
	data-state={dataState}
	aria-labelledby={titleId}
	aria-describedby={description ? descId : undefined}
	oncancel={handleCancel}
	onclick={handleDialogClick}
>
	<!-- Modal-R2: Header — always rendered, contains title + optional close control,
	     plus the optional description on its own row (Modal-R3) so the body region
	     holds nothing but consumer content. -->
	<div class="hz-modal-header">
		<h2 id={titleId} class="hz-modal-title">{title}</h2>

		<!-- Modal-R15: Close control — composes library Button with IconX. -->
		{#if showClose}
			<Button ariaLabel={closeLabel} data-modal-close="" onclick={handleClose}>
				{#snippet iconStart()}
					<!-- IconX gets no ariaLabel → aria-hidden decorative (R15). -->
					<IconX />
				{/snippet}
			</Button>
		{/if}

		<!-- Modal-R3: Description — rendered only when description is a non-empty string. -->
		{#if description}
			<p id={descId} class="hz-modal-description">{description}</p>
		{/if}
	</div>

	<!-- Modal-R4: Body — always rendered; stable scroll region even when empty. -->
	<div class="hz-modal-body">
		{#if children}{@render children()}{/if}
	</div>

	<!-- Modal-R5: Footer — only rendered when actions snippet is provided. -->
	{#if actions}
		<div class="hz-modal-footer">{@render actions()}</div>
	{/if}
</dialog>

<style>
	/* ------------------------------------------------------------------ */
	/* Modal-R1: Root dialog — flex column so regions pin correctly.      */
	/* display only on [open] to avoid overriding the UA's display:none   */
	/* for the closed state.                                               */
	/* ------------------------------------------------------------------ */

	dialog {
		/* Reset browser-default padding so regions own their spacing. */
		padding: 0;
		/* Center in viewport (native top-layer centering via showModal). */
		margin: auto;
		/* No box visuals — colors/borders/shadows are a theme concern. */
	}

	dialog[open] {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* Ensure closed dialog is not visible (guards against cascade edge cases). */
	dialog:not([open]) {
		display: none;
	}

	/* ------------------------------------------------------------------ */
	/* Modal-R6: Size hook — width: var(--hz-modal-width, <fallback>)     */
	/* Mobile: max-width caps at viewport minus margin.                   */
	/* ------------------------------------------------------------------ */

	dialog[data-size='sm'][open] {
		width: var(--hz-modal-width, 30rem);
		max-width: calc(100% - var(--hz-space-xl, 8rem));
		max-height: calc(100dvh - var(--hz-space-xl, 8rem));
	}

	dialog[data-size='md'][open] {
		width: var(--hz-modal-width, 40rem);
		max-width: calc(100% - var(--hz-space-xl, 8rem));
		max-height: calc(100dvh - var(--hz-space-xl, 8rem));
	}

	dialog[data-size='lg'][open] {
		width: var(--hz-modal-width, 52rem);
		max-width: calc(100% - var(--hz-space-xl, 8rem));
		max-height: calc(100dvh - var(--hz-space-xl, 8rem));
	}

	/* Modal-R6 / Responsive: full fills the entire viewport. */
	dialog[data-size='full'][open] {
		width: 100vw;
		max-width: 100vw;
		height: 100dvh;
		max-height: 100dvh;
		margin: 0;
	}

	/* ------------------------------------------------------------------ */
	/* Modal-R2: Header — pinned (flex-shrink: 0), row layout.            */
	/* ------------------------------------------------------------------ */

	/* No gap: the title flexes so the close control already pins to the end,
	 * and the description row spaces itself via the theme. */
	.hz-modal-header {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		flex-shrink: 0;
	}

	/* Title grows to fill the row; close button sits at the end. */
	.hz-modal-title {
		flex: 1;
		margin: 0;
	}

	/* Description breaks onto its own full-width row under the title. */
	.hz-modal-description {
		flex-basis: 100%;
		margin: 0;
	}

	/* ------------------------------------------------------------------ */
	/* Modal-R4: Body — scrollable, grows to fill remaining space.        */
	/* min-height: 0 is required for flex overflow-y to engage.           */
	/* ------------------------------------------------------------------ */

	.hz-modal-body {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}

	/* ------------------------------------------------------------------ */
	/* Modal-R5: Footer — pinned at bottom (flex-shrink: 0).              */
	/* ------------------------------------------------------------------ */

	.hz-modal-footer {
		flex-shrink: 0;
	}
</style>
