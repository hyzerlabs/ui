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
		/** Plain string for the common case; a Snippet when inner markup is needed. */
		eyebrow?: string | Snippet;
		title?: string | Snippet;
		subtitle?: string | Snippet;
		actions?: Snippet;
		/** In center/split layouts renders beside/below content; in overlay it becomes the full-bleed background. */
		media?: Snippet;
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
		class: className,
		...rest
	}: Props = $props();

	// Stable title id per instance (counter-based, SSR-safe; mirrors Nav.svelte).
	const titleId = uid('hz-hero-title');

	// hz-hero-content renders when any of eyebrow/title/subtitle/actions is present.
	const hasContent = $derived(!!(eyebrow || title || subtitle || actions));
</script>

<!--
	root <section class="hz-hero"> with data-* attributes.
	{...rest} spread first so managed attrs (class, data-*, aria-*) win.
	aria-labelledby when title provided; aria-label when no title but ariaLabel set;
	         neither when both absent; aria-labelledby wins when both supplied.
-->
{#snippet heroContent()}
	<div class="hz-hero-content">
		{#if eyebrow}
			<div class="hz-hero-eyebrow">
				{#if typeof eyebrow === 'string'}{eyebrow}{:else}{@render eyebrow()}{/if}
			</div>
		{/if}
		{#if title}
			<svelte:element this={`h${headingLevel}`} class="hz-hero-title" id={titleId}>
				{#if typeof title === 'string'}{title}{:else}{@render title()}{/if}
			</svelte:element>
		{/if}
		{#if subtitle}
			<div class="hz-hero-subtitle">
				{#if typeof subtitle === 'string'}{subtitle}{:else}{@render subtitle()}{/if}
			</div>
		{/if}
		{#if actions}<div class="hz-hero-actions">{@render actions()}</div>{/if}
	</div>
{/snippet}

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
	{#if layout === 'overlay' && media}
		<!-- in overlay layout, media IS the background — first child of the root. -->
		<div class="hz-hero-background">{@render media()}</div>
	{/if}

	{#if layout === 'split'}
		<!--
			split layout composes the existing Split component.
			fraction="1/2" gives equal columns; stackBelow="md" collapses below
			--hz-width-md (968px default, var-driven) of the split's own width.
			Do NOT use Split's reverse prop — reverseOnMobile is handled by
			Hero's own wrap-reverse rule.
		-->
		<Split fraction="1/2" gap="lg" stackBelow="md">
			{#if hasContent}
				{@render heroContent()}
			{/if}
			{#if media}
				<div class="hz-hero-media">{@render media()}</div>
			{/if}
		</Split>
	{:else}
		<!--
			Center and overlay layouts: content in the root flex column;
			center-layout media renders after it. DOM order is fixed; CSS handles
			alignment and z-order.
		-->
		{#if hasContent}
			{@render heroContent()}
		{/if}
		{#if media && layout !== 'overlay'}
			<div class="hz-hero-media">{@render media()}</div>
		{/if}
	{/if}
</section>

<style>
	/* ------------------------------------------------------------------ */
	/* root — flex column, vertically centers, positioned  */
	/* for background overlay and content z-ordering.               */
	/* ------------------------------------------------------------------ */

	.hz-hero {
		display: flex;
		flex-direction: column;
		justify-content: center;
		position: relative;
	}

	/* ------------------------------------------------------------------ */
	/* height → min-height with dvh progressive override.        */
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
	/* background covers the section; content sits above it.  */
	/* Same positioning applies in all three layouts.                       */
	/* ------------------------------------------------------------------ */

	.hz-hero-background {
		position: absolute;
		inset: 0;
		z-index: var(--hz-z-base, 0);
	}

	/* Content and media sit above the background in all layouts. */
	.hz-hero-content {
		display: flex;
		flex-direction: column;
		position: relative;
		z-index: var(--hz-z-raised, 1);
	}

	.hz-hero-media {
		position: relative;
		z-index: var(--hz-z-raised, 1);
	}

	/* ------------------------------------------------------------------ */
	/* center layout — align-items on root and content;           */
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
	/* split layout — hz-split fills the root; align maps to      */
	/* vertical alignment of content vs media via align-items on the       */
	/* split's inner .hz-split-layout (the grid element).                  */
	/* ------------------------------------------------------------------ */

	.hz-hero[data-layout='split'] :global(.hz-split) {
		width: 100%;
		position: relative;
		z-index: var(--hz-z-raised, 1);
	}

	/* Split's gap="lg" sets both axes, but 4rem reads oversized vertically
	 * when the switcher stacks. row-gap only shows between wrapped lines, so
	 * this tightens the stacked spacing without touching the 4rem column gap. */
	.hz-hero[data-layout='split'] :global(.hz-split > .hz-split-layout) {
		row-gap: var(--hz-space-md, 2rem);
	}

	.hz-hero[data-layout='split'][data-align='start'] :global(.hz-split > .hz-split-layout) {
		align-items: flex-start;
	}

	.hz-hero[data-layout='split'][data-align='center'] :global(.hz-split > .hz-split-layout) {
		align-items: center;
	}

	.hz-hero[data-layout='split'][data-align='end'] :global(.hz-split > .hz-split-layout) {
		align-items: flex-end;
	}

	/* ------------------------------------------------------------------ */
	/* reverseOnMobile — media above content, but only while the  */
	/* split is stacked. wrap-reverse makes flex lines fill bottom-up: on   */
	/* one line (side by side) the inline order is unchanged, and when the  */
	/* switcher wraps, the second child (media) lands on the top line. No   */
	/* threshold to keep in sync, and DOM order is never changed.      */
	/* wrap-reverse inverts the cross axis, so the start/end align rules    */
	/* above are flipped back to keep their visual meaning side by side.    */
	/* ------------------------------------------------------------------ */

	.hz-hero[data-layout='split'][data-reverse-on-mobile] :global(.hz-split > .hz-split-layout) {
		flex-wrap: wrap-reverse;
	}

	.hz-hero[data-layout='split'][data-reverse-on-mobile][data-align='start']
		:global(.hz-split > .hz-split-layout) {
		align-items: flex-end;
	}

	.hz-hero[data-layout='split'][data-reverse-on-mobile][data-align='end']
		:global(.hz-split > .hz-split-layout) {
		align-items: flex-start;
	}
</style>
