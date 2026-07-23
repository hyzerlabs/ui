<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Intent } from '$lib/types';
	import { cx } from '$lib/utils';
	import IconX from '$lib/icons/generated/x.svelte';

	type BannerIntent = Intent;
	type BannerPin = 'top' | 'bottom';

	interface Props {
		children: Snippet;
		intent?: BannerIntent;
		/** Sticks the bar to that edge, in flow (position: sticky). Static
		 * (no pin) by default. */
		pin?: BannerPin;
		/** Decorative leading icon; the text carries the meaning. */
		icon?: Snippet;
		/** Trailing slot for a Link/Button, e.g. "Learn more". */
		actions?: Snippet;
		/** Renders the dismiss button. Visibility is the consumer's state —
		 * the Banner never hides itself. */
		onDismiss?: (() => void) | undefined;
		dismissLabel?: string;
		as?: string;
		class?: string;
		[key: string]: unknown;
	}

	let {
		children,
		intent = 'neutral',
		pin,
		icon,
		actions,
		onDismiss,
		dismissLabel = 'Dismiss',
		as = 'div',
		class: className,
		...rest
	}: Props = $props();
</script>

<!--
	Banner-R1: full-width solid bar — optional decorative icon, content,
	optional trailing actions, optional dismiss button.
	Banner-R4: NO role and no live-region attributes by default — a live role
	only announces dynamically inserted content; consumers pass role="status"
	or role="alert" via rest when inserting a Banner after load.
	Banner-R7: rest spreads first so managed attrs (class, data-*) win.
-->
<svelte:element
	this={as}
	{...rest}
	class={cx('hz-banner', className)}
	data-intent={intent}
	data-pin={pin}
	data-dismissible={onDismiss ? '' : undefined}
>
	{#if icon}
		<span class="hz-banner-icon" aria-hidden="true">{@render icon()}</span>
	{/if}

	<div class="hz-banner-content">
		{@render children()}
	</div>

	{#if actions}
		<div class="hz-banner-actions">{@render actions()}</div>
	{/if}

	{#if onDismiss}
		<!-- Banner-R5: same contract as Badge/Alert — real labelled button, decorative icon. -->
		<button type="button" class="hz-banner-dismiss" aria-label={dismissLabel} onclick={onDismiss}>
			<IconX />
		</button>
	{/if}
</svelte:element>

<style>
	/* Banner-R8: structural only — full-width flex row; all colour is the theme's. */
	.hz-banner {
		display: flex;
		width: 100%;
		box-sizing: border-box;
		align-items: center;
		gap: var(--hz-space-xs, 0.5rem);
	}

	.hz-banner-content {
		flex: 1;
		min-width: 0;
	}

	.hz-banner-icon {
		display: inline-flex;
		flex-shrink: 0;
	}

	.hz-banner-actions {
		display: inline-flex;
		flex-shrink: 0;
	}

	.hz-banner-dismiss {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		cursor: pointer;
	}

	/* Banner-R3: pinning is structural, per Header — position: sticky and the
	 * z-index live in the component, not the theme. The pin z-index is the
	 * shared sticky tier (Banner-R13) — Header's own sticky bar uses the same
	 * token, so a pinned Header and a pinned Banner never fight. */
	.hz-banner[data-pin] {
		position: sticky;
		z-index: var(--hz-z-sticky, 100);
	}

	.hz-banner[data-pin='top'] {
		top: 0;
	}

	.hz-banner[data-pin='bottom'] {
		bottom: 0;
	}
</style>
