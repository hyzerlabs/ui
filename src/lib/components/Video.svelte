<script lang="ts">
	import { untrack } from 'svelte';
	import { browser } from '$app/environment';
	import { cx } from '$lib/utils';

	type AspectRatio = '16/9' | '4/3' | '1/1' | '9/16';
	type Provider = 'youtube' | 'vimeo' | 'native';
	type VideoState = 'idle' | 'playing' | 'paused' | 'ended';

	interface Props {
		src: string;
		title: string;
		aspectRatio?: AspectRatio;
		autoplay?: boolean;
		muted?: boolean;
		controls?: boolean;
		loop?: boolean;
		poster?: string;
		loading?: 'lazy' | 'eager';
		class?: string;
		[key: string]: unknown;
	}

	let {
		src,
		title,
		aspectRatio = '16/9',
		autoplay = false,
		muted = false,
		controls = true,
		loop = false,
		poster,
		loading = 'lazy',
		class: className,
		...rest
	}: Props = $props();

	// VID-R6: autoplay w/o muted → suppress + dev warn
	if (import.meta.env.DEV) {
		if (untrack(() => autoplay && !muted)) {
			console.warn(
				'[hyzer-ui] <Video>: autoplay requires muted=true. ' +
					'Autoplay has been suppressed. Set muted={true} to enable autoplay.'
			);
		}
	}

	// VID-R6: reduced-motion gating
	const reducedMotion = $derived(
		browser ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
	);

	// VID-R6: autoplay is only permitted when autoplay+muted+!reducedMotion
	const autoplayPermitted = $derived(autoplay && muted && !reducedMotion);

	// ---------------------------------------------------------------------------
	// VID-R1 — Provider detection helpers
	// ---------------------------------------------------------------------------

	/** Extract YouTube video ID from known YouTube URL patterns. */
	function extractYouTubeId(url: string): string | null {
		try {
			const u = new URL(url);
			const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
			if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
				if (u.pathname.startsWith('/embed/')) {
					const id = u.pathname.split('/embed/')[1]?.split('/')[0]?.split('?')[0];
					return id || null;
				}
				const v = u.searchParams.get('v');
				return v || null;
			}
			if (host === 'youtu.be') {
				const id = u.pathname.slice(1).split('/')[0]?.split('?')[0];
				return id || null;
			}
		} catch {
			// not a valid URL
		}
		return null;
	}

	/** Extract Vimeo video ID from known Vimeo URL patterns. */
	function extractVimeoId(url: string): string | null {
		try {
			const u = new URL(url);
			const host = u.hostname.replace(/^www\./, '');
			if (host === 'vimeo.com') {
				const id = u.pathname.slice(1).split('/')[0]?.split('?')[0];
				return /^\d+$/.test(id ?? '') ? (id ?? null) : null;
			}
			if (host === 'player.vimeo.com') {
				const parts = u.pathname.split('/');
				const idx = parts.indexOf('video');
				const id = idx >= 0 ? parts[idx + 1]?.split('?')[0] : undefined;
				return id && /^\d+$/.test(id) ? id : null;
			}
		} catch {
			// not a valid URL
		}
		return null;
	}

	/** Returns true when URL belongs to a YouTube host (regardless of ID presence). */
	function isYouTubeHost(url: string): boolean {
		try {
			const u = new URL(url);
			const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
			return host === 'youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com';
		} catch {
			return false;
		}
	}

	/** Returns true when URL belongs to a Vimeo host (regardless of ID presence). */
	function isVimeoHost(url: string): boolean {
		try {
			const u = new URL(url);
			const host = u.hostname.replace(/^www\./, '');
			return host === 'vimeo.com' || host === 'player.vimeo.com';
		} catch {
			return false;
		}
	}

	const youtubeId = $derived(extractYouTubeId(src));
	const vimeoId = $derived(extractVimeoId(src));

	// VID-R1: provider detection; warn on host-match but no parseable ID
	const provider = $derived.by((): Provider => {
		if (isYouTubeHost(src)) {
			if (youtubeId) return 'youtube';
			// Host matched but no ID extractable
			if (import.meta.env.DEV) {
				console.warn(
					'[hyzer-ui] <Video>: YouTube URL detected but no video ID could be extracted. ' +
						'Falling back to native provider.'
				);
			}
			return 'native';
		}
		if (isVimeoHost(src)) {
			if (vimeoId) return 'vimeo';
			if (import.meta.env.DEV) {
				console.warn(
					'[hyzer-ui] <Video>: Vimeo URL detected but no video ID could be extracted. ' +
						'Falling back to native provider.'
				);
			}
			return 'native';
		}
		return 'native';
	});

	// ---------------------------------------------------------------------------
	// VID-R2 — YouTube embed URL
	// ---------------------------------------------------------------------------
	const youtubeEmbedSrc = $derived.by((): string => {
		const id = youtubeId ?? '';
		const parts: string[] = [];
		if (autoplayPermitted) {
			parts.push('autoplay=1', 'mute=1');
		}
		if (loop) {
			parts.push('loop=1', `playlist=${id}`);
		}
		if (!controls) {
			parts.push('controls=0');
		}
		const qs = parts.join('&');
		return `https://www.youtube-nocookie.com/embed/${id}${qs ? '?' + qs : ''}`;
	});

	// ---------------------------------------------------------------------------
	// VID-R3 — Vimeo embed URL
	// ---------------------------------------------------------------------------
	const vimeoEmbedSrc = $derived.by((): string => {
		const id = vimeoId ?? '';
		const parts: string[] = ['dnt=1'];
		if (autoplayPermitted) {
			parts.push('autoplay=1', 'muted=1');
		}
		if (loop) {
			parts.push('loop=1');
		}
		if (!controls) {
			parts.push('controls=0');
		}
		return `https://player.vimeo.com/video/${id}?${parts.join('&')}`;
	});

	// ---------------------------------------------------------------------------
	// VID-R4 — Native preload mapping: lazy→"none", eager→"metadata"
	// ---------------------------------------------------------------------------
	const nativePreload = $derived(loading === 'eager' ? 'metadata' : 'none');

	// ---------------------------------------------------------------------------
	// VID-R8 — Native state machine
	// ---------------------------------------------------------------------------
	let videoState = $state<VideoState>('idle');

	function onPlay() {
		videoState = 'playing';
	}
	function onPause() {
		videoState = 'paused';
	}
	function onEnded() {
		videoState = 'ended';
	}
</script>

<!--
	VID-R10: cx('hz-video', className) on wrapper; hz-video first.
	VID-R1: data-provider and data-aspect-ratio on wrapper.
	VID-R7: aspect-ratio applied as inline style.
-->
<div
	class={cx('hz-video', className)}
	data-provider={provider}
	data-aspect-ratio={aspectRatio}
	data-state={videoState}
	style="aspect-ratio: {aspectRatio}"
>
	{#if provider === 'youtube'}
		<!-- VID-R2: YouTube iframe — ...rest first so managed attrs win -->
		<iframe
			{...rest}
			class="hz-video__el"
			src={youtubeEmbedSrc}
			{title}
			{loading}
			allow="autoplay; fullscreen; picture-in-picture"
			allowfullscreen
		></iframe>
	{:else if provider === 'vimeo'}
		<!-- VID-R3: Vimeo iframe — ...rest first so managed attrs win -->
		<iframe
			{...rest}
			class="hz-video__el"
			src={vimeoEmbedSrc}
			{title}
			{loading}
			allow="autoplay; fullscreen; picture-in-picture"
			allowfullscreen
		></iframe>
	{:else}
		<!--
			VID-R4: native <video> — ...rest first so managed attrs win.
			muted/autoplay use boolean true/undefined pattern; Svelte 5 maps
			undefined → attribute absent, true → attribute present.
		-->
		<video
			{...rest}
			class="hz-video__el"
			aria-label={title}
			controls={controls ? true : undefined}
			loop={loop ? true : undefined}
			muted={muted ? true : undefined}
			autoplay={autoplayPermitted ? true : undefined}
			{poster}
			playsinline
			preload={nativePreload}
			onplay={onPlay}
			onpause={onPause}
			onended={onEnded}
		>
			<source {src} />
		</video>
	{/if}
</div>

<style>
	/* VID-R7: wrapper is a positioned block that fills its parent */
	.hz-video {
		display: block;
		width: 100%;
		position: relative;
	}

	/* VID-R7: inner iframe/video fills the aspect-ratio box */
	.hz-video__el {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: none;
	}
</style>
