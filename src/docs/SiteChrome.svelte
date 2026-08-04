<script lang="ts">
	/**
	 * The full-bleed site chrome — skip link, header, footer — for the pages
	 * that render WITHOUT the docs shell (the landing page and the error
	 * page). The docs routes get their chrome from `docs/+layout.svelte`.
	 */
	import type { Snippet } from 'svelte';
	import { Header, Footer } from '$lib';
	import ThemeToggle from './ThemeToggle.svelte';
	import type { NavItem } from '$lib/types';

	let { children }: { children: Snippet } = $props();

	const navItems: NavItem[] = [
		{ label: 'Docs', href: '/docs' },
		{ label: 'Components', href: '/docs/components/button' },
		{ label: 'Theming', href: '/docs/theming/overview' },
		{ label: 'GitHub', href: 'https://github.com/hyzerlabs/ui' }
	];
</script>

<a class="skip-to-content" href="#main-content">Skip to content</a>

<div class="site-shell">
	<Header items={navItems} ariaLabel="Site navigation" sticky bordered mobileBreakpoint="sm">
		{#snippet logo()}
			<a class="site-logo" href="/">@hyzer-labs/ui</a>
		{/snippet}
		{#snippet actions()}
			<ThemeToggle />
		{/snippet}
	</Header>

	{@render children()}

	<Footer
		class="site-footer"
		bordered
		columns={[
			{
				title: 'Docs',
				links: [
					{ label: 'Getting Started', href: '/docs' },
					{ label: 'Philosophy', href: '/docs/philosophy' },
					{ label: 'Components', href: '/docs/components/button' },
					{ label: 'Theming', href: '/docs/theming/overview' }
				]
			},
			{
				title: 'Agents',
				links: [
					{ label: 'Agents.md', href: '/agents.md' },
					{ label: 'llms.txt', href: '/llms.txt' },
					{ label: 'llms-full.txt', href: '/llms-full.txt' },
					{ label: 'llms-full.json', href: '/llms-full.json' }
				]
			},
			{
				title: 'Project',
				links: [
					{ label: 'GitHub', href: 'https://github.com/hyzerlabs/ui' },
					{ label: 'npm', href: 'https://www.npmjs.com/package/@hyzer-labs/ui' }
				]
			}
		]}
	>
		{#snippet bottom()}
			<!-- Same line the docs footer carries, Hyzer link included. -->
			<span>
				&copy; {new Date().getFullYear()}
				<a href="https://hyzer.sh" target="_blank" rel="noreferrer">Hyzer</a> &mdash; MIT License
			</span>
		{/snippet}
	</Footer>
</div>

<style>
	/* .skip-to-content and .site-logo live in src/docs/chrome.css — the docs
	   shell renders the same two, so they are shared, not copied. */

	/* Full-height column so a short page (the 404) still puts the footer at
	   the bottom of the viewport rather than mid-screen. */
	.site-shell {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}

	.site-shell > :global(main) {
		flex: 1;
	}

	/* Styled through Footer's class prop — the documented override channel.
	   The class prop merges onto the component root, so site-footer and
	   hz-footer are the same element: a compound selector, not a descendant.
	   On-fill text is the surface role (the solid Banner's pairing), so it
	   flips with the mode; the muted link/heading roles are lifted to inherit
	   for the same reason. */
	:global(.site-footer.hz-footer) {
		background-color: var(--hz-intent-primary, #2563eb);
		color: var(--hz-color-surface, #fff);
	}

	:global(.site-footer.hz-footer) :global(a),
	:global(.site-footer.hz-footer) :global(.hz-footer-heading),
	:global(.site-footer.hz-footer) :global(.hz-footer-bottom) {
		color: inherit;
	}
</style>
