<script lang="ts">
	/**
	 * A command palette composed from library primitives.
	 *
	 * The overlay, backdrop, focus trap, and Escape-to-close come from `Modal` —
	 * so this recipe only has to add the search field, the filtered results, and
	 * the keyboard wiring. It imports only public exports and reads like consumer
	 * code (bare `#`-free: it navigates to real routes via SvelteKit's goto).
	 */
	import { Modal } from '$lib';
	import { IconSearch } from '$lib/icons';
	import { uid } from '$lib/utils';
	import { goto } from '$app/navigation';

	interface Command {
		label: string;
		href: string;
		context: string;
	}

	// A real app builds this from its routes; here it's a small fixed set.
	const commands: Command[] = [
		{ label: 'Button', href: '/components/button', context: 'Components · Common' },
		{ label: 'Card', href: '/components/card', context: 'Components · Common' },
		{ label: 'Modal', href: '/components/modal', context: 'Components · Common' },
		{ label: 'Select', href: '/components/select', context: 'Components · Forms' },
		{ label: 'Toggle', href: '/components/toggle', context: 'Components · Forms' },
		{ label: 'Colors & Intent', href: '/foundation/colors', context: 'Foundation' },
		{ label: 'Theming Overview', href: '/theming/overview', context: 'Theming' }
	];

	let open = $state(false);
	let query = $state('');
	let activeIndex = $state(0);
	let inputEl = $state<HTMLInputElement>();

	const listId = uid('cmdk');
	const optionId = (i: number) => `${listId}-opt-${i}`;

	const results = $derived(
		query.trim()
			? commands.filter((c) =>
					`${c.context} ${c.label}`.toLowerCase().includes(query.trim().toLowerCase())
				)
			: commands
	);

	// Keep the active option in range as the list shrinks.
	$effect(() => {
		if (activeIndex > results.length - 1) activeIndex = 0;
	});

	// Focus the field when the palette opens.
	$effect(() => {
		if (open && inputEl) inputEl.focus();
	});

	// The conventional global shortcut — ⌘K / Ctrl-K opens the palette anywhere.
	$effect(() => {
		function onKey(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				open = true;
			}
		}
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	});

	function choose(i: number) {
		const command = results[i];
		if (!command) return;
		open = false;
		query = '';
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(command.href);
	}

	function onFieldKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (results.length) activeIndex = (activeIndex + 1) % results.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (results.length) activeIndex = (activeIndex - 1 + results.length) % results.length;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			choose(activeIndex);
		}
		// Escape is Modal's job.
	}
</script>

<button type="button" class="cmdk-trigger" onclick={() => (open = true)}>
	<IconSearch />
	<span>Search…</span>
	<kbd>⌘K</kbd>
</button>

<Modal bind:open title="Search" showClose={false} size="md">
	<div class="cmdk">
		<div class="cmdk-field">
			<IconSearch />
			<input
				bind:this={inputEl}
				bind:value={query}
				type="text"
				role="combobox"
				aria-expanded="true"
				aria-controls={listId}
				aria-activedescendant={results.length ? optionId(activeIndex) : undefined}
				aria-label="Search"
				placeholder="Jump to…"
				autocomplete="off"
				onkeydown={onFieldKeydown}
			/>
		</div>

		<ul id={listId} role="listbox" aria-label="Results" class="cmdk-results">
			{#each results as command, i (command.href)}
				<li
					id={optionId(i)}
					role="option"
					aria-selected={i === activeIndex}
					class="cmdk-option"
					data-active={i === activeIndex ? '' : undefined}
					onmousedown={(e) => {
						e.preventDefault();
						choose(i);
					}}
					onmousemove={() => (activeIndex = i)}
				>
					<span class="cmdk-option-label">{command.label}</span>
					<span class="cmdk-option-context">{command.context}</span>
				</li>
			{/each}
		</ul>

		{#if results.length === 0}
			<p class="cmdk-empty">No matches for “{query.trim()}”</p>
		{/if}
	</div>
</Modal>

<style>
	.cmdk-trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.75rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		background: var(--hz-color-surface, #fff);
		color: var(--hz-color-text-muted, #6b7280);
		font: inherit;
		font-size: var(--hz-font-size-sm, 0.875rem);
		cursor: pointer;
	}

	.cmdk-trigger :global(.hz-icon) {
		width: 1rem;
		height: 1rem;
	}

	.cmdk-trigger kbd {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: var(--hz-font-size-xs, 0.75rem);
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-sm, 0.25rem);
		padding: 0.05rem 0.3rem;
	}

	.cmdk-field {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.cmdk-field :global(.hz-icon) {
		width: 1.1rem;
		height: 1.1rem;
	}

	.cmdk-field input {
		flex: 1;
		min-width: 0;
		border: none;
		background: none;
		font: inherit;
		color: var(--hz-color-text, #000);
	}

	.cmdk-field input:focus {
		outline: none;
	}

	.cmdk-results {
		list-style: none;
		margin: 0.75rem 0 0;
		padding: 0;
		max-height: 18rem;
		overflow-y: auto;
		scrollbar-color: color-mix(in srgb, var(--hz-color-text, #000) 22%, transparent) transparent;
	}

	.cmdk-option {
		display: flex;
		flex-direction: column;
		gap: 0.05rem;
		padding: 0.45rem 0.625rem;
		border-radius: var(--hz-radius-sm, 0.25rem);
		cursor: pointer;
	}

	.cmdk-option[data-active] {
		background-color: color-mix(in srgb, var(--hz-intent-primary, #2563eb) 12%, transparent);
	}

	.cmdk-option-label {
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.cmdk-option-context {
		font-size: var(--hz-font-size-xs, 0.75rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.cmdk-empty {
		margin: 0.75rem 0 0;
		color: var(--hz-color-text-muted, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
</style>
