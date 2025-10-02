"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.DoubaoHandler = void 0
const openai_1 = require("./openai")
const types_1 = require("@roo-code/types")
const model_params_1 = require("../transform/model-params")
class DoubaoHandler extends openai_1.OpenAiHandler {
	constructor(options) {
		super({
			...options,
			openAiApiKey: options.doubaoApiKey ?? "not-provided",
			openAiModelId: options.apiModelId ?? types_1.doubaoDefaultModelId,
			openAiBaseUrl: options.doubaoBaseUrl ?? types_1.DOUBAO_API_BASE_URL,
			openAiStreamingEnabled: true,
			includeMaxTokens: true,
		})
	}
	getModel() {
		const id = this.options.apiModelId ?? types_1.doubaoDefaultModelId
		const info = types_1.doubaoModels[id] || types_1.doubaoModels[types_1.doubaoDefaultModelId]
		const params = (0, model_params_1.getModelParams)({
			format: "openai",
			modelId: id,
			model: info,
			settings: this.options,
		})
		return { id, info, ...params }
	}
	// Override to handle Doubao's usage metrics, including caching.
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
exports.DoubaoHandler = DoubaoHandler
//# sourceMappingURL=doubao.js.map
