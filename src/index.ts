/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import z from 'zod';
import { GptOssTextGenerationInputSchema } from './schema';

type RouteHandler = (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>;

const textInputHandler: RouteHandler = async (request, env, ctx) => {
	const prompt = await request.text();
	if (!prompt) {
		return new Response('No prompt provided', { status: 400 });
	}
	const response = await env.AI.run('@cf/openai/gpt-oss-120b', {
		input: prompt,
	});
	if (!response) {
		return new Response('No response from model', { status: 500 });
	}
	return new Response(JSON.stringify(response.output));
};

const textInputObjectHandler: RouteHandler = async (request, env, ctx) => {
	const payload = await request.json();
	if (typeof payload !== 'object' || payload === null || !('prompt' in payload)) {
		return new Response('Invalid payload', { status: 400 });
	}

	const parsedPrompt = GptOssTextGenerationInputSchema.safeParse({ input: payload.prompt });
	if (!parsedPrompt.success) {
		return new Response(JSON.stringify({ error: 'Invalid prompt', details: z.treeifyError(parsedPrompt.error) }), { status: 400 });
	}
	const response = await env.AI.run('@cf/openai/gpt-oss-120b', {
		...parsedPrompt.data,
	});
	if (!response) {
		return new Response('No response from model', { status: 500 });
	}
	return new Response(JSON.stringify(response.output));
};

const routes: Record<string, RouteHandler> = {
	'POST /text-input': textInputHandler,
	'POST /text-input-object': textInputObjectHandler,
};

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const { pathname } = new URL(request.url);
		const routeHandler = routes[`${request.method} ${pathname}`];
		if (!routeHandler) {
			return new Response('Method Not found', { status: 404 });
		}
		return routeHandler(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
