# Loading & Skeleton — loading indicator and placeholder

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. Write scope for the Builder is
> the library source (`src/lib/**`) plus the docs additions named in R15–R18:
> two components (`Loading.svelte`, `Skeleton.svelte` + specs), two theme
> sheets (`loading.css`, `skeleton.css` + `theme.css` registration), a small
> `button.css` reduced-motion change (R19), the barrel + `exports.spec.ts`, two
> `src/docs/hooks.ts` entries, two `src/docs/data/*.ts` modules + docs pages,
> and two `manifest.ts` entries.
>
> **Transform note:** an earlier draft of this component was named `Progress`.
> It is being renamed and reframed to `Loading` (see the rename touch-list in
> "Context & Conventions"). The Builder executes this as a `git mv` of the
> existing files plus the additions here — the spec below describes the **final
> `Loading` design**, not a from-scratch build.

### Goal

Ship two headless Svelte 5 components in the Components → **Common** group:

- **Loading** — an accessible loading indicator. It is **fundamentally
  indeterminate**: three variants (`spinner`, `dots`, `bar`) that say "something
  is happening" without knowing how far along it is — the common case, and where
  most of the component lives. Passing a `value` **progressively enhances** the
  linear `bar` into a determinate progress bar (native `<progress value max>`)
  **and** the `spinner` into a determinate **circular ring** (an SVG arc that
  fills to `value / max`). So: no `value` → a bare loading indicator; `value`
  present → determinate progress, linear or circular. `dots` stays
  indeterminate-only. Native `<progress>` carries the semantics for the bar; the
  reference theme paints all variants.
- **Skeleton** — a decorative placeholder for content that has not loaded yet.
  Deliberately flexible: a small set of shape variants (text lines, circle,
  rectangle, fill-the-box) composable into any card-like placeholder, plus
  free width/height/radius overrides, with a shimmer/pulse animation that goes
  still under reduced motion.

The two are designed to pair: **Loading announces** (labelled, `role=progressbar`,
`aria-busy`), **Skeleton decorates** (`aria-hidden`). Together they cover the
"something is loading" surface without leaving screen-reader users in silence.

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. Two files:
  `src/lib/components/Loading.svelte` and
  `src/lib/components/Skeleton.svelte`, both exported from the barrel; both
  smoke-asserted in `exports.spec.ts`.
- **Rename touch-list (Progress → Loading).** The Builder transforms the
  existing `Progress` implementation into `Loading`. Skeleton is **unchanged**.
  Every one of these renames is in scope:

  | Kind | Was | Now |
  | --- | --- | --- |
  | Component file | `src/lib/components/Progress.svelte` | `src/lib/components/Loading.svelte` |
  | Component spec | `Progress.svelte.spec.ts` | `Loading.svelte.spec.ts` |
  | Theme sheet | `src/lib/theme/components/progress.css` | `src/lib/theme/components/loading.css` |
  | `theme.css` import | `./components/progress.css` | `./components/loading.css` |
  | Data module | `src/docs/data/progress.ts` (`progressDoc`) | `src/docs/data/loading.ts` (`loadingDoc`) |
  | Docs route | `/components/progress` | `/components/loading` |
  | Manifest label / href | `Progress` / `/components/progress` | `Loading` / `/components/loading` |
  | Barrel export | `Progress` | `Loading` |
  | `hooks.ts` key | `Progress` | `Loading` |
  | Root class | `.hz-progress` | `.hz-loading` |
  | Part classes | `.hz-progress-bar` / `-value` / `-spinner` / `-dots` / `-dot` | `.hz-loading-bar` / `-value` / `-spinner` / `-dots` / `-dot` (+ new `-ring` / `-ring-track` / `-ring-fill`, R3) |
  | Custom props | `--hz-progress-fill` / `-track` / `-size` | `--hz-loading-fill` / `-track` / `-size` (+ new `--hz-loading-speed`, `--hz-loading-ease`, `--hz-loading-ring-width`, R3/R8) |

  The `data-*` hooks (`data-intent`, `data-size`, `data-variant`,
  `data-indeterminate`) are generic attribute names, not prefixed — they stay
  as-is.
- **Intent is the shared `Intent` type** (`$lib/types`), the open registry that
  includes `neutral`. Do **not** invent a per-component intent union (the
  Banner/Button precedent).
- **Reuse the Button spinner, don't invent a second one.** Button already
  ships a loading spinner: `IconLoader` (`$lib/icons/generated/loader.svelte`)
  rotated by `@keyframes hz-spin` in `button.css` (see
  `src/lib/components/Button.svelte` lines 106–109 / `button.css` lines
  180–193). Loading's **indeterminate** `spinner` renders that same
  `IconLoader` — **no new spinner icon or component.** (The *determinate*
  spinner is a different thing — a static SVG ring, R3.)
- **Reuse the Table skeleton shimmer recipe.** `table.css` (lines 142–168)
  already ships a shimmer bar gated behind
  `@media (prefers-reduced-motion: no-preference)` with an animated
  `background-position` gradient. Skeleton generalises that exact recipe into a
  reusable component; Table's `.hz-table-skeleton-bar` is left as-is (it
  predates this component and is internal to Table).
- **Reduced motion — a deliberate split, NOT the blanket house rule.** The
  library's general posture (and the motion module's default, specs/39 R3) is
  that animation collapses to nothing under `prefers-reduced-motion: reduce`.
  **Indeterminate Loading is an explicit, documented exception**, because motion
  *is* its message: a frozen spinner/bar/dots reads as *stalled or broken*,
  which is worse for every user. So under reduced motion an indeterminate
  Loading does **not** halt — it runs a **slower** version of each animation
  (R8), a minimal "still working" cue. This is the motion module's
  `essential: true` principle (motion that carries meaning is exempt from
  reduce-to-zero, specs/39 R3). The vestibular concern is met by the slowness
  and, for the bar, by softening its amplitude to a gentle pulse (R8).
  **Determinate Loading (the linear bar with a `value`, and the circular ring)
  is a STATIC arc/fill — no animation at all — so the exception does not touch
  it.** **Skeleton is the exception-to-the-exception**: its shimmer/pulse
  **does** go fully still under reduced motion (R12/R14), because the
  placeholder *shape* already carries the cue. Button's loading spinner follows
  indeterminate Loading (slows, does not stop — R19). The
  `@media (prefers-reduced-motion: no-preference)` wrapper is still the house
  convention for the many components that DO halt (table.css, carousel.css,
  accordion.css) — indeterminate Loading and Button's spinner are the named
  exceptions.
- **Structural CSS in the component, all colour/animation in the theme** — the
  Banner split. The components stamp classes, `data-*`, and the live-fraction
  inline value (the ring's `stroke-dashoffset`, the Slider-fill precedent); the
  reference theme sheets own fill colours, track colours, sizes, and keyframes.
- Mirror existing patterns: `$props()` destructuring, `cx` for the root class,
  `...rest`-first spread on the root so managed attributes win, dev-only
  `console.warn` for misuse (the Button icon-only / Table caption precedent,
  guarded by `import.meta.env.DEV` and `untrack`).

### Decisions & rationale (settled in review — do not re-litigate)

1. **CONFIRMED — Loading is the base; determinate is the progressive
   enhancement, now for TWO variants.** `value` omitted → an indeterminate
   loading indicator (any of `spinner`/`dots`/`bar`). `value: number` present →
   the `bar` becomes a determinate native `<progress value max>` **and** the
   `spinner` becomes a determinate **circular ring** (R3). No separate
   `indeterminate` boolean; the presence of `value` is the single switch
   (matching the native `<progress>` contract for the bar). `dots` is
   indeterminate-only — it expresses "busy", not "how far".
2. **CONFIRMED — `intent` defaults to `'primary'`, not `'neutral'`** (unlike
   Badge/Banner). A loading indicator's fill/glyph is an accent by nature;
   neutral on a neutral track barely reads. Documented; overridable.
3. **CONFIRMED — Skeleton shape = `variant` preset + free
   `width`/`height`/`rounded` overrides (both); no card-skeleton prop.**
   `variant` picks a sensible shape and its default dimensions; the dimension
   props override for arbitrary shapes. Card-like placeholders are **composed**
   from multiple Skeletons — the docs ship worked card / table / prose examples
   (R17), not a preset prop.
4. **CONFIRMED — spinner/loader keyframes stay co-located per theme sheet, NOT
   a shared partial.** `loading.css` declares its own `@keyframes hz-spin` (and
   its dots / sweep / pulse keyframes), alongside Button's existing copy in
   `button.css`. The instinct to "share it to shrink the bundle / help
   tree-shaking" does not apply, because **CSS is not tree-shaken the way JS
   is**: importing a stylesheet pulls in *all* of its rules. Recorded so it is
   not reopened:
   - The reference theme aggregates **every** component sheet via `theme.css`
     (the common path). A build-time CSS minifier dedupes the two identical
     `@keyframes hz-spin` blocks there — the aggregate ships one copy.
   - A shared partial would either couple `loading.css` to a third file,
     breaking the standalone single-sheet import contract
     (`import '@hyzer-labs/ui/theme/components/loading.css'` alone must work,
     exactly as `button.css` alone works — `theme.css` line 11), or add an
     `@import`, a network round-trip in the cherry-pick case.
   - The duplicate is **~one rule** (a 3-line `@keyframes`). Negligible.
   The "reuse" the brief asked for is the `IconLoader` glyph — one spinner icon,
   not one keyframes definition. Self-containment wins.
5. **CONFIRMED (in scope) — Button's loading spinner is brought into line
   (R19).** For consistency with indeterminate Loading's reduced-motion
   behaviour (Decision 9), Button's spinner is changed to **slow, not halt**,
   under reduced motion, recorded as an amendment to the Button spec
   (`specs/01-button.md`).
6. **CONFIRMED — `dots` variant, indeterminate-only.** An ellipsis-style
   three-dot indeterminate loader, alongside `spinner` and `bar`. A `value`
   passed to `dots` is ignored (dev-warn) — dots cannot express "how far".
   (The `spinner` no longer carries this restriction — a value now makes it a
   ring, R3.) Its a11y matches an indeterminate progressbar
   (`role="progressbar"` + `aria-busy`, dots decorative/`aria-hidden`,
   accessible name from `label`), and it slows (not stops) under reduced motion
   (R5/R8/R9).
7. **CONFIRMED — indeterminate animation timing is two motion-token-based
   hooks that pair.** `--hz-loading-speed` (the **duration**) and
   `--hz-loading-ease` (the **timing function**) drive the indeterminate
   animations, each defaulting to a value derived from the motion-token scale
   (`--hz-duration-*` / `--hz-ease-*`) and overridable. **Per-variant nuance —
   the indeterminate spinner spin AND the bar sweep are always `linear`:** a
   spin — or a looping highlight sweep — that eases in and out on every cycle
   looks broken (it decelerates to a stop at the loop seam and restarts: a
   visible hiccup), so both ignore `--hz-loading-ease` and stay constant-speed.
   The ease hook applies only to the **dots cycle** (a pulse, not a traveling
   loop, so an ease reads cleanly). (Determinate variants have no animation, so
   timing hooks are moot for them.) *(Amended 2026-07-27 from live feedback: the
   bar sweep was originally specced to pick up the ease hook; a looping sweep
   under ease-in-out hiccups, so it now runs linear like the spinner.)*
8. **CONFIRMED — calmer defaults, twice retuned from live feedback.** (a) The
   indeterminate **bar** sweep runs `linear` (see R7 amendment) at
   `calc(var(--hz-loading-speed) * 1.6)` over gentle low-contrast keyframes — a
   calm pulse of light, not a fast scanning bar. Its gradient tile is track at
   both edges and `background-size: 200%`, and the sweep shifts
   `background-position` by exactly one tile (100% → -100%) so the loop is
   pixel-seamless (no positional jump at the wrap). (b) The base
   **`--hz-loading-speed` default is substantially slower**
   than the first draft: **`calc(var(--hz-duration-base, 400ms) * 6)` = 2.4s**
   (spinner spin & dots), so the bar sweep lands at ≈ 3.84s — a clearly
   ambient/calm pace. Tunable via the hook; this is only the default (R8).
9. **CONFIRMED — reduced motion SLOWS indeterminate Loading, it does NOT halt
   it, and the factor is re-picked against the slower base.** Under
   `prefers-reduced-motion: reduce` the indeterminate spinner, dots, and bar
   keep animating at a slower cadence and the bar softens to a low-amplitude
   pulse. Because the base is now 2.4s, the old ≈6× factor (≈14s) would look
   frozen — so the reduced-motion multiplier is **2×**, giving ≈ **4.8s**
   (slow-but-perceptibly-moving), not more (R8). Determinate Loading (bar with a
   value, ring) is static, so this is moot for it. **Skeleton is NOT part of
   this exception** (R12/R14). Button's loading spinner joins indeterminate
   Loading in slowing (R19).

### API sketch (normative)

```svelte
<!-- Indeterminate loading — the base cases -->
<Loading label="Loading" />                     <!-- default: bar, calm indeterminate sweep -->
<Loading variant="spinner" label="Saving" />    <!-- IconLoader spin -->
<Loading variant="dots" label="Loading" />

<!-- Progressive enhancement: a value turns the bar determinate (linear) … -->
<Loading value={62} label="Uploading photos" showValue />
<!-- … and the spinner determinate (circular ring), % centered in the ring -->
<Loading variant="spinner" value={62} label="Uploading photos" showValue />

<!-- Non-percentage units via format (linear or circular) -->
<Loading value={3} max={5} label="Import"
  format={(v, max) => `${v} of ${max} files`} showValue />

<!-- Retune indeterminate timing via the paired speed + ease hooks -->
<Loading variant="spinner" label="Saving"
  style="--hz-loading-speed: 1.5s" />           <!-- spinner spin ignores ease; stays linear -->
<Loading label="Loading" style="--hz-loading-speed: 3s" /> <!-- bar sweep is always linear (seamless loop) -->
<Loading variant="dots" label="Loading"
  style="--hz-loading-speed: 1.2s; --hz-loading-ease: ease-in-out" /> <!-- only dots pick up the ease -->
```

```svelte
<!-- Skeleton: three text lines, last one short -->
<Skeleton variant="text" lines={3} />

<!-- Avatar + heading + paragraph card placeholder (composition) -->
<Cluster>
  <Skeleton variant="circle" width="2.5rem" />
  <Stack>
    <Skeleton variant="text" width="8rem" />
    <Skeleton variant="text" lines={2} />
  </Stack>
</Cluster>

<!-- Fill a fixed-size media box -->
<div style="aspect-ratio: 16/9">
  <Skeleton variant="block" />
</div>
```

### Props — Loading

| Prop        | Type                                        | Default        |
| ----------- | ------------------------------------------- | -------------- |
| `value`     | `number \| undefined`                       | — (indeterminate) |
| `max`       | `number`                                    | `100`          |
| `intent`    | `Intent`                                    | `'primary'`    |
| `size`      | `'sm' \| 'md' \| 'lg'`                       | `'md'`         |
| `variant`   | `'bar' \| 'spinner' \| 'dots'`               | `'bar'`        |
| `label`     | `string`                                    | — (accessible name) |
| `showValue` | `boolean`                                   | `false`        |
| `format`    | `(value: number, max: number) => string`    | percentage     |
| `class`     | `string` (→ `cx`)                           | —              |

Plus `...rest` forwarded onto the root. `aria-labelledby` / `aria-label` in
`...rest` are honoured as the accessible name (alternative to `label`).
A `value` makes the **`bar`** a determinate linear bar and the **`spinner`** a
determinate circular ring (R3); **`dots` is indeterminate-only** — a `value` on
it is ignored (dev-warn, R5). Animation timing is theme-hook-driven
(`--hz-loading-speed` / `--hz-loading-ease`, R8), not props.

### Props — Skeleton

| Prop            | Type                                        | Default (by variant) |
| --------------- | ------------------------------------------- | -------------------- |
| `variant`       | `'text' \| 'circle' \| 'rect' \| 'block'`    | `'text'`             |
| `width`         | `string \| number`                          | variant default      |
| `height`        | `string \| number`                          | variant default      |
| `rounded`       | `Rounded`                                   | variant default      |
| `lines`         | `number`                                    | `1` (text only)      |
| `lastLineWidth` | `string \| number`                          | `'60%'` (text, `lines>1`) |
| `animation`     | `'shimmer' \| 'pulse' \| 'none'`             | `'shimmer'`          |
| `class`         | `string` (→ `cx`)                           | —                    |

Plus `...rest` forwarded onto the root. A `number` `width`/`height`/`lastLineWidth`
is treated as `px`; a `string` is used verbatim (any CSS length/percentage).
`aria-hidden="true"` is stamped by default and may be overridden via `...rest`
(R13).

### Requirements

#### Loading

1. **R1 — Structure.** Root is always
   `<div class="hz-loading" data-intent data-size data-variant>` carrying
   `data-indeterminate` (empty attr) whenever the presentation is indeterminate
   (R2). Inside:
   - **bar variant:** the bar is a native `<progress class="hz-loading-bar">`
     (determinate when `value` present — R3; indeterminate when absent — R4).
     When `showValue` is set on a determinate bar, an
     `<output class="hz-loading-value">` sibling renders the formatted readout
     inline beside the bar.
   - **spinner variant, indeterminate (no `value`):** a
     `<span class="hz-loading-spinner" role="progressbar" aria-busy="true">`
     wrapping `IconLoader` (the spinning glyph — R5).
   - **spinner variant, determinate (`value` present):** the same
     `<span class="hz-loading-spinner" role="progressbar">` (no `aria-busy`)
     wrapping an SVG **ring** — `<svg class="hz-loading-ring">` with a
     `.hz-loading-ring-track` circle and a `.hz-loading-ring-fill` arc circle
     (R3). When `showValue` is set, a `<span class="hz-loading-value">` renders
     the formatted readout **centered inside the ring**.
   - **dots variant:** a `<span class="hz-loading-dots"
     role="progressbar" aria-busy="true">` wrapping three decorative
     `<span class="hz-loading-dot" aria-hidden="true">` children (R5).
   `showValue` renders a readout only in the determinate modes (bar, ring); it
   is ignored (dev-warn) for any indeterminate presentation and for `dots`
   (R7). `...rest` spreads first on the root; managed attributes (`class`,
   `data-*`) win.

2. **R2 — Data hooks.** `data-intent` is always present (default `'primary'`).
   `data-size` is always present (`'sm' | 'md' | 'lg'`, default `'md'`).
   `data-variant` is always present (`'bar' | 'spinner' | 'dots'`, default
   `'bar'`). `data-indeterminate` (empty) is present for every indeterminate
   presentation — for `bar` and `spinner` when `value` is absent/`undefined`/
   `NaN`, and **always** for `dots` (indeterminate-only). So
   `:not([data-indeterminate])` selects the determinate forms (the linear bar
   and the circular ring, each with a `value`).

3. **R3 — Determinate = the progressive enhancement (linear bar + circular
   ring).** When `value` is a finite number, `clamped = Math.min(Math.max(value,
   0), max)` (negatives → 0, over-max → max), and:
   - **`variant="bar"`** renders `<progress value={clamped} max={max}>`. The
     native element supplies `role="progressbar"`, `aria-valuemin="0"`,
     `aria-valuemax=max`, `aria-valuenow=clamped` **for free** — the component
     stamps none of these manually.
   - **`variant="spinner"`** renders the **ring**: an inline
     `<svg class="hz-loading-ring" viewBox="0 0 32 32" role="img"
     aria-hidden="true">` containing two `<circle cx="16" cy="16" r="14"
     pathLength="100">` — a `.hz-loading-ring-track` (full) and a
     `.hz-loading-ring-fill` whose arc length is the live fraction. The fill
     circle uses `pathLength="100"` with `stroke-dasharray: 100` (from the
     theme) and a component-written inline
     `stroke-dashoffset: {100 - (clamped / max) * 100}` (the JS→CSS live
     fraction — the Slider-fill precedent, an inline value CSS cannot compute).
     The theme rotates the fill −90° (transform-origin center) so the arc starts
     at 12 o'clock, and applies `vector-effect: non-scaling-stroke` so the
     stroke stays a true length. There is **no spin** in determinate mode — the
     ring is a **static** arc. Because the SVG is decorative, the ARIA lives on
     the wrapping `.hz-loading-spinner` span: `role="progressbar"`,
     `aria-valuemin="0"`, `aria-valuemax=max`, `aria-valuenow=clamped`,
     `aria-label` (R6), and **no `aria-busy`** (determinate, known progress —
     mirroring the native bar, which sets none).
   For **both** forms, `aria-valuetext` is set to `format(clamped, max)` **only**
   when the consumer passes a non-default `format` or a non-100 `max` (human
   units for non-percentage); with the default percentage format and `max=100`
   it is omitted (native computes it for the bar; for the ring
   `aria-valuenow`/`aria-valuemax` suffice). A determinate variant renders a
   static fill/arc with **no animation**, so the reduced-motion exception (R9)
   does not apply to it (like the determinate bar). This is the only determinate
   path; everything else (R4/R5) is a bare loading indicator.

4. **R4 — Indeterminate bar (the base).** When `variant="bar"` and `value` is
   absent, it renders `<progress max={max}>` with **no `value` attribute** — the
   native indeterminate state, `role="progressbar"` with **no** `aria-valuenow`.
   No `aria-valuetext`, no readout. The theme animates the track with the calm
   retuned sweep, which slows and softens to a pulse under reduced motion
   (R8/R9).

5. **R5 — Indeterminate spinner and dots.** When `variant="spinner"` and `value`
   is **absent**, it renders `IconLoader` (the same spinner Button uses — **no
   new icon**) inside `.hz-loading-spinner[role="progressbar"][aria-busy="true"]`
   with the accessible name from `label`/rest and **no** `aria-valuenow`.
   `variant="dots"` renders three `.hz-loading-dot` spans inside
   `.hz-loading-dots[role="progressbar"][aria-busy="true"]`, likewise no
   `aria-valuenow`; **`dots` is indeterminate-only — a `value` on it dev-warns
   and is ignored** (Decision 6). The dots and the spinner glyph are decorative
   (`aria-hidden`) — the accessible name carries the meaning. (There is no
   dev-warn for a `value` on the `spinner`: that is now the valid ring, R3.)

6. **R6 — Accessible name is required (dev-warn).** A bare `<progress>` /
   `role="progressbar"` has a role but no name. If neither `label` nor an
   `aria-label`/`aria-labelledby` in `...rest` is present, the component
   dev-warns once at creation (`import.meta.env.DEV` + `untrack`, the Button
   icon-only precedent), citing WCAG 4.1.2. `label` is applied as `aria-label`
   on the progressbar element (the `<progress>`, or the `.hz-loading-spinner` /
   `.hz-loading-dots` span).

7. **R7 — Value readout & format.** `showValue` renders
   `<... class="hz-loading-value">{format(clamped, max)}</...>` in the
   **determinate** modes only — inline beside the linear bar, or centered inside
   the circular ring (the theme absolutely-centers it for
   `[data-variant='spinner']`). The default `format` is
   `(v, max) => \`${Math.round((v / max) * 100)}%\``. The **same** `format`
   output feeds both the visible readout and `aria-valuetext` (R3). `showValue`
   on any indeterminate presentation, or on `dots`, renders no readout
   (dev-warn). At `sm`/`md` the centered ring readout may be too small to fit;
   the docs recommend `lg` or a larger `--hz-loading-size` when using
   `showValue` on a ring.

8. **R8 — Theme (`loading.css`) + sizes/intents + adjustable speed & easing +
   ring geometry + calm slower defaults + slow-not-halt reduced motion.** All
   colour, size, and animation live in `src/lib/theme/components/loading.css`,
   in `@layer hz-theme`, registered in `theme.css`. It:
   - declares the documented hooks on `.hz-loading` (each marked with the
     `documented hook` comment the drift check keys on):
     - `--hz-loading-fill` (`var(--hz-intent-primary)` — the bar/ring fill,
       spinner stroke, dot colour);
     - `--hz-loading-track` (the unfilled track / unfilled ring colour, e.g.
       `color-mix(in srgb, var(--hz-intent-neutral) 16%, var(--hz-color-surface))`);
     - `--hz-loading-size` (the size dimension — **bar thickness** for the bar,
       **glyph/ring diameter** for the spinner/ring, **dot diameter** for dots —
       defaulted per `data-size`);
     - `--hz-loading-ring-width` (the ring's stroke width; a `<length>`,
       default `calc(var(--hz-loading-size, 1.5rem) / 8)` so it scales with the
       diameter — applied with `vector-effect: non-scaling-stroke` so it stays a
       true length under the viewBox scale);
     - **`--hz-loading-speed`** (base **duration** of the indeterminate
       animations — the spinner spin and the dots cycle run at exactly this; the
       bar sweep runs at 1.6× it), defaulting to
       **`calc(var(--hz-duration-base, 400ms) * 6)` = 2.4s** (Decision 8b — the
       calm ambient pace). Anchored to the `--hz-duration-*` scale so retuning
       `--hz-duration-base` drags the cadence with it; overridable with any
       `<time>`;
     - **`--hz-loading-ease`** (timing function of the indeterminate **dots
       cycle** only — **not** the spinner spin nor the bar sweep, both of which
       stay `linear` so their loops don't hiccup, R7 amendment), defaulting to
       **`var(--hz-ease-standard, cubic-bezier(0.2, 0, 0, 1))`**. Overridable;
     - **`--hz-loading-pulse-width`** (width of the indeterminate **bar's**
       moving highlight as a **percentage of the bar width** — wider reads
       softer/more ambient), defaulting to **`150%`**; the seamless loop holds
       up to ~200% (added 2026-07-27 from live feedback). The gradient stops are
       derived from it as `calc(50% ∓ var(--hz-loading-pulse-width) / 4)` in the
       2×-bar tile;
   - switches `--hz-loading-fill` per intent via `:where([data-intent='…'])`
     rules across the registry Button covers (primary/secondary/danger/warning/
     success/info; neutral is the base). **Every intent applies to every
     variant and mode** (bar fill, ring arc, spinner stroke, dot colour all read
     `--hz-loading-fill`);
   - sizes **every variant** off `data-size` (recommended bar thickness sm
     `0.25rem` / md `0.5rem` / lg `0.75rem`; spinner glyph / ring diameter and
     dots ~ `1rem` / `1.5rem` / `2rem`) via `--hz-loading-size`;
   - paints the native bar's fill and track through the vendor pseudo-elements
     (`::-webkit-progress-bar` / `::-webkit-progress-value` / `::-moz-progress-bar`)
     plus `appearance: none`, using `--hz-loading-fill` / `--hz-loading-track`
     and a token radius (`--hz-radius-full` for a pill track);
   - paints the **ring**: `.hz-loading-ring` sized to `--hz-loading-size` square;
     both circles `fill: none`, `stroke-width: var(--hz-loading-ring-width)`,
     `vector-effect: non-scaling-stroke`; `.hz-loading-ring-track`
     `stroke: var(--hz-loading-track)`; `.hz-loading-ring-fill`
     `stroke: var(--hz-loading-fill)`, `stroke-dasharray: 100`,
     `stroke-linecap: round`, rotated −90° about center (the component writes
     `stroke-dashoffset` inline — R3). No animation (static arc);
   - **animates the three INDETERMINATE presentations UNCONDITIONALLY** (not
     wrapped in `no-preference` — the Decision 9 exception):
     - **indeterminate bar** — a soft moving-highlight gradient sweep,
       `animation-duration: calc(var(--hz-loading-speed) * 1.6)` (≈ 3.84s at the
       default), **`animation-timing-function: linear`** (NOT
       `--hz-loading-ease` — a looping sweep must hold constant velocity or it
       hiccups at the seam; R7 amendment / Decision 8), over a periodic gradient
       tile (`background-size: 200%`, track at both edges) shifted exactly one
       tile per cycle (`background-position` 100% → -100%) for a pixel-seamless
       loop, low contrast between track and highlight (Decision 8a);
     - **indeterminate spinner** — `@keyframes hz-spin` (identical to Button's —
       Decision 4), `animation-duration: var(--hz-loading-speed)` (≈ 2.4s),
       **`animation-timing-function: linear`** — explicitly NOT
       `--hz-loading-ease` (Decision 7), coloured `--hz-loading-fill`;
     - **dots** — `@keyframes hz-loading-dots` (a staggered bounce/pulse, each
       dot offset by an `animation-delay` from `--hz-loading-speed`),
       `animation-duration: var(--hz-loading-speed)` (≈ 2.4s),
       `animation-timing-function: var(--hz-loading-ease)`;
   - **under reduced motion, SLOWS the indeterminate presentations — does NOT
     halt (Decision 9):** a single `@media (prefers-reduced-motion: reduce)`
     block, using a **private** multiplier `--_loading-rm-scale` (`--_`-prefixed
     so it is neither a documented hook nor seen by the drift check) set to `1`
     normally and **`2`** in the reduce block, so:
     - **spinner** ≈ `calc(var(--hz-loading-speed) * 2)` = **4.8s/rev** (linear,
       still turning);
     - **dots** ≈ **4.8s** cycle;
     - **bar** swaps the traveling sweep for a **gentle low-amplitude pulse** —
       `@keyframes hz-loading-bar-pulse`, a slow opacity/brightness pulse of the
       *static* muted track (no edge-to-edge motion), ≈ **4.8s**;
     these are slow-but-perceptibly-moving, never frozen. Determinate bar/ring
     have no animation, so this block does not touch them;
   - styles `.hz-loading-value` (small muted readout; tabular numerals; inline
     for the bar, absolutely centered for `[data-variant='spinner']`).
   The component's own scoped `<style>` carries **structure only** (the wrapper
   as an inline/flex row aligning bar and readout; the spinner/ring wrapper as a
   relatively-positioned inline-flex box so the centered readout can absolutely
   position; `min-width: 0` so the bar flexes; the dots as an inline row) — no
   colour.

#### Skeleton

9. **R9 — Structure & variants.** Root is
   `<div class="hz-skeleton" data-variant data-animation data-rounded aria-hidden="true">`.
   `data-variant` is one of `text | circle | rect | block` (default `text`).
   - `text` with `lines <= 1`, and `circle`/`rect`/`block`: the root itself is
     the single painted block (no children).
   - `text` with `lines > 1`: the root is a column container holding `lines`
     `<span class="hz-skeleton-line">` bars (R11).

10. **R10 — Dimensions (variant defaults + overrides).** Each variant sets
    default `width`/`height`/`rounded`, applied as inline `style` on the painted
    element; the `width`/`height`/`rounded` props override them. Defaults:
    - `text` — `width: 100%`, `height: 1em` (a text line; `em` so it tracks the
      surrounding font-size), `rounded: 'sm'`;
    - `circle` — a square from `width` (`height` follows `width` when omitted, and
      vice-versa; default `2.5rem`), `rounded: 'full'` (forced — a circle is
      always full regardless of the `rounded` prop);
    - `rect` — `width: 100%`, `height: 1rem`, `rounded: 'md'`;
    - `block` — `width: 100%`, `height: 100%` (fills its container — the
      "fill this box" mode), `rounded: 'md'`.
    A `number` width/height is emitted as `px`; a `string` is used verbatim.
    `rounded` maps to `data-rounded` (the theme resolves it 1:1 to the
    `--hz-radius-*` scale, the Badge/Alert precedent). Width/height are inline
    styles, **not** theme hooks (per-instance values CSS cannot compute — the
    Grid-cols precedent; documented in `hooks.ts` as deliberately not contract).

11. **R11 — Multi-line text realism.** `text` + `lines > 1` renders `lines`
    stacked `.hz-skeleton-line` bars with a token gap; the **last** line uses
    `lastLineWidth` (default `'60%'`) so the block reads like a real paragraph.
    `lines` is clamped to `>= 1` (a `0`/negative `lines` dev-warns and renders
    one line). `lines`/`lastLineWidth` are ignored for non-`text` variants
    (silently — they are meaningless there).

12. **R12 — Animation (`shimmer` | `pulse` | `none`) + reduced motion HALTS
    (the exception-to-the-exception).** `data-animation` (default `shimmer`).
    The theme (R14) implements:
    - `shimmer` — a moving highlight gradient (the table recipe);
    - `pulse` — an opacity fade in/out;
    - `none` — a static muted block, no animation at all.
    Both `shimmer` and `pulse` are gated behind
    `@media (prefers-reduced-motion: no-preference)`; under
    `prefers-reduced-motion: reduce` **every** variant renders as the static
    muted block, identical to `animation="none"`. This is the **standard house
    posture and is deliberately UNLIKE indeterminate Loading (Decision 9)**: a
    Skeleton's shape already signals "content loading here", so it needs no
    motion under reduced motion; only Loading (and Button's spinner), where
    motion is the essential cue, keep animating (slowly). State this contrast in
    the docs a11yNote.

13. **R13 — A11y: decorative by default, with a paired announcement.**
    Skeleton stamps `aria-hidden="true"` on the root by default — it is
    decorative scaffolding and must not be announced glyph-by-glyph. A consumer
    may override `aria-hidden` via `...rest` for the rare case they want it
    exposed. The component ships no `role`, no live region, and no label: it
    **cannot** be the announcement on its own. The docs page (R17) and the
    `a11yNote` prescribe the surrounding pattern — wrap the loading region in
    `aria-busy="true"` and pair it with either an indeterminate labelled
    `Loading` or a polite `aria-live` "Loading…" message so screen-reader
    users are told content is coming, then told when it arrives. This is the
    explicit Loading-announces / Skeleton-decorates division.

14. **R14 — Theme (`skeleton.css`) + reduced motion (halts).** All colour and
    animation live in `src/lib/theme/components/skeleton.css`, `@layer hz-theme`,
    registered in `theme.css`. It:
    - declares the documented hooks on `.hz-skeleton` / `.hz-skeleton-line`:
      `--hz-skeleton-color` (the base block colour, e.g.
      `color-mix(in srgb, var(--hz-intent-neutral) 12%, var(--hz-color-surface))`,
      strengthened in dark like Badge's tint), `--hz-skeleton-highlight` (the
      shimmer sweep colour), and `--hz-skeleton-speed` (`<time>`, default
      `1.4s`);
    - paints the block background from `--hz-skeleton-color`, resolves
      `data-rounded` 1:1 to `--hz-radius-*`, and forces the circle's radius to
      `--hz-radius-full`;
    - implements `shimmer` (animated `background-position` gradient built from
      `--hz-skeleton-color` → `--hz-skeleton-highlight`) and `pulse` (opacity
      keyframe), **each behind `@media (prefers-reduced-motion: no-preference)`**
      so both go fully still under reduced motion (unlike Loading — R12/Decision
      9);
    - carries its own `@keyframes` (distinct names, e.g.
      `hz-skeleton-shimmer` / `hz-skeleton-pulse`) so the sheet is
      self-contained.
    The component's scoped `<style>` carries structure only (multi-line text as
    a flex column with a token gap; `block` filling its container).

#### Bookkeeping (both)

15. **R15 — Barrel exports.** `Loading` and `Skeleton` exported from
    `src/lib/components/index.ts`; `import { Loading, Skeleton } from '$lib'`
    resolves. Add `expect(mod.Loading).toBeDefined()` /
    `expect(mod.Skeleton).toBeDefined()` to `src/lib/exports.spec.ts` (comments
    `// Loading-R15:` / `// Skeleton-R15:`), mirroring the Badge assertion. The
    old `Progress` export is removed (rename, not addition).

16. **R16 — Theme hooks entries.** Add `Loading` and `Skeleton` entries to the
    `hooks` registry in `src/docs/hooks.ts`, in the Common band (near Badge/
    Alert), so `/components/loading`, `/components/skeleton`, and
    `/theming/components` render each styling contract. Every documented hook
    must exist in source and every declared theme hook must be documented, or
    `hooks.spec.ts` fails. **`hooks.spec.ts` component-count assertion bumps by
    2** (line ~110: `toHaveLength(43)` → `toHaveLength(45)`); the comment above
    it gains "+ Loading + Skeleton (spec 49)".

    **Loading** — root `hz-loading`:
    - `attrs`: `data-intent` (`'primary' | any registered intent` — drives the
      fill via `--hz-loading-fill` for every variant/mode; spans the intent
      registry), `data-size` (`'sm' | 'md' | 'lg'` — sizes every variant;
      default md), `data-variant` (`'bar' | 'spinner' | 'dots'` — default bar;
      dots is indeterminate-only), `data-indeterminate` (present for every
      indeterminate presentation — bar/spinner with no value, and always for
      dots; `:not([data-indeterminate])` is the determinate bar or ring);
    - `props`: `--hz-loading-fill` (`<color> — default var(--hz-intent-primary)`;
      the filled portion, ring arc, spinner stroke, and dot colour, switched per
      intent), `--hz-loading-track` (`<color>`; the unfilled bar track / ring),
      `--hz-loading-size` (`<length>`; bar thickness / spinner-ring diameter /
      dot size, per variant, defaulted per data-size),
      `--hz-loading-ring-width` (`<length> — default calc(var(--hz-loading-size)
      / 8)`; the determinate-ring stroke width, non-scaling),
      `--hz-loading-speed` (`<time> — default calc(var(--hz-duration-base) * 6)`
      = 2.4s; base duration of the indeterminate animations — spinner/dots at
      exactly this, bar sweep at 1.6× it. Anchored to the motion-token scale and
      overridable. Under reduced motion the effective duration is slowed ~2×, not
      zeroed — indeterminate Loading keeps animating; determinate bar/ring are
      static), `--hz-loading-ease` (`<timing-function> — default
      var(--hz-ease-standard)`; easing of the bar sweep and the dots cycle. The
      **indeterminate spinner spin is always `linear`**, independent of this
      hook);
    - `parts`: `.hz-loading-bar` (the native `<progress>`), `.hz-loading-value`
      (the readout — inline for the bar, centered for the ring),
      `.hz-loading-spinner` (the indeterminate spinner / determinate-ring
      wrapper; carries the progressbar role), `.hz-loading-ring` (the
      determinate SVG ring), `.hz-loading-ring-track` (the unfilled ring
      circle), `.hz-loading-ring-fill` (the arc circle — its
      `stroke-dashoffset` is written inline as the live fraction),
      `.hz-loading-dots` (the ellipsis-loader wrapper), `.hz-loading-dot` (one
      of its three dots).
    The `dots` variant adds no new custom-property hooks. The ring's
    `stroke-dashoffset` (live fraction) and the reduced-motion slow-factor
    (`--_loading-rm-scale`) are deliberately **not** documented hooks — the
    former is an inline JS→CSS value (the Slider-fill precedent), the latter is
    a private `--_` internal (note both in the `hooks.ts` "deliberately not
    listed" comment block).

    **Skeleton** — root `hz-skeleton`:
    - `attrs`: `data-variant` (`'text' | 'circle' | 'rect' | 'block'` — default
      text), `data-animation` (`'shimmer' | 'pulse' | 'none'` — default shimmer;
      goes fully still under reduced motion), `data-rounded`
      (`'none' | 'sm' | 'md' | 'lg' | 'full'` — 1:1 with `--hz-radius-*`; circle
      forces full);
    - `props`: `--hz-skeleton-color` (`<color>`; the base block colour),
      `--hz-skeleton-highlight` (`<color>`; the shimmer sweep colour),
      `--hz-skeleton-speed` (`<time> — default 1.4s`; animation cycle);
    - `parts`: `.hz-skeleton-line` (one bar in a multi-line text skeleton).
    - Note in `hooks.ts` (the "deliberately not listed" comment block) that
      Skeleton's `width`/`height` are inline per-instance styles, not hooks.

17. **R17 — Docs pages + data modules + manifest.** Two new pages
    `src/routes/components/loading/+page.svelte` and
    `src/routes/components/skeleton/+page.svelte` using the docs scaffold
    (`DocPage`, `Example`, `Tabs`), each driven by a new data module
    (`src/docs/data/loading.ts` exporting `loadingDoc`,
    `src/docs/data/skeleton.ts` exporting `skeletonDoc`) with `description`,
    `importLine`, `props` table mirroring the Props sections above, `a11yNote`,
    and `a11yLinks` (the ARIA `progressbar` pattern for Loading; for Skeleton,
    the loading-region / `aria-busy` guidance). The Loading page frames the
    component as "indeterminate loading is the base; a `value` progressively
    enhances the bar into a linear progress bar and the spinner into a circular
    ring", and its a11yNote states the reduced-motion exception (indeterminate
    Loading slows rather than halts; determinate is static; Skeleton goes still
    — Decision 9). Demos as tabs:
    - **Loading:** per-variant examples — indeterminate **bar**, indeterminate
      **spinner** and its determinate **ring**, **dots**; Progressive
      enhancement — the linear bar and the circular ring with a `value` and
      `showValue`, side by side; Non-percentage units via `format` (linear and
      circular); and the three focused demos from R18 (per-intent Intents demo,
      per-size Sizes demo, Timing control).
    - **Skeleton:** Shapes (text/circle/rect/block); Multi-line text
      (`lines` + `lastLineWidth`); Animation (shimmer/pulse/none); a **paired
      loading pattern** snippet showing Skeleton inside an `aria-busy` region
      announced by a labelled indeterminate `Loading` — the R13 division, shown
      as code; and **three worked composed placeholders**, each built from
      several Skeletons (Decision 3):
      - a **card** skeleton (media block + avatar circle + heading line +
        two-line body, laid out with Card/Stack/Cluster);
      - a **table** skeleton (a header row of short bars over N body rows of
        cell bars — the compose-your-own analogue to Table's built-in
        `loading` rows);
      - a **prose** skeleton (a heading line + a multi-line `text` paragraph,
        repeated — an article/detail placeholder).
    **Manifest:** add `{ label: 'Loading', href: '/components/loading' }` and
    `{ label: 'Skeleton', href: '/components/skeleton' }` to the **Common**
    group in `src/docs/manifest.ts` (the old `Progress` entry is renamed, not
    added). **Recommended placement:** the loading pair sits together, appended
    after `Table` — the Common group is not strictly alphabetical past `Button`.
    The `componentPages` count in `hooks.spec.ts` (R16) covers both regardless
    of position.

18. **R18 — Loading docs: a per-intent demo, a per-size demo, and a timing
    demo.** Beyond the per-variant examples (R17), the Loading page carries three
    focused demos:
    - **Intents demo — one row per intent, across the variant family.** For each
      registered intent (neutral/primary/secondary/danger/warning/success/info), a
      row of `[spinner] [bar] [dots]` indeterminate loaders in that intent colour
      — `intent` switches `--hz-loading-fill` alone, reaching every variant.
      `intent` defaults to `primary` (a loader's fill is an accent, not neutral).
    - **Sizes demo — one row per size, across the variant family.** For each size
      (`sm` / `md` / `lg`), a row of `[spinner] [bar] [dots]` indeterminate
      loaders at that size — `--hz-loading-size` scales every variant off
      `data-size`.
    - **Timing demo (speed + easing).** Documented `--hz-loading-speed` /
      `--hz-loading-ease` overrides on the indeterminate variants, plus a **live
      control** (Sliders and/or buttons) setting **both** — applied **per
      `<Loading>` instance** (loading.css declares the hooks on `.hz-loading`, so
      an ancestor-`<div>` override is shadowed). The prose calls out: (a) the
      indeterminate **spinner spin stays `linear`**; (b) the **calm slower
      defaults** — `--hz-loading-speed` = 2.4s, bar sweep at 1.6× (Decision 8);
      and (c) **reduced motion slows (≈ 2×, ≈ 4.8s) and softens the bar to a
      pulse — it does NOT stop** indeterminate Loading, while the determinate
      ring/bar are static and Skeleton goes fully still (Decision 9).
    Both the Intents and Sizes demos use **indeterminate** loaders (not
    determinate); the determinate ring and bar keep their own dedicated examples
    in the progressive-enhancement tab (R17). **Reviewer check:** the Intents demo
    shows every registered intent (each a `[spinner][bar][dots]` row in its
    colour), the Sizes demo shows every size the same way, and the speed/ease live
    control works. Pass/fail on those three.

    > History: R18 originally specified single-variant inline rows; the maintainer
    > later directed the variant-family (`[spinner][bar][dots]`) per-intent /
    > per-size layout above (2026-07-27), so these demos are intentional grids.

#### Button reduced-motion change

19. **R19 — SLOW Button's loading spinner under reduced motion (not halt) —
    Button spec amendment, `specs/01-button.md`.** For consistency with
    indeterminate Loading (Decision 9), Button's loading spinner must **slow,
    not stop**, under reduced motion, so a loading button never looks frozen.
    Today `button.css` (lines 180–193) runs `animation: hz-spin 1.4s linear
    infinite` on the loading `.hz-icon` unconditionally. **Keep it
    unconditional** (do NOT wrap it in `no-preference`) and **add** a
    `@media (prefers-reduced-motion: reduce)` block that slows the loading
    `.hz-icon` to ~**4s** (roughly 3× its unchanged 1.4s base — slow but clearly
    turning; Button's spin default itself is unchanged). Button's other loading
    semantics are unchanged: `aria-busy="true"`, `data-state="loading"`,
    `cursor: progress`, sr-only `loadingLabel`. `@keyframes hz-spin` stays in
    `button.css` (Decision 4). Record this as a dated amendment in
    `specs/01-button.md` ("2026-07-27 — loading spin slowed (not halted) under
    prefers-reduced-motion, spec 49") and add a `Button.svelte.spec.ts`
    assertion that under a forced reduce context the spin **still runs** with a
    much longer computed `animation-duration` (not `none` / `0s`). Besides this
    and the two new components' own files, the only other edits are `theme.css`
    registration and the shared bookkeeping.

### Responsive Behavior

- **Loading** is fluid: the bar fills its parent's inline size at every
  breakpoint (no fixed widths); the wrapper is a flex row so a `showValue`
  readout sits inline beside the bar and the bar flexes (`min-width: 0`). Bar
  thickness, spinner glyph, ring diameter, and dots are `data-size`-driven,
  constant across breakpoints; the spinner/ring and dots are intrinsically
  sized. Nothing hides or reflows at mobile (<640px), tablet (640–1024px), or
  desktop (>1024px). The R18 intents/sizes rows wrap gracefully on narrow
  viewports (an inline row that can flex-wrap), never overflowing.
- **Skeleton** takes its size from props/variant, so it is as responsive as the
  box you place it in: `block` and percentage widths track their container;
  `em`-based text height tracks the surrounding font-size. Multi-line text
  wraps to the container width. No breakpoint-specific behaviour — a Skeleton
  should mirror the shape of the content it stands in for at whatever size that
  content will be.

### Accessibility (WCAG 2.1 AA)

- **Loading — name, role, value (4.1.2 / 1.3.1).** The linear bar (native
  `<progress>`) and the spinner/dots/ring wrappers (`role="progressbar"`) carry
  the role. A name is **required**: `label` → `aria-label`, or `aria-labelledby`
  via rest; a missing name dev-warns (R6). The **determinate** forms — the
  linear bar and the circular ring — expose `aria-valuenow/min/max` (native for
  the bar; stamped on the wrapper for the ring, whose SVG is `aria-hidden`
  decoration), plus `aria-valuetext` for non-percentage `format`, and set **no**
  `aria-busy` (R3). The **indeterminate** forms — the bare bar, the spinning
  glyph, and the dots — expose **no** `aria-valuenow` and set `aria-busy="true"`
  on the spinner/dots (R4/R5). The spinner glyph, the ring SVG, and the dots are
  `aria-hidden` decoration.
- **Loading — contrast (1.4.3 / 1.4.11).** The fill/arc is an intent role token
  on a muted track/ring; the reference theme's intents are graded ≥ 3:1 against
  the surface for non-text UI. The `showValue` readout is muted body text and
  must meet 4.5:1 (it inherits the text-muted role, already graded); the
  ring-centered readout sits over the surface, not the arc, so it stays legible.
- **Skeleton — decorative (1.3.1 / 4.1.2).** `aria-hidden="true"` by default;
  the surrounding region owns the announcement (`aria-busy` + a labelled
  `Loading` or polite `aria-live` "Loading…"), documented in R13/R17.
- **Reduced motion (2.3.3 / 2.2.2) — indeterminate Loading is a DELIBERATE
  exception.** Unlike the rest of the library (and the motion module default,
  specs/39 R3, which reduces animation to zero), an indeterminate Loading and
  Button's loading spinner do **not** freeze under
  `prefers-reduced-motion: reduce` — a frozen loader reads as stalled/broken.
  Instead they run a **slower** animation (~2×, ≈ 4.8s for Loading, ~4s for
  Button — R8/R19), and the bar **softens to a low-amplitude pulse** rather than
  a traveling sweep, keeping a minimal "still working" cue while meeting the
  vestibular concern through slowness and reduced amplitude. This is the motion
  module's `essential: true` principle applied to a cue whose whole purpose *is*
  motion; the loaders are also **transient** (they run only while an operation is
  pending) and low-contrast/non-flashing by design. **Determinate Loading (the
  bar with a value, the ring) is static** and needs no accommodation.
  **Skeleton is NOT part of the exception**: its shimmer/pulse goes fully still
  (R12/R14), because the placeholder shape itself is the cue.
- **Colour is not the only signal (1.4.1).** Loading conveys state through
  value semantics and the accessible name, not colour alone; the intent tint is
  reinforcement.

### Edge Cases & Error States

| Case | Expected behavior |
| --- | --- |
| `value` omitted (`variant="bar"`) | Indeterminate base: `data-indeterminate` set, `<progress>` with no `value`, no `aria-valuenow`, calm retuned sweep (R2/R4/R8). |
| `value` omitted (`variant="spinner"`) | Indeterminate spin: `data-indeterminate` set, `IconLoader`, `aria-busy`, no `aria-valuenow` (R2/R5). |
| `value` present (`variant="bar"`) | Determinate linear bar: `aria-valuenow` from native `<progress>`, no `data-indeterminate`, static fill (R3). |
| `value` present (`variant="spinner"`) | Determinate **ring**: SVG arc fills to `value/max`, wrapper carries `role=progressbar` + `aria-valuenow/min/max`, no `aria-busy`, no `data-indeterminate`, no spin (R3). |
| `value = 0` (bar or ring) | Determinate, `aria-valuenow="0"`; bar empty fill, ring empty arc (`stroke-dashoffset: 100`) (R3). |
| `value = max` (bar or ring) | `aria-valuenow=max`; bar full fill, ring full circle (`stroke-dashoffset: 0`); no auto-flip out of loading (R3). |
| `value > max` (bar or ring) | Clamped to `max`; never renders ">100%" or an over-full ring (R3). |
| `value < 0` | Clamped to `0` (R3). |
| `value = NaN` | Treated as indeterminate; dev-warn (R2/R3). |
| `variant="dots"` + `value` | Dev-warn; renders the indeterminate dots, value ignored (dots is indeterminate-only — R5). |
| `variant="spinner"` + `value` | **Valid** — the determinate ring (no warn) (R3/R5). |
| `showValue` + determinate ring | The `%` (or `format`) renders centered in the ring; recommend `lg`/larger `--hz-loading-size` for legibility (R7). |
| `showValue` on any indeterminate / on `dots` | Ignored; dev-warn (R7). |
| No `label` / no `aria-label(ledby)` | Dev-warn citing 4.1.2; still renders (R6). |
| Custom `format` / non-100 `max` | `aria-valuetext` = formatted string; readout matches it (bar or ring) (R3/R7). |
| `--hz-loading-speed` override | Indeterminate spinner/dots duration and the bar-sweep duration (1.6× it) change; determinate bar/ring unaffected (static); reduced-motion slowdown still multiplies it (R8). |
| `--hz-loading-ease` override | The indeterminate bar-sweep and dots easing change; the indeterminate **spinner spin stays `linear`** regardless (R8). |
| **Reduced motion — indeterminate Loading** | Does NOT halt: spinner/dots slow ~2× (≈ 4.8s), the bar softens to a gentle slow pulse; still animating (Decision 9, R8). |
| **Reduced motion — determinate Loading** | No change — bar fill / ring arc are static regardless (R3/R9). |
| **Reduced motion — Button loading spinner** | Slows to ~4s/rev, still spinning, not frozen (R19). |
| **Reduced motion — Skeleton** | Shimmer/pulse go fully still (static muted block) — the exception-to-the-exception (R12/R14). |
| Skeleton no `width`/`height` | Variant defaults apply (text 100%×1em, circle 2.5rem square, rect 100%×1rem, block 100%×100%) (R10). |
| Skeleton `circle` with only `width` | Height follows width (square); radius forced full (R10). |
| Skeleton `lines > 1` on non-`text` variant | `lines` ignored (R11). |
| Skeleton `lines = 0` / negative | Clamped to 1; dev-warn (R11). |
| Skeleton `animation="none"` | Static block, no animation (R12). |
| RTL | Native `<progress>` fills from the inline-start edge; the ring starts at 12 o'clock and fills clockwise (direction-independent); dots row and Skeleton shapes are direction-symmetric; multi-line text last-line shortening is width-based, unaffected. |
| Dark mode | Track/ring/skeleton base colours strengthen their tint over the dark surface (the Badge `--hz-badge-tint` precedent) so the placeholder still reads. |

### Existing Code to Reuse

- **`cx`** from `$lib/utils` for both root classes (per Badge).
- **`IconLoader`** from `$lib/icons/generated/loader.svelte` for Loading's
  **indeterminate** spinner — the same spinner Button renders (`Button.svelte`
  lines 106–109). Do **not** add a new icon. (The determinate ring is a
  component-authored SVG, not an icon.)
- **Button's `hz-spin` keyframes** (`button.css` lines 180–193) as the template
  for Loading's spinner rotation (co-located per Decision 4, not shared), and
  the site of the R19 slow-under-reduced-motion change. Note Button's spin is
  `linear` — the same constant-speed choice Loading's indeterminate spinner
  keeps (Decision 7).
- **The Slider fill inline-value channel** (`--hz-slider-fill*`, written inline
  by the component — see `hooks.ts` "deliberately not listed") as the precedent
  for the ring's inline `stroke-dashoffset` live fraction (R3).
- **The `--hz-duration-*` and `--hz-ease-*` token scales** (`tokens.css` lines
  149–154: durations fast 250ms / base 400ms / slow 550ms; eases
  standard `cubic-bezier(0.2,0,0,1)` / in / out) — `--hz-loading-speed` derives
  its default from `--hz-duration-base` (× 6) and `--hz-loading-ease` from
  `--hz-ease-standard` (R8), so the loading cadence and feel track a consumer's
  motion-token retune.
- **The motion module's `essential: true` posture** (specs/39 R3) — the
  precedent for exempting meaningful motion from reduce-to-zero; indeterminate
  Loading's slow-not-halt is the same principle, cross-referenced in the a11y
  note.
- **Table's skeleton-shimmer recipe** (`table.css` lines 142–168) — generalised
  into both the Loading indeterminate sweep and the Skeleton shimmer (Skeleton
  keeps the no-preference gate; indeterminate Loading does not — Decision 9).
- **`Intent`** and **`Rounded`** from `$lib/types`.
- **Badge's dark-mode tint strengthening** (`badge.css` lines 68–70) for keeping
  the track / ring / skeleton base legible on the dark surface.
- **The dev-warn pattern** (`Button.svelte` lines 69–76): `import.meta.env.DEV`
  + `untrack` for the missing-name (Loading-R6), `NaN`-value, `dots`+value,
  showValue-on-indeterminate/dots, and `lines<=0` warnings.
- **Theme conventions:** `badge.css` / `banner.css` as the sheet template —
  `@layer hz-theme`, literal `var(--hz-…, <fallback>)`, `:where()`, the
  `documented hook` comment on every advertised custom property.
- **Docs scaffold:** `src/docs/data/badge.ts` + `src/routes/components/badge/+page.svelte`
  as the copy-from template; `ComponentDoc` shape from `src/docs/data/types.ts`.
  Table's `loading` rows demo for the composed table-skeleton example, and
  Slider for the live speed/easing controls (R18).

### Test Plan

Testing framework already in use: **`vitest` with `vitest-browser-svelte`**
(browser project, `expect.requireAssertions`), mirroring
`Badge.svelte.spec.ts`. Reduced-motion assertions force the media state (the
project's existing reduced-motion test harness / `emulateMedia` equivalent).

**Unit — `src/lib/components/Loading.svelte.spec.ts`:**
- R1/R2: root `.hz-loading` with `data-intent`/`data-size`/`data-variant`
  always present; `data-indeterminate` present for bar/spinner with no value and
  always for `dots`, absent for the determinate bar and ring; indeterminate bar
  → native `<progress>` with no `value`; indeterminate spinner →
  `.hz-loading-spinner[role="progressbar"][aria-busy="true"]` with `IconLoader`;
  dots → `.hz-loading-dots[role="progressbar"][aria-busy="true"]` with three
  `.hz-loading-dot[aria-hidden="true"]`.
- R3 (bar determinate): `<progress>` has `value`/`max`; clamps
  (`>max`→max, `<0`→0); `aria-valuetext` present for custom `format`/non-100
  `max`, absent for default % at `max=100`.
- R3 (ring determinate): `variant="spinner"` + `value` renders
  `.hz-loading-spinner[role="progressbar"]` with `aria-valuenow/min/max`, **no**
  `aria-busy`, no `data-indeterminate`; the SVG `.hz-loading-ring` is
  `aria-hidden`; the `.hz-loading-ring-fill` inline `stroke-dashoffset` equals
  `100 - (clamped/max)*100` (0 → 100, max → 0, over-max clamps to 0); no spin
  animation on the ring.
- R5: `variant="dots"` + `value` dev-warns (spy on `console.warn`) and stays
  indeterminate; `variant="spinner"` + `value` does **not** warn (valid ring);
  the spinner glyph / ring SVG / dots are `aria-hidden`; accessible name on the
  wrapper.
- R6: no name dev-warns; `label` → `aria-label` on the progressbar element (bar
  / spinner-or-ring wrapper / dots); `aria-labelledby` in rest suppresses it.
- R7: `showValue` renders `.hz-loading-value` for the determinate bar (inline)
  and the determinate ring (present in the DOM, centered by the theme); a custom
  `format` drives both the readout and `aria-valuetext`; `showValue` on any
  indeterminate presentation or on `dots` renders no readout (dev-warn).
- R8 timing pin (computed style, reference theme loaded): `--hz-loading-fill`
  resolves to the active intent token across variants; `--hz-loading-speed`
  resolves to ≈ 2.4s and `--hz-loading-ease` to a timing function; a wrapper
  override changes them; the **indeterminate spinner's computed
  `animation-timing-function` is `linear` even when `--hz-loading-ease` is
  overridden** (Decision 7).
- **R8/R9 reduced-motion pin (the exception — assert it still ANIMATES):** under
  a forced `prefers-reduced-motion: reduce` context, the **indeterminate**
  spinner and dots still have a running animation (`animation-name` ≠ `none`)
  with a **longer** computed `animation-duration` than under no-preference
  (≈ 2×), and the indeterminate bar's computed `animation-name` is the pulse
  keyframes (not the sweep); the **determinate** ring/bar have no animation in
  either context — proving the slow-not-halt exception applies only to
  indeterminate, and the contrast with Skeleton.

**Unit — `src/lib/components/Skeleton.svelte.spec.ts`:**
- R9/R10: root `.hz-skeleton[aria-hidden="true"]` with `data-variant`/
  `data-animation`/`data-rounded`; each variant's default inline `width`/
  `height`/`rounded`; overrides (number → `px`, string verbatim); circle forces
  `data-rounded="full"` and squares when only one dimension is given.
- R11: `text` + `lines=3` renders three `.hz-skeleton-line`; the last uses
  `lastLineWidth`; `lines` ignored for non-text variants; `lines=0` clamps to 1
  and dev-warns.
- R12: `data-animation` reflects the prop; `animation="none"` sets it to `none`.
- **R12 reduced-motion pin (halts — the opposite of Loading):** under a forced
  `prefers-reduced-motion: reduce` context, `.hz-skeleton` / `.hz-skeleton-line`
  has **no** running animation, for both `shimmer` and `pulse`.
- R13: `aria-hidden="true"` by default; a rest `aria-hidden={false}` overrides
  it.

**Button — R19:** an assertion in `Button.svelte.spec.ts` that under a forced
`prefers-reduced-motion: reduce` context the loading `.hz-icon` **still runs**
`hz-spin` with a much longer computed `animation-duration` (not `none` / `0s`),
with Button's `aria-busy`/`data-state="loading"` semantics unchanged.

**Exports/theme:** `exports.spec.ts` resolves `Loading` and `Skeleton` from
`$lib` and smoke-renders each (R15); the old `Progress` symbol no longer
resolves. `hooks.spec.ts` passes with the two entries and the bumped
`toHaveLength(45)` (R16). No token drift (no new global tokens — `--hz-loading-*`
are component hooks derived from the existing `--hz-duration-*` / `--hz-ease-*`
scales; the ring fraction is inline; the reduced-motion slow-factor is a private
`--_` internal; sizes are literals).

### Out of Scope

- **Radial/dial progress beyond the ring, and step/wizard/segmented progress.**
  Loading ships a linear bar, an indeterminate spinner, a determinate circular
  ring, and a three-dot loader. A gauge/dial, a stepper, or segmented progress
  are separate patterns; not planned.
- **Buffered / dual-value progress** (a played-vs-buffered media bar).
- **Auto-completion / timers / async state.** `value` is a controlled number;
  Loading never advances itself, never auto-hides at 100%, and starts/stops no
  timers. Fetching and completion are the app's job.
- **A spinning determinate ring.** The determinate ring is a **static** arc by
  design (its position *is* the information); it does not also rotate.
- **Toast / snackbar loading overlays.** Deliberately not planned (the Banner
  spec's product decision against timed self-dismissing overlays stands).
- **A "card skeleton" / preset-composition prop.** Composed from multiple
  Skeletons (Decision 3), demonstrated by the card / table / prose worked
  examples in the docs (R17), not baked into the API.
- **Sharing one `hz-spin` keyframes definition across sheets** (Decision 4) —
  each sheet stays self-contained; promotion to `base.css` is explicitly not
  done, because CSS is not tree-shaken and the aggregate `theme.css` dedupes the
  duplicate anyway.
- **New global motion tokens for the loop length or easing.**
  `--hz-loading-speed` / `--hz-loading-ease` are component hooks derived from the
  existing `--hz-duration-*` / `--hz-ease-*` scales (R8), not new global tokens —
  no `tokens/index.ts` change, no drift-test churn.
- **A separate `--hz-loading-bar-speed` hook, or a public reduced-motion
  slow-factor hook.** The bar's calmer cadence is a fixed `1.6×` multiple of
  `--hz-loading-speed`, and the reduced-motion slowdown is a fixed ≈ 2× private
  multiplier (Decision 8/9) — one public speed hook tunes the component
  proportionally; extra hooks are unnecessary surface.
- **Extending the reduced-motion slow-not-halt exception to other components.**
  Only indeterminate Loading and Button's loading spinner get it; Skeleton and
  every other animated component keep the standard reduce-halts posture
  (Decision 9).
