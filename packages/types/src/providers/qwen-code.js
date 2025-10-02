"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.qwenCodeModels = exports.qwenCodeDefaultModelId = void 0
exports.qwenCodeDefaultModelId = "qwen3-coder-plus"
exports.qwenCodeModels = {
	"qwen3-coder-plus": {
		maxTokens: 65536,
		contextWindow: 1000000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		cacheWritesPrice: 0,
		cacheReadsPrice: 0,
		description: "Qwen3 Coder Plus - High-performance coding model with 1M context window for large codebases",
	},
	"qwen3-coder-flash": {
		maxTokens: 65536,
		contextWindow: 1000000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		cacheWritesPrice: 0,
		cacheReadsPrice: 0,
		description: "Qwen3 Coder Flash - Fast coding model with 1M context window optimized for speed",
	},
}
//# sourceMappingURL=qwen-code.js.map
