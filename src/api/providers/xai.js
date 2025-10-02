"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.XAIHandler = void 0
const openai_1 = __importDefault(require("openai"))
const types_1 = require("@roo-code/types")
const openai_format_1 = require("../transform/openai-format")
const model_params_1 = require("../transform/model-params")
const constants_1 = require("./constants")
const base_provider_1 = require("./base-provider")
const verifyFinishReason_1 = require("./kilocode/verifyFinishReason") // kilocode_change
const openai_error_handler_1 = require("./utils/openai-error-handler")
const XAI_DEFAULT_TEMPERATURE = 0
class XAIHandler extends base_provider_1.BaseProvider {
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
		Object.defineProperty(this, "providerName", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "xAI",
		})
		this.options = options
		const apiKey = this.options.xaiApiKey ?? "not-provided"
		this.client = new openai_1.default({
			baseURL: "https://api.x.ai/v1",
			apiKey: apiKey,
			defaultHeaders: constants_1.DEFAULT_HEADERS,
		})
	}
	getModel() {
		const id =
			this.options.apiModelId && this.options.apiModelId in types_1.xaiModels
				? this.options.apiModelId
				: types_1.xaiDefaultModelId
		const info = types_1.xaiModels[id]
		const params = (0, model_params_1.getModelParams)({
			format: "openai",
			modelId: id,
			model: info,
			settings: this.options,
		})
		return { id, info, ...params }
	}
	async *createMessage(systemPrompt, messages, metadata) {
		const { id: modelId, info: modelInfo, reasoning } = this.getModel()
		// Use the OpenAI-compatible API.
		let stream
		try {
			stream = await this.client.chat.completions.create({
				model: modelId,
				max_tokens: modelInfo.maxTokens,
				temperature: this.options.modelTemperature ?? XAI_DEFAULT_TEMPERATURE,
				messages: [
					{ role: "system", content: systemPrompt },
					...(0, openai_format_1.convertToOpenAiMessages)(messages),
				],
				stream: true,
				stream_options: { include_usage: true },
				...(reasoning && reasoning),
			})
		} catch (error) {
			throw (0, openai_error_handler_1.handleOpenAIError)(error, this.providerName)
		}
		for await (const chunk of stream) {
			;(0, verifyFinishReason_1.verifyFinishReason)(chunk.choices[0]) // kilocode_change
			const delta = chunk.choices[0]?.delta
			if (delta?.content) {
				yield {
					type: "text",
					text: delta.content,
				}
			}
			if (delta && "reasoning_content" in delta && delta.reasoning_content) {
				yield {
					type: "reasoning",
					text: delta.reasoning_content,
				}
			}
			if (chunk.usage) {
				// Extract detailed token information if available
				// First check for prompt_tokens_details structure (real API response)
				const promptDetails = "prompt_tokens_details" in chunk.usage ? chunk.usage.prompt_tokens_details : null
				const cachedTokens = promptDetails && "cached_tokens" in promptDetails ? promptDetails.cached_tokens : 0
				// Fall back to direct fields in usage (used in test mocks)
				const readTokens =
					cachedTokens || ("cache_read_input_tokens" in chunk.usage ? chunk.usage.cache_read_input_tokens : 0)
				const writeTokens =
					"cache_creation_input_tokens" in chunk.usage ? chunk.usage.cache_creation_input_tokens : 0
				yield {
					type: "usage",
					inputTokens: chunk.usage.prompt_tokens || 0,
					outputTokens: chunk.usage.completion_tokens || 0,
					cacheReadTokens: readTokens,
					cacheWriteTokens: writeTokens,
				}
			}
		}
	}
	async completePrompt(prompt) {
		const { id: modelId, reasoning } = this.getModel()
		try {
			const response = await this.client.chat.completions.create({
				model: modelId,
				messages: [{ role: "user", content: prompt }],
				...(reasoning && reasoning),
			})
			return response.choices[0]?.message.content || ""
		} catch (error) {
			throw (0, openai_error_handler_1.handleOpenAIError)(error, this.providerName)
		}
	}
}
exports.XAIHandler = XAIHandler
//# sourceMappingURL=xai.js.map
