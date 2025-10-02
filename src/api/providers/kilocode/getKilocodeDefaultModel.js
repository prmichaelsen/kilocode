"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.getKilocodeDefaultModel = getKilocodeDefaultModel
const types_1 = require("@roo-code/types")
const token_1 = require("../../../shared/kilocode/token")
const telemetry_1 = require("@roo-code/telemetry")
const zod_1 = require("zod")
const fetchWithTimeout_1 = require("./fetchWithTimeout")
const constants_1 = require("../constants")
const cache = new Map()
const defaultsSchema = zod_1.z.object({
	defaultModel: zod_1.z.string().nullish(),
})
const fetcher = (0, fetchWithTimeout_1.fetchWithTimeout)(5000)
async function fetchKilocodeDefaultModel(kilocodeToken, organizationId, providerSettings) {
	try {
		const path = organizationId ? `/organizations/${organizationId}/defaults` : `/defaults`
		const url = `${(0, token_1.getKiloBaseUriFromToken)(kilocodeToken)}/api${path}`
		const headers = {
			...constants_1.DEFAULT_HEADERS,
			Authorization: `Bearer ${kilocodeToken}`,
		}
		// Add X-KILOCODE-TESTER: SUPPRESS header if the setting is enabled
		if (
			providerSettings?.kilocodeTesterWarningsDisabledUntil &&
			providerSettings.kilocodeTesterWarningsDisabledUntil > Date.now()
		) {
			headers["X-KILOCODE-TESTER"] = "SUPPRESS"
		}
		const response = await fetcher(url, { headers })
		if (!response.ok) {
			throw new Error(`Fetching default model from ${url} failed: ${response.status}`)
		}
		const defaultModel = (await defaultsSchema.parseAsync(await response.json())).defaultModel
		if (!defaultModel) {
			throw new Error(`Default model from ${url} was empty`)
		}
		console.info(`Fetched default model from ${url}: ${defaultModel}`)
		return defaultModel
	} catch (err) {
		console.error("Failed to get default model", err)
		telemetry_1.TelemetryService.instance.captureException(err, { context: "getKilocodeDefaultModel" })
		return types_1.openRouterDefaultModelId
	}
}
async function getKilocodeDefaultModel(kilocodeToken, organizationId, providerSettings) {
	if (!kilocodeToken) {
		return types_1.openRouterDefaultModelId
	}
	const key = JSON.stringify({
		kilocodeToken,
		organizationId,
		testerSuppressed: providerSettings?.kilocodeTesterWarningsDisabledUntil,
	})
	let defaultModelPromise = cache.get(key)
	if (!defaultModelPromise) {
		defaultModelPromise = fetchKilocodeDefaultModel(kilocodeToken, organizationId, providerSettings)
		cache.set(key, defaultModelPromise)
	}
	return await defaultModelPromise
}
//# sourceMappingURL=getKilocodeDefaultModel.js.map
