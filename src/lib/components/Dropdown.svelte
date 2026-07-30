<script lang="ts">
	import { tick } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { DropdownEntry, DropdownItem, DropdownTriggerProps } from '$lib/types';
	import { cx, uid } from '$lib/utils';
	import Button from './Button.svelte';
	import IconChevronDown from '$lib/icons/generated/chevron-down.svelte';
	import { position, supportsPopoverApi } from '../positioning/index.js';

	// reproduces today's rendered gap (structural `top: 100%`
	// plus the theme's former `margin-top: 0.25rem`, i.e. 4px at the root font
	// size) — hardcoded here now that the core, not the theme, owns the gap.
	const DROPDOWN_OFFSET = 4;

	interface Props {
		items: DropdownEntry[];
		label?: string;
		triggerLabel?: string;
		triggerProps?: DropdownTriggerProps;
		triggerIcon?: Snippet;
		align?: 'start' | 'center' | 'end';
		onselect?: (id: string, item: DropdownItem) => void;
		disabled?: boolean;
		class?: string;
		[key: string]: unknown;
	}

	let {
		items,
		label,
		triggerLabel,
		triggerProps = {},
		triggerIcon,
		align = 'start',
		onselect,
		disabled = false,
		class: className,
		...rest
	}: Props = $props();

	// appearance defaults for the composed Button trigger.
	const mergedVariant = $derived(triggerProps.variant ?? 'outline');
	const mergedIntent = $derived(triggerProps.intent ?? 'neutral');

	// One stable id base per instance (Context: uid convention).
	const _uid = uid('hz-dd');
	const triggerId = `hz-dd-trigger-${_uid}`;
	const menuId = `hz-dd-menu-${_uid}`;
	function itemId(id: string): string {
		return `hz-dd-item-${_uid}-${id}`;
	}
	function entryKey(entry: DropdownEntry, i: number): string {
		return 'separator' in entry ? `hz-dd-sep-${i}` : entry.id;
	}

	// the roving sequence — actionable items only, separators
	// excluded. Disabled items stay in the sequence.
	const menuItems = $derived(items.filter((e): e is DropdownItem => !('separator' in e)));

	// ------------------------------------------------------------------
	// Internal state — open/activeId are ephemeral UI state, not props
	// (Context: "Internal open state").
	// ------------------------------------------------------------------

	let open = $state(false);
	let activeId = $state<string | null>(null);
	let rootEl = $state<HTMLDivElement | null>(null);
	let menuEl = $state<HTMLUListElement | null>(null);

	// teardown for the core's active positioning (scroll/
	// resize tracking on the JS-fallback path) — stored across the open/close
	// cycle, not reactive state (the Popover.svelte precedent).
	let stopPositioning: (() => void) | null = null;

	function firstId(): string | null {
		return menuItems.length > 0 ? menuItems[0].id : null;
	}

	function lastId(): string | null {
		return menuItems.length > 0 ? menuItems[menuItems.length - 1].id : null;
	}

	/** Sets the active item and moves real DOM focus onto it. */
	function setActive(id: string | null): void {
		activeId = id;
		if (id === null) return;
		document.getElementById(itemId(id))?.focus();
	}

	/**
	 * Opens the menu (if not already open) focused on the first or last
	 * menuitem. Focus is moved after the menu is shown — deferred via tick(),
	 * per Nav — since a closed menu's items are display:none and unfocusable
	 * until the DOM reflects the new data-open state.
	 */
	async function openTo(pos: 'first' | 'last'): Promise<void> {
		open = true;
		await tick();
		setActive(pos === 'first' ? firstId() : lastId());
	}

	function closeMenu(): void {
		open = false;
		activeId = null;
	}

	function focusTrigger(): void {
		rootEl?.querySelector<HTMLElement>('.hz-dropdown-trigger')?.focus();
	}

	// ------------------------------------------------------------------
	// Activation
	// ------------------------------------------------------------------

	function activate(item: DropdownItem): void {
		// Disabled items use aria-disabled (not native disabled), so a click
		// still dispatches — guard here.
		if (item.disabled) return;
		item.onselect?.();
		onselect?.(item.id, item);
		closeMenu();
		focusTrigger();
	}

	// ------------------------------------------------------------------
	// Trigger
	// ------------------------------------------------------------------

	function onTriggerClick(): void {
		if (disabled) return;
		if (open) {
			closeMenu();
		} else {
			openTo('first');
		}
	}

	function onTriggerKeydown(e: KeyboardEvent): void {
		if (disabled) return;
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				openTo('first');
				break;
			case 'ArrowUp':
				e.preventDefault();
				openTo('last');
				break;
			case 'Escape':
				if (open) closeMenu();
				break;
		}
	}

	// ------------------------------------------------------------------
	// In-menu keyboard
	// ------------------------------------------------------------------

	function moveActive(delta: 1 | -1): void {
		const n = menuItems.length;
		if (n === 0) return;
		const currentIdx = menuItems.findIndex((it) => it.id === activeId);
		const nextIdx =
			currentIdx === -1 ? (delta === 1 ? 0 : n - 1) : (((currentIdx + delta) % n) + n) % n;
		setActive(menuItems[nextIdx].id);
	}

	/** single-character cyclic typeahead, matching disabled items. */
	function typeahead(char: string): void {
		const n = menuItems.length;
		if (n === 0) return;
		const lower = char.toLowerCase();
		const currentIdx = menuItems.findIndex((it) => it.id === activeId);
		for (let step = 1; step <= n; step++) {
			const idx = (currentIdx + step + n) % n;
			if (menuItems[idx].label.toLowerCase().startsWith(lower)) {
				setActive(menuItems[idx].id);
				return;
			}
		}
	}

	function onMenuKeydown(e: KeyboardEvent): void {
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				moveActive(1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				moveActive(-1);
				break;
			case 'Home':
				e.preventDefault();
				setActive(firstId());
				break;
			case 'End':
				e.preventDefault();
				setActive(lastId());
				break;
			case 'Escape':
				e.preventDefault();
				closeMenu();
				focusTrigger();
				break;
			case 'Tab':
				// Close and let the browser's native focus move proceed — no
				// preventDefault; the focusout backstop below
				// also closes as focus actually leaves the root.
				closeMenu();
				break;
			case ' ':
				// Space is not typeahead — the item button handles it natively.
				break;
			default:
				if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
					typeahead(e.key);
				}
		}
	}

	// ------------------------------------------------------------------
	// Outside click / focus-out (no focus trap)
	// ------------------------------------------------------------------

	function onDocumentClick(e: MouseEvent): void {
		if (!open) return;
		if (rootEl && e.composedPath().includes(rootEl)) return;
		closeMenu();
	}

	function onRootFocusOut(e: FocusEvent): void {
		if (!open) return;
		const related = e.relatedTarget as HTMLElement | null;
		if (related && rootEl?.contains(related)) return;
		closeMenu();
	}

	$effect(() => {
		document.addEventListener('click', onDocumentClick);
		return () => document.removeEventListener('click', onDocumentClick);
	});

	// ------------------------------------------------------------------
	// Menu positioning and top layer — reconciles
	// `open` with the menu's showPopover()/hidePopover() (guarded so it is a
	// no-op on SSR/before mount, the Popover.svelte precedent). `"manual"`,
	// not `"auto"`: Dropdown already owns dismissal (onDocumentClick/
	// onRootFocusOut/Escape above), so the browser must never light-dismiss
	// or Escape-dismiss the menu itself — unlike Popover, there is no native
	// invoker here to race against and no native auto-dismiss to reconcile
	// against, so — unlike Popover's toggle-event-gated handleShown/
	// handleHidden — positioning and the popover call run synchronously
	// together, in lockstep with `open`, keeping the existing
	// openTo() → tick() → focus sequencing exactly as it was.
	// On a browser without the Popover API, `popover="manual"` is inert and
	// the existing CSS `display` toggling (driven by the root's data-open)
	// remains the whole visibility mechanism, unchanged.
	// ------------------------------------------------------------------

	$effect(() => {
		if (!menuEl) return;
		if (open) {
			if (supportsPopoverApi() && typeof menuEl.showPopover === 'function') {
				try {
					menuEl.showPopover();
				} catch {
					// Already shown — no-op.
				}
			}
			const triggerEl = document.getElementById(triggerId) ?? rootEl;
			if (triggerEl) {
				// Data-side/data-align reflect the RESOLVED (post-flip)
				// placement, measured from real layout, so a consumer-drawn caret
				// always points at the trigger after a flip.
				const resolved = position(triggerEl, menuEl, {
					side: 'bottom',
					align,
					offset: DROPDOWN_OFFSET
				});
				stopPositioning = resolved.stop;
				menuEl.setAttribute('data-side', resolved.side);
				menuEl.setAttribute('data-align', resolved.align);
			}
		} else {
			if (supportsPopoverApi() && typeof menuEl.hidePopover === 'function') {
				try {
					menuEl.hidePopover();
				} catch {
					// Already hidden — no-op.
				}
			}
			stopPositioning?.();
			stopPositioning = null;
		}
	});

	// Teardown safety net — an instance unmounted while open must not leak
	// the JS-fallback path's scroll/resize listeners.
	$effect(() => {
		return () => stopPositioning?.();
	});
</script>

{#snippet chevron()}
	{#if triggerIcon}{@render triggerIcon()}{:else}<IconChevronDown />{/if}
{/snippet}

<!--
	root is the menu's positioning ancestor and the focus-return /
	focus-containment anchor. rest spreads first so component-
	managed attributes win.
-->
<div
	{...rest}
	bind:this={rootEl}
	class={cx('hz-dropdown', className)}
	data-open={open ? '' : undefined}
	data-state={disabled ? 'disabled' : undefined}
	onfocusout={onRootFocusOut}
>
	<!-- trigger composes Button; menu-button ARIA reaches Button
	     via ...rest. Two branches (rather than a conditional icon prop) keep
	     Button's iconOnly derivation (no children ⇒ icon-only circle) intact. -->
	{#if label}
		<Button
			id={triggerId}
			class={cx('hz-dropdown-trigger', triggerProps.class)}
			variant={mergedVariant}
			intent={mergedIntent}
			size={triggerProps.size}
			{disabled}
			ariaLabel={triggerLabel}
			aria-haspopup="menu"
			aria-expanded={open ? 'true' : 'false'}
			aria-controls={menuId}
			onclick={onTriggerClick}
			onkeydown={onTriggerKeydown}
		>
			{#snippet iconEnd()}{@render chevron()}{/snippet}
			{label}
		</Button>
	{:else}
		<Button
			id={triggerId}
			class={cx('hz-dropdown-trigger', triggerProps.class)}
			variant={mergedVariant}
			intent={mergedIntent}
			size={triggerProps.size}
			{disabled}
			ariaLabel={triggerLabel}
			aria-haspopup="menu"
			aria-expanded={open ? 'true' : 'false'}
			aria-controls={menuId}
			onclick={onTriggerClick}
			onkeydown={onTriggerKeydown}
		>
			{#snippet iconStart()}{@render chevron()}{/snippet}
		</Button>
	{/if}

	<!-- rendered at all times, hidden via CSS while closed
 so a closed menu is out of the a11y tree.
	     Popover="manual" — top-layer escape, dismissal stays
	     component-owned (never native light-dismiss/Escape). -->
	<ul
		bind:this={menuEl}
		id={menuId}
		class="hz-dropdown-menu"
		role="menu"
		aria-labelledby={triggerId}
		popover="manual"
		onkeydown={onMenuKeydown}
	>
		{#each items as entry, i (entryKey(entry, i))}
			{#if 'separator' in entry}
				<li role="separator" class="hz-dropdown-separator"></li>
			{:else}
				<li role="none">
					<!-- roving tabindex — the active item is the sole
					     tab stop. disabled items stay focusable
					     (aria-disabled, not native disabled). -->
					<button
						id={itemId(entry.id)}
						type="button"
						role="menuitem"
						class="hz-dropdown-item"
						tabindex={activeId === entry.id ? 0 : -1}
						data-danger={entry.danger ? '' : undefined}
						data-disabled={entry.disabled ? '' : undefined}
						aria-disabled={entry.disabled ? 'true' : undefined}
						onclick={() => activate(entry)}
					>
						{#if entry.icon}
							<span class="hz-dropdown-item-icon" aria-hidden="true">{@render entry.icon()}</span>
						{/if}
						{entry.label}
					</button>
				</li>
			{/if}
		{/each}
	</ul>
</div>

<style>
	/* structural CSS only — all chrome is theme/dropdown.css.
 no positioning CSS here anymore — the menu is
	   position: fixed, placed by the shared positioning core (anchor path or
	   the JS measure-and-place fallback), same as Popover's panel. */

	.hz-dropdown {
		display: inline-block;
	}

	.hz-dropdown-menu {
		min-width: max-content;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	/* Closed menu is out of the accessibility tree — its items are not
	   focusable. Also correct without the Popover API: popover="manual" is
	   then inert, so this is the only visibility mechanism. */
	.hz-dropdown:not([data-open]) .hz-dropdown-menu {
		display: none;
	}

	.hz-dropdown-item {
		display: flex;
		align-items: center;
		width: 100%;
		text-align: start;
		appearance: none;
		background: none;
		border: none;
		cursor: pointer;
	}

	.hz-dropdown-item[data-disabled] {
		cursor: not-allowed;
	}
</style>
