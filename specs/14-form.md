# Form (Error-Summary Provider) Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Form-Rn`) and edge case as pass/fail. Write scope for the
> Builder is the library source (`src/lib/**`).

### Goal

Ship one headless, accessible Svelte 5 `Form` component that wraps a native
`<form>` and provides an **accessible error-summary region with managed focus**.
On a submit attempt that produces errors, it renders a summary listing each
error, moves focus to it, and lets the user jump to the offending field. The
component owns **accessibility orchestration only** — validation logic and error
message content are the consumer's. It exposes `hz-*` class / `data-*` hooks and
ships only the **minimal structural CSS** the summary needs and **no** visual
opinions (no colors, borders, shadows, radius, fonts, or animation).

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. One file: `src/lib/components/Form.svelte`.
  Exported from `src/lib/components/index.ts`, resolvable via
  `import { Form } from '$lib'`; assertion added to `src/lib/exports.spec.ts`.
- The consumer owns validation. They pass an `errors` array (keyed by field
  `name`); the Form **never** computes errors. `errors` is a **plain read-only
  prop** — the Form reads it but never mutates it (not `$bindable`).
- Field targeting is **native** via `form.elements[name]` — **no context, no
  store, no coupling** to the form primitives (`specs/13-forms.md`). It works
  with any named control, ours or plain native HTML.
- On submit, the Form `preventDefault()`s, flags an internal `submitAttempted`
  state, then calls `onSubmit`. When errors are present after a submit, it
  renders the summary and moves focus (once per attempt). Reactive `errors`
  changes that are **not** the result of a submit update the summary content but
  never move focus (so live corrections as the user types never yank focus).
- Mirror existing patterns: `$props()` destructuring with `class: className` via
  `cx`, `...rest`-first spread (managed attributes win), `uid` ids (per
  `Nav.svelte`), `bind:this` form ref + `$effect` for focus/scroll side effects,
  `import.meta.env.DEV` + `untrack(...)` for any dev warning (per `Card.svelte`).
- **Structural-CSS exception** (same justification as the other components):
  Form ships **minimal structural** CSS in a scoped `<style>` — the summary as a
  block and its list reset (`list-style`/`margin`/`padding`). It ships **no**
  colors, borders, shadows, border-radius, fonts, or animation. Any spacing
  references `--hz-space-*` tokens **with literal fallbacks** (Shared Scale in
  `specs/03-layout.md`).

### Shared Type

Add to `src/lib/types/index.ts` (mirroring the existing `NavItem` /
`FieldBase` pattern; do not redeclare locally):

```ts
/** A single error surfaced by the Form error summary. */
export interface FormError {
	/** Field `name` to link to. Empty/unresolved ⇒ a form-level error (no link). */
	name: string;
	message: string;
}
```

### Props

| Prop                  | Type                                       | Default                |
| --------------------- | ------------------------------------------ | ---------------------- |
| `errors`              | `FormError[]`                              | `[]`                   |
| `onSubmit`            | `((e: SubmitEvent) => void) \| undefined`  | —                      |
| `summaryTitle`        | `string`                                   | `'There is a problem'` |
| `summaryHeadingLevel` | `2 \| 3 \| 4 \| 5 \| 6`                    | `2`                    |
| `focusTarget`         | `'summary' \| 'firstField'`                | `'summary'`            |
| `novalidate`          | `boolean`                                  | `false`                |
| `ariaLabel`           | `string \| undefined`                      | —                      |
| `children`            | `Snippet`                                  | _required_             |
| `class`               | `string` (optional → `cx`)                 | —                      |

Plus arbitrary `...rest` HTML attributes forwarded onto the `<form>`.

### Requirements

Boolean `data-*` "present" = empty-valued attribute exists; "absent" = not
rendered.

1. **Form-R1 — Root.** Renders `<form class="hz-form">` with `cx('hz-form',
   className)`, `...rest` spread first (managed attributes win), and
   `aria-label={ariaLabel}` only when `ariaLabel` is set. The native `novalidate`
   attribute is present **only** when the `novalidate` prop is `true`; by default
   (`false`) it is absent, so native HTML5 constraint validation runs.
2. **Form-R2 — Submit handling.** A `submit` handler calls `preventDefault()`,
   sets an internal `submitAttempted` flag (`$state`), then invokes
   `onSubmit(event)` when provided (the consumer validates and updates `errors`).
   When `novalidate` is `false` and the form fails native constraint validation,
   the browser preempts the `submit` event (native validation UI shows); the
   handler / `onSubmit` only run once native constraints pass.
3. **Form-R3 — Summary rendering.** When `errors.length > 0`, render a summary as
   the **first child** of the form (before `children`):
   `<div class="hz-form-error-summary" role="alert" tabindex="-1"
   aria-labelledby="hz-form-summary-{uid}">` containing a heading
   `<svelte:element this={'h' + summaryHeadingLevel}>` with
   `id="hz-form-summary-{uid}"` and text `summaryTitle`, followed by a `<ul>` of
   items (Form-R4). When `errors` is empty, the summary element is **absent**.
   The form carries `data-state="error"` when the summary is shown, else absent.
4. **Form-R4 — Summary items.** One `<li class="hz-form-error-summary-item">` per
   error. Resolve the target via `form.elements[error.name]`:
   - a resolved control with a non-empty `id` → `<a href="#{id}">{message}</a>`;
   - a `RadioNodeList` (radio group sharing `name`) → target the **first** radio
     in the list;
   - a resolved control **without** an `id` → `<button type="button">{message}</button>`;
   - an unresolved or empty `name` → plain text `{message}` (a form-level error,
     no link / no focus target).

   Items are ordered by their resolved control's **DOM position** within the
   form; form-level (unlinked) errors render **last**, in array order.
5. **Form-R5 — Managed focus.** On a submit that yields errors
   (`submitAttempted` && `errors.length > 0`), focus moves **once** to:
   - the summary container (`focusTarget="summary"`, the default — it is
     `tabindex="-1"` so it is focusable), or
   - the first error's resolved control (`focusTarget="firstField"`; falls back
     to the summary when the first error has no resolvable control).

   Focus moves **only** in response to a submit, via an `$effect` gated on the
   per-submit flag — never on a reactive `errors` change that is not the result
   of a submit. The flag is consumed (reset) after the focus move so corrections
   re-trigger focus only on the next submit.
6. **Form-R6 — Jump to field.** Activating a summary link/button
   `preventDefault()`s any hash navigation, calls `.focus()` on the resolved
   control, and `scrollIntoView`s it with `behavior: 'smooth'` unless
   `prefers-reduced-motion: reduce` matches, in which case `behavior: 'auto'`.
   Plain-text (form-level) items are not interactive.
7. **Form-R7 — Decoupled targeting.** The component depends on **no** context /
   store and **none** of the form primitives. Targeting is purely native
   `form.elements[name]` via the form `bind:this` ref, so any named control —
   `hz-*` component or plain `<input name>` — resolves identically.
8. **Form-R8 — class composition & rest forwarding.** Root `class` is
   `cx('hz-form', className)`: `hz-form` first and never removable (no `class` →
   exactly `hz-form`; `class="foo bar"` → `hz-form foo bar`). `...rest` forwards
   onto the `<form>`, spread first so managed attributes (`class`, `novalidate`,
   `data-state`, the submit handler) cannot be clobbered.
9. **Form-R9 — Barrel export.** `Form` exported from
   `src/lib/components/index.ts`; `import { Form } from '$lib'` resolves;
   assertion added to `exports.spec.ts` (plus a smoke render). `FormError` is
   exported from `$lib/types`.

### Responsive Behavior

- The error summary is a full-width block at the top of the form at **every**
  breakpoint (mobile `<640px`, tablet `640–1024px`, desktop `>1024px`). It does
  not hide, reflow, or change interaction pattern by breakpoint.
- Field layout and spacing within `children` are entirely the consumer/theme's
  concern; the Form ships no breakpoint-specific CSS.

### Accessibility (WCAG 2.1 AA)

- The error summary is a labelled `role="alert"` region (named by its heading via
  `aria-labelledby`) that receives focus on a failed submit, so the change is
  announced and the user lands on the problem list (4.1.3 status messages, 3.3.1
  error identification). Error message content — including any suggestions
  (3.3.3) — is the consumer's responsibility.
- Each summary item moves focus to its corresponding control (2.4.3 focus order,
  2.1.1 keyboard), giving a clear error→field path. Activation scrolls the field
  into view respecting `prefers-reduced-motion` (2.3.3).
- `novalidate` is **opt-in**: by default native HTML5 constraint validation runs
  and provides its own accessible field-level UI; the summary then surfaces the
  consumer's custom / async errors on top. Consumers who want the summary to be
  the single error surface set `novalidate`.
- Focus is moved only deliberately (on submit), never on incidental `errors`
  updates, so a user correcting fields is not interrupted.
- No `outline: none` / focus suppression anywhere; visible focus is a theme
  concern but must not be removed. Color contrast: N/A (no colors shipped).

### Edge Cases & Error States

| Case                                              | Expected behavior                                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `errors` empty                                    | No summary; `data-state` absent; no focus move (Form-R3, R5).                                       |
| `error.name` matches no control                   | Item renders as plain text, no link/button (Form-R4).                                               |
| `error.name` is a radio group (`RadioNodeList`)   | Item links to the **first** radio in the group (Form-R4).                                           |
| `error.name` empty / form-level error             | Plain-text item, rendered **last** in array order (Form-R4).                                        |
| Resolved control has no `id`                      | Item is a `<button>` that focuses the control on activation (Form-R4, R6).                          |
| Multiple errors for the same field                | Each renders its own item, all targeting that control (Form-R4).                                    |
| Errors corrected, then form re-submitted          | Summary updates; focus re-moves on the **new** submit only (Form-R5).                               |
| `errors` change without a submit                  | Summary content updates if visible; **no** focus move (Form-R5).                                    |
| `focusTarget="firstField"`                        | Submit focuses the first error's control; falls back to the summary if it has no target (Form-R5).  |
| `novalidate={false}` and a native constraint fails | Native validation preempts `submit`; `onSubmit` / summary focus do not run until constraints pass (Form-R2). |
| `novalidate={true}`                               | Native field validation suppressed; the summary is the sole error surface (Form-R1, R2).            |
| Used with a plain native `<input name>` (no hz primitive) | Targeting resolves identically via `form.elements` (Form-R7).                              |
| SSR / pre-mount                                   | Static markup renders (summary present iff `errors` non-empty); submit/focus/scroll logic attaches on mount. |
| `...rest` attempts `class` / `novalidate` / `data-state` | Component-managed value wins (Form-R8).                                                      |

### Existing Code to Reuse

- **Utils:** `cx` and `uid` from `src/lib/utils` (Form-R8, R3) — do not write new
  class-merging or id logic.
- **Types:** add `FormError` to `src/lib/types/index.ts` (shared type, mirroring
  `FieldBase` / `NavItem`); import it rather than redeclaring.
- **Component patterns:** `Nav.svelte` (`bind:this` element ref, `$effect`
  side-effects with cleanup, `uid` ids), `Card.svelte` (`...rest`-first spread,
  `import.meta.env.DEV` / `untrack` dev warning if any added). Dynamic heading
  tag via `<svelte:element>` as in `Accordion.svelte` (Accordion-R3).
- **Tokens:** `--hz-space-*` with literal fallbacks, per the Shared Scale in
  `specs/03-layout.md`.
- **Barrel + export test:** extend `src/lib/components/index.ts` and the
  `$lib (.)` assertion in `src/lib/exports.spec.ts` to include `Form`.
- **Test harness:** mirror `Tabs.svelte.spec.ts` / `Accordion.svelte.spec.ts` —
  Vitest browser mode (`vitest-browser-svelte`: `render`, `page.getBy*`,
  `await expect.element`, `createRawSnippet` for the `children` snippet,
  `userEvent` from `vitest/browser`). `expect.requireAssertions` is on — every
  test asserts.

### Test Plan

Runner: **Vitest** browser project (chromium, **Playwright** provider) with
`vitest-browser-svelte`. One spec file `src/lib/components/Form.svelte.spec.ts`
(the `.svelte.spec.ts` suffix routes to the browser `client` project in
`vite.config.ts`). Native `<form>` `submit`, `form.elements` resolution, and
focus/scroll are asserted in the real browser env. No Playwright e2e (docs demos
are a later sprint).

**Unit / component (browser):**

- Form-R1: defaults → `<form.hz-form>` with no `novalidate`; `novalidate={true}`
  → attribute present; `ariaLabel` → `aria-label`; `class`/rest composition.
- Form-R2: submitting calls `preventDefault` and invokes an `onSubmit` spy; with
  `novalidate={false}` a required-but-empty native control blocks the submit
  (spy not called) until satisfied.
- Form-R3: `errors` non-empty → summary with `role="alert"`, `tabindex="-1"`,
  heading tag `h{summaryHeadingLevel}` + `aria-labelledby`, and `data-state="error"`
  on the form; empty `errors` → no summary.
- Form-R4: items resolve correctly — named input → `<a href="#id">`; radio group
  → first radio; control without id → `<button>`; unknown/empty name → plain
  text; ordering follows DOM position with form-level errors last.
- Form-R5: submit with errors moves focus to the summary
  (`document.activeElement`); `focusTarget="firstField"` focuses the first error's
  control; changing `errors` without submitting does **not** move focus; a second
  submit re-moves focus.
- Form-R6: activating a summary link focuses the target control (and
  `preventDefault`s the hash); reduced-motion path uses `behavior: 'auto'`.
- Form-R7: against a plain `<input name>` (no hz primitive), targeting + focus
  work identically.
- Form-R8: no `class` → exactly `hz-form`; `class="foo bar"` appended; `...rest`
  (e.g. `data-testid`) forwarded; override attempt on `class`/`novalidate` →
  managed wins.
- Form-R9: extend `exports.spec.ts` to assert `Form` resolves from `$lib` (+
  smoke render) and `FormError` is importable from `$lib/types`.

**Integration (browser):** a form of several `hz-*` fields plus a submit button —
submitting with a consumer-populated `errors` array renders the summary, moves
focus to it, and activating each item focuses the matching field (including a
radio group → first radio); correcting fields and resubmitting with a shorter
`errors` array updates the summary and re-moves focus.

### Out of Scope

- Validation logic, schema validation, or any error computation — entirely
  consumer-owned; the Form only presents the supplied `errors`.
- Field-level inline error rendering — that is the form primitives' `error` prop
  (`specs/13-forms.md`); the Form provides only the aggregate summary.
- `disabled` / `busy` state threading to descendant fields during submit (native
  submit-button disabling covers this for consumers).
- Async submit states, spinners, optimistic UI, multi-step / wizard forms,
  dirty-tracking, and autosave.
- A standalone `ErrorSummary` with custom placement — the summary renders only at
  the top of the form for now (revisit if a placement need appears).
- Letting native (non-prevented) submission proceed — the Form always
  `preventDefault()`s and delegates to `onSubmit` (revisit if a need appears).
- Colors, borders, shadows, border-radius, fonts, or animation — reference
  theme's job; the component guarantees only stable `hz-form*` hooks +
  `data-state`.
- Docs demo routes and Playwright e2e — later sprint.
