<script lang="ts">
	import { Combobox, Tabs, Stack, Alert } from '$lib';
	import type { FormOption, ComboboxChipProps } from '$lib/types';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{
			name: 'name',
			type: 'string',
			default: '—',
			note: 'Required. Repeated on every hidden input.'
		},
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Required. Always in the DOM; sr-only with hideLabel.'
		},
		{
			name: 'options',
			type: 'FormOption[]',
			default: '—',
			note: 'Required. Flat, multi-select — see FormOption below.'
		},
		{
			name: 'value',
			type: 'string[]',
			default: '[]',
			note: 'Bindable. Selected option values, in selection order.'
		},
		{ name: 'placeholder', type: 'string', default: "'Search...'" },
		{
			name: 'filter',
			type: '(query: string, option: FormOption) => boolean',
			default: '—',
			note: 'Overrides the default case-insensitive substring match.'
		},
		{ name: 'emptyText', type: 'string', default: "'No results'" },
		{ name: 'toggleLabel', type: 'string', default: "'Show options'" },
		{
			name: 'chipProps',
			type: 'ComboboxChipProps',
			default: '{}',
			note: "Styling applied to every chip — see ComboboxChipProps below. Resolves to size: 'sm'."
		},
		{
			name: 'onchange',
			type: '(value: string[]) => void',
			default: '—',
			note: 'Fires on every selection change: toggle, chip dismiss, or Backspace removal.'
		},
		{ name: 'description', type: 'string', default: '—', note: 'Help text below the label.' },
		{
			name: 'error',
			type: 'string',
			default: '—',
			note: 'Inline error message; sets the error state.'
		},
		{ name: 'required', type: 'boolean', default: 'false' },
		{ name: 'disabled', type: 'boolean', default: 'false' },
		{ name: 'hideLabel', type: 'boolean', default: 'false' },
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-field hz-combobox classes.'
		}
	];

	const formOptionType: PropRow[] = [
		{ name: 'value', type: 'string', default: '—', note: 'Required.' },
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Required. Shown on the chip and in the option row.'
		},
		{
			name: 'disabled',
			type: 'boolean',
			default: '—',
			note: 'Inert — visible but never toggleable; an existing selection stays removable.'
		}
	];

	const chipPropsType: PropRow[] = [
		{ name: 'intent', type: "'neutral' | Intent", default: "'neutral'" },
		{ name: 'variant', type: "'soft' | 'solid' | 'outline'", default: "'soft'" },
		{
			name: 'size',
			type: "'sm' | 'md'",
			default: "'sm'",
			note: "Combobox's own default overrides Badge's md default."
		},
		{ name: 'rounded', type: "'none' | 'sm' | 'md' | 'lg' | 'full'", default: "'full'" },
		{ name: 'class', type: 'string', default: '—' }
	];

	const putters: FormOption[] = [
		{ value: 'aviar', label: 'Aviar' },
		{ value: 'luna', label: 'Luna' },
		{ value: 'judge', label: 'Judge' },
		{ value: 'zone', label: 'Zone (out of stock)', disabled: true },
		{ value: 'punisher', label: 'Punisher' }
	];

	// Pre-selects a disabled option's value too — its chip still renders and
	// stays dismissible even though its <li> is inert (Combobox-R5/R11).
	let bag = $state<string[]>(['aviar', 'zone']);

	const basicCode = [
		'const putters: FormOption[] = [',
		"\t{ value: 'aviar', label: 'Aviar' },",
		"\t{ value: 'luna', label: 'Luna' },",
		"\t{ value: 'judge', label: 'Judge' },",
		"\t{ value: 'zone', label: 'Zone (out of stock)', disabled: true },",
		"\t{ value: 'punisher', label: 'Punisher' }",
		'];',
		'',
		'<Combobox name="putters" label="Putters" options={putters} bind:value={bag} />'
	].join('\n');

	const discs: FormOption[] = [
		{ value: 'destroyer', label: 'Destroyer' },
		{ value: 'wraith', label: 'Wraith' },
		{ value: 'buzzz', label: 'Buzzz' },
		{ value: 'roc3', label: 'Roc3' }
	];

	// Custom filter: match on the start of the label instead of "contains".
	function startsWithFilter(query: string, option: FormOption): boolean {
		return option.label.toLowerCase().startsWith(query.toLowerCase());
	}

	const filterCode = [
		'function startsWithFilter(query: string, option: FormOption): boolean {',
		'\treturn option.label.toLowerCase().startsWith(query.toLowerCase());',
		'}',
		'',
		'<Combobox name="discs" label="Discs" options={discs} filter={startsWithFilter} />'
	].join('\n');

	const divisions: FormOption[] = [
		{ value: 'mpo', label: 'MPO' },
		{ value: 'fpo', label: 'FPO' },
		{ value: 'ma1', label: 'MA1' },
		{ value: 'ma2', label: 'MA2' }
	];

	const chipStyle: ComboboxChipProps = { intent: 'primary', variant: 'solid', rounded: 'md' };

	const chipsCode = [
		'<Combobox',
		'\tname="divisions"',
		'\tlabel="Divisions"',
		'\toptions={divisions}',
		"\tchipProps={{ intent: 'primary', variant: 'solid', rounded: 'md' }}",
		'/>'
	].join('\n');

	const tees: FormOption[] = [
		{ value: 'short', label: 'Short tees' },
		{ value: 'long', label: 'Long tees' }
	];

	const statesCode = [
		'<Combobox',
		'\tname="tees"',
		'\tlabel="Tee position"',
		'\toptions={tees}',
		'\tdescription="Pick every tee your card is playing today."',
		'/>',
		'',
		'<Combobox name="division-error" label="Divisions" options={divisions} error="Pick at least one division." />',
		'<Combobox name="division-required" label="Divisions" options={divisions} required />',
		'<Combobox name="tees-disabled" label="Tee position" options={tees} disabled />'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'filter', label: 'Custom filter' },
		{ id: 'chips', label: 'Styled chips' },
		{ id: 'states', label: 'Description & states' }
	];
</script>

<DocPage
	name="Combobox"
	description="A multi-select, filterable text input that follows the WAI-ARIA APG combobox (list-autocomplete) pattern, with each pick rendered as a dismissible chip."
	importLine={'import {Combobox} from "@hyzer-labs/ui"'}
	{props}
	types={[
		{ name: 'FormOption', props: formOptionType },
		{ name: 'ComboboxChipProps', props: chipPropsType }
	]}
	a11yNote="The visible input carries `role=combobox` with `aria-autocomplete=list`, `aria-expanded`, and `aria-controls` pointing at the `role=listbox` popup, which is `aria-multiselectable`. Instead of moving DOM focus into the list, the currently highlighted option is tracked as virtual focus via `aria-activedescendant` on the input, so screen readers announce the active option while the field stays editable. Each selected value renders as a `Badge` chip inside the control, and every chip's labelled dismiss button (announced as Remove, followed by the option's label) is a real, individually-focusable tab stop — tabbing into the field reaches the chips before the input. Keyboard: `ArrowDown`/`ArrowUp` open and move the active option (wrapping, skipping disabled entries); `Alt+ArrowDown` opens without moving; `Alt+ArrowUp` closes unchanged; `Home`/`End` jump to the first/last enabled option while open (native text-cursor behavior while closed); `Enter` toggles the active option's membership and keeps the popup open so you can keep picking; `Backspace` on an empty query removes the last chip; `Escape` closes and clears the filter query only — it never clears a selection, since every chip carries its own dismiss button; `Tab` closes and lets focus move on. The input is the only tab stop for opening the popup — the trailing toggle button is `tabindex=-1`, reachable by pointer only."
	a11yLinks={[
		{ label: 'APG Combobox pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/' }
	]}
>
	<Alert intent="info" title="Select vs Combobox">
		Reach for <code>Combobox</code> when there are many options — where filtering or virtualization
		helps — or when you need search / type-to-filter. For a small, static option set, prefer the
		simpler native <a href="/components/select">Select</a>, including its own native
		<code>multiple</code>.
	</Alert>
	<Tabs items={demoTabs} ariaLabel="Combobox demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<p class="tab-note">
						Type to filter, or open with the toggle/<kbd>ArrowDown</kbd>. Clicking (or pressing
						<kbd>Enter</kbd> on) an option toggles its membership — the popup stays open so you can
						keep picking, and each pick becomes a dismissible chip. <kbd>Backspace</kbd> on an empty
						query removes the last chip. A disabled option (<code>Zone</code>) stays visible but
						can't be toggled — its chip is pre-selected here to show that an existing selection
						stays removable even when the option itself is inert.
					</p>
					<Example code={basicCode}>
						<div class="demo-col">
							<Combobox name="putters-demo" label="Putters" options={putters} bind:value={bag} />
						</div>
					</Example>
				{:else if item.id === 'filter'}
					<p class="tab-note">
						The default filter is a case-insensitive substring match on the label. A consumer
						<code>filter</code> prop overrides it wholesale — here it matches only the start of the label.
					</p>
					<Example code={filterCode}>
						<div class="demo-col">
							<Combobox name="discs-demo" label="Discs" options={discs} filter={startsWithFilter} />
						</div>
					</Example>
				{:else if item.id === 'chips'}
					<p class="tab-note">
						<code>chipProps</code> lets a consumer who only imports <code>Combobox</code> restyle
						every chip — <code>intent</code>/<code>variant</code>/<code>size</code>/<code
							>rounded</code
						>/<code>class</code> pass straight through to the underlying <code>Badge</code>. It
						applies uniformly to every chip (no per-option styling).
					</p>
					<Example code={chipsCode}>
						<div class="demo-col">
							<Combobox
								name="divisions-demo"
								label="Divisions"
								options={divisions}
								chipProps={chipStyle}
							/>
						</div>
					</Example>
				{:else}
					<p class="tab-note">
						<code>description</code> and <code>error</code> are announced with the field — both
						chain into <code>aria-describedby</code>, even though they're visually hidden while the
						popup is open (the popup overlays that region). Error and disabled are also field
						states: the wrapper's <code>data-state</code> reflects them, with error winning (the
						input and toggle still get native <code>disabled</code>, and chips lose their dismiss
						buttons).
					</p>
					<Example code={statesCode}>
						<div class="demo-col">
							<Stack gap="md">
								<Combobox
									name="tees-demo"
									label="Tee position"
									options={tees}
									description="Pick every tee your card is playing today."
								/>
								<Combobox
									name="division-error-demo"
									label="Divisions"
									options={divisions}
									error="Pick at least one division."
								/>
								<Combobox name="required-demo" label="Divisions" options={divisions} required />
								<Combobox name="disabled-demo" label="Tee position" options={tees} disabled />
							</Stack>
						</div>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>
