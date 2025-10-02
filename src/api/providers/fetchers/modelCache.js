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
exports.flushModels = exports.getModels = void 0
exports.writeModels = writeModels
exports.readModels = readModels
exports.getModelsFromCache = getModelsFromCache
const path = __importStar(require("path"))
const promises_1 = __importDefault(require("fs/promises"))
const node_cache_1 = __importDefault(require("node-cache"))
const safeWriteJson_1 = require("../../../utils/safeWriteJson")
const ContextProxy_1 = require("../../../core/config/ContextProxy")
const storage_1 = require("../../../utils/storage")
const fs_1 = require("../../../utils/fs")
const openrouter_1 = require("./openrouter")
const vercel_ai_gateway_1 = require("./vercel-ai-gateway")
const requesty_1 = require("./requesty")
const glama_1 = require("./glama")
const unbound_1 = require("./unbound")
const litellm_1 = require("./litellm")
const token_1 = require("../../../shared/kilocode/token")
const ollama_1 = require("./ollama")
const lmstudio_1 = require("./lmstudio")
const io_intelligence_1 = require("./io-intelligence")
const deepinfra_1 = require("./deepinfra")
const huggingface_1 = require("./huggingface")
const memoryCache = new node_cache_1.default({ stdTTL: 5 * 60, checkperiod: 5 * 60 })
async function writeModels(router, data) {
	const filename = `${router}_models.json`
	const cacheDir = await (0, storage_1.getCacheDirectoryPath)(
		ContextProxy_1.ContextProxy.instance.globalStorageUri.fsPath,
	)
	await (0, safeWriteJson_1.safeWriteJson)(path.join(cacheDir, filename), data)
}
async function readModels(router) {
	const filename = `${router}_models.json`
	const cacheDir = await (0, storage_1.getCacheDirectoryPath)(
		ContextProxy_1.ContextProxy.instance.globalStorageUri.fsPath,
	)
	const filePath = path.join(cacheDir, filename)
	const exists = await (0, fs_1.fileExistsAtPath)(filePath)
	return exists ? JSON.parse(await promises_1.default.readFile(filePath, "utf8")) : undefined
}
/**
 * Get models from the cache or fetch them from the provider and cache them.
 * There are two caches:
 * 1. Memory cache - This is a simple in-memory cache that is used to store models for a short period of time.
 * 2. File cache - This is a file-based cache that is used to store models for a longer period of time.
 *
 * @param router - The router to fetch models from.
 * @param apiKey - Optional API key for the provider.
 * @param baseUrl - Optional base URL for the provider (currently used only for LiteLLM).
 * @returns The models from the cache or the fetched models.
 */
const getModels = async (options) => {
	const { provider } = options
	let models = getModelsFromCache(provider)
	if (models) {
		return models
	}
	try {
		switch (provider) {
			case "openrouter":
				// kilocode_change start: base url and bearer token
				models = await (0, openrouter_1.getOpenRouterModels)({
					openRouterBaseUrl: options.baseUrl,
					headers: options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : undefined,
				})
				// kilocode_change end
				break
			case "requesty":
				// Requesty models endpoint requires an API key for per-user custom policies.
				models = await (0, requesty_1.getRequestyModels)(options.baseUrl, options.apiKey)
				break
			case "glama":
				models = await (0, glama_1.getGlamaModels)()
				break
			case "unbound":
				// Unbound models endpoint requires an API key to fetch application specific models.
				models = await (0, unbound_1.getUnboundModels)(options.apiKey)
				break
			case "litellm":
				// Type safety ensures apiKey and baseUrl are always provided for LiteLLM.
				models = await (0, litellm_1.getLiteLLMModels)(options.apiKey, options.baseUrl)
				break
			// kilocode_change start
			case "kilocode-openrouter":
				models = await (0, openrouter_1.getOpenRouterModels)({
					openRouterBaseUrl:
						(0, token_1.getKiloBaseUriFromToken)(options.kilocodeToken ?? "") +
						(options.kilocodeOrganizationId
							? `/api/organizations/${options.kilocodeOrganizationId}`
							: "/api/openrouter"),
					headers: options.kilocodeToken ? { Authorization: `Bearer ${options.kilocodeToken}` } : undefined,
				})
				break
			// kilocode_change end
			case "ollama":
				models = await (0, ollama_1.getOllamaModels)(
					options.baseUrl,
					options.apiKey,
					options.numCtx /*kilocode_change*/,
				)
				break
			case "lmstudio":
				models = await (0, lmstudio_1.getLMStudioModels)(options.baseUrl)
				break
			case "deepinfra":
				models = await (0, deepinfra_1.getDeepInfraModels)(options.apiKey, options.baseUrl)
				break
			case "io-intelligence":
				models = await (0, io_intelligence_1.getIOIntelligenceModels)(options.apiKey)
				break
			case "vercel-ai-gateway":
				models = await (0, vercel_ai_gateway_1.getVercelAiGatewayModels)()
				break
			case "huggingface":
				models = await (0, huggingface_1.getHuggingFaceModels)()
				break
			default: {
				// Ensures router is exhaustively checked if RouterName is a strict union.
				const exhaustiveCheck = provider
				throw new Error(`Unknown provider: ${exhaustiveCheck}`)
			}
		}
		// Cache the fetched models (even if empty, to signify a successful fetch with no models).
		memoryCache.set(provider, models)
		/* kilocode_change: skip useless file IO
        await writeModels(provider, models).catch((err) =>
            console.error(`[getModels] Error writing ${provider} models to file cache:`, err),
        )

        try {
            models = await readModels(provider)
        } catch (error) {
            console.error(`[getModels] error reading ${provider} models from file cache`, error)
        }
        */
		return models || {}
	} catch (error) {
		// Log the error and re-throw it so the caller can handle it (e.g., show a UI message).
		console.error(`[getModels] Failed to fetch models in modelCache for ${provider}:`, error)
		throw error // Re-throw the original error to be handled by the caller.
	}
}
exports.getModels = getModels
/**
 * Flush models memory cache for a specific router.
 *
 * @param router - The router to flush models for.
 */
const flushModels = async (router) => {
	memoryCache.del(router)
}
exports.flushModels = flushModels
function getModelsFromCache(provider) {
	return memoryCache.get(provider)
}
//# sourceMappingURL=modelCache.js.map
