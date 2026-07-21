<script lang="ts" module>
	/** One searchable destination. `context` is the breadcrumb, e.g. "Components · Forms". */
	export interface CommandItem {
		label: string;
		href: string;
		context: string;
	}
</script>

<script lang="ts">
	import IconSearch from '$lib/icons/IconSearch.svelte';
	import { uid } from '$lib/utils';

	interface Props {
		/** The full destination index (built from the manifest by the shell). */
		items: CommandItem[];
		/** Called with the chosen href — the shell owns navigation (goto). */
		onSelect: (href: string) => void;
		/**
		 * `inline` drops the results right under the header input; `modal` opens a
		 * centered overlay with a backdrop (nothing behind it shows through).
		 */
		mode?: 'inline' | 'modal';
		placeholder?: string;
		/** Cap on rendered results. */
		limit?: number;
	}

	let {
		items,
		onSelect,
		mode = 'inline',
		placeholder = 'Search docs…',
		limit = 50
	}: Props = $props();

	let query = $state('');
	let activeIndex = $state(0);
	let inputEl = $state<HTMLInputElement>();
	let boxEl = $state<HTMLDivElement>();
	let modalOpen = $state(false);
	let inlineFocused = $state(false);
	// Inline results are position:fixed (the sidebar clips overflow); these come
	// from the input box's rect when the list opens.
	let rect = $state({ top: 0, left: 0, width: 0 });

	const listId = uid('cmd-list');
	const optionId = (i: number) => `${listId}-opt-${i}`;

	const results = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [];
		return items
			.filter((it) => `${it.context} ${it.label}`.toLowerCase().includes(q))
			.slice(0, limit);
	});

	// Results show while there's a query and the palette is active (focused
	// inline, or opened as a modal).
	const showResults = $derived(
		query.trim().length > 0 && (mode === 'modal' ? modalOpen : inlineFocused)
	);

	// Keep the active option in range as the result set shrinks.
	$effect(() => {
		if (activeIndex > results.length - 1) activeIndex = 0;
	});

	// Inline: anchor the fixed dropdown under the input (the header doesn't
	// scroll, so one measure per open is enough).
	$effect(() => {
		if (mode === 'inline' && showResults && boxEl) {
			const r = boxEl.getBoundingClientRect();
			rect = { top: r.bottom, left: r.left, width: r.width };
		}
	});

	// Modal: focus the field once it mounts.
	$effect(() => {
		if (modalOpen && inputEl) inputEl.focus();
	});

	function close() {
		modalOpen = false;
		inlineFocused = false;
		query = '';
	}

	function choose(i: number) {
		const item = results[i];
		if (!item) return;
		onSelect(item.href);
		close();
		inputEl?.blur();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (results.length) activeIndex = (activeIndex + 1) % results.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (results.length) activeIndex = (activeIndex - 1 + results.length) % results.length;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			choose(activeIndex);
		} else if (e.key === 'Escape') {
			e.preventDefault();
			// First Escape clears the query; a second closes (modal) or blurs (inline).
			if (query) query = '';
			else if (mode === 'modal') close();
			else inputEl?.blur();
		}
	}

	// Global Cmd/Ctrl+K: open the modal, or focus the inline field.
	$effect(() => {
		function onGlobal(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				if (mode === 'modal') modalOpen = true;
				else {
					inputEl?.focus();
					inputEl?.select();
				}
			}
		}
		document.addEventListener('keydown', onGlobal);
		return () => document.removeEventListener('keydown', onGlobal);
	});
</script>

{#snippet field(inModal: boolean)}
	<span class="cmd-icon" aria-hidden="true"><IconSearch /></span>
	<input
		bind:this={inputEl}
		class="cmd-input"
		type="text"
		role="combobox"
		aria-expanded={showResults}
		aria-controls={listId}
		aria-activedescendant={showResults && results.length ? optionId(activeIndex) : undefined}
		aria-label="Search documentation"
		autocomplete="off"
		spellcheck="false"
		{placeholder}
		bind:value={query}
		onfocus={() => {
			if (!inModal) inlineFocused = true;
		}}
		onblur={() => {
			if (!inModal) inlineFocused = false;
		}}
		onkeydown={onKeydown}
	/>
	{#if !inModal}<kbd class="cmd-hint" aria-hidden="true">⌘K</kbd>{/if}
{/snippet}

{#snippet resultsPanel()}
	<ul id={listId} role="listbox" aria-label="Search results">
		{#each results as item, i (item.href)}
			<li
				id={optionId(i)}
				role="option"
				aria-selected={i === activeIndex}
				class="cmd-option"
				data-active={i === activeIndex ? '' : undefined}
				onmousedown={(e) => {
					// Select before the input blurs.
					e.preventDefault();
					choose(i);
				}}
				onmousemove={() => (activeIndex = i)}
			>
				<span class="cmd-option-label">{item.label}</span>
				{#if item.context}<span class="cmd-option-context">{item.context}</span>{/if}
			</li>
		{/each}
	</ul>
	{#if results.length === 0}
		<p class="cmd-empty">No matches for "{query.trim()}"</p>
	{/if}
{/snippet}

{#if mode === 'modal'}
	<button
		type="button"
		class="cmd cmd-trigger"
		aria-haspopup="dialog"
		aria-expanded={modalOpen}
		onclick={() => (modalOpen = true)}
	>
		<span class="cmd-icon" aria-hidden="true"><IconSearch /></span>
		<span class="cmd-trigger-label">{placeholder}</span>
		<kbd class="cmd-hint" aria-hidden="true">⌘K</kbd>
	</button>
	{#if modalOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div class="cmd-backdrop" onclick={close}></div>
		<div class="cmd-modal" role="dialog" aria-modal="true" aria-label="Search documentation">
			<div class="cmd cmd-modal-field">
				{@render field(true)}
			</div>
			{#if showResults}
				<div class="cmd-results cmd-results--modal">
					{@render resultsPanel()}
				</div>
			{/if}
		</div>
	{/if}
{:else}
	<div class="cmd" bind:this={boxEl}>
		{@render field(false)}
	</div>
	{#if showResults}
		<div
			class="cmd-results"
			style:top="{rect.top}px"
			style:left="{rect.left}px"
			style:width="{rect.width}px"
		>
			{@render resultsPanel()}
		</div>
	{/if}
{/if}

{#if showResults}
	<div class="sr-only" aria-live="polite">
		{results.length}
		{results.length === 1 ? 'result' : 'results'}
	</div>
{/if}

<style>
	.cmd {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0 0.625rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		background: color-mix(in srgb, var(--hz-color-text, #000) 4%, transparent);
		box-sizing: border-box;
	}

	.cmd:focus-within {
		border-color: var(--hz-color-primary, #2563eb);
	}

	/* Modal trigger — a button that reads as a search field. */
	.cmd-trigger {
		font: inherit;
		text-align: left;
		cursor: pointer;
		color: var(--hz-color-text-muted, #6b7280);
		min-height: 2.25rem;
	}

	.cmd-trigger:hover {
		border-color: var(--hz-color-text-muted, #6b7280);
	}

	.cmd-trigger-label {
		flex: 1;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.cmd-icon {
		display: inline-flex;
		color: var(--hz-color-text-muted, #6b7280);
	}

	.cmd-icon :global(.hz-icon) {
		width: 1rem;
		height: 1rem;
	}

	.cmd-input {
		flex: 1;
		min-width: 0;
		border: none;
		background: none;
		padding: 0.4rem 0;
		font: inherit;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: inherit;
	}

	.cmd-input:focus {
		outline: none;
	}

	.cmd-input::placeholder {
		color: var(--hz-color-text-muted, #6b7280);
	}

	.cmd-hint {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: var(--hz-font-size-xs, 0.75rem);
		color: var(--hz-color-text-muted, #6b7280);
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-sm, 0.25rem);
		padding: 0.05rem 0.3rem;
		flex-shrink: 0;
	}

	/* Results — an opaque surface so nothing behind bleeds through, with the
	 * same quiet scrollbar treatment as the sidebar (transparent track inherits
	 * the surface, subtle mode-adaptive thumb). */
	.cmd-results {
		position: fixed;
		z-index: 200;
		margin-top: 0.375rem;
		max-height: 60vh;
		overflow-y: auto;
		background: var(--hz-color-surface, #fff);
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		box-shadow: var(--hz-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
		scrollbar-gutter: stable;
		scrollbar-color: color-mix(in srgb, var(--hz-color-text, #000) 22%, transparent) transparent;
	}

	/* Inside the modal the panel isn't fixed — it flows under the field. */
	.cmd-results--modal {
		position: static;
		width: 100%;
		margin-top: 0.5rem;
		max-height: min(24rem, 60vh);
	}

	.cmd-results ul {
		list-style: none;
		margin: 0;
		padding: 0.25rem;
	}

	.cmd-option {
		display: flex;
		flex-direction: column;
		gap: 0.05rem;
		padding: 0.4rem 0.625rem;
		border-radius: var(--hz-radius-sm, 0.25rem);
		cursor: pointer;
	}

	.cmd-option[data-active] {
		background-color: color-mix(in srgb, var(--hz-color-primary, #2563eb) 12%, transparent);
	}

	.cmd-option-label {
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text, #000);
	}

	.cmd-option-context {
		font-size: var(--hz-font-size-xs, 0.75rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.cmd-empty {
		margin: 0;
		padding: 0.6rem 0.75rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	/* Modal overlay — the backdrop scrim keeps the page behind from showing
	 * through; the panel floats near the top like a command palette. */
	.cmd-backdrop {
		position: fixed;
		inset: 0;
		z-index: 300;
		background: rgb(0 0 0 / 0.45);
	}

	.cmd-modal {
		position: fixed;
		z-index: 301;
		top: 12vh;
		left: 50%;
		transform: translateX(-50%);
		width: min(92vw, 34rem);
		padding: 0.75rem;
		background: var(--hz-color-surface, #fff);
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-lg, 0.75rem);
		box-shadow: var(--hz-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
	}

	.cmd-modal-field {
		background: transparent;
	}
</style>
