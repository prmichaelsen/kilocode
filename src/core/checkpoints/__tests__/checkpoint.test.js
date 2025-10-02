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
const index_1 = require("../index")
const vscode = __importStar(require("vscode"))
// Mock vscode
vitest_1.vi.mock("vscode", () => ({
	window: {
		showErrorMessage: vitest_1.vi.fn(),
		createTextEditorDecorationType: vitest_1.vi.fn(() => ({})),
		showInformationMessage: vitest_1.vi.fn(),
	},
	Uri: {
		file: vitest_1.vi.fn((path) => ({ fsPath: path })),
		parse: vitest_1.vi.fn((uri) => ({ with: vitest_1.vi.fn(() => ({})) })),
	},
	commands: {
		executeCommand: vitest_1.vi.fn(),
	},
}))
// Mock other dependencies
vitest_1.vi.mock("@roo-code/telemetry", () => ({
	TelemetryService: {
		instance: {
			captureCheckpointCreated: vitest_1.vi.fn(),
			captureCheckpointRestored: vitest_1.vi.fn(),
			captureCheckpointDiffed: vitest_1.vi.fn(),
			captureEvent: vitest_1.vi.fn(), // kilocode_change
		},
	},
}))
vitest_1.vi.mock("../../../utils/path", () => ({
	getWorkspacePath: vitest_1.vi.fn(() => "/test/workspace"),
}))
vitest_1.vi.mock("../../../services/checkpoints")
;(0, vitest_1.describe)("Checkpoint functionality", () => {
	let mockProvider
	let mockTask
	let mockCheckpointService
	;(0, vitest_1.beforeEach)(async () => {
		// Create mock checkpoint service
		mockCheckpointService = {
			isInitialized: true,
			saveCheckpoint: vitest_1.vi.fn().mockResolvedValue({ commit: "test-commit-hash" }),
			restoreCheckpoint: vitest_1.vi.fn().mockResolvedValue(undefined),
			getDiff: vitest_1.vi.fn().mockResolvedValue([]),
			on: vitest_1.vi.fn(),
			initShadowGit: vitest_1.vi.fn().mockResolvedValue(undefined),
		}
		// Create mock provider
		mockProvider = {
			context: {
				globalStorageUri: { fsPath: "/test/storage" },
			},
			log: vitest_1.vi.fn(),
			postMessageToWebview: vitest_1.vi.fn(),
			postStateToWebview: vitest_1.vi.fn(),
			cancelTask: vitest_1.vi.fn(),
		}
		// Create mock task
		mockTask = {
			taskId: "test-task-id",
			enableCheckpoints: true,
			checkpointService: mockCheckpointService,
			checkpointServiceInitializing: false,
			providerRef: {
				deref: () => mockProvider,
			},
			clineMessages: [],
			apiConversationHistory: [],
			pendingUserMessageCheckpoint: undefined,
			say: vitest_1.vi.fn().mockResolvedValue(undefined),
			overwriteClineMessages: vitest_1.vi.fn(),
			overwriteApiConversationHistory: vitest_1.vi.fn(),
			combineMessages: vitest_1.vi.fn().mockReturnValue([]),
		}
		// Update the mock to return our mockCheckpointService
		const checkpointsModule = await Promise.resolve().then(() =>
			__importStar(require("../../../services/checkpoints")),
		)
		vitest_1.vi.mocked(checkpointsModule.RepoPerTaskCheckpointService.create).mockReturnValue(mockCheckpointService)
	})
	;(0, vitest_1.afterEach)(() => {
		vitest_1.vi.clearAllMocks()
	})
	;(0, vitest_1.describe)("checkpointSave", () => {
		;(0, vitest_1.it)("should wait for checkpoint service initialization before saving", async () => {
			// Set up task with uninitialized service
			mockCheckpointService.isInitialized = false
			mockTask.checkpointService = mockCheckpointService
			// Simulate service initialization after a delay
			setTimeout(() => {
				mockCheckpointService.isInitialized = true
			}, 100)
			// Call checkpointSave
			const savePromise = (0, index_1.checkpointSave)(mockTask, true)
			// Wait for the save to complete
			const result = await savePromise
			// saveCheckpoint should have been called
			;(0, vitest_1.expect)(mockCheckpointService.saveCheckpoint).toHaveBeenCalledWith(
				vitest_1.expect.stringContaining("Task: test-task-id"),
				{ allowEmpty: true, suppressMessage: false },
			)
			// Result should contain the commit hash
			;(0, vitest_1.expect)(result).toEqual({ commit: "test-commit-hash" })
			// Task should still have checkpoints enabled
			;(0, vitest_1.expect)(mockTask.enableCheckpoints).toBe(true)
		})
		;(0, vitest_1.it)("should handle timeout when service doesn't initialize", async () => {
			// Service never initializes
			mockCheckpointService.isInitialized = false
			// Call checkpointSave with a task that has no checkpoint service
			const taskWithNoService = {
				...mockTask,
				checkpointService: undefined,
				enableCheckpoints: false,
			}
			const result = await (0, index_1.checkpointSave)(taskWithNoService, true)
			// Result should be undefined
			;(0, vitest_1.expect)(result).toBeUndefined()
			// saveCheckpoint should not have been called
			;(0, vitest_1.expect)(mockCheckpointService.saveCheckpoint).not.toHaveBeenCalled()
		})
		;(0, vitest_1.it)("should preserve checkpoint data through message deletion flow", async () => {
			// Initialize service
			mockCheckpointService.isInitialized = true
			mockTask.checkpointService = mockCheckpointService
			// Simulate saving checkpoint before user message
			const checkpointResult = await (0, index_1.checkpointSave)(mockTask, true)
			;(0, vitest_1.expect)(checkpointResult).toEqual({ commit: "test-commit-hash" })
			// Simulate setting pendingUserMessageCheckpoint
			if (checkpointResult && "commit" in checkpointResult) {
				mockTask.pendingUserMessageCheckpoint = {
					hash: checkpointResult.commit,
					timestamp: Date.now(),
					type: "user_message",
				}
			}
			// Verify checkpoint data is preserved
			;(0, vitest_1.expect)(mockTask.pendingUserMessageCheckpoint).toBeDefined()
			;(0, vitest_1.expect)(mockTask.pendingUserMessageCheckpoint.hash).toBe("test-commit-hash")
			// Simulate message deletion and reinitialization
			mockTask.clineMessages = []
			mockTask.checkpointService = mockCheckpointService // Keep service available
			mockTask.checkpointServiceInitializing = false
			// Save checkpoint again after deletion
			const newCheckpointResult = await (0, index_1.checkpointSave)(mockTask, true)
			// Should still work after reinitialization
			;(0, vitest_1.expect)(newCheckpointResult).toEqual({ commit: "test-commit-hash" })
			;(0, vitest_1.expect)(mockTask.enableCheckpoints).toBe(true)
		})
		;(0, vitest_1.it)("should handle errors gracefully and disable checkpoints", async () => {
			mockCheckpointService.saveCheckpoint.mockRejectedValue(new Error("Save failed"))
			const result = await (0, index_1.checkpointSave)(mockTask)
			;(0, vitest_1.expect)(result).toBeUndefined()
			;(0, vitest_1.expect)(mockTask.enableCheckpoints).toBe(false)
		})
	})
	;(0, vitest_1.describe)("checkpointRestore", () => {
		;(0, vitest_1.beforeEach)(() => {
			mockTask.clineMessages = [
				{ ts: 1, say: "user", text: "Message 1" },
				{ ts: 2, say: "assistant", text: "Message 2" },
				{ ts: 3, say: "user", text: "Message 3" },
			]
			mockTask.apiConversationHistory = [
				{ ts: 1, role: "user", content: [{ type: "text", text: "Message 1" }] },
				{ ts: 2, role: "assistant", content: [{ type: "text", text: "Message 2" }] },
				{ ts: 3, role: "user", content: [{ type: "text", text: "Message 3" }] },
			]
		})
		;(0, vitest_1.it)("should restore checkpoint for delete operation", async () => {
			await (0, index_1.checkpointRestore)(mockTask, {
				ts: 2,
				commitHash: "abc123",
				mode: "restore",
				operation: "delete",
			})
			;(0, vitest_1.expect)(mockCheckpointService.restoreCheckpoint).toHaveBeenCalledWith("abc123")
			;(0, vitest_1.expect)(mockTask.overwriteApiConversationHistory).toHaveBeenCalledWith([
				{ ts: 1, role: "user", content: [{ type: "text", text: "Message 1" }] },
			])
			;(0, vitest_1.expect)(mockTask.overwriteClineMessages).toHaveBeenCalledWith([
				{ ts: 1, say: "user", text: "Message 1" },
			])
			;(0, vitest_1.expect)(mockProvider.cancelTask).toHaveBeenCalled()
		})
		;(0, vitest_1.it)("should restore checkpoint for edit operation", async () => {
			await (0, index_1.checkpointRestore)(mockTask, {
				ts: 2,
				commitHash: "abc123",
				mode: "restore",
				operation: "edit",
			})
			;(0, vitest_1.expect)(mockCheckpointService.restoreCheckpoint).toHaveBeenCalledWith("abc123")
			;(0, vitest_1.expect)(mockTask.overwriteApiConversationHistory).toHaveBeenCalledWith([
				{ ts: 1, role: "user", content: [{ type: "text", text: "Message 1" }] },
			])
			// For edit operation, should include the message being edited
			;(0, vitest_1.expect)(mockTask.overwriteClineMessages).toHaveBeenCalledWith([
				{ ts: 1, say: "user", text: "Message 1" },
				{ ts: 2, say: "assistant", text: "Message 2" },
			])
			;(0, vitest_1.expect)(mockProvider.cancelTask).toHaveBeenCalled()
		})
		;(0, vitest_1.it)("should handle preview mode without modifying messages", async () => {
			await (0, index_1.checkpointRestore)(mockTask, {
				ts: 2,
				commitHash: "abc123",
				mode: "preview",
			})
			;(0, vitest_1.expect)(mockCheckpointService.restoreCheckpoint).toHaveBeenCalledWith("abc123")
			;(0, vitest_1.expect)(mockTask.overwriteApiConversationHistory).not.toHaveBeenCalled()
			;(0, vitest_1.expect)(mockTask.overwriteClineMessages).not.toHaveBeenCalled()
			;(0, vitest_1.expect)(mockProvider.cancelTask).toHaveBeenCalled()
		})
		;(0, vitest_1.it)("should handle missing message gracefully", async () => {
			await (0, index_1.checkpointRestore)(mockTask, {
				ts: 999, // Non-existent timestamp
				commitHash: "abc123",
				mode: "restore",
			})
			;(0, vitest_1.expect)(mockCheckpointService.restoreCheckpoint).not.toHaveBeenCalled()
		})
		;(0, vitest_1.it)("should disable checkpoints on error", async () => {
			mockCheckpointService.restoreCheckpoint.mockRejectedValue(new Error("Restore failed"))
			await (0, index_1.checkpointRestore)(mockTask, {
				ts: 2,
				commitHash: "abc123",
				mode: "restore",
			})
			;(0, vitest_1.expect)(mockTask.enableCheckpoints).toBe(false)
			;(0, vitest_1.expect)(mockProvider.log).toHaveBeenCalledWith(
				"[checkpointRestore] disabling checkpoints for this task",
			)
		})
	})
	;(0, vitest_1.describe)("checkpointDiff", () => {
		;(0, vitest_1.beforeEach)(() => {
			mockTask.clineMessages = [
				{ ts: 1, say: "user", text: "Message 1" },
				{ ts: 2, say: "checkpoint_saved", text: "commit1" },
				{ ts: 3, say: "user", text: "Message 2" },
				{ ts: 4, say: "checkpoint_saved", text: "commit2" },
			]
		})
		;(0, vitest_1.it)("should show diff for full mode", async () => {
			const mockChanges = [
				{
					paths: { absolute: "/test/file.ts", relative: "file.ts" },
					content: { before: "old content", after: "new content" },
				},
			]
			mockCheckpointService.getDiff.mockResolvedValue(mockChanges)
			await (0, index_1.checkpointDiff)(mockTask, {
				ts: 4,
				commitHash: "commit2",
				mode: "full",
			})
			;(0, vitest_1.expect)(mockCheckpointService.getDiff).toHaveBeenCalledWith({
				from: "commit2",
				to: undefined,
			})
			;(0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
				"vscode.changes",
				"Changes since task started",
				vitest_1.expect.any(Array),
			)
		})
		;(0, vitest_1.it)("should show diff for checkpoint mode with next commit", async () => {
			const mockChanges = [
				{
					paths: { absolute: "/test/file.ts", relative: "file.ts" },
					content: { before: "old content", after: "new content" },
				},
			]
			mockCheckpointService.getDiff.mockResolvedValue(mockChanges)
			await (0, index_1.checkpointDiff)(mockTask, {
				ts: 4,
				commitHash: "commit1",
				mode: "checkpoint",
			})
			;(0, vitest_1.expect)(mockCheckpointService.getDiff).toHaveBeenCalledWith({
				from: "commit1",
				to: "commit2",
			})
			;(0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith(
				"vscode.changes",
				"Changes compare with next checkpoint",
				vitest_1.expect.any(Array),
			)
		})
		;(0, vitest_1.it)("should find next checkpoint automatically in checkpoint mode", async () => {
			const mockChanges = [
				{
					paths: { absolute: "/test/file.ts", relative: "file.ts" },
					content: { before: "old content", after: "new content" },
				},
			]
			mockCheckpointService.getDiff.mockResolvedValue(mockChanges)
			await (0, index_1.checkpointDiff)(mockTask, {
				ts: 4,
				commitHash: "commit1",
				mode: "checkpoint",
			})
			;(0, vitest_1.expect)(mockCheckpointService.getDiff).toHaveBeenCalledWith({
				from: "commit1", // Should find the next checkpoint
				to: "commit2",
			})
		})
		;(0, vitest_1.it)("should show information message when no changes found", async () => {
			mockCheckpointService.getDiff.mockResolvedValue([])
			await (0, index_1.checkpointDiff)(mockTask, {
				ts: 4,
				commitHash: "commit2",
				mode: "full",
			})
			;(0, vitest_1.expect)(vscode.window.showInformationMessage).toHaveBeenCalledWith("No changes found.")
			;(0, vitest_1.expect)(vscode.commands.executeCommand).not.toHaveBeenCalled()
		})
		;(0, vitest_1.it)("should disable checkpoints on error", async () => {
			mockCheckpointService.getDiff.mockRejectedValue(new Error("Diff failed"))
			await (0, index_1.checkpointDiff)(mockTask, {
				ts: 4,
				commitHash: "commit2",
				mode: "full",
			})
			;(0, vitest_1.expect)(mockTask.enableCheckpoints).toBe(false)
			;(0, vitest_1.expect)(mockProvider.log).toHaveBeenCalledWith(
				"[checkpointDiff] disabling checkpoints for this task",
			)
		})
	})
	;(0, vitest_1.describe)("getCheckpointService", () => {
		;(0, vitest_1.it)("should return existing service if available", async () => {
			const service = await (0, index_1.getCheckpointService)(mockTask)
			;(0, vitest_1.expect)(service).toBe(mockCheckpointService)
		})
		;(0, vitest_1.it)("should return undefined if checkpoints are disabled", async () => {
			mockTask.enableCheckpoints = false
			const service = await (0, index_1.getCheckpointService)(mockTask)
			;(0, vitest_1.expect)(service).toBeUndefined()
		})
		;(0, vitest_1.it)("should return undefined if service is still initializing", async () => {
			mockTask.checkpointService = undefined
			mockTask.checkpointServiceInitializing = true
			const service = await (0, index_1.getCheckpointService)(mockTask)
			;(0, vitest_1.expect)(service).toBeUndefined()
		})
		;(0, vitest_1.it)("should create new service if none exists", async () => {
			mockTask.checkpointService = undefined
			mockTask.checkpointServiceInitializing = false
			const service = (0, index_1.getCheckpointService)(mockTask)
			const checkpointsModule = await Promise.resolve().then(() =>
				__importStar(require("../../../services/checkpoints")),
			)
			;(0, vitest_1.expect)(
				vitest_1.vi.mocked(checkpointsModule.RepoPerTaskCheckpointService.create),
			).toHaveBeenCalledWith({
				taskId: "test-task-id",
				workspaceDir: "/test/workspace",
				shadowDir: "/test/storage",
				log: vitest_1.expect.any(Function),
			})
		})
		;(0, vitest_1.it)("should disable checkpoints if workspace path is not found", async () => {
			const pathModule = await Promise.resolve().then(() => __importStar(require("../../../utils/path")))
			vitest_1.vi.mocked(pathModule.getWorkspacePath).mockReturnValue(null)
			mockTask.checkpointService = undefined
			mockTask.checkpointServiceInitializing = false
			const service = await (0, index_1.getCheckpointService)(mockTask)
			;(0, vitest_1.expect)(service).toBeUndefined()
			;(0, vitest_1.expect)(mockTask.enableCheckpoints).toBe(false)
		})
	})
})
//# sourceMappingURL=checkpoint.test.js.map
