# Metatags — SEO, Open Graph, and Twitter head tags

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`Rn`) and edge case as pass/fail. Write scope: `src/lib/
> components/Metatags.svelte` (new) + `src/lib/components/Metatags.spec.ts`
> (new, **server** project — see R11); `src/lib/components/index.ts` (barrel);
> `src/lib/exports.spec.ts` (smoke); `src/docs/data/metatags.ts` (new) +
> registration in `src/docs/data/index.ts`; `src/docs/manifest.ts` (one
> Components → Common entry); `src/routes/docs/components/metatags/
> +page.svelte` (new docs page); `src/docs/hooks.spec.ts` (count bump + the
> no-styling-contract exception, R10); `src/routes/+page.svelte` (the one-file
> dogfood, R9); `src/routes/docs.e2e.ts` (one landing-page assertion).
>
> **No theme sheet and no `hooks.ts` entry.** This component renders no DOM in
> `<body>`, so it has no styling contract to document. R10 covers the two
> registry tests that currently assume every component page has one.

### Goal

Ship a headless `<Metatags>` component that emits the correct, complete set of
document head tags for one page — `<title>`, description, canonical, Open Graph,
and Twitter/X card — from a small set of props, so a consumer never hand-writes
the twelve-tag block again and never ships a broken preview because they mirrored
`og:description` to `twitter:description` and forgot one.

It is deliberately **dumb about your site**: no config file, no context provider,
no ambient defaults. Site-level values arrive as props, and the documented way to
avoid repeating them on every page is a per-site wrapper component the consumer
owns (R7). That keeps the library free of a runtime config mechanism it has
nothing else to put in, and free of any SvelteKit import (R2).

### Context & Conventions

- Svelte 5 **runes mode**, TypeScript. One component file,
  `src/lib/components/Metatags.svelte`, exported from the barrel and smoke-
  asserted in `exports.spec.ts`. Zero runtime dependencies.
- **Single word, so no kebab split.** The manifest **label**, the
  `componentDocs` **key**, and the file stem are all `Metatags` (the
  label-is-key-is-filestem convention `data.spec.ts` enforces); the route is
  `/docs/components/metatags`.
- **Nothing visible, so nothing to theme.** No `hz-` root class, no `data-*`
  hooks, no `--hz-*` custom properties, no `class` prop, no `...rest` spread.
  A `class` prop on a component that renders no element would be a lie; the
  props table says so instead of shipping one.
- **`children` is the escape hatch, not a prop per tag.** Anything this spec
  does not emit (`twitter:site`, `robots`, `article:published_time`, JSON-LD in
  a `<script type="application/ld+json">`) goes in the `children` snippet, which
  renders inside the same `<svelte:head>`. That is why the prop list stays at
  eleven and does not grow.

### Decisions & rationale (settled — do not re-litigate)

1. **Plain props plus a documented per-site wrapper. No config, no context.**
   `src/lib/config/` is build-time only (the `hyzer.config.ts` → token-sheet/icon
   -barrel CLI); the library has **no** runtime `setContext` mechanism anywhere,
   and this component is not a good reason to invent the first one. A provider
   would be an abstraction with one implementation, and it would still need every
   page to pass `title`/`description` anyway. The site-level repetition is solved
   in userland by a ~10-line wrapper (R7), which the docs page shows in full.
2. **No `$app/*` import — `url` is a prop.** `AGENTS.md` states that nothing in
   `src/lib` may import from SvelteKit, because the library must work in plain
   Svelte. (`Image.svelte` and `Video.svelte` import `browser` from
   `$app/environment` today; that is a pre-existing exception this spec does not
   extend, and SvelteKit is a **devDependency**, not a peer.) The inspiration's
   `page.url.pathname` moves into the consumer's wrapper, which is a SvelteKit
   file in a SvelteKit app and can import `$app/state` freely. Consequence: with
   no `url`, `og:url`/`twitter:url`/`canonical` are simply not emitted (R5), and
   there is **no** `location.pathname` client fallback — a client-only fallback
   would emit a canonical the crawler reading the SSR HTML never sees, and would
   differ between SSR and hydration.
3. **`ogMessage` is dropped.** The `?message=` query parameter is one og-image
   endpoint's private contract, not an Open Graph feature. Composing it is one
   line at the call site:
   `image={`/og.png?message=${encodeURIComponent(msg)}`}`. The docs page shows
   exactly that line and keeps the hard-won note that the value must be
   percent-encoded (a raw space makes the URL invalid and Slack silently drops
   the image). No prop, no `?`-vs-`&` guessing, no assumption about the
   endpoint's parameter name.
4. **Docs placement: Components → Common.** Not Navigation — nothing here
   navigates or renders navigation chrome; Common is the group that already
   holds the non-layout, non-form, non-media miscellany (CodeBlock, Divider,
   Icons), and a document-level utility belongs with them.
5. **`name=` for Twitter, `property=` for Open Graph.** The inspiration uses
   `property="twitter:*"`; X's own documentation specifies `name`. Both happen to
   work in X's parser, so the correct one ships.
6. **`<meta name="title">` is dropped.** It is not in any spec and no crawler
   reads it; `<title>` and `og:title` cover it.
7. **The docs page has no live demo, on purpose.** A live `<Metatags>` inside
   the docs page would inject a second `<title>` and a canonical into the docs
   site's own head, fighting `DocPage.svelte`'s
   `<svelte:head><title>{name} — @hyzer-labs/ui</title></svelte:head>`. Examples
   are therefore `CodeBlock` fences only, not the `Example` frame, and the
   "code fences must match their live demo" hazard does not apply because there
   is no live demo (R8).

### API sketch (normative)

```svelte
<!-- Direct use on one page -->
<Metatags
  siteUrl="https://example.com"
  siteName="Example"
  url="/pricing"
  title="Pricing"
  description="Three plans, no seat minimums."
  image="/og/pricing.png"
  imageAlt="The Example pricing table"
/>
<!-- <title>Pricing | Example</title>, canonical https://example.com/pricing -->

<!-- Site defaults live in a wrapper the consumer owns (R7) -->
<Seo title="Pricing" description="Three plans, no seat minimums." />

<!-- Anything not in the prop list goes in the snippet -->
<Metatags {...base}>
  <meta name="robots" content="noindex" />
  <meta name="twitter:site" content="@example" />
</Metatags>
```

### Props

| Prop           | Type                                    | Default            | Notes |
| -------------- | --------------------------------------- | ------------------ | ----- |
| `siteUrl`      | `string`                                | —                  | Absolute site origin, e.g. `https://example.com`. Required for any relative `url` / `canonical` / `image` to resolve to the absolute URL Open Graph demands (R4). |
| `url`          | `string`                                | —                  | This page: a root-relative path (`/pricing`) or an absolute URL. In SvelteKit this is `page.url.pathname`, passed by your wrapper (Decision 2). |
| `title`        | `string`                                | —                  | The page title. Composed with `siteName` per R3. |
| `siteName`     | `string`                                | —                  | The site's name. Emits `og:site_name` **and** serves as the title suffix (R3). |
| `titleSeparator` | `string`                              | `' \| '`           | Sits between `title` and `siteName`. |
| `description`  | `string`                                | —                  | Drives all three description tags (R5). |
| `image`        | `string`                                | —                  | Preview image, path or absolute URL, resolved like `url` (R4). |
| `imageAlt`     | `string`                                | —                  | Alt text for the preview image. Dev-warns when `image` is set without it (R6). |
| `type`         | `string`                                | `'website'`        | `og:type`. Free string ([ogp.me types](https://ogp.me/#types)); `'article'` is the other common one. |
| `canonical`    | `string`                                | `url`              | Canonical override for a page reachable at more than one address, path or absolute (R4). |
| `twitterCard`  | `'summary' \| 'summary_large_image'`    | derived from `image` | `summary_large_image` when an `image` resolves, `summary` otherwise. |
| `children`     | `Snippet`                               | —                  | Rendered last inside the same `<svelte:head>`. For additional tags, not overrides (R5). |

No `class`, no `...rest`: there is no element to put them on.

### Requirements

1. **R1 — One `<svelte:head>`, no other output.** The component's entire template
   is a single `<svelte:head>` block. It renders **nothing** into `<body>` — no
   wrapper element, no comment node, no whitespace-significant text. It is safe
   anywhere in a page's markup and safe to render more than once per app (once
   per page).

2. **R2 — SSR-first, no browser globals, no SvelteKit.** No `window`,
   `document`, `location`, or `navigator` access anywhere, at module scope or in
   a `$derived`; no `$app/*` or `@sveltejs/kit` import (Decision 2). Everything
   is pure derivation from props, so the tags are identical under SvelteKit SSR,
   under `render()` from `svelte/server`, and in a plain client-only Svelte app.
   `new URL` (R4) is the only platform API used and exists in every target.

3. **R3 — Title composition.** Let `separator = titleSeparator` (default
   `' | '`):
   - `title` and `siteName` both set and **different** → `title + separator + siteName`.
   - `title` set, `siteName` unset, **or** `title === siteName` → `title`.
   - `title` unset, `siteName` set → `siteName` (the home-page case).
   - Neither set → **no `<title>` is emitted at all**, and no `og:title` /
     `twitter:title`. The component never fabricates a title, and never emits an
     empty one that would clobber a title the page set itself.

   The composed string is used verbatim for all three of `<title>`, `og:title`,
   and `twitter:title`, so a preview card and a browser tab never disagree.

4. **R4 — URL resolution (`url`, `canonical`, `image`).** One internal helper
   resolves each of the three the same way:
   - A value starting with a scheme (`http://`, `https://`) or `//` is used
     **verbatim**.
   - Otherwise it is treated as **root-relative** and resolved against `siteUrl`
     via `new URL(path, siteUrl)`, where a missing leading `/` is added first —
     so `pricing`, `/pricing`, and `https://example.com/pricing` all land on the
     same absolute URL. (This fixes the inspiration's `${SITE_URL}/${canonical}`,
     which required exactly one of those forms and produced `//` for another.)
   - If `siteUrl` is absent, or `new URL` throws (a malformed `siteUrl`), the
     helper returns `undefined`, the dependent tags are **omitted** rather than
     emitted relative or broken, and a dev-only `console.warn`
     (`import.meta.env.DEV`) names the prop and the reason once.

   `canonical` defaults to `url` when unset; when both are absent, no
   `<link rel="canonical">` is emitted.

5. **R5 — The emitted tag set.** In this order, each group conditional on its
   input resolving:
   - `<title>{composed}</title>` (R3)
   - `<meta name="description" content={description}>`
   - `<link rel="canonical" href={resolvedCanonical}>`
   - `<meta property="og:type" content={type}>` — **always** (has a default)
   - `<meta property="og:site_name" content={siteName}>`
   - `<meta property="og:title">`, `<meta property="og:description">`,
     `<meta property="og:url">`
   - `<meta property="og:image">` and, with `imageAlt`,
     `<meta property="og:image:alt">`
   - `<meta name="twitter:card" content={twitterCard}>` — **always**
     (`summary_large_image` when an image resolved, else `summary`)
   - `<meta name="twitter:title">`, `<meta name="twitter:description">`,
     `<meta name="twitter:url">`, `<meta name="twitter:image">`, and with
     `imageAlt`, `<meta name="twitter:image:alt">`
   - `{@render children?.()}` **last**, so a consumer's extra tags follow the
     managed ones.

   Every Open Graph tag uses `property=`; every Twitter tag uses `name=`
   (Decision 5). No tag is ever emitted with an empty `content`.

6. **R6 — Dev warnings (the house misuse policy).** Dev-only
   (`import.meta.env.DEV`, computed with `untrack` so it fires once per
   instance, the `Image.svelte` precedent):
   - `image` set without `imageAlt` — the preview image is unlabeled for anyone
     whose reader announces the card.
   - A relative `url` / `canonical` / `image` with no `siteUrl` (R4), naming the
     prop that could not resolve.
   - Neither `title` nor `siteName` (R3) — the page gets no title from this
     component, which is almost always a mistake rather than a choice.
   No warning ever fires in production, and no warning changes what renders.

7. **R7 — The wrapper pattern is documented, not shipped.** The docs page shows
   a complete, copy-pasteable per-site wrapper as its central example: a
   consumer-owned `Seo.svelte` that imports `page` from `$app/state`, holds the
   site constants, and forwards the rest:

   ```svelte
   <!-- src/lib/Seo.svelte — in the CONSUMER's app, not this library -->
   <script lang="ts">
     import { page } from '$app/state';
     import { Metatags } from '@hyzer-labs/ui';
     import type { ComponentProps } from 'svelte';
     let props: Omit<ComponentProps<typeof Metatags>, 'siteUrl' | 'siteName' | 'url'> = $props();
   </script>

   <Metatags
     siteUrl="https://example.com"
     siteName="Example"
     url={page.url.pathname}
     image="/og/default.png"
     imageAlt="Example"
     {...props}
   />
   ```

   The prose states plainly why the library does it this way: `$app/state` is a
   SvelteKit import, the library stays framework-agnostic, and one wrapper file
   per site is cheaper than a config mechanism every consumer has to learn. The
   `ComponentProps<typeof Metatags>` line is the typed surface for the wrapper;
   the library exports no `MetatagsProps` type (the props interface stays local,
   as in `Toc.svelte` / `Image.svelte`).

8. **R8 — Docs page + data module + manifest.** New
   `src/routes/docs/components/metatags/+page.svelte` using `DocPage`, with its
   demo sections built from **`CodeBlock` fences only — no `Example` frame and no
   live `<Metatags>`** (Decision 7; the page states in one line that the
   component renders nothing visible, which is why there is no preview).
   Sections: a minimal call; the per-site wrapper (R7, the centrepiece); a
   dynamic-page example (`type="article"`, a per-page `image`, including the
   `encodeURIComponent` og-image line from Decision 3); the `children` escape
   hatch; and a fence showing the **emitted head markup** for the minimal call,
   so a reader can see the twelve tags without opening devtools.

   New `src/docs/data/metatags.ts` exporting `metatagsDoc: ComponentDoc` with
   `importLine: 'import { Metatags } from "@hyzer-labs/ui"'`, a `props` table
   mirroring the Props section above (every documented name must appear in
   `Metatags.svelte` — `data.spec.ts` checks it), an `a11yNote` (R12), and
   `a11yLinks` to the Open Graph protocol, X's card markup reference, Google's
   canonical guidance, and WCAG 2.4.2 Page Titled. Register it in
   `src/docs/data/index.ts` in the Common block.

   **Manifest:** append to Components → **Common** (Decision 4), after
   `Skeleton`; the group is not strictly alphabetical past `Button`.
   `description` (plain text, no markup, no em dashes):
   `'The head tags one page needs for search results and link previews: title, description, canonical, Open Graph, and an X card, from one set of props. Site-level values are props too, so a small wrapper of your own holds them and each page passes only what changes.'`

9. **R9 — Dogfood it once, on the landing page.** `src/routes/+page.svelte`
   currently hand-writes `<svelte:head>` with a `<title>` and a description
   meta. Replace that block with `<Metatags>` carrying
   `siteUrl="https://design.hyzer.sh"`, `siteName="@hyzer-labs/ui"`,
   `url="/"`, the existing title and description strings, and no `image` (the
   site ships no og image; the `summary` card is correct until it does). The
   landing page keeps the exact same `<title>` text it has today. This is the
   whole dogfood: the ~78 per-page `<svelte:head><title>` blocks under
   `/docs` are **out of scope** (see Out of Scope) — one honest consumer is
   enough to prove the API, and it is the page whose link preview matters.

10. **R10 — Registry bookkeeping for a component with no styling contract.**
    `src/docs/hooks.spec.ts` assumes every Components page has a `hooks.ts`
    entry with a real root class. Metatags has neither (it renders no DOM), so:
    - Add one exported-in-file constant near the top, e.g.
      `const NO_STYLING_CONTRACT = new Set(['Metatags'])`, with a comment saying
      why (a component that renders only `<svelte:head>` has no class, no
      `data-*`, and no custom properties to promise).
    - Exclude those labels from **both** `'every component page has an entry
      with a root class'` and `'every root class appears in its own component
      source'`. Every other test in the file is unaffected.
    - Bump `expect(componentPages).toHaveLength(48)` to `49` and extend the
      tally comment with `+ Metatags (spec 54)`.
    No `hooks.ts` entry is added (`DocPage` already renders the Theme hooks
    section only `{#if componentHooks}`, so the page simply has no such section).
    `data.spec.ts` needs no change beyond the registered entry.

11. **R11 — Unit spec runs in the SERVER project, deliberately.** The spec file
    is `src/lib/components/Metatags.spec.ts`, **not** `Metatags.svelte.spec.ts`:
    the filename is what selects the Vitest project (`vite.config.ts` — the
    `client`/browser project matches `src/**/*.svelte.{test,spec}.ts`, the
    `server`/node project matches the rest), and the truthful assertion surface
    for this component is the SSR head string a crawler receives. It uses
    `render()` from `svelte/server` and asserts on the returned `head`, the way
    `src/lib/exports.spec.ts` already server-renders components. The deviation
    from the sibling `*.svelte.spec.ts` naming is load-bearing; a comment in the
    file says so.

12. **R12 — Accessibility content, not chrome.** No ARIA, no roles, no focus
    behaviour — there is nothing to interact with. Two real accessibility
    obligations remain and are met: `<title>` is the page's accessible name in
    the browser and in a screen reader's window list (WCAG 2.4.2), so R3 never
    emits an empty or fabricated one; and `og:image:alt` / `twitter:image:alt`
    give the preview image a text alternative in every client that surfaces one,
    which is why R6 warns when it is missing. The `a11yNote` says both, plus the
    rule that a page must set its title **once** — through this component or
    through its own `<svelte:head>`, never both.

### Responsive Behavior

None. The component renders no DOM in `<body>`, has no layout, and behaves
identically at mobile (<640px), tablet (640–1024px), and desktop (>1024px). Its
docs page is plain prose and code fences and inherits the docs shell's own
responsive behaviour, with no horizontal overflow at any of the three e2e
viewports.

### Edge Cases & Error States

| Case | Expected |
| --- | --- |
| No props at all | Emits only `og:type="website"` and `twitter:card="summary"`; no title, no canonical, no image. Two dev warnings (no title/siteName; nothing else to warn about). No throw. |
| `title` unset, `siteName` set | `<title>` and both title metas are `siteName` (R3). |
| `title === siteName` | No suffix, no duplication: one copy of the string (R3). |
| `titleSeparator=" · "` | `Pricing · Example` (R3). |
| Relative `url` with no `siteUrl` | `og:url`, `twitter:url`, and `canonical` omitted; one dev warn naming `siteUrl` (R4). |
| Absolute `url`, no `siteUrl` | Used verbatim; no warning (R4). |
| `siteUrl` with a trailing slash, `url` without a leading one | Exactly one slash between them (`new URL`, R4). |
| Malformed `siteUrl` (`"example.com"`) | `new URL` throws, caught; dependent tags omitted; dev warn (R4). No unhandled error during SSR. |
| Protocol-relative `image` (`//cdn.example.com/a.png`) | Verbatim (R4). |
| `image` without `imageAlt` | Image tags still emitted (a card is better than no card); dev warn (R6). |
| `image` set | `twitter:card` is `summary_large_image` unless `twitterCard` overrides it (R5). |
| `description=""` (empty string) | Treated as absent: no description tags, no empty `content` (R5). |
| `children` supplies `<meta name="robots">` | Rendered last inside the same head block, after every managed tag (R5). |
| `children` re-declares `og:title` | Both tags ship; documented as the consumer's problem — `children` is for additional tags, not overrides (R5). |
| Rendered twice on one page | Duplicate tags; documented as misuse. The component does not deduplicate, and neither does the platform. |
| SvelteKit client-side navigation between two pages using it | Svelte's own `<svelte:head>` reconciliation replaces the tags; nothing in the component caches or leaks (R1/R2). |
| Plain Svelte app, no SSR | Tags are appended at mount, exactly as any other `<svelte:head>` content (R2). |
| Docs site page rendering it live | Does not happen: the docs page ships fences only, so `DocPage`'s own `<title>` is never contested (Decision 7). |

### Existing Code to Reuse

- **`src/routes/+page.svelte`** — the `<svelte:head>` block R9 replaces, and the
  source of the title/description strings to carry over unchanged.
- **`src/lib/components/Image.svelte`** — the dev-warning idiom to copy
  verbatim in shape: `if (import.meta.env.DEV) { if (untrack(() => …)) console.warn('[hyzer-ui] <Metatags>: …') }`.
- **`src/lib/exports.spec.ts`** — both the barrel smoke assertion to extend and
  the `render()`-from-`svelte/server` pattern R11's spec is built on.
- **`src/docs/DocPage.svelte`** — the page scaffold; note it already guards the
  Theme hooks section behind `{#if componentHooks}` (R10) and that it owns the
  page `<title>` (Decision 7).
- **`src/docs/data/skeleton.ts`** — the closest `ComponentDoc` template in shape
  (props table, `a11yNote`, `a11yLinks`, no `types`).
- **`src/routes/docs/components/icons/+page.svelte`** and **`.../container/`** —
  existing component pages that render `CodeBlock` fences directly rather than
  going through `Example`, which is the pattern R8 needs.
- **`src/docs/hooks.spec.ts` / `src/docs/data.spec.ts`** — the `Tooltip` and
  `Icons` exceptions in `componentSource()` are the precedent for R10's
  `NO_STYLING_CONTRACT` exception: a named set with a comment saying why, not a
  loosened assertion.

### Test Plan

**Unit — `src/lib/components/Metatags.spec.ts` (server project, `render()` from
`svelte/server`, asserting on `head`):**

- **R1:** `body` is empty (or whitespace only); every tag is in `head`.
- **R3 title matrix:** `title` + `siteName` → `Pricing | Example`; equal values →
  one copy; `title` only → `Pricing`; `siteName` only → `Example`; neither → no
  `<title>` and no `og:title`/`twitter:title` substring at all; custom
  `titleSeparator` honoured.
- **R4 URL resolution:** relative `url` + `siteUrl` → one absolute URL with a
  single slash; absolute `url` passes through; `//cdn/...` passes through;
  no `siteUrl` → no `og:url`/`twitter:url`/`canonical`; malformed `siteUrl` →
  same omission and **no throw**; `canonical` defaults to `url` and overrides it
  when both are set.
- **R5 tag set:** with every prop supplied, the head contains each tag from R5
  exactly once, Open Graph tags with `property=` and Twitter tags with `name=`;
  `og:type` and `twitter:card` are present with no props at all;
  `twitterCard` derives to `summary_large_image` with an image and `summary`
  without, and an explicit `twitterCard` wins; `description=""` emits no
  description tag; no tag has `content=""`.
- **R5 children:** a snippet's `<meta name="robots">` appears in `head`, after
  the managed tags.
- **R6 warnings:** with `vi.spyOn(console, 'warn')`, `image` without `imageAlt`
  warns; a relative `url` with no `siteUrl` warns; no `title`/`siteName` warns;
  a fully-specified render warns **zero** times.

**Exports — `src/lib/exports.spec.ts`:** `expect(mod.Metatags).toBeDefined()`
with a `// specs/54:` comment.

**Docs registry:** `data.spec.ts` green with `metatagsDoc` registered (every
documented prop name present in `Metatags.svelte`); `hooks.spec.ts` green with
the R10 exception and the count at 49; `manifest.spec.ts` green (the new page
resolves to a real `+page.svelte`, its description is plain text with no markup,
braces, or trailing colon).

**e2e — `src/routes/docs.e2e.ts` (Playwright):** one new assertion on the
landing page (`/`) proving the R9 dogfood emits real tags — `title` unchanged
from today, and `link[rel="canonical"]`, `meta[property="og:title"]`,
`meta[name="twitter:card"]` present with the expected values. The
manifest-driven route sweep picks up `/docs/components/metatags` with no edit
(kill port 4173 before serving, per the stale-preview note).

### Out of Scope

- **A config file, context provider, or ambient defaults mechanism**
  (Decision 1). Site values are props; repetition is solved by a consumer-owned
  wrapper the docs show in full.
- **Any `$app/*` or `@sveltejs/kit` import** (Decision 2). The component never
  reads the current URL by itself, and there is no `location.pathname` fallback.
- **`ogMessage` / dynamic og-image generation** (Decision 3). No image endpoint
  contract, no query-parameter prop, no image rendering. The docs show the
  one-line `encodeURIComponent` composition.
- **Converting the ~78 per-page `<svelte:head><title>` blocks under `/docs`**
  to `Metatags`. `DocPage.svelte` owns those titles and a conversion would fight
  it; R9's single landing-page dogfood is the whole scope here. Worth a later
  pass if `DocPage` ever grows real per-page metadata.
- **JSON-LD / structured data, `robots`, `article:*`, `twitter:site`,
  `theme-color`, favicons, `viewport`, `hreflang`, and per-locale alternates.**
  All reachable through `children`; none get a prop.
- **A sitemap, an `og:image` size/type declaration, or any validation of the
  image's dimensions or aspect ratio.**
- **Title truncation, description length limits, or any SEO linting.** The
  component emits what it is given; it does not grade it.
- **Deduplicating tags across two `<Metatags>` instances** on one page.
- **A theme sheet, `hooks.ts` entry, `class` prop, or `...rest` spread** — there
  is no element to style, name, or spread onto (R10).
