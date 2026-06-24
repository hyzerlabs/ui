<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<a class="skip-to-content" href="#main-content">Skip to content</a>

<div class="site-wrapper">
	<header class="site-header">
		<div class="content-column">
			<a href="/" class="site-logo">@hyzer-labs/ui</a>
			<nav aria-label="Main navigation">
				<ul>
					<li><a href="/">Home</a></li>
					<li><a href="/components">Components</a></li>
				</ul>
			</nav>
		</div>
	</header>

	<main id="main-content" class="site-main" tabindex="-1">
		<div class="content-column">
			{@render children()}
		</div>
	</main>

	<footer class="site-footer">
		<div class="content-column">
			<p>&copy; {new Date().getFullYear()} Hyzer Labs</p>
		</div>
	</footer>
</div>

<style>
	/* Skip to content link — visually hidden until focused */
	.skip-to-content {
		position: absolute;
		top: -100%;
		left: 0;
		z-index: 9999;
		padding: 0.5rem 1rem;
		background: #000;
		color: #fff;
		text-decoration: none;
		font-weight: 600;
	}
	.skip-to-content:focus-visible {
		top: 0;
	}

	/* Centered content column — max-width prevents horizontal scroll at all viewports */
	.content-column {
		width: 100%;
		max-width: 1200px;
		margin-inline: auto;
		padding-inline: 1rem;
	}

	.site-wrapper {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	.site-header {
		border-bottom: 1px solid currentColor;
	}

	.site-header .content-column {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding-block: 1rem;
	}

	.site-logo {
		font-weight: 700;
		text-decoration: none;
	}

	.site-header nav ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		gap: 1rem;
	}

	.site-main {
		flex: 1;
		padding-block: 2rem;
	}

	/* Prevent horizontal overflow at all viewport sizes */
	:global(*),
	:global(*::before),
	:global(*::after) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		overflow-x: hidden;
	}

	/* Code blocks scroll within their container — never cause page overflow */
	:global(pre) {
		max-width: 100%;
		overflow-x: auto;
	}

	:global(img),
	:global(video),
	:global(table) {
		max-width: 100%;
	}

	/* Ensure focus-visible rings are not removed */
	:global(*:focus-visible) {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
</style>
