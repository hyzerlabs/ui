<script lang="ts">
	import { Stack, Card, Banner, Blockquote, CodeBlock } from '$lib';
	import { color, intent, space } from '$lib/tokens';
	import Example from '../../../../docs/Example.svelte';
	// ?raw keeps the docs in lockstep with the shipped, engine-generated sheet
	// — no hand copy, the same approach the reset page uses for its sheet.
	import utilitiesSource from '$lib/theme/utilities.css?raw';
	import srOnlySource from '$lib/theme/base.css?raw';
	import DocIntro from '../../../../docs/DocIntro.svelte';

	const importLine = "import '@hyzer-labs/ui/utilities.css';";

	// A consumer project with no hyzer.config — the CLI falls back to the base
	// schema and still honors --utilities (see /theming/tokens for the
	// config.utilities key form).
	const generateUtilitiesTranscript = [
		'$ hyzer generate --utilities',
		'No config found (looked for hyzer.config.ts, hyzer.config.js, hyzer.config.mjs), using the base schema.',
		'wrote hyzer-tokens.css (full, 84 tokens)',
		'wrote hyzer-utilities.css',
		'contrast: 92 pairings checked, all pass WCAG AA'
	].join('\n');

	// The four color families, in the order the sheet emits them. The role
	// rows are derived from the `color` export (not hardcoded — `text`,
	// `surfaceMuted` and friends are the metadata keys).
	const colorFamilies = [
		{
			prefix: 'hz-text',
			property: 'color',
			roles: [
				{
					className: 'hz-text',
					cssVar: '--hz-color-text',
					note: 'Resets inherited color back to the base text role — e.g. inside a tinted region.'
				},
				{
					className: 'hz-text-muted',
					cssVar: '--hz-color-text-muted',
					note: 'The muted text role — de-emphasized copy.'
				}
			]
		},
		{
			prefix: 'hz-bg',
			property: 'background-color',
			roles: [
				{ className: 'hz-bg', cssVar: '--hz-color-surface', note: 'The base surface role.' },
				{
					className: 'hz-bg-muted',
					cssVar: '--hz-color-surface-muted',
					note: 'The subdued opaque surface — quiet panels, code blocks.'
				}
			]
		},
		{
			prefix: 'hz-border',
			property: 'border-color',
			roles: [
				{
					className: 'hz-border',
					cssVar: '--hz-color-border',
					note: 'Color only. Bring your own border-width and border-style.'
				}
			]
		},
		{
			prefix: 'hz-fill',
			property: 'fill',
			roles: [
				{ className: 'hz-fill', cssVar: '--hz-color-text', note: 'For SVG. Matches body text.' },
				{ className: 'hz-fill-muted', cssVar: '--hz-color-text-muted', note: 'For SVG.' }
			]
		}
	];

	// Sanity — every role key the sheet reads still exists in the metadata.
	const hasColorRoles = (['text', 'textMuted', 'surface', 'surfaceMuted', 'border'] as const).every(
		(key) => color[key] !== undefined
	);

	// One row per resolved intent, one column per family. A consumer config
	// that adds an intent gets all four classes generated automatically, and this
	// table (driven by the same `intent` export the engine reads) shows them too.
	const intentRows = Object.keys(intent).map((key) => ({
		key,
		cssVar: `--hz-intent-${key}`,
		classes: colorFamilies.map((f) => `${f.prefix}-${key}`)
	}));

	// The seven logical margin families, fixed emission order.
	const marginFamilies = [
		{ suffix: '', property: 'margin', label: 'All sides' },
		{ suffix: 'block', property: 'margin-block', label: 'Block axis (both)' },
		{ suffix: 'block-start', property: 'margin-block-start', label: 'Block start' },
		{ suffix: 'block-end', property: 'margin-block-end', label: 'Block end' },
		{ suffix: 'inline', property: 'margin-inline', label: 'Inline axis (both)' },
		{ suffix: 'inline-start', property: 'margin-inline-start', label: 'Inline start' },
		{ suffix: 'inline-end', property: 'margin-inline-end', label: 'Inline end' }
	];

	// The fixed space scale, one column per rung; a consumer-added rung
	// (e.g. `xxl`) gets all seven families generated automatically.
	const spaceRungs = Object.keys(space);

	function marginClass(suffix: string, rung: string): string {
		return suffix ? `hz-m-${suffix}-${rung}` : `hz-m-${rung}`;
	}

	// A realistic "ad-hoc spot" — one inline nudge, not a layout (the
	// anti-goal doctrine below), composed straight from the sheet's own
	// classes: a tinted status word with a little breathing room before it.
	const nudgeCode = [
		'<p>',
		'\tFree shipping over $75.',
		'\t<span class="hz-text-success hz-m-inline-start-xs">In stock</span>',
		'</p>'
	].join('\n');

	const srOnlyCode = [
		'<button type="button">',
		'\t<IconX aria-hidden="true" />',
		'\t<span class="sr-only">Close</span>',
		'</button>'
	].join('\n');

	const cardTitleCode = [
		'<Card class="hz-card--outlined">',
		'\t<h3 class="hz-card-title">Course conditions</h3>',
		'\tFairways dry, greens rolling fast.',
		'</Card>'
	].join('\n');

	const bannerTitleCode = [
		'<Banner intent="info">',
		'\t<strong class="hz-banner-title">Tee times open Monday</strong>',
		'\tBook early. Weekends fill fast.',
		'</Banner>'
	].join('\n');
</script>

<svelte:head>
	<title>Utilities — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro>
		{#snippet lead()}
			Three families of utility class, from least to most opt-in: the always-on
			<code>.sr-only</code>, component conventions the theme already ships, and a generated sheet of
			token-derived helpers you import separately. It also covers the JavaScript helpers the package
			exports.
		{/snippet}
	</DocIntro>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="sr-only-heading"
	>
		<h2 id="sr-only-heading">Always available: <code>.sr-only</code></h2>
		<p>
			You already have this: there is nothing to opt into beyond the theme itself.
			<code>.sr-only</code>
			hides content visually while keeping it available to screen readers. The content stays in the accessibility
			tree, clipped to a 1px box and taken out of the visual flow. It ships in the reference theme's
			<code>base.css</code>, unlayered, whenever
			<code>@hyzer-labs/ui/theme</code>
			is imported.
			<a href="/docs/components/button">Button</a> (loading label),
			<a href="/docs/components/link">Link</a>
			(external-link hint), <a href="/docs/components/checkbox">Checkbox</a>,
			<a href="/docs/components/radio-group">RadioGroup</a>,
			<a href="/docs/components/toggle">Toggle</a>, and the <code>Field</code> scaffold's
			<code>hideLabel</code>
			already render
			<code>class="sr-only"</code>.
		</p>
		<CodeBlock code={srOnlyCode} />
		<p>
			No component ships the rule itself; components only ever emit the class name. The theme is
			what makes it visually hidden. Source, from <code>theme/base.css</code>:
		</p>
		<CodeBlock
			code={srOnlySource.slice(srOnlySource.indexOf('.sr-only {')).split('\n\n')[0].trim()}
		/>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="component-classes-heading"
	>
		<h2 id="component-classes-heading">Opt-in component classes</h2>
		<p>
			One step up: apply a class the theme already ships, no new import required. Conventions like
			<code>.hz-card-title</code> and <code>.hz-banner-title</code> ship inside their own component
			theme sheets (<code>theme/components/card.css</code>,
			<code>theme/components/banner.css</code>) rather than the generated utility sheet. They style
			whatever heading or lead element you bring, at whatever level the page needs, because headings
			are not load-bearing for Card or Banner the way they are for Modal or Accordion. The full
			catalog, alongside every component's
			<code>data-*</code>/<code>hz-*</code> hooks, lives on
			<a href="/docs/theming/components">Theming &rarr; Styling Components</a>.
		</p>
		<Example code={cardTitleCode}>
			<Card class="hz-card--outlined">
				<h3 class="hz-card-title">Course conditions</h3>
				Fairways dry, greens rolling fast.
			</Card>
		</Example>
		<Example code={bannerTitleCode}>
			<Banner intent="info">
				<strong class="hz-banner-title">Tee times open Monday</strong>
				Book early. Weekends fill fast.
			</Banner>
		</Example>
		<p>
			See <a href="/docs/components/card">Card</a> and <a href="/docs/components/banner">Banner</a> for
			the full component reference.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="sheet-heading"
	>
		<h2 id="sheet-heading">The opt-in sheet</h2>
		<p>
			The biggest commitment of the three: an additional sheet, imported explicitly. A utility class
			is a <strong>token-derived, single-property helper</strong>: one class, one declaration,
			resolved from a design token. That is the whole definition; it does not depend on where the
			class is or is not used.
		</p>
		<Blockquote class="doctrine-note" intent="primary">
			Utilities are for <strong>ad-hoc spots</strong> like nudging one element or tinting one line
			of text. They are <strong>not an alternative layout system.</strong> Components already own
			their spacing (gap/padding props, the <code>data-padding</code>/<code>data-gap</code> scales)
			and the density system (<code>--hz-space-near</code>/<code>--hz-space-away</code>). The
			utility sheet deliberately does <strong>not</strong> reproduce that surface: it exposes the
			<strong>fixed</strong> <code>--hz-space-*</code> scale for margins only, never the density near/away
			distances, and no padding helpers at all (padding is owned by components).
		</Blockquote>
		<p>
			<code>utilities.css</code> is generated output, exactly like <code>tokens.css</code>: rendered
			from the same resolved token model by <code>hyzer generate --utilities</code>, never edited by
			hand. It is opt-in. Import it explicitly, like a theme sheet, and if you never import it you
			ship none of these bytes. If your config extends the intent vocabulary or the space scale, the
			matching classes are generated automatically, with nothing to hand-maintain.
		</p>
		<CodeBlock code={generateUtilitiesTranscript} />
		<p>
			The flag opts in for a single run; set <code>utilities: true</code> (or
			<code>{"{ output: '...' }"}</code>) in <code>hyzer.config.ts</code> to opt in every run. The
			full config surface is on
			<a href="/docs/foundation/config#full-reference-heading">Config &amp; CLI</a>.
		</p>
		<CodeBlock code={importLine} />
		<p>
			Every rule is unlayered, single-class specificity (<code>0,1,0</code>), with no
			<code>!important</code>: the same posture as <code>.sr-only</code> above. A deliberately applied
			utility beats the layered reference theme. Your own unlayered class of equal specificity still wins
			on source order, so import your stylesheet after the utility sheet if you mean to override one.
		</p>

		<h3 id="text-utilities-heading">Color utilities</h3>
		<p>
			Four families (<code>.hz-text-*</code>, <code>.hz-bg-*</code>, <code>.hz-border-*</code> and
			<code>.hz-fill-*</code>), each with its role helpers plus one class per resolved intent. One
			property each, so <code>.hz-border-danger</code> sets <code>border-color</code> and nothing
			else: bring your own width and style. <code>.hz-fill-*</code> is for SVG.
		</p>
		<p>
			These are for ad-hoc spots. Components that own a tinted surface (<a
				href="/docs/components/badge">Badge</a
			>, <a href="/docs/components/alert">Alert</a>, <a href="/docs/components/banner">Banner</a>)
			keep doing that themselves, and reaching for a background utility to restyle one is the wrong
			tool. Use their <code>intent</code> prop or their theme hooks.
		</p>
		<Example code={nudgeCode}>
			<p>
				Free shipping over $75.
				<span class="hz-text-success hz-m-inline-start-xs">In stock</span>
			</p>
		</Example>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Class</th>
						<th scope="col">Declaration</th>
						<th scope="col">Note</th>
					</tr>
				</thead>
				<tbody>
					{#if hasColorRoles}
						{#each colorFamilies as family (family.prefix)}
							{#each family.roles as row (row.className)}
								<tr>
									<td><code>.{row.className}</code></td>
									<td><code>{family.property}: var({row.cssVar})</code></td>
									<td>{row.note}</td>
								</tr>
							{/each}
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<p class="tab-note">
			And one class per intent, in every family. Every cell references the intent token, so a
			remapped or added intent flows straight through with no regeneration needed:
		</p>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Intent</th>
						{#each colorFamilies as family (family.prefix)}
							<th scope="col"><code>{family.property}</code></th>
						{/each}
						<th scope="col">Preview</th>
					</tr>
				</thead>
				<tbody>
					{#each intentRows as row (row.key)}
						<tr>
							<td><code>{row.cssVar}</code></td>
							{#each row.classes as className (className)}
								<td><code>.{className}</code></td>
							{/each}
							<td>
								<span class={`intent-preview ${row.classes[0]} ${row.classes[2]}`}>{row.key}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<h3 id="margin-utilities-heading">Margin utilities</h3>
		<p>
			Logical properties only, with no <code>mt</code>/<code>mb</code>/<code>ml</code>/<code
				>mr</code
			>, so a single-direction nudge (<code>block-start</code>, <code>block-end</code>,
			<code>inline-start</code>, <code>inline-end</code>) stays correct under RTL and vertical
			writing modes. Seven families per <code>--hz-space-*</code> rung. Every cell below references the
			token var, so your space override flows straight through with no regeneration needed.
		</p>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Family</th>
						<th scope="col">Property</th>
						{#each spaceRungs as rung (rung)}
							<th scope="col">{rung}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each marginFamilies as family (family.suffix)}
						<tr>
							<td>{family.label}</td>
							<td><code>{family.property}</code></td>
							{#each spaceRungs as rung (rung)}
								<td><code>.{marginClass(family.suffix, rung)}</code></td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="tab-note">
			A visual scale. Each chip's leading gap is a real
			<code>margin-inline-start</code> utility, walking the space scale from <code>none</code> to
			<code>xl</code>:
		</p>
		<div class="margin-demo-row">
			{#each spaceRungs as rung (rung)}
				<span class={`demo-chip ${marginClass('inline-start', rung)}`}>{rung}</span>
			{/each}
		</div>

		<h3 id="sheet-source-heading">Source</h3>
		<p>The generated sheet, in full:</p>
		<CodeBlock code={utilitiesSource.trim()} collapsible />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="aa-heading"
	>
		<h2 id="aa-heading">Contrast: what is graded and what is not</h2>
		<Blockquote class="doctrine-note" intent="primary">
			Every <code>.hz-text-&lt;intent&gt;</code> class maps to a pairing already checked against
			WCAG AA: intent text colors are
			<strong>AA-verified on the two surface roles only</strong>
			(<code>--hz-color-surface</code> and <code>--hz-color-surface-muted</code>, both light and
			dark). On any other background, contrast is yours to check.
		</Blockquote>
		<p>
			That includes a background utility. <code>.hz-bg-danger</code> is not one of those two
			surfaces, so <code>.hz-text-danger</code> on <code>.hz-bg-danger</code> is a pairing nothing
			has graded, and several of the intents fail it outright. The combination the report does cover
			is the one Banner ships: text in the <em>surface</em> role on a solid intent fill, which flips
			with the mode and stays legible in both. Reach for <code>.hz-bg</code> or
			<code>.hz-bg-muted</code> under intent-colored text. For a solid intent fill, set the text to the
			surface role rather than an intent.
		</p>
		<p>
			<code>.hz-border-*</code> is exempt either way: a border is non-text, so it answers to
			<a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html">WCAG 1.4.11</a>
			(3:1 against what it sits on) rather than to the 4.5:1 text rule.
		</p>
		<p>
			Beyond that the sheet introduces no new pairings. See
			<a href="/docs/foundation/contrast">Contrast &amp; Accessibility</a> for the full report, and
			<a href="/docs/foundation/colors#intent">Colors &amp; Intent</a> for the intent vocabulary itself.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="js-utilities-heading"
	>
		<h2 id="js-utilities-heading">JavaScript utilities</h2>
		<p>
			Not every utility is a class. The package also exports plain functions that are pure and
			SSR-safe, and touch no DOM:
		</p>
		<ul class="js-utils-list">
			<li>
				<strong>Contrast math</strong>: <code>contrastRatio</code>, <code>gradeContrast</code>,
				<code>bestLevel</code>, <code>bestLevelLarge</code>, <code>relativeLuminance</code>,
				<code>mixSrgb</code>, <code>hexToRgb</code>, and <code>rgbToHex</code>, from the package
				root or <code>@hyzer-labs/ui/utils</code>. Grade any two hex colors against WCAG with the
				same functions behind the
				<a href="/docs/foundation/contrast#checker-heading">pairing checker</a>. See
				<a href="/docs/theming/tokens#verify-heading">Verify your palette</a> for using them in a unit
				test.
			</li>
			<li>
				<strong><code>toFormErrors</code></strong>: reshapes a plain field-name &rarr; message
				record into the error array <a href="/docs/components/form">Form</a> renders as its linked summary.
			</li>
			<li>
				<strong><code>announce</code></strong>: sends a message to a reused, visually hidden live
				region for screen readers, from <code>@hyzer-labs/ui/observers</code>. It pairs naturally
				with an <a href="/docs/foundation/observers">observer</a> callback that just loaded more content
				or noticed a change.
			</li>
		</ul>
	</Stack>
</Stack>

<style>
	/* Margins zeroed — h3/p on this page are direct children of a
	 * .doc-section Stack (gap="away", data-density-shift), which owns the
	 * rhythm. */
	h3 {
		margin: 0;
		font-size: var(--hz-font-size-lg, 1.4rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	p {
		margin: 0;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	.js-utils-list {
		margin: 0;
		padding-inline-start: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

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
		vertical-align: middle;
		white-space: nowrap;
	}

	.token-table th {
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.margin-demo-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		padding: 0.5rem;
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
	}

	/* Width and style only — border-color is left to the .hz-border-* utility
	   on the same element, which is the point the table above is making. Using
	   the `border` shorthand here would reset that color to currentColor and
	   win, since this scoped rule outranks the unlayered utility. */
	.intent-preview {
		display: inline-block;
		padding: 0.1rem 0.45rem;
		border-width: var(--hz-border-width-thin, 1px);
		border-style: solid;
		border-radius: var(--hz-radius-sm, 0.25rem);
		font-size: var(--hz-font-size-sm, 0.875rem);
		white-space: nowrap;
	}

	.demo-chip {
		padding: 0.25rem 0.625rem;
		background-color: var(
			--hz-color-surface-muted,
			color-mix(in srgb, var(--hz-intent-neutral, #6b7280) 6%, var(--hz-color-surface, #fff))
		);
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-full, 9999px);
		font-size: var(--hz-font-size-sm, 0.875rem);
		white-space: nowrap;
	}
</style>
