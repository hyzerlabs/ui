<script lang="ts">
	import { Form, TextInput, Button, Stack } from '$lib';
	import type { FormError } from '$lib/types';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'errors', type: 'FormError[]', default: '[]' },
		{ name: 'onSubmit', type: '(e: SubmitEvent) => void', default: '—' },
		{ name: 'summaryTitle', type: 'string', default: "'There is a problem'" },
		{ name: 'summaryHeadingLevel', type: '2 | 3 | 4 | 5 | 6', default: '2' },
		{ name: 'focusTarget', type: "'summary' | 'firstField'", default: "'summary'" },
		{ name: 'novalidate', type: 'boolean', default: 'false' },
		{ name: 'ariaLabel', type: 'string', default: '—' },
		{ name: 'children', type: 'Snippet', default: '—', description: 'Required. Form content.' }
	];

	// Demo state
	let nameValue = $state('');
	let emailValue = $state('');
	let formErrors = $state<FormError[]>([]);
	let submitted = $state(false);

	function handleSubmit() {
		const errors: FormError[] = [];
		if (!nameValue.trim()) errors.push({ name: 'demo-name', message: 'Name is required.' });
		if (!emailValue.trim()) errors.push({ name: 'demo-email', message: 'Email is required.' });
		else if (!emailValue.includes('@'))
			errors.push({ name: 'demo-email', message: 'Enter a valid email address.' });
		formErrors = errors;
		if (errors.length === 0) submitted = true;
	}
</script>

<DocPage
	name="Form"
	description="Form wrapper that renders an accessible error summary, manages focus on submit, and fires onSubmit with preventDefault."
	importLine={'import {Form} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="On submit with errors the summary receives focus (or the first invalid field when focusTarget='firstField'). The summary has role='alert' and is announced by screen readers. Each summary item links to the invalid field."
>
	<Stack gap="lg">
		<div>
			<h3>Form with validation and error summary</h3>
			{#if submitted}
				<p class="success-msg" role="status">✓ Form submitted successfully.</p>
				<button
					type="button"
					class="reset-btn"
					onclick={() => {
						submitted = false;
						nameValue = '';
						emailValue = '';
						formErrors = [];
					}}>Reset demo</button
				>
			{:else}
				<Form errors={formErrors} onSubmit={handleSubmit} ariaLabel="Demo contact form">
					<Stack gap="md">
						<TextInput name="demo-name" label="Name" bind:value={nameValue} required />
						<TextInput
							name="demo-email"
							label="Email"
							type="email"
							bind:value={emailValue}
							required
						/>
						<Button type="submit">Submit</Button>
					</Stack>
				</Form>
			{/if}
		</div>

		<div>
			<h3>Error summary (pre-populated)</h3>
			<Form
				errors={[
					{ name: 'ex-name', message: 'Name is required.' },
					{ name: 'ex-email', message: 'Enter a valid email.' }
				]}
				onSubmit={() => {}}
				ariaLabel="Error state example"
			>
				<Stack gap="md">
					<TextInput name="ex-name" label="Name" error="Name is required." />
					<TextInput name="ex-email" label="Email" type="email" error="Enter a valid email." />
					<Button type="submit">Submit</Button>
				</Stack>
			</Form>
		</div>
	</Stack>
</DocPage>

<style>
	h3 {
		margin: 0 0 0.75rem;
		font-size: var(--hz-font-size-base, 1rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}
	.success-msg {
		margin: 0 0 0.75rem;
		color: var(--hz-color-success, #16a34a);
		font-weight: var(--hz-font-weight-semibold, 600);
	}
	.reset-btn {
		padding: 0.375rem 0.75rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		background: transparent;
		cursor: pointer;
		color: inherit;
	}
</style>
