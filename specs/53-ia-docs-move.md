# 53 — Landing page + `/docs` move + agent-facing surfaces

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. **Depends on** the IA work
> (specs/31), the docs audit (specs/40), and the docs example theme (specs/46).
> Lands **before** npm 0.1.0: URLs in the README and on the npm page are
> effectively permanent, and the move is free only while nothing links here
> (greenfield — the docs site is the only consumer).

### Goal

`design.hyzer.sh` currently opens on the docs Introduction. It should open on a
**landing page for the package**, with every existing page moved one level down
to `/docs/*`. Along the way, add the surfaces an agent-consuming audience needs:
a generated `llms.txt` and a page about wiring this library up to coding agents.

### Context & Doctrine

- **Introduction's ROUTE goes away; its COPY is the landing page's starting
  material** (user decision, 2026-07-28). The landing page answers "what is
  this and why", which is the same question Introduction answered — so keeping
  both would mean maintaining two versions of one answer, but discarding
  Introduction would throw away copy that already answers it well. Nothing is
  rewritten from scratch. `/docs` opens on Getting Started, and this removes a
  page from the outstanding specs/40 audit rather than adding one.
- **The docs shell is not global any more.** `src/routes/+layout.svelte` today
  *is* the shell — sidebar, TOC rail, mobile topbar, skip link, route
  transitions. It splits: `src/routes/docs/+layout.svelte` keeps the shell,
  and the root layout keeps only what every page needs (CSS imports, theme
  state, the theme toggle). This is the substantive work; the file moves are
  mechanical.
- **`manifest.ts` stays the single source of truth**, and `allRoutes` keeps
  driving the e2e route sweep — so nav, coverage and `llms.txt` all move
  together from one edit.
- **Generated, not hand-listed.** `llms.txt` derives from the manifest, for the
  same reason `tokens.css` derives from the config: two hand-maintained lists of
  every page drift, and drift in a file only robots read is drift nobody sees.

---

### Requirements

**R1 — Split the layout.** `src/routes/+layout.svelte` keeps only page-agnostic
concerns: the CSS imports (reset, theme, utilities, docs example sheet), the
theme choice/system-preference state and its `data-theme` effect, the
`.theme-transition` flip, and the route view-transition. Everything else — the
sidebar `Nav` fed by the manifest, the mobile drawer and topbar, the "On this
page" `Toc` rail, `.docs-shell`/`.docs-main`/`.docs-main-inner` and their
styles, the skip link, and the `tocLevelsByPath` map — moves to a new
`src/routes/docs/+layout.svelte`.

- The theme toggle is used by both the landing header and the docs topbar.
  Extract it once (a small `src/docs/ThemeToggle.svelte`) rather than
  duplicating the Button + icon + `aria-pressed` wiring.
- The `--hz-breakout-shift: 0` rule and the container/breakout math belong with
  `.docs-main`, i.e. the docs layout.
- Keep the skip link first in the docs layout's DOM; the landing page needs its
  own (R2).

**R2 — The landing page.** `src/routes/+page.svelte`, rendered without the docs
shell (no sidebar, no TOC rail), full-bleed, composed **entirely from library
components** — it is the most-viewed dogfood on the site. Content:

- `Hero` — what the library is in one line, install command, primary action to
  `/docs`, secondary to the components index.
- **The four Philosophy commitments** carried over from Introduction, not
  newly invented — accessibility shipped by default, headless structure
  overridable through snippets, theming via classes and `data-*` hooks, and
  plain language as part of accessibility. These are the differentiators, and
  the existing copy already states them well (see R7 for how much of it lands
  here versus in docs).
- A live proof block — one real component rendered next to its source, using
  the existing `Example`/`CodeBlock` scaffold.
- `Footer`, with links to Getting Started (`/docs`), Components, Theming,
  Agents, GitHub and npm.
- Its own skip link and `<h1>`; the route-sweep e2e asserts exactly one visible
  `h1` per route (`docs.e2e.ts:21`) and that must keep passing.

**R3 — Move every page to `/docs`.** All 77 pages move from
`src/routes/<section>/…` to `src/routes/docs/<section>/…` (`foundation`,
`components`, `theming`, `patterns`); Getting Started becomes `/docs` itself
rather than a subdirectory (R5). `manifest.ts` hrefs gain the `/docs` prefix,
and its `href: '/docs'` entry leads the list. The `Introduction` entry is
**deleted** and its orienting content folded into the landing page (R2) and
Getting Started (R6) — nothing worth keeping is dropped on the floor.

**R4 — Rewrite internal links, by hand where it matters.** There are ~145
hardcoded `href="/…"` occurrences across ~58 files, and **a large share of them
are fake links inside component demos** — `/pricing`, `/rss`, `#`, and
`/components`-shaped strings feeding `Nav`, `Footer`, `Breadcrumbs`, `Toc` and
pattern-page examples. A blanket prefix rewrite corrupts every one of those
demos, and **no existing test would catch it**: the route sweep only visits real
routes.

- Rewrite only links that resolve to a real manifest route.
- Demo data keeps its fictional hrefs untouched.
- Add a guard test: every `href="/…"` in `src/routes/**` that is not inside a
  demo-data structure must either start with `/docs` or be one of the known
  root routes (`/`, `/llms.txt`). The reviewer checks the demo pages render
  their original fictional URLs.

**R5 — `/docs` IS Getting Started.** Not a redirect and not an index: the
Getting Started page lives at `/docs` itself (`src/routes/docs/+page.svelte`),
and its manifest entry is `href: '/docs'`. There is no
`/docs/getting-started`. This removes the bare-`/docs` 404 question entirely
rather than answering it, and it means the first docs URL is the shortest one.

**R6 — Audit Getting Started as the new front door.** It is now the first docs
page anyone sees, and it inherits Introduction's job of orienting. It must, in
order: install, import a component and render it, pick a styling tier (headless
/ reference theme / your own tokens), and point at Theming and Components. Fold
in whatever Introduction said about the tier model that Getting Started does not
already say. Consumer framing only — no spec numbers, no R-numbers, no internal
process language.

**R7 — Philosophy survives, in two registers.** Introduction's Philosophy
section is the clearest statement of what this library commits to, and it is
kept (user, 2026-07-28) — split by reading mode rather than duplicated:

- **Landing page:** the four commitments as a scannable band — the bolded
  headline of each, one short line apiece, no worked examples — closing with a
  link to the full page. Landing pages get scanned; the fourth commitment
  currently runs five sentences and would stall that scan.
- **`/docs/philosophy`:** a new top-level docs page carrying each commitment in
  full, including the `Form` error-summary example of plain-language defaults.
  This gives it a permanent URL, a sidebar entry, and an `llms.txt` line — so
  an agent reading the index picks up the house rules, which a landing-page-only
  home would hide.

The headline text is the only thing that appears twice, and deliberately: one
copy is a four-word claim, the other is the argument for it. The prose bodies
live in exactly one place.

**R8 — One lead line, one source.** Every docs page already shows a lead line
under its heading, but by two different mechanisms: component pages render
`ComponentDoc.description` from `src/docs/data/*.ts` through `DocPage`, while
Foundation, Theming, Patterns and Getting Started hand-write
`<p class="doc-description">` in markup. Readers see one convention;
maintainers have two, and only one of them is machine-readable.

Unify on the manifest:

- `ManifestPage` gains a **required** `description: string` — the lead line.
- A shared intro component renders the page heading and its lead line from the
  manifest entry matching the current route. `DocPage` renders it too, rather
  than taking `description` as a prop.
- `ComponentDoc.description` is **deleted**; its text moves to the manifest
  entry. The 29 hand-written `.doc-description` blocks are replaced by the
  shared component.
- Nothing is rewritten from scratch — every lead line already exists, in one
  place or the other. Pages whose lead line is thin get fixed as part of the
  audit (R6), not invented here.

The result: adding a page means one manifest entry that feeds the sidebar, the
e2e route sweep, the page heading and `llms.txt` at once — and a lead line
cannot drift from what the page shows, because there is only one copy.

**R9 — `llms.txt`, generated.** Serve `/llms.txt` following the llmstxt.org
convention: an `# @hyzer-labs/ui` heading, a one-paragraph summary, then
`## <Section>` blocks with one `- [Title](url): description` line per page,
sourced from R8's manifest descriptions. Absolute URLs
(`https://design.hyzer.sh/docs/…`), since the file is read out of context. A
test fails if any manifest page lacks a description. `llms-full.txt` is **out
of scope** (R11).

**R10 — The Agents page.** `/docs/agents` — a top-level entry in the docs
manifest, sitting above the Foundation section, using the shared docs shell
like every other page. Linked from the landing footer too. It covers: pointing an agent at `llms.txt`; the import surface
(`@hyzer-labs/ui`, `/config`, `/motion`, `/observers`, `/icons`, `/utils`,
`/types`); and the house rules that keep generated output correct —

- run `hyzer generate` rather than hand-editing `tokens.css`;
- resolve through role and intent tokens, never `--hz-palette-*`, in component
  CSS;
- themes are named entries under `themes`, applied with `data-theme` or the
  `theme` attachment;
- components take `class` and merge it — restyle through that, not by wrapping.

No MCP section yet: the server does not exist. The page is structured so one
can be added without a rewrite.

---

### Edge cases

| Case | Expected |
|---|---|
| `/docs` with no sub-path | Resolves (R5), never 404. |
| Demo links (`/pricing`, `/rss`, `#`) | Unchanged; the demos still show fictional URLs. |
| Landing page in dark mode | Follows the same `data-theme` state as the docs; the toggle is shared, not re-implemented. |
| Landing page `h1` count | Exactly one visible, like every other route. |
| A manifest page added later | Appears in the sidebar, the e2e sweep, its own heading and `llms.txt` from the one entry. |
| A page with no `description` | Type error (the field is required), and a test fails rather than emitting a bare `llms.txt` line. |
| Bare `/docs` | Getting Started renders there directly; no redirect involved. |
| Reduced motion | Landing hero/reveal animations gate exactly as elsewhere. |
| Philosophy prose | Appears once (`/docs/philosophy`); only the four headlines repeat, on the landing band. |

### Out of scope (R11)

- **MCP server and its instructions** — post-0.1.0, per the roadmap. The Agents
  page leaves room for it.
- **`llms-full.txt`** — revisit once the Intro/Getting-Started/Patterns audit has
  settled the prose it would concatenate.
- **Figma integration** — future state, post-publish. Worth recording that the
  `themes` map (specs/52) and Figma variable **modes** are the same model, and
  `themeVars()` already emits the flattened per-theme map an export would need.
- **Redirects from old paths** — greenfield; nothing links to the current URLs.
- The remaining specs/40 audit of **Patterns** — unblocked by this, done after.

### Write scope

`src/routes/+layout.svelte`, `src/routes/+page.svelte`,
`src/routes/docs/+layout.svelte` (new), `src/routes/docs/+page.svelte` (Getting
Started at `/docs`), `src/routes/docs/**` (all remaining moved pages),
`src/routes/docs/agents/+page.svelte` and `src/routes/docs/philosophy/+page.svelte`
(new), the `llms.txt` route/generator,
`src/docs/manifest.ts`, `src/docs/DocPage.svelte`, `src/docs/data/*.ts`
(descriptions removed), `src/docs/DocIntro.svelte` + `ThemeToggle.svelte` (new),
`src/routes/docs.e2e.ts`, `README.md` (links), and the guard tests in R4/R9.
