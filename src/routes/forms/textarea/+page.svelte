<script lang="ts">
	import { Textarea, Stack } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'name', type: 'string', default: '—', description: 'Required.' },
		{ name: 'label', type: 'string', default: '—', description: 'Required.' },
		{ name: 'value', type: 'string', default: "''" },
		{ name: 'placeholder', type: 'string', default: '—' },
		{ name: 'rows', type: 'number', default: '4' },
		{ name: 'maxlength', type: 'number', default: '—' },
		{ name: 'description', type: 'string', default: '—' },
		{ name: 'error', type: 'string', default: '—' },
		{ name: 'required', type: 'boolean', default: 'false' },
		{ name: 'disabled', type: 'boolean', default: 'false' },
		{ name: 'hideLabel', type: 'boolean', default: 'false' }
	];
</script>

<DocPage
	name="Textarea"
	description="A labeled multi-line text area with description, error, and standard field accessibility."
	importLine={'import {Textarea} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="The textarea is associated with its label via id/for. Description and error are chained in aria-describedby."
>
	<Stack gap="md">
		<Textarea
			name="bio"
			label="Bio"
			placeholder="Tell us about yourself…"
			description="Up to 500 characters."
		/>
		<Textarea name="required-ta" label="Message" required placeholder="Required field" />
		<Textarea name="error-ta" label="Feedback" error="Feedback cannot be empty." />
		<Textarea name="disabled-ta" label="Disabled" disabled value="Cannot edit this field." />
	</Stack>
</DocPage>
