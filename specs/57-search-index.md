# search-index.json — one search layer, richer palette results

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Search-Rn`) and edge case as pass/fail. Write scope: one new docs
> module (`src/docs/searchIndex.ts`) + its spec (`src/docs/searchIndex.spec.ts`,
> **server** project), one new route (`src/routes/search-index.json/+server.ts`),
> a rewrite of `src/docs/CommandPalette.svelte`'s data intake and result line,
> the matching edits to `src/docs/CommandPalette.svelte.spec.ts`, the deletion of
> the hand-rolled `searchItems` walk in `src/routes/docs/+layout.svelte`, new
> assertions in `src/routes/docs.e2e.ts`, and one word in one manifest
> description (Search-R9).
>
> **No change to `componentDocs` or `hooks.ts`.** This spec adds a second reader
> of those registries, not a third source. It also does not touch
> `src/docs/samples/CommandPalette.svelte` — the Patterns page ships a
> deliberately separate, self-contained sample (Out of Scope).

### Goal

Make the docs search find things that are not page titles. Today the palette
filters `context + label` with one `includes()`, so "gap", "aria-busy",
"--hz-logo-color" and "dark mode" find nothing. Ship one derived search index —
page records with their manifest description, one record per `h2`/`h3` section
of every prose page, and the prop / styling-hook vocabulary of every component —
as a prerendered `search-index.json` the palette fetches the first time it opens,
plus a small fielded scorer both the palette and a later MCP `search_docs` tool
call unchanged. Last feature before the 0.1.0 publish.

### Context & Conventions

- **Everything it indexes already exists and is already policed.** `data.spec.ts`
  holds every documented prop name against component source; `hooks.spec.ts`
  holds every root class, `data-*`, `--hz-*` and part class against source and
  theme, both directions; `manifest.spec.ts` holds labels and descriptions. Zero
  new authoring — that is what makes a fielded index safe.
- **The precedent is `src/docs/llms.ts` → `/llms.txt` + `/llms-full.txt`**
  (specs/56): a pure module under `src/docs/` with no `fs`, no `$app/*`, no
  SvelteKit import and no `Response`, wrapped by a thin prerendered route. This
  feature takes the same posture for the same reason — a node process that is not
  SvelteKit has to be able to import it later.
- **Consumer-facing copy rules** apply to every string a reader sees: the
  palette's placeholder, its empty/loading/unavailable lines, and the `›`
  separator. No spec numbers, no `Rn`, no internal process language.
- **Component pages have no headings of their own.** `DocPage.svelte` emits the
  same five (`Import`, `Demo`, `Props`, `Theme hooks`, `Accessibility`) for every
  component, so heading records would be 50 copies of the same noise. Components
  are indexed by field instead; prose pages are indexed by section. That split is
  the whole design.

### Decisions (settled — do not re-litigate)

1. **A prerendered route, not a gen script, not a post-build scan.**
   `src/routes/search-index.json/+server.ts` with `export const prerender = true`,
   mirroring the two `llms` routes. adapter-static emits it as a real file beside
   them; nothing new to commit, no drift test, no extra step in the deploy
   command, and it works identically in `vite dev`. A `scripts/gen-search-index.ts`
   would commit a ~60 kB generated artifact somebody has to remember to
   regenerate; a post-build scan of `build/` would add a pipeline step that only
   exists in CI and 404s in dev.

2. **Headings are parsed from page source at prerender time.** The route passes
   `import.meta.glob('/src/routes/docs/**/+page.svelte', { query: '?raw', import: 'default', eager: true })`
   into the builder, which is otherwise pure (Search-R2). A prerendered route
   cannot read a sibling route's prerendered HTML — the emit order is not defined
   — and the source is the honest input anyway: an anchor in the index is an
   anchor a page author typed. Drift is closed from the other end, in the e2e
   sweep, which resolves every indexed anchor against the rendered page
   (Search-R11) — that is the no-fiction test, and it is the reason source
   parsing is acceptable here.

3. **A heading counts if it carries a literal `id`.** Demo and sample markup in
   these pages never does (`<h2>Projects</h2>` in the spacing demo, the card
   titles, the heading strings inside code fences), and every real section
   heading does, because the section it labels points at it with
   `aria-labelledby`. Headings whose `id` or text contains `{` are skipped: the
   Example Themes page generates three in an `{#each}`, and a fabricated anchor is
   worse than a missing one. Those three pages stay findable through their label
   and description.

4. **Component fields live on the component's page record as two string arrays,
   not as one record per field.** ~1,080 prop and hook names across 50 components
   would be ~1,080 near-identical records, and a query for `variant` or `size`
   would return the same word twenty times over. Two arrays keep the index small,
   keep one result per component, and still give the right anchor: a prop hit
   links to `#props-heading`, a hook hit to `#hooks-heading` — both fixed by
   `DocPage.svelte` for every component page.

5. **No shared walker with `renderLlmsFull()`.** Both walk the manifest's
   `Components` section and read `componentDocs` / `hooks`; that walk is ten
   lines and four files in this repo already write it (`llms.ts`, `data.spec.ts`,
   `hooks.spec.ts`, `llms.spec.ts`). One renders markdown tables, the other
   collects names. Extracting a shared walker for two callers buys an
   indirection nobody asked for.

6. **The palette fetches, and has no seed.** `load()` is called once, on first
   open, and its result is the index. Importing `componentDocs` into the layout
   for a synchronous fallback would pull all fifty data modules into the shell
   bundle on every docs page — exactly the cost this feature is avoiding. The
   fetch is one local JSON file behind a deliberate click; a query typed before it
   lands gets one short line, and a failed fetch gets another (Search-R8).

7. **One flat ranked list, no result grouping.** The `›` in a result line already
   says whether a hit is a section or a field. Grouping would mean ordering the
   groups, which fights the ranking that is the point of the feature, and would
   turn a flat `listbox` into a grouped one for no gain.

8. **Substring and word-boundary only.** No fuzzy matching, no stemming, no
   typo tolerance, no full text. ~220 records at this scale reward fielded
   structure, not a bag of words, and every extra trick costs a dependency or a
   pile of tuning nobody can test.

### Index schema (normative)

```ts
export interface SearchRecord {
	/** 'page' — a docs page. 'heading' — one h2/h3 section of a prose page. */
	kind: 'page' | 'heading';
	/** The page label, or the heading's own text. */
	label: string;
	/** Breadcrumb: 'Foundation', 'Components · Forms', '' for standalone pages. */
	context: string;
	/** The route; heading records carry '#anchor' too. */
	href: string;
	/** The owning page's label. Heading records only. */
	page?: string;
	/** The manifest description. Page records only. */
	description?: string;
	/** Prop names, including supporting-type rows. Component pages only. */
	props?: string[];
	/** Root class, data-*, --hz-* and part names. Component pages only. */
	hooks?: string[];
}
```

One resolved result:

```ts
export interface SearchHit {
	/** 'Colors & Intent' · 'Utilities › Color utilities' · 'Logo › --hz-logo-color' */
	label: string;
	context: string;
	/** Route, with the anchor the hit earned. */
	href: string;
	score: number;
	record: SearchRecord;
}

export function searchDocs(index: SearchRecord[], query: string, limit?: number): SearchHit[];
```

Record order in the JSON is manifest order: for each page, its page record, then
its heading records in source order. That order is the scorer's tie-break, so it
is load-bearing, not cosmetic.

### Requirements

1. **Search-R1 — `src/docs/searchIndex.ts` is the module; the route is thin.** It
   exports `SearchRecord`, `SearchHit`, `buildSearchIndex()`, and `searchDocs()`.
   No `fs`, no `$app/*`, no `@sveltejs/kit`, no `Response`, no `import.meta.glob`
   — the glob lives in the route and the sources arrive as an argument, so the
   module imports cleanly into a plain vitest server test today and a node
   process later. `src/routes/search-index.json/+server.ts` is
   `export const prerender = true`, the glob, and a `GET` returning
   `JSON.stringify(buildSearchIndex(sources))` with
   `content-type: application/json`. No load function, no params, no caching
   header.

2. **Search-R2 — `buildSearchIndex(sources: Record<string, string>): SearchRecord[]`,
   derived, never authored.** It walks the manifest in order and emits, per page:

   - **A page record** — `kind: 'page'`, the manifest `label`, `href`, and
     `description`, and the breadcrumb `context` the layout builds today
     (`'Foundation'`, `'Components · Forms'`, `''` for standalone pages).
   - **`props` / `hooks` arrays**, for pages in the `Components` section only,
     from `componentDocs[label]` and `hooks[label]`: every `props[].name` plus
     every `types[].props[].name`; the `root` class plus every `attrs[]`,
     `props[]` and `parts[]` name. Deduplicated, source order preserved. Either
     array is omitted when empty (Metatags has no hooks entry).
   - **Heading records** — for pages **outside** the `Components` section only,
     one per `h2`/`h3` in that page's source that carries a literal `id`
     (Decision 3), with `label` = the heading's text, `href` = `<page href>#<id>`,
     `page` = the page label, and the page's breadcrumb as `context`.

   No component name, prop, hook, page label, description, route or heading text
   appears literally in the module. The only literal strings it contains are the
   two skipped generic heading names (Search-R4) and the breadcrumb separator.

3. **Search-R3 — heading text is cleaned, not reproduced.** From the raw source
   match: inner tags are stripped (`<h2 id="class-heading">The <code>class</code>
   prop</h2>` → `The class prop`), the five HTML entities that appear in these
   pages are decoded (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`), whitespace runs
   collapse to one space, and the result is trimmed. A heading whose `id` or text
   still contains `{`, `<`, or `>` after cleaning is skipped entirely rather than
   indexed with markup in it.

4. **Search-R4 — the two generic section headings are skipped.** `Demo` and
   `Source` label the same two blocks on eleven Patterns pages and would be the
   noisiest twenty-two records in the index. They are skipped by exact text
   match, with a comment saying why. Nothing else is filtered: `Requirements`,
   `Overview` and `Accessibility` are real, page-specific sections.

5. **Search-R5 — `searchDocs(index, query, limit = 20)`, the one scorer.** The
   query is lowercased, trimmed and split on whitespace. A record matches only if
   **every** query token matches somewhere in it (AND). A token's score in one
   record is the best it achieves over these fields:

   | Field | Base |
   | --- | --- |
   | `label` of a `page` record | 100 |
   | `label` of a `heading` record | 70 |
   | any entry in `props` or `hooks` | 50 |
   | `description` | 30 |
   | `context` | 10 |

   plus a match-quality bonus on that same field: `+40` when the token equals the
   field value case-insensitively, `+20` when it starts the field or starts a word
   inside it (preceded by a non-alphanumeric character — so `color` scores the
   bonus in `--hz-logo-color` and in `ColorInput`), `+0` for any other substring.
   A record's score is the sum over tokens. Results sort by score descending,
   ties broken by index order (a stable sort over the index array is enough).
   An empty or whitespace-only query returns `[]`.

6. **Search-R6 — one hit per record, resolved to what the reader sees.** The
   highest-scoring field decides the hit's shape:

   | Winning field | `label` | `href` |
   | --- | --- | --- |
   | page `label`, `description`, `context` | the page label | the page href |
   | heading `label` | `<page> › <heading>` | the page href with its anchor |
   | a `props` entry | `<page> › <prop name>` | page href + `#props-heading` |
   | a `hooks` entry | `<page> › <hook name>` | page href + `#hooks-heading` |

   `context` on the hit is always the record's breadcrumb, so a heading hit reads
   `Contrast & Accessibility › Text on surfaces` over `Foundation`. A record
   never yields two hits, and the returned array is capped at `limit`.

7. **Search-R7 — the palette takes a loader, not a list.**
   `src/docs/CommandPalette.svelte` replaces its `items: CommandItem[]` prop with
   `load: () => Promise<SearchRecord[]>`, called **once**, the first time the
   palette opens (the modal trigger, or `⌘K` / focus in inline mode) and never on
   mount. `CommandItem` is deleted; `SearchRecord` is imported from
   `searchIndex.ts`. Filtering becomes one `searchDocs(index, query, limit)` call
   — no second scoring path in the component. `limit` defaults to `20`. Each
   option renders the hit's `label` on the first line and its `context` on the
   second, exactly as today. `src/routes/docs/+layout.svelte` deletes its
   `searchItems` walk and passes
   `load={() => fetch('/search-index.json').then((r) => r.json())}`; `onSelect`,
   `mode`, `placeholder` and `shortcut` are unchanged.

8. **Search-R8 — three states in the one results slot.** The panel below the
   field shows exactly one of:
   - **Loading** — a query is typed while the fetch is still in flight:
     `Loading search…`
   - **Unavailable** — the fetch rejected or returned a non-OK response:
     `Search is unavailable right now. Use the navigation to browse.` The failure
     is not retried on every keystroke; one attempt per page load.
   - **Empty** — the index is loaded and nothing matched: today's
     `No matches for "…"`, unchanged.

   All three use the existing `.cmd-empty` treatment. Nothing is logged to the
   console and no error is thrown into the page.

9. **Search-R9 — one word in one description.** `Contrast & Accessibility`'s
   manifest description opens `WCAG contrast ratios for every graded token
   pairing`; the page is entirely about color contrast, and the word "color" does
   not appear anywhere in its label, headings or description, so the site's
   color-contrast page is unfindable by searching `color`. Change `token pairing`
   to `color pairing` in `src/docs/manifest.ts`. That is the whole edit — no
   other description, label or heading changes in this spec.

10. **Search-R10 — nothing is fetched until the palette opens.** No import of
    `searchIndex.ts`'s builder, `componentDocs` or `hooks` reaches the docs shell
    bundle, and no request for `/search-index.json` is made during initial page
    load or navigation. The first request happens on the first open, and there is
    exactly one for the life of the page.

11. **Search-R11 — every anchor in the index is an anchor on the page.** Held by
    the e2e route sweep, not by the builder: for each manifest route, every
    heading record the index carries for that route resolves to an element with
    that `id` whose text equals the record's `label`. This is the test that makes
    source parsing honest, and it is the one that fails if a page renames a
    section.

12. **Search-R12 — the index stays small.** `JSON.stringify(buildSearchIndex(…))`
    is under 120 kB, asserted in the unit spec. At ~90 page records, ~110 heading
    records and ~1,080 field names it lands near 60 kB (well under 20 kB over the
    wire), and the assertion exists to catch a walk that accidentally starts
    carrying note text or values.

### Responsive Behavior

No layout change. The palette keeps the shape it has: a modal at every width in
the docs shell, `min(92vw, 34rem)` wide, results capped at `min(24rem, 60vh)`
with their own scroll.

- **Mobile (<640px)** — the trigger lives in the sidebar drawer, reached through
  the hamburger, and the modal is near-full-width. Result lines are the one thing
  this feature makes longer: `Logo › --hz-logo-color` and
  `Contrast & Accessibility › Text on surfaces` must not push the panel wider
  than the viewport. Both option lines wrap or ellipsize within the option; no
  horizontal scrollbar appears on the document at 375px with results showing
  (the existing e2e assertion covers this and must keep passing with a query that
  now returns long labels).
- **Tablet (640–1024px)** and **desktop (>1024px)** — unchanged; the sidebar
  trigger is visible directly and the modal is centred at its `34rem` cap.
- The result cap of 20 (down from 50) shortens the panel at every width; nothing
  else about the panel's sizing changes.

### Accessibility

- **The combobox contract is unchanged.** `role="combobox"` with
  `aria-expanded`, `aria-controls`, `aria-activedescendant` and
  `aria-label="Search documentation"`; the `role="listbox"` and its
  `role="option"` children with `aria-selected`. Nothing about the roles, the
  ids, or the modal's `aria-modal`/`aria-label` changes.
- **Keyboard behavior is unchanged.** ArrowDown / ArrowUp wrap through results,
  Enter selects the active one, first Escape clears the query and the second
  closes (modal) or blurs (inline), `⌘K` / `Ctrl+K` opens or focuses. No new key
  binding, no new focus stop — in particular the richer result line adds no
  interactive element inside an option.
- **The live region keeps announcing the count.** The existing
  `aria-live="polite"` "N results" region stays, and now also announces the two
  new states: a screen-reader user typing before the index lands hears the
  loading line, and one whose fetch failed hears the unavailable line, rather
  than silence or a false "0 results".
- **The result line is one accessible name.** `Logo › --hz-logo-color` reads as
  the option's name; `›` is ordinary text inside the option, not a separate
  element, so the option's name stays a single string for `aria-activedescendant`
  to point at.
- **Contrast.** The second line keeps `--hz-color-text-muted` on
  `--hz-color-surface`, already graded AA on the contrast page; no new color.
- **Motion.** Nothing animates that did not animate before; there is no spinner
  for the loading state, only text, so reduced-motion needs no new handling.

### Edge Cases & Error States

| Case | Expected |
| --- | --- |
| Query typed before the fetch resolves | `Loading search…` in the results slot; results replace it as soon as the index lands, with the typed query applied (Search-R8). |
| `/search-index.json` 404s or the fetch rejects | `Search is unavailable right now. Use the navigation to browse.` One attempt, no retry loop, no console noise, no thrown error. |
| The palette is opened, closed, and reopened | One fetch total. The index is kept for the life of the page. |
| Empty / whitespace-only query | No listbox, no empty state — today's behaviour (Search-R5). |
| Query matching nothing (`zzzznope`) | `No matches for "zzzznope"`, unchanged. |
| A query token matching only the breadcrumb (`forms`) | Every `Components · Forms` page still returns, scored lowest (context, base 10) — today's behaviour, preserved by the existing unit test. |
| Multi-word query (`color input`, `dark mode`) | AND across tokens: `color input` finds ColorInput (both tokens in the label); `dark mode` finds the Colors page's `Dark mode` heading. A record matching only one token is excluded. |
| A query matching a component's prop and hook (`size`) | One hit per component, taking the higher-scoring field's anchor (Search-R6). |
| A page with no headings carrying ids | Contributes its page record only. No empty array, no placeholder record. |
| A Patterns page (`Demo` + `Source` only) | Page record only; both headings skipped (Search-R4). |
| The Example Themes page's `{#each}` headings | Skipped (Decision 3). The page stays findable by label and description, which name Ocean, Docs and Terminal. |
| A heading containing inline `<code>` or `&amp;` | Indexed as plain text: `The class prop`, `Theme conventions: Card treatments & titles` (Search-R3). |
| A demo heading that grows an `id` later | Would be indexed. The anchor is real, so the link works and Search-R11 still passes; the cost is one noisy result, and the fix is to drop the `id` or give the demo its own heading text. |
| A `+page.svelte` under `/docs` with no manifest entry | Its headings are dropped — heading records are emitted while walking the manifest, so an unlisted page is never reached. |
| Metatags (no `hooks` entry) | Page record with `props` and no `hooks` array. No `undefined` in the JSON. |
| A component page whose `props` and `hooks` are both absent | Page record identical to a prose page's. No throw. |
| A prop or hook name appearing in twenty components (`variant`) | Twenty hits, one per component, ordered by manifest order after score. Capped at 20 by `limit`. |
| `/search-index.json` in `vite dev` | Works — it is an ordinary `+server.ts`; `prerender` only changes how the build emits it. |
| Stale preview server during e2e | The known hazard: kill port 4173 after a rebuild or the route 404s and every palette test fails at once. |
| The Patterns command-palette sample | Untouched. It is a separate component with its own hard-coded items (Out of Scope). |

### Existing Code to Reuse

- **`src/docs/llms.ts`** — the module shape being copied: pure functions under
  `src/docs/`, a header comment saying why one source serves several consumers,
  and the manifest walk (`isSection` / `isGrouped` / `sectionPages` /
  `ManifestGroupedSection`) including the `Components` section lookup. Copy the
  walk; do not refactor `llms.ts` to share it (Decision 5).
- **`src/routes/llms-full.txt/+server.ts`** — nine lines, and the exact shape the
  new route takes.
- **`src/docs/manifest.ts`** — `manifest`, `isSection`, `isGrouped`,
  `sectionPages`, `allRoutes`, `ManifestPage`. Also the site of the one-word edit
  in Search-R9.
- **`src/routes/docs/+layout.svelte`** — the `searchItems` walk being deleted is
  the definition of the breadcrumb `context` string (`'Components · Forms'`,
  `entry.label`, `''`); move that logic into `buildSearchIndex`, separator
  included, rather than inventing a second format.
- **`src/docs/data/index.ts`** (`componentDocs`, `ComponentDoc`),
  **`src/docs/data/types.ts`**, **`src/docs/hooks.ts`** (`hooks`,
  `ComponentHooks`, `HookRow`) and **`PropRow`** from
  `src/docs/PropsTable.svelte` — the registries and their types.
- **`src/docs/DocPage.svelte`** — the source of the two fixed anchors component
  hits link to (`props-heading`, `hooks-heading`). If those ids ever change, they
  change in one place and Search-R11 catches it.
- **`src/docs/CommandPalette.svelte`** — keep everything except the `items` prop
  and the `results` derivation: the `uid()` ids, the keyboard handler, the
  inline/modal split, the fixed-position measuring, the live region, and the
  whole `<style>` block.
- **`src/docs/llms.spec.ts`, `src/docs/data.spec.ts`, `src/docs/hooks.spec.ts`** —
  the test idiom: render/build once at module scope, collect a
  `violations: string[]` and assert `toEqual([])` so every failure reports at
  once.
- **`src/routes/landing.e2e.ts`** — the `request.get(...)` block for `llms.txt`,
  which the JSON route's assertions sit beside.
- **`src/routes/docs.e2e.ts`** — the existing command-palette `test.describe`
  block (open → type → Enter → URL), the 375px overflow test, and the
  `allRoutes` sweep that Search-R11's assertion hangs off.

### Test Plan

Runners already in the repo: **Vitest** (`server` project for `*.spec.ts`,
`client`/browser for `*.svelte.spec.ts`) and **Playwright**
(`src/routes/*.e2e.ts`, preview on port 4173).

**Unit — `src/docs/searchIndex.spec.ts` (server project).** Build once at module
scope, feeding `buildSearchIndex` the same
`import.meta.glob('/src/routes/docs/**/+page.svelte', { query: '?raw', … })`
the route uses (vitest runs through Vite, so the glob resolves).

- **Page coverage, both directions (Search-R2).** The `href` of every `kind:
  'page'` record equals `allRoutes`, in manifest order, no duplicates, nothing
  extra.
- **Route integrity (Search-R2).** Every record's `href`, with any `#…` stripped,
  is in `allRoutes`.
- **Field coverage, both directions (Search-R2).** For every component page:
  every `componentDocs[label]` prop name (including `types[].props[]`) appears in
  that record's `props`, and every name in `props` comes from that component's
  doc entry; the same in both directions for `hooks[label]`'s root, `attrs`,
  `props` and `parts`. `violations: string[]`, asserted `toEqual([])`.
- **No component headings (Search-R2).** No `kind: 'heading'` record has an
  `href` starting `/docs/components/`.
- **Heading spot checks (Search-R2/R3).** `/docs/foundation/colors#roles-heading`
  is present with the label `Semantic roles & intent`;
  `/docs/theming/components#class-heading` with `The class prop` (tags stripped);
  `/docs/foundation/utilities#text-utilities-heading` with `Color utilities`.
- **Generic headings skipped (Search-R4).** No record has the label `Demo` or
  `Source`.
- **No fabricated markup (Search-R3).** No record's `label` or `href` contains
  `{`, `<`, `>`, `&amp;`, or a newline.
- **Size (Search-R12).** `JSON.stringify(index).length` is under 120,000.
- **Purity (Search-R1).** The module's source contains no `import.meta.glob`, no
  `$app/`, no `@sveltejs/kit`, no `node:` import. (Read the file, assert the
  strings are absent — the same shape as the existing "no fiction" source
  checks.)

**Unit — the scorer, in the same file (Search-R5/R6):**

- **The pinned ranking.** `searchDocs(index, 'color')`:
  - `hits[0].label` is `Colors & Intent` and `hits[1].label` is `ColorInput` —
    both page labels, tie broken by manifest order.
  - `Utilities › Color utilities` is present, ranks third, and ranks above every
    hit whose match is a field name or a description.
  - `Contrast & Accessibility` and `Tokens & Overrides` are both present (they
    match on description — the first only after Search-R9's one-word edit, which
    this assertion therefore also guards).
  - `Logo › --hz-logo-color` is present, and every field-name hit ranks below
    every heading hit.
  - No two hits share a `record`.
- **Anchors (Search-R6).** A prop hit's `href` ends `#props-heading`, a hook
  hit's ends `#hooks-heading`, a heading hit's ends with that heading's id, and a
  page hit's has no `#`.
- **Word boundary beats mid-word (Search-R5).** `searchDocs(index, 'gap')` puts
  components whose hook is `--hz-stack-gap` above any record where `gap` only
  appears inside a longer word in a description.
- **Multi-word AND (Search-R5).** `dark mode` returns the Colors page's
  `Dark mode` heading; `color input` returns `ColorInput` first; `color zzzznope`
  returns `[]`.
- **Empty query (Search-R5).** `''` and `'   '` return `[]`.
- **Cap (Search-R5).** `searchDocs(index, 'a', 5)` returns at most 5.

**Component — `src/docs/CommandPalette.svelte.spec.ts` (client project).** The
fixture becomes a small `SearchRecord[]` (a page record, a component record with
`props`/`hooks`, a heading record) and `load` a stub resolving it.

- **Every existing test keeps its assertion**, rewritten only where it passes
  `items`: combobox roles, arrow-key wrap, Enter selects, click selects, Escape
  clears then closes, empty state, `⌘K`, and the whole modal-mode block.
- **`load` is called once, and not on mount (Search-R7/R10).** The stub is not
  called after `render`; it is called after the first open; it is not called
  again after close-and-reopen.
- **A field hit renders as `Page › name` and carries the anchor (Search-R6).**
  Typing a prop name from the fixture yields one option reading `… › …` whose
  selection calls `onSelect` with an `#props-heading` href.
- **Loading state (Search-R8).** With a `load` that never resolves, typing shows
  `Loading search…` and no listbox.
- **Unavailable state (Search-R8).** With a rejecting `load`, typing shows the
  unavailable line, and a second keystroke does not call `load` again.

**e2e — `src/routes/docs.e2e.ts` (Playwright):**

- **Ranking, end to end (Search-R5).** Open the palette on `/docs`, type `color`,
  and assert the first two options are `Colors & Intent` and `ColorInput` and
  that an option containing `Color utilities` appears above one containing
  `--hz-logo-color`.
- **A field hit navigates to the right anchor (Search-R6).** Type a hook name,
  press Enter, assert the URL ends `#hooks-heading` and that the Theme hooks
  heading is in view.
- **No request before opening (Search-R10).** Listen for requests on
  `/docs/components/button`; assert none matches `search-index.json` after load
  settles, exactly one after the trigger is clicked, and still exactly one after
  closing and reopening.
- **No fiction (Search-R11).** In the `allRoutes` sweep, for each route, for each
  heading record the index carries for that route, assert an element with that
  id exists and its trimmed `textContent` equals the record's label. The index is
  fetched once via `request.get('/search-index.json')` at the top of the block.
- **Existing palette tests stay green untouched**, including the 375px
  no-horizontal-overflow test.

**e2e — `src/routes/landing.e2e.ts` (Playwright):**

- `GET /search-index.json` returns 200 with a JSON content type, parses to an
  array, and contains a record whose `href` is `/docs/components/button` carrying
  `variant` in `props` and `hz-button` in `hooks` — proving the file is in the
  built output and carries real field data, not just labels.

**Existing suites that must stay green with no edit:** `manifest.spec.ts`,
`data.spec.ts`, `hooks.spec.ts`, `llms.spec.ts`, and the docs route sweep.

### Out of Scope

- **The MCP server.** Planned after 0.1.0; none of it ships here. The only
  concession is Search-R1's module boundary: `buildSearchIndex(sources)` takes
  its sources as an argument and `searchDocs(index, query, limit)` is pure, so a
  node process can read the same files with `fs`, or fetch the shipped JSON, and
  call the identical scorer. No tool schema, no transport, no server.
- **`src/docs/samples/CommandPalette.svelte` and the Patterns page it powers.**
  A deliberately separate, self-contained demo of the pattern; it keeps its own
  hard-coded items and must not gain a fetch, a scorer, or a shared type.
- **Full-text indexing.** Page body prose, code fences, table cells, prop notes,
  hook values and a11y notes are all unindexed. Fielded structure is the bet
  (Decision 8); revisit if a real query is observed failing that only body text
  could answer.
- **Fuzzy or typo-tolerant matching, stemming, synonyms, and ranking by
  popularity or recency.** Substring plus word boundary, and nothing else.
- **Search analytics, a query log, or a "no results" report.**
- **A dedicated `/docs/search` results page, URL-persisted queries, or deep
  linking into a query.** The palette is the only surface.
- **Highlighting the matched substring inside a result line.**
- **Recent searches, favourites, or any client-side persistence.**
- **Indexing `/` (the landing page), `/agents.md`, `llms.txt` or `llms-full.txt`.**
  The index covers manifest pages, which is what the palette navigates to.
- **Changing `componentDocs`, `hooks.ts`, or any manifest field other than the
  one word in Search-R9.** A gap this feature exposes in that data is fixed in the
  data, under the audit, not here.
- **A response header, `_headers` entry, sitemap or `robots.txt` change**, and a
  footer link to the JSON — it is machinery, not a destination.
