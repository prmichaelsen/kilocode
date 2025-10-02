"use strict"
// Mocks must come first, before imports
Object.defineProperty(exports, "__esModule", { value: true })
// Mock NodeCache to avoid cache interference
vi.mock("node-cache", () => {
	return {
		default: vi.fn().mockImplementation(() => ({
			get: vi.fn().mockReturnValue(undefined), // Always return cache miss
			set: vi.fn(),
			del: vi.fn(),
		})),
	}
})
// Mock fs/promises to avoid file system operations
vi.mock("fs/promises", () => ({
	writeFile: vi.fn().mockResolvedValue(undefined),
	readFile: vi.fn().mockResolvedValue("{}"),
	mkdir: vi.fn().mockResolvedValue(undefined),
}))
// Mock all the model fetchers
vi.mock("../litellm")
vi.mock("../openrouter")
vi.mock("../requesty")
vi.mock("../glama")
vi.mock("../unbound")
vi.mock("../io-intelligence")
const modelCache_1 = require("../modelCache")
const litellm_1 = require("../litellm")
const openrouter_1 = require("../openrouter")
const requesty_1 = require("../requesty")
const glama_1 = require("../glama")
const unbound_1 = require("../unbound")
const io_intelligence_1 = require("../io-intelligence")
const mockGetLiteLLMModels = litellm_1.getLiteLLMModels
const mockGetOpenRouterModels = openrouter_1.getOpenRouterModels
const mockGetRequestyModels = requesty_1.getRequestyModels
const mockGetGlamaModels = glama_1.getGlamaModels
const mockGetUnboundModels = unbound_1.getUnboundModels
const mockGetIOIntelligenceModels = io_intelligence_1.getIOIntelligenceModels
const DUMMY_REQUESTY_KEY = "requesty-key-for-testing"
const DUMMY_UNBOUND_KEY = "unbound-key-for-testing"
const DUMMY_IOINTELLIGENCE_KEY = "io-intelligence-key-for-testing"
describe("getModels with new GetModelsOptions", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})
	it("calls getLiteLLMModels with correct parameters", async () => {
		const mockModels = {
			"claude-3-sonnet": {
				maxTokens: 4096,
				contextWindow: 200000,
				supportsPromptCache: false,
				description: "Claude 3 Sonnet via LiteLLM",
			},
		}
		mockGetLiteLLMModels.mockResolvedValue(mockModels)
		const result = await (0, modelCache_1.getModels)({
			provider: "litellm",
			apiKey: "test-api-key",
			baseUrl: "http://localhost:4000",
		})
		expect(mockGetLiteLLMModels).toHaveBeenCalledWith("test-api-key", "http://localhost:4000")
		expect(result).toEqual(mockModels)
	})
	it("calls getOpenRouterModels for openrouter provider", async () => {
		const mockModels = {
			"openrouter/model": {
				maxTokens: 8192,
				contextWindow: 128000,
				supportsPromptCache: false,
				description: "OpenRouter model",
			},
		}
		mockGetOpenRouterModels.mockResolvedValue(mockModels)
		const result = await (0, modelCache_1.getModels)({ provider: "openrouter" })
		expect(mockGetOpenRouterModels).toHaveBeenCalled()
		expect(result).toEqual(mockModels)
	})
	it("calls getRequestyModels with optional API key", async () => {
		const mockModels = {
			"requesty/model": {
				maxTokens: 4096,
				contextWindow: 8192,
				supportsPromptCache: false,
				description: "Requesty model",
			},
		}
		mockGetRequestyModels.mockResolvedValue(mockModels)
		const result = await (0, modelCache_1.getModels)({ provider: "requesty", apiKey: DUMMY_REQUESTY_KEY })
		expect(mockGetRequestyModels).toHaveBeenCalledWith(undefined, DUMMY_REQUESTY_KEY)
		expect(result).toEqual(mockModels)
	})
	it("calls getGlamaModels for glama provider", async () => {
		const mockModels = {
			"glama/model": {
				maxTokens: 4096,
				contextWindow: 8192,
				supportsPromptCache: false,
				description: "Glama model",
			},
		}
		mockGetGlamaModels.mockResolvedValue(mockModels)
		const result = await (0, modelCache_1.getModels)({ provider: "glama" })
		expect(mockGetGlamaModels).toHaveBeenCalled()
		expect(result).toEqual(mockModels)
	})
	it("calls getUnboundModels with optional API key", async () => {
		const mockModels = {
			"unbound/model": {
				maxTokens: 4096,
				contextWindow: 8192,
				supportsPromptCache: false,
				description: "Unbound model",
			},
		}
		mockGetUnboundModels.mockResolvedValue(mockModels)
		const result = await (0, modelCache_1.getModels)({ provider: "unbound", apiKey: DUMMY_UNBOUND_KEY })
		expect(mockGetUnboundModels).toHaveBeenCalledWith(DUMMY_UNBOUND_KEY)
		expect(result).toEqual(mockModels)
	})
	it("calls IOIntelligenceModels for IO-Intelligence provider", async () => {
		const mockModels = {
			"io-intelligence/model": {
				maxTokens: 4096,
				contextWindow: 8192,
				supportsPromptCache: false,
				description: "IO Intelligence Model",
			},
		}
		mockGetIOIntelligenceModels.mockResolvedValue(mockModels)
		const result = await (0, modelCache_1.getModels)({
			provider: "io-intelligence",
			apiKey: DUMMY_IOINTELLIGENCE_KEY,
		})
		expect(mockGetIOIntelligenceModels).toHaveBeenCalled()
		expect(result).toEqual(mockModels)
	})
	it("handles errors and re-throws them", async () => {
		const expectedError = new Error("LiteLLM connection failed")
		mockGetLiteLLMModels.mockRejectedValue(expectedError)
		await expect(
			(0, modelCache_1.getModels)({
				provider: "litellm",
				apiKey: "test-api-key",
				baseUrl: "http://localhost:4000",
			}),
		).rejects.toThrow("LiteLLM connection failed")
	})
	it("validates exhaustive provider checking with unknown provider", async () => {
		// This test ensures TypeScript catches unknown providers at compile time
		// In practice, the discriminated union should prevent this at compile time
		const unknownProvider = "unknown"
		await expect(
			(0, modelCache_1.getModels)({
				provider: unknownProvider,
			}),
		).rejects.toThrow("Unknown provider: unknown")
	})
})
//# sourceMappingURL=modelCache.spec.js.map
