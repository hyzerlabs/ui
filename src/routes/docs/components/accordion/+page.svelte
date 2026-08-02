<script lang="ts">
	import { Accordion, Alert, Tabs } from '$lib';
	import IconPlus from '$lib/icons/generated/plus.svelte';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { accordionDoc } from '../../../../docs/data/accordion.js';
	import Example from '../../../../docs/Example.svelte';

	const items = [
		{ id: 'what', title: 'What is @hyzer-labs/ui?' },
		{ id: 'a11y', title: 'Is it accessible?' },
		{ id: 'react', title: 'Can I use it with React?', disabled: true }
	];

	const answers: Record<string, string> = {
		what: 'It is a Svelte component library that prioritizes behavior, structure, and accessibility.',
		a11y: 'Every component ships its WAI-ARIA pattern, and the token engine grades each color pairing against WCAG AA.',
		react: 'No. It is Svelte 5 only.',
		install: 'pnpm add @hyzer-labs/ui. Svelte 5 is the only peer dependency.',
		tokens: "Import '@hyzer-labs/ui/tokens.css' once at your app's root layout.",
		theme: "Optionally add '@hyzer-labs/ui/theme' for the styled starting point."
	};

	const multiItems = [
		{ id: 'install', title: 'Install the package' },
		{ id: 'tokens', title: 'Import the tokens' },
		{ id: 'theme', title: 'Add the reference theme' }
	];

	const modes = ['single', 'multiple'] as const;

	let openIds = $state<string[]>([]);

	const demoTabs = [
		{ id: 'modes', label: 'Modes' },
		{ id: 'rich-titles', label: 'Rich titles' },
		{ id: 'icon', label: 'Custom icon' },
		{ id: 'collapsible', label: 'Collapsible' },
		{ id: 'ontoggle', label: 'onToggle' }
	];

	// Example-code builders — derived from the selected sub-tab so the code
	// pane updates live with the demo.
	function modeCode(mode: string): string {
		if (mode === 'multiple') {
			return [
				"<!-- defaultOpen seeds the initial open set (array in 'multiple' mode) -->",
				"<Accordion type=\"multiple\" items={steps} defaultOpen={['install', 'tokens']}>",
				'\t{#snippet panel(item)}',
				'\t\t<p>{instructions[item.id]}</p>',
				'\t{/snippet}',
				'</Accordion>'
			].join('\n');
		}
		return [
			'<!-- The panel snippet receives the item: render per-item content -->',
			'<Accordion items={faqs}>',
			'\t{#snippet panel(item)}',
			'\t\t<p>{answers[item.id]}</p>',
			'\t{/snippet}',
			'</Accordion>'
		].join('\n');
	}

	const planNames: Record<string, string> = { free: 'Free plan', pro: 'Pro plan' };

	const richTitlesCode = [
		'<!-- A title snippet receives its item, so one snippet can render every row -->',
		'{#snippet planTitle(item)}',
		'\t{planNames[item.id]}',
		'\t{#if item.id === \'pro\'}<span class="badge">new</span>{/if}',
		'{/snippet}',
		'',
		"<Accordion items={[{ id: 'free', title: planTitle }, { id: 'pro', title: planTitle }]}>",
		'\t{#snippet panel(item)}…{/snippet}',
		'</Accordion>'
	].join('\n');

	const iconCode = [
		'<Accordion {items}>',
		'\t{#snippet icon()}<IconPlus size={16} />{/snippet}',
		'\t{#snippet panel(item)}…{/snippet}',
		'</Accordion>'
	].join('\n');

	const collapsibleCode = [
		'<!-- One panel always stays open in single mode -->',
		'<Accordion items={faqs} collapsible={false} defaultOpen="what">',
		'\t{#snippet panel(item)}…{/snippet}',
		'</Accordion>'
	].join('\n');

	const ontoggleCode = [
		'<Accordion type="multiple" items={steps} onToggle={(ids) => (openIds = ids)}>',
		'\t{#snippet panel(item)}…{/snippet}',
		'</Accordion>'
	].join('\n');
</script>

<DocPage name="Accordion" {...accordionDoc}>
	<p class="demo-note">
		Panels ship no display, height, or overflow of their own, so you can animate the open and close
		yourself. The reference theme's summary-icon rotation honors <code>--hz-duration-*</code> /
		<code>--hz-ease-*</code>. See <a href="/docs/foundation/motion">Motion</a> for the token values
		and the <code>@hyzer-labs/ui/motion</code> script-side helpers built on them.
	</p>
	<Tabs items={demoTabs} ariaLabel="Accordion demos" defaultTab="modes">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'modes'}
					<Tabs
						items={modes.map((m) => ({ id: m, label: m }))}
						ariaLabel="Accordion mode"
						defaultTab="single"
					>
						{#snippet panel(mItem)}
							<div class="inner-tab">
								<Example code={modeCode(mItem.id)}>
									{#if mItem.id === 'single'}
										<Accordion {items} type="single">
											{#snippet panel(aItem)}
												<div class="panel-content">
													<p>{answers[aItem.id]}</p>
												</div>
											{/snippet}
										</Accordion>
									{:else}
										<Accordion
											items={multiItems}
											type="multiple"
											defaultOpen={['install', 'tokens']}
										>
											{#snippet panel(aItem)}
												<div class="panel-content">
													<p>{answers[aItem.id]}</p>
												</div>
											{/snippet}
										</Accordion>
									{/if}
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'rich-titles'}
					{#snippet planTitle(aItem: { id: string })}
						{planNames[aItem.id]}
						{#if aItem.id === 'pro'}<span class="badge">new</span>{/if}
					{/snippet}
					<Alert intent="info" title="Titles become the accessible name">
						Everything a title renders sits inside the summary's heading. That heading is the row's
						accessible name, so it is what a screen reader announces. Keep titles as short as a
						label: a name plus a brief marker, like the badge here. Teaser prose, prices, and other
						detail belong in the panel.
					</Alert>
					<Example code={richTitlesCode}>
						<Accordion
							items={[
								{ id: 'free', title: planTitle },
								{ id: 'pro', title: planTitle }
							]}
						>
							{#snippet panel(aItem)}
								<div class="panel-content">
									<p>Panel for the {aItem.id} plan.</p>
								</div>
							{/snippet}
						</Accordion>
					</Example>
				{:else if item.id === 'icon'}
					<Example code={iconCode}>
						<Accordion {items}>
							{#snippet icon()}<IconPlus size={16} />{/snippet}
							{#snippet panel(aItem)}
								<div class="panel-content">
									<p>{answers[aItem.id]}</p>
								</div>
							{/snippet}
						</Accordion>
					</Example>
				{:else if item.id === 'collapsible'}
					<p class="tab-note">
						With <code>collapsible={'{false}'}</code> in single mode, you cannot close the open panel.
						One section is always expanded.
					</p>
					<Example code={collapsibleCode}>
						<Accordion {items} collapsible={false} defaultOpen="what">
							{#snippet panel(aItem)}
								<div class="panel-content">
									<p>{answers[aItem.id]}</p>
								</div>
							{/snippet}
						</Accordion>
					</Example>
				{:else}
					<Example code={ontoggleCode}>
						<p class="open-readout" aria-live="polite">
							Open: <code>{openIds.length ? openIds.join(', ') : 'none'}</code>
						</p>
						<Accordion items={multiItems} type="multiple" onToggle={(ids) => (openIds = ids)}>
							{#snippet panel(aItem)}
								<div class="panel-content">
									<p>{answers[aItem.id]}</p>
								</div>
							{/snippet}
						</Accordion>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.panel-content p {
		margin: 0;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
	.badge {
		display: inline-block;
		margin-inline-start: 0.375rem;
		padding: 0.1em 0.5em;
		border-radius: var(--hz-radius-full, 9999px);
		background: color-mix(in srgb, var(--hz-intent-primary, #2563eb) 14%, transparent);
		color: var(--hz-intent-primary, #2563eb);
		font-size: var(--hz-font-size-sm, 0.875rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}
	.open-readout {
		margin: 0 0 0.75rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
	.demo-note {
		margin: 0 0 1rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
