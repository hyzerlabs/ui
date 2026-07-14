<script lang="ts">
	import { RadioGroup, Tabs, Stack } from '$lib';
	import type { FormOption } from '$lib/types';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{
			name: 'name',
			type: 'string',
			default: '—',
			note: 'Required. Shared by every radio in the group.'
		},
		{
			name: 'label',
			type: 'string',
			default: '—',
			note: 'Required. Rendered as the fieldset legend; sr-only with hideLabel.'
		},
		{
			name: 'options',
			type: 'FormOption[]',
			default: '—',
			note: 'Required. See FormOption below.'
		},
		{ name: 'value', type: 'string', default: "''", note: 'Bindable. The selected option value.' },
		{ name: 'orientation', type: "'horizontal' | 'vertical'", default: "'vertical'" },
		{ name: 'description', type: 'string', default: '—', note: 'Help text below the legend.' },
		{
			name: 'error',
			type: 'string',
			default: '—',
			note: 'Inline error message; sets the error state.'
		},
		{ name: 'required', type: 'boolean', default: 'false' },
		{ name: 'disabled', type: 'boolean', default: 'false', note: 'Disables the whole group.' },
		{ name: 'hideLabel', type: 'boolean', default: 'false' },
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-field hz-field--radio-group classes.'
		}
	];

	const formOptionType: PropRow[] = [
		{ name: 'value', type: 'string', default: '—', note: 'Required.' },
		{ name: 'label', type: 'string', default: '—', note: 'Required.' },
		{ name: 'disabled', type: 'boolean', default: '—', note: 'Disables just this option.' }
	];

	const stabilities: FormOption[] = [
		{ value: 'understable', label: 'Understable' },
		{ value: 'stable', label: 'Stable' },
		{ value: 'overstable', label: 'Overstable' },
		{ value: 'flippy', label: 'Roller-only (unavailable)', disabled: true }
	];

	const teePositions: FormOption[] = [
		{ value: 'short', label: 'Short' },
		{ value: 'long', label: 'Long' }
	];

	const divisions: FormOption[] = [
		{ value: 'mpo', label: 'MPO' },
		{ value: 'fpo', label: 'FPO' },
		{ value: 'ma1', label: 'MA1' },
		{ value: 'ma2', label: 'MA2' }
	];

	let stability = $state('');

	const basicCode = [
		'const stabilities: FormOption[] = [',
		"\t{ value: 'understable', label: 'Understable' },",
		"\t{ value: 'stable', label: 'Stable' },",
		"\t{ value: 'overstable', label: 'Overstable' },",
		"\t{ value: 'flippy', label: 'Roller-only (unavailable)', disabled: true }",
		'];',
		'',
		'<RadioGroup name="stability" label="Disc stability" options={stabilities} bind:value={stability} />'
	].join('\n');

	const orientationCode =
		'<RadioGroup name="tees" label="Tee position" options={teePositions} orientation="horizontal" />';

	const statesCode = [
		'<RadioGroup',
		'\tname="division"',
		'\tlabel="Division"',
		'\toptions={divisions}',
		'\tdescription="You can move up a division later, but not down."',
		'/>',
		'',
		'<RadioGroup name="tees" label="Tee position" options={teePositions} error="Pick a tee position." />',
		'<RadioGroup name="division2" label="Division" options={divisions} required />',
		'<RadioGroup name="closed" label="Tee position (course closed)" options={teePositions} disabled />'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'orientation', label: 'Orientation' },
		{ id: 'states', label: 'Description & states' }
	];
</script>

<DocPage
	name="RadioGroup"
	description="A group of radio buttons in a fieldset with a legend, vertical or horizontal layout, and standard field accessibility."
	importLine={'import {RadioGroup} from "@hyzer-labs/ui"'}
	{props}
	types={[{ name: 'FormOption', props: formOptionType }]}
	a11yNote="The group is a `<fieldset>` whose `label` renders as the `<legend>`; with `hideLabel` the legend stays in the DOM as screen-reader-only text. Each radio has its own label, and the options sit in an inner `role=&quot;radiogroup&quot;` container that carries `aria-describedby` (description first, then error) and `aria-invalid`. Arrow-key movement between radios is native browser behavior."
>
	<Tabs items={demoTabs} ariaLabel="RadioGroup demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<Example code={basicCode}>
						<RadioGroup
							name="stability-demo"
							label="Disc stability"
							options={stabilities}
							bind:value={stability}
						/>
					</Example>
				{:else if item.id === 'orientation'}
					<p class="tab-note">
						<code>orientation="horizontal"</code> lays the options out in a wrapping row — best for two
						or three short labels.
					</p>
					<Example code={orientationCode}>
						<RadioGroup
							name="tees-demo"
							label="Tee position"
							options={teePositions}
							orientation="horizontal"
						/>
					</Example>
				{:else}
					<p class="tab-note">
						<code>description</code> and <code>error</code> are announced with the group — both
						chain into <code>aria-describedby</code> on the radiogroup container. Error and disabled
						are also field states: the fieldset's <code>data-state</code> reflects them, with error winning.
					</p>
					<Example code={statesCode}>
						<Stack gap="md">
							<RadioGroup
								name="division-demo"
								label="Division"
								options={divisions}
								description="You can move up a division later, but not down."
							/>
							<RadioGroup
								name="tees-error-demo"
								label="Tee position"
								options={teePositions}
								error="Pick a tee position."
							/>
							<RadioGroup name="required-demo" label="Division" options={divisions} required />
							<RadioGroup
								name="disabled-demo"
								label="Tee position (course closed)"
								options={teePositions}
								disabled
							/>
						</Stack>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>
