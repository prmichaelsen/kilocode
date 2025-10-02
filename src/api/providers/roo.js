"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.RooHandler = void 0
const openai_1 = __importDefault(require("openai"))
const types_1 = require("@roo-code/types")
const cloud_1 = require("@roo-code/cloud")
const constants_1 = require("./constants")
const base_openai_compatible_provider_1 = require("./base-openai-compatible-provider")
class RooHandler extends base_openai_compatible_provider_1.BaseOpenAiCompatibleProvider {
	constructor(options) {
		let sessionToken = undefined
		if (cloud_1.CloudService.hasInstance()) {
			sessionToken = cloud_1.CloudService.instance.authService?.getSessionToken()
		}
		// Always construct the handler, even without a valid token.
		// The provider-proxy server will return 401 if authentication fails.
		super({
			...options,
			providerName: "Roo Code Cloud",
			baseURL: process.env.ROO_CODE_PROVIDER_URL ?? "https://api.roocode.com/proxy/v1",
			apiKey: sessionToken || "unauthenticated", // Use a placeholder if no token.
			defaultProviderModelId: types_1.rooDefaultModelId,
			providerModels: types_1.rooModels,
			defaultTemperature: 0.7,
		})
		Object.defineProperty(this, "authStateListener", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		if (cloud_1.CloudService.hasInstance()) {
			const cloudService = cloud_1.CloudService.instance
			this.authStateListener = (state) => {
				if (state.state === "active-session") {
					this.client = new openai_1.default({
						baseURL: this.baseURL,
						apiKey: cloudService.authService?.getSessionToken() ?? "unauthenticated",
						defaultHeaders: constants_1.DEFAULT_HEADERS,
					})
				} else if (state.state === "logged-out") {
					this.client = new openai_1.default({
						baseURL: this.baseURL,
						apiKey: "unauthenticated",
						defaultHeaders: constants_1.DEFAULT_HEADERS,
					})
				}
			}
			cloudService.on("auth-state-changed", this.authStateListener)
		}
	}
	dispose() {
		if (this.authStateListener && cloud_1.CloudService.hasInstance()) {
			cloud_1.CloudService.instance.off("auth-state-changed", this.authStateListener)
		}
	}
	async *createMessage(systemPrompt, messages, metadata) {
		const stream = await this.createStream(
			systemPrompt,
			messages,
			metadata,
			metadata?.taskId ? { headers: { "X-Roo-Task-ID": metadata.taskId } } : undefined,
		)
		for await (const chunk of stream) {
			const delta = chunk.choices[0]?.delta
			if (delta) {
				if (delta.content) {
					yield {
						type: "text",
						text: delta.content,
					}
				}
				if ("reasoning_content" in delta && typeof delta.reasoning_content === "string") {
					yield {
						type: "reasoning",
						text: delta.reasoning_content,
					}
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
	getModel() {
		const modelId = this.options.apiModelId || types_1.rooDefaultModelId
		const modelInfo = this.providerModels[modelId] ?? this.providerModels[types_1.rooDefaultModelId]
		if (modelInfo) {
			return { id: modelId, info: modelInfo }
		}
		// Return the requested model ID even if not found, with fallback info.
		return {
			id: modelId,
			info: {
				maxTokens: 16384,
				contextWindow: 262144,
				supportsImages: false,
				supportsPromptCache: true,
				inputPrice: 0,
				outputPrice: 0,
			},
		}
	}
}
exports.RooHandler = RooHandler
//# sourceMappingURL=roo.js.map
