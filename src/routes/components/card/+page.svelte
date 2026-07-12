<script lang="ts">
	import { Card, Tabs, Button } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'padding', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'" },
		{ name: 'rounded', type: "'none' | 'sm' | 'md' | 'lg'", default: "'md'" },
		{ name: 'href', type: 'string', default: '—', note: 'Makes the whole card clickable.' },
		{ name: 'ariaLabel', type: 'string', default: '—', note: 'Required when href is set.' },
		{ name: 'horizontal', type: 'boolean', default: 'false' },
		{ name: 'mediaPosition', type: "'start' | 'end'", default: "'start'" },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-card class.' },
		{ name: 'media', type: 'Snippet', default: '—' },
		{ name: 'children', type: 'Snippet', default: '—' },
		{ name: 'actions', type: 'Snippet', default: '—' }
	];

	const paddings = ['none', 'sm', 'md', 'lg'] as const;
	const roundeds = ['none', 'sm', 'md', 'lg'] as const;

	const demoTabs = [
		{ id: 'padding', label: 'Padding' },
		{ id: 'rounded', label: 'Rounded' },
		{ id: 'actions', label: 'With actions' },
		{ id: 'clickable', label: 'Clickable' },
		{ id: 'layout', label: 'Layout' }
	];

	// Example-code builders — derived from the selected sub-tab so the code
	// pane updates live with the demo.
	function paddingCode(padding: string): string {
		return [`<Card padding="${padding}">`, `\t<p>padding="${padding}"</p>`, '</Card>'].join('\n');
	}

	function roundedCode(rounded: string): string {
		return [`<Card rounded="${rounded}">`, `\t<p>rounded="${rounded}"</p>`, '</Card>'].join('\n');
	}

	const actionsCode = [
		'<Card>',
		'\t<p>A card with action buttons in the footer area.</p>',
		'\t{#snippet actions()}',
		'\t\t<Button size="sm">Primary</Button>',
		'\t\t<Button size="sm" variant="ghost" intent="danger">Cancel</Button>',
		'\t{/snippet}',
		'</Card>'
	].join('\n');

	const clickableCode = [
		'<Card href="/components/button" ariaLabel="Navigate to Button docs">',
		'\t<p>Entire card is a link. Click anywhere.</p>',
		'</Card>'
	].join('\n');

	// All four layout combinations: horizontal × mediaPosition.
	const layouts = [
		{ id: 'v-start', label: 'vertical · media start', horizontal: false, mediaPosition: 'start' },
		{ id: 'v-end', label: 'vertical · media end', horizontal: false, mediaPosition: 'end' },
		{ id: 'h-start', label: 'horizontal · media start', horizontal: true, mediaPosition: 'start' },
		{ id: 'h-end', label: 'horizontal · media end', horizontal: true, mediaPosition: 'end' }
	] as const;

	type Layout = (typeof layouts)[number];

	function layoutCode(l: Layout): string {
		const attrs = `${l.horizontal ? ' horizontal' : ''}${l.mediaPosition === 'end' ? ' mediaPosition="end"' : ''}`;
		return [
			`<Card${attrs}>`,
			'\t{#snippet media()}',
			'\t\t<img src="…" alt="…" />',
			'\t{/snippet}',
			'\t<h3>Course spotlight</h3>',
			'\t<p>Eighteen wooded holes with tight fairways and big elevation changes.</p>',
			'\t{#snippet actions()}',
			'\t\t<Button size="sm">View course</Button>',
			'\t{/snippet}',
			'</Card>'
		].join('\n');
	}
</script>

<DocPage
	name="Card"
	description="A content container with optional media, actions, horizontal layout, and clickable-overlay support."
	importLine={'import {Card} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="When `href` is set the entire card is wrapped in a link — supply `ariaLabel` with a descriptive name. Inner interactive elements remain clickable above the overlay via z-index."
>
	<p class="demo-note">
		Card is headless — the dashed outline below is docs scaffolding so its box is visible.
	</p>
	<Tabs items={demoTabs} ariaLabel="Card demos" defaultTab="padding">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'padding'}
					<Tabs
						items={paddings.map((p) => ({ id: p, label: p }))}
						ariaLabel="Card padding"
						defaultTab="md"
					>
						{#snippet panel(pItem)}
							<div class="inner-tab">
								<Example code={paddingCode(pItem.id)}>
									<Card padding={pItem.id as (typeof paddings)[number]} class="demo-card">
										<p class="card-body">padding="{pItem.id}"</p>
									</Card>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'rounded'}
					<Tabs
						items={roundeds.map((r) => ({ id: r, label: r }))}
						ariaLabel="Card rounded"
						defaultTab="md"
					>
						{#snippet panel(rItem)}
							<div class="inner-tab">
								<Example code={roundedCode(rItem.id)}>
									<Card rounded={rItem.id as (typeof roundeds)[number]} class="demo-card">
										<p class="card-body">rounded="{rItem.id}"</p>
									</Card>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'actions'}
					<Example code={actionsCode}>
						<Card class="demo-card">
							<p class="card-body">A card with action buttons in the footer area.</p>
							{#snippet actions()}
								<Button size="sm">Primary</Button>
								<Button size="sm" variant="ghost" intent="danger">Cancel</Button>
							{/snippet}
						</Card>
					</Example>
				{:else if item.id === 'clickable'}
					<Example code={clickableCode}>
						<Card class="demo-card" href="/components/button" ariaLabel="Navigate to Button docs">
							<p class="card-body">Entire card is a link. Click anywhere.</p>
						</Card>
					</Example>
				{:else}
					<Tabs items={[...layouts]} ariaLabel="Card layout" defaultTab="v-start">
						{#snippet panel(lItem)}
							{@const layout = layouts.find((l) => l.id === lItem.id) ?? layouts[0]}
							<div class="inner-tab">
								<Example code={layoutCode(layout)}>
									<Card
										class="demo-card"
										horizontal={layout.horizontal}
										mediaPosition={layout.mediaPosition}
									>
										{#snippet media()}
											<div
												class="media-placeholder"
												role="img"
												aria-label="Media placeholder"
											></div>
										{/snippet}
										<h3 class="card-title">Course spotlight</h3>
										<p class="card-body">
											Eighteen wooded holes with tight fairways and big elevation changes.
										</p>
										{#snippet actions()}
											<Button size="sm">View course</Button>
										{/snippet}
									</Card>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-content {
		padding-top: 1rem;
	}
	.inner-tab {
		padding-top: 0.5rem;
	}
	.demo-note {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
	/* Docs scaffolding only — makes the headless card's box visible. */
	:global(.demo-card) {
		border: 1px dashed var(--hz-color-border, #6b7280);
	}
	.card-title {
		margin: 0 0 0.375rem;
		font-size: var(--hz-font-size-base, 1rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}
	.card-body {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
	.media-placeholder {
		width: 100%;
		min-height: 8rem;
		background: var(--hz-color-gray, #6b7280);
		min-width: 8rem;
	}
</style>
