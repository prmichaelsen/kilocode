"use strict"
// npx vitest run api/providers/__tests__/roo.spec.ts
Object.defineProperty(exports, "__esModule", { value: true })
const types_1 = require("@roo-code/types")
// Mock OpenAI client
const mockCreate = vitest.fn()
vitest.mock("openai", () => {
	return {
		__esModule: true,
		default: vitest.fn().mockImplementation(() => ({
			chat: {
				completions: {
					create: mockCreate.mockImplementation(async (options) => {
						if (!options.stream) {
							return {
								id: "test-completion",
								choices: [
									{
										message: { role: "assistant", content: "Test response" },
										finish_reason: "stop",
										index: 0,
									},
								],
								usage: {
									prompt_tokens: 10,
									completion_tokens: 5,
									total_tokens: 15,
								},
							}
						}
						return {
							[Symbol.asyncIterator]: async function* () {
								yield {
									choices: [{ delta: { content: "Test response" }, index: 0 }],
									usage: null,
								}
								yield {
									choices: [{ delta: {}, index: 0 }],
									usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
								}
							},
						}
					}),
				},
			},
		})),
	}
})
// Mock CloudService - Define functions outside to avoid initialization issues
const mockGetSessionToken = vitest.fn()
const mockHasInstance = vitest.fn()
// Create mock functions that we can control
const mockGetSessionTokenFn = vitest.fn()
const mockHasInstanceFn = vitest.fn()
const mockOnFn = vitest.fn()
vitest.mock("@roo-code/cloud", () => ({
	CloudService: {
		hasInstance: () => mockHasInstanceFn(),
		get instance() {
			return {
				authService: {
					getSessionToken: () => mockGetSessionTokenFn(),
				},
				on: vitest.fn(),
				off: vitest.fn(),
			}
		},
	},
}))
// Mock i18n
vitest.mock("../../../i18n", () => ({
	t: vitest.fn((key) => {
		if (key === "common:errors.roo.authenticationRequired") {
			return "Authentication required for Roo Code Cloud"
		}
		return key
	}),
}))
// Import after mocks are set up
const roo_1 = require("../roo")
const cloud_1 = require("@roo-code/cloud")
describe("RooHandler", () => {
	let handler
	let mockOptions
	const systemPrompt = "You are a helpful assistant."
	const messages = [
		{
			role: "user",
			content: "Hello!",
		},
	]
	beforeEach(() => {
		mockOptions = {
			apiModelId: "xai/grok-code-fast-1",
		}
		// Set up CloudService mocks for successful authentication
		mockHasInstanceFn.mockReturnValue(true)
		mockGetSessionTokenFn.mockReturnValue("test-session-token")
		mockCreate.mockClear()
		vitest.clearAllMocks()
	})
	describe("constructor", () => {
		it("should initialize with valid session token", () => {
			handler = new roo_1.RooHandler(mockOptions)
			expect(handler).toBeInstanceOf(roo_1.RooHandler)
			expect(handler.getModel().id).toBe(mockOptions.apiModelId)
		})
		it("should not throw error if CloudService is not available", () => {
			mockHasInstanceFn.mockReturnValue(false)
			expect(() => {
				new roo_1.RooHandler(mockOptions)
			}).not.toThrow()
			// Constructor should succeed even without CloudService
			const handler = new roo_1.RooHandler(mockOptions)
			expect(handler).toBeInstanceOf(roo_1.RooHandler)
		})
		it("should not throw error if session token is not available", () => {
			mockHasInstanceFn.mockReturnValue(true)
			mockGetSessionTokenFn.mockReturnValue(null)
			expect(() => {
				new roo_1.RooHandler(mockOptions)
			}).not.toThrow()
			// Constructor should succeed even without session token
			const handler = new roo_1.RooHandler(mockOptions)
			expect(handler).toBeInstanceOf(roo_1.RooHandler)
		})
		it("should initialize with default model if no model specified", () => {
			handler = new roo_1.RooHandler({})
			expect(handler).toBeInstanceOf(roo_1.RooHandler)
			expect(handler.getModel().id).toBe(types_1.rooDefaultModelId)
		})
		it("should pass correct configuration to base class", () => {
			handler = new roo_1.RooHandler(mockOptions)
			expect(handler).toBeInstanceOf(roo_1.RooHandler)
			// The handler should be initialized with correct base URL and API key
			// We can't directly test the parent class constructor, but we can verify the handler works
			expect(handler).toBeDefined()
		})
	})
	describe("createMessage", () => {
		beforeEach(() => {
			handler = new roo_1.RooHandler(mockOptions)
		})
		it("should handle streaming responses", async () => {
			const stream = handler.createMessage(systemPrompt, messages)
			const chunks = []
			for await (const chunk of stream) {
				chunks.push(chunk)
			}
			expect(chunks.length).toBeGreaterThan(0)
			const textChunks = chunks.filter((chunk) => chunk.type === "text")
			expect(textChunks).toHaveLength(1)
			expect(textChunks[0].text).toBe("Test response")
		})
		it("should include usage information", async () => {
			const stream = handler.createMessage(systemPrompt, messages)
			const chunks = []
			for await (const chunk of stream) {
				chunks.push(chunk)
			}
			const usageChunks = chunks.filter((chunk) => chunk.type === "usage")
			expect(usageChunks).toHaveLength(1)
			expect(usageChunks[0].inputTokens).toBe(10)
			expect(usageChunks[0].outputTokens).toBe(5)
		})
		it("should handle API errors", async () => {
			mockCreate.mockRejectedValueOnce(new Error("API Error"))
			const stream = handler.createMessage(systemPrompt, messages)
			await expect(async () => {
				for await (const _chunk of stream) {
					// Should not reach here
				}
			}).rejects.toThrow("API Error")
		})
		it("should handle empty response content", async () => {
			mockCreate.mockResolvedValueOnce({
				[Symbol.asyncIterator]: async function* () {
					yield {
						choices: [
							{
								delta: { content: null },
								index: 0,
							},
						],
						usage: {
							prompt_tokens: 10,
							completion_tokens: 0,
							total_tokens: 10,
						},
					}
				},
			})
			const stream = handler.createMessage(systemPrompt, messages)
			const chunks = []
			for await (const chunk of stream) {
				chunks.push(chunk)
			}
			const textChunks = chunks.filter((chunk) => chunk.type === "text")
			expect(textChunks).toHaveLength(0)
			const usageChunks = chunks.filter((chunk) => chunk.type === "usage")
			expect(usageChunks).toHaveLength(1)
		})
		it("should handle multiple messages in conversation", async () => {
			const multipleMessages = [
				{ role: "user", content: "First message" },
				{ role: "assistant", content: "First response" },
				{ role: "user", content: "Second message" },
			]
			const stream = handler.createMessage(systemPrompt, multipleMessages)
			const chunks = []
			for await (const chunk of stream) {
				chunks.push(chunk)
			}
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					messages: expect.arrayContaining([
						expect.objectContaining({ role: "system", content: systemPrompt }),
						expect.objectContaining({ role: "user", content: "First message" }),
						expect.objectContaining({ role: "assistant", content: "First response" }),
						expect.objectContaining({ role: "user", content: "Second message" }),
					]),
				}),
				undefined,
			)
		})
	})
	describe("completePrompt", () => {
		beforeEach(() => {
			handler = new roo_1.RooHandler(mockOptions)
		})
		it("should complete prompt successfully", async () => {
			const result = await handler.completePrompt("Test prompt")
			expect(result).toBe("Test response")
			expect(mockCreate).toHaveBeenCalledWith({
				model: mockOptions.apiModelId,
				messages: [{ role: "user", content: "Test prompt" }],
			})
		})
		it("should handle API errors", async () => {
			mockCreate.mockRejectedValueOnce(new Error("API Error"))
			await expect(handler.completePrompt("Test prompt")).rejects.toThrow(
				"Roo Code Cloud completion error: API Error",
			)
		})
		it("should handle empty response", async () => {
			mockCreate.mockResolvedValueOnce({
				choices: [{ message: { content: "" } }],
			})
			const result = await handler.completePrompt("Test prompt")
			expect(result).toBe("")
		})
		it("should handle missing response content", async () => {
			mockCreate.mockResolvedValueOnce({
				choices: [{ message: {} }],
			})
			const result = await handler.completePrompt("Test prompt")
			expect(result).toBe("")
		})
	})
	describe("getModel", () => {
		beforeEach(() => {
			handler = new roo_1.RooHandler(mockOptions)
		})
		it("should return model info for specified model", () => {
			const modelInfo = handler.getModel()
			expect(modelInfo.id).toBe(mockOptions.apiModelId)
			expect(modelInfo.info).toBeDefined()
			// xai/grok-code-fast-1 is a valid model in rooModels
			expect(modelInfo.info).toBe(types_1.rooModels["xai/grok-code-fast-1"])
		})
		it("should return default model when no model specified", () => {
			const handlerWithoutModel = new roo_1.RooHandler({})
			const modelInfo = handlerWithoutModel.getModel()
			expect(modelInfo.id).toBe(types_1.rooDefaultModelId)
			expect(modelInfo.info).toBeDefined()
			expect(modelInfo.info).toBe(types_1.rooModels[types_1.rooDefaultModelId])
		})
		it("should handle unknown model ID with fallback info", () => {
			const handlerWithUnknownModel = new roo_1.RooHandler({
				apiModelId: "unknown-model-id",
			})
			const modelInfo = handlerWithUnknownModel.getModel()
			expect(modelInfo.id).toBe("unknown-model-id")
			expect(modelInfo.info).toBeDefined()
			// Should return fallback info for unknown models
			expect(modelInfo.info.maxTokens).toBe(16384)
			expect(modelInfo.info.contextWindow).toBe(262144)
			expect(modelInfo.info.supportsImages).toBe(false)
			expect(modelInfo.info.supportsPromptCache).toBe(true)
			expect(modelInfo.info.inputPrice).toBe(0)
			expect(modelInfo.info.outputPrice).toBe(0)
		})
		it("should return correct model info for all Roo models", () => {
			// Test each model in rooModels
			const modelIds = Object.keys(types_1.rooModels)
			for (const modelId of modelIds) {
				const handlerWithModel = new roo_1.RooHandler({ apiModelId: modelId })
				const modelInfo = handlerWithModel.getModel()
				expect(modelInfo.id).toBe(modelId)
				expect(modelInfo.info).toBe(types_1.rooModels[modelId])
			}
		})
	})
	describe("temperature and model configuration", () => {
		it("should use default temperature of 0.7", async () => {
			handler = new roo_1.RooHandler(mockOptions)
			const stream = handler.createMessage(systemPrompt, messages)
			for await (const _chunk of stream) {
				// Consume stream
			}
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					temperature: 0.7,
				}),
				undefined,
			)
		})
		it("should respect custom temperature setting", async () => {
			handler = new roo_1.RooHandler({
				...mockOptions,
				modelTemperature: 0.9,
			})
			const stream = handler.createMessage(systemPrompt, messages)
			for await (const _chunk of stream) {
				// Consume stream
			}
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					temperature: 0.9,
				}),
				undefined,
			)
		})
		it("should use correct API endpoint", () => {
			// The base URL should be set to Roo's API endpoint
			// We can't directly test the OpenAI client configuration, but we can verify the handler initializes
			handler = new roo_1.RooHandler(mockOptions)
			expect(handler).toBeInstanceOf(roo_1.RooHandler)
			// The handler should work with the Roo API endpoint
		})
	})
	describe("authentication flow", () => {
		it("should use session token as API key", () => {
			const testToken = "test-session-token-123"
			mockGetSessionTokenFn.mockReturnValue(testToken)
			handler = new roo_1.RooHandler(mockOptions)
			expect(handler).toBeInstanceOf(roo_1.RooHandler)
			expect(mockGetSessionTokenFn).toHaveBeenCalled()
		})
		it("should handle undefined auth service gracefully", () => {
			mockHasInstanceFn.mockReturnValue(true)
			// Mock CloudService with undefined authService
			const originalGetSessionToken = mockGetSessionTokenFn.getMockImplementation()
			// Temporarily make authService return undefined
			mockGetSessionTokenFn.mockImplementation(() => undefined)
			try {
				Object.defineProperty(cloud_1.CloudService, "instance", {
					get: () => ({
						authService: undefined,
						on: vitest.fn(),
						off: vitest.fn(),
					}),
					configurable: true,
				})
				expect(() => {
					new roo_1.RooHandler(mockOptions)
				}).not.toThrow()
				// Constructor should succeed even with undefined auth service
				const handler = new roo_1.RooHandler(mockOptions)
				expect(handler).toBeInstanceOf(roo_1.RooHandler)
			} finally {
				// Restore original mock implementation
				if (originalGetSessionToken) {
					mockGetSessionTokenFn.mockImplementation(originalGetSessionToken)
				} else {
					mockGetSessionTokenFn.mockReturnValue("test-session-token")
				}
			}
		})
		it("should handle empty session token gracefully", () => {
			mockGetSessionTokenFn.mockReturnValue("")
			expect(() => {
				new roo_1.RooHandler(mockOptions)
			}).not.toThrow()
			// Constructor should succeed even with empty session token
			const handler = new roo_1.RooHandler(mockOptions)
			expect(handler).toBeInstanceOf(roo_1.RooHandler)
		})
	})
})
//# sourceMappingURL=roo.spec.js.map
