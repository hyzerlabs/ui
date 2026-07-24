<script lang="ts">
	import { Stack, Container, Alert } from '$lib';
	import VirtualizedCombobox from '../../../docs/samples/VirtualizedCombobox.svelte';
	// ?raw keeps the listing in lockstep with the component that renders above it.
	import virtualizedComboboxSource from '../../../docs/samples/VirtualizedCombobox.svelte?raw';
	import CodeBlock from '../../../docs/CodeBlock.svelte';
	import { consumerSource } from '../../../docs/consumerSource';

	const composed = [{ label: 'Virtualizer', href: '/components/virtualizer' }];
</script>

<svelte:head>
	<title>Virtualized combobox — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<div class="doc-intro">
		<h1>Virtualized combobox</h1>
		<p class="doc-description">
			A multi-select text input plus a <code>role="listbox"</code> popup, windowed by
			<a href="/components/virtualizer">Virtualizer</a>, over tens of thousands of rows.
		</p>
		<p class="composed">
			Composes
			{#each composed as c, i (c.href)}{#if i > 0},
				{/if}<a href={c.href}>{c.label}</a>{/each}
			(plus the design tokens).
		</p>
	</div>

	<!-- Both alerts as one tight callout cluster — gap="near" on a
	     density-shifted Stack reads them as a single grouped warning instead
	     of two sections at normal page rhythm. -->
	<Stack gap="near" data-density-shift>
		<Alert intent="warning" title="Reach for this only when the dataset can't be narrowed down">
			A windowed listbox over tens of thousands of rows is a last resort, not a starting point. If
			there's any way to cut the list down first — server-side search, filtering by category or
			region before a picker ever opens, a shortlist of recent or favorite items — do that instead
			and use the plain <a href="/components/combobox">Combobox</a> on the smaller result. It's the more
			accessible pattern: a real option per row, simpler keyboard behavior, and nothing for assistive
			tech to lose track of. Only reach for this pattern once narrowing the data genuinely isn't an option.
		</Alert>

		<Alert intent="info" title="Why a pattern, not a component">
			<a href="/components/combobox">Combobox</a> deliberately renders every matching option rather
			than windowing the list. Combobox's own "Large list" demo is honest about the ceiling: every
			matching option gets a real
			<code>&lt;li&gt;</code>, which is fine into the low thousands but not at real scale. This
			pattern is what filling that gap looks like today: the same chip-based multi-select identity
			as Combobox — dismissible chips, toggle-to-select without closing the popup, the same focus
			management on chip dismiss — over a windowed listbox instead of a plain array, for the
			datasets where rendering every option would visibly lag.
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
		<h2 id="technique-heading">The scroll-follows-active technique</h2>
		<p class="section-note">
			APG's combobox pattern expects <code>aria-activedescendant</code> to point at a real,
			currently-rendered option — but Virtualizer only ever mounts the rows near the current scroll
			position, so most of a 25,000+ row list is never in the DOM. Every keyboard move (<kbd
				>ArrowUp</kbd
			>/<kbd>ArrowDown</kbd>/<kbd>Home</kbd>/<kbd>End</kbd>) goes through a two-phase commit instead
			of a direct index assignment: it nudges the Virtualizer viewport's <code>scrollTop</code>
			toward the target row first (the same "nearest" math <code>Element.scrollIntoView()</code>
			does, computed by hand since the target usually isn't mounted yet to call the real thing on), and
			only writes the active index — and therefore <code>aria-activedescendant</code> — once that
			row is confirmed present, via a small <code>&#123;@attach&#125;</code> each row uses to report
			its own mount/unmount. A generous <code>overscan</code> means a single-step arrow move
			resolves within the same tick, since the target row is usually already sitting in the overscan
			buffer just outside the visible viewport. Only big jumps — <kbd>Home</kbd>/<kbd>End</kbd>
			across tens of thousands of rows — take an extra frame while Virtualizer's own window catches up
			to the new scroll position.
		</p>
		<p class="section-note">
			Selection has the same windowing constraint: the listbox carries
			<code>aria-multiselectable="true"</code>, and each rendered row's <code>aria-selected</code> is
			derived from the selected-ids list, not from any DOM state — so a row reports the right selected
			state the instant Virtualizer mounts it, whether it was selected before the popup opened or a moment
			ago.
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
			The whole pattern, verbatim. Every import is a public export — copy it into an app with the
			theme installed and it renders the same.
		</p>
		<CodeBlock code={consumerSource(virtualizedComboboxSource)} collapsible />
	</Stack>
</Stack>

<style>
	.composed {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	/* Direct children of their Stack (gap="away", data-density-shift) —
	 * margin zeroed so the Stack's own gap owns the rhythm. */
	.section-note,
	.source-note {
		margin: 0;
	}

	/* A hairline frame so the bleed reads as a distinct artifact rather than
	 * as the docs page suddenly changing shape. No overflow clip here: the
	 * open popup (chips + input row, then a windowed listbox) is
	 * absolutely positioned and would otherwise be cut off at the frame's
	 * edge. min-height reserves room for the fully open state — chip row,
	 * input, and the windowed listbox — so opening the popup never reflows
	 * the rest of the page. */
	.sample-frame {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 2rem;
		min-height: 36rem;
	}
</style>
