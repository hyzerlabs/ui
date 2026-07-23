# Motion — token-bridged helpers on top of Svelte's built-ins

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) as pass/fail. Write scope: `src/lib/motion/**` (new)
> + specs, `src/lib/attachments/` (reveal), `package.json` (`./motion`
> export, svelte peer floor), `src/lib/exports.spec.ts`,
> `src/routes/foundation/motion/+page.svelte` (rebuild), and e2e
> additions. Runs after Toc (specs/38), before the audit (specs/40).

### Goal

The motion story today is six tokens, a sparse docs page whose demo bar
only travels half its track, and a disclaimer that reduced-motion is the
consumer's problem. Decided with the user (2026-07-22): ship a
`@hyzer-labs/ui/motion` module offering all four helper tiers — **token-
bridged transitions**, **JS easing/duration mirrors**, a **scroll-reveal
attachment**, and a **view-transition helper** — every one of them
reduced-motion-aware by default, so the disclaimer disappears. The docs
page is rebuilt around live demos (and the half-width bar bug dies).

Svelte provides the primitives (`svelte/transition`, `svelte/motion`,
`svelte/easing`, WAAPI); this module provides the *house defaults*: the
`--hz-duration-*` / `--hz-ease-*` tokens as the single timing vocabulary
across CSS, transitions, and script animation.

### Requirements

1. **R1 — Module + export.** `src/lib/motion/index.ts` exported as
   `./motion` (types + default conditions, mirroring `./utils`);
   `exports.spec.ts` pins it. Zero runtime dependencies; every entry
   point SSR-safe (importable server-side, no `window` at module scope).
   Raise the svelte peer floor to `^5.7.0` for `svelte/motion`'s
   `prefersReducedMotion` (greenfield; docs devDep already satisfies it).
2. **R2 — Token mirrors.** `durations = { fast: 150, base: 250, slow:
   400 }` (ms numbers) and easing exports derived from the **token
   metadata** (`src/lib/tokens`), not hand-copied — a parity spec fails
   if tokens and mirrors ever diverge. Easings ship in both forms:
   `easingCss.standard|in|out` (the exact `cubic-bezier(…)` strings for
   WAAPI/inline styles) and `easeStandard|easeIn|easeOut` — JS
   `(t: number) => number` cubic-bezier evaluators for Svelte
   transitions/`Tween`, unit-tested to match the CSS curves at sampled
   points (ε ≤ 0.001) and to satisfy f(0)=0, f(1)=1.
3. **R3 — Token-bridged transitions.** `fade`, `fly`, `slide`, `scale`
   with the `svelte/transition` signatures and semantics, defaulting
   `duration` to `durations.base` (`fade`: `fast`) and `easing` to the
   house curves (out for enter-ish defaults, standard elsewhere — pick
   once, document, test). All params overridable. Under
   `prefersReducedMotion.current` the returned config collapses to
   `duration: 0` — unless the consumer passes `essential: true` (motion
   that carries meaning, e.g. a focus-guiding movement). The flag exists
   on every helper in this spec. Reduced-motion state is read at
   transition run time (mid-session OS changes respected).
4. **R4 — Scroll-reveal attachment.** `reveal(options?)` — an
   attachment (the `lightboxGroup` precedent) that hides the element
   (opacity/translate via inline style, applied only on the client so
   no-JS/SSR readers always see content), then plays an entrance via
   WAAPI when the element first intersects. Options: `y`/`x` (px offset,
   default y: 16), `duration`/`easing` (token defaults), `delay`,
   `threshold`/`rootMargin` (IO passthrough), `once` (default true —
   `false` replays on re-entry), `essential`. Under reduced motion the
   element simply appears (no hidden state ever applied). A `stagger(ms)`
   option on a shared `revealGroup(options)` variant delays siblings by
   DOM order — one IO, no per-item config. Observers disconnect on
   detach and after `once` completes.
5. **R5 — View-transition helper.** `viewTransition(update: () => void |
   Promise<void>, options?)` wraps `document.startViewTransition`:
   unsupported browsers and reduced-motion run `update()` directly and
   resolve (no-op wrapper, same return shape — `{ finished: Promise }`
   at minimum). Options: `essential`. The module must NOT import
   `$app/*`; the docs page shows the three-line SvelteKit `onNavigate`
   integration as consumer code, and the reference theme gains nothing
   (root cross-fade timing is the browser default; customizing
   `::view-transition-*` is documented as consumer CSS with a
   token-based example).
6. **R6 — Motion page rebuilt.** `/foundation/motion` keeps the token
   tables (metadata-derived) and gains: a **fixed duration demo** — bars
   whose dot travels the **full track width** at every viewport size
   (the current `translateX(calc(100% + min(14rem, 40vw)))` half-travel
   bug is the user's explicit complaint; travel must be computed against
   the track, e.g. inset-based left/translate on the track's own width,
   verified visually at 375/768/1280); an **easing comparison** (same
   duration, the three curves side by side, plus plotted curve shapes);
   **transition demos** (toggle-driven fade/fly/slide/scale using the
   R3 helpers, code fences showing the one-line import swap from
   `svelte/transition`); a **reveal demo** (scrollable strip with
   staggered cards); a **view-transition section** (helper + `onNavigate`
   snippet; live demo only if it can no-op cleanly in unsupported
   browsers); and a **reduced-motion section** stating the new default —
   every helper collapses automatically, `essential` opts out — replacing
   the old disclaimer. Section h2s keep ids (TOC).
7. **R7 — Tests.** Unit: mirror parity vs token metadata; easing
   evaluator sampling; transition defaults + override passthrough +
   reduced-motion collapse + `essential` opt-out (mock
   `prefersReducedMotion`); reveal — hidden-state application, IO
   trigger, `once` semantics, replay when `once: false`, stagger order,
   reduced-motion shows immediately, observer cleanup; viewTransition —
   supported path calls `startViewTransition`, unsupported/reduced path
   runs update directly, return shape stable. `exports.spec.ts` pins
   `./motion`. e2e: motion page — full-travel assertion (dot's resolved
   transform/final position reaches track end within tolerance at two
   viewports), transition and reveal demos operate, sweep green.
8. **R8 — Docs cross-refs.** The theming docs' token pages link the
   motion module where durations/easings are discussed; the Carousel/
   Modal/Accordion docs (which animate) get a one-line pointer to the
   motion tokens they honor. No hooks.ts entry (not a component).

### Edge Cases & Error States

| Case | Expected |
| --- | --- |
| SSR import of any helper | No throw; reveal/viewTransition are inert server-side. |
| OS reduced-motion toggled mid-session | Next transition/reveal/viewTransition honors the new state (read at run time). |
| `essential: true` under reduced motion | Full animation plays. |
| Element with `reveal` removed before intersecting | Observer disconnected; no leak, no orphan style writes. |
| `revealGroup` children added after attach | Observed on next mutation only if spec'd — v1: children present at attach; documented limitation. |
| `startViewTransition` absent (Firefox/older) | `update()` runs; promise resolves; no error. |
| Overlapping viewTransition calls | Second call awaits/skips per platform behavior; helper never throws. |
| `duration: 0` passed explicitly | Respected (no minimum imposed). |

### Existing Code to Reuse

- `src/lib/attachments/lightboxGroup.*` — attachment shape, cleanup
  discipline, and its spec's IO-mocking approach.
- `src/lib/tokens` metadata (`motion.duration` / `motion.ease`) — the
  single source R2 derives from; the motion page already reads it.
- The theme's `@media (prefers-reduced-motion: reduce)` collapse and the
  docs shell's global reduced-motion guard stay as-is — this module is
  the script-side counterpart, not a replacement.

### Test Plan

Covered per-requirement in R7; the reviewer additionally verifies the
half-width bar bug is actually gone by inspecting the rendered demo at
375px and 1280px (the regression is visual — the assertion in e2e must
measure, not trust class names).

### Out of Scope

- Spring/inertia presets over `svelte/motion`'s `Spring` (Svelte's API
  is already ergonomic; tokens don't map to physics).
- FLIP/list-reorder helpers beyond Svelte's `animate:flip`.
- Orchestration/timeline APIs, gesture-driven motion, Motion One or any
  dependency.
- Retrofitting existing components to the new helpers (they animate via
  theme CSS on the same tokens; the audit may add pointers, specs/40).

### Amendments

- **2026-07-22 (audit, user request):** `reveal`/`revealGroup` gain an
  `effect: 'fade' | 'fly' | 'slide' | 'scale'` option (default `'fly'`,
  the prior behavior) plus `axis` and `start`, mirroring the transition
  family 1:1. `slide` expands from the center line of `axis` via
  clip-path — not a layout collapse, the element keeps its box so
  SSR/no-JS renders stay identical (user decision: center-out). `scale`
  grows from `start`, default 0 like the scale transition. One effect
  styles a whole group; `stagger` composes with all of them. Covered in
  reveal.svelte.spec.ts; the motion page demos the four styles in the
  same order as the transition tabs.

- **2026-07-22 (audit, user decision):** duration tokens retuned — `fast:
  250`, `base: 400`, `slow: 550` (ms; R2's documented `150/250/400`
  superseded). Metadata is the source; mirrors, generated sheets, theme
  fallbacks, and the literal-value specs all updated together.
