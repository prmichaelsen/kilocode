"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.IOIntelligenceHandler = void 0
const types_1 = require("@roo-code/types")
const base_openai_compatible_provider_1 = require("./base-openai-compatible-provider")
class IOIntelligenceHandler extends base_openai_compatible_provider_1.BaseOpenAiCompatibleProvider {
	constructor(options) {
		if (!options.ioIntelligenceApiKey) {
			throw new Error("IO Intelligence API key is required")
		}
		super({
			...options,
			providerName: "IO Intelligence",
			baseURL: "https://api.intelligence.io.solutions/api/v1",
			defaultProviderModelId: types_1.ioIntelligenceDefaultModelId,
			providerModels: types_1.ioIntelligenceModels,
			defaultTemperature: 0.7,
			apiKey: options.ioIntelligenceApiKey,
		})
	}
	getModel() {
		const modelId = this.options.ioIntelligenceModelId || types_1.ioIntelligenceDefaultModelId
		const modelInfo = this.providerModels[modelId] ?? this.providerModels[types_1.ioIntelligenceDefaultModelId]
		if (modelInfo) {
			return { id: modelId, info: modelInfo }
		}
		// Return the requested model ID even if not found, with fallback info.
		return {
			id: modelId,
			info: {
				maxTokens: 8192,
				contextWindow: 128000,
				supportsImages: false,
				supportsPromptCache: false,
			},
		}
	}
}
exports.IOIntelligenceHandler = IOIntelligenceHandler
//# sourceMappingURL=io-intelligence.js.map
