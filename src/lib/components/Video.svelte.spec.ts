import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Video from './Video.svelte';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wait one microtask so Svelte flushes pending state updates. */
function tick(): Promise<void> {
	return new Promise((r) => setTimeout(r, 0));
}

// ---------------------------------------------------------------------------
// VID-R1 — Provider detection
// ---------------------------------------------------------------------------

describe('VID-R1 — provider detection', () => {
	it.each([
		['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'iframe'],
		['https://youtu.be/dQw4w9WgXcQ', 'youtube', 'iframe'],
		['https://www.youtube.com/embed/dQw4w9WgXcQ', 'youtube', 'iframe'],
		['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'iframe'],
		['https://vimeo.com/123456789', 'vimeo', 'iframe'],
		['https://player.vimeo.com/video/123456789', 'vimeo', 'iframe'],
		['https://cdn.example.com/video.mp4', 'native', 'video']
	])('src="%s" → data-provider="%s", renders <%s>', async (src, expectedProvider, expectedTag) => {
		const { container } = render(Video, { src, title: 'Test video' });
		const wrapper = container.querySelector('div.hz-video') as HTMLElement;
		expect(wrapper.getAttribute('data-provider')).toBe(expectedProvider);
		const inner = container.querySelector(`.hz-video__el`) as HTMLElement;
		expect(inner.tagName.toLowerCase()).toBe(expectedTag);
	});
});

// ---------------------------------------------------------------------------
// VID-R2 — YouTube embed URL
// ---------------------------------------------------------------------------

describe('VID-R2 — YouTube embed URL', () => {
	const YT_SRC = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
	const VIDEO_ID = 'dQw4w9WgXcQ';

	it('iframe src starts with https://www.youtube-nocookie.com/embed/{id}', async () => {
		const { container } = render(Video, { src: YT_SRC, title: 'Rick Roll' });
		const iframe = container.querySelector('iframe') as HTMLIFrameElement;
		expect(iframe.getAttribute('src')).toMatch(
			`https://www.youtube-nocookie.com/embed/${VIDEO_ID}`
		);
	});

	it('iframe has title, loading, allow, and allowfullscreen', async () => {
		const { container } = render(Video, { src: YT_SRC, title: 'Rick Roll', loading: 'lazy' });
		const iframe = container.querySelector('iframe') as HTMLIFrameElement;
		expect(iframe.getAttribute('title')).toBe('Rick Roll');
		expect(iframe.getAttribute('loading')).toBe('lazy');
		expect(iframe.getAttribute('allow')).toContain('autoplay');
		expect(iframe.hasAttribute('allowfullscreen')).toBe(true);
	});

	it('loop=true → playlist={id}&loop=1 in iframe src', async () => {
		const { container } = render(Video, { src: YT_SRC, title: 'test', loop: true });
		const iframe = container.querySelector('iframe') as HTMLIFrameElement;
		const iframeSrc = iframe.getAttribute('src') ?? '';
		expect(iframeSrc).toContain(`loop=1`);
		expect(iframeSrc).toContain(`playlist=${VIDEO_ID}`);
	});

	it('controls=false → controls=0 in iframe src', async () => {
		const { container } = render(Video, { src: YT_SRC, title: 'test', controls: false });
		const iframe = container.querySelector('iframe') as HTMLIFrameElement;
		expect(iframe.getAttribute('src')).toContain('controls=0');
	});

	it('controls=true (default) → no controls=0 in iframe src', async () => {
		const { container } = render(Video, { src: YT_SRC, title: 'test' });
		const iframe = container.querySelector('iframe') as HTMLIFrameElement;
		expect(iframe.getAttribute('src')).not.toContain('controls=0');
	});
});

// ---------------------------------------------------------------------------
// VID-R3 — Vimeo embed URL
// ---------------------------------------------------------------------------

describe('VID-R3 — Vimeo embed URL', () => {
	const VIMEO_SRC = 'https://vimeo.com/123456789';
	const VIDEO_ID = '123456789';

	it('iframe src is https://player.vimeo.com/video/{id} with dnt=1', async () => {
		const { container } = render(Video, { src: VIMEO_SRC, title: 'Vimeo test' });
		const iframe = container.querySelector('iframe') as HTMLIFrameElement;
		const iframeSrc = iframe.getAttribute('src') ?? '';
		expect(iframeSrc).toMatch(`https://player.vimeo.com/video/${VIDEO_ID}`);
		expect(iframeSrc).toContain('dnt=1');
	});

	it('iframe has title, loading, allow, and allowfullscreen', async () => {
		const { container } = render(Video, { src: VIMEO_SRC, title: 'Vimeo test', loading: 'lazy' });
		const iframe = container.querySelector('iframe') as HTMLIFrameElement;
		expect(iframe.getAttribute('title')).toBe('Vimeo test');
		expect(iframe.getAttribute('loading')).toBe('lazy');
		expect(iframe.getAttribute('allow')).toContain('autoplay');
		expect(iframe.hasAttribute('allowfullscreen')).toBe(true);
	});

	it('loop=true → loop=1 in Vimeo iframe src', async () => {
		const { container } = render(Video, { src: VIMEO_SRC, title: 'test', loop: true });
		const iframe = container.querySelector('iframe') as HTMLIFrameElement;
		expect(iframe.getAttribute('src')).toContain('loop=1');
	});

	it('controls=false → controls=0 in Vimeo iframe src', async () => {
		const { container } = render(Video, { src: VIMEO_SRC, title: 'test', controls: false });
		const iframe = container.querySelector('iframe') as HTMLIFrameElement;
		expect(iframe.getAttribute('src')).toContain('controls=0');
	});

	it('player.vimeo.com/video/ID is also detected as vimeo', async () => {
		const { container } = render(Video, {
			src: 'https://player.vimeo.com/video/123456789',
			title: 'test'
		});
		const wrapper = container.querySelector('div.hz-video') as HTMLElement;
		expect(wrapper.getAttribute('data-provider')).toBe('vimeo');
	});
});

// ---------------------------------------------------------------------------
// VID-R4 — Native video
// ---------------------------------------------------------------------------

describe('VID-R4 — native video', () => {
	const MP4 = 'https://cdn.example.com/video.mp4';

	it('renders a <video class="hz-video__el"> with aria-label={title}', async () => {
		const { container } = render(Video, { src: MP4, title: 'My video' });
		const video = container.querySelector('video.hz-video__el') as HTMLVideoElement;
		expect(video).not.toBeNull();
		expect(video.getAttribute('aria-label')).toBe('My video');
	});

	it('renders a nested <source> with the src', async () => {
		const { container } = render(Video, { src: MP4, title: 'test' });
		const source = container.querySelector('video source') as HTMLSourceElement;
		expect(source).not.toBeNull();
		expect(source.getAttribute('src')).toBe(MP4);
	});

	it('controls is present by default', async () => {
		const { container } = render(Video, { src: MP4, title: 'test' });
		const video = container.querySelector('video') as HTMLVideoElement;
		expect(video.hasAttribute('controls')).toBe(true);
	});

	it('controls=false → no controls attribute', async () => {
		const { container } = render(Video, { src: MP4, title: 'test', controls: false });
		const video = container.querySelector('video') as HTMLVideoElement;
		expect(video.hasAttribute('controls')).toBe(false);
	});

	it('playsinline is present', async () => {
		const { container } = render(Video, { src: MP4, title: 'test' });
		const video = container.querySelector('video') as HTMLVideoElement;
		expect(video.hasAttribute('playsinline')).toBe(true);
	});

	it('loading="lazy" → preload="none"', async () => {
		const { container } = render(Video, { src: MP4, title: 'test', loading: 'lazy' });
		const video = container.querySelector('video') as HTMLVideoElement;
		expect(video.getAttribute('preload')).toBe('none');
	});

	it('loading="eager" → preload="metadata"', async () => {
		const { container } = render(Video, { src: MP4, title: 'test', loading: 'eager' });
		const video = container.querySelector('video') as HTMLVideoElement;
		expect(video.getAttribute('preload')).toBe('metadata');
	});

	it('loop=true → loop attribute present', async () => {
		const { container } = render(Video, { src: MP4, title: 'test', loop: true });
		const video = container.querySelector('video') as HTMLVideoElement;
		expect(video.hasAttribute('loop')).toBe(true);
	});

	it('poster provided → poster attribute on video', async () => {
		const { container } = render(Video, {
			src: MP4,
			title: 'test',
			poster: 'https://example.com/poster.jpg'
		});
		const video = container.querySelector('video') as HTMLVideoElement;
		expect(video.getAttribute('poster')).toBe('https://example.com/poster.jpg');
	});

	it('muted=true → video is muted regardless of autoplay', async () => {
		const { container } = render(Video, { src: MP4, title: 'test', muted: true });
		const video = container.querySelector('video') as HTMLVideoElement;
		// Svelte 5 sets muted via the IDL property; check both attribute and property.
		expect(video.muted || video.hasAttribute('muted')).toBe(true);
	});

	it('title is not rendered as visible text', async () => {
		const { container } = render(Video, { src: MP4, title: 'Invisible title' });
		// title should not appear as text content directly in the dom tree outside aria attrs
		expect(container.textContent).not.toContain('Invisible title');
	});
});

// ---------------------------------------------------------------------------
// VID-R5 — title required as accessible name
// ---------------------------------------------------------------------------

describe('VID-R5 — title as accessible name', () => {
	it('YouTube iframe has title attribute', async () => {
		const { container } = render(Video, {
			src: 'https://youtu.be/dQw4w9WgXcQ',
			title: 'My YT video'
		});
		const iframe = container.querySelector('iframe') as HTMLIFrameElement;
		expect(iframe.getAttribute('title')).toBe('My YT video');
	});

	it('native video has aria-label matching title', async () => {
		const { container } = render(Video, {
			src: 'https://cdn.example.com/video.mp4',
			title: 'My native video'
		});
		const video = container.querySelector('video') as HTMLVideoElement;
		expect(video.getAttribute('aria-label')).toBe('My native video');
	});
});

// ---------------------------------------------------------------------------
// VID-R6 — Autoplay gating
// ---------------------------------------------------------------------------

describe('VID-R6 — autoplay gating', () => {
	const MP4 = 'https://cdn.example.com/video.mp4';
	const YT = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

	it('autoplay+muted (no reduced motion) → native video has autoplay and muted', async () => {
		const original = window.matchMedia;
		window.matchMedia = vi.fn().mockImplementation((query: string) => ({
			matches: false, // no reduced motion
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
		}));

		const { container } = render(Video, { src: MP4, title: 'test', autoplay: true, muted: true });
		const video = container.querySelector('video') as HTMLVideoElement;
		// Svelte 5 may set these via IDL properties rather than HTML attributes.
		expect(video.autoplay || video.hasAttribute('autoplay')).toBe(true);
		expect(video.muted || video.hasAttribute('muted')).toBe(true);

		window.matchMedia = original;
	});

	it('autoplay+muted (no reduced motion) → YouTube iframe src contains autoplay=1&mute=1', async () => {
		const original = window.matchMedia;
		window.matchMedia = vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
		}));

		const { container } = render(Video, { src: YT, title: 'test', autoplay: true, muted: true });
		const iframe = container.querySelector('iframe') as HTMLIFrameElement;
		const iframeSrc = iframe.getAttribute('src') ?? '';
		expect(iframeSrc).toContain('autoplay=1');
		expect(iframeSrc).toContain('mute=1');

		window.matchMedia = original;
	});

	it('autoplay without muted → no autoplay on native video + console.warn', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { container } = render(Video, { src: MP4, title: 'test', autoplay: true, muted: false });
		const video = container.querySelector('video') as HTMLVideoElement;
		// Autoplay must be suppressed — neither the attribute nor the IDL property should be true.
		expect(video.autoplay || video.hasAttribute('autoplay')).toBe(false);
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('muted');
		warnSpy.mockRestore();
	});

	it('autoplay+muted+reduced-motion → no autoplay', async () => {
		const original = window.matchMedia;
		window.matchMedia = vi.fn().mockImplementation((query: string) => ({
			matches: query === '(prefers-reduced-motion: reduce)',
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
		}));

		const { container } = render(Video, { src: MP4, title: 'test', autoplay: true, muted: true });
		const video = container.querySelector('video') as HTMLVideoElement;
		expect(video.autoplay || video.hasAttribute('autoplay')).toBe(false);

		window.matchMedia = original;
	});

	it('muted=true without autoplay → video is still muted', async () => {
		const { container } = render(Video, { src: MP4, title: 'test', muted: true });
		const video = container.querySelector('video') as HTMLVideoElement;
		expect(video.muted || video.hasAttribute('muted')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// VID-R7 — aspectRatio
// ---------------------------------------------------------------------------

describe('VID-R7 — aspectRatio', () => {
	it.each(['16/9', '4/3', '1/1', '9/16'] as const)(
		'aspectRatio="%s" → data-aspect-ratio on wrapper + inline aspect-ratio style',
		async (ratio) => {
			const { container } = render(Video, {
				src: 'https://cdn.example.com/v.mp4',
				title: 'test',
				aspectRatio: ratio
			});
			const wrapper = container.querySelector('div.hz-video') as HTMLElement;
			expect(wrapper.getAttribute('data-aspect-ratio')).toBe(ratio);
			// Browsers may normalize "16/9" → "16 / 9"; strip spaces before comparing.
			expect(wrapper.style.aspectRatio.replace(/\s/g, '')).toBe(ratio);
		}
	);

	it('defaults to aspectRatio="16/9"', async () => {
		const { container } = render(Video, { src: 'https://cdn.example.com/v.mp4', title: 'test' });
		const wrapper = container.querySelector('div.hz-video') as HTMLElement;
		expect(wrapper.getAttribute('data-aspect-ratio')).toBe('16/9');
	});
});

// ---------------------------------------------------------------------------
// VID-R8 — Native state machine
// ---------------------------------------------------------------------------

describe('VID-R8 — native state machine', () => {
	const MP4 = 'https://cdn.example.com/video.mp4';

	it('initial data-state is "idle"', async () => {
		const { container } = render(Video, { src: MP4, title: 'test' });
		const wrapper = container.querySelector('div.hz-video') as HTMLElement;
		expect(wrapper.getAttribute('data-state')).toBe('idle');
	});

	it('dispatching play event → data-state="playing"', async () => {
		const { container } = render(Video, { src: MP4, title: 'test' });
		const video = container.querySelector('video') as HTMLVideoElement;
		const wrapper = container.querySelector('div.hz-video') as HTMLElement;
		video.dispatchEvent(new Event('play'));
		await tick();
		expect(wrapper.getAttribute('data-state')).toBe('playing');
	});

	it('dispatching pause event → data-state="paused"', async () => {
		const { container } = render(Video, { src: MP4, title: 'test' });
		const video = container.querySelector('video') as HTMLVideoElement;
		const wrapper = container.querySelector('div.hz-video') as HTMLElement;
		video.dispatchEvent(new Event('play'));
		await tick();
		video.dispatchEvent(new Event('pause'));
		await tick();
		expect(wrapper.getAttribute('data-state')).toBe('paused');
	});

	it('dispatching ended event → data-state="ended"', async () => {
		const { container } = render(Video, { src: MP4, title: 'test' });
		const video = container.querySelector('video') as HTMLVideoElement;
		const wrapper = container.querySelector('div.hz-video') as HTMLElement;
		video.dispatchEvent(new Event('ended'));
		await tick();
		expect(wrapper.getAttribute('data-state')).toBe('ended');
	});

	it('iframe provider data-state stays "idle" (static)', async () => {
		const { container } = render(Video, {
			src: 'https://youtu.be/dQw4w9WgXcQ',
			title: 'test'
		});
		const wrapper = container.querySelector('div.hz-video') as HTMLElement;
		expect(wrapper.getAttribute('data-state')).toBe('idle');
	});
});

// ---------------------------------------------------------------------------
// VID-R9 — loading
// ---------------------------------------------------------------------------

describe('VID-R9 — loading', () => {
	it('iframe gets loading="lazy" by default', async () => {
		const { container } = render(Video, { src: 'https://youtu.be/dQw4w9WgXcQ', title: 'test' });
		const iframe = container.querySelector('iframe') as HTMLIFrameElement;
		expect(iframe.getAttribute('loading')).toBe('lazy');
	});

	it('loading="eager" → iframe loading="eager"', async () => {
		const { container } = render(Video, {
			src: 'https://youtu.be/dQw4w9WgXcQ',
			title: 'test',
			loading: 'eager'
		});
		const iframe = container.querySelector('iframe') as HTMLIFrameElement;
		expect(iframe.getAttribute('loading')).toBe('eager');
	});
});

// ---------------------------------------------------------------------------
// VID-R10 — class composition
// ---------------------------------------------------------------------------

describe('VID-R10 — class composition', () => {
	it('no class prop → wrapper class is exactly "hz-video"', async () => {
		const { container } = render(Video, { src: 'https://cdn.example.com/v.mp4', title: 'test' });
		const wrapper = container.querySelector('div.hz-video') as HTMLElement;
		const classes = [...wrapper.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes).toEqual(['hz-video']);
	});

	it('class="foo bar" → hz-video is first, foo and bar present', async () => {
		const { container } = render(Video, {
			src: 'https://cdn.example.com/v.mp4',
			title: 'test',
			class: 'foo bar'
		});
		const wrapper = container.querySelector('div.hz-video') as HTMLElement;
		const classes = [...wrapper.classList].filter((c) => !c.startsWith('svelte-'));
		expect(classes[0]).toBe('hz-video');
		expect(classes).toContain('foo');
		expect(classes).toContain('bar');
	});
});

// ---------------------------------------------------------------------------
// VID-R11 — rest forwarding
// ---------------------------------------------------------------------------

describe('VID-R11 — rest forwarding', () => {
	it('extra attribute (data-testid) forwarded to native video element', async () => {
		const { container } = render(Video, {
			src: 'https://cdn.example.com/v.mp4',
			title: 'test',
			'data-testid': 'my-video'
		} as Record<string, unknown>);
		const video = container.querySelector('video') as HTMLVideoElement;
		expect(video.getAttribute('data-testid')).toBe('my-video');
	});

	it('extra attribute (data-testid) forwarded to YouTube iframe', async () => {
		const { container } = render(Video, {
			src: 'https://youtu.be/dQw4w9WgXcQ',
			title: 'test',
			'data-testid': 'my-iframe'
		} as Record<string, unknown>);
		// iframe is inside the wrapper (hz-video__el class)
		const iframe = container.querySelector('.hz-video__el') as HTMLIFrameElement;
		expect(iframe).not.toBeNull();
		expect(iframe.getAttribute('data-testid')).toBe('my-iframe');
	});

	it('rest cannot overwrite managed class on inner element', async () => {
		const { container } = render(Video, {
			src: 'https://cdn.example.com/v.mp4',
			title: 'test',
			class: 'hijack'
		} as Record<string, unknown>);
		const video = container.querySelector('video') as HTMLVideoElement;
		// hz-video__el must be present; svelte may append scoped hash but hijack must not appear
		expect(video.classList.contains('hz-video__el')).toBe(true);
		expect(video.classList.contains('hijack')).toBe(false);
	});

	it('rest cannot overwrite managed aria-label on native video', async () => {
		const { container } = render(Video, {
			src: 'https://cdn.example.com/v.mp4',
			title: 'My title',
			'aria-label': 'override'
		} as Record<string, unknown>);
		const video = container.querySelector('video') as HTMLVideoElement;
		expect(video.getAttribute('aria-label')).toBe('My title');
	});
});

// ---------------------------------------------------------------------------
// VID-R12 — Barrel export
// ---------------------------------------------------------------------------

describe('VID-R12 — barrel export', () => {
	it('Video is resolvable from $lib', async () => {
		const { Video: VideoComp } = await import('$lib');
		expect(VideoComp).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
	it('YouTube host with no extractable ID → data-provider="native" + console.warn', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { container } = render(Video, {
			src: 'https://www.youtube.com/channel/UCxxxxxx',
			title: 'test'
		});
		const wrapper = container.querySelector('div.hz-video') as HTMLElement;
		expect(wrapper.getAttribute('data-provider')).toBe('native');
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('YouTube');
		warnSpy.mockRestore();
	});

	it('non-embed URL (.mp4) → data-provider="native", <source> with the URL', async () => {
		const { container } = render(Video, {
			src: 'https://cdn.example.com/movie.mp4',
			title: 'test'
		});
		const wrapper = container.querySelector('div.hz-video') as HTMLElement;
		expect(wrapper.getAttribute('data-provider')).toBe('native');
		const source = container.querySelector('video source') as HTMLSourceElement;
		expect(source.getAttribute('src')).toBe('https://cdn.example.com/movie.mp4');
	});

	it('autoplay without muted → autoplay suppressed, warn fired, muted absent', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { container } = render(Video, {
			src: 'https://cdn.example.com/v.mp4',
			title: 'test',
			autoplay: true,
			muted: false
		});
		const video = container.querySelector('video') as HTMLVideoElement;
		// autoplay suppressed
		expect(video.autoplay || video.hasAttribute('autoplay')).toBe(false);
		// muted=false → video should not be muted
		expect(video.muted || video.hasAttribute('muted')).toBe(false);
		expect(warnSpy).toHaveBeenCalledOnce();
		warnSpy.mockRestore();
	});
});
