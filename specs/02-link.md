# Link Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (Rn) and edge case as pass/fail. Write scope for the Builder is
> the library source; do not add visual styling (theme is a separate sprint).

### Goal

Ship a headless, accessible Svelte 5 `Link` that always renders a native `<a>`,
handles external-tab semantics behind an explicit `external` prop, and exposes
variant/size and active state via data/ARIA attributes with zero visual CSS, so
any consuming site styles it via the documented hooks.

### Context & Conventions

- Svelte 5 **runes mode** is forced project-wide; component is TypeScript.
- Headless contract (`original-specs/00-architecture.md`): root element gets
  `class="hz-link"`, `data-variant`, `data-size`, and state hooks; **no
  colors/spacing/borders/fonts/animation/underline** ship in the component.
  Visual styling lives in the Sprint-4 theme (`src/lib/theme/link.css`) — out of
  scope.
- Component file: `src/lib/components/Link.svelte`.
- Export from the barrel `src/lib/components/index.ts` (currently exports
  `Placeholder` and `Button`), resolvable via `import { Link } from '$lib'`.
- Mirror the existing `Button` component for prop destructuring, `...rest`
  forwarding, and the `sr-only` announcement pattern.

### Props

| Prop        | Type                                       | Default     |
| ----------- | ------------------------------------------ | ----------- |
| href        | `string`                                   | _required_  |
| external    | `boolean`                                  | `false`     |
| variant     | `'default' \| 'subtle' \| 'nav'`           | `'default'` |
| size        | `'sm' \| 'md' \| 'lg'`                     | `'md'`      |
| ariaCurrent | `'page' \| 'step' \| 'true' \| undefined`  | —           |
| ariaLabel   | `string \| undefined`                      | —           |
| class       | `string \| undefined`                      | —           |
| onclick     | `(e: MouseEvent) => void \| undefined`     | —           |

Snippet props: `children` (link content), `iconStart`, `iconEnd`. Arbitrary
extra HTML attributes are accepted via `...rest` (R13). `class` is destructured
as a named prop (`class: className`) — it does **not** flow through `...rest`.

### Requirements

Each is a testable assertion.

1. **R1 — Default render.** With `href="/x"` and no other props, renders an
   `<a>` with `class="hz-link"`, `href="/x"`, `data-variant="default"`,
   `data-size="md"`, and **no** `data-external`, **no** `target`/`rel`, **no**
   `aria-current`.
2. **R2 — Children.** Renders the `children` snippet as the link content.
3. **R3 — Variant.** `variant` accepts the local literal union
   `'default' | 'subtle' | 'nav'`, defaults `'default'`, reflected verbatim in
   `data-variant`. (The shared `Variant` type has different values and is
   intentionally not used here.)
4. **R4 — Size.** `size` accepts the local literal union `'sm' | 'md' | 'lg'`,
   defaults `'md'`, reflected in `data-size`. (Narrower than the shared `Size`
   type, which is intentionally not used here.)
5. **R5 — href verbatim.** `href` is rendered exactly as provided onto the `<a>`,
   **including the empty string** (`href=""`). The component always renders an
   `<a>`; there is **no** fallback element (no `<span>`), **no** href default,
   and **no** `console.warn` for empty or missing href.
6. **R6 — External (explicit prop only).** When `external` is `true`, the `<a>`
   gets `target="_blank"`, `rel="noopener noreferrer"`, a boolean-present
   `data-external` attribute (no value), and an appended `sr-only` `<span>`
   containing the literal text `(opens in new tab)`. When `external` is `false`
   (default), **none** of these are present. External behavior is driven
   **exclusively** by the `external` prop — the component performs **no**
   auto-detection from the `href` scheme, host, or protocol.
7. **R7 — No visible external icon.** The component renders **no**
   `IconExternalLink` and no other automatic visible external indicator. The
   only built-in external affordance is the `sr-only` announcement from R6.
   A visible external glyph is a consumer concern, supplied via the `iconEnd`
   snippet (R10).
8. **R8 — aria-current (no data-current).** When `ariaCurrent` is set, it is
   applied verbatim as the `aria-current` attribute on the `<a>`; absent when
   `undefined`. The component emits **no** `data-current` attribute — themes
   style the active link off the `[aria-current]` selector directly.
9. **R9 — ariaLabel.** When `ariaLabel` is set, it is applied as `aria-label`
   on the root `<a>`.
10. **R10 — Icon snippets.** `iconStart` and `iconEnd` snippet props render
    before/after the `children` content respectively, in DOM order. The
    component ships no layout CSS; keeping icons + content on one line is the
    theme's responsibility. When `external` is true, the `sr-only` announcement
    (R6) renders after `iconEnd`.
11. **R11 — class prop composition.** The rendered `class` attribute is
    `hz-link` composed with the consumer's `class` value via `cx` from
    `$lib/utils`, in that order: `cx('hz-link', className)`. `hz-link` is always
    first and can **never** be removed or overridden. When `class` is omitted,
    the rendered value is exactly `hz-link`. When `class="foo bar"`, the rendered
    value is `hz-link foo bar`.
12. **R12 — Icon-only guard.** When no `children` snippet is provided and at
    least one of `iconStart`/`iconEnd` is, and `ariaLabel` is absent, the
    component logs a `console.warn` (dev only) describing the missing accessible
    name. It still renders (does not throw). Mirrors `Button` R14.
13. **R13 — onclick + attribute forwarding.** Accepts an `onclick` handler prop
    and forwards arbitrary extra HTML attributes (`...rest`) onto the root `<a>`.
    Forwarded attributes must **not** overwrite component-managed attributes
    (`class`, `href`, `data-variant`, `data-size`, `data-external`, `target`,
    `rel`, `aria-current`, `aria-label`).
14. **R14 — Barrel export.** `Link` is exported from
    `src/lib/components/index.ts` and resolvable via
    `import { Link } from '$lib'`.

### Responsive Behavior

The component ships no layout CSS; responsiveness is structural only.

- **Mobile (<640px):** Identical structure. `nav`-variant tap-target minimums
  must be reachable by theme styling (the headless component does not enforce
  pixel sizes but must not prevent them). Content + icons stay on one line
  (theme concern, R10).
- **Tablet (640–1024px):** Identical structure; no reflow.
- **Desktop (>1024px):** Identical structure; no reflow.

### Accessibility (WCAG 2.1 AA)

- Always a native `<a>` element with correct link semantics and native
  keyboard activation (Enter). Focus order follows DOM order.
- **Never rely on color alone** (1.4.1): an underline (or equivalent
  non-color affordance) is required, but is supplied by the theme via the
  `hz-link` / `data-variant` hooks — the headless component ships no underline
  CSS and must not set `text-decoration: none`.
- External links announce `(opens in new tab)` to screen readers via the
  `sr-only` span (R6), satisfying 3.2.5 / G201 expectations for new-window
  links.
- `aria-current` conveys navigation context (active page, current step) to
  assistive technology (R8).
- Icon-only usage requires `ariaLabel` to satisfy 4.1.2 Name, Role, Value; a
  dev warning fires otherwise (R12).
- Focus indication: the component must not set `outline: none`; a visible
  `:focus-visible` ring is the theme's responsibility.
- Color contrast: N/A in the headless component (no colors shipped).
- Reduced motion: the component ships no animation; N/A here.

### Edge Cases & Error States

| Case                                                            | Expected behavior                                                                                                |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `href=""` (empty string)                                       | Rendered verbatim as `<a href="">`; no fallback element, no warning (R5).                                        |
| `external` with an internal-looking `href` (e.g. `/docs`)      | Still gets `target`/`rel`/`data-external` + sr-only announcement — driven by the prop, not the href (R6).        |
| Absolute external URL without `external` prop (e.g. `https://…`)| Treated as a normal link: no `target`/`rel`/`data-external`, no announcement (no auto-detection, R6).            |
| Icon-only, no `ariaLabel`                                      | Renders; dev `console.warn` fires (R12).                                                                         |
| No children, no icons                                          | Renders an empty `<a>`; R12 warning does **not** fire.                                                           |
| `class="foo"` provided                                         | Rendered `class="hz-link foo"`; `hz-link` first and never removable (R11).                                       |
| Rest attr attempts to set `class`/`data-variant`/`target` etc. | Component-managed value wins; rest cannot clobber managed attributes (R13).                                      |
| Long content                                                   | No truncation by the component; wrapping is a theme concern; icon/content grouping does not break.               |
| `ariaCurrent="page"`                                           | `aria-current="page"` present; no `data-current` attribute emitted (R8).                                         |

### Existing Code to Reuse

- **Utils:** `src/lib/utils/index.ts` — import `cx` for the R11 class
  composition (`cx('hz-link', className)`). Do **not** inline a duplicate. `uid`
  is not required (the `sr-only` text lives inside the `<a>` and contributes to
  the accessible name directly).
- **Types:** `src/lib/types/index.ts` — `variant` and `size` use local literal
  unions (values differ from / are narrower than the shared `Variant`/`Size`
  types), mirroring how `Button` declares `ButtonIntent`/`ButtonSize` locally.
  Reuse `ariaCurrent`'s value union (`'page' | 'step' | 'true'`) consistent with
  `NavItem.ariaCurrent`.
- **Component pattern:** mirror `src/lib/components/Button.svelte` for `$props()`
  destructuring, `...rest` forwarding order (rest spread first so managed
  attributes win), the `import.meta.env.DEV` icon-only warning (R12), and the
  `class="sr-only"` announcement span (R6).
- **Test patterns:** Follow `src/lib/components/Button.svelte.spec.ts` — Vitest
  browser mode via `vitest-browser-svelte` (`render`, `page.getBy*`,
  `await expect.element(...)`, `createRawSnippet` for snippet props). Note
  `expect: { requireAssertions: true }` in `vite.config.ts` — every test must
  assert.
- **Export pattern:** mirror the existing `export { default as Button }` in
  `src/lib/components/index.ts`; add a `Link` assertion to
  `src/lib/exports.spec.ts`.
- **Headless conventions:** `class="hz-link"` + data attributes per
  `original-specs/00-architecture.md`.

### Test Plan

Runner: **Vitest** browser (chromium) project with `vitest-browser-svelte`.
Component test file: `src/lib/components/Link.svelte.spec.ts` (the
`.svelte.spec.ts` suffix routes it to the browser `client` project in
`vite.config.ts`). No Playwright e2e (no route; docs demo is Sprint 4).

**Unit / component (browser):**

- R1: `href="/x"` default render → tag is `A`, `class="hz-link"`, `href="/x"`,
  `data-variant="default"`, `data-size="md"`; absence of `data-external`,
  `target`, `rel`, `aria-current`.
- R2: `children` snippet → content text present.
- R3: each variant value (`default`/`subtle`/`nav`) → corresponding
  `data-variant` (parametrized).
- R4: each size value (`sm`/`md`/`lg`) → corresponding `data-size`
  (parametrized).
- R5: `href=""` → `<a>` rendered with `href` attribute equal to `""`; no warning
  spy fired; tag is `A`.
- R6: `external: true` → `target="_blank"`, `rel="noopener noreferrer"`,
  `data-external` present, `sr-only` span text equals `(opens in new tab)`.
  `external: false`/default → none of those present.
- R6 (no auto-detect): `href="https://example.com"` without `external` → no
  `target`/`rel`/`data-external`/announcement. `external: true` with `href="/x"`
  → all external attributes present.
- R7: with `external: true`, assert no `IconExternalLink`/`svg` external glyph is
  rendered by the component (only the `sr-only` text); `iconEnd` snippet renders
  when supplied.
- R8: `ariaCurrent="page"` → `aria-current="page"` present and **no**
  `data-current` attribute; default → no `aria-current`.
- R9: `ariaLabel="Docs"` → `aria-label="Docs"` on root.
- R10: `iconStart`/`iconEnd` snippets → rendered in correct order relative to
  `children`; with `external: true`, `sr-only` announcement follows `iconEnd`.
- R11: no `class` → rendered `class` equals `hz-link`; `class="foo bar"` →
  rendered `class` equals `hz-link foo bar` (order asserted).
- R12: icon-only without `ariaLabel` → `console.warn` spy called once and message
  contains `ariaLabel`; with `ariaLabel`, spy not called; empty link (no
  children, no icons) → spy not called.
- R13: `onclick` fires on click; `...rest` attr (e.g. `data-testid`) forwarded;
  rest cannot overwrite managed attributes (assert managed `class`,
  `data-variant`, and `target` survive an override attempt).
- R14: `import { Link } from '$lib'` resolves (assert in the existing
  `src/lib/exports.spec.ts` style plus a dedicated test).

### Out of Scope

- Visual styling / the reference theme (`src/lib/theme/link.css`), including the
  default underline and any `[aria-current]` active styling — Sprint 4.
- Auto-detection of external links from the `href` scheme/host — external is an
  explicit prop only.
- Any automatic visible external-link icon (`IconExternalLink`) — consumers use
  the `iconEnd` snippet.
- A `data-current` attribute — themes target `[aria-current]` directly.
- `href` validation, normalization, fallback elements, or warnings.
- A docs demo route and Playwright e2e for Link — Sprint 4.
- Action-styled links that render as buttons — that is `Button`'s `href`
  (`specs/01-button.md`).
- Framework router integration (SvelteKit prefetch/`data-sveltekit-*`,
  client-side navigation hooks) — plain `<a>` only; consumers add such
  attributes via `...rest`.
