export type FireworksModelId = "accounts/fireworks/models/kimi-k2-instruct" | "accounts/fireworks/models/kimi-k2-instruct-0905" | "accounts/fireworks/models/qwen3-235b-a22b-instruct-2507" | "accounts/fireworks/models/qwen3-coder-480b-a35b-instruct" | "accounts/fireworks/models/deepseek-r1-0528" | "accounts/fireworks/models/deepseek-v3" | "accounts/fireworks/models/deepseek-v3p1" | "accounts/fireworks/models/glm-4p5" | "accounts/fireworks/models/glm-4p5-air" | "accounts/fireworks/models/gpt-oss-20b" | "accounts/fireworks/models/gpt-oss-120b";
export declare const fireworksDefaultModelId: FireworksModelId;
export declare const fireworksModels: {
    readonly "accounts/fireworks/models/kimi-k2-instruct-0905": {
        readonly maxTokens: 16384;
        readonly contextWindow: 262144;
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.6;
        readonly outputPrice: 2.5;
        readonly cacheReadsPrice: 0.15;
        readonly description: "Kimi K2 model gets a new version update: Agentic coding: more accurate, better generalization across scaffolds. Frontend coding: improved aesthetics and functionalities on web, 3d, and other tasks. Context length: extended from 128k to 256k, providing better long-horizon support.";
    };
    readonly "accounts/fireworks/models/kimi-k2-instruct": {
        readonly maxTokens: 16384;
        readonly contextWindow: 128000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.6;
        readonly outputPrice: 2.5;
        readonly description: "Kimi K2 is a state-of-the-art mixture-of-experts (MoE) language model with 32 billion activated parameters and 1 trillion total parameters. Trained with the Muon optimizer, Kimi K2 achieves exceptional performance across frontier knowledge, reasoning, and coding tasks while being meticulously optimized for agentic capabilities.";
    };
    readonly "accounts/fireworks/models/qwen3-235b-a22b-instruct-2507": {
        readonly maxTokens: 32768;
        readonly contextWindow: 256000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.22;
        readonly outputPrice: 0.88;
        readonly description: "Latest Qwen3 thinking model, competitive against the best closed source models in Jul 2025.";
    };
    readonly "accounts/fireworks/models/qwen3-coder-480b-a35b-instruct": {
        readonly maxTokens: 32768;
        readonly contextWindow: 256000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.45;
        readonly outputPrice: 1.8;
        readonly description: "Qwen3's most agentic code model to date.";
    };
    readonly "accounts/fireworks/models/deepseek-r1-0528": {
        readonly maxTokens: 20480;
        readonly contextWindow: 160000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 3;
        readonly outputPrice: 8;
        readonly description: "05/28 updated checkpoint of Deepseek R1. Its overall performance is now approaching that of leading models, such as O3 and Gemini 2.5 Pro. Compared to the previous version, the upgraded model shows significant improvements in handling complex reasoning tasks, and this version also offers a reduced hallucination rate, enhanced support for function calling, and better experience for vibe coding. Note that fine-tuning for this model is only available through contacting fireworks at https://fireworks.ai/company/contact-us.";
    };
    readonly "accounts/fireworks/models/deepseek-v3": {
        readonly maxTokens: 16384;
        readonly contextWindow: 128000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.9;
        readonly outputPrice: 0.9;
        readonly description: "A strong Mixture-of-Experts (MoE) language model with 671B total parameters with 37B activated for each token from Deepseek. Note that fine-tuning for this model is only available through contacting fireworks at https://fireworks.ai/company/contact-us.";
    };
    readonly "accounts/fireworks/models/deepseek-v3p1": {
        readonly maxTokens: 16384;
        readonly contextWindow: 163840;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.56;
        readonly outputPrice: 1.68;
        readonly description: "DeepSeek v3.1 is an improved version of the v3 model with enhanced performance, better reasoning capabilities, and improved code generation. This Mixture-of-Experts (MoE) model maintains the same 671B total parameters with 37B activated per token.";
    };
    readonly "accounts/fireworks/models/glm-4p5": {
        readonly maxTokens: 16384;
        readonly contextWindow: 128000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.55;
        readonly outputPrice: 2.19;
        readonly description: "Z.ai GLM-4.5 with 355B total parameters and 32B active parameters. Features unified reasoning, coding, and intelligent agent capabilities.";
    };
    readonly "accounts/fireworks/models/glm-4p5-air": {
        readonly maxTokens: 16384;
        readonly contextWindow: 128000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.55;
        readonly outputPrice: 2.19;
        readonly description: "Z.ai GLM-4.5-Air with 106B total parameters and 12B active parameters. Features unified reasoning, coding, and intelligent agent capabilities.";
    };
    readonly "accounts/fireworks/models/gpt-oss-20b": {
        readonly maxTokens: 16384;
        readonly contextWindow: 128000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.07;
        readonly outputPrice: 0.3;
        readonly description: "OpenAI gpt-oss-20b: Compact model for local/edge deployments. Optimized for low-latency and resource-constrained environments with chain-of-thought output, adjustable reasoning, and agentic workflows.";
    };
    readonly "accounts/fireworks/models/gpt-oss-120b": {
        readonly maxTokens: 16384;
        readonly contextWindow: 128000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.15;
        readonly outputPrice: 0.6;
        readonly description: "OpenAI gpt-oss-120b: Production-grade, general-purpose model that fits on a single H100 GPU. Features complex reasoning, configurable effort, full chain-of-thought transparency, and supports function calling, tool use, and structured outputs.";
    };
};
//# sourceMappingURL=fireworks.d.ts.map