<script lang="ts">
	import { RadioGroup, Stack } from '$lib';
	import type { RadioOption } from '$lib/types';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'name', type: 'string', default: '—', description: 'Required.' },
		{ name: 'label', type: 'string', default: '—', description: 'Required.' },
		{ name: 'options', type: 'RadioOption[]', default: '—', description: 'Required.' },
		{ name: 'value', type: 'string', default: "''" },
		{ name: 'description', type: 'string', default: '—' },
		{ name: 'error', type: 'string', default: '—' },
		{ name: 'required', type: 'boolean', default: 'false' },
		{ name: 'disabled', type: 'boolean', default: 'false' }
	];

	const options: RadioOption[] = [
		{ value: 'sm', label: 'Small' },
		{ value: 'md', label: 'Medium' },
		{ value: 'lg', label: 'Large' },
		{ value: 'xl', label: 'Extra Large (unavailable)', disabled: true }
	];

	let val = $state('');
</script>

<DocPage
	name="RadioGroup"
	description="A group of radio buttons rendered inside a fieldset with a legend, description, and error."
	importLine={'import {RadioGroup} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Radios are grouped in a <fieldset> with a <legend>. Each radio is individually labelled. Error and description are associated via aria-describedby on the group."
>
	<Stack gap="md">
		<RadioGroup name="size" label="Size" {options} bind:value={val} />
		<RadioGroup
			name="size-desc"
			label="Size with description"
			{options}
			description="Choose your preferred size."
		/>
		<RadioGroup name="size-error" label="Size" {options} error="Please select a size." />
		<RadioGroup name="size-disabled" label="Disabled group" {options} disabled />
	</Stack>
</DocPage>
