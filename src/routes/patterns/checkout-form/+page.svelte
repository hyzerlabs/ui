<script lang="ts">
	import { Stack, Container } from '$lib';
	import CheckoutForm from '../../../docs/samples/CheckoutForm.svelte';
	// ?raw keeps the listing in lockstep with the component that renders above it.
	import checkoutSource from '../../../docs/samples/CheckoutForm.svelte?raw';
	import CodeBlock from '../../../docs/CodeBlock.svelte';
	import { consumerSource } from '../../../docs/consumerSource';

	const composed = [
		{ label: 'Form', href: '/components/form' },
		{ label: 'TextInput', href: '/components/text-input' },
		{ label: 'Textarea', href: '/components/textarea' },
		{ label: 'Select', href: '/components/select' },
		{ label: 'RadioGroup', href: '/components/radio-group' },
		{ label: 'Checkbox', href: '/components/checkbox' },
		{ label: 'Toggle', href: '/components/toggle' },
		{ label: 'Alert', href: '/components/alert' },
		{ label: 'Card', href: '/components/card' },
		{ label: 'Split', href: '/components/split' }
	];
</script>

<svelte:head>
	<title>Checkout form — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="xl">
	<div>
		<h1>Checkout form</h1>
		<p class="lead">
			The full <a href="/components/form">Form</a> workflow on a realistic page. Submitting with
			problems builds a plain field-name → message record, <code>toFormErrors</code> reshapes it,
			and Form renders the linked error summary and moves focus to it — the same array feeds each
			field's inline error, so the two can never disagree. The order summary card derives its totals
			from the same bound state the controls edit. For the minimal end of this same spectrum — a
			small form with no order summary — see <a href="/patterns/contact-form">Contact form</a>.
		</p>
		<p class="composed">
			Composes
			{#each composed as c, i (c.href)}{#if i > 0}{i === composed.length - 1
						? ', and '
						: ', '}{/if}<a href={c.href}>{c.label}</a>{/each}
			(plus <code>toFormErrors</code> and the layout primitives).
		</p>
	</div>

	<!-- The sample bleeds across the full main column while the sidebar stays
	     put. .docs-main sets --hz-breakout-shift: 0, so it grows rightward from
	     the prose column rather than centering. -->
	<Container breakout padding="none">
		<div class="sample-frame">
			<CheckoutForm />
		</div>
	</Container>

	<section aria-labelledby="source-heading">
		<h2 id="source-heading">Source</h2>
		<p>
			The whole page, verbatim. Every import is a public export — copy it into an app with the theme
			installed and it works the same. Try placing an order with empty fields to see the summary
			link to each problem.
		</p>
		<CodeBlock code={consumerSource(checkoutSource)} />
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

	.lead {
		margin: 0 0 0.75rem;
		font-size: var(--hz-font-size-lg, 1.4rem);
		line-height: var(--hz-line-height-base, 1.5);
	}

	.composed {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	section p {
		margin: 0 0 1rem;
	}

	/* A hairline frame so the bleed reads as a distinct artifact rather than
	 * as the docs page suddenly changing shape. */
	.sample-frame {
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		overflow: hidden;
	}
</style>
