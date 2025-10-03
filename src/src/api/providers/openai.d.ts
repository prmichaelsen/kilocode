import { Anthropic } from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { type ModelInfo } from "@roo-code/types";
import type { ApiHandlerOptions } from "../../shared/api";
import { ApiStream, ApiStreamUsageChunk } from "../transform/stream";
import { BaseProvider } from "./base-provider";
import type { SingleCompletionHandler, ApiHandlerCreateMessageMetadata } from "../index";
export declare class OpenAiHandler extends BaseProvider implements SingleCompletionHandler {
    protected options: ApiHandlerOptions;
    private client;
    private readonly providerName;
    constructor(options: ApiHandlerOptions);
    createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata): ApiStream;
    protected processUsageMetrics(usage: any, _modelInfo?: ModelInfo): ApiStreamUsageChunk;
    getModel(): {
        format: "openai";
        reasoning: import("../transform/reasoning").OpenAiReasoningParams | undefined;
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
    };
    completePrompt(prompt: string): Promise<string>;
    private handleO3FamilyMessage;
    private handleStreamResponse;
    private _getUrlHost;
    private _isGrokXAI;
    private _isAzureAiInference;
    /**
     * Adds max_completion_tokens to the request body if needed based on provider configuration
     * Note: max_tokens is deprecated in favor of max_completion_tokens as per OpenAI documentation
     * O3 family models handle max_tokens separately in handleO3FamilyMessage
     */
    protected addMaxTokensIfNeeded(requestOptions: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming | OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, modelInfo: ModelInfo): void;
}
export declare function getOpenAiModels(baseUrl?: string, apiKey?: string, openAiHeaders?: Record<string, string>): Promise<string[]>;
//# sourceMappingURL=openai.d.ts.map