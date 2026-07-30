/** Metatags's DocPage inputs. */
import type { ComponentDoc } from './types.js';

export const metatagsDoc: ComponentDoc = {
	importLine: 'import { Metatags } from "@hyzer-labs/ui"',
	props: [
		{
			name: 'siteUrl',
			type: 'string',
			default: '—',
			note: 'Absolute site origin, such as "https://example.com". Any relative url, canonical, or image needs it to resolve to the absolute URL Open Graph requires.'
		},
		{
			name: 'url',
			type: 'string',
			default: '—',
			note: 'This page: a root-relative path ("/pricing") or an absolute URL. In SvelteKit this is page.url.pathname, passed by your own wrapper — see the "Per-site wrapper" demo above.'
		},
		{
			name: 'title',
			type: 'string',
			default: '—',
			note: 'The page title. Composed with siteName into one string shared by <title>, og:title, and twitter:title.'
		},
		{
			name: 'siteName',
			type: 'string',
			default: '—',
			note: "The site's name. Emits og:site_name and is the title suffix."
		},
		{
			name: 'titleSeparator',
			type: 'string',
			default: "' | '",
			note: 'Sits between title and siteName.'
		},
		{
			name: 'description',
			type: 'string',
			default: '—',
			note: 'Sets the description meta tag plus og:description and twitter:description. An empty string counts as unset.'
		},
		{
			name: 'image',
			type: 'string',
			default: '—',
			note: 'Preview image, a path or an absolute URL, resolved the same way as url.'
		},
		{
			name: 'imageAlt',
			type: 'string',
			default: '—',
			note: 'Alt text for the preview image. Setting image without it prints a console warning in development.'
		},
		{
			name: 'type',
			type: 'string',
			default: "'website'",
			note: "Sets og:type, emitted as given with no validation. The Open Graph protocol's type list is the reference; 'article' is the other common one."
		},
		{
			name: 'canonical',
			type: 'string',
			default: 'url',
			note: 'Canonical override for a page reachable at more than one address, path or absolute.'
		},
		{
			name: 'twitterCard',
			type: "'summary' | 'summary_large_image'",
			default: 'derived from image',
			note: 'summary_large_image once an image resolves, summary otherwise.'
		},
		{
			name: 'children',
			type: 'Snippet',
			default: '—',
			note: 'Rendered last, inside the same head block — for tags this component does not manage (twitter:site, robots, JSON-LD, and the rest), not for overriding the ones it does.'
		}
	],
	a11yNote:
		"This component has no ARIA, no roles, and no focus behavior. Nothing here is interactive, but two accessibility duties still apply. `<title>` is the page's accessible name, both in the browser tab and in a screen reader's window list, so this component never emits an empty or invented one: give it a `title`, a `siteName`, or both. `og:image:alt` and `twitter:image:alt` give the preview image a text alternative in every client that shows one, so setting `image` without `imageAlt` prints a development-only warning.\n\nSet a page's title once, either through this component or through the page's own `<svelte:head>`, never both.",
	a11yLinks: [
		{ label: 'The Open Graph protocol', href: 'https://ogp.me/' },
		{
			label: 'X: cards markup reference',
			href: 'https://developer.x.com/en/docs/x-for-websites/cards/overview/markup'
		},
		{
			label: 'Google: consolidate duplicate URLs with canonical links',
			href: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'
		},
		{
			label: 'WCAG 2.4.2: Page Titled',
			href: 'https://www.w3.org/WAI/WCAG21/Understanding/page-titled.html'
		}
	]
};
