<script lang="ts">
	import { Stack, Grid, Cluster, Badge, Alert, Button } from '$lib';
	import IconTriangleAlert from '$lib/icons/generated/triangle-alert.svelte';
	import { palette, color, intent } from '$lib/tokens';
	import CodeBlock from '../../../docs/CodeBlock.svelte';

	// The docs shell's own theme toggle, verbatim — the Dark mode section
	// shows the real thing (src/routes/+layout.svelte), not an idealization.
	const toggleCode = [
		"import { Button } from '@hyzer-labs/ui';",
		"import IconSun from '@hyzer-labs/ui/icons/sun';",
		"import IconMoon from '@hyzer-labs/ui/icons/moon';",
		'',
		'let dark = $state(false);',
		'',
		'// An explicit stored choice wins; with no stored key, follow the system.',
		'$effect(() => {',
		"\tconst stored = localStorage.getItem('hz-theme');",
		"\tdark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;",
		'});',
		'$effect(() => {',
		"\tif (dark) document.documentElement.setAttribute('data-theme', 'dark');",
		"\telse document.documentElement.removeAttribute('data-theme');",
		'});',
		'',
		'// Storage is only written on an actual toggle, so "follow the system"',
		"// stays live until the user chooses — 'light' is stored explicitly.",
		'function toggleTheme() {',
		'\tdark = !dark;',
		"\tlocalStorage.setItem('hz-theme', dark ? 'dark' : 'light');",
		'}',
		'',
		'<Button',
		'\tvariant="ghost"',
		'\tintent="neutral"',
		"\tariaLabel={dark ? 'Switch to light theme' : 'Switch to dark theme'}",
		'\taria-pressed={dark}',
		'\tonclick={toggleTheme}',
		'>',
		'\t{#snippet iconStart()}',
		'\t\t{#if dark}<IconSun />{:else}<IconMoon />{/if}',
		'\t{/snippet}',
		'</Button>'
	].join('\n');

	// R7 — derive palette and role tokens from metadata; never hardcoded
	// (specs/42 R1 — classification is by which export a token lives in, not
	// by value shape: `palette` is Layer 1, `color` is Layer 2 roles.)

	type ColorEntry = { key: string; cssVar: string; value: string };

	/**
	 * Convert a camelCase key to kebab-case for CSS var construction.
	 * e.g. "textMuted" → "text-muted"
	 */
	function toKebab(s: string): string {
		return s.replace(/([A-Z])/g, '-$1').toLowerCase();
	}

	/** Extract string-valued entries (skip the nested `theme` object). */
	function colorEntries(obj: Record<string, unknown>, prefix: string): ColorEntry[] {
		return Object.entries(obj)
			.filter(([, v]) => typeof v === 'string')
			.map(([key, value]) => ({
				key,
				cssVar: `${prefix}-${toKebab(key)}`,
				value: value as string
			}));
	}

	// Layer 1 — every raw hue in the `palette` export.
	const paletteTokens = colorEntries(palette, '--hz-palette');

	// Layer 2 — the seven structural roles in the `color` export: surface,
	// surfaceMuted, text, textMuted, border, plus the black/white anchor
	// aliases (specs/42 R1).
	const roleTokens = colorEntries(color, '--hz-color');

	// The dark block, combined for display: role overrides (surface,
	// surface-muted, text) from `color.theme.dark`, then palette companions
	// (every hue lightens) from `palette.theme.dark`. black/white appear in
	// neither — they are the deliberately mode-invariant anchors.
	const darkTokens: ColorEntry[] = [
		...Object.entries(color.theme.dark).map(([key, value]) => ({
			key,
			cssVar: `--hz-color-${toKebab(key)}`,
			value
		})),
		...Object.entries(palette.theme.dark).map(([key, value]) => ({
			key,
			cssVar: `--hz-palette-${toKebab(key)}`,
			value
		}))
	];

	/** The dark theme's re-authored value for a ROLE key, if it has one.
	 * Drives the mode-aware labels in the structural-roles table — only
	 * surface/surfaceMuted/text re-author; black/white deliberately don't. */
	function darkValueFor(key: string): string | undefined {
		return (color.theme.dark as Record<string, string>)[key];
	}

	/** The dark-mode hex companion for a PALETTE key, if the dark theme
	 * re-authors one (black/white have no companion at all). Drives the
	 * mode-aware hex labels on the palette cards. */
	function darkHexFor(key: string): string | undefined {
		return (palette.theme.dark as Record<string, string>)[key];
	}

	// R7 — the intent role tokens, derived from metadata.
	const intentNotes: Record<string, string> = {
		neutral: 'The default — no particular status.',
		primary: 'The brand action.',
		secondary: 'The supporting accent.',
		danger: 'Destructive actions and error states.',
		warning: 'Caution; not yet a failure.',
		success: 'A completed or valid outcome.',
		info: 'Neutral supplementary information.'
	};

	const intentRows = Object.entries(intent).map(([key, target]) => ({
		intent: key,
		cssVar: `--hz-intent-${key}`,
		target,
		note: intentNotes[key] ?? ''
	}));
</script>

<svelte:head>
	<title>Colors & Intent — @hyzer-labs/ui</title>
</svelte:head>

<Stack gap="away">
	<div class="doc-intro">
		<h1>Colors & Intent</h1>
		<p class="doc-description">
			A two-layer color model, and the CSS namespace says which layer you're in. The palette (Layer
			1, <code>--hz-palette-*</code>) is single-value hues authored per mode. The semantic role
			layer (Layer 2, <code>--hz-color-*</code> and <code>--hz-intent-*</code>) is pure
			<code>var()</code>
			references into it — structural roles for what a color <em>does</em> in the layout, and the
			<a href="#intent">intent vocabulary</a> for what a color <em>means</em>. Dark theme overrides
			land mostly on Layer 1; everything in Layer 2 chains through automatically.
		</p>
	</div>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="palette-heading"
	>
		<h2 id="palette-heading">Palette tokens</h2>
		<p>
			<code>--hz-palette-*</code> — these tokens ship fixed values. Override them to retheme the
			entire palette at once. Components and the reference theme never read these directly (see the
			doctrine note below) — this page and
			<a href="/foundation/contrast">Contrast &amp; Accessibility</a> are the exception, building and
			grading the raw names for review.
		</p>
		<Grid columns={{ sm: 2, md: 3, lg: 4 }} gap="sm">
			{#each paletteTokens as token (token.cssVar)}
				<div class="color-card">
					<!-- Painted from the live token (not the authored hex) so the swatch
					     follows the site's mode toggle; the visible hex label switches
					     with it via the mode-only spans below. Decorative — the labels
					     carry the values. -->
					<div
						class="swatch"
						style="background-color: var({token.cssVar}, {token.value})"
						aria-hidden="true"
					></div>
					<div class="color-meta">
						<code class="var-name">{token.cssVar}</code>
						{#if darkHexFor(token.key)}
							<code class="var-value mode-light">{token.value}</code>
							<code class="var-value mode-dark">{darkHexFor(token.key)}</code>
						{:else}
							<code class="var-value">{token.value}</code>
						{/if}
					</div>
				</div>
			{/each}
		</Grid>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="roles-heading"
	>
		<h2 id="roles-heading">Semantic roles & intent</h2>
		<p>
			Components never reference the palette directly — they resolve through role tokens, the single
			indirection point a theme overrides. Roles come in two families: structural roles (<code
				>--hz-color-*</code
			>) name what a color <em>does</em> in the layout, and intent roles (<code>--hz-intent-*</code
			>) name what a color <em>means</em>.
		</p>
		<h3 id="structural-roles">Structural roles</h3>
		<p>
			Seven roles: <code>surface</code>, <code>surfaceMuted</code>, <code>text</code>,
			<code>textMuted</code>, and <code>border</code> flip or track the palette per mode as the
			table below shows; <code>black</code> and <code>white</code> are mode-invariant alias roles.
		</p>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Token</th>
						<th scope="col">Value</th>
						<th scope="col">Swatch</th>
					</tr>
				</thead>
				<tbody>
					{#each roleTokens as token (token.cssVar)}
						<tr>
							<td><code>{token.cssVar}</code></td>
							<!-- Roles the dark theme re-authors (surface, surface-muted, text)
							     show the value for the mode you're looking at; the rest — including
							     the black/white anchors, which never re-author — are the same
							     var() chain in both modes. -->
							<td>
								{#if darkValueFor(token.key)}
									<code class="mode-light">{token.value}</code>
									<code class="mode-dark">{darkValueFor(token.key)}</code>
								{:else}
									<code>{token.value}</code>
								{/if}
							</td>
							<td>
								<!-- The token itself, not its authored value: surface's value is
								     var(--hz-palette-white), which stays white under the dark
								     toggle — the dark theme overrides the ROLE, so paint it. -->
								<div
									class="swatch swatch-sm"
									style="background-color: var({token.cssVar})"
									aria-hidden="true"
								></div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="role-note">
			<code>--hz-color-black</code> and <code>--hz-color-white</code> are absolute anchors for
			hover-darkening mixes (Button's solid/active states, Link's hover) and on-media controls
			(Lightbox) — deliberately do not flip in dark. They appear in both the palette section above
			(as the <code>black</code>/<code>white</code> palette source) and here (as anchor roles); that duality
			is intentional — the role is what components actually read.
		</p>
		<h3 id="intent">Intent</h3>
		<p>
			Intent is the shared vocabulary components use when color carries meaning: the
			<code>Intent</code> type in <code>@hyzer-labs/ui/types</code> —
			<code>neutral</code> plus the six status hues. Every intent-bearing component takes the full
			set, with <code>neutral</code> as the default when nothing is being signalled. Intent color is reinforcement,
			never the only signal — the text carries the meaning.
		</p>
		<p>
			Each intent has its own role token, one indirection above the palette: override
			<code>--hz-intent-*</code> to retarget status colors specifically — a danger red that isn't
			your brand red — or override the palette and the intents follow. Every intent-bearing surface
			(<code>Button</code>, <code>Badge</code>, and <code>Alert</code> intents, plus field error states)
			resolves through this layer.
		</p>
		<Alert intent="info" title="These seven are a starting set, not a ceiling" headingLevel={4}>
			A component only stamps <code>data-intent="&lt;name&gt;"</code> and lets the theme decide what
			the name means, so the vocabulary is yours to grow. Define
			<code>--hz-intent-&lt;name&gt;</code> in your config and it gets
			<a href="/foundation/contrast">contrast-graded</a> like any built-in; augment the
			<code>IntentRegistry</code> interface and <code>intent="yours"</code> type-checks and
			autocompletes on every component — while a typo still fails to compile. The
			<a href="/theming/examples#intents-heading">Terminal example theme</a> adds two,
			<code>phosphor</code> and <code>amber</code>, and shows all three steps.
		</Alert>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Intent</th>
						<th scope="col">Token</th>
						<th scope="col">Default</th>
						<th scope="col">Swatch</th>
						<th scope="col">Use</th>
					</tr>
				</thead>
				<tbody>
					{#each intentRows as row (row.intent)}
						<tr>
							<td><code>{row.intent}</code></td>
							<td><code>{row.cssVar}</code></td>
							<td><code>{row.target}</code></td>
							<td>
								<div
									class="swatch swatch-sm"
									style="background-color: var({row.cssVar})"
									role="img"
									aria-label="{row.intent} color swatch"
								></div>
							</td>
							<td>{row.note}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p>One vocabulary, every component — <code>danger</code> shown across the family:</p>
		<Stack gap="sm">
			<Cluster gap="sm" align="center">
				<Button intent="danger">Delete round</Button>
				<Badge intent="danger">OB</Badge>
				<IconTriangleAlert intent="danger" />
			</Cluster>
			<Alert intent="danger" title="Course closed" headingLevel={4}>
				Lightning in the area — clear the course now.
			</Alert>
		</Stack>
	</Stack>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="dark-heading"
	>
		<h2 id="dark-heading">Dark mode</h2>
		<p>
			Dark mode is optional, with three equally supported postures. Do nothing and the light values
			stay the values — no toggle, no extra CSS. Prefer a dark-only site? Set <code
				>data-theme="dark"</code
			>
			on <code>&lt;html&gt;</code> once and stop there — the overrides apply and no toggle ever needs
			to exist. Or wire a toggle that flips the attribute, like this docs site does. Components resolve
			the same role and intent tokens in every posture, so nothing else in your markup or CSS changes
			between them.
		</p>
		<p>
			The toggle in this site's sidebar is exactly this — an icon-only <code>Button</code> flipping
			the attribute and remembering the choice. Until a choice is stored, the site follows the
			system's
			<code>prefers-color-scheme</code>:
		</p>
		<CodeBlock code={toggleCode} />
		<h3 id="dark-overrides-heading">Overrides</h3>
		<p>
			Dark mode is a set of overrides in <code>[data-theme="dark"]</code>. Out of the box
			<code>--hz-color-surface</code> and <code>--hz-color-text</code> flip,
			<code>--hz-color-surface-muted</code> strengthens its gray tint (6% is invisible over black),
			and every hue in <code>--hz-palette-*</code> lightens to a companion that keeps WCAG AA as
			text on dark surfaces. Almost nothing is re-authored beyond that at Layer 2 —
			<code>text-muted</code> and <code>border</code> follow <code>gray</code>, and every intent
			follows its hue:
		</p>
		<p class="doctrine-note">
			Dark mode <strong>may override any tier, including the palette</strong> — and it already does,
			right here. The rule is not that the palette is mode-static; the rule is that components and
			theme sheets resolve through role (<code>--hz-color-*</code>) and intent (<code
				>--hz-intent-*</code
			>) tokens, <strong>never the palette directly</strong>. Palette is referenced in exactly one
			place — the token source, where roles and intents are
			<em>defined</em> (<code>--hz-color-surface: var(--hz-palette-white)</code>) — the whole point
			of the indirection.
		</p>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Token</th>
						<th scope="col">Dark value</th>
					</tr>
				</thead>
				<tbody>
					{#each darkTokens as token (token.cssVar)}
						<tr>
							<td><code>{token.cssVar}</code></td>
							<td><code>{token.value}</code></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p>
			Any role can be overridden the same way — including intents. If your danger red reads too
			harsh on a dark surface, set <code>--hz-intent-danger</code> inside
			<code>[data-theme="dark"]</code> and every intent-bearing surface follows.
		</p>
		<p>
			For WCAG ratios, luminance, and in-situ previews of every pairing, see
			<a href="/foundation/contrast">Contrast &amp; Accessibility</a>; for override recipes and the
			config/CLI workflow, see <a href="/theming/tokens">Theming → Tokens &amp; Overrides</a>.
		</p>
	</Stack>
</Stack>

<style>
	/* Margins zeroed — every h3/p on this page is a direct child of a
	 * .doc-section Stack (gap="away", data-density-shift), which now owns
	 * the rhythm. */
	h3 {
		margin: 0;
		font-size: var(--hz-font-size-lg, 1.125rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	p {
		margin: 0;
	}

	.doctrine-note,
	.role-note {
		padding: 0.75rem 1rem;
		border-inline-start: 3px solid var(--hz-color-border, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.color-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.swatch {
		width: 100%;
		height: 4rem;
		border-radius: var(--hz-radius-md, 0.5rem);
		border: 1px solid var(--hz-color-border, #6b7280);
	}

	.swatch-sm {
		width: 2rem;
		height: 1.5rem;
	}

	/* Mode-aware hex labels: exactly one of the pair renders, matching the
	 * live swatch above it. Driven purely by the html[data-theme] attribute
	 * the site toggle stamps — no script, SSR-safe. */
	.mode-dark {
		display: none;
	}

	:global([data-theme='dark']) .mode-light {
		display: none;
	}

	:global([data-theme='dark']) .mode-dark {
		display: inline;
	}

	.color-meta {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.var-name {
		font-size: var(--hz-font-size-xs, 0.75rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		word-break: break-all;
	}

	.var-value {
		font-size: var(--hz-font-size-xs, 0.75rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	code {
		font-family: var(--hz-font-family-mono, monospace);
	}

	.token-table-wrapper {
		overflow-x: auto;
	}

	.token-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--hz-font-size-sm, 0.875rem);
	}

	.token-table th,
	.token-table td {
		text-align: left;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--hz-color-border, #6b7280);
		vertical-align: middle;
	}

	.token-table th {
		font-weight: var(--hz-font-weight-semibold, 600);
	}
</style>
