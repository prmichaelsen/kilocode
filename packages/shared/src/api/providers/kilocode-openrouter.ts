import { OpenRouterHandler, type CompletionUsage } from "./openrouter.js"
import { getKiloBaseUriFromToken } from "../../utils/token.js"
import type { ApiHandlerCreateMessageMetadata } from "../index.js"
import type { ApiHandlerOptions } from "./base-provider.js"

// KiloCode headers
const X_KILOCODE_VERSION = "X-KiloCode-Version"
const X_KILOCODE_TASKID = "X-KiloCode-TaskId"
const X_KILOCODE_ORGANIZATIONID = "X-KiloCode-OrganizationId"
const X_KILOCODE_TESTER = "X-KILOCODE-TESTER"

/**
 * A custom OpenRouter handler that overrides the getModel function
 * to provide custom model information and fetches models from the KiloCode OpenRouter endpoint.
 */
export class KilocodeOpenrouterHandler extends OpenRouterHandler {
	protected override models: Record<string, any> = {}
	defaultModel: string = "anthropic/claude-3.5-sonnet:beta"

	protected override get providerName() {
		return "KiloCode"
	}

	constructor(options: ApiHandlerOptions) {
		const baseUri = getKiloBaseUriFromToken(options.kilocodeToken ?? "")
		options = {
			...options,
			openRouterBaseUrl: `${baseUri}/api/openrouter/`,
			openRouterApiKey: options.kilocodeToken,
		}

		super(options)
	}

	override customRequestOptions(metadata?: ApiHandlerCreateMessageMetadata) {
		const headers: Record<string, string> = {
			[X_KILOCODE_VERSION]: "4.99.1"
		}

		if (metadata?.taskId) {
			headers[X_KILOCODE_TASKID] = metadata.taskId
		}

		const kilocodeOptions = this.options

		if (kilocodeOptions.kilocodeOrganizationId) {
			headers[X_KILOCODE_ORGANIZATIONID] = kilocodeOptions.kilocodeOrganizationId
		}

		// Add X-KILOCODE-TESTER: SUPPRESS header if the setting is enabled
		if (
			kilocodeOptions.kilocodeTesterWarningsDisabledUntil &&
			kilocodeOptions.kilocodeTesterWarningsDisabledUntil > Date.now()
		) {
			headers[X_KILOCODE_TESTER] = "SUPPRESS"
		}

		return { headers }
	}

	override getTotalCost(lastUsage: CompletionUsage): number {
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

	override getModel() {
		let id = this.options.kilocodeModel ?? this.defaultModel
		let info = this.models[id] ?? {
			maxTokens: 4096,
			contextWindow: 200000,
			supportsImages: true,
			supportsPromptCache: true,
			inputPrice: 0.003,
			outputPrice: 0.015
		}

		// If a specific provider is requested, use the endpoint for that provider
		if (this.options.openRouterSpecificProvider && this.endpoints[this.options.openRouterSpecificProvider]) {
			info = this.endpoints[this.options.openRouterSpecificProvider]
		}

		return { id, info }
	}

	public async fetchModel() {
		// For now, just return the default model
		// In the future, we can implement model fetching from KiloCode API
		return this.getModel()
	}
}