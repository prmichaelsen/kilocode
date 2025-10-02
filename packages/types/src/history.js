"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.historyItemSchema = void 0
const zod_1 = require("zod")
/**
 * HistoryItem
 */
exports.historyItemSchema = zod_1.z.object({
	id: zod_1.z.string(),
	rootTaskId: zod_1.z.string().optional(),
	parentTaskId: zod_1.z.string().optional(),
	number: zod_1.z.number(),
	ts: zod_1.z.number(),
	task: zod_1.z.string(),
	tokensIn: zod_1.z.number(),
	tokensOut: zod_1.z.number(),
	cacheWrites: zod_1.z.number().optional(),
	cacheReads: zod_1.z.number().optional(),
	totalCost: zod_1.z.number(),
	size: zod_1.z.number().optional(),
	workspace: zod_1.z.string().optional(),
	isFavorited: zod_1.z.boolean().optional(), // kilocode_change
	fileNotfound: zod_1.z.boolean().optional(), // kilocode_change
	mode: zod_1.z.string().optional(),
})
//# sourceMappingURL=history.js.map
