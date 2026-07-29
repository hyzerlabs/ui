<script lang="ts">
	import { FileUpload, Tabs, Stack, Grid, Form, Button } from '$lib';
	import type { FileRejection } from '$lib/types';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { fileUploadDoc } from '../../../../docs/data/file-upload.js';
	import Example from '../../../../docs/Example.svelte';

	// -----------------------------------------------------------------
	// Basic single
	// -----------------------------------------------------------------
	let singleFile = $state<File[]>([]);

	const basicSingleCode = [
		'let file = $state<File[]>([]);',
		'',
		'<FileUpload name="resume" label="Resume" bind:files={file} />'
	].join('\n');

	// -----------------------------------------------------------------
	// Basic multiple, removable list
	// -----------------------------------------------------------------
	let multipleFiles = $state<File[]>([]);

	const basicMultipleCode = [
		'let files = $state<File[]>([]);',
		'',
		'<FileUpload name="photos" label="Photos" multiple bind:files={files} />'
	].join('\n');

	// -----------------------------------------------------------------
	// Dropzone
	// -----------------------------------------------------------------
	let dropzoneFiles = $state<File[]>([]);

	const dropzoneCode = [
		'let files = $state<File[]>([]);',
		'',
		'<FileUpload name="attachments" label="Attachments" dropzone multiple bind:files={files} />'
	].join('\n');

	// -----------------------------------------------------------------
	// Validation — accept + maxSize + maxFiles, mapping onreject into error
	// (consumer-owned validation posture).
	// -----------------------------------------------------------------
	let validatedFiles = $state<File[]>([]);
	let validationError = $state('');

	function onValidationReject(rejections: FileRejection[]) {
		validationError = rejections.map((r) => r.message).join(' ');
	}

	function onValidationChange() {
		validationError = '';
	}

	const validationCode = [
		'let files = $state<File[]>([]);',
		"let error = $state('');",
		'',
		'function onreject(rejections: FileRejection[]) {',
		"\terror = rejections.map((r) => r.message).join(' ');",
		'}',
		'',
		'<FileUpload',
		'\tname="images"',
		'\tlabel="Images (max 3, 1 MB each)"',
		'\tmultiple',
		'\taccept="image/*"',
		'\tmaxSize={1_000_000}',
		'\tmaxFiles={3}',
		'\tbind:files={files}',
		'\t{error}',
		'\t{onreject}',
		'\tonchange={() => (error = "")}',
		'/>'
	].join('\n');

	// -----------------------------------------------------------------
	// Form submission — FormData.getAll
	// -----------------------------------------------------------------
	let submissionFiles = $state<File[]>([]);
	let submittedNames = $state<string[]>([]);

	function onSubmissionSubmit(e: SubmitEvent) {
		const data = new FormData(e.currentTarget as HTMLFormElement);
		submittedNames = data.getAll('attachments-demo').map((v) => (v as File).name);
	}

	const submissionCode = [
		"import { Form, FileUpload, Button, Stack } from '@hyzer-labs/ui';",
		'',
		'<Form onSubmit={handleSubmit} ariaLabel="Attachments upload">',
		'\t<Stack gap="md">',
		'\t\t<FileUpload name="attachments-demo" label="Attachments" multiple bind:files={files} />',
		'\t\t<div><Button type="submit">Submit</Button></div>',
		'\t</Stack>',
		'</Form>',
		'',
		'// handleSubmit reads: new FormData(form).getAll("attachments-demo")'
	].join('\n');

	// -----------------------------------------------------------------
	// States
	// -----------------------------------------------------------------
	const statesCode = [
		'<!-- basic -->',
		'<FileUpload',
		'\tname="cert"',
		'\tlabel="Certificate"',
		'\tdescription="PDF preferred; images are also accepted."',
		'/>',
		'<FileUpload name="cert-error" label="Certificate" error="A file is required." />',
		'<FileUpload name="cert-required" label="Certificate" required />',
		'<FileUpload name="cert-disabled" label="Certificate" disabled />',
		'',
		'<!-- dropzone — same states, side by side -->',
		'<FileUpload',
		'\tname="cert-dz"',
		'\tlabel="Certificate"',
		'\tdropzone',
		'\tdescription="PDF preferred; images are also accepted."',
		'/>',
		'<FileUpload name="cert-error-dz" label="Certificate" dropzone error="A file is required." />',
		'<FileUpload name="cert-required-dz" label="Certificate" dropzone required />',
		'<FileUpload name="cert-disabled-dz" label="Certificate" dropzone disabled />'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'multiple', label: 'Multiple' },
		{ id: 'dropzone', label: 'Dropzone' },
		{ id: 'validation', label: 'Validation' },
		{ id: 'submission', label: 'Form submission' },
		{ id: 'states', label: 'Description & states' }
	];
</script>

<DocPage name="FileUpload" {...fileUploadDoc}>
	<Tabs items={demoTabs} ariaLabel="FileUpload demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<p class="tab-note">
						Single-file mode: an accepted pick <strong>replaces</strong> the current selection.
					</p>
					<Example code={basicSingleCode}>
						<div class="demo-col">
							<FileUpload name="resume-demo" label="Resume" bind:files={singleFile} />
						</div>
					</Example>
				{:else if item.id === 'multiple'}
					<p class="tab-note">
						<code>multiple</code> appends each accepted pick to the existing selection (de-duplicated
						by name + size + modified date) and renders a removable list with human-readable sizes.
					</p>
					<Example code={basicMultipleCode}>
						<div class="demo-col">
							<FileUpload name="photos-demo" label="Photos" multiple bind:files={multipleFiles} />
						</div>
					</Example>
				{:else if item.id === 'dropzone'}
					<p class="tab-note">
						The <code>dropzone</code> prop swaps the visible input for a drag-and-drop surface. The
						native input is still the submission source of truth — dropped files reach it via a
						rebuilt <code>DataTransfer</code>. The real <code>Browse files</code> button is always present
						as the non-drag alternative.
					</p>
					<Example code={dropzoneCode}>
						<div class="demo-col">
							<FileUpload
								name="attachments-dz-demo"
								label="Attachments"
								dropzone
								multiple
								bind:files={dropzoneFiles}
							/>
						</div>
					</Example>
				{:else if item.id === 'validation'}
					<p class="tab-note">
						<code>accept</code>, <code>maxSize</code>, and <code>maxFiles</code> filter and report —
						they don't self-set the field <code>error</code>. This demo maps <code>onreject</code>
						into the <code>error</code> string itself, and clears it on the next accepted change.
					</p>
					<Example code={validationCode}>
						<div class="demo-col">
							<FileUpload
								name="images-demo"
								label="Images (max 3, 1 MB each)"
								multiple
								accept="image/*"
								maxSize={1_000_000}
								maxFiles={3}
								bind:files={validatedFiles}
								error={validationError}
								onreject={onValidationReject}
								onchange={onValidationChange}
							/>
						</div>
					</Example>
				{:else if item.id === 'submission'}
					<p class="tab-note">
						The real named input carries the selected files into a plain form submission —
						<code>new FormData(form).getAll(name)</code> returns exactly the selected files, in order.
					</p>
					<Example code={submissionCode}>
						<div class="demo-col">
							<Form onSubmit={onSubmissionSubmit} ariaLabel="Attachments upload">
								<Stack gap="sm">
									<FileUpload
										name="attachments-demo"
										label="Attachments"
										multiple
										bind:files={submissionFiles}
									/>
									<div><Button type="submit">Submit</Button></div>
								</Stack>
							</Form>
							{#if submittedNames.length > 0}
								<p class="tab-note">
									FormData.getAll("attachments-demo") → {submittedNames.join(', ')}
								</p>
							{/if}
						</div>
					</Example>
				{:else}
					<p class="tab-note">
						<code>description</code> and <code>error</code> chain into
						<code>aria-describedby</code>.
						<code>required</code> sets <code>aria-required</code> and the visual asterisk only —
						enforcement is the consumer's / <code>Form</code>'s job, since the field never applies a
						native
						<code>required</code> attribute (a visually-hidden required input in dropzone mode would
						be unfocusable). <code>disabled</code> applies native <code>disabled</code> to the input and
						the activation button and drops remove buttons from the list.
					</p>
					<Example code={statesCode}>
						<div class="demo-wide">
							<Stack gap="lg">
								<div class="state-row">
									<p class="state-row-label">Description</p>
									<Grid columns={{ sm: 1, md: 2 }} gap="md">
										<div>
											<p class="state-col-label">Basic</p>
											<FileUpload
												name="cert-demo"
												label="Certificate"
												description="PDF preferred; images are also accepted."
											/>
										</div>
										<div>
											<p class="state-col-label">Dropzone</p>
											<FileUpload
												name="cert-demo-dz"
												label="Certificate"
												dropzone
												description="PDF preferred; images are also accepted."
											/>
										</div>
									</Grid>
								</div>
								<div class="state-row">
									<p class="state-row-label">Error</p>
									<Grid columns={{ sm: 1, md: 2 }} gap="md">
										<div>
											<p class="state-col-label">Basic</p>
											<FileUpload
												name="cert-error-demo"
												label="Certificate"
												error="A file is required."
											/>
										</div>
										<div>
											<p class="state-col-label">Dropzone</p>
											<FileUpload
												name="cert-error-demo-dz"
												label="Certificate"
												dropzone
												error="A file is required."
											/>
										</div>
									</Grid>
								</div>
								<div class="state-row">
									<p class="state-row-label">Required</p>
									<Grid columns={{ sm: 1, md: 2 }} gap="md">
										<div>
											<p class="state-col-label">Basic</p>
											<FileUpload name="cert-required-demo" label="Certificate" required />
										</div>
										<div>
											<p class="state-col-label">Dropzone</p>
											<FileUpload
												name="cert-required-demo-dz"
												label="Certificate"
												dropzone
												required
											/>
										</div>
									</Grid>
								</div>
								<div class="state-row">
									<p class="state-row-label">Disabled</p>
									<Grid columns={{ sm: 1, md: 2 }} gap="md">
										<div>
											<p class="state-col-label">Basic</p>
											<FileUpload name="cert-disabled-demo" label="Certificate" disabled />
										</div>
										<div>
											<p class="state-col-label">Dropzone</p>
											<FileUpload
												name="cert-disabled-demo-dz"
												label="Certificate"
												dropzone
												disabled
											/>
										</div>
									</Grid>
								</div>
							</Stack>
						</div>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.demo-wide {
		max-width: 40rem;
	}

	.state-row-label {
		margin: 0 0 0.5rem;
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.state-col-label {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
