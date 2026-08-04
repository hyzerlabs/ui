<script lang="ts">
	import type { Snippet } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { DEV } from 'esm-env';
	import type { NavItem, NavChild } from '$lib/types';
	import { cx, uid, isNavHeading } from '$lib/utils';
	import Link from './Link.svelte';
	import IconChevronDown from '$lib/icons/generated/chevron-down.svelte';

	type NavOrientation = 'horizontal' | 'vertical';

	interface Props {
		items: NavItem[];
		/**
		 * Vertical renders a sidebar-style column: submenus become collapsible
		 * inline disclosure sections (multiple may be open at once, nested —
		 * spec 34). Horizontal renders a row of links with dropdown menus.
		 */
		orientation?: NavOrientation;
		ariaLabel?: string;
		chevronIcon?: Snippet;
		/**
		 * Extra class on every rendered item link (and label trigger) —
		 * combines with each item's own `class`. The hook for attaching a
		 * site's existing link styling to the whole nav at once.
		 */
		itemClass?: string;
		class?: string;
		[key: string]: unknown;
	}

	let {
		items: rawItems,
		orientation = 'horizontal',
		ariaLabel = 'Main navigation',
		chevronIcon,
		itemClass,
		class: className,
		...rest
	}: Props = $props();

	const isVertical = $derived(orientation === 'vertical');

	// spec 31 R2: headings are children-only. The `items` type already rules
	// this out, but JS consumers can still pass one — drop it rather than
	// render an empty <li> from a missing `label`.
	const items = $derived(rawItems.filter((item) => !isNavHeading(item)) as NavItem[]);

	$effect(() => {
		if (!DEV) return;
		if (rawItems.some((item) => isNavHeading(item))) {
			console.warn(
				'[hz-nav] A heading entry appeared in the top-level `items` array and was ' +
					'ignored. Group labels are only supported inside a `children` array.'
			);
		}
	});

	// Stable IDs: WeakMap keyed on each NavItem object so IDs survive
	// reactive re-derivations without changing value for the same item.
	const _idCache = new WeakMap<NavItem, string>();
	function getPanelId(item: NavItem): string {
		if (!_idCache.has(item)) _idCache.set(item, uid('hz-nav-panel'));
		return _idCache.get(item)!;
	}

	// Derived so the array stays in sync if `items` ever changes.
	const panelIds = $derived(items.map(getPanelId));

	// Horizontal dropdowns are single-open (opening one closes the others).
	let openIndex = $state<number | null>(null);

	// Vertical sidebars are multi-open and can nest (spec 34). Open nodes are
	// tracked by a stable PATH string (top-level index, then child indices —
	// "3", "3.1"), not object identity: a shell that rebuilds `items` on
	// navigation keeps its open state, which identity would not survive.
	const openPaths = new SvelteSet<string>();

	// Nodes flagged defaultOpen start open — at any depth — and re-open whenever
	// `items` is rebuilt. Additive only: it never closes what the user opened.
	$effect(() => {
		if (!isVertical) return;
		const walk = (nodes: NavChild[], prefix: string) => {
			nodes.forEach((node, j) => {
				if (isNavHeading(node)) return;
				const path = prefix ? `${prefix}.${j}` : `${j}`;
				if (node.defaultOpen && node.children) openPaths.add(path);
				if (node.children) walk(node.children, path);
			});
		};
		walk(items, '');
	});

	function isOpenPath(path: string): boolean {
		return openPaths.has(path);
	}

	function togglePath(path: string) {
		if (openPaths.has(path)) openPaths.delete(path);
		else openPaths.add(path);
	}

	// Horizontal single-open. Vertical uses isOpenPath/togglePath above.
	function isOpen(index: number): boolean {
		return openIndex === index;
	}

	// Trigger button elements — for Escape-returns-focus on horizontal menus.
	let triggerEls = $state<(HTMLButtonElement | null)[]>([]);

	function toggleDesktop(index: number) {
		openIndex = openIndex === index ? null : index;
	}

	function closeDesktop() {
		openIndex = null;
	}

	// ------------------------------------------------------------------
	// Keyboard: horizontal dropdown triggers
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

	// Outside-click / document Escape close the open horizontal dropdown.
	function onDocumentClick(e: MouseEvent) {
		if (openIndex === null) return;
		const target = e.target as HTMLElement;
		if (!target.closest('.hz-nav')) closeDesktop();
	}

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
	data-orientation={orientation}
>
	<!-- spec 34: vertical sidebars nest — a child with children is a collapsible
	     sub-section. Recursive snippet; horizontal keeps one-tier menus below. -->
	{#snippet verticalNode(item: NavItem, path: string, depth: number)}
		<li class="hz-nav-dropdown" data-has-children data-depth={depth}>
			{#if item.href}
				<Link
					href={item.href}
					variant="nav"
					class={cx(itemClass, item.class)}
					external={item.external}
					ariaCurrent={item.ariaCurrent}
				>
					{item.label}
				</Link>
				<button
					class="hz-nav-chevron"
					aria-expanded={isOpenPath(path) ? 'true' : 'false'}
					aria-controls={getPanelId(item)}
					aria-label="{item.label} submenu"
					onclick={() => togglePath(path)}
				>
					{#if chevronIcon}{@render chevronIcon()}{:else}<IconChevronDown />{/if}
				</button>
			{:else}
				<button
					class={cx('hz-nav-trigger', itemClass, item.class)}
					aria-expanded={isOpenPath(path) ? 'true' : 'false'}
					aria-controls={getPanelId(item)}
					onclick={() => togglePath(path)}
				>
					{item.label}
					{#if chevronIcon}{@render chevronIcon()}{:else}<IconChevronDown />{/if}
				</button>
			{/if}
			<ul
				id={getPanelId(item)}
				class="hz-nav-panel"
				data-state={isOpenPath(path) ? 'open' : 'closed'}
			>
				{#each item.children ?? [] as child, j (j)}
					{#if isNavHeading(child)}
						<li class="hz-nav-heading">{child.heading}</li>
					{:else if child.children}
						{@render verticalNode(child, `${path}.${j}`, depth + 1)}
					{:else}
						<li>
							<Link
								href={child.href ?? '#'}
								variant="nav"
								class={cx(itemClass, child.class)}
								external={child.external}
								ariaCurrent={child.ariaCurrent}
							>
								{child.label}
							</Link>
						</li>
					{/if}
				{/each}
			</ul>
		</li>
	{/snippet}

	{#if isVertical}
		<!-- Vertical link list — nested disclosure (spec 34) -->
		<ul class="hz-nav-links" role="list">
			{#each items as item, i (i)}
				{#if item.children}
					{@render verticalNode(item, `${i}`, 0)}
				{:else if item.href}
					<li>
						<Link
							href={item.href}
							variant="nav"
							class={cx(itemClass, item.class)}
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
	{:else}
		<!-- Horizontal link list — one-tier dropdown menus -->
		<ul class="hz-nav-links" role="list">
			{#each items as item, i (i)}
				{#if item.href && item.children}
					<!-- navigable link + separate chevron trigger -->
					<li class="hz-nav-dropdown" data-has-children>
						<Link
							href={item.href}
							variant="nav"
							class={cx(itemClass, item.class)}
							external={item.external}
							ariaCurrent={item.ariaCurrent}
						>
							{item.label}
						</Link>
						<button
							bind:this={triggerEls[i]}
							class="hz-nav-chevron"
							aria-expanded={isOpen(i) ? 'true' : 'false'}
							aria-haspopup="true"
							aria-controls={panelIds[i]}
							aria-label="{item.label} submenu"
							onclick={() => toggleDesktop(i)}
							onkeydown={(e) => onTriggerKeydown(e, i)}
						>
							{#if chevronIcon}{@render chevronIcon()}{:else}<IconChevronDown />{/if}
						</button>
						<ul
							id={panelIds[i]}
							class="hz-nav-panel"
							role="menu"
							data-state={isOpen(i) ? 'open' : 'closed'}
							onkeydown={(e) => onMenuKeydown(e, i)}
						>
							{#each item.children as child, j (j)}
								{#if isNavHeading(child)}
									<li class="hz-nav-heading" role="presentation">{child.heading}</li>
								{:else if child.children && !child.href}
									<!-- spec 34 R2: horizontal menus don't nest — an href-less group
									     degrades to a static label; a child WITH an href stays a link. -->
									<li class="hz-nav-heading" role="presentation">{child.label}</li>
								{:else}
									<li role="none">
										<Link
											href={child.href ?? '#'}
											variant="nav"
											class={cx(itemClass, child.class)}
											external={child.external}
											ariaCurrent={child.ariaCurrent}
											role="menuitem"
										>
											{child.label}
										</Link>
									</li>
								{/if}
							{/each}
						</ul>
					</li>
				{:else if item.children}
					<!-- trigger-only (no href) -->
					<li class="hz-nav-dropdown" data-has-children>
						<button
							bind:this={triggerEls[i]}
							class={cx('hz-nav-trigger', itemClass, item.class)}
							aria-expanded={isOpen(i) ? 'true' : 'false'}
							aria-haspopup="true"
							aria-controls={panelIds[i]}
							onclick={() => toggleDesktop(i)}
							onkeydown={(e) => onTriggerKeydown(e, i)}
						>
							{item.label}
							{#if chevronIcon}{@render chevronIcon()}{:else}<IconChevronDown />{/if}
						</button>
						<ul
							id={panelIds[i]}
							class="hz-nav-panel"
							role="menu"
							data-state={isOpen(i) ? 'open' : 'closed'}
							onkeydown={(e) => onMenuKeydown(e, i)}
						>
							{#each item.children as child, j (j)}
								{#if isNavHeading(child)}
									<li class="hz-nav-heading" role="presentation">{child.heading}</li>
								{:else if child.children && !child.href}
									<li class="hz-nav-heading" role="presentation">{child.label}</li>
								{:else}
									<li role="none">
										<Link
											href={child.href ?? '#'}
											variant="nav"
											class={cx(itemClass, child.class)}
											external={child.external}
											ariaCurrent={child.ariaCurrent}
											role="menuitem"
										>
											{child.label}
										</Link>
									</li>
								{/if}
							{/each}
						</ul>
					</li>
				{:else if item.href}
					<!-- link-only -->
					<li>
						<Link
							href={item.href}
							variant="nav"
							class={cx(itemClass, item.class)}
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
	{/if}
</nav>

<style>
	.hz-nav-links {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: var(--hz-space-sm, 1rem);
		list-style: none;
		margin: 0;
		padding: 0;
	}

	/* ------------------------------------------------------------------ */
	/* Horizontal dropdown                                                  */
	/* ------------------------------------------------------------------ */

	/* Flex-centers the link + chevron pair so dropdown items align with the
	 * plain link items on the center line. */
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
		/* a floating menu that must clear sticky chrome (a pinned
		 * Header/Banner) — one tier above --hz-z-sticky, distinct from the
		 * in-flow --hz-z-dropdown Combobox/Dropdown popups use. */
		z-index: var(--hz-z-popover, 200);
		list-style: none;
		margin: 0;
		padding: var(--hz-space-xs, 0.5rem) 0;
		min-width: max-content;
	}

	.hz-nav-dropdown .hz-nav-panel[data-state='closed'] {
		display: none;
	}

	.hz-nav-dropdown .hz-nav-panel[data-state='open'] {
		display: block;
	}

	/* ------------------------------------------------------------------ */
	/* Vertical (sidebar) orientation — column with inline, nested,         */
	/* multi-open disclosure sections (spec 34).                            */
	/* ------------------------------------------------------------------ */

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
