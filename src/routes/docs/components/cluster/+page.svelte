<script lang="ts">
	import { Cluster, RadioGroup, Stack, Tabs } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { clusterDoc } from '../../../../docs/data/cluster.js';
	import Example from '../../../../docs/Example.svelte';

	const gapValues = ['none', 'xs', 'sm', 'md', 'lg', 'near', 'away'] as const;
	const justifyValues = ['start', 'center', 'end', 'between', 'around'] as const;
	const alignValues = ['start', 'center', 'end', 'stretch', 'baseline'] as const;
	type GapValue = (typeof gapValues)[number];
	type JustifyValue = (typeof justifyValues)[number];
	type AlignValue = (typeof alignValues)[number];
	let gap = $state<GapValue>('sm');
	let justify = $state<JustifyValue>('start');
	let align = $state<AlignValue>('center');

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

	function spacingCode(gap: string, padding: string): string {
		return [
			`<Cluster gap="${gap}" padding="${padding}">…</Cluster>`,
			`<Cluster gap="${gap}" paddingInline="${padding}">…</Cluster>`,
			`<Cluster gap="${gap}" paddingBlock="${padding}">…</Cluster>`
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
	type PaddingValue = (typeof paddingValues)[number];
	let padding = $state<PaddingValue>('md');

	const wrapCode = [
		'<Cluster>…sixteen chips…</Cluster>',
		'',
		'<!-- nowrap keeps one line; pair with overflow-x on a wrapper to scroll -->',
		'<Cluster wrap={false}>…sixteen chips…</Cluster>'
	].join('\n');

	const demoTabs = [
		{ id: 'spacing', label: 'Spacing' },
		{ id: 'justify', label: 'Justify' },
		{ id: 'align', label: 'Align' },
		{ id: 'wrap', label: 'Wrap' }
	];
</script>

<DocPage name="Cluster" {...clusterDoc}>
	<Tabs items={demoTabs} ariaLabel="Cluster demos" defaultTab="spacing">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'spacing'}
					<p class="tab-note">
						<code>gap</code> is the space between chips, on both axes when the row wraps. The tinted
						zone is the Cluster; the space between its edge and the chips is the
						<code>padding</code>. <code>padding</code> applies on both axes;
						<code>paddingInline</code> and <code>paddingBlock</code> override one axis and win where
						set. Both stay correct in RTL and vertical writing modes. <code>near</code> and
						<code>away</code> are the <a href="/docs/foundation/spacing">density distances</a>:
						context-aware values that tighten inside <code>data-density-shift</code> regions.
					</p>
					<Stack gap="sm">
						<RadioGroup
							name="cluster-gap"
							label="gap"
							orientation="horizontal"
							options={gapValues.map((v) => ({ value: v, label: v }))}
							bind:value={gap}
						/>
						<RadioGroup
							name="cluster-padding"
							label="padding"
							orientation="horizontal"
							options={paddingValues.map((v) => ({ value: v, label: v }))}
							bind:value={padding}
						/>
						<Example code={spacingCode(gap, padding)}>
							<Stack gap="sm">
								<Cluster {gap} {padding} class="pad-frame">
									<span class="chip">padding="{padding}"</span>
									<span class="chip">gap="{gap}"</span>
									<span class="chip">Three</span>
								</Cluster>
								<Cluster {gap} paddingInline={padding} class="pad-frame">
									<span class="chip">paddingInline="{padding}"</span>
									<span class="chip">gap="{gap}"</span>
									<span class="chip">Three</span>
								</Cluster>
								<Cluster {gap} paddingBlock={padding} class="pad-frame">
									<span class="chip">paddingBlock="{padding}"</span>
									<span class="chip">gap="{gap}"</span>
									<span class="chip">Three</span>
								</Cluster>
							</Stack>
						</Example>
					</Stack>
				{:else if item.id === 'justify'}
					<p class="tab-note">
						<code>justify</code> distributes the row's leftover inline space.
						<code>between</code> pushes the first and last children to the edges.
					</p>
					<Stack gap="sm">
						<RadioGroup
							name="cluster-justify"
							label="justify"
							orientation="horizontal"
							options={justifyValues.map((v) => ({ value: v, label: v }))}
							bind:value={justify}
						/>
						<Example code={justifyCode(justify)}>
							<Cluster {justify} class="demo-frame">
								<span class="chip">One</span>
								<span class="chip">Two</span>
								<span class="chip">Three</span>
							</Cluster>
						</Example>
					</Stack>
				{:else if item.id === 'align'}
					<p class="tab-note">
						<code>align</code> positions children of different heights on the cross axis.
						<code>baseline</code> lines up their text baselines regardless of box size.
					</p>
					<Stack gap="sm">
						<RadioGroup
							name="cluster-align"
							label="align"
							orientation="horizontal"
							options={alignValues.map((v) => ({ value: v, label: v }))}
							bind:value={align}
						/>
						<Example code={alignCode(align)}>
							<Cluster {align} class="demo-frame">
								<span class="chip">small</span>
								<span class="chip chip--lg">large type</span>
								<span class="chip chip--tall">tall box</span>
							</Cluster>
						</Example>
					</Stack>
				{:else}
					<p class="tab-note">
						The default wraps onto new lines as space runs out. <code>wrap={'{false}'}</code> keeps a
						single line. The second demo sits in a scrollable wrapper, so the overflow is reachable.
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
		background: color-mix(in srgb, var(--hz-intent-secondary, #7c3aed) 12%, transparent);
		border: 1px dashed var(--hz-intent-secondary, #7c3aed);
		border-radius: var(--hz-radius-sm, 0.25rem);
	}
	:global(.demo-frame) {
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-sm, 0.25rem);
		padding: 0.5rem;
	}
	.chip {
		padding: 0.25rem 0.75rem;
		background: color-mix(in srgb, var(--hz-intent-primary, #2563eb) 15%, transparent);
		border: 1px solid var(--hz-intent-primary, #2563eb);
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
