# Table — data table with sorting, selection, sticky header, stacked mode

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) as pass/fail. Write scope:
> `src/lib/components/Table.svelte` (+ spec), `src/lib/types/index.ts`
> (`TableColumn`, `TableSort`), `src/lib/components/index.ts`,
> `src/lib/theme/components/table.css` (new) + `theme.css` registration,
> `src/docs/hooks.ts`, `src/docs/manifest.ts` + `/components/table` docs
> page, `src/docs/samples/VirtualizedTable.svelte` +
> `/patterns/virtualized-table` (R11), and e2e additions. Runs after icons
> v2 (specs/36), before the docs audit (specs/38).

### Goal

The library has no way to render tabular data. Decided with the user
(2026-07-21): a generic `Table` lands **before** the docs audit, with v1
scope locked as — client-side sorting, row selection, sticky header,
built-in empty/loading states, and responsive behavior of **scroll
container by default with an opt-in stacked mode**. Real `<table>`
semantics throughout; headless like every component (structure + behavior;
the reference theme styles the hooks).

### API sketch (normative)

```svelte
<Table
  {items}                 // T[] — generic, like Carousel
  {columns}               // TableColumn<T>[]
  caption="Q3 rounds"     // string | Snippet — or ariaLabel; one required
  bind:sort               // TableSort | null (bindable)
  clientSort              // default true; false = consumer orders items
  selectable              // adds the checkbox column
  bind:selected           // SvelteSet<string> of row ids
  getRowId={(row, i) => …}// default: stringified index
  rowLabel={(row) => …}   // accessible name for per-row checkboxes
  stickyHeader
  loading loadingRows={3}
  stack="md"              // 'sm' | 'md' | 'lg' — stacked below that width
>
  {#snippet cell(row, column)}…{/snippet}   // optional; default row[column.key]
  {#snippet empty()}…{/snippet}             // optional; default "No rows"
</Table>
```

```ts
interface TableColumn<T> {
	key: string;                       // field key + column id
	header: string;                    // header cell text (also stacked label)
	sortable?: boolean;
	sortBy?: (row: T) => string | number; // default: row[key]
	align?: 'start' | 'center' | 'end';
	width?: string;                    // CSS width for the col
}
interface TableSort {
	key: string;
	direction: 'asc' | 'desc';
}
```

### Requirements

1. **R1 — Real table semantics.** Renders `.hz-table-wrap` (a div;
   `overflow-x: auto` — the default responsive answer) wrapping
   `<table class="hz-table">` with `<caption>` (visible for the string
   form, snippet renders as given), `<thead>`, `<tbody>`, `<th scope="col">`
   headers and `<th scope="row">` on the first data cell of each row.
   `caption` or `ariaLabel` is required — neither present dev-warns (the
   Tabs precedent). Explicit `role="table"/"row"/"columnheader"/"cell"`
   attributes are stamped so semantics survive the stacked mode's display
   overrides (R7).
2. **R2 — Cells.** Default cell content is `String(row[column.key])`
   (nullish → empty). The optional `cell` snippet receives
   `(row, column)` and replaces the default for every column — per-column
   customization is a `{#if column.key === …}` inside it. `align` and
   `width` emit as `data-align` and an inline width on `<col>` (a real
   `<colgroup>`).
3. **R3 — Sorting.** `sortable` columns render their header content inside
   a `<button class="hz-table-sort">` (real button, accessible name = the
   header text). Activation cycles asc → desc → asc; `aria-sort`
   (`ascending`/`descending`) sits on the `<th>` of the active column
   only. `sort` is bindable; with `clientSort` (default) the rendered
   order is `items` sorted by `sortBy ?? row[key]` — numbers numerically,
   strings via `localeCompare`, nullish last; with `clientSort={false}`
   the Table renders `items` as given and only reports/marks the sort
   state (server/external ordering). Sorting never mutates `items`.
4. **R4 — Selection.** `selectable` prepends a checkbox column: a
   header checkbox (select-all across **all** items — checked /
   unchecked / `indeterminate` for partial; accessible name "Select all
   rows") and one checkbox per row (accessible name from
   `rowLabel(row)`, falling back to the first column's cell text).
   `selected` is a bindable `SvelteSet<string>` of `getRowId` values;
   selection survives re-sorting (identity by id, not index). Selected
   rows carry `data-selected` and `aria-selected`.
5. **R5 — Sticky header.** `stickyHeader` sets `data-sticky` and the theme
   pins `thead` (`position: sticky; top: 0`) against the wrap's scroll.
   Vertical scrolling comes from the consumer capping `.hz-table-wrap`
   (documented theme hook + demo with a `max-height` class); the component
   adds no height prop.
6. **R6 — Empty and loading.** `items` empty and not loading → one
   full-width `.hz-table-empty` row rendering the `empty` snippet (default
   text "No rows"). `loading` → `aria-busy="true"` on the table and
   `loadingRows` (default 3) skeleton rows (`.hz-table-skeleton`, cells
   spanning the real columns, `aria-hidden` content); body rows and the
   empty state are suppressed while loading. Sort buttons and select-all
   are disabled while loading.
7. **R7 — Stacked mode.** `stack` (off by default) switches rows to
   stacked label/value blocks below the named width: each `td` displays
   its column's `header` as an inline label (`data-label` +
   `::before`-driven, from the theme) with the cell value beside/beneath
   it; `thead` becomes visually hidden (sr-only technique — still present
   for AT); the checkbox column stays leading. Breakpoints are **literal
   px constants mirroring the width tokens** via container query on the
   wrap — CSS cannot read custom properties in container queries; this is
   the Grid BAND precedent (specs/29), restated in the docs. The stamped
   ARIA roles from R1 keep table semantics under the display overrides.
   Sorting/selection remain fully operable in stacked mode.
8. **R8 — Theme.** `table.css` in `@layer hz-theme`, registered in
   `theme.css`: wrap scroll affordance, header row surface
   (`--hz-color-surface-muted`), row borders (`--hz-color-border`),
   density-aware cell padding (near/away scale), sort-button chrome +
   active-column indicator (chevron via `IconChevronUp`/`Down` — the
   generated core icons, specs/36), sticky header shadow-on-scroll,
   skeleton shimmer honoring `prefers-reduced-motion`, stacked-mode
   layout, `data-align` handling. Zebra striping ships as an opt-in root
   class (`hz-table--striped`), not a prop.
9. **R9 — Docs.** Manifest: **Table** in the Components → Common group.
   `/components/table` page (DocPage): props + `TableColumn`/`TableSort`
   type tables, a11y note, and Example blocks for — basic, sorting
   (client + `clientSort={false}` note), selection, sticky header inside
   a capped wrap, stacked mode, empty/loading, and a composition demo
   paging a larger dataset with `Pagination` (composition, not built-in).
   `hooks.ts` gains the Table entry (root `hz-table` + wrap; attrs
   `data-sticky`, `data-stack`, `data-selected`, `data-align`,
   `aria-sort`; parts sort/empty/skeleton/striped) — `hooks.spec.ts`
   green.
10. **R10 — A11y contract.** Keyboard: sort buttons and checkboxes are
    native controls in the tab order — no roving grid navigation (that is
    an APG *grid*; this is a static data table, and the a11y note says
    so). `aria-sort` only on the sorted column; select-all announces
    mixed state via native `indeterminate`; skeleton rows hidden from AT;
    the docs page links MDN's table accessibility guide and the APG
    sortable-table example in `a11yLinks`.
11. **R11 — Virtualized table pattern.** A new pattern (user request,
    2026-07-21): `src/docs/samples/VirtualizedTable.svelte` +
    `/patterns/virtualized-table`, following the Homepage convention
    (self-contained sample, public `$lib` imports only, `?raw` source via
    `consumerSource`). Why a pattern and not a Table feature: `Virtualizer`
    windows rows inside div viewport/sizer markup, and `<tr>` cannot live
    there — so the sample builds an **ARIA table**: `role="table"` /
    `row` / `columnheader` / `cell` on divs, a sticky header row rendered
    outside the `Virtualizer`, and the body windowed over a large
    generated dataset (≥5,000 rows, generated in the sample — no fixture
    files). Column layout is shared between header and rows (one grid
    template) so cells align; client-side sorting is composed in sample
    code to show it coexists with windowing. The sample's prose comment
    and the pattern page's lead state the tradeoff plainly (real `<table>`
    semantics vs. windowing; pick per dataset size). Manifest entry in the
    Patterns section. The Table docs page (R9) and the Virtualizer docs
    page cross-link it.

### Edge Cases & Error States

| Case | Expected |
| --- | --- |
| `items` re-assigned while sorted | Client sort re-derives; `sort` state persists; selection persists by id. |
| Column `key` missing on a row | Default cell renders empty string; no throw. |
| Duplicate `getRowId` values | Dev-warn once; selection treats them as one id (documented). |
| `sortable` column whose values are mixed types | `sortBy` accessor is the escape hatch; default compare coerces to string. |
| Select-all with zero items | Checkbox disabled. |
| `stack` with `stickyHeader` | Stacked mode wins below the breakpoint (no thead to pin); sticky resumes above it. |
| `loading` flips false with empty `items` | Empty state appears (no flash of skeleton + empty together). |
| Snippet `caption` plus `ariaLabel` | Caption wins; no double-labeling (`aria-label` omitted). |
| RTL | `align: 'start'/'end'` are logical; stacked labels follow direction. |

### Existing Code to Reuse

- Generic `items: T[]` + snippet-per-item typing — `Carousel` is the
  in-repo precedent.
- `Checkbox` is **not** reused inside Table (it's a labeled form field);
  selection uses native inputs styled by the theme's existing checkbox
  base rules — same visual, no Field wrapper. Note this in the component
  comment.
- Literal-breakpoint container queries — Grid BAND constants (specs/29).
- `SvelteSet` from `svelte/reactivity` for `selected` (bindable,
  fine-grained).
- Core icons for the sort indicator (specs/36 pipeline).

### Test Plan

**Unit:** semantics render (caption/thead/scope/roles); default + snippet
cells; sort cycle, `aria-sort` movement, numeric vs string compare,
nullish-last, `clientSort={false}` leaves order; selection — select-all
tri-state, per-row toggle, persistence across sort, `getRowId` dedupe
warn; empty vs loading precedence, `aria-busy`, skeleton count; stacked
mode stamps `data-stack` + labels; caption/ariaLabel warn path; RTL align
attrs.

**e2e:** `/components/table` renders a real table; sorting a demo column
reorders visible rows; selection updates the demo's readout; no overflow
at 375/768/1280 (scroll wrap absorbs width); stacked demo shows labels at
mobile viewport; `/patterns/virtualized-table` — rendered row elements
stay far below the dataset size (windowing proof), scrolling changes the
visible window, sort reorders within it; sweep + hooks spec green.

### Out of Scope

- Virtualized rows **in the component** — the composition ships as the
  R11 pattern instead. Column resize/reorder/pinning, expandable/grouped
  rows, multi-column sort, editable cells.
- Built-in pagination (compose `Pagination`; R9 demos it).
- Async data helpers — `loading` is a boolean, fetching is the app's job.
- APG grid keyboard navigation (interactive-grid widget ≠ data table).
