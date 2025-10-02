"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.GlamaHandler = void 0
const axios_1 = __importDefault(require("axios"))
const types_1 = require("@roo-code/types")
const package_1 = require("../../shared/package")
const openai_format_1 = require("../transform/openai-format")
const anthropic_1 = require("../transform/caching/anthropic")
const router_provider_1 = require("./router-provider")
const DEFAULT_HEADERS = {
	"X-Glama-Metadata": JSON.stringify({
		labels: [{ key: "app", value: `vscode.${package_1.Package.publisher}.${package_1.Package.name}` }],
	}),
}
class GlamaHandler extends router_provider_1.RouterProvider {
	constructor(options) {
		super({
			options,
			name: "glama",
			baseURL: "https://glama.ai/api/gateway/openai/v1",
			apiKey: options.glamaApiKey,
			modelId: options.glamaModelId,
			defaultModelId: types_1.glamaDefaultModelId,
			defaultModelInfo: types_1.glamaDefaultModelInfo,
		})
	}
	async *createMessage(systemPrompt, messages, metadata) {
		const { id: modelId, info } = await this.fetchModel()
		const openAiMessages = [
			{ role: "system", content: systemPrompt },
			...(0, openai_format_1.convertToOpenAiMessages)(messages),
		]
		if (modelId.startsWith("anthropic/claude-3")) {
			;(0, anthropic_1.addCacheBreakpoints)(systemPrompt, openAiMessages)
		}
		// Required by Anthropic; other providers default to max tokens allowed.
		let maxTokens
		if (modelId.startsWith("anthropic/")) {
			maxTokens = info.maxTokens ?? undefined
		}
		const requestOptions = {
			model: modelId,
			max_tokens: maxTokens,
			messages: openAiMessages,
			stream: true,
		}
		if (this.supportsTemperature(modelId)) {
			requestOptions.temperature = this.options.modelTemperature ?? types_1.GLAMA_DEFAULT_TEMPERATURE
		}
		const { data: completion, response } = await this.client.chat.completions
			.create(requestOptions, { headers: DEFAULT_HEADERS })
			.withResponse()
		const completionRequestId = response.headers.get("x-completion-request-id")
		for await (const chunk of completion) {
			const delta = chunk.choices[0]?.delta
			if (delta?.content) {
				yield { type: "text", text: delta.content }
			}
		}
		try {
			let attempt = 0
			const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
			while (attempt++ < 10) {
				// In case of an interrupted request, we need to wait for the upstream API to finish processing the request
				// before we can fetch information about the token usage and cost.
				const response = await axios_1.default.get(
					`https://glama.ai/api/gateway/v1/completion-requests/${completionRequestId}`,
					{ headers: { Authorization: `Bearer ${this.options.glamaApiKey}` } },
				)
				const completionRequest = response.data
				if (completionRequest.tokenUsage && completionRequest.totalCostUsd) {
					yield {
						type: "usage",
						cacheWriteTokens: completionRequest.tokenUsage.cacheCreationInputTokens,
						cacheReadTokens: completionRequest.tokenUsage.cacheReadInputTokens,
						inputTokens: completionRequest.tokenUsage.promptTokens,
						outputTokens: completionRequest.tokenUsage.completionTokens,
						totalCost: parseFloat(completionRequest.totalCostUsd),
					}
					break
				}
				await delay(200)
			}
		} catch (error) {
			console.error("Error fetching Glama completion details", error)
		}
	}
	async completePrompt(prompt) {
		const { id: modelId, info } = await this.fetchModel()
		try {
			const requestOptions = {
				model: modelId,
				messages: [{ role: "user", content: prompt }],
			}
			if (this.supportsTemperature(modelId)) {
				requestOptions.temperature = this.options.modelTemperature ?? types_1.GLAMA_DEFAULT_TEMPERATURE
			}
			if (modelId.startsWith("anthropic/")) {
				requestOptions.max_tokens = info.maxTokens
			}
			const response = await this.client.chat.completions.create(requestOptions)
			return response.choices[0]?.message.content || ""
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Glama completion error: ${error.message}`)
			}
			throw error
		}
	}
}
exports.GlamaHandler = GlamaHandler
//# sourceMappingURL=glama.js.map
