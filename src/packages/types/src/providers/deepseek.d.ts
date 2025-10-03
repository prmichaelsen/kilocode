export type DeepSeekModelId = keyof typeof deepSeekModels;
export declare const deepSeekDefaultModelId: DeepSeekModelId;
export declare const deepSeekModels: {
    readonly "deepseek-chat": {
        readonly maxTokens: 8192;
        readonly contextWindow: 128000;
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.56;
        readonly outputPrice: 1.68;
        readonly cacheWritesPrice: 0.56;
        readonly cacheReadsPrice: 0.07;
        readonly description: "DeepSeek-V3 achieves a significant breakthrough in inference speed over previous models. It tops the leaderboard among open-source models and rivals the most advanced closed-source models globally.";
    };
    readonly "deepseek-reasoner": {
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
export declare const DEEP_SEEK_DEFAULT_TEMPERATURE = 0.6;
//# sourceMappingURL=deepseek.d.ts.map