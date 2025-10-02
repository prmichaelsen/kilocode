"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.zaiApiLineConfigs =
	exports.ZAI_DEFAULT_TEMPERATURE =
	exports.mainlandZAiModels =
	exports.mainlandZAiDefaultModelId =
	exports.internationalZAiModels =
	exports.internationalZAiDefaultModelId =
		void 0
exports.internationalZAiDefaultModelId = "glm-4.6" // kilocode_change: overwrite the entire file on merge conflicts
exports.internationalZAiModels = {
	// kilocode_change start: overwrite the entire file on merge conflicts
	"glm-4.6": {
		maxTokens: 131072,
		contextWindow: 204800,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 0.6,
		outputPrice: 2.2,
		cacheWritesPrice: 0,
		cacheReadsPrice: 0.11,
		description:
			"GLM-4.6 is Zhipu's latest SOTA models for reasoning, code, and agentsUpgraded across 8 authoritative benchmarks. With a 355B-parameter MoE architecture and 200K context, it surpasses GLM-4.5 in coding, reasoning, search, writing, and agent applications.",
	},
	// kilocode_change end
	"glm-4.5": {
		maxTokens: 98304,
		contextWindow: 131072,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 0.6,
		outputPrice: 2.2,
		cacheWritesPrice: 0,
		cacheReadsPrice: 0.11,
		description: "Zhipu's previous flagship model.", // kilocode_change: overwrite the entire file on merge conflicts
	},
	"glm-4.5-air": {
		maxTokens: 98304,
		contextWindow: 131072,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 0.2,
		outputPrice: 1.1,
		cacheWritesPrice: 0,
		cacheReadsPrice: 0.03,
		description:
			"GLM-4.5-Air is the lightweight version of GLM-4.5. It balances performance and cost-effectiveness, and can flexibly switch to hybrid thinking models.",
	},
	"glm-4.5-flash": {
		maxTokens: 98304,
		contextWindow: 131072,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		cacheWritesPrice: 0,
		cacheReadsPrice: 0,
		description: "Zhipu's most advanced free model to date.",
	},
}
exports.mainlandZAiDefaultModelId = "glm-4.6" // kilocode_change: overwrite the entire file on merge conflicts
exports.mainlandZAiModels = {
	// kilocode_change start: overwrite the entire file on merge conflicts
	"glm-4.6": {
		maxTokens: 131072,
		contextWindow: 204800,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 0.29,
		outputPrice: 1.14,
		cacheWritesPrice: 0,
		cacheReadsPrice: 0.057,
		description:
			"GLM-4.6 is Zhipu's latest SOTA models for reasoning, code, and agentsUpgraded across 8 authoritative benchmarks. With a 355B-parameter MoE architecture and 200K context, it surpasses GLM-4.5 in coding, reasoning, search, writing, and agent applications.",
		tiers: [
			{
				contextWindow: 32000,
				inputPrice: 0.21,
				outputPrice: 1.0,
				cacheReadsPrice: 0.043,
			},
			{
				contextWindow: 200000,
				inputPrice: 0.29,
				outputPrice: 1.14,
				cacheReadsPrice: 0.057,
			},
			{
				contextWindow: Infinity,
				inputPrice: 0.29,
				outputPrice: 1.14,
				cacheReadsPrice: 0.057,
			},
		],
	},
	// kilocode_change end
	"glm-4.5": {
		maxTokens: 98304,
		contextWindow: 131072,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 0.29,
		outputPrice: 1.14,
		cacheWritesPrice: 0,
		cacheReadsPrice: 0.057,
		description: "Zhipu's previous flagship model.", // kilocode_change: overwrite the entire file on merge conflicts
		tiers: [
			{
				contextWindow: 32000,
				inputPrice: 0.21,
				outputPrice: 1.0,
				cacheReadsPrice: 0.043,
			},
			{
				contextWindow: 128000,
				inputPrice: 0.29,
				outputPrice: 1.14,
				cacheReadsPrice: 0.057,
			},
			{
				contextWindow: Infinity,
				inputPrice: 0.29,
				outputPrice: 1.14,
				cacheReadsPrice: 0.057,
			},
		],
	},
	"glm-4.5-air": {
		maxTokens: 98304,
		contextWindow: 131072,
		supportsImages: false,
		supportsPromptCache: true,
		inputPrice: 0.1,
		outputPrice: 0.6,
		cacheWritesPrice: 0,
		cacheReadsPrice: 0.02,
		description:
			"GLM-4.5-Air is the lightweight version of GLM-4.5. It balances performance and cost-effectiveness, and can flexibly switch to hybrid thinking models.",
		tiers: [
			{
				contextWindow: 32000,
				inputPrice: 0.07,
				outputPrice: 0.4,
				cacheReadsPrice: 0.014,
			},
			{
				contextWindow: 128000,
				inputPrice: 0.1,
				outputPrice: 0.6,
				cacheReadsPrice: 0.02,
			},
			{
				contextWindow: Infinity,
				inputPrice: 0.1,
				outputPrice: 0.6,
				cacheReadsPrice: 0.02,
			},
		],
	},
	"glm-4.5-flash": {
		maxTokens: 98304,
		contextWindow: 131072,
		supportsImages: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		cacheWritesPrice: 0,
		cacheReadsPrice: 0,
		description: "Zhipu's most advanced free model to date.",
	},
}
exports.ZAI_DEFAULT_TEMPERATURE = 0
exports.zaiApiLineConfigs = {
	international_coding: {
		name: "International Coding Plan",
		baseUrl: "https://api.z.ai/api/coding/paas/v4",
		isChina: false,
	},
	international: { name: "International Standard", baseUrl: "https://api.z.ai/api/paas/v4", isChina: false },
	china_coding: { name: "China Coding Plan", baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4", isChina: true },
	china: { name: "China Standard", baseUrl: "https://open.bigmodel.cn/api/paas/v4", isChina: true },
}
//# sourceMappingURL=zai.js.map
