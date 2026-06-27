# Spec: Icons

## Goal
Ship a complete, tree-shakeable set of SVG icon components (14 UI icons + 7 brand icons) exported from `$lib/icons`, all conforming to one shared, accessibility-aware interface.

## Requirements

1. **Shared interface.** Every icon component accepts these documented props: `size?: number` (default `24`), `strokeWidth?: number` (default `2`), `class?: string` (default `undefined`), `ariaLabel?: string` (default `undefined`). All four are shared across UI and brand icons (brand icons accept `strokeWidth` but ignore it — see R6). In addition, any other attribute is forwarded to the `<svg>` via `...rest` (see R12).
2. **Decorative vs. informative a11y.** When `ariaLabel` is omitted or an empty string, the `<svg>` renders `aria-hidden="true"` and no `role` and no `aria-label`. When `ariaLabel` is a non-empty string, the `<svg>` renders `role="img"` and `aria-label="<value>"` and does **not** render `aria-hidden`.
3. **Sizing.** `size` sets both the `width` and `height` attributes (in px) on the `<svg>`. `viewBox` is always `0 0 24 24` regardless of `size`.
4. **Color inheritance.** UI icons use `stroke="currentColor"` with `fill="none"`; brand icons use `fill="currentColor"` with no stroke. No icon hardcodes a literal color value.
5. **Class hook.** Every `<svg>` carries the base class `hz-icon`. A consumer-supplied `class` is appended after it (composed via the existing `cx` util), yielding e.g. `class="hz-icon my-custom"`. With no `class` prop the attribute is exactly `hz-icon`.
6. **UI icon stroke weight.** UI icons bind `stroke-width={strokeWidth}` and set `stroke-linecap="round"` and `stroke-linejoin="round"`. `strokeWidth` has no visual effect on brand icons (fill-based); brand icons render no `stroke-width` attribute.
7. **UI icon set.** These 14 UI components exist: `IconChevronDown`, `IconChevronRight`, `IconChevronUp`, `IconChevronLeft`, `IconX`, `IconMenu`, `IconExternalLink`, `IconCheck`, `IconMinus`, `IconPlus`, `IconSearch`, `IconLoader`, `IconArrowLeft`, `IconArrowRight`.
8. **Brand icon set.** These 7 components exist: `IconGithub`, `IconLinkedin`, `IconTwitterX`, `IconFacebook`, `IconInstagram`, `IconYoutube`, `IconRss`.
9. **Path data source.** UI icon path geometry uses Lucide (ISC) path data; brand mark geometry uses Simple Icons (CC0) path data. Both are 24×24. Each icon file includes a short code comment attributing its source.
10. **Barrel export.** All 21 components are re-exported by name from `src/lib/icons/index.ts` and resolvable from the `$lib/icons` subpath (`./icons` in the package exports map).
11. **Existing icons retrofitted.** The three pre-existing components (`IconChevronDown`, `IconMenu`, `IconLoader`) are updated to conform to R1–R6 and R12 (adding `strokeWidth`, `class`, the `hz-icon` base class, and rest forwarding) without breaking their current consumers (`Button`, `Nav`).
12. **Rest forwarding.** Any attribute beyond the four documented props is spread onto the `<svg>` so consumers can directly set presentational attributes (`fill`, `stroke`, `style`, `data-*`, etc.). Precedence: the `...rest` spread is placed so consumer values override the component's **default presentational** attributes (`fill`, `stroke`), but the following managed attributes always win and cannot be clobbered by rest: the composed `class` (R5), `width`/`height`/`viewBox` (R3), `stroke-width` (R6, UI icons), and the accessibility attributes derived from `ariaLabel` (`aria-hidden` / `role` / `aria-label`, R2). The rest type is `SVGAttributes<SVGSVGElement>` (from `svelte/elements`).
13. **File/naming convention.** One component per file at `src/lib/icons/Icon<Name>.svelte`, PascalCase matching the export name. Each uses the Svelte 5 `$props()` + `interface Props` shape established by the existing icons.

## Responsive Behavior
Not applicable in the layout sense — icons are fixed-size inline SVGs controlled by the `size` prop and the `currentColor`/font context of their parent. Icons must not set `max-width`, media queries, or intrinsic responsive behavior; any responsive sizing is the consumer's concern. No breakpoint-specific behavior to verify at mobile (<640px), tablet (640–1024px), or desktop (>1024px).

## Accessibility
- **WCAG 2.1 AA, 1.1.1 Non-text Content:** decorative icons are removed from the accessibility tree (`aria-hidden="true"`); informative icons expose a text alternative via `role="img"` + `aria-label` (R2).
- **Empty label:** `ariaLabel=""` is treated as absent → decorative (R2).
- **No focusable SVGs:** icons are not interactive and receive no `tabindex`; focus/interactivity is owned by the wrapping element (e.g. `Button`, `Link`).
- **Color contrast:** icons inherit `currentColor` and impose no color, so contrast is the responsibility of the consuming context. No contrast assertion at the icon level.
- **Reduced motion:** these components render static SVGs with no embedded `<animate>` elements or inline animation. `IconLoader` ships static; any spin animation is applied by the consumer's CSS (as `Button` does today).

## Edge Cases & Error States
| Case | Expected behavior |
| --- | --- |
| `ariaLabel` omitted | `aria-hidden="true"`, no `role`, no `aria-label` |
| `ariaLabel=""` | Treated as decorative (same as omitted) |
| `ariaLabel="Close"` | `role="img"`, `aria-label="Close"`, no `aria-hidden` |
| `size` omitted | `width="24" height="24"` |
| `size={16}` | `width="16" height="16"`, `viewBox` unchanged at `0 0 24 24` |
| `strokeWidth` omitted | UI icon `stroke-width="2"` |
| `strokeWidth={1.5}` | UI icon `stroke-width="1.5"` |
| `class` omitted | `class="hz-icon"` exactly |
| `class="foo bar"` | `class="hz-icon foo bar"` |
| `strokeWidth` on a brand icon | No `stroke-width` rendered; prop has no visual effect |
| Rest attr `fill="red"` on a UI icon | `fill="red"` overrides the default `fill="none"` |
| Rest attr `data-testid="x"` | Forwarded to the `<svg>` |
| Rest attempt to set `class`/`aria-hidden`/`width` | Ignored; managed values win (R12) |

## Existing Code to Reuse
- `src/lib/utils/index.ts` → **`cx`** for composing `hz-icon` with the consumer `class` (R5). Do not write new class-merging logic.
- `src/lib/icons/IconChevronDown.svelte`, `IconMenu.svelte`, `IconLoader.svelte` → existing component shape (Svelte 5 `$props()` + `interface Props`) is the template for all new icons; retrofit per R11.
- `src/lib/icons/index.ts` → existing barrel; extend it, do not replace.
- The existing `<svg>` attribute baseline in the current icon files (`xmlns="http://www.w3.org/2000/svg"`, `viewBox="0 0 24 24"`, `fill`, `stroke`, `stroke-linecap`, `stroke-linejoin`) is the canonical UI-icon template; keep `xmlns` so icons are valid standalone SVGs.
- Consumers that must keep working unchanged: `src/lib/components/Button.svelte` (`IconLoader`), `src/lib/components/Nav.svelte` (`IconMenu`, `IconChevronDown`).

## Test Plan
Framework: **Vitest** in browser mode via **`vitest-browser-svelte`** (`render` + `page` from `vitest/browser`), co-located as `src/lib/icons/Icon<Name>.svelte.spec.ts`, matching the conventions in `src/lib/components/Button.svelte.spec.ts`. The existing `src/lib/exports.spec.ts` is extended for barrel coverage.

**Unit — shared-interface behavior** (asserted against a representative UI icon and a representative brand icon; parameterize over all 21 where practical):
- R2: no `ariaLabel` → svg has `aria-hidden="true"`, no `role`; `ariaLabel="Test"` → `role="img"`, `aria-label="Test"`, no `aria-hidden`; `ariaLabel=""` → decorative.
- R3: default → `width="24"`/`height="24"`; `size={16}` → `16`/`16`; `viewBox` stays `0 0 24 24`.
- R4: UI icon svg has `stroke="currentColor"` + `fill="none"`; brand icon svg has `fill="currentColor"` and no `stroke`.
- R5: default `class` attribute equals `hz-icon`; `class="foo"` → `hz-icon foo`.
- R6: UI icon default `stroke-width="2"`; `strokeWidth={1.5}` → `stroke-width="1.5"`; brand icon renders no `stroke-width`.
- R12: rest `fill="red"` overrides default fill on a UI icon; rest `data-testid="x"` is forwarded; rest `class="z"` / `aria-hidden="false"` do **not** override the managed `class` / a11y attributes.

**Unit — set completeness:**
- R7/R8: each of the 21 named components renders an `<svg.hz-icon>` without throwing.

**Integration — barrel/exports** (extend `exports.spec.ts`):
- R10: `import('$lib/icons')` exposes all 21 named exports as defined values.
- R11: `Button` still renders its loader svg and `Nav` still renders menu/chevron — verified by their existing spec files continuing to pass (no regression).

**e2e:** none required; icons have no standalone routed behavior. `landing.e2e.ts` remains the only e2e surface.

## Out of Scope
- Any new icons beyond the 21 listed.
- A docs-site visual reference / gallery page (future work).
- Animation/spin styling for `IconLoader` (owned by consuming CSS).
- Icon-button or icon-wrapper components.
- Changing the public API of `Button`, `Nav`, `Footer`, or any consumer.
- Per-path `fill`/`stroke` overrides or multi-color icons (beyond the single-color rest override in R12).
