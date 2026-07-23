<script lang="ts">
	import { Tabs } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import { tabsDoc } from '../../../docs/data/tabs.js';
	import Example from '../../../docs/Example.svelte';

	const discTabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'flight', label: 'Flight numbers' },
		{ id: 'reviews', label: 'Reviews' },
		{ id: 'compare', label: 'Compare', disabled: true }
	];

	const discContent: Record<string, string> = {
		overview:
			'A stable distance driver for windy rounds — predictable fade without fighting you on hyzer lines.',
		flight: 'Speed 12 · Glide 5 · Turn −1 · Fade 3. Best for arm speeds above 350 ft.',
		reviews: '"Handles headwinds beautifully — my new go-to off the tee." · 4.8/5 from 212 rounds',
		compare: 'Comparison view is coming soon.'
	};

	const orientations = ['horizontal', 'vertical'] as const;
	const activations = ['auto', 'manual'] as const;

	let activeId = $state('overview');

	const demoTabs = [
		{ id: 'orientation', label: 'Orientation' },
		{ id: 'activation', label: 'Activation' },
		{ id: 'rich-labels', label: 'Rich labels' },
		{ id: 'onchange', label: 'onChange' }
	];

	// Example-code builders — derived from the selected sub-tab so the code
	// pane updates live with the demo.
	function orientationCode(orientation: string): string {
		return [
			'<!-- The panel snippet receives the item — render per-item content -->',
			orientation === 'horizontal'
				? '<Tabs items={discTabs} ariaLabel="Disc details">'
				: '<Tabs items={discTabs} orientation="vertical" ariaLabel="Disc details">',
			'\t{#snippet panel(item)}',
			'\t\t<p>{discContent[item.id]}</p>',
			'\t{/snippet}',
			'</Tabs>'
		].join('\n');
	}

	function activationCode(activation: string): string {
		return [
			activation === 'auto'
				? '<Tabs items={discTabs} ariaLabel="Disc details">'
				: '<Tabs items={discTabs} activation="manual" ariaLabel="Disc details">',
			'\t{#snippet panel(item)}',
			'\t\t<p>{discContent[item.id]}</p>',
			'\t{/snippet}',
			'</Tabs>'
		].join('\n');
	}

	const richLabelsCode = [
		'<!-- label accepts string | Snippet — use a snippet for inner markup -->',
		'{#snippet reviewsLabel()}',
		'\tReviews <span class="badge">212</span>',
		'{/snippet}',
		'',
		`<Tabs items={[{ id: 'overview', label: 'Overview' }, { id: 'reviews', label: reviewsLabel }]} ariaLabel="Disc details">`,
		'\t{#snippet panel(item)}…{/snippet}',
		'</Tabs>'
	].join('\n');

	const onchangeCode = [
		'<Tabs items={discTabs} onChange={(id) => (activeId = id)} ariaLabel="Disc details">',
		'\t{#snippet panel(item)}…{/snippet}',
		'</Tabs>'
	].join('\n');
</script>

<DocPage name="Tabs" {...tabsDoc}>
	<Tabs items={demoTabs} ariaLabel="Tabs demos" defaultTab="orientation">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'orientation'}
					<Tabs
						items={orientations.map((o) => ({ id: o, label: o }))}
						ariaLabel="Tabs orientation"
						defaultTab="horizontal"
					>
						{#snippet panel(oItem)}
							<div class="inner-tab">
								<Example code={orientationCode(oItem.id)}>
									<Tabs
										items={discTabs}
										orientation={oItem.id as (typeof orientations)[number]}
										ariaLabel="Disc details ({oItem.id})"
									>
										{#snippet panel(dItem)}
											<div class="panel-content">
												<p>{discContent[dItem.id]}</p>
											</div>
										{/snippet}
									</Tabs>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'activation'}
					<p class="tab-note">
						With <code>auto</code> (default), arrow keys activate tabs as focus moves. With
						<code>manual</code>, arrows only move focus — <kbd>Enter</kbd>/<kbd>Space</kbd>
						activates. Try arrowing through both with the keyboard.
					</p>
					<Tabs
						items={activations.map((a) => ({ id: a, label: a }))}
						ariaLabel="Tabs activation"
						defaultTab="auto"
					>
						{#snippet panel(actItem)}
							<div class="inner-tab">
								<Example code={activationCode(actItem.id)}>
									<Tabs
										items={discTabs}
										activation={actItem.id as (typeof activations)[number]}
										ariaLabel="Disc details ({actItem.id} activation)"
									>
										{#snippet panel(dItem)}
											<div class="panel-content">
												<p>{discContent[dItem.id]}</p>
											</div>
										{/snippet}
									</Tabs>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'rich-labels'}
					{#snippet reviewsLabel()}
						Reviews <span class="badge">212</span>
					{/snippet}
					<Example code={richLabelsCode}>
						<Tabs
							items={[
								{ id: 'overview', label: 'Overview' },
								{ id: 'reviews', label: reviewsLabel }
							]}
							ariaLabel="Disc details (rich labels)"
						>
							{#snippet panel(dItem)}
								<div class="panel-content">
									<p>{discContent[dItem.id]}</p>
								</div>
							{/snippet}
						</Tabs>
					</Example>
				{:else}
					<Example code={onchangeCode}>
						<p class="active-readout" aria-live="polite">
							Active: <code>{activeId}</code>
						</p>
						<Tabs
							items={discTabs}
							onChange={(id) => (activeId = id)}
							ariaLabel="Disc details (onChange)"
						>
							{#snippet panel(dItem)}
								<div class="panel-content">
									<p>{discContent[dItem.id]}</p>
								</div>
							{/snippet}
						</Tabs>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-note code,
	.tab-note kbd {
		font-family: var(--hz-font-family-mono, monospace);
	}
	.panel-content p {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
	.badge {
		display: inline-block;
		margin-inline-start: 0.375rem;
		padding: 0.1em 0.5em;
		border-radius: var(--hz-radius-full, 9999px);
		background: color-mix(in srgb, var(--hz-color-primary, #2563eb) 14%, transparent);
		color: var(--hz-color-primary, #2563eb);
		font-size: var(--hz-font-size-sm, 0.875rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}
	.active-readout {
		margin: 0 0 0.75rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
