# Media Components Spec — Image + Video

> Builder contract. Implement against this document. Reviewer verifies each
> requirement (`IMG-Rn` / `VID-Rn`) and edge case as pass/fail.
>
> **This file covers two independent components.** Implement `Image` and
> `Video` as **separate components, in separate files, with separate test
> files** — they ship in different sprints (`Image` Sprint 1, `Video`
> Sprint 3 per `original-specs/17-build-order.md`) and share no code beyond the
> common conventions below. Nothing here couples them.

### Goal

Ship two headless Svelte 5 media components — `Image` (responsive, lazy-loaded,
CLS-safe, with placeholder states) and `Video` (native `<video>` plus
auto-detected YouTube/Vimeo embeds) — that expose their behavior through stable
`hz-*` classes and `data-*`/ARIA hooks, ship only the minimal **structural** CSS
needed to function (aspect-ratio boxing, object-fit, placeholder crossfade), and
ship **no** visual opinions, so consuming sites get working media out of the box
and restyle via the documented hooks.

### Context & Conventions

- Svelte 5 **runes mode** is forced project-wide; both components are
  TypeScript.
- These two components follow the **layout-primitive exception**
  (`specs/03-layout.md`): because CLS-prevention via aspect-ratio, `object-fit`,
  and the load-state/crossfade machine are the *core function* of these
  components (not visual polish), they ship **structural** CSS in a scoped
  `<style>` block. They still ship **no** colors, borders, radius, shadows,
  fonts, or font-driven sizing. The one consumer-driven color is the
  `placeholderColor` background (`Image`), applied as an inline style from the
  prop value.
- Structural CSS values that map to design tokens use **literal fallbacks**
  (per `specs/03-layout.md` §Context). No token-backed colors ship.
- Component files: `src/lib/components/Image.svelte`,
  `src/lib/components/Video.svelte`.
- Export both from the barrel `src/lib/components/index.ts`, resolvable via
  `import { Image, Video } from '$lib'`. Add both to `src/lib/exports.spec.ts`.
- Mirror `src/lib/components/Link.svelte` / `Stack.svelte` for `$props()`
  destructuring, `class: className` handling, `cx('hz-image', className)`, and
  `...rest`-first spread order (managed attributes win).
- Reduced-motion: follow `original-specs/00-architecture.md` §Animations —
  `import { browser } from '$app/environment'` + `window.matchMedia(
  '(prefers-reduced-motion: reduce)')` — for the placeholder crossfade and video
  autoplay gating.
- Dev-only warnings use the `import.meta.env.DEV` + `untrack(...)` pattern from
  `src/lib/components/Button.svelte`.

---

## Component A — `Image`

### Props (`Image`)

| Prop             | Type                                                     | Default                      |
| ---------------- | -------------------------------------------------------- | ---------------------------- |
| src              | `string`                                                 | _required_                   |
| alt              | `string`                                                 | _required_ (`''` = decorative) |
| width            | `number \| undefined`                                    | —                            |
| height           | `number \| undefined`                                    | —                            |
| loading          | `'lazy' \| 'eager'`                                      | `'lazy'`                     |
| aspectRatio      | `'auto' \| '1/1' \| '4/3' \| '16/9' \| '21/9' \| string` | `'auto'`                     |
| fit              | `'cover' \| 'contain' \| 'fill' \| 'none'`               | `'cover'`                    |
| rounded          | `boolean \| 'sm' \| 'md' \| 'lg' \| 'full'`              | `false`                      |
| placeholder      | `'blur' \| 'color' \| 'none'`                            | `'none'`                     |
| placeholderSrc   | `string \| undefined`                                    | —                            |
| placeholderColor | `string`                                                 | `'var(--hz-color-gray-200)'` |
| class            | `string \| undefined`                                    | —                            |
| `...rest`        | forwarded to `<img>`                                     | —                            |

### Requirements (`Image`)

1. **IMG-R1 — Structure.** Renders a `<div class="hz-image">` wrapper containing
   a single `<img class="hz-image__img">`. The wrapper carries the data
   attributes; the `<img>` carries `src`, `alt`, `loading`, and `width`/`height`
   when provided.
2. **IMG-R2 — alt required, decorative handling.** `alt` is required at the TS
   level. When `alt=""`, the `<img>` additionally gets `role="presentation"`.
   When `alt` is non-empty, no `role` is added.
3. **IMG-R3 — Dimensions / CLS.** When `width` and/or `height` are provided,
   they render as the matching HTML attributes on `<img>` (intrinsic sizing to
   prevent layout shift). When absent, no attribute is emitted.
4. **IMG-R4 — loading.** `loading` reflects verbatim to the `<img loading>`
   attribute and to `data-loading` on the wrapper; default `'lazy'`.
5. **IMG-R5 — aspectRatio.** Reflected to `data-aspect-ratio` on the wrapper.
   For any value other than `'auto'`, the wrapper applies `aspect-ratio:
   <value>` via an inline style (a valid CSS `aspect-ratio`, e.g. `16/9`); the
   `<img>` fills the box. For `'auto'`, no `aspect-ratio` is set and the wrapper
   sizes to the image's intrinsic ratio. Arbitrary string values (e.g. `'3/2'`)
   pass through verbatim.
6. **IMG-R6 — fit.** Reflected to `data-fit`. The shipped structural CSS maps
   `data-fit` → `object-fit` (`cover`/`contain`/`fill`/`none`) on the `<img>`.
   Default `cover`.
7. **IMG-R7 — rounded (hook only).** Reflected to `data-rounded` —
   `true`→`data-rounded=""` (boolean present), the string values render verbatim
   (`data-rounded="md"`), `false`→attribute absent. The component ships **no**
   `border-radius` **and no** `overflow` CSS for this — both rounding *and* the
   clipping it requires are entirely a theme concern off the `data-rounded` hook.
8. **IMG-R8 — Load state machine.** The wrapper carries `data-state`
   transitioning `loading` → `loaded` → (or) `error`:
   - Initial render: `data-state="loading"`.
   - On the `<img>` `load` event: `data-state="loaded"`.
   - On the `<img>` `error` event: `data-state="error"`.
   - **Cached images:** after mount, if `img.complete && img.naturalWidth > 0`,
     set `loaded` immediately (covers SSR/cached images that never fire `load`);
     if `complete` but `naturalWidth === 0`, set `error`.
9. **IMG-R9 — placeholder=none.** No placeholder layer; wrapper has no
   placeholder background and no blur image. The `<img>` is visible immediately
   (it pops in on load via the browser).
10. **IMG-R10 — placeholder=color.** While `data-state` is `loading`, the
    wrapper shows `placeholderColor` as its `background-color` (inline style).
    Once `loaded`, the loaded image covers it. `data-placeholder="color"`
    reflects on the wrapper.
11. **IMG-R11 — placeholder=blur.** When `placeholderSrc` is provided, a second
    `<img class="hz-image__placeholder" aria-hidden="true">` renders the low-res
    source, visually blurred, beneath the main image. On `data-state="loaded"`
    the main image crossfades in (opacity transition) and the placeholder fades
    out. `data-placeholder="blur"` reflects. If `placeholder='blur'` but
    `placeholderSrc` is missing, behave as `placeholder='none'` and emit a
    dev-only `console.warn`.
12. **IMG-R12 — Reduced motion.** When `prefers-reduced-motion: reduce`, the
    blur crossfade (IMG-R11) has **zero** duration — the main image appears
    instantly on `loaded` with no transition. The placeholder image still
    renders/clears.
13. **IMG-R13 — class composition.** `class` composes as
    `cx('hz-image', className)` on the wrapper; `hz-image` always first and never
    removable. Omitted → exactly `hz-image`.
14. **IMG-R14 — rest forwarding.** Extra HTML attributes (`...rest`) forward onto
    the `<img>`, spread first so managed attributes (`src`, `alt`, `loading`,
    `width`, `height`, `role`, `class`) win and cannot be clobbered.
15. **IMG-R15 — Barrel export.** `Image` exported from
    `src/lib/components/index.ts`; `import { Image } from '$lib'` resolves.

---

## Component B — `Video`

### Props (`Video`)

| Prop        | Type                                 | Default    |
| ----------- | ------------------------------------ | ---------- |
| src         | `string`                             | _required_ |
| title       | `string`                             | _required_ |
| aspectRatio | `'16/9' \| '4/3' \| '1/1' \| '9/16'` | `'16/9'`   |
| autoplay    | `boolean`                            | `false`    |
| muted       | `boolean`                            | `false`    |
| controls    | `boolean`                            | `true`     |
| loop        | `boolean`                            | `false`    |
| poster      | `string \| undefined`                | —          |
| loading     | `'lazy' \| 'eager'`                  | `'lazy'`   |
| class       | `string \| undefined`                | —          |
| `...rest`   | forwarded to inner element           | —          |

### Requirements (`Video`)

1. **VID-R1 — Provider detection.** Renders `<div class="hz-video"
   data-provider="…" data-aspect-ratio="…">`. The component inspects `src`:
   - YouTube hosts (`youtube.com/watch?v=ID`, `youtu.be/ID`,
     `youtube.com/embed/ID`, `m.youtube.com`, with optional query) →
     `data-provider="youtube"`, renders an `<iframe>`.
   - Vimeo (`vimeo.com/ID`, `player.vimeo.com/video/ID`) →
     `data-provider="vimeo"`, renders an `<iframe>`.
   - Everything else → `data-provider="native"`, renders a `<video>` with a
     nested `<source src>`.
     The extracted video ID drives the canonical embed URL (VID-R2/R3).
2. **VID-R2 — YouTube embed.** Builds
   `https://www.youtube-nocookie.com/embed/{id}` with query params derived from
   props: `autoplay=1` & `mute=1` only when autoplay is permitted (VID-R6),
   `loop=1&playlist={id}` when `loop`, `controls=0` when `controls=false`. The
   iframe gets `title={title}`, `loading={loading}`, `allow="autoplay;
   fullscreen; picture-in-picture"`, and `allowfullscreen`.
3. **VID-R3 — Vimeo embed.** Builds `https://player.vimeo.com/video/{id}` with
   `dnt=1` (do-not-track, privacy parity with youtube-nocookie), plus
   `autoplay=1&muted=1` when permitted, `loop=1` when `loop`, `controls=0` when
   `controls=false`. Same `title`/`loading`/`allow`/`allowfullscreen` as VID-R2.
4. **VID-R4 — Native video.** Renders `<video class="hz-video__el"
   aria-label={title}>` with: `controls` when `controls` (default true), `loop`
   when `loop`, `poster` when provided, `playsinline`, and `preload` mapped from
   `loading` (`lazy`→`preload="none"`, `eager`→`preload="metadata"`). The `src`
   renders on a nested `<source>`. `muted`/`autoplay` per VID-R6.
5. **VID-R5 — title required.** `title` is required at the TS level. It is the
   iframe accessible name (`title` attr) and the native `aria-label`. Never
   rendered as visible text.
6. **VID-R6 — Autoplay gating.** Autoplay is applied **only** when
   `autoplay === true` AND `muted === true` AND `prefers-reduced-motion` is not
   `reduce`. When gated off, no `autoplay`/`autoplay=1` is emitted. When
   `autoplay` is requested with `muted=false`, autoplay is **suppressed** (not
   silently forced) and a dev-only `console.warn` explains muting is required.
   Native `<video>` still gets the `muted` attribute whenever `muted` is true
   regardless of autoplay.
7. **VID-R7 — aspectRatio.** Reflected to `data-aspect-ratio`; wrapper applies
   `aspect-ratio: <value>` via shipped structural CSS. The iframe/`<video>`
   fills the box (`width:100%; height:100%`). Default `16/9`.
8. **VID-R8 — Native state machine.** For `data-provider="native"` only,
   `data-state` transitions `idle` → `playing` / `paused` / `ended` via
   `play`/`pause`/`ended` event listeners on the `<video>`. Initial
   `data-state="idle"`. For iframe providers, `data-state="idle"` is static (no
   JS control of cross-origin embeds).
9. **VID-R9 — loading=lazy.** Iframes get `loading="lazy"` by default; native
   maps to `preload` (VID-R4). `eager` → iframe `loading="eager"`.
10. **VID-R10 — class composition.** `cx('hz-video', className)` on the wrapper;
    `hz-video` first, never removable.
11. **VID-R11 — rest forwarding.** `...rest` forwards onto the inner element
    (iframe or video), spread first so managed attributes win.
12. **VID-R12 — Barrel export.** `Video` exported from
    `src/lib/components/index.ts`; `import { Video } from '$lib'` resolves.

---

### Responsive Behavior

Both components are fluid by default (`width: 100%` on the wrapper, media fills
it). There is no breakpoint-specific reflow, hiding, or interaction change at
mobile (<640px) / tablet (640–1024px) / desktop (>1024px). Aspect-ratio boxing
keeps the media's height proportional to its rendered width at every viewport,
preventing reflow. Tall ratios (`9/16`, `21/9`) remain functional on narrow
screens; any max-height clamping is a theme concern.

### Accessibility (WCAG 2.1 AA)

- **Image:** `alt` is required at the type level, forcing a conscious decorative
  (`alt=""` → `role="presentation"`) vs descriptive choice (1.1.1).
  `width`/`height` prevent CLS. The blur placeholder image is `aria-hidden=
  "true"` (decorative duplicate). Crossfade respects `prefers-reduced-motion`
  (2.3.3 / IMG-R12). No color is conveyed as information.
- **Video:** `title` is required and is the screen-reader name for iframes
  (4.1.2) and `aria-label` for native. Native ships `controls` by default (never
  controls-less without a custom UI; native controls provide 2.1.1 keyboard
  operability). Autoplay is gated on `muted` + reduced-motion (2.2.2, 2.3.x).
  YouTube uses the no-cookie domain; Vimeo uses `dnt=1`. `poster` provides
  visual context pre-load.
- Both: no `outline:none`; focusable native controls keep their default focus
  ring (focus styling is a theme concern but must not be suppressed).

### Edge Cases & Error States

| Case                                                | Expected behavior                                                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `Image` `alt=""`                                    | `role="presentation"` added; no warning (IMG-R2).                                                               |
| `Image` no `width`/`height`                         | No attrs emitted; relies on intrinsic/`aspect-ratio` sizing; CLS not guaranteed (consumer choice) (IMG-R3).    |
| `Image` `aspectRatio="auto"`                        | No `aspect-ratio` style; intrinsic ratio governs (IMG-R5).                                                      |
| `Image` arbitrary ratio `"3/2"`                     | Passed verbatim to `data-aspect-ratio` and the inline `aspect-ratio` style (IMG-R5).                           |
| `Image` `src` 404 / load error                      | `data-state="error"`; placeholder (if color/blur) remains; no throw (IMG-R8).                                  |
| `Image` cached/SSR image (no `load` event)          | `img.complete` check on mount sets `loaded`/`error` so state never sticks on `loading` (IMG-R8).              |
| `Image` `placeholder="blur"` w/o `placeholderSrc`   | Falls back to `none`; dev `console.warn` (IMG-R11).                                                             |
| `Image` reduced-motion                              | Crossfade duration `0`; instant swap (IMG-R12).                                                                 |
| `Video` autoplay w/o muted                          | Autoplay suppressed; dev `console.warn`; native still `muted` if `muted=true` (VID-R6).                        |
| `Video` reduced-motion + autoplay+muted             | Autoplay suppressed (VID-R6).                                                                                   |
| `Video` `controls=false` native                     | No `controls` attr; emits no warning (consumer owns custom UI; out of scope to provide one).                   |
| `Video` malformed/unparseable YouTube/Vimeo URL     | Host matches but no ID extractable → falls back to `data-provider="native"` (raw `src`); dev `console.warn`.   |
| `Video` non-embed URL (e.g. `.mp4`)                 | `data-provider="native"`, `<source>` with the URL (VID-R1/R4).                                                 |
| Either, rest tries to clobber managed attr          | Managed attribute wins (IMG-R14 / VID-R11).                                                                     |
| Long/empty `title` or `alt`                         | Rendered verbatim; no truncation by the component.                                                             |

### Existing Code to Reuse

- **Utils:** `src/lib/utils/index.ts` — `cx` for class composition; `uid` only
  if an internal id is needed (not currently required).
- **Component pattern:** mirror `src/lib/components/Stack.svelte` (scoped
  `<style>` for structural CSS + `data-*`-driven selectors) and
  `src/lib/components/Link.svelte` (`class: className`, `...rest`-first spread).
  Dev warnings use the `import.meta.env.DEV` + `untrack(...)` pattern from
  `src/lib/components/Button.svelte`.
- **Reduced-motion / browser guard:** the `$app/environment` `browser` +
  `window.matchMedia` pattern from `original-specs/00-architecture.md`
  §Animations.
- **Token-with-fallback convention:** per `specs/03-layout.md` §Context
  (structural values reference tokens with literal fallbacks; ship no colors).
- **Barrel + export test:** `src/lib/components/index.ts` and
  `src/lib/exports.spec.ts` (`$lib` block currently asserts Button…Footer — add
  `Image`, `Video`).
- **Test harness:** `src/lib/components/Button.svelte.spec.ts` /
  `Nav.svelte.spec.ts` — Vitest browser mode (`vitest-browser-svelte`:
  `render`, `page.getBy*`, `await expect.element`, `createRawSnippet`,
  `vitest/browser` `userEvent`). `expect.requireAssertions` is on — every test
  asserts.

### Test Plan

Runner: **Vitest** browser project (chromium, Playwright provider) with
`vitest-browser-svelte`. Two spec files:
`src/lib/components/Image.svelte.spec.ts` and
`src/lib/components/Video.svelte.spec.ts` (the `.svelte.spec.ts` suffix routes
them to the browser `client` project per `vite.config.ts`). No Playwright e2e
routes (docs demos are Sprint 4). Reduced-motion branches mock
`window.matchMedia`; exact transition *timing* is not asserted (state-swap
correctness is).

**Image — unit/component (browser):**

- IMG-R1: wrapper `div.hz-image` + single `img.hz-image__img`; data attrs on
  wrapper, `src`/`alt` on img.
- IMG-R2: `alt=""` → `role="presentation"`; non-empty alt → no role.
- IMG-R3: `width`/`height` present → attrs; absent → no attrs.
- IMG-R4: each `loading` value → `img[loading]` + `data-loading` (parametrized
  lazy/eager).
- IMG-R5: each ratio → `data-aspect-ratio` + inline `aspect-ratio` style;
  `'auto'` → no style; arbitrary `'3/2'` passes through.
- IMG-R6: each `fit` → `data-fit`; computed `object-fit` on the img reflects it.
- IMG-R7: `rounded` true/`'md'`/false → `data-rounded` present/`"md"`/absent;
  assert **no** shipped `border-radius` **and no** `overflow` on the wrapper.
- IMG-R8: initial `data-state="loading"`; dispatch `load` → `loaded`; dispatch
  `error` → `error`; mount with a pre-`complete` cached img (e.g. data-URI src)
  → `loaded` without a `load` event.
- IMG-R9/R10/R11: placeholder none → no placeholder layer; color → wrapper
  inline `background-color` while loading + `data-placeholder="color"`; blur with
  `placeholderSrc` → second `img.hz-image__placeholder[aria-hidden=true]` +
  `data-placeholder="blur"`; blur without `placeholderSrc` → behaves as none +
  `console.warn` spy fired.
- IMG-R12: with mocked reduced-motion, the main image is visible immediately on
  `loaded` (no lingering transition); `matchMedia` mocked.
- IMG-R13: no class → `hz-image`; `class="foo bar"` → `hz-image foo bar`
  (order).
- IMG-R14: `...rest` (e.g. `data-testid`) forwarded to img; override attempt on
  `src`/`class` → managed wins.
- IMG-R15: `import { Image } from '$lib'` resolves (in `exports.spec.ts` +
  dedicated test).

**Video — unit/component (browser):**

- VID-R1: parametrized URLs → correct `data-provider` and correct element
  (`iframe` vs `video`): `youtube.com/watch?v=X`, `youtu.be/X`,
  `youtube.com/embed/X`, `vimeo.com/123`, `player.vimeo.com/video/123`,
  `https://cdn/x.mp4`.
- VID-R2: YouTube iframe `src` starts with
  `https://www.youtube-nocookie.com/embed/{id}`; `title`, `loading`, `allow`,
  `allowfullscreen` present; `loop` → `playlist={id}&loop=1`; `controls=false` →
  `controls=0`.
- VID-R3: Vimeo iframe `src` = `https://player.vimeo.com/video/{id}` with
  `dnt=1`; loop/controls params.
- VID-R4: native `<video>` has `aria-label={title}`, nested `<source src>`,
  `controls` default on, `playsinline`, `preload` mapped from `loading`, `poster`
  when set.
- VID-R5: `title` reflected as iframe `title` / native `aria-label`; not visible
  text.
- VID-R6: autoplay+muted (motion allowed, mocked) → autoplay present
  (`autoplay=1`/native `autoplay`+`muted`); autoplay w/o muted → no autoplay +
  `console.warn`; autoplay+muted+reduced-motion (mocked) → no autoplay.
- VID-R7: each ratio → `data-aspect-ratio` + wrapper `aspect-ratio` style.
- VID-R8: native dispatch `play`/`pause`/`ended` → `data-state`
  playing/paused/ended; iframe stays `idle`.
- VID-R9: iframe default `loading="lazy"`; `eager` → `loading="eager"`.
- VID-R10/R11: class composition; `...rest` forwarding + managed-wins.
- VID-R12: `import { Video } from '$lib'` resolves.
- Edge: YouTube host w/ unextractable id → `data-provider="native"` +
  `console.warn`.

### Out of Scope

- Visual styling / the reference theme (border-radius + clipping for `rounded`,
  colors, the `placeholderColor` token's actual value, focus-ring styling, blur
  amount) — Sprint 4.
- `srcset`/`sizes` responsive-source generation, art direction, `<picture>`,
  image CDN/transform integration — `src` is a single URL.
- Automatic low-res placeholder generation (LQIP/BlurHash) — `placeholderSrc` is
  consumer-supplied.
- A custom video control UI, captions/subtitles (`<track>`), chapters, or
  analytics — native `controls` only; `controls=false` hands control entirely to
  the consumer.
- Lazy-mounting the iframe behind a click-to-load poster (façade pattern) —
  `loading="lazy"` only.
- Providers beyond YouTube/Vimeo and arbitrary native sources.
- Docs demo routes and Playwright e2e — Sprint 4.
