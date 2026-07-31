<script lang="ts">
	/**
	 * The "Where to go next" block, as one component so every page that ends
	 * with onward links looks the same. Renders the whole section, heading
	 * included, because the heading id is what the Toc rail anchors to, and
	 * duplicating it per page is how it drifts.
	 *
	 * Whole cards are clickable (Card's `href`), so the card is the link
	 * rather than the title inside it.
	 */
	import { Stack, Grid, Card } from '$lib';

	interface Step {
		label: string;
		href: string;
		blurb: string;
	}

	interface Props {
		items: Step[];
		/** Heading text. Override only when "next" is not what the page means. */
		title?: string;
		/** Anchor target for the Toc rail and aria-labelledby. */
		id?: string;
	}

	let { items, title = 'Where to go next', id = 'next-heading' }: Props = $props();
</script>

<Stack as="section" gap="away" data-density-shift class="doc-section" aria-labelledby={id}>
	<h2 {id}>{title}</h2>
	<Grid columns={{ sm: 1, md: 3 }} gap="md">
		{#each items as step (step.href)}
			<!-- The card's link is a bare overlay anchor, so it needs its own
			     name: without ariaLabel it reaches the a11y tree unlabeled. -->
			<Card
				class="hz-card--outlined expressive-card"
				href={step.href}
				ariaLabel={step.label}
				padding="md"
			>
				<h3 class="hz-card-title next-title">{step.label}</h3>
				<p class="next-blurb">{step.blurb}</p>
			</Card>
		{/each}
	</Grid>
</Stack>

<style>
	/* The loud expressive-card frame lives in src/docs/chrome.css, shared
	   with the homepage commitment cards. */

	/* The theme's card-title convention provides the treatment; this one
	   unlayered override sizes it down for the compact next-cards. Consumer
	   CSS beating @layer hz-theme is the documented cascade, demonstrated. */
	.next-title {
		font-size: var(--hz-font-size-base, 1rem);
		margin-bottom: 0.25rem;
	}

	.next-blurb {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
		line-height: var(--hz-line-height-base, 1.5);
	}
</style>
