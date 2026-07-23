<script lang="ts">
	import { z } from 'zod';
	import { enhance } from '$app/forms';
	import { fromAction } from 'svelte/attachments';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Form, TextInput, Button, Stack, Tabs, toFormErrors } from '$lib';
	import type { FormError } from '$lib/types';
	import DocPage from '../../../docs/DocPage.svelte';
	import { formDoc } from '../../../docs/data/form.js';
	import Example from '../../../docs/Example.svelte';
	import CodeBlock from '../../../docs/CodeBlock.svelte';

	// --- SvelteKit + enhance ---
	const signupSchema = z.object({
		player: z.string().min(1, 'Enter your name.'),
		email: z.email('Enter a valid email address.')
	});

	let kitErrors = $state<FormError[]>([]);
	let kitSaved = $state(false);
	let kitPending = $state(false);

	// The demo below uses the REAL use:enhance + fromAction wiring; only the
	// server hop is simulated. This SubmitFunction stands in for the
	// +page.server.ts action shown in the code sample: it cancel()s the fetch
	// (this docs site is prerendered — there is no server to POST to), runs the
	// same schema the action would, and applies the "response" after a little
	// latency, mimicking applyAction: errors on failure, form reset on success.
	const simulateAction: SubmitFunction<
		Record<string, unknown> | undefined,
		Record<string, unknown> | undefined
	> = ({ formData, formElement, cancel }) => {
		cancel();
		kitPending = true;
		const result = signupSchema.safeParse(Object.fromEntries(formData));
		setTimeout(() => {
			kitPending = false;
			kitErrors = result.success ? [] : toFormErrors(z.flattenError(result.error));
			kitSaved = result.success;
			if (result.success) formElement.reset();
		}, 400);
	};

	const kitServerCode = [
		'// +page.server.ts',
		"import { fail } from '@sveltejs/kit';",
		"import { z } from 'zod';",
		'',
		'const schema = z.object({',
		"\tplayer: z.string().min(1, 'Enter your name.'),",
		"\temail: z.email('Enter a valid email address.')",
		'});',
		'',
		'export const actions = {',
		'\tdefault: async ({ request }) => {',
		'\t\tconst data = Object.fromEntries(await request.formData());',
		'\t\tconst result = schema.safeParse(data);',
		'\t\tif (!result.success) return fail(400, { errors: z.flattenError(result.error) });',
		'\t\t// save result.data — fully typed',
		'\t\treturn { success: true };',
		'\t}',
		'};'
	].join('\n');

	const kitPageCode = [
		'<!-- +page.svelte -->',
		'<script>',
		"\timport { enhance } from '$app/forms';",
		"\timport { fromAction } from 'svelte/attachments';",
		"\timport { Form, TextInput, Button, toFormErrors } from '@hyzer-labs/ui';",
		'',
		'\tlet { form } = $props();',
		'\tconst errors = $derived(toFormErrors(form?.errors));',
		'',
		'\t// Pending state for the submit button, tracked in the enhance submit hook.',
		'\tlet pending = $state(false);',
		'\tconst submit = () => {',
		'\t\tpending = true;',
		'\t\treturn async ({ update }) => {',
		'\t\t\tpending = false;',
		'\t\t\tawait update();',
		'\t\t};',
		'\t};',
		'</' + 'script>',
		'',
		'<Form method="POST" {errors} summaryHeadingLevel={3} ariaLabel="League signup" {@attach fromAction(enhance, () => submit)}>',
		'\t<Stack gap="md">',
		'\t\t<TextInput name="player" label="Player name" />',
		'\t\t<TextInput name="email" label="Email" type="email" />',
		'\t\t<Button type="submit" loading={pending}>Sign up</Button>',
		'\t</Stack>',
		'</Form>'
	].join('\n');

	// --- Zod validation demo (live, client mode) ---
	const reviewSchema = z.object({
		player: z.string().min(1, 'Enter your name.'),
		email: z.email('Enter a valid email address.'),
		holes: z.coerce.number().min(1, 'Enter at least 1 hole.').max(36, '36 holes max.')
	});

	let zodErrors = $state<FormError[]>([]);
	let zodSaved = $state(false);

	const zodFieldError = (name: string) => zodErrors.find((e) => e.name === name)?.message;

	function handleZodSubmit(e: SubmitEvent) {
		const data = Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement));
		const result = reviewSchema.safeParse(data);
		zodErrors = result.success ? [] : toFormErrors(z.flattenError(result.error));
		zodSaved = result.success;
	}

	const zodCode = [
		"import { z } from 'zod';",
		"import { Form, TextInput, Button, toFormErrors } from '@hyzer-labs/ui';",
		'',
		'const schema = z.object({',
		"\tplayer: z.string().min(1, 'Enter your name.'),",
		"\temail: z.email('Enter a valid email address.'),",
		"\tholes: z.coerce.number().min(1, 'Enter at least 1 hole.').max(36, '36 holes max.')",
		'});',
		'',
		'let errors = $state<FormError[]>([]);',
		'const fieldError = (name: string) => errors.find((e) => e.name === name)?.message;',
		'',
		'function handleSubmit(e: SubmitEvent) {',
		'\tconst data = Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement));',
		'\tconst result = schema.safeParse(data);',
		'\terrors = result.success ? [] : toFormErrors(z.flattenError(result.error));',
		'\tif (result.success) save(result.data); // fully typed',
		'}',
		'',
		'<Form {errors} onSubmit={handleSubmit} novalidate summaryHeadingLevel={3} ariaLabel="Round review">',
		'\t<Stack gap="md">',
		'\t\t<TextInput name="player" label="Player name" error={fieldError(\'player\')} />',
		'\t\t<TextInput name="email" label="Email" type="email" error={fieldError(\'email\')} />',
		'\t\t<TextInput name="holes" label="Holes played" type="number" inputmode="numeric" error={fieldError(\'holes\')} />',
		'\t\t<Button type="submit">Post review</Button>',
		'\t</Stack>',
		'</Form>'
	].join('\n');

	// --- Summary anatomy demo (static errors, deliberately out of DOM order) ---
	const anatomyErrors: FormError[] = [
		{ name: 'anatomy-email', message: 'Enter a valid email address.' },
		{ name: 'anatomy-player', message: 'Enter your name.' },
		{ name: '', message: 'Signups close at midnight — unsaved entries are dropped.' }
	];

	const anatomyCode = [
		'const errors: FormError[] = [',
		"\t{ name: 'email', message: 'Enter a valid email address.' },",
		"\t{ name: 'player', message: 'Enter your name.' },",
		"\t{ name: '', message: 'Signups close at midnight — unsaved entries are dropped.' }",
		'];',
		'',
		'<Form {errors} summaryHeadingLevel={3} ariaLabel="Summary anatomy">',
		'\t…',
		'</Form>'
	].join('\n');

	// --- focusTarget demo ---
	let ace = $state('');
	let aceErrors = $state<FormError[]>([]);

	function handleAceSubmit() {
		aceErrors = ace.trim() ? [] : [{ name: 'ace-hole', message: 'Which hole did you ace?' }];
	}

	const focusCode = [
		'<Form {errors} onSubmit={handleSubmit} focusTarget="firstField" summaryHeadingLevel={3} ariaLabel="Report an ace">',
		'\t<Stack gap="md">',
		'\t\t<TextInput name="ace-hole" label="Hole number" bind:value={ace} required error={fieldError(\'ace-hole\')} />',
		'\t\t<Button type="submit">Report ace</Button>',
		'\t</Stack>',
		'</Form>'
	].join('\n');

	const demoTabs = [
		{ id: 'kit', label: 'SvelteKit + enhance' },
		{ id: 'zod', label: 'Zod validation' },
		{ id: 'anatomy', label: 'Error summary' },
		{ id: 'focus', label: 'Focus target' }
	];
</script>

<DocPage name="Form" {...formDoc}>
	<Tabs items={demoTabs} ariaLabel="Form demos" defaultTab="kit">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'kit'}
					<p class="tab-note">
						The default path: omit <code>onSubmit</code> and the Form never touches the submit —
						SvelteKit's <code>use:enhance</code> (attached via <code>fromAction</code>, Svelte
						5.32+) does the work, and <code>toFormErrors</code> maps the action's zod-flattened errors
						straight into the summary. The demo is live and uses the real enhance wiring; only the server
						hop is simulated (this docs site is prerendered), running the same schema as the action below
						with ~400ms of latency. Submit it empty: the errors arrive async and the summary takes focus.
						On success, the form resets — enhance's default.
					</p>
					<Example code={kitPageCode}>
						<div class="demo-col">
							{#if kitSaved}
								<p class="success" role="status">You're signed up. See you on the tee pad.</p>
							{/if}
							<Form
								method="POST"
								errors={kitErrors}
								summaryHeadingLevel={3}
								ariaLabel="League signup"
								{@attach fromAction(enhance, () => simulateAction)}
							>
								<Stack gap="md">
									<TextInput name="player" label="Player name" />
									<TextInput name="email" label="Email" type="email" />
									<div><Button type="submit" loading={kitPending}>Sign up</Button></div>
								</Stack>
							</Form>
						</div>
					</Example>
					<p class="tab-note code-note">
						The action this demo simulates — validation lives on the server, where it belongs:
					</p>
					<CodeBlock code={kitServerCode} />
				{:else if item.id === 'zod'}
					<p class="tab-note">
						Client-side flavor of the same schema, live: <code>onSubmit</code> reads the native
						<code>FormData</code> (no bindings needed), <code>safeParse</code> validates, and
						<code>toFormErrors</code> feeds both the summary and the inline field errors from one
						array. <code>novalidate</code> makes the summary the single error surface. Submit it empty.
					</p>
					<Example code={zodCode}>
						<div class="demo-col">
							{#if zodSaved}
								<p class="success" role="status">Review posted — thanks!</p>
							{/if}
							<Form
								errors={zodErrors}
								onSubmit={handleZodSubmit}
								novalidate
								summaryHeadingLevel={3}
								ariaLabel="Round review"
							>
								<Stack gap="md">
									<TextInput name="player" label="Player name" error={zodFieldError('player')} />
									<TextInput
										name="email"
										label="Email"
										type="email"
										error={zodFieldError('email')}
									/>
									<TextInput
										name="holes"
										label="Holes played"
										type="number"
										inputmode="numeric"
										error={zodFieldError('holes')}
									/>
									<div><Button type="submit">Post review</Button></div>
								</Stack>
							</Form>
						</div>
					</Example>
				{:else if item.id === 'anatomy'}
					<p class="tab-note">
						Summary items are sorted by the fields' DOM order, not the array order — here the email
						error is listed first in the array but the name field comes first in the form. An error
						whose <code>name</code> doesn't match a field (or is empty) is a form-level error: plain text,
						listed last.
					</p>
					<Example code={anatomyCode}>
						<div class="demo-col">
							<Form errors={anatomyErrors} summaryHeadingLevel={3} ariaLabel="Summary anatomy">
								<Stack gap="md">
									<TextInput name="anatomy-player" label="Player name" error="Enter your name." />
									<TextInput
										name="anatomy-email"
										label="Email"
										type="email"
										error="Enter a valid email address."
									/>
									<div><Button type="submit" disabled>Sign up</Button></div>
								</Stack>
							</Form>
						</div>
					</Example>
				{:else}
					<p class="tab-note">
						<code>focusTarget="firstField"</code> skips the summary and puts focus straight on the first
						invalid field — a good fit for short forms where the summary would be overkill to navigate.
						Submit the empty form and watch where focus lands.
					</p>
					<Example code={focusCode}>
						<div class="demo-col">
							<Form
								errors={aceErrors}
								onSubmit={handleAceSubmit}
								focusTarget="firstField"
								summaryHeadingLevel={3}
								ariaLabel="Report an ace"
							>
								<Stack gap="md">
									<TextInput
										name="ace-hole"
										label="Hole number"
										bind:value={ace}
										required
										error={aceErrors.length > 0 ? aceErrors[0].message : undefined}
									/>
									<div><Button type="submit">Report ace</Button></div>
								</Stack>
							</Form>
						</div>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.success {
		margin: 0 0 0.75rem;
		color: var(--hz-intent-success, #15803d);
		font-weight: var(--hz-font-weight-semibold, 600);
	}
	.code-note {
		margin: 1rem 0 0.5rem;
	}
</style>
