<script lang="ts">
	import { Video, Tabs } from '$lib';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { videoDoc } from '../../../../docs/data/video.js';
	import Example from '../../../../docs/Example.svelte';

	// Solid-color poster data URI — real video assets coming soon; the blank
	// native source still renders the player chrome and the aspect box.
	function posterSvg(label: string): string {
		return (
			"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%236b7280'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='24' font-family='system-ui'%3E" +
			encodeURIComponent(label) +
			'%3C/text%3E%3C/svg%3E'
		);
	}
	const blankSrc = 'about:blank';

	const aspectRatios = ['16/9', '4/3', '1/1', '9/16'] as const;

	function aspectCode(ratio: string): string {
		return ratio === '16/9'
			? '<Video src="/media/round-recap.mp4" title="Round recap" />'
			: `<Video src="/media/round-recap.mp4" title="Round recap" aspectRatio="${ratio}" />`;
	}

	const providersCode = [
		'<!-- Provider is detected from the URL -->',
		'<Video src="https://www.youtube.com/watch?v=VIDEO_ID" title="Course flyover" />',
		'<Video src="https://vimeo.com/123456789" title="Form check" />',
		'<Video src="/media/round-recap.mp4" poster="/media/recap-poster.jpg" title="Round recap" />'
	].join('\n');

	const posterCode = [
		'<Video',
		'\tsrc="/media/round-recap.mp4"',
		'\tposter="/media/recap-poster.jpg"',
		'\ttitle="Round recap"',
		'/>'
	].join('\n');

	const demoTabs = [
		{ id: 'aspect', label: 'Aspect ratio' },
		{ id: 'providers', label: 'Providers' },
		{ id: 'poster', label: 'Poster' }
	];
</script>

<DocPage name="Video" {...videoDoc}>
	<Tabs items={demoTabs} ariaLabel="Video demos" defaultTab="aspect">
		{#snippet panel(item)}
			<div class="tab-content">
				{#if item.id === 'aspect'}
					<p class="tab-note">
						Demos use a blank native source with an SVG poster — real clips coming soon. The aspect
						box is the component's; posters and embeds fill it.
					</p>
					<Tabs
						items={aspectRatios.map((r) => ({ id: r.replace('/', '-'), label: r }))}
						ariaLabel="Aspect ratio value"
						defaultTab="16-9"
					>
						{#snippet panel(rItem)}
							{@const ratio = rItem.id.replace('-', '/') as (typeof aspectRatios)[number]}
							<div class="inner-tab">
								<Example code={aspectCode(ratio)}>
									<div class={ratio === '9/16' ? 'demo-box demo-box--tall' : 'demo-box'}>
										<Video
											src={blankSrc}
											title="Aspect ratio {ratio} demo"
											aspectRatio={ratio}
											poster={posterSvg(`aspectRatio="${ratio}"`)}
										/>
									</div>
								</Example>
							</div>
						{/snippet}
					</Tabs>
				{:else if item.id === 'providers'}
					<p class="tab-note">
						One prop, three players: YouTube and Vimeo URLs become privacy-friendly iframes with the
						correct allow/referrer policies; anything else renders a native
						<code>&lt;video&gt;</code>. The demo below is the native player (embed demos land with
						the real assets). <a href="/docs/components/lightbox">Lightbox</a> plays every video item
						it shows through this component.
					</p>
					<Example code={providersCode}>
						<div class="demo-box">
							<Video
								src={blankSrc}
								title="Native provider demo"
								poster={posterSvg('native <video> — controls on')}
							/>
						</div>
					</Example>
				{:else}
					<p class="tab-note">
						<code>poster</code> shows before playback starts (native provider only — embeds bring their
						own thumbnails).
					</p>
					<Example code={posterCode}>
						<div class="demo-box">
							<Video src={blankSrc} title="Poster demo" poster={posterSvg('poster frame')} />
						</div>
					</Example>
				{/if}
			</div>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	.demo-box {
		max-width: 28rem;
	}
	.demo-box--tall {
		max-width: 14rem;
	}
</style>
