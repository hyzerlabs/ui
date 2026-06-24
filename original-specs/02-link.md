# Link

Accessible navigation links with external tab handling and variant styles.

---

## Props

| Prop        | Type                                      | Default     |
| ----------- | ----------------------------------------- | ----------- |
| href        | `string`                                  | _required_  |
| external    | `boolean`                                 | `false`     |
| variant     | `'default' \| 'subtle' \| 'nav'`          | `'default'` |
| size        | `'sm' \| 'md' \| 'lg'`                    | `'md'`      |
| ariaCurrent | `'page' \| 'step' \| 'true' \| undefined` | —           |
| ariaLabel   | `string \| undefined`                     | —           |

## Slots

- `children` — link text/content
- `iconStart` — icon before content
- `iconEnd` — icon after content

## Renders

`<a>`. External links get `target="_blank" rel="noopener noreferrer"` and an sr-only "(opens in new tab)" announcement.

## Data Attributes

- `data-variant="default"`, `data-size="md"`
- `data-external` when external is true

## Accessibility

- Underline by default — never rely on color alone to indicate a link
- External links announce "(opens in new tab)" to screen readers
- `aria-current` for navigation context (active page, current step)
- Visible `:focus-visible` ring
