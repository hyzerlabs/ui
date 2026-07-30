<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { BadgeIntent, BadgeVariant, BadgeSize, Rounded } from '$lib/types';
	import { cx } from '$lib/utils';
	import IconX from '$lib/icons/generated/x.svelte';

	interface Props {
		children: Snippet;
		intent?: BadgeIntent;
		variant?: BadgeVariant;
		size?: BadgeSize;
		rounded?: Rounded;
		/** Renders a trailing remove button (the chip form). In lists, pass a
		 * per-item dismissLabel — the default 'Remove' is ambiguous. */
		onDismiss?: (() => void) | undefined;
		dismissLabel?: string;
		class?: string;
		[key: string]: unknown;
	}

	let {
		children,
		intent = 'neutral',
		variant = 'soft',
		size = 'md',
		rounded = 'full',
		onDismiss,
		dismissLabel = 'Remove',
		class: className,
		...rest
	}: Props = $props();
</script>

<!--
	inline span, no implicit role — a badge is flowing text; the
	content carries the meaning, intent color only reinforces it.
	data hooks always present so theme/consumer CSS can target
	every combination. rest spread first so managed attrs win.
-->
<span
	{...rest}
	class={cx('hz-badge', className)}
	data-intent={intent}
	data-variant={variant}
	data-size={size}
	data-rounded={rounded}
	data-dismissible={onDismiss ? '' : undefined}
>
	{@render children()}

	{#if onDismiss}
		<!-- the chip form — a real labeled button, decorative icon. -->
		<button type="button" class="hz-badge-dismiss" aria-label={dismissLabel} onclick={onDismiss}>
			<IconX />
		</button>
	{/if}
</span>

<style>
	/* structural only — inline chip row; all chrome is the theme's. */
	.hz-badge {
		display: inline-flex;
		align-items: center;
		/* Half the xs token — no smaller step exists on the space scale. */
		gap: calc(var(--hz-space-xs, 0.5rem) / 2);
	}

	.hz-badge-dismiss {
		display: inline-flex;
		align-items: center;
		cursor: pointer;
	}
</style>
