<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutAlign, LayoutPadding } from '$lib/types';
	import { cx } from '$lib/utils';

	type GridColumns =
		| number
		| { sm?: number; md?: number; lg?: number; xl?: number }
		| { min: string };
	type GridGap = 'none' | 'sm' | 'md' | 'lg' | 'near' | 'away';

	interface Props {
		columns?: GridColumns;
		gap?: GridGap;
		align?: LayoutAlign;
		padding?: LayoutPadding;
		as?: string;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	}

	let {
		columns = { sm: 1, md: 2, lg: 3 },
		gap = 'md',
		align = 'stretch',
		padding = 'none',
		as = 'div',
		class: className,
		children,
		...rest
	}: Props = $props();

	/** Fluid mode: as many tracks as fit at least `min` wide — no breakpoints. */
	const fluid = $derived(typeof columns === 'object' && 'min' in columns);

	/**
	 * Build the inline style string that carries the --hz-grid-* custom
	 * properties consumed by the shipped responsive CSS.
	 *
	 * - number     → single `--hz-grid-cols: N` (same column count at every width)
	 * - { min }    → `--hz-grid-min` for the fluid auto-fit template
	 * - band object → per-key `--hz-grid-cols-{sm,md,lg,xl}: N` for each present key
	 * - empty object → no properties (cascade falls back to 1 at every width)
	 */
	const gridStyle = $derived(
		typeof columns === 'number'
			? `--hz-grid-cols: ${columns}`
			: 'min' in columns
				? `--hz-grid-min: ${columns.min}`
				: (
						[
							columns.sm !== undefined ? `--hz-grid-cols-sm: ${columns.sm}` : null,
							columns.md !== undefined ? `--hz-grid-cols-md: ${columns.md}` : null,
							columns.lg !== undefined ? `--hz-grid-cols-lg: ${columns.lg}` : null,
							columns.xl !== undefined ? `--hz-grid-cols-xl: ${columns.xl}` : null
						].filter(Boolean) as string[]
					).join('; ')
	);
</script>

<!--
	{...rest} is spread first so that every subsequently-listed attribute
	(class, data-gap, data-align, data-padding, style) wins over any
	conflicting key a consumer accidentally passes through rest.
-->
<svelte:element
	this={as}
	{...rest}
	class={cx('hz-grid', className)}
	data-gap={gap}
	data-align={align}
	data-padding={padding}
	data-fluid={fluid ? '' : undefined}
	style={gridStyle || undefined}
>
	<div class="hz-grid-layout">
		{@render children?.()}
	</div>
</svelte:element>

<style>
	/*
	 * The root is a size container so the column breakpoints respond to the
	 * grid's own available width (container queries), not the viewport. An
	 * element cannot container-query itself, so the inner .hz-grid-layout
	 * does the actual grid layout.
	 *
	 * Band keys name the band that ENDS at their width token: sm counts
	 * apply below --hz-width-sm (640px), md until --hz-width-md (968px),
	 * lg until --hz-width-lg (1200px), xl beyond. Thresholds stay literal —
	 * CSS cannot read custom properties in container queries.
	 */
	.hz-grid {
		display: block;
		container-type: inline-size;
	}

	.hz-grid-layout {
		display: grid;
		/* below --hz-width-sm: sm → flat → 1 */
		grid-template-columns: repeat(var(--hz-grid-cols-sm, var(--hz-grid-cols, 1)), minmax(0, 1fr));
	}

	/* container ≥ --hz-width-sm: md → sm → flat → 1 */
	@container (min-width: 640px) {
		.hz-grid-layout {
			grid-template-columns: repeat(
				var(--hz-grid-cols-md, var(--hz-grid-cols-sm, var(--hz-grid-cols, 1))),
				minmax(0, 1fr)
			);
		}
	}

	/* container ≥ --hz-width-md: lg → md → sm → flat → 1 */
	@container (min-width: 968px) {
		.hz-grid-layout {
			grid-template-columns: repeat(
				var(
					--hz-grid-cols-lg,
					var(--hz-grid-cols-md, var(--hz-grid-cols-sm, var(--hz-grid-cols, 1)))
				),
				minmax(0, 1fr)
			);
		}
	}

	/* container ≥ --hz-width-lg: xl → lg → md → sm → flat → 1 */
	@container (min-width: 1200px) {
		.hz-grid-layout {
			grid-template-columns: repeat(
				var(
					--hz-grid-cols-xl,
					var(
						--hz-grid-cols-lg,
						var(--hz-grid-cols-md, var(--hz-grid-cols-sm, var(--hz-grid-cols, 1)))
					)
				),
				minmax(0, 1fr)
			);
		}
	}

	/*
	 * Fluid mode — columns={{ min }}: as many equal tracks as fit at least
	 * `min` wide (auto-fit, so a short last row stretches). No breakpoints,
	 * and `min` accepts any length expression including var(), so this mode
	 * is fully token/override-driven — unlike the band thresholds above,
	 * which are fixed system constants (CSS cannot read custom properties in
	 * container queries). Higher specificity than the band rules, so it wins
	 * at every width.
	 */
	.hz-grid[data-fluid] > .hz-grid-layout {
		grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--hz-grid-min, 16rem)), 1fr));
	}

	/* padding (both axes) per spacing scale — on the root, so the container
	 * queries measure the space actually available to the tracks.
	 * near/away are density-shift aware. */
	.hz-grid[data-padding='none'] {
		padding: 0;
	}
	.hz-grid[data-padding='sm'] {
		padding: var(--hz-space-sm, 1rem);
	}
	.hz-grid[data-padding='md'] {
		padding: var(--hz-space-md, 2rem);
	}
	.hz-grid[data-padding='lg'] {
		padding: var(--hz-space-lg, 4rem);
	}
	.hz-grid[data-padding='near'] {
		padding: var(--hz-space-near, 4rem);
	}
	.hz-grid[data-padding='away'] {
		padding: var(--hz-space-away, 8rem);
	}

	/* gap per spacing scale */
	.hz-grid[data-gap='none'] > .hz-grid-layout {
		gap: 0;
	}
	.hz-grid[data-gap='sm'] > .hz-grid-layout {
		gap: var(--hz-space-sm, 1rem);
	}
	.hz-grid[data-gap='md'] > .hz-grid-layout {
		gap: var(--hz-space-md, 2rem);
	}
	.hz-grid[data-gap='lg'] > .hz-grid-layout {
		gap: var(--hz-space-lg, 4rem);
	}

	/* density distances — shift-aware vars from the tokens.css density block */
	.hz-grid[data-gap='near'] > .hz-grid-layout {
		gap: var(--hz-space-near, 4rem);
	}
	.hz-grid[data-gap='away'] > .hz-grid-layout {
		gap: var(--hz-space-away, 8rem);
	}

	/* align-items per data-align */
	.hz-grid[data-align='start'] > .hz-grid-layout {
		align-items: flex-start;
	}
	.hz-grid[data-align='center'] > .hz-grid-layout {
		align-items: center;
	}
	.hz-grid[data-align='end'] > .hz-grid-layout {
		align-items: flex-end;
	}
	.hz-grid[data-align='stretch'] > .hz-grid-layout {
		align-items: stretch;
	}
	.hz-grid[data-align='baseline'] > .hz-grid-layout {
		align-items: baseline;
	}
</style>
