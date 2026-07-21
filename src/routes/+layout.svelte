<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Nav } from '$lib';
	import type { NavChild } from '$lib/types';
	import { isGrouped, isSection, manifest, sectionPages } from '../docs/manifest';
	import CommandPalette, { type CommandItem } from '../docs/CommandPalette.svelte';
	import '$lib/theme/reset.css';
	import '$lib/tokens/tokens.css';
	// Reference theme — the docs site is its living example. Demos render the
	// styled starting point; the docs chrome below stays hand-rolled CSS on the
	// same role tokens.
	import '$lib/theme/theme.css';
	// Shared demo-page scaffolding classes (.tab-content, .tab-note, …).
	import '../docs/docs.css';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// R9 — theme toggle state (false = light, true = dark)
	// eslint-disable-next-line svelte/prefer-writable-derived
	let dark = $state(false);

	// Mobile nav open state
	let mobileNavOpen = $state(false);

	function activeSectionLabel(): string | undefined {
		return manifest.find(
			(entry) => isSection(entry) && sectionPages(entry).some((p) => page.url.pathname === p.href)
		)?.label;
	}

	// A section's pages as Nav children. Grouped sections (Components) emit each
	// band as a nested collapsible sub-section (spec 34) — the group opens when
	// it holds the active page, so navigating deep-links straight to it.
	function navChildren(section: (typeof manifest)[number] & object): NavChild[] {
		if (!isSection(section)) return [];
		const link = (p: { label: string; href: string }) => ({
			...p,
			ariaCurrent: isActive(p.href) ? ('page' as const) : undefined
		});
		return isGrouped(section)
			? section.groups.map((g) => ({
					label: g.label,
					defaultOpen: g.pages.some((p) => isActive(p.href)),
					children: g.pages.map(link)
				}))
			: section.children.map(link);
	}

	// Dogfood: the sidebar is the library's vertical Nav. Sections are
	// label-only toggles (no cover pages); standalone entries (Introduction)
	// are plain links. Rebuilding items on navigation re-marks aria-current
	// and (via defaultOpen) auto-expands the active section; Nav keeps
	// user-opened sections open.
	const sidebarNavItems = $derived(
		manifest.map((entry) =>
			isSection(entry)
				? {
						label: entry.label,
						defaultOpen: entry.label === activeSectionLabel(),
						children: navChildren(entry)
					}
				: {
						...entry,
						ariaCurrent: isActive(entry.href) ? ('page' as const) : undefined
					}
		)
	);

	// Search index for the command palette — every routable page with its
	// section/group breadcrumb, straight from the manifest so it can't drift.
	const searchItems: CommandItem[] = manifest.flatMap((entry) => {
		if (!isSection(entry)) return [{ label: entry.label, href: entry.href, context: '' }];
		if (isGrouped(entry))
			return entry.groups.flatMap((g) =>
				g.pages.map((p) => ({
					label: p.label,
					href: p.href,
					context: `${entry.label} · ${g.label}`
				}))
			);
		return entry.children.map((p) => ({ label: p.label, href: p.href, context: entry.label }));
	});

	function onSearchSelect(href: string) {
		// hrefs come from the manifest — already app-absolute, valid routes; the
		// docs site has no base path, so a raw goto is correct here.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(href);
		closeMobileNav();
	}

	// R9 — initialize from localStorage and sync to DOM
	$effect(() => {
		dark = localStorage.getItem('hz-theme') === 'dark';
	});

	$effect(() => {
		if (dark) {
			document.documentElement.setAttribute('data-theme', 'dark');
			localStorage.setItem('hz-theme', 'dark');
		} else {
			document.documentElement.removeAttribute('data-theme');
			localStorage.removeItem('hz-theme');
		}
	});

	function toggleTheme() {
		dark = !dark;
	}

	function toggleMobileNav() {
		mobileNavOpen = !mobileNavOpen;
	}

	function closeMobileNav() {
		mobileNavOpen = false;
	}

	function isActive(href: string): boolean {
		return page.url.pathname === href;
	}
</script>

<!-- R2 — skip-to-content stays the first focusable element -->
<a class="skip-to-content" href="#main-content">Skip to content</a>

<div class="docs-shell">
	<!-- Mobile top bar — only visible below sidebar breakpoint -->
	<header class="docs-topbar">
		<a href="/" class="docs-logo">@hyzer-labs/ui</a>
		<div class="docs-topbar-end">
			<button
				type="button"
				class="docs-icon-btn"
				aria-pressed={dark ? 'true' : 'false'}
				aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
				onclick={toggleTheme}
			>
				{#if dark}<span aria-hidden="true">☀︎</span>{:else}<span aria-hidden="true">☾</span>{/if}
			</button>
			<button
				type="button"
				class="docs-icon-btn"
				aria-expanded={mobileNavOpen ? 'true' : 'false'}
				aria-controls="docs-sidebar"
				aria-label="Toggle navigation menu"
				onclick={toggleMobileNav}
			>
				<span aria-hidden="true">{mobileNavOpen ? '✕' : '☰'}</span>
			</button>
		</div>
	</header>

	<!-- Mobile nav backdrop -->
	{#if mobileNavOpen}
		<div class="docs-backdrop" onclick={closeMobileNav} aria-hidden="true"></div>
	{/if}

	<div class="docs-body">
		<!-- Left sidebar -->
		<aside
			id="docs-sidebar"
			class="docs-sidebar"
			data-open={mobileNavOpen ? '' : undefined}
			aria-label="Docs navigation"
		>
			<!-- Sidebar header: logo + theme toggle row, then the search box -->
			<div class="docs-sidebar-header">
				<div class="docs-sidebar-headrow">
					<a href="/" class="docs-logo" onclick={closeMobileNav}>@hyzer-labs/ui</a>
					<button
						type="button"
						class="docs-icon-btn"
						aria-pressed={dark ? 'true' : 'false'}
						aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
						onclick={toggleTheme}
					>
						{#if dark}<span aria-hidden="true">☀︎</span>{:else}<span aria-hidden="true">☾</span>{/if}
					</button>
				</div>
				<CommandPalette items={searchItems} onSelect={onSearchSelect} mode="modal" />
			</div>

			<!-- Nav tree — the library's vertical Nav, dogfooded as the docs
			     sidebar. mobileBreakpoint="none": this shell owns the mobile
			     drawer, so the Nav itself must never grow a second hamburger.
			     The click listener closes the mobile drawer on any link click
			     (chevron toggles are buttons, so they don't match). -->
			<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
			<div
				class="docs-sidenav-wrap"
				onclick={(e) => {
					if ((e.target as HTMLElement).closest('a')) closeMobileNav();
				}}
			>
				<Nav
					items={sidebarNavItems}
					orientation="vertical"
					mobileBreakpoint="none"
					variant="transparent"
					ariaLabel="Docs navigation"
					class="docs-side-nav"
				/>
			</div>
		</aside>

		<!-- Main content. The main element is a size container so Container
		     breakout (100cqw) spans the full content area; the inner div caps
		     the prose column, start-aligned — --hz-breakout-shift: 0 tells
		     breakouts to grow rightward only. -->
		<main id="main-content" class="docs-main" tabindex="-1">
			<div class="docs-main-inner">
				{@render children()}
			</div>
		</main>
	</div>

	<!-- Simple footer — no nav link columns -->
	<footer class="docs-footer">
		<p class="docs-footer-copy">
			&copy; {new Date().getFullYear()} Hyzer Labs &mdash; MIT License
		</p>
	</footer>
</div>

<style>
	/* ------------------------------------------------------------------ */
	/* Skip to content                                                       */
	/* ------------------------------------------------------------------ */

	.skip-to-content {
		position: absolute;
		top: -100%;
		left: 0;
		z-index: 9999;
		padding: 0.5rem 1rem;
		background: var(--hz-color-text, #000);
		color: var(--hz-color-surface, #fff);
		text-decoration: none;
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.skip-to-content:focus-visible {
		top: 0;
	}

	/* ------------------------------------------------------------------ */
	/* Shell                                                                */
	/* ------------------------------------------------------------------ */

	.docs-shell {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		background-color: var(--hz-color-surface, #fff);
		color: var(--hz-color-text, #000);
		font-family: var(--hz-font-family-sans, system-ui, sans-serif);
		line-height: var(--hz-line-height-base, 1.5);
	}

	/* Sidebar is position: fixed (never scrolls off screen); the body just
	 * reserves its column with a margin on desktop. */
	.docs-body {
		flex: 1;
		min-height: 0;
	}

	/* ------------------------------------------------------------------ */
	/* Mobile top bar                                                        */
	/* ------------------------------------------------------------------ */

	.docs-topbar {
		display: none; /* hidden on desktop */
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
		position: sticky;
		top: 0;
		z-index: 200;
		background: var(--hz-color-surface, #fff);
	}

	.docs-topbar-end {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	/* ------------------------------------------------------------------ */
	/* Mobile backdrop                                                       */
	/* ------------------------------------------------------------------ */

	.docs-backdrop {
		position: fixed;
		inset: 0;
		z-index: 299;
		background: rgb(0 0 0 / 0.4);
	}

	/* ------------------------------------------------------------------ */
	/* Left sidebar                                                          */
	/* ------------------------------------------------------------------ */

	/* The sidebar is a fixed column that does NOT scroll itself — the header
	 * (logo/toggle/search) stays put and the nav region below scrolls. That
	 * keeps the scrollbar gutter out of the header (it belongs only to the
	 * scrolling list). */
	.docs-sidebar {
		width: 15rem;
		border-right: 1px solid var(--hz-color-border, #6b7280);
		display: flex;
		flex-direction: column;
		position: fixed;
		top: 0;
		left: 0;
		z-index: 100;
		height: 100dvh;
		overflow: hidden;
		background: var(--hz-color-surface, #fff);
	}

	.docs-sidebar-header {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.25rem 1rem 1rem;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
	}

	.docs-sidebar-headrow {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	/* The one scrolling region — so the gutter (reserved to stop reflow when a
	 * group expands, spec 34) and the mode-aware scrollbar colours apply here,
	 * not to the header above. */
	.docs-sidenav-wrap {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		scrollbar-gutter: stable;
		/* Transparent track inherits the surface (no jarring light strip in dark
		 * mode); a subtle text-tinted thumb adapts to either mode. */
		scrollbar-color: color-mix(in srgb, var(--hz-color-text, #000) 22%, transparent) transparent;
		padding: 0.75rem 0 1.25rem;
	}

	/* ------------------------------------------------------------------ */
	/* Logo                                                                  */
	/* ------------------------------------------------------------------ */

	.docs-logo {
		font-weight: var(--hz-font-weight-bold, 700);
		font-size: var(--hz-font-size-sm, 0.875rem);
		text-decoration: none;
		color: inherit;
		white-space: nowrap;
	}

	.docs-logo:hover {
		text-decoration: underline;
	}

	/* ------------------------------------------------------------------ */
	/* Icon button (theme toggle, hamburger)                                 */
	/* ------------------------------------------------------------------ */

	.docs-icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		background: transparent;
		color: inherit;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.docs-icon-btn:hover {
		background-color: color-mix(in srgb, var(--hz-color-text, #000) 8%, transparent);
	}

	/* ------------------------------------------------------------------ */
	/* Sidebar nav — dogfooded vertical <Nav>, skinned as docs chrome.      */
	/* Unlayered rules beat the hz-theme layer without specificity games.   */
	/* ------------------------------------------------------------------ */

	.docs-sidenav-wrap :global(.hz-nav-inner) {
		padding: 0;
	}

	.docs-sidenav-wrap :global(.hz-nav-links) {
		gap: 0.25rem;
	}

	/* Top-level rows — section toggles (.hz-nav-trigger buttons, since
	 * sections are label-only) AND standalone links like Introduction get
	 * the same uppercase chrome treatment so the column reads as one list.
	 * Scoped to the top level so nested group toggles (spec 34) don't inherit
	 * the full-size treatment. */
	.docs-sidenav-wrap :global(.hz-nav-links > li > .hz-link),
	.docs-sidenav-wrap :global(.hz-nav-links > li > .hz-nav-trigger) {
		flex: 1;
		padding: 0.375rem 0.5rem 0.375rem 1rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		color: var(--hz-color-text-muted, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		border-radius: 0;
	}

	.docs-sidenav-wrap :global(.hz-nav-links > li > .hz-link) {
		display: block;
	}

	.docs-sidenav-wrap :global(.hz-nav-links > li > .hz-link:hover),
	.docs-sidenav-wrap :global(.hz-nav-links > li > .hz-nav-trigger:hover) {
		color: var(--hz-color-text, #000);
	}

	.docs-sidenav-wrap :global(.hz-nav-links > li > .hz-link[aria-current='page']) {
		color: var(--hz-color-primary, #2563eb);
	}

	.docs-sidenav-wrap :global(.hz-nav-chevron) {
		margin-right: 0.25rem;
		color: var(--hz-color-text-muted, #6b7280);
	}

	/* Inline section panel — no theme indent padding; links carry it */
	.docs-sidenav-wrap :global(.hz-nav-panel) {
		padding: 0;
	}

	/* Group toggles inside Components (spec 34) — collapsible now, styled like
	 * the quiet labels they replaced: smaller, uppercase, muted, with a chevron
	 * pushed to the right that rotates when the group is open. */
	.docs-sidenav-wrap :global(.hz-nav-panel .hz-nav-trigger) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.5rem 1rem 0.5rem 1.75rem;
		font-size: var(--hz-font-size-xs, 0.75rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		color: var(--hz-color-text-muted, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		border-radius: 0;
	}

	.docs-sidenav-wrap :global(.hz-nav-panel .hz-nav-trigger:hover) {
		color: var(--hz-color-text, #000);
	}

	.docs-sidenav-wrap :global(.hz-nav-panel .hz-nav-trigger .hz-icon) {
		width: 0.75rem;
		height: 0.75rem;
		flex-shrink: 0;
		transition: transform var(--hz-duration-fast, 150ms) var(--hz-ease-standard, ease);
	}

	.docs-sidenav-wrap :global(.hz-nav-panel .hz-nav-trigger[aria-expanded='true'] .hz-icon) {
		transform: rotate(180deg);
	}

	/* Static group labels (spec 31 R2) — kept for consumers still using the
	 * heading subtype; the docs Components groups are collapsible triggers now. */
	.docs-sidenav-wrap :global(.hz-nav-panel .hz-nav-heading) {
		padding: 0.75rem 1rem 0.25rem 1.75rem;
		font-size: var(--hz-font-size-xs, 0.75rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		color: var(--hz-color-text-muted, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	/* Page links — active gets a LEFT accent bar (inset box-shadow, so it costs
	 * no layout and hugs the reading edge rather than the scrollbar-gutter edge
	 * on the right). One level deep (Foundation/Theming/Pages) sit at 1.75rem;
	 * two levels deep (a Components group's pages) indent further. */
	.docs-sidenav-wrap :global(.hz-nav-panel .hz-link) {
		display: block;
		padding: 0.3125rem 1rem 0.3125rem 1.75rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
		border-radius: 0;
	}

	.docs-sidenav-wrap :global(.hz-nav-panel .hz-nav-panel .hz-link) {
		padding-left: 2.5rem;
	}

	.docs-sidenav-wrap :global(.hz-nav-panel .hz-link:hover) {
		color: var(--hz-color-text, #000);
		background-color: color-mix(in srgb, var(--hz-color-text, #000) 5%, transparent);
	}

	.docs-sidenav-wrap :global(.hz-nav-panel .hz-link[aria-current='page']) {
		color: var(--hz-color-primary, #2563eb);
		box-shadow: inset 2px 0 0 var(--hz-color-primary, #2563eb);
		background-color: color-mix(in srgb, var(--hz-color-primary, #2563eb) 8%, transparent);
		font-weight: var(--hz-font-weight-medium, 500);
	}

	/* ------------------------------------------------------------------ */
	/* Main content                                                          */
	/* ------------------------------------------------------------------ */

	.docs-main {
		margin-left: 15rem; /* room for the fixed sidebar */
		min-width: 0;
		/* 2rem inline padding keeps breakout ≥ 976px on a 1280px window —
		 * past the 968px md threshold the split-hero demos need. */
		padding: 2rem;
		container-type: inline-size;
		/* Prose column is start-aligned — breakouts grow rightward only. */
		--hz-breakout-shift: 0;
	}

	.docs-main-inner {
		max-width: 56rem;
	}

	/* ------------------------------------------------------------------ */
	/* Footer                                                                */
	/* ------------------------------------------------------------------ */

	.docs-footer {
		border-top: 1px solid var(--hz-color-border, #6b7280);
		padding: 1rem 2rem;
		margin-left: 15rem; /* align with main content area */
	}

	.docs-footer-copy {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	/* ------------------------------------------------------------------ */
	/* Mobile layout (<768px) — sidebar collapses                           */
	/* ------------------------------------------------------------------ */

	@media (max-width: 767px) {
		.docs-topbar {
			display: flex;
		}

		.docs-footer {
			margin-left: 0;
		}

		.docs-sidebar {
			z-index: 300;
			transform: translateX(-100%);
			transition: transform 0.2s ease;
		}

		.docs-sidebar[data-open] {
			transform: translateX(0);
		}

		.docs-main {
			margin-left: 0;
			padding: 1.5rem 1rem;
		}
	}

	/* ------------------------------------------------------------------ */
	/* Global guards                                                         */
	/* ------------------------------------------------------------------ */

	:global(*),
	:global(*::before),
	:global(*::after) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		overflow-x: hidden;
	}

	:global(pre) {
		max-width: 100%;
		overflow-x: auto;
	}

	:global(img),
	:global(video),
	:global(table) {
		max-width: 100%;
	}

	/* Field controls and shared icon-buttons get the theme's soft focus ring
	 * instead — this unlayered chrome rule would otherwise beat it and draw
	 * an offset box across their borders. */
	:global(
		*:focus-visible:not(:is(.hz-field input, .hz-field select, .hz-field textarea, .hz-button))
	) {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}

	/* Docs chrome (not a base-level style): inline code in running text gets a
	   subtle chip treatment. Scoped to paragraph/list context so pre blocks and
	   props-table cells stay plain. */
	:global(p code),
	:global(li code) {
		background-color: color-mix(in srgb, var(--hz-color-gray, #6b7280) 14%, transparent);
		padding: 0.125em 0.375em;
		border-radius: var(--hz-radius-sm, 0.25rem);
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	/* Utility: visually-hidden text for screen readers */
	:global(.sr-only) {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(*) {
			transition-duration: 0.01ms !important;
			animation-duration: 0.01ms !important;
		}
	}
</style>
