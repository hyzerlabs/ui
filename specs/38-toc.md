# Toc — promote the docs "On this page" rail to a navigation component

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) as pass/fail. Write scope:
> `src/lib/components/Toc.svelte` (+ spec), `src/lib/types/index.ts`
> (`TocEntry`), `src/lib/components/index.ts`,
> `src/lib/theme/components/toc.css` (new) + `theme.css` registration,
> `src/docs/hooks.ts`, `src/docs/manifest.ts` + `/components/toc` docs
> page, the docs shell swap (R9 — `src/docs/Toc.svelte` deleted,
> `src/routes/+layout.svelte` adjusted), and e2e updates. Runs after Table
> (specs/37), before Motion (specs/39) and the audit (specs/40).

### Goal

The docs shell's "On this page" rail (`src/docs/Toc.svelte`, built
2026-07-21) is a working prototype of a component the user wants on other
sites — heffner.dev currently uses `svelte-toc`, and this library's Toc
should replace it. Promote it to a public component in the Navigation
group, scope decided with the user (2026-07-22): **auto heading collection
+ scroll-spy** (the prototype's behavior) plus **nested h2/h3 levels**,
**mobile collapse mode**, **smooth scrolling**, and an **active-heading
callback**. The docs shell then dogfoods it (R9), same as Nav.

### API sketch (normative)

```svelte
<Toc
  container=".docs-main-inner"   // selector | HTMLElement; default 'main'
  levels={[2, 3]}                // heading levels collected; default [2]
  exclude=".doc-example"         // headings inside matches are skipped
  minEntries={2}                 // render nothing below this; default 2
  title="On this page"           // visible title; '' hides it
  ariaLabel="On this page"       // nav landmark name; defaults to title
  autoId                          // slugify ids onto id-less headings; default true
  watch                           // MutationObserver re-collection; default true
  smoothScroll                    // default true; instant under reduced motion
  breakpoint="none"              // 'sm'|'md'|'lg'|'none' — collapse below; default 'none'
  bind:active                    // bindable id of the current heading
  onActive={(id) => …}           // fires when the active heading changes
/>
```

### Requirements

1. **R1 — Collection.** On mount, collect headings inside `container`
   matching `levels`, skipping: headings inside an `exclude` match,
   hidden headings (`offsetParent === null`), and headings inside the Toc
   itself. With `autoId` (default true), id-less headings get a
   deterministic slug of their text (kebab, deduped with `-2`, `-3` …);
   with `autoId={false}`, id-less headings are skipped. Entries
   (`TocEntry { id, label, level }`) render as a nested list — deeper
   levels nest under the nearest preceding shallower entry; orphan deep
   headings (h3 before any h2) attach at the top level. `container`
   resolving to nothing dev-warns once and renders nothing.
2. **R2 — Re-collection.** `watch` (default true) observes the container
   (childList + subtree, debounced ≥100ms) and re-collects when headings
   change — SPA navigations and dynamic content just work without
   framework coupling (the component must NOT import `$app/*`). The
   collection function is also exported on the instance (`refresh()`) for
   manual control when `watch` is off.
3. **R3 — Scroll-spy.** The active entry is the last heading at or above
   the top quarter of the viewport (bottom-of-page pins the last entry) —
   the prototype's algorithm, positions read live per animation frame,
   listeners passive and cleaned up on destroy. The active link carries
   `aria-current="location"`. `active` is bindable; `onActive(id)` fires
   only on change (not per scroll frame). Clicking a link sets it
   immediately.
4. **R4 — Smooth scroll.** Link clicks prevent default anchor jump,
   scroll the heading into view (`behavior: 'smooth'`, block start), and
   update the URL hash via `history.replaceState` (no history spam; Back
   still leaves the page, not each section). `smoothScroll={false}` or
   `prefers-reduced-motion: reduce` (via `svelte/motion`'s
   `prefersReducedMotion` — raise the svelte peer floor to `^5.7.0`)
   scrolls instantly instead. Landing on a URL with a hash does not fight
   the browser's native jump.
5. **R5 — Markup + a11y.** `<nav class="hz-toc" aria-label>` → optional
   `.hz-toc-title` (plain element, not a heading — the Toc must never
   collect itself or add to the document outline) → nested
   `<ul class="hz-toc-list">` with `.hz-toc-link` anchors carrying
   `data-level`. All state is reflected as attributes for theming:
   `data-collapsed`, `data-breakpoint`, `aria-current`.
6. **R6 — Mobile collapse.** With `breakpoint` set, below that width the
   rail renders as a disclosure: a `.hz-toc-trigger` button (title +
   chevron, `aria-expanded`/`aria-controls`) toggling the list panel;
   Escape and outside-click close; closing returns focus to the trigger;
   selecting an entry closes it. Breakpoints are literal px mirroring the
   width tokens (the Grid BAND / Table stacked precedent — CSS can't read
   custom properties in media queries). `breakpoint="none"` (default)
   never collapses.
7. **R7 — Theme.** `toc.css` in `@layer hz-theme`, registered in
   `theme.css`: muted small-type links with a left hairline, per-level
   indent from `data-level`, active = primary text + inset accent bar
   (the sidebar idiom), title in the uppercase eyebrow style, disclosure
   trigger/panel styling for collapse mode, `prefers-reduced-motion`
   honored on any transition. Hooks entry in `hooks.ts` (root `hz-toc`;
   attrs `data-level`, `data-collapsed`, `data-breakpoint`,
   `aria-current="location"`; parts title/list/link/trigger/panel) —
   `hooks.spec.ts` green.
8. **R8 — Docs.** Manifest: **Toc** in Components → Navigation.
   `/components/toc` page (DocPage): props + `TocEntry` table, a11y note
   (landmark naming, `aria-current="location"`, disclosure pattern,
   reduced-motion behavior), examples — basic, nested levels, collapse
   mode, callback/bindable active. The demo TOC watches a demo article
   inside the page, not the docs page itself (no fighting the shell's
   rail).
9. **R9 — Dogfood swap.** Delete `src/docs/Toc.svelte`; the docs shell
   renders `<Toc container=".docs-main-inner"
   exclude=".doc-example, .sample-frame" />` with unlayered chrome
   overrides (the Nav-in-sidebar precedent) for its fixed-rail
   positioning and the ≥1440px gutter — that layout CSS stays in the
   shell, not the component. The existing "On this page rail" e2e block
   must pass unchanged except where selectors genuinely moved (nav label
   stays "On this page"); h2-only collection and the ≥2-entry minimum
   keep current shell behavior identical.
10. **R10 — Order.** Entries follow document order at all times,
    including after re-collection reorders or removals; `active` resets
    correctly when the active heading disappears (falls back to the
    nearest surviving entry).

### Edge Cases & Error States

| Case | Expected |
| --- | --- |
| Fewer than `minEntries` headings | Renders nothing (no empty landmark). |
| Duplicate heading text with `autoId` | Slugs dedupe (`usage`, `usage-2`); ids stable across a single collection pass. |
| Heading text changes but id exists | Label updates on re-collect; id untouched (never re-slug an existing id). |
| Headings added/removed dynamically | `watch` re-collects; active falls back gracefully. |
| `container` matches multiple elements | First match + dev-warn. |
| Toc rendered inside its own container | Its title/trigger are never collected (self-exclusion). |
| Hash in URL on load | Native jump respected; spy marks that heading active. |
| `levels={[3]}` only | Flat list of h3s; no phantom h2 nesting. |
| RTL | Indent and accent bar follow logical properties. |

### Existing Code to Reuse

- `src/docs/Toc.svelte` — collection filter, rAF spy, bottom-pin rule,
  and the active-link styling move into the component (then delete the
  file). The docs-only parts (`.docs-main-inner` default targets,
  `afterNavigate`) are replaced by props + MutationObserver.
- Disclosure a11y (Escape/outside-click/focus-return): Header's drawer
  and Dropdown are the in-repo precedents.
- Literal-px breakpoint constants: Grid BAND / Table stacked precedent.

### Test Plan

**Unit:** collection (levels, exclude, hidden, self-exclusion), autoId
slug + dedupe + no-re-slug, nesting incl. orphan h3, minEntries, watch
re-collect (mutation → debounce → entries update), active fallback on
removal, onActive fires on change only, smooth vs reduced-motion scroll
call, collapse disclosure a11y (expanded state, Escape, outside click,
focus return), container-missing warn.

**e2e:** existing "On this page rail" block green against the dogfooded
component; `/components/toc` demo — entries render, click scrolls +
marks active, collapse demo operates at mobile viewport; sweep green.

### Out of Scope

- Framework navigation coupling (`$app/*`) — `watch` covers SPA
  navigation; no SvelteKit-specific code in the component.
- Rendering the rail's page-level positioning (sticky/fixed/gutter) —
  consumer layout concern, documented with a recipe.
- Collecting from multiple containers, virtual/overflow containers, or
  iframe content.
- svelte-toc API compatibility — this replaces it on the user's sites,
  it doesn't emulate it.
