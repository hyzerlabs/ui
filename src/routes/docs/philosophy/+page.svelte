<script lang="ts">
	import { Stack } from '$lib';
	import DocIntro from '../../../docs/DocIntro.svelte';
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
		<h2 id="a11y-heading">Accessibility is prioritized</h2>
		<p>
			Each component ships the ARIA roles, keyboard interactions, and focus management of its
			WAI-ARIA pattern by default — not bolted on afterward. A Modal traps focus and restores it on
			close; a Combobox implements the full editable-combobox pattern with
			<code>aria-activedescendant</code>; Tabs handle arrow keys and roving tabindex. You do not opt
			in, and you cannot accidentally opt out by restyling.
		</p>
		<p>
			The same applies to color: the token engine grades every text-on-surface and text-on-intent
			pairing against WCAG AA and fails the build when a theme drops below it.
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
		<h2 id="headless-heading">Headless components can be overridden via snippets</h2>
		<p>
			Structure and per-item content are yours to shape — pass a <code>children</code> or per-item snippet
			and render your own markup without forking the component. The component keeps owning the parts that
			are easy to get wrong (roles, keyboard, focus order) while you own the parts that make it yours.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="theming-heading"
	>
		<h2 id="theming-heading">Theming is via classes and data-* attributes</h2>
		<p>
			Components ship only structural CSS plus stable <code>hz-*</code> classes and
			<code>data-*</code>/<code>aria-*</code> hooks — all visual chrome lives in the theme layer,
			keyed on those hooks. Every component also takes a <code>class</code> prop, merged after its own,
			so restyling one instance never means wrapping it in a div.
		</p>
		<p>
			That contract is what makes the <a href="/docs/theming/examples">example themes</a> possible: Ocean
			redefines only tokens, Terminal imports no reference theme at all, and both drive the same components.
		</p>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="plain-heading"
	>
		<h2 id="plain-heading">Plain language is part of accessibility</h2>
		<p>
			The words a component ships by default — labels, error messages, empty states — are as much a
			part of its design as the markup. We write short sentences and skip jargon, and every default
			string follows the same rule: say the plain thing.
		</p>
		<p>
			<a href="/docs/components/form">Form</a>'s error summary is the worked example. Its default
			title counts the errors and says so in plain words — "There is a problem" for one, "There are
			3 problems" for three — not a vague fragment like "Errors detected." The count is information
			a screen-reader user gets before they start navigating the list, and the phrasing is one a
			reader in a hurry does not have to decode.
		</p>
	</Stack>
</Stack>

<style>
	p {
		margin: 0;
		line-height: var(--hz-line-height-base, 1.5);
	}
</style>
