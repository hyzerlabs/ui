<script lang="ts">
	/**
	 * A virtualized, accessible autocomplete: a from-scratch APG combobox
	 * (list-autocomplete) shell over `Virtualizer`, the same house pattern as
	 * the command-palette (from-scratch listbox composition) and
	 * virtualized-table (ARIA-on-divs + Virtualizer) patterns. This is
	 * consumer code — it imports only public exports.
	 *
	 * WHY THIS IS A PATTERN, NOT PART OF COMBOBOX ITSELF: the real `Combobox`
	 * component defers windowing (specs/23-virtualizer.md's Out of Scope) —
	 * its listbox renders one real `<li>` per matching option, which is fine
	 * into the low thousands but not at real scale (see its own "Large list"
	 * demo). This composition trades Combobox's ready-made chip/multi-select
	 * machinery for Virtualizer's windowing, over a dataset (tens of
	 * thousands of rows) where mounting every option would visibly lag.
	 *
	 * THE HARD PART — aria-activedescendant over a windowed list: APG expects
	 * the active option to be a real DOM node the input can point at via
	 * `aria-activedescendant`, but Virtualizer only ever mounts the rows near
	 * the current scroll position — most of the list is never in the DOM.
	 * So a keyboard move (Arrow/Home/End) never assigns `activeIndex`
	 * directly; it's a two-phase commit instead:
	 *
	 *   1. `moveTo(index)` nudges the Virtualizer viewport's `scrollTop`
	 *      toward the target row (the same "nearest" math `scrollIntoView`
	 *      does, computed by hand since the target row usually isn't
	 *      mounted yet to call the real thing on).
	 *   2. Each rendered row reports its own presence via a small
	 *      `{@attach}` into a `renderedIndices` set. An effect only commits
	 *      `activeIndex` (and therefore `aria-activedescendant`) once the
	 *      target index actually shows up in that set.
	 *
	 * `aria-activedescendant` can therefore never reference an id that isn't
	 * in the DOM. A generous `overscan` means a single-step Arrow move
	 * resolves within the same tick — the target row is already mounted just
	 * outside the visible viewport from the previous position. Only big
	 * jumps (Home/End over 25,000 rows) take an extra frame while
	 * Virtualizer's own window catches up to the new scroll position.
	 */
	import { Virtualizer } from '$lib';
	import { uid } from '$lib/utils';
	import { SvelteSet } from 'svelte/reactivity';

	interface Round {
		id: string;
		label: string;
	}

	// A curated slice of real disc golf courses (see the Combobox docs page's
	// "Large list" demo for the fuller curated set) crossed with a round
	// number — a plausible reason a directory would have tens of thousands of
	// rows tied to a small set of real venues. Generated once at module
	// scope, deterministically (no Math.random), so SSR output matches the
	// client.
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

	const ROW_HEIGHT = 36;
	const VIEWPORT_HEIGHT = 320;
	const OVERSCAN = 12;

	let query = $state('');
	let open = $state(false);
	let activeIndex = $state<number | null>(null);
	// $state, not a plain variable: the commit effect below must re-run on
	// every `moveTo` call, including when the target row was ALREADY
	// rendered (e.g. index 0 at initial scrollTop 0) — a plain variable's
	// changes wouldn't be a tracked dependency, so the effect would only
	// ever re-fire off `renderedIndices` mutating, missing that case.
	let pendingIndex = $state<number | null>(null);
	let selected = $state<Round | null>(null);
	let inputEl = $state<HTMLInputElement | null>(null);

	// Rows report their own mount/unmount here — the single source of truth
	// for "is this index actually in the DOM right now".
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

	/** Manual "scroll nearest into view" — the target row usually isn't
	    mounted yet, so `Element.scrollIntoView()` has nothing to call it on;
	    row height is uniform, so the offset math is exact. */
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

	// Commits `pendingIndex` → `activeIndex` only once that row has actually
	// mounted: runs immediately when the target was already in the overscan
	// buffer, or again whenever Virtualizer mounts a new row
	// (`renderedIndices` changing re-triggers this) until it lands.
	$effect(() => {
		if (pendingIndex === null) return;
		if (renderedIndices.has(pendingIndex)) {
			activeIndex = pendingIndex;
			pendingIndex = null;
		}
	});

	/** Factory attachment: `{@attach trackRendered(i)}` on a row. */
	function trackRendered(index: number) {
		// The node itself is irrelevant — only its mount/unmount timing is.
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

	function commit(round: Round) {
		selected = round;
		query = round.label;
		open = false;
		moveTo(null);
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
				const next = activeIndex === null ? 0 : Math.min(filtered.length - 1, activeIndex + 1);
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
				const prev = activeIndex === null ? filtered.length - 1 : Math.max(0, activeIndex - 1);
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
				e.preventDefault();
				if (open && activeIndex !== null) {
					const round = filtered[activeIndex];
					if (round) commit(round);
					return;
				}
				open = false;
				moveTo(null);
				return;
			}
			case 'Escape': {
				e.preventDefault();
				if (open) {
					open = false;
					moveTo(null);
					query = selected?.label ?? '';
				} else {
					query = '';
					selected = null;
				}
				return;
			}
			case 'Tab': {
				open = false;
				moveTo(null);
				return;
			}
		}
	}

	function onFocusOut(e: FocusEvent) {
		const related = e.relatedTarget as HTMLElement | null;
		if (related && related.closest('.vcombo')) return;
		open = false;
		moveTo(null);
	}
</script>

<div class="vcombo" onfocusout={onFocusOut}>
	<label class="vcombo-label" for={inputId}>Search rounds</label>
	<div class="vcombo-field">
		<input
			bind:this={inputEl}
			id={inputId}
			type="text"
			class="vcombo-input"
			role="combobox"
			autocomplete="off"
			value={query}
			placeholder="Search {rounds.length.toLocaleString()} rounds…"
			aria-autocomplete="list"
			aria-expanded={open ? 'true' : 'false'}
			aria-controls={listId}
			aria-haspopup="listbox"
			aria-activedescendant={open && activeIndex !== null ? optionId(activeIndex) : undefined}
			oninput={onInput}
			onkeydown={onKeydown}
			onclick={onInputClick}
		/>

		{#if open}
			<div class="vcombo-popup">
				{#if filtered.length === 0}
					<p class="vcombo-empty" role="presentation">No matching rounds</p>
				{:else}
					<!--
						The wrapper Virtualizer renders IS the role=listbox element
						(role/aria-label ride its ...rest, like virtualized-table's
						role=rowgroup) — its `id` doubles as the DOM node this
						component queries for scrollTop control. Each row's own
						element (inside the `row` snippet) carries role=option;
						Virtualizer's own per-row wrapper div between the two has no
						role, the same layering virtualized-table uses for role=row.
					-->
					<Virtualizer
						id={listId}
						role="listbox"
						aria-label="Rounds"
						class="vcombo-listbox"
						items={filtered}
						itemHeight={ROW_HEIGHT}
						height={VIEWPORT_HEIGHT}
						overscan={OVERSCAN}
					>
						{#snippet row(round, i)}
							<!--
								Combobox-style virtual focus: options are plain, non-focusable
								divs (no tabindex) — DOM focus never leaves the input, and
								keyboard activation happens there (Enter), not on the option
								itself. Mirrors Combobox.svelte's own li options.
							-->
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_interactive_supports_focus -->
							<div
								id={optionId(i)}
								role="option"
								class="vcombo-option"
								aria-selected={selected?.id === round.id ? 'true' : 'false'}
								data-active={activeIndex === i ? '' : undefined}
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

	<p class="vcombo-proof">
		{rounds.length.toLocaleString()} rows in the dataset — only the rows in view (plus overscan) are ever
		in the DOM.{#if selected}
			Selected: <strong>{selected.label}</strong>.{/if}
	</p>
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

	.vcombo-field {
		position: relative;
	}

	.vcombo-input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.55rem 0.75rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		background: var(--hz-color-surface, #fff);
		color: var(--hz-color-text, #000);
		font: inherit;
		font-size: var(--hz-font-size-sm, 0.875rem);
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

	.vcombo-proof {
		margin: 0.6rem 0 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
