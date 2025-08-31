// Type augmentation for custom Workers AI model IDs
// Maps a new text generation model ID to the BaseAiTextGeneration task type

export {};

// see:
// - https://platform.openai.com/docs/guides/text
// - https://platform.openai.com/docs/api-reference/responses

interface GptOssTextGenerationInputObject {
	role: 'developer' | 'user';
	/** Only string content for simplicity */
	content: string;
}

interface GptOssTextGenerationInput {
	/** A system (or developer) message inserted into the model's context. */
	instructions?: string;
	/** Text, image, or file inputs to the model, used to generate a response. */
	input: string | GptOssTextGenerationInputObject[];
}

type GptOssTextGenerationMessageOutput = {
	type: 'message';
	content: [
		{
			type: 'output_text';
			text: string;
		}
	];
};

type GptOssTextGenerationOutputObject = GptOssTextGenerationMessageOutput;

interface GptOssTextGenerationOutput {
	output: GptOssTextGenerationOutputObject;
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
