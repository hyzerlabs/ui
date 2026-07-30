# Docs audit findings log (specs/40 R10)

One row per route in the manifest: what the per-page checklist found, and how
it was resolved. `no-op` means the page passed the checklist as written —
that's a valid, expected outcome for pages already held to the bar, not a
skipped review. Resolutions: **fixed** (component/behavior change), **copy**
(prose-only edit), **no-op** (checklist passed, nothing changed).

R1–R3 (data modules, prop parity, consumerSource) landed as their own
mechanical batch ahead of this log — see the commit for that batch. This log
covers the per-page passes (R4–R9), one section per batch per the spec's
suggested order.

## Batch 1 (R1–R3 — data modules, prop parity, consumerSource)

| Scope | Findings | Resolution |
| --- | --- | --- |
| `src/docs/samples/` (command-palette pattern) | The command-palette sample's live demo imports its icons via a deep path into the generated set (`$lib/icons/generated/*.svelte`) rather than through the `$lib/icons` barrel, so it sits outside the dev-graph-hygiene guard `iconsBarrelGuard.spec.ts` added in specs/36 R9 — that guard pins barrel-vs-deep-import discipline for the library's own components, not docs samples. R3's `$lib/icons` → `@hyzer-labs/ui/icons` rewrite still keeps the sample's *shown* source a valid barrel import for a consumer app; only the live-rendered demo's deep import stays exempt. A deep-import + `./icons/*` rewrite alternative (teaching `consumerSource` to rewrite deep generated paths the same way it rewrites the barrel) exists if the guard gap needs closing later, but wasn't required for R3's actual defect (dead `$lib/utils`/`$lib/icons` specifiers in shown source). | `no-op` (documented exception, not a defect — flagged per batch-1 reviewer request) |

## Foundation

| Page | Findings | Resolution |
| --- | --- | --- |
| Colors & Intent (`/foundation/colors`) | Active voice, no banned words, terminology consistent, internal anchors (`#intent`, `/foundation/contrast`, `/theming/examples#intents-heading`, `/theming/tokens`) all resolve, h2s read as destinations. Two prose mentions of `Button`/`Badge`/`Alert` were plain text where they made an API claim ("all take the full [intent] set"; "every intent-bearing surface … resolves through this layer") — fixed-vocabulary rule requires code identifiers in backticks when referring to the API. Dark-theme claims (surface/text flip, surface-muted tint strengthening 6%→25%, every hue lightening to an AA-passing companion) traced against `tokens.css`'s dark block and `contrast.spec.ts`'s "every dark intent passes AA" suite — accurate. | copy — backticked the component mentions in both paragraphs |
| Typography (`/foundation/typography`) | Token-driven throughout, no banned words or lead-length issues, no dead links. No cross-link to the override workflow (`hyzer` config `typography` block / plain CSS custom properties) — a reader wanting to change the type scale had no pointer to Theming → Tokens & Overrides, unlike the corrected token pages below. | copy — added one-sentence override pointer to `/theming/tokens` |
| Contrast & Accessibility (`/foundation/contrast`) | "not just the raw hues" used *just* as an intensifier inside a contrastive "not just X" idiom — banned word (fixed independently, see resolution). Two further findings: (1) the lead paragraph ran 4 sentences against the ≤2-sentence lead standard; (2) "The solid Button and Badge case" used plain text instead of backticked component names. The "same math runs in CI" claim traced to `contrast.spec.ts`'s palette-contract suite ("every light/dark intent passes AA…") — accurate; soft-tint percentage math traced to `$lib/config`'s `softTints` — accurate. All internal (`#api-heading`, `/foundation/colors`, `/theming/components#hook-props-heading`, `/theming/tokens`) and external (WCAG/WAI-ARIA/Section 508) links verified live. | copy — reworded "not just" → "not only"; tightened lead to 2 sentences (preserved the CI-enforcement and library-function claims); backticked `Button`/`Badge` |
| Spacing & Sizing (`/foundation/spacing`) | One external link (Complementary Space) verified, no banned words. Density-ladder claims ("near multipliers walk the 1-2-5-10 ladder," "a shifted region's away always equals its parent's near," "three levels of shift is the floor") traced against `$lib/tokens/index.ts`'s `density.levels` array — accurate. `Grid`'s fluid `{ min }` mode and `Split`'s `stackBelow` prop, named in prose, confirmed to exist in their component sources. No cross-link to the override workflow (`hyzer` config `space`/`density`/`width` keys). | copy — added override pointer to `/theming/tokens` |
| Radius & Elevation (`/foundation/radius-elevation`) | No prose beyond a one-line lead, nothing to verify for banned words/terminology. No cross-link to the override workflow (`hyzer` config `radius`/`border`/`shadow`/`zIndex` keys) — this page had zero outbound links. | copy — added override pointer to `/theming/tokens` |
| Motion (`/foundation/motion`) | Two instances of "not just wide ones" (rendered prose + an adjacent code comment describing the same fix) — same banned-word idiom as Contrast (fixed independently, see resolution). Demo code fences (`transitionCode`, `essentialCode`, `revealCode`, `viewTransitionCode`, `onNavigateCode`) checked against their rendered demos — all match, including the reactive per-tab `transitionCode(item.id)`. Reduced-motion collapse, `essential` opt-out, and per-transition default-easing claims (`fly`/`scale` → `easeOut`, `fade`/`slide` → `easeStandard`) traced against `transitions.ts`, `reveal.ts`, `viewTransition.ts` — accurate. `/theming/tokens`'s lead links forward to this page for duration/easing overrides, but this page had no reciprocal link back, unlike every other Foundation page shipping override-relevant tokens; not treated as a restructure of the freshly-built (specs/39) page. | copy — reworded "not just" → "not only" (both instances); added reciprocal override pointer to `/theming/tokens` |
| Icons (`/foundation/icons`) | No banned words, `/theming/tokens#config-heading` and the external Lucide link both resolve, h2s read as destinations. Accessibility claim ("When `ariaLabel` is absent the icon is decorative (`aria-hidden="true"`); when present it is labelled") traced against a generated icon component (`check.svelte`) — `aria-hidden`/`role`/`aria-label` wiring matches exactly; demo's `size=24 (default)` matches the component's `$props()` default. | no-op |
| CSS Reset (`/foundation/reset`) | External Josh Comeau reset link resolves, import-order code sample matches the documented cascade-layer claim. "What it does" bullet claims (box-sizing, margin reset, `interpolate-size` guarded by `prefers-reduced-motion`, media-element block/constrain, form-control font inheritance, `text-wrap: pretty`/`balance`) traced line-by-line against the shipped `src/lib/theme/reset.css` — every claim accurate. | no-op |

## Foundation — user-reported follow-ups (post-batch)

| Page | Findings | Resolution |
| --- | --- | --- |
| Colors & Intent (`/foundation/colors`) | Palette swatches and hex labels were the static light-authored hexes in both modes — under the dark toggle the real tokens change (`#2563eb` → `#60a5fa`) but the cards didn't. Structural-role swatches painted their authored value (`var(--hz-color-white)` for `surface`) rather than the role token, so `surface` stayed white on a dark page. Intent swatches were already live. The batch's R6 demo check ran in light mode only — later batches check both modes. | fixed — palette swatches paint `var(token, lightHex)`; hex labels render light/dark pairs toggled by `[data-theme='dark']` CSS (no JS); role swatches paint their own token; roles column header "Light value" → "Value" and the column is mode-aware for the three dark-re-authored roles (`surface`/`surface-muted`/`text` show the current mode's authored value); swatches decorative (`aria-hidden`), visible labels carry values |
| Typography (`/foundation/typography`) | All four weight tabs shown for every family, but the serif/mono system stacks resolve to faces shipping only regular and bold — `medium`/`semibold` snapped to the nearest weight and rendered as duplicates, only sans showed four distinct weights. | fixed — weight tabs are per-family (sans keeps all four; serif/mono show `normal`/`bold` only) with a consequence-first tab-note explaining the snap |

## Foundation — user tweak round 2 (post-batch) + intent fold

| Scope | Findings | Resolution |
| --- | --- | --- |
| `Intent` type (`$lib/types`) | `neutral` was excluded from `IntentRegistry` for historical reasons (Badge introduced it as an "extension") — every component unioned `'neutral' \| Intent` by hand, and `DropdownTriggerProps.intent`'s inlined copy had drifted to a stale 4-value subset. | fixed (API, greenfield) — `neutral` folded into `IntentRegistry`; `ButtonIntent`/`AlertIntent`/`BadgeIntent`/icons collapse to `Intent` (`BadgeIntent` kept as alias); `DropdownTriggerProps.intent: Intent`; amendment in specs/19 |
| Icons (`$lib/icons`) | No way to color an icon from the intent vocabulary without hand-writing CSS. | fixed (API) — every generated icon takes `intent?: Intent`: stamps `data-intent` + `color: var(--hz-intent-*)` inline (consumer `style` still wins, no baked-in hex so registry-augmented intents work); tests in `icons.svelte.spec.ts`; amendment in specs/36 |
| Colors & Intent (`/foundation/colors`) | Intent prose called out `Button`/`Badge`/`Alert` as the neutral-takers — stale now that `neutral` is a full vocabulary member; Alert said "These six". | copy — reworded intent prose around the seven-value `Intent` type; Alert title "These seven…"; `neutral` note de-component-ified; danger demo family gains an `intent="danger"` icon |
| Contrast & Accessibility (`/foundation/contrast`) | Demo tabs and the pairing checker always opened on the light options — a wall of pinned-white surfaces for a dark-mode reader. | fixed — both Tabs seed `defaultTab` and the checker seeds its fg/bg selections from the persisted theme (`localStorage` `hz-theme`); panels stay mode-pinned by design |
| Radius & Elevation (`/foundation/radius-elevation`) | Shadows invisible in dark mode (black-on-black); no token table for shadows; no elevation a11y guidance. | fixed — dark mode lifts each card's surface by level (`--_lift` color-mix) with a faint edge, shadow kept as secondary cue; shadow token table added (values are mode-invariant — noted); new page-bottom Accessibility section (DocPage anatomy) with WCAG 1.4.11/1.4.1 + forced-colors references |
| Docs chrome (`+layout.svelte`) | The `p code`/`li code` chip's 14% gray tint is invisible over black. | fixed — dark-mode override strengthens the tint to 28% (same rationale as surface-muted's 6%→25%) |
| Motion (`/foundation/motion`) | Reveal demo grew a vertical scrollbar mid-animation (entrance offsets exceeded the strip's box); only the default rise entrance was demoable. | fixed — strip gets block padding + `overflow-y: hidden`; reveal demo now has Rise/Slide in/Fade/Drop tabs, each passing different `revealGroup` options with the code fence following |
| Icons (`/foundation/icons`) | Brand-marks note dwelt on removal history; core chip was neutral; catalog rows drew grid lines; catalog showed ~3.75 rows; per-tile import line crowded the tiles. | copy/fixed — note now says marks aren't included, bring your own; core Badge `intent="primary"`; row border removed; Virtualizer height 480→768; import-line code removed from tiles, button reads "Copy import" (full line still in `title` + clipboard) |

## Foundation — user tweak round 3 (post-review)

| Scope | Findings | Resolution |
| --- | --- | --- |
| Docs e2e (`docs.e2e.ts`) | Round-2's brand-marks rewording desynced the e2e assertion (reviewer blocker). | fixed — assertion matches the new copy ("Brand marks aren't included"); suite back to 376 green |
| Theme base (`theme/base.css`) | UA-painted layers (scrollbar gutters, overscroll canvas, control chrome) stayed light under a dark theme — the "white gutter" effect. | fixed — `color-scheme: light` on `:root`, `dark` under `[data-theme='dark']`; belongs in the theme base (needs the data-theme convention), not reset |
| Radius & Elevation (`/foundation/radius-elevation`) | The dark-mode surface-lifting treatment was demoed but not shown as code — hard to follow. Follow-up exploration (user): glow variants prototyped (pure white glow, primary-tinted, hybrid) — pure glow makes a weak boundary, tinted collides with the focus ring's color language. | fixed — dark treatment is now the user-picked HYBRID: per-level surface lift + neutral halo (`--_glow-r`/`--_glow-a`, strengthened once on feedback) with the token shadow kept in the stack; `CodeBlock` shows it as copyable consumer CSS; a11y bullet explains why halos stay neutral and subordinate |
| Icons (`/foundation/icons`) | No intent demo; core chip inline with the name caused awkward wrapping; core tiles had borders; size/stroke demo was static. | fixed — new Intent section (all seven intents + a `class` contrast demo, cross-linked to Colors & Intent); core chip on its own line; core-tile borders removed; Size & stroke is now an interactive `Example` with two `Slider`s driving the icon and code fence (docs dogfood Slider) |
| Motion (`/foundation/motion`) | 80ms stagger too quick to read as a demonstration; the reveal group-style tabs lacked copy explaining how `x`/`y` produce the directions. | fixed — reveal demos use `stagger: 160` (options + code fences); new tab-note: positive `y` rises, negative `y` drops, `x` slides in, both `0` is a pure fade, one option set styles the whole group |
| Docs scaffold — bare `<section>`s, no density spacing (`+layout.svelte`, `docs.css`, `DocPage.svelte`, all 8 foundation pages) | Every doc page's h1/section rhythm was bare `<section>` elements plus ad-hoc explicit margins (`.doc-section h2 { margin: 0 0 1rem }`, per-page `p { margin: 0 0 1rem }`-style rules) — the layout primitives (`Stack`, density spacing) weren't dogfooded on the docs' own scaffold. | fixed — `.docs-main-inner` (root layout) wraps page content in one `data-density-shift` div (shell → density level 1: near 2rem/away 4rem); root `<Stack gap="md">` → `<Stack gap="away">` (reads 4rem between top-level blocks); every `<section aria-labelledby class="doc-section">` → `<Stack as="section" gap="away" data-density-shift class="doc-section" aria-labelledby>` — the section's own shift takes the ladder to level 2 (near 0.8rem/away 2rem), so its `gap="away"` reads a roomier-but-still-tighter 2rem inside, the shell's away (4rem) doing the "between sections" separation; per spec's mid-task correction this uses one `gap` name (`away`) at two density depths rather than `near` for in-section rhythm, so the ladder itself carries the shell-vs-section hierarchy. `.doc-section h2`/`.a11y-refs` margins zeroed in `docs.css`; each page's own scoped margin rules (generic `p`, heading, and page-specific classes like `.token-table-wrapper`, `.demo-trigger`, `.shadow-alert`, `.override-note`, `.density-demo`) zeroed or reduced where they were direct children of a converted section Stack, left alone where nested inside an unrelated wrapper (`.checker`, `Example`/`.tab-content`, table wrappers) — verified per page, not blanket-deleted. `/foundation/typography`'s hand-added experimental `data-density-shift` on the "Bring your own fonts" section removed (the shell/section pattern now owns density everywhere). `/foundation/spacing`'s live density-ladder demo sits two ambient shifts deep before its own shifts begin, so its internal near-based gradient (1/2/3 shifts) now saturates at the 3-shift floor immediately — the demo's explanatory prose was rewritten to state the actual on-page numbers (and use it as a live example of "three levels is the floor") rather than the stale fresh-top-level-page figures. Caused 4 e2e regressions (2 carousel hit-area probes, the Toc "no page scroll" assertion, the motion reveal-demo scroll target) — all were fixed-viewport/element assertions that didn't account for the intentionally roomier layout pushing their targets further down the page; `docs.e2e.ts` updated to scroll targets into view before probing/asserting, no functional revert |

## Motion + tokens — user round 4

| Scope | Findings | Resolution |
| --- | --- | --- |
| `reveal`/`revealGroup` (`$lib/motion`, specs/39) | Only opacity+translate entrances were expressible — no way to give a group the slide or scale style; the demo's "slide" (x-offset fly) and "scale" felt unrelated to the transition demos above. | fixed (API) — new `effect: 'fade' \| 'fly' \| 'slide' \| 'scale'` option (default `'fly'`, prior behavior) + `axis`/`start`; `slide` expands from the center line of its axis via clip-path (user decision: center-out; no layout collapse, SSR box preserved); `scale` grows from `start` default 0 like the scale transition; 7 new unit tests; specs/39 amendment |
| Motion page reveal demo | Tabs (Rise/Drop/Slide/Scale/Fade) didn't correspond to the transition family; Rise/Drop were both just fly. | copy/fixed — tabs are now Fade/Fly/Slide/Scale, 1:1 with the transition demos above, same order, each on `stagger: 160`; e2e "Fly" locator scoped to the transition tablist (had gone ambiguous) |
| `motion.duration` tokens (specs/39 R2, specs/15) | The scale read too abrupt: 150/250/400ms. | fixed (API, greenfield) — retuned to fast 250 / base 400 / slow 550; tokens.css + example sheets regenerated; all 45 theme/docs fallback sites updated; 4 literal-value specs updated; specs/39 amendment |
| Typography (`/foundation/typography`) | Override guidance was a trailing note; no concrete bring-your-own-fonts recipe. | copy — new page-ending "Bring your own fonts" h2 section (TOC-visible): override paragraph + `@fontsource` + token-override `CodeBlock`, theming link kept |
| Icons (`/foundation/icons`) | Import-strategy guidance (barrel vs deep vs curated) sat in the intro. | copy — moved to its own "Usage" h2 section |

## Tokens — shadow rescale (user decision, post-round-3)

| Scope | Findings | Resolution |
| --- | --- | --- |
| `shadow` tokens (`$lib/tokens`, specs/15) | The old `sm` (`0 1px 2px / 0.05`) was barely perceptible in either mode — the whole scale read too timid. | fixed (API, greenfield) — scale shifted up: old `md` → `sm`, old `lg` → `md`, new `lg` = larger geometry at ~1.8× alpha. tokens.css + example token sheets regenerated; all 11 theme fallback sites updated; parity-spec abbreviation registry updated (sm gains one, md/lg re-pointed); amendment in specs/15. Every component that shadows (Card, Modal, Dropdown, Combobox, Nav popovers, Lightbox, fields) steps up one level by construction. |

## Components — Common

Prop-table accuracy checked both directions: `data.spec.ts` (R2) already pins
documented ⊆ source; each page below was also checked in reverse (every prop
in the component's `Props` interface has a table row, with a matching type/
default) via a scratch reverse-lookup script plus manual reading of each
component's source. A11y notes traced against the component's actual
`role`/`aria-*` output, not just prose plausibility.

| Page | Findings | Resolution |
| --- | --- | --- |
| Alert (`/components/alert`) | Props, a11yNote, and a11yLinks all trace cleanly against `Alert.svelte` (rest-spread order, `aria-labelledby` precedence, dismiss button). | no-op |
| Badge (`/components/badge`) | Clean — no role/label claim matches the plain `<span>`; dismiss button claim matches the real labelled `<button>`. | no-op |
| Blockquote (`/components/blockquote`) | Clean — figure/blockquote/figcaption/cite structure and the "no ARIA added" claim both match source exactly. | no-op |
| Button (`/components/button`) | Two findings. (1) `intent`'s documented type listed only `'primary' \| 'secondary' \| 'danger' \| 'neutral'` — stale; source is `'neutral' \| Intent`, the full 6-value registry (7 with neutral), same as Alert/Badge/hooks.ts already document it. (2) `onclick` is an explicitly-typed named prop in `Props` (not folded into `...rest`) but had no table row. | copy — widened the `intent` union to match source; added the missing `onclick` row |
| Link (`/components/link`) | `onclick` is an explicitly-typed named prop with no table row (same shape as the Button finding). | copy — added the missing `onclick` row |
| Cluster / Container / Grid / Split / Stack (Layout, partial) | `children` is an explicitly-typed named prop (`Snippet`) in every layout primitive's `Props` interface but had no table row on any of the five pages. Full Layout-group pass (incl. Virtualizer and a11y-claim tracing) still pending — these rows record only the prop-table fix. | copy — added the missing `children` row to all five data modules |
| Card (`/components/card`) | Clean — `href` → link-wrap + `aria-label` claim matches `Card.svelte`'s `.hz-card-link` anchor. | no-op |
| Divider (`/components/divider`) | Clean — `role="separator"` claims for both the bare `<hr>` and labelled `<div>` forms match source. | no-op |
| Dropdown (`/components/dropdown`) | Clean — `aria-haspopup`/`aria-expanded`/`aria-controls`, `role="menu"`/`"menuitem"`, and the disabled-stays-focusable (`aria-disabled`, not native `disabled`) claim all match source. | no-op |
| Carousel (`/components/carousel`) | Clean — `aria-roledescription`, the live-region viewport, and the "N of M" slide-label default all match source exactly. | no-op |
| Hero (`/components/hero`) | Clean — the `aria-labelledby`/`aria-label` precedence claim matches source's conditional expressions verbatim. | no-op |
| Modal (`/components/modal`) | Clean — `aria-modal`, `aria-labelledby`, `aria-describedby` all present as claimed. | no-op |
| Accordion (`/components/accordion`) | Clean — native `<details>`, `aria-disabled` on disabled summaries, both match source. | no-op |
| Tabs (`/components/tabs`) | Clean — `role="tablist"/"tab"/"tabpanel"`, `aria-selected`, `aria-disabled` all match source. | no-op |
| Table (`/components/table`) | Clean — `aria-sort` scoping, native `indeterminate` (not ARIA) on select-all, `aria-hidden` skeleton rows, explicit `role`/`scope` all match source. | no-op |

## Components — Layout

Full pass, folding in the prior partial pass's `children`-row fix (still listed
in the Common section's summary row above; superseded here). Props checked
both directions (documented ⊆ source via `data.spec.ts`; source ⊆ documented
via manual reading of each `Props` interface). A11y notes traced sentence by
sentence against source (no `role`/`aria-*`/`data-*` beyond what's claimed) and,
for Virtualizer, against `Virtualizer.svelte.spec.ts`. Every demo tab checked
in both light and dark (`data-theme="dark"` toggle) at 1280px via rendered
screenshots — no hardcoded chrome colors, all `var(--hz-color-*, fallback)`
resolve correctly under dark. Theme hooks table entries (`hooks.ts`) verified
against each component's rendered `data-*`/class output — all six accurate,
no changes needed.

| Page | Findings | Resolution |
| --- | --- | --- |
| Container (`/components/container`) | Two findings. (1) The padding tab-note referred to "the container" in lowercase while every other Layout page's identical-pattern padding note ("The tinted zone is the X…") capitalizes the component name — inconsistent with itself as the only outlier among five. (2) The `padding` prop's table note omitted "Both axes. Shared LayoutPadding scale" that Stack/Cluster/Grid/Split's padding notes all carry (Container's said only the near/away clause). `as`, `max`, `center`, `breakout`, `class`, `children` rows all match source; `--hz-breakout-shift` hook default (`calc(50% - 50cqw)`) matches the CSS exactly; a11yNote (`as` landmark guidance) traces cleanly to source (no ARIA emitted). Demos verified clean in both color modes. | copy — capitalized "the Container"; normalized the padding note to match sibling wording |
| Stack (`/components/stack`) | Clean. `gap`/`align`/`padding`/`as`/`class`/`children` rows all match source exactly, including the `xl` rung unique to Stack's gap scale (hooks.ts's "only layout gap scale with an xl rung" claim confirmed against the other four scales). a11yNote (no ARIA; DOM-order reading/focus) traces to source — no `order` CSS, no role/aria output. Demos (Gap/Align/Padding/Density) clean in both color modes; the Density tab's nested `data-density-shift` code fence matches the rendered three-level nesting exactly. | no-op |
| Cluster (`/components/cluster`) | Clean. `gap`/`justify`/`align`/`wrap`/`padding`/`as`/`class`/`children` rows all match source; `data-wrap`'s hooks.ts note ("its absence is styled too") traces to the `:not([data-wrap])` rule in source. a11yNote traces cleanly (no ARIA, DOM order). Demos (including the Wrap tab's scrollable nowrap variant) clean in both color modes. | no-op |
| Grid (`/components/grid`) | Two findings, both copy. (1) The align-tab demo's filler content used the banned word "easy" ("…is easy to see in the row") — Editorial standards ban it outright. (2) Confirmed clean otherwise: `columns`' three-way union (number / band object / `{ min }`) matches `GridColumns` exactly including the `data-fluid` read-only-attribute behavior; container-query band thresholds (640/968/1200px) match the CSS `@container` rules; a11yNote traces to source (no ARIA). Demos (Responsive/Fluid/Fixed/Gap/Align/Padding, including both `ResizableDemo` container-query tabs) clean in both color modes. | copy — reworded the align-demo filler text to drop "easy" |
| Split (`/components/split`) | Clean. `fraction`/`gap`/`reverse`/`stackBelow`/`padding`/`as`/`class`/`children` rows all match source; the `children` note ("Two direct children become the columns") matches the CSS's `:first-child`/`:last-child` targeting. `data-reverse`'s "DOM and focus order are preserved" claim traces to the source comment and the CSS-`order`-only swap (no DOM reordering). a11yNote traces cleanly. Demos (Fractions/Reverse/Stacking/Padding, including the stacking `ResizableDemo`) clean in both color modes. | no-op |
| Virtualizer (`/components/virtualizer`) | First full pass — previously unchecked. Props table (`items`, `itemHeight`, `height`, `measure`, `overscan`, `row`, `class`, plus the `itemHeight` union and `row` snippet supporting-type tables) checked both directions against `Virtualizer.svelte`'s `Props` interface — complete and accurate, including the `row` snippet's absolute-vs-window-local index distinction. The four-sentence a11yNote traced clause by clause: role-neutrality (no `role`/`aria-*`/`tabindex`) matches the `Virtualizer-R9` source comment and its dedicated "role-neutral by default" test; the `aria-setsize`/`aria-posinset` guidance matches the row snippet's absolute-index contract and the page's own "List semantics" demo; the `tabindex`/`role` opt-in-via-`...rest` claim matches the `Virtualizer-R10` "role/tabindex/aria-label … applied and not overridden" test; the focused-row-scrolled-out-of-DOM hazard is a direct, tested consequence of the windowed `items.slice(startIndex, endIndex)` render (R1–R3, R5 re-windowing tests). Theme hooks (root class + three part classes, no data attributes — correct, the component emits none) match source. All five demo tabs (Uniform/Known-variable/Measured/List semantics/Fluid height) clean in both color modes, including the resizable fluid-height demo's `resize: vertical` box. | no-op |

## Components — Navigation

Props checked both directions (documented ⊆ source via `data.spec.ts`; source ⊆
documented via a manual field-by-field diff of each `Props` interface
against its data module, plus every supporting type — `NavItem`/`NavChild`,
`BreadcrumbItem`, `FooterColumn`, `TocEntry` — against `$lib/types`). A11y
notes traced clause by clause against source and, where one exists, a spec
test (`Header.svelte.spec.ts`'s Escape-returns-focus test, `Nav.svelte.spec.ts`'s
roving-arrow-key/Escape/Enter/Space/Home/End suite, `Toc.svelte.spec.ts`'s
disclosure aria-expanded/Escape/outside-click suite). Every demo tab — including
inner surface/link-variant sub-tabs — checked in both light and dark
(`data-theme="dark"` toggle) at 1100–1280px via rendered screenshots, and for
overflow at 375/768/1280px via a scripted sweep (`document.documentElement.
scrollWidth`) across every top-level and inner tab: no hardcoded chrome colors,
no horizontal overflow anywhere. Toc is a new component (specs/38) — this is
its first full audit; every prop, both `TocEntry` fields, and every a11yNote
clause trace cleanly, no findings.

| Page | Findings | Resolution |
| --- | --- | --- |
| Header (`/components/header`) | Three findings. (1) The Bar tab's code fence explicitly set `ariaLabel="Main navigation"` — that's the prop's own default (should be omitted per the non-default-attributes convention) and it didn't match what the live demo actually renders (`ariaLabel="Demo header"`, chosen so the demo's landmark name doesn't collide with the docs shell's own nav). (2) The Surface tab's `surfaceCode` always emitted `variant="${c.variant}"`, including for the `default` combo — every sibling page with the same surface-combo pattern (Footer's `comboCode`) omits the attribute when it's the default value; Header's was the one outlier. (3) No cross-link to `Nav` despite the Bar tab-note describing what Header composes. Props (`items`/`brand`/`actions`/`sticky`/`variant`/`bordered`/`mobileBreakpoint`/`ariaLabel`/`menuIcon`/`chevronIcon`/`class`), the container-query breakpoint thresholds (640/968/1200px), and the a11yNote (`banner` landmark, dual-named `Nav`s in bar vs. drawer, `aria-expanded`/`aria-controls` on the toggle, focus-trapped Escape-to-close drawer) all traced cleanly to `Header.svelte` and its spec. | fixed/copy — `barCode` drops the redundant/mismatched `ariaLabel`; `surfaceCode` omits `variant` when it's `'default'` (mirrors Footer's `comboCode`); Bar tab-note gains a cross-link to `/components/nav` |
| Nav (`/components/nav`) | Two findings. (1) The lead description opened with "Navigation, pure and simple" — a marketing flourish ("no marketing" is explicit in the lead-description standard), not a *what*/*when* statement. (2) No cross-link to `Header` from the demo itself (the unlinkable plain-text `description` field mentions it, but `description` renders with no HTML support, so it was never a real link anywhere on the page). `items`/`orientation`/`ariaLabel`/`chevronIcon`/`class` and the full `NavItem` sub-table (`label`/`href`/`children`/`external`/`ariaCurrent`/`defaultOpen`) match `Nav.svelte`'s `Props` and `$lib/types`' `NavItem` exactly. a11yNote (APG menu-button semantics for horizontal, plain per-button disclosure for vertical, static non-focusable `heading` entries) traced clause by clause against source and `Nav.svelte.spec.ts`'s keyboard suite (Enter/Space/ArrowDown/Escape/roving arrows/Home/End). Demos (Dropdowns/Vertical) clean in both color modes, no overflow. | copy — dropped the "pure and simple" lead-in; added a cross-link to `/components/header` in the Dropdowns tab-note |
| Breadcrumbs (`/components/breadcrumbs`) | Clean. `items`/`ariaLabel`/`separator`/`class` and `BreadcrumbItem` (`label`/`href`/`external`/`ariaCurrent`, matching `$lib/types`' `Pick<NavItem, …>` exactly) all accurate. a11yNote (`nav aria-label="Breadcrumb"` landmark, automatic `aria-current="page"` on the last item, text vs. link rendering by `href` presence, decorative `aria-hidden` separators) traces line for line to `Breadcrumbs.svelte`. Demos (Basic/Wrapping/Custom separator) clean in both color modes, no overflow. | no-op |
| Pagination (`/components/pagination`) | Clean. `count`/`page`/`siblings`/`boundaries`/`href`/`onchange`/`ariaLabel`/`prevLabel`/`nextLabel`/`pageLabel`/`class` all match `Pagination.svelte`'s `Props` including the `page`/`pageLabel` defaults (`$bindable(1)`, `` (n) => `Page ${n}` ``). a11yNote (named `nav` landmark, every control is a `Button` so `aria-current="page"` rides on the current item, `pageLabel` giving full accessible names rather than bare numbers, decorative ellipses, link-mode real anchors, disabled-without-`href` prev/next at the ends, native tab order) traced clause by clause against `Pagination.svelte` — every claim, including the "a link can't be disabled" href-omission rationale, matches the component's actual conditional `href`/`disabled` wiring. Demos (Basic/Truncation/Link mode, including the live `siblings`/`boundaries` sliders) clean in both color modes, no overflow. | no-op |
| Footer (`/components/footer`) | Three findings. (1) The a11yNote said each column is "a `<nav>` landmark labelled by its title heading" — the landmark is actually named by a plain `aria-label={column.title}`, not `aria-labelledby` pointing at the visible heading; the wording implied a DOM relationship that doesn't exist. (2) No cross-link to `Nav` despite `FooterColumn.links` reusing `NavItem` wholesale (the type table's "see NavItem on the Nav page" note is plain, unlinkable table-cell text — table cells are chip-free by convention and can't carry an `<a>`). (3) Confirmed clean otherwise: `columns`/`variant`/`bordered`/`linkVariant`/`headingLevel`/`logo`/`social`/`bottom`/`class` and `FooterColumn` (`title`/`links`) match `Footer.svelte` and `$lib/types` exactly. Demos (Variants/Link variants/Logo+social+bottom/Responsive columns) clean in both color modes, no overflow. | fixed/copy — a11yNote reworded to `aria-label` set to the title, with the heading text noted as a visual repeat, not the naming mechanism; added a cross-link to `/components/nav` in the Variants tab-note |
| Toc (`/components/toc`) | First full audit (specs/38, new component) — no findings. Every prop (`container`/`levels`/`exclude`/`minEntries`/`title`/`ariaLabel`/`autoId`/`watch`/`smoothScroll`/`breakpoint`/`active`/`onActive`/`class`) and the `TocEntry` sub-table (`id`/`label`/`level`) trace exactly to `Toc.svelte`'s `Props` and `$lib/types`. The five-clause a11yNote (named `nav` landmark defaulting to `title`, `aria-current="location"` on the active link, real disclosure semantics in collapse mode, Escape-returns-focus, outside-click-closes-without-stealing-focus, `prefers-reduced-motion` degrading `smoothScroll` to an instant jump) traced clause by clause to source and to `Toc.svelte.spec.ts`'s dedicated tests for each behavior. Two banned words ("easy", "just") turned up in the Basic/Collapse demo articles' filler prose and the Callback tab-note — filler article text is still page copy, same standard as the Grid align-demo precedent. Every demo (Basic/Nested levels/Collapse mode/Callback-bindable active) renders its own bounded, scrollable article per the page's own R9 self-collection-avoidance comment, clean in both color modes, no overflow at 375/768/1280px across all four tabs. | copy — reworded the two demo-article sentences and the Callback tab-note to drop "easy"/"just" |

Gate results for this batch: `svelte-check` 0 errors/warnings; `prettier --check` + `eslint` clean; unit `71 files / 2312 tests` passed; `build` (prerender) succeeded with no dead `#`/fragment hrefs; e2e `376/376` passed.

## Components — Layout — user round 5 (per-axis padding)

USER DECISION (2026-07-23): layout padding gains per-axis control. `padding`
stays the both-axes shorthand; new `paddingInline` / `paddingBlock` props
(all five primitives: Container, Stack, Cluster, Grid, Split) override one
axis where set — same `LayoutPadding` scale, no default, emitted as
`data-padding-inline` / `data-padding-block` only when passed, CSS declared
after the shorthand rules so the longhand wins by source order. Motivating
case: inline gutters without block padding once vertical rhythm comes from
Stack gaps / the density ladder. Companion decision: Container stays
flex-free — width/gutter/centering only; arrangement belongs to
Stack/Cluster/Grid/Split. Docs now say so: Container's description carries
the pairing sentence (and Stack's the reciprocal), and the Container padding
tab demos `paddingBlock="none"` plus a reworded shorthand/longhand tab-note.
specs/03 gained an Amendments section (also back-recording the shipped
both-axes/shared-type/density deviations). Tests: 4 per-axis tests per
component (20 new; 311 green across the five spec files); data modules
gained the two rows on all five pages.

## Layout + Navigation — user round 6 (axis rationale, demos, polish)

All user-directed (2026-07-23), main session:

- **Logical-axes rationale surfaced** (user request): new "Logical axes"
  section on /foundation/spacing (page bottom, after width tokens) — the
  per-axis props are named for the CSS logical properties they set, not
  physical x/y, so they stay correct in RTL and vertical writing modes;
  the library's own CSS (margin-inline centering, padding-inline gutters)
  follows the same rule. All five layout pages' padding tab-notes carry a
  one-line version + cross-link to /foundation/spacing#axes-heading.
  paddingX/paddingY naming was considered and rejected (Tailwind's px/py
  are physical; ours are logical — the familiar name would lie).
- **Per-axis padding demos** (user request): every padding value sub-tab
  on all five layout pages now renders the trio — padding / paddingInline /
  paddingBlock at the selected value — with matching three-line code
  fences, so each value is shown on every axis option.
- **Spacing page polish:** Logical axes moved to page bottom; system-list
  gains 0.5rem top margin (lead line was too tight against it).
- **importLine brace spacing** (user request): all 41 data modules'
  import lines normalized `import {X}` → `import { X }` (sed sweep;
  homepage sample already spaced).
- **Nav/Header framing fix** (user correction of nav batch copy): Nav's
  dropdown tab-note said "Wrap this in a Header" — wrong model; Header
  COMPOSES Nav internally from `items`. Reworded both sides: Nav now says
  Header composes it ("nothing to wrap"), Header's bar note says the same.
- **Header demo width fix** (user report): the docs prose column is
  narrower than Header's default md (968px) breakpoint, so the Bar and
  Surface demos rendered permanently collapsed to the hamburger. Both now
  wrap in `<Container breakout padding="none">` and pass
  `mobileBreakpoint="sm"` (docs-column workaround, Nav-page precedent —
  fences stay idealized without it). The Mobile tab keeps default md for
  its ResizableDemo.
- **Navigation batch reviewer verdict: PASS/APPROVED** — every fix
  verified against source, Breadcrumbs/Pagination no-ops confirmed, Toc
  first-audit claims all traced (file:line), findings log matches diff.
  Non-blocking observation: Header bar fence intentionally omits the
  `ariaLabel` the live demo needs (landmark-collision avoidance) — the
  established idealized-fence pattern.

Gates after round 6: svelte-check 0/0, prettier+eslint clean, e2e 376
green (unit 2312 unchanged — no lib code touched this round).

- **Round 6 addendum (user):** Navigation manifest group reordered to
  Nav, Header, Footer, Breadcrumbs, Pagination, Toc — Nav is the base
  component; Header and Footer build on its item structure. Gates re-run
  green (check, lint, e2e 376).

- **Round 6 addendum (user):** every Import statement gets a Copy button —
  DocPage's bare `<pre><code>` import block replaced with the existing
  CodeBlock component (copy button + aria-live "copied" announcement);
  same conversion for the homepage's Installation and Usage blocks (their
  code moved to script consts, killing the awkward inline-interpolation
  fence). Now-unused scoped `pre` rules removed from both files. Nav's
  lead line also rewritten (semantically correct landmark in any context
  — standalone, sidebar, or composed by Header; last "wrap it in a
  Header" phrasing gone). Gates green (check, lint, e2e 376).

## Banner (specs/41) built

Banner shipped as a new component (headless `Banner.svelte` + reference
`theme/components/banner.css`, Button's solid accent/on-accent recipe
reused verbatim for the fg/bg pair) with its full docs surface: barrel
export, `exports.spec.ts`/`data.spec.ts`/`hooks.spec.ts` registry
entries, `src/docs/data/banner.ts`, `/components/banner` page (Common
group, alphabetically after Badge), and the Alert↔Banner "pair it with"
cross-link on both data modules. Banner-R13's z-index tokenization
landed alongside it: the `zIndex` scale gained `raised`/`sticky`/
`popover`, `toast` retired, and every raw `z-index` in `src/lib`
(Header, Nav, Card, Hero, LightboxOverlay, table.css, field.css)
migrated to a token — repo-wide grep for a bare `z-index: <number>`
returns nothing. Gates green: check, lint (prettier+eslint), unit 2335,
build (+ `svelte-package`), e2e 381.

- **Banner (specs/41) reviewer verdict: APPROVED, no blockers.** All 13
  requirements traced; gen:tokens drift check byte-clean; every z-index
  migration preserves its computed value; --hz-z-dropdown NOT orphaned
  (combobox.css + dropdown.css still use it); all five builder deviations
  judged justified (incl. popover:200 — the spec itself named it). Two
  nits FIXED by main session: theme.css banner.css import moved after
  badge.css (true alphabetical; was inert either way — disjoint classes
  in one layer), and the data-dismissible hooks note "Always stamped" —
  a spec-authored inaccuracy — reworded to "present only when onDismiss
  is set" in hooks.ts AND corrected at the source in specs/41 (R9's
  self-contradictory "alphabetically (between alert and badge)" fixed
  too). Gates re-run green: check 0/0, lint clean, unit 2335.

- **Banner/Alert polish round (user, 2026-07-23):** (1) Alert↔Banner
  when-to-use moved OUT of the description strings into the house
  `<Alert intent="info" title="X vs Y">` callout pattern (Table/Select
  precedent) on both pages, with real links; specs/41 R12 amended to
  match. (2) Banner gained sizing hooks --hz-banner-padding-block
  (0.75rem) / --hz-banner-padding-inline (1.25rem) — bar reads larger;
  hooks.ts + specs/41 R11 updated. (3) CONTRAST BUG fixed: Link in the
  actions slot painted primary-on-primary — banner.css's link retarget
  used :where(a) (specificity 0) and link.css imports later; now
  `.hz-banner :is(a, .hz-link)` (0,2,0) wins for bare anchors and every
  Link variant. Verified in-browser: white underlined link on the
  primary fill. (4) Intents tab-note reworded per user ("The intent
  vocabulary, using a solid fill instead of the tint Alert uses").
  (5) INTENT PROP ROWS: Banner/Alert/Button/Badge data modules now show
  type `Intent` (Combobox chip row precedent) and PropsTable gained an
  optional per-row noteHref — the "See Foundation → Colors & Intent."
  note is now a real link to /foundation/colors#intent on all four.
  Gates: check 0/0, lint clean, unit 2335, e2e 381.

- **Banner sizing + rich content (user, 2026-07-23):** padding defaults
  doubled — --hz-banner-padding-block 1.5rem / -inline 2.5rem (hooks.ts
  + specs/41 updated; verified in-browser). USER DECISION: Banner keeps
  CSS sizing hooks, NOT LayoutPadding-style props — padding props stay a
  layout-primitive (+Card/Divider legacy) affordance; content components
  size via theme hooks (the "can of worms" line). New "Rich content"
  demo tab: children is a free-form snippet — bold lead line + body copy
  stack in the content cell while icon/actions/dismiss keep the row
  (verified in-browser, info fill + Register link). Gates: check 0/0,
  lint clean, unit 2335, e2e 381.

- **Rich-content demo de-div'd (user, 2026-07-23):** wrapper divs replaced
  by a new opt-in `.hz-banner-title` theme class (the .hz-card-title
  precedent: never emitted, block-level semibold on the consumer's own
  lead element) — banner.css rule + hooks.ts opt-in-class row + specs/41
  parts amendment + fence/demo/tab-note rewritten. Verified in-browser
  (identical rendering, clean markup). check/lint/hooks+Banner specs
  green; e2e not re-run (text + one additive theme rule, no
  structural/locator change since the last 381-green run).

## Foundation — user round 7 (icons, links, z-index a11y)

All user-directed (2026-07-23), main session, verified in-browser:

- **Icons page Props section** (new, after Usage): full PropsTable for the
  shared IconProps interface — size (24) / strokeWidth (2) / intent
  (`Intent`, linked note via the new noteHref) / ariaLabel (absent →
  decorative) / class / …rest SVGAttributes. Lead line per user: "Every
  icon in the library shares the same interface."
- **Icons intent demo**: size 32 (demo-only, fences stay clean) and a
  DIFFERENT glyph per intent (settings/rocket/sparkles/octagon-alert/
  triangle-alert/circle-check/info) — shows per-context glyph+color
  pairing; fence lists all seven one-liners.
- **External links open in new tabs** (user-named three): Lucide (icons),
  Complementary Space (spacing), Josh Comeau reset (reset) —
  target="_blank" rel="noreferrer".
- **Z-index a11y surfaced** on Radius & Elevation's Accessibility
  section: new bullet (stacking is visual only — DOM/reading/focus order
  untouched; sticky tier can obscure focus → keep pinned bars short;
  hover/focus layers must be dismissible/hoverable/persistent) + two new
  refs (WCAG 2.4.11 Focus Not Obscured, WCAG 1.4.13 Content on Hover or
  Focus).

Gates: check 0/0, lint clean, unit 2335, e2e 381. NOTE: specs/42
(palette split) finalized same day — user decisions: split config
groups; black/white become mode-invariant ROLE tokens keeping their
--hz-color- names (ink/paper rejected); docs demo chrome tier-fixed.

- **Icons page IA restructure (user, 2026-07-23):** new order is Import →
  Demo → Props → Core icons → Browse & search. "Usage" renamed "Import"
  and gains a copyable CodeBlock demoing the barrel import and the deep
  import side by side. Size & stroke / Intent / Decorative vs. labelled
  fold into component-style demo Tabs (one Demo section, tab-content
  panels); the decorative panel gains a code fence it never had. Icons
  lead line: "Every icon in the library shares the same interface."
  docs.e2e.ts icons test rewritten tab-aware (tablist "Icon demos",
  click-through assertions). check/format clean; e2e validation rides
  the specs/42 builder's final full-suite run (tree was mid-sweep, the
  build-backed webserver couldn't start for a local subset run).

- **Colors page Dark mode expansion (user, 2026-07-23):** "Dark theme
  overrides" h2 renamed "Dark mode"; new lead paragraph states the three
  equally supported postures — light-only (do nothing), dark-only (pin
  data-theme="dark" on <html>, no toggle required), or a toggle — and
  that components resolve the same role/intent tokens in all three. The
  override table + doctrine now sit under an "Overrides" h3. check 0/0,
  prettier clean; applied on top of the specs/42 builder's completed
  colors-page migration (no collision — additive prose/heading only).

- **specs/42 palette split built (Builder, 2026-07-23):** raw hues moved
  to a dedicated `--hz-palette-*` namespace (`tokens/index.ts` `palette`
  export + `palette.theme.dark`); `--hz-color-*` roles grew to seven with
  two new mode-invariant alias roles, `black`/`white`, carrying no dark
  override; `--hz-intent-*` re-points at `--hz-palette-*`. Config
  `tokens.color`/`dark.color` split into `tokens.palette`+`tokens.color`
  and `dark.palette`+`dark.color`; classification moved from value-shape
  heuristics (deleted: `isPaletteValue`/`isRoleKey`/`baseColorClass`) to
  group membership. Full resolution sweep across `src/lib/theme/**`,
  `Image.svelte`, docs chrome, and route demo pages, tier-fixing every
  incidental hue use to a role/intent per the doctrine; two new
  acceptance-grep tests (`src/lib/tokens/palette-namespace.spec.ts`) pin
  R3.1 (zero `--hz-palette-*` in components/theme, excluding generated
  sheets and the example `*.config.ts` sources) and R6 (zero stale
  `--hz-color-<hue>` anywhere in `src/**`) green. Docs updated: colors
  (palette/roles/doctrine — landed under the user's concurrent Dark-mode
  heading rework, no collision), contrast (`palette` export, regex,
  apiCode), theming/tokens (override recipes, doctrine callout),
  theming/examples and getting-started (palette-vs-intent per site).
  Dated amendments appended to specs/15, 29, 30. One reviewed deviation:
  `footer.css`/`table.css`'s `--hz-color-surface-muted` fallback (which
  must byte-match the role's own `--hz-palette-gray`-based recipe per the
  specs/29 R7 fallback-parity test) now re-derives the same color through
  `--hz-intent-neutral` instead, with the equivalence documented as a new
  reviewed abbreviation in `fallback-parity.spec.ts` — a literal
  `--hz-palette-gray` fallback in a theme sheet would satisfy R7 but
  violate R3.1, and the two rules can't both be satisfied by the same
  string once theme sheets are barred from the palette. Gates: check 0/0,
  format+lint clean, unit 73 files / 2350 tests green, build (prerender)
  green, e2e 381/381 green, `gen:tokens` drift clean.

- **Theme toggle dogfooded + shown (user, 2026-07-23):** the docs shell's
  two theme-toggle instances (topbar + sidebar) converted from raw
  .docs-icon-btn buttons with unicode glyphs to the library's icon-only
  Button form (ghost/neutral, iconStart sun/moon generated icons,
  ariaLabel + aria-pressed; hamburger stays raw for now). The colors
  page's Dark mode section now shows this exact pattern as a copyable
  CodeBlock (verbatim incl. the hz-theme localStorage key) under the new
  optionality paragraph, before the Overrides subhead. check 0/0, lint
  clean.

- **System-preference initial theme (user, 2026-07-23):** resolution
  order is now explicit-choice-then-system: with no hz-theme key the
  shell follows prefers-color-scheme; storage is written ONLY on an
  actual toggle (and 'light' is stored explicitly — absence now means
  "follow the system", so an explicit light choice must be
  distinguishable). Contrast page's mode-pinned tab seeding mirrors the
  same resolution order. Colors page's toggle CodeBlock updated to stay
  verbatim, + one prose sentence. check 0/0, lint clean.

- **Density demo rework (user, 2026-07-23, post-ba0fd2e):** the spacing
  page's density composition now sits in a standard Example (preview +
  copyable fresh-page code) instead of the bespoke bordered div + separate
  Usage CodeBlock. The preview compensates for its two ambient density
  levels — one ambient level costs one rung, so each near becomes away and
  the demo's own intermediate shifts are dropped: heading/cards/padding
  render at 2rem, card rhythm 0.8rem, tags 0.4rem (true fresh-page values;
  only the 8rem section gap caps at 2rem). Old floor-collapse tab-note
  replaced with the compensation explanation; unused .density-demo rule
  removed. Gates: check 0/0, lint clean, e2e 381.

## Components — Media

Props checked both directions (documented ⊆ source via `data.spec.ts`;
source ⊆ documented via a manual field-by-field diff of each `Props`
interface against its data module, including `ImageSource` and both
`LightboxItem` variants against `$lib/types`). A11y claims traced against
`Image.svelte`, `Video.svelte`, `Lightbox.svelte`, and the internal
`LightboxOverlay.svelte` (never in the barrel), plus `specs/25-lightbox.md`'s
requirement table for the dialog/focus-return/paging/composition claims
specifically called out for this batch. Theme hooks (`hooks.ts`) held
against `media.css`, `lightbox.css`, and each component's own template —
found gaps, listed below. Placeholder-asset conventions verified: Image's
demos are labelled SVG data-URIs (`demoSvg()`), Video/Lightbox video items
use `src="about:blank"`, no third-party media URL is ever rendered (fence
text referencing YouTube/Vimeo URLs is inert `<pre>` content, not a live
request). No component source or theme CSS in this batch overlaps the
concurrent component-updates batch's scope (blockquote/button/link/table/
header/footer/pagination/carousel, hooks.ts entries for those, or Carousel
itself) — the one place Lightbox composes Carousel, its claims were verified
read-only against the existing `Carousel.svelte` source without editing it.

| Page | Findings | Resolution |
| --- | --- | --- |
| Image (`/components/image`) | Three findings. (1) The `sources` prop documented `ImageSource`'s shape inline in its note instead of a `types` sub-table — every other page with a supporting item type (Nav's `NavItem`, Table's `TableColumn`, Lightbox's own `LightboxItem`) gets one; Image was the outlier. (2) The page had no `a11yLinks` at all — every other page with a native-element mapping links MDN; Image renders `<img>` and, in picture mode, `<picture>`. (3) `rounded`'s boolean-or-scale union has no prop-table note explaining what `rounded={true}` renders as — confirmed via `data-rounded`'s bare-presence CSS selector (`media.css`) that `true` is shorthand for `md`; `hooks.ts` already carried this fact, the props table didn't. Separately (not a doc-copy issue): the Placeholders tab's `color` sub-demo passed `placeholderColor="var(--hz-color-border)"` in both the live demo and its code fence — that string is the prop's own default, so the line was a no-op that violated the non-default-attrs-only fence convention (the exact Header-`ariaLabel` shape from the Navigation batch). Confirmed clean otherwise: all 13 `Props` fields have exact-matching rows; `sources` media-query claim ("viewport queries per the platform") accurate; `alt=''` → `role="presentation"` claim matches source; demo fences non-default-attrs-only elsewhere; both color modes clean (token-only local CSS). | fixed/copy — added an `ImageSource` sub-table (`types`) and repointed the `sources` note at it; added `a11yLinks` (MDN `<img>`, MDN `<picture>`); added a `rounded` note ("true is shorthand for md"); dropped the redundant `placeholderColor` from both the live demo and its fence |
| Video (`/components/video`) | Two findings. (1) `hooks.ts`'s Video entry documented `data-aspect-ratio` and `data-state` but not `data-provider` — a real, unconditionally-stamped attribute (`data-provider={provider}` in `Video.svelte`) with a closed three-value union, the same shape as the two documented rows. (2) No `a11yLinks` — every other native-element page links MDN; added `<video>`. Also: no cross-link to `Lightbox` despite `Lightbox`'s viewer rendering every video item through this component (the reciprocal of the Image↔Lightbox pairing already documented) — same gap shape as the Nav↔Header and Footer↔Nav findings from the Navigation batch. Confirmed clean otherwise: all 10 `Props` fields match exactly; `title` → iframe `title`/native `aria-label` claim, `autoplay` requires `muted` + reduced-motion suppression claim, both trace to source; provider-detection and embed-URL claims (YouTube/Vimeo host + ID extraction, `controls=0`/`loop`/`autoplay+mute` query params) match `Video.svelte` line for line; demo fences match rendered demos (aspect/providers/poster tabs), `about:blank` + SVG posters only, no real media URLs; both color modes clean. | fixed/copy — added `data-provider` row to `hooks.ts`; added `a11yLinks` (MDN `<video>`); added a cross-link to `/components/lightbox` in the providers tab-note |
| Lightbox (`/components/lightbox`) | Two findings, both in `hooks.ts` — the parts/attrs tables were incomplete against the real DOM. (1) `data-gallery` (on the viewer `<dialog>`, present when `items.length > 1`) drives a real, substantial layout branch in `Lightbox.svelte`'s own scoped CSS (the fixed gallery stage vs. single-item hugging) but had no row. (2) `.hz-lightbox-carousel` (the class passed to the embedded `Carousel`) and `.hz-lightbox-video` (the wrapper around a video item's `Video`) are real, unconditionally-stamped public classes with no rows, unlike every other DOM class the overlay renders. Also: the gallery tab-note's "videos play via the Video component" left `Video` as unlinked plain text — the Image↔Lightbox pairing on the same page links `Image`, so this was the one asymmetric mention. Every claim named in this batch's brief traced clean against source: dialog semantics mirror Modal-R8–R16 (`LightboxOverlay.svelte`'s own comments cite this explicitly); focus returns to the **opening** trigger via the `returnFocusTo` seam captured at `openAt(i)` time (Lightbox-R13); dialog-level `ArrowLeft`/`ArrowRight` paging works from anywhere in the dialog, independent of the embedded Carousel's own key handling; the embedded `Carousel` is passed `loop`, and the gallery tab-note's "wrap-around" claim matches; thumbnails open at their own index (`openAt(i)` seeds `startIndex = i`); videos render via `Video` (confirmed, now linked). Prop table: the 4-sibling `src / alt / thumbSrc / caption` row-split (data.spec.ts's parity floor) is intact and correct; both `LightboxItem` variant sub-tables match `$lib/types` exactly; `a11yLinks` (APG Dialog, APG Carousel) correct. Composition check: `lightboxGroup`/`LightboxGroupOptions` are documented via the dedicated "Group attachment" demo tab + tab-note per `specs/25-lightbox.md` Lightbox-R30 (no separate props sub-table required by that spec — verified, not a gap). All four demo tabs' fences match their rendered demos (including the illustrative fuller-API fences precedented by Nav/Video, e.g. the picture-sources and provider-list fences); placeholder-asset conventions hold (`demoSvg()` SVGs, `about:blank` video item); both color modes clean (token-only local CSS). No change required or made to `Carousel.svelte`/`carousel.css` (concurrent batch's scope) — this page's Carousel claims were verified read-only. | fixed — added `data-gallery` attr row and `.hz-lightbox-carousel`/`.hz-lightbox-video` part rows to `hooks.ts`; linked `Video` in the gallery tab-note |

Gate results for this batch: `svelte-check` 0 errors/warnings; `prettier
--check` + `eslint` clean; unit `73 files / 2360 tests` passed; e2e `380/381`
— the one failure (`specs/37 — Table … stacked demo … column headers`) is in
the Table page, which is mid-edit on the concurrent component-updates batch
(`table.ts`/`table/+page.svelte` show as modified in the working tree
outside this batch's scope) and untouched by this pass; unrelated to Image/
Lightbox/Video.

## Nine-item component-updates batch (user-directed, 2026-07-23)

User-directed batch, not a checklist pass — nine numbered items across
Blockquote, Button, Link, Table, Header, Footer, Pagination, and Carousel.

| Item | Change | Resolution |
| --- | --- | --- |
| 1. Blockquote intent | `Blockquote` gains optional `intent?: Intent` (no default — absent renders the exact pre-change look). Colors **only** the accent line (`border-inline-start`); typography/padding/attribution untouched. `data-intent` reflects onto the root, present only when set. Implemented with the `--_c` intent-switch pattern (`banner.css`/`badge.css` precedent): `.hz-blockquote` sets `--_c: var(--hz-color-border)`, each `[data-intent]` re-points it at `--hz-intent-*`. | fixed (API) — `Blockquote.svelte`, `theme/components/blockquote.css`; `Blockquote.svelte.spec.ts` gained a Blockquote-R9 suite (absent-by-default, `data-intent` reflection, all seven intents' computed `border-inline-start-color`, typography/attribution untouched); `src/docs/data/blockquote.ts` gained an `intent` row (type `Intent`, noteHref `/foundation/colors#intent`, Banner/Alert/Button/Badge precedent); `hooks.ts` Blockquote entry gained `data-intent`; docs page gained an Intent demo tab (all seven values, one `Example` each); specs/26-blockquote.md gained a dated Amendments section |
| 2. Button sizes demo | Sizes tab showed one variant (implicit solid) per size. Reworked to a row per size showing all four variants (solid/outline/ghost/link) across, single intent (default `primary`, omitted from the fence). | docs only — `src/routes/components/button/+page.svelte`: `sizeRowCode`/`sizesCode` builders (non-default attrs only: `size` omitted for `md`, `variant` omitted for `solid`), single `Example` with a `.size-demo`/`.size-row`/`.size-row-label` layout (scoped CSS) instead of the old per-size sub-`Tabs` |
| 3. Link bring-your-own-class | New "Bring your own class" demo tab: a `Link` with `class="fancy-link"` and an exaggerated gradient-underline hover effect (`background-image`/`background-size`, animates to full width on hover), `prefers-reduced-motion` respected via an explicit `@media` query in both the shown fence and the page's real CSS. Fence shows markup + CSS together as one code string. **Parser gotcha hit and fixed**: a literal `<style>`/`</style>` tag text anywhere in a `<script>` block's string content (even a plain `//` comment mentioning it, and even the closing tag alone split as `'</' + 'style>'` while the opening tag stayed a literal `'<style>'`) breaks `svelte-check`'s extraction (`` `<script>` was left open ``) even though the real Svelte compiler tolerates it — both the opening and closing tag literals had to be built via string concatenation (`'<' + 'style>'`, `'</' + 'style>'`), and the doc comment reworded to avoid the literal substring too. | docs only — `src/routes/components/link/+page.svelte`: new tab, `fancyLinkCode` builder, `:global(.fancy-link)` scoped CSS (page-level, unlayered — beats the theme without `!important`); tab-note states the class-merge-order/unlayered-wins rule |
| 4. Table stacked-mode default threshold | Investigated `table.css`'s R7 mechanism: the three named thresholds are literal `@container` px constants (640/968/1200, Grid BAND precedent) — not `var()`-driven the way Split's flex-basis `stackBelow` switcher is (a container-query condition can't read a custom property), but each bucket still maps 1:1 to its token value and stays overridable by a consumer's own `@container` rule. No component/theme code changed — `stack` stays opt-in, off by default. USER DECISION: the **recommended** threshold moves to `'sm'` (640px, mirroring Split's `stackBelow` default), so tables only stack on genuinely narrow viewports. The docs demo previously used `stack="md"` (968px), which stacked even at ordinary desktop widths inside the prose column, making the effect effectively undemonstrable. | docs — Table page's stacked-mode demo moved to `stack="sm"`, wrapped in `Container breakout` + `ResizableDemo` (Split's precedent) so the 640px threshold is actually crossable; `src/docs/data/table.ts`'s `stack` note and `hooks.ts`'s `data-stack` note both recommend `'sm'` for most tables; specs/37-table.md gained a dated Amendments section. **e2e regression + fix**: the existing stacked-mode e2e test relied on the page `viewport` to trigger stacking — no longer works since the demo box has its own bounded width. Rewrote it to drive the `ResizableDemo`'s exact-entry number input (`getByLabel('Demo width (exact value)').fill('500')`) instead of the viewport; verified green |
| 5. Table non-sorting example | New "No sorting" demo tab: a minimal `columns` config with no `sortable` flags (the docs' own `PropsTable` look). Traced against source (`Table.svelte`'s `ariaSortFor`/`toggleSort`): a column can only render a sort button or carry `aria-sort` when its own `sortable` is `true`, so an all-plain config renders zero sort affordances and stamps no `aria-sort` anywhere — stated in the tab-note. | docs — `src/routes/components/table/+page.svelte`: `plainColumns`/`plainCode`, new tab; specs/37-table.md amendment (same entry as item 4) |
| 6. Header/Footer transparent-demo backdrop | `variant="transparent"` (Header) / `variant="minimal"` (Footer) both set `background-color: transparent` — sitting on the docs' plain white `.doc-example-preview`, both were visually indistinguishable from "no chrome at all" (default variant's background is also `--hz-color-surface`, i.e. the same white, so even the non-transparent combos barely registered). No prior "tinted backdrop" implementation was found in git history for either page (searched via `git log -p -S backdrop`) despite the task's framing as a restore — implemented fresh as a fix. | fixed — both pages: a `.surface-backdrop` scoped wrapper div (diagonal `primary`→`secondary` gradient tint, borderless, `Hero`'s bg-block gradient recipe reused) wraps every surface-combo demo (Header's 3, Footer's 4) so `transparent`/`minimal` visibly show the surface through and the opaque combos are visibly contrasted against it; tab-notes on both pages state the backdrop isn't part of the component |
| 7. Pagination + Carousel chevrons un-circled | User decision: Button's derived icon-only circle (Button R4b) reads wrong for prev/next chevrons on both composed controls — "same as carousel" (both already used it identically, so the fix is symmetric, not a copy from one to the other). Chose **`var(--hz-radius-md)`** (the outline button's normal corner radius) over a custom value — matches the theme's existing button radius language exactly, no new token. Scoped to `[data-icon-only]` on `.hz-pagination-prev`/`.hz-pagination-next` and `.hz-carousel-prev`/`.hz-carousel-next` only; Button's global icon-only circle is untouched (Banner's dismiss and every other icon-only `Button` use keep the circle). Both override rules rely on `pagination.css`/`carousel.css` importing after `button.css` in `theme.css` to win the cascade tie (`:where()`-zeroed specificity vs. `:where()`-zeroed specificity, later import wins) — verified in-browser (screenshot) at both pages. | fixed (theme) — `theme/components/pagination.css`, `theme/components/carousel.css`; specs/21-pagination.md and specs/33-carousel.md both gained dated Amendments sections |
| 8. Header mobile actions end-aligned | Coordinator-added mid-task. Investigated via in-browser screenshot (not obvious from CSS alone): below `mobileBreakpoint`, the bar `Nav` (`flex: 1`) leaves flow (`display: none`) and stops absorbing the row's free space, so `.hz-header-inner`'s `justify-content: space-between` floated `.hz-header-actions` in the *middle* of the collapsed bar, between the brand and the hamburger, instead of sitting next to it — confirmed with a before/after screenshot pair. Fixed with a scoped structural rule (`Header.svelte`'s own `<style>`, alongside the existing collapse selectors — this is layout behavior, not decoration, so it doesn't belong in `header.css`): `.hz-header-actions` gets `margin-inline-start: auto`, scoped to the same selectors that show the toggle (only engages once actually collapsed). Above the breakpoint the visible Nav's `flex: 1` claims the free space first, so the auto margin resolves to 0 — verified the desktop bar is pixel-identical before/after. No new prop. | fixed (theme) — `src/lib/components/Header.svelte`; `hooks.ts`'s `.hz-header-actions` row documents the default + the override path; Header docs page's Mobile tab-note states it; specs/35-header-nav-split.md gained a dated Amendments section |
| 9. Footer themed-background docs example | Coordinator-added mid-task, explicitly no new prop. Investigated the hook surface: `footer.css` has **no** `--hz-footer-bg`-style custom property — the only background surface is `.hz-footer`'s own `background-color` declaration (unlike Banner/Badge's `--_c`-hook pattern). No API invented; documented the bring-your-own-class route instead (the Link item-3 precedent) — a low-percentage `color-mix(var(--hz-intent-primary) 10%, var(--hz-color-surface))` tint keeps the existing (untouched) text color's contrast intact. | docs only — `src/routes/components/footer/+page.svelte`: new "Themed background" tab, `themedBgCode` (markup + CSS in one fence, same `'<' + 'style>'`/`'</' + 'style>'` concatenation as item 3), `.brand-footer` scoped CSS; tab-note states class-merges-after-hz-footer/unlayered-beats-theme |

Files touched: `src/lib/components/Blockquote.svelte`, `Header.svelte`;
`src/lib/theme/components/blockquote.css`, `pagination.css`, `carousel.css`;
`src/lib/components/Blockquote.svelte.spec.ts`; `src/docs/data/blockquote.ts`,
`table.ts`; `src/docs/hooks.ts`; `src/routes/components/{blockquote,button,
link,table,header,footer}/+page.svelte`; `src/routes/docs.e2e.ts`;
`specs/26-blockquote.md`, `specs/37-table.md`, `specs/35-header-nav-split.md`,
`specs/21-pagination.md`, `specs/33-carousel.md` (all dated Amendments
sections, none rewritten).

No spec amendments were written for items 2/3/6/9 — pure docs-page changes
with no library API/behavior/theme change to pin.

Gates: `svelte-check` 0 errors/warnings; `prettier --check` + `eslint`
clean; unit `73 files / 2360 tests` passed (10 new — the Blockquote-R9
intent suite); `build` (prerender, `@sveltejs/adapter-static`) succeeded;
e2e `381/381` passed (one pre-existing failure from the Table stacked-mode
demo rework, caused by wrapping the demo in a bounded-width `ResizableDemo`
so the page-`viewport`-driven assertion no longer applied, fixed by driving
the demo's own exact-entry input instead — see item 4/5).

## Components — Forms

The largest group (12 pages): Form, TextInput, Textarea, Select, Combobox,
FileUpload, Checkbox, RadioGroup, Slider, RangeSlider, ColorInput, Toggle.
Props checked both directions (documented ⊆ source via `data.spec.ts`;
source ⊆ documented via a manual field-by-field diff of every `Props`
interface — including Select's discriminated `multiple`/`value` union and
Combobox's `ComboboxChipProps` — against its data module) against
`Form.svelte`, `Field.svelte`, and all twelve field components, plus every
supporting type (`FormError`, `FormOption`, `SelectOption`, `SliderTick`,
`FileRejection`, `ComboboxChipProps`) against `$lib/types`. A11y claims
traced clause by clause against source and specs/13, 14, 17, 18, 22, 24:
`aria-describedby` desc→error chaining, `data-state` error-beats-disabled
precedence (shared `Field.svelte`/inline `dataState` derivations), the
`aria-required`/`aria-invalid` wiring per component (including the Slider/
RangeSlider/ColorInput family's deliberate **omission** of `aria-required` —
the slider role has no such ARIA attribute, per specs/17 Slider-R4/Range-R4
and specs/18 Color-R3), Combobox's APG combobox (list-autocomplete) pattern
with `aria-activedescendant` virtual focus — deliberately the opposite of
Dropdown's roving-tabindex menu pattern audited in the Common batch — and
Toggle's native-checkbox-as-`role="switch"` posture. Every "Description &
states" tab checked against the established single-tab convention (demo
order description → error → required → disabled); every demo checked in
both color modes (token-only local CSS throughout, nothing hardcoded) and
for overflow at 375/768/1280px via the e2e sweep. Theme hooks (`hooks.ts`)
held against `field.css`, `form.css`, `combobox.css`, `file-upload.css` —
every `FIELD_STATE`/`FIELD_PARTS`/`SLIDER_PROPS` shared row and every
per-component row traced to a real selector/declaration; all accurate, no
gaps found. `zod` confirmed still a `devDependency` only (Form page's demos
are the only place it's imported).

**Select data module reconstruction (the flagged R1 extraction gap).**
Batch 1's parting note flagged `select.ts` as needing manual reconstruction
against `Select.svelte`'s real `Props` — the mechanical R1 script was known
to struggle with Select's discriminated `multiple`/`value` union. On
inspection, `select.ts`'s current content is already a byte-for-byte carry
of a **hand-authored** `PropRow[]` array that predates specs/40 (present in
the route file back through the specs/31 IA migration, commit `a3e9c7d`) —
R1's extraction moved that existing table as-is into the new module rather
than regenerating it from the union type, so it never inherited the script's
known weakness. Manually reconstructed/verified field-by-field against
`Select.svelte` anyway, per the task: all 12 documented props (`name`,
`label`, `options`, `multiple`, `value`, `placeholder`, `description`,
`error`, `required`, `disabled`, `hideLabel`, `class`) match the union'd
`Props` exactly, including `value`'s dual default (`''` single / `[]`
multiple) and the `multiple`-gates-`value`'s-type note; both `types`
sub-tables (`FormOption`, `SelectOption`'s group arm) match `$lib/types`
exactly; `a11yNote`/`a11yLinks` trace cleanly to the native `<select>`'s
aria wiring. **No defect found** — the flagged gap did not materialize for
this page, but the verification was performed in full per the task's
instruction, not skipped on the strength of the module looking plausible.

| Page | Findings | Resolution |
| --- | --- | --- |
| Form (`/components/form`) | Clean. `errors`/`onSubmit`/`summaryTitle`/`summaryHeadingLevel`/`focusTarget`/`novalidate`/`ariaLabel`/`children`/`class` and the `FormError` sub-table (`name`/`message`) match `Form.svelte` exactly; `importLine`'s `toFormErrors` named import matches the barrel export (`$lib/index.ts`). a11yNote (summary-as-`role="alert"` Alert, focus-on-submit via `focusTarget`, per-item jump-and-focus with reduced-motion-safe scrolling, `summaryHeadingLevel` heading-outline guidance) traces clause by clause to `Form.svelte`'s `handleItemActivation`/focus `$effect`. Four demo tabs (SvelteKit + enhance — real `use:enhance`/`fromAction` wiring, only the server hop simulated; Zod validation; Error summary anatomy — DOM-order-vs-array-order distinction; Focus target) all match their rendered demos; `zod` stays dev-only. | no-op |
| TextInput (`/components/text-input`) | Clean. All 15 `Props` fields (`name` through `class`, including `prefix`/`suffix` snippets and the 9-way `type` union) match `TextInput.svelte` exactly; a11yNote (label association, `hideLabel` sr-only, `aria-describedby` chain, `aria-required`/`aria-invalid`, `prefix`/`suffix` decorative `aria-hidden`) traces cleanly. Four demo tabs (Basic; Input types — 9 sub-tabs pairing `type` with `autocomplete`/`inputmode`; Prefix & suffix; Description & states, order description→error→required→disabled) all match rendered demos in both color modes. | no-op |
| Textarea (`/components/textarea`) | Clean. `name`/`label`/`value`/`rows`/`resize`/`maxlength`/`description`/`error`/`required`/`disabled`/`hideLabel`/`class` match `Textarea.svelte`; the `resize` note's `field-sizing: content` / JS-fallback / `rows`-as-minimum claims trace to the component's `$effect` and `textarea.css` rules. Three tabs (Basic; Resize — 4 sub-tabs, the `vertical` fence correctly omits the default value; Description & states) clean. | no-op |
| Select (`/components/select`) | See the Select reconstruction note above — no defect, full manual verification performed. Page itself clean: the "Select vs Combobox" `Alert` callout is reciprocal with Combobox's own callout and both link correctly; four demo tabs (Basic; Option groups; Multiple — live `FormData.getAll` readout; Description & states) all match rendered demos. | no-op |
| Combobox (`/components/combobox`) | Two findings, both a11yNote completeness gaps (the note is long and combobox-specific; the shared Field-family boilerplate every sibling page states got dropped in the process). (1) No mention anywhere that `description`/`error` chain into `aria-describedby` or that `required`/`error` set `aria-required`/`aria-invalid` on the input — real, unconditional attributes in `Combobox.svelte`, stated by every sibling page's a11yNote. (2) The `ComboboxChipProps.intent` sub-table row (type `Intent`, forwarded straight to `Badge`) had no `note`/`noteHref` — every other `Intent`-typed prop row in the library (Button/Badge/Alert/Banner, per the earlier audit round) links `/foundation/colors#intent`; this nested row was the one outlier. Confirmed clean otherwise: all 14 `Props` fields, both `types` sub-tables (`FormOption`, `ComboboxChipProps`), and the dense keyboard/APG a11yNote content all trace exactly to `Combobox.svelte`; the "vs Select" callout, custom-filter/styled-chips/description-states tabs all match rendered demos. | copy — added the `aria-describedby`/`aria-required`/`aria-invalid` clause to `a11yNote`; added `note`/`noteHref` to the `ComboboxChipProps.intent` row |
| FileUpload (`/components/file-upload`) | One finding, the same a11yNote completeness gap as Combobox: no mention that `description`/`error` chain into `aria-describedby` or that `required`/`error` set `aria-required`/`aria-invalid` on the native input — both real per `FileUpload.svelte` and specs/24's Labelling requirement, and already correctly distinguished from the native `required` **attribute** (never applied — consumer/`Form` validates) in the page's own states tab-note. Confirmed clean otherwise: all 18 `Props` fields and the `FileRejection` sub-table match exactly; a11yNote's WCAG 2.5.7 non-drag-operability, dropzone `aria-hidden`/tab-order, per-file `Remove {name}` labelling, and `aria-live` status-region claims all trace to source; six demo tabs (Basic; Multiple; Dropzone; Validation; Form submission; Description & states — the one page whose states demo uses a Basic/Dropzone grid instead of a flat stack, still in description→error→required→disabled row order) all clean in both color modes. | copy — added the `aria-describedby`/`aria-required`/`aria-invalid` clause to `a11yNote` |
| Checkbox (`/components/checkbox`) | One finding: the a11yNote's closing usage-guidance sentence ("Reach for Toggle over `Checkbox`...", inherited from Toggle's page — see that row) had no reciprocal on this page, and a11yNote text can't carry a real link anyway (`DocPage`'s backtick-split only ever produces `<code>`, never `<a>`) — the same "guidance stranded in unlinkable prose" shape as the Navigation batch's Footer/Nav and Media batch's Video/Lightbox findings. Confirmed clean otherwise: all 13 `Props` fields, the `indeterminate`-is-a-DOM-property-not-`checked` claim, and the select-all demo pattern all trace to `Checkbox.svelte`; three demo tabs (Basic; Indeterminate — live select-all; Description & states) clean. | fixed — added a `Checkbox` vs `Toggle` `Alert intent="info"` callout (Select/Combobox precedent) with a real link to `/components/toggle` |
| RadioGroup (`/components/radio-group`) | Two findings. (1) The `FormOption.disabled` sub-table note read "Disables just this option" — "just" as a bare intensifier is a banned word (Editorial standards). (2) a11yNote listed the radiogroup container's `aria-describedby`/`aria-invalid` but omitted `aria-required` — a real, unconditional attribute (`aria-required={required ? 'true' : undefined}` on the same `div`) that every sibling page's a11yNote states for its own required/aria-required pairing. Confirmed clean otherwise: all 12 `Props` fields and the `FormOption` sub-table match `RadioGroup.svelte`; three demo tabs (Basic; Orientation; Description & states) clean. | copy — "Disables just this option" → "Disables only this option"; added `aria-required` to the a11yNote's attribute list |
| Slider (`/components/slider`) | One finding: a11yNote covered `aria-describedby`/`aria-invalid` but never stated that `required` does **not** set `aria-required` — a deliberate omission (specs/17 Slider-R4: "not in the slider role's supported ARIA set"), already stated for ColorInput's identical case but missing here despite the prop table's own "Label indicator only" note hinting at it. Also added a reciprocal cross-link to RangeSlider in the Ticks tab-note (RangeSlider's matching note already named "Slider" in plain, unlinked text — see that row). Confirmed clean otherwise: all 15 `Props` fields and the `SliderTick` sub-table match `Slider.svelte`; five demo tabs (Basic; Range & step; Ticks; Slider only; Description & states) clean in both color modes, including the live-bound Basic tab's reactive code fence. | copy — added the `aria-required`-omission clause to `a11yNote`; linked "RangeSlider" in the Ticks tab-note |
| RangeSlider (`/components/range-slider`) | Three findings. (1) Same `aria-required`-omission gap as Slider, plus the note never mentioned `aria-invalid` either (a real attribute on both range inputs) — RangeSlider's a11yNote was the least complete of the three exact-entry siblings. (2) The Ticks tab-note said "Same ticks API as Slider" in plain, unlinked text — a real cross-link gap (Navigation/Media batch precedent). (3) The "Description & states" demo was missing its `required` example — every sibling field page demonstrates description→error→required→disabled in that order; RangeSlider's states tab and its code fence jumped straight from error to disabled, the one outlier in the whole Forms group. Confirmed clean otherwise: all 17 `Props` fields and the `SliderTick` sub-table match `RangeSlider.svelte` exactly, including the `{name}-min`/`{name}-max` submission-name note. | fixed/copy — added `aria-invalid` + the `aria-required`-omission clause to `a11yNote`; linked "Slider" in the Ticks tab-note; added the missing `required` demo (fence + rendered) to the Description & states tab |
| ColorInput (`/components/color-input`) | Clean. All 10 `Props` fields match `ColorInput.svelte`; a11yNote's platform-normalizes-to-hex claim, hex-field commit/normalize/restore behavior (`#rgb` expansion, garbage restore), and the `aria-required`-not-applied rationale (already correctly stated — the model for the Slider/RangeSlider fix above) all trace to source and specs/18. Three demo tabs (Basic — live pick↔hex sync; Swatch only; Description & states) clean in both color modes. | no-op |
| Toggle (`/components/toggle`) | Two findings. (1) a11yNote stated the `aria-describedby` chain but never that `required`/`error` set `aria-required`/`aria-invalid` — both real, unconditional attributes on the native checkbox. (2) The note's closing sentence ("Reach for Toggle over `Checkbox` when the setting reads as on/off...") was real, accurate usage guidance stranded in unlinkable a11y prose — a11yNote text only ever renders backticks as `<code>`, never as a link, so "Checkbox" was dead text with no way to click through. Confirmed clean otherwise: all 9 `Props` fields, the native-`role="switch"`-checkbox posture, and `data-state="on"/"off"` claims all trace to `Toggle.svelte`; two demo tabs (Basic; Description & states) clean. | fixed/copy — added the `aria-required`/`aria-invalid` clause to `a11yNote`; moved the Toggle-vs-Checkbox guidance out of `a11yNote` into a new `Toggle` vs `Checkbox` `Alert intent="info"` callout (Select/Combobox precedent) with a real link to `/components/checkbox` |

**Open questions:** none — every finding this batch was a copy/parity/demo
fix within the audit's existing scope; no API-shaped questions surfaced.

Gate results for this batch: `svelte-check` 0 errors/warnings; `prettier
--check` + `eslint` clean (outside two pre-existing, out-of-scope Carousel
files owned by the concurrent specs/43 batch); unit `73 files / 2377 tests`
passed; `build` (prerender, `@sveltejs/adapter-static`) succeeded with no
dead `#`/fragment hrefs; e2e `381/381` passed.

## specs/43 — Carousel drag mode (controls-free presentation + seamless loop-wrap)

Not an audit-checklist pass — a feature build (Builder role) implementing
`specs/43-carousel-drag.md` against `Carousel.svelte`. Logged here per that
spec's instruction to append one entry when done, since it edits Carousel-
adjacent files this log already tracks (`hooks.ts`, `src/docs/data/
carousel.ts`, the Carousel docs page).

New `controls?: 'visible' | 'focus'` (default `'visible'`) stamps
`data-controls` on the root always; `'focus'` visually hides the whole
control row (opacity only, never `display`/`visibility`/`aria-hidden`/
`inert`) until `:hover`/`:focus-within` reveals it together — the WCAG 2.5.7
non-dragging alternative stays in the DOM and fully operable throughout.
New `seamless?: boolean` (default `false`, meaningful only with `loop`) makes
every ±1 boundary wrap — drag settle, buttons, an adjacent-wrap dot click,
arrow keys — settle through an inert/`aria-hidden`/`data-clone` copy of the
opposite-end slide instead of `go()`'s plain rewind, so the track never
sweeps backward through the intervening slides; multi-slide dot jumps and
Home/End still animate directly, no clone (adjacent-only rule). Both props
are orthogonal to `draggable` and to each other. Without the `seamless`
opt-in the DOM stays byte-identical to specs/33 (no clone machinery renders),
so Lightbox (which passes neither prop) is unaffected — verified by its full
suite staying green.

Mid-task, the coordinator additionally asked for Carousel's prev/next
chevrons to go borderless (`Button variant="ghost"`, replacing the
`variant="outline"` this spec's Accessibility section had named) — a
component-level change, dated into the same `specs/33-carousel.md`
Amendments section as the same-day un-circling change. The resulting
contrast tension (ghost has no opaque background of its own) is resolved by
the scrim the spec already grants the theme: `controls="focus"`'s revealed
row carries its own translucent backdrop (`color-mix` over
`--hz-color-surface`), so contrast holds at the row level regardless of the
buttons' own background; the default `controls="visible"` row is never
overlaid on slide media, so it needs no backdrop.

One real bug surfaced (and fixed) building the e2e coverage, not just a test
workaround: the focus-mode overlay's bottom-anchored `.hz-carousel-controls`
box can overlap a short carousel's track even while fully transparent
(`opacity: 0`) — an invisible hit target was silently swallowing pointer
presses meant for the track underneath. Fixed with `pointer-events: none` on
the row (always, so its own padding/background never blocks a drag or click
on the slide behind it) and on its direct children while hidden, flipping to
`auto` on the children only once revealed — so the real controls intercept a
press exactly like `controls="visible"`'s row already does, and nothing
more. Keyboard reach is untouched (`pointer-events` has no effect on Tab
order or on Enter/Space activating a focused control).

Files touched: `src/lib/components/Carousel.svelte` (+`.spec.ts`);
`src/lib/theme/components/carousel.css`; `src/docs/hooks.ts` (`data-controls`
/`data-seamless`/`data-clone` rows); `src/docs/data/carousel.ts` (`controls`/
`seamless` prop rows, amended `draggable` note, WCAG 2.5.7 `a11yLinks`
entry); `src/routes/components/carousel/+page.svelte` (new Drag demo tab);
`src/routes/docs.e2e.ts` (new specs/43 describe block); `specs/33-carousel.md`
(dated Amendments entry for the borderless-chevron decision).

Gates: `svelte-check` 0 errors/warnings; `prettier --check` + `eslint` clean
on every touched file; unit `73 files / 2381 tests` passed (21 new — R1–R7
controls/seamless suites in `Carousel.svelte.spec.ts`; full Lightbox suite,
37/37, confirmed regression-free); `build` (prerender,
`@sveltejs/adapter-static`) succeeded; e2e `388/388` passed, including the
new specs/43 describe block (resting-view hidden, Tab/hover reveal, drag
still advances the demo, a boundary wrap's sampled track transform shows no
sustained backward-sweep run, no 375px overflow, reduced-motion disables the
reveal fade) and the existing specs/33 suite unchanged.

## Theming (+ Getting Started overlap)

Heavier on verification than rewriting per the task brief — specs/42 (palette
split) had just rewritten these pages' substance. Every override recipe, CLI
sample, and config snippet on all four pages was traced against
`src/lib/config/schema.ts` (`resolveConfig`/`mergeGroup`/`flattenRampGroup`),
`src/lib/config/generate.ts` (full/overrides-mode dark-block composition,
`darkSelector`), `src/lib/cli/main.ts` (exact CLI output strings), and
`src/lib/config/report.ts` (`contrastReport` pairing-id shape) — every sample
would resolve/validate/print exactly as shown, including the numeric claims
(`(full, 84 tokens)`, `14 core, 2 configured`, the `text:intent-fairway/
surface-muted` pairing id, `Node ≥ 22.18`, `engines.node` in `package.json`).
The resolution doctrine (components/theme resolve via roles/intents only;
dark may override any tier incl. palette) is stated verbatim on
`/theming/tokens` per specs/42 R4.3 and not contradicted on the other three
pages. `/theming/examples` was checked against the live ocean/sunset/terminal
configs and generated sheets (`ocean.config.ts`, `sunset/sunset.config.ts`,
`terminal/terminal.config.ts`, their committed `.tokens.css`/`.css` output);
the selector-scoped mechanism claims match the actual implementation exactly:
Ocean is regenerated at runtime via `generateCss(resolveConfig(oceanConfig),
{ mode: 'overrides', selector: '.theme-ocean' })` and injected through
`svelte:head`'s `{@html}` (the page's own code comment states why — Ocean's
committed sheet targets `:root` by design, so the docs page needs a scoped
twin instead of importing the real file), while Sunset/Terminal import their
real, build-time-generated `.hz-theme-*`-scoped sheets directly — both paths
verified in-browser in both color modes (screenshots), including Ocean's and
Sunset's dark-mode palette flip and Terminal's intentionally-dark-in-both-
modes design.

The rollup mechanism on `/theming/components` (reads `hooks.ts`'s `props`
arrays, keyed by component, joined against the manifest for hrefs) was
verified faithful in structure (every `hooks.ts` component key matches a
manifest label 1:1, so every row's link resolves) but **was silently
dropping the `values` column** — `HookRow.values` (type/default, e.g. `<length>
— default 0.375rem`) is real information not always restated in `note`
(confirmed via spot-checks: `--hz-toggle-width`'s note never states its
`2.5rem` default, only `values` does), yet the rollup table only rendered
Hook/Component/Tunes. Per-component pages render all three columns via
`ThemeHooks.svelte` (Hook/Values/Styles) — the rollup was the one place this
information was lost. This is a rendering completeness gap in the *rollup
page*, not a `hooks.ts` content defect, so it was fixed directly per the
task's scope (not logged as a hooks.ts finding).

| Page | Findings | Resolution |
| --- | --- | --- |
| Theming Overview (`/theming/overview`) | Clean copy/claims — the tier table, `@layer hz-reset, hz-theme` pin, and "where to override what" table all traced true. Predated the density scaffold: bare `<section>`s, a `Stack gap="xl"` root (8rem — the largest rung, not the section-rhythm one), and local `h1`/`h2`/`p` margin rules duplicating what `docs.css`'s `.doc-intro`/`.doc-section` classes already provide (screenshot-verified an oversized ~8rem gap between sections vs. the 2rem the scaffold produces). | scaffold — converted to the Foundation-batch pattern: `.doc-intro`/`.doc-description` for the lead, `Stack as="section" gap="away" data-density-shift class="doc-section"` for all three sections, root `Stack gap="away"`; local margin rules zeroed |
| Tokens & Overrides (`/theming/tokens`) | All four plain-CSS override recipes, the `hyzer.config.ts` sample (split `tokens.palette`/`tokens.color`/`dark.palette` groups, a `brandRed` ramp resolving to `--hz-palette-brand-red-900`, an intent pointing at it), and both CLI transcripts traced byte-accurate against `schema.ts`/`generate.ts`/`main.ts`/`report.ts` — every number (84 tokens, 96 pairings, 14 core/2 configured, the `AA Large` level, the exact pairing id) is real output the shown command would print. The specs/42 doctrine callout is present verbatim. Same pre-scaffold structure as Overview (bare sections, `gap="xl"` root, duplicated local heading/paragraph CSS). | scaffold — same conversion as Overview; `.doctrine-note` and the intro's other local classes kept their own margins (nested inside the plain `.doc-intro` div, not a Stack) |
| Styling Components (`/theming/components`) | The hooks/class-prop/Card-treatment claims all traced true against `hooks.ts` and the shipped theme CSS (`card.css`'s `.hz-card--outlined`/`--elevated`/`.hz-card-title` selectors match exactly). The rollup table (see above) was dropping the `values` (type/default) column that every per-component Theme Hooks table shows. Same pre-scaffold structure as the other three pages. | fixed (rollup completeness) — added a `Values` column (`<code class="values">`, same blue-tint convention as `ThemeHooks.svelte`) between Hook and Component; scaffold conversion (four sections + intro); one `section :global(.hz-card)` demo-sizing selector had to become a fully global `:global(.doc-section .hz-card)` — `Stack as="section"` renders the tag dynamically via `svelte:element`, so `svelte-check` can no longer statically prove a bare `section` selector matches, the same reason `.hz-card` itself needed `:global()` already |
| Example Themes (`/theming/examples`) | Ocean/Sunset/Terminal content verified against the live configs and generated sheets (see above) — accurate, AA-graded in both modes, no drift. One banned word: "grows the system rather than just recoloring it" ("just" as a bare intensifier — same contrastive-idiom shape as the Contrast/Motion pages' "not just" fixes from the Foundation batch). One copy-paste completeness gap: the "Growing the vocabulary" section's illustrative `registryCode` config sample was the one config fence on the site with no `import { defineConfig } from '@hyzer-labs/ui/config'` line, unlike every sibling sample (tokens page, getting-started, the three example configs shown elsewhere on this same page). Same pre-scaffold structure as the other three pages, plus two nested-content spacing cases the generic "every `<p>` is a Stack child" fix doesn't cover: the intro `<div>` sandwiches a comparison table between two paragraphs (not itself a Stack), and the "How these work" Accordion's `why-wins` panel renders two back-to-back `<p>`s with no Stack of their own. | copy — "just" → "only"; added the missing `defineConfig` import line to `registryCode`. scaffold — same conversion; intro's table/follow-on paragraph and the Accordion-panel paragraphs given targeted local margin rules (`:global(.hz-accordion-panel p)`, since Accordion's panel content isn't reachable via a literal template selector either) instead of relying on the zeroed generic `p` rule; a shared `:global(.tab-note:last-child) { margin-bottom: 0 }` rule stops docs.css's shared 1rem note margin from stacking on top of the section Stack's own gap in the three sections where a tab-note is the trailing element |
| Getting Started (`/getting-started`) | Out of the four-page core scope but named as overlap — the tier-1/2/3 CSS, Svelte, and `hyzer.config.ts` samples (including the same `brandRed` ramp → `--hz-intent-fairway` chain, validated the same way as the tokens-page sample) all traced true; the Introduction page's link to it (specs/30 R4) confirmed present. Same pre-scaffold structure and the same oversized-gap defect as the four Theming pages (screenshot-confirmed `gap="xl"` root). Not explicitly named by the task's scaffold-adoption item (which lists only the four Theming pages), but structurally identical and part of the same reviewed family. | scaffold — same conversion applied for consistency, since leaving one page in the family on the old rhythm while its neighbors moved would be its own inconsistency; no copy findings |

**Open questions (deferred, not fixed):** none API-shaped. One
implementation-detail observation logged but deliberately **not acted on**:
`/theming/overview` and `/theming/components` both claim the reference
theme's rules are universally "wrapped in `:where()` so everything stays at
single-class specificity." In practice a number of shipped sheets
(`toc.css`'s `data-level`/`aria-current` selectors, and similar single-class
+ single-attribute selectors in `table.css`/`dropdown.css`/`combobox.css`/
`file-upload.css`) sit at two-part specificity without a `:where()` wrap —
`:where()` is reserved in practice for selectors stacking *multiple*
modifiers (e.g. `[data-variant='outline'][data-intent='danger']`) back down
to one. The literal universality of the claim is imprecise, but the outcome
it promises ("your unlayered CSS wins by default") holds regardless, because
cascade-layer priority beats specificity outright — an unlayered selector of
any specificity already beats every layered rule. Given the pattern is
widespread and pre-existing (unflagged by every prior batch that touched
these components), fixing it would mean auditing/rewriting `:where()` usage
across a dozen-plus theme files well outside this batch's scope; softening
the docs claim instead would be the lower-risk fix if this is ever revisited.

hooks.ts-content findings deferred per the task's instruction (concurrent
builder is actively editing `hooks.ts`): none found. Every hooks.ts row
referenced by the Theming pages (all `props` entries rolled up on
`/theming/components`; the Card `parts` entries named on the same page) was
checked against the shipped theme CSS and is accurate — the only defect was
in the *rollup page's own rendering* (the missing Values column, fixed
directly per the task's write-scope), not in `hooks.ts`'s content.

Gates: `svelte-check` 0 errors/warnings; `prettier --check` + `eslint` clean;
unit `74 files / 2384 tests` passed (no library code touched this batch —
same count as the prior entry); `build` (prerender,
`@sveltejs/adapter-static`) succeeded; e2e `388/388` passed, including the
theme-hooks-rollup and theme-toggle describe blocks. No files owned by the
concurrent blockquote/pagination/table/header/`hooks.ts` builder were
touched.

## User feedback round (four items) on the component-updates batch

Four user-directed fixes on top of the "Nine-item component-updates batch"
above, not a checklist pass.

**1. Blockquote `intentScope` (API, opt-in full-intent coloring).** New
`intentScope?: 'line' | 'full'` (default `'line'` — R9's exact prior
behavior). `'full'` additionally colors the quote text with the intent;
the attribution row stays muted under either value. Reflects as
`data-intent-scope`, present **only when `intent` is set** (mirrors
`data-intent`'s own presence rule — the scope attribute is meaningless
without an intent to scope; the always-present `data-align` shape was
considered and rejected). Implemented as a second `--_c`-style hook in
`blockquote.css`: `--_tc` (text color) is unset by default, so
`.hz-blockquote-quote`'s `color: var(--_tc, inherit)` falls through to
`inherit` unless `[data-intent-scope='full']` sets `--_tc: var(--_c)`.
DEMO REWORK: the Intent tab's seven stacked `Example`s collapsed into one
interactive `Example` — a dogfooded `Select` (intent, 7 options) and
`RadioGroup` (`intentScope`, horizontal, 2 options) drive both the live
`Blockquote` and its derived code fence (icons page's slider-driven-fence
pattern, adapted to selects/radios), fence omits `intentScope` when
`'line'`. Files: `Blockquote.svelte`, `blockquote.css`,
`Blockquote.svelte.spec.ts` (new Blockquote-R10 suite, 4 tests),
`src/docs/data/blockquote.ts`, `hooks.ts`, `blockquote/+page.svelte`;
specs/26 amendment (extends the fresh R9 dated section).

**2. Pagination chevrons borderless (component, theme).** The prior
un-circling fix (item 7 of the nine-item batch) left `outline`'s visible
border on the prev/next chevrons — not the "borderless chevron" the user
asked for. `Pagination.svelte`'s prev/next `Button`s: `variant="outline"`
→ `variant="ghost"` (matching the page-number buttons' own variant).
`pagination.css`'s `border-radius` override on `[data-icon-only]` is
**not** moot under ghost — it still shapes the hover fill and
`:focus-visible` ring, both of which follow border-radius independent of
border color — kept, comment updated. Carousel explicitly out of scope
(concurrent builder's territory) — that builder made the equivalent
`ghost` change to Carousel's own chevrons independently, on their own
schedule (see the specs/43 entry above), no collision. specs/21 amendment
(extends the fresh dated section).

**3. Table — bug + tab restructure.**
   - **BUG (root cause found and fixed):** stacked mode never reverted
     once un-stacked. `table.css`'s base stacked-cell selector,
     `:where(th, td):not(.hz-table-cell-select):not(.hz-table-empty)`,
     chained its two `:not()` exclusions **outside** `:where()` — each
     contributes a class-level specificity point regardless of nesting,
     inflating the selector to `(0,4,1)` against the un-stacking
     `@container` override's `(0,2,1)`. The base rule won unconditionally
     regardless of container width, so cells (and, a second
     previously-undemonstrated instance, the `.hz-table-cell-select`
     checkbox cell, which had **no** `@container` counterpart at all)
     never returned to `table-cell`/proper `data-align` once the
     container widened back past the threshold — confirmed in-browser via
     a real preview build (Playwright probe) before touching any code:
     `display: flex`/`text-align: start` persisted on every cell at
     898px, well above the 640px `sm` threshold. Fix: folded the `:not()`
     exclusions into the `:where()` argument list (zeroing their
     specificity to a true `(0,2,1)` tie, restoring correct source-order
     resolution); added matching-specificity `.hz-table-cell-select`
     resets to all three `@container` blocks; added
     `[data-align='center']`/`[data-align='end']` overrides to each block
     (a related bug found while fixing the above — the base rule's
     unconditional `text-align: start` had the same inflated specificity
     and permanently overrode real column alignment even unstacked). New
     `Table.stack.svelte.spec.ts` (kept separate from
     `Table.svelte.spec.ts` — loading `table.css` clip-hides the stacked
     thead by default, which broke that file's unrelated userEvent
     sort/select tests at their default unset width) pins the fix with
     forced pixel widths and computed-style assertions, including a
     toggle-back-and-forth-more-than-once case. `docs.e2e.ts`'s stacked
     demo test strengthened per the ask — it previously only ever drove
     the demo one direction; now asserts `display: table-cell` (and the
     `::before` label disappearing) after re-widening past 640px, then
     re-narrows and re-asserts stacked, proving full reversibility, not a
     one-shot fix.
   - **TAB RESTRUCTURE:** the "Sorting" and "No sorting" top-level demo
     tabs collapsed into one top-level "Sort" tab with three nested
     sub-tabs (`Client-side`/`External`/`No sorting`), the established
     inner-`Tabs` idiom (Stack/Container/Split's padding-value sub-tabs).
     The prior "Sorting" tab had stacked both client-sort and
     external-sort `Example`s in one panel — now true siblings, so future
     sort variants get a natural home instead of another stacked
     `Example`. `docs.e2e.ts`'s sorting test drives the default "Basic"
     tab, unaffected.
   - Files: `table.css`, `Table.stack.svelte.spec.ts` (new),
     `table/+page.svelte`, `docs.e2e.ts`; specs/37 amendment (two dated
     entries, one per fix).

**4. Header default-vs-bordered demo bug (docs-only, component verified
clean).** Investigated first: confirmed in-browser (computed
`border-bottom-width`) that `Header.svelte`/`header.css`'s real
`bordered` treatment is correct — a genuine 1px bottom-only hairline,
present only with `data-bordered`. Root cause was the docs page's own
scoped CSS: `.inner-tab :global(.hz-header) { border: 1px solid …;
border-radius: …; }` unconditionally framed every rendered `Header` in
the Surface tab with a full 4-sided border regardless of the actual
`bordered` prop — far more visually dominant than the component's own
subtle bottom hairline, so all three surface combos (Default/Bordered/
Transparent) read as identically "bordered." Fix: removed the framing
rule from `header/+page.svelte`; the existing `.surface-backdrop` gradient
tint (added for the Transparent combo) is sufficient visual containment
on its own. Verified in-browser post-fix: Default `border-bottom-width:
0px`, Bordered/Transparent `1px`, Transparent's background transparent
over the gradient — the three are now visibly distinct. No `Header.svelte`/
`header.css` change. specs/35 amendment (extends the fresh dated section).

Gate results for this round: `svelte-check` 0 errors/warnings; `prettier
--check` + `eslint` clean; unit `74 files / 2384 tests` passed (this
round adds 4 Blockquote-R10 tests to the existing `Blockquote.svelte.spec.ts`
and a new `Table.stack.svelte.spec.ts` file with 3 tests; the +1 file/net
count also reflects concurrent Carousel/Forms-batch work landing in the
same working tree — see the measured totals in the two entries above);
`build` (prerender, `@sveltejs/adapter-static`) succeeded;
`palette-namespace.spec.ts`/`hooks.spec.ts`/`data.spec.ts` re-run green in
isolation; e2e `388/388` passed (strengthened Table stacked-mode assertion
included, no new failures). No files owned by the concurrent Carousel or
Forms builders were touched; `docs.e2e.ts` edits were surgical (one table
test strengthened, no header test existed to touch).

## Six-item user tweak batch (2026-07-23)

User-directed batch, not a checklist pass — six numbered items across Button,
Carousel, Header, Alert, and the product-detail pattern.

| Item | Change | Resolution |
| --- | --- | --- |
| 1. Button loading-spinner speed | `hz-spin`'s cycle read too fast at 0.8s/rev ("anxious/rushed"). Retuned to 1.4s/rev, `button.css`. Not wired to a `motion.duration` token — that scale (fast 250/base 400/slow 550ms, specs/15) is tuned for one-shot transitions; even `slow` is under a third of a comfortable continuous-spin rate, so a literal value (with a comment explaining why) is more honest than stretching a token past its range. Judged in-browser (computed `animationDuration` verified `1.4s`; visually calmer, still clearly in-progress). | fixed (theme) — `button.css`; specs/01 gained a dated Amendments section |
| 2a. Carousel focus-mode min-height | User report: on a short carousel (e.g. one-line `Blockquote` slides), the `controls="focus"` revealed row — an absolutely positioned overlay with no reserved layout space (specs/43 R3) — could cover most of the slide. Theme-level fix, scoped to `data-controls='focus'` only: `.hz-carousel-viewport` gets `min-height: var(--hz-carousel-focus-min-height, 12rem)`. The default `controls="visible"` row sits in normal flow below the viewport (never overlaid on slide media) and needs no reserved height, so it's unaffected; verified in-browser that Lightbox (which never passes `controls="focus"`) renders byte-identical, no layout diff. | fixed (theme) — `carousel.css` (new sizing hook, `--hz-carousel-dot-size` precedent); `hooks.ts` prop row; specs/43 gained a dated Amendments section |
| 2b. Carousel minimal-controls restyle example | New "Minimal controls" demo tab (theme example, not a new prop): a plain consumer class (`:global(.minimal-carousel) :global(.hz-carousel-dot)` etc., the Lightbox `.gallery-strip`/`.hz-lightbox-trigger` `:global()` precedent) restyles the dots into flat segments of a thin progress trackline — width auto + flex 1 + 3px height, active segment colored `--hz-intent-primary`, rest `--hz-color-border`. Chevrons stay in the DOM, in the tab order, and Enter/Space-operable throughout (never `display`/`visibility`/`aria-hidden`/`inert`) but are visually hidden (`opacity: 0`) until `:focus-visible` reveals them individually — the same a11y posture `controls="focus"` already ships (specs/43), applied per-control here so the trackline itself stays always visible; tab-note states this explicitly. Fence shows markup + CSS via the `'<' + 'style>'`/`'</' + 'style>'` concatenation (parser gotcha, Link/Footer precedent). Colors via `--hz-color-*`/`--hz-intent-*` only. | docs only — `src/routes/components/carousel/+page.svelte`; no spec amendment (pure docs-page change, no library/theme file touched by this item) |
| 3. Header "Bar" → "Basic" tab | Renamed tab id/label (`bar`→`basic`, "Bar"→"Basic"). Its fence (`basicCode`) now opens with the `navItems: NavItem[]` array literal — the same shape as the live demo's `demoItems` (labels/hrefs, one entry with a `children` sub-menu) — above the `<Header items={navItems} bordered>` usage, so readers see the data shape instead of just the prop reference. | docs only — `src/routes/components/header/+page.svelte`; no spec amendment |
| 4. Alert icon + rounding demos | Verified against `Alert.svelte`: `icon?: Snippet` (decorative, rendered `aria-hidden`) and `rounded?: Rounded` (default `'md'`) were both undemoed despite being documented props. New "Icon" tab: two `Alert`s pairing an intent with a matched generated icon (`success`+`IconCircleCheck`, `danger`+`IconTriangleAlert`). New "Rounding" tab: a labelled row per `Rounded` value (`none`/`sm`/`md`/`lg`/`full`), Button's size-row precedent (`.rounded-demo`/`.rounded-row`/`.rounded-row-label`); fence omits `rounded="md"` (the default). | docs only — `src/routes/components/alert/+page.svelte`; no spec amendment |
| 5. Product detail: Carousel + Lightbox composition | Added the common e-commerce pattern: the product Carousel's active slide is a `lightboxGroup` trigger. Investigated Lightbox's public composition surface first (`Lightbox`'s own per-item trigger strip vs. the `lightboxGroup` attachment, `src/lib/attachments/lightboxGroup.ts`) — `lightboxGroup()` was the right mechanism, not `Lightbox` itself: wrapping the Carousel in `<div {@attach lightboxGroup({ dialogLabel })}>` lets it enhance the Carousel's own rendered `<img>`s in place. Off-screen slides carry native `inert` (Carousel's own mechanism, not this attachment), which blocks their hit-testing/focusability at the browser level, so only the *active* slide's image is actually clickable/keyboard-reachable — but `lightboxGroup`'s `scan()` still counts every slide's image (client rects exist regardless of `inert`), so the opened viewer's gallery pages across all colorways, seeded at the clicked slide's index. Verified in-browser: clicking the active slide opened the shared `LightboxOverlay` at the correct index with working prev/next paging. Asset-URL structure: a new `PRODUCT_MEDIA: Record<string, string>` map is the sole thing pointing at image sources (currently generated SVG placeholders via `discArt()`) — every render call site reads `PRODUCT_MEDIA[colorway.id]`, so pointing the map at real `static/media/products/*.jpg` files later is a constants-only change. Added a reciprocal cross-link from the Lightbox page's "Group attachment" tab-note to `/patterns/product-detail`, and a `lightboxGroup` entry to the pattern page's "Composes" list. | fixed (docs/pattern) — `src/docs/samples/ProductDetail.svelte`, `src/routes/patterns/product-detail/+page.svelte`, `src/routes/components/lightbox/+page.svelte`; no spec amendment (composes existing, already-specced `lightboxGroup` — specs/25 — with no behavior change) |

Files touched: `src/lib/theme/components/button.css`, `carousel.css`;
`src/docs/hooks.ts`; `src/docs/samples/ProductDetail.svelte`;
`src/routes/components/{carousel,header,alert,lightbox}/+page.svelte`;
`src/routes/patterns/product-detail/+page.svelte`; `specs/01-button.md`,
`specs/43-carousel-drag.md` (dated Amendments sections).

Gates: `svelte-check` 0 errors/warnings; `prettier --check` + `eslint` clean
on every touched file; unit `74 files / 2385 tests` passed (the +1 test over
the prior entry's count is a concurrent, out-of-scope `hooks.spec.ts`
addition from another in-flight session sharing this working tree, not
authored by this batch); `build` (prerender, `@sveltejs/adapter-static`)
succeeded; e2e `387/388` passed — the one failure
(`/components/toggle`, no-horizontal-overflow at 375px) traces to no file
this batch touched (`toggle/+page.svelte` is absent from `git status`
entirely) and is unrelated to a concurrent session's in-flight changes to
`manifest.ts`/`ThemeHooks.svelte`/`hooks.spec.ts`/`combobox/+page.svelte`
in the same working tree, also outside this batch's scope. Every route this
batch touched (`/components/carousel`, `/components/header`,
`/components/alert`, `/components/lightbox`, `/patterns/product-detail`)
passed its own overflow/functional checks individually.

## Combobox large-list demo + Toggle theme-hooks warning mechanism (2026-07-23)

Two user-directed items, unrelated to each other beyond both touching docs
infrastructure.

**1. Combobox — large virtualized-list demo. Investigated first, hit Case
(b) (the deferred-integration case), not (a).** Read `Combobox.svelte` and
`specs/22-combobox.md`/`specs/23-virtualizer.md` before writing any demo
code. Finding: `Combobox`'s listbox is **not** snippet-customizable — the
`<ul role="listbox">`/`<li role="option">` markup is fully internal to the
component (no slot/snippet hook a consumer could use to swap in
`Virtualizer`), and `visibleOptions` (Combobox-R6) always renders **every**
filtered option with no windowing. This isn't an oversight: specs/22's Out
of Scope explicitly defers "Option virtualization / windowing" to a
follow-up spec, and specs/23's Out of Scope explains why it isn't free —
`aria-activedescendant` virtual focus (Combobox-R9) requires the active
`<li>` to be **present in the DOM**, but a `Virtualizer` window elides
off-screen rows, so the active option could scroll out of existence; and
Combobox keys option ids off the **filtered** index while `Virtualizer`
tracks the **absolute** index, which would need reconciling. Confirmed this
is unconditional (not perf-dependent): even with a small dataset, an
unfiltered open still mounts every option, since `query === ''` short-
circuits to the full `options` array (Combobox-R6). Building a demo that
hacked around this (e.g. forking the listbox markup to embed a raw
`Virtualizer`, or hand-rolling a second `aria-activedescendant` contract)
would ship an inaccurate, ARIA-incorrect example under the real component's
name — declined per the instruction to not hack it.

Built the best **honest** demo the current API allows instead: a new
"Large list (filtering)" tab on `/components/combobox`, between "Custom
filter" and "Styled chips". Dataset: 60 real city names × 49 disc-golf-
course-name words (`Pines`, `Ridge`, `Meadow`, …), cross-joined into 2,940
`FormOption`s at module scope with a plain `flatMap` (no `Math.random`, so
SSR output matches the client on hydration — the same determinism
convention `Virtualizer`'s own 10,000-row docs demo uses, verified by
reading that page first). Each option: `label: "${city} — ${word} Disc Golf
Course"`, `value` a lowercased, hyphenated slug. The tab-note states the
approach and the practical ceiling plainly: filtering itself stays snappy
at this size (a single in-memory `Array.prototype.filter` scan over ~3k
objects), but the **unfiltered open** is the honest limit — with an empty
query every option renders a real `<li>`, so a dataset in the low thousands
is comfortable, while tens of thousands unfiltered would visibly lag with
no windowing to fall back on; the note also names `/components/virtualizer`
and the deferral by name so a reader who needs true windowing knows where
to look and why it isn't wired up yet. Verified in-browser (dev + a
production preview build): typing narrows 2,940 → single digits with no
perceptible lag; `svelte-check`/build confirm the SSR-rendered option list
matches the hydrated one (no hydration mismatch warnings).

**Open question logged for a future spec** (per the ask — proposing the API
shape virtualization would need, referencing specs/22 + specs/23's
existing Out-of-Scope deferral rather than re-litigating it): a windowed
Combobox listbox would need (a) a reconciliation layer between the
Virtualizer's **absolute** index and Combobox's **filtered** index — e.g.
Combobox computing `visibleOptions` as today, but handing that filtered
array straight to `Virtualizer` as its `items`, so the Virtualizer's
"absolute" index *is* the filtered index and no second mapping is needed;
(b) a way to force the **active** option's row to always render inside the
Virtualizer's window regardless of scroll position — the cleanest shape is
probably Combobox driving the Virtualizer's scroll position programmatically
on every `activeIndex` change (an `Alt`/Arrow-key move calls something like
a `scrollToIndex` the Virtualizer doesn't have yet — specs/23 lists
`scrollToIndex` itself as Out of Scope for v1) rather than the Virtualizer
exposing an "always keep index N mounted" pin, which would complicate its
windowing math for every consumer to serve one; (c) the `row` snippet
producing the exact same `<li role="option" id="hz-opt-{uid}-{i}" …>`
markup Combobox renders today, so `aria-activedescendant` keeps resolving —
meaning the windowing integration is closer to "Combobox grows an optional
internal `Virtualizer` above some option-count threshold" than "a consumer
composes the two publicly." None of this was built — it's a proposal for
whoever picks up the follow-up spec, not a decision.

**2. Toggle — theme-hooks warning mechanism.** Read `field.css`'s Toggle
track/thumb block first: `.hz-field--toggle input.hz-toggle` is shipped
**outside** `@layer hz-theme` on purpose, at a raw `(0,2,1)` specificity, so
it always outranks the component's own scoped structural reset regardless
of layer order (the comment at its declaration site already says this is
"deliberately UNLAYERED"). Then read the Terminal example theme's override
(`src/lib/theme/examples/terminal/components/toggle.css`), whose own header
comment names this "the one component where a theme cannot be careless"
and demonstrates the fix: scope the override selector under the theme's
own root class (`.hz-theme-terminal .hz-field--toggle input.hz-toggle`),
which clears `(0,2,1)` outright at `(0,3,1)` and wins regardless of import
order — a plain `@layer`-wrapped or tied-specificity override would
silently lose with no error.

Implemented the mechanism generically, not Toggle-specifically: added an
optional `warning?: string` field to `ComponentHooks` in `src/docs/hooks.ts`
(backtick segments render as inline `<code>`, the same convention
`DocPage`'s `a11yNote` already uses). `ThemeHooks.svelte` — the component
DocPage's "Theme hooks" section renders per component — now renders
`hooks.warning`, when present, as an `<Alert intent="warning"
headingLevel={3}>` positioned above the hook tables (`h3`, since it sits
under the section's own `h2`, the same nesting `radius-elevation`'s
existing shadow-elevation `Alert` uses as precedent). Wrote Toggle's actual
warning content from the real constraints above: it explains the unlayered
exception, why a normal override can silently do nothing, the fix (scope
under your own root class), and names the Terminal theme as the worked
example. Also fixed a small pre-existing loose end while in the file: the
`data-state (on input.hz-toggle)` attrs row already said "the toggle rules
must win the specificity fight described below" with nothing ever below it
elaborating — since the new warning renders *above* the tables, reworded
that to "described above" so the cross-reference is accurate now that
there's finally something to point at. `hooks.spec.ts` gained one more
well-formedness check (a `warning`, when present, is non-empty and its
backtick count is even, so `ThemeHooks.svelte`'s split-on-backtick render
can't silently swallow the tail of the string into a dangling `<code>`).
No other component populates `warning` — every other page still renders
identically (verified: `hooks.ts`'s existing rows/tests untouched besides
Toggle's own entry and the one reworded phrase).

**Bug found and fixed while building this: a real horizontal-overflow
regression on `/components/toggle` at 375px, traced to this change.**
Discovered via the project's own e2e overflow sweep
(`R-Responsive — no horizontal overflow`), which failed only on
`/components/toggle` and nowhere else — confirmed the delta was mine (not
noise from concurrent work elsewhere in this shared tree) by isolating with
`git stash`: the unmodified tree passed at exactly 375/375, the modified
tree failed at 381/375. Root cause, found by walking the DOM in a real
headless-browser probe rather than guessing from the CSS: the new warning
Alert's body (`.hz-alert-body`, `flex: 1; min-width: 0`) was correctly
shrinkable, but one of the warning's inline `<code>` spans — the Terminal
theme's file path, `theme/examples/terminal/components/toggle.css`, a
single 47-character token with no spaces and therefore no natural wrap
point — forced that span wider than its 308px column
(`scrollWidth` 346 vs. `offsetWidth` 308 on the body, isolated by
comparing every candidate element's computed style/box before touching any
code). Every other page checked (`/components/checkbox`, `/components/
button`, `/foundation/radius-elevation` — which already has a similarly-
styled warning `Alert` — and `/components/combobox`, including this same
session's new large-list tab's own longer prose) stayed at exactly
375/375, confirming the long unbroken file path was the specific trigger,
not `Alert`, code styling, or long prose in general. Fix: one CSS rule
scoped to the new feature, `:global(.hooks-warning code) { overflow-wrap:
anywhere; }` in `ThemeHooks.svelte` — deliberately not a global `code`
rule (would be a wider blast radius than this fix needs) and not a rewrite
of the file path into something shorter (the real path is the more useful,
copy-pasteable content). Verified in a rebuilt production preview:
`/components/toggle` back to exactly 375/375; confirmed via the concurrent
session's own findings entry immediately above this one, which hit the
same failure from the other side (their batch didn't touch `toggle/
+page.svelte` at all) and correctly attributed it to this session's
in-flight `ThemeHooks.svelte`/`hooks.ts` changes rather than their own —
independent confirmation the diagnosis and fix are right.

Files: `src/docs/hooks.ts` (`ComponentHooks.warning` field + Toggle's
entry + the "described above" wording fix), `src/docs/hooks.spec.ts` (one
new well-formedness test), `src/docs/ThemeHooks.svelte` (renders the
warning `Alert` + the `overflow-wrap` fix), `src/routes/components/
combobox/+page.svelte` (new "Large list (filtering)" tab + its dataset).
No spec amendment — specs/22 and specs/23's existing Out of Scope sections
already cover the deferral accurately; nothing here needed correcting.

Gates: `svelte-check` 0 errors/warnings on every file this entry touches
(re-verified after the overflow fix); `prettier --check` + `eslint` clean;
unit `74 files / 2385 tests` passed pre-fix and `2386` on a later re-run
after unrelated concurrent work landed in the shared tree (net +1 test,
not authored here); `build` (prerender, `@sveltejs/adapter-static`)
succeeded, confirming SSR/hydration match for both the Combobox large-list
dataset and the new Alert markup; e2e `388/388` passed after the overflow
fix (kill-port-4173 protocol, first attempt hit an unrelated
`ERR_CONNECTION_REFUSED`/preview-server-OOM flake on one test per the
documented retry allowance, second attempt clean). Two unrelated
`svelte-check` errors (`src/lib/config/schema.ts`) and two unrelated
warnings (`src/docs/samples/Article.svelte`) appeared in the tree after
this entry's own gate run, from other concurrent in-flight work
(`specs/44-utilities.md` is untracked in the same tree) — not touched or
introduced by this entry, left for whoever owns that batch.

## Three new Patterns pages: Article, Recipe, Contact form (2026-07-23)

User-directed batch, not a checklist pass — three new pattern pages, each
following the established Homepage/ProductDetail/CheckoutForm sample+route
conventions exactly (samples import only public `$lib` exports; routes
render the sample inside `<Container breakout>` with a `?raw` source
listing; asset URLs go through a single per-sample constants map using the
labeled-SVG-data-URI / `about:blank` placeholder conventions — no fake
static paths, no real third-party media). Patterns have no formal spec;
the samples and these conventions are the contract, so no spec amendment
accompanies this entry.

**Article** (`/patterns/article`, `samples/Article.svelte`) — a course-design
editorial piece: a Hero opener (`headingLevel={2}`, no media — center
layout, matching Homepage's precedent of leaving Hero text-only rather than
risking contrast on a photographic overlay background with no built-in
scrim), an author/date byline, a `Divider`, ~700 words of true-to-life prose
about disc golf course design (risk/reward routing, green complexes,
referencing the established "Maple Hill" lore from Homepage/CheckoutForm),
an intent-colored `Blockquote` pull-quote (`intent="primary"`, default
`intentScope="line"` — only the accent bar takes the color, matching the
component's own restrained default), and a breakout image: the prose column
is capped at `Container max="md"`, and the image escapes it with a nested
`Container breakout` — the same width-sensitive convention the Container
and Table docs pages use to demo off-column bleed, here applied inside a
sample for the first time. The prose column also dogfoods
`--hz-font-family-serif` (existing token, previously unused outside the
typography foundation page) on the body headings/copy only — byline and
captions stay in the sans default so page metadata doesn't compete with the
reading experience.

**Recipe** (`/patterns/recipe`, `samples/Recipe.svelte`) — a "Leicester
League-Night Chili" recipe (Leicester, MA ties back to the established
Homepage/CheckoutForm shipping-address lore). Ingredients render as a
plain, non-sorting `Table` — the exact shape of the Table docs page's own
"No sorting" demo (no `sortable` flag on any column, so no sort buttons
render); notes cells are optional per-row and confirmed against
`Table.svelte`'s `defaultCellText` (undefined → empty string, not the
literal text `"undefined"`) before leaving some rows without a note. The
method is step-by-step prose (`<ol>`) with photos along the way and a short
technique `Video` near the end (`about:blank` src + a generated poster data
URI, both read from a `RECIPE_MEDIA` constants map alongside the two food
photos — the same asset-URL-swap-point comment convention as
ProductDetail's `PRODUCT_MEDIA` and the Video docs page's `posterSvg()`).
Dietary-tag `Badge`s (`variant="outline"`, restrained — no intent color,
matching ProductDetail's flight-stat badges) sit under the title. Density
system used where it read as natural rather than forced: `gap="away"`
between the page's major sections (header block, image, ingredients,
instructions), `gap="near"` between the tightly-related ingredients heading
and its table — no `data-density-shift` scaffold, since that nesting
mechanism is a route-level concern the task explicitly scoped out for
pattern pages (matching what the Homepage route already does: no density
scaffold).

**Contact form** (`/patterns/contact-form`, `samples/ContactForm.svelte`) —
the minimal end of the Form spectrum, positioned explicitly as that in both
routes' lead copy with a reciprocal cross-link
(`/patterns/checkout-form` ↔ `/patterns/contact-form`, one sentence added to
each route's existing lead paragraph). Four fields (`TextInput` × 2,
`Select` for topic, `Textarea` for message) plus a submit `Button`, no
Split/Card order summary — but the validation flow is identical in shape to
CheckoutForm's at full size: a plain field-name → message record built at
submit time, reshaped by `toFormErrors`, with `Form` rendering the linked
error summary and moving focus to it, the same array feeding each field's
inline `error` prop.

A component-scoping note worth recording for future samples: passing a
custom `class` into a `$lib` component (e.g. `<Cluster class="byline">`)
and then writing a plain (non-`:global`) selector for that class in the
sample's own `<style>` block does **not** match — Svelte only stamps its
scope-hash class onto elements written literally in the *authoring*
component's own template, and a class name handed to a child component
as a prop doesn't retroactively scope that child's own rendered DOM.
Article's byline block was restructured to wrap the `Cluster` in a literal
`<div class="byline">` instead, avoiding the need for a `:global()` escape
entirely and keeping the sample consistent with every other sample's
style block (none of which style a class passed into a `$lib` component).

Files: `src/docs/samples/{Article,Recipe,ContactForm}.svelte`;
`src/routes/patterns/{article,recipe,contact-form}/+page.svelte` (new);
`src/routes/patterns/checkout-form/+page.svelte` (one-sentence reciprocal
cross-link); `src/docs/manifest.ts` (Patterns section only — three new
entries: Article/Recipe placed after Homepage, Contact form placed after
Checkout form; re-read immediately before editing since a concurrent
session was reordering the unrelated Forms component group in the same
file, confirmed no overlap before saving).

Gates: `svelte-check` 0 errors/warnings on every file this entry touches
(the earlier-observed Article.svelte warnings, noted in the entry above
this one, were from a mid-write snapshot of this same in-progress work —
resolved once the file was completed, not a separate bug); `prettier
--check` + `eslint` clean; unit `74 files / 2408 tests` passed; `build`
(prerender, `@sveltejs/adapter-static`) succeeded for all three new routes
— one retry was needed after a first attempt failed on the unrelated,
concurrently-in-flight `/foundation/utilities` route (empty directory, no
`+page.svelte` yet, from the utilities builder's own in-progress session
sharing this tree); confirmed via `git status` this wasn't caused by
anything this entry touched, waited for that file to land, then reran
`build` clean. e2e `408/408` passed on the first attempt (kill-port-4173
protocol observed before the run) — includes the 375/768/1280px
no-horizontal-overflow sweep passing on all three new routes and the
existing specs/31 R5 Patterns-sample assertions unaffected. No files owned
by the concurrent utilities-engine or forms-tweaks/combobox/toggle
builders were touched by this entry.

## specs/44 — Utilities: opt-in generated sheet + `/foundation/utilities` (2026-07-23)

Implemented specs/44 R1–R10 in full — the opt-in, engine-generated
`utilities.css` (text-color role/intent helpers + the seven logical-property
margin families) and the `/foundation/utilities` docs page.

**Engine (R1–R3).** `generateUtilitiesCss(resolved, { intro? })` added beside
`generateCss` in `src/lib/config/generate.ts`, exported from `./config`.
Reuses `ResolvedConfig.sections` directly (roles/intent/space) — no
re-resolution — and the existing `banner`/`note`/`withIntro` header-weaving
helpers. Fixed emission order: two role helpers (`.hz-text`,
`.hz-text-muted`), one `.hz-text-<intent>` per resolved intent entry, then
the seven margin families (`hz-m`, `-block`, `-block-start`, `-block-end`,
`-inline`, `-inline-start`, `-inline-end`) × every resolved space rung —
family-major order (all rungs of one family, then the next family), so the
generated sheet groups by property. All declarations are `var()` references
into role/intent/space tokens only; every rule is unlayered, bare
single-class selectors (specificity `0,1,0`), no `!important` — mirroring
`.sr-only`. The header banner carries the generated-file notice plus the
utility definition and anti-goal paragraphs, verbatim from the spec's
doctrine section (both here and on the docs page) apart from stripping
markdown bold syntax for a plain CSS comment.

One bug caught before it shipped: the first-draft banner text read
`--hz-color-*/--hz-intent-*`, and the literal `*/` sequence inside a CSS
block comment prematurely closes it — Prettier's CSS parser choked on the
resulting garbled file. Fixed by spacing the slash (`--hz-color-* /
--hz-intent-*`); worth flagging as a general hazard for any future
generated-sheet prose that juxtaposes two `--hz-*-*` names with a bare `/`.

**Kebab-collision (edge case).** A consumer intent literally named `muted`
collides with the fixed `.hz-text-muted` role helper's class name —
`generateUtilitiesCss` now tracks emitted class names in a `Map` (seeded
with the two fixed role helpers) and throws `HyzerConfigError` naming both
parties (`config.tokens.intent.muted` and the role helper) before emitting
anything, mirroring the engine's existing kebab-collision message shape in
`schema.ts`'s `mergeGroup`.

**Wiring (R4).** `scripts/gen-tokens.ts` gained a `utilities.css` sheet
entry (`generateUtilitiesCss(resolveConfig())`); `pnpm gen:tokens`
regenerates it alongside `tokens.css` and the example sheets, and a drift
test in `config.spec.ts` pins the committed file to fresh engine output
byte-for-byte. Consumer opt-in: `HyzerConfig.utilities` gained as
`boolean | { output?: string }` (new `resolveUtilities` helper in
`schema.ts`, validated the same way as the sibling `output`/`icons` keys),
surfaced on `ResolvedConfig.utilities: { enabled, output? }`. The CLI
(`main.ts`) gained a `--utilities` boolean flag; `hyzer generate` writes no
utilities file by default, writes one next to the tokens sheet (default
`hyzer-utilities.css`, or `config.utilities.output` resolved the same way
the top-level `output` key is) when either the flag or the config key opts
in, and the flag's presence overrides the config key (config-only `output`
customization still applies even when the flag is what triggered the
write). `--check` suppresses the utilities write exactly like the tokens
write.

**Packaging (R5/R6).** `package.json` gained
`"./utilities.css": "./dist/theme/utilities.css"` next to `./tokens.css`/
`./reset.css`; `exports.spec.ts` pins the map entry, the required-keys
list, and that the dist file resolves. `utilities.css` lives under
`src/lib/theme/` and was deliberately **not** added to
`palette-namespace.spec.ts`'s `generatedSheets` exclusion set — it stays in
the scanned scope, so the existing R3.1 grep (zero `--hz-palette-*`) and R6
stale-name grep actively enforce the sheet's own doctrine rather than
exempting it; confirmed both pass with the file in scope.

**AA (R7).** No new `contrastReport` pairings — every `.hz-text-<intent>`
already has a graded `text:intent-<x>/surface` and `/surface-muted` row in
both modes (the existing `textTokens` loop in `report.ts` already includes
every `--hz-intent-*` key). Added a cross-check test in `config.spec.ts`
that walks every intent and asserts the corresponding rows exist and pass
on both surfaces in both modes, tying the utility sheet to the existing
gate without touching `report.ts`. The docs page states the AA boundary
verbatim (graded on the two surface roles only; any other background is
the consumer's responsibility).

**Docs page (R8/R9).** New `/foundation/utilities` (manifest leaf appended
to Foundation, last position, after CSS Reset) — three sections: the opt-in
sheet (import line, doctrine prose, `?raw`-sourced class tables for text
and margin families derived from `color`/`intent`/`space` metadata exactly
like the Typography/Colors pages, a live nudge-demo `Example`, a visual
margin-scale strip, and the full generated source via `CodeBlock`); the
always-on `.sr-only` (documents the a11y purpose, the six components/
scaffold that already emit `class="sr-only"`, and the actual rule sourced
`?raw` from `theme/base.css` — the extraction had to search for the literal
`.sr-only {` selector rather than the bare substring `.sr-only`, since the
file's own top-of-file header comment mentions "the `.sr-only` utility"
first and would otherwise be sliced from the wrong offset); and the opt-in
component conventions (`.hz-card-title`/`.hz-banner-title`, cross-linked to
`/components/card`, `/components/banner`, and `/theming/components`,
explicitly distinguished from the generated sheet). Reciprocal
cross-references added: one verbatim sentence each on `/theming/components`
(opt-in-classes section) and `/theming/overview` (tiers rundown), exact
wording from the spec.

**Docs dogfood (R10).** `src/routes/+layout.svelte` imports
`$lib/theme/utilities.css` after `theme.css`, before `docs.css`. Usage is
content-only — the two utility classes used on the docs page itself
(`.hz-text-success`, `.hz-m-inline-start-*` in the live nudge demo and the
margin-scale strip) are both inside page/demo content, never the shell
(sidebar/header/footer stayed on `docs.css`, unmodified).

**Manifest edit hazard worth recording.** The `Read` tool's `cat -n`-style
line-number prefix (a literal tab between the number and the actual line
content) made a copy-pasted `old_string` off by one tab level on the first
several attempts against `src/docs/manifest.ts` — `Edit` reported "string
not found" even though the visually-rendered lines looked identical.
Resolved by inspecting raw bytes (`od -c` / a small Python script) instead
of trusting the numbered Read output's whitespace by eye. Also confirmed
via `git diff` that the Forms-group reordering and the three new Patterns
entries already present in `manifest.ts` when this session resumed were
concurrent builders' work, not mine — my only diff there is the one
Foundation `Utilities` leaf.

No `src/docs/hooks.ts`/`ThemeHooks.svelte` change was needed or made —
utilities is not a component and has no hooks-table row; confirmed
`hooks.spec.ts`/`data.spec.ts` require no edit for this spec.

Files: `src/lib/config/{generate,schema,index}.ts`; `src/lib/theme/
utilities.css` (new, generated); `scripts/gen-tokens.ts`; `src/lib/cli/
main.ts`; `package.json`; `src/routes/foundation/utilities/+page.svelte`
(new); `src/docs/manifest.ts` (Foundation section only — one new leaf);
`src/routes/theming/{overview,components}/+page.svelte` (one cross-link
sentence each); `src/routes/+layout.svelte` (one import line); test files
`src/lib/config/config.spec.ts`, `src/lib/cli/main.spec.ts`,
`src/lib/exports.spec.ts` (all extended, no existing test changed).
`src/lib/tokens/palette-namespace.spec.ts` unmodified — confirmed green
with the new file in scope, per R6. No files owned by the concurrent
combobox/toggle/hooks or pattern-pages builders were touched.

Gates: `pnpm gen:tokens` regenerated `utilities.css` with zero drift on
every other committed sheet (`tokens.css`, the three example sheets);
`svelte-check` 0 errors/warnings; `prettier --check .` + `eslint .` clean;
unit `74 files / 2408 tests` passed except one pre-existing, out-of-scope
failure in `hooks.spec.ts` (`--hz-slider-length` undocumented) traced to
the concurrent Slider/RangeSlider vertical-mode work landing in the same
tree (confirmed via `git status`/`git diff` — no file this entry touched is
implicated); `build` (prerender, `@sveltejs/adapter-static`) succeeded,
`/foundation/utilities` included; `pnpm package` + `publint` both green,
`dist/theme/utilities.css` byte-identical to the committed source; e2e —
one full run passed `408/408`, a second full run (much slower under heavy
concurrent-session load, ~14 minutes vs. the usual ~1) had a single
`/components/badge` skip-link test time out at the default 30s, confirmed
a system-load flake (unrelated route, unrelated assertion) by rerunning it
alone immediately after, which passed in under 10s. Port 4173 killed before
every run per protocol.

## specs/46 — Docs theme as a shipped example (retire Sunset) (2026-07-23)

Implemented specs/46 R1–R8 in full: the docs site's own reading chrome ships
as a new, hand-authored example theme (`theme/examples/docs/docs.css`), the
docs app imports the shipped sheet instead of a private copy (full import
inversion), and Sunset is deleted with its ripple resolved end to end.

**The shipped sheet (R1–R3).** New `src/lib/theme/examples/docs/docs.css` —
NOT engine-generated, no `gen-tokens.ts` entry, no config. Holds the
page-rhythm scaffold (`.doc-intro h1`, `.doc-description`, `.doc-section h2`,
`.a11y-refs`), the demo scaffolding (`.tab-content`, `.inner-tab`,
`.tab-note`, `.demo-col`), the `.docs-table` flat-table override, the
`p code`/`li code` chip treatment (with its `[data-theme='dark']`
strengthening), and the content `*:focus-visible` ring with its
`.hz-field`/`.hz-button` exclusion list — lifted from `src/docs/docs.css` and
`+layout.svelte`'s `<style>` respectively. Ships unscoped (no
`.hz-theme-docs` root), stays in `palette-namespace.spec.ts`'s scan scope
(R2), and is covered by the BASE `tokens/fallback-parity.spec.ts` rather than
the per-config `examples.spec.ts` suite (R3) — the one example whose
fallbacks promise the library's own resolved values, since it adds no
palette. That required widening `fallback-parity.spec.ts`'s
`theme/examples/**` exclusion to carve out `theme/examples/docs/` as the one
in-scope subtree, rather than adding the new file to any exclusion list.

Two small, deliberate deviations from a byte-for-byte "verbatim" lift, both
because the source files' fallback literals had never been scanned by any
fallback-parity suite before (the private `src/docs/docs.css` lived outside
`src/lib`; the layout's `<style>` lives in `src/routes`, also outside its
scan) — moving them into `src/lib/theme/examples/docs/` puts them in scope
for the first time and surfaced two latent, non-conforming fallbacks. Neither
changes any rendered pixel on the docs site (tokens.css is always loaded
there, so a fallback only matters when the custom property is entirely
undefined): (1) `.doc-description`'s `color: var(--hz-color-text, inherit)`
→ `var(--hz-color-text, #000)`, matching the convention already used
elsewhere in the same file (`.skip-to-content`, `.docs-shell`) and the
token's actual resolved base value. (2) the dark-mode code-chip rule's
`var(--hz-intent-neutral, #9ca3af)` → `var(--hz-intent-neutral, #6b7280)` —
the original literal encoded the token's *dark-resolved* value as a
same-property fallback, which is incoherent (a fallback fires when the
property is undefined, which has nothing to do with `data-theme`); the tint
still strengthens 14% → 28% in dark exactly as before, since that swing comes
from the `color-mix()` percentage, not the fallback. Both are noted in the
new sheet's own comments.

**The import inversion (R4).** `src/routes/+layout.svelte` now imports
`$lib/theme/examples/docs/docs.css` in place of `../docs/docs.css`; the
code-chip pair, the content focus-ring rule, and the shell's own redundant
`.sr-only` copy (theme/base.css already ships one, imported earlier in the
same file via `theme.css` — R2 doctrine, "don't duplicate it") are removed
from the layout's `<style>`, which now holds only app-level guards
(box-sizing, body margin, `pre`/`img`/`video`/`table` overflow caps) and the
`prefers-reduced-motion` collapse. `src/docs/docs.css` is deleted outright.
A new guard test, `src/docs/docsExampleInversion.spec.ts`, pins both halves:
the shipped import is present, the private copy is gone.

**Sunset deletion, ripple resolved (R5).** `src/lib/theme/examples/sunset/`
removed entirely (config, tokens sheet, index sheet, all nine component
sheets). Every ripple point from the spec's checklist confirmed and fixed:
`examples.spec.ts` (`sunsetConfig`/`sunsetIntro` imports and array entry
removed — the `components/`-dir fallback `describe.each` needed no separate
edit, since it filters the `examples` array by `existsSync(components)`
dynamically); `scripts/gen-tokens.ts` (sheet entry + import removed, header
comment updated to name the four remaining sheets and note the Docs example
adds none); `palette-namespace.spec.ts` (both the `generatedSheets` and
`exampleConfigSources` sunset lines removed, doc comment updated to record
that the new Docs sheet is deliberately NOT excluded); `consumerSource.spec.ts`
(`sunset/sunset.config.ts` dropped from the fixture list); `exports.spec.ts`
(the three `theme/examples/sunset/*` pins replaced with one
`theme/examples/docs/docs.css` reachability pin, comment retuned to
singular "class-override theme"); `README.md` (dropped the stale
`theme/sunset.css` row and the pre-specs/32 "ocean.css / sunset.css" prose,
repointed the subpath table and the styling-tiers section at the real
`theme/examples/{ocean,terminal,docs/docs}.css` paths). Historical spec prose
(specs/29/15/16/41/42) and the Lightbox "Hole 7 at sunset" alt-text strings
are unrelated demo content, left untouched as directed. Confirmed by grep: no
remaining `sunset` reference anywhere under `src/` or `scripts/` outside
`Lightbox.svelte.spec.ts`/`lightboxGroup.svelte.spec.ts`/the lightbox demo
page's alt text (all pre-existing, unrelated).

**`/theming/examples` restructure (R6).** The freedom-arc `examples` array
collapses to Ocean + Terminal (the comparison table drops its Sunset column;
the intro prose retunes "three themes"/"deliberately three different amounts
of freedom" to "two", and "if you only read one, read Terminal's" to
"between these two, if you only read one..."). A new, visually distinct
third section, "Docs — a different kind of example," follows the arc: its
own blurb explicitly disclaims being a fourth freedom-axis point, states it
layers over the reference theme (carrying forward the "layered over" idea
the dropped table column used to state), and dogfoods the shipped sheet with
*no* extra import — `docs.css` is already loaded globally by the root layout,
so the section's demo runs on the real live sheet. Its Demo tab renders the
same `<Table>` twice, bare and wrapped in `.docs-table`, side by side — the
layered-cascade lesson Sunset used to carry, now taught by the override this
spec actually ships; its second tab shows the shipped `docs.css` verbatim via
`?raw`. The per-instance `.cta` lesson keeps working for Ocean + Terminal
(both demo panels already render `<Button class="cta">Go pro</Button>`,
unaffected by the array shrink); the `ctaCode` sample and the `<style>`
block's `.hz-theme-sunset .hz-button.cta` rule are removed, and the
surrounding prose ("in both demos above," "Terminal is the one example here
that roots its overrides at a class") retuned to match. The "How these work"
Accordion's `why-wins` FAQ entry — which only ever explained why Sunset's
layered override won the cascade — is retired from this section (its
lesson relocated to the Docs section per R6, not duplicated); `why-class`
stays, retexted for Terminal alone. The trailing "Start from one" coverage
note drops "Sunset and" and gains a one-sentence contrast with the Docs
example's opposite approach (no component-hook restyling at all). The
existing `Example` model, `CodeBlock`, `?raw` pattern, and `consumerSource`
are all reused unchanged; `docs.css` itself needed no `consumerSource` pass
(pure CSS, no import specifiers to rewrite).

**No new AA gate (R7).** No `contrastReport` change — the header comment on
the new sheet states the boundary verbatim (chip contrast holds on the
surface/surface-muted roles this site paints behind prose; any other
background is the consumer's responsibility), matching specs/44 R7's
posture.

**Spec + findings housekeeping (R8).** Appended a dated `### Amendments`
section to `specs/32-theme-examples.md` (it previously only had an
"Amendments to earlier specs" section, i.e. amendments specs/32 makes to
others — this is the first amendment recorded against specs/32 itself)
recording Sunset's retirement and the Docs replacement, with a note that
specs/32's Sunset-specific R3/table/directory-layout prose is left as
historical record. Amended the three named `/theming/examples` mentions in
`specs/30-theming.md` (lines 78, 120, 152 as given) in place, each flagged
inline as a specs/46 (2026-07-23) amendment rather than silently rewritten.
No manifest edit — the examples route/label is unchanged, per the task
boundary; confirmed no other builder's files (Slider/RangeSlider/field.css/
hooks.ts, the combobox page/samples/patterns/manifest PATTERNS section) were
touched.

**Byte-identity verification approach.** Since this is a relocation, not a
restyle, "byte-identical rendering" was checked three ways: (1) diffed the
lifted CSS's declared properties/values against the moved-from sources —
identical modulo the two fallback-literal fixes above, both dead code under
normal operation; (2) the full e2e no-overflow sweep (every manifest route ×
mobile/tablet/desktop) as the stated canary, since every docs page depends on
the relocated `.tab-note`/`.doc-section h2`/etc. scaffolding; (3) the new
load-bearing focus-ring e2e (`specs/46 — content focus-visible ring travels
with the docs example` in `docs.e2e.ts`) directly measuring computed
`outline-color` against the focused element's own `color` (currentColor) on
a content link, and asserting the same never happens on a `.hz-button` or a
`.hz-field input` (which keep their own themed ring — the reference theme's
own `:where(:focus-visible)` default plus each control's more specific
override), the precise scenario the exclusion list exists to prevent
regressing.

Files: `src/lib/theme/examples/docs/docs.css` (new); `src/lib/theme/examples/
sunset/**` (deleted, 11 files); `src/docs/docs.css` (deleted);
`src/routes/+layout.svelte`; `src/routes/theming/examples/+page.svelte`;
`scripts/gen-tokens.ts`; `src/lib/theme/examples/examples.spec.ts`;
`src/lib/exports.spec.ts`; `src/lib/tokens/palette-namespace.spec.ts`;
`src/lib/tokens/fallback-parity.spec.ts`; `src/docs/consumerSource.spec.ts`;
`src/docs/docsExampleInversion.spec.ts` (new); `src/routes/docs.e2e.ts`
(surgical append only); `README.md`; `specs/32-theme-examples.md`;
`specs/30-theming.md`; this file.

Gates: recorded in the same session's final message to the user (gen:tokens
post-deletion sheet set, svelte-check, format+lint, unit, build,
package+publint, e2e).

## specs/45 — Slider vertical orientation (2026-07-23)

Added `orientation`/`inputPosition` to both `Slider` and `RangeSlider` per
the reversal spec. The load-bearing mechanism (`writing-mode: vertical-lr;
direction: rtl` on the range(s), bottom-up growth) lands exactly as
specified; no new JS branches touch `onThumbInput`/`commitNumber`/`topThumb`
— RangeSlider vertical really is CSS-only (Vert-R7), verified by the fact
that zero lines changed in either component's `<script>` block beyond the
two new props and the `aria-orientation` stamp.

**Cascade-layer subtlety not spelled out in the spec, worth recording.**
Component `<style>` blocks in this codebase are unlayered (Svelte scoped
CSS, no explicit `@layer`); the reference theme is `@layer hz-theme`. Per
the cascade-layers spec, *any* unlayered declaration for a property
categorically beats *any* layered declaration for that same property,
regardless of specificity or source order — this is the same mechanic that
forced Toggle's unlayered exception (see hyzer-ui-theme-architecture). That
meant the original unconditional structural rule `.hz-slider { width: 100%;
}` (present in both components, always-on) would have silently blocked the
theme from ever giving the vertical range a different cross-axis width — no
theme override, however specific, could win. Fix: split ALL of the
previously-unconditional structural rules (`.hz-slider-row`'s
`flex-direction`, `.hz-slider-track`'s `flex`/`min-width`, `.hz-slider`'s
`width`) behind `[data-orientation='horizontal']`, so horizontal keeps
byte-identical computed styles (the attribute is always stamped, defaulting
to `'horizontal'`) while vertical mode leaves `width` entirely unset in the
component layer, freeing the theme to own the thin-track-line +
WebKit-thumb-recenter treatment on the rotated axis (mirroring the existing
`height: var(--hz-slider-track-height)` + `margin-top` recenter pair on the
`::-webkit-slider-thumb`, just swapped to `margin-left`). RangeSlider's own
two ranges are excluded from that recenter via a same-specificity,
later-in-source override (`.hz-field--slider-range …`), the same
tie-break-by-source-order pattern the file already used for the horizontal
rules ("RangeSlider (after the single rules so equal-specificity overrides
win)") — extended here to the new vertical rules rather than introduced
fresh, to match the existing convention over `:not()`.

**RangeSlider markup gained one new wrapper**, `<div class="hz-slider-inputs">`,
around the min/max number-field pair (or the single readout) — not present
in specs/17's literal markup listing, but required by Vert-R3's own test-plan
wording ("one `.hz-slider-row` child group") to keep the pair a single
horizontal cluster even when the row itself flips to `flex-direction:
column`. Given the exact same `gap` token at both the row and the new
wrapper level, horizontal pixel spacing is unchanged (verified: the existing
17-suite regression tests, which query by class not DOM depth, all pass
unchanged). Added `.hz-slider-inputs` to the RangeSlider `hooks.ts` parts
table since it is now a real, styleable part.

**e2e caught a real test-authoring bug, not a component bug**, worth noting
since it's a trap this spec's own test plan invites: native `<input
type="range">` does not reflect `aria-valuenow` as a DOM attribute (it's
implicit-ARIA, accessible-tree-only) — `getAttribute('aria-valuenow')`
returns `null` always. The Vert-R6 keyboard e2e initially "failed" (value
never appeared to change) for this reason on both components; fixed by
reading `.inputValue()` instead, which reads the live `value` property. With
that fix the keyboard test genuinely proves the mechanism: ArrowUp measurably
increases the DOM value on a focused vertical thumb in a real Chromium
engine, confirming the `direction: rtl` bottom-up convention actually holds
in practice, not just on paper.

**Latitude decisions:** (1) tick mark dimensions rotate 2px×0.375rem →
0.375rem×2px (a horizontal tick line becomes a vertical one beside the
track) — not pixel-specified in the spec, chosen to mirror the existing
mark's proportions; (2) the docs Vertical demo tabs bound their height via
the default `--hz-slider-length` (12rem) and use `Cluster` for side-by-side
layout per Vert-R8's explicit guidance, with a small page-local
`:global(.hz-field--slider) { width: auto; }` override on the demo wrapper,
since `Field.svelte`'s unconditional `width: 100%` (Field-R1, correctly
unchanged) would otherwise fight the Cluster's row layout — flagged in the
demo's own tab-note as "the author's job," per spec wording.

**Deviation:** none from the spec's requirements. One documentation nuance:
the spec's CSS-split section didn't anticipate needing to touch the
*horizontal* structural rules at all ("Horizontal keeps its current
structural rules… range width: 100%"), but preserving that behavior
byte-identically while unblocking theme control over the vertical range's
width required re-scoping (not rewriting) those same rules behind the
attribute selector — computed styles for `orientation="horizontal"` (the
default) are unchanged; verified by the full existing 17-suite passing
unmodified plus new orientation-parity assertions on `--hz-slider-fill*`/
`--hz-tick-pos`/`--hz-slider-chars` across both orientations.

Files: `src/lib/components/Slider.svelte`; `src/lib/components/
RangeSlider.svelte`; `src/lib/components/Slider.svelte.spec.ts`;
`src/lib/components/RangeSlider.svelte.spec.ts`; `src/lib/theme/components/
field.css`; `src/docs/hooks.ts`; `src/docs/data/slider.ts`; `src/docs/data/
range-slider.ts`; `src/routes/components/slider/+page.svelte`;
`src/routes/components/range-slider/+page.svelte`; `src/routes/docs.e2e.ts`
(surgical append only); `specs/17-slider.md` (dated amendment, Vert-R10);
this file.

Gates: svelte-check (0 errors), prettier + eslint on all touched files
(clean), full unit suite (2429/2429), production build (green once a
concurrent builder's transiently-deleted `theme/examples/sunset/` reappeared
— unrelated to this spec's scope), full e2e suite (421/422 — the sole
failure, `specs/46 — content focus-visible ring…`, is a pre-existing/
concurrent-builder test outside this spec's touched files, reproducing
identically with and without this change).

## Combobox large-list dataset swap (real courses) + new Virtualized combobox pattern (2026-07-23)

Two user-directed items. The first started as a bug-hunt and was redirected
mid-task by the user after a reproduction; the second builds a new Patterns
page.

**1. Combobox filtering — reproduced first, no bug found; root cause was the
demo data, not the component.** Read `Combobox.svelte`'s `defaultFilter`
(case-insensitive `label.includes(query)`, genuinely substring-anywhere) and
the "Large list" demo before touching anything, per the instruction. Started
a real reproduction (dev server + Playwright against `/components/combobox`,
large tab): typed `nville`, a fragment landing entirely mid-word inside
`Greenville` (not at a label or word boundary) in the then-synthetic
cross-product dataset — it matched 49 options, proving the default filter
truly is substring-anywhere, not prefix-only. Before finishing the write-up
the user supplied the actual root cause directly: they'd searched for a
**real** course name that isn't in the synthetic city×word cross-product, so
nothing matched and it read as if only prefixes worked. There was never a
filtering bug — REVISED SCOPE landed on swapping the synthetic dataset for
real data instead of a bug fix.

**Real-course dataset.** New `src/docs/data/courses.ts`: a `DiscGolfCourse
{ name, location }` shape plus a `COURSES` array and a `courseSlug()`
helper. Authored the course list from general disc-golf knowledge (58
entries) — real courses only, no fabricated/plausible-sounding ones, per the
explicit instruction; deliberately smaller than the "~200-400" ceiling the
instruction floated rather than pad the count with anything I wasn't
reasonably confident actually exists at the location given. The module
comment says so directly and states the shape is a stable drop-in target: a
fuller externally-sourced list (the user mentioned they may supply one) can
replace the `COURSES` array without touching the page that consumes it.
`/components/combobox`'s "Large list" tab now maps `COURSES` through
`courseSlug`/label directly (`manyCourses`), dropped the two hand-authored
city/word arrays entirely, and its tab-note and placeholder were reworded
off the stale "thousands" framing to the real ~58-course count and an
explicit real-mid-word example (`ridge`/`ville`) so a reader can verify
substring-anywhere themselves. The tab-note also now points to the new
Virtualized combobox pattern (below) as where true scale belongs. This
module lives under `src/docs/data/` (docs-internal), not `src/lib` — it's
consumed only by the docs *route*, never by a `src/docs/samples/*` file,
which must stay self-contained/copy-pasteable per the existing sample
convention (confirmed by grep: no existing sample imports from
`src/docs/data/`).

**Custom-filter tab — left as instructed, tab-note reworded.** Per the
user's explicit correction, `startsWithFilter` stays (it legitimately demos
overriding the `filter` prop); only the prose changed, to lead with **"The
default filter matches a substring anywhere in the label"** in bold and
state plainly that this tab's start-of-label match is a deliberate override,
not what Combobox does by default — so neither tab can be misread as
teaching prefix-only as the norm.

**2. Virtualized combobox pattern — new `/patterns/virtualized-combobox`.**
Built per the house precedents: `src/docs/samples/CommandPalette.svelte`
(from-scratch `role=listbox` composition) for the combobox shell shape, and
`src/docs/samples/VirtualizedTable.svelte` for the ARIA-on-divs + Virtualizer
role-layering convention (role rides Virtualizer's own element via `...rest`
— `role="listbox"` here, `role="rowgroup"` there — with role-less structural
divs in between and the real semantic role on each row's own element; this
codebase's established, already-shipped answer to "a role=listbox child
should be a direct accessibility-tree child," not necessarily a direct DOM
child).

Dataset: 30 real courses (a self-contained subset of the same real-course
knowledge as `courses.ts` above, duplicated inline rather than imported, to
keep the sample copy-pasteable) crossed with 900 "Round N" entries each —
**27,000 rows**, generated once at module scope with a plain nested
`flatMap`/`Array.from` (no `Math.random`; SSR output matches the client).
Substring filtering runs the same `.toLowerCase().includes()` scan Combobox
itself uses, over the full 27,000-row array on every keystroke — confirmed
in-browser this stays fast; what doesn't stay fast without windowing is
*rendering* the result set, which is the actual point of the pattern.

**The hard a11y problem, and how it's solved:** APG requires
`aria-activedescendant` to name a real, currently-rendered option, but
`Virtualizer` only ever mounts rows near the current scroll position — most
of 27,000 rows are never in the DOM. Solved with a two-phase commit instead
of a direct index write: `moveTo(index)` first nudges the Virtualizer
viewport's `scrollTop` toward the target row by hand (uniform row height
makes the "nearest" math exact — `Element.scrollIntoView()` has nothing to
call it on when the target isn't mounted yet), clearing `activeIndex`
immediately so it can never reference a stale id; each rendered row reports
its own mount/unmount into a `SvelteSet<number>` via a
`{@attach trackRendered(i)}` factory attachment; a `$effect` only commits
`pendingIndex → activeIndex` (and therefore `aria-activedescendant`) once
that index is confirmed present in the set. A generous `overscan` (12) means
a single-step Arrow move resolves within the same tick, since the target row
is normally already mounted just outside the visible viewport; only big
jumps (`Home`/`End` across 27,000 rows) take an extra frame while
Virtualizer's own window catches up to the new scroll position — verified
directly (Playwright: polled `document.getElementById(activedescendant-id)`
after every Arrow/Home/End press across the run, always non-null; `End`
lands on the literal last row's text, `Home` on the literal first).

**Bug found and fixed during verification, worth flagging:** the first
implementation declared `pendingIndex` as a plain (non-`$state`) variable.
`aria-activedescendant` never updated on any keypress in a real browser,
because the commit `$effect`'s only *tracked* dependency was the
`renderedIndices` `SvelteSet` — when the target row was already mounted
before `moveTo()` ran (e.g. index 0 at initial `scrollTop` 0, the common
case for the very first Arrow press), `renderedIndices` never mutated, so
the effect never re-ran, and `pendingIndex` sat uncommitted forever despite
holding the right value. Fix: `pendingIndex = $state<number | null>(null)`,
so every `moveTo()` call is itself a tracked dependency the effect re-fires
on, independent of whether `renderedIndices` also changes. Caught by
reproducing in a real Chromium browser (Playwright against the dev server),
not by the type checker or a jsdom-style unit test — noting this since it's
exactly the kind of Svelte-5-reactivity gap `svelte-check`/lint cannot see.

Row markup: Virtualizer's own per-row wrapper carries no role (Virtualizer-
R9); each row's own div (inside the `row` snippet) carries
`role="option"`/`id`/`aria-selected`/`data-active`, non-focusable (no
`tabindex`, virtual focus only — mirrors `Combobox.svelte`'s own `<li>`
options), with `onmousedown` preventDefault so a pointer selection never
moves DOM focus off the input. Keyboard: `ArrowDown`/`ArrowUp` open-or-move
(wrapping intentionally omitted — clamps at the ends instead, since wrapping
across 27,000 rows read as more disorienting than useful here); `Home`/`End`
jump to the absolute first/last row of the *filtered* set; `Enter` commits
the active option (sets the input's display text, closes); `Escape` closes
and reverts the input text to the last committed selection; outside-focus
(`focusout` where `relatedTarget` isn't inside `.vcombo`) closes. Empty-
result state is a `role="presentation"` paragraph, never an option.

Cross-links: the Combobox docs page's "Large list" tab-note names and links
`/patterns/virtualized-combobox` as where real scale belongs; the pattern
page links back to `/components/combobox` and `/components/virtualizer`,
and its "Why a pattern, not a component" `Alert` states the deferral
honestly (cites `Combobox`'s own Virtualizer-spec Out of Scope, doesn't
pretend this composition is a feature of the real component). Manifest entry
added directly after "Virtualized table" per the placement instruction.

e2e: appended four new tests to `src/routes/docs.e2e.ts` (surgical append at
the file's end, past the last existing `describe` block, per the concurrent-
builder file-ownership note) — windowing proof (rendered `[role="option"]`
count stays under 100 against a 27,000-row dataset), `aria-activedescendant`
validity across a `Home`/`End` big jump (asserts the id resolves to a real
element both times, and that the resolved text is literally the first/last
row), substring-filter correctness, and Enter-selects/Escape-closes.

Files: `src/docs/data/courses.ts` (new); `src/routes/components/combobox/
+page.svelte`; `src/docs/samples/VirtualizedCombobox.svelte` (new);
`src/routes/patterns/virtualized-combobox/+page.svelte` (new);
`src/docs/manifest.ts`; `src/routes/docs.e2e.ts` (surgical append only);
this file.

Gates: svelte-check (0 errors, 0 warnings), prettier + eslint on all touched
files (clean), full unit suite (2429/2429), production build (green,
prerenders `/patterns/virtualized-combobox`), full e2e suite (422/426 — the
four failures are pre-existing/concurrent-builder territory: one
`specs/46 — content focus-visible ring…` failure already logged above by
the prior entry, plus three `/components/range-slider` `ERR_CONNECTION_
REFUSED` failures from the concurrently in-flight Slider/RangeSlider work;
none touch a file this entry modified, and all four new tests plus the
pre-existing virtualized-table pattern tests pass). Did not commit, per
instruction.

- **Vertical slider states demo (user, 2026-07-23, main session):** both
  slider pages' "Description & states" tabs gain a vertical pair
  (description + error) in a Cluster after the horizontal set — fence +
  demo — so description/error placement is visible for
  orientation="vertical" too. check/format/lint clean; e2e rides the
  specs/46 builder's final full run.

## Consumer-facing prose sweep + virtualized-combobox multi-select upgrade (2026-07-23)

A full sweep of the docs site's user-visible surface for library-internal
development artifacts (spec citations, requirement numbers, CI/drift/audit
language), plus four items folded into the same batch by the coordinator
mid-sweep: taller virtualized-combobox demo, multi-select parity for that
pattern, a reorder of `/foundation/utilities`, a first-class Utilities row
on `/theming/overview`, and restoring the Docs example as a first-class
third entry on `/theming/examples`.

**Prose sweep — rewrites (file → before → after):**

- `src/routes/components/combobox/+page.svelte` — Large-list tab-note: "there's
  no Virtualizer integration yet (deferred; see the Virtualizer spec's Out of
  Scope)" → "there's no Virtualizer integration yet." (the surrounding
  sentences already state the consequence and point at the Virtualized
  combobox pattern; only the spec citation was cut).
- `src/routes/patterns/virtualized-combobox/+page.svelte` — "Why a pattern, not
  a component" `Alert`: anchor text "Virtualizer spec's Out of Scope" (linking
  to `/components/virtualizer`) → plain prose, "Combobox deliberately renders
  every matching option rather than windowing the list." Also updated for the
  multi-select upgrade (below).
- `src/docs/samples/VirtualizedCombobox.svelte` — header comment shown verbatim
  via `?raw` on the pattern page: "the real `Combobox` component defers
  windowing (specs/23-virtualizer.md's Out of Scope)" → "the real `Combobox`
  component renders every matching option rather than windowing the list".
- `src/routes/theming/examples/+page.svelte` — intro prose: "drift-tested in
  CI" → "meets WCAG AA on every graded pairing" (fact — the AA guarantee —
  kept; the CI/process framing cut). See also the three-way enumeration
  rewrite below.
- `src/routes/foundation/utilities/+page.svelte` — doctrine note: "the
  library's own WCAG AA gate already grades" → "already checked against WCAG
  AA" (forbidden "AA gate" phrasing cut, same fact kept). Reordered per the
  escalating-commitment item below.
- `src/routes/theming/tokens/+page.svelte` — "the same math and the same
  pairings as this library's own CI gate" → "...used to validate this
  library's own token set" ("CI gate" cut).
- `src/docs/data/toc.ts` — `description` field (renders on `/components/toc`):
  "the docs site's own 'On this page' rail (R9), generalized behind props" →
  same sentence with the bare `(R9)` requirement-number citation removed.
- `src/lib/icons/types.ts` — `IconProps` JSDoc (ships in dist types): module
  header dropped "(specs/36 R2)"; `intent` prop doc dropped "Amendment
  2026-07-22 (specs/36, audit R9)" (the given example offender).
- `src/lib/types/index.ts` — `NavItem` dropped `@see original-specs/
  00-architecture.md`; `LightboxGroupOptions.selector` dropped "(Lightbox-R18)"
  (reworded to "the exclusion rules below"); `IntentRegistry.neutral` and
  `BadgeIntent` dropped their "2026-07-22 audit" date citations, keeping the
  behavioral fact ("a full member of the vocabulary… rather than unioned per
  component").
- `src/lib/components/Virtualizer.svelte`, `Select.svelte`, `Slider.svelte`,
  `RangeSlider.svelte`, `Divider.svelte` — prop-level JSDoc on exported
  `Props`/`SelectSingleProps` interfaces (ship in dist types, render as IDE
  hover): dropped `Virtualizer-R14`, `Select-R1`, `Vert-R1`/`Vert-R3` (×2),
  `Divider-R3` (×2) citations, keeping the technical description in each.
- `src/lib/config/schema.ts` — five prop-level JSDoc blocks on the public
  `HyzerTokensOverride`/`HyzerConfig`/`ResolvedConfig` types (what a consumer
  writes `hyzer.config.ts` against): dropped `(specs/42)`, `(specs/36 R5)` ×2,
  `(specs/44 R4)` ×2. Left the internal (non-exported) `flattenRampGroup`/
  `resolveUtilities`/`validateReferences` doc comments alone — implementation
  detail, not public surface.
- `src/lib/config/generate.ts` — `generateUtilitiesCss` (exported) JSDoc
  dropped "(specs/44)".
- Theme-example headers shown verbatim via `?raw` on `/theming/examples` and
  `/foundation/utilities`: `ocean.config.ts`, `terminal/terminal.config.ts`
  (×2, including an inline "NEW CATEGORY INTENTS" comment), `terminal.css`
  (×2), `components/button.css`, `components/toggle.css`, `intents.d.ts`, and
  `examples/docs/docs.css` (×2) all had their `specs/NN R#` citations and
  "a drift test keeps them in sync" language cut, replaced where useful with
  the consumer-relevant fact per the spec's own worked example ("generated
  from this config, regenerate rather than hand-editing … directly").

**Left alone (internal, not rendered — confirmed by reading context, not
just the grep hit):** every `// Component-R#` / `/* Component-R# */` comment
inside a `<script>` or `<style>` block across `foundation/*`, `components/*`,
and `theming/*` route pages (implementation notes, never rendered); the
`/** X's DocPage inputs — specs/40 R1. */` one-line header on every
`src/docs/data/*.ts` module and the longer header on `src/docs/data/
index.ts`/`courses.ts` (module-level file banners, same category the task
named `hooks.ts`'s header as fine); `examples.spec.ts` (test file, out of
scope per the sweep rule); `terminal/components/{accordion,card,badge,alert,
field,tabs}.css` (imported at runtime for their computed styles but never
shown via `?raw` on any page, unlike `button.css`/`toggle.css`/`terminal.css`
which are). `foundation/utilities`'s "those are out of scope (Badge, Alert,
and Banner own tinted surfaces)" is plain English, not a citation — left as
is. README checked; only hit was "specificity" (false-positive substring
match) — nothing to flag.

**Taller demo (coordinator item 2):** the popup was clipped because
`.sample-frame` on the pattern page had `overflow: hidden` — an absolutely-
positioned popup is clipped by an ancestor's overflow box regardless of the
ancestor's auto height, so the input's own ~40px box was all the frame ever
reserved. Fix: dropped `overflow: hidden`, added `min-height: 36rem` so the
frame reserves room for the fully open state (chip row + input + the 320px
windowed listbox) up front — opening the popup no longer clips or reflows
the page. No existing pattern page composes a same-frame `position: absolute`
popup inside an `overflow: hidden` frame (command-palette's popup is a Modal,
unaffected by ancestor overflow; product-listing has no popup at all), so
there was no precedent to match — this is a page-local fix.

**Multi-select upgrade (coordinator item 3):** `src/docs/samples/
VirtualizedCombobox.svelte` was single-select; rewritten to mirror
`Combobox.svelte`'s real multi-select conventions after reading it in full:
- `selectedIds: string[]` (mirrors Combobox's `value: string[]`) instead of a
  single `selected: Round | null`; a `roundsById` Map backs O(1) chip label
  lookup against the 27k-row dataset.
- Chips: one `Badge` (imported from `$lib`, the public barrel) per selected
  round, `onDismiss` + per-item `dismissLabel`, rendered in a new
  `.vcombo-control` flex row above the input — mirrors Combobox's chip row
  exactly, including that dismissing refocuses the input without touching
  `open`.
- `commit()` now toggles membership (`toggleMembership`, verbatim port of
  Combobox's own), clears the query so the list re-filters to the full
  dataset, and — critically — no longer sets `open = false`: the popup stays
  open on selection, matching Combobox's own commit (verified by reading it;
  Combobox never closes on a selection).
- Keyboard: `Enter` toggles without closing (as above); `Escape` open→closed
  clears the query only, selections untouched (Combobox: "Escape never
  clears value — chips carry their own dismiss"); new `Backspace` case,
  verbatim-mirrored from Combobox — native editing wins if the query isn't
  empty, otherwise pops the last selected id, no-op if none.
- Listbox: `aria-multiselectable="true"` added to the `Virtualizer`'s
  `role="listbox"` element; each row's `aria-selected` now derives from
  `selectedIds.includes(round.id)` rather than a single-item comparison —
  correct as rows window in/out since it's recomputed from data on every
  render, never carried by the DOM node. Filtering is unchanged (selected
  rows that don't match the current query simply aren't in `filtered`,
  matching Combobox's own `visibleOptions` — verified, Combobox doesn't
  force-include selected options either).
- Page prose (`/patterns/virtualized-combobox`) rewritten throughout — lead,
  "Why a pattern" `Alert`, and a new paragraph on `aria-multiselectable`/
  `aria-selected` windowing correctness — to present this as the full
  multi-select composition, not a "single-select, no chips" cousin of
  Combobox.
- e2e: rewrote the old single "Enter selects / Escape closes" test (Enter no
  longer closes) into two, and added three: chip render + dismiss (with a
  focus-return assertion), `aria-selected` correctness across a Home→End→Home
  remount (the row unmounts and remounts as a new DOM node; its
  `aria-selected` must still read `true`, proving it's data-derived not
  DOM-carried), and an `aria-multiselectable="true"` check. One authoring bug
  caught by the new precise assertion: an existing `input.click()` +
  `ArrowDown` + `Enter` sequence (already used by two other tests, which only
  asserted badge *count* so never noticed) actually opens the popup on click
  first, then `ArrowDown` advances past row 0 — selecting "Round 2", not
  "Round 1". Fixed the new precise test to use `click()` alone (opens with
  row 0 already active) rather than `click()` + `ArrowDown`.

**`/foundation/utilities` reorder (coordinator item 4a):** section order
inverted per the user's explicit escalating-commitment framing — Always
available (`.sr-only`) → Opt-in component classes (`.hz-card-title`/
`.hz-banner-title`) → the opt-in generated sheet (text/margin utility tables
+ full source) → the sheet's own AA-grading subsection (kept immediately
after the sheet, since it's about the sheet specifically). Top
`doc-description` and each section's opening sentence rewritten to narrate
the escalation ("you already have this" → "apply a class the theme already
ships" → "the biggest commitment of the three: an additional sheet, imported
explicitly"). No content removed, only reordered + transitional prose
adjusted; heading `id`s unchanged (no inbound anchors broken).

**`/theming/overview` first-class Utilities row (coordinator item 4b):** "The
tiers" table gained a `Utilities` row (between Reference theme and Your
overrides) in the same three-column format as every other row — import
(`utilities.css`), what it gives you, opt-in framing, link to `/foundation/
utilities` — replacing the previous one-sentence cross-ref paragraph below
the table, which is now redundant.

**`/theming/examples` three-way enumeration (coordinator item 5):** the intro
paragraph previously named "two complete themes" up front and mentioned Docs
only as "a third example follows below" — an afterthought that reads as "two
examples plus a footnote." Rewrite: "Three examples ship with the package as
teaching material," Ocean/Terminal described as the two-points-of-freedom
pair, Docs named alongside them as "a different shape entirely… not a point
on that freedom axis." The comparison table gained a fourth `Docs` column
(with `no`/`n/a`-style values on rows that don't apply, e.g. "no — reuses the
reference theme's own tokens" for Palette via config) plus a new "Scoped to a
class" row that differentiates all three (`runtime-scoped demo only` /
`.hz-theme-terminal` / `unscoped`). The `{#each examples}` loop (Ocean +
Terminal only) and Docs' own distinct section below are both left as-is —
the fix was making the *enumeration* count three, not collapsing Docs into
the loop. Checked `/theming/overview`: it never enumerates example themes by
name (only a generic link to "Example Themes"), so there was no two-vs-three
count to fix there.

**Product-detail vertical thumbnail strip (coordinator item 6):** `src/docs/
samples/ProductDetail.svelte`'s media area was a single Carousel with no
picker beyond its own dot/counter indicator — reworked into the classic PDP
composition, a vertical thumbnail strip beside the main image:
- One shared `activeIndex` (`$state`) bound both ways to `Carousel`'s own
  `index` via `bind:index` — a thumb click sets it (paging the carousel);
  dragging or paging the carousel writes it right back (moving the active
  thumb). No manual sync effect needed — `index` is a plain `$bindable`, so
  both write paths converge on the same state and every derived render
  (transform, `inert`, `data-active`) recomputes off it automatically.
  Verified by reading `Carousel.svelte` before relying on this.
- Thumbs are real `<button>`s in a `role="group"` labeled "Choose a
  colorway", each with a per-colorway `aria-label` and `aria-current="true"`
  on the active one — the exact semantic Carousel's own dot indicator
  already uses (`aria-current` on the active dot, confirmed by reading its
  source), so this matches an existing in-codebase precedent rather than
  inventing one. Native `<button>`s are keyboard-operable with no extra
  wiring (Tab + Enter/Space).
- Kept the whole media area (strip + carousel) inside one `lightboxGroup`
  attachment. Verified `lightboxGroup`'s exclusion rules before relying on
  them: `qualifies()` calls `hasInteractiveAncestor()`, which structurally
  excludes any `img`/`video` with an `<a>`/`<button>` ancestor before the
  attached container — since each thumb's `<img>` sits inside a `<button>`,
  it's automatically never enhanced into a second lightbox trigger; the
  active carousel slide remains the one obvious open-the-viewer affordance,
  and the thumb `<img>`s carry `alt=""` (decorative — the button's own
  `aria-label` already names the colorway).
- Removed the now-redundant `indicator="dots"` (the thumb strip is the real
  picker now; Carousel falls back to its default `counter` status text,
  still announcing "{n} of {total}" via its live region).
- Responsive shape: mobile-first `flex-direction: column-reverse` (DOM order
  `[thumbs, carousel]`, so the carousel — last in the DOM — paints first,
  main image on top, thumb row below) flipping to `row` at the same 640px
  threshold Split's own `stackBelow="sm"` falls back to, for a vertical
  thumb column on the left and the main image on the right — Split's own
  stacking only reorders in DOM order without a direction flip, so this
  responsive shape (image-first on mobile, column-then-row otherwise) is
  hand-rolled, not composed from Split's `stackBelow`.
- `PRODUCT_MEDIA` constants-map indirection and the `?raw`/`consumerSource`
  conventions are unchanged — thumbs read the same map the main slide does.
- Pattern page prose (`/patterns/product-detail`) rewritten to describe the
  two-way sync and that thumbs never open the viewer themselves.
- e2e: four new tests — thumb click pages the carousel and marks
  `aria-current`; paging the carousel (Next button) moves the active thumb
  back; the thumb strip is a labeled group and clicking a thumb never opens
  a lightbox dialog; the active slide still opens the lightbox on keyboard
  Enter (unchanged behavior, asserted to prove the strip didn't regress it).

Files: `src/docs/data/toc.ts`; `src/docs/samples/{ProductDetail,
VirtualizedCombobox}.svelte`; `src/lib/components/{Divider,RangeSlider,
Select,Slider,Virtualizer}.svelte`; `src/lib/config/{generate,schema}.ts`;
`src/lib/icons/types.ts`; `src/lib/theme/examples/docs/docs.css`;
`src/lib/theme/examples/ocean.config.ts`; `src/lib/theme/examples/terminal/
{terminal.config.ts,terminal.css,intents.d.ts,components/button.css,
components/toggle.css}`; `src/lib/types/index.ts`; `src/routes/components/
combobox/+page.svelte`; `src/routes/docs.e2e.ts`; `src/routes/foundation/
utilities/+page.svelte`; `src/routes/patterns/{product-detail,
virtualized-combobox}/+page.svelte`; `src/routes/theming/
{examples,overview,tokens}/+page.svelte`.

Gates (final run, after all six items): svelte-check (0 errors, 0 warnings,
2537 files), prettier + eslint clean (prettier reformatted touched files
along the way, re-verified clean after each), full unit suite (2429/2429),
production build green, full e2e suite green (434/434 on the final run —
the single `/components/nav` tablet-overflow teardown timeout seen on an
earlier pass in this same batch did not recur and was confirmed unrelated to
any touched file, passing cleanly in isolation when it appeared). Did not
touch the generator's banner/intro strings (only doc comments), so
`gen:tokens`/drift was not re-run — confirmed no drift indirectly via the
passing `examples.spec.ts` drift test in the full unit run. Did not commit,
per instruction.

## Theming/config docs batch: import stacks, tokens leadline, full config
## reference, generate CLI docs, examples arc reframe (2026-07-23)

Four user items plus a five-part coordinator addendum on `/theming/examples`,
in one pass:

- **Utilities in the import sample.** Every layered-import code block on
  `/theming/overview` (the reset/tokens/theme/overrides stack) and
  `/getting-started` (both the tier-1 quickstart stack and the tier-3
  "import your generated sheet" stack) now includes a
  `@hyzer-labs/ui/utilities.css` line, annotated inline as optional/opt-in,
  positioned after the theme import (it is unlayered but conventionally
  imported like a theme sheet, ahead of the consumer's own overrides). No
  other import-stack samples exist on those two pages (grepped for
  `@import` across `/theming/**` and `/getting-started`) — `/theming/tokens`
  and `/theming/components` have none.
- **Tokens & Overrides leadline.** The `/theming/tokens` `.doc-description`
  was eight sentences carrying the two-layer model, override semantics, the
  cross-links to Colors & Intent and Motion, and the `@hyzer-labs/ui/motion`
  mention. Trimmed the lead to two sentences (the two-layer model + the
  override-cascades-through-it rule only); every other fact moved verbatim
  into a new `.detail-note` paragraph directly after it (new CSS rule,
  `margin: 0.75rem 0`, mirroring the `.note` spacing precedent already used
  on `/foundation/icons` for the same "second paragraph inside a plain
  `.doc-intro` div" problem). No fact was dropped, only redistributed.
- **Full reference `hyzer.config.ts`.** New "Full reference" section on
  `/theming/tokens`, built directly from `src/lib/config/schema.ts` — every
  group the schema accepts, one commented-out representative entry each,
  with a one-line comment naming the tokens/behavior it drives. **Group
  inventory derived from the schema** (`HyzerConfig`/`HyzerTokensOverride`/
  `HyzerDarkOverride`, cross-checked against `TOKEN_GROUP_KEYS` and every
  `assertKnownKeys` call in `resolveConfig`): top level — `output`,
  `tokens`, `dark`, `icons`, `utilities`; `tokens.*` — `palette` (ramps),
  `color`, `intent`, `space`, `width`, `typography.{fontSize,fontFamily,
  fontWeight,lineHeight}`, `radius`, `border.width`, `shadow`, `zIndex`,
  `motion.{duration,ease}`, `density.unit`; `dark.*` — `palette`, `color`,
  `intent`. That is the complete accepted surface — no group omitted, none
  invented (confirmed no `assertKnownKeys` call references a key not
  covered above). **Verification method:** wrote the exact page sample to a
  real `hyzer.config.mjs` and ran the actual built CLI (`tsx` importing
  `src/lib/cli/main.ts` directly, `RunOptions.cwd` pointed at a scratch dir)
  via `corepack pnpm exec` — twice: once literally as authored (every group
  commented out, i.e. `defineConfig({})`) and once with every line
  mechanically uncommented (regex-stripped the `// ` prefix), both `hyzer
  generate --check` runs exited 0 with no `HyzerConfigError`. The
  fully-uncommented version's representative values were tuned (color/dark
  surface hues) so the run also reports **zero AA contrast failures** — a
  reader who copies the whole block gets a clean report, not an alarming
  one on line one.
- **`hyzer generate` docs, byte-accurate.** Added the `--utilities` flag and
  `config.utilities` key everywhere `hyzer generate` usage/output already
  appeared: `/theming/tokens` (`modesCode` gained a `--utilities` recipe
  line and, per a coordinator addendum, a combined
  `hyzer generate --mode overrides --utilities` line proving flags compose;
  new "Generating the utilities sheet" section with a
  `utilities: true` config sample + a real transcript) and
  `/foundation/utilities` (new transcript CodeBlock + a step-note pointing
  at the persistent `config.utilities` form). **Verification method for
  every transcript touched or added:** ran the real CLI the same way as
  above (`tsx` + `main.ts`'s `run()`, real scratch cwd, `corepack pnpm exec`)
  against the exact config shown in each sample, and copied the real stdout
  verbatim (mode/token-count parenthetical, pairing counts, warning lines,
  icon-report lines). This caught and fixed two pre-existing inaccuracies on
  `/theming/tokens` while in the same blocks for the utilities work:
  `reportCode` (the `configCode` sample) claimed a `4.21:1` AA-Large
  contrast failure and "1 of 96 pairings fail" that no longer reproduce
  against the current token set (real run: 89 tokens, 104 pairings, all
  pass) — updated to the real all-pass transcript; `iconsReportCode` claimed
  `wrote src/styles/tokens.css`/`src/styles/icons.ts` (the `iconsConfigCode`
  sample sets no `output` key, so the real CLI writes bare
  `hyzer-tokens.css`/`icons.ts`) and "96 pairings" (real: 92) — both fixed.
  Left the un-utilities-related `configCode`/`iconsConfigCode` samples
  themselves untouched (out of this batch's four items).
- **Stale intent count.** `/theming/examples` said "The library ships six
  intents" — the registry (`src/lib/tokens/index.ts` `intent` export) is
  seven (`neutral` counts as a full member, per `/foundation/colors`'
  "neutral plus the six status hues" framing and `/foundation/contrast`'s
  own "all seven intents" phrasing). Reworded to "every intent in the
  registry" rather than hardcoding a new number, per instruction. Grepped
  every other `/theming/*` and `/foundation/*` page for the same stale
  count — no other hits (`/foundation/contrast` and `/foundation/colors`
  already said "seven"/"six status hues" correctly).
- **Arc reframe (`/theming/examples`).** User reversed R6's framing: the
  freedom axis is "how much of the reference theme a tier keeps," not
  "whether it sets a palette" — read that way Docs sits ON the arc as the
  middle tier (the slot Sunset held), not an appendix. Restructured to one
  ordered three-item `examples` array (Ocean → Docs → Terminal) rendered by
  the same `{#each}` loop and `Tabs` machinery all three now share (`Example`
  gained a `hasConfig: boolean` field so Docs, which has no `hyzer.config`,
  skips that tab while still getting `Demo` + a full-source `docs.css` tab
  — parallel structure with its siblings, not a bolted-on afterthought
  section). Comparison table gained its Docs column back as the **middle**
  column with honest values (`"none — rides the reference theme"`, etc.).
  Intro prose, the `intro-follow` paragraph, and the per-tier blurbs
  rewritten around the three-tier framing; the `.cta` per-instance lesson
  (still Ocean + Terminal only — Docs ships no `.hz-theme-docs
  .hz-button.cta` rule, deliberately: an unscoped sheet has no class to hang
  a demo-only rule on without leaking globally) now says so explicitly
  instead of reading as an omission. "Start from one"'s coverage note
  tightened to match Docs's own header-comment distinction (no *bare*
  hook restyled; `.docs-table` is the one *opt-in wrapper* exception),
  resolving a pre-existing tension with the comparison table's "one
  (`.docs-table`)" row. Recorded as a dated amendment in
  `specs/46-docs-theme-example.md` (spec files may cite process; the page
  prose itself stays consumer-facing, no spec/round references).
- **Addendum: `.docs-table` lesson relocates to `/theming/components`.**
  Superseding an earlier instruction in the same batch to keep the full
  lesson on `/theming/examples`: the FULL worked walkthrough (the
  unlayered-beats-layered explanation, the bare/wrapped side-by-side Table
  demo, and a `?raw`-sliced CSS excerpt) moved to a new "Case study:
  `.docs-table`" section on `/theming/components`, right after "The `class`
  prop" section — that page already teaches the override contract in the
  abstract (hooks table, `class` prop, unlayered-beats-layered) and
  `.docs-table` is its concrete, shipped proof; one home per lesson, per the
  hooks single-source convention already established for that page.
  `/theming/examples`' Docs tier keeps the same `Demo`/full-`docs.css`-
  source pairing every sibling tier gets (a structural artifact, not a
  teaching pass) plus a one-line cross-link to the full lesson. The CSS
  excerpt on `/theming/components` is sliced via `indexOf`/`slice` from the
  real `docs.css?raw` import (same technique as the existing `.sr-only`
  excerpt on `/foundation/utilities`) — not a hand copy that can drift.
  Updated `docs.css`'s own header comment (two spots) to point at the new
  location and the new tier framing, since it previously asserted "a
  different shape of example… not a point on the freedom axis" and "taught
  in full on /theming/examples," both now false.

Files: `src/routes/theming/overview/+page.svelte`;
`src/routes/getting-started/+page.svelte`;
`src/routes/theming/tokens/+page.svelte`;
`src/routes/foundation/utilities/+page.svelte`;
`src/routes/theming/examples/+page.svelte`;
`src/routes/theming/components/+page.svelte`;
`src/lib/theme/examples/docs/docs.css` (header-comment only);
`specs/46-docs-theme-example.md` (dated amendment, append-only).

Open question for the CLI-scaffold idea floated alongside item 3: a
"starter file the CLI scaffolds" (e.g. `hyzer init` writing the full
commented reference to disk) is a natural next step but out of scope here —
this batch is docs-only, no CLI behavior changed.

Gates (this batch, full run): `svelte-check` 0 errors/0 warnings (2537
files); `prettier --check` + `eslint` clean on every touched file (two
pre-existing formatting warnings on `src/routes/patterns/{checkout-form,
product-detail}/+page.svelte` are unrelated — those files were already
modified before this batch started and are outside this batch's ownership
(`samples/**`/`/patterns/**` belongs to a concurrent builder), so `pnpm
lint`'s repo-wide run reports them but neither file was touched here); full
unit suite 2429/2429 passing (`consumerSource.spec.ts`, `src/lib/config/**`,
`data.spec.ts`, `hooks.spec.ts`, `docsExampleInversion.spec.ts`,
`palette-namespace.spec.ts` re-run in isolation first, then the whole
suite); production build green; e2e (port 4173 killed before each run)
427/428 passing — the one failure (`On this page rail › demo headings
inside sample frames are not collected`, asserting the ToC rail doesn't
render on `/patterns/homepage`) reproduces consistently in isolation and is
unrelated to every file this batch touched (no theming/tokens/CLI/docs.css
change here affects that route or the ToC rail); left uninvestigated as
out-of-scope for the same `patterns/**` ownership reason as the two
prettier warnings above. Did not commit, per instruction.

## Form error-summary title (count-aware) + plain-language philosophy commitment (2026-07-23)

Two items, scoped to stay out of `src/docs/samples/**`/`/patterns/**`
(owned by a concurrent builder).

**1. Plural-aware Form error-summary title.** `Form.svelte`'s summary
(rendered as an Alert, first child of the form when `errors.length > 0`)
had a fixed default title, `'There is a problem'`, regardless of how many
errors it listed. Widened `summaryTitle` to `string | ((count: number) =>
string)` — the same label-function shape as Pagination's `pageLabel` and
Carousel's `slideLabel` (a function receiving the relevant count/index,
returning the string) rather than inventing a new prop pattern. The
**default** became a count-aware function: `count === 1 ? 'There is a
problem' : \`There are ${count} problems\`` — plain sentences, a numeral
(not a spelled-out word), same GOV.UK-derived tone the original string
already had. `count` is `errors.length`, the same total the summary
enumerates one `<li>` per (Form-R4): form-level (`name: ''`) and
field-linked errors both count, confirmed by reading `resolvedErrors`'
construction (every entry in `errors` becomes exactly one list item,
`resolvedErrors.length === errors.length` whenever the form is mounted,
so using `errors.length` directly — which is also SSR-safe, unlike
`resolvedErrors` which needs `formEl`) is correct and simpler. A string
`summaryTitle` still overrides outright at any count (single-error
behavior unchanged); a function receives the count. Added Form-R12 as a
dated amendment to `specs/14-form.md` (2026-07-23, specs/40), five new
unit tests (singular default, plural default, form-level errors counted,
function form, string-override-ignores-count), and updated
`src/docs/data/form.ts`'s `summaryTitle` prop row (type + a `note`
documenting the shape and giving the plural example). The Form docs page
(`/components/form`) needed no changes — its four demo tabs already fire
2–3 errors (SvelteKit+enhance, Zod validation, Error-summary-anatomy) and
1 error (Focus-target), so both the plural and singular defaults surface
naturally without adding a note. Checked (read-only, per the `patterns/**`
boundary) `src/docs/samples/CheckoutForm.svelte`/`ContactForm.svelte` and
the two pattern route files that render them: **none pass a custom
`summaryTitle`**, so they inherit the new count-aware default with no
changes needed there — flagged here rather than touched, per instruction,
for the concurrent `patterns/**` builder's awareness (no action expected,
just a heads-up that those forms' error-summary title text changed
under them).

**2. Plain-language philosophy commitment.** Added a fourth bullet to the
Introduction page's (`src/routes/+page.svelte`) philosophy list — plain
language as part of accessibility: interface text (labels, errors, empty
states, every default string a component ships) is design, not an
afterthought, and the library's defaults choose plain words over jargon or
vague fragments. Points at the Form error-summary default (item 1, above)
as the worked example. Updated the list's lead-in from "Three commitments"
to "Four commitments"; no other page structure touched, matching the
existing bullets' voice (bold lead phrase, plain declarative sentences,
one `<code>`-linked concrete example).

**Scope note for the planned follow-up sweep:** a site-wide plain-language
verification pass over all docs pages/examples was called out as a
separate future batch (blocked on the concurrent patterns builder) — not
attempted here beyond these two items.

Gates: `svelte-check` 0 errors/0 warnings; `pnpm format` + `pnpm lint`
(prettier --check + eslint) clean on every touched file; full unit suite
75 files / 2433 tests passing (`Form.svelte.spec.ts` re-run in isolation
first — 62/62 — then the whole suite); production build (prerender,
`@sveltejs/adapter-static`) succeeded. **e2e: inconclusive, not a gate
pass.** Two consecutive full runs were contended by a concurrent builder's
own simultaneous Playwright run against the same shared port
4173/test-server (visible in `ps` throughout both attempts — a second
`playwright test` process with an active `-g "Virtualized combobox
pattern"` filter, i.e. a different builder's own e2e invocation, not
this task's). The first run (piped through `tail -80` for the interim
check, so the true summary line was lost) reported `330 passed` with no
visible failures in the retained tail, but that count is well under the
suite's real total (`--list` confirms 434 tests in 2 files), meaning many
tests were silently dropped from the captured output — inconclusive on
its face. The second run (output redirected to a log file this time)
showed a contiguous block of ~19 failures at `/theming/*` and
`/patterns/*` routes ("loads with exactly one visible h1" / "skip link is
first focusable") starting mid-run, the exact stale-preview-under-
contention signature this repo's tooling notes already warn about (a
second server/build swapping in mid-run on the shared port) — not a
plausible regression from either of this task's actual changes (`Form.svelte`
and the Introduction page have no relationship to `/theming/*`/`/patterns/*`
h1/skip-link structure). Stopped both e2e attempts at the user's explicit
instruction ("stop, let the reviewer test later") before a clean,
uncontended run completed; killed the `playwright test` processes and
port 4173 on exit so a subsequent run starts clean. **Follow-up for the
Reviewer:** re-run `pnpm exec playwright test` once no other builder is
using port 4173/the shared test-server, and confirm 0 failures (or
compare any failures against the pre-existing baseline, not against this
task's two files).

Files: `src/lib/components/Form.svelte`;
`src/lib/components/Form.svelte.spec.ts`; `specs/14-form.md` (dated
amendment, Form-R12); `src/docs/data/form.ts`; `src/routes/+page.svelte`.
Did not commit, per instruction.

## Ten-item Patterns batch: composition extensions, breakout centering,
## alert callouts, lead-line sweep, one shared page scaffold (2026-07-23)

User-directed batch across `/patterns/**` (the concurrent builder's
territory stayed `/theming/**`, `getting-started`, config docs — untouched
here). Ten items, all landed:

**1. Homepage extension** (`samples/Homepage.svelte`,
`routes/patterns/homepage/+page.svelte`) — kept the existing top
(Header/Hero/"Popular this week" Grid) and added three sections after it:
a second, marketing-style `Hero` (`layout="overlay"`, a scoped
`.promo-media` gradient background rather than a real photo — same
self-contained-art posture as every other sample), a `Grid` of four stat
`Card`s with true-to-life disc-golf numbers (courses mapped, rounds
logged, countries with active leagues, average course rating), and a
centered contact CTA (`Stack align="center"`, a plain `Button`, no real
href — the sample stays portable/bare-`#` per its own doc comment). The
cross-link to `/patterns/contact-form` lives in the ROUTE's lead prose
(matching the Contact form ↔ Checkout form reciprocal-link precedent), not
inside the sample — a docs-site URL has no place in code meant to be
copied verbatim into a consumer app.

**2. Recipe rework** (`samples/Recipe.svelte`) — the finished-dish photo
is now a `Hero`'s `layout="split"` media (title/subtitle beside the photo)
instead of a bare `<Image>` under an `<h2>`; two short prose paragraphs
plus the serving/dietary metadata sit under the hero, before the
ingredients heading. The ingredients `Table` and the technique `Video`
now share a `Split` (`fraction="1/2"`) instead of stacking sequentially.
Root-caused one layout bug here: `stackBelow="md"` (the Hero-internal
Split's own default) stacked the pair at every viewport this task tested,
because this Split sits inside the page's own `padding="lg"` Stack (4rem
inline padding each side) rather than a full breakout — the *effective*
available width (~800px in the docs frame) never cleared the 968px `md`
threshold. Changed to `stackBelow="sm"` (640px), verified side-by-side at
1280/1440 and correctly stacked at 768 via Playwright bounding-box
measurements (documented inline at the call site so the next editor
doesn't "fix" it back to `md`).

**3. Virtualized combobox warning Alert** — added, consumer-voiced,
`intent="warning"`, title "Reach for this only when the dataset can't be
narrowed down": steers toward narrowing first (server-side search,
category pre-filtering, a recent/favorites shortlist) and the plain
`Combobox` on the smaller result, framing this pattern as a last resort.

**4. "This is consumer code" removal** — grepped
`src/docs/samples/**` for the literal phrase; found and reworded in eight
files (`Homepage`, `Recipe`, `Article`, `ProductDetail`, `ProductListing`,
`CheckoutForm`, `ContactForm`, `VirtualizedCombobox`, `VirtualizedTable` —
nine, `CommandPalette` never used the literal phrase, left as-is). Each
doc-comment reworded to drop the framing while keeping the "imports only
public exports" fact ("It imports only public exports…" / "…imports only
public exports and exercises…" etc.) — no comment lost meaning, just the
redundant self-description.

**5. Article breakout centering** — root-caused: `.docs-main` sets
`--hz-breakout-shift: 0` globally (start-aligned column, breakouts grow
rightward only), correct for every OTHER breakout on the site because
those columns start flush with `.docs-main`'s own left edge. Article's
breakout image, though, sits inside `Container max="md"` (default
`center`), itself centered within a slightly *narrower* sample-frame than
`.docs-main`'s full cqw — so shift `0` grew the image only rightward from
an already-inset starting point, reading as offset rather than centered.
Fixed by resetting `--hz-breakout-shift` on that one `Container breakout`
back to its own natural default (`calc(50% - 50cqw)`, passed as an inline
`style` on the element — immune to whatever an ambient layout sets, and a
no-op outside the docs shell where the default already applies). Verified
via Playwright bounding boxes at 768/1280/1440px: left/right overflow past
the prose column is symmetric at all three (at 768 the breakout and the
column are the same width, so centering is moot but still holds).

**6. Blockquote quote size + Article intent** (coordinator-assigned,
`theme/components/blockquote.css` unclaimed for this batch) —
root-caused: the theme's `.hz-blockquote-quote` font-size is still `xl`
(1.65rem), never regressed. Article's own scoped `.prose p` rule (`font-
size: base`, serif family) is a *descendant* selector, and Svelte scopes
by matching elements literally written in the authoring template — the
Blockquote's quote `<p>` lives in the same `.prose` div in the DOM (the
pull-quote sits between two prose paragraphs), so `.prose p` reached
straight into Blockquote's internals and overrode the theme's `xl` down
to `base`. Fixed by tightening `.prose h3`/`.prose p` to the direct-child
combinator (`.prose > h3`, `.prose > p`) — stops at `.prose`'s own
headings/paragraphs, leaves Blockquote's nested `<p>` alone, theme size
shows through unmodified. No theme file changed. Also changed the
sample's `Blockquote` to `intent="success"` (was `primary`) per the
user's request that the accent match the breakout photo's green — a
one-line comment ties the two together for the next reader.

**7. Pattern-page lead-line sweep** — every one of the nine pattern
routes' `.lead` paragraphs was overloaded (2–4 sentences packing scope,
mechanism, and cross-links into one block). Calibrated against component
pages' `DocPage` `description` prop (one sentence, ~15–30 words) and
split each lead into a short first sentence (kept) plus a new `.detail`
paragraph carrying everything else redistributed, not deleted — the one
exception was Recipe's `gap="away"`/`gap="near"` spacing-token aside,
which is a genuine fact about the composition and was kept in `.detail`
rather than cut as filler. Every page's `.composed` line (small hint of
which library components a pattern uses) was left untouched per
instruction — none were removed, several gained a component after other
items in this batch (Hero + Split on Recipe, Pagination cross-link on
Virtualized table's new Alert).

**8 & 10. Alert-cluster tightening (virtualized-combobox, virtualized-
table)** — virtualized-table got the same double-Alert treatment as
combobox got in item 3: a new `intent="warning"` Alert, consumer-voiced,
steering toward `Pagination` (cross-linked), server-side paging, or
filtering before reaching for full-dataset virtualization. Both routes'
Alert pairs are now wrapped in `<Stack gap="near" data-density-shift>` —
the shift drops `near` one rung tighter than the page's own rhythm, so the
two related callouts read as one cluster rather than two separately-paced
sections, while the cluster as a whole still sits at normal `gap="away"`
spacing relative to the intro/Demo sections around it.

**9. One shared page scaffold across all nine Patterns routes** —
surveyed every pattern route; the DocPage-driven component pages and the
`/foundation`+`/theming` pages all share one template
(`<Stack gap="away"><div class="doc-intro">…` then repeated
`<Stack as="section" gap="away" data-density-shift class="doc-section"
aria-labelledby="…-heading"><h2 id="…-heading">…</h2>…</Stack>` blocks),
driven by shared classes in `theme/examples/docs/docs.css`
(`.doc-intro h1`, `.doc-description`, `.doc-section h2` — untouched by
this entry; that theme file was already dirty from an unrelated
concurrent batch at session start, so no changes were layered onto it).
Every Patterns route now follows the identical shape: intro (`h1` +
`.doc-description` lead + `.detail` + `.composed`) → any page-specific
callout (the Alert clusters from items 3/8/10, sitting between intro and
Demo, no heading of their own since each Alert already carries its own
`title`) → a labeled "Demo" `h2` section wrapping the breakout sample
(five routes — Homepage, Product listing, Product detail, Checkout form,
Contact form, Article, Recipe — previously had NO "Demo" heading at all,
just the breakout `Container` as a bare sibling) → any page-specific
technique section (virtualized-combobox's "The scroll-follows-active
technique" — converted from a plain `<section>` to the same
`Stack`-as-section pattern) → a labeled "Source" `h2` section. Outer page
Stacks changed `gap="xl"` → `gap="away"` to match the foundation/theming
rhythm exactly. Local `<style>` blocks lost their now-redundant
`h1`/`h2`/`.lead` rules (the shared docs.css classes cover them); kept
only genuinely page-local rules (`.detail`, `.composed`, `.sample-frame`,
per-page notes). One recurring gotcha, hit and fixed on four pages:
`class="doc-section"` (or any custom class) landing on a `<Stack>`
component's *rendered* root isn't a literal class in the authoring
template, so a plain descendant selector like `.doc-section p` compiles
to an "unused CSS selector" warning even though it visually works —
matches the same gotcha documented in the "Three new Patterns pages"
entry above, this time on a component-forwarded class rather than a
component `class` prop directly. Fixed by giving each section body
paragraph its own literal class (`.source-note`, `.section-note`) instead
of a compound selector through the Stack.

Root-caused and fixed one e2e assertion that the restructuring broke:
`docs.e2e.ts`'s "demo headings inside sample frames are not collected"
test asserted `toc.count() === 0` on `/patterns/homepage`, relying on an
accident of the OLD structure (only one real `h2`, "Source" — under the
rail's 2-entry minimum, so it never rendered, which is how the test
"proved" sample-frame headings were excluded). With the new "Demo" +
"Source" headings that page now legitimately clears the 2-entry minimum,
so the rail renders — correctly. Rewrote the test to assert what it
actually should: the rail is visible and lists exactly `['Demo',
'Source']`, i.e. neither Hero's own `h2` title (both inside
`.sample-frame`, excluded via the existing `exclude=".doc-example,
.sample-frame"` mechanism) leaks into it. This is a stronger test of the
real UX property than the count-based one it replaced. Did not touch any
other assertion in the file.

Files: `src/docs/samples/{Homepage,Recipe,Article,ProductDetail,
ProductListing,CheckoutForm,ContactForm,VirtualizedTable,
VirtualizedCombobox}.svelte`;
`src/routes/patterns/{homepage,recipe,article,product-detail,
product-listing,checkout-form,contact-form,command-palette,
virtualized-table,virtualized-combobox}/+page.svelte`;
`src/routes/docs.e2e.ts` (one test rewritten). No theme file touched
(item 6 was a consumer-side fix; `theme/components/blockquote.css` read
only, to confirm the root cause). Did not commit, per instruction.

Gates: `svelte-check` 0 errors/0 warnings on every file this entry
touches (one transient error surfaced mid-session in `Form.svelte` —
unowned by this entry, resolved itself once a concurrent builder's
own in-flight edit landed; confirmed via `git diff` before and after that
it was never this entry's doing). `prettier --check` + `eslint` clean.
Unit: 75 files / 2433 tests passing. `build` (prerender,
`@sveltejs/adapter-static`) succeeded. e2e: two full runs were interrupted
by a concurrent builder's own simultaneous rebuild clobbering the shared
port-4173 preview server mid-run (`ERR_MODULE_NOT_FOUND` on
`.svelte-kit/output/server/nodes/0.js`, then `ERR_CONNECTION_REFUSED` —
the same stale-preview-under-contention signature recorded in the Form
entry above), each time isolated and re-verified individually (both
flagged tests pass on their own). A third, uncontended full run — fresh
`build` immediately followed by `playwright test` with port 4173
pre-killed — passed clean: **434/434**.

- **Install prereqs (user, 2026-07-23, main session):** homepage
  Installation + getting-started Install sections gain a compact prereqs
  list sourced from package.json: Svelte 5.7+ (5.32 for Form's enhance
  attachment), Node 22.18+ (CLI only), TypeScript optional (types ship),
  SvelteKit optional (nothing imported from Kit). Getting-started's old
  one-line version note replaced by the same list. OPEN QUESTION for the
  user: peerDependencies pins svelte ^5.7.0 while Form's documented
  enhance attachment needs 5.32+ — consider bumping the peer floor.

- **Homepage polish (user, 2026-07-23, main session):** (1) the prereqs
  list generalized into a shared `.note-list` class in the shipped docs
  example sheet (theme/examples/docs/docs.css — the list counterpart to
  .tab-note; header enumeration updated; both pages switched, local
  duplicated styles removed; homepage restores top margin locally since
  its sections are plain). (2) Usage section now reads as step one of
  the install-and-go story: connecting prose before the code block —
  works with tokens alone, theme/utilities are layers you add, link to
  Getting Started's three tiers. check/lint clean; guard specs
  (fallback-parity, docsExampleInversion) green.

- **Homepage usage split (user, 2026-07-23, main session):** the Usage
  section is now the full two-file example (app.css imports + component
  usage, mirroring Getting Started tier one) rendered LIVE — a Split
  (fraction 2/3, stackBelow md) with the code blocks left and the exact
  markup rendered right in a dashed frame under the reference theme, so
  readers see precisely what they get. Homepage now dogfoods Split too.

## Site-wide plain-language verification sweep (2026-07-23)

Full verification pass over every consumer-visible string on the docs
site against the fourth philosophy commitment (`src/routes/+page.svelte`
§Philosophy — plain language is part of accessibility, worked example:
Form's count-aware error-summary title): `src/routes/**` page prose/
leads/tab-notes, `src/docs/data/*.ts` descriptions/notes/a11yNotes,
`src/docs/hooks.ts` rendered fields, `src/docs/samples/**` UI strings and
demo prose, and `src/lib` component default strings (dismiss/loading/
page/slide labels, summary title). This is a **verification** pass on
top of many prior specs/40 editorial rounds (Foundation, every Components
group, Theming, Patterns, plus the dedicated "Consumer-facing prose
sweep" that already stripped internal spec/process citations) — the bar
applied was "would a plain-language editor flag it," not a rewrite of
already-good prose.

**Method:** grepped the full scope for the task's banned/jargon list
(utilize, leverage, "in order to", simply, just, easy/easily, powerful,
flexible, "is used to", nominalizations like functionality/utilization/
implementation-as-prose, marketing adjectives like versatile/robust/
seamless/intuitive/effortless) and for vague UI fragments (Errors
detected, Invalid input, Something went wrong) and bare "there is/are"
filler; cross-checked every component's default string prop (Badge/
Alert/Banner `dismissLabel`, Button `loadingLabel`, Carousel `prevLabel`/
`nextLabel`/`slideLabel`/`dotLabel`, Combobox `emptyText`/`toggleLabel`,
Lightbox/Modal `closeLabel`, Pagination `pageLabel`, Slider/RangeSlider/
ColorInput `inputLabel`/`minThumbLabel`/`maxThumbLabel`, Form
`summaryTitle`) against source; read all 10 `src/docs/samples/**` files
in full for UI strings (form labels, validation messages, empty states);
spot-read representative pages across every sidebar section (Foundation,
every Components group, Theming, Patterns) for sentence-level tangle/
passive-voice/terminology issues the grep sweep couldn't catch.

**Findings, by kind:**

- **Docs prose (2 fixes):**
  - `/foundation/colors` (`src/routes/foundation/colors/+page.svelte`) —
    Dark mode section: "Dark mode is completely optional, and there are
    three equally supported postures. Do nothing and the light values
    are simply the values — no toggle, no extra CSS." had two banned
    words in one paragraph ("completely" as an intensifier, "simply" as
    filler) plus a "there are N X" construction that read better as a
    plain prepositional phrase. Rewrote: "Dark mode is optional, with
    three equally supported postures. Do nothing and the light values
    stay the values — no toggle, no extra CSS." (fact unchanged: three
    postures, no-toggle default).
  - `/getting-started` (`src/routes/getting-started/+page.svelte`) —
    tier-one step-note: "skip it and the components are headless: full
    functionality and accessibility, no appearance opinions beyond
    native element defaults" used the nominalization "functionality"
    where the concrete claim (behavior keeps working) reads plainer.
    Rewrote: "skip it and the components stay headless: behavior and
    accessibility stay intact, with no appearance opinions beyond native
    element defaults."
  - Introduction page (`src/routes/+page.svelte`) philosophy list, the
    plain-language bullet's own sibling bullet: "Headless components are
    easily overridden via snippets." — "easily" is the same filler-
    adverb family as the standard's own banned "easy," and this bullet
    sits right next to the new plain-language commitment being enforced.
    Rewrote: "Headless components can be overridden via snippets."

- **Component API default (1 fix):** `src/docs/data/button.ts`'s
  description field — "A versatile button component supporting solid,
  outline, ghost, and link variants with intent colors, sizes, loading,
  and icon slots." had a marketing adjective ("versatile," same register
  as the standard's banned "powerful"/"flexible") and a bare "loading" in
  a noun list that read as a fragment against its neighbors. Rewrote: "A
  button component with solid, outline, ghost, and link variants, intent
  colors, sizes, a loading state, and icon slots." (docs-copy change
  only — the `description` field isn't type/shape-pinned by `data.spec.ts`,
  just checked non-empty, so no test updates needed).

- **UI strings (samples, 0 fixes — verified clean):** read
  `CheckoutForm`, `ContactForm`, `ProductListing`, `ProductDetail`,
  `Homepage`, `CommandPalette`, `Article`, `Recipe`,
  `VirtualizedCombobox`, `VirtualizedTable` in full.
  Validation messages were already model plain-language ("Enter your
  full name.", "Enter an email address.", "Select a state.", "Accept the
  return policy to place the order.", "Enter a 5-digit ZIP code.") —
  specific, active, imperative, no vague fragments anywhere in the
  scope. Empty/no-match states ("No discs match the current filters.",
  "No matching rounds", "Nothing in that range — try widening the price
  or clearing a type.") name the condition and, where relevant, the next
  action. `Article.svelte`/`Recipe.svelte` are deliberately voiced
  editorial/recipe copy (magazine-style long sentences, first-person
  recipe headnotes) rather than UI or documentation text — left alone
  per the "don't dumb down… prefer leaving well-written prose alone"
  guidance; a plain-language editor auditing interface copy would not
  flag intentional narrative voice in a demo article.

- **Component defaults (0 fixes — verified clean):** every default
  string prop listed under Method above was already plain (`'Remove'`,
  `'Dismiss'`, `'Loading'`, `'Previous slide'`/`'Next slide'`, `(i, c) =>
  \`Go to slide ${i + 1} of ${c}\``, `'Search...'`, `'Show options'`,
  `'No results'`, `'Close media viewer'`, `'Close dialog'`, `(n) =>
  \`Page ${n}\``, and Form's already-shipped count-aware `'There is a
  problem'` / `` `There are ${count} problems` `` default). No changes.

- **Terminology (0 unifications needed):** checked snippet-vs-slot usage
  site-wide — every "slot" hit is the plain-English sense ("icon slot,"
  "trailing slot," meaning an optional content position), never used for
  Svelte's own content-injection mechanism, which is consistently called
  a snippet; no drop-down/dropdown or checkbox/check-box spelling drift;
  no callback/handler inconsistency (callback used consistently, and
  rarely, for actual function-prop descriptions).

- **Deliberately unchanged:** every factual "there is/are no X" statement
  found (Pagination "no roving-focus tricks," Dropdown "no focus trap,"
  Table "no roving grid navigation," Carousel "no auto-rotation," Alert/
  Banner "no Toast component," several `hooks.ts` notes) states a real
  absence, not filler — left as-is. Form's/the homepage's "There is a
  problem" / "There are N problems" GOV.UK-derived strings, per
  instruction, stay untouched. Idiomatic "not just X" (Contrast, Motion
  foundation pages) reworded to "not only" in an earlier specs/40 round
  already stands and wasn't re-touched. All prop-table/a11yNote technical
  prose (token names, ARIA role/attribute names, CSS terms) left exact.

**Not attempted (explicitly out of scope):** `specs/**`, internal
`// Component-R#`-style code comments, and any restructuring — this was
a language pass over already-settled page structure, not a layout pass.

**Gates:** `svelte-check` 0 errors/0 warnings, 2537 files (checked after
every edit). `pnpm format` — all files already Prettier-clean, no
rewrites needed. `pnpm lint` (prettier --check + eslint) clean. Unit:
75 files / 2433 tests passing. `build` (prerender,
`@sveltejs/adapter-static`) succeeded. e2e (port 4173 pre-killed,
`/tmp/shim/pnpm` on `PATH` for the Playwright shim): **429/434 passing**;
the 5 failures (`/` and command-palette horizontal-overflow assertions at
375/768px, in both `docs.e2e.ts` and `landing.e2e.ts`) are pre-existing
and unrelated to this task — they trace to the docs sidebar's search box
(`+layout.svelte`, unmodified by this entry and not in the working
tree's changed-files list, i.e. already at its last-committed state)
overflowing at narrow widths, not to any prose this entry touched;
flagged here for whoever owns that search-box layout rather than fixed,
per this task's language-pass-not-layout-pass scope.

Files: `src/routes/+page.svelte`, `src/routes/foundation/colors/
+page.svelte`, `src/routes/getting-started/+page.svelte`,
`src/docs/data/button.ts`. Did not commit, per instruction.

- **Homepage usage example, final form + Card media-object amendment
  (user, 2026-07-23, main session):** the Usage demo is now the Card
  horizontal pattern proper — media = a circle Image (width/height 40,
  rounded="full", no wrapper class), name + block-displayed location as
  content, rating Badge in actions, and a muted background via a
  consumer `.player` class in the app.css fence (global stylesheet —
  the honest place, since scoped styles can't reach a component root;
  the utilities sheet deliberately ships no background utilities, so
  this doubles as the class-override story). Card API change per user:
  HORIZONTAL CARDS ARE MEDIA OBJECTS now — root padding + half-step gap,
  content padding zeroed, media inside the padding filling its fixed track,
  top-aligned; theme's full-height cover stretch removed;
  vertical cards unchanged (specs/07 gains its Amendments section).
  ALSO: Split columns gain structural `min-width: 0` (specs/03
  amendment) — a wide child (code block) was propping the switcher open
  past its threshold, which both prevented stacking AND caused the five
  e2e overflow failures on `/` (misattributed to the sidebar search box
  by the plain-language sweep's report; reproduced and root-caused
  here). Overflow sweep 434/434 after the fix.

- **Svelte peer floor bumped (user decision, 2026-07-23, post-6a3a3d9):**
  peerDependencies svelte ^5.7.0 → ^5.32.0 — Form's SvelteKit enhance
  attachment needs 5.32, and a peer floor below a documented feature's
  requirement was dishonest. Prereqs lists on the homepage and
  getting-started simplify to "Svelte 5.32 or newer."
- ~~**PRE-PUBLISH BLOCKER (user-confirmed): VirtualizedCombobox wheel
  scroll**~~ — **RESOLVED 2026-07-28.** A mouse-wheel scroll that unmounted
  the committed active row left aria-activedescendant pointing at a gone id
  (keyboard path was guaranteed; pointer-scroll path was not). Fixed with
  the reverse of the existing two-phase commit: an effect demotes
  `activeIndex` back to `pendingIndex` the moment its row leaves
  `renderedIndices` — activedescendant is withdrawn (undefined = "no active
  option"), the commit effect re-instates it if the row scrolls back in,
  and Arrow keys resume from `activeIndex ?? pendingIndex` so wheel
  browsing never resets navigation to the top. E2e pins demote, re-commit,
  arrow-resume, and the always-resolvable-id invariant.

---

## Re-audit round 1 — theme doctrine after specs/52 (2026-07-28)

Trigger: specs/52 (named themes) and specs/53 (IA move) changed behavior the
audited pages describe. This round covers only the theme-doctrine pages, first,
because everything else cross-links to them.

- **Colors — the dark-mode toggle sample taught a bug.** The page publishes the
  docs shell's toggle as "the real thing, not an idealization", and it still
  signalled light mode by REMOVING `data-theme`. Since specs/52 the system
  default is scoped to `:root:not([data-theme])`, so a removed attribute hands a
  system-dark reader dark mode and the light half of the toggle appears dead —
  the exact failure the docs site itself hit. Sample rewritten against the real
  implementation (now `src/docs/theme.svelte.ts` + `ThemeToggle.svelte`):
  explicit choice is written, `choice`/`systemDark` are separate, and matchMedia
  is present only so the icon can be right while no choice is in force.

- **Colors — the "do nothing" posture was backwards.** It claimed "do nothing
  and the light values stay the values". Since specs/52 a page with no
  `data-theme` follows `prefers-color-scheme`, so doing nothing means following
  the reader's system. Rewritten as three postures: follow the system (free),
  pin one mode, or wire a toggle.

- **Tokens — the dark recipe was silent about two behaviors consumers now get
  for free.** Added to the fence: the sheet already follows the system
  preference (JS is only needed to override it), and `data-theme` works on any
  element so a section can be dark inside a light page, with
  `data-theme="light"` switching one back. Added a doctrine note that dark is
  one entry in a `themes` map, cross-linked to Section themes.

- **Theming overview — the tier table said "Dark mode (or any second mode)"**,
  which predates named themes. Now "Dark mode, or any named theme", noting the
  attribute is not `<html>`-only, cross-linked to Section themes.

- **Verified, not assumed:** the page's full reference `hyzer.config.ts` claims
  to be valid uncommented. Re-checked against `resolveConfig`/`generateCss` with
  the new `themes` map — resolves clean and emits `[data-theme='ocean']`,
  `[data-theme='light']` and the `prefers-color-scheme` block.

- **Not a defect:** `theming/tokens`' palette fence ("every role and intent that
  references it follows automatically") and the `[data-theme='dark']` recipe are
  both still true — and truer than before, since theme blocks re-declare their
  derived chain and so now work off-root too. Left alone.

- **Regression found and fixed separately (989a066):** the specs/53 `DocIntro`
  conversion renders the manifest label as the page heading, which silently
  retitled `/docs/theming/overview` from "Theming" to "Overview". Checked every
  page's pre-move `<h1>` against its label; that was the only meaningful one
  (the other diff was `Section themes` → `Section Themes` casing, left as the
  manifest's Title Case).

**Still outstanding this round:** never-audited pages (Tooltip, Popover,
Loading, Skeleton, CodeBlock, Observers, Positioning, Section themes, plus the
new landing/Philosophy/Agents pages), then Patterns, then Getting Started as the
new front door (specs/53 R6, not yet done).

## Re-audit round 2 — landing page, Getting Started, Philosophy (2026-07-28)

Editor (plain-language subagent) ran first on the landing page and Philosophy;
Getting Started's copy pass is still outstanding because its structure changed
in this round. Technical pass and layout work follow.

**Errors corrected**

- **Philosophy claimed the contrast report "fails the build".** It warns by
  default; `--strict` is what turns an AA failure into a non-zero exit
  (`cli/main.ts:202`). Rewritten to say both.

- **The landing hero's code fence had lost its `<style>` block** when the page
  was rewritten for specs/53, so the promise "the rendered result of exactly the
  code above it" was false: the live card showed a tinted surface and muted text
  the shown code never produced. The CSS comment still claimed to "mirror the
  fence's own rules", which by then did not exist. Restored, and it now doubles
  as a worked `class`-prop example.

- **The editor introduced one technical error, caught on review.** Making the
  Agents page's palette rule concrete, it wrote that reading `--hz-palette-*`
  directly means "a named theme such as dark cannot change that color". False —
  themes override the palette tier (`tokens.css` sets `--hz-palette-gray` inside
  the dark block), so a palette read *does* follow dark. The real failure is that
  role and intent overrides are ignored. Rewritten. It had flagged its own
  uncertainty there, which is the argument for running it before the technical
  pass rather than after.

**Getting Started (closes specs/53 R6)**

- As the new front door it walked the three tiers and then **dead-ended: no link
  to Components anywhere on the page**. Added a "Where to go next" section
  (Components, Theming, Section themes, Philosophy, Agents).
- Its dark-mode sentence predated named themes. Now says dark is the theme that
  ships with a name, the attribute works on any element, and a page with no
  attribute follows the system with no script.

**Landing page — dogfooding and layout (user-directed)**

- Hand-rolled `<header>` replaced with the real `Header` component (`brand` /
  `actions` snippets, `sticky`, `bordered`). Hand-rolled clamp padding replaced
  with `Container`. Hand-rolled proof grid replaced with `Split fraction="2/3"`.
- Hero simplified to eyebrow/title/subtitle/actions; the worked example moved
  down under Install.
- "Browse the docs" now lists **every** page rather than one link per section,
  one card per band (Components split into its five groups, since 48 links under
  one heading reads as a wall). Cards are containers; only the page names link.
- Added a "Built for your agents too" box above the philosophy link.
- **`@container` bug caught before it shipped:** the proof grid was written as a
  container query, but `Container` sets no `container-type` and the landing page
  has no docs shell — the query could never have matched. Moot under `Split`.

**Verified, not assumed:** the "imports nothing from Kit" claim on the landing
page and Getting Started is true — no `$app/` or `@sveltejs/kit` reference in
`src/lib` or in the built `dist/`, and `peerDependencies` is Svelte only.

**Deferred, with owners**

- **Header docs need a sticky demo** (user, 2026-07-28), in the shape of
  Banner's pin demo. Do it when the audit reaches
  `/docs/components/header`. Hide-on-scroll was considered and **rejected** —
  a keyboard user can tab to a link inside a hidden bar, and WCAG 2.2's
  focus-not-obscured requirement bites.
- **The homepage pattern's Header sits 8px above its 968px collapse threshold**
  at a 1280 viewport, which is why a 15px `scrollbar-gutter` flipped it to
  mobile. The TOC rail makes it non-monotonic: the demo is desktop at 1320,
  mobile at 1440 (the rail reserves 12rem), desktop again at 1600. Give it
  headroom in the **Patterns batch**; the `scrollbar-gutter` question stays open
  until then.

## Re-audit round 3 — the never-audited pages (2026-07-28)

Eight pages that no prior pass had touched: Tooltip, Popover, Loading, Skeleton,
CodeBlock, Observers, Positioning, Section themes. The `editor` subagent ran
first on all eight (two agents, partitioned by file so they could not collide),
then the technical pass worked its ambiguity flags. That ordering paid again:
the single most valuable finding below came from an editor flag, not from the
technical read.

**Errors corrected**

- **Positioning overstated what the primary path does.** The page said a
  floating element "flips to the opposite side and shifts along the cross axis
  to stay fully on-screen". Only the JS fallback shifts (`place.ts` clamps
  `left`/`top` into the viewport with a padding). The preferred CSS
  anchor-positioning path sets `position-try-fallbacks: flip-block` or
  `flip-inline` and nothing else — no shift tactic, no `position-area`, no
  clamp. So on every evergreen browser, the behavior the sentence promised does
  not happen. Rewritten to claim only the flip. **Open question for the user:**
  this is a real behavior difference between the two paths near a viewport
  edge, not just a wording problem, and CSS anchor positioning has no clamp
  tactic that would make it a one-line fix.

- **`data-align` was described as "resolved after any flip".** `position()`'s
  live `settle()` loop re-stamps `data-side` only; `data-align` is written once
  at open time by the callers. Since flipping never changes alignment that is
  fine, but the sentence implied both attributes are re-measured. Split:
  `data-side` is live and re-stamped from real geometry, `data-align` reports
  the resolved logical-to-physical alignment.

- **CodeBlock's Shiki source block showed a pre-IA-move path** in its title
  (`src/routes/components/…` rather than `src/routes/docs/components/…`), on a
  block whose heading promises "verbatim".

- **CodeBlock's Shiki paragraph was genuinely ambiguous about whose background
  gets dropped.** The theme clears CodeBlock's own surface fill
  (`--hz-code-block-bg: transparent` under `[data-highlighted]`) so the
  highlighter's palette shows through. Made explicit, with the frame the block
  still supplies.

- **Popover's Basic fence did not reproduce its own demo** — the demo passes a
  `triggerIcon` snippet and wraps the checkboxes in a `Stack`, neither of which
  appeared in the code a reader copies. Fence brought up to match.

- **Tooltip's Basic demo undercut the point it was making.** The note says the
  tooltip's `aria-describedby` "adds context rather than replacing that name",
  demonstrated by `ariaLabel="Add to bag"` with `tooltip('Add to bag')` — a
  screen reader announced the same string twice and the tooltip added nothing.
  The tooltip now carries information the label does not.

- **Section themes had no `<svelte:head><title>`**, alone among the six theming
  pages.

- **The AGENTS.md file told you to put AGENTS.md somewhere** (user, 2026-07-28).
  "Drop this file into your project root" was the second line of the file's own
  body, which is redundant once the file is in the root. Moved out of
  `renderAgentsMd()` and onto the page as an Alert above the block. The
  `/agents.md` route serves the shorter body too.

**Documented gaps closed**

- Observers never said `mutate`'s callback receives the whole
  `MutationRecord[]` for a delivery rather than a single entry, and `once` was
  mentioned only under Intersect though all three attachments take it.
- Popover's `placement` row was a bare `Placement` type with no note while
  Tooltip's spelled out the union and the RTL behavior.

**Flags checked and cleared (no change needed)**

- `--hz-loading-ease` is documented — it is in the theme-hooks table, which the
  editor could not see from the page source.
- `<Stack gap="away">` on the Popover page is not a typo; `near`/`away` are the
  density values this site is built on.
- Section themes' claim that `theme('light')` restores the default "even inside
  a dark page" is accurate as scoped: the generated light block restores every
  token any *named* theme declares. It would not reset a property only an
  *inline* theme object set, but the page does not claim that.

**Landing page and Getting Started (user-directed, same round)**

- The install example's `Card horizontal` stacked below 640px, so the avatar
  went full-width and the "player card" stopped reading as one. It now stays a
  row at every width with a 3.5rem avatar track, tightened to `padding="sm"`.
  Both halves changed together, since the fence promises to be the whole file.
- "Browse the docs" reordered to Foundation, Theming, Agents, Patterns, then
  the component groups, with Agents surfaced as its own card linking the Agents
  page and `llms.txt`. Eyebrows dropped; each band is now tinted by intent
  instead (Alert's soft mix, 10% light / 22% dark), which is what the eyebrows
  were failing to do.
- Getting Started's "Where to go next" swapped Section themes for Patterns.
- Philosophy's headless section now leads with documented hooks and presents
  snippets as the markup escape hatch, matching how the two are actually
  reached for. The landing page's matching commitment card follows suit.

**Config & CLI promoted to its own Foundation page (user, 2026-07-28)**

The `hyzer.config.ts` documentation lived as four `<h2>` sections partway down
`/docs/theming/tokens`. The decisive argument for moving it was not
discoverability but that **most of it is not theming**: of the four sections,
only the first is about tokens. `icons` trims the generated icon barrel and
`utilities` generates the utility sheet, and both sat on a theming page purely
because that is where the CLI first got written down — which is why the
Utilities page had to link backwards into Theming to explain how its own sheet
is produced.

Now `/docs/foundation/config`, last in Foundation. Placement was reconsidered
mid-flight: the first proposal put it third, next to the Colors/Contrast pages
that describe its output, but Foundation already orders by *when you need a
thing*, not by what it relates to, and CSS Reset and Utilities sit last
precisely because they are opt-in. An optional CLI dropped into the middle of
the non-optional vocabulary pages breaks that rule (user decision: "it's
totally optional").

Theming → Tokens keeps the plain-CSS tier and "Verify your palette", and hands
off in a short section rather than repeating any config sample — the full
reference is schema-exact, and two copies drift. Cross-links repointed:
Icons → `#icons-config-heading`, Utilities → `#full-reference-heading`.

One cleanup found on the way: the new page was first written with its own
`.note` / `.detail-note` / `code` rules copied from the page it came from, all
of which the shipped docs sheet already provides (`.tab-note`, and `p code` /
`li code` chips). Dropped. **Open, not done:** nine local `.note` /
`.detail-note` / `.doctrine-note` rules across seven pages duplicate
`.tab-note` the same way. Worth a sweep, but each needs checking first in case
its treatment is deliberately different.

**Color utilities expanded (user, 2026-07-28)**

`hz-bg-*`, `hz-border-*` and `hz-fill-*` join `hz-text-*` in the opt-in sheet,
each with role helpers plus one class per resolved intent (77 classes, up from
51). The generator now loops one family table instead of emitting text by hand,
so collision tracking runs per family. Badge, Alert and Banner keep owning
their own surfaces, and the page says so.

Contrast doctrine needed a real correction, not just an extension: intent text
is AA-verified **on the two surface roles only**, so `.hz-text-danger` on
`.hz-bg-danger` is a pairing nothing grades and it does not pass. The page now
names the combination the report does cover (Banner's recipe: surface-role text
on a solid intent fill) and notes that `.hz-border-*` answers to 1.4.11's 3:1
non-text rule instead. The live preview in the intent table sets
`border-width`/`border-style` longhands rather than the `border` shorthand,
which would reset `border-color` to `currentColor` and beat the utility — the
same trap a reader will hit.

**Alert icon and heading sweep (user, 2026-07-28)**

Every editorial `Alert` now carries an intent-matched glyph: `info` gets the
circle info icon, `warning` and `danger` get the triangle. 30 call sites across
26 pages, plus the shared `ThemeHooks` warning, which covers every component's
hooks caution at once. The Alert page's own `intents` and `icon` tab demos were
deliberately left alone — the first shows intent color without icons, and the
second exists to demonstrate the icon slot, so adding icons to both would erase
the contrast the page is teaching.

Two related defects surfaced while doing it:

- **`Alert`'s `headingLevel` defaults to `2`, so every titled Alert emits an
  `<h2>` — and the docs Toc was collecting them.** A callout is not a section,
  so no page wants its alerts in the rail. Fixed once at the shell rather than
  per page: `.hz-alert` joins the Toc's `exclude` list in `docs/+layout.svelte`,
  which fixes every page at once, including future ones.
- The same default also renders the title at h2 size, which reads too large
  inside a callout. Fixed on the two pages the user flagged (Config, Section
  themes) with `headingLevel={3}`. **Open:** 31 titled Alerts site-wide still
  take the h2 default. Worth deciding whether that is 31 edits or one change to
  Alert's default (h2 → h3), which is a library API change — free in the current
  breaking window, but it is a real API decision, not a docs fix.

**Config page editor pass — two factual corrections**

The editor's ambiguity flags caught two claims that were wrong or unverifiable,
both inherited verbatim from the theming page:

- **`icons: []` versus omitting the key.** The copy ran the two together as
  though they were the same minimal case. They are not: `resolveIcons` returns
  `undefined` when the key is absent, so no `icons.ts` is written at all, while
  `icons: []` returns the core set and still writes the file
  (`src/lib/config/icons.ts:35`). That distinction is the only way a reader
  learns how to get a core-only barrel, and the page had buried it.
- **What `--utilities` overrides.** The copy said the flag "overrides the config
  key", which reads as though it replaces the configured output path and writes
  to the default filename. It does not: the flag only forces the opt-in, and the
  path still comes from `resolved.utilities.output` (`cli/main.ts:178-181`).

**Config page, final shape (user-directed)**

- The ramps caveat went through three drafts before it was true, which is worth
  recording. Draft one said ramps make the report noisy and cost you
  `--strict`. Draft two kept that and added a per-rung escape that does not
  exist. Both were wrong at the root: `contrastReport` grades
  `--hz-color-text`, `--hz-color-text-muted` and every `--hz-intent-*` against
  the two surface roles (`report.ts:204-206`). Raw `--hz-palette-*` hues are
  never graded, and ramps are palette-only (`schema.ts:45`). So a ramp adds
  **zero** pairings on its own. The failure only happens when an intent points
  at a ramp's pale or dark end rung, and then `--strict` fails the whole run
  because it cannot be scoped. The callout says that now, and the page's one
  config sample carries the safe wiring inline (a `brand` intent aimed at the
  500 rung) rather than shipping a second near-duplicate sample.
- Added a CLI flag reference table. The flags are deliberately not 1:1 with the
  config: `--mode`, `--check` and `--strict` have no config equivalent because
  they describe one run, and `tokens` / `themes` / `icons` have no flag.
- `WhereNext` extracted to `src/docs/WhereNext.svelte` and adopted by Getting
  Started and Config, so onward-link blocks share one card layout and one
  heading id instead of being re-hand-rolled per page.

**Open items for the next session**

- The Toc's `--strict` scope caveat lives only in the danger callout; a reader
  who lands on the flag table from a cross-link will not see it.
- Unverified, flagged by the editor and not resolved: whether `--check`
  suppresses the `icons.ts` write as well as the CSS writes (the flag table
  claims a CI check "touches nothing"), and whether `--out` also relocates the
  utilities sheet when combined with `--utilities`.
- 31 titled Alerts across the site still relied on the old h2 default; the
  default is now h3, so they inherit the fix, but a few pages pass explicit
  levels that may now be redundant or wrong relative to their surroundings.

## Re-audit round 4 — Patterns (2026-07-29)

Editor pass first, partitioned across two runs (five pattern pages + samples,
then six), then this technical pass over their flags. The samples carry most of
the words on these pages: each route page renders its sample and then shows that
same file verbatim, so a sample's headings, labels, help text and code comments
are read twice, once as a demo and once as source somebody copies.

**Verified false alarms.** Two of the editor's flags were wrong, and both were
worth checking anyway:

- The command-palette sample's docblock says "it imports only public exports",
  and the sample imports `uid` from `$lib/utils`. That claim holds: `./utils` is
  a real subpath export, `uid` is exported from its barrel, and `consumerSource`
  rewrites `$lib/utils` to `@hyzer-labs/ui/utils` before the source is shown.
- The virtualized combobox's `aria-expanded` was reported as hard-coded `true`.
  It is bound to `open`.

**Fixed — copy that disagreed with the code.**

- The combobox pattern claimed "25,000+ rows" in two places. The dataset is 30
  courses x 900 rounds = 27,000. The visible count in the sample was already
  derived from `rounds.length`; only the prose was hand-written, and it is now
  either derived or unnumbered.
- The checkout summary rendered "Free standard shipping on orders over $35 —
  applied." even when the shopper picked Express and was charged $8.99. It is
  now worded as the standing policy it is, which is true whichever speed is
  selected.
- Express shipping ($8.99) and gift wrap ($2.00) were each written twice, once
  in a label and once in the totals math. Both are single constants now, so the
  price a shopper reads cannot drift from the price they are charged.

**Fixed — accessibility in copy-paste teaching material.**

- The combobox's `aria-controls` pointed at the listbox id unconditionally. When
  a query matches nothing, no listbox is rendered, so the reference dangled. It
  now names the listbox only while one exists.
- The same empty state was silent: the message sat in no live region and there
  was no active option to announce, so a screen reader user typing a
  non-matching query got nothing. The message now carries `role="status"`.
- The product-listing card art had `alt="{disc.name} disc"` directly above an
  `<h3>` with the name and a Badge with the type, so the name was announced
  twice. The thumbnail is decorative next to that text: `alt=""`.

**Fixed — the Header headroom item carried from round 3.** The homepage sample's
Header used the default `mobileBreakpoint="md"`, which collapses below 968px of
*header* width. Measured in the docs frame, the header renders 974px at both
1280 and 1440: six pixels of headroom. Any classic scrollbar (~15px), zoom step
or narrowed window flipped the demo to a menu button, and at 1200 it was already
collapsed. It now uses `mobileBreakpoint="sm"`, the same fix the Header
component page's own demos took, and it is honest as copied code: four short
links and a button fit the bar far below 968px. Re-measured after the change,
the bar survives at 1200. It is the only sample that renders a Header.

**Fixed — stale paths from the IA move.** `ContactForm` linked
`/patterns/checkout-form` (no `/docs`). A sweep for the same class of break
found two more in shipped files: `ocean.config.ts` and `terminal.config.ts` both
cite `/theming/examples` in comments, and those configs are shown verbatim on
the examples page, so the stale path ships to consumers. All corrected.

**Manifest descriptions.** Six rewritten. The homepage claimed "no custom CSS
beyond a few type sizes" while the sample carries a gradient promo panel and
centering rules; the recipe pointed at "the ingredients and method" when the
sample's heading is Instructions; the command palette did not mention Modal,
which supplies the backdrop, focus trap and Escape handling and is the reusable
lesson. Checkout, product detail and virtualized combobox gained or lost detail
to match what their samples actually show.

**Open, not done.**

- Two command palettes exist: the live docs-site one (`src/docs/CommandPalette
  .svelte`) and the pattern sample. They are separate implementations of the
  same widget. Worth deciding whether the site can render the sample.
- The eleven pattern route pages are near-identical boilerplate (the `composed`
  join, the `.source-note`, the `.sample-frame` CSS, the same breakout comment).
  That duplication is how the `/patterns/checkout-form` link went stale in one
  copy and not the others. A shared page component would make the next copy pass
  one edit instead of eleven.
- The sample palette's `role="option"` rows carry pointer handlers only; the
  input owns all key handling. That is the correct virtual-focus pattern, but it
  ships as teaching material and deserves a comment saying so deliberately.
- Recipe copy asserts a "Gluten-free" badge on a chili with commercial chili
  powder, and pairs "Serves 6" with prose about feeding a card of 4-5 plus
  leftovers. Fictional, but they are factual claims on screen.

## Re-audit round 5 — site-wide plain-language pass (2026-07-29)

The 2026-07-23 sweep was a grep against a banned-word list. This is the first
full editor read of the Foundation pages, all 45 component pages and their data
modules, Theming, and the pages written this week. Five editors ran partitioned
by file, then this technical pass worked their flags.

**A literal NUL byte in library source.** `FileUpload.svelte` built its dedupe
key as `` `${f.name}\x00${f.size}\x00${f.lastModified}` `` with the NULs written
as raw bytes. `file` classified the whole component as binary data, so **grep
skipped it silently** — including in this sweep, where three greps for
`aria-live` and `required` came back empty and read as "the docs claim things
the component does not do". Written as the `\0` escape now: identical runtime
string, plain-text file. The claims it appeared to contradict are all true
(`role="status" aria-live="polite"` on an sr-only div; `required` stamps
`aria-required` and is deliberately not native).

**Breadcrumbs ignored its own documented prop.** The props table and the
component's own header comment both promise `item.ariaCurrent` overrides the
automatic `aria-current="page"`. Only the linked branch honored it; the href-less
branch hard-coded `last ? 'page' : undefined`. The current page is normally the
href-less one, so the override did not work in the case it exists for. Fixed in
the component rather than the docs.

**Code samples that could not run.** Carousel's loop, dots and drag samples all
omitted the required `slide` snippet, and the drag one omitted `items` too. The
Select states sample passed `options={cards}`, a variable defined nowhere (the
demo beside it uses `tees`). Virtualizer's measured sample declared
`row(item, index)` while its demo used `row(item)`.

**Claims corrected.**

- FileUpload said enforcing `required` is "your code's job, or `Form`'s". Form
  has a `novalidate` prop and no validation at all: it renders a summary from the
  errors you hand it. The second half was wrong.
- The reset page said the theme and your CSS "always win ties" against
  `hz-reset`. That conflates two mechanisms: layer order settles theme-vs-reset,
  and unlayered CSS beats any layered rule at any specificity, ties or not.
- Borders & Elevation stated flatly that low-opacity shadows fail WCAG 1.4.11.
  Now scoped to what is true of the shipped tokens.
- Utilities asserted an ungraded utility pairing "will not pass" for every
  intent, and claimed a same-specificity class of yours wins on source order
  without mentioning that this depends on import order.
- The Styling Components page said the `data-*` variant attributes are "always
  present". True where the prop has a default; Blockquote deliberately omits
  `data-intent` when unset so `:not([data-intent])` can style the plain case.
- The same page said Example Themes shows two token-override sheets. It ships
  three tiers, only two of which are generated from a config.
- Spacing used "floor" for both the tightest density level and a cap, in two
  paragraphs. The clamp is real (the depth-3 descendant selector keeps matching
  deeper), so it now says so outright.
- The structural-roles sentence announced seven roles, then listed five and two
  in one breath without saying which are re-authored for dark. Verified against
  `tokens.css`: `surface`, `surfaceMuted` and `text` are re-authored.
- Video called its provider embeds "privacy-friendly". They are
  `youtube-nocookie.com` and `dnt=1`, so the page names the mechanism now.

**Stale promises the art decision invalidated.** Four places still said real
photos and clips were "coming soon" or "until real demo assets land". The
generated SVG art is the shipped choice, so they now say the page needs no media
files and point the reader at their own source.

**`kbd` shipped undocumented, and it was not alone.** The reference theme paints
six things on bare markup: `body`, the `:focus-visible` ring, `:where(a)` and
`:visited`, the new `:where(kbd)`, and `.sr-only`. Only `.sr-only` was documented
anywhere. Theming Overview has a section listing all six, why they sit at zero
specificity, and why `.sr-only` is the one deliberate exception.

**Also:** `dev-warn` / `dev-warns` replaced with "a warning in development"
across the data modules, the hooks roll-up and the Loading page; a duplicated
`.demo-note, .demo-note` selector deduped on two pages; one e2e assertion
re-pinned after an editor expanded the contraction it matched.

**Verified false alarms.** `.demo-col` is a real class in the shipped docs sheet.
Header's drawer nav really is named `` `${ariaLabel} (menu)` ``. Combobox chips
really do drop their dismiss buttons when disabled. Pagination's ends really do
disable natively in button mode.

**Open, deliberately not changed.**

- "labelled" (169) vs "labeled" (18). House spelling is clearly the former, but
  `data-labeled` is a shipped attribute name on Divider and must not change, so
  this wants a decision before a sweep.
- Two editors stripped `specs/NN RN` citations from source comments in the files
  they touched; the rest of `src/docs/data/` still carries them. Those comments
  never render. Either finish the sweep or leave them, but the tree is now
  inconsistent.
- Alert and Banner both state that timed self-dismissing overlays fail WCAG
  2.2.1. The success criterion is failed only when the timing cannot be adjusted,
  extended or paused, so this is a deliberate library position stated as fact.
- Accordion wraps a heading inside `<summary>`, the inverse of the APG's
  heading-wraps-button shape. Valid for `<details>`, and the APG link sits beside
  the claim.
- Tailwind v3 emitting utilities unlayered: unverifiable from this repo.
- Toc's scroll-spy rule is described against the viewport while every demo
  scrolls a 16rem inner article.
