# Changelog

All notable changes to `@hyzer-labs/ui` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.2.0]: https://github.com/hyzerlabs/ui/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/hyzerlabs/ui/releases/tag/v0.1.0
