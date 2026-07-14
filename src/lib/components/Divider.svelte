<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutPadding } from '$lib/types';
	import { cx } from '$lib/utils';

	type DividerVariant = 'solid' | 'dashed' | 'dotted';
	type DividerLineWidth = 'thin' | 'thick';

	interface Props {
		children?: Snippet;
		variant?: DividerVariant;
		/** Full shared scale incl. the near/away density distances (Divider-R3). */
		spacing?: LayoutPadding;
		/** Maps 1:1 to --hz-border-width-thin/-thick (Divider-R3). */
		lineWidth?: DividerLineWidth;
		class?: string;
		[key: string]: unknown;
	}

	let {
		children,
		variant = 'solid',
		spacing = 'md',
		lineWidth = 'thin',
		class: className,
		...rest
	}: Props = $props();
</script>

<!--
	Divider-R1/R2: root differs by mode — bare <hr> (no children) can't hold
	text, so a labelled divider is a role="separator" div whose only child in
	the a11y tree is the label (the flanking rules are ::before/::after).
	Divider-R5: rest spread first so managed attrs (class, data-*, role,
	aria-orientation) win.
-->
{#if children}
	<div
		{...rest}
		class={cx('hz-divider', className)}
		role="separator"
		aria-orientation="horizontal"
		data-variant={variant}
		data-spacing={spacing}
		data-line-width={lineWidth}
		data-labeled
	>
		<span class="hz-divider-label">{@render children()}</span>
	</div>
{:else}
	<hr
		{...rest}
		class={cx('hz-divider', className)}
		data-variant={variant}
		data-spacing={spacing}
		data-line-width={lineWidth}
	/>
{/if}

<style>
	/* Divider-R7: structural only — geometry, no chrome color/weight.
	 * Deliberately NO rule for the bare <hr>: a scoped (unlayered) border/
	 * margin reset would beat the @layer hz-theme line and spacing rules
	 * (unlayered author styles win over all layered ones), leaving the hr
	 * invisible. The hr's default-border reset lives in theme/divider.css,
	 * next to the rule that redraws it; unthemed consumers get a native hr. */
	div.hz-divider {
		display: flex;
		align-items: center;
		gap: var(--hz-space-xs, 0.5rem);
	}

	div.hz-divider::before,
	div.hz-divider::after {
		content: '';
		flex: 1 1 auto;
	}

	.hz-divider-label {
		min-width: 0;
	}
</style>
