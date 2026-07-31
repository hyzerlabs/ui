import { renderLlmsFull } from '../../docs/llms';

export const prerender = true;

export function GET(): Response {
	return new Response(renderLlmsFull(), {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	});
}
