# Token Engine & `hyzer` CLI Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. Write scope for the Builder is
> `src/lib/tokens/**`, `src/lib/config/**`, `src/lib/cli/**`, `package.json`
> (`bin`, `engines`, `./config` export), `src/lib/exports.spec.ts`, and repo
> scripts. No component or theme changes.

### Goal

Make `src/lib/tokens/index.ts` the **single source of truth** for
`tokens.css`: a pure, dependency-free **engine** renders the stylesheet from
the token metadata, and a thin **`hyzer` CLI** exposes the same engine to
consumers — a Tailwind-style `hyzer.config.ts` merged over the base schema,
`hyzer generate` emitting a project-local tokens sheet, with a WCAG contrast
report on every run. Zero config produces our committed file byte-for-byte;
the committed file becomes generated output guarded by a drift test.

Decisions locked with the user (2026-07-15): bin name **`hyzer`** (this
library owns the command; hyzer.sh will be refactored onto this system);
contrast gate **warns by default, `--strict` fails**; **engines bumped to
`>=22.18`** so `hyzer.config.ts` loads via Node's native type stripping with
zero dependencies; merge semantics are **extend-only** (no group replacement
in v1).

### Context & Conventions

- **Three-tier consumer story** (documented in specs/30's quickstart):
  1. Import the committed `tokens.css` + theme — everything works, no build.
  2. Override `--hz-*` custom properties in plain CSS — still no build.
  3. `hyzer.config.ts` + `hyzer generate` — a generated sheet from their
     settings merged over the base schema, imported **instead of** ours
     (full mode) or **alongside** ours (overrides mode).
- The library stays **zero-dependency**. Config loading uses native
  `import()` with Node's default-on TypeScript type stripping (≥22.18 /
  ≥23.6); `.js`/`.mjs` configs are the fallback for anything older.
- The `--hz` prefix is **fixed** — components read `--hz-*`, so a custom
  prefix is out of contract. Consumers may add any keys *within* a group.
- Engine output is deterministic: fixed group order, base keys in schema
  order, config-added keys after them in config order. Same input → same
  bytes, always.

### Metadata schema evolution (`src/lib/tokens/index.ts`)

1. (Amended mid-build, user decision 2026-07-15.) The authored dark intent
   overrides move INSIDE the intent export, mirroring `color`:
   `intent.theme.dark = { neutral: '#9ca3af', primary: '#60a5fa', secondary:
   '#a78bfa' }` — only the intents whose targets cannot lighten at the
   palette layer (brand hues are constants; see specs/15 R5). The former
   `intentDark`/`intentDarkOverrides` exports are GONE — consumers derive a
   dark intent as `intent.theme.dark[k] ?? color.theme.dark[<target hue>]`.
   `Object.entries(intent)` iterators must filter to string values, exactly
   as they already do for `color`.
2. **Palette-override flow-through (engine merge rule).** When a config's
   `dark.color` overrides a palette hue that one of the authored
   `intent.theme.dark` entries targets (e.g. `dark: { color: { primary } }`),
   the authored intent override YIELDS — it is not emitted, so the intent
   chains through the consumer's dark palette value. An explicit
   `dark.intent` entry always wins over the yield.
3. No other shape changes. The group→CSS-prefix mapping (`space` →
   `--hz-space-*`, `zIndex` → `--hz-z-*`, `motion.duration` →
   `--hz-duration-*`, `typography.fontSize` → `--hz-font-size-*`,
   `border.width` → `--hz-border-width-*`, …) is an explicit table **in the
   engine**, not reflection over metadata.

### Requirements

1. **R1 — Engine module (`src/lib/config/`).** Exports (subpath `./config`):
   `defineConfig(config: HyzerConfig): HyzerConfig` (identity, for typing),
   the `HyzerConfig` type, `resolveConfig(config?)` (deep extend-only merge
   over the base schema), and `generateCss(resolved, options?)`. All pure —
   no `fs`, no `process`, SSR-safe. `HyzerConfig` shape mirrors the metadata
   1:1:

   ```ts
   defineConfig({
   	output: 'src/styles/tokens.css',        // relative to the config file
   	tokens: {
   		color: { primary: '#0f766e', fairway: '#3f6212' }, // override + add
   		intent: { … }, space: { … }, width: { … },
   		typography: { fontSize: { … }, fontFamily: { … }, … },
   		radius: { … }, border: { width: { … } }, shadow: { … },
   		zIndex: { … }, motion: { duration: { … }, ease: { … } },
   		density: { unit: '0.5rem' }
   	},
   	dark: { color: { … }, intent: { … } }   // merged over the base dark authoring
   })
   ```

2. **R2 — Extend-only merge.** Existing keys are overridden; new keys are
   appended to their group. Groups cannot be removed or replaced wholesale.
   Unknown group/section names are a hard error listing the valid names.
   A config key that kebab-cases to the same CSS name as an existing token
   (e.g. adding `textMuted` alongside `text-muted`) is a hard error.
   **Color ramps** (amended 2026-07-15): the base palette ships no ramps,
   but color groups (`tokens.color`, `dark.color`) accept one level of
   nesting — `{ red: { 50: '#fef2f2', 900: '#7f1d1d' } }` generates
   `--hz-color-red-50`/`--hz-color-red-900` (equivalent to flat `'red-50'`
   keys; the two spellings collide by design). The **intent layer is a
   consumer authoring surface in both modes**: remap an intent to any color
   or variable, or add new category intents, via `tokens.intent` (light) and
   `dark.intent` (dark) — the base simply authors nothing there in dark.

3. **R3 — Full-mode generation.** `generateCss(resolved)` emits a complete
   tokens sheet structurally equivalent to today's `tokens.css`: header
   banner (marked as generated — "do not edit by hand"), `:root` with all
   groups under section banners, the density block (`body` +
   three nested `data-density-shift` levels computed from `density`), and
   the `[data-theme='dark']` block (semantic roles from `color.theme.dark`,
   status palette hues, `intent.theme.dark` after the yield rule, plus any
   config `dark` additions). Values pass through verbatim — `var()` chains and
   `color-mix()` expressions are not resolved in output.

4. **R4 — Overrides-mode generation.** `generateCss(resolved, { mode:
   'overrides' })` emits **only** the keys the config touched (`:root` +
   dark block as needed) — a patch sheet importable *after* our
   `tokens.css`. `options.selector` (default `':root'`) swaps the root
   selector so a theme can be scoped to a subtree (e.g. `'.theme-ocean'`);
   in overrides mode the dark block selector composes as
   `[data-theme='dark']` descendant/compound of the custom selector.

5. **R5 — Validation & contrast report.** `resolveConfig` validates that
   every `var(--hz-color-*)`/`var(--hz-intent-*)` reference inside token
   values resolves to a defined token (error otherwise). A pure
   `contrastReport(resolved)` enumerates the same pairings as the
   compliance test suite — text roles and every intent as text on both
   surfaces per mode, surface-colored solid text on every intent, the Badge
   14%/65% and Alert 10%/70% soft mixes — returning `{ pairing, mode,
   ratio, level, pass }` rows computed with the public contrast utils.
   Consumer-added palette keys participate only where roles/intents
   reference them.

6. **R6 — Our `tokens.css` is generated.** `pnpm gen:tokens` (repo script
   invoking the engine with no config) rewrites
   `src/lib/tokens/tokens.css`; the file stays **committed**. A drift test
   asserts `generateCss(resolveConfig())` equals the committed file exactly
   — hand edits and forgotten regeneration fail CI. Zero-config output must
   be byte-identical to the current sheet's tokens (comment prose may be
   regenerated in this migration, but every custom property, selector, and
   value is preserved — the existing browser computed-value tests must pass
   unchanged).

7. **R7 — Fallback parity test.** A server test scans `src/lib/**/*.{css,svelte}`
   for `var(--hz-<name>, <fallback>)` and asserts each fallback matches the
   resolved base value after normalization (lowercase, `#rgb` expanded,
   whitespace collapsed). Documented abbreviations (short font stacks like
   `system-ui, sans-serif`, generic `monospace`, shortened shadow/color-mix
   forms) live in one explicit allowlist map in the test file — every
   allowlist entry is an intentional, reviewed deviation.

8. **R8 — Compliance suite reads metadata.** The token-compliance tests in
   `src/lib/utils/contrast.spec.ts` derive their palettes from the metadata
   (`color`, `intent.theme.dark`) instead of hardcoded hex arrays — thresholds
   (≥ 4.5:1) stay literal; values travel with the schema.

9. **R9 — `hyzer` CLI.** `package.json` gains `"bin": { "hyzer": … }`. The
   bin entry is a hand-authored plain-`.js` shebang wrapper (svelte-package
   copies `.js` verbatim — no transpile risk to the shebang) importing the
   compiled CLI main. Command: `hyzer generate [--config <path>] [--out
   <path>] [--mode full|overrides] [--check] [--strict]`.
   - Config discovery: `hyzer.config.ts` / `.js` / `.mjs` in cwd, or
     `--config`. No config → base schema with a one-line note.
   - `.ts` configs load via native `import()`; if type stripping is
     unavailable the error says so and suggests `.mjs` or Node ≥22.18.
   - Output: `--out` > `config.output` > `./hyzer-tokens.css`; parent
     directories are created.
   - The contrast report always prints (failures as warnings with ratios);
     `--strict` exits 1 on any AA failure; `--check` validates and reports
     without writing.
10. **R10 — Packaging.** `engines.node` becomes `>=22.18`. New `./config`
    subpath export ({types, default}). `pnpm package` + `publint` green;
    the packed tarball's `hyzer` bin resolves and runs (`--help` exits 0).

### Accessibility

The engine is build tooling — no DOM. Its accessibility surface is R5/R9:
the contrast gate makes palette-override regressions visible by default at
generation time, extending the library's AA-by-construction posture
(specs/15) to consumer palettes.

### Edge Cases & Error States

| Case | Expected behavior |
| --- | --- |
| No config file found | Generate from base schema; print a note naming the searched filenames. |
| Config default export is not an object / `tokens` has unknown group | Hard error naming the file and listing valid groups; exit 1; nothing written. |
| Added key kebab-collides with an existing token | Hard error naming both keys (R2). |
| Consumer overrides a role with a literal (e.g. `surface: '#f8fafc'`) | Allowed — emitted verbatim; reference validation only runs on values containing `var(`. |
| Consumer points an intent at an added palette key | Valid; contrast report covers it via the intent pairings. |
| Config sets `dark.color.primary` | Allowed — brand-constancy is our base theme's convention, not an engine constraint (ocean does exactly this). |
| `--strict` with a failing pairing | Report printed, exit 1, output file still written unless `--check`. |
| Output path's directory missing | Created recursively. |
| Node 22.0–22.17 with a `.ts` config | Clear error: bump Node or use `.mjs`; `.mjs` path works. |
| Windows paths in `--config`/`--out` | Resolved via `node:path`; no hardcoded separators. |

### Existing Code to Reuse

- `src/lib/utils/contrast.ts` — all ratio/level math for R5 (public API;
  do not duplicate).
- `src/lib/tokens/index.ts` — the base schema; extend per the schema
  evolution section, never fork values into the engine.
- `src/lib/tokens/tokens.svelte.spec.ts` — computed-value browser tests are
  the regression net for R6; they must pass unmodified.
- Test patterns: server specs follow `src/lib/exports.spec.ts`;
  `expect.requireAssertions` is on.

### Test Plan

**Engine (server, `src/lib/config/*.spec.ts`):** zero-config output equals
committed `tokens.css` (the drift test, R6); override + extend + ordering;
kebab-casing incl. multi-word keys; density block math; dark merge incl.
config `dark` additions; unknown-group and kebab-collision errors; overrides
mode emits only touched keys; custom `selector`; reference validation; a
deliberately bad palette yields failing `contrastReport` rows.

**Fallback parity (server):** R7 scan passes; temporarily breaking one
fallback in a fixture string demonstrates detection (test the normalizer
directly).

**CLI (server, tmp-dir fixtures):** discovery order; `.mjs` config
end-to-end (write file, verify content equals engine output); `--check`
writes nothing; `--strict` exit codes; missing-dir creation. A `.ts`-config
test runs when the executing Node supports type stripping, else skips with
a note.

**Packaging:** exports-map assertions for `./config` and `bin`;
`pnpm package` + `publint`; packed-tarball bin smoke test.

### Out of Scope

- Vite plugin / watch mode (future wrapper over the same engine).
- Emitting a TS metadata mirror of the consumer's tokens.
- Group replacement / token deletion modes; custom property prefixes.
- Migrating ocean/sunset to engine configs and the theme folder
  restructure — specs/30.
- hyzer.sh's adoption (separate repo).
