<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Intent, Rounded } from '$lib/types';
	import { cx, uid } from '$lib/utils';
	import IconX from '$lib/icons/IconX.svelte';

	type AlertIntent = 'neutral' | Intent;

	interface Props {
		children: Snippet;
		title?: string | Snippet;
		headingLevel?: 2 | 3 | 4 | 5 | 6;
		intent?: AlertIntent;
		rounded?: Rounded;
		/** Decorative leading icon; the text carries the meaning. */
		icon?: Snippet;
		/** Renders the dismiss button. Visibility is the consumer's state —
		 * the Alert never hides itself. */
		onDismiss?: (() => void) | undefined;
		dismissLabel?: string;
		class?: string;
		[key: string]: unknown;
	}

	let {
		children,
		title,
		headingLevel = 2,
		intent = 'neutral',
		rounded = 'md',
		icon,
		onDismiss,
		dismissLabel = 'Dismiss',
		class: className,
		...rest
	}: Props = $props();

	const titleId = `hz-alert-title-${uid('hz')}`;
</script>

<!--
	Alert-R1: flex banner — optional decorative icon, body (optional heading +
	content), optional dismiss button.
	Alert-R2: NO role and no live-region attributes by default — a live role
	only announces dynamically inserted content; consumers pass role="status"
	or role="alert" via rest when inserting after load.
	Alert-R4: rest spread first so managed attrs (class, data-*, and
	aria-labelledby when titled) win.
-->
<div
	{...rest}
	class={cx('hz-alert', className)}
	data-intent={intent}
	data-rounded={rounded}
	data-dismissible={onDismiss ? '' : undefined}
	aria-labelledby={title ? titleId : (rest['aria-labelledby'] as string | undefined)}
>
	{#if icon}
		<span class="hz-alert-icon" aria-hidden="true">{@render icon()}</span>
	{/if}

	<div class="hz-alert-body">
		{#if title}
			<svelte:element this={'h' + headingLevel} id={titleId} class="hz-alert-title">
				{#if typeof title === 'string'}{title}{:else}{@render title()}{/if}
			</svelte:element>
		{/if}

		<div class="hz-alert-content">
			{@render children()}
		</div>
	</div>

	{#if onDismiss}
		<!-- Alert-R3: same contract as Badge — real labelled button, decorative icon. -->
		<button type="button" class="hz-alert-dismiss" aria-label={dismissLabel} onclick={onDismiss}>
			<IconX />
		</button>
	{/if}
</div>

<style>
	/* Alert-R7: structural only — banner row; all chrome is the theme's. */
	.hz-alert {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: var(--hz-space-xs, 0.5rem);
	}

	.hz-alert-body {
		flex: 1;
		min-width: 0;
	}

	.hz-alert-title {
		margin: 0;
	}

	.hz-alert-icon {
		display: inline-flex;
		flex-shrink: 0;
	}

	.hz-alert-dismiss {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		cursor: pointer;
	}
</style>
