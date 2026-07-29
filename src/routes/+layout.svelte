<script lang="ts">
	/**
	 * Root layout — everything that is true of EVERY page, docs or not.
	 *
	 * The docs shell (sidebar, TOC rail, mobile drawer, footer) used to live
	 * here, back when every route was a docs page. It now lives in
	 * `docs/+layout.svelte`, so the landing page can render full-bleed
	 * without it. What stays here is the stylesheet stack, the theme choice
	 * and its `data-theme` effect, and the route cross-fade.
	 */
	import type { Snippet } from 'svelte';
	import { onNavigate } from '$app/navigation';
	import { prefersReducedMotion } from 'svelte/motion';
	import { initTheme, themeState } from '../docs/theme.svelte.js';
	import '$lib/theme/reset.css';
	import '$lib/tokens/tokens.css';
	// Reference theme — the docs site is its living example. Demos render the
	// styled starting point; the docs chrome stays hand-rolled CSS on the
	// same role tokens.
	import '$lib/theme/theme.css';
	// Opt-in utility sheet (specs/44 R10) — dogfooded content-only: page/demo
	// content may use these classes, but the docs shell never depends on it.
	import '$lib/theme/utilities.css';
	// The shipped "Docs" example theme (specs/46) — this site's own reading
	// look (scaffold classes, .docs-table, code chips, content focus ring),
	// dogfooded as the literal shipped sheet rather than a private copy.
	import '$lib/theme/examples/docs/docs.css';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Restore the stored choice and follow the system preference while none is
	// in force. See src/docs/theme.svelte.ts for why those are separate.
	$effect(() => initTheme());

	// An explicit choice is WRITTEN, never inferred by absence: the tokens
	// sheet's system default is `:root:not([data-theme])`, so removing the
	// attribute to mean "light" would hand a system-dark reader dark mode and
	// make the light half of the toggle do nothing.
	$effect(() => {
		if (themeState.choice) {
			document.documentElement.setAttribute('data-theme', themeState.choice);
		} else {
			document.documentElement.removeAttribute('data-theme');
		}
	});

	// Route transitions: cross-fade ONLY the page content between routes — the
	// docs shell (sidebar, header, rails) must not move, so the root snapshot's
	// animation is disabled in the docs layout's CSS and .docs-main-inner
	// carries its own view-transition-name. No-op in browsers without the View
	// Transitions API and under reduced motion.
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		if (prefersReducedMotion.current) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

{@render children()}

<style>
	/* Smooth light/dark flip (toggleTheme in theme.svelte.ts): while html
	 * carries the temporary class, the surface-ish properties ease instead of
	 * snapping. !important intentionally overrides component transitions for
	 * these ~300ms so nothing strobes at its own timing mid-flip.
	 *
	 * FOREGROUNDS ARE DELIBERATELY ABSENT. Easing `color` from black to white
	 * interpolates through mid-gray, and a paragraph passing through gray
	 * reads as a flash of muted text rather than as a fade — in both
	 * directions, because the interpolation is symmetric. Backgrounds cross
	 * the same midpoint and get away with it; text does not. So surfaces,
	 * borders and shadows ease, and the foregrounds (color/fill/stroke) snap
	 * at the moment the attribute flips. */
	:global(html.theme-transition),
	:global(html.theme-transition *),
	:global(html.theme-transition *::before),
	:global(html.theme-transition *::after) {
		transition:
			background-color 250ms ease,
			border-color 250ms ease,
			outline-color 250ms ease,
			box-shadow 250ms ease !important;
	}
</style>
