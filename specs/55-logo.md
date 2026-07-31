# Logo — inline-SVG logo handler with logo-wall normalization

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Logo-Rn`) and edge case as pass/fail. Write scope: one component
> (`src/lib/components/Logo.svelte` + `Logo.svelte.spec.ts`), the barrel +
> `exports.spec.ts`, additions to the **existing** `src/lib/theme/components/
> media.css` (no new sheet, no `theme.css` edit — Logo joins Image and Video
> there), one `src/docs/hooks.ts` entry plus the `hooks.spec.ts` count bump, one
> `src/docs/data/logo.ts` + its registration in `src/docs/data/index.ts`, one
> manifest entry, and one docs page `src/routes/docs/components/logo/
> +page.svelte`. Nothing else changes.

### Goal

Ship a small headless `Logo` component that renders a **consumer-supplied raw
SVG string** at a size normalized against the logo's own aspect ratio, so a row
of differently-proportioned marks — a wide wordmark, a square badge, a tall
crest — reads as visually consistent instead of one dominating the row. With no
SVG it degrades to the logo's name as text. A **logo wall is composition, not a
component**: `Cluster` (or `Grid`) plus one `--hz-logo-size` override on the
container is the whole story.

The normalization is the point. Sizing a wall by equal height makes wide
wordmarks enormous; equal width makes tall marks vanish. Logo interpolates
between the two: the rendered width is `base × ratio^0.4`, which lands 40% of
the way from constant-width toward constant-height, and the box always carries
the mark's exact aspect ratio so nothing distorts.

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. **One file**,
  `src/lib/components/Logo.svelte`, exported from the barrel
  (`src/lib/components/index.ts`, which the package root re-exports); smoke
  assertion in `src/lib/exports.spec.ts`. No new module, no new subpath, no new
  dependency, no new token.
- **Headless / theme split.** The component owns structure and the two inline
  per-instance values the math produces (Logo-R3); **all colour and typography**
  live in the theme (Logo-R7). The component's own sizing rule reads
  `var(--hz-logo-size, 4rem)` with a literal fallback, so a fully headless
  consumer still gets normalized sizing with no theme imported.
- **The theme sheet is the existing `media.css`.** It already covers two
  components (Image, Video); Logo's rules append to it, so there is no
  `theme.css` registration to add and no new single-sheet import path. Update its
  header comment to name all three.
- **`{@html}` is a trust boundary and stays one.** Logo renders the `svg` prop
  through `{@html}` verbatim. The trust model is explicit and documented:
  **`svg` must be a static asset the consumer controls** — a `?raw` import, a
  build-time constant — never user input, never a fetched third-party string.
  The component does not sanitize, and says so (the CodeBlock `children`
  posture, spec 47 R19). What it does do is dev-warn on the two obvious misuse
  signals (Logo-R5).
- **The library cannot glob the consumer's assets.** Resolving `slug → SVG
  string` is app-side (`import.meta.glob('…/logos/*.svg', { query: '?raw' })`).
  Logo takes the string. The docs show the glob as a copyable pattern
  (Logo-R8), not as library API.
- Mirror existing patterns: `$props()` destructuring, `cx` from `$lib/utils` for
  the root class, `...rest` spread **first** so managed attributes win, dev-only
  `console.warn` guarded by `import.meta.env.DEV` + `untrack` (the
  `Image.svelte` blur-placeholder precedent, lines 53–60).
- Component `<style>` is **unlayered** and beats `@layer hz-theme`. Logo's
  structural rules set `inline-size` / `aspect-ratio` / `display`, which the
  theme never touches, so there is no conflict — but do not add colour there,
  or the theme can never override it (the Divider trap).

### Design decisions (settled — do not re-litigate)

1. **One component, no `LogoWall`.** A wall is `<Cluster gap="lg">` with
   `style="--hz-logo-size: 5rem"` around N `<Logo>`s. Normalization is per-logo
   math against a shared base size, so it needs no context, no provider, and no
   container component. `Cluster`, `Grid`, and `Stack` already exist and already
   handle gap/wrap/justify; a wall container would only re-export their props.
   Ship the composition as a docs example instead (Logo-R8).
2. **Raw string prop, not a snippet.** The intrinsic size is parsed **from the
   string** (Logo-R2), which is what makes SSR-correct sizing with no
   post-mount measurement or layout shift possible. A snippet or a rendered-DOM
   measurement would force a client-only reflow and lose SSR. So: `svg?: string`.
3. **Normalization ships as component behaviour only — no exported utility.**
   The measure + exponent math is ~15 lines living in `Logo.svelte`. Exporting
   it would be a public surface with one caller and one consumer use case nobody
   has asked for yet. It is fully observable (and testable) through the two
   inline custom properties the component writes.
4. **Responsive base size is `clamp()`, not JS and not a media query.** The
   inspiration bound `window.innerWidth` to pick 64px vs 96px. The theme's
   `--hz-logo-size` default is `clamp(4rem, 8vw, 6rem)` instead: same 64→96px
   range, no JS, no resize listener, no SSR mismatch, and no media query (this
   library's theme sheets use container queries or fluid values, never
   `@media (min-width)`). A consumer overriding `--hz-logo-size` on the wall
   container replaces it wholesale.
5. **Docs placement: Components → Media**, beside Image, Lightbox, and Video.
   Logo is an SVG media handler, not a common control.
6. **`brightness` is a prop that writes the CSS hook; the exponent is a
   constant, not a prop.** The inspiration's per-logo `brightness` nudge stays a
   prop (`brightness?: number`), because real walls are driven from config
   arrays like `{ slug: 'twitter', name: 'Twitter', scale: 0.7, brightness: 0.9 }`
   and both calibration knobs must sit at the same level. The prop stamps
   `--hz-logo-brightness` inline **only when it differs from `1`**, so a wall
   container can still set the hook in CSS for every logo that did not opt out
   (Logo-R7). The `0.4` exponent stays an internal constant: no wall has needed
   a different curve, and `scale` is already the geometric calibration knob.
7. **`scale` stays a prop.** It is the calibration knob a wall's maintainer
   reaches for constantly — optical weight is something the formula cannot see
   (a thin wordmark reads smaller than a solid block at identical geometry).

### Props

| Prop         | Type      | Default | Rationale |
| ------------ | --------- | ------- | --------- |
| `name`       | `string`  | _required_ | The brand name. Serves three jobs: the accessible name of the SVG (Logo-R4), the visible text when there is no `svg` (Logo-R6), and the thing a consumer's config already carries. Required because it is load-bearing beyond a11y — hence the divergence from Icons (`ariaLabel` optional) and Image (`alt=''` for decorative), which use name-absence to mean decorative. Logo uses an explicit `decorative` flag instead. |
| `svg`        | `string`  | — | Raw SVG markup, rendered verbatim through `{@html}`. **Trusted consumer-controlled static content only** (Logo-R5). Absent → the text fallback (Logo-R6). |
| `scale`      | `number`  | `1` | Per-logo multiplier applied on top of the normalized width — the optical-weight knob (Decision 7). `1.15` for a thin wordmark that reads small; `0.85` for a heavy block that dominates. |
| `brightness` | `number`  | `1` | Per-logo `filter: brightness()` nudge for a mark that sits too dark or too light against the surface. Stamped inline as `--hz-logo-brightness` only when ≠ `1`, so a container-level CSS override of the hook still reaches every logo that did not set it (Decision 6). |
| `decorative` | `boolean` | `false` | The surrounding text already names the brand: the root becomes `aria-hidden="true"` and carries no `role`/`aria-label` (Logo-R4). |
| `monochrome` | `boolean` | `true` | Recolour the mark to one colour (`fill: var(--hz-logo-color, currentColor)`, Logo-R7) — the logo-wall default. `false` keeps the SVG's own colours for a brand mark that must render as authored. |
| `class`      | `string`  | — | Merged after `hz-logo` via `cx`. |

Plus arbitrary `...rest` forwarded onto the root; `...rest` spreads **first** so
managed attributes (`class`, `role`, `aria-*`, `data-*`, `style`) win.

### API sketch (normative)

```svelte
<!-- Standalone -->
<Logo name="Acme" svg={acmeSvg} />

<!-- A wall: one base size on the container, normalized per logo -->
<Cluster gap="lg" justify="center" style="--hz-logo-size: 5rem">
  <Logo name="Acme" svg={acmeSvg} />
  <Logo name="Globex" svg={globexSvg} scale={0.85} />
  <Logo name="Initech" svg={initechSvg} />
</Cluster>

<!-- No asset yet: the name renders as text -->
<Logo name="Soylent" />

<!-- Brand colours preserved; muted through the colour hook -->
<Logo name="Acme" svg={acmeSvg} monochrome={false} />
<Logo name="Acme" svg={acmeSvg} style="--hz-logo-color: var(--hz-color-text-muted)" />
```

### Requirements

1. **Logo-R1 — Structure.** The root is a
   `<span class="hz-logo" {...rest} …>` (a `span`, not a `div`, so a logo drops
   cleanly inside an `<a>`, a heading, or a flex bar) carrying:
   - `data-fallback` — present exactly when no `svg` is supplied (Logo-R6);
   - `data-monochrome` — present exactly when `monochrome` is true (the default);
   - the inline custom properties from Logo-R3 (SVG branch only), plus
     `--hz-logo-brightness: <brightness>` in **either** branch when the
     `brightness` prop is not `1` (Decision 6);
   - the a11y attributes from Logo-R4.

   Its single child is either `{@html svg}` or, in the fallback branch, a
   `<span class="hz-logo-text">{name}</span>`. Nothing else: no wrapper layers,
   no caption, no link. The component is SSR-safe — no browser globals at module
   scope, no `$effect`, no measurement of rendered DOM; everything is derived
   from the props at render, so the server output is byte-identical to the
   client's and there is no layout shift.

2. **Logo-R2 — Intrinsic size from the string.** A pure function derives
   `{ width, height }` from the `svg` markup, in this precedence:
   1. **`viewBox`** — the attribute's four numbers split on whitespace and/or
      commas; take the 3rd and 4th (`min-x min-y width height`).
   2. **`width` / `height` attributes** — the leading number of each. A value
      whose unit is `%` is unusable and is skipped (a percentage carries no
      ratio); other units (`px`, `pt`, none) are read as bare numbers, since only
      their ratio is used.
   3. **`1 × 1`** — the fallback: a square.

   Any result that is not two finite numbers `> 0` falls back to `1 × 1`. The
   parse is a string parse (regex), **never** `DOMParser` or an element — it must
   run identically during SSR. `ratio = width / height`.

3. **Logo-R3 — Normalization (the math), written as two inline custom
   properties.** With `EXPONENT = 0.4` (an internal constant, Decision 6):

   ```
   widthFactor = ratio ** 0.4 × scale
   ```

   The component stamps, inline on the root:
   - `--hz-logo-ratio: <ratio>` — the measured aspect ratio;
   - `--hz-logo-width-factor: <widthFactor>` — rounded to 4 decimal places.

   and its structural CSS resolves them:

   ```css
   inline-size: calc(var(--hz-logo-size, 4rem) * var(--hz-logo-width-factor, 1));
   aspect-ratio: var(--hz-logo-ratio, 1);
   max-inline-size: 100%;
   ```

   This is exactly the inspiration's pair of formulas —
   `width = ratio^0.4 × base` and `height = base / ratio^0.6` — because
   `width / aspect-ratio == base × ratio^0.4 / ratio == base × ratio^-0.6`.
   Expressing the second dimension as native `aspect-ratio` instead of a second
   factor means the box can never distort, and halves the numbers in the DOM.
   The JS→CSS inline-value channel is the Slider-fill precedent (per-instance
   values CSS cannot compute); `--hz-logo-ratio` and `--hz-logo-width-factor`
   are therefore **read-only outputs, not documented theme hooks** — note both in
   the `hooks.ts` "deliberately not listed" comment block.

   Worked reference values the Reviewer can check (`scale: 1`,
   `--hz-logo-size: 100px`): `viewBox="0 0 120 40"` → ratio `3`, factor
   `1.5518`, box `155.18 × 51.73px`. `viewBox="0 0 40 120"` → ratio `0.3333`,
   factor `0.6444`, box `64.44 × 193.3px`. `viewBox="0 0 64 64"` → ratio `1`,
   factor `1`, box `100 × 100px`. Note what this buys: the wide mark is 3× the
   tall mark's width but only 1.34× its height — neither dominates, and both are
   recognisable.

4. **Logo-R4 — Accessible name (SVG branch).** With an `svg` and
   `decorative` false, the root carries `role="img"` and `aria-label={name}`:
   the injected markup is treated as one graphic with one name, whatever the
   consumer's SVG contains internally. With `decorative` true, the root carries
   `aria-hidden="true"` and **no** `role` and **no** `aria-label` (an
   `aria-hidden` element with a name is a contradiction). `...rest` spreads
   first, so a consumer-supplied `aria-labelledby` in rest is overwritten by the
   managed `aria-label` — the documented way to point at existing text is
   `decorative` plus that text.

5. **Logo-R5 — Trust boundary + dev warnings.** The `svg` string is injected
   verbatim. The component performs **no sanitization** and the docs and the
   prop note say so plainly: pass only static assets you control. Two dev-only
   `console.warn`s (`import.meta.env.DEV` + `untrack`, the `Image.svelte`
   precedent), each fired once at creation, never in production, never blocking
   the render:
   - **Empty name, not decorative** — `name` is missing or whitespace-only and
     `decorative` is false: the logo has no accessible name (WCAG 4.1.2). Tells
     the consumer to pass `name` or set `decorative`.
   - **Executable content** — the `svg` string contains `<script` or an
     `on<event>=` attribute (case-insensitive): warns that Logo does not
     sanitize and that this string is being injected as-is, so it must be a
     trusted static asset. This is a smell detector for a string that came from
     the wrong place, **not** a security control, and the warning says so.

   A third, non-security check: if `svg` is a non-empty string that does not
   contain `<svg`, warn that it does not look like SVG markup (the classic
   symptom of passing a URL or a module object instead of `?raw` text). The
   component still renders it.

6. **Logo-R6 — Text fallback.** With no `svg` (undefined, empty, or
   whitespace-only), the root gets `data-fallback`, renders
   `<span class="hz-logo-text">{name}</span>`, and:
   - carries **no** `role="img"` and **no** `aria-label` — the visible text is
     already the accessible name (a `role="img"` wrapper would hide it);
   - still honours `decorative` → `aria-hidden="true"`;
   - stamps **no** `--hz-logo-ratio` / `--hz-logo-width-factor`, and its
     structural CSS resets `inline-size: auto; aspect-ratio: auto` under
     `[data-fallback]`, so the box is text-sized. Normalization does not apply
     to text and does not pretend to (documented).

7. **Logo-R7 — Theme (append to `media.css`) + hooks.** All colour and
   typography live in `src/lib/theme/components/media.css`, inside its existing
   `@layer hz-theme` block, using the house `var(--hz-…, <fallback>)` +
   `:where()` conventions. It:
   - declares the two documented hooks on `.hz-logo` (each carrying the
     `documented hook` comment the drift check keys on):
     - `--hz-logo-size` — the normalization base, default
       `clamp(4rem, 8vw, 6rem)` (Decision 4). Override it on a wall container to
       resize every logo inside at once;
     - `--hz-logo-brightness` — default `1`, applied as
       `filter: brightness(var(--hz-logo-brightness, 1))`. Usually set through
       the `brightness` prop, which stamps it inline when ≠ `1`; the hook remains
       directly settable in CSS for container-wide muting (Decision 6);
   - reads a third hook it does not declare, `--hz-logo-color`, in the
     monochrome rule: `.hz-logo:where([data-monochrome]) svg { fill: var(--hz-logo-color, currentColor); }`
     — so the default is "inherit the surrounding text colour" and a wall can
     mute itself with one override. This rule **must live in the theme, not the
     component**: it is colour, and Svelte's scoped styles cannot reach
     `{@html}` content without `:global()` anyway (the CodeBlock-R9 precedent for
     the same problem). `monochrome={false}` → no `data-monochrome` → no rule →
     the SVG's own `fill`s render as authored. Children of the SVG that declare
     their own `fill` keep it; `fill` is inherited, so the rest go monochrome;
   - styles `.hz-logo-text` (the fallback): a token font size/weight and
     `--hz-color-text`, `white-space: nowrap`, so a nameplate reads as a
     nameplate rather than body copy.

   Add a `Logo` entry to `src/docs/hooks.ts` in the **Media** band (beside
   `Image` / `Video`), documenting: `attrs` `data-fallback` (present when no svg
   — the text form) and `data-monochrome` (present by default; absent when
   `monochrome={false}`); `props` `--hz-logo-size`, `--hz-logo-brightness`
   (noting the `brightness` prop is the usual writer), `--hz-logo-color`;
   `parts` `.hz-logo-text`. Note in the "deliberately not
   listed" block that `--hz-logo-ratio` / `--hz-logo-width-factor` are inline
   per-instance outputs of the measurement, not contract.

   **Bookkeeping:** `hooks.spec.ts`'s `expect(componentPages).toHaveLength(48)`
   becomes `49`, and the tally comment gains `+ Logo (spec 55)`.

8. **Logo-R8 — Docs page, data module, manifest.** New
   `src/routes/docs/components/logo/+page.svelte` on the standard scaffold
   (`DocPage` + `Example`, live preview above an always-visible `$derived` code
   fence, consumer-facing copy — no spec numbers, no `Rn`, no test-gate talk),
   driven by a new `src/docs/data/logo.ts` exporting
   `logoDoc: ComponentDoc` (the `image.ts` shape): `importLine:
   'import { Logo } from "@hyzer-labs/ui"'`, a `props` table mirroring the Props
   section above (including the required `class` row noted **"Merged after the
   hz-logo class."**), an `a11yNote`, and `a11yLinks` (MDN `role="img"`; the WAI
   tutorial on informative vs decorative images). Register `logoDoc` in
   `src/docs/data/index.ts`.

   The page declares its demo SVGs as page-local string constants of deliberately
   varied proportion (one wide wordmark ~3:1, one square, one tall ~1:2.5, one
   with no `viewBox` — only `width`/`height`), and the fences reference them by
   name (`svg={acmeSvg}`) rather than inlining hundreds of characters of path
   data. One early fence shows what such a constant looks like, so the shorthand
   is never unexplained. Examples:
   - **Basic** — a single logo.
   - **Why normalization** — two `Cluster` rows of the same four logos: one
     forced to equal height (`--hz-logo-width-factor: 1` style override, the
     naive approach) beside the normalized default. The wide wordmark dominating
     the first row and behaving in the second is the entire pitch, visible in one
     screen.
   - **Logo wall** — a `Cluster gap="lg" justify="center"` with one
     `--hz-logo-size` override on the container.
   - **Per-logo scale and brightness** — the same wall with `scale` and
     `brightness` nudging the marks whose optical weight fights the geometry,
     driven from a config array
     (`{ slug: 'twitter', name: 'Twitter', scale: 0.7, brightness: 0.9 }`) the
     way a real site holds its logos.
   - **Colour** — `monochrome` (default) beside `monochrome={false}`, plus a
     `--hz-logo-color` muted wall.
   - **Text fallback** — a `<Logo name="…" />` with no `svg`.
   - **Resolving your assets** — a standalone code fence (guidance, not a live
     Example, so nothing to keep in sync with a render) showing the app-side
     pattern the library deliberately does not do:
     `import.meta.glob('$lib/assets/logos/*.svg', { query: '?raw', import: 'default', eager: true })`
     mapped over a `{ slug, name, scale, brightness }` config array. Prose states that the
     library takes strings because it cannot see the consumer's asset directory.
   - **In a header or footer** — one short fence showing `<Logo>` passed to
     `Header`'s `brand` snippet and `Footer`'s `logo` snippet, wrapped in a link
     to `/`, with the note that the link — not the logo — owns the click target.

   **Manifest:** add
   `{ label: 'Logo', href: '/docs/components/logo', description: … }` to the
   **Media** group in `src/docs/manifest.ts`, after `Lightbox` (keeping the
   group's alphabetical run: Image, Lightbox, Logo, Video). The description is
   required plain text — one sentence naming the inline-SVG rendering, the
   consistent sizing across differently-shaped marks, and the text fallback.

9. **Logo-R9 — Barrel export.** Add
   `export { default as Logo } from './Logo.svelte';` to
   `src/lib/components/index.ts` (beside `Image`, in the media run) so
   `import { Logo } from '@hyzer-labs/ui'` resolves. Add an assertion + smoke
   render (`.hz-logo` present) to `src/lib/exports.spec.ts` with a
   `// Logo-R9:` comment, mirroring the neighbouring entries.

### Responsive Behavior

- **Base size is fluid by default** (`clamp(4rem, 8vw, 6rem)`), so a logo grows
  from 64px at mobile widths to 96px past ~1200px with no breakpoint, no media
  query, and no JS. Overriding `--hz-logo-size` on a container — with a literal,
  another `clamp()`, or a container-query rule of the consumer's own — replaces
  that curve for everything inside.
- **Mobile (<640px).** A wall is `Cluster` with `wrap` on (its default), so
  logos reflow onto as many rows as needed; `max-inline-size: 100%` on the root
  guarantees that even a very wide wordmark at a large `--hz-logo-size` cannot
  cause horizontal page scroll — it shrinks, ratio intact, instead. Nothing
  hides, nothing truncates, no interaction pattern changes.
- **Tablet (640–1024px) / Desktop (>1024px).** Identical behaviour at a larger
  base size; a wall simply fits more logos per row. Logo has no breakpoint
  behaviour of its own, because a logo is not a layout — the container it sits in
  is, and `Cluster`/`Grid` already own that.
- Sizing uses **logical properties** (`inline-size`, `max-inline-size`), so RTL
  and vertical writing modes hold.

### Accessibility (WCAG 2.1 AA)

- **Name, role, value (4.1.2) / non-text content (1.1.1).** An informative logo
  is one `role="img"` with `aria-label={name}` (Logo-R4) — a single, correct
  announcement regardless of how many paths, groups, or stray `<title>`s the
  consumer's SVG holds. A decorative logo is `aria-hidden="true"` with no name,
  the right answer when adjacent text already says "Acme" (Logo-R4). A missing
  name on a non-decorative logo dev-warns (Logo-R5) rather than shipping a
  nameless graphic silently.
- **The fallback stays text (1.1.1 / 1.4.5).** With no SVG the name renders as
  real text with no `role="img"` wrapper, so it is selectable, searchable,
  translatable, and scales with the user's font size. Text is preferred over an
  image of text wherever it will do — this fallback is not a degraded mode so
  much as the honest one.
- **Contrast (1.4.3 / 1.4.11).** A monochrome logo inherits `currentColor`, so it
  meets whatever contrast its surrounding text already meets; the fallback text
  uses the graded `--hz-color-text` role. Two consumer-owned boundaries are
  documented rather than policed: a `monochrome={false}` brand palette (the
  brand owns its own contrast) and any `--hz-logo-brightness` /
  `--hz-logo-color` override, which can lower contrast if pushed too far —
  logos are typically non-text graphics with no contrast minimum, but a wordmark
  carrying meaning should stay legible.
- **Reduced motion.** Not applicable — Logo animates nothing, transitions
  nothing, and adds no motion for reduced-motion settings to suppress.
- **Focus.** Logo is not interactive and takes no focus. A clickable logo is a
  consumer's `<a>`/`Link` wrapping it, which brings its own focus ring; the docs
  show that composition (Logo-R8) rather than baking in an `href`.

### Edge Cases & Error States

| Case | Expected behavior |
| --- | --- |
| `svg` with a `viewBox` | Ratio from the viewBox's 3rd/4th numbers; comma- or space-separated both parse (Logo-R2). |
| `svg` with `width`/`height` but no `viewBox` | Ratio from the attributes' leading numbers, units ignored (Logo-R2). |
| `svg` with both | `viewBox` wins (Logo-R2). |
| `width="100%" height="100%"` only | Percentages carry no ratio; skipped → `1 × 1` square (Logo-R2). |
| No `viewBox`, no dimensions | `1 × 1` square; renders at exactly the base size (Logo-R2). |
| Malformed `viewBox` (`"0 0 0 0"`, `"a b c d"`, two numbers) | Falls back to `1 × 1`; the inline style contains no `NaN`, `Infinity`, or empty value (Logo-R2). |
| `svg` present but not SVG markup (a URL, a module object stringified) | Dev-warn "does not look like SVG markup"; renders the string as given, `1 × 1` (Logo-R5). |
| `svg=""` / whitespace-only | Treated as absent → the text fallback (Logo-R6). |
| No `svg` at all | Text fallback: `data-fallback`, `.hz-logo-text` with the name, no `role="img"`, no inline ratio/factor, text-sized box (Logo-R6). |
| `name=""` / whitespace, not decorative | Dev-warn (WCAG 4.1.2); still renders — an empty-labelled graphic in the SVG branch, an empty text node in the fallback branch (Logo-R5). |
| `decorative` | `aria-hidden="true"`, no `role`, no `aria-label`, in **both** branches; the fallback text is hidden from AT too (Logo-R4/R6). |
| `svg` contains `<script` or an `on…=` attribute | Dev-warn that Logo does not sanitize and this is being injected as-is; renders it (Logo-R5). Not a security control. |
| `scale={0}` or negative | Multiplies through honestly: the box collapses (`0`) or the factor goes negative and `inline-size` resolves invalid, leaving the box at its intrinsic size. Not clamped and not warned — `scale` is a numeric knob, and a nonsense value is visible instantly. Documented as "a positive multiplier, typically 0.7–1.3". |
| Very wide mark (ratio 8:1) in a narrow container | `max-inline-size: 100%` shrinks it; `aspect-ratio` keeps the height in step, so it never distorts and never causes horizontal scroll (Logo-R3). |
| `--hz-logo-size` overridden on an ancestor | Every logo inside rescales proportionally; relative sizes across the wall are unchanged (Logo-R7). |
| `monochrome={false}` | No `data-monochrome`, no `fill` rule, the SVG's own colours render as authored (Logo-R7). |
| Monochrome mark whose children declare their own `fill` | Those children keep their fill (an inherited property cannot override a declared one); everything else takes `currentColor`. Documented, with `monochrome={false}` as the escape (Logo-R7). |
| No theme imported (headless) | Sizing still normalizes — the component's own rule falls back to `var(--hz-logo-size, 4rem)`. No monochrome recolour, no fallback typography: those are the theme's (Logo-R7). |
| SSR / prerender | Identical markup to the client: the measurement is a string parse with no DOM, no `$effect`, and no browser global, so there is no hydration mismatch and no layout shift (Logo-R1). |
| `...rest` collides with `class` / `role` / `aria-label` / `style` | The component-managed value wins (`...rest` spreads first). A rest `style` is replaced by the managed one carrying the inline factors. |
| Logo inside `Header`'s `brand` / `Footer`'s `logo` snippet | Works unchanged — both are plain snippets; the `span` root sits inside their flex boxes without a wrapper (Logo-R8). |

### Existing Code to Reuse

- **`cx`** from `$lib/utils` for the root class (every component's precedent).
  **No `uid`** — Logo mints no ids.
- **`src/lib/components/Image.svelte`** — the closest sibling and the template
  to follow for: the `$props()` + `...rest`-first shape, the
  `import.meta.env.DEV` + `untrack` dev-warn block (lines 53–60), the
  `data-*`-on-the-root convention, and the structural-CSS-only `<style>`.
  **Do not copy its `import { browser } from '$app/environment'`** (line 3) —
  that import violates the `src/lib` no-SvelteKit rule in `AGENTS.md` and is a
  pre-existing wart, not a pattern. Logo needs no browser check at all.
- **`src/lib/theme/components/media.css`** — the sheet to extend (Image and
  Video already share it); its `:where()` + `var(--hz-…, <fallback>)` style is
  the house convention to match.
- **The Slider fill inline-value channel** (`--hz-slider-fill*`, written inline
  by the component; see the `hooks.ts` "deliberately not listed" block) — the
  precedent for `--hz-logo-ratio` / `--hz-logo-width-factor` being inline
  outputs rather than documented hooks.
- **`src/lib/components/CodeBlock.svelte`** (spec 47 R9/R19) — the precedent for
  framing `{@html}` content the component does not own: the consumer owns the
  markup and its trust, the library only frames it, and a rule that must reach
  injected content lives in the theme sheet rather than a scoped `<style>`.
- **`src/lib/components/Cluster.svelte`** (and `Grid`) — the wall container. Its
  `gap`/`justify`/`align`/`wrap` props are the wall's API; the docs example uses
  them rather than introducing a container.
- **`src/lib/components/Header.svelte`** (`brand` snippet) and
  **`Footer.svelte`** (`logo` snippet) — the two existing slots a Logo drops
  into; the docs composition example targets them.
- **Docs scaffold:** `src/docs/data/image.ts` + `src/routes/docs/components/image/+page.svelte`
  as the copy-from template; `ComponentDoc` from `src/docs/data/types.ts`; the
  `Image` / `Video` entries in `src/docs/hooks.ts` for the Media-band entry shape.
- **`src/lib/components/Skeleton.svelte.spec.ts`** — the shape to mirror for the
  new unit spec (browser project, `vitest-browser-svelte`, one small render per
  assertion group).

### Test Plan

Runners already in the repo: **Vitest**, two projects — `client` (real Chromium
via the browser project, matching `src/**/*.svelte.{test,spec}.ts`) and `server`
(node, no DOM) — plus **Playwright** e2e in `src/routes/docs.e2e.ts` (kill port
4173 before serving a fresh build).

**Unit — `src/lib/components/Logo.svelte.spec.ts` (client):**

- **Structure (R1).** Root `span.hz-logo`; with an `svg` the injected `<svg>` is
  present in the DOM; `data-monochrome` present by default and absent with
  `monochrome={false}`; `data-fallback` absent in the SVG branch.
- **Measurement + math (R2/R3), the load-bearing assertions.** For each input,
  read the root's inline style and assert both values:
  - `viewBox="0 0 120 40"` → ratio `3`, factor `1.5518`;
  - `viewBox="0,0,40,120"` (comma-separated) → ratio `0.3333`, factor `0.6444`;
  - `viewBox="0 0 64 64"` → ratio `1`, factor `1`;
  - `width="200" height="50"` with no `viewBox` → ratio `4`, factor `1.7411`;
  - both present → the `viewBox` values win;
  - `width="100%" height="100%"` → ratio `1`, factor `1`;
  - no `viewBox`/dimensions → ratio `1`, factor `1`;
  - `viewBox="0 0 0 0"`, `viewBox="a b c d"`, `viewBox="0 0 10"` → ratio `1`,
    factor `1`, and the style string contains no `NaN`/`Infinity`.
  Compare factors to 4 decimal places.
- **`scale` (R3).** `scale={0.5}` on the 3:1 mark halves the factor
  (`0.7759`) and leaves `--hz-logo-ratio` at `3` — proving scale never
  distorts.
- **`brightness` (R1/Decision 6).** `brightness={0.9}` stamps
  `--hz-logo-brightness: 0.9` inline (both branches); the default `1` stamps
  nothing, so the style string contains no `--hz-logo-brightness`.
- **Resolved geometry (R3/R7), one end-to-end pin.** With the reference theme
  loaded and a wrapper carrying `--hz-logo-size: 100px`, the computed
  `inline-size` of a 3:1 logo is ≈`155.18px` and its computed block size
  ≈`51.7px`. This is the single check that fails if the measurement, the
  exponent, the inline properties, or the CSS `calc`/`aspect-ratio` chain
  breaks anywhere.
- **A11y (R4).** SVG branch: `role="img"` and `aria-label` equal to `name`, no
  `aria-hidden`. `decorative`: `aria-hidden="true"`, no `role`, no `aria-label`.
  A rest `aria-labelledby` does not displace the managed `aria-label`.
- **Fallback (R6).** No `svg` → `data-fallback` present, `.hz-logo-text`
  containing the name, no `role="img"`, no `--hz-logo-ratio` /
  `--hz-logo-width-factor` in the style, and computed `aspect-ratio` is `auto`.
  `decorative` in the fallback branch still yields `aria-hidden="true"`.
- **Dev warnings (R5), `console.warn` spied.** Warns once for: empty/whitespace
  `name` without `decorative`; an `svg` containing `<script`; an `svg`
  containing `onload=`; an `svg` with no `<svg` substring. Does **not** warn for
  a well-formed logo, and does not warn for an empty `name` when `decorative`.
  Every warning path still renders.
- **Class / rest.** `class` merges after `hz-logo`; an arbitrary rest attribute
  forwards to the root; a colliding managed attribute wins.

**Exports (`src/lib/exports.spec.ts`, server + smoke):** `Logo` resolves from
`$lib` and smoke-renders with `.hz-logo` present (R9).

**Docs registry:** `hooks.spec.ts` green with the new `Logo` entry and the
bumped `toHaveLength(49)` — its no-fiction suites confirm `data-fallback` /
`data-monochrome` are stamped in the component source, `--hz-logo-size` /
`--hz-logo-brightness` / `--hz-logo-color` appear in `media.css`, and
`.hz-logo-text` exists. `data.spec.ts` green with `logoDoc` registered and its
prop names matching the component's props, including the `class` row note.

**e2e (`src/routes/docs.e2e.ts`, Playwright):** the manifest-driven sweep picks
up `/docs/components/logo` with no edit — one `<h1>`, skip link first, and **no
horizontal overflow at any of the three viewports**, which is the real assertion
for the wall examples (a wide wordmark at a large base size must shrink, not
scroll).

### Out of Scope

- **A `LogoWall` component** (Decision 1). A wall is `Cluster`/`Grid` plus one
  `--hz-logo-size` override, shown as a docs example. No container, no context,
  no provider.
- **Everything else from the inspiration section:** the cursor store and its
  hover interactions, the reveal/entrance actions, and the page-specific
  section/grid CSS. Motion is the `motion` module's job (`reveal` composes over
  a wall already); the section chrome is the app's.
- **Asset resolution of any kind.** No `import.meta.glob`, no slug→file map, no
  `fetch`, no `src` URL mode, no filesystem access. Logo takes a string; the
  consumer's glob or `?raw` import produces it (Logo-R8 documents the pattern).
- **Raster logos.** A PNG/JPG/WebP mark is `Image` — it has intrinsic
  dimensions the browser already knows and needs no normalization. Logo is
  inline SVG (or text) only, and the docs cross-link Image.
- **Sanitizing or normalizing the SVG.** No DOMPurify, no attribute allow-list,
  no id-collision rewriting, no `viewBox` injection. The consumer owns the
  markup and its trust; the component frames it and dev-warns on the obvious
  smells (Logo-R5). A consumer accepting untrusted SVG must sanitize before it
  reaches Logo, and the docs say exactly that.
- **A tunable exponent** (Decision 6). The `0.4` exponent is an internal
  constant. Revisit only if a real wall needs a different curve.
- **`href` / a built-in link, and a `title`/caption.** Wrap Logo in a `Link` or
  an `<a>`; the docs show it. The link owns the click target, the focus ring, and
  the `aria-label` for "home".
- **Automatic light/dark logo swapping.** A consumer picks which string to pass;
  `monochrome` + `--hz-logo-color` covers the common case (a single-colour mark
  that follows the text colour into dark mode) with no API at all.
- **Loading states, lazy loading, error states.** The SVG string is already in
  the bundle by the time Logo renders — there is nothing to await, nothing to
  fail, and no state machine (contrast `Image`'s `data-state`).
- **Vertical/inline stacking of a mark and a wordmark**, animated logos, and
  sprite-sheet `<use>` references. One mark per Logo.

---

## Amendments (post-review, 2026-07-30) — normative, supersede the sections above where they conflict

### A1 — `--hz-logo-size` / `--hz-logo-brightness` must be overridable from a container (adjudicates the R7 contradiction)

R7 as written was internally inconsistent: declaring the default **on `.hz-logo`**
means a declared value beats the inherited one, so the container override the
hook exists for can never work. Adjudication:

- `media.css` declares the size default at **root scope**, inside the existing
  `@layer hz-theme` block: `:root { --hz-logo-size: clamp(4rem, 8vw, 6rem); }`
  (keeping the `documented hook` comment). It inherits into every logo, and a
  wall container's `style="--hz-logo-size: 5rem"` now shadows it for everything
  inside.
- The `--hz-logo-brightness: 1` **declaration is removed**. The hook becomes
  read-only, like `--hz-logo-color`: the theme only reads it,
  `filter: brightness(var(--hz-logo-brightness, 1))`. The `brightness` prop
  still stamps it inline when ≠ 1 (inline beats everything), and a container
  can now set it in CSS for a whole wall.
- The component's own fallback `var(--hz-logo-size, 4rem)` is unchanged (the
  headless story).
- **Test:** add a unit assertion that sets `--hz-logo-size` on an **ancestor
  wrapper element** (not inline on the logo) and verifies the computed
  `inline-size` scales — the case the existing geometry pin misses.

### A2 — Optional snippet children as the SVG source (new, Logo-R10)

`children?: Snippet` becomes an alternative way to supply the mark:

```svelte
<Logo name="Acme">
  <svg viewBox="0 0 120 40">…</svg>
</Logo>
```

- **Precedence:** if both `svg` and `children` are given, `svg` wins and a
  dev-only warning names the conflict. Neither given → the text fallback
  (Logo-R6) exactly as today; `data-fallback` means "neither source".
- **Behavior parity:** a11y (Logo-R4), `monochrome` (the theme's descendant
  `svg` selector already reaches snippet content), `brightness`, `scale`, and
  the structural sizing rule all apply identically to the children branch.
- **Measurement:** a snippet cannot be introspected during SSR. In the children
  branch the component uses a Svelte attachment on the root that, on mount,
  reads the first descendant `<svg>` element's `viewBox` / `width` / `height`
  **attributes** (same precedence and validation as Logo-R2's string parse; an
  attribute read, never layout measurement) and stamps the same
  `--hz-logo-ratio` / `--hz-logo-width-factor` custom properties. Before the
  attachment runs (SSR and first paint) the structural CSS falls back to
  ratio 1 / factor 1: the logo occupies a square at the base size, then takes
  its true proportions at hydration.
- **Docs:** the children form appears beside the prop form with one honest
  sentence on the tradeoff: the string prop is sized correctly in the server
  HTML; the children form settles after hydration. Reach for children for
  ergonomics, the prop when SSR-perfect sizing matters.
- **Warnings:** the executable-content and not-SVG sniffs (Logo-R5) apply only
  to the string prop — snippet content is compiled Svelte markup the consumer
  already owns. The empty-`name` warning applies in every branch.
- **Tests (browser project):** children branch renders the snippet SVG inside
  `span.hz-logo`; after mount the two custom properties match the Logo-R2
  reference values for the snippet's `viewBox`; `scale` multiplies the factor;
  both-sources conflict warns and renders the `svg` prop; `decorative` and
  `monochrome` behave as in the prop branch; no `data-fallback`.

### A3 — Docs page restructure (supersedes the Logo-R8 example list; owner-directed)

- **Demo marks become real logos.** Four fictional-brand SVGs with genuinely
  disparate silhouettes replace the labeled-box approximations: a wide
  letterform-style wordmark (~3:1), a circular badge mark (~1:1), a tall
  shield/crest (~1:2.5), and one mark carrying only `width`/`height`
  attributes (no `viewBox`). Marks are authored with `currentColor`/no `fill`
  attributes so `monochrome` visibly bites; exactly **one** mark keeps a
  hard-coded brand `fill` as the deliberate illustration of
  `monochrome={false}` and the declared-fill escape hatch on the Color tab.
- **Basic and "Why normalization" merge into the first tab** — the comparison
  is the pitch and surfaces immediately. The naive row is **hand-rolled
  equal-height plain `<svg>` elements** (a page-local class; e.g. every mark at
  the same fixed height, width auto), because an inline-stamped factor cannot
  be overridden from outside — the fence must show exactly the hand-rolled
  markup that renders (the identical-rows defect).
- **Logo wall prose:** "Cluster (or Grid, Carousel, …) plus one override on the
  container."
- **Text fallback prose:** add a reminder to get the real brand asset in place,
  and that the interim text can be styled via the `class` prop /
  `.hz-logo-text`.
- **"Resolving your assets" leads with the direct import**:
  `import acmeSvg from '$lib/assets/acme.svg?raw'` passed straight to the
  prop, with the missing-`?raw` URL mistake called out (it triggers the
  not-SVG dev warning). The `import.meta.glob` + `{ slug, name, scale,
  brightness }` config-array pattern stays as the many-logos variant.
- **Children example** per A2.

### A4 — Source hygiene

No spec numbers, `Rn`/`Logo-Rn`, or `Decision n` citations in `src/lib`
component source or docs route pages (the repo stripped these deliberately;
keep the reasoning, drop the identifiers). Test files may cite specs.

### A5 — Consumer `style` merges instead of being replaced

The Props table (§Props), the API sketch (§API sketch), and the edge-case
table row "`...rest` collides with `class` / `role` / `aria-label` /
`style`" (§Edge Cases & Error States) describe `style` as forwarded through
`...rest` and replaced outright by the managed style when both are present.
That is superseded: `style` is now a first-class prop, merged after the
managed `--hz-logo-*` custom properties, so a consumer's declaration wins on
any collision rather than being dropped. Every other `...rest` collision
(`class`, `role`, `aria-*`, `data-*`) is unchanged — the managed value still
wins. This fixes a library-wide defect (discovered via `<Grid>`, where a
consumer `style` prop was silently dropped because rest was spread ahead of
the component's own managed `style` attribute) that also affected Logo,
Image, and Skeleton; all four now merge consumer `style` the same way.
