# Card

Versatile content container with media, body, and action regions. Supports vertical and horizontal layouts with configurable content order.

---

## Props

| Prop          | Type                                              | Default      |
| ------------- | ------------------------------------------------- | ------------ |
| variant       | `'elevated' \| 'outlined' \| 'filled' \| 'ghost'` | `'outlined'` |
| padding       | `'none' \| 'sm' \| 'md' \| 'lg'`                  | `'md'`       |
| rounded       | `'none' \| 'sm' \| 'md' \| 'lg'`                  | `'md'`       |
| href          | `string \| undefined`                             | —            |
| horizontal    | `boolean`                                         | `false`      |
| mediaPosition | `'start' \| 'end'`                                | `'start'`    |

## Content Order

In **vertical** layout (default):

- `mediaPosition="start"`: media on top, content below (default)
- `mediaPosition="end"`: content on top, media below

In **horizontal** layout:

- `mediaPosition="start"`: media on the left, content on the right (default)
- `mediaPosition="end"`: content on the left, media on the right

This maps to logical properties (`start`/`end`) so it respects RTL layouts automatically.

On mobile, horizontal cards stack vertically. `mediaPosition` still controls order in the stacked layout — `start` means media first (top), `end` means content first (top).

## Slots

- `media` — image, video, or illustration area
- `children` — body content (title, description, etc.)
- `actions` — footer with buttons or links

## Data Attributes

- `data-variant="outlined"`, `data-padding="md"`, `data-rounded="md"`
- `data-horizontal` when horizontal layout is active
- `data-media-position="start" | "end"`
- `data-clickable` when `href` is set

## Renders

```html
<!-- Vertical, media on top -->
<div class="hz-card" data-variant="outlined" data-media-position="start">
	<div class="hz-card-media">
		<!-- media slot -->
	</div>
	<div class="hz-card-body">
		<!-- children slot -->
	</div>
	<div class="hz-card-actions">
		<!-- actions slot -->
	</div>
</div>

<!-- Horizontal, media on right -->
<div class="hz-card" data-variant="outlined" data-horizontal data-media-position="end">
	<div class="hz-card-body">
		<!-- children slot (rendered first in DOM for reading order) -->
	</div>
	<div class="hz-card-media">
		<!-- media slot (visually positioned to the end via CSS order/grid) -->
	</div>
	<div class="hz-card-actions">
		<!-- actions slot -->
	</div>
</div>
```

When `mediaPosition="end"` in horizontal mode, the content comes first in DOM order (correct reading order for screen readers) and CSS handles the visual reordering via `order` property or grid column placement.

## The Clickable Card Problem

When `href` is set, the entire card becomes a link target. But cards often contain other interactive elements (buttons, links). The approach:

```html
<div class="hz-card" data-clickable>
	<a href="..." class="hz-card-link" aria-label="Card title" tabindex="-1">
		<span class="hz-card-link-overlay"></span>
	</a>
	<!-- card content with relative-positioned interactive children -->
</div>
```

The overlay `<a>` covers the card. Inner links/buttons are positioned above it (`position: relative; z-index: 1`) so they remain independently clickable and focusable. The overlay link gets `tabindex="-1"` so it's not a separate tab stop — the card title link inside the content is the primary focus target.

## Accessibility

- Card itself is not a landmark (just a `<div>`)
- When clickable, the primary link is the card's heading link
- Inner interactive elements remain independently focusable and clickable
- DOM order matches reading order regardless of visual layout — CSS handles repositioning
- Card heading should use the appropriate heading level for its context
