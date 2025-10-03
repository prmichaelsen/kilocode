export type GeminiCliModelId = keyof typeof geminiCliModels;
export declare const geminiCliDefaultModelId: GeminiCliModelId;
export declare const geminiCliModels: {
    readonly "gemini-2.0-flash-001": {
        readonly maxTokens: 8192;
        readonly contextWindow: 1048576;
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
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
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
    readonly "gemini-2.5-flash": {
        readonly maxTokens: 64000;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly maxThinkingTokens: 24576;
        readonly supportsReasoningBudget: true;
    };
    readonly "gemini-2.5-pro": {
        readonly maxTokens: 64000;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly maxThinkingTokens: 32768;
        readonly supportsReasoningBudget: true;
        readonly requiredReasoningBudget: true;
    };
};
//# sourceMappingURL=gemini-cli.d.ts.map