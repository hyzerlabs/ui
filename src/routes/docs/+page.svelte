<script lang="ts">
	import { Stack, Split, Card, Badge, Button, Image, CodeBlock } from '$lib';
	import DocIntro from '../../docs/DocIntro.svelte';
	import WhereNext from '../../docs/WhereNext.svelte';
	import { nextSteps } from '../../docs/nextSteps';

	const installCode = 'pnpm add @hyzer-labs/ui';

	// The filename now lives in CodeBlock's `title`, so the fences no longer
	// open with a comment repeating it.
	const tierOneCss = [
		"@import '@hyzer-labs/ui/tokens.css';",
		"@import '@hyzer-labs/ui/theme';",
		"@import '@hyzer-labs/ui/utilities.css'; /* optional, see Utilities */"
	].join('\n');

	// Placeholder art, inline so the example has no asset dependency: the same
	// generated disc the Product listing pattern draws for its cards. A real
	// page would `import cover from './cover.jpg'`.
	const COVER =
		"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 200'%3E%3Crect width='320' height='200' fill='%232563eb'/%3E%3Ccircle cx='160' cy='100' r='64' fill='%23fbbf24'/%3E%3Ccircle cx='160' cy='100' r='44' fill='none' stroke='%23ffffff' stroke-opacity='0.4' stroke-width='4'/%3E%3C/svg%3E";

	// The script close tag is split so Svelte's parser doesn't end this block.
	const tierOneSvelte = [
		'<script>',
		"\timport { Card, Badge, Button, Image } from '@hyzer-labs/ui';",
		"\timport cover from './cover.jpg';",
		'</' + 'script>',
		'',
		'<Card horizontal>',
		'\t{#snippet media()}',
		'\t\t<Image src={cover} alt="" aspectRatio="16/9" rounded="md" />',
		'\t{/snippet}',
		'',
		'\t<Badge intent="info">Technique</Badge>',
		'\t<h3>Shaping a backhand roller</h3>',
		'\t<p>Why nose angle matters more than arm speed, and how to feel it.</p>',
		'',
		'\t{#snippet actions()}',
		'\t\t<Button variant="ghost" intent="neutral">Read more</Button>',
		'\t{/snippet}',
		'</Card>'
	].join('\n');

	const tierTwoCss = [
		':root {',
		'\t--hz-palette-primary: #0f766e; /* your brand */',
		'\t--hz-radius-md: 0.625rem;',
		'}',
		'',
		"[data-theme='dark'] {",
		'\t--hz-palette-primary: #2dd4bf; /* the same token, for dark */',
		'}'
	].join('\n');

	const tierThreeConfig = [
		"import { defineConfig } from '@hyzer-labs/ui/config';",
		'',
		'export default defineConfig({',
		"\toutput: 'src/styles/tokens.css',",
		'',
		'\t// The default theme: the :root block a page gets with no data-theme set.',
		'\ttokens: {',
		'\t\tpalette: {',
		"\t\t\tprimary: '#0f766e',",
		"\t\t\tbrandRed: { 500: '#ef4444', 900: '#7f1d1d' } // ramps welcome",
		'\t\t},',
		"\t\tintent: { fairway: 'var(--hz-palette-brand-red-900)' } // new intents too",
		'\t},',
		'',
		'\t// Named variants that override the default, keyed by data-theme.',
		"\tthemes: { dark: { palette: { primary: '#2dd4bf' } } }",
		'});'
	].join('\n');

	const tierThreeRun = ['{', '\t"scripts": {', '\t\t"generate": "hyzer generate"', '\t}', '}'].join(
		'\n'
	);

	const tierThreeImport = [
		'/* import YOUR generated sheet instead of ours */',
		"@import './styles/tokens.css';",
		"@import '@hyzer-labs/ui/theme';",
		"@import './styles/hyzer-utilities.css'; /* only if you generated it */"
	].join('\n');
</script>

<svelte:head>
	<title>Getting Started — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro />

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="install-heading"
	>
		<h2 id="install-heading">Install the package</h2>
		<CodeBlock code={installCode} language="bash" />
		<ul class="note-list">
			<li><strong>Svelte</strong> 5.32 or newer.</li>
			<li>
				<strong>Node</strong> 22.18 or newer. You need it for the <code>hyzer</code> CLI in step 3.
			</li>
			<li><strong>TypeScript</strong> is optional. Types ship with the package.</li>
			<li><strong>SvelteKit</strong> is optional. The library imports nothing from Kit.</li>
		</ul>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="tier-one-heading"
	>
		<h2 id="tier-one-heading">1. Import the styles and use a component</h2>
		<p>
			Import the token sheet that ships with the package, and the reference theme. Do this once, in
			your global stylesheet. Then use the components. Every page on this site runs this exact
			setup.
		</p>
		<CodeBlock code={tierOneCss} title="app.css" language="css" />
		<Split fraction="2/3" gap="md" stackBelow="md">
			<CodeBlock code={tierOneSvelte} title="+page.svelte" language="svelte" />
			<!-- The same components the fence uses, rendered with the reference theme. -->
			<div class="live-demo">
				<Card horizontal>
					{#snippet media()}
						<Image src={COVER} alt="" aspectRatio="16/9" rounded="md" />
					{/snippet}

					<Badge intent="info">Technique</Badge>
					<h3 class="teaser-title">Shaping a backhand roller</h3>
					<p class="teaser-body">Why nose angle matters more than arm speed, and how to feel it.</p>

					{#snippet actions()}
						<Button variant="ghost" intent="neutral">Read more</Button>
					{/snippet}
				</Card>
			</div>
		</Split>
		<p class="doc-note">
			The theme is optional. Skip it and the components stay headless: you keep the behavior and the
			accessibility. The browser's own defaults decide how everything looks.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="tier-two-heading"
	>
		<h2 id="tier-two-heading">2. Override tokens in CSS</h2>
		<p>
			Every visual decision resolves through a <code>--hz-*</code> custom property, also called a design
			token. Redefine any of them in your own stylesheet: palette, roles, intents, radius, density. There
			is no build step.
		</p>
		<p>
			Dark mode runs on the same hook the library uses internally: the <code>data-theme</code>
			attribute. The tokens you set in <code>:root</code> are the default, which is what a page gets
			when nothing sets that attribute. A named theme like <code>dark</code> then overrides the default.
			The attribute works on any element, so one section can carry its own theme. Set it nowhere and the
			page follows the reader's system preference, with no script involved.
		</p>
		<CodeBlock code={tierTwoCss} title="app.css" language="css" />
		<p class="doc-note">
			More override recipes live in <a href="/docs/theming/tokens"
				>Theming → Tokens &amp; Overrides</a
			>. <a href="/docs/foundation/contrast">Contrast &amp; Accessibility</a> shows how to check a new
			palette.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="tier-three-heading"
	>
		<h2 id="tier-three-heading">3. Generate your own tokens (optional)</h2>
		<p>
			This step moves your choices into the build. Describe your system in
			<code>hyzer.config.ts</code>
			and let the <code>hyzer</code> CLI generate the sheet. The CLI merges your settings over the
			base schema. Every run prints a WCAG contrast report to your console. Add
			<code>--strict</code> and any AA miss fails the run.
		</p>
		<CodeBlock code={tierThreeConfig} title="hyzer.config.ts" language="ts" />
		<CodeBlock code={tierThreeRun} title="package.json" language="json" />
		<CodeBlock code={tierThreeImport} title="app.css" language="css" />
		<p class="doc-note">
			<code>hyzer generate --mode overrides</code> writes a patch sheet to import <em>after</em>
			ours instead of replacing it. See <a href="/docs/foundation/config">Config &amp; CLI</a> for every
			option and how to choose a mode.
		</p>
		<p class="doc-note">
			Add <code>utilities: true</code> to the config (or run with <code>--utilities</code>) and the
			CLI also writes <code>hyzer-utilities.css</code>, the opt-in single-property helper classes.
			See
			<a href="/docs/foundation/utilities">Utilities</a>.
		</p>
	</Stack>
	<WhereNext items={nextSteps} />
</Stack>

<style>
	/* Margins zeroed below. Every <p> and CodeBlock is a direct child of
	 * either .doc-intro or a .doc-section Stack (gap="away", data-density-
	 * shift), which owns the space between them. */
	p {
		margin: 0;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	/* The live half of step one: the same components the fence declares,
	   rendered by the reference theme this site runs on. */
	.live-demo {
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 1rem;
	}

	.teaser-title {
		margin: 0.35rem 0 0.25rem;
		font-size: var(--hz-font-size-lg, 1.4rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		line-height: var(--hz-line-height-tight, 1.2);
	}

	.teaser-body {
		color: var(--hz-color-text-muted, #6b7280);
		line-height: var(--hz-line-height-base, 1.5);
	}
</style>
