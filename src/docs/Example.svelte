<script lang="ts">
	import type { Snippet } from 'svelte';
	import CodeBlock from './CodeBlock.svelte';

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

	.doc-example :global(.code-block) {
		border-top: 1px solid var(--hz-color-border, #6b7280);
		background-color: color-mix(in srgb, var(--hz-color-gray, #6b7280) 6%, transparent);
	}
</style>
