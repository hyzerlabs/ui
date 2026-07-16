<script lang="ts">
	import { Stack, Tabs, Button, Badge, Alert, Cluster } from '$lib';
	import { resolveConfig, generateCss } from '$lib/config';
	import oceanConfig from '$lib/theme/examples/ocean.config';
	import sunsetConfig from '$lib/theme/examples/sunset.config';
	import oceanSource from '$lib/theme/examples/ocean.config.ts?raw';
	import sunsetSource from '$lib/theme/examples/sunset.config.ts?raw';
	import oceanCss from '$lib/theme/examples/ocean.css?raw';
	import sunsetCss from '$lib/theme/examples/sunset.css?raw';
	import CodeBlock from '../../../docs/CodeBlock.svelte';

	const examples = [
		{ id: 'ocean', label: 'Ocean', config: oceanConfig, source: oceanSource, css: oceanCss },
		{ id: 'sunset', label: 'Sunset', config: sunsetConfig, source: sunsetSource, css: sunsetCss }
	];

	// The demos dogfood the engine's selector scoping: the same configs that
	// generate the shipped sheets are re-rendered here under `.theme-<id>`
	// classes, so each panel is themed without leaking :root overrides into
	// the rest of the site (and follows the site's dark toggle via the
	// composed [data-theme='dark'] selector).
	const scopedCss = examples
		.map((e) =>
			generateCss(resolveConfig(e.config), { mode: 'overrides', selector: `.theme-${e.id}` })
		)
		.join('\n');

	const viewTabs = [
		{ id: 'demo', label: 'Demo' },
		{ id: 'config', label: 'hyzer.config' },
		{ id: 'css', label: 'Generated CSS' }
	];

	const importCode = (id: string) =>
		[
			"import '@hyzer-labs/ui/tokens.css';",
			"import '@hyzer-labs/ui/theme';            // optional",
			`import '@hyzer-labs/ui/theme/examples/${id}.css';`
		].join('\n');
</script>

<svelte:head>
	<title>Example Themes — @hyzer-labs/ui</title>
	<!-- Engine-generated CSS from our own committed configs — no user input. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<style>${scopedCss}</style>`}
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>Example Themes</h1>
		<p>
			Two complete token-override sheets, shipped with the package as teaching material for the
			config workflow: each <code>*.css</code> under <code>theme/examples/</code> is generated from
			the <code>hyzer.config.ts</code> next to it, drift-tested in CI, and — like the base tokens —
			held to <a href="/foundation/contrast">WCAG AA on every graded pairing</a>, in both modes. The
			demos below run the same configs through the engine's <code>selector</code> option, so each panel
			is scoped and follows the site's own dark toggle.
		</p>
	</div>

	{#each examples as example (example.id)}
		<section aria-labelledby="{example.id}-heading">
			<h2 id="{example.id}-heading">{example.label}</h2>
			<CodeBlock code={importCode(example.id)} />
			<Tabs items={viewTabs} ariaLabel="{example.label} views" defaultTab="demo">
				{#snippet panel(item)}
					<div class="tab-content">
						{#if item.id === 'demo'}
							<div class="theme-{example.id} demo-panel">
								<Stack gap="sm">
									<Cluster gap="sm" align="center">
										<Button>Book a round</Button>
										<Button variant="outline" intent="secondary">Scorecards</Button>
										<Button variant="ghost" intent="danger">Delete</Button>
										<Badge intent="success">Par saved</Badge>
										<Badge intent="warning" variant="soft">Windy</Badge>
									</Cluster>
									<Alert intent="info" title="Course update" headingLevel={3}>
										Hole 7 tee pad moves back to the long position this weekend.
									</Alert>
								</Stack>
							</div>
						{:else if item.id === 'config'}
							<CodeBlock code={example.source} />
						{:else}
							<CodeBlock code={example.css} />
						{/if}
					</div>
				{/snippet}
			</Tabs>
		</section>
	{/each}

	<section aria-labelledby="fork-heading">
		<h2 id="fork-heading">Start from one</h2>
		<p>
			Copy either config into your project as <code>hyzer.config.ts</code>, run
			<code>hyzer generate</code>, and iterate — the contrast report grades every change. The
			workflow is documented on <a href="/theming/tokens">Tokens &amp; Overrides</a>.
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

	/* Painted from the scoped theme's own tokens. */
	.demo-panel {
		padding: 1.25rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		background-color: var(--hz-color-surface, #fff);
		color: var(--hz-color-text, #000);
	}
</style>
