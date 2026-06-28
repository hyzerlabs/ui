<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from '$lib/utils';

	type GridColumns = number | { sm?: number; md?: number; lg?: number };
	type GridGap = 'none' | 'sm' | 'md' | 'lg';
	type GridAlign = 'start' | 'center' | 'end' | 'stretch';

	interface Props {
		columns?: GridColumns;
		gap?: GridGap;
		align?: GridAlign;
		as?: string;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	}

	let {
		columns = { sm: 1, md: 2, lg: 3 },
		gap = 'md',
		align = 'stretch',
		as = 'div',
		class: className,
		children,
		...rest
	}: Props = $props();

	/**
	 * Build the inline style string that carries the --hz-grid-cols* custom
	 * properties consumed by the shipped responsive CSS.
	 *
	 * - number  → single `--hz-grid-cols: N` (same column count at every breakpoint)
	 * - object  → per-key `--hz-grid-cols-{sm,md,lg}: N` for each present key
	 * - empty object → no properties (cascade falls back to 1 at every breakpoint)
	 */
	const gridStyle = $derived(
		typeof columns === 'number'
			? `--hz-grid-cols: ${columns}`
			: (
					[
						columns.sm !== undefined ? `--hz-grid-cols-sm: ${columns.sm}` : null,
						columns.md !== undefined ? `--hz-grid-cols-md: ${columns.md}` : null,
						columns.lg !== undefined ? `--hz-grid-cols-lg: ${columns.lg}` : null
					].filter(Boolean) as string[]
				).join('; ')
	);
</script>

<!--
	{...rest} is spread first so that every subsequently-listed attribute
	(class, data-gap, data-align, style) wins over any conflicting key a
	consumer accidentally passes through rest.
-->
<svelte:element
	this={as}
	{...rest}
	class={cx('hz-grid', className)}
	data-gap={gap}
	data-align={align}
	style={gridStyle || undefined}
>
	{@render children?.()}
</svelte:element>

<style>
	.hz-grid {
		display: grid;
		/* base (<968px): sm → flat → 1 */
		grid-template-columns: repeat(var(--hz-grid-cols-sm, var(--hz-grid-cols, 1)), minmax(0, 1fr));
	}

	/* tablet (≥968px): md → sm → flat → 1 */
	@media (min-width: 968px) {
		.hz-grid {
			grid-template-columns: repeat(
				var(--hz-grid-cols-md, var(--hz-grid-cols-sm, var(--hz-grid-cols, 1))),
				minmax(0, 1fr)
			);
		}
	}

	/* desktop (≥1200px): lg → md → sm → flat → 1 */
	@media (min-width: 1200px) {
		.hz-grid {
			grid-template-columns: repeat(
				var(
					--hz-grid-cols-lg,
					var(--hz-grid-cols-md, var(--hz-grid-cols-sm, var(--hz-grid-cols, 1)))
				),
				minmax(0, 1fr)
			);
		}
	}

	/* gap per spacing scale */
	.hz-grid[data-gap='none'] {
		gap: 0;
	}
	.hz-grid[data-gap='sm'] {
		gap: var(--hz-space-sm, 1rem);
	}
	.hz-grid[data-gap='md'] {
		gap: var(--hz-space-md, 2rem);
	}
	.hz-grid[data-gap='lg'] {
		gap: var(--hz-space-lg, 4rem);
	}

	/* align-items per data-align */
	.hz-grid[data-align='start'] {
		align-items: flex-start;
	}
	.hz-grid[data-align='center'] {
		align-items: center;
	}
	.hz-grid[data-align='end'] {
		align-items: flex-end;
	}
	.hz-grid[data-align='stretch'] {
		align-items: stretch;
	}
</style>
