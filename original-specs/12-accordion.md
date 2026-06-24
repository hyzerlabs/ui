# Accordion

Collapsible content sections using the native `<details>` element.

---

## Props

| Prop         | Type                     | Default    |
| ------------ | ------------------------ | ---------- |
| items        | `AccordionItem[]`        | _required_ |
| type         | `'single' \| 'multiple'` | `'single'` |
| defaultOpen  | `string \| string[]`     | `[]`       |
| collapsible  | `boolean`                | `true`     |
| headingLevel | `2 \| 3 \| 4 \| 5 \| 6`  | `3`        |

`AccordionItem`: `{ id: string, title: string, disabled?: boolean }`

## Slots

Each item's content is passed as a named snippet or via a render callback.

## Native `<details>` Element

The accordion is built on `<details>` / `<summary>`, which provides:

- Built-in expand/collapse behavior without JavaScript
- Native browser animations (where supported)
- Accessible by default — screen readers understand the open/closed semantic
- Works without JavaScript (progressive enhancement)

### Single-Expand Mode

When `type="single"`, the `name` attribute on `<details>` elements groups them into an exclusive accordion — only one can be open at a time. This is a native HTML feature (supported in modern browsers) that requires no JavaScript for the core behavior.

```html
<details name="accordion-{uid}"></details>
```

For browsers that don't support the `name` attribute, a JavaScript fallback closes other items when one opens.

### Collapsible

When `collapsible={false}` and `type="single"`, the currently open item cannot be closed by clicking its summary — there must always be one item open. This requires JavaScript to intercept the toggle event on the open item.

## Data Attributes

- `data-type="single" | "multiple"`
- Each item: `data-state="open" | "closed"`, `data-disabled`

## Renders

```html
<div class="hz-accordion" data-type="single">
	<details class="hz-accordion-item" name="accordion-{uid}" data-state="open" open>
		<summary class="hz-accordion-trigger">
			<h3 class="hz-accordion-heading">{item.title}</h3>
			<span class="hz-accordion-icon" aria-hidden="true">
				<IconChevronDown />
			</span>
		</summary>
		<div class="hz-accordion-panel">
			<!-- item content -->
		</div>
	</details>

	<details class="hz-accordion-item" name="accordion-{uid}" data-state="closed">
		<summary class="hz-accordion-trigger">
			<h3 class="hz-accordion-heading">{item.title}</h3>
			<span class="hz-accordion-icon" aria-hidden="true">
				<IconChevronDown />
			</span>
		</summary>
		<div class="hz-accordion-panel">
			<!-- item content -->
		</div>
	</details>
</div>
```

## Heading Structure

The `<summary>` contains a heading element whose level is set by `headingLevel`. This maintains proper document outline. The heading wraps the trigger text; the icon is outside the heading for clean screen reader output.

## Disabled Items

Disabled items render with `data-disabled` and the `<summary>` has `aria-disabled="true"`. JavaScript prevents the toggle event from firing. The item remains visible in the DOM and focusable (so screen reader users know it exists) but cannot be opened.

## Animation

Panel open/close uses Svelte `transition:slide` on the content, with `prefers-reduced-motion` check:

- Normal: slides open/closed over 200ms
- Reduced motion: instant open/close (duration 0)

The `data-state` attribute updates synchronously with the open state so CSS-only transitions are also possible in the theme layer.

## Keyboard

Native `<details>` / `<summary>` provides:

- Enter / Space: toggle the focused item

Enhanced keyboard navigation (added via JavaScript):

| Key        | Action                         |
| ---------- | ------------------------------ |
| Arrow Down | Move focus to next trigger     |
| Arrow Up   | Move focus to previous trigger |
| Home       | Focus first trigger            |
| End        | Focus last trigger             |

## Accessibility

- Native `<details>` / `<summary>` elements — screen readers announce "expanded" / "collapsed" without custom ARIA
- Heading elements maintain document outline
- `name` attribute provides exclusive accordion behavior natively
- Disabled items: `aria-disabled="true"`, focusable but non-activatable
- Animation respects `prefers-reduced-motion`
- Works without JavaScript for basic expand/collapse (progressive enhancement)
