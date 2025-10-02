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
Object.defineProperty(exports, "__esModule", { value: true })
// Mocks must come first, before imports
vi.mock("vscode", () => {
	class MockLanguageModelTextPart {
		constructor(value) {
			Object.defineProperty(this, "value", {
				enumerable: true,
				configurable: true,
				writable: true,
				value: value,
			})
			Object.defineProperty(this, "type", {
				enumerable: true,
				configurable: true,
				writable: true,
				value: "text",
			})
		}
	}
	class MockLanguageModelToolCallPart {
		constructor(callId, name, input) {
			Object.defineProperty(this, "callId", {
				enumerable: true,
				configurable: true,
				writable: true,
				value: callId,
			})
			Object.defineProperty(this, "name", {
				enumerable: true,
				configurable: true,
				writable: true,
				value: name,
			})
			Object.defineProperty(this, "input", {
				enumerable: true,
				configurable: true,
				writable: true,
				value: input,
			})
			Object.defineProperty(this, "type", {
				enumerable: true,
				configurable: true,
				writable: true,
				value: "tool_call",
			})
		}
	}
	return {
		workspace: {
			onDidChangeConfiguration: vi.fn((_callback) => ({
				dispose: vi.fn(),
			})),
		},
		CancellationTokenSource: vi.fn(() => ({
			token: {
				isCancellationRequested: false,
				onCancellationRequested: vi.fn(),
			},
			cancel: vi.fn(),
			dispose: vi.fn(),
		})),
		CancellationError: class CancellationError extends Error {
			constructor() {
				super("Operation cancelled")
				this.name = "CancellationError"
			}
		},
		LanguageModelChatMessage: {
			Assistant: vi.fn((content) => ({
				role: "assistant",
				content: Array.isArray(content) ? content : [new MockLanguageModelTextPart(content)],
			})),
			User: vi.fn((content) => ({
				role: "user",
				content: Array.isArray(content) ? content : [new MockLanguageModelTextPart(content)],
			})),
		},
		LanguageModelTextPart: MockLanguageModelTextPart,
		LanguageModelToolCallPart: MockLanguageModelToolCallPart,
		lm: {
			selectChatModels: vi.fn(),
		},
	}
})
const vscode = __importStar(require("vscode"))
const vscode_lm_1 = require("../vscode-lm")
const mockLanguageModelChat = {
	id: "test-model",
	name: "Test Model",
	vendor: "test-vendor",
	family: "test-family",
	version: "1.0",
	maxInputTokens: 4096,
	sendRequest: vi.fn(),
	countTokens: vi.fn(),
}
describe("VsCodeLmHandler", () => {
	let handler
	const defaultOptions = {
		vsCodeLmModelSelector: {
			vendor: "test-vendor",
			family: "test-family",
		},
	}
	beforeEach(() => {
		vi.clearAllMocks()
		handler = new vscode_lm_1.VsCodeLmHandler(defaultOptions)
	})
	afterEach(() => {
		handler.dispose()
	})
	describe("constructor", () => {
		it("should initialize with provided options", () => {
			expect(handler).toBeDefined()
			expect(vscode.workspace.onDidChangeConfiguration).toHaveBeenCalled()
		})
		it("should handle configuration changes", () => {
			const callback = vscode.workspace.onDidChangeConfiguration.mock.calls[0][0]
			callback({ affectsConfiguration: () => true })
			// Should reset client when config changes
			expect(handler["client"]).toBeNull()
		})
	})
	describe("createClient", () => {
		it("should create client with selector", async () => {
			const mockModel = { ...mockLanguageModelChat }
			vscode.lm.selectChatModels.mockResolvedValueOnce([mockModel])
			const client = await handler["createClient"]({
				vendor: "test-vendor",
				family: "test-family",
			})
			expect(client).toBeDefined()
			expect(client.id).toBe("test-model")
			expect(vscode.lm.selectChatModels).toHaveBeenCalledWith({
				vendor: "test-vendor",
				family: "test-family",
			})
		})
		it("should return default client when no models available", async () => {
			vscode.lm.selectChatModels.mockResolvedValueOnce([])
			const client = await handler["createClient"]({})
			expect(client).toBeDefined()
			expect(client.id).toBe("default-lm")
			expect(client.vendor).toBe("vscode")
		})
	})
	describe("createMessage", () => {
		beforeEach(() => {
			const mockModel = { ...mockLanguageModelChat }
			vscode.lm.selectChatModels.mockResolvedValueOnce([mockModel])
			mockLanguageModelChat.countTokens.mockResolvedValue(10)
			// Override the default client with our test client
			handler["client"] = mockLanguageModelChat
		})
		it("should stream text responses", async () => {
			const systemPrompt = "You are a helpful assistant"
			const messages = [
				{
					role: "user",
					content: "Hello",
				},
			]
			const responseText = "Hello! How can I help you?"
			mockLanguageModelChat.sendRequest.mockResolvedValueOnce({
				stream: (async function* () {
					yield new vscode.LanguageModelTextPart(responseText)
					return
				})(),
				text: (async function* () {
					yield responseText
					return
				})(),
			})
			const stream = handler.createMessage(systemPrompt, messages)
			const chunks = []
			for await (const chunk of stream) {
				chunks.push(chunk)
			}
			expect(chunks).toHaveLength(2) // Text chunk + usage chunk
			expect(chunks[0]).toEqual({
				type: "text",
				text: responseText,
			})
			expect(chunks[1]).toMatchObject({
				type: "usage",
				inputTokens: expect.any(Number),
				outputTokens: expect.any(Number),
			})
		})
		it("should handle tool calls", async () => {
			const systemPrompt = "You are a helpful assistant"
			const messages = [
				{
					role: "user",
					content: "Calculate 2+2",
				},
			]
			const toolCallData = {
				name: "calculator",
				arguments: { operation: "add", numbers: [2, 2] },
				callId: "call-1",
			}
			mockLanguageModelChat.sendRequest.mockResolvedValueOnce({
				stream: (async function* () {
					yield new vscode.LanguageModelToolCallPart(
						toolCallData.callId,
						toolCallData.name,
						toolCallData.arguments,
					)
					return
				})(),
				text: (async function* () {
					yield JSON.stringify({ type: "tool_call", ...toolCallData })
					return
				})(),
			})
			const stream = handler.createMessage(systemPrompt, messages)
			const chunks = []
			for await (const chunk of stream) {
				chunks.push(chunk)
			}
			expect(chunks).toHaveLength(2) // Tool call chunk + usage chunk
			expect(chunks[0]).toEqual({
				type: "text",
				text: JSON.stringify({ type: "tool_call", ...toolCallData }),
			})
		})
		it("should handle errors", async () => {
			const systemPrompt = "You are a helpful assistant"
			const messages = [
				{
					role: "user",
					content: "Hello",
				},
			]
			mockLanguageModelChat.sendRequest.mockRejectedValueOnce(new Error("API Error"))
			await expect(handler.createMessage(systemPrompt, messages).next()).rejects.toThrow("API Error")
		})
	})
	describe("getModel", () => {
		it("should return model info when client exists", async () => {
			const mockModel = { ...mockLanguageModelChat }
			vscode.lm.selectChatModels.mockResolvedValueOnce([mockModel])
			// Initialize client
			await handler["getClient"]()
			const model = handler.getModel()
			expect(model.id).toBe("test-model")
			expect(model.info).toBeDefined()
			expect(model.info.contextWindow).toBe(4096)
		})
		it("should return fallback model info when no client exists", () => {
			// Clear the client first
			handler["client"] = null
			const model = handler.getModel()
			expect(model.id).toBe("test-vendor/test-family")
			expect(model.info).toBeDefined()
		})
	})
	describe("completePrompt", () => {
		it("should complete single prompt", async () => {
			const mockModel = { ...mockLanguageModelChat }
			vscode.lm.selectChatModels.mockResolvedValueOnce([mockModel])
			const responseText = "Completed text"
			mockLanguageModelChat.sendRequest.mockResolvedValueOnce({
				stream: (async function* () {
					yield new vscode.LanguageModelTextPart(responseText)
					return
				})(),
				text: (async function* () {
					yield responseText
					return
				})(),
			})
			// Override the default client with our test client to ensure it uses
			// the mock implementation rather than the default fallback
			handler["client"] = mockLanguageModelChat
			const result = await handler.completePrompt("Test prompt")
			expect(result).toBe(responseText)
			expect(mockLanguageModelChat.sendRequest).toHaveBeenCalled()
		})
		it("should handle errors during completion", async () => {
			const mockModel = { ...mockLanguageModelChat }
			vscode.lm.selectChatModels.mockResolvedValueOnce([mockModel])
			mockLanguageModelChat.sendRequest.mockRejectedValueOnce(new Error("Completion failed"))
			// Make sure we're using the mock client
			handler["client"] = mockLanguageModelChat
			const promise = handler.completePrompt("Test prompt")
			await expect(promise).rejects.toThrow("VSCode LM completion error: Completion failed")
		})
	})
})
//# sourceMappingURL=vscode-lm.spec.js.map
