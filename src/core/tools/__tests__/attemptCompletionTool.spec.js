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
// Mock the formatResponse module before importing the tool
vi.mock("../../prompts/responses", () => ({
	formatResponse: {
		toolError: vi.fn((msg) => `Error: ${msg}`),
	},
}))
// Mock vscode module
vi.mock("vscode", () => ({
	workspace: {
		getConfiguration: vi.fn(() => ({
			get: vi.fn(),
		})),
	},
	// kilocode_change start
	window: {
		createTextEditorDecorationType: vi.fn(() => ({ dispose: vi.fn() })),
	},
	// kilocode_change end
}))
// Mock Package module
vi.mock("../../../shared/package", () => ({
	Package: {
		name: "kilo-code",
	},
}))
const attemptCompletionTool_1 = require("../attemptCompletionTool")
const vscode = __importStar(require("vscode"))
describe("attemptCompletionTool", () => {
	let mockTask
	let mockPushToolResult
	let mockAskApproval
	let mockHandleError
	let mockRemoveClosingTag
	let mockToolDescription
	let mockAskFinishSubTaskApproval
	let mockGetConfiguration
	beforeEach(() => {
		mockPushToolResult = vi.fn()
		mockAskApproval = vi.fn()
		mockHandleError = vi.fn()
		mockRemoveClosingTag = vi.fn()
		mockToolDescription = vi.fn()
		mockAskFinishSubTaskApproval = vi.fn()
		mockGetConfiguration = vi.fn(() => ({
			get: vi.fn((key, defaultValue) => {
				if (key === "preventCompletionWithOpenTodos") {
					return defaultValue // Default to false unless overridden in test
				}
				return defaultValue
			}),
		}))
		// Setup vscode mock
		vi.mocked(vscode.workspace.getConfiguration).mockImplementation(mockGetConfiguration)
		mockTask = {
			consecutiveMistakeCount: 0,
			recordToolError: vi.fn(),
			todoList: undefined,
		}
	})
	describe("todo list validation", () => {
		it("should allow completion when there is no todo list", async () => {
			const block = {
				type: "tool_use",
				name: "attempt_completion",
				params: { result: "Task completed successfully" },
				partial: false,
			}
			mockTask.todoList = undefined
			await (0, attemptCompletionTool_1.attemptCompletionTool)(
				mockTask,
				block,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
				mockToolDescription,
				mockAskFinishSubTaskApproval,
			)
			// Should not call pushToolResult with an error for empty todo list
			expect(mockTask.consecutiveMistakeCount).toBe(0)
			expect(mockTask.recordToolError).not.toHaveBeenCalled()
		})
		it("should allow completion when todo list is empty", async () => {
			const block = {
				type: "tool_use",
				name: "attempt_completion",
				params: { result: "Task completed successfully" },
				partial: false,
			}
			mockTask.todoList = []
			await (0, attemptCompletionTool_1.attemptCompletionTool)(
				mockTask,
				block,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
				mockToolDescription,
				mockAskFinishSubTaskApproval,
			)
			expect(mockTask.consecutiveMistakeCount).toBe(0)
			expect(mockTask.recordToolError).not.toHaveBeenCalled()
		})
		it("should allow completion when all todos are completed", async () => {
			const block = {
				type: "tool_use",
				name: "attempt_completion",
				params: { result: "Task completed successfully" },
				partial: false,
			}
			const completedTodos = [
				{ id: "1", content: "First task", status: "completed" },
				{ id: "2", content: "Second task", status: "completed" },
			]
			mockTask.todoList = completedTodos
			await (0, attemptCompletionTool_1.attemptCompletionTool)(
				mockTask,
				block,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
				mockToolDescription,
				mockAskFinishSubTaskApproval,
			)
			expect(mockTask.consecutiveMistakeCount).toBe(0)
			expect(mockTask.recordToolError).not.toHaveBeenCalled()
		})
		it("should prevent completion when there are pending todos", async () => {
			const block = {
				type: "tool_use",
				name: "attempt_completion",
				params: { result: "Task completed successfully" },
				partial: false,
			}
			const todosWithPending = [
				{ id: "1", content: "First task", status: "completed" },
				{ id: "2", content: "Second task", status: "pending" },
			]
			mockTask.todoList = todosWithPending
			// Enable the setting to prevent completion with open todos
			mockGetConfiguration.mockReturnValue({
				get: vi.fn((key, defaultValue) => {
					if (key === "preventCompletionWithOpenTodos") {
						return true // Setting is enabled
					}
					return defaultValue
				}),
			})
			await (0, attemptCompletionTool_1.attemptCompletionTool)(
				mockTask,
				block,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
				mockToolDescription,
				mockAskFinishSubTaskApproval,
			)
			expect(mockTask.consecutiveMistakeCount).toBe(1)
			expect(mockTask.recordToolError).toHaveBeenCalledWith("attempt_completion")
			expect(mockPushToolResult).toHaveBeenCalledWith(
				expect.stringContaining("Cannot complete task while there are incomplete todos"),
			)
		})
		it("should prevent completion when there are in-progress todos", async () => {
			const block = {
				type: "tool_use",
				name: "attempt_completion",
				params: { result: "Task completed successfully" },
				partial: false,
			}
			const todosWithInProgress = [
				{ id: "1", content: "First task", status: "completed" },
				{ id: "2", content: "Second task", status: "in_progress" },
			]
			mockTask.todoList = todosWithInProgress
			// Enable the setting to prevent completion with open todos
			mockGetConfiguration.mockReturnValue({
				get: vi.fn((key, defaultValue) => {
					if (key === "preventCompletionWithOpenTodos") {
						return true // Setting is enabled
					}
					return defaultValue
				}),
			})
			await (0, attemptCompletionTool_1.attemptCompletionTool)(
				mockTask,
				block,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
				mockToolDescription,
				mockAskFinishSubTaskApproval,
			)
			expect(mockTask.consecutiveMistakeCount).toBe(1)
			expect(mockTask.recordToolError).toHaveBeenCalledWith("attempt_completion")
			expect(mockPushToolResult).toHaveBeenCalledWith(
				expect.stringContaining("Cannot complete task while there are incomplete todos"),
			)
		})
		it("should prevent completion when there are mixed incomplete todos", async () => {
			const block = {
				type: "tool_use",
				name: "attempt_completion",
				params: { result: "Task completed successfully" },
				partial: false,
			}
			const mixedTodos = [
				{ id: "1", content: "First task", status: "completed" },
				{ id: "2", content: "Second task", status: "pending" },
				{ id: "3", content: "Third task", status: "in_progress" },
			]
			mockTask.todoList = mixedTodos
			// Enable the setting to prevent completion with open todos
			mockGetConfiguration.mockReturnValue({
				get: vi.fn((key, defaultValue) => {
					if (key === "preventCompletionWithOpenTodos") {
						return true // Setting is enabled
					}
					return defaultValue
				}),
			})
			await (0, attemptCompletionTool_1.attemptCompletionTool)(
				mockTask,
				block,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
				mockToolDescription,
				mockAskFinishSubTaskApproval,
			)
			expect(mockTask.consecutiveMistakeCount).toBe(1)
			expect(mockTask.recordToolError).toHaveBeenCalledWith("attempt_completion")
			expect(mockPushToolResult).toHaveBeenCalledWith(
				expect.stringContaining("Cannot complete task while there are incomplete todos"),
			)
		})
		it("should allow completion when setting is disabled even with incomplete todos", async () => {
			const block = {
				type: "tool_use",
				name: "attempt_completion",
				params: { result: "Task completed successfully" },
				partial: false,
			}
			const todosWithPending = [
				{ id: "1", content: "First task", status: "completed" },
				{ id: "2", content: "Second task", status: "pending" },
			]
			mockTask.todoList = todosWithPending
			// Ensure the setting is disabled (default behavior)
			mockGetConfiguration.mockReturnValue({
				get: vi.fn((key, defaultValue) => {
					if (key === "preventCompletionWithOpenTodos") {
						return false // Setting is disabled
					}
					return defaultValue
				}),
			})
			await (0, attemptCompletionTool_1.attemptCompletionTool)(
				mockTask,
				block,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
				mockToolDescription,
				mockAskFinishSubTaskApproval,
			)
			// Should not prevent completion when setting is disabled
			expect(mockTask.consecutiveMistakeCount).toBe(0)
			expect(mockTask.recordToolError).not.toHaveBeenCalled()
			expect(mockPushToolResult).not.toHaveBeenCalledWith(
				expect.stringContaining("Cannot complete task while there are incomplete todos"),
			)
		})
		it("should prevent completion when setting is enabled with incomplete todos", async () => {
			const block = {
				type: "tool_use",
				name: "attempt_completion",
				params: { result: "Task completed successfully" },
				partial: false,
			}
			const todosWithPending = [
				{ id: "1", content: "First task", status: "completed" },
				{ id: "2", content: "Second task", status: "pending" },
			]
			mockTask.todoList = todosWithPending
			// Enable the setting
			mockGetConfiguration.mockReturnValue({
				get: vi.fn((key, defaultValue) => {
					if (key === "preventCompletionWithOpenTodos") {
						return true // Setting is enabled
					}
					return defaultValue
				}),
			})
			await (0, attemptCompletionTool_1.attemptCompletionTool)(
				mockTask,
				block,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
				mockToolDescription,
				mockAskFinishSubTaskApproval,
			)
			// Should prevent completion when setting is enabled and there are incomplete todos
			expect(mockTask.consecutiveMistakeCount).toBe(1)
			expect(mockTask.recordToolError).toHaveBeenCalledWith("attempt_completion")
			expect(mockPushToolResult).toHaveBeenCalledWith(
				expect.stringContaining("Cannot complete task while there are incomplete todos"),
			)
		})
		it("should allow completion when setting is enabled but all todos are completed", async () => {
			const block = {
				type: "tool_use",
				name: "attempt_completion",
				params: { result: "Task completed successfully" },
				partial: false,
			}
			const completedTodos = [
				{ id: "1", content: "First task", status: "completed" },
				{ id: "2", content: "Second task", status: "completed" },
			]
			mockTask.todoList = completedTodos
			// Enable the setting
			mockGetConfiguration.mockReturnValue({
				get: vi.fn((key, defaultValue) => {
					if (key === "preventCompletionWithOpenTodos") {
						return true // Setting is enabled
					}
					return defaultValue
				}),
			})
			await (0, attemptCompletionTool_1.attemptCompletionTool)(
				mockTask,
				block,
				mockAskApproval,
				mockHandleError,
				mockPushToolResult,
				mockRemoveClosingTag,
				mockToolDescription,
				mockAskFinishSubTaskApproval,
			)
			// Should allow completion when setting is enabled but all todos are completed
			expect(mockTask.consecutiveMistakeCount).toBe(0)
			expect(mockTask.recordToolError).not.toHaveBeenCalled()
			expect(mockPushToolResult).not.toHaveBeenCalledWith(
				expect.stringContaining("Cannot complete task while there are incomplete todos"),
			)
		})
	})
})
//# sourceMappingURL=attemptCompletionTool.spec.js.map
