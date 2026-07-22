/**
 * kebab-case → PascalCase, used to derive `Icon<PascalName>` barrel export
 * names from Lucide's canonical kebab icon names (specs/36 R1/R2).
 *
 * Shared by the generator (`scripts/gen-icons.ts`) and the config engine's
 * trimmed-barrel emission (`src/lib/config/icons.ts`) — one pascalizer, one
 * source of truth for the naming contract, so a generated component's own
 * export name and a `hyzer generate` re-export's name can never drift apart.
 */
export function pascalize(kebab: string): string {
	return kebab
		.split('-')
		.filter(Boolean)
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join('');
}
