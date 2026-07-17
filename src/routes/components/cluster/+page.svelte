<script lang="ts">
	import { Cluster, Tabs } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{
			name: 'gap',
			type: "'none' | 'xs' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
			default: "'sm'",
			note: 'near/away are the density distances — they tighten inside data-density-shift regions.'
		},
		{
			name: 'justify',
			type: "'start' | 'center' | 'end' | 'between' | 'around'",
			default: "'start'"
		},
		{
			name: 'align',
			type: "'start' | 'center' | 'end' | 'stretch' | 'baseline'",
			default: "'center'",
			note: 'Shared LayoutAlign scale (Stack/Cluster/Grid).'
		},
		{ name: 'wrap', type: 'boolean', default: 'true' },
		{
			name: 'padding',
			type: "'none' | 'sm' | 'md' | 'lg' | 'near' | 'away'",
			default: "'none'",
			note: 'Both axes. Shared LayoutPadding scale — near/away tighten inside data-density-shift regions.'
		},
		{ name: 'as', type: 'string', default: "'div'" },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-cluster class.' }
	];

	const gapValues = ['none', 'xs', 'sm', 'md', 'lg', 'near', 'away'] as const;
	const justifyValues = ['start', 'center', 'end', 'between', 'around'] as const;
	const alignValues = ['start', 'center', 'end', 'stretch', 'baseline'] as const;

	const tags = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];

	// Enough chips to guarantee wrapping in the docs column — and a clearly
	// overflowing single line for the nowrap variant.
	const manyTags = [
		...tags,
		'Iota',
		'Kappa',
		'Lambda',
		'Omicron',
		'Sigma',
		'Upsilon',
		'Omega',
		'Epsilon II'
	];

	function gapCode(gap: string): string {
		return [
			`<Cluster gap="${gap}">`,
			...tags.slice(0, 5).map((t) => `\t<span class="chip">${t}</span>`),
			'</Cluster>'
		].join('\n');
	}

	function justifyCode(justify: string): string {
		return [
			`<Cluster justify="${justify}">`,
			'\t<span class="chip">One</span>',
			'\t<span class="chip">Two</span>',
			'\t<span class="chip">Three</span>',
			'</Cluster>'
		].join('\n');
	}

	function alignCode(align: string): string {
		return [
			`<Cluster align="${align}">`,
			'\t<span class="chip">small</span>',
			'\t<span class="chip chip--lg">large type</span>',
			'\t<span class="chip chip--tall">tall box</span>',
			'</Cluster>'
		].join('\n');
	}

	const paddingValues = ['none', 'sm', 'md', 'lg', 'near', 'away'] as const;

	function paddingCode(padding: string): string {
		return [
			`<Cluster padding="${padding}">`,
			'\t<span class="chip">One</span>',
			'\t<span class="chip">Two</span>',
			'\t<span class="chip">Three</span>',
			'</Cluster>'
		].join('\n');
	}

	const wrapCode = [
		'<Cluster>…sixteen chips…</Cluster>',
		'',
		'<!-- nowrap keeps one line; pair with overflow-x on a wrapper to scroll -->',
		'<Cluster wrap={false}>…sixteen chips…</Cluster>'
	].join('\n');

	const demoTabs = [
		{ id: 'gap', label: 'Gap' },
		{ id: 'justify', label: 'Justify' },
		{ id: 'align', label: 'Align' },
		{ id: 'padding', label: 'Padding' },
		{ id: 'wrap', label: 'Wrap' }
	];
</script>

<DocPage
	name="Cluster"
	description="Lays children out in a horizontal row that wraps to new lines as needed."
	importLine={'import {Cluster} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Cluster is a layout primitive with no ARIA semantics. Reading and focus order follow DOM order."
>
	<Tabs items={demoTabs} ariaLabel="Cluster demos" defaultTab="gap">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'gap'}
					<p class="tab-note">
						<code>near</code> and <code>away</code> are the
						<a href="/foundation/spacing">density distances</a> — context-aware values that tighten
						inside <code>data-density-shift</code> regions.
					</p>
					<Tabs
						items={gapValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Gap value"
						defaultTab="sm"
					>
						{#snippet panel(gapItem)}
							<div class="inner-tab">
								<Example code={gapCode(gapItem.id)}>
									<Cluster gap={gapItem.id as (typeof gapValues)[number]}>
										{#each tags.slice(0, 5) as tag (tag)}
											<span class="chip">{tag}</span>
										{/each}
									</Cluster>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'justify'}
					<p class="tab-note">
						<code>justify</code> distributes the row's leftover inline space —
						<code>between</code> pushes the first and last children to the edges.
					</p>
					<Tabs
						items={justifyValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Justify value"
						defaultTab="start"
					>
						{#snippet panel(jItem)}
							<div class="inner-tab">
								<Example code={justifyCode(jItem.id)}>
									<Cluster justify={jItem.id as (typeof justifyValues)[number]} class="demo-frame">
										<span class="chip">One</span>
										<span class="chip">Two</span>
										<span class="chip">Three</span>
									</Cluster>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'align'}
					<p class="tab-note">
						<code>align</code> positions children of different heights on the cross axis —
						<code>baseline</code> lines up their text baselines regardless of box size.
					</p>
					<Tabs
						items={alignValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Align value"
						defaultTab="center"
					>
						{#snippet panel(aItem)}
							<div class="inner-tab">
								<Example code={alignCode(aItem.id)}>
									<Cluster align={aItem.id as (typeof alignValues)[number]} class="demo-frame">
										<span class="chip">small</span>
										<span class="chip chip--lg">large type</span>
										<span class="chip chip--tall">tall box</span>
									</Cluster>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'padding'}
					<p class="tab-note">
						The tinted zone is the Cluster; the space between its edge and the chips is the padding,
						applied on both axes.
					</p>
					<Tabs
						items={paddingValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Padding value"
						defaultTab="md"
					>
						{#snippet panel(padItem)}
							<div class="inner-tab">
								<Example code={paddingCode(padItem.id)}>
									<Cluster padding={padItem.id as (typeof paddingValues)[number]} class="pad-frame">
										<span class="chip">One</span>
										<span class="chip">Two</span>
										<span class="chip">Three</span>
									</Cluster>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else}
					<p class="tab-note">
						The default wraps onto new lines as space runs out. <code>wrap={'{false}'}</code> keeps a
						single line — the second demo sits in a scrollable wrapper so the overflow is reachable.
					</p>
					<Example code={wrapCode}>
						<p class="wrap-label">wrap (default)</p>
						<Cluster class="demo-frame">
							{#each manyTags as tag (tag)}
								<span class="chip">{tag}</span>
							{/each}
						</Cluster>
						<p class="wrap-label">wrap=&#123;false&#125;</p>
						<div class="scroll-x">
							<Cluster wrap={false} class="demo-frame">
								{#each manyTags as tag (tag)}
									<span class="chip">{tag}</span>
								{/each}
							</Cluster>
						</div>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	:global(.pad-frame) {
		background: color-mix(in srgb, var(--hz-color-secondary, #7c3aed) 12%, transparent);
		border: 1px dashed var(--hz-color-secondary, #7c3aed);
		border-radius: var(--hz-radius-sm, 0.25rem);
	}
	:global(.demo-frame) {
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-sm, 0.25rem);
		padding: 0.5rem;
	}
	.chip {
		padding: 0.25rem 0.75rem;
		background: color-mix(in srgb, var(--hz-color-primary, #2563eb) 15%, transparent);
		border: 1px solid var(--hz-color-primary, #2563eb);
		border-radius: var(--hz-radius-full, 9999px);
		font-size: var(--hz-font-size-sm, 0.875rem);
		white-space: nowrap;
	}
	.chip--lg {
		font-size: var(--hz-font-size-lg, 1.4rem);
	}
	.chip--tall {
		padding-block: 1.25rem;
	}
	.wrap-label {
		margin: 0 0 0.5rem;
		font-family: var(--hz-font-family-mono, monospace);
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
	.wrap-label + :global(.demo-frame),
	.scroll-x {
		margin-bottom: 1rem;
	}
	.scroll-x {
		overflow-x: auto;
		margin-bottom: 0;
	}
</style>
