<script lang="ts">
	import type { Snippet } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { page } from '$app/state';
	import { manifest } from '../docs/manifest';
	import { IconChevronDown } from '$lib/icons';
	import '$lib/theme/reset.css';
	import '$lib/tokens/tokens.css';
	// Reference theme — the docs site is its living example. Demos render the
	// styled starting point; the docs chrome below stays hand-rolled CSS on the
	// same role tokens.
	import '$lib/theme/theme.css';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// R9 — theme toggle state (false = light, true = dark)
	// eslint-disable-next-line svelte/prefer-writable-derived
	let dark = $state(false);

	// Mobile nav open state
	let mobileNavOpen = $state(false);

	// Collapsible sidebar sections — start with the active section expanded
	function activeSectionHref(): string | undefined {
		return manifest.find(
			(s) =>
				page.url.pathname === s.href || (s.children ?? []).some((p) => page.url.pathname === p.href)
		)?.href;
	}
	const initial = activeSectionHref();
	const openSections = new SvelteSet<string>(initial ? [initial] : []);

	// Auto-expand when navigating into a currently-collapsed section
	$effect(() => {
		const href = activeSectionHref();
		if (href && !openSections.has(href)) {
			openSections.add(href);
		}
	});

	function toggleSection(href: string) {
		if (openSections.has(href)) openSections.delete(href);
		else openSections.add(href);
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
			<!-- Sidebar header: logo + theme toggle -->
			<div class="docs-sidebar-header">
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

			<!-- Nav tree — sections are collapsible -->
			<nav aria-label="Docs navigation">
				<ul class="sidebar-sections" role="list">
					{#each manifest as section (section.href)}
						<li class="sidebar-section">
							<div class="sidebar-section-header">
								<a
									href={section.href}
									class="sidebar-section-label"
									aria-current={isActive(section.href) ? 'page' : undefined}
									onclick={closeMobileNav}
								>
									{section.label}
								</a>
								<button
									type="button"
									class="sidebar-section-toggle"
									aria-expanded={openSections.has(section.href) ? 'true' : 'false'}
									aria-label="Toggle {section.label}"
									onclick={() => toggleSection(section.href)}
								>
									<IconChevronDown size={14} />
								</button>
							</div>
							{#if openSections.has(section.href)}
								<ul class="sidebar-pages" role="list">
									{#each section.children ?? [] as p (p.href)}
										<li>
											<a
												href={p.href}
												class="sidebar-page-link"
												aria-current={isActive(p.href) ? 'page' : undefined}
												onclick={closeMobileNav}
											>
												{p.label}
											</a>
										</li>
									{/each}
								</ul>
							{/if}
						</li>
					{/each}
				</ul>
			</nav>
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

	.docs-body {
		display: flex;
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

	.docs-sidebar {
		width: 15rem;
		flex-shrink: 0;
		border-right: 1px solid var(--hz-color-border, #6b7280);
		display: flex;
		flex-direction: column;
		position: sticky;
		top: 0;
		height: 100dvh;
		overflow-y: auto;
		padding: 1.25rem 0;
	}

	.docs-sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1rem 1rem;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
		margin-bottom: 0.75rem;
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
	/* Sidebar nav tree                                                      */
	/* ------------------------------------------------------------------ */

	.sidebar-sections {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.sidebar-section {
		padding: 0;
	}

	.sidebar-section-header {
		display: flex;
		align-items: center;
	}

	.sidebar-section-label {
		flex: 1;
		display: block;
		padding: 0.375rem 0.5rem 0.375rem 1rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		text-decoration: none;
		color: var(--hz-color-text-muted, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.sidebar-section-label:hover,
	.sidebar-section-label[aria-current='page'] {
		color: var(--hz-color-text, #000);
	}

	.sidebar-section-label[aria-current='page'] {
		color: var(--hz-color-primary, #2563eb);
	}

	.sidebar-section-toggle {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		margin-right: 0.25rem;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--hz-color-text-muted, #6b7280);
		border-radius: var(--hz-radius-sm, 0.25rem);
	}

	.sidebar-section-toggle:hover {
		color: var(--hz-color-text, #000);
		background-color: color-mix(in srgb, var(--hz-color-text, #000) 8%, transparent);
	}

	.sidebar-section-toggle :global(svg) {
		transition: transform 0.15s ease;
	}

	.sidebar-section-toggle[aria-expanded='true'] :global(svg) {
		transform: rotate(180deg);
	}

	.sidebar-pages {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.sidebar-page-link {
		display: block;
		padding: 0.3125rem 1rem 0.3125rem 1.75rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		text-decoration: none;
		color: var(--hz-color-text-muted, #6b7280);
		border-left: 2px solid transparent;
	}

	.sidebar-page-link:hover {
		color: var(--hz-color-text, #000);
		background-color: color-mix(in srgb, var(--hz-color-text, #000) 5%, transparent);
	}

	.sidebar-page-link[aria-current='page'] {
		color: var(--hz-color-primary, #2563eb);
		border-left-color: var(--hz-color-primary, #2563eb);
		background-color: color-mix(in srgb, var(--hz-color-primary, #2563eb) 8%, transparent);
		font-weight: var(--hz-font-weight-medium, 500);
	}

	/* ------------------------------------------------------------------ */
	/* Main content                                                          */
	/* ------------------------------------------------------------------ */

	.docs-main {
		flex: 1;
		min-width: 0;
		padding: 2rem 2.5rem;
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
			position: fixed;
			top: 0;
			left: 0;
			height: 100dvh;
			z-index: 300;
			background: var(--hz-color-surface, #fff);
			transform: translateX(-100%);
			transition: transform 0.2s ease;
		}

		.docs-sidebar[data-open] {
			transform: translateX(0);
		}

		.docs-main {
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

	:global(*:focus-visible) {
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
