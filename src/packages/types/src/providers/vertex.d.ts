export type VertexModelId = keyof typeof vertexModels;
export declare const vertexDefaultModelId: VertexModelId;
export declare const vertexModels: {
    readonly "claude-4.5-sonnet": {
        readonly maxTokens: 8192;
        readonly contextWindow: 200000;
        readonly supportsImages: true;
        readonly supportsComputerUse: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 3;
        readonly outputPrice: 15;
        readonly cacheWritesPrice: 3.75;
        readonly cacheReadsPrice: 0.3;
        readonly supportsReasoningBudget: true;
    };
    readonly "gemini-2.5-flash-preview-05-20:thinking": {
        readonly maxTokens: 65535;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.15;
        readonly outputPrice: 3.5;
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
    readonly "gemini-2.5-pro-preview-03-25": {
        readonly maxTokens: 65535;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 2.5;
        readonly outputPrice: 15;
    };
    readonly "gemini-2.5-pro-preview-05-06": {
        readonly maxTokens: 65535;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 2.5;
        readonly outputPrice: 15;
    };
    readonly "gemini-2.5-pro-preview-06-05": {
        readonly maxTokens: 65535;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 2.5;
        readonly outputPrice: 15;
        readonly maxThinkingTokens: 32768;
        readonly supportsReasoningBudget: true;
    };
    readonly "gemini-2.5-pro": {
        readonly maxTokens: 64000;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 2.5;
        readonly outputPrice: 15;
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
    readonly "gemini-2.5-pro-exp-03-25": {
        readonly maxTokens: 65535;
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
    readonly "gemini-2.0-flash-001": {
        readonly maxTokens: 8192;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.15;
        readonly outputPrice: 0.6;
    };
    readonly "gemini-2.0-flash-lite-001": {
        readonly maxTokens: 8192;
        readonly contextWindow: 1048576;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.075;
        readonly outputPrice: 0.3;
    };
    readonly "gemini-2.0-flash-thinking-exp-01-21": {
        readonly maxTokens: 8192;
        readonly contextWindow: 32768;
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
        readonly inputPrice: 0.075;
        readonly outputPrice: 0.3;
    };
    readonly "gemini-1.5-pro-002": {
        readonly maxTokens: 8192;
        readonly contextWindow: 2097152;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 1.25;
        readonly outputPrice: 5;
    };
    readonly "claude-sonnet-4@20250514": {
        readonly maxTokens: 8192;
        readonly contextWindow: 200000;
        readonly supportsImages: true;
        readonly supportsComputerUse: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 3;
        readonly outputPrice: 15;
        readonly cacheWritesPrice: 3.75;
        readonly cacheReadsPrice: 0.3;
        readonly supportsReasoningBudget: true;
    };
    readonly "claude-sonnet-4-5@20250929": {
        readonly maxTokens: 8192;
        readonly contextWindow: 200000;
        readonly supportsImages: true;
        readonly supportsComputerUse: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 3;
        readonly outputPrice: 15;
        readonly cacheWritesPrice: 3.75;
        readonly cacheReadsPrice: 0.3;
        readonly supportsReasoningBudget: true;
    };
    readonly "claude-opus-4-1@20250805": {
        readonly maxTokens: 8192;
        readonly contextWindow: 200000;
        readonly supportsImages: true;
        readonly supportsComputerUse: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 15;
        readonly outputPrice: 75;
        readonly cacheWritesPrice: 18.75;
        readonly cacheReadsPrice: 1.5;
        readonly supportsReasoningBudget: true;
    };
    readonly "claude-opus-4@20250514": {
        readonly maxTokens: 8192;
        readonly contextWindow: 200000;
        readonly supportsImages: true;
        readonly supportsComputerUse: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 15;
        readonly outputPrice: 75;
        readonly cacheWritesPrice: 18.75;
        readonly cacheReadsPrice: 1.5;
    };
    readonly "claude-3-7-sonnet@20250219:thinking": {
        readonly maxTokens: 64000;
        readonly contextWindow: 200000;
        readonly supportsImages: true;
        readonly supportsComputerUse: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 3;
        readonly outputPrice: 15;
        readonly cacheWritesPrice: 3.75;
        readonly cacheReadsPrice: 0.3;
        readonly supportsReasoningBudget: true;
        readonly requiredReasoningBudget: true;
    };
    readonly "claude-3-7-sonnet@20250219": {
        readonly maxTokens: 8192;
        readonly contextWindow: 200000;
        readonly supportsImages: true;
        readonly supportsComputerUse: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 3;
        readonly outputPrice: 15;
        readonly cacheWritesPrice: 3.75;
        readonly cacheReadsPrice: 0.3;
    };
    readonly "claude-3-5-sonnet-v2@20241022": {
        readonly maxTokens: 8192;
        readonly contextWindow: 200000;
        readonly supportsImages: true;
        readonly supportsComputerUse: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 3;
        readonly outputPrice: 15;
        readonly cacheWritesPrice: 3.75;
        readonly cacheReadsPrice: 0.3;
    };
    readonly "claude-3-5-sonnet@20240620": {
        readonly maxTokens: 8192;
        readonly contextWindow: 200000;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 3;
        readonly outputPrice: 15;
        readonly cacheWritesPrice: 3.75;
        readonly cacheReadsPrice: 0.3;
    };
    readonly "claude-3-5-haiku@20241022": {
        readonly maxTokens: 8192;
        readonly contextWindow: 200000;
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly inputPrice: 1;
        readonly outputPrice: 5;
        readonly cacheWritesPrice: 1.25;
        readonly cacheReadsPrice: 0.1;
    };
    readonly "claude-3-opus@20240229": {
        readonly maxTokens: 4096;
        readonly contextWindow: 200000;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 15;
        readonly outputPrice: 75;
        readonly cacheWritesPrice: 18.75;
        readonly cacheReadsPrice: 1.5;
    };
    readonly "claude-3-haiku@20240307": {
        readonly maxTokens: 4096;
        readonly contextWindow: 200000;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.25;
        readonly outputPrice: 1.25;
        readonly cacheWritesPrice: 0.3;
        readonly cacheReadsPrice: 0.03;
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
        readonly maxThinkingTokens: 24576;
        readonly supportsReasoningBudget: true;
    };
    readonly "llama-4-maverick-17b-128e-instruct-maas": {
        readonly maxTokens: 8192;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.35;
        readonly outputPrice: 1.15;
        readonly description: "Meta Llama 4 Maverick 17B Instruct model, 128K context.";
    };
    readonly "deepseek-r1-0528-maas": {
        readonly maxTokens: 32768;
        readonly contextWindow: 163840;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 1.35;
        readonly outputPrice: 5.4;
        readonly description: "DeepSeek R1 (0528). Available in us-central1";
    };
    readonly "deepseek-v3.1-maas": {
        readonly maxTokens: 32768;
        readonly contextWindow: 163840;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.6;
        readonly outputPrice: 1.7;
        readonly description: "DeepSeek V3.1. Available in us-west2";
    };
    readonly "gpt-oss-120b-maas": {
        readonly maxTokens: 32768;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.15;
        readonly outputPrice: 0.6;
        readonly description: "OpenAI gpt-oss 120B. Available in us-central1";
    };
    readonly "gpt-oss-20b-maas": {
        readonly maxTokens: 32768;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.075;
        readonly outputPrice: 0.3;
        readonly description: "OpenAI gpt-oss 20B. Available in us-central1";
    };
    readonly "qwen3-coder-480b-a35b-instruct-maas": {
        readonly maxTokens: 32768;
        readonly contextWindow: 262144;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 1;
        readonly outputPrice: 4;
        readonly description: "Qwen3 Coder 480B A35B Instruct. Available in us-south1";
    };
    readonly "qwen3-235b-a22b-instruct-2507-maas": {
        readonly maxTokens: 16384;
        readonly contextWindow: 262144;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.25;
        readonly outputPrice: 1;
        readonly description: "Qwen3 235B A22B Instruct. Available in us-south1";
    };
};
export declare const VERTEX_REGIONS: {
    value: string;
    label: string;
}[];
//# sourceMappingURL=vertex.d.ts.map