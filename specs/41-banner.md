# Banner Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Banner-Rn`) and edge case as pass/fail. Write scope for the
> Builder is the library source (`src/lib/**`) plus the docs additions named in
> Banner-R11/R12.

### Goal

Ship one headless Svelte 5 `Banner` component: a **full-width, solid-intent
announcement bar** with accessible text on top, an optional dismiss button, and
optional pinning to the top or bottom of the page. Banner is Alert's louder
sibling — where Alert is a soft, inline feedback box, Banner is a bold,
edge-to-edge site-wide message (maintenance notice, promo, cookie/consent bar,
outage). Announcement semantics are the consumer's, exactly as Alert: a
statically rendered bar is plain content; live-region roles ride `...rest`.
The reference theme guarantees WCAG AA (≥ 4.5:1) for the text on every intent's
solid background, in both light and dark modes.

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. One file:
  `src/lib/components/Banner.svelte`, exported from the barrel; assertion in
  `exports.spec.ts`.
- **Intent scale is the shared `Intent` type** (`$lib/types`), default
  `'neutral'` — every value resolves through its `--hz-intent-*` role token.
  `neutral` is a full member of `Intent` since the 2026-07-22 audit fold; do
  **not** invent a `'neutral' | Intent` union or a Banner-only intent type.
- **No `variant`.** Solid is the whole point of Banner — a filled bar with
  on-accent text. Alert already covers the soft/tinted treatment; Badge covers
  soft/solid/outline chips. Banner ships exactly one look.
- **No `rounded`.** A full-width bar is square by contract; corner radius on an
  edge-to-edge element is meaningless. No `data-rounded` hook.
- **Dismiss API matches Badge/Alert**: `onDismiss`/`dismissLabel`
  (default `'Dismiss'`). Controlled — activating the button calls `onDismiss()`;
  the consumer owns visibility. The Banner never hides itself and keeps no
  internal dismissed state.
- **Solid contrast mechanism reuses Button's.** The reference `button.css`
  paints solid fills as `background: var(--hz-button-accent)` /
  `color: var(--hz-button-on-accent)`, where `--hz-button-on-accent` defaults to
  `var(--hz-color-surface)` (**not** white) so the text colour flips with the
  mode and stays ≥ 4.5:1 in both. Banner adopts the identical recipe under
  `--hz-banner-bg` / `--hz-banner-fg`. This is the same pairing the token
  engine's `contrastReport` already grades as `solid:intent-<name>`
  (`src/lib/config/report.ts`), so the AA gate in `examples.spec.ts` covers
  Banner's fg/bg with **no new report rows** (Banner-R9).
- **Pinning lives in the component's structural CSS, per Header.** `Header.svelte`
  ships `position: sticky; top: 0; z-index: …` in its own scoped `<style>`, not
  in the theme (`src/lib/components/Header.svelte`). Banner follows suit:
  `position: sticky` and the offset/z-index are structural (positioning is
  behaviour, not paint); only colour is the theme's. The pin z-index is the new
  `--hz-z-sticky` token (Banner-R13) — **no raw z-index values anywhere.**
- **Docs audit (specs/40) is in flight.** Banner's docs page must follow the
  *current* conventions the audit has settled: a `ComponentDoc` data module
  (`src/docs/data/banner.ts`), `DocPage` + `Example` blocks with reactive code
  strings, the class-row note where a class rides another component, tab-notes
  as prose, `a11yLinks` including the relevant WCAG/MDN references, and a Theme
  hooks table sourced from `src/docs/hooks.ts`.
- Mirror existing patterns: `$props()` destructuring, `cx`, `uid` only if an id
  is cross-referenced, `<svelte:element>` for the polymorphic root,
  `...rest`-first spread on the root (managed attributes win).

### Props

| Prop           | Type                        | Default       |
| -------------- | --------------------------- | ------------- |
| `children`     | `Snippet`                   | _required_    |
| `intent`       | `Intent`                    | `'neutral'`   |
| `pin`          | `'top' \| 'bottom'`         | — (static)    |
| `icon`         | `Snippet`                   | — (decorative)|
| `actions`      | `Snippet`                   | — (trailing)  |
| `onDismiss`    | `(() => void) \| undefined` | —             |
| `dismissLabel` | `string`                    | `'Dismiss'`   |
| `as`           | `string`                    | `'div'`       |
| `class`        | `string` (→ `cx`)           | —             |

Plus arbitrary `...rest` forwarded onto the root — notably `role`, `tabindex`,
and `aria-*` are **unmanaged** so consumers control announcement and focus
semantics (see Banner-R4). `...rest` spreads first; managed attributes
(`class`, `data-*`) win.

### Requirements

1. **Banner-R1 — Structure.** Renders
   `<svelte:element this={as} class="hz-banner" data-intent={intent}>`
   (default `as='div'`) containing, in order:
   - when `icon` is set: `<span class="hz-banner-icon" aria-hidden="true">`
     wrapping it (decorative — the text carries the meaning);
   - `<div class="hz-banner-content">` wrapping `{@render children()}`;
   - when `actions` is set: `<div class="hz-banner-actions">` wrapping it
     (trailing slot for a Link/Button such as "Learn more");
   - when `onDismiss` is set: `<button type="button" class="hz-banner-dismiss"
     aria-label={dismissLabel}>` with the decorative `IconX`; activation calls
     `onDismiss()`.

2. **Banner-R2 — Data hooks.** `data-intent` is always present (including the
   `neutral` default). `data-pin` is present with the value `'top'` or
   `'bottom'` **only** when `pin` is set; a static Banner stamps **no**
   `data-pin` (so `:not([data-pin])` selects the static form).
   `data-dismissible` is present (empty) exactly when `onDismiss` is provided.
   No `data-rounded`, no `data-variant`.

3. **Banner-R3 — Pinning (structural).** When `pin` is set, the component's own
   scoped CSS applies `position: sticky` with `top: 0` for `pin='top'` and
   `bottom: 0` for `pin='bottom'`, plus `z-index: var(--hz-z-sticky, 100)` so
   the bar sits above normal flow content (Banner-R13). Sticky keeps the Banner
   **in flow** — nothing beneath it is overlapped, and the consumer needs no
   scroll-padding bookkeeping. A consumer wanting viewport-fixed behaviour
   overrides `position` via their own class (Banner-R7 escape hatch — see Edge
   Cases), not a prop. When `pin` is absent the Banner is static and spans the
   full inline size of its parent.

4. **Banner-R4 — Announcement is opt-in.** The component sets **no** `role` and
   no live-region attributes. A live role only announces content that appears
   dynamically; on a statically rendered site banner it is dead weight, and the
   wrong default (`role="alert"` = assertive) is worse than none. Consumers pass
   `role="status"` (polite) or `role="alert"` (assertive, sparingly) via
   `...rest` when inserting a Banner after load. The docs demo and a11y note
   model this. **There is deliberately no Toast component** (product decision):
   Banner is the sanctioned pinned/site-wide pattern; timed self-dismissing
   overlays fail WCAG 2.2.1 and routinely escape announcement.

5. **Banner-R5 — Dismiss.** Same contract as Badge/Alert: a real labelled
   `<button>`, decorative `IconX`, `onDismiss()` on activation, consumer-owned
   visibility. Default label `'Dismiss'`. When `onDismiss` is absent, no button
   and no `data-dismissible`.

6. **Banner-R6 — Polymorphic root.** `as` (default `'div'`) sets the root
   element via `<svelte:element>`, so a consumer can render the Banner as
   `<section>` or `<aside>` for landmark semantics without wrapping. `class`,
   `data-*`, and `...rest` all land on that element.

7. **Banner-R7 — class & rest.** Root class is `cx('hz-banner', className)`;
   `...rest` spreads first so managed attributes (`class`, `data-intent`,
   `data-pin`, `data-dismissible`) win. A `role`/`tabindex`/`aria-*` in `...rest`
   passes through untouched. Because the theme sheet is in `@layer hz-theme` and
   the consumer's `class` merges after `hz-banner` unlayered, consumer CSS wins
   any specificity tie — including overriding `position` for a viewport-fixed bar
   (Edge Cases).

8. **Banner-R8 — Structural CSS only (component).** Scoped styles carry
   **layout and positioning, no colour**: root as a full-width flex row
   (`display: flex; width: 100%; box-sizing: border-box;
   align-items: center;` with a token gap), content `flex: 1; min-width: 0`,
   actions and dismiss `flex-shrink: 0`, dismiss button an inline-flex
   cursor-pointer reset, and the pinning block from Banner-R3
   (`.hz-banner[data-pin] { position: sticky; z-index: var(--hz-z-sticky, 100) }`,
   `[data-pin='top'] { top: 0 }`, `[data-pin='bottom'] { bottom: 0 }`).
   **No** background, text colour, padding-scale chrome, borders, or font
   sizing — all of that is the theme.

9. **Banner-R9 — Solid intent paint (theme) + AA guarantee.** All colour lives
   in `src/lib/theme/components/banner.css`, in `@layer hz-theme`, imported by
   `theme.css` alphabetically (immediately after `badge.css` — "bad" < "ban").
   It:
   - declares the two documented hooks on `.hz-banner`:
     `--hz-banner-bg: var(--hz-intent-neutral, …)` and
     `--hz-banner-fg: var(--hz-color-surface, #ffffff)` — the Button
     `accent`/`on-accent` pattern, so the fg is the surface role (flips with the
     mode), never a blanket white;
   - switches `--hz-banner-bg` per intent via `:where([data-intent='…'])` rules
     to the matching `--hz-intent-*` role token, for the whole registry Button
     covers (primary, secondary, danger, warning, success, info; neutral is the
     base declaration) — the same 1:1 mapping `button.css` uses;
   - paints `background-color: var(--hz-banner-bg)` and
     `color: var(--hz-banner-fg)` on the root, plus block/inline padding from
     the space tokens;
   - ensures **links and buttons inside the bar** read on the solid fill: the
     content colour is inherited `--hz-banner-fg`; a `<Link>`/anchor inside the
     Banner is underlined (colour is never the only signal, 1.4.1) and inherits
     `--hz-banner-fg`; a `<Button>` in `actions` is retargeted with a
     `.hz-banner :where(.hz-button)` rule mapping `--hz-button-accent` /
     `--hz-button-on-accent` onto `--hz-banner-fg` / `--hz-banner-bg` so an
     outline/solid button stays legible against the intent background;
   - styles the dismiss button (icon sized `1em`, hover tint from
     `currentColor`, focus ring), per Alert's `.hz-alert-dismiss`.

   **AA is gated, not asserted anew.** Because `--hz-banner-fg` is
   `--hz-color-surface` and `--hz-banner-bg` is `--hz-intent-<name>`, Banner's
   text/background pairing **is** the `solid:intent-<name>` row already graded
   by `contrastReport` for every intent in both modes; `examples.spec.ts`
   already asserts zero `solid:` failures across ocean/sunset/terminal. The
   Builder must therefore keep Banner's recipe **identical** to that graded
   pairing (fg = surface, bg = intent token, **no extra colour-mix on the
   text**), and the recipe is pinned by a required unit test (Banner-R9 pin,
   Test Plan): `--hz-banner-fg` must resolve to the surface token and
   `--hz-banner-bg` to the intent token, mirroring the `softTints` pin in
   `report.ts`, so a future edit cannot silently break the assumption the AA
   gate relies on.

10. **Banner-R10 — Barrel export.** `Banner` exported from
    `src/lib/components/index.ts`; `import { Banner } from '$lib'` resolves;
    assertion + smoke render added to `src/lib/exports.spec.ts` (comment
    `// Banner-R10:`).

11. **Banner-R11 — Theme hooks entry.** Add a `Banner` entry to the `hooks`
    registry in `src/docs/hooks.ts` so `/components/banner` and
    `/theming/components` render its styling contract:
    - root `hz-banner`;
    - `attrs`: `data-intent` (`'neutral' | any registered intent` — "drives the
      solid fill via `--hz-banner-bg`; spans the intent registry"),
      `data-pin` (`'top' | 'bottom'` — "present only when pinned; sticks the bar
      to that edge via position: sticky"), `data-dismissible` (present when
      dismissible — only when `onDismiss` is set, per Banner-R2/R5; target it
      to style the dismissible form);
    - `props`: `--hz-banner-bg` (`<color> — default var(--hz-intent-neutral)`;
      the solid fill, switched per intent — override to restyle every intent's
      bar), `--hz-banner-fg` (`<color> — default var(--hz-color-surface)`;
      on-fill text colour, the surface role so it flips with the mode and keeps
      text ≥ 4.5:1 in both), and [amended 2026-07-23, user request] the sizing
      hooks `--hz-banner-padding-block` (default `1.5rem`) /
      `--hz-banner-padding-inline` (default `2.5rem`);
    - `parts`: `.hz-banner-icon`, `.hz-banner-content`, `.hz-banner-actions`,
      `.hz-banner-dismiss`, and [amended 2026-07-23] the opt-in
      `.hz-banner-title` convention class (the `.hz-card-title` precedent:
      Banner never emits it; the theme makes it block-level semibold so a
      consumer's lead element stacks over body copy without wrapper divs).
    `hooks.spec.ts` must pass — every documented hook must exist in source and
    every theme hook must be documented.

12. **Banner-R12 — Docs page + component-pairing cross-links.** New page
    `src/routes/components/banner/+page.svelte` using the docs scaffold
    (`DocPage`, `Example`, `Tabs`), driven by a new data module
    `src/docs/data/banner.ts` exporting `bannerDoc: ComponentDoc` (description,
    `importLine: 'import { Banner } from "@hyzer-labs/ui"'`, `props` table
    mirroring the Props section, `a11yNote`, `a11yLinks`). Demos, as tabs:
    - **Intents** — the solid bar across every intent (prose tab-note linking
      `/foundation/colors#intent`), code emitting `intent` only when non-default;
    - **Dismissible** — consumer-owned visibility (`$state`), a specific
      `dismissLabel`, and a "Restore it" affordance like the Alert page;
    - **With actions** — a Banner carrying an `actions` snippet (a `<Link>` or
      `<Button>` "Learn more") to show the trailing slot reading against the
      fill;
    - **Pinned** — demonstrate `pin` (a note explaining sticky, the
      focus-not-obscured tradeoff, and the viewport-fixed escape hatch);
    - a **"Don't show again" pattern** snippet (localStorage-gated render) shown
      as *code in the page*, modelling the consumer-owned persistence that is
      Out of Scope for the component.

    **Manifest:** add `{ label: 'Banner', href: '/components/banner' }` to the
    **Common** group in `src/docs/manifest.ts`, **alphabetically — immediately
    after `Badge` and before `Blockquote`** (Ban > Bad).

    **Component-pairing cross-links (both directions).** [Amended 2026-07-23,
    user decision: use the inline-Alert callout convention, not description
    clauses.] Following the house "X vs Y" pattern from the Table→Virtualized
    table and Select↔Combobox pages, each page opens with an
    `<Alert intent="info" title="X vs Y">` callout as the first child inside
    `DocPage`, carrying a real `<a>` link to the sibling page:
    - `/components/banner` opens with `title="Banner vs Alert"` — reach for
      Banner for a full-width, solid, page-level announcement (optionally
      pinned); when the message is a soft, inline, contextual one, use
      [Alert](/components/alert) instead.
    - `/components/alert` opens with `title="Alert vs Banner"` — reach for
      Alert when the message is soft, inline, and contextual; for a
      full-width, solid, page-level announcement you can pin, use
      [Banner](/components/banner) instead.
    The `description` strings in both data modules stay pairing-free — the
    callout owns the when-to-use guidance. Keep each callout to two sentences.

13. **Banner-R13 — Z-index tokenization (repo-wide).** Banner's pin forces a
    sticky z-index tier, and the project mandate is that **nothing in
    `src/lib` uses a raw z-index value** — every `z-index` reads a token from
    the `zIndex` scale. `tokens.css` is engine-generated from
    `src/lib/tokens/index.ts` (`gen:tokens`, pinned by the tokens drift test),
    so all scale changes are authored **at the source** (`tokens/index.ts`
    `zIndex` object), then `tokens.css` is regenerated:
    - **Add** `sticky: '100'` to `zIndex` → `--hz-z-sticky: 100`. Banner's pin
      and Header's sticky bar both use it (Header migrates off its raw `100`).
    - **Retire** `toast: '1200'` from `zIndex` (no Toast component ships; the
      token is dead). Remove the `--hz-z-toast` assertion in
      `src/lib/tokens/tokens.svelte.spec.ts` (currently asserts it resolves to
      `"1200"`) and add a `--hz-z-sticky` → `"100"` assertion in its place.
    - **Inventory and migrate every remaining raw `z-index` in `src/lib`** to a
      token. The complete current inventory (Builder confirms none are missed):

      | Location | Current | Nature | Migrate to |
      | -------- | ------- | ------ | ---------- |
      | `components/Header.svelte` | `z-index: 100` | sticky bar (global tier) | `var(--hz-z-sticky)` |
      | `components/Nav.svelte` | `z-index: 200` | dropdown panel that must clear sticky chrome | a tier above `sticky` (see scale note) |
      | `theme/components/table.css` | `z-index: 1` | sticky thead cell (local) | `var(--hz-z-raised)` |
      | `theme/components/field.css` | `z-index: 1`, `z-index: 2` | range-thumb overlap (local pair) | `var(--hz-z-raised)` and `calc(var(--hz-z-raised) + 1)` |
      | `components/LightboxOverlay.svelte` | `z-index: 1` | local layering | `var(--hz-z-raised)` |
      | `components/Hero.svelte` | `z-index: 0`, `z-index: 1` | bg vs content (local) | `var(--hz-z-base)` / `var(--hz-z-raised)` |
      | `components/Card.svelte` | `z-index: 0`, `z-index: 1` | overlay vs interactive (local) | `var(--hz-z-base)` / `var(--hz-z-raised)` |

      Already tokenized (leave as-is): `dropdown.css`, `combobox.css`
      (`var(--hz-z-dropdown)`).

    - **Keep the scale minimal — no unused tiers.** The distinct raw values
      found are `{0, 1, 2, 100, 200}`; combined with the existing kept tokens
      the resulting `zIndex` scale is:
      `base: 0`, **`raised: 1` (NEW)**, `dropdown: 10`, **`sticky: 100` (NEW)**,
      `overlay: 1000`, `modal: 1100`, plus the tier that covers Nav's `200`
      (a floating menu that outranks a sticky header). The Builder finalizes the
      Nav tier's **name** during the inventory — recommended `popover: 200`
      (menus/panels that must sit above sticky chrome, distinct from the
      in-flow `dropdown: 10` used by Combobox/Dropdown popups) — but it must be a
      named token, not raw, and must not duplicate an existing tier's value.
      The lone `2` in `field.css` is expressed as `calc(var(--hz-z-raised) + 1)`
      rather than a single-use `2` tier.
    - After migration, a repo grep for a bare `z-index:` followed by a number
      (i.e. not `var(--hz-z-*`/`calc(var(--hz-z-*`) in `src/lib` returns
      nothing, and the tokens drift test + `svelte-check` are green.

    This requirement is cross-cutting by design: it touches components beyond
    Banner because Banner is what forces the sticky tier, and the mandate is
    "no raw z-index anywhere."

### Responsive Behavior

Banner is fluid: it fills its parent's inline size at every breakpoint and
introduces no fixed widths. The flex row (icon · content · actions · dismiss)
wraps gracefully — on narrow viewports (<640px) the `actions` slot may drop
below the content; the theme controls this via `flex-wrap`/gap, and long message
text wraps rather than truncating. Padding uses logical properties
(`padding-block` / `padding-inline`) so RTL and vertical writing modes hold.
Pinning behaves identically at all breakpoints; the bar's height grows with
wrapped content, which is the intended sticky behaviour (the bar never clips its
own message). Nothing hides at any breakpoint — a site-wide notice must be
readable on mobile, tablet (640–1024px), and desktop (>1024px) alike.

### Accessibility (WCAG 2.1 AA)

- **Colour is never the only signal (1.4.1).** The message text carries the
  meaning; the intent colour is reinforcement, and the icon slot is decorative
  (`aria-hidden`). Links inside the bar are underlined, not colour-only.
- **Contrast (1.4.3).** Text on the solid fill is `--hz-banner-fg` =
  `--hz-color-surface`, the exact `solid:intent-<name>` pairing the token engine
  grades ≥ 4.5:1 in both modes (Banner-R9). Buttons/links inside inherit that
  foreground.
- **Announcement is opt-in (4.1.3).** Static banners are plain content in the
  outline. Dynamically inserted banners announce only when the consumer passes
  `role="status"`/`role="alert"` — modelled with a live demo. `as` lets a
  consumer render `<aside>`/`<section>` for a landmark where appropriate.
- **Dismiss (4.1.2).** A real labelled `<button>`; the icon is decorative.
  Dismissal is a consumer state change, so focus handling on removal is the
  consumer's concern (the docs demo restores focus sensibly).
- **Focus not obscured (2.4.11, WCAG 2.2 — noted as forward-looking).** A
  **pinned** bar can cover a focused element that scrolls under it. The spec
  requires the docs to (a) recommend keeping pinned banners short (one line
  where possible), and (b) note that consumers with in-page anchor targets
  should add `scroll-margin-block-start`/`-end` equal to the banner height so
  focused/scrolled-to targets clear the bar. Banner itself sets no
  `scroll-margin` on the page — it cannot know the consumer's targets — but the
  tradeoff is documented, not silent. This is the a11y cost of pinning and the
  reason sticky (in-flow) is chosen over `fixed` (which would also require
  scroll-padding on the scroll container).
- **Reduced motion.** Banner ships no entrance/exit animation of its own;
  sticky repositioning is not animated. Nothing to gate under
  `prefers-reduced-motion`.

### Edge Cases & Error States

| Case                                   | Expected behavior                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| Defaults (`intent` omitted)            | `data-intent="neutral"`, no `data-pin`, no `data-dismissible`; static full-width bar (Banner-R2). |
| `pin="top"` / `pin="bottom"`           | `data-pin` set; `position: sticky` with `top:0` / `bottom:0`, `z-index: var(--hz-z-sticky)` (Banner-R3). |
| No `pin`                               | No `data-pin`; static, no sticky positioning (Banner-R2/R3).                       |
| No `onDismiss`                         | No dismiss button, no `data-dismissible` (Banner-R5).                              |
| `onDismiss` provided                   | Button renders; click calls it once per activation; `data-dismissible` present (Banner-R5). |
| No `actions`                           | No `.hz-banner-actions` wrapper renders (Banner-R1).                               |
| No `icon`                              | No `.hz-banner-icon` wrapper renders (Banner-R1).                                  |
| `role="status"` via rest               | Passes through untouched (Banner-R4/R7).                                           |
| `as="aside"`                           | Root renders as `<aside class="hz-banner">` (Banner-R6).                           |
| `...rest` attempts `class`/`data-intent`/`data-pin` | Component-managed value wins (Banner-R7).                             |
| **Viewport-fixed needed**              | No prop. The consumer passes their own class (via `class`), which merges after `hz-banner` and, being unlayered, beats the `@layer hz-theme` sheet — e.g. `.promo-fixed { position: fixed; inset-inline: 0; bottom: 0; }`. They own the resulting scroll-padding on their scroll container. Documented on the Pinned tab (Banner-R7/R12). |
| Very long message text                 | Wraps within the content column; the bar grows in height, never truncates (Responsive). |
| Pinned bar over anchor targets         | Documented `scroll-margin` guidance; Banner sets none itself (Accessibility 2.4.11). |
| Both intents in dark mode              | `--hz-banner-fg` (surface) flips to the dark surface; graded AA in both modes (Banner-R9). |

### Existing Code to Reuse

- **`cx`** from `$lib/utils` for the root class (per Badge/Alert). `uid` only if
  an id becomes cross-referenced (none expected — Banner has no titled region).
- **`IconX`** from `$lib/icons/generated/x.svelte` for the dismiss button (per
  Alert/Badge). Do not add a new icon.
- **Alert's dismiss wiring** (`src/lib/components/Alert.svelte`,
  `.hz-alert-dismiss`) — copy the button markup and the theme's
  `.hz-alert-dismiss` treatment (hover tint, `1em` icon, focus ring) into
  `.hz-banner-dismiss`.
- **Button's solid-contrast mechanism** (`src/lib/theme/components/button.css`,
  `--hz-button-accent` / `--hz-button-on-accent` and the per-intent
  `:where([data-intent='…'])` switch) — the template for `--hz-banner-bg` /
  `--hz-banner-fg`. Reuse the `.hz-button` retarget for actions.
- **Header's sticky pattern** (`src/lib/components/Header.svelte`,
  `.hz-header[data-sticky] { position: sticky; top: 0; z-index: … }`) — the
  precedent for keeping positioning in the component's structural CSS. Header
  migrates its raw `100` to `var(--hz-z-sticky)` as part of Banner-R13.
- **Token source** `src/lib/tokens/index.ts` (`zIndex` object) and the
  `gen:tokens` flow + tokens drift test + `tokens.svelte.spec.ts` — the place to
  add `sticky`/`raised`, retire `toast`, and update the assertions (Banner-R13).
- **`Intent` / (no) `Rounded`** from `$lib/types` — `Intent` includes `neutral`;
  do not import or add a per-component union.
- **Theme conventions:** `src/lib/theme/components/alert.css` /
  `badge.css` as the template — `@layer hz-theme`, literal
  `var(--hz-…, <fallback>)` on every token, `:where()` to hold specificity down.
- **Docs scaffold:** `src/docs/data/alert.ts` + `src/routes/components/alert/+page.svelte`
  as the copy-from template for the data module and page (tabs, tab-notes,
  reactive code strings, dismiss/restore demo); `container.ts`/`stack.ts` for
  the pairing-note phrasing (Banner-R12).

### Test Plan

`src/lib/components/Banner.svelte.spec.ts` (browser project,
`vitest-browser-svelte`, `expect.requireAssertions`, mirroring
`Alert.svelte.spec.ts` / `Badge.svelte.spec.ts`):

- **Structure/R1:** root `.hz-banner` (default `<div>`); children render inside
  `.hz-banner-content`; with `icon`, a `.hz-banner-icon[aria-hidden="true"]`
  precedes the content; with `actions`, a `.hz-banner-actions` follows the
  content; with `onDismiss`, a trailing `.hz-banner-dismiss` button with the
  `aria-label`.
- **R2/R3 hooks:** every `intent` reflects into `data-intent`; `pin='top'`/
  `'bottom'` reflect into `data-pin` and no `data-pin` when static;
  `data-dismissible` present exactly when `onDismiss` is set; a pinned banner's
  computed `position` is `sticky`.
- **R4:** no `role` by default; a `role="status"` in props passes through.
- **R5:** dismiss button absent by default; present with `aria-label` when
  `onDismiss` set; click fires `onDismiss` once per activation.
- **R6:** `as="aside"` renders an `<aside class="hz-banner">`.
- **R7:** `class` merges after `hz-banner`; a rest attr (`data-testid`) forwards
  to the root; managed `hz-banner`/`data-intent`/`data-pin` survive a colliding
  rest value.
- **R9 recipe pin (required):** with the reference theme loaded, the computed
  `--hz-banner-fg` resolves to the surface token's value and `--hz-banner-bg`
  resolves to the active intent token's value, with no additional colour-mix on
  the foreground — asserting Banner's recipe is the `solid:` pairing the AA gate
  grades. (Mirror the `softTints` computed-style pin.)
- **R10:** `Banner` resolves from `$lib` and smoke-renders (`.hz-banner`
  present) — asserted in `src/lib/exports.spec.ts` (`// Banner-R10:`).

**Token/AA/theme:** `tokens.svelte.spec.ts` asserts `--hz-z-sticky` → `"100"`
and no longer references `--hz-z-toast`; the tokens drift test confirms
`tokens.css` equals the engine output after the `zIndex` edits (Banner-R13).
The existing `examples.spec.ts` `solid:` gate covers Banner's fg/bg (Banner-R9,
no new report rows). `hooks.spec.ts` passes for the new `Banner` entry
(Banner-R11).

### Out of Scope

- **Managed/persisted dismissal.** No internal `dismissed` flag; no
  localStorage "don't show again". That is consumer logic — the component only
  fires `onDismiss`. The docs page *shows* a localStorage pattern as an example,
  but it ships no code for it (Banner-R12).
- **Auto-dismiss timers, stacking, and Toast.** Deliberately not planned — timed
  self-dismissing overlays fail WCAG 2.2.1 and escape announcement; Banner (opt-in
  `role="status"`, consumer-owned dismissal) is the sanctioned pattern
  (Banner-R4).
- **Entrance/exit animation.** Banner ships no motion; a consumer can animate
  mount/unmount around it.
- **`variant`, `rounded`, `size` scales.** One solid, square, full-width look;
  Alert covers soft, Badge covers chips.
- **A `fixed`/overlay positioning prop.** Sticky (in-flow) is the only built-in
  mode; viewport-fixed behaviour is a consumer-class override (Edge Cases), not
  a prop, and the consumer owns the resulting scroll-padding.
- **Built-in intent icons.** The icon slot is the hook; the icon set lacks
  info/warning glyphs today (same posture as Alert).
