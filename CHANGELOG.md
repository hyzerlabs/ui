# Changelog

All notable changes to `@hyzer-labs/ui` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] — 2026-08-05

The config is now where the whole design system is decided. A theme can
carry any token group, not only color. The per-component hooks are
reachable from `hyzer.config.ts`. The contrast bar and the sheet's scope
are config keys, and `hyzer generate --check` reads what is on disk. One
breaking change: the default theme is named `default` rather than `light`,
so `data-theme="light"` no longer selects anything. Add
`defaultThemeName: 'light'` to your config to keep the old name.

### Added

- **A theme is a token override** — `themes.<name>` accepts every group
  `tokens` accepts, so a theme can carry its own type scale, spacing, radii
  or motion rather than only color. `dark` still works without an entry.
- **Per-component theme hooks come from the config** — `tokens.components`
  sets `--hz-button-accent`, `--hz-badge-tint`, `--hz-loading-speed` and the
  rest, camelCased with no `--hz-` prefix. Each component page lists its own
  under Theme hooks.
- **Name the default theme whatever suits your system** — `defaultThemeName`
  renames the `:root` block and the `[data-theme='…']` rule that restores it.
- **Scope the sheet to a class** — `selector` in the config, or `--selector`
  on the command line, roots the whole sheet at a class or id instead of
  `:root`. A region keeps its own palette and still follows the page between
  light and dark. Run the generator once per config for as many scoped
  sheets as you need.
- **The contrast bar is yours to set** — `contrast: { level: 'AAA' }` grades
  against 7:1 instead of 4.5:1, and `strict: true` fails the run on a miss
  without needing the flag. The library's own hues are tuned to AA.
- **Set the density ladder from the config** — `density.ladder` sets the four
  rung values the near/away cascade looks up. A rung you declare in CSS still
  wins.
- **`hyzer generate --check` reads what is on disk.** It compares the token
  sheet, `icons.ts` and the utilities sheet against what a run would write,
  and reports any file that has drifted or was generated for a different mode
  or scope. A file that was never generated is reported but does not fail the
  run, so you can still generate at build time instead of committing the sheet.
- **`hyzer init` writes every option with its real default.** Uncomment any
  line in the scaffolded config to see the value the library actually uses.

### Changed

- **Breaking: the default theme is now named `default`.**
  `data-theme="light"` no longer selects anything, and `[data-theme='default']`
  is the block that re-asserts your default. To keep the old name, add
  `defaultThemeName: 'light'` to `hyzer.config.ts` and regenerate. `dark`
  keeps its name: that one is the platform's, not this library's.
- **Generated files are ASCII-only.** The sheets, `icons.ts` and the
  scaffolded config used to carry em-dashes and other non-ASCII characters in
  their comments, which your linter reads like any other content.

### Fixed

- **`color-scheme` follows the system preference.** On a site that sets no
  `data-theme`, a visitor whose system preferred dark used to get dark tokens
  with `color-scheme: light`. Native scrollbars, form controls and autofill
  stayed light against a dark page.
- **An overrides-mode sheet now carries the dark theme's own value for every
  token it overrides.** Before, a hue you changed under `tokens` with no
  `themes.dark` entry could paint your override on some elements in dark mode
  and the library's default on others. To use your own hue in dark, name it
  under `themes.dark`. Regenerating an existing overrides sheet may add
  declarations to its dark block.
- **The Ocean and Terminal example themes each had a dark pairing below WCAG
  AA** — both are fixed, and the contrast report now grades the color the
  sheet actually paints, so it can see misses like these.
- **The contrast report reads your configured tints.** Setting
  `--hz-badge-tint` or `--hz-alert-tint` used to leave the report grading the
  built-in recipe instead of your value.
- **`hyzer generate` writes beside your config file whether or not you set
  `output`.** With the key absent it used to write into the directory you ran
  the command from, even when it found a config elsewhere. `icons.ts` and the
  default utilities sheet follow the tokens sheet, as before, and `--out` is
  still relative to where you run the command. A sheet written by an earlier
  run stays where it was: delete it, or pass `--out` to keep writing to that
  path.
- **The palette banner no longer claims ramps are unsupported.** The library
  ships none, but a config can nest steps under a hue to generate
  `--hz-palette-<hue>-<step>`.

## [0.6.0] — 2026-08-04

A large round of fixes and additions, found while migrating a real site to
the library. Everything is additive, with no breaking changes.

### Added

- **Every form control hands you its element** — `bind:element` on
  TextInput, Textarea, Select, Checkbox, Toggle, Combobox, Slider,
  ColorInput, FileUpload, and Form; `bind:elementMin` / `bind:elementMax`
  on RangeSlider's two thumbs; `bind:elements` on RadioGroup. Focus a
  field from a keyboard shortcut without reaching into the DOM yourself.
- **Drive the Header drawer from your own code** — `bind:open` reads and
  writes the mobile drawer state, so a router hook can close it on
  navigation. Activating a drawer link closes it on its own.
- **Style nav links in one place** — `itemClass` on Nav puts one class on
  every rendered nav link, and `navItemClass` on Header forwards the same
  class to both of its Navs. An item's own `class` still handles
  exceptions. Footer links read `class` from their items too.
- **Collapse thresholds take a number** — Header's `mobileBreakpoint` and
  Toc's `breakpoint` accept a px number, for sites that have retuned the
  `--hz-width-*` scale. The named tiers stay CSS-only and unchanged. A
  number measures at runtime and falls back to the nearest named tier
  before hydration; an invalid number does nothing and warns in
  development.
- **Toc entries take a snippet** — `entry` replaces a link's content, so
  you can relabel the first entry or mark the current one. Toc keeps the
  `aria-current`, scroll, and URL-hash wiring either way.
- **Two more Split layouts** — `stackBelow="none"` never stacks, and
  `fraction="auto-end"` sizes the last column to its content while the
  first grows, without reversing visual order.
- **Alias the density scale to your own** — four public custom properties
  (`--hz-density-ladder-depth-1` through `-4`) back the `near` and `away`
  distances at each `data-density-shift` level. Override one anywhere and
  every distance built from it follows. The defaults are unchanged, so
  nothing moves until you set a rung. The Spacing docs page has the full
  table.
- Development-only warnings for three silent misuses: a Footer link
  carrying `children` (footer links are a flat list), a blank Footer
  column title, and a Metatags `url`/`canonical`/`image` that looks like a
  host without a scheme (it resolves as a relative path, which makes a
  broken `og:` URL).
- Component docs now say where unlisted props go, on every props table and
  in the `llms-full` endpoints.

### Changed

- **The reference theme fades the Header drawer out** — the same
  `allow-discrete` exit pattern Dropdown and Popover use. Browsers without
  support hide it instantly, as before.

### Fixed

- **A blank Footer column title no longer creates a nameless landmark** —
  the column renders as a plain block (links intact, no empty heading)
  instead of a `<nav aria-label="">`.
- Footer with `columns={[]}` renders no empty grid node.

## [0.5.0] — 2026-08-03

### Added

- **Custom intents work everywhere** — an intent your `hyzer.config.ts` adds
  under `tokens.intent` is now wired into every component that takes an
  intent. `hyzer generate` emits the reference-theme rules for it, so
  `<Badge intent="fairway">` paints with no CSS on your side. camelCase
  names, scoped sheets, and intents added under a named theme are all
  covered. Standalone themes keep authoring their own intent rules, and any
  rule you write yourself still wins over the generated wiring.

### Changed

- **Skeleton animation is calmer** — the default `--hz-skeleton-speed` moved
  from 1.4s to 1.8s. Override the hook to restore the old pace.
- Button, Banner, and Loading now share the same internal intent switch as
  Badge, Alert, and Blockquote. Their public hooks (`--hz-button-accent`,
  `--hz-banner-bg`, `--hz-loading-fill`) are unchanged and still win exactly
  as before.

### Fixed

- **Banner action buttons are legible again** — a `<Button>` in a Banner's
  `actions` snippet now takes the bar's own foreground/background pair, as
  documented. Previously the rule lost to Button's own styles and a solid
  button could sit illegibly on the intent fill.
- Multiple items in a Banner's `actions` snippet now align vertically and
  get a gap between them.

## [0.4.0] — 2026-08-02

### Added

- **`hyzer init`** — scaffolds a starter `hyzer.config.ts`. Every config
  option sits in that one file, commented out, and valid exactly as written.
  Uncomment what you need and run `hyzer generate`. The command refuses to
  overwrite an existing config. The file it writes is the same full reference
  the Config & CLI docs page shows.
- **Svelte CLI add-on** — a new companion package, `@hyzer-labs/sv`, sets up
  a SvelteKit project in one command: `npx sv add @hyzer-labs`. SvelteKit
  projects only. It installs
  `@hyzer-labs/ui`, imports the token and theme stylesheets, and wires them
  into the root layout. It can also scaffold `hyzer.config.ts` and add a
  `hyzer generate --check` gate to your project's `check` script. The add-on
  is Tailwind-aware. Run it alongside or after the `tailwindcss` add-on, and
  it keeps its own imports above Tailwind's. It pins the cascade order with a
  single `@layer` declaration. Options: `config`, `utilities`, and `reset`.
  Skip the reset if you keep Tailwind Preflight.

## [0.3.0] — 2026-08-01

### Added

- **Carousel `interactiveClones`** — an opt-in for looping rails whose cards
  rely on hover. A looping rail draws hidden copies of the cards near the wrap
  seam. By default those copies ignore the mouse, so tooltips and hover styles
  do not fire on them. `interactiveClones` lets hover reach the copies. They
  stay hidden from screen readers either way, so setting the prop is your
  assertion that slide content has no focusable elements. A link or button
  inside a copy would be reachable by keyboard while invisible to assistive
  tech, so development builds warn if they find one.
- **Accordion `meta` snippet** — per-item summary content that lives outside
  the heading: a price, a one-line teaser. It renders between the heading and
  the icon and receives the item, so one shared snippet serves the whole
  accordion. The trigger's accessible name stays the heading text alone. Place
  and style the slot with the new `.hz-accordion-meta` class. Put anything
  essential in the panel or heading as well, and let meta carry the
  visual-forward version of it.
- **Accordion title snippets receive their item** — `title` snippets are now
  called with their item, so a single shared snippet can render every row of a
  data-driven accordion. Existing no-argument snippets keep working unchanged.

### Changed

- **Tooltips, popovers, and dropdown menus animate out** in the reference
  theme — a short fade toward the trigger, skipped under reduced motion. The
  mechanism is plain CSS (`display`/`overlay` transitions with
  `allow-discrete`), so a custom theme can add its own exit animation the same
  way. Browsers without support hide them instantly, as before.

## [0.2.0] — 2026-07-31

### Added

- **Carousel `layout="rail"`** — a multi-visible card rail as a second layout
  on the existing Carousel. The rail is a native horizontal scroll container:
  touch, trackpad, wheel, keyboard, and the scrollbar all work out of the box,
  with a `snap` toggle (on by default), mouse drag-to-scroll, page-by-page
  prev/next buttons, and `loop` support that wraps continuously in both
  directions. Visible card count is controlled with `--hz-carousel-item-width`
  and `--hz-carousel-gap`. The single-slide layout is unchanged and remains
  the default.
- **Parallax + ParallaxLayer** — a layered parallax band driven entirely by
  CSS scroll-driven animations: no scroll listeners, no JavaScript motion.
  Layers take per-layer `x`/`y` travel (props or the `--hz-parallax-x`/`-y`
  custom properties for per-breakpoint tuning), stack behind or in front of
  in-flow content via `z`, and stay static wherever the browser lacks support
  or the visitor prefers reduced motion.
- **HorizontalScroll** — a full-viewport horizontally scrolling shell whose
  direct children flow as panels. The mouse wheel scrolls it sideways by
  default and hands control back to the page at either end (`wheel={false}`
  opts out); optional `snap`; keyboard-operable throughout. Pairs with
  `<Parallax axis="x">` for layers that drift as the shell scrolls.
- **Parallax `axis` prop** — `axis="x"` re-times a band's layers to horizontal
  crossing, so `y` travel becomes a vertical spread while the page (or a
  HorizontalScroll shell) moves sideways.

## [0.1.0] — 2026-07-31

Initial public release: the full component set, headless core with the
layered reference theme, design tokens, and the docs site at
[design.hyzer.sh](https://design.hyzer.sh).

[0.7.0]: https://github.com/hyzerlabs/ui/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/hyzerlabs/ui/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/hyzerlabs/ui/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/hyzerlabs/ui/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/hyzerlabs/ui/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/hyzerlabs/ui/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/hyzerlabs/ui/releases/tag/v0.1.0
