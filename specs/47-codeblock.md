# CodeBlock Component Spec

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`CodeBlock-Rn`) and edge case as pass/fail. Write scope is the
> library source (`src/lib/**`) plus the docs additions and the docs-wide
> rename named in CodeBlock-R13/R14/R15, and the docs-only highlighter wiring in
> CodeBlock-R17/R18.

### Goal

Promote the private docs-only code viewer (`src/docs/CodeBlock.svelte`) into a
**shipped, public, headless Svelte 5 `CodeBlock` component**, exported from the
package root and usable as `import { CodeBlock } from '@hyzer-labs/ui'`. The
shipped component is a strict **superset** of the private one — every current
prop (`code`, `collapsible`, `collapsedLines`) keeps its name and behaviour, so
the ~30 existing docs call sites keep working after a mechanical re-point — and
adds a `title` header bar, opt-in `lineNumbers`, a `copyable` toggle, and
**first-class syntax-highlighter compatibility with zero highlighter dependency
in the shipped package**. Highlighting is always **bring-your-own**, via two
composable paths, and the docs demonstrate one live example of each:

- **Pre-highlighted content (build-time highlighters — Shiki).** An optional
  `children` snippet renders pre-rendered highlighted HTML in place of the
  default code node (CodeBlock-R19), so a consumer running Shiki (or any
  build/prerender highlighter that emits HTML) drops the result straight in. The
  docs demo runs Shiki at **prerender** (CodeBlock-R17).
- **The `language` class hook (client autoloaders — Prism / highlight.js).**
  `language` stamps `class="language-<lang>"` on the default `<code>`, the exact
  hook a client-side autoloader decorates after mount (CodeBlock-R7). The docs
  demo runs **Prism** live in the browser (CodeBlock-R17).

By default the component renders plain, token-styled monospace: SSR-safe, **no
runtime dependency**, `code` as the required source of truth for copy, line
count, and the gutter. The private component is **deleted** and the docs site
dogfoods the shipped one.

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. One component file
  `src/lib/components/CodeBlock.svelte`, exported from the barrel
  (`src/lib/components/index.ts`); smoke assertion in `src/lib/exports.spec.ts`.
- **Headless / theme split (the house architecture).** Structure, behaviour, and
  ARIA live in the `.svelte`; **all visual styling** (background, border, radius,
  padding, font sizing, the collapse fade, the gutter colour, the language tag
  chrome, the copy-button fill) lives in a new
  `src/lib/theme/components/code-block.css` inside `@layer hz-theme`. Only
  **layout and positioning** (flex, `position`, the collapse clip mechanics,
  `user-select`, the focusable region) stay in the component's own scoped
  `<style>` — the Banner/Toc precedent (`Banner-R8`/`R9`; `toc.css` header). One
  deliberate exception (CodeBlock-R9): the `<pre>` box presentation lives in the
  theme sheet so it reaches `children`-supplied markup, which Svelte scoped
  styles cannot. Consumers style via the documented `data-*` / part classes /
  `--hz-*` hooks (CodeBlock-R10).
- **Root class is `hz-code-block`** (the `hz-` prefix every shipped component
  carries; hooks.spec asserts the root class appears in source). The private
  component's root class was `.code-block`; the rename to `.hz-code-block` is
  part of the promotion, and `Example.svelte`'s chrome-stripping selector
  re-points with it (CodeBlock-R12).
- **Composition.** Reuse the library `<Button>` for the copy and expand controls,
  exactly as the private component does today (Dropdown/Pagination compose Button
  the same way). Reuse `uid` from `$lib/utils` for the clip / title ids, `cx` for
  the root class, and `type Snippet` from `svelte` for `children`.
- **Kebab route + file naming.** The docs route is `/components/code-block` and
  the theme sheet is `code-block.css`, following the house kebab convention for
  multi-word names (`text-input`, `file-upload`, `range-slider`). The manifest
  **label**, the `hooks.ts` **key**, the `componentDocs` **key**, and the
  component **file stem** are all `CodeBlock` (the label-is-key-is-filestem
  convention `hooks.spec.ts` / `data.spec.ts` enforce).
- **The library never depends on a highlighter.** No highlighting engine
  (`shiki`, `@shikijs/*`, `prismjs`, `prism`, `highlight.js`) may be a
  `dependency` or `peerDependency` of `@hyzer-labs/ui`, and none may be imported
  anywhere under `src/lib`. Only the two live docs demos pull highlighters —
  Prism (client) and Shiki (build-time) — each a **docs devDependency** used in
  exactly one docs importer, guarded by a test (CodeBlock-R17/R18).
- Mirror existing patterns: `$props()` destructuring, `...rest`-first spread on
  the root (managed attributes win), `var(--hz-…, <fallback>)` on every token in
  the theme sheet, `:where()` to keep specificity down.

### Props

| Prop             | Type      | Default     | Rationale |
| ---------------- | --------- | ----------- | --------- |
| `code`           | `string`  | _required_  | The source text. **Always** the source of truth: copy and selection yield exactly this string, and line count / the gutter derive from it — never from `children` or highlighter-injected markup (CodeBlock-R3/R6/R19). |
| `children`       | `Snippet` | — (none)    | **Pre-highlighted content escape hatch.** When provided, replaces the default `<pre><code>{code}</code>` with the consumer's own highlighted block (typically a build-time highlighter's `<pre>` via `{@html}`, Shiki first). `code` stays required. Copy still reads raw `code`; the gutter coexists (CodeBlock-R19). |
| `title`          | `string`  | — (none)    | A filename/label. When `title` **or** `language` is set a header bar renders (the copy button, if `copyable`, moves into it); when neither is set the copy button floats top-right as today (CodeBlock-R4). |
| `language`       | `string`  | — (none)    | Two roles (CodeBlock-R7): (1) stamps `class="language-<language>"` on the **default** inner `<code>` — the client-autoloader hook (Prism / highlight.js); no target when the `children` escape hatch replaces that node — plus `data-language` on the root; (2) surfaces as a small **non-interactive** language tag in the header. Unset → no class, no `data-language`, no tag. Never affects copy. |
| `lineNumbers`    | `boolean` | `false`     | Opt-in decorative line-number gutter. Never part of copy or selection; coexists with `children` (CodeBlock-R6/R19). |
| `copyable`       | `boolean` | `true`      | Whether the built-in copy button renders. **Default on** — a copy affordance is the primary reason a code block exists in docs, and `true` preserves the private component's always-shown behaviour; the toggle is the escape hatch for embeds that supply their own copy chrome (CodeBlock-R3). |
| `collapsible`    | `boolean` | `false`     | Clamp tall listings behind a Show-more/less toggle. Unchanged from the private component. |
| `collapsedLines` | `number`  | `16`        | Rows shown while collapsed; the toggle only appears when the listing actually exceeds this (CodeBlock-R5). Unchanged. |
| `class`          | `string`  | —           | Merged after `hz-code-block` via `cx`; lands on the root and, being unlayered, cascades to `pre code` so a client autoloader can hook a scoped selector (CodeBlock-R7). |

Plus arbitrary `...rest` forwarded onto the root; `...rest` spreads first so
managed attributes (`class`, `data-*`) win.

### Requirements

1. **CodeBlock-R1 — Promotion & structure.** Ship
   `src/lib/components/CodeBlock.svelte` with root
   `<div class="hz-code-block" …>` containing, in order:
   - when `title` **or** `language` is set: a `<div class="hz-code-block-header">`
     holding, when present, `<span class="hz-code-block-title" id={titleId}>{title}</span>`
     and `<span class="hz-code-block-lang">{language}</span>`, and — when
     `copyable` — the copy `<Button class="hz-code-block-copy">`;
   - the code region `<div class="hz-code-block-clip" id={clipId} role="group" …>`
     wrapping (when `lineNumbers`) `<span class="hz-code-block-gutter" aria-hidden="true">`
     and then, **either** `{@render children()}` when the escape hatch is used
     **or** the default `<pre><code>{code}</code>` otherwise (CodeBlock-R19);
   - when `copyable` **and** neither `title` nor `language` is set: the copy
     `<Button>` floats, absolutely positioned top-right (CodeBlock-R4);
   - when the block is collapsible (see R5): the expand
     `<Button class="hz-code-block-expand">` spanning the bottom edge.

   The component is SSR-safe: no browser globals at module scope, clipboard
   access only inside the click handler, line count derived from the string,
   gutter numbers rendered server-side. **Zero runtime dependencies.**

2. **CodeBlock-R2 — Backward-compatible API.** `code` (required), `collapsible`,
   and `collapsedLines` keep their exact names, types, and semantics from
   `src/docs/CodeBlock.svelte`, so every existing call site (`<CodeBlock {code} />`,
   `<CodeBlock code={…} collapsible />`) compiles and behaves identically after
   the re-point (CodeBlock-R13). New props are all optional with defaults that
   reproduce today's behaviour (`copyable=true` = copy always shown;
   `title`/`language`/`children` unset; `lineNumbers=false`).

3. **CodeBlock-R3 — Copy button.** When `copyable` (default `true`), render a
   `<Button variant="outline" intent="neutral" size="sm" class="hz-code-block-copy">`
   whose activation calls `navigator.clipboard.writeText(code)` inside a
   `try/catch`. On success, the label swaps `Copy` → `Copied` for ~2s and a
   visually-hidden `aria-live="polite"` region announces `Code copied to
   clipboard`. **The copied text is always the raw `code` string** — never the
   gutter, never `children` markup, never highlighter-injected markup, because it
   reads the prop, not the DOM (CodeBlock-R6/R7/R19). If the clipboard API is
   unavailable (insecure context / denied permission), the catch swallows it: the
   button is a silent no-op, the label never flips to `Copied`, and nothing is
   announced. When `copyable={false}`, no button and no `aria-live` region render.

4. **CodeBlock-R4 — Header composition (title × language) & floating copy.** The
   `.hz-code-block-header` bar is a flex row and renders whenever `title` **or**
   `language` is set; the copy button (when `copyable`) lives inside it whenever
   it renders. The four states:
   - **title + language:** header shows the title (leading, flexes), the language
     tag beside it, and the trailing copy button.
   - **language only:** header shows just the language tag (leading) and the
     trailing copy button — the tag alone is enough to render the bar.
   - **title only:** header shows the title and the trailing copy button; no tag.
   - **neither:** no header; the copy button floats over the top-right corner of
     the code region (absolute positioning in the component's scoped CSS, with the
     theme supplying a surface fill so it stays legible over the first line).

   The language tag is a plain, non-interactive `<span class="hz-code-block-lang">`
   (no `role`, no `tabindex`, not a control — CodeBlock-R8). Title and copy hold
   their size (`flex-shrink: 0` on the button); the title cell may truncate/wrap
   on narrow viewports. `data-has-title` is present exactly when `title` is set
   (independent of `language`); `data-language` is present exactly when
   `language` is set.

5. **CodeBlock-R5 — Collapse (unchanged behaviour, generalized).** With
   `collapsible` and `code` longer than `collapsedLines` rows, the clip region is
   vertically clamped (max-height computed inline from the code font metrics, as
   today) with a fade over the cut edge, and an expand `<Button variant="ghost"
   intent="neutral" size="sm" fullWidth class="hz-code-block-expand">` renders
   below carrying `aria-expanded={expanded}` and `aria-controls={clipId}`, label
   `Show all {n} lines` / `Show less`. When the listing is **not** longer than
   `collapsedLines` (or `collapsible` is false), no clamp, no fade, no toggle.
   `data-collapsible` is present exactly when the block is actually collapsible
   (i.e. `collapsible && lineCount > collapsedLines`), so the toggle-bearing form
   is targetable. `lineCount` derives from `code`, so collapse works identically
   whether the code node is the default or a `children` escape hatch. The fade
   colour fades into `--hz-code-block-bg` (theme). Any height/opacity transition
   the theme adds to the expand is disabled under
   `@media (prefers-reduced-motion: reduce)`; the reference fade itself is static.

6. **CodeBlock-R6 — Line numbers never pollute copy or selection, and coexist
   with pre-highlighted content.** When `lineNumbers`, render an
   `aria-hidden="true"` `.hz-code-block-gutter` column of the numbers
   `1…lineCount` (derived from `code.split('\n').length`), laid out beside the
   code node and aligned row-for-row by the shared mono line-height. The gutter is
   `user-select: none` (structural) so a mouse selection of the code never picks
   up the digits, and it is a **sibling** of the code node (not interleaved), so a
   default `<code>` stays a single text node. `data-line-numbers` is present on
   the root when the gutter renders. Copy is unaffected regardless (R3 reads the
   prop). **Coexistence with `children` (R19):** the gutter is a sibling of the
   consumer's block too; because a build-time highlighter such as Shiki emits one
   `<span class="line">` per source line and preserves newlines, the gutter's
   `1…lineCount` aligns with the highlighted lines via the shared
   `--hz-code-block` line-height and block-start padding. The theme owns that
   shared metric so it reaches the `children` markup.

7. **CodeBlock-R7 — `language`: client-autoloader hook + visible tag (no built-in
   engine).** The component ships **no** syntax highlighting. `language` does two
   jobs:
   - **Client-autoloader hook.** When set, the **default** inner `<code>` carries
     `class="language-<language>"` (Prism / highlight.js autoloader convention)
     and the root carries `data-language="<language>"`. The top-level `class` prop
     also lands on the root unlayered, so a consumer can scope an autoloader to
     `.<their-class> pre code`. The consumer runs the autoloader in their own
     `$effect` after mount (e.g. `Prism.highlightAllUnder(el)`); the component
     never touches the code's markup. When the `children` escape hatch is used
     there is no default `<code>` to decorate — build-time highlighting takes the
     R19 path instead — but `data-language` and the tag still render.
   - **Visible tag.** When set, the language string also renders as the
     non-interactive header tag (`.hz-code-block-lang`) per CodeBlock-R4.

   **Copy and line numbers keep working regardless.** If a client autoloader
   rewrites the default `<code>` innerHTML with token `<span>`s, copy still yields
   the raw `code` string (R3 reads the prop) and the gutter still aligns (R6).
   When `language` is unset (and no `children`), the block renders plain
   monospace — no layout shift, no runtime cost.

8. **CodeBlock-R8 — Accessibility.**
   - **Copy button** is a real `<button>` (via `<Button>`) with an accessible
     name from its visible text (`Copy` / `Copied`); the ~2s success state is
     announced once via the polite `aria-live` region (R3).
   - **Expand toggle** is a disclosure button: `aria-expanded` reflects state and
     `aria-controls` references the clip region's id (R5).
   - **Language tag** is plain visible text with **no** interactive semantics — no
     `role`, no `tabindex`, not `aria-hidden` (meaningful content, read once). It
     is never the region's accessible name (that is the title / `aria-label`),
     so there is no double-announcement.
   - **Title association.** When `title` is set, the code region
     (`.hz-code-block-clip`) is `aria-labelledby={titleId}`; when unset, it
     carries `aria-label` derived from `language` (`"<language> code"`) or the
     default `"Code"`. The region is `role="group"`.
   - **Keyboard scroll.** In the default (no-`children`) rendering the clip region
     is `tabindex="0"` so an overflowing block is arrow-scrollable by keyboard
     (WCAG 2.1.1). When `children` is used, the clip **omits** its own `tabindex`
     to avoid a double tab stop — a build-time highlighter's `<pre>` carries its
     own `tabindex="0"` (Shiki does) and owns the scroll; the clip keeps
     `role="group"` + its name (CodeBlock-R19).
   - **Gutter** is `aria-hidden` (R6).
   - There is **no APG "code block" pattern**; the design follows the APG
     Disclosure pattern for the collapse toggle and general WCAG guidance
     (name/role/value 4.1.2, keyboard 2.1.1) for the rest.

9. **CodeBlock-R9 — Structural CSS (component) vs theme sheet.** The component's
   scoped `<style>` carries **layout and positioning** of its own always-present
   elements: root `position: relative`; the header flex row; the floating copy
   button's absolute placement; the clip's collapse-clamp mechanics and the
   gutter/code flex row with `user-select: none` on the gutter. **No colour,
   border, radius, padding-scale chrome, or font sizing** in the component. All of
   that lives in a new `src/lib/theme/components/code-block.css` in
   `@layer hz-theme`, imported by `theme.css` alphabetically — immediately
   **after `button.css`** (`button` < `code-block` < `divider`). **Deliberate
   exception:** the `<pre>` box presentation (padding via `--hz-code-block-padding`,
   `overflow-x: auto`, margin reset, the shared line-height) is authored in the
   theme sheet as a low-specificity `.hz-code-block :where(pre)` rule, **not** in
   the component's scoped `<style>` — because Svelte scoped styles do not reach
   `children`/`{@html}` content, and this rule must frame a consumer-supplied
   `<pre>` (R19) identically to the default one. Using `:where()` keeps it at zero
   specificity so Shiki's own inline `background`/`color` on `.shiki` survives.
   Because the theme is layered and the standalone framing lives there,
   `Example.svelte`'s unlayered override still wins with no specificity fight
   (CodeBlock-R12).

10. **CodeBlock-R10 — Theme hooks + `hooks.ts` entry.** Add a `CodeBlock` entry
    to `src/docs/hooks.ts` (Common group ordering) documenting the contract below.
    Every documented `data-*` must be stamped in the component source, every
    documented `--hz-*` must be declared or read in `code-block.css`, and every
    documented `.hz-` part must exist — `hooks.spec.ts` enforces all three, plus
    no-drift. Keep the sheet's **declared** `--hz-*` limited to the three
    documented props below.

    - `root`: `hz-code-block`
    - **attrs**:
      - `data-language` — `<string> — present when language is set` — "Mirrors the
        `language` prop; the default `code` also carries `language-<value>` for
        client autoloaders, and the header shows a matching tag."
      - `data-has-title` — `present when title is set` — "Marks the titled form.
        Independent of `data-language` — the header can render from either."
      - `data-highlighted` — `present when the children escape hatch is used` —
        "Marks a block whose code node is consumer-supplied pre-highlighted
        markup (R19). Target it to drop the default code-surface fill and let a
        build-time highlighter's own background sit cleanly."
      - `data-collapsible` — `present when the listing exceeds collapsedLines` —
        "Reflects effective behaviour, not the raw prop — a short listing never
        gets the toggle, so this is absent for it."
      - `data-line-numbers` — `present when lineNumbers is on` — "Marks the
        gutter form."
    - **props**:
      - `--hz-code-block-bg` — `<color> — default var(--hz-color-surface-muted)` —
        "The code surface fill; the collapse fade fades into it. Suppressed under
        `data-highlighted` so a build-time highlighter's own background shows."
      - `--hz-code-block-padding` — `<length> — default 1rem` — "Padding inside
        the code region (`pre`) — reaches a consumer-supplied `pre` too (R9)."
      - `--hz-code-block-fade-height` — `<length> — default 3rem` — "Height of the
        collapse fade over the clamped edge."
    - **parts**:
      - `.hz-code-block-header` — `child element` — "The header bar; present when
        `title` or `language` is set."
      - `.hz-code-block-title` — `child element` — "The filename/label text."
      - `.hz-code-block-lang` — `child element` — "The non-interactive language
        tag; present only when `language` is set."
      - `.hz-code-block-clip` — `child element` — "The code region — the
        collapsible viewport, focusable when it renders the default code node."
      - `.hz-code-block-gutter` — `child element` — "The aria-hidden,
        non-selectable line-number column; present only with `lineNumbers`."
      - `.hz-code-block-copy` — `on a Button` — "Rides through Button's `class`
        prop, so it also carries `.hz-button` and its data-attrs."
      - `.hz-code-block-expand` — `on a Button` — "The Show-more/less toggle; also
        a `.hz-button`."
      - `code.language-<language>` — `on the default inner code` — "The class a
        client autoloader targets; present only when `language` is set and the
        `children` escape hatch is not used. Not an hz-owned class."

11. **CodeBlock-R11 — Barrel export.** Add
    `export { default as CodeBlock } from './CodeBlock.svelte';` to
    `src/lib/components/index.ts`; `import { CodeBlock } from '$lib'` resolves.
    Add an assertion + smoke render (`.hz-code-block` present) to
    `src/lib/exports.spec.ts` with a `// CodeBlock-R11:` comment.

12. **CodeBlock-R12 — Embeddable-in-Example story.** `src/docs/Example.svelte`
    keeps embedding a CodeBlock and neutralizing its standalone chrome. Update its
    import to `$lib` and its chrome-stripping selector from `:global(.code-block)`
    to `:global(.hz-code-block)`; the embedded appearance (border collapsed to a
    top divider, squared corners, muted surface) is **unchanged** from today. The
    stable root class `hz-code-block` is the contract the Example frame relies on;
    the neutralizing rules are unlayered, so they beat the layered theme framing
    (CodeBlock-R9). Example passes only `code`, so the embedded block uses the
    default, floating-copy, no-header, no-line-numbers form.

13. **CodeBlock-R13 — Delete the private component & re-point every call site.**
    Delete `src/docs/CodeBlock.svelte`. Re-point every importer from
    `import CodeBlock from '…/docs/CodeBlock.svelte'` to
    `import { CodeBlock } from '$lib'` (adjusting any co-imports), and update any
    page-local CSS/selectors referencing `.code-block` to `.hz-code-block`. The
    complete inventory (Builder confirms none are missed via a final grep for
    `CodeBlock.svelte` and `\.code-block`):
    - `src/docs/DocPage.svelte` (Import section), `src/docs/Example.svelte` (R12);
    - Foundation: `colors`, `typography`, `contrast`, `borders-elevation`,
      `motion`, `icons`, `reset`, `utilities`;
    - Theming: `overview`, `tokens`, `components`, `tailwind`, `examples`;
    - Components: `container`, `form`, `banner`;
    - Patterns: `homepage`, `article`, `recipe`, `product-listing`,
      `product-detail`, `checkout-form`, `contact-form`, `docs-shell`,
      `command-palette`, `virtualized-table`, `virtualized-combobox`.

    Behaviour at every site must be identical (they use only `code` and
    `collapsible`). After the re-point, no non-spec source references
    `docs/CodeBlock.svelte`.

14. **CodeBlock-R14 — Docs page + data module.** New page
    `src/routes/components/code-block/+page.svelte` using the docs scaffold
    (`DocPage`, `Example`, `Tabs`), driven by a new
    `src/docs/data/code-block.ts` exporting `codeBlockDoc: ComponentDoc`
    (description; `importLine: 'import { CodeBlock } from "@hyzer-labs/ui"'`; a
    `props` table mirroring the Props section; an `a11yNote`; `a11yLinks` to the
    APG Disclosure pattern and MDN Clipboard API). Register `codeBlockDoc` in
    `src/docs/data/index.ts` (Common block). Demo tabs:
    - **Basic** — a plain block (copy floating top-right).
    - **With title** — a `title="app/routes/+page.svelte"` header with the copy
      button in the bar.
    - **Language tag** — `language="css"` with no `title`, plus a second sample
      with both `title` and `language` to show the composition (CodeBlock-R4).
    - **Line numbers** — `lineNumbers`, with a note that the gutter is decorative
      and excluded from copy/selection.
    - **Collapsible** — a long listing behind the Show-more toggle.
    - **Syntax highlighting (bring your own)** — a self-contained, cleanly
      **deletable** subsection showing **both** live BYO paths, each with its
      `?raw` source, framed as the consumer bringing their own (the library ships
      none):
      1. **Prism — client autoloader.** A live block rendered through
         `src/docs/PrismCodeBlock.svelte` (CodeBlock-R17): a
         `<CodeBlock language="…">` whose `language` class Prism decorates on
         mount, its Prism theme scoped to `.hz-docs-prism`.
      2. **Shiki — build-time (prerendered).** A live block whose HTML is produced
         at build by the page's `+page.server.ts` load (CodeBlock-R17) and passed
         through the R19 `children` escape hatch:
         `<CodeBlock code={src}>{@html data.shikiHtml}</CodeBlock>` — zero
         highlighter JS in the browser; Shiki's palette rides its inline `.shiki`
         styles (R9/R19 `data-highlighted` suppression).

      Prose states plainly that **the library ships no highlighter**, and includes
      at most a one-line note that highlight.js works the same way via the
      `language` class (no sample, no dependency). The whole subsection is
      removable later without touching the component or the other tabs.

    **Manifest:** add `{ label: 'CodeBlock', href: '/components/code-block' }` to
    the **Common** group in `src/docs/manifest.ts`, immediately after `Button`
    (keeping the group's leading alphabetical run: Alert, Badge, Banner,
    Blockquote, Button, CodeBlock, …).

15. **CodeBlock-R15 — Test/manifest bookkeeping.** Adding a Components page trips
    the count/coverage pins:
    - `src/docs/hooks.spec.ts`: bump `expect(componentPages).toHaveLength(42)` to
      `43` and extend the tally comment (`… + CodeBlock (spec 47)`); the new
      `CodeBlock` hooks entry must satisfy the no-fiction / no-drift / well-formed
      suites.
    - `src/docs/data.spec.ts`: derives from the manifest with no hard count — the
      new `codeBlockDoc` entry satisfies its two-way coverage and prop-name pins
      automatically once registered.
    - `src/lib/exports.spec.ts`: the CodeBlock export assertion (R11).
    - The manifest-driven `docs.e2e.ts` picks up `/components/code-block` with no
      edit (kill port 4173 before serving; per the stale-preview note).

16. **CodeBlock-R16 — Unit tests.** New
    `src/lib/components/CodeBlock.svelte.spec.ts` (browser project,
    `vitest-browser-svelte`, mirroring `Toc.svelte.spec.ts` / `Banner.svelte.spec.ts`),
    covering the Test Plan below.

17. **CodeBlock-R17 — Two live highlighter demos, each firewalled to one docs
    importer.** The docs page demonstrates both BYO paths live; the shipped
    library depends on neither.
    - **Prism — live, client-autoloader path.** Add `prismjs` (+ the chosen Prism
      token theme) as a **docs devDependency**. Exactly one importer:
      `src/docs/PrismCodeBlock.svelte` — a wrapper that renders a single
      `<CodeBlock language=… class="hz-docs-prism">` and runs Prism
      (`Prism.highlightAllUnder(el)` / `highlightElement`) over its `pre code` in
      an `$effect` after mount. The Prism token theme is **scoped under
      `.hz-docs-prism`** so it cannot bleed onto any other code block on the site.
    - **Shiki — live, build-time path, at prerender.** Add `shiki` as a **docs
      devDependency**. Exactly one importer:
      `src/routes/components/code-block/+page.server.ts` — a **server** `load`
      (server-only, never bundled into the client). Because the docs site is
      adapter-static, this runs only at **prerender/build**: it calls Shiki
      `codeToHtml(src, { lang, theme })` and returns the highlighted HTML string;
      `+page.svelte` passes it through the R19 `children` escape hatch
      (`{@html data.shikiHtml}`). **Zero highlighter JS ships to the browser.**
      Shiki's palette rides its own inline `.shiki` styles (R9/R19
      `data-highlighted` suppression).
    - **Isolation (both).** Neither `prismjs` nor `shiki`/`@shikijs/*` may be a
      `dependency` or `peerDependency` of `@hyzer-labs/ui`; both are
      `devDependencies` only; `package` / `publint` stay green; neither is
      imported anywhere under `src/lib`.
    - **highlight.js is dropped** — no dependency, no importer, no sample; at most
      a one-line prose note in R14 that it works identically via the `language`
      class.
    - Copy still reads the raw `code` prop in both demos (Prism rewrites the
      default `<code>` innerHTML; Shiki content arrives via `children`); the
      gutter coexists (R6/R19).

18. **CodeBlock-R18 — Isolation guard test.** Add
    `src/lib/highlighter-isolation.spec.ts`, mirroring
    `src/docs/iconsBarrelGuard.spec.ts`'s style (walk a scan root, read every
    non-test `.svelte`/`.ts`, assert a forbidden-import regex behaves):
    - **`src/lib/**`:** no file imports **any** highlighter — regex over
      `from '…'` / `import('…')` for `shiki`, `@shikijs/`, `prismjs`, `prism`,
      `highlight.js`, `highlightjs`. The shipped library never references one.
    - **`package.json`:** `@hyzer-labs/ui`'s `dependencies` and `peerDependencies`
      contain **none** of those packages; `prismjs` and `shiki` are present in
      `devDependencies` **only**; `highlight.js` appears in **no** dependency
      field.
    - **Docs scan (`src/routes` + `src/docs`):** a highlighter import appears in
      **exactly two** allow-listed files (the iconsBarrelGuard `ALLOWED_FILES`
      idiom) — `src/docs/PrismCodeBlock.svelte` and
      `src/routes/components/code-block/+page.server.ts` — and **nowhere else**;
      `highlight.js` is imported nowhere. So a third highlighted block, a stray
      import, or a re-added highlight.js can't creep in unnoticed.

19. **CodeBlock-R19 — Pre-highlighted content escape hatch (`children`),
    Shiki-first.** Optional `children?: Snippet`. When provided, it renders **in
    place of** the component's default `<pre><code class="language-…">{code}</code>` —
    the component emits **no `<pre>` of its own** in that branch, so the
    consumer's markup (typically a build-time highlighter's full `<pre>` via
    `{@html}`) becomes the code node and there is **no double-`<pre>`**. Designed
    to compose with real **Shiki** output — `codeToHtml` returns
    `<pre class="shiki …" style="background:…;color:…" tabindex="0"><code><span class="line">…</span>…</code></pre>`:
    - **`code` stays required** and remains the single source of truth: copy (R3)
      always writes raw `code`; `lineCount` / `collapsedLines` (R5) and the gutter
      (R6) derive from `code`, never the rendered markup.
    - **Shiki's theme sits cleanly.** The root stamps `data-highlighted`; the
      theme suppresses `--hz-code-block-bg` and its own `<code>` colour under that
      hook, and the `.hz-code-block :where(pre)` normalization is zero-specificity
      (R9), so Shiki's inline `background`/`color` on `.shiki` win and its palette
      renders as authored. The component still contributes the frame (border,
      radius, header, copy, collapse).
    - **No double focus stop.** With `children` the clip omits its own `tabindex`
      (R8); Shiki's `<pre tabindex="0">` owns keyboard scroll. The clip keeps
      `role="group"` and the title/`aria-label` name.
    - **Line numbers coexist.** The gutter is a sibling of the consumer block;
      Shiki preserves one `<span class="line">` per source line, so `1…lineCount`
      (from `code`) aligns via the shared `--hz-code-block` line-height/padding
      (R6/R9).
    - **Idiomatic usage:**
      `<CodeBlock code={src} language="svelte" lineNumbers>{@html shikiHtml}</CodeBlock>`,
      where `shikiHtml` is produced at build/prerender. No highlighter runtime
      ships; the component stays zero-dependency and SSR-safe. Copy never reads
      this markup.

### Responsive Behavior

CodeBlock is fluid: it fills its container's inline size at every breakpoint and
introduces no fixed widths. The code region scrolls **horizontally** within
itself for lines wider than the container at all breakpoints — code is never
wrapped or truncated, so the horizontal scroll is the intended overflow on mobile
(<640px) just as on desktop (for a `children` block, the consumer's `<pre>` owns
its own horizontal scroll). The header bar (title · language tag · copy) is a
flex row: on very narrow viewports the title text truncates or wraps within its
cell while the language tag and copy button hold their size (`flex-shrink: 0`);
nothing hides. The line-number gutter holds its width across breakpoints. Padding
uses logical properties so RTL and vertical writing modes hold. Nothing changes
interaction pattern by breakpoint.

### Accessibility (WCAG 2.1 AA)

- **Name/role/value (4.1.2).** Copy and expand are real `<button>`s with text
  accessible names; the expand button is a labelled disclosure
  (`aria-expanded` / `aria-controls`, R8). The language tag is plain text with no
  interactive role.
- **Status messages (4.1.3).** The copy success is announced once via a polite
  `aria-live` region; failure (clipboard unavailable) is silent, never a false
  "copied" (R3).
- **Keyboard operability (2.1.1).** In the default rendering the code region is a
  focusable (`tabindex="0"`) named `role="group"`, so an overflowing block is
  arrow-scrollable without a mouse. With the `children` escape hatch the clip
  yields the tab stop to the consumer's own focusable `<pre>` (Shiki's), avoiding
  a double stop (R8/R19). The collapse toggle is fully keyboard operable.
- **Info & relationships (1.3.1).** When titled, the code region is
  `aria-labelledby` the visible title; when untitled, it carries a sensible
  `aria-label`. The line-number gutter is `aria-hidden` and excluded from
  selection, so a screen-reader user gets clean source (R6).
- **Reduced motion.** The reference fade is static; any collapse transition the
  theme adds is gated under `prefers-reduced-motion: reduce` (R5).
- **Contrast (1.4.3).** The component's own text/chrome resolve through role
  tokens the engine grades AA in both modes. A `children` highlighter's token
  palette (e.g. a Shiki theme) is the consumer's contrast responsibility — the
  component contributes no colour to that markup and documents the boundary.

### Edge Cases & Error States

| Case | Expected behavior |
| --- | --- |
| `code=""` (empty) | `lineCount` = 1; empty `<pre>` renders; no collapse; copy copies `""`; gutter (if on) shows `1` (CodeBlock-R3/R5/R6). |
| Single line | No collapse toggle; gutter (if on) shows `1`; copy works. |
| Very long single line | Horizontal overflow scrolls; the default clip is keyboard-focusable and arrow-scrollable; gutter stays pinned (CodeBlock-R6/R8). |
| `code` shorter than `collapsedLines` | No clamp, no fade, no toggle; **no** `data-collapsible` (CodeBlock-R5). |
| `collapsible` with a long listing | Clamp + fade + Show-more toggle; `data-collapsible` present; `aria-expanded`/`aria-controls` wired (CodeBlock-R5). |
| `title` + `language` | Header shows title, language tag, and copy (CodeBlock-R4). |
| `language` only (no `title`) | Header shows the tag + copy; region `aria-label` is `"<language> code"`; **no** `data-has-title` (CodeBlock-R4/R8). |
| `title` only | Header shows title + copy; no tag; region `aria-labelledby` the title (CodeBlock-R4). |
| Neither `title` nor `language`, `copyable` on | No header; copy floats top-right; region `aria-label="Code"` (CodeBlock-R4). |
| `copyable={false}` | No copy button, no `aria-live` region; header (if `title`/`language`) still renders (CodeBlock-R3/R4). |
| `children` supplied (escape hatch) | Consumer markup replaces the default `<pre><code>`; `data-highlighted` present; component emits no own `<pre>` (no double-`<pre>`); clip drops `tabindex`; copy still yields raw `code`; gutter coexists (CodeBlock-R19). |
| `children` = Shiki output | Shiki's `<pre class="shiki">` inline background/colour render (theme suppresses its own bg under `data-highlighted`); one `<span class="line">` per line aligns the gutter (CodeBlock-R19). |
| `language` set + `children` used | No default `<code>` to carry `language-<x>`; `data-language` + header tag still render; build-time highlighting owns the markup (CodeBlock-R7/R19). |
| Client autoloader (Prism) rewrites default `<code>` | Copy still yields raw `code`; gutter still aligns (CodeBlock-R6/R7). |
| Highlighting bleed onto other blocks | None — the Prism demo's theme is scoped to `.hz-docs-prism`; Shiki's palette is inline on its own block; each demo highlights exactly one block (CodeBlock-R17). |
| Clipboard API unavailable / denied | `try/catch` swallows; silent no-op; label never flips to `Copied` (CodeBlock-R3). |
| Reduced motion | Any collapse transition disabled; static fade unaffected (CodeBlock-R5). |
| Embedded in `Example` | Standalone chrome neutralized to a top divider via the unlayered `:global(.hz-code-block)` override; appearance identical to today (CodeBlock-R12). |
| `...rest` collides with `class`/`data-*` | Component-managed value wins (`...rest` spreads first). |

### Existing Code to Reuse

- **`src/docs/CodeBlock.svelte`** — the starting point; the shipped component is
  its superset. Carry over verbatim: the copy `try/catch` + 2s reset timer, the
  `aria-live` announcer, the `lineCount` / `canCollapse` derivations, the inline
  `collapsedMaxRem` clamp height, and the `uid('hz-code')` clip id. Then split its
  `<style>` per CodeBlock-R9 and add the header/tag/gutter/language/copyable
  features and the `children` escape hatch. Delete the file at the end (R13).
- **`src/lib/components/Button.svelte`** — the copy and expand controls.
- **`cx` / `uid`** from `$lib/utils`; **`type Snippet`** from `svelte` for
  `children`.
- **`src/lib/theme/components/banner.css` / `toc.css`** — the template for the
  new `code-block.css`: `@layer hz-theme`, literal `var(--hz-…, <fallback>)`,
  `:where()` to hold specificity down, and the structural-vs-theme split.
- **`src/docs/iconsBarrelGuard.spec.ts`** — the exact style to mirror for the
  isolation guard (R18): `walk()` a scan root, `readFileSync` each non-test file,
  regex for a forbidden import, `ALLOWED_FILES` allow-list (here, two entries).
- **SvelteKit static prerender for the Shiki demo (R17)** — the docs site is
  adapter-static, so a `+page.server.ts` `load` runs at build and is never
  bundled to the client; that is the mechanism that keeps Shiki's JS out of the
  browser. (The repo currently has no `+page.server.ts`; this is the first, and
  it lives beside the CodeBlock page it feeds.)
- **`src/docs/Example.svelte`** — the chrome-stripping embed pattern to update
  (R12). **`src/docs/DocPage.svelte`** — re-points its CodeBlock import to `$lib`.
- **`src/routes/components/banner/+page.svelte`** + `src/docs/data/banner.ts` —
  the copy-from template for the new page and data module.
- **`src/docs/hooks.ts` (Banner/Toc entries)** and **`src/docs/data/index.ts`** —
  where the new `CodeBlock` hooks and data entries slot in (Common block).

### Test Plan

`src/lib/components/CodeBlock.svelte.spec.ts` (browser, `vitest-browser-svelte`,
mirroring `Toc`/`Banner` specs):

- **Structure/R1:** root `.hz-code-block`; the code region `.hz-code-block-clip`
  wraps a `<pre><code>` whose text equals `code`.
- **Copy/R3:** by default a `.hz-code-block-copy` Button renders; clicking it
  calls `navigator.clipboard.writeText` with the exact `code` string (spy/mock)
  and flips the label to `Copied`; the `aria-live` region announces.
  `copyable={false}` → no button, no announcer. A rejected/absent clipboard
  leaves the label as `Copy` and throws nothing.
- **Escape hatch/R19:** with a `children` snippet, the clip renders the snippet
  content and **not** the default `<pre><code>{code}</code>`; `data-highlighted`
  is present; the clip has **no** `tabindex`; clicking copy still writes the raw
  `code` string (proving copy reads the prop, not the injected markup); with
  `lineNumbers`, the gutter still renders `1…lineCount` as a sibling.
- **Header/R4 (title × language matrix):** `title` only → header + title, no tag,
  `data-has-title`, no `data-language`, copy in header. `language` only → header +
  tag, `data-language`, no `data-has-title`, copy in header. both → title + tag,
  both attrs. neither → no header; copy Button floating.
- **Collapse/R5:** listing > `collapsedLines` → `.hz-code-block-expand` with
  `aria-expanded="false"` and `aria-controls` = clip id, `data-collapsible`
  present; click toggles `aria-expanded`; listing ≤ `collapsedLines` → no toggle,
  no `data-collapsible`.
- **Line numbers/R6:** with `lineNumbers`, `.hz-code-block-gutter[aria-hidden="true"]`
  renders `1…lineCount`, `data-line-numbers` present, default `<code>` remains a
  single text node = `code`; copy still yields raw `code`.
- **Language/R7:** with `language="ts"` (no children), the default `<code>` has
  class `language-ts`, the root has `data-language="ts"`, the header tag reads
  `ts`; copy still yields raw `code`.
- **A11y/R8:** default clip has `role="group"` + `tabindex="0"`; with `title`
  it is `aria-labelledby` the title id; without `title` it has `aria-label`
  (language-derived or "Code"); gutter is `aria-hidden`; the language tag has no
  `role`/`tabindex`.
- **Rest/class:** `class` merges after `hz-code-block`; a rest attr forwards to
  the root; a colliding managed attribute wins.
- **Export/R11:** `CodeBlock` resolves from `$lib` and smoke-renders — asserted in
  `src/lib/exports.spec.ts`.

**Highlighter isolation (`src/lib/highlighter-isolation.spec.ts`, R18):** no
`src/lib` file imports any highlighter (`shiki`/`@shikijs/*`/`prism`/`prismjs`/
`highlight.js`/`highlightjs`); `@hyzer-labs/ui`'s `dependencies`/`peerDependencies`
list none; `prismjs` and `shiki` are in `devDependencies` only; `highlight.js` is
absent from every dependency field; a highlighter is imported by exactly the two
allow-listed docs files — `src/docs/PrismCodeBlock.svelte` and
`src/routes/components/code-block/+page.server.ts` — and nowhere else.
`package`/`publint` stay green.

**Docs/registry:** `hooks.spec.ts` passes with the bumped count (43) and the new
`CodeBlock` entry. `data.spec.ts` passes with `codeBlockDoc` registered. The
manifest-driven `docs.e2e.ts` loads `/components/code-block` (one `<h1>`,
skip-link first, no horizontal overflow at all three viewports; kill port 4173
first).

### Out of Scope

- **A built-in syntax-highlighting engine — the library ships no highlighting.**
  CodeBlock provides only BYO hooks: the `language` class for client autoloaders
  (R7) and the `children` escape hatch for build-time highlighters (R19). No
  `shiki`/`@shikijs/*`/`prism`/`prismjs`/`highlight.js` is a `dependency` or
  `peerDependency`, and none is imported under `src/lib` (R17/R18). The docs
  site's two live demos (Prism client, Shiki build-time) are docs
  devDependencies, firewalled and — for Prism — scoped; they live in one
  cleanly-deletable subsection. highlight.js is dropped (a one-line prose note
  only).
- **Diff rendering, terminal emulation, ANSI parsing, or code execution.**
- **Editing.** CodeBlock is read-only; no input, no `contenteditable`, no
  two-way binding of `code`.
- **Per-line highlighting, line-range emphasis, or copy-per-line.** The gutter is
  decorative numbering only; per-line highlighting, when wanted, arrives inside a
  `children` block the consumer's highlighter produced.
- **A `wrap` prop / soft-wrap mode.** Long lines scroll horizontally; a consumer
  can override `white-space` via `class`.
- **A curated language enum or language-name normalization.** `language` is a
  free string passed straight through to the class, the tag, and `data-language`.
- **Normalizing or sanitizing `children` markup.** The consumer owns what they
  inject (and its trust); the component only frames it and keeps `code` as the
  copy/line-count source of truth.
- **Fetching/reading files.** The consumer supplies `code` as a string (e.g. via
  their own `?raw` import), exactly as the docs site does today.
