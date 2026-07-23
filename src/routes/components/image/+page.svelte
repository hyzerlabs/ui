<script lang="ts">
	import { Image, Tabs, Alert } from '$lib';
	import DocPage from '../../../docs/DocPage.svelte';
	import { imageDoc } from '../../../docs/data/image.js';
	import Example from '../../../docs/Example.svelte';

	// Inline SVG data-URIs — no committed binary assets. Real photo assets
	// coming soon.
	function demoSvg(label: string, fill: string, w = 800, h = 450): string {
		return (
			`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'%3E%3Crect width='${w}' height='${h}' fill='%23${fill}'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-size='28' font-family='system-ui'%3E` +
			encodeURIComponent(label) +
			'%3C/text%3E%3C/svg%3E'
		);
	}

	const aspectRatios = ['1/1', '4/3', '16/9', '21/9'] as const;
	const fits = ['cover', 'contain', 'fill', 'none'] as const;
	const roundedValues = [false, 'sm', 'md', 'lg', 'full'] as const;
	const placeholders = ['color', 'blur'] as const;

	function aspectCode(ratio: string): string {
		return `<Image src="/photos/course.jpg" alt="Hole 7 fairway" aspectRatio="${ratio}" />`;
	}

	function fitCode(fit: string): string {
		return fit === 'cover'
			? '<Image src="/photos/course.jpg" alt="Hole 7 fairway" aspectRatio="4/3" />'
			: `<Image src="/photos/course.jpg" alt="Hole 7 fairway" aspectRatio="4/3" fit="${fit}" />`;
	}

	function roundedCode(value: boolean | string): string {
		if (value === false)
			return '<Image src="/photos/course.jpg" alt="Hole 7 fairway" aspectRatio="1/1" />';
		return `<Image src="/photos/course.jpg" alt="Hole 7 fairway" aspectRatio="1/1" rounded="${value}" />`;
	}

	function placeholderCode(mode: string): string {
		if (mode === 'blur') {
			return [
				'<Image',
				'\tsrc="/photos/course.jpg"',
				'\talt="Hole 7 fairway"',
				'\tplaceholder="blur"',
				'\tplaceholderSrc="/photos/course-tiny.jpg"',
				'/>'
			].join('\n');
		}
		return [
			'<Image',
			'\tsrc="/photos/course.jpg"',
			'\talt="Hole 7 fairway"',
			'\tplaceholder="color"',
			'\tplaceholderColor="var(--hz-color-gray)"',
			'/>'
		].join('\n');
	}

	const pictureSources = [
		{
			srcset: demoSvg('wide source — viewport ≥ 968px', '2563eb', 800, 300),
			media: '(min-width: 968px)'
		}
	];

	const pictureCode = [
		'<Image',
		'\tsrc="/photos/course-narrow.jpg"',
		'\talt="Hole 7 fairway"',
		'\tsources={[',
		"\t\t{ srcset: '/photos/course.avif', type: 'image/avif' },",
		"\t\t{ srcset: '/photos/course-wide.jpg', media: '(min-width: 968px)' }",
		'\t]}',
		'/>'
	].join('\n');

	const demoTabs = [
		{ id: 'aspect', label: 'Aspect ratio' },
		{ id: 'fit', label: 'Fit' },
		{ id: 'rounded', label: 'Rounded' },
		{ id: 'placeholder', label: 'Placeholders' },
		{ id: 'picture', label: 'Picture sources' }
	];
</script>

<DocPage name="Image" {...imageDoc}>
	<Alert intent="info" title="Image + Lightbox">
		Image renders media, Lightbox provides viewing. <code>Image</code> has no click-to-view of its
		own — for that, pass an <code>Image</code> into a <a href="/components/lightbox">Lightbox</a>
		component's <code>trigger</code> snippet, or wire the <code>lightboxGroup</code> attachment over
		an <code>Image</code> grid you already render.
	</Alert>
	<Tabs items={demoTabs} ariaLabel="Image demos" defaultTab="aspect">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'aspect'}
					<Tabs
						items={aspectRatios.map((r) => ({ id: r.replace('/', '-'), label: r }))}
						ariaLabel="Aspect ratio value"
						defaultTab="16-9"
					>
						{#snippet panel(rItem)}
							{@const ratio = rItem.id.replace('-', '/')}
							<div class="inner-tab">
								<Example code={aspectCode(ratio)}>
									<div class="demo-box">
										<Image
											src={demoSvg(`aspectRatio="${ratio}"`, '6b7280')}
											alt="Aspect ratio {ratio} demo"
											aspectRatio={ratio}
										/>
									</div>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'fit'}
					<p class="tab-note">
						<code>fit</code> maps to <code>object-fit</code> inside the aspect-ratio box — the demo source
						is 21/9, letterboxed into a 4/3 frame so the modes differ visibly.
					</p>
					<Tabs
						items={fits.map((f) => ({ id: f, label: f }))}
						ariaLabel="Fit value"
						defaultTab="cover"
					>
						{#snippet panel(fItem)}
							<div class="inner-tab">
								<Example code={fitCode(fItem.id)}>
									<div class="demo-box">
										<Image
											src={demoSvg(`fit="${fItem.id}"`, '6b7280', 840, 360)}
											alt="Fit mode {fItem.id} demo"
											aspectRatio="4/3"
											fit={fItem.id as (typeof fits)[number]}
										/>
									</div>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'rounded'}
					<Tabs
						items={roundedValues.map((v) => ({
							id: String(v),
							label: v === false ? 'false' : String(v)
						}))}
						ariaLabel="Rounded value"
						defaultTab="md"
					>
						{#snippet panel(vItem)}
							{@const value =
								vItem.id === 'false' ? false : (vItem.id as 'sm' | 'md' | 'lg' | 'full')}
							<div class="inner-tab">
								<Example code={roundedCode(value)}>
									<div class="demo-box demo-box--square">
										<Image
											src={demoSvg(`rounded="${vItem.id}"`, '6b7280', 600, 600)}
											alt="Rounded {vItem.id} demo"
											aspectRatio="1/1"
											rounded={value}
										/>
									</div>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'placeholder'}
					<p class="tab-note">
						Placeholders fill the box while the image loads: <code>color</code> paints a flat
						swatch, <code>blur</code> crossfades from a low-res <code>placeholderSrc</code>. The
						demo SVGs load instantly, so the effect is brief — real photo assets coming soon.
					</p>
					<Tabs
						items={placeholders.map((p) => ({ id: p, label: p }))}
						ariaLabel="Placeholder mode"
						defaultTab="color"
					>
						{#snippet panel(pItem)}
							<div class="inner-tab">
								<Example code={placeholderCode(pItem.id)}>
									<div class="demo-box">
										{#if pItem.id === 'blur'}
											<Image
												src={demoSvg('Loaded image', '2563eb')}
												alt="Blur placeholder demo"
												aspectRatio="16/9"
												placeholder="blur"
												placeholderSrc={demoSvg('', '93b3f8', 80, 45)}
											/>
										{:else}
											<Image
												src={demoSvg('Loaded image', '2563eb')}
												alt="Color placeholder demo"
												aspectRatio="16/9"
												placeholder="color"
												placeholderColor="var(--hz-color-gray)"
											/>
										{/if}
									</div>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else}
					<p class="tab-note">
						<code>sources</code> renders a <code>&lt;picture&gt;</code> — the browser takes the
						first matching source, falling back to <code>src</code>. Source <code>media</code>
						conditions are <em>viewport</em> queries per the platform, so resize the window across 968px
						to watch the labeled candidates swap.
					</p>
					<Example code={pictureCode}>
						<Image
							sources={pictureSources}
							src={demoSvg('fallback source — viewport < 968px', '7c3aed', 800, 300)}
							alt="Art direction demo: the active source names itself"
							aspectRatio="8/3"
						/>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.demo-box {
		max-width: 26rem;
	}
	.demo-box--square {
		max-width: 18rem;
	}
</style>
