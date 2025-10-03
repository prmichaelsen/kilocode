export type GroqModelId = "llama-3.1-8b-instant" | "llama-3.3-70b-versatile" | "meta-llama/llama-4-scout-17b-16e-instruct" | "meta-llama/llama-4-maverick-17b-128e-instruct" | "mistral-saba-24b" | "qwen-qwq-32b" | "qwen/qwen3-32b" | "deepseek-r1-distill-llama-70b" | "moonshotai/kimi-k2-instruct" | "moonshotai/kimi-k2-instruct-0905" | "openai/gpt-oss-120b" | "openai/gpt-oss-20b";
export declare const groqDefaultModelId: GroqModelId;
export declare const groqModels: {
    readonly "llama-3.1-8b-instant": {
        readonly maxTokens: 8192;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.05;
        readonly outputPrice: 0.08;
        readonly description: "Meta Llama 3.1 8B Instant model, 128K context.";
    };
    readonly "llama-3.3-70b-versatile": {
        readonly maxTokens: 8192;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.59;
        readonly outputPrice: 0.79;
        readonly description: "Meta Llama 3.3 70B Versatile model, 128K context.";
    };
    readonly "meta-llama/llama-4-scout-17b-16e-instruct": {
        readonly maxTokens: 8192;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.11;
        readonly outputPrice: 0.34;
        readonly description: "Meta Llama 4 Scout 17B Instruct model, 128K context.";
    };
    readonly "meta-llama/llama-4-maverick-17b-128e-instruct": {
        readonly maxTokens: 8192;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.2;
        readonly outputPrice: 0.6;
        readonly description: "Meta Llama 4 Maverick 17B Instruct model, 128K context.";
    };
    readonly "mistral-saba-24b": {
        readonly maxTokens: 8192;
        readonly contextWindow: 32768;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.79;
        readonly outputPrice: 0.79;
        readonly description: "Mistral Saba 24B model, 32K context.";
    };
    readonly "qwen-qwq-32b": {
        readonly maxTokens: 8192;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.29;
        readonly outputPrice: 0.39;
        readonly description: "Alibaba Qwen QwQ 32B model, 128K context.";
    };
    readonly "qwen/qwen3-32b": {
        readonly maxTokens: 8192;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.29;
        readonly outputPrice: 0.59;
        readonly description: "Alibaba Qwen 3 32B model, 128K context.";
    };
    readonly "deepseek-r1-distill-llama-70b": {
        readonly maxTokens: 8192;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.75;
        readonly outputPrice: 0.99;
        readonly description: "DeepSeek R1 Distill Llama 70B model, 128K context.";
    };
    readonly "moonshotai/kimi-k2-instruct": {
        readonly maxTokens: 16384;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly inputPrice: 1;
        readonly outputPrice: 3;
        readonly cacheReadsPrice: 0.5;
        readonly description: "Moonshot AI Kimi K2 Instruct 1T model, 128K context.";
    };
    readonly "moonshotai/kimi-k2-instruct-0905": {
        readonly maxTokens: 16384;
        readonly contextWindow: 262144;
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.6;
        readonly outputPrice: 2.5;
        readonly cacheReadsPrice: 0.15;
        readonly description: "Kimi K2 model gets a new version update: Agentic coding: more accurate, better generalization across scaffolds. Frontend coding: improved aesthetics and functionalities on web, 3d, and other tasks. Context length: extended from 128k to 256k, providing better long-horizon support.";
    };
    readonly "openai/gpt-oss-120b": {
        readonly maxTokens: 32766;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.15;
        readonly outputPrice: 0.75;
        readonly description: "GPT-OSS 120B is OpenAI's flagship open source model, built on a Mixture-of-Experts (MoE) architecture with 20 billion parameters and 128 experts.";
    };
    readonly "openai/gpt-oss-20b": {
        readonly maxTokens: 32768;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.1;
        readonly outputPrice: 0.5;
        readonly description: "GPT-OSS 20B is OpenAI's flagship open source model, built on a Mixture-of-Experts (MoE) architecture with 20 billion parameters and 32 experts.";
    };
};
//# sourceMappingURL=groq.d.ts.map