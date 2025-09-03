// Type augmentation for custom Workers AI model IDs
// Maps a new text generation model ID to the BaseAiTextGeneration task type

import { JSONSchema } from 'zod/v4/core';

// see:
// - https://platform.openai.com/docs/guides/text
// - https://platform.openai.com/docs/api-reference/responses

export interface GptOssTextGenerationInputObject {
	role: 'developer' | 'user';
	/** Only string content for simplicity */
	content: string;
}

export interface GptOssTextGenerationInput {
	/** A system (or developer) message inserted into the model's context. */
	instructions?: string;
	/** Text, image, or file inputs to the model, used to generate a response. */
	input: string | GptOssTextGenerationInputObject[];
	/** Configuration options for reasoning models. */
	reasoning?: {
		/** default to 'medium' */
		effort?: 'high' | 'medium' | 'low' | 'minimal';
		/** A summary of the reasoning performed by the model. This can be useful for debugging and understanding the model's reasoning process.  */
		summary?: 'auto' | 'concise' | 'detailed';
	};
	text?: {
		format?:
			| {
					type: 'text';
			  }
			| {
					type: 'json_schema';
					name: string;
					schema: JSONSchema;
					strict?: boolean;
			  };
	};
}

export type GptOssTextGenerationMessageOutput =
	| {
			type: 'message';
			content: [
				| {
						type: 'output_text';
						text: string;
				  }
				| {
						type: 'refusal';
						refusal: string;
				  }
			];
	  }
	| {
			type: 'reasoning';
			content: {
				type: 'reasoning_text';
				text: string;
			};
	  };

export type GptOssTextGenerationOutputObject = GptOssTextGenerationMessageOutput;

export interface GptOssTextGenerationOutput {
	output: GptOssTextGenerationOutputObject[];
}

interface GptOssTextGeneration {
	inputs: GptOssTextGenerationInput;
	postProcessedOutputs: GptOssTextGenerationOutput;
}

declare global {
	interface AiModels {
		/** Custom text generation model */
		'@cf/openai/gpt-oss-120b': GptOssTextGeneration;
	}
}
