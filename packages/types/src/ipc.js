"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.ipcMessageSchema =
	exports.taskCommandSchema =
	exports.TaskCommandName =
	exports.ackSchema =
	exports.IpcOrigin =
	exports.IpcMessageType =
		void 0
const zod_1 = require("zod")
const events_js_1 = require("./events.js")
const global_settings_js_1 = require("./global-settings.js")
/**
 * IpcMessageType
 */
var IpcMessageType
;(function (IpcMessageType) {
	IpcMessageType["Connect"] = "Connect"
	IpcMessageType["Disconnect"] = "Disconnect"
	IpcMessageType["Ack"] = "Ack"
	IpcMessageType["TaskCommand"] = "TaskCommand"
	IpcMessageType["TaskEvent"] = "TaskEvent"
})(IpcMessageType || (exports.IpcMessageType = IpcMessageType = {}))
/**
 * IpcOrigin
 */
var IpcOrigin
;(function (IpcOrigin) {
	IpcOrigin["Client"] = "client"
	IpcOrigin["Server"] = "server"
})(IpcOrigin || (exports.IpcOrigin = IpcOrigin = {}))
/**
 * Ack
 */
exports.ackSchema = zod_1.z.object({
	clientId: zod_1.z.string(),
	pid: zod_1.z.number(),
	ppid: zod_1.z.number(),
})
/**
 * TaskCommandName
 */
var TaskCommandName
;(function (TaskCommandName) {
	TaskCommandName["StartNewTask"] = "StartNewTask"
	TaskCommandName["CancelTask"] = "CancelTask"
	TaskCommandName["CloseTask"] = "CloseTask"
	TaskCommandName["ResumeTask"] = "ResumeTask"
})(TaskCommandName || (exports.TaskCommandName = TaskCommandName = {}))
/**
 * TaskCommand
 */
exports.taskCommandSchema = zod_1.z.discriminatedUnion("commandName", [
	zod_1.z.object({
		commandName: zod_1.z.literal(TaskCommandName.StartNewTask),
		data: zod_1.z.object({
			configuration: global_settings_js_1.rooCodeSettingsSchema,
			text: zod_1.z.string(),
			images: zod_1.z.array(zod_1.z.string()).optional(),
			newTab: zod_1.z.boolean().optional(),
		}),
	}),
	zod_1.z.object({
		commandName: zod_1.z.literal(TaskCommandName.CancelTask),
		data: zod_1.z.string(),
	}),
	zod_1.z.object({
		commandName: zod_1.z.literal(TaskCommandName.CloseTask),
		data: zod_1.z.string(),
	}),
	zod_1.z.object({
		commandName: zod_1.z.literal(TaskCommandName.ResumeTask),
		data: zod_1.z.string(),
	}),
])
/**
 * IpcMessage
 */
exports.ipcMessageSchema = zod_1.z.discriminatedUnion("type", [
	zod_1.z.object({
		type: zod_1.z.literal(IpcMessageType.Ack),
		origin: zod_1.z.literal(IpcOrigin.Server),
		data: exports.ackSchema,
	}),
	zod_1.z.object({
		type: zod_1.z.literal(IpcMessageType.TaskCommand),
		origin: zod_1.z.literal(IpcOrigin.Client),
		clientId: zod_1.z.string(),
		data: exports.taskCommandSchema,
	}),
	zod_1.z.object({
		type: zod_1.z.literal(IpcMessageType.TaskEvent),
		origin: zod_1.z.literal(IpcOrigin.Server),
		relayClientId: zod_1.z.string().optional(),
		data: events_js_1.taskEventSchema,
	}),
])
//# sourceMappingURL=ipc.js.map
