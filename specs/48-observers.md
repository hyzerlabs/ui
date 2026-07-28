# Observers — first-class Svelte attachments over the platform observer APIs

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) as pass/fail. Write scope: `src/lib/observers/**` (new)
> + specs, `package.json` (`./observers` export), `src/lib/exports.spec.ts`,
> `src/lib/components/Toc.svelte` (R9 refactor), and
> `src/routes/foundation/observers/+page.svelte` (new docs page) plus any
> docs cross-refs. Sits alongside `./motion` (specs/39); mirrors its module
> shape, its reduced-motion discipline, and its SSR-safe guarantees.

### Goal

Ship `@hyzer-labs/ui/observers`: three reduced-motion-neutral, SSR-safe
Svelte **attachments** — `intersect` (IntersectionObserver), `resize`
(ResizeObserver), `mutate` (MutationObserver) — that create their observer
on attach, observe the attached node, and disconnect on teardown, mirroring
`revealGroup`'s create → observe → disconnect shape exactly; plus
`announce`, a lazily-created, `.sr-only` live-region helper for screen-reader
announcements that pairs naturally with an observer callback. The three
attachments give consumers (and the library's own internals) one blessed,
leak-free way to reach for the platform observers instead of hand-rolling the
setup/teardown dance in an ad-hoc `$effect` every time — Toc is refactored
onto `mutate` as the first internal dogfood.

### Requirements

1. **R1 — Module + export.** New `src/lib/observers/index.ts` exported as the
   `./observers` subpath in `package.json` (`types` + `default` conditions,
   mirroring `./motion` and `./utils` — no `svelte` condition; there is no
   `.svelte` file in the module). Zero runtime dependencies. SSR-safe: the
   module is importable server-side, and no `window`/`document`/observer
   global is touched at module scope — only inside function bodies, each of
   which guards `typeof document === 'undefined'` (the `revealGroup`
   precedent). `exports.spec.ts` pins the subpath and its public surface (R8).

2. **R2 — `intersect` attachment.** Signature:

   ```ts
   type IntersectCallback = (
     entry: IntersectionObserverEntry,
     observer: IntersectionObserver
   ) => void;
   interface IntersectOptions extends IntersectionObserverInit {
     /** Disconnect after the first *intersecting* entry. Default false. */
     once?: boolean;
   }
   function intersect(
     callback: IntersectCallback,
     options?: IntersectOptions
   ): (node: Element) => () => void;
   ```

   Usage: `{@attach intersect((entry) => …, { rootMargin: '200px' })}`.
   Creates one `IntersectionObserver` with the native `root`/`rootMargin`/
   `threshold` passed straight through, `observe(node)`, and invokes
   `callback(entry, observer)` **once per entry** (the observer reports a
   single target, so exactly one entry per delivery). Because IO fires an
   initial delivery on observe, the callback may receive a non-intersecting
   entry first — documented, not filtered. `once: true` disconnects
   immediately after the first entry whose `isIntersecting` is true (the
   `reveal` precedent), never on the initial non-intersecting report.
   Teardown disconnects the observer.

3. **R3 — `resize` attachment.** Signature:

   ```ts
   type ResizeCallback = (
     entry: ResizeObserverEntry,
     observer: ResizeObserver
   ) => void;
   interface ResizeOptions {
     /** Native ResizeObserver box model. Passed to observe(). */
     box?: ResizeObserverBoxOptions;
     /** Disconnect after the first callback delivery. Default false. */
     once?: boolean;
   }
   function resize(
     callback: ResizeCallback,
     options?: ResizeOptions
   ): (node: Element) => () => void;
   ```

   Creates one `ResizeObserver`, calls `observe(node, { box })` (omitting
   `box` when undefined), and invokes `callback(entry, observer)` once per
   entry (single observed target → one entry per delivery). `once: true`
   disconnects after the first delivery. Teardown disconnects.

4. **R4 — `mutate` attachment.** Signature:

   ```ts
   type MutateCallback = (
     records: MutationRecord[],
     observer: MutationObserver
   ) => void;
   interface MutateOptions extends MutationObserverInit {
     /** Disconnect after the first callback delivery. Default false. */
     once?: boolean;
     /** Coalesce bursts: fire once, `ms` after the last mutation, with the
      *  accumulated records. Default 0 (fire synchronously per delivery). */
     debounce?: number;
   }
   function mutate(
     callback: MutateCallback,
     options?: MutateOptions
   ): (node: Element) => () => void;
   ```

   Unlike IO/RO, the callback receives the **records array + observer**
   (`MutationObserver`'s native shape), because a mutation delivery is
   inherently multi-record. `MutationObserverInit` (`childList`, `subtree`,
   `attributes`, `characterData`, `attributeFilter`, …) passes straight to
   `observe(node, init)`. When `debounce > 0`, deliveries are coalesced: a
   `setTimeout(ms)` is armed/re-armed on each raw delivery, and the callback
   fires once after the quiet period with **all** records accumulated across
   the burst (the Toc `120ms` precedent). Teardown disconnects the observer
   **and** clears any pending debounce timer (no callback fires after
   teardown). `once` with `debounce` fires the coalesced callback once, then
   disconnects.

5. **R5 — Shared internal factory.** A single internal helper (not exported,
   not in the public types) DRYs the create → `observe` → disconnect skeleton
   and the `typeof document` SSR guard across the three wrappers. Per-observer
   nuances that differ (intersect's `isIntersecting`-gated `once`, resize's
   `box` observe-arg, mutate's records-shaped callback and `debounce` timer)
   live in each wrapper, not the factory. Form is **attachments only** — no
   component, Svelte action, or plain-function variant ships.

6. **R6 — `announce` live-region helper.** Signature:

   ```ts
   function announce(
     message: string,
     options?: { assertive?: boolean }
   ): void;
   ```

   SSR-safe: no-op when `typeof document === 'undefined'`. On first client
   call it lazily creates and appends to `document.body` two visually-hidden
   (`class="sr-only"`, the `src/lib/theme/base.css` utility) regions, each
   tagged `data-hz-live-region`: one `aria-live="polite" aria-atomic="true"`,
   one `aria-live="assertive" aria-atomic="true"`. Both are reused across all
   subsequent calls (module-scoped singletons). The getter is **self-healing**
   — if a cached region has been detached from the DOM (e.g. a test removed
   it, or a full body swap), it is transparently recreated, so no public
   teardown API is needed. Politeness: `assertive: true` writes to the
   assertive region, otherwise the polite one. Re-announce of identical text:
   because screen readers may not re-read an unchanged `textContent`, each
   write clears the region then sets the message on the next animation frame
   (the clear-then-set toggle), forcing re-announcement of an intentional
   repeat. Spam guard: multiple calls to the same politeness level within one
   frame collapse to the last message (only the final write is scheduled).
   The helper never moves focus, adds no `role`, and traps nothing. It is
   usable standalone and inside any observer callback (e.g.
   `intersect((e) => { if (e.isIntersecting) { load(); announce('Loaded 20
   more results'); } })`).

7. **R7 — Reduced motion is composed, not reinvented.** The three attachments
   are deliberately **motion-agnostic** — an observer firing is not itself
   motion (a consumer may use `intersect` for lazy-loading, infinite scroll,
   or analytics, none of which should be suppressed under reduced motion), so
   none of them read `prefersReducedMotion`. The house reduced-motion story
   stays exactly where it is: `./motion`'s `reveal`/`revealGroup` remain the
   batteries-included, reduced-motion-aware IntersectionObserver consumers
   (they already gate on `prefersReducedMotion.current` and are **not**
   refactored onto `intersect` — see R10). For consumers building their own
   observer-driven motion, the docs (R11) show the one blessed pattern: guard
   the motion side-effect inside the callback with `prefersReducedMotion`
   from `svelte/motion` — the same mechanism the motion module and Toc
   already use. The observers module ships no reduced-motion helper of its
   own; there is exactly one source of truth (`svelte/motion`).

8. **R8 — Exports wiring + guard.** `package.json` `exports` gains
   `"./observers": { "types": "./dist/observers/index.d.ts", "default":
   "./dist/observers/index.js" }`, placed adjacent to `./motion`.
   `exports.spec.ts` gains: (a) an `exports map contains all required subpath
   keys` assertion for `./observers`; and (b) a `$lib/observers` case
   asserting `typeof mod.intersect === 'function'`, `typeof mod.resize ===
   'function'`, `typeof mod.mutate === 'function'`, and `typeof mod.announce
   === 'function'`. `announce` is exported **only** from `./observers` (its
   natural pairing home), not duplicated into `./utils`, to keep a single
   source of truth; the docs cross-link it from the utilities/a11y material.

9. **R9 — Toc dogfood: refactor onto `mutate`.** Replace Toc's hand-rolled
   `MutationObserver` `$effect` (`src/lib/components/Toc.svelte`, the
   `watch`-guarded effect: `childList + subtree`, `setTimeout(collect, 120)`,
   `observer.disconnect()` + `clearTimeout` teardown) with
   `mutate(() => collect(), { childList: true, subtree: true, debounce: 120 })`
   applied to the resolved container. Because Toc resolves its container
   imperatively (it may be a selector string, not the component's own node),
   the attachment is invoked directly on the resolved element inside the
   existing effect rather than via `{@attach}` markup — the factory returns a
   plain `(node) => cleanup`, so this is a supported call form. **Must not
   regress:** the `120ms` debounce window, the `watch={false}` opt-out (no
   observer created), the null-container early return, and full teardown
   (timer cleared, observer disconnected) on effect re-run/destroy. The Toc
   test suite stays green with no behavioral change.

10. **R10 — `reveal` refactored onto `intersect` (done, was deferred).**
    `reveal`/`revealGroup` now delegate their IntersectionObserver plumbing
    (create → observe → disconnect, the SSR/absent-global guards, and the
    `once`-disconnect-after-first-*intersecting*-entry semantics) to
    `intersect`. The motion-specific logic stays in `src/lib/motion/reveal.ts`:
    the child snapshot taken once at attach, per-child `stagger` offsets, the
    `once`-vs-replay hidden-state reset on viewport exit, and the WAAPI
    finish/clear cycle. The pre-existing `reveal.svelte.spec.ts` (client) and
    `reveal.spec.ts` (server/SSR) stay green with no behavioral change — the
    public `@hyzer-labs/ui/motion` surface is unchanged. Originally deferred in
    this spec (marginal DRY win vs. regression risk); done as the anticipated
    follow-up once `intersect` had settled.

11. **R11 — Docs: own Foundation page.** New `/foundation/observers` page
    (parallel to `/foundation/motion`, using the standard Foundation/docs
    page pattern — Example blocks with reactive code and code fences). One
    realistic, live example per attachment: `intersect` — a "load more"
    sentinel or lazy-reveal count; `resize` — an element reporting its own
    live width/height; `mutate` — a node reporting child-count changes. Plus
    an `announce` example wired to one of them (announce on intersect), and
    the reduced-motion compose pattern from R7 shown as a code fence. Section
    `h2`s keep ids for the TOC. The Motion page gains a one-line pointer:
    scroll-driven motion lives in `./motion`; the raw observers live here. No
    `hooks.ts` entry (these are primitives, not components). Docs copy is
    consumer-facing: no spec/R-number/test-gate citations.

12. **R12 — Types + tests.** See Test Plan. Public signatures typed exactly
    as R2–R6. The public attachment return type may be expressed as
    `import('svelte/attachments').Attachment<Element>` (the canonical
    `{@attach}` shape) as long as it stays structurally `(node: Element) =>
    () => void`, matching how `reveal` is consumed.

### Responsive Behavior

The three attachments and `announce` render **no DOM of their own** (the live
region is `.sr-only` — off-screen and zero-size at every breakpoint), so they
have no intrinsic responsive layout. Two notes:

- **Consumer breakpoint tuning.** `intersect`'s `rootMargin`/`threshold` and
  `resize`'s `box` are the knobs a consumer uses to change behavior across
  viewports; the primitive passes them through unchanged and imposes no
  breakpoint logic of its own.
- **Docs page (R11).** Inherits the docs shell's responsive layout (mobile
  `<640`, tablet `640–1024`, desktop `>1024`); the live examples must remain
  legible and operable at all three — the `resize` demo in particular should
  visibly update its reported dimensions as the pane reflows. No example
  hides, reflows, or changes interaction pattern in a way that needs
  per-breakpoint description beyond the shell's own behavior.

### Accessibility

- **SSR-safe / graceful degradation (correctness floor).** Attachments are
  client-only effects: every factory returns a no-op cleanup and does no work
  when `typeof document === 'undefined'`. Content is fully present without JS
  (attachments never run pre-hydration; nothing is hidden or gated on them —
  contrast `reveal`, which hides content, and is therefore not part of this
  module). Teardown is guaranteed: every observer is `disconnect()`-ed on
  detach/teardown, every `mutate` debounce timer is cleared, and no callback
  fires after teardown (no leaked observers, no stale callbacks).
- **`announce` semantics.** Polite region for status/progress
  (`aria-live="polite"`), assertive region for interruptions
  (`aria-live="assertive"`), both `aria-atomic="true"` so the whole message
  is read. Regions are `.sr-only` (visually hidden, still in the a11y tree),
  never focused, add no landmark/role, and do not affect tab order. Identical
  consecutive messages are re-announced via the clear-then-set toggle;
  same-frame spam collapses to the final message.
- **Reduced motion.** Composed from `svelte/motion`'s `prefersReducedMotion`,
  not reinvented (R7). The raw observers do not suppress themselves; the
  motion-suppression story lives in `./motion` and in the documented callback
  guard pattern.
- **Keyboard / focus.** N/A — no interactive UI is introduced. `announce`
  never steals focus; observers never move it.
- **Color contrast.** N/A — no visible surface (the live region is
  off-screen; the docs demos reuse existing themed components).

### Edge Cases & Error States

| Case | Expected |
| --- | --- |
| SSR import / invocation of any export | No throw; attachments return a no-op cleanup and do no work; `announce` no-ops. |
| Node detached before `intersect` ever fires an intersecting entry | Observer `disconnect()`-ed on teardown; no leak, no callback. |
| Options object identity changes | The attachment re-runs (Svelte re-invokes `{@attach}` when the factory's argument changes): old observer disconnected in cleanup, new one created with the new options. Documented as expected, not a bug. |
| Multiple attachments on one node (e.g. `intersect` + `resize`) | Independent observers, independent teardown; no interference. |
| `IntersectionObserver`/`ResizeObserver`/`MutationObserver` absent (very old browser) | Attachment no-ops gracefully (guarded like the SSR path — `typeof <Observer> === 'undefined'` returns a no-op cleanup); content stays present and usable; a dev-only `console.warn` may note the missing global. |
| OS reduced-motion toggled mid-session | Observers are unaffected (motion-agnostic). Motion built on a callback re-reads `prefersReducedMotion.current` at fire time (the documented pattern), so the next fire honors the new state. |
| `mutate` with `debounce` torn down with a timer pending | Timer cleared in cleanup; the pending callback never fires. |
| `announce` called before `document.body` exists / after its region node is removed | Lazy getter self-heals — (re)creates the regions on demand; never throws. |
| `announce` spammed within one frame | Collapses to the last message per politeness level (only the final write is scheduled). |
| `announce` same message twice across frames | Re-announced via clear-then-set toggle (screen reader reads it again). |
| `intersect` on an element that never intersects | Callback receives only the initial (non-intersecting) delivery; never fires an intersecting entry; `once` never disconnects on its own; teardown still disconnects cleanly. |
| `mutate` called without any `MutationObserverInit` fields | The native `observe` throws per platform; the wrapper does not swallow it (a genuine misuse, surfaced to the developer) — documented in the option's JSDoc. |

### Existing Code to Reuse

- `src/lib/motion/reveal.ts` — the exact attachment shape to mirror: factory
  returns `(node: Element) => () => void`, `typeof document` SSR guard, create
  → `observe` → `disconnect()` in the returned cleanup. Copy the discipline,
  not the motion logic.
- `src/lib/motion/reveal.spec.ts` — the SSR/no-`document` server-project test
  pattern (real guard, no mock) to mirror for the observers' inert-server
  tests.
- `src/lib/motion/reveal.svelte.spec.ts` — the "substitute the platform
  observer at the global with a small controllable Fake, trigger it by hand"
  approach (its `FakeIntersectionObserver` + `vi.mock('svelte/motion')`
  reduced-motion fake). Reuse this pattern for `intersect`; write the
  analogous `FakeResizeObserver`/`FakeMutationObserver`.
- `src/lib/components/Toc.svelte` — the `MutationObserver` effect being
  replaced in R9 (the `120ms` debounce, `childList + subtree`, teardown
  discipline to preserve).
- `src/lib/theme/base.css` `.sr-only` — the visually-hidden utility the
  `announce` regions use (do not re-author the rule; emit the class).
- `src/lib/utils` `uid` — if the live regions or docs demos need stable ids.
- `src/lib/exports.spec.ts` — the subpath-guard pattern (the `$lib/motion`
  case and the `exports map contains all required subpath keys` block) to
  extend for `./observers`.
- `svelte/motion` `prefersReducedMotion` — the single reduced-motion source
  (R7); imported by the docs example, not by the module.

### Test Plan

Framework/runners already in the repo: **Vitest** with two projects
(`client` — a real Chromium via the `@vitest/browser-playwright` provider,
matching `src/**/*.svelte.{test,spec}.ts`; `server` — `environment: 'node'`,
no DOM, matching the other `*.spec.ts`), and **Playwright** for e2e.

> Note on the observer globals: the `client` project runs in a **real
> browser**, so `IntersectionObserver`/`ResizeObserver`/`MutationObserver`
> genuinely exist there (this is not jsdom). Behavioral unit tests still
> substitute controllable Fakes at the global for **determinism** — real IO
> would need an actual scroll/layout, real RO an actual resize — exactly as
> `reveal.svelte.spec.ts` does. The `server` project genuinely lacks the
> globals and `document`, which is what exercises the SSR/absent-global
> guards for real.

**Unit — `observers.svelte.spec.ts` (client project):**

- `intersect`: creates one IO with the native options passed through
  (`root`/`rootMargin`/`threshold`); invokes `callback(entry, observer)` on
  trigger; `once: true` disconnects after the first *intersecting* entry but
  **not** after an initial non-intersecting delivery; teardown calls
  `disconnect()`; absent-`IntersectionObserver` global → no-op cleanup, no
  throw.
- `resize`: creates one RO; `observe` called with `{ box }` when supplied and
  without it when not; `callback(entry, observer)` on trigger; `once: true`
  disconnects after first delivery; teardown disconnects.
- `mutate`: creates one MO; `observe` called with the `MutationObserverInit`
  passthrough; `callback(records, observer)` receives the records array;
  `debounce: N` coalesces a burst into a single callback carrying all
  accumulated records after the quiet window (fake timers); teardown clears a
  pending debounce timer **and** disconnects (assert the coalesced callback
  never fires after teardown); `once` disconnects after the (coalesced)
  delivery.
- Multiple attachments on one node: independent observers, independent
  teardown.
- Options-change re-run: a fresh options object yields a new observer and
  disconnects the previous (assert old instance `disconnected === true`).

**Unit — `announce.svelte.spec.ts` (client project):**

- First call lazily appends exactly two `[data-hz-live-region]` `.sr-only`
  nodes with correct `aria-live` (`polite`/`assertive`) + `aria-atomic`.
- Message lands in the polite region by default, assertive region under
  `{ assertive: true }` (assert `textContent` after the scheduled frame).
- Repeated identical message across frames is re-announced (region is cleared
  then re-set — assert the toggle, e.g. empty-then-filled across frames).
- Same-frame spam collapses to the final message.
- Self-heal: after removing the region nodes, a subsequent `announce`
  recreates them.
- Reset/isolation via `afterEach` removing `[data-hz-live-region]` (the
  self-healing getter recreates on the next test).

**Unit — `observers.spec.ts` (server project, no DOM):**

- Each of `intersect`, `resize`, `mutate` returns a factory; invoking the
  returned attachment with a stub node does no work and returns a no-op
  cleanup that does not throw (mirrors `reveal.spec.ts`).
- `announce('x')` no-ops without `document` and does not throw.

**Unit — `exports.spec.ts` additions (server project):**

- `./observers` present in the exports-map keys assertion.
- `$lib/observers` resolves and exposes `intersect`/`resize`/`mutate`/
  `announce` as functions.

**Integration — Toc (R9), existing Toc suite:**

- The Toc suite stays green after the `mutate` refactor; specifically the
  `watch` re-collection on container mutation still fires (after the `120ms`
  debounce), `watch={false}` creates no observer, and teardown leaks nothing
  (no callback after unmount).

**e2e — `/foundation/observers` (Playwright):**

- Page renders; each of the four examples is present and operable; the
  `intersect` demo updates on scroll-into-view; the `resize` demo reports a
  changed dimension after a viewport resize; sweep green. (The `announce`
  live region is `.sr-only`; assert its presence in the DOM and its
  `aria-live`, not a visual.)

### Out of Scope

- `PerformanceObserver`, `ReportingObserver`, and any observer beyond the
  three named.
- A generic observer registry, a unified "observe anything" dispatcher, or a
  store/rune wrapper over observer state (attachments only, per R5).
- Scroll-position/scroll-direction utilities, sticky/pin helpers, or any
  scroll math beyond IntersectionObserver passthrough (Toc keeps its own
  scroll-spy; this module does not absorb it).
- (Done in R10 — no longer a non-goal: `reveal`/`revealGroup` now delegate to
  `intersect` internally.)
- A component, Svelte action, or plain-function form of any observer (R5).
- A reduced-motion helper or any duplication of `svelte/motion`'s
  `prefersReducedMotion` (R7).
- A public teardown/reset API for `announce` (the self-healing lazy getter
  removes the need; R6).
- Duplicating `announce` into `./utils` or a new `./a11y` subpath (single
  home in `./observers`; R8).
