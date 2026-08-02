<script lang="ts">
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import { DEV } from 'esm-env';
	import { cx, uid } from '$lib/utils';
	import IconChevronDown from '$lib/icons/generated/chevron-down.svelte';

	// ---------------------------------------------------------------------------
	// Types
	// ---------------------------------------------------------------------------

	interface AccordionItem {
		id: string;
		/** Plain string for the common case; a Snippet when inner markup is
		 * needed. The snippet receives the item, so one shared snippet can
		 * render per-item content in data-driven accordions. */
		title: string | Snippet<[AccordionItem]>;
		disabled?: boolean;
	}

	interface Props {
		items: AccordionItem[];
		type?: 'single' | 'multiple';
		defaultOpen?: string | string[];
		collapsible?: boolean;
		headingLevel?: 2 | 3 | 4 | 5 | 6;
		panel: Snippet<[AccordionItem]>;
		icon?: Snippet;
		onToggle?: ((openIds: string[]) => void) | undefined;
		class?: string;
		[key: string]: unknown;
	}

	// ---------------------------------------------------------------------------
	// Props
	// ---------------------------------------------------------------------------

	let {
		items,
		type = 'single',
		defaultOpen = [],
		collapsible = true,
		headingLevel = 3,
		panel,
		icon,
		onToggle,
		class: className,
		...rest
	}: Props = $props();

	// ---------------------------------------------------------------------------
	// dev warning for duplicate ids (read once at creation time)
	// ---------------------------------------------------------------------------

	if (DEV) {
		untrack(() => {
			const ids = items.map((item) => item.id);
			if (ids.length !== new Set(ids).size) {
				console.warn(
					'[hyzer-ui] <Accordion>: duplicate `id` values found in `items`. ' +
						'Item ids must be unique for correct state/keying behavior.'
				);
			}
		});
	}

	// ---------------------------------------------------------------------------
	// stable group name for the single-expand native grouping
	// ---------------------------------------------------------------------------

	const groupName = uid('hz-accordion');

	// ---------------------------------------------------------------------------
	// compute initial open set from defaultOpen (uncontrolled)
	// untrack() reads props once at creation time so Svelte does not warn about
	// capturing a reactive value as a snapshot (same pattern as Card/Button).
	// ---------------------------------------------------------------------------

	// _initialOpenIds: string[] of ids that should be open initially.
	// Computed once with untrack() so Svelte doesn't warn about capturing a
	// reactive prop snapshot (same pattern as Card/Button dev warnings).
	const _initialOpenIds = untrack((): string[] => {
		const arr: string[] = Array.isArray(defaultOpen)
			? (defaultOpen as string[])
			: defaultOpen
				? [defaultOpen as string]
				: [];

		const result: string[] = [];
		if (type === 'single') {
			// Only the first matching id opens
			for (const id of arr) {
				if (items.find((it) => it.id === id)) {
					result.push(id);
					break;
				}
			}
		} else {
			for (const id of arr) {
				if (items.find((it) => it.id === id)) {
					result.push(id);
				}
			}
		}
		return result;
	});

	// ---------------------------------------------------------------------------
	// Reactive state
	// ---------------------------------------------------------------------------

	// openStates[i] mirrors whether details[i] is currently open.
	// Initialized from defaultOpen; updated by the toggle event handler.
	let openStates = $state<boolean[]>(
		untrack(() => items.map((item) => _initialOpenIds.includes(item.id)))
	);

	// Element references — populated via bind:this in the template.
	let detailsEls = $state<(HTMLDetailsElement | null)[]>([]);
	let summaryEls = $state<(HTMLElement | null)[]>([]);

	// ---------------------------------------------------------------------------
	// toggle event listener with cleanup
	// data-state={openStates[i] ? 'open' : 'closed'} keeps the hook in sync
	// and by updating openStates here.
	// ---------------------------------------------------------------------------

	$effect(() => {
		const cleanups: (() => void)[] = [];

		detailsEls.forEach((el, i) => {
			if (!el) return;

			function onDetailToggle() {
				const isNowOpen = el!.open;

				// Guard: bail when state is already in sync (programmatic change we caused).
				if (isNowOpen === openStates[i]) return;

				// disabled — revert the native toggle immediately.
				if (items[i]?.disabled) {
					openStates[i] = !isNowOpen; // schedules DOM revert via open={openStates[i]}
					return; // do not call onToggle
				}

				// non-collapsible + single — reopen if user just closed it.
				if (!collapsible && type === 'single' && !isNowOpen) {
					openStates[i] = true; // schedules DOM reopen
					return; // do not call onToggle
				}

				// Update this item's state.
				openStates[i] = isNowOpen;

				// single mode — close all other items.
				if (type === 'single' && isNowOpen) {
					items.forEach((_, j) => {
						if (j !== i) openStates[j] = false;
					});
				}

				// fire onToggle with current open ids in DOM order.
				if (onToggle) {
					const openIds = items.filter((_, idx) => openStates[idx]).map((item) => item.id);
					onToggle(openIds);
				}
			}

			el.addEventListener('toggle', onDetailToggle);
			cleanups.push(() => el!.removeEventListener('toggle', onDetailToggle));
		});

		return () => cleanups.forEach((fn) => fn());
	});

	// ---------------------------------------------------------------------------
	// click guard (disabled)
	// click guard (non-collapsible)
	// ---------------------------------------------------------------------------

	function handleSummaryClick(e: MouseEvent, i: number) {
		// Disabled item — prevent any toggle.
		if (items[i]?.disabled) {
			e.preventDefault();
			return;
		}
		// Non-collapsible + single — prevent closing the open item.
		if (!collapsible && type === 'single' && openStates[i]) {
			e.preventDefault();
		}
	}

	// ---------------------------------------------------------------------------
	// keydown handler
	// ---------------------------------------------------------------------------

	function handleSummaryKeydown(e: KeyboardEvent, i: number) {
		const key = e.key;

		// arrow/Home/End navigation between summaries.
		if (key === 'ArrowDown') {
			e.preventDefault();
			summaryEls[Math.min(i + 1, summaryEls.length - 1)]?.focus();
			return;
		}
		if (key === 'ArrowUp') {
			e.preventDefault();
			summaryEls[Math.max(i - 1, 0)]?.focus();
			return;
		}
		if (key === 'Home') {
			e.preventDefault();
			summaryEls[0]?.focus();
			return;
		}
		if (key === 'End') {
			e.preventDefault();
			summaryEls[summaryEls.length - 1]?.focus();
			return;
		}

		// disabled — prevent Enter/Space toggle via keyboard.
		if (items[i]?.disabled && (key === 'Enter' || key === ' ')) {
			e.preventDefault();
			return;
		}

		// non-collapsible — prevent closing the open item via keyboard.
		if (!collapsible && type === 'single' && openStates[i] && (key === 'Enter' || key === ' ')) {
			e.preventDefault();
		}
	}
</script>

<!--
	root <div class="hz-accordion"> with data-type.
	{...rest} spread first so managed attrs (class, data-type) win.
-->
<div {...rest} class={cx('hz-accordion', className)} data-type={type}>
	{#each items as item, i (i)}
		<!--
			<details class="hz-accordion-item">
			name attribute for single-expand native grouping.
			data-state kept in sync with openStates[i].
			open attribute seeds initial open state.
			data-disabled present when item.disabled is true.
		-->
		<details
			bind:this={detailsEls[i]}
			class="hz-accordion-item"
			name={type === 'single' ? groupName : undefined}
			open={openStates[i]}
			data-state={openStates[i] ? 'open' : 'closed'}
			data-disabled={item.disabled ? '' : undefined}
		>
			<!--
				<summary class="hz-accordion-trigger">
				aria-disabled="true" on disabled summaries.
			-->
			<summary
				bind:this={summaryEls[i]}
				class="hz-accordion-trigger"
				aria-disabled={item.disabled ? 'true' : undefined}
				onclick={(e) => handleSummaryClick(e, i)}
				onkeydown={(e) => handleSummaryKeydown(e, i)}
			>
				<!--
					heading element via svelte:element; icon is a sibling.
				-->
				<svelte:element this={'h' + headingLevel} class="hz-accordion-heading">
					{#if typeof item.title === 'string'}{item.title}{:else}{@render item.title(item)}{/if}
				</svelte:element>

				<!--
					icon span is aria-hidden; renders custom icon or default chevron.
				-->
				<span class="hz-accordion-icon" aria-hidden="true">
					{#if icon}
						{@render icon()}
					{:else}
						<IconChevronDown />
					{/if}
				</span>
			</summary>

			<!--
				panel div; no display/overflow/height CSS shipped (Theming Hooks).
			-->
			<div class="hz-accordion-panel">
				{@render panel(item)}
			</div>
		</details>
	{/each}
</div>

<style>
	/* -----------------------------------------------------------------------
	   Structural CSS only (no colors, borders, shadows, radius, fonts,
	   icon rotation, or panel animation — those are theme concerns).
	   ----------------------------------------------------------------------- */

	/* full-width block for every <details>. */
	.hz-accordion-item {
		display: block;
		width: 100%;
	}

	/*
	 * Structural CSS:
	 * summary as a flex row — heading takes available space, icon sits at the end.
	 * align-items: flex-start keeps the icon aligned to the top of the row so it
	 * does not vertically center against wrapped multi-line titles (spec §Responsive).
	 *
	 * list-style: none + ::-webkit-details-marker removes the default disclosure
	 * triangle in all browsers.
	 */
	.hz-accordion-trigger {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: var(--hz-space-sm, 1rem);
		list-style: none;
		cursor: pointer;
	}

	.hz-accordion-trigger::-webkit-details-marker {
		display: none;
	}

	/* Heading fills available row space; reset margin so theme controls spacing. */
	.hz-accordion-heading {
		flex: 1;
		margin: 0;
	}

	/* Icon stays at end; flex-shrink: 0 prevents it from collapsing on narrow viewports. */
	.hz-accordion-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	/*
	 * Theming hooks:
	 * NO display / overflow / height / content-visibility on .hz-accordion-panel.
	 * Native <details> visibility drives show/hide.
	 * The panel element is stable so themes can animate it freely.
	 */
</style>
