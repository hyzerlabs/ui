# Changelog

All notable changes to `@hyzer-labs/ui` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.3.0]: https://github.com/hyzerlabs/ui/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/hyzerlabs/ui/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/hyzerlabs/ui/releases/tag/v0.1.0
