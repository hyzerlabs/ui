# Image

Responsive images with lazy loading, aspect ratio control, and placeholder states.

---

## Props

| Prop             | Type                                                     | Default                      |
| ---------------- | -------------------------------------------------------- | ---------------------------- |
| src              | `string`                                                 | _required_                   |
| alt              | `string`                                                 | _required_                   |
| width            | `number \| undefined`                                    | —                            |
| height           | `number \| undefined`                                    | —                            |
| loading          | `'lazy' \| 'eager'`                                      | `'lazy'`                     |
| aspectRatio      | `'auto' \| '1/1' \| '4/3' \| '16/9' \| '21/9' \| string` | `'auto'`                     |
| fit              | `'cover' \| 'contain' \| 'fill' \| 'none'`               | `'cover'`                    |
| rounded          | `boolean \| 'sm' \| 'md' \| 'lg' \| 'full'`              | `false`                      |
| placeholder      | `'blur' \| 'color' \| 'none'`                            | `'none'`                     |
| placeholderSrc   | `string \| undefined`                                    | —                            |
| placeholderColor | `string`                                                 | `'var(--hz-color-gray-200)'` |

## Renders

`<img>` wrapped in a `<div>` for aspect ratio and placeholder control. Decorative images (`alt=""`) get `role="presentation"`.

```html
<div class="hz-image" data-fit="cover" data-rounded="md" data-state="loading">
	<img src="..." alt="..." loading="lazy" width="..." height="..." />
</div>
```

## Data Attributes

- `data-loading="lazy"`, `data-fit="cover"`, `data-rounded="md"`
- `data-state="loading" | "loaded" | "error"` — transitions as the image loads

## Placeholder Behavior

- `none`: no placeholder, image pops in when loaded
- `color`: the wrapper `<div>` shows `placeholderColor` as background until loaded
- `blur`: a low-res `placeholderSrc` is shown blurred, crossfades to full image on load

## Accessibility

- `alt` is **required** at the TypeScript level — consumers must make the conscious choice between descriptive alt text and `alt=""` for decorative images
- When `alt=""`, the component adds `role="presentation"` to signal decorative intent
- `width` and `height` attributes prevent layout shift (CLS)
- Native `loading="lazy"` for below-fold images
