import OpenAI from "openai";
import { type ModelInfo } from "@roo-code/types";
import type { ApiHandlerOptions } from "../../shared/api";
import type { ApiStreamUsageChunk } from "../transform/stream";
import { OpenAiHandler } from "./openai";
export declare class MoonshotHandler extends OpenAiHandler {
    constructor(options: ApiHandlerOptions);
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
            readonly maxTokens: 32000;
            readonly contextWindow: 131072;
            readonly supportsImages: false;
            readonly supportsPromptCache: true;
            readonly inputPrice: 0.6;
            readonly outputPrice: 2.5;
            readonly cacheWritesPrice: 0;
            readonly cacheReadsPrice: 0.15;
            readonly description: "Kimi K2 is a state-of-the-art mixture-of-experts (MoE) language model with 32 billion activated parameters and 1 trillion total parameters.";
        } | {
            readonly maxTokens: 16384;
            readonly contextWindow: 262144;
            readonly supportsImages: false;
            readonly supportsPromptCache: true;
            readonly inputPrice: 0.6;
            readonly outputPrice: 2.5;
            readonly cacheReadsPrice: 0.15;
            readonly description: "Kimi K2 model gets a new version update: Agentic coding: more accurate, better generalization across scaffolds. Frontend coding: improved aesthetics and functionalities on web, 3d, and other tasks. Context length: extended from 128k to 256k, providing better long-horizon support.";
        } | {
            readonly maxTokens: 32000;
            readonly contextWindow: 262144;
            readonly supportsImages: false;
            readonly supportsPromptCache: true;
            readonly inputPrice: 2.4;
            readonly outputPrice: 10;
            readonly cacheWritesPrice: 0;
            readonly cacheReadsPrice: 0.6;
            readonly description: "Kimi K2 Turbo is a high-speed version of the state-of-the-art Kimi K2 mixture-of-experts (MoE) language model, with the same 32 billion activated parameters and 1 trillion total parameters, optimized for output speeds of up to 60 tokens per second, peaking at 100 tokens per second.";
        };
    };
    protected processUsageMetrics(usage: any): ApiStreamUsageChunk;
    protected addMaxTokensIfNeeded(requestOptions: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming | OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, modelInfo: ModelInfo): void;
}
//# sourceMappingURL=moonshot.d.ts.map