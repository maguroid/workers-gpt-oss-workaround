import { z } from 'zod';

// Allow full passthrough of JSON Schema plus OpenAI-style extras
const JsonSchemaFormat = z.object({
	type: z.literal('json_schema'),
	name: z.string(),
	// Accept any valid JSON-object shape so keywords like
	// `required`, `additionalProperties`, `items`, etc. are retained
	schema: z.record(z.string(), z.any()),
	// Pass through commonly used fields for structured outputs
	strict: z.boolean().optional(),
});

const TextFormat = z.object({
	type: z.literal('text'),
});

export const GptOssTextGenerationInputSchema = z.object({
	instructions: z.string().optional(),
	input: z.string().or(
		z.array(
			z.object({
				role: z.enum(['developer', 'user']),
				content: z.string(),
			})
		)
	),
	reasoning: z
		.object({
			effort: z.enum(['high', 'medium', 'low']).optional(),
			summary: z.enum(['auto', 'concise', 'detailed']).optional(),
		})
		.optional(),
	text: z
		.object({
			format: z.union([JsonSchemaFormat, TextFormat]).optional(),
		})
		.optional(),
});
