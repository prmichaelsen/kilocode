"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
// kilocode_change: file added
const vitest_1 = require("vitest")
const codebaseSearchTool_1 = require("../codebaseSearchTool")
const responses_1 = require("../../prompts/responses")
const manager_1 = require("../../../services/code-index/manager")
vitest_1.vi.mock("../../../services/code-index/manager", () => ({
	CodeIndexManager: {
		getInstance: vitest_1.vi.fn(),
	},
}))
;(0, vitest_1.describe)("codebaseSearchTool", () => {
	let mockTask
	let askApproval
	let handleError
	let pushToolResult
	let removeClosingTag
	;(0, vitest_1.beforeEach)(() => {
		vitest_1.vi.clearAllMocks()
		mockTask = {
			cwd: "/repo",
			consecutiveMistakeCount: 0,
			say: vitest_1.vi.fn().mockResolvedValue(undefined),
			ask: vitest_1.vi.fn(),
			sayAndCreateMissingParamError: vitest_1.vi.fn(),
			providerRef: {
				deref: vitest_1.vi.fn().mockReturnValue({ context: {} }),
			},
		}
		askApproval = vitest_1.vi.fn().mockResolvedValue(true)
		handleError = vitest_1.vi.fn()
		pushToolResult = vitest_1.vi.fn()
		removeClosingTag = vitest_1.vi.fn((_, text) => text || "")
	})
	;(0, vitest_1.it)("returns a friendly message when indexing is still in progress", async () => {
		const managerMock = {
			isFeatureEnabled: true,
			isFeatureConfigured: true,
			getCurrentStatus: vitest_1.vi.fn().mockReturnValue({
				systemStatus: "Indexing",
				message: "Processing files",
				processedItems: 10,
				totalItems: 100,
				currentItemUnit: "files",
			}),
			searchIndex: vitest_1.vi.fn(),
		}
		vitest_1.vi.mocked(manager_1.CodeIndexManager.getInstance).mockReturnValue(managerMock)
		const block = {
			type: "tool_use",
			name: "codebase_search",
			params: { query: "example" },
			partial: false,
		}
		await (0, codebaseSearchTool_1.codebaseSearchTool)(
			mockTask,
			block,
			askApproval,
			handleError,
			pushToolResult,
			removeClosingTag,
		)
		;(0, vitest_1.expect)(managerMock.searchIndex).not.toHaveBeenCalled()
		;(0, vitest_1.expect)(pushToolResult).toHaveBeenCalledTimes(1)
		const pushedMessage = pushToolResult.mock.calls[0][0]
		;(0, vitest_1.expect)(pushedMessage).toBe(
			responses_1.formatResponse.toolError(
				"Processing files (Progress: 10/100 files). Semantic search is unavailable until indexing completes. Please try again later.",
			),
		)
		;(0, vitest_1.expect)(mockTask.say).toHaveBeenCalledTimes(1)
		const sayMock = mockTask.say
		const sayCall = sayMock.mock.calls[0]
		;(0, vitest_1.expect)(sayCall[0]).toBe("codebase_search_result")
		const payload = JSON.parse(sayCall[1])
		;(0, vitest_1.expect)(payload).toEqual({
			tool: "codebaseSearch",
			content: {
				query: "example",
				results: [],
				status: {
					systemStatus: "Indexing",
					message: "Processing files",
					processedItems: 10,
					totalItems: 100,
					currentItemUnit: "files",
				},
			},
		})
	})
})
//# sourceMappingURL=codebaseSearchTool.spec.js.map
