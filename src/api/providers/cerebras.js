"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.CerebrasHandler = void 0
const types_1 = require("@roo-code/types")
const cost_1 = require("../../shared/cost")
const openai_format_1 = require("../transform/openai-format")
const xml_matcher_1 = require("../../utils/xml-matcher")
const base_provider_1 = require("./base-provider")
const constants_1 = require("./constants")
const i18n_1 = require("../../i18n")
const CEREBRAS_BASE_URL = "https://api.cerebras.ai/v1"
const CEREBRAS_DEFAULT_TEMPERATURE = 0
/**
 * Removes thinking tokens from text to prevent model confusion when processing conversation history.
 * This is crucial because models can get confused by their own thinking tokens in input.
 */
function stripThinkingTokens(text) {
	// Remove <think>...</think> blocks entirely, including nested ones
	return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim()
}
/**
 * Flattens OpenAI message content to simple strings that Cerebras can handle.
 * Cerebras doesn't support complex content arrays like OpenAI does.
 */
function flattenMessageContent(content) {
	if (typeof content === "string") {
		return content
	}
	if (Array.isArray(content)) {
		return content
			.map((part) => {
				if (typeof part === "string") {
					return part
				}
				if (part.type === "text") {
					return part.text || ""
				}
				if (part.type === "image_url") {
					return "[Image]" // Placeholder for images since Cerebras doesn't support images
				}
				return ""
			})
			.filter(Boolean)
			.join("\n")
	}
	// Fallback for any other content types
	return String(content || "")
}
/**
 * Converts OpenAI messages to Cerebras-compatible format with simple string content.
 * Also strips thinking tokens from assistant messages to prevent model confusion.
 */
function convertToCerebrasMessages(openaiMessages) {
	return openaiMessages
		.map((msg) => {
			let content = flattenMessageContent(msg.content)
			// Strip thinking tokens from assistant messages to prevent confusion
			if (msg.role === "assistant") {
				content = stripThinkingTokens(content)
			}
			return {
				role: msg.role,
				content,
			}
		})
		.filter((msg) => msg.content.trim() !== "") // Remove empty messages
}
class CerebrasHandler extends base_provider_1.BaseProvider {
	constructor(options) {
		super()
		Object.defineProperty(this, "apiKey", {
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
		Object.defineProperty(this, "defaultProviderModelId", {
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
		Object.defineProperty(this, "lastUsage", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: { inputTokens: 0, outputTokens: 0 },
		})
		this.options = options
		this.apiKey = options.cerebrasApiKey || ""
		this.providerModels = types_1.cerebrasModels
		this.defaultProviderModelId = types_1.cerebrasDefaultModelId
		if (!this.apiKey) {
			throw new Error("Cerebras API key is required")
		}
	}
	getModel() {
		const originalModelId = this.options.apiModelId || this.defaultProviderModelId
		// Route both qwen coder models to the same actual model ID for API calls
		// This allows them to have different rate limits/descriptions in the UI
		// while using the same underlying model
		let apiModelId = originalModelId
		if (originalModelId === "qwen-3-coder-480b-free") {
			apiModelId = "qwen-3-coder-480b"
		}
		return {
			id: apiModelId,
			info: this.providerModels[originalModelId], // Use original model info for rate limits/descriptions
		}
	}
	async *createMessage(systemPrompt, messages, metadata) {
		const {
			id: model,
			info: { maxTokens: max_tokens },
		} = this.getModel()
		const temperature = this.options.modelTemperature ?? CEREBRAS_DEFAULT_TEMPERATURE
		// Convert Anthropic messages to OpenAI format, then flatten for Cerebras
		// This will automatically strip thinking tokens from assistant messages
		const openaiMessages = (0, openai_format_1.convertToOpenAiMessages)(messages)
		const cerebrasMessages = convertToCerebrasMessages(openaiMessages)
		// Prepare request body following Cerebras API specification exactly
		const requestBody = {
			model,
			messages: [{ role: "system", content: systemPrompt }, ...cerebrasMessages],
			stream: true,
			// Use max_completion_tokens (Cerebras-specific parameter)
			...(max_tokens && max_tokens > 0 && max_tokens <= 32768 ? { max_completion_tokens: max_tokens } : {}),
			// Clamp temperature to Cerebras range (0 to 1.5)
			...(temperature !== undefined && temperature !== CEREBRAS_DEFAULT_TEMPERATURE
				? {
						temperature: Math.max(0, Math.min(1.5, temperature)),
					}
				: {}),
		}
		try {
			const response = await fetch(`${CEREBRAS_BASE_URL}/chat/completions`, {
				method: "POST",
				headers: {
					...constants_1.DEFAULT_HEADERS,
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify(requestBody),
			})
			if (!response.ok) {
				const errorText = await response.text()
				let errorMessage = "Unknown error"
				try {
					const errorJson = JSON.parse(errorText)
					errorMessage = errorJson.error?.message || errorJson.message || JSON.stringify(errorJson, null, 2)
				} catch {
					errorMessage = errorText || `HTTP ${response.status}`
				}
				// Provide more actionable error messages
				if (response.status === 401) {
					throw new Error((0, i18n_1.t)("common:errors.cerebras.authenticationFailed"))
				} else if (response.status === 403) {
					throw new Error((0, i18n_1.t)("common:errors.cerebras.accessForbidden"))
				} else if (response.status === 429) {
					throw new Error((0, i18n_1.t)("common:errors.cerebras.rateLimitExceeded"))
				} else if (response.status >= 500) {
					throw new Error((0, i18n_1.t)("common:errors.cerebras.serverError", { status: response.status }))
				} else {
					throw new Error(
						(0, i18n_1.t)("common:errors.cerebras.genericError", {
							status: response.status,
							message: errorMessage,
						}),
					)
				}
			}
			if (!response.body) {
				throw new Error((0, i18n_1.t)("common:errors.cerebras.noResponseBody"))
			}
			// Initialize XmlMatcher to parse <think>...</think> tags
			const matcher = new xml_matcher_1.XmlMatcher("think", (chunk) => ({
				type: chunk.matched ? "reasoning" : "text",
				text: chunk.data,
			}))
			const reader = response.body.getReader()
			const decoder = new TextDecoder()
			let buffer = ""
			let inputTokens = 0
			let outputTokens = 0
			try {
				while (true) {
					const { done, value } = await reader.read()
					if (done) break
					buffer += decoder.decode(value, { stream: true })
					const lines = buffer.split("\n")
					buffer = lines.pop() || "" // Keep the last incomplete line in the buffer
					for (const line of lines) {
						if (line.trim() === "") continue
						try {
							if (line.startsWith("data: ")) {
								const jsonStr = line.slice(6).trim()
								if (jsonStr === "[DONE]") {
									continue
								}
								const parsed = JSON.parse(jsonStr)
								// Handle text content - parse for thinking tokens
								if (parsed.choices?.[0]?.delta?.content) {
									const content = parsed.choices[0].delta.content
									// Use XmlMatcher to parse <think>...</think> tags
									for (const chunk of matcher.update(content)) {
										yield chunk
									}
								}
								// Handle usage information if available
								if (parsed.usage) {
									inputTokens = parsed.usage.prompt_tokens || 0
									outputTokens = parsed.usage.completion_tokens || 0
								}
							}
						} catch (error) {
							// Silently ignore malformed streaming data lines
						}
					}
				}
			} finally {
				reader.releaseLock()
			}
			// Process any remaining content in the matcher
			for (const chunk of matcher.final()) {
				yield chunk
			}
			// Provide token usage estimate if not available from API
			if (inputTokens === 0 || outputTokens === 0) {
				const inputText = systemPrompt + cerebrasMessages.map((m) => m.content).join("")
				inputTokens = inputTokens || Math.ceil(inputText.length / 4) // Rough estimate: 4 chars per token
				outputTokens = outputTokens || Math.ceil((max_tokens || 1000) / 10) // Rough estimate
			}
			// Store usage for cost calculation
			this.lastUsage = { inputTokens, outputTokens }
			yield {
				type: "usage",
				inputTokens,
				outputTokens,
			}
		} catch (error) {
			if (error instanceof Error) {
				throw new Error((0, i18n_1.t)("common:errors.cerebras.completionError", { error: error.message }))
			}
			throw error
		}
	}
	async completePrompt(prompt) {
		const { id: model } = this.getModel()
		// Prepare request body for non-streaming completion
		const requestBody = {
			model,
			messages: [{ role: "user", content: prompt }],
			stream: false,
		}
		try {
			const response = await fetch(`${CEREBRAS_BASE_URL}/chat/completions`, {
				method: "POST",
				headers: {
					...constants_1.DEFAULT_HEADERS,
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify(requestBody),
			})
			if (!response.ok) {
				const errorText = await response.text()
				// Provide consistent error handling with createMessage
				if (response.status === 401) {
					throw new Error((0, i18n_1.t)("common:errors.cerebras.authenticationFailed"))
				} else if (response.status === 403) {
					throw new Error((0, i18n_1.t)("common:errors.cerebras.accessForbidden"))
				} else if (response.status === 429) {
					throw new Error((0, i18n_1.t)("common:errors.cerebras.rateLimitExceeded"))
				} else if (response.status >= 500) {
					throw new Error((0, i18n_1.t)("common:errors.cerebras.serverError", { status: response.status }))
				} else {
					throw new Error(
						(0, i18n_1.t)("common:errors.cerebras.genericError", {
							status: response.status,
							message: errorText,
						}),
					)
				}
			}
			const result = await response.json()
			return result.choices?.[0]?.message?.content || ""
		} catch (error) {
			if (error instanceof Error) {
				throw new Error((0, i18n_1.t)("common:errors.cerebras.completionError", { error: error.message }))
			}
			throw error
		}
	}
	getApiCost(metadata) {
		const { info } = this.getModel()
		// Use actual token usage from the last request
		const { inputTokens, outputTokens } = this.lastUsage
		return (0, cost_1.calculateApiCostOpenAI)(info, inputTokens, outputTokens)
	}
}
exports.CerebrasHandler = CerebrasHandler
//# sourceMappingURL=cerebras.js.map
