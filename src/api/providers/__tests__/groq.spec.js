"use strict"
// npx vitest run src/api/providers/__tests__/groq.spec.ts
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
// Mock vscode first to avoid import errors
vitest.mock("vscode", () => ({}))
const openai_1 = __importDefault(require("openai"))
const types_1 = require("@roo-code/types")
const groq_1 = require("../groq")
vitest.mock("openai", () => {
	const createMock = vitest.fn()
	return {
		default: vitest.fn(() => ({ chat: { completions: { create: createMock } } })),
	}
})
describe("GroqHandler", () => {
	let handler
	let mockCreate
	beforeEach(() => {
		vitest.clearAllMocks()
		mockCreate = openai_1.default().chat.completions.create
		handler = new groq_1.GroqHandler({ groqApiKey: "test-groq-api-key" })
	})
	it("should use the correct Groq base URL", () => {
		new groq_1.GroqHandler({ groqApiKey: "test-groq-api-key" })
		expect(openai_1.default).toHaveBeenCalledWith(
			expect.objectContaining({ baseURL: "https://api.groq.com/openai/v1" }),
		)
	})
	it("should use the provided API key", () => {
		const groqApiKey = "test-groq-api-key"
		new groq_1.GroqHandler({ groqApiKey })
		expect(openai_1.default).toHaveBeenCalledWith(expect.objectContaining({ apiKey: groqApiKey }))
	})
	it("should return default model when no model is specified", () => {
		const model = handler.getModel()
		expect(model.id).toBe(types_1.groqDefaultModelId)
		expect(model.info).toEqual(types_1.groqModels[types_1.groqDefaultModelId])
	})
	it("should return specified model when valid model is provided", () => {
		const testModelId = "llama-3.3-70b-versatile"
		const handlerWithModel = new groq_1.GroqHandler({ apiModelId: testModelId, groqApiKey: "test-groq-api-key" })
		const model = handlerWithModel.getModel()
		expect(model.id).toBe(testModelId)
		expect(model.info).toEqual(types_1.groqModels[testModelId])
	})
	it("completePrompt method should return text from Groq API", async () => {
		const expectedResponse = "This is a test response from Groq"
		mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: expectedResponse } }] })
		const result = await handler.completePrompt("test prompt")
		expect(result).toBe(expectedResponse)
	})
	it("should handle errors in completePrompt", async () => {
		const errorMessage = "Groq API error"
		mockCreate.mockRejectedValueOnce(new Error(errorMessage))
		await expect(handler.completePrompt("test prompt")).rejects.toThrow(`Groq completion error: ${errorMessage}`)
	})
	it("createMessage should yield text content from stream", async () => {
		const testContent = "This is test content from Groq stream"
		mockCreate.mockImplementationOnce(() => {
			return {
				[Symbol.asyncIterator]: () => ({
					next: vitest
						.fn()
						.mockResolvedValueOnce({
							done: false,
							value: { choices: [{ delta: { content: testContent } }] },
						})
						.mockResolvedValueOnce({ done: true }),
				}),
			}
		})
		const stream = handler.createMessage("system prompt", [])
		const firstChunk = await stream.next()
		expect(firstChunk.done).toBe(false)
		expect(firstChunk.value).toEqual({ type: "text", text: testContent })
	})
	it("createMessage should yield usage data from stream", async () => {
		mockCreate.mockImplementationOnce(() => {
			return {
				[Symbol.asyncIterator]: () => ({
					next: vitest
						.fn()
						.mockResolvedValueOnce({
							done: false,
							value: { choices: [{ delta: {} }], usage: { prompt_tokens: 10, completion_tokens: 20 } },
						})
						.mockResolvedValueOnce({ done: true }),
				}),
			}
		})
		const stream = handler.createMessage("system prompt", [])
		const firstChunk = await stream.next()
		expect(firstChunk.done).toBe(false)
		expect(firstChunk.value).toMatchObject({
			type: "usage",
			inputTokens: 10,
			outputTokens: 20,
			cacheWriteTokens: 0,
			cacheReadTokens: 0,
		})
		// Check that totalCost is a number (we don't need to test the exact value as that's tested in cost.spec.ts)
		expect(typeof firstChunk.value.totalCost).toBe("number")
	})
	it("createMessage should handle cached tokens in usage data", async () => {
		mockCreate.mockImplementationOnce(() => {
			return {
				[Symbol.asyncIterator]: () => ({
					next: vitest
						.fn()
						.mockResolvedValueOnce({
							done: false,
							value: {
								choices: [{ delta: {} }],
								usage: {
									prompt_tokens: 100,
									completion_tokens: 50,
									prompt_tokens_details: {
										cached_tokens: 30,
									},
								},
							},
						})
						.mockResolvedValueOnce({ done: true }),
				}),
			}
		})
		const stream = handler.createMessage("system prompt", [])
		const firstChunk = await stream.next()
		expect(firstChunk.done).toBe(false)
		expect(firstChunk.value).toMatchObject({
			type: "usage",
			inputTokens: 100,
			outputTokens: 50,
			cacheWriteTokens: 0,
			cacheReadTokens: 30,
		})
		expect(typeof firstChunk.value.totalCost).toBe("number")
	})
	it("createMessage should pass correct parameters to Groq client", async () => {
		const modelId = "llama-3.1-8b-instant"
		const modelInfo = types_1.groqModels[modelId]
		const handlerWithModel = new groq_1.GroqHandler({ apiModelId: modelId, groqApiKey: "test-groq-api-key" })
		mockCreate.mockImplementationOnce(() => {
			return {
				[Symbol.asyncIterator]: () => ({
					async next() {
						return { done: true }
					},
				}),
			}
		})
		const systemPrompt = "Test system prompt for Groq"
		const messages = [{ role: "user", content: "Test message for Groq" }]
		const messageGenerator = handlerWithModel.createMessage(systemPrompt, messages)
		await messageGenerator.next()
		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				model: modelId,
				max_tokens: modelInfo.maxTokens,
				temperature: 0.5,
				messages: expect.arrayContaining([{ role: "system", content: systemPrompt }]),
				stream: true,
				stream_options: { include_usage: true },
			}),
			undefined,
		)
	})
})
//# sourceMappingURL=groq.spec.js.map
