<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutAlign, LayoutPadding } from '$lib/types';
	import { cx } from '$lib/utils';

	type ClusterGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'near' | 'away';
	type ClusterJustify = 'start' | 'center' | 'end' | 'between' | 'around';

	interface Props {
		gap?: ClusterGap;
		justify?: ClusterJustify;
		align?: LayoutAlign;
		wrap?: boolean;
		padding?: LayoutPadding;
		/** Per-axis override — wins over `padding` on the inline axis. */
		paddingInline?: LayoutPadding;
		/** Per-axis override — wins over `padding` on the block axis. */
		paddingBlock?: LayoutPadding;
		as?: string;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	}

	let {
		gap = 'sm',
		justify = 'start',
		align = 'center',
		wrap = true,
		padding = 'none',
		paddingInline,
		paddingBlock,
		as = 'div',
		class: className,
		children,
		...rest
	}: Props = $props();
</script>

<!--
	{...rest} is spread first so that every subsequently-listed attribute
	(class, data-gap, data-justify, data-align, data-wrap, data-padding*) wins
	over any conflicting key a consumer accidentally passes through rest.
-->
<svelte:element
	this={as}
	{...rest}
	class={cx('hz-cluster', className)}
	data-gap={gap}
	data-justify={justify}
	data-align={align}
	data-wrap={wrap ? '' : undefined}
	data-padding={padding}
	data-padding-inline={paddingInline}
	data-padding-block={paddingBlock}
>
	{@render children?.()}
</svelte:element>

<style>
	.hz-cluster {
		display: flex;
	}

	/* flex-wrap per data-wrap */
	.hz-cluster[data-wrap] {
		flex-wrap: wrap;
	}
	.hz-cluster:not([data-wrap]) {
		flex-wrap: nowrap;
	}

	/* gap per spacing scale */
	.hz-cluster[data-gap='none'] {
		gap: 0;
	}
	.hz-cluster[data-gap='xs'] {
		gap: var(--hz-space-xs, 0.5rem);
	}
	.hz-cluster[data-gap='sm'] {
		gap: var(--hz-space-sm, 1rem);
	}
	.hz-cluster[data-gap='md'] {
		gap: var(--hz-space-md, 2rem);
	}
	.hz-cluster[data-gap='lg'] {
		gap: var(--hz-space-lg, 4rem);
	}

	/* density distances — shift-aware vars from the tokens.css density block */
	.hz-cluster[data-gap='near'] {
		gap: var(--hz-space-near, 4rem);
	}
	.hz-cluster[data-gap='away'] {
		gap: var(--hz-space-away, 8rem);
	}

	/* padding (both axes) per spacing scale — near/away are density-shift aware */
	.hz-cluster[data-padding='none'] {
		padding: 0;
	}
	.hz-cluster[data-padding='sm'] {
		padding: var(--hz-space-sm, 1rem);
	}
	.hz-cluster[data-padding='md'] {
		padding: var(--hz-space-md, 2rem);
	}
	.hz-cluster[data-padding='lg'] {
		padding: var(--hz-space-lg, 4rem);
	}
	.hz-cluster[data-padding='near'] {
		padding: var(--hz-space-near, 4rem);
	}
	.hz-cluster[data-padding='away'] {
		padding: var(--hz-space-away, 8rem);
	}

	/* per-axis overrides — declared after the shorthand so the longhand wins */
	.hz-cluster[data-padding-inline='none'] {
		padding-inline: 0;
	}
	.hz-cluster[data-padding-inline='sm'] {
		padding-inline: var(--hz-space-sm, 1rem);
	}
	.hz-cluster[data-padding-inline='md'] {
		padding-inline: var(--hz-space-md, 2rem);
	}
	.hz-cluster[data-padding-inline='lg'] {
		padding-inline: var(--hz-space-lg, 4rem);
	}
	.hz-cluster[data-padding-inline='near'] {
		padding-inline: var(--hz-space-near, 4rem);
	}
	.hz-cluster[data-padding-inline='away'] {
		padding-inline: var(--hz-space-away, 8rem);
	}
	.hz-cluster[data-padding-block='none'] {
		padding-block: 0;
	}
	.hz-cluster[data-padding-block='sm'] {
		padding-block: var(--hz-space-sm, 1rem);
	}
	.hz-cluster[data-padding-block='md'] {
		padding-block: var(--hz-space-md, 2rem);
	}
	.hz-cluster[data-padding-block='lg'] {
		padding-block: var(--hz-space-lg, 4rem);
	}
	.hz-cluster[data-padding-block='near'] {
		padding-block: var(--hz-space-near, 4rem);
	}
	.hz-cluster[data-padding-block='away'] {
		padding-block: var(--hz-space-away, 8rem);
	}

	/* justify-content per data-justify */
	.hz-cluster[data-justify='start'] {
		justify-content: flex-start;
	}
	.hz-cluster[data-justify='center'] {
		justify-content: center;
	}
	.hz-cluster[data-justify='end'] {
		justify-content: flex-end;
	}
	.hz-cluster[data-justify='between'] {
		justify-content: space-between;
	}
	.hz-cluster[data-justify='around'] {
		justify-content: space-around;
	}

	/* align-items per data-align */
	.hz-cluster[data-align='start'] {
		align-items: flex-start;
	}
	.hz-cluster[data-align='center'] {
		align-items: center;
	}
	.hz-cluster[data-align='end'] {
		align-items: flex-end;
	}
	.hz-cluster[data-align='baseline'] {
		align-items: baseline;
	}
	.hz-cluster[data-align='stretch'] {
		align-items: stretch;
	}
</style>
