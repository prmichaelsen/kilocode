"use strict"
// npx vitest run src/api/providers/__tests__/zai.spec.ts
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
const zai_1 = require("../zai")
vitest.mock("openai", () => {
	const createMock = vitest.fn()
	return {
		default: vitest.fn(() => ({ chat: { completions: { create: createMock } } })),
	}
})
describe("ZAiHandler", () => {
	let handler
	let mockCreate
	beforeEach(() => {
		vitest.clearAllMocks()
		mockCreate = openai_1.default().chat.completions.create
	})
	describe("International Z AI", () => {
		beforeEach(() => {
			handler = new zai_1.ZAiHandler({ zaiApiKey: "test-zai-api-key", zaiApiLine: "international" })
		})
		it("should use the correct international Z AI base URL", () => {
			new zai_1.ZAiHandler({ zaiApiKey: "test-zai-api-key", zaiApiLine: "international" })
			expect(openai_1.default).toHaveBeenCalledWith(
				expect.objectContaining({
					baseURL: "https://api.z.ai/api/paas/v4",
				}),
			)
		})
		it("should use the provided API key for international", () => {
			const zaiApiKey = "test-zai-api-key"
			new zai_1.ZAiHandler({ zaiApiKey, zaiApiLine: "international" })
			expect(openai_1.default).toHaveBeenCalledWith(expect.objectContaining({ apiKey: zaiApiKey }))
		})
		it("should return international default model when no model is specified", () => {
			const model = handler.getModel()
			expect(model.id).toBe(types_1.internationalZAiDefaultModelId)
			expect(model.info).toEqual(types_1.internationalZAiModels[types_1.internationalZAiDefaultModelId])
		})
		it("should return specified international model when valid model is provided", () => {
			const testModelId = "glm-4.5-air"
			const handlerWithModel = new zai_1.ZAiHandler({
				apiModelId: testModelId,
				zaiApiKey: "test-zai-api-key",
				zaiApiLine: "international",
			})
			const model = handlerWithModel.getModel()
			expect(model.id).toBe(testModelId)
			expect(model.info).toEqual(types_1.internationalZAiModels[testModelId])
		})
	})
	describe("China Z AI", () => {
		beforeEach(() => {
			handler = new zai_1.ZAiHandler({ zaiApiKey: "test-zai-api-key", zaiApiLine: "china" })
		})
		it("should use the correct China Z AI base URL", () => {
			new zai_1.ZAiHandler({ zaiApiKey: "test-zai-api-key", zaiApiLine: "china" })
			expect(openai_1.default).toHaveBeenCalledWith(
				expect.objectContaining({ baseURL: "https://open.bigmodel.cn/api/paas/v4" }),
			)
		})
		it("should use the provided API key for China", () => {
			const zaiApiKey = "test-zai-api-key"
			new zai_1.ZAiHandler({ zaiApiKey, zaiApiLine: "china" })
			expect(openai_1.default).toHaveBeenCalledWith(expect.objectContaining({ apiKey: zaiApiKey }))
		})
		it("should return China default model when no model is specified", () => {
			const model = handler.getModel()
			expect(model.id).toBe(types_1.mainlandZAiDefaultModelId)
			expect(model.info).toEqual(types_1.mainlandZAiModels[types_1.mainlandZAiDefaultModelId])
		})
		it("should return specified China model when valid model is provided", () => {
			const testModelId = "glm-4.5-air"
			const handlerWithModel = new zai_1.ZAiHandler({
				apiModelId: testModelId,
				zaiApiKey: "test-zai-api-key",
				zaiApiLine: "china",
			})
			const model = handlerWithModel.getModel()
			expect(model.id).toBe(testModelId)
			expect(model.info).toEqual(types_1.mainlandZAiModels[testModelId])
		})
	})
	describe("Default behavior", () => {
		it("should default to international when no zaiApiLine is specified", () => {
			const handlerDefault = new zai_1.ZAiHandler({ zaiApiKey: "test-zai-api-key" })
			expect(openai_1.default).toHaveBeenCalledWith(
				expect.objectContaining({
					baseURL: "https://api.z.ai/api/coding/paas/v4",
				}),
			)
			const model = handlerDefault.getModel()
			expect(model.id).toBe(types_1.internationalZAiDefaultModelId)
			expect(model.info).toEqual(types_1.internationalZAiModels[types_1.internationalZAiDefaultModelId])
		})
		it("should use 'not-provided' as default API key when none is specified", () => {
			new zai_1.ZAiHandler({ zaiApiLine: "international" })
			expect(openai_1.default).toHaveBeenCalledWith(expect.objectContaining({ apiKey: "not-provided" }))
		})
	})
	describe("API Methods", () => {
		beforeEach(() => {
			handler = new zai_1.ZAiHandler({ zaiApiKey: "test-zai-api-key", zaiApiLine: "international" })
		})
		it("completePrompt method should return text from Z AI API", async () => {
			const expectedResponse = "This is a test response from Z AI"
			mockCreate.mockResolvedValueOnce({ choices: [{ message: { content: expectedResponse } }] })
			const result = await handler.completePrompt("test prompt")
			expect(result).toBe(expectedResponse)
		})
		it("should handle errors in completePrompt", async () => {
			const errorMessage = "Z AI API error"
			mockCreate.mockRejectedValueOnce(new Error(errorMessage))
			await expect(handler.completePrompt("test prompt")).rejects.toThrow(
				`Z AI completion error: ${errorMessage}`,
			)
		})
		it("createMessage should yield text content from stream", async () => {
			const testContent = "This is test content from Z AI stream"
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
								value: {
									choices: [{ delta: {} }],
									usage: { prompt_tokens: 10, completion_tokens: 20 },
								},
							})
							.mockResolvedValueOnce({ done: true }),
					}),
				}
			})
			const stream = handler.createMessage("system prompt", [])
			const firstChunk = await stream.next()
			expect(firstChunk.done).toBe(false)
			expect(firstChunk.value).toEqual({ type: "usage", inputTokens: 10, outputTokens: 20 })
		})
		it("createMessage should pass correct parameters to Z AI client", async () => {
			const modelId = "glm-4.5"
			const modelInfo = types_1.internationalZAiModels[modelId]
			const handlerWithModel = new zai_1.ZAiHandler({
				apiModelId: modelId,
				zaiApiKey: "test-zai-api-key",
				zaiApiLine: "international",
			})
			mockCreate.mockImplementationOnce(() => {
				return {
					[Symbol.asyncIterator]: () => ({
						async next() {
							return { done: true }
						},
					}),
				}
			})
			const systemPrompt = "Test system prompt for Z AI"
			const messages = [{ role: "user", content: "Test message for Z AI" }]
			const messageGenerator = handlerWithModel.createMessage(systemPrompt, messages)
			await messageGenerator.next()
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					model: modelId,
					max_tokens: modelInfo.maxTokens,
					temperature: types_1.ZAI_DEFAULT_TEMPERATURE,
					messages: expect.arrayContaining([{ role: "system", content: systemPrompt }]),
					stream: true,
					stream_options: { include_usage: true },
				}),
				undefined,
			)
		})
	})
})
//# sourceMappingURL=zai.spec.js.map
