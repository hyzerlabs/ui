<script lang="ts">
	import { tick } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { DropdownEntry, DropdownItem, DropdownTriggerProps } from '$lib/types';
	import { cx, uid } from '$lib/utils';
	import Button from './Button.svelte';
	import IconChevronDown from '$lib/icons/IconChevronDown.svelte';

	interface Props {
		items: DropdownEntry[];
		label?: string;
		triggerLabel?: string;
		triggerProps?: DropdownTriggerProps;
		triggerIcon?: Snippet;
		align?: 'start' | 'end';
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

	// Dropdown-R2: appearance defaults for the composed Button trigger.
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

	// Dropdown-R3/R4: the roving sequence — actionable items only, separators
	// excluded. Disabled items stay in the sequence (Dropdown-R10).
	const menuItems = $derived(items.filter((e): e is DropdownItem => !('separator' in e)));

	// ------------------------------------------------------------------
	// Internal state — open/activeId are ephemeral UI state, not props
	// (Context: "Internal open state").
	// ------------------------------------------------------------------

	let open = $state(false);
	let activeId = $state<string | null>(null);
	let rootEl = $state<HTMLDivElement | null>(null);

	function firstId(): string | null {
		return menuItems.length > 0 ? menuItems[0].id : null;
	}

	function lastId(): string | null {
		return menuItems.length > 0 ? menuItems[menuItems.length - 1].id : null;
	}

	/** Sets the active item and moves real DOM focus onto it (Dropdown-R6). */
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
	// Activation — Dropdown-R4/R9
	// ------------------------------------------------------------------

	function activate(item: DropdownItem): void {
		// Disabled items use aria-disabled (not native disabled), so a click
		// still dispatches — guard here (Dropdown-R10).
		if (item.disabled) return;
		item.onselect?.();
		onselect?.(item.id, item);
		closeMenu();
		focusTrigger();
	}

	// ------------------------------------------------------------------
	// Trigger — Dropdown-R5/R7
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
	// In-menu keyboard — Dropdown-R7/R8
	// ------------------------------------------------------------------

	function moveActive(delta: 1 | -1): void {
		const n = menuItems.length;
		if (n === 0) return;
		const currentIdx = menuItems.findIndex((it) => it.id === activeId);
		const nextIdx =
			currentIdx === -1 ? (delta === 1 ? 0 : n - 1) : (((currentIdx + delta) % n) + n) % n;
		setActive(menuItems[nextIdx].id);
	}

	/** Dropdown-R8: single-character cyclic typeahead, matching disabled items. */
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
				// preventDefault (Dropdown-R7); the focusout backstop below
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
	// Outside click / focus-out — Dropdown-R12 (no focus trap)
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
</script>

{#snippet chevron()}
	{#if triggerIcon}{@render triggerIcon()}{:else}<IconChevronDown />{/if}
{/snippet}

<!--
	Dropdown-R1: root is the menu's positioning ancestor and the focus-return /
	focus-containment anchor. Dropdown-R14: rest spreads first so component-
	managed attributes win.
-->
<div
	{...rest}
	bind:this={rootEl}
	class={cx('hz-dropdown', className)}
	data-open={open ? '' : undefined}
	data-align={align}
	data-state={disabled ? 'disabled' : undefined}
	onfocusout={onRootFocusOut}
>
	<!-- Dropdown-R2: trigger composes Button; menu-button ARIA reaches Button
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

	<!-- Dropdown-R3: rendered at all times, hidden via CSS while closed
	     (Dropdown-R17) so a closed menu is out of the a11y tree. -->
	<ul
		id={menuId}
		class="hz-dropdown-menu"
		role="menu"
		aria-labelledby={triggerId}
		onkeydown={onMenuKeydown}
	>
		{#each items as entry, i (entryKey(entry, i))}
			{#if 'separator' in entry}
				<li role="separator" class="hz-dropdown-separator"></li>
			{:else}
				<li role="none">
					<!-- Dropdown-R6: roving tabindex — the active item is the sole
					     tab stop. Dropdown-R10: disabled items stay focusable
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
	/* Dropdown-R17: structural CSS only — all chrome is theme/dropdown.css. */

	.hz-dropdown {
		position: relative;
		display: inline-block;
	}

	.hz-dropdown-menu {
		position: absolute;
		top: 100%;
		inset-inline-start: 0;
		min-width: max-content;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.hz-dropdown[data-align='end'] .hz-dropdown-menu {
		inset-inline-start: auto;
		inset-inline-end: 0;
	}

	/* Closed menu is out of the accessibility tree — its items are not
	   focusable. */
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
