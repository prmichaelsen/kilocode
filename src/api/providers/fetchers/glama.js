"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.getGlamaModels = getGlamaModels
const axios_1 = __importDefault(require("axios"))
const cost_1 = require("../../../shared/cost")
async function getGlamaModels() {
	const models = {}
	try {
		const response = await axios_1.default.get("https://glama.ai/api/gateway/v1/models")
		const rawModels = response.data
		for (const rawModel of rawModels) {
			const modelInfo = {
				maxTokens: rawModel.maxTokensOutput,
				contextWindow: rawModel.maxTokensInput,
				supportsImages: rawModel.capabilities?.includes("input:image"),
				supportsComputerUse: rawModel.capabilities?.includes("computer_use"),
				supportsPromptCache: rawModel.capabilities?.includes("caching"),
				inputPrice: (0, cost_1.parseApiPrice)(rawModel.pricePerToken?.input),
				outputPrice: (0, cost_1.parseApiPrice)(rawModel.pricePerToken?.output),
				description: undefined,
				cacheWritesPrice: (0, cost_1.parseApiPrice)(rawModel.pricePerToken?.cacheWrite),
				cacheReadsPrice: (0, cost_1.parseApiPrice)(rawModel.pricePerToken?.cacheRead),
			}
			switch (rawModel.id) {
				case rawModel.id.startsWith("anthropic/"):
					modelInfo.maxTokens = 8192
					break
				default:
					break
			}
			models[rawModel.id] = modelInfo
		}
	} catch (error) {
		console.error(`Error fetching Glama models: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
	}
	return models
}
//# sourceMappingURL=glama.js.map
