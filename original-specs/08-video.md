# Video

Embedded video player. Wraps native `<video>` and YouTube/Vimeo embeds with a consistent interface.

---

## Props

| Prop        | Type                                 | Default    |
| ----------- | ------------------------------------ | ---------- |
| src         | `string`                             | _required_ |
| title       | `string`                             | _required_ |
| aspectRatio | `'16/9' \| '4/3' \| '1/1' \| '9/16'` | `'16/9'`   |
| autoplay    | `boolean`                            | `false`    |
| muted       | `boolean`                            | `false`    |
| controls    | `boolean`                            | `true`     |
| loop        | `boolean`                            | `false`    |
| poster      | `string \| undefined`                | —          |
| loading     | `'lazy' \| 'eager'`                  | `'lazy'`   |

## Source Detection

The component detects YouTube and Vimeo URLs and renders an `<iframe>`. All other URLs render a native `<video>` element.

## Renders

```html
<!-- YouTube / Vimeo -->
<div class="hz-video" data-state="idle" data-provider="youtube">
	<iframe
		src="https://www.youtube-nocookie.com/embed/..."
		title="Video title here"
		loading="lazy"
		allow="autoplay; fullscreen"
		allowfullscreen
	></iframe>
</div>

<!-- Native video -->
<div class="hz-video" data-state="idle" data-provider="native">
	<video controls muted poster="..." aria-label="Video title here">
		<source src="..." />
	</video>
</div>
```

## Data Attributes

- `data-provider="youtube" | "vimeo" | "native"`
- `data-state="idle" | "playing" | "paused" | "ended"` (native video only)
- `data-aspect-ratio="16/9"`

## Accessibility

- `title` is required for iframes — it's the screen reader label for embedded content
- Native video has `controls` by default — never ship a video without controls unless there's a custom control UI
- Autoplay only functions when `muted` is also true **and** `prefers-reduced-motion` is not `reduce`
- YouTube embeds use the no-cookie domain (`youtube-nocookie.com`)
- `poster` provides visual context before the video loads
