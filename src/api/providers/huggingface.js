"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.HuggingFaceHandler = void 0
const openai_1 = __importDefault(require("openai"))
const openai_format_1 = require("../transform/openai-format")
const constants_1 = require("./constants")
const base_provider_1 = require("./base-provider")
const huggingface_1 = require("./fetchers/huggingface")
const openai_error_handler_1 = require("./utils/openai-error-handler")
class HuggingFaceHandler extends base_provider_1.BaseProvider {
	constructor(options) {
		super()
		Object.defineProperty(this, "client", {
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
		Object.defineProperty(this, "modelCache", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: null,
		})
		Object.defineProperty(this, "providerName", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "HuggingFace",
		})
		this.options = options
		if (!this.options.huggingFaceApiKey) {
			throw new Error("Hugging Face API key is required")
		}
		this.client = new openai_1.default({
			baseURL: "https://router.huggingface.co/v1",
			apiKey: this.options.huggingFaceApiKey,
			defaultHeaders: constants_1.DEFAULT_HEADERS,
		})
		// Try to get cached models first
		this.modelCache = (0, huggingface_1.getCachedHuggingFaceModels)()
		// Fetch models asynchronously
		this.fetchModels()
	}
	async fetchModels() {
		try {
			this.modelCache = await (0, huggingface_1.getHuggingFaceModels)()
		} catch (error) {
			console.error("Failed to fetch HuggingFace models:", error)
		}
	}
	async *createMessage(systemPrompt, messages, metadata) {
		const modelId = this.options.huggingFaceModelId || "meta-llama/Llama-3.3-70B-Instruct"
		const temperature = this.options.modelTemperature ?? 0.7
		const params = {
			model: modelId,
			temperature,
			messages: [
				{ role: "system", content: systemPrompt },
				...(0, openai_format_1.convertToOpenAiMessages)(messages),
			],
			stream: true,
			stream_options: { include_usage: true },
		}
		// Add max_tokens if specified
		if (this.options.includeMaxTokens && this.options.modelMaxTokens) {
			params.max_tokens = this.options.modelMaxTokens
		}
		let stream
		try {
			stream = await this.client.chat.completions.create(params)
		} catch (error) {
			throw (0, openai_error_handler_1.handleOpenAIError)(error, this.providerName)
		}
		for await (const chunk of stream) {
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
		const modelId = this.options.huggingFaceModelId || "meta-llama/Llama-3.3-70B-Instruct"
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
		const modelId = this.options.huggingFaceModelId || "meta-llama/Llama-3.3-70B-Instruct"
		// Try to get model info from cache
		const modelInfo = this.modelCache?.[modelId]
		if (modelInfo) {
			return {
				id: modelId,
				info: modelInfo,
			}
		}
		// Fallback to default values if model not found in cache
		return {
			id: modelId,
			info: {
				maxTokens: 8192,
				contextWindow: 131072,
				supportsImages: false,
				supportsPromptCache: false,
			},
		}
	}
}
exports.HuggingFaceHandler = HuggingFaceHandler
//# sourceMappingURL=huggingface.js.map
