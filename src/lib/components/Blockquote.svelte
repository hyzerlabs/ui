<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from '$lib/utils';
	import type { Intent } from '$lib/types';

	interface Props {
		children: Snippet;
		cite?: string | Snippet;
		citeUrl?: string;
		/** Attribution-row alignment under the quote (logical values, per Hero). */
		align?: 'start' | 'center' | 'end';
		/** Colors only the accent line — border-inline-start. No default: absent
		 * renders exactly today's uncolored look. */
		intent?: Intent;
		/** Only meaningful when `intent` is set. 'line' (default) colors just
		 * the accent line — today's look. 'full' also colors the quote text
		 * with the intent; the attribution row stays muted either way. */
		intentScope?: 'line' | 'full';
		class?: string;
		[key: string]: unknown;
	}

	let {
		children,
		cite,
		citeUrl,
		align = 'start',
		intent,
		intentScope = 'line',
		class: className,
		...rest
	}: Props = $props();
</script>

<!--
	Blockquote-R1: figure is always the single root — quote inside <blockquote>,
	attribution (when present) outside it in a <figcaption><cite>.
	Blockquote-R5: rest spread first so managed attrs (class) win; rest never
	reaches the inner <blockquote> — its cite attribute is component-managed.
-->
<!-- Blockquote-R4b: data-align always present; the THEME aligns the
     attribution row on it — the quote body is deliberately untouched. -->
<!-- Blockquote-R9: data-intent present only when set — no intent leaves
     the accent bar exactly as it renders today. -->
<!-- Blockquote-R10: data-intent-scope present only when intent is set — it
     has no meaning without an intent to scope, so it mirrors data-intent's
     own presence rule rather than being always-stamped like data-align.
     Its value is always the resolved intentScope ('line' or 'full'), giving
     the theme a clean [data-intent-scope='full'] selector to key off. -->
<figure
	{...rest}
	class={cx('hz-blockquote', className)}
	data-align={align}
	data-intent={intent}
	data-intent-scope={intent ? intentScope : undefined}
>
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
