export type XAIModelId = keyof typeof xaiModels;
export declare const xaiDefaultModelId: XAIModelId;
export declare const xaiModels: {
    readonly "grok-code-fast-1": {
        readonly maxTokens: 16384;
        readonly contextWindow: 262144;
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.2;
        readonly outputPrice: 1.5;
        readonly cacheWritesPrice: 0.02;
        readonly cacheReadsPrice: 0.02;
        readonly description: "xAI's Grok Code Fast model with 256K context window";
    };
    readonly "grok-4": {
        readonly maxTokens: 8192;
        readonly contextWindow: 256000;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 3;
        readonly outputPrice: 15;
        readonly cacheWritesPrice: 0.75;
        readonly cacheReadsPrice: 0.75;
        readonly description: "xAI's Grok-4 model with 256K context window";
    };
    readonly "grok-4-fast": {
        readonly maxTokens: 30000;
        readonly contextWindow: 2000000;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.4;
        readonly outputPrice: 1;
        readonly cacheReadsPrice: 0.05;
        readonly description: "xAI's Grok-4-Fast model with reasonning and a 2M context window";
        readonly tiers: [{
            readonly contextWindow: 128000;
            readonly inputPrice: 0.2;
            readonly outputPrice: 0.5;
            readonly cacheReadsPrice: 0.05;
        }, {
            readonly contextWindow: number;
            readonly inputPrice: 0.4;
            readonly outputPrice: 1;
            readonly cacheReadsPrice: 0.05;
        }];
    };
    readonly "grok-4-fast-non-reasoning": {
        readonly maxTokens: 30000;
        readonly contextWindow: 2000000;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.4;
        readonly outputPrice: 1;
        readonly cacheReadsPrice: 0.05;
        readonly description: "xAI's Grok-4-Fast model without reasonning and with a 2M context window";
        readonly tiers: [{
            readonly contextWindow: 128000;
            readonly inputPrice: 0.2;
            readonly outputPrice: 0.5;
            readonly cacheReadsPrice: 0.05;
        }, {
            readonly contextWindow: number;
            readonly inputPrice: 0.4;
            readonly outputPrice: 1;
            readonly cacheReadsPrice: 0.05;
        }];
    };
    readonly "grok-3": {
        readonly maxTokens: 8192;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly inputPrice: 3;
        readonly outputPrice: 15;
        readonly cacheWritesPrice: 0.75;
        readonly cacheReadsPrice: 0.75;
        readonly description: "xAI's Grok-3 model with 128K context window";
    };
    readonly "grok-3-fast": {
        readonly maxTokens: 8192;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly inputPrice: 5;
        readonly outputPrice: 25;
        readonly cacheWritesPrice: 1.25;
        readonly cacheReadsPrice: 1.25;
        readonly description: "xAI's Grok-3 fast model with 128K context window";
    };
    readonly "grok-3-mini": {
        readonly maxTokens: 8192;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.3;
        readonly outputPrice: 0.5;
        readonly cacheWritesPrice: 0.07;
        readonly cacheReadsPrice: 0.07;
        readonly description: "xAI's Grok-3 mini model with 128K context window";
        readonly supportsReasoningEffort: true;
    };
    readonly "grok-3-mini-fast": {
        readonly maxTokens: 8192;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.6;
        readonly outputPrice: 4;
        readonly cacheWritesPrice: 0.15;
        readonly cacheReadsPrice: 0.15;
        readonly description: "xAI's Grok-3 mini fast model with 128K context window";
        readonly supportsReasoningEffort: true;
    };
    readonly "grok-2-1212": {
        readonly maxTokens: 8192;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 2;
        readonly outputPrice: 10;
        readonly description: "xAI's Grok-2 model (version 1212) with 128K context window";
    };
    readonly "grok-2-vision-1212": {
        readonly maxTokens: 8192;
        readonly contextWindow: 32768;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 2;
        readonly outputPrice: 10;
        readonly description: "xAI's Grok-2 Vision model (version 1212) with image support and 32K context window";
    };
};
//# sourceMappingURL=xai.d.ts.map