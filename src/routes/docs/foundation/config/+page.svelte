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
			note: 'Where the token sheet is written. The config key is relative to the config file. The flag is relative to where you run the command, and wins when both are set. With neither set, the sheet lands beside your config, or in the directory you ran from if no config is found. The utilities sheet follows it, unless utilities.output names a path of its own.'
		},
		{
			name: '--mode <mode>',
			key: null,
			note: '"full" (the default) writes a complete sheet that replaces tokens.css. "overrides" writes a patch sheet to import after it.'
		},
		{
			name: '--selector <selector>',
			key: 'selector',
			note: 'Where the generated sheet is rooted. Defaults to :root. A class or an id scopes the whole sheet to that element and everything inside it. The flag wins over the config key.'
		},
		{
			name: '--utilities',
			key: 'utilities',
			note: 'Also write the utilities sheet. It turns the sheet on even when the config does not. A path set in the config is still used.'
		},
		{
			name: '--check',
			key: null,
			note: 'Resolve and report without writing any files: no token sheet, no utilities sheet, no icons.ts. It also compares the files already on disk to what this run would write. A committed sheet that has fallen behind your config is reported. Pairs with --strict for a CI check that touches nothing.'
		},
		{
			name: '--strict',
			key: 'strict',
			note: 'Exit non-zero if any pairing misses the contrast bar, any icon name is unknown, or a checked file is out of date. A file that was never generated is reported but does not fail the build. Without --strict, all three are warnings and the run succeeds. The strict config key does the same; the flag turns it on even when the config does not.'
		},
		{ name: '--help', key: null, note: 'Print the usage summary this table is drawn from.' }
	];

	const configCode = [
		"import { defineConfig } from '@hyzer-labs/ui/config';",
		'',
		'export default defineConfig({',
		"\toutput: 'src/styles/tokens.css',",
		"\tdefaultThemeName: 'brand', // names the tokens block below; default 'default'",
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
		"\t\tdensity: { unit: '0.5rem' },",
		'\t\t// Per-component theme hooks, camelCased, no --hz- prefix. These are',
		'\t\t// the custom properties each component page lists under Theme hooks.',
		"\t\tcomponents: { buttonAccent: 'var(--hz-intent-secondary)', badgeTint: '20%' }",
		'\t},',
		'',
		'\t// Named variants that override the default, keyed by data-theme.',
		'\t// A theme takes any group `tokens` takes, not only color.',
		'\tthemes: {',
		'\t\tdark: {',
		"\t\t\tpalette: { primary: '#2dd4bf', fairway: '#a3e635' }",
		'\t\t},',
		"\t\tprint: { typography: { fontSize: { base: '0.9rem' } }, radius: { md: '0' } }",
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
		'# A sheet scoped to a class, for a region with its own palette:',
		'hyzer generate --mode overrides --selector .theme-ocean',
		'',
		'# Validate without writing; fail CI on a contrast miss, an unknown icon,',
		"# or a committed sheet that's fallen behind the config:",
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

	const scopeCommandCode =
		'hyzer generate --mode overrides --selector .theme-ocean --out src/styles/ocean.css';

	const scopeConfigCode = [
		"import { defineConfig } from '@hyzer-labs/ui/config';",
		'',
		'export default defineConfig({',
		"\tselector: '.theme-ocean',",
		"\toutput: 'src/styles/ocean.css',",
		'\t// ...tokens, themes, etc.',
		'});'
	].join('\n');

	const scopeMarkupCode = [
		'<div class="theme-ocean">',
		"\t<!-- Ocean's palette applies here, light by default. -->",
		'\t<section data-theme="dark">',
		'\t\t<!-- Same palette, dark now: the class and the attribute compose. -->',
		'\t</section>',
		'</div>'
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
			<code>defaultThemeName</code> names the theme above rather than overriding any of its tokens.
			It has no command-line flag, because a theme's name describes your system, not one run. Set it
			to <code>'light'</code> to get back the block earlier versions of this library shipped: that
			is the one-line migration if you are upgrading. Dark has no matching key, because
			<code>dark</code> is the platform's own name rather than this library's, so it stays fixed.
			See
			<a href="/docs/theming/sections#config-heading">Define your themes</a> for the reasoning, and for
			how to change dark itself.
		</p>
		<p>
			<code>components</code> reaches the per-component custom properties too: the same knobs each
			component page lists under <strong>Theme hooks</strong>, such as a button's accent color or a
			badge's tint strength. Set one here and the generator writes the rule on that component's own
			class, once, for the whole system. You maintain no CSS override of your own.
		</p>
		<p>
			Hooks belong under <code>tokens</code> only. A named theme cannot carry them, so point a hook at
			a token when you want its value to change per theme.
		</p>
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
		<p>
			"Out of date" means the file on disk is not what your config would produce right now. A
			library upgrade counts too: new token values or comment text leave a committed sheet stale
			until you regenerate it.
		</p>
		<p>
			<code>--check</code> expects the sheet to have been written with the same
			<code>--mode</code> you are checking with, so a mode mismatch is reported by name instead of as
			a wall of differences. A file you never committed is reported as not generated. It does not fail
			the build, so generating the sheet at build time instead of committing it stays a supported workflow.
		</p>
		<Alert intent="info" title="TypeScript configs need Node 22.18">
			{#snippet icon()}<IconInfo />{/snippet}
			They load through Node's native type stripping. On older runtimes, name the file
			<code>hyzer.config.mjs</code> instead. You can also import the engine straight from
			<code>@hyzer-labs/ui/config</code> (<code>resolveConfig</code>, <code>generateCss</code>,
			<code>contrastReport</code>) if you'd rather drive it from your own script than use the CLI.
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
			The flags and the config file cover different ground, on purpose. A flag that describes a
			single run has no config key: <code>--config</code>, <code>--mode</code>,
			<code>--check</code> and <code>--help</code>. Everything that describes your design system
			lives in the config instead, such as <code>tokens</code>, <code>themes</code>,
			<code>defaultThemeName</code>, <code>icons</code> and <code>contrast</code>. Four flags have
			both (<code>--out</code>,
			<code>--utilities</code>, <code>--strict</code> and <code>--selector</code>), so one run can
			override the file, with the flag winning.
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
		aria-labelledby="scope-heading"
	>
		<h2 id="scope-heading">Scope the sheet to a class</h2>
		<p>
			By default the generated sheet roots at <code>:root</code>, and the whole page picks it up.
			Sometimes one region needs its own palette and still has to follow the page between light and
			dark. A <code>themes</code> entry cannot do that, because one <code>data-theme</code>
			attribute holds one name at a time. Root the sheet at a class instead, and put that class on the
			region:
		</p>
		<CodeBlock code={scopeCommandCode} language="bash" />
		<p>
			The config key does the same, so a plain <code>hyzer generate</code> already produces the scoped
			sheet:
		</p>
		<CodeBlock code={scopeConfigCode} title="hyzer.config.ts" language="ts" />
		<p>Set both and the flag wins.</p>
		<p>
			Put the class on a wrapper, and <code>data-theme</code> keeps working inside it, on its own element:
		</p>
		<CodeBlock code={scopeMarkupCode} language="html" />
		<p>
			A scoped sheet re-declares more than the tokens you touched. The two-layer color model reads
			through <code>var()</code>, and a chain like
			<code>--hz-intent-primary: var(--hz-palette-primary)</code>
			has already resolved once it reaches <code>:root</code>. Declared only there, it would keep
			the base color under your scope no matter what you set. The generator re-declares every token
			that depends on one you changed, under the class, so the whole chain repaints there instead.
		</p>
		<p>
			<code>selector</code> accepts <code>:root</code>, one class (<code>.theme-ocean</code>) or one
			id (<code>#app</code>): one simple selector, with no combinators, commas or attribute
			selectors. Anything else is a config error that names <code>selector</code> and the accepted forms.
		</p>
		<p>
			The <a href="/docs/foundation/utilities">utilities sheet</a> is never scoped, even on a scoped
			run. A utility class reads its value through <code>var()</code>, so it already paints from the
			region's tokens when it's used inside one. Scoping the class itself would make it stop working
			everywhere else on the page.
		</p>
		<p>
			Import order does not change. An overrides sheet still imports after
			<code>tokens.css</code>, scoped or not.
		</p>
		<p>
			<code>--check</code> reads the sheet's own record of what it was scoped to, so a run that
			disagrees names both sides instead of reporting the whole file as changed. Set
			<code>selector</code>
			in the config instead of passing the flag. A check run then reads the same key, so the two can never
			disagree.
		</p>
		<p>
			A full-mode scoped sheet has no automatic <code>prefers-color-scheme</code> block, because
			that block is only wired at <code>:root</code>. A scoped region follows light and dark through
			<code>data-theme</code> instead, on the region itself or on <code>&lt;html&gt;</code>.
		</p>
		<Alert intent="info" title="Most projects never need this">
			{#snippet icon()}<IconInfo />{/snippet}
			A named theme is simpler and covers almost every case.
			<a href="/docs/theming/sections#class-heading">Section themes</a> explains when this is the right
			tool instead.
		</Alert>
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
			what you need and delete the rest. Each line's comment names the tokens it drives. The values
			shown are the current defaults, so uncommenting a line changes nothing until you edit it.
			<code>npx hyzer init</code> writes this file into your project to start from. On SvelteKit,
			the
			<code>npx sv add @hyzer-labs</code> add-on offers it during setup.
		</p>
		<CodeBlock
			code={fullReferenceConfigCode}
			title="hyzer.config.ts"
			language="ts"
			collapsible
			collapsedLines={19}
		/>
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
