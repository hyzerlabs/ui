<script lang="ts">
	import { Stack, Alert, CodeBlock } from '$lib';
	import DocIntro from '../../../docs/DocIntro.svelte';

	const llmsCode = 'https://design.hyzer.sh/llms.txt';

	const importsCode = [
		"import { Button, Modal, Combobox } from '@hyzer-labs/ui';   // components",
		"import { defineConfig } from '@hyzer-labs/ui/config';        // token engine",
		"import { reveal, fade } from '@hyzer-labs/ui/motion';        // motion",
		"import { intersect } from '@hyzer-labs/ui/observers';        // observers",
		"import { IconSearch } from '@hyzer-labs/ui/icons';           // icons",
		"import { contrastRatio } from '@hyzer-labs/ui/utils';        // utilities",
		"import type { Intent } from '@hyzer-labs/ui/types';          // types",
		'',
		"import '@hyzer-labs/ui/tokens.css';    // required",
		"import '@hyzer-labs/ui/theme';         // optional reference theme",
		"import '@hyzer-labs/ui/reset.css';     // optional structural reset"
	].join('\n');

	const themeCode = [
		'// hyzer.config.ts — themes are named; dark is one of them',
		'export default defineConfig({',
		'\tthemes: {',
		"\t\tdark: { palette: { primary: '#60a5fa' } },",
		"\t\tocean: { palette: { primary: '#0ea5e9' } }",
		'\t}',
		'});'
	].join('\n');

	const classCode = [
		'<!-- Restyle through the class prop, which merges after the root class -->',
		'<Button class="checkout-cta">Place order</Button>',
		'',
		'<!-- Not this: wrapping to reach the component -->',
		'<div class="checkout-cta"><Button>Place order</Button></div>'
	].join('\n');
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
			<a href="https://llmstxt.org" target="_blank" rel="noreferrer">llms.txt</a> convention: one line
			per page, with its URL and a one-sentence description of what it covers.
		</p>
		<CodeBlock code={llmsCode} />
		<p>
			<a href="/llms.txt">Read it here</a> — it is generated from the same manifest that builds this site's
			navigation, so it cannot fall out of date with the docs it points at.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="imports-heading"
	>
		<h2 id="imports-heading">The import surface</h2>
		<p>
			Components come from the package root. Everything else lives behind a named subpath, so an
			agent never has to guess whether something is a component, a utility, or a type.
		</p>
		<CodeBlock code={importsCode} />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="rules-heading"
	>
		<h2 id="rules-heading">House rules</h2>
		<p>Four conventions account for most of what generated code gets wrong against this library.</p>

		<h3>Generate tokens; never hand-edit them</h3>
		<p>
			<code>tokens.css</code> is build output. Change <code>hyzer.config.ts</code> and run
			<code>hyzer generate</code> — a hand edit is silently overwritten on the next run, and it skips
			the contrast grading that would have caught an inaccessible pairing.
		</p>

		<h3>Resolve through roles and intents, never the palette</h3>
		<p>
			In component CSS, use <code>--hz-color-*</code> (structural roles) and
			<code>--hz-intent-*</code> (meaning). <code>--hz-palette-*</code> is the raw hue layer that those
			resolve through; reading it directly bypasses the indirection that makes theming and dark mode work.
		</p>

		<h3>Themes are named entries, applied with data-theme</h3>
		<p>
			Define them under <code>themes</code> in the config, then apply one with a
			<code>data-theme</code> attribute or the <code>theme</code> attachment — on
			<code>&lt;html&gt;</code> or on any element, which is how a single section gets its own theme.
		</p>
		<CodeBlock code={themeCode} />

		<h3>Restyle through the class prop</h3>
		<p>
			Every component accepts <code>class</code> and merges it after its own root class, so a single
			instance can be restyled without a wrapper element and without <code>!important</code>.
		</p>
		<CodeBlock code={classCode} />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="a11y-heading"
	>
		<h2 id="a11y-heading">What not to reimplement</h2>
		<Alert intent="info" title="The accessibility is already there">
			Components ship the ARIA roles, keyboard handling and focus management of their WAI-ARIA
			pattern. Adding <code>role</code>, <code>tabindex</code>, or key handlers on top of a
			component usually breaks the built-in behavior rather than adding to it. If a component seems
			to be missing an accessible name, look for a label prop before reaching for
			<code>aria-label</code> on a wrapper.
		</Alert>
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
