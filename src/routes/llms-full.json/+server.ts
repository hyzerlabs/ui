import { buildLlmsFullJson } from '../../docs/llms';

export const prerender = true;

export function GET(): Response {
	return new Response(JSON.stringify(buildLlmsFullJson()), {
		headers: { 'content-type': 'application/json' }
	});
}
