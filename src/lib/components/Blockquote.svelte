<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from '$lib/utils';

	interface Props {
		children: Snippet;
		cite?: string | Snippet;
		citeUrl?: string;
		/** Attribution-row alignment under the quote (logical values, per Hero). */
		align?: 'start' | 'center' | 'end';
		class?: string;
		[key: string]: unknown;
	}

	let { children, cite, citeUrl, align = 'start', class: className, ...rest }: Props = $props();
</script>

<!--
	Blockquote-R1: figure is always the single root — quote inside <blockquote>,
	attribution (when present) outside it in a <figcaption><cite>.
	Blockquote-R5: rest spread first so managed attrs (class) win; rest never
	reaches the inner <blockquote> — its cite attribute is component-managed.
-->
<!-- Blockquote-R4b: data-align always present; the THEME aligns the
     attribution row on it — the quote body is deliberately untouched. -->
<figure {...rest} class={cx('hz-blockquote', className)} data-align={align}>
	<blockquote class="hz-blockquote-quote" cite={citeUrl}>
		{@render children()}
	</blockquote>

	{#if cite}
		<figcaption class="hz-blockquote-attribution">
			<cite class="hz-blockquote-cite">
				{#if typeof cite === 'string'}{cite}{:else}{@render cite()}{/if}
			</cite>
		</figcaption>
	{/if}
</figure>

<style>
	/* Blockquote-R7: structural resets only — browsers give figure and
	 * blockquote large default margins that fight the theme's chrome. */
	.hz-blockquote {
		margin: 0;
	}

	.hz-blockquote-quote {
		margin: 0;
	}
</style>
