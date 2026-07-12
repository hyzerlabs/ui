<script lang="ts">
	import { Stack, Grid, Card } from '$lib';
	import { manifest } from '../../docs/manifest';

	const section = manifest.find((s) => s.href === '/components')!;
</script>

<svelte:head>
	<title>Components — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="lg">
	<div>
		<h1>Components</h1>
		<p>Interactive, accessible UI components — headless by design.</p>
	</div>

	<Grid columns={{ sm: 1, md: 2, lg: 3 }} gap="md">
		{#each section.children ?? [] as p (p.href)}
			<Card class="hz-card--outlined" padding="md" rounded="md">
				<a href={p.href} class="component-link">
					<h2 class="component-name">{p.label}</h2>
				</a>
			</Card>
		{/each}
	</Grid>
</Stack>

<style>
	h1 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-2xl, 2rem);
		font-weight: var(--hz-font-weight-bold, 700);
	}
	p {
		margin: 0;
		font-size: var(--hz-font-size-lg, 1.25rem);
	}
	.component-link {
		display: block;
		text-decoration: none;
		color: inherit;
	}
	.component-name {
		margin: 0;
		font-size: var(--hz-font-size-lg, 1.25rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}
	.component-name:hover {
		text-decoration: underline;
	}
</style>
