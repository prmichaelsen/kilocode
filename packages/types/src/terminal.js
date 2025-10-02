"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.commandExecutionStatusSchema = void 0
const zod_1 = require("zod")
/**
 * CommandExecutionStatus
 */
exports.commandExecutionStatusSchema = zod_1.z.discriminatedUnion("status", [
	zod_1.z.object({
		executionId: zod_1.z.string(),
		status: zod_1.z.literal("started"),
		pid: zod_1.z.number().optional(),
		command: zod_1.z.string(),
	}),
	zod_1.z.object({
		executionId: zod_1.z.string(),
		status: zod_1.z.literal("output"),
		output: zod_1.z.string(),
	}),
	zod_1.z.object({
		executionId: zod_1.z.string(),
		status: zod_1.z.literal("exited"),
		exitCode: zod_1.z.number().optional(),
	}),
	zod_1.z.object({
		executionId: zod_1.z.string(),
		status: zod_1.z.literal("fallback"),
	}),
	zod_1.z.object({
		executionId: zod_1.z.string(),
		status: zod_1.z.literal("timeout"),
	}),
])
//# sourceMappingURL=terminal.js.map
