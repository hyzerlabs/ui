<script lang="ts">
	import { Skeleton, Loading, Card, Stack, Cluster, Tabs } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { skeletonDoc } from '../../../../docs/data/skeleton.js';
	import Example from '../../../../docs/Example.svelte';

	// ------------------------------------------------------------------
	// Demo 1 — shapes
	// ------------------------------------------------------------------

	const shapesCode = [
		'<Skeleton variant="text" />',
		'<Skeleton variant="circle" />',
		'<Skeleton variant="rect" />',
		'<div style="width: 8rem; height: 4rem;">',
		'\t<Skeleton variant="block" />',
		'</div>'
	].join('\n');

	// ------------------------------------------------------------------
	// Demo 2 — multi-line text
	// ------------------------------------------------------------------

	const multilineCode = '<Skeleton variant="text" lines={3} />';

	// ------------------------------------------------------------------
	// Demo 3 — animation
	// ------------------------------------------------------------------

	const animationCode = [
		'<Skeleton animation="shimmer" />',
		'<Skeleton animation="pulse" />',
		'<Skeleton animation="none" />'
	].join('\n');

	// ------------------------------------------------------------------
	// Demo 4 — the paired loading pattern (R13): Loading announces,
	// Skeleton decorates.
	// ------------------------------------------------------------------

	const pairedCode = [
		'<div aria-busy="true">',
		'\t<Loading label="Loading comments" />',
		'\t<Skeleton variant="text" lines={3} />',
		'</div>'
	].join('\n');

	// ------------------------------------------------------------------
	// Demo 5 — composed: card (media + avatar + heading + body)
	// ------------------------------------------------------------------

	const cardCode = [
		'<Card>',
		'\t{#snippet media()}',
		'\t\t<div style="aspect-ratio: 16/9">',
		'\t\t\t<Skeleton variant="block" />',
		'\t\t</div>',
		'\t{/snippet}',
		'\t<Cluster gap="sm">',
		'\t\t<Skeleton variant="circle" width="2.5rem" />',
		'\t\t<Stack gap="xs">',
		'\t\t\t<Skeleton variant="text" width="8rem" />',
		'\t\t\t<Skeleton variant="text" lines={2} />',
		'\t\t</Stack>',
		'\t</Cluster>',
		'</Card>'
	].join('\n');

	// ------------------------------------------------------------------
	// Demo 6 — composed: table (header row of short bars, body rows of
	// cell bars) — the compose-your-own analogue to Table's built-in
	// `loading` rows.
	// ------------------------------------------------------------------

	const tableCode = [
		'<div class="skeleton-table">',
		'\t<div class="skeleton-table-row">',
		'\t\t<Skeleton variant="text" width="30%" height="0.75rem" />',
		'\t\t<Skeleton variant="text" width="20%" height="0.75rem" />',
		'\t\t<Skeleton variant="text" width="20%" height="0.75rem" />',
		'\t\t<Skeleton variant="text" width="15%" height="0.75rem" />',
		'\t</div>',
		'\t{#each { length: 4 }, i (i)}',
		'\t\t<div class="skeleton-table-row">',
		'\t\t\t<Skeleton variant="text" width="30%" />',
		'\t\t\t<Skeleton variant="text" width="20%" />',
		'\t\t\t<Skeleton variant="text" width="20%" />',
		'\t\t\t<Skeleton variant="text" width="15%" />',
		'\t\t</div>',
		'\t{/each}',
		'</div>'
	].join('\n');

	// ------------------------------------------------------------------
	// Demo 7 — composed: prose (heading + multi-line paragraph, repeated)
	// ------------------------------------------------------------------

	const proseCode = [
		'<Stack gap="lg">',
		'\t<Stack gap="sm">',
		'\t\t<Skeleton variant="text" width="40%" height="1.5rem" />',
		'\t\t<Skeleton variant="text" lines={3} />',
		'\t</Stack>',
		'\t<Stack gap="sm">',
		'\t\t<Skeleton variant="text" width="55%" height="1.5rem" />',
		'\t\t<Skeleton variant="text" lines={4} />',
		'\t</Stack>',
		'</Stack>'
	].join('\n');

	const demoTabs = [
		{ id: 'shapes', label: 'Shapes' },
		{ id: 'multiline', label: 'Multi-line text' },
		{ id: 'animation', label: 'Animation' },
		{ id: 'pattern', label: 'Paired loading pattern' },
		{ id: 'card', label: 'Card (composed)' },
		{ id: 'table', label: 'Table (composed)' },
		{ id: 'prose', label: 'Prose (composed)' }
	];
</script>

<DocPage name="Skeleton" {...skeletonDoc}>
	<Tabs items={demoTabs} ariaLabel="Skeleton demos" defaultTab="shapes">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'shapes'}
					<Example code={shapesCode}>
						<Stack gap="md">
							<Skeleton variant="text" />
							<Skeleton variant="circle" />
							<Skeleton variant="rect" />
							<div class="block-box">
								<Skeleton variant="block" />
							</div>
						</Stack>
					</Example>
				{:else if item.id === 'multiline'}
					<p class="tab-note">
						The last line uses <code>lastLineWidth</code> (default 60%) so the block reads like a real
						paragraph.
					</p>
					<Example code={multilineCode}>
						<Skeleton variant="text" lines={3} />
					</Example>
				{:else if item.id === 'animation'}
					<Example code={animationCode}>
						<Stack gap="md">
							<Skeleton animation="shimmer" />
							<Skeleton animation="pulse" />
							<Skeleton animation="none" />
						</Stack>
					</Example>
				{:else if item.id === 'pattern'}
					<p class="tab-note">
						Skeleton is decorative (<code>aria-hidden</code>) and cannot announce loading on its
						own. Pair it with a labelled indeterminate <code>Loading</code> (or a polite
						<code>aria-live</code> message) inside an <code>aria-busy</code> region. Screen-reader users
						then hear that content is coming, and hear when it arrives.
					</p>
					<Example code={pairedCode}>
						<div aria-busy="true">
							<Stack gap="sm">
								<Loading label="Loading comments" />
								<Skeleton variant="text" lines={3} />
							</Stack>
						</div>
					</Example>
				{:else if item.id === 'card'}
					<p class="tab-note">
						There is no card-skeleton prop. Compose several Skeletons in your own Card/Stack/Cluster
						layout instead.
					</p>
					<Example code={cardCode}>
						<div class="composed-frame">
							<Card class="demo-card">
								{#snippet media()}
									<div class="media-box">
										<Skeleton variant="block" />
									</div>
								{/snippet}
								<Cluster gap="sm">
									<Skeleton variant="circle" width="2.5rem" />
									<Stack gap="xs">
										<Skeleton variant="text" width="8rem" />
										<Skeleton variant="text" lines={2} />
									</Stack>
								</Cluster>
							</Card>
						</div>
					</Example>
				{:else if item.id === 'table'}
					<Example code={tableCode}>
						<div class="composed-frame">
							<div class="skeleton-table">
								<div class="skeleton-table-row">
									<Skeleton variant="text" width="30%" height="0.75rem" />
									<Skeleton variant="text" width="20%" height="0.75rem" />
									<Skeleton variant="text" width="20%" height="0.75rem" />
									<Skeleton variant="text" width="15%" height="0.75rem" />
								</div>
								{#each { length: 4 }, i (i)}
									<div class="skeleton-table-row">
										<Skeleton variant="text" width="30%" />
										<Skeleton variant="text" width="20%" />
										<Skeleton variant="text" width="20%" />
										<Skeleton variant="text" width="15%" />
									</div>
								{/each}
							</div>
						</div>
					</Example>
				{:else}
					<Example code={proseCode}>
						<div class="composed-frame">
							<Stack gap="lg">
								<Stack gap="sm">
									<Skeleton variant="text" width="40%" height="1.5rem" />
									<Skeleton variant="text" lines={3} />
								</Stack>
								<Stack gap="sm">
									<Skeleton variant="text" width="55%" height="1.5rem" />
									<Skeleton variant="text" lines={4} />
								</Stack>
							</Stack>
						</div>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-note {
		margin: 0 0 1rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.block-box {
		width: 8rem;
		height: 4rem;
	}

	.composed-frame {
		max-width: 24rem;
	}

	.media-box {
		aspect-ratio: 16 / 9;
	}

	:global(.demo-card) {
		width: 100%;
	}

	.skeleton-table {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.skeleton-table-row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
</style>
