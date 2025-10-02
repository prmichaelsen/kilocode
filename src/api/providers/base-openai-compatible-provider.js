"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.BaseOpenAiCompatibleProvider = void 0
const openai_1 = __importDefault(require("openai"))
const openai_format_1 = require("../transform/openai-format")
const constants_1 = require("./constants")
const base_provider_1 = require("./base-provider")
const verifyFinishReason_1 = require("./kilocode/verifyFinishReason")
const openai_error_handler_1 = require("./utils/openai-error-handler")
const fetchWithTimeout_1 = require("./kilocode/fetchWithTimeout")
const OPENAI_COMPATIBLE_TIMEOUT_MS = 3600000
class BaseOpenAiCompatibleProvider extends base_provider_1.BaseProvider {
	constructor({ providerName, baseURL, defaultProviderModelId, providerModels, defaultTemperature, ...options }) {
		super()
		Object.defineProperty(this, "providerName", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "baseURL", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "defaultTemperature", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "defaultProviderModelId", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "providerModels", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
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
		this.providerName = providerName
		this.baseURL = baseURL
		this.defaultProviderModelId = defaultProviderModelId
		this.providerModels = providerModels
		this.defaultTemperature = defaultTemperature ?? 0
		this.options = options
		if (!this.options.apiKey) {
			throw new Error("API key is required")
		}
		this.client = new openai_1.default({
			baseURL,
			apiKey: this.options.apiKey,
			defaultHeaders: constants_1.DEFAULT_HEADERS,
			// kilocode_change start
			timeout: OPENAI_COMPATIBLE_TIMEOUT_MS,
			fetch: (0, fetchWithTimeout_1.fetchWithTimeout)(OPENAI_COMPATIBLE_TIMEOUT_MS),
			// kilocode_change end
		})
	}
	createStream(systemPrompt, messages, metadata, requestOptions) {
		const {
			id: model,
			info: { maxTokens: max_tokens },
		} = this.getModel()
		const temperature = this.options.modelTemperature ?? this.defaultTemperature
		const params = {
			model,
			max_tokens,
			temperature,
			messages: [
				{ role: "system", content: systemPrompt },
				...(0, openai_format_1.convertToOpenAiMessages)(messages),
			],
			stream: true,
			stream_options: { include_usage: true },
		}
		try {
			return this.client.chat.completions.create(params, requestOptions)
		} catch (error) {
			throw (0, openai_error_handler_1.handleOpenAIError)(error, this.providerName)
		}
	}
	async *createMessage(systemPrompt, messages, metadata) {
		const stream = await this.createStream(systemPrompt, messages, metadata)
		for await (const chunk of stream) {
			;(0, verifyFinishReason_1.verifyFinishReason)(chunk.choices[0]) // kilocode_change
			const delta = chunk.choices[0]?.delta
			if (delta?.content) {
				yield {
					type: "text",
					text: delta.content,
				}
			}
			if (chunk.usage) {
				yield {
					type: "usage",
					inputTokens: chunk.usage.prompt_tokens || 0,
					outputTokens: chunk.usage.completion_tokens || 0,
				}
			}
		}
	}
	async completePrompt(prompt) {
		const { id: modelId } = this.getModel()
		try {
			const response = await this.client.chat.completions.create({
				model: modelId,
				messages: [{ role: "user", content: prompt }],
			})
			return response.choices[0]?.message.content || ""
		} catch (error) {
			throw (0, openai_error_handler_1.handleOpenAIError)(error, this.providerName)
		}
	}
	getModel() {
		const id =
			this.options.apiModelId && this.options.apiModelId in this.providerModels
				? this.options.apiModelId
				: this.defaultProviderModelId
		return { id, info: this.providerModels[id] }
	}
}
exports.BaseOpenAiCompatibleProvider = BaseOpenAiCompatibleProvider
//# sourceMappingURL=base-openai-compatible-provider.js.map
