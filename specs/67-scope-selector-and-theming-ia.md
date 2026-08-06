# 67 — `selector` becomes a config key and a flag, and the Theming section gets a decision aid

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. **Builds on
> `specs/29-token-engine.md` (the config engine, the CLI and its report
> shapes), `specs/30-theming.md` / `specs/32` (the class-scoped example
> theme), `specs/44` (the utilities opt-in), `specs/52-theme-attachment.md`
> (`theme()` / `themeVars`), `specs/62-custom-intent-wiring.md` (the
> end-of-sheet zero-specificity rule section),
> `specs/65-themes-all-token-groups.md` (a theme is a token override;
> `tokens.components`; `contrast` / `strict` in the config) and
> `specs/66-check-detects-stale-output.md` (`--check` compares the artifacts on
> disk) and does not restate them.** Every design choice below is settled; the
> `Decided:` tails record the option that was rejected, so nobody relitigates
> it mid-build.

**65 and 66 are already implemented and committed** on `feat/config-token-coverage`
(`f9659694`, `ab949c15`, `16b061cc`). Every anchor in this document points at
that landed code, not at planned behavior — `main.ts` already hoists its paths
and owns a `checkArtifact()`, `generate.ts` already has `targetSelectors()` and
the component-hook section, and `schema.ts` already carries `contrast` and
`strict`. Read the current files, not the earlier specs' descriptions of them.

### Goal

Let a consumer generate a class-scoped token sheet with one command, and make
the Theming docs tell a reader which of the four things called "theme" they
actually want. Half 1 exposes a capability the engine has always had:
`GenerateOptions.selector` becomes `hyzer.config.ts`'s `selector` key and
`hyzer generate --selector`, validated, recorded in the generated header, and
understood by `--check`. Half 2 spends that on the docs problem it unblocks —
the class path is asserted in three places and taught in none, and no page says
"pick this one when…".

---

### Stage map

One feature branch, two commit boundaries. Stage 1 is the engine and CLI
change; Stage 2 is the docs pass it makes possible. Stage 2 depends on Stage 1
(it documents a flag that must exist), so the order is fixed. Each stage ends
with its own full gate run (see Gate).

| Stage | Requirements | What lands |
| --- | --- | --- |
| 1 | R1–R7 | `selector` as a config key and a flag; validation; `--check` understands it; Terminal dogfoods it |
| 2 | R8–R12 | The decision aid, the class path taught once, and one coherent pass over Config & CLI |

---

### Context & conventions

- **This exposes a capability; it does not build one.**
  `GenerateOptions.selector` (`generate.ts:33`) is fully implemented and
  exercised. `themeSelector()` (`generate.ts:302`) emits the compound +
  descendant pair when scoped; `scopedClosure()` (`generate.ts:520`) re-emits
  the derived Layer-2 chain a scoped sheet needs; `targetSelectors()`
  (`generate.ts:361`) serves both the custom-intent and component-hook sections
  scoped; `generateOverrides()` (`generate.ts:707-715`) already writes a
  different header for a scoped sheet. `scripts/gen-tokens.ts:36-40` uses the
  option today to produce `terminal.tokens.css` under `.hz-theme-terminal`. The
  whole gap is reachability: `parseCliArgs` parses seven options
  (`main.ts:367-375`) and there is no config key, so a consumer who wants a
  class-scoped sheet has to write their own build script — and no docs page
  shows one.
- **Byte-drift is a hard requirement, not a preference.** `tokens.css`,
  `utilities.css`, `ocean.css` and `terminal.tokens.css` are compared to
  generator output byte-for-byte (`config.spec.ts:24`, `config.spec.ts:832`,
  `examples.spec.ts:29`). Exactly one committed sheet changes in this spec —
  `terminal.tokens.css` gains the one header line R4 requires — and it is
  regenerated, never hand-edited. Every other sheet is byte-identical, and a
  config that sets no `selector` emits zero extra bytes.
- **The value is interpolated straight into emitted CSS.** `${selector} {`,
  `${selector}[data-theme='dark']`, `:where(${selector} .hz-button)`. Nothing
  parses it, nothing escapes it. That is why R2 exists and why it is the only
  genuinely new risk in Half 1: today a malformed value produces a broken sheet
  rather than an error, and the sheet is committed, so the break ships.
- **A scoped sheet has no `prefers-color-scheme` block.** `generateFull()`
  emits the system-default block only at `:root` (`generate.ts:633`), because
  the block's own selector is `:root:not([data-theme])` and it would be a lie
  under a class. Existing behavior, unchanged here, documented in R9.
- **Docs are consumer-facing.** No spec numbers, no `Rn`, no test-gate or
  process language in anything a reader sees. Every copy change gets an
  editor-agent pass before commit (Stage 2).

---

## Stage 1 — `selector` becomes a config key and a flag

**R1 — One key, one option, one fallback.** `HyzerConfig` gains a top-level
`selector?: string` beside `output` (`schema.ts:103`), and `ResolvedConfig`
gains `selector?: string` beside its own `output` (`schema.ts:257`), carried
through verbatim in the resolved object (`schema.ts:854`) — no defaulting to
`':root'` in the schema, so "unset" stays distinguishable from "explicitly
`:root`". `'selector'` joins the top-level `assertKnownKeys` list
(`schema.ts:671`).

The engine resolves it in exactly one place. `generateCss` (`generate.ts:574`)
becomes:

```ts
const selector = options.selector ?? resolved.selector ?? ':root';
```

That is the whole precedence rule for every non-CLI caller: an explicit option
wins, the config key is the fallback, `:root` is the default. `scripts/gen-tokens.ts`
and any consumer build script then honor the key for free.

JSDoc on the key says what it is for in one sentence — scope the whole sheet
under a class so a region can carry its own palette and still follow the page
between light and dark — and points at the docs page, matching how `utilities`
and `contrast` document themselves.

*Decided:* top-level, named `selector`. Not `tokens.selector` (it is not a
token group, and under `tokens` a theme could override it, which means
nothing), and not a new name like `scope` — the engine's public option has been
`selector` since specs/30, and inventing a second name for one thing is the
exact failure Half 2 is fixing.

**R2 — One validated shape, one shared assert, three call sites.** Add
`assertSelector(value: unknown, where: string): void` to `schema.ts` beside
`THEME_NAME` (`schema.ts:531`), which is the precedent: a value that becomes
part of a selector string is held to an identifier-safe shape rather than
trusted.

Accepted, and nothing else:

| Form | Example |
| --- | --- |
| the literal `:root` | `':root'` |
| one class | `'.theme-ocean'`, `'.themeOcean'` |
| one id | `'#app'` |

Shape: `/^(:root|[.#][A-Za-z_][A-Za-z0-9_-]*)$/`. Anything else — a non-string,
an empty string, a combinator (`.a .b`, `.a > .b`), a comma list, a compound
(`.a.b`), an attribute selector, `*`, or any value containing `{`, `}`, `@`,
`;`, `/` or a newline — throws `HyzerConfigError` naming the key and the three
accepted forms:

```
config.selector must be ':root', a class ('.theme-ocean') or an id ('#app') —
one simple selector, with no combinators, commas or attribute selectors.
```

Called from three places, one rule:

1. `resolveConfig`, on `config.selector`, beside the `config.output` string
   check (`schema.ts:677`), with `where = 'config.selector'`. The CLI's existing
   `try`/`catch` around `resolveConfig` (`main.ts:177-183`) then renders it as
   `Invalid config: …` like every other config error, for free.
2. `generateCss`, on the resolved value, before it is interpolated. This is the
   backstop for direct engine callers (`gen-tokens.ts`, the docs pages, a
   consumer build script) — the only path that has ever existed until now, and
   the one that gets no other guard.
3. The CLI, on `parsed.selector`, immediately after the `--mode` check
   (`main.ts:128-131`) and in exactly that shape: `error(...)`, `return 1`, no
   `USAGE` dump. The message names the flag rather than a config path
   (`--selector must be ":root", a class …, got "…"`), because that is what the
   user typed.

*Decided:* an allow-list of three simple forms, not "reject the dangerous
characters and pass the rest through". A deny-list has to be right about every
CSS construct that survives compounding (`${sel}[data-theme='dark']`) *and*
descendant use (`:where(${sel} .hz-button)`), and the two disagree — `.a, .b`
compounds into a wrong grouping while reading as valid CSS, which is the silent
failure this requirement exists to prevent. Attribute selectors are excluded
not because they are unsafe but because validating their quoting properly is
real work for a case a class already covers; a consumer who needs one still has
`generateCss` directly, as they always did.

*Decided:* the CLI validates the flag itself rather than letting `generateCss`
throw. `generateCss` is called in four places in `run()`, in both branches; a
throw from any of them would surface as an unhandled stack trace, and wrapping
all four is a bigger diff than the four-line check the file already has for
`--mode`.

**R3 — The flag, and precedence.** `parseCliArgs` (`main.ts:367-375`) gains
`selector: { type: 'string' }`. The effective value is computed once, hoisted
beside `mode` and `outPath` in the paths block (`main.ts:197`) so the write
branch, the check branch and the summary line all read the same constant —
66 R1's rule, applied to the one new thing that both branches need:

```ts
const selector = parsed.selector ?? resolved.selector ?? ':root';
```

and both `generateCss` calls (`main.ts:219`, `:244`) pass `{ mode, selector }`.
This chain and R1's chain are the same expression; passing the already-resolved
value through the option makes the engine's own fallback a no-op for the CLI,
which is what keeps them from drifting.

The flag wins over the config key, silently, with no warning and no `--no-…`
form — the `--out` / `output` precedent (`main.ts:198-202`), stated once in the
docs (R10) and nowhere enforced twice.

**R4 — The generated header records the scope.** When and only when the
resolved selector is not `':root'`, both headers carry one line naming it,
immediately after the identity line (`generate.ts:98` for full mode,
`generate.ts:704` for overrides):

```
/**
 * @hyzer-labs/ui token overrides
 * Scope: .hz-theme-terminal
 *
 * …
```

Fixed prefix, exactly `' * Scope: '` + the selector, one line, no wrapping. An
unscoped sheet gains nothing, so `tokens.css`, `ocean.css` and `utilities.css`
stay byte-identical; `terminal.tokens.css` gains this one line and is
regenerated (R7).

Two things this buys, in order of importance: `--check` can name both sides of
a scope mismatch (R5), and a human opening a generated sheet can see what it is
scoped to. Terminal's `intro` already says so in prose
(`terminal.config.ts:13-15`) — that sentence stays; it is written for a reader,
this line is written for the checker, and the redundancy costs one line in one
example.

*Decided:* record it, rather than accept a whole-file diff. Without a record,
a consumer whose sheet is scoped and whose CI check omits the flag is told
`is out of date; run "hyzer generate" to update` — and running that command
replaces their scoped sheet with a `:root` one that dumps their theme onto the
whole app. A message of ours that destroys the artifact when followed is worse
than the bug 66 fixed. 66 reached the same conclusion for `--mode`
(`main.ts:326-330`): detect and explain.

*Decided:* a header line, not inference from the sheet's first rule.
`examples.spec.ts:55` shows the heuristic works (`^<selector>\s*[,{]`), and it
would have cost zero bytes — but it cannot name the selector the file was
actually generated for, it needs a guard for the overrides sheet that emits no
root rule at all (a config that only sets `themes.x`), and it is inference
where a record costs one line. The one-line diff in one example sheet is the
price, and the drift test is the gate on it.

**R5 — `--check` reports a scope mismatch by name, and the fix hint repeats
this run's flags.** Two changes in `main.ts`, both alongside the mode handling
that already exists.

1. **Detection.** Beside `detectMode()` (`main.ts:326`), add
   `detectScope(content): string` — `/^ \* Scope: (\S+)/m`, defaulting to
   `':root'` when the line is absent, because absent is exactly what an
   unscoped sheet writes. `checkArtifact()` (`main.ts:343`) takes the expected
   scope alongside the mode, for the tokens sheet only, and checks it right
   after the mode check and before the byte comparison:

   ```
     ✗ <path> was generated for .theme-ocean; this run checked :root
   ```

   It counts as a finding, exactly as the mode line does. Order matters: mode
   first (a mode mismatch changes more of the sheet), then scope, then bytes.
2. **The summary hint.** `main.ts:264-267` builds
   `run "hyzer generate<modeSuffix>" to update`. The rule becomes: **the hint
   repeats the flags of this run that decide what the file contains.** `--mode`
   when it is not `full` (unchanged, and flag-only, so "not full" and "the flag
   was given" are the same thing); `--selector <value>` when the flag was given
   — not when the config key supplied it, because then `hyzer generate` alone
   already produces the scoped sheet and a redundant flag in the hint teaches
   the wrong habit. `--out` stays out: it decides *where*, not *what*, and 66
   settled that a path mismatch surfaces as the absent-file note naming the
   path.

The mismatch is only reachable through the flag. A `selector` in the config is
read by the check run too, so the recommended setup can never produce this
finding — worth one sentence in the docs (R9) because it is the reason to
prefer the key.

*Decided:* the message names both sides and stops. No `--fix`, no
auto-regeneration, no guess about which side is wrong — 66's non-goals, still
non-goals.

**R6 — A scoped run does not scope the utilities sheet.** `generateUtilitiesCss`
(`generate.ts`) takes no selector and gains none. `hyzer generate --selector
.theme-ocean --utilities` writes the same `hyzer-utilities.css` it always
wrote, and `--check` compares it against the same unscoped output.

The reason, which belongs in the docs (R9) as much as here: a utility class is
applied deliberately, at 0,0,0, and its value comes from a `var()` lookup —
so `.hz-text-danger` used *inside* a scoped region already paints from that
region's tokens with no scoping of the utility itself. Scoping the classes
would mean the same class silently stops working everywhere else on the page,
which is a worse outcome than the one it prevents.

**R7 — Terminal dogfoods the key; `gen-tokens.ts` drops the option.**
`terminal.config.ts` (`:40`) gains `selector: '.hz-theme-terminal'` as its
first key, above `tokens`, with a short comment saying what it does.
`scripts/gen-tokens.ts:36-40` drops its hardcoded `selector` option, leaving
`{ mode: 'overrides', intro: terminalIntro }`. R1's fallback makes the emitted
CSS identical either way, so the dogfooding is byte-neutral on its own; the
only diff in `terminal.tokens.css` is R4's `Scope:` line.

`examples.spec.ts:31`'s drift test drops `selector` from its `generateCss` call
for both examples, so the test now proves the config key drives the output end
to end. The `selector` field on the example table (`:13`, `:19`) stays — the
third test (`:45-57`) reads it to assert what the committed sheet roots at, and
that assertion is worth more now, not less.

Regenerate with `corepack pnpm gen:tokens`; never hand-edit the sheet. The
permitted diff in `terminal.tokens.css` is one added line and nothing else, and
`tokens.css`, `ocean.css` and `utilities.css` must come back byte-identical.

Why do it: the Terminal config is displayed verbatim on the Example themes page
(`examples/+page.svelte:107`, via `consumerSource`), so the shipped example
that uses class scoping starts *showing* how it is turned on. That is a direct
answer to the Half 2 complaint that the class path is asserted and never
taught, for the cost of one line in a config.

---

## Stage 2 — the Theming section's IA

The report, in a reader's words: `theme('dark')` vs `data-theme="dark"` vs
`class="theme-ocean"` feels like two or three ways to do the same thing, and it
is not clear when to pick which — and the class path is hardly explained.

Three things are true and worth fixing in this order:

1. **No decision aid exists anywhere.** Four things are named "theme":
   `theme()` the attachment, `themes` the config map, `data-theme` the
   attribute, `.theme-ocean` a class. Nothing on any page says "pick this one
   when…".
2. **The class path is asserted three times and taught none.** The `classCode`
   sample on Section themes (`sections/+page.svelte:73-81`) is a bare
   `generateCss(...)` line; the `why-class` FAQ on Example themes
   (`examples/+page.svelte:430-439`) explains why *Terminal* does it; Config &
   CLI mentions "build scripts of your own" in one clause
   (`config/+page.svelte:250`).
3. **Class scoping is filed by topic, not by decision.** It sits on Section
   themes because it is about sections, but it is a build-output concern:
   which sheet gets written, under what selector.

The complaint is clarity, not wrongness, so the posture is conservative:
**one new decision aid, one new section that teaches the class path once, and
cross-links everywhere else. Nothing is relocated.** Consumer framing
throughout, then an editor-agent pass on every copy change before commit.

**R8 — The decision aid goes in "Where to override what" on Theming Overview.**
`src/routes/docs/theming/overview/+page.svelte:179-230` already is a Goal →
Mechanism table, it is the first page of the Theming section, and it is the
only place in the docs where all the levels — whole app, region, one component,
start from scratch — already sit side by side. Adding the missing rows there is
completing an existing aid rather than authoring a fifth explanation of the
same four things.

The single row `Dark mode, or any named theme` (`:196-204`) becomes four:

| Goal | Mechanism (what to use, then why) |
| --- | --- |
| The whole app to look different | Override `--hz-*` tokens — `tokens` in a config, or plain CSS. Nothing goes on an element; the page is the scope. |
| A region, or the whole page, to carry a look you named at build time | Define it under `themes`, then set `data-theme="<name>"`. `theme('<name>')` writes that attribute and nothing else, so use whichever suits the markup. Dark is one such name. The attribute works on any element. |
| A look that comes from data — a per-tenant accent, a color a reader picked | `theme(object)`. It resolves in the browser and writes inline custom properties, so no build-time entry is needed. It is not contrast-graded. |
| A region that needs its own palette **and** must still follow the page between light and dark | Generate a second sheet scoped to a class and put the class on the region. `data-theme` is then still free to carry light or dark. A `themes` entry cannot do both — one attribute holds one value. |

Each row links to the page that covers it: Tokens & Overrides, Section themes,
Section themes, and R9's new section on Config & CLI. Keep the rows that are
already there (`Restyle one component`, `A different look entirely`,
`Verify a palette still meets WCAG`) untouched.

*Decided:* two columns, with the reason as the closing clause of the Mechanism
cell — not a third "Why" column. A third column forces rewriting every existing
row and widens a table that already needs `overflow-x` on a phone
(`overview/+page.svelte:257`).

*Decided:* Overview, not a new box at the top of Section themes. Section themes
covers three of the four rows and cannot host the fourth without becoming the
tokens page too; and a reader who lands mid-section is served by a link, which
R11 adds.

**R9 — Config & CLI teaches the class path end to end, in one new section.**
`src/routes/docs/foundation/config/+page.svelte` gains a section — heading id
`scope-heading`, placed after "Generate the utilities sheet" and before "Full
config reference" — titled to name the outcome rather than the flag (for
example, "Scope the sheet to a class"). It must show, in this order:

1. **The one command**, in a `bash` block:
   `hyzer generate --mode overrides --selector .theme-ocean --out src/styles/ocean.css`,
   and immediately after it the config-key equivalent (`selector: '.theme-ocean'`
   in `hyzer.config.ts`, then plain `hyzer generate`), with one sentence that
   the flag wins when both are set.
2. **The markup that activates it**: the class on a wrapper, and a
   `data-theme="dark"` element inside it still working. That composition is the
   reason to choose this over a `themes` entry, so it is shown, not described.
3. **What the generator does for you**: a scoped sheet re-declares the tokens
   that derive from the ones you changed, because a `var()` chain declared at
   `:root` has already resolved there. One short paragraph; no closure
   vocabulary.
4. **The accepted shapes** — `:root`, a class, or an id; one simple selector,
   no combinators or commas — and that anything else is a config error naming
   the key.
5. **Utilities are not scoped** (R6), with the reason: a utility reads its value
   through `var()`, so it already paints from the region's tokens when used
   inside it, and scoping the class itself would break it everywhere else.
6. **Import order**: an overrides sheet is imported after `tokens.css`, as the
   modes section already says; a scoped sheet is no different.
7. **`--check` and the scope**: the sheet records what it was scoped to, so a
   check run that disagrees says so by name instead of reporting the whole file
   as changed — and setting `selector` in the config rather than passing the
   flag means a check run can never disagree.
8. **A full-mode scoped sheet has no automatic system-preference block.** One
   sentence: `prefers-color-scheme` is only wired at `:root`, so a scoped
   region follows light and dark through `data-theme` (on the region or on
   `<html>`), which is the mechanism the section is about anyway.
9. **A link back to Section themes** for *when* to reach for this, with the
   Alert there ("Most projects never need this") as the honest framing.

*Decided:* Config & CLI, not Section themes and not Example themes. What gets
generated, under what selector, with which flags, is this page's subject —
Section themes owns the decision, Example themes' FAQ owns "why Terminal is
built this way", and neither should grow a CLI tutorial. This is also the only
page where the reader already has the config file open.

**R10 — One coherent pass over the flag table and the doctrine paragraph.**
Same file, same commit; `specs/65 R22` and `specs/66 R6` have each edited this
paragraph once already, and this is the third time. Do not patch it a fourth
way — restate it so the next flag does not force a rewrite.

- **`cliFlags` (`:31-63`) gains a `--selector <selector>` row**, config key
  `selector`, note: where the generated sheet is rooted; defaults to `:root`;
  a class or an id scopes the whole sheet to that element and everything inside
  it; the flag wins over the config key. Keep the note in the same register as
  the `--out` row, which is its precedent.
- **The doctrine paragraph (`:262-269`) loses its counts.** Today it says "Four
  flags stay flag-only … Three flags also have a config key", and both numbers
  are now wrong. Restate it principle-first: a flag that describes a single run
  (`--config`, `--mode`, `--check`, `--help`) has no config key; everything that
  describes the design system lives in the config; and the flags that have both
  (`--out`, `--utilities`, `--strict`, `--selector`) exist so one run can
  override the file, with the flag winning. Naming the members and dropping the
  arithmetic is the point: the table below already carries the mapping, so the
  paragraph should never again need editing for a count.
- **`modesCode` (`:110-126`) gains one line**, the scoped invocation, with a
  comment naming the outcome ("a sheet scoped to a class, for a region with its
  own palette").
- The "build scripts of your own" clause in the TypeScript Alert (`:250`) keeps
  its point about importing the engine, but stops implying that a class-scoped
  sheet needs one — it does not, and R9's section is where that reader goes.

**R11 — Section themes and Example themes get links and one corrected sample.
Nothing moves.**

`src/routes/docs/theming/sections/+page.svelte`:

- **`classCode` (`:73-81`) is now wrong about the workflow.** It opens with a
  bare `generateCss(resolveConfig(oceanConfig), { selector: '.theme-ocean' })`,
  which was the only way to do this and no longer is. Replace that line with
  the command (`hyzer generate --mode overrides --selector .theme-ocean`),
  keeping the two comment lines about composing with dark and keeping the
  markup below it exactly as it is — the sample's job is to show the class
  wrapping a `data-theme` section, and that job does not change.
- **The sentence "The other way is to generate the sheet under a class of your
  own instead of `:root`" (`:220-224`)** links to R9's new section for the how,
  in the same sentence. This is the specific fix that triggered this spec: the
  page asserts the mechanism and has nowhere to send the reader.
- **One pointer near the top of the page** (in or just after the first section)
  to Overview's "Where to override what", framed as picking between the three
  mechanisms this page shows. One sentence, one link, no summary of the table —
  a second copy of the decision aid is the failure mode.
- The "When to use a class instead" Alert, the trade-off paragraph at `:246-250`
  and the demo bands stay exactly as they are. They are correct and they are
  the *decision*, which stays on this page.

`src/routes/docs/theming/examples/+page.svelte`:

- **The `why-class` FAQ panel (`:430-439`)** says the engine generates the token
  block "with the `selector` option instead of `:root`". That is now the config
  key and the flag, so name them and link to R9's section, in the existing
  paragraph. One sentence changed, no new panel.
- With R7 landed, Terminal's `hyzer.config` tab shows `selector` at the top of
  the file. Nothing to author for that, but do not let the FAQ contradict it.

**R12 — The surfaces that are not pages.** All in the same Stage 2 commit.

- **`src/lib/cli/main.ts`.** `USAGE` (`:48-77`) gains a `--selector <selector>`
  entry between `--mode` and `--utilities`, in the file's existing register:
  what it roots the sheet at, the default, that a class or id scopes the sheet
  to that element, and `Config key: selector` with the flag winning. The module
  JSDoc's usage line (`:8-9`) gains `[--selector <selector>]`, and the
  paragraph below it gains one clause (`:11-18`).
- **`src/lib/cli/config-template.js`.** A `// selector: '.theme-ocean',` line
  directly under the `output` line (`:20`), with a comment naming what it does
  in the template's clipped style ("root the sheet at a class instead of :root,
  so a region can carry its own palette"). The template is `hyzer init`, the
  Config page's "Full config reference" and the `@hyzer-labs/sv` add-on, so
  this is one edit for three surfaces, and `main.spec.ts`'s existing
  uncomment-and-resolve test (specs/65 R22) becomes the gate that the new line
  is valid as written. No change under `sv-addon/` — it consumes the template by
  import.
- **`src/docs/agentRules.ts`**, "Apply named themes with data-theme"
  (`:52-67`). The body gains one clause, not a new rule: when a region needs its
  own palette and must still follow light and dark, generate a second sheet with
  `selector` and put that class on the region, because one `data-theme` value
  cannot carry both. The sample stays as it is. This file drives both
  `/docs/agents` and the served `agents.md`, so it is one edit for two surfaces.

---

### Edge cases

| Case | Expected |
| --- | --- |
| No `selector` anywhere, after Stage 1 | `tokens.css`, `ocean.css`, `utilities.css` byte-identical; no `Scope:` line; no behavior change at all. |
| `selector: ':root'` set explicitly | Identical bytes to omitting it. No `Scope:` line, no mismatch finding, no error. |
| `--selector .a` with `selector: '.b'` in the config | The flag wins, silently. The sheet is rooted at `.a`. |
| `selector` in the config, no flag | The sheet is rooted at it, through `generateCss`'s own fallback — so `gen-tokens.ts` and any consumer build script get it too. |
| `config.selector: '.a .b'` / `'.a, .b'` / `'.a.b'` / `"[data-x='y']"` / `'*'` / `'.a{'` / a value with a newline or `@` | `HyzerConfigError` naming `config.selector` and the three accepted forms; the CLI renders it as `Invalid config: …` and exits 1. |
| `config.selector: 5` or `''` | Same error. |
| `--selector '.a, .b'` | Exit 1 with the flag-shaped message, no `USAGE` dump — the `--mode` precedent. |
| `--selector '#app'` | Accepted; the sheet roots at `#app`. |
| Scoped run, `--utilities` | The utilities sheet is written unscoped, at the usual path, byte-identical to an unscoped run's. |
| Scoped run, full mode | Every token declared under the class; no `@media (prefers-color-scheme: dark)` block (existing behavior); dark inside the scope needs `data-theme`. |
| Scoped run, overrides mode | Unchanged from today: the derived Layer-2 chain re-emitted, the compound + descendant pair per theme block. |
| `--check` with the same selector the sheet was generated with | Up to date; nothing new reported. |
| `--check` on a scoped sheet with no `--selector` and no config key | `✗ … was generated for .theme-ocean; this run checked :root`; a finding; exit 1 under strict. Not the byte-diff wording. |
| `--check --selector .theme-ocean` on an unscoped sheet | The same line, reversed; a finding. |
| `selector` in the config, `--check` with no flag | Never a scope finding — the check run reads the same key. |
| Sheet drifted *and* scoped differently | The scope line only. Mode first, then scope, then bytes; one finding per file. |
| A scoped sheet generated before this spec (no `Scope:` line), checked with `--selector .x` | Reported as generated for `:root`. The finding is right (the header genuinely changed), the attribution is approximate, and one regenerate fixes both. |
| `--selector` on a run that also fails contrast | Unchanged: both are reported, and strict exits 1 for either. |
| Absent sheet under `--check --selector .x` | Still the `?` note, still not a finding, still exit 0 under strict (66 R3). |
| `terminal.tokens.css` after Stage 1 | Exactly one added line, the `Scope:` header; regenerated, not hand-edited; drift, AA and fallback-parity tests green. |
| The uncommented config template | Resolves without throwing, including the new `selector` line. |

### Existing code to reuse

- **`THEME_NAME` (`schema.ts:531`) and its comment** — the precedent for
  validating a value because it becomes part of a selector string. R2's assert
  is its sibling, in the same file, with the same reasoning.
- **`assertKnownKeys()` (`schema.ts:235`) and the `config.output` string check
  (`schema.ts:677`)** — where R1's key is validated and how.
- **`main.ts:198-202`'s `--out` precedence** — R3's exact shape, and the only
  precedence rule this spec is allowed to have.
- **`main.ts:128-131`'s `--mode` validation** — R2's CLI check, verbatim in
  shape: message, `return 1`, no usage dump.
- **`detectMode()` / `checkArtifact()` (`main.ts:326`, `:343`) and the
  `ArtifactCheck` union** — R5 adds one detector and one branch; it does not
  restructure the check.
- **`themeSelector()` / `targetSelectors()` (`generate.ts:302`, `:361`) and
  `scopedClosure()` (`generate.ts:520`)** — every scoped-emission behavior this
  spec exposes already lives here. No new emission code.
- **`withIntro()` (`generate.ts:581`)** — R4's line goes in the stock header,
  after the identity line; intro weaving inserts above it and is unaffected.
- **`sandbox()` (`main.spec.ts:11`)** — every CLI test below drives `run()`
  through it.
- **`examples.spec.ts:28-57`** — the drift and root-selector tests are R7's
  gate; the drift call loses an argument, the file gains no test.
- **`scripts/gen-tokens.ts` / `corepack pnpm gen:tokens`** — the only way
  `terminal.tokens.css` changes.

### Test plan

Runner: **Vitest**, existing projects — `server` (node) for the engine and the
CLI. No client tests and no new e2e: nothing here renders. The docs pages
Stage 2 edits are covered by the existing route sweep.

**Server — `src/lib/config/config.spec.ts` (Stage 1):**

- `resolveConfig({ selector: '.theme-ocean' })` carries the value through;
  omitting it leaves `selector` undefined.
- `generateCss(resolveConfig({ selector: '.theme-ocean' }))` roots the sheet at
  the class with no option passed — the config key alone drives emission.
- An explicit `{ selector: '#app' }` option beats the config key.
- `{ selector: ':root' }` in the config produces bytes identical to no key at
  all (including no `Scope:` line).
- Validation: one case per rejected shape (combinator, comma list, compound,
  attribute selector, `*`, brace, newline, non-string, empty), each a
  `HyzerConfigError` whose message names `config.selector`; and the three
  accepted forms resolve. Assert the same error comes out of `generateCss` when
  the bad value arrives as an option rather than a key.
- The header: a scoped sheet contains `* Scope: .theme-ocean` in both modes; an
  unscoped one contains no `Scope:` line.
- The existing `tokens.css`, `ocean.css` and `utilities.css` drift tests stay
  green with no regeneration.

**Server — `src/lib/theme/examples/examples.spec.ts` (Stage 1):** the drift
test now calls `generateCss(resolveConfig(config), { mode: 'overrides', intro })`
with no `selector`, and passes for both examples against the regenerated
`terminal.tokens.css`. The root-selector test is unchanged and must stay green.

**Server — `src/lib/cli/main.spec.ts` (Stage 1),** each case through
`sandbox()`:

- `--selector .theme-ocean` writes a sheet rooted at the class; the file
  contains the `Scope:` line.
- `selector: '.theme-ocean'` in the config, no flag → same output.
- Both set → the flag's value is what lands.
- An invalid `--selector` → exit 1, the message names the flag, and the output
  contains no usage dump.
- An invalid `config.selector` → exit 1 with `Invalid config:`.
- `--check` on a sheet generated with the same selector → `all up to date`,
  exit 0.
- `--check` on a scoped sheet with no selector → the `was generated for …`
  line, one finding, exit 0; the same run with `--strict` → exit 1; the file on
  disk is byte-identical afterwards.
- `--check --selector .x` on an unscoped sheet → the same line, reversed.
- The fix hint: with `--selector` given, the summary names
  `hyzer generate --selector .x`; with the value coming from the config key,
  it names `hyzer generate` with no `--selector`; with `--mode overrides` too,
  both flags appear.
- `--selector .x --utilities` → the utilities sheet is byte-identical to the
  unscoped run's, and `--check` reports it up to date.
- The existing `--check` cases (`main.spec.ts:104`, and the specs/66 describe)
  keep their assertions.
- The `CONFIG_TEMPLATE` uncomment-and-resolve case still passes with the new
  `selector` line.

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

`pnpm` is not on `PATH`; `corepack pnpm …` throughout. Stage 1 regenerates with
`corepack pnpm gen:tokens` — never hand-edit `terminal.tokens.css`. Commit on
the feature branch, never to `main`, and do not push unless told.

### Non-goals

- **Scoping the utilities sheet** (R6). The class would stop working outside the
  region, which is a worse failure than the one it prevents.
- **Arbitrary CSS selectors** (R2): combinators, comma lists, compounds,
  attribute selectors, `*`. Note what this costs, because R2 puts the assert
  inside `generateCss` on the *resolved* value: the direct-engine escape hatch
  closes too. A build script passing `.a, .b` today starts throwing. That is
  the intended trade — an unvalidated selector reaches emitted CSS and breaks
  the sheet silently — but it is a behavior change for existing direct callers,
  not a no-op for them.
- **A `--scope` alias, or renaming the engine option.** One name for one thing
  is the whole point of Half 2.
- **A per-theme selector map** (one sheet, several scopes). One run writes one
  sheet with one scope; two scopes is two runs, which is already possible.
- **Making a `themes` entry compose with `data-theme='dark'`.** One attribute
  holds one value; the scoped sheet *is* the answer, and R8 says so in one row.
- **`--check` fixing, regenerating or diffing anything** (66's non-goals,
  unchanged). R5 adds one message, not a repair path.
- **A `mode` config key.** Still settled by `specs/65 R22`; `--selector`
  having a key does not reopen it, because a selector describes the artifact and
  a mode describes the run.
- **Relocating any docs section.** Half 2 adds one aid, one section and a
  handful of links. Section themes keeps the decision, Example themes keeps its
  FAQ, and nothing is cut.
- **A second copy of the decision aid** anywhere. Pages link to it; they do not
  summarize it.
- **Per-flag config keys for `--config`, `--mode`, `--check`, `--help`** (R10's
  restated doctrine).
- **Changing Terminal's hand-written component sheets or its `intro`** (R7).
  Only the config gains a key and the generated sheet gains a header line.

### Write scope

**Stage 1:** `src/lib/config/schema.ts` (the key, `ResolvedConfig`,
`assertSelector`), `src/lib/config/generate.ts` (the fallback, the `Scope:`
header line), `src/lib/cli/main.ts` (the flag, its validation, the hoisted
value, `detectScope`, `checkArtifact`, the fix hint),
`src/lib/theme/examples/terminal/terminal.config.ts`,
`src/lib/theme/examples/terminal/terminal.tokens.css` (regenerated),
`scripts/gen-tokens.ts`, `src/lib/config/config.spec.ts`,
`src/lib/theme/examples/examples.spec.ts`, `src/lib/cli/main.spec.ts`.

**Stage 2:** `src/routes/docs/theming/overview/+page.svelte`,
`src/routes/docs/foundation/config/+page.svelte`,
`src/routes/docs/theming/sections/+page.svelte`,
`src/routes/docs/theming/examples/+page.svelte`,
`src/lib/cli/main.ts` (`USAGE`, module JSDoc),
`src/lib/cli/config-template.js`, `src/docs/agentRules.ts`.

No new dependencies. No component (`.svelte` library file) changes. No changes
under `sv-addon/`. New public API: one config key (`selector`), one field on
`ResolvedConfig`, one CLI flag. `GenerateOptions.selector` is unchanged.
