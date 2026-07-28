# 52 — Named themes + the `theme` attachment (section-scoped theming)

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. **Depends on** the token engine
> (specs/29), theming (specs/30), the theme-examples arc (specs/32), the palette
> split (specs/42), and the observers attachment shape (specs/48). Lands in the
> 0.1.0 breaking window (greenfield; the docs site is the only dogfooder).

### Goal

Let a long page theme each section independently. A section names a theme
defined in `hyzer.config.ts` — `{@attach theme('dark')}`, `{@attach
theme('ocean')}` — or passes an inline token-override object. Entirely opt-in:
`data-theme` on `<html>` keeps working exactly as it does today, and a consumer
who never imports `theme` pays nothing.

The enabling change is that **`dark` stops being a special config key and
becomes an entry in a new `themes` map** — dogfooding the multi-theme mechanism
with the theme the library already ships (user decision, 2026-07-28).

**This is an optional quality-of-life helper, and the spec must not read
otherwise.** It adds a convenient way to name and apply a theme; it replaces,
deprecates, and competes with nothing. Class-based theming remains a
first-class mechanism for any consumer (see Doctrine), the `<html>`-level
`data-theme` toggle is unchanged, and hand-writing the attribute or the class is
always a legitimate substitute for the attachment.

### Context & Doctrine

**One attribute slot — for `themes` entries.** A `themes` entry is selected the
same way `dark` already is: `data-theme="<name>"`. The `:root` block is the
default theme; `themes` entries are mutually exclusive with each other, because
one attribute holds one value. A dark variant of a named theme is its own entry
(`'ocean-dark'`), not a product of two axes. This is why the attachment is a
thin wrapper over an attribute that consumers may equally write by hand.

**Classes remain a first-class mechanism, and this constraint does not reach
them.** Every component surfaces `class` by design, and `GenerateOptions.selector`
emits a theme under any selector a consumer chooses — including a class. That
path is not a legacy corner reserved for the shipped examples: it is the general
escape hatch, and it is strictly more expressive than `themes`, because a class
scope **composes** with `[data-theme='dark']` through `darkSelector()`
(`generate.ts:183`) and so keeps the full theme × mode matrix that the one-slot
model deliberately gives up. A consumer who wants "ocean, in either mode" uses a
class scope; a consumer who wants one named look per section uses `themes`. Both
are supported outcomes, and the docs (R7) must present them as such rather than
ranking them.

**Section-scoped dark already works; section-scoped light does not.**
`tokens.css:198` emits the dark block as bare `[data-theme='dark']`, not
`:root[data-theme='dark']` — it matches any element and custom properties
inherit, so `<section data-theme="dark">` themes a subtree today. But no
`[data-theme='light']` block exists anywhere, so a light section inside a dark
ancestor inherits the ancestor's dark declarations and stays dark. R3 fixes
that, and it is a prerequisite for the whole feature, not a polish item.

**Scoped blocks must re-emit the derived chain.** A `var()` indirection declared
at `:root` has already resolved there and inherits down as a fixed value — this
is exactly what `scopedClosure()` in `config/generate.ts:216` exists for, and it
is why `generateCss` can re-scope Ocean at runtime on the examples page. Every
`[data-theme='<name>']` block is a scoped block and needs the same treatment.

**Dark keeps two dark-specific behaviors, and that is correct.** Moving `dark`
under `themes` unifies its *authoring surface*, not its physics. The
system-preference default (R4) and the mode-aware soft tints (`softTints` in
`config/report.ts:29`, consumed by the `[data-theme='dark'] .hz-badge/.hz-alert`
rules) are keyed to dark specifically because they model a real display
condition, not a naming convention. The spec says so rather than pretending
total uniformity.

**Class-scoped whole-config sheets are untouched.** Ocean (`.theme-ocean`,
runtime-scoped) and Terminal (`.hz-theme-terminal`) are separate configs with
their own palettes, emitted via `GenerateOptions.selector`. They are orthogonal
class scopes that still compose with `[data-theme='dark']` through
`darkSelector()`. They do **not** migrate to `themes` entries, and `selector`
stays.

---

### Requirements

**R1 — The `themes` config key.** `HyzerConfig` gains
`themes?: Record<string, HyzerThemeOverride>`, where `HyzerThemeOverride` is the
shape today's `HyzerDarkOverride` has (`palette?`, `color?`, `intent?` — the
palette layer plus the role and intent remap surfaces). The `dark` key is
**removed**; its content moves to `themes.dark`. Validation:

- Theme names must match `/^[a-z][a-z0-9-]*$/` — the name lands in both a CSS
  attribute-selector string and a DOM attribute value. Reject anything else with
  a `HyzerConfigError` naming the offending key.
- `light` is **reserved** and rejected: it names the default block (R3), which is
  authored via `tokens`, not `themes`.
- `config.themes.dark` merges over the base dark authoring exactly as
  `config.dark` does today (`schema.ts:513-531`) — the base still authors dark at
  the palette layer per the two-tier rule, and the consumer surface is unchanged
  in behavior.
- `ResolvedConfig.dark` is retained as a distinguished field (R4 and the
  contrast report depend on it); other entries resolve into a new
  `ResolvedConfig.themes: { name: string; palette: TokenEntry[]; color:
  TokenEntry[]; intent: TokenEntry[] }[]`, ordered by config declaration order.
- Add the `themes` key to the top-level allowed-keys list at `schema.ts:348`.

**R2 — One emitted block per theme.** `generateCss` emits, after the dark block,
one block per `resolved.themes` entry at selector `[data-theme='<name>']`,
carrying that entry's declarations **plus its derived closure** — the same
`scopedClosure()` treatment scoped sheets get, for the same reason. No nested
dark block per theme: under one-slot, `[data-theme='foo'][data-theme='dark']`
can never match, and emitting it would be dead CSS.

**R3 — The default block is restorable at `[data-theme='light']`.** Emit a
`[data-theme='light']` block declaring, at their default values, the **union of
every token name any theme block emits** (dark included). Not the whole `:root`
block — only what a theme can change needs undoing, which keeps the added bytes
proportional to the themes actually configured. This is what makes a light
section inside a dark page restore, and it is what makes themes genuinely
section-scoped rather than root-only.

**R4 — System-preference default for the `dark` entry.** Alongside the explicit
`[data-theme='dark']` block, emit:

```css
@media (prefers-color-scheme: dark) {
	:root:not([data-theme]) {
		/* the dark entry's declarations */
	}
}
```

Only for the entry named `dark`. `:not([data-theme])` means an explicit choice
anywhere on `<html>` — including `data-theme="light"` — wins over the system
preference, which is the behavior `+layout.svelte:106-113` currently hand-rolls
in JS. A section-level `[data-theme='light']` still restores under a
system-dark root because R3's block exists and beats inheritance.

**R5 — The `theme` attachment.** New `src/lib/attachments/theme.ts`, exported
from the package root beside `tooltip` and `lightboxGroup`
(`src/lib/index.ts:16-17`). Signature:

```ts
export function theme(source: string | HyzerThemeOverride): (node: Element) => () => void;
```

- **String form** — `node.setAttribute('data-theme', name)`. Capture the prior
  attribute state on mount and restore it on teardown (the `lightboxGroup`
  precedent), so an attachment on an element that already carried `data-theme`
  leaves it as it found it.
- **Object form** — R6.
- SSR-guarded (`typeof document === 'undefined'` → no-op cleanup, never throw),
  matching `observers/factory.ts:33`.
- Reactive by construction: Svelte re-runs an attachment when its argument
  changes, so a `theme(current)` bound to state re-applies on change. The
  teardown/re-apply path must be idempotent.
- **No dev warning for an unknown name.** The attachment cannot see
  `hyzer.config.ts` at runtime, so it cannot distinguish a typo from a theme
  defined in a sheet it never loaded. An unmatched name is inert CSS, not an
  a11y bypass, so the dev-warning policy does not apply. Document the
  no-validation contract instead.

**R6 — The inline object form.** `theme({ palette: { … }, color: { … } })`
resolves the override through the same path a `themes` entry takes, then applies
the resulting entries as inline custom properties via `node.style.setProperty`.
Custom properties inherit, so the subtree is themed with no injected stylesheet,
no generated scope class, and no dedupe or cleanup bookkeeping. Teardown removes
exactly the properties it set.

- **Mode-agnostic** (user decision): an inline object carries no dark variant.
  Inline styles cannot express a selector-keyed block, and chasing an ancestor's
  mode with a mutation observer buys a case that a named theme already covers.
  A section needing both modes uses a `themes` entry.
- **The resolver is `import()`-ed, not statically imported.** `resolveConfig`
  pulls the full base token model; making name-only consumers pay for it in the
  main bundle is the wrong default. Load it on the object path only, and guard
  the async resolution with a disposed flag so a teardown that lands first wins.
- An inline object is **not contrast-graded** — grading is a build-time
  concern and the object is a runtime value. Document that named themes get
  the AA gate (R8) and inline objects do not.

**R7 — Docs: the multi-section page and the header dogfood.**

- New page demonstrating the actual ask: one long page, each section carrying a
  different theme via the attachment — named entries and at least one inline
  object, side by side, so the two forms are visibly the same feature.
- The page presents the attachment as **one of several ways** to scope a theme,
  not the way: show the equivalent hand-written `data-theme` attribute, and show
  the class scope alongside it with its one advantage stated plainly (it composes
  with dark mode; a `themes` entry cannot). No ranking, no "preferred" path.
- `+layout.svelte` drops the hand-rolled `matchMedia` default
  (`+layout.svelte:110-113`) — R4 makes system-following pure CSS. It keeps the
  explicit toggle, the `hz-theme` storage key, and the `.theme-transition`
  reduced-motion-gated flip (`+layout.svelte:129-144`), and now reads as the
  documented dogfood of the shipped path rather than a private implementation.
- **The FOUC fix.** There is no blocking script in `src/app.html` today, so a
  stored dark choice flashes light on first paint. Add the minimal blocking
  snippet and document it as a copy-paste block in Getting Started — a string
  export would be more API surface than the three lines it replaces:

  ```html
  <script>
  	const t = localStorage.getItem('hz-theme');
  	if (t) document.documentElement.dataset.theme = t;
  </script>
  ```

  With R4 carrying the system default, this is needed only for an explicit
  stored override; a consumer who never offers a toggle needs no script at all.

**R8 — Contrast grading extends to every theme.** `config/report.ts` currently
grades exactly `['light', 'dark']` (`report.ts:155`). It grades each `themes`
entry as a mode instead, so a named theme gets the same AA gate dark gets, and
`hyzer generate`'s warn-by-default report covers it. The CI token-compliance
suite (`src/lib/utils/contrast.spec.ts`) follows.

**R9 — Ripple.** Resolve every dependent of the removed `dark` key:
`src/lib/theme/examples/ocean.config.ts` and
`src/lib/theme/examples/terminal/terminal.config.ts` (move `dark:` →
`themes: { dark: … }`); `src/lib/cli/main.ts`; `src/lib/config/config.spec.ts`
(drift bytes — `pnpm gen:tokens` must be rerun and `tokens.css` recommitted);
`src/lib/theme/examples/examples.spec.ts`; `src/lib/utils/contrast.spec.ts`;
`src/lib/exports.spec.ts`; `README.md`; and amendment notes on specs/29, 30, 42
recording that `dark` is now `themes.dark` and why.

---

### Edge cases

| Case | Expected |
|---|---|
| Nested themed sections | Inner wins by normal inheritance; no special handling. |
| `theme('light')` under a system-dark, unset root | Restores light — R3's block beats inherited values. |
| Attachment on an element that already has `data-theme` | Attachment owns the attribute while mounted; prior value restored on teardown. |
| Unknown theme name | Inert. No warning (R5), no throw. |
| Object form, teardown before the dynamic import resolves | Disposed flag wins; no properties are set. |
| Two `themes` entries wanted at once | Impossible by design (one slot). Author the combination as its own entry. |
| Reduced motion | Unchanged — the flip transition stays app-level and stays gated. |
| SSR | String form is SSR-able if the consumer writes the attribute in markup; the attachment itself is client-only, so an inline-object section paints unthemed for one frame. Documented ceiling, not engineered around. |

### Out of scope

- A theme **switcher component** — user decision, 2026-07-28: the docs header's
  existing icon Button is the demonstration, and no new component is warranted.
- A theme × mode **matrix** (two attribute slots) — rejected with the one-slot
  decision.
- The scrollable **swatch rail** — revisit as a docs Pattern once this lands.
- SSR of the inline-object form.
- Runtime contrast grading of inline objects.

### Write scope

`src/lib/config/{schema,generate,report}.ts`, `src/lib/attachments/theme.ts`
(new) + spec, `src/lib/index.ts`, `src/lib/tokens/tokens.css` (regenerated —
never hand-edited), `src/lib/theme/examples/{ocean.config.ts,
terminal/terminal.config.ts}` + their regenerated sheets, `src/lib/cli/main.ts`,
`src/app.html`, `src/routes/+layout.svelte`, the new docs page + its manifest
entry, Getting Started, `README.md`, the spec amendments in R9, and the test
files listed in R9.
