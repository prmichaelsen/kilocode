"use strict"
// npx vitest run src/api/providers/__tests__/vercel-ai-gateway.spec.ts
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
// Mock vscode first to avoid import errors
vitest.mock("vscode", () => ({}))
const openai_1 = __importDefault(require("openai"))
const vercel_ai_gateway_1 = require("../vercel-ai-gateway")
const types_1 = require("@roo-code/types")
// Mock dependencies
vitest.mock("openai")
vitest.mock("delay", () => ({ default: vitest.fn(() => Promise.resolve()) }))
vitest.mock("../fetchers/modelCache", () => ({
	getModels: vitest.fn().mockImplementation(() => {
		return Promise.resolve({
			"anthropic/claude-sonnet-4": {
				maxTokens: 64000,
				contextWindow: 200000,
				supportsImages: true,
				supportsPromptCache: true,
				inputPrice: 3,
				outputPrice: 15,
				cacheWritesPrice: 3.75,
				cacheReadsPrice: 0.3,
				description: "Claude Sonnet 4",
				supportsComputerUse: true,
			},
			"anthropic/claude-3.5-haiku": {
				maxTokens: 32000,
				contextWindow: 200000,
				supportsImages: true,
				supportsPromptCache: true,
				inputPrice: 1,
				outputPrice: 5,
				cacheWritesPrice: 1.25,
				cacheReadsPrice: 0.1,
				description: "Claude 3.5 Haiku",
				supportsComputerUse: false,
			},
			"openai/gpt-4o": {
				maxTokens: 16000,
				contextWindow: 128000,
				supportsImages: true,
				supportsPromptCache: true,
				inputPrice: 2.5,
				outputPrice: 10,
				cacheWritesPrice: 3.125,
				cacheReadsPrice: 0.25,
				description: "GPT-4o",
				supportsComputerUse: true,
			},
		})
	}),
}))
vitest.mock("../../transform/caching/vercel-ai-gateway", () => ({
	addCacheBreakpoints: vitest.fn(),
}))
const mockCreate = vitest.fn()
const mockConstructor = vitest.fn()
openai_1.default.mockImplementation(() => ({
	chat: {
		completions: {
			create: mockCreate,
		},
	},
}))
openai_1.default.mockImplementation = mockConstructor.mockReturnValue({
	chat: {
		completions: {
			create: mockCreate,
		},
	},
})
describe("VercelAiGatewayHandler", () => {
	const mockOptions = {
		vercelAiGatewayApiKey: "test-key",
		vercelAiGatewayModelId: "anthropic/claude-sonnet-4",
	}
	beforeEach(() => {
		vitest.clearAllMocks()
		mockCreate.mockClear()
		mockConstructor.mockClear()
	})
	it("initializes with correct options", () => {
		const handler = new vercel_ai_gateway_1.VercelAiGatewayHandler(mockOptions)
		expect(handler).toBeInstanceOf(vercel_ai_gateway_1.VercelAiGatewayHandler)
		expect(openai_1.default).toHaveBeenCalledWith({
			baseURL: "https://ai-gateway.vercel.sh/v1",
			apiKey: mockOptions.vercelAiGatewayApiKey,
			// kilocode_change start
			defaultHeaders: expect.objectContaining({
				"HTTP-Referer": "https://kilocode.ai",
				"X-Title": "Kilo Code",
				"User-Agent": expect.stringContaining("Kilo-Code/"),
			}),
			// kilocode_change end
		})
	})
	describe("fetchModel", () => {
		it("returns correct model info when options are provided", async () => {
			const handler = new vercel_ai_gateway_1.VercelAiGatewayHandler(mockOptions)
			const result = await handler.fetchModel()
			expect(result.id).toBe(mockOptions.vercelAiGatewayModelId)
			expect(result.info.maxTokens).toBe(64000)
			expect(result.info.contextWindow).toBe(200000)
			expect(result.info.supportsImages).toBe(true)
			expect(result.info.supportsPromptCache).toBe(true)
			expect(result.info.supportsComputerUse).toBe(true)
		})
		it("returns default model info when options are not provided", async () => {
			const handler = new vercel_ai_gateway_1.VercelAiGatewayHandler({})
			const result = await handler.fetchModel()
			expect(result.id).toBe(types_1.vercelAiGatewayDefaultModelId)
			expect(result.info.supportsPromptCache).toBe(true)
		})
		it("uses vercel ai gateway default model when no model specified", async () => {
			const handler = new vercel_ai_gateway_1.VercelAiGatewayHandler({ vercelAiGatewayApiKey: "test-key" })
			const result = await handler.fetchModel()
			expect(result.id).toBe("anthropic/claude-sonnet-4")
		})
	})
	describe("createMessage", () => {
		beforeEach(() => {
			mockCreate.mockImplementation(async () => ({
				[Symbol.asyncIterator]: async function* () {
					yield {
						choices: [
							{
								delta: { content: "Test response" },
								index: 0,
							},
						],
						usage: null,
					}
					yield {
						choices: [
							{
								delta: {},
								index: 0,
							},
						],
						usage: {
							prompt_tokens: 10,
							completion_tokens: 5,
							total_tokens: 15,
							cache_creation_input_tokens: 2,
							prompt_tokens_details: {
								cached_tokens: 3,
							},
							cost: 0.005,
						},
					}
				},
			}))
		})
		it("streams text content correctly", async () => {
			const handler = new vercel_ai_gateway_1.VercelAiGatewayHandler(mockOptions)
			const systemPrompt = "You are a helpful assistant."
			const messages = [{ role: "user", content: "Hello" }]
			const stream = handler.createMessage(systemPrompt, messages)
			const chunks = []
			for await (const chunk of stream) {
				chunks.push(chunk)
			}
			expect(chunks).toHaveLength(2)
			expect(chunks[0]).toEqual({
				type: "text",
				text: "Test response",
			})
			expect(chunks[1]).toEqual({
				type: "usage",
				inputTokens: 10,
				outputTokens: 5,
				cacheWriteTokens: 2,
				cacheReadTokens: 3,
				totalCost: 0.005,
			})
		})
		it("uses correct temperature from options", async () => {
			const customTemp = 0.5
			const handler = new vercel_ai_gateway_1.VercelAiGatewayHandler({
				...mockOptions,
				modelTemperature: customTemp,
			})
			const systemPrompt = "You are a helpful assistant."
			const messages = [{ role: "user", content: "Hello" }]
			await handler.createMessage(systemPrompt, messages).next()
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					temperature: customTemp,
				}),
			)
		})
		it("uses default temperature when none provided", async () => {
			const handler = new vercel_ai_gateway_1.VercelAiGatewayHandler(mockOptions)
			const systemPrompt = "You are a helpful assistant."
			const messages = [{ role: "user", content: "Hello" }]
			await handler.createMessage(systemPrompt, messages).next()
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					temperature: types_1.VERCEL_AI_GATEWAY_DEFAULT_TEMPERATURE,
				}),
			)
		})
		it("adds cache breakpoints for supported models", async () => {
			const { addCacheBreakpoints } = await Promise.resolve().then(() =>
				__importStar(require("../../transform/caching/vercel-ai-gateway")),
			)
			const handler = new vercel_ai_gateway_1.VercelAiGatewayHandler({
				...mockOptions,
				vercelAiGatewayModelId: "anthropic/claude-3.5-haiku",
			})
			const systemPrompt = "You are a helpful assistant."
			const messages = [{ role: "user", content: "Hello" }]
			await handler.createMessage(systemPrompt, messages).next()
			expect(addCacheBreakpoints).toHaveBeenCalled()
		})
		it("sets correct max_completion_tokens", async () => {
			const handler = new vercel_ai_gateway_1.VercelAiGatewayHandler(mockOptions)
			const systemPrompt = "You are a helpful assistant."
			const messages = [{ role: "user", content: "Hello" }]
			await handler.createMessage(systemPrompt, messages).next()
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					max_completion_tokens: 64000, // max tokens for sonnet 4
				}),
			)
		})
		it("handles usage info correctly with all Vercel AI Gateway specific fields", async () => {
			const handler = new vercel_ai_gateway_1.VercelAiGatewayHandler(mockOptions)
			const systemPrompt = "You are a helpful assistant."
			const messages = [{ role: "user", content: "Hello" }]
			const stream = handler.createMessage(systemPrompt, messages)
			const chunks = []
			for await (const chunk of stream) {
				chunks.push(chunk)
			}
			const usageChunk = chunks.find((chunk) => chunk.type === "usage")
			expect(usageChunk).toEqual({
				type: "usage",
				inputTokens: 10,
				outputTokens: 5,
				cacheWriteTokens: 2,
				cacheReadTokens: 3,
				totalCost: 0.005,
			})
		})
	})
	describe("completePrompt", () => {
		beforeEach(() => {
			mockCreate.mockImplementation(async () => ({
				choices: [
					{
						message: { role: "assistant", content: "Test completion response" },
						finish_reason: "stop",
						index: 0,
					},
				],
				usage: {
					prompt_tokens: 8,
					completion_tokens: 4,
					total_tokens: 12,
				},
			}))
		})
		it("completes prompt correctly", async () => {
			const handler = new vercel_ai_gateway_1.VercelAiGatewayHandler(mockOptions)
			const prompt = "Complete this: Hello"
			const result = await handler.completePrompt(prompt)
			expect(result).toBe("Test completion response")
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					model: "anthropic/claude-sonnet-4",
					messages: [{ role: "user", content: prompt }],
					stream: false,
					temperature: types_1.VERCEL_AI_GATEWAY_DEFAULT_TEMPERATURE,
					max_completion_tokens: 64000,
				}),
			)
		})
		it("uses custom temperature for completion", async () => {
			const customTemp = 0.8
			const handler = new vercel_ai_gateway_1.VercelAiGatewayHandler({
				...mockOptions,
				modelTemperature: customTemp,
			})
			await handler.completePrompt("Test prompt")
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					temperature: customTemp,
				}),
			)
		})
		it("handles completion errors correctly", async () => {
			const handler = new vercel_ai_gateway_1.VercelAiGatewayHandler(mockOptions)
			const errorMessage = "API error"
			mockCreate.mockImplementation(() => {
				throw new Error(errorMessage)
			})
			await expect(handler.completePrompt("Test")).rejects.toThrow(
				`Vercel AI Gateway completion error: ${errorMessage}`,
			)
		})
		it("returns empty string when no content in response", async () => {
			const handler = new vercel_ai_gateway_1.VercelAiGatewayHandler(mockOptions)
			mockCreate.mockImplementation(async () => ({
				choices: [
					{
						message: { role: "assistant", content: null },
						finish_reason: "stop",
						index: 0,
					},
				],
			}))
			const result = await handler.completePrompt("Test")
			expect(result).toBe("")
		})
	})
	describe("temperature support", () => {
		it("applies temperature for supported models", async () => {
			const handler = new vercel_ai_gateway_1.VercelAiGatewayHandler({
				...mockOptions,
				vercelAiGatewayModelId: "anthropic/claude-sonnet-4",
				modelTemperature: 0.9,
			})
			await handler.completePrompt("Test")
			expect(mockCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					temperature: 0.9,
				}),
			)
		})
	})
})
//# sourceMappingURL=vercel-ai-gateway.spec.js.map
