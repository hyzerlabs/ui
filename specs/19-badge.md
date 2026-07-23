# Badge Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Badge-Rn`) and edge case as pass/fail. Write scope for the
> Builder is the library source (`src/lib/**`).

### Goal

Ship one headless Svelte 5 `Badge` component: a small inline status/label
chip with intent coloring, three visual variants, two sizes, and an optional
dismiss affordance. Badge is deliberately general-purpose — status markers,
counts, tags — and is the building block for **Combobox selected-option
chips** (the dismissible form) when that component lands. Presentational by
default: plain inline content with `hz-*`/`data-*` hooks; all colors and
chrome are the reference theme's job.

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. One file:
  `src/lib/components/Badge.svelte`, exported from the barrel; assertion in
  `exports.spec.ts`.
- Intent vocabulary **reuses the shared `Intent` type** (`$lib/types`) plus a
  `'neutral'` default: `BadgeIntent = 'neutral' | Intent`. Every intent
  resolves through its `--hz-intent-*` role token (`specs/15-tokens.md`,
  2026-07-13 amendment) — a theme retargets status colors there without
  touching the palette (theme concern).
- Variants are Badge-specific (`'soft' | 'solid' | 'outline'`) — the shared
  `Variant` type's `ghost`/`link` values are meaningless for a chip, and
  `soft` (tinted background) is the natural badge default, which `Variant`
  lacks. Do **not** widen the shared type.
- **Promotes a shared `Rounded` type** to `$lib/types` mirroring the full
  radius token scale: `'none' | 'sm' | 'md' | 'lg' | 'full'`. Badge is its
  first consumer; Card (local `CardRounded`, missing `'full'`) and Image
  (local `boolean | …` union) should migrate to it in a follow-up so every
  `rounded` prop in the library speaks the same values.
- Mirror existing patterns: `$props()` destructuring, `class: className` via
  `cx`, `...rest`-first spread on the root (managed attributes win).

### Props

| Prop           | Type                              | Default      |
| -------------- | --------------------------------- | ------------ |
| `children`     | `Snippet`                         | _required_   |
| `intent`       | `'neutral' \| Intent`             | `'neutral'`  |
| `variant`      | `'soft' \| 'solid' \| 'outline'`  | `'soft'`     |
| `size`         | `'sm' \| 'md'`                    | `'md'`       |
| `rounded`      | `Rounded`                         | `'full'`     |
| `onDismiss`    | `(() => void) \| undefined`       | —            |
| `dismissLabel` | `string`                          | `'Remove'`   |
| `class`        | `string` (→ `cx`)                 | —            |

Plus arbitrary `...rest` forwarded onto the root `<span>` (managed attributes
win).

### Requirements

1. **Badge-R1 — Structure.** Renders
   `<span class="hz-badge" data-intent={intent} data-variant={variant}
   data-size={size}>` wrapping `{@render children()}`. A `<span>`, not a
   block: badges flow inline with text. No implicit ARIA role — a badge is
   plain inline content; consumers add semantics where needed.
2. **Badge-R2 — Data hooks.** `data-intent`/`data-variant`/`data-size`/
   `data-rounded` are always present (including defaults) so the theme and
   consumer CSS can target every combination without class variants
   (`data-rounded` mirrors Card's existing hook). `data-dismissible` is
   present (empty) exactly when `onDismiss` is provided.
3. **Badge-R3 — Dismiss affordance.** When `onDismiss` is provided, a
   trailing `<button type="button" class="hz-badge-dismiss"
   aria-label={dismissLabel}>` containing the decorative `IconX` renders
   after the content; activating it calls `onDismiss()`. When absent, no
   button renders. The default `'Remove'` label is ambiguous among several
   chips — consumers rendering lists (e.g. Combobox) **must** pass a
   per-item `dismissLabel` such as `"Remove {option}"`; the docs and the
   Combobox spec carry this requirement forward.
4. **Badge-R4 — Color is never the only signal.** The badge's text content
   carries the meaning; intent color is reinforcement. (Consumer content
   concern — the docs demos model it; nothing to enforce in code.)
5. **Badge-R5 — class & rest.** Root class is `cx('hz-badge', className)`;
   `...rest` spreads first so managed attributes (`class`, `data-*` hooks)
   win.
6. **Badge-R6 — Barrel export.** `Badge` exported from
   `src/lib/components/index.ts`; `import { Badge } from '$lib'` resolves;
   assertion + smoke render in `exports.spec.ts`. `Rounded` exported from
   `$lib/types`.
7. **Badge-R7 — Structural CSS only.** Scoped styles: root
   `display: inline-flex; align-items: center` with a token gap, and the
   dismiss button as an inline-flex, cursor-pointer reset. **No** colors,
   padding, radius, or typography — theme (`theme/badge.css`, in
   `@layer hz-theme`, imported by `theme.css`): `data-rounded` maps 1:1 to
   the radius tokens (`none`/`sm`/`md`/`lg`/`full`), size-keyed
   padding/font-size (`sm`/`md`), per-intent color via a `--_c` custom
   property switched on `data-intent` to the matching `--hz-intent-*` role
   token, variants — `soft` = tinted `color-mix` background, `solid` = filled
   with `--hz-color-white` text, `outline` = mixed border + tinted text —
   and the dismiss button (icon sized via `1em`, hover tint, focus ring via
   the shared ring treatment).

### Accessibility (WCAG 2.1 AA)

- The badge itself is inline text — announced as part of the surrounding
  content, no role, no label (1.3.1). Never rely on the intent color alone
  (1.4.1); the text carries the meaning.
- The dismiss button is a real button with an explicit `aria-label`
  (`dismissLabel`); the icon is decorative (4.1.2). Per-item labels are the
  consumer's responsibility in lists (Badge-R3).
- Theme contrast: `soft`/`outline` text colors mix the intent color toward
  the text token so they hold up on both light and dark surfaces.

### Edge Cases & Error States

| Case                              | Expected behavior                                                    |
| ---------------------------------- | -------------------------------------------------------------------- |
| No `onDismiss`                     | No button, no `data-dismissible` (Badge-R2/R3).                       |
| `onDismiss` provided               | Button renders, click calls it once per activation (Badge-R3).        |
| Defaults                           | `data-intent="neutral" data-variant="soft" data-size="md" data-rounded="full"` (Badge-R2). |
| `...rest` attempts `class`/`data-intent` | Component-managed value wins (Badge-R5).                        |
| Badge inside flowing text          | Renders inline without breaking the line box (Badge-R1).              |

### Test Plan

`src/lib/components/Badge.svelte.spec.ts` (browser project): structure (span,
content rendered, inline default hooks); every `intent`/`variant`/`size`
value reflects into its data attribute; dismiss — absent by default, button
with `aria-label` when provided, click fires `onDismiss`, `data-dismissible`
present; class merge + rest forwarding with managed-wins; barrel export +
smoke render.

### Out of Scope

- Linked badges (`href`) — wrap or compose with `Link`.
- Dot-only / numeric-overflow ("99+") counters, animation, and removable-tag
  keyboard patterns beyond the button (Combobox owns chip-list focus
  management).
- Auto-deriving the dismiss label from children content.

### Amendments

- **2026-07-22 (audit R9):** `neutral` folded into the `IntentRegistry`
  itself — `Intent` now includes it, and the per-component
  `'neutral' | Intent` unions this spec introduced (`BadgeIntent`, later
  copied by Button/Alert/icons) collapse to plain `Intent`. `BadgeIntent`
  survives as an alias. `DropdownTriggerProps.intent`'s inlined copy had
  drifted to a stale 4-value subset — now `Intent` as well.
