"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.MoonshotHandler = void 0
const types_1 = require("@roo-code/types")
const model_params_1 = require("../transform/model-params")
const openai_1 = require("./openai")
class MoonshotHandler extends openai_1.OpenAiHandler {
	constructor(options) {
		super({
			...options,
			openAiApiKey: options.moonshotApiKey ?? "not-provided",
			openAiModelId: options.apiModelId ?? types_1.moonshotDefaultModelId,
			openAiBaseUrl: options.moonshotBaseUrl ?? "https://api.moonshot.ai/v1",
			openAiStreamingEnabled: true,
			includeMaxTokens: true,
		})
	}
	getModel() {
		const id = this.options.apiModelId ?? types_1.moonshotDefaultModelId
		const info = types_1.moonshotModels[id] || types_1.moonshotModels[types_1.moonshotDefaultModelId]
		const params = (0, model_params_1.getModelParams)({
			format: "openai",
			modelId: id,
			model: info,
			settings: this.options,
		})
		return { id, info, ...params }
	}
	// Override to handle Moonshot's usage metrics, including caching.
	processUsageMetrics(usage) {
		return {
			type: "usage",
			inputTokens: usage?.prompt_tokens || 0,
			outputTokens: usage?.completion_tokens || 0,
			cacheWriteTokens: 0,
			cacheReadTokens: usage?.cached_tokens,
		}
	}
	// Override to always include max_tokens for Moonshot (not max_completion_tokens)
	addMaxTokensIfNeeded(requestOptions, modelInfo) {
		// Moonshot uses max_tokens instead of max_completion_tokens
		requestOptions.max_tokens = this.options.modelMaxTokens || modelInfo.maxTokens
	}
}
exports.MoonshotHandler = MoonshotHandler
//# sourceMappingURL=moonshot.js.map
