# 63 — Footer × Nav: should Footer compose Nav the way Header does?

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. **Builds on `specs/05-footer.md`
> (Footer's contract), `specs/04-nav.md` + `specs/34-sidebar-nav.md` (Nav's
> disclosure behavior) and `specs/35-header-nav-split.md` (why Header composes
> Nav) and does not restate them.** The library is published at **0.5.0**: every
> requirement below is additive or a fix to an already-broken input. No public
> prop is removed or retyped, and no rendered DOM changes for any input that
> works today.

### Goal

Answer the composition question once, in writing, and close the two small holes
the investigation actually turned up. **Decision: Footer does not compose Nav.**
The two components already share the thing worth sharing — the `NavItem` type —
and everything else Nav would bring to a footer is machinery a footer must then
suppress.

Origin (2026-08-03): maintainer question — "footer links are always a vertical
list; should Footer render them through `Nav orientation="vertical"`, and should
dropdown support be surfaced as a prop?"

### Context — what the code says today

Facts the decision rests on. Each is checkable in the current source.

- **The shared contract already exists at the type level.**
  `FooterColumn.links` is `NavItem[]` (`src/lib/types/index.ts`), the same type
  `Nav.items` takes. A consumer moving a link list between Header and Footer
  moves the same objects. Composing the *component* adds nothing to that.
- **Nav hardcodes its Link variant.** Every `Link` Nav renders is
  `variant="nav"` (`Nav.svelte`, all four render sites). Footer defaults to
  `subtle` and exposes `linkVariant` (`'default' | 'subtle' | 'nav'`). Composing
  Nav either regresses Footer's default link treatment or forces a new
  `linkVariant` prop onto Nav that only Footer would ever pass.
- **Nav's structural CSS is unlayered and would win.** `.hz-nav-links` sets
  `display: flex; gap: var(--hz-space-sm, 1rem); list-style: none; margin: 0;
  padding: 0` in Nav's component `<style>` — unlayered, so it beats
  `footer.css`'s `@layer hz-theme` rules (`.hz-footer-column :where(ul)`,
  `:where(li)`). Footer link spacing would silently change for every existing
  consumer.
- **Nav's dropdown machinery is not opt-in.** A vertical Nav still creates
  per-item `uid` panel ids, a `SvelteSet` of open paths, a `defaultOpen` walk
  effect, chevron `<button>`s with `aria-expanded`/`aria-controls`, and —
  unconditionally, in both orientations — a `document` `click` **and** `keydown`
  listener pair per instance (`Nav.svelte`'s closing `$effect`). A five-column
  footer composing one Nav per column registers five pairs to service dropdowns
  it will never open.
- **`children` is contractually ignored in a footer** (`specs/05-footer.md` R6),
  and `Footer.svelte.spec.ts` pins it: a footer renders **no** `<button>` and no
  `[aria-expanded]`. Composing vertical Nav flips that behavior for anyone who
  passes `children` today.
- **The class hooks are published.** `src/docs/hooks.ts` documents
  `.hz-footer-column` ("one column's nav landmark") and `.hz-footer-heading` as
  contract. Composing Nav inserts `.hz-nav` / `.hz-nav-links` inside each column
  and pulls all of `nav.css` (panel surfaces, chevron controls, heading banding,
  the panel entrance animation) into the footer's subtree.
- **The landmark story is already correct, and is better than Header's.** Each
  column renders `<nav class="hz-footer-column" aria-label={column.title}>`, so
  footer navigation never collides with Header's `'Main navigation'` default. A
  composed Nav defaults to that same `'Main navigation'` string, so composition
  would make the collision the *easy* mistake instead of an impossible one.

Net: composition costs a new Nav prop, a silent visual change, five listeners
per footer, a behavior flip pinned by tests, and a documented hook change — to
replace roughly a dozen lines of `{#each}` + `<Link>`. The reuse that matters
(`NavItem`, `Link`, `Grid`, `cx`) is already in place.

Where Header is different, and why the precedent does not transfer: Header
composes Nav because it needs Nav's *behavior* — the same items rendered as
horizontal dropdowns in the bar and as vertical disclosure in the drawer
(`specs/35` R5). Footer needs no behavior at all; it needs a list.

---

### Requirements

**R1 — Decision, recorded and enforced: Footer keeps its own link rendering.**
`Footer.svelte` does not import `Nav`, now or as part of this spec's changes.
Its column markup (`<nav class="hz-footer-column">` → heading → `<ul
role="list">` → `Link`) is unchanged for every input that works today. `Nav`
gains **no** props in this spec — in particular no `linkVariant` and no
`footer`/`compact` mode. The shared contract between the two components stays
the `NavItem` type in `src/lib/types/index.ts`.

The Reviewer's check is a diff check: after this spec, `Footer.svelte` contains
no `Nav` import, and `Nav.svelte`'s `Props` interface is byte-identical to its
pre-spec state.

**R2 — Dropdowns are out of contract, and are not a prop.** No `dropdowns`,
`collapsible`, or `orientation` prop is added to Footer. `NavItem.children` and
`NavItem.defaultOpen` continue to be ignored (`specs/05-footer.md` R6/R7 stand
verbatim: only `label`/`href`/`external`/`ariaCurrent` are read).

What changes is only the *silence*. Ignoring `children` is exactly the
misuse-that-vanishes case the dev-warning policy covers, so `Footer.svelte`
gains a dev-only warning, modelled on Nav's heading-in-`items` warn:

- Guarded by `DEV` from `esm-env` and raised in an `$effect` (Nav's shape).
- Fires once per render pass when **any** link in **any** column carries
  `children` (one warning, not one per item), prefixed `[hz-footer]`.
- Message states that footer links are a flat list, that `children` was ignored,
  and points at `Nav orientation="vertical"` for navigation that needs
  disclosure. It names the first offending item's `label` so the consumer can
  find it.
- `defaultOpen` alone does **not** warn — it is inert without `children` and
  warning on it would fire for anyone reusing a sidebar item array verbatim,
  which is a legitimate thing to do.

No rendered output changes: a link with `children` still renders exactly one
flat `<Link>`, no `<button>`, no `[aria-expanded]`.

**R3 — A blank column title must not produce a nameless landmark.**
`aria-label={column.title}` with an empty or whitespace-only `title` renders
`aria-label=""`, which is *no accessible name* — an anonymous `<nav>` landmark,
which is worse for a screen-reader user than no landmark at all (it appears in
the landmark list as bare "navigation"). `FooterColumn.title` is typed
`string` and required, so this reaches the DOM only from JS consumers or an
empty template value, but it reaches it silently.

When `column.title` is empty or whitespace-only:

- the column renders as `<div class="hz-footer-column">` — same class hook, no
  `<nav>`, no `aria-label`;
- the `.hz-footer-heading` element is **not** rendered (an empty `<h2>` is the
  same defect one level down);
- the `<ul role="list">` and its links render exactly as they do today;
- a dev-only `[hz-footer]` warning (same `DEV`/`$effect` mechanism as R2) names
  the column index and says a column title is what labels the landmark.

Every column with a non-blank title is untouched — still a labelled `<nav>`.

**R4 — The landmark model stays: one labelled `<nav>` per column.** Footer does
**not** move to a single wrapping `<nav>` around the columns grid. Reasons, in
order: the per-column landmark is already published contract
(`src/docs/hooks.ts`, `footerDoc.a11yNote`, `specs/05-footer.md` R4); the labels
are consumer-supplied and therefore automatically distinct from Header's
`'Main navigation'`; and a wrapping nav would need a *new* label prop with a
default that could collide with the header's. Reviewer verifies no structural
change here beyond R3's blank-title case.

**R5 — Docs follow-through.** Consumer framing only — no spec numbers, no
`Rn` references, no test-gate or process language.

- `src/docs/data/footer.ts`, the `FooterColumn.links` note: state that footer
  links are a flat list, that `children` is ignored, and that navigation needing
  expandable sections is a vertical `Nav` rather than a Footer column. (This
  file drives the prop table, so the docs page needs no edit of its own.)
- Same file, `a11yNote`: add one sentence — a column title is what names its
  landmark, so give every column a title, and keep those titles distinct from
  the site's main navigation label.
- No change to `src/docs/data/nav.ts` or the Nav docs page: nothing about Nav
  changes.

**R6 — Spec bookkeeping.** `specs/05-footer.md` gains a dated **Amendments**
section (the `specs/35` shape) recording: R6's `children` handling now dev-warns
(behavior unchanged); R4 gains the blank-title exception from R3; and the
composition question is settled here. Historical text is not rewritten.

---

### Edge cases

| Case | Expected |
| --- | --- |
| Existing footer, no `children`, all titles non-blank | Byte-identical DOM, no warnings. The whole existing `Footer.svelte.spec.ts` stays green unmodified. |
| Link carries `children` | One flat `<Link>`, no `<button>`, no `[aria-expanded]`; one dev warning naming the item label. |
| Several links across several columns carry `children` | Exactly **one** warning per render pass. |
| Link carries `defaultOpen` but no `children` | Renders as a plain link. **No** warning. |
| `children: []` (empty array) | Present-but-empty is still a misuse of the field — warns, renders the flat link. |
| `title: ''` or `title: '   '` | `<div class="hz-footer-column">`, no `aria-label`, no heading element, links intact, one dev warning naming the index. |
| Blank title + non-blank titles in the same footer | Only the blank one degrades to a `<div>`; the others stay labelled `<nav>` landmarks. |
| `columns={[]}` | Unchanged — footer + snippets, no columns, no warnings. |
| Production build | Both warnings are `DEV`-gated and must be absent from the built library (the existing tree-shake expectation for `esm-env` guards). |
| A consumer who genuinely wants disclosure in a footer | Composes `Nav orientation="vertical"` themselves inside their own `<footer>`, or inside Footer's `bottom` snippet. Documented in R5, not a Footer prop. |
| Header and Footer fed the same `NavItem[]` | Works today and keeps working: Header renders the dropdowns, Footer renders the flat links. This is the compatibility the shared type buys. |

### Existing code to reuse

- **Nav's dev-warn pattern** (`Nav.svelte`'s `DEV`-guarded `$effect` +
  `console.warn('[hz-nav] …')`) — R2 and R3 are the same shape with an
  `[hz-footer]` prefix. One `$effect` covering both warnings is fine; do not add
  a warning helper module for two call sites.
- **`isNavHeading`** (`src/lib/utils`) is **not** needed — footer columns take
  `NavItem[]`, not `NavChild[]`.
- **`Link`, `Grid`, `cx`** — already composed by Footer; unchanged.
- **`Footer.svelte.spec.ts`'s existing describe blocks** (`R4 — column
  structure`, `R6 — children ignored`) — extend them; the new cases belong beside
  the ones they qualify, not in a new file.
- **`specs/35-header-nav-split.md`'s Amendments section** — the format R6 copies.

### Test plan

Runner: **Vitest**, `client` project (chromium, Playwright provider) via
`vitest-browser-svelte`, in `src/lib/components/Footer.svelte.spec.ts`.
`expect.requireAssertions` is on — every test asserts.

**Unit (client) — new cases:**

- R1: `Footer.svelte`'s module has no `Nav` dependency. Assert behaviorally
  rather than by source-reading — a rendered footer contains no `.hz-nav`
  element for any input, including one whose links carry `children`.
- R2: with a `children`-carrying link, `console.warn` is called exactly once
  (spy, restored in `afterEach`) and the message contains `[hz-footer]` and the
  offending label; the rendered column still has one `<a>`, zero `<button>`, zero
  `[aria-expanded]` (the existing R6 assertions, unchanged).
- R2: two columns each carrying `children` → still exactly one warn call.
- R2: `defaultOpen: true` without `children` → zero warn calls.
- R2: a clean footer → zero warn calls (the "no new noise for existing
  consumers" gate).
- R3: `title: ''` → `.hz-footer-column` exists, `tagName === 'DIV'`, no
  `aria-label` attribute, no `.hz-footer-heading` in that column, `ul[role=list]`
  present with the expected `<li>` count, one warn naming index `0`.
- R3: `title: '   '` behaves identically to `''`.
- R3: mixed blank + non-blank columns → exactly one `<div>`-form column and the
  rest still `nav[aria-label]`.

**Regression gate:** every existing test in `Footer.svelte.spec.ts` passes
**unmodified**. That file is the proof of R1's "no DOM change" claim; a Builder
who needs to edit an existing assertion has changed something this spec forbids.

**Unit (server):** `src/docs/hooks.spec.ts` and `src/docs/manifest.spec.ts` stay
green untouched — no hook, part, or page changes.

**Not covered:** no e2e. Nothing user-visible changes on the docs site; the
route sweep already covers `/docs/components/footer`.

### Non-goals

- **A `linkVariant` (or any) prop on `Nav`.** Nav's `variant="nav"` links are
  its contract; a footer-driven prop on Nav is the tail wagging the dog.
- **Dropdowns, menus, or expandable sections in Footer**, by prop or otherwise.
  The vertical `Nav` already covers that case and a consumer can place one
  anywhere.
- **Collapsible footer columns on mobile** (the accordion-footer pattern). A
  real design, and genuinely different from Nav's disclosure — it belongs to
  `Accordion`, and to its own spec if it is ever wanted. Not this one.
- **`NavHeading` group labels inside footer columns.** Sub-grouping a footer
  column is a plausible sitemap-footer want, but nobody has asked for it, and
  it would mean widening `FooterColumn.links` to `NavChild[]`.
- **A `column` snippet on Footer** (consumer-rendered column bodies). It would
  make Footer a layout shell for arbitrary content; today the escape hatch is
  "write your own `<footer>`", which is honest and free.
- **Narrowing `FooterColumn.links` to a children-free type.** See Open
  Questions Q1.
- **Any change to `Header`.** It composes Nav for behavior it actually uses.

### Write scope

`src/lib/components/Footer.svelte` (the two dev warnings and R3's blank-title
branch — nothing else); `src/lib/components/Footer.svelte.spec.ts` (new cases
appended to existing describes); `src/docs/data/footer.ts` (two notes);
`specs/05-footer.md` (Amendments section). No changes to `Nav.svelte`,
`Header.svelte`, any theme CSS, `src/docs/hooks.ts`, the manifest, the types
module, or any route. No new dependencies, no new exports.

---

### Open questions

Confirm, override, or discuss. Each names the requirement it moves.

> **Decisions (2026-08-03, user):** Q2 resolved — degrade, R3 as written.
> Q3 resolved — keep the warn. Both built the same day (R2, R3, R5, R6 landed).
> Q1 and Q4 stand as recommended (no type change, landmark model kept).

**Q1 — Type-level `children` rejection instead of (or alongside) the runtime
warn?** `FooterColumn.links` could become `Omit<NavItem, 'children' |
'defaultOpen'>[]`, which errors at build time on an inline object literal
carrying `children` — but *not* on a `NavItem[]` passed through a variable
(TypeScript's excess-property check only fires on literals), so it catches the
smaller half of the cases and still needs R2's runtime warn for the rest.
**Recommendation: no.** One mechanism that catches every case beats two that
each catch some, and retyping a published field at 0.5.0 buys a compile error
for a case the warn already reports. *Affects R2 and the Non-goals list.*

**Q2 — Blank title: degrade the element, or warn only?** R3 as written drops
the `<nav>` and the heading. The cheaper alternative is to warn and leave the
nameless landmark in place. **Recommendation: degrade (R3 as written).** An
anonymous `navigation` landmark is a real WCAG 1.3.1/4.1.2 defect in the
consumer's shipped page, and the dev warn is invisible in production; the
degraded form is correct in both. *Affects R3.*

**Q3 — Is the `children` warn worth the noise at all?** Anyone who feeds one
`NavItem[]` to both Header and Footer — the exact reuse the shared type invites —
will now see a console warning on every dev render of the footer, for markup that
is behaving as designed. **Recommendation: keep the warn, and keep it to one
line per render** (R2 already caps it), because a link that silently disappears
from a sitemap footer is the failure mode this catches. If the noise proves
worse than the bug in practice, the cheap retreat is docs-only (R5) with the warn
dropped. *Affects R2 — and this is the one I would most expect to be overruled.*

**Q4 — Landmark count.** A six-column footer publishes six `navigation`
landmarks; some a11y practitioners consider that landmark noise and would prefer
one `<nav aria-label="Footer">` wrapping headings-plus-lists. R4 keeps the
current model because it is shipped, published as a hook contract, and gives
every landmark a distinct consumer-authored name. **Recommendation: keep. If it
should change, it is a 0.6.0 item with a migration note, not part of this spec.**
*Affects R4.*
