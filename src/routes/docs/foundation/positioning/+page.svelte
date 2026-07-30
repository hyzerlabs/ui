<script lang="ts">
	import { Button } from '$lib';
	import { tooltip } from '$lib';
	import Example from '../../../../docs/Example.svelte';
	import DocIntro from '../../../../docs/DocIntro.svelte';

	const flipDemoCode = [
		"<Button {@attach tooltip({ text: 'Above until there's no room', placement: 'top' })}>",
		'\tFocus me, then scroll',
		'</Button>'
	].join('\n');

	const caretDemoCode = [
		"<Button {@attach tooltip({ text: 'Drawn by this page, not the library', class: 'demo-caret' })}>",
		'\tHover for a caret',
		'</Button>',
		'',
		'<style>',
		'/* Both elements use the Popover API for the top layer, and the',
		"   browser's default [popover] style makes them scroll containers —",
		'   without this, a protruding caret is clipped inside instead of',
		'   drawn past the edge. (The reference theme already sets it; keep it',
		'   if you style from scratch.) */',
		'.hz-tooltip,',
		'.hz-popover-panel {',
		'\toverflow: visible;',
		'}',
		'',
		'.hz-tooltip::after,',
		'.hz-popover-panel::after {',
		"\tcontent: '';",
		'\tposition: absolute;',
		'\twidth: 0.5rem;',
		'\theight: 0.5rem;',
		'\tbackground: inherit;',
		'\trotate: 45deg;',
		'}',
		'',
		'/* data-side is the resolved, PHYSICAL side (it already accounts for',
		'   flips and reading direction), so the insets and borders below are',
		'   physical too. The negative inset protrudes the caret past the edge;',
		'   it can never grow a scrollbar — the floating element is',
		'   position: fixed in the top layer. Border only the two edges that',
		'   face the trigger. */',
		"[data-side='top']::after {",
		'\tbottom: -0.25rem;',
		'\tleft: 50%;',
		'\ttranslate: -50% 0;',
		'\tborder-right: inherit;',
		'\tborder-bottom: inherit;',
		'}',
		"[data-side='bottom']::after {",
		'\ttop: -0.25rem;',
		'\tleft: 50%;',
		'\ttranslate: -50% 0;',
		'\tborder-top: inherit;',
		'\tborder-left: inherit;',
		'}',
		'</style>'
	].join('\n');
</script>

<svelte:head>
	<title>Positioning — @hyzer-labs/ui</title>
</svelte:head>

<DocIntro>
	{#snippet lead()}
		<a href="/docs/components/tooltip">Tooltip</a>, <a href="/docs/components/popover">Popover</a>,
		and
		<a href="/docs/components/dropdown">Dropdown</a>'s menu all place a floating element next to a
		trigger through the same engine. It prefers CSS anchor positioning where the browser supports
		it, and measures and places the element itself where it does not. Either way it resolves to a
		physical, on-screen placement: flipping at the viewport edge, escaping clipping ancestors, and
		reporting back exactly what it rendered.
	{/snippet}
</DocIntro>

<section class="doc-section" aria-labelledby="vocabulary-heading">
	<h2 id="vocabulary-heading">One placement vocabulary</h2>
	<p>
		A placement is a side (<code>top</code>, <code>bottom</code>, <code>left</code>,
		<code>right</code>) with an optional <code>-start</code>/<code>-end</code> alignment. A bare
		side centers on the trigger's cross axis. <a href="/docs/components/tooltip">Tooltip</a> and
		<a href="/docs/components/popover">Popover</a> take all eight placements as a
		<code>placement</code> prop. <a href="/docs/components/dropdown">Dropdown</a>'s menu exposes
		only
		<code>align</code> (<code>start</code>/<code>center</code>/<code>end</code>), because its side
		is managed for you: it opens below the trigger and flips above only when there is not room. A
		menu button's menu belongs on the block axis, not wherever a consumer might place it.
	</p>
</section>

<section class="doc-section" aria-labelledby="logical-heading">
	<h2 id="logical-heading">Logical-first, resolved through the trigger</h2>
	<p>
		<code>start</code>/<code>end</code> follow reading direction, the same rule the layout
		primitives' <a href="/docs/foundation/spacing#axes-heading">logical axes</a> follow. Where a
		placement names a physical side directly (<code>left</code>/<code>right</code>) that also
		resolves through direction: under <code>dir="rtl"</code>, <code>left</code> renders on the
		physical right. The direction that matters is the <strong>trigger's</strong>, not the floating
		element's own. A tooltip or panel can be appended somewhere else in the document so it can sit
		in the top layer, so its own inherited direction can differ from the trigger it is describing.
		Reading the trigger's computed direction directly keeps placement correct wherever the floating
		element itself lives.
	</p>
</section>

<section class="doc-section" aria-labelledby="toplayer-heading">
	<h2 id="toplayer-heading">The top layer</h2>
	<p>
		Open floating elements render in the <strong>top layer</strong>, a separate layer the browser
		paints above the whole page. Nothing on the page can cover them: not an ancestor's
		<code>overflow: hidden</code>, not a stacking context, not any <code>z-index</code>, however
		large. The top layer is not part of the z-index contest at all.
	</p>
	<p>
		You never opt into this. Tooltip, Popover, and Dropdown use the top layer wherever the browser
		supports it (Chrome and Edge 114+, Safari 17+, Firefox 125+, so every evergreen browser since
		early 2024). In an older browser they fall back to ordinary <code>position: fixed</code>
		elements, and only there do the
		<a href="/docs/foundation/borders-elevation#z-heading"><code>--hz-z-*</code></a> tokens decide who
		stacks above whom. Their tiers are ordered so that fallback matches what the top layer gives you for
		free.
	</p>
	<p>
		The practical rule: for these components, stacking is handled, so do not reach for
		<code>z-index</code>. Keep the <code>--hz-z-*</code> tokens for floating interfaces you build yourself
		out of ordinary elements, like a sticky header or a custom overlay. They remain the page's one shared
		stacking scale, and the top layer sits above all of it.
	</p>
</section>

<section class="doc-section" aria-labelledby="flip-heading">
	<h2 id="flip-heading">Automatic flip, live</h2>
	<p>
		The side and alignment you ask for are a request, not a promise. If there is not room on the
		side you asked for, the floating element flips to the opposite side, and it keeps re-checking as
		you scroll and resize for as long as it is open. The side that actually rendered is readable
		back from
		<code>data-side</code> on the floating element, re-stamped from real geometry every time it
		flips.
		<code>data-align</code> reports the alignment your logical request resolved to, which flipping never
		changes. Flipping answers to the edges of your window, never to a scroll container's: a clipping frame
		is escaped entirely by the top layer, not flipped around.
	</p>
	<p>
		Flipping is the behavior both paths share, and it is deliberately the only one promised. Where
		CSS anchor positioning is available, the browser does the work through
		<code>position-try-fallbacks</code>, which offers a flip and nothing else. The JavaScript
		fallback, used where anchor positioning is not supported, also nudges the element back inside
		the window when a flip alone still leaves it hanging over an edge. So the fallback is slightly
		more forgiving at an extreme edge, and the modern path is the one that stays correct without
		script. Progressive enhancement, in the honest direction: the shared behavior is what the docs
		promise, and neither path ever leaves a floating element unusable.
	</p>
	<p>
		The button below asks for <code>placement: 'top'</code>. Click it or <kbd>Tab</kbd> to it, since focus
		holds a tooltip open where hover would let go. Then scroll the page: as the button nears the top of
		your window and the room above runs out, the tooltip flips below, and flips back the moment there
		is room above again.
	</p>
	<Example code={flipDemoCode}>
		<!-- Explicit focus on click: not every browser focuses a button on
		     click (Safari/Firefox don't), and focus is what holds the tooltip
		     open for the scroll-to-flip walkthrough. -->
		<Button
			onclick={(e: MouseEvent) => (e.currentTarget as HTMLElement).focus()}
			{@attach tooltip({ text: 'Above until there’s no room', placement: 'top' })}
		>
			Focus me, then scroll
		</Button>
	</Example>
</section>

<section class="doc-section" aria-labelledby="caret-heading">
	<h2 id="caret-heading">Draw your own caret</h2>
	<p>
		Nothing here ships an arrow. A caret is a visual decision every design system draws differently,
		so it is yours to add. Key it off the resolved <code>[data-side]</code>, and push it past the
		edge with a negative inset. The floating element is <code>position: fixed</code> in the top
		layer, so a protruding caret can never grow the document's own scrollbar. On
		<a href="/docs/components/popover">Popover</a>, draw the caret on
		<code>.hz-popover-panel</code> itself. That is where <code>data-side</code> lives, and the panel
		is kept <code>overflow: visible</code> so a caret protruding past its edge is never clipped.
		<code>.hz-popover-content</code>, the part that actually scrolls, is the one place a caret would
		get cut off.
	</p>
	<Example code={caretDemoCode}>
		<Button {@attach tooltip({ text: 'Drawn by this page, not the library', class: 'demo-caret' })}>
			Hover for a caret
		</Button>
	</Example>
</section>

<section class="doc-section" aria-labelledby="a11y-heading">
	<h2 id="a11y-heading">What placement means for accessibility</h2>
	<p>
		Placement never changes DOM order, and DOM order is what decides reading order, focus order, and
		a menu or listbox's roving-tabindex sequence. A flipped tooltip or an end-aligned menu reads and
		tabs through in exactly the same order it would unflipped. Flipping is visual only, decided
		after layout, and it never reorders anything a screen reader or keyboard user would notice.
	</p>
	<p>
		The top layer is what makes that true. Because a floating element is promoted out of the normal
		flow rather than moved in the DOM, it can escape a clipping ancestor without its content moving
		anywhere a keyboard user would have to hunt for it. It is also what keeps a tooltip or menu from
		being covered by whatever it opened over, which is the substance of
		<a href="https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html"
			>WCAG 2.4.11</a
		>. Two criteria bear on this directly: a tooltip must stay hoverable and dismissible while it is
		open (1.4.13), and a flipped element must not become the only way to tell two states apart
		(1.4.1).
	</p>
	<p class="a11y-refs">
		References:
		<a href="https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html"
			>WCAG 1.4.13 Content on Hover or Focus</a
		>
		·
		<a href="https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html"
			>WCAG 2.4.11 Focus Not Obscured</a
		>
		·
		<a href="https://developer.mozilla.org/en-US/docs/Glossary/Top_layer">MDN: Top layer</a>
		·
		<a href="https://developer.mozilla.org/en-US/docs/Web/API/Popover_API">MDN: Popover API</a>
		·
		<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning"
			>MDN: CSS anchor positioning</a
		>
		·
		<a href="https://caniuse.com/css-anchor-positioning">Can I Use: CSS anchor positioning</a>
		·
		<a href="https://caniuse.com/mdn-html_global_attributes_popover">Can I Use: popover</a>
	</p>
</section>

<style>
	/* Tooltips are top-layer, but keep the example frames overflow-visible so
	   a demo button's focus ring (a box-shadow) is never clipped at an edge. */
	:global(.doc-example) {
		overflow: visible;
	}

	p {
		margin: 0;
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
		font-size: 0.875em;
	}

	.doc-section {
		display: flex;
		flex-direction: column;
		gap: var(--hz-space-near, 0.75rem);
		margin-block-start: var(--hz-space-away, 2rem);
	}

	/* The caret demo — exactly the recipe from the CodeBlock above, scoped
	   to this page's .demo-caret tooltip. Global: the tooltip node is
	   body-appended, outside this component's scope. */
	:global(.hz-tooltip.demo-caret) {
		overflow: visible;
	}

	:global(.hz-tooltip.demo-caret::after) {
		content: '';
		position: absolute;
		width: 0.5rem;
		height: 0.5rem;
		background: inherit;
		rotate: 45deg;
	}

	:global(.hz-tooltip.demo-caret[data-side='top']::after) {
		bottom: -0.25rem;
		left: 50%;
		translate: -50% 0;
		border-right: inherit;
		border-bottom: inherit;
	}

	:global(.hz-tooltip.demo-caret[data-side='bottom']::after) {
		top: -0.25rem;
		left: 50%;
		translate: -50% 0;
		border-top: inherit;
		border-left: inherit;
	}
</style>
