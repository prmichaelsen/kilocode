"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.KilocodeOpenrouterHandler = void 0
const openrouter_1 = require("./openrouter")
const model_params_1 = require("../transform/model-params")
const modelCache_1 = require("./fetchers/modelCache")
const types_1 = require("@roo-code/types")
const token_1 = require("../../shared/kilocode/token")
const modelEndpointCache_1 = require("./fetchers/modelEndpointCache")
const getKilocodeDefaultModel_1 = require("./kilocode/getKilocodeDefaultModel")
const headers_1 = require("../../shared/kilocode/headers")
/**
 * A custom OpenRouter handler that overrides the getModel function
 * to provide custom model information and fetches models from the KiloCode OpenRouter endpoint.
 */
class KilocodeOpenrouterHandler extends openrouter_1.OpenRouterHandler {
	get providerName() {
		return "KiloCode"
	}
	constructor(options) {
		const baseUri = (0, token_1.getKiloBaseUriFromToken)(options.kilocodeToken ?? "")
		options = {
			...options,
			openRouterBaseUrl: `${baseUri}/api/openrouter/`,
			openRouterApiKey: options.kilocodeToken,
		}
		super(options)
		Object.defineProperty(this, "models", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: {},
		})
		Object.defineProperty(this, "defaultModel", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: types_1.openRouterDefaultModelId,
		})
	}
	customRequestOptions(metadata) {
		const headers = {}
		if (metadata?.taskId) {
			headers[headers_1.X_KILOCODE_TASKID] = metadata.taskId
		}
		const kilocodeOptions = this.options
		if (kilocodeOptions.kilocodeOrganizationId) {
			headers[headers_1.X_KILOCODE_ORGANIZATIONID] = kilocodeOptions.kilocodeOrganizationId
		}
		// Add X-KILOCODE-TESTER: SUPPRESS header if the setting is enabled
		if (
			kilocodeOptions.kilocodeTesterWarningsDisabledUntil &&
			kilocodeOptions.kilocodeTesterWarningsDisabledUntil > Date.now()
		) {
			headers[headers_1.X_KILOCODE_TESTER] = "SUPPRESS"
		}
		return Object.keys(headers).length > 0 ? { headers } : undefined
	}
	getTotalCost(lastUsage) {
		const model = this.getModel().info
		if (!model.inputPrice && !model.outputPrice) {
			return 0
		}
		// https://github.com/Kilo-Org/kilocode-backend/blob/eb3d382df1e933a089eea95b9c4387db0c676e35/src/lib/processUsage.ts#L281
		if (lastUsage.is_byok) {
			return lastUsage.cost_details?.upstream_inference_cost || 0
		}
		return lastUsage.cost || 0
	}
	getModel() {
		let id = this.options.kilocodeModel ?? this.defaultModel
		let info = this.models[id] ?? types_1.openRouterDefaultModelInfo
		// If a specific provider is requested, use the endpoint for that provider.
		if (this.options.openRouterSpecificProvider && this.endpoints[this.options.openRouterSpecificProvider]) {
			info = this.endpoints[this.options.openRouterSpecificProvider]
		}
		const isDeepSeekR1 = id.startsWith("deepseek/deepseek-r1") || id === "perplexity/sonar-reasoning"
		const params = (0, model_params_1.getModelParams)({
			format: "openrouter",
			modelId: id,
			model: info,
			settings: this.options,
			defaultTemperature: isDeepSeekR1 ? types_1.DEEP_SEEK_DEFAULT_TEMPERATURE : 0,
		})
		return { id, info, topP: isDeepSeekR1 ? 0.95 : undefined, ...params }
	}
	async fetchModel() {
		if (!this.options.kilocodeToken || !this.options.openRouterBaseUrl) {
			throw new Error("KiloCode token + baseUrl is required to fetch models")
		}
		const [models, endpoints, defaultModel] = await Promise.all([
			(0, modelCache_1.getModels)({
				provider: "kilocode-openrouter",
				kilocodeToken: this.options.kilocodeToken,
				kilocodeOrganizationId: this.options.kilocodeOrganizationId,
			}),
			(0, modelEndpointCache_1.getModelEndpoints)({
				router: "openrouter",
				modelId: this.options.kilocodeModel,
				endpoint: this.options.openRouterSpecificProvider,
			}),
			(0, getKilocodeDefaultModel_1.getKilocodeDefaultModel)(
				this.options.kilocodeToken,
				this.options.kilocodeOrganizationId,
				this.options,
			),
		])
		this.models = models
		this.endpoints = endpoints
		this.defaultModel = defaultModel
		return this.getModel()
	}
}
exports.KilocodeOpenrouterHandler = KilocodeOpenrouterHandler
//# sourceMappingURL=kilocode-openrouter.js.map
