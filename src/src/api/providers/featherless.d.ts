import { type FeatherlessModelId } from "@roo-code/types";
import { Anthropic } from "@anthropic-ai/sdk";
import type { ApiHandlerOptions } from "../../shared/api";
import { ApiStream } from "../transform/stream";
import { BaseOpenAiCompatibleProvider } from "./base-openai-compatible-provider";
export declare class FeatherlessHandler extends BaseOpenAiCompatibleProvider<FeatherlessModelId> {
    constructor(options: ApiHandlerOptions);
    private getCompletionParams;
    createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream;
    getModel(): {
        info: {
            temperature: number;
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
        id: FeatherlessModelId;
    };
}
//# sourceMappingURL=featherless.d.ts.map