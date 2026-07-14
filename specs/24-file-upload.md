# FileUpload Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`FileUpload-Rn`) and edge case as pass/fail. Write scope for the
> Builder is the library source (`src/lib/**`); the docs route
> (`src/routes/forms/file-upload/`) and the `src/docs/manifest.ts` entry are the
> separate docs write scope (FileUpload-R17).
>
> Created 2026-07-14. This is the **last** member of the form-field family. Key
> decisions are recorded inline (Context) and are **decisions, not open
> questions**: **one** component (`FileUpload`) with a **`dropzone` prop** (not
> two components); the bindable surface is **`files: File[]`** (not a
> `FileList`); dropped files reach the real `<input type="file">` via a
> **rebuilt `DataTransfer`** so plain form posts include them; **client-side
> `accept` + `maxSize` validation runs on both the picker and drop paths** and
> reports rejections through an **`onreject(rejections)`** callback (the
> component reports, the consumer decides — no self-set `error`); selected files
> render as a **semantic removable list** (not `Badge` chips); and drag-and-drop
> is a **progressive enhancement** whose non-drag alternative (a real `<button>`
> opening the native picker) is always present (WCAG 2.5.7). A per-file
> `maxSize` ships; a **total-size cap is Out of Scope**.

### Goal

Ship one headless, accessible Svelte 5 `FileUpload` component: a **file
selection field** backed by a real `<input type="file">`, following the
form-field family conventions (`specs/13-forms.md`). It accepts **single or
multiple** files (`multiple` prop), filters and validates against
**user-defined accepted types** (`accept`, native semantics) and a
**user-defined per-file max size** (`maxSize`), and renders a **removable list**
of the currently-selected files (name + human-readable size). It offers two
presentations from **one** component: the **basic** visible file input, and an
**accessible dropzone** (`dropzone`) drag-and-drop surface. Drag-and-drop is a
**progressive enhancement** — full keyboard and screen-reader operability never
depends on drag; a real `<button>` opens the native picker on the non-drag path.
FileUpload is a member of the form-field family: it reuses the shared `Field`
scaffold for label / description / error / required / disabled and drops into a
`Form` (`specs/14-form.md`) like every other field. It is **not** a network
uploader (no fetch/progress — Out of Scope); it is the selection/validation
field whose real named input carries the chosen files into a plain form
submission. Headless: the component ships only structural CSS and stable `hz-*`
/ `data-*` hooks; all chrome (the dropzone dashed border, the dragover state,
the file-list rows) is the reference theme's job.

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. One file:
  `src/lib/components/FileUpload.svelte`, exported from the barrel; assertion +
  smoke render in `src/lib/exports.spec.ts`. The internal `Field.svelte`
  scaffold (`specs/13-forms.md` Field-R*) is **reused** for the
  label / description / error wrapper exactly as `Select.svelte` /
  `Combobox.svelte` reuse it — FileUpload supplies its control + file list as
  the `control` snippet.
- **Component name — `FileUpload` (decision 2026-07-14).** The barrel uses
  single PascalCase names; the thin native-input wrappers carry the `*Input`
  suffix (`TextInput`, `ColorInput`), while **composite** members are named for
  their affordance (`Combobox`, `RadioGroup`, `Slider`). This component is
  composite (dropzone + activation button + file list + validation reporting on
  top of the native input), so `FileUpload` — the recognized affordance name —
  fits the composite-naming convention better than `FileInput`. The name is
  scoped to **file selection**, not network transfer (Out of Scope), and the
  Goal / docs state that plainly.
- **One component, `dropzone` prop (decision 2026-07-14).** The basic input and
  the dropzone share ~all logic: the native input, the DataTransfer sync
  (FileUpload-R4), the validation pipeline (FileUpload-R5/R7), the file list
  (FileUpload-R8), single/multiple accumulation (FileUpload-R9), and every
  Field state. Only the outer chrome differs (a bare control vs. a drop surface
  with an activation button). Two components would duplicate that surface with
  no payoff; a boolean `dropzone` prop toggles the presentation over one
  behavioral core. Drag-and-drop layers **onto** that core as an enhancement
  (FileUpload-R6), never a replacement for the picker path.
- **Value model — `files: File[]`, `$bindable`, default `[]` (decision
  2026-07-14).** The bindable surface is a plain `File[]`, **not** a `FileList`:
  a `FileList` is not constructible, is read-only, and is awkward to splice for
  removal; `File[]` is trivially iterable/spliceable and matches the family's
  array-value idiom (`Combobox` `string[]`). The real `<input>.files` (a live
  `FileList`) is kept in sync **from** the `File[]` model via a rebuilt
  `DataTransfer` (FileUpload-R4) and remains the form-submission source of
  truth. Selection order is preserved (append order).
- **Single `onchange` + `onreject` callbacks (decision 2026-07-14).** Consistent
  with the composite members' single-callback idiom (`Pagination`,
  `Combobox`): `onchange(files: File[])` fires on every accepted change (add /
  remove / replace); `onreject(rejections: FileRejection[])` fires whenever a
  pick or drop yields rejected files. Native DOM events on the `<input>` still
  flow through `...rest`.
- **Consumer-owned validation (decision 2026-07-14).** `accept` / `maxSize` are
  **filters that report**, not enforcers that mutate consumer intent: rejected
  files are excluded from `files` and from the input, and are surfaced through
  `onreject` — the component does **not** set the field `error` itself. The
  consumer decides whether a rejection becomes an `error` string, matching the
  family's posture (`specs/13-forms.md` Out of Scope: "components present an
  externally-supplied `error` string only"). Native `accept` only filters the
  **picker dialog**; it does not validate a user who overrides the dialog to
  "All files", and it does **not** apply to drops at all — so the component runs
  the **same** `validateFile` on every incoming file from **both** paths
  (FileUpload-R5/R6/R7).
- **No native `required` attribute (decision 2026-07-14).** `required` sets
  `aria-required` + the visual `*` (advisory) but **not** the native `required`
  attribute. Native file-input constraint validation would either (a) be
  inconsistent between modes, or (b) throw "an invalid form control is not
  focusable" when the required input is visually hidden in dropzone mode. Enforcement is the consumer's / `Form`'s job, consistent with
  the family's consumer-owned validation (mirrors `Combobox-R14`,
  `Select-R5` multiple).
- IDs via `uid` from `$lib/utils` — one stable base per instance deriving
  `hz-input-{uid}`, `hz-desc-{uid}`, `hz-error-{uid}` (Field), plus
  `hz-status-{uid}` (the live region, FileUpload-R16) and
  `hz-filelist-{uid}` (the list), mirroring `Combobox.svelte` / `Nav.svelte`
  `uid` usage so id relationships survive reactive re-derivation.
- Mirror existing patterns: `cx`/`uid`; `...rest`-first spread on the native
  `<input>` (managed attributes win); `bind:this` element ref + `$effect`
  listener add/remove with cleanup per `Nav.svelte` / `Combobox.svelte`;
  `import.meta.env.DEV` + `untrack` for any dev warning (per `Card.svelte`).
- **SSR safety (decision 2026-07-14).** `File`, `FileList`, `DataTransfer`, and
  the drag events are **browser-only**. All `DataTransfer` construction and
  `input.files` assignment happen inside **event handlers or an `$effect`**
  (client-only); no browser global is touched during SSR. `File` is a
  **type-level** global (erased at compile time), so `File[]` typing is
  SSR-safe. Initial static markup renders the Field scaffold, the (empty) file
  list, and the closed dropzone; the DataTransfer sync, drag listeners, and any
  measurement attach on mount. A consumer can only supply a non-empty initial
  `files` array on the client (File objects cannot be constructed on the
  server), so the mount-time sync covers that case.
- **Structural-CSS exception** (same justification as the rest of the field
  family): the component ships **minimal structural** CSS only — the dropzone
  as a positioned flex column, the file list `list-style` reset + row layout,
  the visually-hidden native input in dropzone mode (via the shared `.sr-only`
  utility), and the basic control wrapper. **No** colors, borders, shadows,
  radius, fonts, or state visuals; any spacing references `--hz-space-*` tokens
  **with literal fallbacks** (Shared Scale, `specs/03-layout.md`). All chrome is
  `theme/file-upload.css` plus a `field.css` amendment (FileUpload-R13).

### Shared Type

**Decision 2026-07-14:** the rejection-reporting surface needs a stable,
exported shape (consumers type their `onreject` handler against it). In
`src/lib/types/index.ts`, added next to `FieldBase` / `FormOption`:

```ts
/** Why a file was rejected by FileUpload's client-side validation. */
export type FileRejectionReason = 'type' | 'size' | 'too-many';

/**
 * A single file rejected by FileUpload (accept mismatch, over maxSize, or
 * beyond the count cap — single mode's inherent 1, or `maxFiles` in multiple
 * mode). Surfaced via `onreject`; the component never silently drops a file.
 * `message` is a ready-to-display English string; the `reason` code lets
 * consumers localize or aggregate.
 */
export interface FileRejection {
	file: File;
	reason: FileRejectionReason;
	message: string;
}
```

`FileRejection` / `FileRejectionReason` are declared **only** here and imported
by the component (no local redeclaration), mirroring `FormOption` /
`ComboboxChipProps`. Documented as a supporting type table on the docs page
(FileUpload-R17). **No** `Badge`-style chip-props type is added — the file list
is a semantic list, not `Badge` chips (FileUpload-R8).

### Props

Extends `FieldBase` (`name`, `label`, `description`, `error`, `required`,
`disabled`, `hideLabel` — `specs/13-forms.md`) plus:

| Prop           | Type                                                | Default                       |
| -------------- | --------------------------------------------------- | ----------------------------- |
| `files`        | `File[]` (`$bindable`)                              | `[]`                          |
| `multiple`     | `boolean`                                           | `false`                       |
| `accept`       | `string \| undefined`                               | — (⇒ all types)               |
| `maxSize`      | `number \| undefined` (bytes, per file)             | — (⇒ no size limit)           |
| `maxFiles`     | `number \| undefined` (multiple mode only)          | — (⇒ no count limit)          |
| `dropzone`     | `boolean`                                           | `false`                       |
| `buttonText`   | `string`                                            | `'Browse files'`              |
| `dropzoneText` | `string`                                            | `'Drag and drop files here, or'` |
| `onchange`     | `((files: File[]) => void) \| undefined`            | —                             |
| `onreject`     | `((rejections: FileRejection[]) => void) \| undefined` | —                          |
| `class`        | `string` (→ `cx`)                                   | —                             |

Plus arbitrary `...rest` HTML attributes forwarded onto the **native
`<input type="file">`** (managed attributes win). `buttonText` / `dropzoneText`
apply only in dropzone mode. `maxFiles` applies only when `multiple` is true —
single mode's cap is inherently `1`, so a conflicting `maxFiles` there is dead
config and is **ignored** (decision 2026-07-14).

### Requirements

Boolean `data-*` "present" = empty-valued attribute exists; "absent" = not
rendered.

1. **FileUpload-R1 — Structure & Field scaffold.** Reuses `Field.svelte`
   (Field-R1…R7) with the root
   `<div class="hz-field hz-file-upload" data-state="error|disabled|default"
   data-dropzone?>` (class via `cx('hz-field hz-file-upload', className)` —
   `hz-field` first so the field-family state hooks apply, then `hz-file-upload`,
   then consumer classes; `data-dropzone` present exactly when `dropzone` is
   true, as the theme's mode hook). The `control` snippet renders, in order:
   - the **control region**: in basic mode a
     `<div class="hz-file-control">` wrapping the **visible** native
     `<input type="file">` (FileUpload-R2); in dropzone mode a
     `<div class="hz-file-dropzone" data-dragover?>` containing the
     `dropzoneText` copy, the activation `<button>` (FileUpload-R10), and the
     **visually-hidden** native `<input type="file">` (FileUpload-R2);
   - the **selected-files list** `<ul class="hz-file-list"
     id="hz-filelist-{uid}">` when `files` is non-empty (FileUpload-R8);
   - the **live-region status** `<div class="sr-only" role="status"
     aria-live="polite" id="hz-status-{uid}">` (FileUpload-R16).

   Description and error render through the Field scaffold (Field-R4/R5); the
   error `role="alert"` message and `data-state="error"` are unchanged.
2. **FileUpload-R2 — Native input (submission source of truth).** A **single**
   real `<input type="file" id="hz-input-{uid}" name={name}>` is rendered in
   both modes, carrying `accept={accept}` (when defined), `multiple` (when
   `multiple`), the Field aria (`aria-required="true"` when `required`,
   `aria-invalid="true"` on error, the `aria-describedby` desc→error chain —
   Field-R3/R5/R6), native `disabled` when `disabled`, and an
   `onchange` handler running the picker-path ingestion (FileUpload-R5).
   `...rest` spreads **first** so managed attributes win (FileUpload-R12).
   - **Basic mode:** the input is **visible** inside `.hz-file-control`.
   - **Dropzone mode:** the input is **visually hidden** via the shared
     `.sr-only` class, `tabindex="-1"`, and `aria-hidden="true"` — it still
     submits (`name` + `files`), but the operable, accessible control is the
     `<button>` (FileUpload-R10), avoiding a duplicate picker-opening tab stop.
     The input carries no `required` attribute in either mode (Context).
3. **FileUpload-R3 — Value model & binding.** `files` is `$bindable`, default
   `[]`: the selected `File` objects in selection order (append order). It is a
   `File[]`, not a `FileList` (Context). Every accepted change (add via picker
   or drop, remove, single-mode replace) reassigns `files` to a **new array**
   and fires `onchange(files)` with it when provided. Programmatic `files`
   changes reflect in the file list and re-sync the input (FileUpload-R4).
4. **FileUpload-R4 — DataTransfer sync & form submission.** The platform allows
   `input.files` to be set **only** via a `DataTransfer` object. Whenever the
   `files` model changes (drop, remove, programmatic, initial mount), the
   component builds a fresh `DataTransfer`, `dt.items.add(file)` for each file
   in `files` in order, and assigns `input.files = dt.files` (inside an
   `$effect`/handler — client-only, FileUpload-R2 SSR note). This keeps the real
   named input's `FileList` **exactly** equal to `files`, so a **plain form
   POST** submits precisely the selected files:
   `new FormData(form).getAll(name)` returns them in order, and
   `form.elements[name]` resolves the single `HTMLInputElement` — the `Form`
   error summary (`specs/14-form.md` Form-R4) links to its `id` like any single
   field. Reassigning `input.files` does **not** fire `change`, so no ingestion
   loop occurs.
5. **FileUpload-R5 — Picker-path ingestion.** On the input's `change` event,
   read `input.files` (the picker's `FileList`), run each file through
   `validateFile` (FileUpload-R7), partition accepted / rejected, then:
   - update the `files` model per single/multiple accumulation
     (FileUpload-R9), rebuild the input via DataTransfer (FileUpload-R4), and
     fire `onchange` if `files` changed;
   - fire `onreject(rejections)` when any file was rejected (FileUpload-R7);
   - announce the result in the live region (FileUpload-R16).

   Because the picker natively **replaces** its `FileList` each open, the
   accumulation step (not the raw event) is what preserves prior selections in
   multiple mode, and the DataTransfer rebuild is what re-materializes the
   accumulated set onto the input.
6. **FileUpload-R6 — Dropzone drag-and-drop (progressive enhancement).** In
   dropzone mode, `.hz-file-dropzone` is the drop target. Drag listeners are
   attached (via inline handlers or `$effect`, per the family's listener
   plumbing):
   - `dragenter` / `dragover` **`preventDefault`** (required to make the element
     a valid drop target) and mark `data-dragover` present;
   - a **depth counter** guards the dragover state against the
     enter/leave-on-children pitfall: `dragenter` increments, `dragleave`
     decrements, and `data-dragover` is present while the counter `> 0`; `drop`
     resets the counter to `0` and clears the state;
   - on `drop`, `preventDefault`, read `e.dataTransfer.files`, and run the
     **same** ingestion pipeline as the picker path (FileUpload-R5/R7/R9) —
     validating both paths **consistently** (native `accept` never filters a
     drop). Dropped files reach the input via the DataTransfer rebuild
     (FileUpload-R4), so a plain form post includes them.

   When `disabled`, all drag handlers are **no-ops** (no `data-dragover`, no
   ingestion). Drag-and-drop is **purely additive**: the `<button>` picker path
   (FileUpload-R10) is always present, so no capability depends on drag (WCAG
   2.5.7 — Accessibility). In **basic** mode no drag handlers are attached.
7. **FileUpload-R7 — Validation (`accept` + `maxSize` + `maxFiles`, both
   paths).** A pure `validateFile(file)` runs on every incoming file from
   **both** the picker and drop paths:
   - **`accept`** — when defined, parse the native `accept` string (a
     comma-separated list of tokens) and accept the file if it matches **any**
     token: an **extension** token (`.png`) matches a case-insensitive suffix of
     `file.name`; an **exact MIME** token (`image/png`) matches `file.type`; a
     **wildcard MIME** token (`image/*`) matches a `file.type` whose type part
     equals the token's. When `accept` is empty/undefined, all types pass. A
     mismatch is a rejection with `reason: 'type'`.
   - **`maxSize`** — when defined, a file whose `file.size > maxSize` is a
     rejection with `reason: 'size'`. `maxSize` is **per file**; there is **no**
     total-size cap (Out of Scope).
   - **count cap** — the effective cap is `1` when `multiple` is false
     (`maxFiles` ignored — Props), else `maxFiles` when defined, else
     unlimited. Incoming **valid** files are processed in order **after**
     de-duplication (FileUpload-R9 — an already-present duplicate consumes no
     slot and is not a rejection): in single mode the first valid file is
     accepted (replacing `files`) and each additional file is a rejection with
     `reason: 'too-many'`; in multiple mode incoming files fill the
     **remaining slots** (`cap − files.length`) in order and every valid file
     beyond them is a rejection with `reason: 'too-many'`. When the cap is
     already reached, all incoming non-duplicate valid files reject and
     `files` is unchanged.

   Rejected files are **never silently dropped**: they are excluded from `files`
   and the input, and all rejections from a single pick/drop are reported
   together via `onreject(rejections)` (each a `FileRejection` with a
   ready-to-display `message`). The component does **not** set `error`
   (consumer-owned validation, Context).
8. **FileUpload-R8 — Selected-files list (removable).** When `files` is
   non-empty, render `<ul class="hz-file-list" id="hz-filelist-{uid}">` with one
   `<li class="hz-file-item">` per file, in selection order (keyed by a stable
   file identity — name + size + lastModified), each containing:
   - `<span class="hz-file-name">{file.name}</span>`;
   - `<span class="hz-file-size">{formatSize(file.size)}</span>` — a
     human-readable size from an internal helper: **SI base-1000** units
     (`B` / `KB` / `MB` / `GB`), integer bytes, **one** decimal place for `KB`
     and above (e.g. `512 B`, `1.5 KB` for 1500 B, `2.0 MB` for 2 000 000 B);
     locale-agnostic. (Decision 2026-07-14, revised from base-1024: the labels
     are SI units and consumer OSes format sizes base-1000, so
     `maxSize={1_000_000}` must read as `1.0 MB` — a base-1024 formatter
     rendered it as the baffling `976.6 KB`. Binary `KiB`/`MiB` output is Out
     of Scope.) The same formatter feeds the `'size'` rejection `message`;
   - a real `<button type="button" class="hz-file-remove"
     aria-label={`Remove ${file.name}`}>` with a decorative icon. Removing
     splices that file out of `files`, rebuilds the input via DataTransfer
     (FileUpload-R4), fires `onchange`, announces the removal (FileUpload-R16),
     and **moves focus** to the next remove button (or the previous one, or the
     activation button / input if it was the last item) so focus never drops to
     `<body>`.

   The list is **not** `Badge` chips (decision 2026-07-14): a file carries a
   name **and** a size and its name may be long, which reads as list rows, not
   compact inline tokens; a vertical list matches native file-manager
   affordances and gives each file an unambiguous per-item remove control.
   When `disabled`, the list still renders but **without** remove buttons (no
   dead affordance), matching `Combobox-R5`'s disabled-chip posture.
9. **FileUpload-R9 — Single vs. multiple accumulation.** With `multiple`
   false: an accepted pick/drop **replaces** `files` with the single accepted
   file (extras rejected `'too-many'`, FileUpload-R7). With `multiple` true: an
   accepted pick/drop **appends** to the existing `files`, **de-duplicated** by
   file identity (name + size + lastModified) so re-picking an already-present
   file adds no duplicate, then **capped** at `maxFiles` (FileUpload-R7):
   non-duplicate valid files beyond the remaining slots are rejected
   `'too-many'`. Selection order is preserved; the DataTransfer rebuild
   (FileUpload-R4) reflects the resulting set onto the input.
10. **FileUpload-R10 — Activation control (dropzone mode).** The dropzone
    renders a **real** `<button type="button" class="hz-file-button">` (default
    text `buttonText` = `'Browse files'`) whose `onclick` calls
    `inputEl.click()` to open the native picker — **no** fake `role="button"`
    on a `<div>`. It is a normal tab stop; native Enter/Space activation opens
    the picker (keyboard parity with drag, WCAG 2.5.7). When `disabled` the
    button is natively `disabled`. This button — not the hidden input — is the
    operable, accessible control in dropzone mode (FileUpload-R2). In **basic**
    mode there is no separate button (the visible native input's own "Choose
    file" control opens the picker).
11. **FileUpload-R11 — Field states.** `required` → `aria-required="true"` on
    the input + the visual `*` (Field-R3); **no** native `required` attribute
    (Context); enforcement is the consumer's / `Form`'s job. `disabled` → native
    `disabled` on the input **and** the activation button; drop handlers are
    no-ops (FileUpload-R6); the file list omits remove buttons (FileUpload-R8);
    wrapper `data-state="disabled"` (unless `error` wins, Field-R1). `error`
    (non-empty) → `role="alert"` message (Field-R5), `aria-invalid="true"` on
    the input, `data-state="error"`, and the error border resolves through
    `--hz-intent-danger` in the theme (FileUpload-R13). The component sets
    `error` **only** from the consumer's prop — a validation rejection surfaces
    via `onreject`, not by self-setting `error` (Context).
12. **FileUpload-R12 — class & rest.** Root class is
    `cx('hz-field hz-file-upload', className)` — the base classes first and
    never removable (no `class` → exactly `hz-field hz-file-upload`;
    `class="foo"` appended). `...rest` spreads **first** on the native
    `<input type="file">` so component-managed attributes (`id`, `name`,
    `type`, `accept`, `multiple`, `aria-*`, `class`, the `onchange` handler)
    win; a forwarded `data-testid` / native `oninput` reaches the input. Rest
    does **not** land on the dropzone, the button, the file list, or the status
    region.
13. **FileUpload-R13 — Structural CSS only + theme.** Scoped component styles
    carry **no** chrome:
    - `.hz-file-dropzone` as a positioned flex column
      (`display: flex; flex-direction: column; align-items: center;
      position: relative`) — the drop target and the button's container;
    - `.hz-file-control` as a wrapper for the basic visible input (block,
      full-width);
    - `.hz-file-list` as a `list-style: none; margin: 0; padding: 0` reset with
      `.hz-file-item` as a flex row (name grows, size + remove trailing);
    - the dropzone-mode native input hidden via the shared **`.sr-only`** class
      (do **not** introduce a new hide utility);
    - spacing references `--hz-space-*` with literal fallbacks.

    All visuals live in **`theme/file-upload.css`** (in `@layer hz-theme`,
    imported by `theme.css`, every `var()` carrying a **literal fallback** per
    the fallback-compat convention): the dropzone dashed border / radius /
    padding / surface, the **`[data-dragover]`** active state (a
    background/border change, not hue-only), the button and file-list-row
    chrome (padding, separators, muted size text, the remove-button hover), and
    the disabled/error tints. The **basic control box, focus ring, and
    error/disabled chrome reuse the field family**: amend `field.css`'s shared
    text-control selector group (the
    `:where(select, textarea, .hz-slider-number, .hz-color-hex)` /
    `.hz-input-wrapper` / `.hz-combobox-control` set and its `:focus-within` /
    `[data-state='error']` / `[data-state='disabled']` rules) to include
    `.hz-file-control` (basic mode) and `.hz-file-dropzone` (dropzone mode
    border/error), so the border, `--hz-field-ring` focus ring, danger border,
    and disabled tint come for free — no file-specific reimplementation.
14. **FileUpload-R14 — Barrel export.** `FileUpload` exported from
    `src/lib/components/index.ts`; `import { FileUpload } from '$lib'` resolves;
    assertion + smoke render added to `src/lib/exports.spec.ts`.
15. **FileUpload-R15 — Shared types.** `FileRejection` and
    `FileRejectionReason` are declared in and exported from
    `src/lib/types/index.ts`; the component imports them rather than
    redeclaring (see Shared Type).
16. **FileUpload-R16 — Live-region announcements.** A visually-hidden
    `<div class="sr-only" role="status" aria-live="polite"
    id="hz-status-{uid}">` announces the outcome of each accepted change, so
    screen-reader users hear dynamic file changes the re-rendered list alone
    would not announce: e.g. `"{n} file(s) added"`, `"{name} removed"`, and,
    when applicable, `"{n} file(s) rejected"`. The message text is
    English/structural; it is a **separate** status region (not the file list
    made live) so navigating the list is not made verbose. Announcements fire on
    picker ingestion, drop ingestion, and per-item removal.
17. **FileUpload-R17 — Docs page.** A docs route
    `src/routes/forms/file-upload/+page.svelte` per `specs/16-docs.md` R6 (docs
    write scope: `src/routes/forms/file-upload/` and a `src/docs/manifest.ts`
    entry — outside the library source): a single `<h1>` "FileUpload", a
    one-line description, the import snippet
    (`import { FileUpload } from '@hyzer-labs/ui'`), and one or more **live**
    `Example` demos rendering the real component — **basic single**; **basic
    multiple** with the removable list; a **dropzone** drag-and-drop demo; an
    **`accept` + `maxSize` + `maxFiles`** demo that surfaces `onreject` (e.g.
    the consumer maps rejections into the field `error` string, demonstrating
    the consumer-owned posture); a **form submission** demo built with the
    library's own `Form` and `Button` components (dogfooding — not a bare
    native `<form>`/`<button>`) showing `new FormData(form).getAll(name)`
    returns the chosen files; and description / error / required / disabled
    states shown for **both** presentations — basic and dropzone —
    **side by side** per state so the two modes' state chrome can be compared
    at a glance. A `PropsTable` sourced
    from the Props table above (`files: File[]`, `onchange(files: File[])`,
    `onreject(rejections: FileRejection[])`), a supporting **type table** for
    `FileRejection` (like the Combobox page's `FormOption` table), and an
    accessibility note covering the picker-as-non-drag-alternative (WCAG 2.5.7),
    the real activation `<button>`, per-file `Remove {name}` labels, and the
    `aria-live` announcements. The note states FileUpload is a **selection**
    field, not a network uploader (Out of Scope). A
    `{ label: 'FileUpload', href: '/forms/file-upload' }` entry is added to the
    **Forms** section of `src/docs/manifest.ts` (placed **after** `Combobox`),
    keeping the manifest↔exports parity test green (`specs/16-docs.md` R14).

### Responsive Behavior

- FileUpload is a full-width field block at **all** breakpoints (mobile
  `<640px`, tablet `640–1024px`, desktop `>1024px`) — same as every field
  (`specs/13-forms.md`). The basic control and the dropzone span the field
  width; the file list is a full-width column of rows.
- The dropzone keeps the **same** interaction model at every width — a tap on
  the activation button opens the native picker (which on mobile is the OS
  file/camera/photo chooser); drag-and-drop is a desktop-pointer enhancement
  and its absence on touch changes no capability (the button path is always
  present). No breakpoint-specific CSS ships.
- File-list rows: long file names are the theme's concern (wrap or truncate via
  `.hz-file-name` chrome); the size and remove button stay on the row. Touch
  hit-area sizing (≥44×44) for the button and remove controls is a theme
  concern; the component ships no breakpoint-specific CSS.

### Accessibility (WCAG 2.1 AA)

- **Non-drag operability (2.1.1, 2.5.7).** Drag-and-drop is a progressive
  enhancement; the **single-pointer, keyboard-operable** alternative — a real
  `<button>` that opens the native picker — is always present (FileUpload-R10),
  so no function requires a dragging movement. In basic mode the visible native
  input is itself the operable control. There is no keyboard trap.
- **Labelling (1.3.1, 3.3.2, 4.1.2).** The native input is labelled by the
  Field `<label for>` (Field-R2), never by a placeholder. In dropzone mode the
  input is `aria-hidden` and the operable `<button>` carries its own visible
  accessible name (`buttonText`); each file's remove button has a unique
  `Remove {name}` label (FileUpload-R8). `description` / `error` chain into
  `aria-describedby` (Field-R6); `error` uses `role="alert"` and sets
  `aria-invalid` (3.3.1); `required` sets `aria-required` and the visual `*` is
  `aria-hidden` (3.3.2).
- **Dynamic content announcements (4.1.2).** File additions, removals, and
  rejection counts are announced through an `aria-live="polite"` status region
  (FileUpload-R16), so screen-reader users are informed of changes that the
  silently re-rendered list would not surface.
- **Drag state is not color-only (1.4.1).** The theme's `[data-dragover]` state
  is a background **and** border change, not a hue-only signal; the error state
  is conveyed by the `role="alert"` text plus the border, not color alone.
- **Motion (2.3.3).** The component ships no animation; any theme-layer dropzone
  transition must respect `prefers-reduced-motion`. No `outline: none` without a
  replacement — focus rides the field family's `--hz-field-ring` (theme).
- **Color contrast** is a theme concern (no colors shipped); the reference
  theme's dropzone, dragover, disabled, and error states target AA.

### Edge Cases & Error States

| Case                                                | Expected behavior                                                                                   |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| No files selected                                   | File list is absent; the input/dropzone renders; `files` is `[]` (FileUpload-R1/R8).                |
| Basic single pick                                   | One accepted file replaces `files`; list shows one row; input re-synced; `onchange` fires (R5/R9). |
| Basic/dropzone multiple pick                        | Accepted files append + de-dupe; list grows; input `FileList` equals `files` (R4/R9).               |
| Re-pick an already-selected file (multiple)         | De-duplicated by name+size+lastModified; no duplicate row; `onchange` reflects unchanged set (R9).  |
| Multi-file drop in **single** mode                  | First valid file accepted; each extra rejected `'too-many'` via `onreject` (R7/R9).                 |
| Batch exceeding `maxFiles` (multiple)               | Valid files fill the remaining slots in order; the excess rejected `'too-many'` (R7/R9).             |
| Pick/drop when `files.length === maxFiles`          | All incoming non-duplicate valid files rejected `'too-many'`; `files` unchanged (R7).               |
| Re-pick a duplicate while at the `maxFiles` cap     | De-dupe runs first — the duplicate consumes no slot and is **not** rejected; set unchanged (R7/R9).  |
| `maxFiles` set in single mode                       | Ignored — single mode's cap is inherently `1` (Props/R7).                                            |
| File fails `accept`                                 | Excluded from `files`/input; `onreject` with `reason: 'type'`; not silently dropped (R7).           |
| File exceeds `maxSize`                              | Excluded; `onreject` with `reason: 'size'` (R7).                                                     |
| Mixed valid + invalid pick/drop                     | Valid files ingested; invalid ones reported together in one `onreject(rejections)` call (R5/R7).    |
| User overrides picker dialog to "All files"         | Component still validates on `change`; disallowed types rejected (native `accept` only filters the dialog) (R7). |
| Drop while `disabled`                               | No-op — no `data-dragover`, no ingestion (R6/R11).                                                   |
| dragenter/leave over child elements                 | Depth counter keeps `data-dragover` present until the real leave; `drop` resets it to 0 (R6).       |
| Remove a file                                       | Spliced from `files`; input re-synced via DataTransfer; `onchange` fires; focus moves to a neighbor control (R8). |
| Remove the last file                                | List element removed; focus moves to the activation button / input; announced (R8/R16).             |
| `disabled` set                                      | Input + button native `disabled`; drops no-op; list renders **without** remove buttons; `data-state="disabled"` (R11). |
| `error` **and** `disabled` both set                 | `data-state="error"` wins (Field-R1); input still native `disabled` (R11).                           |
| `required` submitted empty                          | `aria-required` present; **no** native block (no `required` attr) — consumer/`Form` validates (R11).|
| Programmatic `files` change (bound array replaced)  | List + input re-sync via DataTransfer; `onchange` is a component-emitted callback, not re-fired for external writes (R3/R4). |
| Form submission                                     | `new FormData(form).getAll(name)` returns exactly `files` in order; `form.elements[name]` is the single input (R4). |
| `...rest` attempts `id`/`type`/`name`/`accept`/`class` | Component-managed value wins (R12).                                                              |
| SSR / pre-mount                                     | Field scaffold + empty list render; `DataTransfer` sync, drag listeners, and `input.files` assignment attach on mount (R2 SSR note). |

### Existing Code to Reuse

- **Field scaffold:** the non-exported `src/lib/components/Field.svelte`
  (Field-R1…R7) via a `control` snippet, **exactly as `Select` / `Combobox`
  do** — do not reimplement label/description/error/`data-state`/id logic
  (FileUpload-R1).
- **Utils:** `cx` and `uid` from `src/lib/utils` (FileUpload-R1/R12) — no new
  class-merge or id logic. The human-readable size formatter is a small
  component-internal helper (FileUpload-R8), not a new shared util.
- **`.sr-only`:** the existing bare `.sr-only` class (used by `Button` / `Link`
  and the field family) for the dropzone-mode hidden input and the live-region
  status (FileUpload-R2/R16) — do **not** introduce a new hide utility.
- **Types:** add `FileRejection` / `FileRejectionReason` to
  `src/lib/types/index.ts` (FileUpload-R15); import them, do not redeclare.
- **Icons:** an existing decorative icon from `$lib/icons` for the remove button
  (e.g. `IconX`, as `Badge` uses) and, optionally, an upload/attach glyph for
  the dropzone — decorative (`aria-hidden` via the Icon default).
- **Listener plumbing & value/callback idiom:** `Combobox.svelte` /
  `Nav.svelte` (`bind:this` refs, `$effect` listener add/remove with cleanup),
  and the single `onchange(value)` callback idiom (`Combobox`, `Pagination`).
- **Theme reuse:** the field-family text-control chrome in
  `src/lib/theme/field.css` (border, `--hz-field-ring` focus ring,
  `[data-state='error'|'disabled']`) — amend its shared selector to include
  `.hz-file-control` / `.hz-file-dropzone` (FileUpload-R13); do not restyle from
  scratch. `src/lib/theme/file-upload.css` for dropzone / dragover / file-list
  chrome, imported by `theme.css` alongside the other field sheets.
- **Tokens:** `--hz-space-*` / `--hz-radius-*` / `--hz-color-*` /
  `--hz-intent-danger` with literal fallbacks (FileUpload-R13).
- **Barrel + export test:** extend `src/lib/components/index.ts` and the
  `$lib (.)` assertion in `src/lib/exports.spec.ts` (FileUpload-R14).
- **Docs scaffold:** `src/docs/DocPage.svelte`, `Example.svelte`,
  `PropsTable.svelte` (with `PropRow`), and `Stack` from `$lib`, mirroring
  `src/routes/forms/combobox/+page.svelte` (FileUpload-R17).
- **Test harness:** mirror `Combobox.svelte.spec.ts` / `Select.svelte.spec.ts` —
  Vitest browser mode (`vitest-browser-svelte`: `render`, `page.getBy*`,
  `await expect.element`, `userEvent` from `vitest/browser`).
  `expect.requireAssertions` is on — every test asserts.

### Test Plan

Runner: **Vitest** browser project (chromium, **Playwright** provider) with
`vitest-browser-svelte`. One spec file
`src/lib/components/FileUpload.svelte.spec.ts` (the `.svelte.spec.ts` suffix
routes to the browser `client` project in `vite.config.ts`). File selection,
drops, the DataTransfer sync, and focus management are asserted in the real
browser env. No Playwright e2e (docs demos are a later sprint).

**Testing file selection & drops in browser mode (feasibility note).** In
Chromium both `File` and `DataTransfer` are constructible, so:
- **Picker path** — build `File` objects (`new File(['x'], 'a.png',
  { type: 'image/png' })`) and set them on the input either via
  `userEvent.upload(input, files)` (vitest browser / Playwright) or by building
  a `DataTransfer`, `dt.items.add(file)`, assigning `input.files = dt.files`,
  and dispatching a `change` event. Both drive `onchange` (FileUpload-R5).
- **Drop path** — construct a `DataTransfer`, add `File`s, and dispatch
  `dragenter` / `dragover` / `drop` `DragEvent`s carrying that `dataTransfer` on
  `.hz-file-dropzone` (FileUpload-R6). Assert `data-dragover` toggles with the
  depth counter and that dropped files reach `files` and `input.files`.
- Assert the **submission** invariant by reading `input.files` /
  `new FormData(form).getAll(name)` after ingestion (FileUpload-R4).

**Unit / component (browser):**

- **Structure & modes (FileUpload-R1/R2):** root `.hz-field.hz-file-upload` with
  `data-state`; `data-dropzone` present only when `dropzone`; basic mode renders
  a **visible** `input[type=file]` in `.hz-file-control`; dropzone mode renders
  the input `.sr-only` + `aria-hidden` + `tabindex="-1"` plus a real
  `.hz-file-button` and `.hz-file-dropzone`; input carries `name`, `accept`,
  `multiple`, and the Field aria; **no** native `required` attribute.
- **Picker ingestion & binding (FileUpload-R3/R5/R9):** selecting one file
  (single) sets `files` to that file, renders one list row, re-syncs
  `input.files`, and fires `onchange`; selecting several (multiple) appends +
  de-dupes; a bound `files` array in a parent updates two-way; a programmatic
  `files` replacement re-renders the list and re-syncs the input.
- **DataTransfer sync & submission (FileUpload-R4):** after any change,
  `input.files` (a `FileList`) equals `files` in order; inside a `<form>`,
  `new FormData(form).getAll(name)` returns the selected files and
  `form.elements[name]` resolves the single input.
- **Drop path (FileUpload-R6):** a drop with a `DataTransfer` ingests files
  identically to the picker; `dragenter`/`dragover` set `data-dragover` and the
  depth counter survives child enter/leave; `drop` clears it; a drop while
  `disabled` is a no-op.
- **Validation & rejection reporting (FileUpload-R7):** an `accept` mismatch
  (extension, exact MIME, and wildcard MIME cases) rejects `'type'`; a file over
  `maxSize` rejects `'size'`; a multi-file pick/drop in single mode rejects the
  extras `'too-many'`; with `multiple` + `maxFiles`, an over-cap batch fills
  the remaining slots in order and rejects the excess `'too-many'`, a pick at
  the cap rejects all non-duplicates with `files` unchanged, a duplicate at
  the cap is de-duped (not rejected), and `maxFiles` in single mode is
  ignored; mixed input ingests valid files and reports all
  rejections in one `onreject(rejections)` call; rejected files are absent from
  `files` and `input.files`; the component never sets `error` itself.
- **Removable list (FileUpload-R8):** one row per file with name +
  human-readable size (assert the SI formatter: 512 → `512 B`, 1500 →
  `1.5 KB`, 2_000_000 → `2.0 MB`, 1_000_000 → `1.0 MB`) and a
  `Remove {name}` button; removing splices `files`, re-syncs the input, fires
  `onchange`, and moves focus to a neighbor (not `<body>`); `disabled` renders
  the list without remove buttons.
- **Activation button (FileUpload-R10):** the dropzone `<button>` opens the
  picker (assert `inputEl.click()` is invoked / a `click` reaches the input),
  is keyboard-activable, and is a real `<button>` (no `role="button"` div);
  `disabled` disables it.
- **Field states (FileUpload-R11):** `required` → `aria-required` + `*`, no
  native `required`; `disabled` → native `disabled` on input + button, list
  without remove buttons, `data-state="disabled"`; `error` → `role="alert"` +
  `aria-invalid` + `data-state="error"` (error wins over disabled).
- **Live region (FileUpload-R16):** the `role="status"` `aria-live="polite"`
  region text updates on add / remove / reject.
- **class & rest (FileUpload-R12):** no `class` → exactly
  `hz-field hz-file-upload`; `class="foo"` appended; a forwarded `data-testid` /
  `oninput` reaches the input; an attempted `type`/`id`/`accept` override loses
  to the managed value.
- **Export (FileUpload-R14):** extend `exports.spec.ts` to assert `FileUpload`
  resolves from `$lib` (+ smoke render).

**Integration (browser):** a `FileUpload` inside a native `<form>` with a submit
button — selecting/dropping files renders the accumulated list and makes
`new FormData(form).getAll(name)` return exactly those files in order; the
widget participates in a `Form` error summary like `Select` (targeting via
`form.elements[name]`, `specs/14-form.md` Form-R4/R7); required-empty relies on
consumer validation (no native block).

### Out of Scope

- **Network upload, progress bars, retry/abort, and any XHR/fetch transport** —
  FileUpload is a **selection + validation** field; its real named input carries
  the chosen files into a plain form submission or into consumer-owned upload
  code. Progress UI is a later, separate concern.
- **Image previews / thumbnails** — the list shows name + size only; rendering
  object-URL previews is a consumer/follow-up concern (and has its own
  revoke-lifecycle cost).
- **A total-size cap** (`maxTotalSize`) — `maxSize` is per-file and `maxFiles`
  caps the count (both v1); an aggregate byte cap is trivially computed by the
  consumer from `files` and can be added later if a real need appears.
- **Directory / folder upload** (`webkitdirectory`), **paste-from-clipboard**
  file ingestion, and **capture** (camera) affordances beyond what the native
  input provides via `...rest` — none are first-class props in v1.
- **`Badge`-chip presentation** of the file list — the list is a semantic
  removable `<ul>` (FileUpload-R8); a chip variant is not offered.
- **Image cropping / editing, file reordering, and duplicate-name collision
  resolution beyond identity de-dupe** (FileUpload-R9) — out of v1.
- **Self-setting the field `error` from a validation rejection** — rejections
  are reported via `onreject`; whether they become an `error` string is the
  consumer's decision (consumer-owned validation, Context).
- **Colors, borders, shadows, radius, fonts, and state animation** — the
  reference theme's job (`file-upload.css` + the `field.css` amendment); the
  component guarantees only stable `hz-*` hooks + `data-*`/`aria-*`.
- **Playwright e2e** for the docs demo — later sprint (FileUpload-R17 ships the
  page and manifest entry; the browser unit suite covers behavior).
