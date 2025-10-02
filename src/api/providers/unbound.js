"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.UnboundHandler = void 0
const types_1 = require("@roo-code/types")
const openai_format_1 = require("../transform/openai-format")
const anthropic_1 = require("../transform/caching/anthropic")
const gemini_1 = require("../transform/caching/gemini")
const vertex_1 = require("../transform/caching/vertex")
const router_provider_1 = require("./router-provider")
const ORIGIN_APP = "roo-code"
const DEFAULT_HEADERS = {
	"X-Unbound-Metadata": JSON.stringify({ labels: [{ key: "app", value: "kilo-code" }] }),
}
class UnboundHandler extends router_provider_1.RouterProvider {
	constructor(options) {
		super({
			options,
			name: "unbound",
			baseURL: "https://api.getunbound.ai/v1",
			apiKey: options.unboundApiKey,
			modelId: options.unboundModelId,
			defaultModelId: types_1.unboundDefaultModelId,
			defaultModelInfo: types_1.unboundDefaultModelInfo,
		})
	}
	async *createMessage(systemPrompt, messages, metadata) {
		const { id: modelId, info } = await this.fetchModel()
		const openAiMessages = [
			{ role: "system", content: systemPrompt },
			...(0, openai_format_1.convertToOpenAiMessages)(messages),
		]
		if (info.supportsPromptCache) {
			if (modelId.startsWith("google/")) {
				;(0, gemini_1.addCacheBreakpoints)(systemPrompt, openAiMessages)
			} else if (modelId.startsWith("anthropic/")) {
				;(0, anthropic_1.addCacheBreakpoints)(systemPrompt, openAiMessages)
			}
		}
		// Custom models from Vertex AI (no configuration) need to be handled differently.
		if (modelId.startsWith("vertex-ai/google.") || modelId.startsWith("vertex-ai/anthropic.")) {
			;(0, vertex_1.addCacheBreakpoints)(messages)
		}
		// Required by Anthropic; other providers default to max tokens allowed.
		let maxTokens
		if (modelId.startsWith("anthropic/")) {
			maxTokens = info.maxTokens ?? undefined
		}
		const requestOptions = {
			model: modelId.split("/")[1],
			max_tokens: maxTokens,
			messages: openAiMessages,
			stream: true,
			unbound_metadata: {
				originApp: ORIGIN_APP,
				taskId: metadata?.taskId,
				mode: metadata?.mode,
			},
		}
		if (this.supportsTemperature(modelId)) {
			requestOptions.temperature = this.options.modelTemperature ?? 0
		}
		const { data: completion } = await this.client.chat.completions
			.create(requestOptions, { headers: DEFAULT_HEADERS })
			.withResponse()
		for await (const chunk of completion) {
			const delta = chunk.choices[0]?.delta
			const usage = chunk.usage
			if (delta?.content) {
				yield { type: "text", text: delta.content }
			}
			if (usage) {
				const usageData = {
					type: "usage",
					inputTokens: usage.prompt_tokens || 0,
					outputTokens: usage.completion_tokens || 0,
				}
				// Only add cache tokens if they exist.
				if (usage.cache_creation_input_tokens) {
					usageData.cacheWriteTokens = usage.cache_creation_input_tokens
				}
				if (usage.cache_read_input_tokens) {
					usageData.cacheReadTokens = usage.cache_read_input_tokens
				}
				yield usageData
			}
		}
	}
	async completePrompt(prompt) {
		const { id: modelId, info } = await this.fetchModel()
		try {
			const requestOptions = {
				model: modelId.split("/")[1],
				messages: [{ role: "user", content: prompt }],
				unbound_metadata: {
					originApp: ORIGIN_APP,
				},
			}
			if (this.supportsTemperature(modelId)) {
				requestOptions.temperature = this.options.modelTemperature ?? 0
			}
			if (modelId.startsWith("anthropic/")) {
				requestOptions.max_tokens = info.maxTokens
			}
			const response = await this.client.chat.completions.create(requestOptions, { headers: DEFAULT_HEADERS })
			return response.choices[0]?.message.content || ""
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Unbound completion error: ${error.message}`)
			}
			throw error
		}
	}
}
exports.UnboundHandler = UnboundHandler
//# sourceMappingURL=unbound.js.map
