<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx, uid } from '$lib/utils';
	import Button from './Button.svelte';

	// ---------------------------------------------------------------------------
	// CodeBlock (specs/47) — promoted from the docs-only prototype
	// (src/docs/CodeBlock.svelte, deleted by R13) into a shipped, headless,
	// zero-dependency component. `code` stays the single source of truth for
	// copy, line count, and the gutter no matter what renders visually —
	// syntax highlighting is always bring-your-own, via the `language` class
	// hook a client autoloader decorates (R7) or the `children` escape hatch a
	// build-time highlighter fills (R19). The library ships no highlighter.
	// ---------------------------------------------------------------------------

	interface Props {
		/** The source text. Always the source of truth: copy and selection
		 *  yield exactly this string, and line count / the gutter derive from
		 *  it — never from `children` or highlighter-injected markup. */
		code: string;
		/** Pre-highlighted content escape hatch. When provided, replaces the
		 *  default `<pre><code>{code}</code>` with the consumer's own
		 *  highlighted block (typically a build-time highlighter's `<pre>` via
		 *  `{@html}`, Shiki first). `code` stays required and is still what
		 *  copy/line-count/gutter read. */
		children?: Snippet;
		/** A filename/label. When set (or `language` is), a header bar renders. */
		title?: string;
		/** Stamps `class="language-<language>"` on the default inner `<code>`
		 *  (the client-autoloader hook for Prism/highlight.js) and
		 *  `data-language` on the root, and surfaces as a non-interactive
		 *  header tag. Unset → no class, no attribute, no tag. */
		language?: string;
		/** Opt-in decorative line-number gutter. Never part of copy/selection;
		 *  coexists with `children`. */
		lineNumbers?: boolean;
		/** Whether the built-in copy button renders. Default on — a copy
		 *  affordance is the primary reason a code block exists in docs. */
		copyable?: boolean;
		/** Clamp tall listings behind a Show-more/less toggle. */
		collapsible?: boolean;
		/** Rows shown while collapsed; the toggle only appears when the
		 *  listing actually exceeds this. */
		collapsedLines?: number;
		class?: string;
		[key: string]: unknown;
	}

	let {
		code,
		children,
		title,
		language,
		lineNumbers = false,
		copyable = true,
		collapsible = false,
		collapsedLines = 16,
		class: className,
		...rest
	}: Props = $props();

	const clipId = uid('hz-code');
	const titleId = uid('hz-code-title');

	// R4 — the header renders whenever either half is set.
	const hasHeader = $derived(!!title || !!language);
	// R19 — marks a block whose code node is consumer-supplied pre-highlighted
	// markup; also gates the clip's own tabindex (R8) so a Shiki `<pre
	// tabindex="0">` doesn't create a second tab stop.
	const highlighted = $derived(!!children);

	// R5 — collapse only kicks in when the listing is actually longer than the
	// clamp, so short blocks never grow a pointless toggle. Carried over
	// verbatim from the private component.
	const lineCount = $derived(code.split('\n').length);
	const canCollapse = $derived(collapsible && lineCount > collapsedLines);
	let expanded = $state(false);

	// The clamp height, in rem, sized from the code font (0.875rem × 1.5
	// line-height) plus the pre's top padding — enough for ~collapsedLines rows.
	const collapsedMaxRem = $derived(collapsedLines * 0.875 * 1.5 + 1);

	// R8 — untitled region name: language-derived, or the "Code" fallback.
	const clipLabel = $derived(title ? undefined : language ? `${language} code` : 'Code');

	// R6 — one number per source line, a sibling of the code node (never
	// interleaved), joined with real newlines so it aligns row-for-row with
	// the shared mono line-height rather than needing per-row elements.
	const gutterText = $derived(Array.from({ length: lineCount }, (_, i) => i + 1).join('\n'));

	// R3 — copy always reads the `code` prop, never the DOM: a client
	// autoloader (R7) or a `children` highlighter (R19) never changes this.
	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	async function copy(): Promise<void> {
		try {
			await navigator.clipboard.writeText(code);
			copied = true;
			clearTimeout(copyTimer);
			copyTimer = setTimeout(() => (copied = false), 2000);
		} catch {
			// Clipboard unavailable (permissions/insecure context) — the button
			// is a silent no-op: never flips to "Copied", nothing announced.
		}
	}
</script>

{#snippet copyButton()}
	<Button variant="outline" intent="neutral" size="sm" class="hz-code-block-copy" onclick={copy}>
		{copied ? 'Copied' : 'Copy'}
	</Button>
{/snippet}

<!--
	CodeBlock-R1: root, then (in order) the optional header, the code region,
	the floating copy button (only when there's no header to hold it), and the
	collapse toggle. SSR-safe throughout: no browser globals at module scope,
	clipboard access only inside the click handler, line count derived from
	the string, gutter numbers rendered server-side.
	CodeBlock-R12: rest spreads first so managed attrs (class, data-*) win —
	the stable `hz-code-block` root class is also Example.svelte's embed hook.
-->
<div
	{...rest}
	class={cx('hz-code-block', className)}
	data-language={language || undefined}
	data-has-title={title ? '' : undefined}
	data-highlighted={highlighted ? '' : undefined}
	data-collapsible={canCollapse ? '' : undefined}
	data-line-numbers={lineNumbers ? '' : undefined}
>
	{#if hasHeader}
		<!-- CodeBlock-R4: left cluster is [language chip?, title?], in that
		     order; copy is always the trailing, right-aligned item. -->
		<div class="hz-code-block-header">
			{#if language}
				<span class="hz-code-block-lang">{language}</span>
			{/if}
			{#if title}
				<span class="hz-code-block-title" id={titleId}>{title}</span>
			{/if}
			{#if copyable}
				{@render copyButton()}
			{/if}
		</div>
	{/if}

	<!-- CodeBlock-R8: tabindex="0" is deliberate — a keyboard-only WCAG 2.1.1
	     arrow-scroll region for the (non-interactive) code viewport, omitted
	     entirely when `children` supplies its own focusable `<pre>` (R19). -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		id={clipId}
		class="hz-code-block-clip"
		class:is-collapsed={canCollapse && !expanded}
		role="group"
		aria-labelledby={title ? titleId : undefined}
		aria-label={clipLabel}
		tabindex={highlighted ? undefined : 0}
		style={canCollapse && !expanded ? `max-height: ${collapsedMaxRem}rem` : undefined}
	>
		{#if lineNumbers}
			<span class="hz-code-block-gutter" aria-hidden="true">{gutterText}</span>
		{/if}
		{#if children}
			{@render children()}
		{:else}
			<pre><code class={language ? `language-${language}` : undefined}>{code}</code></pre>
		{/if}
	</div>

	{#if copyable && !hasHeader}
		{@render copyButton()}
	{/if}

	{#if canCollapse}
		<Button
			variant="ghost"
			intent="neutral"
			size="sm"
			class="hz-code-block-expand"
			aria-expanded={expanded}
			aria-controls={clipId}
			onclick={() => (expanded = !expanded)}
		>
			{expanded ? 'Show less' : `Show all ${lineCount} lines`}
		</Button>
	{/if}

	{#if copyable}
		<span class="sr-only" aria-live="polite">{copied ? 'Code copied to clipboard' : ''}</span>
	{/if}
</div>

<style>
	/* CodeBlock-R9: structural only — layout/positioning of the component's
	 * own always-present elements. No colour, border, radius, padding-scale
	 * chrome, or font sizing here; all of that is code-block.css. */
	.hz-code-block {
		position: relative;
	}

	.hz-code-block-header {
		display: flex;
		align-items: center;
		gap: var(--hz-space-sm, 1rem);
	}

	.hz-code-block-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.hz-code-block-lang {
		flex-shrink: 0;
	}

	/* Rides through Button's `class` prop — a separate component, so a
	 * scoped selector needs :global() to reach its root element. */
	.hz-code-block :global(.hz-code-block-copy) {
		flex-shrink: 0;
	}

	/* CodeBlock-R4: pushes copy to the header's trailing edge unconditionally
	 * — including language-only (no title, so no flex:1 element to do it) —
	 * an auto inline-start margin consumes all the row's free space. */
	.hz-code-block-header > :global(.hz-code-block-copy) {
		margin-inline-start: auto;
	}

	/* CodeBlock-R4: the floating form — no header, so the copy button is a
	 * direct child of the root instead of living in the header row. */
	.hz-code-block > :global(.hz-code-block-copy) {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		z-index: 1;
	}

	/* CodeBlock-R6: the gutter/code flex row. Sizing the code node itself
	 * (so it fills the remaining row width for `overflow-x` to matter) has to
	 * reach a `children`-supplied `<pre>` too, which scoped styles cannot —
	 * that piece lives in the theme's `:where(pre)` rule alongside the rest
	 * of the pre-box normalization (CodeBlock-R9). */
	.hz-code-block-clip {
		position: relative;
		display: flex;
		align-items: flex-start;
	}

	/* CodeBlock-R5: the collapse-clamp mechanics — the max-height itself is
	 * an inline style computed in the script; this only enables the clip. */
	.hz-code-block-clip.is-collapsed {
		overflow: hidden;
	}

	.hz-code-block-gutter {
		flex-shrink: 0;
		user-select: none;
	}
</style>
