# specs/51 — Dropdown on the positioning core + `/foundation/positioning`

**Status: APPROVED by user 2026-07-27. Build after the specs/49 ring variant
and specs/01 Button batch land (shared hooks.ts / docs.e2e.ts); R-DD before
R-FP.**

### Goal

Move `Dropdown`'s menu onto the shared internal positioning core
(`src/lib/positioning/`, built for specs/50 Tooltip/Popover) so it gains
viewport-edge flip, top-layer escape from clipping ancestors, and the
resolved `data-side`/`data-align` contract — with **zero public API change**
— making Dropdown the core's third consumer. Then add a thin
`/foundation/positioning` docs page that gives the shared positioning
philosophy (logical-first placement, RTL through the trigger, top layer,
resolved-state hooks, the draw-your-own-caret recipe) a single home.

### Context & Conventions

- Current behavior (specs/28): the menu is an absolutely-positioned child of
  `.hz-dropdown` (`top: 100%` + `inset-inline-start/end` per `align`),
  `display: none` while closed. Consequences this spec fixes: a menu near the
  viewport bottom overflows off-screen (no flip), and an `overflow: hidden`
  or transformed ancestor clips it (no top-layer escape).
- The positioning core (specs/50 R-POS) provides: native CSS anchor
  positioning with `@position-try` flip where supported, a JS
  measure-and-place fallback (flip + shift, scroll/resize tracked via
  observers `resize` + capture-phase scroll) elsewhere, RTL logical
  resolution through the TRIGGER's computed `direction` (R-POS-6), SSR-safe
  no-op, and a synchronous resolved `{ side, align }` return.
- Greenfield: breaking changes are free, but this spec intentionally makes
  none at the API level — it is a behavior upgrade.
- House gates: svelte-check 0/0; unit + e2e green; docs copy is
  consumer-facing (no spec/R-number/process references).

---

## Dropdown adopts the core — `R-DD`

1. **R-DD-1 — Public API (AMENDED 2026-07-28, user-directed): `align` gains
   `'center'`.** `align?: 'start' | 'center' | 'end'` (default `'start'`) is
   the whole placement surface. Dropdown still deliberately uses a SUBSET of
   the shared `Placement` vocabulary: a menu button opens on the block axis,
   so the side is component-managed (`bottom`, flipping to `top` only when
   space below is insufficient) and `left`/`right` sides are not offered. No
   `placement` prop, no `offset` prop (see R-DD-4). The docs Alignment demo
   shows all three alignments side by side.

2. **R-DD-2 — Top layer.** The menu `<ul>` gets `popover="manual"` and is
   shown/hidden with `showPopover()`/`hidePopover()` in lockstep with the
   existing `open` state (reconcile pattern from Popover.svelte, including
   the pre-mount/SSR guard and the non-supporting-browser fallback where the
   current CSS `display` toggling remains the mechanism). `"manual"`, not
   `"auto"`: Dropdown already owns its dismissal (document click listener +
   root `focusout` backstop + Escape) and must not inherit platform
   light-dismiss or one-open-at-a-time semantics that would double-fire with
   it. The menu stays a DOM child of the root, so `composedPath()`-based
   outside-click detection, `focusout` containment, and roving-tabindex focus
   handling are untouched.

3. **R-DD-3 — Positioned by the core.** On open (and only while open), call
   `position(triggerEl, menuEl, { side: 'bottom', align, offset })` exactly as
   Popover.svelte does: anchor path where supported, JS fallback elsewhere,
   teardown stored and called on close. The structural CSS positioning
   (`position: absolute; top: 100%; inset-inline-*`) is REMOVED in favor of
   the core's `position: fixed` + insets/anchor plumbing. Flip is
   block-axis only (`bottom` → `top`); the JS path's cross-axis shift keeps
   the menu on-screen for long labels near a side edge.

4. **R-DD-4 — Offset preserves today's look.** The `offset` passed to the
   core must reproduce the CURRENT rendered gap between trigger and menu
   (today: `top: 100%` plus whatever block-start margin
   `theme/components/dropdown.css` adds — measure it, hardcode the sum as the
   internal default, and delete the theme margin so the gap is owned in one
   place). Not a public prop until someone needs it.

5. **R-DD-5 — Resolved-state hooks move to the menu.** The menu element gets
   `data-side` (`'bottom' | 'top'`, RESOLVED post-flip) and `data-align`
   (`'start' | 'end'`, resolved through the trigger's `direction` per
   R-POS-6). The root keeps `data-open` and `data-state="disabled"` as-is.
   BREAKING (theme-internal only): the root-level `data-align` attribute is
   REMOVED — `theme/components/dropdown.css` selectors move from
   `.hz-dropdown[data-align='end'] .hz-dropdown-menu` to
   `.hz-dropdown-menu[data-align='end']`, and the entrance animation keys its
   direction off the menu's `data-side` (a top-flipped menu falls upward —
   mirror the translate sign, the Popover precedent). `hooks.ts` rows updated
   to match (add `data-side`, move `data-align`; `hooks.spec.ts` stays
   green).

6. **R-DD-6 — RTL behavior identical, now on both paths.** Today RTL comes
   free from `inset-inline-*`. After the move it comes from the core's
   R-POS-6 resolution through the trigger's computed `direction`. E2e must
   pin equivalence: under `dir="rtl"`, `align="start"` menus attach to the
   trigger's right edge (and `end` to the left), on the anchor path AND the
   forced-JS-fallback path.

7. **R-DD-7 — Keyboard/focus/ARIA untouched.** Menu-button pattern
   (`aria-haspopup="menu"`, `aria-expanded`, `aria-controls`), roving
   tabindex, ArrowUp/Down/Home/End, single-char typeahead, Escape-to-trigger,
   Tab-closes, disabled-item semantics: all unchanged. The `openTo()` →
   `tick()` → focus sequencing must still hold with `showPopover()` in the
   flow (focus after the popover is shown, mirroring Popover's
   `handleShown` ordering).

8. **R-DD-8 — Reduced motion.** Whatever entrance treatment exists keeps its
   current reduced-motion handling; if the animation gains a direction (R-DD-5)
   the reduced-motion path collapses both directions the same way.

9. **R-DD-9 — Tests.**
   - Unit: resolved `data-side`/`data-align` land on the menu; `align`
     defaults; API surface unchanged.
   - E2e (real geometry, both positioning paths, the specs/50 pattern):
     (a) menu opens adjacent to the trigger, not pinned at 0,0;
     (b) a trigger near the viewport bottom flips the menu above
     (`data-side="top"`) and the menu stays fully on-screen;
     (c) a trigger inside an `overflow: hidden` ancestor still shows its
     full menu (top-layer escape) — this is the headline new capability;
     (d) R-DD-6 RTL equivalence;
     (e) existing keyboard e2e all still green.

10. **R-DD-10 — Out of scope (noted follow-ups).** `Combobox`/
    `VirtualizedCombobox` listboxes and horizontal `Nav` dropdown panels keep
    their own positioning for now — candidates for the same migration later;
    the VirtualizedCombobox wheel-scroll `aria-activedescendant` pre-publish
    blocker is unrelated and stays tracked separately.

---

## Foundation page — `R-FP`

1. **R-FP-1 — `/foundation/positioning`.** New thin docs page, manifest entry
   under Foundation adjacent to Observers. Register in `src/docs/manifest.ts`;
   TOC-stable h2 ids per the docs shell conventions.

2. **R-FP-2 — Content (thin elaboration, the "Logical axes" register).**
   Sections, in consumer language:
   - **One placement vocabulary.** The shared `Placement` type (side ×
     optional `-start`/`-end`; bare side = centered) and who consumes what:
     Tooltip (all eight), Popover (all eight), Dropdown (`align` only — the
     side is managed for you, flipping near the viewport edge).
   - **Logical-first, resolved through the trigger.** `start`/`end` follow
     reading direction; `left`/`right` resolve through the TRIGGER's
     `direction`, not the floating element's own (floating elements may be
     body-appended/top-layer, so their inherited direction can differ) —
     cross-link Spacing's "Logical axes" section both ways.
   - **The top layer.** Floating elements escape `overflow` clipping and
     stacking contexts; why `--hz-z-*` tiers mainly matter on the
     non-top-layer fallback path — cross-link Borders & Elevation's z-tier
     table.
   - **Automatic flip + resolved hooks.** The preferred side is a request,
     not a promise: it flips at viewport edges, and `data-side`/`data-align`
     always report what actually rendered.
   - **Draw-your-own-caret recipe.** The library ships no arrows (a caret is
     a visual decision the consumer owns). A short copy-ready CSS example:
     `::after` keyed off `[data-side]`, negative-inset protrusion, why that
     is scrollbar-safe (top-layer `position: fixed`), and the Popover
     precondition (the panel is deliberately not a scroll container —
     `.hz-popover-content` scrolls instead). This recipe MOVES here; the
     hooks-table notes on Tooltip/Popover pages shrink to one line linking
     to this page.
   - **Accessibility posture.** Placement never changes DOM/reading order:
     source order, focus order, and roving-tabindex behavior are identical in
     every placement and direction; flip is visual-only. Keep short, plain
     language.

3. **R-FP-3 — Demo restraint.** At most one small interactive demo (e.g. a
   flip demo in a scrollable frame). The component pages already carry the
   placement grids; this page is prose-first — do not duplicate the 8-grids.

4. **R-FP-4 — E2e.** The standard page smoke: renders, h2 ids stable,
   examples (if any) operable — added to the docs e2e alongside the other
   foundation pages.

---

## Sequencing

Build AFTER the in-flight Loading ring variant (specs/49 amendment) and the
Button tweak batch (specs/01 amendment) land — R-DD-5 touches `hooks.ts` and
the e2e file both batches also touch. R-DD before R-FP (the page describes
three shipped consumers).
