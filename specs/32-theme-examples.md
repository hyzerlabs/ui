# Theme Examples Spec — class-override example themes (Terminal, Sunset)

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. **Depends on specs/29** (the
> token engine) and **specs/30** (the theme folder restructure and the
> `/theming/examples` page). Write scope: `src/lib/theme/examples/**`,
> `src/routes/theming/examples/**`, `scripts/gen-tokens.ts`, plus the spec
> amendments listed here.

### Goal

Today both shipped example themes (Ocean, Sunset) are **token-override sheets
only** — neither writes a single rule against a `hz-*` class or a `data-*`
hook. The examples page therefore demonstrates the *token engine*, not the
*headless architecture*: a reader learns they can recolor the reference theme,
not that they can throw its visual decisions away.

This spec adds the missing half. The examples become an escalating arc:

| | Ocean | Sunset | Terminal |
| --- | --- | --- | --- |
| Palette via config | yes | yes | yes |
| Class-hook overrides | none | yes | yes |
| Reference theme | required | layered over | **not imported** |

Ocean is untouched — it is the control, and the contrast is the lesson.
User-approved 2026-07-16.

### Context & Conventions

- **The scoping constraint (from specs/30 R2).** The docs e2e invariant —
  `--hz-color-primary` unchanged on dark toggle — requires that example
  sheets are never imported globally by the docs app. Ocean satisfies this by
  being re-generated at runtime under `.theme-ocean`. Hand-authored CSS cannot
  be re-scoped at runtime, so **Terminal and Sunset root every rule at a
  class** (`.hz-theme-terminal`, `.hz-theme-sunset`). This:
  1. satisfies the invariant by construction — nothing lands at `:root`;
  2. lets the docs page import the **real shipped sheet** rather than a
     regenerated facsimile (better dogfooding than Ocean gets);
  3. doubles as the consumer story — put the class on `<html>`;
  4. wins the cascade outright: unlayered at (0,2,0) beats any
     `@layer hz-theme` rule regardless of specificity.
- **Directory shape mirrors `theme/components/`** so that growing to full
  parity (all 23 components) is *adding files*, not restructuring. This pass
  ships a **demo set** of 8; the remaining sheets are additive follow-up work.

  ```
  src/lib/theme/examples/
    ocean.config.ts, ocean.css        unchanged — :root token sheet
    sunset/
      sunset.config.ts                token config
      sunset.tokens.css               GENERATED, .hz-theme-sunset
      sunset.css                      index: @imports tokens + components
      components/{button,badge,alert,card,field,toggle,tabs,accordion}.css
    terminal/                         …same shape
  ```

- Demo set (8): Button, Badge, Alert, Card, Field/TextInput, Toggle, Tabs,
  Accordion. Chosen to cover every hook category exactly once: root class,
  `data-variant`, `data-intent`, `data-size`, `data-state`, child parts
  (`.hz-alert-title`, `.hz-card-actions`, …), component custom properties
  (`--hz-toggle-width`), and the documented unlayered-Toggle exception.
- Greenfield: `theme/examples/sunset.css` changes meaning (token sheet →
  index sheet). Breaking, and acceptable — no external consumers.

### Requirements

1. **R1 — Terminal, standalone.** New example theme `terminal/`, rooted at
   `.hz-theme-terminal`. Brutalist/terminal look: square corners (radius 0),
   hard 2px borders, hard offset shadows (no blur), mono uppercase type,
   invert-on-hover, `translate(2px, 2px)` + shadow collapse on `:active`, no
   transitions on color. Its usage contract is **`tokens.css` only — the
   reference theme is NOT imported**.
2. **R2 — Terminal covers what it claims (the standalone invariant).** For
   every component in the demo set, the set of CSS properties the reference
   theme declares for a given selector target MUST be a subset of the
   properties Terminal declares. Enforced by a test (R7), not by assertion in
   prose. This is what makes "no theme import" true rather than aspirational:
   if Terminal sets every property the theme sets, the theme's presence
   provably cannot alter Terminal's rendering — which is also why the docs
   page may demo it inline on a page where the theme IS loaded.
3. **R3 — Sunset, layered.** `sunset/` keeps its warm ember palette and gains
   a neo-soft/tactile class-override sheet: extruded dual-shadow surfaces
   (light top-left, dark bottom-right), pill radii, low-contrast
   surface-on-surface, controls that press inward (`inset` shadows) on
   `:active`. Its usage contract **imports the reference theme first**, then
   layers over it — demonstrating the cascade-layer contract (unlayered class
   rules beat `@layer hz-theme`, no `!important`, no specificity matching).
   Sunset therefore only declares what it changes; R2 does NOT apply to it.
4. **R4 — Tokens stay engine-generated.** `{sunset,terminal}.tokens.css` are
   `hyzer generate --mode overrides` output of their configs, with
   `selector: '.hz-theme-<id>'`. `pnpm gen:tokens` writes all five sheets
   (tokens.css, ocean.css, sunset.tokens.css, terminal.tokens.css). The
   drift test covers each.
5. **R5 — AA posture holds.** Every example config passes `contrastReport`
   with zero failures and zero unresolved tokens, both modes — the existing
   bar from specs/30 R2, extended to Terminal. Note the report models the
   *reference theme's* soft-tint recipes; that is a deliberately stricter
   bar than Terminal's own solid-fill recipes need, and it stays.
6. **R6 — Per-instance `class` prop is demonstrated.** Each theme's demo
   panel includes at least one instance styled purely by a passed class
   (e.g. `<Button class="cta">`), given a treatment the theme's own sheet
   never gives that component's root class. The same markup under both themes
   must produce visibly different results — sheet-level and instance-level
   override shown composing, in context.
7. **R7 — Tests.** In `examples.spec.ts`:
   - drift: committed `*.tokens.css` equals engine output of its config;
   - contrast: R5, for all three configs;
   - **standalone coverage: R2** — parse `theme/components/*.css` and
     `terminal/components/*.css`, and assert per-component property-set
     containment. Failures must name the missing properties.
8. **R8 — Docs page.** `/theming/examples` presents the three-theme arc
   (table above), each with Demo / config / CSS tabs. Terminal and Sunset
   demos apply the shipped sheet via the theme's root class on the panel.
   Ocean keeps its runtime-scoped generation. Copy explains *why* Terminal
   needs no theme import and Sunset does. Every copyable sample shows the
   specifiers a **consumer** would type (`@hyzer-labs/ui/config`,
   `@hyzer-labs/ui/types`), not the repo-internal `$lib`/relative paths the
   real files must use to build — rewritten by `src/docs/consumerSource.ts`
   and pinned by its spec, which asserts no internal specifier survives.
9. **R9 — The intent vocabulary is open (library change).** Intents are a
   token vocabulary — a component only stamps `data-intent="<name>"` and the
   theme defines `--hz-intent-<name>` — so a closed union made the library's
   own list the ceiling, which is backwards for a headless system. `Intent`
   becomes `keyof IntentRegistry`, an exported interface consumers augment
   via declaration merging. Custom intents stay **type-checked**
   (`intent="phosfor"` must still fail to compile) and are graded by the
   contrast report like built-ins. Button's narrower four-value union
   (`primary | secondary | danger | neutral`) was itself a bug against this
   model and widens to `'neutral' | Intent`; the reference theme gains the
   `warning`/`success`/`info` mappings it now needs. Terminal demonstrates
   the whole path with `phosphor` and `amber`. Surfaced on
   `/foundation/colors` with a link to the worked example.

### Amendments to earlier specs

- **specs/29 R4 (engine `selector` scoping) — bug fix.** Scoped overrides
  emitted only config-touched tokens, stranding the Layer-2 indirection at
  `:root`: `--hz-intent-primary: var(--hz-color-primary)` substitutes where it
  is DECLARED, so a `.theme-x` palette override never reached any component
  reading the intent vocabulary. Every scoped demo silently rendered the base
  palette. Scoped mode now re-emits the transitive closure of derived tokens
  (and the dark-block entries deriving from them). `:root` output is
  unchanged — `tokens.css` and `ocean.css` are byte-identical.
- **specs/29 R7 (fallback parity).** `theme/examples/**` moves out of the base
  scan: an example theme's fallback must promise ITS palette, not the
  library's. The same invariant is enforced per-theme against each config's
  own resolved values in `examples.spec.ts`.
- **specs/01 (Button), 19 (Badge), 20 (Alert), 22 (Combobox chips).** Intent
  props widen per R9; Button's union is no longer a hand-picked subset.

### Edge cases

- **Toggle's unlayered exception.** `field.css` styles the Toggle track/thumb
  **unlayered** at (0,2,1) to beat the component's own scoped reset. Both
  example themes' Toggle rules are `.hz-theme-<id> .hz-field--toggle
  input.hz-toggle` = (0,3,1), so they still win. A theme that tried to style
  Toggle at (0,2,0) would silently lose — call this out in the sheet comment.
- **`.sr-only` ships in `base.css`, not `theme.css` components.** Terminal
  does not import the theme, so a Terminal-only app still needs `base.css`
  or its own `.sr-only`. Terminal's header comment must say so: Button's
  loading label and Link's external hint render `class="sr-only"`.
- **Dark mode.** Both sheets' token blocks compose dark via the engine's
  `darkSelector()` (`.hz-theme-x[data-theme='dark'], [data-theme='dark']
  .hz-theme-x`), so the docs site's dark toggle drives the panels. Any
  hand-authored rule that hardcodes a color instead of a role token breaks
  this — hand-authored rules reference role tokens only.
- **Terminal's hard shadows in dark mode.** A `4px 4px 0 #000` shadow is
  invisible on a near-black surface. Terminal's shadow color must be a role
  token (`--hz-color-text`), not a literal.

### Amendments

- **2026-07-23 (specs/46 — Sunset retired, replaced by the "Docs" example).**
  Sunset (`theme/examples/sunset/**`) is deleted outright, along with its
  `examples.spec.ts` entry, its `gen-tokens.ts` sheet, its
  `palette-namespace.spec.ts`/`consumerSource.spec.ts` fixture rows, and its
  `exports.spec.ts` pins. The palette-freedom arc this spec introduced
  collapses to its two remaining poles, Ocean and Terminal; the layered-
  cascade lesson Sunset carried (unlayered class rules beating `@layer
  hz-theme`) moves to a new, differently-shaped example: `theme/examples/
  docs/docs.css`, a hand-authored sheet with no config and no palette of its
  own — the docs site's own reading chrome (scaffold classes, the
  `.docs-table` override, code chips, a content focus-visible ring), shipped
  unscoped and dogfooded as the literal sheet `design.hyzer.sh` imports. It
  is not a third point on this spec's freedom axis (R1–R9 above describe
  Ocean/Sunset/Terminal only); it is a different kind of example, specified
  in full by specs/46. This spec's Sunset-specific prose (R3, the demo-set
  table, the directory layout) is left as historical record of the decision
  at the time.
