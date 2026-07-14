<script lang="ts">
	import { Dropdown, Alert, Tabs, Cluster } from '$lib';
	import type { DropdownEntry } from '$lib/types';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';
	import IconCheck from '$lib/icons/IconCheck.svelte';
	import IconPlus from '$lib/icons/IconPlus.svelte';
	import IconX from '$lib/icons/IconX.svelte';
	import IconMenu from '$lib/icons/IconMenu.svelte';

	const props: PropRow[] = [
		{
			name: 'items',
			type: 'DropdownEntry[]',
			default: '—',
			note: 'Required. Actionable items and separators — see DropdownItem below.'
		},
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Visible trigger text (and the accessible name, unless triggerLabel overrides it).'
		},
		{
			name: 'triggerLabel',
			type: 'string',
			default: '—',
			note: 'Accessible-name override; required for an icon-only trigger (no label).'
		},
		{
			name: 'triggerProps',
			type: 'DropdownTriggerProps',
			default: '{}',
			note: "Trigger appearance pass-through. Resolves to variant: 'outline', intent: 'neutral'."
		},
		{
			name: 'triggerIcon',
			type: 'Snippet',
			default: '— (⇒ IconChevronDown)',
			note: 'Decorative; the labeled trigger renders it trailing, the icon-only trigger renders it alone.'
		},
		{ name: 'align', type: "'start' | 'end'", default: "'start'" },
		{
			name: 'onselect',
			type: '(id: string, item: DropdownItem) => void',
			default: '—',
			note: "Fires on every activation, after the item's own onselect."
		},
		{ name: 'disabled', type: 'boolean', default: 'false' },
		{ name: 'class', type: 'string', default: '—', note: 'Merged after the hz-dropdown class.' }
	];

	const dropdownItemType: PropRow[] = [
		{
			name: 'id',
			type: 'string',
			default: '—',
			note: 'Required. Stable identity — keys the item, its DOM id, and the onselect callback.'
		},
		{ name: 'label', type: 'string', default: '—', note: 'Required.' },
		{
			name: 'disabled',
			type: 'boolean',
			default: '—',
			note: 'Stays focusable — reachable by Arrow / Home / End / typeahead — but inert on activation.'
		},
		{
			name: 'danger',
			type: 'boolean',
			default: '—',
			note: 'Destructive action — surfaces the data-danger styling hook.'
		},
		{
			name: 'icon',
			type: 'Snippet',
			default: '—',
			note: 'Decorative leading glyph; the label owns the accessible name.'
		},
		{
			name: 'onselect',
			type: '() => void',
			default: '—',
			note: "Per-item action, fired before the component's onselect."
		}
	];

	const dropdownSeparatorType: PropRow[] = [
		{
			name: 'separator',
			type: 'true',
			default: '—',
			note: 'A non-interactive divider — discriminates it from an actionable item.'
		}
	];

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

	const alignCode = ['<Dropdown label="Round actions" items={roundItems} align="end" />'].join(
		'\n'
	);

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

<DocPage
	name="Dropdown"
	description="A generic action menu — the WAI-ARIA APG menu button pattern — with real roving-tabindex keyboard focus."
	importLine={'import {Dropdown} from "@hyzer-labs/ui"'}
	{props}
	types={[
		{ name: 'DropdownItem', props: dropdownItemType },
		{ name: 'DropdownSeparator', props: dropdownSeparatorType }
	]}
	a11yNote="The trigger is a real button — `aria-haspopup=menu`, `aria-expanded`, `aria-controls` (the library's own Button) — opening a `role=menu` popup of `role=menuitem` buttons named by the trigger via `aria-labelledby`. Unlike `Combobox`, which keeps DOM focus on its text input and tracks a virtually-focused option via `aria-activedescendant`, Dropdown moves real DOM focus into the menu — opening lands focus on the first menuitem (last on `ArrowUp`), and a roving `tabindex` (`0` on the focused item, `-1` on the rest) keeps the menu a single tab stop, so the active item is styled with native `:focus` rather than a `data-active` hook. Keyboard: `ArrowDown`/`ArrowUp` move focus and wrap (including disabled items); `Home`/`End` jump to the first/last item; typing a character cycles focus to the next matching label-initial; `Enter`/`Space` activate the focused item via its own native button click (no separate handling); `Escape` closes and returns focus to the trigger; `Tab`/`Shift+Tab` close the menu and let focus move on — there is no focus trap. A disabled item keeps `aria-disabled=true` rather than the native `disabled` attribute, so it stays focusable and screen-reader users can discover it; activating it is a no-op."
>
	<Alert intent="info" title="Dropdown vs Nav">
		Reach for <code>Dropdown</code> when the entries are <strong>actions</strong> — an action menu
		or kebab menu that does something (edit, duplicate, delete). For <strong>navigation</strong> —
		links a reader clicks through to another page or section — use
		<a href="/navigation/nav">Nav</a>'s built-in dropdown instead; its menu items are real navigable
		links, not action buttons.
	</Alert>

	<Tabs items={demoTabs} ariaLabel="Dropdown demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<p class="tab-note">
						Every item carries its own <code>onselect</code> — click one (or focus it and press
						<kbd>Enter</kbd>/<kbd>Space</kbd>) to fire its action, close the menu, and return focus
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
						<code>Check in</code> is <code>disabled</code> — it stays focusable (Arrow/Home/End/
						typeahead all reach it) but is inert on activation, so screen-reader users can still
						discover it. <code>Delete round</code> is <code>danger</code> — styled destructively, never
						by color alone, since its label already says "Delete."
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
						>) — the label text alone is the accessible name. A
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
						<code>align="end"</code> anchors the menu's inline-end edge to the trigger's inline-end —
						the right-aligned kebab-menu form, useful when the trigger sits near the edge of its container.
					</p>
					<Example code={alignCode}>
						<div class="demo-col align-end-demo">
							<Dropdown label="Round actions" items={roundItems} align="end" />
						</div>
					</Example>
				{:else}
					<p class="tab-note">
						With no <code>label</code>, the trigger renders as an icon-only <code>Button</code>
						circle — <code>triggerLabel</code> becomes its accessible name (required; omitting it
						triggers
						<code>Button</code>'s own dev warning). <code>triggerIcon</code> replaces the default chevron
						glyph.
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
	.tab-content :global(.doc-example > .code-block) {
		border-radius: 0 0 var(--hz-radius-md, 0.5rem) var(--hz-radius-md, 0.5rem);
	}

	.align-end-demo {
		display: flex;
		justify-content: flex-end;
	}
</style>
