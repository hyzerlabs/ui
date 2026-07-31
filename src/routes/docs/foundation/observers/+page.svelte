<script lang="ts">
	import { Alert, CodeBlock } from '$lib';
	import { intersect, resize, mutate, announce } from '$lib/observers';
	import Example from '../../../../docs/Example.svelte';
	import DocIntro from '../../../../docs/DocIntro.svelte';
	import IconInfo from '$lib/icons/generated/info.svelte';

	// -------------------------------------------------------------------------
	// Intersect — a scrollable pane with a sentinel BETWEEN two lists (content
	// above and below), so it toggles in and out as you scroll past it. A live
	// `isIntersecting` drives the floating corner badge (both directions);
	// crossing INTO view also bumps a counter and announces — doubling as the
	// "announce wired to an observer" example below.
	// -------------------------------------------------------------------------
	let intersectPaneEl = $state<HTMLElement | null>(null);
	let revealCount = $state(0);
	let sentinelIntersecting = $state(false);

	function onSentinelIntersect(entry: IntersectionObserverEntry) {
		sentinelIntersecting = entry.isIntersecting;
		if (!entry.isIntersecting) return;
		revealCount += 1;
		announce(`Sentinel revealed ${revealCount} time${revealCount === 1 ? '' : 's'}`);
	}

	const intersectCode = [
		"import { intersect, announce } from '@hyzer-labs/ui/observers';",
		'',
		'let intersecting = $state(false);',
		'let count = $state(0);',
		'',
		"<span>Is intersecting: {intersecting ? 'yes' : 'no'}</span>",
		'',
		'<div',
		'\tclass="sentinel"',
		'\t{@attach intersect((entry) => {',
		'\t\tintersecting = entry.isIntersecting; // fires BOTH ways',
		'\t\tif (!entry.isIntersecting) return;',
		'\t\tcount += 1;',
		'\t\tannounce(`Revealed ${count} times`);',
		'\t}, { root: paneEl, threshold: 0.6 })}',
		'>',
		'\tScroll me in and out of view',
		'</div>'
	].join('\n');

	// -------------------------------------------------------------------------
	// Resize — a drag-resizable box reporting its own live width/height.
	// -------------------------------------------------------------------------
	let resizeSize = $state({ width: 0, height: 0 });

	function onResize(entry: ResizeObserverEntry) {
		const box = entry.borderBoxSize?.[0];
		resizeSize = box
			? { width: Math.round(box.inlineSize), height: Math.round(box.blockSize) }
			: {
					width: Math.round(entry.contentRect.width),
					height: Math.round(entry.contentRect.height)
				};
	}

	const resizeCode = [
		"import { resize } from '@hyzer-labs/ui/observers';",
		'',
		'<div',
		'\t{@attach resize((entry) => {',
		'\t\tconst box = entry.borderBoxSize?.[0];',
		'\t\twidth = box?.inlineSize ?? entry.contentRect.width;',
		'\t\theight = box?.blockSize ?? entry.contentRect.height;',
		"\t}, { box: 'border-box' })}",
		'>',
		'\t{width} &times; {height}px',
		'</div>'
	].join('\n');

	// -------------------------------------------------------------------------
	// Mutate — a contenteditable region. This is the case `$state` can't
	// cover: the browser mutates this DOM directly on user input (typing,
	// pasting), so there is no bound reactive value for a component to react
	// to — the DOM itself is the only source of truth, and mutate is how you
	// watch it. debounce coalesces the burst of individual character
	// mutations a fast typist produces into one callback after a quiet
	// period, the same option Toc uses for its own arbitrary child content.
	// -------------------------------------------------------------------------
	let editorEl = $state<HTMLElement | null>(null);
	let editorWordCount = $state(0);
	let editorEdited = $state(false);

	function countWords(text: string): number {
		const trimmed = text.trim();
		return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
	}

	function onEditorMutate() {
		editorEdited = true;
		editorWordCount = countWords(editorEl?.textContent ?? '');
	}

	const mutateCode = [
		"import { mutate } from '@hyzer-labs/ui/observers';",
		'',
		'<!-- The browser mutates this DOM directly on user input. There is no',
		'     $state bound to it, so mutate is what notices the change. -->',
		'<div',
		'\tcontenteditable="true"',
		'\t{@attach mutate(() => {',
		'\t\twordCount = countWords(editorEl.textContent);',
		'\t}, { childList: true, characterData: true, subtree: true, debounce: 150 })}',
		'></div>'
	].join('\n');

	// -------------------------------------------------------------------------
	// Announce — standalone politeness control, plus the intersect demo above
	// already wires a call into its callback.
	// -------------------------------------------------------------------------
	let announceLog = $state<string[]>([]);

	function announceStatus() {
		const message = `Update ${announceLog.length + 1} of 5 processed`;
		announceLog = [...announceLog, message];
		announce(message);
	}

	function announceAlert() {
		const message = 'Connection lost. Retrying…';
		announceLog = [...announceLog, message];
		announce(message, { assertive: true });
	}

	const announceCode = [
		"import { announce } from '@hyzer-labs/ui/observers';",
		'',
		"announce('Loaded 20 more results');",
		"announce('Connection lost. Retrying…', { assertive: true });"
	].join('\n');

	// -------------------------------------------------------------------------
	// Reduced motion compose pattern (code fence only — no live demo; the
	// pattern is generic, not tied to one of the three attachments above).
	// -------------------------------------------------------------------------
	const reducedMotionCode = [
		"import { intersect } from '@hyzer-labs/ui/observers';",
		"import { prefersReducedMotion } from 'svelte/motion';",
		'',
		'{@attach intersect((entry) => {',
		'\tif (!entry.isIntersecting) return;',
		'\tif (prefersReducedMotion.current) {',
		"\t\tel.classList.add('is-visible'); // appear instantly, no animation",
		'\t} else {',
		"\t\tel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'forwards' });",
		'\t}',
		'})}'
	].join('\n');
</script>

<svelte:head>
	<title>Observers — @hyzer-labs/ui</title>
</svelte:head>

<DocIntro>
	{#snippet lead()}
		<code>@hyzer-labs/ui/observers</code> wraps the three platform observer APIs (<code
			>IntersectionObserver</code
		>, <code>ResizeObserver</code>, <code>MutationObserver</code>) as Svelte attachments:
		<code>intersect</code>, <code>resize</code>, <code>mutate</code>. Each one creates its observer
		when the element mounts and disconnects it when the element is removed, so there is no setup or
		teardown to write yourself. All three also take <code>{'{ once: true }'}</code> to disconnect
		after the first delivery. The module also exports <code>announce</code>, which sends a message
		to a visually hidden live region. It pairs well with an observer callback that has just loaded
		more content or spotted a change.
	{/snippet}
</DocIntro>

<section class="doc-section" aria-labelledby="intersect-heading">
	<h2 id="intersect-heading">Intersect</h2>
	<p>
		<code>intersect(callback, options)</code> creates one <code>IntersectionObserver</code> and
		passes
		<code>root</code>, <code>rootMargin</code>, and <code>threshold</code> straight through. Your
		callback runs with the entry <em>every</em> time the observer fires, on the way
		<strong>in</strong>
		and on the way <strong>out</strong>. The sentinel sits between two lists, so scroll it in and
		out: the corner badge tracks <code>isIntersecting</code> live in both directions, and crossing into
		view sends an announcement.
	</p>
	<Example code={intersectCode}>
		<div class="intersect-demo">
			<span class="intersect-status" data-intersecting={sentinelIntersecting}>
				Is intersecting: {sentinelIntersecting ? 'yes' : 'no'}
			</span>
			<div class="intersect-pane" bind:this={intersectPaneEl}>
				<ul class="intersect-list">
					{#each Array.from({ length: 8 }, (_, i) => i + 1) as n (n)}
						<li>Result {n}</li>
					{/each}
				</ul>
				{#if intersectPaneEl}
					<div
						class="intersect-sentinel"
						{@attach intersect(onSentinelIntersect, { root: intersectPaneEl, threshold: 0.6 })}
					>
						{revealCount === 0
							? 'Scroll down to reveal me'
							: `Revealed ${revealCount} time${revealCount === 1 ? '' : 's'}`}
					</div>
				{/if}
				<ul class="intersect-list">
					{#each Array.from({ length: 8 }, (_, i) => i + 9) as n (n)}
						<li>Result {n}</li>
					{/each}
				</ul>
			</div>
		</div>
	</Example>
	<p class="tab-note">
		The observer delivers an initial entry as soon as it starts watching, and that entry may report
		<code>isIntersecting: false</code>. That is expected, and it is not filtered out.
		<code>{'{ once: true }'}</code>
		disconnects after the first entry that actually intersects, never on that initial report.
	</p>
</section>

<section class="doc-section" aria-labelledby="resize-heading">
	<h2 id="resize-heading">Resize</h2>
	<p>
		<code>resize(callback, options)</code> creates one <code>ResizeObserver</code> and reports the observed
		box back to you on every delivery. Drag the corner below, or resize your window: the readout tracks
		the element's own live dimensions.
	</p>
	<Example code={resizeCode}>
		<div class="resize-demo" {@attach resize(onResize, { box: 'border-box' })}>
			<p class="resize-readout">{resizeSize.width} &times; {resizeSize.height}px</p>
			<p class="resize-hint">Drag the bottom-right corner to resize me.</p>
		</div>
	</Example>
</section>

<section class="doc-section" aria-labelledby="mutate-heading">
	<h2 id="mutate-heading">Mutate</h2>
	<p>
		<code>mutate(callback, options)</code> creates one <code>MutationObserver</code> and passes the
		native <code>MutationObserverInit</code> straight to <code>observe()</code>. Your callback
		receives the whole array of <code>MutationRecord</code>s for that delivery, not a single entry,
		because one delivery is inherently multi-record. Reach for it when the DOM you care about
		changes for reasons your component does not control. There is no
		<code>$state</code> to bind against, so an observer is the only way to notice. The region below
		is
		<code>contenteditable</code>: type or paste into it and the browser mutates its text nodes
		directly, with no Svelte reactivity involved. <code>debounce</code> gathers the burst of
		character mutations a fast typist produces into one callback after a quiet period.
		<a href="/docs/components/toc">Toc</a> uses the same option, so it does not re-collect its headings
		on every change inside content it does not own either.
	</p>
	<Example code={mutateCode}>
		<div
			class="mutate-editor"
			contenteditable="true"
			role="textbox"
			aria-multiline="true"
			aria-label="Editable notes"
			data-placeholder="Type or paste here. I'll count your words."
			bind:this={editorEl}
			{@attach mutate(onEditorMutate, {
				childList: true,
				characterData: true,
				subtree: true,
				debounce: 150
			})}
		></div>
		<p>
			Word count: <strong>{editorWordCount}</strong>
			{editorEdited ? '(edited)' : '(unedited)'}
		</p>
	</Example>
</section>

<section class="doc-section" aria-labelledby="announce-heading">
	<h2 id="announce-heading">Announce</h2>
	<p>
		<code>announce(message, options)</code> writes your message into a visually hidden live region.
		It creates two regions the first time you call it, one polite and one assertive, then reuses
		them. Use <code>{'{ assertive: true }'}</code> for genuine interruptions; everything else should stay
		polite. It never moves focus and adds no role, so you can call it from anywhere, including an observer
		callback. The sentinel above calls it on every reveal. Try the buttons below with a screen reader
		running. The log underneath echoes what was sent, for sighted reference; the live region itself is
		off-screen.
	</p>
	<Example code={announceCode}>
		<div class="announce-controls">
			<button type="button" class="demo-trigger" onclick={announceStatus}>
				Announce status (polite)
			</button>
			<button type="button" class="demo-trigger" onclick={announceAlert}>
				Announce alert (assertive)
			</button>
		</div>
		{#if announceLog.length > 0}
			<ul class="announce-log">
				{#each announceLog as message, i (i)}
					<li>{message}</li>
				{/each}
			</ul>
		{/if}
	</Example>
</section>

<section class="doc-section" aria-labelledby="reduced-motion-heading">
	<h2 id="reduced-motion-heading">Reduced motion</h2>
	<p>
		None of the three attachments read <code>prefers-reduced-motion</code> themselves. An observer
		firing is not motion, and plenty of uses (lazy-loading, analytics, a live width readout) should
		keep working for a reader who prefers less animation. If you are building your own
		observer-driven motion, guard the animation inside the callback with
		<code>svelte/motion</code>'s
		<code>prefersReducedMotion</code>, the same mechanism
		<a href="/docs/foundation/motion#reveal-heading"><code>revealGroup</code></a> and
		<a href="/docs/components/toc">Toc</a> already use:
	</p>
	<CodeBlock code={reducedMotionCode} />
	<Alert intent="info">
		{#snippet icon()}<IconInfo />{/snippet}
		Scroll entrances that already handle reduced motion live in
		<a href="/docs/foundation/motion"><code>@hyzer-labs/ui/motion</code></a>. Reach for
		<code>reveal</code> or <code>revealGroup</code> there before reaching for raw
		<code>intersect</code>, unless you need something they do not offer.
	</Alert>
</section>

<style>
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

	.tab-note {
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.demo-trigger {
		padding: 0.375rem 1rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	.demo-trigger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.intersect-demo {
		position: relative;
	}

	/* Floats over the pane's top-right corner (outside the scroll flow) so it
	 * stays visible while scrolling, tracking isIntersecting live. */
	.intersect-status {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		z-index: 1;
		padding: 0.125rem 0.5rem;
		border-radius: var(--hz-radius-full, 9999px);
		font-size: var(--hz-font-size-sm, 0.875rem);
		font-weight: var(--hz-font-weight-medium, 500);
		background-color: var(--hz-color-surface, #fff);
		border: 1px solid var(--hz-color-border, #6b7280);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.intersect-status[data-intersecting='true'] {
		background-color: var(--hz-intent-success, #15803d);
		border-color: var(--hz-intent-success, #15803d);
		color: var(--hz-color-surface, #fff);
	}

	.intersect-pane {
		height: 12rem;
		overflow-y: auto;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 0.75rem;
	}

	.intersect-list {
		margin: 0 0 0.75rem;
		padding-inline-start: 1.25rem;
	}

	.intersect-sentinel {
		padding: 1rem 0.75rem;
		border: 1px dashed var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		text-align: center;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.resize-demo {
		/* No max-width — the box tracks its container's own inline size 1:1, so
		 * it visibly reports a new width as the pane reflows across
		 * breakpoints, not just when manually drag-resized. */
		width: 100%;
		min-width: 8rem;
		min-height: 6rem;
		resize: both;
		overflow: auto;
		padding: 1rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		background-color: var(
			--hz-color-surface-muted,
			color-mix(in srgb, var(--hz-intent-neutral, #6b7280) 6%, var(--hz-color-surface, #fff))
		);
	}

	.resize-readout {
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	.resize-hint {
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.announce-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.mutate-editor {
		min-height: 4rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
	}

	.mutate-editor:focus-visible {
		outline: 2px solid var(--hz-intent-primary, #2563eb);
		outline-offset: 2px;
	}

	.mutate-editor:empty::before {
		content: attr(data-placeholder);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.announce-log {
		margin: 0;
		padding-inline-start: 1.25rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
