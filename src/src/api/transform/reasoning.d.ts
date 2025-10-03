import { BetaThinkingConfigParam } from "@anthropic-ai/sdk/resources/beta";
import OpenAI from "openai";
import type { GenerateContentConfig } from "@google/genai";
import type { ModelInfo, ProviderSettings, ReasoningEffortWithMinimal } from "@roo-code/types";
export type OpenRouterReasoningParams = {
    effort?: ReasoningEffortWithMinimal;
    max_tokens?: number;
    exclude?: boolean;
    enabled?: boolean;
};
export type AnthropicReasoningParams = BetaThinkingConfigParam;
export type OpenAiReasoningParams = {
    reasoning_effort: OpenAI.Chat.ChatCompletionCreateParams["reasoning_effort"];
};
export type GeminiReasoningParams = GenerateContentConfig["thinkingConfig"];
export type GetModelReasoningOptions = {
    model: ModelInfo;
    reasoningBudget: number | undefined;
    reasoningEffort: ReasoningEffortWithMinimal | undefined;
    settings: ProviderSettings;
};
export declare const getOpenRouterReasoning: ({ model, reasoningBudget, reasoningEffort, settings, }: GetModelReasoningOptions) => OpenRouterReasoningParams | undefined;
export declare const getAnthropicReasoning: ({ model, reasoningBudget, settings, }: GetModelReasoningOptions) => AnthropicReasoningParams | undefined;
export declare const getOpenAiReasoning: ({ model, reasoningEffort, settings, }: GetModelReasoningOptions) => OpenAiReasoningParams | undefined;
export declare const getGeminiReasoning: ({ model, reasoningBudget, settings, }: GetModelReasoningOptions) => GeminiReasoningParams | undefined;
//# sourceMappingURL=reasoning.d.ts.map