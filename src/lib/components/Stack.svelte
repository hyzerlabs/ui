<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutAlign, LayoutPadding } from '$lib/types';
	import { cx } from '$lib/utils';

	type StackGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'near' | 'away';

	interface Props {
		gap?: StackGap;
		align?: LayoutAlign;
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
		gap = 'md',
		align = 'stretch',
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
	(class, data-gap, data-align, data-padding*) wins over any conflicting key
	a consumer accidentally passes through rest.
-->
<svelte:element
	this={as}
	{...rest}
	class={cx('hz-stack', className)}
	data-gap={gap}
	data-align={align}
	data-padding={padding}
	data-padding-inline={paddingInline}
	data-padding-block={paddingBlock}
>
	{@render children?.()}
</svelte:element>

<style>
	.hz-stack {
		display: flex;
		flex-direction: column;
	}

	/* gap per spacing scale */
	.hz-stack[data-gap='none'] {
		gap: 0;
	}
	.hz-stack[data-gap='xs'] {
		gap: var(--hz-space-xs, 0.5rem);
	}
	.hz-stack[data-gap='sm'] {
		gap: var(--hz-space-sm, 1rem);
	}
	.hz-stack[data-gap='md'] {
		gap: var(--hz-space-md, 2rem);
	}
	.hz-stack[data-gap='lg'] {
		gap: var(--hz-space-lg, 4rem);
	}
	.hz-stack[data-gap='xl'] {
		gap: var(--hz-space-xl, 8rem);
	}

	/* density distances — shift-aware vars from the tokens.css density block */
	.hz-stack[data-gap='near'] {
		gap: var(--hz-space-near, 4rem);
	}
	.hz-stack[data-gap='away'] {
		gap: var(--hz-space-away, 8rem);
	}

	/* padding (both axes) per spacing scale — near/away are density-shift aware */
	.hz-stack[data-padding='none'] {
		padding: 0;
	}
	.hz-stack[data-padding='sm'] {
		padding: var(--hz-space-sm, 1rem);
	}
	.hz-stack[data-padding='md'] {
		padding: var(--hz-space-md, 2rem);
	}
	.hz-stack[data-padding='lg'] {
		padding: var(--hz-space-lg, 4rem);
	}
	.hz-stack[data-padding='near'] {
		padding: var(--hz-space-near, 4rem);
	}
	.hz-stack[data-padding='away'] {
		padding: var(--hz-space-away, 8rem);
	}

	/* per-axis overrides — declared after the shorthand so the longhand wins */
	.hz-stack[data-padding-inline='none'] {
		padding-inline: 0;
	}
	.hz-stack[data-padding-inline='sm'] {
		padding-inline: var(--hz-space-sm, 1rem);
	}
	.hz-stack[data-padding-inline='md'] {
		padding-inline: var(--hz-space-md, 2rem);
	}
	.hz-stack[data-padding-inline='lg'] {
		padding-inline: var(--hz-space-lg, 4rem);
	}
	.hz-stack[data-padding-inline='near'] {
		padding-inline: var(--hz-space-near, 4rem);
	}
	.hz-stack[data-padding-inline='away'] {
		padding-inline: var(--hz-space-away, 8rem);
	}
	.hz-stack[data-padding-block='none'] {
		padding-block: 0;
	}
	.hz-stack[data-padding-block='sm'] {
		padding-block: var(--hz-space-sm, 1rem);
	}
	.hz-stack[data-padding-block='md'] {
		padding-block: var(--hz-space-md, 2rem);
	}
	.hz-stack[data-padding-block='lg'] {
		padding-block: var(--hz-space-lg, 4rem);
	}
	.hz-stack[data-padding-block='near'] {
		padding-block: var(--hz-space-near, 4rem);
	}
	.hz-stack[data-padding-block='away'] {
		padding-block: var(--hz-space-away, 8rem);
	}

	/* align-items per data-align */
	.hz-stack[data-align='start'] {
		align-items: flex-start;
	}
	.hz-stack[data-align='center'] {
		align-items: center;
	}
	.hz-stack[data-align='end'] {
		align-items: flex-end;
	}
	.hz-stack[data-align='stretch'] {
		align-items: stretch;
	}
	.hz-stack[data-align='baseline'] {
		align-items: baseline;
	}
</style>
