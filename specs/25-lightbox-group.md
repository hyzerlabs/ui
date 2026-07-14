# Lightbox Group Attachment Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`LightboxGroup-Rn`) and edge case as pass/fail. Write scope for
> the Builder is the library source (`src/lib/**`) plus the existing Lightbox
> docs page (`src/routes/media/lightbox/+page.svelte`).
>
> Created 2026-07-14. This ships a **Svelte 5 attachment** — `lightboxGroup()` —
> that turns any container's media descendants into a shared lightbox, plus the
> internal refactor that lets it reuse the existing viewer. Key decisions are
> recorded inline (Context) with dated rationale; they are decisions, not open
> questions. **The existing `Lightbox` component is the PREFERRED, accessible
> route** and its public API and behavior do **not** change; this attachment is
> a **DX enhancement** for progressively enhancing existing page media, and the
> docs position it as such.

### Goal

Ship one exported factory, `lightboxGroup(options?)`, that returns a Svelte 5
**attachment**. Applied to a containing element (`{@attach lightboxGroup()}`, or
called imperatively), it makes every qualifying media descendant (`img`,
`picture > img`, `video`) operable, and clicking or keyboard-activating any one
of them opens **all** of the container's qualifying media in a single, shared,
focus-trapped lightbox overlay at the activated item's index. **No thumbnail
strip / trigger gallery is rendered** — the page's own media is the trigger
surface. The overlay is the exact same accessible viewer the `Lightbox`
component already ships, extracted into a shared internal so both use one
implementation.

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. The attachment is a plain module
  (no component), one file: `src/lib/attachments/lightboxGroup.ts` — a new
  `src/lib/attachments/` folder establishes where library attachments live
  (mirrors the `Virtualizer`'s in-component `measureRow` attachment idiom,
  `specs/23-virtualizer.md`, but hoisted to a reusable module). Exported from
  the **package root** (`src/lib/index.ts`, the `.` entry) alongside the
  `toFormErrors` helper — the first non-component runtime export from `$lib`
  besides that helper. No new package.json subpath key.
- **Attachment, not a component (decision 2026-07-14).** The user-chosen shape
  is the `{@attach}` idiom, not a `<LightboxGroup>` wrapper. `lightboxGroup` is
  a **factory**: `lightboxGroup(options?) => (node) => cleanup`, so it composes
  as `{@attach lightboxGroup(opts)}` and can also be invoked directly on a DOM
  node (which is how the tests drive it). A `LightboxGroup` wrapper component is
  **Out of Scope v1** (deferred: a thin convenience over the same core; add on
  demand).
- **Shared overlay via extraction (decision 2026-07-14).** An attachment cannot
  declaratively render a component, so it `mount()`/`unmount()`s the overlay
  imperatively (from `'svelte'`). To avoid duplicating the viewer, the overlay
  portion of `Lightbox.svelte` is extracted into a **non-exported internal**
  `src/lib/components/LightboxOverlay.svelte` (the same pattern as the internal
  `Field.svelte` scaffold — used by peers, never in the barrel). Both the
  existing `Lightbox` component **and** the attachment render it. The existing
  `Lightbox` public API, markup contract, and behavior are **unchanged**: its
  entire current test suite (`src/lib/components/Lightbox.svelte.spec.ts`) must
  stay green **without edits** (LightboxGroup-R1).
- **Lazy scan, no MutationObserver (decision 2026-07-14).** The set of media
  that opens is scanned from the container **at activation time**, so
  dynamically-added children are picked up without a `MutationObserver`.
  Pointer activation is fully delegated (a single container listener resolves
  the activated element via `closest()`), so it works for any descendant added
  at any time. **Keyboard operability** (the `tabindex`/`role`/name
  enhancement) is applied to the descendants present **at attach / re-run
  time**; elements added later are pointer-operable and are included in the
  overlay set, but do not gain the keyboard affordance until the attachment
  re-runs. Full reactive enhancement (MutationObserver) is **Out of Scope** —
  the docs steer any consumer needing guaranteed a11y on dynamic media to the
  real `Lightbox` component.
- **Deliberate a11y deviation (decision 2026-07-14).** The library's rule is
  that click targets are real `<button>`/`<a>` elements (e.g. the `Lightbox`
  thumbnail is a real button). This attachment instead makes plain media
  elements operable via `tabindex="0"` + `role="button"` + an accessible name +
  Enter/Space activation. This is a **conscious deviation**, justified because
  the whole point is to enhance *existing* page media in place without
  restructuring markup; the **mitigation** is complete keyboard support and a
  correct accessible name, and the docs explicitly present the `Lightbox`
  component as the preferred accessible route (LightboxGroup-R14, R15).
- **Client-only / SSR no-op.** Svelte attachments run in a post-mount effect —
  they never execute server-side. No enhancement or listeners exist before
  hydration, so **pre-hydration clicks do nothing** (progressive enhancement;
  the underlying media is still visible and, if wrapped in a link by the
  consumer, still navigates). Documented, not worked around.
- **Ships no CSS (decision 2026-07-14).** An attachment cannot ship scoped
  styles. The `data-lightbox-trigger` styling hook's cursor affordance is added
  to the **reference theme** in `src/lib/theme/lightbox.css`
  (`[data-lightbox-trigger] { cursor: zoom-in }`, mirroring the component's
  existing `.hz-lightbox-trigger { cursor: zoom-in }`). Custom themes supply
  their own; the attachment guarantees only the stable `data-lightbox-trigger`
  hook (LightboxGroup-R13).
- Mirror existing plumbing: `bind:this` + `$effect` listener add/remove with
  cleanup as `Nav.svelte` does; `import.meta.env.DEV` dev warnings per
  `Card.svelte`/`Button.svelte`; `mount`/`unmount` from `'svelte'`.

### Extraction: what moves to `LightboxOverlay.svelte`

`LightboxOverlay.svelte` is a **non-exported** internal (not added to
`src/lib/components/index.ts`). The extraction is **behavior-preserving** — it
lifts the viewer verbatim; only focus-return is parameterized.

**Moves out of `Lightbox.svelte` into `LightboxOverlay.svelte`:**

- The `{#snippet media(item)}` block (figure + `<img class="hz-lightbox-img">`
  or `<div class="hz-lightbox-video"><Video/></div>` + optional `<figcaption>`).
- The entire `<dialog class="hz-lightbox" aria-modal aria-label data-state …>`
  element: the close button (`.hz-lightbox-close` + `IconX`), the
  `Carousel`-vs-single-media branch, `oncancel`/`onclick`/`onkeydown` wiring.
- The `showModal()`/`close()` reconciliation `$effect` (scroll lock via
  `document.body.style.overflow`, focus return, `onclose` fired once) and the
  `$effect` cleanup that restores scroll on teardown.
- `handleCancel` (Escape → `open = false`), `handleDialogClick` (backdrop
  close), `handleDialogKeydown` (ArrowLeft/ArrowRight paging).
- `nameOf(item)`, the `dialogName` derivation, `index` (the active viewer
  item), `dialogEl`, the per-instance scroll-lock state.
- The overlay `<style>` block: `.hz-lightbox`, `.hz-lightbox:not([open])`,
  `.hz-lightbox-figure`, `.hz-lightbox-img`, `.hz-lightbox-video`,
  `.hz-lightbox-close`.

**Stays in `Lightbox.svelte` (unchanged public behavior):**

- All public `Props` and their defaults, the single-image sugar → `resolved`
  normalization, the dev warning, `thumbOf`, `openAt`, `triggerEls`.
- The trigger strip: the custom-trigger `<button>` and the
  `.hz-lightbox-triggers` strip of `.hz-lightbox-trigger` buttons + thumbnails +
  video badge, and their `<style>` (`.hz-lightbox-triggers`,
  `.hz-lightbox-trigger`, `.hz-lightbox-thumb`, `.hz-lightbox-badge`).
- `Lightbox` now renders `<LightboxOverlay …/>` in place of the inline
  `<dialog>`, forwarding `items={resolved}`, `bind:open`, the labels, `onclose`,
  a `startIndex`, and the **return-focus target** it captured at open time.

**Focus-return parameterization (the only new seam).** The overlay owns close,
scroll-restore, and focus-return, but does not own the trigger elements. It
takes a `returnFocusTo` prop (an `HTMLElement | null`). On the open→closed
transition it focuses `returnFocusTo` (falling back to the element that was the
document's `activeElement` when the overlay opened) before firing `onclose` —
reproducing `Lightbox`'s current "focus returns to the trigger that opened the
viewer" behavior. `Lightbox` captures the opening trigger button
(`triggerEls[i]` at `openAt(i)` time) and passes it as `returnFocusTo`; the
attachment passes the activated media element. Because the target is captured at
open time, paging the carousel before closing still returns focus to the
element that opened the viewer (preserving the existing
`openedFrom`-capture semantics).

### Shared Type

In `src/lib/types/index.ts`, add and export:

```ts
/** Options for the `lightboxGroup` attachment. All optional. */
export interface LightboxGroupOptions {
	/**
	 * CSS selector narrowing which descendants qualify. Matched elements are
	 * still filtered to img / picture>img / video and the exclusion rules
	 * (LightboxGroup-R4). Default: every qualifying media descendant.
	 */
	selector?: string;
	/** Accessible name of the viewer dialog in multi-item mode. */
	dialogLabel?: string;
	closeLabel?: string;
	prevLabel?: string;
	nextLabel?: string;
}
```

The attachment reuses the existing `LightboxItem` / `LightboxImageItem` /
`LightboxVideoItem` types (`src/lib/types/index.ts`) for the derived item set —
no new item shape. `LightboxOverlay.svelte` imports `LightboxItem`; the
attachment builds `LightboxItem[]` from the DOM (LightboxGroup-R6).

### API

```ts
import { lightboxGroup } from '@hyzer-labs/ui';

// Declarative (preferred):
// <div {@attach lightboxGroup()}> …page media… </div>
// <ul {@attach lightboxGroup({ selector: '.gallery img' })}> … </ul>

// Imperative (and how tests drive it):
const cleanup = lightboxGroup(options)(containerElement); // → () => void
```

`lightboxGroup(options?)` returns an **attachment**: `(node: Element) => () =>
void`. Defaults for the four label options match the `Lightbox` component
(`'Media viewer'`, `'Close media viewer'`, `'Previous item'`, `'Next item'`).

### Requirements

Boolean `data-*` "present" = empty-valued attribute exists; "absent" = not
rendered.

1. **LightboxGroup-R1 — Zero change to `Lightbox`.** The `Lightbox` component's
   public props, defaults, rendered class/`data-*`/ARIA contract, and every
   open/close/paging/focus behavior are unchanged after the overlay extraction.
   `src/lib/components/Lightbox.svelte.spec.ts` passes **unedited**. The
   extracted `LightboxOverlay.svelte` is **not** added to the barrel and is not
   importable from `$lib`.
2. **LightboxGroup-R2 — Factory & attachment shape.** `lightboxGroup(options?)`
   returns a function `(node) => cleanup`. Invoked with an `Element` it performs
   the enhancement pass (LightboxGroup-R5) and attaches delegated `click` and
   `keydown` listeners to that node; it returns a cleanup function
   (LightboxGroup-R11). Exported from `src/lib/index.ts`; `import { lightboxGroup
   } from '$lib'` resolves to a function; asserted in `exports.spec.ts`
   (LightboxGroup-R16).
3. **LightboxGroup-R3 — Client-only / SSR no-op.** The attachment runs only on
   the client (Svelte attachment semantics). It performs no work and attaches no
   listeners server-side; before hydration, media is inert (LightboxGroup steers
   are documented). No `window`/`document` access executes during SSR.
4. **LightboxGroup-R4 — Qualifying elements & exclusions.** A descendant
   qualifies when it is an `<img>` (including the `<img>` inside a `<picture>`)
   or a `<video>`, **and**, when `options.selector` is set, it also matches that
   selector. Excluded (neither enhanced nor included in the item set):
   - any element (or an ancestor within the container) carrying
     `data-lightbox-ignore`;
   - any media that is `aria-hidden="true"` **or has an `aria-hidden="true"`
     ancestor within the container** (amended 2026-07-14): decorative media
     never belongs in a lightbox, and enhancing it would put `tabindex`/`role`
     on an element removed from the accessibility tree. Concrete motivator:
     `Image`'s blur placeholder renders a decorative `aria-hidden` `<img>`
     alongside the real one — without this rule, composing `lightboxGroup`
     over `Image` components enhances the placeholder and duplicates it into
     the viewer. This is a **structural** exclusion (never enhanced, never in
     the item set), unlike the rendered check below;
   - any media whose nearest interactive ancestor within the container is an
     `<a>` or `<button>` (that element already owns the interaction — including
     it as a trigger or overlay item would surprise; the interactive ancestor
     wins);
   - **from the activation-time item set only** (amended 2026-07-14): any
     element that is not rendered (has the `hidden` attribute or zero client
     rects, e.g. `display:none`) never joins the viewer — but it **is** still
     enhanced (LightboxGroup-R5). Rationale: enhancement runs once at
     attach/re-run, and media commonly mounts inside a hidden region (an
     inactive `Tabs` panel, a closed `Accordion`); gating enhancement on
     rendered-ness left such media permanently un-enhanced (no cursor hook, no
     tabindex) even after being revealed. Enhanced attributes on hidden
     elements are inert (hidden elements are unfocusable and unclickable), and
     activation re-validates against the rendered set, so a hidden element can
     never open the viewer.

   The `<picture>` wrapper itself is never a trigger — only its inner `<img>`.
5. **LightboxGroup-R5 — Enhancement pass (make media operable).** On attach
   (and on every re-run, LightboxGroup-R12), for each **structurally
   qualifying** descendant — rendered or not (LightboxGroup-R4, amended
   2026-07-14) — the attachment sets, **recording any prior value first so
   cleanup can restore it** (LightboxGroup-R11):
   - `tabindex="0"`,
   - `role="button"`,
   - `aria-label` = `` `View larger: ${name}` `` where `name` is the image
     `alt` or the video accessible name (LightboxGroup-R6); when that name is
     empty, `aria-label="View larger"` (no dangling colon),
   - `data-lightbox-trigger` (present; styling hook only).

   Re-applying the same managed values is idempotent (LightboxGroup-R12). An
   element that already had an explicit `tabindex`/`role`/`aria-label` has its
   original restored on cleanup, not clobbered permanently.
6. **LightboxGroup-R6 — Item derivation.** At activation the container is
   scanned (LightboxGroup-R7) and each qualifying element maps to a
   `LightboxItem` in **document order**:
   - **img / picture>img** → `{ type: 'image', src, alt, caption? }` where
     `src` = the `data-lightbox-src` attribute if present (a full-res override),
     else `img.currentSrc || img.src` (**decision 2026-07-14:** default to the
     browser-chosen `currentSrc` so `srcset` images use the resolution the
     browser actually resolved, avoiding candidate-guessing; `data-lightbox-src`
     is the documented escape hatch for a dedicated full-size asset). `alt` =
     `img.alt` (may be `''`). `caption` = the text of a `<figcaption>` when the
     image is inside a `<figure>` that has one, else omitted.
   - **video** → `{ type: 'video', src, label, poster?, caption? }` where `src`
     = `data-lightbox-src` if present, else `video.currentSrc || video.src`,
     else the first nested `<source src>`; `poster` = `video.poster` when set;
     `label` (the required video accessible name) is derived, in precedence
     order, from `aria-label`, then `title`, then the enclosing `<figcaption>`,
     then the fallback `'Video'`; `caption` from `<figcaption>` as with images.
7. **LightboxGroup-R7 — Lazy scan & start index.** On activation the attachment
   re-queries the container for the full ordered qualifying set (so
   dynamically-added media are included without a `MutationObserver`), derives
   the `LightboxItem[]` (LightboxGroup-R6), and computes the **start index** =
   the activated element's position in that ordered set. The activated element
   is resolved from the event target via `closest()` against the qualifying
   selector, re-checked against the exclusion rules (LightboxGroup-R4).
8. **LightboxGroup-R8 — Pointer activation.** A delegated `click` listener on
   the container: if `event.target.closest(...)` resolves a qualifying,
   non-excluded element, the attachment `preventDefault`s and
   `stopPropagation`s the event (so an outer nested group does not also open —
   innermost wins), scans (LightboxGroup-R7), and opens the overlay
   (LightboxGroup-R10) at the start index with `returnFocusTo` = the activated
   element. Pointer activation works for **any** qualifying descendant, whether
   or not it received the enhancement pass (covers dynamically-added media).
9. **LightboxGroup-R9 — Keyboard activation.** A delegated `keydown` listener on
   the container: when the event target is a qualifying, non-excluded element
   (i.e. an enhanced trigger with focus) and the key is `Enter` or `Space`
   (`' '`), the attachment `preventDefault`s (so Space does not page-scroll) and
   opens the overlay identically to LightboxGroup-R8, with `returnFocusTo` = the
   focused element. This delivers 2.1.1 keyboard operability for the deviation
   (LightboxGroup-R15).
10. **LightboxGroup-R10 — Open via mounted overlay.** Opening `mount()`s
    `LightboxOverlay` into `document.body` (from `'svelte'`) with `items` = the
    derived set, `startIndex` = the activated index, `open: true`, the four
    label options, `returnFocusTo` = the activated element, and an `onclose`
    that `unmount()`s the instance and clears the attachment's reference. The
    overlay's own `$effect` runs `showModal()` (native focus trap, top layer),
    locks body scroll, and — on any dismissal path (Escape/`cancel`, backdrop
    click, close button, ArrowLeft/ArrowRight still page the viewer) — restores
    scroll, focuses `returnFocusTo`, then fires `onclose`. **One overlay
    instance per open**, unmounted on close (no persistent hidden dialog — the
    attachment has no strip to keep in sync). If an overlay is already mounted
    (guard the reference), a new activation is ignored until it closes.
11. **LightboxGroup-R11 — Cleanup.** The returned cleanup function: removes the
    `click` and `keydown` listeners; restores every enhanced element's prior
    attribute state (`tabindex`/`role`/`aria-label` restored to their recorded
    values or removed if they did not exist; `data-lightbox-trigger` removed);
    and if an overlay is currently mounted, `unmount()`s it (the overlay's
    `$effect` teardown restores body scroll on unmount — focus is **not** moved
    and `onclose` does **not** fire on a forced teardown, matching the
    component's/Modal's existing teardown semantics). After cleanup the
    container behaves as un-enhanced (a subsequent click opens nothing).
12. **LightboxGroup-R12 — Idempotent re-run.** Because `{@attach
    lightboxGroup(opts)}` re-invokes when `opts` changes identity, re-running
    must be safe: Svelte tears down the prior attachment (LightboxGroup-R11
    cleanup) then invokes the new one. Applying the enhancement twice with no
    intervening cleanup sets the same managed values (no duplication, no drift).
    A re-run re-scans and re-enhances the current descendants, picking up media
    added since the last run.
13. **LightboxGroup-R13 — Styling hook, no shipped CSS.** The attachment ships
    no CSS. Every enhanced element carries `data-lightbox-trigger` as the stable
    styling hook. The reference theme gains, in `src/lib/theme/lightbox.css`
    (inside `@layer hz-theme`), a `[data-lightbox-trigger] { cursor: zoom-in }`
    rule (parity with the component's `.hz-lightbox-trigger` cursor); no other
    visual opinion is added.
14. **LightboxGroup-R14 — Overlay reuse.** The opened viewer is the exact
    `LightboxOverlay` used by `Lightbox` — identical dialog markup, `Carousel`
    paging for multi-item sets, single-media rendering for one item, captions,
    the close control, and all keyboard/backdrop/Escape behavior. No
    attachment-specific viewer variant exists.
15. **LightboxGroup-R15 — Deviation recorded in-code & docs.** A source comment
    in `lightboxGroup.ts` records the deliberate `role="button"`-on-media
    deviation and its keyboard mitigation. The docs tab (LightboxGroup-R17)
    explicitly names the `Lightbox` component as the preferred accessible route.
16. **LightboxGroup-R16 — Root export & test.** `lightboxGroup` is exported from
    `src/lib/index.ts`; the `$lib (.)` assertion block in
    `src/lib/exports.spec.ts` gains `expect(mod.lightboxGroup).toBeDefined()`
    and asserts it is a function. `LightboxGroupOptions` is exported from
    `src/lib/types/index.ts`.
17. **LightboxGroup-R17 — Docs tab.** The existing Lightbox docs page
    `src/routes/media/lightbox/+page.svelte` gains a **third** demo tab, placed
    **after** the existing `{ id: 'basic', label: 'Single image' }` and `{ id:
    'gallery', label: 'Gallery & video' }` tabs: `{ id: 'attachment', label:
    'Group attachment' }`. Its panel renders a live container with several
    demo images wired via `{@attach lightboxGroup()}` (matching the page's
    `Example`/`tab-note` conventions and the `demoSvg` inline-SVG asset
    pattern), shows the import (`import { lightboxGroup } from
    '@hyzer-labs/ui'`), and carries a note that steers readers to the
    `Lightbox` component as the preferred accessible route (with a one-line
    "reach for the attachment to enhance existing page media in place; reach for
    `Lightbox` when you control the markup and want the strongest a11y
    guarantees"). The demo **surfaces both escape hatches live** (amended
    2026-07-14): one visibly-marked element carries `data-lightbox-ignore`
    (demonstrably skipped — no zoom cursor, absent from the shared viewer) and
    one image carries `data-lightbox-src` (its rendered `src` is the
    scaled-down version; the viewer opens the full-resolution override), with
    both attributes shown in the code sample and named in the tab note. No
    `manifest.ts` change (the page already exists).

### Responsive Behavior

- The attachment adds **no layout** of its own — it enhances existing media in
  the consumer's own flow, so the page's responsive behavior is untouched at
  mobile (<640px), tablet (640–1024px), and desktop (>1024px). Triggers reflow
  exactly as the media already does.
- The opened overlay is the shared `LightboxOverlay`, whose dialog sizes to its
  media (`max-width: min(92vw, 100%)`, `max-height: 80dvh` for images; the
  video box at `min(92vw, 64rem)`) at every breakpoint — no breakpoint-specific
  interaction change (same as the `Lightbox` component today). On narrow
  viewports the image/video scales down within the same centered dialog.
- Touch: enhanced media are pointer targets at their existing rendered size; the
  attachment ships no hit-area sizing (a theme/consumer concern).

### Accessibility (WCAG 2.1 AA)

- **Deliberate deviation (recorded):** enhanced media are not real buttons; they
  receive `tabindex="0"` + `role="button"` + an accessible name, and full
  Enter/Space activation (2.1.1), so screen-reader and keyboard users can reach
  and operate every trigger. This is a conscious trade to enhance existing
  markup in place; the docs present the real-`<button>` `Lightbox` component as
  the preferred route (LightboxGroup-R15/R17).
- **Accessible name (1.1.1 / 4.1.2):** every trigger is named `View larger:
  {alt|videoLabel}` (or `View larger` when the source name is empty), so the
  purpose is announced rather than an unlabeled generic button.
- **Overlay (inherited, unchanged):** the viewer is a native `<dialog>` opened
  with `showModal()` — focus is trapped in the top layer, `aria-modal="true"`,
  Escape always closes, the backdrop closes, body scroll is locked, and **focus
  returns to the activated trigger** on close (2.4.3 / 2.1.2). Multi-item sets
  use the `Carousel` (labelled slides, live announcements); ArrowLeft/ArrowRight
  page from anywhere in the dialog.
- **Motion:** no animation is introduced by the attachment; the overlay's motion
  is the component's existing (theme-owned, reduced-motion-respecting)
  treatment. `data-lightbox-trigger`'s only affordance is a cursor (no motion).
- **Color:** the attachment conveys nothing by color; the `zoom-in` cursor is a
  supplementary affordance, and every trigger has a text accessible name.
- **Progressive enhancement:** before hydration nothing is operable, and the
  underlying media remains visible; consumers who need the media clickable
  without JS keep it inside their own `<a>` (which this attachment then leaves
  alone, LightboxGroup-R4).

### Edge Cases & Error States

| Case                                                        | Expected behavior                                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Container with no qualifying media                          | Enhancement pass finds nothing; listeners attach but every click resolves no target → no overlay (R4/R8).    |
| Click a non-media child (whitespace, text, a `<figcaption>`)| `closest()` resolves no qualifying element → no-op (R8).                                                      |
| Element carries `data-lightbox-ignore`                      | Not enhanced, excluded from the item set, click does nothing on it (R4).                                     |
| `<img>` inside an `<a>` / `<button>`                        | Not enhanced, excluded from the set; the link/button keeps its own behavior (R4).                            |
| `aria-hidden="true"` media (or inside an `aria-hidden` wrapper) | Not enhanced, never in the item set — decorative media (e.g. `Image`'s blur-placeholder img) stays inert (R4). |
| `<img>` already has `tabindex`/`role`/`aria-label`          | Managed values applied while attached; **original restored** on cleanup (R5/R11).                            |
| `srcset` image, no `data-lightbox-src`                      | Overlay `src` = `currentSrc || src` (the browser-chosen candidate) (R6).                                     |
| `data-lightbox-src` present                                 | That URL is the overlay `src`, overriding `currentSrc`/`src` (R6).                                            |
| Image inside `<figure>` with `<figcaption>`                 | The figcaption text becomes the item `caption` (R6).                                                         |
| `<video>` with no `aria-label`/`title`/figcaption           | `label` falls back to `'Video'`; `src` from `currentSrc`/`src`/`<source>`, `poster` when set (R6).           |
| Empty `alt`                                                 | Trigger named `View larger` (no dangling colon); item `alt` is `''` (R5/R6).                                 |
| Media added to the container **after** attach               | Included in the overlay set via the lazy scan (open it from any trigger) and pointer-clickable directly; gains keyboard enhancement only on re-run (R7/R12; documented limitation). |
| Activate the 2nd of 3 media                                 | Overlay opens with the 2nd slide active (start index 1) (R7/R10).                                            |
| Single qualifying element                                   | Overlay renders single-media (no `Carousel`), just like the `Lightbox` single-image path (R14).             |
| Enter / Space on a focused trigger                          | Opens the overlay; Space is `preventDefault`ed (no page scroll) (R9).                                        |
| Escape / backdrop / close button                            | Overlay closes, unmounts, body scroll restored, focus returns to the activated trigger (R10).               |
| Nested groups (container within a grouped container)        | Inner activation `stopPropagation`s → only the innermost group opens; overlapping-selector dedup is Out of Scope (R8). |
| Overlay already open, another trigger activated             | Ignored until the open overlay closes (single-instance guard) (R10).                                          |
| Attachment torn down (component destroy / options change)   | Listeners removed, enhancement attributes restored, any open overlay unmounted + scroll restored (R11/R12). |
| SSR / pre-hydration click                                   | No listeners exist yet → nothing happens; media stays visible (R3).                                          |

### Existing Code to Reuse

- **Overlay:** the extracted `src/lib/components/LightboxOverlay.svelte` — do
  not build a second viewer; both `Lightbox` and the attachment mount the same
  internal (LightboxGroup-R14). It internally reuses `Carousel`, `Video`, and
  `IconX` exactly as `Lightbox` does today.
- **Mount API:** `mount` / `unmount` from `'svelte'` for imperative
  render/teardown into `document.body` (LightboxGroup-R10/R11).
- **Types:** `LightboxItem` / `LightboxImageItem` / `LightboxVideoItem` in
  `src/lib/types/index.ts` for the derived set; add `LightboxGroupOptions`
  there (LightboxGroup-R6/Shared Type).
- **Listener plumbing pattern:** the `bind:this` + `$effect` add/remove-listener
  + cleanup idiom from `Nav.svelte`; the `measureRow` attachment
  `(node) => () => void` shape from `Virtualizer.svelte`
  (`specs/23-virtualizer.md`).
- **Dev-warning idiom:** `import.meta.env.DEV` guard per `Button.svelte` /
  `Card.svelte`, if any dev warning is warranted.
- **Root export:** `src/lib/index.ts` (alongside `toFormErrors`) — the `.`
  entry; extend the `$lib` block in `src/lib/exports.spec.ts`
  (LightboxGroup-R16).
- **Theme:** amend `src/lib/theme/lightbox.css` (already imported by
  `theme.css`) with the `[data-lightbox-trigger]` cursor rule
  (LightboxGroup-R13) — do not add a new sheet.
- **Docs scaffold:** the existing `src/routes/media/lightbox/+page.svelte`
  (`DocPage`, `Example`, `Tabs`, `demoSvg`, `tab-note`) — add the third tab
  in-place (LightboxGroup-R17).
- **Test harness:** mirror `Lightbox.svelte.spec.ts` / `Nav.svelte.spec.ts` —
  Vitest browser mode (`vitest-browser-svelte`, `vitest/browser` `userEvent`).

### Test Plan

Runner: **Vitest** browser project (chromium, **Playwright** provider) with
`vitest-browser-svelte`. One new spec file
`src/lib/attachments/lightboxGroup.svelte.spec.ts` (the `.svelte.spec.ts`
suffix routes it to the browser `client` project per `vite.config.ts`, so
`mount`/effects run in a real browser). `expect.requireAssertions` is on — every
test asserts. **The attachment is a plain `(node) => cleanup` function, so tests
drive it directly**: build a container (set `innerHTML`, append to
`document.body`), call `const cleanup = lightboxGroup(opts)(container)`, dispatch
events, assert against `document.body` for the mounted `dialog.hz-lightbox`,
then `cleanup()`. (A small `.svelte` host applying `{@attach}` is an acceptable
alternative for the enhancement assertions; the direct-call form is preferred
for lifecycle coverage.)

**Unit / component (browser):**

- **Enhancement (R5):** after applying, each qualifying `img`/`video` has
  `tabindex="0"`, `role="button"`, `aria-label="View larger: {alt|label}"`,
  `data-lightbox-trigger`; an empty-`alt` image → `aria-label="View larger"`.
- **Exclusions (R4):** a `data-lightbox-ignore` element and an `<img>` inside an
  `<a>` are not enhanced and never open; an `aria-hidden="true"` img (and one
  inside an `aria-hidden` wrapper) is neither enhanced nor ever in the item
  set — assert with an `Image`-like structure (decorative placeholder img next
  to a real img: only the real one is enhanced, and the viewer contains one
  item); a `hidden` / `display:none` element
  **is enhanced** (attributes present) but is excluded from the activation-time
  item set, and joins the group once revealed (assert both halves); the
  `<picture>` wrapper is not a trigger (its inner `<img>` is).
- **Pointer open (R8/R10):** clicking a trigger mounts a `dialog.hz-lightbox`
  into `document.body`, `open`, `data-state="open"`, body scroll locked; the
  item set = all qualifying media in document order; clicking the 2nd of 3 opens
  with the 2nd slide active (start index).
- **Keyboard open (R9):** `Enter` and `Space` on a focused trigger open the
  overlay; the Space `keydown` is `defaultPrevented`.
- **Item derivation (R6):** image `currentSrc || src` → item `src`; `alt` → item
  `alt`; a `<figure><figcaption>` → item `caption`; `data-lightbox-src`
  overrides `src`; a `<video>` → the overlay renders the `Video` player, with
  `label` precedence `aria-label` → `title` → figcaption → `'Video'`.
- **Lazy scan / dynamic children (R7/R12):** append a new `<img>` after attach,
  then open from a pre-existing trigger → the overlay set includes the new image
  (3 slides); directly clicking the newly-added image also opens (delegated
  pointer). A re-run enhances the new image (gains `tabindex`/`role`).
- **Close & focus return (R10):** Escape (`cancel`), backdrop click, and the
  close button each close and **unmount** the overlay (no `dialog.hz-lightbox`
  in `document.body`), restore `document.body.style.overflow`, and set
  `document.activeElement` back to the activated trigger.
- **Nested (R8):** a group inside a group — activating inner media opens exactly
  one overlay (`stopPropagation`).
- **Single-instance guard (R10):** activating a second trigger while open does
  not mount a second dialog.
- **Cleanup (R11):** `cleanup()` removes listeners (a subsequent click opens
  nothing), restores enhancement attributes (an image that had a prior
  `tabindex` keeps it; one that did not has no `tabindex`), removes
  `data-lightbox-trigger`, and unmounts an open overlay while restoring scroll.
- **Export (R16):** extend `exports.spec.ts` to assert `lightboxGroup` resolves
  from `$lib` and is a function.

**Regression (must stay green, unedited):**
`src/lib/components/Lightbox.svelte.spec.ts` — the full existing suite passes
after the overlay extraction (LightboxGroup-R1). `LightboxOverlay.svelte` is
covered transitively through both that suite and the new attachment suite; it
gets no standalone spec (it is a non-exported internal).

### Out of Scope

- **`LightboxGroup` wrapper component** — deferred: a thin convenience over the
  same core; add on demand.
- **`MutationObserver` reactivity** — dynamically-added media are pointer-open
  and included in the lazily-scanned set, but are not auto-enhanced for keyboard
  until the attachment re-runs; consumers needing guaranteed a11y on dynamic
  media use the `Lightbox` component.
- **Zoom / pan / pinch** inside the viewer — not provided (nor by the existing
  `Lightbox`).
- **`srcset` candidate selection beyond `currentSrc`** + the `data-lightbox-src`
  override — no bespoke resolution picker.
- **Nested-group disambiguation / overlapping-selector dedup** — only
  innermost-wins via `stopPropagation`; overlapping groups that select the same
  elements are undefined and not supported.
- **Per-item overrides beyond attributes** — captions/labels/src come only from
  `alt` / `<figcaption>` / `aria-label` / `title` / `data-lightbox-src`; no
  per-item options object.
- **Ordering / grouping controls** — overlay order is document order; no
  `data-index`-style reordering.
- **Visual chrome** beyond the reference theme's `data-lightbox-trigger` cursor
  hook — colors, focus-ring, hover affordances are theme/consumer concerns.
- **Any change to the `Lightbox` component's public API or behavior.**
- **`onopen` / `onclose` / `filter` attachment callbacks** and additional
  options beyond `LightboxGroupOptions` — deferred until a real need appears.
- **Playwright e2e** for the docs demo — the browser unit suite covers behavior;
  the docs tab ships the demo only.
