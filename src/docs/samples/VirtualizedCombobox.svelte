<script lang="ts">
	/**
	 * A virtualized, accessible multi-select autocomplete: a from-scratch APG
	 * combobox (list-autocomplete) shell over `Virtualizer`. It follows the
	 * same house pattern as the command-palette (a from-scratch listbox
	 * composition) and the virtualized-table (ARIA roles on divs, plus
	 * Virtualizer). It imports only public exports.
	 *
	 * Why this is a pattern and not part of Combobox itself: the real
	 * `Combobox` component renders every matching option rather than windowing
	 * the list. Its listbox renders one real `<li>` per matching option, which
	 * is fine into the low thousands but not at real scale (see its own "Large
	 * list" demo). This composition keeps Combobox's multi-select identity,
	 * meaning dismissible chips, toggle-to-select, and a popup that stays open
	 * on commit. It trades Combobox's plain-array listbox for Virtualizer's
	 * windowing, for a dataset (tens of thousands of rows) where mounting
	 * every option would visibly lag. The chip row, toggle semantics, and
	 * focus management below mirror Combobox.svelte's own control exactly.
	 *
	 * THE HARD PART, aria-activedescendant over a windowed list: APG expects
	 * the active option to be a real DOM node the input can point at with
	 * `aria-activedescendant`, but Virtualizer only ever mounts the rows near
	 * the current scroll position. Most of the list is never in the DOM. So a
	 * keyboard move (Arrow/Home/End) never assigns `activeIndex` directly.
	 * It is a two-phase commit instead:
	 *
	 *   1. `moveTo(index)` nudges the Virtualizer viewport's `scrollTop`
	 *      toward the target row (the same "nearest" math `scrollIntoView`
	 *      does, computed by hand since the target row usually is not mounted
	 *      yet to call the real thing on).
	 *   2. Each rendered row reports its own presence through a small
	 *      `{@attach}` into a `renderedIndices` set. An effect only commits
	 *      `activeIndex` (and therefore `aria-activedescendant`) once the
	 *      target index actually shows up in that set.
	 *
	 * `aria-activedescendant` can therefore never reference an id that is not
	 * in the DOM. A generous `overscan` means a single-step Arrow move
	 * resolves within the same tick, because the target row is already mounted
	 * just outside the visible viewport from the previous position. Only big
	 * jumps (Home/End across tens of thousands of rows) take an extra frame
	 * while Virtualizer's own window catches up to the new scroll position.
	 *
	 * The same rule holds in REVERSE for pointer scrolling. A wheel scroll can
	 * window the committed active row out of the DOM with no keydown involved,
	 * so a second effect demotes `activeIndex` back to `pendingIndex` the
	 * moment its row unmounts. `aria-activedescendant` goes undefined, which
	 * is valid ("no active option"), and it re-commits by itself if the row
	 * scrolls back in. Arrow keys resume from the demoted position.
	 */
	import { Virtualizer, Badge } from '$lib';
	import { uid } from '$lib/utils';
	import { SvelteSet } from 'svelte/reactivity';

	interface Round {
		id: string;
		label: string;
	}

	// A curated slice of real disc golf courses, each crossed with a round
	// number: a plausible reason a directory would hold tens of thousands of
	// rows across a small set of real venues. (The Combobox docs page's "Large
	// list" demo has the fuller curated set.) Generated once at module scope,
	// and deterministically, with no Math.random, so the SSR output matches
	// the client.
	const REAL_COURSES: { name: string; location: string }[] = [
		{ name: 'Maple Hill', location: 'Leicester, MA' },
		{ name: 'DeLaveaga', location: 'Santa Cruz, CA' },
		{ name: 'Winthrop Gold', location: 'Rock Hill, SC' },
		{ name: 'Fox Run Golf Links', location: "Lee's Summit, MO" },
		{ name: 'Northwoods', location: 'East Peoria, IL' },
		{ name: 'Toboggan', location: 'Emporia, KS' },
		{ name: 'Peter Pan Park', location: 'Emporia, KS' },
		{ name: 'The Preserve at Jones Park', location: 'Pierson, FL' },
		{ name: 'International Disc Golf Center (Old North)', location: 'Appling, GA' },
		{ name: 'Hornets Nest Park', location: 'Charlotte, NC' },
		{ name: 'Harpeth Hills', location: 'Nashville, TN' },
		{ name: 'Milo McIver State Park', location: 'Estacada, OR' },
		{ name: 'Pier Park', location: 'Portland, OR' },
		{ name: 'Alton Baker Park', location: 'Eugene, OR' },
		{ name: 'Blue Ribbon Pines', location: 'Montevideo, MN' },
		{ name: 'Hyland Hills', location: 'Bloomington, MN' },
		{ name: 'Highland Park', location: 'Saint Paul, MN' },
		{ name: 'Vista del Camino Park', location: 'Scottsdale, AZ' },
		{ name: "Steady Ed's Memorial", location: 'La Mirada, CA' },
		{ name: 'Golden Gate Park', location: 'San Francisco, CA' },
		{ name: 'Iron Hill Park', location: 'Newark, DE' },
		{ name: 'Zilker Park', location: 'Austin, TX' },
		{ name: 'Nockamixon State Park', location: 'Quakertown, PA' },
		{ name: 'Rocky Point Park', location: 'Warwick, RI' },
		{ name: 'Earlywine Park', location: 'Oklahoma City, OK' },
		{ name: 'Marymoor Park', location: 'Redmond, WA' },
		{ name: 'Järva DiscGolfPark', location: 'Stockholm, Sweden' },
		{ name: 'Alytus Disc Golf Course', location: 'Alytus, Lithuania' },
		{ name: 'Nokia Disc Golf Park', location: 'Nokia, Finland' },
		{ name: 'Kastaniengarten', location: 'Bremervörde, Germany' }
	];

	function slug(s: string): string {
		return s
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	const ROUNDS_PER_COURSE = 900;

	const rounds: Round[] = REAL_COURSES.flatMap((course) =>
		Array.from({ length: ROUNDS_PER_COURSE }, (_, i) => {
			const n = i + 1;
			return {
				id: `${slug(course.name)}-${slug(course.location)}-r${n}`,
				label: `${course.name} — ${course.location} · Round ${n}`
			};
		})
	);

	// Looked up when rendering chips. That is cheaper than scanning 27,000
	// rows per selected item on every render.
	const roundsById = new Map(rounds.map((r) => [r.id, r]));

	const ROW_HEIGHT = 36;
	const VIEWPORT_HEIGHT = 320;
	const OVERSCAN = 12;

	let query = $state('');
	let open = $state(false);
	let activeIndex = $state<number | null>(null);
	// $state, not a plain variable: the commit effect below must re-run on
	// every `moveTo` call, including when the target row was already rendered
	// (index 0 at the initial scrollTop of 0, for example). Changes to a plain
	// variable would not be a tracked dependency, so the effect would only
	// re-fire when `renderedIndices` mutated, and would miss that case.
	let pendingIndex = $state<number | null>(null);
	// Selected round ids, in selection order, mirroring Combobox's own
	// `value: string[]`. Membership is checked with `includes` and `indexOf`,
	// the same as Combobox, rather than with a Set, so chip order matches
	// selection order.
	let selectedIds = $state<string[]>([]);
	let inputEl = $state<HTMLInputElement | null>(null);

	const selectedRounds = $derived(
		selectedIds.map((id) => roundsById.get(id)).filter((r): r is Round => r !== undefined)
	);

	// Rows report their own mount and unmount here. This set is the single
	// source of truth for whether an index is in the DOM right now.
	const renderedIndices = new SvelteSet<number>();

	const _uid = uid('vcombo');
	const inputId = `vcombo-input-${_uid}`;
	const listId = `vcombo-listbox-${_uid}`;
	function optionId(i: number): string {
		return `vcombo-opt-${_uid}-${i}`;
	}

	const filtered = $derived.by((): Round[] => {
		const q = query.trim().toLowerCase();
		if (q === '') return rounds;
		return rounds.filter((r) => r.label.toLowerCase().includes(q));
	});

	function viewportEl(): HTMLElement | null {
		return document.getElementById(listId);
	}

	/** Manual "scroll nearest into view". The target row usually is not
	    mounted yet, so there is nothing to call `Element.scrollIntoView()` on.
	    Row height is uniform, so the offset math is exact. */
	function scrollTowards(index: number) {
		const el = viewportEl();
		if (!el) return;
		const itemTop = index * ROW_HEIGHT;
		const itemBottom = itemTop + ROW_HEIGHT;
		const viewTop = el.scrollTop;
		const viewBottom = viewTop + el.clientHeight;
		if (itemTop < viewTop) el.scrollTop = itemTop;
		else if (itemBottom > viewBottom) el.scrollTop = itemBottom - el.clientHeight;
	}

	/**
	 * Moves the active option toward `index`. `activeIndex` is cleared
	 * immediately (so it can never point at a stale row) and only reinstated
	 * by the effect below, once `index` is confirmed rendered.
	 */
	function moveTo(index: number | null) {
		activeIndex = null;
		if (index === null) {
			pendingIndex = null;
			return;
		}
		pendingIndex = index;
		scrollTowards(index);
	}

	// Commits `pendingIndex` to `activeIndex` only once that row has actually
	// mounted. It runs immediately when the target was already in the overscan
	// buffer, and otherwise runs again each time Virtualizer mounts a new row
	// (a change to `renderedIndices` re-triggers it) until the target lands.
	$effect(() => {
		if (pendingIndex === null) return;
		if (renderedIndices.has(pendingIndex)) {
			activeIndex = pendingIndex;
			pendingIndex = null;
		}
	});

	// The reverse guard, for the pointer-scroll path. Keyboard moves go
	// through the two-phase commit above, but a mouse-wheel scroll can window
	// the committed active row out of the DOM with no keydown involved,
	// leaving aria-activedescendant pointing at a removed id. The moment the
	// active row leaves `renderedIndices` it is demoted back to
	// `pendingIndex`: the input stops advertising it (an undefined
	// aria-activedescendant is valid, meaning "no active option"), and the
	// commit effect above reinstates it automatically if the row scrolls back
	// into the window. Arrow keys resume from the demoted position
	// (`activeIndex ?? pendingIndex` in onKeydown), so wheel-browsing never
	// resets keyboard navigation to the top of the list.
	$effect(() => {
		if (activeIndex !== null && !renderedIndices.has(activeIndex)) {
			pendingIndex = activeIndex;
			activeIndex = null;
		}
	});

	/** Factory attachment: `{@attach trackRendered(i)}` on a row. */
	function trackRendered(index: number) {
		// The node itself does not matter. Only its mount and unmount timing
		// does.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		return (node: HTMLElement) => {
			renderedIndices.add(index);
			return () => renderedIndices.delete(index);
		};
	}

	function openPopup(index: number | null) {
		open = true;
		moveTo(index);
	}

	/** Toggles `round`'s membership in `selectedIds`: append if absent, remove
	    if present. Mirrors Combobox's toggleMembership exactly. */
	function toggleMembership(round: Round) {
		const idx = selectedIds.indexOf(round.id);
		selectedIds =
			idx === -1 ? [...selectedIds, round.id] : selectedIds.filter((id) => id !== round.id);
	}

	function commit(round: Round) {
		toggleMembership(round);
		// Clears the query so the list re-filters to the full dataset. The
		// next active index is looked up against `rounds` directly, not
		// `filtered` (which only recomputes on the next read), since an empty
		// query always makes `filtered` equal to `rounds`. This mirrors
		// Combobox's own commit exactly, including that the popup stays open
		// (Combobox never closes on a selection) and focus returns to the
		// input.
		query = '';
		const nextIdx = rounds.findIndex((r) => r.id === round.id);
		moveTo(nextIdx === -1 ? null : nextIdx);
		inputEl?.focus();
	}

	// Dismissing a chip removes that value and moves focus to the input. The
	// popup's open state is unchanged. Mirrors Combobox's removeChip.
	function removeChip(id: string) {
		selectedIds = selectedIds.filter((v) => v !== id);
		inputEl?.focus();
	}

	function onInput(e: Event) {
		query = (e.currentTarget as HTMLInputElement).value;
		open = true;
		moveTo(filtered.length ? 0 : null);
	}

	function onInputClick() {
		if (!open) openPopup(filtered.length ? 0 : null);
	}

	function onKeydown(e: KeyboardEvent) {
		switch (e.key) {
			case 'ArrowDown': {
				e.preventDefault();
				if (!open) {
					openPopup(filtered.length ? 0 : null);
					return;
				}
				if (filtered.length === 0) return;
				// `?? pendingIndex`: the active row may have been demoted while
				// its node was windowed out by a wheel scroll, so resume there.
				const base = activeIndex ?? pendingIndex;
				const next = base === null ? 0 : Math.min(filtered.length - 1, base + 1);
				moveTo(next);
				return;
			}
			case 'ArrowUp': {
				e.preventDefault();
				if (!open) {
					openPopup(filtered.length ? filtered.length - 1 : null);
					return;
				}
				if (filtered.length === 0) return;
				const base = activeIndex ?? pendingIndex;
				const prev = base === null ? filtered.length - 1 : Math.max(0, base - 1);
				moveTo(prev);
				return;
			}
			case 'Home': {
				if (!open || filtered.length === 0) return;
				e.preventDefault();
				moveTo(0);
				return;
			}
			case 'End': {
				if (!open || filtered.length === 0) return;
				e.preventDefault();
				moveTo(filtered.length - 1);
				return;
			}
			case 'Enter': {
				// Always preventDefault so an enclosing form does not submit.
				e.preventDefault();
				if (open && activeIndex !== null) {
					const round = filtered[activeIndex];
					if (round) {
						commit(round);
						return;
					}
				}
				// No active option: close with no change.
				open = false;
				moveTo(null);
				return;
			}
			case 'Escape': {
				e.preventDefault();
				if (open) {
					// Open: close the popup and clear the query. Selections are
					// untouched, since Escape never clears them (each chip
					// carries its own dismiss).
					open = false;
					moveTo(null);
					query = '';
				} else {
					// Closed: clear the query text only.
					query = '';
				}
				return;
			}
			case 'Backspace': {
				// Text present: native editing, no interception.
				if (query !== '') return;
				// No chips to remove, so nothing to do. No preventDefault is
				// needed either way, since an already-empty input gives the
				// browser nothing to do.
				if (selectedIds.length === 0) return;
				selectedIds = selectedIds.slice(0, -1);
				return;
			}
			case 'Tab': {
				open = false;
				moveTo(null);
				return;
			}
		}
	}

	// A mouse press inside the widget whose default is NOT cancelled blurs the
	// input with a null relatedTarget, which the handler below would read as
	// "focus left" and close the popup mid-scroll. The options call
	// preventDefault, but the listbox's own scrollbar cannot, so this flag
	// covers that case (it mirrors Combobox.svelte's own guard). It is cleared
	// on the next mouseup, wherever that lands.
	let pressInside = false;
	function onMousedown() {
		pressInside = true;
		window.addEventListener('mouseup', () => (pressInside = false), { once: true, capture: true });
	}

	function onFocusOut(e: FocusEvent) {
		if (pressInside) {
			// A scrollbar grab took focus. Keep the popup open and hand focus
			// back to the input.
			inputEl?.focus();
			return;
		}
		const related = e.relatedTarget as HTMLElement | null;
		if (related && related.closest('.vcombo')) return;
		open = false;
		moveTo(null);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="vcombo" onmousedown={onMousedown} onfocusout={onFocusOut}>
	<!-- The dataset line sits above the label, so the only thing under the input
	     is the selection count: what the reader just did, next to where they
	     did it. -->
	<p class="vcombo-proof">
		{rounds.length.toLocaleString()} rows in the dataset. Only the rows in view (plus the overscan buffer)
		are ever in the DOM.
	</p>
	<label class="vcombo-label" for={inputId}>Search rounds</label>
	<div class="vcombo-control">
		<!-- One Badge chip per selected round, in selection order. Mirrors
		     Combobox's own chip row. -->
		{#each selectedRounds as round (round.id)}
			<Badge
				size="sm"
				onDismiss={() => removeChip(round.id)}
				dismissLabel={`Remove ${round.label}`}
			>
				{round.label}
			</Badge>
		{/each}
		<!--
			aria-controls names the listbox only while a listbox exists. When the
			query matches nothing the popup holds a message instead, and pointing
			the reference at an id that is not in the document sends a screen
			reader to nothing.
		-->
		<input
			bind:this={inputEl}
			id={inputId}
			type="text"
			class="vcombo-input"
			role="combobox"
			autocomplete="off"
			value={query}
			placeholder={selectedIds.length === 0
				? `Search ${rounds.length.toLocaleString()} rounds…`
				: undefined}
			aria-autocomplete="list"
			aria-expanded={open ? 'true' : 'false'}
			aria-controls={open && filtered.length > 0 ? listId : undefined}
			aria-haspopup="listbox"
			aria-activedescendant={open && activeIndex !== null ? optionId(activeIndex) : undefined}
			oninput={onInput}
			onkeydown={onKeydown}
			onclick={onInputClick}
		/>

		{#if open}
			<div class="vcombo-popup">
				{#if filtered.length === 0}
					<!--
						role="status" carries a polite live region, so the message is
						spoken when a query stops matching. Without it the popup changes
						silently: there is no active option to announce, and the input's
						own value is not a result count.
					-->
					<p class="vcombo-empty" role="status">No rounds match your search</p>
				{:else}
					<!--
						The wrapper Virtualizer renders IS the role=listbox element:
						role, aria-label, and aria-multiselectable ride its ...rest,
						the same way virtualized-table passes role=rowgroup. Its `id`
						doubles as the DOM node this component queries for scrollTop
						control. Each row's own element (inside the `row` snippet)
						carries role=option and aria-selected, derived from
						`selectedIds` rather than from DOM state, so it stays correct
						as rows window in and out. Virtualizer's own per-row wrapper
						div between the two has no role, the same layering
						virtualized-table uses for role=row.
					-->
					<Virtualizer
						id={listId}
						role="listbox"
						aria-label="Rounds"
						aria-multiselectable="true"
						class="vcombo-listbox"
						items={filtered}
						itemHeight={ROW_HEIGHT}
						height={VIEWPORT_HEIGHT}
						overscan={OVERSCAN}
					>
						{#snippet row(round, i)}
							<!--
								Combobox-style virtual focus: options are plain, non-focusable
								divs with no tabindex. DOM focus never leaves the input, and
								keyboard activation happens there (Enter), not on the option
								itself. This mirrors Combobox.svelte's own li options,
								including that a click or Enter TOGGLES membership without
								closing the popup.
							-->
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_interactive_supports_focus -->
							<div
								id={optionId(i)}
								role="option"
								class="vcombo-option"
								aria-selected={selectedIds.includes(round.id) ? 'true' : 'false'}
								data-active={activeIndex === i ? '' : undefined}
								data-selected={selectedIds.includes(round.id) ? '' : undefined}
								onmousedown={(e) => e.preventDefault()}
								onclick={() => commit(round)}
								{@attach trackRendered(i)}
							>
								{round.label}
							</div>
						{/snippet}
					</Virtualizer>
				{/if}
			</div>
		{/if}
	</div>

	{#if selectedRounds.length > 0}
		<p class="vcombo-selected">
			Selected: <strong
				>{selectedRounds.length} round{selectedRounds.length === 1 ? '' : 's'}</strong
			>.
		</p>
	{/if}
</div>

<style>
	.vcombo {
		max-width: 32rem;
	}

	.vcombo-label {
		display: block;
		margin: 0 0 0.35rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		font-weight: var(--hz-font-weight-medium, 500);
	}

	.vcombo-control {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
		box-sizing: border-box;
		width: 100%;
		padding: 0.4rem 0.5rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		background: var(--hz-color-surface, #fff);
		/* The popup's positioning ancestor. It anchors directly under the
		   control box however many chip rows it wraps to. */
		position: relative;
	}

	.vcombo-input {
		flex: 1;
		min-width: 8rem;
		box-sizing: border-box;
		border: none;
		background: transparent;
		color: var(--hz-color-text, #000);
		font: inherit;
		font-size: var(--hz-font-size-sm, 0.875rem);
		padding: 0.25rem 0;
	}

	.vcombo-input:focus {
		outline: none;
	}

	.vcombo-popup {
		position: absolute;
		inset-inline: 0;
		top: calc(100% + 0.35rem);
		z-index: var(--hz-z-dropdown, 10);
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		background: var(--hz-color-surface, #fff);
		box-shadow: var(--hz-shadow-md, 0 10px 15px -3px rgb(0 0 0 / 0.1));
		overflow: hidden;
	}

	.vcombo-empty {
		margin: 0;
		padding: 0.75rem;
		color: var(--hz-color-text-muted, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	:global(.vcombo-listbox) {
		scrollbar-gutter: stable;
	}

	.vcombo-option {
		display: flex;
		align-items: center;
		height: 100%;
		padding-inline: 0.75rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		cursor: pointer;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.vcombo-option[data-active] {
		background-color: color-mix(in srgb, var(--hz-intent-primary, #2563eb) 12%, transparent);
	}

	.vcombo-option[aria-selected='true'] {
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	/* Above the label, so it reads as context for the field that follows. */
	.vcombo-proof {
		margin: 0 0 0.6rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.vcombo-selected {
		margin: 0.6rem 0 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
