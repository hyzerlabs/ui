<script lang="ts">
	import { untrack } from 'svelte';
	import { DEV } from 'esm-env';
	import type { ImageSource } from '$lib/types';
	import { cx } from '$lib/utils';

	type AspectRatio = 'auto' | '1/1' | '4/3' | '16/9' | '21/9' | string;
	type Fit = 'cover' | 'contain' | 'fill' | 'none';
	type Rounded = boolean | 'sm' | 'md' | 'lg' | 'full';
	type Placeholder = 'blur' | 'color' | 'none';
	type LoadState = 'loading' | 'loaded' | 'error';

	interface Props {
		src: string;
		alt: string;
		/**
		 * Renders a <picture> with these <source> candidates ahead of the img
		 * (art direction / format negotiation); `src` stays the fallback and
		 * still drives the load state.
		 */
		sources?: ImageSource[];
		width?: number;
		height?: number;
		loading?: 'lazy' | 'eager';
		aspectRatio?: AspectRatio;
		fit?: Fit;
		rounded?: Rounded;
		placeholder?: Placeholder;
		placeholderSrc?: string;
		placeholderColor?: string;
		class?: string;
		style?: string;
		[key: string]: unknown;
	}

	let {
		src,
		alt,
		sources,
		width,
		height,
		loading = 'lazy',
		aspectRatio = 'auto',
		fit = 'cover',
		rounded = false,
		placeholder = 'none',
		placeholderSrc,
		placeholderColor = 'var(--hz-color-border)',
		class: className,
		style: styleProp,
		...rest
	}: Props = $props();

	// blur without placeholderSrc → fall back to none + dev warn
	if (DEV) {
		if (untrack(() => placeholder === 'blur' && !placeholderSrc)) {
			console.warn(
				'[hyzer-ui] <Image>: placeholder="blur" requires a `placeholderSrc` prop. ' +
					'Falling back to placeholder="none".'
			);
		}
	}

	// Effective placeholder mode (blur without src → none)
	const effectivePlaceholder = $derived(
		placeholder === 'blur' && !placeholderSrc ? 'none' : placeholder
	);

	// load state machine
	let loadState: LoadState = $state('loading');

	// data-rounded: true → '' (present), string → verbatim, false → undefined
	const dataRounded = $derived(rounded === false ? undefined : rounded === true ? '' : rounded);

	// aspect-ratio inline style (non-auto only)
	const aspectRatioStyle = $derived(
		aspectRatio !== 'auto' ? `aspect-ratio: ${aspectRatio}` : undefined
	);

	// background-color while loading (color placeholder)
	const bgColorStyle = $derived(
		effectivePlaceholder === 'color' && loadState === 'loading'
			? `background-color: ${placeholderColor}`
			: undefined
	);

	// Combined wrapper inline style. Consumer `style` is appended last, so a
	// consumer declaration wins on any collision.
	const wrapperStyle = $derived(
		[aspectRatioStyle, bgColorStyle, styleProp].filter(Boolean).join('; ') || undefined
	);

	let imgEl: HTMLImageElement | undefined = $state(undefined);

	// check for cached/SSR images after mount
	$effect(() => {
		if (!imgEl) return;
		if (imgEl.complete) {
			if (imgEl.naturalWidth > 0) {
				loadState = 'loaded';
			} else {
				loadState = 'error';
			}
		}
	});

	function onLoad() {
		loadState = 'loaded';
	}

	function onError() {
		loadState = 'error';
	}
</script>

<!--
	{...rest} spread first on <img> so managed attributes win.
	wrapper div carries data-* attrs; <img> carries src/alt/loading/dimensions.
-->
<div
	class={cx('hz-image', className)}
	data-state={loadState}
	data-loading={loading}
	data-aspect-ratio={aspectRatio}
	data-fit={fit}
	data-rounded={dataRounded}
	data-placeholder={effectivePlaceholder !== 'none' ? effectivePlaceholder : undefined}
	data-picture={sources?.length ? '' : undefined}
	style={wrapperStyle}
>
	{#if effectivePlaceholder === 'blur' && placeholderSrc}
		<!-- decorative low-res placeholder, aria-hidden -->
		<img class="hz-image__placeholder" src={placeholderSrc} alt="" aria-hidden="true" />
	{/if}

	<!-- ...rest first so managed attrs win -->
	{#snippet theImg()}
		<img
			{...rest}
			class="hz-image__img"
			{src}
			{alt}
			{loading}
			{width}
			{height}
			role={alt === '' ? 'presentation' : undefined}
			bind:this={imgEl}
			onload={onLoad}
			onerror={onError}
		/>
	{/snippet}

	{#if sources?.length}
		<!-- Picture mode: sources in order, img as the fallback. Load events
		     fire on the img whichever source the browser picks. -->
		<picture class="hz-image__picture">
			{#each sources as source, i (i)}
				<source
					srcset={source.srcset}
					type={source.type}
					media={source.media}
					sizes={source.sizes}
				/>
			{/each}
			{@render theImg()}
		</picture>
	{:else}
		{@render theImg()}
	{/if}
</div>

<style>
	/* Structural: wrapper is a positioned block that fills its parent */
	.hz-image {
		display: block;
		width: 100%;
		position: relative;
	}

	/* Picture mode: the <picture> element contributes no box of its own, so
	 * the img fills the wrapper exactly as in the plain mode. */
	.hz-image__picture {
		display: contents;
	}

	/* img fills the aspect-ratio box */
	.hz-image__img {
		display: block;
		width: 100%;
		height: 100%;
	}

	/* object-fit via data-fit on the wrapper */
	.hz-image[data-fit='cover'] .hz-image__img {
		object-fit: cover;
	}
	.hz-image[data-fit='contain'] .hz-image__img {
		object-fit: contain;
	}
	.hz-image[data-fit='fill'] .hz-image__img {
		object-fit: fill;
	}
	.hz-image[data-fit='none'] .hz-image__img {
		object-fit: none;
	}

	/* blur placeholder absolutely fills the wrapper */
	.hz-image__placeholder {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(var(--hz-image-placeholder-blur, 20px));
		transform: scale(1.05); /* prevent blur edge bleed */
		transition: opacity var(--hz-image-fade-duration, 0.3s) ease;
	}

	/* main image starts transparent in blur mode, crossfades in */
	.hz-image[data-placeholder='blur'] .hz-image__img {
		position: relative;
		opacity: 0;
		transition: opacity var(--hz-image-fade-duration, 0.3s) ease;
	}

	.hz-image[data-placeholder='blur'][data-state='loaded'] .hz-image__img {
		opacity: 1;
	}

	/* placeholder fades out once loaded */
	.hz-image[data-placeholder='blur'][data-state='loaded'] .hz-image__placeholder {
		opacity: 0;
	}

	/* reduced-motion: zero transition duration */
	@media (prefers-reduced-motion: reduce) {
		.hz-image[data-placeholder='blur'] .hz-image__img {
			transition-duration: 0s;
		}
		.hz-image[data-placeholder='blur'] .hz-image__placeholder {
			transition-duration: 0s;
		}
	}
</style>
