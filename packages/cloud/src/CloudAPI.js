"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.CloudAPI = void 0
const zod_1 = require("zod")
const types_1 = require("@roo-code/types")
const config_js_1 = require("./config.js")
const utils_js_1 = require("./utils.js")
const errors_js_1 = require("./errors.js")
class CloudAPI {
	constructor(authService, log) {
		Object.defineProperty(this, "authService", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "log", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "baseUrl", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		this.authService = authService
		this.log = log || console.log
		this.baseUrl = (0, config_js_1.getRooCodeApiUrl)()
	}
	async request(endpoint, options = {}) {
		const { timeout = 30000, parseResponse, headers = {}, ...fetchOptions } = options
		const sessionToken = this.authService.getSessionToken()
		if (!sessionToken) {
			throw new errors_js_1.AuthenticationError()
		}
		const url = `${this.baseUrl}${endpoint}`
		const requestHeaders = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${sessionToken}`,
			"User-Agent": (0, utils_js_1.getUserAgent)(),
			...headers,
		}
		try {
			const response = await fetch(url, {
				...fetchOptions,
				headers: requestHeaders,
				signal: AbortSignal.timeout(timeout),
			})
			if (!response.ok) {
				await this.handleErrorResponse(response, endpoint)
			}
			const data = await response.json()
			if (parseResponse) {
				return parseResponse(data)
			}
			return data
		} catch (error) {
			if (error instanceof TypeError && error.message.includes("fetch")) {
				throw new errors_js_1.NetworkError(`Network error while calling ${endpoint}`)
			}
			if (error instanceof errors_js_1.CloudAPIError) {
				throw error
			}
			if (error instanceof Error && error.name === "AbortError") {
				throw new errors_js_1.CloudAPIError(`Request to ${endpoint} timed out`, undefined, undefined)
			}
			throw new errors_js_1.CloudAPIError(
				`Unexpected error while calling ${endpoint}: ${error instanceof Error ? error.message : String(error)}`,
			)
		}
	}
	async handleErrorResponse(response, endpoint) {
		let responseBody
		try {
			responseBody = await response.json()
		} catch {
			responseBody = await response.text()
		}
		switch (response.status) {
			case 401:
				throw new errors_js_1.AuthenticationError()
			case 404:
				if (endpoint.includes("/share")) {
					throw new errors_js_1.TaskNotFoundError()
				}
				throw new errors_js_1.CloudAPIError(`Resource not found: ${endpoint}`, 404, responseBody)
			default:
				throw new errors_js_1.CloudAPIError(
					`HTTP ${response.status}: ${response.statusText}`,
					response.status,
					responseBody,
				)
		}
	}
	async shareTask(taskId, visibility = "organization") {
		this.log(`[CloudAPI] Sharing task ${taskId} with visibility: ${visibility}`)
		const response = await this.request("/api/extension/share", {
			method: "POST",
			body: JSON.stringify({ taskId, visibility }),
			parseResponse: (data) => types_1.shareResponseSchema.parse(data),
		})
		this.log("[CloudAPI] Share response:", response)
		return response
	}
	async bridgeConfig() {
		return this.request("/api/extension/bridge/config", {
			method: "GET",
			parseResponse: (data) =>
				zod_1.z
					.object({
						userId: zod_1.z.string(),
						socketBridgeUrl: zod_1.z.string(),
						token: zod_1.z.string(),
					})
					.parse(data),
		})
	}
}
exports.CloudAPI = CloudAPI
//# sourceMappingURL=CloudAPI.js.map
