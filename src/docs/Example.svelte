<script lang="ts">
	import type { Snippet } from 'svelte';
	import { CodeBlock } from '$lib';

	/**
	 * A demo frame: live preview on top, usage code always visible beneath.
	 * Pass a reactive `code` string (e.g. a template literal derived from the
	 * selected variant) and the code pane updates live with the demo.
	 */
	interface Props {
		code: string;
		children: Snippet;
	}

	let { code, children }: Props = $props();
</script>

<div class="doc-example">
	<div class="doc-example-preview">
		{@render children()}
	</div>
	<CodeBlock {code} />
</div>

<style>
	.doc-example {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		overflow: hidden;
	}

	.doc-example-preview {
		padding: 1.5rem 1rem;
	}

	/* Embedded in the example frame: the frame provides the outer border, so
	 * collapse the standalone chrome down to a divider. */
	.doc-example :global(.hz-code-block) {
		border: none;
		border-top: 1px solid var(--hz-color-border, #6b7280);
		border-radius: 0;
		background-color: var(
			--hz-color-surface-muted,
			color-mix(in srgb, var(--hz-intent-neutral, #6b7280) 6%, var(--hz-color-surface, #fff))
		);
	}
</style>
