"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.DeepInfraHandler = void 0
const types_1 = require("@roo-code/types")
const cost_1 = require("../../shared/cost")
const openai_format_1 = require("../transform/openai-format")
const router_provider_1 = require("./router-provider")
const model_params_1 = require("../transform/model-params")
const modelCache_1 = require("./fetchers/modelCache")
class DeepInfraHandler extends router_provider_1.RouterProvider {
	constructor(options) {
		super({
			options: {
				...options,
				openAiHeaders: {
					"X-Deepinfra-Source": "kilocode",
					"X-Deepinfra-Version": `2025-08-25`,
				},
			},
			name: "deepinfra",
			baseURL: `${options.deepInfraBaseUrl || "https://api.deepinfra.com/v1/openai"}`,
			apiKey: options.deepInfraApiKey || "not-provided",
			modelId: options.deepInfraModelId,
			defaultModelId: types_1.deepInfraDefaultModelId,
			defaultModelInfo: types_1.deepInfraDefaultModelInfo,
		})
	}
	async fetchModel() {
		this.models = await (0, modelCache_1.getModels)({
			provider: this.name,
			apiKey: this.client.apiKey,
			baseUrl: this.client.baseURL,
		})
		return this.getModel()
	}
	getModel() {
		const id = this.options.deepInfraModelId ?? types_1.deepInfraDefaultModelId
		const info = this.models[id] ?? types_1.deepInfraDefaultModelInfo
		const params = (0, model_params_1.getModelParams)({
			format: "openai",
			modelId: id,
			model: info,
			settings: this.options,
		})
		return { id, info, ...params }
	}
	async *createMessage(systemPrompt, messages, _metadata) {
		// Ensure we have up-to-date model metadata
		await this.fetchModel()
		const { id: modelId, info, reasoningEffort: reasoning_effort } = await this.fetchModel()
		let prompt_cache_key = undefined
		if (info.supportsPromptCache && _metadata?.taskId) {
			prompt_cache_key = _metadata.taskId
		}
		const requestOptions = {
			model: modelId,
			messages: [
				{ role: "system", content: systemPrompt },
				...(0, openai_format_1.convertToOpenAiMessages)(messages),
			],
			stream: true,
			stream_options: { include_usage: true },
			reasoning_effort,
			prompt_cache_key,
		}
		if (this.supportsTemperature(modelId)) {
			requestOptions.temperature = this.options.modelTemperature ?? 0
		}
		if (this.options.includeMaxTokens === true && info.maxTokens) {
			requestOptions.max_completion_tokens = this.options.modelMaxTokens || info.maxTokens
		}
		const { data: stream } = await this.client.chat.completions.create(requestOptions).withResponse()
		let lastUsage
		for await (const chunk of stream) {
			const delta = chunk.choices[0]?.delta
			if (delta?.content) {
				yield { type: "text", text: delta.content }
			}
			if (delta && "reasoning_content" in delta && delta.reasoning_content) {
				yield { type: "reasoning", text: delta.reasoning_content || "" }
			}
			if (chunk.usage) {
				lastUsage = chunk.usage
			}
		}
		if (lastUsage) {
			yield this.processUsageMetrics(lastUsage, info)
		}
	}
	async completePrompt(prompt) {
		await this.fetchModel()
		const { id: modelId, info } = this.getModel()
		const requestOptions = {
			model: modelId,
			messages: [{ role: "user", content: prompt }],
		}
		if (this.supportsTemperature(modelId)) {
			requestOptions.temperature = this.options.modelTemperature ?? 0
		}
		if (this.options.includeMaxTokens === true && info.maxTokens) {
			requestOptions.max_completion_tokens = this.options.modelMaxTokens || info.maxTokens
		}
		const resp = await this.client.chat.completions.create(requestOptions)
		return resp.choices[0]?.message?.content || ""
	}
	processUsageMetrics(usage, modelInfo) {
		const inputTokens = usage?.prompt_tokens || 0
		const outputTokens = usage?.completion_tokens || 0
		const cacheWriteTokens = usage?.prompt_tokens_details?.cache_write_tokens || 0
		const cacheReadTokens = usage?.prompt_tokens_details?.cached_tokens || 0
		const totalCost = modelInfo
			? (0, cost_1.calculateApiCostOpenAI)(
					modelInfo,
					inputTokens,
					outputTokens,
					cacheWriteTokens,
					cacheReadTokens,
				)
			: 0
		return {
			type: "usage",
			inputTokens,
			outputTokens,
			cacheWriteTokens: cacheWriteTokens || undefined,
			cacheReadTokens: cacheReadTokens || undefined,
			totalCost,
		}
	}
}
exports.DeepInfraHandler = DeepInfraHandler
//# sourceMappingURL=deepinfra.js.map
