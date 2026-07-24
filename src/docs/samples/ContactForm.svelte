<script lang="ts">
	/**
	 * A small contact form composed entirely from the library.
	 *
	 * It imports only public exports. It's the minimal
	 * end of the Form spectrum — four fields, one Select, no Split/Card order
	 * summary — but the validation flow is the same one CheckoutForm uses at
	 * full size: submit-time validation builds a plain field-name → message
	 * record, `toFormErrors` reshapes it, and Form renders the linked error
	 * summary and moves focus to it. See /patterns/checkout-form for the
	 * larger, multi-section version of this same workflow.
	 */
	import {
		Form,
		TextInput,
		Textarea,
		Select,
		Button,
		Alert,
		Container,
		Stack,
		toFormErrors
	} from '$lib';
	import type { FormError, FormOption } from '$lib/types';

	const topics: FormOption[] = [
		{ value: 'general', label: 'General question' },
		{ value: 'order', label: 'Order support' },
		{ value: 'wholesale', label: 'Wholesale & retail' },
		{ value: 'press', label: 'Press' }
	];

	let name = $state('');
	let email = $state('');
	let topic = $state('');
	let message = $state('');

	let errors = $state<FormError[]>([]);
	let sent = $state(false);

	// One record, keyed by field `name` — toFormErrors turns it into the
	// FormError[] the summary links from. The same array feeds the inline
	// `error` prop on each field.
	function validate(): FormError[] {
		const problems: Record<string, string> = {};
		if (!name.trim()) problems.name = 'Enter your name.';
		if (!email.trim()) problems.email = 'Enter an email address.';
		else if (!/^\S+@\S+\.\S+$/.test(email))
			problems.email = 'Enter an email address like you@example.com.';
		if (!topic) problems.topic = 'Select a topic.';
		if (!message.trim()) problems.message = 'Enter a message.';
		return toFormErrors(problems);
	}

	function handleSubmit() {
		errors = validate();
		sent = errors.length === 0;
	}

	const fieldError = (fieldName: string) => errors.find((e) => e.name === fieldName)?.message;
</script>

<Container max="sm" padding="lg">
	<Stack gap="lg">
		<Stack gap="xs">
			<h2>Contact us</h2>
			<p class="muted">Questions about an order, a course, or anything else — we read every one.</p>
		</Stack>

		{#if sent}
			<Alert
				intent="success"
				title="Message sent"
				headingLevel={3}
				onDismiss={() => (sent = false)}
			>
				Thanks, {name.split(' ')[0] || 'friend'} — we'll reply to {email} within a business day.
			</Alert>
		{/if}

		<Form {errors} onSubmit={handleSubmit} novalidate summaryHeadingLevel={3} ariaLabel="Contact">
			<Stack gap="md">
				<TextInput
					name="name"
					label="Name"
					autocomplete="name"
					required
					bind:value={name}
					error={fieldError('name')}
				/>
				<TextInput
					name="email"
					label="Email"
					type="email"
					autocomplete="email"
					required
					bind:value={email}
					error={fieldError('email')}
				/>
				<Select
					name="topic"
					label="Topic"
					options={topics}
					placeholder="Select…"
					required
					bind:value={topic}
					error={fieldError('topic')}
				/>
				<Textarea
					name="message"
					label="Message"
					rows={5}
					required
					bind:value={message}
					error={fieldError('message')}
				/>
				<Button type="submit" intent="primary" size="lg">Send message</Button>
			</Stack>
		</Form>
	</Stack>
</Container>

<style>
	h2 {
		margin: 0;
		font-size: var(--hz-font-size-xl, 1.65rem);
		font-weight: var(--hz-font-weight-bold, 700);
	}

	p {
		margin: 0;
	}

	.muted {
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
