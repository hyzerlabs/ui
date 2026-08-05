# 69 — First-run fidelity: the dark block, the template, and where `output` lands

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. **Builds on
> `specs/29-token-engine.md` (the config engine, the CLI and its report
> shapes), `specs/30-theming.md` / `specs/42-palette-split.md` (the palette →
> role → intent layering and the two-tier dark rule),
> `specs/65-themes-all-token-groups.md` (a theme is a token override;
> `tokens.components` and its root-only rule),
> `specs/66-check-detects-stale-output.md` (`--check` compares the artifacts on
> disk), `specs/67-scope-selector-and-theming-ia.md` (`selector` as a config
> key and a flag; the doctrine that anything describing the design system
> lives in the config) and `specs/68-default-theme-name.md`
> (`defaultThemeName`, the `default` rename, and the reasoning for why `dark`
> is fixed) and does not restate them.** Every design choice below is settled;
> the `Decided:` tails record the option that was rejected, so nobody
> relitigates it mid-build.

**65, 66, 67 and 68 are already implemented and committed** on this branch
(`f9659694`, `ab949c15`, `16b061cc`, `697e7ffb`, `90631d23`). 68 landed last
and moved anchors in `generate.ts`, `schema.ts` and `report.ts`; every
`file:line` below was re-verified against the landed code, not against the
earlier specs' descriptions of it. Read the current files. 69 lands on the
same branch as its own commits.

### Goal

Three defects, all found the same way: installing the packed tarball into a
clean app and running `hyzer init` then `hyzer generate`.

1. **Overrides mode and full mode disagree about an overridden hue in dark**,
   and the contrast report grades the answer only full mode gives. The run
   reports AA passing about a pairing that never appears on screen.
2. **The config template claims "every option, commented out" and shows about
   a seventh of them.** Make it 1:1 with the generated default sheet, and
   generate it so it stays that way.
3. **`output` resolves against two different anchors** depending on whether
   the key is present, and the JSDoc documents only one of them.

---

### Context & conventions

- **None of our own tests could have caught any of this**, and that is the
  reason the test plan authors new fixtures rather than extending existing
  ones. Every fixture the repo owns is a config we wrote, generated in full
  mode, with a `themes.dark` block already present:
  `config.spec.ts`'s overrides cases, `ocean.config.ts` and
  `terminal.config.ts` all set `themes.dark`, and `tokens.css` is full mode
  with no config at all. "A token override with no `themes.dark` counterpart,
  generated in overrides mode" is a shape nothing in the repo exercises. Same
  for the CLI: every `--config` test either passes `--out` or sets `output`
  (`main.spec.ts:53-67`, `:248-257`, `:648-658`), so nothing pins where the
  *default* output lands when the config lives in a subdirectory.
- **Byte-drift, stated up front.** `tokens.css` and `utilities.css` must come
  back **byte-identical** — full mode's emission is untouched and the
  utilities sheet has no theme blocks. `ocean.css` gains exactly three
  declarations and `terminal.tokens.css` exactly five, both inside the dark
  block, both from R3. `src/lib/cli/config-defaults.js` is a new generated
  file. Everything is regenerated with `corepack pnpm gen:tokens`; a hand edit
  is a defect.
- **Docs are consumer-facing.** No spec numbers, no `Rn`, no test-gate or
  process language in anything a reader sees. Every copy change gets an
  editor-agent pass before commit.

---

### Stage map

Three commits on this branch, reviewed together as one PR. They are
independent — no ordering constraint — but each ends with its own full gate
run (see Gate).

| Stage | Requirements | What lands |
| --- | --- | --- |
| 1 | R1–R5 | The overrides-mode dark block agrees with full mode; Terminal's config authors its own dark hues |
| 2 | R6–R10 | The config template is generated, 1:1 with the default sheet, and byte-proven |
| 3 | R11–R13 | `output` resolves against the config file, everywhere |

---

## Stage 1 — the modes agree about dark

### The defect, verified

With `{ tokens: { palette: { primary: '#0f766e' } } }` and no `themes.dark`:

- **Full mode** emits `:root { --hz-palette-primary: #0f766e }` and
  `[data-theme='dark'] { --hz-palette-primary: #60a5fa }`. The dark block
  carries the library's companion because `resolved.dark.palette` is seeded
  from `palette.theme.dark` (`schema.ts:926-929`) and `generateFull` emits
  every entry of it (`generate.ts:636-646`).
- **Overrides mode** emits only `:root,\n[data-theme='default'] { --hz-palette-primary: #0f766e }`.
  No dark block at all: `darkEntries` (`generate.ts:777-781`) keeps a dark
  entry only when `e.fromConfig || darkDerives(e)`, and a *seeded* companion
  is neither — it is not config-authored, and `#60a5fa` is a literal with no
  `var()` to derive from.

**The cascade, verified independently, because the whole stage rests on it.**
`:root` is a pseudo-class and `[data-theme='dark']` is an attribute selector;
both are specificity (0,1,0). For a selector list the specificity that counts
is the one that matched, so `:root,\n[data-theme='default']` counts as `:root`
on an element carrying `data-theme="dark"`. Neither sheet is layered
(`tokens.css:1-11` opens straight into `:root`), so source order decides — and
the overrides header instructs "import this sheet AFTER
@hyzer-labs/ui/tokens.css" (`generate.ts:750-751`). On
`<html data-theme="dark">` the consumer's `#0f766e` wins.

**The same claim, without depending on import order.** Put
`data-theme="dark"` on a `<section>` instead. The overrides sheet's `:root`
rule does not match a section, so the base sheet's dark block does, and the
section paints `#60a5fa` while `<html data-theme="dark">` paints `#0f766e`.
One attribute value, two results, decided by which element carries it. That
is the bug even if the import order were reversed.

**The framing the requirements are built on:** in overrides mode the emitted
cascade disagrees with the resolved model the contrast report grades.
`contrastReport` grades `declarationMaps` (`report.ts:85-108`), whose `dark`
map is `resolved.dark` — primary `#60a5fa`. The page paints `#0f766e` on dark
surfaces. Full mode has no such gap.

This is not hypothetical in shipped code. **`ocean.css` currently ships an
AA-failing dark mode whose own report says it passes.** Ocean deepens
`warning` to `#92400e` and `success` to `#166534` at root, explicitly so they
pass AA on its light surface (`ocean.config.ts:28-34`), and authors dark
counterparts for only `primary`, `secondary` and `danger`. So `#92400e` paints
as warning text on Ocean's `#0b1120` dark surface, while
`examples.spec.ts:34-41` grades `#fbbf24` and passes.

**R1 — One predicate, one condition, in `generateOverrides`.** The rule:
**the sheet emits the dark theme's own value for every token the sheet
declares at its root.** `generate.ts:777-781` becomes one shared predicate
over the same three groups:

```ts
const rootNames = new Set(rootEntries.map((e) => e.cssName));
const keepDark = (e: TokenEntry) =>
    e.fromConfig || rootNames.has(e.cssName) || darkDerives(e);
```

`rootEntries` is already computed immediately above (`generate.ts:762-764`)
and is the right input in both modes: unscoped it is exactly the
config-touched entries, scoped it is `scopedClosure`'s output, and in both
cases it is precisely the set of declarations this sheet lands at its own root
— which is the set that leaks into dark.

The three existing conditions stay and do not overlap: `fromConfig` is "the
consumer authored this in dark", `rootNames` is "this sheet re-declares the
same custom property at its root", `darkDerives` is "this dark value reads a
custom property this sheet re-declares" (`generate.ts:775-776`, surface-muted's
mix). Each catches a case the others miss.

Nothing else in `generateOverrides` changes. `restorableNames` and `restorable`
(`generate.ts:794-799`, `:849-853`) are computed from `themeOwn(resolved.dark)`
(`generate.ts:539-541`), which has always included every seeded entry, so
`mergeDefault` and the default-restore block are unaffected — verify that
rather than assume it, since a change there would move `tokens.css`.

*Decided:* **(a) — overrides mode follows full mode.** The rejected option is
**(b), an override with no dark counterpart applies in both modes**, which
would drop a seeded dark entry whose root value the config replaced. (b) is
attractive: it matches what a consumer means when they write
`palette.primary`, it matches what a plain-CSS `:root` override does, it needs
no example-config change, and — contrary to the first reading — it moves
neither `tokens.css` (generated with no config, so nothing is `fromConfig`)
nor `ocean.css` nor `terminal.tokens.css`. It is roughly the same size of
diff, in `resolveConfig` instead of `generateOverrides`.

It is rejected on one concrete case. The dark seed is not only hues: it is
also `color.surface`, `color.surfaceMuted` and `color.text`
(`tokens/index.ts:71-77`), which are the whole of dark mode. Under (b), a
consumer who sets `tokens.color.surface: '#fafafa'` — an off-white page, one
of the most ordinary overrides there is — loses the dark surface entirely and
gets a white "dark" mode. Setting `color.text` alone leaves black text on a
black surface. The contrast report would scream, loudly and correctly, but the
failure is "your dark mode is gone", triggered by a one-line config, and the
only fix is to author a dark block the library was already authoring for you.
Narrowing (b) to the palette tier only would be arbitrary — the two-tier rule
puts dark at the palette *and* role tier by design.

The principle that survives: **`tokens` is the default theme, not every
theme.** The seeded dark theme is a complete, AA-tuned theme in its own right,
and an override of the default is not an override of it. That is what full
mode has always emitted and what the report has always graded. The cost is one
documented sentence (R5) and it is the cost 68 R7 already chose when it wrote
down the seed as a feature.

*Decided:* no dev warning for "a root override with no `themes.dark`
counterpart". After R1 that is correct behavior, not a mistake, and a warning
would fire on nearly every config that touches a hue.

**R2 — The dark block carries the non-color groups too.** `darkEntries` reads
`color`, `palette` and `intent` and never `rest` (`generate.ts:777-781`), so a
`themes.dark` entry for any group 65 opened up — `radius`, `space`,
`typography`, `shadow`, `motion`, `density.unit` — is resolved
(`schema.ts:639-691`), graded, emitted by full mode
(`generate.ts:642`'s `[theme.palette, theme.intent, theme.rest]`) and
**silently dropped by overrides mode**. Add `...resolved.dark.rest.filter(keepDark)`
as the fourth group, last, matching `themeOwn`'s order
(`generate.ts:539-541`) and full mode's.

The filter is a no-op for `rest` — every entry there comes from
`mergeGroup([], override, …)` and is `fromConfig` — but it is written the same
way as its three siblings so the four lines read as one rule.

`--hz-density` is the one entry in `rest` that needs care, and the plumbing
already exists: `mergeDefault` is forced off when a theme declares it
(`generate.ts:808`) and the restore block splices in the root unit
(`generate.ts:858-865`). Confirm both still hold with the entry now actually
emitted.

Neither example config sets a non-color group under `dark`, so this moves no
committed sheet.

**R3 — Two example sheets regenerate; Terminal's config gains its own dark
hues.** This is the interaction R1 has to survive, and it is not a
hand-waving matter — one of the two shipped examples would visibly break
without a config change.

**Ocean: three declarations, no config change.** Ocean overrides `warning`,
`success` and `info` at root without dark counterparts, so R1 newly emits the
library's companions for them. The permitted diff in
`src/lib/theme/examples/ocean.css` is three lines added to the dark block
(`ocean.css:31-38`), in `resolved.dark.palette` seed order, immediately after
`--hz-palette-danger`:

```css
	--hz-palette-warning: #fbbf24;
	--hz-palette-success: #4ade80;
	--hz-palette-info: #22d3ee;
```

Nothing else in the file. This is the fix, not a regression: it is what full
mode emits, what the report grades, and it replaces three hues chosen for a
light surface with three tuned for a dark one. `ocean.config.ts` is not
touched — authoring three dark hues of our own would be a design change to a
shipped example, and the companions are already correct.

**Terminal: five declarations, and a config change is required.** Terminal
overrides `secondary`, `danger`, `warning`, `success` and `info` at root
(`terminal.config.ts:60-66`) and its `themes.dark` sets only color roles
(`:104-113`). Under R1 alone its dark block would newly emit the library's
companions for all five, so Terminal's cyan `#00e5ff` secondary would become
`#a78bfa` purple in dark. That is wrong for Terminal and would ship.

The narrower emission condition that would avoid it does not exist. What R1
exposes is a latent defect in Terminal's *config*: `resolved.dark.palette` for
Terminal has always been the library's seven companions, so the contrast
report has always graded purple-on-black for Terminal's secondary while the
sheet painted cyan. R1 does not create that disagreement, it makes the sheet
stop hiding it.

So `terminal.config.ts`'s `themes.dark` gains a `palette` group pinning
Terminal's own five hues, above the existing `color` group:

```ts
	dark: {
		// The signal hues were picked for a black tube already, so lights-out
		// reuses them rather than inventing a second set. Naming them here is
		// what keeps the library's own dark companions out of this theme.
		palette: {
			secondary: '#00e5ff',
			danger: '#ff3b30',
			warning: '#ffd166',
			success: '#00ff41',
			info: '#00e5ff'
		},
		color: { … unchanged … }
	}
```

Pinning rather than brightening is deliberate: it keeps Terminal's rendered
output exactly what it is today, so the only change a reader sees is that the
sheet now says out loud what it was already painting. `phosphor` and `amber`
are not listed — the library has no companion for a hue it does not ship, so
`resolved.dark` never declares them and R1 never emits them; the root values
carry into dark on their own. `primary` and `gray` are not listed either:
Terminal does not override them at root, so they are not in `rootNames` and
R1 leaves them alone.

The permitted diff in
`src/lib/theme/examples/terminal/terminal.tokens.css` is five lines added to
the dark block (`terminal.tokens.css:68-75`), after `--hz-color-border`, in
seed order:

```css
	--hz-palette-secondary: #00e5ff;
	--hz-palette-danger: #ff3b30;
	--hz-palette-warning: #ffd166;
	--hz-palette-success: #00ff41;
	--hz-palette-info: #00e5ff;
```

Nothing else. In particular the scoped root block (`:40-66`) must not move:
all five names are already `fromConfig` at root, so `scopedClosure`
(`generate.ts:527-536`) sees the same seed and produces the same closure.
Verify that with `git diff` rather than trusting it.

| Sheet | Permitted change |
| --- | --- |
| `src/lib/tokens/tokens.css` | **byte-identical.** Full mode's emission is untouched. |
| `src/lib/theme/utilities.css` | **byte-identical.** No theme blocks. |
| `src/lib/theme/examples/ocean.css` | three declarations added inside `[data-theme='dark']`. Nothing else. |
| `src/lib/theme/examples/terminal/terminal.tokens.css` | five declarations added inside the dark pair. Nothing else. |

*Decided:* Terminal's config, not a narrower emission rule. The rule R1 states
is coherent and complete — "dark declares it, so dark wins" — and every
narrowing considered (unscoped sheets only; palette tier only; only when the
dark value is a `var()` chain) is a special case with no principle behind it
that would also have to be documented and tested. Terminal's config was
incomplete; the fix belongs there.

*Decided:* Terminal's `intro` (`terminal.config.ts:11-38`) is not rewritten.
"Both looks here are dark. The default is a tube at rest, and the dark theme
is lights-out" stays true — lights-out still changes the roles, and now says
explicitly that it keeps the hues.

**R4 — The report and the sheet are asserted against each other, once.**
R1's whole justification is that the emitted bytes and the graded model had
drifted, so one test must compare them directly rather than each to its own
expectation. For the fixture `{ tokens: { palette: { primary: '#0f766e' } } }`:

- every declaration inside the overrides sheet's `[data-theme='dark']` block
  appears verbatim inside the full sheet's `[data-theme='dark']` block; and
- `--hz-palette-primary: #60a5fa;` is one of them, and `#60a5fa` is the value
  `contrastReport(resolved)` resolved for the `dark` row that grades
  `intent-primary`.

Parse by slicing between `[data-theme='dark'] {` and the next `}` — the
generated sheets have no nesting inside a theme block. This is the assertion
that fails if anyone ever re-narrows `keepDark`, and the reviewer's pass/fail
for the stage.

**R5 — What an override does in dark, said once, in consumer language.**
One short paragraph on
`src/routes/docs/theming/tokens/+page.svelte`, and one clause in the config
template (R9). Nowhere else — this is the page that already teaches both the
plain-CSS and the config route and already carries the dark doctrine
blockquote (`:102-107`).

What it has to say, in the page's own register:

- Everything under `tokens` describes your default theme. The library ships a
  complete dark theme, tuned for contrast on a dark surface, and it keeps its
  own value for anything it covers — so a hue you change under `tokens` is a
  default-theme value. Set it under `themes.dark` as well when it should carry
  into dark, exactly as the sample on Config & CLI already does
  (`foundation/config/+page.svelte:100-103`).
- The plain-CSS route behaves differently, and the page teaches both, so say
  so in one sentence: a `:root` rule of your own comes after `tokens.css`, so
  it also lands in dark at the page level — which is why the Dark mode recipe
  writes a `[data-theme='dark']` rule (`tokens/+page.svelte:30-43`). The
  config route emits that rule for you.

Do not restate the two-tier rule, and do not add a fifth explanation of
`themes.dark` — the existing blockquotes (`:102-114`) already carry it. One
paragraph, one link.

**`CHANGELOG.md`'s `[Unreleased]` section** (added by 68, `:8-21`) gains a
`### Fixed` entry: an overrides-mode sheet now carries the dark theme's own
value for every token it overrides, so dark matches what a full sheet and the
contrast report always said; if you want your own hue in dark, name it under
`themes.dark`. Mention that regenerating an existing overrides sheet may add
declarations to its dark block.

---

## Stage 2 — the template is what it claims

### The defect, verified

`src/lib/cli/config-template.js:9` says "every option, commented out", and the
JSDoc above it (`:1-8`) says "every option in the schema". The file shows the
nine top-level keys and about a dozen illustrative token values. The default
sheet's `:root` block declares **76** custom properties (75 section entries
plus `--hz-density`) and its dark block **10** more. So "every option" is off
by roughly seven times, and a reader who runs `hyzer init` to find out what
`--hz-width-md` defaults to does not find out.

**R6 — Generate it, from the same metadata that produces `tokens.css`.**
Hand-maintaining 86 default values against `src/lib/tokens/index.ts` is
exactly the rot the generator and the drift tests exist to prevent, and the
template already drifts every time a token is added.

- **New generated file `src/lib/cli/config-defaults.js`**, plain JS with no
  imports, exporting two string constants (R7). Plain JS is a hard
  constraint, not a style choice: `sv-addon/src/index.js:3` imports
  `config-template.js` from source and bundles it, so a `.ts` sibling would
  break the add-on's build.
- **New renderer `scripts/gen-config-defaults.ts`**, exporting
  `renderConfigDefaults(): string` — the complete file source, including its
  `GENERATED FILE — do not edit by hand` banner. It imports the token groups
  from `src/lib/tokens/index.ts` and nothing else.
- **`scripts/gen-tokens.ts`** writes it alongside the four sheets
  (`gen-tokens.ts:25-50`) and its module doc (`:1-13`) names it. One command
  still regenerates everything.
- **`AGENTS.md`'s generated-files table** (`:24-29`) gains a row:
  `src/lib/cli/config-defaults.js` → `pnpm gen:tokens`.
- The file stays out of `.prettierignore`. Its skeleton is two
  `export const X = \`…\`;` statements, which Prettier leaves alone, and
  Prettier never reformats a template literal's contents. If
  `prettier --check` ever disagrees, fix the emitter — do not add the file to
  the ignore list, because that list exists for output whose *interior*
  Prettier would fight over (`.prettierignore:14-24`).

*Decided:* a separate generated file rather than a generated region inside
`config-template.js`. One file, one owner — `config-template.js` stays
hand-written and keeps taking editor passes like the docs surface it is (67
R12, 68 R7 both edited it), while the 86 defaults stay somewhere a hand edit
is caught by a drift test. Rewriting a marked region of a mixed file is more
generator code than writing a whole small one.

*Decided:* the renderer lives in `scripts/`, not `src/lib/`. It is build-time
only; in `src/lib/` it would ship in `dist` for no consumer benefit.
`gen-tokens.ts` cannot host it directly because it writes files on import,
which a test cannot do.

**R7 — Two constants, each self-contained and defaults-only.** The split is
what makes R8's invariant provable, so it is a requirement rather than an
implementation detail.

| Constant | Contents |
| --- | --- |
| `CONFIG_TOKEN_DEFAULTS` | the complete commented `tokens: { … },` block — every group, every default value, **no `components`** |
| `CONFIG_DARK_DEFAULTS` | the complete commented `themes: { dark: { … } },` block — the 7 seeded palette companions and the 3 seeded roles, **no other theme** |

Format rules, all load-bearing:

- **Every line is one tab, then `// `, then the content at its real
  indentation.** That is the template's existing convention and the reason
  `main.spec.ts:720`'s `line.replace(/^\t\/\/ /, '\t')` uncomments any depth
  correctly. No trailing whitespace.
- **Group order follows the sheet's**, so the two can be read side by side:
  `palette`, `color`, `intent`, `typography` (`fontSize`, `fontFamily`,
  `fontWeight`, `lineHeight`, in that order), `space`, `density`, `width`,
  `radius`, `border.width`, `shadow`, `zIndex`, `motion` (`duration`, then
  `ease`). `density` sits after `space` because that is where the sheet emits
  `--hz-density` (`generate.ts:619-623`). Today's template puts `density` near
  the end; move it.
- **One comment per group**, naming the custom-property prefix it drives
  (`--hz-palette-*`, `--hz-width-*`, …), in the template's clipped register.
  No per-token comments — 76 of them is noise, and the value *is* the
  documentation.
- **The group table is asserted against the schema at generate time.** Export
  `TOKEN_GROUP_KEYS` (`schema.ts:706-720`) from `schema.ts` — internal, not
  re-exported from the package barrel, the same treatment `assertSelector`
  gets (`main.ts:44-46`) — and have the renderer throw when a key other than
  `components` is missing from its emission table. One line; it is the guard
  that makes "1:1" survive the next token group.
- **String emission.** Single quotes by default; double quotes when the value
  contains a `'` (`typography.fontFamily.sans` is
  `"system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"`).
  Throw on a value containing both quote characters, a backtick or `${` —
  none exist today, and the file is a template literal, so a silent break is
  the alternative.
- **Key emission.** Bare identifiers where legal, quoted otherwise —
  `typography.fontSize` has `'2xl'` and `'3xl'`.
- **`density.ladder` is included**, with the four real defaults
  (`calc(var(--hz-density) * 10)`, `* 5`, `* 2`, `* 1`, from
  `density.levels`). It is the hardest part of the API to discover, its
  default *is* visible in the sheet as each rung's `var()` fallback, and it
  round-trips exactly: `densityRungFallback` substitutes a configured rung
  verbatim (`generate.ts:226-233`), so the configured default emits the same
  bytes as no configuration. The renderer builds the strings from `density`
  in `tokens/index.ts`; R8 is the guard that they match.

**R8 — The invariant: uncommented defaults regenerate `tokens.css` byte for
byte.** Stronger than today's gate (`main.spec.ts:708-726`, which only asserts
`resolveConfig` does not throw), and it is what proves "1:1" mechanically
rather than by eye. It fails the moment a token is added to
`src/lib/tokens/index.ts` without the template following.

```
uncomment(CONFIG_TOKEN_DEFAULTS) + uncomment(CONFIG_DARK_DEFAULTS)
  → wrapped in an object literal → resolveConfig → generateCss
  → byte-identical to src/lib/tokens/tokens.css
```

**This has been confirmed reachable by reading the resolution path**, and the
builder should expect it to pass first time; if it does not, fix the emitter
rather than weakening the assertion, and if some single value genuinely cannot
round-trip, name it in the commit message rather than silently excluding it.
The four things that had to be true, and are:

1. `mergeGroup` overrides an existing key **in place** (`schema.ts:449-473`),
   so re-declaring every default in metadata order produces the same entries
   in the same order, differing only in `fromConfig` — which full mode never
   reads (`declarations`, `generate.ts:204-212`).
2. `resolved.density.unitFromConfig` flips to `true`, and full mode never
   reads it; only `generateOverrides` does (`generate.ts:784`, `:808`).
3. `resolveTheme('dark', override, seed)` (`schema.ts:633-704`) merges the
   config's dark values over the same seed in the same order, so
   `resolved.dark` is entry-for-entry identical and the dark block, the
   `prefers-color-scheme` block and `defaultRestore` all emit the same bytes.
4. Section order comes from `resolveConfig`'s own `sections` array
   (`schema.ts:802-902`), not from the config's key order, so the group
   ordering R7 asks for is free.

**Explicitly outside the invariant, and the spec says so here so a later
builder does not helpfully "complete" it:**

- **`tokens.components`.** The 41 component hooks have no defaults — the group
  seeds from `[]` (`schema.ts:909`) — so nothing about them is in the default
  sheet, and uncommenting one emits a component-hooks section that
  `tokens.css` does not have. They are out of "1:1 with the sheet" by
  definition. R9 keeps the illustrative pair.
- **The illustrative top-level keys** (`output`, `selector`,
  `defaultThemeName`, `icons`, `utilities`, `contrast`, `strict`) and the
  illustrative theme names. Uncommenting `selector` scopes the sheet and
  `defaultThemeName: 'brand'` renames a block, both by design. The existing
  whole-template uncomment-and-resolve test stays as their gate.

**R9 — What stays hand-written in `config-template.js`, and one trick that
makes it safe.** The file keeps its shape: the header lines, the nine
top-level keys as single-commented uncommentable lines, and the two constants
interpolated in place of today's `tokens` and `themes` blocks (`:24-68`).

The illustrations that cannot live inside a defaults-only constant —
`tokens.components`'s `buttonAccent`/`badgeTint` pair, and the "any name you
like" theme examples — become **doubly-commented** lines: one tab, `// `, then
`// ` again, then the text. Uncommenting the template strips the first layer
and leaves a comment, so they can never create a duplicate `tokens` or
`themes` key when the whole file is uncommented, and they need no marker for a
test to skip. That is already the template's own trick for continuation prose
(`config-template.js:58-60` hides prose behind a second `//`); this applies it
deliberately.

- **The component-hooks pointer stays** — user's explicit decision. Four
  doubly-commented lines after the tokens block: hooks have no defaults, so
  they are not listed above; they go under `tokens.components`, camelCased,
  with no `--hz-` prefix; the `buttonAccent` / `badgeTint` pair as the
  example; and the URL of the Component hooks page for the full list.
- **The theme-name illustrations stay**, doubly-commented after the dark
  block: any other name is a theme too, and a theme takes any group `tokens`
  takes, not only color. Keep `ocean` and `print` as the two examples, since
  the second is the one that shows a non-color group.
- **The `dark` clause 68 R7 added** (`:61`) stays, on the generated block's
  `dark:` line — which means the renderer owns that sentence now. Carry it
  across verbatim: dark is always emitted, so an entry here changes dark
  rather than creating it, and the name is fixed because it is the platform's.
- **`INIT_HEADER` (`:9-15`) gains one line**: the values shown are the current
  defaults, so uncommenting a line changes nothing until you edit it. Keep it
  to one line — this is the first thing a reader sees.
- **The module JSDoc (`:1-8`) says where the defaults come from** and that
  they are generated, so a hand edit gets pointed at the generator.
- **R12's `output` annotation** lands here too.

**R10 — Two surfaces feel the length, and one needs a prop.** `hyzer init`
goes from 76 lines to roughly 175.

- **`src/routes/docs/foundation/config/+page.svelte:476`** renders the whole
  template as the "Full config reference" (`:197`). Add `collapsible` — the
  component already has it, with `collapsedLines`
  (`src/docs/data/code-block.ts:44-53`) — and pick a `collapsedLines` that
  shows the top-level keys and the start of `tokens`. The paragraph above it
  (`:469-475`) gains one clause: the values shown are the current defaults.
- **`hyzer init` and `sv add` both write the longer file.** No code change in
  either. `sv-addon/src/index.js` consumes `CONFIG_TEMPLATE` by import
  (`:3`, `:100`) and its bundler follows the new relative import on its own,
  but run `corepack pnpm --dir sv-addon build` once to confirm the bundle
  still builds: the add-on has its own toolchain and is not part of the main
  gate.

---

## Stage 3 — `output` has one anchor

### The defect, verified

`src/lib/cli/main.ts:219-223`:

```ts
const outPath = parsed.out
    ? resolve(cwd, parsed.out)
    : resolved.output && configPath
        ? resolve(dirname(configPath), resolved.output)
        : resolve(cwd, resolved.output ?? DEFAULT_OUTPUT);
```

Set `output` and it resolves against the config file's directory. Leave it
unset and `DEFAULT_OUTPUT` resolves against the cwd, even when a config was
found. So `hyzer generate --config packages/ui/hyzer.config.ts` from a repo
root writes to `packages/ui/` or to the repo root depending on whether the key
is present. `schema.ts:102`'s JSDoc — "relative to the config file" — is true
only in the first case.

Auto-discovery only ever looks in the cwd (`main.ts:162-164`), so the
divergence is reachable only through `--config`. That is a tight blast radius,
and it is exactly the invocation a monorepo uses.

**R11 — One base, four paths.** The rule: **config-supplied paths resolve
against the config; flag-supplied paths resolve against your shell.**
`--out` staying cwd-relative is correct and conventional — it is what the user
typed, in the directory they typed it in.

The paths block (`main.ts:213-233`) gains one constant and loses a nested
ternary:

```ts
// Anything the config decides is relative to the config; anything a flag
// decides is relative to where you ran the command.
const base = configPath ? dirname(configPath) : cwd;
const outPath = parsed.out ? resolve(cwd, parsed.out) : resolve(base, resolved.output ?? DEFAULT_OUTPUT);
```

and `utilitiesPath` (`:229-233`) collapses to
`utilitiesRelOutput ? resolve(base, utilitiesRelOutput) : join(dirname(outPath), DEFAULT_UTILITIES_OUTPUT)`
— the same behavior it has today, expressed once.

`iconsPath` (`:224`) and the default utilities filename both derive from
`dirname(outPath)` and follow for free. The `--check` branch reads the same
constants (66 R1's rule, `main.ts:214-216`), so it checks wherever the write
branch would write.

**This is a behavior change**, and pre-1.0 or not it gets labelled: anyone
with a config in a subdirectory and no `output` key finds their sheet beside
the config instead of beside their shell. It makes the documented rule true,
and one `--check` run reports the old location as "has not been generated" —
a note, not a finding, so no build breaks.

*Decided:* the *default* filename follows the config too, rather than only
config-supplied strings. "The sheet lands beside the file that describes it"
is one sentence; "a path you wrote resolves against the config, but the
default resolves against your shell" is two, and the second is the sentence
nobody can predict. `--out` is the escape hatch and it did not move.

**R12 — Say it in the four places that describe it.** All in the same commit.

- **`schema.ts:102`'s JSDoc.** Where `hyzer generate` writes the sheet,
  resolved against this config file's own directory; `--out` overrides it and
  is resolved against the directory you run the command in; the default is
  `hyzer-tokens.css` beside this file.
- **`main.ts:62`'s `USAGE` line** for `--out`: same rule, one line, in the
  file's existing register — the default is `hyzer-tokens.css` beside the
  config, and `--out` itself is relative to where you are.
- **`config/+page.svelte:38-41`'s `--out` row.** It currently says "Set
  neither and it goes to `./hyzer-tokens.css`", which is the half that is
  wrong. Restate: the config key is relative to the config file, the flag is
  relative to where you run the command, and with neither set the sheet lands
  beside your config. Keep the closing clause about the utilities sheet.
- **`config-template.js:20`.** The line reads
  `// output: 'src/styles/tokens.css',` with the comment "where `hyzer
  generate` writes the sheet", which reads like a default when it is an
  illustration. Annotate it with the real one: relative to this file; without
  it, `hyzer-tokens.css` beside this file. R9 owns the edit.

**R13 — `CHANGELOG.md`.** A `### Fixed` entry under `[Unreleased]`:
`hyzer generate` now writes beside your config file whether or not you set
`output`; it previously wrote into the directory you ran the command from when
the key was absent. `--out` is unchanged and is still relative to where you
run the command. Name `icons.ts` and the utilities sheet as following the
tokens sheet.

---

### Edge cases

| Case | Expected |
| --- | --- |
| `{ tokens: { palette: { primary: '#0f766e' } } }`, overrides mode | `[data-theme='dark'] { --hz-palette-primary: #60a5fa; }` is emitted. The merged `:root, [data-theme='default']` rule is unchanged. |
| The same config, full mode | Unchanged from today, and its dark block is a superset of the overrides sheet's. |
| The same config plus `themes: { dark: { palette: { primary: '#0f766e' } } }` | The consumer's value is emitted in dark, `fromConfig`, exactly as today. This is the documented way to carry a hue across. |
| `{ tokens: { palette: { fairway: '#3f6212' } } }` — an added hue | No dark block at all. The library declares no dark companion for a hue it does not ship. |
| `{ tokens: { color: { surface: '#f8fafc' } } }` | The dark block emits `--hz-color-surface: var(--hz-palette-black);`. Today it emits nothing and the light surface paints in dark. |
| `{ tokens: { color: { border: '#94a3b8' } } }` | No dark block. `border` is not in the dark role seed, so the root value is correct in both modes — and full mode agrees. |
| `{ themes: { dark: { radius: { md: '0' } } } }` | `[data-theme='dark'] { --hz-radius-md: 0; }` (R2). Today it emits nothing. |
| `{ themes: { dark: { density: { unit: '0.5rem' } } } }` | The dark block declares `--hz-density`; `mergeDefault` stays off and the restore block carries the root unit. |
| Scoped, `{ tokens: { palette: { primary } } }` + `selector: '.theme-x'` | The compound + descendant dark pair carries the counterpart. The root closure is unchanged. |
| `resolveConfig()` with no config, overrides mode | `No overrides configured.` — unchanged. `rootEntries` is empty, so `rootNames` is empty. |
| `ocean.css` after R3 | Exactly three added declarations in the dark block; drift, AA, root-selector and fallback-parity tests green. |
| `terminal.tokens.css` after R3 | Exactly five added declarations in the dark block; the scoped root block byte-identical; all four example tests green. |
| `tokens.css` / `utilities.css` after Stage 1 | Byte-identical. |
| `CONFIG_TOKEN_DEFAULTS` + `CONFIG_DARK_DEFAULTS`, uncommented and resolved | `generateCss` output is byte-identical to `tokens.css`. |
| The whole template, uncommented | Still resolves without throwing. The doubly-commented illustrations stay comments, so no key is declared twice. |
| A new token added to `tokens/index.ts` without regenerating | The `config-defaults.js` drift test fails, and so does R8's round-trip. |
| A token value containing a `'` | Emitted double-quoted; round-trips. |
| A token value containing a backtick or `${` | The renderer throws, naming the token. None exist today. |
| `hyzer init` after Stage 2 | One file, ~175 lines, valid as written, every default visible. |
| `--config conf/hyzer.config.mjs`, no `output`, no `--out` | The sheet lands at `conf/hyzer-tokens.css`. `icons.ts` and the default utilities sheet land beside it. |
| `--config conf/hyzer.config.mjs` with `output: 'styles/x.css'` | `conf/styles/x.css` — unchanged from today. |
| `--config conf/hyzer.config.mjs --out out/tokens.css` | `<cwd>/out/tokens.css` — the flag is relative to the shell, unchanged. |
| No config file anywhere | `<cwd>/hyzer-tokens.css` — unchanged. |
| `--check --config conf/…` against a sheet left at the old cwd location | The config-relative path is reported absent (`?`, a note), exit 0 under `--strict`. Not a finding. 66 R3 is unchanged. |
| `utilities: { output: 'styles/u.css' }` with a subdirectory config | `conf/styles/u.css` — unchanged from today, now expressed through the shared base. |

### Existing code to reuse

- **`darkDerives` and the `darkEntries` list (`generate.ts:775-781`)** — R1 is
  one predicate over the three filters that are already there, plus a fourth
  group. No new emission code.
- **`rootEntries` (`generate.ts:762-764`) and `scopedClosure`
  (`generate.ts:527-536`)** — the set of "what this sheet declares at its own
  root" already exists in both modes; R1 reads it rather than recomputing it.
- **`themeOwn` (`generate.ts:539-541`) and `generateFull`'s group loop
  (`generate.ts:641-646`)** — the emission order R2 must match, and the
  definition of "what a theme declares" that `restorableNames` already uses.
- **`declarationMaps` (`report.ts:85-108`)** — the model R4 asserts the sheet
  against. It does not change.
- **`mergeGroup` (`schema.ts:443-475`) and `resolveTheme`
  (`schema.ts:633-704`)** — why R8's round-trip is byte-exact rather than
  merely equivalent. Neither changes.
- **`densityRungFallback` (`generate.ts:226-233`)** — the expression R7's
  ladder defaults must reproduce; R8 is the guard that they do.
- **`scripts/gen-tokens.ts:25-50` / `corepack pnpm gen:tokens`** — the only
  way any committed artifact changes, now including `config-defaults.js`.
- **`main.spec.ts:708-726`'s uncomment helper** —
  `line.replace(/^\t\/\/ /, '\t')` is the uncommenter R8's test reuses, and
  the reason R7 fixes the line format.
- **`main.ts:213-233`'s hoisted paths block** (66 R1, extended by 67 R3) — R11
  adds one constant inside it and removes a ternary; the write/check split
  keeps reading the same expressions.
- **`sandbox()` (`main.spec.ts:11-19`)** — every CLI test below drives `run()`
  through it.
- **`examples.spec.ts:28-56`** — the drift, AA and root-selector tests are
  R3's gate for both example sheets; no new test there.
- **`CodeBlock`'s `collapsible` / `collapsedLines`
  (`src/docs/data/code-block.ts:44-53`)** — R10 sets two props; it authors no
  component change.

### Test plan

Runner: **Vitest**, existing projects — `server` (node) for the engine, the
CLI and the template. No client tests and no new e2e: nothing here renders,
and the docs pages Stages 2 and 3 edit are covered by the existing route
sweep.

**Server — `src/lib/config/config.spec.ts` (Stage 1). New fixtures, not
extensions of existing ones**, for the reason in Context:

- The headline: `{ tokens: { palette: { primary: '#0f766e' } } }` in overrides
  mode emits `[data-theme='dark'] { --hz-palette-primary: #60a5fa; }`.
- R4's cross-check on the same fixture: every declaration in the overrides
  sheet's dark block appears verbatim in the full sheet's dark block, and the
  report's `dark` row for `intent-primary` resolves to the same `#60a5fa`.
- `{ tokens: { color: { surface: '#f8fafc' } } }` emits the dark surface. This
  is the regression that turns dark mode off, and it is the case that decided
  (a) over (b).
- `{ tokens: { color: { border: '#94a3b8' } } }` emits **no** dark block — the
  negative case that keeps R1 from becoming "emit the whole dark theme".
- An added hue (`fairway`) emits no dark block. **`config.spec.ts:295`'s
  existing `expect(css).not.toContain("[data-theme='dark']")` asserts today's
  behavior on a fixture that also overrides `primary`, so it must move to this
  add-only fixture rather than be deleted** — the assertion is still worth
  having, on a config where it is still true.
- R2: `{ themes: { dark: { radius: { md: '0' } } } }` emits
  `--hz-radius-md: 0` in the dark block; and a `themes.dark.density.unit`
  case that pins `mergeDefault` staying off and the restore block carrying the
  root unit.
- The scoped variant of the headline fixture: the counterpart lands in the
  compound + descendant pair, and the root block is unchanged from today's
  output for the same config.
- The existing `tokens.css` and `utilities.css` drift tests (`:24`, `:832`)
  stay green with no regeneration. That is the byte-identity gate for Stage 1.

**Server — `src/lib/theme/examples/examples.spec.ts` (Stage 1):** no new test.
The drift, AA, root-selector and fallback-parity cases must pass against the
regenerated `ocean.css` and `terminal.tokens.css` and against Terminal's
edited config. The AA case is the one to watch: it now grades Terminal's own
hues on `#000000` rather than the library's companions, so if any pairing
misses, the answer is Terminal's config, not the test.

**Server — `src/lib/cli/main.spec.ts` (Stage 2):**

- **Drift:** the committed `src/lib/cli/config-defaults.js` bytes equal
  `renderConfigDefaults()`.
- **R8's round-trip:** uncomment both constants, wrap, `resolveConfig`,
  `generateCss`, compare to `src/lib/tokens/tokens.css` read from disk.
  Byte-identical.
- **Top-level coverage:** every key in the exported `TOP_LEVEL_KEYS` list
  (extracted from `resolveConfig`'s inline array, `schema.ts:736-750`) appears
  in `CONFIG_TEMPLATE`. This is the anti-rot gate for the half R6 does not
  generate.
- The existing whole-template uncomment-and-resolve case (`:708-726`) still
  passes, unmodified.
- `hyzer init` writes a file that contains both constants' first lines — one
  cheap assertion that the splice happened.

**Server — `src/lib/cli/main.spec.ts` (Stage 3),** each through `sandbox()`:

- A config in `conf/` with no `output` and no `--out` → the sheet is at
  `conf/hyzer-tokens.css` and **not** at `<cwd>/hyzer-tokens.css`. Assert both
  halves; the second is the regression.
- The same run with `icons` set → `conf/icons.ts`.
- The same run with `utilities: true` → `conf/hyzer-utilities.css`.
- The same run with `--out out/tokens.css` → `<cwd>/out/tokens.css`, and
  nothing written under `conf/`.
- `output: 'styles/x.css'` with a subdirectory config → `conf/styles/x.css`
  (pins today's behavior through the new expression).
- No config at all → `<cwd>/hyzer-tokens.css` (unchanged).
- `--check` immediately after a subdirectory-config write → `all up to date`,
  exit 0.
- The existing cases at `:53-67`, `:248-257` and `:648-658` keep their
  assertions unchanged.

### Gate

The full gate from `AGENTS.md` at every stage boundary — a token or CLI change
here routinely breaks something that looks unrelated, and a stage that has not
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
`corepack pnpm gen:tokens` and never hand-edit a generated file. Before
committing Stage 1, run `git diff` over `src/lib/tokens/tokens.css`,
`src/lib/theme/utilities.css`, `src/lib/theme/examples/ocean.css` and
`src/lib/theme/examples/terminal/terminal.tokens.css` and confirm the change is
confined to R3's table: three lines in one dark block, five in the other, and
nothing at all in the first two files. Stage 2 additionally runs
`corepack pnpm --dir sv-addon build` once. Commit on this feature branch, never
to `main`, and do not push unless told.

### Non-goals

- **Option (b): making a root override apply in dark** (R1). Rejected on
  `tokens.color.surface` — a one-line override would silently disable dark
  mode, and narrowing it to the palette tier contradicts the two-tier rule.
  Not a key, not a flag, not an opt-in.
- **A dev warning, or a report note, for an override with no `themes.dark`
  counterpart.** After R1 that is correct behavior, and the warning would fire
  on nearly every config that touches a hue.
- **Making `contrastReport` mode-aware**, or grading two models per config.
  R1 removes the reason to: one resolved model, and both modes emit it.
- **Renaming `softTints`' internal `light` / `dark` keys** (68 R4 settled
  this) or touching `report.ts` at all beyond reading it in a test.
- **Changing full mode's emission.** It was right; overrides mode was
  incomplete.
- **Brightening Terminal's hues for dark, or authoring dark hues for Ocean**
  (R3). Terminal pins what it already paints; Ocean takes the library's
  companions, which is what its report already grades.
- **Enumerating the 41 component hooks in the template** (R8). They have no
  defaults, so they are not part of "1:1 with the default sheet"; the pair
  plus a link is the whole surface.
- **Generating the illustrative top-level keys**, or the theme-name examples.
  They are prose, they take editor passes, and they stay hand-written.
- **A marker-comment protocol** for the round-trip test. The doubly-commented
  trick (R9) makes one unnecessary.
- **Making `--out` config-relative** (R11). A flag describes the run and
  belongs to the shell.
- **A `configDir`-style key, or any second anchor.** One base, derived from
  whether a config was found.
- **Changing config auto-discovery** to walk up directories. It looks in the
  cwd, as it always has; `--config` is the answer for a config elsewhere.
- **A codemod or migration for Stage 3.** The fix is to run the command again
  or pass `--out`, and R13 says so.
- **Changes under `sv-addon/`** beyond confirming its bundle still builds. It
  consumes the template by import.
- **New dependencies, and any component (`.svelte` library file) change.**

### Write scope

**Stage 1:** `src/lib/config/generate.ts` (the `keepDark` predicate and the
fourth group); `src/lib/theme/examples/terminal/terminal.config.ts`;
`src/lib/theme/examples/ocean.css`,
`src/lib/theme/examples/terminal/terminal.tokens.css` (both regenerated);
`src/lib/config/config.spec.ts`;
`src/routes/docs/theming/tokens/+page.svelte`; `CHANGELOG.md`.

**Stage 2:** `scripts/gen-config-defaults.ts` (new),
`src/lib/cli/config-defaults.js` (new, generated), `scripts/gen-tokens.ts`,
`src/lib/cli/config-template.js`, `src/lib/config/schema.ts` (export
`TOKEN_GROUP_KEYS` and the top-level key list), `AGENTS.md`,
`src/routes/docs/foundation/config/+page.svelte`, `src/lib/cli/main.spec.ts`.

**Stage 3:** `src/lib/cli/main.ts` (the `base` constant, `outPath`,
`utilitiesPath`, `USAGE`), `src/lib/config/schema.ts` (the `output` JSDoc),
`src/lib/cli/config-template.js` (the `output` annotation, if not already made
in Stage 2), `src/routes/docs/foundation/config/+page.svelte` (the `--out`
row), `src/lib/cli/main.spec.ts`, `CHANGELOG.md`.

No new dependencies. No component changes. No new public API: two internal
exports from `schema.ts`, one new internal module, and one new generated file
inside the package. One behavior change to generated output (Stage 1) and one
to where the CLI writes (Stage 3), both in `CHANGELOG.md`.
