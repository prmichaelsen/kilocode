"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const ipc_js_1 = require("../ipc.js")
describe("IPC Types", () => {
	describe("TaskCommandName", () => {
		it("should include ResumeTask command", () => {
			expect(ipc_js_1.TaskCommandName.ResumeTask).toBe("ResumeTask")
		})
		it("should have all expected task commands", () => {
			const expectedCommands = ["StartNewTask", "CancelTask", "CloseTask", "ResumeTask"]
			const actualCommands = Object.values(ipc_js_1.TaskCommandName)
			expectedCommands.forEach((command) => {
				expect(actualCommands).toContain(command)
			})
		})
		describe("Error Handling", () => {
			it("should handle ResumeTask command gracefully when task not found", () => {
				// This test verifies the schema validation - the actual error handling
				// for invalid task IDs is tested at the API level, not the schema level
				const resumeTaskCommand = {
					commandName: ipc_js_1.TaskCommandName.ResumeTask,
					data: "non-existent-task-id",
				}
				const result = ipc_js_1.taskCommandSchema.safeParse(resumeTaskCommand)
				expect(result.success).toBe(true)
				if (result.success) {
					expect(result.data.commandName).toBe("ResumeTask")
					expect(result.data.data).toBe("non-existent-task-id")
				}
			})
		})
	})
	describe("taskCommandSchema", () => {
		it("should validate ResumeTask command with taskId", () => {
			const resumeTaskCommand = {
				commandName: ipc_js_1.TaskCommandName.ResumeTask,
				data: "task-123",
			}
			const result = ipc_js_1.taskCommandSchema.safeParse(resumeTaskCommand)
			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.commandName).toBe("ResumeTask")
				expect(result.data.data).toBe("task-123")
			}
		})
		it("should reject ResumeTask command with invalid data", () => {
			const invalidCommand = {
				commandName: ipc_js_1.TaskCommandName.ResumeTask,
				data: 123, // Should be string
			}
			const result = ipc_js_1.taskCommandSchema.safeParse(invalidCommand)
			expect(result.success).toBe(false)
		})
		it("should reject ResumeTask command without data", () => {
			const invalidCommand = {
				commandName: ipc_js_1.TaskCommandName.ResumeTask,
				// Missing data field
			}
			const result = ipc_js_1.taskCommandSchema.safeParse(invalidCommand)
			expect(result.success).toBe(false)
		})
	})
})
//# sourceMappingURL=ipc.test.js.map
