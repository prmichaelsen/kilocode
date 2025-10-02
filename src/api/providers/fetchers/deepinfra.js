"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.getDeepInfraModels = getDeepInfraModels
const axios_1 = __importDefault(require("axios"))
const zod_1 = require("zod")
const constants_1 = require("../constants")
// DeepInfra models endpoint follows OpenAI /models shape with an added metadata object.
const DeepInfraModelSchema = zod_1.z.object({
	id: zod_1.z.string(),
	object: zod_1.z.literal("model").optional(),
	owned_by: zod_1.z.string().optional(),
	created: zod_1.z.number().optional(),
	root: zod_1.z.string().optional(),
	metadata: zod_1.z
		.object({
			description: zod_1.z.string().optional(),
			context_length: zod_1.z.number().optional(),
			max_tokens: zod_1.z.number().optional(),
			tags: zod_1.z.array(zod_1.z.string()).optional(), // e.g., ["vision", "prompt_cache"]
			pricing: zod_1.z
				.object({
					input_tokens: zod_1.z.number().optional(),
					output_tokens: zod_1.z.number().optional(),
					cache_read_tokens: zod_1.z.number().optional(),
				})
				.optional(),
		})
		.optional(),
})
const DeepInfraModelsResponseSchema = zod_1.z.object({ data: zod_1.z.array(DeepInfraModelSchema) })
async function getDeepInfraModels(apiKey, baseUrl = "https://api.deepinfra.com/v1/openai") {
	const headers = { ...constants_1.DEFAULT_HEADERS }
	if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`
	const url = `${baseUrl.replace(/\/$/, "")}/models`
	const models = {}
	const response = await axios_1.default.get(url, { headers })
	const parsed = DeepInfraModelsResponseSchema.safeParse(response.data)
	const data = parsed.success ? parsed.data.data : response.data?.data || []
	for (const m of data) {
		const meta = m.metadata || {}
		const tags = meta.tags || []
		const contextWindow = typeof meta.context_length === "number" ? meta.context_length : 8192
		const maxTokens = typeof meta.max_tokens === "number" ? meta.max_tokens : Math.ceil(contextWindow * 0.2)
		const info = {
			maxTokens,
			contextWindow,
			supportsImages: tags.includes("vision"),
			supportsPromptCache: tags.includes("prompt_cache"),
			inputPrice: meta.pricing?.input_tokens,
			outputPrice: meta.pricing?.output_tokens,
			cacheReadsPrice: meta.pricing?.cache_read_tokens,
			description: meta.description,
		}
		models[m.id] = info
	}
	return models
}
//# sourceMappingURL=deepinfra.js.map
