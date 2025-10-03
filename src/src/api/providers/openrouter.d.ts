import { Anthropic } from "@anthropic-ai/sdk";
import type { ApiHandlerOptions, ModelRecord } from "../../shared/api";
import { ApiStreamChunk } from "../transform/stream";
import type { OpenRouterReasoningParams } from "../transform/reasoning";
import { BaseProvider } from "./base-provider";
import type { ApiHandlerCreateMessageMetadata, // kilocode_change
SingleCompletionHandler } from "../index";
type OpenRouterProviderParams = {
    order?: string[];
    only?: string[];
    ignore?: string[];
    allow_fallbacks?: boolean;
    data_collection?: "allow" | "deny";
    sort?: "price" | "throughput" | "latency";
};
export interface ImageGenerationResult {
    success: boolean;
    imageData?: string;
    imageFormat?: string;
    error?: string;
}
export interface CompletionUsage {
    completion_tokens?: number;
    completion_tokens_details?: {
        reasoning_tokens?: number;
    };
    prompt_tokens?: number;
    prompt_tokens_details?: {
        cached_tokens?: number;
    };
    total_tokens?: number;
    cost?: number;
    is_byok?: boolean;
    cost_details?: {
        upstream_inference_cost?: number;
    };
}
export declare class OpenRouterHandler extends BaseProvider implements SingleCompletionHandler {
    protected options: ApiHandlerOptions;
    private client;
    protected models: ModelRecord;
    protected endpoints: ModelRecord;
    protected get providerName(): string;
    constructor(options: ApiHandlerOptions);
    customRequestOptions(_metadata?: ApiHandlerCreateMessageMetadata): {
        headers: Record<string, string>;
    } | undefined;
    getCustomRequestHeaders(taskId?: string): Record<string, string>;
    getTotalCost(lastUsage: CompletionUsage): number;
    getProviderParams(): {
        provider?: OpenRouterProviderParams;
    };
    createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata): AsyncGenerator<ApiStreamChunk>;
    fetchModel(): Promise<{
        format: "openrouter";
        reasoning: OpenRouterReasoningParams | undefined;
        maxTokens: number | undefined;
        temperature: number | undefined;
        reasoningEffort: import("@roo-code/types").ReasoningEffortWithMinimal | undefined;
        reasoningBudget: number | undefined;
        verbosity: import("@roo-code/types").VerbosityLevel | undefined;
        id: string;
        info: {
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
        };
        topP: number;
    }>;
    getModel(): {
        format: "openrouter";
        reasoning: OpenRouterReasoningParams | undefined;
        maxTokens: number | undefined;
        temperature: number | undefined;
        reasoningEffort: import("@roo-code/types").ReasoningEffortWithMinimal | undefined;
        reasoningBudget: number | undefined;
        verbosity: import("@roo-code/types").VerbosityLevel | undefined;
        id: string;
        info: {
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
        };
        topP: number;
    };
    completePrompt(prompt: string): Promise<any>;
    /**
     * Generate an image using OpenRouter's image generation API
     * @param prompt The text prompt for image generation
     * @param model The model to use for generation
     * @param apiKey The OpenRouter API key (must be explicitly provided)
     * @param inputImage Optional base64 encoded input image data URL
     * @returns The generated image data and format, or an error
     */
    generateImage(prompt: string, model: string, apiKey: string, inputImage?: string, taskId?: string): Promise<ImageGenerationResult>;
}
export {};
//# sourceMappingURL=openrouter.d.ts.map