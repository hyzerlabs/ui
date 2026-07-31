# llms-full.txt — the whole component surface in one fetch

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Full-Rn`) and edge case as pass/fail. Write scope: one new docs
> module (`src/docs/llms.ts`) + its spec (`src/docs/llms.spec.ts`, **server**
> project), one new route (`src/routes/llms-full.txt/+server.ts`), a rewrite of
> `src/routes/llms.txt/+server.ts` down to a thin route over the new module
> (Full-R2), one paragraph + one code fence on `src/routes/docs/agents/
> +page.svelte`, one line in `renderAgentsMd()` (`src/docs/agentRules.ts`), one
> README bullet, and two Playwright assertions in `src/routes/landing.e2e.ts`.
>
> **No change to `componentDocs`, `hooks.ts`, or the manifest.** This spec adds a
> reader of those three, not a fourth source. If a component is missing a prop
> row today, this file reports it missing — fixing the data is a separate job.

### Goal

Ship `https://design.hyzer.sh/llms-full.txt`: one prerendered plain-text
document carrying the complete prop and styling-hook surface of every component
in the library, so a coding agent makes **one** request instead of fifty page
reads. It is the `llms-full.txt` companion to the existing `llms.txt` index
(llmstxt.org), and it is derived at build time from `src/docs/data/*`,
`src/docs/hooks.ts`, and `src/docs/manifest.ts` — never hand-written, so it
cannot drift from the pages a human reads.

### Context & Conventions

- **Everything it says already exists and is already policed.** `data.spec.ts`
  holds every documented prop name against the component source; `hooks.spec.ts`
  holds every root class, `data-*`, `--hz-*` and part class against the real
  source and theme, in both directions. That is what makes a dense
  machine-facing dump safe to ship: the no-fiction tests are upstream of it.
- **The precedent is `agentRules.ts` → `/agents.md` + `/docs/agents`**, not
  `scripts/gen-*.ts`. The `gen-*` family writes **committed package source**
  (`tokens.css`, the icon barrel) and is guarded by drift tests. This artifact is
  **site output**: a prerendered route, exactly like `llms.txt` today. See
  Decision 1.
- **Consumer-facing copy rules apply** to every line of prose the file carries
  and to the Agents-page paragraph: no spec numbers, no `Rn`, no test-gate or
  process talk (`AGENTS.md`, Hazards).
- The renderer is **pure**: plain TypeScript over three imported data modules, no
  `fs`, no `$app/*`, no SvelteKit import, no `Response`. The route wraps it. That
  is the whole affordance the future MCP server needs (Out of Scope).

### Decisions (settled — do not re-litigate)

1. **A prerendered route, not a build script.** `src/routes/llms-full.txt/
   +server.ts` with `export const prerender = true`, mirroring
   `src/routes/llms.txt/+server.ts` line for line. adapter-static already emits
   `llms.txt` as a real file, so `llms-full.txt` lands beside it with no new
   wiring, no new `package.json` script, and nothing new to commit or keep in
   sync. A `scripts/gen-llms-full.ts` would produce a large generated file
   someone has to remember to regenerate, plus a drift test to catch them when
   they forget — cost with no buyer.
2. **The rendering logic moves into `src/docs/llms.ts`, and both routes become
   thin.** The new module owns `SITE`, the shared page-link helper, the existing
   index renderer (moved verbatim from the `llms.txt` route), and the new
   `renderLlmsFull()`. Reason: the two artifacts share the site origin and the
   link format, and the file has to be importable by a node process that is not
   SvelteKit (the MCP layer, later) and by a plain vitest server test (Full-R9).
   This is the `agentRules.ts` shape, one directory over.
3. **Markdown, with tables.** The file is `text/plain` on the wire (llms.txt's
   content type) but markdown in content — headings, fenced code, pipe tables —
   because that is what the docs data already is (`PropRow` is a table row) and
   what every model reads best. Pipe escaping is therefore load-bearing, not
   cosmetic (Full-R6).
4. **Manifest order, group headings preserved.** Not alphabetical. The manifest
   order is the curation a human already made (Content, Feedback & Status,
   Overlays, Layout, Navigation, Media, Forms), it matches `llms.txt` and the
   sidebar, and it puts related components next to each other — useful context
   for a model reading straight through. Alphabetical would scatter the seven
   groups for no gain, since nobody scans this file by eye.
5. **`a11yLinks` are dropped; every note stays verbatim.** The links are external
   URLs (MDN, the APG) that an agent can reach on its own and that add ~150 lines
   of low-density text. Prop `note`s and `a11yNote`s are the opposite: they carry
   the constraints that stop generated code being wrong ("`circle` always forces
   `full`", "error beats disabled"). No truncation, no summarising, no
   per-component budget.
6. **Components only, plus the import surface.** The per-page prose of
   Foundation, Theming and Patterns is not restated here; `llms.txt` already
   indexes those pages with descriptions and URLs, and this file links back to
   it (Full-R4). What does ship beyond components is the `importSurface` constant
   already single-sourced in `agentRules.ts` — the one non-component fact an
   agent needs before it can write a single import line. Token names, motion and
   observer signatures, and the positioning options are Out of Scope for v1 with
   the reason stated there.
7. **No response header, no `_headers` entry.** Discovery is a link in
   `llms.txt`, a line in `AGENTS.md`, a paragraph on the Agents page, and a
   README bullet (Full-R4). A custom header on a static host is a config file
   nobody will remember exists.

### Output format (normative)

```
# @hyzer-labs/ui — full component reference

> Every component's props, styling hooks, and accessibility notes in one file.
> Generated from the same data that renders the documentation site.

Index of every documentation page: https://design.hyzer.sh/llms.txt
Conventions for coding agents: https://design.hyzer.sh/agents.md

## Imports

```ts
<importSurface, verbatim from agentRules.ts>
```

## Content

### Accordion

<manifest description, one paragraph>

Docs: https://design.hyzer.sh/docs/components/accordion

```ts
import { Accordion } from "@hyzer-labs/ui"
```

#### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `items` | `AccordionItem[]` | `[]` | … |

#### AccordionItem

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| … |

#### Styling

Root class: `hz-accordion`

| Attribute | Values | Notes |
| --- | --- | --- |
| `data-multiple` | present when … | … |

| Custom property | Values | Notes |
| --- | --- | --- |
| `--hz-accordion-gap` | `<length>` | … |

| Part | Values | Notes |
| --- | --- | --- |
| `.hz-accordion-item` | child element | … |

#### Accessibility

<a11yNote, verbatim, blank lines preserved>
```

Heading depth is fixed: `#` title, `##` for `Imports` and each component group,
`###` per component, `####` per section within a component. Every optional block
(`types` sub-tables, each of the three hook tables, `Accessibility`, the
`Styling` block as a whole) is omitted entirely when its source data is absent —
never emitted as an empty table or a "None" placeholder.

### Requirements

1. **Full-R1 — `renderLlmsFull(): string`, derived, never authored.** A pure
   function in `src/docs/llms.ts` that walks, in this order: the manifest's
   `Components` section (group by group, page by page, in manifest order), and
   for each page label reads `componentDocs[label]` and `hooks[label]`. It reads
   nothing else about components. No component name, prop, type, default, note,
   hook, class, description, or URL is written literally anywhere in the module —
   the only literal strings it contains are the fixed headings, the intro block,
   and the table separators.

2. **Full-R2 — `src/docs/llms.ts` is the shared module; both routes are thin.**
   It exports `SITE` (`'https://design.hyzer.sh'`), the page-link helper, the
   existing index renderer (moved **verbatim in behaviour** from
   `src/routes/llms.txt/+server.ts`, apart from the one new intro line in
   Full-R4), and `renderLlmsFull()`. `src/routes/llms.txt/+server.ts` becomes
   `prerender` + a `GET` returning the index renderer's output with its current
   `content-type: text/plain; charset=utf-8`, and nothing else. **The bytes
   `/llms.txt` serves must be unchanged except for the added line**, so the
   existing e2e assertions on it keep passing untouched.

3. **Full-R3 — the route.** `src/routes/llms-full.txt/+server.ts`:
   `export const prerender = true`, a `GET` returning `renderLlmsFull()` with
   `content-type: text/plain; charset=utf-8` — identical shape to the `llms.txt`
   route. No load function, no params, no caching header.

4. **Full-R4 — discovery, in four places and no more.**
   - `llms.txt`'s intro block gains one line naming the companion file and its
     absolute URL, in the plain register the rest of that intro uses (roughly:
     "Every component's props and styling hooks in one file:
     https://design.hyzer.sh/llms-full.txt").
   - `renderAgentsMd()` gains one line beside its existing
     `Machine-readable index of every page: …/llms.txt` line, pointing at
     `…/llms-full.txt` and saying in the same breath what it holds. This one edit
     reaches both `/agents.md` and the Agents page's verbatim fence.
   - `src/routes/docs/agents/+page.svelte`, in the existing "Point the agent at
     llms.txt" section: one short paragraph and one `CodeBlock` carrying the
     absolute URL, saying that the index is one line per page while this file is
     the whole component reference — props, styling hooks, and accessibility
     notes — for an agent that would rather fetch once than crawl. Consumer
     register throughout.
   - `README.md`: one bullet beside the existing `llms.txt` bullet.

   **Not** the site footer (`SiteChrome.svelte`), and no response header
   (Decision 7).

5. **Full-R5 — the per-component section.** For each component page, in this
   order, with any block whose data is absent omitted whole:
   - `### <label>` — the manifest label, which is also the `componentDocs` key.
   - The manifest `description`, as one paragraph.
   - `Docs: <SITE><href>` — the absolute page URL, from the manifest.
   - The `importLine` from `componentDocs`, in a ` ```ts ` fence.
   - `#### Props` and a four-column table (`Prop | Type | Default | Notes`) from
     `doc.props`. `note` absent → an empty Notes cell.
   - One `#### <type.name>` table per entry in `doc.types`, same four columns.
   - `#### Styling`, when `hooks[label]` exists: the line
     `Root class: \`<root>\``, then a three-column table per non-empty block —
     `Attribute | Values | Notes` for `attrs`, `Custom property | Values | Notes`
     for `props`, `Part | Values | Notes` for `parts`. When the entry carries a
     `warning`, it is emitted as one blockquote line above the tables.
   - `#### Accessibility` and `doc.a11yNote` verbatim, blank lines preserved.
     `a11yLinks` are not emitted (Decision 5).

   Names, hook names, and part classes are wrapped in backticks; types, defaults
   and values are wrapped in backticks; notes are not.

6. **Full-R6 — cell sanitisation, the one thing that silently corrupts the
   file.** Every value placed in a table cell passes through one helper that:
   - escapes `|` as `\|` (union types — `'text' | 'circle' | 'rect'` — are the
     common case and appear in almost every component);
   - collapses any newline or run of whitespace to a single space, so a
     multi-line note cannot break the row;
   - trims.

   Text emitted **outside** tables (the description, the a11y note) is passed
   through unchanged — that is where multi-paragraph prose is legal.

7. **Full-R7 — a component with no styling contract renders correctly.**
   `hooks[label]` may be absent (Metatags renders only `<svelte:head>`). The
   `#### Styling` block is then omitted entirely and the section is otherwise
   complete. No throw, no `undefined` in the output. Likewise a component with
   no `a11yNote`, no `types`, or an empty hook block: the corresponding block
   simply does not appear.

8. **Full-R8 — the file is self-describing and non-empty at both ends.** It opens
   with the title, the two-line blockquote summary, and the two absolute URLs
   from the format sketch, then the `## Imports` fence carrying `importSurface`
   verbatim from `agentRules.ts` (imported, not copied). It ends with a trailing
   newline. Nothing in it references specs, `Rn`, tests, or internal process.

9. **Full-R9 — tests hold the artifact against the same data it is built from.**
   `src/docs/llms.spec.ts` (server project — the filename selects it) renders
   once at module scope and asserts Full-R1/R5/R6/R7 (see Test Plan). Two
   Playwright assertions in `src/routes/landing.e2e.ts` prove the route actually
   ships. No snapshot file: a byte snapshot of a ~50-component dump fails on
   every legitimate docs edit and teaches everyone to bless it blindly.

### Responsive Behavior

Not applicable — the artifact is a plain-text file with no layout. The only new
UI is one paragraph and one `CodeBlock` inside an existing section of
`/docs/agents`, which inherits the docs shell's behaviour at all three e2e
viewports and must not introduce horizontal overflow (the URL is short enough
not to; `CodeBlock` scrolls its own content in any case).

### Accessibility

- The Agents-page addition is prose plus a `CodeBlock`, both already accessible
  components. The new paragraph sits inside the existing section, under its
  existing `aria-labelledby` heading — no new landmark, no new heading level, no
  change to focus order.
- The link to `/llms-full.txt` (if the paragraph carries one, matching the
  existing "Read it here" link) has descriptive link text naming the file, not
  "here" alone, and uses the same `target="_blank" rel="noreferrer"` treatment as
  the neighbouring `/llms.txt` and `/agents.md` links so the pattern stays
  consistent on the page.
- The artifact itself has no accessibility surface. It does carry every
  component's `a11yNote` verbatim, which is the point: an agent reading it gets
  the accessibility contract at the same moment it gets the props.
- No motion, no color, no dynamic content, so nothing to announce and nothing for
  reduced-motion to suppress.

### Edge Cases & Error States

| Case | Expected |
| --- | --- |
| A prop `type` containing `\|` (`'sm' \| 'md'`) | Escaped to `\|` in the cell; the row still has exactly four columns (Full-R6). |
| A note containing a newline | Collapsed to a single space inside the cell (Full-R6). |
| A note containing backticks (most do) | Passed through unchanged — inline code renders, and it is already the docs' vocabulary. |
| A component with no `hooks` entry (Metatags) | No `#### Styling` block; the rest of the section is complete (Full-R7). |
| A component with no `a11yNote` | No `#### Accessibility` block. |
| A `hooks` entry with `attrs` but no `props`/`parts` | Only the attributes table appears. |
| A `hooks` entry carrying a `warning` (Toggle) | One blockquote line above the tables (Full-R5). |
| A `doc.props` row naming siblings (`src / alt / thumbSrc / caption`) | Emitted verbatim as one row, exactly as the page renders it. No splitting. |
| A `types` entry (Nav items, Table columns) | Rendered as its own four-column table under its own `####` heading (Full-R5). |
| A new component added to the manifest with a data module | Appears automatically, in its group, with no edit to this feature. |
| A manifest page with **no** `componentDocs` entry | Cannot happen — `data.spec.ts` fails first. The renderer skips it rather than throwing, so a red test is the failure mode, not a build crash. |
| Tooltip (an attachment, not a component) and Icons (generated) | No special-casing: both have `componentDocs` and `hooks` entries and render like everything else. |
| A description containing `<dialog>` or other angle brackets | Emitted verbatim; `manifest.spec.ts` already bans real markup in descriptions, and plain text is plain text. |
| File size (~50 components, tens of thousands of words) | Accepted, and the point. No pagination, no per-component truncation, no size gate. |
| Fetching `/llms-full.txt` in `vite dev` | Works — it is an ordinary `+server.ts`; prerendering only changes how the build emits it. |
| Stale preview server during e2e | The known hazard: kill port 4173 after a rebuild or the new route 404s. |

### Existing Code to Reuse

- **`src/routes/llms.txt/+server.ts`** — the mechanism being copied and the code
  being moved: `export const prerender = true`, the `GET` returning a
  `text/plain; charset=utf-8` `Response`, the `SITE` constant, the `line()`
  helper, and the manifest walk (`isSection` / `isGrouped` / `sectionPages`).
- **`src/docs/agentRules.ts`** — the shape for the new module: a plain data +
  render module under `src/docs/`, consumed by both a route and a page, with a
  header comment saying why one source serves both. Also the literal source of
  `importSurface` (Full-R8) and the site of the one-line discovery edit
  (Full-R4).
- **`src/docs/manifest.ts`** — `manifest`, `isSection`, `isGrouped`,
  `sectionPages`, `ManifestPage`. The `Components` section lookup is the same
  three-line IIFE `hooks.spec.ts` and `data.spec.ts` already use; copy that
  shape.
- **`src/docs/data/index.ts`** (`componentDocs`) and **`src/docs/hooks.ts`**
  (`hooks`, `ComponentHooks`, `HookRow`) — the two registries, plus
  `PropRow` / `TypeTable` from `src/docs/PropsTable.svelte` /
  `src/docs/DocPage.svelte` for typing the walk.
- **`src/docs/data.spec.ts` and `src/docs/hooks.spec.ts`** — the test idiom to
  mirror: a `violations: string[]` array asserted `toEqual([])` so every failure
  reports at once, and coverage pinned in both directions.
- **`src/routes/landing.e2e.ts`** — the existing `llms.txt` `test.describe` block
  using `request.get(...)`, which the new assertions sit beside.
- **`src/routes/docs/agents/+page.svelte`** — the section to extend, and its
  `CodeBlock` + link treatment to match.

### Test Plan

Runners already in the repo: **Vitest** (`server` project for `*.spec.ts`,
`client`/browser for `*.svelte.spec.ts`) and **Playwright** (`src/routes/
*.e2e.ts`, preview on port 4173).

**Unit — `src/docs/llms.spec.ts` (server project), one `renderLlmsFull()` call
at module scope:**

- **Coverage, both directions (Full-R1).** Collect every `### ` heading in the
  output. It equals the manifest's `Components` page labels, in manifest order,
  with no duplicates and nothing extra — so a component cannot be missing and a
  heading cannot be invented.
- **Group headings (Full-R5).** The seven group labels appear as `## ` headings
  in manifest order.
- **Spot-check a known prop (Full-R5).** Button's section contains a row for
  `variant` with its documented default, and the section for `Skeleton` contains
  `lastLineWidth` — chosen because both are real rows in `componentDocs` today
  and would vanish on a broken walk.
- **Spot-check a known hook (Full-R5).** Button's section contains
  `Root class: \`hz-button\``, the `data-variant` attribute row, and the
  `--hz-button-accent` custom property row.
- **Import line and docs URL (Full-R5).** Every component section contains its
  `componentDocs[label].importLine` and its absolute
  `https://design.hyzer.sh<href>` URL.
- **Table integrity (Full-R6), the load-bearing one.** For every line starting
  with `|`, splitting on **unescaped** pipes yields the same column count as the
  header row above it — four for prop/type tables, three for hook tables. This is
  the single assertion that fails if a union type ships unescaped.
- **No stray newlines in cells (Full-R6).** No table row contains a literal
  newline, and none is blank between a header and its separator.
- **No styling contract (Full-R7).** The `Metatags` section exists, contains its
  props table, and contains no `Root class:` line. The whole render does not
  throw and contains no `undefined`, `null`, or `[object Object]`.
- **Header and imports (Full-R8).** The output starts with the title line,
  contains both absolute URLs, contains `importSurface` verbatim, and ends with
  exactly one trailing newline.
- **`a11yLinks` are absent (Decision 5).** A known a11y link URL (e.g. Skeleton's
  `aria-busy` MDN link) does not appear anywhere in the output.
- **Index unchanged (Full-R2).** The moved index renderer still produces the
  strings the current route produces — `# @hyzer-labs/ui`,
  `](https://design.hyzer.sh/docs)`, `## Components` — plus the new
  `llms-full.txt` line.

**e2e — `src/routes/landing.e2e.ts` (Playwright), beside the existing
`llms.txt` block:**

- `GET /llms-full.txt` returns 200 with a `text/plain` content type, and the body
  contains `# @hyzer-labs/ui`, `### Button`, `hz-button`, and
  `--hz-button-accent` — proving the file exists in the built output and carries
  a real hook, not just headings.
- `GET /llms.txt` additionally contains `https://design.hyzer.sh/llms-full.txt`
  (Full-R4's discovery link).

**Existing suites that must stay green with no edit:** `manifest.spec.ts`,
`data.spec.ts`, `hooks.spec.ts`, the docs route sweep in `docs.e2e.ts`, and the
current `llms.txt` e2e assertions.

### Out of Scope

- **An MCP server.** Planned after 0.1.0, and no part of it ships here. The only
  concession made for it is that `renderLlmsFull()` is a pure function over
  `componentDocs` / `hooks` / `manifest` with no `fs`, no SvelteKit import, and
  no `Response` — so a node MCP process can import the same three registries
  (or the renderer itself) unchanged. No tool schema, no server, no transport, no
  per-component accessor API, and no restructuring of the walk to anticipate one.
- **Per-component markdown endpoints** (`/docs/components/button.md`). A
  different artifact for a different access pattern; this spec is the one-fetch
  case.
- **Token values, motion/observers/positioning/utils signatures, and the CSS
  entry-point matrix.** v1 carries the import surface only (Decision 6). Token
  names already ship as `tokens.css` in the package the agent has installed, and
  the module APIs are one `llms.txt` link away. Revisit when an agent is
  observed getting these wrong, not before.
- **Example code, demos, or usage snippets per component.** The props, hooks and
  a11y notes are the contract; examples are the docs pages' job and would
  multiply the file size for content a model largely infers.
- **`a11yLinks`, changelogs, version numbers, or a generated-on timestamp.** A
  timestamp would make the prerendered output differ on every build for no
  reader's benefit.
- **A response header, `_headers` entry, or `robots.txt` / sitemap change.**
- **A footer link in `SiteChrome.svelte`.** The footer already carries
  `llms.txt`; two machine-file links in a human-facing footer is noise.
- **Changing what `llms.txt` contains beyond the one discovery line** (Full-R2),
  and any change to `componentDocs`, `hooks.ts`, or the manifest. Gaps this file
  exposes in that data are fixed in the data, under the audit, not here.
- **Byte snapshots of the output** (Full-R9).
