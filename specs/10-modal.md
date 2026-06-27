# Modal Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Modal-Rn`) and edge case as pass/fail. Write scope for the
> Builder is the library source (`src/lib/**`).

### Goal

Ship one headless, accessible Svelte 5 `Modal` built on the native `<dialog>`
element + `showModal()` — exposing `open`/`size`/dismissal behavior through
`bind:open`, an `onclose` callback, and `hz-*` class / `data-*` hooks — leaning
on the platform for focus trapping, top-layer stacking, and the backdrop, while
shipping only the **minimal structural CSS** the regions need and **no** visual
opinions (no colors, borders, shadows, radius, fonts, animation).

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. One file: `src/lib/components/Modal.svelte`.
- Exported from `src/lib/components/index.ts`, resolvable via
  `import { Modal } from '$lib'`; assertion added to `src/lib/exports.spec.ts`.
- Headless conventions (`original-specs/00-architecture.md`): root gets
  `class="hz-modal"`, `data-size`, `data-state`. Mirror `Card.svelte` /
  `Nav.svelte` for `$props()` destructuring, `class: className` via `cx`,
  `...rest`-first spread (managed attributes win), and `$effect` cleanup.
- **Structural-CSS exception** (same justification as Card/Nav/layout primitives
  in `original-specs/00-architecture.md`): Modal owns region layout — a flex
  column with a pinned header, a scrollable `hz-modal-body`, a bottom footer, the
  `--hz-modal-width` size hook, and the `tabindex` focus target — so it ships
  **minimal structural** CSS in a scoped `<style>` (display/flex/position/
  overflow/width, media queries). It ships **no** colors, borders, shadows,
  border-radius, fonts, or animation. Shipped spacing/width reference
  `--hz-*` tokens **with literal fallbacks** (Shared Scale in `specs/03-layout.md`).
- IDs via `uid` from `$lib/utils` (title/description association), matching `Nav.svelte`.
- Snippet props: `children` (body), `actions` (footer). Prop unions declared
  **locally** (no new shared types).
- The close control composes the library **`Button`** (`src/lib/components/Button.svelte`)
  with `IconX` from `$lib/icons` (Modal-R15).
- Dev warnings use the `import.meta.env.DEV` + `untrack(...)` pattern from
  `Button.svelte` / `Card.svelte`.

### Props

| Prop             | Type                             | Default          |
| ---------------- | -------------------------------- | ---------------- |
| `open`           | `boolean` (**`$bindable`**)      | `false`          |
| `title`          | `string`                         | _required_       |
| `description`    | `string \| undefined`            | —                |
| `size`           | `'sm' \| 'md' \| 'lg' \| 'full'` | `'md'`           |
| `closeOnOverlay` | `boolean`                        | `true`           |
| `closeOnEscape`  | `boolean`                        | `true`           |
| `showClose`      | `boolean`                        | `true`           |
| `preventScroll`  | `boolean`                        | `true`           |
| `closeLabel`     | `string`                         | `'Close dialog'` |
| `onclose`        | `(() => void) \| undefined`      | —                |
| `children`       | `Snippet` (optional, body)       | —                |
| `actions`        | `Snippet` (optional, footer)     | —                |
| `class`          | `string` (optional → `cx`)       | —                |

Plus arbitrary `...rest` HTML attributes forwarded to the root `<dialog>`.

### Requirements

Boolean `data-*` "present" = empty-valued attribute exists; "absent" = not
rendered.

**Structure & rendering**

1. **Modal-R1 — Root.** Always renders a `<dialog class="hz-modal">` (never
   conditionally mounted — visibility is driven by `showModal()`/`close()`,
   Modal-R8), carrying `aria-modal="true"`, `tabindex="-1"` (R11 focus target),
   `data-size` (R6), `data-state` (R7), `aria-labelledby` pointing to the title
   element's `uid` id, and `aria-describedby` pointing to the description
   element's `uid` id **only when** `description` is a non-empty string (absent
   otherwise).
2. **Modal-R2 — Header & title.** Renders `<div class="hz-modal-header">`
   containing `<h2 id="{titleId}" class="hz-modal-title">{title}</h2>`. The title
   element is a fixed `<h2>` (no configurable heading level). When `showClose`
   (R15), the header also contains the close control.
3. **Modal-R3 — Description.** When `description` is a non-empty string, renders
   `<p id="{descId}" class="hz-modal-description">{description}</p>`; absent
   otherwise. The id is referenced by `aria-describedby` (R1).
4. **Modal-R4 — Body.** Renders `<div class="hz-modal-body">` wrapping the
   `children` snippet. The wrapper renders even when `children` is absent (stable
   scroll region for R6/R16) and produces no error when empty.
5. **Modal-R5 — Footer / actions.** When the `actions` snippet is provided,
   renders `<div class="hz-modal-footer">` wrapping it; when absent, **no**
   `hz-modal-footer` element.
6. **Modal-R6 — Size.** `size` (`'sm' | 'md' | 'lg' | 'full'`, default `'md'`)
   reflects verbatim in `data-size`. Width is exposed as the tunable hook
   `--hz-modal-width`; the component sets `width: var(--hz-modal-width, …)` with a
   literal per-size fallback and ships no other box visuals.
7. **Modal-R7 — State.** `data-state` is `"open"` when `open` is true, `"closed"`
   otherwise, kept in sync with the actual dialog open/close state.

**Behavior**

8. **Modal-R8 — Open/close mechanics.** A `$effect` reconciles `open` with the
   DOM: when `open` becomes true and the dialog is not open, call
   `dialog.showModal()` (native backdrop, top-layer, focus trap); when `open`
   becomes false and the dialog is open, call `dialog.close()`. Guarded so it is
   a no-op on the server / before mount.
9. **Modal-R9 — Two-way `bind:open`.** `open` is `$bindable`. Every dismissal
   path (close button, backdrop click, Escape, programmatic `close()`) sets
   `open = false` so a parent's `bind:open` stays in sync; opening externally by
   setting `open = true` shows the dialog (R8).
10. **Modal-R10 — `onclose` callback.** `onclose?: () => void` fires exactly once
    per dismissal, regardless of method (overlay click, Escape, close button, or
    programmatic close), after `open` is set false. It takes no arguments and
    does **not** fire on open.
11. **Modal-R11 — Focus on open.** On open, focus moves to the first focusable
    element inside the dialog. If none exists, focus the close control (when
    `showClose`); if neither exists, focus the dialog element itself (which
    carries `tabindex="-1"`, R1, so it is programmatically focusable).
12. **Modal-R12 — Focus return.** The element that was `document.activeElement`
    immediately before opening is captured and re-focused on close (if still in
    the DOM).
13. **Modal-R13 — Escape.** Escape is handled by the native `<dialog>`. When
    `closeOnEscape` is false, the component intercepts the dialog's `cancel`
    event and calls `preventDefault()` so the modal stays open; when true, the
    resulting close runs through R9/R10.
14. **Modal-R14 — Backdrop click.** When `closeOnOverlay` is true, a click whose
    `event.target` is the `<dialog>` element itself (i.e. the backdrop region,
    not an inner child) closes the modal via R9/R10. When false, backdrop clicks
    are ignored. Clicks on inner content never close.
15. **Modal-R15 — Close control (composes `Button`).** When `showClose` is true,
    the header renders an icon-only library `Button` as the close control:
    `ariaLabel={closeLabel}`, an `iconStart` snippet rendering `IconX` (decorative
    — `IconX` gets no `ariaLabel`, so it is `aria-hidden`), and an `onclick` that
    closes via R9/R10. Because `Button` manages its own `class="hz-button"`, the
    theme hook for targeting the close control is a forwarded `data-modal-close`
    attribute (passed through `Button`'s `...rest`) on the rendered button.
    Providing `ariaLabel` also satisfies `Button`'s icon-only dev-warning guard.
    When `showClose` is false, no close control renders.
16. **Modal-R16 — Scroll lock (per-instance).** When `preventScroll` is true, on
    open the component sets `document.body.style.overflow = 'hidden'`, capturing
    the previous inline value, and restores exactly that value on close (does not
    clobber pre-existing inline styles). When false, body scroll is untouched.
    Restoration also runs on component teardown so an unmount-while-open never
    leaks `overflow: hidden`. Lock/restore is per Modal instance (nested modals
    are out of scope, see Out of Scope).
17. **Modal-R17 — class composition.** Root `class` is `cx('hz-modal', className)`:
    `hz-modal` first and never removable. No `class` → exactly `hz-modal`;
    `class="foo bar"` → `hz-modal foo bar`.
18. **Modal-R18 — rest forwarding.** `...rest` forwards onto the root `<dialog>`,
    spread first so managed attributes (`class`, `data-size`, `data-state`,
    `aria-modal`, `aria-labelledby`, `aria-describedby`, `tabindex`) cannot be
    clobbered.
19. **Modal-R19 — barrel export.** `Modal` exported from
    `src/lib/components/index.ts`; `import { Modal } from '$lib'` resolves;
    assertion added to `exports.spec.ts`.

### Responsive Behavior

- **Mobile (<640px):** `size` `sm`/`md`/`lg` widths are capped by the viewport
  (the width hook resolves to `min(<size>, 100% - margin)` semantics via the
  fallback); the dialog never overflows horizontally. `size="full"` fills the
  viewport (full width/height) for an app-style sheet. Body scrolls within
  `hz-modal-body` when content exceeds available height (the dialog itself does
  not grow past the viewport).
- **Tablet (640–1024px):** Centered dialog at the configured `size` width; `full`
  still fills the viewport.
- **Desktop (>1024px):** Same; `sm`/`md`/`lg` resolve to their nominal max widths
  via `--hz-modal-width`.
- The header stays pinned and the footer stays at the bottom; only the body
  region scrolls — true at every breakpoint. No region hides at any breakpoint.

### Accessibility (WCAG 2.1 AA)

- Native `<dialog>` + `showModal()` provides role `dialog`, modal focus trapping,
  top-layer stacking, the inert backdrop, and Escape handling — no custom
  focus-trap is written (1.3.1, 2.1.2).
- `aria-modal="true"`, `aria-labelledby` → title, `aria-describedby` →
  description (when present) give the dialog an accessible name/description
  (4.1.2, 1.3.1).
- Focus moves into the dialog on open (R11) and returns to the trigger on close
  (R12) (2.4.3).
- Escape dismisses unless `closeOnEscape={false}` (R13) (2.1.2); keyboard users
  can always reach and operate the close control.
- The icon-only close control (a `Button`) has an accessible name via
  `closeLabel` (default `"Close dialog"`); `IconX` is `aria-hidden` (4.1.2,
  1.1.1).
- Background scroll is locked while open (R16) so background content cannot be
  interacted with behind the modal.
- No `outline: none` / focus suppression anywhere; visible focus is a theme
  concern but must not be removed.
- Color contrast: N/A (no colors shipped). Reduced motion: the component ships no
  enter/exit animation; any backdrop/dialog transition is a theme concern and
  must respect `prefers-reduced-motion` there.

### Edge Cases & Error States

| Case                                              | Expected behavior                                                                       |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `open` starts `true`                              | Dialog opens on mount via `showModal()` (R8); focus moves in (R11).                      |
| No `children`                                     | `hz-modal-body` renders empty; no error (R4).                                            |
| No `actions`                                      | No `hz-modal-footer` element (R5).                                                       |
| No `description`                                  | No `hz-modal-description`; no `aria-describedby` (R1, R3).                                |
| `description=""` (empty)                          | Treated as absent (no element, no `aria-describedby`).                                   |
| `showClose={false}`                               | No close control; focus fallback chain still resolves (R11).                            |
| `closeOnEscape={false}`                           | Escape `cancel` is prevented; modal stays open; `onclose` does not fire (R13).           |
| `closeOnOverlay={false}`                          | Backdrop clicks ignored; only button/Escape/programmatic close (R14).                    |
| Click on inner content                            | Never closes (target is not the `<dialog>`) (R14).                                       |
| Dismissed by any method                           | `open` set false **and** `onclose` fires once (R9, R10).                                 |
| `preventScroll={true}` with pre-set body overflow | Original inline `overflow` captured and restored exactly on close (R16).                 |
| Component unmounted while open                    | Scroll lock restored on teardown; no leaked `overflow: hidden` (R16).                    |
| No focusable content & `showClose={false}`        | Dialog element itself receives focus (`tabindex="-1"`) (R11).                            |
| `...rest` attempts `class` / a managed attr       | Component-managed value wins (R18).                                                      |
| SSR / pre-mount                                   | `<dialog>` renders closed markup; `showModal()` only runs client-side after mount (R8).  |

### Existing Code to Reuse

- **Utils:** `cx` and `uid` from `src/lib/utils` (R17, R1) — do not write new
  class-merging or id logic.
- **Components:** `Button` from `src/lib/components/Button.svelte` for the close
  control (R15) — do not hand-roll a button.
- **Icons:** `IconX` from `$lib/icons` for the close glyph (R15) — do not inline
  new SVG.
- **Component pattern:** mirror `src/lib/components/Card.svelte` (region wrappers +
  `$props()` + `...rest`-first spread) and `src/lib/components/Nav.svelte`
  (`$effect` add/remove listeners with cleanup, `uid` ids, stateful behavior).
- **Bindable/dev-warning patterns:** `$bindable` per Svelte 5 runes;
  `import.meta.env.DEV` + `untrack(...)` from `Button.svelte` / `Card.svelte`.
- **Tokens:** `--hz-space-*` / `--hz-modal-width` with literal fallbacks, per the
  Shared Scale in `specs/03-layout.md`.
- **Barrel + export test:** extend `src/lib/components/index.ts` and the
  `$lib (.)` assertion in `src/lib/exports.spec.ts` to include `Modal`.
- **Test harness:** `Nav.svelte.spec.ts` / `Card.svelte.spec.ts` — Vitest browser
  mode (`vitest-browser-svelte`: `render`, `page.getBy*`, `await expect.element`,
  `createRawSnippet` for snippet props, `userEvent` from `vitest/browser`).
  `expect.requireAssertions` is on — every test asserts.

### Test Plan

Runner: **Vitest** browser project (chromium, **Playwright** provider) with
`vitest-browser-svelte`. One spec file `src/lib/components/Modal.svelte.spec.ts`
(the `.svelte.spec.ts` suffix routes to the browser `client` project in
`vite.config.ts`). No Playwright e2e (docs demos are Sprint 4). `<dialog>`/
top-layer behavior is asserted via real `showModal()` in the browser env.

**Unit / component (browser):**

- Modal-R1: defaults → `<dialog.hz-modal>` with `aria-modal="true"`,
  `tabindex="-1"`, `data-size="md"`, `aria-labelledby` matching the title id;
  `aria-describedby` present only with a non-empty `description`.
- Modal-R2/R3/R4/R5: header + `h2` title always; description `<p>` only when set;
  body wrapper always; footer only when `actions` provided (parametrized over
  snippet combos).
- Modal-R6: each `size` → `data-size`; computed width reflects a `--hz-modal-width`
  override.
- Modal-R7/R8: `open=true` → `dialog.open === true`, `data-state="open"`; set
  `open=false` → `dialog.open === false`, `data-state="closed"`.
- Modal-R9: each dismissal path flips bound `open` to false (assert via a
  `bind:open` parent state).
- Modal-R10: `onclose` spy fires once per dismissal method; not on open; called
  with no arguments.
- Modal-R11: focus on open lands on first focusable / close control / dialog per
  the fallback chain (three cases).
- Modal-R12: pre-open `activeElement` (a trigger button) regains focus after close.
- Modal-R13: `closeOnEscape=false` → Escape keeps it open, no `onclose`; `true` →
  closes.
- Modal-R14: click on `<dialog>` backdrop closes when `closeOnOverlay`; inner-content
  click never closes; ignored when false.
- Modal-R15: `showClose` → close control is a `Button` with `aria-label={closeLabel}`,
  an `aria-hidden` `IconX`, and a forwarded `data-modal-close` attribute; click
  closes; no icon-only dev-warning fires; `false` → no close control.
- Modal-R16: open with `preventScroll` → `body` computed `overflow: hidden`;
  close → restored to original inline value (including a pre-set value); unmount
  while open → restored.
- Modal-R17: no `class` → exactly `hz-modal`; `class="foo bar"` → `hz-modal foo bar`.
- Modal-R18: `...rest` (e.g. `data-testid`) forwarded; override attempt on
  `class`/`aria-modal` → managed wins.
- Modal-R19: extend `exports.spec.ts` to assert `Modal` resolves from `$lib`,
  plus smoke render.

**Integration (browser):** open → Tab cycles within the dialog (native trap) and
never reaches background controls; Escape + close button + backdrop each
round-trip `bind:open` and `onclose` together.

### Out of Scope

- Any colors, borders, shadows, border-radius, fonts, or enter/exit **animation** —
  visuals/transitions are the Sprint-4 reference theme.
- **Nested / stacked modals** — a single modal at a time is supported; the
  scroll-lock is per-instance and no ref-counting is provided. (Native top-layer
  still stacks z-index if a consumer forces it, but this is untested/unsupported.)
- Imperative `open()`/`close()` instance methods or a context/store API — control
  is via `bind:open` only.
- A confirm/alert convenience wrapper, drawer/sheet variants, or non-modal
  (`show()`) dialogs.
- A configurable heading level for the title — the title is a fixed `<h2>` (R2).
- Authoring the `actions` content — `actions` is consumer snippet content
  (consumers drop `Button`s in themselves); Modal only composes `Button` for the
  close control (R15).
- Docs demo routes and Playwright e2e — Sprint 4.
