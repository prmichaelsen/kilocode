"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.codebaseIndexProviderSchema =
	exports.codebaseIndexModelsSchema =
	exports.codebaseIndexConfigSchema =
	exports.CODEBASE_INDEX_DEFAULTS =
		void 0
const zod_1 = require("zod")
/**
 * Codebase Index Constants
 */
exports.CODEBASE_INDEX_DEFAULTS = {
	MIN_SEARCH_RESULTS: 10,
	MAX_SEARCH_RESULTS: 200,
	DEFAULT_SEARCH_RESULTS: 50,
	SEARCH_RESULTS_STEP: 10,
	MIN_SEARCH_SCORE: 0,
	MAX_SEARCH_SCORE: 1,
	DEFAULT_SEARCH_MIN_SCORE: 0.4,
	SEARCH_SCORE_STEP: 0.05,
}
/**
 * CodebaseIndexConfig
 */
exports.codebaseIndexConfigSchema = zod_1.z.object({
	codebaseIndexEnabled: zod_1.z.boolean().optional(),
	codebaseIndexQdrantUrl: zod_1.z.string().optional(),
	codebaseIndexEmbedderProvider: zod_1.z
		.enum(["openai", "ollama", "openai-compatible", "gemini", "mistral", "vercel-ai-gateway"])
		.optional(),
	codebaseIndexEmbedderBaseUrl: zod_1.z.string().optional(),
	codebaseIndexEmbedderModelId: zod_1.z.string().optional(),
	codebaseIndexEmbedderModelDimension: zod_1.z.number().optional(),
	codebaseIndexSearchMinScore: zod_1.z.number().min(0).max(1).optional(),
	codebaseIndexSearchMaxResults: zod_1.z
		.number()
		.min(exports.CODEBASE_INDEX_DEFAULTS.MIN_SEARCH_RESULTS)
		.max(exports.CODEBASE_INDEX_DEFAULTS.MAX_SEARCH_RESULTS)
		.optional(),
	// OpenAI Compatible specific fields
	codebaseIndexOpenAiCompatibleBaseUrl: zod_1.z.string().optional(),
	codebaseIndexOpenAiCompatibleModelDimension: zod_1.z.number().optional(),
})
/**
 * CodebaseIndexModels
 */
exports.codebaseIndexModelsSchema = zod_1.z.object({
	openai: zod_1.z.record(zod_1.z.string(), zod_1.z.object({ dimension: zod_1.z.number() })).optional(),
	ollama: zod_1.z.record(zod_1.z.string(), zod_1.z.object({ dimension: zod_1.z.number() })).optional(),
	"openai-compatible": zod_1.z.record(zod_1.z.string(), zod_1.z.object({ dimension: zod_1.z.number() })).optional(),
	gemini: zod_1.z.record(zod_1.z.string(), zod_1.z.object({ dimension: zod_1.z.number() })).optional(),
	mistral: zod_1.z.record(zod_1.z.string(), zod_1.z.object({ dimension: zod_1.z.number() })).optional(),
	"vercel-ai-gateway": zod_1.z.record(zod_1.z.string(), zod_1.z.object({ dimension: zod_1.z.number() })).optional(),
})
/**
 * CdebaseIndexProvider
 */
exports.codebaseIndexProviderSchema = zod_1.z.object({
	codeIndexOpenAiKey: zod_1.z.string().optional(),
	codeIndexQdrantApiKey: zod_1.z.string().optional(),
	codebaseIndexOpenAiCompatibleBaseUrl: zod_1.z.string().optional(),
	codebaseIndexOpenAiCompatibleApiKey: zod_1.z.string().optional(),
	codebaseIndexOpenAiCompatibleModelDimension: zod_1.z.number().optional(),
	codebaseIndexGeminiApiKey: zod_1.z.string().optional(),
	codebaseIndexMistralApiKey: zod_1.z.string().optional(),
	codebaseIndexVercelAiGatewayApiKey: zod_1.z.string().optional(),
})
//# sourceMappingURL=codebase-index.js.map
