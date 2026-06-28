<script lang="ts">
	import { Stack } from '$lib';
	import { manifest } from '../../docs/manifest';
	const section = manifest.find((s) => s.href === '/forms')!;
</script>

<svelte:head><title>Forms — @hyzer-labs/ui</title></svelte:head>

<Stack gap="lg">
	<div>
		<h1>Forms</h1>
		<p>Accessible form and field components built on native HTML elements.</p>
	</div>
	<nav aria-label="Forms pages">
		<ul class="page-list">
			{#each section.children ?? [] as p (p.href)}
				<li><a href={p.href} class="page-link">{p.label}</a></li>
			{/each}
		</ul>
	</nav>
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
	.page-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.page-link {
		font-size: var(--hz-font-size-lg, 1.25rem);
		color: var(--hz-color-primary, #2563eb);
	}
</style>
