# @hyzer/ui — Architecture Overview

## Core Philosophy

This library ships **behavior, structure, and accessibility** — not visual opinions. Every component is headless by default: correct HTML semantics, full keyboard navigation, ARIA attributes, focus management, and state logic. Consumers bring their own styles.

An optional reference theme ships separately as `@hyzer/ui/theme` for consumers who want a starting point. The docs site at design.hyzer.sh uses this theme as a living example.

This approach lets the same component library power hyzer.sh, heffner.dev, and future client projects with completely different visual identities while sharing the same accessibility and interaction guarantees.

---

## Package Structure

```
@hyzer/ui
├── Components (headless)         import { Button } from '@hyzer/ui'
├── Tokens (CSS + JS)             import '@hyzer/ui/tokens.css'
│                                 import { colors } from '@hyzer/ui/tokens'
├── Icons (SVG Svelte components) import { IconGithub } from '@hyzer/ui/icons'
├── Utils (contrast, cx, uid)     import { contrastRatio } from '@hyzer/ui/utils'
├── Theme (optional styles)       import '@hyzer/ui/theme'
│                                 import '@hyzer/ui/theme/button.css'
└── Types                         import type { Size } from '@hyzer/ui/types'
```

---

## Headless-First: What That Means in Practice

Each component ships:

1. **Correct HTML element** — `<button>`, `<dialog>`, `<details>`, `<nav>` where native semantics exist
2. **ARIA attributes** — `aria-expanded`, `aria-controls`, `aria-labelledby`, roles, live regions
3. **Keyboard handling** — arrow keys, Escape, Enter/Space, Home/End, Tab management
4. **State management** — open/closed, active/inactive, selected, disabled, loading
5. **Data attributes for styling** — `data-state="open"`, `data-variant="solid"`, `data-size="md"`
6. **CSS custom properties** — `--hz-button-bg`, `--hz-modal-width` etc. as styling hooks
7. **No visual CSS** — no colors, no spacing, no shadows, no borders, no fonts

Consumers style components using the data attributes and custom properties:

```css
/* Consumer's stylesheet */
.hz-button[data-variant='solid'][data-intent='primary'] {
	background: var(--brand-primary);
	color: white;
	padding: 0.5rem 1rem;
	border-radius: 6px;
	font-weight: 600;
}

.hz-button[data-state='loading'] {
	opacity: 0.7;
	pointer-events: none;
}
```

The optional theme (`@hyzer/ui/theme`) provides a complete set of these styles using the design tokens, so consumers who want a styled starting point can import it and override selectively.

### Data Attribute Convention

Every component renders a root element with:

- `class="hz-{component}"` — stable class name for targeting
- `data-variant`, `data-intent`, `data-size` — for prop-driven variants
- `data-state` — for interactive state (`open`, `closed`, `active`, `disabled`, `loading`)

This keeps the styling API predictable across every component.

---

## Shared Types

One recursive `NavItem` type powers Nav and Footer:

```ts
/** Navigation item — recursive. Used by Nav and Footer. */
export interface NavItem {
	label: string;
	href?: string;
	children?: NavItem[];
	external?: boolean;
	ariaCurrent?: 'page' | 'step' | 'true';
}

/** Footer column grouping */
export interface FooterColumn {
	title: string;
	links: NavItem[];
}
```

The Nav component inspects each item and decides what to render: `href` only → link, `children` only → dropdown trigger, `href` + `children` → navigable link with separate dropdown trigger. One component, one type — the data determines the complexity. Footer uses the same `NavItem` and ignores `children`.

---

## Resolved Decisions

### Dark Mode

Dual strategy. `prefers-color-scheme` media query provides the system default. A `data-theme` attribute on a parent element overrides it. User choice always wins.

```css
:root {
	/* light tokens */
}
@media (prefers-color-scheme: dark) {
	:root {
		/* dark tokens */
	}
}
[data-theme='light'] {
	/* light tokens — overrides media query */
}
[data-theme='dark'] {
	/* dark tokens — overrides media query */
}
```

The explicit attribute uses higher specificity so it always wins over the media query.

### Animations

Svelte transitions (`transition:slide`, `transition:fade`, custom) for open/close animations on Accordion, Modal, Nav dropdowns.

Every animated component checks `prefers-reduced-motion`:

```svelte
<script>
	import { browser } from '$app/environment';

	const reducedMotion = $derived(
		browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
</script>

{#if open}
	<div transition:slide={{ duration: reducedMotion ? 0 : 200 }}>...</div>
{/if}
```

For the theme layer, CSS transitions also respect reduced motion via the token system (duration tokens collapse to `0ms` under the media query).

### Accessibility Baseline (every component)

- Semantic HTML elements (not `<div>` soup)
- Visible `:focus-visible` ring
- `prefers-reduced-motion` respected
- Color contrast ≥ 4.5:1 (AA normal text)
- Touch targets ≥ 44×44 CSS pixels on interactive elements
- Screen reader announcements where state changes aren't visible

---

## Workflow: Extract → Package → Refactor

1. **Audit existing sites** (hyzer.sh, heffner.dev) for component patterns already in use
2. **Extract** each pattern into the headless component, keeping the behavior and stripping the visual CSS
3. **Build the component** in the library with full a11y, keyboard support, and data attributes
4. **Write the reference theme** that approximates the existing visual style
5. **Write the docs page** with demos, props table, a11y notes
6. **Refactor the source site** to import from `@hyzer/ui` and apply site-specific styles
7. **Test** the refactored site to confirm behavior parity

The library isn't designed in a vacuum — it's validated against real production UI from day one.
