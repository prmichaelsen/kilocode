"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.taskMetadataSchema = exports.TaskStatus = void 0
const zod_1 = require("zod")
const events_js_1 = require("./events.js")
var TaskStatus
;(function (TaskStatus) {
	TaskStatus["Running"] = "running"
	TaskStatus["Interactive"] = "interactive"
	TaskStatus["Resumable"] = "resumable"
	TaskStatus["Idle"] = "idle"
	TaskStatus["None"] = "none"
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}))
exports.taskMetadataSchema = zod_1.z.object({
	task: zod_1.z.string().optional(),
	images: zod_1.z.array(zod_1.z.string()).optional(),
})
//# sourceMappingURL=task.js.map
