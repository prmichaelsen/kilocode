import { z } from "zod";
/**
 * ReasoningEffort
 */
export declare const reasoningEfforts: readonly ["low", "medium", "high"];
export declare const reasoningEffortsSchema: z.ZodEnum<["low", "medium", "high"]>;
export type ReasoningEffort = z.infer<typeof reasoningEffortsSchema>;
/**
 * ReasoningEffortWithMinimal
 */
export declare const reasoningEffortWithMinimalSchema: z.ZodUnion<[z.ZodEnum<["low", "medium", "high"]>, z.ZodLiteral<"minimal">]>;
export type ReasoningEffortWithMinimal = z.infer<typeof reasoningEffortWithMinimalSchema>;
/**
 * Verbosity
 */
export declare const verbosityLevels: readonly ["low", "medium", "high"];
export declare const verbosityLevelsSchema: z.ZodEnum<["low", "medium", "high"]>;
export type VerbosityLevel = z.infer<typeof verbosityLevelsSchema>;
/**
 * Service tiers (OpenAI Responses API)
 */
export declare const serviceTiers: readonly ["default", "flex", "priority"];
export declare const serviceTierSchema: z.ZodEnum<["default", "flex", "priority"]>;
export type ServiceTier = z.infer<typeof serviceTierSchema>;
/**
 * ModelParameter
 */
export declare const modelParameters: readonly ["max_tokens", "temperature", "reasoning", "include_reasoning"];
export declare const modelParametersSchema: z.ZodEnum<["max_tokens", "temperature", "reasoning", "include_reasoning"]>;
export type ModelParameter = z.infer<typeof modelParametersSchema>;
export declare const isModelParameter: (value: string) => value is ModelParameter;
/**
 * ModelInfo
 */
export declare const modelInfoSchema: z.ZodObject<{
    maxTokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    maxThinkingTokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    contextWindow: z.ZodNumber;
    supportsImages: z.ZodOptional<z.ZodBoolean>;
    supportsComputerUse: z.ZodOptional<z.ZodBoolean>;
    supportsPromptCache: z.ZodBoolean;
    supportsVerbosity: z.ZodOptional<z.ZodBoolean>;
    supportsReasoningBudget: z.ZodOptional<z.ZodBoolean>;
    supportsTemperature: z.ZodOptional<z.ZodBoolean>;
    requiredReasoningBudget: z.ZodOptional<z.ZodBoolean>;
    supportsReasoningEffort: z.ZodOptional<z.ZodBoolean>;
    supportedParameters: z.ZodOptional<z.ZodArray<z.ZodEnum<["max_tokens", "temperature", "reasoning", "include_reasoning"]>, "many">>;
    inputPrice: z.ZodOptional<z.ZodNumber>;
    outputPrice: z.ZodOptional<z.ZodNumber>;
    cacheWritesPrice: z.ZodOptional<z.ZodNumber>;
    cacheReadsPrice: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
    reasoningEffort: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
    minTokensPerCachePoint: z.ZodOptional<z.ZodNumber>;
    maxCachePoints: z.ZodOptional<z.ZodNumber>;
    cachableFields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    displayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    preferredIndex: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    /**
     * Service tiers with pricing information.
     * Each tier can have a name (for OpenAI service tiers) and pricing overrides.
     * The top-level input/output/cache* fields represent the default/standard tier.
     */
    tiers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodEnum<["default", "flex", "priority"]>>;
        contextWindow: z.ZodNumber;
        inputPrice: z.ZodOptional<z.ZodNumber>;
        outputPrice: z.ZodOptional<z.ZodNumber>;
        cacheWritesPrice: z.ZodOptional<z.ZodNumber>;
        cacheReadsPrice: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name?: "default" | "flex" | "priority";
        contextWindow?: number;
        inputPrice?: number;
        outputPrice?: number;
        cacheWritesPrice?: number;
        cacheReadsPrice?: number;
    }, {
        name?: "default" | "flex" | "priority";
        contextWindow?: number;
        inputPrice?: number;
        outputPrice?: number;
        cacheWritesPrice?: number;
        cacheReadsPrice?: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    maxTokens?: number;
    maxThinkingTokens?: number;
    contextWindow?: number;
    supportsImages?: boolean;
    supportsComputerUse?: boolean;
    supportsPromptCache?: boolean;
    supportsVerbosity?: boolean;
    supportsReasoningBudget?: boolean;
    supportsTemperature?: boolean;
    requiredReasoningBudget?: boolean;
    supportsReasoningEffort?: boolean;
    supportedParameters?: ("reasoning" | "max_tokens" | "temperature" | "include_reasoning")[];
    inputPrice?: number;
    outputPrice?: number;
    cacheWritesPrice?: number;
    cacheReadsPrice?: number;
    description?: string;
    reasoningEffort?: "low" | "medium" | "high";
    minTokensPerCachePoint?: number;
    maxCachePoints?: number;
    cachableFields?: string[];
    displayName?: string;
    preferredIndex?: number;
    tiers?: {
        name?: "default" | "flex" | "priority";
        contextWindow?: number;
        inputPrice?: number;
        outputPrice?: number;
        cacheWritesPrice?: number;
        cacheReadsPrice?: number;
    }[];
}, {
    maxTokens?: number;
    maxThinkingTokens?: number;
    contextWindow?: number;
    supportsImages?: boolean;
    supportsComputerUse?: boolean;
    supportsPromptCache?: boolean;
    supportsVerbosity?: boolean;
    supportsReasoningBudget?: boolean;
    supportsTemperature?: boolean;
    requiredReasoningBudget?: boolean;
    supportsReasoningEffort?: boolean;
    supportedParameters?: ("reasoning" | "max_tokens" | "temperature" | "include_reasoning")[];
    inputPrice?: number;
    outputPrice?: number;
    cacheWritesPrice?: number;
    cacheReadsPrice?: number;
    description?: string;
    reasoningEffort?: "low" | "medium" | "high";
    minTokensPerCachePoint?: number;
    maxCachePoints?: number;
    cachableFields?: string[];
    displayName?: string;
    preferredIndex?: number;
    tiers?: {
        name?: "default" | "flex" | "priority";
        contextWindow?: number;
        inputPrice?: number;
        outputPrice?: number;
        cacheWritesPrice?: number;
        cacheReadsPrice?: number;
    }[];
}>;
export type ModelInfo = z.infer<typeof modelInfoSchema>;
//# sourceMappingURL=model.d.ts.map