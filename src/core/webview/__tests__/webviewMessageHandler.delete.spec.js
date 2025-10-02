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
const webviewMessageHandler_1 = require("../webviewMessageHandler")
const vscode = __importStar(require("vscode"))
// Mock the saveTaskMessages function
vitest_1.vi.mock("../../task-persistence", () => ({
	saveTaskMessages: vitest_1.vi.fn(),
}))
// Mock the i18n module
vitest_1.vi.mock("../../../i18n", () => ({
	t: vitest_1.vi.fn((key) => key),
	changeLanguage: vitest_1.vi.fn(),
}))
vitest_1.vi.mock("vscode", () => ({
	window: {
		showErrorMessage: vitest_1.vi.fn(),
		showWarningMessage: vitest_1.vi.fn(),
		showInformationMessage: vitest_1.vi.fn(),
		createTextEditorDecorationType: vitest_1.vi.fn(() => ({
			dispose: vitest_1.vi.fn(),
		})),
	},
	workspace: {
		workspaceFolders: undefined,
		getConfiguration: vitest_1.vi.fn(() => ({
			get: vitest_1.vi.fn(),
			update: vitest_1.vi.fn(),
		})),
	},
	ConfigurationTarget: {
		Global: 1,
		Workspace: 2,
		WorkspaceFolder: 3,
	},
	Uri: {
		parse: vitest_1.vi.fn((str) => ({ toString: () => str })),
		file: vitest_1.vi.fn((path) => ({ fsPath: path })),
	},
	env: {
		openExternal: vitest_1.vi.fn(),
		clipboard: {
			writeText: vitest_1.vi.fn(),
		},
	},
	commands: {
		executeCommand: vitest_1.vi.fn(),
	},
}))
;(0, vitest_1.describe)("webviewMessageHandler delete functionality", () => {
	let provider
	let getCurrentTaskMock
	;(0, vitest_1.beforeEach)(() => {
		// Reset all mocks
		vitest_1.vi.clearAllMocks()
		// Create mock task
		getCurrentTaskMock = {
			clineMessages: [],
			apiConversationHistory: [],
			overwriteClineMessages: vitest_1.vi.fn(async () => {}),
			overwriteApiConversationHistory: vitest_1.vi.fn(async () => {}),
			taskId: "test-task-id",
		}
		// Create mock provider
		provider = {
			getCurrentTask: vitest_1.vi.fn(() => getCurrentTaskMock),
			postMessageToWebview: vitest_1.vi.fn(),
			contextProxy: {
				getValue: vitest_1.vi.fn(),
				setValue: vitest_1.vi.fn(async () => {}),
				globalStorageUri: { fsPath: "/test/path" },
			},
			log: vitest_1.vi.fn(),
			cwd: "/test/cwd",
		}
	})
	;(0, vitest_1.describe)("handleDeleteMessageConfirm", () => {
		;(0, vitest_1.it)(
			"should handle deletion when apiConversationHistoryIndex is -1 (message not in API history)",
			async () => {
				// Setup test data with a user message and assistant response
				const userMessageTs = 1000
				const assistantMessageTs = 1001
				getCurrentTaskMock.clineMessages = [
					{ ts: userMessageTs, say: "user", text: "Hello" },
					{ ts: assistantMessageTs, say: "assistant", text: "Hi there" },
				]
				// API history has the assistant message but not the user message
				// This simulates the case where the user message wasn't in API history
				getCurrentTaskMock.apiConversationHistory = [
					{ ts: assistantMessageTs, role: "assistant", content: { type: "text", text: "Hi there" } },
					{
						ts: 1002,
						role: "assistant",
						content: { type: "text", text: "attempt_completion" },
						name: "attempt_completion",
					},
				]
				// Call delete for the user message
				await (0, webviewMessageHandler_1.webviewMessageHandler)(provider, {
					type: "deleteMessageConfirm",
					messageTs: userMessageTs,
				})
				// Verify that clineMessages was truncated at the correct index
				;(0, vitest_1.expect)(getCurrentTaskMock.overwriteClineMessages).toHaveBeenCalledWith([])
				// When message is not found in API history (index is -1),
				// API history should be truncated from the first API message at/after the deleted timestamp (fallback)
				;(0, vitest_1.expect)(getCurrentTaskMock.overwriteApiConversationHistory).toHaveBeenCalledWith([])
			},
		)
		;(0, vitest_1.it)("should handle deletion when exact apiConversationHistoryIndex is found", async () => {
			// Setup test data where message exists in both arrays
			const messageTs = 1000
			getCurrentTaskMock.clineMessages = [
				{ ts: 900, say: "user", text: "Previous message" },
				{ ts: messageTs, say: "user", text: "Delete this" },
				{ ts: 1100, say: "assistant", text: "Response" },
			]
			getCurrentTaskMock.apiConversationHistory = [
				{ ts: 900, role: "user", content: { type: "text", text: "Previous message" } },
				{ ts: messageTs, role: "user", content: { type: "text", text: "Delete this" } },
				{ ts: 1100, role: "assistant", content: { type: "text", text: "Response" } },
			]
			// Call delete
			await (0, webviewMessageHandler_1.webviewMessageHandler)(provider, {
				type: "deleteMessageConfirm",
				messageTs: messageTs,
			})
			// Verify truncation at correct indices
			;(0, vitest_1.expect)(getCurrentTaskMock.overwriteClineMessages).toHaveBeenCalledWith([
				{ ts: 900, say: "user", text: "Previous message" },
			])
			;(0, vitest_1.expect)(getCurrentTaskMock.overwriteApiConversationHistory).toHaveBeenCalledWith([
				{ ts: 900, role: "user", content: { type: "text", text: "Previous message" } },
			])
		})
		;(0, vitest_1.it)("should handle deletion when message not found in clineMessages", async () => {
			getCurrentTaskMock.clineMessages = [{ ts: 1000, say: "user", text: "Some message" }]
			getCurrentTaskMock.apiConversationHistory = []
			// Call delete with non-existent timestamp
			await (0, webviewMessageHandler_1.webviewMessageHandler)(provider, {
				type: "deleteMessageConfirm",
				messageTs: 9999,
			})
			// Verify error message was shown (expecting translation key since t() is mocked to return the key)
			;(0, vitest_1.expect)(vscode.window.showErrorMessage).toHaveBeenCalledWith(
				"common:errors.message.message_not_found",
			)
			// Verify no truncation occurred
			;(0, vitest_1.expect)(getCurrentTaskMock.overwriteClineMessages).not.toHaveBeenCalled()
			;(0, vitest_1.expect)(getCurrentTaskMock.overwriteApiConversationHistory).not.toHaveBeenCalled()
		})
		;(0, vitest_1.it)("should handle deletion with attempt_completion in API history", async () => {
			// Setup test data with attempt_completion
			const userMessageTs = 1000
			const attemptCompletionTs = 1001
			getCurrentTaskMock.clineMessages = [
				{ ts: userMessageTs, say: "user", text: "Fix the bug" },
				{ ts: attemptCompletionTs, say: "assistant", text: "I've fixed the bug" },
			]
			// API history has attempt_completion but user message is missing
			getCurrentTaskMock.apiConversationHistory = [
				{
					ts: attemptCompletionTs,
					role: "assistant",
					content: {
						type: "text",
						text: "I've fixed the bug in the code",
					},
					name: "attempt_completion",
				},
				{
					ts: 1002,
					role: "user",
					content: { type: "text", text: "Looks good, but..." },
				},
			]
			// Call delete for the user message
			await (0, webviewMessageHandler_1.webviewMessageHandler)(provider, {
				type: "deleteMessageConfirm",
				messageTs: userMessageTs,
			})
			// Verify that clineMessages was truncated
			;(0, vitest_1.expect)(getCurrentTaskMock.overwriteClineMessages).toHaveBeenCalledWith([])
			// API history should be truncated from first message at/after deleted timestamp (fallback)
			;(0, vitest_1.expect)(getCurrentTaskMock.overwriteApiConversationHistory).toHaveBeenCalledWith([])
		})
		;(0, vitest_1.it)("should preserve messages before the deleted one", async () => {
			const messageTs = 2000
			getCurrentTaskMock.clineMessages = [
				{ ts: 1000, say: "user", text: "First message" },
				{ ts: 1500, say: "assistant", text: "First response" },
				{ ts: messageTs, say: "user", text: "Delete this" },
				{ ts: 2500, say: "assistant", text: "Response to delete" },
			]
			getCurrentTaskMock.apiConversationHistory = [
				{ ts: 1000, role: "user", content: { type: "text", text: "First message" } },
				{ ts: 1500, role: "assistant", content: { type: "text", text: "First response" } },
				{ ts: messageTs, role: "user", content: { type: "text", text: "Delete this" } },
				{ ts: 2500, role: "assistant", content: { type: "text", text: "Response to delete" } },
			]
			await (0, webviewMessageHandler_1.webviewMessageHandler)(provider, {
				type: "deleteMessageConfirm",
				messageTs: messageTs,
			})
			// Should preserve messages before the deleted one
			;(0, vitest_1.expect)(getCurrentTaskMock.overwriteClineMessages).toHaveBeenCalledWith([
				{ ts: 1000, say: "user", text: "First message" },
				{ ts: 1500, say: "assistant", text: "First response" },
			])
			// API history should be truncated at the exact index
			;(0, vitest_1.expect)(getCurrentTaskMock.overwriteApiConversationHistory).toHaveBeenCalledWith([
				{ ts: 1000, role: "user", content: { type: "text", text: "First message" } },
				{ ts: 1500, role: "assistant", content: { type: "text", text: "First response" } },
			])
		})
	})
})
//# sourceMappingURL=webviewMessageHandler.delete.spec.js.map
