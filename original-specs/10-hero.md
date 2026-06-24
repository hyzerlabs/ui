# Hero

Full-width landing section. Content + optional media, responsive stacking.

---

## Props

| Prop            | Type                               | Default    |
| --------------- | ---------------------------------- | ---------- |
| layout          | `'center' \| 'split' \| 'overlay'` | `'center'` |
| height          | `'auto' \| 'screen' \| 'half'`     | `'auto'`   |
| align           | `'start' \| 'center' \| 'end'`     | `'center'` |
| reverseOnMobile | `boolean`                          | `false`    |

## Slots

- `eyebrow` — small text above the title (category, tagline)
- `title` — primary heading
- `subtitle` — supporting text
- `actions` — CTA buttons (typically a Cluster of Buttons)
- `media` — image, video, illustration, or interactive element
- `background` — decorative background for overlay layout

## Layout Modes

**`center`**: All content centered vertically and horizontally, stacked. Classic landing page. Media slot renders below the actions.

**`split`**: Content on one side, media on the other. Uses Split layout internally. Stacks on mobile. `reverseOnMobile` controls whether media or content comes first when stacked.

**`overlay`**: Content layered over the `background` slot. Consumer must ensure contrast via overlay color/gradient.

## Data Attributes

- `data-layout="center" | "split" | "overlay"`
- `data-height="auto" | "screen" | "half"`
- `data-align="start" | "center" | "end"`

## Renders

```html
<section
	class="hz-hero"
	data-layout="split"
	data-height="auto"
	aria-labelledby="hz-hero-title-{uid}"
>
	<div class="hz-hero-content">
		<div class="hz-hero-eyebrow"><!-- eyebrow slot --></div>
		<h1 id="hz-hero-title-{uid}" class="hz-hero-title"><!-- title slot --></h1>
		<div class="hz-hero-subtitle"><!-- subtitle slot --></div>
		<div class="hz-hero-actions"><!-- actions slot --></div>
	</div>
	<div class="hz-hero-media">
		<!-- media slot -->
	</div>
</section>
```

## Accessibility

- Renders as `<section>` with `aria-labelledby` pointing to the title
- Background images/videos are decorative — they live in a slot so the consumer controls `alt=""` or equivalent
- Overlay layout: consumer is responsible for sufficient contrast. The docs will show how to verify contrast and provide example overlay patterns.
- `height="screen"` (100vh) should be used carefully — on mobile, 100vh can be problematic with browser chrome. Consider `100dvh` in the theme layer.
