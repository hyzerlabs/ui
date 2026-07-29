<script lang="ts">
	import { Stack, CodeBlock } from '$lib';
	import DocIntro from '../../../docs/DocIntro.svelte';
	import { agentRules, importSurface, renderAgentsMd } from '../../../docs/agentRules';

	const llmsCode = 'https://design.hyzer.sh/llms.txt';

	// The file served at /agents.md, shown verbatim — what you copy here is
	// byte-identical to what the route returns.
	const agentsMd = renderAgentsMd();

	/** Split a markdown body on `inline code` so the page can render <code>. */
	function segments(body: string): { text: string; code: boolean }[] {
		return body
			.split(/(`[^`]+`)/)
			.filter(Boolean)
			.map((part) =>
				part.startsWith('`') && part.endsWith('`')
					? { text: part.slice(1, -1), code: true }
					: { text: part, code: false }
			);
	}
</script>

<svelte:head>
	<title>Agents — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro />

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="llms-heading"
	>
		<h2 id="llms-heading">Point the agent at llms.txt</h2>
		<p>
			Every page on this site is indexed in a single machine-readable file, following the
			<a href="https://llmstxt.org" target="_blank" rel="noreferrer">llms.txt</a> convention. There is
			one line per page, with its URL and a one-sentence description of what it covers.
		</p>
		<CodeBlock code={llmsCode} />
		<p>
			<a href="/llms.txt">Read it here</a>. It is generated from the same manifest that builds this
			site's navigation, so it cannot fall out of date with the docs it points at.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="imports-heading"
	>
		<h2 id="imports-heading">Where each import comes from</h2>
		<p>
			Components come from the package root. Everything else lives behind a named subpath, so an
			agent never has to guess whether something is a component, a utility, or a type.
		</p>
		<CodeBlock code={importSurface} language="ts" />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="rules-heading"
	>
		<h2 id="rules-heading">House rules</h2>
		<p>
			These are the conventions that account for most of what generated code gets wrong with this
			library. They are also the contents of the AGENTS.md file below, so a rule stated here and a
			rule handed to an agent cannot drift apart.
		</p>

		{#each agentRules as rule (rule.title)}
			<h3>{rule.title}</h3>
			<p>
				{#each segments(rule.body) as seg, i (i)}{#if seg.code}<code>{seg.text}</code
						>{:else}{seg.text}{/if}{/each}
			</p>
			{#if rule.code}
				<CodeBlock code={rule.code.source} language={rule.code.lang} />
			{/if}
		{/each}
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="file-heading"
	>
		<h2 id="file-heading">Drop this in your repo</h2>
		<p>
			The rules above, as a file. Save it as <code>AGENTS.md</code> in your project root, where coding
			agents look for project instructions. It is generated from the same source as this page, so it never
			falls behind what you just read.
		</p>
		<CodeBlock code={agentsMd} title="AGENTS.md" language="markdown" collapsible />
		<p>
			You can also fetch it directly: <a href="/agents.md">/agents.md</a>.
		</p>
	</Stack>
</Stack>

<style>
	p {
		margin: 0;
		line-height: var(--hz-line-height-base, 1.5);
	}

	h3 {
		margin: 0;
		font-size: var(--hz-font-size-lg, 1.4rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}
</style>
