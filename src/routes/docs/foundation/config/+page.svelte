<script lang="ts">
	import { Alert, Stack, CodeBlock } from '$lib';
	import DocIntro from '../../../../docs/DocIntro.svelte';
	import WhereNext from '../../../../docs/WhereNext.svelte';
	import IconTriangleAlert from '$lib/icons/generated/triangle-alert.svelte';
	import IconInfo from '$lib/icons/generated/info.svelte';
	import { CONFIG_TEMPLATE } from '$lib/cli/config-template.js';

	const nextSteps = [
		{
			label: 'Tokens & Overrides',
			href: '/docs/theming/tokens',
			blurb:
				'The two-layer token model the generated sheet writes, and how to reach it in plain CSS.'
		},
		{
			label: 'Contrast & Accessibility',
			href: '/docs/foundation/contrast',
			blurb: "The report's math, as live ratios you can read off the page."
		},
		{
			label: 'Example themes',
			href: '/docs/theming/examples',
			blurb: 'Complete configs you can copy, from a token-only theme to one built from scratch.'
		}
	];

	// Mirrors the CLI's own --help output (src/lib/cli/main.ts). `key` is the
	// hyzer.config.ts equivalent, or null where the flag describes one run
	// rather than the design system.
	const cliFlags: { name: string; key: string | null; note: string }[] = [
		{
			name: '--config <path>',
			key: null,
			note: 'Which config file to read. Defaults to hyzer.config.ts, .js or .mjs in the current directory.'
		},
		{
			name: '--out <path>',
			key: 'output',
			note: 'Where the token sheet is written. The flag wins over the config key. Set neither and it goes to ./hyzer-tokens.css. The utilities sheet follows it, unless utilities.output names a path of its own.'
		},
		{
			name: '--mode <mode>',
			key: null,
			note: '"full" (the default) writes a complete sheet that replaces tokens.css. "overrides" writes a patch sheet to import after it.'
		},
		{
			name: '--utilities',
			key: 'utilities',
			note: 'Also write the utilities sheet. It turns the sheet on even when the config does not. A path set in the config is still used.'
		},
		{
			name: '--check',
			key: null,
			note: 'Resolve and report without writing any files: no token sheet, no utilities sheet, no icons.ts. Pairs with --strict for a CI check that touches nothing.'
		},
		{
			name: '--strict',
			key: null,
			note: 'Exit non-zero if any pairing misses WCAG AA or any icon name is unknown. Without it, both are warnings and the run succeeds. All-or-nothing: it cannot be narrowed to one pairing.'
		},
		{ name: '--help', key: null, note: 'Print the usage summary this table is drawn from.' }
	];

	const configCode = [
		"import { defineConfig } from '@hyzer-labs/ui/config';",
		'',
		'export default defineConfig({',
		"\toutput: 'src/styles/tokens.css',",
		'',
		'\t// Everything under `tokens` is the DEFAULT theme: it lands in the',
		'\t// :root block, which is what a page gets with no data-theme set.',
		'\ttokens: {',
		'\t\tpalette: {',
		"\t\t\tprimary: '#0f766e',                                          // override",
		"\t\t\tfairway: '#3f6212',                                          // add a hue",
		"\t\t\tbrandRed: { 50: '#fef2f2', 500: '#b91c1c', 900: '#7f1d1d' }  // add a ramp",
		'\t\t},',
		'\t\tintent: {',
		"\t\t\tfairway: 'var(--hz-palette-fairway)',      // add an intent",
		"\t\t\t// Intents are graded, so aim at a ramp's middle. Point one at",
		'\t\t\t// the pale or dark end and the report fails that pairing.',
		"\t\t\tbrand: 'var(--hz-palette-brand-red-500)'",
		'\t\t},',
		'\t\ttypography: { fontFamily: { sans: "\'Inter\', system-ui, sans-serif" } },',
		"\t\tdensity: { unit: '0.5rem' }",
		'\t},',
		'',
		'\t// Named variants that override the default, keyed by data-theme.',
		'\tthemes: {',
		'\t\tdark: {',
		"\t\t\tpalette: { primary: '#2dd4bf', fairway: '#a3e635' }",
		'\t\t}',
		'\t}',
		'});'
	].join('\n');

	const reportCode = [
		'$ hyzer generate',
		'config: hyzer.config.ts',
		'wrote src/styles/tokens.css (full, 89 tokens)',
		'contrast: 104 pairings checked, all pass WCAG AA'
	].join('\n');

	const modesCode = [
		'# A complete sheet: import it INSTEAD of tokens.css:',
		'hyzer generate',
		'',
		'# A patch sheet with only your overrides: import it AFTER tokens.css:',
		'hyzer generate --mode overrides',
		'',
		'# Also write the opt-in utilities sheet, next to the tokens sheet:',
		'hyzer generate --utilities',
		'',
		'# Flags compose: a patch sheet AND the utilities sheet, one run:',
		'hyzer generate --mode overrides --utilities',
		'',
		'# Validate without writing; fail CI on any AA miss (and any unknown icon):',
		'hyzer generate --check --strict'
	].join('\n');

	const iconsConfigCode = [
		"import { defineConfig } from '@hyzer-labs/ui/config';",
		'',
		'export default defineConfig({',
		"\t// kebab-case Lucide names: 'plus' is already core (deduped, no warning)",
		"\ticons: ['plus', 'trash-2', 'settings', 'serch']",
		'});'
	].join('\n');

	const iconsReportCode = [
		'$ hyzer generate',
		'wrote hyzer-tokens.css (full, 84 tokens)',
		'wrote icons.ts (16 icons)',
		'contrast: 92 pairings checked, all pass WCAG AA',
		'  ? icons: "serch" is not a valid Lucide icon name, omitted from the barrel',
		'icons: 1 unknown name(s) (warnings; use --strict to fail the build)',
		'icons: 16 included (14 core, 2 configured)'
	].join('\n');

	const utilitiesConfigCode = [
		"import { defineConfig } from '@hyzer-labs/ui/config';",
		'',
		'export default defineConfig({',
		'\t// true opts in with the default filename; { output } picks a custom path',
		'\tutilities: true',
		'});'
	].join('\n');

	const utilitiesReportCode = [
		'$ hyzer generate',
		'config: hyzer.config.ts',
		'wrote hyzer-tokens.css (full, 84 tokens)',
		'wrote hyzer-utilities.css',
		'contrast: 92 pairings checked, all pass WCAG AA'
	].join('\n');

	// The full-reference config (every option commented out, valid as written)
	// is shared with `hyzer init` — one source of truth in $lib/cli/config-template.
	const fullReferenceConfigCode = CONFIG_TEMPLATE.trimEnd();
</script>

<svelte:head>
	<title>Config &amp; CLI — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro>
		{#snippet lead()}
			An optional file. <code>hyzer.config.ts</code> describes your design system once. The
			<code>hyzer</code> CLI turns it into a token sheet, a trimmed icon barrel, and an optional utility
			sheet. Every run checks the result against WCAG AA. Skip the file and you get the defaults.
		{/snippet}
	</DocIntro>

	<Alert intent="warning" title="The config file and the CLI are both optional">
		{#snippet icon()}<IconTriangleAlert />{/snippet}
		<strong>You do not need either one to theme this library.</strong> Plain CSS overrides work on
		their own.
		<a href="/docs/theming/tokens">Tokens &amp; Overrides</a> covers that route. Reach for a config when
		you want your system in one typed file, contrast graded on every build, and a sheet you regenerate
		rather than maintain.
	</Alert>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="config-heading"
	>
		<h2 id="config-heading">Describe your system in one file</h2>
		<p>
			The same engine that generates this library's own <code>tokens.css</code> ships in the
			package. Describe your system once in <code>hyzer.config.ts</code>. Overrides merge over the
			base schema, and new keys extend it. Nested <code>tokens.palette</code> objects generate ramps
			(<code>--hz-palette-brand-red-900</code>) even though the base palette ships none.
		</p>
		<CodeBlock code={configCode} title="hyzer.config.ts" language="ts" />
		<p>
			Every run prints a WCAG contrast report over the resolved tokens. It uses the same math and
			the same pairings that validate this library's own token set. It covers your custom intents
			too:
		</p>
		<CodeBlock code={reportCode} />
		<Alert intent="danger" title="Aim intents at the middle of a ramp">
			{#snippet icon()}<IconTriangleAlert />{/snippet}
			Ramps are free to define. The report grades text and intent tokens against your surfaces, not raw
			palette hues, so extra rungs add no pairings on their own. The cost comes when you point an intent
			at a ramp's end rung. Those rungs are very pale and very dark by design. Neither clears 4.5:1 as
			text, so the report fails that pairing.
			<code>--strict</code> then fails the whole run: it is all-or-nothing and cannot be narrowed to
			certain tokens. Point intents at the middle of a ramp, as <code>brand</code> does above, or run
			without the flag and read the warnings yourself.
		</Alert>
		<p>You choose what it writes. The flags compose:</p>
		<CodeBlock code={modesCode} language="bash" />
		<Alert intent="info" title="TypeScript configs need Node 22.18">
			{#snippet icon()}<IconInfo />{/snippet}
			They load through Node's native type stripping. On older runtimes, name the file
			<code>hyzer.config.mjs</code> instead. You can also import the engine straight from
			<code>@hyzer-labs/ui/config</code> (<code>resolveConfig</code>, <code>generateCss</code>,
			<code>contrastReport</code>) for build scripts of your own.
		</Alert>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="flags-heading"
	>
		<h2 id="flags-heading">Command-line flags</h2>
		<p>
			The flags and the config file cover different ground, on purpose. Three flags have no config
			equivalent at all, because they describe a single run rather than your design system. Most of
			the config (<code>tokens</code>, <code>themes</code>, <code>icons</code>) has no flag, because
			none of it belongs on a command line.
		</p>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Flag</th>
						<th scope="col">Config key</th>
						<th scope="col">What it does</th>
					</tr>
				</thead>
				<tbody>
					{#each cliFlags as flag (flag.name)}
						<tr>
							<td><code>{flag.name}</code></td>
							<td
								>{#if flag.key}<code>{flag.key}</code>{:else}—{/if}</td
							>
							<td>{flag.note}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="icons-config-heading"
	>
		<h2 id="icons-config-heading">Trim the icon set</h2>
		<p>
			The config reaches <a href="/docs/components/icons">icons</a> too: an optional
			<code>icons: string[]</code>
			list of kebab-case Lucide names. <code>hyzer generate</code> emits an <code>icons.ts</code>
			module next to the tokens sheet. It re-exports each icon by name from the
			<code>@hyzer-labs/ui/icons/&lt;name&gt;</code>
			deep paths, covering your list plus the library's always-shipped core set (the chevrons, close,
			menu, and the rest its own components depend on). Your app's autocomplete then offers your own icon
			vocabulary rather than the full 1,700-plus Lucide names.
		</p>
		<CodeBlock code={iconsConfigCode} title="hyzer.config.ts" language="ts" />
		<p>
			List a core icon explicitly and it is deduplicated into the core group with no warning. An
			unknown name is a report warning by default; <code>--strict</code> turns it into a failing
			run. Either way the icon is left out of the emitted barrel. Omit the <code>icons</code> key
			and
			<code>hyzer generate</code>
			writes no <code>icons.ts</code> at all and skips that report section.
			<code>icons: []</code> behaves differently: the empty array is a valid, minimal config that does
			write the file, holding the core set on its own.
		</p>
		<CodeBlock code={iconsReportCode} />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="utilities-config-heading"
	>
		<h2 id="utilities-config-heading">Generate the utilities sheet</h2>
		<p>
			The <a href="/docs/foundation/utilities">opt-in utilities sheet</a> is engine output too. Set
			<code>utilities: true</code>
			in the config and <code>hyzer generate</code> writes <code>hyzer-utilities.css</code> next to
			the tokens sheet. The object form, <code>utilities: {"{ output: '...' }"}</code>, picks a
			custom path. Leave the key out (the default) and you get no utilities file.
		</p>
		<p>
			<code>--utilities</code> on the command line does the same. It turns the sheet on even when the
			config does not. A path you set in the config is still used.
		</p>
		<CodeBlock code={utilitiesConfigCode} title="hyzer.config.ts" language="ts" />
		<CodeBlock code={utilitiesReportCode} />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="full-reference-heading"
	>
		<h2 id="full-reference-heading">Full config reference</h2>
		<p>
			Every group <code>hyzer.config.ts</code> accepts, in one file and commented out. Uncomment
			what you need and delete the rest. Each line's comment names the tokens it drives.
			<code>npx hyzer init</code> writes this file into your project to start from. On SvelteKit,
			the
			<code>npx sv add @hyzer-labs</code> add-on offers it during setup.
		</p>
		<CodeBlock code={fullReferenceConfigCode} title="hyzer.config.ts" language="ts" />
	</Stack>

	<WhereNext items={nextSteps} />
</Stack>

<style>
	/* Muted notes use the shipped .tab-note class; inline code chips and the
	   heading scaffold come from the docs sheet too. Only the margin reset
	   the density Stack needs is local. */
	p {
		margin: 0;
		line-height: var(--hz-line-height-base, 1.5);
	}

	/* Flag table — the docs-wide token-table look. The note column wraps;
	   only the flag and config-key cells stay on one line. */
	.token-table-wrapper {
		overflow-x: auto;
	}

	.token-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.token-table th,
	.token-table td {
		text-align: left;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
		vertical-align: top;
	}

	.token-table th {
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.token-table td:nth-child(1),
	.token-table td:nth-child(2) {
		white-space: nowrap;
	}
</style>
