export type ChutesModelId = "deepseek-ai/DeepSeek-R1-0528" | "deepseek-ai/DeepSeek-R1" | "deepseek-ai/DeepSeek-V3" | "deepseek-ai/DeepSeek-V3.1" | "unsloth/Llama-3.3-70B-Instruct" | "chutesai/Llama-4-Scout-17B-16E-Instruct" | "unsloth/Mistral-Nemo-Instruct-2407" | "unsloth/gemma-3-12b-it" | "NousResearch/DeepHermes-3-Llama-3-8B-Preview" | "unsloth/gemma-3-4b-it" | "nvidia/Llama-3_3-Nemotron-Super-49B-v1" | "nvidia/Llama-3_1-Nemotron-Ultra-253B-v1" | "chutesai/Llama-4-Maverick-17B-128E-Instruct-FP8" | "deepseek-ai/DeepSeek-V3-Base" | "deepseek-ai/DeepSeek-R1-Zero" | "deepseek-ai/DeepSeek-V3-0324" | "deepseek-ai/DeepSeek-V3.1-Terminus" | "deepseek-ai/DeepSeek-V3.1-turbo" | "deepseek-ai/DeepSeek-V3-0324-turbo" | "Qwen/Qwen3-235B-A22B" | "Qwen/Qwen3-235B-A22B-Instruct-2507" | "Qwen/Qwen3-32B" | "Qwen/Qwen3-30B-A3B" | "Qwen/Qwen3-14B" | "Qwen/Qwen3-8B" | "Qwen/Qwen3-VL-235B-A22B-Thinking" | "Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8" | "microsoft/MAI-DS-R1-FP8" | "tngtech/DeepSeek-R1T-Chimera" | "zai-org/GLM-4.5-Air" | "zai-org/GLM-4.5-FP8" | "zai-org/GLM-4.6-FP8" | "zai-org/GLM-4.5V" | "zai-org/GLM-4.5-turbo" | "moonshotai/Kimi-K2-Instruct-75k" | "moonshotai/Kimi-K2-Instruct-0905" | "moonshotai/Kimi-Dev-72B" | "moonshotai/Kimi-VL-A3B-Thinking" | "Qwen/Qwen3-235B-A22B-Thinking-2507" | "Qwen/Qwen3-Next-80B-A3B-Instruct" | "Qwen/Qwen3-Next-80B-A3B-Thinking";
export declare const chutesDefaultModelId: ChutesModelId;
export declare const chutesModels: {
    readonly "deepseek-ai/DeepSeek-R1-0528": {
        readonly maxTokens: 32768;
        readonly contextWindow: 163840;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "DeepSeek R1 0528 model.";
    };
    readonly "deepseek-ai/DeepSeek-R1": {
        readonly maxTokens: 32768;
        readonly contextWindow: 163840;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "DeepSeek R1 model.";
    };
    readonly "deepseek-ai/DeepSeek-V3": {
        readonly maxTokens: 32768;
        readonly contextWindow: 163840;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "DeepSeek V3 model.";
    };
    readonly "deepseek-ai/DeepSeek-V3.1": {
        readonly maxTokens: 32768;
        readonly contextWindow: 163840;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "DeepSeek V3.1 model.";
    };
    readonly "unsloth/Llama-3.3-70B-Instruct": {
        readonly maxTokens: 32768;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Unsloth Llama 3.3 70B Instruct model.";
    };
    readonly "chutesai/Llama-4-Scout-17B-16E-Instruct": {
        readonly maxTokens: 32768;
        readonly contextWindow: 512000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "ChutesAI Llama 4 Scout 17B Instruct model, 512K context.";
    };
    readonly "unsloth/Mistral-Nemo-Instruct-2407": {
        readonly maxTokens: 32768;
        readonly contextWindow: 128000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Unsloth Mistral Nemo Instruct model.";
    };
    readonly "unsloth/gemma-3-12b-it": {
        readonly maxTokens: 32768;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Unsloth Gemma 3 12B IT model.";
    };
    readonly "NousResearch/DeepHermes-3-Llama-3-8B-Preview": {
        readonly maxTokens: 32768;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Nous DeepHermes 3 Llama 3 8B Preview model.";
    };
    readonly "unsloth/gemma-3-4b-it": {
        readonly maxTokens: 32768;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Unsloth Gemma 3 4B IT model.";
    };
    readonly "nvidia/Llama-3_3-Nemotron-Super-49B-v1": {
        readonly maxTokens: 32768;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Nvidia Llama 3.3 Nemotron Super 49B model.";
    };
    readonly "nvidia/Llama-3_1-Nemotron-Ultra-253B-v1": {
        readonly maxTokens: 32768;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Nvidia Llama 3.1 Nemotron Ultra 253B model.";
    };
    readonly "chutesai/Llama-4-Maverick-17B-128E-Instruct-FP8": {
        readonly maxTokens: 32768;
        readonly contextWindow: 256000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "ChutesAI Llama 4 Maverick 17B Instruct FP8 model.";
    };
    readonly "deepseek-ai/DeepSeek-V3-Base": {
        readonly maxTokens: 32768;
        readonly contextWindow: 163840;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "DeepSeek V3 Base model.";
    };
    readonly "deepseek-ai/DeepSeek-R1-Zero": {
        readonly maxTokens: 32768;
        readonly contextWindow: 163840;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "DeepSeek R1 Zero model.";
    };
    readonly "deepseek-ai/DeepSeek-V3-0324": {
        readonly maxTokens: 32768;
        readonly contextWindow: 163840;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "DeepSeek V3 (0324) model.";
    };
    readonly "deepseek-ai/DeepSeek-V3.1-Terminus": {
        readonly maxTokens: 163840;
        readonly contextWindow: 163840;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.25;
        readonly outputPrice: 1;
        readonly description: "DeepSeek V3.1 Terminus model.";
    };
    readonly "deepseek-ai/DeepSeek-V3.1-turbo": {
        readonly maxTokens: 32768;
        readonly contextWindow: 163840;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 1;
        readonly outputPrice: 3;
        readonly description: "DeepSeek V3.1 Turbo model.";
    };
    readonly "deepseek-ai/DeepSeek-V3-0324-turbo": {
        readonly maxTokens: 32768;
        readonly contextWindow: 163840;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 1;
        readonly outputPrice: 3;
        readonly description: "DeepSeek V3 (0324) Turbo model.";
    };
    readonly "Qwen/Qwen3-235B-A22B-Instruct-2507": {
        readonly maxTokens: 32768;
        readonly contextWindow: 262144;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Qwen3 235B A22B Instruct 2507 model with 262K context window.";
    };
    readonly "Qwen/Qwen3-235B-A22B": {
        readonly maxTokens: 32768;
        readonly contextWindow: 40960;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Qwen3 235B A22B model.";
    };
    readonly "Qwen/Qwen3-32B": {
        readonly maxTokens: 32768;
        readonly contextWindow: 40960;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Qwen3 32B model.";
    };
    readonly "Qwen/Qwen3-30B-A3B": {
        readonly maxTokens: 32768;
        readonly contextWindow: 40960;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Qwen3 30B A3B model.";
    };
    readonly "Qwen/Qwen3-14B": {
        readonly maxTokens: 32768;
        readonly contextWindow: 40960;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Qwen3 14B model.";
    };
    readonly "Qwen/Qwen3-8B": {
        readonly maxTokens: 32768;
        readonly contextWindow: 40960;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Qwen3 8B model.";
    };
    readonly "Qwen/Qwen3-VL-235B-A22B-Thinking": {
        readonly maxTokens: 262144;
        readonly contextWindow: 262144;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.16;
        readonly outputPrice: 0.65;
        readonly description: "Qwen3-VL-235B-A22B-Thinking.";
    };
    readonly "microsoft/MAI-DS-R1-FP8": {
        readonly maxTokens: 32768;
        readonly contextWindow: 163840;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Microsoft MAI-DS-R1 FP8 model.";
    };
    readonly "tngtech/DeepSeek-R1T-Chimera": {
        readonly maxTokens: 32768;
        readonly contextWindow: 163840;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "TNGTech DeepSeek R1T Chimera model.";
    };
    readonly "zai-org/GLM-4.5-Air": {
        readonly maxTokens: 32768;
        readonly contextWindow: 151329;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "GLM-4.5-Air model with 151,329 token context window and 106B total parameters with 12B activated.";
    };
    readonly "zai-org/GLM-4.5-FP8": {
        readonly maxTokens: 32768;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "GLM-4.5-FP8 model with 128k token context window, optimized for agent-based applications with MoE architecture.";
    };
    readonly "zai-org/GLM-4.6-FP8": {
        readonly maxTokens: 32768;
        readonly contextWindow: 202752;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "GLM-4.6 introduces major upgrades over GLM-4.5, including a longer 200K-token context window for complex tasks, stronger coding performance in benchmarks and real-world tools (such as Claude Code, Cline, Roo Code, and Kilo Code), improved reasoning with tool use during inference, more capable and efficient agent integration, and refined writing that better matches human style, readability, and natural role-play scenarios.";
    };
    readonly "zai-org/GLM-4.5-turbo": {
        readonly maxTokens: 32768;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 1;
        readonly outputPrice: 3;
        readonly description: "GLM-4.5-turbo model with 128K token context window, optimized for fast inference.";
    };
    readonly "zai-org/GLM-4.5V": {
        readonly maxTokens: 32768;
        readonly contextWindow: 131072;
        readonly supportsImages: true;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.08;
        readonly outputPrice: 0.33;
        readonly description: "GLM-4.5V model.";
    };
    readonly "Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8": {
        readonly maxTokens: 32768;
        readonly contextWindow: 262144;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Qwen3 Coder 480B A35B Instruct FP8 model, optimized for coding tasks.";
    };
    readonly "moonshotai/Kimi-K2-Instruct-75k": {
        readonly maxTokens: 32768;
        readonly contextWindow: 75000;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.1481;
        readonly outputPrice: 0.5926;
        readonly description: "Moonshot AI Kimi K2 Instruct model with 75k context window.";
    };
    readonly "moonshotai/Kimi-K2-Instruct-0905": {
        readonly maxTokens: 32768;
        readonly contextWindow: 262144;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.1999;
        readonly outputPrice: 0.8001;
        readonly description: "Moonshot AI Kimi K2 Instruct 0905 model with 256k context window.";
    };
    readonly "moonshotai/Kimi-Dev-72B": {
        readonly maxTokens: 32768;
        readonly contextWindow: 262144;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.07;
        readonly outputPrice: 0.26;
        readonly description: "Moonshot AI Kimi Dev 72B model.";
    };
    readonly "moonshotai/Kimi-VL-A3B-Thinking": {
        readonly maxTokens: 32768;
        readonly contextWindow: 262144;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.02;
        readonly outputPrice: 0.07;
        readonly description: "Moonshot AI Kimi VL A3B Thinking model.";
    };
    readonly "Qwen/Qwen3-235B-A22B-Thinking-2507": {
        readonly maxTokens: 32768;
        readonly contextWindow: 262144;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0.077968332;
        readonly outputPrice: 0.31202496;
        readonly description: "Qwen3 235B A22B Thinking 2507 model with 262K context window.";
    };
    readonly "Qwen/Qwen3-Next-80B-A3B-Instruct": {
        readonly maxTokens: 32768;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Fast, stable instruction-tuned model optimized for complex tasks, RAG, and tool use without thinking traces.";
    };
    readonly "Qwen/Qwen3-Next-80B-A3B-Thinking": {
        readonly maxTokens: 32768;
        readonly contextWindow: 131072;
        readonly supportsImages: false;
        readonly supportsPromptCache: false;
        readonly inputPrice: 0;
        readonly outputPrice: 0;
        readonly description: "Reasoning-first model with structured thinking traces for multi-step problems, math proofs, and code synthesis.";
    };
};
//# sourceMappingURL=chutes.d.ts.map