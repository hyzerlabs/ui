# Modal

Dialog overlay using the native `<dialog>` element. The accessibility showcase of the library.

---

## Props

| Prop           | Type                             | Default    |
| -------------- | -------------------------------- | ---------- |
| open           | `boolean`                        | `false`    |
| title          | `string`                         | _required_ |
| description    | `string \| undefined`            | —          |
| size           | `'sm' \| 'md' \| 'lg' \| 'full'` | `'md'`     |
| closeOnOverlay | `boolean`                        | `true`     |
| closeOnEscape  | `boolean`                        | `true`     |
| showClose      | `boolean`                        | `true`     |
| preventScroll  | `boolean`                        | `true`     |

**Bindable:** `bind:open` for two-way binding

**Events:** `onclose` — fires when modal is dismissed by any method (overlay click, escape, close button, programmatic)

## Slots

- `children` — modal body content
- `actions` — footer area for buttons (confirm, cancel, etc.)

## Data Attributes

- `data-size="md"`
- `data-state="open" | "closed"`

## Renders

```html
<dialog
	class="hz-modal"
	data-size="md"
	data-state="open"
	aria-labelledby="hz-modal-title-{uid}"
	aria-describedby="hz-modal-desc-{uid}"
	aria-modal="true"
>
	<div class="hz-modal-header">
		<h2 id="hz-modal-title-{uid}" class="hz-modal-title">{title}</h2>
		{#if showClose}
		<button class="hz-modal-close" aria-label="Close dialog">
			<IconX />
		</button>
		{/if}
	</div>
	{#if description}
	<p id="hz-modal-desc-{uid}" class="hz-modal-description">{description}</p>
	{/if}
	<div class="hz-modal-body">
		<!-- children slot -->
	</div>
	<div class="hz-modal-footer">
		<!-- actions slot -->
	</div>
</dialog>
```

## Implementation Details

**Opening:** Calls `dialog.showModal()` which provides native backdrop, top-layer stacking, and focus trapping. No custom focus trap implementation needed.

**Closing:** Calls `dialog.close()`. The component tracks `document.activeElement` before opening and returns focus there on close.

**Focus on open:** Moves to the first focusable element inside the modal. If no focusable content exists, focuses the close button. If `showClose={false}` and no focusable content, focuses the dialog element itself.

**Escape:** Handled natively by `<dialog>`. If `closeOnEscape={false}`, the component intercepts the native `cancel` event and prevents it.

**Backdrop click:** Listens for click on the `<dialog>` element itself (the backdrop area) vs. inner content. A click on the `<dialog>` that isn't on any child element is a backdrop click.

**Scroll lock:** When `preventScroll` is true, adds `overflow: hidden` to `<body>` on open, restores on close. Tracks the original overflow value so it doesn't clobber existing styles.

**Stacking:** If multiple modals open (modal launches another modal), only the topmost traps focus. Native `<dialog>` top-layer handles z-index stacking automatically.

## Accessibility

- Native `<dialog>` element with `showModal()` — handles focus trapping, backdrop, stacking context, and Escape key natively
- `aria-modal="true"` for screen readers
- `aria-labelledby` points to the title element
- `aria-describedby` points to the description element (when present)
- Focus returns to the trigger element on close
- Close button has `aria-label="Close dialog"`
- Body scroll locked to prevent background content interaction
- `onclose` event fires regardless of how the modal was dismissed
