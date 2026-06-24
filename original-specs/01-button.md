# Button

Triggers actions. Supports variants, sizes, loading states, icons, and link rendering.

---

## Props

| Prop      | Type                                        | Default     |
| --------- | ------------------------------------------- | ----------- |
| variant   | `'solid' \| 'outline' \| 'ghost' \| 'link'` | `'solid'`   |
| intent    | `'primary' \| 'secondary' \| 'danger'`      | `'primary'` |
| size      | `'sm' \| 'md' \| 'lg'`                      | `'md'`      |
| disabled  | `boolean`                                   | `false`     |
| loading   | `boolean`                                   | `false`     |
| fullWidth | `boolean`                                   | `false`     |
| href      | `string \| undefined`                       | —           |
| type      | `'button' \| 'submit' \| 'reset'`           | `'button'`  |
| ariaLabel | `string \| undefined`                       | —           |

## Slots

- `children` — button label text/content
- `iconStart` — icon before label
- `iconEnd` — icon after label

## Renders

`<button>` by default. `<a role="button">` when `href` is provided.

## Data Attributes

- `data-variant="solid"`, `data-intent="primary"`, `data-size="md"`
- `data-state="disabled"` or `data-state="loading"` when applicable
- `data-full-width` when fullWidth is true

## Accessibility

- Native `<button>` element
- `aria-disabled` used instead of HTML `disabled` — allows focus for screen readers while preventing activation
- `aria-busy="true"` during loading
- Loading spinner announced via `sr-only` text
- Icon-only buttons require `ariaLabel`
- Visible `:focus-visible` ring
- Min tap targets: 32px (sm), 40px (md), 48px (lg)
