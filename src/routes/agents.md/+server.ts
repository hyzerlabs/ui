import { renderAgentsMd } from '../../docs/agentRules';

export const prerender = true;

/**
 * AGENTS.md, served as a file a consumer can drop into their own repo. Same
 * source as the /docs/agents page, so the file and the page cannot disagree.
 */
export function GET(): Response {
	return new Response(renderAgentsMd(), {
		headers: { 'content-type': 'text/markdown; charset=utf-8' }
	});
}
