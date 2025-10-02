"use strict"
// npx vitest run api/providers/__tests__/ollama-timeout.spec.ts
Object.defineProperty(exports, "__esModule", { value: true })
const ollama_1 = require("../ollama")
// Mock the timeout config utility
vitest.mock("../utils/timeout-config", () => ({
	getApiRequestTimeout: vitest.fn(),
}))
const timeout_config_1 = require("../utils/timeout-config")
// Mock OpenAI
const mockOpenAIConstructor = vitest.fn()
vitest.mock("openai", () => {
	return {
		__esModule: true,
		default: vitest.fn().mockImplementation((config) => {
			mockOpenAIConstructor(config)
			return {
				chat: {
					completions: {
						create: vitest.fn(),
					},
				},
			}
		}),
	}
})
describe("OllamaHandler timeout configuration", () => {
	beforeEach(() => {
		vitest.clearAllMocks()
	})
	it("should use default timeout of 600 seconds when no configuration is set", () => {
		timeout_config_1.getApiRequestTimeout.mockReturnValue(600000)
		const options = {
			apiModelId: "llama2",
			ollamaModelId: "llama2",
			ollamaBaseUrl: "http://localhost:11434",
		}
		new ollama_1.OllamaHandler(options)
		expect(timeout_config_1.getApiRequestTimeout).toHaveBeenCalled()
		expect(mockOpenAIConstructor).toHaveBeenCalledWith(
			expect.objectContaining({
				baseURL: "http://localhost:11434/v1",
				apiKey: "ollama",
				timeout: 600000, // 600 seconds in milliseconds
			}),
		)
	})
	it("should use custom timeout when configuration is set", () => {
		timeout_config_1.getApiRequestTimeout.mockReturnValue(3600000) // 1 hour
		const options = {
			apiModelId: "llama2",
			ollamaModelId: "llama2",
		}
		new ollama_1.OllamaHandler(options)
		expect(mockOpenAIConstructor).toHaveBeenCalledWith(
			expect.objectContaining({
				timeout: 3600000, // 3600 seconds in milliseconds
			}),
		)
	})
	it("should handle zero timeout (no timeout)", () => {
		timeout_config_1.getApiRequestTimeout.mockReturnValue(0)
		const options = {
			apiModelId: "llama2",
			ollamaModelId: "llama2",
			ollamaBaseUrl: "http://localhost:11434",
		}
		new ollama_1.OllamaHandler(options)
		expect(mockOpenAIConstructor).toHaveBeenCalledWith(
			expect.objectContaining({
				timeout: 0, // No timeout
			}),
		)
	})
	it("should use default base URL when not provided", () => {
		timeout_config_1.getApiRequestTimeout.mockReturnValue(600000)
		const options = {
			apiModelId: "llama2",
			ollamaModelId: "llama2",
		}
		new ollama_1.OllamaHandler(options)
		expect(mockOpenAIConstructor).toHaveBeenCalledWith(
			expect.objectContaining({
				baseURL: "http://localhost:11434/v1",
			}),
		)
	})
})
//# sourceMappingURL=ollama-timeout.spec.js.map
