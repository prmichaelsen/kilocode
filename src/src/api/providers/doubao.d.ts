import { OpenAiHandler } from "./openai";
import type { ApiHandlerOptions } from "../../shared/api";
import { ApiStreamUsageChunk } from "../transform/stream";
export declare class DoubaoHandler extends OpenAiHandler {
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
            readonly maxTokens: 32768;
            readonly contextWindow: 128000;
            readonly supportsImages: true;
            readonly supportsPromptCache: true;
            readonly inputPrice: 0.0001;
            readonly outputPrice: 0.0004;
            readonly cacheWritesPrice: 0.0001;
            readonly cacheReadsPrice: 0.00002;
            readonly description: "Doubao Seed 1.6 is a powerful model designed for high-performance tasks with extensive context handling.";
        } | {
            readonly maxTokens: 32768;
            readonly contextWindow: 128000;
            readonly supportsImages: true;
            readonly supportsPromptCache: true;
            readonly inputPrice: 0.0002;
            readonly outputPrice: 0.0008;
            readonly cacheWritesPrice: 0.0002;
            readonly cacheReadsPrice: 0.00004;
            readonly description: "Doubao Seed 1.6 Thinking is optimized for reasoning tasks, providing enhanced performance in complex problem-solving scenarios.";
        } | {
            readonly maxTokens: 32768;
            readonly contextWindow: 128000;
            readonly supportsImages: true;
            readonly supportsPromptCache: true;
            readonly inputPrice: 0.00015;
            readonly outputPrice: 0.0006;
            readonly cacheWritesPrice: 0.00015;
            readonly cacheReadsPrice: 0.00003;
            readonly description: "Doubao Seed 1.6 Flash is tailored for speed and efficiency, making it ideal for applications requiring rapid responses.";
        };
    };
    protected processUsageMetrics(usage: any): ApiStreamUsageChunk;
}
//# sourceMappingURL=doubao.d.ts.map