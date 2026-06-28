<script lang="ts">
	import { Video, Stack } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{ name: 'src', type: 'string', default: '—', description: 'Required. URL or embed URL.' },
		{ name: 'title', type: 'string', default: '—', description: 'Required for accessibility.' },
		{ name: 'aspectRatio', type: "'16/9' | '4/3' | '1/1' | '9/16'", default: "'16/9'" },
		{ name: 'autoplay', type: 'boolean', default: 'false' },
		{ name: 'muted', type: 'boolean', default: 'false' },
		{ name: 'controls', type: 'boolean', default: 'true' },
		{ name: 'loop', type: 'boolean', default: 'false' },
		{ name: 'poster', type: 'string', default: '—' },
		{ name: 'loading', type: "'lazy' | 'eager'", default: "'lazy'" }
	];

	// R12 — solid-color poster data URI, no committed binary assets
	const posterDataUri =
		"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%236b7280'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='24' font-family='system-ui'%3EVideo placeholder%3C/text%3E%3C/svg%3E";

	// Blank native video source — demonstrates native player UI
	const blankSrc = 'about:blank';
</script>

<DocPage
	name="Video"
	description="Video player supporting YouTube, Vimeo embeds, and native HTML5 video. Detects provider from URL and builds the correct embed."
	importLine={'import {Video} from "@hyzer-labs/ui"'}
	{props}
	a11yNote="The title prop is required and maps to the iframe title or video aria-label. Autoplay requires muted=true (both browser policy and a11y consideration)."
>
	<Stack gap="lg">
		<div>
			<h3>Native video (with poster placeholder)</h3>
			<p class="hint">No source provided — shows native controls with solid-color poster.</p>
			<Video
				src={blankSrc}
				title="Demo video placeholder"
				aspectRatio="16/9"
				controls
				poster={posterDataUri}
			/>
		</div>

		<div>
			<h3>Aspect ratio variants</h3>
			<div class="aspect-grid">
				{#each ['16/9', '4/3', '1/1'] as ratio (ratio)}
					<div>
						<Video
							src={blankSrc}
							title="Aspect ratio {ratio} demo"
							aspectRatio={ratio}
							poster={posterDataUri}
						/>
						<code class="label">{ratio}</code>
					</div>
				{/each}
			</div>
		</div>

		<p class="deferred-note">
			<strong>Note:</strong> Real-asset demos (actual video URLs) are deferred — demo assets coming soon.
		</p>
	</Stack>
</DocPage>

<style>
	h3 {
		margin: 0 0 0.25rem;
		font-size: var(--hz-font-size-base, 1rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}
	p {
		margin: 0;
	}
	.hint {
		margin-bottom: 0.5rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
	.aspect-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
		gap: 1rem;
	}
	.label {
		display: block;
		margin-top: 0.25rem;
		font-family: var(--hz-font-family-mono, monospace);
		font-size: var(--hz-font-size-xs, 0.75rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
	.deferred-note {
		padding: 0.75rem 1rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		font-size: var(--hz-font-size-sm, 0.875rem);
	}
</style>
