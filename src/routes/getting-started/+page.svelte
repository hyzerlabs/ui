<script lang="ts">
	import { Stack } from '$lib';
	import CodeBlock from '../../docs/CodeBlock.svelte';

	const installCode = 'pnpm add @hyzer-labs/ui';

	const tierOneCss = [
		'/* app.css — tokens first, then the reference theme */',
		"@import '@hyzer-labs/ui/tokens.css';",
		"@import '@hyzer-labs/ui/theme';"
	].join('\n');

	// The script close tag is split so Svelte's parser doesn't end this block.
	const tierOneSvelte = [
		'<script>',
		"\timport { Button, Card, Stack } from '@hyzer-labs/ui';",
		'</' + 'script>',
		'',
		'<Stack gap="md">',
		'\t<Card>Ready to play.</Card>',
		'\t<Button>Start a round</Button>',
		'</Stack>'
	].join('\n');

	const tierTwoCss = [
		'/* Your own stylesheet, imported after tokens.css — no build step. */',
		':root {',
		'\t--hz-color-primary: #0f766e; /* your brand */',
		'\t--hz-radius-md: 0.625rem;',
		'}',
		'',
		"[data-theme='dark'] {",
		'\t--hz-color-primary: #2dd4bf; /* its dark companion */',
		'}'
	].join('\n');

	const tierThreeConfig = [
		'// hyzer.config.ts',
		"import { defineConfig } from '@hyzer-labs/ui/config';",
		'',
		'export default defineConfig({',
		"\toutput: 'src/styles/tokens.css',",
		'\ttokens: {',
		'\t\tcolor: {',
		"\t\t\tprimary: '#0f766e',",
		"\t\t\tbrandRed: { 500: '#ef4444', 900: '#7f1d1d' } // ramps welcome",
		'\t\t},',
		"\t\tintent: { fairway: 'var(--hz-color-brand-red-900)' } // new intents too",
		'\t},',
		"\tdark: { color: { primary: '#2dd4bf' } }",
		'});'
	].join('\n');

	const tierThreeRun = ['{', '\t"scripts": {', '\t\t"generate": "hyzer generate"', '\t}', '}'].join(
		'\n'
	);

	const tierThreeImport = [
		'/* app.css — import YOUR generated sheet instead of ours */',
		"@import './styles/tokens.css';",
		"@import '@hyzer-labs/ui/theme';"
	].join('\n');
</script>

<svelte:head>
	<title>Getting Started — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>Getting Started</h1>
		<p>
			Three tiers of adoption — each one optional, each one a superset of the last. The library
			makes the accessibility and functional choices; you only ever decide how things look.
		</p>
	</div>

	<section aria-labelledby="install-heading">
		<h2 id="install-heading">Install</h2>
		<p>Svelte 5 is the only peer dependency. TypeScript configs want Node 22.18 or newer.</p>
		<CodeBlock code={installCode} />
	</section>

	<section aria-labelledby="tier-one-heading">
		<h2 id="tier-one-heading">1. Import and go</h2>
		<p>
			Import the committed token sheet and the reference theme once, globally, and use components.
			Everything on this site renders exactly this setup.
		</p>
		<CodeBlock code={tierOneCss} />
		<CodeBlock code={tierOneSvelte} />
		<p class="step-note">
			The theme is optional — skip it and the components are headless: full functionality and
			accessibility, no appearance opinions beyond native element defaults.
		</p>
	</section>

	<section aria-labelledby="tier-two-heading">
		<h2 id="tier-two-heading">2. Override tokens in CSS</h2>
		<p>
			Every visual decision resolves through a <code>--hz-*</code> custom property. Redefine any of
			them in your own stylesheet — palette, roles, intents, radius, density — with no build step.
			Dark mode is the same hook the library uses: <code>[data-theme="dark"]</code>.
		</p>
		<CodeBlock code={tierTwoCss} />
		<p class="step-note">
			The full recipe collection lives in <a href="/theming/tokens"
				>Theming → Tokens &amp; Overrides</a
			>, and <a href="/foundation/contrast">Contrast &amp; Accessibility</a> shows how to verify a new
			palette.
		</p>
	</section>

	<section aria-labelledby="tier-three-heading">
		<h2 id="tier-three-heading">3. Generate your own tokens (optional)</h2>
		<p>
			For build-layer control, describe your system in <code>hyzer.config.ts</code> and let the
			<code>hyzer</code> CLI generate the sheet — your settings merged over the base schema, with a
			WCAG contrast report on every run (<code>--strict</code> fails the build on an AA miss).
		</p>
		<CodeBlock code={tierThreeConfig} />
		<CodeBlock code={tierThreeRun} />
		<CodeBlock code={tierThreeImport} />
		<p class="step-note">
			<code>hyzer generate --mode overrides</code> emits a patch sheet to import <em>after</em>
			ours instead of replacing it — see <a href="/theming/tokens">Tokens &amp; Overrides</a> for when
			to pick which.
		</p>
	</section>
</Stack>

<style>
	h1 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-2xl, 2.75rem);
		font-weight: var(--hz-font-weight-bold, 700);
	}

	h2 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-xl, 1.65rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	p {
		margin: 0 0 1rem;
	}

	section :global(.code-block) {
		margin-bottom: 1rem;
	}

	.step-note {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}
</style>
