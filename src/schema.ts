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
});
