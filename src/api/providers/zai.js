"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.ZAiHandler = void 0
const types_1 = require("@roo-code/types")
const base_openai_compatible_provider_1 = require("./base-openai-compatible-provider")
class ZAiHandler extends base_openai_compatible_provider_1.BaseOpenAiCompatibleProvider {
	constructor(options) {
		const isChina = types_1.zaiApiLineConfigs[options.zaiApiLine ?? "international_coding"].isChina
		const models = isChina ? types_1.mainlandZAiModels : types_1.internationalZAiModels
		const defaultModelId = isChina ? types_1.mainlandZAiDefaultModelId : types_1.internationalZAiDefaultModelId
		super({
			...options,
			providerName: "Z AI",
			baseURL: types_1.zaiApiLineConfigs[options.zaiApiLine ?? "international_coding"].baseUrl,
			apiKey: options.zaiApiKey ?? "not-provided",
			defaultProviderModelId: defaultModelId,
			providerModels: models,
			defaultTemperature: types_1.ZAI_DEFAULT_TEMPERATURE,
		})
	}
}
exports.ZAiHandler = ZAiHandler
//# sourceMappingURL=zai.js.map
