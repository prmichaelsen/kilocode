"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.followUpDataSchema = exports.suggestionItemSchema = void 0
const zod_1 = require("zod")
/**
 * Zod schema for SuggestionItem
 */
exports.suggestionItemSchema = zod_1.z.object({
	answer: zod_1.z.string(),
	mode: zod_1.z.string().optional(),
})
/**
 * Zod schema for FollowUpData
 */
exports.followUpDataSchema = zod_1.z.object({
	question: zod_1.z.string().optional(),
	suggest: zod_1.z.array(exports.suggestionItemSchema).optional(),
})
//# sourceMappingURL=followup.js.map
