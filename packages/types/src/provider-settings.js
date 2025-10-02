"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.MODELS_BY_PROVIDER =
	exports.getApiProtocol =
	exports.ANTHROPIC_STYLE_PROVIDERS =
	exports.modelIdKeysByProvider =
	exports.isTypicalProvider =
	exports.getModelId =
	exports.modelIdKeys =
	exports.PROVIDER_SETTINGS_KEYS =
	exports.discriminatedProviderSettingsWithIdSchema =
	exports.providerSettingsWithIdSchema =
	exports.providerSettingsSchema =
	exports.providerSettingsSchemaDiscriminated =
	exports.zaiApiLineSchema =
	exports.virtualQuotaFallbackProfileDataSchema =
	exports.openRouterProviderSortSchema =
	exports.openRouterProviderDataCollectionSchema =
	exports.providerSettingsEntrySchema =
	exports.isProviderName =
	exports.providerNamesSchema =
	exports.providerNames =
	exports.isFauxProvider =
	exports.fauxProviders =
	exports.isCustomProvider =
	exports.customProviders =
	exports.isInternalProvider =
	exports.internalProviders =
	exports.isLocalProvider =
	exports.localProviders =
	exports.isDynamicProvider =
	exports.dynamicProviders =
	exports.DEFAULT_CONSECUTIVE_MISTAKE_LIMIT =
		void 0
const zod_1 = require("zod")
const model_js_1 = require("./model.js")
const codebase_index_js_1 = require("./codebase-index.js")
const index_js_1 = require("./providers/index.js")
/**
 * constants
 */
exports.DEFAULT_CONSECUTIVE_MISTAKE_LIMIT = 3
/**
 * DynamicProvider
 *
 * Dynamic provider requires external API calls in order to get the model list.
 */
exports.dynamicProviders = [
	"openrouter",
	"vercel-ai-gateway",
	"huggingface",
	"litellm",
	"kilocode-openrouter",
	"deepinfra",
	"io-intelligence",
	"requesty",
	"unbound",
	"glama",
]
const isDynamicProvider = (key) => exports.dynamicProviders.includes(key)
exports.isDynamicProvider = isDynamicProvider
/**
 * LocalProvider
 *
 * Local providers require localhost API calls in order to get the model list.
 */
exports.localProviders = ["ollama", "lmstudio"]
const isLocalProvider = (key) => exports.localProviders.includes(key)
exports.isLocalProvider = isLocalProvider
/**
 * InternalProvider
 *
 * Internal providers require internal VSCode API calls in order to get the
 * model list.
 */
exports.internalProviders = ["vscode-lm"]
const isInternalProvider = (key) => exports.internalProviders.includes(key)
exports.isInternalProvider = isInternalProvider
/**
 * CustomProvider
 *
 * Custom providers are completely configurable within Roo Code settings.
 */
exports.customProviders = ["openai"]
const isCustomProvider = (key) => exports.customProviders.includes(key)
exports.isCustomProvider = isCustomProvider
/**
 * FauxProvider
 *
 * Faux providers do not make external inference calls and therefore do not have
 * model lists.
 */
exports.fauxProviders = ["fake-ai", "human-relay"]
const isFauxProvider = (key) => exports.fauxProviders.includes(key)
exports.isFauxProvider = isFauxProvider
/**
 * ProviderName
 */
exports.providerNames = [
	...exports.dynamicProviders,
	...exports.localProviders,
	...exports.internalProviders,
	...exports.customProviders,
	...exports.fauxProviders,
	"anthropic",
	"bedrock",
	"cerebras",
	"chutes",
	"claude-code",
	"doubao",
	"deepseek",
	"featherless",
	"fireworks",
	"gemini",
	"gemini-cli",
	"groq",
	"mistral",
	"moonshot",
	"openai-native",
	"qwen-code",
	"roo",
	// kilocode_change start
	"kilocode",
	"gemini-cli",
	"virtual-quota-fallback",
	// kilocode_change end
	"sambanova",
	"vertex",
	"xai",
	"zai",
]
exports.providerNamesSchema = zod_1.z.enum(exports.providerNames)
const isProviderName = (key) => typeof key === "string" && exports.providerNames.includes(key)
exports.isProviderName = isProviderName
/**
 * ProviderSettingsEntry
 */
exports.providerSettingsEntrySchema = zod_1.z.object({
	id: zod_1.z.string(),
	name: zod_1.z.string(),
	apiProvider: exports.providerNamesSchema.optional(),
	modelId: zod_1.z.string().optional(),
})
/**
 * ProviderSettings
 */
const baseProviderSettingsSchema = zod_1.z.object({
	includeMaxTokens: zod_1.z.boolean().optional(),
	diffEnabled: zod_1.z.boolean().optional(),
	todoListEnabled: zod_1.z.boolean().optional(),
	fuzzyMatchThreshold: zod_1.z.number().optional(),
	modelTemperature: zod_1.z.number().nullish(),
	rateLimitSeconds: zod_1.z.number().optional(),
	consecutiveMistakeLimit: zod_1.z.number().min(0).optional(),
	// Model reasoning.
	enableReasoningEffort: zod_1.z.boolean().optional(),
	reasoningEffort: model_js_1.reasoningEffortWithMinimalSchema.optional(),
	modelMaxTokens: zod_1.z.number().optional(),
	modelMaxThinkingTokens: zod_1.z.number().optional(),
	// Model verbosity.
	verbosity: model_js_1.verbosityLevelsSchema.optional(),
})
// Several of the providers share common model config properties.
const apiModelIdProviderModelSchema = baseProviderSettingsSchema.extend({
	apiModelId: zod_1.z.string().optional(),
})
const anthropicSchema = apiModelIdProviderModelSchema.extend({
	apiKey: zod_1.z.string().optional(),
	anthropicBaseUrl: zod_1.z.string().optional(),
	anthropicUseAuthToken: zod_1.z.boolean().optional(),
	anthropicBeta1MContext: zod_1.z.boolean().optional(), // Enable 'context-1m-2025-08-07' beta for 1M context window.
})
const claudeCodeSchema = apiModelIdProviderModelSchema.extend({
	claudeCodePath: zod_1.z.string().optional(),
	claudeCodeMaxOutputTokens: zod_1.z.number().int().min(1).max(200000).optional(),
})
const glamaSchema = baseProviderSettingsSchema.extend({
	glamaModelId: zod_1.z.string().optional(),
	glamaApiKey: zod_1.z.string().optional(),
})
// kilocode_change start
exports.openRouterProviderDataCollectionSchema = zod_1.z.enum(["allow", "deny"])
exports.openRouterProviderSortSchema = zod_1.z.enum(["price", "throughput", "latency"])
// kilocode_change end
const openRouterSchema = baseProviderSettingsSchema.extend({
	openRouterApiKey: zod_1.z.string().optional(),
	openRouterModelId: zod_1.z.string().optional(),
	openRouterBaseUrl: zod_1.z.string().optional(),
	openRouterSpecificProvider: zod_1.z.string().optional(),
	openRouterUseMiddleOutTransform: zod_1.z.boolean().optional(),
	// kilocode_change start
	openRouterProviderDataCollection: exports.openRouterProviderDataCollectionSchema.optional(),
	openRouterProviderSort: exports.openRouterProviderSortSchema.optional(),
	// kilocode_change end
})
const bedrockSchema = apiModelIdProviderModelSchema.extend({
	awsAccessKey: zod_1.z.string().optional(),
	awsSecretKey: zod_1.z.string().optional(),
	awsSessionToken: zod_1.z.string().optional(),
	awsRegion: zod_1.z.string().optional(),
	awsUseCrossRegionInference: zod_1.z.boolean().optional(),
	awsUsePromptCache: zod_1.z.boolean().optional(),
	awsProfile: zod_1.z.string().optional(),
	awsUseProfile: zod_1.z.boolean().optional(),
	awsApiKey: zod_1.z.string().optional(),
	awsUseApiKey: zod_1.z.boolean().optional(),
	awsCustomArn: zod_1.z.string().optional(),
	awsModelContextWindow: zod_1.z.number().optional(),
	awsBedrockEndpointEnabled: zod_1.z.boolean().optional(),
	awsBedrockEndpoint: zod_1.z.string().optional(),
	awsBedrock1MContext: zod_1.z.boolean().optional(), // Enable 'context-1m-2025-08-07' beta for 1M context window.
})
const vertexSchema = apiModelIdProviderModelSchema.extend({
	vertexKeyFile: zod_1.z.string().optional(),
	vertexJsonCredentials: zod_1.z.string().optional(),
	vertexProjectId: zod_1.z.string().optional(),
	vertexRegion: zod_1.z.string().optional(),
	enableUrlContext: zod_1.z.boolean().optional(),
	enableGrounding: zod_1.z.boolean().optional(),
})
const openAiSchema = baseProviderSettingsSchema.extend({
	openAiBaseUrl: zod_1.z.string().optional(),
	openAiApiKey: zod_1.z.string().optional(),
	openAiLegacyFormat: zod_1.z.boolean().optional(),
	openAiR1FormatEnabled: zod_1.z.boolean().optional(),
	openAiModelId: zod_1.z.string().optional(),
	openAiCustomModelInfo: model_js_1.modelInfoSchema.nullish(),
	openAiUseAzure: zod_1.z.boolean().optional(),
	azureApiVersion: zod_1.z.string().optional(),
	openAiStreamingEnabled: zod_1.z.boolean().optional(),
	openAiHostHeader: zod_1.z.string().optional(), // Keep temporarily for backward compatibility during migration.
	openAiHeaders: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
})
const ollamaSchema = baseProviderSettingsSchema.extend({
	ollamaModelId: zod_1.z.string().optional(),
	ollamaBaseUrl: zod_1.z.string().optional(),
	ollamaApiKey: zod_1.z.string().optional(),
	ollamaNumCtx: zod_1.z.number().int().min(128).optional(),
})
const vsCodeLmSchema = baseProviderSettingsSchema.extend({
	vsCodeLmModelSelector: zod_1.z
		.object({
			vendor: zod_1.z.string().optional(),
			family: zod_1.z.string().optional(),
			version: zod_1.z.string().optional(),
			id: zod_1.z.string().optional(),
		})
		.optional(),
})
const lmStudioSchema = baseProviderSettingsSchema.extend({
	lmStudioModelId: zod_1.z.string().optional(),
	lmStudioBaseUrl: zod_1.z.string().optional(),
	lmStudioDraftModelId: zod_1.z.string().optional(),
	lmStudioSpeculativeDecodingEnabled: zod_1.z.boolean().optional(),
})
const geminiSchema = apiModelIdProviderModelSchema.extend({
	geminiApiKey: zod_1.z.string().optional(),
	googleGeminiBaseUrl: zod_1.z.string().optional(),
	enableUrlContext: zod_1.z.boolean().optional(),
	enableGrounding: zod_1.z.boolean().optional(),
})
// kilocode_change start
const geminiCliSchema = apiModelIdProviderModelSchema.extend({
	geminiCliOAuthPath: zod_1.z.string().optional(),
	geminiCliProjectId: zod_1.z.string().optional(),
})
// kilocode_change end
const openAiNativeSchema = apiModelIdProviderModelSchema.extend({
	openAiNativeApiKey: zod_1.z.string().optional(),
	openAiNativeBaseUrl: zod_1.z.string().optional(),
	// OpenAI Responses API service tier for openai-native provider only.
	// UI should only expose this when the selected model supports flex/priority.
	openAiNativeServiceTier: model_js_1.serviceTierSchema.optional(),
})
const mistralSchema = apiModelIdProviderModelSchema.extend({
	mistralApiKey: zod_1.z.string().optional(),
	mistralCodestralUrl: zod_1.z.string().optional(),
})
const deepSeekSchema = apiModelIdProviderModelSchema.extend({
	deepSeekBaseUrl: zod_1.z.string().optional(),
	deepSeekApiKey: zod_1.z.string().optional(),
})
const deepInfraSchema = apiModelIdProviderModelSchema.extend({
	deepInfraBaseUrl: zod_1.z.string().optional(),
	deepInfraApiKey: zod_1.z.string().optional(),
	deepInfraModelId: zod_1.z.string().optional(),
})
const doubaoSchema = apiModelIdProviderModelSchema.extend({
	doubaoBaseUrl: zod_1.z.string().optional(),
	doubaoApiKey: zod_1.z.string().optional(),
})
const moonshotSchema = apiModelIdProviderModelSchema.extend({
	moonshotBaseUrl: zod_1.z
		.union([zod_1.z.literal("https://api.moonshot.ai/v1"), zod_1.z.literal("https://api.moonshot.cn/v1")])
		.optional(),
	moonshotApiKey: zod_1.z.string().optional(),
})
const unboundSchema = baseProviderSettingsSchema.extend({
	unboundApiKey: zod_1.z.string().optional(),
	unboundModelId: zod_1.z.string().optional(),
})
const requestySchema = baseProviderSettingsSchema.extend({
	requestyBaseUrl: zod_1.z.string().optional(),
	requestyApiKey: zod_1.z.string().optional(),
	requestyModelId: zod_1.z.string().optional(),
})
const humanRelaySchema = baseProviderSettingsSchema
const fakeAiSchema = baseProviderSettingsSchema.extend({
	fakeAi: zod_1.z.unknown().optional(),
})
const xaiSchema = apiModelIdProviderModelSchema.extend({
	xaiApiKey: zod_1.z.string().optional(),
})
const groqSchema = apiModelIdProviderModelSchema.extend({
	groqApiKey: zod_1.z.string().optional(),
})
const huggingFaceSchema = baseProviderSettingsSchema.extend({
	huggingFaceApiKey: zod_1.z.string().optional(),
	huggingFaceModelId: zod_1.z.string().optional(),
	huggingFaceInferenceProvider: zod_1.z.string().optional(),
})
const chutesSchema = apiModelIdProviderModelSchema.extend({
	chutesApiKey: zod_1.z.string().optional(),
})
const litellmSchema = baseProviderSettingsSchema.extend({
	litellmBaseUrl: zod_1.z.string().optional(),
	litellmApiKey: zod_1.z.string().optional(),
	litellmModelId: zod_1.z.string().optional(),
	litellmUsePromptCache: zod_1.z.boolean().optional(),
})
const cerebrasSchema = apiModelIdProviderModelSchema.extend({
	cerebrasApiKey: zod_1.z.string().optional(),
})
const sambaNovaSchema = apiModelIdProviderModelSchema.extend({
	sambaNovaApiKey: zod_1.z.string().optional(),
})
// kilocode_change start
const kilocodeSchema = baseProviderSettingsSchema.extend({
	kilocodeToken: zod_1.z.string().optional(),
	kilocodeOrganizationId: zod_1.z.string().optional(),
	kilocodeModel: zod_1.z.string().optional(),
	openRouterSpecificProvider: zod_1.z.string().optional(),
	openRouterProviderDataCollection: exports.openRouterProviderDataCollectionSchema.optional(),
	openRouterProviderSort: exports.openRouterProviderSortSchema.optional(),
	kilocodeTesterWarningsDisabledUntil: zod_1.z.number().optional(), // Timestamp for disabling KILOCODE-TESTER warnings
})
exports.virtualQuotaFallbackProfileDataSchema = zod_1.z.object({
	profileName: zod_1.z.string().optional(),
	profileId: zod_1.z.string().optional(),
	profileLimits: zod_1.z
		.object({
			tokensPerMinute: zod_1.z.coerce.number().optional(),
			tokensPerHour: zod_1.z.coerce.number().optional(),
			tokensPerDay: zod_1.z.coerce.number().optional(),
			requestsPerMinute: zod_1.z.coerce.number().optional(),
			requestsPerHour: zod_1.z.coerce.number().optional(),
			requestsPerDay: zod_1.z.coerce.number().optional(),
		})
		.optional(),
})
const virtualQuotaFallbackSchema = baseProviderSettingsSchema.extend({
	profiles: zod_1.z.array(exports.virtualQuotaFallbackProfileDataSchema).optional(),
})
exports.zaiApiLineSchema = zod_1.z.enum(["international_coding", "international", "china_coding", "china"])
const zaiSchema = apiModelIdProviderModelSchema.extend({
	zaiApiKey: zod_1.z.string().optional(),
	zaiApiLine: exports.zaiApiLineSchema.optional(),
})
const fireworksSchema = apiModelIdProviderModelSchema.extend({
	fireworksApiKey: zod_1.z.string().optional(),
})
const featherlessSchema = apiModelIdProviderModelSchema.extend({
	featherlessApiKey: zod_1.z.string().optional(),
})
const ioIntelligenceSchema = apiModelIdProviderModelSchema.extend({
	ioIntelligenceModelId: zod_1.z.string().optional(),
	ioIntelligenceApiKey: zod_1.z.string().optional(),
})
const qwenCodeSchema = apiModelIdProviderModelSchema.extend({
	qwenCodeOauthPath: zod_1.z.string().optional(),
})
const rooSchema = apiModelIdProviderModelSchema.extend({
	// No additional fields needed - uses cloud authentication.
})
const vercelAiGatewaySchema = baseProviderSettingsSchema.extend({
	vercelAiGatewayApiKey: zod_1.z.string().optional(),
	vercelAiGatewayModelId: zod_1.z.string().optional(),
})
const defaultSchema = zod_1.z.object({
	apiProvider: zod_1.z.undefined(),
})
exports.providerSettingsSchemaDiscriminated = zod_1.z.discriminatedUnion("apiProvider", [
	anthropicSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("anthropic") })),
	claudeCodeSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("claude-code") })),
	glamaSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("glama") })),
	openRouterSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("openrouter") })),
	bedrockSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("bedrock") })),
	vertexSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("vertex") })),
	openAiSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("openai") })),
	ollamaSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("ollama") })),
	vsCodeLmSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("vscode-lm") })),
	lmStudioSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("lmstudio") })),
	geminiSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("gemini") })),
	openAiNativeSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("openai-native") })),
	mistralSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("mistral") })),
	deepSeekSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("deepseek") })),
	deepInfraSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("deepinfra") })),
	doubaoSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("doubao") })),
	moonshotSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("moonshot") })),
	unboundSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("unbound") })),
	requestySchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("requesty") })),
	humanRelaySchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("human-relay") })),
	fakeAiSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("fake-ai") })),
	xaiSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("xai") })),
	// kilocode_change start
	geminiCliSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("gemini-cli") })),
	kilocodeSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("kilocode") })),
	virtualQuotaFallbackSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("virtual-quota-fallback") })),
	// kilocode_change end
	groqSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("groq") })),
	huggingFaceSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("huggingface") })),
	chutesSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("chutes") })),
	litellmSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("litellm") })),
	cerebrasSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("cerebras") })),
	sambaNovaSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("sambanova") })),
	zaiSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("zai") })),
	fireworksSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("fireworks") })),
	featherlessSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("featherless") })),
	ioIntelligenceSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("io-intelligence") })),
	qwenCodeSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("qwen-code") })),
	rooSchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("roo") })),
	vercelAiGatewaySchema.merge(zod_1.z.object({ apiProvider: zod_1.z.literal("vercel-ai-gateway") })),
	defaultSchema,
])
exports.providerSettingsSchema = zod_1.z.object({
	apiProvider: exports.providerNamesSchema.optional(),
	...anthropicSchema.shape,
	...claudeCodeSchema.shape,
	...glamaSchema.shape,
	...openRouterSchema.shape,
	...bedrockSchema.shape,
	...vertexSchema.shape,
	...openAiSchema.shape,
	...ollamaSchema.shape,
	...vsCodeLmSchema.shape,
	...lmStudioSchema.shape,
	...geminiSchema.shape,
	// kilocode_change start
	...geminiCliSchema.shape,
	...kilocodeSchema.shape,
	...virtualQuotaFallbackSchema.shape,
	// kilocode_change end
	...openAiNativeSchema.shape,
	...mistralSchema.shape,
	...deepSeekSchema.shape,
	...deepInfraSchema.shape,
	...doubaoSchema.shape,
	...moonshotSchema.shape,
	...unboundSchema.shape,
	...requestySchema.shape,
	...humanRelaySchema.shape,
	...fakeAiSchema.shape,
	...xaiSchema.shape,
	...groqSchema.shape,
	...huggingFaceSchema.shape,
	...chutesSchema.shape,
	...litellmSchema.shape,
	...cerebrasSchema.shape,
	...sambaNovaSchema.shape,
	...zaiSchema.shape,
	...fireworksSchema.shape,
	...featherlessSchema.shape,
	...ioIntelligenceSchema.shape,
	...qwenCodeSchema.shape,
	...rooSchema.shape,
	...vercelAiGatewaySchema.shape,
	...codebase_index_js_1.codebaseIndexProviderSchema.shape,
})
exports.providerSettingsWithIdSchema = exports.providerSettingsSchema.extend({ id: zod_1.z.string().optional() })
exports.discriminatedProviderSettingsWithIdSchema = exports.providerSettingsSchemaDiscriminated.and(
	zod_1.z.object({ id: zod_1.z.string().optional() }),
)
exports.PROVIDER_SETTINGS_KEYS = exports.providerSettingsSchema.keyof().options
/**
 * ModelIdKey
 */
exports.modelIdKeys = [
	"apiModelId",
	"glamaModelId",
	"openRouterModelId",
	"openAiModelId",
	"ollamaModelId",
	"lmStudioModelId",
	"lmStudioDraftModelId",
	"unboundModelId",
	"requestyModelId",
	"litellmModelId",
	"huggingFaceModelId",
	"ioIntelligenceModelId",
	"vercelAiGatewayModelId",
	"deepInfraModelId",
	"kilocodeModel",
]
const getModelId = (settings) => {
	const modelIdKey = exports.modelIdKeys.find((key) => settings[key])
	return modelIdKey ? settings[modelIdKey] : undefined
}
exports.getModelId = getModelId
const isTypicalProvider = (key) =>
	(0, exports.isProviderName)(key) &&
	!(0, exports.isInternalProvider)(key) &&
	!(0, exports.isCustomProvider)(key) &&
	!(0, exports.isFauxProvider)(key)
exports.isTypicalProvider = isTypicalProvider
exports.modelIdKeysByProvider = {
	anthropic: "apiModelId",
	"claude-code": "apiModelId",
	glama: "glamaModelId",
	openrouter: "openRouterModelId",
	"kilocode-openrouter": "openRouterModelId",
	bedrock: "apiModelId",
	vertex: "apiModelId",
	"openai-native": "openAiModelId",
	ollama: "ollamaModelId",
	lmstudio: "lmStudioModelId",
	gemini: "apiModelId",
	"gemini-cli": "apiModelId",
	mistral: "apiModelId",
	moonshot: "apiModelId",
	deepseek: "apiModelId",
	deepinfra: "deepInfraModelId",
	doubao: "apiModelId",
	"qwen-code": "apiModelId",
	unbound: "unboundModelId",
	requesty: "requestyModelId",
	xai: "apiModelId",
	groq: "apiModelId",
	chutes: "apiModelId",
	litellm: "litellmModelId",
	huggingface: "huggingFaceModelId",
	cerebras: "apiModelId",
	sambanova: "apiModelId",
	zai: "apiModelId",
	fireworks: "apiModelId",
	featherless: "apiModelId",
	"io-intelligence": "ioIntelligenceModelId",
	roo: "apiModelId",
	"vercel-ai-gateway": "vercelAiGatewayModelId",
	kilocode: "kilocodeModel",
	"virtual-quota-fallback": "apiModelId",
}
/**
 * ANTHROPIC_STYLE_PROVIDERS
 */
// Providers that use Anthropic-style API protocol.
exports.ANTHROPIC_STYLE_PROVIDERS = ["anthropic", "claude-code", "bedrock"]
const getApiProtocol = (provider, modelId) => {
	if (provider && exports.ANTHROPIC_STYLE_PROVIDERS.includes(provider)) {
		return "anthropic"
	}
	if (provider && provider === "vertex" && modelId && modelId.toLowerCase().includes("claude")) {
		return "anthropic"
	}
	// Vercel AI Gateway uses anthropic protocol for anthropic models.
	if (provider && provider === "vercel-ai-gateway" && modelId && modelId.toLowerCase().startsWith("anthropic/")) {
		return "anthropic"
	}
	return "openai"
}
exports.getApiProtocol = getApiProtocol
/**
 * MODELS_BY_PROVIDER
 */
exports.MODELS_BY_PROVIDER = {
	anthropic: {
		id: "anthropic",
		label: "Anthropic",
		models: Object.keys(index_js_1.anthropicModels),
	},
	bedrock: {
		id: "bedrock",
		label: "Amazon Bedrock",
		models: Object.keys(index_js_1.bedrockModels),
	},
	cerebras: {
		id: "cerebras",
		label: "Cerebras",
		models: Object.keys(index_js_1.cerebrasModels),
	},
	chutes: {
		id: "chutes",
		label: "Chutes AI",
		models: Object.keys(index_js_1.chutesModels),
	},
	"claude-code": { id: "claude-code", label: "Claude Code", models: Object.keys(index_js_1.claudeCodeModels) },
	deepseek: {
		id: "deepseek",
		label: "DeepSeek",
		models: Object.keys(index_js_1.deepSeekModels),
	},
	doubao: { id: "doubao", label: "Doubao", models: Object.keys(index_js_1.doubaoModels) },
	featherless: {
		id: "featherless",
		label: "Featherless",
		models: Object.keys(index_js_1.featherlessModels),
	},
	fireworks: {
		id: "fireworks",
		label: "Fireworks",
		models: Object.keys(index_js_1.fireworksModels),
	},
	gemini: {
		id: "gemini",
		label: "Google Gemini",
		models: Object.keys(index_js_1.geminiModels),
	},
	groq: { id: "groq", label: "Groq", models: Object.keys(index_js_1.groqModels) },
	"io-intelligence": {
		id: "io-intelligence",
		label: "IO Intelligence",
		models: Object.keys(index_js_1.ioIntelligenceModels),
	},
	mistral: {
		id: "mistral",
		label: "Mistral",
		models: Object.keys(index_js_1.mistralModels),
	},
	moonshot: {
		id: "moonshot",
		label: "Moonshot",
		models: Object.keys(index_js_1.moonshotModels),
	},
	"openai-native": {
		id: "openai-native",
		label: "OpenAI",
		models: Object.keys(index_js_1.openAiNativeModels),
	},
	"qwen-code": { id: "qwen-code", label: "Qwen Code", models: Object.keys(index_js_1.qwenCodeModels) },
	roo: { id: "roo", label: "Roo", models: Object.keys(index_js_1.rooModels) },
	sambanova: {
		id: "sambanova",
		label: "SambaNova",
		models: Object.keys(index_js_1.sambaNovaModels),
	},
	vertex: {
		id: "vertex",
		label: "GCP Vertex AI",
		models: Object.keys(index_js_1.vertexModels),
	},
	"vscode-lm": {
		id: "vscode-lm",
		label: "VS Code LM API",
		models: Object.keys(index_js_1.vscodeLlmModels),
	},
	xai: { id: "xai", label: "xAI (Grok)", models: Object.keys(index_js_1.xaiModels) },
	zai: { id: "zai", label: "Zai", models: Object.keys(index_js_1.internationalZAiModels) },
	// Dynamic providers; models pulled from the respective APIs.
	glama: { id: "glama", label: "Glama", models: [] },
	huggingface: { id: "huggingface", label: "Hugging Face", models: [] },
	litellm: { id: "litellm", label: "LiteLLM", models: [] },
	openrouter: { id: "openrouter", label: "OpenRouter", models: [] },
	requesty: { id: "requesty", label: "Requesty", models: [] },
	unbound: { id: "unbound", label: "Unbound", models: [] },
	// kilocode_change start
	kilocode: { id: "kilocode", label: "Kilocode", models: [] },
	"kilocode-openrouter": { id: "kilocode-openrouter", label: "Kilocode", models: [] }, // temporarily needed to satisfy because we're using 2 inconsistent names apparently
	"virtual-quota-fallback": { id: "virtual-quota-fallback", label: "Virtual Quota Fallback", models: [] },
	// kilocode_change end
	deepinfra: { id: "deepinfra", label: "DeepInfra", models: [] },
	"vercel-ai-gateway": { id: "vercel-ai-gateway", label: "Vercel AI Gateway", models: [] },
}
//# sourceMappingURL=provider-settings.js.map
