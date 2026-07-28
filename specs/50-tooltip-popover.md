# Tooltip + Popover — hover/focus description attachment and click-disclosure component

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) as pass/fail. Two primitives ship from one spec because
> they share a positioning core (`R-POS`): **Tooltip** is a Svelte
> **attachment** (`{@attach tooltip(...)}`), **Popover** is a Svelte
> **component** (`<Popover>`). Write scope: `src/lib/attachments/tooltip.ts`
> (new) + its tests; `src/lib/positioning/**` (new shared placement core) +
> tests; `src/lib/components/Popover.svelte` (new) + tests; `src/lib/types`
> (public interfaces); `src/lib/index.ts` + `src/lib/components/index.ts`
> (exports); `src/lib/exports.spec.ts` (guard); `src/lib/theme/components/
> tooltip.css` + `popover.css` (new) wired into `src/lib/theme/theme.css`;
> `src/routes/components/tooltip/+page.svelte` +
> `src/routes/components/popover/+page.svelte` (new docs pages);
> `src/docs/data/tooltip.ts` + `popover.ts` + registration in
> `src/docs/data/index.ts`; `src/docs/manifest.ts` (nav entries);
> `src/docs/hooks.ts` (theme-hook rows); `src/routes/docs.e2e.ts` (e2e).
> Mirrors the overlay precedents `Dropdown.svelte` / `Modal.svelte` and the
> attachment/SSR discipline of `src/lib/motion/reveal.ts` and
> `src/lib/observers/factory.ts`.

### Goal

Ship two composable overlay primitives with zero runtime dependencies and no
Floating-UI-style layout library:

1. **`tooltip`** — an accessible, non-interactive hover/focus **description**
   attached to any existing element (`{@attach tooltip('Save changes')}`),
   satisfying the WAI-ARIA APG Tooltip pattern and WCAG 2.2 SC 1.4.13 (Content
   on Hover or Focus).
2. **`<Popover>`** — a click-triggered **disclosure** whose panel may hold
   rich/interactive content, following the APG disclosure pattern (not a modal
   dialog — `Modal` owns that), with light-dismiss, Escape, and APG-correct
   focus return.

Both float in the **top layer** via the native Popover API (escaping
`overflow:hidden` and stacking contexts), position via **CSS anchor
positioning** where supported, and fall back to a **tiny JS measure-and-place**
flip/shift routine (reusing `@hyzer-labs/ui/observers` `resize` + scroll
listeners to reposition) where anchor positioning is absent. Everything is
progressive enhancement: the underlying content is fully present and operable
without JS, without the Popover API, and without anchor positioning.

---

## Shared positioning core — `R-POS`

A single internal module, **`src/lib/positioning/`**, owns placement math and
top-layer wiring for both primitives. It is **internal** (not a public export;
not a `./positioning` subpath) — only `tooltip.ts` and `Popover.svelte` import
it. Nothing here reads `prefersReducedMotion` (motion is the callers' concern).

1. **R-POS-1 — Placement + alignment vocabulary.** One shared type set in
   `$lib/types`:

   ```ts
   type PopoverSide = 'top' | 'bottom' | 'left' | 'right';
   type PopoverAlign = 'start' | 'center' | 'end';
   /** `'top'` == `'top-center'`; `'-start'`/`'-end'` add alignment. */
   type Placement =
     | PopoverSide
     | `${PopoverSide}-start`
     | `${PopoverSide}-end`;
   ```

   A `parsePlacement(p: Placement): { side: PopoverSide; align: PopoverAlign }`
   helper is the single normalizer both primitives use. Logical, not physical:
   the JS fallback and the CSS both respect writing-mode/RTL where practical —
   see R-POS-6.

2. **R-POS-2 — Top layer via native Popover API.** The floating element (the
   tooltip node; the Popover panel) is a real DOM element carrying the native
   `popover` attribute and promoted to the top layer via
   `showPopover()`/`hidePopover()`. Tooltip uses `popover="manual"` (library
   controls all show/hide; the platform's light-dismiss must NOT fire for a
   tooltip — it dismisses on blur/leave/Escape per R-TT). Popover panel uses
   `popover="auto"` so the platform provides **light-dismiss** (outside
   pointerdown and Escape close it) and one-open-at-a-time semantics for free.
   The floating element is associated to its trigger with the trigger's
   `popovertarget` (Popover) or, for the tooltip whose trigger is an arbitrary
   consumer element, invoked imperatively (`el.showPopover()`), never via a
   `popovertarget` attribute the library would have to stamp onto consumer
   markup.

   **R-POS-2a — where the floating element lives (user decision 2026-07-27:
   tooltip → `body`, Popover inline).** The tooltip attachment **creates and
   appends its tooltip node to `document.body`** (lazily, client-only, like
   `announce`'s live region in `src/lib/observers/announce`), because it
   attaches to a consumer element whose markup it does not own. The Popover
   **renders its panel inline in its own component markup** (`popover="auto"`,
   promoted to the top layer at show time — promotion is visual, so inline
   authoring still works and keeps snippet content, event handlers, and `aria`
   wiring local). **Known consequence (documented, accepted):** a body-appended
   tooltip node sits **outside** any section-scoped `{@attach theme(...)}`
   subtree (the upcoming theme-attachment task), so its chrome resolves against
   the **root** theme, not a scoped subtree's. The Popover panel, authored
   inline, **does** inherit a scoped theme. Revisit tooltip theme-scoping when
   the theme-attachment lands (a possible follow-up: copy the resolved theme
   custom-property values onto the body node); not a v1 blocker.

3. **R-POS-3 — CSS anchor positioning (preferred path).** When
   `CSS.supports('anchor-name: --x')` is true, the trigger gets a unique
   `anchor-name` (`--hz-anchor-<uid>`) and the floating element gets
   `position-anchor: --hz-anchor-<uid>` plus `position-area`/`anchor()`-based
   insets derived from `{ side, align, offset }`. The `@position-try` fallback
   list provides native **flip** (opposite side when the preferred side
   overflows the viewport). **(AMENDED 2026-07-28 — live re-resolution,
   user-directed:** this path is no longer JS-free while shown. Native
   `position-try` keeps its last successful option until it overflows again
   (memory survives even removing/re-adding the property — verified
   Chromium), so a flipped element would NOT return to the requested side
   when room reopens. `position()` therefore attaches passive scroll/resize
   listeners that (a) manage the PRESENCE of `position-try-fallbacks` —
   dropped while flipped-but-requested-side-fits so base applies, re-added
   the moment the base side lacks room — giving eager preference restore;
   and (b) re-stamp `data-side` from real geometry on BOTH paths, so a
   consumer caret tracks a mid-open flip. Both are covered by the flip-demo
   e2e.) Structural anchor CSS (the `anchor-name`/`position-anchor`
   plumbing and `position: fixed` on the floating element) lives in the
   component `<style>` / attachment-authored inline style; **chrome
   (background, border, shadow, radius) lives in the theme sheets**
   (R-THEME).

4. **R-POS-4 — JS measure-and-place fallback.** When anchor positioning is
   unsupported (older Safari/Firefox baseline), a `place(trigger, floating,
   opts)` routine measures both rects (`getBoundingClientRect`), computes the
   `{ side, align, offset }` position, and applies `position: fixed` + `left`/
   `top`. It performs **flip** (choose the opposite side if the preferred side
   lacks room) and **shift** (clamp along the cross axis to keep the floating
   element within the viewport with a small padding). It repositions on scroll
   and resize: reuse **`resize` from `@hyzer-labs/ui/observers`** on the
   floating element (and/or trigger) and a passive `scroll` listener
   (capture-phase, so ancestor scroll containers are caught) while the floating
   element is shown; both are torn down on hide. No `requestAnimationFrame`
   loop — event-driven only. This path never runs when R-POS-3 applies.

5. **R-POS-5 — Arrows: NONE SHIPPED (FINAL, user-directed 2026-07-27;
   supersedes every earlier arrow decision, including R-POS-5a and the interim
   theme-owned-caret pass).** Neither component ships a caret: no `arrow` prop
   on `PopoverProps`, no `arrow` field on `TooltipOptions`, no
   `.hz-popover-arrow` node, no theme-sheet pseudo-element. A caret is a
   visual decision the CONSUMER owns; history (a structural arrow forced page
   scrollbars; a flush-inside theme caret painted surface-on-surface,
   invisible; a UA `[popover]` `overflow: auto` panel scrollbarred a
   protruding one) showed it cannot be shipped headlessly without fighting
   those constraints. What the library DOES ship is the enablement for a
   consumer caret: resolved post-flip `data-side`/`data-align` on both
   floating elements (R-THEME-2/3), both floating elements top-layer
   `position: fixed` (a protruding caret can never grow the document's
   scrollable area), and the Popover panel kept a NON-scroll-container
   (`overflow: visible` in the theme, overriding the UA `[popover]` default;
   scrolling lives on the inner `.hz-popover-content` wrapper) so a
   protruding caret is never clipped or scrollbarred.

6. **R-POS-6 — SSR-safe + logical (RTL required, user decision 2026-07-27:
   do it now).** No `window`/`document`/`CSS` access at module scope; every
   entry guards `typeof document === 'undefined'` and returns inertly (the
   `reveal.ts` / `observers/factory.ts` precedent). The `CSS.supports` probe is
   computed lazily inside a function, never at import. **Logical direction:**
   `left`/`right` placements are treated as inline-start/inline-end and resolve
   through the **trigger's resolved `direction`** (`getComputedStyle(trigger)
   .direction`), so in RTL a `left` placement renders on the physical right and
   vice-versa (parity with Dropdown's `inset-inline-*`); `-start`/`-end`
   alignment likewise respects `direction`. This holds on **both** paths — the
   JS `place()` fallback reads `direction` and swaps physical sides; the CSS
   anchor path uses logical `position-area`/`inset-*` (or a `direction`-aware
   `anchor()`) so the browser resolves it. An e2e asserts an RTL trigger
   (`dir="rtl"`) flips a `left`/`right` tooltip to the opposite physical side
   while block-axis flip/shift stay correct.

7. **R-POS-7 — `offset`.** A numeric `offset` (px gap between trigger edge and
   floating element, default **8**) is honored identically on both the anchor
   and JS paths.

---

## Tooltip (attachment) — `R-TT`

Source: **`src/lib/attachments/tooltip.ts`** (the `lightboxGroup.ts`
precedent — an attachment applied to a consumer's own element). Exported from
the **package root** and `src/lib/index.ts` (alongside `lightboxGroup`), **not**
a subpath (it is a component-tier primitive, not an infra module like `./motion`
or `./observers`; keep it discoverable next to the components consumers already
import). Type `TooltipOptions` lives in `$lib/types`.

1. **R-TT-1 — Signature + call forms.**

   ```ts
   interface TooltipOptions {
     /** The tooltip text. Required (string form or this field). */
     text: string;
     /** Preferred placement. Default 'top'. */
     placement?: Placement;
     /** Gap from the trigger in px. Default 8. */
     offset?: number;
     /** (No `arrow` field — the library ships no caret; a consumer draws
      *  their own off data-side/data-align if wanted; R-POS-5.) */
     /** Delay before showing on hover-intent (ms). Default 400. */
     openDelay?: number;
     /** Delay before hiding after leave, i.e. the hover bridge (ms). Default 150. */
     closeDelay?: number;
     /** Merged after the hz-tooltip class on the tooltip node (R-DOCS-2). */
     class?: string;
   }
   function tooltip(
     text: string
   ): (node: Element) => () => void;
   function tooltip(
     options: TooltipOptions
   ): (node: Element) => () => void;
   ```

   Usage: `{@attach tooltip('Save changes')}` or
   `{@attach tooltip({ text: 'Save changes', placement: 'right' })}`. The string
   overload is sugar for `{ text }`. Returns the canonical attachment shape
   `(node: Element) => () => void` (structurally an
   `import('svelte/attachments').Attachment<Element>`, matching `reveal`).

2. **R-TT-2 — APG Tooltip semantics.** On attach (client only): the tooltip
   node is created (R-POS-2a) with `role="tooltip"` and a stable id
   (`uid('hz-tooltip')`). The **trigger** (the attached node) gains
   `aria-describedby="<tooltip-id>"` — appended to any existing
   `aria-describedby`, and **restored to its prior value on teardown** (the
   `lightboxGroup` prior-attribute-state discipline). Tooltip content is
   **text only, non-interactive** — the option is a `string`, never a snippet.
   A dev-only `console.warn` documents that interactive content belongs in a
   `Popover`, not a Tooltip.

3. **R-TT-3 — Focus parity + hover.** The tooltip shows on **`pointerenter`**
   of the trigger (after `openDelay`) **and** on **keyboard `focus`** of the
   trigger (immediately — no delay for focus, per APG; delay is a
   pointer-noise filter only). It hides on the conditions in R-TT-4. Touch:
   see R-TT-8. The trigger's own focusability is the consumer's responsibility
   — the attachment does not add `tabindex` (contrast `lightboxGroup`, which
   enhances non-interactive media); it targets already-focusable controls
   (icon buttons, links). A dev-only warning fires if the trigger is not
   natively focusable and has no `tabindex`.

4. **R-TT-4 — WCAG 2.2 SC 1.4.13 (all three).**
   - **Dismissible:** pressing **Escape** hides the tooltip **without moving
     focus** and without moving the pointer; focus stays on the trigger. A
     dismissed-by-Escape tooltip does not re-show until the trigger is
     re-entered/re-focused (an internal "suppressed until leave" flag cleared
     on `pointerleave`/`blur`).
   - **Hoverable:** the pointer can travel from the trigger **onto the tooltip
     itself** without it disappearing. Implemented via the `closeDelay` bridge:
     `pointerleave` on the trigger arms a hide timer of `closeDelay` ms;
     entering the tooltip node cancels it; leaving the tooltip re-arms it.
     `pointer-events` on the tooltip must remain enabled (it is not
     `pointer-events: none`), so the bridge works even without a visual gap
     bridge; the `offset` gap is small enough that the delay covers the
     traverse.
   - **Persistent:** the tooltip stays visible until dismissed (Escape),
     trigger blur, or the pointer leaves **both** trigger and tooltip. It never
     auto-hides on a timer while hovered/focused. **(AMENDED 2026-07-28 —
     focus parity:** a pointer leave never hides a tooltip the trigger's
     FOCUS still holds open — the close timer checks `document.activeElement`
     before hiding; blur is that session's own hide path. Covers e.g. the
     page scrolling the trigger out from under the cursor while focused.)

5. **R-TT-5 — Hover-intent delays.** `openDelay` (default **400ms**) filters
   incidental pointer passes; `closeDelay` (default **150ms**) is the hover
   bridge. Timers are per-instance, always cleared on teardown (no callback
   after detach — the `mutate` debounce-teardown discipline). Focus-driven
   show bypasses `openDelay`.

6. **R-TT-6 — Reduced motion.** Any entrance/exit transition (a small fade/
   rise, theme-owned) is suppressed under `prefersReducedMotion.current` from
   `svelte/motion` (the `reveal` posture — the single source of truth; the
   attachment does not reinvent a helper). The **delays (R-TT-5) are NOT
   motion** and are unaffected by reduced motion. The theme sheet also strips
   the CSS transition under `@media (prefers-reduced-motion: reduce)` as a
   belt-and-braces (the Dropdown chevron precedent).

7. **R-TT-7 — SSR-safe.** The attachment never runs server-side (guarded
   `typeof document === 'undefined'` → no-op cleanup). No tooltip node is
   created during SSR; the trigger renders normally and is fully usable without
   JS. If the Popover API is unavailable (older browser), the tooltip falls
   back to a non-top-layer absolutely-positioned node relative to the trigger
   (still `role="tooltip"` + `aria-describedby`, still keyboard/hover operable)
   — R-POS-4 governs its placement. Content is never gated on the tooltip.

8. **R-TT-8 — Touch.** Tooltips have no hover on touch. **Recommendation
   (firm, not open):** on a touch/coarse pointer, the tooltip does not open on
   tap (a tap should activate the underlying control, not reveal a
   description); the `aria-describedby` association still exposes the text to
   assistive tech. No long-press handling in v1 (documented as a limitation,
   not a bug). Consumers needing tap-revealed rich content use `Popover`.

9. **R-TT-9 — Teardown.** On detach: hide + remove the created tooltip node,
   clear both timers, remove scroll/resize listeners (R-POS-4), and restore the
   trigger's prior `aria-describedby` (R-TT-2). No leaked nodes, timers, or
   listeners.

---

## Popover (component) — `R-PO`

Source: **`src/lib/components/Popover.svelte`**. Exported from
`src/lib/components/index.ts` (and thus the package root barrel). Props type
`PopoverProps` (and any placement re-use) in `$lib/types`. Follows the
Dropdown/Modal conventions: stable `hz-*` classes + `data-*` state hooks,
`uid()`/`cx()` from `$lib/utils`, `{...rest}` spread **first** so
component-managed attributes win, **structural CSS only** in `<style>`.

1. **R-PO-1 — Public API.** (User decision 2026-07-27: **default to a composed
   `Button` trigger, with a `trigger` snippet escape hatch for arbitrary
   elements.**)

   ```ts
   interface PopoverProps {
     /** Two-way open state. Default false. */
     open?: boolean; // $bindable
     placement?: Placement;   // default 'bottom-start'
     offset?: number;         // default 8
     // (no `arrow` prop — R-POS-5: the library ships no caret)
     /** Move focus to the first focusable in the panel on open. Default false. */
     autoFocus?: boolean;
     /** Close when focus/pointer leaves; Escape always closes. Default true. */
     dismissible?: boolean;
     /** Accessible label for the panel region when it has no heading. */
     label?: string;
     onopen?: () => void;
     onclose?: () => void;
     // --- Default trigger: a composed Button (the Dropdown precedent) ---
     /** Visible label for the default Button trigger. */
     triggerLabel?: string;
     /** Appearance passthrough for the default Button (variant/intent/size/class). */
     triggerProps?: PopoverTriggerProps;
     /** Icon snippet for the default Button trigger. */
     triggerIcon?: Snippet;
     // --- Escape hatch: bring your own trigger element ---
     /** When provided, WINS over triggerLabel/triggerProps: receives an
      *  `attrs` bag to spread onto any element (link, avatar, icon button). */
     trigger?: Snippet<[TriggerAttrs]>;
     /** The panel content (rich/interactive allowed). */
     children: Snippet;
     class?: string;
     [key: string]: unknown;
   }
   ```

   **Two authoring modes, one component:**
   - **Default (no `trigger` snippet):** Popover renders a composed `<Button>`
     from `triggerLabel`/`triggerProps`/`triggerIcon` exactly as `Dropdown`
     does (`triggerProps.variant ?? 'outline'`, `intent ?? 'neutral'`, the
     `PopoverTriggerProps` shape mirrors `DropdownTriggerProps` in `$lib/types`).
     The library applies the `TriggerAttrs` (`aria-expanded`/`aria-controls`/
     `popovertarget`/`onclick`) to that Button internally.
   - **Override (`trigger` snippet provided):** the snippet receives the
     `TriggerAttrs` bag (`{ id, 'aria-expanded', 'aria-controls', popovertarget,
     onclick }`) and the consumer spreads it onto their own element, so links,
     avatars, or custom controls can be triggers. When `trigger` is present the
     default-Button props are ignored. This is Popover's deliberate divergence
     from `Dropdown` (which ships **no** trigger snippet) — a Popover's trigger
     is commonly not a button.

   **R-PO-1b — Dev warning for an unlabeled default trigger (user policy
   2026-07-27: warn wherever a component can be misused to bypass a required
   label/prop).** In the default-trigger mode, if the composed `<Button>` would
   have **no accessible name** — no `triggerLabel`, no `triggerProps.ariaLabel`,
   and no `trigger` snippet (an icon-only or empty button) — emit a dev-only
   `console.warn` (dev-guarded, like the tooltip's non-focusable-trigger warning
   R-TT-3) telling the consumer to pass `triggerLabel` or an accessible label.
   The component does not fabricate a name; it warns and renders. (This is the
   local instance of a library-wide policy — see the Non-goals note.)

2. **R-PO-2 — Disclosure semantics (NOT dialog).** The trigger carries
   `aria-expanded` (`'true'`/`'false'`), `aria-controls="<panel-id>"`, and
   `popovertarget` pointing at the panel. The panel is a **non-modal disclosure
   region**: `role` is **none by default** (a plain region) unless `label` is
   provided, in which case the panel is a labelled `role="group"` /
   `aria-label`. It is **not** `aria-modal`, has **no focus trap**, and does
   **not** render a backdrop. Cross-reference: for modal semantics (focus trap,
   backdrop, inert background) use `Modal` (`src/lib/components/Modal.svelte`);
   for menu semantics (roving `menuitem`s) use `Dropdown`. The docs state this
   delineation explicitly.

   **R-PO-2a — panel focus management (user decision 2026-07-27: ship
   `autoFocus`, default `false`).** The panel is an **optionally-focus-managed
   non-modal region**:
   - **On open (default `autoFocus: false`):** focus does **not** move into the
     panel — a settings/filter popover must not steal focus (disclosure
     pattern).
   - **`autoFocus: true`:** on open, focus moves to the **first focusable
     element** in the panel, or, if none exists, to the panel container
     (`tabindex="-1"`).
   - **On close** via Escape or a dismiss originating inside the panel, focus
     **always returns to the trigger** (parity with `Dropdown`'s
     `focusTrigger()`), regardless of `autoFocus`. On light-dismiss by clicking
     elsewhere, focus follows the click (R-PO-5). No Modal-style trap either way.

3. **R-PO-3 — Open/close mechanics.** `open` is `$bindable` (the Modal
   precedent). An `$effect` reconciles `open` with the panel's
   `showPopover()`/`hidePopover()` (guarded `if (!panelEl) return` for SSR/
   pre-mount). Toggling the trigger toggles `open`. `onopen`/`onclose` fire
   once per transition after the state settles (the Modal `onclose` discipline).

4. **R-PO-4 — Light-dismiss + Escape.** With `popover="auto"` (R-POS-2) the
   platform provides outside-click dismissal and Escape close; the component
   listens for the native `toggle`/`beforetoggle` event to keep `open` in sync
   (so `bind:open` reflects a platform-driven dismiss), mirroring how Modal
   intercepts the native `cancel`. When `dismissible: false`, outside-click is
   suppressed (switch to `popover="manual"` and manage dismissal manually) but
   **Escape still closes** (APG requires it; no opt-out — the Modal rule). Where
   the Popover API is unavailable, a document `pointerdown`/`focusout` backstop
   (the Dropdown `onDocumentClick`/`onRootFocusOut` pattern) provides
   light-dismiss, and a keydown handler provides Escape.

5. **R-PO-5 — Focus return.** On close via Escape or a dismiss originating
   inside the panel, focus returns to the trigger (`document.contains` guard
   before `.focus()`, the Modal R12 discipline). On light-dismiss by clicking
   elsewhere, focus follows the click (do not yank it back). See R-PO-2a for
   the open-focus decision.

6. **R-PO-6 — Reduced motion.** Entrance/exit transition (theme-owned fade/
   rise) is suppressed under `prefersReducedMotion` and under
   `@media (prefers-reduced-motion: reduce)` in `popover.css` (the Dropdown
   menu-entrance precedent). Panel show/hide correctness never depends on the
   transition.

7. **R-PO-7 — Rich content.** The `children` snippet may contain interactive
   controls (inputs, buttons, links). Tab order flows naturally through the
   panel then out (no trap, R-PO-2). Nested overlays: a `Tooltip` inside a
   Popover panel is supported (both use the top layer; the later-shown element
   stacks above). A nested `Modal` opened from a Popover closes the Popover
   first (documented interaction, not enforced in v1).

8. **R-PO-8 — Structural CSS only.** `<style>` holds only: `position: fixed`
   on the panel, the closed-state `display`/visibility handling that does not
   fight the theme (heed the **Divider unlayered-CSS trap** — a component
   `<style>` is UNLAYERED and beats `@layer hz-theme`, so put **no** chrome/
   resets the theme must override here), and the anchor-name plumbing
   (R-POS-3). All surface/border/shadow/radius/spacing lives in `popover.css`
   (R-THEME).

---

## Theme sheets — `R-THEME`

1. **R-THEME-1 — New sheets.** Add `src/lib/theme/components/tooltip.css` and
   `src/lib/theme/components/popover.css`, each wrapping **all** rules in
   `@layer hz-theme` (the dropdown.css/modal.css precedent). Register both in
   `src/lib/theme/theme.css`'s `@import` aggregation (adjacent to
   `dropdown.css`/`modal.css`).

2. **R-THEME-2 — Tooltip chrome (no arrow).** `.hz-tooltip`
   surface (small padding, `--hz-color-*` inverse/surface background, radius,
   shadow, `max-width` for wrapping long text, `font-size-sm`), `z-index` token
   (`--hz-z-tooltip`, a new token above `--hz-z-dropdown`). Entrance keyframe
   (fade + small rise) collapsed under reduced motion. Because the tooltip is
   top-layer, the `z-index` mainly matters on the non-top-layer fallback path.
   **Arrow: none (R-POS-5, FINAL 2026-07-27).** The theme draws NO caret; a
   consumer draws their own (e.g. `.hz-tooltip::after` with a negative inset
   — safe, the tooltip node is `position: fixed` in the top layer, which
   never contributes to the document's scrollable area). Consumer-caret
   posture (AMENDED 2026-07-28): `.hz-tooltip` sets `overflow: visible`
   explicitly — the UA `[popover]` stylesheet otherwise makes the tooltip a
   scroll container that clips/scrollbars a protruding caret (the
   R-THEME-3 panel posture, applied here too). The edge-flush e2e
   still guards that a tooltip near each viewport edge never grows a
   horizontal scrollbar. Consumer carets key off the tooltip's
   **resolved (post-flip) side** — the attachment must expose that as a
   `data-side` on the tooltip node (fixing the pre-flip-`data-side` gap the
   reviewer flagged) on both positioning paths. An e2e must assert no
   horizontal scrollbar appears
   (`documentElement.scrollWidth <= clientWidth`) with a tooltip shown near each
   viewport edge.

3. **R-THEME-3 — Popover chrome (AMENDED 2026-07-27, R-POS-5 final).**
   `.hz-popover-panel` surface (background, border, radius, shadow),
   `--hz-z-popover` token, entrance keyframe collapsed under reduced motion.
   No backdrop rule (non-modal — contrast `.hz-modal::backdrop`). NO caret is
   drawn, but the consumer-caret posture is mandatory: the panel is NOT a
   scroll container (`overflow: visible`, explicitly — the UA `[popover]`
   stylesheet defaults to `overflow: auto`); `overflow`/`max-height`/`padding`
   live on the inner `.hz-popover-content` scroll wrapper (Popover.svelte).
   E2e pins the posture: open panel computed overflow visible, content wrapper
   scrolls, no document scrollbar.

4. **R-THEME-4 — Hook rows.** Add `src/docs/hooks.ts` rows for both components'
   theme custom properties and `data-*` state hooks (`data-state`,
   `data-placement`, `data-side`, `data-align`, `data-open`), so the styling
   contract is documented once and `hooks.spec.ts` stays green.

---

## Docs — `R-DOCS`

1. **R-DOCS-1 — Two pages, flat IA.** New `src/routes/components/tooltip/
   +page.svelte` and `.../popover/+page.svelte`, following the established
   `DocPage` + `Example` pattern (live preview + always-visible `$derived`
   code fence beneath each example; consumer-facing copy — **no** spec numbers,
   R-numbers, or test-gate citations). Section `h2`s keep stable ids for the
   TOC.

2. **R-DOCS-2 — Doc data.** New `src/docs/data/tooltip.ts` and `popover.ts`
   exporting a `ComponentDoc` (the modal.ts shape): `description`, `importLine`
   (`import { Popover } from "@hyzer-labs/ui"` and, for tooltip, `import {
   tooltip } from "@hyzer-labs/ui"`), `props` (the Popover props table;
   the Tooltip options table), and — required — a `class` prop row with the
   note **"Merged after the hz-<component> class."**. Register both in
   `src/docs/data/index.ts`.

3. **R-DOCS-3 — a11y note + links.** Each doc's `a11yNote` describes the
   pattern (Tooltip: `aria-describedby`, hover+focus parity, SC 1.4.13
   dismissible/hoverable/persistent; Popover: `aria-expanded`/`aria-controls`,
   non-modal disclosure, Escape + light-dismiss, focus return). `a11yLinks`
   ("References:") link, respectively: the **APG Tooltip pattern**, the **APG
   Disclosure pattern** (Popover), the **MDN Popover API**, and **WCAG 2.2 SC
   1.4.13**. The Popover page cross-links `Modal` ("need a focus-trapped modal?
   use Modal") and `Dropdown` ("need a menu? use Dropdown").

4. **R-DOCS-4 — Nav manifest.** Add `{ label: 'Tooltip', href:
   '/components/tooltip' }` and `{ label: 'Popover', href: '/components/popover'
   }` to the Components → Common group in `src/docs/manifest.ts` (near Dropdown/
   Modal). No `hooks.ts` omission — R-THEME-4 supplies the hook rows the
   component pages render.

5. **R-DOCS-5 — Examples (each page).** Tooltip: an icon `Button` with a
   tooltip; placement variants; a long-text wrapping tooltip; the SC 1.4.13
   behaviors called out (hover onto tooltip, Escape to dismiss). Popover: a
   filter/settings popover with interactive fields; placement + alignment; a
   custom-trigger example; the "not a modal" delineation shown alongside a
   link to Modal. Every interactive example is keyboard-operable and legible at all
   three breakpoints (R-RESP).

---

## Responsive Behavior — `R-RESP`

- **Mobile (<640px).** Floating elements must not overflow the viewport: the JS
  fallback **shift** (R-POS-4) and the anchor `@position-try` (R-POS-3) clamp
  within a small viewport padding. Tooltip `max-width` (R-THEME-2) keeps long
  text readable; the Popover panel caps at `min(<token>, calc(100vw - gutters))`
  so a wide panel reflows rather than causing horizontal scroll (the Modal
  `max-width` posture). No new interaction pattern at mobile — but note R-TT-8
  (no hover tooltips on touch).
- **Tablet (640–1024px) / Desktop (>1024px).** Preferred placement is honored
  with room; flip only on genuine overflow. Docs examples inherit the docs
  shell layout and remain operable at every breakpoint.

---

## Accessibility — `R-A11Y`

House bar is AA-minimum, ideally AAA; everything keyboard-operable.

- **Tooltip.** APG Tooltip pattern: `role="tooltip"` + `aria-describedby` from
  trigger; shows on hover AND focus; non-interactive text only. WCAG 2.2 SC
  1.4.13 fully satisfied (R-TT-4: dismissible via Escape without moving focus,
  hoverable via the `closeDelay` bridge, persistent until dismiss/blur/leave).
  No focus is ever moved by the tooltip.
- **Popover.** APG Disclosure: `aria-expanded`/`aria-controls` on the trigger;
  Escape always closes and returns focus to the trigger; light-dismiss on
  outside interaction; not a modal (no trap, no `aria-modal`, no backdrop).
  Interactive panel content is in natural tab order.
- **Contrast.** Tooltip and Popover surfaces meet AA text contrast against
  their themed backgrounds. Contrast is a theme-sheet responsibility (uses
  the `--hz-color-*` roles that flip under `[data-theme="dark"]`).
- **Reduced motion.** Entrance/exit transitions honor `prefersReducedMotion`
  and the `@media (prefers-reduced-motion: reduce)` query (R-TT-6/R-PO-6); the
  hover-intent delays are unaffected (they are not motion).
- **Focus-visible.** Triggers keep their own focus-visible ring (consumer
  element / composed Button, the shared field-ring convention); the primitives
  add none of their own to the trigger.

---

## References / precedents

- `src/lib/components/Dropdown.svelte` — overlay precedent: `uid()`/`cx()`,
  `data-open`/`data-align` hooks, `{...rest}`-first, `onDocumentClick` +
  `onRootFocusOut` light-dismiss backstop, `focusTrigger()` on close, structural
  CSS only. The Popover non-modal dismiss + focus-return logic mirrors this.
- `src/lib/components/Modal.svelte` — the `$bindable open` reconcile-via-effect
  pattern, native-event interception (`cancel` → `open = false`; Popover uses
  `toggle`/`beforetoggle`), `onclose`-once discipline, focus-return with
  `document.contains` guard, top-layer via a platform primitive. Popover is the
  **non-modal** counterpart — the docs delineate when to use which.
- `src/lib/motion/reveal.ts` — attachment shape `(node) => () => void`, the
  `typeof document` SSR guard, and `prefersReducedMotion.current` gating.
  Tooltip mirrors this exactly.
- `src/lib/attachments/lightboxGroup.ts` — an attachment applied to a
  consumer's own element: prior-attribute-state capture/restore, dev-a11y
  warnings, `mount`-time DOM creation. Tooltip's `aria-describedby`
  append/restore and its created tooltip node follow this.
- `src/lib/observers/factory.ts` + `src/lib/observers` `resize` — the
  create→observe→disconnect discipline and the `resize` attachment the JS
  fallback (R-POS-4) reuses to reposition. Absent-global guard pattern.
- `src/lib/theme/components/dropdown.css`, `modal.css` — `@layer hz-theme`
  chrome, entrance keyframe + reduced-motion strip, `--hz-z-*` tokens; the new
  `tooltip.css`/`popover.css` mirror these. Heed the Divider unlayered-`<style>`
  trap noted in `theme.css`.
- `src/docs/data/modal.ts`, `src/docs/manifest.ts`, `src/docs/hooks.ts`,
  `src/docs/data/index.ts` — the docs data/manifest/hooks wiring to extend.
- `src/lib/index.ts` — the package-root attachment export precedent
  (`export { lightboxGroup } ...`); add `tooltip` beside it.
- `src/lib/exports.spec.ts` — the public-surface guard to extend for
  `tooltip`/`Popover`.

---

## Non-goals

- **No toast/notification system.** The house decision stands: transient status
  uses an inline `Alert` with `role="status"`, not a floating toast. Neither
  primitive is a toast.
- **No menu semantics.** `Dropdown` owns `role="menu"`/`menuitem`, roving
  tabindex, and typeahead. Popover is a plain disclosure region; it does not
  render menu roles.
- **No modal / focus-trap.** `Modal` owns `aria-modal`, the native
  `showModal()` focus trap, the backdrop, and scroll lock. Popover is
  explicitly non-modal (R-PO-2); it traps nothing and renders no backdrop.
- **No Floating-UI or any positioning dependency.** Zero runtime deps: native
  Popover API + CSS anchor positioning + the tiny in-house JS fallback only.
- **No submenu / nested-menu, no virtualized/async panel content** in v1.
- **No interactive tooltip content.** Interactive content is a Popover by
  definition (R-TT-2). No snippet/HTML tooltip body in v1.
- **No long-press touch tooltip** (R-TT-8) — documented limitation.
- **No public `./positioning` subpath** — the placement core is internal to the
  two primitives (R-POS).
- **No controlled-delay global config / theme-wide tooltip provider** — delays
  are per-attachment options.

---

## Edge cases & error states

| Case | Expected |
| --- | --- |
| SSR import/render of `tooltip` or `<Popover>` | No throw; tooltip attachment no-ops (no node created); Popover renders trigger + inert panel markup, `showPopover` deferred to the mount effect. Content fully present without JS. |
| Popover API unavailable (old browser) | Progressive fallback: non-top-layer absolutely/fixed-positioned floating element via R-POS-4; full ARIA + keyboard + dismiss preserved. |
| CSS anchor positioning unsupported | JS measure-and-place fallback (R-POS-4) with flip + shift; repositions on scroll/resize; torn down on hide. |
| Tooltip Escape while shown | Hides without moving focus/pointer; suppressed until trigger re-enter/blur (R-TT-4 Dismissible). |
| Pointer travels trigger → tooltip across the `offset` gap | Tooltip stays (closeDelay bridge; tooltip keeps `pointer-events`); leaving both re-arms hide (R-TT-4 Hoverable). |
| Trigger unmounts while tooltip shown | Attachment teardown removes the tooltip node, clears timers, drops listeners, restores `aria-describedby` (R-TT-9). No leak. |
| Trigger already has `aria-describedby` | Tooltip id is appended, not overwritten; original value restored on teardown (R-TT-2). |
| Non-focusable tooltip trigger | Dev-only warning; tooltip still shows on hover but is unreachable by keyboard — flagged as consumer misuse (R-TT-3). |
| Touch/coarse pointer | No hover-open (R-TT-8); `aria-describedby` still exposes text to AT; tap activates the underlying control. |
| Reduced motion mid-session | Next show/hide honors the new `prefersReducedMotion.current`; delays unchanged. |
| Popover dismissed by platform light-dismiss | `toggle`/`beforetoggle` syncs `open` to `false`; `onclose` fires once; focus follows the click, not yanked back (R-PO-4/R-PO-5). |
| Popover Escape | Always closes (even `dismissible: false`); focus returns to trigger (R-PO-4/R-PO-5). |
| Popover `open` bound `true` before mount | Reconcile effect calls `showPopover()` after `panelEl` binds (Modal precedent); no throw pre-mount. |
| Two Popovers, both `open` | `popover="auto"` one-open-at-a-time closes the first when the second opens (platform); each `onclose` fires. `dismissible:false`/manual popovers do not auto-close each other (documented). |
| Tooltip on a trigger inside `overflow:hidden`/transformed ancestor | Top-layer (R-POS-2) escapes clipping; the JS fallback uses `position: fixed` so it also escapes (flip still correct). |
| Panel content taller/wider than viewport | Panel caps at viewport minus gutters and scrolls internally (R-RESP); does not cause page horizontal scroll. |
| RTL / logical direction | `left`/`right` resolve through the trigger's resolved `direction` (RTL flips the physical side); `-start`/`-end` respect direction; block-axis flip/shift stay correct (R-POS-6). |
| Rapid hover in/out under `openDelay` | Incidental passes never show the tooltip; only a dwell ≥ `openDelay` opens it (R-TT-5). |

---

## Test gates

Framework/runners already in the repo: **Vitest**, two projects — `client`
(real Chromium via `@vitest/browser-playwright`, matches
`src/**/*.svelte.{test,spec}.ts`) and `server` (`environment: 'node'`, no DOM,
matches other `*.spec.ts`) — plus **Playwright** e2e in
`src/routes/docs.e2e.ts`.

> The `client` project runs in a real browser, so the Popover API / anchor
> positioning may genuinely exist there. Fallback-path tests must **force the
> JS path** by stubbing `CSS.supports`/`HTMLElement.prototype.showPopover` to
> unsupported, exactly as `reveal.svelte.spec.ts` substitutes a fake observer,
> to exercise R-POS-4 deterministically.

**Unit — `tooltip.svelte.spec.ts` (client):**
- Attach adds `role="tooltip"` node + `aria-describedby` on the trigger;
  detach restores prior `aria-describedby` and removes the node/timers/listeners.
- Shows on `pointerenter` after `openDelay` (fake timers) and immediately on
  `focus`; hides on `blur` and on leaving both trigger and tooltip after
  `closeDelay`.
- SC 1.4.13: Escape hides without moving focus and suppresses re-show until
  re-enter (Dismissible); entering the tooltip node cancels the pending hide
  (Hoverable); no auto-hide timer while hovered/focused (Persistent).
- Reduced motion (`vi.mock('svelte/motion')`): no entrance transition applied;
  delays unchanged.
- Forced no-Popover-API path: falls back to positioned node, still shows/hides
  and keeps ARIA.
- String overload equals `{ text }`.

**Unit — `Popover.svelte.spec.ts` (client):**
- `bind:open` reconciles to `showPopover()`/`hidePopover()`; trigger toggles
  `open`; `aria-expanded`/`aria-controls`/`popovertarget` wired.
- Escape closes and returns focus to the trigger (incl. `dismissible:false`).
- Light-dismiss (outside pointerdown) closes and syncs `open`; `onopen`/
  `onclose` fire once per transition.
- Panel is non-modal: no `aria-modal`, no backdrop element, no focus trap
  (Tab from last panel control leaves the panel).
- Reduced-motion: no entrance transition; correctness intact.
- Forced no-Popover-API path: document-backstop light-dismiss + Escape still
  work (Dropdown-pattern).

**Unit — `positioning` (client + server):**
- `parsePlacement` normalizes all `Placement` strings to `{ side, align }`.
- `place` (JS fallback) flips to the opposite side on overflow and shifts to
  stay within viewport padding; honors `offset`.
- Server (`positioning.spec.ts`): module imports without `document`; every
  entry no-ops/guards, no throw (the `reveal.spec.ts` precedent).

**Unit — `exports.spec.ts` (server):**
- Package root exposes `tooltip` (function) and `Popover` (component).
- No new subpath keys added (positioning stays internal).

**Docs data — `data.spec.ts` / `hooks.spec.ts`:**
- `tooltipDoc`/`popoverDoc` registered; each props table includes the `class`
  row with the exact "Merged after the hz-<component> class." note.
- `hooks.ts` rows for both match real theme hooks (`hooks.spec.ts` green).

**e2e — `src/routes/docs.e2e.ts` (Playwright):**
- `/components/tooltip`: hovering/focusing a trigger reveals the tooltip;
  Escape dismisses; moving the pointer onto the tooltip keeps it; the tooltip
  node carries `role="tooltip"` and the trigger `aria-describedby`.
- `/components/popover`: clicking the trigger opens the panel (`aria-expanded`
  flips), Escape closes and refocuses the trigger, an outside click
  light-dismisses; an interactive control inside the panel is operable; no
  backdrop element is present.
- Both pages render, all examples present/operable, TOC h2 ids present; sweep
  green (kill port 4173 before the e2e serve per the stale-preview note).
