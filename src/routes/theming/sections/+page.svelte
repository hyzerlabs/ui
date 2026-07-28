<script lang="ts">
	import { Alert, Badge, Button, CodeBlock, Stack, theme } from '$lib';
	import Example from '../../../docs/Example.svelte';

	// The inline form's override object, kept in one place so the demo and the
	// code sample below it can never disagree.
	const inlineTheme = {
		palette: { primary: '#b45309', gray: '#78716c' },
		color: { surface: '#fffbeb', text: '#1c1917' }
	};

	const namedCode = [
		"import { theme } from '@hyzer-labs/ui';",
		'',
		"<section {@attach theme('dark')}>",
		'\t<!-- everything in here is dark, whatever the page around it is -->',
		'</section>'
	].join('\n');

	const attributeCode = [
		'<!-- identical result, no import — the attachment only writes this -->',
		'<section data-theme="dark">…</section>'
	].join('\n');

	const inlineCode = [
		"import { theme } from '@hyzer-labs/ui';",
		'',
		'const warm = {',
		"\tpalette: { primary: '#b45309', gray: '#78716c' },",
		"\tcolor: { surface: '#fffbeb', text: '#1c1917' }",
		'};',
		'',
		'<section {@attach theme(warm)}>…</section>'
	].join('\n');

	const configCode = [
		'// hyzer.config.ts',
		"import { defineConfig } from '@hyzer-labs/ui/config';",
		'',
		'export default defineConfig({',
		'\tthemes: {',
		"\t\tdark: { palette: { primary: '#60a5fa' } },  // the built-in, yours to extend",
		'\t\tocean: { palette: { primary: \'#0ea5e9\' } }, // data-theme="ocean"',
		"\t\t'ocean-dark': { color: { surface: '#0b1120' } }",
		'\t}',
		'});'
	].join('\n');

	const classCode = [
		'// A class scope is the other mechanism — and the more expressive one:',
		'// it COMPOSES with dark mode, which a themes entry cannot.',
		"generateCss(resolveConfig(oceanConfig), { selector: '.theme-ocean' });",
		'',
		'<div class="theme-ocean">        <!-- ocean, in whichever mode is active -->',
		'\t<section data-theme="dark">…</section>',
		'</div>'
	].join('\n');
</script>

<div class="doc-intro">
	<h1>Section themes</h1>
	<p class="doc-description">
		A theme does not have to own the whole page. Any element can carry one, and everything inside it
		follows — so a single long page can change character section by section.
	</p>
</div>

<section class="doc-section" aria-labelledby="named-heading">
	<h2 id="named-heading">Naming a theme</h2>
	<p>
		<code>theme('dark')</code> puts <code>data-theme="dark"</code> on the element. Each section below
		carries a different one, on the same page, at the same time.
	</p>

	<Example code={namedCode}>
		<Stack gap="near">
			<div class="demo-band" {@attach theme('light')}>
				<Badge intent="primary">light</Badge>
				<p>The default theme, restored explicitly — even inside a dark page.</p>
				<Button intent="primary">Primary</Button>
			</div>

			<div class="demo-band" {@attach theme('dark')}>
				<Badge intent="primary">dark</Badge>
				<p>Surfaces, text, borders and every intent follow the attribute.</p>
				<Button intent="primary">Primary</Button>
			</div>

			<div class="demo-band" {@attach theme(inlineTheme)}>
				<Badge intent="primary">inline</Badge>
				<p>An override object, resolved at runtime — no config entry needed.</p>
				<Button intent="primary">Primary</Button>
			</div>
		</Stack>
	</Example>

	<Alert intent="info" title="It really is just an attribute">
		The attachment is a convenience, not a requirement — it writes one attribute and restores
		whatever was there when it unmounts. Writing the attribute yourself is exactly as valid, and it
		works without JavaScript.
	</Alert>

	<CodeBlock code={attributeCode} />
</section>

<section class="doc-section" aria-labelledby="config-heading">
	<h2 id="config-heading">Defining themes</h2>
	<p>
		Named themes come from the <code>themes</code> map in your config. Each entry becomes one
		<code>[data-theme="…"]</code> block in the generated sheet, graded for contrast exactly the way the
		built-in dark theme is.
	</p>
	<CodeBlock code={configCode} />
	<p>
		<code>dark</code> is an entry like any other — it merges over what the library already authors
		rather than replacing it. <code>light</code> is reserved: the light theme is the default
		<code>:root</code> block, authored through <code>tokens</code>.
	</p>
	<p>
		One attribute holds one value, so themes are <strong>mutually exclusive</strong>. There is no
		“ocean, but dark” unless you define it — hence the <code>'ocean-dark'</code> entry above.
	</p>
</section>

<section class="doc-section" aria-labelledby="inline-heading">
	<h2 id="inline-heading">Themes without a config entry</h2>
	<p>
		Pass an override object instead of a name and it is resolved in the browser, then written to the
		element as inline custom properties. Useful for a theme that comes from data — a per-tenant
		accent, a user-picked color — where a build-time entry is not an option.
	</p>
	<CodeBlock code={inlineCode} />
	<Alert intent="warning" title="Two trade-offs worth knowing">
		The resolver is loaded on demand, so an inline section paints unthemed for one frame — fine
		below the fold, visible at the top of a page. And an inline object is not contrast-graded: named
		themes get the AA gate at build time, these do not.
	</Alert>
</section>

<section class="doc-section" aria-labelledby="class-heading">
	<h2 id="class-heading">When to use a class instead</h2>
	<p>
		Scoping a generated sheet under a class is the other way to do this, and for one case it is the
		better way: a class composes with <code>data-theme</code>, so a themed region still has a light
		and a dark form. A <code>themes</code> entry cannot — it occupies the same attribute dark does.
	</p>
	<CodeBlock code={classCode} />
	<p>
		Reach for a <code>themes</code> entry when a section should look one specific way. Reach for a
		class when a whole region needs its own palette <em>and</em> still has to answer to the page's light/dark
		state.
	</p>
</section>

<style>
	.doc-section {
		margin-block-end: var(--hz-space-away, 8rem);
	}

	/* Each band paints its own surface so the theme boundary is visible —
	 * without this they would all sit on the page background and the point
	 * would be invisible. */
	.demo-band {
		background: var(--hz-color-surface, #fff);
		color: var(--hz-color-text, #111827);
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.demo-band p {
		margin: 0;
		color: var(--hz-color-text-muted, #6b7280);
	}
</style>
