<script lang="ts">
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import { cx, uid } from '$lib/utils';

	// ---------------------------------------------------------------------------
	// Types
	// ---------------------------------------------------------------------------

	interface TabItem {
		id: string;
		label: string;
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
	// Tabs-R15 — dev warning for duplicate ids (read once at creation time)
	// ---------------------------------------------------------------------------

	if (import.meta.env.DEV) {
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
	// Stable base id per component instance (Tabs-R3, R5)
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
	// Tabs-R7 — Active state (uncontrolled, seeded by defaultTab)
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
	// Element references — populated via bind:this in the template (Tabs-R10)
	// ---------------------------------------------------------------------------

	let triggerEls = $state<(HTMLButtonElement | null)[]>([]);

	// ---------------------------------------------------------------------------
	// Tabs-R7 / Tabs-R9 — Internal activation helper
	// ---------------------------------------------------------------------------

	function activate(id: string): void {
		if (activeTab === id) return; // Tabs-R9: no-op; onChange does not fire
		activeTab = id;
		onChange?.(id);
	}

	// ---------------------------------------------------------------------------
	// Tabs-R8 — Click handler
	// ---------------------------------------------------------------------------

	function handleTriggerClick(item: TabItem): void {
		if (item.disabled) return; // Tabs-R8: disabled tabs do not activate
		activate(item.id);
	}

	// ---------------------------------------------------------------------------
	// Tabs-R10 / Tabs-R11 — Keyboard handler (roving focus + activation mode)
	// ---------------------------------------------------------------------------

	function handleTriggerKeydown(e: KeyboardEvent, index: number): void {
		const key = e.key;
		const isHorizontal = orientation === 'horizontal';

		// Determine which arrow keys are "next" and "prev" for this orientation.
		// Horizontal handles Left/Right; vertical handles Up/Down (R10).
		const isNext = isHorizontal ? key === 'ArrowRight' : key === 'ArrowDown';
		const isPrev = isHorizontal ? key === 'ArrowLeft' : key === 'ArrowUp';

		if (isNext || isPrev || key === 'Home' || key === 'End') {
			e.preventDefault(); // Tabs-R10: suppress native scroll

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

			// Tabs-R11: auto mode — moving focus also activates the tab immediately.
			if (activation === 'auto') {
				activate(items[targetIndex].id);
			}

			return;
		}

		// Tabs-R11: manual mode — Enter / Space on focused trigger activates it.
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
	Tabs-R1: root <div class="hz-tabs"> with data-orientation.
	Tabs-R14: {...rest} spread first so managed attrs (class, data-orientation) win.
-->
<div {...rest} class={cx('hz-tabs', className)} data-orientation={orientation}>
	<!--
		Tabs-R2: tablist with role="tablist", aria-orientation, aria-label.
	-->
	<div class="hz-tabs-list" role="tablist" aria-orientation={orientation} aria-label={ariaLabel}>
		{#each items as item, i (i)}
			<!--
				Tabs-R3: trigger with all required ARIA attributes and type="button".
				Tabs-R4: roving tabindex — active trigger = 0, all others = -1.
				Tabs-R8: aria-disabled + data-disabled present on disabled triggers.
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
				{item.label}
			</button>
		{/each}
	</div>

	<!--
		Tabs-R5/R6: one panel per item, all rendered and always mounted.
		Active panel: data-state="active", no hidden → visible and in tab order.
		Inactive panels: data-state="inactive" + hidden → removed from layout and tab order.
		The panel snippet is invoked once per item with that item (R5).
	-->
	{#each items as item, i (i)}
		<div
			class="hz-tabs-panel"
			role="tabpanel"
			id={panelId(item.id)}
			aria-labelledby={tabId(item.id)}
			tabindex={0}
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

	/* Tabs-R1: full-width block at every breakpoint. */
	.hz-tabs {
		display: block;
		width: 100%;
	}

	/* Tabs-R2: tablist as a flex row (horizontal orientation, default). */
	.hz-tabs-list {
		display: flex;
		flex-direction: row;
		gap: var(--hz-space-xs, 0.25rem);
	}

	/* Tabs-R2: tablist as a flex column (vertical orientation). */
	.hz-tabs[data-orientation='vertical'] .hz-tabs-list {
		flex-direction: column;
	}

	/*
	 * Tabs-R5: inactive panels use the native [hidden] attribute.
	 * Explicit display: none ensures the attribute wins even if a
	 * consumer resets [hidden] in their stylesheet.
	 */
	.hz-tabs-panel[hidden] {
		display: none;
	}
</style>
