"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.getHuggingFaceModels = getHuggingFaceModels
exports.getCachedHuggingFaceModels = getCachedHuggingFaceModels
exports.getCachedRawHuggingFaceModels = getCachedRawHuggingFaceModels
exports.clearHuggingFaceCache = clearHuggingFaceCache
exports.getHuggingFaceModelsWithMetadata = getHuggingFaceModelsWithMetadata
const axios_1 = __importDefault(require("axios"))
const zod_1 = require("zod")
const types_1 = require("@roo-code/types")
const huggingFaceProviderSchema = zod_1.z.object({
	provider: zod_1.z.string(),
	status: zod_1.z.enum(["live", "staging", "error"]),
	supports_tools: zod_1.z.boolean().optional(),
	supports_structured_output: zod_1.z.boolean().optional(),
	context_length: zod_1.z.number().optional(),
	pricing: zod_1.z
		.object({
			input: zod_1.z.number(),
			output: zod_1.z.number(),
		})
		.optional(),
})
const huggingFaceModelSchema = zod_1.z.object({
	id: zod_1.z.string(),
	object: zod_1.z.literal("model"),
	created: zod_1.z.number(),
	owned_by: zod_1.z.string(),
	providers: zod_1.z.array(huggingFaceProviderSchema),
})
const huggingFaceApiResponseSchema = zod_1.z.object({
	object: zod_1.z.string(),
	data: zod_1.z.array(huggingFaceModelSchema),
})
let cache = null
/**
 * Parse a HuggingFace model into ModelInfo format.
 *
 * @param model - The HuggingFace model to parse
 * @param provider - Optional specific provider to use for capabilities
 * @returns ModelInfo object compatible with the application's model system
 */
function parseHuggingFaceModel(model, provider) {
	// Use provider-specific values if available, otherwise find first provider with values.
	const contextLength =
		provider?.context_length ||
		model.providers.find((p) => p.context_length)?.context_length ||
		types_1.HUGGINGFACE_DEFAULT_CONTEXT_WINDOW
	const pricing = provider?.pricing || model.providers.find((p) => p.pricing)?.pricing
	// Include provider name in description if specific provider is given.
	const description = provider ? `${model.id} via ${provider.provider}` : `${model.id} via HuggingFace`
	return {
		maxTokens: Math.min(contextLength, types_1.HUGGINGFACE_DEFAULT_MAX_TOKENS),
		contextWindow: contextLength,
		supportsImages: false, // HuggingFace API doesn't provide this info yet.
		supportsPromptCache: false,
		supportsComputerUse: false,
		inputPrice: pricing?.input,
		outputPrice: pricing?.output,
		description,
	}
}
/**
 * Fetches available models from HuggingFace
 *
 * @returns A promise that resolves to a record of model IDs to model info
 * @throws Will throw an error if the request fails
 */
async function getHuggingFaceModels() {
	const now = Date.now()
	if (cache && now - cache.timestamp < types_1.HUGGINGFACE_CACHE_DURATION) {
		return cache.data
	}
	const models = {}
	try {
		const response = await axios_1.default.get(types_1.HUGGINGFACE_API_URL, {
			headers: {
				"Upgrade-Insecure-Requests": "1",
				"Sec-Fetch-Dest": "document",
				"Sec-Fetch-Mode": "navigate",
				"Sec-Fetch-Site": "none",
				"Sec-Fetch-User": "?1",
				Priority: "u=0, i",
				Pragma: "no-cache",
				"Cache-Control": "no-cache",
			},
			timeout: 10000,
		})
		const result = huggingFaceApiResponseSchema.safeParse(response.data)
		if (!result.success) {
			console.error("HuggingFace models response validation failed:", result.error.format())
			throw new Error("Invalid response format from HuggingFace API")
		}
		const validModels = result.data.data.filter((model) => model.providers.length > 0)
		for (const model of validModels) {
			// Add the base model.
			models[model.id] = parseHuggingFaceModel(model)
			// Add provider-specific variants for all live providers.
			for (const provider of model.providers) {
				if (provider.status === "live") {
					const providerKey = `${model.id}:${provider.provider}`
					const providerModel = parseHuggingFaceModel(model, provider)
					// Always add provider variants to show all available providers.
					models[providerKey] = providerModel
				}
			}
		}
		cache = { data: models, rawModels: validModels, timestamp: now }
		return models
	} catch (error) {
		console.error("Error fetching HuggingFace models:", error)
		if (cache) {
			return cache.data
		}
		if (axios_1.default.isAxiosError(error)) {
			if (error.response) {
				throw new Error(
					`Failed to fetch HuggingFace models: ${error.response.status} ${error.response.statusText}`,
				)
			} else if (error.request) {
				throw new Error(
					"Failed to fetch HuggingFace models: No response from server. Check your internet connection.",
				)
			}
		}
		throw new Error(
			`Failed to fetch HuggingFace models: ${error instanceof Error ? error.message : "Unknown error"}`,
		)
	}
}
/**
 * Get cached models without making an API request.
 */
function getCachedHuggingFaceModels() {
	return cache?.data || null
}
/**
 * Get cached raw models for UI display.
 */
function getCachedRawHuggingFaceModels() {
	return cache?.rawModels || null
}
function clearHuggingFaceCache() {
	cache = null
}
async function getHuggingFaceModelsWithMetadata() {
	try {
		// First, trigger the fetch to populate cache.
		await getHuggingFaceModels()
		// Get the raw models from cache.
		const cachedRawModels = getCachedRawHuggingFaceModels()
		if (cachedRawModels) {
			return {
				models: cachedRawModels,
				cached: true,
				timestamp: Date.now(),
			}
		}
		// If no cached raw models, fetch directly from API.
		const response = await axios_1.default.get(types_1.HUGGINGFACE_API_URL, {
			headers: {
				"Upgrade-Insecure-Requests": "1",
				"Sec-Fetch-Dest": "document",
				"Sec-Fetch-Mode": "navigate",
				"Sec-Fetch-Site": "none",
				"Sec-Fetch-User": "?1",
				Priority: "u=0, i",
				Pragma: "no-cache",
				"Cache-Control": "no-cache",
			},
			timeout: 10000,
		})
		const models = response.data?.data || []
		return {
			models,
			cached: false,
			timestamp: Date.now(),
		}
	} catch (error) {
		console.error("Failed to get HuggingFace models:", error)
		return { models: [], cached: false, timestamp: Date.now() }
	}
}
//# sourceMappingURL=huggingface.js.map
