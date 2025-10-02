"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.installMarketplaceItemOptionsSchema =
	exports.marketplaceItemSchema =
	exports.mcpMarketplaceItemSchema =
	exports.modeMarketplaceItemSchema =
	exports.marketplaceItemTypeSchema =
	exports.mcpInstallationMethodSchema =
	exports.mcpParameterSchema =
		void 0
const zod_1 = require("zod")
/**
 * Schema for MCP parameter definitions
 */
exports.mcpParameterSchema = zod_1.z.object({
	name: zod_1.z.string().min(1),
	key: zod_1.z.string().min(1),
	placeholder: zod_1.z.string().optional(),
	optional: zod_1.z.boolean().optional().default(false),
})
/**
 * Schema for MCP installation method with name
 */
exports.mcpInstallationMethodSchema = zod_1.z.object({
	name: zod_1.z.string().min(1),
	content: zod_1.z.string().min(1),
	parameters: zod_1.z.array(exports.mcpParameterSchema).optional(),
	prerequisites: zod_1.z.array(zod_1.z.string()).optional(),
})
/**
 * Component type validation
 */
exports.marketplaceItemTypeSchema = zod_1.z.enum(["mode", "mcp"])
/**
 * Base schema for common marketplace item fields
 */
const baseMarketplaceItemSchema = zod_1.z.object({
	id: zod_1.z.string().min(1),
	name: zod_1.z.string().min(1, "Name is required"),
	description: zod_1.z.string(),
	author: zod_1.z.string().optional(),
	authorUrl: zod_1.z.string().url("Author URL must be a valid URL").optional(),
	tags: zod_1.z.array(zod_1.z.string()).optional(),
	prerequisites: zod_1.z.array(zod_1.z.string()).optional(),
})
/**
 * Type-specific schemas for YAML parsing (without type field, added programmatically)
 */
exports.modeMarketplaceItemSchema = baseMarketplaceItemSchema.extend({
	content: zod_1.z.string().min(1), // YAML content for modes
})
exports.mcpMarketplaceItemSchema = baseMarketplaceItemSchema.extend({
	url: zod_1.z.string().url(), // Required url field
	content: zod_1.z.union([zod_1.z.string().min(1), zod_1.z.array(exports.mcpInstallationMethodSchema)]), // Single config or array of methods
	parameters: zod_1.z.array(exports.mcpParameterSchema).optional(),
})
/**
 * Unified marketplace item schema using discriminated union
 */
exports.marketplaceItemSchema = zod_1.z.discriminatedUnion("type", [
	// Mode marketplace item
	exports.modeMarketplaceItemSchema.extend({
		type: zod_1.z.literal("mode"),
	}),
	// MCP marketplace item
	exports.mcpMarketplaceItemSchema.extend({
		type: zod_1.z.literal("mcp"),
	}),
])
/**
 * Installation options for marketplace items
 */
exports.installMarketplaceItemOptionsSchema = zod_1.z.object({
	target: zod_1.z.enum(["global", "project"]).optional().default("project"),
	parameters: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
})
//# sourceMappingURL=marketplace.js.map
