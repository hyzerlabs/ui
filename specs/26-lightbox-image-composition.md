# Lightbox ↔ Image Composition Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`LightboxTrigger-Rn`) and edge case as pass/fail. Write scope for
> the Builder is `src/lib/components/Lightbox.svelte` (+ the existing
> `src/lib/components/Lightbox.svelte.spec.ts`, **extended, never regressed**) and
> the three docs pages named in LightboxTrigger-R9/R10/R11
> (`src/routes/media/lightbox/+page.svelte`,
> `src/routes/media/image/+page.svelte`, `src/routes/+page.svelte`).
>
> Created 2026-07-14. This ships **one new per-item `trigger` snippet on the
> `Lightbox` component** plus the docs work that makes the Image ↔ Lightbox
> relationship legible. It **builds on** `specs/25-lightbox-group.md` (the
> `lightboxGroup` attachment + `LightboxOverlay` extraction) — that spec's
> LightboxGroup-R4 was already amended with an `aria-hidden` structural
> exclusion; this spec **does not** re-specify it, only composes over it in the
> docs demo (LightboxTrigger-R9). Key decisions are recorded inline (Context)
> with dated rationale; they are decisions, not open questions.

### Goal

Let consumers render **arbitrary per-item trigger faces** in the `Lightbox`
strip — most importantly `<Image aspectRatio rounded …>` faces — via a new
`trigger?: Snippet<[LightboxItem, number]>` prop that mirrors `Carousel`'s
`slide` idiom, **without** giving up any of the real-`<button>` semantics, ARIA,
or click wiring that `Lightbox` already owns. Ship, alongside it, the docs that
name and demonstrate the settled composition layering — **"Image renders media,
Lightbox provides viewing"** — on both component pages, plus a tight **library
philosophy** note on the introduction page (accessibility-first; headless
components overridden via snippets and themed via classes + `data-*` attributes).

### Layering (settled — do not relitigate)

`Image` renders media; `Lightbox` provides viewing; the `lightboxGroup`
attachment (`specs/25-lightbox-group.md`) bridges arbitrary media the consumer
doesn't control. There is **no** `lightbox` prop on `Image` and **no** internal
`Image` rendering inside the Lightbox strip. Composition happens two ways only:
(1) the consumer passes an `<Image>` into the new `trigger` snippet; (2) the
consumer applies `{@attach lightboxGroup()}` over their own `<Image>` grid.
Both are consumer-driven; neither couples `Image` and `Lightbox` in source.

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. The only library-source change is
  `src/lib/components/Lightbox.svelte`: add the `trigger` prop and branch each
  strip button's face on it. `LightboxOverlay.svelte`, the overlay, the strip's
  button/ARIA/click wiring, `resolved` normalization, `thumbOf`, `openAt`,
  `triggerEls`, and the single-custom-trigger `children` path are **unchanged**.
  No barrel/type/CSS additions are required (see LightboxTrigger-R8).
- **Per-item snippet, mirroring `Carousel` (decision 2026-07-14).** The new prop
  is `trigger?: Snippet<[LightboxItem, number]>` — the exact shape of
  `Carousel`'s `slide: Snippet<[T, number]>` (`Carousel.svelte`). It receives the
  strip item and its index and renders the **face** of that item's trigger
  button. This is deliberately the *inner-face* grain, distinct from the
  existing coarse-grained `children` snippet (which replaces the whole strip with
  one button — see the precedence rule, LightboxTrigger-R5).
- **`children` wins over `trigger` (decision 2026-07-14).** The two snippets sit
  at different grains: `children` is a *whole-strip* replacement (one custom
  button that opens item 0), `trigger` is a *per-item face* within the default
  strip. When both are passed there is no strip for a per-item face to live in,
  so **`children` takes precedence and `trigger` is ignored**; a DEV warning
  records the misuse. Rationale: the coarser, pre-existing escape hatch keeps its
  documented meaning, `trigger` is a refinement of the *default* strip only, and
  the existing `children` test path stays byte-for-byte green
  (LightboxTrigger-R3/R5).
- **The default face is untouched when `trigger` is absent (decision
  2026-07-14).** When `trigger` is `undefined`, each strip button renders exactly
  today's face — the `<img class="hz-lightbox-thumb">` (or the
  `.hz-lightbox-thumb-label` fallback) plus the video `.hz-lightbox-badge`
  (`Lightbox.svelte` lines 117–124). The entire existing suite
  (`Lightbox.svelte.spec.ts`) passes **unedited** (LightboxTrigger-R3).
- **The button's `aria-label` is the authoritative accessible name (decision
  2026-07-14).** `Lightbox` keeps setting each strip button's `aria-label`
  (`View larger: {name}`, or `triggerLabel` for the single-item case) and keeps
  `type="button"` + `aria-haspopup="dialog"` + the `onclick={() => openAt(i)}`
  wiring. Per accessible-name computation, an explicit `aria-label` on the
  `<button>` **wins over its descendant content**, so a `trigger` face — even one
  containing an `<Image>` with its own non-empty `alt` — never changes the
  button's name. To avoid a *redundant nested announcement* (a named `<img>`
  inside the already-named button), the docs **recommend** that trigger-face
  `Image`s (and bare `<img>`s) pass `alt=""` — `Image` already renders
  `role="presentation"` for empty alt (`Image.svelte` line 149), dropping the
  decorative face from the accessibility tree. This is a **recommendation, not a
  forced wrap**: `Lightbox` does not `aria-hidden` the snippet, because the
  button name is already guaranteed and the face is consumer-authored; a
  non-empty-alt face is still *correct* (button named by `aria-label`), just
  slightly redundant (LightboxTrigger-R6).
- **The `trigger` face must contain no interactive/focusable content (decision
  2026-07-14).** A `<button>`'s content model forbids interactive descendants;
  the strip button *is* the control, so its face is presentational. Interactive
  or focusable elements (links, buttons, inputs) in the `trigger` snippet are
  **forbidden** (documented contract). This is not runtime-enforced in v1 — a
  DEV warning is deferred (Out of Scope) — but it is recorded here and in the
  docs (LightboxTrigger-R6).
- Mirror existing plumbing: the `Snippet` import and `LightboxItem` import
  already present in `Lightbox.svelte`; the `import.meta.env.DEV` + `untrack`
  dev-warning idiom already in `Lightbox.svelte` (lines 52–56) for the
  both-snippets warning.

### Prop

Added to the existing `Lightbox` `Props` interface (`Lightbox.svelte`):

| Prop      | Type                                | Default |
| --------- | ----------------------------------- | ------- |
| `trigger` | `Snippet<[LightboxItem, number]>`   | —       |

`LightboxItem` is the union already imported from `$lib/types` and already used
by `resolved`; no new type. The existing `children`, `class`, `...rest`, and all
other props are unchanged.

### Requirements

Boolean `data-*` "present" = empty-valued attribute exists; "absent" = not
rendered.

1. **LightboxTrigger-R1 — `trigger` prop.** `Lightbox` accepts an optional
   `trigger?: Snippet<[LightboxItem, number]>` added to its `Props` interface and
   destructured from `$props()`. The type mirrors `Carousel`'s
   `slide: Snippet<[T, number]>`. It is passed the strip item (`LightboxItem`)
   and its zero-based index (the same `item, i` pair the `{#each resolved …}`
   already exposes).
2. **LightboxTrigger-R2 — Per-item face swap in the strip.** In the default
   (non-`children`) strip branch (`Lightbox.svelte` lines 104–128), each
   `<button class="hz-lightbox-trigger">` renders **its face** conditionally:
   when `trigger` is provided, the button body is `{@render trigger(item, i)}`
   **instead of** the default `<img class="hz-lightbox-thumb">` /
   `.hz-lightbox-thumb-label` / `.hz-lightbox-badge` face; when `trigger` is
   absent, the default face renders unchanged. The `<button>` element itself —
   `type="button"`, `class="hz-lightbox-trigger"`, `aria-haspopup="dialog"`, the
   `aria-label` derivation, `bind:this={triggerEls[i]}`, and
   `onclick={() => openAt(i)}` — is **owned by `Lightbox` and identical in both
   branches**. Only the button's inner content changes. Clicking a
   `trigger`-faced button opens the viewer at that item's index exactly as a
   default-faced button does (`openAt(i)` → `LightboxOverlay` at `startIndex`,
   focus returns to that button on close).
3. **LightboxTrigger-R3 — Zero change when `trigger` is absent.** With `trigger`
   undefined, the rendered strip markup (buttons, `.hz-lightbox-thumb` imgs,
   `.hz-lightbox-thumb-label` fallbacks, `.hz-lightbox-badge`, strip wrapper
   class/`data-*`/ARIA) is byte-for-byte today's output.
   `src/lib/components/Lightbox.svelte.spec.ts` passes **unedited** (the new
   tests are additive, in their own `describe` block — LightboxTrigger Test Plan).
4. **LightboxTrigger-R4 — Single-image sugar.** `trigger` applies uniformly to
   **every** entry in `resolved`, including the single item synthesized from the
   `src`/`alt`/`thumbSrc`/`caption` sugar. No special-casing: the sugar
   normalizes to a one-item `resolved`, the strip renders one button, and its
   face is `trigger(resolved[0], 0)` when `trigger` is provided. The button still
   carries the single-item `aria-label` (`triggerLabel` when set, else
   `View larger: {name}`) and opens the single-media viewer.
5. **LightboxTrigger-R5 — `children` precedence.** When **both** `children` and
   `trigger` are provided, `children` wins: the whole-strip single-button
   `children` branch renders (unchanged) and `trigger` is **never invoked**. In
   `import.meta.env.DEV` (guarded with `untrack`, per the file's existing
   dev-warning idiom) a one-time `console.warn` states that `trigger` is ignored
   when `children` is present. When only `children` is provided, behavior is
   today's (single custom button opening item 0). When only `trigger` is
   provided, the strip branch applies it (LightboxTrigger-R2).
6. **LightboxTrigger-R6 — Accessible name & face constraints.** The strip
   button's accessible name is always its `Lightbox`-owned `aria-label`
   (`View larger: {name}`, or `triggerLabel` for a single item) — a `trigger`
   face never overrides it (`aria-label` wins over descendant content in accname
   computation). `Lightbox` does **not** wrap or `aria-hidden` the snippet face.
   The **documented recommendation** (surfaced in the docs, LightboxTrigger-R9)
   is that trigger-face `Image`s/`<img>`s pass `alt=""` so the decorative face
   drops out of the accessibility tree (`Image` → `role="presentation"`) and no
   redundant nested announcement occurs; a non-empty-alt face is still correctly
   named but redundant. Interactive/focusable descendants in the `trigger`
   snippet are a **forbidden, documented** constraint (a `<button>` cannot
   contain interactive content); no runtime guard ships in v1.
7. **LightboxTrigger-R7 — Video items with `trigger`.** When `trigger` is
   provided it replaces the **entire** default face for every item type,
   including videos — the default `.hz-lightbox-badge` play indicator is part of
   the default face and is **not** rendered when `trigger` is present. The
   consumer's face fully owns the visual (they may render their own play
   affordance). The item's `type: 'video'` still drives the viewer (the overlay
   renders the `Video` player), and the button's `aria-label`
   (`View larger: {label}`) is unchanged.
8. **LightboxTrigger-R8 — No new exports, types, or CSS.** `Lightbox` is already
   barrel-exported (unchanged); `LightboxItem` is already exported from
   `$lib/types` (unchanged); `exports.spec.ts` needs no edit. No new component
   CSS: the existing `.hz-lightbox-trigger` reset (`display: block; padding: 0;
   border: none; background: none; cursor: zoom-in`) applies to the snippet face
   as-is; sizing an `<Image>` face (its aspect-ratio box) is the
   consumer's/theme's job, exactly as the existing `.gallery-strip
   .hz-lightbox-trigger { width: 10rem }` demo rule constrains the default strip.
   This spec adds **no** structural or theme CSS.
9. **LightboxTrigger-R9 — Lightbox docs page.** In
   `src/routes/media/lightbox/+page.svelte`:
   - **Pairing note (canonical phrasing).** Above the `Tabs`, add an
     `<Alert intent="info" title="Image + Lightbox">` (mirroring the Combobox
     page's `Select vs Combobox` Alert rhythm) whose body contains the **exact**
     sentence **"Image renders media, Lightbox provides viewing."** and a
     one-line pointer to the `<Image>` page (`/media/image`) and to the
     `lightboxGroup` attachment tab for click-to-view. Import `Alert` and `Image`
     from `$lib`.
   - **`trigger` demo.** Add a demo — either a **new tab**
     `{ id: 'triggers', label: 'Image triggers' }` (placed after `gallery`) **or**
     a clearly-delineated second `Example` inside the existing `gallery` tab —
     that renders a live `<Lightbox items={…}>` using the `trigger` snippet with
     **`<Image>`-composed faces at a uniform `aspectRatio` and `rounded`**, e.g.:

     ```svelte
     <Lightbox items={galleryItems}>
       {#snippet trigger(item)}
         <Image src={item.thumbSrc ?? item.src} alt="" aspectRatio="1/1" rounded="md" fit="cover" />
       {/snippet}
     </Lightbox>
     ```

     The demo constrains the trigger width (a grid or a fixed-width rule, like the
     existing `.gallery-strip` rule) so the aspect-ratio faces have a definite
     inline size, and a `tab-note` states the `alt=""` recommendation
     (LightboxTrigger-R6) and that `Lightbox` still owns the button, its
     `aria-haspopup="dialog"` name, and the click wiring. The code sample shows
     the `{#snippet trigger}` usage.
   - **Attachment-over-Image demo.** Recompose the existing `Group attachment`
     tab's grid so it wires `{@attach lightboxGroup()}` over **`<Image>`
     components** (aspect-ratio'd, `rounded`) instead of (or alongside) the bare
     `<img>`s — proving the attachment path works with `Image`. It passes
     `data-lightbox-src` (the full-res override) and `data-lightbox-ignore` (the
     opt-out) **through `Image`'s `...rest`** onto the inner `<img>` (relying on
     `Image` spreading rest onto the img — `Image.svelte` line 141), and relies on
     `lightboxGroup`'s already-specified `aria-hidden` exclusion
     (`specs/25-lightbox-group.md` LightboxGroup-R4, **not re-specified here**) so
     an `Image` blur placeholder, if used, is skipped. The existing tab-note that
     names both escape hatches and steers to the `Lightbox` component as the
     preferred accessible route is preserved. **No `manifest.ts` change** (the
     page already exists); if a new tab is added, it is a `demoTabs` array entry
     only.
10. **LightboxTrigger-R10 — Image docs page.** In
    `src/routes/media/image/+page.svelte`, add a short cross-link note (an
    `<Alert intent="info" title="Image + Lightbox">` above the `Tabs`, or an
    equivalent tight paragraph) containing the **exact** phrasing **"Image
    renders media, Lightbox provides viewing."** and a link to `/media/lightbox`,
    noting that click-to-view comes from the `Lightbox` component (pass an
    `<Image>` into its `trigger` snippet) or the `lightboxGroup` attachment over
    an `Image` grid. Import `Alert` from `$lib` if using the Alert form. No
    `manifest.ts` change.
11. **LightboxTrigger-R11 — Introduction / landing page philosophy note.** In
    `src/routes/+page.svelte`, **complete the library-philosophy statement — do
    not add a per-component pairing catalog.** The page currently states its
    philosophy only in the lead line (lines 17–20): *"A headless, accessible
    Svelte 5 component library. Ships behavior, structure, and accessibility —
    not visual opinions."* — which gestures at headless + accessibility + no
    visual opinions but says nothing about **how** components are overridden or
    themed. Add a new `<section aria-labelledby="philosophy-heading">` (an
    `<h2 id="philosophy-heading">` — e.g. "Philosophy" or "Design principles" —
    plus a tight paragraph and/or short `<ul>`), inserted **after** the `Usage`
    section and **before** the `Browse the docs` section, matching the page's
    existing `<section>`/`<h2>` markup and tone. It states, without repeating the
    lead verbatim:
    - **Accessibility is prioritized** — components ship the ARIA, keyboard, and
      focus behavior of the relevant WAI-ARIA pattern by default, not as an
      afterthought.
    - **Headless components are easily overridden via snippets** — structure and
      per-item content are consumer-controllable (e.g. a component's `children` /
      per-item snippets), so you shape the markup without forking the component.
    - **Theming is via classes + `data-*` attributes** — components ship only
      structural CSS and stable `hz-*` class + `data-*`/`aria-*` hooks; all
      visual chrome lives in the theme layer keyed on those hooks.

    Keep it a philosophy statement, not a tutorial: a lead sentence plus the three
    principles. If reusing the lead's wording, **strengthen/complete** it rather
    than duplicate it (do not restate "headless, accessible … not visual
    opinions" verbatim in the new section). This section carries **no**
    component-pairing line-items and **no** "Image renders media, Lightbox
    provides viewing" phrasing — that phrasing ships only on the two component
    pages (LightboxTrigger-R9/R10). No `manifest.ts` change (the introduction is
    this page).

### Responsive Behavior

- The `trigger` prop adds **no** layout of its own — the strip
  (`.hz-lightbox-triggers`, a wrapping flex row) and its buttons reflow exactly as
  today at mobile (<640px), tablet (640–1024px), and desktop (>1024px). A
  `trigger` face's size is whatever the consumer's face (e.g. an `<Image>`'s
  `aspectRatio`) plus the trigger's own width constraint dictate; the component
  ships no breakpoint-specific CSS (LightboxTrigger-R8).
- The opened viewer is the unchanged shared `LightboxOverlay`
  (`specs/25-lightbox-group.md`) — no breakpoint-specific interaction change.
- Docs demos (LightboxTrigger-R9): the Image-face grid and the attachment-over-
  Image grid reuse the page's existing responsive grid (`auto-fill` /
  `minmax`), so faces reflow with the viewport; give each face a definite inline
  size so aspect-ratio boxes resolve at every width.

### Accessibility (WCAG 2.1 AA)

- **Button semantics preserved (4.1.2, 2.1.1).** Every strip trigger remains a
  real `<button type="button">` with `aria-haspopup="dialog"`, keyboard-operable
  and in the tab order, regardless of `trigger`. A `trigger` face only swaps the
  button's visual content.
- **Accessible name (2.4.4 / 4.1.2).** The button's name is always its
  `Lightbox`-owned `aria-label` (`View larger: {name}` / `triggerLabel`); a face
  cannot displace it. Recommendation: trigger-face `Image`s/`<img>`s use `alt=""`
  so the decorative face leaves the accessibility tree and the button announces
  once, cleanly (LightboxTrigger-R6/R9).
- **No interactive content in the face (4.1.2, valid content model).** Forbidden
  and documented — the button is the sole control; a focusable descendant inside
  a button is an invalid, unreachable trap.
- **Viewer (inherited, unchanged).** Native `<dialog>` + `showModal()`: focus
  trap, `aria-modal`, Escape/backdrop close, body-scroll lock, focus returns to
  the activating trigger — all provided by `LightboxOverlay`, untouched here.
- **Motion / color.** The `trigger` prop introduces no animation and conveys
  nothing by color; the `zoom-in` cursor on `.hz-lightbox-trigger` is unchanged.
- **Docs.** The pairing Alerts (component pages) and the introduction philosophy
  note are static text with real `<a>` cross-links; the canonical phrasing and
  the philosophy principles are plain text (no color-only signalling).

### Edge Cases & Error States

| Case                                                        | Expected behavior                                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `trigger` absent                                            | Default thumb / label / video-badge face renders unchanged; existing suite green (R3).                              |
| `trigger` provided (multi-item)                             | Each strip button renders `trigger(item, i)` as its face; button + `aria-label` + `openAt(i)` wiring unchanged (R2). |
| `trigger` **and** `children` both passed                    | `children` wins — single whole-strip button renders, `trigger` never invoked; DEV `console.warn` fires (R5).        |
| `trigger` with single-image sugar (`src`/`alt`, no `items`) | Applies to the one `resolved` item — one button, snippet face, opens the single-media viewer (R4).                  |
| `trigger` face is an `<Image>` with a non-empty `alt`       | Button correctly named by `aria-label` (label wins); redundant nested announcement — `alt=""` recommended (R6).     |
| `trigger` face contains a focusable/interactive element     | Forbidden (button content model); documented, not runtime-enforced in v1 (R6).                                       |
| `trigger` on a `type: 'video'` item                         | Face fully replaced — default `.hz-lightbox-badge` not rendered; consumer owns the face; viewer plays the video (R7). |
| `items` empty and no `src` (empty `resolved`)               | Strip renders zero buttons; `trigger` never invoked; existing empty-state dev warning fires (unchanged).            |
| `trigger` renders empty / nothing                           | Button still renders with its `aria-label`, still operable (empty face) — no error (R2).                            |
| Click a `trigger`-faced button                              | Opens the viewer at that button's index; focus returns to it on close (R2).                                         |
| Attachment composed over `<Image>` with a blur placeholder  | Decorative `aria-hidden` placeholder img excluded by `lightboxGroup` (LightboxGroup-R4, not re-specified) (R9).      |
| Docs: canonical phrasing                                    | Appears verbatim on both `/media/lightbox` and `/media/image` (R9/R10); the intro page carries the philosophy note only, no pairing catalog (R11). |

### Existing Code to Reuse

- **Per-item snippet idiom:** `Carousel.svelte`'s `slide: Snippet<[T, number]>`
  (its `{@render slide(item, i)}` inside each slide) — mirror the shape exactly
  for `trigger: Snippet<[LightboxItem, number]>` (LightboxTrigger-R1/R2).
- **The strip itself:** the unchanged `.hz-lightbox-triggers` / `.hz-lightbox-
  trigger` markup, `aria-label` derivation, `bind:this={triggerEls[i]}`,
  `openAt(i)`, `resolved`, `thumbOf`, `nameOf` in `Lightbox.svelte` — branch the
  face only; touch nothing else.
- **Dev-warning idiom:** the existing `import.meta.env.DEV` + `untrack` guard in
  `Lightbox.svelte` (lines 52–56) for the both-snippets warning
  (LightboxTrigger-R5).
- **Face component (docs):** the exported `Image` (`aspectRatio`, `rounded`,
  `fit`, `alt=""` → `role="presentation"`, `...rest` → inner `<img>`) for the
  trigger-face and attachment-over-Image demos (LightboxTrigger-R9).
- **Pairing callout (docs):** the `Alert` component, used exactly as the Combobox
  page uses `<Alert intent="info" title="Select vs Combobox">` above its `Tabs`
  (`src/routes/forms/combobox/+page.svelte`) — mirror that rhythm for
  `Image + Lightbox` (LightboxTrigger-R9/R10).
- **Docs scaffolds:** `DocPage`, `Example`, `Tabs`, and the page's existing
  `demoSvg` / `tab-note` / `demoTabs` conventions in
  `src/routes/media/lightbox/+page.svelte` and `.../image/+page.svelte`; the
  section/`<h2 id>` markup already in `src/routes/+page.svelte` (Installation /
  Usage / Browse the docs) — model the new philosophy section on it
  (LightboxTrigger-R11).
- **Attachment:** the already-shipped `lightboxGroup` (`specs/25-lightbox-group.md`)
  — the attachment-over-Image demo only re-wires the existing grid over `<Image>`;
  no attachment change (LightboxTrigger-R9; Out of Scope).
- **Test harness:** `createRawSnippet` from `'svelte'` (already used in
  `Lightbox.svelte.spec.ts`) to build test `trigger` snippets; Vitest browser
  mode (`vitest-browser-svelte`, `render`, `vi`) as the existing spec uses.

### Test Plan

Runner: **Vitest** browser project (chromium, **Playwright** provider) with
`vitest-browser-svelte`. Extend `src/lib/components/Lightbox.svelte.spec.ts`
with a **new additive `describe('trigger snippet')` block** — the existing
`describe`s are **not edited** and must all stay green (LightboxTrigger-R3).
`expect.requireAssertions` is on — every test asserts. Build test faces with
`createRawSnippet` (mirroring the file's existing `customTrigger`).

**Unit / component (browser):**

- **Default face unchanged (R3):** the entire existing suite passes unedited —
  no-`trigger` renders assert `.hz-lightbox-thumb`, poster thumb + badge, and the
  poster-less label fallback exactly as today. (Reviewer runs the file whole.)
- **Snippet receives item + index (R1/R2):** render `Lightbox` with `items` (≥3)
  and a `trigger` raw snippet that renders the item's name and its index into the
  face; assert each of the N `.hz-lightbox-trigger` buttons contains the expected
  item name and index in document order.
- **Button ARIA / name preserved (R2/R6):** with `trigger`, each
  `.hz-lightbox-trigger` still has `type="button"`, `aria-haspopup="dialog"`, and
  `aria-label="View larger: {name}"`; the default `.hz-lightbox-thumb` is
  **absent** (replaced by the snippet face).
- **Click opens at the right index (R2):** clicking the 2nd `trigger`-faced
  button opens `dialog.hz-lightbox` with the 2nd carousel slide active (mirror
  the existing "second thumbnail" test), and focus returns to that button on
  close.
- **Image-composed face renders its aspect wrapper inside the button (R9-shape):**
  render `Lightbox` with an `<Image aspectRatio="1/1" rounded="md" alt="">` in
  the `trigger` snippet; assert `.hz-lightbox-trigger .hz-image` exists **inside**
  the button with `data-aspect-ratio="1/1"` and `data-rounded="md"`, and that the
  button's `aria-label` still names the item (label wins).
- **Single-image sugar + trigger (R4):** render with `src`/`alt` (no `items`) and
  a `trigger` snippet → exactly one `.hz-lightbox-trigger` button with the snippet
  face; clicking it opens the single-media viewer (a `.hz-lightbox-img`, no
  `.hz-carousel`).
- **`children` precedence (R5):** render with **both** `children` and a marked
  `trigger` snippet → the `children` face is present, the `trigger` marker is
  **absent**, and only the single `children` button renders (no
  `.hz-lightbox-triggers` strip); a `console.warn` spy records the DEV warning.
- **Video item + trigger (R7):** render `items` with a video entry and a `trigger`
  snippet → the button shows the consumer face and **no** `.hz-lightbox-badge`;
  opening that item renders the `Video` player, not an `.hz-lightbox-img`.

**Regression (must stay green, unedited):**
`src/lib/components/Lightbox.svelte.spec.ts` existing `describe`s (trigger,
dialog, open/close, barrel export, multi-item mode) — all pass after the face
branch is added (LightboxTrigger-R3).

**Docs:** no Playwright e2e in this sprint; the pages ship the live demos, the
canonical-phrasing notes (LightboxTrigger-R9/R10), and the introduction
philosophy note (LightboxTrigger-R11). Reviewer verifies the verbatim phrasing,
the philosophy principles, and the cross-links by inspection.

### Out of Scope

- **A `lightbox` prop on `Image`** — the layering is settled; `Image` renders
  media and never owns viewing.
- **Internal `Image` rendering inside the Lightbox strip** — `Lightbox` never
  imports `Image`; the only way an `Image` reaches a trigger face is the consumer
  passing it into the `trigger` snippet.
- **Any change to `lightboxGroup`** — no new attachment options and no change to
  its already-amended `aria-hidden` exclusion (`specs/25-lightbox-group.md`
  LightboxGroup-R4); this spec only composes the docs demo over `<Image>`.
- **A component-pairing catalog on the introduction page** — the intro page gets
  a library-philosophy note only (LightboxTrigger-R11); the "Image renders media,
  Lightbox provides viewing" phrasing lives on the two component pages.
- **Per-item `trigger` for the whole-strip `children` path** — `children` remains
  a single button opening item 0; it is not per-item (LightboxTrigger-R5).
- **Runtime enforcement / DEV warning for interactive descendants in the
  `trigger` face** — documented forbid only; a detector is deferred.
- **Overlay / viewer changes** — `LightboxOverlay`, its markup, paging, focus
  return, and scroll lock are untouched.
- **New barrel exports, shared types, or CSS** — none are needed
  (LightboxTrigger-R8).
- **New `manifest.ts` entries** — all three docs pages already exist.
- **Playwright e2e** for the docs demos — the browser unit suite covers the
  component behavior; the pages ship demos only.
