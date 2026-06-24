# Layout Containers

Five layout primitives that everything else sits inside. These are the structural foundation of the library.

---

## Container

Max-width wrapper with horizontal padding.

| Prop    | Type                                     | Default |
| ------- | ---------------------------------------- | ------- |
| max     | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'lg'`  |
| padding | `'none' \| 'sm' \| 'md' \| 'lg'`         | `'md'`  |
| center  | `boolean`                                | `true`  |
| as      | `string`                                 | `'div'` |

Widths: sm=640px, md=768px, lg=1024px, xl=1280px, full=100%.

---

## Stack

Vertical flow with consistent gap.

| Prop  | Type                                             | Default     |
| ----- | ------------------------------------------------ | ----------- |
| gap   | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'`      |
| align | `'start' \| 'center' \| 'end' \| 'stretch'`      | `'stretch'` |
| as    | `string`                                         | `'div'`     |

---

## Cluster

Horizontal wrapping flow. Ideal for groups of buttons, tags, badges.

| Prop    | Type                                         | Default    |
| ------- | -------------------------------------------- | ---------- |
| gap     | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg'`     | `'sm'`     |
| justify | `'start' \| 'center' \| 'end' \| 'between'`  | `'start'`  |
| align   | `'start' \| 'center' \| 'end' \| 'baseline'` | `'center'` |
| wrap    | `boolean`                                    | `true`     |
| as      | `string`                                     | `'div'`    |

---

## Grid

Responsive CSS grid.

| Prop    | Type                                                  | Default                   |
| ------- | ----------------------------------------------------- | ------------------------- |
| columns | `number \| { sm?: number, md?: number, lg?: number }` | `{ sm: 1, md: 2, lg: 3 }` |
| gap     | `'none' \| 'sm' \| 'md' \| 'lg'`                      | `'md'`                    |
| align   | `'start' \| 'center' \| 'end' \| 'stretch'`           | `'stretch'`               |
| as      | `string`                                              | `'div'`                   |

---

## Split

Two-panel layout (sidebar/content, text/media).

| Prop       | Type                                                  | Default |
| ---------- | ----------------------------------------------------- | ------- |
| fraction   | `'1/4' \| '1/3' \| '1/2' \| '2/3' \| '3/4' \| 'auto'` | `'1/2'` |
| gap        | `'none' \| 'sm' \| 'md' \| 'lg'`                      | `'md'`  |
| reverse    | `boolean`                                             | `false` |
| stackBelow | `'sm' \| 'md' \| 'lg'`                                | `'md'`  |
| as         | `string`                                              | `'div'` |

---

## Accessibility (all layout components)

Use the `as` prop to render correct landmark elements: `<section>`, `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`. The components add no ARIA of their own — landmarks carry the semantics.

## Data Attributes

Each layout component uses:

- `class="hz-container"`, `class="hz-stack"`, etc.
- `data-max`, `data-padding`, `data-gap`, `data-align`, `data-columns`, `data-fraction`, `data-stack-below` as applicable
