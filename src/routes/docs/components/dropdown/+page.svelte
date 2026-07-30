<script lang="ts">
	import { Dropdown, Alert, Tabs, Cluster } from '$lib';
	import type { DropdownEntry } from '$lib/types';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { dropdownDoc } from '../../../../docs/data/dropdown.js';
	import Example from '../../../../docs/Example.svelte';
	import IconCheck from '$lib/icons/generated/check.svelte';
	import IconPlus from '$lib/icons/generated/plus.svelte';
	import IconX from '$lib/icons/generated/x.svelte';
	import IconMenu from '$lib/icons/generated/menu.svelte';
	import IconInfo from '$lib/icons/generated/info.svelte';

	// ------------------------------------------------------------------
	// Basic action menu — a round's kebab menu, each item logging its action.
	// ------------------------------------------------------------------

	let lastAction = $state('—');

	const roundItems: DropdownEntry[] = [
		{ id: 'view', label: 'View scorecard', onselect: () => (lastAction = 'View scorecard') },
		{ id: 'edit', label: 'Edit round', onselect: () => (lastAction = 'Edit round') },
		{ id: 'share', label: 'Share round', onselect: () => (lastAction = 'Share round') }
	];

	const basicCode = [
		'let lastAction = $state("—");',
		'',
		'const roundItems: DropdownEntry[] = [',
		"\t{ id: 'view', label: 'View scorecard', onselect: () => (lastAction = 'View scorecard') },",
		"\t{ id: 'edit', label: 'Edit round', onselect: () => (lastAction = 'Edit round') },",
		"\t{ id: 'share', label: 'Share round', onselect: () => (lastAction = 'Share round') }",
		'];',
		'',
		'<Dropdown label="Round actions" items={roundItems} />',
		'<p>Last action: {lastAction}</p>'
	].join('\n');

	// ------------------------------------------------------------------
	// Disabled + danger — a card row: check-in is inert once a round has
	// started, and Delete is destructive.
	// ------------------------------------------------------------------

	const cardItems: DropdownEntry[] = [
		{ id: 'edit', label: 'Edit tee time' },
		{ id: 'checkin', label: 'Check in', disabled: true },
		{ separator: true },
		{ id: 'delete', label: 'Delete round', danger: true }
	];

	const dangerCode = [
		'const cardItems: DropdownEntry[] = [',
		"\t{ id: 'edit', label: 'Edit tee time' },",
		"\t{ id: 'checkin', label: 'Check in', disabled: true }, // round already started",
		'\t{ separator: true },',
		"\t{ id: 'delete', label: 'Delete round', danger: true }",
		'];',
		'',
		'<Dropdown label="Card actions" items={cardItems} />'
	].join('\n');

	// ------------------------------------------------------------------
	// Alignment — a right-anchored kebab menu at the edge of a card.
	// ------------------------------------------------------------------

	const alignCode = [
		'<Dropdown label="Start" items={roundItems} />',
		'<Dropdown label="Center" items={roundItems} align="center" />',
		'<Dropdown label="End" items={roundItems} align="end" />'
	].join('\n');

	// ------------------------------------------------------------------
	// Icons + separators
	// ------------------------------------------------------------------

	const iconsCode = [
		'{#snippet completeIcon()}<IconCheck />{/snippet}',
		'{#snippet addIcon()}<IconPlus />{/snippet}',
		'{#snippet removeIcon()}<IconX />{/snippet}',
		'',
		'const iconItems: DropdownEntry[] = [',
		"\t{ id: 'complete', label: 'Mark complete', icon: completeIcon },",
		"\t{ id: 'add', label: 'Add to bag', icon: addIcon },",
		'\t{ separator: true },',
		"\t{ id: 'remove', label: 'Remove from bag', icon: removeIcon, danger: true }",
		'];',
		'',
		'<Dropdown label="Disc actions" items={iconItems} />'
	].join('\n');

	// ------------------------------------------------------------------
	// Icon-only trigger
	// ------------------------------------------------------------------

	const iconOnlyCode = [
		'<Dropdown',
		'\titems={roundItems}',
		'\ttriggerLabel="Round actions"',
		'/>',
		'<!-- triggerIcon defaults to IconChevronDown; pass one to replace it, e.g.: -->',
		'<Dropdown items={roundItems} triggerLabel="Round actions">',
		'\t{#snippet triggerIcon()}<IconMenu />{/snippet}',
		'</Dropdown>'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'danger', label: 'Disabled & danger' },
		{ id: 'icons', label: 'Icons & separators' },
		{ id: 'align', label: 'Alignment' },
		{ id: 'icon-only', label: 'Icon-only trigger' }
	];
</script>

<DocPage name="Dropdown" {...dropdownDoc}>
	<Alert intent="info" title="Dropdown vs Nav">
		{#snippet icon()}<IconInfo />{/snippet}
		Use <code>Dropdown</code> when the entries are <strong>actions</strong>: an action menu or kebab
		menu that does something (edit, duplicate, delete). For <strong>navigation</strong>, meaning
		links a reader clicks through to another page or section, use
		<a href="/docs/components/nav">Nav</a>'s built-in dropdown instead. Its menu items are real
		navigable links rather than action buttons.
	</Alert>

	<Tabs items={demoTabs} ariaLabel="Dropdown demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<p class="tab-note">
						Every item carries its own <code>onselect</code>. Click one, or focus it and press
						<kbd>Enter</kbd>/<kbd>Space</kbd>, to fire its action, close the menu, and return focus
						to the trigger.
					</p>
					<Example code={basicCode}>
						<div class="demo-col">
							<Cluster gap="sm" align="center">
								<Dropdown label="Round actions" items={roundItems} />
								<p class="tab-note">Last action: {lastAction}</p>
							</Cluster>
						</div>
					</Example>
				{:else if item.id === 'danger'}
					<p class="tab-note">
						<code>Check in</code> is <code>disabled</code>. It stays focusable, so Arrow, Home, End,
						and typeahead all reach it and screen-reader users can still discover it, but activating
						it does nothing. <code>Delete round</code> is <code>danger</code>: styled destructively,
						never by color alone, since its label already says "Delete."
					</p>
					<Example code={dangerCode}>
						<div class="demo-col">
							<Dropdown label="Card actions" items={cardItems} />
						</div>
					</Example>
				{:else if item.id === 'icons'}
					<p class="tab-note">
						An item's <code>icon</code> snippet renders before the label and is purely decorative (<code
							>aria-hidden</code
						>), so the label text alone is the accessible name. A
						<code>{'{ separator: true }'}</code> entry renders a non-interactive divider, skipped by every
						navigation path.
					</p>
					{#snippet completeIcon()}<IconCheck />{/snippet}
					{#snippet addIcon()}<IconPlus />{/snippet}
					{#snippet removeIcon()}<IconX />{/snippet}
					{@const iconItems = [
						{ id: 'complete', label: 'Mark complete', icon: completeIcon },
						{ id: 'add', label: 'Add to bag', icon: addIcon },
						{ separator: true },
						{ id: 'remove', label: 'Remove from bag', icon: removeIcon, danger: true }
					] as DropdownEntry[]}
					<Example code={iconsCode}>
						<div class="demo-col">
							<Dropdown label="Disc actions" items={iconItems} />
						</div>
					</Example>
				{:else if item.id === 'align'}
					<p class="tab-note">
						<code>align</code> picks which trigger edge the menu hangs from. <code>start</code> (the
						default) lines up the leading edges. <code>end</code> lines up the trailing edges, the
						right-aligned kebab-menu form, useful near the edge of a container. <code>center</code>
						centers the menu under the trigger. Start and end follow reading direction.
					</p>
					<Example code={alignCode}>
						<Cluster gap="lg" align="center">
							<Dropdown label="Start" items={roundItems} />
							<Dropdown label="Center" items={roundItems} align="center" />
							<Dropdown label="End" items={roundItems} align="end" />
						</Cluster>
					</Example>
				{:else}
					<p class="tab-note">
						With no <code>label</code>, the trigger renders as an icon-only <code>Button</code>
						circle, and <code>triggerLabel</code> becomes its accessible name. It is required: leave
						it out and <code>Button</code> logs its own dev warning. <code>triggerIcon</code> replaces
						the default chevron glyph.
					</p>
					<Example code={iconOnlyCode}>
						<Cluster gap="sm" align="center">
							<Dropdown items={roundItems} triggerLabel="Round actions" />
							<Dropdown items={roundItems} triggerLabel="Round actions">
								{#snippet triggerIcon()}<IconMenu />{/snippet}
							</Dropdown>
						</Cluster>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	/* Open menus must escape the example frame instead of clipping. */
	.tab-content :global(.doc-example) {
		overflow: visible;
	}
	.tab-content :global(.doc-example > .hz-code-block) {
		border-radius: 0 0 var(--hz-radius-md, 0.5rem) var(--hz-radius-md, 0.5rem);
	}
</style>
