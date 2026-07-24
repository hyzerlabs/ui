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

<Stack gap="xl">
	<div>
		<h1>Virtualized combobox</h1>
		<p class="lead">
			A text input plus a <code>role="listbox"</code> popup, windowed by
			<a href="/components/virtualizer">Virtualizer</a>, over tens of thousands of rows. Typing
			filters the whole dataset by substring, same as
			<a href="/components/combobox">Combobox</a>'s own default — the difference here is that only
			the rows near the current scroll position are ever mounted, so the list stays fast regardless
			of how many rows match.
		</p>
		<p class="composed">
			Composes
			{#each composed as c, i (c.href)}{#if i > 0},
				{/if}<a href={c.href}>{c.label}</a>{/each}
			(plus the design tokens). It is a from-scratch APG combobox composition, not the
			<a href="/components/combobox">Combobox</a> component — see "Why a pattern, not a component" below.
		</p>
	</div>

	<Alert intent="info" title="Why a pattern, not a component">
		<a href="/components/combobox">Combobox</a> deliberately defers windowing — its
		<a href="/components/virtualizer">Virtualizer spec's Out of Scope</a> section calls it out, and
		Combobox's own "Large list" demo is honest about the ceiling: every matching option gets a real
		<code>&lt;li&gt;</code>, which is fine into the low thousands but not at real scale. This
		pattern is what filling that gap looks like today: a hand-rolled combobox shell (not Combobox's
		chip/multi-select machinery) over a windowed listbox, for the datasets where rendering every
		option would visibly lag.
	</Alert>

	<!-- The sample bleeds across the full main column while the sidebar stays
	     put. .docs-main sets --hz-breakout-shift: 0, so it grows rightward from
	     the prose column rather than centering. -->
	<Container breakout padding="none">
		<div class="sample-frame">
			<VirtualizedCombobox />
		</div>
	</Container>

	<section aria-labelledby="technique-heading">
		<h2 id="technique-heading">The scroll-follows-active technique</h2>
		<p>
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
			buffer just outside the visible viewport. Only big jumps — <kbd>Home</kbd>/<kbd>End</kbd> across
			tens of thousands of rows — take an extra frame while Virtualizer's own window catches up to the
			new scroll position.
		</p>
	</section>

	<section aria-labelledby="source-heading">
		<h2 id="source-heading">Source</h2>
		<p>
			The whole pattern, verbatim. Every import is a public export — copy it into an app with the
			theme installed and it renders the same.
		</p>
		<CodeBlock code={consumerSource(virtualizedComboboxSource)} />
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

	section p {
		margin: 0 0 1rem;
	}

	/* A hairline frame so the bleed reads as a distinct artifact rather than
	 * as the docs page suddenly changing shape. */
	.sample-frame {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 2rem;
		overflow: hidden;
	}
</style>
