<script lang="ts">
	import { Stack, CodeBlock } from '$lib';
	// ?raw keeps the docs in lockstep with the shipped sheet — no hand copy.
	import resetSource from '$lib/theme/reset.css?raw';
	import DocIntro from '../../../../docs/DocIntro.svelte';

	// An array joined with '\n', not a multi-line template literal — a raw
	// `import '@hyzer-labs/ui/...'` sitting at the start of a source line trips
	// Vite's TS-import-extraction regex (it scans raw text, not real syntax),
	// which then tries to resolve these display-only strings as real deps.
	const importOrder = [
		"import '@hyzer-labs/ui/reset.css'; // 1. reset (optional)",
		"import '@hyzer-labs/ui/tokens.css'; // 2. tokens",
		"import '@hyzer-labs/ui/theme'; // 3. reference theme (optional)"
	].join('\n');
</script>

<svelte:head>
	<title>CSS Reset — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro>
		{#snippet lead()}
			An optional adaptation of
			<a href="https://www.joshwcomeau.com/css/custom-css-reset/" target="_blank" rel="noreferrer"
				>Josh Comeau's custom CSS reset</a
			>: box sizing, margins, media elements, and text wrapping. It says nothing about color or
			typefaces, so it works the same with the reference theme or fully headless.
		{/snippet}
	</DocIntro>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="import-heading"
	>
		<h2 id="import-heading">Import order</h2>
		<p>
			Import the reset before other stylesheets. Every rule lives in the
			<code>hz-reset</code> cascade layer, pinned below <code>hz-theme</code>, so the reference
			theme always beats it. Your own unlayered CSS beats both, at any specificity, because an
			unlayered rule outranks every layered one. The reset never fights you.
		</p>
		<CodeBlock code={importOrder} />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="source-heading"
	>
		<h2 id="source-heading">What it does</h2>
		<ul>
			<li><code>box-sizing: border-box</code> everywhere.</li>
			<li>All default margins removed, so spacing becomes a layout decision.</li>
			<li>
				<code>interpolate-size: allow-keywords</code> so <code>height: auto</code> transitions can
				animate (guarded by <code>prefers-reduced-motion</code>).
			</li>
			<li>Media elements (<code>img</code>, <code>video</code>, …) block-level and constrained.</li>
			<li>Form controls inherit the surrounding font.</li>
			<li>
				Long words break instead of overflowing; <code>text-wrap: pretty</code> for paragraphs and
				<code>balance</code> for headings.
			</li>
		</ul>
		<CodeBlock code={resetSource.trim()} collapsible />
	</Stack>
</Stack>

<style>
	/* Margins zeroed — p/ul on this page are direct children of a .doc-section
	 * Stack (gap="away", data-density-shift), which now owns the rhythm. */
	p {
		margin: 0;
	}

	ul {
		margin: 0;
		padding-left: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}
</style>
