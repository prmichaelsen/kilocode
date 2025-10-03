export type RooModelId = "xai/grok-code-fast-1" | "roo/code-supernova-1-million" | "xai/grok-4-fast" | "deepseek/deepseek-chat-v3.1";
export declare const rooDefaultModelId: RooModelId;
export declare const rooModels: {
    readonly "xai/grok-code-fast-1": {
        readonly maxTokens: 16384;
        readonly contextWindow: 262144;
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "A reasoning model that is blazing fast and excels at agentic coding, accessible for free through Roo Code Cloud for a limited time. (Note: the free prompts and completions are logged by xAI and used to improve the model.)";
    };
    readonly "roo/code-supernova-1-million": {
        readonly maxTokens: 30000;
        readonly contextWindow: 1000000;
        readonly supportsImages: true;
        readonly supportsPromptCache: true;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "A versatile agentic coding stealth model with a 1M token context window that supports image inputs, accessible for free through Roo Code Cloud for a limited time. (Note: the free prompts and completions are logged by the model provider and used to improve the model.)";
    };
    readonly "xai/grok-4-fast": {
        readonly maxTokens: 30000;
        readonly contextWindow: 2000000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Grok 4 Fast is xAI's latest multimodal model with SOTA cost-efficiency and a 2M token context window. (Note: prompts and completions are logged by xAI and used to improve the model.)";
    };
    readonly "deepseek/deepseek-chat-v3.1": {
        readonly maxTokens: 16384;
        readonly contextWindow: 163840;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "DeepSeek-V3.1 is a large hybrid reasoning model (671B parameters, 37B active). It extends the DeepSeek-V3 base with a two-phase long-context training process, reaching up to 128K tokens, and uses FP8 microscaling for efficient inference.";
    };
};
//# sourceMappingURL=roo.d.ts.map