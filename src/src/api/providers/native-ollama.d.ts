import { Anthropic } from "@anthropic-ai/sdk";
import { ModelInfo } from "@roo-code/types";
import { ApiStream } from "../transform/stream";
import { BaseProvider } from "./base-provider";
import type { ApiHandlerOptions } from "../../shared/api";
import type { SingleCompletionHandler, ApiHandlerCreateMessageMetadata } from "../index";
export declare class NativeOllamaHandler extends BaseProvider implements SingleCompletionHandler {
    protected options: ApiHandlerOptions;
    private client;
    protected models: Record<string, ModelInfo>;
    private isInitialized;
    constructor(options: ApiHandlerOptions);
    private initialize;
    private ensureClient;
    createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata): ApiStream;
    fetchModel(): Promise<Record<string, {
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
    }>>;
    getModel(): {
        id: string;
        info: ModelInfo;
    };
    completePrompt(prompt: string): Promise<string>;
}
//# sourceMappingURL=native-ollama.d.ts.map