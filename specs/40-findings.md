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
