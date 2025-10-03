export type IOIntelligenceModelId = "deepseek-ai/DeepSeek-R1-0528" | "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8" | "Intel/Qwen3-Coder-480B-A35B-Instruct-int4-mixed-ar" | "openai/gpt-oss-120b";
export declare const ioIntelligenceDefaultModelId: IOIntelligenceModelId;
export declare const ioIntelligenceDefaultBaseUrl = "https://api.intelligence.io.solutions/api/v1";
export declare const IO_INTELLIGENCE_CACHE_DURATION: number;
export declare const ioIntelligenceModels: {
    readonly "deepseek-ai/DeepSeek-R1-0528": {
        readonly maxTokens: 8192;
        readonly contextWindow: 128000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly description: "DeepSeek R1 reasoning model";
    };
    readonly "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8": {
        readonly maxTokens: 8192;
        readonly contextWindow: 430000;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly description: "Llama 4 Maverick 17B model";
    };
    readonly "Intel/Qwen3-Coder-480B-A35B-Instruct-int4-mixed-ar": {
        readonly maxTokens: 8192;
        readonly contextWindow: 106000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly description: "Qwen3 Coder 480B specialized for coding";
    };
    readonly "openai/gpt-oss-120b": {
        readonly maxTokens: 8192;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly description: "OpenAI GPT-OSS 120B model";
    };
};
//# sourceMappingURL=io-intelligence.d.ts.map