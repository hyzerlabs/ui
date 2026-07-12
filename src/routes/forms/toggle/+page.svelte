<script lang="ts">
	import { Toggle, Stack } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'name', type: 'string', default: '—', note: 'Required.' },
		{ name: 'label', type: 'string', default: '—', note: 'Required.' },
		{ name: 'checked', type: 'boolean', default: 'false' },
		{ name: 'description', type: 'string', default: '—' },
		{ name: 'error', type: 'string', default: '—' },
		{ name: 'required', type: 'boolean', default: 'false' },
		{ name: 'disabled', type: 'boolean', default: 'false' }
	];

	let on = $state(false);
	let on2 = $state(true);
</script>

<DocPage
	name="Toggle"
	description="A labeled switch toggle (checkbox role) for binary on/off settings."
	importLine={'import {Toggle} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Toggle is a checkbox rendered with switch role. The label is associated via id/for. aria-checked reflects the toggle state."
>
	<Stack gap="md">
		<Toggle name="toggle-off" label="Notifications off" bind:checked={on} />
		<Toggle name="toggle-on" label="Dark mode on" bind:checked={on2} />
		<Toggle
			name="toggle-desc"
			label="Auto-save"
			description="Automatically saves your work every 5 minutes."
		/>
		<Toggle name="toggle-error" label="Required setting" error="This setting is required." />
		<Toggle name="toggle-disabled" label="Disabled toggle" disabled />
		<Toggle name="toggle-disabled-on" label="Disabled and on" disabled checked />
	</Stack>
</DocPage>
