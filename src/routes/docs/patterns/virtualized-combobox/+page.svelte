<script lang="ts">
	import { Stack, Container, Alert, CodeBlock } from '$lib';
	import VirtualizedCombobox from '../../../../docs/samples/VirtualizedCombobox.svelte';
	// ?raw keeps the listing in lockstep with the component that renders above it.
	import virtualizedComboboxSource from '../../../../docs/samples/VirtualizedCombobox.svelte?raw';
	import { consumerSource } from '../../../../docs/consumerSource';
	import DocIntro from '../../../../docs/DocIntro.svelte';
	import IconTriangleAlert from '$lib/icons/generated/triangle-alert.svelte';
	import IconInfo from '$lib/icons/generated/info.svelte';

	const composed = [{ label: 'Virtualizer', href: '/docs/components/virtualizer' }];
</script>

<svelte:head>
	<title>Virtualized combobox — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro>
		{#snippet lead()}
			A multi-select text input plus a <code>role="listbox"</code> popup, windowed by
			<a href="/docs/components/virtualizer">Virtualizer</a>, over tens of thousands of rows.
		{/snippet}
	</DocIntro>

	<p class="composed">
		Composes
		{#each composed as c, i (c.href)}{#if i > 0},
			{/if}<a href={c.href}>{c.label}</a>{/each}
		(plus the design tokens).
	</p>

	<!-- Both alerts as one tight callout cluster: gap="near" on a
	     density-shifted Stack reads them as a single grouped warning instead
	     of two sections at normal page rhythm. -->
	<Stack gap="near" data-density-shift>
		<Alert intent="warning" title="Reach for this only when you cannot narrow the dataset">
			{#snippet icon()}<IconTriangleAlert />{/snippet}
			A windowed listbox over tens of thousands of rows is a last resort, not a starting point. If you
			can cut the list down first, do that instead and use the plain
			<a href="/docs/components/combobox">Combobox</a> on the smaller result. Server-side search, filtering
			by category or region before a picker ever opens, and a shortlist of recent or favorite items all
			work. The plain Combobox is the more accessible pattern: a real option per row, simpler keyboard
			behavior, and nothing for assistive tech to lose track of. Reach for this pattern only once narrowing
			the data is not an option.
		</Alert>

		<Alert intent="info" title="Why a pattern, not a component">
			{#snippet icon()}<IconInfo />{/snippet}
			<a href="/docs/components/combobox">Combobox</a> deliberately renders every matching option
			rather than windowing the list. Its own "Large list" demo names the ceiling: every matching
			option gets a real <code>&lt;li&gt;</code>, which is fine into the low thousands but not at
			real scale. This pattern is what filling that gap looks like today. It keeps the same
			chip-based multi-select identity as Combobox (dismissible chips, toggle-to-select without
			closing the popup, and the same focus management when a chip is dismissed) over a windowed
			listbox instead of a plain array, for the datasets where rendering every option would visibly
			lag.
		</Alert>
	</Stack>

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
				<VirtualizedCombobox />
			</div>
		</Container>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="technique-heading"
	>
		<h2 id="technique-heading">How the scroll follows the active option</h2>
		<p class="section-note">
			APG's combobox pattern expects <code>aria-activedescendant</code> to point at a real,
			currently-rendered option. Virtualizer only ever mounts the rows near the current scroll
			position, so most of a list this size is never in the DOM. Every keyboard move (<kbd
				>ArrowUp</kbd
			>/<kbd>ArrowDown</kbd>/<kbd>Home</kbd>/<kbd>End</kbd>) therefore goes through a two-phase
			commit rather than a direct index assignment. It first nudges the Virtualizer viewport's
			<code>scrollTop</code> toward the target row, using the same "nearest" math
			<code>Element.scrollIntoView()</code> does, computed by hand since the target usually is not
			mounted yet to call the real thing on. It writes the active index, and therefore
			<code>aria-activedescendant</code>, only once that row is confirmed present. Each row reports
			its own mount and unmount through a small <code>&#123;@attach&#125;</code>, which is what
			makes that confirmation possible.
		</p>
		<p class="section-note">
			A generous <code>overscan</code> means a single-step arrow move resolves within the same tick,
			since the target row is usually already sitting in the overscan buffer just outside the
			visible viewport. Only big jumps take an extra frame while Virtualizer's own window catches up
			to the new scroll position: <kbd>Home</kbd> and <kbd>End</kbd> across tens of thousands of rows.
		</p>
		<p class="section-note">
			Selection has the same windowing constraint. The listbox carries
			<code>aria-multiselectable="true"</code>, and each rendered row's <code>aria-selected</code>
			comes from the selected-ids list rather than from any DOM state. A row therefore reports the right
			selected state the instant Virtualizer mounts it, whether you selected it before the popup opened
			or a moment ago.
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
			The whole pattern, verbatim. Every import is a public export, so you can copy it into an app
			with the theme installed and it renders the same.
		</p>
		<CodeBlock code={consumerSource(virtualizedComboboxSource)} collapsible lineNumbers />
	</Stack>
</Stack>

<style>
	.composed {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	/* Direct children of their Stack (gap="away", data-density-shift):
	 * margin zeroed so the Stack's own gap owns the rhythm. */
	.section-note,
	.source-note {
		margin: 0;
	}

	/* A hairline frame so the bleed reads as a distinct artifact rather than
	 * as the docs page suddenly changing shape. No overflow clip here: the
	 * open popup (chips and input row, then a windowed listbox) is
	 * absolutely positioned and would otherwise be cut off at the frame's
	 * edge. min-height reserves room for the fully open state (chip row,
	 * input, and the windowed listbox), so opening the popup never reflows
	 * the rest of the page. */
	.sample-frame {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 2rem;
		min-height: 36rem;
	}
</style>
