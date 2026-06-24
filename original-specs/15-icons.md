# Icons

SVG icons shipped as individual Svelte components. Includes essential UI icons used internally by components and common brand icons.

---

## Shared Interface

Every icon component follows the same API:

| Prop        | Type                  | Default |
| ----------- | --------------------- | ------- |
| size        | `number`              | `24`    |
| strokeWidth | `number`              | `2`     |
| class       | `string \| undefined` | —       |
| ariaLabel   | `string \| undefined` | —       |

**Accessibility rule:**

- If `ariaLabel` is set → icon is informative: renders with `role="img"` and `aria-label`
- If `ariaLabel` is omitted → icon is decorative: renders with `aria-hidden="true"`

Icons use `currentColor` for fill/stroke so they inherit text color from their parent element.

## Import

```ts
// Individual imports (tree-shakeable)
import { IconGithub, IconChevronDown, IconX } from '@hyzer/ui/icons';

// Usage
<IconGithub size={20} ariaLabel="GitHub profile" />
<IconChevronDown size={16} />
<IconX size={18} ariaLabel="Close" />
```

## Renders

```html
<!-- Decorative (no ariaLabel) -->
<svg
	class="hz-icon"
	width="24"
	height="24"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<!-- paths -->
</svg>

<!-- Informative (ariaLabel provided) -->
<svg
	class="hz-icon"
	width="24"
	height="24"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	role="img"
	aria-label="GitHub profile"
>
	<!-- paths -->
</svg>
```

---

## UI Icons

Used internally by components. Also available for consumers.

| Icon               | Component usage                              |
| ------------------ | -------------------------------------------- |
| `IconChevronDown`  | Accordion trigger, Nav dropdown, Select      |
| `IconChevronRight` | Accordion (alternate), Nav submenu indicator |
| `IconChevronUp`    | Reverse states                               |
| `IconChevronLeft`  | Back navigation                              |
| `IconX`            | Modal close, dismissible elements            |
| `IconMenu`         | Nav hamburger toggle                         |
| `IconExternalLink` | External link indicator                      |
| `IconCheck`        | Checkbox checked state, success states       |
| `IconMinus`        | Checkbox indeterminate state                 |
| `IconPlus`         | Expand, add actions                          |
| `IconSearch`       | Search input prefix                          |
| `IconLoader`       | Button loading spinner                       |
| `IconArrowLeft`    | Navigation, pagination                       |
| `IconArrowRight`   | Navigation, pagination                       |

---

## Brand Icons

Common social/platform icons for footer social links, sharing buttons, etc.

| Icon            | Brand       |
| --------------- | ----------- |
| `IconGithub`    | GitHub      |
| `IconLinkedin`  | LinkedIn    |
| `IconTwitterX`  | Twitter / X |
| `IconFacebook`  | Facebook    |
| `IconInstagram` | Instagram   |
| `IconYoutube`   | YouTube     |
| `IconRss`       | RSS         |

---

## Design Specifications

- **Viewbox:** 24×24 for all icons (consistent grid)
- **Stroke-based:** UI icons use strokes, not fills (consistent weight, scales with `strokeWidth`)
- **Brand icons:** Use fills (brand marks have specific shapes that shouldn't change weight)
- **No default color:** `currentColor` inherits from parent — consumer controls color via CSS
- **Line caps/joins:** Round for UI icons (softer feel)

## Adding Icons

New icons follow the same Svelte component pattern. The docs site will include a visual reference of all available icons with copy-paste import snippets.
