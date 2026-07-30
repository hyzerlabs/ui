<script lang="ts">
	/**
	 * Internal, non-exported viewer — the accessible `<dialog>` shared by the
	 * `Lightbox` component and the `lightboxGroup` attachment
	 *. Same pattern as the internal `Field.svelte`
	 * scaffold: used by peers, never added to the barrel.
	 *
	 * Focus-return is the only seam: the overlay does not own the trigger
	 * elements, so `returnFocusTo` is passed in by the caller (captured at
	 * open time), falling back to whatever had focus when the overlay opened.
	 */
	import type { LightboxItem } from '$lib/types';
	import Carousel from './Carousel.svelte';
	import Video from './Video.svelte';
	import Image from './Image.svelte';
	import IconX from '$lib/icons/generated/x.svelte';

	interface Props {
		items: LightboxItem[];
		open?: boolean;
		/** Index the viewer seeds `index` to on each closed→open transition. */
		startIndex?: number;
		/** Accessible name of the dialog in multi-item mode. */
		dialogLabel?: string;
		closeLabel?: string;
		prevLabel?: string;
		nextLabel?: string;
		/** Element to focus on close; falls back to the element that had focus when the overlay opened. */
		returnFocusTo?: HTMLElement | null;
		onclose?: (() => void) | undefined;
	}

	let {
		items,
		open = $bindable(false),
		startIndex = 0,
		dialogLabel = 'Media viewer',
		closeLabel = 'Close media viewer',
		prevLabel = 'Previous item',
		nextLabel = 'Next item',
		returnFocusTo = null,
		onclose
	}: Props = $props();

	function nameOf(item: LightboxItem): string {
		return item.type === 'video' ? item.label : item.alt;
	}

	// Active viewer item — seeded from `startIndex` on open (see the $effect
	// below), then driven by the carousel.
	let index = $state(0);

	let dialogEl: HTMLDialogElement | null = $state(null);

	const dataState = $derived(open ? 'open' : 'closed');
	const dialogName = $derived(items.length === 1 ? nameOf(items[0]) : dialogLabel);

	// Per-instance scroll-lock state (mirrors Modal's).
	let prevBodyOverflow = '';
	let scrollLockActive = false;
	// Fallback focus target when the caller doesn't pass `returnFocusTo`:
	// whatever had focus at the moment the overlay opened.
	let openActiveElement: Element | null = null;

	// Reconcile `open` with the DOM via showModal()/close(), mirroring Modal's
	// R8–R16 behavior: scroll lock, focus return, onclose once. showModal()
	// natively focuses the close button.
	$effect(() => {
		if (!dialogEl) return;

		if (open) {
			if (!dialogEl.open) {
				index = startIndex;
				openActiveElement = document.activeElement;
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
				(returnFocusTo ?? (openActiveElement as HTMLElement | null))?.focus();
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
		if (e.defaultPrevented || items.length < 2) return;
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			index = (index - 1 + items.length) % items.length;
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			index = (index + 1) % items.length;
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
			<!--
				image items render through the library's own `Image`
				component instead of a raw <img> — a load-state affordance, an
				error state, and a free blur-up reveal keyed on the strip thumb.
				`fit="contain"` (never crop) + `loading="eager"` (this IS the
				dialog's primary content). Blur-up only when `thumbSrc` exists —
				`placeholder="none"` otherwise, so Image's blur-without-src DEV
				warning never trips.
			-->
			<Image
				class="hz-lightbox-img"
				src={item.src}
				alt={item.alt}
				fit="contain"
				loading="eager"
				placeholder={item.thumbSrc ? 'blur' : 'none'}
				placeholderSrc={item.thumbSrc}
			/>
		{/if}
		{#if item.caption}<figcaption class="hz-lightbox-caption">{item.caption}</figcaption>{/if}
	</figure>
{/snippet}

<dialog
	bind:this={dialogEl}
	class="hz-lightbox"
	aria-modal="true"
	aria-label={dialogName}
	tabindex="-1"
	data-state={dataState}
	data-gallery={items.length > 1 ? '' : undefined}
	oncancel={handleCancel}
	onclick={handleDialogClick}
	onkeydown={handleDialogKeydown}
>
	<button class="hz-lightbox-close" aria-label={closeLabel} onclick={() => (open = false)}>
		<!-- No ariaLabel on the icon → decorative -->
		<IconX />
	</button>
	{#if items.length > 1}
		<Carousel
			{items}
			bind:index
			loop
			ariaLabel={dialogLabel}
			{prevLabel}
			{nextLabel}
			slideLabel={(item, i) => `${nameOf(item)} (${i + 1} of ${items.length})`}
			class="hz-lightbox-carousel"
		>
			{#snippet slide(item)}
				{@render media(item)}
			{/snippet}
		</Carousel>
	{:else if items[0]}
		{@render media(items[0])}
	{/if}
</dialog>

<style>
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

	/* Multi-item gallery (spec 33): the Carousel lays its slides out in a
	 * sliding track, and `flex: 0 0 100%` slides need a definite width AND
	 * height to resolve against. The dialog is shrink-to-fit (it hugs a single
	 * image), which can't supply either — the track collapses to zero (or blows
	 * out to the sum of every slide, with a scrollbar). So a gallery gets a
	 * fixed stage, and a flex chain carries a definite height down to each slide
	 * so the media centres and is contained (no scrollbar). Single-item mode has
	 * no carousel — it renders the media directly and still hugs it. */
	.hz-lightbox[data-gallery] {
		width: min(96vw, 80rem);
		height: min(92dvh, 52rem);
		/* Belt-and-braces: the media below is contained, but clip anything
		 * marginal so the stage never grows a scrollbar. */
		overflow: hidden;
	}

	/* A definite-height flex chain from the stage down to each slide, so the
	 * media can fill its slide and `object-fit: contain` letterbox within it —
	 * intrinsic image sizing (which can overflow by a pixel or a lot) never
	 * gets a say. Single-item mode has no carousel and keeps hugging (below). */
	.hz-lightbox[data-gallery] :global(.hz-lightbox-carousel) {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
	}

	.hz-lightbox[data-gallery] :global(.hz-carousel-viewport) {
		flex: 1;
		min-height: 0;
	}

	.hz-lightbox[data-gallery] :global(.hz-carousel-track) {
		height: 100%;
	}

	.hz-lightbox[data-gallery] :global(.hz-carousel-slide) {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.hz-lightbox[data-gallery] :global(.hz-lightbox-figure) {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		min-height: 0;
		gap: 0.5rem;
	}

	/* Media fills the slide; the bitmap/video letterboxes inside via contain. */
	.hz-lightbox[data-gallery] :global(.hz-lightbox-img) {
		width: 100%;
		height: 100%;
		min-height: 0;
	}

	.hz-lightbox[data-gallery] :global(.hz-lightbox-img .hz-image__img) {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.hz-lightbox[data-gallery] :global(.hz-lightbox-video) {
		width: 100%;
		max-width: min(92vw, 64rem);
		max-height: 100%;
	}

	.hz-lightbox-figure {
		margin: 0;
	}

	/* `.hz-lightbox-img` now lands on Image's wrapper <div>
	 * (see "The .hz-lightbox-img hook decision" in), not
	 * a raw <img> — Image's own scoped CSS forces the wrapper to
	 * `width: 100%`, which would stretch it to the dialog's fit-content
	 * (shrink-wrapped) box instead of hugging the actual media. `width:
	 * fit-content` restores the shrink-wrap so the dialog still sizes to its
	 * image, same as before. Both rules cross the `Image` component boundary
	 * (:global) — their higher selector specificity here (vs. Image.svelte's
	 * own `.hz-image` / `.hz-image__img` rules) wins the cascade. */
	.hz-lightbox-figure :global(.hz-lightbox-img) {
		display: block;
		width: fit-content;
		max-width: min(92vw, 100%);
		max-height: 80dvh;
	}

	/* The bitmap does the real aspect-ratio-preserving, no-crop sizing —
	 * identical max-width/max-height envelope the pre-R15 raw <img> had, one
	 * level deeper. `width`/`height: auto` (overriding Image's own 100%/100%)
	 * lets the browser's replaced-element sizing algorithm reconcile both max
	 * constraints simultaneously, exactly as a plain capped <img> would. */
	.hz-lightbox-figure :global(.hz-lightbox-img .hz-image__img) {
		width: auto;
		height: auto;
		max-width: min(92vw, 100%);
		max-height: 80dvh;
	}

	/* Video slides: give the 16/9 player a real footprint. */
	.hz-lightbox-video {
		width: min(92vw, 64rem);
	}

	.hz-lightbox-close {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		z-index: var(--hz-z-raised, 1);
	}
</style>
