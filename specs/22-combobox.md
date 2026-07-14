# Combobox Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Combobox-Rn`) and edge case as pass/fail. Write scope for the
> Builder is the library source (`src/lib/**`).
>
> Rewritten 2026-07-14: multi-select is the first-class contract (the earlier
> single-select draft was a scoping error — Combobox was always intended as the
> multi-select member of the field family; `Select` covers single-select).

### Goal

Ship one headless, accessible Svelte 5 `Combobox` component: a **multi-select,
filterable** field following the WAI-ARIA APG **combobox** pattern (ARIA 1.2,
list autocomplete). A `role="combobox"` text input filters a `role="listbox"`
popup as the user types; keyboard and pointer both drive selection via
**virtual focus** (`aria-activedescendant`); committing **toggles** an option's
membership in the selected set; and each selected option renders as a
**dismissible `Badge` chip** inside the control. The selected values are a
`string[]` bound two-way with `$bindable`. Combobox is a member of the
**form-field family** (`specs/13-forms.md`): it reuses the shared `Field`
scaffold for label / description / error / required / disabled and resolves its
error state through `--hz-intent-danger`, so it drops into a `Form`
(`specs/14-form.md`) exactly like `Select`. Headless: the component ships only
structural CSS and stable `hz-*` / `data-*` hooks; all chrome (the control box,
the chips, the floating popup, the active-option highlight) is the reference
theme's job.

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. One file:
  `src/lib/components/Combobox.svelte`, exported from the barrel; assertion in
  `exports.spec.ts`. The internal `Field.svelte` scaffold
  (`specs/13-forms.md` Field-R*) is **reused** for the
  label / description / error wrapper exactly as `Select.svelte` reuses it — the
  Combobox supplies its control + popup as the `control` snippet.
- **Selection is strict** (decision 2026-07-13): every committed entry in
  `value` is an existing `option.value`. There is **no** free-text commit — an
  `allowCustom` / tagging escape hatch is deliberately deferred, because the
  field family has no free-text precedent and strict selection keeps the
  `value ⊆ options` invariant that form submission and the `Form` error summary
  rely on.
- **Query vs. value split.** `value` is a `string[]` of selected option values
  (`$bindable`); the **visible input only ever holds the filter query** — never
  a selected label. Selected options display as chips (Combobox-R5); **hidden
  inputs** carry `name`/values for form submission (Combobox-R4).
- **No custom `onChange` proliferation, but** the composite selection is not a
  single native control's `change`, so the component exposes **one** optional
  `onchange(value)` callback (the same idiom as `Pagination`'s `onchange`,
  `specs/21-pagination.md`). Native DOM events on the text input still flow
  through `...rest`.
- Popup open/closed is **internal `$state`**, not a prop (decision 2026-07-13):
  it is ephemeral UI state with no consumer use, so — unlike `Modal.open` — it
  is not `$bindable`; this keeps the public API to the field props plus
  `options`/`value`/`filter`. Revisit only if a controlled-open need appears.
- IDs via `uid` from `$lib/utils` — one stable base per instance deriving
  `hz-input-{uid}`, `hz-desc-{uid}`, `hz-error-{uid}` (Field), plus
  `hz-listbox-{uid}` and per-option `hz-opt-{uid}-{i}` (Combobox), mirroring
  `Nav.svelte`'s `uid` usage so id relationships survive reactive re-derivation.
- Mirror existing patterns: `cx`/`uid`, `...rest`-first spread on the text input
  (managed attributes win), `bind:this` element refs + `$effect` listener
  add/remove with cleanup and outside-click/Escape handling **exactly as
  `Nav.svelte` does** for its dropdown popup, `import.meta.env.DEV` + `untrack`
  for any dev warning (per `Card.svelte`).
- **Structural-CSS exception** (same justification as the rest of the field
  family): the component ships **minimal structural** CSS only — the control as
  a wrapping flex row (chips + input + toggle), the popup as an
  absolutely-positioned block anchored to the control, the listbox list reset,
  option layout, and the open-state description/error suppression
  (Combobox-R18). **No** colors, borders, shadows, radius, fonts, or state
  visuals; any spacing references `--hz-space-*` tokens **with literal
  fallbacks** (Shared Scale, `specs/03-layout.md`). All chrome is
  `theme/combobox.css` plus a `field.css` amendment (Combobox-R18).

### Shared Type

**Decision 2026-07-14:** one shared option shape instead of duplicative
`RadioOption` / `SelectOption`-flat-arm / per-component option types. In
`src/lib/types/index.ts`:

```ts
/** A single selectable choice — shared by Select, RadioGroup, and Combobox. */
export interface FormOption {
	value: string;
	label: string;
	disabled?: boolean;
}
```

`SelectOption` is redefined in terms of it —
`FormOption | { group: string; options: FormOption[] }` — keeping its name
because the optgroup union is genuinely Select-specific. `RadioOption` is
**deleted**; `RadioGroup` migrates to `FormOption` (greenfield, no external
consumers — the rename is free). The Combobox has **no** optgroup form (Out of
Scope). If a component's option shape ever needs to diverge, a named type is
reintroduced then. Documented as a supporting type table on the docs page, like
`FooterColumn`; the Select and RadioGroup docs type tables show `FormOption`.

Additionally, Badge's local prop unions move to `src/lib/types/index.ts` and
are exported (`Badge.svelte` imports them instead of redeclaring):

```ts
/** Badge appearance unions (shared so Combobox chips can be typed). */
export type BadgeIntent = 'neutral' | Intent;
export type BadgeVariant = 'soft' | 'solid' | 'outline';
export type BadgeSize = 'sm' | 'md';

/**
 * Badge styling passed through to every Combobox chip — consumers who only
 * import Combobox can still set chip appearance. Behavioral Badge props
 * (children, onDismiss, dismissLabel) are component-managed and excluded.
 */
export interface ComboboxChipProps {
	intent?: BadgeIntent;
	variant?: BadgeVariant;
	size?: BadgeSize;
	rounded?: Rounded;
	class?: string;
}
```

### Props

Extends `FieldBase` (`name`, `label`, `description`, `error`, `required`,
`disabled`, `hideLabel` — `specs/13-forms.md`) plus:

| Prop          | Type                                              | Default          |
| ------------- | ------------------------------------------------- | ---------------- |
| `options`     | `FormOption[]`                                    | _required_       |
| `value`       | `string[]` (`$bindable`)                          | `[]`             |
| `placeholder` | `string`                                          | `'Search...'`    |
| `filter`      | `(query: string, option: FormOption) => boolean`  | — (⇒ default)    |
| `emptyText`   | `string`                                          | `'No results'`   |
| `toggleLabel` | `string`                                          | `'Show options'` |
| `chipProps`   | `ComboboxChipProps`                               | `{}` (⇒ `size: 'sm'`) |
| `onchange`    | `((value: string[]) => void) \| undefined`        | —                |
| `class`       | `string` (→ `cx`)                                 | —                |

Plus arbitrary `...rest` HTML attributes forwarded onto the **visible combobox
`<input>`** (managed attributes win).

### Requirements

Boolean `data-*` "present" = empty-valued attribute exists; "absent" = not
rendered.

1. **Combobox-R1 — Structure & Field scaffold.** Reuses `Field.svelte`
   (Field-R1…R7) with the root
   `<div class="hz-field hz-combobox" data-state="error|disabled|default">`
   (class via `cx('hz-field hz-combobox', className)` — `hz-field` first so the
   field-family state hooks apply, `hz-combobox` for combobox chrome, both
   before consumer classes). The `control` snippet renders, in order:
   - `<div class="hz-combobox-control" data-open?>` — a **wrapping** flex row
     (`position: relative`, the popup's positioning ancestor) containing, in
     order: the **chip list** (one `Badge` per selected value, Combobox-R5),
     the visible `<input class="hz-combobox-input" id="hz-input-{uid}">`
     (Combobox-R2), a trailing
     `<button type="button" class="hz-combobox-toggle" tabindex="-1"
     aria-label={toggleLabel}>` with the decorative `IconChevronDown`
     (Combobox-R12), and **last** the popup:
     `<ul class="hz-combobox-listbox" id="hz-listbox-{uid}" role="listbox">`
     wrapped in the absolutely-positioned `.hz-combobox-popup`, rendered in the
     DOM at all times but hidden while closed (Combobox-R3/R7). Anchoring the
     popup inside the control keeps it attached to the control's bottom edge
     regardless of description/error text below (Combobox-R18).
   - After the control: one `<input type="hidden" name={name}>` **per selected
     value** carrying the submission values (Combobox-R4).

   `data-open` is present on `.hz-combobox` (via Field's `dataOpen`
   pass-through) and `.hz-combobox-control` exactly while the popup is open.
   Description and error render through the Field scaffold (Field-R4/R5); the
   error `role="alert"` message and `data-state="error"` are unchanged, but
   both are visually suppressed while the popup is open (Combobox-R18).
2. **Combobox-R2 — Combobox input ARIA (APG 1.2).** The visible input carries
   `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded` (`"true"` when
   the popup is open, else `"false"`), `aria-controls="hz-listbox-{uid}"`,
   `aria-haspopup="listbox"`, and `aria-activedescendant` set to the active
   option's id while an option is virtually focused (Combobox-R9), omitted
   otherwise. It is `type="text"` with `autocomplete="off"`. From the Field
   scaffold it also carries `aria-required="true"` when `required`,
   `aria-invalid="true"` on error, and the `aria-describedby` desc→error chain
   (Field-R3/R5/R6). The visible input has **no** `name` — only the hidden
   inputs submit (Combobox-R4).
3. **Combobox-R3 — Listbox & options.** The
   `<ul role="listbox" aria-multiselectable="true">` is named by the field
   label via `aria-label={label}` (so the popup has an accessible name
   independent of the visible input). For each **visible** option (post-filter,
   Combobox-R6), in array order, render
   `<li id="hz-opt-{uid}-{i}" role="option" class="hz-combobox-option"
   aria-selected={value.includes(option.value)}>` with:
   - `data-active` present on the single virtually-focused option (Combobox-R9);
   - `data-selected` present when `value.includes(option.value)`;
   - `data-disabled` present (and `aria-disabled="true"`) when `option.disabled`.

   Selected options **remain in the list** (selection is a toggle affordance —
   never filtered out by being selected). Option ids key off the **visible
   (filtered) index** `i`; the active index is re-derived on every filter
   change (Combobox-R6/R9). Options are plain `<li>`s with **no** `tabindex` —
   DOM focus never leaves the input while navigating the list (Combobox-R9).
4. **Combobox-R4 — Value model & binding.** `value` is `$bindable`, default
   `[]`: the selected option values in **selection order** (append on select).
   Strict invariant: entries are meaningful only when they match an
   `option.value`; an entry with no matching option renders **no chip and no
   hidden input**, and is never mutated/pruned by the component (don't rewrite
   consumer state — just render nothing for it). Every selection change
   (toggle via click/Enter, chip dismiss, Backspace removal) fires
   `onchange(value)` with the new array when provided. **Form submission:** one
   `<input type="hidden" name={name} value={v}>` per selected value, in
   selection order — the repeated-name convention; `form.elements[name]`
   resolves a `RadioNodeList`, matching how a native `<select multiple>` /
   checkbox group submits. The visible input only ever holds the **filter
   query**; programmatic `value` changes reflect in the chip list and the
   hidden inputs, never in the input text.
5. **Combobox-R5 — Chip list.** Inside `.hz-combobox-control`, **before** the
   visible input, render one **`Badge`** (`specs/19-badge.md`, Badge-R3) per
   selected value, in selection order:
   - `<Badge size="sm" {...chipProps} onDismiss={…}
     dismissLabel={`Remove ${option.label}`}>` with the option's `label` as
     children. **Spread order matters:** the `size="sm"` default comes first so
     `chipProps` can override it; the component-managed `onDismiss`,
     `dismissLabel`, and children come after the spread so a consumer can
     never displace them. `chipProps` (typed `ComboboxChipProps` — see Shared
     Type) lets a consumer who only imports `Combobox` set chip
     `intent`/`variant`/`size`/`rounded`/`class`; the same object applies to
     every chip (no per-option styling). Badge's own class/`data-*` hooks are
     the styling surface; the theme may add `.hz-combobox` context rules but
     must not restyle Badge internals.
   - Dismissing removes that value from `value`, fires `onchange`, and moves
     DOM focus to the visible input (the dismissed button is gone; focus must
     not drop to `<body>`). The popup's open state is unchanged by a dismiss.
   - Chip dismiss buttons are **in the tab order** (they are real Badge
     buttons): tabbing into the field reaches chips first, then the input.
     Deliberate trade-off — every chip is keyboard-removable without a
     roving-tabindex grid; the APG chip-grid pattern is deferred (Out of
     Scope). Focus moving between chips and the input stays "within" the
     control for blur purposes (the `relatedTarget`-within check in
     Combobox-R10 covers this).
   - When the field is `disabled`, chips still render (with `chipProps`
     applied) but **without `onDismiss`** (no dismiss button at all — Badge has
     no disabled prop, and a present-but-disabled remove button adds nothing);
     selections are not operable while disabled.
   - A selected value whose option is `disabled: true` still renders its chip
     and the chip is still dismissible (you can always remove a selection).
6. **Combobox-R6 — Filtering.** The visible options are those `option` for
   which the active filter returns `true` against the input's current text
   `query`. The **default** filter is a **case-insensitive substring** match on
   `option.label`; a consumer `filter(query, option)` prop overrides it
   wholesale. When `query` is empty, **all** options are shown unfiltered.
   Filtering never mutates `value`; it only changes which `<li>`s render. On a
   **typing-driven** filter change the active option resets to the **first
   enabled** visible option, or none when the list is empty (Combobox-R13); on
   a **commit-driven** re-filter (the query clears on commit, Combobox-R10) the
   active option stays on the just-toggled option (Combobox-R9).
7. **Combobox-R7 — Open / close triggers.** The popup opens on: typing a
   character into the input; `ArrowDown` / `ArrowUp`; `Alt+ArrowDown`; and a
   pointer click on the input or the toggle button (Combobox-R12). It closes
   on: `Escape` while open (Combobox-R8); `Alt+ArrowUp`; `Tab` / `Shift+Tab`;
   an outside pointer click (document-level listener, per `Nav.svelte`); the
   toggle button while open; and the whole control losing focus (Combobox-R10
   blur). Committing a selection does **not** close the popup (Combobox-R10 —
   the user is picking several). **Focus alone does not auto-open** (decision
   2026-07-13 — a popup that springs open merely on tab-in is a surprise-motion
   and screen-magnifier nuisance; the user opens deliberately). Opening never
   moves DOM focus off the input.
8. **Combobox-R8 — Keyboard (APG list-autocomplete, multi-select).** On the
   input:
   - **Character / editing keys** — update `query`, open the popup, re-filter
     (Combobox-R6), and set the active option to the first enabled match.
   - **Backspace with an empty query** — remove the **last** chip (`value.pop()`
     semantics) and fire `onchange`; with text present it is native editing.
     No `preventDefault` needed when the input is already empty.
   - **ArrowDown** — open if closed (active = first enabled option); else move
     active to the next enabled option, wrapping to the first.
   - **ArrowUp** — open if closed (active = last enabled option); else move
     active to the previous enabled option, wrapping to the last.
   - **Alt+ArrowDown** — open the popup without moving the active option.
   - **Alt+ArrowUp** — close the popup; `value` and the query are unchanged.
   - **Home / End** — when the popup is **open**, move active to the first /
     last enabled option; when **closed**, native text-cursor behavior
     (decision 2026-07-13 — list traversal when it is useful, text editing when
     the popup is not in the way; APG's allowed optional list behavior).
   - **Enter** — if an option is active, **toggle** it (Combobox-R10);
     `preventDefault` so an enclosing form does not submit. If no option is
     active, close the popup with no change.
   - **Escape** — if the popup is **open**, close it and clear the query
     (chips/`value` unchanged); if **already closed**, clear the query text
     only. Escape **never clears selections** — destroying a multi-value set
     from a dismiss key is too destructive; chips carry their own dismiss
     affordance (Combobox-R5).
   - **Tab / Shift+Tab** — close the popup and let focus move naturally; the
     blur reconciliation (Combobox-R10) runs when focus leaves the control.

   All handled keys that drive the widget `preventDefault` their default
   (ArrowUp/Down page-scroll, Enter submit, Alt+Arrow) except plain typing,
   Backspace, and the closed-popup Home/End text-cursor case.
9. **Combobox-R9 — Virtual focus & scroll-into-view.** DOM focus stays on the
   input while navigating the list; the "focused" option is tracked as an
   **active index** into the visible list and surfaced as
   `aria-activedescendant` on the input (Combobox-R2) plus `data-active` on the
   `<li>` (Combobox-R3). Moving the active option (Combobox-R8)
   `scrollIntoView({ block: 'nearest' })`s it within the popup (instant — no
   smooth scroll, so it is reduced-motion-safe). Disabled options are **never**
   active and are skipped by arrow/Home/End navigation. The active index is
   clamped/reset whenever the visible list changes (Combobox-R6), except after
   a commit, where it follows the just-toggled option (Combobox-R10).
10. **Combobox-R10 — Selection commit & blur.** Committing = clicking an
    enabled option **or** pressing Enter on the active option. A commit
    **toggles** that option's membership in `value` (append if absent, remove
    if present), then:
    - clears the query (input text → `''`, so the list re-filters to the full
      list) and fires `onchange(value)`;
    - **keeps the popup open** (Combobox-R7);
    - keeps DOM focus on the input (pointer selection must not blur the input —
      `preventDefault` the option `mousedown`, or re-focus after click);
    - keeps the **active option on the just-toggled option** (re-derive its
      index in the re-filtered visible list).

    Clicking a `data-disabled` option is a no-op. **On blur** (focus leaves
    `.hz-combobox` — `relatedTarget` not within, per a `focusout` handler), the
    query is **cleared** and the popup closes — a half-typed filter never
    lingers; `value` (the chips) is never touched by blur.
11. **Combobox-R11 — Disabled options.** A `FormOption` with `disabled: true`
    renders its `<li>` with `aria-disabled="true"` + `data-disabled`, is
    excluded from keyboard navigation and from ever being the active option
    (Combobox-R9), and cannot be toggled by click or Enter (Combobox-R10). It
    still renders (visible but inert), and still participates in filtering. An
    already-selected value whose option is disabled keeps its chip
    (Combobox-R5).
12. **Combobox-R12 — Toggle button.** The trailing
    `<button type="button" class="hz-combobox-toggle" tabindex="-1"
    aria-label={toggleLabel}>` (default `'Show options'`) holds the decorative
    `IconChevronDown`. It is **out of the tab order** (`tabindex="-1"`) because
    the input is the widget's tab stop for opening (APG); activating it toggles
    the popup open/closed and returns focus to the input. When the field is
    `disabled` the button is `disabled` too. Its icon is `aria-hidden` via the
    Icon component's decorative default; the button's name comes from
    `aria-label`.
13. **Combobox-R13 — Empty results.** When filtering yields **zero** visible
    options, render a single non-option
    `<li class="hz-combobox-empty" role="presentation">{emptyText}</li>`
    (default `'No results'`) inside the listbox. It is not an `option`, never
    becomes active, carries no id in `aria-activedescendant`, and is skipped by
    keyboard navigation (there is nothing to activate; Enter closes with no
    change).
14. **Combobox-R14 — Field states.** `required` → `aria-required="true"` on the
    input and the visible `*` indicator via Field-R3 (advisory only — hidden
    inputs are not natively constraint-validated, so enforcement is the
    consumer's / `Form`'s job, consistent with the family's consumer-owned
    validation). `disabled` → the visible input **and** the toggle button get
    the native `disabled` attribute (removing them from the tab order and
    submission), chips render without dismiss buttons (Combobox-R5), and the
    wrapper `data-state="disabled"` (unless `error` wins, Field-R1). `error`
    (non-empty) → `role="alert"` message (Field-R5), `aria-invalid="true"` on
    the input, `data-state="error"`, and the error border resolves through
    `--hz-intent-danger` in the theme.
15. **Combobox-R15 — class & rest.** Root class is
    `cx('hz-field hz-combobox', className)` — the base classes first and never
    removable. `...rest` spreads **first** on the **visible combobox `<input>`**
    so component-managed attributes (`id`, `role`, `aria-*`, `class`, `type`,
    the key/pointer handlers) win over any conflicting rest value; a forwarded
    native handler (e.g. `oninput` / `data-testid`) reaches the input. Rest
    does **not** land on the hidden inputs, the chips, the toggle, or the
    listbox.
16. **Combobox-R16 — Shared types.** `FormOption` and `ComboboxChipProps` are
    declared in and exported from `src/lib/types/index.ts`; the component
    imports them rather than redeclaring. `SelectOption` is redefined in terms
    of `FormOption`; `RadioOption` is removed and `RadioGroup.svelte` (plus the
    Select / RadioGroup docs type tables) migrate. `BadgeIntent` /
    `BadgeVariant` / `BadgeSize` move from `Badge.svelte` into
    `src/lib/types/index.ts` (exported; Badge imports them — no behavior
    change). (See Shared Type.)
17. **Combobox-R17 — Barrel export.** `Combobox` exported from
    `src/lib/components/index.ts`; `import { Combobox } from '$lib'` resolves;
    assertion + smoke render added to `src/lib/exports.spec.ts`.
18. **Combobox-R18 — Structural CSS only + theme.** Scoped component styles
    carry **no** chrome:
    - `.hz-combobox-control` as a **wrapping** flex row
      (`display: flex; flex-wrap: wrap; align-items: center;
      position: relative`, input `flex: 1; min-width: 0`) — chips wrap to
      multiple rows, the control grows, and the popup tracks the control's
      bottom edge;
    - the toggle as an inline-flex cursor-pointer reset;
    - `.hz-combobox-popup` absolutely positioned **within the control**
      (`position: absolute; inset-inline: 0; top: 100%`) — the control, not the
      field root, is the positioning ancestor, so the popup anchors directly
      under the control box regardless of description/error text below;
    - the listbox as a `list-style: none` scrollable block;
    - `.hz-combobox-option` as a flex row;
    - `display: none` on the popup while `.hz-combobox` lacks `data-open`;
    - while `.hz-combobox[data-open]`, the Field description and error
      (`.hz-field-description`, `.hz-field-error`) are **`visibility: hidden`**
      (structural — behavior, not chrome): the popup overlays that region and
      partially-peeking helper text reads as broken. They stay in the DOM, so
      the `aria-describedby` chain still resolves (hidden elements still
      participate in accessible-description computation).

    All visuals live in **`theme/combobox.css`** (in `@layer hz-theme`,
    imported by `theme.css`, every `var()` carrying a **literal fallback** per
    the fallback-compat convention): the popup surface/border/shadow/radius,
    the `z-index: var(--hz-z-dropdown, 10)` layering, `max-height` + scroll,
    option padding, chip-row spacing in the control, the **active-option**
    highlight keyed on `[data-active]`, the **selected** marker keyed on
    `[data-selected]` (a non-color-only affordance — `IconCheck` or
    equivalent), the disabled option muting keyed on `[data-disabled]`, the
    toggle icon rotation on `.hz-combobox[data-open]`, and the empty-state
    muting. The **combobox control box, focus ring, and error/disabled chrome
    reuse the field family**: amend `field.css`'s shared text-control selector
    (the `:where(select, textarea, .hz-slider-number, .hz-color-hex)` group and
    its `:focus-within` / `[data-state='error']` / `[data-state='disabled']`
    rules) to include `.hz-combobox-control`, so the box border,
    `--hz-field-ring` focus ring (on `:focus-within`), danger border, and
    disabled tint come for free — no combobox-specific reimplementation.
19. **Combobox-R19 — Docs page.** A docs route
    `src/routes/forms/combobox/+page.svelte` per `specs/16-docs.md` R6 (docs
    write scope: `src/routes/forms/combobox/` and a `src/docs/manifest.ts`
    entry — outside the library source): a single `<h1>` "Combobox", a one-line
    description, the import snippet
    (`import { Combobox } from '@hyzer-labs/ui'`), one or more **live**
    `Example` demos rendering the real component (basic pick-several with
    chips and dismiss; a disabled option; a custom `filter`; a styled-chips
    demo via `chipProps`; description / error / required / disabled states), a
    `PropsTable` sourced from the Props table above (`value: string[]`,
    `onchange(value: string[])`), supporting **type tables** for `FormOption`
    **and** `ComboboxChipProps` (`types={[…]}` like the Select page's option
    type table), and an accessibility note covering `role="combobox"` /
    `aria-activedescendant` virtual focus, `aria-multiselectable`, the chip
    tab stops, and the keyboard map (including Backspace chip removal). The
    page also carries a **"Select vs Combobox" guidance callout** — reach for
    `Combobox` when there are **many** options (where filtering / virtualization
    helps) or when **search / type-to-filter** is needed, and prefer the simpler
    native `Select` (`specs/13-forms.md`, including native `multiple`) for
    **small, static** option sets — **cross-linking `/forms/select`** (the
    mirror of Select-R7). A `{ label: 'Combobox', href: '/forms/combobox' }`
    entry is added to the **Forms** section of `src/docs/manifest.ts` (placed
    after `Select`), keeping the manifest↔exports parity test green
    (`specs/16-docs.md` R14).

### Responsive Behavior

- The Combobox is a full-width field block at **all** breakpoints (mobile
  `<640px`, tablet `640–1024px`, desktop `>1024px`) — same as every field
  (`specs/13-forms.md`). The control row and popup span the field width; the
  popup's `inset-inline: 0` keeps it aligned to the control at every width.
  Chips wrap to as many rows as needed; the control grows and the popup stays
  attached to its bottom edge.
- The popup is a `max-height`-capped scroll region (theme) so a long option
  list never overflows the viewport; on mobile it scrolls within the same
  anchored box rather than switching to a full-screen sheet (no
  interaction-pattern change by breakpoint).
- Touch: the toggle, chips, and options are pointer targets sized by the theme
  (≥44×44 hit area is a theme concern); the component ships no
  breakpoint-specific CSS. `type="text"` + `autocomplete="off"` opts out of
  aggressive mobile autofill over the filter query.

### Accessibility (WCAG 2.1 AA)

- Implements the WAI-ARIA APG **combobox** pattern (list autocomplete, ARIA
  1.2) with a multi-select listbox: `role="combobox"` input with
  `aria-expanded`, `aria-controls` → `role="listbox"` +
  `aria-multiselectable="true"`, `aria-autocomplete="list"`, and **virtual
  focus** via `aria-activedescendant` — DOM focus stays on the input during
  list navigation, so screen-reader users hear the active option announced
  while the text field stays editable (4.1.2). Options are `role="option"`
  with `aria-selected` reflecting membership in `value`.
- Full keyboard operability (2.1.1) per Combobox-R8: Arrow/Alt+Arrow/Home/End
  to open and traverse, Enter to toggle, Escape to dismiss (then clear the
  query), Backspace to remove the last chip, Tab to leave. Every chip is also
  individually removable via its labelled dismiss button (`Remove {label}`),
  which is a real tab stop (Combobox-R5). No keyboard trap — Tab and outside
  click both dismiss and release focus.
- The listbox is named (`aria-label={label}`) so the popup has an accessible
  name; the input is labelled by the Field `<label for>` (Field-R2), never by
  a placeholder (1.3.1, 3.3.2). `description`/`error` chain into
  `aria-describedby` (still computed while visually suppressed during open —
  Combobox-R18); `error` uses `role="alert"` for immediate announcement and
  sets `aria-invalid` (3.3.1); `required` sets `aria-required` and the visual
  `*` is `aria-hidden` (3.3.2).
- Selection state is conveyed by `aria-selected`, by the chip list itself, and
  reinforced by a non-color-only marker in the theme on `[data-selected]`, so
  the current choices are not signalled by color alone (1.4.1). The
  active-option highlight is a background/contrast change, not hue only.
- Motion: option scroll-into-view is instant (`block: 'nearest'`, no smooth),
  so there is nothing to suppress under `prefers-reduced-motion`; any
  theme-layer popup transition must respect it. No `outline: none` without a
  replacement — the focus ring rides the field family's `--hz-field-ring`
  (theme).
- Color contrast is a theme concern (no colors shipped by the component); the
  reference theme's active/selected/disabled states target AA against the
  popup surface.

### Edge Cases & Error States

| Case                                                | Expected behavior                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `options` empty                                     | Popup opens to the empty-state row (`emptyText`); no option is active; Enter closes, no change (Combobox-R13). |
| Filter matches nothing                              | Empty-state row shown; `aria-activedescendant` omitted; nav keys no-op (Combobox-R6/R13).       |
| `value` contains an existing option value           | That option's chip renders; its `<li>` is `data-selected` / `aria-selected="true"` (Combobox-R4/R5). |
| `value` contains a value **not** in `options`       | No chip, no hidden input for that entry; the array is not mutated (Combobox-R4).                |
| Commit an unselected option (click / Enter)         | Value appended, chip added, query cleared, popup **stays open**, active follows the option, `onchange` fires (Combobox-R10). |
| Commit an already-selected option                   | Value removed (toggle off), chip removed, query cleared, popup stays open, `onchange` fires (Combobox-R10). |
| Chip dismiss clicked                                | Value removed, `onchange` fires, focus moves to the input, popup state unchanged (Combobox-R5). |
| Backspace with empty query                          | Last chip removed, `onchange` fires; with query text, native editing (Combobox-R8).             |
| Backspace with empty query and no chips             | No-op (Combobox-R8).                                                                            |
| Type a query, then blur without committing          | Query cleared, popup closed; `value`/chips untouched (Combobox-R10).                            |
| Escape while open                                   | Popup closes, query cleared, `value` unchanged (Combobox-R8).                                   |
| Escape while closed                                 | Query text cleared; `value` unchanged — selections are never Escape-cleared (Combobox-R8).      |
| Enter with an active option                         | Toggles it, keeps the popup open, `preventDefault`s form submit (Combobox-R8/R10).              |
| Enter with no active option                         | Popup closes, no change, no submit (Combobox-R8).                                               |
| Click a disabled option                             | No-op — not toggled (Combobox-R11).                                                             |
| Selected value whose option is `disabled`           | Chip renders and is dismissible; the `<li>` stays inert (Combobox-R5/R11).                      |
| Arrow past the ends                                 | Wraps (down from last → first, up from first → last), skipping disabled (Combobox-R8/R9).       |
| Home/End while closed vs open                       | Closed → native text cursor; open → first/last enabled option (Combobox-R8).                    |
| Popup open with `description`/`error` present       | Popup anchors to the control's bottom edge; description/error are `visibility: hidden` while open, restored on close (Combobox-R18). |
| `error` **and** `disabled` both set                 | `data-state="error"` wins (Field-R1); input + toggle still get native `disabled`, chips lose dismiss buttons (Combobox-R14). |
| `required` submitted empty                          | `aria-required` present; no native block (hidden inputs) — consumer/`Form` validates (Combobox-R14). |
| Outside click / Tab away with popup open            | Popup closes; blur reconciliation clears the query (Combobox-R7/R10).                           |
| Focus moves input → chip dismiss button             | Still "within" the control — no blur reconciliation, popup state unchanged (Combobox-R5/R10).   |
| `...rest` attempts `id`/`role`/`class`/`aria-*`     | Component-managed value wins (Combobox-R15).                                                    |
| SSR / pre-mount                                     | Static markup renders (chips + input + hidden values + closed listbox); listeners, outside-click, and scroll attach on mount. |

### Existing Code to Reuse

- **Field scaffold:** the non-exported `src/lib/components/Field.svelte`
  (Field-R1…R7) via a `control` snippet, **exactly as `Select.svelte` does** —
  do not reimplement label/description/error/`data-state`/id logic
  (Combobox-R1). Field's `dataOpen` pass-through surfaces `data-open` on the
  field root.
- **Chips:** the exported `Badge` component (`specs/19-badge.md`) with
  `onDismiss` + per-item `dismissLabel` (Badge-R3) — do not build a bespoke
  chip.
- **Utils:** `cx` and `uid` from `src/lib/utils` (Combobox-R1/R15) — no new
  class-merge or id logic.
- **Types:** `FormOption` in `src/lib/types/index.ts` (shared with Select /
  RadioGroup — Combobox-R16); import it, do not redeclare.
- **Icons:** `IconChevronDown` (toggle) and `IconCheck` (theme selected marker)
  from `$lib/icons`; Badge supplies its own `IconX` for chip dismissal.
- **Popup behavior pattern:** `Nav.svelte` — `bind:this` refs, `$effect` with
  `document` `click`/`keydown` listeners and cleanup for outside-click
  dismissal, `aria-expanded`/`aria-controls` wiring, and the
  `data-state`/`data-open` open/close hook. Mirror it rather than inventing new
  listener plumbing.
- **Value binding & callback idiom:** `$bindable` per `Select.svelte`; the
  single `onchange(value)` callback per `Pagination.svelte`
  (`specs/21-pagination.md`).
- **Theme reuse:** the field-family text-control chrome in
  `src/lib/theme/field.css` (border, `--hz-field-ring` focus ring,
  `[data-state='error'|'disabled']`) — amend its shared selector to include
  `.hz-combobox-control` (Combobox-R18); do not restyle the box from scratch.
  `src/lib/theme/combobox.css` for popup/listbox/option/chip-row chrome,
  imported by `theme.css` alongside the other field sheets.
- **Tokens:** `--hz-z-dropdown` for popup layering, `--hz-space-*` /
  `--hz-radius-*` / `--hz-color-*` / `--hz-intent-danger` with literal
  fallbacks (Combobox-R18).
- **Barrel + export test:** extend `src/lib/components/index.ts` and the
  `$lib (.)` assertion in `src/lib/exports.spec.ts` (Combobox-R17).
- **Docs scaffold:** `src/docs/DocPage.svelte`, `Example.svelte`,
  `PropsTable.svelte` (with `PropRow`), and `Tabs`/`Stack` from `$lib`,
  mirroring `src/routes/forms/select/+page.svelte` (Combobox-R19).
- **Test harness:** mirror `Select.svelte.spec.ts` / `Tabs.svelte.spec.ts` —
  Vitest browser mode (`vitest-browser-svelte`: `render`, `page.getBy*`,
  `await expect.element`, `userEvent` from `vitest/browser`).
  `expect.requireAssertions` is on — every test asserts.

### Test Plan

Runner: **Vitest** browser project (chromium, **Playwright** provider) with
`vitest-browser-svelte`. One spec file
`src/lib/components/Combobox.svelte.spec.ts` (the `.svelte.spec.ts` suffix
routes to the browser `client` project in `vite.config.ts`). Keyboard, virtual
focus, `aria-activedescendant`, chip focus management, and DOM focus are
asserted in the real browser env. No Playwright e2e (docs demos are a later
sprint).

**Unit / component (browser):**

- **Structure & ARIA (Combobox-R1/R2/R3):** root `.hz-field.hz-combobox` with
  `data-state`; input `role="combobox"` with `aria-autocomplete="list"`,
  `aria-expanded="false"` closed / `"true"` open, `aria-controls` → the
  `role="listbox"` id; listbox named by `aria-label` and
  `aria-multiselectable="true"`; each `<li role="option">` with id,
  `aria-selected` per membership, and `data-*` hooks; one hidden input per
  selected value carrying `name`; the popup is a child of the control.
- **Filtering (Combobox-R6):** typing narrows the visible options
  (case-insensitive substring); a custom `filter` overrides; empty query shows
  all options; selected options remain listed; active resets to the first
  enabled match on each typing-driven change.
- **Keyboard (Combobox-R8/R9):** ArrowDown/Up open and move active (wrapping,
  skipping disabled) with `aria-activedescendant` + `data-active` tracking;
  Alt+ArrowDown opens without moving; Alt+ArrowUp closes unchanged; Home/End
  first/last enabled when open; Enter toggles the active option, keeps the
  popup open, and does not submit an enclosing form; Escape open → close +
  clear query with `value` untouched, closed → clear query only; Backspace on
  an empty query removes the last chip (and is a no-op with no chips); Tab
  closes and clears the query. DOM focus stays on the input during list
  navigation (`document.activeElement`).
- **Selection & binding (Combobox-R4/R10):** click and Enter toggle membership
  on and off → `value` updates (two-way `$bindable` into a parent), chips
  append/remove in selection order, hidden inputs update, `onchange` fires
  with the new array, the query clears, the popup stays open, and the active
  option follows the toggled option; clicking a disabled option is a no-op;
  pointer selection keeps DOM focus on the input; programmatic `value` changes
  update chips + hidden inputs; unknown entries render no chip and no hidden
  input.
- **Chips (Combobox-R5):** one Badge per selected value in selection order,
  each with an accessible `Remove {label}` dismiss button; dismiss removes the
  value, fires `onchange`, and moves focus to the input; dismiss does not
  change popup state; focus moving input → chip does not trigger blur
  reconciliation; disabled field renders chips without dismiss buttons; a
  selected-but-disabled option's chip is still dismissible; default chips are
  `data-size="sm"`; `chipProps` reaches the Badge (e.g.
  `{ intent: 'primary', rounded: 'md', size: 'md', class: 'foo' }` reflects in
  the chip's `data-intent`/`data-rounded`/`data-size` hooks and class) while
  `dismissLabel`-style managed props cannot be displaced by it.
- **Disabled options / empty state (Combobox-R11/R13):** disabled `<li>` has
  `aria-disabled`/`data-disabled`, is skipped by nav, not toggleable; a filter
  with no matches renders the `.hz-combobox-empty` row and no active
  descendant.
- **Field states (Combobox-R14):** `required` → `aria-required` + `*`;
  `disabled` → native `disabled` on input **and** toggle + `data-state` + no
  chip dismiss buttons; `error` → `role="alert"` + `aria-invalid` +
  `data-state="error"` (error wins over disabled).
- **Open-state description/error suppression (Combobox-R18):**
  `.hz-field-description` / `.hz-field-error` are `visibility: hidden` while
  `data-open` is present and visible again after close.
- **class & rest (Combobox-R15):** no `class` → exactly `hz-field hz-combobox`;
  `class="foo"` appended; a forwarded `data-testid`/`oninput` reaches the
  input; an attempted `role`/`id` override loses to the managed value.
- **Export (Combobox-R17):** extend `exports.spec.ts` to assert `Combobox`
  resolves from `$lib` (+ smoke render).

**Integration (browser):** a `Combobox` inside a native `<form>` with a submit
button — selecting several options renders repeated hidden inputs so
`form.elements[name]` resolves a `RadioNodeList` of the committed values (and
`new FormData(form).getAll(name)` returns them in selection order); the widget
participates in a `Form` error summary identically to `Select` (targeting via
`form.elements[name]`, `specs/14-form.md` Form-R4/R7); required-empty relies on
consumer validation (no native block).

### Out of Scope

- **Single-select mode** — `Select` covers single-select today; a possible
  future `multiple={false}`-style prop if a filterable single-select need
  appears.
- **Free-text / custom values (`allowCustom`) and tagging** — deferred
  (Context); the strict `value ⊆ options` invariant holds.
- **Chip roving-tabindex / APG grid navigation** for the chip list — chips are
  plain tab stops (Combobox-R5).
- **Optgroups / grouped options** — the Combobox `options` prop is a flat
  `FormOption[]` only; grouping is a later addition (unlike `Select`, which
  has the union form).
- **Async / remote options, debounced fetching, and loading states** —
  `options` is a static array the consumer supplies; a consumer can re-filter
  externally, but no fetch/loading contract ships.
- **Floating-popup collision handling** (flip/shift/auto-placement, portal-ing
  out of overflow) — the popup anchors below the control with a `max-height`
  scroll; no floating-ui/virtual-anchor engine. Revisit if clipping in
  constrained containers becomes a real problem.
- **Option virtualization / windowing** for very large lists — deferred to a
  **follow-up spec** that integrates the now-real `Virtualizer`
  (`specs/23-virtualizer.md`) with the combobox listbox. That spec's Out of
  Scope records **why** the integration is non-trivial (virtual focus via
  `aria-activedescendant` requires the active option to be present in the DOM,
  but windowing elides off-screen rows; and the Combobox keys option ids off
  the **filtered** index, which must be reconciled with the Virtualizer's
  **absolute** index) and states the intended future direction. Until that
  lands, Combobox renders **every** filtered option (no windowing).
- **Colors, borders, shadows, radius, fonts, and state animation** — the
  reference theme's job (`combobox.css` + the `field.css` amendment); the
  component guarantees only stable `hz-*` hooks + `data-*`/`aria-*`.
- **Playwright e2e** for the docs demo — later sprint (Combobox-R19 ships the
  page and manifest entry; the browser unit suite covers behavior).
