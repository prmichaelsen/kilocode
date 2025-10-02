"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.DeepSeekHandler = void 0
const types_1 = require("@roo-code/types")
const model_params_1 = require("../transform/model-params")
const openai_1 = require("./openai")
class DeepSeekHandler extends openai_1.OpenAiHandler {
	constructor(options) {
		super({
			...options,
			openAiApiKey: options.deepSeekApiKey ?? "not-provided",
			openAiModelId: options.apiModelId ?? types_1.deepSeekDefaultModelId,
			openAiBaseUrl: options.deepSeekBaseUrl ?? "https://api.deepseek.com",
			openAiStreamingEnabled: true,
			includeMaxTokens: true,
		})
	}
	getModel() {
		const id = this.options.apiModelId ?? types_1.deepSeekDefaultModelId
		const info = types_1.deepSeekModels[id] || types_1.deepSeekModels[types_1.deepSeekDefaultModelId]
		const params = (0, model_params_1.getModelParams)({
			format: "openai",
			modelId: id,
			model: info,
			settings: this.options,
		})
		return { id, info, ...params }
	}
	// Override to handle DeepSeek's usage metrics, including caching.
	processUsageMetrics(usage) {
		return {
			type: "usage",
			inputTokens: usage?.prompt_tokens || 0,
			outputTokens: usage?.completion_tokens || 0,
			cacheWriteTokens: usage?.prompt_tokens_details?.cache_miss_tokens,
			cacheReadTokens: usage?.prompt_tokens_details?.cached_tokens,
		}
	}
}
exports.DeepSeekHandler = DeepSeekHandler
//# sourceMappingURL=deepseek.js.map
