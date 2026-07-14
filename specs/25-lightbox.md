# Lightbox — Canonical Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Lightbox-Rn`) and edge case as pass/fail. Write scope for the
> Builder is the library source (`src/lib/**`) plus the three docs pages named
> in Lightbox-R30/R31/R32.
>
> **Consolidated 2026-07-14.** This is the single canonical contract for **all**
> Lightbox-related work: the public `Lightbox` component, its internal
> `LightboxOverlay` viewer, the `lightboxGroup` attachment, and the docs. It
> supersedes and folds in the former `specs/25-lightbox-group.md` (the
> attachment + overlay extraction) and `specs/26-lightbox-image-composition.md`
> (the per-item `trigger` snippet + Image/Lightbox docs). Those two files are
> deleted; their dated decision history is preserved inline here (Context &
> Conventions), the same way `specs/22-combobox.md` / `specs/23-virtualizer.md`
> keep decisions inline as settled decisions, not open questions.
>
> **Accessibility is the organizing lens.** Every requirement below is written
> against the accessible behavior it guarantees (WAI-ARIA dialog pattern, focus
> management, keyboard operability, accessible names). The consolidated
> **Accessibility** section is a summary, not the source of truth — the a11y
> contract lives in the requirements themselves.

### Goal

Ship one accessible image/video viewer, in three composable layers:

1. **`Lightbox`** (exported component) — renders a strip of real-`<button>`
   triggers (or one custom trigger) and opens a shared, focus-trapped viewer.
2. **`LightboxOverlay`** (internal, non-exported) — the accessible native
   `<dialog>` viewer shared by both `Lightbox` and the attachment; owns the
   focus trap, scroll lock, carousel paging, dismissal paths, and focus return.
   It renders **image items through the library's own `Image` component** so the
   slowest image in the system gets a load-state affordance, an error state, and
   a free blur-up progressive reveal.
3. **`lightboxGroup`** (exported attachment) — a `{@attach}` DX enhancement that
   turns a container's *own* page media into a shared lightbox without a
   rendered trigger strip.

### Status — ALREADY BUILT vs NEW

The entire feature is **already implemented and under test** except one net-new
change. The Reviewer verifies **no regression** on everything marked `[BUILT]`
and verifies the new behavior on everything marked `[NEW]`.

- **`[NEW]` — the only net-new implementation work:** the overlay renders image
  items via `<Image>` (Lightbox-R15), and the resulting `.hz-lightbox-img` hook
  migration (see "The `.hz-lightbox-img` hook decision" below). This edits
  `LightboxOverlay.svelte`, `src/lib/theme/lightbox.css`, and — **sanctioned** —
  the image-bitmap assertions in the two existing suites
  (`Lightbox.svelte.spec.ts`, `lightboxGroup.svelte.spec.ts`). The former specs'
  "spec passes unedited" clause is **retired** by this change: revising the
  `.hz-lightbox-img`-as-`<img>` assertions is expected and correct.
- **`[BUILT]` — everything else (Lightbox-R1..R14, R16..R32):** formalized from
  the as-built code and its test suites. The Reviewer confirms these still pass.

### Requirement-ID migration (old → new)

Code comments and test descriptions currently cite `LightboxGroup-Rn`
(`src/lib/attachments/lightboxGroup.ts` and its two spec files;
`src/lib/types/index.ts` `LightboxGroupOptions` doc comment;
`src/lib/theme/lightbox.css`; `src/lib/exports.spec.ts`) and `LightboxTrigger-Rn`
(`src/lib/components/Lightbox.svelte.spec.ts` `trigger snippet` block; the three
docs pages). **The Builder updates every such in-code/in-docs citation to the
unified `Lightbox-Rn` IDs below.** No behavior change — comment/description text
only.

| Old ID                | New ID          | Topic                                             |
| --------------------- | --------------- | ------------------------------------------------- |
| LightboxGroup-R1      | Lightbox-R10–R14| Overlay extraction preserves the viewer contract  |
| LightboxTrigger-R3    | Lightbox-R3     | Default trigger face unchanged when `trigger` absent |
| LightboxTrigger-R1/R2 | Lightbox-R5     | `trigger` per-item face snippet                    |
| LightboxTrigger-R4    | Lightbox-R2/R5  | `trigger` applies to single-image sugar item       |
| LightboxTrigger-R5    | Lightbox-R6     | `children` precedence over `trigger` + DEV warn    |
| LightboxTrigger-R6    | Lightbox-R7     | Button owns the accessible name; face constraints  |
| LightboxTrigger-R7    | Lightbox-R5     | `trigger` replaces the video badge too             |
| LightboxTrigger-R8    | (Out of Scope)  | No new exports/types/CSS for the snippet           |
| LightboxGroup-R2/R16  | Lightbox-R16    | Factory & attachment shape; root export + test     |
| LightboxGroup-R3      | Lightbox-R17    | Client-only / SSR no-op                            |
| LightboxGroup-R4      | Lightbox-R18    | Qualifying elements & exclusions                   |
| LightboxGroup-R5      | Lightbox-R19    | Enhancement pass                                   |
| LightboxGroup-R6      | Lightbox-R20    | Item derivation                                    |
| LightboxGroup-R7      | Lightbox-R21    | Lazy scan & start index                            |
| LightboxGroup-R8      | Lightbox-R22    | Pointer activation (innermost-wins)                |
| LightboxGroup-R9      | Lightbox-R23    | Keyboard activation                                |
| LightboxGroup-R10     | Lightbox-R24    | Open via mounted overlay; single-instance guard    |
| LightboxGroup-R11     | Lightbox-R25    | Cleanup                                            |
| LightboxGroup-R12     | Lightbox-R26    | Idempotent re-run                                  |
| LightboxGroup-R13     | Lightbox-R27    | `[data-lightbox-trigger]` cursor hook; no shipped CSS |
| LightboxGroup-R14     | Lightbox-R28    | Shared overlay reuse                               |
| LightboxGroup-R15     | Lightbox-R29    | Deviation recorded in-code & docs                  |
| LightboxGroup-R17     | Lightbox-R30    | Group-attachment docs tab                          |
| LightboxTrigger-R9    | Lightbox-R30    | Lightbox docs page (pairing Alert, trigger demo)   |
| LightboxTrigger-R10   | Lightbox-R31    | Image docs page cross-link                         |
| LightboxTrigger-R11   | Lightbox-R32    | Introduction philosophy note                       |

### Layering (settled — do not relitigate)

`Image` renders media; `Lightbox` provides viewing; the `lightboxGroup`
attachment bridges media the consumer doesn't control. There is **no** `lightbox`
prop on `Image`. `Lightbox` never imports `Image` **in the strip** — the only way
an `Image` reaches a trigger face is the consumer passing it into the `trigger`
snippet. The one place the library couples them internally is the **viewer**
(Lightbox-R15): the overlay renders image items via `Image` for load-state,
error, and blur-up — a private implementation detail of the viewer, not a public
coupling. Composition remains consumer-driven two ways: (1) pass an `<Image>`
into `Lightbox`'s `trigger` snippet; (2) apply `{@attach lightboxGroup()}` over
an `<Image>` grid.

### Context & Conventions (dated decisions, preserved)

- Svelte 5 **runes mode**, TypeScript throughout. Files:
  `src/lib/components/Lightbox.svelte` (exported),
  `src/lib/components/LightboxOverlay.svelte` (**non-exported internal** — never
  in the barrel, same pattern as the internal `Field.svelte` scaffold),
  `src/lib/attachments/lightboxGroup.ts` (exported from the package root `.`
  entry alongside `toFormErrors`).
- **Overlay extraction (decision 2026-07-14).** An attachment cannot
  declaratively render a component, so it `mount()`/`unmount()`s the viewer
  imperatively. To avoid two viewers, the viewer lives in
  `LightboxOverlay.svelte`, consumed by both `Lightbox` (declaratively) and the
  attachment (imperatively). The extraction is behavior-preserving; the only
  seam is focus-return parameterization (`returnFocusTo`, Lightbox-R13).
- **Attachment, not a component (decision 2026-07-14).** `lightboxGroup` is a
  **factory**: `lightboxGroup(options?) => (node) => cleanup`, composing as
  `{@attach lightboxGroup(opts)}` and invokable directly on a DOM node (how the
  tests drive it). A `<LightboxGroup>` wrapper is Out of Scope v1.
- **Lazy scan, no MutationObserver (decision 2026-07-14).** The opening item set
  is scanned at activation time, so dynamically-added media are picked up without
  a `MutationObserver`. Pointer activation is fully delegated (`closest()`), so
  it covers any descendant added at any time. **Keyboard operability** (the
  `tabindex`/`role`/name enhancement) is applied to descendants present at
  attach / re-run time; later-added elements are pointer-operable and included in
  the overlay set but gain the keyboard affordance only on re-run.
- **Deliberate a11y deviation (decision 2026-07-14).** The library's rule is that
  click targets are real `<button>`/`<a>` (e.g. the `Lightbox` thumbnail is a
  real button). `lightboxGroup` instead makes plain media operable via
  `tabindex="0"` + `role="button"` + an accessible name + Enter/Space, because
  the whole point is to enhance *existing* page media in place. The mitigation is
  complete keyboard support and a correct accessible name; the docs present the
  real-`<button>` `Lightbox` component as the preferred accessible route
  (Lightbox-R29/R30).
- **`children` wins over `trigger` (decision 2026-07-14).** The two snippets sit
  at different grains: `children` is a whole-strip replacement (one custom button
  opening item 0), `trigger` is a per-item face within the default strip. When
  both are passed there is no strip for a face to live in, so `children` wins,
  `trigger` is ignored, and a DEV warning records the misuse (Lightbox-R6).
- **The button owns the accessible name (decision 2026-07-14).** Each strip
  button keeps its `Lightbox`-owned `aria-label` (`View larger: {name}`, or
  `triggerLabel` for a single item); a `trigger` face never displaces it
  (`aria-label` wins over descendant content). The docs **recommend** trigger-face
  `Image`s/`<img>`s use `alt=""` (→ `Image` `role="presentation"`) so the
  decorative face leaves the accessibility tree; a non-empty-alt face is still
  correct, just redundant. Interactive/focusable content in a `trigger` face is a
  **forbidden, documented** constraint (a `<button>` cannot contain interactive
  descendants); no runtime guard in v1 (Lightbox-R7).
- **Overlay renders images via `Image` (decision 2026-07-14, the `[NEW]`
  change).** The overlay already renders videos via `Video`; rendering images via
  a raw `<img>` was the asymmetry. It now renders image items via `<Image>` for a
  load-state affordance on the slowest image in the system, an error state, and a
  blur-up reveal keyed on `item.thumbSrc` (the strip thumb is already cached when
  the viewer opens — a free progressive reveal). See Lightbox-R15 and the hook
  decision below.
- **Client-only / SSR no-op.** Svelte attachments run in a post-mount effect —
  never server-side. Pre-hydration clicks do nothing (progressive enhancement;
  the underlying media stays visible). `lightboxGroup` additionally guards
  `typeof document === 'undefined'` defensively (Lightbox-R17).
- **Attachment ships no scoped CSS.** Its only styling hook is
  `[data-lightbox-trigger]`; the reference theme adds
  `[data-lightbox-trigger] { cursor: zoom-in }` in `src/lib/theme/lightbox.css`
  (Lightbox-R27).
- Mirror existing plumbing: `mount`/`unmount` from `'svelte'`;
  `import.meta.env.DEV` + `untrack` dev warnings per `Lightbox.svelte`'s existing
  idiom; `cx` from `$lib/utils`.

### The `.hz-lightbox-img` hook decision

**Decision (2026-07-14): `.hz-lightbox-img` is applied to the `<Image>` component
as its `class` prop, so it lands on Image's wrapper `<div>` (merged after
`hz-image` via `cx('hz-image', className)` — `Image.svelte`). The hook now
denotes "the image box in the viewer," not a raw `<img>`. The rendered bitmap is
Image's own `.hz-image__img`.** Rationale and coherence:

- **One hook, migrated — not renamed.** `.hz-lightbox-img` stays the stable,
  documented "viewer image" hook so custom themes keyed on it keep resolving; it
  simply resolves to the image *box* (Image's wrapper) now. Because the wrapper
  also exposes Image's `data-state` / `data-fit` / `data-placeholder` /
  `data-rounded` hooks, themes gain load-state styling for free.
- **Reference theme (`src/lib/theme/lightbox.css`).** The existing
  `.hz-lightbox :where(.hz-lightbox-img) { border-radius; box-shadow }` framed-
  image treatment stays keyed on `.hz-lightbox-img` (now the box). The Builder
  keeps the visual result identical — if the rounded corners must clip the
  bitmap, target `.hz-lightbox-img .hz-image__img` (or pass `rounded` to the
  `Image`); the hook name and `@layer hz-theme` placement do not change.
- **No crop, ever.** `fit="contain"` on the `Image` supplies `object-fit: contain`
  on the bitmap; the box's size envelope (max-width `min(92vw, 100%)`,
  max-height `80dvh`) is preserved on `.hz-lightbox-img` so the viewer image never
  exceeds the viewport and never crops.
- **Tests (sanctioned revision).** Assertions that treated `.hz-lightbox-img` as
  an `<img>` with `src`/`alt` (in `Lightbox.svelte.spec.ts` and
  `lightboxGroup.svelte.spec.ts`) are revised: assert the hook via
  `.hz-lightbox-img` presence and the bitmap via `.hz-lightbox-img .hz-image__img`
  (or `.hz-image__img`) for `src`/`alt`. Video assertions (`.hz-lightbox-video`,
  "no `.hz-lightbox-img`") are unaffected — a video item renders no
  `.hz-lightbox-img` wrapper.

### Shared Types

Reuse the existing types in `src/lib/types/index.ts`, unchanged:
`LightboxImageItem` (`{ type?: 'image'; src; alt; thumbSrc?; caption? }`),
`LightboxVideoItem` (`{ type: 'video'; src; label; poster?; thumbSrc?; caption? }`),
`LightboxItem = LightboxImageItem | LightboxVideoItem`, and `LightboxGroupOptions`
(`{ selector?; dialogLabel?; closeLabel?; prevLabel?; nextLabel? }`). No new
types. The `LightboxGroupOptions` doc comment's `LightboxGroup-R4` citation is
updated to `Lightbox-R18`.

### API

```ts
import { Lightbox, lightboxGroup } from '@hyzer-labs/ui';

// Component — single-image sugar, or items[], or a custom trigger:
// <Lightbox src="/full.jpg" alt="A disc in flight" />
// <Lightbox items={items} />
// <Lightbox items={items}>{#snippet trigger(item, i)}…face…{/snippet}</Lightbox>
// <Lightbox src="/full.jpg" alt="…">{#snippet children()}Open{/snippet}</Lightbox>

// Attachment — declarative (preferred) or imperative (how tests drive it):
// <div {@attach lightboxGroup()}> …page media… </div>
const cleanup = lightboxGroup(options)(containerElement); // → () => void
```

`Lightbox` props: `items?`, `src?`, `alt?`, `thumbSrc?`, `caption?`,
`open?` (`$bindable`), `dialogLabel?` (`'Media viewer'`), `triggerLabel?`,
`closeLabel?` (`'Close media viewer'`), `prevLabel?` (`'Previous item'`),
`nextLabel?` (`'Next item'`), `onclose?`, `children?: Snippet`,
`trigger?: Snippet<[LightboxItem, number]>`, `class?`, `...rest`.
`lightboxGroup` label defaults match the component.

---

## Requirements

Boolean `data-*` "present" = empty-valued attribute exists; "absent" = not
rendered. Each requirement is tagged `[BUILT]` (verify no regression) or `[NEW]`.

### A. The `Lightbox` component (trigger surface)

1. **Lightbox-R1 — Trigger strip `[BUILT]`.** In the default (non-`children`)
   branch, `Lightbox` renders `<div class="hz-lightbox-triggers">` containing one
   real `<button class="hz-lightbox-trigger" type="button"
   aria-haspopup="dialog">` per entry in `resolved`, in document order, each
   `bind:this={triggerEls[i]}` with `onclick={() => openAt(i)}`. `openAt(i)` sets
   `startIndex = i`, captures `returnFocusTo = triggerEls[i] ?? triggerEls[0]`,
   then flips `open = true`. Each button's `aria-label` is
   `View larger: {name}` (`name` = image `alt` or video `label`), except a single
   resolved item with `triggerLabel` set uses `triggerLabel` verbatim.
2. **Lightbox-R2 — Single-image sugar → `resolved` `[BUILT]`.** When `items` is
   empty/absent but `src` is set, `resolved` is the one-item array
   `[{ type: 'image', src, alt: alt ?? '', thumbSrc, caption }]`. When `items` has
   entries it is used verbatim; when neither is present `resolved` is empty. The
   `trigger`/`children` faces, ARIA, and viewer all operate on `resolved`
   uniformly — the sugar is not special-cased anywhere downstream.
3. **Lightbox-R3 — Default trigger face `[BUILT]`.** When `trigger` is absent,
   each strip button's face is: `<img class="hz-lightbox-thumb"
   src={thumbOf(item)} alt={name} loading="lazy">` when `thumbOf(item)` resolves
   (`item.thumbSrc ?? (video ? poster : src)`), else a
   `<span class="hz-lightbox-thumb-label">{name}</span>` fallback; and, for a
   `type: 'video'` item, an additional `<span class="hz-lightbox-badge"
   aria-hidden="true">▶</span>` overlay. This markup is byte-for-byte today's
   output.
4. **Lightbox-R4 — Custom whole-strip trigger (`children`) `[BUILT]`.** When
   `children` is provided, `Lightbox` renders **one** `<button
   class="hz-lightbox-trigger {class}">` (the `...rest` and merged `class` land on
   it) with `aria-haspopup="dialog"`, `aria-label = triggerLabel ?? (resolved[0] ?
   View larger: {name} : undefined)`, `onclick={() => openAt(0)}`, and
   `{@render children()}` as its content — no `.hz-lightbox-triggers` strip is
   rendered.
5. **Lightbox-R5 — Per-item `trigger` face snippet `[BUILT]`.** `Lightbox`
   accepts `trigger?: Snippet<[LightboxItem, number]>` (mirroring `Carousel`'s
   `slide: Snippet<[T, number]>`), passed `(item, i)` from the `{#each resolved}`.
   When provided (and `children` is absent), each strip button's body is
   `{@render trigger(item, i)}` **instead of** the default thumb/label/badge face —
   including for `type: 'video'` items (the default `.hz-lightbox-badge` is **not**
   rendered; the consumer's face owns the visual). The `<button>` element itself —
   `type`, class, `aria-haspopup`, `aria-label` derivation, `bind:this`,
   `onclick={() => openAt(i)}` — is identical to the default face's button.
   `trigger` applies uniformly to every `resolved` entry, including the single
   sugar item (one button, face `trigger(resolved[0], 0)`).
6. **Lightbox-R6 — `children` precedence + DEV warn `[BUILT]`.** When **both**
   `children` and `trigger` are provided, `children` wins: the whole-strip
   `children` branch renders and `trigger` is **never invoked**. In
   `import.meta.env.DEV` (guarded with `untrack`), a `console.warn` states that
   `trigger` is ignored when `children` is present. The existing both-snippets
   warning text is retained.
7. **Lightbox-R7 — Button owns the accessible name; face constraints `[BUILT]`.**
   The strip button's accessible name is always its `Lightbox`-owned `aria-label`
   (`View larger: {name}` / `triggerLabel`); a `trigger` face never overrides it
   (`aria-label` wins over descendant content), and `Lightbox` does **not** wrap or
   `aria-hidden` the face. **Documented recommendation:** trigger-face
   `Image`s/`<img>`s pass `alt=""` so the decorative face drops out of the
   accessibility tree (Image → `role="presentation"`). **Documented forbidden
   constraint:** interactive/focusable descendants in the `trigger` face (a
   `<button>` may not contain interactive content); not runtime-enforced in v1.
8. **Lightbox-R8 — Empty-state DEV warning `[BUILT]`.** When neither `items` nor
   `src` is provided, `resolved` is empty, zero trigger buttons render, and in
   `import.meta.env.DEV` a `console.warn` advises providing `items` or the
   single-image `src`/`alt` props.
9. **Lightbox-R9 — `class` / `...rest` forwarding `[BUILT]`.** In the default
   branch, `class` merges after `hz-lightbox-triggers` and `...rest` forwards onto
   the strip wrapper `<div>`. In the `children` branch they land on the single
   button (Lightbox-R4).

### B. The `LightboxOverlay` viewer (internal)

10. **Lightbox-R10 — Always-rendered accessible dialog `[BUILT]`.** The overlay is
    a native `<dialog class="hz-lightbox" aria-modal="true" tabindex="-1">`,
    always rendered (never conditionally mounted by `Lightbox`), closed by
    default. `data-state` is `open`/`closed` mirroring `open`. `aria-label` is the
    single item's `name` when `items.length === 1`, else `dialogLabel`. An `open`
    transition (via `$effect`) seeds `index = startIndex`, records the pre-open
    `activeElement`, and calls `showModal()` (native focus trap + top layer; the
    close button is natively focused). It is **not** added to the barrel and is not
    importable from `$lib`.
11. **Lightbox-R11 — Scroll lock `[BUILT]`.** On open, the overlay caches
    `document.body.style.overflow` and sets it to `hidden`; on any close path and
    on `$effect` teardown it restores the cached value (once). Per-instance
    scroll-lock state mirrors Modal-R16.
12. **Lightbox-R12 — Dismissal paths + paging `[BUILT]`.** Escape (native
    `cancel`, `preventDefault`ed and routed through `open = false`), a backdrop
    click (`event.target === dialog`), and the `.hz-lightbox-close` button
    (`aria-label = closeLabel`, contains a decorative `IconX`) each close the
    viewer. Clicking the media does **not** close. On the open→closed transition
    `onclose` fires **exactly once**. `ArrowLeft`/`ArrowRight` anywhere in the
    dialog page the viewer when `items.length > 1` (skipped if
    `defaultPrevented`, so the `Carousel` handles its own focus region).
13. **Lightbox-R13 — Focus return via `returnFocusTo` seam `[BUILT]`.** The
    overlay takes `returnFocusTo?: HTMLElement | null`. On close it focuses
    `returnFocusTo`, falling back to the element that was `document.activeElement`
    when the overlay opened, **before** firing `onclose`. `Lightbox` passes the
    opening trigger (`triggerEls[i]` captured at `openAt(i)` time); the attachment
    passes the activated media element. Because the target is captured at open
    time, paging before closing still returns focus to the opener.
14. **Lightbox-R14 — Carousel vs single-media rendering `[BUILT]`.** When
    `items.length > 1`, the overlay renders a `Carousel` (loop, `ariaLabel =
    dialogLabel`, `prev`/`nextLabel`, `slideLabel = "{name} ({i+1} of {n})"`,
    `class="hz-lightbox-carousel"`) with each slide rendering the shared `media`
    snippet; when `items.length === 1` it renders the `media` snippet directly.
    The `media` snippet is a `<figure class="hz-lightbox-figure">` with the item's
    media plus an optional `<figcaption class="hz-lightbox-caption">` when
    `item.caption` is set.
15. **Lightbox-R15 — Image items render via `Image` `[NEW]`.** In the `media`
    snippet, a `type: 'image'` item renders through the library's `Image`
    component instead of a raw `<img>`:
    - `<Image class="hz-lightbox-img" src={item.src} alt={item.alt}
      fit="contain" loading="eager" …>` — `fit="contain"` (a viewer never crops),
      `loading="eager"` (the image is the whole point of the open dialog; do not
      lazy-defer it).
    - **Blur-up only when a thumb exists:** when `item.thumbSrc` is set, pass
      `placeholder="blur"` + `placeholderSrc={item.thumbSrc}` (the strip thumb is
      already cached, so the reveal is free); when `item.thumbSrc` is absent, pass
      `placeholder="none"` (never trip Image's blur-without-src DEV warning).
    - **Hook migration:** `class="hz-lightbox-img"` lands on Image's wrapper
      `<div>` (see "The `.hz-lightbox-img` hook decision"); the size envelope
      (max-width `min(92vw, 100%)`, max-height `80dvh`, centered) is preserved so
      the viewer image never exceeds the viewport and never crops. The rendered
      bitmap is Image's `.hz-image__img`, which also exposes load-state
      (`data-state="loading|loaded|error"`) for theming.
    - **Video unchanged:** a `type: 'video'` item still renders
      `<div class="hz-lightbox-video"><Video src title={label} poster/></div>`.
    - The Reviewer confirms the sizing/no-crop envelope holds at narrow and wide
      viewports (the Image wrapper resolves a definite size inside the
      shrink-wrapped dialog — see Edge Cases).

### C. The `lightboxGroup` attachment

16. **Lightbox-R16 — Factory, attachment shape & root export `[BUILT]`.**
    `lightboxGroup(options?)` returns `(node: Element) => () => void`. Invoked with
    an `Element` it runs the enhancement pass (Lightbox-R19) and attaches delegated
    `click` and `keydown` listeners, returning a cleanup function (Lightbox-R25).
    It is exported from `src/lib/index.ts` (the `.` entry, beside `toFormErrors`);
    `src/lib/exports.spec.ts` asserts `mod.lightboxGroup` is defined and a
    function. `LightboxGroupOptions` is exported from `src/lib/types/index.ts`.
17. **Lightbox-R17 — Client-only / SSR no-op `[BUILT]`.** The attachment runs only
    client-side; it additionally guards `typeof document === 'undefined'`,
    returning an inert no-op cleanup without touching the node. No `window` /
    `document` access executes during SSR; pre-hydration media is inert but
    visible.
18. **Lightbox-R18 — Qualifying elements & exclusions `[BUILT]`.** A descendant
    **structurally qualifies** when it is an `<img>` (including inside a
    `<picture>`) or a `<video>` **and**, when `options.selector` is set, matches
    it. Structurally excluded (never enhanced, never in the item set):
    - any element with a `data-lightbox-ignore` ancestor within the container;
    - any media with an `aria-hidden="true"` ancestor within the container
      (decorative media — e.g. `Image`'s blur-placeholder `<img aria-hidden>` —
      must never gain `tabindex`/`role` or be duplicated into the viewer);
    - any media whose nearest interactive ancestor within the container is an
      `<a>` or `<button>` (that element already owns the interaction).
    Separately, **excluded from the activation-time item set only** (but still
    enhanced): any element that is not rendered (`hidden` attribute or zero client
    rects), so media that mounts inside a hidden region (an inactive `Tabs` panel,
    a closed `Accordion`) is enhanced up front and joins the viewer once revealed,
    but never opens the viewer while hidden. The `<picture>` wrapper is never a
    trigger — only its inner `<img>`.
19. **Lightbox-R19 — Enhancement pass `[BUILT]`.** On attach and every re-run, for
    each **structurally qualifying** descendant (rendered or not), the attachment
    records prior `tabindex`/`role`/`aria-label` (once, for restore) then sets
    `tabindex="0"`, `role="button"`, `aria-label` = `View larger: {name}`
    (`name` = image `alt` or video accessible name; empty name → `View larger`, no
    dangling colon), and `data-lightbox-trigger` (present). The video name is
    computed from the *original* attributes and cached before the `aria-label`
    write, so item derivation (Lightbox-R20) never reads back the
    `View larger: …` overwrite. Re-applying managed values is idempotent.
20. **Lightbox-R20 — Item derivation `[BUILT]`.** At activation each qualifying,
    rendered element maps to a `LightboxItem` in document order:
    - **img / picture>img** → `{ type: 'image', src, alt, caption? }` where `src`
      = `data-lightbox-src` if present (full-res override), else `currentSrc ||
      src`; `alt` = `img.alt`; `caption` = the enclosing `<figure>`'s
      `<figcaption>` text if any. (No `thumbSrc` is derived — so an
      attachment-opened viewer has no blur placeholder, consistent with
      Lightbox-R15's "blur only when `thumbSrc` exists".)
    - **video** → `{ type: 'video', src, label, poster?, caption? }` where `src` =
      `data-lightbox-src`, else `currentSrc || src`, else first nested
      `<source src>`; `poster` = `video.poster` when set; `label` precedence =
      `aria-label` → `title` → `<figcaption>` → `'Video'`; `caption` as for images.
21. **Lightbox-R21 — Lazy scan & start index `[BUILT]`.** On activation the
    attachment re-queries the container for the full ordered rendered qualifying
    set (so dynamically-added media are included without a `MutationObserver`),
    derives `LightboxItem[]`, and computes the start index = the activated
    element's position in that set. A non-rendered activation target resolves to
    index `-1` and no-ops.
22. **Lightbox-R22 — Pointer activation `[BUILT]`.** A delegated `click` listener:
    if `event.target.closest('img, video')` resolves a qualifying, contained,
    non-excluded element, the attachment `preventDefault`s and `stopPropagation`s
    (innermost nested group wins) and opens the overlay at the start index with
    `returnFocusTo` = the activated element. Works for any qualifying descendant,
    enhanced or not.
23. **Lightbox-R23 — Keyboard activation `[BUILT]`.** A delegated `keydown`
    listener: when the event target is a qualifying, contained, non-excluded media
    element (an enhanced trigger with focus) and the key is `Enter` or `Space`
    (`' '`), the attachment `preventDefault`s (Space does not page-scroll) and
    opens the overlay identically, with `returnFocusTo` = the focused element.
24. **Lightbox-R24 — Open via mounted overlay + single-instance guard `[BUILT]`.**
    Opening `mount()`s `LightboxOverlay` into `document.body` with the derived
    `items`, `startIndex`, `open: true`, the four label options, `returnFocusTo`,
    and an `onclose` that `unmount()`s the instance and clears the reference. If an
    overlay is already mounted, a new activation is **ignored** until it closes
    (single-instance guard). The overlay's own `$effect` provides `showModal()`,
    scroll lock, and — on every dismissal path — scroll restore, focus return,
    then `onclose`.
25. **Lightbox-R25 — Cleanup `[BUILT]`.** The returned cleanup removes both
    listeners; restores every enhanced element's recorded `tabindex`/`role`/
    `aria-label` (or removes them if they did not exist) and removes
    `data-lightbox-trigger`; and, if an overlay is mounted, `unmount()`s it (its
    `$effect` teardown restores body scroll; focus is **not** moved and `onclose`
    does **not** fire on a forced teardown, matching Modal's teardown semantics).
    After cleanup the container is un-enhanced (a subsequent click opens nothing).
26. **Lightbox-R26 — Idempotent re-run `[BUILT]`.** `{@attach lightboxGroup(opts)}`
    re-invokes when `opts` changes identity: Svelte tears down the prior attachment
    (Lightbox-R25) then invokes the new one, which re-scans and re-enhances current
    descendants (picking up media added since the last run). Applying managed
    values twice causes no duplication or drift.
27. **Lightbox-R27 — Styling hook, no shipped CSS `[BUILT]`.** The attachment ships
    no CSS; every enhanced element carries `data-lightbox-trigger`. The reference
    theme's `src/lib/theme/lightbox.css` carries
    `[data-lightbox-trigger] { cursor: zoom-in }` inside `@layer hz-theme` (parity
    with `.hz-lightbox-trigger`'s cursor); no other visual opinion is added.
28. **Lightbox-R28 — Shared overlay reuse `[BUILT]`.** The attachment opens the
    exact `LightboxOverlay` `Lightbox` uses — identical dialog markup, `Carousel`
    paging, single-media rendering, captions, close control, keyboard/backdrop/
    Escape behavior, and (per Lightbox-R15) `Image`-rendered image items. No
    attachment-specific viewer variant exists.
29. **Lightbox-R29 — Deviation recorded in-code & docs `[BUILT]`.** A source
    comment in `lightboxGroup.ts` records the `role="button"`-on-media deviation
    and its keyboard mitigation; the docs (Lightbox-R30) name the `Lightbox`
    component as the preferred accessible route.

### D. Docs (already shipped — reference, do not re-derive)

The three docs pages already ship the state below; these requirements pin it so
the Reviewer verifies no regression. The landing-page philosophy section is
landing-page scope and already shipped.

30. **Lightbox-R30 — Lightbox docs page `[BUILT]`.** `src/routes/media/lightbox/
    +page.svelte` carries, above its `Tabs`, an `<Alert intent="info"
    title="…">` whose body contains the exact sentence **"Image renders media,
    Lightbox provides viewing."** with a pointer to `/media/image`; and four demo
    tabs — `basic` (single image), `gallery` (gallery & video), `triggers` (Image
    triggers — a live `Lightbox` using the `trigger` snippet with `<Image>`-composed
    faces, a `tab-note` giving the `alt=""` recommendation), and `attachment`
    (group attachment — `{@attach lightboxGroup()}` over `<Image>` components,
    surfacing both escape hatches live: one `data-lightbox-ignore` element skipped
    and one `data-lightbox-src` full-res override, both passed through Image's
    `...rest`, both named in the tab note, which steers to the `Lightbox`
    component as the preferred accessible route). No `manifest.ts` change.
31. **Lightbox-R31 — Image docs page cross-link `[BUILT]`.** `src/routes/media/
    image/+page.svelte` carries a cross-link note containing the exact phrasing
    **"Image renders media, Lightbox provides viewing."** and a link to
    `/media/lightbox`, noting click-to-view comes from `Lightbox` (`trigger`
    snippet) or `lightboxGroup` over an Image grid. No `manifest.ts` change.
32. **Lightbox-R32 — Introduction philosophy note `[BUILT]`.** `src/routes/
    +page.svelte` carries a `<section aria-labelledby="philosophy-heading">`
    (after `Usage`, before `Browse the docs`) stating the library philosophy:
    accessibility is prioritized (ARIA/keyboard/focus of the relevant WAI-ARIA
    pattern by default); headless components are overridden via snippets; theming
    is via classes + `data-*` attributes. It carries **no** component-pairing
    catalog and **not** the "Image renders media…" phrasing (that lives only on the
    two component pages).

### Responsive Behavior

- **`Lightbox` triggers / `trigger` faces** add no layout of their own. The strip
  (`.hz-lightbox-triggers`, a wrapping flex row) reflows identically at mobile
  (<640px), tablet (640–1024px), desktop (>1024px). A `trigger` face's size is
  whatever the consumer's face (e.g. an `<Image aspectRatio>`) plus the strip's
  own width constraint dictate; the component ships no breakpoint CSS.
- **`lightboxGroup`** adds no layout — it enhances existing media in the
  consumer's flow, so page responsiveness is untouched at every breakpoint.
- **The overlay** sizes to its media at every breakpoint: the image box caps at
  max-width `min(92vw, 100%)` / max-height `80dvh` (Lightbox-R15), the video box
  at `min(92vw, 64rem)`. On narrow viewports the media scales down within the same
  centered dialog. No breakpoint-specific interaction change.

### Accessibility (WCAG 2.1 AA — summary; the contract lives in the requirements)

- **Dialog pattern (2.4.3 / 2.1.2 / 4.1.2).** The viewer is a native `<dialog>`
  opened with `showModal()`: focus trapped in the top layer, `aria-modal="true"`,
  labelled (`aria-label`), Escape and backdrop always close, body scroll locked,
  and focus returns to the activating trigger on close (Lightbox-R10–R13).
- **Real-button triggers (`Lightbox`) (2.1.1 / 4.1.2).** Every strip trigger is a
  real `<button type="button" aria-haspopup="dialog">`, keyboard-operable and in
  tab order regardless of `trigger`; its accessible name is the `Lightbox`-owned
  `aria-label`, which a face cannot displace (Lightbox-R1/R5/R7).
- **Deliberate deviation (`lightboxGroup`) (2.1.1 / 1.1.1 / 4.1.2).** Enhanced
  page media are not real buttons but receive `tabindex="0"` + `role="button"` +
  a `View larger: {name}` accessible name + full Enter/Space activation; the docs
  steer markup-owners to the real-button `Lightbox` component
  (Lightbox-R19/R23/R29/R30).
- **Decorative media excluded.** `aria-hidden` media (e.g. Image's blur
  placeholder) is never enhanced and never enters the viewer (Lightbox-R18).
- **Image load-state affordance (`[NEW]`).** Rendering the viewer image via
  `Image` gives the slowest image a visible loading/error state and a blur-up
  reveal; `fit="contain"` guarantees no crop; `loading="eager"` avoids deferring
  the dialog's primary content (Lightbox-R15).
- **Motion / color.** The library ships no viewer animation of its own; Image's
  blur crossfade is theme-owned and reduced-motion-respecting (`Image`
  `data-reduced-motion`). Nothing is conveyed by color alone; the `zoom-in`
  cursor is a supplementary affordance atop a text accessible name.
- **Progressive enhancement.** Before hydration `lightboxGroup` media is inert but
  visible; consumer `<a>`-wrapped media is left alone and keeps navigating
  (Lightbox-R17/R18).

### Edge Cases & Error States

**Component / overlay (Lightbox-R1–R15):**

| Case | Expected behavior |
| ---- | ----------------- |
| `src`/`alt` only (no `items`) | One-item `resolved`; single-media viewer, no carousel (R2/R14). |
| `thumbSrc` set | Strip thumb uses it; viewer keeps full `src`; viewer image gets a blur-up placeholder from `thumbSrc` (R3/R15). |
| Neither `items` nor `src` | Empty strip, no buttons; DEV warns (R8). |
| `caption` set | `<figcaption class="hz-lightbox-caption">` under the media; absent otherwise (R14). |
| `trigger` absent | Default thumb / label / video-badge face (R3). |
| `trigger` provided (multi-item) | Each button renders `trigger(item, i)`; button + `aria-label` + `openAt(i)` unchanged (R5). |
| `trigger` **and** `children` | `children` wins; `trigger` never invoked; DEV warns (R6). |
| `trigger` face has non-empty `alt` | Button named by `aria-label` (label wins); redundant announcement — `alt=""` recommended (R7). |
| `trigger` on a video item | Face fully replaces the default; no `.hz-lightbox-badge`; viewer plays the video (R5). |
| Click media inside the dialog | Does **not** close (only the backdrop / Escape / close button do) (R12). |
| Escape / backdrop / close button | Closes; `onclose` fires once; scroll restored; focus returns to the opener (R11–R13). |
| Image item load pending | Image shows its loading state (and blur-up if `thumbSrc`); no crop; `loading="eager"` (R15). |
| Image item fails to load | Image shows its error state (`data-state="error"`) rather than a broken raw `<img>` (R15). |
| Narrow / wide viewport | Image box caps at `min(92vw,100%)` × `80dvh`, `object-fit: contain`, centered, never crops; Image wrapper must resolve a definite size in the shrink-wrapped dialog (R15). |
| Video item | Renders `.hz-lightbox-video` > `Video`; no `.hz-lightbox-img` wrapper (R14/R15). |

**Attachment (Lightbox-R16–R29):**

| Case | Expected behavior |
| ---- | ----------------- |
| No qualifying media | Listeners attach; every click resolves nothing → no overlay (R18/R22). |
| Non-media click (figcaption, text) | `closest()` resolves nothing → no-op (R22). |
| `data-lightbox-ignore` | Not enhanced, excluded from the set, click does nothing (R18). |
| `<img>` in `<a>` / `<button>` | Not enhanced, excluded; the link/button keeps its behavior (R18). |
| `aria-hidden` media (or ancestor) | Never enhanced, never in the set — e.g. Image's blur placeholder stays inert; the viewer contains one item (R18). |
| `hidden` / `display:none` media | Enhanced (attrs present) but excluded from the activation-time set; joins the group once revealed, no re-run needed (R18/R21). |
| Prior `tabindex`/`role`/`aria-label` | Managed while attached; **originals restored** on cleanup (R19/R25). |
| `srcset` image, no override | Viewer `src` = `currentSrc || src` (R20). |
| `data-lightbox-src` present | That URL is the viewer `src` (R20). |
| Video, no name sources | `label` = `'Video'`; `src` from `currentSrc`/`src`/`<source>`; `poster` when set (R20). |
| Media added after attach | In the lazily-scanned set (open from any trigger) and directly pointer-clickable; keyboard enhancement only on re-run (R21/R26). |
| Activate 2nd of 3 | Overlay opens with the 2nd slide active (start index 1) (R21/R24). |
| Single qualifying element | Single-media viewer, no `Carousel` (R24/R14). |
| Enter / Space on a trigger | Opens; Space is `preventDefault`ed (R23). |
| Nested groups | Inner activation `stopPropagation`s → only the innermost opens (R22). |
| Overlay already open | Second activation ignored (single-instance guard) (R24). |
| Torn down mid-open | Listeners off, attrs restored, overlay unmounted + scroll restored; no focus move, no `onclose` (R25/R26). |
| SSR / pre-hydration click | No listeners yet → nothing happens; media stays visible (R17). |

### Existing Code to Reuse

- **Viewer:** the internal `src/lib/components/LightboxOverlay.svelte` — the one
  shared viewer for both `Lightbox` and the attachment; never build a second
  (Lightbox-R28). It reuses `Carousel`, `Video`, and `IconX` as today, and now
  `Image` for image items (Lightbox-R15).
- **Image:** the exported `Image` (`fit`, `loading`, `placeholder`/`placeholderSrc`,
  `data-state`, `.hz-image__img`, `role="presentation"` on empty alt,
  `...rest` → inner img) — for the overlay's image rendering (Lightbox-R15) and the
  docs' trigger-face / attachment-over-Image demos (Lightbox-R30).
- **Per-item snippet idiom:** `Carousel.svelte`'s `slide: Snippet<[T, number]>` —
  mirror the shape for `trigger` (Lightbox-R5).
- **Mount API:** `mount` / `unmount` from `'svelte'` for imperative overlay
  render/teardown into `document.body` (Lightbox-R24/R25).
- **Types:** `LightboxItem` / `LightboxImageItem` / `LightboxVideoItem` /
  `LightboxGroupOptions` in `src/lib/types/index.ts` — no new types.
- **Dev-warning idiom:** `import.meta.env.DEV` + `untrack` per `Lightbox.svelte`'s
  existing warnings.
- **Root export:** `src/lib/index.ts` (beside `toFormErrors`); extend the `$lib`
  block in `src/lib/exports.spec.ts` (Lightbox-R16).
- **Theme:** amend `src/lib/theme/lightbox.css` (already imported by `theme.css`)
  for the `[data-lightbox-trigger]` cursor (Lightbox-R27) and the
  `.hz-lightbox-img` hook migration (Lightbox-R15) — no new sheet.
- **Pairing callout (docs):** the `Alert` component, used as the Combobox page uses
  `<Alert intent="info" …>` above its `Tabs` (Lightbox-R30/R31).
- **Docs scaffolds:** `DocPage`, `Example`, `Tabs`, `demoSvg`, `tab-note`,
  `demoTabs` in the media docs pages; the `<section>`/`<h2 id>` markup on
  `src/routes/+page.svelte` (Lightbox-R30–R32).
- **Test harness:** Vitest browser project (chromium, **Playwright** provider) with
  `vitest-browser-svelte`; `createRawSnippet` / `mount` / `unmount` from `'svelte'`
  for test faces, exactly as the existing specs use.

### Test Plan

Runner: **Vitest** — browser project (chromium, **Playwright** provider,
`vitest-browser-svelte`) for component/overlay/attachment behavior; the `server`
(node) project for the SSR no-op. `expect.requireAssertions` is on. The Builder
updates all `LightboxGroup-Rn` / `LightboxTrigger-Rn` citations in test
descriptions to `Lightbox-Rn`.

**`src/lib/components/Lightbox.svelte.spec.ts` (component + overlay) `[BUILT]` +
`[NEW]` edits:**
- Trigger strip, ARIA, default face, `thumbSrc`, `children`, class/rest forwarding
  (R1/R3/R4/R9); dialog labelling, caption, open/close/backdrop/Escape/close-
  button + `onclose`-once + focus-return (R10–R14); multi-item carousel, start
  index, next/loop, Arrow paging, video slide, focus return (R1/R12–R14); the
  `trigger snippet` block — receives `(item, i)`, preserves button ARIA, opens at
  index, single-image sugar, `children` precedence + DEV warn, video face replaces
  badge, Image-composed face wrapper inside the button (R5/R6/R7).
- **`[NEW]` (sanctioned):** revise every assertion that read `.hz-lightbox-img` as
  an `<img>` (`src`/`alt`) to read `.hz-lightbox-img .hz-image__img` (or
  `.hz-image__img`); add coverage that an image item renders `<Image>` with
  `data-fit="contain"`, eager loading, and a blur placeholder **only** when the
  item has a `thumbSrc` (assert `data-placeholder="blur"` present with `thumbSrc`,
  absent without) (R15).

**`src/lib/attachments/lightboxGroup.svelte.spec.ts` (attachment, browser)
`[BUILT]` + `[NEW]` edits:** enhancement (R19), exclusions incl. `aria-hidden`
and hidden/`display:none` split and `<picture>` (R18), pointer open + document
order + start index (R21/R22), keyboard open + Space prevented (R23), item
derivation incl. `currentSrc`/`data-lightbox-src`/figcaption/video-label
precedence and the no-leak aria-label case (R20), lazy scan / dynamic children /
re-run (R21/R26), close & focus return (R12/R13/R24), nested groups (R22),
single-instance guard (R24), cleanup (R25), `options.selector`, label options.
**`[NEW]` (sanctioned):** revise the item-derivation assertions that read
`dialog.querySelector('.hz-lightbox-img').src` to target
`.hz-lightbox-img .hz-image__img` (R15/R20).

**`src/lib/attachments/lightboxGroup.spec.ts` (server/node) `[BUILT]`:** the SSR
no-op — invoking the attachment with no `document` performs no work and returns an
inert cleanup (R17).

**`src/lib/exports.spec.ts` `[BUILT]`:** `lightboxGroup` resolves from `$lib` and
is a function (R16).

**Docs `[BUILT]`:** Reviewer verifies by inspection — the verbatim "Image renders
media, Lightbox provides viewing." on both component pages, the four Lightbox
tabs and both escape hatches, and the introduction philosophy note (R30–R32). No
Playwright e2e for docs.

### Out of Scope

- **A `lightbox` prop on `Image`** and **internal `Image` rendering in the
  Lightbox strip** — the layering is settled (viewer-internal Image use is
  Lightbox-R15 only).
- **A `<LightboxGroup>` wrapper component** — deferred; a thin convenience over
  the same core.
- **`MutationObserver` reactivity** — dynamically-added media are pointer-open and
  lazily scanned but not auto-enhanced for keyboard until re-run; markup-owners
  use `Lightbox`.
- **Zoom / pan / pinch** inside the viewer.
- **`srcset` candidate selection beyond `currentSrc`** + the `data-lightbox-src`
  override — no bespoke resolution picker.
- **Nested-group / overlapping-selector dedup** — only innermost-wins via
  `stopPropagation`.
- **Per-item overrides beyond attributes** — captions/labels/src from
  `alt` / `<figcaption>` / `aria-label` / `title` / `data-lightbox-src` only.
- **Runtime enforcement of the "no interactive content in a `trigger` face"
  constraint** — documented forbid only; a detector is deferred.
- **`onopen` / `onclose` / `filter` attachment callbacks** and options beyond
  `LightboxGroupOptions`.
- **New barrel exports, shared types, or component CSS for the `trigger` snippet** —
  none needed.
- **New `manifest.ts` entries** — all three docs pages already exist.
- **Playwright e2e** for the docs demos — the browser unit suites cover behavior.
```
