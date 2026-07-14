<script lang="ts">
	import { Badge, Tabs, Cluster, Stack } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'children', type: 'Snippet', default: '—', note: 'Required. The badge content.' },
		{
			name: 'intent',
			type: "'neutral' | 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'info'",
			default: "'neutral'",
			note: 'See Foundation → Colors & Intent.'
		},
		{ name: 'variant', type: "'soft' | 'solid' | 'outline'", default: "'soft'" },
		{ name: 'size', type: "'sm' | 'md'", default: "'md'" },
		{
			name: 'rounded',
			type: "'none' | 'sm' | 'md' | 'lg' | 'full'",
			default: "'full'",
			note: 'The shared Rounded scale — 1:1 with the --hz-radius-* tokens.'
		},
		{
			name: 'onDismiss',
			type: '() => void',
			default: '—',
			note: 'Renders the trailing remove button (the chip form).'
		},
		{
			name: 'dismissLabel',
			type: 'string',
			default: "'Remove'",
			note: 'In lists, pass a per-item label — "Remove" alone is ambiguous.'
		},
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-badge class.' }
	];

	const intents = [
		'neutral',
		'primary',
		'secondary',
		'danger',
		'warning',
		'success',
		'info'
	] as const;

	const intentsCode = [
		'<Badge>Casual</Badge>',
		'<Badge intent="primary">League</Badge>',
		'<Badge intent="secondary">Doubles</Badge>',
		'<Badge intent="danger">OB</Badge>',
		'<Badge intent="warning">Windy</Badge>',
		'<Badge intent="success">Birdie</Badge>',
		'<Badge intent="info">Cart friendly</Badge>'
	].join('\n');

	const intentText: Record<(typeof intents)[number], string> = {
		neutral: 'Casual',
		primary: 'League',
		secondary: 'Doubles',
		danger: 'OB',
		warning: 'Windy',
		success: 'Birdie',
		info: 'Cart friendly'
	};

	const variantsCode = [
		'<Badge intent="success">Open</Badge>',
		'<Badge intent="success" variant="solid">Open</Badge>',
		'<Badge intent="success" variant="outline">Open</Badge>'
	].join('\n');

	const sizesCode = [
		'<Badge intent="primary" size="sm">18 holes</Badge>',
		'<Badge intent="primary">18 holes</Badge>',
		'',
		'<!-- rounded: the shared token scale; full (pill) is the default -->',
		'<Badge rounded="none">none</Badge>',
		'<Badge rounded="sm">sm</Badge>',
		'<Badge rounded="md">md</Badge>',
		'<Badge rounded="lg">lg</Badge>',
		'<Badge>full</Badge>'
	].join('\n');

	// Dismissible chips — the Combobox selected-options pattern.
	let bag = $state(['Destroyer', 'Buzzz', 'Aviar']);

	const chipsCode = $derived(
		[
			`let bag = $state(${JSON.stringify(bag)});`,
			'',
			'{#each bag as disc (disc)}',
			'\t<Badge',
			'\t\tintent="primary"',
			'\t\tdismissLabel="Remove {disc}"',
			'\t\tonDismiss={() => (bag = bag.filter((d) => d !== disc))}',
			'\t>',
			'\t\t{disc}',
			'\t</Badge>',
			'{/each}'
		].join('\n')
	);

	const demoTabs = [
		{ id: 'intents', label: 'Intents' },
		{ id: 'variants', label: 'Variants' },
		{ id: 'sizes', label: 'Sizes & rounded' },
		{ id: 'chips', label: 'Dismissible' }
	];
</script>

<DocPage
	name="Badge"
	description="A small inline status chip with intent coloring, soft/solid/outline variants, the shared rounded scale, and an optional dismiss button — the building block for selected-option chips."
	importLine={'import {Badge} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="A badge is plain inline text — no role, no label; it announces as part of the surrounding content. Never let the intent color be the only signal: the text carries the meaning. The dismiss button is a real `<button>` named by `dismissLabel` with a decorative icon — when rendering several chips, give each a per-item label like `Remove Destroyer`."
>
	<Tabs items={demoTabs} ariaLabel="Badge demos" defaultTab="intents">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'intents'}
					<p class="tab-note">
						The <a href="/foundation/colors#intent">intent vocabulary</a> plus the
						<code>neutral</code> default. The text carries the meaning; color reinforces it.
					</p>
					<Example code={intentsCode}>
						<Cluster gap="xs">
							{#each intents as intent (intent)}
								<Badge intent={intent === 'neutral' ? undefined : intent}>
									{intentText[intent]}
								</Badge>
							{/each}
						</Cluster>
					</Example>
				{:else if item.id === 'variants'}
					<Example code={variantsCode}>
						<Cluster gap="xs">
							<Badge intent="success">Open</Badge>
							<Badge intent="success" variant="solid">Open</Badge>
							<Badge intent="success" variant="outline">Open</Badge>
						</Cluster>
					</Example>
				{:else if item.id === 'sizes'}
					<p class="tab-note">
						<code>rounded</code> takes the shared token scale — the same values every
						<code>rounded</code> prop in the library speaks. <code>full</code> (the pill) is the default.
					</p>
					<Example code={sizesCode}>
						<Stack gap="sm">
							<Cluster gap="xs">
								<Badge intent="primary" size="sm">18 holes</Badge>
								<Badge intent="primary">18 holes</Badge>
							</Cluster>
							<Cluster gap="xs">
								<Badge rounded="none">none</Badge>
								<Badge rounded="sm">sm</Badge>
								<Badge rounded="md">md</Badge>
								<Badge rounded="lg">lg</Badge>
								<Badge>full</Badge>
							</Cluster>
						</Stack>
					</Example>
				{:else}
					<p class="tab-note">
						<code>onDismiss</code> turns a badge into a chip — this is the pattern the upcoming
						Combobox uses for selected options. Note the per-item
						<code>dismissLabel</code>: screen readers hear "Remove Destroyer", not seven identical
						"Remove" buttons.
					</p>
					<Example code={chipsCode}>
						{#if bag.length > 0}
							<Cluster gap="xs">
								{#each bag as disc (disc)}
									<Badge
										intent="primary"
										dismissLabel="Remove {disc}"
										onDismiss={() => (bag = bag.filter((d) => d !== disc))}
									>
										{disc}
									</Badge>
								{/each}
							</Cluster>
						{:else}
							<p class="empty-bag">
								Bag's empty.
								<button
									type="button"
									class="refill"
									onclick={() => (bag = ['Destroyer', 'Buzzz', 'Aviar'])}
								>
									Refill it
								</button>
							</p>
						{/if}
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.empty-bag {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
	.refill {
		border: none;
		background: none;
		padding: 0;
		font: inherit;
		color: var(--hz-color-primary, #2563eb);
		text-decoration: underline;
		cursor: pointer;
	}
</style>
