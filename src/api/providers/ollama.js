"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.OllamaHandler = void 0
const openai_1 = __importDefault(require("openai"))
const types_1 = require("@roo-code/types")
const xml_matcher_1 = require("../../utils/xml-matcher")
const openai_format_1 = require("../transform/openai-format")
const r1_format_1 = require("../transform/r1-format")
const base_provider_1 = require("./base-provider")
const timeout_config_1 = require("./utils/timeout-config")
const openai_error_handler_1 = require("./utils/openai-error-handler")
class OllamaHandler extends base_provider_1.BaseProvider {
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
			value: "Ollama",
		})
		this.options = options
		// Use the API key if provided (for Ollama cloud or authenticated instances)
		// Otherwise use "ollama" as a placeholder for local instances
		const apiKey = this.options.ollamaApiKey || "ollama"
		const headers = {}
		if (this.options.ollamaApiKey) {
			headers["Authorization"] = `Bearer ${this.options.ollamaApiKey}`
		}
		this.client = new openai_1.default({
			baseURL: (this.options.ollamaBaseUrl || "http://localhost:11434") + "/v1",
			apiKey: apiKey,
			timeout: (0, timeout_config_1.getApiRequestTimeout)(),
			defaultHeaders: headers,
		})
	}
	async *createMessage(systemPrompt, messages, metadata) {
		const modelId = this.getModel().id
		const useR1Format = modelId.toLowerCase().includes("deepseek-r1")
		const openAiMessages = [
			{ role: "system", content: systemPrompt },
			...(useR1Format
				? (0, r1_format_1.convertToR1Format)(messages)
				: (0, openai_format_1.convertToOpenAiMessages)(messages)),
		]
		let stream
		try {
			stream = await this.client.chat.completions.create({
				model: this.getModel().id,
				messages: openAiMessages,
				temperature: this.options.modelTemperature ?? 0,
				stream: true,
				stream_options: { include_usage: true },
			})
		} catch (error) {
			throw (0, openai_error_handler_1.handleOpenAIError)(error, this.providerName)
		}
		const matcher = new xml_matcher_1.XmlMatcher("think", (chunk) => ({
			type: chunk.matched ? "reasoning" : "text",
			text: chunk.data,
		}))
		let lastUsage
		for await (const chunk of stream) {
			const delta = chunk.choices[0]?.delta
			if (delta?.content) {
				for (const matcherChunk of matcher.update(delta.content)) {
					yield matcherChunk
				}
			}
			if (chunk.usage) {
				lastUsage = chunk.usage
			}
		}
		for (const chunk of matcher.final()) {
			yield chunk
		}
		if (lastUsage) {
			yield {
				type: "usage",
				inputTokens: lastUsage?.prompt_tokens || 0,
				outputTokens: lastUsage?.completion_tokens || 0,
			}
		}
	}
	getModel() {
		return {
			id: this.options.ollamaModelId || "",
			info: types_1.openAiModelInfoSaneDefaults,
		}
	}
	async completePrompt(prompt) {
		try {
			const modelId = this.getModel().id
			const useR1Format = modelId.toLowerCase().includes("deepseek-r1")
			let response
			try {
				response = await this.client.chat.completions.create({
					model: this.getModel().id,
					messages: useR1Format
						? (0, r1_format_1.convertToR1Format)([{ role: "user", content: prompt }])
						: [{ role: "user", content: prompt }],
					temperature:
						this.options.modelTemperature ?? (useR1Format ? types_1.DEEP_SEEK_DEFAULT_TEMPERATURE : 0),
					stream: false,
				})
			} catch (error) {
				throw (0, openai_error_handler_1.handleOpenAIError)(error, this.providerName)
			}
			return response.choices[0]?.message.content || ""
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Ollama completion error: ${error.message}`)
			}
			throw error
		}
	}
}
exports.OllamaHandler = OllamaHandler
//# sourceMappingURL=ollama.js.map
