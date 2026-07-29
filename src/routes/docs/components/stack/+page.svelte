<script lang="ts">
	import { Stack, Tabs } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { stackDoc } from '../../../../docs/data/stack.js';
	import Example from '../../../../docs/Example.svelte';

	const gapValues = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'near', 'away'] as const;
	const alignValues = ['start', 'center', 'end', 'stretch', 'baseline'] as const;

	function gapCode(gap: string): string {
		return [
			`<Stack gap="${gap}">`,
			'\t<div>Item 1</div>',
			'\t<div>Item 2</div>',
			'\t<div>Item 3</div>',
			'</Stack>'
		].join('\n');
	}

	function alignCode(align: string): string {
		return [
			`<Stack align="${align}">`,
			'\t<div>Short</div>',
			'\t<div>Medium width item</div>',
			'</Stack>'
		].join('\n');
	}

	const paddingValues = ['none', 'sm', 'md', 'lg', 'near', 'away'] as const;

	function paddingCode(padding: string): string {
		return [
			`<Stack padding="${padding}">…</Stack>`,
			`<Stack paddingInline="${padding}">…</Stack>`,
			`<Stack paddingBlock="${padding}">…</Stack>`
		].join('\n');
	}

	const densityCode = [
		'<Stack gap="near">',
		'\t<div>Top-level — near = 4rem</div>',
		'\t<Stack gap="near" data-density-shift>',
		'\t\t<div>One shift — near = 2rem</div>',
		'\t\t<Stack gap="near" data-density-shift>',
		'\t\t\t<div>Two shifts — near = 0.8rem</div>',
		'\t\t</Stack>',
		'\t</Stack>',
		'</Stack>'
	].join('\n');

	const demoTabs = [
		{ id: 'gap', label: 'Gap' },
		{ id: 'align', label: 'Align' },
		{ id: 'padding', label: 'Padding' },
		{ id: 'density', label: 'Density' }
	];
</script>

<DocPage name="Stack" {...stackDoc}>
	<Tabs items={demoTabs} ariaLabel="Stack demos" defaultTab="gap">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'gap'}
					<p class="tab-note">
						Gap values map to the <code>--hz-space-*</code> tokens (<code>xs</code> 0.5rem →
						<code>xl</code> 8rem). <code>near</code> and <code>away</code> are the
						<a href="/docs/foundation/spacing">density distances</a> — context-aware values that
						tighten inside <code>data-density-shift</code> regions (see the Density tab). Dashed outline
						marks the Stack itself.
					</p>
					<Tabs
						items={gapValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Gap value"
						defaultTab="md"
					>
						{#snippet panel(gapItem)}
							<div class="inner-tab">
								<Example code={gapCode(gapItem.id)}>
									<Stack gap={gapItem.id as (typeof gapValues)[number]} class="demo-stack">
										<div class="demo-box">Item 1</div>
										<div class="demo-box">Item 2</div>
										<div class="demo-box">Item 3</div>
									</Stack>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'align'}
					<p class="tab-note">
						<code>align</code> maps to <code>align-items</code> — visible when children have
						different natural widths. The default <code>stretch</code> makes every child fill the Stack's
						width.
					</p>
					<Tabs
						items={alignValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Align value"
						defaultTab="stretch"
					>
						{#snippet panel(alignItem)}
							<div class="inner-tab">
								<Example code={alignCode(alignItem.id)}>
									<Stack align={alignItem.id as (typeof alignValues)[number]} class="demo-stack">
										<div class="demo-box">Short</div>
										<div class="demo-box">Medium width item</div>
									</Stack>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'padding'}
					<p class="tab-note">
						The tinted zone is the Stack; the space between its edge and the items is the padding.
						<code>padding</code> applies on both axes; <code>paddingInline</code> /
						<code>paddingBlock</code> override one axis and win where set. The axis names are the
						CSS logical properties, so they stay correct in RTL and vertical writing modes — see
						<a href="/docs/foundation/spacing#axes-heading">Spacing &amp; Sizing</a>.
					</p>
					<Tabs
						items={paddingValues.map((v) => ({ id: v, label: v }))}
						ariaLabel="Padding value"
						defaultTab="md"
					>
						{#snippet panel(padItem)}
							{@const v = padItem.id as (typeof paddingValues)[number]}
							<div class="inner-tab">
								<Example code={paddingCode(padItem.id)}>
									<Stack gap="sm">
										<Stack gap="sm" padding={v} class="pad-frame">
											<div class="demo-box">padding="{v}"</div>
										</Stack>
										<Stack gap="sm" paddingInline={v} class="pad-frame">
											<div class="demo-box">paddingInline="{v}"</div>
										</Stack>
										<Stack gap="sm" paddingBlock={v} class="pad-frame">
											<div class="demo-box">paddingBlock="{v}"</div>
										</Stack>
									</Stack>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else}
					<p class="tab-note">
						With <code>gap="near"</code> every Stack below uses the <em>same</em> prop — the spacing
						tightens purely from nesting. <code>data-density-shift</code> goes directly on the Stack
						(extra attributes forward to the root element), and the shift applies to that Stack's
						own gap and everything inside it. See
						<a href="/docs/foundation/spacing">density spacing</a> for the model.
					</p>
					<Example code={densityCode}>
						<Stack gap="near" class="demo-stack">
							<div class="demo-box">Top-level — near = 4rem</div>
							<div class="demo-box">Top-level sibling</div>
							<Stack gap="near" data-density-shift class="shift-region">
								<div class="demo-box">One shift — near = 2rem</div>
								<div class="demo-box">Sibling</div>
								<Stack gap="near" data-density-shift class="shift-region">
									<div class="demo-box">Two shifts — near = 0.8rem</div>
									<div class="demo-box">Sibling</div>
								</Stack>
							</Stack>
						</Stack>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	:global(.demo-stack) {
		border: 1px dashed var(--hz-color-border, #6b7280);
		padding: 0.5rem;
		border-radius: var(--hz-radius-sm, 0.25rem);
	}
	:global(.pad-frame) {
		background: color-mix(in srgb, var(--hz-intent-secondary, #7c3aed) 12%, transparent);
		border: 1px dashed var(--hz-intent-secondary, #7c3aed);
		border-radius: var(--hz-radius-sm, 0.25rem);
	}
	:global(.shift-region) {
		border: 1px dashed var(--hz-intent-secondary, #7c3aed);
		border-radius: var(--hz-radius-sm, 0.25rem);
		padding: 0.5rem;
	}
	.demo-box {
		padding: 0.5rem 1rem;
		background: color-mix(in srgb, var(--hz-intent-primary, #2563eb) 15%, transparent);
		border: 1px solid var(--hz-intent-primary, #2563eb);
		border-radius: var(--hz-radius-sm, 0.25rem);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
</style>
