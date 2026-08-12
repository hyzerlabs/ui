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
`parseColor(value: string): ParsedColor | null`, pure and DOM-free — sRGB
0–255 channels, plus R3's gamut marker. It resolves:

- hex, 3/4/6/8 digits
- `rgb()` / `rgba()`, `hsl()` / `hsla()`, `hwb()`
- `lab()`, `lch()`, `oklab()`, `oklch()`
- `color()` in every space it predefines: `srgb`, `srgb-linear`,
  `display-p3`, `a98-rgb`, `prophoto-rgb`, `rec2020`, `xyz`, `xyz-d50`,
  `xyz-d65`
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
backdrop — including `transparent`), `currentColor`, `inherit`, `var()`,
`color-mix()`, and any color space not in R1. A relative color is refused
only when its origin is (R10 owns the rest of that syntax). `var()` and `color-mix()` are resolved a layer up, by
`resolveColor` in `config/report.ts` (R8), which walks `var()` chains and
evaluates the mixes before handing leaves to `parseColor`.

Refused too: anything CSS itself rejects, which a permissive parser would
otherwise accept — a JS numeric literal in a channel (`Number('0x10')` is
16), a bare number in a legacy `hsl()`, mixed comma/space syntax. And
`parseColor` returns `null` for all of it rather than throwing, which means
the named-color lookup has to be guarded: `constructor` and `__proto__` are
lowercase keys on `Object.prototype`, and an unguarded lookup returns a
function where a color string belongs.

**R3 — Gamut, and saying so.** A color outside sRGB is clipped per channel,
not gamut mapped. Grading a P3 hue against its clipped equivalent is close
enough for a threshold check and wrong for a wide-gamut display; CSS Color
4's chroma-reduction mapping is the upgrade if that ever matters.

A color counts as clipped when the clamp moved the byte that comes out — not
when a channel strays past 0–1 by some tolerance. A tolerance would need
tuning at both ends: a conversion round trip leaves white a few 1e-8 outside
the cube, and the transfer function multiplies a small negative by 12.92 on
the way out, so identical noise reads differently either side of zero. Asking
whether the byte changed needs no constant at all.

An approximation that does not admit to being one reads as exact. So the flag
travels with the value rather than being inferred later: `parseColor` marks a
result whose channels had to be clipped, `resolveColor` carries it through
`var()` chains and `color-mix()`, and every report row says whether either
side reached its ratio that way. The CLI names the affected pairings. It is a
note, not a failure — the ratio is still the right answer for an sRGB screen.
Documented where the docs describe the report, not only in source.

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

**R8 — `color-mix()` in every space CSS names.** `resolveColor` evaluates
two-color `color-mix()` in all fifteen: the rectangular set (`srgb`,
`srgb-linear`, `display-p3`, `a98-rgb`, `prophoto-rgb`, `rec2020`, `lab`,
`oklab`, `xyz`, `xyz-d50`, `xyz-d65`) and the polar set (`hsl`, `hwb`, `lch`,
`oklch`). srgb keeps a channelwise lerp of the encoded values — the theme's
own recipes take that path, and routing it through the hub instead would move
existing ratios by a rounding step for nothing. Every other space converts
both ends, interpolates, and converts back.

Why all of them, rather than the two that were asked for. The spaces split in
two: `srgb-linear` and the XYZ set need no new conversion at all, and every
other one needs the reverse direction, XYZ → space. Relative color syntax
needs those same inverses, so building them once covers both, and covering
every space closes the question rather than leaving a list to revisit.

A polar space interpolates its hue around the circle, with all four
`<hue-interpolation-method>` keywords and `shorter` as the default; a method
on a rectangular space is invalid, as CSS says. A component that carries no
direction is powerless — the hue of a gray, an `hsl` with no saturation, an
`hwb` whose white and black cover the channel — and the mix takes the other
color's hue rather than sweeping through hues neither color contains.

Percentages follow CSS Color 5. The percentage may lead or trail its color,
since the grammar pairs them with `&&`. One given implies the other, neither
means half each, and a pair that does not sum to 100% is scaled until it
does. Three forms resolve to `null` instead, each because the browser paints
nothing a grade could describe: a pair summing to *under* 100%, which CSS
makes translucent; a weight outside 0–100%, which makes the whole function
invalid so the declaration is dropped; and a component carrying a percentage
at both ends, which is not a form CSS has. Any other interpolation space is
`null` too — mixing in the wrong space would grade a color the browser never
paints, which is worse than not grading it.

**Known ceiling.** Endpoints reach the mix as 8-bit sRGB, which costs two
things. A hue is good to about half a degree, and every arc choice turns on a
comparison against 180°, so a pair separated by within a degree of 180° can
take the other arc — both are the same length there, and CSS decides by the
sign. The second cost: an authored hue the color itself does not carry is
gone. `color-mix(in hsl, hsl(200 0% 40%), …)` reaches us as
`rgb(102 102 102)`, which has no hue at all, so the powerless rule substitutes
the other end's where a browser would have kept 200. Both follow from the interchange
type; carrying more precision means widening `ParsedColor` itself, and a
palette is unlikely to author a saturation of zero and expect its hue to
survive.

**R9 — One hub, and no hand-written inverses.** Spaces convert through XYZ
with a D65 white point rather than to each other, so each is a single pair of
functions instead of a route to every other; adding a space is adding a row.
Two spaces sit outside the hub on purpose. `hsl` and `hwb` are defined
directly on sRGB, and the endpoints are already sRGB, so they read their
components off the color rather than travelling out to XYZ and back. The
round trip is lossless in principle and not in practice: it returns cyan's
hue as 180.0000000004, which flips the arc a mix takes, and it spreads a
gray's channels far enough apart to invent a hue for it.

Only the forward matrices are written out, and their inverses are computed at
load by `invert`. A hand-transcribed inverse is a typo that shows in one
direction only, which is the kind a review does not catch. Computing it is a
few multiplications at load, and it cannot be typed wrong.

**R10 — Relative color syntax.** `<fn>(from <origin> …)` resolves for every
function that takes it: `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`,
`oklab()`, `oklch()` and `color()`. The origin is converted into the
destination space, and its channels bound to that space's keywords. Each
component is then a keyword, a literal, `none`, or `calc()` over any of them.

Keywords carry the units that function's own bare numbers use: `s` is 50 in
`hsl()` because a bare 50 there means 50%, and `l` is 0.5 in `oklch()`
because a bare 0.5 means 0.5. A percentage inside the arithmetic resolves
against the channel's own reference *first*, so `calc(r * 50%)` is
`r * 127.5`, not `r / 2`. Both rules were read off the browser rather than
off the spec text.

`calc()` covers `+ - * /`, parentheses and nesting. One piece of CSS's type
algebra is enforced, because it is the only piece that changes an answer
rather than a verdict: a number and a percentage cannot be added or
subtracted, two percentages cannot multiply, and nothing divides by one.
`calc(s + 10%)` is how somebody writes "10% more saturated", CSS rejects it,
and the browser drops the whole declaration — computing it anyway would grade
a color that is never painted. The rest of the algebra is not enforced, and
what that lets through is arithmetic no palette writes on purpose.

A hue slot takes any CSS angle unit, as it does outside relative syntax.
Inside `calc()` it does not: the keyword there is a plain number, so
`calc(h + 30deg)` is invalid and refused. The other refusals are a component
count that is not three, a percentage on a hue, a channel the destination
space does not have, a division by zero, `none` as an operand rather than a
component, a math function other than `calc()`, a stray character the
tokenizer would otherwise drop, and an origin that cannot be resolved.

An origin that is a `var()` chain or a `color-mix()` is substituted by
`config/report.ts`, the only layer that knows what a custom property holds.
`parseColor` handles a static origin alone.

**Known ceiling, and it is larger here than elsewhere.** The origin reaches
the arithmetic as 8-bit sRGB, so a derived color is computed from the
interchange value rather than the authored one. For an in-gamut origin that
is a rounding step. For an origin *outside* sRGB it is not: the origin is
clipped before its channels are read, so `oklch(from oklch(0.6 0.15 200) l c
calc(h + 180))` derives from a less saturated color than the browser does.
The result carries R3's `clipped` flag in that case, which is the difference
between an approximation and a silent one.

### Edge Cases & Error States

| Case | Expected behavior |
| --- | --- |
| Palette authored entirely in `oklch()` | Graded like any other; every pairing present. |
| A hue outside sRGB (`oklch(0.7 0.35 150)`) | Clipped per channel, graded, integer channels in 0–255. |
| `--hz-color-surface: currentColor` | Theme reported as not graded; `pass` false; `--strict` exits 1. |
| A single intent unresolvable | Named in `unresolved`, its pairings skipped, theme still graded. |
| `rgba(0, 0, 0, 0.5)` as a token | Unresolved — a translucent color has no ratio of its own. |
| `color-mix(in oklab, …)`, `in oklch` | Evaluated (R8), including the hue-interpolation keywords. |
| `color-mix(in <any CSS space>, …)` | Evaluated (R8). A name that is not an interpolation space is unresolved. |
| `color-mix(in display-p3 shorter hue, …)` | Unresolved — a rectangular space takes no hue method. |
| `color-mix(in oklab, a 30%, b 30%)` | Unresolved: the sum under 100% makes the result translucent. |
| `color-mix(in oklab, a 120%, b 30%)` | Unresolved — a weight over 100% makes the whole function invalid CSS. |
| `color-mix(in srgb, 30% a, b)` | The leading-percentage form; same result as `a 30%`. |
| `color-mix(in oklch longer hue, a, a)` | Sweeps the whole circle. Equal hues are the `longer` branch's boundary case, not a no-op. |
| `color-mix(in oklch longer hue, gray, a)` | Powerless hue is substituted first, then the arc is chosen, so this sweeps too. |
| `lab(100 0 0)` (white through a matrix) | Not marked clipped: float noise at 1e-8 is not a gamut excursion. |
| sRGB green as `oklch(0.86644 0.29483 142.5)` | Not marked clipped either. The noise is larger here — the Oklab coefficients carry ten digits, and the transfer function scales the shortfall by 12.92 — but the byte does not move. |
| `color-mix(in hsl longer hue, …)` where the arc goes below 0° | Interpolates over the negative hue; the hue is put back on the circle before it is used. |
| `color-mix(in hwb, white, …)`, `in lch` with a gray | The gray's hue is powerless in every polar space, whatever noise the conversion into it added. |
| `color-mix(in constructor, …)` | `null`. The space table is an object literal, so membership is checked with `hasOwn`. |
| `oklch(from #3366cc calc(l * 0.8) c h)` | Resolved (R10). |
| `oklch(from var(--brand) l c h)` | Resolved: the origin goes through the `var()` chain first. |
| `oklch(from oklch(0.7 0.35 150) l c h)` | Resolved from the clipped origin, and marked `clipped`. |
| `oklch(from currentColor l c h)` | Unresolved — the origin is, so the color is. |
| `rgb(from #3366cc r g h)` | `null`: `h` is not a channel of the destination. |
| `oklch(from #3366cc l 50% 50%)` | `null`: a hue has no percentage reference. |
| `oklch(from #3366cc l c min(h, 10))` | `null`: only `calc()` is evaluated. |
| `oklch(from … l c 180deg)`, `0.5turn`, `3.14rad` | Resolved: a hue slot takes any angle unit. |
| `oklch(from … l c calc(h + 30deg))` | `null`: the keyword is a number inside the arithmetic. |
| `hsl(from … h calc(s + 10%) l)` | `null`: CSS cannot add a number and a percentage, and drops the declaration. |
| `hsla(from …)`, `rgba(from …)` | The legacy spellings resolve like the modern ones. |
| `rgb(from … r g b/1)` | Resolved: the alpha slash needs no space around it. |
| `calc()` nested 20,000 deep | `null`, not a thrown `RangeError` (R2). |
| `color-mix(in oklch, oklch(0.7 0.35 150), white)` | Mixed on the clipped end, and the row is marked (R3) — the browser mixes the wide-gamut original, so this one is an approximation twice over. |
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
- `src/lib/config/report.ts` — `resolveColor` walks `var()` and evaluates
  `color-mix()`; `resolveHex` stays as its hex-only wrapper for the two specs
  that only want the string.

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
  lightnesses, every `color()` space, a named color, mixed case. Each
  `color()` space also gets a value near the dark end, where a transfer
  function's linear segment is what a transcription error hides.
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

**Server — `src/lib/config/report-mix-node.spec.ts` (new).** A handful of the
same mixes, pinned to fixed hexes, on the runtime the CLI actually uses. The
browser oracle is the better test, but it only sees what the browser does: one
defect here resolved differently in node and in Chromium from identical
source, so a browser-only suite passed while `hyzer generate` was wrong. The
values are read off the browser once; node drifting from them is the
divergence worth failing on.

**Server — `src/lib/cli/main.spec.ts`.** An `oklch()` palette that misses AA
exits 1 under `--strict` and names the pairing. An ungradeable surface warns
at exit 0 without `--strict`, and exits 1 with it, printing `not graded`
rather than `all pass`. An out-of-gamut hue prints the gamut note and names a
pairing; a palette that fits in sRGB prints nothing about gamut at all.

**Client — `src/lib/utils/relative.svelte.spec.ts` (new).** R10 against the
same canvas oracle. The unit each keyword carries and the meaning of a
percentage inside `calc()` have to be read off a browser, not off a spec
document. The identity in every space that takes relative syntax, one case
per keyword unit, the percentage-reference rule, the arithmetic shapes, and
every refusal.

**Client — `src/lib/config/report-mix.svelte.spec.ts` (new).** R8 against the
same canvas oracle, since hue direction and percentage normalization are
exactly the questions a spec document is easy to misread on. In-gamut mixes
agree within 1/255, one weighted and one unweighted pair per interpolation
space, plus all four keywords on all four polar spaces; `longer hue` must
differ from `shorter hue` by more than rounding, or the keyword is not doing
anything. One pair per space is enough because a space reached through the
wrong primaries or the wrong white point does not land close. The translucent cases assert
the browser's alpha is 153 alongside our `null`, so the refusal is pinned to
what the browser actually paints rather than to our reading of the rule.

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
`src/lib/config/report.ts` (the resolver, and the space name pattern — those
names take digits), `src/lib/config/report-mix.svelte.spec.ts` (new),
`src/lib/cli/main.ts`, and the spec files named in the test plan; `src/routes/docs/foundation/config/+page.svelte`,
`src/routes/docs/theming/tokens/+page.svelte`,
`src/routes/docs/foundation/contrast/+page.svelte`, `CHANGELOG.md`.

No new dependencies (Context). No component changes, no CSS changes, and no
change to any generated file. One new public export (`parseColor`) and one
behavior change to four existing ones (R6), both in `CHANGELOG.md`.

### Non-goals

- Math functions other than `calc()` in a relative color: `min()`, `max()`,
  `clamp()`. They resolve to `null`, which is loud where it matters (R5) and
  a note where it does not. Worth adding if one shows up in a real config;
  the evaluator has the shape for it.
- Gamut *mapping* (R3). Flagging the approximation is the cheap half; CSS
  Color 4's chroma-reduction search is the expensive half, and it only
  changes a grade for colors already outside sRGB.
- Changing the theme's tint recipes to a perceptual space. That is a design
  decision about the shipped theme, with a matching change to the report's
  model, and belongs in its own spec.
