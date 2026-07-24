<script lang="ts">
	import { Stack, Card, Banner } from '$lib';
	import { color, intent, space } from '$lib/tokens';
	import CodeBlock from '../../../docs/CodeBlock.svelte';
	import Example from '../../../docs/Example.svelte';
	// ?raw keeps the docs in lockstep with the shipped, engine-generated sheet
	// — no hand copy (specs/44 R1/R8, the reset page's `?raw` precedent).
	import utilitiesSource from '$lib/theme/utilities.css?raw';
	import srOnlySource from '$lib/theme/base.css?raw';

	const importLine = "import '@hyzer-labs/ui/utilities.css';";

	// R2 — the two fixed text-color role helpers, derived from the `color`
	// export (not hardcoded — `text`/`textMuted` are the metadata keys).
	const textRoleRows = [
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
	];
	// Sanity — both role keys the sheet reads still exist in the metadata.
	const hasTextRoles = color.text !== undefined && color.textMuted !== undefined;

	// R2 — one row per resolved intent; a consumer config that adds an intent
	// gets its `.hz-text-*` class generated automatically, and this table
	// (driven by the same `intent` export the engine reads) would show it too.
	const intentRows = Object.keys(intent).map((key) => ({
		className: `hz-text-${key}`,
		cssVar: `--hz-intent-${key}`,
		key
	}));

	// R3 — the seven logical margin families, fixed emission order.
	const marginFamilies = [
		{ suffix: '', property: 'margin', label: 'All sides' },
		{ suffix: 'block', property: 'margin-block', label: 'Block axis (both)' },
		{ suffix: 'block-start', property: 'margin-block-start', label: 'Block start' },
		{ suffix: 'block-end', property: 'margin-block-end', label: 'Block end' },
		{ suffix: 'inline', property: 'margin-inline', label: 'Inline axis (both)' },
		{ suffix: 'inline-start', property: 'margin-inline-start', label: 'Inline start' },
		{ suffix: 'inline-end', property: 'margin-inline-end', label: 'Inline end' }
	];

	// R3 — the fixed space scale, one column per rung; a consumer-added rung
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
		'\tBook early — weekends fill fast.',
		'</Banner>'
	].join('\n');
</script>

<svelte:head>
	<title>Utilities — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<div class="doc-intro">
		<h1>Utilities</h1>
		<p class="doc-description">
			Three distinct families of "utility-ish" class: an opt-in, engine-generated sheet of
			token-derived helpers; the always-on <code>.sr-only</code>; and a handful of opt-in component
			conventions that ship inside their own theme sheets.
		</p>
	</div>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="sheet-heading"
	>
		<h2 id="sheet-heading">The opt-in sheet</h2>
		<p>
			A utility class is a <strong>token-derived, single-property helper</strong> — one class, one declaration,
			resolved from a design token. That is the whole definition; it does not depend on where the class
			is or is not used.
		</p>
		<p class="doctrine-note">
			Utilities are for <strong>ad-hoc spots</strong> — nudging one element, tinting one line of
			text — <strong>not an alternative layout system.</strong> Components already own their spacing
			(gap/padding props, the <code>data-padding</code>/<code>data-gap</code> scales) and the
			density system (<code>--hz-space-near</code>/<code>--hz-space-away</code>). The utility sheet
			deliberately does <strong>not</strong> reproduce that surface: it exposes the
			<strong>fixed</strong> <code>--hz-space-*</code> scale for margins only, never the density near/away
			distances, and no padding helpers at all (padding is owned by components).
		</p>
		<p>
			<code>utilities.css</code> is engine output, exactly like <code>tokens.css</code> — rendered
			from the same resolved token model, regenerated by <code>pnpm gen:tokens</code> in this repo
			or
			<code>hyzer generate --utilities</code> in a consumer project. It is opt-in: import it explicitly,
			like a theme sheet, and a consumer who never imports it ships zero of these bytes. A consumer config
			that extends the intent vocabulary or the space scale gets the matching classes generated automatically
			— nothing to hand-maintain.
		</p>
		<CodeBlock code={importLine} />
		<p>
			Every rule is unlayered, single-class specificity (<code>0,1,0</code>), with no
			<code>!important</code> — the same posture as <code>.sr-only</code> below. A deliberately-applied
			utility beats the layered reference theme, while a consumer's own unlayered class of equal specificity
			still wins by source order.
		</p>

		<h3 id="text-utilities-heading">Text-color utilities</h3>
		<p>
			Two fixed role helpers, plus one class per resolved intent — color only. No background,
			border, or fill utilities; those are out of scope (Badge, Alert, and Banner own tinted
			surfaces).
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
						<th scope="col">Preview</th>
						<th scope="col">Note</th>
					</tr>
				</thead>
				<tbody>
					{#if hasTextRoles}
						{#each textRoleRows as row (row.className)}
							<tr>
								<td><code>.{row.className}</code></td>
								<td><code>color: var({row.cssVar})</code></td>
								<td><span class={row.className}>Sample text</span></td>
								<td>{row.note}</td>
							</tr>
						{/each}
					{/if}
					{#each intentRows as row (row.className)}
						<tr>
							<td><code>.{row.className}</code></td>
							<td><code>color: var({row.cssVar})</code></td>
							<td><span class={row.className}>Sample text</span></td>
							<td></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<h3 id="margin-utilities-heading">Margin utilities</h3>
		<p>
			Logical properties only — no <code>mt</code>/<code>mb</code>/<code>ml</code>/<code>mr</code> —
			so a single-direction nudge (<code>block-start</code>, <code>block-end</code>,
			<code>inline-start</code>, <code>inline-end</code>) stays correct under RTL and vertical
			writing modes. Seven families per <code>--hz-space-*</code> rung — every cell below references the
			token var, so a consumer's space override flows straight through with no regeneration needed.
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
			A visual scale — each chip's leading gap is a real
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
		<CodeBlock code={utilitiesSource.trim()} />
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="aa-heading"
	>
		<h2 id="aa-heading">Contrast: what's graded and what isn't</h2>
		<p class="doctrine-note">
			Every <code>.hz-text-&lt;intent&gt;</code> class maps to a pairing the library's own WCAG AA
			gate already grades: intent text colors are
			<strong>AA-verified on the two surface roles only</strong>
			(<code>--hz-color-surface</code> and <code>--hz-color-surface-muted</code>, both light and
			dark) — on any other background, contrast is the consumer's responsibility.
		</p>
		<p>
			The sheet introduces no new pairings — see
			<a href="/foundation/contrast">Contrast &amp; Accessibility</a> for the full report, and
			<a href="/foundation/colors#intent">Colors &amp; Intent</a> for the intent vocabulary itself.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="sr-only-heading"
	>
		<h2 id="sr-only-heading">Always available: <code>.sr-only</code></h2>
		<p>
			A visually-hidden-but-screen-reader-available utility — content stays in the accessibility
			tree and reachable by assistive tech, but is clipped to a 1px box and removed from the visual
			flow. Unlike the opt-in sheet above, <code>.sr-only</code> ships in the reference theme's
			<code>base.css</code>, unlayered, whenever <code>@hyzer-labs/ui/theme</code> is imported —
			<a href="/components/button">Button</a> (loading label), <a href="/components/link">Link</a>
			(external-link hint), <a href="/components/checkbox">Checkbox</a>,
			<a href="/components/radio-group">RadioGroup</a>, <a href="/components/toggle">Toggle</a>, and
			the <code>Field</code> scaffold's <code>hideLabel</code> already render
			<code>class="sr-only"</code>.
		</p>
		<CodeBlock code={srOnlyCode} />
		<p>
			No component ships the rule itself — components only ever emit the class name — so the theme
			is what makes it visually hidden. Source, from <code>theme/base.css</code>:
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
			A third family, distinct from both of the above: conventions like
			<code>.hz-card-title</code> and <code>.hz-banner-title</code> ship inside their own component
			theme sheets (<code>theme/components/card.css</code>,
			<code>theme/components/banner.css</code>) rather than the generated utility sheet — they style
			whatever heading or lead element you bring, at whatever level the page needs, because headings
			aren't load-bearing for Card or Banner the way they are for Modal or Accordion. The full
			catalog, alongside every component's
			<code>data-*</code>/<code>hz-*</code> hooks, lives on
			<a href="/theming/components">Theming &rarr; Styling Components</a>.
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
				Book early — weekends fill fast.
			</Banner>
		</Example>
		<p>
			See <a href="/components/card">Card</a> and <a href="/components/banner">Banner</a> for the full
			component reference.
		</p>
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

	.doctrine-note {
		padding: 0.75rem 1rem;
		border-inline-start: 3px solid var(--hz-color-border, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
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
