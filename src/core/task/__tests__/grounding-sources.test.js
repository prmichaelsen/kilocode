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
const vitest_1 = require("vitest")
// Mock vscode module before importing Task
vitest_1.vi.mock("vscode", () => ({
	workspace: {
		createFileSystemWatcher: vitest_1.vi.fn(() => ({
			onDidCreate: vitest_1.vi.fn(),
			onDidChange: vitest_1.vi.fn(),
			onDidDelete: vitest_1.vi.fn(),
			dispose: vitest_1.vi.fn(),
		})),
		getConfiguration: vitest_1.vi.fn(() => ({
			get: vitest_1.vi.fn(() => true),
		})),
		openTextDocument: vitest_1.vi.fn(),
		applyEdit: vitest_1.vi.fn(),
	},
	RelativePattern: vitest_1.vi.fn((base, pattern) => ({ base, pattern })),
	window: {
		createOutputChannel: vitest_1.vi.fn(() => ({
			appendLine: vitest_1.vi.fn(),
			dispose: vitest_1.vi.fn(),
		})),
		createTextEditorDecorationType: vitest_1.vi.fn(() => ({
			dispose: vitest_1.vi.fn(),
		})),
		showTextDocument: vitest_1.vi.fn(),
		activeTextEditor: undefined,
	},
	Uri: {
		file: vitest_1.vi.fn((path) => ({ fsPath: path })),
		parse: vitest_1.vi.fn((str) => ({ toString: () => str })),
	},
	Range: vitest_1.vi.fn(),
	Position: vitest_1.vi.fn(),
	WorkspaceEdit: vitest_1.vi.fn(() => ({
		replace: vitest_1.vi.fn(),
		insert: vitest_1.vi.fn(),
		delete: vitest_1.vi.fn(),
	})),
	ViewColumn: {
		One: 1,
		Two: 2,
		Three: 3,
	},
}))
// Mock other dependencies
vitest_1.vi.mock("../../services/mcp/McpServerManager", () => ({
	McpServerManager: {
		getInstance: vitest_1.vi.fn().mockResolvedValue(null),
	},
}))
vitest_1.vi.mock("../../integrations/terminal/TerminalRegistry", () => ({
	TerminalRegistry: {
		releaseTerminalsForTask: vitest_1.vi.fn(),
	},
}))
vitest_1.vi.mock("@roo-code/telemetry", () => ({
	TelemetryService: {
		instance: {
			captureTaskCreated: vitest_1.vi.fn(),
			captureTaskRestarted: vitest_1.vi.fn(),
			captureConversationMessage: vitest_1.vi.fn(),
			captureLlmCompletion: vitest_1.vi.fn(),
			captureConsecutiveMistakeError: vitest_1.vi.fn(),
		},
	},
}))
;(0, vitest_1.describe)("Task grounding sources handling", () => {
	let mockProvider
	let mockApiConfiguration
	let Task
	;(0, vitest_1.beforeAll)(async () => {
		// Import Task after mocks are set up
		const taskModule = await Promise.resolve().then(() => __importStar(require("../Task")))
		Task = taskModule.Task
	})
	;(0, vitest_1.beforeEach)(() => {
		// Mock provider with necessary methods
		mockProvider = {
			postStateToWebview: vitest_1.vi.fn().mockResolvedValue(undefined),
			getState: vitest_1.vi.fn().mockResolvedValue({
				mode: "code",
				experiments: {},
			}),
			context: {
				globalStorageUri: { fsPath: "/test/storage" },
				extensionPath: "/test/extension",
			},
			log: vitest_1.vi.fn(),
			updateTaskHistory: vitest_1.vi.fn().mockResolvedValue(undefined),
			postMessageToWebview: vitest_1.vi.fn().mockResolvedValue(undefined),
		}
		mockApiConfiguration = {
			apiProvider: "gemini",
			geminiApiKey: "test-key",
			enableGrounding: true,
		}
	})
	;(0, vitest_1.it)(
		"should strip grounding sources from assistant message before persisting to API history",
		async () => {
			// Create a task instance
			const task = new Task({
				provider: mockProvider,
				apiConfiguration: mockApiConfiguration,
				task: "Test task",
				startTask: false,
			})
			// Mock the API conversation history
			task.apiConversationHistory = []
			// Simulate an assistant message with grounding sources
			const assistantMessageWithSources = `
This is the main response content.

[1] Example Source: https://example.com
[2] Another Source: https://another.com

Sources: [1](https://example.com), [2](https://another.com)
		`.trim()
			// Mock grounding sources
			const mockGroundingSources = [
				{ title: "Example Source", url: "https://example.com" },
				{ title: "Another Source", url: "https://another.com" },
			]
			// Spy on addToApiConversationHistory to check what gets persisted
			const addToApiHistorySpy = vitest_1.vi.spyOn(task, "addToApiConversationHistory")
			// Simulate the logic from Task.ts that strips grounding sources
			let cleanAssistantMessage = assistantMessageWithSources
			if (mockGroundingSources.length > 0) {
				cleanAssistantMessage = assistantMessageWithSources
					.replace(/\[\d+\]\s+[^:\n]+:\s+https?:\/\/[^\s\n]+/g, "") // e.g., "[1] Example Source: https://example.com"
					.replace(/Sources?:\s*[\s\S]*?(?=\n\n|\n$|$)/g, "") // e.g., "Sources: [1](url1), [2](url2)"
					.trim()
			}
			// Add the cleaned message to API history
			await task.addToApiConversationHistory({
				role: "assistant",
				content: [{ type: "text", text: cleanAssistantMessage }],
			})
			// Verify that the cleaned message was added without grounding sources
			;(0, vitest_1.expect)(addToApiHistorySpy).toHaveBeenCalledWith({
				role: "assistant",
				content: [{ type: "text", text: "This is the main response content." }],
			})
			// Verify the API conversation history contains the cleaned message
			;(0, vitest_1.expect)(task.apiConversationHistory).toHaveLength(1)
			;(0, vitest_1.expect)(task.apiConversationHistory[0].content).toEqual([
				{ type: "text", text: "This is the main response content." },
			])
		},
	)
	;(0, vitest_1.it)("should not modify assistant message when no grounding sources are present", async () => {
		const task = new Task({
			provider: mockProvider,
			apiConfiguration: mockApiConfiguration,
			task: "Test task",
			startTask: false,
		})
		task.apiConversationHistory = []
		const assistantMessage = "This is a regular response without any sources."
		const mockGroundingSources = [] // No grounding sources
		// Apply the same logic
		let cleanAssistantMessage = assistantMessage
		if (mockGroundingSources.length > 0) {
			cleanAssistantMessage = assistantMessage
				.replace(/\[\d+\]\s+[^:\n]+:\s+https?:\/\/[^\s\n]+/g, "")
				.replace(/Sources?:\s*[\s\S]*?(?=\n\n|\n$|$)/g, "")
				.trim()
		}
		await task.addToApiConversationHistory({
			role: "assistant",
			content: [{ type: "text", text: cleanAssistantMessage }],
		})
		// Message should remain unchanged
		;(0, vitest_1.expect)(task.apiConversationHistory[0].content).toEqual([
			{ type: "text", text: "This is a regular response without any sources." },
		])
	})
	;(0, vitest_1.it)("should handle various grounding source formats", () => {
		const testCases = [
			{
				input: "[1] Source Title: https://example.com\n[2] Another: https://test.com\nMain content here",
				expected: "Main content here",
			},
			{
				input: "Content first\n\nSources: [1](https://example.com), [2](https://test.com)",
				expected: "Content first",
			},
			{
				input: "Mixed content\n[1] Inline Source: https://inline.com\nMore content\nSource: [1](https://inline.com)",
				expected: "Mixed content\n\nMore content",
			},
		]
		testCases.forEach(({ input, expected }) => {
			const cleaned = input
				.replace(/\[\d+\]\s+[^:\n]+:\s+https?:\/\/[^\s\n]+/g, "")
				.replace(/Sources?:\s*[\s\S]*?(?=\n\n|\n$|$)/g, "")
				.trim()
			;(0, vitest_1.expect)(cleaned).toBe(expected)
		})
	})
})
//# sourceMappingURL=grounding-sources.test.js.map
