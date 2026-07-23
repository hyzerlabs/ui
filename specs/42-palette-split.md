# 42 — Palette namespace split (`--hz-palette-*`)

> Builder contract. Reviewer verifies each `Rn` and edge case as pass/fail.
> Depends on the token engine (specs/29) and theming (specs/30). This spec is
> the authority; specs/15, 29, 30 get dated amendment notes, not rewrites.
> Write scope: `src/lib/tokens/**`, `src/lib/config/**`, `src/lib/theme/**`,
> `src/docs/**`, `src/routes/**`, plus the spec amendments listed in R7.

### Goal

Split raw palette tokens out of `--hz-color-*` into a dedicated `--hz-palette-*`
namespace so the CSS namespace itself encodes the tier a token belongs to, and
enforce that components and theme sheets resolve only through role
(`--hz-color-*`) and intent (`--hz-intent-*`) tokens — landed in the 0.1.0
breaking window (greenfield; the docs site is the only dogfooder).

### Doctrine (state verbatim in the docs and in every amended spec)

- Three tiers: **palette** (`--hz-palette-*`, raw single-value hues) →
  **roles** (`--hz-color-*`, structural) and **intents** (`--hz-intent-*`,
  semantic) → components.
- **Dark mode MAY override any tier, including palette — and it already does**
  (`gray` lightens `#6b7280` → `#9ca3af` in dark; every status hue lightens).
  The rule is **not** "palette is mode-static."
- The rule **is**: _components and theme sheets resolve through role and intent
  tokens, never palette tokens directly._ Palette is referenced in exactly one
  place — the token **source** (`tokens/index.ts` → generated
  `tokens.css`/example sheets), where roles and intents are _defined_
  (`--hz-color-surface: var(--hz-palette-white)`). That definitional layer is
  the whole point of the indirection and is the sole sanctioned palette
  consumer.

### Classification (verified against `src/lib/tokens/index.ts`)

- **Palette** (`--hz-palette-*`): `white, black, gray, primary, secondary,
  danger, warning, success, info`. Dark companions exist for `primary,
  secondary, danger, warning, success, info, gray`.
- **Roles** (`--hz-color-*`, structural): the role list grows from five to
  **seven** — `surface, surfaceMuted, text, textMuted, border, black, white`.
  The first five are as today; `black` and `white` are **new alias roles**
  (`black: 'var(--hz-palette-black)'`, `white: 'var(--hz-palette-white)'`) with
  **no dark override** — mode-invariant absolute anchors for hover-darkening
  mixes and on-media controls. `textMuted` and `border` have no dark override
  (they chain `gray`); `surface, surfaceMuted, text` have dark overrides.
- **Intents** (`--hz-intent-*`, unchanged names): `neutral, primary, secondary,
  danger, warning, success, info`.

### Usage inventory (verified by grep, by location class)

`--hz-color-*` is referenced across **124 files** (761 occurrences). Split by
name class and location:

- **Role names** (`surface/surfaceMuted/text/textMuted/border`, plus the new
  `black/white` roles) — **~452 refs**; keep `--hz-color-*`, untouched.
- **Palette names** (`white/black/gray/primary/secondary/danger/warning/success/info`)
  — **~145 refs in `src/lib`**, by location class:
  - **(a) Token definitions** — `tokens/index.ts` (source) and generated
    `tokens.css` (31). Rewritten by the engine; palette prefix flips.
  - **(b) Lib component scoped styles** — `Image.svelte:47` only
    (`placeholderColor = 'var(--hz-color-gray)'`).
  - **(c) Theme sheets** (`theme/base.css` + `theme/components/*.css`) — **~63
    refs** across 21 files: `primary` (link, tabs, hero, table, field,
    carousel, combobox, dropdown, file-upload, toc, base.css); `secondary`
    (base.css); `gray` in neutral `color-mix` tints (toc, table, footer, nav,
    media, header, accordion, combobox, modal, carousel, field, file-upload);
    `black` anchors (button.css hover/active/link-variant, link.css hover);
    `white` anchors (lightbox controls, field.css:522). Generated example
    sheets (`ocean.css`, `sunset.tokens.css`, `terminal.tokens.css`) are engine
    output, not hand-edited.
  - **(d) Docs pages / demo chrome** — routes (82 refs / 25 files) +
    `src/docs/**` (9 refs). Palette-showcase surfaces (colors/contrast pages)
    move to `--hz-palette-*`; incidental demo chrome using a hue as decoration
    is tier-fixed to a role/intent.
  - **(e) Specs prose** — historical `--hz-color-<hue>` mentions in
    `specs/*.md`; left in place, annotated by amendment (R7).
  - **(f) Tests** — `tokens.svelte.spec.ts` (~20 palette-name assertions),
    `config.spec.ts` (31), `fallback-parity.spec.ts`, `theme.svelte.spec.ts`,
    `examples.spec.ts`; assertions repointed to new names.

### Requirements

**R1 — Token source split (`src/lib/tokens/index.ts`).**

1. Introduce a new `palette` export: `white, black, gray, primary, secondary,
   danger, warning, success, info`, with a `palette.theme.dark` map holding the
   palette-tier dark overrides that live in today's `color.theme.dark`:
   `primary, secondary, danger, warning, success, info, gray`.
2. The `color` export retains the structural roles and gains the two anchor
   aliases — final role set: `surface, surfaceMuted, text, textMuted, border,
   black, white`. Values that reference a palette hue now reference the palette
   namespace:
   - `surface: 'var(--hz-palette-white)'`
   - `surfaceMuted: 'color-mix(in srgb, var(--hz-palette-gray) 6%, var(--hz-color-surface))'`
   - `text: 'var(--hz-palette-black)'`
   - `textMuted: 'var(--hz-palette-gray)'`
   - `border: 'var(--hz-palette-gray)'`
   - `black: 'var(--hz-palette-black)'` (new alias role, no dark override)
   - `white: 'var(--hz-palette-white)'` (new alias role, no dark override)
   `color.theme.dark` retains only role-tier dark overrides: `surface,
   surfaceMuted, text` (`surfaceMuted` mixes `var(--hz-palette-gray) 25%` over
   `var(--hz-color-surface)`). `black`/`white` deliberately do **not** appear in
   `color.theme.dark`.
3. The `intent` export re-points every entry at the palette namespace
   (`neutral: 'var(--hz-palette-gray)'`, `primary: 'var(--hz-palette-primary)'`,
   …). Intents remain pure indirection in both modes.
4. `tokens.css` is regenerated via `pnpm gen:tokens` (never hand-edited): a
   "Layer 1 — Palette" section emits `--hz-palette-*`, the roles section keeps
   `--hz-color-*` (now including `--hz-color-black`/`--hz-color-white`). The
   `[data-theme='dark']` block emits both palette dark companions
   (`--hz-palette-*`) and role dark overrides (`--hz-color-*`).

**R2 — Engine / config split (`src/lib/config/**`).**

1. The config `tokens.color` group splits into **`tokens.palette`** (emits
   `--hz-palette-*`, accepts one level of ramp nesting) and **`tokens.color`**
   (structural roles, `--hz-color-*`); `dark.color` splits into
   **`dark.palette`** + **`dark.color`**. "Clarity is kindness": which tier a
   consumer key belongs to is now explicit in the config shape, not inferred.
2. Classification moves from value-shape heuristics to group membership:
   **delete `isPaletteValue`, `isRoleKey`, and the `baseColorClass` map**. The
   `palette` section merges `stringEntries(palette)` + `tokens.palette` with the
   `--hz-palette-` prefix; the `roles` section merges `stringEntries(color)` +
   `tokens.color` with `--hz-color-`. `SectionId` keeps `palette`/`roles`; the
   palette section banner reads "Layer 1 — Palette (`--hz-palette-*`)".
3. The resolved dark model becomes `dark: { palette: TokenEntry[]; color:
   TokenEntry[]; intent: TokenEntry[] }` — `palette` from
   `palette.theme.dark` + `dark.palette` (`--hz-palette-`), `color` from
   `color.theme.dark` + `dark.color` (`--hz-color-`), `intent` as today.
   `generateCss` full-mode dark block emits role dark, then palette dark, then
   intent dark, sourced from these three lists directly (no `isRoleKey` /
   `value.includes('var(')` split). `scopedClosure`/`darkDerives` in overrides
   mode seed from all three dark lists. `validateReferences` treats
   `--hz-palette-*` as defined tokens.
4. Ramp nesting (`brandRed: { 50, 900 }`) lives under `tokens.palette`, emitting
   `--hz-palette-brand-red-50`.
5. Contrast-report impact: `report.ts` reads roles/intents
   (`--hz-color-surface/-text/-text-muted`, `--hz-intent-*`) and never palette
   names directly, so **pairing ids are unchanged** (`text:intent-danger/surface-muted`,
   `solid:intent-…`, `soft-*`). Update only `declarationMaps` to fold
   `dark.palette` into the dark map alongside `dark.color`/`dark.intent`; verify
   intent resolution still chains through to the palette hexes. `softTints`
   unchanged.
6. Example configs migrate to the split groups: `ocean.config.ts` /
   `sunset.config.ts` move hues (`primary, secondary, …`) into `palette:` and
   keep `surface/text/textMuted/border` in `color:`; their `dark:` blocks split
   into `dark.palette` (hue brightening) + `dark.color` (role flips). Intent
   remaps that target a role (`neutral: 'var(--hz-color-text-muted)'`) stay
   as-is. `terminal.config.ts`'s intent extension `phosphor:
   'var(--hz-color-primary)'` becomes `'var(--hz-palette-primary)'`; `amber:
   '#ffb000'` unchanged. `pnpm gen:tokens` regenerates all three committed
   sheets; drift + AA gates stay green.

**R3 — Resolution sweep + acceptance grep (the doctrine, enforced).**

1. After the sweep, `src/lib/components/**` and `src/lib/theme/**` (excluding the
   generated `tokens.css` and generated example `*.css`) contain **zero**
   `--hz-palette-*` references — they resolve via `--hz-color-*` /
   `--hz-intent-*`. A test greps for this and asserts empty. (The
   `black`/`white` anchor sites are compliant because they use the
   `--hz-color-black`/`--hz-color-white` **roles**, not the palette tokens.)
2. Per-site tier-correct replacements (all resolve to the identical hex in both
   modes, so no visual change):

   | Current raw-palette site(s) | Replacement | Rationale |
   |---|---|---|
   | `primary` in `link`, `tabs`, `hero`, `table` (sort/focus), `field` (focus/fill/accent), `carousel`, `combobox`, `dropdown`, `file-upload`, `toc`, `base.css` | `--hz-intent-primary` | primary is the brand action intent |
   | `secondary` in `base.css` | `--hz-intent-secondary` | |
   | `gray` in neutral `color-mix` tints (`toc`, `table`, `footer`, `nav`, `media`, `header`, `accordion`, `combobox`, `modal`, `carousel`, `field`, `file-upload`) | `--hz-intent-neutral` | chains `gray` identically in both modes |
   | `Image.svelte` `placeholderColor` default | `var(--hz-color-border)` | neutral placeholder block resolves through a role |
   | `black` anchors (`button.css` solid/active/link hover-darken; `link.css` hover) and `white` anchors (`lightbox.css` controls; `field.css:522`) | **No change** — now role-tier | `--hz-color-black`/`--hz-color-white` are alias roles; zero churn at these sites |

3. Fallback hexes in `var(--hz-…, #hex)` stay verbatim (R5 policy); only the
   token name changes. Because roles, intents, and palette all resolve to the
   same hexes, existing fallbacks remain correct and the fallback-parity test
   (specs/29 R7) stays green.
4. Docs demo chrome is **tier-fixed in the same sweep**: a demo that uses a hue
   as incidental decoration is repointed to the appropriate role/intent (not
   mechanically renamed to `--hz-palette-*`), because the doctrine is what the
   docs teach. Palette-showcase surfaces (colors/contrast pages) legitimately
   build `--hz-palette-*` names. The Builder lists **every** demo-chrome site it
   changed, with old → new token, in its PR report.

**R4 — Docs updates.**

1. `/foundation/colors`:
   - The "Palette tokens" section reads the new `palette` export and builds
     `--hz-palette-*` var names + swatches (including `--hz-palette-black` /
     `--hz-palette-white`).
   - The "Structural roles" section reads the `color` export and keeps
     `--hz-color-*`. It now lists **seven** roles; `--hz-color-black` and
     `--hz-color-white` appear here with an explicit mode-invariant note:
     _"absolute anchors for hover-darkening and on-media controls — deliberately
     do not flip in dark."_ (`black`/`white` therefore appear in **both**
     sections: as palette source and as anchor roles — this duality is
     intentional and is called out in prose.)
   - The dark-overrides section states the doctrine paragraph verbatim (dark may
     override any tier incl. palette; components resolve via roles/intents).
2. `/foundation/contrast`: `paletteTokens` derives from the `palette` export;
   intent-target resolution regex changes `--hz-color-([a-z]+)` →
   `--hz-palette-([a-z]+)`; `intentHex`/`intentDarkHex` read
   `palette`/`palette.theme.dark`; the `apiCode` sample updates
   `color.white`→`palette.white`, `color.gray`→`palette.gray`, and the
   `--hz-color-primary` comment → `--hz-palette-primary`.
3. `/theming/tokens`: the plain-CSS palette recipe overrides
   `--hz-palette-primary` / `--hz-palette-gray`; the config sample uses
   `tokens.palette` (+ ramp under palette → `--hz-palette-brand-red-900`) and
   `dark.palette`; add a short doctrine callout ("override any tier in
   `[data-theme='dark']`, including palette; your components keep resolving
   through roles/intents").
4. Foundation pages' literal `var()` fallbacks are renamed mechanically per
   R3.3.

**R5 — Fallback policy.** Fallback hex values in `var(--hz-name, #hex)` are
unchanged; only names change. No fallback is added or removed by this spec.

**R6 — Acceptance grep for stale names.** After the sweep, a test asserts
**zero** occurrences of `--hz-color-(gray|primary|secondary|danger|warning|success|info)`
anywhere in `src/**` (code) — those custom-property names cease to exist.
`--hz-color-black` and `--hz-color-white` are **excluded from the forbidden
list**: they persist as alias roles. No allowlist mechanism is needed.
`specs/*.md` historical prose is out of the `src` grep scope and is handled by
R7 amendments.

**R7 — Specs housekeeping.** Dated amendment notes appended (not rewrites) to:

- **specs/15** — palette moves to `--hz-palette-*`; roles gain mode-invariant
  `black`/`white` anchor aliases; intents re-point at the palette namespace.
- **specs/29** — config `color` group → `palette` + `color`; `dark.color` →
  `dark.palette` + `dark.color`; classification by group not value (heuristics
  deleted); palette prefix; resolved `dark` gains a `palette` list.
- **specs/30** — example configs use split groups; theming/tokens override
  recipes use `--hz-palette-*`.

Each note points to this spec as authority. Historical `--hz-color-<hue>`
mentions in older specs stay, annotated once as superseded.

### Responsive Behavior

No layout change. This is a token-namespace rename; every replacement resolves
to the identical computed value at every breakpoint. The colors / contrast /
tokens docs pages keep their existing responsive grids and tables.

### Accessibility

No behavioral change to contrast — every replacement token resolves to the same
hex in both light and dark, so all AA pairings are byte-preserved. The
`contrastReport` gate and `tokens.svelte.spec.ts` computed-value tests are the
regression net. The colors-page dark/light mode-aware swatches keep painting
`var(cssVar, lightHex)` with dual hex labels; only the var names change. The new
`black`/`white` anchor roles are documented as deliberately non-flipping so a
reader understands why an on-media control stays white in dark mode.

### Edge Cases & Error States

| Case | Expected |
|---|---|
| A role overridden with a literal hex in a consumer config (`color: { surface: '#f8fafc' }`) | Stays a role in `--hz-color-*` — classification is by group now, not value shape, so no misclassification. |
| Consumer adds a new hue | Goes in `tokens.palette` → `--hz-palette-foo`; a new role goes in `tokens.color` → `--hz-color-foo`. Unambiguous. |
| Consumer-added intent points at a palette hue | `intent: { x: 'var(--hz-palette-primary)' }` validates; contrast report grades it. |
| Dark overrides a palette hue (`dark.palette.primary`) | Allowed and expected — doctrine. Intent chains follow. |
| Stale `--hz-color-<hue>` (gray/primary/…) left anywhere in `src` code | R6 grep fails CI. |
| `--hz-palette-*` left in a component or theme sheet | R3.1 grep fails CI. |
| Anchor site still using `--hz-color-black`/`--hz-color-white` | Correct — those are roles now; no action. |
| Fallback hex no longer matches its (renamed) token's resolved value | specs/29 R7 fallback-parity test fails. |

### Existing Code to Reuse

- `src/lib/config/schema.ts` / `generate.ts` — extend the existing
  `palette`/`roles` section machinery; **do not** rebuild the engine. Delete
  only the value-shape heuristics (`isPaletteValue`, `isRoleKey`,
  `baseColorClass`); add the `dark.palette` list.
- `src/lib/config/report.ts` + `softTints` — unchanged logic; touch only
  `declarationMaps` to fold in `dark.palette`.
- `src/lib/tokens/tokens.svelte.spec.ts` — the computed-value browser net;
  repoint assertions to new names, keep coverage.
- `scripts/gen-tokens.ts` — regeneration entry point; no structural change.
- `src/docs/CodeBlock.svelte` / `Example.svelte` — docs recipes; reuse, don't
  re-author.

### Test Plan

- **Unit (server, `config/config.spec.ts`, Vitest):** `tokens.palette` and
  `tokens.color` merge/extend/order; ramp under `palette`;
  `dark.palette`/`dark.color` split; unknown-group errors list the new valid
  names; drift test (zero-config output == committed `tokens.css`) green;
  example-config drift for ocean/sunset/terminal green.
- **Browser (`tokens.svelte.spec.ts`):** `--hz-palette-*` defined;
  `--hz-color-surface` == `--hz-palette-white`; `--hz-color-text` ==
  `--hz-palette-black`; `--hz-color-black`/`--hz-color-white` alias roles
  resolve and **do not flip** under `data-theme="dark"`; `--hz-intent-*` chains
  `--hz-palette-*`; dark companions resolve (`--hz-palette-primary` →
  `rgb(96,165,250)`, `--hz-palette-gray` lightens, role/intent chains follow).
- **Contrast (`report.ts` / `examples.spec.ts` AA rig):** report pairing ids
  unchanged; all AA pairings pass for base + ocean + sunset + terminal.
- **Fallback parity (specs/29 R7):** green after mechanical rename.
- **Acceptance greps (new):** (a) zero `--hz-palette-*` in
  `src/lib/components` + `src/lib/theme` excluding generated sheets; (b) zero
  `--hz-color-(gray|primary|secondary|danger|warning|success|info)` in
  `src/**`.
- **e2e (Playwright):** colors / contrast / theming-tokens pages render; the
  dark-toggle invariant (brand accent unchanged on toggle — now
  `--hz-intent-primary`) holds; prerender crawl green. Kill port 4173 before
  serving.
- **Full gates:** `check`, `lint`, `unit`, `build`, `e2e`, `gen:tokens` drift.

### Out of Scope

- Any change to role or intent _values_, or to component behavior/visuals.
- Introducing role tokens beyond the two `black`/`white` anchor aliases.
- Renaming the `--hz-intent-*` or structural-role namespaces.
- hyzer.sh / external consumer migration (greenfield; docs site is the only
  dogfooder).
- The Vite plugin, MCP server, npm 0.1.0 publish mechanics.
