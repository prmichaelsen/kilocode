"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.todoItemSchema = exports.todoStatusSchema = void 0
const zod_1 = require("zod")
/**
 * TodoStatus
 */
exports.todoStatusSchema = zod_1.z.enum(["pending", "in_progress", "completed"])
/**
 * TodoItem
 */
exports.todoItemSchema = zod_1.z.object({
	id: zod_1.z.string(),
	content: zod_1.z.string(),
	status: exports.todoStatusSchema,
})
//# sourceMappingURL=todo.js.map
