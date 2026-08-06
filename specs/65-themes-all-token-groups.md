# 65 — Every token group in the config: themes, component hooks, and the contrast bar

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. **Builds on
> `specs/29-token-engine.md` (the config engine and its emission model),
> `specs/30-theming.md` / `specs/42-palette-split.md` (the palette → role →
> intent layering), `specs/52-theme-attachment.md` (`theme()` / `themeVars`),
> `specs/62-custom-intent-wiring.md` (the end-of-sheet, unlayered,
> zero-specificity rule section) and `specs/64-migration-followups.md` (the
> density rungs) and does not restate them.** Every design choice below is
> settled; the `Decided:` tails record the option that was rejected, so nobody
> relitigates it mid-build.

### Goal

Make `hyzer.config.ts` the place where the whole design system is decided.
Three gaps close: a named theme may carry any token group (not just color), the
~35 per-component theme hooks become config-reachable, and the contrast bar
(AA/AAA, and whether a miss fails the build) stops being a property of one CLI
invocation. Stage 2 rebuilds the Terminal example as a theme that redefines
type, which is the worked demo for the first gap.

---

### Stage map

One feature branch, however many commits it takes. The five stages below are
**commit boundaries within that branch**, not separate deliverables: each one
is a coherent, independently verifiable chunk that ends with its own full gate
run (see Gate). Order is a recommendation, not a dependency graph — only
Stage 5 leans on earlier work (specs/64's rungs, already shipped), and Stage 2
touches no API at all, so it can land first while Stage 1 is still in review.

| Stage | Requirements | What lands |
| --- | --- | --- |
| 1 | R1–R6 | `themes.<name>` accepts every group `tokens` accepts |
| 2 | R7–R9 | Terminal owns its type scale and stack (no API change) |
| 3 | R10–R16 | `tokens.components` — the per-component theme hooks |
| 4 | R17–R20 | `contrast.level` + `strict` in the config |
| 5 | R21 | `density.ladder` — the four rungs, from the config |
| — | R22 | Docs and template follow-through, tagged per stage |

Stage 3 is the largest by some distance (a new published data module, a new
emission section, a new source-scan gate, and the `softTints` correction);
budget for it accordingly and split it across commits if that reads better in
the log. Nothing in it is optional.

Out of this spec by direction: `hyzer generate --check` never reads the sheet
on disk, so CI passes against a stale committed sheet. That is `specs/66`.
Where R19 touches the same exit path, leave the check-mode gap alone.

---

### Context & conventions

- **The emission machinery is already group-agnostic.** `closureFrom()`
  (`generate.ts:413`) and `themeBlock()` (`:464`) compute the "derived chain,
  re-declared" closure by scanning `resolved.sections` for `var()` references —
  generic over any section, so a theme that overrides `fontSize.base` where the
  config authored `fontSize.lg: calc(var(--hz-font-size-base) * 1.4)` pulls the
  dependent in with no new code. `lightRestore()` (`:572`) and `themeVars()`
  (`:741`) generalize the same way. Stage 1 is mostly a schema change; the hard
  part is done.
- **Byte-drift is a hard requirement, not a preference.** `tokens.css`,
  `utilities.css`, `ocean.css` and `terminal.tokens.css` are compared to
  generator output byte-for-byte (`config.spec.ts:22`,
  `examples.spec.ts:29`, `config.spec.ts:832`). Every stage must emit **zero
  extra bytes** for a config that does not use its feature. Only
  `terminal.tokens.css` regenerates in this spec, in Stage 2.
- **Custom properties resolve on the element the declaration applies to, and an
  element's own declaration always beats an inherited one.** This is why Stage 3
  cannot emit component hooks at `:root`: the reference theme declares
  `--hz-button-accent` on `.hz-button` itself, so a `:root` value would be
  inherited-and-ignored. It is also why a theme's `--hz-density` cannot reach
  the ladder (R4).
- **Unlayered beats every layer.** Within the author origin, unlayered
  declarations outrank any `@layer`, regardless of specificity; `:where()` then
  drops the rule to 0,0,0 so any consumer rule outranks it. That is the posture
  of the utilities sheet (`specs/44`) and the custom-intent section
  (`specs/62 R2`), and Stage 3 reuses it verbatim.
- **`light` stays reserved** (`schema.ts:376`). The light theme is the `:root`
  block authored via `tokens`; nothing here changes that.
- **Docs are consumer-facing.** No spec numbers, no `Rn`, no test-gate or
  process language in anything a reader sees. Every copy change gets an
  editor-agent pass before commit (R22).

---

## Stage 1 — A theme is a token override

**R1 — `HyzerThemeOverride` becomes `HyzerTokensOverride`.** One type, one
mental model: *a theme is a token override; `tokens` is the unnamed one.*
Replace the interface at `schema.ts:79` with

```ts
export type HyzerThemeOverride = HyzerTokensOverride;
```

The name stays exported (`config/index.ts:16`, `attachments/theme.ts:21`,
`generate.ts:741`) — it is public API and it reads correctly at every call
site. The prose the old interface carried (dark seeds from the base authoring,
every other theme starts from nothing) moves to the `themes` JSDoc on
`HyzerConfig` (`schema.ts:95`), where it is about the map rather than the shape.

Two members of that shape are **root-only**, and a theme entry that sets either
is a `HyzerConfigError` naming the key and where it belongs:

| In a theme | Message says | Why |
| --- | --- | --- |
| `components` (R10) | set it under `config.tokens.components` | Component hooks are emitted as their own rules on the component element, not as declarations in the theme block; a theme-block copy would be inherited-and-ignored. Point a hook at a token instead — the token flips per theme on its own. |
| `density.ladder` (R21) | set it under `config.tokens.density.ladder` | The ladder is `body`-anchored element rules. There is no element in a theme block to put a rung on. |

`density.unit` **is** allowed in a theme, with the ceiling in R4.

*Decided:* one type plus two validated exceptions, not two diverging
interfaces. The type is the mental model; the two exceptions are cases where
the emission has nowhere to put the value, and a loud error beats a silent
no-op.

**R2 — `ResolvedTheme` gains one list, emitted after intents.** Keep `palette`,
`color`, `intent` exactly as they are (`schema.ts:176`) and add:

```ts
rest: TokenEntry[];   // every non-color group, in :root section order
```

`resolveTheme()` (`schema.ts:399`) fills it with
`mergeGroup([], override?.<group>, '<prefix>', 'config.themes.<name>.<path>')`
— seeded from `[]`, exactly as `intent` is today — in this order, mirroring the
`:root` sections:

| # | Config path | Prefix |
| --- | --- | --- |
| 1 | `typography.fontSize` | `--hz-font-size-` |
| 2 | `typography.fontFamily` | `--hz-font-family-` |
| 3 | `typography.fontWeight` | `--hz-font-weight-` |
| 4 | `typography.lineHeight` | `--hz-line-height-` |
| 5 | `space` | `--hz-space-` |
| 6 | `width` | `--hz-width-` |
| 7 | `radius` | `--hz-radius-` |
| 8 | `border.width` | `--hz-border-width-` |
| 9 | `shadow` | `--hz-shadow-` |
| 10 | `zIndex` | `--hz-z-` |
| 11 | `motion.duration` | `--hz-duration-` |
| 12 | `motion.ease` | `--hz-ease-` |
| 13 | `density.unit` | the single entry `--hz-density` (key `density`) |

Emission order is **roles, hues, intents, rest** — `themeOwn()`
(`generate.ts:441`) appends `...theme.rest`, and `generateFull`'s group loop
(`:527`) becomes `[theme.palette, theme.intent, theme.rest]`, each preceded by
a blank line when non-empty, exactly as the existing two are. The derived-chain
block still follows.

This order is load-bearing: it preserves today's bytes for every existing
config. `dark.rest` and every named theme's `rest` are `[]` unless a config
fills them, so `tokens.css`, `utilities.css`, `ocean.css` and
`terminal.tokens.css` regenerate **byte-identical** after Stage 1. That is the
gate.

Three call sites enumerate the three lists and must gain `rest`:

- `validateReferences()` (`schema.ts:654`) —
  `[...t.palette, ...t.color, ...t.intent, ...t.rest]`, so a theme's non-color
  values are both reference-checked and referenceable.
- `themeOwn()` (`generate.ts:441`), above.
- `main.ts:184-189`'s token count — add `resolved.dark.rest.length`. Zero
  today; keeps the printed count honest for a config with dark type overrides.

`report.ts:74` keeps its three-list spread unchanged: the contrast report grades
color, and new groups are correctly invisible to it. R6 covers the one thing
that changes there.

**R3 — Validation moves to one shared group validator.** `validateThemes()`
(`schema.ts:386`) currently hard-rejects every non-color key via
`assertKnownKeys(theme, ['palette','color','intent'], …)`. That is the actual
gate this stage opens. Both `config.tokens` and each theme must now run the
same checks — the `TOKEN_GROUP_KEYS` list (`schema.ts:418`) **and** the nested
key assertions `resolveConfig` runs at `:454-473` (`typography`, `border`,
`motion`, `density`, plus `density.unit` being a string). Factor those into one
function (`assertTokenGroups(obj, where)`) called from both places; a theme
that sets `typography: { fontSizes: … }` must fail naming
`config.themes.x.typography`, not silently emit nothing.

The error text changes: `Valid keys: palette, color, intent` becomes the twelve
group names. `config.spec.ts:167` pins the old string and is updated, not
deleted.

**R4 — Density in a theme works at the page level and half applies below it.** A
theme may set `density: { unit }`; it emits `--hz-density: <unit>` inside the
theme block. The ceiling, stated because it cannot be fixed:

The near/away ladder is emitted as `body`-anchored element rules
(`tokens.css:173`, `densityBlock()` at `generate.ts:239`). `<html
data-theme="compact">` or `<body data-theme="compact">` works completely — the
unit is declared at or above the element every ladder rule applies to.

A `<section data-theme="compact">` is the partial case, and the split is per
rule, not per page. The `body` rule's `calc()` resolved on `body`, above the
section, so the section's own near/away inherit as fixed lengths and keep the
page's density. But `body [data-density-shift]` applies to the shift element
itself, so a shifted region *inside* the themed section resolves
`var(--hz-density)` against the section's value and does retune. The result
reads inconsistent rather than ignored, which is the honest thing to document
and the reason the docs sentence is more than one clause.

*Verified:* same principle as the derived-chain re-declaration — a `var()` in a
custom property resolves on the element the declaration applies to. Do not
restate the old "a section gets nothing" framing anywhere; it is wrong.

Required: **no attempt to fix this**, and a comment at the site where a theme's
`density.unit` becomes a `TokenEntry` (`resolveTheme`, R2 row 13) naming the
ceiling and the rejected upgrade path — theme-scoped ladder rules would have to
guess the themed element's `data-density-shift` depth, which is unknowable at
generate time. House comment style (prose, no tag); the repo has no `ponytail:`
convention to match. No runtime warning: the engine cannot know which element
the attribute will land on.

The docs copy for this is R22's; it must state the half-applying case, not just
"page-level". Already written on the Section themes page — match it, do not
replace it.

**R5 — `--hz-density` restores to its root value under `light`, never to
`initial`.** `--hz-density` is the one token that is not in
`resolved.sections` — it lives on `resolved.density` and is emitted inside the
`space` section by hand (`generate.ts:505-508`). So `lightRestore()`
(`generate.ts:572`) sees it in `changed` but not in `defined` and would emit
`--hz-density: initial`. That is the guaranteed-invalid value: every
`calc(var(--hz-density) * N)` in the ladder becomes invalid at computed-value
time, and near/away silently fall back to inherited values inside any
`[data-theme='light']` region. Required behavior:

- **Full mode.** `lightRestore` treats `--hz-density` as a defined root entry
  with value `resolved.density.unit`, positioned where `:root` puts it —
  immediately after the `space` section's restored entries — so the light block
  reads like the sheet it restores. One line: build the ordered root list as
  `resolved.sections.flatMap((s) => (s.id === 'space' ? [...s.entries, densityEntry] : s.entries))`.
- **Overrides mode.** `generateOverrides`'s restore list (`:705`) is filtered
  from `rootEntries`, which never contains `--hz-density`. When any theme block
  declares `--hz-density`, append `--hz-density: <resolved.density.unit>` as the
  **last** declaration of the light block, mirroring where the root block puts
  it (`:668`), and force `mergeLight` (`:658`) off — the merged root+light rule
  would declare the default unit at the scope selector and clobber a consumer's
  own `--hz-density` override inside that scope. `unitFromConfig` already
  disables `mergeLight` for the same reason; this is the second condition on
  the same flag.

**R6 — A theme with no color entries is not graded, and does not double the
report.** `declarationMaps()` (`report.ts:65`) emits one mode per theme; a
theme carrying only type or spacing would produce a full duplicate set of rows
under a mode whose colors are identical to `light`. Skip any **named** theme
whose `palette`, `color` and `intent` lists are all empty. `dark` is always
seeded from the base authoring and is never skipped. `contrastReport` otherwise
ignores `rest` entirely — grading is about color, and that is now something the
docs have to say rather than assume (R22).

---

## Stage 2 — Terminal, rebuilt as a theme that redefines type

Needs **no API change**: type under `tokens` has always been supported, so this
stage can land before Stage 1 does.

**R7 — Terminal declares the type it uses.** `terminal.config.ts` gains, under
`tokens`:

```ts
typography: {
	fontFamily: { mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
	fontSize: { xs: '0.75rem' }
}
```

- **`fontSize.xs` is a bug fix.** The shipped scale is `sm | base | lg | xl |
  2xl | 3xl` (`tokens/index.ts:148`) — there is no `xs`. Terminal's sheets
  reference `var(--hz-font-size-xs, 0.75rem)` at ten sites (`badge.css:26,36`,
  `field.css:17,37,48,103`, `tabs.css:28`, `alert.css:59`, `button.css:92`),
  every one of which has been painting from its literal fallback since the
  theme shipped. Declaring it makes those ten references resolve, and makes the
  step retunable in one place. The value is exactly what they paint today, so
  **nothing changes visually**. It is also the demonstration that a config group
  *extends*, not only overrides.
- **`fontFamily.mono` makes Terminal own its stack.** The ten hand-written
  `font-family: var(--hz-font-family-mono, ui-monospace, monospace)`
  declarations in the component sheets exist because the theme never declared a
  family of its own. No `@font-face`, no webfont load: the named face renders
  for readers who have it and falls through otherwise.
- The ten `var(--hz-font-size-xs, 0.75rem)` fallbacks **stay as written**. They
  now match a declared value, which is what the fallback-parity test
  (`examples.spec.ts:112`) checks; deleting them would break the promise that a
  cherry-picked component sheet degrades to this theme's look.

*Decided:* `themes.dark` stays **color-only**. Terminal's dark is a luminance
mode — true black, hotter phosphor — and type that changes when a reader flips
modes reflows the page for no design reason. The type demo belongs in `tokens`,
which is the default theme.

*Decided:* `fontFamily.sans`/`serif` are **not** set, and the square corners
stay literal `border-radius: 0` rather than becoming a zeroed `radius` group.
Nothing in Terminal reads either, so both would be config for a value nobody
looks up.

**R8 — One source for the family, inheritance for the rest.** `terminal.css:64`
(`.hz-theme-terminal`) keeps `font-family: var(--hz-font-family-mono,
ui-monospace, monospace)` — it is the single declaration the theme's subtree
inherits from, and the generic fallback is what makes the sheet survive being
cherry-picked without its tokens. Every other site follows one rule: **delete
where the element inherits, `font-family: inherit` where UA styles block
inheritance** (form controls and `<button>`).

| Site | Element | Action |
| --- | --- | --- |
| `components/button.css:31` | `.hz-button` (`<button>`/`<a>`) | `font-family: inherit` |
| `components/accordion.css:28` | `.hz-accordion-trigger` (`<button>`) | `font-family: inherit` |
| `components/accordion.css:78` | `.hz-accordion-panel` (div) | delete |
| `components/tabs.css:27` | `.hz-tabs-trigger` | delete — the rule already carries `font: inherit` on the line above |
| `components/field.css:65` | `select, textarea, .hz-input-wrapper, .hz-combobox-control` | `font-family: inherit` |
| `components/field.css:16,36,47` | label, description, error | delete |
| `components/badge.css:25` | `.hz-badge` (span) | delete |
| `components/alert.css:25` | `.hz-alert` | delete |
| `components/card.css:73` | `.hz-card-title` (`<h3>`) | delete |

Hand-edit each file; **no regex sweep** across the directory. Every rule here
is scoped under `.hz-theme-terminal`, which is always an ancestor, so the
inherited family is always the theme's.

**R9 — Regenerate, do not hand-edit.** `terminal.tokens.css` is rebuilt with
`corepack pnpm gen:tokens`; its drift test (`examples.spec.ts:29`) is the gate.
The scoped overrides sheet gains the two type declarations in the
`.hz-theme-terminal` block. Nothing else in the sheet moves, and `ocean.css`,
`tokens.css` and `utilities.css` stay byte-identical.

---

## Stage 3 — The per-component theme hooks, from the config

Today the ~35 hooks that make up the per-component styling contract
(`--hz-button-accent`, `--hz-loading-speed`, `--hz-modal-width`, …) can only be
set in hand-written CSS. They are the last part of the design system that lives
outside `hyzer.config.ts`.

**R10 — The vocabulary lives in `src/lib`, the prose stays in `src/docs`.**
New published module `src/lib/tokens/hooks.ts`:

```ts
export interface ComponentHook {
	/** Full custom-property name. */
	name: string;
	/** The class the hook must be DECLARED on for a config value to reach it. */
	on: string;
}
export const componentHooks: readonly ComponentHook[];
```

One row per config-reachable hook, ordered by component (docs order), so
emission is deterministic. `on` is the component's root class from
`src/docs/hooks.ts` — except where the hook is read on a different element that
the theme also declares it on (Toggle's `--hz-toggle-width` / `-height` sit on
`hz-toggle`, the input, not on the compound `hz-field hz-field--toggle` root).

`src/docs/hooks.ts` keeps every `props` row and its prose; the config never
imports it. The dependency direction is docs → lib, never lib → docs.

*Decided:* an authored list in `src/lib`, held equal to the docs curation by a
test (R12) — **not** a generator that mirrors `src/docs/hooks.ts` into `src/lib`
(a fourth generated file and a fourth drift test for data that changes twice a
year), and **not** moving `hooks.ts` wholesale into `src/lib` (≈2,200 lines of
docs prose would join the `theme()` attachment's lazy-loaded config bundle).

**R11 — What is in the vocabulary, and what is deliberately not.**

**In:** every `--hz-*` `props` row in `src/docs/hooks.ts` — the ~35 hooks
across 23 components: `--hz-button-accent/-tint/-glow/-on-accent`,
`--hz-alert-tint/-border-width`, `--hz-badge-tint`,
`--hz-banner-bg/-fg/-padding-block/-padding-inline`,
`--hz-blockquote-border-width/-font-size`, `--hz-card-media-size`,
`--hz-carousel-dot-size/-gap/-item-width/-rail-inset/-focus-min-height`,
`--hz-code-block-bg/-padding/-fade-height`, `--hz-footer-col-min`,
`--hz-loading-fill/-track/-size/-speed/-ease/-ring-width/-pulse-width`,
`--hz-logo-color/-size/-brightness`, `--hz-modal-width`,
`--hz-skeleton-color/-highlight/-speed`, `--hz-toggle-width/-height`,
`--hz-slider-track-height/-thumb-size/-length`.

**Out, and the reason must survive in the file so a later builder does not
"complete" the coverage:**

- **Per-instance plumbing** — values a component writes inline from a prop, so a
  stylesheet declaration is overridden on every instance: `--hz-grid-cols*`,
  `--hz-grid-min`, `--hz-parallax-x/-y/-z/-range`, `--hz-slider-fill*`,
  `--hz-slider-chars`, `--hz-textarea-rows`,
  `--hz-tick-pos`, `--hz-breakout-shift`, `--hz-horizontal-scroll-*`,
  `--hz-image-fade-duration/-placeholder-blur`, `--hz-color-swatch-size`,
  `--hz-logo-ratio/-width-factor`. `src/docs/hooks.ts`'s header already names
  several of these as plumbing; this is the same line, drawn once more.
- **`--hz-field-ring`**, which is already in `INTERNAL_HOOKS`
  (`src/docs/hooks.ts:70`): an internal focus-ring recipe, retuned through the
  focus/primary tokens.
- **Global tokens** (`--hz-color-*`, `--hz-space-*`, `--hz-width-*`) — already
  config-reachable through their own groups.

Some excluded names *are* documented `props` rows (Parallax, HorizontalScroll).
Those rows stay in the docs — they are real CSS knobs a consumer sets per
breakpoint or per instance — they simply are not a global config decision. R12
makes that split explicit rather than implicit.

The test that separates the two: **does the reference theme declare it?**
`--hz-parallax-range` and the three `--hz-horizontal-scroll-*` names are
declared nowhere in `src/lib/theme` — they exist only as `var(--x, fallback)`
reads, which is what per-instance means. Slider's three are declared, in a rule
whose own comment calls them override hooks
(`src/lib/theme/components/field.css:216-221`), which makes them a theme
decision like `--hz-badge-tint` and puts them **in** the vocabulary. Slider's
`--hz-slider-fill` stays out on the same test: it is derived state, written per
instance. A consumer who wants a per-instance length still overrides in CSS and
still wins — R14 emits at 0,0,0.

**R12 — Two gates, both in `src/docs/hooks.spec.ts`.** It already loads the
theme corpus and the curation; no new test file.

1. **Set equality with a named exclusion map.** Every `--hz-*` `props` row
   across `hooks` is either in `componentHooks` or in a new exported
   `INSTANCE_HOOKS: Record<string, string>` (name → one-line reason), never
   both, never neither; and every `componentHooks` name is a documented `props`
   row. Same shape and same discipline as the existing `INTERNAL_HOOKS`
   treatment (`hooks.spec.ts:231-251`), including a stale-entry test. This is
   what stops the two lists rotting apart.
2. **`on` really is the declaring element.** For every `componentHooks` row,
   scan the reference-theme CSS (`themeCss`, examples excluded) for rules that
   **declare** that name, and assert every selector in such a rule has `on` in
   its **subject** (last compound). A hook declared on a descendant of `on`
   cannot be reached by R14's rule, and this fails loudly at build time instead
   of silently at runtime. Reuse the rule splitter shape from
   `examples.spec.ts:141-160` (duplicate the ~20 lines; do not export a test
   helper from `src/lib`). Failure names the file, the selector and the hook.

**R13 — The config group.** `HyzerTokensOverride` gains
`components?: TokenGroupOverride` — flat, camelCase, keyed by the hook name
minus `--hz-`:

```ts
tokens: {
	components: {
		buttonAccent: 'var(--hz-intent-secondary)',
		badgeTint: '20%',
		loadingSpeed: '900ms',
		codeBlockBg: 'var(--hz-color-surface-muted)'
	}
}
```

- Resolution reuses
  `mergeGroup([], tokens.components, '--hz-', 'config.tokens.components')` —
  seeded from `[]`, so **only what the config sets is emitted**, and a config
  that sets none emits zero bytes.
- After the merge, every entry's `cssName` must be in `componentHooks`.
  Otherwise `HyzerConfigError`: name the key, the property it kebab-cased to,
  and point at the component-hooks docs page. A typo must never emit a dead
  declaration.
- The result is `ResolvedConfig.components: TokenEntry[]` — a top-level field,
  **not** a `ResolvedSection`, because sections are `:root` declarations and
  these are not. `validateReferences()` includes it in `all`, so hook values may
  reference tokens (and be referenced).
- `TOKEN_GROUP_KEYS` gains `components`; per R1 a theme entry rejects it.

*Decided:* a flat camelCase group, not `components: { button: { accent } }`.
The flat form reuses `mergeGroup` and `toKebab` untouched, needs no
component-key → prefix mapping, and sidesteps hooks documented under two
components (`--hz-button-accent` appears under Pagination too — it has exactly
one owning element either way).

**R14 — Emission: one rule per owning class, at the end of the sheet.**
After the custom-intent section (`generate.ts:558`, `:720`), in **both** modes,
under a section banner:

```
:where(.hz-button) {
	--hz-button-accent: var(--hz-intent-secondary);
}

:where(.hz-badge) {
	--hz-badge-tint: 20%;
}
```

- **Grouping** by `on`, in `componentHooks` order; within a rule, the config's
  own key order. Same resolved config → same bytes.
- **Cascade posture: unlayered, `:where()`, zero specificity** — the same
  posture and the same rationale as `specs/62 R2`. Unlayered beats
  `@layer hz-theme`'s declaration on the same element (which is the whole point:
  `.hz-button` declares `--hz-button-accent` itself, so an inherited `:root`
  value would never be consulted), and 0,0,0 means any consumer rule wins.
- **Scoped sheets** (`GenerateOptions.selector !== ':root'`) emit the
  descendant + compound pair, one selector per line, exactly as
  `intentSelectors()` does (`generate.ts:348`). Generalize that helper to take
  the target selector text (`[data-intent='x']` or `.hz-button`) and serve both
  callers; do not copy it.
- A standalone theme that declares the same hook at non-zero unlayered
  specificity (Terminal) keeps winning. Intended, and identical to specs/62.

**R15 — The contrast report reads the configured tints.** `report.ts:25`
hardcodes `softTints` (`badgeText: 0.65`, `alertTitle: 0.7`,
`light.badgeBg: 0.14`, `light.alertBg: 0.1`, `dark.badgeBg: 0.28`,
`dark.alertBg: 0.22`) as a mirror of what the reference theme paints. The moment
`--hz-badge-tint` and `--hz-alert-tint` are config-reachable, that mirror can
lie — and it lies by grading a color the page does not paint, which is a silent
wrong answer, not a crash.

Required: when `resolved.components` carries `--hz-badge-tint` or
`--hz-alert-tint`, `contrastReport` uses the configured value in place of the
matching `badgeBg`/`alertBg` fraction, in **every** mode (the hooks are
root-only, so one value per run).

- Accepted form: a `<percentage>` literal (`20%`), parsed to a fraction.
- Anything else (a `var()` chain, a `calc()`): keep the built-in recipe and add
  the hook name to `report.unresolved`, so the run says out loud that it could
  not grade the override. Do not skip the rows — an ungraded soft recipe is
  worse than one graded against the default.
- `softTints.badgeText` / `alertTitle` are text mixes with no hook of their own
  and stay fixed. The comment block above `softTints` gains the sentence that
  the background fractions are now config-overridable.
- Button's soft variant is still not graded (it never was). Non-goal.

**R16 — What Stage 3 does not change.** No component `.svelte` file, no
reference-theme sheet, no `hooks.ts` prose row, no new public export from the
package entry (the vocabulary is internal; `src/lib/tokens/hooks.ts` is
imported by `config/schema.ts` and by the docs spec).

---

## Stage 4 — The contrast bar belongs to the design system

**R17 — Two config keys, mapped to what they actually govern.**

```ts
export default defineConfig({
	contrast: { level: 'AAA' },  // the grading bar; default 'AA'
	strict: true                 // a miss fails the run; default false
});
```

- `config.contrast?: { level?: 'AA' | 'AAA' }` → `ResolvedConfig.contrast: { level: 'AA' | 'AAA' }`, default `'AA'`.
- `config.strict?: boolean` → `ResolvedConfig.strict: boolean`, default `false`.
- Both join `assertKnownKeys(config, …)` at `schema.ts:449`; an unknown key
  under `contrast`, or a non-boolean `strict`, is a `HyzerConfigError` naming
  the key.

*Decided:* `strict` is **top-level, not `contrast.strict`.** The flag it mirrors
also fails on unknown icon names (`main.ts:244`), so it is not a contrast
setting; nesting it there would misdescribe it the first time someone reads the
config.

**R18 — Grading is a threshold swap, not new math.** `gradeContrast`
(`utils/contrast.ts:86`) already computes the AAA thresholds, and every pairing
the report grades is normal text by construction (text on a surface). So
`ContrastReportRow.pass` (`report.ts:198`) becomes `ratio >= threshold`, where
threshold is `4.5` for `AA` and `7` for `AAA`, read from
`resolved.contrast.level`. `ContrastReport` gains `level`, so the CLI and any
consumer can say which bar was applied. `row.level` (the best achieved grade)
and `bestLevel()` are unchanged — they describe the ratio, not the bar.

The library's own hues are tuned to AA (`tokens/index.ts:19`), so `AAA` on the
shipped palette reports failures. That is information, not a bug, and the docs
say so (R22).

**R19 — Flag and config precedence, following `--utilities`.** The effective
strictness is `parsed.strict === true || resolved.strict` (`main.ts:244`) —
the flag turns it on even when the config does not, and there is no
`--no-strict`, exactly as `--utilities` behaves at `main.ts:200`. Consequences
for output:

- The two `(warnings; use --strict to fail the build)` suffixes (`main.ts:224`,
  `:236`) key off the effective value, so a config-strict run does not advertise
  a flag it does not need.
- The contrast lines (`:222`, `:225`) name the configured bar: `all pass WCAG
  AA` / `WCAG AAA`.
- `USAGE` (`main.ts:41`)'s `--strict` line notes the config key.
- No `--level` flag is added: the bar describes the design system, not the run.

**R20 — Examples and the base stay at AA.** Neither example config sets
`contrast`, so `ocean.css`, `terminal.tokens.css` and every existing assertion
about the report are unchanged. No emitted CSS changes at all in this stage.

---

## Stage 5 — The density rungs, from the config

**R21 — `density.ladder` sets the rung values; `density.levels` stays closed.**
`specs/64 R11` made the four rungs (`--hz-density-ladder-depth-1…4`) public and
deliberately declared none of them, so a CSS override wins from anywhere and a
scoped `--hz-density` still retunes every level inside a section. A config key
must keep both properties, so it does **not** declare rungs either — it
substitutes the value into the existing `var()` **fallback**:

```ts
tokens: { density: { ladder: { depth1: 'var(--space-10)', depth3: '0.5rem' } } }
```

emits, at depth 3 (`densityBlock()`, `generate.ts:239`):

```
--hz-space-near: var(--hz-density-ladder-depth-3, 0.5rem);
--hz-space-away: var(--hz-density-ladder-depth-2, calc(var(--hz-density) * 5));
```

- Only the fallback expression changes, and only for the depths the config set.
  Every untouched depth keeps `calc(var(--hz-density) * N)` verbatim, so a
  no-ladder config emits `tokens.css` byte-identical.
- A CSS-side rung override still wins (it is the outer `var()`), and the
  scoped-`--hz-density` behavior survives for every rung the config left alone.
- Keys are `depth1`…`depthN` for `density.levels.length` depths (four today),
  derived, not hardcoded. A key that is not `depth<1..levels.length>` is a
  `HyzerConfigError` naming the valid range.
- Root-only (R1): a theme cannot set it.

*Decided:* the **rung values**, not `density.levels`. The multipliers describe
the shape of the derivation, not a token; opening them would add a second way to
express what the rungs already express, plus a validation surface for the
ladder walk (`generate.ts:248-265`) that only exists today because the metadata
is trusted. The rungs cover the "bring your own spacing scale" case from the
config exactly as they cover it from CSS.

---

## R22 — Docs and template follow-through

Consumer framing throughout, then an **editor-agent pass on every copy change
before commit** (plain language, no em-dash tells, accessible). Each item is
tagged with the stage that motivates it; a stage's docs land in the same commit
as its code.

**`src/lib/cli/config-template.js` — one edit, three surfaces.** The template
is `hyzer init`, the Config page's "Full config reference", and the
`@hyzer-labs/sv` add-on (`sv-addon/src/index.js:100`).

- *(Stage 1)* The `themes` block (`:48-56`) stops describing itself as color.
  The three annotations ("hue overrides for dark", "role overrides for dark",
  "intent remaps for dark only") lose the color-only framing, the block comment
  says a theme takes any group `tokens` takes, and a third entry shows it —
  name it something that is plainly not about color and not about density, e.g.
  `print: { typography: { fontSize: { base: '0.9rem' } }, radius: { md: '0' } }`.
- *(Stage 3)* A `components:` line under `tokens`, with two real hooks and a
  comment naming the rule (a per-component hook, camelCased, without the
  `--hz-` prefix).
- *(Stage 4)* `contrast: { level: 'AAA' }` and `strict: true` lines.
- *(Stage 5)* A `density.ladder` line beside the existing `density.unit`.
- **New test:** the template claims to be valid as written and nothing checks
  it. Add one case to `src/lib/cli/main.spec.ts`: strip the leading `// ` from
  each line, swap the `defineConfig` import for a local identity function, write
  it to the sandbox as `.mjs`, import it, and `resolveConfig()` the default
  export without throwing. That makes the template a live gate for every stage
  at once.

**`src/routes/docs/foundation/config/+page.svelte`.**

- *(Stage 1)* `configCode` (`:65`) shows `themes` directly under a `tokens`
  block that already demonstrates typography and density, which implies the
  subset. Add a second theme entry carrying a non-color group, and one comment
  line saying a theme takes any group.
- *(Stage 3)* `tokens.components` in the same sample plus a short paragraph:
  these are the same per-component custom properties the component pages
  document, set once for the whole system instead of in your own CSS.
- *(Stage 4)* The `cliFlags` table (`:31`): `--strict` gains the config key
  `strict`, and its note gains "the flag turns it on even when the config does
  not". Add a `contrast` row to whatever lists config-only keys.
- *(Stage 4)* The doctrine paragraph at `:236` — "Three flags have no config
  equivalent at all, because they describe a single run rather than your design
  system" — is now wrong on the count and needs the principle restated so it
  stays true: the flags that stay flag-only (`--config`, `--mode`, `--check`,
  `--help`) name one run; everything that describes the design system has a
  config key, and `--out`, `--utilities` and `--strict` are the three that have
  both.

**`src/routes/docs/theming/sections/+page.svelte`** *(Stage 1)*. The page is
color end to end, so the new capability is invisible.

- The `inlineTheme` object (`:10`) — which the demo band and the `inlineCode`
  sample deliberately share, so they cannot disagree — gains a non-color group:
  a radius override that makes the band's Badge and Button visibly square, plus
  one type token. Read `theme/components/{badge,button}.css` to pick the
  radius keys those two actually consult; the change has to be visible on
  sight. `inlineCode` mirrors it exactly, and the band's paragraph says what
  changed.
- "Define your themes" (`:121`): one sentence that a theme entry takes any group
  `tokens` takes — type, spacing, radii, motion — not only color, and that the
  inline object above is the same shape.
- The claim that themes are "graded for contrast the same way the built-in dark
  theme is" (`:124`) becomes a partial description: a theme with no color of its
  own has nothing to grade. One clause, not an alarm.
- R4's ceiling, stated accurately: on `<html>` a theme retunes density
  completely; on a section it half applies (the section's own spacing keeps the
  page's density, while a `data-density-shift` region inside it picks up the new
  value), so a theme that changes density belongs on `<html>`. Already written
  on the Section themes page and editor-passed — match it rather than rewriting.
- The existing class-scope trade-off ("a class composes with dark, a `themes`
  entry cannot") survives intact and gets more important now that a theme can
  carry type and spacing. Keep it; strengthen the pointer.

**`src/routes/docs/theming/tokens/+page.svelte`** *(Stage 1)*. The doctrine
blockquote pair at `:101-111`: the first is a color-tier statement standing in
for a general one. Add the companion line to the second blockquote (the one that
already says dark is one entry in a `themes` map): a theme may carry any token
group, with a pointer to Section themes.

**`src/routes/docs/theming/components/+page.svelte`** *(Stage 3)*. One short
paragraph at the top of the rollup: every hook in these tables can also be set
in the config under `tokens.components`, camelCased without the `--hz-` prefix,
and the generator writes the rule for you. Per-row config keys are **not**
added — the rule is mechanical and a column of derived names is noise.

**`src/routes/docs/foundation/contrast/+page.svelte`** *(Stage 4)*. One
paragraph: the bar is a config choice; AAA raises every graded pairing to 7:1;
the shipped palette is tuned to AA, so turning AAA on reports failures against
the defaults until you retune your hues.

**`src/docs/agentRules.ts:52-66`** *(Stage 1, Stage 3)*. Drives both
`/docs/agents` and the served `agents.md`. The "Apply named themes with
data-theme" body gains a clause — a theme is a token override, not a color
override — and its sample gains a non-color entry. The "Generate tokens; never
hand-edit them" rule gains one sentence once Stage 3 lands: per-component hooks
are config-reachable too, so reach for `tokens.components` before writing a CSS
override.

---

### Edge cases

| Case | Expected |
| --- | --- |
| No config, after every stage | Every committed sheet byte-identical; the `tokens.css` / `utilities.css` / `ocean.css` drift tests are the proof. |
| `themes.x` with only `typography` | Theme block carries the type declarations after the (empty) intent group; no color rows in the report; no contrast mode for it. |
| `themes.x.typography.fontSizes` (typo) | `HyzerConfigError` naming `config.themes.x.typography` and the four valid keys. |
| `themes.light` | Still rejected, unchanged message. |
| `themes.x.components` / `themes.x.density.ladder` | `HyzerConfigError` naming the key and pointing at `config.tokens.…`. |
| Theme overrides `fontSize.base`; config authored `fontSize.lg: calc(var(--hz-font-size-base) * 1.4)` | `--hz-font-size-lg` is re-declared in the theme block under the derived-chain note. |
| Theme sets a token `:root` never declares | Restored to `initial` under `[data-theme='light']`, as today for colors. |
| Theme sets `density.unit`, applied to `<html>` | Every distance retunes. |
| Same theme applied to a `<section>` | Distances unchanged; documented ceiling, no warning, no error. |
| Theme sets `density.unit`, full mode | `[data-theme='light']` restores `--hz-density: <root unit>` after the space entries — never `initial`. |
| Theme sets `density.unit`, overrides mode | Same restore, last line of the light block; root and light are not merged into one rule. |
| `themeVars({ radius: { md: '0' } })` | Returns `{'--hz-radius-md': '0'}`; the `theme()` attachment writes it inline and the subtree re-rounds. Density inline carries R4's ceiling. |
| Terminal, after Stage 2 | Identical rendering except the mono face; `--hz-font-size-xs` resolves instead of falling back; fallback-parity and drift tests green. |
| `tokens.components.buttonAcent` (typo) | `HyzerConfigError` naming the key and `--hz-button-acent`. |
| `tokens.components.parallaxX` | Same error — not in the vocabulary, by R11. |
| `tokens.components` set, `overrides` mode | Same rules, same place (end of sheet). |
| `tokens.components` set, scoped sheet | Descendant + compound pair per rule, as the custom-intent section does. |
| Consumer rule `.hz-button { --hz-button-accent: … }` | Wins — the emitted rule is `:where()`, 0,0,0. |
| A future hook declared on a descendant of its `on` class | R12's scan fails, naming file, selector and hook. |
| `components.badgeTint: '20%'` | The report grades the 20% mix in both modes. |
| `components.badgeTint: 'var(--x)'` | Built-in recipe still grades; `--hz-badge-tint` listed in `unresolved`. |
| `contrast.level: 'AAA'` on the base palette | Report fails; every row's `pass` is `ratio >= 7`; CLI names WCAG AAA. |
| `strict: true` in config, no flag | Non-zero exit on a failure; the message does not tell you to pass `--strict`. |
| `--strict` with `strict: false` | Strict, as today. |
| `density.ladder.depth5` | `HyzerConfigError` naming the valid depth range. |
| `density.ladder.depth1` set, plus a CSS rung override | The CSS override wins; the config value is the fallback. |
| `--hz-density` overridden on a section, with `ladder.depth3` set | Depths 1, 2 and 4 still retune inside the section; depth 3 is aliased and does not. |

### Existing code to reuse

- **`mergeGroup()` / `flattenRampGroup()` / `toKebab()`** (`schema.ts:267`,
  `:306`, `:226`) — every new group resolves through them. No second merge path.
- **`assertKnownKeys()`** (`schema.ts:235`) — R3's shared group validator wraps
  it; the nested checks already exist at `:454-473` and move, not multiply.
- **`closureFrom()` / `themeBlock()` / `lightRestore()`** (`generate.ts:413`,
  `:464`, `:572`) — already generic. Stage 1 adds entries to their inputs, not
  branches to their bodies.
- **`intentSelectors()`** (`generate.ts:348`) — generalize for R14's target
  selector; it already owns the scoped compound + descendant pair and the
  Prettier reasoning behind one selector per line.
- **`customIntentSection()`** (`generate.ts:377`) — the shape of an
  end-of-sheet, banner-headed, both-modes rule section. R14 is its sibling.
- **`INTERNAL_HOOKS` + its three tests** (`src/docs/hooks.ts:70`,
  `hooks.spec.ts:231-251`) — the exact pattern for R12's `INSTANCE_HOOKS`.
- **The rule splitter in `examples.spec.ts:141-160`** — R12's selector-subject
  scan.
- **`gradeContrast()` / `bestLevel()`** (`utils/contrast.ts:86`, `:100`) — R18
  needs a threshold, not new math.
- **`main.ts:200`'s `--utilities` precedence** — R19's exact shape.
- **`scripts/gen-tokens.ts` / `corepack pnpm gen:tokens`** — Stage 2's
  regeneration; the drift tests are the gate.

### Test plan

Runner: **Vitest**, existing projects — `server` (node) for the engine, CLI,
and source scans; `client` (chromium, Playwright provider) only where noted.
No new e2e: every behavior here is engine output or CSS resolution.

**Server — `src/lib/config/config.spec.ts` (Stage 1):**

- One case per non-color group (all thirteen rows of R2's table): a theme
  carrying it resolves into `rest` with the right `cssName`, and full-mode
  output declares it inside that theme's block.
- Emission order: roles, hues, intents, rest, then the derived chain.
- Byte-drift: the existing `tokens.css`, `utilities.css` and `ocean.css` tests
  stay green with no regeneration.
- An unknown theme group errors listing the twelve names; a bad nested key
  errors naming `config.themes.x.typography`; `themes.light` still rejected;
  `themes.x.components` and `themes.x.density.ladder` each error naming the
  root path.
- Derived-chain closure fires for a non-color reference (the `fontSize.lg`
  case above).
- Light restore of a non-color token (`radius.md` → base value) and of a
  theme-only token (→ `initial`).
- Density in a theme: block declares `--hz-density`; light block restores the
  root unit in full mode and in overrides mode; overrides mode does not merge
  root and light.
- `themeVars({ radius: { md: '0' } })` returns the flat map.
- Report: a type-only theme adds no rows and no mode; a color theme still
  grades.

**Server — `config.spec.ts` (Stage 3):** the vocabulary check (unknown key
errors, valid key resolves), grouping and order of the emitted rules, both
modes, scoped pair, determinism across two calls, position after the
custom-intent section, and zero output when the group is absent. Plus the
`softTints` cases: a percentage tint moves the graded mix in both modes; a
`var()` tint keeps the recipe and lands in `unresolved`.

**Server — `src/docs/hooks.spec.ts` (Stage 3):** R12's two gates, with a stale
`INSTANCE_HOOKS` entry test mirroring the `INTERNAL_HOOKS` one.

**Server — `config.spec.ts` + `src/lib/cli/main.spec.ts` (Stage 4):**
`contrast.level: 'AAA'` makes `pass` the 7:1 answer for every row and
`report.level` say so; the default stays AA and every existing assertion holds;
`strict: true` alone exits non-zero on a failing config and the output omits
the "use --strict" suffix; `--strict` with a non-strict config still exits
non-zero; an unknown `contrast` key and a non-boolean `strict` are config
errors.

**Server — `config.spec.ts` (Stage 5):** a set rung changes only that depth's
fallback; unset depths keep `calc(var(--hz-density) * N)` verbatim; an
out-of-range depth errors; `tokens.css` is byte-identical with no ladder set.

**Server — `main.spec.ts` (R22):** the uncommented `CONFIG_TEMPLATE` resolves
without throwing.

**Server — `examples.spec.ts` (Stage 2):** the existing drift, AA and
fallback-parity tests are the gate; the parity test now also covers the ten
`--hz-font-size-xs` fallbacks, because the token exists. No new test.

**Client:** one case in `src/lib/attachments/theme.svelte.spec.ts` — an inline
override carrying a non-color group writes that custom property onto the
element's style and removes it on teardown.

### Gate

The full gate from `AGENTS.md` at every stage boundary — token and API changes
here routinely break something that looks unrelated, and a stage that has not
passed it is not a commit:

```sh
corepack pnpm exec svelte-check
corepack pnpm exec vitest run
corepack pnpm exec eslint .
corepack pnpm exec prettier --check .
corepack pnpm exec vite build
corepack pnpm exec playwright test
```

E2e needs a preview server you start yourself, and it **must be restarted after
a rebuild** or it serves the previous build:

```sh
lsof -ti:4173 | xargs kill -9
corepack pnpm exec vite preview --port 4173 &
```

`pnpm` is not on `PATH`; `corepack pnpm …` throughout. Stage 2 regenerates with
`corepack pnpm gen:tokens` — never hand-edit `terminal.tokens.css`.

All of this lands on one feature branch; commit per stage (or more often),
never to `main`, and do not push unless told.

### Non-goals

- **A `compact` theme, shipped or demoed.** Density in a theme works at the page
  level only (R4); a shipped `compact` would teach the ceiling as a feature.
- **A theme × mode matrix on the attribute.** One attribute holds one value; a
  class scope remains the answer, and it gets more useful now that a theme can
  carry type and spacing.
- **Making section-scoped density work.** Rejected in R4 with the reason.
- **Per-theme component hooks.** Rejected in R1 with the alternative: point a
  hook at a token, and the token flips per theme on its own.
- **Per-instance plumbing in the config** (R11's exclusion list). A `:root`
  declaration for a value the component writes inline is a config key that does
  nothing.
- **`density.levels` in the config** (R21). The rungs already cover it.
- **A `--level` CLI flag** (R19), and `--no-strict`.
- **Grading Button's soft variant** (R15). It was never graded; adding it is a
  contrast-model change, not a config change.
- **Per-row "config key" columns in the component hook tables** (R22). The rule
  is mechanical; the column is noise.
- **`hyzer generate --check` reading the committed sheet.** `specs/66`.
- **Validating that a hook value is the right CSS type.** The engine emits token
  values verbatim everywhere else; a length where a color belongs fails in the
  browser exactly as a hand-written one would.

### Write scope

**Stage 1:** `src/lib/config/schema.ts`, `generate.ts`, `report.ts`;
`src/lib/cli/main.ts` (one addend); `src/lib/config/config.spec.ts`.
**Stage 2:** `src/lib/theme/examples/terminal/terminal.config.ts`,
`terminal.tokens.css` (regenerated), and the seven component sheets named in
R8's table.
**Stage 3:** `src/lib/tokens/hooks.ts` (new), `src/lib/config/schema.ts`,
`generate.ts`, `report.ts`, `config.spec.ts`; `src/docs/hooks.ts` (one exported
map), `src/docs/hooks.spec.ts`.
**Stage 4:** `src/lib/config/schema.ts`, `report.ts`, `src/lib/cli/main.ts`,
`config.spec.ts`, `src/lib/cli/main.spec.ts`.
**Stage 5:** `src/lib/config/schema.ts`, `generate.ts`, `config.spec.ts`.
**R22:** `src/lib/cli/config-template.js`, `src/lib/cli/main.spec.ts`,
`src/docs/agentRules.ts`, `src/routes/docs/foundation/config/+page.svelte`,
`src/routes/docs/foundation/contrast/+page.svelte`,
`src/routes/docs/theming/sections/+page.svelte`,
`src/routes/docs/theming/tokens/+page.svelte`,
`src/routes/docs/theming/components/+page.svelte`.

No new dependencies. No component (`.svelte`) changes. No changes under
`sv-addon/` (it consumes the template by import). New public API: one type
alias, four config keys (`tokens.components`, `tokens.density.ladder`,
`contrast`, `strict`), one field each on `ResolvedTheme`, `ResolvedConfig` and
`ContrastReport`.
