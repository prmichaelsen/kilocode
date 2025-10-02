"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.MistralHandler = void 0
const mistralai_1 = require("@mistralai/mistralai")
const types_1 = require("@roo-code/types")
const mistral_format_1 = require("../transform/mistral-format")
const base_provider_1 = require("./base-provider")
class MistralHandler extends base_provider_1.BaseProvider {
	constructor(options) {
		super()
		Object.defineProperty(this, "options", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "client", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		if (!options.mistralApiKey) {
			throw new Error("Mistral API key is required")
		}
		// Set default model ID if not provided.
		const apiModelId = options.apiModelId || types_1.mistralDefaultModelId
		this.options = { ...options, apiModelId }
		this.client = new mistralai_1.Mistral({
			serverURL: apiModelId.startsWith("codestral-")
				? this.options.mistralCodestralUrl || "https://codestral.mistral.ai"
				: "https://api.mistral.ai",
			apiKey: this.options.mistralApiKey,
		})
	}
	async *createMessage(systemPrompt, messages, metadata) {
		const { id: model, maxTokens, temperature } = this.getModel()
		const response = await this.client.chat.stream({
			model,
			messages: [
				{ role: "system", content: systemPrompt },
				...(0, mistral_format_1.convertToMistralMessages)(messages),
			],
			maxTokens,
			temperature,
		})
		for await (const event of response) {
			const delta = event.data.choices[0]?.delta
			if (delta?.content) {
				if (typeof delta.content === "string") {
					// Handle string content as text
					yield { type: "text", text: delta.content }
				} else if (Array.isArray(delta.content)) {
					// Handle array of content chunks
					// The SDK v1.9.18 supports ThinkChunk with type "thinking"
					for (const chunk of delta.content) {
						if (chunk.type === "thinking" && chunk.thinking) {
							// Handle thinking content as reasoning chunks
							// ThinkChunk has a 'thinking' property that contains an array of text/reference chunks
							for (const thinkingPart of chunk.thinking) {
								if (thinkingPart.type === "text" && thinkingPart.text) {
									yield { type: "reasoning", text: thinkingPart.text }
								}
							}
						} else if (chunk.type === "text" && chunk.text) {
							// Handle text content normally
							yield { type: "text", text: chunk.text }
						}
					}
				}
			}
			if (event.data.usage) {
				yield {
					type: "usage",
					inputTokens: event.data.usage.promptTokens || 0,
					outputTokens: event.data.usage.completionTokens || 0,
				}
			}
		}
	}
	getModel() {
		const id = this.options.apiModelId ?? types_1.mistralDefaultModelId
		const info = types_1.mistralModels[id] ?? types_1.mistralModels[types_1.mistralDefaultModelId]
		// @TODO: Move this to the `getModelParams` function.
		const maxTokens = this.options.includeMaxTokens ? info.maxTokens : undefined
		const temperature = this.options.modelTemperature ?? types_1.MISTRAL_DEFAULT_TEMPERATURE
		return { id, info, maxTokens, temperature }
	}
	async completePrompt(prompt) {
		try {
			const { id: model, temperature } = this.getModel()
			const response = await this.client.chat.complete({
				model,
				messages: [{ role: "user", content: prompt }],
				temperature,
			})
			const content = response.choices?.[0]?.message.content
			if (Array.isArray(content)) {
				// Only return text content, filter out thinking content for non-streaming
				return content
					.filter((c) => c.type === "text" && c.text)
					.map((c) => c.text || "")
					.join("")
			}
			return content || ""
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Mistral completion error: ${error.message}`)
			}
			throw error
		}
	}
}
exports.MistralHandler = MistralHandler
//# sourceMappingURL=mistral.js.map
