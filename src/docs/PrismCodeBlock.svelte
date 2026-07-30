<script lang="ts">
	/**
	 * the live "Prism, client-autoloader" demo.
	 *
	 * The ONLY docs importer of `prismjs` (highlighter-isolation.spec.ts pins
	 * it) — a self-contained wrapper the code-block docs page
	 * uses for exactly one live block. Renders a plain `<CodeBlock
	 * language>`, whose `language-<x>` class is the hook CodeBlock ships
	 * for precisely this: a client-side autoloader decorates it after mount.
	 *
	 * `prismjs` sets its shared state on the real DOM `window` (prism-core.js)
	 * rather than a module-scoped export, so importing it eagerly at module
	 * scope would throw during SSR/prerender (adapter-static prerenders every
	 * route). The dynamic import inside `$effect` is what keeps this
	 * client-only — `$effect` never runs during SSR, so no highlighter code
	 * ships to, or runs on, the server.
	 */
	import { CodeBlock } from '$lib';

	interface Props {
		code: string;
		language: string;
	}

	let { code, language }: Props = $props();

	let el = $state<HTMLElement>();

	$effect(() => {
		if (!el) return;
		let cancelled = false;
		(async () => {
			const Prism = (await import('prismjs')).default;
			await import('prismjs/components/prism-clike.js');
			await import('prismjs/components/prism-javascript.js');
			await import('prismjs/components/prism-typescript.js');
			if (cancelled || !el) return;
			Prism.highlightAllUnder(el);
		})();
		return () => {
			cancelled = true;
		};
	});
</script>

<div bind:this={el} class="hz-docs-prism">
	<CodeBlock {code} {language} />
</div>

<style>
	/*
	 * A hand-scoped port of Prism's own bundled "Tomorrow Night" theme
	 * (prismjs/themes/prism-tomorrow.css) — same token colours, rescoped
	 * under .hz-docs-prism so they cannot bleed onto any other code block on
	 * the site. Prism's stock theme file targets bare
	 * `.token.*` selectors with no scoping mechanism of its own, so it can't
	 * be imported as-is here. The dark surface these colours were designed
	 * against is set locally via the documented --hz-code-block-bg hook
	 * — no fork of the component or its theme required.
	 */
	.hz-docs-prism :global(.hz-code-block) {
		--hz-code-block-bg: #2d2d2d;
	}

	.hz-docs-prism :global(.hz-code-block-clip code) {
		color: #ccc;
	}

	.hz-docs-prism :global(.token.comment),
	.hz-docs-prism :global(.token.prolog),
	.hz-docs-prism :global(.token.doctype),
	.hz-docs-prism :global(.token.cdata) {
		color: #999;
	}

	.hz-docs-prism :global(.token.punctuation) {
		color: #ccc;
	}

	.hz-docs-prism :global(.token.tag),
	.hz-docs-prism :global(.token.attr-name),
	.hz-docs-prism :global(.token.namespace),
	.hz-docs-prism :global(.token.deleted) {
		color: #e2777a;
	}

	.hz-docs-prism :global(.token.function-name) {
		color: #6196cc;
	}

	.hz-docs-prism :global(.token.boolean),
	.hz-docs-prism :global(.token.number),
	.hz-docs-prism :global(.token.function) {
		color: #f08d49;
	}

	.hz-docs-prism :global(.token.property),
	.hz-docs-prism :global(.token.class-name),
	.hz-docs-prism :global(.token.constant),
	.hz-docs-prism :global(.token.symbol) {
		color: #f8c555;
	}

	.hz-docs-prism :global(.token.selector),
	.hz-docs-prism :global(.token.important),
	.hz-docs-prism :global(.token.atrule),
	.hz-docs-prism :global(.token.keyword),
	.hz-docs-prism :global(.token.builtin) {
		color: #cc99cd;
	}

	.hz-docs-prism :global(.token.string),
	.hz-docs-prism :global(.token.char),
	.hz-docs-prism :global(.token.attr-value),
	.hz-docs-prism :global(.token.regex),
	.hz-docs-prism :global(.token.variable) {
		color: #7ec699;
	}

	.hz-docs-prism :global(.token.operator),
	.hz-docs-prism :global(.token.entity),
	.hz-docs-prism :global(.token.url) {
		color: #67cdcc;
	}

	.hz-docs-prism :global(.token.important),
	.hz-docs-prism :global(.token.bold) {
		font-weight: bold;
	}

	.hz-docs-prism :global(.token.italic) {
		font-style: italic;
	}

	.hz-docs-prism :global(.token.inserted) {
		color: green;
	}
</style>
