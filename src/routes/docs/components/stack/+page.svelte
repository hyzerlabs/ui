<script lang="ts">
	import { RadioGroup, Stack, Tabs } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { stackDoc } from '../../../../docs/data/stack.js';
	import Example from '../../../../docs/Example.svelte';

	const gapValues = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 'near', 'away'] as const;
	const alignValues = ['start', 'center', 'end', 'stretch', 'baseline'] as const;
	type GapValue = (typeof gapValues)[number];
	type AlignValue = (typeof alignValues)[number];
	let gap = $state<GapValue>('md');
	let align = $state<AlignValue>('stretch');

	function spacingCode(gap: string, padding: string): string {
		return [
			`<Stack gap="${gap}" padding="${padding}">…</Stack>`,
			`<Stack gap="${gap}" paddingInline="${padding}">…</Stack>`,
			`<Stack gap="${gap}" paddingBlock="${padding}">…</Stack>`
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
	type PaddingValue = (typeof paddingValues)[number];
	let padding = $state<PaddingValue>('md');

	const densityCode = [
		'<Stack gap="away">',
		'\t<div>Top-level: away = 8rem</div>',
		'\t<Stack gap="away" data-density-shift>',
		'\t\t<div>One shift: away = 4rem</div>',
		'\t\t<!-- nest another data-density-shift here and away drops again, to 2rem -->',
		'\t</Stack>',
		'</Stack>'
	].join('\n');

	const demoTabs = [
		{ id: 'spacing', label: 'Spacing' },
		{ id: 'align', label: 'Align' },
		{ id: 'density', label: 'Density' }
	];
</script>

<DocPage name="Stack" {...stackDoc}>
	<Tabs items={demoTabs} ariaLabel="Stack demos" defaultTab="spacing">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'spacing'}
					<p class="tab-note">
						<code>gap</code> is the space between items; its values map to the
						<code>--hz-space-*</code> tokens (<code>xs</code> 0.5rem → <code>xl</code> 8rem). The
						tinted zone is the Stack; the space between its edge and the items is the
						<code>padding</code>. <code>padding</code> applies on both axes;
						<code>paddingInline</code> and <code>paddingBlock</code> override one axis and win where
						set. Both stay correct in RTL and vertical writing modes. <code>near</code> and
						<code>away</code> are the <a href="/docs/foundation/spacing">density distances</a>:
						context-aware values that tighten inside <code>data-density-shift</code> regions (see the
						Density tab).
					</p>
					<Stack gap="sm">
						<RadioGroup
							name="stack-gap"
							label="gap"
							orientation="horizontal"
							options={gapValues.map((v) => ({ value: v, label: v }))}
							bind:value={gap}
						/>
						<RadioGroup
							name="stack-padding"
							label="padding"
							orientation="horizontal"
							options={paddingValues.map((v) => ({ value: v, label: v }))}
							bind:value={padding}
						/>
						<Example code={spacingCode(gap, padding)}>
							<Stack gap="sm">
								<Stack {gap} {padding} class="pad-frame">
									<div class="demo-box">padding="{padding}"</div>
									<div class="demo-box">gap="{gap}" between items</div>
								</Stack>
								<Stack {gap} paddingInline={padding} class="pad-frame">
									<div class="demo-box">paddingInline="{padding}"</div>
									<div class="demo-box">gap="{gap}" between items</div>
								</Stack>
								<Stack {gap} paddingBlock={padding} class="pad-frame">
									<div class="demo-box">paddingBlock="{padding}"</div>
									<div class="demo-box">gap="{gap}" between items</div>
								</Stack>
							</Stack>
						</Example>
					</Stack>
				{:else if item.id === 'align'}
					<p class="tab-note">
						<code>align</code> maps to <code>align-items</code>. The effect shows when children have
						different natural widths. The default <code>stretch</code> makes every child fill the Stack's
						width.
					</p>
					<Stack gap="sm">
						<RadioGroup
							name="stack-align"
							label="align"
							orientation="horizontal"
							options={alignValues.map((v) => ({ value: v, label: v }))}
							bind:value={align}
						/>
						<Example code={alignCode(align)}>
							<Stack {align} class="demo-stack">
								<div class="demo-box">Short</div>
								<div class="demo-box">Medium width item</div>
							</Stack>
						</Example>
					</Stack>
				{:else}
					<p class="tab-note">
						Every Stack below uses the <em>same</em> <code>gap="away"</code>. The spacing tightens
						from nesting alone. <code>data-density-shift</code> goes directly on the Stack (extra
						attributes forward to the root element). The shift applies to that Stack's own gap and
						to everything inside it. See <a href="/docs/foundation/spacing">density spacing</a> for the
						model.
					</p>
					<Example code={densityCode}>
						<!-- The docs chrome is already TWO data-density-shift levels deep
						     (the docs layout wrapper + this page's Demo section), which
						     leaves room for exactly one more rung of the ladder. So the
						     live demo shows one nesting step and the code sample's comment
						     carries the rest of the walk. The density-demo class re-anchors
						     the visible values to what the sample produces at the top level
						     of a page (see the style block). -->
						<Stack gap="away" class="demo-stack density-demo">
							<div class="demo-box">Top-level: away = 8rem</div>
							<div class="demo-box">Top-level sibling</div>
							<Stack gap="away" data-density-shift class="shift-region">
								<div class="demo-box">One shift: away = 4rem</div>
								<div class="demo-box">Sibling</div>
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
	/* Undo the docs chrome's TWO density shifts (layout wrapper + Demo
	 * section) for the demo subtree, so the values shown match what the code
	 * sample produces at the top level of a page. It takes two mechanisms
	 * because custom properties inherit as COMPUTED values. The wrapper's own
	 * away must be declared here, or it would inherit the chrome's
	 * already-resolved value. The nested shift re-resolves its rung lookup per
	 * element: at three shifts deep it reads rung depth-3, which is overridden
	 * one step up. All of this is coupled to the chrome depth, and the demo
	 * shows ONE nesting step because a second would sit past the ladder's
	 * deepest selector and stop stepping. */
	:global(.density-demo) {
		--hz-space-away: calc(var(--hz-density) * 20);
		--hz-density-ladder-depth-3: calc(var(--hz-density) * 10);
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
