<script lang="ts">
	import { cx } from '$lib/utils';
	import IconChevronLeft from '$lib/icons/generated/chevron-left.svelte';
	import IconChevronRight from '$lib/icons/generated/chevron-right.svelte';
	import Button from './Button.svelte';

	interface Props {
		count: number;
		page?: number;
		siblings?: number;
		boundaries?: number;
		/** Link mode: pages render as <a href={href(n)}>; the consumer drives
		 * `page` from the URL. Omit for button mode (bindable page). */
		href?: (page: number) => string;
		onchange?: ((page: number) => void) | undefined;
		ariaLabel?: string;
		prevLabel?: string;
		nextLabel?: string;
		pageLabel?: (page: number) => string;
		class?: string;
		[key: string]: unknown;
	}

	let {
		count,
		page = $bindable(1),
		siblings = 1,
		boundaries = 1,
		href,
		onchange,
		ariaLabel = 'Pagination',
		prevLabel = 'Previous page',
		nextLabel = 'Next page',
		pageLabel = (n) => `Page ${n}`,
		class: className,
		...rest
	}: Props = $props();

	function range(lo: number, hi: number): number[] {
		if (hi < lo) return [];
		return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
	}

	// boundaries at the ends, a constant-size sibling window
	// clamped inward at the edges, gaps elided only when they span 2+ pages.
	const items = $derived.by((): (number | 'ellipsis')[] => {
		if (count <= 0) return [];
		if (count <= 2 * boundaries + 2 * siblings + 3) return range(1, count);

		const current = Math.min(count, Math.max(1, page));
		const windowLo = Math.max(
			boundaries + 2,
			Math.min(current - siblings, count - boundaries - 2 * siblings - 1)
		);
		const windowHi = windowLo + 2 * siblings;

		const out: (number | 'ellipsis')[] = [...range(1, boundaries)];
		if (windowLo === boundaries + 2) out.push(boundaries + 1);
		else out.push('ellipsis');
		out.push(...range(windowLo, windowHi));
		if (windowHi === count - boundaries - 1) out.push(count - boundaries);
		else out.push('ellipsis');
		out.push(...range(count - boundaries + 1, count));
		return out;
	});

	// button-mode stepper — clamped, no-op on the current page.
	function go(next: number) {
		const target = Math.min(count, Math.max(1, next));
		if (target !== page) {
			page = target;
			onchange?.(target);
		}
	}
</script>

<!--
	a named nav landmark over one list — prev, windowed pages
	with aria-hidden ellipses, next. Every control COMPOSES Button
: chevrons are icon-only neutral ghost Buttons (borderless,
	matching the page-number buttons' own ghost look), pages are neutral ghost
	Buttons with the current one solid primary. Button owns the link/button
	duality and the disabled contract (aria-disabled + swallowed clicks; in
	link mode a disabled control renders without an href).
-->
<nav {...rest} class={cx('hz-pagination', className)} aria-label={ariaLabel}>
	<ul class="hz-pagination-list">
		<li>
			<Button
				variant="ghost"
				intent="neutral"
				size="sm"
				class="hz-pagination-prev"
				ariaLabel={prevLabel}
				disabled={page <= 1}
				href={href && page > 1 ? href(page - 1) : undefined}
				onclick={() => (href ? onchange?.(page - 1) : go(page - 1))}
			>
				{#snippet iconStart()}<IconChevronLeft />{/snippet}
			</Button>
		</li>

		{#each items as item, i (i)}
			<li>
				{#if item === 'ellipsis'}
					<span class="hz-pagination-ellipsis" aria-hidden="true">…</span>
				{:else}
					<Button
						variant={item === page ? 'solid' : 'ghost'}
						intent={item === page ? 'primary' : 'neutral'}
						size="sm"
						class="hz-pagination-page"
						ariaLabel={pageLabel(item)}
						href={href ? href(item) : undefined}
						aria-current={item === page ? 'page' : undefined}
						data-current={item === page ? '' : undefined}
						onclick={() => {
							if (href) {
								if (item !== page) onchange?.(item);
							} else {
								go(item);
							}
						}}
					>
						{item}
					</Button>
				{/if}
			</li>
		{/each}

		<li>
			<Button
				variant="ghost"
				intent="neutral"
				size="sm"
				class="hz-pagination-next"
				ariaLabel={nextLabel}
				disabled={page >= count}
				href={href && page < count ? href(page + 1) : undefined}
				onclick={() => (href ? onchange?.(page + 1) : go(page + 1))}
			>
				{#snippet iconStart()}<IconChevronRight />{/snippet}
			</Button>
		</li>
	</ul>
</nav>

<style>
	/* structural row only — all chrome is the theme's. */
	.hz-pagination-list {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		gap: calc(var(--hz-space-xs, 0.5rem) / 2);
		list-style: none;
		margin: 0;
		padding: 0;
	}
</style>
