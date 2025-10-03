import type { Anthropic } from "@anthropic-ai/sdk";
import { type ApiHandler } from "..";
import { type ApiStream } from "../transform/stream";
import { BaseProvider } from "./base-provider";
import { ApiHandlerOptions } from "../../shared/api";
export declare class ClaudeCodeHandler extends BaseProvider implements ApiHandler {
    private options;
    constructor(options: ApiHandlerOptions);
    createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream;
    getModel(): {
        id: "claude-sonnet-4-5" | "claude-sonnet-4-20250514" | "claude-opus-4-1-20250805" | "claude-opus-4-20250514" | "claude-3-7-sonnet-20250219" | "claude-3-5-sonnet-20241022" | "claude-3-5-haiku-20241022";
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
    private attemptParse;
}
//# sourceMappingURL=claude-code.d.ts.map