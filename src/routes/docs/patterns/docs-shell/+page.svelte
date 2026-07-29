<script lang="ts">
	import { Stack, Container, Alert, CodeBlock } from '$lib';
	import DocsShell from '../../../../docs/samples/DocsShell.svelte';
	// ?raw keeps the listing in lockstep with the component that renders above it.
	import docsShellSource from '../../../../docs/samples/DocsShell.svelte?raw';
	import { consumerSource } from '../../../../docs/consumerSource';
	import DocIntro from '../../../../docs/DocIntro.svelte';

	const composed = [
		{ label: 'Nav', href: '/docs/components/nav' },
		{ label: 'Toc', href: '/docs/components/toc' },
		{ label: 'Badge', href: '/docs/components/badge' }
	];
</script>

<svelte:head>
	<title>Docs shell — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro>
		{#snippet lead()}
			A documentation layout: a sidebar of collapsible nav sections, a reading column, and an "On
			this page" rail that follows the column's headings.
		{/snippet}
	</DocIntro>

	<div class="doc-intro">
		<p class="composed">
			Composes
			{#each composed as c, i (c.href)}{#if i > 0}{i === composed.length - 1
						? ', and '
						: ', '}{/if}<a href={c.href}>{c.label}</a>{/each}
			(plus the layout primitives).
		</p>
	</div>

	<Alert intent="info" title="You are inside this pattern right now">
		The shell around this page — the sidebar, this reading column, and the rail on the right — is
		the same composition at full size: the library's vertical <a href="/docs/components/nav">Nav</a>
		and
		<a href="/docs/components/toc">Toc</a>, skinned with plain CSS on the role tokens.
	</Alert>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="demo-heading"
	>
		<h2 id="demo-heading">Demo</h2>
		<!-- The sample bleeds across the full main column while the sidebar stays
		     put. .docs-main sets --hz-breakout-shift: 0, so it grows rightward from
		     the prose column rather than centering. -->
		<Container breakout padding="none">
			<div class="sample-frame">
				<DocsShell />
			</div>
		</Container>
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
			The whole pattern, verbatim. Every import is a public export — copy it into an app with the
			theme installed and it renders the same.
		</p>
		<CodeBlock code={consumerSource(docsShellSource)} collapsible />
	</Stack>
</Stack>

<style>
	.composed {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	/* Direct children of their Stack (gap="away", data-density-shift) — margin
	 * zeroed so the Stack's own gap owns the rhythm. */
	.source-note {
		margin: 0;
	}

	.sample-frame {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 2rem;
	}
</style>
