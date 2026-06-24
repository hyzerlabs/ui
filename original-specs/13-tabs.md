# Tabs

Tabbed content interface following the WAI-ARIA tabs pattern.

---

## Props

| Prop        | Type                         | Default           |
| ----------- | ---------------------------- | ----------------- |
| items       | `TabItem[]`                  | _required_        |
| defaultTab  | `string`                     | First item's `id` |
| orientation | `'horizontal' \| 'vertical'` | `'horizontal'`    |
| activation  | `'auto' \| 'manual'`         | `'auto'`          |

`TabItem`: `{ id: string, label: string, disabled?: boolean }`

## Slots

Each tab's panel content is passed via named snippets or a render callback.

## Activation Modes

**`auto`** (default): Arrow keys both move focus **and** activate the tab — the panel switches immediately as focus moves. This is the better default for most UIs where panel content is already loaded.

**`manual`**: Arrow keys move focus between tabs but don't activate. Enter/Space activates the focused tab. Use this when tab activation triggers an expensive operation (e.g. fetching content from an API).

## Data Attributes

- `data-orientation="horizontal" | "vertical"`
- Tab triggers: `data-state="active" | "inactive"`, `data-disabled`
- Tab panels: `data-state="active" | "inactive"`

## Renders

```html
<div class="hz-tabs" data-orientation="horizontal">
	<div class="hz-tabs-list" role="tablist" aria-orientation="horizontal" aria-label="...">
		<button
			class="hz-tabs-trigger"
			role="tab"
			id="hz-tab-{item.id}"
			aria-selected="true"
			aria-controls="hz-tabpanel-{item.id}"
			tabindex="0"
			data-state="active"
		>
			{item.label}
		</button>
		<button
			class="hz-tabs-trigger"
			role="tab"
			id="hz-tab-{item.id}"
			aria-selected="false"
			aria-controls="hz-tabpanel-{item.id}"
			tabindex="-1"
			data-state="inactive"
		>
			{item.label}
		</button>
	</div>

	<div
		class="hz-tabs-panel"
		role="tabpanel"
		id="hz-tabpanel-{item.id}"
		aria-labelledby="hz-tab-{item.id}"
		tabindex="0"
		data-state="active"
	>
		<!-- active panel content -->
	</div>
</div>
```

## Roving Tabindex

Only the active tab has `tabindex="0"`. All other tabs have `tabindex="-1"`. This means the Tab key skips past inactive tabs — arrow keys navigate within the tablist. Tab key from the active tab moves focus **into** the active panel.

## Keyboard

| Key                             | Action                                    |
| ------------------------------- | ----------------------------------------- |
| Arrow Left / Right (horizontal) | Move focus between tabs                   |
| Arrow Up / Down (vertical)      | Move focus between tabs                   |
| Home                            | Focus first non-disabled tab              |
| End                             | Focus last non-disabled tab               |
| Enter / Space                   | Activate focused tab (manual mode only)   |
| Tab                             | Move focus from tablist into active panel |

## Disabled Tabs

Disabled tabs have `aria-disabled="true"` and `tabindex="-1"`. Arrow key navigation **skips** disabled tabs. They remain visible so users know the tab exists.

## Accessibility

- Full ARIA tabs pattern per APG specification
- `role="tablist"`, `role="tab"`, `role="tabpanel"`
- `aria-selected` on the active tab
- `aria-orientation` for screen reader announcement of arrow key direction
- `aria-controls` / `aria-labelledby` relationship between tabs and panels
- Active panel has `tabindex="0"` so it's focusable even without focusable content inside
- Roving tabindex: only one tab stop in the tablist, arrow keys navigate within
- Disabled tabs: visible but skipped by arrow key navigation
