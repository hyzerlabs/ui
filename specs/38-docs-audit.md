# Docs audit — fine-tooth-comb pass over every page and component

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) as pass/fail. Write scope: `src/docs/data/` (new),
> `src/docs/consumerSource.ts` + spec, `src/docs/samples/`, every
> `src/routes/**/+page.svelte`'s copy, `src/docs/hooks.ts` prose,
> `specs/36-findings.md` (new), and component sources **only** where a finding
> requires it (each such change amended into the component's original spec).

### Goal

Every docs page gets one deliberate pass before `@hyzer-labs/ui` 0.1.0 ships:
copy tightened, API tables verified against source, a11y claims verified
against behavior, samples verified copy-pasteable. This is the **last free
window for breaking API changes** — once the npm package has consumers
(hyzer.sh, heffner.dev), renames cost migrations, so naming problems found
here get fixed here.

The pass also does one structural extraction: per-page DocPage inputs move
into importable data modules. That gives the docs pages, the planned
`llms.txt`/markdown endpoints, and the future MCP server one shared source
that cannot drift (roadmap: audit → publish → MCP → site refactors).

### Requirements

1. **R1 — Doc data modules.** Each component page's DocPage inputs
   (`description`, `importLine`, `props`, `types`, `a11yNote`, `a11yLinks`)
   move from the route file into `src/docs/data/<slug>.ts` exporting a typed
   `ComponentDoc`; `src/docs/data/index.ts` re-exports a registry keyed by
   component name. Route pages import their module and spread it into
   `DocPage` — demos stay in the route. A new `data.spec.ts` pins coverage
   both ways (every component page in the manifest has a registry entry;
   every entry has a page), mirroring `hooks.spec.ts`.
2. **R2 — Prop-table accuracy floor.** `data.spec.ts` also asserts, for every
   registry entry, that each documented prop name appears in the component's
   source (`Props` interface / `$props()` destructuring) — documented ⊆
   source, so a renamed prop fails CI. The reverse direction (every public
   prop documented, types/defaults/required flags correct) is verified
   manually per page via the checklist; findings go in the log.
3. **R3 — consumerSource closes the icons/utils gap.** Known defect: the
   command-palette pattern's shown source keeps `$lib/icons/IconSearch.svelte`
   and `$lib/utils` — dead specifiers in a consumer app. Fix: the sample
   imports named exports from the `$lib/icons` barrel; `consumerSource` gains
   `$lib/icons` → `@hyzer-labs/ui/icons` and `$lib/utils` →
   `@hyzer-labs/ui/utils` rewrites (both are real subpath exports);
   `INTERNAL_SPECIFIER` broadens to catch subpaths and deep `.svelte` paths;
   `consumerSource.spec.ts` iterates **every** file in `src/docs/samples/`
   (today it only pins the theme examples) asserting no internal specifier
   survives the rewrite.
4. **R4 — Copy pass.** Every page's prose is rewritten where it fails the
   Editorial standards below: lead descriptions, section intros, prop-table
   descriptions, tab-notes, a11y notes. Tightening means cutting filler and
   sharpening claims — not compressing into fragments.
5. **R5 — A11y claims verified.** Every `a11yNote` sentence is traced to the
   implementation or a test that proves it (roles, keyboard behavior, focus
   management, aria attributes). Claims that can't be traced are fixed —
   in the copy or in the component, whichever is wrong. Pages implementing a
   WAI-ARIA APG pattern link it in `a11yLinks`.
6. **R6 — Demos and examples.** Per page: every Example's code fence matches
   what the demo renders (including reactively, when a variant sub-tab is
   selected); hidden-panel/tab gotchas checked at each viewport; every
   pattern sample still compiles standalone when copied (specifier half is
   pinned by R3; imports/exports half verified manually).
7. **R7 — Theme-hooks prose.** `hooks.ts` entries' descriptions and
   selectors are verified against the shipped theme CSS — every named class,
   data-attribute, and part must exist and mean what the entry says.
   (`hooks.spec.ts` pins shape, not truth; the audit supplies the truth
   check.)
8. **R8 — Links and IA.** Cross-links verified per page: related components
   referenced where a reader would want them; patterns pages' "Composes"
   lists match the sample's actual imports; no dead or `#` links in docs
   prose (sample-internal `#` links are fine); every h2 is TOC-worthy — its
   text reads as a destination, not a sentence.
9. **R9 — API changes surfaced by the audit.** Renames and behavior fixes
   found during the pass are made now (greenfield), each with: the change,
   a dated amendment in the component's original spec, updated tests, and a
   findings-log entry. No silent API drift — the findings log is the record
   the 0.1.0 release notes are written from.
10. **R10 — Findings log and completion.** `specs/36-findings.md` holds one
    table: page → findings → resolution (fixed / copy-only / API change /
    no-op). A page is done when its checklist is all-green and its row is
    filled. The audit is done when every route in the manifest has a row and
    the full suites (unit, e2e, build, lint) are green.

### Per-page checklist

Applied to every route in the manifest. Sections marked † apply only to
component pages (DocPage); foundation/theming/patterns pages skip them.

**Copy**
- [ ] Lead description says what it is and when to reach for it, in ≤2
      sentences, no marketing.
- [ ] Section prose passes the Editorial standards; no filler.
- [ ] Terminology consistent (see standards): snippet, bindable, intent,
      variant, theme hook.

**API accuracy †**
- [ ] Every public prop documented; names, types, defaults, required flags
      match source exactly.
- [ ] Supporting types (item/option shapes) documented where a prop uses
      them.
- [ ] `importLine` matches what a consumer types, including helpers the page
      demonstrates.

**Accessibility †**
- [ ] Every a11y claim traced to implementation or a test.
- [ ] Keyboard interactions listed match behavior.
- [ ] APG/MDN reference linked where a pattern exists.

**Demos & examples**
- [ ] Example code fences match the rendered demo, including reactive
      variants.
- [ ] Nothing broken in hidden tab panels; no layout overflow at 375/768/1280.
- [ ] Pattern samples compile standalone as shown (imports are public
      exports).

**Theme hooks †**
- [ ] Hooks table's classes/attributes exist in shipped CSS and descriptions
      are true.

**Links & IA**
- [ ] Cross-links to related components/patterns present and correct.
- [ ] "Composes" list (patterns) matches the sample's imports.
- [ ] h2 headings read as destinations (they are the TOC).

### Editorial standards

- Active voice, present tense. The component does things; "is used to" is
  banned.
- No "simply", "just", "easy", "powerful", "flexible". If a sentence
  survives deleting a word, delete the word.
- Lead descriptions answer *what* and *when*, not *how* — the how is the
  demo.
- Prop descriptions start with the behavior, not "This prop…"; one sentence
  unless a constraint genuinely needs a second.
- Code identifiers (props, classes, tokens, components) in backticks;
  component names as their export (`RangeSlider`, not "range slider") when
  referring to the API, plain words when referring to the concept.
- Fixed vocabulary: **snippet** (never slot), **bindable** (for `$bindable`
  props), **intent** (semantic color), **variant** (visual style), **theme
  hook** (public styling contract). Headings are sentence case.
- Notes about gotchas state the consequence first, then the cause.

### Suggested order

1. R1–R3 (mechanical: data modules, parity floor, consumerSource) — lands as
   its own batch so the per-page passes start from stable tooling.
2. Per-page passes by sidebar section: Foundation → Components (group by
   group) → Theming → Patterns → Introduction/homepage. One findings-log
   batch per section.

### Existing Code to Reuse

- `hooks.ts` + `hooks.spec.ts` — the registry-keyed-by-component pattern and
  its two-way coverage pin; `data.spec.ts` mirrors it.
- `consumerSource.ts` — extend the rewrite table; don't invent a second
  mechanism.
- The docs e2e sweep already pins mechanics (h1 count, skip link, overflow,
  TOC); the audit doesn't duplicate those checks manually.

### Test Plan

**Unit:** `data.spec.ts` (registry coverage both ways + documented-⊆-source
prop parity); extended `consumerSource.spec.ts` over all samples; existing
suites stay green through any R9 API changes.

**e2e:** unchanged sweep stays green after every batch; spot-check that
pages whose h2s changed still produce sensible TOC rails.

**Build/lint:** full `build` + `lint` green per batch (per the usual
cadence).

### Out of Scope

- The markdown/`llms.txt` endpoints and MCP server themselves (next roadmap
  phase — R1 only prepares their data source).
- npm packaging/publish checklist (its own spec).
- New components or patterns (timeline/contact-form wait for the site
  refactors).
- Visual/theme redesign — copy and correctness only.
