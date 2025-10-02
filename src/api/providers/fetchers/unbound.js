"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.getUnboundModels = getUnboundModels
const axios_1 = __importDefault(require("axios"))
async function getUnboundModels(apiKey) {
	const models = {}
	try {
		const headers = {}
		if (apiKey) {
			headers["Authorization"] = `Bearer ${apiKey}`
		}
		const response = await axios_1.default.get("https://api.getunbound.ai/models", { headers })
		if (response.data) {
			const rawModels = response.data
			for (const [modelId, model] of Object.entries(rawModels)) {
				const modelInfo = {
					maxTokens: model?.maxTokens ? parseInt(model.maxTokens) : undefined,
					contextWindow: model?.contextWindow ? parseInt(model.contextWindow) : 0,
					supportsImages: model?.supportsImages ?? false,
					supportsPromptCache: model?.supportsPromptCaching ?? false,
					supportsComputerUse: model?.supportsComputerUse ?? false,
					inputPrice: model?.inputTokenPrice ? parseFloat(model.inputTokenPrice) : undefined,
					outputPrice: model?.outputTokenPrice ? parseFloat(model.outputTokenPrice) : undefined,
					cacheWritesPrice: model?.cacheWritePrice ? parseFloat(model.cacheWritePrice) : undefined,
					cacheReadsPrice: model?.cacheReadPrice ? parseFloat(model.cacheReadPrice) : undefined,
				}
				switch (true) {
					case modelId.startsWith("anthropic/"):
						// Set max tokens to 8192 for supported Anthropic models
						if (modelInfo.maxTokens !== 4096) {
							modelInfo.maxTokens = 8192
						}
						break
					default:
						break
				}
				models[modelId] = modelInfo
			}
		}
	} catch (error) {
		console.error(`Error fetching Unbound models: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
		throw new Error(`Failed to fetch Unbound models: ${error instanceof Error ? error.message : "Unknown error"}`)
	}
	return models
}
//# sourceMappingURL=unbound.js.map
