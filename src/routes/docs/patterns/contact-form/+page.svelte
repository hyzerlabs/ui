<script lang="ts">
	import { Stack, Container, CodeBlock } from '$lib';
	import ContactForm from '../../../../docs/samples/ContactForm.svelte';
	// ?raw keeps the listing in lockstep with the component that renders above it.
	import contactSource from '../../../../docs/samples/ContactForm.svelte?raw';
	import { consumerSource } from '../../../../docs/consumerSource';
	import DocIntro from '../../../../docs/DocIntro.svelte';

	const composed = [
		{ label: 'Form', href: '/docs/components/form' },
		{ label: 'TextInput', href: '/docs/components/text-input' },
		{ label: 'Textarea', href: '/docs/components/textarea' },
		{ label: 'Select', href: '/docs/components/select' },
		{ label: 'Alert', href: '/docs/components/alert' },
		{ label: 'Container', href: '/docs/components/container' }
	];
</script>

<svelte:head>
	<title>Contact form — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<DocIntro>
		{#snippet lead()}
			The minimal end of the <a href="/docs/components/form">Form</a> spectrum: four fields, one Select,
			and no order summary.
		{/snippet}
	</DocIntro>

	<p class="composed">
		Composes
		{#each composed as c, i (c.href)}{#if i > 0}{i === composed.length - 1 ? ', and ' : ', '}{/if}<a
				href={c.href}>{c.label}</a
			>{/each}
		(plus <code>toFormErrors</code> and the layout primitives).
	</p>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="demo-heading"
	>
		<h2 id="demo-heading">Demo</h2>
		<!-- The sample bleeds across the full main column while the sidebar stays
		     put. .docs-main sets --hz-breakout-shift: 0, so it grows rightward from
		     the prose column rather than centering. -->
		<Container breakout padding="none">
			<div class="sample-frame">
				<ContactForm />
			</div>
		</Container>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="source-heading"
	>
		<h2 id="source-heading">Source</h2>
		<p class="source-note">
			The whole page, verbatim. Every import is a public export, so you can copy it into an app with
			the theme installed and it works the same. Try submitting with empty fields to see the summary
			link to each problem.
		</p>
		<CodeBlock code={consumerSource(contactSource)} collapsible lineNumbers />
	</Stack>
</Stack>

<style>
	.composed {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	/* Direct child of the Source section Stack (gap="away", data-density-shift):
	 * margin zeroed so the Stack's own gap owns the rhythm. */
	.source-note {
		margin: 0;
	}

	/* A hairline frame so the bleed reads as a distinct artifact rather than
	 * as the docs page suddenly changing shape. */
	.sample-frame {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		overflow: hidden;
	}
</style>
