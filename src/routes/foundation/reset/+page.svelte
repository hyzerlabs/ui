<script lang="ts">
	import { Stack } from '$lib';
	import CodeBlock from '../../../docs/CodeBlock.svelte';
	// ?raw keeps the docs in lockstep with the shipped sheet — no hand copy.
	import resetSource from '$lib/theme/reset.css?raw';

	const importOrder = `import '@hyzer-labs/ui/reset.css'; // 1. reset (optional)
import '@hyzer-labs/ui/tokens.css'; // 2. tokens
import '@hyzer-labs/ui/theme'; // 3. reference theme (optional)`;
</script>

<svelte:head>
	<title>CSS Reset — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>CSS Reset</h1>
		<p>
			An optional, structural adaptation of
			<a href="https://www.joshwcomeau.com/css/custom-css-reset/">Josh Comeau's custom CSS reset</a
			>. It normalizes box sizing, margins, media elements, and text wrapping — and deliberately
			says nothing about color or typefaces. Those belong to the tokens and theme tiers (or your
			own CSS), so the reset works the same whether you use the reference theme or go fully
			headless.
		</p>
	</div>

	<section aria-labelledby="import-heading">
		<h2 id="import-heading">Import order</h2>
		<p>
			Import the reset before other stylesheets. Every rule lives in the
			<code>hz-reset</code> cascade layer, pinned below <code>hz-theme</code>, so the reference
			theme and any unlayered CSS of yours always win ties — the reset never fights you.
		</p>
		<CodeBlock code={importOrder} />
	</section>

	<section aria-labelledby="source-heading">
		<h2 id="source-heading">What it does</h2>
		<ul>
			<li><code>box-sizing: border-box</code> everywhere.</li>
			<li>All default margins removed — spacing becomes a layout decision.</li>
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
		<CodeBlock code={resetSource.trim()} />
	</section>
</Stack>

<style>
	h1 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-2xl, 2rem);
		font-weight: var(--hz-font-weight-bold, 700);
	}

	h2 {
		margin: 0 0 1rem;
		font-size: var(--hz-font-size-xl, 1.5rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	p {
		margin: 0 0 1rem;
	}

	ul {
		margin: 0 0 1rem;
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
