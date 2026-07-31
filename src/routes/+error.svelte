<script lang="ts">
	/**
	 * The error page, 404 above all — laid out like the landing page (same
	 * chrome, same Hero, same card grid), not like a docs page. It offers the
	 * Getting Started onward links plus Getting Started itself.
	 */
	import { page } from '$app/state';
	import { Hero, Container, Button } from '$lib';
	import SiteChrome from '../docs/SiteChrome.svelte';
	import WhereNext from '../docs/WhereNext.svelte';
	import { gettingStartedStep, nextSteps } from '../docs/nextSteps';

	const notFound = $derived(page.status === 404);
	const title = $derived(notFound ? 'Page not found' : 'Something went wrong');
	const subtitle = $derived(
		notFound
			? 'That page has moved, or never existed. Everything below is still where it should be.'
			: (page.error?.message ?? 'The page could not be loaded. Try again in a moment.')
	);

	const items = [gettingStartedStep, ...nextSteps];
</script>

<svelte:head>
	<title>{title} — @hyzer-labs/ui</title>
</svelte:head>

<SiteChrome>
	<main id="main-content" tabindex="-1">
		<Hero layout="center" align="center" eyebrow={String(page.status)} {title} {subtitle}>
			{#snippet actions()}
				<Button href="/">Back to the home page</Button>
			{/snippet}
		</Hero>

		<Container max="lg" padding="lg">
			<WhereNext {items} filler />
		</Container>
	</main>
</SiteChrome>

<style>
	/* No band sets --card-frame here, so the filler would fall back to the
	   text color and read as a black block. Point its frame hook at the
	   primary intent instead: border, softened fill, and press shadow all
	   resolve through --card-frame, so the whole treatment tints together.
	   The link cards around it keep the default text-color frame. */
	main :global(.next-filler.hz-card) {
		--card-frame: var(--hz-intent-primary, #2563eb);
	}
</style>
