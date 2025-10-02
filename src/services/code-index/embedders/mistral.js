"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.MistralEmbedder = void 0
const openai_compatible_1 = require("./openai-compatible")
const constants_1 = require("../constants")
const i18n_1 = require("../../../i18n")
const types_1 = require("@roo-code/types")
const telemetry_1 = require("@roo-code/telemetry")
/**
 * Mistral embedder implementation that wraps the OpenAI Compatible embedder
 * with configuration for Mistral's embedding API.
 *
 * Supported models:
 * - codestral-embed-2505 (dimension: 1536)
 */
class MistralEmbedder {
	/**
	 * Creates a new Mistral embedder
	 * @param apiKey The Mistral API key for authentication
	 * @param modelId The model ID to use (defaults to codestral-embed-2505)
	 */
	constructor(apiKey, modelId) {
		Object.defineProperty(this, "openAICompatibleEmbedder", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "modelId", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		if (!apiKey) {
			throw new Error((0, i18n_1.t)("embeddings:validation.apiKeyRequired"))
		}
		// Use provided model or default
		this.modelId = modelId || MistralEmbedder.DEFAULT_MODEL
		// Create an OpenAI Compatible embedder with Mistral's configuration
		this.openAICompatibleEmbedder = new openai_compatible_1.OpenAICompatibleEmbedder(
			MistralEmbedder.MISTRAL_BASE_URL,
			apiKey,
			this.modelId,
			constants_1.MAX_ITEM_TOKENS,
		)
	}
	/**
	 * Creates embeddings for the given texts using Mistral's embedding API
	 * @param texts Array of text strings to embed
	 * @param model Optional model identifier (uses constructor model if not provided)
	 * @returns Promise resolving to embedding response
	 */
	async createEmbeddings(texts, model) {
		try {
			// Use the provided model or fall back to the instance's model
			const modelToUse = model || this.modelId
			return await this.openAICompatibleEmbedder.createEmbeddings(texts, modelToUse)
		} catch (error) {
			telemetry_1.TelemetryService.instance.captureEvent(types_1.TelemetryEventName.CODE_INDEX_ERROR, {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				location: "MistralEmbedder:createEmbeddings",
			})
			console.error("Mistral embedder error in createEmbeddings:", error) // kilocode_change
			throw error
		}
	}
	/**
	 * Validates the Mistral embedder configuration by delegating to the underlying OpenAI-compatible embedder
	 * @returns Promise resolving to validation result with success status and optional error message
	 */
	async validateConfiguration() {
		try {
			// Delegate validation to the OpenAI-compatible embedder
			// The error messages will be specific to Mistral since we're using Mistral's base URL
			return await this.openAICompatibleEmbedder.validateConfiguration()
		} catch (error) {
			telemetry_1.TelemetryService.instance.captureEvent(types_1.TelemetryEventName.CODE_INDEX_ERROR, {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				location: "MistralEmbedder:validateConfiguration",
			})
			console.error("Mistral embedder error in validateConfiguration:", error) // kilocode_change
			throw error
		}
	}
	/**
	 * Returns information about this embedder
	 */
	get embedderInfo() {
		return {
			name: "mistral",
		}
	}
}
exports.MistralEmbedder = MistralEmbedder
Object.defineProperty(MistralEmbedder, "MISTRAL_BASE_URL", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: "https://api.mistral.ai/v1",
})
Object.defineProperty(MistralEmbedder, "DEFAULT_MODEL", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: "codestral-embed-2505",
})
//# sourceMappingURL=mistral.js.map
