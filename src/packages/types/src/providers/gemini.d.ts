export type GeminiModelId = keyof typeof geminiModels;
export declare const geminiDefaultModelId: GeminiModelId;
export declare const geminiModels: {
    readonly "gemini-2.5-flash-preview-04-17:thinking": {
        readonly maxTokens: 65535;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.15;
        readonly outputPrice: 3.5;
        readonly maxThinkingTokens: 24576;
        readonly supportsReasoningBudget: true;
        readonly requiredReasoningBudget: true;
    };
    readonly "gemini-2.5-flash-preview-04-17": {
        readonly maxTokens: 65535;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.15;
        readonly outputPrice: 0.6;
    };
    readonly "gemini-2.5-flash-preview-05-20:thinking": {
        readonly maxTokens: 65535;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.15;
        readonly outputPrice: 3.5;
        readonly cacheReadsPrice: 0.0375;
        readonly cacheWritesPrice: 1;
        readonly maxThinkingTokens: 24576;
        readonly supportsReasoningBudget: true;
        readonly requiredReasoningBudget: true;
    };
    readonly "gemini-2.5-flash-preview-05-20": {
        readonly maxTokens: 65535;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.15;
        readonly outputPrice: 0.6;
        readonly cacheReadsPrice: 0.0375;
        readonly cacheWritesPrice: 1;
    };
    readonly "gemini-2.5-flash": {
        readonly maxTokens: 64000;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.3;
        readonly outputPrice: 2.5;
        readonly cacheReadsPrice: 0.075;
        readonly cacheWritesPrice: 1;
        readonly maxThinkingTokens: 24576;
        readonly supportsReasoningBudget: true;
    };
    readonly "gemini-2.5-pro-exp-03-25": {
        readonly maxTokens: 65535;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
    };
    readonly "gemini-2.5-pro-preview-03-25": {
        readonly maxTokens: 65535;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 2.5;
        readonly outputPrice: 15;
        readonly cacheReadsPrice: 0.625;
        readonly cacheWritesPrice: 4.5;
        readonly tiers: [{
            readonly contextWindow: 200000;
            readonly inputPrice: 1.25;
            readonly outputPrice: 10;
            readonly cacheReadsPrice: 0.31;
        }, {
            readonly contextWindow: number;
            readonly inputPrice: 2.5;
            readonly outputPrice: 15;
            readonly cacheReadsPrice: 0.625;
        }];
    };
    readonly "gemini-2.5-pro-preview-05-06": {
        readonly maxTokens: 65535;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 2.5;
        readonly outputPrice: 15;
        readonly cacheReadsPrice: 0.625;
        readonly cacheWritesPrice: 4.5;
        readonly tiers: [{
            readonly contextWindow: 200000;
            readonly inputPrice: 1.25;
            readonly outputPrice: 10;
            readonly cacheReadsPrice: 0.31;
        }, {
            readonly contextWindow: number;
            readonly inputPrice: 2.5;
            readonly outputPrice: 15;
            readonly cacheReadsPrice: 0.625;
        }];
    };
    readonly "gemini-2.5-pro-preview-06-05": {
        readonly maxTokens: 65535;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 2.5;
        readonly outputPrice: 15;
        readonly cacheReadsPrice: 0.625;
        readonly cacheWritesPrice: 4.5;
        readonly maxThinkingTokens: 32768;
        readonly supportsReasoningBudget: true;
        readonly tiers: [{
            readonly contextWindow: 200000;
            readonly inputPrice: 1.25;
            readonly outputPrice: 10;
            readonly cacheReadsPrice: 0.31;
        }, {
            readonly contextWindow: number;
            readonly inputPrice: 2.5;
            readonly outputPrice: 15;
            readonly cacheReadsPrice: 0.625;
        }];
    };
    readonly "gemini-2.5-pro": {
        readonly maxTokens: 64000;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 2.5;
        readonly outputPrice: 15;
        readonly cacheReadsPrice: 0.625;
        readonly cacheWritesPrice: 4.5;
        readonly maxThinkingTokens: 32768;
        readonly supportsReasoningBudget: true;
        readonly requiredReasoningBudget: true;
        readonly tiers: [{
            readonly contextWindow: 200000;
            readonly inputPrice: 1.25;
            readonly outputPrice: 10;
            readonly cacheReadsPrice: 0.31;
        }, {
            readonly contextWindow: number;
            readonly inputPrice: 2.5;
            readonly outputPrice: 15;
            readonly cacheReadsPrice: 0.625;
        }];
    };
    readonly "gemini-2.0-flash-001": {
        readonly maxTokens: 8192;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.1;
        readonly outputPrice: 0.4;
        readonly cacheReadsPrice: 0.025;
        readonly cacheWritesPrice: 1;
    };
    readonly "gemini-2.0-flash-lite-preview-02-05": {
        readonly maxTokens: 8192;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
    };
    readonly "gemini-2.0-pro-exp-02-05": {
        readonly maxTokens: 8192;
        readonly contextWindow: 2097152;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
    };
    readonly "gemini-2.0-flash-thinking-exp-01-21": {
        readonly maxTokens: 65536;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
    };
    readonly "gemini-2.0-flash-thinking-exp-1219": {
        readonly maxTokens: 8192;
        readonly contextWindow: 32767;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
    };
    readonly "gemini-2.0-flash-exp": {
        readonly maxTokens: 8192;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
    };
    readonly "gemini-1.5-flash-002": {
        readonly maxTokens: 8192;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.15;
        readonly outputPrice: 0.6;
        readonly cacheReadsPrice: 0.0375;
        readonly cacheWritesPrice: 1;
        readonly tiers: [{
            readonly contextWindow: 128000;
            readonly inputPrice: 0.075;
            readonly outputPrice: 0.3;
            readonly cacheReadsPrice: 0.01875;
        }, {
            readonly contextWindow: number;
            readonly inputPrice: 0.15;
            readonly outputPrice: 0.6;
            readonly cacheReadsPrice: 0.0375;
        }];
    };
    readonly "gemini-1.5-flash-exp-0827": {
        readonly maxTokens: 8192;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
    };
    readonly "gemini-1.5-flash-8b-exp-0827": {
        readonly maxTokens: 8192;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
    };
    readonly "gemini-1.5-pro-002": {
        readonly maxTokens: 8192;
        readonly contextWindow: 2097152;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
    };
    readonly "gemini-1.5-pro-exp-0827": {
        readonly maxTokens: 8192;
        readonly contextWindow: 2097152;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
    };
    readonly "gemini-exp-1206": {
        readonly maxTokens: 8192;
        readonly contextWindow: 2097152;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
    };
    readonly "gemini-2.5-flash-lite-preview-06-17": {
        readonly maxTokens: 64000;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.1;
        readonly outputPrice: 0.4;
        readonly cacheReadsPrice: 0.025;
        readonly cacheWritesPrice: 1;
        readonly supportsReasoningBudget: true;
        readonly maxThinkingTokens: 24576;
    };
    readonly "gemma-3-27b-it": {
        readonly maxTokens: 128000;
        readonly contextWindow: 128000;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
    };
};
//# sourceMappingURL=gemini.d.ts.map