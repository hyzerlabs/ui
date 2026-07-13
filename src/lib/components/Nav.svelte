<script lang="ts">
	import type { Snippet } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { NavItem } from '$lib/types';
	import { cx, uid } from '$lib/utils';
	import Link from './Link.svelte';
	import IconMenu from '$lib/icons/IconMenu.svelte';
	import IconChevronDown from '$lib/icons/IconChevronDown.svelte';

	type NavVariant = 'default' | 'transparent' | 'bordered';
	type NavBreakpoint = 'sm' | 'md' | 'lg';
	type NavOrientation = 'horizontal' | 'vertical';

	interface Props {
		items: NavItem[];
		sticky?: boolean;
		variant?: NavVariant;
		/**
		 * Vertical renders a sidebar-style column: submenus become collapsible
		 * inline disclosure sections (multiple may be open at once) and the
		 * hamburger collapse is disabled.
		 */
		orientation?: NavOrientation;
		mobileBreakpoint?: NavBreakpoint;
		ariaLabel?: string;
		logo?: Snippet;
		actions?: Snippet;
		menuIcon?: Snippet;
		chevronIcon?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		items,
		sticky = false,
		variant = 'default',
		orientation = 'horizontal',
		mobileBreakpoint = 'md',
		ariaLabel = 'Main navigation',
		logo,
		actions,
		menuIcon,
		chevronIcon,
		class: className,
		...rest
	}: Props = $props();

	const isVertical = $derived(orientation === 'vertical');

	// Stable IDs: WeakMap keyed on each NavItem object so IDs survive
	// reactive re-derivations without changing value for the same item.
	const _idCache = new WeakMap<NavItem, string>();
	function getPanelId(item: NavItem): string {
		if (!_idCache.has(item)) _idCache.set(item, uid('hz-nav-panel'));
		return _idCache.get(item)!;
	}

	// Derived so the array stays in sync if `items` ever changes.
	const panelIds = $derived(items.map(getPanelId));

	// Stable menu ID generated once per component instance.
	const menuId = uid('hz-nav-menu');

	// Open state: index of the currently-open desktop dropdown, or null.
	// Horizontal bars are single-open (opening one closes the others).
	let openIndex = $state<number | null>(null);

	// Vertical sidebars are multi-open: any number of sections at once.
	const openSections = new SvelteSet<number>();

	function isOpen(index: number): boolean {
		return isVertical ? openSections.has(index) : openIndex === index;
	}

	// Mobile menu open state.
	let mobileOpen = $state(false);

	// Trigger button elements — populated via bind:this in the template.
	let triggerEls = $state<(HTMLButtonElement | null)[]>([]);

	// Mobile toggle button element.
	let toggleEl = $state<HTMLButtonElement | null>(null);

	function toggleDesktop(index: number) {
		if (isVertical) {
			if (openSections.has(index)) openSections.delete(index);
			else openSections.add(index);
		} else {
			openIndex = openIndex === index ? null : index;
		}
	}

	function closeDesktop() {
		openIndex = null;
	}

	function toggleMobile() {
		mobileOpen = !mobileOpen;
	}

	function closeMobile() {
		mobileOpen = false;
		toggleEl?.focus();
	}

	// ------------------------------------------------------------------
	// Keyboard: desktop dropdown triggers
	// ------------------------------------------------------------------

	function onTriggerKeydown(e: KeyboardEvent, index: number) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			toggleDesktop(index);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			openIndex = index;
			// Focus first menuitem after Svelte updates the DOM.
			setTimeout(() => focusMenuItem(index, 0), 0);
		} else if (e.key === 'Escape') {
			if (openIndex === index) {
				closeDesktop();
				triggerEls[index]?.focus();
			}
		}
	}

	// ------------------------------------------------------------------
	// Keyboard: within an open role="menu" panel
	// ------------------------------------------------------------------

	function onMenuKeydown(e: KeyboardEvent, index: number) {
		const panel = document.getElementById(panelIds[index]);
		if (!panel) return;
		const menuItems = Array.from(panel.querySelectorAll<HTMLElement>('[role="menuitem"]'));
		const current = document.activeElement as HTMLElement;
		const currentIdx = menuItems.indexOf(current);

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			menuItems[(currentIdx + 1) % menuItems.length]?.focus();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			menuItems[(currentIdx - 1 + menuItems.length) % menuItems.length]?.focus();
		} else if (e.key === 'Home') {
			e.preventDefault();
			menuItems[0]?.focus();
		} else if (e.key === 'End') {
			e.preventDefault();
			menuItems[menuItems.length - 1]?.focus();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			closeDesktop();
			triggerEls[index]?.focus();
		} else if (e.key === 'Tab') {
			// Close dropdown; let Tab move focus naturally.
			closeDesktop();
		}
	}

	function focusMenuItem(dropdownIndex: number, itemIndex: number) {
		const panel = document.getElementById(panelIds[dropdownIndex]);
		if (!panel) return;
		const menuItems = panel.querySelectorAll<HTMLElement>('[role="menuitem"]');
		menuItems[itemIndex]?.focus();
	}

	// ------------------------------------------------------------------
	// Keyboard: mobile focus trap
	// ------------------------------------------------------------------

	function onMobileKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			closeMobile();
			return;
		}
		if (e.key !== 'Tab') return;

		const mobileEl = document.getElementById(menuId);
		if (!mobileEl) return;

		const focusable = Array.from(
			mobileEl.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), details > summary'
			)
		).filter((el) => !el.closest('[tabindex="-1"]'));

		if (focusable.length === 0) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const active = document.activeElement as HTMLElement;

		if (e.shiftKey) {
			if (active === first || !mobileEl.contains(active)) {
				e.preventDefault();
				last.focus();
			}
		} else {
			if (active === last || !mobileEl.contains(active)) {
				e.preventDefault();
				first.focus();
			}
		}
	}

	// ------------------------------------------------------------------
	// Outside-click: close open desktop dropdown
	// ------------------------------------------------------------------

	function onDocumentClick(e: MouseEvent) {
		if (openIndex === null) return;
		const target = e.target as HTMLElement;
		if (!target.closest('.hz-nav')) {
			closeDesktop();
		}
	}

	// ------------------------------------------------------------------
	// Document-level Escape: close open desktop dropdown
	// ------------------------------------------------------------------

	function onDocumentKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && openIndex !== null) {
			const idx = openIndex;
			closeDesktop();
			triggerEls[idx]?.focus();
		}
	}

	$effect(() => {
		document.addEventListener('click', onDocumentClick);
		document.addEventListener('keydown', onDocumentKeydown);
		return () => {
			document.removeEventListener('click', onDocumentClick);
			document.removeEventListener('keydown', onDocumentKeydown);
		};
	});
</script>

<nav
	{...rest}
	class={cx('hz-nav', className)}
	aria-label={ariaLabel}
	data-variant={variant}
	data-orientation={orientation}
	data-sticky={sticky ? '' : undefined}
	data-mobile-breakpoint={mobileBreakpoint}
>
	<div class="hz-nav-inner">
		{#if logo}
			<div class="hz-nav-logo">{@render logo()}</div>
		{/if}

		<!-- Desktop link list -->
		<ul class="hz-nav-links" role="list">
			{#each items as item, i (i)}
				{#if item.href && item.children}
					<!-- R7: navigable link + separate chevron trigger -->
					<li class="hz-nav-dropdown" data-has-children>
						<Link
							href={item.href}
							variant="nav"
							external={item.external}
							ariaCurrent={item.ariaCurrent}
						>
							{item.label}
						</Link>
						<button
							bind:this={triggerEls[i]}
							class="hz-nav-chevron"
							aria-expanded={isOpen(i) ? 'true' : 'false'}
							aria-haspopup={isVertical ? undefined : 'true'}
							aria-controls={panelIds[i]}
							aria-label="{item.label} submenu"
							onclick={() => toggleDesktop(i)}
							onkeydown={isVertical ? undefined : (e) => onTriggerKeydown(e, i)}
						>
							{#if chevronIcon}{@render chevronIcon()}{:else}<IconChevronDown />{/if}
						</button>
						<!-- R9: dropdown panel. Horizontal is a role="menu" popover; vertical
						     is a plain disclosure list (sidebar sections aren't menus). -->
						<ul
							id={panelIds[i]}
							class="hz-nav-panel"
							role={isVertical ? undefined : 'menu'}
							data-state={isOpen(i) ? 'open' : 'closed'}
							onkeydown={isVertical ? undefined : (e) => onMenuKeydown(e, i)}
						>
							{#each item.children as child, j (j)}
								<li role={isVertical ? undefined : 'none'}>
									<Link
										href={child.href ?? '#'}
										variant="nav"
										external={child.external}
										ariaCurrent={child.ariaCurrent}
										role={isVertical ? undefined : 'menuitem'}
									>
										{child.label}
									</Link>
								</li>
							{/each}
						</ul>
					</li>
				{:else if item.children}
					<!-- R6: trigger-only (no href) -->
					<li class="hz-nav-dropdown" data-has-children>
						<button
							bind:this={triggerEls[i]}
							class="hz-nav-trigger"
							aria-expanded={isOpen(i) ? 'true' : 'false'}
							aria-haspopup={isVertical ? undefined : 'true'}
							aria-controls={panelIds[i]}
							onclick={() => toggleDesktop(i)}
							onkeydown={isVertical ? undefined : (e) => onTriggerKeydown(e, i)}
						>
							{item.label}
							{#if chevronIcon}{@render chevronIcon()}{:else}<IconChevronDown />{/if}
						</button>
						<!-- R9: dropdown panel (see above — menu vs disclosure) -->
						<ul
							id={panelIds[i]}
							class="hz-nav-panel"
							role={isVertical ? undefined : 'menu'}
							data-state={isOpen(i) ? 'open' : 'closed'}
							onkeydown={isVertical ? undefined : (e) => onMenuKeydown(e, i)}
						>
							{#each item.children as child, j (j)}
								<li role={isVertical ? undefined : 'none'}>
									<Link
										href={child.href ?? '#'}
										variant="nav"
										external={child.external}
										ariaCurrent={child.ariaCurrent}
										role={isVertical ? undefined : 'menuitem'}
									>
										{child.label}
									</Link>
								</li>
							{/each}
						</ul>
					</li>
				{:else if item.href}
					<!-- R5: link-only -->
					<li>
						<Link
							href={item.href}
							variant="nav"
							external={item.external}
							ariaCurrent={item.ariaCurrent}
						>
							{item.label}
						</Link>
					</li>
				{:else}
					<!-- Edge case: neither href nor children → plain text -->
					<li>{item.label}</li>
				{/if}
			{/each}
		</ul>

		<!-- Desktop actions slot -->
		{#if actions}
			<div class="hz-nav-actions">{@render actions()}</div>
		{/if}

		<!-- Mobile toggle -->
		<button
			bind:this={toggleEl}
			class="hz-nav-toggle"
			aria-expanded={mobileOpen ? 'true' : 'false'}
			aria-controls={menuId}
			aria-label="Toggle navigation menu"
			onclick={toggleMobile}
		>
			{#if menuIcon}{@render menuIcon()}{:else}<IconMenu />{/if}
		</button>
	</div>

	<!-- Mobile menu -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		id={menuId}
		class="hz-nav-mobile"
		data-state={mobileOpen ? 'open' : 'closed'}
		onkeydown={onMobileKeydown}
	>
		<ul role="list">
			{#each items as item, i (i)}
				{#if item.children}
					<!-- R14: native <details> disclosure -->
					<li>
						<details class="hz-nav-mobile-section">
							<summary>
								{item.label}
								{#if chevronIcon}{@render chevronIcon()}{:else}<IconChevronDown />{/if}
							</summary>
							<ul>
								{#each item.children as child, j (j)}
									<li>
										<Link
											href={child.href ?? '#'}
											variant="nav"
											external={child.external}
											ariaCurrent={child.ariaCurrent}
										>
											{child.label}
										</Link>
									</li>
								{/each}
							</ul>
						</details>
					</li>
				{:else if item.href}
					<li>
						<Link
							href={item.href}
							variant="nav"
							external={item.external}
							ariaCurrent={item.ariaCurrent}
						>
							{item.label}
						</Link>
					</li>
				{:else}
					<li>{item.label}</li>
				{/if}
			{/each}
		</ul>

		<!-- Actions also appear inside the mobile menu (R3) -->
		{#if actions}
			<div class="hz-nav-mobile-actions">{@render actions()}</div>
		{/if}
	</div>
</nav>

<style>
	/* ------------------------------------------------------------------ */
	/* Bar layout                                                           */
	/* ------------------------------------------------------------------ */

	/*
	 * The nav is its own size container: the responsive collapse rules below
	 * are container queries against the nav's width (its descendants query
	 * it), consistent with Grid/Split. Breakpoint thresholds mirror the
	 * width tokens but stay literal — CSS cannot read custom properties in
	 * container queries.
	 */
	.hz-nav {
		position: relative;
		container-type: inline-size;
	}

	.hz-nav[data-sticky] {
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.hz-nav-inner {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--hz-space-md, 2rem);
	}

	.hz-nav-logo {
		flex-shrink: 0;
	}

	.hz-nav-links {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--hz-space-sm, 1rem);
		list-style: none;
		margin: 0;
		padding: 0;
		flex: 1;
	}

	.hz-nav-actions {
		flex-shrink: 0;
	}

	/* ------------------------------------------------------------------ */
	/* Desktop dropdown (R9, R18)                                          */
	/* ------------------------------------------------------------------ */

	/* Flex-centers the link + chevron pair so dropdown items align with the
	 * plain link items on the bar's center line (a block li would baseline-
	 * align its inline children instead). */
	.hz-nav-dropdown {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.125rem;
	}

	.hz-nav-dropdown .hz-nav-panel {
		position: absolute;
		top: 100%;
		left: 0;
		z-index: 200;
		list-style: none;
		margin: 0;
		padding: var(--hz-space-xs, 0.5rem) 0;
		min-width: max-content;
	}

	/* closed → hidden; open → visible */
	.hz-nav-dropdown .hz-nav-panel[data-state='closed'] {
		display: none;
	}

	.hz-nav-dropdown .hz-nav-panel[data-state='open'] {
		display: block;
	}

	/* ------------------------------------------------------------------ */
	/* Mobile menu (R13, R18)                                              */
	/* ------------------------------------------------------------------ */

	.hz-nav-mobile {
		width: 100%;
	}

	.hz-nav-mobile[data-state='closed'] {
		display: none;
	}

	.hz-nav-mobile[data-state='open'] {
		display: block;
	}

	.hz-nav-mobile ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--hz-space-xs, 0.5rem);
	}

	.hz-nav-mobile-section {
		width: 100%;
	}

	.hz-nav-mobile-section summary {
		display: flex;
		align-items: center;
		gap: var(--hz-space-xs, 0.5rem);
		cursor: pointer;
		list-style: none;
	}

	.hz-nav-mobile-section summary::-webkit-details-marker {
		display: none;
	}

	.hz-nav-mobile-actions {
		margin-top: var(--hz-space-sm, 1rem);
	}

	/* ------------------------------------------------------------------ */
	/* R17: Responsive collapse                                            */
	/*                                                                     */
	/* Collapsed (hamburger) below the breakpoint for BOTH orientations.   */
	/* What un-collapses differs:                                          */
	/*  - horizontal bars measure their OWN width (container query — a bar */
	/*    in a narrow slot should collapse regardless of the window)       */
	/*  - vertical sidebars measure the VIEWPORT (the sidebar itself is    */
	/*    always narrow; whether the page has room is a window question)   */
	/* Thresholds mirror --hz-width-sm/md/lg but stay literal — CSS cannot */
	/* read custom properties in media or container queries.               */
	/* ------------------------------------------------------------------ */

	.hz-nav[data-mobile-breakpoint='sm'] .hz-nav-links,
	.hz-nav[data-mobile-breakpoint='md'] .hz-nav-links,
	.hz-nav[data-mobile-breakpoint='lg'] .hz-nav-links {
		display: none;
	}

	.hz-nav[data-mobile-breakpoint='sm'] .hz-nav-toggle,
	.hz-nav[data-mobile-breakpoint='md'] .hz-nav-toggle,
	.hz-nav[data-mobile-breakpoint='lg'] .hz-nav-toggle {
		display: flex;
	}

	/* sm — 640px */
	@container (min-width: 640px) {
		.hz-nav[data-orientation='horizontal'][data-mobile-breakpoint='sm'] .hz-nav-links {
			display: flex;
		}
		.hz-nav[data-orientation='horizontal'][data-mobile-breakpoint='sm'] .hz-nav-toggle {
			display: none;
		}
		.hz-nav[data-orientation='horizontal'][data-mobile-breakpoint='sm'] .hz-nav-mobile {
			display: none !important;
		}
	}

	@media (min-width: 640px) {
		.hz-nav[data-orientation='vertical'][data-mobile-breakpoint='sm'] .hz-nav-links {
			display: flex;
		}
		.hz-nav[data-orientation='vertical'][data-mobile-breakpoint='sm'] .hz-nav-toggle {
			display: none;
		}
		.hz-nav[data-orientation='vertical'][data-mobile-breakpoint='sm'] .hz-nav-mobile {
			display: none !important;
		}
	}

	/* md — 968px */
	@container (min-width: 968px) {
		.hz-nav[data-orientation='horizontal'][data-mobile-breakpoint='md'] .hz-nav-links {
			display: flex;
		}
		.hz-nav[data-orientation='horizontal'][data-mobile-breakpoint='md'] .hz-nav-toggle {
			display: none;
		}
		.hz-nav[data-orientation='horizontal'][data-mobile-breakpoint='md'] .hz-nav-mobile {
			display: none !important;
		}
	}

	@media (min-width: 968px) {
		.hz-nav[data-orientation='vertical'][data-mobile-breakpoint='md'] .hz-nav-links {
			display: flex;
		}
		.hz-nav[data-orientation='vertical'][data-mobile-breakpoint='md'] .hz-nav-toggle {
			display: none;
		}
		.hz-nav[data-orientation='vertical'][data-mobile-breakpoint='md'] .hz-nav-mobile {
			display: none !important;
		}
	}

	/* lg — 1200px */
	@container (min-width: 1200px) {
		.hz-nav[data-orientation='horizontal'][data-mobile-breakpoint='lg'] .hz-nav-links {
			display: flex;
		}
		.hz-nav[data-orientation='horizontal'][data-mobile-breakpoint='lg'] .hz-nav-toggle {
			display: none;
		}
		.hz-nav[data-orientation='horizontal'][data-mobile-breakpoint='lg'] .hz-nav-mobile {
			display: none !important;
		}
	}

	@media (min-width: 1200px) {
		.hz-nav[data-orientation='vertical'][data-mobile-breakpoint='lg'] .hz-nav-links {
			display: flex;
		}
		.hz-nav[data-orientation='vertical'][data-mobile-breakpoint='lg'] .hz-nav-toggle {
			display: none;
		}
		.hz-nav[data-orientation='vertical'][data-mobile-breakpoint='lg'] .hz-nav-mobile {
			display: none !important;
		}
	}

	/* ------------------------------------------------------------------ */
	/* Vertical (sidebar) orientation — column layout with inline,          */
	/* collapsible, multi-open sections. Collapse behavior above applies.   */
	/* ------------------------------------------------------------------ */

	.hz-nav[data-orientation='vertical'] .hz-nav-inner {
		flex-direction: column;
		align-items: stretch;
	}

	.hz-nav[data-orientation='vertical'] .hz-nav-links {
		flex-direction: column;
		align-items: stretch;
	}

	/* Section rows wrap so the inline panel drops below at full width. */
	.hz-nav[data-orientation='vertical'] .hz-nav-dropdown {
		flex-wrap: wrap;
	}

	.hz-nav[data-orientation='vertical'] .hz-nav-dropdown > :global(.hz-link) {
		flex: 1;
	}

	.hz-nav[data-orientation='vertical'] .hz-nav-trigger {
		flex: 1;
		justify-content: space-between;
	}

	/* Submenus are inline sections, not floating popovers. */
	.hz-nav[data-orientation='vertical'] .hz-nav-panel {
		position: static;
		flex-basis: 100%;
		min-width: 0;
	}
</style>
