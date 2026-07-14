<script lang="ts">
	import { Stack, Grid, Cluster, Badge, Alert, Button } from '$lib';
	import { color, intent } from '$lib/tokens';

	// R7 — derive palette and role tokens from metadata; never hardcoded

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

	const paletteTokens = colorEntries(
		Object.fromEntries(
			Object.entries(color).filter(
				([, v]) => typeof v === 'string' && (v as string).startsWith('#')
			)
		),
		'--hz-color'
	);

	// Roles are everything that isn't a raw palette hex — var() indirections
	// plus derived values like surface-muted's color-mix().
	const roleTokens = colorEntries(
		Object.fromEntries(
			Object.entries(color).filter(
				([, v]) => typeof v === 'string' && !(v as string).startsWith('#')
			)
		),
		'--hz-color'
	);

	const darkTokens: ColorEntry[] = Object.entries(color.theme.dark).map(([key, value]) => ({
		key,
		cssVar: `--hz-color-${toKebab(key)}`,
		value
	}));

	// R7 — the intent role tokens, derived from metadata.
	const intentNotes: Record<string, string> = {
		neutral: 'Badge/Alert extension and their default — no particular status.',
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

<Stack gap="xl">
	<div>
		<h1>Colors & Intent</h1>
		<p>
			A two-layer color model: a fixed palette (Layer 1) of single-value colors, and a semantic role
			layer (Layer 2) that references the palette via <code>var()</code> — structural roles for what
			a color does in the layout, and the <a href="#intent">intent vocabulary</a> for what a color means.
			Dark theme overrides land on the role layer, never the palette.
		</p>
	</div>

	<section aria-labelledby="palette-heading">
		<h2 id="palette-heading">Palette tokens</h2>
		<p>These tokens ship fixed values. Override them to retheme the entire palette at once.</p>
		<Grid columns={{ sm: 2, md: 3, lg: 4 }} gap="sm">
			{#each paletteTokens as token (token.cssVar)}
				<div class="color-card">
					<div
						class="swatch"
						style="background-color: {token.value}"
						role="img"
						aria-label="{token.value} color swatch"
					></div>
					<div class="color-meta">
						<code class="var-name">{token.cssVar}</code>
						<code class="var-value">{token.value}</code>
					</div>
				</div>
			{/each}
		</Grid>
	</section>

	<section aria-labelledby="roles-heading">
		<h2 id="roles-heading">Semantic roles & intent</h2>
		<p>
			Components never reference the palette directly — they resolve through role tokens, the single
			indirection point a theme overrides. Roles come in two families: structural roles (<code
				>--hz-color-*</code
			>) name what a color <em>does</em> in the layout, and intent roles (<code>--hz-intent-*</code
			>) name what a color <em>means</em>.
		</p>
		<h3 id="structural-roles">Structural roles</h3>
		<div class="token-table-wrapper">
			<table class="token-table">
				<thead>
					<tr>
						<th scope="col">Token</th>
						<th scope="col">Light value</th>
						<th scope="col">Swatch</th>
					</tr>
				</thead>
				<tbody>
					{#each roleTokens as token (token.cssVar)}
						<tr>
							<td><code>{token.cssVar}</code></td>
							<td><code>{token.value}</code></td>
							<td>
								<div
									class="swatch swatch-sm"
									style="background-color: {token.value}"
									role="img"
									aria-label="color swatch"
								></div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<h3 id="intent">Intent</h3>
		<p>
			Intent is the shared vocabulary components use when color carries meaning: the
			<code>Intent</code> type in <code>$lib/types</code> —
			<code>primary | secondary | danger | warning | success | info</code>. Components speak it
			consistently rather than inventing their own scales: Badge and Alert take the full set plus a
			<code>neutral</code> default; Button restricts to
			<code>primary | secondary | danger</code>. Intent color is reinforcement, never the only
			signal — the text carries the meaning.
		</p>
		<p>
			Each intent has its own role token, one indirection above the palette: override
			<code>--hz-intent-*</code> to retarget status colors specifically — a danger red that isn't your
			brand red — or override the palette and the intents follow. Every intent-bearing surface (Button,
			Badge, and Alert intents, plus field error states) resolves through this layer.
		</p>
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
			</Cluster>
			<Alert intent="danger" title="Course closed" headingLevel={4}>
				Lightning in the area — clear the course now.
			</Alert>
		</Stack>
	</section>

	<section aria-labelledby="dark-heading">
		<h2 id="dark-heading">Dark theme overrides</h2>
		<p>
			Dark mode is a set of role overrides in <code>[data-theme="dark"]</code> — the palette never
			changes. Out of the box <code>--hz-color-surface</code> and <code>--hz-color-text</code>
			flip, and <code>--hz-color-surface-muted</code> strengthens its gray tint (6% is invisible over
			black):
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
	</section>
</Stack>

<style>
	h1 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-2xl, 2rem);
		font-weight: var(--hz-font-weight-bold, 700);
	}

	h2 {
		margin: 0 0 0.5rem;
		font-size: var(--hz-font-size-xl, 1.5rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	h3 {
		margin: 1.5rem 0 0.5rem;
		font-size: var(--hz-font-size-lg, 1.125rem);
		font-weight: var(--hz-font-weight-semibold, 600);
	}

	p {
		margin: 0 0 1rem;
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
