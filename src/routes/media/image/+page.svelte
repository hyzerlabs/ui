<script lang="ts">
	import { Image, Grid, Stack } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'src', type: 'string', default: '—', description: 'Required.' },
		{
			name: 'alt',
			type: 'string',
			default: '—',
			description: 'Required. Empty string for decorative.'
		},
		{ name: 'width', type: 'number', default: '—' },
		{ name: 'height', type: 'number', default: '—' },
		{ name: 'loading', type: "'lazy' | 'eager'", default: "'lazy'" },
		{
			name: 'aspectRatio',
			type: "'auto' | '1/1' | '4/3' | '16/9' | '21/9' | string",
			default: "'auto'"
		},
		{ name: 'fit', type: "'cover' | 'contain' | 'fill' | 'none'", default: "'cover'" },
		{ name: 'rounded', type: "boolean | 'sm' | 'md' | 'lg' | 'full'", default: 'false' },
		{ name: 'placeholder', type: "'blur' | 'color' | 'none'", default: "'none'" },
		{ name: 'placeholderColor', type: 'string', default: "'var(--hz-color-gray)'" }
	];

	// R12 — inline SVG data-URI placeholder (no committed binary assets)
	const placeholderSvg =
		"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%236b7280'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-size='24' font-family='system-ui'%3EImage placeholder%3C/text%3E%3C/svg%3E";
</script>

<DocPage
	name="Image"
	description="Responsive image with aspect-ratio, object-fit, rounded corners, and color/blur placeholder states."
	importLine={'import {Image} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="Pass a descriptive alt text for informative images. Pass alt='' for decorative images — the component sets role='presentation' automatically."
>
	<Stack gap="lg">
		<div>
			<h3>Aspect ratio variants</h3>
			<!-- R12: uses placeholder="color" — no real asset needed -->
			<Grid columns={{ sm: 1, md: 3 }} gap="md">
				{#each ['1/1', '4/3', '16/9'] as ratio (ratio)}
					<div>
						<Image
							src={placeholderSvg}
							alt="Demo image {ratio} aspect ratio"
							aspectRatio={ratio}
							placeholder="color"
							placeholderColor="var(--hz-color-gray)"
						/>
						<code class="label">{ratio}</code>
					</div>
				{/each}
			</Grid>
		</div>

		<div>
			<h3>Rounded corners</h3>
			<Grid columns={{ sm: 2, md: 4 }} gap="md">
				{#each [false, 'sm', 'md', 'lg', 'full'] as const as rounded (String(rounded))}
					<div>
						<Image
							src={placeholderSvg}
							alt="Rounded {rounded} demo"
							aspectRatio="1/1"
							{rounded}
							placeholder="color"
						/>
						<code class="label">{rounded === false ? 'false' : rounded}</code>
					</div>
				{/each}
			</Grid>
		</div>

		<div>
			<h3>Object-fit modes</h3>
			<Grid columns={{ sm: 2, md: 4 }} gap="md">
				{#each ['cover', 'contain', 'fill', 'none'] as const as fit (fit)}
					<div>
						<Image
							src={placeholderSvg}
							alt="Fit mode {fit}"
							aspectRatio="4/3"
							{fit}
							placeholder="color"
						/>
						<code class="label">fit="{fit}"</code>
					</div>
				{/each}
			</Grid>
		</div>

		<p class="deferred-note">
			<strong>Note:</strong> Real-asset demos (photos, blur placeholder) are deferred — demo assets coming
			soon.
		</p>
	</Stack>
</DocPage>

<style>
	h3 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-base, 1rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}
	.label {
		display: block;
		margin-top: 0.25rem;
		font-family: var(--hz-font-family-mono, monospace);
		font-size: var(--hz-font-size-xs, 0.75rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
	.deferred-note {
		margin: 0;
		padding: 0.75rem 1rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
</style>
