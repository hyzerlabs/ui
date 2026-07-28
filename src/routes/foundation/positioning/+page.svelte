<script lang="ts">
	import { Button } from '$lib';
	import { tooltip } from '$lib';
	import Example from '../../../docs/Example.svelte';

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

<div class="doc-intro">
	<h1>Positioning</h1>
	<p class="doc-description">
		<a href="/components/tooltip">Tooltip</a>, <a href="/components/popover">Popover</a>, and
		<a href="/components/dropdown">Dropdown</a>'s menu all place a floating element next to a
		trigger through the same engine: it prefers CSS anchor positioning where the browser supports
		it, falls back to measuring and placing the element itself elsewhere, and always resolves to
		physical, on-screen placement — flipping at the viewport edge, escaping clipping ancestors, and
		reporting back exactly what it rendered.
	</p>
</div>

<section class="doc-section" aria-labelledby="vocabulary-heading">
	<h2 id="vocabulary-heading">One placement vocabulary</h2>
	<p>
		A placement is a side (<code>top</code>, <code>bottom</code>, <code>left</code>,
		<code>right</code>) with an optional <code>-start</code>/<code>-end</code> alignment — a bare
		side centers on the trigger's cross axis. <a href="/components/tooltip">Tooltip</a> and
		<a href="/components/popover">Popover</a> take the full set, all eight placements, as a
		<code>placement</code> prop. <a href="/components/dropdown">Dropdown</a>'s menu only exposes
		<code>align</code> (<code>start</code>/<code>center</code>/<code>end</code>) — its side is
		managed for you: it opens below the trigger and flips above only when there isn't room, since a
		menu button's menu belongs on the block axis, not wherever a consumer might place it.
	</p>
</section>

<section class="doc-section" aria-labelledby="logical-heading">
	<h2 id="logical-heading">Logical-first, resolved through the trigger</h2>
	<p>
		<code>start</code>/<code>end</code> follow reading direction, the same rule the layout
		primitives' <a href="/foundation/spacing#axes-heading">logical axes</a> follow. Where a
		placement names a physical side directly — <code>left</code>/<code>right</code> — that also
		resolves through direction: under <code>dir="rtl"</code>, <code>left</code> renders on the
		physical right. The direction that matters is the <strong>trigger's</strong>, not the floating
		element's own — a tooltip or panel can be appended somewhere else in the document (so it can sit
		in the top layer), so its own inherited direction can differ from the trigger it's describing.
		Reading the trigger's computed direction directly keeps this correct regardless of where the
		floating element itself lives.
	</p>
</section>

<section class="doc-section" aria-labelledby="toplayer-heading">
	<h2 id="toplayer-heading">The top layer</h2>
	<p>
		Open floating elements render in the <strong>top layer</strong> — a separate layer the browser
		paints above the entire page. Nothing on the page can cover them: not an ancestor's
		<code>overflow: hidden</code>, not a stacking context, not any <code>z-index</code>, however
		large — the top layer isn't part of the z-index contest at all.
	</p>
	<p>
		You never opt into this; Tooltip, Popover, and Dropdown do it automatically wherever the browser
		supports it (Chrome and Edge 114+, Safari 17+, Firefox 125+ — every evergreen browser since
		early 2024). In an older browser they degrade to ordinary
		<code>position: fixed</code> elements, and only there do the
		<a href="/foundation/borders-elevation#z-heading"><code>--hz-z-*</code></a> tokens decide who stacks
		above whom — their tiers are ordered so that fallback matches what the top layer gives you for free.
	</p>
	<p>
		So the practical rule: for these components, stacking is handled — don't reach for
		<code>z-index</code>. Keep the <code>--hz-z-*</code> tokens for floating interfaces you build yourself
		out of ordinary elements (a sticky header, a custom overlay); they remain the page's one shared stacking
		scale, and the top layer simply sits above all of it.
	</p>
</section>

<section class="doc-section" aria-labelledby="flip-heading">
	<h2 id="flip-heading">Automatic flip, live</h2>
	<p>
		The side and alignment you ask for are a request, not a promise — if there isn't room, the
		floating element flips to the opposite side and shifts along the cross axis to stay fully
		on-screen, tracking scroll and resize the whole time it's open. Whatever actually rendered is
		always readable back from <code>data-side</code>/<code>data-align</code> on the floating
		element, resolved after any flip. One thing flipping is <em>not</em>: it reacts to the edges of
		your window, never to a scroll container's — a clipping frame is escaped entirely (that's the
		top layer above), not flipped around.
	</p>
	<p>
		The button below asks for <code>placement: 'top'</code>. Click or <kbd>Tab</kbd> to it — focus holds
		a tooltip open, where hover would let go — then scroll the page: as the button nears the top of your
		window and the room above runs out, the tooltip flips below, and flips back the moment there's room
		above again.
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
		Nothing here ships an arrow — a caret is a visual decision every design system draws
		differently, so it's yours to add. Key it off the resolved <code>[data-side]</code>, and
		protrude it past the edge with a negative inset; because the floating element is
		<code>position: fixed</code> in the top layer, a protruding caret can never grow the document's
		own scrollbar. On <a href="/components/popover">Popover</a> specifically, draw the caret on
		<code>.hz-popover-panel</code> itself — that's also where <code>data-side</code> lives, and the
		panel is deliberately kept <code>overflow: visible</code> so a caret protruding past its edge is
		never clipped. <code>.hz-popover-content</code>, the part that actually scrolls, is the one
		place a caret would get cut off.
	</p>
	<Example code={caretDemoCode}>
		<Button {@attach tooltip({ text: 'Drawn by this page, not the library', class: 'demo-caret' })}>
			Hover for a caret
		</Button>
	</Example>
</section>

<section class="doc-section" aria-labelledby="a11y-heading">
	<h2 id="a11y-heading">Accessibility posture</h2>
	<p>
		Placement never changes DOM order, and DOM order is what decides reading order, focus order, and
		a menu or listbox's roving-tabindex sequence. A flipped tooltip or an end-aligned menu reads and
		tabs through in exactly the same order it would unflipped — flipping is purely visual, decided
		after layout, and never reorders anything a screen reader or keyboard user would notice.
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
