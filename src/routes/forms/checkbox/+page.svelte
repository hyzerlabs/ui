<script lang="ts">
	import { Checkbox, Stack } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'name', type: 'string', default: '—', note: 'Required.' },
		{ name: 'label', type: 'string', default: '—', note: 'Required.' },
		{ name: 'checked', type: 'boolean', default: 'false' },
		{ name: 'indeterminate', type: 'boolean', default: 'false' },
		{ name: 'value', type: 'string', default: '—' },
		{ name: 'description', type: 'string', default: '—' },
		{ name: 'error', type: 'string', default: '—' },
		{ name: 'required', type: 'boolean', default: 'false' },
		{ name: 'disabled', type: 'boolean', default: 'false' }
	];

	let checked1 = $state(false);
	let checked2 = $state(true);
</script>

<DocPage
	name="Checkbox"
	description="A labeled checkbox with description, error, indeterminate, and disabled states."
	importLine={'import {Checkbox} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="The checkbox is associated with its label via id/for. aria-required and aria-invalid reflect required/error state. Indeterminate state is set via the DOM .indeterminate property."
>
	<Stack gap="md">
		<Checkbox name="unchecked" label="Unchecked (default)" bind:checked={checked1} />
		<Checkbox name="checked" label="Checked" bind:checked={checked2} />
		<Checkbox name="indeterminate" label="Indeterminate" indeterminate />
		<Checkbox
			name="with-desc"
			label="Agree to terms"
			description="By checking this you agree to our terms of service."
			required
		/>
		<Checkbox
			name="with-error"
			label="Accept policy"
			error="You must accept the policy to continue."
		/>
		<Checkbox name="disabled-cb" label="Disabled" disabled />
		<Checkbox name="disabled-checked-cb" label="Disabled and checked" disabled checked />
	</Stack>
</DocPage>
