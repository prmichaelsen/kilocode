"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.mcpExecutionStatusSchema = void 0
const zod_1 = require("zod")
/**
 * McpExecutionStatus
 */
exports.mcpExecutionStatusSchema = zod_1.z.discriminatedUnion("status", [
	zod_1.z.object({
		executionId: zod_1.z.string(),
		status: zod_1.z.literal("started"),
		serverName: zod_1.z.string(),
		toolName: zod_1.z.string(),
	}),
	zod_1.z.object({
		executionId: zod_1.z.string(),
		status: zod_1.z.literal("output"),
		response: zod_1.z.string(),
	}),
	zod_1.z.object({
		executionId: zod_1.z.string(),
		status: zod_1.z.literal("completed"),
		response: zod_1.z.string().optional(),
	}),
	zod_1.z.object({
		executionId: zod_1.z.string(),
		status: zod_1.z.literal("error"),
		error: zod_1.z.string().optional(),
	}),
])
//# sourceMappingURL=mcp.js.map
