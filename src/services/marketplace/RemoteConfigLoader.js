"use strict"
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k
				var desc = Object.getOwnPropertyDescriptor(m, k)
				if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
					desc = {
						enumerable: true,
						get: function () {
							return m[k]
						},
					}
				}
				Object.defineProperty(o, k2, desc)
			}
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k
				o[k2] = m[k]
			})
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, "default", { enumerable: true, value: v })
			}
		: function (o, v) {
				o["default"] = v
			})
var __importStar =
	(this && this.__importStar) ||
	(function () {
		var ownKeys = function (o) {
			ownKeys =
				Object.getOwnPropertyNames ||
				function (o) {
					var ar = []
					for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k
					return ar
				}
			return ownKeys(o)
		}
		return function (mod) {
			if (mod && mod.__esModule) return mod
			var result = {}
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== "default") __createBinding(result, mod, k[i])
			__setModuleDefault(result, mod)
			return result
		}
	})()
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.RemoteConfigLoader = void 0
const axios_1 = __importDefault(require("axios"))
const yaml = __importStar(require("yaml"))
const zod_1 = require("zod")
const token_1 = require("../../shared/kilocode/token") // kilocode_change
const types_1 = require("@roo-code/types")
//import { getRooCodeApiUrl } from "@roo-code/cloud" kilocode_change: use our own api
const modeMarketplaceResponse = zod_1.z.object({
	items: zod_1.z.array(types_1.modeMarketplaceItemSchema),
})
const mcpMarketplaceResponse = zod_1.z.object({
	items: zod_1.z.array(types_1.mcpMarketplaceItemSchema),
})
class RemoteConfigLoader {
	constructor() {
		Object.defineProperty(this, "apiBaseUrl", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "cache", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: new Map(),
		})
		Object.defineProperty(this, "cacheDuration", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: 5 * 60 * 1000,
		}) // 5 minutes
		this.apiBaseUrl = (0, token_1.getKiloBaseUriFromToken)()
	}
	async loadAllItems(hideMarketplaceMcps = false) {
		const items = []
		const modesPromise = this.fetchModes()
		const mcpsPromise = hideMarketplaceMcps ? Promise.resolve([]) : this.fetchMcps()
		const [modes, mcps] = await Promise.all([modesPromise, mcpsPromise])
		items.push(...modes, ...mcps)
		return items
	}
	async fetchModes() {
		const cacheKey = "modes"
		const cached = this.getFromCache(cacheKey)
		if (cached) {
			return cached
		}
		const data = await this.fetchWithRetry(`${this.apiBaseUrl}/api/marketplace/modes`)
		const yamlData = yaml.parse(data)
		const validated = modeMarketplaceResponse.parse(yamlData)
		const items = validated.items.map((item) => ({
			type: "mode",
			...item,
		}))
		this.setCache(cacheKey, items)
		return items
	}
	async fetchMcps() {
		const cacheKey = "mcps"
		const cached = this.getFromCache(cacheKey)
		if (cached) {
			return cached
		}
		const data = await this.fetchWithRetry(`${this.apiBaseUrl}/api/marketplace/mcps`)
		const yamlData = yaml.parse(data)
		const validated = mcpMarketplaceResponse.parse(yamlData)
		const items = validated.items.map((item) => ({
			type: "mcp",
			...item,
		}))
		this.setCache(cacheKey, items)
		return items
	}
	async fetchWithRetry(url, maxRetries = 3) {
		let lastError
		for (let i = 0; i < maxRetries; i++) {
			try {
				const response = await axios_1.default.get(url, {
					timeout: 10000, // 10 second timeout
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
				})
				return response.data
			} catch (error) {
				lastError = error
				if (i < maxRetries - 1) {
					// Exponential backoff: 1s, 2s, 4s
					const delay = Math.pow(2, i) * 1000
					await new Promise((resolve) => setTimeout(resolve, delay))
				}
			}
		}
		throw lastError
	}
	async getItem(id, type) {
		const items = await this.loadAllItems()
		return items.find((item) => item.id === id && item.type === type) || null
	}
	getFromCache(key) {
		const cached = this.cache.get(key)
		if (!cached) return null
		const now = Date.now()
		if (now - cached.timestamp > this.cacheDuration) {
			this.cache.delete(key)
			return null
		}
		return cached.data
	}
	setCache(key, data) {
		this.cache.set(key, {
			data,
			timestamp: Date.now(),
		})
	}
	clearCache() {
		this.cache.clear()
	}
}
exports.RemoteConfigLoader = RemoteConfigLoader
//# sourceMappingURL=RemoteConfigLoader.js.map
