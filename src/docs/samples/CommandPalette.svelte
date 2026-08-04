<script lang="ts">
	/**
	 * A command palette composed from library primitives.
	 *
	 * The overlay, backdrop, focus trap, and Escape-to-close come from `Modal`,
	 * and the field is a `TextInput`: `bind:element` hands back the native
	 * input for focus-on-open, and the combobox wiring (role, aria-expanded,
	 * aria-activedescendant, onkeydown) passes through to it. This pattern
	 * only adds the filtered results and the keyboard wiring. It imports only
	 * public exports and reads like consumer code: choosing a result navigates
	 * to a real route through SvelteKit's `goto`, not to a placeholder `#` link.
	 */
	import { Modal, TextInput } from '$lib';
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
		{ label: 'Button', href: '/docs/components/button', context: 'Components · Common' },
		{ label: 'Card', href: '/docs/components/card', context: 'Components · Common' },
		{ label: 'Modal', href: '/docs/components/modal', context: 'Components · Common' },
		{ label: 'Select', href: '/docs/components/select', context: 'Components · Forms' },
		{ label: 'Toggle', href: '/docs/components/toggle', context: 'Components · Forms' },
		{ label: 'Colors & Intent', href: '/docs/foundation/colors', context: 'Foundation' },
		{ label: 'Theming Overview', href: '/docs/theming/overview', context: 'Theming' }
	];

	let open = $state(false);
	let query = $state('');
	let activeIndex = $state(0);
	// TextInput's bind:element — the native input, for focus-on-open.
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

	// The conventional global shortcut: ⌘K or Ctrl-K opens the palette anywhere.
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
		<TextInput
			name="cmdk-query"
			label="Search"
			hideLabel
			bind:value={query}
			bind:element={inputEl}
			placeholder="Jump to…"
			autocomplete="off"
			class="cmdk-field"
			role="combobox"
			aria-expanded="true"
			aria-controls={listId}
			aria-activedescendant={results.length ? optionId(activeIndex) : undefined}
			onkeydown={onFieldKeydown}
		>
			{#snippet prefix()}
				<IconSearch />
			{/snippet}
		</TextInput>

		<ul id={listId} role="listbox" aria-label="Results" class="cmdk-results">
			<!--
				The options carry pointer handlers and no key handlers, on purpose. This
				is virtual focus: DOM focus never leaves the input, which owns every
				key, and `aria-activedescendant` above tells assistive tech which option
				is current. Options are therefore not focusable and need no tabindex.
				Adding key handlers here would be the bug, not the fix.
			-->
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

	/* The field is a TextInput — the theme owns its look; the sample only
	 * sizes the prefix icon. */
	.cmdk :global(.cmdk-field .hz-icon) {
		width: 1.1rem;
		height: 1.1rem;
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
