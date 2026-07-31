<script lang="ts">
	import { Logo, Cluster, Grid, Stack, Tabs, CodeBlock, Alert } from '$lib';
	import IconInfo from '$lib/icons/generated/info.svelte';
	import DocPage from '../../../../docs/DocPage.svelte';
	import { logoDoc } from '../../../../docs/data/logo.js';
	import Example from '../../../../docs/Example.svelte';

	// Page-local demo marks for six fictional companies, deliberately varied
	// in silhouette, so the normalization math has something real to prove.
	// Swap these for your own `?raw` imports; see "Resolving your assets"
	// below. Five declare no fill at all, so the theme's monochrome recolor
	// visibly bites; Umbrella's segments are the one mark with hard-coded
	// brand colors, the deliberate illustration on the Appearance tab. Every
	// mark carries its own `viewBox` — an `<svg>` with none renders at native
	// pixel scale instead of filling its box, which only the width/height
	// parse tier (covered by the unit tests) needs to exercise. Weyland-
	// Yutani and Delos add the thin-lettering wide wordmark case — a fashion
	// house's masthead, a publisher's imprint, a luxury logotype — where
	// per-mark `scale` earns its keep: thin marks read optically far smaller
	// than their geometry once normalized.

	// ACME Corp — bold slab wordmark, wide ~3:1.
	const acmeSvg =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 64 190 62" fill-rule="evenodd" clip-rule="evenodd"><path d="M23.454 68.785l-20.62 55.488h15.768l2.729-7.883H33.46v7.883h15.464V68.785h-25.47zm9.703 31.535h-6.368l6.368-13.342v13.342zM94.71 68.178H70.149c-8.188 0-10.916 10.613-10.916 10.613l-5.761 33.051s-2.123 12.432 8.49 12.432h23.045l2.426-16.373H75.001s-5.458 1.213-4.548-4.852c.303-.91 2.426-13.039 2.426-13.039s.606-4.245 3.335-4.245h15.464l3.032-17.587zM101.988 68.482l-11.523 55.791h15.162l5.154-23.65 1.213 23.65h8.188l9.095-23.65-4.548 23.65h13.644l11.221-56.095h-19.406l-9.401 23.348V68.482h-18.799zM145.955 124.273l10.611-56.095h31.233l-2.426 16.072H169l-.91 5.457h15.767l-2.425 12.129-16.071-.303-.91 5.457h16.07l-3.335 17.283h-31.231zM185.07 123.365c-2.123 0-3.336-1.518-3.336-3.639 0-2.123 1.213-3.639 3.336-3.639s3.639 1.516 3.639 3.639c0 2.122-1.516 3.639-3.639 3.639zm0 1.213c2.729 0 4.852-2.426 4.852-4.852 0-2.729-2.123-4.852-4.852-4.852s-4.852 2.123-4.852 4.852c.001 2.426 2.124 4.852 4.852 4.852zm1.213-4.549c.91 0 1.516-.303 1.516-1.516s-.91-1.516-2.123-1.516h-2.426v5.154h.91v-2.123h.91l1.213 2.123h1.213l-1.213-2.122zm-2.123-.607v-1.516h1.213c.607 0 1.213 0 1.213.607 0 .605-.303.908-.91.908h-1.516v.001z"/></svg>';
	// Umbrella Corporation — the 8-segment umbrella, alternating red/white,
	// hard-coded fills. The one declared-fill mark. Roughly square.
	const umbrellaSvg =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" stroke-width="2"><path d="m206 5s-28 14-56 14-56-14-56-14l56 135z" fill="#c00" stroke="#870200"/><path d="m87 8s-10 30-30 50c-19 19-49 29-49 29l135 56z" fill="#eee" stroke="#bdbdbd"/><path transform="rotate(90,150,150)" d="m206 5s-28 14-56 14-56-14-56-14l56 135z" fill="#c00" stroke="#870200"/><path transform="rotate(90,150,150)" d="m87 8s-10 30-30 50c-19 19-49 29-49 29l135 56z" fill="#eee" stroke="#bdbdbd"/><path transform="rotate(180,150,150)" d="m206 5s-28 14-56 14-56-14-56-14l56 135z" fill="#c00" stroke="#870200"/><path transform="rotate(180,150,150)" d="m87 8s-10 30-30 50c-19 19-49 29-49 29l135 56z" fill="#eee" stroke="#bdbdbd"/><path transform="rotate(270,150,150)" d="m206 5s-28 14-56 14-56-14-56-14l56 135z" fill="#c00" stroke="#870200"/><path transform="rotate(270,150,150)" d="m87 8s-10 30-30 50c-19 19-49 29-49 29l135 56z" fill="#eee" stroke="#bdbdbd"/></svg>';
	// Black Mesa Research Facility — the circular mesa emblem with "BLACK
	// MESA" beneath it (a single line — "RESEARCH FACILITY" didn't stay
	// legible at wall size, so it stays out of this demo mark). The tall
	// mark, ~1:1.27. `textLength` locks the wordmark to a fixed width so it
	// can never clip regardless of the rendering font's metrics. viewBox is
	// trimmed to the mark's real bounding box (measured, not eyeballed): the
	// original 350 height left ~25 units of dead space below the wordmark's
	// descender, so the visible mark sat higher than its box implied and
	// threw off row-centering next to the other marks.
	const blackMesaSvg =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 325"><path transform="translate(803.844, -692.062)" d="M -675.85042,692.06247 C -746.50698,692.06247 -803.84374,749.41269 -803.8437,820.06922 C -803.8437,890.72575 -746.50698,948.0625 -675.85042,948.0625 C -605.1939,948.0625 -547.8437,890.72577 -547.8437,820.06922 C -547.8437,749.41268 -605.1939,692.06249 -675.85042,692.06247 z M -677.07545,715.10881 C -618.79275,715.10881 -571.48234,762.41923 -571.48234,820.70192 C -571.48234,837.62198 -574.37752,852.46735 -581.44395,866.48496 C -590.68528,851.14069 -602.72856,832.08702 -612.12301,815.81534 C -638.63521,815.62572 -696.19994,815.10187 -719.27768,815.10187 C -719.27768,841.73112 -718.90075,870.81307 -718.90075,892.00823 C -728.32704,891.86994 -744.87839,892.21966 -754.29142,892.14284 C -772.16909,873.22612 -781.74197,847.4042 -781.59163,819.34229 C -781.2891,762.57227 -735.35815,715.10881 -677.07545,715.10881 z"/><text x="128" y="315" text-anchor="middle" font-family="system-ui, sans-serif" font-size="46" font-weight="800" textLength="236" lengthAdjust="spacingAndGlyphs">BLACK MESA</text></svg>';
	// Lumon Industries — the globe-in-ellipse mark with the wordmark inline,
	// wide-ish ~2.2:1.
	const lumonSvg =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 143 480 215"><path d="M297.5,272c2.5,3.6,6.1,4.9,10.3,4.9c13.6-0,27.3-0,40.9-0 c0.5,0,0.9-0,1.4-0c6.2-0.3,10.8-4.8,10.9-10.9c0.1-8.6,0.1-17.2,0-25.8 c-0.1-5-3.2-9-7.8-10.4c-1.5-0.4-3.1-0.6-4.6-0.6c-6.8-0.1-13.6-0-20.4-0 c-6.7,0-13.5-0-20.2,0c-1.3,0-2.7,0.1-3.9,0.4c-5.4,1.3-8.5,5.4-8.6,11.6 c-0.1,7.9-0,15.9-0,23.8C295.5,267.4,296,269.9,297.5,272z M318.5,252.3 c2.6-4.3,8.3-13.6,8.5-14c1-1.3,1.9-1.3,2.9-0c0.5,0.7,5.8,9.7,8.2,13.4 c4.6,6.9,0.3,15-7,16.6c-0.8,0.2-1.8,0.1-2.6,0.2c-6-0.1-10.9-4.4-11.4-10.1 C316.8,256.2,317.4,254.2,318.5,252.3z"/><path d="M211.7,276.6c2.4,0,4.8,0,7.3,0c1.8-0,1.9-0.1,1.9-1.9 c0-9.9,0-19.9,0-29.8c0-0.5,0-0.9,0-1.4c0.1-0.1,0.2-0.2,0.3-0.2 c0.4,0.3,0.8,0.6,1.1,1c6.7,10.2,13.5,20.4,20.1,30.7c0.8,1.2,1.7,1.8,3.2,1.7 c2-0.1,4.1-0.1,6.1-0c1.2,0.1,2-0.4,2.7-1.4c2.2-3.5,4.6-7,6.8-10.5 c4.5-6.8,8.9-13.6,13.4-20.4c0.3-0.4,0.7-0.7,1.1-1.1c0.1,0.1,0.2,0.1,0.3,0.2 c0,0.5,0,0.9,0,1.4c0,10-0,20,0,30c0,1.5,0.2,1.7,1.7,1.7 c2.7,0,5.4,0,8.1,0c1.4-0,1.6-0.2,1.6-1.7c0-14.7,0-29.3,0-44 c0-1.5-0.2-1.7-1.7-1.7c-3.9-0-7.7,0.1-11.6-0c-1.4-0-2.3,0.4-3.1,1.6 c-7.1,10.9-14.2,21.7-21.4,32.5c-0.9,1.4-1.4,1.4-2.3,0c-7.2-10.9-14.4-21.8-21.5-32.7 c-0.7-1-1.4-1.5-2.7-1.5c-3.9,0.1-7.8,0-11.7,0c-1.7,0-1.9,0.2-1.9,1.9 c-0,7-0,14-0,21c0,7.4,0,14.8,0,22.2C209.5,276.5,209.6,276.6,211.7,276.6z"/><path d="M371.4,276.6c2.7,0,5.3,0,8,0c1.7-0,1.8-0.1,1.8-1.9 c0-10.5,0-21,0-31.4c0-0.5,0-0.9,0-1.8c0.7,0.3,1.2,0.5,1.6,0.8 c2.1,1.8,4.1,3.6,6.2,5.4c10.6,9.3,21.2,18.7,31.8,28c0.5,0.5,1.3,0.9,2,0.9 c3.4,0.1,6.7,0,10.1,0.1c1.1,0,1.5-0.5,1.5-1.6c-0-14.7-0-29.5-0-44.2 c0-1.3-0.3-1.5-1.6-1.5c-2.7-0-5.3-0-8-0c-1.7,0-1.9,0.2-1.9,1.9 c-0,10.5,0,21,0,31.6c0,0.5,0,0.9,0,1.7c-0.7-0.4-1.2-0.5-1.6-0.8 c-6.6-5.8-13.2-11.6-19.8-17.4c-6-5.3-12-10.5-18-15.8c-0.9-0.8-1.8-1.1-2.9-1.1 c-3,0.1-6.1,0-9.1,0c-1.4,0-1.7,0.3-1.7,1.6c-0,14.7-0,29.4,0,44.1 C369.8,276.3,370.1,276.6,371.4,276.6z"/><path d="M134.2,266.4c0.4,5.1,3.4,8.6,8.4,9.7c1.5,0.3,3,0.4,4.5,0.5 c6.6,0,13.1,0,19.7,0c6.6,0,13.1,0,19.7-0c1.2-0,2.5-0.1,3.7-0.3 c4.5-0.7,7.7-3,8.9-7.6c0.4-1.3,0.5-2.8,0.6-4.2c0-11.2,0-22.4,0-33.7 c0-1.4-0.2-1.6-1.7-1.6c-2.5-0-5.1-0-7.6-0c-2,0-2.1,0-2.1,2.1 c-0,10.3,0,20.6-0,30.9c0,4.2-0.8,5-5.1,5c-11,0-21.9,0-32.9-0 c-0.7,0-1.3-0-2-0.1c-1.9-0.2-2.9-1.2-3-3.1c-0-0.5-0-1-0-1.5 c-0-10.4,0-20.9-0-31.3c0-1.9-0.1-2-2-2c-2.5-0-4.9-0-7.4,0 c-1.9,0-2,0.1-2,2c-0,10.8-0,21.6,0,32.4C134.1,264.6,134.1,265.5,134.2,266.4 z"/><path d="M70.8,276.6c2.8,0,5.6,0,8.4,0c16,0,32,0,48.1-0 c1.6,0,1.8-0.2,1.8-1.8c0-1.8,0-3.5,0-5.3c-0-2.1-0.1-2.2-2.2-2.2 c-15-0-29.9,0-44.9,0c-0.5,0-1,0-1.6,0c0-0.6,0-1.1,0-1.6c0-11.5,0-23.1-0-34.6 c0-1.7-0.1-1.8-1.8-1.8c-2.6-0-5.2-0-7.8,0c-1.5,0-1.7,0.2-1.7,1.7 c-0,14.6-0,29.3,0,43.9C69.1,276.4,69.3,276.6,70.8,276.6z"/><path d="M411.7,329.5c0.6-0.2,1.1-0.5,1.7-0.7c0.7-0.3,1.4-0.6,2.2-0.9 c0.6-0.2,1.1-0.5,1.7-0.7c0.8-0.4,1.7-0.7,2.5-1.1c0.3-0.2,0.7-0.3,1-0.5 c41.1-18.8,66.5-44.4,66.5-72.6c0-20.2-13-39.1-35.4-55c-0-0-0-0-0-0 c-1-0.7-2.1-1.5-3.1-2.2c-0-0-0-0-0-0c-6.2-4.2-13.1-8.2-20.6-11.9 c-7.2-3.6-14.5-6.8-22-9.7c-10.5-4-21.9-7.7-33.9-10.9c-0.4-0.1-0.8-0.2-1.2-0.3 c-1.2-0.3-2.4-0.6-3.6-0.9c-0.8-0.2-1.6-0.4-2.4-0.6c-1.1-0.3-2.2-0.5-3.4-0.8 c-0.5-0.1-1.1-0.3-1.6-0.4c-20.9-4.8-43.7-8.3-67.7-10.1c-0.1-0-0.3-0.1-0.4-0.1 c-0.2,0-0.4,0-0.7,0c-12.9-1-26.1-1.5-39.6-1.5s-26.7,0.5-39.6,1.5c-0.2,0-0.4,0-0.6,0 c-0.1,0-0.2,0-0.3,0.1c-110.9,8.5-195.2,51.3-195.2,102.8c0,35.6,40.3,67,101.7,85.9 c0.3,0.1,0.6,0.2,0.9,0.3c37.9,11.5,83.7,18.2,133.1,18.2c60.3,0,115.3-10,156.9-26.5 c0.2-0.1,0.5-0.2,0.7-0.3C410.1,330.2,410.9,329.9,411.7,329.5z M54.4,252.6 c-0.1-0.9-0.6-1.4-1.5-1.5c-0.3-0-0.7-0-1.1-0c-10.1,0-20.1,0-30.2,0 c-0.5,0-0.9,0-1.7,0c0.4-2.6,0.6-5,1.1-7.5c1.9-9,6.3-16.9,12.1-23.9 c6.8-8.4,15.1-15.2,24-21.2c2.9-1.9,5.9-3.7,8.8-5.5c0.5-0.3,1.1-0.5,1.6-0.5 c11.8-0,23.6-0,35.4-0c0.3,0,0.6,0.1,1,0.1c-2.5,2.2-4.9,4.3-7.2,6.5 c-4.3,4.1-8.3,8.6-11.8,13.4c-0.9,1.2-0.9,1.9-0.1,2.5c0.8,0.6,2.6,0.4,3.3-0.5 c1.7-2.1,3.3-4.2,5.1-6.3c4.9-5.7,10.5-10.7,16.5-15.3c0.4-0.3,0.9-0.5,1.4-0.5 c22.5-0,44.9-0,67.4-0c0.2,0,0.3,0,0.6,0.1c-0.2,0.4-0.4,0.7-0.5,1 c-3.6,6.1-6.5,12.5-8.9,19.1c-0.5,1.5-0.3,2.2,0.6,2.6c1.4,0.5,2.5-0,3-1.4 c2.5-7.1,5.8-13.9,9.8-20.4c0.5-0.7,0.9-1.1,1.8-1.1c44.4,0,88.8-0,133.2-0 c0.9-0,1.4,0.3,1.8,1.1c3.9,6.4,7.2,13.2,9.7,20.3c0.5,1.5,1.3,1.9,2.9,1.6 c1-0.2,1.4-1,0.9-2.2c-1.4-3.6-2.8-7.3-4.5-10.8c-1.5-3.3-3.3-6.5-5.1-9.8 c0.3-0,0.6-0.1,0.9-0.1c22.2-0,44.5-0,66.7,0c0.6,0,1.3,0.3,1.8,0.6 c8.1,6.1,15.3,13.1,21.4,21.3c0.7,0.9,2.1,1.3,3.1,0.9c1-0.4,1.2-1.4,0.4-2.4 c-2-2.6-4-5.3-6.3-7.7c-4-4.1-8.2-8-12.4-11.9c-0.2-0.2-0.5-0.4-0.8-0.7 c0.5-0,0.8-0.1,1.1-0.1c11.7-0,23.5-0,35.2,0c0.5,0,1.1,0.1,1.5,0.4 c10.7,6.2,20.7,13.3,29.2,22.3c6.5,6.9,11.8,14.5,14.8,23.5c1.3,4,2.2,8.1,2.3,12.5 c-0.5,0-0.9,0-1.4,0c-10.3,0-20.5,0-30.8,0c-1.7,0-2.2,0.6-2.1,2.3c0.1,0.9,0.6,1.4,1.5,1.5 c0.3,0,0.6,0,0.9,0c10.1,0,20.2,0,30.3-0c0.5,0,0.9,0,1.7,0c-0.4,2.6-0.6,5.1-1.1,7.5 c-1.9,9-6.3,16.8-12,23.9c-6.9,8.4-15.1,15.3-24.1,21.3c-2.8,1.9-5.8,3.7-8.7,5.4 c-0.4,0.2-0.9,0.4-1.4,0.4c-12,0-24,0-36,0c-0.1,0-0.3-0-0.7-0.1 c1.6-1.4,3-2.6,4.4-3.8c5.4-4.8,10.3-10.1,14.6-15.9c0.9-1.3,1-2,0.2-2.6 c-0.8-0.6-2.6-0.3-3.3,0.5c-2.5,3-5,6.1-7.6,9c-4.2,4.6-8.9,8.6-13.8,12.4 c-0.5,0.4-1.3,0.5-1.9,0.5c-22.1,0-44.1,0-66.2,0c-0.4,0-0.8,0-1.4,0 c0.3-0.5,0.5-0.9,0.7-1.2c3.5-6,6.4-12.3,8.8-18.9c0.5-1.4,0.3-2.2-0.7-2.6 c-1.4-0.5-2.5,0-3,1.4c-2.5,7.1-5.7,13.8-9.7,20.2c-0.5,0.8-1,1.1-1.9,1.1 c-44.4,0-88.8,0-133.2,0.1c-1,0-1.5-0.3-1.9-1.1c-3.9-6.4-7.2-13.1-9.7-20.2 c-0.5-1.5-1.3-1.9-2.9-1.6c-0.9,0.2-1.3,1-0.9,2.1c1,2.6,1.9,5.2,3,7.7 c1.9,4.1,4.1,8,6.1,12.1c0.1,0.2,0.2,0.5,0.4,0.8c-0.4,0-0.7,0.1-1.1,0.1 c-22.2,0-44.5,0-66.7-0c-0.6-0-1.2-0.2-1.7-0.6c-8.1-6.1-15.3-13.1-21.4-21.3 c-0.7-1-2-1.3-3.1-0.9c-1,0.4-1.2,1.4-0.4,2.4c2,2.5,3.9,5.2,6.1,7.5 c4,4.1,8.3,8,12.4,12c0.2,0.2,0.5,0.4,0.9,0.8c-0.5,0.1-0.7,0.1-1,0.1 c-11.8,0-23.6,0-35.4-0c-0.5-0-1-0.1-1.4-0.4c-10.6-6.2-20.6-13.2-29.1-22.2 c-6.5-6.9-11.8-14.5-14.8-23.5c-1.3-3.7-2.1-7.6-2.3-11.5c-0-0.3-0-0.6-0-1 c0.5,0,1,0,1.4,0c10.2,0,20.4,0,30.6-0C54,254.9,54.5,254.3,54.4,252.6z M362.4,174.7 c8.2,3.7,16.1,8.1,23.7,13.1c0.4,0.3,0.8,0.6,1.2,0.8c-0,0.1-0,0.1-0.1,0.2 c-0.4,0-0.7,0-1.1,0c-21.1,0-42.3,0-63.4,0c-0.8,0-1.3-0.3-1.8-0.9 c-7.9-11.6-17.6-21.2-29.7-28.3c-3.5-2-7.3-3.6-11-5.4c-0.3-0.2-0.7-0.3-1-0.5 C308.1,156.3,336,162.7,362.4,174.7z M326.4,158c0-0.1,0-0.1,0-0.2 c0.2,0,0.3,0.1,0.5,0.1C326.7,158,326.6,158,326.4,158z M327.1,158 c3.7,0.6,7.3,1,10.9,1.7c13.4,2.4,26.7,5.3,39.8,9.1c16.9,4.8,33.4,10.8,49.1,18.7 c0.7,0.4,1.4,0.7,2.1,1.4c-0.3,0-0.6,0-0.9,0c-11,0-22.1,0-33.1-0 c-0.5-0-1.1-0.1-1.5-0.4c-12.6-9.2-26.3-16.2-40.8-21.9c-8.1-3.2-16.3-5.8-24.6-8.1 C327.9,158.4,327.5,158.2,327.1,158z M299.1,169.6c6.8,5.4,12.5,11.7,17.5,18.7 c0.1,0.1,0.1,0.3,0.3,0.5c-43.6,0-87,0-130.7,0c1-1.4,1.9-2.7,2.9-3.9 c7.5-9.6,16.4-17.5,27.1-23.3c8.5-4.7,17.6-7.6,27.3-8.7C264.4,150.7,282.8,156.7,299.1,169.6z M221.9,154.7c-16.5,7-29.4,18.4-39.5,33.1c-0.6,0.9-1.2,1.2-2.3,1.2 c-21-0-41.9-0-62.9-0c-0.4,0-0.9,0-1.3,0c-0-0.1-0.1-0.2-0.1-0.3 c1.8-1.2,3.5-2.3,5.4-3.5c15.7-9.7,32.5-16.6,50.2-21.8c12.2-3.6,24.7-6.2,37.3-8 c5.1-0.7,10.2-1.3,15.3-1.6C223.3,154.1,222.6,154.4,221.9,154.7z M176.3,158 c0.2-0.1,0.3-0.1,0.5-0.2c0,0.1,0,0.1,0,0.2C176.6,158,176.5,158,176.3,158z M175.2,158.5c-14.8,4-29.2,9.3-42.9,16.2c-7.9,4-15.4,8.5-22.5,13.7 c-0.4,0.3-1,0.6-1.6,0.6c-11.1,0-22.3,0-33.4,0c-0.3,0-0.5-0-0.8-0.2 c0.6-0.3,1.3-0.7,1.9-1c15.3-7.7,31.3-13.6,47.7-18.4c15.2-4.4,30.6-7.8,46.2-10.3 c2.1-0.3,4.2-0.6,6.4-0.9C175.8,158.2,175.5,158.4,175.2,158.5z M75,317.1 c11-0,22-0,33,0c0.5,0,1.2,0.1,1.6,0.5c12.5,9.1,26.1,16.1,40.4,21.7 c8.2,3.2,16.5,5.9,25,8.2c0.4,0.1,0.7,0.3,1,0.4c-3.7-0.6-7.3-1-11-1.7 c-13.5-2.4-26.8-5.3-39.9-9.1c-17-4.9-33.6-10.9-49.4-18.9c-0.6-0.3-1.1-0.6-1.6-0.9 c-0.1-0-0.1-0.1-0.2-0.3C74.4,317.1,74.7,317.1,75,317.1z M147.3,334.1 c-10.6-4.4-20.8-9.7-30.4-16.1c-0.4-0.2-0.7-0.5-1.3-0.9c0.5-0,0.9-0.1,1.2-0.1 c21.2-0,42.5-0,63.7-0c0.8-0,1.2,0.2,1.6,0.9c7.9,11.6,17.6,21.3,29.8,28.4 c3.5,2,7.3,3.6,11,5.4c0.3,0.2,0.7,0.3,1,0.5c-9.2-0.7-18.4-1.9-27.5-3.6 C179.7,345.4,163.2,340.7,147.3,334.1z M176.8,348c-0,0-0,0.1-0,0.1 c-0.2-0-0.3-0.1-0.5-0.1C176.5,348,176.7,348,176.8,348z M201.2,333.9 c-5.3-4.6-9.9-9.7-14-15.4c-0.3-0.4-0.5-0.8-0.8-1.2c-0-0.1-0-0.1-0-0.3 c43.5,0,86.9,0,130.4,0c-0.2,0.3-0.3,0.6-0.5,0.8c-9.7,13.5-21.9,23.9-37.4,30.3 c-10.2,4.1-20.8,5.9-31.8,5.2C229.6,352.3,214.5,345.4,201.2,333.9z M281.6,351.2 c16.1-6.9,28.7-17.9,38.6-32.1c1-1.5,2.1-2.1,3.9-2.1c20.6,0.1,41.2,0,61.7,0 c0.5,0,1,0,1.6,0.2c-0.6,0.4-1.1,0.8-1.7,1.2c-14.6,9.6-30.4,16.7-47,22.1 c-13.5,4.4-27.2,7.6-41.2,9.6c-6.1,0.9-12.2,1.6-18.3,2.4c-0-0.1-0-0.2-0.1-0.3 C280,351.8,280.8,351.5,281.6,351.2z M326.9,348c-0.2,0.1-0.3,0.1-0.5,0.2 c-0-0.1-0-0.1-0-0.2C326.6,348,326.7,348,326.9,348z M328.2,347.5 c18.2-5,35.7-11.7,52-21.3c4.5-2.7,8.8-5.7,13.2-8.6c0.5-0.3,1.1-0.6,1.7-0.6 c11.1-0,22.2-0,33.3-0c0.3,0,0.5,0,1.2,0.1c-0.9,0.5-1.5,0.8-2.2,1.2 c-13.2,6.7-26.9,12-40.9,16.4c-15.2,4.8-30.6,8.4-46.3,11.2c-3.9,0.7-7.9,1.4-11.9,2 c-0.5,0.1-0.9,0.1-1.4,0.1C327.5,347.8,327.8,347.6,328.2,347.5z"/></svg>';

	// Weyland-Yutani — the bowtie/chevron icon over a widely tracked
	// wordmark and tagline, ~2:1. Sourced as a Sketch-adjacent export with a
	// full-canvas background shape and metadata; cleaned to just the mark
	// (background dropped, fills normalized to `currentColor`, viewBox
	// tightened to content).
	const weylandSvg =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="41 38 723 353"><g transform="translate(733.84966,-1242.6343)"><path fill-rule="nonzero" fill="currentColor" d="m-690.8,1348,158,205.7,99.18,0,102.9-141.4,100.5,141.4,91.84,0,167.6-205.7-102.9,0-102.9,141.4-102.9-141.4-102.9,0-102.9,141.4-102.9-141.4-102.9,0z"/><path fill-rule="nonzero" fill="currentColor" d="m-399.4,1554,137.1,0-69.21-103.8-67.94,103.8z"/><path stroke-linejoin="bevel" d="m-399.4,1554,137.1,0-69.21-103.8-67.94,103.8z" stroke="currentColor" stroke-linecap="butt" stroke-miterlimit="4" stroke-dasharray="none" stroke-width="1.25" fill="none"/><path fill-rule="nonzero" fill="currentColor" d="m-245.1,1348,137.1,0-68.57,102.9-68.57-102.9z"/><path fill-rule="nonzero" fill="currentColor" d="m-553.7,1348,137.1,0-68.57,102.9-68.57-102.9z"/><path fill-rule="nonzero" fill="currentColor" d="m-652.6,1324-8.682,0-6.239-18.71-6.239,18.71-8.681,0-8.43-42.32,10.2,0,3.962,23.94,6.659-20.1,5.142,0,6.575,19.77,4.046-23.61,10.2,0-8.514,42.32z"/><path fill-rule="nonzero" fill="currentColor" d="m-639.9,1324,0-42.32,33.64,0,0,7.34-23.77,0,0,9.986,16.1,0,0,7.67-16.1,0,0,9.986,23.77,0,0,7.34-33.64,0z"/><path fill-rule="nonzero" fill="currentColor" d="m-578.5,1307,0,17.33-9.695,0-0.0838-17.33-15.43-25,11.38,0,9.02,16.73,8.682-16.73,11.13,0-15,25z"/><path fill-rule="nonzero" fill="currentColor" d="m-559.3,1324,0-42.32,9.779,0,0,34.98,21.66,0,0,7.34-31.44,0z"/><path fill-rule="nonzero" fill="currentColor" d="m-506.3,1294-4.215,12.7,8.345,0-4.13-12.7zm10.54,30.02-3.794-10.38-13.49,0-3.372,10.38-9.778,0,15.43-42.32,8.935,0,15.51,42.32-9.441,0z"/><path fill-rule="nonzero" fill="currentColor" d="m-457,1324-15.43-24,0.0838,24-9.694,0,0-42.32,8.514,0,15.43,24.01,0-24.01,9.611,0,0,42.32-8.515,0z"/><path fill-rule="nonzero" fill="currentColor" d="m-416.2,1289-13.99,0,0,27.64,13.99,0,0-27.64zm3.035,34.98-26.89,0,0-42.32,26.89,0,6.744,5.291,0,31.74-6.744,5.29z"/><path fill-rule="nonzero" fill="currentColor" d="m-398.9,1302,25.29,0,0,7.009-25.29,0,0-7.009z"/><path fill-rule="nonzero" fill="currentColor" d="m-345,1307,0,17.33-9.695,0-0.0838-17.33-15.43-25,11.38,0,9.02,16.73,8.682-16.73,11.13,0-15,25z"/><path fill-rule="nonzero" fill="currentColor" d="m-299,1324-20.06,0-6.744-5.29,0-37.03,9.779,0,0,34.98,13.99,0,0-34.98,9.779,0,0,37.03-6.745,5.29z"/><path fill-rule="nonzero" fill="currentColor" d="m-249.4,1289-13.99,0,0,34.98-9.778,0,0-34.98-13.99,0.066,0-7.406,37.76,0,0,7.34z"/><path fill-rule="nonzero" fill="currentColor" d="m-234.2,1294-4.215,12.7,8.346,0-4.131-12.7zm10.54,30.02-3.792-10.38-13.49,0-3.37,10.38-9.778,0,15.42-42.32,8.936,0,15.51,42.32-9.44,0z"/><path fill-rule="nonzero" fill="currentColor" d="m-185,1324-15.43-24,0.085,24-9.695,0,0-42.32,8.515,0,15.43,24.01,0-24.01,9.609,0,0,42.32-8.514,0z"/><path fill-rule="nonzero" fill="currentColor" d="m-158.2,1324-9.779,0,0-42.32,9.779,0,0,42.32z"/><path fill-rule="nonzero" fill="currentColor" d="m-102.9,1324-19.05,0-6.745-5.29,0-31.74,6.745-5.291,19.05,0,6.744,5.291,0,2.049-22.76,0,0,27.64,22.76,0,0,2.05-6.744,5.29z"/><path fill-rule="nonzero" fill="currentColor" d="m-66.11,1289-13.99,0,0,27.64,13.99,0,0-27.64zm3.034,34.98-20.06,0-6.744-5.29,0-31.74,6.744-5.291,20.06,0,6.745,5.291,0,31.74-6.745,5.29z"/><path fill-rule="nonzero" fill="currentColor" d="m-24.13,1289-13.99,0,0,10.98,13.99,0,0-10.98zm0.5888,34.98-8.09-16.33-6.492,0,0,16.33-9.779,0,0-42.32,26.81,0,6.742,5.291,0,15.41-6.742,5.29,8.429,16.33-10.88,0z"/><path fill-rule="nonzero" fill="currentColor" d="m16.58,1289-13.99,0,0,11.31,13.99,0,0-11.31zm3.034,18.65-17.03,0,0,16.33-9.779,0,0-42.32,26.8,0,6.745,5.291,0,15.41-6.745,5.29z"/><path fill-rule="nonzero" fill="currentColor" d="m-671.3,1592-5.261-20.44,10.22,0,0,20.44-4.96,0zm-12.1,0-5.26-20.44,10.22,0,0,20.44-4.961,0z"/><path fill-rule="nonzero" fill="currentColor" d="m-637.6,1600-12.48,0,0,11.95,12.48,0,0-11.95zm0-19.46-12.48,0,0,11.2,12.48,0,0-11.2zm2.705,39.76-23.9,0,0-48.1,23.9,0,6.011,6.012,0,13.9-3.756,3.756,3.756,3.756,0,14.66-6.011,6.011z"/><path fill-rule="nonzero" fill="currentColor" d="m-592.2,1620-1.955,0-6.764-4.359-4.36,4.359-10.07,0-6.014-6.011,0-32.24,8.719,0,0,29.91,11.72,0,0-29.91,8.719,0,0,38.25z"/><path fill-rule="nonzero" fill="currentColor" d="m-576,1620-8.719,0,0-38.25,8.719,0,0,38.25zm-8.719-51.11,8.719,0,0,9.02-8.719,0,0-9.02z"/><path fill-rule="nonzero" fill="currentColor" d="m-559.7,1620-8.794,0,0-48.18,7.065-2.779,1.729-0.1525,0,51.11z"/><path fill-rule="nonzero" fill="currentColor" d="m-531.7,1590-11.72,0,0,21.57,11.72,0,0-21.57zm8.719,29.91-1.954,0-6.765-4.359-4.359,4.359-10.07,0-6.012-6.011,0-26.23,6.012-6.014,10.07,0,4.359,4.359,0-14.43,6.99-2.701,1.729,0,0,51.03z"/><path fill-rule="nonzero" fill="currentColor" d="m-506.7,1620-8.719,0,0-38.25,8.719,0,0,38.25zm-8.719-51.11,8.719,0,0,9.02-8.719,0,0-9.02z"/><path fill-rule="nonzero" fill="currentColor" d="m-470.1,1620-8.72,0,0-29.91-11.72,0,0,29.91-8.719,0,0-38.25,1.954,0,6.765,4.359,4.359-4.359,10.07,0,6.012,6.014,0,32.24z"/><path fill-rule="nonzero" fill="currentColor" d="m-441.4,1590-12.48,0,0,17.96,12.48,0,0-17.96zm6.914-8.342,1.804,0,0,44.19-6.012,6.014-17.51,0-6.011-6.014,0-1.955,20.82,0,0-12.1-4.36,4.361-10.82,0-6.014-6.012,0-22.47,6.014-6.014,10.82,0,4.36,4.359,6.914-4.359z"/><path fill-rule="nonzero" fill="currentColor" d="m-385.1,1600-12.48,0,0,11.95,12.48,0,0-11.95zm0-19.46-12.48,0,0,11.2,12.48,0,0-11.2zm2.705,39.76-23.9,0,0-48.1,23.9,0,6.012,6.012,0,13.9-3.758,3.756,3.758,3.756,0,14.66-6.012,6.011z"/><path fill-rule="nonzero" fill="currentColor" d="m-347.7,1590-12.48,0,0,7.138,12.48,0,0-7.138zm2.706,29.91-17.89,0-6.014-6.011,0-26.23,6.014-6.014,17.89,0,6.011,6.014,0,11.42-6.011,6.015-15.18,0,0,6.836,21.19,0,0,1.956-6.011,6.011z"/><path fill-rule="nonzero" fill="currentColor" d="m-321.8,1590,0,21.57,8.116,0,0,8.344-10.82,0-6.014-6.011,0-23.9-4.508,0,0-1.954,4.508-6.389,0-9.47,6.84-3.382,1.878,0,0,12.85,8.266,0,0,8.342-8.266,0z"/><path fill-rule="nonzero" fill="currentColor" d="m-298.6,1590,0,21.57,8.118,0,0,8.344-10.82,0-6.01-6.011,0-23.9-4.512,0,0-1.954,4.512-6.389,0-9.47,6.836-3.382,1.88,0,0,12.85,8.268,0,0,8.342-8.268,0z"/><path fill-rule="nonzero" fill="currentColor" d="m-264.2,1590-12.47,0,0,7.138,12.47,0,0-7.138zm2.706,29.91-17.89,0-6.012-6.011,0-26.23,6.012-6.014,17.89,0,6.012,6.014,0,11.42-6.012,6.015-15.18,0,0,6.836,21.19,0,0,1.956-6.012,6.011z"/><path fill-rule="nonzero" fill="currentColor" d="m-223.9,1590-15.71,0,0,29.91-8.641,0-0.0763-38.25,1.954,0,6.764,4.359,4.359-4.359,6.991,0,4.356,4.359,0,3.984z"/><path fill-rule="nonzero" fill="currentColor" d="m-170.3,1620-7.74,0-5.561-21.27-5.562,21.27-7.742,0-7.514-48.1,9.094,0,3.531,27.21,5.941-22.85,4.584,0,5.861,22.47,3.606-26.83,9.094,0-7.591,48.1z"/><path fill-rule="nonzero" fill="currentColor" d="m-137.7,1590-12.48,0,0,21.57,12.48,0,0-21.57zm2.706,29.91-17.88,0-6.015-6.011,0-26.23,6.015-6.014,17.88,0,6.011,6.014,0,26.23-6.011,6.011z"/><path fill-rule="nonzero" fill="currentColor" d="m-97.08,1590-15.71,0,0,29.91-8.641,0-0.075-38.25,1.951,0,6.765,4.359,4.36-4.359,6.988,0,4.361,4.359,0,3.984z"/><path fill-rule="nonzero" fill="currentColor" d="m-83.78,1620-8.796,0,0-48.18,7.066-2.779,1.73-0.1525,0,51.11z"/><path fill-rule="nonzero" fill="currentColor" d="m-55.82,1590-11.72,0,0,21.57,11.72,0,0-21.57zm8.716,29.91-1.952,0-6.764-4.359-4.36,4.359-10.07,0-6.012-6.011,0-26.23,6.012-6.014,10.07,0,4.36,4.359,0-14.43,6.988-2.701,1.729,0,0,51.03z"/><path fill-rule="nonzero" fill="currentColor" d="m-17.95,1620-15.63,0-6.014-6.011,0-1.956,18.94,0,0-7.212-12.93,0-6.014-6.014,0-11.05,6.014-6.014,15.63,0,6.014,6.014,0,1.952-18.94,0,0,6.839,12.92,0,6.014,6.014,0,11.42-6.014,6.011z"/><path fill-rule="nonzero" fill="currentColor" d="m12.64,1592-4.956,0,0-20.44,10.22,0-5.264,20.44zm-12.1,0-4.961,0,0-20.44,10.22,0-5.262,20.44z"/></g></svg>';
	// Delos — the rounded-bracket "DELOS" badge, ~3.5:1. The flagship
	// thin-letterform specimen: bold-for-its-height glyphs inside a slim
	// racetrack outline, the shape that most needs `scale` to read at wall
	// size — the Appearance tab's featured before/after. Sourced as a Sketch
	// export; recolored to `currentColor`, its `<title>`/`<desc>`/empty
	// `<defs>` stripped, and its byte-identical duplicate letterform paths
	// (a Sketch export artifact) dropped.
	const delosSvg =
		'<svg width="217px" height="62px" viewBox="0 0 217 62" xmlns="http://www.w3.org/2000/svg"><g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="delos-logo"><g id="Page-1"><path d="M28.5232,20.9776 L28.5232,39.0746 L36.2632,39.0746 C38.7622,39.0356 41.6212,38.9936 43.4862,36.3346 C44.3192,35.1836 45.1932,33.2416 45.1932,29.7066 C45.1932,27.0496 44.5972,25.2236 43.8042,23.9536 C41.9782,21.0556 39.0402,21.0166 36.6202,20.9776 L28.5232,20.9776 Z M21.5382,16.0136 L36.8572,16.0136 C37.8902,16.0556 38.9222,16.0556 39.9532,16.1756 C48.1292,16.9286 52.1792,22.6416 52.1792,29.8676 C52.1792,33.0806 51.3842,36.2566 49.4402,38.8356 C45.5102,43.9546 40.2312,43.9966 35.9852,44.0356 L21.5382,44.0356 L21.5382,16.0136 Z" id="Fill-1" fill="currentColor"></path><polygon id="Fill-3" fill="currentColor" points="57.9522 16.0138 84.0672 16.0138 84.0672 21.0548 64.9782 21.0548 64.9782 27.3668 83.4322 27.3668 83.4322 32.3268 64.9782 32.3268 64.9782 39.0358 84.8622 39.0358 84.8622 44.0358 57.9522 44.0358"></polygon><polygon id="Fill-5" fill="currentColor" points="91.1104 16.0138 98.1344 16.0138 98.1344 38.8748 113.6934 38.8748 113.6934 44.0358 91.1104 44.0358"></polygon><path d="M121.8514,30.2233 C121.8514,33.6363 123.1214,35.4233 123.6364,36.0983 C124.3124,37.0483 126.3754,39.9473 131.8134,39.9473 C138.3614,39.9473 141.8554,35.5043 141.8554,30.1033 C141.8554,23.8343 137.1324,19.9853 131.5354,20.1823 C126.8524,20.3413 121.8514,23.4373 121.8514,30.2233 M146.0224,20.5803 C147.1734,21.9693 149.0374,25.0653 149.0374,29.7483 C149.0374,38.6773 143.2434,44.9463 131.9324,44.9463 C120.6214,44.9463 114.6284,38.7973 114.6284,30.0653 C114.6284,20.4213 121.5344,15.5383 130.7414,15.1413 C136.2584,14.9053 142.5294,16.3333 146.0224,20.5803" id="Fill-7" fill="currentColor"></path><path d="M158.9814,35.3422 C160.5694,38.7162 164.5784,39.7502 168.3884,39.7502 C170.0954,39.7502 175.4534,39.4722 175.4534,36.0562 C175.4534,34.0332 173.5074,33.5582 172.0004,33.2802 C170.8494,33.0412 165.0944,32.1692 163.7834,31.9292 C161.2044,31.4542 154.6964,30.2232 154.6964,23.8732 C154.6964,22.4832 155.0924,21.0552 155.8064,19.9042 C158.1494,16.1332 163.3084,15.1412 167.7534,15.1412 C171.8414,15.1412 174.9764,15.7362 177.8734,17.3262 C180.7324,18.8742 181.9614,20.9352 182.5174,21.8502 L175.8494,23.5172 C175.6114,23.0812 175.0554,22.0472 173.3894,21.2132 C171.5234,20.3022 169.1034,20.1442 167.7534,20.1442 C164.6574,20.1442 161.4824,20.7382 161.4824,23.3982 C161.4824,25.2242 163.1094,25.6992 165.2134,26.1742 C166.3644,26.4132 172.0794,27.3662 173.3894,27.6442 C176.6444,28.2392 182.1604,29.4282 182.1604,35.5812 C182.1604,44.5912 171.4444,44.9082 167.9124,44.9082 C163.3084,44.9082 156.2034,44.1162 152.5924,37.0102 L158.9814,35.3422 Z" id="Fill-9" fill="currentColor"></path><path d="M173.782,60.5 C190.192,60.5 203.5,47.41 203.5,31 C203.5,14.59 190.192,1.5 173.782,1.5 L2,1.5 L2,48.126 L14.592,60.5 L173.782,60.5 Z" id="Stroke-11" stroke="currentColor"></path><path d="M173.78,59 L15.21,59 L3,47.5 L3,3 L173.78,3 C189.34,3 202,15.56 202,31 C202,46.44 189.34,59 173.78,59 M173.78,0 L0,0 L0,48.75 L13.98,62 L173.78,62 C191,62 205,48.09 205,31 C205,13.91 191,0 173.78,0" id="Fill-23" fill="currentColor"></path><path d="M194.59,0 L188.66,0 C200.11,5.63 208,17.41 208,31 C208,44.59 200.11,56.37 188.66,62 L194.59,62 C204.49,55.24 211,43.87 211,31 C211,18.13 204.49,6.76 194.59,0" id="Fill-25" fill="currentColor"></path><path d="M203.38,0 L198.72,0 C208.01,7.16 214,18.4 214,31 C214,43.6 208.01,54.84 198.72,62 L203.38,62 C211.75,54.29 217,43.25 217,31 C217,18.75 211.75,7.71 203.38,0" id="Fill-27" fill="currentColor"></path></g></g></g></svg>';
	// The one tuned config, used everywhere these marks appear together —
	// not just a "before/after" for the Appearance tab. Black Mesa and Lumon
	// read optically smaller than ACME and Umbrella at identical geometry
	// (a thin outline mark and a tall, narrow one both lose to the formula);
	// Weyland-Yutani and Delos are the same problem in its most extreme form
	// — thin, wide wordmarks shrink hardest of all once normalized — so
	// `scale` corrects every one of them once, here, rather than per demo.
	const logos = [
		{ name: 'ACME Corp', svg: acmeSvg, scale: 1, brightness: 1 },
		{ name: 'Umbrella Corporation', svg: umbrellaSvg, scale: 0.9, brightness: 1 },
		{ name: 'Black Mesa Research Facility', svg: blackMesaSvg, scale: 1.15, brightness: 1 },
		{ name: 'Lumon Industries', svg: lumonSvg, scale: 1.4, brightness: 1 },
		{ name: 'Weyland-Yutani', svg: weylandSvg, scale: 1.3, brightness: 1 },
		{ name: 'Delos', svg: delosSvg, scale: 1.2, brightness: 1 }
	];

	const basicCode = [
		'const acmeSvg =',
		'\t\'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 64 190 62">…</svg>\';',
		'',
		'<Logo name="ACME Corp" svg={acmeSvg} />'
	].join('\n');

	// Hand-rolled, NOT going through Logo — an inline-stamped
	// --hz-logo-width-factor cannot be overridden from outside Logo, so the
	// naive "everyone the same height" approach has to be plain <svg>
	// elements sized by ordinary CSS instead. scale/brightness are a Logo
	// concept, so they play no part in this row.
	const naiveCode = [
		'<div class="naive-row">',
		'\t{#each logos as logo (logo.name)}',
		'\t\t<span class="naive-logo">{@html logo.svg}</span>',
		'\t{/each}',
		'</div>',
		'',
		'<style>',
		'\t.naive-row { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }',
		'\t/* :global — the svg comes from {@html}, invisible to Svelte statically. */',
		'\t.naive-logo :global(svg) { display: block; height: 4rem; width: auto; }',
		'</style>'
	].join('\n');

	// The normalized row and everything after it render through Logo with
	// the same tuned config — including scale/brightness, which is why
	// Black Mesa and Lumon read at a matching weight here and on every
	// other tab.
	const normalizedCode = [
		'const logos = [',
		"\t{ name: 'ACME Corp', svg: acmeSvg, scale: 1, brightness: 1 },",
		"\t{ name: 'Umbrella Corporation', svg: umbrellaSvg, scale: 0.9, brightness: 1 },",
		"\t{ name: 'Black Mesa Research Facility', svg: blackMesaSvg, scale: 1.15, brightness: 1 },",
		"\t{ name: 'Lumon Industries', svg: lumonSvg, scale: 1.4, brightness: 1 },",
		"\t{ name: 'Weyland-Yutani', svg: weylandSvg, scale: 1.3, brightness: 1 },",
		"\t{ name: 'Delos', svg: delosSvg, scale: 1.2, brightness: 1 }",
		'];',
		'',
		'<Cluster gap="lg" justify="center">',
		'\t{#each logos as logo (logo.name)}',
		'\t\t<Logo name={logo.name} svg={logo.svg} scale={logo.scale} brightness={logo.brightness} />',
		'\t{/each}',
		'</Cluster>'
	].join('\n');

	const headerFooterCode = [
		'<Header>',
		'\t{#snippet brand()}',
		'\t\t<a href="/" aria-label="Acme home">',
		'\t\t\t<Logo name="Acme" svg={acmeSvg} />',
		'\t\t</a>',
		'\t{/snippet}',
		'</Header>',
		'',
		'<Footer>',
		'\t{#snippet logo()}',
		'\t\t<a href="/" aria-label="Acme home">',
		'\t\t\t<Logo name="Acme" svg={acmeSvg} />',
		'\t\t</a>',
		'\t{/snippet}',
		'</Footer>'
	].join('\n');

	// One --hz-logo-size override on Grid itself normalizes every logo in
	// the wall to a shared base size.
	const wallCode = [
		'<Grid columns={3} gap="away" padding="sm" align="center" style="--hz-logo-size: 5rem">',
		'\t{#each logos as logo (logo.name)}',
		'\t\t<Logo',
		'\t\t\tclass="wall-logo"',
		'\t\t\tname={logo.name}',
		'\t\t\tsvg={logo.svg}',
		'\t\t\tscale={logo.scale}',
		'\t\t\tbrightness={logo.brightness}',
		'\t\t/>',
		'\t{/each}',
		'</Grid>',
		'',
		'<style>',
		'\t/* Grid items default to justify-items: start; center each mark so the',
		'\t   wall reads as balanced instead of left-hugging its column. */',
		'\t:global(.wall-logo) {',
		'\t\tjustify-self: center;',
		'\t}',
		'</style>'
	].join('\n');

	// The featured before/after: Delos is the flagship thin-letterform mark
	// on the wall, so it's the clearest illustration of what `scale` buys
	// you — the same `1.2` used everywhere else this mark appears.
	const delosScaleCompareCode = [
		'<Cluster gap="lg" justify="center">',
		'\t<Stack gap="sm" align="center">',
		'\t\t<Logo name="Delos" svg={delosSvg} />',
		'\t\t<span class="scale-label">scale 1 (default)</span>',
		'\t</Stack>',
		'\t<Stack gap="sm" align="center">',
		'\t\t<Logo name="Delos" svg={delosSvg} scale={1.2} />',
		'\t\t<span class="scale-label">scale 1.2</span>',
		'\t</Stack>',
		'</Cluster>'
	].join('\n');

	const scaleBrightnessCode = [
		'const logos = [',
		"\t{ name: 'ACME Corp', svg: acmeSvg, scale: 1, brightness: 1 },",
		"\t{ name: 'Umbrella Corporation', svg: umbrellaSvg, scale: 0.9, brightness: 1 },",
		"\t{ name: 'Black Mesa Research Facility', svg: blackMesaSvg, scale: 1.15, brightness: 1 },",
		"\t{ name: 'Lumon Industries', svg: lumonSvg, scale: 1.4, brightness: 1 },",
		"\t{ name: 'Weyland-Yutani', svg: weylandSvg, scale: 1.3, brightness: 1 },",
		"\t{ name: 'Delos', svg: delosSvg, scale: 1.2, brightness: 1 }",
		'];',
		'',
		'<Grid columns={3} gap="away" padding="sm" align="center" style="--hz-logo-size: 5rem">',
		'\t{#each logos as logo (logo.name)}',
		'\t\t<Logo',
		'\t\t\tclass="wall-logo"',
		'\t\t\tname={logo.name}',
		'\t\t\tsvg={logo.svg}',
		'\t\t\tscale={logo.scale}',
		'\t\t\tbrightness={logo.brightness}',
		'\t\t/>',
		'\t{/each}',
		'</Grid>',
		'',
		'<style>',
		'\t/* Grid items default to justify-items: start; center each mark so the',
		'\t   wall reads as balanced instead of left-hugging its column. */',
		'\t:global(.wall-logo) {',
		'\t\tjustify-self: center;',
		'\t}',
		'</style>'
	].join('\n');

	// The same wall, with --hz-logo-color forced to the theme's primary
	// intent color, compared against the plain wall above — the recolor has
	// to visibly happen for "Umbrella stands out" to mean anything. ACME,
	// Black Mesa, and Lumon (no declared fill) pick it up; Umbrella (hard-
	// coded brand red/white) and Weyland-Yutani/Delos (currentColor declared
	// directly on every path, not inherited) hold their ground — verified by
	// sampling each mark's rendered fill before/after the override, not just
	// read off the CSS.
	const monochromeWallCode = [
		'<Grid',
		'\tcolumns={3}',
		'\tgap="away"',
		'\tpadding="sm"',
		'\talign="center"',
		'\tstyle="--hz-logo-size: 5rem; --hz-logo-color: var(--hz-intent-primary, #2563eb)"',
		'>',
		'\t{#each logos as logo (logo.name)}',
		'\t\t<Logo',
		'\t\t\tclass="wall-logo"',
		'\t\t\tname={logo.name}',
		'\t\t\tsvg={logo.svg}',
		'\t\t\tscale={logo.scale}',
		'\t\t\tbrightness={logo.brightness}',
		'\t\t/>',
		'\t{/each}',
		'</Grid>',
		'',
		'<style>',
		'\t/* Grid items default to justify-items: start; center each mark so the',
		'\t   wall reads as balanced instead of left-hugging its column. */',
		'\t:global(.wall-logo) {',
		'\t\tjustify-self: center;',
		'\t}',
		'</style>'
	].join('\n');

	const fallbackCode = '<Logo name="Soylent" />';

	const childrenCode = [
		'<Logo name="ACME Corp">',
		'\t<svg viewBox="0 64 190 62" fill-rule="evenodd" clip-rule="evenodd">',
		'\t\t<path d="M23.454 68.785l-20.62 55.488h15.768l2.729-7.883H33.46v7.883h15.464V68.785h-25.47zm9.703 31.535h-6.368l6.368-13.342v13.342zM94.71 68.178H70.149c-8.188 0-10.916 10.613-10.916 10.613l-5.761 33.051s-2.123 12.432 8.49 12.432h23.045l2.426-16.373H75.001s-5.458 1.213-4.548-4.852c.303-.91 2.426-13.039 2.426-13.039s.606-4.245 3.335-4.245h15.464l3.032-17.587zM101.988 68.482l-11.523 55.791h15.162l5.154-23.65 1.213 23.65h8.188l9.095-23.65-4.548 23.65h13.644l11.221-56.095h-19.406l-9.401 23.348V68.482h-18.799zM145.955 124.273l10.611-56.095h31.233l-2.426 16.072H169l-.91 5.457h15.767l-2.425 12.129-16.071-.303-.91 5.457h16.07l-3.335 17.283h-31.231zM185.07 123.365c-2.123 0-3.336-1.518-3.336-3.639 0-2.123 1.213-3.639 3.336-3.639s3.639 1.516 3.639 3.639c0 2.122-1.516 3.639-3.639 3.639zm0 1.213c2.729 0 4.852-2.426 4.852-4.852 0-2.729-2.123-4.852-4.852-4.852s-4.852 2.123-4.852 4.852c.001 2.426 2.124 4.852 4.852 4.852zm1.213-4.549c.91 0 1.516-.303 1.516-1.516s-.91-1.516-2.123-1.516h-2.426v5.154h.91v-2.123h.91l1.213 2.123h1.213l-1.213-2.122zm-2.123-.607v-1.516h1.213c.607 0 1.213 0 1.213.607 0 .605-.303.908-.91.908h-1.516v.001z"/>',
		'\t</svg>',
		'</Logo>'
	].join('\n');

	const directImportCode = [
		"import acmeSvg from '$lib/assets/acme.svg?raw';",
		'',
		'<Logo name="Acme" svg={acmeSvg} />'
	].join('\n');

	const missingRawCode = [
		'// Missing ?raw. This imports the URL string Vite serves the file at,',
		'// not its markup. Logo renders it anyway and warns in development that',
		'// the value does not look like SVG.',
		"import acmeSvg from '$lib/assets/acme.svg';"
	].join('\n');

	const globCode = [
		"const logoModules = import.meta.glob('$lib/assets/logos/*.svg', {",
		"\tquery: '?raw',",
		"\timport: 'default',",
		'\teager: true',
		'});',
		'',
		'const logos = [',
		"\t{ slug: 'acme', name: 'Acme', scale: 1, brightness: 1 },",
		"\t{ slug: 'globex', name: 'Globex', scale: 0.85, brightness: 1 }",
		'].map((entry) => ({',
		'\t...entry,',
		'\tsvg: logoModules[`/src/lib/assets/logos/${entry.slug}.svg`]',
		'}));'
	].join('\n');

	const demoTabs = [
		{ id: 'basic', label: 'Basic' },
		{ id: 'appearance', label: 'Appearance' },
		{ id: 'wall', label: 'Logo wall' },
		{ id: 'fallbacks', label: 'Fallbacks' },
		{ id: 'assets', label: 'Resolving your assets' }
	];
</script>

<DocPage name="Logo" {...logoDoc}>
	<Tabs items={demoTabs} ariaLabel="Logo demos" defaultTab="basic">
		{#snippet panel(item)}
			<!-- gap="near": notes stack above their Example/Alert/CodeBlock, and
			     neither carries spacing of its own — same convention as the
			     Icons demo tab. -->
			<Stack class="tab-content" gap="near">
				{#if item.id === 'basic'}
					<p class="tab-note">
						<code>svg</code> takes a raw SVG string. It is usually a page-local constant from a
						<code>?raw</code> import:
					</p>
					<Example code={basicCode}>
						<Logo name="ACME Corp" svg={acmeSvg} />
					</Example>
					<p class="tab-note">
						Sizing a wall by equal height alone stretches a flat wordmark very wide and squeezes a
						tall crest down to a sliver. Neither one reads as belonging beside the others. Logo's
						normalization interpolates toward equal height instead of matching it exactly, so every
						mark lands at a comparable size with no distortion. Logo stamps its width factor inline,
						and an inline value cannot be overridden from outside, so the naive row below uses plain
						<code>&lt;svg&gt;</code> elements rather than <code>Logo</code>: the same fixed-height
						CSS you would otherwise reach for.
					</p>
					<p class="tab-note">Naive sizing, every mark forced to the same height in plain SVG:</p>
					<Example code={naiveCode}>
						<div class="naive-row">
							{#each logos as logo (logo.name)}
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								<span class="naive-logo">{@html logo.svg}</span>
							{/each}
						</div>
					</Example>
					<p class="tab-note">
						Normalized, Logo's default, with the per-mark <code>scale</code>/<code>brightness</code>
						tuning the Appearance tab covers. The same config renders every wall on this page:
					</p>
					<Example code={normalizedCode}>
						<Cluster gap="lg" justify="center">
							{#each logos as logo (logo.name)}
								<Logo
									name={logo.name}
									svg={logo.svg}
									scale={logo.scale}
									brightness={logo.brightness}
								/>
							{/each}
						</Cluster>
					</Example>
					<p class="tab-note">
						<code>Header</code>'s <code>brand</code> snippet and <code>Footer</code>'s
						<code>logo</code> snippet are both plain snippets, so a <code>Logo</code> drops in unchanged.
						The link, not the logo, owns the click target and the focus ring:
					</p>
					<CodeBlock code={headerFooterCode} language="svelte" />
				{:else if item.id === 'appearance'}
					<p class="tab-note">
						<code>scale</code> and <code>brightness</code> nudge a mark whose optical weight fights
						its geometry. Both come from the same config array every wall on this page uses. A thin,
						wide wordmark, such as a fashion house's masthead, feels this hardest: normalized by
						width, its sliver of height shrinks even further, so at the default scale it reads like
						a footnote next to anything bolder. Here is Delos untuned, then at the
						<code>scale</code> used everywhere else on this page:
					</p>
					<Example code={delosScaleCompareCode}>
						<Cluster gap="lg" justify="center">
							<Stack gap="sm" align="center">
								<Logo name="Delos" svg={delosSvg} />
								<span class="scale-label">scale 1 (default)</span>
							</Stack>
							<Stack gap="sm" align="center">
								<Logo name="Delos" svg={delosSvg} scale={1.2} />
								<span class="scale-label">scale 1.2</span>
							</Stack>
						</Cluster>
					</Example>
					<p class="tab-note">
						The same idea applied to the whole wall: every mark's <code>scale</code> and
						<code>brightness</code> comes from one config array:
					</p>
					<Example code={scaleBrightnessCode}>
						<Grid columns={3} gap="away" padding="sm" align="center" style="--hz-logo-size: 5rem">
							{#each logos as logo (logo.name)}
								<Logo
									class="wall-logo"
									name={logo.name}
									svg={logo.svg}
									scale={logo.scale}
									brightness={logo.brightness}
								/>
							{/each}
						</Grid>
					</Example>
					<p class="tab-note">
						<code>monochrome</code> (the default) recolors a mark that declares no <code>fill</code>
						to <code>var(--hz-logo-color, currentColor)</code>. The wall below sets
						<code>--hz-logo-color</code> to the theme's primary intent color, so compare it with the
						plain wall above: ACME, Black Mesa, and Lumon change color. Umbrella's eight segments
						keep their hard-coded brand red and white, while Weyland-Yutani and Delos declare
						<code>currentColor</code> directly on every path rather than inheriting it. A declared
						fill cannot be overridden by an inherited one, and declaring <code>currentColor</code>
						is still declaring a fill. <code>monochrome={false}</code> turns the recolor off by prop instead
						of markup:
					</p>
					<Example code={monochromeWallCode}>
						<Grid
							columns={3}
							gap="away"
							padding="sm"
							align="center"
							style="--hz-logo-size: 5rem; --hz-logo-color: var(--hz-intent-primary, #2563eb)"
						>
							{#each logos as logo (logo.name)}
								<Logo
									class="wall-logo"
									name={logo.name}
									svg={logo.svg}
									scale={logo.scale}
									brightness={logo.brightness}
								/>
							{/each}
						</Grid>
					</Example>
					<Alert intent="info" title="Editing someone else's brand mark" headingLevel={4}>
						{#snippet icon()}<IconInfo />{/snippet}
						Umbrella's fills are hard-coded here on purpose, for the demo. A real brand asset that resists
						monochrome the same way needs a human to fix it. Either edit the SVG directly (drop the per-path
						<code>fill</code>
						attributes so <code>currentColor</code> can reach them) or check the brand's guidelines first.
						Many brands ship an official single-color variant for exactly this case, and using it beats
						hand-editing someone else's mark.
					</Alert>
				{:else if item.id === 'wall'}
					<p class="tab-note">
						Build a logo wall by composition: <code>Grid</code> (or <code>Cluster</code>,
						<code>Carousel</code>, and so on) plus one <code>--hz-logo-size</code> override. It can
						go on the <code>Grid</code> itself or on any ancestor, since custom properties inherit
						either way. A wall only reads as balanced if every mark sits mid-column rather than
						hugging one edge, so each <code>Logo</code> gets <code>justify-self: center</code> — Grid's
						items sit at their column's start edge by default.
					</p>
					<Example code={wallCode}>
						<Grid columns={3} gap="away" padding="sm" align="center" style="--hz-logo-size: 5rem">
							{#each logos as logo (logo.name)}
								<Logo
									class="wall-logo"
									name={logo.name}
									svg={logo.svg}
									scale={logo.scale}
									brightness={logo.brightness}
								/>
							{/each}
						</Grid>
					</Example>
				{:else if item.id === 'fallbacks'}
					<p class="tab-note">
						An <code>&lt;svg&gt;</code> written directly as markup works too. Logo measures the
						<code>svg</code> prop while rendering on the server, so the sizing is already right in
						the server HTML. It can only measure this form after the page hydrates, so the mark
						renders square until then. Reach for children when you want the ergonomics, and for
						<code>svg</code> when server-rendered sizing matters.
					</p>
					<Example code={childrenCode}>
						<Logo name="ACME Corp">
							<svg viewBox="0 64 190 62" fill-rule="evenodd" clip-rule="evenodd">
								<path
									d="M23.454 68.785l-20.62 55.488h15.768l2.729-7.883H33.46v7.883h15.464V68.785h-25.47zm9.703 31.535h-6.368l6.368-13.342v13.342zM94.71 68.178H70.149c-8.188 0-10.916 10.613-10.916 10.613l-5.761 33.051s-2.123 12.432 8.49 12.432h23.045l2.426-16.373H75.001s-5.458 1.213-4.548-4.852c.303-.91 2.426-13.039 2.426-13.039s.606-4.245 3.335-4.245h15.464l3.032-17.587zM101.988 68.482l-11.523 55.791h15.162l5.154-23.65 1.213 23.65h8.188l9.095-23.65-4.548 23.65h13.644l11.221-56.095h-19.406l-9.401 23.348V68.482h-18.799zM145.955 124.273l10.611-56.095h31.233l-2.426 16.072H169l-.91 5.457h15.767l-2.425 12.129-16.071-.303-.91 5.457h16.07l-3.335 17.283h-31.231zM185.07 123.365c-2.123 0-3.336-1.518-3.336-3.639 0-2.123 1.213-3.639 3.336-3.639s3.639 1.516 3.639 3.639c0 2.122-1.516 3.639-3.639 3.639zm0 1.213c2.729 0 4.852-2.426 4.852-4.852 0-2.729-2.123-4.852-4.852-4.852s-4.852 2.123-4.852 4.852c.001 2.426 2.124 4.852 4.852 4.852zm1.213-4.549c.91 0 1.516-.303 1.516-1.516s-.91-1.516-2.123-1.516h-2.426v5.154h.91v-2.123h.91l1.213 2.123h1.213l-1.213-2.122zm-2.123-.607v-1.516h1.213c.607 0 1.213 0 1.213.607 0 .605-.303.908-.91.908h-1.516v.001z"
								/>
							</svg>
						</Logo>
					</Example>
					<p class="tab-note">
						With neither <code>svg</code> nor children, Logo renders <code>name</code> as plain text
						instead: selectable, searchable, and never a degraded image of text. Treat it as a
						placeholder until the real brand asset is in place; style the interim text through the
						<code>class</code> prop or your own <code>.hz-logo-text</code> rule.
					</p>
					<Example code={fallbackCode}>
						<Logo name="Soylent" />
					</Example>
				{:else}
					<p class="tab-note">
						Logo takes a raw SVG string because the library cannot see your asset directory. It
						renders that string verbatim, with no sanitizing, so pass only static assets you
						control, never user input. Import the file with <code>?raw</code> and pass it straight through:
					</p>
					<CodeBlock code={directImportCode} language="ts" />
					<p class="tab-note">
						Forgetting <code>?raw</code> is an easy mistake. The import then resolves to a URL string
						rather than markup, and Logo warns in development that the value does not look like SVG:
					</p>
					<CodeBlock code={missingRawCode} language="ts" />
					<p class="tab-note">With more than a couple of logos, resolve them all at once:</p>
					<CodeBlock code={globCode} language="ts" />
					<Alert intent="info" title="Optimize before you ship" headingLevel={4}>
						{#snippet icon()}<IconInfo />{/snippet}
						An SVG exported straight from a design tool often carries editor metadata, hidden layers,
						and far more path precision than the mark needs. Logo renders the string verbatim, so all
						of that ships in your JS bundle. Run exports through
						<a href="https://github.com/svg/svgo" target="_blank" rel="noreferrer">SVGO</a>
						(or a build-time wrapper around it, such as a Vite SVGO plugin) before committing them as
						<code>?raw</code> imports.
					</Alert>
				{/if}
			</Stack>
		{/snippet}
	</Tabs>
</DocPage>

<style>
	/* .tab-content and .tab-note are shared docs conventions from docs.css —
	 * only page-specific pieces are styled here. */

	.scale-label {
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
	}

	.naive-row {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	/* :global — the svg comes from {@html}, so Svelte can't see it statically. */
	.naive-logo :global(svg) {
		display: block;
		height: 4rem;
		width: auto;
	}

	/* A wall reads as balanced only when every mark sits mid-track — Grid's
	   items default to justify-items: start, which left-hugs each column and
	   defeats the point of normalizing every mark to the same optical size. */
	:global(.wall-logo) {
		justify-self: center;
	}
</style>
