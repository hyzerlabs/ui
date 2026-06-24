# Nav

One navigation component. Pass flat links for a simple nav. Add `children` to any item and it becomes a dropdown. The component figures out the rest.

---

## Props

| Prop             | Type                                       | Default             |
| ---------------- | ------------------------------------------ | ------------------- |
| items            | `NavItem[]`                                | _required_          |
| sticky           | `boolean`                                  | `false`             |
| variant          | `'default' \| 'transparent' \| 'bordered'` | `'default'`         |
| mobileBreakpoint | `'sm' \| 'md' \| 'lg'`                     | `'md'`              |
| ariaLabel        | `string`                                   | `'Main navigation'` |

Uses the shared `NavItem` type (see `04-nav-types.md`). The component inspects each item:

- **`href` only** → renders a link
- **`children` only** → renders a dropdown trigger (no link, click opens submenu)
- **`href` + `children`** → renders a link with a separate dropdown trigger (the link navigates, the chevron opens the submenu)

## Slots

- `logo` — brand mark / wordmark
- `actions` — right-side CTA area (e.g. a Button)

## Data Attributes

- `data-variant="default" | "transparent" | "bordered"`
- `data-sticky`
- Mobile menu: `data-state="open" | "closed"`
- Dropdown: `data-state="open" | "closed"` on each dropdown panel
- Items with children: `data-has-children`

## Renders (Simple — no children)

When all items are flat links, the component renders a straightforward nav:

```html
<nav aria-label="Main navigation" class="hz-nav" data-variant="default">
	<div class="hz-nav-inner">
		<!-- logo slot -->
		<ul role="list" class="hz-nav-links">
			<li><a href="/" aria-current="page">Home</a></li>
			<li><a href="/about">About</a></li>
			<li><a href="/blog">Blog</a></li>
		</ul>
		<!-- actions slot -->
		<button
			class="hz-nav-toggle"
			aria-expanded="false"
			aria-controls="hz-nav-menu-{uid}"
			aria-label="Toggle navigation menu"
		>
			<IconMenu />
		</button>
	</div>
	<div id="hz-nav-menu-{uid}" class="hz-nav-mobile" data-state="closed">
		<!-- mobile menu: same links + actions, stacked vertically -->
	</div>
</nav>
```

## Renders (With Dropdowns — items have children)

Items with `children` get dropdown behavior:

```html
<nav aria-label="Main navigation" class="hz-nav" data-variant="default">
	<div class="hz-nav-inner">
		<!-- logo slot -->
		<ul role="list" class="hz-nav-links">
			<li><a href="/">Home</a></li>
			<li class="hz-nav-dropdown" data-has-children>
				<button aria-expanded="false" aria-haspopup="true" aria-controls="hz-dropdown-{uid}">
					Services <IconChevronDown />
				</button>
				<ul id="hz-dropdown-{uid}" role="menu" data-state="closed">
					<li role="none"><a role="menuitem" href="/services/design-systems">Design Systems</a></li>
					<li role="none"><a role="menuitem" href="/services/a11y">Accessibility Audits</a></li>
				</ul>
			</li>
			<li><a href="/contact">Contact</a></li>
		</ul>
		<!-- actions slot -->
		<!-- hamburger toggle -->
	</div>
	<!-- mobile menu -->
</nav>
```

## Renders (href + children — navigable parent with dropdown)

When an item has both `href` and `children`, the label is a link and a separate chevron button opens the dropdown:

```html
<li class="hz-nav-dropdown" data-has-children>
	<a href="/services">Services</a>
	<button
		aria-expanded="false"
		aria-haspopup="true"
		aria-controls="hz-dropdown-{uid}"
		aria-label="Services submenu"
	>
		<IconChevronDown />
	</button>
	<ul id="hz-dropdown-{uid}" role="menu" data-state="closed">
		<li role="none"><a role="menuitem" href="/services/design-systems">Design Systems</a></li>
		<li role="none"><a role="menuitem" href="/services/a11y">Accessibility Audits</a></li>
	</ul>
</li>
```

## Desktop Behavior

- Dropdown trigger **click** opens/closes (not hover — hover is unreliable and inaccessible)
- Click outside or Escape closes any open dropdown
- Only one dropdown open at a time

## Mobile Behavior

Below `mobileBreakpoint`, the nav collapses:

- Hamburger button toggles the mobile menu
- Flat links render as a vertical list
- Items with `children` become expandable sections using native `<details>` / `<summary>`
- No hover interaction at all

```html
<!-- Mobile: dropdown items become expandable sections -->
<details class="hz-nav-mobile-section">
	<summary>Services <IconChevronDown /></summary>
	<ul>
		<li><a href="/services/design-systems">Design Systems</a></li>
		<li><a href="/services/a11y">Accessibility Audits</a></li>
	</ul>
</details>
```

## Keyboard (Desktop Dropdowns)

| Key                        | Action                                      |
| -------------------------- | ------------------------------------------- |
| Enter / Space (on trigger) | Toggle dropdown open/closed                 |
| Arrow Down (on trigger)    | Open dropdown, focus first item             |
| Arrow Up / Down (in menu)  | Move between menu items                     |
| Escape                     | Close dropdown, return focus to trigger     |
| Tab                        | Close dropdown, move to next top-level item |
| Home / End (in menu)       | Jump to first / last item                   |

## Accessibility

- `<nav>` landmark with `aria-label`
- Hamburger button: `aria-expanded` + `aria-controls`
- Mobile menu traps focus when open; Escape closes and returns focus to hamburger
- Dropdown triggers: `aria-expanded`, `aria-haspopup="true"`, `aria-controls`
- Dropdown panels: `role="menu"`, items have `role="menuitem"`, list items have `role="none"`
- On mobile: dropdowns become `<details>` / `<summary>` (no `role="menu"` — accordion pattern instead)
- Focus management: opening a dropdown moves focus to first item; closing returns focus to trigger
- Links use `aria-current="page"` via the `NavItem` type
- External links get `target="_blank"`, `rel="noopener noreferrer"`, and SR announcement
- Skip-nav compatible — consumer adds their own skip link targeting `#main`

## Docs Site Examples

The docs page shows both patterns using the same component:

1. **Simple nav** — flat `NavItem[]` with no `children`, resulting in a clean link list
2. **Nav with dropdowns** — mix of flat links and items with `children`
3. **Navigable parent + dropdown** — items with both `href` and `children`
4. **Mobile behavior** — responsive demo showing hamburger and expandable sections
