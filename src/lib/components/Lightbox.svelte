<script lang="ts">
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { LightboxItem } from '$lib/types';
	import { cx } from '$lib/utils';
	import LightboxOverlay from './LightboxOverlay.svelte';

	interface Props {
		/** Media entries. For a single image the src/alt sugar props suffice. */
		items?: LightboxItem[];
		/** Single-image sugar: full-size image shown in the viewer. */
		src?: string;
		alt?: string;
		/** Thumbnail for the inline trigger (defaults to src). */
		thumbSrc?: string;
		/** Caption rendered under the enlarged image. */
		caption?: string;
		open?: boolean;
		/** Accessible name of the dialog in multi-item mode. */
		dialogLabel?: string;
		/** Accessible name override for a single custom trigger (children). */
		triggerLabel?: string;
		closeLabel?: string;
		prevLabel?: string;
		nextLabel?: string;
		onclose?: (() => void) | undefined;
		/** Custom trigger content — replaces the thumbnail strip; opens item 0. */
		children?: Snippet;
		/**
		 * Per-item trigger face — replaces the default thumb/badge for each
		 * strip button. Ignored (with a DEV warning) when `children` is also
		 * provided. Mirrors Carousel's `slide` snippet.
		 */
		trigger?: Snippet<[LightboxItem, number]>;
		/** Merged after hz-lightbox-triggers (the inline element). */
		class?: string;
		[key: string]: unknown;
	}

	let {
		items,
		src,
		alt,
		thumbSrc,
		caption,
		open = $bindable(false),
		dialogLabel = 'Media viewer',
		triggerLabel,
		closeLabel = 'Close media viewer',
		prevLabel = 'Previous item',
		nextLabel = 'Next item',
		onclose,
		children,
		trigger,
		class: className,
		...rest
	}: Props = $props();

	if (import.meta.env.DEV) {
		if (untrack(() => !items?.length && !src)) {
			console.warn('[hyzer-ui] <Lightbox>: provide `items` or the single-image `src`/`alt` props.');
		}
		if (untrack(() => Boolean(children) && Boolean(trigger))) {
			console.warn(
				'[hyzer-ui] <Lightbox>: `trigger` is ignored when `children` is also provided — ' +
					'`children` replaces the whole strip with a single button.'
			);
		}
	}

	// Normalize the single-image sugar into the items shape.
	const resolved: LightboxItem[] = $derived(
		items?.length ? items : src ? [{ type: 'image', src, alt: alt ?? '', thumbSrc, caption }] : []
	);

	function nameOf(item: LightboxItem): string {
		return item.type === 'video' ? item.label : item.alt;
	}

	function thumbOf(item: LightboxItem): string | undefined {
		return item.thumbSrc ?? (item.type === 'video' ? item.poster : item.src);
	}

	let triggerEls: (HTMLButtonElement | null)[] = $state([]);

	// The overlay owns `index`/scroll-lock/focus-return timing; Lightbox
	// (the trigger owner) only decides which item to seed it at and which
	// trigger focus should return to — both captured at openAt() time, before
	// `open` flips true (LightboxGroup extraction).
	let startIndex = $state(0);
	let returnFocusTo: HTMLElement | null = $state(null);

	function openAt(i: number) {
		startIndex = i;
		returnFocusTo = triggerEls[i] ?? triggerEls[0] ?? null;
		open = true;
	}
</script>

<!--
	The trigger strip is the inline element: class/rest land on it. Each
	thumbnail is a real button opening the viewer at its item. The overlay is
	always rendered (never conditionally mounted) and driven by showModal().
-->
{#if children}
	<button
		{...rest}
		bind:this={triggerEls[0]}
		type="button"
		class={cx('hz-lightbox-trigger', className)}
		aria-haspopup="dialog"
		aria-label={triggerLabel ?? (resolved[0] ? `View larger: ${nameOf(resolved[0])}` : undefined)}
		onclick={() => openAt(0)}
	>
		{@render children()}
	</button>
{:else}
	<div {...rest} class={cx('hz-lightbox-triggers', className)}>
		{#each resolved as item, i (i)}
			<button
				bind:this={triggerEls[i]}
				type="button"
				class="hz-lightbox-trigger"
				aria-haspopup="dialog"
				aria-label={resolved.length === 1 && triggerLabel
					? triggerLabel
					: `View larger: ${nameOf(item)}`}
				onclick={() => openAt(i)}
			>
				{#if trigger}
					{@render trigger(item, i)}
				{:else if thumbOf(item)}
					<img class="hz-lightbox-thumb" src={thumbOf(item)} alt={nameOf(item)} loading="lazy" />
				{:else}
					<span class="hz-lightbox-thumb-label">{nameOf(item)}</span>
				{/if}
				{#if !trigger && item.type === 'video'}
					<span class="hz-lightbox-badge" aria-hidden="true">▶</span>
				{/if}
			</button>
		{/each}
	</div>
{/if}

<LightboxOverlay
	items={resolved}
	bind:open
	{startIndex}
	{dialogLabel}
	{closeLabel}
	{prevLabel}
	{nextLabel}
	{returnFocusTo}
	{onclose}
/>

<style>
	/* Trigger strip: thumbnails flow like a cluster. */
	.hz-lightbox-triggers {
		display: flex;
		flex-wrap: wrap;
		gap: var(--hz-space-xs, 0.5rem);
	}

	/* Trigger: a bare button so the thumbnail IS the control. */
	.hz-lightbox-trigger {
		display: block;
		position: relative;
		padding: 0;
		border: none;
		background: none;
		cursor: zoom-in;
	}

	.hz-lightbox-thumb {
		display: block;
		max-width: 100%;
	}

	.hz-lightbox-badge {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}
</style>
