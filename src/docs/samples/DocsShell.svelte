<script lang="ts">
	/**
	 * A documentation shell: a sidebar Nav of collapsible sections, a reading
	 * column, and an "On this page" Toc rail that follows the column's own
	 * headings. The shell around the page you are reading is this same
	 * composition at full size.
	 *
	 * The Toc is scoped to the content column by element reference. Pass a
	 * selector or an element as `container` and it collects only that subtree's
	 * headings, so several shells (or a shell inside another page, like this
	 * demo) never pick up each other's sections. Nav sections are label-only
	 * toggles. The current page's link carries `ariaCurrent`, and `defaultOpen`
	 * keeps its section expanded when the items array is rebuilt on navigation.
	 *
	 * Heading levels adapt to where the shell renders. A real app would use
	 * h1 for the page title and h2 for sections, where Toc's default
	 * `levels={[2]}` applies. Embedded in this docs page's own outline, the
	 * sample title is an h3, sections are h4, and `levels={[4]}` keeps the rail
	 * in step.
	 */
	import { Nav, Toc, Stack, Badge } from '$lib';
	import type { NavItem } from '$lib/types';

	// The miniature site's routes are hash links into the reading column below,
	// so the sidebar, the content, and the Toc all describe the same page.
	const navItems: NavItem[] = [
		{ label: 'Introduction', href: '#shell-requirements' },
		{
			label: 'Guides',
			defaultOpen: true,
			children: [
				{ label: 'Install & import', href: '#shell-install', ariaCurrent: 'page' },
				{ label: 'Theme your app', href: '#shell-theme' },
				{ label: 'Ship it', href: '#shell-ship' }
			]
		},
		{
			label: 'Reference',
			children: [
				{ label: 'Tokens', href: '#shell-theme' },
				{ label: 'Components', href: '#shell-install' },
				{ label: 'Changelog', href: '#shell-ship' }
			]
		}
	];

	let contentEl = $state<HTMLElement | null>(null);
</script>

<div class="shell">
	<aside class="shell-sidebar">
		<div class="shell-brand">
			<span class="shell-logo">flightlab docs</span>
			<Badge intent="neutral" variant="outline" size="sm">v1.2</Badge>
		</div>
		<Nav items={navItems} orientation="vertical" ariaLabel="Site navigation" class="shell-nav" />
	</aside>

	<div class="shell-content" bind:this={contentEl}>
		<Stack gap="lg" as="article">
			<header class="shell-page-header">
				<h3 class="shell-title">Install &amp; import</h3>
				<p class="shell-lead">
					Get the library into a project and render a first component in a few short steps.
				</p>
			</header>

			<section class="shell-section">
				<h4 id="shell-requirements">Requirements</h4>
				<p>
					Any bundler that resolves package exports works. The library ships plain modules and plain
					CSS, so there is no build plugin to install and no compiler configuration to copy.
				</p>
				<p>
					Styles are optional at every tier: the components run headless, and the theme is a
					separate import you add when you want the styled starting point.
				</p>
			</section>

			<section class="shell-section">
				<h4 id="shell-install">Install</h4>
				<p>
					Add the package with your package manager of choice, then import the theme once at the app
					root. Every component after that is a named import. There are no barrel side effects, so
					your bundler keeps only what a page renders.
				</p>
				<p>
					The first render is the whole integration test: if a styled button shows up, the tokens,
					the theme, and the component layer are all wired.
				</p>
			</section>

			<section class="shell-section">
				<h4 id="shell-theme">Theme your app</h4>
				<p>
					Override a palette token and every role that references it follows: borders, muted text,
					and tinted surfaces all chain through the token graph. Most brands need only a handful of
					overrides.
				</p>
				<p>
					Dark mode is one attribute on the root element. The palette re-resolves per mode, and
					components never know the difference because they read roles, not raw hues.
				</p>
			</section>

			<section class="shell-section">
				<h4 id="shell-ship">Ship it</h4>
				<p>
					Check your overridden pairings against WCAG with the exported contrast helpers, run your
					usual build, and deploy. The library adds no runtime beyond the components you render.
				</p>
			</section>
		</Stack>
	</div>

	<div class="shell-rail">
		{#if contentEl}
			<Toc container={contentEl} levels={[4]} />
		{/if}
	</div>
</div>

<style>
	.shell {
		display: grid;
		grid-template-columns: 11rem minmax(0, 1fr) 9rem;
		gap: 2rem;
	}

	/* Sidebar and rail stick while the reading column scrolls by. That is the
	 * same behavior as a fixed shell, but scoped so the demo works embedded in
	 * a larger page. align-self keeps the sticky element from stretching to the
	 * full grid-row height (a stretched item has nowhere to stick). */
	.shell-sidebar,
	.shell-rail {
		align-self: start;
		position: sticky;
		top: 1rem;
	}

	.shell-sidebar {
		border-right: 1px solid var(--hz-color-border, #6b7280);
		padding-right: 0.5rem;
	}

	.shell-brand {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem 0.75rem;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
		margin-bottom: 0.75rem;
	}

	.shell-logo {
		font-weight: var(--hz-font-weight-bold, 700);
		font-size: var(--hz-font-size-sm, 0.875rem);
		white-space: nowrap;
	}

	/* Sidebar Nav skin: quiet uppercase section toggles, indented page links,
	 * an accent on the current page. Unlayered, so it wins over the theme
	 * layer without a specificity fight. */
	.shell :global(.shell-nav .hz-nav-inner) {
		padding: 0;
	}

	.shell :global(.shell-nav .hz-nav-links > li > .hz-nav-trigger),
	.shell :global(.shell-nav .hz-nav-links > li > .hz-link) {
		flex: 1;
		padding: 0.3125rem 0.5rem;
		font-size: var(--hz-font-size-xs, 0.75rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		color: var(--hz-color-text-muted, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.shell :global(.shell-nav .hz-nav-links > li > .hz-link) {
		display: block;
	}

	.shell :global(.shell-nav .hz-nav-panel) {
		padding: 0;
	}

	.shell :global(.shell-nav .hz-nav-panel .hz-link) {
		display: block;
		padding: 0.25rem 0.5rem 0.25rem 1.25rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
		border-radius: 0;
	}

	.shell :global(.shell-nav .hz-nav-panel .hz-link:hover) {
		color: var(--hz-color-text, #000);
	}

	.shell :global(.shell-nav .hz-nav-panel .hz-link[aria-current='page']) {
		color: var(--hz-intent-primary, #2563eb);
		box-shadow: inset 2px 0 0 var(--hz-intent-primary, #2563eb);
		font-weight: var(--hz-font-weight-medium, 500);
	}

	.shell-page-header,
	.shell-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.shell-title {
		margin: 0;
		font-size: var(--hz-font-size-xl, 1.65rem);
		font-weight: var(--hz-font-weight-bold, 700);
	}

	.shell-lead {
		margin: 0;
		color: var(--hz-color-text-muted, #6b7280);
	}

	.shell-section h4 {
		margin: 0;
		font-size: var(--hz-font-size-lg, 1.4rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		/* Room above an anchored heading when a nav or Toc link jumps to it. */
		scroll-margin-top: 1rem;
	}

	.shell-section p {
		margin: 0;
		line-height: var(--hz-line-height-base, 1.5);
	}

	/* Below tablet width the rail hides and the sidebar stacks on top, the
	 * simplest honest collapse for a demo. A production shell would trade the
	 * sidebar for a drawer (see Header's mobile pattern). */
	@media (max-width: 767px) {
		.shell {
			grid-template-columns: minmax(0, 1fr);
		}

		.shell-rail {
			display: none;
		}

		.shell-sidebar {
			position: static;
			border-right: none;
			border-bottom: 1px solid var(--hz-color-border, #6b7280);
			padding-right: 0;
			padding-bottom: 0.75rem;
		}
	}
</style>
