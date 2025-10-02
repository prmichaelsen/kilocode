"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.fastApplyModelSchema =
	exports.kiloCodeMetaDataSchema =
	exports.commitRangeSchema =
	exports.ghostServiceSettingsSchema =
		void 0
const zod_1 = require("zod")
exports.ghostServiceSettingsSchema = zod_1.z
	.object({
		enableAutoTrigger: zod_1.z.boolean().optional(),
		autoTriggerDelay: zod_1.z.number().min(1).max(30).default(3).optional(),
		enableQuickInlineTaskKeybinding: zod_1.z.boolean().optional(),
		enableSmartInlineTaskKeybinding: zod_1.z.boolean().optional(),
		enableCustomProvider: zod_1.z.boolean().optional(),
		apiConfigId: zod_1.z.string().optional(),
		showGutterAnimation: zod_1.z.boolean().optional(),
	})
	.optional()
exports.commitRangeSchema = zod_1.z.object({
	from: zod_1.z.string(),
	to: zod_1.z.string(),
})
exports.kiloCodeMetaDataSchema = zod_1.z.object({
	commitRange: exports.commitRangeSchema.optional(),
})
exports.fastApplyModelSchema = zod_1.z.enum([
	"auto",
	"morph/morph-v3-fast",
	"morph/morph-v3-large",
	"relace/relace-apply-3",
])
//# sourceMappingURL=kilocode.js.map
