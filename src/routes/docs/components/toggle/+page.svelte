<script lang="ts">
	import { Toggle, Tabs, Stack, Alert } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { toggleDoc } from '../../../../docs/data/toggle.js';
	import Example from '../../../../docs/Example.svelte';

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

<DocPage name="Toggle" {...toggleDoc}>
	<Alert intent="info" title="Toggle vs Checkbox">
		Reach for <code>Toggle</code> when a setting reads as on/off, like a preference — it renders
		<code>role="switch"</code> and communicates state immediately. Use
		<a href="/docs/components/checkbox">Checkbox</a> for selections from a list, multi-select membership,
		or the indeterminate select-all pattern.
	</Alert>
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
