<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { DEV } from 'esm-env';
	import type { NavItem } from '$lib/types';
	import { cx, uid } from '$lib/utils';
	import { resize } from '$lib/observers';
	import Nav from './Nav.svelte';
	import IconMenu from '$lib/icons/generated/menu.svelte';

	type HeaderVariant = 'default' | 'transparent';
	type HeaderBreakpoint = 'sm' | 'md' | 'lg' | 'none' | number;

	/**
	 * The three built-in tiers, matching the literal `min-width` values in
	 * this file's own @container rules below — a source-scan spec pins the
	 * two together so they cannot drift (specs/64 R6).
	 */
	const TIERS = { sm: 640, md: 968, lg: 1200 } as const;

	/** The built-in tier whose literal threshold is closest to `n` — ties go
	 *  to the smaller tier (specs/64 R2: minimizes the pre-hydration mismatch
	 *  band in both directions). */
	function nearestTier(n: number): 'sm' | 'md' | 'lg' {
		let best: 'sm' | 'md' | 'lg' = 'sm';
		let bestDelta = Math.abs(TIERS.sm - n);
		for (const tier of ['md', 'lg'] as const) {
			const delta = Math.abs(TIERS[tier] - n);
			if (delta < bestDelta) {
				best = tier;
				bestDelta = delta;
			}
		}
		return best;
	}

	interface Props {
		/** Navigation items — rendered horizontally in the bar, vertically in the drawer. */
		items: NavItem[];
		/** Logo region at the start of the bar. */
		logo?: Snippet;
		/** Actions region at the end of the bar (and repeated in the drawer). */
		actions?: Snippet;
		sticky?: boolean;
		variant?: HeaderVariant;
		/** Bottom hairline border — composes with any variant. */
		bordered?: boolean;
		/**
		 * Below this width the bar collapses into a hamburger + drawer. The
		 * named tiers ('sm' | 'md' | 'lg') are container queries against the
		 * header's own width — CSS-only, zero JS. A number opts into measured
		 * mode instead: a `resize` attachment on the header's own content-box
		 * width, matching `@container (min-width: X)` semantics exactly — for
		 * a retuned `--hz-width-*` scale a literal tier can't follow. Before
		 * hydration (and with no JS) a number renders as its nearest built-in
		 * tier, so a no-JS page never collapses worse than today.
		 */
		mobileBreakpoint?: HeaderBreakpoint;
		/** Accessible name for the navigation. Required for meaningful landmarks. */
		ariaLabel?: string;
		/**
		 * Bindable. The mobile drawer's open state — drive it externally (e.g.
		 * close on SPA navigation) or read it. Activating a drawer link closes
		 * the drawer on its own.
		 */
		open?: boolean;
		menuIcon?: Snippet;
		/** Forwarded to both Navs. */
		chevronIcon?: Snippet;
		/**
		 * Forwarded to both Navs as their itemClass — one class on every
		 * rendered nav link (bar and drawer), for attaching a site's existing
		 * link styling. `class` stays the root header's hook.
		 */
		navItemClass?: string;
		class?: string;
		[key: string]: unknown;
	}

	let {
		items,
		logo,
		actions,
		sticky = false,
		variant = 'default',
		bordered = false,
		mobileBreakpoint = 'md',
		ariaLabel = 'Main navigation',
		open = $bindable(false),
		menuIcon,
		chevronIcon,
		navItemClass,
		class: className,
		...rest
	}: Props = $props();

	const drawerId = uid('hz-header-drawer');

	let toggleEl = $state<HTMLButtonElement | null>(null);

	// ---------------------------------------------------------------------------
	// Measured mode (specs/64 R1/R2/R4) — a number `mobileBreakpoint` opts into
	// a `resize`-attachment-driven collapse instead of the literal-px
	// container queries below.
	// ---------------------------------------------------------------------------

	let warnedInvalidBreakpoint = false;

	/** `mobileBreakpoint`, with a non-finite or <= 0 number folded to 'none' —
	 *  a DEV-only warn, once, naming the prop and the received value (R4). A
	 *  fallback of 'none' rather than the 'md' default: 'none' never invents a
	 *  collapse the consumer didn't ask for. */
	const effectiveBreakpoint = $derived.by((): HeaderBreakpoint => {
		if (typeof mobileBreakpoint !== 'number') return mobileBreakpoint;
		if (Number.isFinite(mobileBreakpoint) && mobileBreakpoint > 0) return mobileBreakpoint;
		if (DEV && !warnedInvalidBreakpoint) {
			warnedInvalidBreakpoint = true;
			console.warn(
				`[hyzer-ui] <Header>: mobileBreakpoint must be a finite number > 0 (or 'sm' | 'md' | 'lg' | 'none') — received ${mobileBreakpoint}. Falling back to 'none'.`
			);
		}
		return 'none';
	});

	const breakpointNumber = $derived(
		typeof effectiveBreakpoint === 'number' ? effectiveBreakpoint : null
	);
	const measured = $derived(breakpointNumber !== null);

	let measuredWidth = $state<number | null>(null);
	// Flips true on the first ResizeObserver delivery — the HTML rendering
	// steps deliver it before paint, so the data-mobile-breakpoint /
	// data-collapsed swap below is not a visible flash (R2).
	let hasMeasured = $state(false);

	function onMeasure(entry: ResizeObserverEntry): void {
		measuredWidth = entry.contentRect.width;
		hasMeasured = true;
	}

	const noopAttachment: Attachment = () => {};
	// Created only in measured mode — no observer in string mode (R1).
	const resizeAttachment: Attachment = $derived(measured ? resize(onMeasure) : noopAttachment);

	// Strictly less than the number collapses, >= it expands — matching
	// @container (min-width: X) semantics exactly.
	const collapsed = $derived(
		measured &&
			hasMeasured &&
			measuredWidth !== null &&
			measuredWidth < (breakpointNumber as number)
	);

	const mobileBreakpointAttr = $derived(
		measured
			? hasMeasured
				? 'custom'
				: nearestTier(breakpointNumber as number)
			: effectiveBreakpoint
	);

	// Expanding out from under a measured collapse closes any open drawer.
	// The container-query path hard-hides the drawer with `display: none
	// !important`; measured mode has no such hammer, so a drawer left open
	// behind a hidden toggle (aria-expanded="true") is the bug this replaces
	// (R4).
	let wasCollapsed = false;
	$effect(() => {
		const isCollapsed = collapsed;
		if (wasCollapsed && !isCollapsed) open = false;
		wasCollapsed = isCollapsed;
	});

	function toggleMobile() {
		open = !open;
	}

	function closeMobile() {
		open = false;
		toggleEl?.focus();
	}

	// A drawer link was activated: the page is navigating (SPA routers swap
	// the page under an open drawer), so close it. No focus move — the
	// navigation owns where focus lands next.
	function onDrawerClick(e: MouseEvent) {
		if ((e.target as HTMLElement).closest('a[href]')) open = false;
	}

	// Focus trap + Escape for the open drawer (moved from Nav, spec 35 R4).
	function onDrawerKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			closeMobile();
			return;
		}
		if (e.key !== 'Tab') return;

		const drawer = document.getElementById(drawerId);
		if (!drawer) return;

		const focusable = Array.from(
			drawer.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		).filter((el) => !el.closest('[tabindex="-1"]'));

		if (focusable.length === 0) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const active = document.activeElement as HTMLElement;

		if (e.shiftKey) {
			if (active === first || !drawer.contains(active)) {
				e.preventDefault();
				last.focus();
			}
		} else {
			if (active === last || !drawer.contains(active)) {
				e.preventDefault();
				first.focus();
			}
		}
	}
</script>

<header
	{...rest}
	{@attach resizeAttachment}
	class={cx('hz-header', className)}
	data-variant={variant}
	data-bordered={bordered ? '' : undefined}
	data-sticky={sticky ? '' : undefined}
	data-mobile-breakpoint={mobileBreakpointAttr}
	data-collapsed={collapsed ? '' : undefined}
>
	<div class="hz-header-inner">
		{#if logo}
			<div class="hz-header-logo">{@render logo()}</div>
		{/if}

		<Nav {items} orientation="horizontal" {ariaLabel} {chevronIcon} itemClass={navItemClass} />

		{#if actions}
			<div class="hz-header-actions">{@render actions()}</div>
		{/if}

		<button
			bind:this={toggleEl}
			class="hz-header-toggle"
			aria-expanded={open ? 'true' : 'false'}
			aria-controls={drawerId}
			aria-label="Toggle navigation menu"
			onclick={toggleMobile}
		>
			{#if menuIcon}{@render menuIcon()}{:else}<IconMenu />{/if}
		</button>
	</div>

	<!-- Drawer: a vertical Nav (same items) + the actions, revealed below the
	     breakpoint. -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		id={drawerId}
		class="hz-header-drawer"
		data-state={open ? 'open' : 'closed'}
		onkeydown={onDrawerKeydown}
		onclick={onDrawerClick}
	>
		<Nav
			{items}
			orientation="vertical"
			ariaLabel="{ariaLabel} (menu)"
			{chevronIcon}
			itemClass={navItemClass}
		/>
		{#if actions}
			<div class="hz-header-drawer-actions">{@render actions()}</div>
		{/if}
	</div>
</header>

<style>
	/*
	 * The header is its own size container: the responsive collapse below is a
	 * container query against the header's width (consistent with Grid/Split).
	 * Thresholds mirror --hz-width-sm/md/lg but stay literal — CSS cannot read
	 * custom properties in container queries.
	 */
	.hz-header {
		position: relative;
		container-type: inline-size;
	}

	.hz-header[data-sticky] {
		position: sticky;
		top: 0;
		/* the shared sticky tier — Banner's pin uses the same token. */
		z-index: var(--hz-z-sticky, 100);
	}

	.hz-header-inner {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: var(--hz-space-md, 2rem);
	}

	.hz-header-logo {
		flex-shrink: 0;
	}

	/* The bar nav grows to fill the middle. */
	.hz-header-inner :global(.hz-nav) {
		flex: 1;
	}

	.hz-header-actions {
		flex-shrink: 0;
	}

	/* Hidden until the bar collapses. */
	.hz-header-toggle {
		display: none;
	}

	.hz-header-drawer {
		width: 100%;
	}

	.hz-header-drawer[data-state='closed'] {
		display: none;
	}

	.hz-header-drawer[data-state='open'] {
		display: block;
	}

	.hz-header-drawer-actions {
		margin-top: var(--hz-space-sm, 1rem);
	}

	/* ------------------------------------------------------------------ */
	/* Responsive collapse — hide the bar nav, show the hamburger, below    */
	/* the breakpoint; the container query re-opens the bar above it.       */
	/* ------------------------------------------------------------------ */

	.hz-header[data-mobile-breakpoint='sm'] .hz-header-inner :global(.hz-nav),
	.hz-header[data-mobile-breakpoint='md'] .hz-header-inner :global(.hz-nav),
	.hz-header[data-mobile-breakpoint='lg'] .hz-header-inner :global(.hz-nav),
	.hz-header[data-collapsed] .hz-header-inner :global(.hz-nav) {
		display: none;
	}

	.hz-header[data-mobile-breakpoint='sm'] .hz-header-toggle,
	.hz-header[data-mobile-breakpoint='md'] .hz-header-toggle,
	.hz-header[data-mobile-breakpoint='lg'] .hz-header-toggle,
	.hz-header[data-collapsed] .hz-header-toggle {
		display: flex;
	}

	/*
	 * Collapsed bar: with the bar Nav display:none, it no longer soaks up
	 * the row's free space (its flex: 1 stops applying once removed from
	 * flow), so justify-content: space-between floats .hz-header-actions in
	 * the middle of the row between the logo and the hamburger. An auto
	 * inline-start margin claims that free space instead, pinning actions
	 * to the end, next to the toggle — the standard mobile-header pattern
	 * (user decision 2026-07-23). Above the breakpoint the visible Nav's
	 * flex: 1 already consumes the free space first, so this margin
	 * resolves to 0 and the bar layout is unaffected.
	 */
	.hz-header[data-mobile-breakpoint='sm'] .hz-header-actions,
	.hz-header[data-mobile-breakpoint='md'] .hz-header-actions,
	.hz-header[data-mobile-breakpoint='lg'] .hz-header-actions,
	.hz-header[data-collapsed] .hz-header-actions {
		margin-inline-start: auto;
	}

	/* 'none' — never collapses (e.g. embedded in a shell that owns its own
	 * responsive behavior). Bar stays inline; toggle and drawer are off. */
	.hz-header[data-mobile-breakpoint='none'] .hz-header-toggle,
	.hz-header[data-mobile-breakpoint='none'] .hz-header-drawer {
		display: none;
	}

	/* sm — 640px */
	@container (min-width: 640px) {
		.hz-header[data-mobile-breakpoint='sm'] .hz-header-inner :global(.hz-nav) {
			display: block;
		}
		.hz-header[data-mobile-breakpoint='sm'] .hz-header-toggle {
			display: none;
		}
		.hz-header[data-mobile-breakpoint='sm'] .hz-header-drawer {
			display: none !important;
		}
	}

	/* md — 968px */
	@container (min-width: 968px) {
		.hz-header[data-mobile-breakpoint='md'] .hz-header-inner :global(.hz-nav) {
			display: block;
		}
		.hz-header[data-mobile-breakpoint='md'] .hz-header-toggle {
			display: none;
		}
		.hz-header[data-mobile-breakpoint='md'] .hz-header-drawer {
			display: none !important;
		}
	}

	/* lg — 1200px */
	@container (min-width: 1200px) {
		.hz-header[data-mobile-breakpoint='lg'] .hz-header-inner :global(.hz-nav) {
			display: block;
		}
		.hz-header[data-mobile-breakpoint='lg'] .hz-header-toggle {
			display: none;
		}
		.hz-header[data-mobile-breakpoint='lg'] .hz-header-drawer {
			display: none !important;
		}
	}
</style>
