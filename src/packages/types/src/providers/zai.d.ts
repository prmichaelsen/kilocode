export type InternationalZAiModelId = keyof typeof internationalZAiModels;
export declare const internationalZAiDefaultModelId: InternationalZAiModelId;
export declare const internationalZAiModels: {
    readonly "glm-4.6": {
        readonly maxTokens: 131072;
        readonly contextWindow: 204800;
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.6;
        readonly outputPrice: 2.2;
        readonly cacheWritesPrice: 0;
        readonly cacheReadsPrice: 0.11;
        readonly description: "GLM-4.6 is Zhipu's latest SOTA models for reasoning, code, and agentsUpgraded across 8 authoritative benchmarks. With a 355B-parameter MoE architecture and 200K context, it surpasses GLM-4.5 in coding, reasoning, search, writing, and agent applications.";
    };
    readonly "glm-4.5": {
        readonly maxTokens: 98304;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.6;
        readonly outputPrice: 2.2;
        readonly cacheWritesPrice: 0;
        readonly cacheReadsPrice: 0.11;
        readonly description: "Zhipu's previous flagship model.";
    };
    readonly "glm-4.5-air": {
        readonly maxTokens: 98304;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.2;
        readonly outputPrice: 1.1;
        readonly cacheWritesPrice: 0;
        readonly cacheReadsPrice: 0.03;
        readonly description: "GLM-4.5-Air is the lightweight version of GLM-4.5. It balances performance and cost-effectiveness, and can flexibly switch to hybrid thinking models.";
    };
    readonly "glm-4.5-flash": {
        readonly maxTokens: 98304;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly cacheWritesPrice: 0;
        readonly cacheReadsPrice: 0;
        readonly description: "Zhipu's most advanced free model to date.";
    };
};
export type MainlandZAiModelId = keyof typeof mainlandZAiModels;
export declare const mainlandZAiDefaultModelId: MainlandZAiModelId;
export declare const mainlandZAiModels: {
    readonly "glm-4.6": {
        readonly maxTokens: 131072;
        readonly contextWindow: 204800;
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.29;
        readonly outputPrice: 1.14;
        readonly cacheWritesPrice: 0;
        readonly cacheReadsPrice: 0.057;
        readonly description: "GLM-4.6 is Zhipu's latest SOTA models for reasoning, code, and agentsUpgraded across 8 authoritative benchmarks. With a 355B-parameter MoE architecture and 200K context, it surpasses GLM-4.5 in coding, reasoning, search, writing, and agent applications.";
        readonly tiers: [{
            readonly contextWindow: 32000;
            readonly inputPrice: 0.21;
            readonly outputPrice: 1;
            readonly cacheReadsPrice: 0.043;
        }, {
            readonly contextWindow: 200000;
            readonly inputPrice: 0.29;
            readonly outputPrice: 1.14;
            readonly cacheReadsPrice: 0.057;
        }, {
            readonly contextWindow: number;
            readonly inputPrice: 0.29;
            readonly outputPrice: 1.14;
            readonly cacheReadsPrice: 0.057;
        }];
    };
    readonly "glm-4.5": {
        readonly maxTokens: 98304;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.29;
        readonly outputPrice: 1.14;
        readonly cacheWritesPrice: 0;
        readonly cacheReadsPrice: 0.057;
        readonly description: "Zhipu's previous flagship model.";
        readonly tiers: [{
            readonly contextWindow: 32000;
            readonly inputPrice: 0.21;
            readonly outputPrice: 1;
            readonly cacheReadsPrice: 0.043;
        }, {
            readonly contextWindow: 128000;
            readonly inputPrice: 0.29;
            readonly outputPrice: 1.14;
            readonly cacheReadsPrice: 0.057;
        }, {
            readonly contextWindow: number;
            readonly inputPrice: 0.29;
            readonly outputPrice: 1.14;
            readonly cacheReadsPrice: 0.057;
        }];
    };
    readonly "glm-4.5-air": {
        readonly maxTokens: 98304;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0.1;
        readonly outputPrice: 0.6;
        readonly cacheWritesPrice: 0;
        readonly cacheReadsPrice: 0.02;
        readonly description: "GLM-4.5-Air is the lightweight version of GLM-4.5. It balances performance and cost-effectiveness, and can flexibly switch to hybrid thinking models.";
        readonly tiers: [{
            readonly contextWindow: 32000;
            readonly inputPrice: 0.07;
            readonly outputPrice: 0.4;
            readonly cacheReadsPrice: 0.014;
        }, {
            readonly contextWindow: 128000;
            readonly inputPrice: 0.1;
            readonly outputPrice: 0.6;
            readonly cacheReadsPrice: 0.02;
        }, {
            readonly contextWindow: number;
            readonly inputPrice: 0.1;
            readonly outputPrice: 0.6;
            readonly cacheReadsPrice: 0.02;
        }];
    };
    readonly "glm-4.5-flash": {
        readonly maxTokens: 98304;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly cacheWritesPrice: 0;
        readonly cacheReadsPrice: 0;
        readonly description: "Zhipu's most advanced free model to date.";
    };
};
export declare const ZAI_DEFAULT_TEMPERATURE = 0;
export declare const zaiApiLineConfigs: {
    international_coding: {
        name: string;
        baseUrl: string;
        isChina: false;
    };
    international: {
        name: string;
        baseUrl: string;
        isChina: false;
    };
    china_coding: {
        name: string;
        baseUrl: string;
        isChina: true;
    };
    china: {
        name: string;
        baseUrl: string;
        isChina: true;
    };
};
//# sourceMappingURL=zai.d.ts.map