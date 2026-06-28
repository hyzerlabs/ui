<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx, uid } from '$lib/utils';
	import Split from './Split.svelte';

	type HeroLayout = 'center' | 'split' | 'overlay';
	type HeroHeight = 'auto' | 'screen' | 'half';
	type HeroAlign = 'start' | 'center' | 'end';
	type HeroHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

	interface Props {
		layout?: HeroLayout;
		height?: HeroHeight;
		align?: HeroAlign;
		reverseOnMobile?: boolean;
		headingLevel?: HeroHeadingLevel;
		ariaLabel?: string;
		eyebrow?: Snippet;
		title?: Snippet;
		subtitle?: Snippet;
		actions?: Snippet;
		media?: Snippet;
		background?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		layout = 'center',
		height = 'auto',
		align = 'center',
		reverseOnMobile = false,
		headingLevel = 1,
		ariaLabel,
		eyebrow,
		title,
		subtitle,
		actions,
		media,
		background,
		class: className,
		...rest
	}: Props = $props();

	// Stable title id per instance (counter-based, SSR-safe; mirrors Nav.svelte).
	const titleId = uid('hz-hero-title');

	// Hero-R2: hz-hero-content renders when any of eyebrow/title/subtitle/actions is present.
	const hasContent = $derived(!!(eyebrow || title || subtitle || actions));
</script>

<!--
	Hero-R1: root <section class="hz-hero"> with data-* attributes.
	Hero-R15: {...rest} spread first so managed attrs (class, data-*, aria-*) win.
	Hero-R7: aria-labelledby when title provided; aria-label when no title but ariaLabel set;
	         neither when both absent; aria-labelledby wins when both supplied.
-->
<section
	{...rest}
	class={cx('hz-hero', className)}
	data-layout={layout}
	data-height={height}
	data-align={align}
	data-reverse-on-mobile={reverseOnMobile ? '' : undefined}
	aria-labelledby={title ? titleId : undefined}
	aria-label={!title && ariaLabel ? ariaLabel : undefined}
>
	{#if background}
		<!-- Hero-R4: background div is the first child of the root. -->
		<div class="hz-hero-background">{@render background()}</div>
	{/if}

	{#if layout === 'split'}
		<!--
			Hero-R9: split layout composes the existing Split component.
			fraction="1/2" gives equal columns; stackBelow="md" collapses below 968px.
			Do NOT use Split's reverse prop — reverseOnMobile is handled by Hero's own
			scoped order rules (Hero-R10).
		-->
		<Split fraction="1/2" gap="lg" stackBelow="md">
			{#if hasContent}
				<div class="hz-hero-content">
					{#if eyebrow}<div class="hz-hero-eyebrow">{@render eyebrow()}</div>{/if}
					{#if title}
						<svelte:element this={`h${headingLevel}`} class="hz-hero-title" id={titleId}>
							{@render title()}
						</svelte:element>
					{/if}
					{#if subtitle}<div class="hz-hero-subtitle">{@render subtitle()}</div>{/if}
					{#if actions}<div class="hz-hero-actions">{@render actions()}</div>{/if}
				</div>
			{/if}
			{#if media}
				<div class="hz-hero-media">{@render media()}</div>
			{/if}
		</Split>
	{:else}
		<!--
			Hero-R8 (center) / Hero-R12 (overlay): content then media as flex siblings
			in the root flex column. DOM order is fixed; CSS handles alignment and z-order.
		-->
		{#if hasContent}
			<div class="hz-hero-content">
				{#if eyebrow}<div class="hz-hero-eyebrow">{@render eyebrow()}</div>{/if}
				{#if title}
					<svelte:element this={`h${headingLevel}`} class="hz-hero-title" id={titleId}>
						{@render title()}
					</svelte:element>
				{/if}
				{#if subtitle}<div class="hz-hero-subtitle">{@render subtitle()}</div>{/if}
				{#if actions}<div class="hz-hero-actions">{@render actions()}</div>{/if}
			</div>
		{/if}
		{#if media}
			<div class="hz-hero-media">{@render media()}</div>
		{/if}
	{/if}
</section>

<style>
	/* ------------------------------------------------------------------ */
	/* Hero-R1/R8/R11: root — flex column, vertically centers, positioned  */
	/* for background overlay (R12) and content z-ordering.               */
	/* ------------------------------------------------------------------ */

	.hz-hero {
		display: flex;
		flex-direction: column;
		justify-content: center;
		position: relative;
	}

	/* ------------------------------------------------------------------ */
	/* Hero-R11: height → min-height with dvh progressive override.        */
	/* dvh avoids mobile browser-chrome clipping (100vh can be too tall).  */
	/* ------------------------------------------------------------------ */

	/* stylelint-disable-next-line unit-no-unknown */
	.hz-hero[data-height='half'] {
		min-height: 50vh;
		min-height: 50dvh; /* progressive override */
	}

	/* stylelint-disable-next-line unit-no-unknown */
	.hz-hero[data-height='screen'] {
		min-height: 100vh;
		min-height: 100dvh; /* progressive override */
	}

	/* ------------------------------------------------------------------ */
	/* Hero-R4/R12: background covers the section; content sits above it.  */
	/* Same positioning applies in all three layouts.                       */
	/* ------------------------------------------------------------------ */

	.hz-hero-background {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	/* Content and media sit above the background in all layouts. */
	.hz-hero-content {
		display: flex;
		flex-direction: column;
		position: relative;
		z-index: 1;
	}

	.hz-hero-media {
		position: relative;
		z-index: 1;
	}

	/* ------------------------------------------------------------------ */
	/* Hero-R8: center layout — align-items on root and content;           */
	/* text-align on content. Gap between content and media regions.        */
	/* ------------------------------------------------------------------ */

	.hz-hero[data-layout='center'] {
		gap: var(--hz-space-lg, 4rem);
	}

	.hz-hero[data-layout='center'][data-align='start'] {
		align-items: flex-start;
	}

	.hz-hero[data-layout='center'][data-align='center'] {
		align-items: center;
	}

	.hz-hero[data-layout='center'][data-align='end'] {
		align-items: flex-end;
	}

	.hz-hero[data-layout='center'][data-align='start'] .hz-hero-content {
		align-items: flex-start;
		text-align: start;
	}

	.hz-hero[data-layout='center'][data-align='center'] .hz-hero-content {
		align-items: center;
		text-align: center;
	}

	.hz-hero[data-layout='center'][data-align='end'] .hz-hero-content {
		align-items: flex-end;
		text-align: end;
	}

	/* ------------------------------------------------------------------ */
	/* Hero-R9: split layout — hz-split fills the root; align maps to      */
	/* vertical alignment of content vs media via align-items on hz-split. */
	/* ------------------------------------------------------------------ */

	.hz-hero[data-layout='split'] :global(.hz-split) {
		width: 100%;
		position: relative;
		z-index: 1;
	}

	.hz-hero[data-layout='split'][data-align='start'] :global(.hz-split) {
		align-items: flex-start;
	}

	.hz-hero[data-layout='split'][data-align='center'] :global(.hz-split) {
		align-items: center;
	}

	.hz-hero[data-layout='split'][data-align='end'] :global(.hz-split) {
		align-items: flex-end;
	}

	/* ------------------------------------------------------------------ */
	/* Hero-R10: reverseOnMobile — visual-only order swap below 968px.     */
	/* Only applies in split layout. DOM order is never changed (R5).       */
	/* At ≥968px the split is side-by-side so order has no visual effect.   */
	/* ------------------------------------------------------------------ */

	@media (max-width: 967px) {
		.hz-hero[data-layout='split'][data-reverse-on-mobile] :global(.hz-split > .hz-hero-content) {
			order: 2;
		}

		.hz-hero[data-layout='split'][data-reverse-on-mobile] :global(.hz-split > .hz-hero-media) {
			order: 1;
		}
	}
</style>
