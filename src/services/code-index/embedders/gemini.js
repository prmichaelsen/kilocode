"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.GeminiEmbedder = void 0
const openai_compatible_1 = require("./openai-compatible")
const constants_1 = require("../constants")
const i18n_1 = require("../../../i18n")
const types_1 = require("@roo-code/types")
const telemetry_1 = require("@roo-code/telemetry")
/**
 * Gemini embedder implementation that wraps the OpenAI Compatible embedder
 * with configuration for Google's Gemini embedding API.
 *
 * Supported models:
 * - text-embedding-004 (dimension: 768)
 * - gemini-embedding-001 (dimension: 2048)
 */
class GeminiEmbedder {
	/**
	 * Creates a new Gemini embedder
	 * @param apiKey The Gemini API key for authentication
	 * @param modelId The model ID to use (defaults to gemini-embedding-001)
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
		this.modelId = modelId || GeminiEmbedder.DEFAULT_MODEL
		// Create an OpenAI Compatible embedder with Gemini's configuration
		this.openAICompatibleEmbedder = new openai_compatible_1.OpenAICompatibleEmbedder(
			GeminiEmbedder.GEMINI_BASE_URL,
			apiKey,
			this.modelId,
			constants_1.GEMINI_MAX_ITEM_TOKENS,
		)
	}
	/**
	 * Creates embeddings for the given texts using Gemini's embedding API
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
				location: "GeminiEmbedder:createEmbeddings",
			})
			console.error("Gemini embedder error in createEmbeddings:", error) // kilocode_change
			throw error
		}
	}
	/**
	 * Validates the Gemini embedder configuration by delegating to the underlying OpenAI-compatible embedder
	 * @returns Promise resolving to validation result with success status and optional error message
	 */
	async validateConfiguration() {
		try {
			// Delegate validation to the OpenAI-compatible embedder
			// The error messages will be specific to Gemini since we're using Gemini's base URL
			return await this.openAICompatibleEmbedder.validateConfiguration()
		} catch (error) {
			telemetry_1.TelemetryService.instance.captureEvent(types_1.TelemetryEventName.CODE_INDEX_ERROR, {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				location: "GeminiEmbedder:validateConfiguration",
			})
			console.error("Gemini embedder error in validateConfiguration:", error) // kilocode_change
			throw error
		}
	}
	/**
	 * Returns information about this embedder
	 */
	get embedderInfo() {
		return {
			name: "gemini",
		}
	}
}
exports.GeminiEmbedder = GeminiEmbedder
Object.defineProperty(GeminiEmbedder, "GEMINI_BASE_URL", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: "https://generativelanguage.googleapis.com/v1beta/openai/",
})
Object.defineProperty(GeminiEmbedder, "DEFAULT_MODEL", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: "gemini-embedding-001",
})
//# sourceMappingURL=gemini.js.map
