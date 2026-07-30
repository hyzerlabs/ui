<script lang="ts">
	import { Lightbox, Tabs, lightboxGroup, Alert, Image } from '$lib';
	import type { LightboxItem } from '$lib/types';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { lightboxDoc } from '../../../../docs/data/lightbox.js';
	import Example from '../../../../docs/Example.svelte';
	import IconInfo from '$lib/icons/generated/info.svelte';

	// Inline SVG data-URIs — no committed binary assets (same convention as
	// the Image page). SVG <text> cannot wrap, so long labels are broken into
	// centered <tspan> lines on word boundaries — otherwise they run off the
	// edges and are unreadable at thumbnail sizes.
	function demoSvg(label: string, fill: string, w = 1200, h = 800): string {
		const fontSize = 48;
		const maxChars = Math.max(8, Math.floor((w - 64) / (fontSize * 0.55)));
		const lines: string[] = [];
		let line = '';
		for (const word of label.split(' ')) {
			const candidate = line ? `${line} ${word}` : word;
			if (candidate.length > maxChars && line) {
				lines.push(line);
				line = word;
			} else {
				line = candidate;
			}
		}
		if (line) lines.push(line);

		const lineHeight = fontSize * 1.25;
		const firstY = h / 2 - ((lines.length - 1) * lineHeight) / 2;
		const tspans = lines
			.map(
				(l, i) =>
					`%3Ctspan x='50%25' y='${firstY + i * lineHeight}'%3E${encodeURIComponent(l)}%3C/tspan%3E`
			)
			.join('');
		return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'%3E%3Crect width='${w}' height='${h}' fill='%23${fill}'/%3E%3Ctext dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-size='${fontSize}' font-family='system-ui'%3E${tspans}%3C/text%3E%3C/svg%3E`;
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
			// about:blank renders the empty native player, and the prerender
			// crawler does not follow it. Point src at your own clip in real use.
			src: 'about:blank',
			label: 'Demo flight video',
			thumbSrc: demoSvg('Video ▶', '0e7490', 600, 400),
			caption: 'Videos play inline via the Video component (this demo attaches no clip)'
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

	// Lightbox-R30: the `trigger` snippet swaps each strip button's face
	// for an Image-composed one — Lightbox still owns the button, the
	// aria-haspopup="dialog" name, and the click wiring.
	const triggerCode = [
		'<Lightbox items={items} class="trigger-strip">',
		'\t{#snippet trigger(item)}',
		'\t\t<Image src={item.thumbSrc ?? item.src} alt="" aspectRatio="1/1" rounded="md" fit="cover" />',
		'\t{/snippet}',
		'</Lightbox>'
	].join('\n');

	// Lightbox-R30: a plain figure grid — no thumbnail strip, no Lightbox
	// component at all. The attachment enhances the grid's own <img> media
	// directly (its normal rendered size IS the trigger surface).
	// The second photo demonstrates data-lightbox-src: its rendered src is the
	// scaled-down version, the viewer opens the full-resolution override. The
	// last figure demonstrates data-lightbox-ignore: skipped entirely (no zoom
	// cursor, no enhancement, not in the shared viewer).
	const attachmentBase: { alt: string; color: string; full?: string; ignored?: boolean }[] = [
		{ alt: 'First demo photo', color: '2563eb' },
		{
			alt: 'Second demo photo (opens the full-res override)',
			color: '7c3aed',
			full: demoSvg('Full-resolution override — via data-lightbox-src', '7c3aed', 1200, 800)
		},
		{ alt: 'Third demo photo', color: '0e7490' },
		{ alt: 'Fourth demo photo', color: 'ea580c' },
		{ alt: 'Static chart — excluded from the group', color: '6b7280', ignored: true }
	];
	const attachmentPhotos = attachmentBase.map((p) => ({
		...p,
		src: demoSvg(p.alt, p.color, 600, 400)
	}));

	const attachmentCode = [
		"import { lightboxGroup, Image } from '@hyzer-labs/ui';",
		'',
		'<div class="gallery-grid" {@attach lightboxGroup()}>',
		'\t<!-- Image spreads ...rest onto its inner img, so data-lightbox-src / -ignore -->',
		'\t<!-- pass through — the attachment sees the real <img> it enhances. -->',
		'\t<Image',
		'\t\tsrc={photo.thumb}',
		'\t\talt={photo.alt}',
		'\t\taspectRatio="1/1"',
		'\t\trounded="md"',
		'\t\tdata-lightbox-src={photo.fullRes}',
		'\t/>',
		'',
		'\t<Image src={photo.src} alt={photo.alt} aspectRatio="1/1" rounded="md" />',
		'',
		'\t<!-- opted out: no enhancement, not part of the shared viewer -->',
		'\t<Image src={chart} alt="Static chart" aspectRatio="1/1" rounded="md" data-lightbox-ignore />',
		'</div>'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Single image' },
		{ id: 'gallery', label: 'Gallery & video' },
		{ id: 'triggers', label: 'Image triggers' },
		{ id: 'attachment', label: 'Group attachment' }
	];
</script>

<DocPage name="Lightbox" {...lightboxDoc}>
	<Alert intent="info" title="Image + Lightbox">
		{#snippet icon()}<IconInfo />{/snippet}
		Image renders media; Lightbox handles viewing. Compose an
		<a href="/docs/components/image">Image</a>
		as a trigger face (see the "Image triggers" tab), or reach for the <code>lightboxGroup</code>
		attachment on the "Group attachment" tab to add click-to-view over an <code>Image</code> grid you
		already render.
	</Alert>
	<Tabs items={demoTabs} ariaLabel="Lightbox demos" defaultTab="basic">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'basic'}
					<p class="tab-note">
						Click the thumbnail and note the zoom cursor. Esc, the backdrop, and the close button
						all dismiss the viewer.
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
				{:else if item.id === 'gallery'}
					<p class="tab-note">
						With <code>items</code>, one component renders the whole strip. Each thumbnail opens the
						viewer at its own item. ArrowLeft and ArrowRight, or the controls, page through with
						wrap-around, and videos play through the <a href="/docs/components/video">Video</a>
						component. Focus returns to the thumbnail that opened the viewer.
					</p>
					<Example code={galleryCode}>
						<Lightbox items={galleryItems} class="gallery-strip" />
					</Example>
				{:else if item.id === 'triggers'}
					<p class="tab-note">
						The <code>trigger</code> snippet swaps each strip button's face.
						<code>Lightbox</code> still owns the <code>&lt;button&gt;</code>, its
						<code>aria-haspopup="dialog"</code>, its accessible name, and the click wiring. So a
						face like this <code>Image</code> should pass <code>alt=""</code>: the button is already
						named, and an empty alt keeps the decorative face out of the accessibility tree rather
						than announcing it twice.
					</p>
					<Example code={triggerCode}>
						<Lightbox items={galleryItems} class="trigger-strip">
							{#snippet trigger(item)}
								<Image
									src={item.thumbSrc ?? item.src}
									alt=""
									aspectRatio="1/1"
									rounded="md"
									fit="cover"
								/>
							{/snippet}
						</Lightbox>
					</Example>
				{:else}
					<p class="tab-note">
						<code>lightboxGroup()</code> enhances a container's own media in place: no thumbnail
						strip, and no <code>Lightbox</code> component at all. Click any photo below, or Tab to
						one and press Enter or Space, and every qualifying image in the grid opens in one shared
						viewer, starting at the photo you activated. Two escape hatches:
						<code>data-lightbox-ignore</code>
						opts an element out, so the grey chart below gets no zoom cursor and never joins the group;
						<code>data-lightbox-src</code>
						opens a full-resolution source instead of the rendered (often scaled-down)
						<code>src</code>, which is what the second photo does. Reach for the attachment to
						enhance media you already render, and for <code>Lightbox</code> when you control the
						markup and want the strongest accessibility guarantees. The
						<a href="/docs/patterns/product-detail">product detail</a> pattern shows it composed
						with
						<a href="/docs/components/carousel">Carousel</a>: the active slide is the trigger, and
						the viewer pages across every item once open.
					</p>
					<Example code={attachmentCode}>
						<div class="gallery-grid" {@attach lightboxGroup()}>
							{#each attachmentPhotos as photo (photo.alt)}
								<figure class="gallery-figure">
									<Image
										src={photo.src}
										alt={photo.alt}
										aspectRatio="1/1"
										rounded="md"
										data-lightbox-src={photo.full}
										data-lightbox-ignore={photo.ignored ? '' : undefined}
									/>
									{#if photo.ignored}
										<figcaption class="ignored-caption">
											<code>data-lightbox-ignore</code> — not part of the group
										</figcaption>
									{/if}
								</figure>
							{/each}
						</div>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.thumb-box {
		max-width: 20rem;
	}
	:global(.gallery-strip) :global(.hz-lightbox-trigger) {
		width: 10rem;
	}

	/* Gives the trigger snippet's Image faces a definite inline size so the
	   1/1 aspect-ratio box resolves (Lightbox-R30). */
	:global(.trigger-strip) :global(.hz-lightbox-trigger) {
		width: 8rem;
	}

	.ignored-caption {
		margin-top: 0.25rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
		gap: var(--hz-space-xs, 0.5rem);
	}

	.gallery-figure {
		margin: 0;
	}
</style>
