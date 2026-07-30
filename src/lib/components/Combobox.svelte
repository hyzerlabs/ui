<script lang="ts">
	import type { FieldBase, FormOption, ComboboxChipProps } from '$lib/types';
	import { cx, uid } from '$lib/utils';
	import Field from './Field.svelte';
	import Badge from './Badge.svelte';
	import IconChevronDown from '$lib/icons/generated/chevron-down.svelte';

	interface Props extends FieldBase {
		options: FormOption[];
		value?: string[];
		placeholder?: string;
		filter?: (query: string, option: FormOption) => boolean;
		emptyText?: string;
		toggleLabel?: string;
		chipProps?: ComboboxChipProps;
		onchange?: (value: string[]) => void;
		class?: string;
		[key: string]: unknown;
	}

	let {
		name,
		label,
		description,
		error,
		required = false,
		disabled = false,
		hideLabel = false,
		options,
		value = $bindable([]),
		placeholder = 'Search...',
		filter,
		emptyText = 'No results',
		toggleLabel = 'Show options',
		chipProps = {},
		onchange,
		class: className,
		...rest
	}: Props = $props();

	// derive one stable uid base per instance.
	const _uid = uid('hz');
	const inputId = `hz-input-${_uid}`;
	const descId = `hz-desc-${_uid}`;
	const errorId = `hz-error-${_uid}`;
	const listboxId = `hz-listbox-${_uid}`;

	// per-visible-option ids, keyed off the filtered index.
	function optionId(i: number): string {
		return `hz-opt-${_uid}-${i}`;
	}

	// aria-describedby chain.
	const describedBy = $derived(
		[description ? descId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
	);

	// default filter — case-insensitive substring on the label.
	function defaultFilter(q: string, option: FormOption): boolean {
		return option.label.toLowerCase().includes(q.toLowerCase());
	}

	// ------------------------------------------------------------------
	// Internal state — open is ephemeral UI state, not a prop (Context).
	// ------------------------------------------------------------------

	let open = $state(false);
	let query = $state('');
	let activeIndex = $state<number | null>(null);
	let inputEl = $state<HTMLInputElement | null>(null);

	// the options (if any) matching the strict committed values,
	// in selection order. An entry with no matching option contributes no
	// chip and no hidden input — the array itself is never mutated/pruned.
	const selectedOptions = $derived(
		value
			.map((v) => options.find((o) => o.value === v))
			.filter((o): o is FormOption => o !== undefined)
	);

	// visible options — unfiltered when the query is empty
	// (never a selected label, since the input only ever holds the filter
	// query); otherwise filtered by the consumer's `filter` or the default
	// case-insensitive substring.
	const visibleOptions = $derived.by((): FormOption[] => {
		if (query === '') return options;
		const f = filter ?? defaultFilter;
		return options.filter((o) => f(query, o));
	});

	// ------------------------------------------------------------------
	// Active-option (virtual focus) navigation
	// ------------------------------------------------------------------

	function firstEnabled(list: FormOption[]): number | null {
		const i = list.findIndex((o) => !o.disabled);
		return i === -1 ? null : i;
	}

	function lastEnabled(list: FormOption[]): number | null {
		for (let i = list.length - 1; i >= 0; i--) {
			if (!list[i].disabled) return i;
		}
		return null;
	}

	function nextEnabled(list: FormOption[], from: number | null): number | null {
		if (list.length === 0) return null;
		const start = from === null ? -1 : from;
		for (let step = 1; step <= list.length; step++) {
			const i = (start + step) % list.length;
			if (!list[i].disabled) return i;
		}
		return null;
	}

	function prevEnabled(list: FormOption[], from: number | null): number | null {
		if (list.length === 0) return null;
		const start = from === null ? 0 : from;
		for (let step = 1; step <= list.length; step++) {
			const i = (((start - step) % list.length) + list.length) % list.length;
			if (!list[i].disabled) return i;
		}
		return null;
	}

	/** Open the popup and set the active option via the given selector. */
	function openPopup(activeFn: (list: FormOption[]) => number | null) {
		open = true;
		activeIndex = activeFn(visibleOptions);
	}

	// ------------------------------------------------------------------
	// Selection commit
	// ------------------------------------------------------------------

	/** Toggles `option`'s membership in `value` (append if absent, remove if present). */
	function toggleMembership(option: FormOption) {
		const idx = value.indexOf(option.value);
		value = idx === -1 ? [...value, option.value] : value.filter((v) => v !== option.value);
		onchange?.(value);
	}

	function commit(option: FormOption) {
		if (option.disabled) return;
		toggleMembership(option);
		// Clears the query so the list re-filters to the full options array —
		// the active index below is derived against `options` directly (not
		// `visibleOptions`, which only recomputes on the next read) since an
		// empty query always makes the visible list equal to `options`.
		query = '';
		const nextIdx = options.findIndex((o) => o.value === option.value);
		activeIndex = nextIdx === -1 ? null : nextIdx;
		// Popup stays open; DOM focus never left the input
		// (mousedown on the option is prevented below), but return it
		// explicitly.
		inputEl?.focus();
	}

	// dismissing a chip removes that value, fires onchange, and
	// moves focus to the input. Popup open state is unchanged.
	function removeChip(v: string) {
		value = value.filter((x) => x !== v);
		onchange?.(value);
		inputEl?.focus();
	}

	// ------------------------------------------------------------------
	// Keyboard
	// ------------------------------------------------------------------

	function onInputKeydown(e: KeyboardEvent) {
		switch (e.key) {
			case 'ArrowDown': {
				e.preventDefault();
				if (e.altKey) {
					// Alt+ArrowDown: open without moving the active option.
					open = true;
					return;
				}
				if (!open) openPopup(firstEnabled);
				else activeIndex = nextEnabled(visibleOptions, activeIndex);
				return;
			}
			case 'ArrowUp': {
				e.preventDefault();
				if (e.altKey) {
					// Alt+ArrowUp: close; value and the query are unchanged.
					open = false;
					activeIndex = null;
					return;
				}
				if (!open) openPopup(lastEnabled);
				else activeIndex = prevEnabled(visibleOptions, activeIndex);
				return;
			}
			case 'Home': {
				// Closed: native text-cursor behavior — no preventDefault.
				if (!open) return;
				e.preventDefault();
				activeIndex = firstEnabled(visibleOptions);
				return;
			}
			case 'End': {
				if (!open) return;
				e.preventDefault();
				activeIndex = lastEnabled(visibleOptions);
				return;
			}
			case 'Enter': {
				// Always preventDefault so an enclosing form does not submit.
				e.preventDefault();
				if (activeIndex !== null) {
					const opt = visibleOptions[activeIndex];
					if (opt && !opt.disabled) {
						commit(opt);
						return;
					}
				}
				// No active option: close with no change.
				open = false;
				activeIndex = null;
				return;
			}
			case 'Escape': {
				e.preventDefault();
				if (open) {
					// Open → close + clear the query. Selections are untouched —
					// Escape never clears value (chips carry their own dismiss).
					open = false;
					activeIndex = null;
					query = '';
				} else {
					// Closed → clear the query text only.
					query = '';
				}
				return;
			}
			case 'Backspace': {
				// Text present: native editing (no interception).
				if (query !== '') return;
				// No chips to remove: no-op. No preventDefault needed either way
				// — an already-empty input has nothing for the browser to do.
				if (value.length === 0) return;
				value = value.slice(0, -1);
				onchange?.(value);
				return;
			}
			case 'Tab': {
				// Close and let focus move naturally; blur reconciliation
				// (onControlFocusOut) runs as focus actually leaves the control.
				open = false;
				activeIndex = null;
				return;
			}
		}
	}

	// The "character / editing keys" case: the 'input' event covers
	// typing, backspace/delete, cut, and paste uniformly.
	// a forwarded rest `oninput` still reaches the input —
	// unlike the key/pointer handlers, Svelte does not compose two same-named
	// event props on one element, so this chains it manually.
	function onInputInput(e: Event) {
		if (typeof rest.oninput === 'function') {
			(rest.oninput as (e: Event) => void)(e);
		}
		query = (e.currentTarget as HTMLInputElement).value;
		open = true;
		activeIndex = firstEnabled(visibleOptions);
	}

	// pointer click on the input opens (does not commit).
	function onInputClick() {
		if (!open) openPopup(firstEnabled);
	}

	// the toggle button opens/closes and returns focus to the
	// input; mousedown below already keeps DOM focus on the input throughout.
	function onToggleClick() {
		if (open) {
			open = false;
			activeIndex = null;
		} else {
			openPopup(firstEnabled);
		}
		inputEl?.focus();
	}

	// A mouse press inside the control whose default ISN'T cancelled — the
	// options and toggle preventDefault, but the listbox's own SCROLLBAR
	// can't — blurs the input with a null relatedTarget, which would read as
	// "focus left the control" below and close the popup mid-scroll. Track
	// the press so that focusout can tell a scrollbar grab from a genuine
	// departure; cleared on the next mouseup wherever it lands.
	let pressInsideControl = false;
	function onControlMousedown() {
		pressInsideControl = true;
		window.addEventListener('mouseup', () => (pressInsideControl = false), {
			once: true,
			capture: true
		});
	}

	// focus leaving the whole control (relatedTarget not within
	// .hz-combobox — chips and the input are both "within") clears the query
	// and closes the popup. `value` (the chips) is never touched by blur.
	function onControlFocusOut(e: FocusEvent) {
		if (pressInsideControl) {
			// A scrollbar (or other non-option) press inside the control stole
			// focus — keep the popup open and hand focus back to the input.
			inputEl?.focus();
			return;
		}
		const related = e.relatedTarget as HTMLElement | null;
		if (related && related.closest('.hz-combobox')) return;
		open = false;
		activeIndex = null;
		query = '';
	}

	// outside pointer click closes the popup — mirrors
	// Nav.svelte's document-level outside-click plumbing, but walks
	// composedPath() rather than target.closest(): a chip dismiss click
	// removes its own Badge from the DOM mid-dispatch, and a
	// detached node's closest() can no longer see its former ancestors —
	// composedPath() is captured at dispatch time and stays accurate.
	function onDocumentClick(e: MouseEvent) {
		if (!open) return;
		const withinControl = e
			.composedPath()
			.some((el) => el instanceof Element && el.classList.contains('hz-combobox'));
		if (!withinControl) {
			open = false;
			activeIndex = null;
		}
	}

	$effect(() => {
		document.addEventListener('click', onDocumentClick);
		return () => document.removeEventListener('click', onDocumentClick);
	});

	// scroll the active option into view — instant, so it is
	// reduced-motion-safe.
	$effect(() => {
		if (activeIndex === null) return;
		document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
	});
</script>

<!--
	Field scaffold via the control snippet — control row (chips +
	input + toggle + popup, in order), then one hidden input per selected
	value.
	role="combobox" input, APG 1.2 attributes.
	{...rest} spread first on the visible input so
	component-managed attributes win; rest never lands on the hidden inputs,
	chips, toggle, or listbox.
-->
{#snippet control()}
	<!-- The mousedown only tracks press state for the focusout guard above —
	     the div itself is not an interactive control. -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="hz-combobox-control"
		data-open={open ? '' : undefined}
		onmousedown={onControlMousedown}
		onfocusout={onControlFocusOut}
	>
		<!-- one Badge chip per selected value, in selection order. -->
		{#each selectedOptions as option (option.value)}
			<Badge
				size="sm"
				{...chipProps}
				onDismiss={disabled ? undefined : () => removeChip(option.value)}
				dismissLabel={`Remove ${option.label}`}
			>
				{option.label}
			</Badge>
		{/each}

		<input
			{...rest}
			bind:this={inputEl}
			id={inputId}
			type="text"
			autocomplete="off"
			class="hz-combobox-input"
			role="combobox"
			value={query}
			placeholder={value.length === 0 ? placeholder : undefined}
			{disabled}
			aria-autocomplete="list"
			aria-expanded={open ? 'true' : 'false'}
			aria-controls={listboxId}
			aria-haspopup="listbox"
			aria-activedescendant={activeIndex !== null ? optionId(activeIndex) : undefined}
			aria-required={required ? 'true' : undefined}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
			oninput={onInputInput}
			onkeydown={onInputKeydown}
			onclick={onInputClick}
		/>

		<!-- out of tab order; toggles open/closed by pointer. -->
		<button
			type="button"
			class="hz-combobox-toggle"
			tabindex="-1"
			aria-label={toggleLabel}
			{disabled}
			onmousedown={(e) => e.preventDefault()}
			onclick={onToggleClick}
		>
			<IconChevronDown />
		</button>

		<!-- popup is the control's last child so it anchors
		     to the control's bottom edge; always in the DOM, hidden via CSS
		     while closed. -->
		<div class="hz-combobox-popup">
			<ul
				class="hz-combobox-listbox"
				id={listboxId}
				role="listbox"
				aria-label={label}
				aria-multiselectable="true"
			>
				{#if visibleOptions.length === 0}
					<!-- empty state — not an option, never active. -->
					<li class="hz-combobox-empty" role="presentation">{emptyText}</li>
				{:else}
					{#each visibleOptions as option, i (option.value)}
						<!--
							options are plain, non-focusable <li>s (no
							tabindex) — DOM focus never leaves the input, and keyboard
							activation happens there (Enter), not on the option itself.
						-->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<li
							id={optionId(i)}
							role="option"
							class="hz-combobox-option"
							aria-selected={value.includes(option.value) ? 'true' : 'false'}
							data-active={activeIndex === i ? '' : undefined}
							data-selected={value.includes(option.value) ? '' : undefined}
							data-disabled={option.disabled ? '' : undefined}
							aria-disabled={option.disabled ? 'true' : undefined}
							onmousedown={(e) => e.preventDefault()}
							onclick={() => commit(option)}
						>
							{option.label}
						</li>
					{/each}
				{/if}
			</ul>
		</div>
	</div>

	<!-- one hidden input per selected value, in selection order;
	     unknown entries (no matching option) contribute nothing. -->
	{#each selectedOptions as option (option.value)}
		<input type="hidden" {name} value={option.value} />
	{/each}
{/snippet}

<!-- root class is cx('hz-field hz-combobox', className). -->
<Field
	{label}
	{description}
	{error}
	{required}
	{disabled}
	{hideLabel}
	{inputId}
	{descId}
	{errorId}
	dataOpen={open}
	class={cx('hz-field hz-combobox', className)}
	{control}
/>

<style>
	/* structural CSS only — no chrome. */

	.hz-combobox-control {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		/* The popup's positioning ancestor — anchors directly under the
		   control box regardless of description/error text below. */
		position: relative;
	}

	.hz-combobox-input {
		flex: 1;
		min-width: 0;
	}

	.hz-combobox-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		appearance: none;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		flex-shrink: 0;
	}

	.hz-combobox-toggle:disabled {
		cursor: not-allowed;
	}

	.hz-combobox-popup {
		position: absolute;
		inset-inline: 0;
		top: 100%;
	}

	/* rendered at all times, hidden via CSS while closed. */
	:global(.hz-combobox:not([data-open])) .hz-combobox-popup {
		display: none;
	}

	/* the popup overlays the description/error region while
	   open, so they are visually suppressed (but stay in the DOM — the
	   aria-describedby chain still resolves against hidden elements). */
	:global(.hz-combobox[data-open] .hz-field-description),
	:global(.hz-combobox[data-open] .hz-field-error) {
		visibility: hidden;
	}

	.hz-combobox-listbox {
		list-style: none;
		margin: 0;
		padding: 0;
		overflow-y: auto;
	}

	.hz-combobox-option {
		display: flex;
	}
</style>
