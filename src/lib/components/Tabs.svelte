<script lang="ts">
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import { DEV } from 'esm-env';
	import { cx, uid } from '$lib/utils';

	// ---------------------------------------------------------------------------
	// Types
	// ---------------------------------------------------------------------------

	interface TabItem {
		id: string;
		/** Plain string for the common case; a Snippet when inner markup is needed. */
		label: string | Snippet;
		disabled?: boolean;
	}

	interface Props {
		items: TabItem[];
		defaultTab?: string;
		orientation?: 'horizontal' | 'vertical';
		activation?: 'auto' | 'manual';
		panel: Snippet<[TabItem]>;
		ariaLabel: string;
		onChange?: ((activeId: string) => void) | undefined;
		class?: string;
		[key: string]: unknown;
	}

	// ---------------------------------------------------------------------------
	// Props
	// ---------------------------------------------------------------------------

	let {
		items,
		defaultTab,
		orientation = 'horizontal',
		activation = 'auto',
		panel,
		ariaLabel,
		onChange,
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
					'[hyzer-ui] <Tabs>: duplicate `id` values found in `items`. ' +
						'Item ids must be unique for correct state/keying behavior.'
				);
			}
		});
	}

	// ---------------------------------------------------------------------------
	// Stable base id per component instance
	// ---------------------------------------------------------------------------

	const baseId = uid('hz-tabs');

	/** Derives the trigger element id for a given item id. */
	function tabId(itemId: string): string {
		return `hz-tab-${baseId}-${itemId}`;
	}

	/** Derives the tabpanel element id for a given item id. */
	function panelId(itemId: string): string {
		return `hz-tabpanel-${baseId}-${itemId}`;
	}

	// ---------------------------------------------------------------------------
	// Active state (uncontrolled, seeded by defaultTab)
	// Computed once via untrack() so Svelte does not warn about capturing a
	// reactive prop snapshot (same pattern as Accordion _initialOpenIds).
	// ---------------------------------------------------------------------------

	const _initialActive = untrack((): string | null => {
		// If defaultTab is given, use it only when it matches a non-disabled item.
		if (defaultTab !== undefined) {
			const matched = items.find((item) => item.id === defaultTab && !item.disabled);
			if (matched) return matched.id;
		}
		// Fall back to the first non-disabled item; null if all are disabled.
		const first = items.find((item) => !item.disabled);
		return first ? first.id : null;
	});

	let activeTab = $state<string | null>(_initialActive);

	// ---------------------------------------------------------------------------
	// Element references — populated via bind:this in the template
	// ---------------------------------------------------------------------------

	let triggerEls = $state<(HTMLButtonElement | null)[]>([]);
	let panelEls = $state<(HTMLElement | null)[]>([]);

	// ---------------------------------------------------------------------------
	// panel tab stop, per the APG recommendation: a tabpanel is only
	// focusable itself (tabindex 0) when it contains NO focusable elements, so
	// keyboard users can still reach/scroll text-only panels. Panels with
	// interactive content are not extra tab stops.
	// ---------------------------------------------------------------------------

	const FOCUSABLE_SELECTOR =
		'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
		'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

	let panelHasFocusable = $state<boolean[]>([]);

	$effect(() => {
		// Re-evaluate when the active tab flips (panel content may differ).
		void activeTab;
		panelHasFocusable = panelEls.map((el) => !!el?.querySelector(FOCUSABLE_SELECTOR));
	});

	// ---------------------------------------------------------------------------
	// Internal activation helper
	// ---------------------------------------------------------------------------

	function activate(id: string): void {
		if (activeTab === id) return; // no-op; onChange does not fire
		activeTab = id;
		onChange?.(id);
	}

	// ---------------------------------------------------------------------------
	// Click handler
	// ---------------------------------------------------------------------------

	function handleTriggerClick(item: TabItem): void {
		if (item.disabled) return; // disabled tabs do not activate
		activate(item.id);
	}

	// ---------------------------------------------------------------------------
	// Keyboard handler (roving focus + activation mode)
	// ---------------------------------------------------------------------------

	function handleTriggerKeydown(e: KeyboardEvent, index: number): void {
		const key = e.key;
		const isHorizontal = orientation === 'horizontal';

		// Determine which arrow keys are "next" and "prev" for this orientation.
		// Horizontal handles Left/Right; vertical handles Up/Down.
		const isNext = isHorizontal ? key === 'ArrowRight' : key === 'ArrowDown';
		const isPrev = isHorizontal ? key === 'ArrowLeft' : key === 'ArrowUp';

		if (isNext || isPrev || key === 'Home' || key === 'End') {
			e.preventDefault(); // suppress native scroll

			// Collect indices of all non-disabled triggers for navigation.
			const enabledIndices = items.reduce<number[]>((acc, item, i) => {
				if (!item.disabled) acc.push(i);
				return acc;
			}, []);

			if (enabledIndices.length === 0) return;

			let targetIndex: number;

			if (key === 'Home') {
				targetIndex = enabledIndices[0];
			} else if (key === 'End') {
				targetIndex = enabledIndices[enabledIndices.length - 1];
			} else {
				// Find current position in the enabled list; fall back to 0 if not found.
				const currentPos = enabledIndices.indexOf(index);
				const pos = currentPos === -1 ? 0 : currentPos;

				if (isNext) {
					// Wraps at the end (last → first).
					targetIndex = enabledIndices[(pos + 1) % enabledIndices.length];
				} else {
					// Wraps at the start (first → last).
					targetIndex = enabledIndices[(pos - 1 + enabledIndices.length) % enabledIndices.length];
				}
			}

			triggerEls[targetIndex]?.focus();

			// auto mode — moving focus also activates the tab immediately.
			if (activation === 'auto') {
				activate(items[targetIndex].id);
			}

			return;
		}

		// manual mode — Enter / Space on focused trigger activates it.
		if (activation === 'manual' && (key === 'Enter' || key === ' ')) {
			e.preventDefault();
			const item = items[index];
			if (item && !item.disabled) {
				activate(item.id);
			}
		}
	}
</script>

<!--
	root <div class="hz-tabs"> with data-orientation.
	{...rest} spread first so managed attrs (class, data-orientation) win.
-->
<div {...rest} class={cx('hz-tabs', className)} data-orientation={orientation}>
	<!--
		tablist with role="tablist", aria-orientation, aria-label.
	-->
	<div class="hz-tabs-list" role="tablist" aria-orientation={orientation} aria-label={ariaLabel}>
		{#each items as item, i (i)}
			<!--
				trigger with all required ARIA attributes and type="button".
				roving tabindex — active trigger = 0, all others = -1.
				aria-disabled + data-disabled present on disabled triggers.
			-->
			<button
				bind:this={triggerEls[i]}
				class="hz-tabs-trigger"
				role="tab"
				id={tabId(item.id)}
				aria-controls={panelId(item.id)}
				aria-selected={activeTab === item.id ? 'true' : 'false'}
				aria-disabled={item.disabled ? 'true' : undefined}
				data-state={activeTab === item.id ? 'active' : 'inactive'}
				data-disabled={item.disabled ? '' : undefined}
				tabindex={activeTab === item.id ? 0 : -1}
				type="button"
				onclick={() => handleTriggerClick(item)}
				onkeydown={(e) => handleTriggerKeydown(e, i)}
			>
				{#if typeof item.label === 'string'}{item.label}{:else}{@render item.label()}{/if}
			</button>
		{/each}
	</div>

	<!--
		one panel per item, all rendered and always mounted.
		Active panel: data-state="active", no hidden → visible and in tab order.
		Inactive panels: data-state="inactive" + hidden → removed from layout and tab order.
		The panel snippet is invoked once per item with that item.
	-->
	{#each items as item, i (i)}
		<div
			bind:this={panelEls[i]}
			class="hz-tabs-panel"
			role="tabpanel"
			id={panelId(item.id)}
			aria-labelledby={tabId(item.id)}
			tabindex={panelHasFocusable[i] ? -1 : 0}
			data-state={activeTab === item.id ? 'active' : 'inactive'}
			hidden={activeTab !== item.id}
		>
			{@render panel(item)}
		</div>
	{/each}
</div>

<style>
	/* -----------------------------------------------------------------------
	   Structural CSS only (no colors, borders, shadows, radius, fonts,
	   active-indicator, or animation — those are theme concerns).
	   ----------------------------------------------------------------------- */

	/* full-width block at every breakpoint. */
	.hz-tabs {
		display: block;
		width: 100%;
	}

	/* tablist as a flex row (horizontal orientation, default). */
	.hz-tabs-list {
		display: flex;
		flex-direction: row;
		gap: var(--hz-space-xs, 0.5rem);
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	/* tablist as a flex column (vertical orientation). */
	.hz-tabs[data-orientation='vertical'] .hz-tabs-list {
		flex-direction: column;
		overflow-x: visible;
		flex-shrink: 0;
	}

	/* vertical orientation is a split layout — the rail sits beside
	   the active panel, not above it. */
	.hz-tabs[data-orientation='vertical'] {
		display: flex;
		flex-direction: row;
	}

	.hz-tabs[data-orientation='vertical'] .hz-tabs-panel {
		flex: 1;
		min-width: 0;
	}

	/*
	 * inactive panels use the native [hidden] attribute.
	 * Explicit display: none ensures the attribute wins even if a
	 * consumer resets [hidden] in their stylesheet.
	 */
	.hz-tabs-panel[hidden] {
		display: none;
	}
</style>
