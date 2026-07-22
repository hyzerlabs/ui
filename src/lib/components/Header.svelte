<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { NavItem } from '$lib/types';
	import { cx, uid } from '$lib/utils';
	import Nav from './Nav.svelte';
	import IconMenu from '$lib/icons/generated/menu.svelte';

	type HeaderVariant = 'default' | 'transparent';
	type HeaderBreakpoint = 'sm' | 'md' | 'lg' | 'none';

	interface Props {
		/** Navigation items — rendered horizontally in the bar, vertically in the drawer. */
		items: NavItem[];
		/** Brand / logo region at the start of the bar. */
		brand?: Snippet;
		/** Actions region at the end of the bar (and repeated in the drawer). */
		actions?: Snippet;
		sticky?: boolean;
		variant?: HeaderVariant;
		/** Bottom hairline border — composes with any variant. */
		bordered?: boolean;
		/** Below this width the bar collapses into a hamburger + drawer. */
		mobileBreakpoint?: HeaderBreakpoint;
		/** Accessible name for the navigation. Required for meaningful landmarks. */
		ariaLabel?: string;
		menuIcon?: Snippet;
		/** Forwarded to both Navs. */
		chevronIcon?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		items,
		brand,
		actions,
		sticky = false,
		variant = 'default',
		bordered = false,
		mobileBreakpoint = 'md',
		ariaLabel = 'Main navigation',
		menuIcon,
		chevronIcon,
		class: className,
		...rest
	}: Props = $props();

	const drawerId = uid('hz-header-drawer');

	let mobileOpen = $state(false);
	let toggleEl = $state<HTMLButtonElement | null>(null);

	function toggleMobile() {
		mobileOpen = !mobileOpen;
	}

	function closeMobile() {
		mobileOpen = false;
		toggleEl?.focus();
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
	class={cx('hz-header', className)}
	data-variant={variant}
	data-bordered={bordered ? '' : undefined}
	data-sticky={sticky ? '' : undefined}
	data-mobile-breakpoint={mobileBreakpoint}
>
	<div class="hz-header-inner">
		{#if brand}
			<div class="hz-header-brand">{@render brand()}</div>
		{/if}

		<Nav {items} orientation="horizontal" {ariaLabel} {chevronIcon} />

		{#if actions}
			<div class="hz-header-actions">{@render actions()}</div>
		{/if}

		<button
			bind:this={toggleEl}
			class="hz-header-toggle"
			aria-expanded={mobileOpen ? 'true' : 'false'}
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
		data-state={mobileOpen ? 'open' : 'closed'}
		onkeydown={onDrawerKeydown}
	>
		<Nav {items} orientation="vertical" ariaLabel="{ariaLabel} (menu)" {chevronIcon} />
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
		z-index: 100;
	}

	.hz-header-inner {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: var(--hz-space-md, 2rem);
	}

	.hz-header-brand {
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
	.hz-header[data-mobile-breakpoint='lg'] .hz-header-inner :global(.hz-nav) {
		display: none;
	}

	.hz-header[data-mobile-breakpoint='sm'] .hz-header-toggle,
	.hz-header[data-mobile-breakpoint='md'] .hz-header-toggle,
	.hz-header[data-mobile-breakpoint='lg'] .hz-header-toggle {
		display: flex;
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
