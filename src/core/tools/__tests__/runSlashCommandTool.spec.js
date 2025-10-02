"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const vitest_1 = require("vitest")
const runSlashCommandTool_1 = require("../runSlashCommandTool")
const responses_1 = require("../../prompts/responses")
const commands_1 = require("../../../services/command/commands")
// Mock dependencies
vitest_1.vi.mock("../../../services/command/commands", () => ({
	getCommand: vitest_1.vi.fn(),
	getCommandNames: vitest_1.vi.fn(),
}))
;(0, vitest_1.describe)("runSlashCommandTool", () => {
	let mockTask
	let mockAskApproval
	let mockHandleError
	let mockPushToolResult
	let mockRemoveClosingTag
	;(0, vitest_1.beforeEach)(() => {
		vitest_1.vi.clearAllMocks()
		mockTask = {
			consecutiveMistakeCount: 0,
			recordToolError: vitest_1.vi.fn(),
			sayAndCreateMissingParamError: vitest_1.vi.fn().mockResolvedValue("Missing parameter error"),
			ask: vitest_1.vi.fn(),
			cwd: "/test/project",
			providerRef: {
				deref: vitest_1.vi.fn().mockReturnValue({
					getState: vitest_1.vi.fn().mockResolvedValue({
						experiments: {
							runSlashCommand: true,
						},
					}),
				}),
			},
		}
		mockAskApproval = vitest_1.vi.fn().mockResolvedValue(true)
		mockHandleError = vitest_1.vi.fn()
		mockPushToolResult = vitest_1.vi.fn()
		mockRemoveClosingTag = vitest_1.vi.fn((tag, text) => text || "")
	})
	;(0, vitest_1.it)("should handle missing command parameter", async () => {
		const block = {
			type: "tool_use",
			name: "run_slash_command",
			params: {},
			partial: false,
		}
		await (0, runSlashCommandTool_1.runSlashCommandTool)(
			mockTask,
			block,
			mockAskApproval,
			mockHandleError,
			mockPushToolResult,
			mockRemoveClosingTag,
		)
		;(0, vitest_1.expect)(mockTask.consecutiveMistakeCount).toBe(1)
		;(0, vitest_1.expect)(mockTask.recordToolError).toHaveBeenCalledWith("run_slash_command")
		;(0, vitest_1.expect)(mockTask.sayAndCreateMissingParamError).toHaveBeenCalledWith(
			"run_slash_command",
			"command",
		)
		;(0, vitest_1.expect)(mockPushToolResult).toHaveBeenCalledWith("Missing parameter error")
	})
	;(0, vitest_1.it)("should handle command not found", async () => {
		const block = {
			type: "tool_use",
			name: "run_slash_command",
			params: {
				command: "nonexistent",
			},
			partial: false,
		}
		vitest_1.vi.mocked(commands_1.getCommand).mockResolvedValue(undefined)
		vitest_1.vi.mocked(commands_1.getCommandNames).mockResolvedValue(["init", "test", "deploy"])
		await (0, runSlashCommandTool_1.runSlashCommandTool)(
			mockTask,
			block,
			mockAskApproval,
			mockHandleError,
			mockPushToolResult,
			mockRemoveClosingTag,
		)
		;(0, vitest_1.expect)(mockTask.recordToolError).toHaveBeenCalledWith("run_slash_command")
		;(0, vitest_1.expect)(mockPushToolResult).toHaveBeenCalledWith(
			responses_1.formatResponse.toolError(
				"Command 'nonexistent' not found. Available commands: init, test, deploy",
			),
		)
	})
	;(0, vitest_1.it)("should handle user rejection", async () => {
		const block = {
			type: "tool_use",
			name: "run_slash_command",
			params: {
				command: "init",
			},
			partial: false,
		}
		const mockCommand = {
			name: "init",
			content: "Initialize project",
			source: "built-in",
			filePath: "<built-in:init>",
			description: "Initialize the project",
		}
		vitest_1.vi.mocked(commands_1.getCommand).mockResolvedValue(mockCommand)
		mockAskApproval.mockResolvedValue(false)
		await (0, runSlashCommandTool_1.runSlashCommandTool)(
			mockTask,
			block,
			mockAskApproval,
			mockHandleError,
			mockPushToolResult,
			mockRemoveClosingTag,
		)
		;(0, vitest_1.expect)(mockAskApproval).toHaveBeenCalled()
		;(0, vitest_1.expect)(mockPushToolResult).not.toHaveBeenCalled()
	})
	;(0, vitest_1.it)("should successfully execute built-in command", async () => {
		const block = {
			type: "tool_use",
			name: "run_slash_command",
			params: {
				command: "init",
			},
			partial: false,
		}
		const mockCommand = {
			name: "init",
			content: "Initialize project content here",
			source: "built-in",
			filePath: "<built-in:init>",
			description: "Analyze codebase and create AGENTS.md",
		}
		vitest_1.vi.mocked(commands_1.getCommand).mockResolvedValue(mockCommand)
		await (0, runSlashCommandTool_1.runSlashCommandTool)(
			mockTask,
			block,
			mockAskApproval,
			mockHandleError,
			mockPushToolResult,
			mockRemoveClosingTag,
		)
		;(0, vitest_1.expect)(mockAskApproval).toHaveBeenCalledWith(
			"tool",
			JSON.stringify({
				tool: "runSlashCommand",
				command: "init",
				args: undefined,
				source: "built-in",
				description: "Analyze codebase and create AGENTS.md",
			}),
		)
		;(0, vitest_1.expect)(mockPushToolResult).toHaveBeenCalledWith(`Command: /init
Description: Analyze codebase and create AGENTS.md
Source: built-in

--- Command Content ---

Initialize project content here`)
	})
	;(0, vitest_1.it)("should successfully execute command with arguments", async () => {
		const block = {
			type: "tool_use",
			name: "run_slash_command",
			params: {
				command: "test",
				args: "focus on unit tests",
			},
			partial: false,
		}
		const mockCommand = {
			name: "test",
			content: "Run tests with specific focus",
			source: "project",
			filePath: ".roo/commands/test.md",
			description: "Run project tests",
			argumentHint: "test type or focus area",
		}
		vitest_1.vi.mocked(commands_1.getCommand).mockResolvedValue(mockCommand)
		await (0, runSlashCommandTool_1.runSlashCommandTool)(
			mockTask,
			block,
			mockAskApproval,
			mockHandleError,
			mockPushToolResult,
			mockRemoveClosingTag,
		)
		;(0, vitest_1.expect)(mockPushToolResult).toHaveBeenCalledWith(`Command: /test
Description: Run project tests
Argument hint: test type or focus area
Provided arguments: focus on unit tests
Source: project

--- Command Content ---

Run tests with specific focus`)
	})
	;(0, vitest_1.it)("should handle global command", async () => {
		const block = {
			type: "tool_use",
			name: "run_slash_command",
			params: {
				command: "deploy",
			},
			partial: false,
		}
		const mockCommand = {
			name: "deploy",
			content: "Deploy application to production",
			source: "global",
			filePath: "~/.roo/commands/deploy.md",
		}
		vitest_1.vi.mocked(commands_1.getCommand).mockResolvedValue(mockCommand)
		await (0, runSlashCommandTool_1.runSlashCommandTool)(
			mockTask,
			block,
			mockAskApproval,
			mockHandleError,
			mockPushToolResult,
			mockRemoveClosingTag,
		)
		;(0, vitest_1.expect)(mockPushToolResult).toHaveBeenCalledWith(`Command: /deploy
Source: global

--- Command Content ---

Deploy application to production`)
	})
	;(0, vitest_1.it)("should handle partial block", async () => {
		const block = {
			type: "tool_use",
			name: "run_slash_command",
			params: {
				command: "init",
			},
			partial: true,
		}
		await (0, runSlashCommandTool_1.runSlashCommandTool)(
			mockTask,
			block,
			mockAskApproval,
			mockHandleError,
			mockPushToolResult,
			mockRemoveClosingTag,
		)
		;(0, vitest_1.expect)(mockTask.ask).toHaveBeenCalledWith(
			"tool",
			JSON.stringify({
				tool: "runSlashCommand",
				command: "init",
				args: "",
			}),
			true,
		)
		;(0, vitest_1.expect)(mockPushToolResult).not.toHaveBeenCalled()
	})
	;(0, vitest_1.it)("should handle errors during execution", async () => {
		const block = {
			type: "tool_use",
			name: "run_slash_command",
			params: {
				command: "init",
			},
			partial: false,
		}
		const error = new Error("Test error")
		vitest_1.vi.mocked(commands_1.getCommand).mockRejectedValue(error)
		await (0, runSlashCommandTool_1.runSlashCommandTool)(
			mockTask,
			block,
			mockAskApproval,
			mockHandleError,
			mockPushToolResult,
			mockRemoveClosingTag,
		)
		;(0, vitest_1.expect)(mockHandleError).toHaveBeenCalledWith("running slash command", error)
	})
	;(0, vitest_1.it)("should handle empty available commands list", async () => {
		const block = {
			type: "tool_use",
			name: "run_slash_command",
			params: {
				command: "nonexistent",
			},
			partial: false,
		}
		vitest_1.vi.mocked(commands_1.getCommand).mockResolvedValue(undefined)
		vitest_1.vi.mocked(commands_1.getCommandNames).mockResolvedValue([])
		await (0, runSlashCommandTool_1.runSlashCommandTool)(
			mockTask,
			block,
			mockAskApproval,
			mockHandleError,
			mockPushToolResult,
			mockRemoveClosingTag,
		)
		;(0, vitest_1.expect)(mockPushToolResult).toHaveBeenCalledWith(
			responses_1.formatResponse.toolError("Command 'nonexistent' not found. Available commands: (none)"),
		)
	})
	;(0, vitest_1.it)("should reset consecutive mistake count on valid command", async () => {
		const block = {
			type: "tool_use",
			name: "run_slash_command",
			params: {
				command: "init",
			},
			partial: false,
		}
		mockTask.consecutiveMistakeCount = 5
		const mockCommand = {
			name: "init",
			content: "Initialize project",
			source: "built-in",
			filePath: "<built-in:init>",
		}
		vitest_1.vi.mocked(commands_1.getCommand).mockResolvedValue(mockCommand)
		await (0, runSlashCommandTool_1.runSlashCommandTool)(
			mockTask,
			block,
			mockAskApproval,
			mockHandleError,
			mockPushToolResult,
			mockRemoveClosingTag,
		)
		;(0, vitest_1.expect)(mockTask.consecutiveMistakeCount).toBe(0)
	})
})
//# sourceMappingURL=runSlashCommandTool.spec.js.map
