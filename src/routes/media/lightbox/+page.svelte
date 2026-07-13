<script lang="ts">
	import { Lightbox, Tabs } from '$lib';
	import type { LightboxItem } from '$lib/types';
	import DocPage from '../../../docs/DocPage.svelte';
	import Example from '../../../docs/Example.svelte';
	import type { PropRow } from '../../../docs/PropsTable.svelte';

	const props: PropRow[] = [
		{
			name: 'items',
			type: 'LightboxItem[]',
			default: '—',
			note: 'Media entries (images and videos) — see LightboxItem below. Renders one thumbnail trigger per item; the viewer pages through them with a Carousel.'
		},
		{
			name: 'src / alt / thumbSrc / caption',
			type: 'string',
			default: '—',
			note: 'Single-image sugar — equivalent to a one-item items array.'
		},
		{ name: 'open', type: 'boolean (bindable)', default: 'false' },
		{
			name: 'dialogLabel',
			type: 'string',
			default: "'Media viewer'",
			note: 'Dialog name in multi-item mode (single items are labelled by their own name).'
		},
		{ name: 'triggerLabel', type: 'string', default: "'View larger: {name}'", note: 'Single trigger only.' },
		{ name: 'closeLabel', type: 'string', default: "'Close media viewer'" },
		{ name: 'prevLabel', type: 'string', default: "'Previous item'" },
		{ name: 'nextLabel', type: 'string', default: "'Next item'" },
		{ name: 'onclose', type: '() => void', default: '—', note: 'Fires once per dismissal.' },
		{
			name: 'children',
			type: 'Snippet',
			default: '—',
			note: 'Custom trigger content — replaces the thumbnail strip; opens the first item.'
		},
		{
			name: 'class',
			type: 'string',
			default: '—',
			note: 'Merged after the hz-lightbox-triggers class (the inline strip).'
		}
	];

	const imageItemType: PropRow[] = [
		{ name: 'type', type: "'image'", default: "'image'", note: 'Optional — image is the default.' },
		{ name: 'src', type: 'string', default: '—', note: 'Required. Full-size image.' },
		{ name: 'alt', type: 'string', default: '—', note: 'Required.' },
		{ name: 'thumbSrc', type: 'string', default: '—', note: 'Strip thumbnail; defaults to src.' },
		{ name: 'caption', type: 'string', default: '—' }
	];

	const videoItemType: PropRow[] = [
		{ name: 'type', type: "'video'", default: '—', note: 'Required for videos.' },
		{ name: 'src', type: 'string', default: '—', note: 'Required. Native file or YouTube/Vimeo URL — plays via the Video component.' },
		{ name: 'label', type: 'string', default: '—', note: 'Required. Accessible name (the Video title).' },
		{ name: 'poster', type: 'string', default: '—' },
		{ name: 'thumbSrc', type: 'string', default: '—', note: 'Strip thumbnail; defaults to poster.' },
		{ name: 'caption', type: 'string', default: '—' }
	];

	// Inline SVG data-URIs — no committed binary assets (same convention as
	// the Image page).
	function demoSvg(label: string, fill: string, w = 1200, h = 800): string {
		return (
			`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'%3E%3Crect width='${w}' height='${h}' fill='%23${fill}'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-size='48' font-family='system-ui'%3E` +
			encodeURIComponent(label) +
			'%3C/text%3E%3C/svg%3E'
		);
	}

	const galleryItems: LightboxItem[] = [
		{
			src: demoSvg('Photo 1 of 3 — arrows page the viewer', '2563eb'),
			thumbSrc: demoSvg('Photo 1', '2563eb', 600, 400),
			alt: 'First demo photo',
			caption: 'Arrow keys work anywhere in the viewer'
		},
		{
			src: demoSvg('Photo 2 of 3', '7c3aed'),
			thumbSrc: demoSvg('Photo 2', '7c3aed', 600, 400),
			alt: 'Second demo photo'
		},
		{
			type: 'video',
			// about:blank renders the empty native player (and isn't followed
			// by the prerender crawler) until real demo assets land.
			src: 'about:blank',
			label: 'Demo flight video',
			thumbSrc: demoSvg('Video ▶', '0891b2', 600, 400),
			caption: 'Videos play inline via the Video component (placeholder clip)'
		}
	];

	const basicCode = [
		'<Lightbox',
		'\tsrc="/photos/hole-7.jpg"',
		'\tthumbSrc="/photos/hole-7-thumb.jpg"',
		'\talt="Hole 7 fairway at sunset"',
		'\tcaption="Hole 7, sunset round"',
		'/>'
	].join('\n');

	const galleryCode = [
		'const items: LightboxItem[] = [',
		"\t{ src: '/photos/hole-7.jpg', thumbSrc: '/photos/hole-7-thumb.jpg', alt: 'Hole 7 fairway' },",
		"\t{ src: '/photos/putt.jpg', alt: 'Winning putt' },",
		'\t{',
		"\t\ttype: 'video',",
		"\t\tsrc: 'https://www.youtube.com/watch?v=…',",
		"\t\tlabel: 'Final round highlights',",
		"\t\tthumbSrc: '/photos/video-thumb.jpg'",
		'\t}',
		'];',
		'',
		'<Lightbox {items} />'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Single image' },
		{ id: 'gallery', label: 'Gallery & video' }
	];
</script>

<DocPage
	name="Lightbox"
	description="Click-to-enlarge media viewer: a thumbnail strip whose items open in an accessible, focus-trapped dialog — multiple images and videos page through an embedded Carousel."
	importLine={'import {Lightbox} from "@hyzer-labs/ui"'}
	{props}
	types={[
		{ name: 'LightboxItem (image)', props: imageItemType },
		{ name: 'LightboxItem (video)', props: videoItemType }
	]}
	a11yNote="Each thumbnail is a real `<button>` with `aria-haspopup=&quot;dialog&quot;` named by its item. The viewer is a native `<dialog>` opened with `showModal()` — focus is trapped, Escape always closes, the backdrop closes, and focus returns to the thumbnail that opened it. Multi-item viewers embed the Carousel (labelled slides, live announcements) and ArrowLeft/ArrowRight page from anywhere in the dialog. Body scroll is locked while open."
>
	<Tabs items={demoTabs} ariaLabel="Lightbox demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<p class="tab-note">
						Click the thumbnail (note the zoom cursor) — Esc, the backdrop, or the close button
						dismiss the viewer.
					</p>
					<Example code={basicCode}>
						<div class="thumb-box">
							<Lightbox
								src={demoSvg('Full-size image — Esc or backdrop closes', '2563eb')}
								thumbSrc={demoSvg('Thumbnail — click to enlarge', '2563eb', 600, 400)}
								alt="Demo image"
								caption="Hole 7, sunset round"
							/>
						</div>
					</Example>
				{:else}
					<p class="tab-note">
						With <code>items</code>, one component renders the whole strip; each thumbnail opens
						the viewer at its item, ArrowLeft/ArrowRight (or the controls) page through with
						wrap-around, and videos play via the Video component. Focus returns to the thumbnail
						that opened the viewer.
					</p>
					<Example code={galleryCode}>
						<Lightbox items={galleryItems} class="gallery-strip" />
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.tab-content {
		padding-top: 1rem;
	}
	.tab-note {
		margin: 0 0 1rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
	.tab-note code {
		font-family: var(--hz-font-family-mono, monospace);
	}
	.thumb-box {
		max-width: 20rem;
	}
	:global(.gallery-strip) :global(.hz-lightbox-trigger) {
		width: 10rem;
	}
</style>
