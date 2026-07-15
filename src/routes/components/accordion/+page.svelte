<script lang="ts">
	import { Accordion, Tabs } from '$lib';
	import { IconPlus } from '$lib/icons';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{
			name: 'items',
			type: 'AccordionItem[]',
			default: '—',
			note: 'Required. See AccordionItem below.'
		},
		{ name: 'type', type: "'single' | 'multiple'", default: "'single'" },
		{ name: 'defaultOpen', type: 'string | string[]', default: '[]' },
		{
			name: 'collapsible',
			type: 'boolean',
			default: 'true',
			note: 'false keeps one panel open in single mode.'
		},
		{ name: 'headingLevel', type: '2 | 3 | 4 | 5 | 6', default: '3' },
		{
			name: 'panel',
			type: 'Snippet<[AccordionItem]>',
			default: '—',
			note: 'Required. Renders each panel.'
		},
		{ name: 'icon', type: 'Snippet', default: '—', note: 'Replaces the default chevron.' },
		{ name: 'onToggle', type: '(openIds: string[]) => void', default: '—' },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-accordion class.' }
	];

	const itemType = [
		{ name: 'id', type: 'string', default: '—', note: 'Required. Must be unique.' },
		{
			name: 'title',
			type: 'string | Snippet',
			default: '—',
			note: 'Required. String for plain text; snippet for inner markup.'
		},
		{ name: 'disabled', type: 'boolean', default: 'false' }
	];

	const items = [
		{ id: 'what', title: 'What is @hyzer-labs/ui?' },
		{ id: 'a11y', title: 'Is it accessible?' },
		{ id: 'react', title: 'Can I use it with React?', disabled: true }
	];

	const answers: Record<string, string> = {
		what: 'It is a Svelte component library that prioritizes behavior, structure, and accessibility.',
		a11y: 'Yes — @hyzer-labs/ui is built to satisfy WCAG AA, AAA, and Section 508 out of the box.',
		react: 'No — it is Svelte 5 only.',
		install: 'pnpm add @hyzer-labs/ui — Svelte 5 is the only peer dependency.',
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
			'<!-- The panel snippet receives the item — render per-item content -->',
			'<Accordion items={faqs}>',
			'\t{#snippet panel(item)}',
			'\t\t<p>{answers[item.id]}</p>',
			'\t{/snippet}',
			'</Accordion>'
		].join('\n');
	}

	const richTitlesCode = [
		'<!-- title accepts string | Snippet — use a snippet for inner markup -->',
		'{#snippet proTitle()}',
		'\tPro plan <span class="badge">new</span>',
		'{/snippet}',
		'',
		"<Accordion items={[{ id: 'free', title: 'Free plan' }, { id: 'pro', title: proTitle }]}>",
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

<DocPage
	name="Accordion"
	description="A disclosure component using native <details>/<summary> elements, supporting single and multiple open modes with keyboard navigation. Item titles accept plain strings or snippets."
	importLine={'import {Accordion} from "@hyzer-labs/ui"'}
	{props}
	types={[{ name: 'AccordionItem', props: itemType }]}
	a11yNote="Built on native `<details>` — no ARIA needed for disclosure semantics. Arrow keys navigate between summaries; Home/End jump to first/last. Disabled items have `aria-disabled='true'` and block interaction. Summaries wrap a real heading (`headingLevel`) so panels join the document outline."
	a11yLinks={[
		{ label: 'APG Accordion pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/' }
	]}
>
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
					{#snippet proTitle()}
						Pro plan <span class="badge">new</span>
					{/snippet}
					<Example code={richTitlesCode}>
						<Accordion
							items={[
								{ id: 'free', title: 'Free plan' },
								{ id: 'pro', title: proTitle }
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
						With <code>collapsible={'{false}'}</code> in single mode, the open panel can't be toggled
						closed — one section is always expanded.
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
		background: color-mix(in srgb, var(--hz-color-primary, #2563eb) 14%, transparent);
		color: var(--hz-color-primary, #2563eb);
		font-size: var(--hz-font-size-sm, 0.875rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}
	.open-readout {
		margin: 0 0 0.75rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
