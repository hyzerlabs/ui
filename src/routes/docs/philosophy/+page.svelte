<script lang="ts">
	import { Stack, Alert } from '$lib';
	import IconInfo from '$lib/icons/generated/info.svelte';
	import DocIntro from '../../../docs/DocIntro.svelte';
	import SizeTable from '../../../docs/SizeTable.svelte';
	import WhereNext from '../../../docs/WhereNext.svelte';
	import { gettingStartedStep, nextSteps } from '../../../docs/nextSteps';

	// The shared onward links, minus this page itself.
	const sections = [gettingStartedStep, ...nextSteps].filter((s) => s.href !== '/docs/philosophy');
</script>

<svelte:head>
	<title>Philosophy — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro />

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="a11y-heading"
	>
		<h2 id="a11y-heading">Accessibility first</h2>
		<p>
			Each component ships the ARIA roles, keyboard interactions, and focus management of its
			WAI-ARIA pattern by default. A Modal traps focus and restores it on close. A Combobox
			implements the full editable-combobox pattern with <code>aria-activedescendant</code>. Tabs
			handle arrow keys and roving tabindex. You cannot accidentally opt out by restyling.
		</p>
		<p>
			The same applies to color. The token engine grades every text-on-surface and text-on-intent
			pairing against WCAG AA each time it generates a sheet. It warns by default; pass
			<code>--strict</code> and a failure stops the build.
			<a href="/docs/foundation/contrast">Contrast &amp; Accessibility</a> shows the live ratios.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="headless-heading"
	>
		<h2 id="headless-heading">Headless structure: override with documented hooks or snippets</h2>
		<p>Two routes get you past a decision the library made.</p>
		<p>
			<strong>Documented hooks</strong> hand you the styling, and they cover most of what you will
			want to change. Every component ships a stable <code>hz-*</code> root class plus
			<code>data-*</code> and <code>aria-*</code> attributes for every variant and state, listed on
			the component's own page. They are API, so styling against them is supported. Every component
			also takes a <code>class</code> prop, merged onto its root, so restyling one instance never means
			wrapping it in a div.
		</p>
		<p>
			<strong>Snippets</strong> are the escape hatch when styling is not enough and you need
			different markup. Pass a <code>children</code> or per-item snippet and render your own structure,
			without forking the component. The component keeps the parts that are easy to get wrong: roles,
			keyboard behavior, focus order.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="theming-heading"
	>
		<h2 id="theming-heading">Theming is opt-in, one tier at a time</h2>
		<p>
			On their own, components render with native element defaults. From there you add exactly as
			much as you want: the token sheet, then the reference theme, then token overrides of your own,
			then a generated sheet from your own config. Each tier is a superset of the one before. You
			can stop at any of them.
		</p>
		<p>
			The <a href="/docs/theming/examples">example themes</a> are the proof. Ocean redefines only tokens.
			Terminal imports no reference theme and styles the raw hooks from scratch. Both drive the same components,
			unchanged.
		</p>
		<p>
			This site sits in the middle of that range. It runs the reference theme as shipped, plus a
			small sheet of class overrides that adds no palette and redefines no token. That sheet ships
			as the Docs example theme, so the styling you are reading is a tier you can import.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="bloat-heading"
	>
		<h2 id="bloat-heading">No bloat</h2>
		<p>
			Components carry structural CSS and nothing else. The reset, token sheet, reference theme and
			utility classes are separate imports, so you take only the ones you want. Icons come one glyph
			at a time rather than as a barrel.
		</p>
		<p>
			The package has exactly one dependency: <code>esm-env</code>, a build-time helper that keeps
			the dev-only warnings working in every bundler instead of only Vite. It resolves to constants
			your bundler eliminates, so none of it reaches a production build. Svelte is the only peer
			dependency.
		</p>
		<p>
			Shipping less is what makes the headless API and the theming tiers possible: no visual opinion
			for you to undo, and no layer you are forced to carry. These are the numbers for each layer,
			measured from the published package rather than estimated:
		</p>
		<SizeTable />
		<Alert intent="info" title="Why the library is written in Svelte" headingLevel={3}>
			{#snippet icon()}<IconInfo />{/snippet}
			Markup, script and styles sit in one file, so there is one place to look and one file to change.
			That suits a person reading the source and an agent editing it. Svelte also reports accessibility
			problems at compile time, so mistakes surface before review does.
		</Alert>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="plain-heading"
	>
		<h2 id="plain-heading">Plain language, for you and your agents</h2>
		<p>
			The words a component ships by default (labels, error messages, empty states) are as much a
			part of its design as the markup. We write short sentences and skip jargon.
		</p>
		<p>
			<a href="/docs/components/form">Form</a>'s error summary is the worked example. Its default
			title counts the errors: "There is a problem" for one, "There are 3 problems" for three. A
			screen-reader user gets the count before they start navigating the list.
		</p>
		<p>
			These docs are indexed in <a href="/llms.txt">llms.txt</a>, generated from the same manifest
			that builds the navigation. The <a href="/docs/agents">Agents</a> page spells out the conventions
			so a coding agent can follow them literally. Prose that a person can read without decoding is prose
			an agent can act on without guessing.
		</p>
	</Stack>

	<WhereNext items={sections} />
</Stack>

<style>
	p {
		margin: 0;
		line-height: var(--hz-line-height-base, 1.5);
	}
</style>
