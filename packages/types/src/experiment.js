"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.experimentsSchema = exports.experimentIdsSchema = exports.experimentIds = void 0
const zod_1 = require("zod")
/**
 * ExperimentId
 */
const kilocodeExperimentIds = ["morphFastApply"]
exports.experimentIds = [
	"powerSteering",
	"multiFileApplyDiff",
	"preventFocusDisruption",
	"imageGeneration",
	"runSlashCommand",
]
exports.experimentIdsSchema = zod_1.z.enum([...exports.experimentIds, ...kilocodeExperimentIds])
/**
 * Experiments
 */
exports.experimentsSchema = zod_1.z.object({
	morphFastApply: zod_1.z.boolean().optional(), // kilocode_change
	powerSteering: zod_1.z.boolean().optional(),
	multiFileApplyDiff: zod_1.z.boolean().optional(),
	preventFocusDisruption: zod_1.z.boolean().optional(),
	imageGeneration: zod_1.z.boolean().optional(),
	runSlashCommand: zod_1.z.boolean().optional(),
})
//# sourceMappingURL=experiment.js.map
