import { z } from "zod";
/**
 * Codebase Index Constants
 */
export declare const CODEBASE_INDEX_DEFAULTS: {
    readonly MIN_SEARCH_RESULTS: 10;
    readonly MAX_SEARCH_RESULTS: 200;
    readonly DEFAULT_SEARCH_RESULTS: 50;
    readonly SEARCH_RESULTS_STEP: 10;
    readonly MIN_SEARCH_SCORE: 0;
    readonly MAX_SEARCH_SCORE: 1;
    readonly DEFAULT_SEARCH_MIN_SCORE: 0.4;
    readonly SEARCH_SCORE_STEP: 0.05;
};
/**
 * CodebaseIndexConfig
 */
export declare const codebaseIndexConfigSchema: z.ZodObject<{
    codebaseIndexEnabled: z.ZodOptional<z.ZodBoolean>;
    codebaseIndexQdrantUrl: z.ZodOptional<z.ZodString>;
    codebaseIndexEmbedderProvider: z.ZodOptional<z.ZodEnum<["openai", "ollama", "openai-compatible", "gemini", "mistral", "vercel-ai-gateway"]>>;
    codebaseIndexEmbedderBaseUrl: z.ZodOptional<z.ZodString>;
    codebaseIndexEmbedderModelId: z.ZodOptional<z.ZodString>;
    codebaseIndexEmbedderModelDimension: z.ZodOptional<z.ZodNumber>;
    codebaseIndexSearchMinScore: z.ZodOptional<z.ZodNumber>;
    codebaseIndexSearchMaxResults: z.ZodOptional<z.ZodNumber>;
    codebaseIndexOpenAiCompatibleBaseUrl: z.ZodOptional<z.ZodString>;
    codebaseIndexOpenAiCompatibleModelDimension: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    codebaseIndexEnabled?: boolean;
    codebaseIndexQdrantUrl?: string;
    codebaseIndexEmbedderProvider?: "openai" | "ollama" | "openai-compatible" | "gemini" | "mistral" | "vercel-ai-gateway";
    codebaseIndexEmbedderBaseUrl?: string;
    codebaseIndexEmbedderModelId?: string;
    codebaseIndexEmbedderModelDimension?: number;
    codebaseIndexSearchMinScore?: number;
    codebaseIndexSearchMaxResults?: number;
    codebaseIndexOpenAiCompatibleBaseUrl?: string;
    codebaseIndexOpenAiCompatibleModelDimension?: number;
}, {
    codebaseIndexEnabled?: boolean;
    codebaseIndexQdrantUrl?: string;
    codebaseIndexEmbedderProvider?: "openai" | "ollama" | "openai-compatible" | "gemini" | "mistral" | "vercel-ai-gateway";
    codebaseIndexEmbedderBaseUrl?: string;
    codebaseIndexEmbedderModelId?: string;
    codebaseIndexEmbedderModelDimension?: number;
    codebaseIndexSearchMinScore?: number;
    codebaseIndexSearchMaxResults?: number;
    codebaseIndexOpenAiCompatibleBaseUrl?: string;
    codebaseIndexOpenAiCompatibleModelDimension?: number;
}>;
export type CodebaseIndexConfig = z.infer<typeof codebaseIndexConfigSchema>;
/**
 * CodebaseIndexModels
 */
export declare const codebaseIndexModelsSchema: z.ZodObject<{
    openai: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        dimension: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        dimension?: number;
    }, {
        dimension?: number;
    }>>>;
    ollama: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        dimension: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        dimension?: number;
    }, {
        dimension?: number;
    }>>>;
    "openai-compatible": z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        dimension: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        dimension?: number;
    }, {
        dimension?: number;
    }>>>;
    gemini: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        dimension: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        dimension?: number;
    }, {
        dimension?: number;
    }>>>;
    mistral: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        dimension: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        dimension?: number;
    }, {
        dimension?: number;
    }>>>;
    "vercel-ai-gateway": z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        dimension: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        dimension?: number;
    }, {
        dimension?: number;
    }>>>;
}, "strip", z.ZodTypeAny, {
    openai?: Record<string, {
        dimension?: number;
    }>;
    ollama?: Record<string, {
        dimension?: number;
    }>;
    "openai-compatible"?: Record<string, {
        dimension?: number;
    }>;
    gemini?: Record<string, {
        dimension?: number;
    }>;
    mistral?: Record<string, {
        dimension?: number;
    }>;
    "vercel-ai-gateway"?: Record<string, {
        dimension?: number;
    }>;
}, {
    openai?: Record<string, {
        dimension?: number;
    }>;
    ollama?: Record<string, {
        dimension?: number;
    }>;
    "openai-compatible"?: Record<string, {
        dimension?: number;
    }>;
    gemini?: Record<string, {
        dimension?: number;
    }>;
    mistral?: Record<string, {
        dimension?: number;
    }>;
    "vercel-ai-gateway"?: Record<string, {
        dimension?: number;
    }>;
}>;
export type CodebaseIndexModels = z.infer<typeof codebaseIndexModelsSchema>;
/**
 * CdebaseIndexProvider
 */
export declare const codebaseIndexProviderSchema: z.ZodObject<{
    codeIndexOpenAiKey: z.ZodOptional<z.ZodString>;
    codeIndexQdrantApiKey: z.ZodOptional<z.ZodString>;
    codebaseIndexOpenAiCompatibleBaseUrl: z.ZodOptional<z.ZodString>;
    codebaseIndexOpenAiCompatibleApiKey: z.ZodOptional<z.ZodString>;
    codebaseIndexOpenAiCompatibleModelDimension: z.ZodOptional<z.ZodNumber>;
    codebaseIndexGeminiApiKey: z.ZodOptional<z.ZodString>;
    codebaseIndexMistralApiKey: z.ZodOptional<z.ZodString>;
    codebaseIndexVercelAiGatewayApiKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    codebaseIndexOpenAiCompatibleBaseUrl?: string;
    codebaseIndexOpenAiCompatibleModelDimension?: number;
    codeIndexOpenAiKey?: string;
    codeIndexQdrantApiKey?: string;
    codebaseIndexOpenAiCompatibleApiKey?: string;
    codebaseIndexGeminiApiKey?: string;
    codebaseIndexMistralApiKey?: string;
    codebaseIndexVercelAiGatewayApiKey?: string;
}, {
    codebaseIndexOpenAiCompatibleBaseUrl?: string;
    codebaseIndexOpenAiCompatibleModelDimension?: number;
    codeIndexOpenAiKey?: string;
    codeIndexQdrantApiKey?: string;
    codebaseIndexOpenAiCompatibleApiKey?: string;
    codebaseIndexGeminiApiKey?: string;
    codebaseIndexMistralApiKey?: string;
    codebaseIndexVercelAiGatewayApiKey?: string;
}>;
export type CodebaseIndexProvider = z.infer<typeof codebaseIndexProviderSchema>;
//# sourceMappingURL=codebase-index.d.ts.map