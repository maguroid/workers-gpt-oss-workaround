import { z } from 'zod';

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
			effort: z.enum(['high', 'medium', 'low', 'minimal']).optional(),
			summary: z.enum(['auto', 'concise', 'detailed']).optional(),
		})
		.optional(),
});
