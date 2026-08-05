# 68 — The default theme gets its name from the config

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. **Builds on
> `specs/29-token-engine.md` (the config engine, the CLI and its report
> shapes), `specs/30-theming.md` / `specs/42-palette-split.md` (the palette →
> role → intent layering and the two-tier dark rule),
> `specs/52-theme-attachment.md` (`theme()` / `themeVars`),
> `specs/65-themes-all-token-groups.md` (a theme is a token override;
> `tokens.components` and its root-only rule),
> `specs/66-check-detects-stale-output.md` (`--check` compares the artifacts on
> disk) and `specs/67-scope-selector-and-theming-ia.md` (`selector` as a config
> key, and the doctrine that anything describing the design system lives in the
> config) and does not restate them.** Every design choice below is settled;
> the `Decided:` tails record the option that was rejected, so nobody
> relitigates it mid-build.

**65, 66 and 67 are already implemented and committed** on
`feat/config-token-coverage` (`f9659694`, `ab949c15`, `16b061cc`, `697e7ffb`).
Every anchor here points at that landed code, not at planned behavior —
`generate.ts` already owns `withScope()` and `componentHookSection()`,
`schema.ts` already carries `assertSelector` and `THEME_NAME`, and `report.ts`
already grades against `resolved.contrast.level`. Read the current files, not
the earlier specs' descriptions of them. 68 lands on the same branch as its own
commit.

### Goal

One theme name is hardcoded in the generator and should not be: `light`, the
name of the block that restores the default. It was never true — the default is
whatever `tokens` says, and light is only what the shipped default happens to
look like. Terminal is the counter-example the library already ships: its
default is a dark tube at rest, and the generator calls that block `light`
anyway.

Make it a config key, and rename the library's own default to `default` while
doing it, because 0.x is where that gets fixed.

```ts
export default defineConfig({
	defaultThemeName: 'brand' // what the tokens block is named
});
```

**This is a breaking change.** `data-theme="light"` stops re-asserting the
default for every consumer on 0.6.0. The migration is one line —
`defaultThemeName: 'light'` — and R8 puts it where a migrating reader will hit
it.

**`dark` does not become configurable, and R7 is the requirement that explains
why.** That asymmetry is the single thing most likely to be read as an
oversight, so it ships as documentation rather than as a silence.

---

### Context & conventions

- **The default block's name is a contract between two sheets.** An
  overrides-mode sheet's restore block exists to counter the *base* sheet's
  restore block (`generate.ts:830-838`). The two must name the same theme, or
  the base sheet's block wins inside the scope and the overrides sheet stops
  working under that attribute. Nothing can detect this, which is why R5
  changes the schema **default** rather than passing a value from
  `scripts/gen-tokens.ts`: one default, one name, in the base sheet and in
  every patch sheet layered on it.
- **Byte-drift, this time, is a permitted and bounded diff.** `tokens.css`,
  `ocean.css` and `terminal.tokens.css` each carry a default-restore block and
  each legitimately regenerates (R5). `utilities.css` has no theme blocks and
  must come back byte-identical. Every sheet is regenerated with
  `corepack pnpm gen:tokens`; a hand edit is a defect. The diff in each sheet
  must be confined to the renamed selector and the comment lines that name it,
  and R5 requires the builder to show that.
- **The key gets no CLI flag.** 67 R10's restated doctrine: a flag describes a
  single run, the config describes the design system. A theme's name is as much
  a design-system fact as `selector` or `contrast.level`, and unlike `selector`
  there is no per-run reason to override it. This also means `--check` needs
  nothing: a check run reads the same config the write run did, so a name
  mismatch is unreachable (67 R5 already reasoned this for a config-supplied
  `selector`).
- **Docs are consumer-facing.** No spec numbers, no `Rn`, no test-gate or
  process language in anything a reader sees. Every copy change gets an
  editor-agent pass before commit (R7, R8).

---

## Requirements

**R1 — One config key, one resolved field.** `HyzerConfig` gains one top-level
key beside `selector` (`schema.ts:101-111`):

```ts
defaultThemeName?: string;  // default 'default'
```

It joins the top-level `assertKnownKeys` list (`schema.ts:706`).
`ResolvedConfig` gains:

```ts
/** The name of the default theme — the `tokens` block, and the
 *  `[data-theme='<name>']` rule that restores it. Defaults to 'default'. */
defaultThemeName: string;
```

It resolves eagerly to its default, unlike `selector` — nothing downstream
needs to distinguish "unset" from "explicitly the default", and a
`string | undefined` would push the same `?? 'default'` into four call sites.

JSDoc on the key says what it names in one sentence, states that it is not
"the light theme" (it is the name of the default, and light is only what the
shipped default looks like), and carries R7's clarification about `dark`.

*Decided:* a top-level key, not `themes.$default` metadata. `themes` is a map
of theme names to token overrides and every key in it is an attribute value; a
key that is not one would need escaping from every consumer of that map. The
default theme is not in `themes` at all — it is the `tokens` block.

*Decided:* `defaultThemeName`, not `defaultTheme`. `defaultTheme` reads as "an
override object" beside `tokens` and `themes`, which is exactly what it is not.

**R2 — The shape, and two names the key cannot take.** Extract the theme-name
check that `validateThemes` runs inline (`schema.ts:587-591`):

```ts
function assertThemeName(name: unknown, where: string): void;
```

`THEME_NAME` (`schema.ts:546`) is the shape, unchanged, and the message is the
one already there, parameterized on `where`:

```
<where> is not a valid theme name: use lower-case letters, digits and hyphens,
starting with a letter (the name becomes a data-theme attribute value).
```

Called with `where = 'config.themes["<name>"]'` from `validateThemes` — which
reproduces today's message byte for byte — and with `'config.defaultThemeName'`
from `resolveConfig`. `assertSelector` (`schema.ts:559`) is the shape to copy
for the extraction: one exported assert, one `where`, called from every site.

Then two collisions, both checked in `resolveConfig` before any token group
resolves. They are one rule seen from two sides — **the default block cannot
share a selector with a theme block** — and they need two messages because the
fix differs.

1. **`defaultThemeName` cannot be `'dark'`.** Every sheet emits a dark theme,
   whether or not the config declares one, so the default block would collide
   with a block that always exists.

   ```
   config.defaultThemeName cannot be "dark". Every generated sheet emits a dark
   theme at [data-theme='dark'], so the default block would collide with it.
   Dark is the one theme name the library keeps — see /docs/theming/sections.
   ```

2. **The default theme's name is reserved in `themes`.** This generalizes
   today's "`light` is reserved" (`schema.ts:582-586`): the reason was never
   that the word `light` is special, it was that a `themes` entry naming the
   default block would silently do nothing to it. `validateThemes` takes the
   resolved `defaultThemeName` as a second argument and rejects that key:

   ```
   config.themes.brand is reserved — "brand" is config.defaultThemeName, and
   the default theme is the :root block authored via config.tokens, not a
   themes entry. Rename one of the two.
   ```

   `light` is no longer reserved. With the shipped default at `default`, a
   consumer may define `themes.light` and get an ordinary named theme.

**R3 — The default block's name, everywhere it is emitted.** Three selector
sites, one rename, two comment functions.

Selectors — all three take `resolved.defaultThemeName`:

| Site | What it emits |
| --- | --- |
| `generate.ts:662` | full mode's restore block |
| `generate.ts:798` | the `mergeLight` combined `:root, [data-theme='…']` selector |
| `generate.ts:852` | overrides mode's restore block |

`generate.ts:806`'s `themeSelector(selector, 'dark')` stays a literal. It is
the dark block, and dark keeps its name (R7).

`lightRestore()` (`generate.ts:689`) is renamed `defaultRestore()` — four
references, all local — and its doc comment (`:673-688`) stops calling the
block `[data-theme="light"]`. The function is private; the rename is the point,
because a function called `lightRestore` that emits `[data-theme='brand']` is a
comprehension bug waiting for 3am.

Comments — two module constants become functions of the name, straight
interpolation, no branching:

- **`SYSTEM_COMMENT` (`generate.ts:149-157`)** → `systemComment(name)`. Only
  `data-theme="light"` at `:152` interpolates; the `(or "dark")` beside it
  stays literal, because that name is fixed.
- **`LIGHT_COMMENT` (`generate.ts:159-167`)** → `defaultComment(name)`. The body
  is rewritten so the block describes itself. The old text said "a light section
  inside a dark page", and the sentence has to be reflowed rather than patched
  in place — replacing only the first clause leaves "dark page" orphaned on the
  next line, which then ships inside every consumer's sheet:

  ```
   * Default theme "default" — the :root block, re-declared so it can be RESTORED.
   * :root defaults inherit as computed values, so a section switched back to
   * the default inside a dark page would otherwise keep the dark values it
   * inherited: there has to be something to switch back TO. Only tokens some
   * theme actually changes are listed — the rest were never at risk.
  ```

  Only the opening and closing banner rules are unchanged.

`DARK_COMMENT` (`generate.ts:128-137`) is untouched.

A name longer than the one it replaces can push a comment line past the width
the surrounding prose was wrapped to. Accept it: reflowing wrapped prose around
an interpolated value is real work, Prettier does not reformat CSS comment
bodies, and the only sheets the repo's own `prettier --check` sees are the ones
in R5.

*Decided:* no `Default:` header line, and no `--check` detection to go with
one. 67 R4 added `Scope:` because `--selector` is a flag, so a check run could
legitimately disagree with the sheet on disk. This key has no flag, so a
mismatch is unreachable. Zero bytes, zero new detection code.

*Decided:* the three `theme.name === 'dark'` comparisons (`generate.ts:631`,
`:651`, `report.ts:91`) stay as they are. An earlier draft replaced them with
identity checks against `resolved.dark`; with `dark` fixed, `resolved.themes`
can never contain a theme named `dark` (`schema.ts:876` filters it out), so the
two forms are exactly equivalent and the change is churn in three files for no
behavior. Minimal diff wins.

**R4 — The contrast report labels a map with the attribute value that selects
it.** One line changes; the invariant is what matters.

`declarationMaps` (`report.ts:83-84`) labels the `:root` map `'light'` today.
It becomes `resolved.defaultThemeName`, and `ContrastReportRow.mode`'s JSDoc
(`report.ts:38-39`) becomes: *the `data-theme` attribute value that selects this
map — `resolved.defaultThemeName` for the `:root` defaults, which is also what
the restore block re-asserts, then one per theme.*

**`report.ts:276` — `mode === 'dark' ? softTints.dark : softTints.light` — does
not change, and must never learn to follow a configured name.** The recipe it
selects models `[data-theme='dark'] .hz-badge` in a hand-written, shipped
stylesheet (`theme/components/badge.css:68`, `alert.css:31`), so it has to key
on the literal attribute value. Once `mode` is the attribute value in every
case, that expression is already exactly right: the root map is labelled
`defaultThemeName`, which R2 guarantees is never `dark`, so the default block
can never accidentally pick up the dark recipe. The comment above it
(`report.ts:271-275`) already says "keyed to the theme NAME, because that is
what the theme CSS keys them to"; it gains one clause — that CSS is
hand-written and ships as it is, so this stays the literal `dark` no matter
what the default block is called.

The `softTints` object's own `light` / `dark` keys (`report.ts:33-34`) are
internal names for two recipes and stay as they are. The comment block above
them (`:16-28`) gains one sentence saying the same thing.

*Decided:* no `darkTuned` flag threaded through `declarationMaps`. It would
compute to exactly `mode === 'dark'` in every case, which is the expression
already in the file.

**R5 — The shipped default is renamed to `default`; three sheets regenerate.**
The schema **default** for `defaultThemeName` becomes `'default'` — not a value
passed by `scripts/gen-tokens.ts`. `tokens.css` is generated from
`generateCss(resolveConfig())` with no config (`gen-tokens.ts:28`), so the
schema default is the only place the shipped name can come from; and if the
base sheet renamed while the schema default stayed `light`, every consumer
overrides sheet layered on the published `tokens.css` would restore under a
name the base sheet does not use.

Regenerate with `corepack pnpm gen:tokens`. Never hand-edit a sheet. The
permitted diff, which the builder must show is the whole diff:

| Sheet | Permitted change |
| --- | --- |
| `src/lib/tokens/tokens.css` | `[data-theme='light'] {` → `[data-theme='default'] {` (`:260`); the system-preference banner's `data-theme="light"` (`:233`); the default-theme banner's first two lines. Nothing else. |
| `src/lib/theme/examples/ocean.css` | every `[data-theme='light']` selector → `[data-theme='default']` (`:18`). Nothing else. |
| `src/lib/theme/examples/terminal/terminal.tokens.css` | the two `[data-theme='light']` selectors in the merged root rule (`:41-42`). Nothing else. |
| `src/lib/theme/utilities.css` | **byte-identical.** It has no theme blocks. |

Neither example config sets the key, so both examples ride the new default and
their own configs are untouched.

*Decided:* `'default'`, not `'hyzer'` or `'base'`. It is descriptive rather
than branded, and it pairs with `dark` without reading lopsided:
`data-theme="default"` and `data-theme="dark"` are both plain statements of
what the block is.

*Decided:* **Terminal does not set the key**, even though it is the theme that
motivated the feature — its own header says "Terminal declines to be a light
theme. Both modes are dark: light is the tube at rest". It still must not
rename, for a hard reason rather than a taste one. Its sheet is overrides mode
layered on the published `tokens.css` (`terminal.config.ts:43`,
`gen-tokens.ts:36-39`), and its merged root rule (`terminal.tokens.css:40-42`)
exists to re-restore Terminal's own tokens when an ancestor carries the base
sheet's default attribute. Rename it and that selector stops matching, so the
base sheet's restore block wins inside the Terminal region and Terminal breaks
on any page that sets the attribute explicitly. `default` is also already an
honest name for the tube at rest, which is what the rename bought. Terminal's
sheet changes only by this requirement's two-line rename, inherited from the
new schema default.

**R6 — The docs site's toggle follows the shipped default, and one test pins
it.** This is the highest-risk item in the spec: the site keeps rendering
either way, so a miss looks like nothing.

`src/docs/theme.svelte.ts` types its state as `'light' | 'dark' | null`
(`:20`), validates stored values against those literals (`:35`), and toggles
with `themeState.choice = isDark() ? 'light' : 'dark'` (`:64`). After R5 the
sheet has no `[data-theme='light']` block, so the light half of the toggle
would write a dead attribute value and the site would silently lose light mode
for anyone whose system prefers dark.

Required:

- **One exported constant**, `export const DEFAULT_THEME = 'default';`, and
  every one of the three literals reads from it (`:20`'s type, `:35`'s
  validation, `:64`'s flip). One place to change, and one thing for a test to
  pin.
- **A stored value from before the rename falls through**, because `'light'` no
  longer validates. The reader follows their system preference until they press
  the button again. That is the right failure and it needs one clause in the
  comment at `:33-35`, not code.
- The module doc (`:7-13`) and `src/routes/+layout.svelte:43-44`'s comment both
  explain the `:root:not([data-theme])` interaction in terms of "light". Both
  say "the default theme" instead. `+layout.svelte:47-50` needs no code change
  — it writes `themeState.choice` verbatim.
- **A client test, `src/docs/theme.svelte.spec.ts`** (new file, three cases):
  `DEFAULT_THEME` equals `resolveConfig().defaultThemeName`; `toggleTheme()`
  from the default lands on `'dark'`; toggling twice returns to
  `DEFAULT_THEME`. The first case is the gate — it fails the moment the schema
  default and the docs literal drift apart, which is the regression this
  requirement exists to prevent.
- **One assertion added to the existing e2e** (`src/routes/docs.e2e.ts:295`,
  the `--hz-color-surface changes to dark value after toggle` test): click a
  second time, and assert `<html>` carries `data-theme="default"` **and**
  `--hz-color-surface` is back to its first-read value. The unit test proves the
  literals agree; this proves the sheet actually has a block for it.

**R7 — Why `dark` is fixed and the default is not.** A reader who meets
`defaultThemeName` asks "so where is `darkThemeName`?" within about four
seconds. The answer is a real design principle and it must ship as prose, not
as a missing key.

The principle, stated once here and paraphrased in consumer language on each
surface below:

> **`dark` is not our name, it is the platform's.** It is the value in
> `prefers-color-scheme: dark` and in `color-scheme: dark`, and the reference
> theme's own dark-mode rules are keyed to the same vocabulary. Renaming it
> would put the sheet out of step with the platform it is answering.
>
> The default block has no platform name. "Light" was our invention, and a
> wrong one for a theme whose default is dark. That is exactly why it is the
> one that becomes configurable: one name is borrowed, one is ours.

Two facts must travel with it, because they are the next two questions:

- **A consumer needs no `themes.dark` entry to have dark mode.** With no config
  at all they get a complete dark theme plus the `prefers-color-scheme` block,
  seeded from the library's AA-tuned dark companions
  (`schema.ts:871-874`, `generate.ts:651-657`). `themes.dark` is only for
  *changing* dark, and it merges over that seed rather than replacing it.
- **`themes.dark` is the only door for system-dark customization**, and it is
  the door for per-mode component hooks too. `tokens.components` is root-only
  (65 R1), so varying a hook by mode means pointing the hook at a token and
  overriding that token under `dark`:

  ```ts
  tokens: { components: { buttonAccent: 'var(--hz-intent-secondary)' } },
  themes: { dark: { intent: { secondary: '#a78bfa' } } }
  ```

  *Verified against the landed implementation:* the emitted hook rule is
  `:where(.hz-button) { --hz-button-accent: var(--hz-intent-secondary) }`
  (65 R14), declared on the button itself, and a `var()` in a custom property
  resolves on the element the declaration applies to — so the button reads the
  `--hz-intent-secondary` it inherits from whichever ancestor carries
  `data-theme="dark"`. The reference theme's own
  `--hz-button-accent: var(--_c)` (`theme/components/button.css:20`) sits in
  `@layer hz-theme` and loses to the unlayered emitted rule, as 65 R14
  intends.

  **Do not write a third explanation of the hook-to-token pattern.** It is
  already on the Component hooks page (`theming/components/+page.svelte:295`)
  and the Config page (`foundation/config/+page.svelte:243-244`). The surfaces
  below link to one of those; only the "and this is how you customize system
  dark" framing is new.

Three surfaces carry R7, and R8 defers to this requirement for their bodies:

1. **`src/lib/config/schema.ts` JSDoc.** The new `defaultThemeName` key
   (R1) carries the principle in two sentences. The `themes` key
   (`:119-136`) currently hardcodes both names in prose — "`dark` is a theme
   like any other, except that it merges over the base dark authoring" and
   "`light` is reserved". `light` becomes the `defaultThemeName` rule; the
   `dark` sentence gains that it is the one name the library keeps, and that an
   absent entry still yields a full dark theme.
2. **`src/lib/cli/config-template.js`.** One commented `defaultThemeName` line
   under `selector` (`:21`) naming what it does and its default, and one clause
   on the `themes` block comment (`:56-59`): `dark` is seeded and always
   emitted, so an entry there changes dark rather than creating it, and it is
   the one name this map keeps. The template's clipped style throughout.
   `main.spec.ts`'s uncomment-and-resolve case (65 R22) is the gate that the
   new line is valid as written. One edit, three surfaces (`hyzer init`, the
   Config page's full reference, and `@hyzer-labs/sv`); no change under
   `sv-addon/`, which consumes the template by import.
3. **`src/routes/docs/theming/sections/+page.svelte`**, in the "Define your
   themes" section, replacing the reserved-name paragraph at `:165-170`. This
   page is the right home and not Theming Overview or Tokens & Overrides: it is
   the only page that already teaches both `light` as a reserved name and
   `[data-theme='light']` re-asserting the default, so the clarification lands
   as a correction to something the reader is already looking at rather than as
   a fifth explanation somewhere else. Overview is a decision aid (67 R8) and
   would have to grow a fifth row about naming, which is not a decision anyone
   makes at that point. One short paragraph for the principle, one sentence
   that dark comes for free and `themes.dark` changes it, and a link to the
   Component hooks page for the per-mode hook pattern.

**R8 — Docs, template and changelog: one coherent pass per file.** Consumer
framing throughout, then an editor-agent pass on every copy change before
commit. All in the same commit as the code. R7 owns the bodies for
`schema.ts`, `config-template.js` and the Section themes paragraph; everything
below is the rest.

**`CHANGELOG.md`.** The file declares Keep a Changelog and there is no
`[Unreleased]` section today, because entries have been written at release
(`812b271b` builds the GitHub Release from this file). Add one, above
`[0.6.0]`, and leave the heading for whoever cuts the release to rename:

- `### Changed`, marked **Breaking**: the default theme is now named `default`,
  so `[data-theme='default']` is the block that re-asserts your default and
  `data-theme="light"` no longer selects anything;
- the one-line migration in the same entry: `defaultThemeName: 'light'` in
  `hyzer.config.ts` restores the previous name exactly, then regenerate;
- `### Added`: name the default theme whatever suits your system.

*Note for whoever cuts the release:* confirm the publish workflow tolerates an
`[Unreleased]` heading before tagging, since it parses this file.

**`src/routes/docs/theming/sections/+page.svelte`** — beyond R7's paragraph:

- **`{@attach theme('light')}` on the demo band (`:108`) is now broken** and
  must become `theme('default')`. This is a live demo; a reviewer should be
  able to see the band render as the default look.
- The `theme('dark')` prose at `:102` is still correct; check it reads right
  beside the renamed band.

**`src/routes/docs/foundation/config/+page.svelte`.**

- `configCode` (`:70-106`) gains `defaultThemeName` near `output`, with a
  trailing comment naming what it does. Show it set to something other than the
  default — this is the file's showcase config.
- **One short paragraph** after the sample: the key names a theme rather than
  overriding tokens, it has no flag because a theme's name describes your
  system and not one run, and it is the migration line for anyone who wants
  `light` back. One clause on why there is no companion key for dark, with a
  link to Section themes rather than a second copy of R7.
- The flags doctrine paragraph (`:292-296`) needs no arithmetic change — 67 R10
  already removed the counts — but confirm its "everything that describes your
  design system" sentence still reads as covering config-only keys, and add the
  key to whatever lists them if such a list exists.

**`src/routes/docs/theming/tokens/+page.svelte`.** The `darkCode` sample's
closing comment (`:45-50`) says `data-theme="light"` puts a section back to the
default — it must name the new default, or be reworded to say "the default
theme's name" with a link to Section themes. The doctrine blockquote at `:102`
gains one clause: the default block's name is a config key, and dark's is not.

**`src/routes/docs/foundation/colors/+page.svelte`.** The toggle sample at
`:19-45` teaches consumers the exact pattern the docs site uses, with `'light'`
in three places; it follows R6's shape. The prose at `:361`
(`data-theme="light"` to hold the default look) names the new default.

**`src/docs/agentRules.ts`**, "Apply named themes with data-theme"
(`:52-67`). One clause, not a new rule: the default theme is named `default`
and renameable with `defaultThemeName`; `dark` is fixed and needs no entry to
exist. The sample stays as it is. One edit, two surfaces (`/docs/agents` and
the served `agents.md`).

**`src/routes/docs/foundation/contrast/+page.svelte`** — **check, expect no
change.** Its `mode: 'light' | 'dark'` is a local surface-pair type over
hand-rolled data, not `ContrastReportRow.mode`, and its `[data-theme="dark"]`
prose at `:425` is still accurate. Confirm and move on; this row exists so a
reviewer does not flag the file as missed.

**`src/routes/docs/theming/overview/+page.svelte`** — same: the decision-aid
rows (`:196-222`) talk about light and dark as concepts, not attribute values.
Confirm and leave.

---

**R9 — `color-scheme` follows the system preference.** A bug found while
specifying this, not part of the rename, but in the same rules and worth one
review rather than two.

`src/lib/theme/base.css:10-16` declares `color-scheme: light` on `:root` and
`color-scheme: dark` only under `:root[data-theme='dark']`. No
`prefers-color-scheme` block exists anywhere in `src/lib/theme` — verify that
before changing it. The generated sheet, meanwhile, flips its tokens for a
system-dark visitor through `@media (prefers-color-scheme: dark) { :root:not([data-theme]) … }`.

So a visitor whose OS prefers dark, on a site that sets no `data-theme` — the
documented "no script needed to FOLLOW the system" path, and the most common
setup — gets dark tokens and `color-scheme: light`. Native scrollbars, form
control internals, autofill backgrounds and date pickers render light against a
dark page. That is precisely the "white gutter" effect `base.css:9`'s own
comment says these rules exist to prevent, in the one configuration nobody
explicitly chose.

Required: one rule in `base.css`, beside the existing pair, mirroring the
generated sheet's guard so an explicit choice still wins:

```css
@media (prefers-color-scheme: dark) {
	:root:not([data-theme]) {
		color-scheme: dark;
	}
}
```

- The `:not([data-theme])` guard is what keeps R10's opt-out working: a root
  that names a theme stops matching, so a one-theme site never gets a
  `color-scheme` it did not ask for.
- Unaffected by the rename: `data-theme="default"` matches neither the dark
  attribute rule nor this block, so it falls through to `:root`'s
  `color-scheme: light`, which is correct.
- `base.css` is layered; keep the new rule inside the same layer as its
  neighbours, and confirm which one rather than assuming.
- Test: assert the block exists and carries the `:not([data-theme])` guard.
  A rule without the guard would override an explicit `data-theme="default"`
  on a system-dark machine, which is the regression worth pinning.

**R10 — Document the root opt-out.** A site that supports exactly one theme
opts out by naming it on `<html>` and forgetting about it: `data-theme="default"`
to stay light-only, `data-theme="dark"` to stay dark-only. The generated
system block is guarded by `:root:not([data-theme])`, so an attribute at the
root permanently stops it matching — no script, no flash, no flag.

This mechanism already exists and is already correct; it is simply never stated
as the answer to "how do I turn dark mode off". Say it plainly, in consumer
language, on the page R7 lands on, as a short paragraph near the
`prefers-color-scheme` explanation. Two sentences is enough: name both values,
say the attribute at the root wins over the system preference permanently.

Explicit non-goal, and say so where a reader might ask: this suppresses dark at
runtime, it does not stop the dark CSS being generated. There is no config key
for "ship no dark theme" and this spec does not add one.

---

### Edge cases

| Case | Expected |
| --- | --- |
| Key not set | `resolveConfig().defaultThemeName === 'default'`; the sheet's restore block is `[data-theme='default']`. |
| `defaultThemeName: 'default'` set explicitly | Bytes identical to omitting it. |
| `defaultThemeName: 'light'` | The pre-rename output exactly: `[data-theme='light']` restore block, and the banners name it. This is the documented migration. |
| `defaultThemeName: 'brand'`, full mode | Restore block `[data-theme='brand']`; the system-preference banner and the default-theme banner both name `brand`. `data-theme="default"` selects nothing — correct, and the reason the change is labelled breaking. |
| `defaultThemeName: 'brand'`, overrides mode, layered on the published `tokens.css` | Restores under `[data-theme='brand']` while the base sheet restores under `[data-theme='default']`, so the base block wins inside the scope. Undetectable by the engine; the key belongs to the sheet that owns the page. |
| `defaultThemeName: 'brand'`, scoped sheet | The compound + descendant pair uses `brand`, in both the merged root rule and the restore block. |
| `defaultThemeName: 'dark'` | `HyzerConfigError` naming the key and saying dark is always emitted. |
| `themes.brand` with `defaultThemeName: 'brand'` | `HyzerConfigError` naming the key and both config paths. |
| `themes.light` with the default `defaultThemeName` | Accepted. An ordinary named theme, emitted as `[data-theme='light']`, unseeded, graded like any other. |
| `defaultThemeName: 'Brand'` / `'1x'` / `''` / `5` | `HyzerConfigError` with the theme-name shape message, naming `config.defaultThemeName`. |
| No `themes` key at all | Unchanged: a full dark theme plus the `prefers-color-scheme` block, seeded from the base authoring. This is the fact R7 has to state, and the test that pins it is the existing default-config drift test. |
| `themes.dark` set | Unchanged: merges over the seed. |
| `--check` with the key set | Never a name mismatch. No flag, so the check run reads the same config the write run did. No new header line, nothing new in the check. |
| `theme('brand')` / `themeVars(…)` | Unchanged. The attachment writes whatever string it is given; nothing in it knows a theme name. |
| Reader with `hz-theme=light` in localStorage, after R5 | The stored value no longer validates, so they follow their system preference until they press the toggle again. |
| `utilities.css` after R5 | Byte-identical. It has no theme blocks. |
| Contrast report, default config | Row modes are `default` and `dark`. Every existing `r.mode === 'dark'` assertion holds; the `'light'` ones move to `'default'`. |
| Contrast report, `defaultThemeName: 'brand'` | Root rows are labelled `brand` and keep the light soft-tint recipe. The dark rows are untouched. |

### Existing code to reuse

- **`THEME_NAME` (`schema.ts:546`) and the message at `:587-591`** — R2's
  validator is that check, extracted, not a new rule. `assertSelector`
  (`:559`) is the shape to copy for the extraction.
- **`assertKnownKeys()` (`schema.ts:309`) and the `config.selector` check
  (`:715`)** — where R1's key is validated and how.
- **`themeSelector()` (`generate.ts:303`)** — already takes the name. Every
  selector site in R3 is a change of argument, not of emission.
- **`themeComment()` (`generate.ts:170`)** — the shape R3's two comment
  functions follow: a template over the name, no branching.
- **`withScope()` (`generate.ts:600`)** — the precedent for *not* adding a
  header line here, and the reason `--check` needs nothing (67 R4/R5).
- **`declarationMaps()` (`report.ts:78`) and the `softTints` comment
  (`report.ts:16-28`, `:271-275`)** — R4 changes one line and two comments; the
  reasoning it needs is already written down in the second comment.
- **`scripts/gen-tokens.ts` / `corepack pnpm gen:tokens`** — the only way any
  committed sheet changes (R5).
- **`sandbox()` (`main.spec.ts:11`)** — every CLI test below drives `run()`
  through it.
- **`examples.spec.ts:28-56`** — the drift, AA and root-selector tests are R5's
  gate for the two example sheets; no new test there.
- **`theming/components/+page.svelte:295` and
  `foundation/config/+page.svelte:243-244`** — the hook-to-token pattern is
  already written twice. R7 links; it does not write it a third time.

### Test plan

Runner: **Vitest**, existing projects — `server` (node) for the engine and the
CLI, `client` (chromium, Playwright provider) for R6's docs-state test.
Playwright for the one added e2e assertion.

**Server — `src/lib/config/config.spec.ts`:**

- Default: `defaultThemeName === 'default'`; the generated sheet contains
  `[data-theme='default']` and no `[data-theme='light']`.
- `defaultThemeName: 'brand'`: full mode's restore block, overrides mode's
  restore block, and the merged `:root, [data-theme='brand']` rule each use the
  name; the system-preference banner and the default-theme banner name it; no
  `default` as an attribute value anywhere in the output.
- Scoped (`selector: '.theme-x'`) with the key set: the compound + descendant
  pair uses the name.
- `defaultThemeName: 'light'` reproduces the pre-rename selectors exactly —
  the migration case, asserted rather than assumed.
- Validation, one case each: bad shape, non-string, empty string,
  `defaultThemeName: 'dark'`, and `themes[defaultThemeName]` reserved.
  `themes.light` resolves cleanly under the new default. Update the existing
  reserved-name test (`config.spec.ts:1137-1141`) rather than deleting it.
- The dark block and its `@media (prefers-color-scheme: dark)` block are
  present for a config with no `themes` key at all, carrying the base dark
  companions — R7's first fact, pinned.
- Report: default config row modes are `default` and `dark`; with
  `defaultThemeName: 'brand'` the root rows are labelled `brand` **and their
  `soft-badge:` background hex equals the 14% mix, not the 28% one**. That last
  assertion is the R4 invariant and the reason the requirement exists.
- The existing `[data-theme='light']` index lookups (`:1046`, `:1053`, `:1068`,
  `:1078`, `:1091`, `:1106`), the report mode literals (`:934`, `:1329-1368`)
  and the drift fixtures (`:24`, `:832`) are updated by hand, file by file.
  **No regex sweep** — a broad find-and-replace over `'light'` in this repo has
  already broken more than it fixed.

**Server — `src/lib/theme/examples/examples.spec.ts`:** no new test. The drift,
AA and root-selector cases must pass against the regenerated `ocean.css` and
`terminal.tokens.css`; the fallback-parity test is unaffected.

**Server — `src/lib/cli/main.spec.ts`,** each case through `sandbox()`:

- A config setting the key writes a sheet carrying that name.
- An invalid value → exit 1 with `Invalid config: …`.
- `--check` immediately after a write with the key set → `all up to date`,
  exit 0, and no name-related finding of any kind.
- The `CONFIG_TEMPLATE` uncomment-and-resolve case still passes with the new
  template line.

**Client — `src/docs/theme.svelte.spec.ts` (new):** R6's three cases. The
first — `DEFAULT_THEME === resolveConfig().defaultThemeName` — is the gate.

**E2e — `src/routes/docs.e2e.ts`:** one assertion added to the existing toggle
test (`:295`): a second click puts `data-theme="default"` on `<html>` and
returns `--hz-color-surface` to its first-read value.

### Gate

The full gate from `AGENTS.md` at the commit boundary — a token change here
routinely breaks something that looks unrelated, and a change that has not
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

`pnpm` is not on `PATH`; `corepack pnpm …` throughout. Regenerate with
`corepack pnpm gen:tokens` and never hand-edit a sheet. Before committing, run
`git diff --stat` over `src/lib/tokens/tokens.css`,
`src/lib/theme/examples/ocean.css`,
`src/lib/theme/examples/terminal/terminal.tokens.css` and
`src/lib/theme/utilities.css` and confirm the change is confined to R5's table:
selectors and the comment lines that name them, and nothing at all in the
utilities sheet. Commit on `feat/config-token-coverage`, never to `main`, and
do not push unless told.

### Non-goals

- **A `systemDark` key, or any way to rename the dark theme.** Considered and
  rejected: `dark` is the platform's name, and the reference theme selects on
  the literal `[data-theme='dark']` in six hand-written files —
  `theme/base.css:14` (`color-scheme: dark`), `badge.css:68`, `alert.css:31`,
  `skeleton.css:31`, `field.css:84`, `button.css:191`. None of them can follow
  a configured name, so a rename would ship tokens that flip and chrome that
  does not, with the white scrollbar gutter as the first symptom. A key whose
  correctness depends on the consumer not using the library's own theme is a
  sharp edge, not a feature. R7 makes the asymmetry documentation instead.
- **Teaching the token sheet to emit `color-scheme`, or the reference theme to
  key on a `--hz-mode` custom property instead of the attribute.** These are
  what a dark rename would need first. Both are their own spec, and neither is
  needed while `dark` is fixed.
- **A CLI flag for `defaultThemeName`**, and a `--check` detector to go with
  it (R3). A theme's name describes the design system; 67 R10 settled that such
  things live in the config, and without a flag a mismatch is unreachable.
- **A `Default:` header line** in the generated sheet. Zero bytes is the right
  answer when nothing can disagree.
- **Replacing the three `theme.name === 'dark'` comparisons with identity
  checks** (R3). Equivalent with `dark` fixed; churn without the rename.
- **A codemod, or any automatic migration** for the rename. The migration is
  one config line, and R8 puts it in the changelog and on the Config page.
- **Changing `theme()` / `themeVars` / `HyzerThemeOverride`.** The attachment
  writes whatever name it is given and always did.
- **A `prefers-color-scheme: light` block, or any second media query.** The
  default is what `:root` already is.
- **Renaming Terminal's or Ocean's themes** (R5). Both ride the new default and
  neither config gains a key.
- **A third copy of the hook-to-token pattern** (R7). It is on the Component
  hooks page and the Config page; the new copy links.
- **Changes under `sv-addon/`.** It consumes the config template by import.

### Write scope

`src/lib/config/schema.ts` (the key, `ResolvedConfig.defaultThemeName`,
`assertThemeName`, the two collision rules, the JSDoc pass);
`src/lib/config/generate.ts` (the three selector sites, `defaultRestore`, the
two comment functions); `src/lib/config/report.ts` (one line, three comments);
`src/lib/tokens/tokens.css`, `src/lib/theme/examples/ocean.css`,
`src/lib/theme/examples/terminal/terminal.tokens.css` (all regenerated);
`src/docs/theme.svelte.ts`; `src/routes/+layout.svelte` (comment only);
`src/lib/cli/config-template.js`; `src/docs/agentRules.ts`; `CHANGELOG.md`;
`src/routes/docs/theming/sections/+page.svelte`,
`src/routes/docs/theming/tokens/+page.svelte`,
`src/routes/docs/foundation/config/+page.svelte`,
`src/routes/docs/foundation/colors/+page.svelte`;
`src/lib/config/config.spec.ts`, `src/lib/cli/main.spec.ts`,
`src/docs/theme.svelte.spec.ts` (new), `src/routes/docs.e2e.ts`.

No new dependencies. No component (`.svelte` library file) changes. No changes
to `scripts/gen-tokens.ts`, to either example config, or under `sv-addon/`. New
public API: one config key and one field on `ResolvedConfig`. One breaking
change: the shipped default theme is named `default`.
