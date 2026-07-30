<script lang="ts">
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import { DEV } from 'esm-env';
	import { cx } from '$lib/utils';

	type CardPadding = 'none' | 'sm' | 'md' | 'lg';
	type CardRounded = 'none' | 'sm' | 'md' | 'lg';
	type CardMediaPosition = 'start' | 'end';

	interface Props {
		padding?: CardPadding;
		rounded?: CardRounded;
		href?: string;
		ariaLabel?: string;
		horizontal?: boolean;
		mediaPosition?: CardMediaPosition;
		media?: Snippet;
		children?: Snippet;
		actions?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		padding = 'md',
		rounded = 'md',
		href,
		ariaLabel,
		horizontal = false,
		mediaPosition = 'start',
		media,
		children,
		actions,
		class: className,
		...rest
	}: Props = $props();

	// clickable when href is a non-empty string
	const isClickable = $derived(typeof href === 'string' && href.length > 0);

	// dev-only warning for missing accessible name on clickable card.
	// untrack() reads the initial prop values once at creation time (no re-run on prop change).
	if (DEV) {
		if (untrack(() => typeof href === 'string' && href.length > 0 && !ariaLabel)) {
			console.warn(
				'[hyzer-ui] <Card>: `href` is set without an `ariaLabel`. ' +
					'Add an `ariaLabel` to satisfy WCAG 2.4.4 / 4.1.2 ' +
					'(accessible name for the clickable card link).'
			);
		}
	}
</script>

<!--
	root div with hz-card class and data-* attributes.
	{...rest} spread first so managed attrs (class, data-*) win.
-->
<!--
	No variant prop by design: visual treatments are theme classes
	(hz-card--outlined, hz-card--elevated) applied via `class`.
-->
<div
	{...rest}
	class={cx('hz-card', className)}
	data-padding={padding}
	data-rounded={rounded}
	data-media-position={mediaPosition}
	data-horizontal={horizontal ? '' : undefined}
	data-clickable={isClickable ? '' : undefined}
>
	{#if isClickable}
		<!-- overlay link rendered as first child of hz-card -->
		<a class="hz-card-link" {href} aria-label={ariaLabel}>
			<span class="hz-card-link-overlay"></span>
		</a>
	{/if}

	{#if mediaPosition === 'start'}
		<!--
			mediaPosition="start" → media before content in DOM.
			DOM order drives reading/visual order; no CSS `order` reflow needed.
		-->
		{#if media}
			<div class="hz-card-media">{@render media()}</div>
		{/if}
		{#if children || actions}
			<div class="hz-card-content">
				{#if children}<div class="hz-card-body">{@render children()}</div>{/if}
				{#if actions}<div class="hz-card-actions">{@render actions()}</div>{/if}
			</div>
		{/if}
	{:else}
		<!--
			mediaPosition="end" → content before media in DOM.
		-->
		{#if children || actions}
			<div class="hz-card-content">
				{#if children}<div class="hz-card-body">{@render children()}</div>{/if}
				{#if actions}<div class="hz-card-actions">{@render actions()}</div>{/if}
			</div>
		{/if}
		{#if media}
			<div class="hz-card-media">{@render media()}</div>
		{/if}
	{/if}
</div>

<style>
	/* root is a flex column, positioned for the clickable overlay. */
	.hz-card {
		display: flex;
		flex-direction: column;
		position: relative;
	}

	/* ------------------------------------------------------------------ */
	/* padding on the content region; media bleeds edge-to-edge. */
	/* ------------------------------------------------------------------ */

	.hz-card[data-padding='none'] .hz-card-content {
		padding: 0;
	}
	.hz-card[data-padding='sm'] .hz-card-content {
		padding: var(--hz-space-sm, 1rem);
	}
	.hz-card[data-padding='md'] .hz-card-content {
		padding: var(--hz-space-md, 2rem);
	}
	.hz-card[data-padding='lg'] .hz-card-content {
		padding: var(--hz-space-lg, 4rem);
	}

	/* ------------------------------------------------------------------ */
	/* Horizontal = a media object (amended 2026-07-23): the whole row     */
	/* shares the card padding and one half-step gap; media sits inside    */
	/* the padding rather than bleeding. Declared after the rules above so */
	/* the content zero-out wins at equal specificity.                     */
	/* ------------------------------------------------------------------ */

	.hz-card[data-horizontal][data-padding='sm'] {
		padding: var(--hz-space-sm, 1rem);
		gap: var(--hz-space-xs, 0.5rem);
	}
	.hz-card[data-horizontal][data-padding='md'] {
		padding: var(--hz-space-md, 2rem);
		gap: var(--hz-space-sm, 1rem);
	}
	.hz-card[data-horizontal][data-padding='lg'] {
		padding: var(--hz-space-lg, 4rem);
		gap: var(--hz-space-md, 2rem);
	}
	.hz-card[data-horizontal] .hz-card-content {
		padding: 0;
	}

	/* ------------------------------------------------------------------ */
	/* horizontal side-by-side layout at ≥640px.                 */
	/* below 640px the default column direction handles stacking. */
	/* ------------------------------------------------------------------ */

	@media (min-width: 640px) {
		.hz-card[data-horizontal] {
			flex-direction: row;
		}

		/* Media track: fixed size, consumer-tunable via --hz-card-media-size.
		 * The track is itself a flex container; media top-aligns with the
		 * content, the classic media-object shape. */
		.hz-card[data-horizontal] .hz-card-media {
			flex: 0 0 var(--hz-card-media-size, 40%);
			display: flex;
			align-items: flex-start;
		}

		.hz-card[data-horizontal] .hz-card-media > :global(*) {
			flex: 1;
			min-width: 0;
		}

		/* Content fills the remaining space as a column so actions can pin to bottom. */
		.hz-card[data-horizontal] .hz-card-content {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: var(--hz-space-sm, 1rem);
		}

		/* actions pin to the bottom of the content column. */
		.hz-card[data-horizontal] .hz-card-actions {
			margin-top: auto;
		}
	}

	/* ------------------------------------------------------------------ */
	/* clickable-overlay positioning.                             */
	/* ------------------------------------------------------------------ */

	/*
	 * The overlay link covers the entire card. Use the child combinator (specificity
	 * 0,4,0 when Svelte adds its scope hash) so this rule beats the overlay rule
	 * (0,3,0) for the `position` property, keeping the link absolutely positioned.
	 */
	.hz-card > .hz-card-link {
		position: absolute;
		inset: 0;
		display: block;
	}

	/* Overlay span inside the link — absolutely positioned, sits at
	 * z-index: var(--hz-z-base, 0). */
	.hz-card-link-overlay {
		position: absolute;
		inset: 0;
		display: block;
		z-index: var(--hz-z-base, 0);
	}

	/*
	 * inner interactive elements (from consumer snippets) remain
	 * independently clickable and focusable above the overlay (z-index: 0).
	 * :where() keeps the selector's own specificity at 0,0,0; :global() is
	 * required so the rule matches consumer snippet elements that do not carry
	 * the component's Svelte scope class. The overlay link itself is an <a>
	 * inside the clickable card, so it must be excluded — Svelte 5 scopes with
	 * specificity-neutral :where(.svelte-HASH), which made this rule tie with
	 * the R9 overlay rule and win on source order, collapsing the overlay to
	 * zero height (position: relative on the link).
	 */
	.hz-card[data-clickable]
		:global(:where(a, button, input, select, textarea, [tabindex]):not(.hz-card-link)) {
		position: relative;
		z-index: var(--hz-z-raised, 1);
	}
</style>
