export type CerebrasModelId = keyof typeof cerebrasModels;
export declare const cerebrasDefaultModelId: CerebrasModelId;
export declare const cerebrasModels: {
    readonly "qwen-3-coder-480b-free": {
        readonly maxTokens: 40000;
        readonly contextWindow: 64000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "SOTA coding model with ~2000 tokens/s ($0 free tier)\n\n• Use this if you don't have a Cerebras subscription\n• 64K context window\n• Rate limits: 150K TPM, 1M TPH/TPD, 10 RPM, 100 RPH/RPD\n\nUpgrade for higher limits: [https://cloud.cerebras.ai/?utm=roocode](https://cloud.cerebras.ai/?utm=roocode)";
    };
    readonly "qwen-3-coder-480b": {
        readonly maxTokens: 40000;
        readonly contextWindow: 128000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "SOTA coding model with ~2000 tokens/s ($50/$250 paid tiers)\n\n• Use this if you have a Cerebras subscription\n• 131K context window with higher rate limits";
    };
    readonly "qwen-3-235b-a22b-instruct-2507": {
        readonly maxTokens: 64000;
        readonly contextWindow: 64000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Intelligent model with ~1400 tokens/s";
    };
    readonly "llama-3.3-70b": {
        readonly maxTokens: 64000;
        readonly contextWindow: 64000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Powerful model with ~2600 tokens/s";
    };
    readonly "qwen-3-32b": {
        readonly maxTokens: 64000;
        readonly contextWindow: 64000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "SOTA coding performance with ~2500 tokens/s";
    };
    readonly "qwen-3-235b-a22b-thinking-2507": {
        readonly maxTokens: 40000;
        readonly contextWindow: 65000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "SOTA performance with ~1500 tokens/s";
        readonly supportsReasoningEffort: true;
    };
    readonly "gpt-oss-120b": {
        readonly maxTokens: 8000;
        readonly contextWindow: 64000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "OpenAI GPT OSS model with ~2800 tokens/s\n\n• 64K context window\n• Excels at efficient reasoning across science, math, and coding";
    };
};
//# sourceMappingURL=cerebras.d.ts.map