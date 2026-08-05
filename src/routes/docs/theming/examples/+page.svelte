<script lang="ts">
	import {
		Stack,
		Tabs,
		Button,
		Badge,
		Alert,
		Cluster,
		Card,
		TextInput,
		Toggle,
		Accordion,
		CodeBlock
	} from '$lib';
	import { resolveConfig, generateCss } from '$lib/config';
	import oceanConfig from '$lib/theme/examples/ocean.config';
	import oceanSource from '$lib/theme/examples/ocean.config.ts?raw';
	import oceanCss from '$lib/theme/examples/ocean.css?raw';
	import terminalSource from '$lib/theme/examples/terminal/terminal.config.ts?raw';
	import terminalIndex from '$lib/theme/examples/terminal/terminal.css?raw';
	import terminalButton from '$lib/theme/examples/terminal/components/button.css?raw';
	import terminalToggle from '$lib/theme/examples/terminal/components/toggle.css?raw';
	import terminalIntents from '$lib/theme/examples/terminal/intents.d.ts?raw';
	import docsCss from '$lib/theme/examples/docs/docs.css?raw';
	import { consumerSource } from '../../../../docs/consumerSource';

	// The class-override theme is imported as the REAL shipped sheet — every
	// rule in it is rooted at .hz-theme-<id>, so nothing reaches :root and the
	// docs app's own theme is untouched, which is the invariant. Ocean can't
	// do this: it's a :root sheet by design, so it gets re-generated scoped
	// below instead. Docs needs no such gymnastics: it is UNSCOPED and already
	// loaded globally by the root layout, so its tier below runs on the real,
	// live, dogfooded sheet with no extra import at all.
	import '$lib/theme/examples/terminal/terminal.css';
	import DocIntro from '../../../../docs/DocIntro.svelte';
	import IconInfo from '$lib/icons/generated/info.svelte';

	const scopedOceanCss = generateCss(resolveConfig(oceanConfig), {
		mode: 'overrides',
		selector: '.theme-ocean'
	});

	const docsImports = [
		"import '@hyzer-labs/ui/tokens.css';",
		"import '@hyzer-labs/ui/theme';                     // layers under it",
		"import '@hyzer-labs/ui/theme/examples/docs/docs.css';"
	];

	interface Example {
		id: string;
		label: string;
		/** The class that activates the theme, or '' for the unscoped Docs tier / runtime-scoped Ocean. */
		themeClass: string;
		blurb: string;
		imports: string[];
		/** false for a tier with no hyzer.config — Docs is hand-authored, not engine-generated. */
		hasConfig: boolean;
		source: string;
		sheets: { id: string; label: string; code: string }[];
	}

	// The freedom axis is how much of the reference theme a tier keeps, not
	// whether it sets a palette — read that way, Docs is squarely ON it, not
	// beside it: Ocean keeps all of the reference theme and only redefines
	// tokens; Docs keeps all of it too and layers one class-hook override on
	// top, adding no palette; Terminal keeps none of it. Docs sits in the
	// middle — the slot Sunset held before its retirement — as a peer tier.
	const examples: Example[] = [
		{
			id: 'ocean',
			label: 'Ocean: tokens only',
			themeClass: 'theme-ocean',
			blurb:
				'Not one class hook. Every difference below comes from redefining --hz-* tokens; the reference theme does the rest of the work, unchanged.',
			imports: [
				"import '@hyzer-labs/ui/tokens.css';",
				"import '@hyzer-labs/ui/theme';",
				"import '@hyzer-labs/ui/theme/examples/ocean.css';"
			],
			hasConfig: true,
			source: consumerSource(oceanSource),
			sheets: [{ id: 'css', label: 'Generated CSS', code: oceanCss }]
		},
		{
			id: 'docs',
			label: 'Docs: layered on the reference theme',
			themeClass: '',
			blurb:
				'Adds no palette at all. Every rule below resolves through the reference theme’s own role and intent tokens, unchanged. On top it layers page-rhythm scaffold classes and one class-hook override. You import it like any other theme sheet, and it needs no class anywhere.',
			imports: docsImports,
			hasConfig: false,
			source: '',
			sheets: [{ id: 'source', label: 'docs.css', code: docsCss }]
		},
		{
			id: 'terminal',
			label: 'Terminal: standalone',
			themeClass: 'hz-theme-terminal',
			blurb:
				'Every rule below is the example’s own, written against the raw headless hooks. The components ship structure, behavior and ARIA. Nothing here inherits a visual decision from the reference theme.',
			imports: [
				"import '@hyzer-labs/ui/tokens.css';",
				"// NO '@hyzer-labs/ui/theme': that is the point.",
				"import '@hyzer-labs/ui/theme/examples/terminal/terminal.css';"
			],
			hasConfig: true,
			source: consumerSource(terminalSource),
			sheets: [
				{ id: 'index', label: 'terminal.css', code: terminalIndex },
				{ id: 'button', label: 'button.css', code: terminalButton },
				{ id: 'toggle', label: 'toggle.css', code: terminalToggle },
				{ id: 'intents', label: 'intents.d.ts', code: consumerSource(terminalIntents) }
			]
		}
	];

	const viewTabs = (example: Example) => [
		{ id: 'demo', label: 'Demo' },
		...(example.hasConfig ? [{ id: 'config', label: 'hyzer.config' }] : []),
		...example.sheets.map((s) => ({ id: s.id, label: s.label }))
	];

	const faq = [{ id: 'why-class', title: 'Why does Terminal use a class instead of :root?' }];

	const registryCode = [
		'// hyzer.config.ts: define the token, and it gets contrast-graded',
		"import { defineConfig } from '@hyzer-labs/ui/config';",
		'',
		'export default defineConfig({',
		'\ttokens: {',
		'\t\tintent: {',
		"\t\t\tphosphor: 'var(--hz-palette-primary)',",
		"\t\t\tamber: '#ffb000'",
		'\t\t}',
		'\t}',
		'});'
	].join('\n');

	const registryStyleCode = [
		'/* a standalone theme sheet: one rule per intent, same shape as the built-ins */',
		".hz-button[data-intent='amber'] {",
		'\t--hz-button-accent: var(--hz-intent-amber);',
		'}'
	].join('\n');

	const ctaCode = [
		'<Button class="cta">Book a round</Button>',
		'',
		'<' + 'style>',
		'\t/* Rendered as class="hz-button cta". One instance, styled by you.',
		'\t   The theme sheet never mentions .cta at all. */',
		'\t:global(.hz-theme-terminal .hz-button.cta) {',
		'\t\tbox-shadow: 8px 8px 0 var(--hz-intent-danger);',
		'\t\ttranslate: -2px -2px;',
		'\t}',
		'</' + 'style>'
	].join('\n');

	const accordionItems = [
		{ id: 'a', title: 'What is in the bag?' },
		{ id: 'b', title: 'Course conditions' }
	];
</script>

<svelte:head>
	<title>Example Themes — @hyzer-labs/ui</title>
	<!-- Engine-generated CSS from our own committed config — no user input. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<style>${scopedOceanCss}</style>`}
</svelte:head>

{#snippet demoPanel(themeId: string)}
	<Stack gap="md">
		<Cluster gap="sm" align="center">
			<Button>Book a round</Button>
			<Button variant="outline" intent="secondary">Scorecards</Button>
			<Button variant="ghost" intent="danger">Delete</Button>
			<Button class="cta">Go pro</Button>
		</Cluster>

		<!-- The full intent vocabulary. Button's intent prop spans the whole
		     IntentRegistry, so every one of these is a first-class intent — and
		     under Terminal, the last two are intents the library never shipped. -->
		<Cluster gap="sm" align="center">
			<Button size="sm" intent="warning" variant="outline">Warning</Button>
			<Button size="sm" intent="success" variant="outline">Success</Button>
			<Button size="sm" intent="info" variant="outline">Info</Button>
			<Button size="sm" intent="neutral" variant="outline">Neutral</Button>
			{#if themeId === 'terminal'}
				<Button size="sm" intent="phosphor" variant="outline">Phosphor</Button>
				<Button size="sm" intent="amber" variant="outline">Amber</Button>
			{/if}
		</Cluster>

		<Cluster gap="sm" align="center">
			<Badge intent="success">Par saved</Badge>
			<Badge intent="warning" variant="soft">Windy</Badge>
			<Badge intent="info" variant="outline">Hole 7</Badge>
			<Badge intent="danger" variant="solid">OB</Badge>
			<Badge intent="neutral" variant="outline">Casual</Badge>
		</Cluster>

		<Alert intent="info" title="Course update" headingLevel={3}>
			{#snippet icon()}<IconInfo />{/snippet}
			Hole 7 tee pad moves back to the long position this weekend.
		</Alert>

		<Card class="hz-card--elevated" padding="md">
			<h3 class="hz-card-title">Next tee time</h3>
			Saturday, 8:40, Maple Hill.
			{#snippet actions()}
				<Button size="sm">Confirm</Button>
				<Button size="sm" variant="ghost" intent="neutral">Reschedule</Button>
			{/snippet}
		</Card>

		<div class="demo-col">
			<Stack gap="sm">
				<TextInput name="{themeId}-player" label="Player name" placeholder="Jane Doe" />
				<TextInput
					name="{themeId}-score"
					label="Score"
					value="-3"
					error="Score must be a whole number"
				/>
				<Toggle name="{themeId}-wind" label="Track wind speed" checked />
			</Stack>
		</div>

		<Accordion items={accordionItems} defaultOpen="a" headingLevel={3}>
			{#snippet panel(item)}
				{#if item.id === 'a'}
					Three drivers, a midrange, and misplaced optimism.
				{:else}
					Fairways dry, greens rolling fast.
				{/if}
			{/snippet}
		</Accordion>
	</Stack>
{/snippet}

<Stack gap="away">
	<DocIntro>
		{#snippet lead()}
			Three example themes, sorted by how much of the reference theme each one keeps. Ocean keeps
			all of it and only redefines <code>--hz-*</code> tokens. Docs keeps all of it too and layers
			one class-hook override on top, with no palette of its own. Terminal keeps none of it. Ocean
			and Terminal are generated from a <code>hyzer.config.ts</code> beside them. Like the base
			tokens, they meet <a href="/docs/foundation/contrast">WCAG AA on every graded pairing</a>, in
			the default theme and in dark. All three, compared:
		{/snippet}
	</DocIntro>

	<div class="token-table-wrapper intro-table">
		<table class="token-table">
			<thead>
				<tr>
					<th scope="col"></th>
					<th scope="col">Ocean</th>
					<th scope="col">Docs</th>
					<th scope="col">Terminal</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<th scope="row">Palette via config</th>
					<td>yes</td>
					<td>none — rides the reference theme</td>
					<td>yes</td>
				</tr>
				<tr>
					<th scope="row">Class-hook overrides</th>
					<td>none</td>
					<td>one (<code>.docs-table</code>)</td>
					<td>yes</td>
				</tr>
				<tr>
					<th scope="row">Reference theme</th>
					<td>required</td>
					<td>layers over it</td>
					<td><strong>not imported</strong></td>
				</tr>
				<tr>
					<th scope="row">Adds new intents</th>
					<td>no</td>
					<td>no</td>
					<td><strong>phosphor, amber</strong></td>
				</tr>
				<tr>
					<th scope="row">Scoped to a class</th>
					<td>runtime-scoped demo only</td>
					<td><strong>unscoped</strong> — no class to add anywhere</td>
					<td><code>.hz-theme-terminal</code></td>
				</tr>
			</tbody>
		</table>
	</div>
	<p class="intro-follow">
		Ocean is one end: it shows how far tokens alone get you. Terminal is the other end: it never
		imports the reference theme, so every rule in it is its own. It also grows the system rather
		than only recoloring it, with two intents the library has never heard of, type-checked and
		contrast-graded like any built-in. Docs sits between them: the same class-hook contract every
		component ships is enough to extend the reference theme without forking it. If you only read one
		file, read Terminal's <code>button.css</code>: that is what "headless" actually buys you.
	</p>

	{#each examples as example (example.id)}
		<Stack
			as="section"
			gap="away"
			data-density-shift
			class="doc-section"
			aria-labelledby="{example.id}-heading"
		>
			<h2 id="{example.id}-heading">{example.label}</h2>
			<p>{example.blurb}</p>
			{#if example.id === 'docs'}
				<p class="tab-note">
					The full <code>.docs-table</code> walkthrough lives on
					<a href="/docs/theming/components#cascade-heading">Styling Components</a>: why unlayered
					beats layered, with a demo and the source. This is, verbatim, the sheet
					<code>design.hyzer.sh</code> imports for its own chrome. You're reading it right now.
				</p>
			{/if}
			<CodeBlock code={example.imports.join('\n')} />
			<Tabs items={viewTabs(example)} ariaLabel="{example.label} views" defaultTab="demo">
				{#snippet panel(item)}
					<div class="tab-content">
						{#if item.id === 'demo'}
							<div class="{example.themeClass} demo-panel">
								{@render demoPanel(example.id)}
							</div>
						{:else if item.id === 'config'}
							<CodeBlock code={example.source} />
						{:else}
							<CodeBlock code={example.sheets.find((s) => s.id === item.id)?.code ?? ''} />
						{/if}
					</div>
				{/snippet}
			</Tabs>
		</Stack>
	{/each}

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="instance-heading"
	>
		<h2 id="instance-heading">Style one instance by hand</h2>
		<p>
			Every demo above uses the same markup for the "Go pro" button:
			<code>&lt;Button class="cta"&gt;</code>. The <code>class</code> prop is merged after the
			component's <code>hz-button</code> root class, so it lands on the element ready for you to style.
			Sheet-level and instance-level overrides compose. Ocean and Terminal each add one, below. Docs adds
			none: an unscoped sheet has no class to hang a demo-only rule on, so its "Go pro" button renders
			exactly as the reference theme paints it.
		</p>
		<CodeBlock code={ctaCode} />
		<p class="tab-note">
			Note the selector: <code>.hz-theme-terminal .hz-button.cta</code>, not a bare
			<code>.cta</code>. Terminal is the one example here that roots its overrides at a class. The
			section below covers why.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="intents-heading"
	>
		<h2 id="intents-heading">Grow the intent vocabulary</h2>
		<p>
			The intents the library ships are a starting set. A component only stamps <code
				>data-intent="&lt;name&gt;"</code
			>
			and lets the theme decide what that name looks like. So the set of intents belongs to your theme.
			Terminal adds two:
			<code>phosphor</code> and <code>amber</code>, the two tubes every real terminal shipped with.
			They are the last two buttons in its demo above.
		</p>
		<p>Three steps. With the reference theme, the last one is nothing at all:</p>
		<ol>
			<li>
				<strong>Define the token</strong> in your config. The generator emits it as
				<code>--hz-intent-amber</code>, and
				<a href="/docs/foundation/contrast">the contrast report grades it</a> exactly like
				<code>primary</code>. A custom intent meets the same AA bar as a built-in one.
			</li>
			<li>
				<strong>Register the type</strong> by augmenting <code>IntentRegistry</code>. Now
				<code>intent="amber"</code> type-checks and autocompletes on every component, and
				<code>intent="ambr"</code> is a compile error. See the
				<code>intents.d.ts</code> tab above.
			</li>
			<li>
				<strong>Nothing to style.</strong> With the reference theme, running
				<code>hyzer generate</code> wires the intent into every component that takes one (<code
					>Button</code
				>, <code>Badge</code>, <code>Alert</code>, and the rest) the moment the token exists.
			</li>
		</ol>
		<CodeBlock code={registryCode} />
		<p class="tab-note">
			Augment the module that <em>declares</em> the interface (<code>@hyzer-labs/ui/types</code>),
			not the barrel that re-exports it. TypeScript merges an interface only into its declaring
			module, so <code>declare module '@hyzer-labs/ui'</code> would silently do nothing.
		</p>
		<p>
			A theme that replaces the reference theme outright, like Terminal, owns its intent vocabulary
			and maps it by hand. That means one rule per intent, per component, which is what a built-in
			intent needs there too:
		</p>
		<CodeBlock code={registryStyleCode} />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="how-heading"
	>
		<h2 id="how-heading">How these work</h2>
		<Accordion items={faq} headingLevel={3}>
			{#snippet panel(item)}
				{#if item.id === 'why-class'}
					<p>
						Every rule in Terminal is rooted at a class: <code>.hz-theme-terminal .hz-button</code>
						rather than <code>.hz-button</code>. The engine generates its token block with the
						<code>selector</code>
						option instead of <code>:root</code>. So the theme travels with the class: put it on
						<code>&lt;html&gt;</code> to own a document, or on one element to own a panel. That is why
						this page can render an Ocean panel and a Terminal panel side by side without them fighting.
						It is also why importing this sheet does not disturb the docs site's own theme.
					</p>
				{/if}
			{/snippet}
		</Accordion>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="fork-heading"
	>
		<h2 id="fork-heading">Start from one</h2>
		<p>
			Copy a config into your project as <code>hyzer.config.ts</code>, run
			<code>hyzer generate</code>, and iterate. The contrast report grades every change. To go
			further than color, copy the theme's <code>components/</code> folder too and edit the hooks
			directly.
			<a href="/docs/theming/components">Styling Components</a> is the reference for what each hook
			exposes, and
			<a href="/docs/theming/tokens">Tokens &amp; Overrides</a> covers the token workflow.
		</p>
		<p class="tab-note">
			Coverage: Terminal restyles Button, Badge, Alert, Card, the Field scaffold, TextInput, Toggle,
			Tabs, and Accordion. It imports no theme, so anything else falls back to bare headless
			structure. Docs takes the opposite approach: it restyles no <em>bare</em> component hook, so a
			Table with no <code>.docs-table</code> wrapper looks exactly as the reference theme paints it. Over
			that theme it adds only scaffold classes, content chrome, and that one opt-in wrapper.
		</p>
	</Stack>
</Stack>

<style>
	/* Margins zeroed below — every <p>, CodeBlock, and .token-table-wrapper
	 * outside .doc-intro is a direct child of a .doc-section Stack (gap="away",
	 * data-density-shift), which owns the space between them. .doc-intro is a
	 * plain div, not a Stack, so its own children (.doc-description, the
	 * comparison table, the follow-up paragraph) keep explicit local margins. */
	p {
		margin: 0;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	/* Trailing tab-note in three sections above — docs.css's shared 1rem
	 * bottom margin would otherwise stack on top of the section's own gap. */
	:global(.tab-note:last-child) {
		margin-bottom: 0;
	}

	/* The why-class Accordion panel renders a single <p> — no stacking margin
	 * concern, but the Accordion's panel content isn't a Stack of its own, so
	 * any future second paragraph needs the same local margin as below. */
	:global(.hz-accordion-panel p) {
		margin: 0 0 1rem;
	}

	:global(.hz-accordion-panel p:last-child) {
		margin-bottom: 0;
	}

	.token-table-wrapper {
		overflow-x: auto;
	}

	.intro-table {
		margin: 1rem 0;
	}

	.intro-follow {
		margin: 0;
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

	/* Painted from the scoped theme's own tokens (Ocean, Terminal); for the
	 * unscoped Docs example this just paints from the page's own tokens,
	 * which is the whole point — it needs no theme class to look right. */
	.demo-panel {
		padding: 1.5rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		background-color: var(--hz-color-surface, #fff);
		color: var(--hz-color-text, #000);
	}

	/*
	 * The per-instance override. These are consumer rules — the theme
	 * sheets never mention .cta. They carry the theme's root class AND the
	 * component's root class (0-3-0) because the example themes are unlayered
	 * at 0-2-0: unlike the reference theme, they don't lose to a bare class.
	 */
	:global(.theme-ocean .hz-button.cta) {
		box-shadow:
			0 0 0 3px var(--hz-color-surface),
			0 0 0 5px var(--hz-intent-primary);
	}

	:global(.hz-theme-terminal .hz-button.cta) {
		box-shadow: 8px 8px 0 var(--hz-intent-danger, #cc0000);
		translate: -2px -2px;
	}
</style>
