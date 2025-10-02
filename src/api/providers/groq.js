"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.GroqHandler = void 0
const types_1 = require("@roo-code/types")
const cost_1 = require("../../shared/cost")
const base_openai_compatible_provider_1 = require("./base-openai-compatible-provider")
class GroqHandler extends base_openai_compatible_provider_1.BaseOpenAiCompatibleProvider {
	constructor(options) {
		super({
			...options,
			providerName: "Groq",
			baseURL: "https://api.groq.com/openai/v1",
			apiKey: options.groqApiKey,
			defaultProviderModelId: types_1.groqDefaultModelId,
			providerModels: types_1.groqModels,
			defaultTemperature: 0.5,
		})
	}
	async *createMessage(systemPrompt, messages, metadata) {
		const stream = await this.createStream(systemPrompt, messages, metadata)
		for await (const chunk of stream) {
			const delta = chunk.choices[0]?.delta
			if (delta?.content) {
				yield {
					type: "text",
					text: delta.content,
				}
			}
			if (chunk.usage) {
				yield* this.yieldUsage(chunk.usage)
			}
		}
	}
	async *yieldUsage(usage) {
		const { info } = this.getModel()
		const inputTokens = usage?.prompt_tokens || 0
		const outputTokens = usage?.completion_tokens || 0
		const cacheReadTokens = usage?.prompt_tokens_details?.cached_tokens || 0
		// Groq does not track cache writes
		const cacheWriteTokens = 0
		// Calculate cost using OpenAI-compatible cost calculation
		const totalCost = (0, cost_1.calculateApiCostOpenAI)(
			info,
			inputTokens,
			outputTokens,
			cacheWriteTokens,
			cacheReadTokens,
		)
		yield {
			type: "usage",
			inputTokens,
			outputTokens,
			cacheWriteTokens,
			cacheReadTokens,
			totalCost,
		}
	}
}
exports.GroqHandler = GroqHandler
//# sourceMappingURL=groq.js.map
