<script lang="ts">
	import { TextInput, Stack } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'name', type: 'string', default: '—', note: 'Required.' },
		{ name: 'label', type: 'string', default: '—', note: 'Required.' },
		{
			name: 'type',
			type: "'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number'",
			default: "'text'"
		},
		{ name: 'value', type: 'string', default: "''" },
		{ name: 'placeholder', type: 'string', default: '—' },
		{ name: 'description', type: 'string', default: '—' },
		{ name: 'error', type: 'string', default: '—' },
		{ name: 'required', type: 'boolean', default: 'false' },
		{ name: 'disabled', type: 'boolean', default: 'false' },
		{ name: 'hideLabel', type: 'boolean', default: 'false' },
		{ name: 'prefix', type: 'Snippet', default: '—' },
		{ name: 'suffix', type: 'Snippet', default: '—' }
	];

	let val = $state('');
</script>

<DocPage
	name="TextInput"
	description="A labeled text input supporting all HTML input types, prefix/suffix slots, description, and inline error display."
	importLine={'import {TextInput} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="The input is associated with its label via id/for. Description and error are chained in aria-describedby. Required fields set aria-required; invalid fields set aria-invalid."
>
	<Stack gap="md">
		<TextInput name="basic" label="Name" placeholder="Enter your name" bind:value={val} />
		<TextInput
			name="email-ex"
			label="Email"
			type="email"
			placeholder="you@example.com"
			description="We'll never share your email."
		/>
		<TextInput name="required-ex" label="Username" required placeholder="required field" />
		<TextInput
			name="error-ex"
			label="Password"
			type="password"
			error="Password must be at least 8 characters."
		/>
		<TextInput name="disabled-ex" label="Disabled field" disabled value="Cannot edit" />
		<TextInput name="hidden-label" label="Search" hideLabel placeholder="Search…">
			{#snippet prefix()}🔍{/snippet}
		</TextInput>
	</Stack>
</DocPage>
