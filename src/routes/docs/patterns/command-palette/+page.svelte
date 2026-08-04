<script lang="ts">
	import { Stack, CodeBlock } from '$lib';
	import CommandPalette from '../../../../docs/samples/CommandPalette.svelte';
	// ?raw keeps the listing in lockstep with the component that renders above it.
	import paletteSource from '../../../../docs/samples/CommandPalette.svelte?raw';
	import { consumerSource } from '../../../../docs/consumerSource';
	import DocIntro from '../../../../docs/DocIntro.svelte';
</script>

<svelte:head>
	<title>Command palette — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro />

	<p class="composed">
		Composes <a href="/docs/components/modal">Modal</a>,
		<a href="/docs/components/text-input">TextInput</a> (via <code>bind:element</code>), the shared
		<a href="/docs/components/icons">icons</a>, and the design tokens.
	</p>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="demo-heading"
	>
		<h2 id="demo-heading">Demo</h2>
		<div class="sample-frame">
			<CommandPalette />
		</div>
		<p class="doc-note">
			Press <kbd>⌘K</kbd> (or <kbd>Ctrl K</kbd>) anywhere on this page, or click
			<strong>Search</strong> above. Type to filter. ↑ and ↓ move the highlight, Enter opens the highlighted
			result, and Esc closes. This is a working palette, so choosing a result takes you to that page.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="source-heading"
	>
		<h2 id="source-heading">Source</h2>
		<p class="source-note">
			The whole composition, verbatim. Every import is a public export, plus SvelteKit's
			<code>goto</code> for navigation. Copy it into an app with the theme installed and it works the
			same.
		</p>
		<CodeBlock code={consumerSource(paletteSource)} collapsible lineNumbers />
	</Stack>
</Stack>

<style>
	.composed {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	/* Direct children of their Stack (gap="away", data-density-shift). Margin is
	 * zeroed so the Stack's own gap owns the rhythm. */
	.source-note {
		margin: 0;
	}

	.sample-frame {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 2rem;
		display: flex;
		justify-content: center;
	}
</style>
