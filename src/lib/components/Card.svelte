<script lang="ts">
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import { cx } from '$lib/utils';

	type CardVariant = 'elevated' | 'outlined' | 'filled' | 'ghost';
	type CardPadding = 'none' | 'sm' | 'md' | 'lg';
	type CardRounded = 'none' | 'sm' | 'md' | 'lg';
	type CardMediaPosition = 'start' | 'end';

	interface Props {
		variant?: CardVariant;
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
		variant = 'outlined',
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

	// Card-R9: clickable when href is a non-empty string
	const isClickable = $derived(typeof href === 'string' && href.length > 0);

	// Card-R11: dev-only warning for missing accessible name on clickable card.
	// untrack() reads the initial prop values once at creation time (no re-run on prop change).
	if (import.meta.env.DEV) {
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
	Card-R1: root div with hz-card class and data-* attributes.
	Card-R14: {...rest} spread first so managed attrs (class, data-*) win.
-->
<div
	{...rest}
	class={cx('hz-card', className)}
	data-variant={variant}
	data-padding={padding}
	data-rounded={rounded}
	data-media-position={mediaPosition}
	data-horizontal={horizontal ? '' : undefined}
	data-clickable={isClickable ? '' : undefined}
>
	{#if isClickable}
		<!-- Card-R9: overlay link rendered as first child of hz-card -->
		<a class="hz-card-link" {href} aria-label={ariaLabel}>
			<span class="hz-card-link-overlay"></span>
		</a>
	{/if}

	{#if mediaPosition === 'start'}
		<!--
			Card-R4: mediaPosition="start" → media before content in DOM.
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
			Card-R4: mediaPosition="end" → content before media in DOM.
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
	/* Card-R1/R5: root is a flex column, positioned for the clickable overlay (Card-R9). */
	.hz-card {
		display: flex;
		flex-direction: column;
		position: relative;
	}

	/* ------------------------------------------------------------------ */
	/* Card-R8: padding on the content region; media bleeds edge-to-edge. */
	/* ------------------------------------------------------------------ */

	.hz-card[data-padding='none'] .hz-card-content {
		padding: 0;
	}
	.hz-card[data-padding='sm'] .hz-card-content {
		padding: var(--hz-space-sm, 0.5rem);
	}
	.hz-card[data-padding='md'] .hz-card-content {
		padding: var(--hz-space-md, 1rem);
	}
	.hz-card[data-padding='lg'] .hz-card-content {
		padding: var(--hz-space-lg, 1.5rem);
	}

	/* ------------------------------------------------------------------ */
	/* Card-R6: horizontal side-by-side layout at ≥640px.                 */
	/* Card-R7: below 640px the default column direction handles stacking. */
	/* ------------------------------------------------------------------ */

	@media (min-width: 640px) {
		.hz-card[data-horizontal] {
			flex-direction: row;
		}

		/* Media track: fixed size, consumer-tunable via --hz-card-media-size. */
		.hz-card[data-horizontal] .hz-card-media {
			flex: 0 0 var(--hz-card-media-size, 40%);
		}

		/* Content fills the remaining space as a column so actions can pin to bottom. */
		.hz-card[data-horizontal] .hz-card-content {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: var(--hz-space-md, 1rem);
		}

		/* Card-R6: actions pin to the bottom of the content column. */
		.hz-card[data-horizontal] .hz-card-actions {
			margin-top: auto;
		}
	}

	/* ------------------------------------------------------------------ */
	/* Card-R9: clickable-overlay positioning.                             */
	/* ------------------------------------------------------------------ */

	/*
	 * The overlay link covers the entire card. Use the child combinator (specificity
	 * 0,4,0 when Svelte adds its scope hash) so this rule beats the Card-R10 rule
	 * (0,3,0) for the `position` property, keeping the link absolutely positioned.
	 */
	.hz-card > .hz-card-link {
		position: absolute;
		inset: 0;
		display: block;
	}

	/* Overlay span inside the link — absolutely positioned, sits at z-index: 0. */
	.hz-card-link-overlay {
		position: absolute;
		inset: 0;
		display: block;
		z-index: 0;
	}

	/*
	 * Card-R10: inner interactive elements (from consumer snippets) remain
	 * independently clickable and focusable above the overlay (z-index: 0).
	 * :where() keeps the selector's own specificity at 0,0,0; the full compiled
	 * rule is .hz-card.svelte-HASH[data-clickable] :where(…) = 0,3,0.
	 * :global() is required so the rule matches consumer snippet elements that
	 * do not carry the component's Svelte scope class.
	 */
	.hz-card[data-clickable] :global(:where(a, button, input, select, textarea, [tabindex])) {
		position: relative;
		z-index: 1;
	}
</style>
