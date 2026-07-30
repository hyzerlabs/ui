<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';
	import type { TocEntry } from '$lib/types';
	import { cx, uid } from '$lib/utils';
	import { mutate } from '$lib/observers';
	import IconChevronDown from '$lib/icons/generated/chevron-down.svelte';

	// ---------------------------------------------------------------------------
	// Toc — auto heading collection + scroll-spy, nested h2/h3
	// levels, mobile collapse, smooth scroll, and an active-heading callback.
	// Promoted from the docs shell's prototype (src/docs/Toc.svelte, deleted by
	// R9); the collection filter, rAF spy, and bottom-pin rule are unchanged,
	// generalized behind props instead of hard-coded docs selectors.
	// ---------------------------------------------------------------------------

	/** An entry plus its nested children — internal render shape only; the
	 *  public TocEntry (id/label/level) stays flat, per the API sketch. */
	interface TocNode extends TocEntry {
		children: TocNode[];
	}

	interface Props {
		/** Selector or element to collect headings from. Default 'main'. */
		container?: string | HTMLElement;
		/** Heading levels to collect (2 = h2, 3 = h3, …). Default [2]. */
		levels?: number[];
		/** Headings inside a match are skipped. A single selector, or an array
		 *  of selectors (combined — a heading matching any is skipped). */
		exclude?: string | string[];
		/** Render nothing below this many entries. Default 2. */
		minEntries?: number;
		/** Visible title. '' hides it. Default 'On this page'. */
		title?: string;
		/** Nav landmark name. Defaults to `title`. */
		ariaLabel?: string;
		/** Slugify id-less headings (kebab, deduped with -2, -3 …). Default true. */
		autoId?: boolean;
		/** MutationObserver re-collection on container changes. Default true. */
		watch?: boolean;
		/** Smooth scroll on link click; instant under reduced motion. Default true. */
		smoothScroll?: boolean;
		/** Collapse into a disclosure below this width. Default 'none' (never). */
		breakpoint?: 'sm' | 'md' | 'lg' | 'none';
		/** Bindable id of the current heading. */
		active?: string;
		/** Fires when the active heading changes (not per scroll frame). */
		onActive?: (id: string) => void;
		class?: string;
		[key: string]: unknown;
	}

	let {
		container = 'main',
		levels = [2],
		exclude,
		minEntries = 2,
		title = 'On this page',
		ariaLabel,
		autoId = true,
		watch = true,
		smoothScroll = true,
		breakpoint = 'none',
		active = $bindable(''),
		onActive,
		class: className,
		...rest
	}: Props = $props();

	// The nav landmark's name defaults to the visible title — literally,
	// even when title is '' (an empty landmark name is then the consumer's to
	// fix via an explicit ariaLabel; see the Toc docs page a11y note).
	const effectiveAriaLabel = $derived(ariaLabel ?? title);

	const panelId = uid('hz-toc-panel');

	let rootEl = $state<HTMLElement | null>(null);
	let triggerEl = $state<HTMLButtonElement | null>(null);

	// ---------------------------------------------------------------------------
	// Collection
	// ---------------------------------------------------------------------------

	let entries = $state<TocEntry[]>([]);
	// The live heading elements behind `entries`, same order — not reactive
	// state; only the scroll-spy (imperative, rAF-driven) reads it.
	let headingEls: HTMLHeadingElement[] = [];
	// The resolved container, cached by collect() — the scroll-spy reads
	// it every animation frame and has no reason to re-run resolveContainer()
	// (and its selector query) that often.
	let containerEl: HTMLElement | null = null;

	let warnedMissing = false;
	let warnedMultiple = false;

	/** Resolves `container` to a single element. First match + dev-warn on a
	 *  multi-match selector; dev-warns once and returns null when nothing
	 *  matches. */
	function resolveContainer(): HTMLElement | null {
		if (container instanceof HTMLElement) return container;
		const matches = document.querySelectorAll<HTMLElement>(container);
		if (matches.length === 0) {
			if (import.meta.env.DEV && !warnedMissing) {
				console.warn(`[hz-toc] container "${container}" matched no element — Toc renders nothing.`);
				warnedMissing = true;
			}
			return null;
		}
		if (matches.length > 1 && import.meta.env.DEV && !warnedMultiple) {
			console.warn(
				`[hz-toc] container "${container}" matched ${matches.length} elements — using the first.`
			);
			warnedMultiple = true;
		}
		return matches[0];
	}

	/** Deterministic kebab slug of heading text; falls back to a stable name
	 *  for headings with no usable text. */
	function slugify(text: string): string {
		const slug = text
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
		return slug || 'section';
	}

	/** Dedupes a slug against ids already claimed in this pass: usage, usage-2,
	 *  usage-3 … */
	function dedupe(base: string, used: Set<string>): string {
		if (!used.has(base)) return base;
		let i = 2;
		while (used.has(`${base}-${i}`)) i++;
		return `${base}-${i}`;
	}

	/** Collect headings inside `container` matching `levels`, skipping
	 *  excluded/hidden/self headings. Re-run by the watch effect and
	 *  exposed as `refresh()` for manual control. */
	function collect(): void {
		const target = resolveContainer();
		containerEl = target;
		if (!target) {
			entries = [];
			headingEls = [];
			updateActive();
			return;
		}

		const selector = levels.map((l) => `h${l}`).join(',');
		// One selector, or an array combined into a single selector list — an
		// empty array (or all-empty entries) collapses to '' and excludes nothing.
		const excludeSelector = Array.isArray(exclude) ? exclude.filter(Boolean).join(',') : exclude;
		const found = selector
			? Array.from(target.querySelectorAll<HTMLHeadingElement>(selector)).filter((h) => {
					if (excludeSelector && h.closest(excludeSelector)) return false;
					// Self-exclusion: never collect the Toc's own title/trigger, and
					// never collect from inside the Toc if it happens to be nested
					// inside `container`.
					if (rootEl && rootEl.contains(h)) return false;
					if (h.offsetParent === null) return false;
					return true;
				})
			: [];

		// Existing ids are claimed up front so a generated slug never collides
		// with a heading that already carries one. A plain Set, deliberately —
		// this is a throwaway bookkeeping value local to one collect() pass,
		// never read reactively, so SvelteSet's tracking overhead buys nothing.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const used = new Set<string>();
		for (const h of found) if (h.id) used.add(h.id);

		const nextEntries: TocEntry[] = [];
		const nextHeadings: HTMLHeadingElement[] = [];
		for (const h of found) {
			let id = h.id;
			if (!id) {
				// autoId={false}: id-less headings are skipped, not collected.
				if (!autoId) continue;
				id = dedupe(slugify(h.textContent ?? ''), used);
				h.id = id;
			}
			// Never re-slug an existing id — only its label is re-read.
			used.add(id);
			nextEntries.push({
				id,
				label: h.textContent?.trim() ?? '',
				level: Number(h.tagName.slice(1))
			});
			nextHeadings.push(h);
		}

		entries = nextEntries;
		headingEls = nextHeadings;
		updateActive();
	}

	/** Manual re-collection — for `watch={false}`, or any time a consumer
	 *  knows the DOM changed. */
	export function refresh(): void {
		collect();
	}

	// Re-collect whenever the props that shape collection change, and once
	// `rootEl` is bound (self-exclusion needs it) — collect() reads all of
	// these synchronously, so $effect tracks them as dependencies through the
	// call.
	$effect(() => {
		collect();
	});

	// Watch: MutationObserver on the container (childList + subtree),
	// debounced 120ms — the observers module's `mutate` attachment (
	// R9), which already owns the debounce-timer + disconnect teardown
	// discipline this effect used to hand-roll. No `$app/*` import — SPA
	// navigations "just work" because the framework already mutates the DOM
	// the observer is watching.
	//
	// Toc resolves its container imperatively (it may be a selector string,
	// not the component's own node), so the attachment factory is invoked
	// directly on the resolved element here rather than via `{@attach}`
	// markup — `mutate(...)` returns a plain `(node) => cleanup`, a supported
	// call form.
	$effect(() => {
		if (!watch) return;
		const target = resolveContainer();
		if (!target) return;

		return mutate(() => collect(), { childList: true, subtree: true, debounce: 120 })(target);
	});

	// ---------------------------------------------------------------------------
	// Nesting: deeper levels nest under the nearest preceding shallower
	// entry; orphan deep headings (h3 before any h2) attach at the top level.
	// ---------------------------------------------------------------------------

	function buildTree(list: TocEntry[]): TocNode[] {
		const root: TocNode[] = [];
		const stack: TocNode[] = [];
		for (const entry of list) {
			const node: TocNode = { ...entry, children: [] };
			while (stack.length && stack[stack.length - 1].level >= node.level) stack.pop();
			(stack.length ? stack[stack.length - 1].children : root).push(node);
			stack.push(node);
		}
		return root;
	}

	const tree = $derived(buildTree(entries));
	const visible = $derived(entries.length >= minEntries);

	// ---------------------------------------------------------------------------
	// Scroll-spy. The active entry is the last heading at or above the top
	// quarter of the SCROLLING VIEWPORT — the page itself, ordinarily, but
	// `container` may just as well live inside its own `overflow: auto`
	// region (a demo pane, a modal body, a split-pane doc viewer); the whole
	// window's threshold and bottom-of-page pin would be meaningless there,
	// since the region's box stays put on the page while only its content
	// scrolls. findScrollParent() finds that nearest scrolling ancestor (or
	// null for "the page itself"), and both the threshold and the bottom pin
	// are computed against it. Positions are read live per animation frame;
	// listeners are passive and cleaned up on destroy.
	//
	// The scroll listener is registered on `window` with `capture: true` (in
	// addition to a direct listener on the scroll parent itself, belt and
	// suspenders) — 'scroll' events on an element only bubble to `window` in
	// newer browsers, and capture-phase listening catches it unconditionally
	// regardless of that.
	// ---------------------------------------------------------------------------

	let raf = 0;

	/** The nearest scrollable ancestor of `el` (inclusive), or null when
	 *  nothing between it and the page itself actually scrolls. */
	function findScrollParent(el: HTMLElement): HTMLElement | null {
		let node: HTMLElement | null = el;
		while (node && node !== document.body && node !== document.documentElement) {
			const overflowY = getComputedStyle(node).overflowY;
			if (
				(overflowY === 'auto' || overflowY === 'scroll') &&
				node.scrollHeight > node.clientHeight
			) {
				return node;
			}
			node = node.parentElement;
		}
		return null;
	}

	function setActive(id: string): void {
		if (active === id) return;
		active = id;
		onActive?.(id);
	}

	function updateActive(): void {
		if (headingEls.length === 0) {
			setActive('');
			return;
		}

		const scrollParent = containerEl && findScrollParent(containerEl);
		const rootTop = scrollParent ? scrollParent.getBoundingClientRect().top : 0;
		const rootHeight = scrollParent ? scrollParent.clientHeight : window.innerHeight;
		const threshold = rootTop + rootHeight * 0.25;

		let current = headingEls[0].id;
		for (const h of headingEls) {
			if (h.getBoundingClientRect().top <= threshold) current = h.id;
			else break;
		}

		const atBottom = scrollParent
			? scrollParent.scrollTop + scrollParent.clientHeight >= scrollParent.scrollHeight - 2
			: window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
		if (atBottom) current = headingEls[headingEls.length - 1].id;

		setActive(current);
	}

	function onScroll(): void {
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(updateActive);
	}

	$effect(() => {
		const target = resolveContainer();
		const scrollParent = target && findScrollParent(target);

		// capture: true — see the note above; a scrollable ancestor other than
		// the page itself must still reach this listener even if it somehow
		// doesn't bubble. The direct listener below is the belt-and-suspenders
		// half: guaranteed to fire regardless of propagation semantics.
		window.addEventListener('scroll', onScroll, { passive: true, capture: true });
		window.addEventListener('resize', onScroll, { passive: true });
		scrollParent?.addEventListener('scroll', onScroll, { passive: true });

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('scroll', onScroll, { capture: true });
			window.removeEventListener('resize', onScroll);
			scrollParent?.removeEventListener('scroll', onScroll);
		};
	});

	// ---------------------------------------------------------------------------
	// Link activation: smooth scroll (instant under reduced motion or
	// smoothScroll={false}), URL hash via replaceState (no history spam), the
	// active entry updates immediately. `history.state` is preserved rather
	// than cleared, so this never fights a host router's own history state.
	// ---------------------------------------------------------------------------

	/**
	 * Scrolls `heading` to the start of its scrolling viewport. When
	 * `container` lives inside its own `overflow: auto` region, this moves
	 * only that region's scrollTop — native scrollIntoView would otherwise
	 * also scroll the page itself if the region's own box isn't already
	 * fully in view, which fights a reader who is deliberately scrolling the
	 * region in isolation (a demo pane, a modal body, a split-pane viewer).
	 * Falls back to native scrollIntoView when nothing between the container
	 * and the page scrolls — the ordinary, whole-page case.
	 */
	function scrollToHeading(heading: HTMLHeadingElement, instant: boolean): void {
		const behavior: ScrollBehavior = instant ? 'auto' : 'smooth';
		const scrollParent = containerEl && findScrollParent(containerEl);
		if (!scrollParent) {
			heading.scrollIntoView({ behavior, block: 'start' });
			return;
		}
		const parentRect = scrollParent.getBoundingClientRect();
		const headingRect = heading.getBoundingClientRect();
		const offsetWithin = headingRect.top - parentRect.top + scrollParent.scrollTop;
		scrollParent.scrollTo({ top: offsetWithin, behavior });
	}

	function onLinkClick(e: MouseEvent, id: string): void {
		e.preventDefault();
		setActive(id);
		const heading = headingEls.find((h) => h.id === id);
		const instant = !smoothScroll || prefersReducedMotion.current;
		if (heading) scrollToHeading(heading, instant);
		history.replaceState(history.state, '', `#${id}`);
		// Selecting an entry closes the mobile disclosure.
		open = false;
	}

	// ---------------------------------------------------------------------------
	// Mobile collapse disclosure. Escape and outside-click close it;
	// Escape returns focus to the trigger (Header's drawer precedent) —
	// outside-click does not (Dropdown's precedent: focus lands wherever the
	// click's own default action put it).
	// ---------------------------------------------------------------------------

	let open = $state(false);

	function toggleOpen(): void {
		open = !open;
	}

	function onPanelKeydown(e: KeyboardEvent): void {
		if (e.key !== 'Escape') return;
		e.preventDefault();
		open = false;
		triggerEl?.focus();
	}

	function onDocumentClick(e: MouseEvent): void {
		if (!open) return;
		if (rootEl && e.composedPath().includes(rootEl)) return;
		open = false;
	}

	$effect(() => {
		document.addEventListener('click', onDocumentClick);
		return () => document.removeEventListener('click', onDocumentClick);
	});
</script>

{#snippet entryList(nodes: TocNode[])}
	<ul class="hz-toc-list">
		{#each nodes as node (node.id)}
			<li>
				<a
					href="#{node.id}"
					class="hz-toc-link"
					data-level={node.level}
					aria-current={active === node.id ? 'location' : undefined}
					onclick={(e) => onLinkClick(e, node.id)}
				>
					{node.label}
				</a>
				{#if node.children.length > 0}
					{@render entryList(node.children)}
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

{#if visible}
	<nav
		{...rest}
		bind:this={rootEl}
		class={cx('hz-toc', className)}
		aria-label={effectiveAriaLabel}
		data-breakpoint={breakpoint}
		data-collapsed={breakpoint !== 'none' && !open ? '' : undefined}
	>
		{#if title}
			<!-- A plain element, never a heading — the Toc must not add to the
			     document outline or collect itself. -->
			<p class="hz-toc-title">{title}</p>
		{/if}
		<!-- Always rendered; the theme shows this XOR the plain title above,
		     by data-breakpoint and the viewport (Header's toggle precedent). -->
		<button
			bind:this={triggerEl}
			type="button"
			class="hz-toc-trigger"
			aria-expanded={open ? 'true' : 'false'}
			aria-controls={panelId}
			aria-label={title ? undefined : effectiveAriaLabel}
			onclick={toggleOpen}
		>
			{#if title}<span class="hz-toc-trigger-label">{title}</span>{/if}
			<IconChevronDown />
		</button>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div id={panelId} class="hz-toc-panel" onkeydown={onPanelKeydown}>
			{@render entryList(tree)}
		</div>
	</nav>
{/if}

<style>
	/*
	 * Structural collapse mechanics only (which of title/trigger shows,
	 * whether the panel is visible); colors, spacing, and typography are
	 * theme/toc.css. Breakpoints are literal px mirroring --hz-width-sm/md/lg
	 * (640/968/1200) — the Grid BAND / Table stacked precedent (,
	 *): CSS cannot read custom properties in a media query. This is a
	 * real @media query against the viewport, not a container query — the
	 * rail's own box is typically narrow regardless of page width, so its own
	 * inline-size is not a usable "mobile" signal (Header's container-query
	 * precedent does not transfer here for that reason).
	 */
	.hz-toc-trigger {
		display: none;
	}

	.hz-toc[data-breakpoint='sm'] .hz-toc-trigger,
	.hz-toc[data-breakpoint='md'] .hz-toc-trigger,
	.hz-toc[data-breakpoint='lg'] .hz-toc-trigger {
		display: flex;
	}

	.hz-toc[data-breakpoint='sm'] .hz-toc-title,
	.hz-toc[data-breakpoint='md'] .hz-toc-title,
	.hz-toc[data-breakpoint='lg'] .hz-toc-title {
		display: none;
	}

	.hz-toc[data-breakpoint='sm'][data-collapsed] .hz-toc-panel,
	.hz-toc[data-breakpoint='md'][data-collapsed] .hz-toc-panel,
	.hz-toc[data-breakpoint='lg'][data-collapsed] .hz-toc-panel {
		display: none;
	}

	/* sm — 640px */
	@media (min-width: 640px) {
		.hz-toc[data-breakpoint='sm'] .hz-toc-trigger {
			display: none;
		}
		.hz-toc[data-breakpoint='sm'] .hz-toc-title {
			display: block;
		}
		.hz-toc[data-breakpoint='sm'] .hz-toc-panel {
			display: block !important;
		}
	}

	/* md — 968px */
	@media (min-width: 968px) {
		.hz-toc[data-breakpoint='md'] .hz-toc-trigger {
			display: none;
		}
		.hz-toc[data-breakpoint='md'] .hz-toc-title {
			display: block;
		}
		.hz-toc[data-breakpoint='md'] .hz-toc-panel {
			display: block !important;
		}
	}

	/* lg — 1200px */
	@media (min-width: 1200px) {
		.hz-toc[data-breakpoint='lg'] .hz-toc-trigger {
			display: none;
		}
		.hz-toc[data-breakpoint='lg'] .hz-toc-title {
			display: block;
		}
		.hz-toc[data-breakpoint='lg'] .hz-toc-panel {
			display: block !important;
		}
	}
</style>
