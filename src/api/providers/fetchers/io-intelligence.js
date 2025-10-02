"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.getIOIntelligenceModels = getIOIntelligenceModels
exports.getCachedIOIntelligenceModels = getCachedIOIntelligenceModels
exports.clearIOIntelligenceCache = clearIOIntelligenceCache
const axios_1 = __importDefault(require("axios"))
const zod_1 = require("zod")
const types_1 = require("@roo-code/types")
const ioIntelligenceModelSchema = zod_1.z.object({
	id: zod_1.z.string(),
	object: zod_1.z.literal("model"),
	created: zod_1.z.number(),
	owned_by: zod_1.z.string(),
	root: zod_1.z.string().nullable().optional(),
	parent: zod_1.z.string().nullable().optional(),
	max_model_len: zod_1.z.number().nullable().optional(),
	permission: zod_1.z.array(
		zod_1.z.object({
			id: zod_1.z.string(),
			object: zod_1.z.literal("model_permission"),
			created: zod_1.z.number(),
			allow_create_engine: zod_1.z.boolean(),
			allow_sampling: zod_1.z.boolean(),
			allow_logprobs: zod_1.z.boolean(),
			allow_search_indices: zod_1.z.boolean(),
			allow_view: zod_1.z.boolean(),
			allow_fine_tuning: zod_1.z.boolean(),
			organization: zod_1.z.string(),
			group: zod_1.z.string().nullable(),
			is_blocking: zod_1.z.boolean(),
		}),
	),
})
const ioIntelligenceApiResponseSchema = zod_1.z.object({
	object: zod_1.z.literal("list"),
	data: zod_1.z.array(ioIntelligenceModelSchema),
})
let cache = null
/**
 * Model context length mapping based on the documentation
 * <mcreference link="https://docs.io.net/reference/get-started-with-io-intelligence-api" index="1">1</mcreference>
 */
const MODEL_CONTEXT_LENGTHS = {
	"meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8": 430000,
	"deepseek-ai/DeepSeek-R1-0528": 128000,
	"Intel/Qwen3-Coder-480B-A35B-Instruct-int4-mixed-ar": 106000,
	"openai/gpt-oss-120b": 131072,
}
const VISION_MODELS = new Set([
	"Qwen/Qwen2.5-VL-32B-Instruct",
	"meta-llama/Llama-3.2-90B-Vision-Instruct",
	"meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
])
function parseIOIntelligenceModel(model) {
	const contextLength = MODEL_CONTEXT_LENGTHS[model.id] || 8192
	// Cap maxTokens at 32k for very large context windows, or 20% of context length, whichever is smaller.
	const maxTokens = Math.min(contextLength, Math.ceil(contextLength * 0.2), 32768)
	const supportsImages = VISION_MODELS.has(model.id)
	return {
		maxTokens,
		contextWindow: contextLength,
		supportsImages,
		supportsPromptCache: false,
		supportsComputerUse: false,
		description: `${model.id} via IO Intelligence`,
	}
}
/**
 * Fetches available models from IO Intelligence
 * <mcreference link="https://docs.io.net/reference/get-started-with-io-intelligence-api" index="1">1</mcreference>
 */
async function getIOIntelligenceModels(apiKey) {
	const now = Date.now()
	if (cache && now - cache.timestamp < types_1.IO_INTELLIGENCE_CACHE_DURATION) {
		return cache.data
	}
	const models = {}
	try {
		const headers = {
			"Content-Type": "application/json",
		}
		if (apiKey) {
			headers.Authorization = `Bearer ${apiKey}`
		} else {
			console.error("IO Intelligence API key is required")
			throw new Error("IO Intelligence API key is required")
		}
		const response = await axios_1.default.get("https://api.intelligence.io.solutions/api/v1/models", {
			headers,
			timeout: 10000,
		})
		const result = ioIntelligenceApiResponseSchema.safeParse(response.data)
		if (!result.success) {
			console.error("IO Intelligence models response validation failed:", result.error.format())
			throw new Error("Invalid response format from IO Intelligence API")
		}
		for (const model of result.data.data) {
			models[model.id] = parseIOIntelligenceModel(model)
		}
		cache = { data: models, timestamp: now }
		return models
	} catch (error) {
		console.error("Error fetching IO Intelligence models:", error)
		if (cache) {
			return cache.data
		}
		if (axios_1.default.isAxiosError(error)) {
			if (error.response) {
				throw new Error(
					`Failed to fetch IO Intelligence models: ${error.response.status} ${error.response.statusText}`,
				)
			} else if (error.request) {
				throw new Error(
					"Failed to fetch IO Intelligence models: No response from server. Check your internet connection.",
				)
			}
		}
		throw new Error(
			`Failed to fetch IO Intelligence models: ${error instanceof Error ? error.message : "Unknown error"}`,
		)
	}
}
function getCachedIOIntelligenceModels() {
	return cache?.data || null
}
function clearIOIntelligenceCache() {
	cache = null
}
//# sourceMappingURL=io-intelligence.js.map
