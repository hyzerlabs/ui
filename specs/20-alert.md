# Alert Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Alert-Rn`) and edge case as pass/fail. Write scope for the
> Builder is the library source (`src/lib/**`).

### Goal

Ship one headless Svelte 5 `Alert` component: an inline feedback banner with
an optional heading, the full Badge intent scale, and an optional dismiss
button — plus the **Form error-summary integration**: Form's summary renders
*as* an Alert, so the two look and behave like one system. Announcement
semantics are deliberately the consumer's: a statically rendered banner is
plain content; live-region roles ride `...rest` for dynamically inserted
alerts.

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. One file:
  `src/lib/components/Alert.svelte`, exported from the barrel; assertion in
  `exports.spec.ts`.
- **Intent scale matches Badge** (user decision 2026-07-13):
  `'neutral' | Intent` from `$lib/types`, default `'neutral'` — every intent
  resolves through its `--hz-intent-*` role token (`specs/15-tokens.md`,
  2026-07-13 amendment; theme concern). No Alert-only `error` naming; the
  library says `danger`.
- **Dismiss API matches Badge**: `onDismiss`/`dismissLabel` (default
  `'Dismiss'`). Controlled: activating the button calls `onDismiss()`; the
  consumer owns visibility state — the Alert never hides itself.
- `title` is `string | Snippet` (house text-slot convention, per
  Hero/Accordion/Tabs).
- Mirror existing patterns: `cx`, `uid`, `...rest`-first spread (managed
  attributes win), `<svelte:element>` heading per Accordion.

### Props

| Prop           | Type                        | Default       |
| -------------- | --------------------------- | ------------- |
| `children`     | `Snippet`                   | _required_    |
| `title`        | `string \| Snippet`         | —             |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6`     | `2`           |
| `intent`       | `'neutral' \| Intent`       | `'neutral'`   |
| `rounded`      | `Rounded`                   | `'md'`        |
| `icon`         | `Snippet`                   | — (decorative)|
| `onDismiss`    | `(() => void) \| undefined` | —             |
| `dismissLabel` | `string`                    | `'Dismiss'`   |
| `class`        | `string` (→ `cx`)           | —             |

Plus arbitrary `...rest` forwarded onto the root `<div>` — notably `role`,
`tabindex`, and `aria-*` are **unmanaged** so consumers control announcement
and focus semantics (see Alert-R2; `aria-labelledby` is the one exception).

### Requirements

1. **Alert-R1 — Structure.** Renders
   `<div class="hz-alert" data-intent={intent}>` containing, in order:
   - when `icon` is set: `<span class="hz-alert-icon" aria-hidden="true">`
     wrapping it (decorative — the intent is conveyed by the text);
   - `<div class="hz-alert-body">` containing: when `title` is set, a
     `<svelte:element this={'h' + headingLevel} id="hz-alert-title-{uid}"
     class="hz-alert-title">` rendering the string or snippet; then
     `<div class="hz-alert-content">` wrapping `{@render children()}`;
   - when `onDismiss` is set: `<button type="button"
     class="hz-alert-dismiss" aria-label={dismissLabel}>` with the
     decorative `IconX`; activation calls `onDismiss()`.

   `data-intent` and `data-rounded` are always present (`rounded` speaks the
   shared `Rounded` token scale, default `'md'` — a banner, not a pill);
   `data-dismissible` exactly when `onDismiss` is provided. When `title` is present the root carries
   `aria-labelledby` pointing at the title id (managed — wins over rest);
   with no `title`, none is set (a consumer's rest value passes through).
2. **Alert-R2 — Announcement is opt-in.** The component sets **no** `role`
   and no live-region attributes. Rationale: a live role only announces
   content that appears dynamically — on a statically rendered banner it is
   dead weight, and the wrong default (`role="alert"` = assertive) is worse
   than none. Consumers pass `role="status"` (polite) or `role="alert"`
   (assertive, sparingly) via `...rest` when inserting an Alert after load.
   The docs demo and a11y note model this.
3. **Alert-R3 — Dismiss.** Same contract as Badge-R3: real labelled button,
   decorative icon, `onDismiss()` on activation, consumer-owned visibility.
   Default label `'Dismiss'`.
4. **Alert-R4 — class & rest.** Root class `cx('hz-alert', className)`;
   `...rest` spread first; managed attributes (`class`, `data-*`, and
   `aria-labelledby` when titled) win.
5. **Alert-R5 — Form error-summary reuse.** `Form.svelte` renders its
   summary as
   `<Alert intent="danger" class="hz-form-error-summary" role="alert"
   tabindex={-1} title={summaryTitle} headingLevel={summaryHeadingLevel}>`
   wrapping the existing `<ul class="hz-form-error-list">`. Amendments to
   `specs/14-form.md` Form-R3:
   - the summary root keeps `.hz-form-error-summary` (via Alert's `class`)
     plus `role="alert"`/`tabindex="-1"` via rest; `data-state="error"` on
     the form is unchanged;
   - the heading is Alert's (`.hz-alert-title`); the `hz-form-summary-title`
     class and Form's own `aria-labelledby` wiring are **removed** — Alert
     labels itself;
   - Form focuses the summary via
     `formEl.querySelector('.hz-form-error-summary')` (Alert exposes no
     element ref);
   - Form's scoped summary-block styles move to Alert/theme; the error-list
     resets stay in Form (the list lives in Form's template).
   Theme `form.css` drops the banner chrome (border/background/title —
   now `alert.css` via `data-intent="danger"`) and keeps only the
   summary-item and link styles.
6. **Alert-R6 — Barrel export.** `Alert` exported from the barrel;
   `import { Alert } from '$lib'` resolves; assertion + smoke render in
   `exports.spec.ts`.
7. **Alert-R7 — Structural CSS only.** Scoped styles: root as a flex row
   (`align-items: flex-start`, token gap), body `flex: 1; min-width: 0`,
   title margin reset, dismiss button as an inline-flex cursor-pointer
   reset. **No** colors/padding/radius — theme (`theme/alert.css`, in
   `@layer hz-theme`, imported by `theme.css`): per-intent `--_c` switch
   (to the matching `--hz-intent-*` role tokens, per Badge), soft
   `color-mix` background + inline-start accent
   bar, padded box with `data-rounded` mapping 1:1 to the radius tokens,
   semibold tinted title, dismiss button with `1em` icon, hover tint, and
   intent-tinted focus ring.

### Accessibility (WCAG 2.1 AA)

- Static alerts are plain content in the page outline; the optional heading
  gives them a navigable name (2.4.6) and labels the region via
  `aria-labelledby`. Intent color is never the only signal (1.4.1) — the
  title/text carries the meaning; the icon slot is decorative.
- Dynamically inserted alerts announce only if the consumer opts in with
  `role="status"`/`role="alert"` (4.1.3) — documented with a live demo.
- The dismiss button is a real labelled button (4.1.2). Dismissing is a
  consumer state change, so focus handling on removal is the consumer's
  concern (the docs demo models restoring focus sensibly).
- The Form summary keeps its full contract (role=alert, focus on failed
  submit, linked items) — it just *looks* like what it is: a danger Alert.

### Edge Cases & Error States

| Case                                | Expected behavior                                                        |
| ----------------------------------- | ------------------------------------------------------------------------- |
| No `title`                          | No heading, no managed `aria-labelledby`; rest may supply one (Alert-R1).  |
| `title` as string vs Snippet        | Both render inside the heading element (Alert-R1).                         |
| `headingLevel={4}`                  | `<h4 class="hz-alert-title">` (Alert-R1).                                  |
| No `onDismiss`                      | No button, no `data-dismissible` (Alert-R1/R3).                            |
| `role="status"` via rest            | Passes through untouched (Alert-R2).                                       |
| `...rest` attempts `class`/`data-intent` | Component-managed value wins (Alert-R4).                              |
| Form submit with errors             | Summary Alert renders, receives focus, items link — unchanged (Alert-R5).  |

### Test Plan

`Alert.svelte.spec.ts` (browser project): structure + every intent reflects
into `data-intent`; title string/snippet + heading level + id/aria-labelledby
wiring (and absence without title); icon aria-hidden; dismiss
absent/present/label/click/`data-dismissible`; role passthrough via rest;
class merge + managed-wins; export + smoke render.
`Form.svelte.spec.ts` amendments: summary selectors move to `.hz-alert-title`;
summary root asserts `.hz-alert.hz-form-error-summary` with
`data-intent="danger"`; all existing focus/linking behavior unchanged.

### Out of Scope

- Auto-dismiss timers, animation, and toast/stacking behavior. **Toasts are
  deliberately not planned** (product decision 2026-07-13): timed,
  self-dismissing overlays are an accessibility trap — they violate
  WCAG 2.2.1 (enough time), routinely escape screen-reader announcement,
  and steal or strand focus. Inline Alerts inserted with `role="status"`
  cover the use case accessibly.
- Built-in intent icons — the icon set lacks info/warning glyphs today; the
  `icon` snippet is the hook, shipped icons can come later.
- Managed visibility state (`dismissed` internal flag) — controlled only.
