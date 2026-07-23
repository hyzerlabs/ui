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
		Accordion
	} from '$lib';
	import { resolveConfig, generateCss } from '$lib/config';
	import oceanConfig from '$lib/theme/examples/ocean.config';
	import oceanSource from '$lib/theme/examples/ocean.config.ts?raw';
	import oceanCss from '$lib/theme/examples/ocean.css?raw';
	import sunsetSource from '$lib/theme/examples/sunset/sunset.config.ts?raw';
	import sunsetIndex from '$lib/theme/examples/sunset/sunset.css?raw';
	import sunsetButton from '$lib/theme/examples/sunset/components/button.css?raw';
	import sunsetToggle from '$lib/theme/examples/sunset/components/toggle.css?raw';
	import terminalSource from '$lib/theme/examples/terminal/terminal.config.ts?raw';
	import terminalIndex from '$lib/theme/examples/terminal/terminal.css?raw';
	import terminalButton from '$lib/theme/examples/terminal/components/button.css?raw';
	import terminalToggle from '$lib/theme/examples/terminal/components/toggle.css?raw';
	import terminalIntents from '$lib/theme/examples/terminal/intents.d.ts?raw';
	import CodeBlock from '../../../docs/CodeBlock.svelte';
	import { consumerSource } from '../../../docs/consumerSource';

	// The class-override themes are imported as the REAL shipped sheets — every
	// rule in them is rooted at .hz-theme-<id>, so nothing reaches :root and the
	// docs app's own theme is untouched (specs/30 R2's invariant). Ocean can't
	// do this: it's a :root sheet by design, so it gets re-generated scoped
	// below instead.
	import '$lib/theme/examples/sunset/sunset.css';
	import '$lib/theme/examples/terminal/terminal.css';

	const scopedOceanCss = generateCss(resolveConfig(oceanConfig), {
		mode: 'overrides',
		selector: '.theme-ocean'
	});

	interface Example {
		id: string;
		label: string;
		/** The class that activates the theme, or '' for the runtime-scoped Ocean. */
		themeClass: string;
		blurb: string;
		imports: string[];
		source: string;
		sheets: { id: string; label: string; code: string }[];
	}

	const examples: Example[] = [
		{
			id: 'ocean',
			label: 'Ocean — tokens only',
			themeClass: 'theme-ocean',
			blurb:
				'Not one class hook. Every difference below comes from redefining --hz-* tokens; the reference theme does the rest of the work, unchanged.',
			imports: [
				"import '@hyzer-labs/ui/tokens.css';",
				"import '@hyzer-labs/ui/theme';            // optional",
				"import '@hyzer-labs/ui/theme/examples/ocean.css';"
			],
			source: consumerSource(oceanSource),
			sheets: [{ id: 'css', label: 'Generated CSS', code: oceanCss }]
		},
		{
			id: 'sunset',
			label: 'Sunset — tokens + class overrides',
			themeClass: 'hz-theme-sunset',
			blurb:
				'The same palette trick as Ocean, plus unlayered class rules that re-shape the components: extruded surfaces, pill radii, controls that press inward. It still imports the reference theme — anything these sheets leave alone keeps the theme’s look.',
			imports: [
				"import '@hyzer-labs/ui/tokens.css';",
				"import '@hyzer-labs/ui/theme';            // required here",
				"import '@hyzer-labs/ui/theme/examples/sunset/sunset.css';"
			],
			source: consumerSource(sunsetSource),
			sheets: [
				{ id: 'index', label: 'sunset.css', code: sunsetIndex },
				{ id: 'button', label: 'button.css', code: sunsetButton },
				{ id: 'toggle', label: 'toggle.css', code: sunsetToggle }
			]
		},
		{
			id: 'terminal',
			label: 'Terminal — standalone',
			themeClass: 'hz-theme-terminal',
			blurb:
				'No reference theme at all. Every rule below is the example’s own, written against the raw headless hooks — the components ship structure, behavior and ARIA, and nothing here inherits a single visual decision from the library.',
			imports: [
				"import '@hyzer-labs/ui/tokens.css';",
				"// NO '@hyzer-labs/ui/theme' — that is the point.",
				"import '@hyzer-labs/ui/theme/examples/terminal/terminal.css';"
			],
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
		{ id: 'config', label: 'hyzer.config' },
		...example.sheets.map((s) => ({ id: s.id, label: s.label }))
	];

	const faq = [
		{ id: 'why-class', title: 'Why do these themes use a class instead of :root?' },
		{ id: 'why-wins', title: 'Why do the overrides win without !important?' }
	];

	const registryCode = [
		'// hyzer.config.ts — define the token, and it gets contrast-graded',
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
		'/* your theme sheet — one rule per intent, same shape as the built-ins */',
		".hz-button[data-intent='amber'] {",
		'\t--hz-button-accent: var(--hz-intent-amber);',
		'}'
	].join('\n');

	const ctaCode = [
		'<Button class="cta">Book a round</Button>',
		'',
		'<' + 'style>',
		'\t/* Rendered as class="hz-button cta". One instance, styled by the',
		'\t   consumer — the theme sheets never mention .cta at all. */',
		'\t:global(.hz-theme-terminal .hz-button.cta) {',
		'\t\tbox-shadow: 8px 8px 0 var(--hz-intent-danger);',
		'\t\ttranslate: -2px -2px;',
		'\t}',
		'',
		'\t:global(.hz-theme-sunset .hz-button.cta) {',
		'\t\tbackground: linear-gradient(135deg, var(--hz-intent-primary), var(--hz-intent-secondary));',
		'\t\tcolor: var(--hz-color-surface);',
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
			Hole 7 tee pad moves back to the long position this weekend.
		</Alert>

		<Card class="hz-card--elevated" padding="md">
			<h3 class="hz-card-title">Next tee time</h3>
			Saturday, 8:40 — Maple Hill.
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

<Stack gap="xl">
	<div>
		<h1>Example Themes</h1>
		<p>
			Three complete themes ship with the package as teaching material, and they are deliberately
			three <em>different amounts of freedom</em>. Each is generated from the
			<code>hyzer.config.ts</code>
			next to it, drift-tested in CI, and — like the base tokens — held to
			<a href="/foundation/contrast">WCAG AA on every graded pairing</a>, in both modes.
		</p>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col"></th>
						<th scope="col">Ocean</th>
						<th scope="col">Sunset</th>
						<th scope="col">Terminal</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<th scope="row">Palette via config</th>
						<td>yes</td>
						<td>yes</td>
						<td>yes</td>
					</tr>
					<tr>
						<th scope="row">Class-hook overrides</th>
						<td>none</td>
						<td>yes</td>
						<td>yes</td>
					</tr>
					<tr>
						<th scope="row">Reference theme</th>
						<td>required</td>
						<td>layered over</td>
						<td><strong>not imported</strong></td>
					</tr>
					<tr>
						<th scope="row">Adds new intents</th>
						<td>no</td>
						<td>no</td>
						<td><strong>phosphor, amber</strong></td>
					</tr>
				</tbody>
			</table>
		</div>
		<p>
			Ocean is the control: it proves how far tokens alone get you. Terminal is the other end — it
			never imports the reference theme, so every rule in it is its own, and it grows the system
			rather than just recoloring it: two intents the library has never heard of, type-checked and
			contrast-graded like any built-in. If you only read one, read Terminal's
			<code>button.css</code>: that is what "headless" actually buys you.
		</p>
	</div>

	{#each examples as example (example.id)}
		<section aria-labelledby="{example.id}-heading">
			<h2 id="{example.id}-heading">{example.label}</h2>
			<p>{example.blurb}</p>
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
		</section>
	{/each}

	<section aria-labelledby="instance-heading">
		<h2 id="instance-heading">One instance, styled by hand</h2>
		<p>
			The "Go pro" button in all three demos above is the same markup —
			<code>&lt;Button class="cta"&gt;</code> — and none of the theme sheets mention
			<code>.cta</code>. The <code>class</code> prop is merged after the component's
			<code>hz-button</code> root class, so it lands on the element ready to be styled by whoever is consuming
			the component. Sheet-level and instance-level overrides compose.
		</p>
		<CodeBlock code={ctaCode} />
		<p class="tab-note">
			Note the selectors: <code>.hz-theme-terminal .hz-button.cta</code>, not a bare
			<code>.cta</code>. See below — this is the one place the class-scoped example themes behave
			differently from the reference theme.
		</p>
	</section>

	<section aria-labelledby="intents-heading">
		<h2 id="intents-heading">Growing the vocabulary</h2>
		<p>
			The library ships six intents. That is a starting set, not a ceiling — a component only stamps <code
				>data-intent="&lt;name&gt;"</code
			>
			and lets the theme decide what the name looks like, so the set of intents belongs to your theme.
			Terminal adds two:
			<code>phosphor</code> and <code>amber</code>, the two tubes every real terminal shipped with.
			They are the last two buttons in its demo above.
		</p>
		<p>Three steps, and none of them is a fork:</p>
		<ol>
			<li>
				<strong>Define the token</strong> in your config. It is emitted as
				<code>--hz-intent-amber</code> and — this is the part that matters —
				<a href="/foundation/contrast">graded by the contrast report</a> exactly like
				<code>primary</code>. A custom intent is held to the same AA bar as a built-in one.
			</li>
			<li>
				<strong>Register the type</strong> by augmenting <code>IntentRegistry</code>. Now
				<code>intent="amber"</code> type-checks and autocompletes on every component, and
				<code>intent="ambr"</code> is a compile error. Extensible and still type-safe — see the
				<code>intents.d.ts</code> tab above.
			</li>
			<li><strong>Style it</strong> with one rule, the same shape the built-in intents use.</li>
		</ol>
		<CodeBlock code={registryCode} />
		<CodeBlock code={registryStyleCode} />
		<p class="tab-note">
			Augment the module that <em>declares</em> the interface (<code>@hyzer-labs/ui/types</code>),
			not the barrel that re-exports it — TypeScript merges an interface only into its declaring
			module, so <code>declare module '@hyzer-labs/ui'</code> would silently do nothing.
		</p>
	</section>

	<section aria-labelledby="how-heading">
		<h2 id="how-heading">How these work</h2>
		<Accordion items={faq} headingLevel={3}>
			{#snippet panel(item)}
				{#if item.id === 'why-class'}
					<p>
						Every rule in Sunset and Terminal is rooted at a class —
						<code>.hz-theme-sunset .hz-button</code>, not <code>.hz-button</code> — and their token
						blocks are generated with the engine's <code>selector</code> option instead of
						<code>:root</code>. So the theme travels with the class: put it on
						<code>&lt;html&gt;</code> to own a document, or on one element to own a panel. It's why this
						page can render three themes at once without them fighting, and why importing these sheets
						doesn't disturb the docs site's own theme.
					</p>
				{:else}
					<p>
						The reference theme's rules live in <code>@layer hz-theme</code>, and unlayered CSS
						beats layered CSS at any specificity. That's what lets Sunset override it with plain
						class rules — no <code>!important</code>, no mirroring the theme's
						<code>:where()</code> selectors.
					</p>
					<p>
						The trade-off is worth being precise about: because these example sheets are themselves
						unlayered, they don't hand that advantage on to you. Their class root puts them at
						two-class specificity, so a bare <code>.cta</code> would lose to
						<code>.hz-theme-terminal .hz-button</code> — an instance override has to out-specify them,
						as the snippet above does. The reference theme uses a cascade layer precisely so it never
						puts you in that position. A theme of your own that expects to be overridden should do the
						same.
					</p>
				{/if}
			{/snippet}
		</Accordion>
	</section>

	<section aria-labelledby="fork-heading">
		<h2 id="fork-heading">Start from one</h2>
		<p>
			Copy a config into your project as <code>hyzer.config.ts</code>, run
			<code>hyzer generate</code>, and iterate — the contrast report grades every change. To go
			further than color, copy the theme's <code>components/</code> folder too and edit the hooks
			directly; <a href="/theming/components">Styling Components</a> is the reference for what each
			one exposes. The token workflow is documented on
			<a href="/theming/tokens">Tokens &amp; Overrides</a>.
		</p>
		<p class="tab-note">
			Coverage: Sunset and Terminal currently restyle Button, Badge, Alert, Card, the Field
			scaffold, TextInput, Toggle, Tabs and Accordion. Sunset falls back to the reference theme for
			anything else; Terminal, importing no theme, falls back to bare headless structure.
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

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	section :global(.code-block) {
		margin-bottom: 1rem;
	}

	.token-table-wrapper {
		overflow-x: auto;
		margin-bottom: 1rem;
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

	/* Painted from the scoped theme's own tokens. */
	.demo-panel {
		padding: 1.5rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		background-color: var(--hz-color-surface, #fff);
		color: var(--hz-color-text, #000);
	}

	/*
	 * The per-instance override (R6). These are consumer rules — the theme
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

	:global(.hz-theme-sunset .hz-button.cta) {
		background: linear-gradient(
			135deg,
			var(--hz-intent-primary, #c2410c),
			var(--hz-intent-secondary, #be185d)
		);
		color: var(--hz-color-surface, #fffbf5);
	}
</style>
