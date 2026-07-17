<script lang="ts">
	import { Toggle, Tabs, Stack } from '$lib';
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
		{ name: 'checked', type: 'boolean', default: 'false', note: 'Bindable.' },
		{ name: 'value', type: 'string', default: '—', note: 'Submitted value when on.' },
		{ name: 'description', type: 'string', default: '—', note: 'Help text on its own row.' },
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
			note: 'Merged after the hz-field hz-field--toggle classes.'
		}
	];

	let notifications = $state(true);

	const basicCode = [
		'let notifications = $state(true);',
		'',
		'<Toggle name="notifications" label="Round notifications" bind:checked={notifications} />'
	].join('\n');

	const statesCode = [
		'<Toggle',
		'\tname="autosave"',
		'\tlabel="Auto-save scorecards"',
		'\tdescription="Saves your scorecard after every hole."',
		'/>',
		'',
		'<Toggle name="location" label="Share location with your card" error="Location access was denied." />',
		'<Toggle name="terms" label="Play by PDGA rules" required />',
		'<Toggle name="premium" label="Live scoring (premium)" disabled />',
		'<Toggle name="metric" label="Metric distances" disabled checked />'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'states', label: 'Description & states' }
	];
</script>

<DocPage
	name="Toggle"
	description="A switch for binary on/off settings — a native checkbox exposed with the switch role, so it submits a form value like any other field."
	importLine={'import {Toggle} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Toggle renders an `<input type=&quot;checkbox&quot; role=&quot;switch&quot;>` associated with its label via `id`/`for` — screen readers announce it as a switch while the native checked state, keyboard behavior (Space toggles; Enter submits the form), and form participation all come from the platform. `description` and `error` chain into `aria-describedby` (description first). Reach for Toggle over `Checkbox` when the setting reads as on/off rather than selected/unselected."
	a11yLinks={[
		{ label: 'APG Switch pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/switch/' },
		{
			label: 'MDN: switch role',
			href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/switch_role'
		}
	]}
>
	<Tabs items={demoTabs} ariaLabel="Toggle demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<Example code={basicCode}>
						<Toggle
							name="notifications-demo"
							label="Round notifications"
							bind:checked={notifications}
						/>
					</Example>
				{:else}
					<p class="tab-note">
						<code>description</code> and <code>error</code> are announced with the switch — both
						chain into <code>aria-describedby</code>, breaking onto their own row below the
						switch-and-label pair. Error and disabled are also field states: the wrapper's
						<code>data-state</code> reflects them, with error winning.
					</p>
					<Example code={statesCode}>
						<Stack gap="md">
							<Toggle
								name="autosave-demo"
								label="Auto-save scorecards"
								description="Saves your scorecard after every hole."
							/>
							<Toggle
								name="location-demo"
								label="Share location with your card"
								error="Location access was denied."
							/>
							<Toggle name="terms-demo" label="Play by PDGA rules" required />
							<Toggle name="premium-demo" label="Live scoring (premium)" disabled />
							<Toggle name="metric-demo" label="Metric distances" disabled checked />
						</Stack>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>
