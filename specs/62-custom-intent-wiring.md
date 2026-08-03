# 62 — Custom intent wiring (a registered intent works everywhere)

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. **Builds on `specs/29-token-engine.md`
> (the config engine and its emission model), `specs/30-theming.md` /
> `specs/42-palette-split.md` (the palette → role → intent layering) and
> `specs/44-utilities.md` (the generator's existing per-intent class emission)
> and does not restate them.** Nothing about the built-in intents changes: every
> component × intent × variant must compute to the same color after this change
> as before it.

### Goal

Make a consumer-registered intent a first-class intent **everywhere**, including
the reference theme's per-component color switches. Today `tokens.intent.fairway`
in `hyzer.config.ts` emits `--hz-intent-fairway`, gets contrast-graded, and
type-checks through `IntentRegistry` augmentation — but `<Badge intent="fairway">`
still renders neutral, because the reference theme hardcodes one rule per
component per intent. After this spec, `hyzer generate` emits that wiring, and the
consumer writes zero CSS.

Origin (2026-08-03): a consumer migration had to hand-write unlayered
`[data-intent='x'] { --_c: var(--hz-intent-x); }` rules to get its brand intent to
paint — and because the private switch hook is not the same variable in every
component, those rules only reached three of the six.

### Context & Conventions

- **The bug in one line.** Six reference-theme sheets switch color on
  `data-intent`, using **four different private hooks**: `--_c`
  (badge/alert/blockquote), `--hz-button-accent` (button), `--hz-banner-bg`
  (banner), `--hz-loading-fill` (loading). Every switch is a hardcoded rule per
  known intent name, so an unknown name silently falls through to the component's
  base color.
- **Precedent for the fix.** `generateUtilitiesCss` already emits one class per
  *resolved* intent, custom ones included (`src/lib/config/generate.ts`), and
  `src/lib/config/report.ts`'s `softTints` model already mirrors reference-theme
  knowledge inside the engine. This spec adds a second, smaller mirror: the name
  of one private switch hook.
- **Icon is already correct and is not in scope.** `scripts/gen-icons.ts` resolves
  intent component-side (`style="color: var(--hz-intent-<name>)"`), so icons work
  with any intent today. That approach does **not** generalize to the other six
  (Non-goals).
- **Two audiences for the emitted CSS.** The reference theme is layered
  (`@layer hz-theme`); a replacement theme (the Terminal example) is unlayered and
  authors its own intent rules. R2's cascade posture is chosen so the wiring
  reaches the first and never overrules the second.

---

### Requirements

**R1 — One switch hook across the reference theme.** Every reference-theme
component that switches color on `data-intent` switches the single private hook
`--_c`. Three sheets change; the public hooks they expose today stay public, as
one-line aliases in the same base rule:

| Sheet | Base rule gains | The 6 `[data-intent=…]` rules |
| --- | --- | --- |
| `button.css` `.hz-button` | `--_c: var(--hz-intent-primary, #2563eb);` then `--hz-button-accent: var(--_c);` | switch `--_c` instead of `--hz-button-accent` |
| `banner.css` `.hz-banner` | `--_c: var(--hz-intent-neutral, #6b7280);` then `--hz-banner-bg: var(--_c);` | switch `--_c` instead of `--hz-banner-bg` |
| `loading.css` `.hz-loading` | `--_c: var(--hz-intent-primary, #2563eb);` then `--hz-loading-fill: var(--_c);` | switch `--_c` instead of `--hz-loading-fill` |

`badge.css`, `alert.css` and `blockquote.css` already switch `--_c` and are
untouched. Everything downstream keeps reading the public hook
(`var(--hz-button-accent)`, `var(--hz-banner-bg)`, `var(--hz-loading-fill)`) — only
where the value *comes from* changes.

Three invariants the Reviewer checks:

- **Public hooks are unchanged as a contract.** They are still declared on the
  component root at the same specificity, so every consumer rule that sets them
  (`.my-card .hz-button { --hz-button-accent: … }`, `banner.css`'s retarget of a
  nested Button) wins exactly as it does today. A consumer who sets
  `--hz-button-accent` never has to know `--_c` exists.
- **No inheritance leak.** Every rule that *reads* `var(--_c)` sits inside a
  subtree whose root rule *declares* `--_c`. `--_c` is an inherited custom
  property, so this is what stops an ancestor's `--_c` (a themed Alert, or a
  consumer's `data-intent` wrapper) from recoloring a nested component that never
  opted in.
- **Byte-for-byte color parity for built-ins.** No computed color changes for any
  component × built-in intent × variant × mode. The existing suites are the gate:
  `src/lib/theme/theme.svelte.spec.ts` (soft tints), `Banner.svelte.spec.ts`'s
  `--hz-banner-bg`/`--hz-banner-fg` test, `Loading.svelte.spec.ts`. One existing
  assertion changes shape, not meaning: `src/lib/theme/reducedMotion.spec.ts`
  pins the literal string `--hz-loading-fill: var(--hz-intent-primary, #2563eb);`
  as ungated — it now pins the two declarations that replace it, both still
  outside any `prefers-reduced-motion` block.

**R2 — `hyzer generate` emits the switch rule for every custom intent.**
`generateCss` appends, at the **end** of the sheet in **both** `full` and
`overrides` mode, one rule per custom intent under a section banner:

```
:where([data-intent='fairway']) {
	--_c: var(--hz-intent-fairway);
}
```

Locked details, each independently checkable:

- **Which intents.** A **custom** intent is one whose key is not in the library's
  base intent vocabulary (`src/lib/tokens/index.ts`'s `intent` metadata) — i.e. a
  key the config *added*, not one it re-valued. `fromConfig` alone is the wrong
  test: it is also true for `tokens.intent.neutral: 'var(--hz-color-text-muted)'`
  (the Ocean example), a remap of a built-in the theme already wires. Sources
  scanned: the `intent` section plus every theme's `intent` list (a theme may
  introduce an intent the root never declares). Deduplicated by key, emitted in
  discovery order: root section first, then themes in declaration order. A config
  with no custom intents emits **nothing** — the committed `tokens.css`,
  `utilities.css` and `ocean.css` are byte-identical after this change.
- **Value.** `var(--hz-intent-<kebab-name>)`, no literal fallback: the sheet that
  carries the rule also declares the token, and a name that resolves nowhere
  should fail loudly rather than paint a plausible wrong color. Per-theme remaps
  need no further rules — the switch points at the token, and each
  `[data-theme=…]` block retargets it (this is why dark and named themes need
  nothing here).
- **Selector.** `:where([data-intent='<key>'])`, at the sheet's scope (below).
  **The attribute value is the raw config key; the custom property is the
  kebab-cased name** — they differ for a camelCase key, so when
  `key !== toKebab(key)` the rule carries **both** attribute forms as a
  two-selector list (one per line), because either is a plausible thing to pass to
  `intent=`:
  ```
  :where([data-intent='brandRed']),
  :where([data-intent='brand-red']) {
  	--_c: var(--hz-intent-brand-red);
  }
  ```
- **Cascade posture: unlayered, zero specificity.** Unlayered author styles
  outrank *every* layer, so the rule beats the whole `@layer hz-theme` reference
  theme regardless of import order — which is the point: the tokens sheet is
  normally imported *before* the theme, so a layered emission would lose to
  `.hz-badge`'s base declaration and would silently depend on consumer import
  order. `:where()` then drops it to specificity 0,0,0, so **any** rule the
  consumer writes — layered or not, at any specificity — outranks it. Same posture
  and same rationale as the utilities sheet (`specs/44`, "a deliberately-applied
  utility beats the layered reference theme"). Consequence, and intended: a
  replacement theme that declares its own base at non-zero unlayered specificity
  (`.hz-theme-terminal .hz-badge { --_c: … }`) keeps full authorship of its
  intents; the generated wiring serves the reference theme.
- **Scoped sheets.** When `GenerateOptions.selector` is not `:root`, each rule is
  scoped to it as a two-selector list, one per line — the descendant case and the
  scope-element-itself case, mirroring `themeSelector()`'s existing shape and its
  Prettier rationale (committed sheets must survive `prettier --check .`):
  ```
  :where(.hz-theme-terminal [data-intent='phosphor']),
  :where(.hz-theme-terminal[data-intent='phosphor']) {
  	--_c: var(--hz-intent-phosphor);
  }
  ```
  Reuse: generalize `themeSelector()` (or add its sibling) rather than writing a
  second copy of the compound/descendant pair.
- **Determinism.** Same resolved config → same bytes, the engine's standing rule.

**R3 — A coverage guard, so this cannot regress.** A new unit spec
(`src/lib/theme/intents.spec.ts`, server project) reads every sheet in
`src/lib/theme/components/` (examples/ excluded — replacement themes author their
own) and asserts, for each rule whose selector contains `[data-intent=` and **not**
`[data-intent-scope=`:

1. its declaration block sets `--_c`, and sets no other intent color hook; and
2. the sheet's root rule for that component class also declares `--_c` (the
   no-leak invariant of R1).

This is the regression that produced the bug: a new intent-taking component that
introduces its own switch hook fails this test at the moment it ships, instead of
shipping a component that quietly ignores custom intents. Failure message names
the file, the selector, and `--_c`.

**R4 — Docs and comment follow-through.** Consumer framing throughout — no spec
numbers, no R-numbers, no test-gate or process language.

- **`src/routes/docs/foundation/colors/+page.svelte`** — the "Add your own intents"
  Alert currently lists two steps (define the token, augment the type). It gains
  the third, as a *non*-step: with the reference theme, `hyzer generate` wires the
  intent into every component that takes one, so there is no CSS to write.
- **`src/routes/docs/theming/examples/+page.svelte`** — "Growing the vocabulary"
  step 3 ("Style it with one rule") is now wrong for reference-theme users. Rewrite
  it: with the reference theme there is nothing to write; the `registryStyleCode`
  block stays, re-framed as what a **standalone** theme like Terminal does, since
  such a theme owns its own intent rules.
- **`src/lib/cli/config-template.js`** — the `intent:` line's trailing comment
  notes that an added intent is wired into every component (the template is shared
  with the Config docs page, so both update from the one edit).
- **`src/lib/theme/components/button.css`** — the comment above the `warning`
  rule tells consumers to "add the one rule" per component per intent. Replace it:
  the built-ins are mapped here, and a config-registered intent is wired by
  `hyzer generate`.
- **`src/lib/theme/examples/terminal/components/button.css`** — Terminal **keeps**
  its hand-written `phosphor`/`amber` rules (it is a standalone theme; R2's
  zero-specificity wiring deliberately loses to it). Its comment is corrected to
  say that: a theme that replaces the reference theme maps its own intents, which
  is exactly what these two rules demonstrate.
- `src/lib/theme/examples/terminal/intents.d.ts` needs no change — it already
  describes only the type half.

**R5 — Banner's nested-Button retarget actually applies.** `banner.css`'s
`.hz-banner :where(.hz-button)` rule (the fg/bg retarget that keeps action
buttons legible on the intent fill) never wins today: `banner.css` imports
before `button.css`, so the Button root's equal-specificity (0,1,0)
declarations beat it on source order — the same trap the adjacent link rule
documents and dodges with `:is()`. Fix it the same way: `:where(.hz-button)`
becomes `:is(.hz-button)` (0,2,0). Post-R1 the retarget still sets the
**public** hooks (`--hz-button-accent`, `--hz-button-on-accent`), which
outrank Button's own `--hz-button-accent: var(--_c)` alias — so it also beats
a nested Button's explicit `intent=` switch, which is the rule's stated
purpose. This is a deliberate visual change: a Button inside a Banner now
paints in the banner's fg/bg pair as the comment always claimed.

---

### Edge cases

| Case | Expected |
| --- | --- |
| No config / no custom intents | Zero emitted rules; `tokens.css`, `utilities.css`, `ocean.css` byte-identical. |
| Built-in re-valued (`intent: { neutral: … }`, the Ocean config) | No rule — the theme already wires `neutral`. |
| Custom intent, `full` mode | One rule at the end of the sheet. |
| Custom intent, `overrides` mode | Same rule, same place. |
| Custom intent, scoped sheet (`selector: '.hz-theme-terminal'`) | The two-selector scoped pair. `terminal.tokens.css` regenerates (`pnpm gen:tokens`) and gains four rules for `phosphor`/`amber`; its drift test then passes. |
| camelCase key (`brandRed`) | Two attribute selectors (`brandRed`, `brand-red`), one `var(--hz-intent-brand-red)`. |
| Intent added only under `themes.x.intent` | One rule, emitted once. Inside that theme it resolves; outside it the token is undefined and the color does not paint — the same loud failure as any undefined token. |
| Same intent in root and a theme | Exactly one rule (dedup by key). |
| Custom intent + dark, or + a named theme | No extra rules: the switch reads `var(--hz-intent-<name>)`, which the theme block retargets. |
| `<Badge intent="fairway" variant="soft">` | Soft tint mixes the custom intent through `--hz-badge-tint`, and the contrast report already grades it. |
| `<Blockquote intent="fairway" intentScope="full">` | Accent line **and** quote text take the custom color — `--_tc: var(--_c)` picks it up with no extra emission. |
| `<div data-intent="fairway">` wrapping a plain `<Badge>` | Badge stays neutral. The wrapper's `--_c` inherits, but Badge's own base declaration wins on the Badge element (R1's no-leak invariant). |
| Custom intent under the Terminal (standalone) theme | Terminal's own rules win; where Terminal maps nothing, its base color holds. Unchanged from today. |
| `<Button intent="fairway">` inside a `<Banner>` | The banner's retarget wins (R5): the button paints in the banner's fg/bg pair, custom and built-in intents alike. |
| Icon with a custom intent | Already worked (component-side inline color); the emitted `--_c` on the `<svg>` is inert. |
| A consumer rule `.hz-button[data-intent='fairway'] { --hz-button-accent: … }` | Wins — the emitted rule is zero-specificity and unlayered. |

### Existing code to reuse

- **`generateUtilitiesCss`'s per-intent loop** (`src/lib/config/generate.ts`) — the
  precedent for iterating resolved intents in the generator, and for the
  `utilityRule()`-style single-rule string helper.
- **`themeSelector()`** (same file) — the scoped compound + descendant selector
  pair, one selector per line, and the Prettier reasoning behind it. Generalize it;
  do not copy it.
- **`toKebab()`** from `src/lib/config/schema.ts` for the custom-property name; the
  raw `TokenEntry.key` for the attribute value.
- **The base intent metadata** in `src/lib/tokens/index.ts` (already imported by
  `schema.ts`) as the built-in vocabulary R2 subtracts.
- **`src/lib/theme/theme.svelte.spec.ts`'s `mount()` / `resolveColor()` helpers**
  and its per-sheet imports for the computed-style test.
- **`scripts/gen-tokens.ts` / `pnpm gen:tokens`** to regenerate the committed
  example sheets; the drift tests in `src/lib/config/config.spec.ts` and
  `src/lib/theme/examples/examples.spec.ts` are the gate.

### Test plan

Runner: **Vitest**, both existing projects — `server` (node) for generator output
and source scans, `client` (chromium, Playwright provider) for computed styles.

**Unit (server) — `src/lib/config/config.spec.ts`:**

- `tokens.intent: { fairway: 'var(--hz-palette-primary)' }` in `full` mode emits
  exactly `:where([data-intent='fairway']) {\n\t--_c: var(--hz-intent-fairway);\n}`;
  the same config in `overrides` mode emits the same rule.
- `resolveConfig()` with no config emits no `[data-intent=` rule at all (and the
  existing `tokens.css` drift test stays green — the proof of "nothing changed for
  everyone else").
- A built-in remap (`intent: { neutral: … }`) emits no rule.
- A camelCase key emits both attribute forms and the kebab custom property.
- An intent declared only under `themes.x.intent` emits one rule; declared in both
  root and a theme, still one.
- Scoped `overrides` mode emits the two-line scoped pair for the custom intent.
- The rule is the last thing in the sheet, and the output is stable across two
  calls.

**Unit (server) — `src/lib/theme/intents.spec.ts` (new):** R3's coverage guard.

**Unit (client) — `src/lib/theme/theme.svelte.spec.ts`:** the "identical to a
built-in" proof. Inject `generateCss(resolveConfig({ tokens: { intent: { fairway:
'#b91c1c' } } }), { mode: 'overrides' })` into a `<style>` element (the custom
intent is given the *same value as the built-in `danger`*), import the six
component sheets, and for each component mount two roots — one
`data-intent="danger"`, one `data-intent="fairway"` — and assert the painted
property is identical:

| Component | Element / property compared |
| --- | --- |
| Badge (`data-variant="solid"`) | root `background-color` |
| Alert | root `background-color` (the soft mix) |
| Banner | root `background-color` |
| Button (`data-variant="solid"`) | root `background-color` |
| Blockquote | `.hz-blockquote-quote` `border-inline-start-color` |
| Loading | `.hz-loading-dot` `background-color` |

Plus one negative: a `.hz-badge` (no `data-intent`) inside a
`<div data-intent="fairway">` computes the neutral background, not the custom one.

For R5: a solid Button mounted inside a Banner computes
`background-color` equal to the banner's `--hz-banner-fg` resolution (and a
Button mounted alone does not) — importing both sheets in banner-then-button
order, matching `theme.css`.

**Not covered here:** no e2e. The behavior is entirely CSS resolution, which the
computed-style test measures directly in a real browser.

### Non-goals

- **Resolving intent inline from the component**, the way Icon does
  (`style="color: var(--hz-intent-<name>)"`). It would need no generator at all,
  but an inline declaration outranks every consumer stylesheet, so it would make
  the six components' intent colors *less* themeable than they are today — and it
  puts theme knowledge back into headless components. Icon gets away with it
  because intent there means exactly one property (`color`) and consumer `style`
  is appended after it.
- **A per-component mapping table in the generator** (class → private hook). It
  works without touching theme CSS, but it couples the engine to six class names
  *and* four variable names forever, and it emits six rules per intent instead of
  one. R1's unification is a smaller, one-time cost.
- **Wiring intents into a standalone/replacement theme.** By construction the
  emitted rule loses to one; that theme owns its intent vocabulary (Terminal is
  the worked example).
- **Runtime-only intents through `themeVars()` / the `theme()` attachment.** That
  path writes custom properties onto one element and cannot carry a selector rule,
  so an intent that exists only in a runtime override is still unwired. Out of
  scope; the config path is the supported one.
- **Validating intent key characters.** A key that is not a safe CSS identifier
  now also lands in a selector, not just a property name. Pre-existing exposure
  across the whole engine (`toKebab` assumes sane keys); not addressed here.

### Write scope

`src/lib/config/generate.ts`; `src/lib/config/config.spec.ts`;
`src/lib/theme/components/button.css`, `banner.css`, `loading.css`;
`src/lib/theme/intents.spec.ts` (new); `src/lib/theme/theme.svelte.spec.ts`;
`src/lib/theme/reducedMotion.spec.ts` (one pinned string);
`src/lib/theme/examples/terminal/terminal.tokens.css` (regenerated, not
hand-edited) and `src/lib/theme/examples/terminal/components/button.css` (comment
only); `src/lib/cli/config-template.js` (one comment);
`src/routes/docs/foundation/colors/+page.svelte`;
`src/routes/docs/theming/examples/+page.svelte`. No new dependencies, no new
public exports, no component (`.svelte`) changes.
