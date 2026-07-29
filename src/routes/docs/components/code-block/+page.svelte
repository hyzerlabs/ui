<script lang="ts">
	import { Alert, Container, Tabs, CodeBlock } from '$lib';
	import type { PageData } from './$types.js';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { codeBlockDoc } from '../../../../docs/data/code-block.js';
	import Example from '../../../../docs/Example.svelte';
	import PrismCodeBlock from '../../../../docs/PrismCodeBlock.svelte';
	import { prismDemoSource, shikiDemoSource } from '../../../../docs/samples/code-block-demo.js';
	import prismCodeBlockSource from '../../../../docs/PrismCodeBlock.svelte?raw';
	// Real, shipped content for the Collapsible demo (rather than filler
	// lines) — the reference CSS reset, also used verbatim on the Reset page.
	import resetSource from '$lib/theme/reset.css?raw';

	let { data }: { data: PageData } = $props();

	const basicCode = [
		'function scoreToPar(round: { strokes: number }, par: number): number {',
		'\treturn round.strokes - par;',
		'}'
	].join('\n');

	// The script close tag is split so Svelte's own parser doesn't end this block.
	const titledCode = [
		'<script lang="ts">',
		'\texport let name: string;',
		'</' + 'script>',
		'',
		'<p>Hello, {name}!</p>'
	].join('\n');

	const languageOnlyCode = [
		'.hz-code-block {',
		'\tborder-radius: var(--hz-radius-md, 0.5rem);',
		'}'
	].join('\n');

	const titleAndLanguageCode = [
		'export function scoreToPar(strokes: number, par: number): number {',
		'\treturn strokes - par;',
		'}'
	].join('\n');

	const lineNumbersCode = [
		'export interface Round {',
		'\tcourse: string;',
		'\tholes: number;',
		'\tstrokes: number;',
		'}'
	].join('\n');

	const collapsibleCode = resetSource.trim();

	const basicUsage = `<CodeBlock code={code} />`;
	const titledUsage = `<CodeBlock code={code} title="app/routes/+page.svelte" />`;
	const languageOnlyUsage = `<CodeBlock code={code} language="css" />`;
	const titleAndLanguageUsage = `<CodeBlock code={code} title="scoring.ts" language="ts" />`;
	const lineNumbersUsage = `<CodeBlock code={code} lineNumbers />`;
	const collapsibleUsage = `<CodeBlock code={code} language="css" collapsible />`;

	const prismUsage = `<PrismCodeBlock code={source} language="ts" />`;
	const shikiUsage = `<CodeBlock code={source}>{@html data.shikiHtml}</CodeBlock>`;

	// Mirrors +page.server.ts verbatim (not a `?raw` import — SvelteKit
	// refuses to let ANY client-reachable module import a `+page.server.ts`,
	// `?raw` or not, since that boundary is what keeps Shiki out of the
	// browser bundle in the first place). The 'shiki' specifier is split so
	// this display-only text doesn't itself read as a real import to
	// highlighter-isolation.spec.ts's file-content scan (CodeBlock-R18) —
	// the same trick titledCode above uses to keep its own closing script
	// tag from ending this block early.
	const shikiLoadSource = [
		"import { codeToHtml } from '" + 'shiki' + "';",
		"import { shikiDemoSource } from '../../../../docs/samples/code-block-demo.js';",
		"import type { PageServerLoad } from './$types.js';",
		'',
		`export const load: PageServerLoad = async () => {`,
		'\tconst shikiHtml = await codeToHtml(shikiDemoSource, {',
		"\t\tlang: 'svelte',",
		"\t\ttheme: 'github-dark'",
		'\t});',
		'\treturn { shikiHtml };',
		'};'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'titled', label: 'With title' },
		{ id: 'language', label: 'Language tag' },
		{ id: 'line-numbers', label: 'Line numbers' },
		{ id: 'collapsible', label: 'Collapsible' },
		{ id: 'highlighting', label: 'Syntax highlighting' }
	];
</script>

<DocPage name="CodeBlock" {...codeBlockDoc}>
	<Tabs items={demoTabs} ariaLabel="CodeBlock demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<p class="tab-note">
						No <code>title</code>, no <code>language</code> — the copy button floats over the top-right
						corner of the code.
					</p>
					<Container breakout padding="none">
						<Example code={basicUsage}>
							<CodeBlock code={basicCode} />
						</Example>
					</Container>
				{:else if item.id === 'titled'}
					<p class="tab-note">
						<code>title</code> renders a header bar with the filename, and the copy button moves into
						it.
					</p>
					<Container breakout padding="none">
						<Example code={titledUsage}>
							<CodeBlock code={titledCode} title="app/routes/+page.svelte" />
						</Example>
					</Container>
				{:else if item.id === 'language'}
					<p class="tab-note">
						<code>language</code> alone renders a non-interactive tag in the header — and stamps
						<code>class="language-css"</code> on the default code, the hook a client autoloader
						(Prism, highlight.js) decorates after mount. Set both <code>title</code> and
						<code>language</code> to show them together.
					</p>
					<Container breakout padding="none">
						<Example code={languageOnlyUsage}>
							<CodeBlock code={languageOnlyCode} language="css" />
						</Example>
					</Container>
					<Container breakout padding="none">
						<Example code={titleAndLanguageUsage}>
							<CodeBlock code={titleAndLanguageCode} title="scoring.ts" language="ts" />
						</Example>
					</Container>
				{:else if item.id === 'line-numbers'}
					<p class="tab-note">
						<code>lineNumbers</code> adds a decorative gutter — <code>aria-hidden</code> and excluded
						from copy and selection, so a mouse drag or a screen reader both see clean source.
					</p>
					<Container breakout padding="none">
						<Example code={lineNumbersUsage}>
							<CodeBlock code={lineNumbersCode} lineNumbers />
						</Example>
					</Container>
				{:else if item.id === 'collapsible'}
					<p class="tab-note">
						<code>collapsible</code> clamps a listing longer than <code>collapsedLines</code>
						(default 16) behind a Show-more/less toggle — the reference CSS reset, real and shipped, rather
						than filler lines.
					</p>
					<Container breakout padding="none">
						<Example code={collapsibleUsage}>
							<CodeBlock code={collapsibleCode} language="css" collapsible />
						</Example>
					</Container>
				{:else}
					<Alert intent="info" title="The library ships no highlighter">
						Syntax highlighting is always bring-your-own — the <code>language</code> class hook for
						a client autoloader (Prism, highlight.js), or the <code>children</code> escape hatch for a
						build-time highlighter's own HTML (Shiki, first-class here). This subsection is self-contained
						and can be deleted without touching the component or the tabs above it.
					</Alert>

					<h3 class="highlight-heading">Prism — client autoloader</h3>
					<p class="tab-note">
						<code>PrismCodeBlock</code> is a small docs-only wrapper: it renders a plain
						<code>&lt;CodeBlock language&gt;</code> and runs Prism over its <code>pre code</code>
						in an <code>$effect</code> after mount — the exact hook <code>language</code> stamps
						(CodeBlock-R7). Prism's own token theme is scoped under
						<code>.hz-docs-prism</code>, so it can't bleed onto any other block on this site.
					</p>
					<Container breakout padding="none">
						<Example code={prismUsage}>
							<PrismCodeBlock code={prismDemoSource} language="ts" />
						</Example>
					</Container>
					<section class="source-block" aria-labelledby="prism-source-heading">
						<h4 id="prism-source-heading" class="source-heading">
							PrismCodeBlock.svelte, verbatim
						</h4>
						<CodeBlock
							code={prismCodeBlockSource}
							title="src/docs/PrismCodeBlock.svelte"
							collapsible
						/>
					</section>

					<h3 class="highlight-heading">Shiki — build-time (prerendered)</h3>
					<p class="tab-note">
						This block's HTML is produced once, at build, by this page's own
						<code>+page.server.ts</code> — a server <code>load</code> that calls Shiki's
						<code>codeToHtml</code> and returns the highlighted string. The page passes it through
						the <code>children</code> escape hatch; Shiki's palette rides its own inline
						<code>.shiki</code> styles (the theme suppresses its own background under
						<code>data-highlighted</code>). No highlighter JS reaches the browser.
					</p>
					<Container breakout padding="none">
						<Example code={shikiUsage}>
							<CodeBlock code={shikiDemoSource}>
								<!-- Shiki's own output, produced at prerender from our own
								     committed fixture (code-block-demo.ts) — no user input,
								     CodeBlock-R19's idiomatic 'children' usage. -->
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html data.shikiHtml}
							</CodeBlock>
						</Example>
					</Container>
					<section class="source-block" aria-labelledby="shiki-source-heading">
						<h4 id="shiki-source-heading" class="source-heading">+page.server.ts, verbatim</h4>
						<CodeBlock
							code={shikiLoadSource}
							title="src/routes/components/code-block/+page.server.ts"
							language="ts"
							collapsible
						/>
					</section>

					<p class="tab-note">
						<code>highlight.js</code> works the same way as Prism — it decorates the same
						<code>language-&lt;x&gt;</code> class after mount — with no sample or dependency here.
					</p>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-note {
		margin: 0 0 0.75rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.highlight-heading {
		margin: 1.5rem 0 0;
		font-size: var(--hz-font-size-base, 1rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.highlight-heading:first-child {
		margin-top: 0;
	}

	.source-heading {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.source-block {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}
</style>
