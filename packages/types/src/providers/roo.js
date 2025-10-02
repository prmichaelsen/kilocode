"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.rooModels = exports.rooDefaultModelId = void 0
exports.rooDefaultModelId = "xai/grok-code-fast-1"
exports.rooModels = {
	"xai/grok-code-fast-1": {
		maxTokens: 16384,
		contextWindow: 262144,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 0,
		outputPrice: 0,
		description:
			"A reasoning model that is blazing fast and excels at agentic coding, accessible for free through Roo Code Cloud for a limited time. (Note: the free prompts and completions are logged by xAI and used to improve the model.)",
	},
	"roo/code-supernova-1-million": {
		maxTokens: 30000,
		contextWindow: 1000000,
		supportsImages: true,
		supportsPromptCache: true,
		inputPrice: 0,
		outputPrice: 0,
		description:
			"A versatile agentic coding stealth model with a 1M token context window that supports image inputs, accessible for free through Roo Code Cloud for a limited time. (Note: the free prompts and completions are logged by the model provider and used to improve the model.)",
	},
	"xai/grok-4-fast": {
		maxTokens: 30000,
		contextWindow: 2000000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		description:
			"Grok 4 Fast is xAI's latest multimodal model with SOTA cost-efficiency and a 2M token context window. (Note: prompts and completions are logged by xAI and used to improve the model.)",
	},
	"deepseek/deepseek-chat-v3.1": {
		maxTokens: 16384,
		contextWindow: 163840,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		description:
			"DeepSeek-V3.1 is a large hybrid reasoning model (671B parameters, 37B active). It extends the DeepSeek-V3 base with a two-phase long-context training process, reaching up to 128K tokens, and uses FP8 microscaling for efficient inference.",
	},
}
//# sourceMappingURL=roo.js.map
