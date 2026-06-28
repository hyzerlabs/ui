<script lang="ts">
	import { Select, Stack } from '$lib';
	import type { SelectOption } from '$lib/types';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'name', type: 'string', default: '—', description: 'Required.' },
		{ name: 'label', type: 'string', default: '—', description: 'Required.' },
		{ name: 'options', type: 'SelectOption[]', default: '—', description: 'Required.' },
		{ name: 'value', type: 'string', default: "''" },
		{ name: 'placeholder', type: 'string', default: "'Select...'" },
		{ name: 'description', type: 'string', default: '—' },
		{ name: 'error', type: 'string', default: '—' },
		{ name: 'required', type: 'boolean', default: 'false' },
		{ name: 'disabled', type: 'boolean', default: 'false' }
	];

	const options: SelectOption[] = [
		{ value: 'svelte', label: 'Svelte' },
		{ value: 'react', label: 'React' },
		{ value: 'vue', label: 'Vue' },
		{ value: 'solid', label: 'Solid', disabled: true }
	];

	const groupedOptions: SelectOption[] = [
		{
			group: 'Frontend',
			options: [
				{ value: 'svelte', label: 'Svelte' },
				{ value: 'react', label: 'React' }
			]
		},
		{
			group: 'Backend',
			options: [
				{ value: 'node', label: 'Node.js' },
				{ value: 'deno', label: 'Deno' }
			]
		}
	];
</script>

<DocPage
	name="Select"
	description="A labeled native select element with flat options, option groups, placeholder, and standard field accessibility."
	importLine={'import {Select} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="The select is associated with its label. Description and error are chained in aria-describedby. aria-required and aria-invalid reflect required/error state."
>
	<Stack gap="md">
		<Select name="framework" label="Framework" {options} placeholder="Choose a framework" />
		<Select
			name="grouped"
			label="Stack"
			options={groupedOptions}
			placeholder="Choose a technology"
			description="Grouped options example."
		/>
		<Select name="required-sel" label="Required select" {options} required />
		<Select name="error-sel" label="Category" {options} error="Please select a category." />
		<Select name="disabled-sel" label="Disabled" {options} disabled />
	</Stack>
</DocPage>
