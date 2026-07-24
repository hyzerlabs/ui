<script lang="ts">
	import { Button } from '$lib';
	import { uid } from '$lib/utils';

	interface Props {
		code: string;
		/** Clamp tall listings behind a Show more / Show less toggle. */
		collapsible?: boolean;
		/** Rows of code shown while collapsed (only when it exceeds this). */
		collapsedLines?: number;
	}

	let { code, collapsible = false, collapsedLines = 16 }: Props = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		try {
			await navigator.clipboard.writeText(code);
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 2000);
		} catch {
			// Clipboard unavailable (permissions/insecure context) — button is a no-op.
		}
	}

	// Collapse only kicks in when the listing is actually longer than the clamp,
	// so short blocks never grow a pointless toggle.
	const lineCount = $derived(code.split('\n').length);
	const canCollapse = $derived(collapsible && lineCount > collapsedLines);
	let expanded = $state(false);
	const clipId = uid('hz-code');

	// The clamp height, in rem, sized from the code font (0.875rem × 1.5
	// line-height) plus the pre's top padding — enough for ~collapsedLines rows.
	const collapsedMaxRem = $derived(collapsedLines * 0.875 * 1.5 + 1);
</script>

<div class="code-block">
	<Button variant="outline" intent="neutral" size="sm" class="copy-btn" onclick={copy}>
		{copied ? 'Copied' : 'Copy'}
	</Button>
	<span class="sr-only" aria-live="polite">{copied ? 'Code copied to clipboard' : ''}</span>
	<div
		id={clipId}
		class="code-clip"
		class:collapsed={canCollapse && !expanded}
		style={canCollapse && !expanded ? `max-height: ${collapsedMaxRem}rem` : undefined}
	>
		<pre><code>{code}</code></pre>
	</div>
	{#if canCollapse}
		<Button
			variant="ghost"
			intent="neutral"
			size="sm"
			fullWidth
			class="expand-btn"
			aria-expanded={expanded}
			aria-controls={clipId}
			onclick={() => (expanded = !expanded)}
		>
			{expanded ? 'Show less' : `Show all ${lineCount} lines`}
		</Button>
	{/if}
</div>

<style>
	/* Standalone default: framed with the same tint the Example frame uses.
	 * Example.svelte strips the border/radius when embedding one. */
	.code-block {
		position: relative;
		background-color: var(
			--hz-color-surface-muted,
			color-mix(in srgb, var(--hz-intent-neutral, #6b7280) 6%, var(--hz-color-surface, #fff))
		);
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
	}

	/* When collapsed, clip vertically and fade the cut-off edge into the
	 * surface so it reads as "there's more below". Horizontal scroll still
	 * lives on the <pre> inside. */
	.code-clip.collapsed {
		position: relative;
		overflow: hidden;
	}

	.code-clip.collapsed::after {
		content: '';
		position: absolute;
		inset-inline: 0;
		bottom: 0;
		height: 3rem;
		background: linear-gradient(
			to bottom,
			transparent,
			var(
				--hz-color-surface-muted,
				color-mix(in srgb, var(--hz-intent-neutral, #6b7280) 6%, var(--hz-color-surface, #fff))
			)
		);
		pointer-events: none;
	}

	pre {
		margin: 0;
		padding: 1rem;
		overflow-x: auto;
		background: transparent;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: var(--hz-font-size-sm, 0.875rem);
		line-height: var(--hz-line-height-base, 1.5);
	}

	/* The library Button, positioned into the top corner. A surface fill keeps
	 * it legible where it overlaps the first line of code. */
	.code-block :global(.copy-btn) {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		z-index: 1;
		background-color: var(--hz-color-surface, #fff);
	}

	/* The expand toggle spans the bottom edge, below the fade, so the two read
	 * as one affordance. fullWidth handles the width; this squares the top
	 * corners so it sits flush against the code above. */
	.code-block :global(.expand-btn) {
		border-top: 1px solid var(--hz-color-border, #6b7280);
		border-radius: 0 0 var(--hz-radius-md, 0.5rem) var(--hz-radius-md, 0.5rem);
	}
</style>
