# 64 — Migration follow-ups: tunable collapse thresholds, a Toc entry hook, an aliasable density scale

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. Every design choice below is
> settled (maintainer review, 2026-08-03); the `Decided:` tails record the
> option that was rejected, so nobody relitigates it mid-build.

### Goal

Close the three API gaps a real consumer migration (heffner.dev, 2026-08-03)
hit: a Header/Toc collapse threshold that cannot follow a retuned width scale, a
Toc with no way to relabel one entry, and a density ladder that cannot be
aliased to an outside spacing scale. Three independent items, one spec because
they are one migration's worth of API design; each ships and reviews on its own.

### Context & conventions

- **The literal-px rule is real and stays.** `@container` / `@media` conditions
  cannot read custom properties. `src/lib/tokens/tokens.css` already documents
  this ("Grid's BAND breakpoints … stay literal system constants"), and
  `Header.svelte` (container queries, 640/968/1200), `Toc.svelte` (media
  queries, same three) and `table.css` all live under it. The consumer that
  retuned `--hz-width-sm` to `668px` is therefore stuck at 640 with no prop, no
  token, and no CSS override that reaches it.
- **The house already has the var-driven escape where one is possible.**
  `Split.svelte` uses the flex "switcher" (`flex-basis: calc((var(--_threshold)
  - 100%) * 999)`) precisely so `--hz-width-*` retunes when it stacks. That
  trick reflows; it cannot toggle `display`, so it does not transfer to
  Header/Toc (Non-goals).
- **`hyzer generate` owns `tokens.css`.** Item C's CSS change is a change to
  `densityBlock()` in `src/lib/config/generate.ts`, not a hand edit; the
  committed sheet is regenerated and drift-tested.
- **The same migration's "second reach-in class" gap is already closed
  elsewhere** — Header gained `navItemClass`, forwarded to both Navs as Nav's
  new `itemClass` prop, on the migration punch-list branch. Not a requirement
  here; this spec may assume it exists and must not re-spec or disturb it.
- **Nothing here changes a default.** Every requirement is additive; the
  existing string unions, the existing Toc rendering, and every computed
  distance stay exactly as they are.

---

## Item A — Tunable collapse thresholds (Header, Toc)

**R1 — `mobileBreakpoint` accepts a number of px.** `Header`'s prop type becomes
`'sm' | 'md' | 'lg' | 'none' | number`. Default stays `'md'`; the four string
values keep today's behavior byte-for-byte (container queries, zero JS). A
number opts into measured mode: the header collapses while its **own inline
content-box width is strictly less than** the number and expands at `>=` it —
matching `@container (min-width: X)` semantics exactly, so `640` and `'sm'`
produce the same result at every width.

- Measurement uses the library's own `resize` attachment
  (`src/lib/observers/resize.ts`) with **no `box` option**, so `contentRect` is
  the measured box — the same box a size container query evaluates.
- The attachment is created only in measured mode: `$derived(mode === 'custom' ?
  resize(onMeasure) : () => {})`, applied with `{@attach …}` on the `<header>`.
  String mode creates no observer.

*Decided:* a typed numeric prop, **not** a `--hz-header-breakpoint` custom
property read via `getComputedStyle` — that needs the same JS plus unit parsing
and a forced style read, and is invisible to types and to SSR.

**R2 — No layout jump before or during hydration.** In measured mode the
component renders — server-side, and until the first measurement lands —
`data-mobile-breakpoint="<fallbackTier>"`: the built-in tier whose literal
threshold is closest to the number (`|640 − n|`, `|968 − n|`, `|1200 − n|`; ties
go to the smaller). A no-JS or pre-hydration page therefore gets today's
container-query behavior at the nearest built-in threshold — never worse than
today — and the only band where the measured answer differs is between the
number and its nearest tier (668 → `sm`, a 28px band).

On the first `ResizeObserver` delivery — which the HTML rendering steps deliver
**before paint**, so the swap is not a visible flash — the component flips one
piece of `$state`, and both attributes change in that same update, atomically:

| | pre-measure (SSR + first hydrated render) | post-measure |
| --- | --- | --- |
| `data-mobile-breakpoint` | the fallback tier (`sm`/`md`/`lg`) | `custom` |
| `data-collapsed` | absent | present iff width < number |

`custom` deliberately matches none of the tier rules, so exactly one of the two
rule sets is live at any moment and there is no `!important` interlock to reason
about.

*Decided:* the attribute **swap**, not a `data-measured` flag alongside a live
tier; and **nearest** tier by absolute delta (ties → smaller), not "largest tier
`<=` n", because nearest minimizes the pre-hydration mismatch band in both
directions.

**R3 — CSS: three added selectors, no new rule blocks, no new `!important`.**
`[data-collapsed]` joins the three existing collapsed-state selector lists in
`Header.svelte`'s style block — the bar-nav `display: none`, the toggle
`display: flex`, and the `margin-inline-start: auto` on `.hz-header-actions`
(whose comment already explains why it exists). Nothing is added inside the
`@container` blocks, and the drawer needs no new rule: with
`data-mobile-breakpoint="custom"` the base `[data-state]` rules already own
drawer visibility.

**R4 — Measured-mode state hygiene and input validation.**

- Changing the number at runtime re-evaluates against the last measured width
  without re-creating the observer (the width is `$state`, collapse is
  `$derived`).
- Going from collapsed to expanded sets `mobileOpen = false`, so an open drawer
  cannot survive an expand. The container-query path hard-hides the drawer with
  `display: none !important`; measured mode has no such hammer, and a drawer
  left open behind a hidden toggle (with `aria-expanded="true"`) is the bug that
  would replace it.
- A number that is not finite, or `<= 0`, is treated as `'none'` and
  `console.warn`s once under `DEV` only, naming the prop and the received value
  (the dev-warning misuse policy: a silently never-collapsing header is
  otherwise invisible). *Decided:* `'none'`, **not** a fall back to the `'md'`
  default — that would silently invent a collapse the consumer never asked for.

**R5 — Toc generalizes the prop shape, not the implementation.** `Toc`'s
`breakpoint` prop takes the same `'sm' | 'md' | 'lg' | 'none' | number` union
(default `'none'`). Toc's threshold is the **viewport**, not the component box —
its own rail is narrow at every page width, which its style-block comment
already states — so measured mode there uses `MediaQuery` from
`svelte/reactivity` (``new MediaQuery(`min-width: ${n}px`, false)``), constructed
in a `$derived` so a changed prop re-queries. No `ResizeObserver`, no new
dependency, and `matchMedia` answers synchronously at hydration, so there is no
measurement frame at all.

Attribute contract, matching R2's shape but not colliding with Toc's existing
`data-collapsed` (which already means "panel closed"):

| | pre-measure | post-measure |
| --- | --- | --- |
| `data-breakpoint` | the fallback tier | `custom` |
| `data-narrow` | absent | present iff viewport < number |

`[data-narrow]` joins the three existing collapsed-state selector lists (trigger
shown, title hidden, `[data-collapsed]` panel hidden), and `data-collapsed`'s
condition changes from `breakpoint !== 'none'` to "this Toc can collapse at all"
(a tier, or a valid number). R4's validation applies verbatim.

*Decided:* Toc ships in this spec rather than later — two sibling collapse props
where one accepts a number and the other rejects it is the asymmetry that gets
filed as a bug a month later.

**R6 — The literal tables cannot drift from the queries.** Each component keeps
its own three-entry tier table (`640` / `968` / `1200`) in its own module, next
to its own query rules — Header's are container queries, Toc's are media
queries; the same numbers today, but separate contracts, and this is already how
the CSS stores them. A server-project source-scan spec (the
`src/lib/components/parallax.spec.ts` / `horizontal-scroll.spec.ts` precedent)
reads both `.svelte` files and asserts every `min-width:` literal in the style
block appears in that file's tier table and vice versa. Failure names the file
and the mismatched value.

**R7 — Docs.** Consumer framing throughout — no spec numbers, no R-numbers, no
test-gate or process language.

- `src/docs/data/header.ts` and `src/docs/data/toc.ts` prop rows: the type gains
  `| number`; the note gains "…or a px number, measured at runtime, for a
  retuned width scale."
- `src/routes/docs/components/header/+page.svelte` and `…/toc/+page.svelte`: one
  short paragraph each — the named tiers are CSS-only and free; a number costs a
  resize/media listener and is the answer when you have retuned `--hz-width-*`;
  before hydration a number behaves as its nearest named tier.
- `src/routes/docs/foundation/spacing/+page.svelte`, "Width / breakpoint tokens":
  the sentence naming the literal-px exception adds Header/Toc to the list and
  points at the numeric prop as the way out.

---

## Item B — A per-entry render hook on Toc

**R8 — An `entry` snippet replaces link content only.** `Toc` gains `entry?:
Snippet<[TocEntry, boolean]>`, rendered inside the existing `<a
class="hz-toc-link">` in place of `{node.label}`. Arguments: the entry, and
whether it is the active one (`active === node.id`, the same expression that
drives `aria-current`). Absent, rendering is exactly today's `{node.label}`. It
applies at every nesting depth, children included.

The snippet receives a **freshly constructed flat `{ id, label, level }`**, never
the internal `TocNode`. `TocNode` carries `children`, and `children` is the
snippet-prop name in Svelte — a consumer spreading `{...entry}` onto a component
would silently pass a `TocNode[]` as `children`. The public `TocEntry` in
`src/lib/types/index.ts` stays flat and unchanged.

*Decided:* the prop is named `entry` (it matches `TocEntry` and the `entries`
collection; `link` would imply you are replacing the `<a>`, which you are not),
and it is a snippet rather than a `transform: (entries) => entries` prop — see
Non-goals for why a transform cannot be made safe here.

**R9 — The component keeps every wire it owns.** With a snippet supplied, the
`<a>` still carries `href="#id"`, `class="hz-toc-link"`, `data-level`,
`aria-current="location"` when active, and the `onLinkClick` handler; collection,
`minEntries`, the tree build, the scroll-spy, `headingEls`, and the mobile
disclosure are untouched. The snippet cannot add, remove, reorder, or re-target
entries — only change what the link says.

**R10 — Docs.** `src/docs/data/toc.ts` gains the `entry` snippet row
(`Snippet<[TocEntry, boolean]>`, both arguments documented). The Toc docs page
gains one Example: relabelling the first entry (the migration's actual case) and
appending a "current" marker via the second argument, with a one-line
accessibility note — the snippet is the link's accessible name, so it must render
text, or something with a text alternative.

---

## Item C — Bring your own spacing scale

Current shape (`densityBlock()` in `src/lib/config/generate.ts`): four rules,
`body` then `body [data-density-shift]` ×3, each hard-declaring
`calc(var(--hz-density) * N)` for `near` and `away`. Consequences today:

- `:root { --hz-space-near: … }` **never** wins — not on specificity, but
  because `body`'s declaration applies to a nearer element.
- `body { --hz-space-near: … }` after the import **does** win at the body level
  (same element, later source order) — but the three shift levels then clobber
  it, so any consumer who uses `data-density-shift` must mirror all four
  selectors verbatim, pinning the internals of a generated file.
- Overriding `--hz-density` alone only rescales proportionally; it cannot alias
  the two distances to an arbitrary outside scale.

**R11 — Surface one rung per ladder depth, and let every level reference them.**
The multipliers in `density.levels` (`src/lib/tokens/index.ts`) are the 1-2-5-10
rhythm — `{near: 10, away: 20}`, `{5, 10}`, `{2, 5}`, `{1, 2}` — and the ladder's
own rule is that **a level's `away` equals the next-shallower level's `near`**.
Four numbers, one per depth, therefore describe the whole walk.

The four public rung names are **depth-keyed and 1-based**, named by position in
the walk rather than by multiplier value: `--hz-density-ladder-depth-1` …
`--hz-density-ladder-depth-4`, where **depth-1 is the unshifted body level** (the
1-based naming is why `body` is "depth 1", not "depth 0"). The mapping, stated
once so the names are unambiguous:

| rung var | `data-density-shift` ancestors | selector | default | is the `near` of | is the `away` of |
| --- | --- | --- | --- | --- | --- |
| `--hz-density-ladder-depth-1` | 0 | `body` | `calc(var(--hz-density) * 10)` | depth 1 | depth 2 — and depth 1's own, doubled |
| `--hz-density-ladder-depth-2` | 1 | `body [data-density-shift]` | `calc(var(--hz-density) * 5)` | depth 2 | depth 3 |
| `--hz-density-ladder-depth-3` | 2 | `body [data-density-shift] ×2` | `calc(var(--hz-density) * 2)` | depth 3 | depth 4 |
| `--hz-density-ladder-depth-4` | 3 | `body [data-density-shift] ×3` | `calc(var(--hz-density) * 1)` | depth 4 | — |

`densityBlock()` stops hardcoding `calc(var(--hz-density) * N)` per level and
emits, per level: `--hz-space-near` = **its own depth's rung**, `--hz-space-away`
= **the next-shallower depth's rung**. That is the ladder rule above, so every
emitted value stays identical to today's. Depth 1 has no shallower rung, so its
`away` (multiplier 20) is its **own rung doubled** — a consumer who retunes the
top rung keeps the ladder's proportion at the top of the scale.

Each rung is referenced as `var(--hz-density-ladder-depth-N,
calc(var(--hz-density) * <that depth's near multiplier>))` — a fallback lookup,
with **no rung declarations emitted anywhere**. This is load-bearing, not merely
lazy:

- Declaring the rungs at `:root` would compute them there, against `:root`'s
  `--hz-density`. Today a `--hz-density` override on a *section* retunes every
  shift level inside it, because each level's `calc()` resolves on the element
  its rule applies to; a `:root` rung declaration would silently kill that.
  Keeping the `calc()` at the use site preserves it exactly.
- With nothing declared, a consumer's rung override wins from anywhere — `:root`,
  a section, inside a `@layer` — with no cascade fight against an unlayered
  `:root` declaration in the generated sheet.

Emitted shape at depth 2 (one `data-density-shift`), showing both halves:

```
--hz-space-near: var(--hz-density-ladder-depth-2, calc(var(--hz-density) * 5));
--hz-space-away: var(--hz-density-ladder-depth-1, calc(var(--hz-density) * 10));
```

and at depth 1 (`body`), the doubled top rung:

```
--hz-space-away: calc(var(--hz-density-ladder-depth-1, calc(var(--hz-density) * 10)) * 2);
```

Both the rung names and their fallbacks are derived from `density.levels` —
`depth-<index + 1>`, fallback `calc(var(--hz-density) * levels[index].near)` —
never hardcoded to today's four rows. A level whose `away` is neither the
previous level's `near` nor (at the top) its own `near × 2` is a generator error
naming the level, rather than a silently unhooked declaration.

`validateReferences()` in `src/lib/config/schema.ts` adds **four** names —
`--hz-density-ladder-depth-1|2|3|4` — to its `defined` set, alongside the
existing `--hz-density` / `--hz-space-near` / `--hz-space-away` entries, so a
config value may reference a rung.

*Decided:* four **depth-keyed** rung vars — one public var per position in the
ladder walk. Rejected: per-depth `near`/`away` pairs (eight names, and a consumer
could break the rhythm one distance at a time), and multiplier-keyed names
(`--hz-density-ladder-10`), which read as "a scale of multiples" rather than "the
rung at this nesting depth" and leave the 20 with nowhere to live. Overriding one
rung moves both places that rung appears — depth-2's rung is depth 2's `near`
and depth 3's `away` — which is what keeps a retuned ladder walking the library's
rhythm.

**R12 — The documented recipe is one block.**
`src/routes/docs/foundation/spacing/+page.svelte` (density section) gains a short
"Bring your own scale" subsection with exactly two paths, in this order:

1. **Proportional retune** — set `--hz-density` (or `tokens.density.unit` in the
   config). Unchanged; still the answer for "same rhythm, different unit".
2. **Alias the rungs to your own scale** — one block, at `:root` or on any
   subtree, one line per nesting depth:
   ```css
   :root {
   	--hz-density-ladder-depth-1: var(--space-10); /* body level */
   	--hz-density-ladder-depth-2: var(--space-6); /* 1 × data-density-shift */
   	--hz-density-ladder-depth-3: var(--space-3); /* 2 × */
   	--hz-density-ladder-depth-4: var(--space-2); /* 3 × */
   }
   ```
   With two notes: every rung you leave alone stays on the built-in ladder, and
   each rung serves two places (depth 2's rung is depth 2's `near` **and** depth
   3's `away`), which is what keeps the walk consistent — plus the body level's
   `away` is its own rung doubled, so the top of the scale follows depth-1
   automatically.

The existing density level table on that page gains a "rung" column so the
mapping is visible, `src/routes/docs/theming/tokens/+page.svelte` gets a one-line
pointer, and the generated `DENSITY_COMMENT` in `generate.ts` gains one sentence
naming the four rungs so the emitted sheet is self-describing.

**R13 — Regenerate, don't hand-edit.** `src/lib/tokens/tokens.css` is
regenerated with `pnpm gen:tokens`; the overrides-mode sheets (`ocean.css`,
`terminal.tokens.css`) emit no density block and must stay byte-identical. Every
computed distance is unchanged for a consumer who overrides nothing — the
fallback in each `var()` is the exact expression that rule carried before. The
existing drift tests are the gate.

---

### Edge cases

| Case | Expected |
| --- | --- |
| `mobileBreakpoint="md"` (default) | Identical DOM and CSS to today: no `data-collapsed`, no observer, container queries only. |
| `mobileBreakpoint={668}`, SSR HTML | `data-mobile-breakpoint="sm"`, no `data-collapsed`, and no attribute flash on hydrate. |
| `mobileBreakpoint={668}`, header 660px wide | Post-measure: `custom` + `data-collapsed`; hamburger shown, bar nav hidden, actions pinned to the end. |
| `mobileBreakpoint={668}`, header exactly 668px | Expanded (`>=` is expanded). |
| `mobileBreakpoint={640}` vs `'sm'` | Same rendered result at every width. |
| Header inside `display: none` (width 0) | Collapsed; unobservable, no error. |
| Drawer open, then header widens past the number | Drawer closes (`mobileOpen = false`), toggle hidden, focus not stolen. |
| `mobileBreakpoint` changed `500 → 900` at runtime | Re-evaluates from the last measured width in the same tick; no new observer. |
| `mobileBreakpoint={0}` / `{-5}` / `{NaN}` | Behaves as `'none'`; one DEV warn; no observer. |
| No `ResizeObserver` in the environment | The attachment factory's existing guard applies: the fallback tier stays live and the page is usable. |
| `Toc breakpoint={668}`, viewport 500 | `data-breakpoint="custom"` + `data-narrow`; trigger shown, title hidden, panel hidden while closed. |
| `Toc breakpoint={668}`, no `matchMedia` | Fallback tier stays live (`MediaQuery`'s own no-`window` path); no throw. |
| `Toc breakpoint='none'` | No `data-narrow`, no `data-collapsed`, no listener — today's default, unchanged. |
| `entry` snippet absent | Link renders `node.label`; DOM identical to today. |
| `entry` snippet supplied | Link content replaced; `href`, `data-level`, `aria-current` and click-to-scroll still applied by the component. |
| `entry` snippet on a nested h3 | Applies at every depth; the second argument is per-entry, not per-tree. |
| `entry` snippet reads `entry.children` | Type error, and `undefined` at runtime — the argument is a flat `{ id, label, level }`. |
| `entry` snippet renders nothing | An empty link. Not warned: visibly broken on sight, unlike an invisible missing label. The docs a11y note covers it. |
| No config, after Item C | Every computed distance identical; the `tokens.css` diff is exactly the eight rung lookups. |
| `--hz-density-ladder-depth-2: 3px` at `:root` | Depth 2's `near` **and** depth 3's `away` become `3px`; every other distance unchanged. |
| `--hz-density-ladder-depth-1` overridden | Depth 1's `near` takes it, depth 1's `away` is twice it, depth 2's `away` takes it — the top of the ladder moves as one. |
| `--hz-density-ladder-depth-4` overridden | Only depth 4's `near` moves — the deepest rung is nobody's `away`. |
| A rung overridden on a `<section>` | Applies to that subtree only, including any `data-density-shift` regions inside it; outside the section the ladder is untouched. |
| A rung overridden inside `@layer` | Wins — the generated sheet declares no rung to outrank it. |
| `--hz-density` overridden on a section (today's behavior) | Still retunes every shift level inside that section: each rung's fallback `calc()` resolves on the element its rule applies to. |
| `tokens.density.unit` set in config **and** a rung set in CSS | The rung wins (it is the outer `var()`); the unit still drives every rung left alone. |
| A hypothetical `density.levels` row whose `away` breaks the ladder rule | Generator error naming the level; no silent unhooked declaration. |

### Existing code to reuse

- **`src/lib/observers/resize.ts`** (`resize()` attachment) — Header's
  measurement. Do not hand-roll a `ResizeObserver`; the factory already owns
  teardown and the missing-API guard.
- **`MediaQuery` from `svelte/reactivity`** (the `^5.32` peer floor covers it) —
  Toc's viewport query. Not a hand-rolled `matchMedia` listener; the one-shot
  `matchMedia` reads in `Video.svelte` / `Carousel.svelte` are a different,
  non-reactive job.
- **The warn-once-under-`DEV` shape already in `Toc.svelte`** (`warnedMissing` /
  `warnedMultiple`) — R4's invalid-number warning.
- **`Accordion.svelte`'s `meta?: Snippet<[AccordionItem]>`** (`specs/61`) — the
  shape, typing, and docs-row convention for R8.
- **`densityBlock()` / `DENSITY_COMMENT`** in `src/lib/config/generate.ts` and
  **`density.levels`** in `src/lib/tokens/index.ts` — Item C's only emission
  sites.
- **`src/lib/components/parallax.spec.ts`** — the source-scan spec pattern for
  R6.
- **`render` from `svelte/server`** as used in
  `src/lib/components/Metatags.spec.ts` — R2's SSR-markup assertions.
- **`createRawSnippet`** as used in `Accordion.svelte.spec.ts` /
  `Table.svelte.spec.ts` — R8's tests.

### Test plan

Runner: **Vitest**, both existing projects — `server` (node) for SSR markup,
generator output and source scans, `client` (chromium, Playwright provider) for
layout and computed styles. The Playwright e2e suites (`src/routes/*.e2e.ts`) are
not extended: every behavior here is measurable in the component tests.

**Server — `Header.svelte.spec.ts` / `Toc.svelte.spec.ts` (SSR halves):**
`render()` from `svelte/server` with `mobileBreakpoint={668}` emits
`data-mobile-breakpoint="sm"` and no `data-collapsed`; `breakpoint={668}` emits
`data-breakpoint="sm"` and no `data-narrow`; `{1300}` → `lg`; `{804}`
(equidistant from 640 and 968) → `sm`, the tie going to the smaller.

**Server — new source-scan spec:** R6's literal/table equality, both components.

**Server — `src/lib/config/config.spec.ts`:** `generateCss(resolveConfig({}), {
mode: 'full' })` contains, at depth 2,
`--hz-space-near: var(--hz-density-ladder-depth-2, calc(var(--hz-density) * 5));`
and
`--hz-space-away: var(--hz-density-ladder-depth-1, calc(var(--hz-density) * 10));`
and, at depth 1,
`--hz-space-away: calc(var(--hz-density-ladder-depth-1, calc(var(--hz-density) * 10)) * 2);`
— plus: every emitted `near`/`away` references exactly one rung name; the set of
rung names used is exactly `depth-1|2|3|4`; each depth's `near` references its
own depth's rung and each `away` the next-shallower one; `overrides` mode emits
no density block; the committed `tokens.css` / `ocean.css` /
`terminal.tokens.css` drift tests pass after regeneration; and a config value
referencing `--hz-density-ladder-depth-3` validates.

**Client — `Header.svelte.spec.ts`:** render with `style="width: 500px"` and
`mobileBreakpoint={668}` → after a frame, `data-mobile-breakpoint="custom"`,
`data-collapsed` present, bar nav not visible, toggle visible; set `style.width =
'800px'` → `data-collapsed` gone, nav visible, toggle hidden. Open the drawer at
500px and widen to 800 → drawer closed and `aria-expanded="false"`. `{640}` and
`'sm'` give the same visibility at 600px and at 700px. `{0}` → no
`data-collapsed` ever, toggle hidden, exactly one DEV warn. String mode asserts
the attribute swap never happens.

**Client — `Toc.svelte.spec.ts`:** `window.matchMedia` mocked (the
`Video.svelte.spec.ts` mock shape) → `breakpoint={668}` under a non-matching
query gives `data-breakpoint="custom"` + `data-narrow`, trigger visible, title
hidden; a matching query drops `data-narrow`. Entry snippet: content replaced at
the top level and one level down; `aria-current` still set by the component on
the active entry; click still scrolls and updates `active`; the second argument
is `true` only for the active entry; and the first argument has no `children` key
(`expect(Object.keys(arg))` → `['id', 'label', 'level']`).

**Client — density computed styles** (in `src/lib/theme/theme.svelte.spec.ts`'s
style-injection harness), three assertions:

1. With the regenerated block injected and nothing overridden, `--hz-space-near`
   and `--hz-space-away` resolve to the same values as before the refactor at all
   four depths.
2. `--hz-density-ladder-depth-2: 3px` on a wrapper makes depth 2's `near` and
   depth 3's `away` resolve to `3px` inside that wrapper, and leaves an identical
   tree outside it untouched.
3. `--hz-density: 1px` on a wrapper still retunes every shift level inside it —
   the scoped-unit behavior R11's fallback form exists to preserve.

### Migration & back-compat

- **Item A** is purely additive. Every existing `'sm' | 'md' | 'lg' | 'none'`
  usage renders identical DOM and identical CSS and creates no observer.
  `data-mobile-breakpoint` gains one new value (`custom`) that appears only when
  a number is passed, so a consumer styling off `[data-mobile-breakpoint='md']`
  is unaffected unless they opt in. The one behavior change inside measured mode
  — closing the drawer on expand — has no string-mode equivalent to break.
- **Item B** is purely additive: no snippet, no change.
- **Item C** changes no computed value anywhere, and preserves the scoped
  `--hz-density` behavior consumers have today. The recipe a consumer may have
  already hand-rolled (mirroring `body [data-density-shift] …`) keeps working —
  it beats the `var()` lookup exactly as it beats the rule today. Four new public
  custom-property names enter the contract; nothing is removed or renamed.

### Non-goals

- **The flex-switcher (Split's pattern) for Header/Toc.** It makes a threshold
  var-driven but only produces wrapping, never `display: none`. A collapse that
  leaves the bar nav in the DOM and the tab order while it visually "hides", or
  a hamburger sized to zero, fails the keyboard/AT bar — and the CSS
  "space-toggle" tricks that *do* flip `display` off a numeric comparison are
  exactly what nobody can read at 3am.
- **A `--hz-header-breakpoint` custom property read via `getComputedStyle`**
  (R1).
- **Making `Table`'s stacked container queries, `Grid`'s bands, or `Container`'s
  max-widths numeric.** Multi-band, different shape, no reported need.
- **A shared breakpoint helper module.** Two three-entry tables next to the two
  style blocks that own them, pinned equal by R6's scan; a shared module would
  either become public API in `$lib/utils` or a new internal directory for six
  lines.
- **A `transform: (entries) => entries` prop on Toc.** It reads as the more
  general hook, but `entries` is index-coupled to the private `headingEls` array
  that the scroll-spy and click-to-scroll both index into; filtering or
  reordering desyncs them, and it interacts with `minEntries`, the tree build,
  and auto-id dedupe. It also invites a transform that writes state inside
  collection. The snippet covers the reported use case with none of that.
- **Replacing the `<a>` itself, or the list markup, from a snippet.** The
  component owns `aria-current`, the smooth-scroll handler, and hash writing.
- **Per-distance density hooks** — a separate `near` and `away` override per
  depth (R11) — and **making `density.levels` configurable in `hyzer.config`.**
  One rung per depth covers the aliasing case from CSS, at any scope, for config
  and non-config consumers alike, without letting the walk come apart one
  distance at a time.
- **A DEV warn when the `entry` snippet renders no text.**

### Write scope

`src/lib/components/Header.svelte`, `Toc.svelte`;
`src/lib/components/Header.svelte.spec.ts`, `Toc.svelte.spec.ts`; one new
source-scan spec in `src/lib/components/`; `src/lib/config/generate.ts`;
`src/lib/config/schema.ts` (one `Set`); `src/lib/config/config.spec.ts`;
`src/lib/tokens/tokens.css` (regenerated, not hand-edited);
`src/lib/theme/theme.svelte.spec.ts`; `src/docs/data/header.ts`,
`src/docs/data/toc.ts`; `src/routes/docs/components/header/+page.svelte`,
`src/routes/docs/components/toc/+page.svelte`,
`src/routes/docs/foundation/spacing/+page.svelte`,
`src/routes/docs/theming/tokens/+page.svelte`. No new dependencies. New public
API: two prop-type widenings, one snippet prop, four custom-property names.
`Header`'s `navItemClass` / `Nav`'s `itemClass` are out of scope — they land on
the punch-list branch and must not be touched here.

