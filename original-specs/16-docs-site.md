# Docs Site (design.hyzer.sh)

Built with the library's own components + the reference theme. Dogfooding.

---

## Per-Component Page

Every component gets a documentation page containing:

- **Live interactive demos** with toggleable prop controls
- **Rendered HTML output** — inspect the actual DOM structure the component produces
- **Usage code snippets** — copy-paste ready, showing import and basic usage
- **Full props table** — type, default, description for every prop
- **Slots documentation** — what each slot expects and where it renders
- **Data attributes reference** — every `data-*` attribute the component exposes, for styling
- **Accessibility checklist** — specific WCAG criteria met, with links to the relevant specs
- **Keyboard interaction table** — every key and what it does (for interactive components)

## Token Tools (docs site only, not in the package)

### Color Explorer

Interactive grid of all color tokens. Features:

- Swatch grid with hex values displayed
- Pick any two tokens as foreground + background
- Live contrast ratio calculation using `contrastRatio()` from `@hyzer/ui/utils`
- Pass/fail badges for:
  - WCAG AA — normal text (< 18px): requires 4.5:1
  - WCAG AA — large text (≥ 18px or ≥ 14px bold): requires 3:1
  - WCAG AAA — normal text: requires 7:1
  - WCAG AAA — large text: requires 4.5:1
- Visual preview rendering the foreground color on the background color
- Reverse button to swap foreground/background

### Type Scale Preview

- Renders each size token (`--hz-text-xs` through `--hz-text-4xl`) at its actual size
- Toggle between configured font families and weights
- Show computed pixel values at each step
- Preview with real paragraph text, not just "The quick brown fox"

### Spacing Scale

- Visual blocks at each spacing value
- Pixel value annotated beside each
- Both horizontal and vertical representation

### Icon Reference

- Visual grid of all icons at default size
- Search/filter by name
- Click to copy import snippet
- Size preview (toggle between 16, 20, 24, 32)

## Theming Guide

Dedicated page covering:

- How to use data attributes for styling (with examples)
- How to override tokens (CSS custom property overrides)
- How to build a complete custom theme from scratch
- Example: styling every state of Button from zero
- Example: theming a full page layout with all components
- Dark mode implementation guide

## Getting Started

- Installation
- Setup (importing tokens)
- First component usage
- TypeScript configuration
- Framework integration notes (SvelteKit, standalone Svelte)

## Accessibility Guide

- Library-wide accessibility philosophy
- How to test components with screen readers
- Keyboard navigation patterns used
- WCAG 2.2 AA compliance details
- Common accessibility mistakes and how the library prevents them
