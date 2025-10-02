"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.NativeOllamaHandler = void 0
const ollama_1 = require("ollama")
const types_1 = require("@roo-code/types")
const base_provider_1 = require("./base-provider")
const ollama_2 = require("./fetchers/ollama")
const xml_matcher_1 = require("../../utils/xml-matcher")
// kilocode_change start
const fetchWithTimeout_1 = require("./kilocode/fetchWithTimeout")
const OLLAMA_TIMEOUT_MS = 3600000
const TOKEN_ESTIMATION_FACTOR = 4 //Industry standard technique for estimating token counts without actually implementing a parser/tokenizer
function estimateOllamaTokenCount(messages) {
	const totalChars = messages.reduce((acc, msg) => acc + (msg.content?.length || 0), 0)
	return Math.ceil(totalChars / TOKEN_ESTIMATION_FACTOR)
}
function convertToOllamaMessages(anthropicMessages) {
	const ollamaMessages = []
	for (const anthropicMessage of anthropicMessages) {
		if (typeof anthropicMessage.content === "string") {
			ollamaMessages.push({
				role: anthropicMessage.role,
				content: anthropicMessage.content,
			})
		} else {
			if (anthropicMessage.role === "user") {
				const { nonToolMessages, toolMessages } = anthropicMessage.content.reduce(
					(acc, part) => {
						if (part.type === "tool_result") {
							acc.toolMessages.push(part)
						} else if (part.type === "text" || part.type === "image") {
							acc.nonToolMessages.push(part)
						}
						return acc
					},
					{ nonToolMessages: [], toolMessages: [] },
				)
				// Process tool result messages FIRST since they must follow the tool use messages
				const toolResultImages = []
				toolMessages.forEach((toolMessage) => {
					// The Anthropic SDK allows tool results to be a string or an array of text and image blocks, enabling rich and structured content. In contrast, the Ollama SDK only supports tool results as a single string, so we map the Anthropic tool result parts into one concatenated string to maintain compatibility.
					let content
					if (typeof toolMessage.content === "string") {
						content = toolMessage.content
					} else {
						content =
							toolMessage.content
								?.map((part) => {
									if (part.type === "image") {
										// Handle base64 images only (Anthropic SDK uses base64)
										// Ollama expects raw base64 strings, not data URLs
										if ("source" in part && part.source.type === "base64") {
											toolResultImages.push(part.source.data)
										}
										return "(see following user message for image)"
									}
									return part.text
								})
								.join("\n") ?? ""
					}
					ollamaMessages.push({
						role: "user",
						images: toolResultImages.length > 0 ? toolResultImages : undefined,
						content: content,
					})
				})
				// Process non-tool messages
				if (nonToolMessages.length > 0) {
					// Separate text and images for Ollama
					const textContent = nonToolMessages
						.filter((part) => part.type === "text")
						.map((part) => part.text)
						.join("\n")
					const imageData = []
					nonToolMessages.forEach((part) => {
						if (part.type === "image" && "source" in part && part.source.type === "base64") {
							// Ollama expects raw base64 strings, not data URLs
							imageData.push(part.source.data)
						}
					})
					ollamaMessages.push({
						role: "user",
						content: textContent,
						images: imageData.length > 0 ? imageData : undefined,
					})
				}
			} else if (anthropicMessage.role === "assistant") {
				const { nonToolMessages } = anthropicMessage.content.reduce(
					(acc, part) => {
						if (part.type === "tool_use") {
							acc.toolMessages.push(part)
						} else if (part.type === "text" || part.type === "image") {
							acc.nonToolMessages.push(part)
						} // assistant cannot send tool_result messages
						return acc
					},
					{ nonToolMessages: [], toolMessages: [] },
				)
				// Process non-tool messages
				let content = ""
				if (nonToolMessages.length > 0) {
					content = nonToolMessages
						.map((part) => {
							if (part.type === "image") {
								return "" // impossible as the assistant cannot send images
							}
							return part.text
						})
						.join("\n")
				}
				ollamaMessages.push({
					role: "assistant",
					content,
				})
			}
		}
	}
	return ollamaMessages
}
class NativeOllamaHandler extends base_provider_1.BaseProvider {
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
		Object.defineProperty(this, "models", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: {},
		})
		Object.defineProperty(this, "isInitialized", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: false,
		}) // kilocode_change
		this.options = options
		this.initialize() // kilocode_change
	}
	// kilocode_change start
	async initialize() {
		if (this.isInitialized) {
			return
		}
		await this.fetchModel()
		this.isInitialized = true
	}
	// kilocode_change end
	ensureClient() {
		if (!this.client) {
			try {
				// kilocode_change start
				const headers = this.options.ollamaApiKey
					? { Authorization: `Bearer ${this.options.ollamaApiKey}` }
					: undefined
				// kilocode_change end
				this.client = new ollama_1.Ollama({
					host: this.options.ollamaBaseUrl || "http://localhost:11434",
					// kilocode_change start
					fetch: (0, fetchWithTimeout_1.fetchWithTimeout)(OLLAMA_TIMEOUT_MS, headers),
					headers: headers,
					// kilocode_change end
				})
			} catch (error) {
				throw new Error(`Error creating Ollama client: ${error.message}`)
			}
		}
		return this.client
	}
	async *createMessage(systemPrompt, messages, metadata) {
		// kilocode_change start
		if (!this.isInitialized) {
			await this.initialize()
		}
		// kilocode_change end
		const client = this.ensureClient()
		const { id: modelId, info: modelInfo } = this.getModel() // kilocode_change: fetchModel => getModel
		const useR1Format = modelId.toLowerCase().includes("deepseek-r1")
		const ollamaMessages = [{ role: "system", content: systemPrompt }, ...convertToOllamaMessages(messages)]
		// kilocode_change start
		// it is tedious we have to check this, but Ollama's quiet prompt-truncating behavior is a support nightmare otherwise
		const estimatedTokenCount = estimateOllamaTokenCount(ollamaMessages)
		const maxTokens = this.options.ollamaNumCtx ?? modelInfo.contextWindow
		if (estimatedTokenCount > maxTokens) {
			throw new Error(
				`Prompt is too long (estimated tokens: ${estimatedTokenCount}, max tokens: ${maxTokens}). Increase the Context Window Size in Settings.`,
			)
		}
		// kilocode_change end
		const matcher = new xml_matcher_1.XmlMatcher("think", (chunk) => ({
			type: chunk.matched ? "reasoning" : "text",
			text: chunk.data,
		}))
		try {
			// Build options object conditionally
			const chatOptions = {
				temperature: this.options.modelTemperature ?? (useR1Format ? types_1.DEEP_SEEK_DEFAULT_TEMPERATURE : 0),
			}
			// Only include num_ctx if explicitly set via ollamaNumCtx
			if (this.options.ollamaNumCtx !== undefined) {
				chatOptions.num_ctx = this.options.ollamaNumCtx
			}
			// Create the actual API request promise
			const stream = await client.chat({
				model: modelId,
				messages: ollamaMessages,
				stream: true,
				options: chatOptions,
			})
			let totalInputTokens = 0
			let totalOutputTokens = 0
			try {
				for await (const chunk of stream) {
					if (typeof chunk.message.content === "string") {
						// Process content through matcher for reasoning detection
						for (const matcherChunk of matcher.update(chunk.message.content)) {
							yield matcherChunk
						}
					}
					// Handle token usage if available
					if (chunk.eval_count !== undefined || chunk.prompt_eval_count !== undefined) {
						if (chunk.prompt_eval_count) {
							totalInputTokens = chunk.prompt_eval_count
						}
						if (chunk.eval_count) {
							totalOutputTokens = chunk.eval_count
						}
					}
				}
				// Yield any remaining content from the matcher
				for (const chunk of matcher.final()) {
					yield chunk
				}
				// Yield usage information if available
				if (totalInputTokens > 0 || totalOutputTokens > 0) {
					yield {
						type: "usage",
						inputTokens: totalInputTokens,
						outputTokens: totalOutputTokens,
					}
				}
			} catch (streamError) {
				console.error("Error processing Ollama stream:", streamError)
				throw new Error(`Ollama stream processing error: ${streamError.message || "Unknown error"}`)
			}
		} catch (error) {
			// Enhance error reporting
			const statusCode = error.status || error.statusCode
			const errorMessage = error.message || "Unknown error"
			if (error.code === "ECONNREFUSED") {
				throw new Error(
					`Ollama service is not running at ${this.options.ollamaBaseUrl || "http://localhost:11434"}. Please start Ollama first.`,
				)
			} else if (statusCode === 404) {
				throw new Error(
					`Model ${this.getModel().id} not found in Ollama. Please pull the model first with: ollama pull ${this.getModel().id}`,
				)
			}
			console.error(`Ollama API error (${statusCode || "unknown"}): ${errorMessage}`)
			throw error
		}
	}
	async fetchModel() {
		// kilocode_change start
		this.models = await (0, ollama_2.getOllamaModels)(
			this.options.ollamaBaseUrl,
			this.options.ollamaApiKey,
			this.options.ollamaNumCtx,
		)
		return this.models
		// kilocode_change end
	}
	getModel() {
		const modelId = this.options.ollamaModelId || ""
		// kilocode_change start
		const modelInfo = this.models[modelId]
		if (!modelInfo) {
			const availableModels = Object.keys(this.models)
			const errorMessage =
				availableModels.length > 0
					? `Model ${modelId} not found. Available models: ${availableModels.join(", ")}`
					: `Model ${modelId} not found. No models available.`
			throw new Error(errorMessage)
		}
		// kilocode_change end
		return {
			id: modelId,
			info: modelInfo, // kilocode_change
		}
	}
	async completePrompt(prompt) {
		try {
			// kilocode_change start
			if (!this.isInitialized) {
				await this.initialize()
			}
			// kilocode_change end
			const client = this.ensureClient()
			const { id: modelId } = this.getModel() // kilocode_change: fetchModel => getModel
			const useR1Format = modelId.toLowerCase().includes("deepseek-r1")
			// Build options object conditionally
			const chatOptions = {
				temperature: this.options.modelTemperature ?? (useR1Format ? types_1.DEEP_SEEK_DEFAULT_TEMPERATURE : 0),
			}
			// Only include num_ctx if explicitly set via ollamaNumCtx
			if (this.options.ollamaNumCtx !== undefined) {
				chatOptions.num_ctx = this.options.ollamaNumCtx
			}
			const response = await client.chat({
				model: modelId,
				messages: [{ role: "user", content: prompt }],
				stream: false,
				options: chatOptions,
			})
			return response.message?.content || ""
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Ollama completion error: ${error.message}`)
			}
			throw error
		}
	}
}
exports.NativeOllamaHandler = NativeOllamaHandler
//# sourceMappingURL=native-ollama.js.map
