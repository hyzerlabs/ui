# 61 — Accordion `meta` snippet (summary content beyond the heading)

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. **Builds on the existing
> `Accordion.svelte` (native `<details>`/`<summary>`, heading-in-summary,
> single/multiple modes) and does not restate it.** Without `meta`, the rendered
> DOM must gain no element, wrapper, or attribute (amended 2026-08-01: Svelte's
> `{#if}` anchor comment node is accepted — it is unavoidable and unobservable
> to CSS, AT, and tests).

### Goal

Let a summary row carry **per-item content that is not part of the heading**: a
price tag, a one-line teaser, a proof line. That is the shape an agency services
section needs (title left, price right, teaser under the title). Today everything
a title snippet renders lands **inside the `<h*>`**, which makes teaser prose
part of a heading and part of the trigger's accessible name. `meta` is the
structural home for that content: visually inside the trigger, semantically
outside the heading and outside the trigger's name.

Origin (2026-08-01): consumer-site feedback. The business site's Services
section kept a hand-rolled `ServiceRow` `<details>` because Accordion's summary
(heading + icon only) could not express the design. With `meta`, `ServiceRow` can
be deleted. A companion change landed in the same feedback round: `title`
snippets now receive their item (`Snippet<[AccordionItem]>`).

### Props (new)

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| **`meta`** | **`Snippet<[AccordionItem]>`** | — | **NEW, optional.** Rendered once per item inside its `<summary>`, as a sibling **after** the heading and **before** the icon span. Receives the item, so one shared snippet serves a data-driven accordion — the `panel` precedent. An item that needs no meta simply renders nothing conditionally. |

`meta` is component-level (like `panel`), **not** a per-item `AccordionItem`
field. The data-driven case is the whole reason it exists, and that case wants
one snippet closing over nothing but its argument. Per-item variation still
works: branch inside the snippet with `{#if}` on item fields.

### Requirements

**R1 — Render slot + hook.** With `meta` provided, each summary renders
`<div class="hz-accordion-meta">{@render meta(item)}</div>` between the heading
element and `.hz-accordion-icon`. Structural CSS only: the wrapper participates
in the existing summary flex row. All visual layout (right-aligned price, teaser
under the title, wrapping) is theme or consumer CSS on `.hz-accordion-meta`.
Without `meta`, no wrapper element and no new attributes render (the `{#if}`
anchor comment is accepted — see the contract note above).

**R2 — Accessible name stays the heading.** With `meta` provided, the summary's
accessible name must be the heading's text alone, not everything in the summary
concatenated. Give the heading element a stable generated `id` and set
`aria-labelledby` on the `<summary>` pointing at it. Both attributes appear
**only when `meta` is provided** (R1's no-new-attributes rule).

Rationale: name from contents over a summary would fold the price and teaser
into every announcement of the trigger, which is verbose and a WCAG 2.4.6
(Headings and Labels) quality failure. An `aria-hidden` meta is worse: it would hide real information (the
price) from AT entirely. `aria-labelledby` names the control from the heading
while the meta content stays in the accessibility tree as content.

**R3 — Meta is supplementary, and the docs must say so.** Because the trigger
announces as its heading, a screen-reader user operating by trigger name never
hears the meta content at that moment. The docs note (R5) must state this:
content a user *needs* in order to decide whether to expand, not just content
that entices, belongs in the panel or the heading. `meta` then carries the
visual-forward presentation of it. Never let meta be the only home of an
essential fact.

**R4 — No behavior changes.** Toggle, keyboard nav (arrows/Home/End between
summaries), `disabled`, `single`/`multiple`, `onToggle`, and the icon are
untouched. A click landing on meta content behaves exactly like a click on any
other part of the summary (native `<summary>` activation; no stopPropagation).

**R5 — Docs.** The Accordion docs page gains three things: the `meta`
prop-table row; a services-shaped Example (string or snippet titles, plus a
shared `meta` snippet rendering a price and a teaser line, plus `panel` carrying
the full description — which MUST repeat the price, dogfooding R3's rule); and
the R3 note in consumer framing.
The existing `title` note (heading = accessible name, keep it to a label) stays
and links the two: "put teaser prose and prices in `meta` or the panel."

**R6 — Tests.** Unit specs: (a) meta renders per item with item data, sibling
order heading → meta → icon; (b) `aria-labelledby` on the summary resolves to
the heading id, and neither attribute exists without `meta`; (c) no-meta DOM
unchanged (existing structure test keeps passing); (d) clicking inside meta
toggles the item.

### Edge cases

| Case | Expected |
| --- | --- |
| `meta` + string title | Works — meta does not require a snippet title. |
| Item where the snippet renders nothing | Empty `.hz-accordion-meta` wrapper is acceptable; no layout footprint beyond the flex item. |
| `disabled` item | Meta renders; summary keeps `aria-disabled` and blocks toggle as today. |
| Snippet reads a field only some items have | Consumer's `{#if}` — the component renders whatever the snippet yields. |
| Multi-line meta wrapping under a long title | Theme concern; structural CSS must not force `nowrap`. |
