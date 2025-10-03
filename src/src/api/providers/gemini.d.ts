import type { Anthropic } from "@anthropic-ai/sdk";
import { type ModelInfo } from "@roo-code/types";
import type { ApiHandlerOptions } from "../../shared/api";
import type { ApiStream } from "../transform/stream";
import type { SingleCompletionHandler, ApiHandlerCreateMessageMetadata } from "../index";
import { BaseProvider } from "./base-provider";
type GeminiHandlerOptions = ApiHandlerOptions & {
    isVertex?: boolean;
};
export declare class GeminiHandler extends BaseProvider implements SingleCompletionHandler {
    protected options: ApiHandlerOptions;
    private client;
    constructor({ isVertex, ...options }: GeminiHandlerOptions);
    createMessage(systemInstruction: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata): ApiStream;
    getModel(): {
        format: "gemini";
        reasoning: import("../transform/reasoning").GeminiReasoningParams | undefined;
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
    private extractGroundingSources;
    private extractCitationsOnly;
    completePrompt(prompt: string): Promise<string>;
    countTokens(content: Array<Anthropic.Messages.ContentBlockParam>): Promise<number>;
    calculateCost({ info, inputTokens, outputTokens, cacheReadTokens, }: {
        info: ModelInfo;
        inputTokens: number;
        outputTokens: number;
        cacheReadTokens?: number;
    }): number;
}
export {};
//# sourceMappingURL=gemini.d.ts.map