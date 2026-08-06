# 66 — `--check` detects stale output

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. **Builds on
> `specs/29-token-engine.md` (the CLI and its report shapes), `specs/36`
> (the icons barrel), `specs/44` (the utilities opt-in) and
> `specs/65-themes-all-token-groups.md` Stage 4 (the `strict` config key and
> its precedence) and does not restate them.** Lands on
> `feat/config-token-coverage`, alongside 65's stages — not on a branch of its
> own. One bug, one fix, one commit boundary.

### Goal

Make `hyzer generate --check` verify the artifacts it is checking. Today it
validates the config and grades contrast but never looks at disk, so a
consumer's CI job goes green while their committed `tokens.css` is arbitrarily
far behind their `hyzer.config.ts`. After this spec, `--check` compares what is
on disk against what the run would have written, reports every file that has
drifted or was never generated, and — under `strict` — fails the build.

### Context & conventions

- **The bug, in three anchors.** `src/lib/cli/main.ts`: `if (!parsed.check)` at
  `:176` gates the whole write branch; the output path (`:177-181`), the
  `icons.ts` path (`:193`) and the utilities path (`:202-207`) are all computed
  *inside* it, so under `--check` the CLI does not even work out where the
  artifacts live; and the exit code at `:244` is
  `parsed.strict && (failures.length > 0 || iconsFailed) ? 1 : 0` — staleness is
  not a dimension it has.
- **This library does not have the bug internally.** `AGENTS.md`'s drift tests
  compare committed bytes to generator output (`config.spec.ts:22`,
  `examples.spec.ts:29`) — exactly the missing check, written by hand for this
  repo. Consumers have no equivalent, and the docs imply they do: the Config
  page sells `--check` as "Resolve and report without writing any files… Pairs
  with `--strict` for a CI check that touches nothing", which a reader takes as
  artifact coverage.
- **Everything needed is already computed.** `generateCss(resolved, { mode })`,
  `generateUtilitiesCss(resolved)` and `iconsResult.module` are the exact
  strings the write branch passes to `writeFileSync`. The check compares those
  same values; it never re-derives anything.
- **Report shapes are established** and this spec adds no new vocabulary:
  `log('wrote <path> …')`, `log('contrast: N pairings checked, all pass WCAG
  AA')`, `error('contrast: N of M pairings fail WCAG AA<suffix>')`, per-item
  `  ✗ ` / `  ? ` prefixes, and the shared
  `' (warnings; use --strict to fail the build)'` suffix (`main.ts:224`,
  `:236`).

---

### Requirements

**R1 — Hoist the three path computations; keep every write inside the write
branch.** The output path, the `icons.ts` path and the utilities path move
above `if (!parsed.check)`, together with `mode` (already hoisted at `:175`)
and `utilitiesEnabled` (`:200`). Both branches then read the same constants,
which is what makes "the path we would have written" and "the path we check"
provably the same expression rather than two copies that drift:

```
const outPath = …;                     // --out > resolved.output (relative to
                                       // the config dir) > DEFAULT_OUTPUT
const iconsPath = join(dirname(outPath), 'icons.ts');
const utilitiesEnabled = parsed.utilities === true || resolved.utilities.enabled;
const utilitiesPath = …;               // resolved.utilities.output, else
                                       // DEFAULT_UTILITIES_OUTPUT beside outPath
if (!parsed.check) { /* mkdirSync + writeFileSync + the three `wrote` lines */ }
else { /* R2–R4 */ }
```

`mkdirSync` stays inside the write branch. The resolution logic itself does not
change — the same `--out` > `resolved.output` > default precedence, and the
same "relative to the config file, not the cwd" rule, both already covered by
`main.spec.ts`.

**R2 — What is checked, and when.** Exactly the files this run would have
written, never more:

| Artifact | Checked when | Compared against |
| --- | --- | --- |
| Tokens sheet (`outPath`) | always | `generateCss(resolved, { mode })` |
| `icons.ts` (`iconsPath`) | `iconsResult` is truthy — i.e. `config.icons` is present | `iconsResult.module` |
| Utilities sheet (`utilitiesPath`) | `utilitiesEnabled` | `generateUtilitiesCss(resolved)` |

The two conditionals are the same ones the write branch uses (`:192`, `:201`).
This is the requirement that prevents the failure mode that would be worse than
the bug: a consumer who never opted into utilities has no utilities sheet, and
that must never be a finding.

**R3 — Absent is reported; disagreeing is a finding.** Three outcomes per file,
checked in this order:

| Condition | Line | Counts as a finding |
| --- | --- | --- |
| File absent | `  ? <path> has not been generated, not checked` | no |
| Tokens sheet only: the header names the other mode | `  ✗ <path> was generated with --mode overrides; this run checked full` (or the reverse) | yes |
| Content differs | `  ✗ <path> is out of date` | yes |
| Content matches | nothing per-file | no |

- **Absent reports but does not fail.** The split is which failure is silent. A
  file that exists and disagrees with the config is dangerous precisely because
  the page still renders and everything looks fine — that is the bug this spec
  exists to catch, and it fails the build. A file that is not there announces
  itself the moment anyone loads the page, and it is also the normal state of a
  repo that gitignores its generated sheet and regenerates in CI. Failing that
  run would take `--check` away from those projects as a config-validation and
  contrast tool, which is the other half of what it is for, and they did nothing
  wrong.
  The `  ? ` prefix is the existing shape for "reported, not graded"
  (`report.unresolved`, `main.ts:218`), so this needs no new vocabulary.
  *Decided:* a note rather than a finding, and no opt-out flag either way. A
  consumer who has genuinely never run `generate` still sees the line; they are
  simply not failed on it.
- **Comparison is exact string equality after normalizing `\r\n` → `\n` on both
  sides.** Byte equality is the drift tests' rule and the right one; the EOL
  normalization exists only so a Windows checkout with `core.autocrlf` does not
  report every file stale on every run. A real drift differs in more than line
  endings, so the normalization cannot hide one. One `.replace` with a comment
  saying why.
- **Mode is detected from the sheet's own header, not assumed.** Full mode
  writes `* @hyzer-labs/ui design tokens` (`generate.ts:95`); overrides mode
  writes `* @hyzer-labs/ui token overrides` and
  `(hyzer generate --mode overrides)` (`generate.ts:594-614`). Both survive the
  optional `intro` weaving, which the CLI never passes anyway. When the on-disk
  header names the mode this run did not check, report the mode line above
  instead of a byte diff — the diff would be real but the message would send the
  reader hunting for a config change that never happened.
  *Decided:* detect and explain, rather than silently comparing against the
  other mode. `--mode` stays a per-run flag with no config key (`specs/65 R22`
  settled that), so the honest fix is a message naming the flag to add.
  The same reasoning does not extend to `--out`: a path mismatch surfaces as the
  absent-file note **naming the path checked**, which is enough to debug. Note
  the consequence of R3's downgrade — a CI job pointed at the wrong `--out` now
  passes with a `?` line rather than failing. That is the same trade as the
  gitignored sheet, and the path in the message is what makes it findable; the
  mode case is the one that stays fatal, because there the file exists and the
  run is comparing real content.
- **A library upgrade legitimately makes a sheet stale.** Banner text and token
  values are part of the generated output, so an upgraded dependency reports
  drift until the consumer regenerates. Intended, and the docs say so (R6).

**R4 — The check reports where the writes report, in the same shapes.** The
file lines are emitted in the `--check` branch, where a normal run prints its
`wrote …` lines, so both modes produce output of the same shape in the same
place. After the per-file `  ✗ ` lines:

```
files: 3 checked, all up to date
files: 2 of 3 out of date; run "hyzer generate" to update (warnings; use --strict to fail the build)
```

- The clean line goes to `log`, the failing line to `error`, matching the
  contrast section exactly.
- **An absent file is not counted in either total.** It was not checked, so it
  is neither one of the "3 checked" nor one of the "2 of 3 out of date"; it
  appears only as its own `  ? ` line above. A run whose every artifact is
  absent reports `files: 0 checked` and the `?` lines, and exits 0 even under
  `--strict` (R3, R5).
- The fix hint carries the mode when it is not the default:
  `run "hyzer generate --mode overrides" to update`.
- The `(warnings; use --strict to fail the build)` suffix is the existing
  constant and follows the same rule as the other two: present only when the run
  is not effectively strict.
- *Decided:* the section is labelled `files:`, not `output:`. `output` is
  already a config key naming one specific path (the tokens sheet), and this
  section covers three.

**R5 — One exit code, one strict rule.** The staleness count joins the existing
condition at `:244`:

```
return strict && (failures.length > 0 || iconsFailed || staleCount > 0) ? 1 : 0;
```

`strict` here is the **effective** value defined by `specs/65 R19` —
`parsed.strict === true || resolved.strict`, the flag turning it on even when
the config does not. 66 must consult that same value and must not invent a
second precedence rule.

**Ordering:** build 66 after 65 Stage 4, so the const already exists. If 66 is
reached first, introduce that const here exactly as R19 defines it (reading
`resolved.strict`, defaulted `false` in the schema) — that is doing one line of
R19 early, not designing anything new — and Stage 4 then finds it in place.

Report-by-default is deliberate: a consumer whose CI already runs `--check
--strict` gets a red build the day they upgrade *only if their committed output
really is stale*, which is the point; everyone else sees a new informational
line and nothing else.

**R6 — Docs, in one coherent pass with `specs/65 R22`.** Both specs edit
`src/routes/docs/foundation/config/+page.svelte`. Make one pass over that file,
not two. Consumer framing — no spec numbers, no `Rn`, no process language —
then an editor-agent pass before commit.

- **The `--check` row** in `cliFlags` (`:53-56`). Today: "Resolve and report
  without writing any files: no token sheet, no utilities sheet, no icons.ts.
  Pairs with `--strict` for a CI check that touches nothing." It still writes
  nothing — keep that — and it now also compares the files already on disk
  against what the run would write, so a committed sheet that has fallen behind
  the config is reported.
- **The `--strict` row** (`:57-60`, which 65 R22 also edits for the `strict`
  config key). Its list of failure sources gains one: a generated file that is
  on disk and no longer matches the config. A file that has not been generated
  at all is reported but does not fail — say so, because the distinction is the
  thing a reader wiring up CI needs.
- **The `modesCode` sample** (`:118-119`): the comment
  `# Validate without writing; fail CI on any AA miss (and any unknown icon):`
  gains the third case.
- **One short paragraph** near that sample: what "out of date" means (the file
  on disk is not what your config would produce now — including after a library
  upgrade), that `--mode` has to match the mode the sheet was written with, and
  that a file you do not commit is reported as not generated rather than failed,
  so generating at build time instead of committing the sheet stays a supported
  workflow.
- **`USAGE` in `src/lib/cli/main.ts`** (`:41-62`): the `--check` line says it
  compares the generated files on disk; the `--strict` line adds staleness to
  what it fails on. The module JSDoc (`:11-18`) gains one clause.
- **`src/docs/agentRules.ts`**, "Generate tokens; never hand-edit them" — which
  65 R22 also touches, so this is part of the same pass: one clause that
  `hyzer generate --check` in CI catches a config that has moved on without a
  regenerate.

---

### Edge cases

| Case | Expected |
| --- | --- |
| `--check`, everything current | `files: N checked, all up to date`; exit 0; nothing written. |
| `--check`, sheet drifted | One `✗ … is out of date`; exit 0 without strict, 1 with. |
| `--check`, sheet absent | One `? … has not been generated, not checked`; exit 0 **even with `--strict`**; not counted in the `files:` totals. |
| `--check --strict`, sheet absent, everything else clean | Exit 0. This is the gitignored-sheet workflow and it must stay green. |
| `--check --strict`, drifted sheet, passing contrast | Exit 1. |
| `strict: true` in config, `--check`, drifted sheet, no flag | Exit 1 (R5's shared value). |
| Sheet written with `--mode overrides`, checked without the flag | The mode line, not a byte diff; counts as a finding. |
| No `icons` key | `icons.ts` is never checked, never reported, even if a stale one exists on disk. |
| `icons` key present, `icons.ts` absent | One `?` note, not a finding. |
| Utilities not enabled | No utilities finding, ever. |
| `utilities: { output: 'styles/u.css' }` | Checked at that path, resolved relative to the config file — the same expression the write branch uses. |
| `--utilities --check` with `utilities` absent from the config | Utilities sheet is checked (the flag opts in for this run). |
| `--out` given under `--check` | The flag's path is what gets checked. |
| Config `output` relative to a `--config` in another directory | Resolved against the config's directory, as when writing. |
| CRLF checkout, otherwise identical file | Up to date. |
| Library upgraded, config unchanged | Reported stale until regenerated. Intended. |
| A non-`--check` run | No `files:` section at all — it just wrote them. |
| `--check` with an invalid config | Unchanged: the config error exits 1 before any of this runs. |
| `--check` on a stale sheet | Still writes nothing, creates no directories, and leaves the stale file exactly as it was. |

### Existing code to reuse

- **The write branch's own path expressions** (`main.ts:177-181`, `:193`,
  `:202-207`) — hoisted, not rewritten. If the two branches ever compute a path
  differently, the check is worthless.
- **`generateCss` / `generateUtilitiesCss` / `resolveIcons`** as already called
  in `run()`; no new imports beyond `readFileSync`.
- **The `suffix` constant** at `main.ts:224` / `:236` — one more use, not a
  third copy.
- **`sandbox()`** in `src/lib/cli/main.spec.ts:9` — every test below drives the
  CLI through it: unique tmp cwd, captured `log`/`error`, real files on disk.

### Test plan

Runner: **Vitest**, `server` project, all in `src/lib/cli/main.spec.ts` under a
new `describe`. Each case follows the file's existing pattern: seed the sandbox,
`await run([...], io)`, assert the exit code and the captured output. Up-to-date
fixtures are written with `generateCss(resolveConfig(cfg))` /
`generateUtilitiesCss(...)`, the same way `main.spec.ts:28` and `:228` already
build their expectations.

- Current sheet → `all up to date`, exit 0.
- Drifted sheet (write a current one, then append a line) → the `is out of
  date` line naming the path, exit 0; the same run with `--strict` → exit 1; and
  the file's contents are byte-identical afterwards (the check wrote nothing).
- Absent sheet → the `? … has not been generated, not checked` line; exit 0,
  and **still exit 0 under `--strict`**. Assert the strict case explicitly — it
  is the gitignored-sheet workflow, and a regression here turns a supported
  setup red. Assert too that the absent file is not counted in the `files:`
  totals.
- Config `strict: true`, drifted sheet, no flag → exit 1. *(Runs only once 65
  Stage 4 has landed; if 66 is built first, this case lands with Stage 4.)*
- Full sheet on disk, `--check --mode overrides` → the mode line; the message
  names `--mode overrides`; not the byte-diff wording.
- No `icons` key, with a stale `icons.ts` sitting in the output directory → no
  icons finding, and `files:` counts one file.
- `icons: ['settings']` with no `icons.ts` → one `?` note, not a finding, and
  no effect on the exit code. Same rule as the absent sheet above (R3): the file
  is not there, so there is nothing to disagree with.
- Utilities absent from config and flag → no utilities finding even though no
  file exists; with `--utilities` → the sheet is checked; with
  `utilities: { output: 'styles/u.css' }` → checked at that path.
- `--out out/tokens.css --check` → checks that path.
- A current file rewritten with CRLF line endings → up to date.
- A normal (non-`--check`) run → output contains no `files:` line.
- The two existing `--check` tests (`main.spec.ts:102`, `:204`) keep their
  assertions and gain one: the new section appears, and the exit code is
  unchanged.

### Gate

The full gate from `AGENTS.md`, at this stage boundary like every other on the
branch:

```sh
corepack pnpm exec svelte-check
corepack pnpm exec vitest run
corepack pnpm exec eslint .
corepack pnpm exec prettier --check .
corepack pnpm exec vite build
corepack pnpm exec playwright test
```

E2e needs a preview server you start yourself, restarted after any rebuild or
it serves the previous build:

```sh
lsof -ti:4173 | xargs kill -9
corepack pnpm exec vite preview --port 4173 &
```

`pnpm` is not on `PATH`; `corepack pnpm …` throughout. Commit on
`feat/config-token-coverage`; never to `main`, and do not push unless told.

### Non-goals

- **`--check` writing, regenerating or auto-fixing anything.** It reports; the
  fix is `hyzer generate`, which the summary line names. No `--fix`, no
  `--write`.
- **A flag to suppress the staleness check** (`--no-verify` and friends). A
  project that does not commit its output runs `generate` in that job; if a real
  need for the flag turns up, it is three lines then.
- **A diff.** The finding names the file and the command that fixes it. Printing
  a CSS diff in CI output is a lot of noise for a fix that is one command, and
  the consumer's own `git diff` after regenerating shows it better.
- **A `mode` config key.** `specs/65 R22` settled `--mode` as a per-run flag;
  R3's detection makes the mismatch legible instead.
- **Checking files the run would not write** — a stale `icons.ts` beside a
  config with no `icons` key, or a utilities sheet nobody opted into. False
  findings are worse than the bug.
- **Checking anything but the CLI's own artifacts.** Whether a consumer's app
  imports the sheet, or imports a stale copy of it, is outside what the
  generator can see.

### Write scope

`src/lib/cli/main.ts` (the hoist, the `--check` branch, the exit condition,
`USAGE`, the module JSDoc); `src/lib/cli/main.spec.ts`;
`src/routes/docs/foundation/config/+page.svelte` (one pass, shared with
`specs/65 R22`); `src/docs/agentRules.ts` (one clause, same shared pass). No
changes to `src/lib/config/` — the engine already produces everything this
compares. No new dependencies, no new flags, no new public API.
