# 70 — Any CSS color in the token engine

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. **Builds on `specs/29-token-engine.md`
> R5 (validation & contrast report) and `specs/42-palette-split.md` (palette vs
> role tiers), and does not restate them.**

### Goal

A config may author its colors in any CSS color space and still be graded.
The CSS side already works: values are written to the sheet verbatim, and no
schema rule restricts them. The contrast report is the gap. It resolves hex
only, so a palette written in `oklch()` is skipped rather than graded.

The skip is silent. When a value the whole theme hangs off cannot be
resolved, `contrastReport` drops that theme, and `pass` is `rows.every(…)`
over what is left. A config whose every hue is `oklch()` therefore reports
`0 pairings checked, all pass WCAG AA` and exits 0 under `--strict`. The
accessibility gate disappears instead of failing, which is why this spec is
a fix before it is a feature.

### Context & Conventions

- WCAG 2.x defines contrast on sRGB. Every color has to reach sRGB before it
  can be graded, whatever space it was written in.
- The engine runs in Node, where there is no CSS parser to borrow. The
  conversion is ours to do — this is why the gap existed.
- **Zero runtime dependencies** is the package's posture (only a peer on
  Svelte). The parser is hand-rolled to keep it (user decision, 2026-08-10).

### Requirements

**R1 — `parseColor`.** A new `src/lib/utils/color.ts` exports
`parseColor(value: string): Rgb | null`, pure and DOM-free. It resolves, to
sRGB 0–255 channels:

- hex, 3/4/6/8 digits
- `rgb()` / `rgba()`, `hsl()` / `hsla()`, `hwb()`
- `lab()`, `lch()`, `oklab()`, `oklch()`
- `color()` in `srgb`, `srgb-linear`, `display-p3`
- the 148 CSS named colors (`transparent` parses, then R2 refuses it on
  alpha)

Both the legacy comma syntax and the modern space syntax, every CSS angle
unit for hues, percentages wherever CSS allows them, and `none` as zero per
CSS Color 4's missing-component rule.

Three places where following CSS exactly is what keeps a wrong color out of
the report:

- **A bare number in a percentage slot means that many percent.**
  `hsl(210 90 45)` is `hsl(210 90% 45%)`, not a pair of fractions — read as
  fractions it clamps to white. Same for `hwb()`'s whiteness and blackness.
  Modern syntax only: the legacy comma form takes percentages, and a bare
  number there is invalid CSS, so it is refused rather than guessed at.
- **Lightness is clamped to its range**, 0–1 for the ok\* pair and 0–100 for
  lab/lch, as CSS clamps it. The conversions do not degrade gracefully past
  the ends — a negative oklab L returns a color rather than black.
- **Alpha is clamped to 0–1**, so `/ 1.5` and `/ 150%` are opaque and grade
  like any other color. Refusing them would drop a real color out of the
  gate, or fail a strict build on a color the browser paints solid.

**R2 — What it refuses.** `null`, never a guess, for: any color with alpha
below 1 (no contrast ratio exists until it is composited over a known
backdrop — including `transparent`), `currentColor`, `inherit`, relative
color syntax (`oklch(from … )`), `var()`, `color-mix()`, and any color space
not in R1. `var()` and `color-mix()` are resolved a layer up, by `resolveHex`
in `config/report.ts`, which walks `var()` chains and evaluates
`color-mix(in srgb, …)` before handing leaves to `parseColor`.

Refused too: anything CSS itself rejects, which a permissive parser would
otherwise accept — a JS numeric literal in a channel (`Number('0x10')` is
16), a bare number in a legacy `hsl()`, mixed comma/space syntax. And
`parseColor` returns `null` for all of it rather than throwing, which means
the named-color lookup has to be guarded: `constructor` and `__proto__` are
lowercase keys on `Object.prototype`, and an unguarded lookup returns a
function where a color string belongs.

**R3 — Gamut.** A color outside sRGB is clipped per channel, not gamut
mapped. Grading a P3 hue against its nearest sRGB neighbor is close enough
for a threshold check and wrong for a wide-gamut display; CSS Color 4's
chroma-reduction mapping is the upgrade if that ever matters. Documented
where the docs describe the report, not only in source.

**R4 — The report grades every format.** `config/report.ts` resolves leaves
through `parseColor` instead of its hex regex. A palette authored in any
supported space produces the same rows, in the same order, as the same
colors written in hex — the conversion introduces no new pairings and skips
none. Ratios agree to within rounding (0.005).

**R5 — An ungraded theme is a failure.** `ContrastReport` gains
`skipped: string[]`, the themes that produced no rows because a surface or
the text role could not be resolved. `pass` is true only when every row
passes **and** `skipped` is empty. The CLI prints each skipped theme as an
error line beside the failures, and `--strict` exits 1 on one. A partial
miss (a single intent unresolved) stays a note, as before: the theme was
still graded.

**R6 — The public utils take any color.** `contrastRatio`,
`relativeLuminance`, `gradeContrast` and `mixSrgb` accept anything R1
accepts. A value R1 refuses throws a `TypeError` naming it, rather than
returning `NaN` as the hex-only path silently did. `hexToRgb` stays hex-only
— its name is its contract. `parseColor` is exported from the package root
and `@hyzer-labs/ui/utils`.

**R7 — Tests are checked against the browser.** The conversion suite runs in
the browser project and grades `parseColor` against the engine that ships
the CSS: paint the value into a 1×1 sRGB canvas and read the pixel back.
Every in-gamut case must agree within 1/255, and all 148 named colors must
agree exactly. Numbers transcribed from a spec document are not an
acceptable substitute for that oracle.

### Edge Cases & Error States

| Case | Expected behavior |
| --- | --- |
| Palette authored entirely in `oklch()` | Graded like any other; every pairing present. |
| A hue outside sRGB (`oklch(0.7 0.35 150)`) | Clipped per channel, graded, integer channels in 0–255. |
| `--hz-color-surface: currentColor` | Theme reported as not graded; `pass` false; `--strict` exits 1. |
| A single intent unresolvable | Named in `unresolved`, its pairings skipped, theme still graded. |
| `rgba(0, 0, 0, 0.5)` as a token | Unresolved — a translucent color has no ratio of its own. |
| `color-mix(in oklab, …)` as a token value | Unresolved (R2). Only `in srgb` is modeled, matching the theme's own recipes. |
| `contrastRatio('var(--x)', '#fff')` | Throws a `TypeError` naming the value. |
| Legacy vs modern syntax for one color | Identical result. |
| Mixed syntax (`rgb(1, 2 3)`) | `null`. |
| `hsl(210 90 45)` | `hsl(210 90% 45%)`. The bare-number form, per CSS. |
| `hsl(210, 90, 45)` | `null` — invalid in the legacy form. |
| `rgb(0 0 0 / 1.5)`, `/ 150%` | Opaque; graded. Alpha clamps to 0–1. |
| `oklab(1.4 …)`, `lab(-1 …)`, `oklch(1.02 …)` | Lightness clamped, then graded; matches the browser. |
| `rgb(0x10 0 0)` | `null` — CSS rejects it, so grading it would invent a color. |
| `parseColor('constructor')` | `null`, not a thrown TypeError. |

### Existing Code to Reuse

- `src/lib/utils/contrast.ts` — all ratio/level math (specs/29 R5); the
  parser feeds it, never duplicates it.
- `src/lib/config/report.ts` — `resolveHex` already walks `var()` and
  `color-mix(in srgb, …)`; only its leaf resolution changes.

### Test plan

Runner: **Vitest**, existing projects. The split is forced by R7: the
conversion suite needs a real browser to be checked against, everything else
is engine and CLI work with nothing to render.

**Client — `src/lib/utils/color.svelte.spec.ts` (new).** The oracle is a 1×1
canvas: set `fillStyle`, paint, read the pixel. An unparseable value leaves
`fillStyle` where it was, so no case may be black — a browser that failed to
parse must surface as a mismatch, not as agreement.

- One case per supported format and per syntax variant, in gamut, agreeing
  within 1/255: both `rgb()` syntaxes, percentage channels, every angle unit
  for a hue, negative hues, `lab`/`lch`/`oklab`/`oklch` at several
  lightnesses, all three `color()` spaces, a named color, mixed case.
- Every named color in the table, agreeing exactly. The table is read out of
  a browser, not transcribed, and this is what holds it to that.
- Each R2 refusal, one case apiece, including all four hex lengths with
  alpha, both alpha syntaxes, the numeric literals, the legacy bare number,
  and the two prototype keys.
- Out of gamut: integer channels inside 0–255 (the clip), not the raw math.
- Adversarial values, because a suite of well-formed colors is what let the
  first three rules in R1 ship wrong: components past their range in both
  directions, hues far outside one turn and negative, lightness at and past
  both ends, achromatic inputs, `hwb()`'s white + black >= 1 branch, the
  sRGB transfer function's knee, chroma well outside the gamut, and the
  percentage forms of the axes that are not percentages by default.

**Server — `src/lib/config/config.spec.ts`.** A palette in four spaces at
once grades with `unresolved` and `skipped` both empty. The R4 parity case:
every default hue restated as `color(srgb …)` produces the same rows in the
same order, ratios equal to two decimals. An unparseable surface lands in
`skipped` with `pass` false. The pre-existing "lists unresolvable values"
case moves to a translucent color, since `oklch()` is no longer unresolvable.

**Server — `src/lib/cli/main.spec.ts`.** An `oklch()` palette that misses AA
exits 1 under `--strict` and names the pairing. An ungradeable surface warns
at exit 0 without `--strict`, and exits 1 with it, printing `not graded`
rather than `all pass`.

### Gate

The full gate from `AGENTS.md` before commit:

```sh
corepack pnpm check
corepack pnpm test:unit
corepack pnpm lint
```

`pnpm` is not on `PATH`; `corepack pnpm …` throughout, with
`export PATH="/tmp/shim:$PATH"`. No generated file changes here — the token
sheets are untouched, since nothing about the emitted CSS moves. Commit on a
feature branch, never to `main`.

### Write scope

`src/lib/utils/color.ts` (new), `src/lib/utils/color.svelte.spec.ts` (new),
`src/lib/utils/contrast.ts`, `src/lib/utils/index.ts`, `src/lib/index.ts`,
`src/lib/config/report.ts`, `src/lib/cli/main.ts`, and the three spec files
named in the test plan; `src/routes/docs/foundation/config/+page.svelte`,
`src/routes/docs/theming/tokens/+page.svelte`, `CHANGELOG.md`.

No new dependencies (Context). No component changes, no CSS changes, and no
change to any generated file. One new public export (`parseColor`) and one
behavior change to four existing ones (R6), both in `CHANGELOG.md`.

### Non-goals

- Mix spaces beyond `in srgb` in `color-mix()`. The theme's own tint recipes
  are `in srgb`, so nothing in the library needs more; a consumer's
  `in oklab` value lands in `unresolved`, which R5 now makes loud.
- Relative color syntax, and `color()` spaces beyond the three in R1.
- Gamut mapping (R3).
- Changing the theme's tint recipes to a perceptual space. That is a design
  decision about the shipped theme, with a matching change to the report's
  model, and belongs in its own spec.
