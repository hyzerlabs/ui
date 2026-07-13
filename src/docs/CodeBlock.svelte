<script lang="ts">
	interface Props {
		code: string;
	}

	let { code }: Props = $props();

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
</script>

<div class="code-block">
	<button type="button" class="copy-btn" onclick={copy}>
		{copied ? 'Copied' : 'Copy'}
	</button>
	<span class="sr-only" aria-live="polite">{copied ? 'Code copied to clipboard' : ''}</span>
	<pre><code>{code}</code></pre>
</div>

<style>
	/* Standalone default: framed with the same tint the Example frame uses.
	 * Example.svelte strips the border/radius when embedding one. */
	.code-block {
		position: relative;
		background-color: color-mix(in srgb, var(--hz-color-gray, #6b7280) 6%, transparent);
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
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

	.copy-btn {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.25rem 0.625rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-sm, 0.25rem);
		background: var(--hz-color-surface, #fff);
		color: var(--hz-color-text-muted, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
		cursor: pointer;
	}

	.copy-btn:hover {
		color: var(--hz-color-text, #000);
	}
</style>
