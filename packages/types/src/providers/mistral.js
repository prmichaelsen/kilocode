"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.MISTRAL_DEFAULT_TEMPERATURE = exports.mistralModels = exports.mistralDefaultModelId = void 0
exports.mistralDefaultModelId = "codestral-latest"
exports.mistralModels = {
	"magistral-medium-latest": {
		maxTokens: 41000,
		contextWindow: 41000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 2.0,
		outputPrice: 5.0,
	},
	"devstral-medium-latest": {
		maxTokens: 131000,
		contextWindow: 131000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0.4,
		outputPrice: 2.0,
	},
	"mistral-medium-latest": {
		maxTokens: 131000,
		contextWindow: 131000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 0.4,
		outputPrice: 2.0,
	},
	"codestral-latest": {
		maxTokens: 256000,
		contextWindow: 256000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0.3,
		outputPrice: 0.9,
	},
	"mistral-large-latest": {
		maxTokens: 131000,
		contextWindow: 131000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 2.0,
		outputPrice: 6.0,
	},
	"ministral-8b-latest": {
		maxTokens: 131000,
		contextWindow: 131000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0.1,
		outputPrice: 0.1,
	},
	"ministral-3b-latest": {
		maxTokens: 131000,
		contextWindow: 131000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0.04,
		outputPrice: 0.04,
	},
	"mistral-small-latest": {
		maxTokens: 32000,
		contextWindow: 32000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0.2,
		outputPrice: 0.6,
	},
	//kilocode_change
	"magistral-small-latest": {
		maxTokens: 40960,
		contextWindow: 40960,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0.5,
		outputPrice: 1.5,
	},
	"devstral-small-latest": {
		maxTokens: 131000,
		contextWindow: 131000,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0.1,
		outputPrice: 0.3,
	},
	// kilocode_change end
	"pixtral-large-latest": {
		maxTokens: 131000,
		contextWindow: 131000,
		supportsImages: true,
		supportsPromptCache: false,
		inputPrice: 2.0,
		outputPrice: 6.0,
	},
}
exports.MISTRAL_DEFAULT_TEMPERATURE = 0
//# sourceMappingURL=mistral.js.map
