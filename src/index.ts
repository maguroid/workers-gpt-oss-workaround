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
	const response = await env.AI.run(
		'@cf/openai/gpt-oss-120b',
		{
			input: prompt,
		},
		{
			gateway: {
				id: env.GATEWAY_ID,
			},
		}
	);
	if (!response) {
		return new Response('No response from model', { status: 500 });
	}
	return new Response(JSON.stringify(response.output));
};

const textInputObjectHandler: RouteHandler = async (request, env, ctx) => {
	const payload = await request.json();
	if (typeof payload !== 'object' || payload === null) {
		return new Response('Invalid payload', { status: 400 });
	}

	const parsedPrompt = GptOssTextGenerationInputSchema.safeParse(payload);
	if (!parsedPrompt.success) {
		return new Response(JSON.stringify({ error: 'Invalid prompt', details: z.treeifyError(parsedPrompt.error) }), { status: 400 });
	}
	const response = await env.AI.run('@cf/openai/gpt-oss-120b', parsedPrompt.data, {
		gateway: {
			id: env.GATEWAY_ID,
		},
	});
	if (!response) {
		return new Response('No response from model', { status: 500 });
	}
	return new Response(JSON.stringify(response.output));
};

const structuredOutputHandler: RouteHandler = async (request, env, ctx) => {
	const payload = await request.json();
	if (typeof payload !== 'object' || payload === null) {
		return new Response('Invalid payload', { status: 400 });
	}
	const parsedPrompt = GptOssTextGenerationInputSchema.safeParse(payload);
	if (!parsedPrompt.success) {
		return new Response(JSON.stringify({ error: 'Invalid prompt', details: z.treeifyError(parsedPrompt.error) }), { status: 400 });
	}
	// Payload already carries a JSON Schema via text.format when provided.
	// We forward it directly to the model to leverage structured outputs.

	const schema = z.object({
		user_request: z.string(),
		thought_process: z.array(z.string()),
		final_answer: z.string(),
	});

	const jsonSchema = z.toJSONSchema(schema);

	const response = await env.AI.run(
		'@cf/openai/gpt-oss-120b',
		{
			...parsedPrompt.data,
			text: {
				format: {
					name: 'thought_process',
					type: 'json_schema',
					schema: jsonSchema,
					strict: true,
				},
			},
		},
		{ gateway: { id: env.GATEWAY_ID } }
	);

	if (!response) {
		return new Response('No response from model', { status: 500 });
	}

	const message = response.output.find((item) => item.type === 'message');
	if (!message) {
		return new Response('No message in response', { status: 500 });
	}

	const output = message.content.find((content) => content.type === 'output_text');
	if (!output) {
		return new Response('No output text in response', { status: 500 });
	}

	const parsed = schema.parse(JSON.parse(output.text));

	return new Response(JSON.stringify(parsed));
};

const routes: Record<string, RouteHandler> = {
	'POST /text-input': textInputHandler,
	'POST /text-input-object': textInputObjectHandler,
	'POST /structured-output': structuredOutputHandler,
};

export default {
	async fetch(request, env, ctx): Promise<Response> {
		try {
			const { pathname } = new URL(request.url);
			const routeHandler = routes[`${request.method} ${pathname}`];
			if (!routeHandler) {
				return new Response('Method Not found', { status: 404 });
			}
			const response = await routeHandler(request, env, ctx);
			return response;
		} catch (error) {
			console.error('Error in fetch', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
