import z, { ZodType } from 'zod';
import { GptOssTextGenerationOutput } from '../ai-models-augment';

export async function parseGptOssResponse<T extends ZodType>(response: GptOssTextGenerationOutput, schema: T) {
	const output = response.output.map((item) => {
		if (item.type === 'message') {
			const content = item.content.map((content) => {
				if (content.type === 'output_text') {
					return { ...content, parsed: schema.parse(JSON.parse(content.text)) };
				}
				return content;
			});
			return { ...item, content };
		}
		return item;
	});

	const parsed = Object.assign({}, response, { output });

	Object.defineProperty(parsed, 'output_parsed', {
		enumerable: true,
		get() {
			for (const item of parsed.output) {
				if (item.type !== 'message') {
					continue;
				}
				for (const content of item.content) {
					if (content.type === 'output_text' && content.parsed) {
						return content.parsed;
					}
				}
			}
			return null;
		},
	});

	return parsed as typeof parsed & { output_parsed: z.output<T> };
}
