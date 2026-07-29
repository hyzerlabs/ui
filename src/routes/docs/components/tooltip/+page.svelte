<script lang="ts">
	import { Button, Tabs, Cluster, Stack, Alert } from '$lib';
	import { tooltip } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { tooltipDoc } from '../../../../docs/data/tooltip.js';
	import Example from '../../../../docs/Example.svelte';
	import IconInfo from '$lib/icons/generated/info.svelte';
	import IconPlus from '$lib/icons/generated/plus.svelte';
	import IconTrash from '$lib/icons/generated/trash.svelte';

	// ------------------------------------------------------------------
	// Basic — an icon button described by a tooltip.
	// ------------------------------------------------------------------

	const basicCode = [
		'<Button ariaLabel="Add to bag" {@attach tooltip(\'Add to bag\')}>',
		'\t{#snippet iconStart()}<IconPlus />{/snippet}',
		'</Button>'
	].join('\n');

	// ------------------------------------------------------------------
	// Placement — the eight placements around a centered trigger.
	// ------------------------------------------------------------------

	// A `null` marks an empty cell — keeps left/right on the middle row and
	// pushes bottom-start/bottom/bottom-end together onto their own row.
	const placements = [
		'top-start',
		'top',
		'top-end',
		'left',
		null,
		'right',
		'bottom-start',
		'bottom',
		'bottom-end'
	] as const;

	const placementCode = [
		"<Button {@attach tooltip({ text: 'Placement: top-start', placement: 'top-start' })}>",
		'\ttop-start',
		'</Button>',
		"<!-- …one per placement: 'top' | 'top-end' | 'left' | 'right' | 'bottom-start' | 'bottom' | 'bottom-end' -->"
	].join('\n');

	// ------------------------------------------------------------------
	// Long text — a tooltip whose content wraps rather than overflowing.
	// ------------------------------------------------------------------

	const longTextCode = [
		'<Button ariaLabel="Delete round" intent="danger" {@attach tooltip({',
		"\ttext: 'This permanently deletes the round and every scorecard linked to it. This cannot be undone.',",
		"\tplacement: 'top'",
		'})}>',
		'\t{#snippet iconStart()}<IconTrash />{/snippet}',
		'</Button>'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'placement', label: 'Placement' },
		{ id: 'long-text', label: 'Long text' },
		{ id: 'behaviors', label: 'Hover & keyboard' }
	];
</script>

<DocPage name="Tooltip" {...tooltipDoc}>
	<Alert intent="info" title="An attachment, not a component">
		<code>tooltip</code> attaches to an element you already have —
		<code>{"{@attach tooltip('…')}"}</code>
		— rather than wrapping it. For a click-triggered panel with interactive content, use
		<a href="/docs/components/popover">Popover</a> instead; tooltips are text-only.
	</Alert>

	<Tabs items={demoTabs} ariaLabel="Tooltip demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<p class="tab-note">
						Hover or focus the icon button. <code>ariaLabel</code> gives the button its own
						accessible name — separate from the tooltip's <code>aria-describedby</code>, which adds
						extra context rather than replacing the name.
					</p>
					<Example code={basicCode}>
						<Button ariaLabel="Add to bag" {@attach tooltip('Add to bag')}>
							{#snippet iconStart()}<IconPlus />{/snippet}
						</Button>
					</Example>
				{:else if item.id === 'placement'}
					<p class="tab-note">
						<code>placement</code> prefers a side and alignment; it flips automatically if the preferred
						side would overflow the viewport.
					</p>
					<Example code={placementCode}>
						<div class="placement-grid">
							{#each placements as p (p ?? 'empty')}
								{#if p === null}
									<div class="placement-grid-empty" aria-hidden="true"></div>
								{:else}
									<Button
										variant="outline"
										{@attach tooltip({ text: `Placement: ${p}`, placement: p })}
									>
										{p}
									</Button>
								{/if}
							{/each}
						</div>
					</Example>
				{:else if item.id === 'long-text'}
					<p class="tab-note">
						Tooltip text wraps at a fixed <code>max-width</code> instead of stretching edge to edge or
						overflowing the viewport.
					</p>
					<Example code={longTextCode}>
						<Button
							ariaLabel="Delete round"
							intent="danger"
							{@attach tooltip({
								text: 'This permanently deletes the round and every scorecard linked to it. This cannot be undone.',
								placement: 'top'
							})}
						>
							{#snippet iconStart()}<IconTrash />{/snippet}
						</Button>
					</Example>
				{:else}
					<Stack gap="sm">
						<p class="tab-note">
							<strong>Dismissible</strong> — press <kbd>Escape</kbd> while a tooltip is showing; it
							hides without moving focus and won't reopen until you leave and come back.
							<strong>Hoverable</strong> — move the pointer from the trigger onto the tooltip
							itself; it stays open. <strong>Persistent</strong> — it never disappears on its own while
							you're hovering or focused on it.
						</p>
						<Cluster gap="sm" align="center">
							<Button ariaLabel="Info" {@attach tooltip('Try hovering onto me, or press Escape')}>
								{#snippet iconStart()}<IconInfo />{/snippet}
							</Button>
						</Cluster>
					</Stack>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-content :global(.doc-example) {
		overflow: visible;
	}

	.placement-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 2.5rem 1rem;
		justify-items: center;
		padding: 2rem 1rem;
	}
</style>
