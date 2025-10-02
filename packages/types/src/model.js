"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.modelInfoSchema =
	exports.isModelParameter =
	exports.modelParametersSchema =
	exports.modelParameters =
	exports.serviceTierSchema =
	exports.serviceTiers =
	exports.verbosityLevelsSchema =
	exports.verbosityLevels =
	exports.reasoningEffortWithMinimalSchema =
	exports.reasoningEffortsSchema =
	exports.reasoningEfforts =
		void 0
const zod_1 = require("zod")
/**
 * ReasoningEffort
 */
exports.reasoningEfforts = ["low", "medium", "high"]
exports.reasoningEffortsSchema = zod_1.z.enum(exports.reasoningEfforts)
/**
 * ReasoningEffortWithMinimal
 */
exports.reasoningEffortWithMinimalSchema = zod_1.z.union([exports.reasoningEffortsSchema, zod_1.z.literal("minimal")])
/**
 * Verbosity
 */
exports.verbosityLevels = ["low", "medium", "high"]
exports.verbosityLevelsSchema = zod_1.z.enum(exports.verbosityLevels)
/**
 * Service tiers (OpenAI Responses API)
 */
exports.serviceTiers = ["default", "flex", "priority"]
exports.serviceTierSchema = zod_1.z.enum(exports.serviceTiers)
/**
 * ModelParameter
 */
exports.modelParameters = ["max_tokens", "temperature", "reasoning", "include_reasoning"]
exports.modelParametersSchema = zod_1.z.enum(exports.modelParameters)
const isModelParameter = (value) => exports.modelParameters.includes(value)
exports.isModelParameter = isModelParameter
/**
 * ModelInfo
 */
exports.modelInfoSchema = zod_1.z.object({
	maxTokens: zod_1.z.number().nullish(),
	maxThinkingTokens: zod_1.z.number().nullish(),
	contextWindow: zod_1.z.number(),
	supportsImages: zod_1.z.boolean().optional(),
	supportsComputerUse: zod_1.z.boolean().optional(),
	supportsPromptCache: zod_1.z.boolean(),
	// Capability flag to indicate whether the model supports an output verbosity parameter
	supportsVerbosity: zod_1.z.boolean().optional(),
	supportsReasoningBudget: zod_1.z.boolean().optional(),
	// Capability flag to indicate whether the model supports temperature parameter
	supportsTemperature: zod_1.z.boolean().optional(),
	requiredReasoningBudget: zod_1.z.boolean().optional(),
	supportsReasoningEffort: zod_1.z.boolean().optional(),
	supportedParameters: zod_1.z.array(exports.modelParametersSchema).optional(),
	inputPrice: zod_1.z.number().optional(),
	outputPrice: zod_1.z.number().optional(),
	cacheWritesPrice: zod_1.z.number().optional(),
	cacheReadsPrice: zod_1.z.number().optional(),
	description: zod_1.z.string().optional(),
	reasoningEffort: exports.reasoningEffortsSchema.optional(),
	minTokensPerCachePoint: zod_1.z.number().optional(),
	maxCachePoints: zod_1.z.number().optional(),
	cachableFields: zod_1.z.array(zod_1.z.string()).optional(),
	// kilocode_change start
	displayName: zod_1.z.string().nullish(),
	preferredIndex: zod_1.z.number().nullish(),
	// kilocode_change end
	/**
	 * Service tiers with pricing information.
	 * Each tier can have a name (for OpenAI service tiers) and pricing overrides.
	 * The top-level input/output/cache* fields represent the default/standard tier.
	 */
	tiers: zod_1.z
		.array(
			zod_1.z.object({
				name: exports.serviceTierSchema.optional(), // Service tier name (flex, priority, etc.)
				contextWindow: zod_1.z.number(),
				inputPrice: zod_1.z.number().optional(),
				outputPrice: zod_1.z.number().optional(),
				cacheWritesPrice: zod_1.z.number().optional(),
				cacheReadsPrice: zod_1.z.number().optional(),
			}),
		)
		.optional(),
})
//# sourceMappingURL=model.js.map
