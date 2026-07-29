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
		{#snippet brand()}
			<a class="site-logo" href="/">@hyzer-labs/ui</a>
		{/snippet}
		{#snippet actions()}
			<ThemeToggle />
		{/snippet}
	</Header>

	{@render children()}

	<Footer
		columns={[
			{
				title: 'Docs',
				links: [
					{ label: 'Getting Started', href: '/docs' },
					{ label: 'Philosophy', href: '/docs/philosophy' },
					{ label: 'Agents', href: '/docs/agents' },
					{ label: 'Theming', href: '/docs/theming/overview' }
				]
			},
			{
				title: 'Project',
				links: [
					{ label: 'GitHub', href: 'https://github.com/hyzerlabs/ui' },
					{ label: 'npm', href: 'https://www.npmjs.com/package/@hyzer-labs/ui' },
					{ label: 'llms.txt', href: '/llms.txt' }
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
</style>
