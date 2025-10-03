import { Anthropic } from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { ModelInfo } from "@roo-code/types";
import type { ApiHandlerOptions } from "../../shared/api";
import { ApiStream } from "../transform/stream";
import type { SingleCompletionHandler, ApiHandlerCreateMessageMetadata } from "../index";
import { BaseProvider } from "./base-provider";
type BaseOpenAiCompatibleProviderOptions<ModelName extends string> = ApiHandlerOptions & {
    providerName: string;
    baseURL: string;
    defaultProviderModelId: ModelName;
    providerModels: Record<ModelName, ModelInfo>;
    defaultTemperature?: number;
};
export declare abstract class BaseOpenAiCompatibleProvider<ModelName extends string> extends BaseProvider implements SingleCompletionHandler {
    protected readonly providerName: string;
    protected readonly baseURL: string;
    protected readonly defaultTemperature: number;
    protected readonly defaultProviderModelId: ModelName;
    protected readonly providerModels: Record<ModelName, ModelInfo>;
    protected readonly options: ApiHandlerOptions;
    protected client: OpenAI;
    constructor({ providerName, baseURL, defaultProviderModelId, providerModels, defaultTemperature, ...options }: BaseOpenAiCompatibleProviderOptions<ModelName>);
    protected createStream(systemPrompt: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata, requestOptions?: OpenAI.RequestOptions): any;
    createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata): ApiStream;
    completePrompt(prompt: string): Promise<string>;
    getModel(): {
        id: ModelName;
        info: Record<ModelName, {
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
        }>[ModelName];
    };
}
export {};
//# sourceMappingURL=base-openai-compatible-provider.d.ts.map