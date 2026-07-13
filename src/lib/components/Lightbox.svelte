<script lang="ts">
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { LightboxItem } from '$lib/types';
	import { cx } from '$lib/utils';
	import Carousel from './Carousel.svelte';
	import Video from './Video.svelte';
	import IconX from '$lib/icons/IconX.svelte';

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
		class: className,
		...rest
	}: Props = $props();

	if (import.meta.env.DEV) {
		if (untrack(() => !items?.length && !src)) {
			console.warn('[hyzer-ui] <Lightbox>: provide `items` or the single-image `src`/`alt` props.');
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

	// Active viewer item — set by whichever thumbnail opened the dialog,
	// then driven by the carousel.
	let index = $state(0);

	let dialogEl: HTMLDialogElement | null = $state(null);
	let triggerEls: (HTMLButtonElement | null)[] = $state([]);

	const dataState = $derived(open ? 'open' : 'closed');
	const dialogName = $derived(resolved.length === 1 ? nameOf(resolved[0]) : dialogLabel);

	function openAt(i: number) {
		index = i;
		open = true;
	}

	// Per-instance scroll-lock state (mirrors Modal-R16).
	let prevBodyOverflow = '';
	let scrollLockActive = false;
	let openedFrom = 0;

	// Reconcile `open` with the DOM via showModal()/close(), mirroring Modal's
	// R8–R16 behavior: scroll lock, focus return to the opening trigger,
	// onclose once. showModal() natively focuses the close button.
	$effect(() => {
		if (!dialogEl) return;

		if (open) {
			if (!dialogEl.open) {
				openedFrom = index;
				prevBodyOverflow = document.body.style.overflow;
				document.body.style.overflow = 'hidden';
				scrollLockActive = true;
				dialogEl.showModal();
			}
		} else {
			if (dialogEl.open) {
				dialogEl.close();
				if (scrollLockActive) {
					document.body.style.overflow = prevBodyOverflow;
					scrollLockActive = false;
				}
				(triggerEls[openedFrom] ?? triggerEls[0])?.focus();
				onclose?.();
			}
		}

		return () => {
			if (scrollLockActive) {
				document.body.style.overflow = prevBodyOverflow;
				scrollLockActive = false;
			}
		};
	});

	// Escape fires the native cancel — reroute through the bindable `open`
	// so every dismissal path behaves identically. Esc always closes.
	function handleCancel(e: Event) {
		e.preventDefault();
		open = false;
	}

	// Clicking the backdrop (the dialog element itself) closes the viewer.
	function handleDialogClick(e: MouseEvent) {
		if (e.target === dialogEl) {
			open = false;
		}
	}

	// Arrow keys page the viewer from anywhere in the dialog (the carousel
	// handles them itself when focus is inside it — skip those).
	function handleDialogKeydown(e: KeyboardEvent) {
		if (e.defaultPrevented || resolved.length < 2) return;
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			index = (index - 1 + resolved.length) % resolved.length;
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			index = (index + 1) % resolved.length;
		}
	}
</script>

{#snippet media(item: LightboxItem)}
	<figure class="hz-lightbox-figure">
		{#if item.type === 'video'}
			<div class="hz-lightbox-video">
				<Video src={item.src} title={item.label} poster={item.poster} />
			</div>
		{:else}
			<img class="hz-lightbox-img" src={item.src} alt={item.alt} />
		{/if}
		{#if item.caption}<figcaption class="hz-lightbox-caption">{item.caption}</figcaption>{/if}
	</figure>
{/snippet}

<!--
	The trigger strip is the inline element: class/rest land on it. Each
	thumbnail is a real button opening the viewer at its item. The dialog is
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
				{#if thumbOf(item)}
					<img class="hz-lightbox-thumb" src={thumbOf(item)} alt={nameOf(item)} loading="lazy" />
				{:else}
					<span class="hz-lightbox-thumb-label">{nameOf(item)}</span>
				{/if}
				{#if item.type === 'video'}
					<span class="hz-lightbox-badge" aria-hidden="true">▶</span>
				{/if}
			</button>
		{/each}
	</div>
{/if}

<dialog
	bind:this={dialogEl}
	class="hz-lightbox"
	aria-modal="true"
	aria-label={dialogName}
	tabindex="-1"
	data-state={dataState}
	oncancel={handleCancel}
	onclick={handleDialogClick}
	onkeydown={handleDialogKeydown}
>
	<button class="hz-lightbox-close" aria-label={closeLabel} onclick={() => (open = false)}>
		<!-- No ariaLabel on the icon → decorative -->
		<IconX />
	</button>
	{#if resolved.length > 1}
		<Carousel
			items={resolved}
			bind:index
			loop
			ariaLabel={dialogLabel}
			{prevLabel}
			{nextLabel}
			slideLabel={(item, i) => `${nameOf(item)} (${i + 1} of ${resolved.length})`}
			class="hz-lightbox-carousel"
		>
			{#snippet slide(item)}
				{@render media(item)}
			{/snippet}
		</Carousel>
	{:else if resolved[0]}
		{@render media(resolved[0])}
	{/if}
</dialog>

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

	/* Dialog: centered in the top layer; sized by its media. */
	.hz-lightbox {
		padding: 0;
		margin: auto;
		/* Absolute positioning context for the close control. */
		position: fixed;
	}

	.hz-lightbox:not([open]) {
		display: none;
	}

	.hz-lightbox-figure {
		margin: 0;
	}

	.hz-lightbox-img {
		display: block;
		max-width: min(92vw, 100%);
		max-height: 80dvh;
		object-fit: contain;
	}

	/* Video slides: give the 16/9 player a real footprint. */
	.hz-lightbox-video {
		width: min(92vw, 64rem);
	}

	.hz-lightbox-close {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		z-index: 1;
	}
</style>
