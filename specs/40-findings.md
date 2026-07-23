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
