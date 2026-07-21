<script lang="ts">
	import { Stack } from '$lib';
	import CommandPalette from '../../../docs/samples/CommandPalette.svelte';
	// ?raw keeps the listing in lockstep with the component that renders above it.
	import paletteSource from '../../../docs/samples/CommandPalette.svelte?raw';
	import CodeBlock from '../../../docs/CodeBlock.svelte';
	import { consumerSource } from '../../../docs/consumerSource';
</script>

<svelte:head>
	<title>Command palette — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>Command palette</h1>
		<p class="lead">
			A ⌘K quick-search overlay assembled from the primitives. The heavy lifting — the backdrop,
			focus trap, and Escape-to-close — is <a href="/components/modal">Modal</a>; the recipe only
			adds a search field, a filtered <code>role="listbox"</code>, and the arrow/Enter keyboard
			wiring.
		</p>
		<p class="composed">
			Composes <a href="/components/modal">Modal</a>, the shared
			<a href="/foundation/icons">icons</a>, and the design tokens. Press <kbd>⌘K</kbd> (or
			<kbd>Ctrl K</kbd>) anywhere on this page, or click <strong>Search</strong> below.
		</p>
	</div>

	<section aria-labelledby="demo-heading">
		<h2 id="demo-heading">Demo</h2>
		<div class="sample-frame">
			<CommandPalette />
		</div>
		<p class="note">
			Type to filter; ↑/↓ move, Enter opens the highlighted destination, Esc closes. Selecting a
			result navigates — this is a working palette, so it will take you to that page.
		</p>
	</section>

	<section aria-labelledby="source-heading">
		<h2 id="source-heading">Source</h2>
		<p>
			The whole composition, verbatim. Every import is a public export (plus SvelteKit's
			<code>goto</code> for navigation) — copy it into an app with the theme installed and it works the
			same.
		</p>
		<CodeBlock code={consumerSource(paletteSource)} />
	</section>
</Stack>

<style>
	h1 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-2xl, 2.75rem);
		font-weight: var(--hz-font-weight-bold, 700);
	}

	h2 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-xl, 1.65rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.lead {
		margin: 0 0 0.75rem;
		font-size: var(--hz-font-size-lg, 1.4rem);
		line-height: var(--hz-line-height-base, 1.5);
	}

	.composed {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.composed kbd {
		font-family: var(--hz-font-family-mono, monospace);
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-sm, 0.25rem);
		padding: 0.05rem 0.3rem;
	}

	section p {
		margin: 0 0 1rem;
	}

	.sample-frame {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 2rem;
		display: flex;
		justify-content: center;
	}

	.note {
		margin: 1rem 0 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
