/**
 * Fixtures for the CodeBlock docs page's "Syntax highlighting (bring your
 * own)" subsection (specs/47 R14) — one snippet per highlighter, each in the
 * language that highlighter is shown running against:
 *
 * - `prismDemoSource` — fed to the live Prism block (CodeBlock-R17) through
 *   the default `language` class hook. Plain TypeScript, since only the
 *   clike/javascript/typescript grammars are loaded there.
 * - `shikiDemoSource` — fed to Shiki's `codeToHtml` at prerender
 *   (`+page.server.ts`) and, verbatim, to the same CodeBlock's `code` prop
 *   (the R19 `children` escape hatch renders the highlighted HTML; `code`
 *   stays what copy reads) — a small Svelte component, Shiki's strength.
 */
export const prismDemoSource = `interface Round {
	course: string;
	holes: number;
	strokes: number;
}

function scoreToPar(round: Round, par: number): number {
	return round.strokes - par;
}`;

export const shikiDemoSource = `<script lang="ts">
	let count = $state(0);
</script>

<button onclick={() => count++}>
	Clicked {count} {count === 1 ? 'time' : 'times'}
</button>
`;
