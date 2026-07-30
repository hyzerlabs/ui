<script lang="ts">
	import { Stack, Grid, Cluster, Badge, Alert, Blockquote, Button, CodeBlock } from '$lib';
	import IconTriangleAlert from '$lib/icons/generated/triangle-alert.svelte';
	import { palette, color, intent } from '$lib/tokens';
	import DocIntro from '../../../../docs/DocIntro.svelte';
	import IconInfo from '$lib/icons/generated/info.svelte';

	// The docs shell's own theme toggle, verbatim — this is the real thing
	// (src/docs/theme.svelte.ts + ThemeToggle.svelte), not an idealization.
	const toggleCode = [
		"import { Button } from '@hyzer-labs/ui';",
		"import IconSun from '@hyzer-labs/ui/icons/sun';",
		"import IconMoon from '@hyzer-labs/ui/icons/moon';",
		'',
		'// Two separate things: whether the reader has made an EXPLICIT choice,',
		'// and what their system prefers. null = no choice yet, so the attribute',
		"// stays off and the sheet's prefers-color-scheme block picks the",
		'// default. Following the system needs no JS at all.',
		"let choice = $state(null); // 'light' | 'dark' | null",
		'let systemDark = $state(false);',
		"const dark = $derived(choice ? choice === 'dark' : systemDark);",
		'',
		'$effect(() => {',
		"\tconst stored = localStorage.getItem('hz-theme');",
		"\tif (stored === 'light' || stored === 'dark') choice = stored;",
		'',
		'\t// Only so the button can show the right icon while no choice is set.',
		"\tconst q = window.matchMedia('(prefers-color-scheme: dark)');",
		'\tsystemDark = q.matches;',
		'\tconst onChange = (e) => (systemDark = e.matches);',
		"\tq.addEventListener('change', onChange);",
		"\treturn () => q.removeEventListener('change', onChange);",
		'});',
		'',
		'// WRITE the choice; never signal light by removing the attribute. The',
		'// system default is :root:not([data-theme]), so a removed attribute',
		'// hands a system-dark reader dark mode and the light half of the',
		'// toggle appears to do nothing.',
		'$effect(() => {',
		"\tif (choice) document.documentElement.setAttribute('data-theme', choice);",
		"\telse document.documentElement.removeAttribute('data-theme');",
		'});',
		'',
		'function toggleTheme() {',
		"\tchoice = dark ? 'light' : 'dark';",
		"\tlocalStorage.setItem('hz-theme', choice);",
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

	// Derive palette and role tokens from metadata; never hardcoded
	// ( — classification is by which export a token lives in, not
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
	// aliases.
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

	// The intent role tokens, derived from metadata.
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
	<DocIntro>
		{#snippet lead()}
			A two-layer color model: the palette (<code>--hz-palette-*</code>) authors hues per mode, and
			the semantic layer (<code>--hz-color-*</code>, <code>--hz-intent-*</code>) maps them to what a
			color <em>does</em> and what it <a href="#intent"><em>means</em></a>. Dark mode overrides land
			mostly on the palette; the semantic layer chains through automatically.
		{/snippet}
	</DocIntro>

	<Stack
		as="section"
		gap="away"
		data-density-shift
		class="doc-section"
		aria-labelledby="palette-heading"
	>
		<h2 id="palette-heading">Palette tokens</h2>
		<p>
			The <code>--hz-palette-*</code> tokens ship fixed values. Override them to retheme the entire
			palette at once. Components and the reference theme never read these directly (see the
			doctrine note below). This page and
			<a href="/docs/foundation/contrast">Contrast &amp; Accessibility</a> are the exception: they build
			and grade the raw names for review.
		</p>
		<Grid columns={{ sm: 2, md: 3, lg: 4 }} gap="sm">
			{#each paletteTokens as token (token.cssVar)}
				<div class="color-card">
					<!-- Painted from the live token (not the authored hex) so the swatch
					     follows the site's mode toggle; the visible hex label switches
					     with it via the mode-only spans below. Decorative: the labels
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
			Components never reference the palette directly. They resolve through role tokens, the single
			indirection point a theme overrides. Roles come in two families: structural roles (<code
				>--hz-color-*</code
			>) name what a color <em>does</em> in the layout, and intent roles (<code>--hz-intent-*</code
			>) name what a color <em>means</em>.
		</p>
		<h3 id="structural-roles">Structural roles</h3>
		<p>
			There are seven. <code>surface</code>, <code>surfaceMuted</code>, and <code>text</code> are
			re-authored by the dark theme, so their value changes with the mode. <code>textMuted</code>
			and
			<code>border</code> are authored once and follow whatever the palette gives them.
			<code>black</code> and <code>white</code> are alias roles, identical in both modes. The table shows
			the value each one resolves to for the mode you are reading in.
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
							     show the value for the mode you're looking at. The rest,
							     including the black/white anchors that never re-author, are the
							     same var() chain in both modes. -->
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
								     toggle. The dark theme overrides the ROLE, so paint the role. -->
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
		<p class="doc-note">
			<code>--hz-color-black</code> and <code>--hz-color-white</code> are absolute anchors for
			hover-darkening mixes (Button's solid/active states, Link's hover) and on-media controls
			(Lightbox), so they deliberately do not flip in dark. They appear twice: in the palette
			section above as the <code>black</code>/<code>white</code> palette source, and here as anchor roles.
			That duality is intentional, because the role is what components actually read.
		</p>
		<h3 id="intent">Intent</h3>
		<p>
			Intent is the shared vocabulary components use when color carries meaning: the
			<code>Intent</code> type in <code>@hyzer-labs/ui/types</code>, which is
			<code>neutral</code> plus the six status hues. Every intent-bearing component takes the full
			set, with <code>neutral</code> as the default when nothing is being signalled. Intent color is reinforcement,
			never the only signal. The text carries the meaning.
		</p>
		<p>
			Each intent has its own role token, one indirection above the palette. Override
			<code>--hz-intent-*</code> to retarget status colors specifically (a danger red that is not
			your brand red), or override the palette and the intents follow. Every intent-bearing surface
			(<code>Button</code>, <code>Badge</code>, and <code>Alert</code> intents, plus field error states)
			resolves through this layer.
		</p>
		<Alert intent="info" title="Add your own intents" headingLevel={4}>
			{#snippet icon()}<IconInfo />{/snippet}
			These seven are a starting set. A component only stamps
			<code>data-intent="&lt;name&gt;"</code> and lets the theme decide what the name means, so the
			vocabulary is yours to grow. Define
			<code>--hz-intent-&lt;name&gt;</code> in your config and it gets
			<a href="/docs/foundation/contrast">contrast-graded</a> like any built-in. Augment the
			<code>IntentRegistry</code> interface and <code>intent="yours"</code> type-checks and
			autocompletes on every component, while a typo still fails to compile. The
			<a href="/docs/theming/examples#intents-heading">Terminal example theme</a> adds two,
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
		<p>One vocabulary, every component. Here is <code>danger</code> across the family:</p>
		<Stack gap="sm">
			<Cluster gap="sm" align="center">
				<Button intent="danger">Delete round</Button>
				<Badge intent="danger">OB</Badge>
				<IconTriangleAlert intent="danger" />
			</Cluster>
			<Alert intent="danger" title="Course closed" headingLevel={4}>
				{#snippet icon()}<IconTriangleAlert />{/snippet}
				Lightning in the area. Clear the course now.
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
			Dark mode is optional, with three equally supported postures. <strong>Do nothing</strong> and
			the sheet follows the reader's system preference on its own. It ships a
			<code>prefers-color-scheme</code> block that applies only while no
			<code>data-theme</code> attribute is set, so obeying the system costs you no JavaScript.
			<strong>Pin one look</strong>
			by setting <code>data-theme="dark"</code> on <code>&lt;html&gt;</code> once and stopping
			there, or <code>data-theme="light"</code> to hold the default look even for a reader whose
			system prefers dark. Or <strong>wire a toggle</strong> that writes the attribute, like this docs
			site does. Components resolve the same role and intent tokens in every posture, so nothing else
			in your markup or CSS changes between them.
		</p>
		<p>
			The toggle in this site's sidebar is exactly this: an icon-only <code>Button</code> that
			writes the reader's choice and remembers it. Note what it does <em>not</em> do: it never
			signals light by removing the attribute. The system default is scoped to
			<code>:root:not([data-theme])</code>, so a removed attribute hands a system-dark reader dark
			mode and makes the light half of the toggle look broken.
		</p>
		<CodeBlock code={toggleCode} />
		<h3 id="dark-overrides-heading">Overrides</h3>
		<p>
			The base tokens are the default theme: what a page renders with no <code>data-theme</code>
			attribute set, and light is simply how that default looks. Dark is a named theme layered over it,
			a set of overrides in <code>[data-theme="dark"]</code>. Out of the box
			<code>--hz-color-surface</code> and <code>--hz-color-text</code> swap,
			<code>--hz-color-surface-muted</code> strengthens its gray tint (6% is invisible over black),
			and every hue in <code>--hz-palette-*</code> lightens to a companion that keeps WCAG AA as
			text on dark surfaces. Almost nothing is re-authored beyond that at Layer 2:
			<code>text-muted</code> and <code>border</code> follow <code>gray</code>, and every intent
			follows its hue:
		</p>
		<Blockquote class="doctrine-note" intent="primary">
			A named theme <strong>may override any tier, including the palette</strong>, and the dark
			theme already does, right here. The rule is not that the palette is mode-static; the rule is
			that components and theme sheets resolve through role (<code>--hz-color-*</code>) and intent (<code
				>--hz-intent-*</code
			>) tokens, <strong>never the palette directly</strong>. Palette is referenced in exactly one
			place: the token source, where roles and intents are
			<em>defined</em> (<code>--hz-color-surface: var(--hz-palette-white)</code>). That indirection
			is the whole point.
		</Blockquote>
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
			Any role can be overridden the same way, including intents. If your danger red reads too harsh
			on a dark surface, set <code>--hz-intent-danger</code> inside
			<code>[data-theme="dark"]</code> and every intent-bearing surface follows.
		</p>
		<p>
			For WCAG ratios, luminance, and in-situ previews of every pairing, see
			<a href="/docs/foundation/contrast">Contrast &amp; Accessibility</a>; for override recipes and
			the config/CLI workflow, see
			<a href="/docs/theming/tokens">Theming → Tokens &amp; Overrides</a>.
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
