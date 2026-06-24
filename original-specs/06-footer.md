# Footer

Multi-column link sections with optional bottom bar for copyright and legal links.

---

## Props

| Prop    | Type                                   | Default     |
| ------- | -------------------------------------- | ----------- |
| columns | `FooterColumn[]`                       | _required_  |
| variant | `'default' \| 'minimal' \| 'bordered'` | `'default'` |

Uses the shared `FooterColumn` and `NavItem` types (see `04-nav-types.md`).

## Slots

- `logo` — brand mark, typically above the columns
- `social` — social media icon links (using Icon components with `ariaLabel`)
- `bottom` — copyright text, legal links, fine print

## Data Attributes

- `data-variant="default"`

## Renders

```html
<footer class="hz-footer" data-variant="default">
	<!-- logo slot -->
	<div class="hz-footer-columns">
		<nav aria-label="{column.title}">
			<h2 class="hz-footer-heading">{column.title}</h2>
			<ul role="list">
				<li><a href="...">...</a></li>
				<li>
					<a href="..." target="_blank" rel="noopener noreferrer">
						... <span class="hz-sr-only">(opens in new tab)</span>
					</a>
				</li>
			</ul>
		</nav>
		<!-- ...more columns -->
	</div>
	<!-- social slot -->
	<!-- bottom slot -->
</footer>
```

## Responsive

Columns use CSS grid. On mobile, columns stack vertically in source order. The `social` slot content wraps naturally as a Cluster.

## Accessibility

- `<footer>` landmark element
- Each column is a `<nav>` with `aria-label` matching its `title`
- External links get `target="_blank"`, `rel="noopener noreferrer"`, and SR announcement
- Social icon links **require** `ariaLabel` — the Icon component enforces this when no visible text is present
- Column headings are `<h2>` by default (appropriate for a page-level footer; configurable if needed)
