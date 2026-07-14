<script lang="ts">
	import { ColorInput, Tabs, Stack } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'name', type: 'string', default: '—', note: 'Required. Form field name.' },
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Required. Always in the DOM; sr-only with hideLabel.'
		},
		{
			name: 'value',
			type: 'string',
			default: "'#000000'",
			note: 'Bindable. The platform normalizes to 7-char lowercase hex.'
		},
		{
			name: 'showInput',
			type: 'boolean',
			default: 'true',
			note: 'Renders the exact-entry hex field beside the swatch.'
		},
		{
			name: 'inputLabel',
			type: 'string',
			default: '`${label} (hex value)`',
			note: 'Accessible name for the hex field.'
		},
		{ name: 'description', type: 'string', default: '—', note: 'Help text below the label.' },
		{
			name: 'error',
			type: 'string',
			default: '—',
			note: 'Inline error message; sets the error state.'
		},
		{ name: 'required', type: 'boolean', default: 'false', note: 'Label indicator only.' },
		{ name: 'disabled', type: 'boolean', default: 'false' },
		{ name: 'hideLabel', type: 'boolean', default: 'false' },
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-field hz-field--color classes.'
		}
	];

	let discColor = $state('#ff6b35');

	const basicCode = $derived(
		[
			`let discColor = $state('${discColor}');`,
			'',
			'<ColorInput name="disc-color" label="Disc color" bind:value={discColor} />'
		].join('\n')
	);

	const noValueCode =
		'<ColorInput name="accent" label="Scorecard accent" value="#2563eb" showInput={false} />';

	const statesCode = [
		'<ColorInput',
		'\tname="glow"',
		'\tlabel="Glow plastic color"',
		'\tvalue="#a3e635"',
		'\tdescription="Pick something that shows up after sundown."',
		'/>',
		'',
		'<ColorInput name="stamp" label="Stamp foil" error="That foil is out of stock." />',
		'<ColorInput name="required" label="Jersey color" required />',
		'<ColorInput name="locked" label="League color (locked)" value="#2563eb" disabled />'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'no-value', label: 'Swatch only' },
		{ id: 'states', label: 'Description & states' }
	];
</script>

<DocPage
	name="ColorInput"
	description="A labeled native color picker paired with a synced hex field for exact keyboard entry — typed values commit on change, validated and normalized."
	importLine={'import {ColorInput} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="The color input is the labelled (`id`/`for`), named, form-participating control; activating it opens the platform picker, which owns the picking UX. The hex field is an exact-entry affordance with its own accessible name (`inputLabel`) and no `name` — it never submits. `description` and `error` chain into `aria-describedby` (description first) and an `error` sets `aria-invalid`. `required` renders the label indicator only — a color input always holds a value. Don't let color alone carry meaning; the visible hex value helps."
>
	<Tabs items={demoTabs} ariaLabel="ColorInput demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<p class="tab-note">
						The swatch is the native picker; the hex field commits on blur/Enter — type
						<code>f60</code> and it normalizes to <code>#ff6600</code>, garbage restores the current
						value. Picks and typed values stay in sync.
					</p>
					<Example code={basicCode}>
						<ColorInput name="disc-color-demo" label="Disc color" bind:value={discColor} />
					</Example>
				{:else if item.id === 'no-value'}
					<p class="tab-note">
						<code>showInput={'{false}'}</code> swaps the hex field for a read-only readout — the value
						stays visible without inviting edits, same as the slider's.
					</p>
					<Example code={noValueCode}>
						<ColorInput
							name="accent-demo"
							label="Scorecard accent"
							value="#2563eb"
							showInput={false}
						/>
					</Example>
				{:else}
					<p class="tab-note">
						<code>description</code> and <code>error</code> are announced with the field — both
						chain into <code>aria-describedby</code>. Error and disabled are also field states: the
						wrapper's <code>data-state</code> reflects them, with error winning.
					</p>
					<Example code={statesCode}>
						<Stack gap="md">
							<ColorInput
								name="glow-demo"
								label="Glow plastic color"
								value="#a3e635"
								description="Pick something that shows up after sundown."
							/>
							<ColorInput name="stamp-demo" label="Stamp foil" error="That foil is out of stock." />
							<ColorInput name="required-demo" label="Jersey color" required />
							<ColorInput
								name="locked-demo"
								label="League color (locked)"
								value="#2563eb"
								disabled
							/>
						</Stack>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>
