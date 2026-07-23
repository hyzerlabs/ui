# Icons v2 — the full Lucide set, trimmed through the config

> **Supersedes specs/09-icons.md entirely.** This document is the whole
> icons contract — v1's hand-vendored set, its brand marks, and its
> requirements are replaced, not amended. On execution, 09 gets a tombstone
> header pointing here (R10).

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) as pass/fail. Write scope: `scripts/gen-icons.ts` (new),
> `src/lib/icons/**`, `src/lib/config/**` (schema + generate + report),
> `src/lib/cli/**`, `package.json` (`./icons/*` export, `lucide` dev-dep,
> `gen:icons` script), `src/lib/exports.spec.ts`, the `/foundation/icons`
> docs page + e2e, and the spec amendment in R10. Runs **before** the docs
> audit (specs/37).

### Goal

Today the library vendors 21 hand-written icons (14 UI glyphs from Lucide,
7 brand marks from Simple Icons). Decided with the user (2026-07-21): ship
the **entire Lucide set** as generated per-icon Svelte components — and
**only** Lucide: the 7 hand-drawn brand marks are deleted outright (user:
they look like trash; consumers needing brand marks bring their own — every
icon-accepting component takes snippets). The existing config file is the
trimming mechanism — a consumer's
`hyzer.config.ts` declares the icons their app uses, `hyzer generate` emits
a project-local barrel of exactly that set, and the **load-bearing core
icons ship no matter what** (chevrons, close, menu — the glyphs the
components themselves depend on).

This extends the token engine's three-tier story to icons:

1. Zero config — import any icon from `@hyzer-labs/ui/icons`; bundler
   tree-shaking keeps the app lean.
2. Deep imports — `@hyzer-labs/ui/icons/<name>` for apps that want to skip
   the barrel entirely (dev-server graph hygiene).
3. Config — `icons: [...]` + `hyzer generate` emits a curated barrel: the
   app's autocomplete surface is its own icon vocabulary, not 1,600 names.

The library stays zero-dependency at runtime: `lucide` (data package, ISC)
is a **pinned dev-dependency** consumed only by the generator script.

### Requirements

1. **R1 — Generator, build-time only.** `scripts/gen-icons.ts` (run via
   `pnpm run gen:icons`, tsx, like `gen:tokens`) reads every icon's node
   data from the pinned `lucide` package and emits, per icon:
   `src/lib/icons/generated/<kebab-name>.svelte`, plus
   `src/lib/icons/generated/index.ts` (the full barrel, alphabetical) and
   `src/lib/icons/generated/manifest.ts` (sorted valid kebab names + a
   `LUCIDE_VERSION` stamp read from the installed package). The generated
   directory is **gitignored — never committed**; generation runs
   automatically from the `prepare` script (so a fresh clone + install has
   the set) and as a pre-step of `package`. Determinism still holds (same
   lucide version → same bytes). A `gen-icons.spec.ts` asserts the
   generated output exists and its `LUCIDE_VERSION` stamp matches the
   installed `lucide` version — a version bump fails this test with a
   "re-run gen:icons" message instead of a committed diff. The dev-dep is
   **exact-pinned** in `package.json`; that pin is the single source of
   truth for what underlies the set. Each generated file carries the ISC
   attribution header naming the version.
2. **R2 — Generated component contract.** Every generated icon keeps the
   existing `IconProps` contract exactly: `size=24`, `strokeWidth=2`,
   `class` merged onto `hz-icon`, decorative-by-default (`aria-hidden`
   unless `ariaLabel` is given, then `role="img"` + label), rest-props
   forwarded, `stroke="currentColor"` / `fill="none"` / round caps-joins,
   24×24 viewBox. Export names follow the current convention:
   `Icon<PascalName>` (`chevron-down` → `IconChevronDown`). All 21
   hand-written icons are **deleted**: the 14 UI glyphs' generated
   equivalents keep the same export names (no import in components, docs,
   or samples changes), and the 7 Simple Icons brand marks are removed
   without replacement — a breaking removal, fine while greenfield. The
   Footer docs demo (the one consumer) migrates its social-links example to
   generic Lucide glyphs (e.g. `globe`, `mail`, `rss`) with a line noting
   that real brand marks are bring-your-own via the snippet props.
3. **R3 — Exports.** `@hyzer-labs/ui/icons` re-exports the full generated
   barrel plus `IconProps` — the brand-icon exports are gone.
   New subpath `./icons/*` maps to per-icon modules for deep imports
   (`@hyzer-labs/ui/icons/chevron-down`). `exports.spec.ts` pins both; the
   packaged output resolves under `svelte-package` (dist file count is
   expected to grow to ~1,600 modules — verify `package` + `publint` stay
   green).
4. **R4 — Core set, pinned.** The core icons are ordinary generated Lucide
   icons — same pipeline, same files, nothing hand-drawn. What is committed
   is only the **name list**: `CORE_ICONS` in `src/lib/icons/core.ts`, a
   contract declaring which generated icons every trimmed barrel must
   include (the gitignored manifest can't hold it — the contract must
   survive without generation having run). It is the load-bearing list: the four chevrons, `x`, `menu`, `check`, `minus`,
   `plus`, `search`, `loader`, `external-link`, `arrow-left`,
   `arrow-right` — i.e. every icon a `src/lib` component imports
   internally. A spec test enforces both directions: every icon imported by
   `src/lib/components/**` (and `src/lib/attachments/**`) is in
   `CORE_ICONS`, and every `CORE_ICONS` entry is a valid manifest name.
   Adding an internal icon use without adding it to the core list fails CI.
5. **R5 — Config schema.** `hyzer.config.ts` gains optional
   `icons?: string[]` — **kebab-case Lucide names** (the upstream canonical
   form; the report echoes the generated export name). Schema validation:
   unknown names are collected, not fatal at parse time. `defineConfig`
   types the field; docs augmentation is not needed (plain strings —
   validity is a runtime/manifest question, per R6).
6. **R6 — `hyzer generate` emits the trimmed barrel.** When the config has
   an `icons` key, generate emits an `icons.ts` module next to the tokens
   sheet output: named re-exports from `@hyzer-labs/ui/icons/<name>` deep
   paths for the union of `CORE_ICONS` and the configured names — core
   first, then configured extras, each group alphabetical, deduplicated;
   a generated-file header comment states the lucide version and that core
   icons are always included. The run report gains an icons section:
   included count, core-auto-included count, and one warning line per
   unknown name; `--strict` turns unknown names into a failing run. No
   `icons` key → no icons file, no report section (tokens behavior
   unchanged).
7. **R7 — Docs page scales to the full set.** `/foundation/icons` becomes a
   searchable catalog: a `TextInput` filter over all manifest names
   rendering a virtualized grid (dogfood `Virtualizer`) of icon + name +
   copyable import line. Core icons carry a visible "core" `Badge` with one
   line explaining the guarantee. The brand-icons section is removed,
   replaced by a short bring-your-own note (brand marks work through the
   same snippet props). The config tier gets documented here and in the
   theming/tokens page's config docs (the `icons` key, trimming semantics,
   `--strict`).
8. **R8 — Tests updated.** `icons.svelte.spec.ts` generalizes: the
   prop-contract assertions (decorative default, `ariaLabel` mode, size /
   strokeWidth / class merge, rest forwarding) run against a sampled set of
   generated icons + all brand icons rather than 21 hand-written files.
   e2e: the 21-name pin is replaced by — core names findable via the page
   search, total rendered count sanity (virtualized: assert the manifest
   count shown as text, not 1,600 DOM nodes), and the existing icon-usage
   assertions elsewhere stay green.
9. **R9 — Size and perf guardrails.** Docs site dev/build must not import
   the full barrel anywhere except the icons catalog page (which imports
   the manifest + lazy glyphs, not 1,600 eager components — implementation
   free to use `import.meta.glob` with lazy loading). A guard test greps
   app code for full-barrel imports outside the catalog. Published package
   size is reported in the PR description (informational, no gate).
10. **R10 — Spec bookkeeping.** `specs/09-icons.md` is reduced to a
    tombstone: a dated header stating it is superseded by this spec (icons
    v2 — generated full Lucide set, brand marks removed, config trimming),
    with the old body deleted. This document stands alone as the icons
    contract — the `IconProps` behavior it inherits from v1 is restated in
    R2, not referenced. `specs/38-docs-audit.md` is unaffected (its
    consumerSource `$lib/icons` rewrite target already matches the barrel
    this spec produces).

### Edge Cases & Error States

| Case | Expected |
| --- | --- |
| Config lists a core icon explicitly | Deduplicated — appears once, in the core group; no warning. |
| Config lists an unknown name (`serch`) | Report warning naming it; `--strict` fails the run; the name is omitted from the emitted barrel. |
| `icons: []` | Valid: emits the core-only barrel (the minimum vocabulary). |
| Duplicate entries in `icons` | Deduplicated silently. |
| Lucide name that pascalizes awkwardly (`axis-3d`, `a-arrow-down`) | Generator's pascalizer must produce valid identifiers (`IconAxis3d`, `IconAArrowDown`); a generator unit test pins these. |
| Name collision between generated set and a brand icon | Build-time error in the generator (fail loud; none exist today). |
| `lucide` version bump | `gen-icons.spec.ts` fails on the stale `LUCIDE_VERSION` stamp until `gen:icons` re-runs; the version pin change in `package.json` is the reviewed artifact. |
| Consumer never runs `hyzer generate` | Tier 1/2 unaffected — full barrel and deep imports work with zero config. |

### Existing Code to Reuse

- `scripts/gen-tokens.ts` — the generator-script shape, determinism rules,
  and drift-test pattern (specs/29) — mirror them, don't reinvent.
- `src/lib/icons/types.ts` (`IconProps`) and the current hand-written icon
  markup — the generated template is that markup with the path data
  interpolated.
- `src/lib/config/` schema/merge/report plumbing — `icons` is a new leaf on
  the existing resolved-config and report, not a parallel system.
- `Virtualizer`, `TextInput`, `Badge` for the catalog page (dogfood).

### Test Plan

**Unit:** generator pascalizer + template snapshots for known-awkward names;
`gen-icons.spec.ts` (generated output present, `LUCIDE_VERSION` stamp
matches the installed pin); core-set two-way pin (R4); config: icons merge/dedupe/unknown-name report entries, `--strict`
failure, emitted `icons.ts` snapshot for a fixture config; generalized
IconProps contract spec over sampled generated + all brand icons;
`exports.spec.ts` covers `./icons` and `./icons/*`.

**e2e:** catalog page — search narrows to a known icon, core badge visible,
manifest count rendered; sweep stays green (the page must not overflow or
tank with the virtualized grid).

**Build:** `pnpm run package` + `publint` green with the generated set;
docs `build` green; the R9 barrel-import guard green.

### Out of Scope

- Bundling additional brand icons or generating from `simple-icons` (the
  7 current marks stay as-is; revisit if the site refactors need more).
- Filled/duotone variants, custom icon registration, or an `<Icon name>`
  runtime-lookup component — per-icon components stay the API.
- Changing `IconProps` (any contract change belongs to the docs audit's
  breaking-change window, specs/37 R9, with its own finding).
- Trimming the *published package* per-consumer — npm ships the full set;
  trimming is an app-side concern (that's the point of the config tier).

### Amendments

- **2026-07-22 (audit R9, user request):** every generated icon gains an
  `intent?: 'neutral' | Intent` prop — stamps `data-intent` and prepends
  `color: var(--hz-intent-<intent>)` to the inline style (stroke is
  `currentColor`; consumer `style` still wins). No fallback hex is baked
  in, so config-registered custom intents work unchanged. Covered in
  `icons.svelte.spec.ts`; demoed on `/foundation/colors`' intent section.
