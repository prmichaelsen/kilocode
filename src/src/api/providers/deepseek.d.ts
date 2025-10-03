import type { ApiHandlerOptions } from "../../shared/api";
import type { ApiStreamUsageChunk } from "../transform/stream";
import { OpenAiHandler } from "./openai";
export declare class DeepSeekHandler extends OpenAiHandler {
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
            readonly maxTokens: 8192;
            readonly contextWindow: 128000;
            readonly supportsImages: false;
            readonly supportsPromptCache: true;
            readonly inputPrice: 0.56;
            readonly outputPrice: 1.68;
            readonly cacheWritesPrice: 0.56;
            readonly cacheReadsPrice: 0.07;
            readonly description: "DeepSeek-V3 achieves a significant breakthrough in inference speed over previous models. It tops the leaderboard among open-source models and rivals the most advanced closed-source models globally.";
        } | {
            readonly maxTokens: 65536;
            readonly contextWindow: 128000;
            readonly supportsImages: false;
            readonly supportsPromptCache: true;
            readonly inputPrice: 0.56;
            readonly outputPrice: 1.68;
            readonly cacheWritesPrice: 0.56;
            readonly cacheReadsPrice: 0.07;
            readonly description: "DeepSeek-R1 achieves performance comparable to OpenAI-o1 across math, code, and reasoning tasks. Supports Chain of Thought reasoning with up to 64K output tokens.";
        };
    };
    protected processUsageMetrics(usage: any): ApiStreamUsageChunk;
}
//# sourceMappingURL=deepseek.d.ts.map