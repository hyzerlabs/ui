# Button Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (Rn) and edge case as pass/fail. Write scope for the Builder is
> the library source; do not add visual styling (theme is a separate sprint).

### Goal

Ship a headless, accessible Svelte 5 `Button` that renders a native `<button>`
(or `<a role="button">` when `href` is set), exposing variant/intent/size/state
via data attributes with zero visual CSS, so any consuming site styles it via
the documented hooks.

### Context & Conventions

- Svelte 5 **runes mode** is forced project-wide; component is TypeScript.
- Headless contract (`original-specs/00-architecture.md`): root element gets
  `class="hz-button"`, `data-variant`, `data-intent`, `data-size`, `data-state`;
  **no colors/spacing/borders/fonts/animation** ship in the component. Visual
  styling lives in the Sprint-4 theme (`src/lib/theme/button.css`) — out of scope.
- Component file: `src/lib/components/Button.svelte`.
- Export from the barrel `src/lib/components/index.ts` (currently exports only
  `Placeholder`), resolvable via `import { Button } from '$lib'`.
- Shared types: `src/lib/types/index.ts`.

### Props

| Prop         | Type                                        | Default     |
| ------------ | ------------------------------------------- | ----------- |
| variant      | `'solid' \| 'outline' \| 'ghost' \| 'link'` | `'solid'`   |
| intent       | `'primary' \| 'secondary' \| 'danger'`      | `'primary'` |
| size         | `'sm' \| 'md' \| 'lg'`                      | `'md'`      |
| disabled     | `boolean`                                   | `false`     |
| loading      | `boolean`                                   | `false`     |
| loadingLabel | `string`                                    | `'Loading'` |
| fullWidth    | `boolean`                                   | `false`     |
| href         | `string \| undefined`                       | —           |
| type         | `'button' \| 'submit' \| 'reset'`           | `'button'`  |
| ariaLabel    | `string \| undefined`                       | —           |
| onclick      | `(e: MouseEvent) => void` \| undefined      | —           |

Snippet props: `children` (label), `iconStart`, `iconEnd`. Arbitrary extra HTML
attributes are accepted via `...rest` (R15).

### Requirements

Each is a testable assertion.

1. **R1 — Default render.** With no props, renders a `<button>` with
   `class="hz-button"`, `type="button"`, `data-variant="solid"`,
   `data-intent="primary"`, `data-size="md"`, and no `data-state` /
   `data-full-width`.
2. **R2 — Children.** Renders the `children` snippet as the button label content.
3. **R3 — Variant.** `variant` accepts `'solid' | 'outline' | 'ghost' | 'link'`
   (the shared `Variant` type from `src/lib/types/index.ts`), defaults `'solid'`,
   reflected verbatim in `data-variant`.
4. **R4 — Intent.** `intent` accepts the local literal union
   `'primary' | 'secondary' | 'danger'`, defaults `'primary'`, reflected in
   `data-intent`. (The shared `Intent` type is a superset and is intentionally
   not used here.)
5. **R5 — Size.** `size` accepts the local literal union `'sm' | 'md' | 'lg'`,
   defaults `'md'`, reflected in `data-size`. (Full-width is a separate concern,
   see R7 — there is no `full` size value.)
6. **R6 — type.** `type` (`'button' | 'submit' | 'reset'`, default `'button'`)
   sets the native `type` attribute on the `<button>`. Ignored when rendering an
   anchor (R8).
7. **R7 — fullWidth.** When `fullWidth` is true, root gets a boolean-present
   `data-full-width` attribute (no value); absent otherwise. The component
   applies no width CSS itself.
8. **R8 — Anchor rendering.** When `href` is a **non-empty** string and the
   button is not disabled/loading, renders `<a class="hz-button" role="button"
href="…">` instead of `<button>`. Data attributes from R3–R5, R7 still apply.
9. **R9 — Disabled.** When `disabled` is true: root carries `aria-disabled="true"`
   and `data-state="disabled"`. The native `disabled` attribute is **not** used
   (so screen readers can still focus it). Activation is prevented: `onclick` is
   not invoked, and for the anchor form the `href` attribute is **omitted** so
   navigation cannot occur.
10. **R10 — Loading.** When `loading` is true: root carries `aria-busy="true"`
    and `data-state="loading"`. A loading indicator renders using the
    `IconLoader` icon from `$lib/icons` with `aria-hidden="true"`, **plus** an
    `sr-only` `<span>` containing the `loadingLabel` text (default `"Loading"`).
    Activation is prevented exactly as in R9 (no `onclick`; anchor `href`
    omitted).
11. **R11 — State precedence.** If both `disabled` and `loading` are true,
    `data-state="disabled"` wins (single value), `aria-disabled="true"` is
    present, and `aria-busy="true"` is still present. Activation is prevented.
12. **R12 — Icon snippets.** `iconStart` and `iconEnd` snippet props render
    before/after the label respectively, in DOM order. The component ships no
    layout CSS; keeping icons + label on one line (`white-space: nowrap`) is the
    theme's responsibility.
13. **R13 — ariaLabel.** When `ariaLabel` is set, it is applied as `aria-label`
    on the root element.
14. **R14 — Icon-only guard.** When no `children` snippet is provided and at
    least one of `iconStart`/`iconEnd` is, and `ariaLabel` is absent, the
    component logs a `console.warn` (dev) describing the missing accessible name.
    It still renders (does not throw).
15. **R15 — onclick + attribute forwarding.** Accepts an `onclick` handler prop
    and forwards arbitrary extra HTML attributes (`...rest`) onto the root
    element. When disabled or loading, `onclick` is swallowed (not called) and,
    for the anchor, default navigation is prevented. Forwarded attributes must
    not overwrite component-managed attributes (`class`, `data-variant/intent/
size/state`, `data-full-width`, `aria-disabled`, `aria-busy`, `type`, `href`,
    `role`).
16. **R16 — Barrel export.** `Button` is exported from
    `src/lib/components/index.ts` and resolvable via `import { Button } from
'$lib'`.

### Responsive Behavior

The component ships no layout CSS; responsiveness is structural only.

- **Mobile (<640px):** Tap-target minimums must be reachable by theme styling —
  `sm` 32px, `md` 40px, `lg` 48px min height/width (documented hooks; the
  headless component does not enforce pixel sizes but must not prevent them).
  Label + icons stay on one line (theme concern, R12).
- **Tablet (640–1024px):** Identical structure; no reflow.
- **Desktop (>1024px):** Identical structure; no reflow.
- **fullWidth:** `data-full-width` is the hook a theme uses to set `width: 100%`
  at any breakpoint; the component itself does not change width.

### Accessibility (WCAG 2.1 AA)

- Native `<button>` by default; `<a role="button">` only when `href` is set.
- Disabled state uses `aria-disabled="true"` (not native `disabled`) so the
  control stays focusable while activation is blocked.
- Loading state sets `aria-busy="true"` and announces via an `sr-only`
  `loadingLabel` text node; the `IconLoader` spinner is `aria-hidden="true"`.
- Icon-only usage requires `ariaLabel` (dev warning per R14) to satisfy 4.1.2
  Name, Role, Value.
- Keyboard: `<button>` is natively Enter/Space activated; the anchor form is
  Enter activated. Focus order follows DOM order. The element remains in the tab
  order even when disabled (intentional).
- Focus indication: the component must not set `outline: none`; a visible
  `:focus-visible` ring is the theme's responsibility.
- Color contrast: N/A in the headless component (no colors shipped).
- Reduced motion: the spinner carries no animation CSS in the component; any
  spin animation lives in the theme and must respect `prefers-reduced-motion`
  there.

### Edge Cases & Error States

| Case                                                                 | Expected behavior                                                                                                     |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| No children, no icons                                                | Renders empty button; R14 warning does **not** fire.                                                                  |
| Icon-only, no `ariaLabel`                                            | Renders; dev `console.warn` fires (R14).                                                                              |
| `href=""` (empty string)                                             | Treated as no href → renders `<button>` (R8 requires non-empty).                                                      |
| `href` set + `disabled`                                              | `<a role="button" aria-disabled="true" data-state="disabled">` with **no** `href` attribute; click does not navigate. |
| `href` set + `loading`                                               | As above but `data-state="loading"` + `aria-busy="true"` + spinner + sr-only `loadingLabel`.                          |
| `disabled` + `loading` both true                                     | `data-state="disabled"`, both `aria-disabled` and `aria-busy` present, activation blocked (R11).                      |
| `onclick` provided + disabled/loading                                | Handler is not invoked.                                                                                               |
| Long label text                                                      | No truncation by the component; wrapping is a theme concern; icon/label grouping does not break.                      |
| Extra HTML attrs via `...rest` (e.g. `data-testid`, `aria-haspopup`) | Forwarded to root; must not clobber component-managed attributes (R15).                                               |
| `type="submit"` inside a form                                        | Native submit works on the `<button>` form; ignored on anchor form.                                                   |

### Existing Code to Reuse

- **Types:** `src/lib/types/index.ts` — import `Variant` for the `variant` prop;
  do **not** redefine it. `intent` and `size` use local literal unions narrower
  than the shared `Intent`/`Size` types (R4, R5).
- **Utils:** `src/lib/utils/index.ts` is currently a placeholder. Implement only
  the utilities Button actually needs (`cx` for class composition and `uid` for
  associating the `sr-only` loading text, if used) as part of this work, exported
  from `$lib/utils`. Do not inline duplicates elsewhere.
- **Icons:** `src/lib/icons/index.ts` is currently a placeholder. Stub the
  `IconLoader` icon component now (24×24 viewbox, stroke-based, `currentColor`,
  `aria-hidden` when no `ariaLabel`, per `original-specs/15-icons.md`) and export
  it from `$lib/icons`. Button consumes `IconLoader` for the spinner (R10).
- **Test patterns:** Follow `src/lib/components/Placeholder.svelte.spec.ts` —
  Vitest browser mode via `vitest-browser-svelte` (`render`, `page.getBy*`,
  `await expect.element(...)`). Note `expect: { requireAssertions: true }` in
  `vite.config.ts` — every test must assert.
- **Export pattern:** mirror the existing `export { default as Placeholder }` in
  `src/lib/components/index.ts`.
- **Headless conventions:** `class="hz-button"` + data attributes per
  `original-specs/00-architecture.md`.

### Test Plan

Runner: **Vitest** browser (chromium) project with `vitest-browser-svelte`.
Component test file: `src/lib/components/Button.svelte.spec.ts` (the
`.svelte.spec.ts` suffix routes it to the browser `client` project in
`vite.config.ts`). No Playwright e2e (no route; docs demo is Sprint 4).

**Unit / component (browser):**

- R1: default render → tag is `BUTTON`, class, `type="button"`, default data
  attributes, absence of `data-state` / `data-full-width`.
- R2: `children` snippet → label text present.
- R3–R5: each variant/intent/size value → corresponding `data-*` attribute
  (parametrized).
- R6: `type="submit"` → native `type` attribute equals `submit`.
- R7: `fullWidth` → `data-full-width` present; absent by default.
- R8: `href="/x"` → tag is `A`, `role="button"`, `href="/x"`, data attributes
  intact.
- R9: `disabled` → `aria-disabled="true"`, `data-state="disabled"`, no native
  `disabled` attr; `onclick` not called on click.
- R9 anchor: `href` + `disabled` → no `href` attribute on the `<a>`; click does
  not navigate.
- R10: `loading` → `aria-busy="true"`, `data-state="loading"`, `IconLoader`
  rendered with `aria-hidden="true"`, sr-only text equals `loadingLabel`
  (default "Loading"); custom `loadingLabel` reflected; `onclick` not called.
- R11: `disabled` + `loading` → `data-state="disabled"`, both aria attrs present,
  click blocked.
- R12: `iconStart`/`iconEnd` snippets → rendered in correct order relative to
  label.
- R13: `ariaLabel="Save"` → `aria-label="Save"` on root.
- R14: icon-only without `ariaLabel` → `console.warn` spy called once; with
  `ariaLabel`, spy not called.
- R15: `onclick` fires on normal click; `...rest` attr (e.g. `data-testid`)
  forwarded; rest cannot overwrite managed attributes.
- R16: `import { Button } from '$lib'` resolves (assert in the existing
  `src/lib/exports.spec.ts` style or a dedicated test).

**Integration:** R6 submit inside a `<form>` triggers submit; a disabled button
inside a form does not submit.

### Out of Scope

- Visual styling / the reference theme (`src/lib/theme/button.css`) — Sprint 4.
- Building the full Icons set and full Utils API beyond what Button consumes
  (only `IconLoader` and the specific utilities Button needs are in scope here).
- A docs demo route and Playwright e2e for Button — Sprint 4.
- External-link handling (`target`/`rel`) — that is the `Link` component's job
  (`original-specs/02-link.md`); Button's `href` is for action-styled links only.
- Button groups, toggle/pressed (`aria-pressed`) buttons, split buttons, menu
  buttons.
