# Build Order & Dependencies

Order optimized for dependencies. Later components compose earlier ones.

---

## Dependency Map

```
Icons ──────────────────────────────┐
Utils (cx, uid, contrast) ──────────┤
Tokens (CSS + JS) ──────────────────┤
Types (NavItem, shared types) ──────┤
                                    ▼
Layout (Container, Stack,      ◄── Foundation
        Cluster, Grid, Split)
Button
Link
Image
                    │
                    ▼
Nav ◄────────────── Uses: Link, Button, Container, Icons
Footer ◄────────── Uses: Link, Container, Grid/Stack, Icons
Hero ◄──────────── Uses: Container, Split, Button, Image
Card ◄──────────── Uses: Image, Link, Stack
                    │
                    ▼
Accordion ◄─────── Uses: Icons (native <details>)
Tabs ◄──────────── Standalone
Modal ◄──────────── Uses: Icons, Button (native <dialog>)
Forms ◄──────────── Uses: Icons
Video ◄──────────── Standalone
                    │
                    ▼
Docs site ◄──────── Uses: everything
Theme layer ◄───── Reference styles for all components
```

---

## Sprint Breakdown

### Sprint 1 — Foundation + Primitives

**Goal:** The building blocks everything else composes on.

1. **Tokens** — CSS custom properties + JS exports
2. **Types** — shared NavItem types, Size, Intent, Variant, etc.
3. **Utils** — cx, uid, contrastRatio, meetsContrast, hexToRgb
4. **Icons** — all UI icons + brand icons
5. **Layout Containers** — Container, Stack, Cluster, Grid, Split
6. **Button** — refine from existing
7. **Link** — refine from existing
8. **Image** — responsive, lazy loading, placeholders

After Sprint 1: you can build real page layouts with the library.

### Sprint 2 — Page Structure

**Goal:** A complete page from header to footer.

9. **Nav** — handles simple and nested nav from the same component. Depends on Link, Button, Container, Icons
10. **Footer** — depends on Link, Container, Grid/Stack, Icons
11. **Hero** — depends on Container, Split, Button, Image
12. **Card** — depends on Image, Link, Stack

After Sprint 2: you can build a full landing page.

### Sprint 3 — Interactive + Forms

**Goal:** Every interactive pattern and form input.

13. **Accordion** — native `<details>`, Icons
14. **Tabs** — standalone
15. **Modal** — native `<dialog>`, Icons, Button
16. **Forms** — TextInput, Textarea, Select, Checkbox, Radio, Toggle
17. **Video** — native + YouTube/Vimeo embed

After Sprint 3: the complete component set.

### Sprint 4 — Docs + Theme + Launch

**Goal:** Documentation, reference theme, and publish.

18. **Reference theme** — complete styles for all components using tokens
19. **Docs site** — per-component pages, token tools, guides
20. **Package polish** — README, CHANGELOG, contributing guide, LICENSE
21. **Publish** — npm, GitHub, docs site deployment

---

## Extract → Package → Refactor Workflow

For each component:

1. **Audit** hyzer.sh and heffner.dev for the pattern in use
2. **Extract** the behavior and strip visual CSS
3. **Build** the headless component with full a11y, keyboard support, data attributes
4. **Write** the reference theme styles
5. **Write** the docs page
6. **Refactor** the source site to import from `@hyzer/ui` with site-specific styles
7. **Test** for behavior parity
